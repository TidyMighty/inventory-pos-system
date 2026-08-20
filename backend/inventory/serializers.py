from rest_framework import serializers

from .models import Branch, Product, Stock


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "address", "is_active"]


class ProductSerializer(serializers.ModelSerializer):
    # Convenience fields the frontend's ProductList table wants (qty/status
    # at whichever branch the caller is scoped to), computed in get_queryset.
    qty = serializers.IntegerField(read_only=True, required=False)
    status = serializers.CharField(read_only=True, required=False)

    class Meta:
        model = Product
        fields = ["id", "sku", "name", "category", "price", "is_active", "qty", "status"]


class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    status = serializers.CharField(read_only=True)

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


class RestockSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    quantity = serializers.IntegerField()

    def save(self, **kwargs):
        product = self.validated_data["product"]
        branch = self.validated_data["branch"]
        quantity = self.validated_data["quantity"]

        stock, _ = Stock.objects.get_or_create(product=product, branch=branch)
        stock.quantity = models_f_add(stock.quantity, quantity)
        stock.save()
        return stock


def models_f_add(current, delta):
    """Adding stock should never drop below zero even with a negative adjustment."""
    return max(0, current + delta)
