from django.db.models import Case, IntegerField, Value, When
from rest_framework import generics, status, viewsets
from rest_framework.response import Response

from users.permissions import IsManagerOrAdmin

from .models import Branch, Product, Stock
from .serializers import (
    BranchSerializer,
    ProductSerializer,
    RestockSerializer,
    StockSerializer,
)


class BranchViewSet(viewsets.ModelViewSet):
    """GET/POST /api/inventory/branches/, GET/PATCH/DELETE .../{id}/"""

    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsManagerOrAdmin]


class ProductViewSet(viewsets.ModelViewSet):
    """
    GET/POST /api/inventory/products/, GET/PATCH/DELETE .../{id}/

    Matches frontend/src/api/products.js -> listProducts().
    Supports ?search= and, when ?branch_id= is given, annotates each
    product with qty/status at that branch so ProductList.jsx can render
    the stock badge without a second round trip.
    """

    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            from django.db.models import Q

            qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        branch_id = request.query_params.get("branch_id")
        if branch_id:
            stock_by_product = {
                s.product_id: s
                for s in Stock.objects.filter(branch_id=branch_id)
            }
            results = response.data.get("results", response.data)
            for row in results:
                stock = stock_by_product.get(row["id"])
                row["qty"] = stock.quantity if stock else 0
                row["status"] = stock.status if stock else "out"
        return response


class StockListView(generics.ListAPIView):
    """
    GET /api/inventory/?branch_id=<id>

    Matches frontend/src/api/products.js -> getInventory(branchId).
    Without branch_id, returns stock across all branches.
    """

    serializer_class = StockSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        qs = Stock.objects.select_related("product", "branch")
        branch_id = self.request.query_params.get("branch_id")
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        # Low/out-of-stock first, so the dashboard's "needs attention" view
        # doesn't need to re-sort client side.
        qs = qs.annotate(
            urgency=Case(
                When(quantity=0, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by("urgency", "quantity")
        return qs


class RestockView(generics.GenericAPIView):
    """
    POST /api/inventory/restock/  {product, branch, quantity}

    Matches frontend/src/api/products.js -> restock(). `quantity` is a
    delta: positive to add stock, negative to correct/deduct it.
    """

    serializer_class = RestockSerializer
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stock = serializer.save()
        return Response(StockSerializer(stock).data, status=status.HTTP_200_OK)
