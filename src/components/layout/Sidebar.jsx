import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Users, GraduationCap, BookOpen, Layers, CalendarDays, ClipboardList, UserCheck, Clock, LogOut, X, ArrowRight } from 'lucide-react'
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
        { path: '/admin', label: 'System Dashboard', icon: LayoutDashboard },
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
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={logo}
            alt="MBHS Logo"
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-lg font-bold">MBHS</h1>
            <p className="text-xs text-gray-400">EduNexus</p>
          </div>
        </div>
        
        {/* Close Button (Mobile Only) */}
        <button 
          onClick={onClose}
          className="lg:hidden p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
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
