import { useState, useEffect } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }

export default function MakeReport() {
  const [student, setStudent] = useState(null)
  const [className, setClassName] = useState('')
  const [levelName, setLevelName] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [myReports, setMyReports] = useState([])

  useEffect(() => {
    const raw = localStorage.getItem('mbhs_student')
    if (!raw) { window.location.href = '/login'; return }
    const s = JSON.parse(raw)
    setStudent(s)
    loadDetails(s)
    fetchMyReports(s)
  }, [])

  const loadDetails = async (s) => {
    try {
      const [classRes, levelRes] = await Promise.all([
        fetch(`${BASE_URL}/classes?id=eq.${s.class_id}&select=name`, { headers }),
        fetch(`${BASE_URL}/levels?id=eq.${s.level_id}&select=name`, { headers })
      ])
      const classData = await classRes.json()
      const levelData = await levelRes.json()
      setClassName(classData[0]?.name || 'Not Assigned')
      setLevelName(levelData[0]?.name || 'Not Assigned')
    } catch (err) {
      console.error('Error loading details:', err)
    }
  }

  const fetchMyReports = async (s) => {
    try {
      const res = await fetch(
        `${BASE_URL}/reports?student_id=eq.${s.id}&select=*&order=created_at.desc`,
        { headers }
      )
      const data = await res.json()
      setMyReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching reports:', err)
    }
  }

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both the subject and message fields.')
      return
    }
    if (message.trim().length < 20) {
      setError('Message must be at least 20 characters long.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({
          student_id: student.id,
          student_name: student.full_name,
          student_number: student.student_number,
          class_id: student.class_id,
          level_id: student.level_id,
          class_name: className,
          level_name: levelName,
          subject: subject.trim(),
          message: message.trim(),
          status: 'unread'
        })
      })
      const data = await res.json()
      console.log('Report submitted:', data)
      setSuccess('Your report has been submitted to the principal successfully.')
      setSubject('')
      setMessage('')
      fetchMyReports(student)
    } catch (err) {
      setError('Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const StatusBadge = ({ status }) => {
    const styles = {
      unread: 'bg-yellow-950 text-yellow-400 border-yellow-800',
      read: 'bg-blue-950 text-blue-400 border-blue-800',
      resolved: 'bg-emerald-950 text-emerald-400 border-emerald-800'
    }
    return (
      <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize border ${styles[status] || styles.unread}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-2">Submit a Report</h1>
      <p className="text-gray-500 text-sm mb-6">Send a report or complaint directly to your principal.</p>

      {/* Student Info */}
      {student && (
        <div className="bg-[#111111] rounded-2xl border border-gray-800 p-5 mb-6 flex items-center gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Student</p>
            <p className="font-bold text-white">{student.full_name}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Class</p>
            <p className="font-bold text-white">{className}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Level</p>
            <p className="font-bold text-white">{levelName}</p>
          </div>
        </div>
      )}

      {/* Report Form */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-black text-white mb-4">New Report</h2>

        <div className="mb-4">
          <label className="form-label">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief subject of your report"
            className="form-input"
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe your issue or concern in detail..."
            rows={6}
            className="form-input resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{message.length} characters (minimum 20)</p>
        </div>

        {error && (
          <div className="error-message mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="success-message mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send size={16} />
          )}
          Submit Report
        </button>
      </div>

      {/* My Previous Reports */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-bold text-white">My Previous Reports ({myReports.length})</h2>
        </div>
        {myReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reports submitted yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {myReports.map(report => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-900">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-white">{report.subject}</p>
                  <StatusBadge status={report.status} />
                </div>
                <p className="text-sm text-gray-400 mb-2">{report.message}</p>
                <p className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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
