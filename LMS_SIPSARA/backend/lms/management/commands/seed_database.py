# management/commands/seed_database.py
"""
Django management command for seeding the database
Usage: python manage.py seed_database
       python manage.py seed_database --clear  # Clear existing data first
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from lms.models import User, Student, Teacher, Receptionist, Profile
import random
from datetime import datetime, timedelta, date

class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )
        parser.add_argument(
            '--students',
            type=int,
            default=30,
            help='Number of students to create (default: 30)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(self.style.SUCCESS('Starting Database Seed Process'))
        self.stdout.write(self.style.SUCCESS('='*60))
        
        if options['clear']:
            self.clear_data()
        
        self.create_superuser()
        teachers = self.create_teachers()
        self.create_receptionists()
        self.create_students(teachers, options['students'])
        self.verify_profiles()
        self.print_summary()
        
        self.stdout.write(self.style.SUCCESS('\n✓ Seeding completed successfully!'))

    def clear_data(self):
        """Clear existing data"""
        self.stdout.write('Clearing existing data...')
        Student.objects.all().delete()
        Teacher.objects.all().delete()
        Receptionist.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.SUCCESS('✓ Data cleared'))

    def generate_phone(self):
        """Generate a random phone number"""
        return f"+94{random.randint(70, 79)}{random.randint(1000000, 9999999)}"

    def generate_birth_date(self, min_age=5, max_age=18):
        """Generate a birth date for students"""
        today = date.today()
        age = random.randint(min_age, max_age)
        birth_year = today.year - age
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        return date(birth_year, birth_month, birth_day)

    def generate_random_date(self, start_year=2020, end_year=2024):
        """Generate a random date between start and end year"""
        start_date = date(start_year, 1, 1)
        end_date = date(end_year, 12, 31)
        days_between = (end_date - start_date).days
        random_days = random.randint(0, days_between)
        return start_date + timedelta(days=random_days)

    @transaction.atomic
    def create_superuser(self):
        """Create a superuser account"""
        self.stdout.write('\nCreating superuser...')
        try:
            if not User.objects.filter(username='admin').exists():
                admin = User.objects.create_superuser(
                    email='admin@lmssipsara.com',
                    username='admin',
                    password='admin123'
                )
                admin.phone = self.generate_phone()
                admin.save()
                self.stdout.write(self.style.SUCCESS(
                    "✓ Superuser created: username='admin', password='admin123'"
                ))
            else:
                self.stdout.write('• Superuser "admin" already exists')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error creating superuser: {e}'))

    @transaction.atomic
    def create_teachers(self):
        """Create sample teacher accounts"""
        self.stdout.write('\nCreating teachers...')
        
        teachers_data = [
            {
                'First_Name': 'John',
                'Last_Name': 'Smith',
                'email': 'john.smith@lmssipsara.com',
                'username': 'johnsmith',
                'Department': 'Mathematics',
                'gender': 'Male'
            },
            {
                'First_Name': 'Sarah',
                'Last_Name': 'Johnson',
                'email': 'sarah.johnson@lmssipsara.com',
                'username': 'sarahjohnson',
                'Department': 'Science',
                'gender': 'Female'
            },
            {
                'First_Name': 'Michael',
                'Last_Name': 'Brown',
                'email': 'michael.brown@lmssipsara.com',
                'username': 'michaelbrown',
                'Department': 'English',
                'gender': 'Male'
            },
            {
                'First_Name': 'Emily',
                'Last_Name': 'Davis',
                'email': 'emily.davis@lmssipsara.com',
                'username': 'emilydavis',
                'Department': 'History',
                'gender': 'Female'
            },
            {
                'First_Name': 'David',
                'Last_Name': 'Wilson',
                'email': 'david.wilson@lmssipsara.com',
                'username': 'davidwilson',
                'Department': 'Computer Science',
                'gender': 'Male'
            },
            {
                'First_Name': 'Lisa',
                'Last_Name': 'Martinez',
                'email': 'lisa.martinez@lmssipsara.com',
                'username': 'lisamartinez',
                'Department': 'Art',
                'gender': 'Female'
            },
        ]
        
        created_teachers = []
        for teacher_data in teachers_data:
            try:
                if not User.objects.filter(username=teacher_data['username']).exists():
                    user = User.objects.create_user(
                        email=teacher_data['email'],
                        username=teacher_data['username'],
                        password='teacher123',
                        user_type=User.INSTRUCTOR,
                        phone=self.generate_phone()
                    )
                    user.is_staff = True
                    user.save()
                    
                    teacher = Teacher.objects.create(
                        user=user,
                        First_Name=teacher_data['First_Name'],
                        Last_Name=teacher_data['Last_Name'],
                        Email_Address=teacher_data['email'],
                        Phone_Number=user.phone,
                        Department=teacher_data['Department'],
                        gender=teacher_data['gender']
                    )
                    created_teachers.append(teacher)
                    self.stdout.write(self.style.SUCCESS(
                        f"✓ Teacher created: {teacher.First_Name} {teacher.Last_Name} "
                        f"(username: {teacher_data['username']}, password: teacher123)"
                    ))
                else:
                    self.stdout.write(f"• Teacher {teacher_data['username']} already exists")
                    teacher = Teacher.objects.get(user__username=teacher_data['username'])
                    created_teachers.append(teacher)
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error creating teacher {teacher_data['username']}: {e}"
                ))
        
        return created_teachers

    @transaction.atomic
    def create_receptionists(self):
        """Create sample receptionist accounts"""
        self.stdout.write('\nCreating receptionists...')
        
        receptionists_data = [
            {
                'First_Name': 'Mary',
                'Last_Name': 'Anderson',
                'email': 'mary.anderson@lmssipsara.com',
                'username': 'maryanderson',
                'gender': 'Female'
            },
            {
                'First_Name': 'Robert',
                'Last_Name': 'Taylor',
                'email': 'robert.taylor@lmssipsara.com',
                'username': 'roberttaylor',
                'gender': 'Male'
            },
        ]
        
        for receptionist_data in receptionists_data:
            try:
                if not User.objects.filter(username=receptionist_data['username']).exists():
                    user = User.objects.create_user(
                        email=receptionist_data['email'],
                        username=receptionist_data['username'],
                        password='reception123',
                        user_type=User.RECEPTIONIST,
                        phone=self.generate_phone()
                    )
                    
                    receptionist = Receptionist.objects.create(
                        user=user,
                        First_Name=receptionist_data['First_Name'],
                        Last_Name=receptionist_data['Last_Name'],
                        Email_Address=receptionist_data['email'],
                        Phone_Number=user.phone,
                        gender=receptionist_data['gender']
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"✓ Receptionist created: {receptionist.First_Name} {receptionist.Last_Name} "
                        f"(username: {receptionist_data['username']}, password: reception123)"
                    ))
                else:
                    self.stdout.write(f"• Receptionist {receptionist_data['username']} already exists")
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error creating receptionist {receptionist_data['username']}: {e}"
                ))

    @transaction.atomic
    def create_students(self, teachers, num_students=30):
        """Create sample student accounts"""
        self.stdout.write(f'\nCreating {num_students} students...')
        
        first_names = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Henry', 'Isabella', 
                       'Lucas', 'Mia', 'Alexander', 'Charlotte', 'Daniel', 'Amelia', 'Matthew', 'Harper',
                       'Joseph', 'Evelyn', 'Jackson', 'Abigail', 'Samuel', 'Emily', 'Sebastian', 'Ella',
                       'David', 'Grace', 'Carter', 'Chloe', 'Wyatt', 'Victoria']
        
        last_names = ['Kumar', 'Silva', 'Fernando', 'Perera', 'Jayawardena', 'Dissanayake', 
                      'Gunasekara', 'Bandara', 'Rajapaksa', 'Wickramasinghe', 'Mendis', 'Ranasinghe',
                      'Abeysekera', 'De Silva', 'Samaraweera', 'Karunaratne', 'Weerasinghe', 'Pathirana']
        
        cities = ['Colombo', 'Negombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala', 'Ratnapura', 'Anuradhapura']
        schools = ['Royal College', 'St. Joseph\'s College', 'Ananda College', 'Nalanda College', 
                   'Trinity College', 'St. Peter\'s College', 'D.S. Senanayake College']
        
        grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
                  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']
        
        created_count = 0
        for i in range(num_students):
            try:
                first_name = random.choice(first_names)
                last_name = random.choice(last_names)
                username = f"{first_name.lower()}{last_name.lower()}{i}"
                email = f"{username}@student.lmssipsara.com"
                
                if not User.objects.filter(username=username).exists():
                    user = User.objects.create_user(
                        email=email,
                        username=username,
                        password='student123',
                        user_type=User.STUDENT,
                        phone=self.generate_phone()
                    )
                    
                    grade = random.choice(grades)
                    grade_num = int(grade.split()[1])
                    
                    if grade_num <= 5:
                        academic_year = 'primary level'
                    elif grade_num <= 11:
                        academic_year = 'ordinary level'
                    else:
                        academic_year = 'advanced level'
                    
                    student = Student.objects.create(
                        user=user,
                        teacher=random.choice(teachers) if teachers else None,
                        firstName=first_name,
                        lastName=last_name,
                        email=email,
                        phone=user.phone,
                        dateOfBirth=self.generate_birth_date(),
                        address=f"{random.randint(1, 999)} {random.choice(['Main St', 'Lake Rd', 'Temple Rd', 'School Lane'])}",
                        city=random.choice(cities),
                        state='Western Province',
                        zipCode=f"{random.randint(10000, 99999)}",
                        guardianName=f"Mr/Mrs. {last_name}",
                        guardianPhone=self.generate_phone(),
                        emergencyContact=f"Emergency - {last_name}",
                        emergencyPhone=self.generate_phone(),
                        academicYear=academic_year,
                        School=random.choice(schools),
                        Grade=grade,
                        registrationFees=random.choice([True, False]),
                        enrollmentDate=self.generate_random_date(2023, 2024),
                        classroom=f"Class {random.choice(['A', 'B', 'C', 'D'])}",
                        section=random.choice(['Morning', 'Afternoon']),
                        medicalInfo='No known allergies' if random.random() > 0.3 else 'Allergic to peanuts',
                        notes=f'Student enrolled in {academic_year} program'
                    )
                    created_count += 1
                    if created_count % 5 == 0:  # Print progress every 5 students
                        self.stdout.write(f"  Created {created_count} students...")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Error creating student {i}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total students created: {created_count}"))

    def verify_profiles(self):
        """Verify that all users have profiles"""
        self.stdout.write('\nVerifying profiles...')
        users_without_profiles = 0
        
        for user in User.objects.all():
            try:
                profile = user.profile
            except Profile.DoesNotExist:
                Profile.objects.create(
                    user=user,
                    full_name=user.username,
                    email=user.email,
                    phoneNumber=getattr(user, 'phone', '')
                )
                users_without_profiles += 1
        
        if users_without_profiles > 0:
            self.stdout.write(self.style.SUCCESS(f"✓ Created {users_without_profiles} missing profiles"))
        else:
            self.stdout.write(self.style.SUCCESS("✓ All users have profiles"))

    def print_summary(self):
        """Print summary of seeded data"""
        self.stdout.write(self.style.WARNING('\n' + '='*60))
        self.stdout.write(self.style.WARNING('SEED DATA SUMMARY'))
        self.stdout.write(self.style.WARNING('='*60))
        self.stdout.write(f"Total Users: {User.objects.count()}")
        self.stdout.write(f"  - Admins: {User.objects.filter(is_superuser=True).count()}")
        self.stdout.write(f"  - Teachers: {Teacher.objects.count()}")
        self.stdout.write(f"  - Students: {Student.objects.count()}")
        self.stdout.write(f"  - Receptionists: {Receptionist.objects.count()}")
        self.stdout.write(f"Total Profiles: {Profile.objects.count()}")
        self.stdout.write(self.style.WARNING('\n' + '='*60))
        self.stdout.write(self.style.WARNING('LOGIN CREDENTIALS'))
        self.stdout.write(self.style.WARNING('='*60))
        self.stdout.write("Admin:         username='admin',         password='admin123'")
        self.stdout.write("Teachers:      username='[name]',        password='teacher123'")
        self.stdout.write("Students:      username='[name]',        password='student123'")
        self.stdout.write("Receptionists: username='[name]',        password='reception123'")
        self.stdout.write(self.style.WARNING('='*60))