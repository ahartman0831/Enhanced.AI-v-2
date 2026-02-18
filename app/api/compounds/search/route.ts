import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

const LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''

    if (q.length < 2) {
      return NextResponse.json([])
    }

    const admin = createSupabaseAdminClient()

    const { data, error } = await admin
      .from('compounds')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(LIMIT)

    if (error) {
      console.error('Compounds search error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Compounds search API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to search compounds' },
      { status: 500 }
    )
  }
}
