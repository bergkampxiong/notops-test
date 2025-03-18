# NetOps平台

NetOps平台是一个网络运维自动化平台，集成了自动化RPA、AIOPS、凭证管理和统一门户功能，旨在提高网络运维效率和可靠性。

## 功能模块

- **自动化RPA**: 自动化任务管理和执行
- **AIOPS**: AI运维，包括异常检测、根因分析和容量规划
- **凭证管理**: 统一管理各类设备和系统的凭证，支持多种凭证类型
- **统一门户**: 统一的用户界面和权限管理

## 项目架构

本项目采用前后端分离架构：

### 前端技术栈

- React 18
- TypeScript 4.9
- Ant Design 5.14
- React Router 6.22
- Axios 1.6
- Recharts 2.12

### 后端技术栈

- FastAPI 0.115.11
- SQLAlchemy 2.0.38
- Celery 5.4.0
- Redis (Celery任务队列)

## 目录结构

```
netops/
├── netops-frontend/        # 前端项目
│   ├── public/             # 静态资源
│   ├── src/                # 源代码
│   │   ├── components/     # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── utils/          # 工具函数
│   │   ├── assets/         # 资源文件
│   │   ├── styles/         # 样式文件
│   │   ├── App.tsx         # 应用入口
│   │   └── index.tsx       # 渲染入口
│   ├── package.json        # 依赖配置
│   └── tsconfig.json       # TypeScript配置
├── netops-backend/         # 后端项目
│   ├── main.py             # FastAPI应用主文件
│   ├── tasks.py            # Celery任务定义
│   ├── routes/             # API路由
│   │   ├── device/         # 设备管理API
│   │   │   ├── credential.py # 凭证管理API
│   │   │   └── category.py   # 设备分类API
│   ├── database/           # 数据库模型
│   │   └── category_models.py # 设备分类和凭证模型
│   └── requirements.txt    # 项目依赖
└── README.md               # 项目总体说明（本文件）
```

## 凭证管理功能

NetOps平台提供了强大的凭证管理功能，支持多种类型的凭证：

1. **SSH密码凭证**：用于SSH连接，支持用户名/密码，并可配置Cisco设备的enable密码
2. **API凭证**：用于API集成，支持API Key/Secret认证方式
3. **SSH密钥凭证**：基于密钥的SSH认证，支持私钥和私钥密码

凭证管理功能特点：
- 安全存储各类凭证信息
- 支持筛选和搜索功能
- 直观的用户界面，易于使用
- 与设备分类共用数据表结构
- 完整的CRUD操作支持

## 环境要求

- Python 3.9+
- Node.js v22.14.0
- npm 10.9.2
- PostgreSQL 13+
- Redis 6+

## 快速开始

### 1. 启动后端服务

```bash
# 进入后端目录
cd netops-backend

# 安装依赖
pip install -r requirements.txt

# 启动FastAPI服务（推荐方式）
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 启动Celery Worker（可选，用于后台任务）
python -m celery -A tasks worker --loglevel=info

# 启动Celery Beat（可选，用于定时任务）
python -m celery -A tasks beat --loglevel=info
```

### 2. 启动前端服务

```bash
# 进入前端目录
cd netops-frontend

# 安装依赖（使用完整路径，避免命令找不到问题）
D:\Programs\Nodejs\npm.cmd install

# 启动开发服务器
D:\Programs\Nodejs\npm.cmd start
```

如果npm命令遇到问题，可以使用Python的HTTP服务器作为替代方案：

```bash
# 进入前端目录
cd netops-frontend

# 启动Python HTTP服务器
python -m http.server 3000
```

### 3. 访问应用

- 前端界面：http://localhost:3000
- 后端API文档：http://localhost:8000/docs
- 后端API文档（ReDoc版）：http://localhost:8000/redoc

## 登录信息

开发环境测试账号:

- 用户名: admin
- 密码: admin123

## 数据库信息

- 数据库: PostgreSQL
- 数据库名: netops
- 用户名: amber
- 密码: amberman@2025!
- 地址: 172.23.142.197:5432

## Redis信息

- 容器名: netops-redis
- 地址: 172.23.142.197:6379

## 故障排除

### 后端问题

#### 数据库连接问题

如果遇到PostgreSQL连接问题，请检查以下几点：

1. 确保PostgreSQL服务正在运行
2. 检查数据库连接字符串中的特殊字符是否正确编码
3. 验证用户名和密码是否正确
4. 确认数据库名称是否存在

#### 依赖安装问题

如果安装依赖时遇到问题，可以尝试：

1. 更新pip到最新版本: `python -m pip install --upgrade pip`
2. 逐个安装关键依赖: `pip install fastapi uvicorn sqlalchemy psycopg2-binary redis`
3. 如果prefect安装失败，可以注释掉requirements.txt中的相关行

#### 命令找不到问题

如果遇到"命令找不到"的错误，请使用Python模块方式运行命令：

- 使用 `python -m uvicorn` 代替 `uvicorn`
- 使用 `python -m celery` 代替 `celery`

### 前端问题

#### npm权限问题

如果遇到npm权限问题（EPERM, EBUSY等错误），可以尝试：

1. 以管理员身份运行命令提示符或PowerShell
2. 修改npm缓存目录：`npm config set cache "D:\网络自动化\npm-cache"`
3. 使用`--no-cache`选项：`npm --no-cache install`

#### react-scripts找不到问题

如果遇到"react-scripts不是内部或外部命令"的错误，可以尝试：

1. 手动安装react-scripts：`npm install --save react-scripts`
2. 使用npx直接运行：`npx react-scripts start`
3. 检查node_modules目录是否存在

#### 替代方案

如果npm命令持续出现问题，可以使用Python的HTTP服务器作为临时解决方案：

```bash
python -m http.server 3000
```

这将在3000端口提供静态文件服务，但不会执行React的开发服务器功能。

## 开发注意事项

### 后端开发

1. 所有敏感信息（如数据库密码、JWT密钥等）应该通过环境变量配置，而不是硬编码在代码中
2. 在生产环境中，应该限制CORS的origins为前端域名
3. 在生产环境中，应该使用更安全的密码存储方式和更长的JWT密钥

### 前端开发

1. 确保Node.js和npm正确安装并添加到PATH环境变量
2. 前端代理配置已设置为连接到后端API（http://localhost:8000）
3. 在生产环境中，应该使用环境变量来配置API地址

## 许可证

本项目采用MIT许可证。 