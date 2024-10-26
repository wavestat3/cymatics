from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from pathlib import Path
import smtplib
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, config):
        self.smtp_server = config.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = config.get('SMTP_PORT', 587)
        self.smtp_username = config.get('SMTP_USERNAME')
        self.smtp_password = config.get('SMTP_PASSWORD')
        self.from_email = config.get('FROM_EMAIL')

    async def send_recording(
        self,
        to_email: str,
        frequency: float,
        image_path: Optional[str] = None,
        video_path: Optional[str] = None,
        notes: Optional[str] = None
    ):
        try:
            msg = MIMEMultipart()
            msg['Subject'] = f'Your Cymatics Recording at {frequency}Hz'
            msg['From'] = self.from_email
            msg['To'] = to_email

            # Email body
            body = f"""
            Thank you for using our Cymatics Visualization tool!
            
            Recording Details:
            - Frequency: {frequency}Hz
            - Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
            if notes:
                body += f"\nNotes: {notes}"
            
            msg.attach(MIMEText(body, 'plain'))

            # Attach image if available
            if image_path and os.path.exists(image_path):
                with open(image_path, 'rb') as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-Disposition', 'attachment', 
                                 filename=os.path.basename(image_path))
                    msg.attach(img)

            # Attach video if available
            if video_path and os.path.exists(video_path):
                with open(video_path, 'rb') as f:
                    video_data = f.read()
                    video_attachment = MIMEImage(video_data)
                    video_attachment.add_header('Content-Disposition', 'attachment', 
                                             filename=os.path.basename(video_path))
                    msg.attach(video_attachment)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False