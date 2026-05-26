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
  if (!text || text.trim() === "") return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const getAdminDepartment = () =>
  safeParseStaff() || {}.department || "both"

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

  useEffect(() => {
    fetchLevels()
    fetchClasses()
    fetchArchivedStudents()
  }, [])

  const getLevelFilter = () => {
    const dept = getAdminDepartment()
    return dept === "both" ? "/levels?select=*&order=name" : `/levels?select=*&department=eq.${dept}&order=name`
  }

  const fetchLevels = async () => {
    try {
      const data = await apiFetch(getLevelFilter())
      setLevels(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error fetching levels:", err)
    }
  }

  const fetchClasses = async () => {
    try {
      const data = await apiFetch("/classes?select=*&order=name")
      setClasses(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error fetching classes:", err)
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
          graduation_year: null,
          archive_reason: null,
          suspension_end_date: null,
        }),
      })
      setSuccess("Student restored successfully")
      fetchArchivedStudents()
    } catch (err) {
      console.error("Restore error:", err)
      setError("Failed to restore student")
    }
  }

  const availableClasses = classes.filter((cls) => cls.level_id === filterLevel)

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-900 text-white rounded-lg">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archive Students</h1>
            <p className="text-sm text-gray-500">Archive individual students or bulk archive JSS3 / SSS3 classes.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!showArchived ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          Archive Students
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${showArchived ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          View Archived ({archivedStudents.length})
        </button>
      </div>

      {!showArchived ? (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 flex items-center gap-3 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                Select Students
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={filterLevel}
                    onChange={(e) => {
                      setFilterLevel(e.target.value)
                      setFilterClass("")
                      setStudents([])
                      setSelectedStudentIds([])
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={filterClass}
                    onChange={(e) => {
                      setFilterClass(e.target.value)
                      setStudents([])
                      setSelectedStudentIds([])
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
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
                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {fetching ? "Fetching..." : "Show Students"}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Archive className="h-5 w-5 text-gray-400" />
                Archive Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input
                    type="text"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                    disabled={archiveReason !== "Graduated"}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {archiveReason !== "Graduated" && (
                    <p className="mt-2 text-xs text-gray-500">
                      Graduation year is only required for graduated students.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <select
                    value={archiveReason}
                    onChange={(e) => {
                      setArchiveReason(e.target.value)
                      setSuspensionDuration("")
                      setSuspensionEndDate("")
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="">Select Reason</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended - Misconduct">Suspended - Misconduct</option>
                    <option value="Suspended - Misbehavior">Suspended - Misbehavior</option>
                    <option value="Expelled">Expelled</option>
                    <option value="Transferred to another school">Transferred to another school</option>
                    <option value="Withdrew from school">Withdrew from school</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {(archiveReason === "Suspended - Misconduct" || archiveReason === "Suspended - Misbehavior") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                    <p className="text-yellow-800 text-sm font-medium flex items-center gap-2">
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
                      className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                        <label className="block text-xs text-gray-600 mb-1">Select End Date</label>
                        <input
                          type="date"
                          value={suspensionEndDate}
                          onChange={(e) => setSuspensionEndDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                    )}

                    {suspensionEndDate && (
                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs text-gray-500">Suspension ends on:</p>
                        <p className="font-bold text-gray-900">
                          {new Date(suspensionEndDate).toLocaleDateString("en-GB", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Account will be automatically restored on this date.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-4">
                    Selected: <span className="font-bold text-gray-900">{selectedStudentIds.length} students</span>
                  </p>
                  <button
                    onClick={handleArchive}
                    disabled={selectedStudentIds.length === 0 || loading}
                    className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-900">Students in Class</h3>
                <div className="flex gap-2">
                  <button onClick={selectAllStudents} className="text-xs font-medium text-blue-900 hover:underline">Select All</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={deselectAllStudents} className="text-xs font-medium text-gray-500 hover:underline">Deselect All</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: '500px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Select</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Student Number</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Full Name</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-5 h-5 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-600">{student.student_number}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{student.full_name}</td>
                        <td className="px-4 py-2 text-gray-600 capitalize">{student.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
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
              <tbody className="divide-y divide-gray-200">
                {archivedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No archived students found.
                    </td>
                  </tr>
                ) : (
                  archivedStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4">{s.student_number}</td>
                      <td className="px-6 py-4">{s.full_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {s.archive_reason === "Graduated" ? s.graduation_year || "N/A" : "N/A"}
                      </td>
                      <td className="px-6 py-4">{s.archive_reason}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {s.suspension_end_date ? (
                          <span className={`text-xs font-medium ${new Date(s.suspension_end_date) <= new Date() ? 'text-green-600' : 'text-red-600'}`}>
                            {new Date(s.suspension_end_date) <= new Date() ? 'Ended' : new Date(s.suspension_end_date).toLocaleDateString()}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">{s.archived_at ? new Date(s.archived_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRestore(s.id)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
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

export default ArchiveStudents
