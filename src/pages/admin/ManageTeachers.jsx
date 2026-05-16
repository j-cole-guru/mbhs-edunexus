import React, { useState, useEffect } from 'react'
import { Plus, Trash2, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react'

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y'
const BASE_URL = 'https://tvitevnovhiimpdukebm.supabase.co/rest/v1'
const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    level_id: '',
    class_id: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadData = async () => {
      await fetchLevels()
      await fetchClasses()
      await fetchTeachers()
      setLoading(false)
    }
    loadData()
  }, [])

  const fetchLevels = async () => {
    try {
      const res = await fetch(`${BASE_URL}/levels?select=*`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setLevels(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/classes?select=*`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setClasses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/teachers?select=*&order=created_at.desc`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      })
      const teachers = await res.json()

      const enriched = await Promise.all((Array.isArray(teachers) ? teachers : []).map(async (teacher) => {
        try {
          const [profileRes, classRes, levelRes] = await Promise.all([
            fetch(`${BASE_URL}/profiles?id=eq.${teacher.profile_id}&select=full_name,email`, {
              headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
            }),
            fetch(`${BASE_URL}/classes?id=eq.${teacher.class_id}&select=name`, {
              headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
            }),
            fetch(`${BASE_URL}/levels?id=eq.${teacher.level_id}&select=name`, {
              headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
            })
          ])
          const profile = await profileRes.json()
          const cls = await classRes.json()
          const level = await levelRes.json()
          return {
            ...teacher,
            full_name: profile[0]?.full_name || 'Unknown',
            email: profile[0]?.email || '',
            class_name: cls[0]?.name || 'N/A',
            level_name: level[0]?.name || 'N/A'
          }
        } catch (err) {
          console.error('Error enriching teacher:', err)
          return { ...teacher, full_name: 'Unknown', email: '', class_name: 'N/A', level_name: 'N/A' }
        }
      }))
      setTeachers(enriched)
    } catch (error) {
      console.error('Error fetching teachers:', error)
      setError('Failed to fetch teachers')
      setTeachers([])
    }
  }

  const handleCreateTeacher = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.full_name.trim() || !formData.email || !formData.password || !formData.gender || !formData.level_id || !formData.class_id) {
      setError('All required fields must be filled')
      return
    }

    try {
      // ⚠️ Replace with your service_role key from Supabase Dashboard → Settings → API
      const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE0Nzk0OSwiZXhwIjoyMDkzNzIzOTQ5fQ.39YaOjLVvB6CIKg--T2-97B-F-62t8n-8ZYrhKUQokk'

      // Step 1: Create auth user via admin API (requires service_role key)
      const authRes = await fetch('https://tvitevnovhiimpdukebm.supabase.co/auth/v1/admin/users', {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: { full_name: formData.full_name, role: 'teacher' }
        })
      })
      const authData = await authRes.json()
      if (!authRes.ok || !authData.id) {
        const msg = authData?.message || authData?.msg || JSON.stringify(authData)
        throw new Error(`Auth API error (${authRes.status}): ${msg}`)
      }
      const newUserId = authData.id

      // Step 2: Generate employee number (with fallback)
      const token = getToken()
      let employeeNumber = null
      try {
        const empRes = await fetch(`${BASE_URL}/rpc/generate_employee_number`, {
          method: 'POST',
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const empData = await empRes.json()
        if (typeof empData === 'string' && empData.startsWith('MBHS')) {
          employeeNumber = empData
        }
      } catch (empErr) {
        console.warn('generate_employee_number RPC failed, using fallback:', empErr)
      }
      if (!employeeNumber) {
        const ts = Date.now().toString().slice(-5)
        employeeNumber = `MBHS-EMP-${ts}`
      }

      // Step 3: Insert profile
      const profileRes = await fetch(`${BASE_URL}/profiles`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ id: newUserId, full_name: formData.full_name, email: formData.email, role: 'teacher' })
      })
      if (!profileRes.ok) {
        const profileErr = await profileRes.text()
        throw new Error(`Profile insert failed: ${profileErr}`)
      }

      // Step 4: Insert teacher record
      const teacherRes = await fetch(`${BASE_URL}/teachers`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({
          profile_id: newUserId,
          employee_number: employeeNumber,
          phone: formData.phone,
          gender: formData.gender.toLowerCase(),
          level_id: formData.level_id,
          class_id: formData.class_id
        })
      })
      if (!teacherRes.ok) {
        const teacherErr = await teacherRes.text()
        throw new Error(`Teacher insert failed: ${teacherErr}`)
      }

      setSuccess('Teacher created successfully')
      setFormData({ full_name: '', email: '', password: '', phone: '', gender: '', level_id: '', class_id: '' })
      await fetchTeachers()
    } catch (error) {
      console.error('Error creating teacher:', error)
      setError(error.message || 'Failed to create teacher')
    }
  }


  const handleDeleteTeacher = async (id) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    try {
      const token = getToken()
      await fetch(`${BASE_URL}/teachers?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
      })
      setSuccess('Teacher deleted successfully')
      await fetchTeachers()
    } catch (error) {
      console.error('Error deleting teacher:', error)
      setError('Failed to delete teacher')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Teacher Management</h1>
        <p className="text-gray-600 mt-2">Create and manage teaching staff</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Create New Teacher</h2>
        
        {error && (
          <div className="mb-4 flex items-center error-message">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 flex items-center success-message">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        <form onSubmit={handleCreateTeacher}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full form-select"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
              <select
                value={formData.level_id}
                onChange={(e) => setFormData({ ...formData, level_id: e.target.value, class_id: '' })}
                className="w-full form-select"
                required
              >
                <option value="">Select level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full form-select"
                required
                disabled={!formData.level_id}
              >
                <option value="">Select class</option>
                {classes.filter(cls => cls.level_id === formData.level_id).map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="px-6 py-2 btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create Teacher
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">All Teachers</h2>
        </div>
        
        {teachers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No teachers found. Create your first teacher above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Employee Number</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Gender</th>
                  <th className="table-header">Level</th>
                  <th className="table-header">Class</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.employee_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.gender || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.level_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.class_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDeleteTeacher(teacher.id)} className="text-red-600 hover:text-red-900 flex items-center">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageTeachers
