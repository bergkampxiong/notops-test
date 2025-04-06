from fastapi import APIRouter
from routes.device.category import router as category_router
from routes.device.credential import router as credential_router
from routes.device.connections import router as connections_router

router = APIRouter()

# 包含子路由
router.include_router(category_router, prefix="/category", tags=["device-category"])
router.include_router(credential_router, prefix="/credential", tags=["credential-management"])
router.include_router(connections_router, prefix="/connections", tags=["device-connections"]) 