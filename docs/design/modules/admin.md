# 后台管理模块 (Admin Module)

## 1. 概述 (Overview)

本模块包含系统管理功能，仅供 `admin` 或 `author` (受限) 角色访问。包含用户管理、文章管理、分类/标签管理。

## 2. 管理员初始化逻辑 (Initialization Logic)

为了简化部署流程并确保安全性，系统采用以下管理员确权机制：

-   **安装向导 (Recommended)**: 系统首运行会进入[安装向导](./installation.md)，在向导中直接创建首个超级管理员账号。
-   **首位自动提权 (Legacy/Fallback)**: 在未使用安装向导的情况下，若系统检测到数据库用户表为空，第一个成功登录/注册的账号将获得 `admin` 角色。
-   **环境变量手动提权**: 后续若需添加其他管理员，可通过修改环境变量 `ADMIN_USER_IDS`，填入对应用户的唯一 ID（Snowflake ID），并以逗号分隔。
-   **后台管理授权**: 已登录的管理员可以在“用户管理”页面手动调整其他用户的角色。

## 3. 页面设计 (UI Design) - /admin/

### 3.1 用户管理页 (`/admin/users`)

-   **权限**: `admin` only.
-   **组件**:
    -   **DataTable**: 用户列 (带头像), 角色 Badge, 状态, 最后活跃.
    -   **Toolbar**: 搜索 (Name/Email), 筛选 (Role/Status), "新增用户" 按钮.
-   **操作**:
    -   编辑角色 (Set Role).
    -   封禁/解封 (Ban/Unban).
    -   会话管理 (Revoke Sessions).
    -   模拟登录 (Impersonate).
    -   删除用户.

### 3.2 文章管理页 (`/admin/posts`)

-   **权限**: `admin` (All), `author` (Own).
-   **列表列**: 标题, 作者, 状态 (Published/Draft/Pending), 分类, 时间, 浏览量.
-   **操作**: 新建, 编辑, 删除, 预览.

### 3.3 分类/标签管理 (`/admin/categories`, `/admin/tags`)

-   **权限**: `admin`.
-   **布局**: 树形表格 (分类) / 普通表格 (标签).
-   **功能**: 增删改查 (CRUD).

### 3.4 文章编辑器 (`/admin/posts/new`, `/admin/posts/:id`)

-   全屏编辑器, 支持 Markdown/富文本, 实时预览, 属性设置 (Slug, Category, Tags)。
-   **Demo 模式限制**: 禁止保存 (Save/Publish) 操作。

## 4. 国际化设计 (Admin I18n Design)

### 4.1 UI 语言与内容语言分离 (Dual-I18n Strategy)

管理后台支持 **界面语言 (UI Locale)** 与 **内容语言 (Content Locale)** 的独立配置：

-   **界面语言 (UI Locale)**: 影响菜单、按钮、提示信息等系统文本。由 `nuxt-i18n` 全局管理。
-   **内容语言 (Content Locale)**: 影响文章、分类、标签列表的数据筛选，以及编辑器默认创建内容的语言属性。
-   **设计目的**: 允许管理员在习惯的语言环境下管理多种语言的内容（例如：在中文后台界面下编辑英文文章）。

### 4.2 实现方案

-   **状态管理**: 内容语言状态通过 URL 查询参数 (如 `?lang=en`) 或页面级持久化状态管理。
-   **筛选逻辑**:
    -   管理列表页顶部提供“内容语言”切换器，支持“全部”或特定语言。
    -   `useAdminList` 自动读取该状态并作为 `language` 参数发送给 API。
-   **聚合展示 (Aggregation Logic)**:
    -   通过 `?aggregate=true` 启用翻译簇聚合。
    -   **聚合主记录选择**:
        -   目前采用 `MIN(id)` 选择该簇下的第一个创建的版本作为主记录展示。
        -   _后续计划_: 引入优先级排序，优先匹配当前选中的“内容语言”。
-   **编辑器关联**:
    -   编辑现有文章时，自动锁定为该文章的语言。
    -   新建文章时，默认使用当前选中的“内容语言”。
    -   **多语言 Tabs**: 在分类/标签/文章编辑弹窗中，支持通过 Tabs 切换同一个 `translationId` 下的不同语言版本，实现一站式翻译。

## 5. 接口设计 (API Design)

### 5.1 用户管理 (Based on better-auth admin plugin)

-   查询: `authClient.admin.listUsers`
-   角色: `authClient.admin.setRole`
-   封禁: `authClient.admin.banUser` / `unbanUser`
-   密码: `authClient.admin.setUserPassword`
-   删除: `authClient.admin.removeUser`
-   会话: `authClient.admin.listUserSessions`, `revokeUserSession`
-   模拟: `authClient.admin.impersonateUser`

### 5.2 文章管理 (Write / Manage)

-   `GET /api/posts` (Manage Mode)
    -   **Query**: `scope=manage`, `status` (draft/pending...), `authorId`.
    -   **Logic**: 根据权限返回草稿或他人文章。
-   `POST /api/posts`: 创建文章.
-   `PUT /api/posts/:id`: 更新文章.
-   `DELETE /api/posts/:id`: 删除文章.
-   `PUT /api/posts/:id/status`: 快速改状态 `{ status: 'published' | ... }`.

### 5.3 分类与标签 (Management)

-   `POST /api/categories`, `PUT /api/categories/:id`, `DELETE ...`
-   `POST /api/tags`, `PUT /api/tags/:id`, `DELETE ...`
