import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Layers, CheckCircle, AlertCircle } from 'lucide-react'
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

const ManageLevels = () => {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [newLevelName, setNewLevelName] = useState('')
  const [newLevelDepartment, setNewLevelDepartment] = useState('')
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
    const data = await apiFetch(url)
    return data
  }

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    try {
      const data = await getDepartmentLevels()
      console.log('Levels fetched:', data)
      setLevels(data)
    } catch (error) {
      console.error('Error fetching levels:', error)
      setError('Failed to fetch levels')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLevel = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newLevelName.trim()) {
      setError('Level name is required')
      return
    }

    if (!newLevelDepartment) {
      setError('Department is required')
      return
    }

    try {
      console.log('Creating level:', newLevelName.trim(), 'Department:', newLevelDepartment)
      const data = await apiFetch('/levels', {
        method: 'POST',
        body: JSON.stringify({ name: newLevelName.trim(), department: newLevelDepartment }),
        prefer: 'return=representation'
      })
      console.log('Level created successfully:', data)
      setNewLevelName('')
      setNewLevelDepartment('')
      setSuccess('Level created successfully')
      // Refresh the list
      await fetchLevels()
    } catch (error) {
      console.error('Error creating level:', error)
      setError('Failed to create level')
    }
  }

  const handleDeleteLevel = async (id) => {
    if (!confirm('Are you sure you want to delete this level?')) {
      return
    }

    try {
      console.log('Deleting level:', id)
      await apiFetch(`/levels?id=eq.${id}`, {
        method: 'DELETE'
      })
      console.log('Level deleted successfully')
      setSuccess('Level deleted successfully')
      // Refresh the list
      await fetchLevels()
    } catch (error) {
      console.error('Error deleting level:', error)
      setError('Failed to delete level')
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
        <h1 className="page-title">Level Management</h1>
        <p className="text-gray-600 mt-2">Create and manage academic levels (e.g., JSS1, SS2)</p>
      </div>

      {/* Create Level Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Create New Level</h2>
        
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

        <form onSubmit={handleCreateLevel} className="flex gap-4">
          <input
            type="text"
            value={newLevelName}
            onChange={(e) => setNewLevelName(e.target.value)}
            placeholder="Enter level name (e.g., JSS1, SS2)"
            className="flex-1 form-input"
          />
          <select
            value={newLevelDepartment}
            onChange={(e) => setNewLevelDepartment(e.target.value)}
            className="flex-1 form-input"
          >
            <option value="">Select Department</option>
            <option value="JSS">JSS</option>
            <option value="SSS">SSS</option>
          </select>
          <button type="submit"
            className="w-full md:w-auto px-6 py-2 btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Level
          </button>
        </form>
      </div>

      {/* Levels Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">All Levels</h2>
        </div>
        
        {levels.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No levels found. Create your first level above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">\n<table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">
                    Level Name
                  </th>
                  <th className="table-header">
                    Department
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
                {levels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {level.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {level.department || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(level.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteLevel(level.id)}
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

export default ManageLevels
