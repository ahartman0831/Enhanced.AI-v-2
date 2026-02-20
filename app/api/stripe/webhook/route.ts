import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import Stripe from 'stripe'
import { priceIdToTier } from '@/lib/stripe-config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/** Webhooks are the ONLY thing that updates profiles.subscription_tier */
export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('[Stripe webhook] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id as string | undefined
        const customerId = session.customer as string
        if (!userId) {
          console.warn('[Stripe webhook] checkout.session.completed: no user_id in metadata')
          break
        }
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items?.data?.[0]?.price?.id
        const tier = priceId ? priceIdToTier(priceId) : null
        const customerId = sub.customer as string
        const userId = sub.metadata?.user_id as string | undefined

        let targetUserId = userId
        if (!targetUserId && customerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
          targetUserId = profile?.id
        }

        if (!targetUserId) {
          console.warn('[Stripe webhook] subscription created/updated: cannot resolve user', { customerId })
          break
        }

        const effectiveTier = tier ?? 'pro'
        const periodEndTs = (sub as { current_period_end?: number }).current_period_end
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null

        await supabase
          .from('profiles')
          .update({
            subscription_tier: effectiveTier,
            stripe_subscription_id: sub.id,
            subscription_status: sub.status,
            current_period_end: periodEnd,
            stripe_customer_id: sub.customer as string,
            pending_subscription_tier: null,
            subscription_end_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile?.id) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
              subscription_status: 'canceled',
              current_period_end: null,
              pending_subscription_tier: null,
              subscription_end_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)
        }
        break
      }

      case 'invoice.payment_failed':
        // Optional: notify user, retry logic handled by Stripe
        break

      default:
        // Unhandled event type
        break
    }
  } catch (err) {
    console.error('[Stripe webhook] Error processing', event.type, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
