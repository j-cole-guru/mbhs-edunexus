import React, { useState, useEffect } from 'react'
import mammoth from 'mammoth'
import { Upload, CheckCircle, AlertCircle, Clock, FileText, Trash2 } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const AdminTimetable = () => {
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [parsedData, setParsedData] = useState([])
  const [existingTimetable, setExistingTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getAdminDepartment = () => {
    const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
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
      await Promise.all([fetchLevels(), fetchClasses()])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedClass) { fetchExistingTimetable(selectedClass); setParsedData([]); setError(''); setSuccess('') }
    else { setExistingTimetable([]) }
  }, [selectedClass])

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

    const res = await fetch(`${BASE_URL}/classes?select=*&level_id=in.(${levelIds.join(',')})&order=name.asc`, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } })
    const d = await res.json()
    setClasses(Array.isArray(d) ? d : [])
  }

  const fetchExistingTimetable = async (classId) => {
    const res = await fetch(`${BASE_URL}/timetable?class_id=eq.${classId}&select=*&order=day.asc,start_time.asc`, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` } })
    const d = await res.json(); setExistingTimetable(Array.isArray(d) ? d : [])
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    
    if (!selectedClass) {
      setError('Please select a class before uploading the timetable.')
      e.target.value = ''
      return
    }

    setError(''); setSuccess('')
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target.result
        const result = await mammoth.convertToHtml({ arrayBuffer })
        const html = result.value
        
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const table = doc.querySelector('table')
        
        if (!table) {
          setError('No table found in the Word document. Please ensure the timetable is in a table format.')
          return
        }

        const rows = Array.from(table.querySelectorAll('tr'))
        if (rows.length < 2) {
          setError('Table must have a header row and at least one data row.')
          return
        }

        const headers = Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent.trim().toLowerCase())
        
        const dayIdx = headers.findIndex(h => h.includes('day'))
        const subIdx = headers.findIndex(h => h.includes('subject'))
        const startIdx = headers.findIndex(h => h.includes('start'))
        const endIdx = headers.findIndex(h => h.includes('end'))

        if (dayIdx === -1 || subIdx === -1 || startIdx === -1 || endIdx === -1) {
          setError('Expected columns (Day, Subject, Start Time, End Time) not found in Word table.')
          return
        }

        const data = rows.slice(1).map(row => {
          const cells = Array.from(row.querySelectorAll('td'))
          return {
            'Day': cells[dayIdx]?.textContent.trim() || '',
            'Subject': cells[subIdx]?.textContent.trim() || '',
            'Start Time': cells[startIdx]?.textContent.trim() || '',
            'End Time': cells[endIdx]?.textContent.trim() || ''
          }
        }).filter(r => r['Day'] && r['Subject'])

        if (!data.length) { setError('Word table is empty or invalid.'); return }
        setParsedData(data)
      } catch (err) { 
        console.error(err)
        setError('Failed to parse Word document. Please ensure it is a valid .docx file.') 
      }
    }
    reader.readAsArrayBuffer(file); e.target.value = ''
  }

  const handleSave = async () => {
    if (!selectedClass) { setError('Please select a class.'); return }
    if (!parsedData.length) { setError('Please upload a file first.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const token = getToken()
      const levelId = classes.find(c => c.id === selectedClass)?.level_id || selectedLevel
      await fetch(`${BASE_URL}/timetable?class_id=eq.${selectedClass}`, { method: 'DELETE', headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` } })
      for (const row of parsedData) {
        await fetch(`${BASE_URL}/timetable`, {
          method: 'POST',
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify({ class_id: selectedClass, level_id: levelId, day: row['Day'], subject: row['Subject'], start_time: row['Start Time'], end_time: row['End Time'] })
        })
      }
      setSuccess(`Timetable saved! ${parsedData.length} entries uploaded.`)
      setParsedData([])
      await fetchExistingTimetable(selectedClass)
    } catch (err) { console.error(err); setError('Failed to save timetable.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selectedClass) return
    if (!window.confirm('Are you sure you want to delete the entire timetable for this class? This action cannot be undone.')) return
    
    setSaving(true); setError(''); setSuccess('')
    try {
      const token = getToken()
      const res = await fetch(`${BASE_URL}/timetable?class_id=eq.${selectedClass}`, { 
        method: 'DELETE', 
        headers: { 
          'apikey': ANON_KEY, 
          'Authorization': `Bearer ${token}` 
        } 
      })
      if (!res.ok) throw new Error('Failed to delete')
      setSuccess('Timetable deleted successfully.')
      await fetchExistingTimetable(selectedClass)
    } catch (err) {
      console.error(err)
      setError('Failed to delete timetable.')
    } finally {
      setSaving(false)
    }
  }

  const filteredClasses = selectedLevel ? classes.filter(c => c.level_id === selectedLevel) : classes

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const grid = {}
  DAYS.forEach(day => { grid[day] = existingTimetable.filter(e => e.day === day).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')) })

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Upload Timetable</h1>
        <p className="text-gray-600 mt-2">Upload class timetables via MS Word document (.docx)</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Select Class &amp; Upload Word File</h2>
        {error && <div className="mb-4 flex items-center error-message"><AlertCircle className="h-4 w-4 mr-2" />{error}</div>}
        {success && <div className="mb-4 flex items-center success-message"><CheckCircle className="h-4 w-4 mr-2" />{success}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
            <select value={selectedLevel} onChange={e => { setSelectedLevel(e.target.value); setSelectedClass('') }} className="w-full form-select">
              <option value="">Select level</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full form-select" disabled={!selectedLevel}>
              <option value="">Select class</option>
              {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Word Document</label>
            <label 
              htmlFor="timetable-upload"
              className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-blue-300 rounded-md cursor-pointer transition-colors hover:border-blue-500 bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm text-blue-700">Choose File (.docx)</span>
            </label>
            <input 
              id="timetable-upload"
              type="file" 
              accept=".docx" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>
        </div>
        <div className="bg-gray-50 rounded p-3 text-xs text-gray-600">
          <strong>Requirements:</strong> The Word document must contain a <strong>Table</strong> with headers: Day | Subject | Start Time | End Time.
        </div>
      </div>

      {parsedData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="section-title">Preview — {parsedData.length} rows</h2>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 btn-primary flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Timetable'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>
                <th className="table-header">Day</th><th className="table-header">Subject</th>
                <th className="table-header">Start Time</th><th className="table-header">End Time</th>
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{row['Day'] || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{row['Subject'] || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{row['Start Time'] || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{row['End Time'] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedClass && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="section-title">Current Timetable — {classes.find(c => c.id === selectedClass)?.name || ''}</h2>
            {existingTimetable.length > 0 && (
              <button 
                onClick={handleDelete} 
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50 text-sm font-medium"
              >
                <Trash2 size={16} />
                Delete Timetable
              </button>
            )}
          </div>
          {existingTimetable.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No timetable found. Upload one above.</p>
            </div>
          ) : (
            <div className="p-6">
              {DAYS.map(day => (
                <div key={day} className="mb-6">
                  <h3 className="text-sm font-semibold text-blue-900 bg-blue-50 px-3 py-1 rounded mb-2 inline-block">{day}</h3>
                  {grid[day].length === 0 ? (
                    <p className="text-xs text-gray-400 ml-1">No classes</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {grid[day].map((entry, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[140px]">
                          <p className="text-sm font-medium text-gray-900">{entry.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">{entry.start_time} – {entry.end_time}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminTimetable
