import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff} from '../../lib/config'

const getToken = () => {
  const staff = safeParseStaff() || {}
  return staff.access_token || ANON_KEY
}

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

const getAssessmentTypes = (termName) => {
  const name = termName?.toLowerCase() || ''
  if (name.includes('first')) {
    return ['Period 1 Test', 'Period 2 Test']
  } else if (name.includes('second')) {
    return ['Period 3 Test', 'Mid Year Examination']
  } else if (name.includes('third')) {
    return ['End of Year Examination']
  }
  return []
}

const gradeColor = (grade) => {
  if (grade === 'A1') return 'bg-emerald-950 text-emerald-400'
  if (grade === 'B2' || grade === 'B3') return 'bg-blue-950 text-blue-400'
  if (['C4', 'C5', 'C6'].includes(grade)) return 'bg-yellow-950 text-yellow-400'
  if (grade === 'D7' || grade === 'E8') return 'bg-orange-950 text-orange-400'
  if (grade === 'F9') return 'bg-red-950 text-red-400'
  return 'bg-gray-800 text-gray-400'
}

const AdminResults = () => {
  const [terms, setTerms] = useState([])
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [parsedData, setParsedData] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getAdminDepartment = () => {
    const staff = safeParseStaff() || {}
    return staff.department || 'both'
  }

  const getDepartmentLevels = async () => {
    const dept = getAdminDepartment()
    const url = dept === 'both'
      ? `${BASE_URL}/levels?select=*&order=name`
      : `${BASE_URL}/levels?select=*&department=eq.${dept}&order=name`
    const res = await fetch(url, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } })
    return await res.json()
  }

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchTerms(), fetchLevels(), fetchClasses()])
      setLoading(false)
    }
    load()
  }, [])

  const fetchTerms = async () => {
    const res = await fetch(`${BASE_URL}/terms?select=*&order=year.desc,name.asc`, { 
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } 
    })
    const d = await res.json()
    setTerms(Array.isArray(d) ? d : [])
  }

  const fetchLevels = async () => {
    const d = await getDepartmentLevels()
    setLevels(Array.isArray(d) ? d : [])
  }

  const fetchClasses = async () => {
    const levelData = await getDepartmentLevels()
    const levelIds = levelData.map(l => l.id)
    
    if (levelIds.length === 0) {
      setClasses([])
      return
    }

    const res = await fetch(`${BASE_URL}/classes?select=*&level_id=in.(${levelIds.join(',')})&order=name.asc`, { 
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } 
    })
    const d = await res.json()
    setClasses(Array.isArray(d) ? d : [])
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: 'binary' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      console.log('Raw rows:', rows)
      console.log('First row keys:', rows[0] ? Object.keys(rows[0]) : 'no rows')
      setParsedData(rows)
    }
    reader.readAsBinaryString(file)
  }

  const handleSave = async () => {
    if (!selectedTerm) {
      setError('Please select a term.')
      return
    }
    if (!selectedAssessmentType) {
      setError('Please select an assessment type.')
      return
    }
    if (!parsedData.length) {
      setError('Please upload a file first.')
      return
    }
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    let saved = 0
    let skipped = 0
    
    try {
      console.log('All rows from Excel:', parsedData)
      for (const row of parsedData) {
        // Safely get student number from any possible column name
        const studentNum = (
          row['Student Number'] ||
          row['Student number'] ||
          row['student_number'] ||
          row['StudentNumber'] ||
          Object.values(row)[0]
        )?.toString().trim()

        const studentName = (
          row['Student Name'] ||
          row['Student name'] ||
          row['student_name'] ||
          Object.values(row)[1]
        )?.toString().trim()

        const subject = (
          row['Subject'] ||
          row['subject'] ||
          Object.values(row)[2]
        )?.toString().trim()

        const score = parseFloat(
          row['Score'] ||
          row['score'] ||
          Object.values(row)[3]
        )

        console.log('Processing:', studentNum, studentName, subject, score)

        if (!studentNum || isNaN(score)) {
          console.log('Skipping invalid row:', row)
          continue
        }

        const stuRes = await fetch(
          `${BASE_URL}/students?student_number=eq.${studentNum}&select=id`,
          { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } }
        )
        const stuData = await stuRes.json()
        console.log('Looking for:', studentNum, 'Found:', stuData)
        const studentId = stuData[0]?.id
        if (!studentId) { console.log('Student not found:', studentNum); skipped++; continue }

        const grade = getGrade(score)
        await fetch(`${BASE_URL}/results`, {
          method: 'POST',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            student_id: studentId,
            student_number: studentNum,
            student_name: studentName,
            subject: subject,
            term_id: selectedTerm,
            assessment_type: selectedAssessmentType,
            score: score,
            grade: grade
          })
        })
        saved++
      }
      setSuccess(`Results uploaded! ${saved} saved${skipped ? `, ${skipped} skipped (student not found)` : ''}.`)
      setParsedData([])
      setSelectedAssessmentType('')
    } catch (err) {
      console.error(err)
      setError('Failed to save results.')
    } finally {
      setSaving(false)
    }
  }

  const selectedTermObj = terms.find(t => t.id === selectedTerm)
  const assessmentTypes = selectedTermObj ? getAssessmentTypes(selectedTermObj.name) : []
  const filteredClasses = selectedLevel ? classes.filter(c => c.level_id === selectedLevel) : classes

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="bg-[#0a0a0a] min-h-screen p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <h1 className="page-title">Upload Results</h1>
        <p className="text-gray-400 mt-2">Upload examination results via Excel file</p>
      </div>

      <div className="bg-[#111111] p-6 rounded-2xl border border-gray-800 mb-8">
        <h2 className="section-title mb-4">Select Term, Assessment Type &amp; Upload File</h2>
        {error && <div className="mb-4 flex items-center error-message"><AlertCircle className="h-4 w-4 mr-2" />{error}</div>}
        {success && <div className="mb-4 flex items-center success-message"><CheckCircle className="h-4 w-4 mr-2" />{success}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Term *</label>
            <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setSelectedAssessmentType('') }} className="w-full form-select">
              <option value="">Select term</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name} – {t.year}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Assessment Type *</label>
            <select value={selectedAssessmentType} onChange={e => setSelectedAssessmentType(e.target.value)} className="w-full form-select" disabled={!selectedTerm}>
              <option value="">Select assessment</option>
              {assessmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Level</label>
            <select value={selectedLevel} onChange={e => { setSelectedLevel(e.target.value); setSelectedClass('') }} className="w-full form-select">
              <option value="">All levels</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full form-select">
              <option value="">All classes</option>
              {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Excel File *</label>
            <label 
              htmlFor="results-upload"
              className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-blue-700 rounded-xl cursor-pointer transition-colors hover:border-blue-500 bg-blue-950/30"
            >
              <Upload className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm text-blue-400">Choose File</span>
            </label>
            <input 
              id="results-upload"
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-xs text-gray-400">
          <strong>Expected columns:</strong> Student Number | Student Name | Subject | Score &nbsp;&nbsp;
          <em>Example: MBHS-STU-001 | Kendrick Cole | Mathematics | 85</em>
        </div>
      </div>

      {parsedData.length > 0 && (
        <div className="bg-[#111111] rounded-2xl border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="section-title">Preview — {parsedData.length} rows</h2>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Results'}
            </button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
              <thead className="bg-gray-900">
                <tr>
                  <th className="table-header">Student Number</th>
                  <th className="table-header">Student Name</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Score</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {parsedData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-900">
                    <td className="px-6 py-3 text-sm text-gray-300">{row['Student Number'] || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-300">{row['Student Name'] || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-300">{row['Subject'] || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-300">{row['Score'] ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${gradeColor(row._grade)}`}>{row._grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

export default AdminResults
