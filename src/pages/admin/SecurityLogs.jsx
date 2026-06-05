import { useState, useEffect } from 'react'
import { Shield, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff } from '../../lib/config'

export default function SecurityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const staff = safeParseStaff() || {}
      const token = staff.access_token || ANON_KEY
      const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
      const res = await fetch(
        `${BASE_URL}/security_logs?select=*&order=created_at.desc&limit=100`,
        { headers }
      )
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching logs:', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.event_type === filter)

  const failedLogins = logs.filter(l => l.event_type === 'FAILED_LOGIN' || l.event_type === 'FAILED_STUDENT_LOGIN').length
  const successLogins = logs.filter(l => l.event_type === 'SUCCESSFUL_LOGIN').length
  const criticalEvents = logs.filter(l => l.severity === 'high' || l.severity === 'critical').length

  const SeverityBadge = ({ severity }) => {
    const colors = {
      low: 'bg-emerald-950 text-emerald-400',
      medium: 'bg-yellow-950 text-yellow-400',
      high: 'bg-orange-950 text-orange-400',
      critical: 'bg-red-950 text-red-400'
    }
    return (
      <span className={`px-2 py-1 rounded-xl text-xs font-semibold uppercase ${colors[severity] || colors.low}`}>
        {severity}
      </span>
    )
  }

  const EventIcon = ({ type }) => {
    if (type === 'SUCCESSFUL_LOGIN') return <CheckCircle size={16} className="text-emerald-400" />
    if (type?.includes('FAILED')) return <XCircle size={16} className="text-red-400" />
    return <AlertCircle size={16} className="text-yellow-400" />
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Security Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor login attempts and security events</p>
        </div>
        <button onClick={fetchLogs}
          className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-emerald-500">
          <p className="text-xs uppercase tracking-wide text-gray-400">Successful Logins</p>
          <p className="text-3xl font-bold text-white mt-1">{successLogins}</p>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <p className="text-xs uppercase tracking-wide text-gray-400">Failed Attempts</p>
          <p className="text-3xl font-bold text-white mt-1">{failedLogins}</p>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <p className="text-xs uppercase tracking-wide text-gray-400">Critical Events</p>
          <p className="text-3xl font-bold text-white mt-1">{criticalEvents}</p>
        </div>
      </div>

      {/* Alert Banner for suspicious activity */}
      {failedLogins >= 5 && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <div>
            <p className="font-semibold text-red-300">Suspicious Activity Detected</p>
            <p className="text-red-400 text-sm">{failedLogins} failed login attempts recorded. Someone may be attempting unauthorized access.</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800 p-4 mb-4 flex gap-2">
        {['all', 'SUCCESSFUL_LOGIN', 'FAILED_LOGIN', 'FAILED_STUDENT_LOGIN'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition ${filter === f ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
            {f === 'all' ? 'All Events' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No security events recorded.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Event</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Email / Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Details</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Severity</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? '' : 'bg-gray-900'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EventIcon type={log.event_type} />
                      <span className="text-gray-300 text-xs">{log.event_type?.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{log.email || 'Not provided'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.details}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={log.severity} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
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
