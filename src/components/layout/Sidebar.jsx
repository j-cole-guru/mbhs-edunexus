import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarDays,
  ClipboardList,
  UserCheck,
  Clock,
  LogOut,
  X,
  ArrowRight,
  Activity,
  Shield,
  FileText,
  UserCog,
  Database,
  MessageSquare,
  Archive,
  CreditCard,
  User,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { safeParseStaff, safeParseStudent } from "../../lib/config"

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const studentData = localStorage.getItem("mbhs_student");
  const student = safeParseStudent();

  const staffData = localStorage.getItem("mbhs_staff");
  const staff = safeParseStaff();

  const currentProfile =
    profile ||
    (staff ? { role: staff.role, full_name: staff.full_name } : null);

  const getNavLinks = () => {
    const staff = safeParseStaff() || {};
    const department = staff.department || "both";

    if (currentProfile?.role === "admin") {
      const superAdminLinks = [
        { path: "/admin", label: "System Monitor", icon: LayoutDashboard },
        {
          path: "/admin/system-health",
          label: "System Health",
          icon: Activity,
        },
        { path: "/admin/security", label: "Security Logs", icon: Shield },
        { path: "/admin/audit", label: "Audit Trail", icon: FileText },
        { path: "/admin/admins", label: "Manage Admins", icon: UserCog },
        { path: "/admin/backup", label: "Data Backup", icon: Database },
      ];

      const deptAdminLinks = [
        { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/levels", label: "Manage Levels", icon: Layers },
        { path: "/admin/classes", label: "Manage Classes", icon: BookOpen },
        { path: "/admin/terms", label: "Manage Terms", icon: CalendarDays },
        {
          path: "/admin/teachers",
          label: "Manage Teachers",
          icon: GraduationCap,
        },
        { path: "/admin/students", label: "Manage Students", icon: Users },
        {
          path: "/admin/results",
          label: "Upload Results",
          icon: ClipboardList,
        },
        {
          path: "/admin/attendance",
          label: "Attendance Reports",
          icon: UserCheck,
        },
        { path: "/admin/timetable", label: "Upload Timetable", icon: Clock },
        { path: "/admin/promote", label: "Promote Students", icon: ArrowRight },
        { path: "/admin/archive", label: "Archive Students", icon: Archive },
        {
          path: "/admin/reports",
          label: "Student Reports",
          icon: MessageSquare,
        },
      ];

      return department === "both" ? superAdminLinks : deptAdminLinks;
    } else if (currentProfile?.role === "teacher") {
      return [
        { path: "/teacher", label: "Dashboard", icon: LayoutDashboard },
        { path: "/teacher/attendance", label: "Attendance", icon: UserCheck },
        { path: "/teacher/timetable", label: "Timetable", icon: Clock },
      ];
    } else if (student) {
      const isArchived = student.is_active === false;

      if (isArchived) {
        return [
          { path: "/student", label: "Alumni Dashboard", icon: GraduationCap },
          {
            path: "/student/results",
            label: "My Results",
            icon: ClipboardList,
          },
          {
            path: "/student/attendance",
            label: "My Attendance",
            icon: UserCheck,
          },
        ];
      } else {
        return [
          { path: "/student", label: "Dashboard", icon: LayoutDashboard },
          {
            path: "/student/results",
            label: "My Results",
            icon: ClipboardList,
          },
          {
            path: "/student/attendance",
            label: "My Attendance",
            icon: UserCheck,
          },
          { path: "/student/timetable", label: "Timetable", icon: Clock },
          { path: "/student/id-card", label: "My ID Card", icon: CreditCard },
          {
            path: "/student/report",
            label: "Submit Report",
            icon: MessageSquare,
          },
        ];
      }
    }
    return [];
  };

  const handleLogout = () => {
    localStorage.removeItem("mbhs_staff");
    localStorage.removeItem("mbhs_student");
    window.location.href = "/login";
  };

  const navLinks = getNavLinks();

  const userInitial = currentProfile?.full_name?.charAt(0)?.toUpperCase() || student?.full_name?.charAt(0)?.toUpperCase() || 'U';
  const userName = currentProfile?.full_name || student?.full_name || 'User';
  const userRole = currentProfile?.role || 'student';

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white border-r border-gray-900">
      {/* Logo Section */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MBHS Logo" className="h-9 w-auto" />
          <div>
            <h1 className="text-base font-black text-white tracking-tight">MBHS</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">EduNexus</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-900 transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {navLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-white text-black shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  }`
                }
              >
                <link.icon className="h-5 w-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Card + Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-900 mb-3">
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-black">{userInitial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-all border border-gray-800"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;