# chat/admin.py
from django.contrib import admin
from .models import (
    FriendRequest, Friendship, Chat, DirectMessage, Group,
    GroupJoinRequest, GroupMessage, BlockedUser, Notification, UserOnlineStatus
)


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_user', 'to_user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('from_user__username', 'to_user__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user1', 'user2', 'created_at')
    search_fields = ('user1__username', 'user2__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'participant_names', 'created_at', 'updated_at', 'last_message_time')
    filter_horizontal = ('participants',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    def participant_names(self, obj):
        return ', '.join([p.username for p in obj.participants.all()])
    participant_names.short_description = 'Participants'


@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat', 'sender', 'content_preview', 'timestamp', 'is_read')
    list_filter = ('is_read', 'timestamp')
    search_fields = ('sender__username', 'content')
    date_hierarchy = 'timestamp'
    readonly_fields = ('timestamp', 'read_at')
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'admin', 'member_count', 'created_at')
    filter_horizontal = ('members',)
    search_fields = ('name', 'admin__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(GroupJoinRequest)
class GroupJoinRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_user', 'group', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('from_user__username', 'group__name')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'sender', 'content_preview', 'timestamp')
    search_fields = ('sender__username', 'group__name', 'content')
    date_hierarchy = 'timestamp'
    readonly_fields = ('timestamp',)
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'blocked_user', 'created_at')
    search_fields = ('user__username', 'blocked_user__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)


@admin.register(UserOnlineStatus)
class UserOnlineStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'is_online', 'last_seen')
    list_filter = ('is_online', 'last_seen')
    search_fields = ('user__username',)
    readonly_fields = ('last_seen',)