from fastapi import APIRouter
from routes.device.category import router as category_router
from routes.device.credential import router as credential_router

router = APIRouter()

# 包含子路由
router.include_router(category_router, prefix="/category", tags=["device-category"])
router.include_router(credential_router, prefix="/credential", tags=["credential-management"]) 