# notification/consumers.py
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser 
from datetime import datetime

# FIX: Removed import of chat models (Conversation, ChatRoom, etc.)
from .models import Announcement # Only Announcement is needed for the logic that remains

User = get_user_model()
logger = logging.getLogger(__name__)




class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications, enforcing authentication."""
    
    async def connect(self):
        """Handle WebSocket connection and enforce authentication."""
        
        self.user = self.scope.get("user", AnonymousUser())
        
        if self.user.is_anonymous:
            print("CONNECT REJECTED: User is Anonymous (Authentication Failed via Middleware)")
            logger.warning("Notification connection rejected: User is anonymous.")
            await self.close(code=4000)
            return

        try:
            self.notification_group_name = f'notifications_{self.user.id}'
            
            await self.channel_layer.group_add(
                self.notification_group_name,
                self.channel_name
            )
            
            await self.accept() 
            logger.info(f"SUCCESS: User {self.user.username} connected to notifications group: {self.notification_group_name}")

        except Exception as e:
            print(f"FATAL ERROR during connect/setup: {e}") 
            logger.error(f"FATAL ERROR during NotificationConsumer setup for user {self.user.id}: {e}", exc_info=True)
            await self.close(code=1011)

    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if self.user and not self.user.is_anonymous:
            if hasattr(self, 'notification_group_name'):
                await self.channel_layer.group_discard(
                    self.notification_group_name,
                    self.channel_name
                )
                logger.info(f"User {self.user.username} disconnected from notifications (Code: {close_code})")
            else:
                 logger.info(f"Authenticated user disconnected before group setup (Code: {close_code})")
        else:
            logger.info(f"Anonymous user disconnected from attempt (Code: {close_code})")
    
    
    async def receive(self, text_data):
        """Handle incoming messages (e.g., mark_read)"""
        try:
            data = json.loads(text_data)
            if data.get('type') == 'mark_read':
                notification_id = data.get('notification_id')
                logger.info(f"User {self.user.id} marked notification {notification_id} as read.")
        except Exception as e:
            logger.error(f"Error in notification receive: {str(e)}")
            
    
    async def announcement_created(self, event):
        """
        Send the announcement data to the client.
        Wrapped in try/except to prevent WebSocket crash (1011) if JSON fails.
        """
        try:
            # Extract data
            data_to_send = event.get('announcement_data')

            # Send to WebSocket
            await self.send(text_data=json.dumps({
                'type': 'announcement_push',
                'data': data_to_send
            }))
        except Exception as e:
            # Log the error but DO NOT crash the connection
            print(f"Error sending notification: {e}")