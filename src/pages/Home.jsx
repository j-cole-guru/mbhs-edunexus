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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-slate-950/95 backdrop-blur-xl shadow-black/20 shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="MBHS" className="h-11 w-11 rounded-2xl bg-white/10 p-2" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white">MBHS EduNexus</p>
              <p className="text-xs text-slate-400">Methodist Boys' High School</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#home" className="text-sm text-slate-200 hover:text-blue-400 transition">
              Home
            </a>
            <a href="#about" className="text-sm text-slate-200 hover:text-blue-400 transition">
              About
            </a>
            <a href="#gallery" className="text-sm text-slate-200 hover:text-blue-400 transition">
              Gallery
            </a>
            <a href="#contact" className="text-sm text-slate-200 hover:text-blue-400 transition">
              Contact
            </a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <button
              onClick={() => navigate('/login')}
              className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
            >
              Portal
            </button>
          </div>

          <button className="md:hidden text-slate-100" onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-800 bg-slate-950/95 px-4 py-5 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-4">
              {['home', 'about', 'gallery', 'contact'].map((section) => (
                <a
                  key={section}
                  href={`#${section}`}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm uppercase tracking-[0.18em] text-slate-200 hover:text-blue-400 transition"
                >
                  {section}
                </a>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/login')
                }}
                className="rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-blue-400"
              >
                Portal Access
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="home" className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${galleryData[activeSlide].url})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-slate-950/90" />

          <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm uppercase tracking-[0.22em] text-blue-300">
                  <Sparkles size={16} /> Transforming school management
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    MBHS EduNexus
                    <span className="block mt-4 text-blue-400">A modern, premium portal for Methodist Boys’ High School.</span>
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                    Experience a streamlined academic journey with secure login, results tracking, attendance management, timetables, and school community features designed for students, teachers, and leaders.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center rounded-full bg-blue-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-950 shadow-xl shadow-blue-500/20 transition hover:bg-blue-400"
                  >
                    <GraduationCap className="mr-2" size={18} /> Enter Portal
                  </button>
                  <a
                    href="#about"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:border-white hover:bg-white/10"
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
                    <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                      <p className="mt-3 text-3xl font-extrabold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40">
                <img src={galleryData[activeSlide].url} alt={galleryData[activeSlide].caption} className="h-full w-full min-h-[420px] object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-blue-300">Featured school moment</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">{galleryData[activeSlide].caption}</h2>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950/95 py-24 px-4 text-slate-100">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-3">
              {[
                {
                  title: 'Secure School Portal',
                  description: 'Students and staff use protected access for grades, attendance, timetables, and announcements.',
                  icon: <ShieldCheck size={28} className="text-blue-400" />,
                },
                {
                  title: 'Academic Progress',
                  description: 'Track term results and performance to keep every student moving toward excellence.',
                  icon: <BookOpen size={28} className="text-blue-400" />,
                },
                {
                  title: 'Smart Attendance',
                  description: 'Capture attendance fast and accurately across class groups, departments, and terms.',
                  icon: <CalendarDays size={28} className="text-blue-400" />,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-blue-400">{item.icon}</div>
                  <h3 className="mt-6 text-xl font-bold text-white">{item.title}</h3>
                  <p className="mt-4 text-slate-300 leading-7">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-24 px-4 text-slate-100">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.24em] text-blue-400">About Us</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">A legacy of leadership, learning, and lifelong impact.</h2>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Methodist Boys&apos; High School blends a century of heritage with modern learning tools. EduNexus is the school&apos;s premium digital portal, designed to support academic achievement, student wellbeing, and faculty excellence.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    'Mission-driven education',
                    'Strong moral values',
                    'Day and boarding student support',
                    'Digital academic resources',
                  ].map((value) => (
                    <div key={value} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                      <p className="text-sm text-slate-300">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/30">
                  <img src={schoolCompound3} alt="School compound" className="h-80 w-full object-cover" />
                  <div className="p-6">
                    <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Campus Life</p>
                    <h3 className="mt-3 text-2xl font-bold text-white">A thriving academic community.</h3>
                  </div>
                </div>
                <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/30">
                  <img src={sportsRecreation2} alt="Sports recreation" className="h-80 w-full object-cover" />
                  <div className="p-6">
                    <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Sports & Clubs</p>
                    <h3 className="mt-3 text-2xl font-bold text-white">Success inside and outside the classroom.</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="bg-slate-950/95 py-24 px-4 text-slate-100">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Gallery</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">Scenes from school life.</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {galleryData.map((item, index) => (
                <button
                  key={item.caption}
                  onClick={() => setActiveSlide(index)}
                  className={`group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/70 transition hover:scale-[1.02] ${
                    index === activeSlide ? 'ring-2 ring-blue-500/70' : 'opacity-80'
                  }`}
                >
                  <img src={item.url} alt={item.caption} className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-left text-sm text-white">{item.caption}</div>
                </button>
              ))}
            </div>

            <div className="mt-10 rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
              <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="relative overflow-hidden rounded-[1.75rem]">
                  <img src={galleryData[activeSlide].url} alt={galleryData[activeSlide].caption} className="h-full w-full min-h-[320px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                </div>
                <div className="flex flex-col justify-between rounded-[1.75rem] bg-slate-950/95 p-8">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Featured moment</p>
                    <h3 className="mt-4 text-3xl font-bold text-white">{galleryData[activeSlide].caption}</h3>
                    <p className="mt-5 text-slate-300 leading-7">
                      Discover the heartbeat of MBHS through our classrooms, ceremonies, campus spaces, and athletic celebrations.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={handlePrev}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/15"
                    >
                      <ChevronLeft size={18} /> Previous
                    </button>
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-400"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-blue-500 py-24 px-4 text-slate-950">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-950/70">EduNexus Portal</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold">Secure access for every student and staff member.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-950/80">
              The portal is built to simplify daily school life — from attendance to results, timetables, and secure communication.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-900"
              >
                Student Login
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-full border border-slate-950/20 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:border-white hover:bg-white/20"
              >
                Staff Login
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-slate-950 py-24 px-4 text-slate-100">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Get in touch</p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">Contact MBHS EduNexus.</h2>
                <p className="mt-6 max-w-xl text-slate-300 leading-8">
                  Speak with the school office for admissions, portal support, or general inquiries. We are here to help students and staff get the most out of EduNexus.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    icon: <MapPin size={24} className="text-blue-400" />,
                    title: 'Location',
                    lines: ["Methodist Boys' High School", 'Freetown, Sierra Leone'],
                  },
                  {
                    icon: <Phone size={24} className="text-blue-400" />,
                    title: 'Phone',
                    lines: ['+232 XX XXX XXXX', 'Mon - Fri · 8AM - 4PM'],
                  },
                  {
                    icon: <Mail size={24} className="text-blue-400" />,
                    title: 'Portal Support',
                    lines: ['mbhs-edunexus.vercel.app', 'support@mbhs-edunexus.com'],
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-blue-400">{item.icon}</div>
                    <h3 className="mt-5 text-xl font-bold text-white">{item.title}</h3>
                    <div className="mt-3 space-y-1 text-slate-300 text-sm">
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

      <footer className="border-t border-slate-900/80 bg-slate-950 py-10 px-4 text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="MBHS" className="h-10 w-10 rounded-2xl bg-white/5 p-2" />
            <div>
              <p className="font-semibold text-white">MBHS EduNexus</p>
              <p className="text-sm text-slate-500">Premium student and staff portal.</p>
            </div>
          </div>
          <p className="text-sm">© 2026 Methodist Boys' High School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
