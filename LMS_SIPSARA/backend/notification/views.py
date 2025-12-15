from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from django.db.models import Q

from .models import Announcement
from .serializers import AnnouncementSerializer, AnnouncementCreateSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Use different serializer for create/update vs retrieve"""
        if self.action in ['create', 'update', 'partial_update']:
            return AnnouncementCreateSerializer
        return AnnouncementSerializer

    # ==================== HELPER METHODS ====================
    def get_user_role(self, user):
        """
        Safely get user role from multiple possible sources.
        
        Tries:
        1. user.profile.role (if Profile model has role field)
        2. user.user_type (if User model has user_type field)
        3. user_role from groups
        4. Default to 'student'
        """
        # Try profile.role first
        try:
            if hasattr(user, 'profile') and hasattr(user.profile, 'role'):
                return user.profile.role
        except Exception as e:
            print(f"⚠️ Error getting profile.role: {e}")
        
        # Try user.user_type
        if hasattr(user, 'user_type'):
            return user.user_type
        
        # Try user.userType
        if hasattr(user, 'userType'):
            return user.userType
        
        # Check if user is superuser or staff
        if user.is_superuser:
            return 'admin'
        if user.is_staff:
            return 'teacher'
        
        # Check groups
        if user.groups.exists():
            group_name = user.groups.first().name.lower()
            if group_name in ['admin', 'teacher', 'student']:
                return group_name
        
        # Default fallback
        return 'student'

    # ----------------------------
    # CREATE ANNOUNCEMENT (POST)
    # ----------------------------
    def create(self, request, *args, **kwargs):
        """Create a new announcement"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Get role safely from user
            role = self.get_user_role(request.user)
            print(f"✅ Creating announcement with role: {role}")
            
            announcement = serializer.save(
                author=request.user, 
                role=role
            )
            return Response(
                AnnouncementSerializer(announcement, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        print(f"❌ Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ----------------------------
    # LIST ANNOUNCEMENTS (GET)
    # ----------------------------
    def list(self, request, *args, **kwargs):
        """List all announcements with filtering and pagination"""
        queryset = self.get_queryset()

        # Filtering
        role = request.query_params.get('role')
        announcement_type = request.query_params.get('type')
        visibility = request.query_params.get('visibility')
        search = request.query_params.get('search')

        if role:
            queryset = queryset.filter(role=role)
        if announcement_type:
            queryset = queryset.filter(type=announcement_type)
        if visibility:
            queryset = queryset.filter(visibility=visibility)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )

        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = AnnouncementSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = AnnouncementSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    # ----------------------------
    # RETRIEVE ANNOUNCEMENT (GET by ID)
    # ----------------------------
    def retrieve(self, request, pk=None, *args, **kwargs):
        """Get a specific announcement"""
        try:
            announcement = Announcement.objects.get(pk=pk)
            serializer = AnnouncementSerializer(announcement, context={'request': request})
            return Response(serializer.data)
        except Announcement.DoesNotExist:
            return Response(
                {'error': 'Announcement not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    # ----------------------------
    # UPDATE ANNOUNCEMENT (PUT/PATCH)
    # ----------------------------
    def update(self, request, pk=None, *args, **kwargs):
        """Update an announcement - only author or admin can update"""
        try:
            announcement = Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist:
            return Response(
                {'error': 'Announcement not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions - only author or admin can update
        user_role = self.get_user_role(request.user)
        if announcement.author != request.user and user_role != 'admin':
            raise PermissionDenied('You can only update your own announcements.')

        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(
            announcement, 
            data=request.data, 
            partial=partial
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                AnnouncementSerializer(announcement, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ----------------------------
    # PARTIAL UPDATE ANNOUNCEMENT (PATCH)
    # ----------------------------
    def partial_update(self, request, pk=None, *args, **kwargs):
        """Partial update of an announcement"""
        kwargs['partial'] = True
        return self.update(request, pk, *args, **kwargs)

    # ----------------------------
    # DELETE ANNOUNCEMENT (DELETE)
    # ----------------------------
    def destroy(self, request, pk=None, *args, **kwargs):
        """Delete an announcement - only author or admin can delete"""
        try:
            announcement = Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist:
            return Response(
                {'error': 'Announcement not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions - only author or admin can delete
        user_role = self.get_user_role(request.user)
        if announcement.author != request.user and user_role != 'admin':
            raise PermissionDenied('You can only delete your own announcements.')

        announcement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ----------------------------
    # CUSTOM ACTIONS
    # ----------------------------
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Pin an announcement (admin only)"""
        user_role = self.get_user_role(request.user)
        if user_role != 'admin':
            raise PermissionDenied('Only admins can pin announcements.')
        
        try:
            announcement = Announcement.objects.get(pk=pk)
            announcement.is_pinned = True
            announcement.save()
            return Response(
                AnnouncementSerializer(announcement, context={'request': request}).data
            )
        except Announcement.DoesNotExist:
            return Response(
                {'error': 'Announcement not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        """Unpin an announcement (admin only)"""
        user_role = self.get_user_role(request.user)
        if user_role != 'admin':
            raise PermissionDenied('Only admins can unpin announcements.')
        
        try:
            announcement = Announcement.objects.get(pk=pk)
            announcement.is_pinned = False
            announcement.save()
            return Response(
                AnnouncementSerializer(announcement, context={'request': request}).data
            )
        except Announcement.DoesNotExist:
            return Response(
                {'error': 'Announcement not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )