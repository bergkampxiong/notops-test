# NetOps 网络自动化平台安装说明

## 环境要求
- Python 3.9+
- Node.js v22.14.0+
- PostgreSQL 13+
- Redis 6+

## 快速安装步骤

### 1. 后端安装

1. 克隆代码并进入后端目录：
```bash
git clone <repository_url>
cd netops-backend
```

2. 创建并激活虚拟环境：
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 配置数据库连接：
   - 打开 `database/config.py` 文件
   - 修改数据库和Redis连接信息：
     ```python
     DATABASE_CONFIG = {
         "host": "172.18.40.80",  # 数据库服务器地址
         "port": 5432,            # 数据库端口
         "database": "netops",    # 数据库名称
         "user": "amber",         # 数据库用户名
         "password": "amberman@2025!",  # 数据库密码
     }

     REDIS_CONFIG = {
         "host": "172.18.40.80",  # Redis服务器地址
         "port": 6379,            # Redis端口
         "db": 0,                 # Redis数据库编号
     }
     ```

5. 初始化数据库：
```bash
# 使用数据库备份还原（推荐）
python restore_database.py database_backups/netops_backup_*.sql
```

6. 启动后端服务：
```bash
# 启动API服务
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# 启动Celery Worker（后台任务）
python -m celery -A tasks worker --loglevel=info

# 启动Celery Beat（定时任务）
python -m celery -A tasks beat --loglevel=info
```

### 2. 前端安装

1. 进入前端目录：
```bash
cd netops-frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
```

## 访问系统
- 前端界面：http://localhost:3000
- 后端API文档：http://localhost:8000/docs

默认登录信息：
- 用户名：admin
- 密码：admin123

## 数据库管理

### 备份数据库
```bash
python backup_database.py
```
备份文件保存在 `database_backups` 目录下

### 恢复数据库
```bash
python restore_database.py <备份文件路径>
```

## 常见问题

1. 数据库连接失败
   - 检查数据库服务是否运行
   - 验证数据库连接信息是否正确
   - 确认数据库用户权限

2. Redis连接失败
   - 检查Redis服务是否运行
   - 验证Redis连接信息是否正确

3. 前端构建失败
   - 检查Node.js版本是否符合要求
   - 清除node_modules后重新安装依赖

## 技术支持
如有问题，请联系系统管理员或提交Issue。 