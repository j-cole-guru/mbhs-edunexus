import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Download, X } from 'lucide-react'

const pageNames = {
  '/admin': 'Dashboard',
  '/admin/system-health': 'System Health',
  '/admin/security': 'Security Logs',
  '/admin/audit': 'Audit Trail',
  '/admin/admins': 'Manage Admins',
  '/admin/backup': 'Data Backup',
  '/admin/levels': 'Manage Levels',
  '/admin/classes': 'Manage Classes',
  '/admin/terms': 'Manage Terms',
  '/admin/teachers': 'Manage Teachers',
  '/admin/students': 'Manage Students',
  '/admin/results': 'Upload Results',
  '/admin/attendance': 'Attendance Reports',
  '/admin/timetable': 'Upload Timetable',
  '/admin/promote': 'Promote Students',
  '/admin/archive': 'Archive Students',
  '/admin/reports': 'Student Reports',
  '/teacher': 'Dashboard',
  '/teacher/attendance': 'Attendance',
  '/teacher/timetable': 'Timetable',
  '/student': 'Dashboard',
  '/student/results': 'My Results',
  '/student/attendance': 'My Attendance',
  '/student/timetable': 'Timetable',
  '/student/id-card': 'My ID Card',
  '/student/report': 'Submit Report',
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation()
  const pageName = pageNames[location.pathname] || 'EduNexus'

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
    <div className="bg-[#0f0f0f] border-b border-gray-900 z-10">
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-500 lg:hidden hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 ml-4 lg:ml-0">
            <h1 className="text-lg sm:text-xl font-black text-white truncate">
              {pageName}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {showInstall && (
              <button
                onClick={handleInstall}
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-black bg-white rounded-full hover:bg-gray-200 transition"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Install App
              </button>
            )}

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center shrink-0 border border-gray-700">
                <span className="text-white text-xs font-black">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden xs:block text-xs sm:text-sm font-bold text-gray-300 truncate max-w-[100px] sm:max-w-none">
                {userName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl border border-gray-800 bg-[#111] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black">Install App</h3>
              <button onClick={() => setShowIOSGuide(false)} className="rounded-full p-1 text-gray-500 hover:bg-gray-900 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-400">Install MBHS EduNexus on your device for quick access.</p>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">1</span>
                <span>Tap the Share button <span className="inline-block px-1 py-0.5 rounded bg-gray-800 text-xs font-mono">⎙</span> at the bottom of your browser.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">2</span>
                <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">3</span>
                <span>Tap <strong className="text-white">Add</strong> in the top-right corner.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-full bg-white px-4 py-2.5 text-sm font-black text-black transition hover:bg-gray-200"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
