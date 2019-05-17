import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import emails
from emails.template import JinjaTemplate

from app import settings


def send_email(email_to: str, subject_template='', html_template='', environment=None):
    message = emails.Message(
        subject=JinjaTemplate(settings.EMAIL_SUBJECT_PREFIX + subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {'host': settings.SMTP_HOST, 'port': settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options['tls'] = True
    if settings.SMTP_USER:
        smtp_options['user'] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options['password'] = settings.SMTP_PASSWORD
    message.send(to=email_to, render=environment, smtp=smtp_options)
