# NetOps平台安装指南

本文档提供了NetOps平台的详细安装步骤，包括环境准备、后端安装、前端安装、配置说明和常见问题解决方案。

## 目录

- [环境要求](#环境要求)
- [环境准备](#环境准备)
  - [安装Python环境](#安装python环境)
  - [安装Node.js环境](#安装nodejs环境)
  - [安装PostgreSQL数据库](#安装postgresql数据库)
  - [安装Redis](#安装redis)
- [后端安装](#后端安装)
  - [获取代码](#获取代码)
  - [创建虚拟环境](#创建虚拟环境)
  - [安装依赖](#安装依赖)
  - [配置环境变量](#配置环境变量)
  - [初始化数据库](#初始化数据库)
  - [启动后端服务](#启动后端服务)
- [前端安装](#前端安装)
  - [安装依赖](#安装依赖-1)
  - [配置API地址](#配置api地址)
  - [启动前端服务](#启动前端服务)
- [访问应用](#访问应用)
- [配置说明](#配置说明)
  - [数据库配置](#数据库配置)
  - [Redis配置](#redis配置)
  - [JWT配置](#jwt配置)
  - [CORS配置](#cors配置)
- [常见问题解决方案](#常见问题解决方案)
  - [后端问题](#后端问题)
  - [前端问题](#前端问题)
  - [数据库问题](#数据库问题)
  - [Redis问题](#redis问题)

## 环境要求

- Python 3.9+
- Node.js v22.14.0+
- npm 10.9.2+
- PostgreSQL 13+
- Redis 6+

## 环境准备

### 安装Python环境

1. 下载并安装Python 3.9+
   - Windows: https://www.python.org/downloads/windows/
   - Linux: 使用包管理器安装，例如 `sudo apt install python3.9`
   - macOS: https://www.python.org/downloads/macos/ 或使用 Homebrew `brew install python@3.9`

2. 验证安装
   ```bash
   python --version
   pip --version
   ```

3. 确保Python和pip已添加到系统PATH环境变量
   - Windows: 安装时勾选"Add Python to PATH"选项
   - Linux/macOS: 通常自动添加到PATH

### 安装Node.js环境

1. 下载并安装Node.js v22.14.0+
   - 官方网站: https://nodejs.org/
   - 或使用版本管理工具如nvm: https://github.com/nvm-sh/nvm

2. 验证安装
   ```bash
   node --version
   npm --version
   ```

3. 确保Node.js和npm已添加到系统PATH环境变量
   - Windows: 安装程序通常会自动添加
   - Linux/macOS: 通常自动添加到PATH

### 安装PostgreSQL数据库

1. 下载并安装PostgreSQL 13+
   - 官方网站: https://www.postgresql.org/download/
   - Windows: 使用安装向导
   - Linux: `sudo apt install postgresql-13`
   - macOS: `brew install postgresql@13`

2. 启动PostgreSQL服务
   - Windows: 服务通常在安装后自动启动
   - Linux: `sudo systemctl start postgresql`
   - macOS: `brew services start postgresql@13`

3. 创建数据库和用户
   ```sql
   CREATE DATABASE netops;
   CREATE USER amber WITH PASSWORD 'amberman@2025!';
   GRANT ALL PRIVILEGES ON DATABASE netops TO amber;
   ```

   执行上述SQL的步骤:
   - Windows: 使用pgAdmin或命令行工具psql
   - Linux/macOS: 
     ```bash
     sudo -u postgres psql
     # 然后执行上述SQL命令
     ```

### 安装Redis

1. 下载并安装Redis 6+
   - 官方网站: https://redis.io/download/
   - Windows: 使用Windows子系统for Linux (WSL)或Windows版本的Redis
   - Linux: `sudo apt install redis-server`
   - macOS: `brew install redis`

2. 启动Redis服务
   - Windows: 按照安装程序指示启动服务
   - Linux: `sudo systemctl start redis`
   - macOS: `brew services start redis`

3. 或使用Docker安装Redis
   ```bash
   docker run --name netops-redis -p 6379:6379 -d redis
   ```

## 后端安装

### 获取代码

1. 克隆项目仓库
   ```bash
   git clone <repository-url>
   cd netops
   ```

2. 进入后端目录
   ```bash
   cd netops-backend
   ```

### 创建虚拟环境

1. 创建Python虚拟环境
   ```bash
   # Windows
   python -m venv venv
   
   # Linux/macOS
   python3 -m venv venv
   ```

2. 激活虚拟环境
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

### 安装依赖

1. 更新pip
   ```bash
   python -m pip install --upgrade pip
   ```

2. 安装项目依赖
   ```bash
   pip install -r requirements.txt
   ```

3. 如果安装过程中遇到问题，可以尝试逐个安装关键依赖
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary redis python-jose[cryptography] passlib[bcrypt] python-multipart
   ```

### 配置环境变量

1. 创建环境变量文件
   - 复制示例文件: `cp .env.example .env`
   - 或手动创建.env文件

2. 配置数据库连接
   ```
   DATABASE_URL=postgresql://amber:amberman@2025!@172.23.142.197:5432/netops
   ```

3. 配置Redis连接
   ```
   REDIS_URL=redis://172.23.142.197:6379/0
   ```

4. 配置JWT密钥
   ```
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

### 初始化数据库

1. 运行数据库初始化脚本
   ```bash
   python init_db.py
   ```

2. 或手动执行数据库迁移
   ```bash
   alembic upgrade head
   ```

### 启动后端服务

1. 使用uvicorn启动FastAPI服务
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. 启动Celery Worker（可选，用于后台任务）
   ```bash
   python -m celery -A tasks worker --loglevel=info
   ```

3. 启动Celery Beat（可选，用于定时任务）
   ```bash
   python -m celery -A tasks beat --loglevel=info
   ```

## 前端安装

1. 进入前端目录
   ```bash
   cd netops-frontend
   ```

### 安装依赖

1. 安装npm依赖
   ```bash
   npm install
   ```

2. 如果npm命令遇到问题，可以使用完整路径
   ```bash
   # Windows示例
   D:\Programs\Nodejs\npm.cmd install
   ```

3. 或使用yarn（如果已安装）
   ```bash
   yarn install
   ```

### 配置API地址

1. 创建或编辑.env文件
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

2. 或在src/utils/api.ts中修改API基础URL

### 启动前端服务

1. 启动开发服务器
   ```bash
   npm start
   ```

2. 如果npm命令遇到问题，可以使用完整路径
   ```bash
   # Windows示例
   D:\Programs\Nodejs\npm.cmd start
   ```

3. 或使用yarn
   ```bash
   yarn start
   ```

## 访问应用

- 前端界面：http://localhost:3000
- 后端API文档：http://localhost:8000/docs
- 后端API文档（ReDoc版）：http://localhost:8000/redoc

默认登录信息:
- 用户名: admin
- 密码: admin123

## 配置说明

### 数据库配置

默认数据库配置:
- 数据库: PostgreSQL
- 数据库名: netops
- 用户名: amber
- 密码: amberman@2025!
- 地址: 172.23.142.197:5432

可以通过环境变量修改数据库配置:
```bash
# Windows
set DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# Linux/macOS
export DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

### Redis配置

默认Redis配置:
- 地址: 172.23.142.197:6379

可以通过环境变量修改Redis配置:
```bash
# Windows
set REDIS_URL=redis://localhost:6379/0

# Linux/macOS
export REDIS_URL=redis://localhost:6379/0
```

### JWT配置

JWT配置用于用户认证和会话管理:
```
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

建议在生产环境中使用强随机密钥:
```bash
# 生成随机密钥
openssl rand -hex 32
```

### CORS配置

CORS配置用于控制哪些域名可以访问API:
```
CORS_ORIGINS=http://localhost:3000,https://example.com
```

在生产环境中，应该限制为前端应用的域名。

## 常见问题解决方案

### 后端问题

#### 数据库连接问题

如果遇到PostgreSQL连接问题，请检查以下几点:

1. 确保PostgreSQL服务正在运行
   ```bash
   # Windows
   net start postgresql
   
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   ```

2. 检查数据库连接字符串中的特殊字符是否正确编码
   - 特殊字符如@、:、/等需要正确编码
   - 密码中的特殊字符可能需要URL编码

3. 验证用户名和密码是否正确
   ```bash
   # 尝试连接数据库
   psql -h localhost -U amber -d netops
   ```

4. 确认数据库名称是否存在
   ```bash
   # 列出所有数据库
   psql -h localhost -U postgres -c "\l"
   ```

#### 依赖安装问题

如果安装依赖时遇到问题，可以尝试:

1. 更新pip到最新版本
   ```bash
   python -m pip install --upgrade pip
   ```

2. 逐个安装关键依赖
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary redis
   ```

3. 如果psycopg2安装失败，可以尝试使用二进制版本
   ```bash
   pip install psycopg2-binary
   ```

4. 如果prefect安装失败，可以注释掉requirements.txt中的相关行

#### 命令找不到问题

如果遇到"命令找不到"的错误，请使用Python模块方式运行命令:

- 使用 `python -m uvicorn` 代替 `uvicorn`
- 使用 `python -m celery` 代替 `celery`

### 前端问题

#### npm权限问题

如果遇到npm权限问题（EPERM, EBUSY等错误），可以尝试:

1. 以管理员身份运行命令提示符或PowerShell

2. 修改npm缓存目录
   ```bash
   npm config set cache "D:\网络自动化\npm-cache"
   ```

3. 使用`--no-cache`选项
   ```bash
   npm --no-cache install
   ```

4. 清除npm缓存
   ```bash
   npm cache clean --force
   ```

#### react-scripts找不到问题

如果遇到"react-scripts不是内部或外部命令"的错误，可以尝试:

1. 手动安装react-scripts
   ```bash
   npm install --save react-scripts
   ```

2. 使用npx直接运行
   ```bash
   npx react-scripts start
   ```

3. 检查node_modules目录是否存在
   ```bash
   # 如果不存在，重新安装依赖
   rm -rf node_modules
   npm install
   ```

### 数据库问题

#### 数据库迁移问题

如果遇到数据库迁移问题，可以尝试:

1. 重置迁移
   ```bash
   alembic downgrade base
   alemic upgrade head
   ```

2. 手动创建表
   ```bash
   python -c "from database.models import Base; from main import engine; Base.metadata.create_all(bind=engine)"
   ```

#### 数据库权限问题

如果遇到数据库权限问题，可以尝试:

1. 确保用户有足够的权限
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE netops TO amber;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO amber;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO amber;
   ```

2. 检查pg_hba.conf文件中的认证方法

### Redis问题

#### Redis连接问题

如果遇到Redis连接问题，可以尝试:

1. 确保Redis服务正在运行
   ```bash
   # Windows
   redis-cli ping
   
   # Linux
   sudo systemctl status redis
   
   # macOS
   brew services list
   ```

2. 检查Redis连接字符串
   ```
   redis://host:port/db
   ```

3. 如果使用密码认证，确保连接字符串包含密码
   ```
   redis://:password@host:port/db
   ```

4. 如果使用Docker，确保端口映射正确
   ```bash
   docker ps
   ```

## 更多帮助

如果您在安装过程中遇到任何问题，请参考以下资源:

1. 项目文档: [README.md](README.md)
2. 项目Wiki: [Wiki页面](https://github.com/your-repo/wiki)
3. 提交Issue: [Issues页面](https://github.com/your-repo/issues)
4. 联系开发团队: dev-team@example.com

# NetOps 网络自动化平台安装说明

## 项目结构
```
netops/
├── netops-backend/    # 后端服务
└── netops-frontend/   # 前端应用
```

## 后端服务安装说明

### 1. 环境要求
- Python 3.8+
- SQLite3
- pip

### 2. 安装步骤

1. 克隆代码库：
```bash
git clone <repository_url>
cd netops-backend
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 数据库初始化（两种方式）：

#### 方式一：使用数据库备份（推荐）
1. 将 `database_backups` 目录下的最新备份文件复制到服务器
2. 执行恢复脚本：
```bash
python restore_database.py database_backups/netops_backup_*.sql
```

#### 方式二：使用 Alembic 迁移
1. 执行数据库迁移：
```bash
alembic upgrade head
```

### 3. 启动服务
```bash
python main.py
```

## 前端应用安装说明

### 1. 环境要求
- Node.js 16+
- npm 8+ 或 yarn 1.22+

### 2. 安装步骤

1. 进入前端目录：
```bash
cd netops-frontend
```

2. 安装依赖：
```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

3. 开发环境运行：
```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

4. 生产环境构建：
```bash
# 使用 npm
npm run build

# 或使用 yarn
yarn build
```

5. 生产环境预览：
```bash
# 使用 npm
npm run preview

# 或使用 yarn
yarn preview
```

### 3. 部署说明
1. 执行构建命令生成 dist 目录
2. 将 dist 目录下的文件部署到 Web 服务器（如 Nginx）
3. 配置 Web 服务器反向代理到后端服务

## 数据库管理

### 备份数据库
```bash
python backup_database.py
```
备份文件将保存在 `database_backups` 目录下，文件名格式为 `netops_backup_YYYYMMDD_HHMMSS.sql`

### 恢复数据库
```bash
python restore_database.py <备份文件路径>
```

## 注意事项
1. 首次安装建议使用数据库备份方式，可以快速完成部署
2. 定期执行数据库备份，以防数据丢失
3. 恢复数据库前请确保已停止服务
4. 建议在恢复数据库前先备份现有数据
5. 前端开发时注意配置正确的后端服务地址
6. 生产环境部署时注意配置正确的环境变量

## 常见问题
1. 如果遇到数据库权限问题，请确保当前用户对数据库目录有写入权限
2. 如果恢复失败，请检查备份文件是否完整
3. 如果遇到编码问题，请确保系统支持 UTF-8 编码
4. 如果前端构建失败，请检查 Node.js 版本是否符合要求
5. 如果前端访问后端 API 失败，请检查跨域配置是否正确

## 技术支持
如有问题，请联系系统管理员或提交 Issue。 