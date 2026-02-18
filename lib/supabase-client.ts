import { createBrowserClient } from '@supabase/ssr'

const cookieOptions = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions }
  )
}