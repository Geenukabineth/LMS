export const API_BASE_COURSE_URL = 'http://localhost:8000/';

export const API_COURSE_ENDPOINTS = {
  CREATE_MODULE: `${API_BASE_COURSE_URL}Course/module/create/`,
  CREATE_LESSON: `${API_BASE_COURSE_URL}Course/lesson/create/`,
  COURSE_LIST: `${API_BASE_COURSE_URL}Course/courses/list/count/admin/`,  // ✅ Match your actual backend
};