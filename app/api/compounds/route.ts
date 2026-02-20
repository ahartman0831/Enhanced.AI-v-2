import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json(
      { error: 'Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to .env.local' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/compounds?select=id,name,category,common_uses,risk_score,affected_systems,key_monitoring_markers,nutrition_impact_summary,what_it_is,side_effects,sources,aromatization_score,aromatization_notes,aa_ratio,created_at,updated_at,breakdown_updated_at&order=name`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text || `Supabase returned ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Compounds API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch compounds' },
      { status: 500 }
    )
  }
}
