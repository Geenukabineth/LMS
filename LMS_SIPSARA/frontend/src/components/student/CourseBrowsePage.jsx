import { useState, useEffect } from 'react';
import { ShoppingCart, Search, X, User, BookOpen, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ✅ Import Services
import { courseService } from '@/config/course.config';
import { paymentService } from '@/config/payment.config';

function CourseBrowsePage() {
  const navigate = useNavigate();
  
  // Data State
  const [courses, setCourses] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // UI State
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const levels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
                  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];
  const languages = ['English', 'Singhalese', 'Tamil'];

  // Initial Load
  useEffect(() => {
    loadCart();
  }, []);

  // Fetch courses when filters change
  useEffect(() => {
    fetchCourses();
  }, [searchQuery, selectedLevel, selectedLanguage]);

  // --- CART FUNCTIONS ---

  const loadCart = async () => {
    try {
      const data = await paymentService.getCart();
      const cartItems = Array.isArray(data) ? data : (data.results || data.items || []);
      setCart(cartItems);
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  };

  const addToCart = async (course) => {
    if (cart.some((item) => item.course_id === course.course_id)) {
      alert("This course is already in your cart");
      return;
    }
    try {
      setCartLoading(true);
      await paymentService.addToCart(course.course_id);
      await loadCart();
      setShowCartDrawer(true);
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || "Failed to add to cart";
      alert(msg);
    } finally {
      setCartLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      setCartLoading(true);
      await paymentService.removeFromCart(cartItemId);
      await loadCart();
    } catch (error) {
      console.error("Remove failed", error);
      alert('Failed to remove course');
    } finally {
      setCartLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setCartLoading(true);
      await paymentService.clearCart();
      setCart([]);
      setShowCartDrawer(false);
    } catch (error) {
      alert('Failed to clear cart');
    } finally {
      setCartLoading(false);
    }
  };

  // --- COURSE FUNCTIONS ---

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedLevel) params.level = selectedLevel;
      if (selectedLanguage) params.language = selectedLanguage;

      const data = await courseService.searchCourses(params);
      
      let courseList = [];
      if (Array.isArray(data)) courseList = data;
      else if (data.results) courseList = data.results;
      else if (data.courses) courseList = data.courses;
      
      setCourses(courseList);
      
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      setError("Failed to load courses.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // --- UTILS ---

  const openCourseModal = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + parseFloat(item.price || 0), 0).toFixed(2);
  };

  // ✅ FIX APPLIED HERE: Saving 'checkoutCart' to localStorage
  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    const checkoutData = {
      timestamp: new Date().toISOString(),
      totalItems: cart.length,
      totalPrice: getTotalPrice()
    };
    
    // Fix: Save the cart items so PaymentPage can read them
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    
    navigate('/payment');
  };

  return (
    <div className="relative min-h-screen bg-gray-50"> 
      {/* Header: Cart is Top Right */}
      <header className="sticky top-0 z-40 bg-orange-500 shadow-sm">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Browse Courses</h1>
            
            <button
              onClick={() => setShowCartDrawer(!showCartDrawer)}
              disabled={cartLoading}
              className="relative p-2 text-white transition bg-orange-600 rounded-full hover:bg-red-500 hover:text-white disabled:opacity-50"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 border-2 border-white rounded-full -top-1 -right-1">
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
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <div
                key={course.course_id}
                className="overflow-hidden transition bg-white rounded-lg shadow-sm hover:shadow-md"
              >
                <div className="h-48 bg-gradient-to-r from-orange-500 to-red-600">
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
                  <h3 className="mb-2 font-semibold text-gray-900 cursor-pointer line-clamp-2 hover:text-orange-600"
                      onClick={() => openCourseModal(course)}>
                    {course.title}
                  </h3>

                  <p className="mb-3 text-sm text-gray-600">
                    {course.teacher?.full_name || course.teacher?.username || 'Unknown Instructor'}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-orange-600">${course.price}</span>
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
                      className="flex-1 px-3 py-2 text-sm font-medium text-orange-600 transition border border-orange-600 rounded-lg hover:bg-orange-50"
                    >
                      View Details
                    </button>
                    
                    <button
                      onClick={() => addToCart(course)}
                      disabled={cartLoading || cart.some(item => item.course_id === course.course_id)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        cart.some(item => item.course_id === course.course_id)
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50'
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

        {/* ---------------- CART DRAWER ---------------- */}
        {showCartDrawer && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCartDrawer(false)}></div>
            <div className="absolute top-0 bottom-0 right-0 w-full max-w-md bg-white shadow-lg">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
                  <button onClick={() => setShowCartDrawer(false)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 px-6 py-6 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((cartItem) => (
                        <div key={cartItem.id} className="flex gap-4 pb-4 border-b">
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gradient-to-r from-orange-400 to-red-500">
                            {cartItem.course_image ? (
                              <img 
                                src={cartItem.course_image} 
                                alt={cartItem.course_title}
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
                              {cartItem.course_title}
                            </h3>
                            <p className="mb-2 text-sm text-gray-600">
                              {cartItem.teacher_name}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-orange-600">
                                ${cartItem.price}
                              </span>
                              <button
                                onClick={() => removeFromCart(cartItem.id)}
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
                {cart.length > 0 && (
                  <div className="p-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-orange-600">${getTotalPrice()}</span>
                    </div>
                    <button
                      onClick={proceedToCheckout}
                      disabled={cartLoading}
                      className="w-full py-3 mb-2 font-semibold text-white transition bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
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

        {/* ---------------- COURSE DETAILS MODAL ---------------- */}
        {showCourseModal && selectedCourse && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCourseModal(false)}></div>
              
              <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                {/* Modal Content */}
                <div className="relative">
                  <div className="h-48 rounded-t-lg bg-gradient-to-r from-orange-400 to-red-500">
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

                  {/* Metadata Grid */}
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

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-3xl font-bold text-orange-600">
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
                          : 'bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50'
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