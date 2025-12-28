import React, { useEffect, useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';

const StudentData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeacherStudents();
  }, []);

  const fetchTeacherStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken'); 

      const response = await fetch('http://127.0.0.1:8000/Course/teacher/student-enrollments/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const enrollments = await response.json();

      const studentsMap = {};

      enrollments.forEach((enrollment) => {
        const studentId = enrollment.user; 

        if (!studentsMap[studentId]) {
          studentsMap[studentId] = {
            id: studentId,
            username: enrollment.student_name, 
            email: enrollment.student_email,   
            image: enrollment.user.image,      
            enrollments: []                    
          };
        }

        // ✅ FIX: Store started_at and ended_at exactly as they come from API
        studentsMap[studentId].enrollments.push({
          title: enrollment.course_title,
          status: enrollment.status,
          started_at: enrollment.started_at, 
          ended_at: enrollment.ended_at      
        });
      });

      setStudents(Object.values(studentsMap));

    } catch (error) {
      console.error("Error fetching students:", error);
      setError(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const allAvailableCourses = useMemo(() => {
    const titles = new Set();
    students.forEach(student => {
      student.enrollments.forEach(c => titles.add(c.title));
    });
    return ['All', ...Array.from(titles)].sort();
  }, [students]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      (student.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesCourse = selectedCourse === 'All' || student.enrollments.some(c => c.title === selectedCourse);

    return matchesSearch && matchesCourse;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading student data...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="p-8 mb-8 text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="text-4xl font-bold">My Students</h1>
          <p className="text-blue-100">Manage students enrolled in your courses</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
            <input
              type="text"
              placeholder="Search by student name or email..."
              className="w-full py-3 pl-10 pr-4 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
            <select
              className="w-full py-3 pl-10 pr-4 bg-white border border-gray-300 rounded-lg outline-none appearance-none focus:ring-2 focus:ring-blue-500"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {allAvailableCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase">Student</th>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase">Enrolled Courses</th>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase">Start Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase">End Date</th>
                {/* ❌ REMOVED Actions Header */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{student.username}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {student.enrollments.map((course, i) => (
                          <span 
                            key={i} 
                            className={`px-2 py-1 text-[11px] rounded-md border w-fit ${
                                course.status === 'active' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {course.title}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* ✅ ADDED Start Date (Mapped for each course) */}
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-2 text-sm text-gray-500">
                        {student.enrollments.map((course, i) => (
                            <span key={i} className="h-[26px] flex items-center">
                                {course.started_at ? new Date(course.started_at).toLocaleDateString() : 'N/A'}
                            </span>
                        ))}
                       </div>
                    </td>
                    {/* ✅ ADDED End Date (Mapped for each course) */}
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-2 text-sm text-gray-500">
                        {student.enrollments.map((course, i) => (
                            <span key={i} className="h-[26px] flex items-center">
                                {course.ended_at ? new Date(course.ended_at).toLocaleDateString() : 'N/A'}
                            </span>
                        ))}
                       </div>
                    </td>
                    {/* ❌ REMOVED Actions Cell */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentData;