from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BranchViewSet, ProductViewSet, RestockView, StockListView

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("branches", BranchViewSet, basename="branch")

urlpatterns = [
    # GET /api/inventory/  — stock levels, matches getInventory(branchId)
    path("", StockListView.as_view(), name="stock-list"),
    # POST /api/inventory/restock/
    path("restock/", RestockView.as_view(), name="restock"),
    *router.urls,
]
