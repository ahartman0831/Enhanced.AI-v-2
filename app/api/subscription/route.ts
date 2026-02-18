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
    const effectiveTier = (normalized === 'elite' || normalized === 'paid') ? normalized : 'free'

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

/** Get last day of current month (placeholder for billing cycle - replace with real billing provider) */
function getLastDayOfMonth(): string {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return last.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, targetTier } = body as { action?: string; targetTier?: string }

    if (!action || !['upgrade', 'downgrade', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const currentTier = (profile?.subscription_tier as string) || 'free'

    if (action === 'upgrade') {
      if (!targetTier || !['paid', 'elite'].includes(targetTier)) {
        return NextResponse.json({ error: 'Invalid target tier for upgrade' }, { status: 400 })
      }
      // Upgrade takes effect immediately
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: targetTier,
          pending_subscription_tier: null,
          subscription_end_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 })
      }
      return NextResponse.json({
        message: `Upgraded to ${targetTier === 'elite' ? 'Elite' : 'Pro'}. Your new plan is active now.`
      })
    }

    const isPaid = currentTier === 'paid' || currentTier === 'elite'
    if (!isPaid && (action === 'downgrade' || action === 'cancel')) {
      return NextResponse.json({ error: 'No active paid subscription to cancel or downgrade' }, { status: 400 })
    }

    // Cancel or downgrade: takes effect at next billing cycle
    const endDate = getLastDayOfMonth()
    const targetTierForDowngrade = action === 'cancel' ? 'free' : (targetTier === 'paid' ? 'paid' : 'free')
    const targetLabel = targetTierForDowngrade === 'paid' ? 'Pro' : 'Free'

    const { error } = await supabase
      .from('profiles')
      .update({
        pending_subscription_tier: targetTierForDowngrade,
        subscription_end_at: endDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Your subscription will change to ${targetLabel} at the end of your billing period (${endDate}). You keep your current access until then. No refund for the current period.`
    })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
