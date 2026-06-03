import { useState } from 'react'
import { Database, Download, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL, safeParseStaff } from '../../lib/config'

export default function DataBackup() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const getHeaders = () => {
    const staff = safeParseStaff() || {}
    const token = staff.access_token || ANON_KEY
    return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
  }

  const downloadBackup = async (table, label) => {
    setLoading(true)
    setSuccess('')
    try {
      const headers = getHeaders()
      const res = await fetch(`${BASE_URL}/${table}?select=*`, { headers })
      const data = await res.json()
      const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, label)
      XLSX.writeFile(wb, `MBHS_${label}_Backup_${new Date().toISOString().split('T')[0]}.xlsx`)
      setSuccess(`${label} backup downloaded successfully.`)
    } catch (err) {
      console.error('Backup error:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadFullBackup = async () => {
    setLoading(true)
    setSuccess('')
    try {
      const headers = getHeaders()
      const tables = ['students','teachers','profiles','classes','levels','terms','results','attendance','timetable']
      const wb = XLSX.utils.book_new()
      for (const table of tables) {
        const res = await fetch(`${BASE_URL}/${table}?select=*`, { headers })
        const data = await res.json()
        const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [])
        XLSX.utils.book_append_sheet(wb, ws, table)
      }
      XLSX.writeFile(wb, `MBHS_Full_Backup_${new Date().toISOString().split('T')[0]}.xlsx`)
      setSuccess('Full system backup downloaded successfully.')
    } catch (err) {
      console.error('Full backup error:', err)
    } finally {
      setLoading(false)
    }
  }

  const backupItems = [
    { table: 'students', label: 'Students' },
    { table: 'teachers', label: 'Teachers' },
    { table: 'results', label: 'Results' },
    { table: 'attendance', label: 'Attendance' },
    { table: 'classes', label: 'Classes' },
    { table: 'levels', label: 'Levels' },
    { table: 'terms', label: 'Terms' },
    { table: 'profiles', label: 'Profiles' },
  ]

  return (
    <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Data Backup</h1>

      <div className="bg-black text-white rounded-lg p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm uppercase tracking-wide">Full System Backup</p>
          <p className="text-lg font-semibold mt-1">Download all data in one Excel file</p>
          <p className="text-gray-400 text-sm mt-1">Includes students, teachers, results, attendance and more</p>
        </div>
        <button onClick={downloadFullBackup} disabled={loading}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-gray-100 disabled:opacity-50">
          <Download size={16} />
          Download Full Backup
        </button>
      </div>

      {success && <p className="text-green-600 text-sm mb-4 font-medium">{success}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {backupItems.map(item => (
          <div key={item.table} className="bg-white rounded-lg shadow p-4 flex flex-col items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Database size={18} />
              <span className="font-medium">{item.label}</span>
            </div>
            <button
              onClick={() => downloadBackup(item.table, item.label)}
              disabled={loading}
              className="flex items-center gap-1 text-blue-900 text-sm font-medium hover:underline disabled:opacity-50">
              <Download size={14} /> Download
            </button>
          </div>
        ))}
      </div>

      <footer className="mt-8 py-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Developed by Alie Amadu Sesay
        </p>
      </footer>
    </div>
  )
}
