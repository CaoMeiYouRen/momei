# 系统能力与设置 (System & Settings)

## 1. 概述 (Overview)

墨梅博客采用了**智能混合配置模式 (Smart Hybrid Mode)**，将环境变量的安全性与后台管理的可视化灵活性有机结合。通过一套统一的配置代理层，实现了“零配置”快速部署。

## 2. 核心机制 (Core Mechanisms)

### 2.1 智能混合配置 (Smart Hybrid Mode)
系统读取配置时遵循以下优先级：
1. **环境变量 (ENV)**: 最高优先级，用于生产环境敏感密钥锁定。
2. **数据库配置 (DB)**: 后台管理的持久化存储，允许动态修改。
3. **默认值 (Default)**: 代码中的回退值。

**公式**: `EffectiveValue = ENV ?? DB ?? Default`

### 2.2 自动同步与推断
- **智能推断**: 自动解析 `DATABASE_URL` (支持 sqlite, mysql, postgres) 和功能开关 (检测到 API Key 自动启用功能)。
- **安装同步**: 系统初始化时，自动将环境中已有的有效变量同步到数据库，确保后台状态一致。

### 2.3 敏感数据保护 (Data Masking)
后台 API 对敏感字段进行自动脱敏处理：
- **密码/密钥**: 全星号掩盖或仅显示首尾。
- **锁定标识**: 若配置来自环境变量，后台将显示锁定状态，禁止修改，防止误操作破坏生产环境。

## 3. 安装向导 (Installation Wizard)

系统内置了平滑的安装流程：
1. **引导启动**: 依赖极简的基础环境变量 (`DATABASE_URL`, `AUTH_SECRET`)。
2. **初始化向导**: 进入后台前，检测系统是否初始化。引导用户完成管理员创建、站点设置等关键业务配置。
3. **本地零配置**: 在开发模式下，自动生成本地 SQLite 数据库和随机 Secret。

## 4. 部署优化 (Deployment)

- **Serverless 友好**: 自动禁用文件系统日志，优先使用远程数据库。
- **Docker 支持**: 完善的 Compose 模板，支持挂载外部配置文件。
- **一键部署**: 适配 Vercel, Netlify, Cloudflare Workers。

## 5. 配置清单 (Configuration Catalog)

| 分类 | 关键变量 | 说明 |
| :--- | :--- | :--- |
| **基础** | `SITE_TITLE`, `SITE_URL` | 站点核心信息 |
| **数据库** | `DATABASE_URL` | 支持多种数据库类型，自动推断驱动 |
| **认证** | `AUTH_SECRET`, `GITHUB_CLIENT_ID` | 安全及第三方登录凭据 |
| **功能** | `AI_API_KEY`, `SMTP_HOST` | 开启对应服务的金钥匙 |

---

> 相关代码地址: [server/services/setting.ts](https://github.com/CaoMeiYouRen/momei/blob/master/server/services/setting.ts)
