import asyncio
from backend.services.notification_service import NotificationService
from backend.config.settings import EMAIL_CONFIG, TWILIO_CONFIG

async def test_notifications():
    service = NotificationService(EMAIL_CONFIG, TWILIO_CONFIG)
    
    # Test email
    print("Testing email...")
    email_result = await service.send_email(
        to_email=EMAIL_CONFIG['FROM_EMAIL'],  # Send to yourself
        subject="Cymatics Test Email",
        body="This is a test email from the Cymatics application."
    )
    print(f"Email test {'succeeded' if email_result else 'failed'}")
    
    # Test SMS if enabled
    if TWILIO_CONFIG['ENABLED']:
        print("\nTesting SMS...")
        sms_result = await service.send_sms(
            to_number="your-phone-number",  # Add your phone number here
            message="This is a test SMS from the Cymatics application."
        )
        print(f"SMS test {'succeeded' if sms_result else 'failed'}")

if __name__ == "__main__":
    asyncio.run(test_notifications())