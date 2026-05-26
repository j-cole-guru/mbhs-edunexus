import { createContext, useContext, useState, useEffect } from 'react'
import { safeParseStaff } from '../lib/config'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const staff = safeParseStaff()
    if (staff) {
      setUser(staff)
    }
  }, [])

  const signOut = () => {
    localStorage.removeItem('mbhs_staff')
    localStorage.removeItem('mbhs_student')
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
