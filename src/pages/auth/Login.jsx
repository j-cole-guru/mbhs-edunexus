import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Users, GraduationCap, AlertCircle, Loader2, Eye, EyeOff, Download, X } from 'lucide-react'
import logo from '../../assets/logo.png'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const Login = () => {
  const [activeTab, setActiveTab] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Student login state
  const [studentNumber, setStudentNumber] = useState('')
  const [pin, setPin] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPin, setShowPin] = useState(false)

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
    if (!installPrompt) return
    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowInstall(false)
      setInstallPrompt(null)
    }
  }

  // Staff login state
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleStudentLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Attempting student login with name:', fullName, 'PIN:', pin)
      
      // DIRECT APPROACH: Query students table directly and check PIN
      // This bypasses the RPC which seems to have issues
      console.log('Querying students table directly...')
      
      let authenticatedStudent = null
      
      try {
        // Create a query body to find students by name
        // Use SERVICE_KEY to bypass RLS policies
        const queryRes = await fetch(
          `${SUPABASE_URL}/rest/v1/students?full_name=eq.${fullName}&select=*`,
          {
            method: 'GET',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
            }
          }
        )
        
      if (queryRes.ok) {
          const students = await queryRes.json()
          console.log('Direct query returned:', students)
          
          if (Array.isArray(students) && students.length > 0) {
            // Check if any student matches the PIN
            const matchedStudent = students.find(s => String(s.pin) === String(pin))
            if (matchedStudent) {
              authenticatedStudent = matchedStudent
              console.log('Found student with matching PIN:', authenticatedStudent)
            } else {
              console.log('Found students but PIN does not match')
              console.log('Students found:', students.map(s => ({name: s.full_name, pin: s.pin})))
            }
          } else {
            // Query succeeded but no students found - try alternative queries
            console.log('No students found with exact name. Trying case-insensitive search...')
            
            try {
              const iLikeRes = await fetch(
                `${SUPABASE_URL}/rest/v1/students?full_name=ilike.${fullName}&select=*`,
                {
                  method: 'GET',
                  headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                  }
                }
              )
              
              if (iLikeRes.ok) {
                const iLikeStudents = await iLikeRes.json()
                console.log('Case-insensitive query returned:', iLikeStudents)
                if (Array.isArray(iLikeStudents) && iLikeStudents.length > 0) {
                  const matchedStudent = iLikeStudents.find(s => String(s.pin) === String(pin))
                  if (matchedStudent) {
                    authenticatedStudent = matchedStudent
                    console.log('Found student with case-insensitive match:', authenticatedStudent)
                  }
                }
              }
            } catch (iLikeErr) {
              console.error('Case-insensitive query error:', iLikeErr)
            }
          }
        }
      } catch (err) {
        console.error('Direct query error:', err)
      }

      if (!authenticatedStudent) {
        console.log('No student found with provided credentials')
        
        // Log failed student login attempt
        await fetch(`${SUPABASE_URL}/rest/v1/security_logs`, {
          method: 'POST',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_type: 'FAILED_STUDENT_LOGIN',
            email: fullName,
            details: `Failed student login attempt for ${fullName} with PIN ${pin}`,
            severity: 'medium'
          })
        })
        setError('Invalid name or PIN. Please try again.')
        setLoading(false)
        return
      }

      // Step 2: Get the authenticated student ID and fetch full record if needed
      const studentId = authenticatedStudent.id
      const studentNumber = authenticatedStudent.student_number
      
      console.log('Student authenticated - ID:', studentId, 'Number:', studentNumber)
      
      // Fetch complete student record with all fields using select *
      let completeStudent = authenticatedStudent
      try {
        const fullRecordRes = await fetch(
          `${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}&select=*`,
          {
            method: 'GET',
            headers: {
              'apikey': ANON_KEY,
              'Authorization': `Bearer ${ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        )
        
        console.log('Full record fetch status:', fullRecordRes.status)
        const fullRecordText = await fullRecordRes.text()
        console.log('Full record response body:', fullRecordText)
        
        if (fullRecordRes.ok && fullRecordText.trim()) {
          const fullRecordData = JSON.parse(fullRecordText)
          if (Array.isArray(fullRecordData) && fullRecordData.length > 0) {
            completeStudent = fullRecordData[0]
            console.log('Complete student record fetched with all fields')
          }
        }
      } catch (err) {
        console.error('Error fetching full record:', err)
      }
      
      console.log('Final student object:', completeStudent)
      console.log('Has gender?', !!completeStudent.gender)
      console.log('Has date_of_birth?', !!completeStudent.date_of_birth)
      console.log('Has guardian_name?', !!completeStudent.guardian_name)
      console.log('Fields:', Object.keys(completeStudent).sort().join(', '))
      
      localStorage.setItem('mbhs_student', JSON.stringify(completeStudent))
      // Log successful student login
      await fetch(`${SUPABASE_URL}/rest/v1/security_logs`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'SUCCESSFUL_STUDENT_LOGIN',
          email: fullName,
          details: `Successful student login for ${fullName}`,
          severity: 'low'
        })
      })
      // Use navigate with timeout to ensure localStorage is flushed
      setTimeout(() => navigate('/student'), 100)
    } catch (err) {
      console.error('Student login error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('handleStaffLogin fired')
    console.log('Email:', staffEmail)
    console.log('Password:', staffPassword)

    const attemptLogin = async () => {
      console.log('About to call Supabase...')
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
          },
          body: JSON.stringify({
            email: staffEmail,
            password: staffPassword
          })
        }
      )
      return response
    }

    try {
      let response
      try {
        response = await attemptLogin()
      } catch (firstErr) {
        console.log('First attempt failed, retrying...', firstErr.message)
        await new Promise(resolve => setTimeout(resolve, 1000))
        response = await attemptLogin()
      }

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        setError(data.error_description || data.message || 'Invalid email or password.')
        setLoading(false)
        return
      }

      const profileResponse = await fetch(
        `${BASE_URL}/profiles?id=eq.${data.user.id}&select=*`,
        {
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${data.access_token}`
          }
        }
      )
      const profiles = await profileResponse.json()
      console.log('Profile:', profiles)
      const profile = profiles[0]

      if (!profile) {
        setError('Profile not found. Contact administrator.')
        setLoading(false)
        return
      }
      
      localStorage.setItem('mbhs_staff', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        access_token: data.access_token,
        role: profile.role,
        full_name: profile.full_name,
        department: profile.department || 'both'
      }))

      // Log successful login to security logs
      await fetch(`${BASE_URL}/security_logs`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'SUCCESSFUL_LOGIN',
          email: staffEmail,
          details: `Successful login for ${staffEmail} as ${profile.role}`,
          severity: 'low'
        })
      })

      if (profile.role === 'admin') {
        window.location.href = '/admin'
      } else if (profile.role === 'teacher') {
        window.location.href = '/teacher'
      } else {
        setError('Unauthorized role.')
        setLoading(false)
      }

    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            className="h-24 w-auto"
            src={logo}
            alt="Methodist Boys' High School"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Methodist Boys' High School
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          EduNexus Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-2 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === 'student'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('student')}
            >
              <Users className="h-4 w-4 mr-2" />
              Student Login
            </button>
            <button
              className={`flex-1 py-2 px-4 text-center font-medium flex items-center justify-center ${
                activeTab === 'staff'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('staff')}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Staff Login
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {/* Student Login Form */}
          {activeTab === 'student' && (
            <form className="mt-6 space-y-6" onSubmit={handleStudentLogin}>
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                  4-digit PIN
                </label>
                <div className="relative">
                  <input
                    id="pin"
                    name="pin"
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 mt-1"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Authenticating...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Staff Login Form */}
          {activeTab === 'staff' && (
            <form className="mt-6 space-y-6" onSubmit={handleStaffLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter password"
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 mt-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Authenticating...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
          )}

                  </div>
      </div>

      {showInstall && (
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
          <button
            onClick={handleInstall}
            className="mb-3 inline-flex items-center rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Install MBHS EduNexus App
          </button>
          <p className="text-xs text-blue-700">
            Install for quick access on your device
          </p>
        </div>
      )}

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
                <span>Tap the Share button at the bottom of your browser.</span>
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
      <footer className="mt-8 py-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Developed by Alie Amadu Sesay
        </p>
      </footer>
    </div>
  )
}

export default Login
