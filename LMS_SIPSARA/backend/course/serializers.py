from rest_framework import serializers

from .models import (
    Course, EnrolledCourse, Variant, VariantItem,
    CompletedLesson, Note, Review, Question_Answer,
    Question_Answer_Message, Module, Lesson, Assignment, Quiz, QuizQuestion,AssignmentSubmission, QuizAttempt, QuizAttemptAnswer
)

from lms.models import Teacher, Profile, Student


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
        try:
            if hasattr(obj.user, 'profile') and obj.user.profile:
                return obj.user.profile.full_name or obj.user.username
            return obj.user.get_full_name() or obj.user.username
        except Exception:
            return getattr(obj.user, "username", "Unknown")


class CourseSerializer(serializers.ModelSerializer):
    teacher = TeacherCourseSerializer(read_only=True)

    teacher_id = serializers.IntegerField(
        source='teacher.user_id',
        read_only=True
    )

    date = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    department = serializers.CharField(source='Department', read_only=True)

    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "course_id",
            "slug",
            "title",
            "description",
            "price",
            "teacher",
            "teacher_id",
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
            "assignment_status",
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

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        try:
            student = Student.objects.get(user=request.user)
            return EnrolledCourse.objects.filter(user=student, course=obj).exists()
        except Student.DoesNotExist:
            return False
        except Exception:
            return False


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ['lesson_id', 'date']


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'module_id', 'course', 'title', 'order', 'date', 'lessons']
        read_only_fields = ['module_id', 'date']


class AdminCourseCreateSerializer(serializers.ModelSerializer):
    Department = serializers.CharField(max_length=200, required=True)

    teacher = serializers.PrimaryKeyRelatedField(
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
            "image", "file", "teacher"
        ]

    def create(self, validated_data):
        validated_data['assignment_status'] = 'pending'
        return super().create(validated_data)


class AdminCourseUpdateSerializer(serializers.ModelSerializer):
    Department = serializers.CharField(required=False)

    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        required=False
    )

    class Meta:
        model = Course
        fields = [
            "title", "description", "price", "language", "level",
            "Department", "platform_status", "featured",
            "image", "file", "teacher",
        ]


class CourseCreateSerializer(serializers.ModelSerializer):
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


class EnrolledCourseSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(source="course.id", read_only=True)

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
        ]
        read_only_fields = ["enrollment_id", "status"]

    def get_is_expired(self, obj):
        return obj.is_expired

    def get_days_remaining(self, obj):
        return obj.days_remaining

    def get_has_access(self, obj):
        return obj.has_access()


class StudentInfoSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['user_id', 'username', 'email', 'full_name']

    def get_full_name(self, obj):
        try:
            if hasattr(obj.user, 'profile') and obj.user.profile:
                return obj.user.profile.full_name or obj.user.username
            return obj.user.get_full_name() or obj.user.username
        except Exception:
            return "Unknown"


class StudentEnrolledCoursesSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    course_level = serializers.CharField(source='course.level', read_only=True)
    course_image = serializers.SerializerMethodField(read_only=True)

    teacher_name = serializers.SerializerMethodField()
    teacher_id = serializers.IntegerField(source='teacher.user_id', read_only=True, required=False)

    # EnrolledCourse.user = Student → Student.user = User
    user_id = serializers.IntegerField(source='user.user.id', read_only=True, required=False)
    student_id = serializers.IntegerField(source='user.user.id', read_only=True, required=False)
    student_username = serializers.CharField(source='user.user.username', read_only=True, required=False)
    student_email = serializers.CharField(source='user.user.email', read_only=True, required=False)
    student_name = serializers.SerializerMethodField()
    student_info = serializers.SerializerMethodField()

    is_expired = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()
    started_at = serializers.DateTimeField(source='date', read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = EnrolledCourse
        fields = [
            'id',
            'enrollment_id',
            'course_id',
            'course_title',
            'course_level',
            'course_image',
            'teacher_id',
            'teacher_name',
            'user_id',
            'student_id',
            'student_username',
            'student_email',
            'student_name',
            'student_info',
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
        if obj.course and obj.course.image:
            request = self.context.get("request")
            try:
                return request.build_absolute_uri(obj.course.image.url) if request else obj.course.image.url
            except Exception:
                return None
        return None

    def get_teacher_name(self, obj):
        if not obj.teacher:
            return "N/A"
        try:
            if hasattr(obj.teacher.user, 'profile') and obj.teacher.user.profile:
                return obj.teacher.user.profile.full_name or obj.teacher.user.username
            return obj.teacher.user.get_full_name() or obj.teacher.user.username
        except Exception:
            return "Unknown"

    def get_student_name(self, obj):
        if not obj.user or not getattr(obj.user, "user", None):
            return "Unknown"
        u = obj.user.user
        try:
            if hasattr(u, 'profile') and u.profile:
                return u.profile.full_name or u.username
            return u.get_full_name() or u.username
        except Exception:
            return getattr(u, "username", "Unknown")

    def get_student_info(self, obj):
        if not obj.user:
            return None
        try:
            student = Student.objects.select_related('user', 'user__profile').get(id=obj.user.id)
            return StudentInfoSerializer(student).data
        except Exception:
            return None

    def get_is_expired(self, obj):
        return obj.is_expired

    def get_days_remaining(self, obj):
        return obj.days_remaining

    def get_has_access(self, obj):
        return obj.has_access()

    def get_status_display(self, obj):
        return "Expired" if obj.is_expired else "Active"


class ReceptionistEnrollmentSerializer(serializers.ModelSerializer):
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
        try:
            if obj.teacher and hasattr(obj.teacher, "user"):
                if hasattr(obj.teacher.user, 'profile') and obj.teacher.user.profile:
                    return obj.teacher.user.profile.full_name or obj.teacher.user.username
                return obj.teacher.user.get_full_name() or obj.teacher.user.username
        except Exception:
            pass
        return "Unknown"

    def get_is_expired(self, obj):
        return obj.is_expired

    def get_days_remaining(self, obj):
        return obj.days_remaining

    def get_has_access(self, obj):
        return obj.has_access()


class BulkEnrollmentCreateSerializer(serializers.Serializer):
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of student USER IDs to enroll"
    )
    course_id = serializers.IntegerField(help_text="Course ID to enroll students in")
    enrollment_days = serializers.IntegerField(default=30, help_text="Number of days for enrollment access")

    class Meta:
        fields = ['student_ids', 'course_id', 'enrollment_days']


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
    file = serializers.FileField()



class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = "__all__"


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = "__all__"


# serializers.py

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'assignment', 'student', 'student_name', 'file', 'grade', 'feedback', 'submitted_at']
        read_only_fields = ['student', 'submitted_at']

class QuizAttemptAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttemptAnswer
        fields = ['question', 'selected_option', 'text_answer']

class QuizAttemptSerializer(serializers.ModelSerializer):
    answers = QuizAttemptAnswerSerializer(many=True, write_only=True)
    student_name = serializers.CharField(source='student.user.username', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'student', 'student_name', 'score', 'passed', 'completed_at', 'answers']
        read_only_fields = ['student', 'score', 'passed', 'completed_at']

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        attempt = QuizAttempt.objects.create(**validated_data)
        
        total_points = 0
        earned_points = 0
        
        for ans_data in answers_data:
            question = ans_data['question']
            selected = ans_data.get('selected_option')
            
            # Auto-grading logic for MCQ
            is_correct = False
            if question.type == 'multiple_choice' or question.type == 'true_false':
                if str(selected).lower() == str(question.correct_answer).lower():
                    is_correct = True
                    earned_points += question.points
            
            total_points += question.points
            
            QuizAttemptAnswer.objects.create(
                attempt=attempt,
                question=question,
                selected_option=selected,
                is_correct=is_correct
            )
        
        # Calculate final score
        if total_points > 0:
            attempt.score = (earned_points / total_points) * 100
        attempt.passed = attempt.score >= 50 # Example passing grade
        attempt.save()
        
        return attempt