import { useState, useEffect } from 'react'
import { Users, ArrowRight } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getToken = () => JSON.parse(localStorage.getItem('mbhs_staff') || '{}').access_token || ANON_KEY
const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }

const getAdminDepartment = () => JSON.parse(localStorage.getItem('mbhs_staff') || '{}').department || 'both'

export default function PromoteStudents() {
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [fromLevelId, setFromLevelId] = useState('')
  const [fromClassId, setFromClassId] = useState('')
  const [toLevelId, setToLevelId] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fromClasses = classes.filter(c => c.level_id === fromLevelId)
  const toClasses = classes.filter(c => c.level_id === toLevelId)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const dept = getAdminDepartment()
    const levelsUrl = dept === 'both'
      ? `${BASE_URL}/levels?select=*&order=name`
      : `${BASE_URL}/levels?select=*&department=eq.${dept}&order=name`
    const [levelsRes, classesRes] = await Promise.all([
      fetch(levelsUrl, { headers }),
      fetch(`${BASE_URL}/classes?select=*&order=name`, { headers })
    ])
    const levelsData = await levelsRes.json()
    const classesData = await classesRes.json()
    
    // Filter classes by department levels
    const levelIds = levelsData.map(l => l.id)
    const filteredClasses = classesData.filter(c => levelIds.includes(c.level_id))
    
    setLevels(levelsData)
    setClasses(filteredClasses)
  }

  const previewStudents = async () => {
    if (!fromClassId) return
    const res = await fetch(
      `${BASE_URL}/students?class_id=eq.${fromClassId}&select=*`,
      { headers }
    )
    const data = await res.json()
    setStudents(Array.isArray(data) ? data : [])
  }

  const handlePromote = async () => {
    if (!fromClassId || !toClassId || !toLevelId) {
      setError('Please select both From and To class.')
      return
    }
    if (fromClassId === toClassId) {
      setError('From and To class cannot be the same.')
      return
    }
    if (students.length === 0) {
      setError('No students found in the selected class.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      for (const student of students) {
        await fetch(`${BASE_URL}/students?id=eq.${student.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            class_id: toClassId,
            level_id: toLevelId
          })
        })
      }
      setSuccess(`${students.length} student(s) promoted successfully.`)
      setStudents([])
      setFromClassId('')
      setToClassId('')
      setFromLevelId('')
      setToLevelId('')
    } catch (err) {
      setError('Promotion failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Promotion</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-sm text-gray-500 mb-6">Select the current class and the class to promote students into. All students in the selected class will be moved.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Users size={16} /> From Class</h3>
            <div className="space-y-3">
              <select value={fromLevelId} onChange={e => { setFromLevelId(e.target.value); setFromClassId('') }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Level</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select value={fromClassId} onChange={e => setFromClassId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Class</option>
                {fromClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={previewStudents}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Preview Students
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><ArrowRight size={16} /> To Class</h3>
            <div className="space-y-3">
              <select value={toLevelId} onChange={e => { setToLevelId(e.target.value); setToClassId('') }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Level</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select value={toClassId} onChange={e => setToClassId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Class</option>
                {toClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {students.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-3">Students to be Promoted ({students.length})</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">\n<table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Student Number</th>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Full Name</th>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-gray-600">{s.student_number}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{s.full_name}</td>
                      <td className="px-4 py-2 text-gray-600 capitalize">{s.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>\n</div>
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mt-4">{success}</p>}

        <button onClick={handlePromote}
          disabled={loading || students.length === 0}
          className="w-full md:w-auto mt-6 bg-blue-900 text-white px-8 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <ArrowRight size={16} />
          )}
          Promote All Students
        </button>
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
