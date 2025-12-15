from django.urls import path

from .views import (

    SearchCourseAPIView,
    CourseDetailAPIView,
    CourseCreateAPIView,
    CourseUpdateAPIView,
    CourseDestroyAPIView,
    EnrollCourseAPIView,
    AdminCourseListCountAPIView,
    FileUploadAPIView,
    AdminCourseCreateAPIView,
    TeacherCourseAssignmentAPIView,
    CourseTeacherListAPIView,
    EnrolledCourseListAPIView,
    CoursesByLevelAPIView,
    TeacherCoursesAPIView,
    TeacherCourseCountAPIView,
    TeacherCourseDetailAPIView,
    EnrollmentListAPIView,
    EnrollmentDetailAPIView,
    EnrollmentCreateAPIView,
    BulkEnrollmentCreateAPIView,
    EnrollmentUpdateAPIView,
    EnrollmentDestroyAPIView,
    StudentEnrollmentsAPIView,
    EnrollmentExpiringAPIView,
    # ✅ NEW: Student Portal Endpoints
    StudentEnrolledCoursesListAPIView,
    StudentEnrolledCourseDetailAPIView,
    StudentCourseProgressAPIView,
    StudentCourseLessonsAPIView,
    StudentCourseModulesAPIView,
    ModuleAPIView,
    LessonCreateAPIView
)

 

urlpatterns = [

    # --- Public Course Endpoints ---

    path('courses/search/', SearchCourseAPIView.as_view(), name='course-search'),

    path('courses/<slug:slug>/', CourseDetailAPIView.as_view(), name='course-detail'),

   

    # ✅ NEW: Admin course creation endpoint

    path('admin/courses/create/', AdminCourseCreateAPIView.as_view(), name='admin-course-create'),

   

    # ✅ NEW: Teacher course assignment workflow

    path('teacher/courses/assignments/', TeacherCourseAssignmentAPIView.as_view(), name='teacher-course-assignment'),

   

    # ✅ NEW: Teacher course count endpoint (FIXED - use this for teacher dashboard)

    path('courses/teacher/count/', TeacherCourseCountAPIView.as_view(), name='teacher-course-count'),

    path('teacher/courses/<int:course_id>/', TeacherCourseDetailAPIView.as_view(), name='teacher-course-count'),

   

    # --- Teacher/Management Endpoints (Authenticated) ---

    path('create/courses/', CourseCreateAPIView.as_view(), name='course-create'),

   

    # Teacher's list of assigned courses

    path('courses/teacher/list/', CourseTeacherListAPIView.as_view(), name='course-teacher-list'),

 
    # ============================================================================
    # ✅ NEW: STUDENT PORTAL COURSE ENDPOINTS - EnrolledCourse Integration
    # ============================================================================
    
    # Get all enrolled courses for authenticated student (Dashboard)
    path('student/enrolled-courses/', StudentEnrolledCoursesListAPIView.as_view(), 
         name='student-enrolled-courses-list'),
    
    # Get specific enrolled course details (Course Detail Page)
    path('student/enrolled-courses/<int:course_id>/', StudentEnrolledCourseDetailAPIView.as_view(), 
         name='student-enrolled-course-detail'),
    
    # Get course progress for student (Progress Bar, Completion %)
    path('student/enrolled-courses/<int:course_id>/progress/', StudentCourseProgressAPIView.as_view(), 
         name='student-course-progress'),
    
    # Get all lessons in enrolled course with completion status
    path('student/enrolled-courses/<int:course_id>/lessons/', StudentCourseLessonsAPIView.as_view(), 
         name='student-course-lessons'),
    
    # Get all modules in enrolled course with lesson breakdown
    path('student/enrolled-courses/<int:course_id>/modules/', StudentCourseModulesAPIView.as_view(), 
         name='student-course-modules'),

    # ============================================================================
    # ✅ EXISTING: Admin course list
    # ============================================================================

    path('courses/list/', AdminCourseListCountAPIView.as_view(), name='course-list-short'),

    path('courses/list/admin/', AdminCourseListCountAPIView.as_view(), name='course-list'),

   

    # FIXED: Course edit and delete - now support both slug and id

    path('courses/edit/<int:id>/', CourseUpdateAPIView.as_view(), name='course-edit-id'),

    path('courses/edit/<slug:slug>/', CourseUpdateAPIView.as_view(), name='course-edit-slug'),

    path('courses/delete/<int:id>/', CourseDestroyAPIView.as_view(), name='course-delete-id'),

    path('courses/delete/<slug:slug>/', CourseDestroyAPIView.as_view(), name='course-delete-slug'),

   

    # Course count

    path('courses/list/count/admin/', AdminCourseListCountAPIView.as_view(), name='course-count'),

   

    # --- Student/Enrollment Endpoints (Authenticated) ---

   

    # Student's list of enrolled courses

    path('courses/student/enrolled/', EnrolledCourseListAPIView.as_view(), name='course-student-enrolled'),

   

    path('courses/enroll/<slug:course_slug>/', EnrollCourseAPIView.as_view(), name='course-enroll'),

   

    # --- Utility Endpoints ---

    path('path/upload/', FileUploadAPIView.as_view(), name='file-upload'),

    path('list_by_level/', CoursesByLevelAPIView.as_view(), name='course-list-by-level'),

 

    # Teacher-specific courses

    path('courses/teacher/<slug:slug>/', TeacherCoursesAPIView.as_view(), name='teacher-courses'),

    path('courses/count/', TeacherCoursesAPIView.as_view(), name='teacher-courses-count'),

    # List all enrollments with filtering
    path('enrollments/', EnrollmentListAPIView.as_view(), name='enrollment-list'),
    
    # Get specific enrollment details
    path('enrollments/<int:id>/', EnrollmentDetailAPIView.as_view(), name='enrollment-detail'),
    
    # Create single enrollment
    path('enrollments/create/', EnrollmentCreateAPIView.as_view(), name='enrollment-create'),
    
    # Bulk enroll multiple students
    path('enrollments/bulk/', BulkEnrollmentCreateAPIView.as_view(), name='enrollment-bulk-create'),
    
    # Update enrollment (extend access, change status)
    path('enrollments/<int:id>/update/', EnrollmentUpdateAPIView.as_view(), name='enrollment-update'),
    
    # Delete/revoke enrollment
    path('enrollments/<int:id>/delete/', EnrollmentDestroyAPIView.as_view(), name='enrollment-delete'),
    
    # Get specific student's enrollments
    path('students/<int:student_id>/enrollments/', StudentEnrollmentsAPIView.as_view(), name='student-enrollments'),
    
    # Get enrollments expiring soon
    path('enrollments/expiring/', EnrollmentExpiringAPIView.as_view(), name='enrollment-expiring'),


    path('modules/create/', ModuleAPIView.as_view(), name='module-create'),   
    
    # Lesson creation
    path('lessons/create/', LessonCreateAPIView.as_view(), name='lesson-create'),
    

]