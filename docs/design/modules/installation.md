# 安装向导与首运行初始化设计规范 (Installation Wizard & Initial Run Design)

## 1. 概述 (Overview)

安装向导旨在为“墨梅博客”提供一个平滑的初始化体验。它通过引导式 Web 界面，帮助管理员完成核心环境检查、数据库结构同步、站点基本信息配置及首个管理员账号创建。这是项目从“部署完成”走向“正式可用”的关键桥梁。

## 2. 评估矩阵 (Evaluation Matrix)

| 维度 | 分值 | 理由 |
| :--- | :--- | :--- |
| **价值 (Value)** | 5 | 极大提升产品易用性，降低开发者/非专业用户的准入门槛。 |
| **契合度 (Alignment)** | 5 | 属于“生态准入”核心模块，是实现“私有化部署”闭环的重要组成。 |
| **复杂度 (Difficulty)** | 3 | 涉及全栈逻辑：中间件拦截、数据库检测、配置动态持久化。 |
| **风险 (Risk)** | 2 | 主要风险在于安装后的越权初始化，需通过“安装锁”机制规避。 |
| **Score** | **2.0** | $(5+5)/(3+2) = 2.0 > 1.5$，优先执行。 |

## 3. 核心机制：首运行检测 (First-Run Detection)

由于 Nuxt 支持多种部署环境（Vercel, Docker, CF Workers），检测机制需具备通用性。

### 3.1 拦截触发逻辑
-   **全局中间件 (Middleware)**: 利用 Nuxt 的全局路由中间件或 Nitro 钩子，在系统未初始化时，将所有非 `/installation` 路径的请求（API 与页面）重定向至安装程序。
-   **状态判定条件**:
    1.  **数据库连接性**: 检查数据库是否可连接。
    2.  **数据表完整性**: 检查 `User` 表是否存在任何记录（如果没有用户，则视为未初始化）。
    3.  **配置标记**: 检查数据库 `Settings` 表中是否存在 `system_initialized` 字段。

### 3.2 安装锁 (Installation Lock)
-   安装完成后，在服务器环境中生成“逻辑锁”：
    -   **数据库锁**: 在 `Settings` 中标记 `installed: true`。
    -   **环境变量防护**: 引导用户将环境变量 `MOMEI_INSTALLED=true` 加入生产环境（由于安全原因，环境变量通常最权威）。

## 4. 交互流程 (Installation Flow)

采用分步式（Stepper）向导：

1.  **Step 1: 环境检查 (Health Check)**
    -   检测 Node.js 版本、数据库连接状态、文件上传权限。
    -   选择安装向导语言。
2.  **Step 2: 数据库初始化 (DB Schema)**
    -   执行 TypeORM Migrations 同步表结构。
    -   注入默认数据（分类、标签示例）。
3.  **Step 3: 站点配置 (Site Settings)**
    -   标题、描述、关键词、底部版权。
    -   i18n 默认语言设置。
4.  **Step 4: 管理员创建 (Admin Account)**
    -   设置首个超级管理员的邮箱和密码。
    -   集成 Better-Auth 初始化逻辑。
5.  **Step 5: 核心功能预览 (Feature Preview)**
    -   可选配置：AI 服务商 Key、SEO 插件、主题预览。
6.  **Step 6: 完成与安全提示 (Finalize)**
    -   展示安装报告。
    -   提示移除安装程序权限。
    -   重定向至 `/admin`。

## 5. 配置存储策略 (Configuration Strategy)

本模块涉及环境变量与数据库配置的优先级冲突，遵循以下准则：

-   **环境变量 (Environment Variables)**: 
    -   **地位**: 物理级配置，不可篡改。
    -   **用途**: 数据库连接串、Auth Secret、S3 密钥等。
    -   **特性**: 一旦设定，Web UI 无法通过数据库记录覆盖对应的 ENV 值。
-   **数据库配置 (Database Settings)**:
    -   **地位**: 逻辑级配置，可通过 UI 修改。
    -   **用途**: 站点名称、SEO 配置、UI 主题、API 服务商配置（如 OpenAI Key 可存入 DB 便于切换）。
    -   **特性**: 提供默认值，存储在 `Settings` 表中。

## 6. 接口设计 (API Design)

### 6.1 安装专用接口 (`/api/install/*`)

这些接口仅在“非锁定”状态下可用：

-   **`GET /api/install/status`**: 获取当前安装进度和环境状态。
-   **`POST /api/install/init-db`**: 触发数据库迁移。
-   **`POST /api/install/setup-site`**: 提交站点配置。
-   **`POST /api/install/create-admin`**: 创建首位管理员。
-   **`POST /api/install/finalize`**: 激活安装锁。

## 7. 安全规范 (Security)

1.  **鉴权拦截**: 一旦逻辑锁激活，`/api/install/*` 必须返回 `403 Forbidden`。
2.  **密码强度**: 管理员创建步骤必须包含严格的密码复杂度校验。
3.  **敏感数据**: 安装向导中录入的第三方 API Key 存入数据库前需加密。

## 8. UI 设计要点 (UI Design)

-   **独立布局**: 使用极简的 `layouts/installation.vue`，不包含常规博客的导航栏。
-   **响应式**: 适配移动端安装体验。
-   **进度反馈**: 使用 PrimeVue `Stepper` 组件，实时展示安装各个阶段的成功状态。
