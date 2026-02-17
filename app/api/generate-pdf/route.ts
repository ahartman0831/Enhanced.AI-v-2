import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'
import { PDFDocument, rgb } from 'pdf-lib'

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

    // Parse request body
    const body = await request.json()
    const { analysisType, patientData } = body

    if (!analysisType || !patientData) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisType and patientData' },
        { status: 400 }
      )
    }

    // Load telehealth prep prompt
    const promptPath = path.join(process.cwd(), 'prompts', 'telehealth_prep_prompt.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading telehealth prep template:', error)
      return NextResponse.json(
        { error: 'Failed to load telehealth prep template' },
        { status: 500 }
      )
    }

    // Prepare the analysis data for formatting
    const analysisData = {
      reportType: analysisType,
      patientName: patientData.name || 'Patient Analysis',
      reportId: patientData.id || `report-${Date.now()}`,
      analysisDate: new Date().toISOString().split('T')[0],
      analysis: patientData.analysis
    }

    // Fill in the prompt template
    const filledPrompt = promptTemplate
      .replace('[Patient Name/Anonymous]', patientData.name || 'Anonymous Patient')
      .replace('[Current Date]', analysisData.analysisDate)

    // Get user's health data for comprehensive report
    const [profileResult, protocolResult, bloodworkResult, sideEffectsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('enhanced_protocols').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('bloodwork_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('side_effect_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    ])

    const healthData = {
      profile: profileResult.data || {},
      protocol: protocolResult.data || {},
      bloodwork: bloodworkResult.data || {},
      sideEffects: sideEffectsResult.data || [],
      analysisType,
      analysisData: patientData.analysis || {}
    }

    // Call Grok to format the telehealth referral package
    const grokResult = await callGrok({
      prompt: filledPrompt + '\n\nComprehensive Health Data:\n' + JSON.stringify(healthData, null, 2),
      userId: user.id,
      feature: 'doctor-pdf'
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to format medical summary' },
        { status: 500 }
      )
    }

    // Generate PDF from the formatted text
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()

    // Add watermark background
    page.drawText('EDUCATIONAL PURPOSES ONLY', {
      x: width / 2 - 150,
      y: height / 2,
      size: 60,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.3,
      rotate: Math.PI / 6 // 30 degrees rotation
    })

    page.drawText('NOT MEDICAL ADVICE', {
      x: width / 2 - 120,
      y: height / 2 + 100,
      size: 40,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.2,
      rotate: Math.PI / 6
    })

    // Add header
    page.drawText('Enhanced AI v2 - Educational Medical Summary', {
      x: 50,
      y: height - 50,
      size: 16,
      color: rgb(0, 0, 0)
    })

    // Add disclaimer header
    page.drawText('⚠️ EDUCATIONAL ANALYSIS ONLY - NOT MEDICAL ADVICE', {
      x: 50,
      y: height - 80,
      size: 12,
      color: rgb(0.8, 0, 0)
    })

    page.drawText(`Report Type: ${analysisType}`, {
      x: 50,
      y: height - 110,
      size: 12,
      color: rgb(0, 0, 0)
    })

    page.drawText(`Analysis For: ${patientData.name}`, {
      x: 50,
      y: height - 130,
      size: 12,
      color: rgb(0, 0, 0)
    })

    page.drawText(`Generated: ${analysisData.analysisDate}`, {
      x: 50,
      y: height - 150,
      size: 12,
      color: rgb(0, 0, 0)
    })

    // Add main content
    const contentText = typeof grokResult.data === 'string'
      ? grokResult.data
      : JSON.stringify(grokResult.data, null, 2)

    const lines = contentText.split('\n')
    let yPosition = height - 180
    const fontSize = 10

    for (const line of lines.slice(0, 80)) { // Limit lines to fit on page
      if (yPosition < 120) break // Leave room for footer

      // Wrap long lines
      const maxCharsPerLine = 80
      if (line.length > maxCharsPerLine) {
        const wrappedLines = line.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) || [line]
        for (const wrappedLine of wrappedLines) {
          if (yPosition < 120) break
          page.drawText(wrappedLine, {
            x: 50,
            y: yPosition,
            size: fontSize,
            color: rgb(0, 0, 0)
          })
          yPosition -= 12
        }
      } else {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0)
        })
        yPosition -= 12
      }
    }

    // Add comprehensive disclaimer footer
    const disclaimerY = 100
    page.drawText('IMPORTANT MEDICAL DISCLAIMER:', {
      x: 50,
      y: disclaimerY,
      size: 10,
      color: rgb(0.8, 0, 0)
    })

    page.drawText('• This document contains EDUCATIONAL information only', {
      x: 50,
      y: disclaimerY - 15,
      size: 8,
      color: rgb(0.5, 0, 0)
    })

    page.drawText('• NOT medical advice, diagnosis, or treatment recommendations', {
      x: 50,
      y: disclaimerY - 27,
      size: 8,
      color: rgb(0.5, 0, 0)
    })

    page.drawText('• Always consult qualified healthcare professionals', {
      x: 50,
      y: disclaimerY - 39,
      size: 8,
      color: rgb(0.5, 0, 0)
    })

    page.drawText('• Individual responses to interventions vary significantly', {
      x: 50,
      y: disclaimerY - 51,
      size: 8,
      color: rgb(0.5, 0, 0)
    })

    page.drawText('CONFIDENTIAL - For Educational Review Only', {
      x: 50,
      y: 30,
      size: 10,
      color: rgb(0.5, 0, 0)
    })

    page.drawText(`Generated by Enhanced.AI v2 on ${new Date().toISOString().split('T')[0]}`, {
      x: 50,
      y: 15,
      size: 8,
      color: rgb(0.5, 0.5, 0.5)
    })

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save()

    // Return PDF as downloadable file
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${patientData.name.replace(/[^a-zA-Z0-9]/g, '_')}_medical_summary.pdf"`,
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}