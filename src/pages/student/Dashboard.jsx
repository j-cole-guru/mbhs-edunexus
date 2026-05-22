import { useState, useEffect } from "react";
import { UserCheck, Clock, BookOpen, GraduationCap } from "lucide-react";
import {
  ANON_KEY,
  SERVICE_KEY,
  BASE_URL,
  AUTH_URL,
  SUPABASE_URL,
} from "../../lib/config";

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [className, setClassName] = useState("Loading...");
  const [levelName, setLevelName] = useState("Loading...");
  const [currentTerm, setCurrentTerm] = useState("Loading...");
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mbhs_student");
      if (!raw) {
        window.location.href = "/login";
        return;
      }
      const s = JSON.parse(raw);
      setStudent(s);
      loadData(s);
    } catch (err) {
      console.error("Error loading student:", err);
      window.location.href = "/login";
    }
  }, []);

  const loadData = async (s) => {
    try {
      // Fetch Class, Level, and Term details
      const [classRes, levelRes, termRes, attendanceRes] = await Promise.all([
        s.class_id
          ? fetch(`${BASE_URL}/classes?id=eq.${s.class_id}&select=name`, {
              headers,
            })
          : Promise.resolve(null),
        s.level_id
          ? fetch(`${BASE_URL}/levels?id=eq.${s.level_id}&select=name`, {
              headers,
            })
          : Promise.resolve(null),
        fetch(`${BASE_URL}/terms?is_current=eq.true&select=name,year`, {
          headers,
        }),
        fetch(`${BASE_URL}/attendance?student_id=eq.${s.id}&select=status`, {
          headers,
        }),
      ]);

      if (classRes) {
        const d = await classRes.json();
        setClassName(d[0]?.name || "N/A");
      }
      if (levelRes) {
        const d = await levelRes.json();
        setLevelName(d[0]?.name || "N/A");
      }
      const terms = await termRes.json();
      setCurrentTerm(
        terms[0] ? `${terms[0].name} ${terms[0].year}` : "No active term",
      );

      const attendance = await attendanceRes.json();
      if (Array.isArray(attendance)) {
        const p = attendance.filter((a) => a.status === "present").length;
        const a = attendance.filter((a) => a.status === "absent").length;
        const l = attendance.filter((a) => a.status === "late").length;
        const total = attendance.length;
        const rate = total > 0 ? ((p / total) * 100).toFixed(1) : 0;
        setStats({ present: p, absent: a, late: l, rate });
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!student)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (student && !student.is_active) {
    const isSuspended = student.archive_reason
      ?.toLowerCase()
      .includes("suspend");

    // Clear local storage if suspended so they have to login again and see the updated reason
    // OR simply update the object in state if you're fetching fresh data.
    // For now, let's just make the message strictly conditional.
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-8 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuspended ? "bg-red-100" : "bg-blue-100"}`}
          >
            <GraduationCap
              size={32}
              className={isSuspended ? "text-red-900" : "text-blue-900"}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSuspended ? "Account Restricted" : "Alumni Portal"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isSuspended
              ? `Dear ${student.full_name}, your account is currently ${student.archive_reason || "suspended"}. Please contact the school administration for further clarification.`
              : `Welcome back, ${student.full_name}. You have successfully completed your studies at Methodist Boys' High School. Your academic records are preserved and available for your reference.`}
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">
                  Student Number
                </p>
                <p className="font-semibold text-gray-900">
                  {student.student_number}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">
                  Graduation Year
                </p>
                <p className="font-semibold text-gray-900">
                  {student.graduation_year || "N/A"}
                </p>
              </div>
            </div>
            {student.archive_reason && (
              <div className="mt-3">
                <p className="text-gray-500 text-xs uppercase tracking-wide">
                  Archive Reason
                </p>
                <p className="font-semibold text-gray-900">
                  {student.archive_reason}
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <a
              href="/student/results"
              className="block bg-blue-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              View My Academic Results
            </a>
            <a
              href="/student/attendance"
              className="block bg-white border border-gray-200 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              View My Attendance History
            </a>
            <button
              onClick={() => {
                localStorage.removeItem("mbhs_student");
                window.location.href = "/login";
              }}
              className="block w-full bg-gray-100 text-gray-600 py-3 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
          <footer className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              © 2026 Methodist Boys' High School. All Rights Reserved. Freetown,
              Sierra Leone.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Developed by Alie Amadu Sesay
            </p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Student Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Student Profile: {student.full_name}
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {currentTerm}
          </span>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Student No.</p>
            <p className="text-lg font-bold text-gray-900">
              {student.student_number}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Class</p>
            <p className="text-lg font-bold text-gray-900">{className}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Level</p>
            <p className="text-lg font-bold text-gray-900">{levelName}</p>
          </div>
        </div>

        <div className="bg-blue-900 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <p className="text-blue-100 text-sm">Attendance Rate</p>
            <span className="bg-blue-800 px-2 py-1 rounded text-xs">
              {stats.rate}%
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.rate}%</p>
          <div className="w-full bg-blue-800 rounded-full h-1.5 mt-4">
            <div
              className="bg-white h-1.5 rounded-full"
              style={{ width: `${stats.rate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="font-semibold text-gray-800">Attendance Overview</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Present Days</span>
                </div>
                <span className="font-bold text-gray-900">{stats.present}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Absent Days</span>
                </div>
                <span className="font-bold text-gray-900">{stats.absent}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-600">Late Days</span>
                </div>
                <span className="font-bold text-gray-900">{stats.late}</span>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Total Records
                  </span>
                  <span className="text-sm text-gray-500">
                    {stats.present + stats.absent + stats.late}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Attendance is updated daily by your class teacher.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links / Message */}
        <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl shadow-lg p-8 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4">Academic Success</h3>
            <p className="text-blue-100 leading-relaxed mb-6">
              Maintaining high attendance is key to your academic progress at
              MBHS. Keep up the good work and ensure you attend all your classes
              on time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => (window.location.href = "/student/timetable")}
              className="bg-white/10 hover:bg-white/20 transition-colors py-3 px-4 rounded-lg text-sm font-medium border border-white/10 text-center"
            >
              View Timetable
            </button>
            <button
              onClick={() => (window.location.href = "/student/results")}
              className="bg-white/10 hover:bg-white/20 transition-colors py-3 px-4 rounded-lg text-sm font-medium border border-white/10 text-center"
            >
              Check Results
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Methodist Boys' High School. All Rights Reserved. Freetown,
          Sierra Leone.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Developed by Alie Amadu Sesay
        </p>
      </div>
    </div>
  );
}
