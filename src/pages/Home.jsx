import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Users, BookOpen, Award, Heart } from 'lucide-react'
import logo from '../assets/logo.png'

const Home = () => {
  const navigate = useNavigate()
  const [currentGalleryIndices, setCurrentGalleryIndices] = useState({
    gallery1: 0,
    gallery2: 0,
    gallery3: 0,
    gallery4: 0,
    gallery5: 0
  })

  // Gallery data - Add your images to src/assets/galleries folders
  const galleries = {
    gallery1: {
      title: 'School Compound',
      description: 'Beautiful views of our school premises',
      images: [
        '/src/assets/galleries/school_compound/image1.jpg',
        '/src/assets/galleries/school_compound/image2.jpg',
        '/src/assets/galleries/school_compound/image3.jpg'
      ],
      fallbackImage: 'https://images.unsplash.com/photo-1427504494785-cdaa41d52470?w=500&h=400&fit=crop'
    },
    gallery2: {
      title: 'Students Learning',
      description: 'Engaging classroom experiences',
      images: [
        '/src/assets/galleries/students_learning/image1.jpg',
        '/src/assets/galleries/students_learning/image2.jpg',
        '/src/assets/galleries/students_learning/image3.jpg'
      ],
      fallbackImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=400&fit=crop'
    },
    gallery3: {
      title: 'Sports & Recreation',
      description: 'Athletic activities and outdoor fun',
      images: [
        '/src/assets/galleries/sports_recreation/image1.jpg',
        '/src/assets/galleries/sports_recreation/image2.jpg',
        '/src/assets/galleries/sports_recreation/image3.jpg'
      ],
      fallbackImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=400&fit=crop'
    },
    gallery4: {
      title: 'Events & Ceremonies',
      description: 'Special moments and celebrations',
      images: [
        '/src/assets/galleries/events_ceremonies/image1.jpg',
        '/src/assets/galleries/events_ceremonies/image2.jpg',
        '/src/assets/galleries/events_ceremonies/image3.jpg'
      ],
      fallbackImage: 'https://images.unsplash.com/photo-1540575467063-178f50002c4b?w=500&h=400&fit=crop'
    },
    gallery5: {
      title: 'Student Life',
      description: 'Daily moments and friendships',
      images: [
        '/src/assets/galleries/student_life/image1.jpg',
        '/src/assets/galleries/student_life/image2.jpg',
        '/src/assets/galleries/student_life/image3.jpg'
      ],
      fallbackImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=400&fit=crop'
    }
  }

  const handlePrevImage = (galleryKey) => {
    setCurrentGalleryIndices(prev => ({
      ...prev,
      [galleryKey]: (prev[galleryKey] - 1 + galleries[galleryKey].images.length) % galleries[galleryKey].images.length
    }))
  }

  const handleNextImage = (galleryKey) => {
    setCurrentGalleryIndices(prev => ({
      ...prev,
      [galleryKey]: (prev[galleryKey] + 1) % galleries[galleryKey].images.length
    }))
  }

  const GalleryCard = ({ galleryKey, galleryData }) => {
    const currentIndex = currentGalleryIndices[galleryKey]
    const imageSource = galleryData.images[currentIndex] || galleryData.fallbackImage
    return (
      <div className="card overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-64 bg-gray-200 overflow-hidden group">
          <img
            src={imageSource}
            alt={galleryData.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = galleryData.fallbackImage
            }}
          />
          <button
            onClick={() => handlePrevImage(galleryKey)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleNextImage(galleryKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {galleryData.images.length}
          </div>
        </div>
        <div className="p-4">
          <h3 className="section-title mb-1">{galleryData.title}</h3>
          <p className="body-text text-gray-600">{galleryData.description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="School Logo" className="h-10 w-10" />
            <span className="text-lg font-bold text-blue-900">MBHS EduNexus</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">Welcome to MBHS EduNexus</h1>
              <p className="text-xl text-blue-100 mb-8">
                Your comprehensive school management and learning platform. Bridging education and technology for a better future.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
              >
                Get Started - Login Now
              </button>
            </div>
            <div className="hidden md:block">
              <img src={logo} alt="School" className="w-full max-w-md mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="page-title mb-4">About Our Institution</h2>
            <div className="w-12 h-1 bg-blue-900 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                MBHS EduNexus is a modern educational management system designed to streamline school operations and enhance the learning experience. Our platform provides integrated solutions for students, teachers, and administrators.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We are committed to excellence in education, combining traditional teaching methods with innovative digital solutions. Our state-of-the-art facilities and dedicated staff ensure every student receives quality education and personal attention.
              </p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1427504494785-cdaa41d52470?w=600&h=400&fit=crop"
              alt="About School"
              className="rounded-lg shadow-lg"
            />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <BookOpen className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <h3 className="section-title mb-2">Quality Education</h3>
              <p className="body-text">Comprehensive curriculum and expert instructors</p>
            </div>
            <div className="card text-center">
              <Users className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <h3 className="section-title mb-2">Community</h3>
              <p className="body-text">Supportive environment for all students</p>
            </div>
            <div className="card text-center">
              <Award className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <h3 className="section-title mb-2">Excellence</h3>
              <p className="body-text">Outstanding academic and sports achievements</p>
            </div>
            <div className="card text-center">
              <Heart className="w-12 h-12 text-blue-900 mx-auto mb-4" />
              <h3 className="section-title mb-2">Care & Support</h3>
              <p className="body-text">Holistic development of every student</p>
            </div>
          </div>
        </div>
      </section>

      {/* Galleries Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="page-title mb-4">Gallery</h2>
            <p className="text-lg text-gray-600">Explore life at MBHS EduNexus</p>
            <div className="w-12 h-1 bg-blue-900 mx-auto mt-4"></div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <GalleryCard galleryKey="gallery1" galleryData={galleries.gallery1} />
            <GalleryCard galleryKey="gallery2" galleryData={galleries.gallery2} />
            <GalleryCard galleryKey="gallery3" galleryData={galleries.gallery3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GalleryCard galleryKey="gallery4" galleryData={galleries.gallery4} />
            <GalleryCard galleryKey="gallery5" galleryData={galleries.gallery5} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Our Community?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Access your account now and be part of our educational journey
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
          >
            Login to Your Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">About Us</h4>
              <p className="text-sm">MBHS EduNexus - Transforming education through technology</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-sm">Email: info@mbhs.edu</p>
              <p className="text-sm">Phone: +234-XXX-XXXX-XX</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2024 MBHS EduNexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
