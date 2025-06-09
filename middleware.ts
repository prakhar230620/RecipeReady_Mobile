import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // Check if user is an admin based on email
  const isAdmin = token?.email === 'toolminesai@gmail.com'

  // For admin users, redirect to admin page after login
  if (isAdmin && request.nextUrl.pathname === '/') {
    const referrer = request.headers.get('referer') || ''
    
    // Redirect from home page after login
    if (referrer.includes('/auth/signin') || referrer.includes('/api/auth/callback/google')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/']
}