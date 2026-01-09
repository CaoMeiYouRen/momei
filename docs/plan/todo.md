# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段 (MVP) 需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开。

## 状态说明

-   [ ] 待办 (Todo)
-   [x] 已完成 (Done)
-   [-] 已取消 (Cancelled)

## 第一阶段：MVP (最小可行性产品)

### 1. 基础设施与配置

-   [x] **项目初始化**
    -   验收: Nuxt 3 项目结构建立，Git 仓库配置完成。
    -   验收: ESLint, Stylelint, Commitlint 配置生效。
-   [x] **CI/CD 基础**
    -   验收: GitHub Actions 配置完成，PR 自动运行 Lint 和 Test。
-   [x] **数据库连接**
    -   验收: 本地 SQLite 连接成功，TypeORM 实体同步正常。
-   [x] **Microsoft Clarity 集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。
-   [x] **Sentry 集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。
-   [x] **百度统计集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。
-   [x] **Google Analytics 集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。

### 2. 用户系统 (User System)

-   [x] **数据库实体同步 (Database Entities)**
    -   [x] 验收: 确认 `User`, `Account`, `Session`, `Verification`, `TwoFactor` 表结构正确创建。
    -   [x] 验收: 数据库迁移/同步脚本执行无误。
-   [x] **集成 better-auth (Backend)**
    -   [x] 验收: `/api/auth/*` 路由正常工作 (SignIn, SignUp, SignOut, Session)。
    -   [x] 验收: 实现 邮箱/密码 注册与登录流程；实现 用户名/密码 登录流程。
    -   [x] 验收: 实现 GitHub OAuth 登录流程。
    -   验收: 用户 Session 持久化 (Cookie) 且 SSR 兼容。
-   [x] **用户界面开发 (Frontend Pages)**
    -   [x] 验收: **登录页 (`/login`)**: 包含邮箱登录表单和 OAuth 按钮。
    -   [x] 验收: **注册页 (`/register`)**: 包含注册表单和验证逻辑。
    -   [x] 验收: **个人设置页 (`/settings`)**: 允许用户修改昵称、头像。
-   [x] **用户角色与权限 (RBAC)**
    -   [x] 验收: 数据库 `User` 表包含 `role` 字段 (Admin, Author, User, Visitor)。
    -   [x] 验收: 实现后端中间件 `server/middleware/auth.ts` 拦截未授权请求。
-   [ ] **用户管理 (User Management - Admin Only)**
    -   验收: 管理后台提供用户列表查看功能（集成 `better-auth` admin 插件）。
    -   验收: 管理员可在后台修改用户角色 (如将 User 提升为 Author)。
    -   验收: 管理员可对违规账号进行禁用或启用操作。
    -   验收: 支持查杀指定用户的活跃 Session。

### 3. 内容管理 (Content Management)

-   [x] **Markdown 编辑器组件**
    -   验收: 支持基础 Markdown 语法高亮。
    -   验收: 支持实时预览。
-   [x] **文章 CRUD API**
    -   [x] 验收: `POST /api/posts` 能创建文章。
    -   [x] 验收: `GET /api/posts` 能分页获取文章。
    -   [x] 验收: `PUT /api/posts/:id` 能更新文章内容。
    -   [x] 验收: `DELETE /api/posts/:id` 能删除文章。
    -   [x] 验收: 拆分 `GET /api/posts/:id` 和 `GET /api/posts/slug/:slug`。
    -   [x] 验收: Slug 设置时校验禁止使用 Snowflake ID 格式。
-   [x] **文章审核流程**
    -   [x] 验收: 作者发布文章后状态为 `pending` (需审核)。
    -   [x] 验收: 管理员可查看所有文章列表。
    -   [x] 验收: 管理员可修改文章状态。
-   [x] **分类管理 (Categories)**
    -   [x] 验收: API CRUD 完成 (Admin Only)。
    -   [x] 验收: 管理后台界面完成 (列表/新建/编辑/删除)。
-   [x] **标签管理 (Tags)**
    -   [x] 验收: API CRUD 完成。
    -   [x] 验收: 管理后台界面完成。
-   [x] **自定义 Slug 支持**
    -   [x] 验收: 创建/编辑文章时可手动输入 Slug。
    -   [x] 验收: 文章可通过 `/posts/:slug` 或 `/posts/:id` 访问。
