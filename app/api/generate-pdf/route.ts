import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

/** pdf-lib standard fonts only support WinAnsi; replace unsupported chars with ASCII equivalents */
function toWinAnsiSafe(text: string): string {
  return text
    .replace(/[\u2022\u2023\u2043\u2219]/g, '-')  // bullet variants -> hyphen
    .replace(/[\u2018\u2019]/g, "'")               // smart quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')               // en/em dash
    .replace(/[^\x00-\xFF]/g, ' ')
    .replace(/[\r\t]/g, ' ')
}

/** Wrap text at word boundaries; avoid mid-word breaks when possible */
function wrapAtWordBoundary(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current.trim())
        current = ''
      }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars))
      }
      continue
    }
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      if (current) lines.push(current.trim())
      current = word
    }
  }
  if (current) lines.push(current.trim())
  return lines
}

/** Section headers that should be bold + underlined */
const SECTION_HEADERS = new Set([
  'Patient Information:',
  'Health History:',
  'Current Protocol:',
  'Lab Results:',
  'Symptom Report:',
  'Consultation Focus:',
  'Provider Notes:',
])

function isSectionHeader(line: string): boolean {
  const trimmed = line.trim()
  if (SECTION_HEADERS.has(trimmed)) return true
  return /^[A-Za-z][A-Za-z ]+:$/.test(trimmed) && trimmed.length < 50
}

