from rest_framework import serializers

from .models import (
    Course, EnrolledCourse, Variant, VariantItem,
    CompletedLesson, Note, Review, Question_Answer,
    Question_Answer_Message, Module, Lesson
)

from lms.models import Teacher, Profile, Student # Student added for clean access in serializers

 
# --- Helper Serializers for Nested Fields (Read-Only) ---

 
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_id', 'full_name', 'image']

 
class TeacherCourseSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    teacher_id = serializers.IntegerField(source='user_id', read_only=True)

 
    class Meta:
        model = Teacher
        fields = ['teacher_id', 'username', 'full_name']

   
    def get_full_name(self, obj):
        """Safely get full name from teacher."""
        try:
            if hasattr(obj.user, 'profile'):
                return obj.user.profile.full_name
            return obj.user.get_full_name() or obj.user.username
        except Exception:
            return obj.user.username

 
# --- Course Serializers ---

 
class CourseSerializer(serializers.ModelSerializer):
    """Serializer for reading/listing Course data (GET requests)."""
   
    teacher = TeacherCourseSerializer(read_only=True)
   
    # ✅ ADD THIS: Make teacher_id directly accessible (not nested)
    # Maps to the foreign key teacher's user_id
    teacher_id = serializers.IntegerField(
        source='teacher.user_id',
        read_only=True,
        help_text="Teacher's user ID for easy access without nesting"
    )
   
    date = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    department = serializers.CharField(source='Department', read_only=True)
   
    # Get computed properties from the model
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

 
    class Meta:
        model = Course
        fields = [
            "id",  # ✅ ADD THIS: Django primary key (was missing)
            "course_id",
            "slug",
            "title",
            "description",
            "price",
            "teacher",
            "teacher_id",  # ✅ ADD THIS: Top-level teacher_id (was nested)
            "image",
            "file",
            "level",
            "language",
            "platform_status",
            "featured",
            "date",
            "updated_at",
            "is_enrolled",
            "department",
            "average_rating",
            "rating_count",
            "assignment_status",  # ✅ IMPORTANT: Include assignment_status
            "student_count",
            "teacher_course_status"
        ]

   
    def get_average_rating(self, obj):
        try:
            return obj.average_rating()
        except Exception:
            return None

   
    def get_rating_count(self, obj):
        try:
            return obj.rating_count()
        except Exception:
            return 0

 
    def get_student_count(self, obj):
        try:
            return obj.students()
        except Exception:
            return 0

   
    """
    FIXED: get_is_enrolled() method for CourseSerializer
    
    Properly handles the type mismatch:
    - EnrolledCourse.user expects a Student instance
    - request.user is a User instance
    - This method gets the Student from the User before querying
    """
    def get_is_enrolled(self, obj):
        """
        ✅ FIXED: Check if current user is enrolled in this course
        
        Args:
            obj: The Course object being serialized
            
        Returns:
            bool: True if user is enrolled, False otherwise
        """
        request = self.context.get("request")
        
        # Early return if no request or user not authenticated
        if not request or not request.user.is_authenticated:
            return False
        
        try:
            # ✅ KEY FIX: Get the Student instance from the authenticated User
            student = Student.objects.get(user=request.user)
            
            # ✅ Now query with the correct type (Student instance)
            return EnrolledCourse.objects.filter(
                user=student,  # ✅ Pass Student instance, not User
                course=obj
            ).exists()
        
        except Student.DoesNotExist:
            # User is authenticated but not registered as a student
            return False
        
        except Exception as e:
            # Log any unexpected errors
            print(f"Error checking enrollment for user {request.user}: {e}")
            return False

 
class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ['lesson_id', 'date', 'module']

 
class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
   
    class Meta:
        model = Module
        fields = ['id', 'module_id', 'course', 'title', 'order', 'date', 'lessons']
        read_only_fields = ['module_id', 'date', 'course']

 
class InstructorNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['First_Name', 'Last_Name']

 
# ✅ ADMIN COURSE CREATION SERIALIZER
class AdminCourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin creating courses and assigning to teachers."""
    Department = serializers.CharField(max_length=200, required=True)

 
    # Teacher assignment (admin sends teacher id → Teacher model FK)
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        write_only=True,
        required=True,
        help_text="Select the teacher to assign this course"
    )

 
    image = serializers.ImageField(required=False, allow_null=True)
    file = serializers.CharField(required=False, allow_blank=True, allow_null=True)

 
    class Meta:
        model = Course
        fields = [
            "title", "description", "price", "language", "level",
            "Department", "platform_status", "featured",
            "image", "file", "teacher"
        ]

 
    def create(self, validated_data):
        # Teacher is already assigned from request data
        # Set assignment_status to 'pending' since admin created it
        validated_data['assignment_status'] = 'pending'
        return super().create(validated_data)

 
class CourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for teacher creating courses (deprecated but kept for backward compatibility)."""
    Department = serializers.CharField(max_length=200, required=True)

 
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        write_only=True,
        required=True
    )

 
    image = serializers.ImageField(required=False, allow_null=True)
    file = serializers.CharField(required=False, allow_blank=True, allow_null=True)

 
    class Meta:
        model = Course
        fields = [
            "title", "description", "price", "language", "level",
            "Department", "platform_status", "featured",
            "image", "file", "instructor"
        ]

 
    def create(self, validated_data):
        instructor = validated_data.pop("instructor")
        validated_data["teacher"] = instructor
        return super().create(validated_data)

 
class courselistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

 
    def get_teacher_full_name(self, obj):
        """Combines the teacher's First_Name and Last_Name."""
        teacher = obj.teacher
        if teacher:
            return f"{teacher.First_Name} {teacher.Last_Name}"
        return "N/A"

 
# --- Enrolled Course ---
class EnrolledCourseSerializer(serializers.ModelSerializer):
    """
    ✅ UPDATED: Complete EnrolledCourse serializer with access management
    - Shows enrollment status (active/expired)
    - Shows expiration date and days remaining
    - Includes has_access status
    """
    course = CourseSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()
    started_at = serializers.DateTimeField(source='date', read_only=True)

    class Meta:
        model = EnrolledCourse
        fields = [
            "id",
            "enrollment_id", 
            "course", 
            "course_id",
            "user",
            "teacher",
            "order_item",
            "started_at",
            "ended_at",
            "status",
            "is_expired",
            "days_remaining",
            "has_access",
            "date"
        ]
        read_only_fields = ['enrollment_id', 'date', 'status']

    def get_course_id(self, obj):
        """Get course ID"""
        return obj.course.id
    
    def get_is_expired(self, obj):
        """Check if enrollment is expired"""
        return obj.is_expired
    
    def get_days_remaining(self, obj):
        """Get days remaining until expiration"""
        return obj.days_remaining
    
    def get_has_access(self, obj):
        """Check if student has access"""
        return obj.has_access()


