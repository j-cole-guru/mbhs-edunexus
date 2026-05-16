import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`
const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const StudentTimetable = () => {
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayNames[now.getDay()]
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

  useEffect(() => {
    const load = async () => {
      try {
        const student = JSON.parse(localStorage.getItem('mbhs_student') || '{}')
        if (!student.class_id) { setLoading(false); return }
        const res = await fetch(`${BASE_URL}/timetable?class_id=eq.${student.class_id}&select=*&order=day`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
        })
        const data = await res.json()
        setTimetable(Array.isArray(data) ? data : [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const grid = {}
  DAYS.forEach(day => {
    grid[day] = timetable.filter(e => e.day === day).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  })

  const todayEntries = grid[todayName] || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">My Timetable</h1>
        <p className="text-gray-600 mt-2">
          {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's classes */}
      {todayEntries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-base font-semibold text-blue-900 mb-3">Today's Classes — {todayName}</h2>
          <div className="flex flex-wrap gap-3">
            {todayEntries.map((entry, i) => {
              const isCurrent = currentTime >= entry.start_time && currentTime < entry.end_time
              return (
                <div key={i} className={`rounded-lg p-3 min-w-[150px] border ${isCurrent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200'}`}>
                  <p className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-gray-900'}`}>{entry.subject}</p>
                  <p className={`text-xs mt-1 ${isCurrent ? 'text-blue-100' : 'text-gray-500'}`}>{entry.start_time} – {entry.end_time}</p>
                  {isCurrent && <span className="inline-block mt-1 text-xs bg-white text-blue-700 px-2 py-0.5 rounded-full font-medium">In Progress</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {timetable.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg">No timetable found for your class.</p>
          <p className="text-sm mt-2">Please contact your teacher or administrator.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="section-title">Weekly Schedule</h2>
          </div>
          <div className="p-6 space-y-6">
            {DAYS.map(day => (
              <div key={day}>
                <h3 className={`text-sm font-semibold px-3 py-1.5 rounded-md inline-block mb-3 ${day === todayName ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {day}{day === todayName ? ' (Today)' : ''}
                </h3>
                {grid[day].length === 0 ? (
                  <p className="text-sm text-gray-400 ml-1">No classes</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {grid[day].map((entry, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[150px]">
                        <p className="text-sm font-semibold text-gray-900">{entry.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">{entry.start_time} – {entry.end_time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentTimetable
