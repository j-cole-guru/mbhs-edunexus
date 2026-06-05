import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Users, GraduationCap, AlertCircle, Loader2, Eye, EyeOff, Download, X, ArrowLeft } from 'lucide-react'
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-[0.06] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-[0.06] blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <img src="/favicon.png" alt="MBHS" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Methodist Boys' High School</h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase">EduNexus Portal</p>
        </div>
        <a href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-4 transition">
          <ArrowLeft size={14} /> Back to Home
        </a>
        <div className="bg-[#111111] border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-gray-900 rounded-2xl p-1 mb-8 border border-gray-800">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'student' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Student
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Staff
            </button>
          </div>
          {activeTab === 'student' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">4-Digit PIN</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    maxLength={4}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition pr-12"
                  />
                  <button type="button" onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={handleStudentLogin}
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-full font-black text-sm hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          )}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={e => setStaffEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={handleStaffLogin}
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-full font-black text-sm hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          )}
          {showInstall && (
            <div className="mt-6 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-bold">Install App</p>
                <p className="text-gray-500 text-xs">Quick access from home screen</p>
              </div>
              <button onClick={handleInstall}
                className="bg-white text-black px-4 py-2 rounded-full text-xs font-black hover:bg-gray-200 transition">
                Install
              </button>
            </div>
          )}
        </div>
        <footer className="mt-8 text-center">
          <p className="text-gray-700 text-xs">© 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.</p>
          <p className="text-gray-700 text-xs mt-1">Developed by Alie Amadu Sesay</p>
        </footer>
      </div>
    </div>
  )
}

export default Login
