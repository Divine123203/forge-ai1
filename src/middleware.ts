import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Standard Next.js Middleware
 * Handles authentication redirects and cookie syncing for App Router
 */
export async function middleware(request: NextRequest) {
  // 1. INITIAL RESPONSE
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  // 2. INITIALIZE SUPABASE SSR CLIENT
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Inside your middleware set() function
set(name: string, value: string, options: CookieOptions) {
  request.cookies.set({ name, value, ...options })
  response = NextResponse.next({
    request: { headers: request.headers },
  })
  // Ensure path is ALWAYS '/' so /api can see it
  response.cookies.set({ 
    name, 
    value, 
    ...options, 
    path: '/', 
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' 
  })
},
        remove(name: string, options: CookieOptions) {
          // Sync cookie removal
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options, path: '/', sameSite: 'lax' })
        },
      },
    }
  )

  // 3. AUTHENTICATION LOGIC
  // getUser() is more secure as it re-validates the session with Supabase auth
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Define routes that require a logged-in user
  const isProtectedRoute = 
    pathname.startsWith('/quiz') || 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/library') ||
    pathname.startsWith('/generator'); // Added your new generator path

  // A. PROTECTED ROUTE CHECK: If no user and trying to access private content
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // B. AUTH PAGE CHECK: If logged in, don't let them see the login page
  // Redirect them to their library/dashboard instead
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/generator', request.url))
  }

  return response
}

// 4. MATCHER CONFIGURATION
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (Supabase auth callback routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}