import { useState, useEffect } from 'react'
import { Menu, Download } from 'lucide-react'

export default function Navbar({ onMenuClick }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      window.deferredPwaPrompt = e
      setInstallPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) {
      setShowInstall(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    const promptEvent = installPrompt || window.deferredPwaPrompt
    if (!promptEvent) return

    await promptEvent.prompt()
    const result = await promptEvent.userChoice
    console.log('Install result:', result.outcome)
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
    </div>
  )
}