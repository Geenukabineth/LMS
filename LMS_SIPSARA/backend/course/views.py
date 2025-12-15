from rest_framework import viewsets, permissions, status
from rest_framework.generics import CreateAPIView, RetrieveAPIView, UpdateAPIView, DestroyAPIView, ListAPIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from datetime import timedelta


from .models import (
    Course, EnrolledCourse, Variant, VariantItem, Module, Lesson,
    CompletedLesson, Note, Review, Question_Answer, Question_Answer_Message
)

from .serializers import (
    CourseSerializer, CourseCreateSerializer, AdminCourseCreateSerializer,
    EnrolledCourseSerializer, ModuleSerializer, LessonSerializer, ReviewSerializer, FileUploadSerializer,
    StudentEnrolledCoursesSerializer, ReceptionistEnrollmentSerializer, BulkEnrollmentCreateSerializer
)

from lms.models import Teacher, User, Profile,Student # Profile added for clean access in Enrollment views
from payment.models import CartOrderItem # CartOrderItem added for clean access in Enroll views
from django.db import IntegrityError
import traceback
from lms.permissions import IsTeacherOrReceptionistOrAdmin, IsReceptionistOrAdmin
from rest_framework.pagination import PageNumberPagination


# ============================================================================
# ✅ ADMIN COURSE CREATION - Creates course and assigns to teacher
# ============================================================================

