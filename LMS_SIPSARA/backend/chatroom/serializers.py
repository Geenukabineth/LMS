# chat/serializers.py - FIXED VERSION FOR YOUR LMS USER MODEL
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    FriendRequest, Friendship, Chat, DirectMessage, Group, 
    GroupJoinRequest, GroupMessage, BlockedUser, Notification, UserOnlineStatus
)
from lms.models import Profile, Student, Teacher, Receptionist

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile model - MATCHES YOUR LMS FIELDS"""
    class Meta:
        model = Profile
        fields = ['full_name', 'image', 'phoneNumber', 'email', 'date']
        read_only_fields = ['full_name', 'date']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for Student profile - CORRECTED FIELD NAMES"""
    class Meta:
        model = Student
        fields = [
            'firstName', 'lastName', 'email', 'phone',
            'academicYear', 'Grade', 'classroom', 'School',
            'image', 'birth_date', 'address', 'city', 'state'
        ]


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for Teacher profile - CORRECTED FIELD NAMES"""
    total_students = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'First_Name', 'Last_Name', 'Email_Address',
            'Phone_Number', 'Department', 'Date_Joined',
            'gender', 'total_students'
        ]
    
    def get_total_students(self, obj):
        """Get count of students taught by this teacher"""
        return obj.total_student()


class ReceptionistProfileSerializer(serializers.ModelSerializer):
    """Serializer for Receptionist profile"""
    class Meta:
        model = Receptionist
        fields = [
            'First_Name', 'Last_Name', 'Email_Address',
            'Phone_Number', 'Date_Joined', 'gender'
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    Complete User serializer with all related data
    FIXED: Properly handles optional related models
    Matches your SIPSARA LMS User structure
    """
    profile = ProfileSerializer(read_only=True)
    student = StudentProfileSerializer(read_only=True)
    teacher = TeacherProfileSerializer(read_only=True)
    receptionist = ReceptionistProfileSerializer(read_only=True)
    is_online = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    display_image = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'user_type',
            'is_staff', 'is_active', 'date_joined', 'last_login',
            'is_online', 'full_name', 'display_image',
            'profile', 'student', 'teacher', 'receptionist'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'is_staff', 'is_active'
        ]
    
    def get_full_name(self, obj):
        """
        Get full name from profile, student, teacher, or receptionist
        Falls back to username if nothing else available
        """
        # Try profile first
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.full_name:
                return obj.profile.full_name
        except Profile.DoesNotExist:
            pass
        
        # Try student profile
        try:
            if hasattr(obj, 'student') and obj.student:
                return f"{obj.student.firstName} {obj.student.lastName}".strip()
        except Student.DoesNotExist:
            pass
        
        # Try teacher profile
        try:
            if hasattr(obj, 'teacher') and obj.teacher:
                return f"{obj.teacher.First_Name} {obj.teacher.Last_Name}".strip()
        except Teacher.DoesNotExist:
            pass
        
        # Try receptionist profile
        try:
            if hasattr(obj, 'receptionist') and obj.receptionist:
                return f"{obj.receptionist.First_Name} {obj.receptionist.Last_Name}".strip()
        except Receptionist.DoesNotExist:
            pass
        
        # Fallback to username
        return obj.username
    
    def get_is_online(self, obj):
        """Check if user is online via UserOnlineStatus"""
        try:
            return obj.online_status.is_online
        except (AttributeError, UserOnlineStatus.DoesNotExist):
            return False
    
    def get_display_image(self, obj):
        """Get the best image available for user"""
        # Try student image first
        try:
            if hasattr(obj, 'student') and obj.student and obj.student.image:
                return obj.student.image.url
        except:
            pass
        
        # Try profile image
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.image:
                return obj.profile.image.url
        except:
            pass
        
        return None


class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer for nested use in other serializers
    FIXED: Properly handles missing relations
    """
    is_online = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    display_image = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'user_type',
            'is_online', 'full_name', 'display_image', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_full_name(self, obj):
        """Get full name with fallback chain"""
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.full_name:
                return obj.profile.full_name
        except Profile.DoesNotExist:
            pass
        
        try:
            if hasattr(obj, 'student') and obj.student:
                return f"{obj.student.firstName} {obj.student.lastName}".strip()
        except Student.DoesNotExist:
            pass
        
        try:
            if hasattr(obj, 'teacher') and obj.teacher:
                return f"{obj.teacher.First_Name} {obj.teacher.Last_Name}".strip()
        except Teacher.DoesNotExist:
            pass
        
        return obj.username
    
    def get_is_online(self, obj):
        """Check if user is online"""
        try:
            return obj.online_status.is_online
        except (AttributeError, UserOnlineStatus.DoesNotExist):
            return False
    
    def get_display_image(self, obj):
        """Get user image with fallback"""
        try:
            if hasattr(obj, 'student') and obj.student and obj.student.image:
                return obj.student.image.url
        except:
            pass
        
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.image:
                return obj.profile.image.url
        except:
            pass
        
        return None


class FriendRequestSerializer(serializers.ModelSerializer):
    """Serializer for FriendRequest model"""
    from_user = UserMinimalSerializer(read_only=True)
    from_user_id = serializers.IntegerField(write_only=True)
    to_user = UserMinimalSerializer(read_only=True)
    to_user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = FriendRequest
        fields = [
            'id', 'from_user', 'from_user_id', 'to_user', 'to_user_id',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for Friendship model"""
    user1 = UserMinimalSerializer(read_only=True)
    user2 = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Friendship
        fields = ['id', 'user1', 'user2', 'created_at']
        read_only_fields = ['id', 'created_at']


