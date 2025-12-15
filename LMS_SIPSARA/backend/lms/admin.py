# admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Profile, Student, Teacher, Receptionist


class ProfileInline(admin.StackedInline):
    """Inline admin for Profile to be shown with User"""
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('full_name', 'image', 'phoneNumber')


class UserAdmin(BaseUserAdmin):
    """Custom User Admin with Profile inline"""
    ordering = ["username"]
    list_display = ["username", "email", "user_type", "is_staff", "is_active", "date_joined"]
    list_filter = ["user_type", "is_staff", "is_active", "is_temporary_password"]
    search_fields = ("username", "email", "phone")
    
    # Add profile inline
    inlines = [ProfileInline]
    
    # Make date fields read-only
    readonly_fields = ('last_login', 'date_joined', 'updated_at')

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("email", "phone", "user_type")}),
        (_("Permissions"), {
            "fields": (
                "is_active", 
                "is_staff", 
                "is_superuser", 
                "is_temporary_password",
                "groups", 
                "user_permissions"
            )
        }),
        (_("Important dates"), {"fields": ("last_login", "date_joined", "updated_at")}),
        (_("Password Reset"), {"fields": ("otp", "otp_expiry")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username", 
                "email", 
                "phone", 
                "password1", 
                "password2", 
                "user_type",
                "is_staff", 
                "is_active"
            ),
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Override to ensure profile is created for admin-created users"""
        super().save_model(request, obj, form, change)
        # Profile will be created automatically via signal


class StudentAdmin(admin.ModelAdmin):
    list_display = ['firstName', 'lastName', 'email', 'Grade', 'academicYear', 'registrationFees']
    list_filter = ['Grade', 'academicYear', 'registrationFees']
    search_fields = ['firstName', 'lastName', 'email', 'phone']
    date_hierarchy = 'enrollmentDate'
    
    fieldsets = (
        ('User Account', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'image')
        }),
        ('Academic Information', {
            'fields': ('academicYear', 'Grade', 'School', 'classroom', 'section', 'teacher')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'zipCode')
        }),
        ('Guardian Information', {
            'fields': ('guardianName', 'guardianPhone', 'emergencyContact', 'emergencyPhone')
        }),
        ('Registration', {
            'fields': ('registrationFees', 'enrollmentDate', 'end_date', 'last_activity')
        }),
        ('Additional Information', {
            'fields': ('medicalInfo', 'notes'),
            'classes': ('collapse',)
        }),
    )


class TeacherAdmin(admin.ModelAdmin):
    list_display = ['First_Name', 'Last_Name', 'Email_Address', 'Department', 'Date_Joined']
    list_filter = ['Department', 'gender', 'Date_Joined']
    search_fields = ['First_Name', 'Last_Name', 'Email_Address', 'Phone_Number']
    date_hierarchy = 'Date_Joined'
    
    readonly_fields = ('Date_Joined', 'total_student_count', 'course_count')
    
    fieldsets = (
        ('User Account', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('First_Name', 'Last_Name', 'Email_Address', 'Phone_Number', 'gender')
        }),
        ('Professional Information', {
            'fields': ('Department', 'is_teacher', 'Date_Joined')
        }),
        ('Statistics', {
            'fields': ('total_student_count', 'course_count'),
            'classes': ('collapse',)
        }),
    )
    
    def total_student_count(self, obj):
        return obj.total_student()
    total_student_count.short_description = 'Total Students'
    
    def course_count(self, obj):
        return obj.review()
    course_count.short_description = 'Total Courses'


class ReceptionistAdmin(admin.ModelAdmin):
    list_display = ['First_Name', 'Last_Name', 'Email_Address', 'Date_Joined']
    list_filter = ['gender', 'Date_Joined']
    search_fields = ['First_Name', 'Last_Name', 'Email_Address', 'Phone_Number']
    date_hierarchy = 'Date_Joined'
    
    readonly_fields = ('Date_Joined',)
    
    fieldsets = (
        ('User Account', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('First_Name', 'Last_Name', 'Email_Address', 'Phone_Number', 'gender')
        }),
        ('Professional Information', {
            'fields': ('is_receptionist', 'Date_Joined')
        }),
    )


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'email', 'phoneNumber', 'date']
    search_fields = ['full_name', 'email', 'phoneNumber', 'user__username']
    list_filter = ['date']
    readonly_fields = ('date',)
    
    fieldsets = (
        ('User Link', {
            'fields': ('user',)
        }),
        ('Profile Information', {
            'fields': ('full_name', 'email', 'phoneNumber', 'image')
        }),
        ('Metadata', {
            'fields': ('date',)
        }),
    )


# Register models with their admin classes
admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Student, StudentAdmin)
admin.site.register(Teacher, TeacherAdmin)
admin.site.register(Receptionist, ReceptionistAdmin)

# Customize admin site header and title
admin.site.site_header = "LMS SIPSARA Admin"
admin.site.site_title = "LMS SIPSARA"
admin.site.index_title = "Welcome to LMS SIPSARA Administration"