export const API_BASE_URL = 'http://localhost:8000/';


export const API_USER_ENDPOINTS = {
  STUDENT_LIST: `${API_BASE_URL}lms/student/`,
  TEACHER_LIST: `${API_BASE_URL}lms/register/teacher/`,
  RECEPTIONIST_LIST: `${API_BASE_URL}lms/register/receptionist/`,
  USER_DETAIL: (id) => `${API_BASE_URL}/lms/user/${id}/`,
  USER_SEARCH: `${API_BASE_URL}/lms/user/search/`,
  WebsiteTrafficAPIView: `${API_BASE_URL}lms/website-traffic/`,
};