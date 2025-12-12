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
-   [ ] **数据库连接**
    -   验收: 本地 SQLite 连接成功，TypeORM 实体同步正常。

### 2. 用户系统 (User System)

-   [ ] **集成 better-auth**
    -   验收: 实现 GitHub OAuth 登录流程。
    -   验收: 用户 Session 持久化 (Cookie)。
-   [ ] **用户角色管理**
    -   验收: 数据库中区分 Admin 和 Visitor 角色。
    -   验收: 后端中间件能拦截非 Admin 用户的写操作。

### 3. 内容管理 (Content Management)

-   [ ] **Markdown 编辑器组件**
    -   验收: 支持基础 Markdown 语法高亮。
    -   验收: 支持实时预览。
-   [ ] **文章 CRUD API**
    -   验收: `POST /api/posts` 能创建文章。
    -   验收: `GET /api/posts` 能分页获取文章。
    -   验收: `PUT /api/posts/:id` 能更新文章内容。
    -   验收: `DELETE /api/posts/:id` 能删除文章。
-   [ ] **自定义 Slug 支持**
    -   验收: 创建/编辑文章时可手动输入 Slug。
    -   验收: 文章可通过 `/posts/:slug` 访问。
-   [ ] **图片上传**
    -   验收: 编辑器支持拖拽上传图片。
    -   验收: 图片保存到本地或对象存储，并返回可访问 URL。

### 4. 内容展示 (Content Display)

-   [ ] **首页开发**
    -   验收: 展示文章列表，支持分页。
    -   验收: 响应式布局适配移动端。
-   [ ] **文章详情页**
    -   验收: Markdown 正确渲染为 HTML。
    -   验收: 自动生成目录 (TOC)。
    -   验收: SEO Meta 标签正确生成 (Title, Description)。
-   [ ] **归档页**
    -   验收: 按年份/月份展示文章归档。

### 5. 国际化 (i18n)

-   [ ] **nuxt-i18n 配置**
    -   验收: 支持 `/en` 和 `/zh` 路由前缀。
    -   验收: 语言切换按钮能正确跳转并保留当前路径。
-   [ ] **UI 文本翻译**
    -   验收: 核心组件 (Header, Footer, Card) 完成中英文配置。

## 待排期 (Backlog)

-   [ ] 集成 AI 标题生成 (Post-MVP)
-   [ ] RSS 订阅源 (Post-MVP)
-   [ ] 评论系统 (长期)
