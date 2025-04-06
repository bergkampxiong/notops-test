import os
from typing import Dict
from sqlalchemy.engine.url import URL

# 数据库配置
DATABASE_CONFIG = {
    "host": "172.18.40.80",
    "port": 5432,
    "database": "netops",
    "user": "amber",
    "password": "amberman@2025!",
}

# Redis配置
REDIS_CONFIG = {
    "host": "172.18.40.80",
    "port": 6379,
    "db": 0,
}

# 构建数据库URL
def get_database_url(db_type="main"):
    """获取数据库连接URL"""
    if db_type == "cmdb":
        # 使用netops数据库，但使用不同的schema
        return URL.create(
            "postgresql",
            username=DATABASE_CONFIG["user"],
            password=DATABASE_CONFIG["password"],
            host=DATABASE_CONFIG["host"],
            port=DATABASE_CONFIG["port"],
            database=DATABASE_CONFIG["database"],
            query={"options": "-c search_path=cmdb"}
        )
    else:
        return URL.create(
            "postgresql",
            username=DATABASE_CONFIG["user"],
            password=DATABASE_CONFIG["password"],
            host=DATABASE_CONFIG["host"],
            port=DATABASE_CONFIG["port"],
            database=DATABASE_CONFIG["database"]
        )

# 构建Redis URL
def get_redis_url(db: int = 0) -> str:
    """构建Redis连接URL"""
    config = REDIS_CONFIG.copy()
    config["db"] = db
    return f"redis://{config['host']}:{config['port']}/{config['db']}"

# 导出环境变量
os.environ["DATABASE_URL"] = str(get_database_url())
os.environ["CMDB_DATABASE_URL"] = str(get_database_url("cmdb"))
os.environ["REDIS_URL"] = get_redis_url()

# 打印数据库连接信息（不包含密码）
print(f"主数据库连接: postgresql://{DATABASE_CONFIG['user']}:***@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}")
print(f"CMDB数据库连接: postgresql://{DATABASE_CONFIG['user']}:***@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/cmdb") 