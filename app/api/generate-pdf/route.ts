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

    // Load medical summary formatter prompt
    const promptPath = path.join(process.cwd(), 'prompts', 'medical-summary-formatter.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load medical summary template' },
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
      .replace('[stack-explorer|side-effects|compounds]', analysisType)
      .replace('[Current Date]', analysisData.analysisDate)
      .replace('[Generated ID]', analysisData.reportId)
      // Add more replacements as needed

    // Call Grok to format the medical summary
    const grokResult = await callGrok({
      prompt: filledPrompt + '\n\nAnalysis Data:\n' + JSON.stringify(analysisData, null, 2),
      userId: user.id,
      feature: 'pdf-generation'
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

    // Add content to PDF
    const fontSize = 12
    page.drawText('Enhanced AI v2 - Medical Summary Report', {
      x: 50,
      y: height - 50,
      size: 18,
      color: rgb(0, 0, 0)
    })

    page.drawText(`Report Type: ${analysisType}`, {
      x: 50,
      y: height - 100,
      size: fontSize,
      color: rgb(0, 0, 0)
    })

    page.drawText(`Patient: ${patientData.name}`, {
      x: 50,
      y: height - 120,
      size: fontSize,
      color: rgb(0, 0, 0)
    })

    page.drawText(`Date: ${analysisData.analysisDate}`, {
      x: 50,
      y: height - 140,
      size: fontSize,
      color: rgb(0, 0, 0)
    })

    // Split the formatted text into lines and add to PDF
    const lines = grokResult.data.toString().split('\n')
    let yPosition = height - 180

    for (const line of lines.slice(0, 50)) { // Limit lines to fit on page
      if (yPosition < 50) break // Don't go too low on page

      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0)
      })
      yPosition -= 15
    }

    // Add disclaimer at bottom
    page.drawText('CONFIDENTIAL - For Healthcare Professional Review Only', {
      x: 50,
      y: 30,
      size: 10,
      color: rgb(0.5, 0, 0)
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