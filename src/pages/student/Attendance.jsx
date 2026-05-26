import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Calendar, ChevronDown, ChevronRight, UserCheck } from 'lucide-react'
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStudent} from '../../lib/config'

const StudentAttendance = () => {
  const [student, setStudent] = useState(null)
  const [records, setRecords] = useState([])
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({
    terms: {},
    months: {},
    weeks: {}
  })

  useEffect(() => {
    const init = async () => {
      try {
        const s = safeParseStudent() || {}
        if (!s.id) { setLoading(false); return }
        setStudent(s)

        const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
        
        // Fetch data in parallel
        const [attRes, termRes] = await Promise.all([
          fetch(`${BASE_URL}/attendance?student_id=eq.${s.id}&select=*&order=date.desc`, { headers }),
          fetch(`${BASE_URL}/terms?select=*`, { headers })
        ])
        
        const attData = await attRes.json()
        const termData = await termRes.json()
        
        setRecords(Array.isArray(attData) ? attData : [])
        setTerms(Array.isArray(termData) ? termData : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const buildTree = (records, terms) => {
    const tree = {}
    records.forEach(record => {
      const term = terms.find(t => t.id === record.term_id)
      const termName = term ? `${term.name} ${term.year}` : 'Unknown Term'
      
      if (!tree[termName]) tree[termName] = {}
      if (!tree[termName][record.month]) tree[termName][record.month] = {}
      if (!tree[termName][record.month][record.week]) tree[termName][record.month][record.week] = []
      
      tree[termName][record.month][record.week].push(record)
    })
    return tree
  }

  const toggleLevel = (type, key) => {
    setExpanded(prev => ({
      ...prev,
      [type]: { ...prev[type], [key]: !prev[type][key] }
    }))
  }

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length
  }
  const rate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!student) return (
    <div className="p-8 text-center text-gray-500">
      <Calendar className="h-12 w-12 mx-auto text-gray-200 mb-4" />
      <p className="text-xl font-bold text-gray-900">Student profile not found</p>
    </div>
  )

  const tree = buildTree(records, terms)

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-blue-950 tracking-tight">My Attendance</h1>
        <p className="text-gray-500 mt-2 font-medium">Explore your academic attendance history by term and week.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Recorded Days</p>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1 text-opacity-70">Present</p>
          <p className="text-2xl font-black text-green-700">{stats.present}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1 text-opacity-70">Absent</p>
          <p className="text-2xl font-black text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-blue-900 p-6 rounded-3xl text-white shadow-lg shadow-blue-900/20">
          <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Attendance Rate</p>
          <p className="text-2xl font-black">{rate}%</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white p-20 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400">
          <Clock className="h-16 w-16 mx-auto mb-6 text-gray-100" />
          <p className="text-xl font-bold text-gray-900">No attendance records found.</p>
          <p className="mt-2">Check back once your teacher marks attendance for the first time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(tree).map(([termName, months]) => (
            <div key={termName} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Term Header */}
              <button 
                onClick={() => toggleLevel('terms', termName)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-950 rounded-2xl flex items-center justify-center text-white">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-black text-gray-900 text-left">{termName}</h2>
                </div>
                {expanded.terms[termName] ? <ChevronDown className="h-5 w-5 text-gray-300" /> : <ChevronRight className="h-5 w-5 text-gray-300" />}
              </button>

              {expanded.terms[termName] && (
                <div className="border-t border-gray-50 px-6 pb-6 space-y-4 pt-2">
                  {Object.entries(months).map(([monthName, weeks]) => (
                    <div key={monthName} className="ml-4">
                      {/* Month Header */}
                      <button 
                        onClick={() => toggleLevel('months', `${termName}-${monthName}`)}
                        className="w-full flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-bold text-gray-700">{monthName}</span>
                        {expanded.months[`${termName}-${monthName}`] ? <ChevronDown className="h-4 w-4 text-gray-300" /> : <ChevronRight className="h-4 w-4 text-gray-300" />}
                      </button>

                      {expanded.months[`${termName}-${monthName}`] && (
                        <div className="mt-2 space-y-3 ml-4">
                          {Object.entries(weeks).map(([weekName, days]) => (
                            <div key={weekName}>
                              {/* Week Header */}
                              <button 
                                onClick={() => toggleLevel('weeks', `${termName}-${monthName}-${weekName}`)}
                                className="w-full flex items-center justify-between py-2 px-4 rounded-xl hover:bg-blue-50/50 transition-colors"
                              >
                                <span className="text-xs font-black text-blue-900 uppercase tracking-widest">{weekName}</span>
                                {expanded.weeks[`${termName}-${monthName}-${weekName}`] ? <ChevronDown className="h-4 w-4 text-blue-900/30" /> : <ChevronRight className="h-4 w-4 text-blue-900/30" />}
                              </button>

                              {expanded.weeks[`${termName}-${monthName}-${weekName}`] && (
                                <div className="mt-2 grid grid-cols-1 gap-2 pl-4">
                                  {days.map(dayRec => (
                                    <div key={dayRec.id} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-gray-200 transition-all">
                                      <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-950/20"></div>
                                        <span className="text-sm font-bold text-gray-700">{dayRec.day}</span>
                                        <span className="text-[10px] font-bold text-gray-400">({new Date(dayRec.date).toLocaleDateString()})</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase ${dayRec.status === 'present' ? 'text-green-600' : dayRec.status === 'absent' ? 'text-red-500' : 'text-yellow-600'}`}>
                                          {dayRec.status}
                                        </span>
                                        {dayRec.status === 'present' ? <CheckCircle className="h-4 w-4 text-green-500" /> : dayRec.status === 'absent' ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-yellow-500" />}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

export default StudentAttendance
