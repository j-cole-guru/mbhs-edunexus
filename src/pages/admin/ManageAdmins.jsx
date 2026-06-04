import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCog, Trash2, Plus, CheckCircle, AlertCircle } from "lucide-react";
import {
  ANON_KEY,
  SERVICE_KEY,
  BASE_URL,
  AUTH_URL,
  SUPABASE_URL,
  getToken,
} from "../../lib/config";

const safeFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
  });
  const text = await res.text();
  console.log(`[${options.method || "GET"}] ${url}`);
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export default function ManageAdmins() {
  const queryClient = useQueryClient();
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [adminError, setAdminError] = useState("");

  const {
    data: admins = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const data = await safeFetch(
        `${BASE_URL}/profiles?role=eq.admin&select=*&order=created_at.desc`,
      );
      return Array.isArray(data) ? data : [];
    },
  });

  const occupiedDepartments = [
    ...new Set(
      admins
        .map((a) => a.department)
        .filter((d) => d === "JSS" || d === "SSS"),
    ),
  ];

  const handleCreateAdmin = async () => {
    if (!adminName || !adminEmail || !adminPassword || !adminDepartment) {
      setAdminError("All fields are required.");
      return;
    }
    setAdminError("");
    setAdminSuccess("");

    try {
      // Step 1 - Create auth account
      const authRes = await fetch(`${AUTH_URL}/admin/users`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: adminName, role: "admin" },
        }),
      });

      const authData = await authRes.json();
      if (!authRes.ok)
        throw new Error(authData.message || "Failed to create auth user");

      // Step 2 - Insert profile
      await safeFetch(`${BASE_URL}/profiles`, {
        method: "POST",
        body: JSON.stringify({
          id: authData.id,
          full_name: adminName,
          email: adminEmail,
          role: "admin",
          department: adminDepartment,
        }),
      });

      setAdminSuccess(`${adminDepartment} Admin created successfully.`);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminDepartment("");
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    } catch (err) {
      setAdminError("Failed: " + err.message);
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!window.confirm(`Delete admin ${adminEmail}?`)) return;
    try {
      await safeFetch(`${BASE_URL}/profiles?id=eq.${adminId}`, {
        method: "DELETE",
      });
      await fetch(`${AUTH_URL}/admin/users/${adminId}`, {
        method: "DELETE",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      });
      setAdminSuccess("Admin deleted.");
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    } catch {
      setAdminError("Failed to delete.");
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manage Administrators
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Create Department Admin
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Full Name
            </label>
            <input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Enter full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Department
            </label>
            <select
              value={adminDepartment}
              onChange={(e) => setAdminDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">Select Department</option>
              <option
                value="JSS"
                disabled={occupiedDepartments.includes("JSS")}
                className={
                  occupiedDepartments.includes("JSS") ? "text-gray-400" : ""
                }
              >
                JSS{" "}
                {occupiedDepartments.includes("JSS")
                  ? "(Slot Occupied)"
                  : "(Available)"}
              </option>
              <option
                value="SSS"
                disabled={occupiedDepartments.includes("SSS")}
                className={
                  occupiedDepartments.includes("SSS") ? "text-gray-400" : ""
                }
              >
                SSS{" "}
                {occupiedDepartments.includes("SSS")
                  ? "(Slot Occupied)"
                  : "(Available)"}
              </option>
            </select>
          </div>
        </div>
        <button
          onClick={handleCreateAdmin}
          className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Plus size={16} /> Create Admin
        </button>
        {adminSuccess && (
          <p className="text-green-600 text-sm mt-3">{adminSuccess}</p>
        )}
        {adminError && (
          <p className="text-red-600 text-sm mt-3">{adminError}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">
            All Administrators ({admins.length})
          </h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg shadow">
            <table className="w-full text-sm" style={{ minWidth: '700px' }}>
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
                  Full Name
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
                  Department
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
                  Created
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, i) => (
                <tr
                  key={admin.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {admin.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${admin.department === "JSS" ? "bg-blue-100 text-blue-700" : admin.department === "SSS" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {admin.department || "System"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {admin.department !== "both" && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="mt-8 py-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Methodist Boys' High School. All Rights Reserved. Freetown,
          Sierra Leone.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Developed by Alie Amadu Sesay
        </p>
      </footer>
    </div>
  );
}
