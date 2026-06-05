import React, { useState, useEffect } from "react"
import { Archive, Users, CheckCircle, AlertCircle, Search, Clock } from "lucide-react"
import {ANON_KEY, SUPABASE_URL, safeParseStaff} from "../../lib/config"

const getAuth = () => {
  const staffData = localStorage.getItem("mbhs_staff")
  if (!staffData) {
    return {
      token: null,
      apikey: ANON_KEY,
      baseUrl: `${SUPABASE_URL}/rest/v1`,
    }
  }

  const staff = safeParseStaff() || {}
  return {
    token: staff?.access_token,
    apikey: ANON_KEY,
    baseUrl: `${SUPABASE_URL}/rest/v1`,
  }
}

const apiFetch = async (endpoint, options = {}) => {
  const { token, apikey, baseUrl } = getAuth()
  if (!token) {
    console.error("No authentication token found.")
    return null
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      apikey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
  })

  if (res.status === 401) {
    console.error("Unauthorized: Please log in again.")
    return null
  }

  const text = await res.text()
  if (!res.ok) {
    let errMsg = `API Error: ${res.status}`
    try {
      const errData = JSON.parse(text)
      errMsg = errData.message || errData.error || errMsg
    } catch {
      // Ignore parse error
    }
    throw new Error(errMsg)
  }
  if (!text || text.trim() === "") return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const getAdminDepartment = () => {
  const staff = safeParseStaff() || {}
  return staff.department || "both"
}

const calculateSuspensionEndDate = (duration) => {
  const today = new Date()
  switch (duration) {
    case "3_days":
      today.setDate(today.getDate() + 3)
      break
    case "1_week":
      today.setDate(today.getDate() + 7)
      break
    case "2_weeks":
      today.setDate(today.getDate() + 14)
      break
    case "1_month":
      today.setMonth(today.getMonth() + 1)
      break
    case "custom":
      return null
    default:
      return null
  }
  return today.toISOString().split("T")[0]
}

