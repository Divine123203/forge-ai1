import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy function (Middleware)
 * Handles authentication redirects and cookie syncing
 */
export async function proxy(request: NextRequest) {
  // 1. INITIAL RESPONSE
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE ENV ERROR: Missing URL or Key")
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
        set(name: string, value: string, options: CookieOptions) {
          // Sync cookies to request and response
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options, path: '/' })
        },
        remove(name: string, options: CookieOptions) {
          // Sync cookie removal
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options, path: '/' })
        },
      },
    }
  )

  // 3. AUTHENTICATION LOGIC
  // Use getSession() for middleware - it's more stable for redirects
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // Define routes that require a logged-in user
  const isProtectedRoute = 
    pathname.startsWith('/quiz') || 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/library');

  // A. PROTECTED ROUTE CHECK: If no session and trying to access protected content
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    // Optional: add a return-to parameter
    loginUrl.searchParams.set('next', pathname) 
    return NextResponse.redirect(loginUrl)
  }

  // B. AUTH PAGE CHECK: If logged in, don't let them see the login page
  if (session && pathname.startsWith('/login')) {
    // If you have a root page (dashboard) at '/', use that
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export default proxy;

// 4. MATCHER CONFIGURATION
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (Supabase auth callback routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}