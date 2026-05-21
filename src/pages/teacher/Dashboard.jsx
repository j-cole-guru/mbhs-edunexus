import React, { useState, useEffect } from 'react'
import { Users, BookOpen, Clock } from 'lucide-react'
import { ANON_KEY, SERVICE_KEY, BASE_URL, AUTH_URL, SUPABASE_URL } from '../../lib/config'

const getToken = () => {
  const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
  return staff.access_token || ANON_KEY
}

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null)
  const [students, setStudents] = useState([])
  const [levelName, setLevelName] = useState('')
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')
        if (!staff.id) {
          setLoading(false)
          return
        }

        const token = getToken()

        // Fetch teacher record
        const teacherRes = await fetch(`${BASE_URL}/teachers?profile_id=eq.${staff.id}&select=*`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const teacherData = await teacherRes.json()
        if (!Array.isArray(teacherData) || !teacherData[0]) {
          setLoading(false)
          return
        }
        const teacherInfo = teacherData[0]
        setTeacher(teacherInfo)

        // Fetch level and class names
        const [levelRes, classRes] = await Promise.all([
          fetch(`${BASE_URL}/levels?id=eq.${teacherInfo.level_id}&select=name`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${BASE_URL}/classes?id=eq.${teacherInfo.class_id}&select=name`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
          })
        ])
        const levelData = await levelRes.json()
        const classData = await classRes.json()
        setLevelName(Array.isArray(levelData) && levelData[0] ? levelData[0].name : 'N/A')
        setClassName(Array.isArray(classData) && classData[0] ? classData[0].name : 'N/A')

        // Fetch students in teacher's class
        const studentsRes = await fetch(`${BASE_URL}/students?class_id=eq.${teacherInfo.class_id}&select=*&order=full_name.asc`, {
          headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
        })
        const studentsData = await studentsRes.json()
        setStudents(Array.isArray(studentsData) ? studentsData : [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Teacher profile not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your class and student activities</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Class</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{className}</p>
              <p className="text-gray-500 text-sm mt-2">{levelName}</p>
            </div>
            <BookOpen className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
            </div>
            <Users className="h-12 w-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Employee Number</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{teacher.employee_number || 'N/A'}</p>
            </div>
            <Clock className="h-12 w-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">Class Students</h2>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No students in this class yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">\n<table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Student Number</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Gender</th>
                  <th className="table-header">Date of Birth</th>
                  <th className="table-header">Guardian</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.gender || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.date_of_birth || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.guardian_name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>\n</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherDashboard
