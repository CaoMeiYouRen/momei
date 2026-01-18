# 互动与隐私控制 (Interactions & Privacy Control)

## 1. 概述 (Overview)

本模块涵盖文章访问控制、用户互动、以及外部创作者的内容投稿流程。旨在提供一个安全、可控且具有高度互动性的博客生态系统。

## 2. 精细化访问控制 (Fine-grained Access Control)

### 2.1 访问策略 (Visibility Strategies)

文章新增 `visibility` (可见性) 设置，支持以下策略：

| 策略 | 说明 | 校验逻辑 |
| :--- | :--- | :--- |
| `public` | 公开 | 无需校验，所有人可见。 |
| `private` | 私密 | 仅作者 (Author) 和管理员 (Admin) 可见。 |
| `password` | 密码保护 | 用户输入对应的 `post_password` 后可见。凭证记录在加密的 Cookie 中。 |
| `registered` | 登录可见 | 仅限已登录并拥有活跃 Session 的用户。 |
| `subscriber` | 订阅可见 | 仅限已通过邮件验证的订阅者 (Subscriber) 或登录用户中已订阅的人员。 |

### 2.2 实现方案

-   **数据库变更**:
    -   `Post` 实体增加 `visibility` (枚举: public, private, password, registered, subscriber)。
    -   `Post` 实体增加 `password` (字符串, 仅用于 password 策略)。
-   **后端校验**:
    -   在获取文章详情的 API (`GET /api/posts/:id`) 中，服务端根据当前 `visibility` 检查 `event.context.auth` (Session) 或请求体中的密码。
    -   不符合条件时忽略 `content` 字段，并返回状态标志（`locked: true`, `reason: string`）。
-   **前端交互**:
    -   渲染受限占位符。
    -   根据 `reason` 提供相应的解除限制入口：
        -   `PASSWORD_REQUIRED`: 显示密码输入框。
        -   `AUTH_REQUIRED`: 显示登录/注册引导按钮。
        -   `SUBSCRIPTION_REQUIRED`: 显示订阅引导表单。

## 3. 原生评论系统 (Native Comment System)

### 3.1 核心特性 (Features)

-   **嵌套回复**: 支持父子层级（递归或两级分级）。
-   **访客评论**: 允许未登录用户评论，但需提供邮箱。
-   **Gravatar 集成**: 自动根据邮箱获取全球头像。
-   **Markdown 支持**: 仅支持基础格式（加粗、斜体、链接、引用、内联代码），禁用 HTML 注入。
-   **点赞互动**: 支持对评论进行快速点赞。

### 3.2 数据库设计

#### Comment (评论表)

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | varchar | 主键 (Snowflake) |
| `postId` | varchar | 关联的文章 ID |
| `authorId` | varchar | 关联用户 ID (可选，登录用户专用) |
| `parentId` | varchar | 被回复的评论 ID (可选) |
| `content` | text | 评论的正文 |
| `authorName`| varchar | 评论者昵称 (访客/同步 User) |
| `authorEmail`| varchar | 评论者邮箱 (访客/同步 User) |
| `authorUrl` | varchar | 评论者个人站点 (可选) |
| `status` | varchar | 状态: pending (审核中), published (已发布), spam (垃圾邮件) |
| `ip` | varchar | 评论者 IP |
| `userAgent` | text | 评论者设备信息 |
| `isSticked` | boolean | 是否置顶 |

### 3.3 管理与安全

-   **黑名单**: 支持根据 IP、邮箱或关键词进行屏蔽。
-   **频率限制 (Rate Limiting)**: 单 IP 短时间内限制评论次数。
-   **审核流**:
    -   管理员可在后台一键“通过”、“删除”或“标记垃圾”。
    -   可配置“全员审核”或“仅访客审核”。

## 4. 访客投稿工作流 (Guest Posting Workflow)

### 4.1 流程设计 (Submission Flow)

旨在吸引外部优质内容，但不开放后台权限。

1.  **提交入口**: 前台显著位置提供“投稿”页面 (`/submit`)。
2.  **投稿表单**:
    -   标题 (Required)。
    -   正文 (Required, Markdown 格式)。
    -   投稿人信息 (姓名、邮箱 - 必填)。
    -   分类/建议标签。
3.  **审核状态**: 提交后系统创建一条 `status: pending` 的文章记录。
4.  **通知机制**: 提交成功通知投稿人；邮件通知管理员有新稿件待审。
5.  **管理员介入**: 管理员在后台预览、排版、赋予 `authorId`（可以是特定的 "Guest" 用户或实名化）后发布。

### 4.2 权限控制 (Collaboration)

-   访客提交不具备编辑权。
-   若访客是已登录用户，提交后可在个人中心查看“我的审核中”稿件。

## 5. 模块关联

-   **Admin**: 增加评论管理、投稿审核专属仪表盘。
-   **Blog**: 文章底部集成评论列表与投稿引导。
-   **User**: “我的评论”记录与通知中心互动。
