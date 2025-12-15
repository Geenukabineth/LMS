from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def send_email(to_email, subject, template_name, context):
    """
    Sends an email using the configured Django backend (SendGrid).
    Returns True if successful, False otherwise.
    """
    try:
        # Render the HTML content from the template
        html_content = render_to_string(template_name, context)
        # Create a plain text version for email clients that don't support HTML
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email]
        )
        
        # Attach the HTML version
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False