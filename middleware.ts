import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const cookieOptions = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 1 week - must match browser client
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export async function middleware(request: NextRequest) {
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.push(...cookies)
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const applyCookies = (response: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  // Protect authenticated routes
  const protectedRoutes = ['/dashboard', '/profile', '/subscription', '/stack-explorer', '/side-effects', '/compounds', '/onboarding', '/blood-panel-order', '/bloodwork-parser', '/bloodwork-history', '/shop', '/ffmi-calculator']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return applyCookies(NextResponse.redirect(redirectUrl))
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/login') && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return applyCookies(NextResponse.redirect(new URL(`/onboarding?redirectTo=${encodeURIComponent(redirectTo)}`, request.url)))
  }

  return applyCookies(NextResponse.next({
    request: { headers: request.headers },
  }))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (static files)
     * - api (API routes - handle their own auth, skip middleware to avoid blocking)
     * - favicon.ico, images
     */
    '/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}