-   [x] **图片上传**
    -   [x] 验收: 编辑器支持拖拽上传图片。
    -   [x] 验收: 图片保存到本地或对象存储，并返回可访问 URL。
-   [ ] **外部发布 API (External Publishing API)**
    -   验收: 实现基于 API KEY 鉴权的发布接口 `POST /api/external/posts`。
    -   验收: 支持简单的 API KEY 管理（目前仅关联用户）。
    -   验收: 外部调用能正确创建文章并关联对应作者。

### 4. 内容展示 (Content Display)

-   [x] **首页开发**
    -   [x] 验收: 展示文章列表，支持分页。
    -   [x] 验收: 响应式布局适配移动端。
-   [x] **文章详情页**
    -   [x] 验收: 实现阅读量 (PV) 统计与展示 (API + Client Side + Anti-Spam)。
    -   [x] 验收: Markdown 正确渲染为 HTML。
    -   [x] 验收: 自动生成目录 (TOC)。
    -   [x] 验收: SEO Meta 标签正确生成 (Title, Description)。
-   [x] **归档页（高优先，估时 1–2 天）**
    -   [x] 验收: 按年份/月份展示文章归档；支持 SSR，按年/月聚合并显示文章数量。
    -   [x] 实施建议: 新增 `server/api/posts/archive.get.ts`（或扩展 `GET /api/posts`）与页面 `pages/archive.vue`（或 `pages/archives/index.vue`）。
-   [x] **暗色模式 (Dark Mode)**
    -   [x] 验收: 实现主题切换器 (Light/Dark/System)。
    -   [x] 验收: 状态持久化 (Cookie/LocalStorage) 且无闪烁。
    -   [x] 验收: 全站组件适配深色样式。
-   [x] **移动端优化 (Mobile Optimization)** (高优先，估时 1–2 天)
    -   [x] 验收: 实现响应式导航栏 (汉堡菜单)（估时 0.5–1 天）。
    -   [ ] 验收: 修正排版、间距、图片响应式，完成 Lighthouse 基本审计（估时 1–2 天）。
    -   [x] 验收: 优化移动端排版 (字号、行高、间距)。
    -   [x] 验收: 确保所有可点击元素尺寸符合触摸标准 (>44px)。
-   [ ] **测试与 CI 校验（持续）**
    -   [ ] 验收: 为新增归档页、移动导航添加单元/集成或 E2E 用例并纳入 CI。
-   [x] **SSR 渲染支持**
    -   [x] 验收: 确保首页、文章详情页、归档页在禁用 JavaScript 时能正常显示内容。
    -   [x] 验收: 验证 SEO Meta 标签在服务端正确生成。
-   [x] **阅读量统计 (PV)**
    -   [x] 验收: 文章详情页支持阅读量累计。
    -   [x] 验收: 实现基础防刷逻辑 (IP 限制或 Cookie 校验)。
    -   [x] 验收: 仅统计浏览器正常访问，排除爬虫（可选）。

### 5. 国际化 (i18n)

-   [x] **nuxt-i18n 配置**
    -   [x] 验收: 支持 `/en` 和 `/zh` 路由前缀。
    -   [x] 验收: 语言切换按钮能正确跳转并保留当前路径。
-   [x] **UI 文本翻译**
    -   [x] 验收: 核心组件 (Header, Footer, Card) 完成中英文配置。

## 待排期 (Backlog)

-   [ ] **SEO 增强**
    -   [ ] 站点地图生成 (`@nuxtjs/sitemap`)（中优先，估时 2–4 小时）。
    -   [ ] Google 网站管理工具验证支持。
    -   [ ] Bing 网站管理工具验证支持。
-   [ ] **内容体验**
    -   [ ] 字数统计与阅读时长预估。
    -   [ ] 文章版权声明组件 (CC BY-NC-SA 4.0)。
    -   [ ] 高级搜索 (Algolia 集成)。
-   [ ] **特色功能**
    -   [ ] 哀悼模式 (全站置灰)。
-   [ ] 集成 AI 标题生成 (Post-MVP)
-   [ ] RSS 订阅源 (Post-MVP)
-   [ ] 评论系统 (长期)

## 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [项目计划](./roadmap.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
