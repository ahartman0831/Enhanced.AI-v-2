import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's comprehensive health data
    const [profile, protocols, bloodwork, symptoms] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('enhanced_protocols').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('bloodwork_reports').select('*').eq('user_id', user.id).order('report_date', { ascending: false }).limit(3),
      supabase.from('photo_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
    ])

    // Load telehealth prep prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'telehealth_prep_prompt.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load telehealth prep template' },
        { status: 500 }
      )
    }

    // Prepare comprehensive health data
    const healthData = {
      profile: profile.data || null,
      recentProtocols: protocols.data || [],
      recentBloodwork: bloodwork.data || [],
      recentSymptoms: symptoms.data || [],
      userEmail: user.email
    }

    // Fill in the prompt template
    const filledPrompt = promptTemplate
      .replace('[Patient Name/Anonymous]', user.email?.split('@')[0] || 'Anonymous Patient')
      .replace('[Current Date]', new Date().toISOString().split('T')[0])

    // Add health data context
    const fullPrompt = `${filledPrompt}

## Patient Health Data Summary

### Profile Information:
${JSON.stringify(healthData.profile, null, 2)}

### Recent Protocols:
${JSON.stringify(healthData.recentProtocols, null, 2)}

### Recent Bloodwork:
${JSON.stringify(healthData.recentBloodwork, null, 2)}

### Recent Photo Reports (Symptoms/Progress):
${JSON.stringify(healthData.recentSymptoms, null, 2)}

Please format this information into a professional telehealth referral package suitable for healthcare provider review.`

    // Call Grok API for referral package generation
    const grokResult = await callGrok({
      prompt: fullPrompt,
      userId: user.id,
      feature: 'telehealth-referral'
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate referral package' },
        { status: 500 }
      )
    }

    // Save referral package to enhanced_protocols (as a special referral document)
    const { data: referralDoc, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: {
          analysisType: 'telehealth-referral',
          referralPackage: grokResult.data,
          generatedAt: new Date().toISOString(),
          healthDataSummary: healthData
        },
        nutrition_impact: null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving referral document:', dbError)
      // Don't fail if DB save fails
    }

    // Return the referral package
    return NextResponse.json({
      success: true,
      data: grokResult.data,
      documentId: referralDoc?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Telehealth referral API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}