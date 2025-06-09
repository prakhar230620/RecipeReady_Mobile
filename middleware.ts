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
  
  // Redirect admin users based on cookie or referrer
  if (isAdmin) {
    // Get the mobile nav click info from cookie if available
    const adminNavClicked = request.cookies.get('admin_nav_clicked')?.value === 'true'
    const referrer = request.headers.get('referer') || ''
    
    // Check for admin navigation cookie first (works better in PWA)
    if (adminNavClicked) {
      // Always redirect to admin page when cookie is present, regardless of current path
      // This is especially important for PWA contexts where referrer might not work properly
      const response = NextResponse.redirect(new URL('/admin', request.url))
      // Clear the cookie after redirection
      response.cookies.delete('admin_nav_clicked')
      return response
    }
    
    // Fallback to referrer-based redirection for non-PWA contexts
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