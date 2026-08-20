from django.db import models


class Branch(models.Model):
    name = models.CharField(max_length=120, unique=True)
    address = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    sku = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.sku} — {self.name}"


class Stock(models.Model):
    """Quantity of a given product held at a given branch."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_records")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="stock_records")
    quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["product", "branch"], name="unique_product_branch_stock")
        ]
        ordering = ["product__name"]

    def __str__(self):
        return f"{self.product.sku} @ {self.branch.name}: {self.quantity}"

    @property
    def status(self):
        if self.quantity == 0:
            return "out"
        if self.quantity <= self.low_stock_threshold:
            return "low"
        return "ok"
