'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

export default function PwaInstallPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches

    if (isAppInstalled) {
      return // Don't show install prompt if already installed
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show the install prompt
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      // Clear the saved prompt as it can't be used again
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    })
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-card border rounded-lg p-4 shadow-lg z-40 flex justify-between items-center">
      <div className="flex items-center">
        <Download className="h-5 w-5 mr-2 text-primary" />
        <span className="text-sm">Install app for better experience</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setShowInstallPrompt(false)}>
          <X className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleInstallClick} className="mobile-button">
          Install
        </Button>
      </div>
    </div>
  )
}