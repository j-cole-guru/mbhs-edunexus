import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  Star,
} from 'lucide-react'
import schoolCompound1 from '../assets/galleries/school_compound/school-compound-1.jfif'
import schoolCompound2 from '../assets/galleries/school_compound/school-compound-2.jfif'
import schoolCompound3 from '../assets/galleries/school_compound/school-compound-3.jfif'

export default function Home() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  // Gallery images — using school compound images and placeholder slides
  const gallery = [
    {
      url: schoolCompound1,
      caption: "Methodist Boys' High School Compound — Entrance View",
    },
    {
      url: schoolCompound2,
      caption: "Methodist Boys' High School Compound — Student Life",
    },
    {
      url: schoolCompound3,
      caption: "Methodist Boys' High School Compound — Campus Activity",
    },
    {
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
      caption: 'Our Students — The Future of Sierra Leone',
    },
    {
      url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&q=80',
      caption: 'Learning and Growing Together',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % gallery.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % gallery.length)
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + gallery.length) % gallery.length)

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="MBHS Logo" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">MBHS EduNexus</p>
              <p className="text-gray-400 text-xs hidden sm:block">Methodist Boys' High School</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-white text-sm hover:text-blue-400 transition">
              Home
            </a>
            <a href="#about" className="text-white text-sm hover:text-blue-400 transition">
              About
            </a>
            <a href="#gallery" className="text-white text-sm hover:text-blue-400 transition">
              Gallery
            </a>
            <a href="#contact" className="text-white text-sm hover:text-blue-400 transition">
              Contact
            </a>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
            >
              Student & Staff Portal
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800 px-4 py-4 space-y-4">
            <a
              href="#home"
              onClick={() => setMenuOpen(false)}
              className="block text-white text-sm hover:text-blue-400"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="block text-white text-sm hover:text-blue-400"
            >
              About
            </a>
            <a
              href="#gallery"
              onClick={() => setMenuOpen(false)}
              className="block text-white text-sm hover:text-blue-400"
            >
              Gallery
            </a>
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="block text-white text-sm hover:text-blue-400"
            >
              Contact
            </a>
            <button
              onClick={() => {
                setMenuOpen(false)
                navigate('/login')
              }}
              className="w-full bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
            >
              Student & Staff Portal
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${gallery[currentSlide].url})` }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-60" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <img src="/favicon.png" alt="MBHS Logo" className="w-20 h-20 object-contain mx-auto mb-6" />
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Methodist Boys'<br />High School
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-3 font-medium">Freetown, Sierra Leone</p>
          <p className="text-sm md:text-base text-gray-400 mb-8 max-w-2xl mx-auto">
            Empowering the next generation of Sierra Leone's leaders through quality education, discipline, and excellence since our founding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-black px-8 py-3 rounded-lg text-sm font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <GraduationCap size={18} />
              Access EduNexus Portal
            </button>
            <a
              href="#about"
              className="border border-white text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-white hover:text-black transition text-center"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
          {gallery.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? 'bg-white w-6' : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-black py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: <GraduationCap size={28} className="text-blue-400" />, number: '100+', label: 'Years of Excellence' },
            { icon: <Users size={28} className="text-blue-400" />, number: '2000+', label: 'Students Enrolled' },
            { icon: <BookOpen size={28} className="text-blue-400" />, number: '50+', label: 'Qualified Teachers' },
            { icon: <Award size={28} className="text-blue-400" />, number: '98%', label: 'Pass Rate' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-3xl font-black text-white">{stat.number}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-900 font-semibold text-sm uppercase tracking-widest mb-2">About Us</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">A Legacy of Academic Excellence</h2>
            <div className="w-16 h-1 bg-blue-900 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Who We Are</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Methodist Boys' High School is one of Sierra Leone's most prestigious secondary schools, located in the heart of Freetown. Founded by the Methodist Church, the school has been at the forefront of quality education for over a century.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                We are committed to producing well-rounded graduates who are academically excellent, morally upright, and equipped to contribute meaningfully to the development of Sierra Leone and the world at large.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our school operates two departments — the Junior Secondary School (JSS) and the Senior Secondary School (SSS) — each with dedicated staff, classes, and academic programmes tailored to the needs of our students.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: 'Our Mission',
                  text: 'To provide quality education that develops the intellectual, moral, and social potential of every student.',
                },
                {
                  title: 'Our Vision',
                  text: 'To be the leading secondary school in Sierra Leone, producing leaders who transform communities.',
                },
                {
                  title: 'Our Values',
                  text: 'Excellence, Integrity, Discipline, Respect, and Service to God and humanity.',
                },
                {
                  title: 'EduNexus',
                  text: 'Our digital management system connecting principals, teachers, and students in one secure platform.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About EduNexus */}
          <div className="bg-black rounded-2xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-blue-400 font-semibold text-sm uppercase tracking-widest mb-3">About EduNexus</p>
                <h3 className="text-2xl md:text-3xl font-black mb-4">The Digital Hub of MBHS Education</h3>
                <p className="text-gray-400 leading-relaxed mb-4">
                  MBHS EduNexus is the official school management portal built specifically for Methodist Boys' High School. The name combines <span className="text-white font-semibold">Edu</span> (Education) and <span className="text-white font-semibold">Nexus</span> (Central Connection Point) — making it the central hub of education at MBHS.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  The system connects principals, teachers, and students in one secure platform — managing results, attendance, timetables, and more, all accessible from any device anywhere in the world.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  'Secure student and staff login portal',
                  'Real-time academic results and GPA tracking',
                  'Daily attendance management by class teachers',
                  'Digital timetable for every class',
                  'Direct student-to-principal reporting system',
                  'Departmental management for JSS and SSS',
                  'Accessible on any phone, tablet, or computer',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <ChevronRight size={12} className="text-white" />
                    </div>
                    <p className="text-gray-300 text-sm">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-900 font-semibold text-sm uppercase tracking-widest mb-2">Gallery</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Life at MBHS</h2>
            <div className="w-16 h-1 bg-blue-900 mx-auto" />
          </div>

          {/* Main Slider */}
          <div className="relative rounded-2xl overflow-hidden mb-4 h-64 md:h-96 shadow-xl">
            <img
              src={gallery[currentSlide].url}
              alt={gallery[currentSlide].caption}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 text-white font-semibold text-sm md:text-base">
              {gallery[currentSlide].caption}
            </p>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div className="grid grid-cols-5 gap-2">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`relative rounded-lg overflow-hidden h-16 md:h-20 transition-all ${
                  i === currentSlide ? 'ring-2 ring-blue-900 ring-offset-2' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Access Section */}
      <section className="py-20 px-4 bg-blue-900">
        <div className="max-w-4xl mx-auto text-center">
          <GraduationCap size={48} className="text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Access the EduNexus Portal</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            Students log in with their full name and PIN. Staff log in with their email and password. Access your results, attendance, timetable and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-900 px-10 py-4 rounded-xl text-base font-black hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              <GraduationCap size={20} />
              Student Login
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white px-10 py-4 rounded-xl text-base font-black hover:bg-white hover:text-blue-900 transition flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Staff Login
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-900 font-semibold text-sm uppercase tracking-widest mb-2">Contact Us</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Get In Touch</h2>
            <div className="w-16 h-1 bg-blue-900 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin size={24} className="text-blue-900" />, 
                title: 'Location',
                lines: ["Methodist Boys' High School", 'Freetown, Sierra Leone'],
              },
              {
                icon: <Phone size={24} className="text-blue-900" />, 
                title: 'Phone',
                lines: ['+232 XX XXX XXXX', 'Mon - Fri, 8AM - 4PM'],
              },
              {
                icon: <Mail size={24} className="text-blue-900" />, 
                title: 'EduNexus Portal',
                lines: ['mbhs-edunexus.vercel.app', 'Accessible 24/7'],
              },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-slate-50 rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                {item.lines.map((line, j) => (
                  <p key={j} className="text-gray-600 text-sm">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/favicon.png" alt="MBHS" className="w-10 h-10 object-contain" />
                <div>
                  <p className="font-bold text-white">MBHS EduNexus</p>
                  <p className="text-gray-400 text-xs">School Management System</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                The official digital management portal of Methodist Boys' High School, Freetown, Sierra Leone.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#home" className="block text-gray-400 text-sm hover:text-white transition">
                  Home
                </a>
                <a href="#about" className="block text-gray-400 text-sm hover:text-white transition">
                  About
                </a>
                <a href="#gallery" className="block text-gray-400 text-sm hover:text-white transition">
                  Gallery
                </a>
                <a href="#contact" className="block text-gray-400 text-sm hover:text-white transition">
                  Contact
                </a>
                <button
                  onClick={() => navigate('/login')}
                  className="block text-gray-400 text-sm hover:text-white transition text-left"
                >
                  EduNexus Portal
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">EduNexus Portal</h4>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Student Login — Full Name + PIN</p>
                <p className="text-gray-400 text-sm">Staff Login — Email + Password</p>
                <p className="text-gray-400 text-sm">Available 24/7 on any device</p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-3 bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                >
                  Access Portal
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400 text-xs">© 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.</p>
            <p className="text-gray-500 text-xs mt-1">Developed by Alie Amadu Sesay</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
