import requests
from rest_framework import permissions, status
from rest_framework.generics import CreateAPIView, RetrieveAPIView, UpdateAPIView, DestroyAPIView, ListAPIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from datetime import timedelta

from .models import (
    Course, EnrolledCourse, LiveAttendance, Variant, VariantItem, Module, Lesson,
    CompletedLesson, Note, Review, Question_Answer, Question_Answer_Message,LiveSession
)

from .serializers import *

from lms.models import Teacher, Student
from django.db import IntegrityError
import traceback
from rest_framework.pagination import PageNumberPagination

class AdminCourseCreateAPIView(CreateAPIView):
    serializer_class = AdminCourseCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        try:
            if not request.user.is_staff:
                return Response(
                    {"error": "Only administrators can create courses."},
                    status=status.HTTP_403_FORBIDDEN
                )
            teacher_id = request.data.get('teacher')
            if not teacher_id:
                return Response({"error": "Teacher is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                Teacher.objects.get(user_id=teacher_id)
            except Teacher.DoesNotExist:
                return Response({"error": f"Teacher with ID {teacher_id} not found."}, status=status.HTTP_404_NOT_FOUND)

            required_fields = ['title', 'description', 'Department']
            missing = [f for f in required_fields if not request.data.get(f)]
            if missing:
                return Response({"error": f"Missing required fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            course = serializer.save()

            return Response(CourseSerializer(course, context={'request': request}).data, status=status.HTTP_200_OK)

        except IntegrityError as e:
            return Response(
                {"error": "Database integrity error", "technical_error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": "Server error", "technical_error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CourseDistributionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = (
            Course.objects
            .exclude(Department__isnull=True)
            .values('Department')
            .annotate(value=Count('id'))
            .order_by('-value')
        )
        formatted = [{"name": item["Department"], "value": item["value"]} for item in data]
        return Response(formatted)


class EnrollmentDashboardStats(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now()
        thirty_days_ago = today - timedelta(days=30)

        queryset = EnrolledCourse.objects.all()
        total = queryset.count()
        active = queryset.filter(status='active', ended_at__gt=today).count()
        expired = queryset.filter(Q(status='expired') | Q(ended_at__lte=today)).count()

        expiring_soon = queryset.filter(
            status='active',
            ended_at__range=[today, today + timedelta(days=7)]
        ).count()

        daily = (
            queryset.filter(date__gte=thirty_days_ago)
            .extra(select={'day': "date(date)"})
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        top_courses = (
            queryset.values('course__title')
            .annotate(total=Count('id'))
            .order_by('-total')[:5]
        )

        return Response({
            "summary": {
                "total": total,
                "active": active,
                "expired": expired,
                "expiring_soon": expiring_soon,
            },
            "trends": daily,
            "top_courses": top_courses
        }, status=status.HTTP_200_OK)

class TeacherCourseAssignmentAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            teacher = Teacher.objects.get(user=request.user)
            pending = Course.objects.filter(teacher=teacher, assignment_status='pending').order_by('-date')
            serializer = CourseSerializer(pending, many=True, context={'request': request})
            return Response({'pending_courses': serializer.data, 'count': pending.count()})
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher profile not found', 'pending_courses': []}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            teacher = Teacher.objects.get(user=request.user)
            course_id = request.data.get('course_id')
            action = request.data.get('action')

            if not course_id or action not in ['accept', 'reject']:
                return Response({'error': 'course_id and action (accept/reject) are required'}, status=status.HTTP_400_BAD_REQUEST)

            course = Course.objects.get(id=course_id, teacher=teacher)

            course.assignment_status = 'accepted' if action == 'accept' else 'rejected'
            course.save()

            return Response({
                'message': f'Course assignment {course.assignment_status}',
                'course': CourseSerializer(course, context={'request': request}).data
            })

        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher profile not found'}, status=status.HTTP_400_BAD_REQUEST)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found or not assigned to you'}, status=status.HTTP_404_NOT_FOUND)


class CourseTeacherListAPIView(ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Course.objects.filter(
            teacher__user_id=self.request.user.id,
            assignment_status__in=['accepted', 'pending']
        ).order_by('-date')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class SearchCourseAPIView(ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Course.objects.filter(platform_status='published')

        query = self.request.query_params.get('q', '').strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(Department__icontains=query)
            )

        level = self.request.query_params.get('level', '').strip()
        if level:
            queryset = queryset.filter(level=level)

        language = self.request.query_params.get('language', '').strip()
        if language:
            queryset = queryset.filter(language=language)

        return queryset.order_by('-date')


class CourseDetailAPIView(RetrieveAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Course.objects.filter(platform_status='published')

class CourseCreateAPIView(CreateAPIView):
    serializer_class = CourseCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        try:
            teacher = Teacher.objects.get(user=request.user)
            data = request.data.copy()
            data['instructor'] = teacher.id
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            course = serializer.save()
            return Response(CourseSerializer(course, context={'request': request}).data, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({"error": "You must be registered as a teacher"}, status=status.HTTP_403_FORBIDDEN)


class CourseUpdateAPIView(UpdateAPIView):
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
        if slug:
            return get_object_or_404(self.get_queryset(), slug=slug)
        raise PermissionDenied("Course identifier missing")

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseDestroyAPIView(DestroyAPIView):
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
        if slug:
            return get_object_or_404(self.get_queryset(), slug=slug)
        raise PermissionDenied("Course identifier missing")

class EnrollCourseAPIView(CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, course_slug=None, *args, **kwargs):
        course = get_object_or_404(Course, slug=course_slug)

        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        if EnrolledCourse.objects.filter(user=student, course=course).exists():
            return Response({"error": "Already enrolled"}, status=status.HTTP_400_BAD_REQUEST)

        # Paid order item is optional here (model allows null)
        order_item = None
        try:
            from payment.models import CartOrderItem
            # Adjust this query if your CartOrderItem uses a different FK field
            order_item = CartOrderItem.objects.filter(student=student).first()
        except Exception:
            order_item = None

        enrolled = EnrolledCourse.objects.create(
            user=student,
            course=course,
            teacher=course.teacher,
            order_item=order_item
        )

        return Response(
            EnrolledCourseSerializer(enrolled, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class EnrolledCourseListAPIView(ListAPIView):
    serializer_class = StudentEnrolledCoursesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            return EnrolledCourse.objects.none()

        return EnrolledCourse.objects.filter(user=student, status='active').order_by('-date')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ============================================================================
# ✅ ADMIN COURSE LIST + UPDATE + DELETE
# ============================================================================

class AdminCourseListAPIView(ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        if self.request.user.is_staff:
            teacher_id = self.request.query_params.get('teacher_id')
            if teacher_id:
                try:
                    teacher = Teacher.objects.get(user_id=teacher_id)
                    return Course.objects.filter(teacher=teacher).order_by('-date')
                except Teacher.DoesNotExist:
                    return Course.objects.none()
            return Course.objects.all().order_by('-date')
        return Course.objects.filter(platform_status='published').order_by('-date')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response({
            'course_count': queryset.count(),
            'courses': serializer.data
        })

    def put(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        course_id = kwargs.get("course_id") or request.data.get("id") or request.query_params.get("id")
        if not course_id:
            return Response({"detail": "ID is required for update."}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)
        write = AdminCourseUpdateSerializer(course, data=request.data, partial=True, context={"request": request})
        write.is_valid(raise_exception=True)
        course = write.save()

        return Response(CourseSerializer(course, context={"request": request}).data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        course_id = kwargs.get("course_id") or request.data.get("id") or request.query_params.get("id")
        if not course_id:
            return Response({"detail": "ID is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)
        course.delete()
        return Response({"detail": "Course deleted successfully."}, status=status.HTTP_200_OK)


# ============================================================================
# ✅ FILE UPLOAD
# ============================================================================

class FileUploadAPIView(CreateAPIView):
    serializer_class = FileUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        f = serializer.validated_data['file']
        return Response({'filename': f.name, 'size': f.size}, status=status.HTTP_200_OK)


# ============================================================================
# ✅ ENROLLMENT MANAGEMENT (Receptionist/Admin)
# ============================================================================

class EnrollmentListAPIView(ListAPIView):
    serializer_class = ReceptionistEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = EnrolledCourse.objects.select_related(
            'course', 'teacher', 'user', 'user__user'
        ).all()

        from lms.models import Student  # adjust import path if different

        student_id = self.request.query_params.get('student_id')
        if student_id:
            try:
                sid = int(student_id)

                # If sid matches a Student.pk, filter by FK directly
                if Student.objects.filter(id=sid).exists():
                    queryset = queryset.filter(user_id=sid)   # EnrolledCourse.user is FK to Student
                else:
                    # Otherwise treat it as User.pk and filter via Student.user_id
                    queryset = queryset.filter(user__user_id=sid)

            except ValueError:
                pass


        course_id = self.request.query_params.get('course_id')
        if course_id:
            try:
                queryset = queryset.filter(course_id=int(course_id))
            except ValueError:
                pass

        status_filter = self.request.query_params.get('status')
        if status_filter in ['active', 'expired']:
            queryset = queryset.filter(status=status_filter)

        expiring_soon = self.request.query_params.get('expiring_soon')
        if expiring_soon == 'true':
            now = timezone.now()
            week_later = now + timedelta(days=7)
            queryset = queryset.filter(ended_at__gte=now, ended_at__lte=week_later, status='active')

        return queryset.order_by('-date')


class EnrollmentDetailAPIView(RetrieveAPIView):
    serializer_class = ReceptionistEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    queryset = EnrolledCourse.objects.select_related('course', 'teacher', 'user', 'user__user')


class EnrollmentCreateAPIView(CreateAPIView):
    serializer_class = EnrolledCourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user = request.user
        is_admin = user.is_staff
        is_receptionist = getattr(user, "user_type", None) == 'receptionist'

        if not (is_admin or is_receptionist):
            return Response({"error": "Only receptionists and admins can create enrollments"}, status=status.HTTP_403_FORBIDDEN)

        student_ids = request.data.get('student_ids', [])
        course_id = request.data.get('course_id')
        enrollment_days = int(request.data.get('enrollment_days', 30))

        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not student_ids:
            return Response({"error": "At least one student_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)

        # ✅ student_ids are USER IDs → Student.user_id
        student = get_object_or_404(Student, id=int(student_ids[0]))

        if EnrolledCourse.objects.filter(user=student, course=course).exists():
            return Response({"error": "User is already enrolled in this course"}, status=status.HTTP_400_BAD_REQUEST)

        start_date = timezone.now()
        end_date = start_date + timedelta(days=enrollment_days)
        from payment.models import Transaction

        user_id = student.user_id  # Student -> User.id (you use this style in bulk enrollment) :contentReference[oaicite:3]{index=3}

        paid_for_course = Transaction.objects.filter(
            student_id=user_id,
            status='successful',
            courses__course_id=course.course_id
        ).exists()

        if not paid_for_course:
            return Response(
                {"error": "Manual payment required before enrolling this course."},
                status=400
            )

        enrollment = EnrolledCourse.objects.create(
            user=student,
            course=course,
            teacher=course.teacher,
            order_item=None,
            date=start_date,
            ended_at=end_date,
            status='active'
        )

        serializer = self.get_serializer(enrollment)
        return Response({"message": "Enrollment created", "enrollment": serializer.data}, status=status.HTTP_200_OK)


class BulkEnrollmentCreateAPIView(CreateAPIView):
    serializer_class = BulkEnrollmentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user = request.user
        is_admin = user.is_staff
        is_receptionist = getattr(user, "user_type", None) == 'receptionist'

        if not (is_admin or is_receptionist):
            return Response({"error": "Only receptionists and admins can create enrollments"}, status=status.HTTP_403_FORBIDDEN)

        student_ids = request.data.get('student_ids', [])
        course_id = request.data.get('course_id')
        enrollment_days = int(request.data.get('enrollment_days', 30))

        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not student_ids:
            return Response({"error": "student_ids list required"}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)

        start_date = timezone.now()
        end_date = start_date + timedelta(days=enrollment_days)

        created = []
        failed = []

        for uid in student_ids:
            try:
                uid = int(uid)
                student = Student.objects.get(user_id=uid)  # ✅ USER ID
                if EnrolledCourse.objects.filter(user=student, course=course).exists():
                    failed.append({"student_user_id": uid, "reason": "Already enrolled"})
                    continue

                enrollment = EnrolledCourse.objects.create(
                    user=student,
                    course=course,
                    teacher=course.teacher,
                    order_item=None,
                    date=start_date,
                    ended_at=end_date,
                    status='active'
                )
                created.append({"student_user_id": uid, "enrollment_id": enrollment.enrollment_id})
            except Student.DoesNotExist:
                failed.append({"student_user_id": uid, "reason": "Student not found"})
            except Exception as e:
                failed.append({"student_user_id": uid, "reason": str(e)})

        return Response({
            "course_id": course.id,
            "course_title": course.title,
            "total_attempted": len(student_ids),
            "total_enrolled": len(created),
            "total_failed": len(failed),
            "created_enrollments": created,
            "failed_enrollments": failed
        }, status=status.HTTP_200_OK if created else status.HTTP_400_BAD_REQUEST)


class EnrollmentExpiringAPIView(ListAPIView):
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
        ).select_related('course', 'teacher', 'user', 'user__user').order_by('ended_at')


# ============================================================================
# ✅ STUDENT PORTAL ENDPOINTS
# ============================================================================

# In views.py

class StudentEnrolledCoursesListAPIView(ListAPIView):
    serializer_class = StudentEnrolledCoursesSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        try:
            self.student_instance = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            self.student_instance = None
            return EnrolledCourse.objects.none()

        return EnrolledCourse.objects.filter(
            user=self.student_instance
        ).select_related(
            'course', 'teacher', 'user', 'user__user'
        ).prefetch_related(
            'course__modules',
            'course__modules__lessons'
        ).order_by('-date')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        response = super().list(request, *args, **kwargs)

        student_instance = getattr(self, 'student_instance', None)
        active_count = EnrolledCourse.objects.filter(user=student_instance, status='active').count() if student_instance else 0

        # ✅ FIX: Handle case where response.data is a list (pagination off) or dict (pagination on)
        if isinstance(response.data, list):
            results = response.data
        else:
            results = response.data.get("results", response.data)

        response.data = {
            "summary": {
                "total_enrollments": len(results),
                "active_courses": active_count,
                "completed_courses": max(0, len(results) - active_count),
            },
            "results": results
        }
        return response


class StudentEnrolledCourseDetailAPIView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'course_id'
    lookup_url_kwarg = 'course_id'

    def get_serializer_class(self):
        return CourseSerializer

    def get_object(self):
        user = self.request.user
        course_id = self.kwargs.get('course_id')

        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            raise PermissionDenied("Student profile not found")

        enrollment = get_object_or_404(
            EnrolledCourse.objects.select_related('course'),
            user=student,
            course_id=course_id
        )

        if not enrollment.has_access():
            raise PermissionDenied("Your enrollment for this course has expired.")

        self.enrollment = enrollment
        return enrollment.course

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})

        enrollment = self.enrollment
        data = serializer.data
        data['enrollment'] = {
            'enrollment_id': enrollment.enrollment_id,
            'started_at': enrollment.date,
            'ends_at': enrollment.ended_at,
            'status': enrollment.status,
            'days_remaining': enrollment.days_remaining,
            'has_access': enrollment.has_access(),
            'is_expired': enrollment.is_expired,
        }
        return Response(data)


class StudentCourseProgressAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        enrollment = get_object_or_404(EnrolledCourse, user=student, course_id=course_id)
        if not enrollment.has_access():
            return Response({"error": "Access Denied"}, status=status.HTTP_403_FORBIDDEN)

        course = enrollment.course
        modules = Module.objects.filter(course=course).prefetch_related('lessons').order_by('order')

        completed_ids = set(
            CompletedLesson.objects.filter(
                user=request.user,
                lesson__module__course=course,
                completed=True
            ).values_list('lesson_id', flat=True)
        )

        total_lessons = Lesson.objects.filter(module__course=course).count()
        completed_count = len(completed_ids)
        progress = (completed_count / total_lessons * 100) if total_lessons else 0

        return Response({
            "course_id": course.id,
            "course_title": course.title,
            "total_lessons": total_lessons,
            "completed_lessons": completed_count,
            "progress_percentage": round(progress, 2),
            "enrollment": {
                "status": enrollment.status,
                "days_remaining": enrollment.days_remaining,
                "ends_at": enrollment.ended_at,
            }
        })


class StudentCourseLessonsAPIView(ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            return Lesson.objects.none()

        enrollment = get_object_or_404(EnrolledCourse, user=student, course_id=course_id)
        if not enrollment.has_access():
            return Lesson.objects.none()

        qs = Lesson.objects.filter(module__course_id=course_id).select_related('module').order_by('module__order', 'order')
        return qs


class StudentCourseModulesAPIView(ListAPIView):
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            return Module.objects.none()

        enrollment = get_object_or_404(EnrolledCourse, user=student, course_id=course_id)
        if not enrollment.has_access():
            return Module.objects.none()

        return Module.objects.filter(course_id=course_id).prefetch_related('lessons').order_by('order')


class ModuleAPIView(CreateAPIView):
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)

        if not request.user.is_staff and (not course.teacher or course.teacher.user != request.user):
            return Response({"error": "Only course teacher or admin can create modules"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data["course"] = course.id  # ensure FK
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request, *args, **kwargs):
        module_id = kwargs.get('module_id') or request.data.get('module_id')
        if not module_id:
            return Response({"error": "module_id is required for update"}, status=status.HTTP_400_BAD_REQUEST)

        module = get_object_or_404(Module, id=module_id)

        course = module.course
        if not request.user.is_staff and (not course.teacher or course.teacher.user != request.user):
            return Response({"error": "Only course teacher or admin can update modules"}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(module, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        module_id = kwargs.get('module_id') or request.data.get('module_id')
        if not module_id:
            return Response({"error": "module_id is required for delete"}, status=status.HTTP_400_BAD_REQUEST)

        module = get_object_or_404(Module, id=module_id)

        course = module.course
        if not request.user.is_staff and (not course.teacher or course.teacher.user != request.user):
            return Response({"error": "Only course teacher or admin can delete modules"}, status=status.HTTP_403_FORBIDDEN)

        module.delete()
        return Response({"message": "Module deleted"}, status=status.HTTP_200_OK)
    def get(self, request, *args, **kwargs):
    # ✅ accept course_id from URL (/teacher/modules/<course_id>) OR query (?course_id=)
        course_id = kwargs.get("course_id") or request.query_params.get("course_id")
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)

        # ✅ Teacher only can see own course modules (admin can see all)
        if not request.user.is_staff:
            teacher = get_object_or_404(Teacher, user=request.user)
            if not course.teacher or course.teacher != teacher:
                return Response({"error": "Only course teacher or admin can view modules"}, status=status.HTTP_403_FORBIDDEN)

        modules = (
            Module.objects.filter(course_id=course_id)
            .prefetch_related("lessons")
            .order_by("order")
        )

        return Response({
            "course": CourseSerializer(course, context={"request": request}).data,
            "modules": ModuleSerializer(modules, many=True, context={"request": request}).data
        }, status=status.HTTP_200_OK)


        


class LessonCreateAPIView(CreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        module_id = request.data.get('module')
        if not module_id:
            return Response({"error": "module field required"}, status=status.HTTP_400_BAD_REQUEST)

        module = get_object_or_404(Module, id=module_id)

        if not request.user.is_staff and module.course.teacher.user != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if "file" in request.FILES:
            lesson = serializer.save(document=request.FILES["file"])
        else:
            lesson = serializer.save()

        return Response(self.get_serializer(lesson).data, status=status.HTTP_200_OK)

    


    def put(self, request, *args, **kwargs):
        lesson_id = kwargs.get("id") or kwargs.get("lesson_id") or request.data.get("lesson_id") or request.data.get("id")
        if not lesson_id:
            return Response({"error": "id is required for update"}, status=status.HTTP_400_BAD_REQUEST)

        lesson = get_object_or_404(Lesson, id=lesson_id)
        module = lesson.module

        if not request.user.is_staff and module.course.teacher.user != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        if "file" in request.FILES:
            data["content_url_or_text"] = f"/media/{request.FILES['file'].name}"

        serializer = self.get_serializer(lesson, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


    def delete(self, request, *args, **kwargs):
        lesson_id = kwargs.get("id") or kwargs.get("lesson_id") or request.data.get("lesson_id") or request.data.get("id")
        if not lesson_id:
            return Response({"error": "id is required for delete"}, status=status.HTTP_400_BAD_REQUEST)

        lesson = get_object_or_404(Lesson, id=lesson_id)
        module = lesson.module

        if not request.user.is_staff and module.course.teacher.user != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        lesson.delete()
        return Response({"message": "Lesson deleted"}, status=status.HTTP_200_OK)


    def get(self, request, *args, **kwargs):
        lesson_id = kwargs.get("id") or kwargs.get("lesson_id") or request.query_params.get("lesson_id") or request.query_params.get("id")
        if not lesson_id:
            return Response({"error": "id is required"}, status=status.HTTP_400_BAD_REQUEST)

        lesson = get_object_or_404(Lesson, id=lesson_id)
        serializer = self.get_serializer(lesson)
        return Response(serializer.data, status=status.HTTP_200_OK)

    

class TeacherStudentEnrollmentListAPIView(ListAPIView):
    serializer_class = ReceptionistEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Get the data
        enrollments = EnrolledCourse.objects.filter(
            teacher__user=request.user
        ).select_related('user', 'user__user', 'course').order_by('-date')
        
        # 2. Serialize the data
        # 'many=True' is required because we are returning a list
        serializer = ReceptionistEnrollmentSerializer(enrollments, many=True)
        
        # 3. Return a Response object (not the queryset!)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TeacherDashboardStatsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response({"error": "Teacher profile not found"}, status=404)

        # 1. Total Counts
        total_lessons = Lesson.objects.filter(module__course__teacher=teacher).count()
        total_quizzes = Quiz.objects.filter(lesson__module__course__teacher=teacher).count()
        
        # 2. Bar Chart Data
        courses = Course.objects.filter(teacher=teacher)
        chart_data = []
        for course in courses:
            student_count = EnrolledCourse.objects.filter(course=course).count()
            chart_data.append({
                "name": course.title[:15] + "..." if len(course.title) > 15 else course.title,
                "students": student_count
            })

        # 3. Upcoming Classes (Live Sessions)
        upcoming_sessions = LiveSession.objects.filter(
            course__teacher=teacher, 
            is_completed=False
        ).order_by('date', 'time')[:5]
        
        upcoming_data = [
            {
                "id": session.id,
                "name": session.course.title,
                "topic": session.title,
                "time": f"{session.date} at {session.time}",
                # ✅ FIX: Change 'meeting_link' to 'join_url'
                "link": session.join_url 
            } for session in upcoming_sessions
        ]

        return Response({
            "total_lessons": total_lessons,
            "total_quizzes": total_quizzes,
            "chart_data": chart_data,
            "upcoming_classes": upcoming_data
        })

from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .models import Assignment, Quiz, QuizQuestion, Lesson
from .serializers import AssignmentSerializer, QuizSerializer, QuizQuestionSerializer

class AssignmentListCreateAPIView(ListCreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        lesson_id = self.request.query_params.get("lesson")
        qs = Assignment.objects.all()
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)
        return qs

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, id=self.request.data.get("lesson"))
        if not self.request.user.is_staff and lesson.module.course.teacher.user != self.request.user:
            raise PermissionDenied("Permission denied")
        serializer.save()


# backend/course/views.py

class AssignmentDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    queryset = Assignment.objects.all()

    def get_object(self):
        pk = self.kwargs.get('pk')
        assignment = Assignment.objects.filter(pk=pk).first()
        if not assignment:
            assignment = get_object_or_404(Assignment, lesson_id=pk)
        self.check_object_permissions(self.request, assignment)
        
        return assignment
    def perform_destroy(self, instance):
        # Delete the parent Lesson to remove it completely from the module list
        if instance.lesson:
            instance.lesson.delete()
        else:
            instance.delete()


class QuizDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Quiz.objects.all()

    def get_object(self):
        pk = self.kwargs.get('pk')

        quiz = Quiz.objects.filter(pk=pk).first()

        if not quiz:
            quiz = get_object_or_404(Quiz, lesson_id=pk)

        self.check_object_permissions(self.request, quiz)
        
        return quiz
    def perform_destroy(self, instance):
        # Delete the parent Lesson. 
        # Because of on_delete=models.CASCADE in models.py, this will also delete the Quiz instance.
        if instance.lesson:
            instance.lesson.delete()
        else:
            instance.delete()

class QuizListCreateAPIView(ListCreateAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        lesson_id = self.request.query_params.get("lesson")
        qs = Quiz.objects.all()
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)
        return qs

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, id=self.request.data.get("lesson"))
        if not self.request.user.is_staff and lesson.module.course.teacher.user != self.request.user:
            raise PermissionDenied("Permission denied")
        serializer.save()




# ... imports ...
from rest_framework.parsers import MultiPartParser, FormParser 
# ...

class QuizQuestionListCreateAPIView(ListCreateAPIView):
    serializer_class = QuizQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    # ✅ Add parsers to handle image uploads
    parser_classes = (MultiPartParser, FormParser) 

    def get_queryset(self):
        quiz_id = self.request.query_params.get("quiz")
        qs = QuizQuestion.objects.all()
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs

    def perform_create(self, serializer):
        # ... existing logic ...
        quiz = get_object_or_404(Quiz, id=self.request.data.get("quiz"))
        lesson = quiz.lesson
        if not self.request.user.is_staff and lesson.module.course.teacher.user != self.request.user:
            raise PermissionDenied("Permission denied")
        serializer.save()

class QuizQuestionDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = QuizQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    # ✅ Add parsers here too for updates
    parser_classes = (MultiPartParser, FormParser)
    queryset = QuizQuestion.objects.all()


# course/views.py

# ... existing imports ...
from .models import CompletedLesson

class StudentDashboardStatsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)

        now = timezone.now()
        today = now.date()

        # 1. Active Courses (Existing logic)
        enrolled_courses = EnrolledCourse.objects.filter(user=student, status='active')
        courses_data = []
        
        for enrollment in enrolled_courses:
            course = enrollment.course
            total_lessons = Lesson.objects.filter(module__course=course).count()
            completed_count = CompletedLesson.objects.filter(
                user=request.user, 
                lesson__module__course=course,
                completed=True
            ).count()
            
            progress = (completed_count / total_lessons * 100) if total_lessons > 0 else 0
            
            next_session = LiveSession.objects.filter(
                course=course, 
                date__gte=today,
                is_completed=False
            ).order_by('date', 'time').first()

            courses_data.append({
                "id": course.id,
                "name": course.title,
                "instructor": course.teacher.user.username if course.teacher else "Staff",
                "progress": round(progress),
                "nextClass": f"{next_session.date} at {next_session.time}" if next_session else "No upcoming classes",
                "color": "blue" 
            })

        # 2. Upcoming Assignments (Existing logic)
        assignments = Assignment.objects.filter(
            lesson__module__course__enrolledcourse__user=student,
            lesson__module__course__enrolledcourse__status='active',
            due_date__gte=now
        ).order_by('due_date')[:5]

        assignments_data = [{
            "id": a.id,
            "title": a.title,
            "course": a.lesson.module.course.title,
            "due": a.due_date.strftime("%Y-%m-%d"),
            "status": "urgent" if (a.due_date.date() - today).days <= 2 else "normal"
        } for a in assignments]

        # 3. Upcoming/Incomplete Quizzes (✅ NEW CODE)
        # Fetch quizzes from active courses that are NOT marked as completed by this user
        quizzes = Quiz.objects.filter(
            lesson__module__course__enrolledcourse__user=student,
            lesson__module__course__enrolledcourse__status='active'
        ).exclude(
            lesson__completedlesson__user=request.user,
            lesson__completedlesson__completed=True
        ).order_by('created_at')[:5]

        quizzes_data = [{
            "id": q.id,
            "title": q.title,
            "course": q.lesson.module.course.title,
            "time_limit": f"{q.time_limit} mins" if q.time_limit else "No limit",
            "attempts": q.attempts
        } for q in quizzes]

        # 4. Today's Schedule (Existing logic)
        todays_sessions = LiveSession.objects.filter(
            course__enrolledcourse__user=student,
            course__enrolledcourse__status='active',
            date=today
        ).order_by('time')

        schedule_data = [{
            "id": s.id,
            "title": s.course.title,
            "time": s.time.strftime("%I:%M %p"),
            "location": "Online (Zoom)",
            "link": s.join_url
        } for s in todays_sessions]

        return Response({
            "courses": courses_data,
            "upcoming_assignments": assignments_data,
            "upcoming_quizzes": quizzes_data, # ✅ Return new data
            "todays_schedule": schedule_data
        })
# views.py

from .models import AssignmentSubmission, QuizAttempt, Student
from .serializers import AssignmentSubmissionSerializer, QuizAttemptSerializer
# In views.py

# 1. Add imports at the top
from .utils import extract_text_from_file, check_plagiarism, check_web_plagiarism

class SubmitAssignmentAPIView(CreateAPIView):
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        # Override create to handle re-submissions (Update vs Create)
        student = get_object_or_404(Student, user=request.user)
        assignment_id = request.data.get('assignment')
        
        # Check if submission exists
        existing_submission = AssignmentSubmission.objects.filter(
            student=student, 
            assignment_id=assignment_id
        ).first()

        if existing_submission:
            serializer = self.get_serializer(existing_submission, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer) # Run the logic
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK if existing_submission else status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        student = get_object_or_404(Student, user=self.request.user)
        assignment_id = self.request.data.get('assignment')
        uploaded_file = self.request.FILES.get('file')

        final_score = 0.0
        current_text = ""
        matched_source_text = ""
        internal_score = 0.0
        external_score = 0.0
        
        report_data = {
            "internalMatches": [],
            "externalSources": [],
            "matched_source_text": "",
            "evidence": {} 
        }

        if uploaded_file and assignment_id:
            # 1. Extract Text
            current_text = extract_text_from_file(uploaded_file)
            
            if current_text:
                # -------------------------------------------------------
                # 2. INTERNAL CHECK (Previous Students)
                # -------------------------------------------------------
                other_submissions = AssignmentSubmission.objects.filter(
                    assignment_id=assignment_id
                ).exclude(student=student)

                previous_texts = []
                for sub in other_submissions:
                    # Optimization: Use saved text if available, else read file
                    if hasattr(sub, 'extracted_text') and sub.extracted_text:
                        previous_texts.append(sub.extracted_text)
                    elif sub.file:
                        try:
                            with sub.file.open('rb') as f:
                                t = extract_text_from_file(f)
                                if t: previous_texts.append(t)
                        except Exception:
                            continue
                
                # Check plagiarism (returns dict: {'score': float, 'matched_text': str})
                internal_result = check_plagiarism(current_text, previous_texts)
                
                # Handle dictionary response from updated utils.py
                if isinstance(internal_result, dict):
                    internal_score = internal_result.get('score', 0.0)
                    matched_source_text = internal_result.get('matched_text', "")
                else:
                    # Fallback if utils returns just a float
                    internal_score = internal_result

                # -------------------------------------------------------
                # 3. EXTERNAL CHECK (Google / Web)
                # -------------------------------------------------------
                external_sources = check_web_plagiarism(current_text)
                report_data["externalSources"] = external_sources
                
                # Calculate max score from external sources
                if external_sources:
                    external_score = max([s['similarityPercent'] for s in external_sources])

                # -------------------------------------------------------
                # 4. FINAL CALCULATION
                # -------------------------------------------------------
                # Take the higher of the two scores
                final_score = max(internal_score, external_score)
                
                # If internal match was higher/exists, save the text for comparison
                if internal_score >= external_score:
                    report_data['matched_source_text'] = matched_source_text
                else:
                    # If web match is higher, you might want to show the URL snippet instead
                    # For now, we leave matched_source_text empty or set a message
                    if external_sources:
                         report_data['matched_source_text'] = f"Top match found on web: {external_sources[0]['url']}"

        # 5. Save Score AND the Report JSON AND Extracted Text
        serializer.save(
            student=student, 
            plagiarism_score=final_score,
            plagiarism_report=report_data,
            extracted_text=current_text 
        )
class SubmitQuizAPIView(CreateAPIView):
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        student = get_object_or_404(Student, user=self.request.user)
        serializer.save(student=student)

# --- Grading Views (Teacher) ---

class TeacherGradingListAPIView(ListAPIView):
    # Returns all submissions for a specific course or assignment
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Filter by assignment_id if provided
        assignment_id = request.query_params.get('assignment_id')
        if assignment_id:
             submissions = AssignmentSubmission.objects.filter(assignment_id=assignment_id)
             return Response(AssignmentSubmissionSerializer(submissions, many=True).data)
        return Response([])

class GradeSubmissionAPIView(UpdateAPIView):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        # Allow teacher to update grade and feedback
        serializer.save()

from django.db.models import Avg


class StudentCourseReviewListCreateAPIView(ListCreateAPIView):
  
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')

        # Optional: only if student is enrolled
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            raise PermissionDenied("Student profile not found")

        enrollment = get_object_or_404(
            EnrolledCourse,
            user=student,
            course_id=course_id
        )

        if not enrollment.has_access():
            raise PermissionDenied("Your enrollment for this course has expired.")

        return Review.objects.filter(course_id=course_id, active=True).select_related("user")

    def perform_create(self, serializer):
        """
        Called automatically on POST.
        Attach course + user here instead of expecting them in the request body.
        """
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, pk=course_id)

        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            raise PermissionDenied("Student profile not found")

        enrollment = get_object_or_404(
            EnrolledCourse,
            user=student,
            course=course
        )

        if not enrollment.has_access():
            raise PermissionDenied("Your enrollment for this course has expired.")

        # ensure only one review per user per course (optional)
        Review.objects.filter(course=course, user=self.request.user).delete()

        serializer.save(
            course=course,
            user=self.request.user,
            active=True,
        )

from rest_framework.generics import RetrieveUpdateDestroyAPIView

# --- 1. Student Review Management (Edit/Delete) ---
class StudentReviewDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only edit/delete their OWN reviews
        return Review.objects.filter(user=self.request.user)

# --- 2. Student Feedback Management (Edit/Delete) ---

class TeacherReviewReplyAPIView(UpdateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self):
        teacher = get_object_or_404(Teacher, user=self.request.user)
        # Teacher can only reply to reviews on their courses
        return Review.objects.filter(course__teacher=teacher)

    def put(self, request, *args, **kwargs):
        review = self.get_object()
        reply = request.data.get("reply")
        if reply is not None:
            review.reply = reply
        if "active" in request.data:
            review.active = bool(request.data.get("active"))
        review.save()
        serializer = self.get_serializer(review)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        # just use partial
        return self.partial_update(request, *args, **kwargs)
    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from django.utils import timezone
import shortuuid # Make sure you have this installed: pip install shortuuid

from .models import Course, LiveSession, LiveAttendance, EnrolledCourse
from lms.models import Teacher, Student
from .serializers import LiveSessionSerializer

class CreateLiveSessionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        title = request.data.get('title')
        date = request.data.get('date') # YYYY-MM-DD
        time = request.data.get('time') # HH:MM

        course = get_object_or_404(Course, id=course_id)

        if not request.user.is_staff:
            try:
                teacher = Teacher.objects.get(user=request.user)
                if course.teacher != teacher:
                    return Response({"error": "Unauthorized"}, status=403)
            except Teacher.DoesNotExist:
                return Response({"error": "Unauthorized"}, status=403)

        try:
            clean_title = "".join(e for e in course.title if e.isalnum())
            unique_id = shortuuid.uuid()[:8]
            room_name = f"Sipsara_{clean_title}_{unique_id}"

            # 2. Construct the URL (Using public Jitsi server)
            # You can change 'https://meet.jit.si' to your own domain if self-hosting
            jitsi_url = f"https://meet.jit.si/{room_name}"
            
            # 3. Save to DB
            session = LiveSession.objects.create(
                course=course,
                title=title,
                date=date,
                time=time,
                meeting_id=room_name,  # Storing room name as ID
                join_url=jitsi_url,
                start_url=jitsi_url    # Jitsi links are same for host/student usually
            )

            return Response(LiveSessionSerializer(session).data, status=201)

        except Exception as e:
            return Response({"error": f"Error creating session: {str(e)}"}, status=500)

# --- 2. List Sessions (Unchanged) ---
class LiveSessionListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        user = request.user
        has_access = False
        
        # Check Teacher
        if hasattr(user, 'teacher_profile') and course.teacher.user == user:
            has_access = True
        # Check Student
        elif Student.objects.filter(user=user).exists():
            student = Student.objects.get(user=user)
            if EnrolledCourse.objects.filter(course=course, user=student, status='active').exists():
                has_access = True
        # Check Admin
        if user.is_staff: has_access = True

        if not has_access:
            return Response({"error": "Access denied."}, status=403)

        sessions = LiveSession.objects.filter(course=course).order_by('-date', '-time')
        return Response(LiveSessionSerializer(sessions, many=True).data)

# --- 3. Join & Mark Attendance (Unchanged) ---
class MarkAttendanceAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        session = get_object_or_404(LiveSession, id=session_id)

        try:
            student = Student.objects.get(user=request.user)
            # Mark Attendance
            LiveAttendance.objects.get_or_create(session=session, student=student, defaults={'status': 'present', 'join_time': timezone.now()})
            return Response({"join_url": session.join_url}, status=200)
        except Student.DoesNotExist:
            # If teacher clicks join, just return URL without attendance
            return Response({"join_url": session.join_url}, status=200)

# backend/course/views.py

# backend/course/views.py

# backend/course/views.py

class StudentCourseFeedbackListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        # Fetch all feedback threads for the course
        feedback = Question_Answer.objects.filter(course_id=course_id).order_by('-date')
        serializer = Question_AnswerSerializer(feedback, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        serializer = Question_AnswerSerializer(data=request.data)
        
        if serializer.is_valid():
            # ✅ Fix: Only save valid fields (course, user). Do NOT pass 'lesson'.
            serializer.save(course=course, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StudentFeedbackDetailAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = Question_AnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Question_Answer.objects.all()

    def get_object(self):
        pk = self.kwargs.get('pk')
        # Ensure the user owns the feedback they are trying to edit/delete
        qa = get_object_or_404(Question_Answer, pk=pk)
        if qa.user != self.request.user:
            raise PermissionDenied("You can only edit or delete your own feedback.")
        return qa

class StudentFeedbackReplyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # ✅ GET: List all replies for a specific feedback thread
    def get(self, request, course_id, qa_id):
        # Ensure course and question exist
        get_object_or_404(Course, pk=course_id)
        get_object_or_404(Question_Answer, pk=qa_id)

        # Fetch messages for this thread
        replies = Question_Answer_Message.objects.filter(question_id=qa_id).order_by('date')
        serializer = Question_Answer_MessageSerializer(replies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ✅ POST: Create a new reply
    def post(self, request, course_id, qa_id):
        course = get_object_or_404(Course, pk=course_id)
        qa = get_object_or_404(Question_Answer, pk=qa_id)
        
        # Ensure we set 'question' (parent thread) AND 'course'
        msg = Question_Answer_Message.objects.create(
            course=course,
            question=qa,
            user=request.user,
            message=request.data.get('message')
        )
        
        return Response({"message": "Reply added", "id": msg.id}, status=status.HTTP_201_CREATED)


# --- 2. Edit & Delete Specific Reply (Message Level) ---
class StudentFeedbackReplyDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        # Get message and ensure ownership
        msg = get_object_or_404(Question_Answer_Message, pk=pk)
        if msg.user != user:
            raise PermissionDenied("You cannot modify this reply.")
        return msg

    # ✅ PUT: Update a specific reply
    def put(self, request, course_id, qa_id, pk):
        msg = self.get_object(pk, request.user)
        
        serializer = Question_Answer_MessageSerializer(msg, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ DELETE: Delete a specific reply
    def delete(self, request, course_id, qa_id, pk):
        msg = self.get_object(pk, request.user)
        msg.delete()
        return Response({"message": "Reply deleted"}, status=status.HTTP_204_NO_CONTENT)
def is_admin(user):
    return bool(user and user.is_staff)

def get_teacher(user):
    if not user.is_authenticated: return None
    try:
        return Teacher.objects.get(user=user)
    except Teacher.DoesNotExist:
        return None

def get_student(user):
    if not user.is_authenticated: return None
    try:
        return Student.objects.get(user=user)
    except Student.DoesNotExist:
        return None

# --- Complaint Views ---

class ComplaintCourseAPIView(APIView):
    """
    GET: List complaints for a course 
    - Admin: All complaints
    - Teacher: Complaints for courses they teach
    - Student: Only their own complaints
    POST: Create a complaint (Student only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)

        # 1. Admin Logic
        if is_admin(request.user):
            qs = Complaint.objects.filter(course=course)
            return Response(ComplaintSerializer(qs, many=True).data)

        # 2. Teacher Logic
        teacher = get_teacher(request.user)
        if teacher:
            # Check if this course belongs to this teacher
            if course.teacher == teacher:
                qs = Complaint.objects.filter(course=course)
                return Response(ComplaintSerializer(qs, many=True).data)

        # 3. Student Logic
        # (Allows students to see their previous complaints)
        qs = Complaint.objects.filter(course=course, user=request.user)
        return Response(ComplaintSerializer(qs, many=True).data)

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        
        # Security: Admins shouldn't be submitting student complaints
        if is_admin(request.user):
             return Response({"error": "Admins cannot submit student complaints."}, status=400)

        # Security: Check Enrollment
        if not EnrolledCourse.objects.filter(user__user=request.user, course=course, status='active').exists():
             return Response({"error": "You must be enrolled in this course to submit a complaint."}, status=403)

        send_to = request.data.get("send_to", "teacher")
        if send_to not in ["admin", "teacher"]:
            send_to = "teacher"

        # Auto-assign the teacher if sent to teacher
        teacher_obj = course.teacher if send_to == "teacher" else None

        serializer = ComplaintSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                user=request.user,
                course=course,
                send_to=send_to,
                teacher=teacher_obj,
                status="open",
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ComplaintDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        obj = get_object_or_404(Complaint, pk=pk)

        # Admin Access
        if is_admin(request.user):
            return obj
        
        # Teacher Access (Owner of course)
        teacher = get_teacher(request.user)
        if teacher and obj.course.teacher == teacher:
            return obj

        # Student Access (Owner of complaint)
        if obj.user == request.user:
            return obj

        raise PermissionDenied("You do not have permission to access this complaint.")

    def get(self, request, pk):
        obj = self.get_object(request, pk)
        return Response(ComplaintSerializer(obj).data)

    def put(self, request, pk):
        # Used for full updates (e.g. Teacher replying and closing ticket)
        obj = self.get_object(request, pk)
        serializer = ComplaintUpdateSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        # Partial update
        obj = self.get_object(request, pk)
        serializer = ComplaintUpdateSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self.get_object(request, pk)
        # Only Admin or the Creator can delete
        if is_admin(request.user) or obj.user == request.user:
            obj.delete()
            return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
        
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    
# Add this class to your views.py
# backend/course/views.py

class PlagiarismReportListAPIView(ListAPIView):
    serializer_class = PlagiarismReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Teachers: See submissions for their courses
        if hasattr(user, 'teacher_profile'):
            return AssignmentSubmission.objects.filter(
                assignment__lesson__module__course__teacher__user=user
            ).order_by('-submitted_at')
            
        # 2. Admins: See ALL submissions
        elif user.is_staff:
            return AssignmentSubmission.objects.all().order_by('-submitted_at')
            
        return AssignmentSubmission.objects.none()