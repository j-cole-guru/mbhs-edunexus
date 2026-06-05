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
    <div className="bg-[#0a0a0a] min-h-screen p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="text-gray-400 text-sm mt-1">Track all admin actions across the system</p>
        </div>
        <button onClick={fetchAudit}
          className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit records found.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Admin</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Department</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Action</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Details</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? '' : 'bg-gray-900'}>
                  <td className="px-4 py-3 font-medium text-white">{log.admin_email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-xl text-xs font-semibold ${log.admin_department === 'JSS' ? 'bg-blue-950 text-blue-400' : log.admin_department === 'SSS' ? 'bg-purple-950 text-purple-400' : 'bg-gray-900 text-gray-400'}`}>
                      {log.admin_department || 'System'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{log.action}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.details}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="mt-8 py-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-500">
          © 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Developed by Alie Amadu Sesay
        </p>
      </footer>
    </div>
  )
}
