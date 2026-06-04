import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, BookOpen, Award, ChevronRight, Menu, X, Shield, Clock, BarChart3, Bell, Smartphone, Lock, Star, ArrowRight, CheckCircle, Zap, Image } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('student')
  const [count, setCount] = useState({ students: 0, teachers: 0, years: 0, pass: 0 })
  const [galleryPhotos, setGalleryPhotos] = useState([])

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/gallery_photos?is_active=eq.true&select=*&order=position.asc&limit=5`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        )
        const text = await res.text()
        const data = text ? JSON.parse(text) : []
        setGalleryPhotos(Array.isArray(data) ? data : [])
      } catch { setGalleryPhotos([]) }
    }
    fetchGallery()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const targets = { students: 2000, teachers: 50, years: 100, pass: 98 }
    const duration = 2000
    const steps = 60
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      setCount({
        students: Math.floor(targets.students * progress),
        teachers: Math.floor(targets.teachers * progress),
        years: Math.floor(targets.years * progress),
        pass: Math.floor(targets.pass * progress)
      })
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [])

  const features = [
    { icon: <BarChart3 size={22} />, title: 'Academic Results', desc: 'Upload and view results by term. Period tests, mid-year and end-of-year exams — all organised privately per student.' },
    { icon: <Users size={22} />, title: 'Attendance Tracking', desc: 'Teachers take daily attendance by class. Principals view reports filtered by term, month, week, and day.' },
    { icon: <Clock size={22} />, title: 'Digital Timetable', desc: 'Principals upload class timetables. Teachers and students view their weekly schedule from any device.' },
    { icon: <Bell size={22} />, title: 'Student Reports', desc: 'Students submit complaints directly to their principal. Principals manage and resolve them in real time.' },
    { icon: <Shield size={22} />, title: 'Security Monitoring', desc: 'Every login is logged. Suspicious activity triggers alerts. The engineer monitors from a security dashboard.' },
    { icon: <Smartphone size={22} />, title: 'Install as App', desc: 'Fully responsive. Works on any phone, tablet or computer. Students can install it directly to their home screen.' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a] bg-opacity-95 border-b border-gray-800' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <img src="/favicon.png" alt="MBHS" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-wide leading-none">MBHS EduNexus</p>
              <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">Methodist Boys' High School</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'About', 'Features', 'Gallery', 'System'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-gray-400 text-sm hover:text-white transition-colors font-medium">
                {item}
              </a>
            ))}
            <button onClick={() => navigate('/login')}
              className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-black hover:bg-gray-200 transition-all">
              Sign In
            </button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-400 hover:text-white">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0f0f0f] border-t border-gray-800 px-6 py-6 space-y-5">
            {['Home', 'About', 'Features', 'Gallery', 'System'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                className="block text-gray-400 text-sm hover:text-white font-medium">
                {item}
              </a>
            ))}
            <button onClick={() => navigate('/login')}
              className="w-full bg-white text-black py-3 rounded-full text-sm font-black">
              Sign In to System
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Animated background */}
        <div className="absolute inset-0">
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }} />
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-[0.07] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-[0.07] blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900 rounded-full opacity-[0.05] blur-[150px]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-full px-5 py-2 mb-10">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-gray-400 text-xs font-medium tracking-[3px] uppercase">System Online — Freetown, Sierra Leone</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-8">
            Methodist<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400">
              Boys' High
            </span><br />
            School
          </h1>

          <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            The official EduNexus management system — connecting principals, teachers and students of MBHS in one secure platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/login')}
              className="group bg-white text-black px-10 py-4 rounded-full text-sm font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <GraduationCap size={18} />
              Access System
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#about"
              className="border border-gray-700 text-gray-300 px-10 py-4 rounded-full text-sm font-bold hover:border-gray-500 hover:text-white transition-all text-center">
              Learn More
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-gray-600" />
            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-gray-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: count.students.toLocaleString() + '+', label: 'Students Enrolled' },
            { value: count.teachers + '+', label: 'Qualified Teachers' },
            { value: count.years + '+', label: 'Years of Excellence' },
            { value: count.pass + '%', label: 'Pass Rate' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</p>
              <p className="text-gray-500 text-xs uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-[4px] mb-6">About MBHS</p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8">
                A Century of<br />Academic Legacy
              </h2>
              <div className="space-y-6 text-gray-400 leading-relaxed">
                <p>
                  Methodist Boys' High School is one of Sierra Leone's most prestigious secondary schools, located in the heart of Freetown. Founded by the Methodist Church, we have been shaping the leaders of Sierra Leone for over a century.
                </p>
                <p>
                  Our school operates two departments — the Junior Secondary School (JSS) and the Senior Secondary School (SSS) — each with dedicated principals, class teachers, and rigorous academic programmes.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-10">
                {[
                  { title: 'Mission', text: 'Developing intellectual, moral, and social potential.' },
                  { title: 'Vision', text: 'Sierra Leone\'s leading school producing transformational leaders.' },
                  { title: 'Values', text: 'Excellence. Integrity. Discipline. Respect. Service.' },
                  { title: 'EduNexus', text: 'Our smart digital system connecting the whole school.' },
                ].map((item, i) => (
                  <div key={i} className="border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-colors">
                    <p className="text-white font-black text-sm mb-2">{item.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              {/* Main card */}
              <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <img src="/favicon.png" alt="MBHS" className="w-9 h-9 object-contain" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm">MBHS EduNexus</p>
                      <p className="text-gray-500 text-xs">School Management System</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {['JSS Department Portal', 'SSS Department Portal', 'Student Alumni Access', 'Real-time Security Logs', 'Automated Suspension System', 'Digital ID Cards'].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle size={14} className="text-blue-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => navigate('/login')}
                    className="w-full bg-white text-black py-3 rounded-xl text-sm font-black hover:bg-gray-100 transition flex items-center justify-center gap-2">
                    <Zap size={16} />
                    Open System
                  </button>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -bottom-5 -left-5 bg-emerald-500 rounded-2xl px-4 py-3 shadow-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <p className="text-white font-black text-xs">All Systems Online</p>
                </div>
              </div>

              <div className="absolute -top-5 -right-5 bg-blue-600 rounded-2xl px-4 py-3 shadow-2xl">
                <p className="text-blue-200 text-xs font-medium">Students</p>
                <p className="text-white font-black text-xl">2,000+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 relative">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-[4px] mb-4">What EduNexus Does</p>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Everything in One Place</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">A complete school management system built specifically for Methodist Boys' High School.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i}
                className="group border border-gray-800 rounded-2xl p-7 hover:border-blue-800 hover:bg-blue-950 hover:bg-opacity-20 transition-all duration-300 cursor-default">
                <div className="w-11 h-11 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center mb-5 text-blue-400 group-hover:bg-blue-900 group-hover:border-blue-700 group-hover:text-blue-300 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-white font-black text-base mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-[4px] mb-4">School Gallery</p>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Our School in Pictures</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">A glimpse into life at Methodist Boys' High School.</p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {galleryPhotos.length === 0 ? (
              <div className="md:col-span-12 text-center py-20 border border-gray-800 rounded-3xl">
                <div className="w-16 h-16 border-2 border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Image size={28} className="text-gray-700" />
                </div>
                <p className="text-gray-600 font-bold">Photos Coming Soon</p>
                <p className="text-gray-700 text-sm mt-2">School photos will appear here once uploaded by the administrator.</p>
              </div>
            ) : (
              <>
                {/* Large featured - first photo */}
                {galleryPhotos[0] && (
                  <div className="md:col-span-8 relative group overflow-hidden rounded-3xl aspect-[16/9] bg-gray-900 border border-gray-800">
                    <img src={galleryPhotos[0].photo_url} alt={galleryPhotos[0].caption} loading="lazy" decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-bold text-sm">{galleryPhotos[0].caption}</p>
                      <p className="text-gray-400 text-xs">Methodist Boys' High School</p>
                    </div>
                  </div>
                )}

                {/* Second photo */}
                {galleryPhotos[1] && (
                  <div className="md:col-span-4 relative group overflow-hidden rounded-3xl bg-gray-900 border border-gray-800" style={{ minHeight: '280px' }}>
                    <img src={galleryPhotos[1].photo_url} alt={galleryPhotos[1].caption} loading="lazy" decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-bold text-sm">{galleryPhotos[1].caption}</p>
                    </div>
                  </div>
                )}

                {/* Photos 3, 4, 5 */}
                {galleryPhotos.slice(2, 5).map((photo, i) => (
                  <div key={photo.id} className="md:col-span-4 relative group overflow-hidden rounded-3xl aspect-square bg-gray-900 border border-gray-800">
                    <img src={photo.photo_url} alt={photo.caption} loading="lazy" decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-sm">{photo.caption}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* System Access */}
      <section id="system" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-10 md:p-16 overflow-hidden border border-blue-800">
            <div className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-blue-300 text-xs font-bold uppercase tracking-[4px] mb-6">Secure System</p>
                  <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                    Ready to Access<br />the System?
                  </h2>
                  <p className="text-blue-200 opacity-80 leading-relaxed mb-8">
                    Students login with their full name and PIN. Staff login with their email and password. Access your results, attendance, timetable and more from any device, anywhere.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/login')}
                      className="group bg-white text-blue-900 px-8 py-4 rounded-full font-black text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2">
                      <GraduationCap size={18} />
                      Student Login
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => navigate('/login')}
                      className="border-2 border-blue-400 border-opacity-50 text-white px-8 py-4 rounded-full font-black text-sm hover:border-opacity-100 transition flex items-center justify-center gap-2">
                      <Users size={18} />
                      Staff Login
                    </button>
                  </div>
                </div>

                {/* Login cards visual */}
                <div className="space-y-4">
                  {[
                    {
                      tab: 'student',
                      title: 'Student Login',
                      icon: <GraduationCap size={18} />,
                      fields: ['Full Name', '4-Digit PIN'],
                      color: 'bg-white text-blue-900'
                    },
                    {
                      tab: 'staff',
                      title: 'Staff Login',
                      icon: <Users size={18} />,
                      fields: ['Email Address', 'Password'],
                      color: 'bg-blue-800 bg-opacity-50 text-white'
                    }
                  ].map((card, i) => (
                    <div key={i}
                      onClick={() => setActiveTab(card.tab)}
                      className={`rounded-2xl p-5 cursor-pointer transition-all border ${activeTab === card.tab ? 'border-white border-opacity-30 bg-white bg-opacity-10' : 'border-transparent bg-white bg-opacity-5 hover:bg-opacity-8'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white">
                          {card.icon}
                        </div>
                        <p className="text-white font-bold text-sm">{card.title}</p>
                        {activeTab === card.tab && (
                          <div className="ml-auto">
                            <CheckCircle size={16} className="text-emerald-400" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {card.fields.map((field, j) => (
                          <div key={j} className="bg-white bg-opacity-10 rounded-lg px-3 py-2">
                            <p className="text-white text-opacity-50 text-xs">{field}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button onClick={() => navigate('/login')}
                    className="w-full bg-white text-blue-900 py-3 rounded-xl font-black text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2">
                    <Lock size={16} />
                    Sign In Securely
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <img src="/favicon.png" alt="MBHS" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">MBHS EduNexus</p>
                  <p className="text-gray-600 text-xs">School Management System</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                The official digital management system of Methodist Boys' High School. Built for our school, by our school.
              </p>
              <div className="flex items-center gap-2 mt-6 bg-gray-900 rounded-xl px-4 py-3 w-fit border border-gray-800">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-gray-400 text-xs font-medium">System Online 24/7</p>
              </div>
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase tracking-widest mb-5">Navigation</p>
              <div className="space-y-3">
                {[
                  { label: 'Home', href: '#home' },
                  { label: 'About', href: '#about' },
                  { label: 'Features', href: '#features' },
                  { label: 'Gallery', href: '#gallery' },
                  { label: 'System', href: '#system' },
                ].map(item => (
                  <a key={item.label} href={item.href}
                    className="block text-gray-600 text-sm hover:text-white transition-colors">{item.label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase tracking-widest mb-5">System Access</p>
              <div className="space-y-3">
                {['Student Login', 'Staff Login', 'JSS Department', 'SSS Department', 'Alumni Access'].map(item => (
                  <button key={item} onClick={() => navigate('/login')}
                    className="block text-gray-600 text-sm hover:text-white transition-colors text-left">{item}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-700 text-xs">© 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.</p>
            <p className="text-gray-700 text-xs">Developed by Alie Amadu Sesay</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
