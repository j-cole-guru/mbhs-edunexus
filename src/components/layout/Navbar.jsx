import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { User, Menu } from 'lucide-react'
import { safeParseStaff, safeParseStudent } from "../../lib/config"

const Navbar = ({ onMenuClick }) => {
  const location = useLocation()
  const { profile } = useAuth()
  const studentData = localStorage.getItem('mbhs_student')
  const student = safeParseStudent()

  const getPageTitle = () => {
    const path = location.pathname
    
    if (path === '/admin' || path === '/teacher' || path === '/student') {
      return 'Dashboard'
    }
    
    const pathSegments = path.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getUserName = () => {
    if (profile?.full_name) return profile.full_name
    
    const staffData = localStorage.getItem('mbhs_staff')
    if (staffData) {
      try {
        const staff = safeParseStaff() || {}
        if (staff.full_name) return staff.full_name
      } catch (err) {}
    }
    
    if (student?.full_name) return student.full_name
    return 'User'
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 z-10">
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Menu Toggle (Mobile Only) */}
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-500 lg:hidden hover:text-gray-900 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Page Title */}
          <div className="flex-1 ml-4 lg:ml-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {getPageTitle()}
            </h1>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden xs:block text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[100px] sm:max-w-none">
                {getUserName()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar