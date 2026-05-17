import { useState, useEffect } from 'react'
import { Shield, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }

export default function SecurityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
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
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${colors[severity] || colors.low}`}>
        {severity}
      </span>
    )
  }

  const EventIcon = ({ type }) => {
    if (type === 'SUCCESSFUL_LOGIN') return <CheckCircle size={16} className="text-green-500" />
    if (type?.includes('FAILED')) return <XCircle size={16} className="text-red-500" />
    return <AlertCircle size={16} className="text-yellow-500" />
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor login attempts and security events</p>
        </div>
        <button onClick={fetchLogs}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <p className="text-xs uppercase tracking-wide text-gray-500">Successful Logins</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{successLogins}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
          <p className="text-xs uppercase tracking-wide text-gray-500">Failed Attempts</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{failedLogins}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
          <p className="text-xs uppercase tracking-wide text-gray-500">Critical Events</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{criticalEvents}</p>
        </div>
      </div>

      {/* Alert Banner for suspicious activity */}
      {failedLogins >= 5 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Suspicious Activity Detected</p>
            <p className="text-red-600 text-sm">{failedLogins} failed login attempts recorded. Someone may be attempting unauthorized access.</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-2">
        {['all', 'SUCCESSFUL_LOGIN', 'FAILED_LOGIN', 'FAILED_STUDENT_LOGIN'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'All Events' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No security events recorded.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Event</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Email / Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Details</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Severity</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <EventIcon type={log.event_type} />
                      <span className="text-gray-700 text-xs">{log.event_type?.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.email || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.details}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={log.severity} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(log.created_at).toLocaleString()}
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
