from fastapi import APIRouter

from app.api.routes import auth, dashboard, health, inventory, me, products, sales, shifts, staff, stores

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(stores.router, prefix="/stores", tags=["stores"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(shifts.router, prefix="/shifts", tags=["shifts"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(staff.router, prefix="/staff", tags=["staff"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
