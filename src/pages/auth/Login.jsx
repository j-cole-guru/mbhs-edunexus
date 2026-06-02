import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Users, GraduationCap, AlertCircle, Loader2, Eye, EyeOff, Download } from 'lucide-react'
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

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
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
      console.log('Attempting student login with:', fullName)
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/student_login_by_name`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_full_name: fullName,
          p_pin: pin
        })
      })
      const data = await res.json()
      console.log('Student login result:', data)

      if (!res.ok || data.error || !Array.isArray(data) || data.length === 0) {
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
            details: `Failed student login attempt for ${fullName}`,
            severity: 'medium'
          })
        })
        setError('Invalid name or PIN. Please try again.')
        setLoading(false)
        return
      }

      // Fetch complete student record to ensure all fields are present
      const rpcStudent = data[0]
      console.log('RPC student data:', rpcStudent)
      console.log('RPC student ID:', rpcStudent.id)
      
      const studentId = rpcStudent.id
      const studentNumber = rpcStudent.student_number
      
      // Try multiple fetch strategies to get complete record
      let completeStudent = { ...rpcStudent }
      
      // Strategy 1: Direct fetch by ID with all fields
      try {
        const fullRecordRes = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
          method: 'GET',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        if (fullRecordRes.ok) {
          const fullRecordData = await fullRecordRes.json()
          console.log('Full record fetch by ID response:', fullRecordData)
          if (Array.isArray(fullRecordData) && fullRecordData.length > 0) {
            completeStudent = fullRecordData[0]
            console.log('Successfully fetched complete student record by ID')
          }
        } else {
          console.log('Full record fetch by ID failed with status:', fullRecordRes.status)
        }
      } catch (err) {
        console.error('Error fetching full record by ID:', err)
      }
      
      // Strategy 2: If still missing fields, fetch by student_number
      if (!completeStudent.gender || !completeStudent.date_of_birth) {
        try {
          console.log('Fetching additional fields by student_number:', studentNumber)
          const additionalRes = await fetch(`${SUPABASE_URL}/rest/v1/students?student_number=eq.${studentNumber}`, {
            method: 'GET',
            headers: {
              'apikey': ANON_KEY,
              'Authorization': `Bearer ${ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          })
          if (additionalRes.ok) {
            const additionalData = await additionalRes.json()
            console.log('Fetch by student_number response:', additionalData)
            if (Array.isArray(additionalData) && additionalData.length > 0) {
              completeStudent = { ...completeStudent, ...additionalData[0] }
              console.log('Merged additional fields from student_number query')
            }
          } else {
            console.log('Fetch by student_number failed with status:', additionalRes.status)
          }
        } catch (err) {
          console.error('Error fetching by student_number:', err)
        }
      }
      
      console.log('Final student data to store:', completeStudent)
      console.log('Fields in stored data:', Object.keys(completeStudent).sort())
      
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
