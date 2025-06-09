import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // Check if user is authenticated and authorized
  if (!token?.email || 
      ( token.email !== 'toolminesai@gmail.com')) {
    // Redirect to login page with callback URL
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', '/admin')
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}