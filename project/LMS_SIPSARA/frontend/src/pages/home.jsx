import { useState } from 'react';
import { Menu, X, BookOpen, BookmarkIcon, Users, Award, Lightbulb } from 'lucide-react';

import { Link } from 'react-router-dom';



function Home() {  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600 mr-2" />
              <div className="text-xl font-bold text-indigo-600">EDULEARN</div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#courses" className="text-gray-600 hover:text-gray-900 font-medium">Courses</a>
              <a href="#community" className="text-gray-600 hover:text-gray-900 font-medium">Community</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">About</a>
              <Link to= "/Login" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700">Login</Link>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={toggleMenu} className="text-gray-600 hover:text-gray-900">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#courses" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">Courses</a>
              <a href="#community" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">Community</a>
              <a href="#about" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">About</a>
              <a href="/login" className="block px-3 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700">Login</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Your Learning Journey</span>
              <span className="block text-indigo-600">Starts Here</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Access thousands of courses, connect with expert instructors, and join a global community of lifelong learners.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a href="#login-section" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                  Get started
                </a>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <a href="#features" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* Features Section */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Platform Features</h2>
            <p className="mt-4 text-lg text-gray-500">Everything you need for an exceptional learning experience</p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="p-6 bg-gray-50 rounded-lg shadow-md">
                <div className="w-12 h-12 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <BookmarkIcon size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Structured Learning Paths</h3>
                <p className="mt-2 text-gray-500">Follow curated paths designed by experts to master new skills systematically.</p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg shadow-md">
                <div className="w-12 h-12 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Community Forums</h3>
                <p className="mt-2 text-gray-500">Connect with peers and instructors to discuss course materials and share insights.</p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg shadow-md">
                <div className="w-12 h-12 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <Award size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Certificates</h3>
                <p className="mt-2 text-gray-500">Earn recognized certificates upon course completion to showcase your achievements.</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Featured Courses */}
      <div id="courses" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Featured Courses</h2>
            <p className="mt-4 text-lg text-gray-500">Discover our most popular learning opportunities</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-indigo-100 flex items-center justify-center">
                <Lightbulb size={48} className="text-indigo-600" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Introduction to Data Science</h3>
                <p className="mt-2 text-gray-500">Learn the fundamentals of data analysis, visualization and machine learning.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">8 weeks • Beginner</span>
                  <span className="text-indigo-600 font-medium">4.9 ★★★★★</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-indigo-100 flex items-center justify-center">
                <Lightbulb size={48} className="text-indigo-600" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Web Development Bootcamp</h3>
                <p className="mt-2 text-gray-500">Master HTML, CSS, JavaScript and modern frameworks to build interactive websites.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">12 weeks • Intermediate</span>
                  <span className="text-indigo-600 font-medium">4.8 ★★★★★</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-indigo-100 flex items-center justify-center">
                <Lightbulb size={48} className="text-indigo-600" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Digital Marketing Essentials</h3>
                <p className="mt-2 text-gray-500">Learn SEO, social media marketing, email campaigns and analytics tools.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">6 weeks • All levels</span>
                  <span className="text-indigo-600 font-medium">4.7 ★★★★★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-indigo-400 mr-2" />
                <div className="text-xl font-bold text-white">EDULEARN</div>
              </div>
              <p className="mt-4 text-gray-400">Empowering learners worldwide with quality education since 2023.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#courses" className="text-gray-400 hover:text-white">Courses</a></li>
                <li><a href="#courses" className="text-gray-400 hover:text-white">Instructors</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#courses" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#courses" className="text-gray-400 hover:text-white">Student Guidelines</a></li>
                <li><a href="#courses" className="text-gray-400 hover:text-white">Accessibility</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>support@edulearn.com</li>
                <li>+1 (555) 123-4567</li>
                <li>123 Learning Way, Education City</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} EDULEARN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;