from django.db import transaction
from django.db.models import Case, IntegerField, Q, Value, When

from rest_framework import generics, serializers, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from users.permissions import IsManagerOrAdmin

from .models import (
    Branch,
    Product,
    Stock,
    StockAdjustment,
    StockReceipt,
)

from .serializers import (
    BranchSerializer,
    ProductSerializer,
    StockAdjustmentSerializer,
    StockReceiptSerializer,
    StockSerializer,
)


def user_is_admin(user):
    return bool(
        user
        and user.is_authenticated
        and user.is_admin
    )


def get_user_branch(user):
    if user_is_admin(user):
        return None

    return getattr(user, "branch", None)


def validate_branch_access(request, branch_id):
    """
    Admins can access any branch.

    Managers/Cashiers can only access
    their assigned branch.
    """

    user = request.user

    if user_is_admin(user):
        return

    user_branch = get_user_branch(user)

    if not user_branch:
        raise PermissionDenied(
            "Your account is not assigned to a branch."
        )

    if int(branch_id) != user_branch.id:
        raise PermissionDenied(
            f"You can only access {user_branch.name}."
        )


class BranchViewSet(viewsets.ModelViewSet):

    serializer_class = BranchSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user

        if user_is_admin(user):
            return Branch.objects.all()

        user_branch = get_user_branch(user)

        if not user_branch:
            return Branch.objects.none()

        return Branch.objects.filter(
            id=user_branch.id
        )

    def perform_create(self, serializer):
        if not user_is_admin(self.request.user):
            raise PermissionDenied(
                "Only an admin can create a branch."
            )

        serializer.save()

    def perform_update(self, serializer):
        if not user_is_admin(self.request.user):
            raise PermissionDenied(
                "Only an admin can modify a branch."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if not user_is_admin(self.request.user):
            raise PermissionDenied(
                "Only an admin can delete a branch."
            )

        instance.delete()


class ProductViewSet(viewsets.ModelViewSet):

    queryset = Product.objects.filter(
        is_active=True
    )

    serializer_class = ProductSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):

        qs = super().get_queryset()

        search = self.request.query_params.get(
            "search"
        )

        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
            )

        return qs

    def list(self, request, *args, **kwargs):

        user = request.user

        requested_branch = request.query_params.get(
            "branch_id"
        )

        if requested_branch:

            validate_branch_access(
                request,
                requested_branch,
            )

            branch_id = int(requested_branch)

        elif user_is_admin(user):

            branch_id = None

        else:

            if not user.branch:
                raise PermissionDenied(
                    "Your account is not assigned to a branch."
                )

            branch_id = user.branch.id

        response = super().list(
            request,
            *args,
            **kwargs,
        )

        if branch_id:

            stock_by_product = {
                s.product_id: s
                for s in Stock.objects.filter(
                    branch_id=branch_id
                )
            }

            results = response.data.get(
                "results",
                response.data,
            )

            for row in results:

                stock = stock_by_product.get(
                    row["id"]
                )

                row["qty"] = (
                    stock.quantity
                    if stock
                    else 0
                )

                row["status"] = (
                    stock.status
                    if stock
                    else "out"
                )

        return response

    def perform_create(self, serializer):

        if not user_is_admin(
            self.request.user
        ):
            raise PermissionDenied(
                "Only an admin can create products."
            )

        serializer.save()

    def perform_update(self, serializer):

        if not user_is_admin(
            self.request.user
        ):
            raise PermissionDenied(
                "Only an admin can modify products."
            )

        serializer.save()

    def perform_destroy(self, instance):

        if not user_is_admin(
            self.request.user
        ):
            raise PermissionDenied(
                "Only an admin can delete products."
            )

        instance.delete()


