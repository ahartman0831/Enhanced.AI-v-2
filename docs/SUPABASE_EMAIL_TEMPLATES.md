# Supabase Email Templates for Enhanced.AI

Copy and paste these into **Supabase Dashboard → Authentication → Email Templates**.

---

## Logo (already uploaded)

Your logo is hosted in Supabase Storage. Public URL:

```
https://gzqoufimouwzhondmkid.supabase.co/storage/v1/object/public/email-assets/logo.png
```

The templates below use this URL. To re-upload or update the logo, run:

```bash
node --env-file=.env.local scripts/upload-logo-to-supabase.mjs
```

### If the logo doesn't show in emails

- Some clients (e.g. Outlook) block images by default—recipients must click "Display images"
- Add your sending domain to allowlists where possible

---

## Color Scheme (matches app)

| Use | Hex | Matches |
|-----|-----|---------|
| Background | `#0F0F0F` | App dark bg |
| Card | `#171717` | Card bg |
| Border | `#1f2937` | cyan-500/10 equivalent |
| Primary button | `#0891b2` | cyan-600 |
| Link | `#22d3ee` | cyan-400 |
| Body text | `#fafafa` | foreground |
| Muted text | `#a1a1aa` | muted-foreground |

---

## 1. Confirm Signup

**Subject:**
```
Confirm Your Enhanced.AI Account
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirm Your Enhanced.AI Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F0F0F; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; margin: 0 auto;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://gzqoufimouwzhondmkid.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Enhanced.AI" width="120" height="40" style="display: block; max-width: 120px; height: auto;">
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background: #171717; border-radius: 12px; padding: 40px 32px; border: 1px solid #1f2937;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #fafafa;">Confirm Your Account</h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #a1a1aa; line-height: 1.6;">
                Thanks for signing up for Enhanced.AI. Click the button below to confirm your email and get started.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0891b2; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Confirm Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px;">
                <a href="{{ .ConfirmationURL }}" style="color: #22d3ee; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
              <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #1f2937;">
                <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                  <strong>Educational app only—not medical advice.</strong> Enhanced.AI provides educational information for informed conversations with healthcare professionals. Always consult your physician.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 13px; color: #71717a;">— Enhanced.AI Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link

**Subject:**
```
Your Enhanced.AI Login Link
```

**Body (HTML):** *(Replace the logo URL with your Supabase Storage URL for best delivery)*
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Enhanced.AI Login Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F0F0F; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://gzqoufimouwzhondmkid.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Enhanced.AI" width="120" height="40" style="display: block; max-width: 120px; height: auto;">
            </td>
          </tr>
          <tr>
            <td style="background: #171717; border-radius: 12px; padding: 40px 32px; border: 1px solid #1f2937;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #fafafa;">Sign In to Enhanced.AI</h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #a1a1aa; line-height: 1.6;">
                Click the button below to log in to your account. This link expires soon and can only be used once.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0891b2; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Log In</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px;">
                <a href="{{ .ConfirmationURL }}" style="color: #22d3ee; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
              <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #1f2937;">
                <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                  <strong>Educational app only—not medical advice.</strong> Enhanced.AI provides educational information for informed conversations with healthcare professionals. Always consult your physician.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 13px; color: #71717a;">— Enhanced.AI Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Reset Password (optional)

**Subject:**
```
Reset Your Enhanced.AI Password
```

**Body (HTML):** *(Replace the logo URL with your Supabase Storage URL for best delivery)*
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Enhanced.AI Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F0F0F; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://gzqoufimouwzhondmkid.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Enhanced.AI" width="400" height="100" style="display: block; max-width: 400px; height: auto;">
            </td>
          </tr>
          <tr>
            <td style="background: #171717; border-radius: 12px; padding: 40px 32px; border: 1px solid #1f2937;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #fafafa;">Reset Your Password</h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #a1a1aa; line-height: 1.6;">
                Click the button below to reset your password. This link expires soon.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #0891b2; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px;">
                <a href="{{ .ConfirmationURL }}" style="color: #22d3ee; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
              <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #1f2937;">
                <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                  <strong>Educational app only—not medical advice.</strong> Enhanced.AI provides educational information for informed conversations with healthcare professionals. Always consult your physician.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 13px; color: #71717a;">— Enhanced.AI Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Password Changed (notification)

**Subject:**
```
Your Enhanced.AI Password Has Been Changed
```

**Body (HTML):**

*Enable this in Supabase: Authentication → Email Templates → Security notifications → Password changed*

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Password Has Been Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F0F0F; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://gzqoufimouwzhondmkid.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Enhanced.AI" width="100" height="400" style="display: block; max-width: 400px; max-height: 400px; height: auto;">
            </td>
          </tr>
          <tr>
            <td style="background: #171717; border-radius: 12px; padding: 40px 32px; border: 1px solid #1f2937;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #fafafa;">Password Changed</h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #a1a1aa; line-height: 1.6;">
                This is a confirmation that the password for your account {{ .Email }} has just been changed.
              </p>
              <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                If you did not make this change, please contact support immediately.
              </p>
              <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #1f2937;">
                <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                  <strong>Educational app only—not medical advice.</strong> Enhanced.AI provides educational information for informed conversations with healthcare professionals. Always consult your physician.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 13px; color: #71717a;">— Enhanced.AI Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Setup Steps

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. For each template (Confirm signup, Magic link, Reset password, Password changed):
   - Paste the **Subject** into the subject field
   - Paste the **Body (HTML)** into the body field
3. **Logo:** Already set to Supabase Storage URL. No changes needed.
4. Save each template

## Design Notes

- **Logo:** Use Supabase Storage URL for reliable delivery. Production URL works if the app is deployed and the logo is at `/logo/logo.png`.
- **Colors:** Dark theme (#0F0F0F bg, #171717 card, #0891b2 button, #22d3ee links) matches app
- **Structure:** Table-based layout for broad email client support (Outlook, Gmail, Apple Mail)
- **Disclaimer:** Educational-only notice included for compliance
- **Variables:** `{{ .ConfirmationURL }}` is the required Supabase variable—do not remove it
