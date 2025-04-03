# NetOps 网络自动化平台

NetOps是一个现代化的网络自动化平台，提供网络设备管理、配置管理、任务调度等功能。本平台采用前后端分离架构，后端使用FastAPI框架，前端使用React框架。

## 功能特点

- 🔐 用户认证与权限管理
- 📱 响应式Web界面
- 🔄 网络设备配置管理
- ⏰ 定时任务调度
- 📊 网络拓扑可视化
- 📝 操作日志记录
- 🔍 设备搜索与过滤
- 📦 配置备份与恢复

## 技术栈

### 后端
- FastAPI - 高性能Web框架
- SQLAlchemy - ORM数据库操作
- Celery - 异步任务队列
- PostgreSQL - 主数据库
- Redis - 缓存与消息队列

### 前端
- React - 用户界面框架
- Ant Design - UI组件库
- TypeScript - 类型安全
- Vite - 构建工具

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

3. 安装前端
```bash
cd netops-frontend
npm install
```

4. 启动服务
```bash
# 后端
cd netops-backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# 前端
cd netops-frontend
npm start
```

## 项目结构

```
netops/
├── netops-backend/          # 后端服务
│   ├── database/           # 数据库相关
│   ├── api/               # API路由
│   ├── models/            # 数据模型
│   ├── schemas/           # 数据验证
│   ├── services/          # 业务逻辑
│   └── utils/             # 工具函数
└── netops-frontend/        # 前端应用
    ├── src/               # 源代码
    ├── public/            # 静态资源
    └── package.json       # 依赖配置
```

## 配置说明

### 数据库配置
在 `netops-backend/database/config.py` 中配置数据库连接信息：
```python
DATABASE_CONFIG = {
    "host": "172.18.40.80",
    "port": 5432,
    "database": "netops",
    "user": "amber",
    "password": "amberman@2025!",
}
```

### Redis配置
在同一文件中配置Redis连接信息：
```python
REDIS_CONFIG = {
    "host": "172.18.40.80",
    "port": 6379,
    "db": 0,
}
```

## 开发指南

### 后端开发
1. 遵循PEP 8编码规范
2. 使用Type Hints进行类型注解
3. 编写单元测试
4. 使用Black进行代码格式化

### 前端开发
1. 遵循ESLint规则
2. 使用TypeScript编写组件
3. 遵循React最佳实践
4. 使用Prettier进行代码格式化

## 部署说明

### 数据库备份
```bash
python backup_database.py
```

### 数据库恢复
```bash
python restore_database.py /app/net-soc-ops/netops-backend/database_backups/netops_backup_20250402_191054.sql
```

## 常见问题

1. 数据库连接失败
   - 检查数据库服务状态
   - 验证连接信息
   - 确认用户权限

2. Redis连接失败
   - 检查Redis服务状态
   - 验证连接信息

3. 前端构建失败
   - 检查Node.js版本
   - 清理依赖重新安装

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目维护者：[维护者姓名]
- 邮箱：[邮箱地址]
- 问题反馈：[Issues](https://github.com/your-repo/issues) 