# UPDATED StudentEnrolledCoursesSerializer using lms_student table
class StudentInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for Student info from lms_student table
    Includes: user_id, full_name, email, phone, etc.
    """
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = ['user_id', 'username', 'email', 'full_name']
    
    def get_full_name(self, obj):
        """Get student full name from Profile"""
        try:
            if hasattr(obj.user, 'profile') and obj.user.profile:
                return obj.user.profile.full_name or obj.user.username
            return obj.user.get_full_name() or obj.user.username
        except:
            return obj.user.username if obj.user else "Unknown"


class StudentEnrolledCoursesSerializer(serializers.ModelSerializer):
    """
    ✅ FIXED: Complete serializer for student dashboard
    
    Uses lms_student table to get student info with user_id
    - Shows course info with all required fields
    - Shows access status
    - Shows expiration warning
    - Includes days remaining and access status
    - NOW USES lms_student TABLE FOR STUDENT INFO ✅
    """
    # Course Details
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    course_level = serializers.CharField(source='course.level', read_only=True)
    course_image = serializers.SerializerMethodField(read_only=True)
    
    # Teacher Details
    teacher_name = serializers.SerializerMethodField()
    teacher_id = serializers.IntegerField(source='teacher.user_id', read_only=True, required=False)
    
    # Student Details from lms_student table ✅ FIXED BELOW
    user_id = serializers.IntegerField(source='user.user.id', read_only=True, required=False) # ✅ FIX: user -> user -> id
    student_id = serializers.IntegerField(source='user.user.id', read_only=True, required=False) # ✅ FIX: user -> user -> id
    student_username = serializers.CharField(source='user.user.username', read_only=True, required=False) # ✅ FIX: user -> user -> username
    student_email = serializers.CharField(source='user.user.email', read_only=True, required=False) # ✅ FIX: user -> user -> email
    student_name = serializers.SerializerMethodField()
    
    # Student detailed info from lms_student if available
    student_info = serializers.SerializerMethodField()
    
    # Status & Dates
    is_expired = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()
    started_at = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = EnrolledCourse
        fields = [
            'id',
            'enrollment_id',
            # Course info
            'course_id',
            'course_title',
            'course_level',
            'course_image',
            # Teacher info
            'teacher_id',
            'teacher_name',
            # Student/User info from lms_student ✅
            'user_id',
            'student_id',
            'student_username',
            'student_email',
            'student_name',
            'student_info',
            # Dates & Status
            'started_at',
            'ended_at',
            'status',
            'status_display',
            'is_expired',
            'days_remaining',
            'has_access'
        ]
        read_only_fields = fields

    def get_course_image(self, obj):
        """Get course image URL"""
        if obj.course and obj.course.image:
            try:
                # Use request context to build full URL if needed
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.course.image.url)
                return obj.course.image.url
            except:
                return None
        return None

    def get_teacher_name(self, obj):
        """Get teacher full name with proper fallback"""
        if not obj.teacher:
            return "N/A"
        try:
            # The Teacher model has a direct FK to User, likely called 'user'
            if hasattr(obj.teacher.user, 'profile'):
                return obj.teacher.user.profile.full_name or obj.teacher.user.username
            return obj.teacher.user.get_full_name() or obj.teacher.user.username
        except:
            return obj.teacher.user.username if hasattr(obj.teacher, 'user') else "Unknown"

    def get_student_name(self, obj):
        """Get student full name from lms_student Profile ✅"""
        if not obj.user:
            return "Unknown"
        try:
            # obj.user is the Student instance. obj.user.user is the User instance.
            user = obj.user.user
            
            # Fallback to Profile
            if hasattr(user, 'profile') and user.profile:
                return user.profile.full_name or user.username
            
            # Fallback to User methods
            return user.get_full_name() or user.username
        except:
            return obj.user.user.username if hasattr(obj.user, 'user') else "Unknown"

    def get_student_info(self, obj):
        """
        Get complete student info from lms_student table
        Returns the student record with all fields
        """
        if not obj.user:
            return None
        
        try:
            # Try to fetch the Student record with related User/Profile
            student = Student.objects.select_related('user', 'user__profile').get(id=obj.user.id)
            return StudentInfoSerializer(student).data
        except Student.DoesNotExist:
            # If no student record, return basic user info
            user = obj.user.user
            return {
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.get_full_name() or user.username
            }
        except Exception as e:
            # print(f"Error fetching student info: {e}")
            return None

    def get_started_at(self, obj):
        """Return date in ISO format"""
        return obj.date.isoformat() if obj.date else None

    def get_is_expired(self, obj):
        """Check if enrollment is expired"""
        return obj.is_expired

    def get_days_remaining(self, obj):
        """Get days remaining in enrollment"""
        from datetime import datetime, timezone
        if not obj.ended_at:
            return None
        
        try:
            now = datetime.now(timezone.utc)
            
            # Ensure ended_at has a timezone if now does
            if obj.ended_at and obj.ended_at.tzinfo is None:
                obj.ended_at = obj.ended_at.replace(tzinfo=timezone.utc)
            
            if obj.ended_at and now > obj.ended_at:
                return 0
            
            delta = obj.ended_at - now
            return delta.days
        except Exception:
            return None

    def get_has_access(self, obj):
        """Check if student still has access to course"""
        return obj.has_access()

    def get_status_display(self, obj):
        """Return readable status"""
        if obj.is_expired:
            return "Expired"
        return "Active"


class ReceptionistEnrollmentSerializer(serializers.ModelSerializer):
    """
    ✅ CORRECTED: For receptionist view: Full enrollment details with student info
    NOTE: Assuming Receptionist view's EnrolledCourse.user field is a Student object.
    """
    # FIX: Explicitly traverse to the User object's attributes for robustness
    student_name = serializers.CharField(source='user.user.username', read_only=True) 
    student_email = serializers.CharField(source='user.user.email', read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()
    started_at = serializers.DateTimeField(source='date', read_only=True)

    class Meta:
        model = EnrolledCourse
        fields = [
            'id',
            'enrollment_id',
            'user',
            'course_id',
            'course_title',
            'student_name',
            'student_email',
            'teacher_name',
            'started_at',
            'ended_at',
            'status',
            'is_expired',
            'days_remaining',
            'has_access',
        ]

    def get_teacher_name(self, obj):
        """Get teacher name - with fallbacks for different structures"""
        try:
            if obj.teacher:
                # The Teacher model has a direct FK to User, likely called 'user'
                if hasattr(obj.teacher.user, 'profile'):
                    return obj.teacher.user.profile.full_name or obj.teacher.user.username
                if hasattr(obj.teacher, 'get_full_name'):
                    return obj.teacher.get_full_name() or obj.teacher.username
                return str(obj.teacher)
        except Exception as e:
            # print(f"Warning: Error getting teacher name: {e}")
            pass
        return "Unknown"
    
    def get_is_expired(self, obj):
        """Check if enrollment is expired"""
        try:
            return obj.is_expired
        except:
            return False
    
    def get_days_remaining(self, obj):
        """Get days remaining before expiration"""
        try:
            return obj.days_remaining
        except:
            return 0
    
    def get_has_access(self, obj):
        """Check if student has access to course"""
        try:
            return obj.has_access()
        except:
            return False


class BulkEnrollmentCreateSerializer(serializers.Serializer):
    """
    ✅ For receptionist bulk enrollment: Create multiple enrollments at once
    """
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of student user IDs to enroll"
    )
    course_id = serializers.IntegerField(
        help_text="Course ID to enroll students in"
    )
    enrollment_days = serializers.IntegerField(
        default=30,
        help_text="Number of days for enrollment access (default: 30)"
    )

    class Meta:
        fields = ['student_ids', 'course_id', 'enrollment_days']


 
# --- Other Serializers ---

 
class CompletedLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompletedLesson
        fields = '__all__'

 
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'

 
class ReviewSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = Review
        fields = ['id', 'course', 'user', 'review', 'rating', 'reply', 'active', 'date', 'profile']

 
class Question_Answer_MessageSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = Question_Answer_Message
        fields = '__all__'

 
class Question_AnswerSerializer(serializers.ModelSerializer):
    messages = Question_Answer_MessageSerializer(many=True, read_only=True)
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = Question_Answer
        fields = ['qa_id', 'title', 'date', 'messages', 'profile']

 
class VariantItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantItem
        fields = '__all__'

 
class VariantSerializer(serializers.ModelSerializer):
    variant_items = VariantItemSerializer(many=True, read_only=True)
    class Meta:
        model = Variant
        fields = ['id', 'title', 'variant_id', 'variant_items']

 
class FileUploadSerializer(serializers.Serializer):
    """Serializer used by FileUploadAPIView."""
    file = serializers.FileField()