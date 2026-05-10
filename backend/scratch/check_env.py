import sys
import os
# Adjust path to find the 'app' package
sys.path.append(os.getcwd())

from app.core.config import settings

print(f"SMTP_HOST: {settings.SMTP_HOST}")
print(f"SMTP_PORT: {settings.SMTP_PORT}")
print(f"SMTP_USER: '{settings.SMTP_USER}'")
print(f"SMTP_PASSWORD_SET: {bool(settings.SMTP_PASSWORD)}")