class DirectMessageSerializer(serializers.ModelSerializer):
    """Serializer for DirectMessage model"""
    sender = UserMinimalSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = DirectMessage
        fields = [
            'id', 'chat', 'sender', 'sender_id', 'content',
            'timestamp', 'is_read', 'read_at'
        ]
        read_only_fields = ['id', 'timestamp']


class ChatListSerializer(serializers.ModelSerializer):
    """Serializer for Chat list view"""
    participants = UserMinimalSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = [
            'id', 'participants', 'other_user', 'last_message',
            'unread_count', 'created_at', 'updated_at', 'last_message_time'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        """Get the last message in the chat"""
        message = obj.get_last_message()
        if message:
            return DirectMessageSerializer(message, context=self.context).data
        return None
    
    def get_other_user(self, obj):
        """Get the other user in the direct chat"""
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user:
                return UserMinimalSerializer(other_user, context=self.context).data
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count"""
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class ChatDetailSerializer(serializers.ModelSerializer):
    """Serializer for Chat detail view"""
    participants = UserMinimalSerializer(many=True, read_only=True)
    messages = DirectMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chat
        fields = ['id', 'participants', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class GroupMessageSerializer(serializers.ModelSerializer):
    """Serializer for GroupMessage model"""
    sender = UserMinimalSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = GroupMessage
        fields = ['id', 'group', 'sender', 'sender_id', 'content', 'timestamp']
        read_only_fields = ['id', 'timestamp']


# chat/serializers.py

class GroupSerializer(serializers.ModelSerializer):
    """Serializer for Group model"""
    admin = UserMinimalSerializer(read_only=True)
    members = UserMinimalSerializer(many=True, read_only=True)
    
    # ❌ OLD ERROR LINE:
    # member_count = serializers.IntegerField(source='member_count', read_only=True)
    
    # ✅ NEW CORRECT LINE: (Remove source='member_count')
    member_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'admin', 
            'members', 'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'admin']
    
    def get_is_admin(self, obj):
        """Check if current user is admin"""
        request = self.context.get('request')
        return request and request.user and obj.admin_id == request.user.id
    
    def get_is_member(self, obj):
        """Check if current user is member"""
        request = self.context.get('request')
        return request and request.user and obj.members.filter(id=request.user.id).exists()


class GroupDetailSerializer(serializers.ModelSerializer):
    """Serializer for Group detail with messages"""
    admin = UserMinimalSerializer(read_only=True)
    members = UserMinimalSerializer(many=True, read_only=True)
    messages = GroupMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'admin', 'members', 'messages',
            'group_image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GroupJoinRequestSerializer(serializers.ModelSerializer):
    """Serializer for GroupJoinRequest model"""
    from_user = UserMinimalSerializer(read_only=True)
    from_user_id = serializers.IntegerField(write_only=True)
    group = GroupSerializer(read_only=True)
    group_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = GroupJoinRequest
        fields = [
            'id', 'from_user', 'from_user_id', 'group', 'group_id',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BlockedUserSerializer(serializers.ModelSerializer):
    """Serializer for BlockedUser model"""
    user = UserMinimalSerializer(read_only=True)
    blocked_user = UserMinimalSerializer(read_only=True)
    blocked_user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = BlockedUser
        fields = ['id', 'user', 'blocked_user', 'blocked_user_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    user = UserMinimalSerializer(read_only=True)
    actor = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'actor', 'is_read', 'read_at', 'created_at',
            'friend_request', 'group', 'chat'
        ]
        read_only_fields = ['id', 'created_at']


class UserOnlineStatusSerializer(serializers.ModelSerializer):
    """Serializer for UserOnlineStatus model"""
    user = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = UserOnlineStatus
        fields = ['id', 'user', 'is_online', 'last_seen']
        read_only_fields = ['id', 'last_seen']



class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer for nested use in other serializers
    """
    is_online = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    display_image = serializers.SerializerMethodField()
    
    # 👇 This 'Meta' class MUST be indented inside UserMinimalSerializer
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'user_type',
            'is_online', 'full_name', 'display_image', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_full_name(self, obj):
        """Get full name with fallback for Admins"""
        # 1. Try Profile
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.full_name:
                return obj.profile.full_name
        except: pass
        
        # 2. Try Student
        try:
            if hasattr(obj, 'student') and obj.student:
                return f"{obj.student.firstName} {obj.student.lastName}".strip()
        except: pass
        
        # 3. Try Teacher
        try:
            if hasattr(obj, 'teacher') and obj.teacher:
                return f"{obj.teacher.First_Name} {obj.teacher.Last_Name}".strip()
        except: pass
        
        # 4. Try Receptionist
        try:
            if hasattr(obj, 'receptionist') and obj.receptionist:
                return f"{obj.receptionist.First_Name} {obj.receptionist.Last_Name}".strip()
        except: pass

        # 5. Fallback to username (Covers Admins/Superusers)
        return obj.username
    
    def get_is_online(self, obj):
        """Check if user is online"""
        try:
            return obj.online_status.is_online
        except (AttributeError, UserOnlineStatus.DoesNotExist):
            return False
    
    def get_display_image(self, obj):
        """Get user image with fallback"""
        # Try student image
        try:
            if hasattr(obj, 'student') and obj.student and obj.student.image:
                return obj.student.image.url
        except: pass
        
        # Try profile image
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.image:
                return obj.profile.image.url
        except: pass
        
        return None