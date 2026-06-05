import React, { useState, useEffect } from 'react'
import { Users, BookOpen, Clock, Lock, Eye, EyeOff } from 'lucide-react'
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff} from '../../lib/config'

const getToken = () => {
  const staff = safeParseStaff() || {}
  return staff.access_token || ANON_KEY
}

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null)
  const [students, setStudents] = useState([])
  const [levelName, setLevelName] = useState('')
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const staff = safeParseStaff() || {}
        if (!staff.id) {
          setLoading(false)
          return
        }

        const token = getToken()

        // Fetch teacher record
        const teacherRes = await fetch(`${BASE_URL}/teachers?profile_id=eq.${staff.id}&select=*`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const teacherData = await teacherRes.json()
        if (!Array.isArray(teacherData) || !teacherData[0]) {
          setLoading(false)
          return
        }
        const teacherInfo = teacherData[0]
        setTeacher(teacherInfo)

        // Fetch level and class names
        const [levelRes, classRes] = await Promise.all([
          fetch(`${BASE_URL}/levels?id=eq.${teacherInfo.level_id}&select=name`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${BASE_URL}/classes?id=eq.${teacherInfo.class_id}&select=name`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
          })
        ])
        const levelData = await levelRes.json()
        const classData = await classRes.json()
        setLevelName(Array.isArray(levelData) && levelData[0] ? levelData[0].name : 'Not Assigned')
        setClassName(Array.isArray(classData) && classData[0] ? classData[0].name : 'Not Assigned')

        // Fetch students in teacher's class
        const studentsRes = await fetch(`${BASE_URL}/students?class_id=eq.${teacherInfo.class_id}&select=*&order=full_name.asc`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const studentsData = await studentsRes.json()
        setStudents(Array.isArray(studentsData) ? studentsData : [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Teacher profile not found</p>
      </div>
    )
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
      const res = await fetch(`${AUTH_URL}/user`, {
        method: 'PUT',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
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

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden bg-[#0a0a0a]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="page-title">Teacher Dashboard</h1>
          <p className="body-text mt-2">Manage your class and student activities</p>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="btn-primary flex items-center gap-2"
          title="Change your account password"
        >
          <Lock size={16} /> Change Password
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-text">Class</p>
              <p className="text-2xl font-bold text-white mt-1">{className}</p>
              <p className="text-gray-400 text-sm mt-2">{levelName}</p>
            </div>
            <BookOpen className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-text">Total Students</p>
              <p className="text-2xl font-bold text-white mt-1">{students.length}</p>
            </div>
            <Users className="h-12 w-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-text">Employee Number</p>
              <p className="text-2xl font-bold text-white mt-1">{teacher.employee_number || 'Not provided'}</p>
            </div>
            <Clock className="h-12 w-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="section-title">Class Students</h2>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No students in this class yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="table-header">Student Number</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Gender</th>
                  <th className="table-header">Date of Birth</th>
                  <th className="table-header">Guardian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{student.student_number || 'Not provided'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{student.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{student.gender || 'Not provided'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{student.date_of_birth || 'Not provided'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{student.guardian_name || 'Not provided'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock size={20} /> Change Password
            </h2>
            
            {passwordError && (
              <div className="error-message">
                <p className="text-sm">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="success-message">
                <p className="text-sm">{passwordSuccess}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="form-input"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-400"
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="form-input"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-400"
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirm New Password</label>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-input"
                  disabled={changingPassword}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 btn-primary"
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
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 py-4 border-t border-gray-800 text-center">
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

export default TeacherDashboard
