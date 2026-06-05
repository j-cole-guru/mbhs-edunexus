import React, { useState, useEffect } from "react";
import { Plus, Trash2, Layers, CheckCircle, AlertCircle } from "lucide-react";
import {ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, getToken, safeParseStaff, logAudit} from "../../lib/config";

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
  });
  const text = await res.text();
  console.log(`[${options.method || "GET"}] ${BASE_URL}${endpoint}`);
  console.log("Status:", res.status);
  console.log("Response:", text);
  if (!res.ok) {
    let errMsg = `API Error: ${res.status}`;
    try { const d = JSON.parse(text); errMsg = d.message || d.error || errMsg; } catch {}
    throw new Error(errMsg);
  }
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const ManageLevels = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelDepartment, setNewLevelDepartment] = useState("");
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
        ? "/levels?select=*&order=name"
        : `/levels?select=*&department=eq.${dept}&order=name`;
    const data = await apiFetch(url);
    return data;
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const data = await getDepartmentLevels();
      console.log("Levels fetched:", data);
      setLevels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching levels:", error);
      setError("Failed to fetch levels");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLevel = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newLevelName.trim()) {
      setError("Level name is required");
      return;
    }

    const dept = newLevelDepartment || getAdminDepartment();
    if (!dept || dept === "both") {
      setError("Department is required");
      return;
    }

    try {
      console.log(
        "Creating level:",
        newLevelName.trim(),
        "Department:",
        dept,
      );
      const data = await apiFetch("/levels", {
        method: "POST",
        body: JSON.stringify({
          name: newLevelName.trim(),
          department: dept,
        }),
        prefer: "return=representation",
      });
      console.log("Level created successfully:", data);
      setNewLevelName("");
      setNewLevelDepartment("");
      setSuccess("Level created successfully");
      await logAudit('Create Level', `Created level ${newLevelName}`);
      // Refresh the list
      await fetchLevels();
    } catch (error) {
      console.error("Error creating level:", error);
      setError("Failed to create level");
    }
  };

  const handleDeleteLevel = async (id) => {
    if (!confirm("Are you sure you want to delete this level?")) {
      return;
    }

    // Pre‑check: ensure no classes or students reference this level
    try {
      const classDeps = await apiFetch(`/classes?level_id=eq.${id}&select=id`, { method: "GET" });
      if (Array.isArray(classDeps) && classDeps.length > 0) {
        alert('Cannot delete this level because it has associated classes. Delete or reassign them first.');
        return;
      }
      const studentDeps = await apiFetch(`/students?level_id=eq.${id}&select=id`, { method: "GET" });
      if (Array.isArray(studentDeps) && studentDeps.length > 0) {
        alert('Cannot delete this level because it has associated students. Delete or reassign them first.');
        return;
      }
    } catch (preErr) {
      console.warn('Dependency check failed:', preErr);
      // Continue with deletion attempt if check failed
    }

    try {
      console.log("Deleting level:", id);
      await apiFetch(`/levels?id=eq.${id}`, {
        method: "DELETE",
      });
      console.log("Level deleted successfully");
      setSuccess("Level deleted successfully");
      await logAudit('Delete Level', `Deleted level ID: ${id}`);
      // Refresh the list
      await fetchLevels();
    } catch (error) {
      console.error("Error deleting level:", error);
      setError("Failed to delete level: " + (error?.message || "unknown error"));
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
        <h1 className="page-title">Level Management</h1>
        <p className="text-gray-400 mt-2">
          Create and manage academic levels (e.g., JSS1, SS2)
        </p>
      </div>

      {/* Create Level Form */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-gray-800 mb-8">
        <h2 className="section-title mb-4">Create New Level</h2>

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

        <form onSubmit={handleCreateLevel} className="flex gap-4">
          <input
            type="text"
            value={newLevelName}
            onChange={(e) => setNewLevelName(e.target.value)}
            placeholder="Enter level name (e.g., JSS1, SS2)"
            className="flex-1 form-input"
          />
          {getAdminDepartment() === 'both' ? (
            <select
              value={newLevelDepartment}
              onChange={(e) => setNewLevelDepartment(e.target.value)}
              className="flex-1 form-select"
            >
              <option value="">Select Department</option>
              <option value="JSS">JSS</option>
              <option value="SSS">SSS</option>
            </select>
          ) : (
            <select
              value={getAdminDepartment()}
              disabled
              className="flex-1 form-select bg-gray-800 cursor-not-allowed opacity-60"
            >
              <option value={getAdminDepartment()}>{getAdminDepartment()}</option>
            </select>
          )}
          <button
            type="submit"
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Level
          </button>
        </form>
      </div>

      {/* Levels Table */}
      <div className="bg-[#111111] rounded-2xl border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="section-title">All Levels</h2>
        </div>

        {levels.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Layers className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p>No levels found. Create your first level above.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
              <thead className="bg-gray-900">
                <tr>
                  <th className="table-header">Level Name</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Created At</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {levels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {level.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {level.department || "Not Assigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(level.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteLevel(level.id)}
                        className="text-red-400 hover:text-red-300 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
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

export default ManageLevels;

