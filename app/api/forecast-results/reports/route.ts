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

    const { data: profile } = await supabase.from('profiles').select('dev_mode_enabled').eq('id', user.id).single()
    const devModeEnabled = profile?.dev_mode_enabled ?? false
    if (!devModeEnabled) {
      const tier = await getSubscriptionTier(supabase, user.id)
      const gate = requireTier(tier, 'pro')
      if (!gate.allowed) {
        return gate.response
      }
    }

    const { data, error } = await supabase
      .from('enhanced_protocols')
      .select('id, stack_json, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Forecast reports fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch forecasts' }, { status: 500 })
    }

    const reports = (data || []).filter((row) => {
      const json = row.stack_json as Record<string, unknown>
      return json?.analysisType === 'results-forecast' && json?.forecast != null
    })

    return NextResponse.json({ reports })
  } catch (err) {
    console.error('Forecast reports API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
