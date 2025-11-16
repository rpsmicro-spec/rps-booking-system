'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface WindowWithDeferredPrompt extends Window {
  deferredInstallPrompt?: BeforeInstallPromptEvent
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  // Initialize isSupported synchronously if we're in a browser environment
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator
  const [isChecking, setIsChecking] = useState(true)
  const [hasServiceWorker, setHasServiceWorker] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if the event was already captured by the early script in layout.tsx
    const windowWithPrompt = window as WindowWithDeferredPrompt
    if (windowWithPrompt.deferredInstallPrompt) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setDeferredPrompt(windowWithPrompt.deferredInstallPrompt as BeforeInstallPromptEvent)
        setIsChecking(false)
        delete windowWithPrompt.deferredInstallPrompt
      }, 0)
    }

    // CRITICAL: Set up the event listener IMMEDIATELY to prevent browser's native banner
    // This must happen before the browser shows its own install prompt
    const handler = (e: Event) => {
      // Always prevent the default browser banner
      e.preventDefault()
      e.stopPropagation()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setIsChecking(false)
    }

    // Listen for the event IMMEDIATELY - this prevents the browser's native banner
    // Note: The script in layout.tsx should catch it first, but this is a backup
    window.addEventListener('beforeinstallprompt', handler, { passive: false })

    // Check if already installed
    const checkInstalled = () => {
      const navWithStandalone = window.navigator as NavigatorWithStandalone
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        navWithStandalone.standalone === true ||
        document.referrer.includes('android-app://')

      if (isStandalone) {
        setIsInstalled(true)
        setIsChecking(false)
        return true
      }
      return false
    }

    if (checkInstalled()) {
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }

    // Check if service worker is supported (already initialized, but ensure it's set)
    if ('serviceWorker' in navigator) {
      // Aggressively check for service worker registration
      const checkServiceWorker = async () => {
        try {
          // First check existing registrations
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration && registration.active) {
            setHasServiceWorker(true)
            setIsChecking(false)
            return true
          }
          
          // If not found, wait for service worker to be ready
          // This handles the case where SW is still registering
          try {
            await navigator.serviceWorker.ready
            const readyRegistration = await navigator.serviceWorker.getRegistration()
            if (readyRegistration && readyRegistration.active) {
              setHasServiceWorker(true)
              setIsChecking(false)
              return true
            }
          } catch {
            // Service worker not ready yet
          }
          
          return false
        } catch (error) {
          console.error('Error checking service worker:', error)
          return false
        }
      }

      // Check immediately
      checkServiceWorker()
      
      // Also set up periodic checks to catch service worker when it registers
      const checkInterval = setInterval(async () => {
        const found = await checkServiceWorker()
        if (found) {
          clearInterval(checkInterval)
        }
      }, 500) // Check every 500ms for faster response

      // Stop checking after 3 seconds and be optimistic
      const timeout = setTimeout(() => {
        clearInterval(checkInterval)
        setIsChecking(false)
        // If we're in a secure context and service worker is supported,
        // be optimistic and assume it will register
        const isSecureContext =
          window.location.protocol === 'https:' ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1'
        
        if (isSecureContext && !hasServiceWorker) {
          // Optimistically assume service worker will be available
          // The button can still work even if SW check is pending
          setHasServiceWorker(true)
        }
      }, 3000)

      return () => {
        clearTimeout(timeout)
        clearInterval(checkInterval)
        window.removeEventListener('beforeinstallprompt', handler)
      }
    } else {
      setTimeout(() => {
        setIsChecking(false)
      }, 0)
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }
  }, [deferredPrompt, isInstalled, hasServiceWorker])

  const install = async () => {
    if (!deferredPrompt) {
      // Fallback: try to trigger install via other means
      console.log('No deferred prompt, trying alternative install method')
      // On some browsers, we can still show install UI
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstalled(true)
        return true
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }

    return false
  }

  // Show button if:
  // 1. Not installed
  // 2. Service worker is supported
  // 3. We're on HTTPS or localhost (required for PWA)
  // 4. Either service worker is registered OR we're still checking (optimistic)
  const isSecureContext =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')

  // Be more optimistic: show button if we're in secure context and supported,
  // even if service worker check is still pending (it will register soon)
  // The button will handle the case where install isn't available yet
  const canInstall =
    !isInstalled &&
    isSupported &&
    isSecureContext &&
    (hasServiceWorker || isChecking) // Show if SW is ready OR still checking (optimistic)

  return {
    install,
    canInstall,
    isInstalled,
    isSupported,
    deferredPrompt: !!deferredPrompt,
  }
}

