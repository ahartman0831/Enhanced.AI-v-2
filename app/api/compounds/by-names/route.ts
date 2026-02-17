import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Match a search name (from LLM) to a compound name.
 * Handles: "Tren" -> "Trenbolone", "Cardarine" -> "Cardarine (GW-501516)"
 */
function matchesCompound(searchName: string, compoundName: string): boolean {
  const s = searchName.toLowerCase().trim()
  const c = compoundName.toLowerCase()
  if (s === c) return true
  if (c.includes(s)) return true
  if (s.includes(c)) return true
  // Handle aliases: "Tren" in "Trenbolone", "GW" in "Cardarine (GW-501516)"
  const cBase = c.split(/[(\[]/)[0].trim()
  return s === cBase || cBase.includes(s) || s.includes(cBase)
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const names = Array.isArray(body?.names) ? body.names : []

    if (names.length === 0) {
      return NextResponse.json([])
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/compounds?select=id,name,category,common_uses,risk_score,side_effects,affected_systems,key_monitoring_markers,nutrition_impact_summary,what_it_is&order=name`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
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

    const allCompounds = await res.json()
    const matched: typeof allCompounds = []
    const used = new Set<string>()
    const notFound: string[] = []

    for (const searchName of names) {
      if (!searchName || typeof searchName !== 'string') continue
      const found = allCompounds.find(
        (c: { id: string; name: string }) => matchesCompound(searchName, c.name) && !used.has(c.id)
      )
      if (found) {
        matched.push(found)
        used.add(found.id)
      } else {
        notFound.push(searchName)
      }
    }

    return NextResponse.json({ compounds: matched, notFound })
  } catch (err) {
    console.error('Compounds by-names API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch compounds' },
      { status: 500 }
    )
  }
}
