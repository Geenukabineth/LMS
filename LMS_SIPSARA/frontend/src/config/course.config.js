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
    return data?.results ?? [];
  },

  getCourseteacherdetails: async (courseId) => {
    const { data } = await api.get(`Course/courses/teacher/${courseId}/`);
    return data;
  },

  getCourseModules: async (courseId) => {
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

  // --- Existing Methods ---
  getCourseModules: async (courseId) => {
    const response = await api.get(`Course/teacher/modules/${courseId}/`);
    return response.data;
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
 




};