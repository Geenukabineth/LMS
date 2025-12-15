from django.db import models
from django.contrib.auth import get_user_model
from course.models import Assignment
from payment.models import PaymentGateway

User = get_user_model()


class Announcement(models.Model):
    TYPE_CHOICES = [
        ('general', 'General'),
        ('course', 'Course'),
        ('assignment', 'Assignment'),
        ('urgent', 'Urgent'),
    ]
    
    VISIBILITY_CHOICES = [
        ('everyone', 'Everyone'),
        ('students', 'Students Only'),
        ('teachers', 'Teachers Only'),
    ]
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='everyone')
    expires_at = models.DateTimeField(null=True, blank=True, help_text="Date and time when this announcement will be automatically deleted")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    
    is_pinned = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'
    
    def __str__(self):
        return f"{self.title} - {self.author.username}"



