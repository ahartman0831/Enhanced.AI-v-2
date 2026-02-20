import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import { callGrok } from '@/lib/grok'
import { validateBloodworkAnalysis } from '@/lib/bloodwork-schema'
import { computeBloodworkContext } from '@/lib/bloodwork-context'
import { detectFlaggedMitigationHints } from '@/lib/bloodwork-mitigations'
import fs from 'fs'
import path from 'path'

/** Parse various date formats to YYYY-MM-DD. Returns null if unparseable. */
function parseTestDate(val: string | undefined): string | null {
  if (!val || typeof val !== 'string') return null
  const s = val.trim()
  if (!s || s.toLowerCase() === 'not specified' || s.toLowerCase() === 'recent') return null
  // Already YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  // MM/DD/YYYY or MM-DD-YYYY
  const us = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (us) {
    const [, m, d, y] = us
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // DD/MM/YYYY (less common in US labs)
  const eu = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (eu) {
    const [, d, m, y] = eu
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Try Date.parse for other formats
  const parsed = Date.parse(s)
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed)
    return d.toISOString().split('T')[0]
  }
  return null
}

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

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'elite')
    if (!gate.allowed) {
      return gate.response
    }

    const contentType = request.headers.get('content-type') || ''
    let bloodworkData: Record<string, unknown> | null = null
    let testDate: string | undefined
    let source: string | undefined
    let imageDataUrls: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      testDate = (formData.get('testDate') as string) || undefined
      source = (formData.get('source') as string) || undefined
      const bloodworkDataStr = formData.get('bloodworkData') as string | null
      if (bloodworkDataStr) {
        try {
          bloodworkData = JSON.parse(bloodworkDataStr) as Record<string, unknown>
        } catch {
          bloodworkData = null
        }
      }
      // Collect image data URLs from form (client sends base64)
      const images = formData.getAll('images') as string[]
      imageDataUrls = images.filter((s): s is string => typeof s === 'string' && s.startsWith('data:'))
    } else {
      const body = await request.json()
      bloodworkData = body.bloodworkData ?? null
      testDate = body.testDate
      source = body.source
      imageDataUrls = Array.isArray(body.imageDataUrls) ? body.imageDataUrls : []
    }

    const hasImages = imageDataUrls.length > 0
    const hasStructuredData = bloodworkData && Object.keys(bloodworkData).length > 0

    if (!hasImages && !hasStructuredData) {
      return NextResponse.json(
        { error: 'Bloodwork data or images are required' },
        { status: 400 }
      )
    }

    // Fetch compound/profile context for observational cross-reference
    const bloodworkContext = await computeBloodworkContext(user.id)

    // Load bloodwork parser prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'bloodwork_parser.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load bloodwork analysis template' },
        { status: 500 }
      )
    }

    const contextBlock: string[] = []
    if (bloodworkContext.compoundContext) {
      contextBlock.push(`**Compound/Stack Context:** ${bloodworkContext.compoundContext}`)
    }
    if (bloodworkContext.userProfileContext) {
      contextBlock.push(`**User Profile:** ${bloodworkContext.userProfileContext}`)
    }
    const mitigationHints = hasStructuredData ? detectFlaggedMitigationHints(bloodworkData) : []
    if (mitigationHints.length > 0) {
      contextBlock.push(`**Flagged markers (preliminary):** Include mitigationObservations for: ${mitigationHints.join(', ')}. Use the Mitigation & Risk Mapping Table.`)
    }
    const contextSection = contextBlock.length > 0
      ? `\n## Additional Context for This Request\n${contextBlock.join('\n')}\n`
      : ''

    let analysisPrompt: string
    if (hasImages) {
      analysisPrompt = `${promptTemplate}${contextSection}

## User Bloodwork Images (Vision Mode)
The user has provided ${imageDataUrls.length} image(s) of their bloodwork results (photos or PDF pages).
Test Date: ${testDate || 'Not specified'}
Source: ${source || 'User provided'}

Extract ALL blood test markers, values, reference ranges, and units from the images. Then provide the full educational analysis in the exact JSON format specified above.`
      if (hasStructuredData) {
        analysisPrompt += `\n\nAdditional structured data provided: ${JSON.stringify(bloodworkData, null, 2)}`
      }
    } else {
      analysisPrompt = `${promptTemplate}${contextSection}

## User Bloodwork Data
Test Date: ${testDate || 'Not specified'}
Source: ${source || 'User provided'}
Data: ${JSON.stringify(bloodworkData, null, 2)}

Please analyze this bloodwork data and provide the educational analysis in the specified JSON format.`
    }

    // Call Grok API - use vision (grok-4-1-fast-reasoning) when images provided
    const grokResult = await callGrok({
      prompt: analysisPrompt,
      userId: user.id,
      feature: 'bloodwork-analysis',
      imageUrls: hasImages ? imageDataUrls : []
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to analyze bloodwork', flags: grokResult._complianceFlags },
        { status }
      )
    }

    // Validate and normalize response structure
    const validation = validateBloodworkAnalysis(grokResult.data)
    if (!validation.success) {
      console.warn('[Bloodwork] Validation failed:', validation.error)
      return NextResponse.json(
        { error: validation.error || 'Invalid analysis response' },
        { status: 500 }
      )
    }
    const validatedData = validation.data!

    // Parse extracted metadata and analysisSummary for test date (prefer extracted from uploads)
    const meta = (validatedData as Record<string, unknown>).extractedMetadata as Record<string, unknown> | undefined
    const summary = validatedData.analysisSummary as { testDate?: string } | undefined
    const extractedTestDate = parseTestDate(
      (meta?.test_date as string) || summary?.testDate
    )
    const extractedLab = meta?.lab_source && typeof meta.lab_source === 'string' ? (meta.lab_source as string).trim() : null
    const extractedLocation = meta?.location && typeof meta.location === 'string' ? (meta.location as string).trim() : null
    const otherMeta: Record<string, unknown> = {}
    if (meta && typeof meta === 'object') {
      const skip = new Set(['test_date', 'lab_source', 'location'])
      for (const [k, v] of Object.entries(meta)) {
        if (!skip.has(k) && v != null) otherMeta[k] = v
      }
    }

    // report_date: prefer extracted, then user input, then today
    const reportDate = extractedTestDate || testDate || new Date().toISOString().split('T')[0]
    const labSource = extractedLab || source || null

    // Save bloodwork report to database (prefer validated analysis for markerAnalysis/graphing)
    const { data: bloodworkReport, error: dbError } = await supabase
      .from('bloodwork_reports')
      .insert({
        user_id: user.id,
        report_date: reportDate,
        raw_json: validatedData || bloodworkData || {},
        flags: validatedData.flags || [],
        projection: validatedData.projections || {},
        lab_source: labSource,
        location: extractedLocation,
        other_metadata: Object.keys(otherMeta).length > 0 ? otherMeta : null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving bloodwork report:', dbError)
      // Don't fail if DB save fails
    }

    // Merge saved metadata into response for frontend display (when Grok didn't return extractedMetadata)
    const hasExtractedMeta = (validatedData as Record<string, unknown>).extractedMetadata
    const dataToReturn = hasExtractedMeta
      ? validatedData
      : {
          ...validatedData,
          extractedMetadata: {
            test_date: reportDate,
            lab_source: labSource || undefined,
            location: extractedLocation || undefined,
          },
        }

    return NextResponse.json({
      success: true,
      data: dataToReturn,
      reportId: bloodworkReport?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Bloodwork analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}