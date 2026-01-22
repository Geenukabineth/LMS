import json
from rest_framework import serializers

from .models import *

from lms.models import Teacher, Profile, Student


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'image', 'email', 'phoneNumber']


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


# serializers.py
import re # Add this at the top

class LessonSerializer(serializers.ModelSerializer):

    user_score = serializers.SerializerMethodField()
    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ['lesson_id', 'date']

    def get_user_score(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        
        try:
            student = Student.objects.get(user=request.user)
            
            # Check for Quiz Score
            if obj.content_type == "quiz" and hasattr(obj, 'quiz'):
                # Get best or latest attempt
                attempt = obj.quiz.quiz_attempts.filter(student=student).order_by('-score').first()
                if attempt: 
                    return {
                        "score": attempt.score, 
                        "passed": attempt.passed
                    }

            # Check for Assignment Grade
            elif obj.content_type == "assignment" and hasattr(obj, 'assignment'):
                sub = obj.assignment.submissions.filter(student=student).first()
                if sub and sub.grade is not None:
                    # Assuming 50 is pass mark, or calculate based on sub.assignment.points
                    return {
                        "score": sub.grade, 
                        "passed": sub.grade >= (obj.assignment.points / 2)
                    }
        except Student.DoesNotExist:
            pass

    # ADD THIS FUNCTION to automatically convert links
    def validate_content_url_or_text(self, value):
        if not value:
            return value
        
        # 1. YouTube Logic
        youtube_regex = (
            r'(https?://)?(www\.)?'
            r'(youtube|youtu|youtube-nocookie)\.(com|be)/'
            r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
        )
        youtube_match = re.match(youtube_regex, value)
        if youtube_match:
            video_id = youtube_match.group(6)
            return f"https://www.youtube.com/embed/{video_id}"

        # 2. Google Drive Logic
        # Convert /view or /share links to /preview for embedding
        if "drive.google.com" in value:
            if "/view" in value:
                return value.replace("/view", "/preview")
            if "/share" in value:
                return value.replace("/share", "/preview")
            # If it's a raw file ID link, structure might vary, 
            # but /preview is usually the safe bet for iframes.

        return value

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
    title = serializers.CharField(source='course.title', read_only=True)
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
            'title',
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
    course_price = serializers.DecimalField(source='course.price', max_digits=12, decimal_places=2, read_only=True)
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
            'course_price',
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
        read_only_fields = ['id', 'course', 'user', 'reply', 'active', 'date', 'profile']


class Question_Answer_MessageSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Question_Answer_Message
        fields = '__all__'


class Question_AnswerSerializer(serializers.ModelSerializer):
    messages = Question_Answer_MessageSerializer(many=True, read_only=True)
    profile = ProfileSerializer(read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)

    class Meta:
        model = Question_Answer
        fields = ['qa_id', 'title', 'date', 'messages', 'profile', 'course_id', 'user']


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



# In backend/course/serializers.py

class AssignmentSerializer(serializers.ModelSerializer):
    user_status = serializers.SerializerMethodField() # ✅ Add this

    class Meta:
        model = Assignment
        fields = "__all__"

    def get_user_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        try:
            student = Student.objects.get(user=request.user)
            # Check if submission exists
            submission = AssignmentSubmission.objects.filter(assignment=obj, student=student).first()
            
            # Check for deadline
            is_past_due = False
            if obj.due_date and timezone.now() > obj.due_date:
                is_past_due = True

            return {
                "is_submitted": submission is not None,
                "submitted_at": submission.submitted_at if submission else None,
                "grade": submission.grade if submission else None,
                "is_past_due": is_past_due,
                "is_locked": (submission is not None) or is_past_due # 🔒 Lock condition
            }
        except Student.DoesNotExist:
            return None


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = "__all__"
        # ✅ Fix: Parse 'options' if it comes as a string from FormData
    def validate_options(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except ValueError:
                raise serializers.ValidationError("Invalid JSON format for options")
        return value

    # ✅ Fix: Ensure correct_answer is not sent as "undefined" string
    def validate_correct_answer(self, value):
        if value == "undefined" or value is None:
            return ""
        return value


# In serializers.py

# ... imports
from .models import QuizAttempt
from lms.models import Student # Ensure these are imported

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    
    # ✅ New Fields for Lock Logic
    user_status = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = "__all__"

    def get_user_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        try:
            student = Student.objects.get(user=request.user)
            # Count previous attempts
            attempts_count = QuizAttempt.objects.filter(quiz=obj, student=student).count()
            
            # Check if passed previously (optional, depends if you lock after passing)
            has_passed = QuizAttempt.objects.filter(quiz=obj, student=student, passed=True).exists()

            is_locked = attempts_count >= obj.attempts
            
            return {
                "attempts_used": attempts_count,
                "attempts_allowed": obj.attempts,
                "is_locked": is_locked,
                "has_passed": has_passed,
                "attempts_remaining": max(0, obj.attempts - attempts_count)
            }
        except Student.DoesNotExist:
            return None

# serializers.py

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        # ✅ Add 'plagiarism_score' to fields
        fields = ['id', 'assignment', 'student', 'student_name', 'file', 'grade', 'feedback', 'plagiarism_score', 'submitted_at',]
        # ✅ Add 'plagiarism_score' to read_only_fields (students shouldn't edit it)
        read_only_fields = ['student', 'submitted_at', 'plagiarism_score']
class QuizAttemptAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttemptAnswer
        fields = ['question', 'selected_option', 'text_answer']

# ... existing imports ...
from .utils import grade_essay_ml # ✅ Import the new function

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
            
            # 1. Handle MCQ / True/False
            if question.type in ['multiple_choice', 'true_false', 'image_mcq']:
                selected = ans_data.get('selected_option')
                is_correct = False
                if str(selected).lower() == str(question.correct_answer).lower():
                    is_correct = True
                    earned_points += question.points
                
                QuizAttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    selected_option=selected,
                    is_correct=is_correct
                )

            # 2. Handle Matching (Drag & Drop)
            elif question.type == 'matching':
                # Matching logic usually handled on frontend, passing score directly or 
                # strictly comparing JSON strings. Assuming strict match for now:
                selected = ans_data.get('selected_option') # JSON string from frontend
                # In matching, 'options' in DB is the correct pairs.
                # We can check if selected == options (basic check)
                is_correct = False
                # Simple string comparison of the JSON arrays
                if selected == json.dumps(question.options): 
                    is_correct = True
                    earned_points += question.points

                QuizAttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    selected_option=selected,
                    is_correct=is_correct
                )

            # ✅ 3. HANDLE ESSAY (ML AUTO GRADING)
            elif question.type == 'essay':
                student_text = ans_data.get('text_answer', '')
                model_answer = question.correct_answer # Teacher's ideal answer
                
                # Use 'options' as the list of required keywords
                keywords = question.options if isinstance(question.options, list) else []

                # Call ML Utility
                score_percentage = grade_essay_ml(student_text, model_answer, keywords)
                
                # Calculate points earned based on percentage
                points_awarded = (score_percentage / 100) * question.points
                earned_points += points_awarded
                
                # Mark correct if score > 50% (Arbitrary threshold for "Pass")
                is_correct = score_percentage >= 50

                QuizAttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    text_answer=student_text,
                    is_correct=is_correct
                )

            total_points += question.points
        
        # Calculate final quiz score
        if total_points > 0:
            attempt.score = (earned_points / total_points) * 100
        
        attempt.passed = attempt.score >= 50 # Example passing grade
        attempt.save()
        
        return attempt    
class LiveSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveSession
        fields = ['id', 'title', 'date', 'time', 'duration', 'is_completed', 'join_url']

class LiveAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    
    class Meta:
        model = LiveAttendance
        fields = ['student_name', 'join_time', 'status']

from rest_framework import serializers
from .models import Complaint

class ComplaintSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='user.username', read_only=True)
    student_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id",
            "user",
            "student_name",
            "student_email",
            "course",
            "send_to",
            "teacher",
            "title",
            "description",
            "priority",
            "status",
            "reply",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "course", "teacher", "created_at", "updated_at"]

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ["title", "description", "priority", "status", "reply"]
        read_only_fields = ["title", "description", "priority"]

class PlagiarismReportSerializer(serializers.ModelSerializer):
    # Frontend expects specific field names
    id = serializers.CharField(source='pk', read_only=True)
    courseCode = serializers.CharField(source='assignment.lesson.module.course.title', read_only=True)
    courseTitle = serializers.CharField(source='assignment.lesson.module.course.title', read_only=True)
    assessmentType = serializers.SerializerMethodField()
    assessmentTitle = serializers.CharField(source='assignment.title', read_only=True)
    student = serializers.SerializerMethodField()
    submittedAt = serializers.DateTimeField(source='submitted_at', read_only=True)
    flaggedAt = serializers.DateTimeField(source='submitted_at', read_only=True)
    riskLevel = serializers.SerializerMethodField()
    score = serializers.FloatField(source='plagiarism_score', read_only=True)
    
    # ✅ You declared this field correctly...
    grade = serializers.FloatField(read_only=True) 

    status = serializers.SerializerMethodField()
    evidence = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()
    text = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'courseCode', 'courseTitle', 'assessmentType', 'assessmentTitle',
            'student', 'submittedAt', 'flaggedAt', 'riskLevel', 'score',
            'status', 'evidence', 'metadata', 'text', 'file',
            'grade'  # ✅ ...BUT YOU MUST ADD IT HERE TO FIX THE ERROR
        ]

    def get_assessmentType(self, obj):
        return "Assignment"

    def get_student(self, obj):
        return {
            "id": obj.student.user.username,
            "name": getattr(obj.student.user, 'profile', None) and obj.student.user.profile.full_name or obj.student.user.username
        }

    def get_riskLevel(self, obj):
        score = obj.plagiarism_score or 0
        if score >= 75: return "High"
        if score >= 40: return "Review"
        return "Low"

    def get_status(self, obj):
        if obj.grade is not None:
            return "Dismissed"
        return "Open" 

    def get_evidence(self, obj):
        return getattr(obj, 'plagiarism_report', {}) or {
            "internalMatches": [], 
            "externalSources": [],
        }

    def get_metadata(self, obj):
        return {
            "submitAt": obj.submitted_at,
            "deviceId": "Unknown"
        }

    def get_text(self, obj):
        student_text = obj.extracted_text if obj.extracted_text else "Text content preview unavailable."
        report = obj.plagiarism_report or {}
        match_text = report.get('matched_source_text', "No significant match found.")

        return {
            "studentText": student_text, 
            "matchText": match_text, 
            "studentHighlights": [],
            "matchHighlights": []
        }