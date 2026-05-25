import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const calculateGrade = (score) => {
  if (score >= 75) return 'A1'
  if (score >= 70) return 'B2'
  if (score >= 65) return 'B3'
  if (score >= 60) return 'C4'
  if (score >= 55) return 'C5'
  if (score >= 50) return 'C6'
  if (score >= 45) return 'D7'
  if (score >= 40) return 'E8'
  return 'F9'
}

const TeacherResults = () => {
  const [teacher, setTeacher] = useState(null)
  const [terms, setTerms] = useState([])
  const [subjects, setSubjects] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ term_id: '', subject_id: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
        if (!staff.id) { setLoading(false); return }
        const token = getToken()

        // Fetch teacher record
        const teacherRes = await fetch(`${BASE_URL}/teachers?profile_id=eq.${staff.id}&select=*`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const teacherData = await teacherRes.json()
        if (!Array.isArray(teacherData) || !teacherData[0]) { setLoading(false); return }
        const t = teacherData[0]
        setTeacher(t)

        // Fetch students in teacher's class
        const studentsRes = await fetch(`${BASE_URL}/students?class_id=eq.${t.class_id}&select=*&order=full_name.asc`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const studentsData = await studentsRes.json()
        const studentsList = Array.isArray(studentsData) ? studentsData : []
        const initialResults = studentsList.map(s => ({
          student_id: s.id, student_number: s.student_number, full_name: s.full_name, score: '', grade: ''
        }))
        setResults(initialResults)

        // Fetch terms
        const termsRes = await fetch(`${BASE_URL}/terms?select=*&order=year.desc,name.asc`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const termsData = await termsRes.json()
        setTerms(Array.isArray(termsData) ? termsData : [])

        // Fetch subjects filtered by teacher's level_id
        const subjectsRes = await fetch(`${BASE_URL}/subjects?level_id=eq.${t.level_id}&select=*&order=name.asc`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const subjectsData = await subjectsRes.json()
        setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data')
      } finally { setLoading(false) }
    }
    loadData()
  }, [])

  const handleScoreChange = (studentId, score) => {
    const num = parseInt(score) || 0
    const grade = num > 0 ? calculateGrade(num) : ''
    setResults(prev => prev.map(r => r.student_id === studentId ? { ...r, score: num, grade } : r))
  }

  const handleSaveResults = async () => {
    if (!formData.term_id || !formData.subject_id) { setError('Please select term and subject'); return }
    const valid = results.filter(r => r.score > 0)
    if (valid.length === 0) { setError('Please enter at least one score'); return }
    try {
      setError(''); setSuccess(''); setSaving(true)
      const token = getToken()

      // Delete existing results for this term + subject + students
      for (const r of valid) {
        await fetch(`${BASE_URL}/results?student_id=eq.${r.student_id}&term_id=eq.${formData.term_id}&subject_id=eq.${formData.subject_id}`, {
          method: 'DELETE',
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
      }

      // Insert new results
      const toInsert = valid.map(r => ({
        student_id: r.student_id, subject_id: formData.subject_id, term_id: formData.term_id, score: r.score, grade: r.grade
      }))
      await fetch(`${BASE_URL}/results`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(toInsert)
      })
      setSuccess('Results saved successfully')
    } catch (err) {
      console.error('Error saving results:', err)
      setError('Failed to save results')
    } finally { setSaving(false) }
  }

  const gradeColor = (grade) => {
    if (grade === 'A1') return 'bg-green-100 text-green-800'
    if (grade === 'B2' || grade === 'B3') return 'bg-blue-100 text-blue-800'
    if (grade === 'C4' || grade === 'C5' || grade === 'C6') return 'bg-yellow-100 text-yellow-800'
    if (grade === 'D7' || grade === 'E8') return 'bg-orange-100 text-orange-800'
    if (grade === 'F9') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
  if (!teacher) return (<div className="text-center text-gray-500 py-8"><p>Teacher profile not found</p></div>)

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <h1 className="page-title">Enter Results</h1>
        <p className="text-gray-600 mt-2">Enter examination results for your class</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Select Term and Subject</h2>
        {error && (<div className="mb-4 flex items-center error-message"><AlertCircle className="h-4 w-4 mr-2" />{error}</div>)}
        {success && (<div className="mb-4 flex items-center success-message"><CheckCircle className="h-4 w-4 mr-2" />{success}</div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select value={formData.term_id} onChange={(e) => setFormData({ ...formData, term_id: e.target.value })} className="w-full form-select">
              <option value="">Select term</option>
              {terms.map(t => (<option key={t.id} value={t.id}>{t.name} - {t.year}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="w-full form-select">
              <option value="">Select subject</option>
              {subjects.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="section-title">Enter Scores</h2>
            <button onClick={handleSaveResults} disabled={saving} className="px-6 py-2 btn-primary flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Results'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Student Number</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Score (0-100)</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map(r => (
                  <tr key={r.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.student_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="number" min="0" max="100" value={r.score} onChange={(e) => handleScoreChange(r.student_id, e.target.value)} className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900" placeholder="0" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gradeColor(r.grade)}`}>{r.grade || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500"><p>No students found in your class</p></div>
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

export default TeacherResults
