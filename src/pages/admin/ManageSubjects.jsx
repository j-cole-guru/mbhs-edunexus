import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Library, CheckCircle, AlertCircle } from 'lucide-react'

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

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    level_id: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchLevels()
    fetchSubjects()
  }, [])

  const fetchLevels = async () => {
    try {
      const data = await apiFetch('/levels?select=*')
      setLevels(data)
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const data = await apiFetch('/subjects?select=*,levels(name)&order=created_at.desc')
      console.log('Subjects fetched:', data)
      setSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
      setError('Failed to fetch subjects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubject = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim() || !formData.level_id) {
      setError('Subject name and level are required')
      return
    }

    try {
      console.log('Creating subject:', formData)
      const data = await apiFetch('/subjects', {
        method: 'POST',
        body: JSON.stringify(formData),
        prefer: 'return=representation'
      })
      console.log('Subject created successfully:', data)
      setFormData({ name: '', level_id: '' })
      setSuccess('Subject created successfully')
      // Refresh the list
      await fetchSubjects()
    } catch (error) {
      console.error('Error creating subject:', error)
      setError('Failed to create subject')
    }
  }

  const handleDeleteSubject = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) {
      return
    }

    try {
      console.log('Deleting subject:', id)
      await apiFetch(`/subjects?id=eq.${id}`, {
        method: 'DELETE'
      })
      console.log('Subject deleted successfully')
      setSuccess('Subject deleted successfully')
      // Refresh the list
      await fetchSubjects()
    } catch (error) {
      console.error('Error deleting subject:', error)
      setError('Failed to delete subject')
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
        <h1 className="page-title">Subject Management</h1>
        <p className="text-gray-600 mt-2">Create and manage subjects for different academic levels</p>
      </div>

      {/* Create Subject Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Create New Subject</h2>
        
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

        <form onSubmit={handleCreateSubject}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter subject name (e.g., Mathematics, English)"
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
          <button
            type="submit"
            className="px-6 py-2 btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Subject
          </button>
        </form>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">All Subjects</h2>
        </div>
        
        {subjects.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Library className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No subjects found. Create your first subject above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">
                    Subject Name
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
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subject.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {subject.levels?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(subject.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSubject(subject.id)}
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

export default ManageSubjects
