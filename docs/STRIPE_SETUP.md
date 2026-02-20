# Stripe Subscription Setup

## Environment Variables

Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...          # From Stripe Dashboard > Developers > API keys
STRIPE_WEBHOOK_SECRET=whsec_...        # From webhook endpoint (see below)
STRIPE_PRICE_PRO_MONTHLY=price_...    # Create in Stripe Dashboard > Products
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_ELITE_MONTHLY=price_...
STRIPE_PRICE_ELITE_ANNUAL=price_...
```

## Stripe Dashboard Setup

1. **Create Products & Prices**
   - Dashboard > Products > Add product
   - Create "Pro" and "Elite" products
   - Add monthly and annual prices to each
   - Copy price IDs to env vars

2. **Customer Portal**
   - Dashboard > Settings > Billing > Customer portal
   - Enable: Cancel subscriptions, Switch plans, Update payment method

3. **Webhook**
   - Dashboard > Developers > Webhooks > Add endpoint
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

4. **Local testing**
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Use the webhook secret from CLI output for local dev

## Architecture

- **profiles.subscription_tier** is the source of truth for entitlements
- **Webhooks only** update subscription_tier (never from checkout flow)
- Tiers: `free` | `pro` | `elite` (pro and paid are equivalent)
- Feature gating: use `getSubscriptionTier` + `requireTier` in API routes, `useSubscriptionTier` on client
