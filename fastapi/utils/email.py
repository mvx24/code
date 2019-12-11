import emails
from emails.template import JinjaTemplate

from app import settings


def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    context: dict = None,
):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(
            f"Warning: email not configured, not sending message {subject_template} to {email_to}"
        )
        return
    message = emails.Message(
        subject=JinjaTemplate(settings.EMAIL_SUBJECT_PREFIX + subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    message.send(to=email_to, render=context, smtp=smtp_options)
