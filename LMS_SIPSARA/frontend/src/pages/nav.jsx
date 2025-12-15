import React, { useState, useEffect } from 'react';
import { Home, Info, Mail, Shield, LogIn, LogOut, Sun, Moon, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // You'll manage this with your auth system
  
  const SITE_NAME = "Freemasonry"; // Replace with your actual site name

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleMobile = () => {
    setIsOpen(!isOpen);
  };

  const handleNavClick = (path) => {
    // Replace with your routing logic (React Router, Next.js, etc.)
    console.log(`Navigate to: ${path}`);
    setIsOpen(false); // Close mobile menu
  };

  const handleLogin = () => {
    // Replace with your authentication logic
    console.log('Login clicked');
    setIsOpen(false);
  };

  const handleLogout = () => {
    // Replace with your logout logic
    console.log('Logout clicked');
    setIsAuthenticated(false);
    setIsOpen(false);
  };

  const NavLink = ({ href, icon: Icon, children, onClick }) => (
    <li className="nav-item">
      <button
        onClick={() => onClick ? onClick() : handleNavClick(href)}
        className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 w-full text-left"
      >
        <Icon size={18} className="mr-2" />
        {children}
      </button>
    </li>
  );

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700 py-3">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('/')}
              className="flex items-center"
            >
              {/* Logo Images - you'll need to handle the image loading */}
              <div className="relative mr-3">
                {isDark ? (
                  <img
                    src="/img/logos/Freemasonry_master_logo_white.png"
                    alt={`${SITE_NAME} Dark Logo`}
                    className="h-12 w-auto"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <img
                    src="/img/logos/Freemasonry_master_logo.png"
                    alt={`${SITE_NAME} Logo`}
                    className="h-12 w-auto"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {SITE_NAME}
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            <ul className="flex items-center space-x-1">
              <NavLink href="/" icon={Home}>
                Home
              </NavLink>
              <NavLink href="/about" icon={Info}>
                About
              </NavLink>
              <NavLink href="/contact" icon={Mail}>
                Contact
              </NavLink>
              
              {isAuthenticated ? (
                <>
                  <NavLink href="/member/dashboard" icon={Shield}>
                    Member Dashboard
                  </NavLink>
                  <NavLink icon={LogOut} onClick={handleLogout}>
                    Logout
                  </NavLink>
                </>
              ) : (
                <NavLink icon={LogIn} onClick={handleLogin}>
                  Login
                </NavLink>
              )}
            </ul>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={20} className="text-yellow-500" />
              ) : (
                <Moon size={20} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={18} className="text-yellow-500" />
              ) : (
                <Moon size={18} className="text-gray-600" />
              )}
            </button>
            
            <button
              onClick={toggleMobile}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? (
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu size={24} className="text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t dark:border-gray-700 pt-4">
            <ul className="space-y-2">
              <NavLink href="/" icon={Home}>
                Home
              </NavLink>
              <NavLink href="/about" icon={Info}>
                About
              </NavLink>
              <NavLink href="/contact" icon={Mail}>
                Contact
              </NavLink>
              
              {isAuthenticated ? (
                <>
                  <NavLink href="/member/dashboard" icon={Shield}>
                    Member Dashboard
                  </NavLink>
                  <NavLink icon={LogOut} onClick={handleLogout}>
                    Logout
                  </NavLink>
                </>
              ) : (
                <NavLink icon={LogIn} onClick={handleLogin}>
                  Login
                </NavLink>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;