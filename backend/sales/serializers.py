from django.db import transaction
from rest_framework import serializers

from inventory.models import Branch, Product, Stock

from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)
    line_total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "sku",
            "quantity",
            "unit_price",
            "line_total",
        ]
        read_only_fields = ["unit_price"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    cashier_name = serializers.CharField(
        source="cashier.username",
        read_only=True,
    )

    class Meta:
        model = Sale
        fields = [
            "id",
            "branch",
            "branch_name",
            "cashier",
            "cashier_name",
            "total",
            "created_at",
            "items",
        ]
        read_only_fields = ["total", "cashier"]


class SaleLineInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True)
    )
    quantity = serializers.IntegerField(min_value=1)


class CreateSaleSerializer(serializers.Serializer):
    """
    POST /api/sales/

    Admin:
        Can sell from any branch.

    Manager/Cashier:
        Can only sell from their assigned branch.

    Example:
    {
        "branch": 4,
        "items": [
            {
                "product": 4,
                "quantity": 2
            }
        ]
    }
    """

    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True)
    )

    items = SaleLineInputSerializer(
        many=True,
        allow_empty=False,
    )

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        branch = attrs["branch"]

        # Admins can operate across all branches.
        if user.is_admin:
            return attrs

        # Managers and cashiers must have an assigned branch.
        if not user.branch:
            raise serializers.ValidationError(
                "Your account is not assigned to a branch."
            )

        # Prevent branch users from selling from another branch.
        if user.branch_id != branch.id:
            raise serializers.ValidationError(
                f"You can only make sales for {user.branch.name}."
            )

        return attrs

    def validate_items(self, items):
        seen = set()

        for line in items:
            product_id = line["product"].id

            if product_id in seen:
                raise serializers.ValidationError(
                    "Duplicate product in ticket; combine quantities instead."
                )

            seen.add(product_id)

        return items

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]

        branch = validated_data["branch"]
        lines = validated_data["items"]

        sale = Sale.objects.create(
            branch=branch,
            cashier=request.user,
        )

        for line in lines:
            product = line["product"]
            quantity = line["quantity"]

            stock, _ = Stock.objects.select_for_update().get_or_create(
                product=product,
                branch=branch,
            )

            if stock.quantity < quantity:
                raise serializers.ValidationError(
                    f"Not enough stock for {product.name} at "
                    f"{branch.name} "
                    f"(have {stock.quantity}, need {quantity})."
                )

            stock.quantity -= quantity

            stock.save(
                update_fields=["quantity"]
            )

            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=product.price,
            )

        sale.recalculate_total()

        return sale