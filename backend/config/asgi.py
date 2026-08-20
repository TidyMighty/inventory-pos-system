"""
ASGI config for the Inventory + POS backend.

Exposes the ASGI callable as a module-level variable named ``application``.
Not used by the default runserver/gunicorn setup, but included since some
hosting providers look for it automatically.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
