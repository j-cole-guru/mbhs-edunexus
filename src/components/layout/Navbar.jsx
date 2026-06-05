import { useState, useEffect } from 'react'
import { Menu, Download, X } from 'lucide-react'

export default function Navbar({ onMenuClick }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) return

    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      setShowInstall(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      window.deferredPwaPrompt = e
      setInstallPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    const promptEvent = installPrompt || window.deferredPwaPrompt
    if (!promptEvent) return

    await promptEvent.prompt()
    const result = await promptEvent.userChoice
    if (result.outcome === 'accepted') {
      setShowInstall(false)
      setInstallPrompt(null)
      delete window.deferredPwaPrompt
    }
  }

  const safeParseStaff = () => {
    try {
      const raw = localStorage.getItem('mbhs_staff')
      if (!raw || raw === 'undefined' || raw === 'null') return null
      return JSON.parse(raw)
    } catch { return null }
  }

  const safeParseStudent = () => {
    try {
      const raw = localStorage.getItem('mbhs_student')
      if (!raw || raw === 'undefined' || raw === 'null') return null
      return JSON.parse(raw)
    } catch { return null }
  }

  const staff = safeParseStaff()
  const student = safeParseStudent()
  const userName = staff?.full_name || student?.full_name || 'User'

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 z-10">
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-500 lg:hidden hover:text-gray-900 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 ml-4 lg:ml-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              MBHS EduNexus
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {showInstall && (
              <button
                onClick={handleInstall}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </button>
            )}

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden xs:block text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[100px] sm:max-w-none">
                {userName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Install App</h3>
              <button onClick={() => setShowIOSGuide(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-300">Install MBHS EduNexus on your device for quick access.</p>
            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">1</span>
                <span>Tap the Share button <span className="inline-block px-1 py-0.5 rounded bg-slate-800 text-xs font-mono">⎙</span> at the bottom of your browser.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">3</span>
                <span>Tap <strong>Add</strong> in the top-right corner.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}