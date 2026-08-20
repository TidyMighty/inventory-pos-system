from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model so we can attach a role and a home branch without
    fighting Django's built-in User later. Everything else (username,
    password, is_staff, etc.) comes from AbstractUser as normal.
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        CASHIER = "cashier", "Cashier"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CASHIER)

    # A user's "home" branch. Admins/managers can still be scoped to a
    # branch, but nothing stops an admin from acting across all branches
    # at the permission-check level (see users/permissions.py).
    branch = models.ForeignKey(
        "inventory.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="staff",
    )

    def __str__(self):
        return self.username

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER
