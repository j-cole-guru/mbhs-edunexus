import { useState, useEffect } from 'react'
import { FileText, RefreshCw } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff } from '../../lib/config'

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAudit() }, [])

  const fetchAudit = async () => {
    setLoading(true)
    try {
      const staff = safeParseStaff() || {}
      const token = staff.access_token || ANON_KEY
      const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
      const res = await fetch(
        `${BASE_URL}/audit_trail?select=*&order=created_at.desc&limit=100`,
        { headers }
      )
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-500 text-sm mt-1">Track all admin actions across the system</p>
        </div>
        <button onClick={fetchAudit}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit records found.</div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg shadow">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Admin</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Department</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Action</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Details</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.admin_email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${log.admin_department === 'JSS' ? 'bg-blue-100 text-blue-700' : log.admin_department === 'SSS' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {log.admin_department || 'System'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.action}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.details}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
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
