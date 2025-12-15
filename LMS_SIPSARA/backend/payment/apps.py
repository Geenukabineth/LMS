from django.apps import AppConfig


class PaymentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'payment'  # FIXED: Changed from 'Payment' to 'payment' (lowercase)
    verbose_name = 'Payment Management'
    
    def ready(self):
        """Import signals when the app is ready"""
        # Import any signals here if you have them
        # import payment.signals
        pass