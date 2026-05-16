import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Users, GraduationCap, BookOpen, CalendarDays, Plus, ClipboardList, UserCheck, Clock, Layers, ArrowRight } from 'lucide-react'

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0Nzk0OSwiZXhwIjoyMDkzNzIzOTQ5fQ.39YaOjLVvB6CIKg--T2-97B-F-62t8n-8ZYrhKUQokk'
const BASE_URL = 'https://tvitevnovhiimpdukebm.supabase.co/rest/v1'

const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const AdminDashboard = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  const department = staff.department || 'both'
  const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  }

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    jssLevels: [], sssLevels: [],
    jssStudents: [], sssStudents: [],
    jssTeachers: [], sssTeachers: [],
    allClasses: [], currentTerm: []
  })

  // States for Department Admin Creation
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminDepartment, setAdminDepartment] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      if (department === 'both') {
        const [jssLevels, sssLevels] = await Promise.all([
          fetch(`${BASE_URL}/levels?select=id&department=eq.JSS`, { headers }).then(r => r.json()),
          fetch(`${BASE_URL}/levels?select=id&department=eq.SSS`, { headers }).then(r => r.json()),
        ])

        const jssLevelIds = jssLevels.map(l => l.id)
        const sssLevelIds = sssLevels.map(l => l.id)

        const [jssStudents, sssStudents, jssTeachers, sssTeachers, allClasses, currentTerm] = await Promise.all([
          jssLevelIds.length > 0 ? fetch(`${BASE_URL}/students?level_id=in.(${jssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          sssLevelIds.length > 0 ? fetch(`${BASE_URL}/students?level_id=in.(${sssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          jssLevelIds.length > 0 ? fetch(`${BASE_URL}/teachers?level_id=in.(${jssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          sssLevelIds.length > 0 ? fetch(`${BASE_URL}/teachers?level_id=in.(${sssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          fetch(`${BASE_URL}/classes?select=id`, { headers }).then(r => r.json()),
          fetch(`${BASE_URL}/terms?is_current=eq.true&select=name,year`, { headers }).then(r => r.json()),
        ])

        setStats({
          jssLevels, sssLevels,
          jssStudents: Array.isArray(jssStudents) ? jssStudents : [],
          sssStudents: Array.isArray(sssStudents) ? sssStudents : [],
          jssTeachers: Array.isArray(jssTeachers) ? jssTeachers : [],
          sssTeachers: Array.isArray(sssTeachers) ? sssTeachers : [],
          allClasses: Array.isArray(allClasses) ? allClasses : [],
          currentTerm: Array.isArray(currentTerm) ? currentTerm : []
        })
      } else {
        // Normal department stats
        const levels = await fetch(`${BASE_URL}/levels?select=id&department=eq.${department}`, { headers }).then(r => r.json())
        const levelIds = levels.map(l => l.id)
        
        const [students, teachers, classes, currentTerm] = await Promise.all([
          levelIds.length > 0 ? fetch(`${BASE_URL}/students?level_id=in.(${levelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          levelIds.length > 0 ? fetch(`${BASE_URL}/teachers?level_id=in.(${levelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          levelIds.length > 0 ? fetch(`${BASE_URL}/classes?level_id=in.(${levelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          fetch(`${BASE_URL}/terms?is_current=eq.true&select=name,year`, { headers }).then(r => r.json())
        ])

        setStats({
          levels,
          students: Array.isArray(students) ? students : [],
          teachers: Array.isArray(teachers) ? teachers : [],
          classes: Array.isArray(classes) ? classes : [],
          currentTerm: Array.isArray(currentTerm) ? currentTerm : []
        })
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!adminName || !adminEmail || !adminPassword || !adminDepartment) {
      setAdminError('All fields are required.')
      return
    }
    setAdminError('')
    setAdminSuccess('')
    try {
      const authRes = await fetch('https://tvitevnovhiimpdukebm.supabase.co/auth/v1/admin/users', {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: adminName, role: 'admin' }
        })
      })
      const authData = await authRes.json()
      
      if (!authRes.ok) throw new Error(authData.message || 'Auth creation failed')

      await fetch(`${BASE_URL}/profiles`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: authData.id,
          full_name: adminName,
          email: adminEmail,
          role: 'admin',
          department: adminDepartment
        })
      })
      setAdminSuccess(`${adminDepartment} Admin created. Email: ${adminEmail}`)
      setAdminName('')
      setAdminEmail('')
      setAdminPassword('')
      setAdminDepartment('')
    } catch (err) {
      console.error('Admin Creation Error:', err)
      setAdminError(err.message || 'Failed to create admin account.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (department === 'both') {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">System Monitor</h1>
          <p className="text-gray-500 mt-1">Methodist Boys' High School — EduNexus System Overview</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black text-white rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total Students</p>
            <p className="text-3xl font-bold mt-1">{stats.jssStudents.length + stats.sssStudents.length}</p>
          </div>
          <div className="bg-blue-900 text-white rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-blue-300">Total Teachers</p>
            <p className="text-3xl font-bold mt-1">{stats.jssTeachers.length + stats.sssTeachers.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Classes</p>
            <p className="text-3xl font-bold mt-1 text-gray-900">{stats.allClasses.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Current Term</p>
            <p className="text-lg font-bold mt-1 text-gray-900">{stats.currentTerm[0] ? `${stats.currentTerm[0].name} ${stats.currentTerm[0].year}` : 'Not Set'}</p>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">JSS Department</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Students</span>
                <span className="font-bold text-gray-900">{stats.jssStudents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Teachers</span>
                <span className="font-bold text-gray-900">{stats.jssTeachers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Levels</span>
                <span className="font-bold text-gray-900">{stats.jssLevels.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">SSS Department</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Students</span>
                <span className="font-bold text-gray-900">{stats.sssStudents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Teachers</span>
                <span className="font-bold text-gray-900">{stats.sssTeachers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Levels</span>
                <span className="font-bold text-gray-900">{stats.sssLevels.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Create Department Admin Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Department Administrators</h2>
          <p className="text-sm text-gray-500 mb-4">Create admin accounts for JSS and SSS departments.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)}
                placeholder="Enter full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
              <select value={adminDepartment} onChange={e => setAdminDepartment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                <option value="">Select Department</option>
                <option value="JSS">JSS</option>
                <option value="SSS">SSS</option>
              </select>
            </div>
          </div>
          <button onClick={handleCreateAdmin}
            className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
            Create Department Admin
          </button>
          {adminSuccess && <p className="text-green-600 text-sm mt-3">{adminSuccess}</p>}
          {adminError && <p className="text-red-600 text-sm mt-3">{adminError}</p>}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          © 2026 All Rights Reserved | Developed by Alie Amadu Sesay
        </div>
      </div>
    )
  }

  // Normal Department Dashboard
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="page-title">{department} Department Dashboard</h1>
        <p className="text-gray-600 mt-2">School Management Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button onClick={() => window.location.href = '/admin/students'} className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left">
          <div className="flex items-center">
            <div className="stat-icon bg-blue-100"><Users className="h-4 w-4 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.students?.length || 0}</p>
            </div>
          </div>
        </button>

        <button onClick={() => window.location.href = '/admin/teachers'} className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left">
          <div className="flex items-center">
            <div className="stat-icon bg-green-100"><GraduationCap className="h-4 w-4 text-green-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.teachers?.length || 0}</p>
            </div>
          </div>
        </button>

        <button onClick={() => window.location.href = '/admin/classes'} className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left">
          <div className="flex items-center">
            <div className="stat-icon bg-purple-100"><BookOpen className="h-4 w-4 text-purple-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.classes?.length || 0}</p>
            </div>
          </div>
        </button>

        <button onClick={() => window.location.href = '/admin/terms'} className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left">
          <div className="flex items-center">
            <div className="stat-icon bg-orange-100"><CalendarDays className="h-4 w-4 text-orange-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Term</p>
              <p className="text-lg font-bold text-gray-900">{stats.currentTerm[0] ? stats.currentTerm[0].name : 'Not Set'}</p>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => window.location.href = '/admin/students'} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
            <Plus className="h-6 w-6 mb-2 text-blue-600" />
            <span className="font-medium text-gray-900">Add New Student</span>
          </button>
          <button onClick={() => window.location.href = '/admin/results'} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
            <ClipboardList className="h-6 w-6 mb-2 text-green-600" />
            <span className="font-medium text-gray-900">Enter Results</span>
          </button>
          <button onClick={() => window.location.href = '/admin/attendance'} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
            <UserCheck className="h-6 w-6 mb-2 text-purple-600" />
            <span className="font-medium text-gray-900">Check Attendance</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
