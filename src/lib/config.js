export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`
export const AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`
export const getToken = () => {
  try {
    const raw = localStorage.getItem('mbhs_staff')
    if (!raw || raw === 'undefined' || raw === 'null') return import.meta.env.VITE_SUPABASE_ANON_KEY
    const staff = JSON.parse(raw)
    return staff?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY
  } catch { return import.meta.env.VITE_SUPABASE_ANON_KEY }
}

export const safeParseStudent = () => {
  try {
    const raw = localStorage.getItem('mbhs_student')
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch { return null }
}

export const safeParseStaff = () => {
  try {
    const raw = localStorage.getItem('mbhs_staff')
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch { return null }
}

