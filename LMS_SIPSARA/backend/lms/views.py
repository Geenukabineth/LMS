from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ReceptionRegisterSerializer,
    TeacherRegisterSerializer,
    TeacherListSerializer,
    TeacherUpdateSerializer,
    ReceptionistListSerializer,
    ProfileUpdateSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    CurrentUserSerializer,
)
from .models import User, Student, Teacher, Receptionist, Profile
from django.contrib.auth import authenticate


from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
import json
from django.utils import timezone
from django.core.mail import send_mail 
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import update_session_auth_hash
from .utils.email import send_email
from datetime import timedelta
from django.utils.crypto import get_random_string
from course.models import Course
from course.serializers import CourseSerializer


class RegisterView(APIView):
    permission_classes = (AllowAny,)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReceptionRegisterView(APIView):
    permission_classes =(AllowAny,)
    
    def get(self, request, id=None):
        """Get all receptionists or a specific receptionist by ID"""
        
        try:
                users = Student.objects.all() # QuerySet
                serializer = CurrentUserSerializer(users, many=True) # <--- ADDED many=True
                return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
                return Response(
                    {"error": "Receptionist not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
    
    # views.py snippet
def post(self, request):
    serializer = ReceptionRegisterSerializer(data=request.data)
    if serializer.is_valid():
        result = serializer.save()
        user = result.get("user") if isinstance(result, dict) else result
        
        if isinstance(result, dict) and result.get("temporary_password"):
            send_mail( # <-- Django's built-in email function
                subject="Your Account Has Been Created",
                message=(
                    f"Your account has been created with the email {user.email}. "
                    f"Please log in with this temporary password: "
                    f"{result.get('temporary_password')} "
                    f"and change it immediately."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL, # <-- Uses Django settings
                recipient_list=[user.email],
                fail_silently=True,
            )
            return Response(
                {"message": "Reception registered successfully", "user_id": user.id},
                status=status.HTTP_201_CREATED,
            )
        # ... rest of the code
    
    def put(self, request, id):
        """Update a receptionist"""
        try:
            user = User.objects.get(id=id, user_type=User.RECEPTIONIST)
            receptionist = user.receptionist
        except User.DoesNotExist:
            return Response(
                {"error": "Receptionist not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Receptionist.DoesNotExist:
            return Response(
                {"error": "Receptionist profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update receptionist fields
        receptionist.First_Name = request.data.get('firstName', receptionist.First_Name)
        receptionist.Last_Name = request.data.get('lastName', receptionist.Last_Name)
        receptionist.Email_Address = request.data.get('email', receptionist.Email_Address)
        receptionist.Phone_Number = request.data.get('phone', receptionist.Phone_Number)
        receptionist.gender = request.data.get('gender', receptionist.gender)
        receptionist.save()

        # Update user fields
        user.email = request.data.get('email', user.email)
        user.phone = request.data.get('phone', user.phone)
        user.is_active = request.data.get('is_active', user.is_active)
        user.save()

        serializer = ReceptionistListSerializer(user)
        return Response(
            {"message": "Receptionist updated successfully", "data": serializer.data},
            status=status.HTTP_200_OK
        )
    
    def delete(self, request, id):
        """Delete a receptionist (soft delete by setting is_active to False)"""
        try:
            user = User.objects.get(id=id, user_type=User.RECEPTIONIST)
            user.is_active = False
            user.save()
            return Response(
                {"message": "Receptionist deleted successfully"},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Receptionist not found"},
                status=status.HTTP_404_NOT_FOUND
            )

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
    """
    Get list of all students with count
    """
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        
        try:
            students = User.objects.filter(user_type=User.STUDENT)
            serializer = UserSerializer(students, many=True)
            count = students.count()
            
            return Response({
                "success": True,
                "count": count,
                "students": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e),
                "count": 0,
                "students": []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)  


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
                    "is_temporary_password": user.is_temporary_password,
                    "message": "Login successful",
                }
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        except Exception:
            return Response({"error": "An error occurred during login"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class StudentSelfRegistrationAPIView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.date_joined = timezone.now()
        user.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class TeacherRegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = TeacherRegisterSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            user = result.get("user") if isinstance(result, dict) else result

            if isinstance(result, dict) and result.get("temporary_password"):
                send_mail(
                    subject="Your Teacher Account Has Been Created",
                    message=(
                        f"Your teacher account has been created with the email {user.email}. "
                        f"Temporary password: {result.get('temporary_password')} "
                        f"Please change it after login."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )

            return Response(
                {"success": True, "user_id": user.id},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, id=None):
        """Get teacher list or single teacher"""
        if id:
            try:
                teacher = Teacher.objects.select_related("user").get(user__id=id)
                serializer = TeacherListSerializer(teacher.user)
                return Response(
                    {"success": True, "teacher": serializer.data},
                    status=status.HTTP_200_OK
                )
            except Teacher.DoesNotExist:
                return Response(
                    {"error": "Teacher not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

        teachers = Teacher.objects.select_related("user").all()
        serializer = TeacherListSerializer(
            [teacher.user for teacher in teachers],
            many=True
        )

        return Response(
            {
                "success": True,
                "count": teachers.count(),
                "teachers": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def put(self, request, id=None):
        """Update teacher"""
        if not id:
            return Response(
                {"error": "Teacher ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            teacher = Teacher.objects.get(user__id=id)
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Teacher not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TeacherUpdateSerializer(
            teacher.user, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id=None):
        """Delete teacher"""
        if not id:
            return Response(
                {"error": "Teacher ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            teacher = Teacher.objects.get(user__id=id)
            teacher.user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Teacher not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        """Update user profile"""
        user = request.user
        
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully",
                "profile_data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.save()
            update_session_auth_hash(request, user)
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "Image file not provided"}, status=status.HTTP_400_BAD_REQUEST)

        profile.image = image_file
        try:
            profile.save()
            return Response({
                "message": "Profile image uploaded successfully",
                "image_url": profile.image.url
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": f"Failed to save image: {e}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CurrentUserView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        """Get the current authenticated user's data"""
        user = request.user
        serializer = UserSerializer(user, many=False)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update the current authenticated user's profile"""
        user = request.user
        
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Response(
                {"error": "User profile not found. Please contact support."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProfileUpdateSerializer(
            profile, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully", 
                "profile_data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            otp = get_random_string(length=6, allowed_chars='1234567890')
            user.otp = otp
            user.otp_expiry = timezone.now() + timedelta(minutes=10)
            user.save()

            context = {
                'username': user.username,
                'otp': otp,
                'expiry_minutes': 10,
            }

            success = send_email(
                to_email=email,
                subject='Password Reset OTP',
                template_name='emails/password_reset_otp.html',
                context=context
            )

            if success:
                return Response({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Failed to send OTP"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except User.DoesNotExist:
            return Response({"error": "Email not found in database"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Failed to send OTP: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
            if user.otp != otp or user.otp_expiry < timezone.now():
                return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.otp = None
            user.otp_expiry = None
            user.save()

            context = {
                'username': user.username,
            }

            success = send_email(
                to_email=email,
                subject='Password Reset Successful',
                template_name='emails/password_reset_confirmation.html',
                context=context
            )

            if success:
                return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
            else:
                return Response({
                    "message": "Password reset successful but confirmation email failed"
                }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Email not found in database"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CourseListByLevelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        level = request.query_params.get('level', None)
        
        if not level:
            return Response(
                {"error": "Level parameter is required"}, 
                status=400
            )
        
        courses = course.objects.filter(level=level).select_related('teacher')
        
        serialized_courses = []
        for course in courses:
            serialized_courses.append({
                'course_id': course.id,
                'title': course.title,
                'description': course.description,
                'level': course.level,
                'teacher': {
                    'id': course.teacher.user.id if course.teacher else None,
                    'full_name': f"{course.teacher.First_Name} {course.teacher.Last_Name}" if course.teacher else "N/A"
                }
            })
        
        return Response(serialized_courses, status=200)
    


class ReceptionRegisterlistView(APIView):
    permission_classes = (AllowAny,)
    
    def get(self, request):
        resptionists = User.objects.filter(user_type=User.RECEPTIONIST)
        serializer = ReceptionistListSerializer(resptionists, many=True)
        conunt = resptionists.count()
        return Response({
            "success": True,
            "count": conunt,
            "receptionists": serializer.data
        }, status=status.HTTP_200_OK)
    
class WebsiteTrafficAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_types = ['STUDENT', 'TEACHER', 'RECEPTIONIST', 'STAFF']  # adjust as needed
        data = []

        for month in range(1, 13):
            month_data = {'month': f"{month:02d}"}

            # Count students, teachers, staff for this month (optional: filter by created_at)
            month_data['students'] = User.objects.filter(user_type='STUDENT', date_joined__month=month).count()
            month_data['teachers'] = User.objects.filter(user_type='TEACHER', date_joined__month=month).count()
            month_data['staff'] = User.objects.filter(user_type='RECEPTIONIST', date_joined__month=month).count()  # or STAFF
            month_data['total'] = month_data['students'] + month_data['teachers'] + month_data['staff']

            data.append(month_data)

        # Map month numbers to names
        month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        for i, d in enumerate(data):
            d['month'] = month_names[i]

        return Response(data)

        