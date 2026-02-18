import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile (use * to avoid errors if migrations add columns later)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found; other errors (e.g. missing column) return 500
      console.error('[Profile GET] Supabase error:', error.code, error.message)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const p = profile || {}

    // If pending downgrade/cancel has passed, apply it (only if columns exist)
    const pending = p.pending_subscription_tier as string | null | undefined
    const endAt = p.subscription_end_at as string | null | undefined
    if (pending && endAt && new Date(endAt) < new Date()) {
      const updatePayload: Record<string, unknown> = {
        subscription_tier: pending,
        updated_at: new Date().toISOString()
      }
      // Only clear these if they exist in schema
      if ('pending_subscription_tier' in p) updatePayload.pending_subscription_tier = null
      if ('subscription_end_at' in p) updatePayload.subscription_end_at = null

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)

      if (!updateErr) {
        p.subscription_tier = pending
        if ('pending_subscription_tier' in p) p.pending_subscription_tier = null
        if ('subscription_end_at' in p) p.subscription_end_at = null
      }
    }

    return NextResponse.json(p)

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { age, sex, weight_lbs, goals, experience_level, risk_tolerance } = body

    // Upsert profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        age,
        sex,
        weight_lbs,
        goals,
        experience_level,
        risk_tolerance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Profile save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}