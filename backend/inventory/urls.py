from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BranchViewSet,
    ProductViewSet,
    StockAdjustmentListCreateView,
    StockListView,
    StockReceiptListCreateView,
)

router = DefaultRouter()

router.register(
    "products",
    ProductViewSet,
    basename="product",
)

router.register(
    "branches",
    BranchViewSet,
    basename="branch",
)

urlpatterns = [
    # Stock levels
    # GET /api/inventory/
    path(
        "",
        StockListView.as_view(),
        name="stock-list",
    ),

    # Stock receiving
    # GET/POST /api/inventory/receipts/
    path(
        "receipts/",
        StockReceiptListCreateView.as_view(),
        name="stock-receipts",
    ),

    # Stock adjustments
    # GET/POST /api/inventory/adjustments/
    path(
        "adjustments/",
        StockAdjustmentListCreateView.as_view(),
        name="stock-adjustments",
    ),

    *router.urls,
]