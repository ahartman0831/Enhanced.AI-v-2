/**
 * Server-side PDF to image conversion.
 * Uses pdf-to-img (handles Node.js environment) to avoid pdfjs-dist browser APIs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import { pdf } from 'pdf-to-img'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'elite')
    if (!gate.allowed) {
      return gate.response
    }

    const body = await request.json()
    const { pdfBase64 } = body as { pdfBase64?: string }

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return NextResponse.json({ error: 'pdfBase64 is required' }, { status: 400 })
    }

    const dataUrl = `data:application/pdf;base64,${pdfBase64}`
    const document = await pdf(dataUrl, { scale: 2.0 })
    const dataUrls: string[] = []

    for await (const image of document) {
      const buf = Buffer.isBuffer(image) ? image : Buffer.from(image)
      const b64 = buf.toString('base64')
      dataUrls.push(`data:image/png;base64,${b64}`)
    }

    return NextResponse.json({ dataUrls })
  } catch (err) {
    console.error('[pdf-to-images] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to convert PDF to images' },
      { status: 500 }
    )
  }
}
