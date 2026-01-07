from django.urls import path

from .views import (
    AssignmentDetailAPIView,
    GradeSubmissionAPIView,
    QuizDetailAPIView,
    QuizListCreateAPIView,
    QuizQuestionDetailAPIView,
    QuizQuestionListCreateAPIView,
    SearchCourseAPIView,
    CourseDetailAPIView,
    CourseCreateAPIView,
    CourseUpdateAPIView,
    CourseDestroyAPIView,
    EnrollCourseAPIView,
    AdminCourseListAPIView,
    FileUploadAPIView,
    AdminCourseCreateAPIView,
    TeacherCourseAssignmentAPIView,
    CourseTeacherListAPIView,
    EnrolledCourseListAPIView,
    EnrollmentListAPIView,
    EnrollmentDetailAPIView,
    EnrollmentCreateAPIView,
    BulkEnrollmentCreateAPIView,
    EnrollmentExpiringAPIView,
    StudentEnrolledCoursesListAPIView,
    StudentEnrolledCourseDetailAPIView,
    StudentCourseProgressAPIView,
    StudentCourseLessonsAPIView,
    StudentCourseModulesAPIView,
    ModuleAPIView,
    LessonCreateAPIView,
    EnrollmentDashboardStats,
    CourseDistributionAPIView,
    TeacherGradingListAPIView,
    TeacherStudentEnrollmentListAPIView,
    TeacherDashboardStatsAPIView,
    AssignmentListCreateAPIView,
    StudentDashboardStatsAPIView,
    SubmitAssignmentAPIView,
    SubmitQuizAPIView,
)

