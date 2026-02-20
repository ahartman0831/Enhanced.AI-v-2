import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import { scrapeProductPage } from '@/lib/url-scraper'
import {
  computeCacheKey,
  getCachedAnalysis,
  saveAnalysis,
  incrementCacheHit,
  logLookup,
  getInputSummary,
  getProductNameFromResponse,
  type SupplementInputType,
} from '@/lib/supplement-cache'
import fs from 'fs'
import path from 'path'

async function getGrokContext(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const [protocolResult, bloodworkResult, sideEffectsResult, profileResult] = await Promise.all([
    supabase.from('enhanced_protocols').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('bloodwork_reports').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('side_effect_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('*').eq('id', userId).single(),
  ])
  return {
    stack_data: protocolResult.data ? JSON.stringify(protocolResult.data) : 'No protocol data available',
    bloodwork_data: bloodworkResult.data ? JSON.stringify(bloodworkResult.data) : 'No bloodwork data available',
    side_effect_data: sideEffectsResult.data ? JSON.stringify(sideEffectsResult.data) : 'No side effect data available',
    goals_data: profileResult.data ? JSON.stringify(profileResult.data) : 'No profile data available',
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    let supplementInput = (body?.supplementInput ?? body?.barcode ?? '').toString().trim()
    const imageDataUrl = (body?.imageDataUrl ?? body?.imageUrl ?? '').toString().trim()
    const productUrlInput = (body?.productUrl ?? body?.url ?? '').toString().trim()
    const explicitBarcode = (body?.barcode ?? '').toString().trim()

    // If productUrl provided, fetch and extract content first
    if (productUrlInput && !supplementInput && !imageDataUrl.startsWith('data:')) {
      const scrapeResult = await scrapeProductPage(productUrlInput)
      if (!scrapeResult.success) {
        return NextResponse.json(
          { error: scrapeResult.error || 'Failed to fetch product page' },
          { status: 400 }
        )
      }
      supplementInput = `Product page content from ${productUrlInput}:\n\n${scrapeResult.extractedText}`
    }

    const hasImage = imageDataUrl.startsWith('data:')
    const hasText = supplementInput.length > 0

    if (!hasImage && !hasText) {
      return NextResponse.json({ error: 'supplementInput, barcode, imageDataUrl, or productUrl required' }, { status: 400 })
    }

    // Derive cache params for lookup/save
    let inputType: SupplementInputType
    let cacheInputValue: string
    let barcode: string | null = null
    let productUrl: string | null = null

    if (hasImage) {
      inputType = 'image'
      cacheInputValue = imageDataUrl
    } else if (productUrlInput) {
      inputType = 'url'
      cacheInputValue = productUrlInput
      productUrl = productUrlInput
    } else if (explicitBarcode) {
      inputType = 'barcode'
      cacheInputValue = explicitBarcode.replace(/\D/g, '') || explicitBarcode
      barcode = cacheInputValue
    } else {
      const barcodeMatch = supplementInput.match(/UPC\/Barcode:\s*([0-9]+)/i)
      if (barcodeMatch) {
        inputType = 'barcode'
        cacheInputValue = barcodeMatch[1]
        barcode = barcodeMatch[1]
      } else {
        inputType = 'text'
        cacheInputValue = supplementInput
      }
    }

    const cacheKey = computeCacheKey({
      userId: user.id,
      inputType,
      inputValue: cacheInputValue,
      barcode,
      productUrl,
    })

    // Check cache first
    const cached = await getCachedAnalysis(supabase, user.id, cacheKey)
    if (cached) {
      await incrementCacheHit(supabase, cached.id)
      const productName = getProductNameFromResponse(cached.response_json as Record<string, unknown>)
      await logLookup(supabase, {
        userId: user.id,
        analysisId: cached.id,
        inputType,
        inputSummary: getInputSummary(inputType, cacheInputValue, barcode, productUrl),
        barcode,
        productUrl,
        productName,
        wasCacheHit: true,
      })
      return NextResponse.json(cached.response_json)
    }

    const data = await getGrokContext(supabase, user.id)

    let prompt: string
    const images: string[] = []

    if (hasImage) {
      images.push(imageDataUrl)
      const promptPath = path.join(process.cwd(), 'prompts', 'supplement_analyzer_image_prompt.txt')
      const promptTemplate = fs.readFileSync(promptPath, 'utf8')
      prompt = promptTemplate
        .replace('{stack_data}', data.stack_data)
        .replace('{bloodwork_data}', data.bloodwork_data)
        .replace('{side_effect_data}', data.side_effect_data)
        .replace('{goals_data}', data.goals_data)
      if (hasText) {
        prompt += `\n\nAdditional context from user: ${supplementInput}`
      }
    } else {
      const promptPath = path.join(process.cwd(), 'prompts', 'supplement_analyzer_input_prompt.txt')
      const promptTemplate = fs.readFileSync(promptPath, 'utf8')
      prompt = promptTemplate
        .replace('{stack_data}', data.stack_data)
        .replace('{bloodwork_data}', data.bloodwork_data)
        .replace('{side_effect_data}', data.side_effect_data)
        .replace('{goals_data}', data.goals_data)
        .replace('{supplement_input}', supplementInput)
    }

    const grokResult = await callGrok({
      prompt,
      userId: user.id,
      feature: 'supplement-analyzer',
      route: '/api/supplement-analyzer',
      query: hasText ? supplementInput.slice(0, 500) : 'image analysis',
      imageUrls: images,
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to analyze supplement', flags: grokResult._complianceFlags },
        { status }
      )
    }

    const responseData = grokResult.data as Record<string, unknown>
    const productName = getProductNameFromResponse(responseData)
    const inputSummary = getInputSummary(inputType, cacheInputValue, barcode, productUrl)

    const analysisId = await saveAnalysis(supabase, {
      userId: user.id,
      cacheKey,
      inputType,
      inputSummary,
      barcode,
      productUrl,
      responseJson: responseData,
      productName,
    })

    await logLookup(supabase, {
      userId: user.id,
      analysisId,
      inputType,
      inputSummary,
      barcode,
      productUrl,
      productName,
      wasCacheHit: false,
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Supplement analyzer POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await getGrokContext(supabase, user.id)

    // Load prompt
    const promptPath = path.join(process.cwd(), 'prompts', 'supplement_analyzer_prompt.txt')
    const prompt = fs.readFileSync(promptPath, 'utf8')

    const grokPrompt = prompt
      .replace('{stack_data}', data.stack_data)
      .replace('{bloodwork_data}', data.bloodwork_data)
      .replace('{side_effect_data}', data.side_effect_data)
      .replace('{goals_data}', data.goals_data)

    const grokResult = await callGrok({
      prompt: grokPrompt,
      userId: user.id,
      feature: 'supplement-analyzer'
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json({ error: grokResult.error || 'Failed to generate supplement recommendations', flags: grokResult._complianceFlags }, { status })
    }

    return NextResponse.json(grokResult.data)

  } catch (error) {
    console.error('Supplement analyzer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}