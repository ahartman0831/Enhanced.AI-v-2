import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Stripe from 'stripe'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { tier } = body as { tier?: string }

    if (!tier || !['pro', 'elite'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier. Use pro or elite.' }, { status: 400 })
    }

    const priceKey = `${tier}_monthly`
    const priceId = STRIPE_PRICE_IDS[priceKey]
    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json({ error: 'Price not configured. Set STRIPE_PRICE_* env vars.' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const customerId = profile?.stripe_customer_id as string | undefined

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/subscription?canceled=true`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
        trial_period_days: undefined,
      },
      allow_promotion_codes: true,
    }

    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_email = user.email ?? undefined
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Stripe checkout]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
