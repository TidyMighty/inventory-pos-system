from rest_framework import serializers

from .models import (
    Branch,
    Product,
    Stock,
    StockAdjustment,
    StockReceipt,
)


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = [
            "id",
            "name",
            "address",
            "is_active",
        ]


class ProductSerializer(serializers.ModelSerializer):
    qty = serializers.IntegerField(
        read_only=True,
        required=False,
    )

    status = serializers.CharField(
        read_only=True,
        required=False,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "category",
            "price",
            "is_active",
            "qty",
            "status",
        ]


class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    sku = serializers.CharField(
        source="product.sku",
        read_only=True,
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True,
    )

    status = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = Stock
        fields = [
            "id",
            "product",
            "product_name",
            "sku",
            "branch",
            "branch_name",
            "quantity",
            "low_stock_threshold",
            "status",
            "updated_at",
        ]


class StockReceiptSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    sku = serializers.CharField(
        source="product.sku",
        read_only=True,
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True,
    )

    received_by_name = serializers.CharField(
        source="received_by.username",
        read_only=True,
    )

    class Meta:
        model = StockReceipt
        fields = [
            "id",
            "product",
            "product_name",
            "sku",
            "branch",
            "branch_name",
            "quantity",
            "reference",
            "notes",
            "received_by",
            "received_by_name",
            "created_at",
        ]

        read_only_fields = [
            "received_by",
            "created_at",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Received quantity must be greater than zero."
            )

        return value


class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    sku = serializers.CharField(
        source="product.sku",
        read_only=True,
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True,
    )

    adjusted_by_name = serializers.CharField(
        source="adjusted_by.username",
        read_only=True,
    )

    class Meta:
        model = StockAdjustment
        fields = [
            "id",
            "product",
            "product_name",
            "sku",
            "branch",
            "branch_name",
            "quantity",
            "reason",
            "notes",
            "adjusted_by",
            "adjusted_by_name",
            "created_at",
        ]

        read_only_fields = [
            "adjusted_by",
            "created_at",
        ]

    def validate_quantity(self, value):
        if value == 0:
            raise serializers.ValidationError(
                "Adjustment quantity cannot be zero."
            )

        return value


# Kept temporarily so existing code/imports do not break.
# New receiving operations should use StockReceiptSerializer.
class RestockSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True)
    )

    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True)
    )

    quantity = serializers.IntegerField(
        min_value=1
    )

    reference = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )