export const API_BASE_URL = 'http://localhost:8000/lms/'; // ⬅️ Adjusted URL to include /lms/ for consistency with authService.jsx and original usage (e.g., /lms/register/teacher/)


export const API_USER_ENDPOINTS = {
  STUDENT_LIST: `${API_BASE_URL}student/`,
  TEACHER_LIST: `${API_BASE_URL}register/teacher/`,
  RECEPTIONIST_LIST: `${API_BASE_URL}register/receptionist/`,
  USER_DETAIL: (id) => `${API_BASE_URL}user/${id}/`, 
  USER_SEARCH: `${API_BASE_URL}user/search/`,
  WebsiteTrafficAPIView: `${API_BASE_URL}website-traffic/`,
};