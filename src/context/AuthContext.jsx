import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const staff = localStorage.getItem('mbhs_staff')
    if (staff) {
      setUser(JSON.parse(staff))
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
