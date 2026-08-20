from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("POS role", {"fields": ("role", "branch")}),
    )
    list_display = ("username", "email", "role", "branch", "is_staff")
    list_filter = ("role", "branch", "is_staff")
