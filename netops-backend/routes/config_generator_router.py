from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from services.config_generator_service import ConfigGeneratorService
from schemas.config_management import ConfigFile
from database.session import get_db

router = APIRouter()

@router.get("/templates", response_model=List[ConfigFile])
def get_jinja2_templates(
    db: Session = Depends(get_db)
):
    """获取所有jinja2类型的模板"""
    service = ConfigGeneratorService(db)
    return service.get_jinja2_templates()

@router.get("/templates-jobs", response_model=List[ConfigFile])
def get_job_templates(
    db: Session = Depends(get_db)
):
    """获取所有作业类型的模板"""
    service = ConfigGeneratorService(db)
    return service.get_job_templates() 