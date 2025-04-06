# NetOps 网络自动化平台

## 项目简介
NetOps是一个现代化的网络自动化平台，提供网络设备管理、配置管理、自动化运维等功能。

## 主要功能
- 网络设备管理
- 配置管理
- 自动化运维
- 资产管理
- 用户认证和授权
- 审计日志

## 技术栈
- 后端：Python FastAPI
- 前端：React TypeScript
- 数据库：PostgreSQL
- 缓存：Redis
- 任务队列：Celery

## 快速开始

### 环境要求
- Python 3.9+
- Node.js v22.14.0+
- PostgreSQL 13+
- Redis 6+

### 安装步骤

1. 克隆代码库
```bash
git clone <repository_url>
cd netops
```

2. 安装后端
```bash
cd netops-backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

3. 配置数据库
- 修改 `database/config.py` 中的数据库连接信息
- CMDB使用与netops相同的数据库，无需单独配置

4. 初始化数据库
```bash
python int_all_db.py
```

5. 安装前端
```bash
cd ../netops-frontend
npm install
```

6. 启动服务
```bash
# 后端服务
cd ../netops-backend
python main.py

# Celery Worker（后台任务）
celery -A tasks worker --loglevel=info

# Celery Beat（定时任务）
celery -A tasks beat --loglevel=info

# 前端服务
cd ../netops-frontend
npm start
```

## 访问系统
- 前端界面：http://localhost:3000
- 后端API文档：http://localhost:8000/docs

默认登录信息：
- 用户名：admin
- 密码：admin123

## 项目结构
```
netops/
├── netops-backend/          # 后端代码
│   ├── app/                # 应用代码
│   ├── database/           # 数据库相关
│   ├── models/             # 数据模型
│   └── tests/              # 测试代码
└── netops-frontend/        # 前端代码
    ├── src/               # 源代码
    ├── public/            # 静态资源
    └── tests/             # 测试代码
```

## 开发指南
详细的开发指南请参考 [INSTALL.md](INSTALL.md)

## 贡献指南
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证
MIT License 