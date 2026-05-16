import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y'
const BASE_URL = 'https://tvitevnovhiimpdukebm.supabase.co/rest/v1'
const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const TeacherTimetable = () => {
  const [teacher, setTeacher] = useState(null)
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
        if (!staff.id) { setLoading(false); return }
        const token = getToken()
        const tRes = await fetch(`${BASE_URL}/teachers?profile_id=eq.${staff.id}&select=*`, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` } })
        const tData = await tRes.json()
        if (!Array.isArray(tData) || !tData[0]) { setLoading(false); return }
        setTeacher(tData[0])
        const res = await fetch(`${BASE_URL}/timetable?class_id=eq.${tData[0].class_id}&select=*&order=day`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
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
  if (!teacher) return (<div className="text-center text-gray-500 py-8"><p>Teacher profile not found</p></div>)

  const grid = {}
  DAYS.forEach(day => {
    grid[day] = timetable.filter(e => e.day === day).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">My Timetable</h1>
        <p className="text-gray-600 mt-2">Your class teaching schedule (read only)</p>
      </div>

      {timetable.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg">No timetable found for your class.</p>
          <p className="text-sm mt-2">Please contact the administrator to set up the schedule.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="section-title">Weekly Schedule</h2>
          </div>
          <div className="p-6 space-y-6">
            {DAYS.map(day => (
              <div key={day}>
                <h3 className="text-sm font-semibold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md inline-block mb-3">{day}</h3>
                {grid[day].length === 0 ? (
                  <p className="text-sm text-gray-400 ml-1">No classes scheduled</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {grid[day].map((entry, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm min-w-[160px]">
                        <p className="text-sm font-semibold text-gray-900">{entry.subject || 'N/A'}</p>
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

export default TeacherTimetable