class AdminCourseCreateAPIView(CreateAPIView):

    serializer_class = AdminCourseCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        try:            
       
            if not request.user.is_staff:               
                return Response(
                    {
                        "error": "Only administrators can create courses.",
                        "detail": "Your user account must have staff permissions."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            teacher_id = request.data.get('teacher')
            if not teacher_id:
                print("❌ ERROR: No teacher ID provided")
                return Response(
                    {
                        "error": "Teacher is required.",
                        "detail": "Please select a teacher to assign this course."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:               
                teacher = Teacher.objects.get(user_id=teacher_id)
                print(f"✅ Teacher found: {teacher.First_Name} {teacher.Last_Name} (ID: {teacher.user_id})")
            except Teacher.DoesNotExist:
                print(f"❌ ERROR: Teacher with ID {teacher_id} not found")
                return Response(
                    {
                        "error": f"Teacher with ID {teacher_id} not found.",
                        "detail": "Please select a valid teacher."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            required_fields = ['title', 'description', 'Department']
            missing_fields = [field for field in required_fields if not request.data.get(field)]
           
            if missing_fields:

                print(f"❌ ERROR: Missing required fields: {missing_fields}")

                return Response(

                    {

                        "error": f"Missing required fields: {', '.join(missing_fields)}",

                        "detail": "Please fill in all required fields."

                    },

                    status=status.HTTP_400_BAD_REQUEST

                )

 

            # ✅ Validate and create course

            serializer = self.get_serializer(data=request.data)

           
            if not serializer.is_valid():

                print(f"❌ ERROR: Serializer validation failed: {serializer.errors}")

                return Response(

                    {

                        "error": "Validation failed",

                        "details": serializer.errors

                    },

                    status=status.HTTP_400_BAD_REQUEST

                )

 

            # ✅ Save the course

            print("💾 Saving course...")

            course = serializer.save()          

 

            # ✅ Return success response

            return Response(

                CourseSerializer(course, context={'request': request}).data,

                status=status.HTTP_201_CREATED

            )

           

        except IntegrityError as e:

            # Database integrity error

            error_message = str(e)

            print(f"❌ INTEGRITY ERROR: {error_message}")

            traceback.print_exc()

           
            if 'assignment_status' in error_message:

                return Response(

                    {

                        "error": "Database column missing",

                        "detail": "The 'assignment_status' column is missing. Please run: python manage.py migrate course",

                        "technical_error": error_message

                    },

                    status=status.HTTP_500_INTERNAL_SERVER_ERROR

                )

           
            return Response(

                {

                    "error": "Database integrity error",

                    "detail": "There was a problem saving to the database.",

                    "technical_error": error_message

                },

                status=status.HTTP_500_INTERNAL_SERVER_ERROR

            )

           

        except Exception as e:

            # Catch-all for any other errors

            error_message = str(e)

            print(f"❌ UNEXPECTED ERROR: {error_message}")

            traceback.print_exc()

           
            # Check for common Django errors

            if 'column' in error_message.lower() and 'does not exist' in error_message.lower():

                return Response(

                    {

                        "error": "Database schema error",

                        "detail": "A required database column is missing. Please run: python manage.py migrate course",

                        "technical_error": error_message

                    },

                    status=status.HTTP_500_INTERNAL_SERVER_ERROR

                )

           
            if 'DoesNotExist' in error_message:

                return Response(

                    {

                        "error": "Related object not found",

                        "detail": "A required related object (like teacher) was not found.",

                        "technical_error": error_message

                    },

                    status=status.HTTP_404_NOT_FOUND

                )

           
            return Response(

                {

                    "error": "Server error",

                    "detail": "An unexpected error occurred while creating the course.",

                    "technical_error": error_message

                },

                status=status.HTTP_500_INTERNAL_SERVER_ERROR

            )

 

# ============================================================================
# ✅ TEACHER COURSE ASSIGNMENT - Teacher accepts/rejects assigned courses
# ============================================================================

 

class TeacherCourseAssignmentAPIView(APIView):

    """

    Teacher can view pending courses assigned to them and accept/reject.

    """

    permission_classes = [permissions.IsAuthenticated]

 

    def get(self, request):

        """Get all pending courses assigned to this teacher."""

        try:

            teacher = Teacher.objects.get(user=request.user)

            pending_courses = Course.objects.filter(

                teacher=teacher,

                assignment_status='pending'

            ).order_by('-date')

 

            serializer = CourseSerializer(

                pending_courses,

                many=True,

                context={'request': request}

            )

 

            return Response({

                'pending_courses': serializer.data,

                'count': pending_courses.count()

            })

        except Teacher.DoesNotExist:

            return Response({

                'error': 'Teacher profile not found for this user',

                'pending_courses': []

            }, status=status.HTTP_400_BAD_REQUEST)

 

    def post(self, request):

        """Teacher accepts or rejects a course assignment."""

        try:

            teacher = Teacher.objects.get(user=request.user)

            course_id = request.data.get('course_id')

            action = request.data.get('action')  # 'accept' or 'reject'

 

            if not course_id or action not in ['accept', 'reject']:

                return Response({

                    'error': 'course_id and action (accept/reject) are required'

                }, status=status.HTTP_400_BAD_REQUEST)

 

            course = Course.objects.get(id=course_id, teacher=teacher)

 

            if action == 'accept':

                course.assignment_status = 'accepted'

                course.save()

                return Response({

                    'message': 'Course assignment accepted',

                    'course': CourseSerializer(course, context={'request': request}).data

                })

            else:  # reject

                course.assignment_status = 'rejected'

                course.save()

                return Response({

                    'message': 'Course assignment rejected',

                    'course': CourseSerializer(course, context={'request': request}).data

                })

 

        except Teacher.DoesNotExist:

            return Response({

                'error': 'Teacher profile not found'

            }, status=status.HTTP_400_BAD_REQUEST)

        except Course.DoesNotExist:

            return Response({

                'error': 'Course not found or not assigned to you'

            }, status=status.HTTP_404_NOT_FOUND)

 

# ============================================================================
# ✅ TEACHER COURSE COUNT - NEW ENDPOINT FOR TEACHER DASHBOARD
# ============================================================================

 

# ============================================================================
# ✅ TEACHER COURSE COUNT - ULTRA-ROBUST VERSION WITH ERROR HANDLING
# ============================================================================




class TeacherCourseCountAPIView(APIView):

    """

    Get course count for the authenticated teacher.

    ULTRA-ROBUST VERSION: Handles all edge cases and errors gracefully.

    """

    permission_classes = [permissions.IsAuthenticated]

 

    def get(self, request):

       
        try:

            # Step 1: Get authenticated user

            user = request.user

            print(f"✅ User: {user.username} (ID: {user.id})")

           
            # Step 2: Get teacher record

            try:

                teacher = Teacher.objects.get(user=user)

                print(f"✅ Teacher found: {teacher}")

            except Teacher.DoesNotExist:

                print(f"❌ Teacher not found for user {user.username}")

                return Response({

                    'course_count': 0,

                    'error': 'User is not registered as a teacher',

                    'courses': []

                }, status=status.HTTP_400_BAD_REQUEST)

           
            # Step 3: Get courses

            try:

                courses = Course.objects.filter(

                    teacher=teacher,

                    assignment_status__in=['accepted', 'pending']

                ).order_by('-date')

                print(f"✅ Courses found: {courses.count()}")

            except Exception as e:

                print(f"❌ Error querying courses: {str(e)}")

                traceback.print_exc()

                return Response({

                    'error': f'Error querying courses: {str(e)}',

                    'course_count': 0,

                    'courses': []

                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

           
            # Step 4: Serialize courses

            try:

                serializer = CourseSerializer(

                    courses,

                    many=True,

                    context={'request': request}

                )

                print(f"✅ Serialization successful")

            except Exception as e:

                print(f"❌ Error serializing: {str(e)}")

                traceback.print_exc()

                return Response({

                    'error': f'Error serializing courses: {str(e)}',

                    'course_count': courses.count(),

                    'courses': []

                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

           
            # Step 5: Get teacher ID safely - multiple attempts

            teacher_id = None

            print(f"\n🔍 Attempting to get teacher ID...")

           
            # Attempt 1: Use pk (primary key) - most reliable

            try:

                if hasattr(teacher, 'pk'):

                    teacher_id = teacher.pk

                    print(f"✅ Got teacher ID from 'pk': {teacher_id}")

            except Exception as e:

                print(f"❌ Failed to get pk: {str(e)}")

           
            # Attempt 2: Use id field

            if teacher_id is None:

                try:

                    if hasattr(teacher, 'id'):

                        teacher_id = teacher.id

                        print(f"✅ Got teacher ID from 'id': {teacher_id}")

                except Exception as e:

                    print(f"❌ Failed to get id: {str(e)}")

           
            # Attempt 3: Use user_id

            if teacher_id is None:

                try:

                    if hasattr(teacher, 'user_id'):

                        teacher_id = teacher.user_id

                        print(f"✅ Got teacher ID from 'user_id': {teacher_id}")

                except Exception as e:

                    print(f"❌ Failed to get user_id: {str(e)}")

           
            # Attempt 4: Use user.id

            if teacher_id is None:

                try:

                    if hasattr(teacher, 'user') and hasattr(teacher.user, 'id'):

                        teacher_id = teacher.user.id

                        print(f"✅ Got teacher ID from 'user.id': {teacher_id}")

                except Exception as e:

                    print(f"❌ Failed to get user.id: {str(e)}")

           
            # Fallback: Use string representation

            if teacher_id is None:

                teacher_id = str(teacher)

                print(f"⚠️  Using fallback teacher ID (string): {teacher_id}")

           
            # Step 6: Build response

            response_data = {

                'course_count': courses.count(),

                'teacher_id': teacher_id,

                'user_id': user.id,

                'username': user.username,

                'courses': serializer.data

            }

           
            print(f"\n✅ Response data prepared:")

            print(f"   - course_count: {response_data['course_count']}")

            print(f"   - teacher_id: {response_data['teacher_id']}")

            print(f"   - user_id: {response_data['user_id']}")

            print(f"   - username: {response_data['username']}")

           
            print("="*80)

            print("✅ TeacherCourseCountAPIView - SUCCESS")

            print("="*80 + "\n")

           
            return Response(response_data, status=status.HTTP_200_OK)

           
        except Exception as e:

            # Catch-all for any unexpected errors

            error_msg = str(e)

            print(f"\n❌ UNEXPECTED ERROR in TeacherCourseCountAPIView:")

            print(f"   {error_msg}")

            traceback.print_exc()

            print("="*80 + "\n")

           
            return Response({

                'error': f'An unexpected error occurred: {error_msg}',

                'course_count': 0,

                'courses': [],

                'debug_info': {

                    'error_type': type(e).__name__,

                    'traceback': traceback.format_exc()

                }

            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class TeacherCourseDetailAPIView(APIView):

    """

    Get FULL DETAILS of a specific course for the authenticated teacher.

    Shows complete course information including modules, lessons, etc.

    """

    permission_classes = [permissions.IsAuthenticated]

 

    def get(self, request, course_id):

        """

        Get detailed information about a specific course.

       

        URL: /teacher/courses/<course_id>/

        Parameters: course_id (course ID)

       

        Returns: Full course details with nested modules and lessons

        """

       
        try:

            # Step 1: Get authenticated user

            user = request.user

            print(f"✅ User: {user.username} (ID: {user.id})")

           
            # Step 2: Get teacher record

            try:

                teacher = Teacher.objects.get(user=user)

                print(f"✅ Teacher found: {teacher}")

            except Teacher.DoesNotExist:

                print(f"❌ Teacher not found for user {user.username}")

                return Response({

                    'error': 'User is not registered as a teacher',

                    'course_id': course_id

                }, status=status.HTTP_400_BAD_REQUEST)

           
            # Step 3: Fetch the specific course

            try:

                course = Course.objects.get(

                    id=course_id,

                    teacher=teacher  # ✅ Verify ownership - user can only see their own courses

                )

                print(f"✅ Course found: {course.title} (ID: {course.id})")

            except Course.DoesNotExist:

                print(f"❌ Course not found or doesn't belong to this teacher")

                return Response({

                    'error': 'Course not found or access denied',

                    'course_id': course_id

                }, status=status.HTTP_404_NOT_FOUND)

           
            # Step 4: Get modules for this course

            try:

                modules = Module.objects.filter(course=course).order_by('order')

                print(f"✅ Modules found: {modules.count()}")

               
                # Get lessons for each module

                modules_with_lessons = []

                for module in modules:

                    lessons = Lesson.objects.filter(module=module).order_by('order')

                    modules_with_lessons.append({

                        'module': module,

                        'lessons': lessons

                    })

               
            except Exception as e:

                print(f"❌ Error fetching modules: {str(e)}")

                traceback.print_exc()

                return Response({

                    'error': f'Error fetching modules: {str(e)}',

                    'course_id': course_id

                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

           
            # Step 5: Serialize course with full details

            try:

                course_serializer = CourseSerializer(course, context={'request': request})

                modules_serializer = ModuleSerializer(modules, many=True, context={'request': request})

               
                print(f"✅ Serialization successful")

            except Exception as e:

                print(f"❌ Error serializing: {str(e)}")

                traceback.print_exc()

                return Response({

                    'error': f'Error serializing data: {str(e)}',

                    'course_id': course_id

                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

           
            # Step 6: Get teacher details

            teacher_id = None

            print(f"\n🔍 Extracting teacher ID...")

           
            # Try multiple approaches

            try:

                if hasattr(teacher, 'pk'):

                    teacher_id = teacher.pk

                    print(f"✅ Got teacher ID: {teacher_id}")

            except Exception as e:

                print(f"⚠️  Fallback to user_id: {user.id}")

                teacher_id = user.id

           
            # Step 7: Get course statistics

            try:

                # Count enrolled students

                enrolled_count = EnrolledCourse.objects.filter(course=course).count()

               
                # Count total lessons

                total_lessons = Lesson.objects.filter(module__course=course).count()

               
                # Get reviews

                reviews = Review.objects.filter(course=course, active=True)

                avg_rating = sum([r.rating for r in reviews]) / reviews.count() if reviews.count() > 0 else 0

               
                print(f"✅ Statistics calculated:")

                print(f"   - Enrolled students: {enrolled_count}")

                print(f"   - Total lessons: {total_lessons}")

                print(f"   - Average rating: {avg_rating}")

               
            except Exception as e:

                print(f"⚠️  Error calculating statistics: {str(e)}")

                enrolled_count = 0

                total_lessons = 0

                avg_rating = 0

           
            # Step 8: Build comprehensive response

            response_data = {

                'success': True,

                'teacher_id': teacher_id,

                'user_id': user.id,

                'username': user.username,

               
                # ✅ COURSE DETAILS

                'course': {

                    **course_serializer.data,

                    'statistics': {

                        'enrolled_students': enrolled_count,

                        'total_lessons': total_lessons,

                        'average_rating': round(avg_rating, 2),

                        'total_modules': modules.count()

                    }

                },

               
                # ✅ MODULES WITH LESSONS

                'modules': modules_serializer.data,

               
                # ✅ SUMMARY

                'summary': {

                    'course_title': course.title,

                    'course_status': course.platform_status,

                    'assignment_status': course.assignment_status,

                    'total_modules': modules.count(),

                    'total_lessons': total_lessons,

                    'enrolled_students': enrolled_count,

                    'teacher_assigned': True

                }

            }

           
            print(f"\n✅ Full Response prepared:")

            print(f"   - Course: {response_data['course']['title']}")

            print(f"   - Modules: {response_data['summary']['total_modules']}")

            print(f"   - Lessons: {response_data['summary']['total_lessons']}")

            print(f"   - Students: {response_data['summary']['enrolled_students']}")

           
            print("="*80)

            print("✅ TeacherCourseDetailAPIView - SUCCESS")

            print("="*80 + "\n")

           
            return Response(response_data, status=status.HTTP_200_OK)

           
        except Exception as e:

            # Catch-all for any unexpected errors

            error_msg = str(e)

            print(f"\n❌ UNEXPECTED ERROR in TeacherCourseDetailAPIView:")

            print(f"   {error_msg}")

            traceback.print_exc()

            print("="*80 + "\n")

           
            return Response({

                'success': False,

                'error': f'An unexpected error occurred: {error_msg}',

                'course_id': course_id,

                'debug_info': {

                    'error_type': type(e).__name__,

                    'traceback': traceback.format_exc()

                }

            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

 

# ============================================================================
# COURSE TEACHER LIST - FOR TEACHERS TO SEE THEIR OWN COURSES
# ============================================================================

 

class CourseTeacherListAPIView(ListAPIView):

   
    serializer_class = CourseSerializer

    permission_classes = [permissions.IsAuthenticated]

 

    def get_queryset(self):

        return Course.objects.filter(

            teacher__user_id=self.request.user.id,  # ← Direct query, no Teacher lookup!

            assignment_status__in=['accepted', 'pending']

        ).order_by('-date')

 

    def get_serializer_context(self):

        context = super().get_serializer_context()

        context['request'] = self.request

        return context

 

# ============================================================================
# SEARCH COURSE
# ============================================================================

 

class SearchCourseAPIView(ListAPIView):

    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
 
    def get_queryset(self):
        # Start with all published courses
        queryset = Course.objects.filter(platform_status='published')
        
        # === TEXT SEARCH (q parameter) ===
        query = self.request.query_params.get('q', '').strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(Department__icontains=query)
            )        
        # === LEVEL FILTER ===
        level = self.request.query_params.get('level', '').strip()
        if level:
            queryset = queryset.filter(level=level)       
        # === LANGUAGE FILTER ===
        language = self.request.query_params.get('language', '').strip()
        if language:
            queryset = queryset.filter(language=language)        
        # === PRICE FILTER ===
        price_max = self.request.query_params.get('price_max', '').strip()
        if price_max:
            try:
                queryset = queryset.filter(price__lte=float(price_max))
            except (ValueError, TypeError):
                pass  # Ignore invalid price values        
        price_min = self.request.query_params.get('price_min', '').strip()
        if price_min:
            try:
                queryset = queryset.filter(price__gte=float(price_min))
            except (ValueError, TypeError):
                pass        
        # === FEATURED FILTER ===
        featured = self.request.query_params.get('featured', '').strip().lower()
        if featured == 'true':
            queryset = queryset.filter(featured=True)
        elif featured == 'false':
            queryset = queryset.filter(featured=False)
        return queryset.order_by('-date')

 

# ============================================================================
# COURSE DETAIL
# ============================================================================

 

class CourseDetailAPIView(RetrieveAPIView):

    """

    Get detailed information about a specific course.

    """

    serializer_class = CourseSerializer

    permission_classes = [permissions.AllowAny]

    lookup_field = 'slug'

 

    def get_queryset(self):

        return Course.objects.filter(platform_status='published')

 

# ============================================================================
# COURSE CREATE
# ============================================================================

 

class CourseCreateAPIView(CreateAPIView):

    """

    Create a new course (deprecated - use AdminCourseCreateAPIView instead).

    """

    serializer_class = CourseCreateSerializer

    permission_classes = [permissions.IsAuthenticated]

    parser_classes = (MultiPartParser, FormParser)

 

    def create(self, request, *args, **kwargs):

        try:

            teacher = Teacher.objects.get(user=request.user)

            request.data._mutable = True

            request.data['instructor'] = teacher.id

            request.data._mutable = False

        except Teacher.DoesNotExist:

            return Response(

                {

                    "error": "You must be registered as a teacher to create courses",

                    "detail": "Your account is not set up as a teacher account."

                },

                status=status.HTTP_403_FORBIDDEN

            )

 

        return super().create(request, *args, **kwargs)

 

# ============================================================================
# COURSE UPDATE
# ============================================================================

 

class CourseUpdateAPIView(UpdateAPIView):

    """

    Update course information.

    """

    serializer_class = CourseSerializer

    permission_classes = [permissions.IsAuthenticated]

    parser_classes = (MultiPartParser, FormParser)

 

    def get_queryset(self):

        try:

            teacher = Teacher.objects.get(user=self.request.user)

            return Course.objects.filter(teacher=teacher)

        except Teacher.DoesNotExist:

            return Course.objects.none()

 

    def get_object(self):

        id = self.kwargs.get('id')

        slug = self.kwargs.get('slug')

       
        if id:

            return get_object_or_404(self.get_queryset(), id=id)

        elif slug:

            return get_object_or_404(self.get_queryset(), slug=slug)

       
        return None

 

    def update(self, request, *args, **kwargs):

        obj = self.get_object()

        if not obj:

            return Response(

                {"error": "Course not found"},

                status=status.HTTP_404_NOT_FOUND

            )

       
        serializer = self.get_serializer(obj, data=request.data, partial=True)

        serializer.is_valid(raise_exception=True)

        serializer.save()

       
        return Response(serializer.data, status=status.HTTP_200_OK)

 

# ============================================================================
# COURSE DELETE
# ============================================================================

 

class CourseDestroyAPIView(DestroyAPIView):

    """

    Delete a course.

    """

    permission_classes = [permissions.IsAuthenticated]

 

    def get_queryset(self):

        try:

            teacher = Teacher.objects.get(user=self.request.user)

            return Course.objects.filter(teacher=teacher)

        except Teacher.DoesNotExist:

            return Course.objects.none()

 

    def get_object(self):

        id = self.kwargs.get('id')

        slug = self.kwargs.get('slug')

       
        if id:

            return get_object_or_404(self.get_queryset(), id=id)

        elif slug:

            return get_object_or_404(self.get_queryset(), slug=slug)

       
        return None

 

# ============================================================================
# COURSE ENROLL
# ============================================================================

 

class EnrollCourseAPIView(CreateAPIView):

    """

    Enroll a student in a course.

    """

    permission_classes = [permissions.IsAuthenticated]

 

    def create(self, request, course_slug=None, *args, **kwargs):

        try:

            course = Course.objects.get(slug=course_slug)

        except Course.DoesNotExist:

            return Response(

                {"error": "Course not found"},

                status=status.HTTP_404_NOT_FOUND

            )

 

        # Check if already enrolled

        if EnrolledCourse.objects.filter(user=request.user, course=course).exists():

            return Response(

                {"error": "You are already enrolled in this course"},

                status=status.HTTP_400_BAD_REQUEST

            )

 

        # Create enrollment (you may need to handle payment order_item)

       
        try:

            # If order_item is required, you need to pass it or create a dummy one
            from payment.models import CartOrderItem # Redundant, but sometimes safer inside a function if not top-level

            order_item = CartOrderItem.objects.filter(student=request.user).first()

            if not order_item:

                return Response(

                    {"error": "No active order found. Please purchase the course first."},

                    status=status.HTTP_400_BAD_REQUEST

                )

           
            enrolled = EnrolledCourse.objects.create(

                user=request.user,

                course=course,

                teacher=course.teacher,

                order_item=order_item

            )

 

            return Response(

                EnrolledCourseSerializer(enrolled, context={'request': request}).data,

                status=status.HTTP_201_CREATED

            )

        except Exception as e:

            return Response(

                {"error": f"Enrollment failed: {str(e)}"},

                status=status.HTTP_500_INTERNAL_SERVER_ERROR

            )

 

# ============================================================================
# ENROLLED COURSE LIST - FOR STUDENTS
# ============================================================================

 

class EnrolledCourseListAPIView(ListAPIView):

    """

    Get all courses enrolled by the authenticated student.

    ✅ FIXED: Properly filters by authenticated user.

    """

    serializer_class = StudentEnrolledCoursesSerializer
    permission_classes = [permissions.IsAuthenticated]

 

    def get_queryset(self):

        return EnrolledCourse.objects.filter(

            user=self.request.user,
            status='active'
        ).order_by('-date')

 

    def get_serializer_context(self):

        context = super().get_serializer_context()

        context['request'] = self.request

        return context

 

# ============================================================================
# ADMIN COURSE LIST AND COUNT
# ============================================================================

 

class AdminCourseListCountAPIView(ListAPIView):

    """

    Get course count and list for admin.

    ✅ FIXED: Now supports filtering by teacher_id for admins

    """

    serializer_class = CourseSerializer

    permission_classes = [permissions.IsAuthenticated]

 

    def get_queryset(self):

        # Check if user is admin/staff

        if self.request.user.is_staff:

            # Admin can filter by teacher_id parameter

            teacher_id = self.request.query_params.get('teacher_id')

           
            if teacher_id:

                try:

                    teacher = Teacher.objects.get(user_id=teacher_id)

                    return Course.objects.filter(teacher=teacher).order_by('-date')

                except Teacher.DoesNotExist:

                    return Course.objects.none()

           
            # If no teacher_id specified, return all courses

            return Course.objects.all().order_by('-date')

       
        # Regular users get only published courses

        return Course.objects.filter(platform_status='published').order_by('-date')

 

    def list(self, request, *args, **kwargs):

        queryset = self.get_queryset()

        serializer = self.get_serializer(queryset, many=True)

       
        return Response({

            'course_count': queryset.count(),

            'courses': serializer.data,

            'user_authenticated': request.user.is_authenticated,

            'is_staff': request.user.is_staff if request.user.is_authenticated else False

        })

 

    def get_serializer_context(self):

        context = super().get_serializer_context()

        context['request'] = self.request

        return context

 

# ============================================================================
# TEACHER VALIDATION - NEW ENDPOINT FOR DEBUGGING
# ============================================================================

 

class TeacherValidationAPIView(APIView):

    """

    Check if the authenticated user is a teacher.

    Useful for debugging authentication issues.

    """

    permission_classes = [permissions.IsAuthenticated]

 

    def get(self, request):

        try:

            teacher = Teacher.objects.get(user=request.user)

            courses_count = Course.objects.filter(teacher=teacher).count()

 

            return Response({

                'is_teacher': True,
                'teacher_id': teacher.id,
                'user_id': request.user.id,
                'username': request.user.username,
                'courses_count': courses_count,

            })

        except Teacher.DoesNotExist:

            return Response({

                'is_teacher': False,
                'message': 'User is not registered as a teacher',
                'user_id': request.user.id,
                'username': request.user.username,
            }, status=status.HTTP_403_FORBIDDEN)

 

# ============================================================================
# TEACHER COURSES ENDPOINT - ALTERNATIVE
# ============================================================================

 

class TeacherCoursesAPIView(ListAPIView):

    """

    Get teacher's courses and count.

    Alternative endpoint for flexibility.

    """

    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

 

    def get_queryset(self):
        try:

            teacher = Teacher.objects.get(user=self.request.user)

            return Course.objects.filter(
                teacher=teacher,
                assignment_status__in=['accepted', 'pending']
            ).order_by('-date')
        except Teacher.DoesNotExist:
            return Course.objects.none()

 

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        if request.query_params.get('count'):

            return Response({
                'course_count': queryset.count(),
                'courses': serializer.data
            })

        return Response(serializer.data)

 

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context



class ModuleListCreateAPIView(ListAPIView):

    serializer_class = ModuleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        course_id = self.request.query_params.get('course_id')
        if course_id:
            return Module.objects.filter(course_id=course_id).order_by('order')
        return Module.objects.all()

 

class LessonListCreateAPIView(ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        module_id = self.request.query_params.get('module_id')
        if module_id:
            return Lesson.objects.filter(module_id=module_id).order_by('order')
        return Lesson.objects.all()


class FileUploadAPIView(CreateAPIView):

    serializer_class = FileUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data['file']

        return Response({
            'filename': file.name,
            'size': file.size,
            'message': 'File uploaded successfully'
        }, status=status.HTTP_201_CREATED)


class CoursesByLevelAPIView(ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        level = self.request.query_params.get('level')
        if level:
            return Course.objects.filter(
                level=level,
                platform_status='published'
            ).order_by('-date')
        return Course.objects.filter(platform_status='published').order_by('-date')
    


# ============================================================================
# ✅ ENROLLED COURSE MANAGEMENT ENDPOINTS (RECEPTIONIST)
# ============================================================================

class EnrollmentListAPIView(ListAPIView):
    """
    ✅ FIXED: Get all enrollments with proper filtering support
    
    Endpoints:
    - GET /Course/enrollments/
    - GET /Course/enrollments/?student_id=1
    - GET /Course/enrollments/?course_id=1
    - GET /Course/enrollments/?status=active
    - GET /Course/enrollments/?status=expired
    - GET /Course/enrollments/?expiring_soon=true
    
    Returns: Array of enrollment objects with all details
    """
    
    serializer_class = ReceptionistEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        ✅ Build queryset with comprehensive filtering support
        """
        try:
            print(f"\n{'='*60}")
            print(f"EnrollmentListAPIView - get_queryset")
            print(f"{'='*60}")
            
            # Get base queryset with related objects pre-fetched
            queryset = EnrolledCourse.objects.select_related(
                'user', 'course', 'teacher'
            ).all()
            
            print(f"Base queryset count: {queryset.count()}")
            
            # ✅ FILTER 1: By student_id
            student_id = self.request.query_params.get('student_id')
            if student_id:
                try:
                    student_id = int(student_id)
                    queryset = queryset.filter(user_id=student_id)
                    print(f"✅ Filtered by student_id={student_id}: {queryset.count()} results")
                except ValueError:
                    print(f"⚠️ Invalid student_id: {student_id}")
            
            # ✅ FILTER 2: By course_id
            course_id = self.request.query_params.get('course_id')
            if course_id:
                try:
                    course_id = int(course_id)
                    queryset = queryset.filter(course_id=course_id)
                    print(f"✅ Filtered by course_id={course_id}: {queryset.count()} results")
                except ValueError:
                    print(f"⚠️ Invalid course_id: {course_id}")
            
            # ✅ FILTER 3: By status (active or expired)
            status_filter = self.request.query_params.get('status')
            if status_filter and status_filter in ['active', 'expired']:
                queryset = queryset.filter(status=status_filter)
                print(f"✅ Filtered by status={status_filter}: {queryset.count()} results")
            
            # ✅ FILTER 4: For expiring soon (next 7 days)
            expiring_soon = self.request.query_params.get('expiring_soon')
            if expiring_soon == 'true':
                now = timezone.now()
                week_later = now + timedelta(days=7)
                queryset = queryset.filter(
                    ended_at__gte=now,
                    ended_at__lte=week_later,
                    status='active'
                )
                print(f"✅ Filtered by expiring_soon: {queryset.count()} results")
            
            # ✅ ORDER by most recent first
            queryset = queryset.order_by('-date')
            
            print(f"Final queryset count: {queryset.count()}")
            print(f"{'='*60}\n")
            
            return queryset
            
        except Exception as e:
            print(f"❌ Error in get_queryset: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


class StudentEnrollmentsAPIView(ListAPIView):
    """
    ✅ FIXED: Get all enrollments for a specific student
    GET /Course/students/<student_id>/enrollments/
    
    Shows ALL enrollments (active, expiring, expired)
    - Students can only see their own enrollments
    - Admins can see any student's enrollments
    """
    serializer_class = StudentEnrolledCoursesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        
        print(f"\nStudentEnrollmentsAPIView: student_id={student_id}")
        print(f"Current user: {self.request.user.username} (is_staff={self.request.user.is_staff})")
        
        # ✅ PERMISSION CHECK: Students can only see their own enrollments
        if self.request.user.id != int(student_id) and not self.request.user.is_staff:
            print(f"❌ Permission denied")
            return EnrolledCourse.objects.none()
        
        print(f"✅ Permission granted")
        
        # ✅ RETURN ALL enrollments (active, expiring, expired)
        queryset = EnrolledCourse.objects.filter(
            user_id=student_id
        ).select_related('course', 'teacher').order_by('-date')
        
        print(f"Found {queryset.count()} enrollments")
        
        return queryset

class EnrollmentDetailAPIView(RetrieveAPIView):
    """
    ✅ Get detailed enrollment info
    GET /Course/enrollments/<enrollment_id>/
    """
    serializer_class = ReceptionistEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    queryset = EnrolledCourse.objects.select_related('user', 'course', 'teacher')


class EnrollmentCreateAPIView(CreateAPIView):

    serializer_class = EnrolledCourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            
            # Permission check
            is_admin = user.is_staff
            is_receptionist = user.user_type == 'receptionist'
            
            print(f"\n{'='*60}")
            print(f"Enrollment Create (Single)")
            print(f"{'='*60}")
            print(f"User: {user.username}")
            print(f"is_staff: {is_admin}, user_type: {user.user_type}")
            
            if not (is_admin or is_receptionist):
                print(f"❌ Permission denied")
                return Response(
                    {"error": "Only receptionists and admins can create enrollments"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            print(f"✅ Permission granted (admin/receptionist)")
            
            # Get request data
            student_ids = request.data.get('student_ids', [])
            course_id = request.data.get('course_id')
            enrollment_days = request.data.get('enrollment_days', 30)
            
            print(f"Request: course_id={course_id}, student_ids={student_ids}, days={enrollment_days}")
            
            # Validation
            if not course_id:
                return Response(
                    {"error": "course_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not student_ids or len(student_ids) == 0:
                return Response(
                    {"error": "At least one student_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the course
            try:
                course = Course.objects.get(id=course_id)
                print(f"✅ Course found: {course.title} (id={course.id})")
            except Course.DoesNotExist:
                print(f"❌ Course not found: {course_id}")
                return Response(
                    {"error": f"Course with ID {course_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get first student (for single enrollment)
            try:
                student = Student.objects.get(user_id=student_ids[0])
                print(f"✅ Student found: {student.username} (id={student.id})")
            except Student.DoesNotExist:
                print(f"❌ Student not found: {student_ids[0]}")
                return Response(
                    {"error": f"User with ID {student_ids[0]} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if already enrolled
            if EnrolledCourse.objects.filter(user=student, course=course).exists():
                print(f"❌ Already enrolled")
                return Response(
                    {"error": "User is already enrolled in this course"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"✅ Not previously enrolled")
            
            # ✅ FINAL FIX: For admin enrollments, DO NOT USE CartOrderItem
            # CartOrderItem is only for paid orders (has order_id constraint)
            # Admin/receptionist enrollments are FREE and should set order_item=None
            
            print(f"Creating enrollment (admin/free - no CartOrderItem needed)...")
            
            # Calculate end date
            start_date = timezone.now()
            end_date = start_date + timedelta(days=enrollment_days)
            
            # ✅ Create enrollment with order_item=None (admin/free enrollment)
            enrollment = EnrolledCourse.objects.create(
                user=student,
                course=course,
                teacher=course.teacher,
                order_item=None,  # ← KEY: No CartOrderItem for admin enrollments
                date=start_date,
                ended_at=end_date,
                status='active'
            )
            
            print(f"✅ Enrollment created: {enrollment.enrollment_id}")
            print(f"   Days remaining: {enrollment.days_remaining}")
            print(f"   Has access: {enrollment.has_access()}")
            print(f"{'='*60}\n")
            
            serializer = self.get_serializer(enrollment)
            return Response(
                {
                    "message": f"Student {student.username} enrolled in {course.title} for {enrollment_days} days",
                    "enrollment": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            print(f"\n❌ ENROLLMENT ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"{'='*60}\n")
            
            return Response(
                {"error": f"Enrollment creation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkEnrollmentCreateAPIView(CreateAPIView):

    serializer_class = BulkEnrollmentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
   
    def create(self, request, *args, **kwargs):
        try:
            user = request.user
            
            # Permission check
            is_admin = user.is_staff
            is_receptionist = user.user_type == 'receptionist'
            
            print(f"\n{'='*60}")
            print(f"Bulk Enrollment Create")
            print(f"{'='*60}")
            print(f"User: {user.username}")
            print(f"is_staff: {is_admin}, user_type: {user.user_type}")
            
            if not (is_admin or is_receptionist):
                return Response(
                    {"error": "Only receptionists and admins can create enrollments"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            
            # Get request data
            student_ids = request.data.get('student_ids', [])
            course_id = request.data.get('course_id')
            enrollment_days = request.data.get('enrollment_days', 30)
            
            
            # Validation
            if not course_id:
                return Response(
                    {"error": "course_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not student_ids or len(student_ids) == 0:
                return Response(
                    {"error": "student_ids list is required and cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the course
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response(
                    {"error": f"Course with ID {course_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Calculate end date
            start_date = timezone.now()
            end_date = start_date + timedelta(days=enrollment_days)
            
            # Process each student
            created_enrollments = []
            failed_enrollments = []
            
            
            for idx, student_id in enumerate(student_ids, 1):
                try:
                    # Get student
                    student = Student.objects.get(id=student_id)
                    
                    # Check if already enrolled
                    if EnrolledCourse.objects.filter(user=student, course=course).exists():
                        failed_enrollments.append({
                            "student_id": student_id,
                            "username": student.username,
                            "reason": "Already enrolled"
                        })
                        continue
                    
                    # ✅ Create enrollment with order_item=None (admin/free)
                    enrollment = EnrolledCourse.objects.create(
                        user=student,
                        course=course,
                        teacher=course.teacher,
                        order_item=None,  # ← KEY: No CartOrderItem for admin enrollments
                        date=start_date,
                        ended_at=end_date,
                        status='active'
                    )
                    
                    created_enrollments.append({
                        "enrollment_id": enrollment.enrollment_id,
                        "student_id": student_id,
                        "username": student.username
                    })
                
                except Student.DoesNotExist:
                    failed_enrollments.append({
                        "student_id": student_id,
                        "reason": "User not found"
                    })
                except Exception as e:
                    failed_enrollments.append({
                        "student_id": student_id,
                        "reason": str(e)
                    })
            
            
            # Return summary
            return Response(
                {
                    "message": f"Bulk enrollment completed for {course.title}",
                    "course_id": course_id,
                    "course_title": course.title,
                    "total_attempted": len(student_ids),
                    "total_enrolled": len(created_enrollments),
                    "total_failed": len(failed_enrollments),
                    "enrollment_days": enrollment_days,
                    "created_enrollments": created_enrollments,
                    "failed_enrollments": failed_enrollments if failed_enrollments else []
                },
                status=status.HTTP_201_CREATED if len(created_enrollments) > 0 else status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            
            return Response(
                {"error": f"Bulk enrollment failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EnrollmentUpdateAPIView(UpdateAPIView):

    serializer_class = EnrolledCourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    queryset = EnrolledCourse.objects.all()
    
    def update(self, request, *args, **kwargs):
        try:
            enrollment = self.get_object()
            
            # Check permissions
            if not (request.user.is_staff or hasattr(request.user, 'profile') and 
                    request.user.profile.role == 'receptionist'):
                return Response(
                    {"error": "Only receptionists and admins can update enrollments"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Handle extension by days
            if 'enrollment_days' in request.data:
                days_to_add = request.data.get('enrollment_days')
                current_end = enrollment.ended_at or timezone.now()
                enrollment.ended_at = current_end + timedelta(days=days_to_add)
                enrollment.save()
            
            # Handle explicit end date
            elif 'ended_at' in request.data:
                enrollment.ended_at = request.data.get('ended_at')
                enrollment.save()
            
            # Handle status change
            if 'status' in request.data:
                new_status = request.data.get('status')
                if new_status in ['active', 'expired']:
                    enrollment.status = new_status
                    enrollment.save()
            
            serializer = self.get_serializer(enrollment)
            return Response(
                {
                    "message": "Enrollment updated successfully",
                    "enrollment": serializer.data
                }
            )
        
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EnrollmentDestroyAPIView(DestroyAPIView):
    """
    ✅ Delete/revoke enrollment
    DELETE /Course/enrollments/<id>/delete/
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    queryset = EnrolledCourse.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        try:
            # Check permissions
            if not (request.user.is_staff or hasattr(request.user, 'profile') and 
                    request.user.profile.role == 'receptionist'):
                return Response(
                    {"error": "Only receptionists and admins can delete enrollments"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            enrollment = self.get_object()
            enrollment_id = enrollment.enrollment_id
            course_title = enrollment.course.title
            student_name = enrollment.user.username
            
            enrollment.delete()
            
            return Response(
                {
                    "message": f"Enrollment revoked: {student_name} removed from {course_title}",
                    "deleted_enrollment_id": enrollment_id
                },
                status=status.HTTP_204_NO_CONTENT
            )
        
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StudentEnrollmentsAPIView(ListAPIView):
    """
    ✅ Get all enrollments for a specific student (Student view)
    GET /Course/students/<student_id>/enrollments/
    
    Shows only active and expiring courses
    """
    serializer_class = StudentEnrolledCoursesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        
        # Students can only see their own enrollments
        if self.request.user.id != int(student_id) and not self.request.user.is_staff:
            return EnrolledCourse.objects.none()
        
        return EnrolledCourse.objects.filter(
            user_id=student_id,
            status='active'
        ).select_related('course', 'teacher')


class EnrollmentExpiringAPIView(ListAPIView):
    """
    ✅ Get enrollments expiring soon (for admin/receptionist notifications)
    GET /Course/enrollments/expiring/
    
    Query params:
    ?days=7 - Show enrollments expiring in next N days (default: 7)
    """
    serializer_class = ReceptionistEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        days = int(self.request.query_params.get('days', 7))
        now = timezone.now()
        expiration_date = now + timedelta(days=days)
        
        return EnrolledCourse.objects.filter(
            ended_at__gte=now,
            ended_at__lte=expiration_date,
            status='active'
        ).select_related('user', 'course', 'teacher').order_by('ended_at')
    

class StudentEnrolledCoursesListAPIView(ListAPIView):
    """
    ✅ GET /api/course/student/enrolled-courses/
    
    Returns all courses enrolled by the current authenticated student.
    Includes:
    - Course basic info (title, description, image)
    - Enrollment status (active/expired)
    - Days remaining
    - Access status (has_access boolean)
    - Progress calculation
    - Teacher information
    
    Query Parameters:
    - status=active : Filter by active enrollments
    - status=expired : Filter by expired enrollments
    - search=title : Search courses by title
    - ordering=-started_at : Order by enrollment date (newest first)
    """
    
    serializer_class = StudentEnrolledCoursesSerializer
    permission_classes = [permissions.IsAuthenticated]
    


    def get_queryset(self):
    
        from lms.models import Student
        
        user = self.request.user
        
        # ✅ Get the Student instance from the authenticated User
        try:
            # Store the student instance for use in list()
            self.student_instance = Student.objects.get(user=user) # ⬅️ Store instance
        except Student.DoesNotExist:
            return EnrolledCourse.objects.none()
        except Exception as e:
            print(f"Error getting student for user {user}: {e}")
            return EnrolledCourse.objects.none()
        
        # Base queryset with related course data
        queryset = EnrolledCourse.objects.filter(
            user=self.student_instance  # ✅ Use the Student instance here
        ).select_related(
            'course',
            'teacher',
            'course__teacher'
        ).prefetch_related(
            'course__modules',
            'course__modules__lessons'
            
        ).order_by('-date')
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to add metadata"""
        # Get the queryset (which sets self.student_instance)
        queryset = self.filter_queryset(self.get_queryset())
        response = super().list(request, *args, **kwargs)
        
        # Add summary statistics
        student_instance = getattr(self, 'student_instance', None)
        
        # ✅ FIX: Use the student_instance for filtering the count
        if student_instance:
            active_count = EnrolledCourse.objects.filter(
                user=student_instance, # ⬅️ FIX APPLIED: Use Student object
                status='active'
            ).count()
        else:
            active_count = 0
        
        response.data = {
            'summary': {
                'total_enrollments': len(response.data['results']), # Use results count
                'active_courses': active_count,
                # The 'completed_courses' calculation is risky without progress data,
                # but we'll use the current logic to avoid breaking other things.
                'completed_courses': len(response.data['results']) - active_count, 
            },
            'results': response.data['results']
        }
        
        return response

# ============================================================================
# ✅ Student Enrolled Course Detail - Course Page
# ============================================================================

class StudentEnrolledCourseDetailAPIView(RetrieveAPIView):
    """
    ✅ GET /api/course/student/enrolled-courses/<course_id>/
    
    Returns detailed information about a specific enrolled course including:
    - Full course details
    - All modules with lessons
    - Student's completion status for each lesson
    - Enrollment expiration details
    - Access status
    - Progress percentage
    
    Only returns courses the student is enrolled in.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'course_id'
    lookup_url_kwarg = 'course_id'
    
    def get_serializer_class(self):
        """Use CourseSerializer for full course details"""
        return CourseSerializer
    
    # views.py (StudentEnrolledCourseDetailAPIView.get_object)

    def get_object(self):
        """Get enrolled course and verify student has access"""
        user = self.request.user
        course_id = self.kwargs.get('course_id')
        
        try:
            # ✅ FIX 1: Get the Student instance from the authenticated User
            from lms.models import Student 
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            raise Response("Student profile not found for the authenticated user.") # Or return 403/404

        # Get the enrollment record
        enrollment = get_object_or_404(
            EnrolledCourse.objects.select_related('course'),
            user=student,
            course_id=course_id
        )
        
        # Check if enrollment is still active - DO NOT RETURN RESPONSE HERE
        if not enrollment.has_access():
            # Raise an exception instead of returning a Response
            raise PermissionDenied("Your enrollment for this course has expired.")
        
        # Store enrollment data for use in serializer context
        self.enrollment = enrollment
        
        return enrollment.course
    
    def get_serializer_context(self):
        """Add enrollment and user to context"""
        context = super().get_serializer_context()
        context['enrollment'] = getattr(self, 'enrollment', None)
        context['user'] = self.request.user
        return context
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to include enrollment info"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Add enrollment details to response
        enrollment = self.enrollment
        response_data = serializer.data.copy()
        
        response_data['enrollment'] = {
            'enrollment_id': enrollment.enrollment_id,
            'started_at': enrollment.date,
            'ends_at': enrollment.ended_at,
            'status': enrollment.status,
            'days_remaining': enrollment.days_remaining,
            'has_access': enrollment.has_access(),
            'is_expired': enrollment.is_expired,
        }
        
        return Response(response_data)


# ============================================================================
# ✅ Student Course Progress - Progress Tracking
# ============================================================================

class StudentCourseProgressAPIView(APIView):
    """
    ✅ GET /api/course/student/enrolled-courses/<course_id>/progress/
    
    Returns detailed progress information for a course including:
    - Total lessons in course
    - Lessons completed by student
    - Percentage progress
    - Module-wise breakdown
    - Last accessed lesson
    - Estimated completion time
    
    Response:
    {
        "course_id": 1,
        "course_title": "React Advanced",
        "total_lessons": 24,
        "completed_lessons": 16,
        "progress_percentage": 66.67,
        "modules": [
            {
                "module_id": 1,
                "title": "React Fundamentals",
                "total_lessons": 6,
                "completed_lessons": 6,
                "progress": 100,
                "lessons": [...]
            },
            ...
        ],
        "last_completed": "2024-01-20T10:30:00Z",
        "next_lesson": {...},
        "estimated_hours_remaining": 12.5
    }
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, course_id):
        """Get detailed progress for a course"""
        user = request.user
        
        # Verify enrollment
        enrollment = get_object_or_404(
            EnrolledCourse,
            user=user,
            course_id=course_id
        )
        
        if not enrollment.has_access():
            return Response(
                {
                    'error': 'Access Denied',
                    'detail': 'Your enrollment has expired.'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        course = enrollment.course
        
        # Get all modules and lessons
        modules = Module.objects.filter(course=course).prefetch_related('lessons').order_by('order')
        
        # Get completed lessons
        completed_lesson_ids = set(
            CompletedLesson.objects.filter(
                user=user,
                lesson__module__course=course,
                completed=True
            ).values_list('lesson_id', flat=True)
        )
        
        # Calculate statistics
        total_lessons = Lesson.objects.filter(module__course=course).count()
        completed_lessons = len(completed_lesson_ids)
        progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        
        # Build module breakdown
        modules_data = []
        for module in modules:
            module_lessons = module.lessons.all()
            module_completed = sum(1 for lesson in module_lessons if lesson.id in completed_lesson_ids)
            module_total = module_lessons.count()
            
            lessons_data = []
            for lesson in module_lessons:
                lessons_data.append({
                    'lesson_id': lesson.lesson_id,
                    'title': lesson.title,
                    'content_type': lesson.content_type,
                    'duration_minutes': lesson.duration_minutes,
                    'completed': lesson.id in completed_lesson_ids,
                    'order': lesson.order,
                })
            
            modules_data.append({
                'module_id': module.module_id,
                'title': module.title,
                'order': module.order,
                'total_lessons': module_total,
                'completed_lessons': module_completed,
                'progress': (module_completed / module_total * 100) if module_total > 0 else 0,
                'lessons': sorted(lessons_data, key=lambda x: x['order']),
            })
        
        # Get last completed lesson
        last_completed = CompletedLesson.objects.filter(
            user=user,
            lesson__module__course=course,
            completed=True
        ).order_by('-date').first()
        
        # Get next uncompleted lesson
        next_lesson = Lesson.objects.filter(
            module__course=course
        ).exclude(
            id__in=completed_lesson_ids
        ).order_by('module__order', 'order').first()
        
        next_lesson_data = None
        if next_lesson:
            next_lesson_data = {
                'lesson_id': next_lesson.lesson_id,
                'title': next_lesson.title,
                'module_id': next_lesson.module.module_id,
                'module_title': next_lesson.module.title,
            }
        
        # Calculate estimated remaining time
        remaining_lessons = [
            l for l in Lesson.objects.filter(module__course=course)
            if l.id not in completed_lesson_ids
        ]
        total_remaining_minutes = sum(l.duration_minutes or 0 for l in remaining_lessons)
        estimated_hours_remaining = total_remaining_minutes / 60
        
        return Response({
            'course_id': course.id,
            'course_title': course.title,
            'total_lessons': total_lessons,
            'completed_lessons': completed_lessons,
            'progress_percentage': round(progress_percentage, 2),
            'modules': modules_data,
            'last_completed': last_completed.date if last_completed else None,
            'last_completed_lesson': {
                'lesson_id': last_completed.lesson.lesson_id,
                'title': last_completed.lesson.title,
            } if last_completed else None,
            'next_lesson': next_lesson_data,
            'estimated_hours_remaining': round(estimated_hours_remaining, 1),
            'enrollment': {
                'status': enrollment.status,
                'days_remaining': enrollment.days_remaining,
                'ends_at': enrollment.ended_at,
            }
        })


# ============================================================================
# ✅ Student Course Lessons - All Lessons with Completion Status
# ============================================================================

class StudentCourseLessonsAPIView(ListAPIView):
    """
    ✅ GET /api/course/student/enrolled-courses/<course_id>/lessons/
    
    Returns all lessons in an enrolled course with completion status.
    Includes content URLs, durations, and completion info.
    
    Query Parameters:
    - module_id : Filter by specific module
    - content_type : Filter by type (video, document, quiz, assignment)
    - completed=true : Show only completed lessons
    - completed=false : Show only incomplete lessons
    """
    
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get lessons for enrolled course with completion status"""
        user = self.request.user
        course_id = self.kwargs.get('course_id')
        
        # Verify enrollment
        enrollment = get_object_or_404(
            EnrolledCourse,
            user=user,
            course_id=course_id
        )
        
        if not enrollment.has_access():
            return Lesson.objects.none()
        
        # Get all lessons in course
        queryset = Lesson.objects.filter(
            module__course_id=course_id
        ).select_related('module').order_by('module__order', 'order')
        
        # Filter by module if specified
        module_id = self.request.query_params.get('module_id')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        # Filter by content type if specified
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to add completion status"""
        course_id = self.kwargs.get('course_id')
        user = request.user
        
        # Get completed lesson IDs
        completed_ids = set(
            CompletedLesson.objects.filter(
                user=user,
                lesson__module__course_id=course_id,
                completed=True
            ).values_list('lesson_id', flat=True)
        )
        
        response = super().list(request, *args, **kwargs)
        
        # Add completion status to each lesson
        for item in response.data:
            item['completed'] = item['id'] in completed_ids
        
        # Filter by completion status if requested
        completed_filter = request.query_params.get('completed')
        if completed_filter is not None:
            is_completed = completed_filter.lower() == 'true'
            response.data = [
                item for item in response.data 
                if item['completed'] == is_completed
            ]
        
        return response


# ============================================================================
# ✅ Student Course Modules - Modules with Nested Lessons
# ============================================================================

class StudentCourseModulesAPIView(ListAPIView):

    
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get modules for enrolled course"""
        user = self.request.user
        course_id = self.kwargs.get('course_id')
        
        # Verify enrollment
        enrollment = get_object_or_404(
            EnrolledCourse,
            user=user,
            course_id=course_id
        )
        
        if not enrollment.has_access():
            return Module.objects.none()
        
        # Get modules with related lessons
        queryset = Module.objects.filter(
            course_id=course_id
        ).prefetch_related('lessons').order_by('order')
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to add completion info"""
        course_id = self.kwargs.get('course_id')
        user = request.user
        
        # Get completed lesson IDs
        completed_ids = set(
            CompletedLesson.objects.filter(
                user=user,
                lesson__module__course_id=course_id,
                completed=True
            ).values_list('lesson_id', flat=True)
        )
        
        response = super().list(request, *args, **kwargs)
        
        # Add completion status and progress to each module
        for module in response.data:
            lessons = module.get('lessons', [])
            completed_count = sum(1 for lesson in lessons if lesson['id'] in completed_ids)
            total_count = len(lessons)
            
            # Add completed flag to each lesson
            for lesson in lessons:
                lesson['completed'] = lesson['id'] in completed_ids
            
            # Add module progress
            module['completed_lessons'] = completed_count
            module['total_lessons'] = total_count
            module['progress'] = (completed_count / total_count * 100) if total_count > 0 else 0
        
        return response


class ModuleAPIView(CreateAPIView):
    Serializer = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        Course_id = request.data.get('course_id')
        if not Course_id:
            return Response(
                {"error": "course_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            course = Course.objects.get(id=Course_id)
        except Course.DoesNotExist:
            return Response(
                {"error": f"Course with ID {Course_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if course.teacher.user != request.user and not request.user.is_staff:
            return Response(
                {"error": "Only the course teacher or admins can create modules"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=201)


class LessonCreateAPIView(CreateAPIView):
        serializer_class = LessonSerializer
        permission_classes = [permissions.IsAuthenticated]
        parser_classes = (MultiPartParser, FormParser)
        
        def create(self, request, *args, **kwargs):
            module_id = request.data.get('module')
            if not module_id:
                return Response({"error": "module field required"}, status=400)
            
            try:
                module = Module.objects.get(id=module_id)
            except Module.DoesNotExist:
                return Response({"error": f"Module {module_id} not found"}, status=404)
            
            if module.course.teacher.user != request.user:
                return Response({"error": "Permission denied"}, status=403)
            
            if 'file' in request.FILES:
                data = request.data.dict()
                data['content_url_or_text'] = f"/media/{request.FILES['file'].name}"
            else:
                data = request.data
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=201)
            