class StockListView(generics.ListAPIView):

    serializer_class = StockSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):

        user = self.request.user

        requested_branch = (
            self.request.query_params.get(
                "branch_id"
            )
        )

        qs = Stock.objects.select_related(
            "product",
            "branch",
        )

        if requested_branch:

            validate_branch_access(
                self.request,
                requested_branch,
            )

            qs = qs.filter(
                branch_id=int(requested_branch)
            )

        elif not user_is_admin(user):

            if not user.branch:
                return Stock.objects.none()

            qs = qs.filter(
                branch_id=user.branch.id
            )

        qs = qs.annotate(
            urgency=Case(
                When(
                    quantity=0,
                    then=Value(0),
                ),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by(
            "urgency",
            "quantity",
        )

        return qs


# ============================================================
# STOCK RECEIVING
# ============================================================

class StockReceiptListCreateView(
    generics.ListCreateAPIView
):
    """
    GET  /api/inventory/receipts/
    POST /api/inventory/receipts/

    Admin:
        Can view/create receipts for any branch.

    Manager:
        Can view/create receipts for own branch.

    Cashier:
        No access.
    """

    serializer_class = StockReceiptSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):

        user = self.request.user

        qs = StockReceipt.objects.select_related(
            "product",
            "branch",
            "received_by",
        )

        requested_branch = (
            self.request.query_params.get(
                "branch_id"
            )
        )

        if requested_branch:

            validate_branch_access(
                self.request,
                requested_branch,
            )

            qs = qs.filter(
                branch_id=int(requested_branch)
            )

        elif not user_is_admin(user):

            if not user.branch:
                return StockReceipt.objects.none()

            qs = qs.filter(
                branch_id=user.branch.id
            )

        return qs

    @transaction.atomic
    def perform_create(self, serializer):

        user = self.request.user

        branch = serializer.validated_data[
            "branch"
        ]

        validate_branch_access(
            self.request,
            branch.id,
        )

        product = serializer.validated_data[
            "product"
        ]

        quantity = serializer.validated_data[
            "quantity"
        ]

        stock, _ = (
            Stock.objects.select_for_update()
            .get_or_create(
                product=product,
                branch=branch,
            )
        )

        stock.quantity += quantity

        stock.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

        serializer.save(
            received_by=user
        )


# ============================================================
# STOCK ADJUSTMENTS
# ============================================================

class StockAdjustmentListCreateView(
    generics.ListCreateAPIView
):
    """
    GET  /api/inventory/adjustments/
    POST /api/inventory/adjustments/

    ONLY ADMIN/SUPERUSER.

    Positive quantity:
        Adds stock.

    Negative quantity:
        Removes stock.
    """

    serializer_class = StockAdjustmentSerializer
    permission_classes = [IsManagerOrAdmin]

    def _require_admin(self):

        if not user_is_admin(
            self.request.user
        ):
            raise PermissionDenied(
                "Only an admin can make stock adjustments."
            )

    def get_queryset(self):

        self._require_admin()

        qs = StockAdjustment.objects.select_related(
            "product",
            "branch",
            "adjusted_by",
        )

        requested_branch = (
            self.request.query_params.get(
                "branch_id"
            )
        )

        if requested_branch:

            validate_branch_access(
                self.request,
                requested_branch,
            )

            qs = qs.filter(
                branch_id=int(requested_branch)
            )

        return qs

    @transaction.atomic
    def perform_create(self, serializer):

        self._require_admin()

        product = serializer.validated_data[
            "product"
        ]

        branch = serializer.validated_data[
            "branch"
        ]

        adjustment_quantity = (
            serializer.validated_data[
                "quantity"
            ]
        )

        stock, _ = (
            Stock.objects.select_for_update()
            .get_or_create(
                product=product,
                branch=branch,
            )
        )

        new_quantity = (
            stock.quantity
            + adjustment_quantity
        )

        if new_quantity < 0:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"Adjustment would make stock negative. "
                        f"Current stock: {stock.quantity}, "
                        f"adjustment: {adjustment_quantity}."
                    )
                }
            )

        stock.quantity = new_quantity

        stock.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

        serializer.save(
            adjusted_by=self.request.user
        )