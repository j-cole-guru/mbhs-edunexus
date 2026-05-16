import { useState, useEffect } from 'react'
import { UserCog, Trash2, Plus } from 'lucide-react'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY
const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`

const getToken = () => JSON.parse(localStorage.getItem('mbhs_staff') || '{}').access_token || ANON_KEY
const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchAdmins() }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/profiles?role=eq.admin&select=*&order=created_at.desc`, { headers })
      const data = await res.json()
      setAdmins(Array.isArray(data) ? data : [])
    } catch { setAdmins([]) }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!name || !email || !password || !department) { setError('All fields required.'); return }
    setError(''); setSuccess('')
    try {
      const authRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: name, role: 'admin' } })
      })
      const authData = await authRes.json()
      
      if (!authRes.ok) throw new Error(authData.message || 'Auth creation failed')

      await fetch(`${BASE_URL}/profiles`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ id: authData.id, full_name: name, email, role: 'admin', department })
      })
      setSuccess(`${department} Admin created successfully.`)
      setName(''); setEmail(''); setPassword(''); setDepartment('')
      fetchAdmins()
    } catch (err) { 
      console.error('Admin creation error:', err)
      setError(err.message || 'Failed to create admin.') 
    }
  }

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!window.confirm(`Are you sure you want to delete the admin account for ${adminEmail}? This cannot be undone.`)) return
    try {
      await fetch(`${BASE_URL}/profiles?id=eq.${adminId}`, {
        method: 'DELETE',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      })
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users/${adminId}`, {
        method: 'DELETE',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
      })
      setSuccess('Admin account deleted successfully.')
      fetchAdmins()
    } catch {
      setError('Failed to delete admin account.')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Administrators</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Department Admin</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">Select Department</option>
              <option value="JSS">JSS</option>
              <option value="SSS">SSS</option>
            </select>
          </div>
        </div>
        <button onClick={handleCreate}
          className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          <Plus size={16} /> Create Admin
        </button>
        {success && <p className="text-green-600 text-sm mt-3">{success}</p>}
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">All Administrators ({admins.length})</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Full Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Department</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Created</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, i) => (
                <tr key={admin.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{admin.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${admin.department === 'JSS' ? 'bg-blue-100 text-blue-700' : admin.department === 'SSS' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {admin.department || 'System'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {admin.department !== 'both' && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
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
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        © 2026 All Rights Reserved | Developed by Alie Amadu Sesay
      </div>
    </div>
  )
}
