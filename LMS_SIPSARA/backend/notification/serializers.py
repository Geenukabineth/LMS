# notification/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Announcement
from django.utils import timezone

# Get the active user model
User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serialize User information"""
    class Meta:
        model = User
        # ERROR FIX: Removed 'first_name' and 'last_name' because your custom 
        # User model does not have them.
        # If your user model has a 'name' or 'full_name' field, add it to this list.
        fields = ('id', 'username', 'email')


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for reading/retrieving announcements"""
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Announcement
        fields = (
            'id',
            'title',
            'content',
            'author',
            'role',
            'type',
            'visibility',
            'expires_at',
            'created_at',
            'updated_at',
            'is_pinned',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
            'author',
            'role',
            'is_pinned',
        )


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating announcements"""
    class Meta:
        model = Announcement
        fields = ('title', 'content', 'type', 'visibility','expires_at')
    
    def validate_title(self, value):
        """Validate title is not empty and within length limits"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        if len(value) > 200:
            raise serializers.ValidationError("Title cannot exceed 200 characters")
        return value.strip()
    
    def validate_expires_at(self, value):
        """Ensure expiration date is in the future"""
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future.")
        return value
    
    def validate_content(self, value):
        """Validate content meets minimum requirements"""
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty")
        if len(value) < 10:
            raise serializers.ValidationError("Content must be at least 10 characters")
        return value.strip()
    
    def create(self, validated_data):
        """Create announcement with current user as author"""
        user = self.context['request'].user
        
        # Get user role from available sources
        role = 'student'
        
        # Try profile.role
        if hasattr(user, 'profile'):
            if hasattr(user.profile, 'role'):
                role = user.profile.role
        
        # Try user_type
        if hasattr(user, 'user_type'):
            role = user.user_type
        
        # Try userType
        if hasattr(user, 'userType'):
            role = user.userType
        
        # Check superuser/staff
        if user.is_superuser:
            role = 'admin'
        elif user.is_staff:
            role = 'teacher'
        
        validated_data['author'] = user
        validated_data['role'] = role
        
        print(f"✅ Creating announcement: author={user.username}, role={role}")
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update announcement - preserve author and role"""
        # Don't allow changing author or role during update
        validated_data.pop('author', None)
        validated_data.pop('role', None)
        
        return super().update(instance, validated_data)