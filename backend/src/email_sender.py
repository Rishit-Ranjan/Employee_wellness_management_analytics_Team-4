import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> None:
    """Send email via SMTP.

    Required env vars:
      - SMTP_HOST
      - SMTP_PORT
      - SMTP_USERNAME
      - SMTP_PASSWORD

    Optional:
      - SMTP_USE_TLS (true/false, default true)
      - EMAIL_FROM (default SMTP_USERNAME)
    """

    smtp_host = os.getenv('SMTP_HOST', '').strip()
    smtp_port = int(os.getenv('SMTP_PORT', '587').strip())
    smtp_username = os.getenv('SMTP_USERNAME', '').strip()
    smtp_password = os.getenv('SMTP_PASSWORD', '').strip()
    smtp_use_tls = os.getenv('SMTP_USE_TLS', 'true').strip().lower() in {'1', 'true', 'yes', 'y'}

    if not (smtp_host and smtp_username and smtp_password):
        raise RuntimeError('SMTP is not configured. Set SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD in environment.')

    email_from = os.getenv('EMAIL_FROM', smtp_username)

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = email_from
    msg['To'] = to_email

    if text_body:
        msg.attach(MIMEText(text_body, 'plain'))

    msg.attach(MIMEText(html_body, 'html'))

    if smtp_use_tls:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
    else:
        server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        server.login(smtp_username, smtp_password)

    try:
        server.sendmail(email_from, [to_email], msg.as_string())
    finally:
        try:
            server.quit()
        except Exception:
            pass

