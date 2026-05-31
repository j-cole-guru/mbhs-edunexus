import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true)
      return
    }

    const wasDismissed = localStorage.getItem('pwa_dismissed')
    if (wasDismissed) return

    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone
    setIsIOS(isIOSDevice)

    let timeoutId

    if (isIOSDevice) {
      timeoutId = window.setTimeout(() => setShowBanner(true), 3000)
      return () => window.clearTimeout(timeoutId)
    }

    const handler = (e) => {
      e.preventDefault()
      window.deferredPwaPrompt = e
      setInstallPrompt(e)
      timeoutId = window.setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.clearTimeout(timeoutId)
    }
  }, [])

  const handleInstall = async () => {
    const promptEvent = installPrompt || window.deferredPwaPrompt
    if (!promptEvent) return

    await promptEvent.prompt()
    const result = await promptEvent.userChoice
    if (result.outcome === 'accepted') {
      setShowBanner(false)
      setIsInstalled(true)
      delete window.deferredPwaPrompt
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('pwa_dismissed', 'true')
  }

  if (isInstalled || !showBanner || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white">
          <Download className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold">MBHS EduNexus</p>
              <p className="text-sm text-slate-300">Methodist Boys' High School</p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isIOS ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-200">
              <p className="mb-3 font-semibold text-white">Install this app on your iPhone for quick access.</p>
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">1</span>
                  <span>Tap the Share button at the bottom of your browser.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">2</span>
                  <span>Scroll down and tap Add to Home Screen.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">3</span>
                  <span>Tap Add to install.</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Install MBHS EduNexus for faster access. Works offline too.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  <Download className="h-4 w-4" />
                  Install Now
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
