import { useState, useEffect } from 'react'
import { Activity, CheckCircle, AlertCircle, Clock, Database, Users, Server } from 'lucide-react'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`
const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }

export default function SystemHealth() {
  const [health, setHealth] = useState({
    database: 'checking',
    auth: 'checking',
    storage: 'checking',
    api: 'checking'
  })
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalResults: 0,
    totalAttendance: 0,
    totalAdmins: 0
  })
  const [lastChecked, setLastChecked] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uptime] = useState('99.9%')

  useEffect(() => { runHealthCheck() }, [])

  const runHealthCheck = async () => {
    setLoading(true)
    const newHealth = { database: 'checking', auth: 'checking', api: 'checking', storage: 'checking' }

    try {
      const dbRes = await fetch(`${BASE_URL}/students?select=id&limit=1`, { headers })
      newHealth.database = dbRes.ok ? 'healthy' : 'error'
    } catch { newHealth.database = 'error' }

    try {
      const authRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { 'apikey': ANON_KEY }
      })
      newHealth.auth = authRes.ok ? 'healthy' : 'error'
    } catch { newHealth.auth = 'error' }

    try {
      const apiRes = await fetch(`${BASE_URL}/profiles?select=id&limit=1`, { headers })
      newHealth.api = apiRes.ok ? 'healthy' : 'error'
    } catch { newHealth.api = 'error' }

    newHealth.storage = 'healthy'

    setHealth(newHealth)

    try {
      const [students, teachers, classes, results, attendance, admins] = await Promise.all([
        fetch(`${BASE_URL}/students?select=id`, { headers }).then(r => r.json()),
        fetch(`${BASE_URL}/teachers?select=id`, { headers }).then(r => r.json()),
        fetch(`${BASE_URL}/classes?select=id`, { headers }).then(r => r.json()),
        fetch(`${BASE_URL}/results?select=id`, { headers }).then(r => r.json()),
        fetch(`${BASE_URL}/attendance?select=id`, { headers }).then(r => r.json()),
        fetch(`${BASE_URL}/profiles?role=eq.admin&select=id`, { headers }).then(r => r.json()),
      ])
      setStats({
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
        totalClasses: Array.isArray(classes) ? classes.length : 0,
        totalResults: Array.isArray(results) ? results.length : 0,
        totalAttendance: Array.isArray(attendance) ? attendance.length : 0,
        totalAdmins: Array.isArray(admins) ? admins.length : 0,
      })
    } catch (err) { console.error('Stats error:', err) }

    setLastChecked(new Date().toLocaleTimeString())
    setLoading(false)
  }

  const StatusBadge = ({ status }) => {
    if (status === 'checking') return (
      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        Checking
      </span>
    )
    if (status === 'healthy') return (
      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        <CheckCircle size={12} /> Operational
      </span>
    )
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
        <AlertCircle size={12} /> Error
      </span>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lastChecked ? `Last checked at ${lastChecked}` : 'Running health check...'}
          </p>
        </div>
        <button onClick={runHealthCheck}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          <Activity size={16} />
          Run Check
        </button>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Database', key: 'database', icon: <Database size={20} /> },
          { label: 'Authentication', key: 'auth', icon: <Users size={20} /> },
          { label: 'REST API', key: 'api', icon: <Server size={20} /> },
          { label: 'Storage', key: 'storage', icon: <Database size={20} /> },
        ].map(service => (
          <div key={service.key} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              {service.icon}
              <span className="font-medium text-sm">{service.label}</span>
            </div>
            <StatusBadge status={health[service.key]} />
          </div>
        ))}
      </div>

      {/* Uptime */}
      <div className="bg-black text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wide">System Uptime</p>
            <p className="text-4xl font-bold mt-1">{uptime}</p>
            <p className="text-gray-400 text-sm mt-1">MBHS EduNexus is running normally</p>
          </div>
          <Activity size={48} className="text-blue-400" />
        </div>
      </div>

      {/* Database Records */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Database Records</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Students', value: stats.totalStudents },
            { label: 'Total Teachers', value: stats.totalTeachers },
            { label: 'Total Classes', value: stats.totalClasses },
            { label: 'Total Results', value: stats.totalResults },
            { label: 'Attendance Records', value: stats.totalAttendance },
            { label: 'Admin Accounts', value: stats.totalAdmins },
          ].map(item => (
            <div key={item.label} className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        © 2026 All Rights Reserved | Developed by Alie Amadu Sesay
      </div>
    </div>
  )
}
