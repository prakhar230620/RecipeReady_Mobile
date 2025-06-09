import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // Check if user is an admin based on email
  const isAdmin = token?.email === 'toolminesai@gmail.com'

  // Check if the request is for the admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if user is authenticated and authorized
    if (!token?.email || !isAdmin) {
      // Redirect to regular login page with callback URL
      const url = new URL('/auth/signin', request.url)
      url.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }
  
  // Redirect admin users from home page to admin panel after Google sign-in
  if (request.nextUrl.pathname === '/' && isAdmin) {
    // Only redirect if coming from a sign-in (check referrer or other indicators)
    const referrer = request.headers.get('referer') || ''
    if (referrer.includes('/auth/signin') || referrer.includes('/api/auth/callback/google')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/']
}