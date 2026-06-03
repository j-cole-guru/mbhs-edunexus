import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Users, GraduationCap, BookOpen, CalendarDays, Plus, ClipboardList, UserCheck, Clock, Layers, ArrowRight, MessageSquare, Trash2, Lock, Eye, EyeOff } from 'lucide-react'
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff} from '../../lib/config'

const getToken = () => {
  const staff = safeParseStaff() || {}
  return staff.access_token || ANON_KEY
}

const AdminDashboard = () => {
  const staff = safeParseStaff() || {}
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
  const [unreadReports, setUnreadReports] = useState(0)

  // States for Department Admin Creation
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminDepartment, setAdminDepartment] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [adminError, setAdminError] = useState('')

  const [allUsers, setAllUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [occupiedDepartments, setOccupiedDepartments] = useState([])

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const checkOccupiedDepartments = async () => {
            try {
      const res = await fetch(
        `${BASE_URL}/profiles?role=eq.admin&select=department`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } }
      )
      const data = await res.json()
      const occupied = data
        .map(d => d.department)
        .filter(d => d === 'JSS' || d === 'SSS')
      setOccupiedDepartments(occupied)
      console.log('Occupied departments:', occupied)
    } catch { setOccupiedDepartments([]) }
  }

  const fetchAllUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch(
        `${BASE_URL}/profiles?select=*&order=created_at.desc`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } }
      )
      const data = await res.json()
      setAllUsers(Array.isArray(data) ? data : [])
    } catch { setAllUsers([]) }
    finally { setUsersLoading(false) }
  }

  const handleDeleteUser = async (userId, userEmail, userDepartment) => {
    if (userDepartment === 'both') {
      alert('Cannot delete the super admin account.')
      return
    }
    if (!window.confirm(`Are you sure you want to permanently delete the account for ${userEmail}? This cannot be undone.`)) return

                try {
      // Delete from profiles
      await fetch(`${BASE_URL}/profiles?id=eq.${userId}`, {
        method: 'DELETE',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      })

      // Delete from Supabase Auth
      await fetch(`${AUTH_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      })

      setAdminSuccess('User deleted successfully.')
      fetchAllUsers()
      checkOccupiedDepartments()
    } catch (err) {
      setAdminError('Failed to delete user: ' + err.message)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch(`${AUTH_URL}/user/update`, {
        method: 'PUT',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: newPassword
        })
      })

      if (!res.ok) {
        const error = await res.json()
        setPasswordError(error.message || 'Failed to change password.')
        return
      }

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordModal(false), 1500)
    } catch (err) {
      setPasswordError('Error changing password: ' + err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchAllUsers()
    checkOccupiedDepartments()

    // Auto restore suspended students whose time has ended
    const autoRestore = async () => {
      try {
        const response = await fetch(`${BASE_URL}/rpc/auto_restore_suspended_students`, {
          method: 'POST',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })
        if (response.ok) {
          console.log('Auto restore check completed')
        } else {
          console.warn('Auto restore RPC returned status:', response.status)
        }
      } catch (err) {
        console.error('Auto restore error:', err)
      }
    }
    autoRestore()
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

        const [jssStudents, sssStudents, jssTeachers, sssTeachers, allClasses, currentTerm, reportsData] = await Promise.all([
          jssLevelIds.length > 0 ? fetch(`${BASE_URL}/students?level_id=in.(${jssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          sssLevelIds.length > 0 ? fetch(`${BASE_URL}/students?level_id=in.(${sssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          jssLevelIds.length > 0 ? fetch(`${BASE_URL}/teachers?level_id=in.(${jssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          sssLevelIds.length > 0 ? fetch(`${BASE_URL}/teachers?level_id=in.(${sssLevelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          fetch(`${BASE_URL}/classes?select=id`, { headers }).then(r => r.json()),
          fetch(`${BASE_URL}/terms?is_current=eq.true&select=name,year`, { headers }).then(r => r.json()),
          fetch(`${BASE_URL}/reports?status=eq.unread&select=id`, { headers }).then(r => r.json()),
        ])
        
        setUnreadReports(Array.isArray(reportsData) ? reportsData.length : 0)

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
        
        const [students, teachers, classes, currentTerm, reportsData] = await Promise.all([
          levelIds.length > 0 ? fetch(`${BASE_URL}/students?level_id=in.(${levelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          levelIds.length > 0 ? fetch(`${BASE_URL}/teachers?level_id=in.(${levelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          levelIds.length > 0 ? fetch(`${BASE_URL}/classes?level_id=in.(${levelIds.join(',')})&select=id`, { headers }).then(r => r.json()) : Promise.resolve([]),
          fetch(`${BASE_URL}/terms?is_current=eq.true&select=name,year`, { headers }).then(r => r.json()),
          fetch(`${BASE_URL}/reports?status=eq.unread&select=id`, { headers }).then(r => r.json())
        ])

        setUnreadReports(Array.isArray(reportsData) ? reportsData.length : 0)

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

            // Check if department already has an admin
    try {
      const checkRes = await fetch(
        `${BASE_URL}/profiles?role=eq.admin&department=eq.${adminDepartment}&select=id,full_name,email`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } }
      )
      const existing = await checkRes.json()
      console.log('Existing admins for department:', existing)

      if (Array.isArray(existing) && existing.length > 0) {
        setAdminError(
          `The ${adminDepartment} department already has an admin assigned (${existing[0].full_name} — ${existing[0].email}). Please delete the existing admin first before assigning a new one.`
        )
        return
      }
    } catch (err) {
      setAdminError('Failed to check department availability. Please try again.')
      return
    }

            console.log('Service key exists:', !!SERVICE_KEY)
    console.log('URL:', SUPABASE_URL)

    try {
      // Step 1 - Create auth account
      const authRes = await fetch(`${AUTH_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            full_name: adminName,
            role: 'admin'
          }
        })
      })

      const authText = await authRes.text()
      console.log('Auth response status:', authRes.status)
      console.log('Auth response:', authText)

      if (!authRes.ok) {
        setAdminError(`Failed to create auth account: ${authText}`)
        return
      }

      const authData = JSON.parse(authText)
      const newUserId = authData.id

      if (!newUserId) {
        setAdminError('Auth account created but no user ID returned.')
        return
      }

      // Step 2 - Insert into profiles
      const profileRes = await fetch(`${BASE_URL}/profiles`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: newUserId,
          full_name: adminName,
          email: adminEmail,
          role: 'admin',
          department: adminDepartment
        })
      })

      const profileText = await profileRes.text()
      console.log('Profile response:', profileText)

      if (!profileRes.ok) {
        setAdminError(`Auth created but profile failed: ${profileText}`)
        return
      }

      setAdminSuccess(`${adminDepartment} Admin created successfully. Email: ${adminEmail}`)
      setAdminName('')
      setAdminEmail('')
      setAdminPassword('')
      setAdminDepartment('')
      fetchAllUsers()
      checkOccupiedDepartments()

    } catch (err) {
      console.error('Create admin error:', err)
      setAdminError('Something went wrong: ' + err.message)
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
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
            <p className="text-xs uppercase tracking-wide text-gray-500">Unread Reports</p>
            <p className="text-3xl font-bold text-gray-900">{unreadReports}</p>
            <p className="text-xs text-yellow-600 mt-1">Student reports pending review</p>
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
              <select
                value={adminDepartment}
                onChange={e => setAdminDepartment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">Select Department</option>
                <option
                  value="JSS"
                  disabled={occupiedDepartments.includes('JSS')}
                  className={occupiedDepartments.includes('JSS') ? 'text-gray-400' : ''}
                >
                  JSS {occupiedDepartments.includes('JSS') ? '(Slot Occupied)' : '(Available)'}
                </option>
                <option
                  value="SSS"
                  disabled={occupiedDepartments.includes('SSS')}
                  className={occupiedDepartments.includes('SSS') ? 'text-gray-400' : ''}
                >
                  SSS {occupiedDepartments.includes('SSS') ? '(Slot Occupied)' : '(Available)'}
                </option>
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

        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900">System Users ({allUsers.length})</h2>
            <button onClick={fetchAllUsers}
              className="text-xs text-blue-900 font-medium hover:underline">
              Refresh
            </button>
          </div>
          {usersLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : allUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Full Name</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Department</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user, i) => (
                    <tr key={user.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.department === 'JSS' ? 'bg-blue-100 text-blue-700' : user.department === 'SSS' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.department || 'Not Assigned'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.department !== 'both' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email, user.department)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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

  // Normal Department Dashboard
  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="page-title">{department} Department Dashboard</h1>
          <p className="text-gray-600 mt-2">School Management Overview</p>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
          title="Change your account password"
        >
          <Lock size={16} /> Change Password
        </button>
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

        <button onClick={() => window.location.href = '/admin/reports'} className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left">
          <div className="flex items-center">
            <div className="stat-icon bg-yellow-100"><MessageSquare className="h-4 w-4 text-yellow-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread Reports</p>
              <p className="text-2xl font-bold text-gray-900">{unreadReports}</p>
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={20} /> Change Password
            </h2>
            
            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-700 text-sm">{passwordSuccess}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  disabled={changingPassword}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                disabled={changingPassword}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
