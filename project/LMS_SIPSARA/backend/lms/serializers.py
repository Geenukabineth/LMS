from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from lms.models import User,  Student
from course.serializers import CourseSerializer




class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "user_type", "phone", "is_active", "user_type", "is_active", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        db_table = "lms_user"
        fields = ["email", "username", "password", "phone", "password2", "user_type",]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match"})
        data.pop("password2")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            user_type=validated_data.get("user_type", User.STUDENT),  
            password=validated_data["password"],
        )
        return user


class ReceptionRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        db_table = "lms_user"
        fields = ["email", "username", "password", "phone", "password2", "user_type",]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match"})
        data.pop("password2")
        return data

    def create(self, validated_data):
        # Set the user type to instructor for reception registration
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            user_type=User.STUDENT,  
            password=validated_data["password"],
        )
        return user





class studentserializers(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ["id", "username", "teachers"]
