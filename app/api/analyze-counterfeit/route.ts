import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { imageUrl, imageDataUrls, productInfo, productType } = body

    // Support both array of base64 data URLs and legacy single imageUrl
    const images: string[] = Array.isArray(imageDataUrls) && imageDataUrls.length > 0
      ? imageDataUrls.filter((u: unknown) => typeof u === 'string' && u.startsWith('data:'))
      : imageUrl ? [imageUrl] : []

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'At least one product image is required' },
        { status: 400 }
      )
    }

    // Load counterfeit analysis prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'counterfeit_prompt.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load counterfeit analysis template' },
        { status: 500 }
      )
    }

    // Prepare the analysis prompt
    const analysisPrompt = `${promptTemplate}

## Product Information
Product Type: ${productType || 'Not specified'}
Additional Info: ${productInfo || 'No additional information provided'}
Images provided: ${images.length} photo(s)

Please analyze the product images for authenticity indicators and provide the educational analysis in the specified JSON format.`

    // Call Grok API for counterfeit analysis
    const grokResult = await callGrok({
      prompt: analysisPrompt,
      userId: user.id,
      feature: 'counterfeit-analysis',
      imageUrls: images
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to analyze product' },
        { status: 500 }
      )
    }

    // Save analysis result (we could create a counterfeit_reports table later)
    // For now, we'll save to enhanced_protocols as a special analysis
    const { data: analysisRecord, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: {
          analysisType: 'counterfeit-analysis',
          productType: productType,
          productInfo: productInfo,
          imageCount: images.length,
          analysis: grokResult.data
        },
        nutrition_impact: null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving counterfeit analysis:', dbError)
      // Don't fail if DB save fails
    }

    // Return the analysis result
    return NextResponse.json({
      success: true,
      data: grokResult.data,
      analysisId: analysisRecord?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Counterfeit analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}