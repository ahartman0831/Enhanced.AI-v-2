import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'pro')
    if (!gate.allowed) {
      return gate.response
    }

    const { data, error } = await supabase
      .from('enhanced_protocols')
      .select('id, stack_json, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Stack reports fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Filter to stack explorer reports only (have common_approaches_discussed or commonApproaches)
    const reports = (data || []).filter((row) => {
      const json = row.stack_json as Record<string, unknown>
      return json?.common_approaches_discussed != null || json?.commonApproaches != null
    })

    return NextResponse.json({ reports })
  } catch (err) {
    console.error('Stack reports API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
