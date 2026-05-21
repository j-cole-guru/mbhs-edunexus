import React, { useState, useEffect } from 'react'
import { Plus, Trash2, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getAuth = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff'))
  return {
    token: staff?.access_token,
    apikey: ANON_KEY,
    baseUrl: `${SUPABASE_URL}/rest/v1`
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

const ManageClasses = () => {
  const [classes, setClasses] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    level_id: ''
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
    fetchLevels()
    fetchClasses()
  }, [])

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
        setLoading(false)
        return
      }

      const data = await apiFetch(`/classes?select=*,levels(name)&level_id=in.(${levelIds.join(',')})&order=created_at.desc`)
      console.log('Classes fetched:', data)
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
      setError('Failed to fetch classes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim() || !formData.level_id) {
      setError('Class name and level are required')
      return
    }

    try {
      console.log('Creating class:', formData)
      const data = await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify(formData),
        prefer: 'return=representation'
      })
      console.log('Class created successfully:', data)
      setFormData({ name: '', level_id: '' })
      setSuccess('Class created successfully')
      // Refresh the list
      await fetchClasses()
    } catch (error) {
      console.error('Error creating class:', error)
      setError('Failed to create class')
    }
  }

  const handleDeleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) {
      return
    }

    try {
      console.log('Deleting class:', id)
      await apiFetch(`/classes?id=eq.${id}`, {
        method: 'DELETE'
      })
      console.log('Class deleted successfully')
      setSuccess('Class deleted successfully')
      // Refresh the list
      await fetchClasses()
    } catch (error) {
      console.error('Error deleting class:', error)
      setError('Failed to delete class')
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
        <h1 className="page-title">Class Management</h1>
        <p className="text-gray-600 mt-2">Create and manage classes within academic levels</p>
      </div>

      {/* Create Class Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Create New Class</h2>
        
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

        <form onSubmit={handleCreateClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter class name (e.g., JSS1A, SS2B)"
                className="w-full form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={formData.level_id}
                onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                className="w-full form-select"
              >
                <option value="">Select a level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit"
            className="w-full md:w-auto px-6 py-2 btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </button>
        </form>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">All Classes</h2>
        </div>
        
        {classes.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No classes found. Create your first class above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">\n<table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">
                    Class Name
                  </th>
                  <th className="table-header">
                    Level
                  </th>
                  <th className="table-header">
                    Created At
                  </th>
                  <th className="table-header text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cls.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {cls.levels?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(cls.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>\n</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageClasses
