import { useState, useEffect } from 'react'
import { Activity, CheckCircle, AlertCircle, Database, Users, Server, Upload } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff } from '../../lib/config'

export default function SystemHealth() {
  const [health, setHealth] = useState({
    database: 'checking',
    auth: 'checking',
    storage: 'checking',
    api: 'checking',
    students: 'checking',
    teachers: 'checking',
    classes: 'checking',
    levels: 'checking',
    terms: 'checking',
    results: 'checking',
    attendance: 'checking',
    timetable: 'checking',
    reports: 'checking',
    security_logs: 'checking',
    audit_trail: 'checking',
    profiles: 'checking'
  })
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalResults: 0,
    totalAttendance: 0,
    totalAdmins: 0,
    totalLevels: 0,
    totalTerms: 0,
    totalReports: 0,
    totalAuditLogs: 0
  })
  const [lastChecked, setLastChecked] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { runHealthCheck() }, [])

  const getHeaders = () => {
    const staff = safeParseStaff() || {}
    const token = staff.access_token || ANON_KEY
    return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
  }

  const runHealthCheck = async () => {
    setLoading(true)
    const newHealth = {
      database: 'checking', auth: 'checking', api: 'checking', storage: 'checking',
      students: 'checking', teachers: 'checking', classes: 'checking', levels: 'checking',
      terms: 'checking', results: 'checking', attendance: 'checking', timetable: 'checking',
      reports: 'checking', security_logs: 'checking', audit_trail: 'checking', profiles: 'checking'
    }
    const headers = getHeaders()

    try {
      const dbRes = await fetch(`${BASE_URL}/students?select=id&limit=1`, { headers })
      newHealth.database = dbRes.ok ? 'healthy' : 'error'
    } catch { newHealth.database = 'error' }

    try {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { 'apikey': ANON_KEY }
      })
      newHealth.auth = authRes.ok ? 'healthy' : 'error'
    } catch { newHealth.auth = 'error' }

    try {
      const apiRes = await fetch(`${BASE_URL}/profiles?select=id&limit=1`, { headers })
      newHealth.api = apiRes.ok ? 'healthy' : 'error'
    } catch { newHealth.api = 'error' }

    try {
      const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
      })
      newHealth.storage = storageRes.ok ? 'healthy' : 'error'
    } catch { newHealth.storage = 'error' }

    setHealth(newHealth)

    try {
      const [students, teachers, classes, results, attendance, admins, levels, terms, reports, audit, tblTim, tblProf] = await Promise.allSettled([
        fetch(`${BASE_URL}/students?select=id`, { headers }),
        fetch(`${BASE_URL}/teachers?select=id`, { headers }),
        fetch(`${BASE_URL}/classes?select=id`, { headers }),
        fetch(`${BASE_URL}/results?select=id`, { headers }),
        fetch(`${BASE_URL}/attendance?select=id`, { headers }),
        fetch(`${BASE_URL}/profiles?role=eq.admin&select=id`, { headers }),
        fetch(`${BASE_URL}/levels?select=id`, { headers }),
        fetch(`${BASE_URL}/terms?select=id`, { headers }),
        fetch(`${BASE_URL}/reports?select=id`, { headers }),
        fetch(`${BASE_URL}/audit_trail?select=id`, { headers }),
        fetch(`${BASE_URL}/timetable?select=id&limit=1`, { headers }),
        fetch(`${BASE_URL}/profiles?select=id&limit=1`, { headers }),
      ])

      const settled = async (result) => result.status === 'fulfilled' && result.value.ok ? result.value.json() : []
      const stData = await settled(students)
      const teData = await settled(teachers)
      const clData = await settled(classes)
      const reData = await settled(results)
      const atData = await settled(attendance)
      const adData = await settled(admins)
      const lvData = await settled(levels)
      const tmData = await settled(terms)
      const rpData = await settled(reports)
      const auData = await settled(audit)

      setStats({
        totalStudents: Array.isArray(stData) ? stData.length : 0,
        totalTeachers: Array.isArray(teData) ? teData.length : 0,
        totalClasses: Array.isArray(clData) ? clData.length : 0,
        totalResults: Array.isArray(reData) ? reData.length : 0,
        totalAttendance: Array.isArray(atData) ? atData.length : 0,
        totalAdmins: Array.isArray(adData) ? adData.length : 0,
        totalLevels: Array.isArray(lvData) ? lvData.length : 0,
        totalTerms: Array.isArray(tmData) ? tmData.length : 0,
        totalReports: Array.isArray(rpData) ? rpData.length : 0,
        totalAuditLogs: Array.isArray(auData) ? auData.length : 0,
      })

      newHealth.students = students.status === 'fulfilled' && students.value.ok ? 'healthy' : 'error'
      newHealth.teachers = teachers.status === 'fulfilled' && teachers.value.ok ? 'healthy' : 'error'
      newHealth.classes = classes.status === 'fulfilled' && classes.value.ok ? 'healthy' : 'error'
      newHealth.levels = levels.status === 'fulfilled' && levels.value.ok ? 'healthy' : 'error'
      newHealth.terms = terms.status === 'fulfilled' && terms.value.ok ? 'healthy' : 'error'
      newHealth.results = results.status === 'fulfilled' && results.value.ok ? 'healthy' : 'error'
      newHealth.attendance = attendance.status === 'fulfilled' && attendance.value.ok ? 'healthy' : 'error'
      newHealth.timetable = tblTim.status === 'fulfilled' && tblTim.value.ok ? 'healthy' : 'error'
      newHealth.reports = reports.status === 'fulfilled' && reports.value.ok ? 'healthy' : 'error'
      newHealth.security_logs = audit.status === 'fulfilled' && audit.value.ok ? 'healthy' : 'error'
      newHealth.audit_trail = audit.status === 'fulfilled' && audit.value.ok ? 'healthy' : 'error'
      newHealth.profiles = tblProf.status === 'fulfilled' && tblProf.value.ok ? 'healthy' : 'error'
    } catch (err) { console.error('Stats error:', err) }

    setHealth({ ...newHealth })
    setLastChecked(new Date().toLocaleTimeString())
    setLoading(false)
  }

  const StatusBadge = ({ status }) => {
    if (status === 'checking') return (
      <span className="flex items-center gap-1 px-3 py-1 bg-gray-900 text-gray-400 rounded-full text-xs font-medium">
        <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
        Checking
      </span>
    )
    if (status === 'healthy') return (
      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full text-xs font-medium">
        <CheckCircle size={12} /> Operational
      </span>
    )
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-red-950 text-red-400 rounded-full text-xs font-medium">
        <AlertCircle size={12} /> Error
      </span>
    )
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">System Health</h1>
          <p className="text-gray-400 text-sm mt-1">
            {lastChecked ? `Last checked at ${lastChecked}` : 'Running health check...'}
          </p>
        </div>
        <button onClick={runHealthCheck}
          className="btn-primary flex items-center gap-2">
          <Activity size={16} />
          Run Check
        </button>
      </div>

      {/* Core Services */}
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Core Services</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Database', key: 'database', icon: <Database size={20} /> },
          { label: 'Authentication', key: 'auth', icon: <Users size={20} /> },
          { label: 'REST API', key: 'api', icon: <Server size={20} /> },
          { label: 'Storage', key: 'storage', icon: <Upload size={20} /> },
        ].map(service => (
          <div key={service.key} className="bg-[#111111] rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              {service.icon}
              <span className="font-medium text-sm">{service.label}</span>
            </div>
            <StatusBadge status={health[service.key]} />
          </div>
        ))}
      </div>

      {/* Database Tables */}
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Database Tables</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Students', key: 'students' },
          { label: 'Teachers', key: 'teachers' },
          { label: 'Classes', key: 'classes' },
          { label: 'Levels', key: 'levels' },
          { label: 'Terms', key: 'terms' },
          { label: 'Results', key: 'results' },
          { label: 'Attendance', key: 'attendance' },
          { label: 'Timetable', key: 'timetable' },
          { label: 'Reports', key: 'reports' },
          { label: 'Profiles', key: 'profiles' },
          { label: 'Security Logs', key: 'security_logs' },
          { label: 'Audit Trail', key: 'audit_trail' },
        ].map(tbl => (
          <div key={tbl.key} className="bg-[#111111] rounded-xl border border-gray-800 p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">{tbl.label}</span>
            <StatusBadge status={health[tbl.key]} />
          </div>
        ))}
      </div>

      {/* Database Records */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 mb-6">
        <h2 className="section-title mb-4">Record Counts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Students', value: stats.totalStudents },
            { label: 'Teachers', value: stats.totalTeachers },
            { label: 'Classes', value: stats.totalClasses },
            { label: 'Levels', value: stats.totalLevels },
            { label: 'Terms', value: stats.totalTerms },
            { label: 'Results', value: stats.totalResults },
            { label: 'Attendance Records', value: stats.totalAttendance },
            { label: 'Admin Accounts', value: stats.totalAdmins },
            { label: 'Student Reports', value: stats.totalReports },
            { label: 'Audit Logs', value: stats.totalAuditLogs },
          ].map(item => (
            <div key={item.label} className="bg-[#0a0a0a] rounded-xl p-4 border border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
            </div>
          ))}
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
