from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from database.device_connection_models import DeviceConnection
from typing import List
from datetime import datetime

router = APIRouter(
    prefix="/api/rpa/atomic-components",
    tags=["rpa-atomic-components"]
)

@router.get("/device-connections", response_model=List[dict])
async def get_device_connections(
    db: Session = Depends(get_db)
):
    """获取所有设备连接配置"""
    try:
        connections = db.query(DeviceConnection).all()
        # 构造响应数据
        response_data = []
        for conn in connections:
            response_data.append({
                "id": conn.id,
                "name": conn.name,
                "device_type": conn.device_type,
                "credential_id": str(conn.credential_id),
                "port": conn.port,
                "enable_secret": conn.enable_secret,
                "global_delay_factor": conn.global_delay_factor,
                "auth_timeout": conn.auth_timeout,
                "banner_timeout": conn.banner_timeout,
                "fast_cli": conn.fast_cli,
                "session_timeout": conn.session_timeout,
                "conn_timeout": conn.conn_timeout,
                "keepalive": conn.keepalive,
                "verbose": conn.verbose,
                "description": conn.description,
                "created_at": conn.created_at or datetime.now(),
                "updated_at": conn.updated_at or datetime.now(),
                "is_active": conn.is_active,
                "username": None,
                "password": None
            })
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取设备连接配置列表失败: {str(e)}"
        ) 