import api from "@/services/api";

export const courseService = {

  getdashborddata: async () => {
    const { data } = await api.get('Course/teacher/dashboard/stats/');    
    return data;
  },

  getCoursesCount: async () => {
    const { data } = await api.get('Course/courses/list/admin/');
    return data?.course_count ?? 0;
  },

  // ✅ FIXED: Matches 'courses' (lowercase) in backend JSON
  getCoursesList: async () => {
    const { data } = await api.get('Course/courses/list/admin/');
    return data?.courses ?? [];
  },

  postCoursesList: async (formData) => {
    const { data } = await api.post('Course/courses/list/admin/', formData);
    return data;
  },

  putCoursesList : async (courseId, formData) => {
    const { data } = await api.put(`Course/courses/list/admin/${courseId}/`, formData);
    return data;
  },

  deleteCoursesList : async (id) => {
    const { data } = await api.delete(`Course/courses/list/admin/${id}/`);
    return data;
  },

  getEnrollmentStats: async () => {
    const { data } = await api.get('Course/dashboard/enrollment-stats/');    
    
    const rawData = data?.top_courses ?? [];
    
    return rawData.map(item => ({
      course: item.course__title,
      enrolled: item.total
    }));
  },

  getCourseDistribution: async () => {
    const { data } = await api.get('Course/dashboard/course-distribution/');
    return data ?? [];
  },

  getCoursesCountteacher: async () => {
    const { data } = await api.get('Course/teacher/courses/');
    return data?.count ?? 0;
    
  },
  getCoursesteacher: async () => {
    const { data } = await api.get('Course/courses/teacher/list/');
    return data?.results ?? data ?? [];
  },

  getCourseteacherdetails: async (courseId) => {
    const { data } = await api.get(`Course/courses/teacher/${courseId}/`);
    return data;
  },

  getCourseteacherModules: async (courseId) => {
  const { data } = await api.get(`Course/teacher/modules/${courseId}/`);
  return data;
},

// PUT: update module (send module_id + fields)
  putCourseModules: async (module_id, formData) => {
    const { data } = await api.put(`Course/teacher/modules/${module_id}/`, formData);
    return data;
  },

  // POST: create module (send course_id or course)
  postCourseModules: async (formData) => {
    const { data } = await api.post(`Course/teacher/modules/`, formData);
    return data;
  },

  // DELETE: delete module (send module_id)
  deleteCourseModules: async (moduleId) => {
    const { data } = await api.delete(`Course/teacher/modules/${moduleId}/`);
    return data;
  },

  postCourseLessons: async (payload) => {
  // payload must be FormData
  const { data } = await api.post(`Course/teacher/lessons/create/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
},

putCourseLessons: async (lessonId, payload) => {
  // payload must be FormData (or FormParser)
  const { data } = await api.put(`Course/lessons/${lessonId}/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
},

deleteCourseLessons: async (lessonId) => {
  const { data } = await api.delete(`Course/lessons/${lessonId}/`);
  return data;
},
// -------------------- ASSIGNMENT CRUD --------------------
getAssignments: async (lessonId) => {
  const { data } = await api.get(`Course/teacher/assignments/`, {
    params: { lesson: lessonId },
  });
  return data;
},

postAssignment: async (payload) => {
  // payload: FormData (supports file)
  const { data } = await api.post(`Course/teacher/assignments/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
},

putAssignment: async (assignmentId, payload) => {
  const { data } = await api.put(`Course/teacher/assignments/${assignmentId}/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
},

deleteAssignment: async (assignmentId) => {
  const { data } = await api.delete(`Course/teacher/assignments/${assignmentId}/`);
  return data;
},

// -------------------- QUIZ CRUD --------------------
getQuizzes: async (lessonId) => {
  const { data } = await api.get(`Course/teacher/quizzes/`, {
    params: { lesson: lessonId },
  });
  return data;
},

postQuiz: async (payload) => {
  const { data } = await api.post(`Course/teacher/quizzes/`, payload);
  return data;
},

putQuiz: async (quizId, payload) => {
  const { data } = await api.put(`Course/teacher/quizzes/${quizId}/`, payload);
  return data;
},

deleteQuiz: async (quizId) => {
  const { data } = await api.delete(`Course/teacher/quizzes/${quizId}/`);
  return data;
},

// -------------------- QUIZ QUESTIONS CRUD --------------------
getQuizQuestions: async (quizId) => {
  const { data } = await api.get(`Course/teacher/quiz-questions/`, {
    params: { quiz: quizId },
  });
  return data;
},

postQuizQuestion: async (payload) => {
  const { data } = await api.post(`Course/teacher/quiz-questions/`, payload);
  return data;
},

putQuizQuestion: async (questionId, payload) => {
  const { data } = await api.put(`Course/teacher/quiz-questions/${questionId}/`, payload);
  return data;
},

deleteQuizQuestion: async (questionId) => {
  const { data } = await api.delete(`Course/teacher/quiz-questions/${questionId}/`);
  return data;
},
getStudentDashboardStats: async () => {
    const { data } = await api.get('Course/student/dashboard/stats/');
    return data;
  },

  
  
  createLesson: async (formData) => {
    const response = await api.post("Course/lessons/create/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // --- NEW: Assessment Creation (Teacher) ---
  createAssignment: async (formData) => {
    const response = await api.post("Course/teacher/assignments/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  createQuiz: async (data) => {
    const response = await api.post("Course/teacher/quizzes/", data);
    return response.data;
  },

  createQuizQuestion: async (data) => {
    const response = await api.post("Course/teacher/quiz-questions/", data);
    return response.data;
  },

  // --- NEW: Student Actions ---
  getQuizDetail: async (quizId) => {
    const response = await api.get(`Course/teacher/quizzes/${quizId}/`);
    return response.data;
  },

  submitQuizAttempt: async (data) => {
    const response = await api.post("Course/student/quiz/submit/", data);
    return response.data;
  },

  getAssignmentDetail: async (assignmentId) => {
    const response = await api.get(`Course/teacher/assignments/${assignmentId}/`);
    return response.data;
  },

  submitAssignment: async (formData) => {
    const response = await api.post("Course/student/assignment/submit/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // --- NEW: Grading (Teacher) ---
  getSubmissions: async (assignmentId) => {
    const response = await api.get(`Course/teacher/submissions/?assignment_id=${assignmentId}`);
    return response.data;
  },

  gradeSubmission: async (submissionId, data) => {
    const response = await api.patch(`Course/teacher/grade/assignment/${submissionId}/`, data);
    return response.data;
  },
getStudentCourseDetail: async (courseId) => {
    // Matches: path('student/enrolled-courses/<int:course_id>/', ...)
    const { data } = await api.get(`Course/student/enrolled-courses/${courseId}/`);
    return data;
  },

  getStudentCourseModules: async (courseId) => {
    // Matches: path('student/enrolled-courses/<int:course_id>/modules/', ...)
    const { data } = await api.get(`Course/student/enrolled-courses/${courseId}/modules/`);
    return data;
  },

  getStudentCourseProgress: async (courseId) => {
    // Matches: path('student/enrolled-courses/<int:course_id>/progress/', ...)
    const { data } = await api.get(`Course/student/enrolled-courses/${courseId}/progress/`);
    return data;
  },

  getAssignments: async (filterId, type = 'lesson') => {
    const params = {};
    if (type === 'course') {
        params.course = filterId;
    } else {
        params.lesson = filterId;
    }

    const { data } = await api.get(`Course/teacher/assignments/`, { params });
    return data;
  },

  deleteAssignment: async (assignmentId) => {
    const { data } = await api.delete(`Course/teacher/assignments/${assignmentId}/`);
    return data;
  },

  // -------------------- QUIZ CRUD --------------------
  getQuizzes: async (filterId, type = 'lesson') => {
    const params = {};
    if (type === 'course') {
        params.course = filterId;
    } else {
        params.lesson = filterId;
    }

    const { data } = await api.get(`Course/teacher/quizzes/`, { params });
    return data;
  },

  deleteQuiz: async (quizId) => {
    const { data } = await api.delete(`Course/teacher/quizzes/${quizId}/`);
    return data;
  },

updateCourseFeedback(courseId, feedbackId, payload) {
  // payload example: { title: "updated text" }
  return api.put(`Course/student/enrolled-courses/${courseId}/feedback/${feedbackId}/`, payload);
},

deleteCourseFeedback(courseId, feedbackId) {
  return api.delete(`Course/student/enrolled-courses/${courseId}/feedback/${feedbackId}/`);
},

getCourseComplaints(courseId) {
  return api.get(`Course/student/enrolled-courses/${courseId}/complaints/`);
},

createCourseComplaint(courseId, payload) {
  // payload example: { title: "...", description: "...", priority: "low|medium|high" }
  return api.post(`Course/student/enrolled-courses/${courseId}/complaints/`, payload);
},

updateCourseComplaint: (courseId, complaintId, payload) => {
    // Note: The courseId param is kept for consistency, but the backend uses complaintId (pk)
    return api.put(`Course/complaints/${complaintId}/`, payload);
  },

deleteCourseComplaint: (courseId, complaintId) => {
    return api.delete(`Course/complaints/${complaintId}/`);
  },
  getTeacherComplaints(courseId) {
    return api.get(`Course/student/enrolled-courses/${courseId}/complaints/`);
  },
  
  // Teacher Reply (Updates the complaint)
  updateTeacherComplaint(courseId, complaintId, payload) {
    // Uses the generic update endpoint which handles replies
    return api.put(`Course/complaints/${complaintId}/`, payload);
  },
  
  // Teacher Create (Unlikely used, but kept for compatibility)
  createTeacherComplaint(courseId, payload) {
    return api.post(`Course/student/enrolled-courses/${courseId}/complaints/`, payload);
  },
  
  // Teacher Delete
  deleteTeacherComplaint(courseId, complaintId) {
    return api.delete(`Course/complaints/${complaintId}/`);
  },


  // 2. FEEDBACK (Teacher View)
  getTeacherFeedback(courseId) {
    return api.get(`Course/student/enrolled-courses/${courseId}/feedback/`);
  },
  
  createTeacherFeedback(courseId, payload) {
    return api.post(`Course/student/enrolled-courses/${courseId}/feedback/`, payload);
  },
  
  updateTeacherFeedback: async (courseId, feedbackId, payload) => {
    // Note: feedback.jsx might pass courseId, but the endpoint usually just needs feedbackId (pk)
    // We ignore courseId here if the backend route is /student/feedback/<pk>/
    const { data } = await api.put(`Course/student/feedback/${feedbackId}/`, payload);
    return data;
  },
  
  deleteTeacherFeedback: async (courseId, feedbackId) => {
    const { data } = await api.delete(`Course/student/feedback/${feedbackId}/`);
    return data;
  },

  // ... (Keep existing methods like getStudentEnrolledCourses) ...
  getStudentEnrolledCourses: async () => {
    const { data } = await api.get("Course/student/enrolled-courses/");
    return data;
  },

  // ⭐ FIXED VERSION
getCourseReviews: async (courseId) => {
  return await api.get(`Course/student/enrolled-courses/${courseId}/reviews/`);
},

submitCourseReview: async (courseId, payload) => {
  return await api.post(`Course/student/enrolled-courses/${courseId}/reviews/`, payload);
},
updateCourseReview: async (reviewId, payload) => {
    // payload: { rating: 5, review: "Updated text" }
    const { data } = await api.put(`Course/student/review/${reviewId}/`, payload);
    return data;
  },

  deleteCourseReview: async (reviewId) => {
    const { data } = await api.delete(`Course/student/review/${reviewId}/`);
    return data;
  },

  // FEEDBACK / COMPLAINING
  getCourseFeedback(courseId) {
    return api.get(`Course/student/enrolled-courses/${courseId}/feedback/`);
  },
  createCourseFeedback(courseId, payload) {
    // payload: { title: "Complaint about ..."}
    return api.post(`Course/student/enrolled-courses/${courseId}/feedback/`, payload);
  },
  updateCourseFeedback: async (feedbackId, payload) => {
    // payload: { title: "Updated Title" }
    const { data } = await api.put(`Course/student/feedback/${feedbackId}/`, payload);
    return data;
  },

  // ✅ ADD THIS: Delete Feedback
  deleteCourseFeedback: async (feedbackId) => {
    const { data } = await api.delete(`Course/student/feedback/${feedbackId}/`);
    return data;
  },
  createLiveSession: async (payload) => {
    // Payload: { course_id, title, date, time }
    const { data } = await api.post(`Course/live/create/`, payload);
    return data;
  },
  updateLiveSession: async (sessionId, payload) => {
    const { data } = await api.put(`Course/live/session/${sessionId}/`, payload);
    return data;
  },

  // ✅ ADD THIS: Delete Live Session
  deleteLiveSession: async (sessionId) => {
    const { data } = await api.delete(`Course/live/session/${sessionId}/`);
    return data;
  },

  getLiveSessions: async (courseId) => {
    const { data } = await api.get(`Course/live/list/${courseId}/`);
    return data;
  },

  joinSessionAndMarkAttendance: async (sessionId) => {
    const { data } = await api.post(`Course/live/join/`, { session_id: sessionId });
    return data; // Returns { join_url: "..." }
  },
  
getStudentEnrolledCourses: async () => {
  
    const { data } = await api.get("Course/student/enrolled-courses/");
    return data;
  },
  getPlagiarismReports: async () => {
    // Endpoint: /Course/teacher/plagiarism-reports/
    const { data } = await api.get('Course/teacher/plagiarism-reports/');
    
    // Fix: Backend returns { count: ..., results: [...] } due to pagination.
    // We must return data.results if it exists, otherwise data (if it's already an array), or an empty array.
    return data?.results ?? data ?? []; 
  },

  updatePlagiarismReportAction: async (reportId, payload) => {
    const { data } = await api.post(`Course/teacher/plagiarism-reports/${reportId}/action/`, payload);
    return data;
  },
  getTeacherGradebook: async (courseId) => {
    // Matches the URL in your urls.py
    const { data } = await api.get(`Course/teacher/courses/${courseId}/gradebook/`);
    return data;
  },
  getAdminAllComplaints: async () => {
    const { data } = await api.get('Course/admin/complaints/all/');
    return data;
  },

  getAdminAllFeedback: async () => {
    const { data } = await api.get('Course/admin/feedback/all/');
    return data;
  },

  getEnrolledCourses: async (params = {}) => {
    try {
      // Pass params (status, search) directly to the api call
      const response = await api.get("Course/student/enrolled-courses/", { params });
      const data = response.data;

      // Handle different pagination/response structures centrally here
      if (Array.isArray(data)) return data;
      if (data?.results && Array.isArray(data.results)) return data.results;
      if (data?.data && Array.isArray(data.data)) return data.data;
      
      return [];
    } catch (error) {
      console.error("❌ Error fetching enrolled courses:", error);
      throw error;
    }
  },

  /**
   * Get details for a specific enrolled course
   */
  getEnrolledCourseDetail: async (courseId) => {
    const response = await api.get(`Course/student/enrolled-courses/${courseId}/`);
    return response.data;
  },

  /**
   * Get progress for a specific course
   */
  getCourseProgress: async (courseId) => {
    const response = await api.get(`Course/student/enrolled-courses/${courseId}/progress/`);
    return response.data;
  },

  /**
   * Get lessons for a specific course
   */
  getCourseLessons: async (courseId) => {
    const response = await api.get(`Course/student/enrolled-courses/${courseId}/lessons/`);
    return response.data;
  },

  /**
   * Get modules for a specific course
   */
  getCourseModules: async (courseId) => {
    const response = await api.get(`Course/student/enrolled-courses/${courseId}/modules/`);
    return response.data;
  },
  searchCourses: async (params = {}) => {
    // The api wrapper automatically handles query string serialization for 'params'
    const response = await api.get("Course/courses/search/", { params });
    return response.data;
  },
  
  // Helper to standardise the response list (handles { results: [] } vs [])
  extractCourseList: (data) => {
     if (Array.isArray(data)) return data;
     if (data?.results) return data.results;
     if (data?.courses) return data.courses;
     return [];
  },
  getReceptionistStudents: async () => {
    const { data } = await api.get("lms/register/receptionist/student/list/");
    return data;
  },

  getEnrollments: async (params = {}) => {
    // params can be { student_id: 123 }
    const { data } = await api.get("Course/enrollments/", { params });
    return data;
  },

  getCourses: async () => {
    const { data } = await api.get("course/list/"); 
    return data;
  },

  enrollStudent: async (payload) => {
    const { data } = await api.post("Course/enroll/", payload);
    return data;
  },

  createEnrollment: async (payload) => {
    const { data } = await api.post("Course/enrollments/create/", payload);
    return data;
  },

  // ✅ NEW: Extend Enrollment (PUT)
  // Maps to: path('enrollments/<int:id>/', ...) which is EnrollmentDetailAPIView
  updateEnrollment: async (enrollmentId, payload) => {
    const { data } = await api.put(`Course/enrollments/${enrollmentId}/`, payload);
    return data;
  },

  // ✅ NEW: Revoke Enrollment (DELETE)
  deleteEnrollment: async (enrollmentId) => {
    const { data } = await api.delete(`Course/enrollments/${enrollmentId}/`);
    return data;
  },
  getCoursesByLevel: async (level) => {
    
    const { data } = await api.get('Course/courses/search/', { 
      params: { level: level } 
    });
    return data;
  },
 




};