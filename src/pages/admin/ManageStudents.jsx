import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
  Archive,
  RotateCcw,
} from "lucide-react";
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff} from "../../lib/config";

const getAuth = () => {
  const staff = safeParseStaff() || {};
  return {
    token: staff?.access_token,
    apikey: ANON_KEY,
    baseUrl: `${SUPABASE_URL}/rest/v1`,
  };
};

const getToken = () => {
  const { token } = getAuth();
  return token || ANON_KEY;
};

const apiFetch = async (endpoint, options = {}) => {
  const { token, apikey, baseUrl } = getAuth();
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      apikey: apikey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
  });
  const text = await res.text();
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    level_id: "",
    class_id: "",
    date_of_birth: "",
    gender: "",
    guardian_name: "",
    guardian_phone: "",
    pin: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showArchived, setShowArchived] = useState(false)
  const [archiveModalStudent, setArchiveModalStudent] = useState(null)
  const [archiveReason, setArchiveReason] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [suspensionDuration, setSuspensionDuration] = useState('')
  const [suspensionEndDate, setSuspensionEndDate] = useState('')
  const [bulkLevelId, setBulkLevelId] = useState('')
  const [bulkClassId, setBulkClassId] = useState('')
  const [bulkGraduationYear, setBulkGraduationYear] = useState('')
  const [bulkStudents, setBulkStudents] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSuccess, setBulkSuccess] = useState('')
  const [bulkError, setBulkError] = useState('')
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const getAdminDepartment = () => {
    const staff = safeParseStaff() || {};
    return staff.department || "both";
  };

  const getDepartmentLevels = async () => {
    const dept = getAdminDepartment();
    const url =
      dept === "both"
        ? "/levels?select=*&order=name"
        : `/levels?select=*&department=eq.${dept}&order=name`;
    const res = await apiFetch(url);
    return Array.isArray(res) ? res : [];
  };

  useEffect(() => {
    fetchStudents();
    fetchArchivedStudents();
    fetchLevels();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const levelData = await getDepartmentLevels();
      const levelIds = levelData.map((l) => l.id);

      if (levelIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const data = await apiFetch(
        `/students?select=*,classes(name),levels(name)&level_id=in.(${levelIds.join(",")})&is_active=eq.true&order=created_at.desc`,
      );
      console.log("Students fetched:", data);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedStudents = async () => {
    try {
      const levelData = await getDepartmentLevels();
      const levelIds = levelData.map((l) => l.id);

      if (levelIds.length === 0) {
        setArchivedStudents([]);
        return;
      }

      const data = await apiFetch(
        `/students?select=*,classes(name),levels(name)&level_id=in.(${levelIds.join(",")})&is_active=eq.false&order=archived_at.desc`,
      );
      console.log("Archived students fetched:", data);
      setArchivedStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching archived students:", error);
    }
  };

  const calculateSuspensionEndDate = (duration) => {
    const today = new Date()
    switch (duration) {
      case '3_days': today.setDate(today.getDate() + 3); break
      case '1_week': today.setDate(today.getDate() + 7); break
      case '2_weeks': today.setDate(today.getDate() + 14); break
      case '1_month': today.setMonth(today.getMonth() + 1); break
      default: return ''
    }
    return today.toISOString().split('T')[0]
  }

  const handleArchiveStudent = async () => {
    if (!archiveModalStudent) return
    if (!archiveReason) { alert('Please select a reason.'); return }

    const isSuspension = archiveReason.toLowerCase().includes('suspend')
    if (isSuspension && !suspensionEndDate) { alert('Please select suspension duration.'); return }
    if (archiveReason === 'Graduated' && !graduationYear) { alert('Please enter graduation year.'); return }

    try {
      await fetch(`${BASE_URL}/students?id=eq.${archiveModalStudent.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: false,
          archived_at: new Date().toISOString(),
          archive_reason: archiveReason,
          graduation_year: archiveReason === 'Graduated' ? graduationYear : null,
          suspension_end_date: isSuspension ? suspensionEndDate : null
        })
      })
      setArchiveModalStudent(null)
      setArchiveReason('')
      setGraduationYear('')
      setSuspensionDuration('')
      setSuspensionEndDate('')
      await fetchStudents()
      await fetchArchivedStudents()
    } catch (err) { alert('Archive failed: ' + err.message) }
  }

  const handleRestoreStudent = async (studentId) => {
    if (!window.confirm('Restore this student to active status?')) return
    try {
      await fetch(`${BASE_URL}/students?id=eq.${studentId}`, {
        method: 'PATCH',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: true,
          archived_at: null,
          archive_reason: null,
          graduation_year: null,
          suspension_end_date: null
        })
      })
      await fetchStudents()
      await fetchArchivedStudents()
    } catch (err) { alert('Restore failed: ' + err.message) }
  }

  const fetchLevels = async () => {
    try {
      const data = await getDepartmentLevels();
      setLevels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching levels:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const levelData = await getDepartmentLevels();
      const levelIds = levelData.map((l) => l.id);

      if (levelIds.length === 0) {
        setClasses([]);
        return;
      }

      const data = await apiFetch(
        `/classes?select=*&level_id=in.(${levelIds.join(",")})`,
      );
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      console.log("Creating student with data:", formData);

      // Step 1 - Check if PIN already exists
      const staff = safeParseStaff() || {};
      const token = staff?.access_token;
      const apikey = ANON_KEY;

      const pinCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/students?pin=eq.${formData.pin}&select=id`,
        {
          headers: {
            apikey: apikey,
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const pinExists = await pinCheck.json();
      if (pinExists && pinExists.length > 0) {
        setError(
          "This PIN is already assigned to another student. Please use a different PIN.",
        );
        setLoading(false);
        return;
      }

      // Step 2 - Get auto generated student number
      let studentNumber = null;
      try {
        const numRes = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/generate_student_number`,
          {
            method: "POST",
            headers: {
              apikey: apikey,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          },
        );
        const numData = await numRes.json();
        console.log("RPC generate_student_number result:", numData);
        // Only use result if it's a valid string
        if (typeof numData === "string" && numData.startsWith("MBHS")) {
          studentNumber = numData;
        }
      } catch (rpcErr) {
        console.warn(
          "generate_student_number RPC failed, using fallback:",
          rpcErr,
        );
      }

      // Fallback: generate student number manually
      if (!studentNumber) {
        const ts = Date.now().toString().slice(-6);
        studentNumber = `MBHS-STU-${ts}`;
      }
      console.log("Using student number:", studentNumber);

      // Step 3 - Save student to database
      const studentData = {
        full_name: formData.full_name,
        student_number: studentNumber,
        class_id: formData.class_id,
        level_id: formData.level_id,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender.toLowerCase(),
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        pin: formData.pin,
        is_active: true,
      };
      console.log("Sending student data:", JSON.stringify(studentData));

      const res = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: "POST",
        headers: {
          apikey: apikey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(studentData),
      });

      const responseText = await res.text();
      console.log("Response status:", res.status);
      console.log("Response body:", responseText);

      if (!res.ok) {
        let errorMsg = responseText;
        try {
          errorMsg = JSON.parse(responseText)?.message || responseText;
        } catch {}
        setError("Failed to create student: " + errorMsg);
        setLoading(false);
        return;
      }

      const newStudent = JSON.parse(responseText);
      console.log("Student created:", newStudent);
      setSuccess(
        `Student created successfully! Name: ${formData.full_name} | PIN: ${formData.pin}`,
      );
      await fetchStudents();
      // Clear form
      setFormData({
        full_name: "",
        level_id: "",
        class_id: "",
        date_of_birth: "",
        gender: "",
        guardian_name: "",
        guardian_phone: "",
        pin: "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error creating student:", error);
      setError("Failed to create student");
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      console.log("Deleting student:", id);
      await apiFetch(`/students?id=eq.${id}`, {
        method: "DELETE",
      });
      console.log("Student deleted successfully");
      setSuccess("Student deleted successfully");
      // Refresh the list
      await fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      setError("Failed to delete student");
    }
  };

  const fetchBulkPreview = async () => {
    if (!bulkClassId) { setBulkError('Please select a class.'); return }
    setBulkError('')
    try {
      const res = await fetch(`${BASE_URL}/students?class_id=eq.${bulkClassId}&is_active=eq.true&select=*`, {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${getToken()}`,
        },
      })
      const data = await res.json()
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
      const res = await fetch(`${BASE_URL}/students?class_id=eq.${bulkClassId}&is_active=eq.true`, {
        method: 'PATCH',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: false,
          archived_at: new Date().toISOString(),
          graduation_year: bulkGraduationYear,
          archive_reason: 'Graduated'
        })
      })
      console.log('Bulk archive status:', res.status)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Bulk archive request failed')
      }
      setBulkSuccess(`${bulkStudents.length} students archived successfully as Class of ${bulkGraduationYear}.`)
      setBulkStudents([])
      setBulkClassId('')
      setBulkLevelId('')
      setBulkGraduationYear('')
      setShowBulkConfirm(false)
      await fetchStudents()
      await fetchArchivedStudents()
    } catch (err) {
      setBulkError('Bulk archive failed: ' + err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter students by class and level
  const filteredStudents = students.filter((student) => {
    const classMatch = !filterClass || student.class_id === filterClass;
    const levelMatch = !filterLevel || student.level_id === filterLevel;
    return classMatch && levelMatch && student.is_active === true;
  });

  // Get available classes for selected level
  const availableClasses = filterLevel
    ? classes.filter((cls) => cls.level_id === filterLevel)
    : [];

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <h1 className="page-title">Student Management</h1>
        <p className="text-gray-600 mt-2">Create and manage student records</p>
      </div>

      {/* Create Student Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Create New Student</h2>

        {error && (
          <div className="mb-4 flex items-center error-message">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center success-message">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        <form onSubmit={handleCreateStudent}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Enter full name"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <select
                value={formData.level_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level_id: e.target.value,
                    class_id: "",
                  })
                }
                className="w-full form-select"
                required
              >
                <option value="">Select level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                value={formData.class_id}
                onChange={(e) =>
                  setFormData({ ...formData, class_id: e.target.value })
                }
                className="w-full form-select"
                required
                disabled={!formData.level_id}
              >
                <option value="">Select class</option>
                {classes
                  .filter((cls) => cls.level_id === formData.level_id)
                  .map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full form-select"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian Name *
              </label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) =>
                  setFormData({ ...formData, guardian_name: e.target.value })
                }
                placeholder="Enter guardian's name"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian Phone *
              </label>
              <input
                type="tel"
                value={formData.guardian_phone}
                onChange={(e) =>
                  setFormData({ ...formData, guardian_phone: e.target.value })
                }
                placeholder="Enter guardian's phone"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4-digit PIN *
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
                placeholder="Enter 4-digit PIN"
                className="w-full form-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Student
          </button>
        </form>
      </div>

      {/* Toggle Active / Archived */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!showArchived ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Active Students ({students.length})
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${showArchived ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Archived Students ({archivedStudents.length})
        </button>
      </div>

      {/* Bulk Archive Section */}
      {!showArchived && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Bulk Class Archive</h2>
          <p className="text-sm text-gray-500 mb-4">For graduating classes (JSS3 and SSS3) — archive the entire class at once.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Level (JSS3 or SSS3)</label>
              <select value={bulkLevelId} onChange={e => { setBulkLevelId(e.target.value); setBulkClassId(''); setBulkStudents([]) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                <option value="">Select Level</option>
                {levels.filter(l => l.name?.toUpperCase().includes('3')).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
              <select value={bulkClassId} onChange={e => { setBulkClassId(e.target.value); setBulkStudents([]) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                <option value="">Select Class</option>
                {classes.filter(c => c.level_id === bulkLevelId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Graduation Year</label>
              <input type="text" value={bulkGraduationYear} onChange={e => setBulkGraduationYear(e.target.value)}
                placeholder="e.g. 2026"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>
          </div>
          <button onClick={fetchBulkPreview}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 mb-4">
            <Users size={16} /> Preview Students
          </button>
          {bulkError && <p className="text-red-600 text-sm mb-3">{bulkError}</p>}
          {bulkSuccess && <p className="text-green-600 text-sm mb-3">{bulkSuccess}</p>}
          {bulkStudents.length > 0 && (
            <div className="mb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-600" />
                <p className="text-yellow-800 text-sm font-medium">
                  {bulkStudents.length} students will be archived as Class of {bulkGraduationYear}.
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm" style={{ minWidth: '400px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Student Number</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Full Name</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-gray-500">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkStudents.map((s, i) => (
                      <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-gray-600">{s.student_number}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{s.full_name}</td>
                        <td className="px-4 py-2 text-gray-600 capitalize">{s.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!showBulkConfirm ? (
                <button onClick={() => setShowBulkConfirm(true)}
                  className="mt-4 flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
                  <Archive size={16} /> Archive Entire Class
                </button>
              ) : (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold text-sm mb-3">
                    Are you absolutely sure? This will archive all {bulkStudents.length} students. They will no longer appear as active.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleBulkArchive} disabled={bulkLoading}
                      className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                      {bulkLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Archive size={16} />}
                      Yes Archive All
                    </button>
                    <button onClick={() => setShowBulkConfirm(false)}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Students Table */}
      {!showArchived && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Active Students ({students.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Student Number</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Full Name</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Gender</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No active students found.</td></tr>
                ) : students.map((student, i) => (
                  <tr key={student.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-600">{student.student_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{student.gender}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setArchiveModalStudent(student)}
                        className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                      >
                        <Archive size={14} /> Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Archived Students Table */}
      {showArchived && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Archived Students ({archivedStudents.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '800px' }}>
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Student Number</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Full Name</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Reason</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Graduation Year</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Suspension Ends</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Archived On</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedStudents.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No archived students.</td></tr>
                ) : archivedStudents.map((student, i) => (
                  <tr key={student.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-600">{student.student_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.full_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        student.archive_reason?.includes('Suspend') ? 'bg-yellow-100 text-yellow-700' :
                        student.archive_reason?.includes('Expel') ? 'bg-red-100 text-red-700' :
                        student.archive_reason === 'Graduated' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {student.archive_reason || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{student.graduation_year || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {student.suspension_end_date ? (
                        <span className={`text-xs font-medium ${new Date(student.suspension_end_date) <= new Date() ? 'text-green-600' : 'text-red-600'}`}>
                          {new Date(student.suspension_end_date) <= new Date() ? 'Ended' : new Date(student.suspension_end_date).toLocaleDateString()}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {student.archived_at ? new Date(student.archived_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRestoreStudent(student.id)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium">
                        <RotateCcw size={14} /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveModalStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Archive Student</h2>
            <p className="text-sm text-gray-600 mb-4">
              Archiving <span className="font-semibold">{archiveModalStudent.full_name}</span>
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Reason</label>
                <select value={archiveReason}
                  onChange={e => { setArchiveReason(e.target.value); setSuspensionDuration(''); setSuspensionEndDate(''); setGraduationYear('') }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
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

              {archiveReason === 'Graduated' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Graduation Year</label>
                  <input type="text" value={graduationYear} onChange={e => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
              )}

              {(archiveReason === 'Suspended - Misconduct' || archiveReason === 'Suspended - Misbehavior') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <p className="text-yellow-800 text-sm font-semibold">Suspension Duration</p>
                  <select value={suspensionDuration}
                    onChange={e => {
                      setSuspensionDuration(e.target.value)
                      if (e.target.value !== 'custom') {
                        setSuspensionEndDate(calculateSuspensionEndDate(e.target.value))
                      } else {
                        setSuspensionEndDate('')
                      }
                    }}
                    className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    <option value="">Select Duration</option>
                    <option value="3_days">3 Days</option>
                    <option value="1_week">1 Week</option>
                    <option value="2_weeks">2 Weeks</option>
                    <option value="1_month">1 Month</option>
                    <option value="custom">Custom Date</option>
                  </select>
                  {suspensionDuration === 'custom' && (
                    <input type="date" value={suspensionEndDate}
                      onChange={e => setSuspensionEndDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm" />
                  )}
                  {suspensionEndDate && (
                    <div className="bg-white rounded-lg p-3 border border-yellow-200">
                      <p className="text-xs text-gray-500">Suspension ends on:</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {new Date(suspensionEndDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Account will be automatically restored on this date.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleArchiveStudent}
                className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
                Confirm Archive
              </button>
              <button onClick={() => { setArchiveModalStudent(null); setArchiveReason(''); setGraduationYear(''); setSuspensionDuration(''); setSuspensionEndDate('') }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
            </div>
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
  );
};

export default ManageStudents;
