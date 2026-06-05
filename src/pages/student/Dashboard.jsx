
import { useState, useEffect } from "react";
import { UserCheck, Clock, BookOpen, GraduationCap, AlertCircle, XCircle, LogOut, Info } from "lucide-react";
import {
  ANON_KEY,
  SERVICE_KEY,
  BASE_URL,
  AUTH_URL,
  SUPABASE_URL,
  safeParseStudent,
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
    const s = safeParseStudent();
    if (!s) {
      window.location.href = "/login";
      return;
    }
    setStudent(s);
    loadData(s);
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
        setClassName(d[0]?.name || "Not Assigned");
      }
      if (levelRes) {
        const d = await levelRes.json();
        setLevelName(d[0]?.name || "Not Assigned");
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
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (student && student.is_active === false) {
    const reason = (student.archive_reason || '').toLowerCase()
    const isSuspended = reason.includes('suspend') || reason.includes('misconduct') || reason.includes('misbehav')
    const isExpelled = reason.includes('expel')
    const isTransferred = reason.includes('transfer') || reason.includes('withdrew') || reason.includes('left')
    const isGraduated = reason.includes('graduat') || reason.includes('complet')

    const daysLeft = student.suspension_end_date
      ? Math.max(0, Math.ceil((new Date(student.suspension_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0

    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const getConfig = () => {
      if (isSuspended) return {
        icon: <AlertCircle size={36} className="text-red-400" />,
        iconBg: 'bg-red-900/30',
        title: 'Account Suspended',
        bgColor: 'bg-red-950/50 border-red-800',
        message: student.suspension_end_date
          ? `${student.full_name} has been found engaging in an inappropriate conduct and is therefore suspended for a period ending on ${formatDate(student.suspension_end_date)}. The student is expected to resume academic activities on the said date.`
          : `${student.full_name} has been found engaging in an inappropriate conduct and is therefore suspended indefinitely. Please contact the school administration for further details.`,
        canViewRecords: false
      }
      if (isExpelled) return {
        icon: <XCircle size={36} className="text-red-400" />,
        iconBg: 'bg-red-900/30',
        title: 'Account Deactivated',
        bgColor: 'bg-red-950/50 border-red-800',
        message: `${student.full_name} has been permanently expelled from Methodist Boys' High School. This decision is final. Please contact the school administration for further information.`,
        canViewRecords: false
      }
      if (isTransferred) return {
        icon: <LogOut size={36} className="text-yellow-400" />,
        iconBg: 'bg-yellow-900/30',
        title: 'No Longer Enrolled',
        bgColor: 'bg-yellow-950/50 border-yellow-800',
        message: reason.includes('withdrew')
          ? `${student.full_name} has withdrawn from Methodist Boys' High School. The student's academic records are preserved for reference.`
          : `${student.full_name} is no longer enrolled at Methodist Boys' High School and has been transferred to another academic institution. The student's academic records are preserved for reference.`,
        canViewRecords: true
      }
      if (isGraduated) return {
        icon: <GraduationCap size={36} className="text-blue-400" />,
        iconBg: 'bg-blue-900/30',
        title: 'Alumni Portal',
        bgColor: 'bg-blue-950/50 border-blue-800',
        message: `Congratulations ${student.full_name}! You have successfully completed your studies at Methodist Boys' High School. Your academic records are preserved and available for your reference at any time.`,
        canViewRecords: true
      }
      return {
        icon: <Info size={36} className="text-gray-400" />,
        iconBg: 'bg-gray-900/30',
        title: 'Account Archived',
        bgColor: 'bg-gray-900 border-gray-800',
        message: `${student.full_name}'s account has been archived. Reason: ${student.archive_reason}. Please contact the school administration for further information.`,
        canViewRecords: true
      }
    }

    const config = getConfig()

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111111] rounded-2xl w-full max-w-lg p-6 md:p-8">

          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {config.icon}
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-3">{config.title}</h1>

          <div className={`border rounded-2xl p-4 mb-4 text-sm text-gray-400 text-center ${config.bgColor}`}>
            {config.message}
          </div>

          {isSuspended && student.suspension_end_date && daysLeft > 0 && (
            <div className="bg-red-950 border border-red-800 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Days Remaining</p>
              <p className="text-4xl font-bold text-red-400">{daysLeft}</p>
              <p className="text-xs text-gray-400 mt-1">
                Returns on {new Date(student.suspension_end_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Student Name</p>
                <p className="font-semibold text-white">{student.full_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Student Number</p>
                <p className="font-semibold text-white">{student.student_number}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Status</p>
                <p className="font-semibold text-white">{student.archive_reason || 'Archived'}</p>
              </div>
              {student.graduation_year && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Year</p>
                  <p className="font-semibold text-white">{student.graduation_year}</p>
                </div>
              )}
            </div>
          </div>

          {config.canViewRecords && (
            <div className="space-y-3 mb-4">
              <a href="/student/results"
                className="block bg-white text-black font-black py-3 rounded-full text-sm hover:bg-gray-200 text-center">
                View My Academic Results
              </a>
              <a href="/student/attendance"
                className="block bg-transparent border border-gray-700 text-gray-300 font-bold py-3 rounded-full text-sm hover:bg-gray-800 hover:text-white text-center">
                View My Attendance History
              </a>
            </div>
          )}

          <button
            onClick={() => { localStorage.removeItem('mbhs_student'); window.location.href = '/login' }}
            className="w-full bg-transparent border border-gray-700 text-gray-300 font-bold py-3 rounded-full text-sm hover:bg-gray-800 hover:text-white"
          >
            Sign Out
          </button>

          <footer className="mt-6 pt-4 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-400">© 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.</p>
            <p className="text-xs text-gray-400 mt-1">Developed by Alie Amadu Sesay</p>
          </footer>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden min-h-screen bg-[#0a0a0a]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">
            Student Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Student Profile: {student.full_name}
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-gray-900 px-4 py-2 rounded-2xl border border-gray-800 flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">
            {currentTerm}
          </span>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-900/30 rounded-2xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Student No.</p>
            <p className="text-lg font-bold text-white">
              {student.student_number}
            </p>
          </div>
        </div>

        <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-900/30 rounded-2xl flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Class</p>
            <p className="text-lg font-bold text-white">{className}</p>
          </div>
        </div>

        <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-green-900/30 rounded-2xl flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Level</p>
            <p className="text-lg font-bold text-white">{levelName}</p>
          </div>
        </div>

        <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <p className="text-blue-400 text-sm font-bold">Attendance Rate</p>
            <span className="bg-gray-900 border border-gray-700 px-2.5 py-1 rounded-xl text-gray-300 text-xs font-bold">
              {stats.rate}%
            </span>
          </div>
          <p className="text-3xl font-black text-white">{stats.rate}%</p>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4">
            <div
              className="bg-white h-1.5 rounded-full"
              style={{ width: `${stats.rate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Summary */}
        <div className="bg-[#111111] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="font-bold text-white">Attendance Overview</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-400">Present Days</span>
                </div>
                <span className="font-bold text-white">{stats.present}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-400">Absent Days</span>
                </div>
                <span className="font-bold text-white">{stats.absent}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-400">Late Days</span>
                </div>
                <span className="font-bold text-white">{stats.late}</span>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-400">
                    Total Records
                  </span>
                  <span className="text-sm text-gray-400">
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
        <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-2xl p-8 text-white flex flex-col justify-between">
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
              className="bg-white/10 hover:bg-white/20 transition-colors py-3 px-4 rounded-full text-sm font-medium border border-white/10 text-center"
            >
              View Timetable
            </button>
            <button
              onClick={() => (window.location.href = "/student/results")}
              className="bg-white/10 hover:bg-white/20 transition-colors py-3 px-4 rounded-full text-sm font-medium border border-white/10 text-center"
            >
              Check Results
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <footer className="mt-8 py-4 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            © 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Developed by Alie Amadu Sesay
          </p>
        </footer>
      </div>
    </div>
  );
}

