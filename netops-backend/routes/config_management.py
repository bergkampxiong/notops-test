from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.session import get_db
from services.config_management_service import ConfigManagementService
from schemas.config_management import ConfigFile, ConfigFileCreate, ConfigFileUpdate
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/config",
    tags=["config"],
    responses={404: {"description": "Not found"}},
)

@router.get("/files", response_model=List[ConfigFile])
def get_configs(
    db: Session = Depends(get_db)
):
    try:
        service = ConfigManagementService(db)
        return service.get_configs()
    except Exception as e:
        logger.error(f"Error getting configs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{config_id}", response_model=ConfigFile)
def get_config(
    config_id: int,
    db: Session = Depends(get_db)
):
    try:
        service = ConfigManagementService(db)
        config = service.get_config(config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Config not found")
        return config
    except Exception as e:
        logger.error(f"Error getting config {config_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/files", response_model=ConfigFile)
def create_config(
    config: ConfigFileCreate,
    db: Session = Depends(get_db)
):
    try:
        service = ConfigManagementService(db)
        # 这里使用系统用户ID，实际项目中应该从认证中间件获取
        user_id = "system"
        return service.create_config(config, user_id)
    except Exception as e:
        logger.error(f"Error creating config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/files/{config_id}", response_model=ConfigFile)
def update_config(
    config_id: int,
    config: ConfigFileUpdate,
    db: Session = Depends(get_db)
):
    try:
        service = ConfigManagementService(db)
        updated_config = service.update_config(config_id, config)
        if not updated_config:
            raise HTTPException(status_code=404, detail="Config not found")
        return updated_config
    except Exception as e:
        logger.error(f"Error updating config {config_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/files/{config_id}")
def delete_config(
    config_id: int,
    db: Session = Depends(get_db)
):
    try:
        service = ConfigManagementService(db)
        if not service.delete_config(config_id):
            raise HTTPException(status_code=404, detail="Config not found")
        return {"message": "Config deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting config {config_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 