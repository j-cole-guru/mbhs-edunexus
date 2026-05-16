import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Users, CheckCircle, AlertCircle } from 'lucide-react'

const getAuth = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff'))
  return {
    token: staff?.access_token,
    apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y',
    baseUrl: 'https://tvitevnovhiimpdukebm.supabase.co/rest/v1'
  }
}

const apiFetch = async (endpoint, options = {}) => {
  const { token, apikey, baseUrl } = getAuth()
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers
    }
  })
  const text = await res.text()
  if (!text || text.trim() === '') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const ManageStudents = () => {
  const [students, setStudents] = useState([])
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    full_name: '',
    level_id: '',
    class_id: '',
    date_of_birth: '',
    gender: '',
    guardian_name: '',
    guardian_phone: '',
    pin: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getAdminDepartment = () => {
    const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
    return staff.department || 'both'
  }

  const getDepartmentLevels = async () => {
    const dept = getAdminDepartment()
    const url = dept === 'both'
      ? '/levels?select=*&order=name'
      : `/levels?select=*&department=eq.${dept}&order=name`
    const res = await apiFetch(url)
    return res
  }

  useEffect(() => {
    fetchStudents()
    fetchLevels()
    fetchClasses()
  }, [])

  const fetchStudents = async () => {
    try {
      const levelData = await getDepartmentLevels()
      const levelIds = levelData.map(l => l.id)
      
      if (levelIds.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const data = await apiFetch(`/students?select=*,classes(name),levels(name)&level_id=in.(${levelIds.join(',')})&order=created_at.desc`)
      console.log('Students fetched:', data)
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchLevels = async () => {
    try {
      const data = await getDepartmentLevels()
      setLevels(data)
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  const fetchClasses = async () => {
    try {
      const levelData = await getDepartmentLevels()
      const levelIds = levelData.map(l => l.id)
      
      if (levelIds.length === 0) {
        setClasses([])
        return
      }

      const data = await apiFetch(`/classes?select=*&level_id=in.(${levelIds.join(',')})`)
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      console.log('Creating student with data:', formData)
      
      // Step 1 - Check if PIN already exists
      const staff = JSON.parse(localStorage.getItem('mbhs_staff'))
      const token = staff?.access_token
      const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y'

      const pinCheck = await fetch(
        `https://tvitevnovhiimpdukebm.supabase.co/rest/v1/students?pin=eq.${formData.pin}&select=id`,
        {
          headers: {
            'apikey': apikey,
            'Authorization': `Bearer ${token}` 
          }
        }
      )
      const pinExists = await pinCheck.json()
      if (pinExists && pinExists.length > 0) {
        setError('This PIN is already assigned to another student. Please use a different PIN.')
        setLoading(false)
        return
      }

      // Step 2 - Get auto generated student number
      let studentNumber = null
      try {
        const numRes = await fetch('https://tvitevnovhiimpdukebm.supabase.co/rest/v1/rpc/generate_student_number', {
          method: 'POST',
          headers: {
            'apikey': apikey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })
        const numData = await numRes.json()
        console.log('RPC generate_student_number result:', numData)
        // Only use result if it's a valid string
        if (typeof numData === 'string' && numData.startsWith('MBHS')) {
          studentNumber = numData
        }
      } catch (rpcErr) {
        console.warn('generate_student_number RPC failed, using fallback:', rpcErr)
      }

      // Fallback: generate student number manually
      if (!studentNumber) {
        const ts = Date.now().toString().slice(-6)
        studentNumber = `MBHS-STU-${ts}`
      }
      console.log('Using student number:', studentNumber)

      // Step 3 - Save student to database
      const studentData = {
        full_name: formData.full_name,
        student_number: studentNumber,
        class_id: formData.class_id,
        level_id: formData.level_id,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender.toLowerCase(),
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        pin: formData.pin,
        is_active: true
      }
      console.log('Sending student data:', JSON.stringify(studentData))

      const res = await fetch('https://tvitevnovhiimpdukebm.supabase.co/rest/v1/students', {
        method: 'POST',
        headers: {
          'apikey': apikey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(studentData)
      })

      const responseText = await res.text()
      console.log('Response status:', res.status)
      console.log('Response body:', responseText)

      if (!res.ok) {
        let errorMsg = responseText
        try { errorMsg = JSON.parse(responseText)?.message || responseText } catch {}
        setError('Failed to create student: ' + errorMsg)
        setLoading(false)
        return
      }

      const newStudent = JSON.parse(responseText)
      console.log('Student created:', newStudent)
      setSuccess(`Student created successfully! Name: ${formData.full_name} | PIN: ${formData.pin}`)
      await fetchStudents()
      // Clear form
      setFormData({
        full_name: '',
        level_id: '',
        class_id: '',
        date_of_birth: '',
        gender: '',
        guardian_name: '',
        guardian_phone: '',
        pin: ''
      })
      setLoading(false)
    } catch (error) {
      console.error('Error creating student:', error)
      setError('Failed to create student')
      setLoading(false)
    }
  }

  const handleDeleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return
    }

    try {
      console.log('Deleting student:', id)
      await apiFetch(`/students?id=eq.${id}`, {
        method: 'DELETE'
      })
      console.log('Student deleted successfully')
      setSuccess('Student deleted successfully')
      // Refresh the list
      await fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      setError('Failed to delete student')
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
        <h1 className="page-title">Student Management</h1>
        <p className="text-gray-600 mt-2">Create and manage student records</p>
      </div>

      {/* Create Student Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Create New Student</h2>
        
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

        <form onSubmit={handleCreateStudent}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <select
                value={formData.level_id}
                onChange={(e) => setFormData({ ...formData, level_id: e.target.value, class_id: '' })}
                className="w-full form-select"
                required
              >
                <option value="">Select level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full form-select"
                required
                disabled={!formData.level_id}
              >
                <option value="">Select class</option>
                {classes
                  .filter(cls => cls.level_id === formData.level_id)
                  .map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian Name *
              </label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                placeholder="Enter guardian's name"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian Phone *
              </label>
              <input
                type="tel"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                placeholder="Enter guardian's phone"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4-digit PIN *
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="Enter 4-digit PIN"
                className="w-full form-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Student
          </button>
        </form>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">All Students</h2>
        </div>
        
        {students.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm font-medium">No records found. Please create a student record above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">
                    Student Number
                  </th>
                  <th className="table-header">
                    Name
                  </th>
                  <th className="table-header">
                    Class
                  </th>
                  <th className="table-header">
                    Level
                  </th>
                  <th className="table-header">
                    Gender
                  </th>
                  <th className="table-header">
                    Guardian
                  </th>
                  <th className="table-header text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.student_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {student.classes?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {student.levels?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {student.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {student.guardian_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
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

export default ManageStudents
