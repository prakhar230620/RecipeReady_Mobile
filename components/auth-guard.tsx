'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingShimmer from './loading-shimmer'

const publicRoutes = ['/auth/signin', '/auth/signup']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    const isPublicRoute = publicRoutes.includes(pathname)

    if (!session && !isPublicRoute) {
      router.push('/auth/signin')
    } else if (session && isPublicRoute) {
      router.push('/')
    }
  }, [session, status, pathname, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <LoadingShimmer />
          <LoadingShimmer />
          <LoadingShimmer />
        </div>
      </div>
    )
  }

  // यहां से रीडायरेक्ट लॉजिक हटा दिया गया है
  // अब यह केवल useEffect में रीडायरेक्ट करेगा, लेकिन रेंडरिंग को नहीं रोकेगा
  return <>{children}</>
}