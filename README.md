# 网络自动化运维平台

基于React + NestJS + TypeORM + Netmiko的网络自动化运维平台，支持网络设备配置管理、自动化运维和流程编排。

## 功能特性

### 1. 流程设计器
- 基于ReactFlow的流程编排功能
- 支持多种节点类型：
  - 开始/结束节点
  - 任务节点（支持自定义业务逻辑）
  - 条件节点（支持流程分支控制）
  - 设备连接节点（支持多设备并行连接）
  - 配置下发节点（支持多设备配置部署）
  - 命令执行节点（支持多设备命令执行）
  - 配置备份节点（支持多设备配置备份）
  - 状态检查节点（支持多设备状态监控）
- 支持节点拖拽、连线、删除等操作
- 支持流程保存、加载和发布

### 2. 设备管理
- 支持多种网络设备类型（思科、华为等）
- 设备连接信息管理
- 设备状态监控
- 配置备份和恢复

### 3. 自动化运维
- 基于Netmiko的多设备并行操作
- 配置模板管理
- 命令执行
- 状态检查
- 告警处理

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design 5.x
- ReactFlow
- Axios

### 后端
- NestJS
- TypeORM
- Netmiko
- PostgreSQL
- Redis

## 快速开始

### 环境要求
- Node.js >= 16
- Python >= 3.8
- PostgreSQL >= 12
- Redis >= 6

### 安装依赖

前端：
```bash
cd netops-frontend
npm install
```

后端：
```bash
cd netops-backend
npm install
pip install -r requirements.txt
```

### 配置
1. 复制环境配置文件：
```bash
# 前端
cp netops-frontend/.env.example netops-frontend/.env

# 后端
cp netops-backend/.env.example netops-backend/.env
```

2. 修改配置文件中的数据库连接信息和其他必要配置

### 启动服务

前端：
```bash
cd netops-frontend
npm run dev
```

后端：
```bash
cd netops-backend
npm run start:dev
```

## 项目结构

```
netops/
├── netops-frontend/          # 前端项目
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── pages/          # 页面
│   │   ├── api/            # API接口
│   │   └── utils/          # 工具函数
│   └── package.json
│
└── netops-backend/          # 后端项目
    ├── src/
    │   ├── controllers/    # 控制器
    │   ├── services/       # 服务
    │   ├── entities/       # 实体
    │   └── utils/          # 工具函数
    └── package.json
```

## 开发计划

- [x] 基础框架搭建
- [x] 流程设计器实现
- [x] 设备管理功能
- [x] 自动化运维功能
- [ ] 用户认证和权限管理
- [ ] 操作日志和审计
- [ ] 监控告警集成
- [ ] 报表统计功能

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

MIT License 