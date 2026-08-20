"""
Root URL configuration.

Everything the frontend talks to lives under /api/. This matches the
frontend's src/api/client.js, which defaults to a baseURL of "/api"
(proxied to this server by vite.config.js during local development).
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import LoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth — matches frontend/src/api/auth.js and client.js
    path("api/auth/login/", LoginView.as_view(), name="auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    # App routes
    path("api/users/", include("users.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/sales/", include("sales.urls")),
]
