import { Navigate } from 'react-router-dom'
import { safeParseStudent, safeParseStaff } from '../lib/config'

export default function ProtectedRoute({ children, role }) {
  if (role === 'student') {
    const student = safeParseStudent()
    if (!student) return <Navigate to="/login" replace />
    return children
  }

  if (role === 'admin' || role === 'teacher') {
    const staff = safeParseStaff()
    if (!staff) return <Navigate to="/login" replace />
    if (staff.role !== role) return <Navigate to="/login" replace />
    return children
  }

  return <Navigate to="/login" replace />
}
