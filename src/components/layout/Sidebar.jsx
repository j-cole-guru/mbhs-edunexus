import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Users, GraduationCap, BookOpen, Layers, CalendarDays, ClipboardList, UserCheck, Clock, LogOut, X, ArrowRight, Activity, Shield, FileText, UserCog, Database, MessageSquare } from 'lucide-react'
import logo from '../../assets/logo.png'

const Sidebar = ({ onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const studentData = localStorage.getItem('mbhs_student')
  const student = studentData ? JSON.parse(studentData) : null
  
  const staffData = localStorage.getItem('mbhs_staff')
  const staff = staffData ? JSON.parse(staffData) : null
  
  const currentProfile = profile || (staff ? { role: staff.role, full_name: staff.full_name } : null)

  const getNavLinks = () => {
    const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
    const department = staff.department || 'both'

    if (currentProfile?.role === 'admin') {
      const superAdminLinks = [
        { path: '/admin', label: 'System Monitor', icon: LayoutDashboard },
        { path: '/admin/system-health', label: 'System Health', icon: Activity },
        { path: '/admin/security', label: 'Security Logs', icon: Shield },
        { path: '/admin/audit', label: 'Audit Trail', icon: FileText },
        { path: '/admin/admins', label: 'Manage Admins', icon: UserCog },
        { path: '/admin/backup', label: 'Data Backup', icon: Database },
      ]

      const deptAdminLinks = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/levels', label: 'Manage Levels', icon: Layers },
        { path: '/admin/classes', label: 'Manage Classes', icon: BookOpen },
        { path: '/admin/terms', label: 'Manage Terms', icon: CalendarDays },
        { path: '/admin/teachers', label: 'Manage Teachers', icon: GraduationCap },
        { path: '/admin/students', label: 'Manage Students', icon: Users },
        { path: '/admin/results', label: 'Upload Results', icon: ClipboardList },
        { path: '/admin/attendance', label: 'Attendance Reports', icon: UserCheck },
        { path: '/admin/timetable', label: 'Upload Timetable', icon: Clock },
        { path: '/admin/promote', label: 'Promote Students', icon: ArrowRight },
        { path: '/admin/reports', label: 'Student Reports', icon: MessageSquare },
      ]

      return department === 'both' ? superAdminLinks : deptAdminLinks
    } else if (currentProfile?.role === 'teacher') {
      return [
        { path: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/teacher/attendance', label: 'Attendance', icon: UserCheck },
        { path: '/teacher/timetable', label: 'Timetable', icon: Clock },
      ]
    } else if (student) {
      return [
        { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/student/results', label: 'My Results', icon: ClipboardList },
        { path: '/student/attendance', label: 'Attendance', icon: UserCheck },
        { path: '/student/timetable', label: 'Timetable', icon: Clock },
        { path: '/student/report', label: 'Submit Report', icon: MessageSquare },
      ]
    }
    return []
  }

  const handleLogout = () => {
    localStorage.removeItem('mbhs_staff')
    localStorage.removeItem('mbhs_student')
    window.location.href = '/login'
  }

  const navLinks = getNavLinks()

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="MBHS Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-white text-sm">MBHS EduNexus</span>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                onClick={onClose} // Close sidebar on link click (mobile)
                className={({ isActive }) =>
                  `nav-link ${
                    isActive
                      ? 'nav-link-active'
                      : 'nav-link-inactive'
                  }`
                }
              >
                <link.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
      </div>
    </div>
  )
}

export default Sidebar
