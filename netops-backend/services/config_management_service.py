from typing import List, Optional
from sqlalchemy.orm import Session
from database.config_management_models import ConfigFile as DBConfigFile
from schemas.config_management import ConfigFileCreate, ConfigFileUpdate, ConfigFile
from datetime import datetime

class ConfigManagementService:
    def __init__(self, db: Session):
        self.db = db

    def get_configs(self) -> List[ConfigFile]:
        try:
            db_configs = self.db.query(DBConfigFile).all()
            return [self._convert_to_response_model(config) for config in db_configs]
        except Exception as e:
            raise Exception(f"获取配置列表失败: {str(e)}")

    def get_config(self, config_id: int) -> Optional[ConfigFile]:
        try:
            db_config = self.db.query(DBConfigFile).filter(DBConfigFile.id == config_id).first()
            if db_config:
                return self._convert_to_response_model(db_config)
            return None
        except Exception as e:
            raise Exception(f"获取配置失败: {str(e)}")

    def _get_db_config(self, config_id: int) -> Optional[DBConfigFile]:
        """获取数据库模型"""
        try:
            return self.db.query(DBConfigFile).filter(DBConfigFile.id == config_id).first()
        except Exception as e:
            raise Exception(f"获取数据库配置失败: {str(e)}")

    def create_config(self, config: ConfigFileCreate, user_id: str = "system") -> ConfigFile:
        try:
            now = datetime.utcnow()
            config_dict = config.dict()
            
            # 创建数据库模型
            db_config = DBConfigFile(
                name=config_dict['name'],
                type=config_dict['template_type'],
                content=config_dict['content'],
                description=config_dict.get('description'),
                created_at=now,
                updated_at=now
            )
            self.db.add(db_config)
            self.db.commit()
            self.db.refresh(db_config)
            
            # 确保返回的数据包含所有必需字段
            return ConfigFile(
                id=str(db_config.id),
                name=db_config.name,
                template_type=db_config.type,
                content=db_config.content,
                description=db_config.description,
                status=config_dict.get('status', 'draft'),
                device_type=config_dict.get('device_type', 'default'),
                tags=config_dict.get('tags', []),
                created_at=db_config.created_at,
                updated_at=db_config.updated_at,
                created_by=user_id,
                updated_by=user_id
            )
        except Exception as e:
            self.db.rollback()
            raise Exception(f"创建配置失败: {str(e)}")

    def update_config(self, config_id: int, config: ConfigFileUpdate, user_id: str = "system") -> Optional[ConfigFile]:
        try:
            db_config = self._get_db_config(config_id)
            if db_config:
                # 将template_type映射到type字段，只保留数据库模型中存在的字段
                config_dict = config.dict()
                
                # 只更新数据库模型中存在的字段
                allowed_fields = ['name', 'type', 'content', 'description']
                for key, value in config_dict.items():
                    if key in allowed_fields:
                        if key == 'template_type':
                            setattr(db_config, 'type', value)
                        else:
                            setattr(db_config, key, value)
                db_config.updated_at = datetime.utcnow()
                self.db.commit()
                self.db.refresh(db_config)
                
                # 直接返回符合响应模型的数据
                return ConfigFile(
                    id=str(db_config.id),
                    name=db_config.name,
                    template_type=db_config.type,
                    content=db_config.content,
                    description=db_config.description,
                    status=config_dict.get('status', 'draft'),
                    device_type=config_dict.get('device_type', 'default'),
                    tags=config_dict.get('tags', []),
                    created_at=db_config.created_at,
                    updated_at=db_config.updated_at,
                    created_by=user_id,
                    updated_by=user_id
                )
            return None
        except Exception as e:
            self.db.rollback()
            raise Exception(f"更新配置失败: {str(e)}")

    def delete_config(self, config_id: int) -> bool:
        try:
            db_config = self._get_db_config(config_id)
            if db_config:
                self.db.delete(db_config)
                self.db.commit()
                return True
            return False
        except Exception as e:
            self.db.rollback()
            raise Exception(f"删除配置失败: {str(e)}")

    def _convert_to_response_model(self, db_config: DBConfigFile) -> ConfigFile:
        """将数据库模型转换为响应模型"""
        try:
            return ConfigFile(
                id=str(db_config.id),
                name=db_config.name,
                template_type=db_config.type,
                content=db_config.content,
                description=db_config.description,
                status="draft",
                device_type="default",
                tags=[],
                created_at=db_config.created_at,
                updated_at=db_config.updated_at,
                created_by="system",
                updated_by="system"
            )
        except Exception as e:
            raise Exception(f"转换响应模型失败: {str(e)}") 