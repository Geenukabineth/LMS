# chat/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from lms.models import User, Student

from django.conf import settings


class FriendRequest(models.Model):
    # ... (code for FriendRequest remains the same)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    from_user = models.ForeignKey(User, related_name='sent_friend_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='received_friend_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_friend_request'
        unique_together = ('from_user', 'to_user')
        
    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"


class Friendship(models.Model):
    # ... (code for Friendship remains the same)
    """Model to represent confirmed friendships"""
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='friendships_as_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='friendships_as_user2', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_friendship'
        unique_together = ('user1', 'user2')
    
    def __str__(self):
        return f"{self.user1.username} <-> {self.user2.username}"


class Chat(models.Model):
    # ... (code for Chat remains the same)
    """Model for one-on-one chats"""
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='direct_chats')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_time = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'chat_direct_chat'
        
    def __str__(self):
        return f"Chat: {', '.join([p.username for p in self.participants.all()])}"
    
    @property
    def other_user(self):
        """Get the other user in the chat (excluding current user)"""
        # NOTE: self.user_id is not set on the model instance. This property
        # should ideally be resolved in the serializer/view with a request context.
        # Keeping it for now, but it's flawed for generic model use.
        return self.participants.exclude(id=self.user_id).first()
    
    def get_last_message(self):
        """Get the last message in this chat"""
        return self.messages.order_by('-timestamp').first()


class DirectMessage(models.Model):
    # ... (code for DirectMessage remains the same)
    """Model for direct messages between two users"""
    chat = models.ForeignKey(Chat, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'chat_direct_message'
        ordering = ['timestamp']
        
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


class Group(models.Model):
    """Model for group chats"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='created_groups', on_delete=models.CASCADE)
    # FIX: Changed "lms.User" to settings.AUTH_USER_MODEL
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_group')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    group_image = models.ImageField(upload_to='group_images/', null=True, blank=True)
    
    class Meta:
        db_table = 'chat_group'
        
    def __str__(self):
        return self.name
    
    def member_count(self):
        return self.members.count()


class GroupJoinRequest(models.Model):
    # ... (code for GroupJoinRequest remains the same)
    """Model for group join requests"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_group_requests', on_delete=models.CASCADE)
    group = models.ForeignKey(Group, related_name='join_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_group_join_request'
        unique_together = ('from_user', 'group')
        
    def __str__(self):
        return f"{self.from_user.username} -> {self.group.name} ({self.status})"


class GroupMessage(models.Model):
    # ... (code for GroupMessage remains the same)
    """Model for group chat messages"""
    group = models.ForeignKey(Group, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_group_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_group_message'
        ordering = ['timestamp']
        
    def __str__(self):
        return f"{self.sender.username} in {self.group.name}: {self.content[:50]}"


class BlockedUser(models.Model):
    # ... (code for BlockedUser remains the same)
    """Model to track blocked users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='blocking', on_delete=models.CASCADE)
    blocked_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='blocked_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_blocked_user'
        unique_together = ('user', 'blocked_user')
        
    def __str__(self):
        return f"{self.user.username} blocked {self.blocked_user.username}"


class Notification(models.Model):
    """Model for user notifications"""
    NOTIFICATION_TYPES = [
        ('friend_request', 'Friend Request'),
        ('friend_accepted', 'Friend Accepted'),
        ('message', 'New Message'),
        ('group_invite', 'Group Invite'),
        ('group_message', 'Group Message'),
        ('group_member_added', 'Member Added to Group'),
        ('group_member_removed', 'Member Removed from Group'),
        ('plagiarism_alert', 'Plagiarism Alert'),
        ('misconduct_alert', 'Misconduct Alert'),
        ('assignment_due', 'Assignment Due'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='notifications', on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='triggered_notifications', on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Links to related objects
    friend_request = models.ForeignKey(FriendRequest, on_delete=models.SET_NULL, null=True, blank=True)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True)
    chat = models.ForeignKey(Chat, on_delete=models.SET_NULL, null=True, blank=True)
    # FIX: Removed redundant message field
    
    class Meta:
        db_table = 'chat_notification'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class UserOnlineStatus(models.Model):
    # ... (code for UserOnlineStatus remains the same)
    """Model to track user online/offline status"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='online_status', on_delete=models.CASCADE)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_user_online_status'
        
    def __str__(self):
        return f"{self.user.username} - {'Online' if self.is_online else 'Offline'}"


# Signal handlers
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_online_status(sender, instance, created, **kwargs):
    """Create UserOnlineStatus when a new user is created"""
    if created:
        UserOnlineStatus.objects.get_or_create(user=instance)