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
   - 注意：CMDB数据库使用与netops相同的数据库，无需单独配置

5. 初始化数据库：
```bash
# 运行初始化脚本
python int_all_db.py
```

6. 启动后端服务：
```bash
# 启动API服务
python main.py

# 启动Celery Worker（后台任务）
celery -A tasks worker --loglevel=info

# 启动Celery Beat（定时任务）
celery -A tasks beat --loglevel=info
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

### 数据库初始化
系统使用统一的数据库初始化脚本，该脚本会：
1. 创建所有必要的数据库表
2. 初始化基础数据（设备类型、厂商、位置等）
3. 创建管理员账户

如需重新初始化数据库，请运行：
```bash
python int_all_db.py
```

## 常见问题

1. 数据库连接失败
   - 检查数据库服务器是否可访问
   - 验证数据库用户名和密码是否正确
   - 确认数据库名称是否存在

2. 初始化失败
   - 检查数据库用户是否有创建表的权限
   - 查看错误日志获取详细信息

3. 服务启动失败
   - 检查端口是否被占用
   - 确认所有依赖是否正确安装
   - 查看服务日志获取错误信息

## 技术支持
如有问题，请联系系统管理员或提交Issue。 