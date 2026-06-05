import { useState, useEffect, useRef } from 'react'
import { Download, Camera, CheckCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import { ANON_KEY, BASE_URL, safeParseStudent } from '../../lib/config'

export default function IDCard() {
  const [student, setStudent] = useState(null)
  const [className, setClassName] = useState('')
  const [levelName, setLevelName] = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [uploadError, setUploadError] = useState('')
  const cardRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const s = safeParseStudent()
    console.log('IDCard loaded with student data:', s)
    if (!s) { window.location.href = '/login'; return }
    setStudent(s)
    if (s.photo_url) setPhotoUrl(s.photo_url)
    if (s.class_id || s.level_id) loadDetails(s)
  }, [])

  const loadDetails = async (s) => {
    try {
      const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
      
      const [classRes, levelRes] = await Promise.all([
        fetch(`${BASE_URL}/classes?id=eq.${s.class_id}&select=name`, { headers }),
        fetch(`${BASE_URL}/levels?id=eq.${s.level_id}&select=name`, { headers })
      ])
      const classData = await classRes.json()
      const levelData = await levelRes.json()
      
      setClassName(classData[0]?.name || 'Not Assigned')
      setLevelName(levelData[0]?.name || 'Not Assigned')
    } catch (err) {
      console.error('Error loading details:', err)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be less than 2MB.')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        const dataUrl = evt.target.result
        setPhotoUrl(dataUrl)

        await fetch(`${BASE_URL}/students?id=eq.${student.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ photo_url: dataUrl })
        })

        const updated = { ...student, photo_url: dataUrl }
        localStorage.setItem('mbhs_student', JSON.stringify(updated))
        setStudent(updated)
        setUploadSuccess('Photo uploaded successfully.')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setUploadError('Failed to upload photo.')
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#111111',
        logging: false
      })
      const link = document.createElement('a')
      link.download = `MBHS-ID-${student.student_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided'
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    } catch {
      return 'Not provided'
    }
  }

  const getStudentField = (fieldName, fallback = 'Not provided') => {
    if (!student) return fallback
    const value = student[fieldName]
    return value || fallback
  }

  if (!student) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#0a0a0a]">
      <h1 className="text-2xl font-black text-white mb-2">Student ID Card</h1>
      <p className="text-gray-400 text-sm mb-8">Your official MBHS EduNexus student identification card.</p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ID Card */}
        <div className="w-full lg:w-auto">
          <div
            ref={cardRef}
            className="w-full max-w-sm mx-auto lg:mx-0"
            style={{
              width: '340px',
              background: '#111111',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              fontFamily: 'Inter, sans-serif',
              border: '1px solid #374151'
            }}
          >
            {/* Card Header */}
            <div style={{
              background: 'linear-gradient(135deg, #000000 0%, #1E3A8A 100%)',
              padding: '20px 20px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <img
                src="/favicon.png"
                alt="MBHS Logo"
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                crossOrigin="anonymous"
              />
              <div>
                <p style={{ color: 'white', fontWeight: '900', fontSize: '13px', margin: 0, lineHeight: '1.3' }}>
                  Methodist Boys' High School
                </p>
                <p style={{ color: '#93c5fd', fontSize: '10px', margin: 0, marginTop: '2px' }}>
                  Freetown, Sierra Leone
                </p>
                <p style={{ color: '#60a5fa', fontSize: '9px', margin: 0, marginTop: '1px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Student Identity Card
                </p>
              </div>
            </div>

            {/* Blue accent line */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #1E3A8A, #3b82f6, #1E3A8A)' }} />

            {/* Card Body */}
            <div style={{ padding: '20px', background: '#111111' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                {/* Photo */}
                <div style={{
                  width: '90px',
                  height: '110px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #1E3A8A',
                  flexShrink: 0,
                  background: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Student"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#4b5563', borderRadius: '50%', margin: '0 auto 4px' }} />
                      <p style={{ fontSize: '8px', color: '#6b7280', margin: 0 }}>No Photo</p>
                    </div>
                  )}
                </div>

                {/* Student Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '900', fontSize: '14px', color: '#ffffff', margin: '0 0 4px', lineHeight: '1.3', wordBreak: 'break-word' }}>
                    {student.full_name}
                  </p>
                  <div style={{
                    display: 'inline-block',
                    background: '#1E3A8A',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Student
                  </div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    {[
                      { label: 'ID', value: student.student_number },
                      { label: 'Class', value: className },
                      { label: 'Level', value: levelName },
                      { label: 'Gender', value: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'Not provided' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <p style={{ fontSize: '9px', color: '#9ca3af', margin: 0, minWidth: '36px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: '10px', color: '#d1d5db', margin: 0, fontWeight: '600' }}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#374151', margin: '14px 0' }} />

              {/* Additional Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Date of Birth', value: formatDate(student.date_of_birth) },
                  { label: 'Enrolled', value: formatDate(student.enrolled_at || student.created_at) },
                  { label: 'Guardian', value: student.guardian_name || 'Not provided' },
                  { label: 'Guardian Tel', value: student.guardian_phone || 'Not provided' },
                ].map((item, i) => (
                  <div key={i}>
                    <p style={{ fontSize: '8px', color: '#9ca3af', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '9px', color: '#d1d5db', margin: 0, fontWeight: '600', wordBreak: 'break-word' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div style={{
              background: '#0f172a',
              padding: '10px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <p style={{ color: '#64748b', fontSize: '8px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
                MBHS EduNexus
              </p>
              <p style={{ color: '#64748b', fontSize: '8px', margin: 0 }}>
                Academic Year 2026
              </p>
            </div>

            {/* Holographic bottom strip */}
            <div style={{
              height: '6px',
              background: 'linear-gradient(90deg, #1E3A8A, #3b82f6, #06b6d4, #3b82f6, #1E3A8A)',
              backgroundSize: '200% 100%'
            }} />
          </div>
        </div>

        {/* Controls */}
        <div className="w-full lg:flex-1 space-y-4">
          {/* Upload Photo */}
          <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6">
            <h2 className="font-bold text-white mb-1">Upload Photo</h2>
            <p className="text-gray-400 text-sm mb-4">Upload a clear passport-sized photo for your ID card. Max 2MB.</p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-white text-black font-black px-6 py-3 rounded-full hover:bg-gray-200 disabled:opacity-50 w-full justify-center"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={18} />
              )}
              {uploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
            </button>

            {uploadSuccess && (
              <div className="flex items-center gap-2 mt-3 text-emerald-400">
                <CheckCircle size={16} />
                <p className="text-sm">{uploadSuccess}</p>
              </div>
            )}
            {uploadError && <p className="text-red-400 text-sm mt-3">{uploadError}</p>}
          </div>

          {/* Download Card */}
          <div className="bg-[#111111] rounded-2xl border border-gray-800 p-6">
            <h2 className="font-bold text-white mb-1">Download ID Card</h2>
            <p className="text-gray-400 text-sm mb-4">Download your ID card as a high quality PNG image you can print or save.</p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50 w-full justify-center"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {downloading ? 'Generating...' : 'Download ID Card'}
            </button>
          </div>

          {/* Card Info */}
          <div className="bg-blue-950/30 border border-blue-800 rounded-2xl p-5">
            <h3 className="font-bold text-blue-400 text-sm mb-3">ID Card Information</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Full Name', value: student.full_name },
                { label: 'Student Number', value: student.student_number },
                { label: 'Class', value: className },
                { label: 'Level', value: levelName },
                { label: 'Gender', value: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'Not provided' },
                { label: 'Date of Birth', value: formatDate(student.date_of_birth) },
                { label: 'Enrolled', value: formatDate(student.enrolled_at || student.created_at) },
                { label: 'Guardian', value: student.guardian_name || 'Not provided' },
                { label: 'Guardian Phone', value: student.guardian_phone || 'Not provided' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-blue-800 last:border-0">
                  <span className="text-blue-400 font-medium text-xs uppercase tracking-wide">{item.label}</span>
                  <span className="text-white font-semibold text-xs text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 py-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-400">© 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.</p>
        <p className="text-xs text-gray-400 mt-1">Developed by Alie Amadu Sesay</p>
      </footer>
    </div>
  )
}
