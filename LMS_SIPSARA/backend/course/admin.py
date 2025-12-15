from django.contrib import admin
from .models import (
    Course, Module, Lesson, Variant, VariantItem,
    CompletedLesson, Note, Review, Question_Answer,
    Question_Answer_Message, Certificate, EnrolledCourse, Assignment
)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'teacher', 'assignment_status', 'platform_status',
        'level', 'price', 'featured', 'date'
    )
    list_filter = (
        'assignment_status', 'platform_status', 'featured', 'level', 'language', 'date'
    )
    search_fields = ('title', 'description', 'Department')
    readonly_fields = ('course_id', 'slug', 'date', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'image', 'file')
        }),
        ('Course Details', {
            'fields': ('level', 'language', 'Department', 'price')
        }),
        ('Assignment & Status', {
            'fields': ('teacher', 'assignment_status', 'platform_status', 'teacher_course_status')
        }),
        ('Metadata', {
            'fields': ('featured', 'course_id', 'slug', 'date', 'updated_at', 'status'),
            'classes': ('collapse',)
        }),
    )
    actions = ['make_published', 'make_draft', 'assignment_pending', 'assignment_accepted', 'assignment_rejected']

    def make_published(self, request, queryset):
        queryset.update(platform_status='published')
    make_published.short_description = "Mark selected courses as Published"

    def make_draft(self, request, queryset):
        queryset.update(platform_status='draft')
    make_draft.short_description = "Mark selected courses as Draft"

    def assignment_pending(self, request, queryset):
        queryset.update(assignment_status='pending')
    assignment_pending.short_description = "Set assignment status to Pending"

    def assignment_accepted(self, request, queryset):
        queryset.update(assignment_status='accepted')
    assignment_accepted.short_description = "Set assignment status to Accepted"

    def assignment_rejected(self, request, queryset):
        queryset.update(assignment_status='rejected')
    assignment_rejected.short_description = "Set assignment status to Rejected"


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'date')
    list_filter = ('course', 'date')
    search_fields = ('title', 'course__title')
    readonly_fields = ('module_id', 'date')
    fieldsets = (
        ('Module Details', {
            'fields': ('course', 'title', 'order')
        }),
        ('Metadata', {
            'fields': ('module_id', 'date'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'content_type', 'order', 'duration_minutes', 'date')
    list_filter = ('content_type', 'module__course', 'date')
    search_fields = ('title', 'module__title', 'content_url_or_text')
    readonly_fields = ('lesson_id', 'date')
    fieldsets = (
        ('Lesson Details', {
            'fields': ('module', 'title', 'content_type', 'order')
        }),
        ('Content', {
            'fields': ('content_url_or_text', 'duration_minutes')
        }),
        ('Metadata', {
            'fields': ('lesson_id', 'date'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'date')
    list_filter = ('course', 'date')
    search_fields = ('title', 'course__title')
    readonly_fields = ('variant_id', 'date')


@admin.register(VariantItem)
class VariantItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'variant', 'preview', 'date')
    list_filter = ('variant__course', 'preview', 'date')
    search_fields = ('title', 'variant__title', 'description')
    readonly_fields = ('variant_item_id', 'date')


@admin.register(CompletedLesson)
class CompletedLessonAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'completed', 'date')
    list_filter = ('completed', 'date')
    search_fields = ('user__username', 'lesson__title')
    readonly_fields = ('date',)


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'course', 'date')
    list_filter = ('course', 'date')
    search_fields = ('title', 'note', 'user__username', 'course__title')
    readonly_fields = ('note_id', 'date')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('course', 'user', 'rating', 'active', 'date')
    list_filter = ('active', 'rating', 'course', 'date')
    search_fields = ('review', 'user__username', 'course__title')
    readonly_fields = ('date',)
    actions = ['approve_reviews', 'reject_reviews']

    def approve_reviews(self, request, queryset):
        queryset.update(active=True)
    approve_reviews.short_description = "Approve selected reviews"

    def reject_reviews(self, request, queryset):
        queryset.update(active=False)
    reject_reviews.short_description = "Reject selected reviews"


@admin.register(Question_Answer)
class Question_AnswerAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'user', 'date')
    list_filter = ('course', 'date')
    search_fields = ('title', 'user__username', 'course__title')
    readonly_fields = ('qa_id', 'date')


@admin.register(Question_Answer_Message)
class Question_Answer_MessageAdmin(admin.ModelAdmin):
    list_display = ('course', 'question', 'user', 'date')
    list_filter = ('course', 'question', 'date')
    search_fields = ('message', 'user__username')
    readonly_fields = ('qam_id', 'qa_id', 'date')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('course', 'user', 'date')
    list_filter = ('course', 'date')
    search_fields = ('user__username', 'course__title')
    readonly_fields = ('certificate_id', 'date')


@admin.register(EnrolledCourse)
class EnrolledCourseAdmin(admin.ModelAdmin):
    list_display = ('course', 'user', 'teacher', 'date')
    list_filter = ('course', 'teacher', 'date')
    search_fields = ('user__username', 'course__title')
    readonly_fields = ('enrollment_id', 'date')


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'user', 'due_date', 'grade')
    list_filter = ('course', 'due_date', 'grade')
    search_fields = ('title', 'user__username', 'course__title')
    readonly_fields = ('submitted_at',)
    fieldsets = (
        ('Assignment Details', {
            'fields': ('title', 'description', 'course', 'due_date')
        }),
        ('Student Submission', {
            'fields': ('user', 'file', 'submitted_at'),
            'classes': ('collapse',)
        }),
        ('Grading', {
            'fields': ('grade', 'feedback'),
            'classes': ('collapse',)
        }),
    )