import { useState, useEffect } from 'react'
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}
const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']

export default function AdminAttendance() {
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [terms, setTerms] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)

  const [levelId, setLevelId] = useState('')
  const [classId, setClassId] = useState('')
  const [termId, setTermId] = useState('')
  const [month, setMonth] = useState('')
  const [week, setWeek] = useState('')
  const [day, setDay] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const getAdminDepartment = () => {
    const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
    return staff.department || 'both'
  }

  const getDepartmentLevels = async () => {
    const dept = getAdminDepartment()
    const url = dept === 'both'
      ? `${BASE_URL}/levels?select=*&order=name`
      : `${BASE_URL}/levels?select=*&department=eq.${dept}&order=name`
    const res = await fetch(url, { headers })
    return await res.json()
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (levelId) {
      setFilteredClasses(classes.filter(c => c.level_id === levelId))
      setClassId('')
    }
  }, [levelId, classes])

  const loadInitialData = async () => {
    try {
      const levelsData = await getDepartmentLevels()
      const levelIds = levelsData.map(l => l.id)
      
      const classesUrl = levelIds.length > 0 
        ? `${BASE_URL}/classes?select=*&level_id=in.(${levelIds.join(',')})&order=name`
        : `${BASE_URL}/classes?select=*&order=name`
      
      const [classesRes, termsRes] = await Promise.all([
        fetch(classesUrl, { headers }),
        fetch(`${BASE_URL}/terms?select=*&order=created_at.asc`, { headers })
      ])
      setLevels(levelsData)
      setClasses(await classesRes.json())
      setTerms(await termsRes.json())
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const fetchAttendance = async () => {
    if (!classId || !termId) {
      alert('Please select at least a class and term.')
      return
    }
    setLoading(true)
    try {
      const currentHeaders = { 
        'apikey': ANON_KEY, 
        'Authorization': `Bearer ${getToken()}` 
      }

      const params = new URLSearchParams({
        class_id: `eq.${classId}`,
        term_id: `eq.${termId}`,
        select: '*',
        order: 'date.asc'
      })
      if (month) params.append('month', `eq.${month}`)
      if (week) params.append('week', `eq.${week}`)
      if (day) params.append('day', `eq.${day}`)
      if (selectedDate) params.append('date', `eq.${selectedDate}`)

      const url = `${BASE_URL}/attendance?${params.toString()}`
      console.log('Fetching URL:', url)

      const res = await fetch(url, { headers: currentHeaders })
      const text = await res.text()
      
      console.log('Response status:', res.status)
      if (!res.ok) {
        console.error('Response error body:', text)
        throw new Error(`Failed to fetch attendance: ${res.status}`)
      }

      const data = JSON.parse(text)
      console.log('Attendance data count:', data?.length || 0)

      if (!Array.isArray(data) || data.length === 0) {
        setRecords([])
        return
      }

      // Batch fetch students to avoid "ERR_CONNECTION_CLOSED" from too many parallel requests
      const studentIds = [...new Set(data.map(r => r.student_id))].filter(Boolean)
      
      if (studentIds.length > 0) {
        const studentUrl = `${BASE_URL}/students?id=in.(${studentIds.join(',')})&select=id,full_name,student_number`
        const stuRes = await fetch(studentUrl, { headers: currentHeaders })
        const stuData = await stuRes.json()
        
        const studentMap = (stuData || []).reduce((acc, s) => {
          acc[s.id] = s
          return acc
        }, {})

        const enriched = data.map(record => ({
          ...record,
          student_name: studentMap[record.student_id]?.full_name || 'Unknown',
          student_number: studentMap[record.student_id]?.student_number || 'N/A'
        }))
        setRecords(enriched)
      } else {
        setRecords(data.map(r => ({ ...r, student_name: 'N/A', student_number: 'N/A' })))
      }
    } catch (err) {
      console.error('Error in fetchAttendance:', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const totalPresent = records.filter(r => r.status === 'present').length
  const totalAbsent = records.filter(r => r.status === 'absent').length
  const totalLate = records.filter(r => r.status === 'late').length

  const StatusBadge = ({ status }) => {
    if (status === 'present') return (
      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
        <CheckCircle size={12} /> Present
      </span>
    )
    if (status === 'late') return (
      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
        <Clock size={12} /> Late
      </span>
    )
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
        <XCircle size={12} /> Absent
      </span>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Filter Attendance</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Level</label>
            <select
              value={levelId}
              onChange={e => setLevelId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Select Level</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Select Class</option>
              {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Term</label>
            <select
              value={termId}
              onChange={e => setTermId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Select Term</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.year}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">All Months</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Week</label>
            <select
              value={week}
              onChange={e => setWeek(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">All Weeks</option>
              {['Week 1','Week 2','Week 3','Week 4'].map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Day</label>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">All Days</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Specific Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        <button
          onClick={fetchAttendance}
          className="flex items-center gap-2 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          <Search size={16} />
          View Attendance
        </button>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Present</p>
            <p className="text-2xl font-bold text-gray-900">{totalPresent}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Absent</p>
            <p className="text-2xl font-bold text-gray-900">{totalAbsent}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Late</p>
            <p className="text-2xl font-bold text-gray-900">{totalLate}</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Select filters above and click View Attendance to see records.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Student Number</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Student Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Month</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Week</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Day</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{r.student_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.student_name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.month}</td>
                  <td className="px-4 py-3 text-gray-600">{r.week}</td>
                  <td className="px-4 py-3 text-gray-600">{r.day}</td>
                  <td className="px-4 py-3 text-gray-600">{r.date}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
