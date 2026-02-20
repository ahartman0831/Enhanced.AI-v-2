import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/** GET: Return current subscription tier for the authenticated user */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Subscription GET] Supabase error:', profileError.code, profileError.message)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    const tier = (profile?.subscription_tier as string) || 'free'
    const normalized = tier.toLowerCase().trim()
    const effectiveTier = (normalized === 'elite' || normalized === 'paid' || normalized === 'pro') ? (normalized === 'pro' ? 'paid' : normalized) : 'free'

    return NextResponse.json({
      tier: effectiveTier === 'elite' ? 'elite' : effectiveTier === 'paid' ? 'paid' : 'free',
      subscription_end_at: profile?.subscription_end_at ?? null,
      pending_subscription_tier: profile?.pending_subscription_tier ?? null
    })
  } catch (error) {
    console.error('Subscription GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST: Redirect to Stripe for upgrades/cancel. Webhooks are the ONLY thing that updates subscription_tier. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { action } = body as { action?: string }

    if (action === 'upgrade' || action === 'downgrade' || action === 'cancel') {
      return NextResponse.json({
        error: 'Use Stripe for subscription changes. Visit /subscription and click "Manage subscription" or "Upgrade".',
        useStripe: true,
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
