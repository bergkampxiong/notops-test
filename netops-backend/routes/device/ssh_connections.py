from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from database.session import get_db
from database.device_connection_models import DeviceConnection
from schemas.device_connection import SSHConnectionCreate, SSHConnectionUpdate, SSHConnectionResponse

# 配置日志
logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter(
    prefix="/api/device/connections",
    tags=["device-connections"]
)

@router.get("/", response_model=List[SSHConnectionResponse])
async def get_device_connections(
    db: Session = Depends(get_db)
):
    """获取所有SSH连接配置"""
    try:
        connections = db.query(DeviceConnection).all()
        return connections
    except Exception as e:
        logger.error(f"获取SSH连接配置列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取SSH连接配置列表失败: {str(e)}"
        )

@router.post("/", response_model=SSHConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_device_connection(
    connection: SSHConnectionCreate,
    db: Session = Depends(get_db)
):
    """创建新的SSH连接配置"""
    try:
        # 将device_type映射到system_type
        db_connection = DeviceConnection(
            name=connection.name,
            device_type=connection.device_type,
            credential_id=str(connection.credential_id),  # 转换为字符串
            port=connection.port,
            enable_secret=connection.enable_secret,
            global_delay_factor=connection.global_delay_factor,
            auth_timeout=connection.auth_timeout,
            banner_timeout=connection.banner_timeout,
            fast_cli=connection.fast_cli,
            session_timeout=connection.session_timeout,
            conn_timeout=connection.conn_timeout,
            keepalive=connection.keepalive,
            verbose=connection.verbose,
            description=connection.description,
            is_active=True
        )
        db.add(db_connection)
        db.commit()
        db.refresh(db_connection)
        
        # 构造响应数据
        response_data = {
            "id": db_connection.id,
            "name": db_connection.name,
            "device_type": db_connection.device_type,
            "credential_id": db_connection.credential_id,
            "port": db_connection.port,
            "enable_secret": db_connection.enable_secret,
            "global_delay_factor": db_connection.global_delay_factor,
            "auth_timeout": db_connection.auth_timeout,
            "banner_timeout": db_connection.banner_timeout,
            "fast_cli": db_connection.fast_cli,
            "session_timeout": db_connection.session_timeout,
            "conn_timeout": db_connection.conn_timeout,
            "keepalive": db_connection.keepalive,
            "verbose": db_connection.verbose,
            "description": db_connection.description,
            "created_at": db_connection.created_at,
            "updated_at": db_connection.updated_at,
            "is_active": db_connection.is_active,
            "username": None,  # 这些字段从凭证中获取
            "password": None   # 这些字段从凭证中获取
        }
        return response_data
    except Exception as e:
        logger.error(f"创建设备连接配置失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建设备连接配置失败: {str(e)}"
        )

@router.get("/{connection_id}", response_model=SSHConnectionResponse)
async def get_device_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """获取单个SSH连接配置"""
    try:
        connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SSH连接配置 {connection_id} 不存在"
            )
        return connection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取SSH连接配置失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取SSH连接配置失败: {str(e)}"
        )

@router.put("/{connection_id}", response_model=SSHConnectionResponse)
async def update_device_connection(
    connection_id: int,
    connection_update: SSHConnectionUpdate,
    db: Session = Depends(get_db)
):
    """更新SSH连接配置"""
    try:
        db_connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
        if not db_connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SSH连接配置 {connection_id} 不存在"
            )
        
        # 更新字段
        update_data = connection_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_connection, field, value)
        
        db.commit()
        db.refresh(db_connection)
        return db_connection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新SSH连接配置失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新SSH连接配置失败: {str(e)}"
        )

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """删除SSH连接配置"""
    try:
        db_connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
        if not db_connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SSH连接配置 {connection_id} 不存在"
            )
        
        db.delete(db_connection)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除SSH连接配置失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除SSH连接配置失败: {str(e)}"
        ) 