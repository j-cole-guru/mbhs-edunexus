import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CalendarDays,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ANON_KEY, BASE_URL, getToken } from "../../lib/config";

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
  console.log("Status:", res.status);
  console.log("Response:", text);
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const ManageTerms = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    is_current: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setLoading(true);
    const data = await safeFetch(
      `${BASE_URL}/terms?select=*&order=created_at.desc`,
    );
    setTerms(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      setError("All fields are required");
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError("End date must be after start date");
      return;
    }

    try {
      if (formData.is_current) {
        await safeFetch(`${BASE_URL}/terms?is_current=eq.true`, {
          method: "PATCH",
          body: JSON.stringify({ is_current: false }),
        });
      }

      const result = await safeFetch(`${BASE_URL}/terms`, {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          year: parseInt(formData.year),
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_current: formData.is_current,
        }),
      });

      console.log("Term creation result:", result); // Add this for debugging
      if (result) {
        setSuccess("Term created successfully.");
        setFormData({
          name: "",
          year: new Date().getFullYear(),
          start_date: "",
          end_date: "",
          is_current: false,
        });
        await fetchTerms();
      } else {
        setError("Failed to create term. Please try again.");
      }
    } catch (err) {
      console.error("Create term error:", err);
      setError("Something went wrong: " + err.message);
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      // First, unset all current terms
      await safeFetch(`${BASE_URL}/terms?is_current=eq.true`, {
        method: "PATCH",
        body: JSON.stringify({ is_current: false }),
      });

      // Then set the new current term
      await safeFetch(`${BASE_URL}/terms?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_current: true }),
      });

      // Update local state
      setTerms(
        terms.map((term) => ({
          ...term,
          is_current: term.id === id,
        })),
      );

      setSuccess("Current term updated successfully");
    } catch (error) {
      console.error("Error setting current term:", error);
      setError("Failed to update current term");
    }
  };

  const handleDeleteTerm = async (id) => {
    if (!confirm("Are you sure you want to delete this term?")) {
      return;
    }

    try {
      console.log("Deleting term:", id);
      await safeFetch(`${BASE_URL}/terms?id=eq.${id}`, {
        method: "DELETE",
      });
      console.log("Term deleted successfully");
      setSuccess("Term deleted successfully");
      // Refresh the list
      await fetchTerms();
    } catch (error) {
      console.error("Error deleting term:", error);
      setError("Failed to delete term");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Term Management</h1>
        <p className="text-gray-600 mt-2">Create and manage academic terms</p>
      </div>

      {/* Create Term Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="section-title mb-4">Create New Term</h2>

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

        <form onSubmit={handleCreateTerm}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., First Term"
                className="w-full form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                min="2020"
                max="2030"
                className="w-full form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="w-full form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="w-full form-input"
              />
            </div>
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="is_current"
              checked={formData.is_current}
              onChange={(e) =>
                setFormData({ ...formData, is_current: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_current"
              className="ml-2 block text-sm text-gray-700"
            >
              Set as current term
            </label>
          </div>
          <button
            type="submit"
            className="px-6 py-2 btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Term
          </button>
        </form>
      </div>

      {/* Terms Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">All Terms</h2>
        </div>

        {terms.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No terms found. Create your first term above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Term Name</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Start Date</th>
                  <th className="table-header">End Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {terms.map((term) => (
                  <tr key={term.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {term.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{term.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(term.start_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(term.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTermStatus(term).color}`}
                      >
                        {getTermStatus(term).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!term.is_current && (
                        <button
                          onClick={() => handleSetCurrent(term.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Set Current
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTerm(term.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
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
    </div>
  );
};

export default ManageTerms;