const ArchiveStudents = () => {
  const [levels, setLevels] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [archivedStudents, setArchivedStudents] = useState([])
  const [filterLevel, setFilterLevel] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString())
  const [archiveReason, setArchiveReason] = useState("Graduated")
  const [suspensionDuration, setSuspensionDuration] = useState("")
  const [suspensionEndDate, setSuspensionEndDate] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  // Bulk archive states
  const [bulkLevelId, setBulkLevelId] = useState('')
  const [bulkClassId, setBulkClassId] = useState('')
  const [bulkGraduationYear, setBulkGraduationYear] = useState('')
  const [bulkStudents, setBulkStudents] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  useEffect(() => {
    initData()
    fetchArchivedStudents()
  }, [])

  const getLevelFilter = () => {
    const dept = getAdminDepartment()
    return dept === "both" ? "/levels?select=*&order=name" : `/levels?select=*&department=eq.${dept}&order=name`
  }

  const initData = async () => {
    const levelData = await apiFetch(getLevelFilter())
    const parsedLevels = Array.isArray(levelData) ? levelData : []
    setLevels(parsedLevels)
    const levelIds = parsedLevels.map((l) => l.id)
    if (levelIds.length > 0) {
      const classData = await apiFetch(`/classes?select=*&level_id=in.(${levelIds.join(",")})&order=name`)
      setClasses(Array.isArray(classData) ? classData : [])
    }
  }

  const fetchArchivedStudents = async () => {
    try {
      const data = await apiFetch(
        "/students?select=*,classes(name),levels(name)&is_active=eq.false&order=archived_at.desc",
      )
      setArchivedStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error fetching archived students:", err)
    }
  }

  const fetchStudents = async () => {
    if (!filterClass) {
      setError("Please select a class first")
      return
    }
    setFetching(true)
    setError("")
    setSuccess("")

    try {
      const data = await apiFetch(
        `/students?select=id,student_number,full_name,gender&class_id=eq.${filterClass}&is_active=eq.true&order=full_name`,
      )
      setStudents(Array.isArray(data) ? data : [])
      setSelectedStudentIds([])
      if (!Array.isArray(data) || data.length === 0) {
        setError("No active students found in this class.")
      }
    } catch (err) {
      console.error("Error fetching students:", err)
      setError("Failed to fetch students")
    } finally {
      setFetching(false)
    }
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    )
  }

  const selectAllStudents = () => setSelectedStudentIds(students.map((s) => s.id))
  const deselectAllStudents = () => setSelectedStudentIds([])

  const handleArchive = async () => {
    if (selectedStudentIds.length === 0) {
      setError("Please select at least one student to archive")
      return
    }
    if (!archiveReason) {
      setError("Please select a reason for archiving.")
      return
    }
    const isSuspension = archiveReason.includes("Suspend")
    if (isSuspension && !suspensionEndDate) {
      setError("Please select a suspension duration.")
      return
    }
    if (archiveReason === "Graduated" && !graduationYear) {
      setError("Please enter a graduation year for graduated students")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const idsString = `(${selectedStudentIds.join(",")})`
      const payload = {
        is_active: false,
        archived_at: new Date().toISOString(),
        archive_reason: archiveReason,
        graduation_year: archiveReason === "Graduated" ? graduationYear : null,
        suspension_end_date: isSuspension ? suspensionEndDate : null,
      }
      await apiFetch(`/students?id=in.${idsString}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })

      setSuccess(
        `${selectedStudentIds.length} student(s) archived successfully${isSuspension ? `. Account will be automatically restored on ${new Date(suspensionEndDate).toLocaleDateString()}.` : ""}`,
      )
      setStudents((prev) => prev.filter((s) => !selectedStudentIds.includes(s.id)))
      setSelectedStudentIds([])
      setSuspensionDuration("")
      setSuspensionEndDate("")
      fetchArchivedStudents()
    } catch (err) {
      console.error("Archive error:", err)
      setError("Failed to archive students")
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (studentId) => {
    try {
      await apiFetch(`/students?id=eq.${studentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: true,
          archived_at: null,
          archive_reason: null,
          graduation_year: null,
        }),
      })
      setSuccess("Student restored successfully")
      fetchArchivedStudents()
    } catch (err) {
      console.error("Restore error:", err)
      setError("Failed to restore student")
    }
  }

  const fetchBulkPreview = async () => {
    if (!bulkClassId) { setBulkError('Please select a class.'); return }
    setBulkError('')
    try {
      const data = await apiFetch(`/students?class_id=eq.${bulkClassId}&is_active=eq.true&select=*`)
      setBulkStudents(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data.length === 0) setBulkError('No active students found in this class.')
    } catch (err) {
      console.error('Bulk preview failed:', err)
      setBulkError('Failed to load students preview')
    }
  }

  const handleBulkArchive = async () => {
    if (!bulkClassId || !bulkGraduationYear) {
      setBulkError('Please select a class and enter graduation year.')
      return
    }
    if (bulkStudents.length === 0) {
      setBulkError('No students to archive. Click Preview first.')
      return
    }
    setBulkLoading(true)
    setBulkError('')
    setBulkSuccess('')
    try {
      const data = await apiFetch(`/students?class_id=eq.${bulkClassId}&is_active=eq.true`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: false,
          archived_at: new Date().toISOString(),
          graduation_year: bulkGraduationYear,
          archive_reason: 'Graduated'
        }),
        prefer: 'return=minimal'
      })
      setBulkSuccess(`${bulkStudents.length} students archived successfully as Class of ${bulkGraduationYear}.`)
      setBulkStudents([])
      setBulkClassId('')
      setBulkLevelId('')
      setBulkGraduationYear('')
      setShowBulkConfirm(false)
      fetchArchivedStudents()
    } catch (err) {
      setBulkError('Bulk archive failed: ' + err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const availableClasses = classes.filter((cls) => cls.level_id === filterLevel)

  return (
    <div className="bg-[#0a0a0a] min-h-screen p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[#111111] border border-gray-800 rounded-2xl">
            <Archive className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Archive Students</h1>
            <p className="text-sm text-gray-400">Archive individual students or bulk archive JSS3 / SSS3 classes.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${!showArchived ? "bg-white text-black" : "bg-gray-900 text-gray-400"}`}
        >
          Archive Students
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${showArchived ? "bg-white text-black" : "bg-gray-900 text-gray-400"}`}
        >
          View Archived ({archivedStudents.length})
        </button>
      </div>

      {!showArchived ? (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border-l-4 border-red-500 flex items-center gap-3 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-950/50 border-l-4 border-emerald-500 flex items-center gap-3 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Bulk Class Archive */}
          <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-1">Bulk Class Archive</h2>
            <p className="text-sm text-gray-400 mb-4">For graduating classes (JSS3 and SSS3) — archive the entire class at once.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Level (JSS3 or SSS3)</label>
                <select value={bulkLevelId} onChange={e => { setBulkLevelId(e.target.value); setBulkClassId(''); setBulkStudents([]) }}
                  className="w-full form-select">
                  <option value="">Select Level</option>
                  {levels.filter(l => l.name?.toUpperCase().includes('3')).map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Class</label>
                <select value={bulkClassId} onChange={e => { setBulkClassId(e.target.value); setBulkStudents([]) }}
                  className="w-full form-select">
                  <option value="">Select Class</option>
                  {classes.filter(c => c.level_id === bulkLevelId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Graduation Year</label>
                <input type="text" value={bulkGraduationYear} onChange={e => setBulkGraduationYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full form-input" />
              </div>
            </div>
            <button onClick={fetchBulkPreview}
              className="flex items-center gap-2 bg-gray-900 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition mb-4">
              <Users size={16} /> Preview Students
            </button>
            {bulkError && <p className="text-red-400 text-sm mb-3">{bulkError}</p>}
            {bulkSuccess && <p className="text-emerald-400 text-sm mb-3">{bulkSuccess}</p>}
            {bulkStudents.length > 0 && (
              <div className="mb-4">
                <div className="bg-yellow-950/50 border border-yellow-800 rounded-xl p-3 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-400" />
                  <p className="text-yellow-300 text-sm font-medium">
                    {bulkStudents.length} students will be archived as Class of {bulkGraduationYear}.
                  </p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-800">
                  <table className="w-full text-sm" style={{ minWidth: '400px' }}>
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-400">Student Number</th>
                        <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-400">Full Name</th>
                        <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-400">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkStudents.map((s, i) => (
                        <tr key={s.id} className={i % 2 === 0 ? '' : 'bg-gray-900'}>
                          <td className="px-4 py-2 text-gray-400">{s.student_number}</td>
                          <td className="px-4 py-2 font-medium text-white">{s.full_name}</td>
                          <td className="px-4 py-2 text-gray-400 capitalize">{s.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!showBulkConfirm ? (
                  <button onClick={() => setShowBulkConfirm(true)}
                    className="mt-4 flex items-center gap-2 bg-red-950 border border-red-800 text-red-400 px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-900 transition">
                    <Archive size={16} /> Archive Entire Class
                  </button>
                ) : (
                  <div className="mt-4 bg-red-950/50 border border-red-800 rounded-xl p-4">
                    <p className="text-red-300 font-semibold text-sm mb-3">
                      Are you absolutely sure? This will archive all {bulkStudents.length} students. They will no longer appear as active.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={handleBulkArchive} disabled={bulkLoading}
                        className="flex items-center gap-2 bg-red-950 border border-red-800 text-red-400 px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-900 transition disabled:opacity-50">
                        {bulkLoading ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> : <Archive size={16} />}
                        Yes Archive All
                      </button>
                      <button onClick={() => setShowBulkConfirm(false)}
                        className="bg-gray-900 text-gray-300 px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-[#111111] rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-500" />
                Individual Archive
              </h2>
              <p className="text-xs text-gray-500 mb-4 -mt-2">Select a class then choose students to archive one by one.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Level</label>
                  <select
                    value={filterLevel}
                    onChange={(e) => {
                      setFilterLevel(e.target.value)
                      setFilterClass("")
                      setStudents([])
                      setSelectedStudentIds([])
                    }}
                    className="w-full form-select"
                  >
                    <option value="">Select Level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Class</label>
                  <select
                    value={filterClass}
                    onChange={(e) => {
                      setFilterClass(e.target.value)
                      setStudents([])
                      setSelectedStudentIds([])
                    }}
                    className="w-full form-select"
                    disabled={!filterLevel}
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={fetchStudents}
                disabled={!filterClass || fetching}
                className="w-full bg-gray-900 text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {fetching ? "Fetching..." : "Show Students"}
              </button>
            </div>

            <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Archive className="h-5 w-5 text-gray-500" />
                Archive Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Graduation Year</label>
                  <input
                    type="text"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                    disabled={archiveReason !== "Graduated"}
                    className="w-full form-input disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {archiveReason !== "Graduated" && (
                    <p className="mt-2 text-xs text-gray-500">
                      Graduation year is only required for graduated students.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Reason</label>
                  <select
                    value={archiveReason}
                    onChange={(e) => {
                      setArchiveReason(e.target.value)
                      setSuspensionDuration("")
                      setSuspensionEndDate("")
                    }}
                    className="w-full form-select"
                  >
                    <option value="">Select Reason</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended - Misbehavior</option>
                    <option value="Expelled">Expelled</option>
                    <option value="Transferred to another school">Transferred to another school</option>
                    <option value="Withdrew from school">Withdrew from school</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {(archiveReason === "Suspended") && (
                  <div className="bg-yellow-950/50 border border-yellow-800 rounded-xl p-4 space-y-3">
                    <p className="text-yellow-300 text-sm font-medium flex items-center gap-2">
                      <Clock size={16} /> Suspension Duration
                    </p>
                    <select
                      value={suspensionDuration}
                      onChange={(e) => {
                        setSuspensionDuration(e.target.value)
                        if (e.target.value !== "custom") {
                          setSuspensionEndDate(calculateSuspensionEndDate(e.target.value) || "")
                        } else {
                          setSuspensionEndDate("")
                        }
                      }}
                      className="w-full bg-[#111111] border border-yellow-800 rounded-xl px-3 py-2 text-sm text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    >
                      <option value="">Select Duration</option>
                      <option value="3_days">3 Days</option>
                      <option value="1_week">1 Week</option>
                      <option value="2_weeks">2 Weeks</option>
                      <option value="1_month">1 Month</option>
                      <option value="custom">Custom Date</option>
                    </select>

                    {suspensionDuration === "custom" && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Select End Date</label>
                        <input
                          type="date"
                          value={suspensionEndDate}
                          onChange={(e) => setSuspensionEndDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full bg-[#111111] border border-yellow-800 rounded-xl px-3 py-2 text-sm text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                        />
                      </div>
                    )}

                    {suspensionEndDate && (
                      <div className="bg-[#0a0a0a] rounded-xl p-3 border border-yellow-800">
                        <p className="text-xs text-gray-500">Suspension ends on:</p>
                        <p className="font-bold text-white">
                          {new Date(suspensionEndDate).toLocaleDateString("en-GB", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">
                          Account will be automatically restored on this date.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-4">
                    Selected: <span className="font-bold text-white">{selectedStudentIds.length} students</span>
                  </p>
                  <button
                    onClick={handleArchive}
                    disabled={selectedStudentIds.length === 0 || loading}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Archive className="h-5 w-5" />
                        Archive Selected
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {students.length > 0 && (
            <div className="bg-[#111111] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                <h3 className="font-semibold text-white">Students in Class</h3>
                <div className="flex gap-2">
                  <button onClick={selectAllStudents} className="text-xs font-medium text-blue-400 hover:underline">Select All</button>
                  <span className="text-gray-600">|</span>
                  <button onClick={deselectAllStudents} className="text-xs font-medium text-gray-500 hover:underline">Deselect All</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: '500px' }}>
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-400">Select</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-400">Student Number</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-400">Full Name</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-400">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? '' : 'bg-gray-900'}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="rounded border-gray-600 text-blue-400 focus:ring-blue-500 w-5 h-5 cursor-pointer bg-[#0a0a0a]"
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-400">{student.student_number}</td>
                        <td className="px-4 py-2 font-medium text-white">{student.full_name}</td>
                        <td className="px-4 py-2 text-gray-400 capitalize">{student.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#111111] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Student No.</th>
                  <th className="px-6 py-3 text-left font-medium">Full Name</th>
                  <th className="px-6 py-3 text-left font-medium">Year</th>
                  <th className="px-6 py-3 text-left font-medium">Reason</th>
                  <th className="px-6 py-3 text-left font-medium">Suspension Ends</th>
                  <th className="px-6 py-3 text-left font-medium">Archived On</th>
                  <th className="px-6 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {archivedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No archived students found.
                    </td>
                  </tr>
                ) : (
                  archivedStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 text-gray-300">{s.student_number}</td>
                      <td className="px-6 py-4 text-white">{s.full_name}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {s.archive_reason === "Graduated" ? s.graduation_year || "Not provided" : "Not provided"}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{s.archive_reason}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {s.suspension_end_date ? (
                          <span className={`text-xs font-medium ${new Date(s.suspension_end_date) <= new Date() ? 'text-emerald-400' : 'text-red-400'}`}>
                            {new Date(s.suspension_end_date) <= new Date() ? 'Ended' : new Date(s.suspension_end_date).toLocaleDateString()}
                          </span>
                        ) : 'Not provided'}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{s.archived_at ? new Date(s.archived_at).toLocaleDateString() : 'Not provided'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRestore(s.id)}
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-medium transition"
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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

export default ArchiveStudents
