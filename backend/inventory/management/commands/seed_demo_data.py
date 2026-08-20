from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from inventory.models import Branch, Product, Stock

User = get_user_model()

BRANCHES = ["Downtown", "Riverside", "Airport"]

PRODUCTS = [
    ("BEV-1042", "Espresso Beans 1kg", "Beverage", "18.50", 3, 10),
    ("BEV-2210", "Oat Milk 1L", "Beverage", "4.25", 0, 8),
    ("SUP-0031", "Paper Cups 12oz (x50)", "Supplies", "6.00", 6, 20),
    ("FOD-5501", "Almond Croissant", "Food", "3.75", 42, 15),
    ("FOD-5502", "Blueberry Muffin", "Food", "3.25", 31, 15),
    ("BEV-1050", "Whole Bean Decaf 1kg", "Beverage", "17.00", 25, 10),
]


class Command(BaseCommand):
    help = "Seeds demo branches, products, stock, and an admin user for local development."

    def handle(self, *args, **options):
        branches = {}
        for name in BRANCHES:
            branch, created = Branch.objects.get_or_create(name=name)
            branches[name] = branch
            self.stdout.write(f"{'Created' if created else 'Exists'} branch: {name}")

        main_branch = branches["Downtown"]

        for sku, name, category, price, qty, threshold in PRODUCTS:
            product, created = Product.objects.get_or_create(
                sku=sku, defaults={"name": name, "category": category, "price": price}
            )
            self.stdout.write(f"{'Created' if created else 'Exists'} product: {sku}")

            Stock.objects.update_or_create(
                product=product,
                branch=main_branch,
                defaults={"quantity": qty, "low_stock_threshold": threshold},
            )

        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                email="admin@example.com",
                password="ChangeMe123!",
                role=User.Role.ADMIN,
                branch=main_branch,
            )
            self.stdout.write(self.style.SUCCESS(
                "Created superuser 'admin' / 'ChangeMe123!' — change this password."
            ))
        else:
            self.stdout.write("Superuser 'admin' already exists.")

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
