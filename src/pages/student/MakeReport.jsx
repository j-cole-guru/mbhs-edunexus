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
      setClassName(classData[0]?.name || 'N/A')
      setLevelName(levelData[0]?.name || 'N/A')
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
      unread: 'bg-yellow-100 text-yellow-700',
      read: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${styles[status] || styles.unread}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit a Report</h1>
      <p className="text-gray-500 text-sm mb-6">Send a report or complaint directly to your principal.</p>

      {/* Student Info */}
      {student && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Student</p>
            <p className="font-semibold text-gray-900">{student.full_name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Class</p>
            <p className="font-semibold text-gray-900">{className}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Level</p>
            <p className="font-semibold text-gray-900">{levelName}</p>
          </div>
        </div>
      )}

      {/* Report Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">New Report</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief subject of your report"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe your issue or concern in detail..."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{message.length} characters (minimum 20)</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send size={16} />
          )}
          Submit Report
        </button>
      </div>

      {/* My Previous Reports */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">My Previous Reports ({myReports.length})</h2>
        </div>
        {myReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reports submitted yet.</div>
        ) : (
          <div className="divide-y">
            {myReports.map(report => (
              <div key={report.id} className="px-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-gray-900">{report.subject}</p>
                  <StatusBadge status={report.status} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.message}</p>
                <p className="text-xs text-gray-400">{new Date(report.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        © 2026 All Rights Reserved | Developed by Alie Amadu Sesay
      </div>
    </div>
  )
}
