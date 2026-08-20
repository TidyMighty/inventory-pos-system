from django.contrib import admin

from .models import Branch, Product, Stock


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "is_active")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "category", "price", "is_active")
    search_fields = ("sku", "name")


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ("product", "branch", "quantity", "low_stock_threshold", "status")
    list_filter = ("branch",)
