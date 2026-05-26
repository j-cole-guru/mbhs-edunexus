import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }

const getGrade = (score) => {
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

const getGradeClass = (grade) => {
  if (grade === 'A1') return 'bg-green-100 text-green-700'
  if (grade === 'B2' || grade === 'B3') return 'bg-blue-100 text-blue-700'
  if (grade === 'C4' || grade === 'C5' || grade === 'C6') return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

const calcGPA = (records) => {
  if (!records || !records.length) return '0.0'
  const avg = records.reduce((sum, r) => sum + parseFloat(r.score || 0), 0) / records.length
  return avg.toFixed(1)
}

const groupResults = (results, terms) => {
  const grouped = {}
  results.forEach(r => {
    const term = terms.find(t => t.id === r.term_id)
    const termName = term ? `${term.name} ${term.year}` : 'Unknown Term'
    if (!grouped[termName]) grouped[termName] = {}
    if (!grouped[termName][r.assessment_type]) grouped[termName][r.assessment_type] = []
    grouped[termName][r.assessment_type].push(r)
  })
  return grouped
}

export default function StudentResults() {
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTerms, setExpandedTerms] = useState({})
  const [expandedAssessments, setExpandedAssessments] = useState({})

  useEffect(() => {
    const raw = localStorage.getItem('mbhs_student')
    if (!raw) { window.location.href = '/login'; return }
    const s = JSON.parse(raw)
    setStudent(s)
    loadData(s)
  }, [])

  const loadData = async (s) => {
    try {
      const [resultsRes, termsRes] = await Promise.all([
        fetch(`${BASE_URL}/results?student_id=eq.${s.id}&select=*&order=created_at.asc`, { headers }),
        fetch(`${BASE_URL}/terms?select=*&order=created_at.asc`, { headers })
      ])
      const resultsData = await resultsRes.json()
      const termsData = await termsRes.json()
      console.log('Results:', resultsData)
      console.log('Terms:', termsData)
      setResults(Array.isArray(resultsData) ? resultsData : [])
      setTerms(Array.isArray(termsData) ? termsData : [])
    } catch (err) {
      console.error('Error loading results:', err)
      setResults([])
      setTerms([])
    } finally {
      setLoading(false)
    }
  }

  const toggleTerm = (termName) => {
    setExpandedTerms(prev => ({ ...prev, [termName]: !prev[termName] }))
  }

  const toggleAssessment = (key) => {
    setExpandedAssessments(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const grouped = groupResults(results, terms)

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Academic Results</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No results available.
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([termName, assessments]) => {
            const isTermExpanded = expandedTerms[termName]
            return (
              <div key={termName} className="bg-white rounded-lg shadow mb-4 overflow-hidden">
                <button
                  onClick={() => toggleTerm(termName)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-blue-900 text-white font-semibold text-left"
                >
                  <span>{termName}</span>
                  {isTermExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {isTermExpanded && (
                  <div className="p-4 space-y-4">
                    {Object.entries(assessments).map(([assessmentType, records]) => {
                      const key = `${termName}-${assessmentType}`
                      const gpa = calcGPA(records)
                      const isAssessmentExpanded = expandedAssessments[key]
                      return (
                        <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleAssessment(key)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-gray-800 font-medium text-left"
                          >
                            <span>{assessmentType}</span>
                            {isAssessmentExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>

                          {isAssessmentExpanded && (
                            <div className="p-4">
                              <div className="w-full overflow-x-auto rounded-lg shadow">
                                <table className="w-full text-sm" style={{ minWidth: '700px' }}>
                                  <thead>
                                    <tr className="text-left text-gray-500 uppercase text-xs tracking-wide border-b">
                                      <th className="pb-2">Subject</th>
                                      <th className="pb-2">Score</th>
                                      <th className="pb-2">Grade</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {records.map((r, i) => (
                                      <tr key={i} className="border-b last:border-0">
                                        <td className="py-2 text-gray-800">{r.subject}</td>
                                        <td className="py-2 text-gray-800">{r.score}</td>
                                        <td className="py-2">
                                          <span className={'px-2 py-1 rounded text-xs font-semibold ' + getGradeClass(r.grade)}>
                                            {r.grade}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                <span className="text-sm text-gray-500">Assessment Average</span>
                                <span className="font-bold text-blue-900">{gpa} — {getGrade(parseFloat(gpa))}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </>
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