urlpatterns = [
    # Public
    path('courses/search/', SearchCourseAPIView.as_view(), name='course-search'),
    path("courses/", SearchCourseAPIView.as_view(), name="course-list"),
    path('courses/<slug:slug>/', CourseDetailAPIView.as_view(), name='course-detail'),

    # Admin course create
    path('admin/courses/create/', AdminCourseCreateAPIView.as_view(), name='admin-course-create'),

    # Teacher assignment workflow
    path('teacher/courses/assignments/', TeacherCourseAssignmentAPIView.as_view(), name='teacher-course-assignment'), 
    path("teacher/courses/", CourseTeacherListAPIView.as_view(), name="teacher-course-list"),    # Teacher create course
    path("teacher/courses/create/", CourseCreateAPIView.as_view(), name="teacher-course-create"),    # Teacher update course (by id)
    path("teacher/courses/<int:id>/update/", CourseUpdateAPIView.as_view(), name="teacher-course-update"),    # Teacher delete course (by id)
   
    path("teacher/courses/assignments/", TeacherCourseAssignmentAPIView.as_view(), name="teacher-course-assignments"),    # Teacher create module (for their course)
    path("teacher/modules/", ModuleAPIView.as_view(), name="teacher-module-create"),    # Teacher create lesson (for their module)
    path("teacher/modules/<int:course_id>/", ModuleAPIView.as_view(), name="teacher-module-update"),    # Teacher update module (for their course)
    path("teacher/lessons/<int:course_id>/", LessonCreateAPIView.as_view(), name="teacher-lesson-create-for-module"),    # Teacher create lesson (for their course)
    path("teacher/lessons/create/", LessonCreateAPIView.as_view(), name="teacher-lesson-create"),

    # Teacher list
    path('courses/teacher/list/', CourseTeacherListAPIView.as_view(), name='course-teacher-list'),

    # Teacher CRUD (older)
    path('create/courses/', CourseCreateAPIView.as_view(), name='course-create'),
    path('courses/edit/<int:id>/', CourseUpdateAPIView.as_view(), name='course-edit-id'),
    path('courses/edit/<slug:slug>/', CourseUpdateAPIView.as_view(), name='course-edit-slug'),
    path('courses/delete/<int:id>/', CourseDestroyAPIView.as_view(), name='course-delete-id'),
    path('courses/delete/<slug:slug>/', CourseDestroyAPIView.as_view(), name='course-delete-slug'),

    # Admin list/update/delete (same endpoint with different methods)
    path('courses/list/admin/', AdminCourseListAPIView.as_view(), name='course-list-admin'),
    path('courses/list/admin/<int:course_id>/', AdminCourseListAPIView.as_view(), name='course-list-admin-course'),

    # Student enroll (paid or free logic)
    path('courses/enroll/<slug:course_slug>/', EnrollCourseAPIView.as_view(), name='course-enroll'),

    # Student enrolled list (legacy)
    path('courses/student/enrolled/', EnrolledCourseListAPIView.as_view(), name='course-student-enrolled'),

    # Student portal endpoints
    path('student/enrolled-courses/', StudentEnrolledCoursesListAPIView.as_view(), name='student-enrolled-courses-list'),
    path('student/enrolled-courses/<int:course_id>/', StudentEnrolledCourseDetailAPIView.as_view(), name='student-enrolled-course-detail'),
    path('student/enrolled-courses/<int:course_id>/progress/', StudentCourseProgressAPIView.as_view(), name='student-course-progress'),
    path('student/enrolled-courses/<int:course_id>/lessons/', StudentCourseLessonsAPIView.as_view(), name='student-course-lessons'),
    path('student/enrolled-courses/<int:course_id>/modules/', StudentCourseModulesAPIView.as_view(), name='student-course-modules'),

    # Upload
    path('path/upload/', FileUploadAPIView.as_view(), name='file-upload'),

    # Enrollment management (admin/receptionist)
    path('enrollments/', EnrollmentListAPIView.as_view(), name='enrollment-list'),
    path('enrollments/<int:id>/', EnrollmentDetailAPIView.as_view(), name='enrollment-detail'),
    path('enrollments/create/', EnrollmentCreateAPIView.as_view(), name='enrollment-create'),
    path('enrollments/bulk/', BulkEnrollmentCreateAPIView.as_view(), name='enrollment-bulk-create'),
    path('enrollments/expiring/', EnrollmentExpiringAPIView.as_view(), name='enrollment-expiring'),

    # Modules/Lessons
    path('modules/create/', ModuleAPIView.as_view(), name='module-create'),
    path('modules/<int:id>/', ModuleAPIView.as_view(), name='module-detail'),
    path('lessons/create/', LessonCreateAPIView.as_view(), name='lesson-create'),
    path('lessons/<int:id>/', LessonCreateAPIView.as_view(), name='lesson-detail'),

    # Dashboard stats
    path('dashboard/enrollment-stats/', EnrollmentDashboardStats.as_view(), name='enrollment-stats'),
    path('dashboard/course-distribution/', CourseDistributionAPIView.as_view(), name='course-distribution'),
    path('teacher/student-enrollments/', TeacherStudentEnrollmentListAPIView.as_view(), name='teacher-student-enrollments'),
    path('teacher/dashboard/stats/', TeacherDashboardStatsAPIView.as_view(), name='teacher-dashboard-stats'),


    path("teacher/assignments/", AssignmentListCreateAPIView.as_view()),
    path("teacher/assignments/<int:pk>/", AssignmentDetailAPIView.as_view()),

    path("teacher/quizzes/", QuizListCreateAPIView.as_view()),
    path("teacher/quizzes/<int:pk>/", QuizDetailAPIView.as_view()),
    path('student/assignment/submit/', SubmitAssignmentAPIView.as_view(), name='submit-assignment'),
    path('student/quiz/submit/', SubmitQuizAPIView.as_view(), name='submit-quiz'),
    path('teacher/submissions/', TeacherGradingListAPIView.as_view(), name='teacher-submissions'),
    path('teacher/grade/assignment/<int:pk>/', GradeSubmissionAPIView.as_view(), name='grade-assignment'),

    path("teacher/quiz-questions/", QuizQuestionListCreateAPIView.as_view()),
    path("teacher/quiz-questions/<int:pk>/", QuizQuestionDetailAPIView.as_view()),
    path('student/dashboard/stats/', StudentDashboardStatsAPIView.as_view(), name='student-dashboard-stats'),


]

