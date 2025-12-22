import api from "@/services/api";

export const courseService = {
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
  }
};