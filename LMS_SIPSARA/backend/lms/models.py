# models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

year_academic = [
    ('primary level', 'Primary Level'),
    ('ordinary level', 'Ordinary Level'),
    ('advanced level', 'Advanced Level'),
]

Grade = [
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
]

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
        extra_fields.setdefault("user_type", User.ADMIN)
        
        # Ensure username is set for superuser
        if 'username' not in extra_fields:
            extra_fields['username'] = email.split('@')[0]
        
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ADMIN = "admin"
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    RECEPTIONIST = "receptionist"

    USER_TYPES = [
        (ADMIN, "Admin"),
        (STUDENT, "Student"),
        (INSTRUCTOR, "Instructor"),
        (RECEPTIONIST, "Receptionist"),
    ]

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default=STUDENT)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_temporary_password = models.BooleanField(default=False)
    
    # Date fields - properly defined
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(blank=True, null=True)  # This is handled by AbstractBaseUser
    updated_at = models.DateTimeField(auto_now=True)
    
    # OTP fields for password reset
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    
    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.email

    class Meta:
        db_table = 'lms_user'

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    classroom = models.CharField(max_length=100, blank=True, default="")
    section = models.CharField(max_length=100, blank=True, default="")
    end_date = models.DateField(null=True, blank=True)
    last_activity = models.DateField(null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    image = models.FileField(upload_to="student-file", blank=True, null=True, default="default.jpg")
    teacher = models.ForeignKey('Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name="students")    
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    dateOfBirth = models.DateField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zipCode = models.CharField(max_length=10, blank=True, null=True)
    guardianName = models.CharField(max_length=200, blank=True, null=True)
    guardianPhone = models.CharField(max_length=20, blank=True, null=True)
    emergencyContact = models.CharField(max_length=200, blank=True, null=True)
    emergencyPhone = models.CharField(max_length=20, blank=True, null=True)
    academicYear = models.CharField(max_length=50, choices=year_academic, default='primary level')
    School = models.CharField(max_length=200, blank=True, null=True)
    Grade = models.CharField(max_length=100, choices=Grade, default='Grade 1')
    registrationFees = models.BooleanField(default=False)
    enrollmentDate = models.DateField(blank=True, null=True)
    medicalInfo = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    

    def __str__(self):
        return f"{self.firstName} {self.lastName}"

    class Meta:
        db_table = 'lms_student'

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    is_teacher = models.BooleanField(default=True)
    First_Name = models.CharField(max_length=100)
    Last_Name = models.CharField(max_length=100)
    Email_Address = models.EmailField(unique=True)
    Phone_Number = models.CharField(max_length=20, blank=True, default="")
    Department = models.CharField(max_length=100, null=True, blank=True)
    Date_Joined = models.DateField(auto_now_add=True)
    gender = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"{self.First_Name} {self.Last_Name}"

    def total_student(self):
        return Student.objects.filter(teacher=self).count()    
    
    def courses(self):
        from course.models import Course
        return Course.objects.filter(teacher=self)
    
    def review(self):
        from course.models import Course
        return Course.objects.filter(teacher=self).count()

    class Meta:
        db_table = 'lms_teacher'

class Receptionist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    is_receptionist = models.BooleanField(default=True)
    First_Name = models.CharField(max_length=100)
    Last_Name = models.CharField(max_length=100)
    Email_Address = models.EmailField(unique=True)
    Phone_Number = models.CharField(max_length=20, blank=True, default="")
    Date_Joined = models.DateField(auto_now_add=True)
    gender = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"{self.First_Name} {self.Last_Name}"

    class Meta:
        db_table = 'lms_receptionist'

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    image = models.FileField(upload_to="user_folder", default="default-user.jpg", null=True, blank=True)
    full_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phoneNumber = models.CharField(max_length=20, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name or self.user.username
        
    def save(self, *args, **kwargs):
        if not self.full_name:
            self.full_name = self.user.username
        if not self.email:
            self.email = self.user.email
        if not self.phoneNumber:
            self.phoneNumber = self.user.phone if hasattr(self.user, 'phone') else ""
        super(Profile, self).save(*args, **kwargs)

    class Meta:
        db_table = 'lms_profile'

# Signal handlers for automatic profile creation
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(
            user=instance,
            full_name=instance.username,
            email=instance.email,
            phoneNumber=getattr(instance, 'phone', '')
        )
    else:
        # Update existing profile if it exists
        if hasattr(instance, 'profile'):
            profile = instance.profile
            profile.email = instance.email
            profile.phoneNumber = getattr(instance, 'phone', '')
            profile.save()