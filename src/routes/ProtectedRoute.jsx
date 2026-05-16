import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, role }) {
  if (role === 'student') {
    const student = localStorage.getItem('mbhs_student')
    if (!student) return <Navigate to="/login" replace />
    return children
  }

  if (role === 'admin' || role === 'teacher') {
    const staff = localStorage.getItem('mbhs_staff')
    if (!staff) return <Navigate to="/login" replace />
    const parsed = JSON.parse(staff)
    if (parsed.role !== role) return <Navigate to="/login" replace />
    return children
  }

  return <Navigate to="/login" replace />
}
