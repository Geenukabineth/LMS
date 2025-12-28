import api from "@/services/api";

export const userService = {
  getStudentsCount: async () => {
    const { data } = await api.get('lms/student/');
    return data?.count ?? 0;
  },

  getTeachersCount: async () => {
    const { data } = await api.get('lms/register/teacher/');
    return data?.count ?? 0;
  },

  getTeacherList: async () => {
    const { data } = await api.get('lms/register/teacher/');
    return data?.teachers ?? [];
  },

  getReceptionistsCount: async () => {
    const { data } = await api.get('lms/register/receptionist/');
    return data?.count ?? 0;
  },

  // Fixed: changed 'teacher' to 'results' to match API response structure
  postReceptionistList: async (formData) => {
    const { data } = await api.post('lms/receptionist/', formData);
    return data;
  },

  postTeacherList: async (formData) => {
    const { data } = await api.post('lms/register/teacher/', formData);
    return data;
  },

  getReceptionistList: async () => {
    const { data } = await api.get('lms/register/receptionist/');
    return data?.receptionists ?? [];
  },

  putTeacherList : async (id, formData) => {
    const { data } = await api.put(`lms/register/teacher/${id}/`, formData);
    return data;
  },

  putReceptionistList : async (id, formData) => {
    const { data } = await api.put(`lms/receptionist/${id}/`, formData);
    return data;
  },

  deleteTeacherList : async (id) => {
    const { data } = await api.delete(`lms/teacher/delete/${id}/`);
    return data;
  },

  deleteReceptionistList : async (id) => {
    const { data } = await api.delete(`lms/receptionist/delete/${id}/`);
    return data;
  },


  getTeacherdata: async (id) => {
    const { data } = await api.get(`lms/register/teacher/${id}/`);
    return data;
  },

  getuseractivity: async () => {
    const { data } = await api.get('lms/dashboard/user-activity/');
    return data?.activities ?? [];
  },

 getUserProfile: async () => {
  try {
    const { data } = await api.get("/lms/user/me/");
    return data; // ✅ return full user object
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
},

  getUser: async (id) => {
    const { data } = await api.get(`lms/user/${id}/`);
    return data;
  },
  getUserList: async () => {
    const { data } = await api.get('lms/user/');
    return data?.users ?? [];
  },
  USER_SEARCH : async (params = {}) => {
          const response = await api.get('lms/user/', { params });
          return response.data;
  },


  getteachercoursestudents: async () => {
    const { data } = await api.get(`Course/teacher/courses/`);    
   
    if (data?.results && Array.isArray(data.results)) {
        // Use reduce to sum up the student_count from every course object
        const totalStudents = data.results.reduce((sum, course) => {
            return sum + (course.student_count || 0);
        }, 0);
        
        return totalStudents;
    }    
    return 0; 
}





};