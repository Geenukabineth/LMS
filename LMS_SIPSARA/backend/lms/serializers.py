# serializers.py - FIXED VERSION

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from lms.models import User, Student, Teacher, Receptionist, Profile
import string
from django.utils import timezone
import random

# IMPORT REQUIRED MODELS (Assuming they are available in the project structure)
try:
    from course.models import Course, CartOrderItem, EnrolledCourse
except ImportError:
    # Placeholder classes if actual models are not available for compilation
    class Course: pass
    class CartOrderItem: pass
    class EnrolledCourse: pass


def generate_dummy_password(length=10):
    """Generate a random password (safe to copy/paste)"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ["id", "username", "email", "user_type", "phone", "is_active", "user_type", "is_active", "updated_at", "profile"]

# ===== REGISTER SERIALIZER (Student Self-Registration) =====
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    firstName = serializers.CharField(max_length=100, required=False)
    lastName = serializers.CharField(max_length=100, required=False)
    semester = serializers.CharField(required=False)

    class Meta:
        model = User
        db_table = "lms_user"
        fields = ["email", "username", "password", "phone", "password2", "user_type", "firstName", "lastName", "semester"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match"})
        data.pop("password2")
        return data

    def create(self, validated_data):
        # ... existing create logic ...
        first_name = validated_data.pop("firstName", "")
        last_name = validated_data.pop("lastName", "")
        semester = validated_data.pop("semester", "")
        
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            user_type=validated_data.get("user_type", User.STUDENT),  
            password=validated_data["password"],
            phone=validated_data.get("phone", ""),
        )
        
        if user.user_type == User.STUDENT:
            grade_mapping = {
                "1": "Grade 1", "2": "Grade 2", "3": "Grade 3", "4": "Grade 4",
                "5": "Grade 5", "6": "Grade 6", "7": "Grade 7", "8": "Grade 8",
                "9": "Grade 9", "10": "Grade 10", "11": "Grade 11", "12": "Grade 12",
                "13": "Grade 13"
            }
            grade = grade_mapping.get(semester, "Grade 1")
            
            if semester in ["1", "2", "3", "4", "5"]:
                academic_year = "primary level"
            elif semester in ["6", "7", "8", "9", "10", "11"]:
                academic_year = "ordinary level"
            else:
                academic_year = "advanced level"
            
            default_teacher = Teacher.objects.first()
            
            if not default_teacher:
                raise serializers.ValidationError(
                    "Cannot create student: No teachers available in the system. Please create a teacher first."
                )
            
            Student.objects.create(
                user=user,
                firstName=first_name,
                lastName=last_name,
                email=user.email,
                phone=user.phone,
                academicYear=academic_year,
                Grade=grade,
                teacher=default_teacher,
                classroom="",
                section="",
                registrationFees=False,
                enrollmentDate=timezone.now()
            )
        
        return user

# ===== RECEPTION REGISTER SERIALIZER (Registers Students + Enrollment) =====
class ReceptionRegisterSerializer(serializers.ModelSerializer):
    # Student Profile fields exposed for receptionist input
    firstName = serializers.CharField(max_length=100, required=True)
    lastName = serializers.CharField(max_length=100, required=True)
    academicYear = serializers.CharField(max_length=50, required=True)
    Grade = serializers.CharField(max_length=100, required=True)
    registrationFees = serializers.BooleanField(required=True)
    
    # Enrollment data
    courses = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        db_table = "lms_user"
        fields = [
            "email", "username", "phone", 
            "firstName", "lastName", "academicYear", "Grade", "registrationFees", 
            "courses", "password", "password2" # Include all fields used in validation/create
        ]

    def validate(self, data):
        if data.get("password") and data.get("password2") and data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match"})
        data.pop("password2", None)
        return data
    
    def create(self, validated_data):
        courses_data = validated_data.pop('courses', [])
        
        # 1. User Creation/Password Handling
        username = validated_data.get("username")
        if not username:
            email_prefix = validated_data["email"].split('@')[0]
            base_username = email_prefix
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            validated_data['username'] = username

        password = validated_data.get("password")
        is_temporary_password = False
        if not password:
            password = generate_dummy_password()
            is_temporary_password = True
        
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            user_type=User.STUDENT, # Registering a Student
            password=password,
            phone=validated_data.get("phone", ""),
            is_temporary_password=is_temporary_password
        )

        # 2. Student Profile Creation
        default_teacher = Teacher.objects.first()
        if not default_teacher:
            raise serializers.ValidationError({"teacher": "Cannot create student: No teachers available."})
            
        student = Student.objects.create(
            user=user,
            firstName=validated_data["firstName"],
            lastName=validated_data["lastName"],
            email=user.email,
            phone=user.phone,
            academicYear=validated_data["academicYear"],
            Grade=validated_data["Grade"],
            registrationFees=validated_data["registrationFees"],
            teacher=default_teacher, # Assign default teacher
            enrollmentDate=timezone.now()
        )
        
        # 3. Course Enrollment (Creating EnrolledCourse records)
        order_item_placeholder = CartOrderItem.objects.first()
        if not order_item_placeholder and courses_data:
            # If courses were provided, and the required FK (order_item) doesn't exist, we must handle it.
            # In a production system, this would typically involve creating a dummy order item.
            raise serializers.ValidationError({"courses": "Cannot enroll student: CartOrderItem object required for enrollment is missing."})


        for course_data in courses_data:
            try:
                course_instance = Course.objects.get(id=course_data['course_id'])
                teacher_instance = Teacher.objects.get(user_id=course_data['teacher_id'])
                
                # Creates the record in the 'EnrolledCourse' table
                EnrolledCourse.objects.create( 
                    course=course_instance,
                    user=user, # Links to the User
                    teacher=teacher_instance,
                    order_item=order_item_placeholder, 
                )
            except Course.DoesNotExist:
                raise serializers.ValidationError({"course_id": f"Course ID {course_data['course_id']} not found."})
            except Teacher.DoesNotExist:
                raise serializers.ValidationError({"teacher_id": f"Teacher ID {course_data['teacher_id']} not found."})
        
        # 4. Return result including temporary password
        return {
            "user": user,
            "temporary_password": password if is_temporary_password else None
        }

# --- Teacher Serializers ---

class TeacherRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=False)

    firstName = serializers.CharField(required=True)
    lastName = serializers.CharField(required=True)
    department = serializers.CharField(required=True)
    gender = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "email", "username", "password", "password2",
            "phone", "firstName", "lastName", "department", "gender"
        ]

    def validate(self, data):
        if data.get("password") and data.get("password2"):
            if data["password"] != data["password2"]:
                raise serializers.ValidationError(
                    {"password2": "Passwords do not match"}
                )
        data.pop("password2", None)
        return data

    def create(self, validated_data):
        username = validated_data.get("username")

        if not username:
            base_username = validated_data["email"].split("@")[0]
            username = base_username
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

        password = validated_data.get("password")
        is_temporary_password = False

        if not password:
            password = generate_dummy_password()
            is_temporary_password = True

        user = User.objects.create_user(
            email=validated_data["email"],
            username=username,
            user_type=User.INSTRUCTOR,
            password=password,
            phone=validated_data.get("phone", ""),
            is_temporary_password=is_temporary_password
        )

        Teacher.objects.create(
            user=user,
            First_Name=validated_data["firstName"],
            Last_Name=validated_data["lastName"],
            Email_Address=validated_data["email"],
            Phone_Number=validated_data.get("phone", ""),
            Department=validated_data["department"],
            gender=validated_data.get("gender", "")
        )

        Profile.objects.get_or_create(
            user=user,
            defaults={
                "full_name": f"{validated_data['firstName']} {validated_data['lastName']}"
            }
        )


        return {
            "user": user,
            "temporary_password": password if is_temporary_password else None
        }
class TeacherUpdateSerializer(serializers.ModelSerializer):
    # Explicitly define fields from the related Teacher model
    firstName = serializers.CharField(source='teacher.First_Name', required=False)
    lastName = serializers.CharField(source='teacher.Last_Name', required=False)

    class Meta:
        model = User
        # These names are now valid because they are defined above
        fields = ["email", "phone", "firstName", "lastName"]

    def update(self, instance, validated_data):
        # 1. Update User model fields
        instance.email = validated_data.get("email", instance.email)
        instance.phone = validated_data.get("phone", instance.phone)
        instance.save()

        # 2. Update the related Teacher model fields
        # 'teacher' data is nested due to the 'source' attribute used above
        teacher_data = validated_data.get('teacher')
        if teacher_data:
            teacher = instance.teacher
            teacher.First_Name = teacher_data.get("First_Name", teacher.First_Name)
            teacher.Last_Name = teacher_data.get("Last_Name", teacher.Last_Name)
            teacher.save()

        return instance

class TeacherListSerializer(serializers.ModelSerializer):
    First_Name = serializers.CharField(source='teacher.First_Name')
    Last_Name = serializers.CharField(source='teacher.Last_Name')
    Email_Address = serializers.CharField(source='teacher.Email_Address')
    Phone_Number = serializers.CharField(source='teacher.Phone_Number')
    Department = serializers.CharField(source='teacher.Department')
    gender = serializers.CharField(source='teacher.gender')

    class Meta:
        model = User
        fields = (
            'id',                  
            'First_Name',
            'Last_Name',
            'Email_Address',
            'Phone_Number',
            'Department',
            'gender',
            'is_active',
        )

# --- Receptionist Serializers ---

class ReceptionistSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False)

    # Use source to point to the related Receptionist model for data representation
    firstName = serializers.CharField(source='receptionist.First_Name')
    lastName = serializers.CharField(source='receptionist.Last_Name')
    gender = serializers.CharField(source='receptionist.gender', required=False, allow_blank=True)
    Phone_Number = serializers.CharField(source='receptionist.Phone_Number', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "password", "password2",
            "Phone_Number", "firstName", "lastName", "gender",
        ]

    def create(self, validated_data):
        # Extract data from the source mapping
        receptionist_data = validated_data.pop('receptionist') # This contains First_Name, Last_Name, etc.
        email = validated_data.pop("email")
        password = validated_data.pop("password", None)
        
        # Handle Username generation
        username = validated_data.get("username")
        if not username:
            base = email.split("@")[0]
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base}{counter}"
                counter += 1

        # Create the User instance (lms_user table)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password or generate_dummy_password(),
            user_type=User.RECEPTIONIST,
            phone=receptionist_data.get('Phone_Number', ""), # Map to user.phone
            is_temporary_password=True if not password else False
        )

        # Create the Receptionist instance (lms_receptionist table)
        Receptionist.objects.create(
            user=user,
            First_Name=receptionist_data.get('First_Name'),
            Last_Name=receptionist_data.get('Last_Name'),
            Email_Address=email,
            Phone_Number=receptionist_data.get('Phone_Number', ""),
            gender=receptionist_data.get('gender', ""),
        )
        from .utils.email import send_email

        temporary_password = password or generate_dummy_password()

        user = User.objects.create_user(
            username=username,
            email=email,
            password=temporary_password,
            user_type=User.RECEPTIONIST,
            phone=receptionist_data.get("Phone_Number", ""),
            is_temporary_password=True
        )

        Receptionist.objects.create(
            user=user,
            First_Name=receptionist_data.get('First_Name'),
            Last_Name=receptionist_data.get('Last_Name'),
            Email_Address=email,
            Phone_Number=receptionist_data.get('Phone_Number', ""),
            gender=receptionist_data.get('gender', ""),
        )

        send_email(
            to_email=email,
            subject="Your Receptionist Account Has Been Created",
            template_name="emails/password_reset_confirmation.html",
            context={
                "username": user.username,
                "temporary_password": temporary_password,
            }
        )

       


        return user
class ReceptionistListSerializer(serializers.ModelSerializer):
    First_Name = serializers.CharField(source="receptionist.First_Name")
    Last_Name = serializers.CharField(source="receptionist.Last_Name")
    Email_Address = serializers.CharField(source="receptionist.Email_Address")
    Phone_Number = serializers.CharField(source="receptionist.Phone_Number")
    gender = serializers.CharField(source="receptionist.gender")

    class Meta:
        model = User
        fields = [
            "id",
            "First_Name",
            "Last_Name",
            "Email_Address",
            "Phone_Number",
            "is_active",
            "gender",
        ]

class ProfileUpdateSerializer(serializers.ModelSerializer):
    # Map User fields into the serializer
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False) # User's phone field
    
    class Meta:
        model = Profile
        # full_name and image are on Profile. We are exposing User fields (username, email, phone) as well.
        # This list MUST include all explicitly defined fields above (username, email, phone)
        fields = ['full_name', 'image', 'username', 'email', 'phone'] 
        read_only_fields = ['date'] # Prevent modification of creation date

    def update(self, instance, validated_data):
        user = instance.user
        
        # 1. Update fields on the Profile instance (full_name and image)
        instance.full_name = validated_data.get('full_name', instance.full_name)
        
        # Handle FileField update
        if 'image' in validated_data:
            instance.image = validated_data['image']
        
        # 2. Update fields on the related User instance and sync Profile fields
        # Note: We rely on the User model for the canonical email and phone number
        if 'username' in validated_data:
            user.username = validated_data['username']
        
        if 'email' in validated_data:
            user.email = validated_data['email']
            # Sync Profile's email field for consistency (if using it in other parts)
            instance.email = validated_data['email'] 
        
        if 'phone' in validated_data:
            user.phone = validated_data['phone']
            # Sync Profile's phoneNumber field for consistency
            instance.phoneNumber = validated_data['phone'] 

        # Save both instances
        user.save() 
        instance.save() 

        return instance

# pssword change serializer
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        # Confirm new passwords match
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "New passwords do not match"}
            )

        user = self.context['request'].user
        # Check if current password is correct
        if not user.check_password(data['current_password']):
            raise serializers.ValidationError(
                {"current_password": "Current password is incorrect"}
            )

        return data

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
    

class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student # Correctly linked to the Student model
        fields = "__all__" # Correctly exposes all Student fields like firstName