import { Menu } from 'lucide-react'

export default function Navbar({ onMenuClick }) {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  const student = JSON.parse(localStorage.getItem('mbhs_student') || '{}')
  const userName = staff.full_name || student.full_name || 'User'

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu size={22} />
        </button>
        <span className="font-semibold text-gray-800 text-sm md:text-base">
          MBHS EduNexus
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-gray-700 hidden md:block">{userName}</span>
      </div>
    </div>
  )
}
