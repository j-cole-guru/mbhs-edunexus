import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle, Eye, RefreshCw } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getToken = () => JSON.parse(localStorage.getItem('mbhs_staff') || '{}').access_token || ANON_KEY

export default function StudentReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [filterLevel, setFilterLevel] = useState('')
  const [filterClass, setFilterClass] = useState('')

  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  const department = staff.department || 'both'

  useEffect(() => { fetchReports(); fetchFilters() }, [])

  const fetchFilters = async () => {
    const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
    const deptFilter = department === 'both' ? '' : `&department=eq.${department}`
    const [levelsRes, classesRes] = await Promise.all([
      fetch(`${BASE_URL}/levels?select=*&order=name${deptFilter}`, { headers }),
      fetch(`${BASE_URL}/classes?select=*&order=name`, { headers })
    ])
    setLevels(await levelsRes.json())
    setClasses(await classesRes.json())
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      let url = `${BASE_URL}/reports?select=*&order=created_at.desc`
      if (filterLevel) url += `&level_id=eq.${filterLevel}`
      if (filterClass) url += `&class_id=eq.${filterClass}`
      if (filter !== 'all') url += `&status=eq.${filter}`
      const res = await fetch(url, { headers })
      const data = await res.json()
      setReports(Array.isArray(data) ? data : [])
    } catch { setReports([]) }
    finally { setLoading(false) }
  }

  const markAsRead = async (reportId) => {
    const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
    await fetch(`${BASE_URL}/reports?id=eq.${reportId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'read' })
    })
    fetchReports()
  }

  const markAsResolved = async (reportId) => {
    const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
    await fetch(`${BASE_URL}/reports?id=eq.${reportId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'resolved' })
    })
    setSelectedReport(null)
    fetchReports()
  }

  const unreadCount = reports.filter(r => r.status === 'unread').length

  const StatusBadge = ({ status }) => {
    const styles = {
      unread: 'bg-yellow-100 text-yellow-700',
      read: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${styles[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Reports and complaints submitted by students</p>
        </div>
        <button onClick={fetchReports}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
          <p className="text-xs uppercase tracking-wide text-gray-500">Unread</p>
          <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.status === 'unread').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
          <p className="text-xs uppercase tracking-wide text-gray-500">Read</p>
          <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.status === 'read').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <p className="text-xs uppercase tracking-wide text-gray-500">Resolved</p>
          <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.status === 'resolved').length}</p>
        </div>
      </div>

      {/* Alert for unread reports */}
      {unreadCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <MessageSquare size={20} className="text-yellow-600" />
          <p className="text-yellow-800 font-medium">You have {unreadCount} unread report{unreadCount > 1 ? 's' : ''} from students.</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
          <option value="">All Levels</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
          <option value="">All Classes</option>
          {classes.filter(c => !filterLevel || c.level_id === filterLevel).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {['all', 'unread', 'read', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={fetchReports}
          className="bg-black text-white px-4 py-2 rounded-lg text-xs font-medium">
          Apply Filters
        </button>
      </div>

      {/* Reports List and Detail View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reports List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No reports found.</div>
          ) : (
            <div className="divide-y">
              {reports.map(report => (
                <div
                  key={report.id}
                  onClick={() => { setSelectedReport(report); if (report.status === 'unread') markAsRead(report.id) }}
                  className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition ${selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-blue-900' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className={`text-sm font-semibold ${report.status === 'unread' ? 'text-gray-900' : 'text-gray-600'}`}>
                      {report.subject}
                    </p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="text-xs text-gray-500">{report.student_name} — {report.class_name} ({report.level_name})</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(report.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Detail */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedReport ? (
            <>
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">{selectedReport.subject}</h2>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div><span className="font-medium">Student:</span> {selectedReport.student_name}</div>
                  <div><span className="font-medium">Number:</span> {selectedReport.student_number}</div>
                  <div><span className="font-medium">Class:</span> {selectedReport.class_name}</div>
                  <div><span className="font-medium">Level:</span> {selectedReport.level_name}</div>
                  <div className="col-span-2"><span className="font-medium">Submitted:</span> {new Date(selectedReport.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-2">Message:</p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 leading-relaxed">
                  {selectedReport.message}
                </div>
              </div>
              {selectedReport.status !== 'resolved' && (
                <button
                  onClick={() => markAsResolved(selectedReport.id)}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <CheckCircle size={16} />
                  Mark as Resolved
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <MessageSquare size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Select a report to view details</p>
            </div>
          )}
        </div>
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
