import React, { useState, useEffect } from "react";
import { Archive, Users, CheckCircle, AlertCircle, Search } from "lucide-react";
import { ANON_KEY, SUPABASE_URL } from "../../lib/config";

const getAuth = () => {
  const staffData = localStorage.getItem("mbhs_staff");
  if (!staffData)
    return {
      token: null,
      apikey: ANON_KEY,
      baseUrl: `${SUPABASE_URL}/rest/v1`,
    };

  const staff = JSON.parse(staffData);
  return {
    token: staff?.access_token,
    apikey: ANON_KEY,
    baseUrl: `${SUPABASE_URL}/rest/v1`,
  };
};

const apiFetch = async (endpoint, options = {}) => {
  const { token, apikey, baseUrl } = getAuth();

  if (!token) {
    console.error("No authentication token found.");
    // Optional: redirect to login or show an error
    return null;
  }

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

  if (res.status === 401) {
    console.error("Unauthorized: Please log in again.");
    return null;
  }

  const text = await res.text();
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const getAdminDepartment = () =>
  JSON.parse(localStorage.getItem("mbhs_staff") || "{}").department || "both";

const ArchiveStudents = () => {
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [graduationYear, setGraduationYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [archiveReason, setArchiveReason] = useState("Graduated");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const handleRestore = async (studentId) => {
    try {
      await apiFetch(`/students?id=eq.${studentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: true,
          archived_at: null,
          graduation_year: null,
          archive_reason: null,
        }),
      });
      setSuccess("Student restored successfully");
      fetchArchivedStudents();
    } catch (err) {
      console.error("Restore error:", err);
      setError("Failed to restore student");
    }
  };

  useEffect(() => {
    fetchLevels();
    fetchClasses();
    fetchArchivedStudents();
  }, []);

  const fetchLevels = async () => {
    try {
      const dept = getAdminDepartment();
      const endpoint =
        dept === "both"
          ? "/levels?select=*&order=name"
          : `/levels?select=*&department=eq.${dept}&order=name`;
      const data = await apiFetch(endpoint);
      console.log("Levels response:", data); // Debugging
      setLevels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching levels:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await apiFetch("/classes?select=*&order=name");
      console.log("Classes response:", data); // Debugging
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchArchivedStudents = async () => {
    try {
      const data = await apiFetch(
        `/students?select=*,classes(name),levels(name)&is_active=eq.false&order=archived_at.desc`,
      );
      console.log("Archived students response:", data); // Debugging
      setArchivedStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching archived students:", error);
    }
  };

  const fetchStudents = async () => {
    if (!filterClass) {
      setError("Please select a class first");
      return;
    }
    setFetching(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiFetch(
        `/students?select=id,student_number,full_name,gender&class_id=eq.${filterClass}&is_active=eq.true&order=full_name`,
      );
      console.log("Students fetched for archiving:", data);
      setStudents(Array.isArray(data) ? data : []);
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    } finally {
      setFetching(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(students.map((s) => s.id));
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleArchive = async () => {
    if (selectedStudentIds.length === 0) {
      setError("Please select at least one student to archive");
      return;
    }
    if (!graduationYear) {
      setError("Please enter a graduation year");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const idsString = `(${selectedStudentIds.join(",")})`;
      await apiFetch(`/students?id=in.${idsString}`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: false,
          archived_at: new Date().toISOString(),
          graduation_year: graduationYear,
          archive_reason: archiveReason,
        }),
      });

      setSuccess(
        `${selectedStudentIds.length} student(s) archived successfully`,
      );
      setStudents((prev) =>
        prev.filter((s) => !selectedStudentIds.includes(s.id)),
      );
      setSelectedStudentIds([]);
      fetchArchivedStudents();
    } catch (err) {
      console.error("Archive error:", err);
      setError("Failed to archive students");
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = classes.filter(
    (cls) => cls.level_id === filterLevel,
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-900 text-white rounded-lg">
          <Archive className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archive Students</h1>
          <p className="text-sm text-gray-500">
            Bulk archive students by class or view archived students.
          </p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select
                    value={filterLevel}
                    onChange={(e) => {
                      setFilterLevel(e.target.value);
                      setFilterClass("");
                      setStudents([]);
                      setSelectedStudentIds([]);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    value={filterClass}
                    onChange={(e) => {
                      setFilterClass(e.target.value);
                      setStudents([]);
                      setSelectedStudentIds([]);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="text"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <select
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="Graduated">Graduated</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-4">
                    Selected:{" "}
                    <span className="font-bold text-gray-900">
                      {selectedStudentIds.length} students
                    </span>
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
                <h3 className="font-semibold text-gray-900">
                  Students in Class
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllStudents}
                    className="text-xs font-medium text-blue-900 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={deselectAllStudents}
                    className="text-xs font-medium text-gray-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Select</th>
                    <th className="px-6 py-3 text-left font-medium">
                      Student No.
                    </th>
                    <th className="px-6 py-3 text-left font-medium">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left font-medium">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedStudentIds.includes(student.id) ? "bg-blue-50" : ""}`}
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {student.student_number}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.gender}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Student No.</th>
                <th className="px-6 py-3 text-left font-medium">Full Name</th>
                <th className="px-6 py-3 text-left font-medium">
                  Graduation Year
                </th>
                <th className="px-6 py-3 text-left font-medium">Reason</th>
                <th className="px-6 py-3 text-left font-medium">Archived On</th>
                <th className="px-6 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {archivedStudents.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-4">{s.student_number}</td>
                  <td className="px-6 py-4">{s.full_name}</td>
                  <td className="px-6 py-4">{s.graduation_year}</td>
                  <td className="px-6 py-4">{s.archive_reason}</td>
                  <td className="px-6 py-4">
                    {new Date(s.archived_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleRestore(s.id)}
                      className="text-green-600 hover:text-green-800 text-xs font-medium"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArchiveStudents;
