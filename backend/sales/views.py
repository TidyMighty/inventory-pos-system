from datetime import timedelta

from django.db.models import Sum, F
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Sale, SaleItem
from .serializers import CreateSaleSerializer, SaleSerializer


class SaleListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/sales/  — list sales (optionally ?branch_id=)
    POST /api/sales/  — complete a POS checkout

    Matches frontend/src/api/sales.js -> listSales() / createSale().
    """

    def get_queryset(self):
        qs = Sale.objects.select_related("branch", "cashier").prefetch_related("items")
        branch_id = self.request.query_params.get("branch_id")
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateSaleSerializer
        return SaleSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


def _date_range(request):
    """Shared ?days=N window (defaults to 7) for the report endpoints."""
    days = int(request.query_params.get("days", 7))
    since = timezone.now() - timedelta(days=days)
    return since


class SalesSummaryView(APIView):
    """
    GET /api/sales/reports/summary/?days=7&branch_id=

    Matches frontend/src/api/sales.js -> getSalesSummary(). Feeds the
    Dashboard's stat cards and sales-trend chart.
    """

    def get(self, request):
        since = _date_range(request)
        qs = Sale.objects.filter(created_at__gte=since)
        branch_id = request.query_params.get("branch_id")
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        totals = qs.aggregate(total_sales=Sum("total"))
        transaction_count = qs.count()

        trend = (
            qs.extra(select={"day": "date(created_at)"})
            .values("day")
            .annotate(sales=Sum("total"))
            .order_by("day")
        )

        return Response(
            {
                "total_sales": totals["total_sales"] or 0,
                "transaction_count": transaction_count,
                "trend": list(trend),
            }
        )


class TopProductsView(APIView):
    """
    GET /api/sales/reports/top-products/?days=7&branch_id=&limit=5

    Matches frontend/src/api/sales.js -> getTopProducts().
    """

    def get(self, request):
        since = _date_range(request)
        limit = int(request.query_params.get("limit", 5))

        qs = SaleItem.objects.filter(sale__created_at__gte=since)
        branch_id = request.query_params.get("branch_id")
        if branch_id:
            qs = qs.filter(sale__branch_id=branch_id)

        top = (
            qs.values("product__id", "product__sku", "product__name")
            .annotate(
                units_sold=Sum("quantity"),
                revenue=Sum(F("quantity") * F("unit_price")),
            )
            .order_by("-units_sold")[:limit]
        )

        return Response(list(top))
