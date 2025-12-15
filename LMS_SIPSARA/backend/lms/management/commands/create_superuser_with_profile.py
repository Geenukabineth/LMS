# management/commands/create_superuser_with_profile.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from lms.models import Profile

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser with profile'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True, help='Username for the superuser')
        parser.add_argument('--email', type=str, required=True, help='Email for the superuser')
        parser.add_argument('--password', type=str, required=True, help='Password for the superuser')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR(f'User {username} already exists'))
            return

        try:
            # Create superuser
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            
            # The profile should be created automatically via signal
            # But let's ensure it exists
            if not hasattr(user, 'profile'):
                Profile.objects.create(
                    user=user,
                    full_name=username,
                    email=email,
                    phoneNumber=''
                )
            
            self.stdout.write(self.style.SUCCESS(f'Superuser {username} created successfully with profile'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating superuser: {str(e)}'))