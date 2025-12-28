// CourseBrowsePage.jsx - UPDATED: Backend Cart API Integration
import { useState, useEffect } from 'react';
import { ShoppingCart, Search, X, User, BookOpen, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '@/context/authService';

const API_BASE_URL = 'http://localhost:8000';

function CourseBrowsePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartId, setCartId] = useState(null);

  const levels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
                  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];
  const languages = ['English', 'Singhalese', 'Tamil'];

  // Get authorization headers
  const getAuthHeaders = () => {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Load cart from backend on mount
  useEffect(() => {
    loadCartFromBackend();
  }, []);

  // Fetch courses when filters change
  useEffect(() => {
    fetchCourses();
  }, [searchQuery, selectedLevel, selectedLanguage]);

  // Load cart from backend
  const loadCartFromBackend = async () => {
    try {
      setCartLoading(true);
      const response = await fetch(`${API_BASE_URL}/payment/cart/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle paginated response
        const cartItems = Array.isArray(data) ? data : (data.results || data.items || []);
        setCart(cartItems);
        
        // Store cart ID if available (for single cart object)
        if (data.id) {
          setCartId(data.id);
        }
        
        console.log('✅ Cart loaded from backend:', cartItems.length, 'items');
      } else if (response.status === 404) {
        // Cart doesn't exist yet, that's fine
        setCart([]);
        console.log('📭 No cart found');
      } else {
        throw new Error(`Failed to load cart: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      // Fallback to localStorage
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Error parsing localStorage cart:', e);
        }
      }
    } finally {
      setCartLoading(false);
    }
  };

  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedLanguage) params.append('language', selectedLanguage);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/Course/courses/search/${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔄 Fetching courses from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Data received:', data);

      let courseList = [];
      if (Array.isArray(data)) {
        courseList = data;
      } else if (data.results) {
        courseList = data.results;
      } else if (data.courses) {
        courseList = data.courses;
      }

      setCourses(courseList);
      console.log(`✅ Loaded ${courseList.length} courses`);
      
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      setError(error.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Add to cart (backend)
 const addToCart = async (course) => {
  const isInCart = cart.some((item) => item.course_id === course.course_id);
  if (isInCart) {
    alert("This course is already in your cart");
    return;
  }

  try {
    setCartLoading(true);
    console.log("🛒 Adding course to cart:", course.course_id);

    const response = await fetch(`${API_BASE_URL}/payment/cart/add/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        course_id: course.course_id,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.error || data?.detail || response.statusText || "Bad Request";
      throw new Error(msg);
    }

    console.log("✅ Added to cart:", data);

    await loadCartFromBackend();
    setShowCartDrawer(true);
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    alert("Failed to add course to cart: " + error.message);
  } finally {
    setCartLoading(false);
  }
};


  // Remove from cart (backend)
  const removeFromCart = async (courseId) => {
    try {
      setCartLoading(true);
      console.log('🗑️ Removing course from cart:', courseId);

      const response = await fetch(`${API_BASE_URL}/payment/cart/${courseId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove from cart: ${response.statusText}`);
      }

      console.log('✅ Removed from cart');

      // Reload cart from backend
      await loadCartFromBackend();

    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      alert('Failed to remove course from cart: ' + error.message);
    } finally {
      setCartLoading(false);
    }
  };

  // Clear cart (backend)
  const clearCart = async () => {
    try {
      setCartLoading(true);
      console.log('🧹 Clearing cart');

      const response = await fetch(`${API_BASE_URL}/payment/cart/clear/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to clear cart: ${response.statusText}`);
      }

      console.log('✅ Cart cleared');
      setCart([]);
      setShowCartDrawer(false);

    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      alert('Failed to clear cart: ' + error.message);
    } finally {
      setCartLoading(false);
    }
  };

  const openCourseModal = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, course) => total + parseFloat(course.price || 0), 0).toFixed(2);
  };

// In CourseBrowsePage.jsx

  const proceedToCheckout = () => {
      if (cart.length === 0) {
        alert('Your cart is empty! Please add courses before proceeding to checkout.');
        return;
      }

      try {
        const checkoutData = {
          timestamp: new Date().toISOString(),
          totalItems: cart.length,
          totalPrice: getTotalPrice()
        };

        // FIX 1: Save checkoutData (metadata)
        localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        
        // FIX 2: Save the actual cart items with the key 'checkoutCart'
        localStorage.setItem('checkoutCart', JSON.stringify(cart)); 
        
        console.log('🛒 Proceeding to checkout');
        navigate('/payment');
      } catch (error) {
        console.error('❌ Error saving checkout data:', error);
        alert('Failed to proceed to checkout. Please try again.');
      }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Browse Courses</h1>
            
            {/* Cart Button */}
            <button
              onClick={() => setShowCartDrawer(!showCartDrawer)}
              disabled={cartLoading}
              className="relative p-2 text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full -top-2 -right-2">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded-lg">
            <p className="font-semibold">Error loading courses</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">Search Courses</label>
              <div className="relative">
                <Search className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-96 animate-pulse"></div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600">No courses found</p>
            <p className="mt-2 text-sm text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <div
                key={course.course_id}
                className="overflow-hidden transition bg-white rounded-lg shadow-sm hover:shadow-md"
              >
                <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
                  {course.image ? (
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen size={48} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-2 font-semibold text-gray-900 cursor-pointer line-clamp-2 hover:text-indigo-600"
                      onClick={() => openCourseModal(course)}>
                    {course.title}
                  </h3>

                  <p className="mb-3 text-sm text-gray-600">
                    {course.teacher?.full_name || course.teacher?.username || 'Unknown Instructor'}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-indigo-600">${course.price}</span>
                    {course.average_rating && (
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-600">
                          {course.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openCourseModal(course)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 transition border border-indigo-600 rounded-lg hover:bg-indigo-50"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => addToCart(course)}
                      disabled={cartLoading || cart.some(item => item.course_id === course.course_id)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        cart.some(item => item.course_id === course.course_id)
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      {cart.some(item => item.course_id === course.course_id) ? 'In Cart' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Drawer */}
        {showCartDrawer && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCartDrawer(false)}></div>
            
            <div className="absolute top-0 bottom-0 right-0 w-full max-w-md bg-white shadow-lg">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 px-6 py-6 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Your cart is empty</p>
                      <p className="mt-2 text-sm text-gray-500">Add courses to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((course) => (
                        <div key={course.course_id} className="flex gap-4 pb-4 border-b">
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                            {course.image ? (
                              <img 
                                src={course.image} 
                                alt={course.title}
                                className="object-cover w-full h-full rounded-lg"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <BookOpen size={24} className="text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="mb-1 font-semibold text-gray-900 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="mb-2 text-sm text-gray-600">
                              {course.teacher?.full_name || course.teacher?.username}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-indigo-600">
                                ${course.price}
                              </span>
                              <button
                                onClick={() => removeFromCart(course.course_id)}
                                disabled={cartLoading}
                                className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Footer */}
                {cart.length > 0 && (
                  <div className="p-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-indigo-600">${getTotalPrice()}</span>
                    </div>
                    <button
                      onClick={proceedToCheckout}
                      disabled={cartLoading}
                      className="w-full py-3 mb-2 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Proceed to Checkout ({cart.length})
                    </button>
                    <button
                      onClick={clearCart}
                      disabled={cartLoading}
                      className="w-full py-2 text-sm font-medium text-gray-700 transition border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Clear Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Course Details Modal */}
        {showCourseModal && selectedCourse && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCourseModal(false)}></div>
              
              <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                <div className="relative">
                  <div className="h-48 rounded-t-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                    {selectedCourse.image ? (
                      <img 
                        src={selectedCourse.image} 
                        alt={selectedCourse.title}
                        className="object-cover w-full h-full rounded-t-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen size={64} className="text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowCourseModal(false)}
                    className="absolute p-2 transition bg-white rounded-full shadow-lg top-4 right-4 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">
                    {selectedCourse.title}
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User size={20} />
                      <div>
                        <p className="text-xs text-gray-500">Instructor</p>
                        <p className="font-semibold">
                          {selectedCourse.teacher?.full_name || selectedCourse.teacher?.username || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen size={20} />
                      <div>
                        <p className="text-xs text-gray-500">Level</p>
                        <p className="font-semibold">{selectedCourse.level}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Star size={20} />
                      <div>
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="font-semibold">
                          {selectedCourse.average_rating ? selectedCourse.average_rating.toFixed(1) : 'N/A'} 
                          {selectedCourse.rating_count > 0 && ` (${selectedCourse.rating_count})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={20} />
                      <div>
                        <p className="text-xs text-gray-500">Students</p>
                        <p className="font-semibold">{selectedCourse.student_count || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
                    <p className="text-gray-600">{selectedCourse.description}</p>
                  </div>

                  {selectedCourse.department && (
                    <div className="mb-4">
                      <h3 className="mb-2 font-semibold text-gray-900">Department</h3>
                      <p className="text-gray-600">{selectedCourse.department}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="mb-2 font-semibold text-gray-900">Language</h3>
                    <p className="text-gray-600">{selectedCourse.language}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-3xl font-bold text-indigo-600">
                      ${selectedCourse.price}
                    </div>
                    <button
                      onClick={() => {
                        addToCart(selectedCourse);
                        setShowCourseModal(false);
                      }}
                      disabled={cartLoading || cart.some(item => item.course_id === selectedCourse.course_id)}
                      className={`px-6 py-3 rounded-lg transition font-semibold ${
                        cart.some(item => item.course_id === selectedCourse.course_id)
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      {cart.some(item => item.course_id === selectedCourse.course_id) 
                        ? 'Already in Cart' 
                        : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseBrowsePage;