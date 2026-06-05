import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle, Eye, RefreshCw } from 'lucide-react'
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff} from '../../lib/config'

const getToken = () => {
  const staff = safeParseStaff() || {}
  return staff.access_token || ANON_KEY
}

export default function StudentReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [filterLevel, setFilterLevel] = useState('')
  const [filterClass, setFilterClass] = useState('')

  const staff = safeParseStaff() || {}
  const department = staff.department || 'both'

  useEffect(() => { fetchReports(); fetchFilters() }, [])

  const fetchFilters = async () => {
    const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
    const deptFilter = department === 'both' ? '' : `&department=eq.${department}`
    const [levelsRes, classesRes] = await Promise.all([
      fetch(`${BASE_URL}/levels?select=*&order=name${deptFilter}`, { headers }),
      fetch(`${BASE_URL}/classes?select=*&order=name`, { headers })
    ])
    const levelsData = await levelsRes.json()
    const classesData = await classesRes.json()
    setLevels(Array.isArray(levelsData) ? levelsData : [])
    setClasses(Array.isArray(classesData) ? classesData : [])
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
      unread: 'bg-yellow-950 text-yellow-400',
      read: 'bg-blue-950 text-blue-400',
      resolved: 'bg-emerald-950 text-emerald-400'
    }
    return (
      <span className={`px-2 py-1 rounded-xl text-xs font-semibold capitalize ${styles[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Student Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Reports and complaints submitted by students</p>
        </div>
        <button onClick={fetchReports}
          className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-yellow-500">
          <p className="text-xs uppercase tracking-wide text-gray-400">Unread</p>
          <p className="text-3xl font-bold text-white">{reports.filter(r => r.status === 'unread').length}</p>
        </div>
        <div className="stat-card border-l-4 border-blue-500">
          <p className="text-xs uppercase tracking-wide text-gray-400">Read</p>
          <p className="text-3xl font-bold text-white">{reports.filter(r => r.status === 'read').length}</p>
        </div>
        <div className="stat-card border-l-4 border-emerald-500">
          <p className="text-xs uppercase tracking-wide text-gray-400">Resolved</p>
          <p className="text-3xl font-bold text-white">{reports.filter(r => r.status === 'resolved').length}</p>
        </div>
      </div>

      {/* Alert for unread reports */}
      {unreadCount > 0 && (
        <div className="bg-yellow-950/50 border border-yellow-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <MessageSquare size={20} className="text-yellow-400" />
          <p className="text-yellow-300 font-medium">You have {unreadCount} unread report{unreadCount > 1 ? 's' : ''} from students.</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="form-select">
          <option value="">All Levels</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="form-select">
          <option value="">All Classes</option>
          {classes.filter(c => !filterLevel || c.level_id === filterLevel).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {['all', 'unread', 'read', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${filter === f ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={fetchReports}
          className="bg-gray-900 text-gray-300 px-4 py-2 rounded-xl text-xs font-medium hover:bg-gray-800 transition">
          Apply Filters
        </button>
      </div>

      {/* Reports List and Detail View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reports List */}
        <div className="bg-[#111111] rounded-2xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No reports found.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {reports.map(report => (
                <div
                  key={report.id}
                  onClick={() => { setSelectedReport(report); if (report.status === 'unread') markAsRead(report.id) }}
                  className={`px-4 py-4 cursor-pointer hover:bg-gray-900 transition ${selectedReport?.id === report.id ? 'bg-gray-900 border-l-4 border-white' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className={`text-sm font-semibold ${report.status === 'unread' ? 'text-white' : 'text-gray-400'}`}>
                      {report.subject}
                    </p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="text-xs text-gray-500">{report.student_name} — {report.class_name} ({report.level_name})</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(report.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Detail */}
        <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6">
          {selectedReport ? (
            <>
              <div className="mb-4 pb-4 border-b border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">{selectedReport.subject}</h2>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                  <div><span className="font-medium text-gray-300">Student:</span> {selectedReport.student_name}</div>
                  <div><span className="font-medium text-gray-300">Number:</span> {selectedReport.student_number}</div>
                  <div><span className="font-medium text-gray-300">Class:</span> {selectedReport.class_name}</div>
                  <div><span className="font-medium text-gray-300">Level:</span> {selectedReport.level_name}</div>
                  <div className="col-span-2"><span className="font-medium text-gray-300">Submitted:</span> {new Date(selectedReport.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 mb-2">Message:</p>
                <div className="bg-[#0a0a0a] rounded-xl p-4 text-sm text-gray-300 leading-relaxed">
                  {selectedReport.message}
                </div>
              </div>
              {selectedReport.status !== 'resolved' && (
                <button
                  onClick={() => markAsResolved(selectedReport.id)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
                >
                  <CheckCircle size={16} />
                  Mark as Resolved
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <MessageSquare size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Select a report to view details</p>
            </div>
          )}
        </div>
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
