# 部署优化设计文档 (Deployment Optimization)

## 1. 背景与目标

目前墨梅博客的配置主要依赖于环境变量。随着功能增加，环境变量的数量也随之增长，导致部署门槛提高，尤其是在 Serverless (云函数) 环境下。

**目标**:
- **简化配置**: 减少必须手动设置的环境变量数量。
- **智能推断**: 通过现有信息自动推断环境需求。
- **零配置体验**: 本地开发环境“开箱即用”。
- **多场景适配**: 针对本地、云函数、私有服务器 (Docker) 提供最优配置建议。

## 2. 核心设计方案

### 2.1 智能数据库推断 (Smart Database Inference)

目前需要同时配置 `DATABASE_TYPE` 和 `DATABASE_URL`。
- **方案**: 自动解析 `DATABASE_URL` 的协议头。
    - `sqlite://...` (推荐) 或 `file://...` -> 自动识别为 `sqlite`。
    - `mysql://...` -> 自动识别为 `mysql`。
    - `postgres://...` 或 `postgresql://...` -> 自动识别为 `postgres`。
    - 无 `DATABASE_URL` -> 默认使用 `sqlite`。
- **优势**: 用户在云平台上只需设置一个 `DATABASE_URL` 即可完成数据库配置。

### 2.2 功能开关自动激活 (Auto Feature Activation)

目前功能开启需要 `_ENABLED=true` 和对应的 API Key。
- **方案**: 核心功能开关基于“配置即激活”原则。
    - 检测到 `AI_API_KEY` -> 自动启用 AI 功能。
    - 检测到 `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` -> 自动启用百度统计。
    - `_ENABLED` 变量仅作为高级覆盖项使用，默认可选。
- **优势**: 减少 `.env` 文件中的开关变量冗余。

### 2.3 本地零配置支持 (Local Zero-Config)

针对初次下载代码运行的开发者。
- **数据库**: 默认为 `sqlite`，自动检测并创建 `database/` 目录。
- **AUTH_SECRET**: 在 `NODE_ENV=development` 模式下，若未设置则自动生成随机密钥，确保系统能正常运行并提供安全警告。
- **SITE_URL**: 默认使用 `localhost:3000`。

### 2.4 环境变量分类规范

重新梳理 `.env.example`，将其分为三个层级：
1. **基础必填 (Essential)**: 仅包含 `AUTH_SECRET`, `DATABASE_URL`, `NUXT_PUBLIC_SITE_URL`。
2. **常用功能 (Common Features)**: 第三方登录、AI 配置、邮件服务。
3. **高级定制 (Advanced)**: 各种限流参数、内部优化、调试开关。

## 3. 安装向导与配置持久化评估 (Installation Wizard Evaluation)

针对用户提出的“安装向导”功能，我们进行了综合评估：

### 3.1 核心问题：引导启动 (The Bootstrapping Problem)
由于 `Better-Auth` 和 `TypeORM` 在应用启动时就需要 `AUTH_SECRET` 和 `DATABASE_URL`，因此**完全脱离环境变量**的向导存在“鸡生蛋”的问题：在没有数据库连接前，向导无法将配置存入数据库。

### 3.2 成本与收益分析

| 维度 | 评估结果 | 详细分析 |
| :--- | :--- | :--- |
| **开发成本** | **中/高** | 需要实现：1. 首运行状态检测；2. 动态 DB 重连逻辑；3. 配置文件 (JSON/ENV) 的运行时写入工具。 |
| **维护成本** | **中** | 需处理不同环境（如 Serverless 只读文件系统）下的写入失败回退逻辑。 |
| **用户收益** | **极高** | 大幅降低非技术用户的部署难度，实现类似 WordPress 的安装体验。 |
| **安全性** | **高** | 需确保安装向导在初始化完成后彻底锁定，防止攻击者重置系统。 |

### 3.3 推荐方案：混合向导模式 (Hybrid Wizard)

我们建议采用分阶段的向导模式，以平滑降低门槛而非彻底推翻现有架构：

1.  **阶段 1: 核心基础 (ENV 模式)**
    - 用户仍然需要通过环境变量或 `.env` 提供最基础的 `DATABASE_URL` 和 `AUTH_SECRET`。
    - **优化**: 提供智能推断（见 2.1），让这步只需要设置 1-2 个变量。
2.  **阶段 2: 业务功能向导 (DB 模式)** 
    - 应用启动后，系统检测数据库是否为空。
    - 若为空，进入 **初始化向导界面**。
    - 该向导引导用户设置：管理员账号（已有逻辑）、站点名称、AI 密钥、邮件服务、SEO 信息。
    - 这些信息**持久化存入数据库 `setting` 表**，不再依赖环境变量。
3.  **阶段 3: 自动化安装包 (未来方向)**
    - 针对私有服务器，提供一个一键脚本，自动生成随机 `AUTH_SECRET` 并辅助用户配置数据库。

## 4. 部署场景优化

### 3.1 本地部署 (Local/Development)
- **行为**: 使用 SQLite + 自动生成 Secret。
- **要求**: 仅需运行 `pnpm dev` 即可。

### 3.2 云函数部署 (Serverless - Vercel/Netlify)
- **行为**: 优先检测 `DATABASE_URL` 提供的远程数据库。
- **优化**: 自动禁用文件系统日志 (`LOGFILES=false`)，防止在只读文件系统中报错。

### 3.3 私有服务器部署 (Docker/VM)
- **行为**: 支持挂载外部配置文件 (如 `momei.config.json`)。
- **优化**: 完善 Docker Compose 模板，预设健康的默认值。

## 4. 实施策略

1.  **重构环境变量加载逻辑**: 在 `utils/shared/env.ts` 中实现上述推断逻辑。
2.  **调整数据库连接器**: 在 `server/database/index.ts` 中移除硬编码的类型检查。
3.  **更新前端逻辑**: 前端组件应基于配置的存在性（如 `AI_ENABLED || !!config.AI_API_KEY`）来判断功能展示。
4.  **精简配置示例**: 更新 `.env.example`。
