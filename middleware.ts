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
  
  // Redirect admin users based on URL parameters or referrer
  if (isAdmin) {
    // Check for source=nav query parameter in the URL
    const sourceParam = request.nextUrl.searchParams.get('source')
    const referrer = request.headers.get('referer') || ''
    
    // If the URL has source=nav parameter, preserve it for the admin page
    // This works in both PWA and regular web contexts
    if (sourceParam === 'nav') {
      // We don't need to redirect here as the URL already points to /admin
      // Just let the request continue to the admin page
      return NextResponse.next()
    }
    
    // Redirect from home page after login
    if (request.nextUrl.pathname === '/' && 
        (referrer.includes('/auth/signin') || referrer.includes('/api/auth/callback/google'))) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/']
}