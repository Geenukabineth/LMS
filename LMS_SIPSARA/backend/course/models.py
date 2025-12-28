from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from shortuuid.django_fields import ShortUUIDField
from lms.models import User, Profile, Teacher, Student
from payment.models import CartOrderItem
from datetime import timedelta


LANGUAGE = (
    ("English", "English"),
    ("Singhalese", "Singhalese"),
    ("Tamil", "Tamil"),
)

LEVEL = (
    ('Grade 1', 'Grade 1'),
    ('Grade 2', 'Grade 2'),
    ('Grade 3', 'Grade 3'),
    ('Grade 4', 'Grade 4'),
    ('Grade 5', 'Grade 5'),
    ('Grade 6', 'Grade 6'),
    ('Grade 7', 'Grade 7'),
    ('Grade 8', 'Grade 8'),
    ('Grade 9', 'Grade 9'),
    ('Grade 10', 'Grade 10'),
    ('Grade 11', 'Grade 11'),
    ('Grade 12', 'Grade 12'),
    ('Grade 13', 'Grade 13'),
)

PLATFORM_STATUS = (
    ("published", "Published"),
    ("draft", "Draft"),
)

TEACHER_STATUS = (
    ("Draft", "Draft"),
    ("Disabled", "Disabled"),
    ("Published", "Published"),
)

COURSE_ASSIGNMENT_STATUS = (
    ("pending", "Pending (Awaiting Teacher)"),
    ("accepted", "Accepted"),
    ("rejected", "Rejected"),
)

RATING = (
    (1, "1 Star"),
    (2, "2 Star"),
    (3, "3 Star"),
    (4, "4 Star"),
    (5, "5 Star"),
)

CONTENT_TYPE = (
    ("video", "Video"),
    ("document", "Document"),
    ("quiz", "Quiz"),
    ("assignment", "Assignment"),
)


class Course(models.Model):
    Department = models.TextField(max_length=200, null=True, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, blank=True, null=True)
    file = models.CharField(max_length=200, blank=True, null=True)
    image = models.ImageField(upload_to='course-images/', blank=True, null=True)
    title = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, blank=True, null=True)

    language = models.CharField(choices=LANGUAGE, default="English", max_length=100, blank=True, null=True)
    level = models.CharField(choices=LEVEL, default="Grade 1", max_length=100, blank=True, null=True)
    platform_status = models.CharField(choices=PLATFORM_STATUS, default="published", max_length=100, blank=True, null=True)
    teacher_course_status = models.CharField(choices=TEACHER_STATUS, default="Published", max_length=100)

    assignment_status = models.CharField(
        choices=COURSE_ASSIGNMENT_STATUS,
        default="pending",
        max_length=20,
        help_text="Status of teacher assignment"
    )

    featured = models.BooleanField(default=False)
    course_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    slug = models.SlugField(unique=True, null=True, blank=True)
    date = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.BooleanField(default=True)

    class Meta:
        app_label = 'course'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'

    def __str__(self):
        return self.title or "Untitled Course"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = self.title if self.title else f"course-{self.course_id}"
            self.slug = slugify(base)
        super().save(*args, **kwargs)

    def students(self):
        return EnrolledCourse.objects.filter(course=self).count()

    def curriculum(self):
        return Variant.objects.filter(course=self)

    def lectures(self):
        return VariantItem.objects.filter(variant__course=self)

    def average_rating(self):
        avg = Review.objects.filter(course=self, active=True).aggregate(avg_rating=models.Avg('rating'))
        return avg['avg_rating']

    def rating_count(self):
        return Review.objects.filter(course=self, active=True).count()

    def reviews(self):
        return Review.objects.filter(course=self, active=True)


