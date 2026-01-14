import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { courseService } from "@/config/course.config"; 
import {
  ArrowLeft,
  Play,
  FileText,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Loader,
  Video,
  File,
  Menu,
  Star,
  MessageCircle,
  Reply,
  Trash2, 
  Edit2, 
  X
} from "lucide-react";

const CourseDetailView = () => {
  const navigate = useNavigate();
  const { courseId: paramCourseId, id } = useParams();
  const location = useLocation();

  // Resolve courseId
  const enrollment = location.state?.enrollment;
  const courseId = paramCourseId || id || enrollment?.id || enrollment?.course?.id;

  // --- Core State ---
  const [courseDetail, setCourseDetail] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // --- UI State ---
  const [expandedModules, setExpandedModules] = useState({});
  const [currentLesson, setCurrentLesson] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 

  // --- Reviews State ---
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null); 

  // --- Feedback State ---
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ message: "" });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null); 

  // 1. Fetch User Info (From LocalStorage)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not load user from local storage", error);
    }
  }, []);

  // 2. Load Course Content
  useEffect(() => {
    if (!courseId) {
      setError("Course ID missing.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [detailData, modulesData, progressData] = await Promise.all([
          courseService.getStudentCourseDetail(courseId),
          courseService.getStudentCourseModules(courseId).catch(() => []),
          courseService.getStudentCourseProgress(courseId).catch(() => null),
        ]);

        setCourseDetail(detailData);

        // Handle modules pagination
        const mods = Array.isArray(modulesData) ? modulesData : (modulesData.results || []);
        setModules(mods);

        if (progressData) {
          setProgress(progressData.progress_percentage || 0);
        }

        // Auto-select first lesson
        if (mods.length > 0 && mods[0].lessons?.length > 0) {
          setCurrentLesson(mods[0].lessons[0]);
          setExpandedModules({ [mods[0].id || 0]: true });
        }
      } catch (err) {
        console.error("Failed to load course data:", err);
        setError("Failed to load course content. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  // 3. Load Reviews & Feedback
  useEffect(() => {
    if (!courseId) return;

    const loadExtras = async () => {
      try {
        // Fetch Reviews
        try {
          const reviewsRes = await courseService.getCourseReviews(courseId);
          const rData = reviewsRes.data;
          setReviews(Array.isArray(rData) ? rData : (rData.results || []));
        } catch (e) { console.error("Reviews error", e); }

        // Fetch Feedback
        try {
          const feedbackRes = await courseService.getCourseFeedback(courseId);
          const fData = feedbackRes.data;
          setFeedbackItems(Array.isArray(fData) ? fData : (fData.results || []));
        } catch (e) { console.error("Feedback error", e); }

      } catch (e) {
        console.error("Failed to load extras", e);
      }
    };

    loadExtras();
  }, [courseId]);

  // --- Handlers ---

  const handleLessonSelect = (lesson) => {
    if (!lesson) return;
    setCurrentLesson(lesson);
    setMobileMenuOpen(false);
  };

  const handleStartAssessment = () => {
    if (!currentLesson?.id) return alert("Error: Lesson ID not found");
    const type = currentLesson.content_type?.toLowerCase();
    if (type === "quiz") navigate(`/student/course/${courseId}/quiz/${currentLesson.id}`);
    else if (type === "assignment") navigate(`/student/course/${courseId}/assignment/${currentLesson.id}`);
  };

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // --- Review Handlers ---

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const handleStarClick = (value) => {
    setReviewForm((prev) => ({ ...prev, rating: value }));
  };

  const handleEditReviewClick = (review) => {
    setEditingReview(review);
    setReviewForm({ rating: review.rating, comment: review.review });
    document.getElementById("review-form")?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditReview = () => {
    setEditingReview(null);
    setReviewForm({ rating: 0, comment: "" });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await courseService.deleteCourseReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating || !reviewForm.comment.trim()) return;

    setSubmittingReview(true);
    try {
      const payload = {
        rating: reviewForm.rating,
        review: reviewForm.comment.trim(),
      };

      if (editingReview) {
        // Update Review
        await courseService.updateCourseReview(editingReview.id, payload);
        alert("Review updated!");
        setEditingReview(null);
      } else {
        // Create Review
        await courseService.submitCourseReview(courseId, payload);
      }

      // Refresh list
      const listRes = await courseService.getCourseReviews(courseId);
      const data = listRes.data;
      setReviews(Array.isArray(data) ? data : (data.results || []));
      
      setReviewForm({ rating: 0, comment: "" });
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Action failed.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // --- Feedback Handlers ---

  const handleEditFeedbackClick = (item) => {
    setEditingFeedback(item);
    setFeedbackForm({ message: item.title || "" }); // Edit Title
    document.getElementById("feedback-form")?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditFeedback = () => {
    setEditingFeedback(null);
    setFeedbackForm({ message: "" });
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Delete this feedback thread?")) return;
    try {
      await courseService.deleteCourseFeedback(feedbackId);
      setFeedbackItems(prev => prev.filter(i => i.qa_id !== feedbackId && i.id !== feedbackId));
    } catch (err) {
      alert("Failed to delete feedback.");
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) return;

    setSubmittingFeedback(true);
    try {
      if (editingFeedback) {
        // ✅ UPDATE EXISTING FEEDBACK (Title)
        const payload = { title: feedbackForm.message.slice(0, 80) };
        await courseService.updateCourseFeedback(editingFeedback.qa_id || editingFeedback.id, payload);
        alert("Feedback updated!");
        setEditingFeedback(null);
      } else {
        // ✅ CREATE NEW FEEDBACK
        const createRes = await courseService.createCourseFeedback(courseId, {
          title: feedbackForm.message.slice(0, 80),
        });
        const qa = createRes.data;

        // Add the first message to the thread
        await courseService.replyCourseFeedback(courseId, qa.qa_id, {
          message: feedbackForm.message.trim(),
        });
      }

      // Refresh list
      const feedbackRes = await courseService.getCourseFeedback(courseId);
      const fData = feedbackRes.data;
      setFeedbackItems(Array.isArray(fData) ? fData : (fData.results || []));

      setFeedbackForm({ message: "" });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Action failed.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // --- Render Helpers ---
  const isOwner = (itemUserId) => {
    if (!currentUser || !itemUserId) return false;
    const currentId = currentUser.id || currentUser.user_id || currentUser.pk;
    return String(itemUserId) === String(currentId);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 bg-gray-50">
        Error: {error}
      </div>
    );

  const courseData = courseDetail?.course || courseDetail || {};
  const courseTitle = courseData.title || "Untitled Course";

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 1. TOP NAVBAR */}
      <div className="flex items-center justify-between h-16 px-4 bg-gray-900 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden w-px h-6 bg-gray-700 sm:block" />
          <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md md:text-lg">
            {courseTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="items-center hidden gap-3 md:flex">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">Your Progress</span>
              <span className="text-xs font-bold text-green-400">
                {Math.round(progress)}% Completed
              </span>
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full">
              <div
                className="h-full transition-all duration-500 bg-green-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            className="text-gray-300 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu />
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDE: Content */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {/* PLAYER WINDOW */}
          <div className="relative flex items-center justify-center w-full bg-black shadow-lg aspect-video">
            {currentLesson ? (
              <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center text-white">
                {currentLesson.content_type === "video" && (
                  <>
                    <Play className="w-20 h-20 mb-6 text-blue-500 opacity-90" />
                    <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                    <p className="text-gray-400">Video Player Placeholder</p>
                  </>
                )}
                {currentLesson.content_type === "assignment" && (
                  <>
                    <FileText className="w-16 h-16 mb-6 text-orange-500" />
                    <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                    <button
                      onClick={handleStartAssessment}
                      className="px-6 py-3 font-bold transition-transform transform bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105"
                    >
                      View Assignment Details
                    </button>
                  </>
                )}
                {currentLesson.content_type === "quiz" && (
                  <>
                    <HelpCircle className="w-16 h-16 mb-6 text-purple-500" />
                    <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                    <button
                      onClick={handleStartAssessment}
                      className="px-6 py-3 font-bold transition-transform transform bg-purple-600 rounded-lg hover:bg-purple-700 hover:scale-105"
                    >
                      Start Quiz Attempt
                    </button>
                  </>
                )}
                {currentLesson.content_type === "document" && (
                  <>
                    <File className="w-16 h-16 mb-6 text-green-500" />
                    <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
                    {currentLesson.document || currentLesson.content_url_or_text ? (
                      <a
                        href={currentLesson.document || currentLesson.content_url_or_text}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 font-bold bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Download / Open Document
                      </a>
                    ) : (
                      <p className="text-red-400">No document attached.</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Select a lesson from the sidebar</div>
            )}
          </div>

          {/* DETAILS TABS */}
          <div className="max-w-4xl px-4 py-8 mx-auto md:px-8">
            <div className="flex gap-1 p-1 mb-6 border border-gray-200 rounded-lg bg-gray-50 w-fit">
              {["overview", "feedback", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* --- OVERVIEW --- */}
            {activeTab === "overview" && (
              <div className="animate-fade-in">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">About this course</h2>
                <div className="mb-8 prose text-gray-700 max-w-none">
                  {courseData.description || "No description provided for this course."}
                </div>
                <div className="p-6 border border-gray-200 bg-gray-50 rounded-xl">
                  <h3 className="mb-4 text-sm font-bold text-gray-400 uppercase">Instructor</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white bg-blue-600 rounded-full shadow-lg">
                      {courseData.teacher_name?.[0]?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{courseData.teacher_name || "Instructor"}</p>
                      <p className="text-sm text-blue-600">Course Author</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- FEEDBACK --- */}
            {activeTab === "feedback" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-2 text-gray-800">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">
                    {editingFeedback ? "Edit Feedback" : "Add Feedback"}
                  </h2>
                </div>
                
                <p className="mb-2 text-sm text-gray-500">
                  {editingFeedback 
                    ? "Update the title of your feedback thread." 
                    : "Share your feedback or questions. Instructors can reply here."}
                </p>

                {/* FEEDBACK FORM */}
                <form id="feedback-form" onSubmit={handleSubmitFeedback} className={`p-4 space-y-3 border rounded-xl ${editingFeedback ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      {editingFeedback ? "Edit Title" : "Your Message"}
                    </label>
                    {editingFeedback && (
                      <button type="button" onClick={cancelEditFeedback} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                        <X size={14} /> Cancel Edit
                      </button>
                    )}
                  </div>

                  <textarea
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder={editingFeedback ? "Update your title..." : "Write your feedback, question or complaint..."}
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))}
                  />
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingFeedback || !feedbackForm.message.trim()}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 ${editingFeedback ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {submittingFeedback ? "Processing..." : (editingFeedback ? "Update Feedback" : "Submit Feedback")}
                    </button>
                  </div>
                </form>

                {/* FEEDBACK LIST */}
                <div className="space-y-4">
                  {feedbackItems.length === 0 ? (
                    <div className="py-8 text-sm text-center text-gray-500">No feedback yet.</div>
                  ) : (
                    feedbackItems.map((item) => {
                      // Safety Check: Item user might be object or ID
                      const itemOwnerId = item.user?.id || item.user;
                      const owner = isOwner(itemOwnerId);

                      return (
                        // Ensure this div has 'relative'
                        <div key={item.qa_id || item.id} className="relative p-4 space-y-3 bg-white border rounded-xl group">
                          
                          {/* [STEP 3] The Buttons Code Goes Here */}
                          {owner && (
                            <div className="absolute flex gap-2 top-3 right-3">
                              <button onClick={() => handleEditFeedbackClick(item)} className="p-1 text-gray-400 hover:text-blue-600">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteFeedback(item.qa_id || item.id)} className="p-1 text-gray-400 hover:text-red-600">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pr-20">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{item.title || "Feedback"}</p>
                              <p className="text-[11px] text-gray-400">{item.date ? new Date(item.date).toLocaleString() : ""}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {item.messages?.map((msg) => (
                              <div key={msg.qam_id || msg.id} className="flex gap-2">
                                <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-gray-800 rounded-full shrink-0">
                                  {msg.profile?.full_name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 p-2 rounded-lg bg-gray-50">
                                  <p className="text-xs font-semibold text-gray-700">{msg.profile?.full_name || "User"}</p>
                                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- REVIEWS --- */}
            {activeTab === "reviews" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">Course Reviews</h2>
                    <p className="text-sm text-gray-500">Rate and review this course.</p>
                  </div>
                  {averageRating && (
                    <div className="px-3 py-2 text-right border rounded-xl bg-gray-50">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-lg font-bold text-yellow-500">{averageRating}</span>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                      <p className="text-[11px] text-gray-500">{reviews.length} review{reviews.length !== 1 && 's'}</p>
                    </div>
                  )}
                </div>

                <form id="review-form" onSubmit={handleSubmitReview} className={`p-4 space-y-4 border rounded-xl ${editingReview ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      {editingReview ? "Editing your review" : "Your rating"}
                    </p>
                    {editingReview && (
                      <button type="button" onClick={cancelEditReview} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                        <X size={14} /> Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button type="button" key={value} onClick={() => handleStarClick(value)} className="p-1">
                        <Star className={`w-6 h-6 transition-colors ${value <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={4}
                    placeholder="Write your review here..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview || !reviewForm.rating || !reviewForm.comment.trim()}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 ${editingReview ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {submittingReview ? "Processing..." : (editingReview ? "Update Review" : "Submit Review")}
                    </button>
                  </div>
                </form>

                <div className="space-y-4">
                  {reviews.map((rev) => {
                    const itemOwnerId = rev.user?.id || rev.user;
                    const owner = isOwner(itemOwnerId);

                    return (
                      <div key={rev.id} className="relative p-4 space-y-2 bg-white border rounded-xl group">
                        {owner && (
                          <div className="absolute flex gap-2 p-1 transition-opacity bg-white rounded shadow-sm opacity-0 top-4 right-4 group-hover:opacity-100">
                            <button onClick={() => handleEditReviewClick(rev)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteReview(rev.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-gray-800 rounded-full">
                            {rev.profile?.full_name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{rev.profile?.full_name || "User"}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < (rev.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{rev.review}</p>
                        {rev.reply && (
                          <div className="flex items-start gap-2 p-3 mt-2 text-sm border border-gray-200 rounded-lg bg-gray-50">
                            <Reply className="w-4 h-4 mt-1 text-gray-500" />
                            <div>
                              <p className="text-xs font-semibold text-gray-600">Instructor reply</p>
                              <p className="text-sm text-gray-700">{rev.reply}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: CURRICULUM SIDEBAR */}
        <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-gray-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:block ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full">
            <div className="p-5 bg-white border-b">
              <h2 className="text-lg font-bold text-gray-900">Course Content</h2>
              <p className="mt-1 text-xs text-gray-500">{modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} lessons total</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {modules.length === 0 ? <div className="p-8 text-sm text-center text-gray-400">No content available.</div> : modules.map((module, mIndex) => (
                <div key={module.id || mIndex} className="bg-white border-b border-gray-200">
                  <button onClick={() => toggleModule(module.id || mIndex)} className="flex items-center justify-between w-full p-4 text-left transition-colors group hover:bg-gray-50">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 transition-colors group-hover:text-blue-600">{module.title || `Module ${mIndex + 1}`}</h3>
                      <span className="text-xs text-gray-400">{module.lessons?.length || 0} lessons</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedModules[module.id || mIndex] ? "rotate-180" : ""}`} />
                  </button>
                  {expandedModules[module.id || mIndex] && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {module.lessons?.map((lesson, lIndex) => {
                        const isActive = currentLesson?.id === lesson.id;
                        let LessonIcon = Video;
                        let iconColor = "text-gray-400";
                        if (lesson.content_type === "quiz") { LessonIcon = HelpCircle; iconColor = "text-purple-500"; }
                        else if (lesson.content_type === "assignment") { LessonIcon = FileText; iconColor = "text-orange-500"; }
                        else if (lesson.content_type === "document") { LessonIcon = File; iconColor = "text-green-500"; }

                        return (
                          <button key={lesson.id || lIndex} onClick={() => handleLessonSelect(lesson)} className={`w-full flex items-start gap-3 p-3 pl-6 text-left hover:bg-white transition-all border-l-[3px] ${isActive ? "bg-white border-l-blue-600 shadow-sm" : "border-l-transparent"}`}>
                            <div className="mt-0.5"><LessonIcon size={16} className={isActive ? "text-blue-600" : iconColor} /></div>
                            <div className="flex-1">
                              <p className={`text-sm ${isActive ? "font-semibold text-blue-700" : "text-gray-600"}`}>{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {lesson.content_type === "video" && <span className="flex items-center gap-1 text-[10px] text-gray-400"><Play size={8} /> 10 min</span>}
                                <span className="text-[10px] text-gray-400 capitalize">{lesson.content_type}</span>
                              </div>
                            </div>
                            {lesson.completed && <CheckCircle2 size={14} className="mt-1 text-green-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
      </div>
    </div>
  );
};

export default CourseDetailView;