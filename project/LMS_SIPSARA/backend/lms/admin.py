from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


class UserAdmin(BaseUserAdmin):
    
    list_display = ["email", "username", "user_type", "is_active", "is_staff"]
    list_filter = ["is_active", "user_type"]  # Change 'role' to 'user_type'
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        (
            "Permissions",
            {"fields": ("user_type", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
    )
    # If you have any add_fieldsets, update those too
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2", "user_type", "is_active", "is_staff"),
            },
        ),
    )
    search_fields = ["email", "username"]
    ordering = ["email"]


admin.site.register(User, UserAdmin)


