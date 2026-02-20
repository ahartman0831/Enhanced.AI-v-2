import { Resend } from 'resend'

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://getenhanced.ai'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Enhanced.AI <noreply@getenhanced.ai>'

/**
 * Send custom branded confirmation email via Resend.
 * Educational app disclaimer included for compliance.
 */
export async function sendConfirmationEmail(params: {
  to: string
  confirmUrl: string
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    return { success: false, error: 'Email service not configured' }
  }

  const resend = new Resend(apiKey)
  const logoUrl = `${APP_URL}/logo/logo.png`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Enhanced.AI Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 480px; margin: 0 auto; padding: 32px 24px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${logoUrl}" alt="Enhanced.AI Logo" width="120" style="display: inline-block;">
    </div>
    <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e4e4e7;">
      <h1 style="margin: 0 0 16px; font-size: 22px; color: #18181b;">Confirm Your Account</h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
        Hello! Click the button below to confirm your Enhanced.AI account and get started.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${params.confirmUrl}" style="display: inline-block; background: #0891b2; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">Confirm Account</a>
      </div>
      <p style="margin: 24px 0 0; font-size: 13px; color: #71717a; line-height: 1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${params.confirmUrl}" style="color: #0891b2; word-break: break-all;">${params.confirmUrl}</a>
      </p>
      <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; border-top: 1px solid #e4e4e7; padding-top: 20px;">
        <strong>Educational app only—not medical advice.</strong> Enhanced.AI provides educational information for informed conversations with healthcare professionals. Always consult your physician.
      </p>
    </div>
    <p style="margin-top: 24px; font-size: 13px; color: #71717a; text-align: center;">
      — Enhanced.AI Team
    </p>
  </div>
</body>
</html>
`.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: 'Confirm Your Enhanced.AI Account',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    console.error('Send confirmation email error:', err)
    return { success: false, error: message }
  }
}
