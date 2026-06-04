import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Image, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const BASE_URL = `${SUPABASE_URL}/rest/v1`

const getToken = () => {
  try {
    const raw = localStorage.getItem('mbhs_staff')
    if (!raw || raw === 'undefined') return ANON_KEY
    return JSON.parse(raw)?.access_token || ANON_KEY
  } catch { return ANON_KEY }
}

export default function ManageGallery() {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchPhotos() }, [])

  const fetchPhotos = async () => {
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    try {
      const res = await fetch(
        `${BASE_URL}/gallery_photos?select=id,photo_url,caption,is_active,position,created_at,uploaded_by&order=position.asc,created_at.desc&limit=50`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }, signal: controller.signal }
      )
      clearTimeout(timeout)
      const text = await res.text()
      const data = text ? JSON.parse(text) : []
      setPhotos(Array.isArray(data) ? data : [])
    } catch (e) {
      setPhotos([])
    }
    setLoading(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB.'); return }
    setSelectedFile(file)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        const max = 1920
        if (w > max || h > max) {
          if (w > h) { h = h * max / w; w = max }
          else { w = w * max / h; h = max }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select an image first.'); return }
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const base64 = await compressImage(selectedFile)
      const staff = JSON.parse(localStorage.getItem('mbhs_staff') || '{}')

      const res = await fetch(`${BASE_URL}/gallery_photos`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          photo_url: base64,
          caption: caption.trim() || 'MBHS School Photo',
          position: photos.length,
          is_active: true,
          uploaded_by: staff.email || 'admin'
        })
      })

      const text = await res.text()
      console.log('Upload response:', text)

      if (res.ok) {
        setSuccess('Photo uploaded successfully and is now showing on the home page.')
        setSelectedFile(null)
        setPreview(null)
        setCaption('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        await fetchPhotos()
      } else {
        setError('Upload failed: ' + text)
      }
      setUploading(false)
    } catch (err) {
      setError('Upload failed: ' + err.message)
      setUploading(false)
    }
  }

  const handleDelete = async (photoId) => {
    if (!window.confirm('Remove this photo from the home page?')) return
    try {
      await fetch(`${BASE_URL}/gallery_photos?id=eq.${photoId}`, {
        method: 'DELETE',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${getToken()}` }
      })
      setSuccess('Photo removed successfully.')
      await fetchPhotos()
    } catch (err) {
      setError('Failed to delete photo.')
    }
  }

  const toggleVisibility = async (photo) => {
    try {
      await fetch(`${BASE_URL}/gallery_photos?id=eq.${photo.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !photo.is_active })
      })
      await fetchPhotos()
    } catch (err) {
      setError('Failed to update photo.')
    }
  }

  const updatePosition = async (photoId, newPosition) => {
    try {
      await fetch(`${BASE_URL}/gallery_photos?id=eq.${photoId}`, {
        method: 'PATCH',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position: parseInt(newPosition) })
      })
      await fetchPhotos()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Gallery Management</h1>
      <p className="text-gray-500 text-sm mb-8">Upload and manage photos that appear on the MBHS EduNexus home page.</p>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4">Upload New Photo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File picker */}
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-900 hover:bg-blue-50 transition-all"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
              ) : (
                <div>
                  <Image size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">Click to select photo</p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP — Max 5MB</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Caption and upload */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Photo Caption</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="e.g. MBHS School Compound"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 mb-4"
              />
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700 space-y-1 mb-4">
                <p className="font-bold">Tips for best results:</p>
                <p>• Use landscape photos for the featured slot</p>
                <p>• Clear, well-lit photos look best</p>
                <p>• Maximum 5 active photos show on home page</p>
                <p>• You can hide/show photos without deleting them</p>
              </div>
            </div>
            <div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 mb-3">
                  <AlertCircle size={16} />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <CheckCircle size={16} />
                  <p className="text-sm">{success}</p>
                </div>
              )}
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {uploading ? 'Uploading...' : 'Upload to Home Page'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photos List */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Uploaded Photos ({photos.length})</h2>
          <p className="text-xs text-gray-400">First 5 active photos show on home page</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="p-12 text-center">
            <Image size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No photos uploaded yet</p>
            <p className="text-gray-400 text-sm mt-1">Upload your first photo to display it on the home page</p>
          </div>
        ) : (
          <div className="divide-y">
            {photos.map((photo, i) => (
              <div key={photo.id} className={`flex items-center gap-4 p-4 ${!photo.is_active ? 'opacity-50' : ''}`}>
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={photo.photo_url} alt={photo.caption} loading="lazy" decoding="async"
                    className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{photo.caption}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded {new Date(photo.created_at).toLocaleDateString()} by {photo.uploaded_by}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${photo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {photo.is_active ? 'Visible on Home' : 'Hidden'}
                    </span>
                    <span className="text-xs text-gray-400">Position:</span>
                    <input
                      type="number"
                      value={photo.position}
                      onChange={e => updatePosition(photo.id, e.target.value)}
                      className="w-14 border border-gray-200 rounded px-2 py-0.5 text-xs text-center"
                      min="0"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleVisibility(photo)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${photo.is_active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {photo.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    {photo.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-8 py-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">© 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.</p>
        <p className="text-xs text-gray-400 mt-1">Developed by Alie Amadu Sesay</p>
      </footer>
    </div>
  )
}
