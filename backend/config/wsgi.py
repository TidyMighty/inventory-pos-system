"""
WSGI config for the Inventory + POS backend.

Exposes the WSGI callable as a module-level variable named ``application``.
Used by gunicorn when deployed (e.g. on Render).
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
