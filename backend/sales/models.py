from django.conf import settings
from django.db import models

from inventory.models import Branch, Product


class Sale(models.Model):
    """One completed POS transaction (a 'ticket')."""

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="sales")
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sales"
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Sale #{self.pk} — {self.branch} — {self.total}"

    def recalculate_total(self):
        self.total = sum(line.line_total for line in self.items.all())
        self.save(update_fields=["total"])


class SaleItem(models.Model):
    """A single product line within a Sale, priced at time of sale."""

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def line_total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.quantity} x {self.product.sku}"
