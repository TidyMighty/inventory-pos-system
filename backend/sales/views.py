from datetime import timedelta

from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import Branch, Stock

from .models import Sale, SaleItem
from .serializers import CreateSaleSerializer, SaleSerializer


def user_is_admin(user):
    return bool(
        user
        and user.is_authenticated
        and user.is_admin
    )


def validate_branch_access(request, branch_id):
    """
    Admins can access any branch.

    Managers and cashiers can only access their
    assigned branch.
    """
    user = request.user

    if user_is_admin(user):
        return

    user_branch = getattr(user, "branch", None)

    if not user_branch:
        raise PermissionDenied(
            "Your account is not assigned to a branch."
        )

    if int(branch_id) != user_branch.id:
        raise PermissionDenied(
            f"You can only access {user_branch.name}."
        )


def get_scoped_sales(request):
    """
    Return sales restricted to the user's permitted branch scope.

    Admin:
        All branches unless ?branch_id= is supplied.

    Manager/Cashier:
        Their assigned branch only.
    """
    user = request.user

    qs = Sale.objects.select_related(
        "branch",
        "cashier",
    ).prefetch_related(
        "items",
    )

    requested_branch = request.query_params.get("branch_id")

    if requested_branch:
        validate_branch_access(
            request,
            requested_branch,
        )

        return qs.filter(
            branch_id=int(requested_branch)
        )

    if user_is_admin(user):
        return qs

    user_branch = getattr(user, "branch", None)

    if not user_branch:
        return Sale.objects.none()

    return qs.filter(
        branch_id=user_branch.id
    )


class SaleListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/sales/
    POST /api/sales/

    Admin:
        Can view sales from all branches and create
        sales for any branch.

    Manager/Cashier:
        Can only view and create sales for their
        assigned branch.
    """

    def get_queryset(self):
        return get_scoped_sales(self.request)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateSaleSerializer

        return SaleSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        sale = serializer.save()

        return Response(
            SaleSerializer(sale).data,
            status=status.HTTP_201_CREATED,
        )


def _date_range(request):
    """
    Shared ?days=N window.

    Defaults to 7 days.
    """
    try:
        days = int(
            request.query_params.get(
                "days",
                7,
            )
        )
    except (TypeError, ValueError):
        days = 7

    days = max(1, min(days, 365))

    since = timezone.now() - timedelta(
        days=days
    )

    return since


def _today_range():
    """
    Return the start and end of today using Django's
    configured timezone.
    """
    now = timezone.localtime()

    start = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    end = start + timedelta(days=1)

    return start, end


class SalesSummaryView(APIView):
    """
    GET /api/sales/reports/summary/

    Admin:
        Can request any branch or all branches.

    Manager/Cashier:
        Automatically restricted to their branch.

    Returns:
        total_sales
        transaction_count
        today_sales
        today_transactions
        low_stock_items
        active_branches
        trend
    """

    def get(self, request):
        since = _date_range(request)

        scoped_sales = get_scoped_sales(request)

        period_sales = scoped_sales.filter(
            created_at__gte=since
        )

        today_start, today_end = _today_range()

        today_sales_qs = scoped_sales.filter(
            created_at__gte=today_start,
            created_at__lt=today_end,
        )

        totals = period_sales.aggregate(
            total_sales=Sum("total")
        )

        today_totals = today_sales_qs.aggregate(
            today_sales=Sum("total")
        )

        transaction_count = period_sales.count()

        today_transactions = today_sales_qs.count()

        trend = (
            period_sales
            .extra(
                select={
                    "day": "date(created_at)"
                }
            )
            .values("day")
            .annotate(
                sales=Sum("total")
            )
            .order_by("day")
        )

        user = request.user

        if user_is_admin(user):
            active_branches = Branch.objects.filter(
                is_active=True
            ).count()

            low_stock_items = Stock.objects.filter(
                quantity__lte=F("low_stock_threshold")
            ).count()

        else:
            user_branch = getattr(
                user,
                "branch",
                None,
            )

            if not user_branch:
                active_branches = 0
                low_stock_items = 0
            else:
                active_branches = 1 if user_branch.is_active else 0

                low_stock_items = Stock.objects.filter(
                    branch=user_branch,
                    quantity__lte=F("low_stock_threshold"),
                ).count()

        return Response(
            {
                "total_sales": totals["total_sales"] or 0,
                "transaction_count": transaction_count,

                "today_sales": today_totals["today_sales"] or 0,
                "today_transactions": today_transactions,

                "low_stock_items": low_stock_items,
                "active_branches": active_branches,

                "trend": list(trend),
            }
        )


class TopProductsView(APIView):
    """
    GET /api/sales/reports/top-products/

    Admin:
        Can request any branch or all branches.

    Manager/Cashier:
        Automatically restricted to their branch.
    """

    def get(self, request):
        since = _date_range(request)

        qs = SaleItem.objects.filter(
            sale__created_at__gte=since
        )

        requested_branch = request.query_params.get(
            "branch_id"
        )

        if requested_branch:
            validate_branch_access(
                request,
                requested_branch,
            )

            qs = qs.filter(
                sale__branch_id=int(
                    requested_branch
                )
            )

        elif not user_is_admin(request.user):
            user_branch = getattr(
                request.user,
                "branch",
                None,
            )

            if not user_branch:
                qs = SaleItem.objects.none()
            else:
                qs = qs.filter(
                    sale__branch_id=user_branch.id
                )

        top = (
            qs.values(
                "product__id",
                "product__sku",
                "product__name",
            )
            .annotate(
                units_sold=Sum("quantity"),
                revenue=Sum(
                    F("quantity")
                    * F("unit_price")
                ),
            )
            .order_by("-units_sold")[:50]
        )

        return Response(
            list(top)
        )