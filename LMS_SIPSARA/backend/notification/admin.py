# admin.py
from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    """Admin interface for Announcements"""
    list_display = ['title', 'author', 'type', 'visibility', 'is_pinned', 'created_at']
    list_filter = ['type', 'visibility', 'is_pinned', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'content')
        }),
        ('Metadata', {
            'fields': ('author', 'role', 'type', 'visibility', 'is_pinned')
        }),
        
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Set role based on user if not already set"""
        if not change:  # Creating new object
            if hasattr(request.user, 'profile') and hasattr(request.user.profile, 'role'):
                obj.role = request.user.profile.role
            else:
                obj.role = 'student'
        super().save_model(request, obj, form, change)


