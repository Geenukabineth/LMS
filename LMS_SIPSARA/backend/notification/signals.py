# backend/notification/signals.py
"""
Notification Signals for SIPSARA LMS

This module handles real-time announcements via WebSocket Channels.
It listens to Announcement model creation and broadcasts to connected users.

User Model Structure (lms/models.py):
    - user_type: Choices are 'admin', 'student', 'instructor', 'receptionist'
    - is_superuser/is_staff: Also checked for role determination
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from .models import Announcement
from .serializers import AnnouncementSerializer 
import logging

logger = logging.getLogger(__name__)
User = get_user_model() 


def get_user_role(user):
    """
    Map User.user_type to role categories for notifications.
    
    Your User model (lms/models.py) has these user_type options:
        - ADMIN = "admin"
        - STUDENT = "student"
        - INSTRUCTOR = "instructor"
        - RECEPTIONIST = "receptionist"
    
    This function normalizes them:
        'admin' → 'admin'
        'student' → 'student'
        'instructor' → 'teacher'    (instructor = teacher for filtering)
        'receptionist' → 'teacher'  (receptionist treated as teacher role)
    
    Args:
        user: Django User instance
        
    Returns:
        str: One of ['admin', 'student', 'teacher']
        
    Examples:
        >>> user.user_type = 'student'
        >>> get_user_role(user)
        'student'
        
        >>> user.user_type = 'instructor'
        >>> get_user_role(user)
        'teacher'
    """
    # Ensure user has user_type attribute
    if not hasattr(user, 'user_type'):
        logger.warning(f"⚠️ User {user.id} ({user.username}) missing user_type field. Defaulting to 'student'")
        return 'student'
    
    # Map the actual user_type values to notification role names
    role_map = {
        'admin': 'admin',
        'student': 'student',
        'instructor': 'teacher',      # Instructor in model = Teacher for notifications
        'receptionist': 'teacher',    # Receptionist also treated as teacher role
    }
    
    # Get the mapped role, default to 'student' if unknown
    actual_role = role_map.get(user.user_type, 'student')
    
    # Debug logging (remove in production if too verbose)
    logger.debug(
        f"Role mapping: User {user.id} ({user.username}), "
        f"user_type='{user.user_type}' → role='{actual_role}'"
    )
    
    return actual_role


@receiver(post_save, sender=Announcement)
def announcement_created(sender, instance, created, **kwargs):
    """
    Signal handler that broadcasts announcements to connected WebSocket clients.
    
    Triggered automatically when a new Announcement is created.
    Respects the visibility setting to filter target users.
    
    Visibility Options:
        - 'everyone': Send to all users (admin, student, teacher)
        - 'students': Send only to users with user_type='student'
        - 'teachers': Send to instructors and receptionists
        
    Flow:
        1. Check if this is a NEW announcement (created=True)
        2. Get all users from database
        3. Filter based on visibility setting
        4. Serialize announcement data
        5. Send via Channels/Redis to each target user's WebSocket group
    """
    if not created:
        # Only handle new announcements, not updates
        return
    
    try:
        # ========== STEP 1: Log announcement creation ==========
        print(f"\n{'='*70}")
        print(f"✅ ANNOUNCEMENT SIGNAL TRIGGERED")
        print(f"   ID: {instance.id}")
        print(f"   Title: {instance.title}")
        print(f"   Author: {instance.author.username} (ID: {instance.author.id})")
        print(f"   Type: {instance.type}")
        print(f"   Visibility: {instance.visibility}")
        print(f"   Created: {instance.created_at}")
        print(f"{'='*70}")
        
        # ========== STEP 2: Get all users ==========
        all_users = User.objects.all()
        total_users = all_users.count()
        print(f"   Total users in system: {total_users}")
        
        # ========== STEP 3: Filter target users based on visibility ==========
        target_users = []
        
        if instance.visibility == 'everyone':
            # Send to ALL users
            target_users = list(all_users)
            print(f"   Visibility: EVERYONE → sending to all {total_users} users")
            
        elif instance.visibility == 'students':
            # Send ONLY to students
            target_users = [u for u in all_users if get_user_role(u) == 'student']
            print(f"   Visibility: STUDENTS ONLY → filtering students")
            
        elif instance.visibility == 'teachers':
            # Send ONLY to teachers/instructors/receptionists
            target_users = [
                u for u in all_users 
                if get_user_role(u) in ['teacher', 'admin']  # admin sees everything
            ]
            print(f"   Visibility: TEACHERS ONLY → filtering teachers/instructors")
        
        print(f"   Target users after filtering: {len(target_users)}")
        
        # ========== STEP 4: Validate we have targets ==========
        if not target_users:
            print(f"   ⚠️  WARNING: NO TARGET USERS FOUND")
            print(f"       Announcement will NOT be broadcast to anyone!")
            logger.warning(
                f"Announcement {instance.id} ({instance.title}) has no target users. "
                f"Visibility: {instance.visibility}"
            )
            print(f"{'='*70}\n")
            return
        
        # ========== STEP 5: Serialize announcement data ==========
        try:
            serializer = AnnouncementSerializer(instance, context={'request': None})
            announcement_data = serializer.data
            print(f"   ✅ Announcement serialized successfully")
        except Exception as e:
            print(f"   ❌ SERIALIZATION ERROR: {e}")
            logger.error(f"Failed to serialize announcement {instance.id}: {e}", exc_info=True)
            print(f"{'='*70}\n")
            return
        
        # ========== STEP 6: Send via Channels ==========
        channel_layer = get_channel_layer()
        
        if not channel_layer:
            print(f"   ❌ CHANNEL LAYER NOT CONFIGURED")
            print(f"       Check settings.py CHANNEL_LAYERS and Redis connection")
            logger.error("Channel layer is not configured!")
            print(f"{'='*70}\n")
            return
        
        print(f"   Starting broadcast to {len(target_users)} users...")
        successful_sends = 0
        failed_sends = 0
        
        for user in target_users:
            group_name = f'notifications_{user.id}'
            
            try:
                # Send announcement via Channels group
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'announcement_created',  # Calls consumer.announcement_created()
                        'announcement_data': announcement_data
                    }
                )
                
                print(f"   📤 User {user.id} ({user.username:15}) ← Sent via {group_name}")
                logger.info(f"Announcement {instance.id} sent to user {user.id} ({user.username})")
                successful_sends += 1
                
            except Exception as e:
                print(f"   ❌ User {user.id} ({user.username:15}) ← ERROR: {str(e)[:40]}")
                logger.error(f"Failed to send announcement to user {user.id}: {e}", exc_info=True)
                failed_sends += 1
        
        # ========== STEP 7: Summary ==========
        print(f"\n   📊 BROADCAST SUMMARY")
        print(f"      Total targets: {len(target_users)}")
        print(f"      ✅ Successful: {successful_sends}")
        print(f"      ❌ Failed: {failed_sends}")
        print(f"{'='*70}\n")
        
        if successful_sends > 0:
            logger.info(f"Announcement {instance.id} successfully sent to {successful_sends} users")
        if failed_sends > 0:
            logger.warning(f"Announcement {instance.id} failed to send to {failed_sends} users")
            
    except Exception as e:
        # Catch-all for any unexpected errors
        print(f"\n❌ FATAL SIGNAL ERROR: {e}")
        print(f"{'='*70}\n")
        logger.error(f"Fatal error in announcement_created signal: {e}", exc_info=True)