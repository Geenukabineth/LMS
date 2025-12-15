"""
Django management command for seeding course-related data
Place this at: course/management/commands/seed_courses.py

Usage: 
    python manage.py seed_courses
    python manage.py seed_courses --clear  # Clear existing course data first
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from lms.models import User, Student, Teacher
from course.models import (
    Course, Module, Lesson, Variant, VariantItem,
    CompletedLesson, Note, Review, Question_Answer,
    Question_Answer_Message, EnrolledCourse
)
from payment.models import CartOrder, CartOrderItem
import random
from datetime import datetime, timedelta
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with course-related sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing course data before seeding',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('Starting Course Data Seeding'))
        self.stdout.write(self.style.SUCCESS('='*70))
        
        if options['clear']:
            self.clear_course_data()
        
        # Get existing users
        teachers = list(Teacher.objects.all())
        students = list(Student.objects.all())
        
        if not teachers:
            self.stdout.write(self.style.ERROR('✗ No teachers found! Run seed_database first.'))
            return
        
        if not students:
            self.stdout.write(self.style.ERROR('✗ No students found! Run seed_database first.'))
            return
        
        # Create course data
        courses = self.create_courses(teachers)
        self.create_modules_and_lessons(courses)
        self.create_variants_and_items(courses)
        self.create_enrollments(courses, students)
        self.create_reviews(courses, students)
        self.create_qa(courses, students, teachers)
        self.create_notes(students)
        self.create_completed_lessons(students)
        
        self.print_summary()
        self.stdout.write(self.style.SUCCESS('\n✓ Course seeding completed successfully!'))

    def clear_course_data(self):
        """Clear existing course data"""
        self.stdout.write('Clearing existing course data...')
        CompletedLesson.objects.all().delete()
        Note.objects.all().delete()
        Question_Answer_Message.objects.all().delete()
        Question_Answer.objects.all().delete()
        Review.objects.all().delete()
        EnrolledCourse.objects.all().delete()
        CartOrderItem.objects.all().delete()
        CartOrder.objects.all().delete()
        VariantItem.objects.all().delete()
        Variant.objects.all().delete()
        Lesson.objects.all().delete()
        Module.objects.all().delete()
        Course.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('✓ Course data cleared'))

    @transaction.atomic
    def create_courses(self, teachers):
        """Create sample courses"""
        self.stdout.write('\n📚 Creating courses...')
        
        courses_data = [
            {
                'title': 'Advanced Mathematics for O/L',
                'desc': 'Comprehensive mathematics course covering algebra, geometry, trigonometry, and statistics. Perfect for Grade 10 and 11 students preparing for O/L examinations.',
                'dept': 'Mathematics',
                'level': 'Grade 10',
                'lang': 'English',
                'price': '5000.00',
                'featured': True,
            },
            {
                'title': 'Physics for A/L - Complete Course',
                'desc': 'Complete A/L physics covering mechanics, electricity, magnetism, waves, and modern physics with practical experiments and exam preparation.',
                'dept': 'Science',
                'level': 'Grade 12',
                'lang': 'English',
                'price': '7500.00',
                'featured': True,
            },
            {
                'title': 'English Language Mastery',
                'desc': 'Improve your English skills including grammar, vocabulary, reading comprehension, essay writing, and spoken English.',
                'dept': 'English',
                'level': 'Grade 11',
                'lang': 'English',
                'price': '4500.00',
                'featured': False,
            },
            {
                'title': 'Sinhala Language & Literature',
                'desc': 'Comprehensive Sinhala course covering grammar, literature appreciation, essay writing, and composition for O/L students.',
                'dept': 'Languages',
                'level': 'Grade 9',
                'lang': 'Singhalese',
                'price': '4000.00',
                'featured': False,
            },
            {
                'title': 'Chemistry - Organic & Inorganic',
                'desc': 'Complete chemistry for A/L including organic chemistry, inorganic chemistry, physical chemistry, and practical sessions.',
                'dept': 'Science',
                'level': 'Grade 13',
                'lang': 'English',
                'price': '8000.00',
                'featured': True,
            },
            {
                'title': 'Biology for O/L Students',
                'desc': 'O/L biology covering plant biology, animal biology, human body systems, ecology, and environmental science.',
                'dept': 'Science',
                'level': 'Grade 9',
                'lang': 'English',
                'price': '4500.00',
                'featured': False,
            },
            {
                'title': 'History & Civilization',
                'desc': 'Explore world history, Sri Lankan history, ancient civilizations, and develop critical thinking about historical events.',
                'dept': 'Social Studies',
                'level': 'Grade 10',
                'lang': 'English',
                'price': '3500.00',
                'featured': False,
            },
            {
                'title': 'Mathematics Olympiad Preparation',
                'desc': 'Advanced mathematics for competitive exams and olympiads with problem-solving techniques and challenging questions.',
                'dept': 'Mathematics',
                'level': 'Grade 11',
                'lang': 'English',
                'price': '6000.00',
                'featured': True,
            },
            {
                'title': 'Combined Mathematics for A/L',
                'desc': 'Pure mathematics and applied mathematics for A/L students covering calculus, vectors, statistics, and mechanics.',
                'dept': 'Mathematics',
                'level': 'Grade 12',
                'lang': 'English',
                'price': '7000.00',
                'featured': True,
            },
            {
                'title': 'ICT & Computer Science',
                'desc': 'Information technology fundamentals, programming basics, database management, and computer applications for students.',
                'dept': 'Computer Science',
                'level': 'Grade 10',
                'lang': 'English',
                'price': '5500.00',
                'featured': False,
            },
            {
                'title': 'Economics for A/L',
                'desc': 'Microeconomics, macroeconomics, and Sri Lankan economy for A/L students with case studies and exam preparation.',
                'dept': 'Commerce',
                'level': 'Grade 13',
                'lang': 'English',
                'price': '6500.00',
                'featured': False,
            },
            {
                'title': 'Business Studies & Accounting',
                'desc': 'Basic accounting principles, business management, entrepreneurship, and financial literacy for commerce students.',
                'dept': 'Commerce',
                'level': 'Grade 11',
                'lang': 'English',
                'price': '5800.00',
                'featured': False,
            },
        ]
        
        courses = []
        for c_data in courses_data:
            try:
                if not Course.objects.filter(title=c_data['title']).exists():
                    # Assign random teacher or cycle through teachers
                    teacher = random.choice(teachers)
                    
                    course = Course.objects.create(
                        title=c_data['title'],
                        description=c_data['desc'],
                        Department=c_data['dept'],
                        level=c_data['level'],
                        language=c_data['lang'],
                        price=Decimal(c_data['price']),
                        teacher=teacher,
                        platform_status='published',
                        teacher_course_status='Published',
                        assignment_status='accepted',
                        featured=c_data['featured']
                    )
                    courses.append(course)
                    self.stdout.write(self.style.SUCCESS(
                        f"✓ Created course: {c_data['title']} (Teacher: {teacher.First_Name} {teacher.Last_Name})"
                    ))
                else:
                    course = Course.objects.get(title=c_data['title'])
                    courses.append(course)
                    self.stdout.write(f"• Course already exists: {c_data['title']}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Error creating course {c_data['title']}: {e}"))
        
        return courses

    @transaction.atomic
    def create_modules_and_lessons(self, courses):
        """Create modules and lessons for courses"""
        self.stdout.write('\n📖 Creating modules and lessons...')
        
        module_templates = [
            'Introduction and Fundamentals',
            'Core Concepts',
            'Advanced Topics',
            'Practical Applications',
            'Exam Preparation',
            'Review and Practice'
        ]
        
        lesson_templates = {
            'video': [
                'Lecture: {}',
                'Tutorial: {}',
                'Demonstration: {}',
                'Concept Explanation: {}'
            ],
            'document': [
                'Reading Material: {}',
                'Study Notes: {}',
                'Reference Guide: {}',
                'Handout: {}'
            ],
            'quiz': [
                'Quiz: {}',
                'Practice Test: {}',
                'Self Assessment: {}',
                'Knowledge Check: {}'
            ],
            'assignment': [
                'Assignment: {}',
                'Project Work: {}',
                'Problem Set: {}',
                'Homework: {}'
            ]
        }
        
        created_count = 0
        for course in courses:
            try:
                # Create 4-6 modules per course
                num_modules = random.randint(4, 6)
                
                for i in range(num_modules):
                    if Module.objects.filter(course=course, order=i+1).exists():
                        continue
                    
                    module_title = f"Module {i+1}: {module_templates[i % len(module_templates)]}"
                    module = Module.objects.create(
                        course=course,
                        title=module_title,
                        order=i + 1
                    )
                    
                    # Create 4-7 lessons per module
                    num_lessons = random.randint(4, 7)
                    lesson_types = ['video', 'document', 'quiz', 'assignment']
                    
                    for j in range(num_lessons):
                        lesson_type = random.choice(lesson_types)
                        template = random.choice(lesson_templates[lesson_type])
                        lesson_title = template.format(f"Topic {j+1}")
                        
                        # Generate content URL based on type
                        if lesson_type == 'video':
                            content_url = f"https://www.youtube.com/watch?v={module.module_id}{j}"
                        elif lesson_type == 'document':
                            content_url = f"https://docs.example.com/course/{course.course_id}/module{i+1}/lesson{j+1}.pdf"
                        else:
                            content_url = f"Content for {lesson_title}"
                        
                        Lesson.objects.create(
                            module=module,
                            title=lesson_title,
                            content_type=lesson_type,
                            order=j + 1,
                            content_url_or_text=content_url,
                            duration_minutes=random.randint(15, 90)
                        )
                    
                    created_count += 1
                
                self.stdout.write(self.style.SUCCESS(
                    f"✓ Created {num_modules} modules with lessons for: {course.title}"
                ))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error creating modules for {course.title}: {e}"
                ))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total modules created: {created_count}"))

    @transaction.atomic
    def create_variants_and_items(self, courses):
        """Create variants and variant items (legacy curriculum system)"""
        self.stdout.write('\n📋 Creating variants and variant items...')
        
        variant_templates = [
            'Week 1-4: Introduction',
            'Week 5-8: Core Material',
            'Week 9-12: Advanced Content',
            'Week 13-16: Final Topics'
        ]
        
        created_count = 0
        for course in courses[:6]:  # Add variants to first 6 courses
            try:
                for v_idx, v_name in enumerate(variant_templates):
                    if Variant.objects.filter(course=course, title=v_name).exists():
                        continue
                    
                    variant = Variant.objects.create(
                        course=course,
                        title=v_name
                    )
                    
                    # Create 3-5 variant items per variant
                    num_items = random.randint(3, 5)
                    for i in range(num_items):
                        VariantItem.objects.create(
                            variant=variant,
                            title=f"Lesson {i+1}: Topic {i+1}",
                            description=f"Detailed content for lesson {i+1} in {v_name}",
                            file=f"https://cdn.example.com/courses/{course.course_id}/variant{variant.variant_id}/lesson{i+1}.mp4",
                            preview=(i == 0),  # First lesson is preview
                            content_duration=f"{random.randint(20, 60)} minutes"
                        )
                    
                    created_count += 1
                
                self.stdout.write(self.style.SUCCESS(
                    f"✓ Created variants for: {course.title}"
                ))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error creating variants for {course.title}: {e}"
                ))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total variants created: {created_count}"))

    @transaction.atomic
    def create_enrollments(self, courses, students):
        """Enroll students in courses with payment records"""
        self.stdout.write('\n🎓 Creating course enrollments...')
        
        created_count = 0
        for student in students[:20]:  # Enroll first 20 students
            try:
                # Each student enrolls in 1-4 courses
                num_courses = random.randint(1, 4)
                student_courses = random.sample(courses, min(num_courses, len(courses)))
                
                for course in student_courses:
                    if EnrolledCourse.objects.filter(user=student.user, course=course).exists():
                        continue
                    
                    # Create cart order
                    cart_order = CartOrder.objects.create(
                        user=student.user,
                        total_price=course.price,
                        payment_status='paid',
                        paid_date=datetime.now() - timedelta(days=random.randint(1, 90))
                    )
                    
                    # Create cart order item
                    cart_item = CartOrderItem.objects.create(
                        order=cart_order,
                        course=course,
                        price=course.price,
                        teacher=course.teacher
                    )
                    
                    # Create enrollment
                    EnrolledCourse.objects.create(
                        user=student.user,
                        course=course,
                        teacher=course.teacher,
                        order_item=cart_item,
                        date=datetime.now() - timedelta(days=random.randint(1, 90))
                    )
                    
                    created_count += 1
                
                self.stdout.write(f"  ✓ Enrolled {student.firstName} {student.lastName} in {num_courses} courses")
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error enrolling {student.firstName}: {e}"
                ))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total enrollments created: {created_count}"))

    @transaction.atomic
    def create_reviews(self, courses, students):
        """Create course reviews"""
        self.stdout.write('\n⭐ Creating reviews...')
        
        review_templates = [
            "Excellent course! The teacher explains concepts very clearly and the material is well-organized.",
            "Great content and very helpful for exam preparation. Highly recommended!",
            "Good course overall. Could use more practice questions but the theory is solid.",
            "Very comprehensive coverage of the syllabus. The teacher is knowledgeable and patient.",
            "This course helped me improve my grades significantly. Worth every rupee!",
            "Clear explanations and good examples. The video lessons are easy to follow.",
            "Fantastic course! The assignments really help reinforce the concepts learned.",
            "Well-structured course with excellent teaching methodology. Very satisfied!",
            "The course content is thorough and the teacher is very supportive.",
            "Highly effective course for O/L preparation. Covers all important topics.",
            "Great teacher and excellent study materials. Would definitely recommend.",
            "Very helpful course with practical examples and clear explanations.",
        ]
        
        created_count = 0
        for course in courses:
            try:
                # Get enrolled students for this course
                enrollments = EnrolledCourse.objects.filter(course=course)
                enrolled_students = [e.user for e in enrollments if hasattr(e.user, 'student')]
                
                if not enrolled_students:
                    continue
                
                # Create 3-8 reviews per course
                num_reviews = random.randint(3, min(8, len(enrolled_students)))
                reviewed_students = random.sample(enrolled_students, num_reviews)
                
                for user in reviewed_students:
                    if Review.objects.filter(course=course, user=user).exists():
                        continue
                    
                    Review.objects.create(
                        course=course,
                        user=user,
                        review=random.choice(review_templates),
                        rating=random.choices([3, 4, 5], weights=[10, 30, 60])[0],  # Weighted towards higher ratings
                        active=True,
                        date=datetime.now() - timedelta(days=random.randint(1, 60))
                    )
                    created_count += 1
                
                self.stdout.write(f"  ✓ Created {num_reviews} reviews for: {course.title}")
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error creating reviews for {course.title}: {e}"
                ))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total reviews created: {created_count}"))

    @transaction.atomic
    def create_qa(self, courses, students, teachers):
        """Create Q&A discussions"""
        self.stdout.write('\n💬 Creating Q&A discussions...')
        
        questions = [
            "What are the prerequisites for this course?",
            "How long will it take to complete this course?",
            "Are there any practice tests available?",
            "Can I get a certificate after completion?",
            "Is there any homework or assignments?",
            "What materials do I need for this course?",
            "How often are new lessons added?",
            "Can I contact the teacher for extra help?",
            "Are past paper discussions included?",
            "What is the refund policy?",
        ]
        
        student_answers = [
            "I found the course materials very helpful. The practice tests are available in each module.",
            "I completed the course in about 3 months studying 2 hours daily.",
            "Yes, there are plenty of practice questions after each lesson.",
            "The teacher usually responds within 24 hours if you have questions.",
            "I think you can start without much prior knowledge. The basics are covered well.",
        ]
        
        teacher_answers = [
            "No specific prerequisites are required. We cover all fundamentals in the first module.",
            "The course typically takes 3-4 months to complete at a steady pace.",
            "Yes, we provide practice tests and past papers throughout the course.",
            "Yes, you'll receive a certificate upon successful completion of all modules.",
            "Yes, there are weekly assignments to help reinforce your learning.",
            "All materials are provided online. You just need a notebook for practice.",
            "We add new content and updates regularly based on the latest syllabus.",
            "Yes, I'm available for clarifications. You can ask questions in the Q&A section.",
            "Yes, we discuss past examination papers and common question patterns.",
            "Please refer to our refund policy in the course information section.",
        ]
        
        created_count = 0
        for course in courses[:8]:  # Add Q&A to first 8 courses
            try:
                # Get enrolled students
                enrollments = EnrolledCourse.objects.filter(course=course)
                enrolled_students = [e.user for e in enrollments if hasattr(e.user, 'student')]
                
                if not enrolled_students:
                    continue
                
                # Create 2-4 Q&A threads per course
                num_qa = random.randint(2, 4)
                
                for i in range(num_qa):
                    if i >= len(questions):
                        break
                    
                    asker = random.choice(enrolled_students)
                    
                    if Question_Answer.objects.filter(course=course, title=questions[i]).exists():
                        continue
                    
                    qa = Question_Answer.objects.create(
                        course=course,
                        user=asker,
                        title=questions[i],
                        date=datetime.now() - timedelta(days=random.randint(1, 30))
                    )
                    
                    # Add 1-3 answers
                    num_answers = random.randint(1, 3)
                    for j in range(num_answers):
                        # Randomly choose if answer is from teacher or another student
                        if random.random() > 0.5 and course.teacher:
                            answerer = course.teacher.user
                            answer_text = random.choice(teacher_answers)
                        else:
                            answerer = random.choice(enrolled_students)
                            answer_text = random.choice(student_answers)
                        
                        Question_Answer_Message.objects.create(
                            course=course,
                            question=qa,
                            user=answerer,
                            message=answer_text,
                            date=datetime.now() - timedelta(days=random.randint(0, 20))
                        )
                    
                    created_count += 1
                
                self.stdout.write(f"  ✓ Created Q&A for: {course.title}")
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error creating Q&A for {course.title}: {e}"
                ))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total Q&A threads created: {created_count}"))

    @transaction.atomic
    def create_notes(self, students):
        """Create student notes"""
        self.stdout.write('\n📝 Creating student notes...')
        
        note_templates = [
            "Key points from today's lesson:\n- Important formula: {}\n- Remember to practice problems\n- Review before next class",
            "Chapter summary:\n{}\n\nMain concepts covered and examples to remember.",
            "Practice problems:\n{}\n\nQuestions to solve for better understanding.",
            "Exam tips:\n- {}\n- Focus on understanding concepts\n- Practice past papers",
            "Class notes:\n{}\n\nAdditional resources and references mentioned by teacher.",
        ]
        
        created_count = 0
        for student in students[:15]:  # Create notes for first 15 students
            try:
                # Get student's enrolled courses
                enrollments = EnrolledCourse.objects.filter(user=student.user)
                
                for enrollment in enrollments:
                    # Create 2-4 notes per enrolled course
                    num_notes = random.randint(2, 4)
                    
                    for i in range(num_notes):
                        template = random.choice(note_templates)
                        note_content = template.format(f"Session {i+1} - Module content")
                        
                        Note.objects.create(
                            user=student.user,
                            course=enrollment.course,
                            title=f"Notes - {enrollment.course.title} - Session {i+1}",
                            note=note_content,
                            date=datetime.now() - timedelta(days=random.randint(1, 45))
                        )
                        created_count += 1
                
                self.stdout.write(f"  ✓ Created notes for: {student.firstName} {student.lastName}")
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error creating notes for {student.firstName}: {e}"
                ))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total notes created: {created_count}"))

    @transaction.atomic
    def create_completed_lessons(self, students):
        """Mark some lessons as completed for students"""
        self.stdout.write('\n✅ Creating completed lessons...')
        
        created_count = 0
        for student in students[:15]:  # Process first 15 students
            try:
                # Get student's enrolled courses
                enrollments = EnrolledCourse.objects.filter(user=student.user)
                
                for enrollment in enrollments:
                    # Get all lessons for this course
                    modules = Module.objects.filter(course=enrollment.course)
                    all_lessons = Lesson.objects.filter(module__in=modules)
                    
                    if not all_lessons.exists():
                        continue
                    
                    # Mark 30-70% of lessons as completed
                    total_lessons = all_lessons.count()
                    num_completed = int(total_lessons * random.uniform(0.3, 0.7))
                    
                    completed_lessons = random.sample(list(all_lessons), min(num_completed, total_lessons))
                    
                    for lesson in completed_lessons:
                        if CompletedLesson.objects.filter(user=student.user, lesson=lesson).exists():
                            continue
                        
                        CompletedLesson.objects.create(
                            user=student.user,
                            lesson=lesson,
                            completed=True,
                            date=datetime.now() - timedelta(days=random.randint(1, 60))
                        )
                        created_count += 1
                
                self.stdout.write(f"  ✓ Marked lessons completed for: {student.firstName} {student.lastName}")
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"✗ Error marking lessons for {student.firstName}: {e}"
                ))
        
        self.stdout.write(self.style.SUCCESS(f"✓ Total completed lessons: {created_count}"))

    def print_summary(self):
        """Print summary of seeded course data"""
        self.stdout.write(self.style.WARNING('\n' + '='*70))
        self.stdout.write(self.style.WARNING('COURSE SEED DATA SUMMARY'))
        self.stdout.write(self.style.WARNING('='*70))
        self.stdout.write(f"Total Courses: {Course.objects.count()}")
        self.stdout.write(f"  - Published: {Course.objects.filter(platform_status='published').count()}")
        self.stdout.write(f"  - Featured: {Course.objects.filter(featured=True).count()}")
        self.stdout.write(f"Total Modules: {Module.objects.count()}")
        self.stdout.write(f"Total Lessons: {Lesson.objects.count()}")
        self.stdout.write(f"  - Videos: {Lesson.objects.filter(content_type='video').count()}")
        self.stdout.write(f"  - Documents: {Lesson.objects.filter(content_type='document').count()}")
        self.stdout.write(f"  - Quizzes: {Lesson.objects.filter(content_type='quiz').count()}")
        self.stdout.write(f"  - Assignments: {Lesson.objects.filter(content_type='assignment').count()}")
        self.stdout.write(f"Total Variants: {Variant.objects.count()}")
        self.stdout.write(f"Total Variant Items: {VariantItem.objects.count()}")
        self.stdout.write(f"Total Enrollments: {EnrolledCourse.objects.count()}")
        self.stdout.write(f"Total Reviews: {Review.objects.count()}")
        self.stdout.write(f"  - Average Rating: {Review.objects.filter(active=True).aggregate(avg=models.Avg('rating'))['avg'] or 0:.2f}")
        self.stdout.write(f"Total Q&A Threads: {Question_Answer.objects.count()}")
        self.stdout.write(f"Total Q&A Messages: {Question_Answer_Message.objects.count()}")
        self.stdout.write(f"Total Notes: {Note.objects.count()}")
        self.stdout.write(f"Total Completed Lessons: {CompletedLesson.objects.count()}")
        self.stdout.write(self.style.WARNING('='*70))


from django.db.models import Avg
from django.db import models