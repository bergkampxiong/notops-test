from fastapi import APIRouter
from .atomic_components import router as atomic_components_router

router = APIRouter()

# 包含子路由
router.include_router(atomic_components_router) 