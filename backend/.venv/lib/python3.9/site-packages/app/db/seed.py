from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.retail import ActivityEvent, InventoryBalance, Product, Sale, SaleItem, Shift, Store
from app.models.user import User, UserStoreAssignment


def seed_database(db: Session) -> None:
    if db.query(Store).first():
        return

    old_town = Store(id="store-old-town", name="Old Town Cannabis Shop", address="Rua 5 de Outubro 42, Albufeira")
    beach = Store(id="store-beach", name="Beach Cannabis Shop", address="Avenida da Liberdade 18, Albufeira")
    db.add_all([old_town, beach])

    admin = User(
        id="user-admin",
        telegram_id="100000001",
        full_name="Retail Admin",
        username="retail_admin",
        role="admin",
    )
    seller_old_town = User(
        id="user-seller-1",
        telegram_id="100000002",
        full_name="John Doe",
        username="john_oldtown",
        role="seller",
    )
    seller_beach = User(
        id="user-seller-2",
        telegram_id="100000003",
        full_name="Jane Smith",
        username="jane_beach",
        role="seller",
    )
    db.add_all([admin, seller_old_town, seller_beach])

    db.add_all(
        [
            UserStoreAssignment(user=admin, store=old_town),
            UserStoreAssignment(user=admin, store=beach),
            UserStoreAssignment(user=seller_old_town, store=old_town),
            UserStoreAssignment(user=seller_beach, store=beach),
        ]
    )

    products = [
        Product(id="prod-1", name="Herbal Oil 10ml", barcode="810101", default_price=Decimal("24.90")),
        Product(id="prod-2", name="Botanical Balm 30g", barcode="810102", default_price=Decimal("19.50")),
        Product(id="prod-3", name="Relax Gummies 20pcs", barcode="810103", default_price=Decimal("21.00")),
        Product(id="prod-4", name="Aroma Cartridge", barcode="810104", default_price=Decimal("29.90")),
        Product(id="prod-5", name="Herbal Blend 1g", barcode="810105", default_price=Decimal("8.90")),
        Product(id="prod-6", name="Herbal Blend 3g", barcode="810106", default_price=Decimal("22.90")),
        Product(id="prod-7", name="Pre-Rolled Herbal Stick", barcode="810107", default_price=Decimal("6.50")),
        Product(id="prod-8", name="Starter Kit", barcode="810108", default_price=Decimal("39.00")),
        Product(id="prod-9", name="Premium Flower Pack", barcode="810109", default_price=Decimal("27.50")),
        Product(id="prod-10", name="Terpene Drops", barcode="810110", default_price=Decimal("17.90")),
    ]
    db.add_all(products)
    db.flush()

    inventory_rows = [
        ("store-old-town", "prod-1", 18), ("store-beach", "prod-1", 12),
        ("store-old-town", "prod-2", 14), ("store-beach", "prod-2", 9),
        ("store-old-town", "prod-3", 22), ("store-beach", "prod-3", 16),
        ("store-old-town", "prod-4", 11), ("store-beach", "prod-4", 7),
        ("store-old-town", "prod-5", 40), ("store-beach", "prod-5", 28),
        ("store-old-town", "prod-6", 24), ("store-beach", "prod-6", 15),
        ("store-old-town", "prod-7", 35), ("store-beach", "prod-7", 20),
        ("store-old-town", "prod-8", 8), ("store-beach", "prod-8", 5),
        ("store-old-town", "prod-9", 13), ("store-beach", "prod-9", 10),
        ("store-old-town", "prod-10", 19), ("store-beach", "prod-10", 14),
    ]
    db.add_all(
        [
            InventoryBalance(store_id=store_id, product_id=product_id, quantity=quantity)
            for store_id, product_id, quantity in inventory_rows
        ]
    )

    now = datetime.utcnow()
    shift = Shift(
        id="shift-1",
        seller_id="user-seller-1",
        store_id="store-old-town",
        started_at=now - timedelta(hours=3, minutes=20),
        status="active",
    )
    db.add(shift)

    sale = Sale(
        id="sale-1",
        store_id="store-old-town",
        seller_id="user-seller-1",
        payment_method="card",
        total_amount=Decimal("54.80"),
        created_at=now - timedelta(hours=1, minutes=5),
    )
    db.add(sale)
    db.flush()

    db.add_all(
        [
            SaleItem(
                sale_id=sale.id,
                product_id="prod-1",
                quantity=1,
                base_price=Decimal("24.90"),
                sold_price=Decimal("24.90"),
                line_total=Decimal("24.90"),
            ),
            SaleItem(
                sale_id=sale.id,
                product_id="prod-7",
                quantity=2,
                base_price=Decimal("6.50"),
                sold_price=Decimal("6.50"),
                line_total=Decimal("13.00"),
            ),
            SaleItem(
                sale_id=sale.id,
                product_id="prod-2",
                quantity=1,
                base_price=Decimal("19.50"),
                sold_price=Decimal("16.90"),
                line_total=Decimal("16.90"),
            ),
        ]
    )

    db.add_all(
        [
            ActivityEvent(
                seller_id="user-seller-1",
                store_id="store-old-town",
                event_type="shift_start",
                title="Shift started",
                meta="Old Town Cannabis Shop",
                created_at=now - timedelta(hours=3, minutes=20),
            ),
            ActivityEvent(
                seller_id="user-seller-1",
                store_id="store-old-town",
                event_type="sale",
                title="Sale completed",
                meta="EUR 54.80",
                created_at=now - timedelta(hours=1, minutes=5),
            ),
        ]
    )

    db.commit()
