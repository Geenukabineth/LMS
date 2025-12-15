# permissions.py - CORRECTED for actual User model with user_type field

from rest_framework import permissions

class IsReceptionistOrAdmin(permissions.BasePermission):
    """
    ✅ CORRECTED: Uses user_type field from User model
    Allows access to receptionists and admins only.
    
    Permission granted if:
    - user.is_staff = True (admin) OR
    - user.user_type = 'receptionist'
    """
    
    message = "Only administrators and receptionists can access this resource."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin check
        if request.user.is_staff:
            return True
        
        # Receptionist check - use user_type field
        if hasattr(request.user, 'user_type'):
            if request.user.user_type == 'receptionist':
                return True
        
        return False


class IsTeacherOrReceptionistOrAdmin(permissions.BasePermission):
    """
    ✅ CORRECTED: Uses user_type field from User model
    Allows access to teachers, receptionists, and admins.
    
    Permission granted if:
    - user.is_staff = True (admin) OR
    - user.user_type = 'instructor' (teacher) OR
    - user.user_type = 'receptionist'
    """
    
    message = "Only administrators, receptionists, and instructors can access this resource."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin check
        if request.user.is_staff:
            return True
        
        # Check user_type
        if hasattr(request.user, 'user_type'):
            if request.user.user_type in ['receptionist', 'instructor']:
                return True
        
        return False


class IsInstructor(permissions.BasePermission):
    """
    ✅ CORRECTED: Uses user_type field from User model
    Check if user is an instructor (teacher).
    
    Permission granted if:
    - user.user_type = 'instructor'
    """
    
    message = "Only instructors can access this resource."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if hasattr(request.user, 'user_type'):
            return request.user.user_type == 'instructor'
        
        return False


class IsStudent(permissions.BasePermission):
    """
    ✅ CORRECTED: Uses user_type field from User model
    Check if user is a student.
    
    Permission granted if:
    - user.user_type = 'student'
    """
    
    message = "Only students can access this resource."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if hasattr(request.user, 'user_type'):
            return request.user.user_type == 'student'
        
        return False


class IsReceptionist(permissions.BasePermission):
    """
    ✅ CORRECTED: Uses user_type field from User model
    Check if user is a receptionist.
    
    Permission granted if:
    - user.user_type = 'receptionist'
    """
    
    message = "Only receptionists can access this resource."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if hasattr(request.user, 'user_type'):
            return request.user.user_type == 'receptionist'
        
        return False


class IsAdmin(permissions.BasePermission):
    """
    ✅ CORRECTED: Uses is_staff flag from User model
    Check if user is an admin.
    
    Permission granted if:
    - user.is_staff = True
    """
    
    message = "Only administrators can access this resource."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow only the owner of an object or admins to access it.
    Assumes the object has an 'owner', 'user', or 'student' field.
    """
    
    message = "You do not have permission to access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admins can access any object
        if request.user.is_staff:
            return True
        
        # Check various field names that might indicate ownership
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True
        
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        if hasattr(obj, 'student') and obj.student == request.user:
            return True
        
        return False


class IsTeacherOrOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission for instructors, the object owner, or admins.
    """
    
    message = "You do not have permission to access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admins can access anything
        if request.user.is_staff:
            return True
        
        # Instructors/teachers can access
        if hasattr(request.user, 'user_type'):
            if request.user.user_type == 'instructor':
                return True
        
        # Users can access their own objects
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True
        
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        if hasattr(obj, 'student') and obj.student == request.user:
            return True
        
        return False