from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from pathlib import Path
import smtplib
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, email_config, twilio_config):
        self.email_config = email_config
        self.twilio_config = twilio_config
        
        # Initialize Twilio client if enabled
        self.twilio_client = None
        if (twilio_config['ENABLED'] and 
            twilio_config['ACCOUNT_SID'] and 
            twilio_config['AUTH_TOKEN']):
            try:
                self.twilio_client = Client(
                    twilio_config['ACCOUNT_SID'],
                    twilio_config['AUTH_TOKEN']
                )
                logger.info("Twilio client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")

    async def send_email(self, to_email: str, subject: str, body: str, image_path: str = None) -> bool:
        """Send an email with optional image attachment."""
        try:
            msg = MIMEMultipart()
            msg['Subject'] = subject
            msg['From'] = self.email_config['FROM_EMAIL']
            msg['To'] = to_email

            # Add body
            msg.attach(MIMEText(body, 'plain'))

            # Add image if provided
            if image_path and Path(image_path).exists():
                with open(image_path, 'rb') as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-Disposition', 'attachment', 
                                 filename=Path(image_path).name)
                    msg.attach(img)

            # Send email
            with smtplib.SMTP(self.email_config['SMTP_SERVER'], 
                            self.email_config['SMTP_PORT']) as server:
                if self.email_config['USE_TLS']:
                    server.starttls()
                server.login(
                    self.email_config['SMTP_USERNAME'],
                    self.email_config['SMTP_PASSWORD']
                )
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def send_sms(self, to_number: str, message: str) -> bool:
        """Send an SMS message."""
        if not self.twilio_client or not self.twilio_config['ENABLED']:
            logger.warning("Twilio is not configured or disabled")
            return False

        try:
            message = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_config['FROM_NUMBER'],
                to=to_number
            )
            logger.info(f"SMS sent successfully to {to_number}")
            return True
            
        except TwilioRestException as e:
            logger.error(f"Twilio error: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False

    async def send_cymatics_recording(
        self,
        to_email: str,
        frequency: float,
        image_path: str = None,
        notes: str = None,
        phone_number: str = None
    ) -> bool:
        """Send cymatics recording notification via email and optionally SMS."""
        success = True
        
        # Prepare and send email
        if to_email:
            subject = f'Your Cymatics Recording at {frequency}Hz'
            body = (
                f"Thank you for using our Cymatics Visualization tool!\n\n"
                f"Recording Details:\n"
                f"- Frequency: {frequency}Hz\n"
                f"- Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            )
            
            if notes:
                body += f"\nNotes: {notes}"

            email_success = await self.send_email(
                to_email=to_email,
                subject=subject,
                body=body,
                image_path=image_path
            )
            success = success and email_success

        # Send SMS if phone number provided
        if phone_number and self.twilio_config['ENABLED']:
            sms_message = (
                f"Your cymatics recording at {frequency}Hz is ready! "
                f"Check your email at {to_email}" if to_email else
                f"Your cymatics recording at {frequency}Hz has been captured!"
            )
            sms_success = await self.send_sms(phone_number, sms_message)
            success = success and sms_success

        return success