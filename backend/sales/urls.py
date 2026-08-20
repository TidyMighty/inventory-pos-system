from django.urls import path

from .views import SalesSummaryView, SaleListCreateView, TopProductsView

urlpatterns = [
    path("", SaleListCreateView.as_view(), name="sale-list-create"),
    path("reports/summary/", SalesSummaryView.as_view(), name="sales-summary"),
    path("reports/top-products/", TopProductsView.as_view(), name="sales-top-products"),
]
