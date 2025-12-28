# chat/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import (
    FriendRequest, Friendship, Chat, DirectMessage, Group,
    GroupJoinRequest, GroupMessage, BlockedUser, Notification, UserOnlineStatus
)
from .serializers import (
    FriendRequestSerializer, FriendshipSerializer, ChatListSerializer,
    ChatDetailSerializer, DirectMessageSerializer, GroupSerializer,
    GroupDetailSerializer, GroupJoinRequestSerializer, GroupMessageSerializer,
    BlockedUserSerializer, NotificationSerializer, UserOnlineStatusSerializer, UserSerializer
)

User = get_user_model()


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Only allow owners of an object to edit it."""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class FriendRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing friend requests"""
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_queryset(self):
        """Get friend requests for current user (sent or received)"""
        user = self.request.user
        return FriendRequest.objects.select_related(
            'from_user', 'from_user__profile',
            'to_user', 'to_user__profile'
        ).filter(
            Q(from_user=user) | Q(to_user=user)
        ).order_by('-created_at')
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Send a friend request"""
        to_user_id = request.data.get('to_user_id')
        
        if not to_user_id:
            return Response(
                {'error': 'to_user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if str(request.user.id) == str(to_user_id):
            return Response(
                {'error': 'You cannot send a friend request to yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        to_user = get_object_or_404(User, id=to_user_id)
        
        # Check if already friends
        if Friendship.objects.filter(
            Q(user1=request.user, user2=to_user) |
            Q(user1=to_user, user2=request.user)
        ).exists():
            return Response(
                {'error': 'You are already friends'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if request already sent by current user
        if FriendRequest.objects.filter(
            from_user=request.user,
            to_user=to_user,
            status='pending'
        ).exists():
             return Response(
                {'error': 'Friend request already sent'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for existing pending request from the recipient to the current user
        if FriendRequest.objects.filter(
            from_user=to_user,
            to_user=request.user,
            status='pending'
        ).exists():
             return Response(
                {'error': 'A pending friend request already exists from this user to you. Accept it instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friend_request = FriendRequest.objects.create(
            from_user=request.user,
            to_user=to_user
        )
        
        # Create notification
        Notification.objects.create(
            user=to_user,
            notification_type='friend_request',
            title=f'{request.user.username} sent you a friend request',
            message=f'{request.user.username} sent you a friend request',
            actor=request.user,
            friend_request=friend_request
        )
        
        serializer = self.get_serializer(friend_request, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a friend request"""
        friend_request = self.get_object()
        
        if friend_request.to_user != request.user:
            return Response(
                {'error': 'You can only accept requests sent to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already accepted/rejected
        if friend_request.status != 'pending':
             return Response(
                {'error': f'Request is already {friend_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        friend_request.status = 'accepted'
        friend_request.save()
        
        # Canonical order for Friendship creation
        user1_id = min(friend_request.from_user_id, friend_request.to_user_id)
        user2_id = max(friend_request.from_user_id, friend_request.to_user_id)
        
        # Create friendship (using get_or_create for idempotence)
        Friendship.objects.get_or_create(
            user1_id=user1_id,
            user2_id=user2_id
        )
        
        # Create notifications
        Notification.objects.create(
            user=friend_request.from_user,
            notification_type='friend_accepted',
            title=f'{request.user.username} accepted your friend request',
            message=f'{request.user.username} accepted your friend request',
            actor=request.user,
            friend_request=friend_request
        )
        
        serializer = self.get_serializer(friend_request, context=self.get_serializer_context())
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a friend request"""
        friend_request = self.get_object()
        
        if friend_request.to_user != request.user:
            return Response(
                {'error': 'You can only reject requests sent to you'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if friend_request.status != 'pending':
             return Response(
                {'error': f'Request is already {friend_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friend_request.status = 'rejected'
        friend_request.save()
        
        serializer = self.get_serializer(friend_request, context=self.get_serializer_context())
        return Response(serializer.data)


class FriendshipViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing friendships"""
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_queryset(self):
        """Get friendships for current user"""
        user = self.request.user
        return Friendship.objects.select_related(
            'user1', 'user1__profile',
            'user2', 'user2__profile'
        ).filter(Q(user1=user) | Q(user2=user))
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'])
    def my_friends(self, request):
        """Get list of current user's friends"""
        user = request.user
        friendships = self.get_queryset()
        
        friend_ids = []
        for friendship in friendships:
            friend_id = friendship.user2_id if friendship.user1 == user else friendship.user1_id
            friend_ids.append(friend_id)
        
        friends = User.objects.select_related('profile').filter(id__in=friend_ids)
        
        page = self.paginate_queryset(friends)
        if page is not None:
            serializer = UserSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)
        
        serializer = UserSerializer(friends, many=True, context=self.get_serializer_context())
        return Response(serializer.data)


class ChatViewSet(viewsets.ModelViewSet):
    """ViewSet for managing chats"""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatDetailSerializer
        return ChatListSerializer
    
    def get_queryset(self):
        """Get chats for current user"""
        return Chat.objects.select_related(
        ).prefetch_related(
            'participants__profile',
            'messages__sender__profile'
        ).filter(
            participants=self.request.user
        ).order_by('-updated_at')
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        to_user_id = request.data.get('to_user_id')
        to_user = get_object_or_404(User, id=to_user_id)
        
        # 1. Check if chat exists (Order agnostic)
        chat = Chat.objects.filter(participants=request.user).filter(participants=to_user).first()
        
        if chat:
            serializer = self.get_serializer(chat)
            return Response(serializer.data)
        
        # 2. Only create if NO chat exists
        chat = Chat.objects.create()
        chat.participants.add(request.user, to_user)
        
        serializer = self.get_serializer(chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DirectMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing direct messages"""
    serializer_class = DirectMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_queryset(self):
        """Get messages: 
           - For LIST: Requires chat_id param
           - For DETAIL/ACTIONS: Returns any message belonging to a chat the user is in
        """
        user = self.request.user
        
        # 1. Base security: User can only see messages from chats they are in
        queryset = DirectMessage.objects.filter(
            chat__participants=user
        ).select_related('sender__profile')

        # 2. If listing messages, STRICTLY require chat_id
        if self.action == 'list':
            chat_id = self.request.query_params.get('chat_id')
            if chat_id:
                return queryset.filter(chat_id=chat_id).order_by('-timestamp')
            return DirectMessage.objects.none()

        # 3. For actions like 'mark_as_read', return the filtered queryset
        return queryset
    
    def get_serializer_context(self):
        # ... (keep existing code)
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Create a new direct message"""
        chat_id = request.data.get('chat')
        content = request.data.get('content')
        
        if not chat_id or not content:
            return Response(
                {'error': 'chat and content are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        chat = get_object_or_404(Chat, id=chat_id)
        
        # Verify user is in this chat
        if not chat.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a member of this chat'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message = DirectMessage.objects.create(
            chat=chat,
            sender=request.user,
            content=content
        )
        
        # Update chat's last message time
        chat.last_message_time = timezone.now()
        chat.save()
        
        serializer = self.get_serializer(message, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        
        if message.sender == request.user:
            return Response(
                {'error': 'You cannot mark your own messages as read'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.is_read = True
        message.read_at = timezone.now()
        message.save()
        
        serializer = self.get_serializer(message, context=self.get_serializer_context())
        return Response(serializer.data)


class GroupViewSet(viewsets.ModelViewSet):
    """ViewSet for managing groups"""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GroupDetailSerializer
        return GroupSerializer
    
    def get_queryset(self):
        """Get groups for current user"""
        return Group.objects.select_related(
            'admin__profile'
        ).prefetch_related(
            'members__profile',
            'messages__sender__profile'
        ).filter(members=self.request.user).order_by('-created_at')
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Create a new group"""
        name = request.data.get('name')
        description = request.data.get('description', '')
        member_ids = request.data.get('member_ids', [])
        
        if not name:
            return Response(
                {'error': 'name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        group = Group.objects.create(
            name=name,
            description=description,
            admin=request.user
        )
        group.members.add(request.user)
        
        # Add other members
        if member_ids:
            members = User.objects.filter(id__in=member_ids)
            group.members.add(*members)
            
            # Create notifications for new members
            for member in members:
                Notification.objects.create(
                    user=member,
                    notification_type='group_member_added',
                    title=f'Added to group {group.name}',
                    message=f'{request.user.username} added you to {group.name}',
                    actor=request.user,
                    group=group
                )
        
        serializer = self.get_serializer(group, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the group"""
        group = self.get_object()
        
        if group.admin != request.user:
            return Response(
                {'error': 'Only group admin can add members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = get_object_or_404(User, id=user_id)
        
        if group.members.filter(id=user.id).exists():
            return Response(
                {'error': 'User is already a member'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        group.members.add(user)
        
        # Create notification
        Notification.objects.create(
            user=user,
            notification_type='group_member_added',
            title=f'Added to group {group.name}',
            message=f'{request.user.username} added you to {group.name}',
            actor=request.user,
            group=group
        )
        
        serializer = self.get_serializer(group, context=self.get_serializer_context())
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a member from the group"""
        group = self.get_object()
        
        if group.admin != request.user:
            return Response(
                {'error': 'Only group admin can remove members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = get_object_or_404(User, id=user_id)
        
        if not group.members.filter(id=user.id).exists():
            return Response(
                {'error': 'User is not a member'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        group.members.remove(user)
        
        # Create notification
        Notification.objects.create(
            user=user,
            notification_type='group_member_removed',
            title=f'Removed from group {group.name}',
            message=f'You were removed from {group.name}',
            actor=request.user,
            group=group
        )
        
        serializer = self.get_serializer(group, context=self.get_serializer_context())
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a group"""
        group = self.get_object()
        
        if not group.members.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a member of this group'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if group.admin == request.user:
            if group.members.count() == 1:
                group.delete()
                return Response({'success': 'Group deleted'}, status=status.HTTP_204_NO_CONTENT)
            else:
                other_members = group.members.exclude(id=request.user.id).order_by('id')
                if other_members.exists():
                    new_admin = other_members.first()
                    group.admin = new_admin
                    group.save()
        
        group.members.remove(request.user)
        return Response({'success': 'Left group'}, status=status.HTTP_200_OK)


class GroupMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing group messages"""
    serializer_class = GroupMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_queryset(self):
        """Get messages for current user's groups"""
        group_id = self.request.query_params.get('group_id')
        if group_id:
            if not Group.objects.filter(id=group_id, members=self.request.user).exists():
                 return GroupMessage.objects.none()
            return GroupMessage.objects.select_related(
                'sender__profile'
            ).filter(group_id=group_id).order_by('-timestamp')
        return GroupMessage.objects.none()
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Create a new group message"""
        group_id = request.data.get('group')
        content = request.data.get('content')
        
        if not group_id or not content:
            return Response(
                {'error': 'group and content are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        group = get_object_or_404(Group, id=group_id)
        
        # Verify user is a member
        if not group.members.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a member of this group'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message = GroupMessage.objects.create(
            group=group,
            sender=request.user,
            content=content
        )
        
        serializer = self.get_serializer(message, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BlockedUserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing blocked users"""
    serializer_class = BlockedUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_queryset(self):
        """Get blocked users by current user"""
        return BlockedUser.objects.select_related(
            'user__profile',
            'blocked_user__profile'
        ).filter(user=self.request.user)
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Block a user"""
        blocked_user_id = request.data.get('blocked_user_id')
        
        if not blocked_user_id:
            return Response(
                {'error': 'blocked_user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if str(request.user.id) == str(blocked_user_id):
            return Response(
                {'error': 'You cannot block yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        blocked_user = get_object_or_404(User, id=blocked_user_id)
        
        blocked, created = BlockedUser.objects.get_or_create(
            user=request.user,
            blocked_user=blocked_user
        )
        
        if not created:
            return Response(
                {'error': 'User is already blocked'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Remove friendship and cancel pending friend requests
        Friendship.objects.filter(
            Q(user1=request.user, user2=blocked_user) |
            Q(user1=blocked_user, user2=request.user)
        ).delete()
        
        FriendRequest.objects.filter(
            Q(from_user=request.user, to_user=blocked_user) |
            Q(from_user=blocked_user, to_user=request.user)
        ).update(status='rejected')
        
        serializer = self.get_serializer(blocked, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        """Unblock a user"""
        blocked = self.get_object()
        
        if blocked.user != request.user:
            return Response(
                {'error': 'You can only unblock users you have blocked'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        blocked.delete()
        return Response({'success': 'User unblocked'}, status=status.HTTP_204_NO_CONTENT)


# chat/views.py

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for managing notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    
    def get_queryset(self):
        """Get notifications for current user"""
        return Notification.objects.select_related(
            'user__profile',
            'actor__profile'
        ).filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    # 👇 ADD THIS NEW METHOD 👇
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    # 👆 END OF NEW METHOD 👆
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        serializer = self.get_serializer(notification, context=self.get_serializer_context())
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'success': 'All notifications marked as read'})


class UserOnlineStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user online status"""
    serializer_class = UserOnlineStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get online status for all users"""
        return UserOnlineStatus.objects.select_related('user__profile').all()
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'])
    def online_friends(self, request):
        """Get list of online friends"""
        user = request.user
        friendships = Friendship.objects.filter(
            Q(user1=user) | Q(user2=user)
        )
        
        friend_ids = []
        for friendship in friendships:
            friend_id = friendship.user2_id if friendship.user1 == user else friendship.user1_id
            friend_ids.append(friend_id)
            
        online_friends = User.objects.select_related('profile').filter(
            id__in=friend_ids,
            online_status__is_online=True
        )
        
        page = self.paginate_queryset(online_friends)
        if page is not None:
            serializer = UserSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)
        
        serializer = UserSerializer(online_friends, many=True, context=self.get_serializer_context())
        return Response(serializer.data)
    
from .serializers import UserMinimalSerializer
# chat/views.py

# chat/views.py

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet to list ALL users (Students, Teachers, Admins, Staff) from lms_user table.
    """
    serializer_class = UserMinimalSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        # 1. Fetch ALL active users from the main table (excluding yourself)
        # This includes Admins, Superusers, Teachers, Students, etc.
        queryset = User.objects.filter(is_active=True).exclude(id=self.request.user.id).order_by('-date_joined')
        
        # 2. Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__full_name__icontains=search) |
                Q(student__firstName__icontains=search) |
                Q(teacher__First_Name__icontains=search) |
                Q(receptionist__First_Name__icontains=search) # Added Receptionist search
            ).distinct()
            
        return queryset