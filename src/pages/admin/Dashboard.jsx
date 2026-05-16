import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Users, GraduationCap, BookOpen, CalendarDays, Plus, ClipboardList, UserCheck, Clock } from 'lucide-react'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    currentTerm: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Get staff data from localStorage
      const staff = JSON.parse(localStorage.getItem('mbhs_staff'))
      const token = staff?.access_token

      if (!token) {
        throw new Error('No authentication token found')
      }

      // Fetch total students
      const studentsRes = await fetch(
        'https://tvitevnovhiimpdukebm.supabase.co/rest/v1/students?select=count',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y',
            'Authorization': `Bearer ${token}`,
            'Prefer': 'count=exact'
          }
        }
      )

      // Fetch total teachers
      const teachersRes = await fetch(
        'https://tvitevnovhiimpdukebm.supabase.co/rest/v1/teachers?select=count',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y',
            'Authorization': `Bearer ${token}`,
            'Prefer': 'count=exact'
          }
        }
      )

      // Fetch total classes
      const classesRes = await fetch(
        'https://tvitevnovhiimpdukebm.supabase.co/rest/v1/classes?select=count',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y',
            'Authorization': `Bearer ${token}`,
            'Prefer': 'count=exact'
          }
        }
      )

      // Fetch current term
      const termRes = await fetch(
        'https://tvitevnovhiimpdukebm.supabase.co/rest/v1/terms?is_current=eq.true&select=*',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const studentsCount = studentsRes.ok ? parseInt(studentsRes.headers.get('content-range')?.split('/')[1] || '0') : 0
      const teachersCount = teachersRes.ok ? parseInt(teachersRes.headers.get('content-range')?.split('/')[1] || '0') : 0
      const classesCount = classesRes.ok ? parseInt(classesRes.headers.get('content-range')?.split('/')[1] || '0') : 0
      const currentTermData = termRes.ok ? await termRes.json() : null

      setStats({
        totalStudents: studentsCount,
        totalTeachers: teachersCount,
        totalClasses: classesCount,
        currentTerm: currentTermData?.[0] || null
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Set default values on error
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        currentTerm: null
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-600 mt-2">School Management Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => window.location.href = '/admin/students'}
          className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="stat-icon bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/admin/teachers'}
          className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="stat-icon bg-green-100">
                <GraduationCap className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/admin/classes'}
          className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="stat-icon bg-purple-100">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/admin/terms'}
          className="stat-card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="stat-icon bg-orange-100">
                <CalendarDays className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Term</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.currentTerm ? stats.currentTerm.name : 'Not Set'}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/admin/students'}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <Plus className="h-6 w-6 mb-2 text-blue-600" />
            <span className="font-medium text-gray-900">Add New Student</span>
          </button>
          <button
            onClick={() => window.location.href = '/admin/results'}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
          >
            <ClipboardList className="h-6 w-6 mb-2 text-green-600" />
            <span className="font-medium text-gray-900">Enter Results</span>
          </button>
          <button
            onClick={() => window.location.href = '/admin/attendance'}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
          >
            <UserCheck className="h-6 w-6 mb-2 text-purple-600" />
            <span className="font-medium text-gray-900">Check Attendance</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
