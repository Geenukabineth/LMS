# models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from course.models import *
from payment.models import *


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError(("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    STUDENT = "student"
    INSTRUCTOR = "instructor"

    USER_TYPES = [
        (STUDENT, "Student"),
        (INSTRUCTOR, "Instructor"),
    ]

    email = models.EmailField(unique=True)

    username = models.CharField(
        max_length=150,
        unique=True,
    )
    phone = models.CharField(max_length=20)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default=STUDENT)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.FileField(upload_to="student-file", blank=True, null=True, default="default.jpg")
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="students")
    first_name = models.CharField(max_length=100) 
    last_name = models.CharField(max_length=100)
    classroom = models.CharField(max_length=100)
    section = models.CharField(max_length=100)
    enrollment_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    last_activity = models.DateField(null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.user.username


class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.FileField(upload_to="course-file", blank=True, null=True, default="default.jpg")
    first_name = models.CharField(max_length=100) 
    last_name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    classroom = models.CharField(max_length=100)
    earnings = models.DecimalField(max_digits=12, default=0.00, decimal_places=2) 
    facebook = models.URLField(null=True, blank=True)
    twitter = models.URLField(null=True, blank=True)
    linkedin = models.URLField(null=True, blank=True)
    about = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return self.user.username
    
    def students(self):
        return CartOrderItem.objects.filter(teacher=self)
    
    def courses(self):
        return Course.objects.filter(teacher=self)
    
    def review(self):
        return Course.objects.filter(teacher=self).count()

    def total_earnings(self):
        total = 0
        orders = CartOrderItem.objects.filter(teacher=self)
        for order in orders:
            total += order.total
        return total


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.FileField(upload_to="user_folder", default="default-user.jpg", null=True, blank=True)
    full_name = models.CharField(max_length=100)
    country = models.CharField(max_length=100, null=True, blank=True)
    about = models.TextField(null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.full_name:
            return str(self.full_name)
        else:
            return str(self.user.username)
        
    
    def save(self, *args, **kwargs):
        if self.full_name == "" or self.full_name == None:
            self.full_name = self.user.username
        super(Profile, self).save(*args, **kwargs)


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