/** Convert analysis data to printable text (no Grok - use existing content) */
function analysisToText(analysis: unknown, analysisType: string): string {
  if (typeof analysis === 'string') return analysis
  if (!analysis || typeof analysis !== 'object') return 'No analysis content.'
  const a = analysis as Record<string, unknown>
  // Prefer single text field if present (Grok may return { content: "..." })
  const textKey = ['content', 'text', 'summary']
  for (const k of textKey) {
    if (typeof a[k] === 'string') return a[k] as string
  }
  // Telehealth-referral: format structured fields
  if (analysisType === 'telehealth-referral') {
    const parts: string[] = []
    if (a.patientInfo && typeof a.patientInfo === 'object') {
      const pi = a.patientInfo as Record<string, unknown>
      parts.push(`Patient Information:\nPatient: ${pi.name ?? 'N/A'} | Type: ${pi.consultationType ?? 'N/A'} | Date: ${pi.referralDate ?? 'N/A'}`)
    }
    if (a.healthHistory) parts.push(`\nHealth History:\n${a.healthHistory}`)
    if (a.currentProtocol) parts.push(`\nCurrent Protocol:\n${a.currentProtocol}`)
    if (a.labResults) parts.push(`\nLab Results:\n${a.labResults}`)
    if (a.symptomReport) parts.push(`\nSymptom Report:\n${a.symptomReport}`)
    if (Array.isArray(a.consultationFocus) && a.consultationFocus.length) {
      parts.push(`\nConsultation Focus:\n${a.consultationFocus.join('\n- ')}`)
    }
    if (a.providerNotes) parts.push(`\nProvider Notes:\n${a.providerNotes}`)
    if (parts.length) return parts.join('\n')
  }
  return JSON.stringify(analysis, null, 2)
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

    // Parse request body
    const body = await request.json()
    const { analysisType, patientData } = body

    if (!analysisType || !patientData) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisType and patientData' },
        { status: 400 }
      )
    }

    const analysisData = {
      reportType: analysisType,
      patientName: patientData.name || 'Patient Analysis',
      reportId: patientData.id || `report-${Date.now()}`,
      analysisDate: new Date().toISOString().split('T')[0],
    }

    // Use existing analysis content (no Grok call - content already generated)
    const contentText = analysisToText(patientData.analysis, analysisType)

    // Generate PDF from the content
    const pdfDoc = await PDFDocument.create()
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    let page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const marginX = 50
    const marginBottom = 100

    // Add watermark background (use light gray; opacity may not be supported in all pdf-lib contexts)
    page.drawText('EDUCATIONAL PURPOSES ONLY', {
      x: width / 2 - 150,
      y: height / 2,
      size: 60,
      color: rgb(0.85, 0.85, 0.85),
      rotate: degrees(30)
    })

    page.drawText('NOT MEDICAL ADVICE', {
      x: width / 2 - 120,
      y: height / 2 + 100,
      size: 40,
      color: rgb(0.9, 0.9, 0.9),
      rotate: degrees(30)
    })

    // Add header
    page.drawText('Enhanced AI v2 - Educational Medical Summary', {
      x: 50,
      y: height - 50,
      size: 16,
      color: rgb(0, 0, 0)
    })

    // Add disclaimer header
    page.drawText('! EDUCATIONAL ANALYSIS ONLY - NOT MEDICAL ADVICE', {
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

    // Add main content with bold/underlined section headers
    const lines = toWinAnsiSafe(contentText).split('\n')
    let yPosition = height - 180
    const fontSize = 10
    const headerFontSize = 11
    const lineHeight = 12
    const headerLineHeight = 14
    const maxCharsPerLine = 88

    const addPageIfNeeded = () => {
      if (yPosition < marginBottom + 80) {
        page = pdfDoc.addPage()
        yPosition = height - 50
      }
    }

    for (const line of lines) {
      addPageIfNeeded()
      if (yPosition < marginBottom) break

      const trimmed = line.trim()
      const isHeader = isSectionHeader(line)

      if (isHeader) {
        page.drawText(toWinAnsiSafe(trimmed), {
          x: marginX,
          y: yPosition,
          size: headerFontSize,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.2),
        })
        const textWidth = helveticaBold.widthOfTextAtSize(trimmed, headerFontSize)
        page.drawLine({
          start: { x: marginX, y: yPosition - 2 },
          end: { x: marginX + textWidth, y: yPosition - 2 },
          thickness: 0.8,
          color: rgb(0.2, 0.2, 0.3),
        })
        yPosition -= headerLineHeight
        continue
      }

      if (trimmed.length > maxCharsPerLine) {
        const wrappedLines = wrapAtWordBoundary(trimmed, maxCharsPerLine)
        for (const wrappedLine of wrappedLines) {
          addPageIfNeeded()
          if (yPosition < marginBottom) break
          page.drawText(toWinAnsiSafe(wrappedLine), {
            x: marginX,
            y: yPosition,
            size: fontSize,
            font: helvetica,
            color: rgb(0.15, 0.15, 0.2),
          })
          yPosition -= lineHeight
        }
      } else if (trimmed) {
        page.drawText(toWinAnsiSafe(trimmed), {
          x: marginX,
          y: yPosition,
          size: fontSize,
          font: helvetica,
          color: rgb(0.15, 0.15, 0.2),
        })
        yPosition -= lineHeight
      } else {
        yPosition -= 6
      }
    }

    // Add comprehensive disclaimer footer on last page
    const lastPage = pdfDoc.getPages().slice(-1)[0]
    const disclaimerY = 100
    lastPage.drawText('IMPORTANT MEDICAL DISCLAIMER:', {
      x: marginX,
      y: disclaimerY,
      size: 10,
      font: helveticaBold,
      color: rgb(0.8, 0, 0),
    })

    lastPage.drawText('- This document contains EDUCATIONAL information only', {
      x: marginX,
      y: disclaimerY - 15,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0, 0),
    })

    lastPage.drawText('• NOT medical advice, diagnosis, or treatment recommendations', {
      x: marginX,
      y: disclaimerY - 27,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0, 0),
    })

    lastPage.drawText('- Always consult qualified healthcare professionals', {
      x: marginX,
      y: disclaimerY - 39,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0, 0),
    })

    lastPage.drawText('- Individual responses to interventions vary significantly', {
      x: marginX,
      y: disclaimerY - 51,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0, 0),
    })

    lastPage.drawText('CONFIDENTIAL - For Educational Review Only', {
      x: marginX,
      y: 30,
      size: 10,
      font: helveticaBold,
      color: rgb(0.5, 0, 0),
    })

    lastPage.drawText(`Generated by Enhanced.AI v2 on ${new Date().toISOString().split('T')[0]}`, {
      x: marginX,
      y: 15,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save()

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${patientData.name.replace(/[^a-zA-Z0-9]/g, '_')}_medical_summary.pdf"`,
      },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}