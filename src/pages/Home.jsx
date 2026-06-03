import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import schoolCompound1 from '../assets/galleries/school_compound/school-compound-1.jfif'
import schoolCompound2 from '../assets/galleries/school_compound/school-compound-2.jfif'
import schoolCompound3 from '../assets/galleries/school_compound/school-compound-3.jfif'
import eventCeremony1 from '../assets/galleries/events_ceremonies/event-ceremony-1.jfif'
import eventCeremony2 from '../assets/galleries/events_ceremonies/event-ceremony-2.jfif'
import eventCeremony3 from '../assets/galleries/events_ceremonies/event-ceremony-3.jfif'
import studentLearning1 from '../assets/galleries/students_learning/student-learning-1.jfif'
import studentLearning2 from '../assets/galleries/students_learning/student-learning-2.jfif'
import studentLearning3 from '../assets/galleries/students_learning/student-learning-3.jfif'
import sportsRecreation1 from '../assets/galleries/sports_recreation/sports-recreation-1.jfif'
import sportsRecreation2 from '../assets/galleries/sports_recreation/sports-recreation-2.jfif'

const galleryData = [
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
    url: eventCeremony1,
    caption: 'Events & Ceremonies — School Gathering',
  },
  {
    url: eventCeremony2,
    caption: 'Events & Ceremonies — Special Moments',
  },
  {
    url: eventCeremony3,
    caption: 'Events & Ceremonies — Celebration',
  },
  {
    url: studentLearning1,
    caption: 'Students Learning — Classroom Energy',
  },
  {
    url: studentLearning2,
    caption: 'Students Learning — Academic Focus',
  },
  {
    url: sportsRecreation1,
    caption: 'Sports & Recreation — Team Spirit',
  },
  {
    url: sportsRecreation2,
    caption: 'Sports & Recreation — Athletic Drive',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % galleryData.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handlePrev = () => setActiveSlide((current) => (current - 1 + galleryData.length) % galleryData.length)
  const handleNext = () => setActiveSlide((current) => (current + 1) % galleryData.length)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="MBHS" className={`h-11 w-11 rounded-xl ${scrolled ? 'bg-blue-900 p-2' : 'bg-white/20 p-2'} transition-colors`} />
            <div>
              <p className={`text-sm font-semibold uppercase tracking-wide ${scrolled ? 'text-blue-900' : 'text-white'}`}>MBHS EduNexus</p>
              <p className={`text-xs ${scrolled ? 'text-gray-500' : 'text-gray-300'}`}>Methodist Boys' High School</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#home" className={`text-sm transition ${scrolled ? 'text-gray-600 hover:text-blue-900' : 'text-gray-200 hover:text-white'}`}>
              Home
            </a>
            <a href="#about" className={`text-sm transition ${scrolled ? 'text-gray-600 hover:text-blue-900' : 'text-gray-200 hover:text-white'}`}>
              About
            </a>
            <a href="#gallery" className={`text-sm transition ${scrolled ? 'text-gray-600 hover:text-blue-900' : 'text-gray-200 hover:text-white'}`}>
              Gallery
            </a>
            <a href="#contact" className={`text-sm transition ${scrolled ? 'text-gray-600 hover:text-blue-900' : 'text-gray-200 hover:text-white'}`}>
              Contact
            </a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <button
              onClick={() => navigate('/login')}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                scrolled
                  ? 'bg-blue-900 text-white hover:bg-blue-800'
                  : 'bg-white text-blue-900 hover:bg-gray-100'
              }`}
            >
              Portal
            </button>
          </div>

          <button className={`md:hidden ${scrolled ? 'text-gray-900' : 'text-white'}`} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className={`border-t px-4 py-5 md:hidden ${scrolled ? 'bg-white border-gray-200' : 'bg-gray-900/95 border-gray-800'}`}>
            <div className="flex flex-col gap-4">
              {['home', 'about', 'gallery', 'contact'].map((section) => (
                <a
                  key={section}
                  href={`#${section}`}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm uppercase tracking-wide transition ${scrolled ? 'text-gray-600 hover:text-blue-900' : 'text-gray-200 hover:text-white'}`}
                >
                  {section}
                </a>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/login')
                }}
                className="rounded-lg bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Portal Access
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="home" className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 pt-24">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${galleryData[activeSlide].url})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-950/80" />

          <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-wide text-blue-200">
                  <Sparkles size={16} /> Transforming school management
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    MBHS EduNexus
                    <span className="block mt-4 text-blue-200">A modern portal for Methodist Boys' High School.</span>
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                    Experience a streamlined academic journey with secure login, results tracking, attendance management, timetables, and school community features designed for students, teachers, and leaders.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-sm font-bold uppercase tracking-wide text-blue-900 shadow-lg transition hover:bg-gray-100"
                  >
                    <GraduationCap className="mr-2" size={18} /> Enter Portal
                  </button>
                  <a
                    href="#about"
                    className="inline-flex items-center justify-center rounded-lg border border-white/30 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
                  >
                    Learn More
                    <ArrowRight className="ml-2" size={18} />
                  </a>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: '100+ Years of Excellence', value: 'Heritage' },
                    { label: '2,000+ Students', value: 'Community' },
                    { label: '50+ Faculty', value: 'Expert Staff' },
                    { label: '98% Pass Rate', value: 'Results' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/20 bg-white/10 p-6">
                      <p className="text-sm uppercase tracking-wide text-blue-200">{item.label}</p>
                      <p className="mt-3 text-3xl font-extrabold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-2xl">
                <img src={galleryData[activeSlide].url} alt={galleryData[activeSlide].caption} className="h-full w-full min-h-[420px] object-cover object-center" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/90 to-transparent p-6">
                  <p className="text-sm uppercase tracking-wide text-blue-300">Featured school moment</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">{galleryData[activeSlide].caption}</h2>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {[
                {
                  title: 'Secure School Portal',
                  description: 'Students and staff use protected access for grades, attendance, timetables, and announcements.',
                  icon: <ShieldCheck size={28} className="text-blue-900" />,
                },
                {
                  title: 'Academic Progress',
                  description: 'Track term results and performance to keep every student moving toward excellence.',
                  icon: <BookOpen size={28} className="text-blue-900" />,
                },
                {
                  title: 'Smart Attendance',
                  description: 'Capture attendance fast and accurately across class groups, departments, and terms.',
                  icon: <CalendarDays size={28} className="text-blue-900" />,
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-900">{item.icon}</div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-4 text-gray-600 leading-7">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-gray-50 py-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-wide text-blue-900 font-semibold">About Us</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">A legacy of leadership, learning, and lifelong impact.</h2>
                <p className="max-w-2xl text-lg leading-8 text-gray-600">
                  Methodist Boys&apos; High School blends a century of heritage with modern learning tools. EduNexus is the school&apos;s premium digital portal, designed to support academic achievement, student wellbeing, and faculty excellence.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    'Mission-driven education',
                    'Strong moral values',
                    'Day and boarding student support',
                    'Digital academic resources',
                  ].map((value) => (
                    <div key={value} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <p className="text-sm text-gray-700">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <img src={schoolCompound3} alt="School compound" className="h-80 w-full object-cover object-center" />
                  <div className="p-6">
                    <p className="text-sm uppercase tracking-wide text-blue-900 font-semibold">Campus Life</p>
                    <h3 className="mt-3 text-2xl font-bold text-gray-900">A thriving academic community.</h3>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <img src={sportsRecreation2} alt="Sports recreation" className="h-80 w-full object-cover object-center" />
                  <div className="p-6">
                    <p className="text-sm uppercase tracking-wide text-blue-900 font-semibold">Sports & Clubs</p>
                    <h3 className="mt-3 text-2xl font-bold text-gray-900">Success inside and outside the classroom.</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="bg-white py-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-wide text-blue-900 font-semibold">Gallery</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">Scenes from school life.</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {galleryData.map((item, index) => (
                <button
                  key={item.caption}
                  onClick={() => setActiveSlide(index)}
                  className={`group relative overflow-hidden rounded-xl border transition hover:shadow-md ${
                    index === activeSlide ? 'border-blue-900 ring-2 ring-blue-900' : 'border-gray-200 opacity-80'
                  }`}
                >
                  <img src={item.url} alt={item.caption} className="h-48 w-full object-cover object-center transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-left text-sm text-white drop-shadow-md">{item.caption}</div>
                </button>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="relative overflow-hidden rounded-xl">
                  <img src={galleryData[activeSlide].url} alt={galleryData[activeSlide].caption} className="h-full w-full min-h-[320px] object-cover object-center" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-gray-50 p-8">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-blue-900 font-semibold">Featured moment</p>
                    <h3 className="mt-4 text-3xl font-bold text-gray-900">{galleryData[activeSlide].caption}</h3>
                    <p className="mt-5 text-gray-600 leading-7">
                      Discover the heartbeat of MBHS through our classrooms, ceremonies, campus spaces, and athletic celebrations.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={handlePrev}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      <ChevronLeft size={18} /> Previous
                    </button>
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-blue-900 py-24 px-4 text-white">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm uppercase tracking-wide text-blue-300">EduNexus Portal</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold">Secure access for every student and staff member.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-200">
              The portal is built to simplify daily school life — from attendance to results, timetables, and secure communication.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-sm font-semibold uppercase tracking-wide text-blue-900 transition hover:bg-gray-100"
              >
                Student Login
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-lg border border-white/40 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Staff Login
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-gray-50 py-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-900 font-semibold">Get in touch</p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">Contact MBHS EduNexus.</h2>
                <p className="mt-6 max-w-xl text-gray-600 leading-8">
                  Speak with the school office for admissions, portal support, or general inquiries. We are here to help students and staff get the most out of EduNexus.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    icon: <MapPin size={24} className="text-blue-900" />,
                    title: 'Location',
                    lines: ["Methodist Boys' High School", 'Freetown, Sierra Leone'],
                  },
                  {
                    icon: <Phone size={24} className="text-blue-900" />,
                    title: 'Phone',
                    lines: ['+232 XX XXX XXXX', 'Mon - Fri · 8AM - 4PM'],
                  },
                  {
                    icon: <Mail size={24} className="text-blue-900" />,
                    title: 'Portal Support',
                    lines: ['mbhs-edunexus.vercel.app', 'support@mbhs-edunexus.com'],
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-900">{item.icon}</div>
                    <h3 className="mt-5 text-xl font-bold text-gray-900">{item.title}</h3>
                    <div className="mt-3 space-y-1 text-gray-600 text-sm">
                      {item.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center">
        <p className="text-xs text-gray-500">
          &copy; 2026 Methodist Boys' High School. All Rights Reserved. Freetown, Sierra Leone.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Developed by Alie Amadu Sesay
        </p>
      </footer>
    </div>
  )
}