import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/context/auth-context"
import { RecipeProvider } from "@/context/recipe-context"
import Header from "@/components/header"
import MobileNav from "@/components/mobile-nav"
import Footer from "@/components/footer"
import PwaInstallPrompt from "@/components/pwa-install-prompt"
import AuthGuard from "@/components/auth-guard"

const inter = Inter({ subsets: ["latin"] })

// Force static generation for layout
export const dynamic = 'force-static'
export const revalidate = false

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000"
}

export const metadata: Metadata = {
  title: "RecipeReady - AI Recipe Generator",
  description: "Generate delicious recipes with AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RecipeReady",
  },
  formatDetection: {
    telephone: false,
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RecipeReady" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <RecipeProvider>
              <AuthGuard>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1 px-4 py-4 md:container md:mx-auto md:py-8 overflow-y-auto">
                    {children}
                  </main>
                  <Footer />
                </div>
                <MobileNav />
                <PwaInstallPrompt />
              </AuthGuard>
              <Toaster position="top-center" />
            </RecipeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}