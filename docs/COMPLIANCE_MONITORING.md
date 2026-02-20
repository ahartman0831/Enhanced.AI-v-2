# Compliance Monitoring System

Lightweight internal compliance monitoring for Grok API outputs. Runs after every Grok call, scans for non-compliant content, logs flags to the database, and alerts the team on high-risk cases.

## Setup

### 1. Database Migration

Run the Supabase migration:

```bash
npx supabase db push
# or
npx supabase migration up
```

The `compliance_flags` table will be created automatically.

### 2. Environment Variables

Add to `.env.local`:

```env
# Admin secret for compliance flags API (reuses DEV_TOGGLE_SECRET if ADMIN_SECRET not set)
ADMIN_SECRET=your_admin_secret
```

**Optional — Slack alerts** (disabled by default; internal DB flags only):
```env
COMPLIANCE_ALERTS_ENABLED=true
SLACK_COMPLIANCE_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

To enable Slack alerts later, create an Incoming Webhook for `#compliance-alerts`:
1. Slack → Apps → Incoming Webhooks → Add to Slack
2. Choose #compliance-alerts channel
3. Copy the webhook URL

### 3. No Additional Packages Required

The monitor uses:
- `fetch` for Slack webhooks (built-in)
- Supabase admin client (already in project)
- No `@slack/web-api` needed for webhook-based alerting

If you prefer the Slack Web API (e.g. for richer formatting), install:

```bash
npm install @slack/web-api
```

Then update `lib/compliance-monitor.ts` to use `WebClient` instead of `fetch`.

## Integration

The monitor is **automatically integrated** into `lib/grok.ts`. Every successful Grok response is scanned before being returned.

**Optional:** Pass `route` and `query` for better context when calling `callGrok`:

```ts
const grokResult = await callGrok({
  prompt: filledPrompt,
  userId: user.id,
  feature: 'results-forecast',
  route: '/api/forecast-results',
  query: protocolStr?.slice(0, 500) ?? 'n/a',
})
```

## Admin API

- **GET** `/api/admin/compliance-flags?secret=ADMIN_SECRET&limit=100&offset=0`  
  Returns last 100 flags (paginated).

- **PATCH** `/api/admin/compliance-flags/[id]?secret=ADMIN_SECRET`  
  Mark flag as acknowledged.  
  Or use header: `X-Admin-Secret: your_secret`

## Behavior

- **HIGH_RISK:** Response is blocked, user sees "Response under compliance review"
- **FLAGGED:** Logged to DB, response proceeds normally
- **OK:** No action
- **Rate limit:** Max 5 Slack alerts per hour per route

## Adding to Other Routes

Routes that call `callGrok` automatically get compliance monitoring. To add `route` and `query` context, pass them in the options:

```ts
const grokResult = await callGrok({
  prompt: analysisPrompt,
  userId: user.id,
  feature: 'side-effects',
  route: '/api/side-effects',
  query: JSON.stringify({ compounds, sideEffects }).slice(0, 500),
})
```