class Variant(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=1000)
    variant_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        verbose_name = 'Variant'
        verbose_name_plural = 'Variants'

    def __str__(self):
        return self.title

    def variant_items(self):
        return VariantItem.objects.filter(variant=self)

    def items(self):
        return VariantItem.objects.filter(variant=self)


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    order = models.IntegerField(default=0, help_text="The sequence number for the module within the course.")
    module_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        verbose_name = "Module"
        verbose_name_plural = "Modules"
        ordering = ['order', 'date']

    def __str__(self):
        return f"{self.course.title} - Module {self.order}: {self.title}"


class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE)
    order = models.IntegerField(default=0, help_text="The sequence number for the lesson within the module.")
    content_url_or_text = models.TextField(help_text="File URL or long text content.")
    duration_minutes = models.IntegerField(null=True, blank=True, help_text="Estimated time for quiz/video duration.")
    lesson_id = ShortUUIDField(unique=True, length=8, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        verbose_name = "Lesson Content"
        verbose_name_plural = "Lesson Contents"
        ordering = ['module__order', 'order']

    def __str__(self):
        return f"{self.module.course.title} - {self.module.title} - {self.title} ({self.content_type})"


class CompletedLesson(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        unique_together = ('user', 'lesson')
        verbose_name = 'Completed Lesson'
        verbose_name_plural = 'Completed Lessons'

    def __str__(self):
        return f"{self.user.username} completed {self.lesson.title}"


class VariantItem(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name="variant_items")
    title = models.CharField(max_length=1000)
    description = models.TextField(null=True, blank=True)
    file = models.CharField(max_length=200)
    duration = models.DurationField(null=True, blank=True)
    content_duration = models.CharField(max_length=1000, null=True, blank=True)
    preview = models.BooleanField(default=False)
    variant_item_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        verbose_name = 'Variant Item'
        verbose_name_plural = 'Variant Items'

    def __str__(self):
        return f"{self.variant.title} - {self.title}"


class Question_Answer(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=1000, null=True, blank=True)
    qa_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        ordering = ['-date']
        verbose_name = 'Question & Answer'
        verbose_name_plural = 'Questions & Answers'

    def __str__(self):
        uname = self.user.username if self.user else "Unknown"
        return f"{uname} - {self.course.title}"

    def messages(self):
        return Question_Answer_Message.objects.filter(question=self)

    def profile(self):
        return Profile.objects.get(user=self.user)


class Question_Answer_Message(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    question = models.ForeignKey(Question_Answer, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField(null=True, blank=True)
    qam_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        ordering = ['date']
        verbose_name = 'Q&A Message'
        verbose_name_plural = 'Q&A Messages'

    def __str__(self):
        uname = self.user.username if self.user else "Unknown"
        return f"{uname} - {self.course.title}"

    def profile(self):
        return Profile.objects.get(user=self.user)
    
class Quiz(models.Model):
    lesson = models.OneToOneField("Lesson", on_delete=models.CASCADE, related_name="quiz")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    time_limit = models.IntegerField(null=True, blank=True)
    attempts = models.IntegerField(default=1)
    shuffle_questions = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "course"

    def __str__(self):
        return self.title
    

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    type = models.CharField(max_length=50)  # multiple_choice, true_false, etc.
    question = models.TextField()
    points = models.IntegerField(default=1)
    options = models.JSONField(default=list, blank=True)  # for MCQ
    correct_answer = models.CharField(max_length=255, blank=True, default="")
    explanation = models.TextField(blank=True, default="")

    class Meta:
        app_label = "course"



class Certificate(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    certificate_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'

    def __str__(self):
        return self.course.title


class EnrolledCourse(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    user = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    order_item = models.ForeignKey(CartOrderItem, on_delete=models.CASCADE, null=True, blank=True)
    enrollment_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True, help_text="Enrollment expiration date (auto-set to 30 days from start)")
    status = models.CharField(
        max_length=20,
        default='active',
        choices=[('active', 'Active'), ('expired', 'Expired')],
        help_text="Enrollment status"
    )

    class Meta:
        app_label = 'course'
        verbose_name = 'Enrolled Course'
        verbose_name_plural = 'Enrolled Courses'
        indexes = [
            models.Index(fields=['user', 'course']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        if not self.user or not getattr(self.user, "user", None):
            return f"Unknown - {self.course.title}"
        return f"{self.user.user.username} - {self.course.title}"

    def save(self, *args, **kwargs):
        if not self.ended_at:
            self.ended_at = self.date + timedelta(days=30)

        if self.ended_at and timezone.now() > self.ended_at:
            self.status = 'expired'
        else:
            self.status = 'active'

        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        if self.ended_at is None:
            return False
        return timezone.now() > self.ended_at

    @property
    def days_remaining(self):
        if self.ended_at is None:
            return None
        remaining = (self.ended_at - timezone.now()).days
        return max(0, remaining)

    def has_access(self):
        return not self.is_expired and self.status == 'active'

    def lectures(self):
        return VariantItem.objects.filter(variant__course=self.course)

    def completed_lesson(self):
        """
        ✅ FIXED: CompletedLesson.user is a User, but EnrolledCourse.user is Student
        """
        if not self.user or not getattr(self.user, "user", None):
            return CompletedLesson.objects.none()
        return CompletedLesson.objects.filter(lesson__module__course=self.course, user=self.user.user)

    def curriculum(self):
        return Variant.objects.filter(course=self.course)

    def note(self):
        if not self.user or not getattr(self.user, "user", None):
            return Note.objects.none()
        return Note.objects.filter(course=self.course, user=self.user.user)

    def question_answer(self):
        return Question_Answer.objects.filter(course=self.course)

    def review(self):
        if not self.user or not getattr(self.user, "user", None):
            return None
        return Review.objects.filter(course=self.course, user=self.user.user).first()


class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=1000, null=True, blank=True)
    note = models.TextField()
    note_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'

    def __str__(self):
        return self.title or "Untitled Note"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    review = models.TextField()
    rating = models.IntegerField(choices=RATING, default=1)
    reply = models.CharField(null=True, blank=True, max_length=1000)
    active = models.BooleanField(default=False)
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = 'course'
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'

    def __str__(self):
        return self.course.title

    def profile(self):
        return Profile.objects.get(user=self.user)


class Assignment(models.Model):
    lesson = models.OneToOneField("Lesson", on_delete=models.CASCADE, related_name="assignment")
    title = models.CharField(max_length=255)
    due_date = models.DateTimeField(null=True, blank=True)
    description = models.TextField(blank=True, default="")
    file = models.FileField(upload_to='assignments/', null=True, blank=True)
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "course"

    def __str__(self):
        return self.title


class LiveSession(models.Model):
    course = models.ForeignKey('course.Course', on_delete=models.CASCADE, related_name='live_sessions')
    title = models.CharField(max_length=200)
    
    # Scheduling fields (Missing in your current error)
    date = models.DateField()
    time = models.TimeField()
    duration = models.IntegerField(default=60, help_text="Duration in minutes")
    
    # Zoom Integration fields
    meeting_id = models.CharField(max_length=50, blank=True, null=True, help_text="Zoom Meeting ID")
    meeting_password = models.CharField(max_length=50, blank=True, null=True)
    join_url = models.URLField(max_length=1000, blank=True, null=True, help_text="Link for students")
    start_url = models.URLField(max_length=1000, blank=True, null=True, help_text="Link for teacher (host)")
    
    # Status fields
    is_completed = models.BooleanField(default=False)
    attendance_synced = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class LiveAttendance(models.Model):
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey('lms.Student', on_delete=models.CASCADE, related_name='live_attendance')
    
    # Zoom API data
    join_time = models.DateTimeField(null=True, blank=True)
    leave_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0)
    
    status = models.CharField(
        max_length=20, 
        choices=[('present', 'Present'), ('absent', 'Absent'), ('late', 'Late')],
        default='absent'
    )

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.user.username} - {self.session.title}"