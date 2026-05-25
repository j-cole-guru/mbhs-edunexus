import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Users, Calendar, ArrowRight } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const TeacherAttendance = () => {
  const [students, setStudents] = useState([])
  const [teacher, setTeacher] = useState(null)
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [termId, setTermId] = useState('')
  const [month, setMonth] = useState('')
  const [week, setWeek] = useState('')
  const [day, setDay] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [checkedStudents, setCheckedStudents] = useState({})
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
        if (!staff.id) { setLoading(false); return }
        const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
        
        // 1. Get Teacher and Terms
        const [tRes, termsRes] = await Promise.all([
          fetch(`${BASE_URL}/teachers?profile_id=eq.${staff.id}&select=*`, { headers }),
          fetch(`${BASE_URL}/terms?select=*&order=start_date.desc`, { headers })
        ])
        
        const tData = await tRes.json()
        if (!Array.isArray(tData) || !tData[0]) { setLoading(false); return }
        const currentTeacher = tData[0]
        setTeacher(currentTeacher)
        
        const termsData = await termsRes.json()
        setTerms(Array.isArray(termsData) ? termsData : [])

        // 2. Get Students in Class
        const sRes = await fetch(`${BASE_URL}/students?class_id=eq.${currentTeacher.class_id}&select=*&order=full_name.asc`, { headers })
        const sData = await sRes.json()
        const list = Array.isArray(sData) ? sData : []
        setStudents(list)
        
        // Init checkboxes (default present)
        const init = {}; list.forEach(s => { init[s.id] = true }); setCheckedStudents(init)
      } catch (err) { 
        console.error(err)
        setError('Failed to load initial data')
      } finally { 
        setLoading(false) 
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!termId || !month || !week || !day) {
      setError('Please select Term, Month, Week and Day before saving.')
      return
    }
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      
      // 1. Check if already exists
      const checkRes = await fetch(
        `${BASE_URL}/attendance?class_id=eq.${teacher.class_id}&term_id=eq.${termId}&month=eq.${month}&week=eq.${week}&day=eq.${day}&select=id`,
        { headers }
      )
      const existing = await checkRes.json()
      
      if (existing && existing.length > 0) {
        setError('Attendance already submitted for this specific Day, Week and Month. You cannot submit twice.')
        setSaving(false)
        return
      }

      // 2. Save for every student
      for (const student of students) {
        const isPresent = checkedStudents[student.id] === true
        await fetch(`${BASE_URL}/attendance`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            student_id: student.id,
            class_id: teacher.class_id,
            term_id: termId,
            month: month,
            week: week,
            day: day,
            date: selectedDate,
            status: isPresent ? 'present' : 'absent'
          })
        })
      }

      setSuccess('Attendance submitted successfully!')
    } catch (err) {
      console.error(err)
      setError('An error occurred while saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!teacher) return (
    <div className="p-8 text-center text-gray-500">
      <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
      <p className="text-xl font-bold">Teacher profile not found</p>
      <p className="mt-2 text-sm">Please ensure you are assigned to a class in the admin panel.</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-blue-950 tracking-tight">Mark Attendance</h1>
        <p className="text-gray-500 mt-1 font-medium">Follow the steps below to record attendance for your class.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Step 1: Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Term</label>
                <select 
                  value={termId} 
                  onChange={e => setTermId(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-900 focus:border-blue-900"
                >
                  <option value="">Select Term</option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.year}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Month</label>
                <select 
                  value={month} 
                  onChange={e => setMonth(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-900 focus:border-blue-900"
                >
                  <option value="">Select Month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Week</label>
                <select 
                  value={week} 
                  onChange={e => setWeek(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-900 focus:border-blue-900"
                >
                  <option value="">Select Week</option>
                  {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Day</label>
                <select 
                  value={day} 
                  onChange={e => setDay(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-900 focus:border-blue-900"
                >
                  <option value="">Select Day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Calendar Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-950 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="text-lg font-bold mb-2">Ready to Save?</h3>
            <p className="text-blue-200 text-sm mb-6">Review your selections carefully. Once submitted, these records will appear on student dashboards.</p>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-white text-blue-950 font-black py-4 rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-950"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Student List */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 font-bold animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-100 p-4 rounded-2xl flex items-center gap-3 text-green-700 font-bold">
              <CheckCircle className="h-5 w-5 shrink-0" />
              {success}
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-900">Student List</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{students.length} Total Students</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-green-600">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Present: {Object.values(checkedStudents).filter(v => v === true).length}
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Absent: {Object.values(checkedStudents).filter(v => v === false).length}
                </span>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                <p className="text-lg font-bold">No students found</p>
                <p className="text-sm">There are no students assigned to your class.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {students.map(s => (
                  <label 
                    key={s.id} 
                    className="flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{s.full_name}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">{s.student_number || 'N/A'}</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={!!checkedStudents[s.id]}
                      onChange={e => setCheckedStudents(prev => ({ ...prev, [s.id]: e.target.checked }))}
                      className="h-6 w-6 rounded-lg border-gray-300 text-blue-950 focus:ring-blue-950 transition-all cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
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

export default TeacherAttendance
