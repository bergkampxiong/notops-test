from typing import List, Optional
from sqlalchemy.orm import Session
from database.config_management_models import ConfigFile
from schemas.config_management import ConfigFileCreate, ConfigFileUpdate

class ConfigManagementService:
    def __init__(self, db: Session):
        self.db = db

    def get_configs(self) -> List[ConfigFile]:
        return self.db.query(ConfigFile).all()

    def get_config(self, config_id: int) -> Optional[ConfigFile]:
        return self.db.query(ConfigFile).filter(ConfigFile.id == config_id).first()

    def create_config(self, config: ConfigFileCreate) -> ConfigFile:
        db_config = ConfigFile(**config.dict())
        self.db.add(db_config)
        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def update_config(self, config_id: int, config: ConfigFileUpdate) -> Optional[ConfigFile]:
        db_config = self.get_config(config_id)
        if db_config:
            for key, value in config.dict().items():
                setattr(db_config, key, value)
            self.db.commit()
            self.db.refresh(db_config)
        return db_config

    def delete_config(self, config_id: int) -> bool:
        db_config = self.get_config(config_id)
        if db_config:
            self.db.delete(db_config)
            self.db.commit()
            return True
        return False 