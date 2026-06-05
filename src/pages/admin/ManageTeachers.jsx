import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff} from "../../lib/config";

const getToken = () => {
  const staff = safeParseStaff() || {};
  return staff.access_token || ANON_KEY;
};

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    level_id: "",
    class_id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getAdminDepartment = () => {
    const staff = safeParseStaff() || {};
    return staff.department || "both";
  };

  const getDepartmentLevels = async () => {
    const dept = getAdminDepartment();
    const url =
      dept === "both"
        ? `${BASE_URL}/levels?select=*&order=name`
        : `${BASE_URL}/levels?select=*&department=eq.${dept}&order=name`;
    const res = await fetch(url, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${getToken()}` },
    });
    return await res.json();
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchLevels();
      await fetchClasses();
      await fetchTeachers();
      setLoading(false);
    };
    loadData();
  }, []);

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

      const res = await fetch(
        `${BASE_URL}/classes?select=*&level_id=in.(${levelIds.join(",")})`,
        {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${getToken()}` },
        },
      );
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const levelData = await getDepartmentLevels();
      const levelIds = levelData.map((l) => l.id);

      if (levelIds.length === 0) {
        setTeachers([]);
        return;
      }

      const res = await fetch(
        `${BASE_URL}/teachers?select=*&level_id=in.(${levelIds.join(",")})&order=created_at.desc`,
        {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${getToken()}` },
        },
      );
      const teachers = await res.json();

      const enriched = await Promise.all(
        (Array.isArray(teachers) ? teachers : []).map(async (teacher) => {
          try {
            const [profileRes, classRes, levelRes] = await Promise.all([
              fetch(
                `${BASE_URL}/profiles?id=eq.${teacher.profile_id}&select=full_name,email`,
                {
                  headers: {
                    apikey: ANON_KEY,
                    Authorization: `Bearer ${getToken()}`,
                  },
                },
              ),
              fetch(
                `${BASE_URL}/classes?id=eq.${teacher.class_id}&select=name`,
                {
                  headers: {
                    apikey: ANON_KEY,
                    Authorization: `Bearer ${getToken()}`,
                  },
                },
              ),
              fetch(
                `${BASE_URL}/levels?id=eq.${teacher.level_id}&select=name`,
                {
                  headers: {
                    apikey: ANON_KEY,
                    Authorization: `Bearer ${getToken()}`,
                  },
                },
              ),
            ]);
            const profile = await profileRes.json();
            const cls = await classRes.json();
            const level = await levelRes.json();
            return {
              ...teacher,
              full_name: profile[0]?.full_name || "Unknown",
              email: profile[0]?.email || "",
              class_name: cls[0]?.name || "Not Assigned",
              level_name: level[0]?.name || "Not Assigned",
            };
          } catch (err) {
            console.error("Error enriching teacher:", err);
            return {
              ...teacher,
              full_name: "Unknown",
              email: "",
              class_name: "Not Assigned",
              level_name: "Not Assigned",
            };
          }
        }),
      );
      setTeachers(enriched);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Failed to fetch teachers");
      setTeachers([]);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.full_name.trim() ||
      !formData.email ||
      !formData.password ||
      !formData.gender ||
      !formData.level_id ||
      !formData.class_id
    ) {
      setError("All required fields must be filled");
      return;
    }

    try {
      // Step 0: Check if email already exists in profiles
      const existingProfileRes = await fetch(
        `${BASE_URL}/profiles?email=eq.${encodeURIComponent(formData.email)}&select=id`,
        {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${getToken()}` },
        },
      );
      const existingProfiles = await existingProfileRes.json();
      if (Array.isArray(existingProfiles) && existingProfiles.length > 0) {
        setError(`Email "${formData.email}" is already registered in the system`);
        return;
      }

      // ⚠️ Replace with your service_role key from Supabase Dashboard → Settings → API
      // Step 1: Create auth user via admin API (requires service_role key)
      const authRes = await fetch(`${AUTH_URL}/admin/users`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: { full_name: formData.full_name, role: "teacher" },
        }),
      });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.id) {
        let msg = authData?.message || authData?.msg || JSON.stringify(authData);
        // Handle specific error cases
        if (authRes.status === 422 && msg.includes("already been registered")) {
          msg = `Email "${formData.email}" is already registered. Please use a different email.`;
        }
        throw new Error(`Auth API error (${authRes.status}): ${msg}`);
      }
      const newUserId = authData.id;

      // Step 2: Generate employee number (with fallback)
      const token = getToken();
      let employeeNumber = null;
      try {
        const empRes = await fetch(`${BASE_URL}/rpc/generate_employee_number`, {
          method: "POST",
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const empData = await empRes.json();
        if (typeof empData === "string" && empData.startsWith("MBHS")) {
          employeeNumber = empData;
        }
      } catch (empErr) {
        console.warn(
          "generate_employee_number RPC failed, using fallback:",
          empErr,
        );
      }
      if (!employeeNumber) {
        const ts = Date.now().toString().slice(-5);
        employeeNumber = `MBHS-EMP-${ts}`;
      }

      // Step 3: Insert profile
      const profileRes = await fetch(`${BASE_URL}/profiles`, {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          id: newUserId,
          full_name: formData.full_name,
          email: formData.email,
          role: "teacher",
        }),
      });
      if (!profileRes.ok) {
        const profileErr = await profileRes.text();
        throw new Error(`Profile insert failed: ${profileErr}`);
      }

      // Step 4: Insert teacher record
      const teacherRes = await fetch(`${BASE_URL}/teachers`, {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          profile_id: newUserId,
          employee_number: employeeNumber,
          phone: formData.phone,
          gender: formData.gender.toLowerCase(),
          level_id: formData.level_id,
          class_id: formData.class_id,
        }),
      });
      if (!teacherRes.ok) {
        const teacherErr = await teacherRes.text();
        throw new Error(`Teacher insert failed: ${teacherErr}`);
      }

      setSuccess("Teacher created successfully");
      setFormData({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        gender: "",
        level_id: "",
        class_id: "",
      });
      await fetchTeachers();
    } catch (error) {
      console.error("Error creating teacher:", error);
      setError(error.message || "Failed to create teacher");
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${teacher.full_name || 'this teacher'}? This cannot be undone.`)) return

    const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

    try {
      await fetch(`${BASE_URL}/teacher_subjects?teacher_id=eq.${teacher.id}`, {
        method: 'DELETE',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${getToken()}` }
      })

      await fetch(`${BASE_URL}/teachers?id=eq.${teacher.id}`, {
        method: 'DELETE',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${getToken()}` }
      })

      if (teacher.profile_id) {
        await fetch(`${BASE_URL}/profiles?id=eq.${teacher.profile_id}`, {
          method: 'DELETE',
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${getToken()}` }
        })

        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${teacher.profile_id}`, {
          method: 'DELETE',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        })
      }

      setSuccess('Teacher deleted successfully.')
      await fetchTeachers()
    } catch (err) {
      setError('Failed to delete teacher: ' + err.message)
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <h1 className="page-title">Teacher Management</h1>
        <p className="text-gray-400 mt-2">Create and manage teaching staff</p>
      </div>

      <div className="bg-[#111111] p-6 rounded-2xl border border-gray-800 mb-8">
        <h2 className="section-title mb-4">Create New Teacher</h2>

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

        <form onSubmit={handleCreateTeacher}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
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
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password"
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone number"
                className="w-full form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
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
              <label className="block text-sm font-medium text-gray-400 mb-2">
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
              <label className="block text-sm font-medium text-gray-400 mb-2">
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
          </div>

          <button
            type="submit"
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Teacher
          </button>
        </form>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="section-title">All Teachers</h2>
        </div>

        {teachers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p>No teachers found. Create your first teacher above.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
              <thead className="bg-gray-900">
                <tr>
                  <th className="table-header">Employee Number</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Gender</th>
                  <th className="table-header">Level</th>
                  <th className="table-header">Class</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {teacher.employee_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {teacher.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {teacher.phone || "Not provided"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {teacher.gender || "Not provided"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {teacher.level_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {teacher.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  );
};

export default ManageTeachers;
