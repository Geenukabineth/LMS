# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import (
    DirectMessage, Chat, GroupMessage, Group, FriendRequest,
    Friendship, Notification, UserOnlineStatus, GroupJoinRequest
)

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat functionality"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']
        self.user_id = self.user.id
        self.room_group_name = f'chat_{self.user_id}'
        
        # Add user to their chat group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Set user as online
        await self.set_user_online(True)
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Set user as offline
        await self.set_user_online(False)
        
        # Remove user from chat group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'direct_message':
            await self.handle_direct_message(data)
        elif message_type == 'group_message':
            await self.handle_group_message(data)
        elif message_type == 'friend_request':
            await self.handle_friend_request(data)
        elif message_type == 'friend_request_accept':
            await self.handle_friend_request_accept(data)
        elif message_type == 'friend_request_reject':
            await self.handle_friend_request_reject(data)
        elif message_type == 'group_invite':
            await self.handle_group_invite(data)
        elif message_type == 'group_invite_accept':
            await self.handle_group_invite_accept(data)
        elif message_type == 'group_invite_reject':
            await self.handle_group_invite_reject(data)
        elif message_type == 'typing':
            await self.handle_typing(data)
        elif message_type == 'stop_typing':
            await self.handle_stop_typing(data)
    
    async def handle_direct_message(self, data):
        """Handle direct message"""
        to_user_id = data.get('to_user_id')
        chat_id = data.get('chat_id')
        content = data.get('content')
        
        if not to_user_id or not content:
            return
        
        # Save message to database
        message = await self.save_direct_message(chat_id, to_user_id, content)
        
        # Get complete sender data
        sender_data = await self.get_user_data(self.user_id)
        
        # Send to recipient
        recipient_group = f'chat_{to_user_id}'
        await self.channel_layer.group_send(
            recipient_group,
            {
                'type': 'direct_message',
                'message': {
                    'id': message['id'],
                    'chat_id': message['chat_id'],
                    'sender': sender_data,
                    'content': content,
                    'timestamp': message['timestamp'],
                    'is_sender': False,
                }
            }
        )
        
        # Send to sender
        await self.direct_message({
            'message': {
                'id': message['id'],
                'chat_id': message['chat_id'],
                'sender': sender_data,
                'content': content,
                'timestamp': message['timestamp'],
                'is_sender': True,
            }
        })
    
    async def handle_group_message(self, data):
        """Handle group message"""
        group_id = data.get('group_id')
        content = data.get('content')
        
        if not group_id or not content:
            return
        
        # Save message to database
        message = await self.save_group_message(group_id, content)
        
        # Get complete sender data
        sender_data = await self.get_user_data(self.user_id)
        
        # Get group members
        members = await self.get_group_members(group_id)
        
        # Send to all group members
        for member_id in members:
            group_name = f'chat_{member_id}'
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'group_message',
                    'message': {
                        'id': message['id'],
                        'group_id': group_id,
                        'sender': sender_data,
                        'content': content,
                        'timestamp': message['timestamp'],
                        'is_sender': member_id == self.user_id,
                    }
                }
            )
    
    async def handle_friend_request(self, data):
        """Handle friend request"""
        to_user_id = data.get('to_user_id')
        
        if not to_user_id:
            return
        
        # Create friend request
        request_data = await self.create_friend_request(to_user_id)
        
        if request_data:
            # Send notification to recipient
            recipient_group = f'chat_{to_user_id}'
            await self.channel_layer.group_send(
                recipient_group,
                {
                    'type': 'friend_request',
                    'request': request_data
                }
            )
    
    async def handle_friend_request_accept(self, data):
        """Handle friend request acceptance"""
        request_id = data.get('request_id')
        
        if not request_id:
            return
        
        # Accept request and create friendship
        request_data = await self.accept_friend_request(request_id)
        
        if request_data:
            # Get sender data
            sender_data = await self.get_user_data(self.user_id)
            
            # Send notification to original requester
            requester_id = request_data['from_user_id']
            requester_group = f'chat_{requester_id}'
            
            await self.channel_layer.group_send(
                requester_group,
                {
                    'type': 'friend_request_accepted',
                    'data': {
                        'user': sender_data,
                        'request_id': request_id,
                    }
                }
            )
    
    async def handle_friend_request_reject(self, data):
        """Handle friend request rejection"""
        request_id = data.get('request_id')
        
        if not request_id:
            return
        
        # Reject request
        await self.reject_friend_request(request_id)
    
    async def handle_group_invite(self, data):
        """Handle group invitation"""
        user_id = data.get('user_id')
        group_id = data.get('group_id')
        
        if not user_id or not group_id:
            return
        
        # Create group join request
        request_data = await self.create_group_invite(user_id, group_id)
        
        if request_data:
            # Send notification to invited user
            user_group = f'chat_{user_id}'
            await self.channel_layer.group_send(
                user_group,
                {
                    'type': 'group_invite',
                    'request': request_data
                }
            )
    
    async def handle_group_invite_accept(self, data):
        """Handle group invite acceptance"""
        request_id = data.get('request_id')
        
        if not request_id:
            return
        
        # Accept invite
        result = await self.accept_group_invite(request_id)
        
        if result:
            # Get sender data
            sender_data = await self.get_user_data(self.user_id)
            
            # Broadcast to all group members
            group_id = result['group_id']
            members = await self.get_group_members(group_id)
            
            for member_id in members:
                group_name = f'chat_{member_id}'
                await self.channel_layer.group_send(
                    group_name,
                    {
                        'type': 'group_member_added',
                        'data': {
                            'group_id': group_id,
                            'user': sender_data,
                            'message': f'{sender_data["username"]} joined the group'
                        }
                    }
                )
    
    async def handle_group_invite_reject(self, data):
        """Handle group invite rejection"""
        request_id = data.get('request_id')
        
        if not request_id:
            return
        
        # Reject invite
        await self.reject_group_invite(request_id)
    
    async def handle_typing(self, data):
        """Handle typing indicator"""
        chat_id = data.get('chat_id')
        group_id = data.get('group_id')
        
        sender_data = await self.get_user_data(self.user_id)
        
        if chat_id:
            # Get other participant
            other_user_id = await self.get_chat_other_user(chat_id)
            if other_user_id:
                recipient_group = f'chat_{other_user_id}'
                await self.channel_layer.group_send(
                    recipient_group,
                    {
                        'type': 'user_typing',
                        'data': {
                            'user': sender_data,
                            'chat_id': chat_id,
                        }
                    }
                )
        elif group_id:
            # Send to all group members
            members = await self.get_group_members(group_id)
            for member_id in members:
                if member_id != self.user_id:
                    group_name = f'chat_{member_id}'
                    await self.channel_layer.group_send(
                        group_name,
                        {
                            'type': 'user_typing',
                            'data': {
                                'user': sender_data,
                                'group_id': group_id,
                            }
                        }
                    )
    
    async def handle_stop_typing(self, data):
        """Handle stop typing indicator"""
        chat_id = data.get('chat_id')
        group_id = data.get('group_id')
        
        sender_data = await self.get_user_data(self.user_id)
        
        if chat_id:
            other_user_id = await self.get_chat_other_user(chat_id)
            if other_user_id:
                recipient_group = f'chat_{other_user_id}'
                await self.channel_layer.group_send(
                    recipient_group,
                    {
                        'type': 'user_stop_typing',
                        'data': {
                            'user': sender_data,
                            'chat_id': chat_id,
                        }
                    }
                )
        elif group_id:
            members = await self.get_group_members(group_id)
            for member_id in members:
                if member_id != self.user_id:
                    group_name = f'chat_{member_id}'
                    await self.channel_layer.group_send(
                        group_name,
                        {
                            'type': 'user_stop_typing',
                            'data': {
                                'user': sender_data,
                                'group_id': group_id,
                            }
                        }
                    )
    
    # WebSocket receive handlers
    async def direct_message(self, event):
        """Send direct message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'direct_message',
            'payload': event['message']
        }))
    
    async def group_message(self, event):
        """Send group message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'group_message',
            'payload': event['message']
        }))
    
    async def friend_request(self, event):
        """Send friend request to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'friend_request',
            'payload': event['request']
        }))
    
    async def friend_request_accepted(self, event):
        """Send friend request acceptance to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'friend_request_accepted',
            'payload': event['data']
        }))
    
    async def group_invite(self, event):
        """Send group invite to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'group_invite',
            'payload': event['request']
        }))
    
    async def group_member_added(self, event):
        """Send group member added notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'group_member_added',
            'payload': event['data']
        }))
    
    async def user_typing(self, event):
        """Send typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'payload': event['data']
        }))
    
    async def user_stop_typing(self, event):
        """Send stop typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'stop_typing',
            'payload': event['data']
        }))
    
    # Database operations
    @database_sync_to_async
    def save_direct_message(self, chat_id, to_user_id, content):
        """Save direct message to database"""
        try:
            chat = Chat.objects.get(id=chat_id)
            message = DirectMessage.objects.create(
                chat=chat,
                sender=self.user,
                content=content
            )
            
            # Update chat last message time
            chat.last_message_time = message.timestamp
            chat.save()
            
            return {
                'id': message.id,
                'chat_id': message.chat_id,
                'timestamp': message.timestamp.isoformat(),
            }
        except Chat.DoesNotExist:
            return None
    
    @database_sync_to_async
    def save_group_message(self, group_id, content):
        """Save group message to database"""
        try:
            group = Group.objects.get(id=group_id)
            message = GroupMessage.objects.create(
                group=group,
                sender=self.user,
                content=content
            )
            
            return {
                'id': message.id,
                'group_id': message.group_id,
                'timestamp': message.timestamp.isoformat(),
            }
        except Group.DoesNotExist:
            return None
    
    @database_sync_to_async
    def set_user_online(self, is_online):
        """Set user online status"""
        try:
            status_obj = UserOnlineStatus.objects.get(user=self.user)
            status_obj.is_online = is_online
            status_obj.save()
        except UserOnlineStatus.DoesNotExist:
            UserOnlineStatus.objects.create(user=self.user, is_online=is_online)
    
    @database_sync_to_async
    def get_user_data(self, user_id):
        """Get comprehensive user data"""
        try:
            from lms.models import Profile
            user = User.objects.select_related('profile').get(id=user_id)
            online_status = UserOnlineStatus.objects.filter(user=user).first()
            
            # Get full name from profile
            full_name = user.username
            if user.profile and user.profile.full_name:
                full_name = user.profile.full_name
            
            # Get profile image
            image = None
            if user.profile and user.profile.image:
                image = user.profile.image.url
            
            return {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type,
                'is_online': online_status.is_online if online_status else False,
                'image': image,
                'full_name': full_name,
            }
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def create_friend_request(self, to_user_id):
        """Create friend request"""
        try:
            to_user = User.objects.get(id=to_user_id)
            friend_request = FriendRequest.objects.create(
                from_user=self.user,
                to_user=to_user
            )
            
            # Create notification
            Notification.objects.create(
                user=to_user,
                notification_type='friend_request',
                title=f'{self.user.username} sent you a friend request',
                message=f'{self.user.username} sent you a friend request',
                actor=self.user,
                friend_request=friend_request
            )
            
            sender_data = self.get_user_data_sync(self.user_id)
            
            return {
                'id': friend_request.id,
                'sender': sender_data,
                'to_user_id': to_user_id,
            }
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def accept_friend_request(self, request_id):
        """Accept friend request"""
        try:
            friend_request = FriendRequest.objects.get(id=request_id)
            friend_request.status = 'accepted'
            friend_request.save()
            
            # Create friendship
            user1_id = min(friend_request.from_user_id, friend_request.to_user_id)
            user2_id = max(friend_request.from_user_id, friend_request.to_user_id)
            
            Friendship.objects.get_or_create(
                user1_id=user1_id,
                user2_id=user2_id
            )
            
            # Create notification
            Notification.objects.create(
                user=friend_request.from_user,
                notification_type='friend_accepted',
                title=f'{self.user.username} accepted your friend request',
                message=f'{self.user.username} accepted your friend request',
                actor=self.user,
                friend_request=friend_request
            )
            
            return {
                'id': friend_request.id,
                'from_user_id': friend_request.from_user_id,
                'status': 'accepted',
            }
        except FriendRequest.DoesNotExist:
            return None
    
    @database_sync_to_async
    def reject_friend_request(self, request_id):
        """Reject friend request"""
        try:
            friend_request = FriendRequest.objects.get(id=request_id)
            friend_request.status = 'rejected'
            friend_request.save()
        except FriendRequest.DoesNotExist:
            pass
    
    @database_sync_to_async
    def create_group_invite(self, user_id, group_id):
        """Create group invite"""
        try:
            user = User.objects.get(id=user_id)
            group = Group.objects.get(id=group_id)
            
            group_request = GroupJoinRequest.objects.create(
                from_user=self.user,
                group=group
            )
            
            # Create notification
            Notification.objects.create(
                user=user,
                notification_type='group_invite',
                title=f'{self.user.username} invited you to {group.name}',
                message=f'{self.user.username} invited you to join group {group.name}',
                actor=self.user,
                group=group
            )
            
            sender_data = self.get_user_data_sync(self.user_id)
            
            return {
                'id': group_request.id,
                'group_id': group_id,
                'group_name': group.name,
                'sender': sender_data,
            }
        except (User.DoesNotExist, Group.DoesNotExist):
            return None
    
    @database_sync_to_async
    def accept_group_invite(self, request_id):
        """Accept group invite"""
        try:
            group_request = GroupJoinRequest.objects.get(id=request_id)
            group_request.status = 'accepted'
            group_request.save()
            
            group = group_request.group
            group.members.add(self.user)
            
            return {'group_id': group.id}
        except GroupJoinRequest.DoesNotExist:
            return None
    
    @database_sync_to_async
    def reject_group_invite(self, request_id):
        """Reject group invite"""
        try:
            group_request = GroupJoinRequest.objects.get(id=request_id)
            group_request.status = 'rejected'
            group_request.save()
        except GroupJoinRequest.DoesNotExist:
            pass
    
    @database_sync_to_async
    def get_group_members(self, group_id):
        """Get group member IDs"""
        try:
            group = Group.objects.get(id=group_id)
            return list(group.members.values_list('id', flat=True))
        except Group.DoesNotExist:
            return []
    
    @database_sync_to_async
    def get_chat_other_user(self, chat_id):
        """Get the other user in a direct chat"""
        try:
            chat = Chat.objects.get(id=chat_id)
            other_user = chat.participants.exclude(id=self.user_id).first()
            return other_user.id if other_user else None
        except Chat.DoesNotExist:
            return None
    
    def get_user_data_sync(self, user_id):
        """Synchronous helper to get user data (call from async_to_sync if needed)"""
        try:
            from lms.models import Profile
            user = User.objects.select_related('profile').get(id=user_id)
            online_status = UserOnlineStatus.objects.filter(user=user).first()
            
            full_name = user.username
            if user.profile and user.profile.full_name:
                full_name = user.profile.full_name
            
            image = None
            if user.profile and user.profile.image:
                image = user.profile.image.url
            
            return {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type,
                'is_online': online_status.is_online if online_status else False,
                'image': image,
                'full_name': full_name,
            }
        except User.DoesNotExist:
            return None


# Signal handler
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_online_status(sender, instance, created, **kwargs):
    """Create UserOnlineStatus when a new user is created"""
    if created:
        UserOnlineStatus.objects.get_or_create(user=instance)