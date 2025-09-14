from rest_framework import serializers
from .models import Course, EnrolledCourse


class CourseSerializer(serializers.ModelSerializer):
    instructor = serializers.CharField(source="instructor.username", read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "price",
            "instructor",
            "image",
            "level",
            "created_at",
            "updated_at",
            "is_enrolled",
        ]

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return EnrolledCourse.objects.filter(user=request.user, course=obj).exists()
        return False


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = EnrolledCourse
        fields = ["id", "course", "enrollment", "is_active"]
