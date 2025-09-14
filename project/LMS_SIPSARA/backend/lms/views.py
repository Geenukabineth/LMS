from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, RegisterSerializer, PaymentSerializer, CourseSerializer, AnnouncementSerializer, ReceptionRegisterSerializer
from .models import User, Student
from django.contrib.auth import authenticate
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import  AllowAny
from django.conf import settings
import json
from django.utils import timezone




class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReceptionRegisterView(APIView):
    def post(self, request):
        serializer = ReceptionRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Reception user created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        users = User.objects.filter(user_type=User.INSTRUCTOR)        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        try:
            user = User.objects.get(id=id)
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class studentviewlist(APIView):
    def get(self, request):
        user = User.objects.filter(user_type=User.STUDENT)

        serializer= UserSerializer(user, many= True)
        return Response(serializer.data)


class LoginAPIView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            if hasattr(request, "data") and request.data:
                email = request.data.get("email")
                password = request.data.get("password")
            else:
                body = json.loads(request.body.decode("utf-8"))
                email = body.get("email")
                password = body.get("password")

            if not email or not password:
                return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

            email = email.strip().lower()

            user = authenticate(request, username=email, password=password)

            if user is None:
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(request, username=user_obj.username, password=password)
                except User.DoesNotExist:
                    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

            if user is not None and user.is_active:
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token

                user_type = "student" 

                if hasattr(user, "user_type"):
                    user_type = user.user_type
                elif user.is_superuser:
                    user_type = "admin"
                elif user.is_staff:
                    user_type = "instructor"

                response_data = {
                    "access": str(access_token),
                    "refresh": str(refresh),
                    "user_id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "user_type": user_type,                   
                    "message": "Login successful",
                }
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        except Exception:
            return Response({"error": "An error occurred during login"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        """
        Blacklist the refresh token to log out the user.
        """
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "An error occurred during logout"}, status=status.HTTP_400_BAD_REQUEST)

class StudentSelfRegistrationAPIView(generics.CreateAPIView):
    # This view will handle the self-registration logic
    # It assumes that a UserSerializer exists to handle the data
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.registration_method = "Self-Registration"
        user.date_joined = timezone.now()
        user.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
