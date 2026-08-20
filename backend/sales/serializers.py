from django.db import transaction
from rest_framework import serializers

from inventory.models import Product, Stock

from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SaleItem
        fields = ["id", "product", "product_name", "sku", "quantity", "unit_price", "line_total"]
        read_only_fields = ["unit_price"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    cashier_name = serializers.CharField(source="cashier.username", read_only=True)

    class Meta:
        model = Sale
        fields = ["id", "branch", "branch_name", "cashier", "cashier_name", "total", "created_at", "items"]
        read_only_fields = ["total", "cashier"]


class SaleLineInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class CreateSaleSerializer(serializers.Serializer):
    """
    POST /api/sales/  {branch, items: [{product, quantity}, ...]}

    Matches frontend/src/api/sales.js -> createSale(branchId, items).
    Prices each line from the product's current price, deducts stock at
    the given branch, and returns the created Sale.
    """

    branch = serializers.PrimaryKeyRelatedField(queryset=Sale._meta.get_field("branch").related_model.objects.all())
    items = SaleLineInputSerializer(many=True, allow_empty=False)

    def validate_items(self, items):
        seen = set()
        for line in items:
            product_id = line["product"].id
            if product_id in seen:
                raise serializers.ValidationError("Duplicate product in ticket; combine quantities instead.")
            seen.add(product_id)
        return items

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        branch = validated_data["branch"]
        lines = validated_data["items"]

        sale = Sale.objects.create(branch=branch, cashier=request.user)

        for line in lines:
            product = line["product"]
            quantity = line["quantity"]

            stock, _ = Stock.objects.select_for_update().get_or_create(
                product=product, branch=branch
            )
            if stock.quantity < quantity:
                raise serializers.ValidationError(
                    f"Not enough stock for {product.name} at {branch.name} "
                    f"(have {stock.quantity}, need {quantity})."
                )
            stock.quantity -= quantity
            stock.save(update_fields=["quantity"])

            SaleItem.objects.create(
                sale=sale, product=product, quantity=quantity, unit_price=product.price
            )

        sale.recalculate_total()
        return sale
