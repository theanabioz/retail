"""Initial retail schema

Revision ID: 20260417_000001
Revises:
Create Date: 2026-04-17 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260417_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stores",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("telegram_id", sa.String(length=32), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("telegram_id"),
    )
    op.create_index("ix_users_telegram_id", "users", ["telegram_id"])
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "products",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("barcode", sa.String(length=64), nullable=False),
        sa.Column("default_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("barcode"),
    )
    op.create_index("ix_products_name", "products", ["name"])
    op.create_index("ix_products_barcode", "products", ["barcode"])

    op.create_table(
        "user_store_assignments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("store_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_store_assignments_user_id", "user_store_assignments", ["user_id"])
    op.create_index("ix_user_store_assignments_store_id", "user_store_assignments", ["store_id"])

    op.create_table(
        "inventory_balances",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("store_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("store_id", "product_id", name="uq_inventory_store_product"),
    )
    op.create_index("ix_inventory_balances_store_id", "inventory_balances", ["store_id"])
    op.create_index("ix_inventory_balances_product_id", "inventory_balances", ["product_id"])

    op.create_table(
        "sales",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("store_id", sa.String(length=36), nullable=False),
        sa.Column("seller_id", sa.String(length=36), nullable=False),
        sa.Column("payment_method", sa.String(length=32), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="completed"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_store_id", "sales", ["store_id"])
    op.create_index("ix_sales_seller_id", "sales", ["seller_id"])
    op.create_index("ix_sales_created_at", "sales", ["created_at"])

    op.create_table(
        "sale_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("sale_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("base_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("sold_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("line_total", sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sale_items_sale_id", "sale_items", ["sale_id"])
    op.create_index("ix_sale_items_product_id", "sale_items", ["product_id"])

    op.create_table(
        "shifts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("seller_id", sa.String(length=36), nullable=False),
        sa.Column("store_id", sa.String(length=36), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_shifts_seller_id", "shifts", ["seller_id"])
    op.create_index("ix_shifts_store_id", "shifts", ["store_id"])

    op.create_table(
        "shift_breaks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("shift_id", sa.String(length=36), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["shift_id"], ["shifts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_shift_breaks_shift_id", "shift_breaks", ["shift_id"])

    op.create_table(
        "activity_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("seller_id", sa.String(length=36), nullable=False),
        sa.Column("store_id", sa.String(length=36), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("meta", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_events_seller_id", "activity_events", ["seller_id"])
    op.create_index("ix_activity_events_store_id", "activity_events", ["store_id"])
    op.create_index("ix_activity_events_event_type", "activity_events", ["event_type"])
    op.create_index("ix_activity_events_created_at", "activity_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_activity_events_created_at", table_name="activity_events")
    op.drop_index("ix_activity_events_event_type", table_name="activity_events")
    op.drop_index("ix_activity_events_store_id", table_name="activity_events")
    op.drop_index("ix_activity_events_seller_id", table_name="activity_events")
    op.drop_table("activity_events")

    op.drop_index("ix_shift_breaks_shift_id", table_name="shift_breaks")
    op.drop_table("shift_breaks")

    op.drop_index("ix_shifts_store_id", table_name="shifts")
    op.drop_index("ix_shifts_seller_id", table_name="shifts")
    op.drop_table("shifts")

    op.drop_index("ix_sale_items_product_id", table_name="sale_items")
    op.drop_index("ix_sale_items_sale_id", table_name="sale_items")
    op.drop_table("sale_items")

    op.drop_index("ix_sales_created_at", table_name="sales")
    op.drop_index("ix_sales_seller_id", table_name="sales")
    op.drop_index("ix_sales_store_id", table_name="sales")
    op.drop_table("sales")

    op.drop_index("ix_inventory_balances_product_id", table_name="inventory_balances")
    op.drop_index("ix_inventory_balances_store_id", table_name="inventory_balances")
    op.drop_table("inventory_balances")

    op.drop_index("ix_user_store_assignments_store_id", table_name="user_store_assignments")
    op.drop_index("ix_user_store_assignments_user_id", table_name="user_store_assignments")
    op.drop_table("user_store_assignments")

    op.drop_index("ix_products_barcode", table_name="products")
    op.drop_index("ix_products_name", table_name="products")
    op.drop_table("products")

    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_telegram_id", table_name="users")
    op.drop_table("users")

    op.drop_table("stores")
