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

### 2.2 核心机制与安全性 (Core Mechanism & Security)

#### 2.2.1 私密伪装 (Stealth Mode)
- **行为**: 对于 `visibility: private` 的文章，如果请求者不是作者本人或管理员，API 必须返回 **404 Not Found**。
- **目的**: 彻底隔绝别名 (Slug) 泄露导致的信息熵，让无关用户无法验证该路径是否存在。

#### 2.2.2 明确拒绝原因 (Explicit Refusal Reasons)
除了 `private` 策略外，对于其他限制内容，API 应返回特定的错误信息以引导用户：
- `AUTH_REQUIRED` (401): 针对 `registered` 策略，引导至登录页。
- `PASSWORD_REQUIRED` (403): 针对 `password` 策略，弹出密码输入框。
- `SUBSCRIPTION_REQUIRED` (403): 针对 `subscriber` 策略，引导至邮件订阅组件。
- `PERMISSION_DENIED` (403): 通用权限不足（如非本文章作者尝试访问私密文章）。

#### 2.2.3 国际化联动策略 (I18n Interaction)
- **独立性 (Independence)**: 默认情况下，同一个翻译簇中的不同语言文章可以有不同的可见性（例如：中文译本仅限国内订阅可见，英文版公开）。
- **同步能力 (Sync Capability)**: 在管理后台提供“同步可见性到所有语言”的快捷按钮。

### 2.3 实现方案

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

### 3.3 管理与安全 (Management & Security)

-   **黑名单**: 支持根据 IP、邮箱或关键词进行屏蔽。
-   **反垃圾拦截**: 集成 Cloudflare Turnstile 或类似无需用户深度交互的验证码插件，防止机器人刷评论。
-   **频率限制 (Rate Limiting)**: 单 IP 短时间内限制评论次数。
-   **分级审核流**:
    -   **游客 (Guest)**: 评论状态默认为 `pending` (待审核)，必须经管理员人工通过后方可对外展示。
    -   **注册用户 (Registered)**: 评论状态默认为 `published` (已发布)，利用邮箱/账户的可追溯性减少审核压力。
    -   管理员拥有最高权限，可随时“撤回”、“标记垃圾”或“删除”任何评论。
-   **评论管理后台**:
    -   **聚合列表**: 管理员可通过后台统一查看全站评论，支持按状态（待审核、已发布、垃圾邮件）、文章、关键词筛选。
    -   **批量操作**: 支持批量通过、批量删除、批量标记为垃圾邮件。
    -   **穿透跳转**: 点击评论可直接跳转至对应文章页面的具体楼层，方便查看上下文。

### 3.4 身份与隐私保护 (Identity & Privacy)

-   **邮箱作为数字指纹**:
    -   游客评论必须填写邮箱。系统使用邮箱作为其在站点上的唯一身份标识，用于聚合其历史评论、关联 Gravatar 头像以及后续转化为注册用户/订阅者。
-   **隐私过滤逻辑**:
    -   **公众视窗 (Public View)**: 文章页面的公开评论列表中，严禁直接展示评论者的邮箱地址，以防隐私泄露和采集器抓取。
    -   **作者视窗 (Author View)**: 普通作者 (Author) 在管理后台仅能查看评论内容与昵称，无法直接获取评论者的真实邮箱。
    -   **管理员视窗 (Admin View)**: 仅系统管理员 (Admin) 具备查看评论者邮箱、IP 等敏感信息的权限，用于追责或管理。

## 4. 模块关联 (Module Linkages)

-   **Admin**: 增加评论管理、权限设置仪表盘。
-   **Blog**: 文章底部集成评论列表与访问校验 UI。
-   **User**: “我的评论”记录与通知中心互动。
## 5. UI 交互设计 (UI/UX Design)

### 5.1 受限内容占位符 (Restricted Content Placeholder)
当 API 返回文章状态为 `locked: true` 时，前台正文区域应渲染对应的占位组件：

- **密码保护 (Password)**:
    - 显示一把锁的图标。
    - 提示语：“此内容受密码保护，请输入访问密码”。
    - 提供输入框和“确认”按钮。
    - 验证成功后，自动重载内容或更新局部状态。

- **登录可见 (Registered)**:
    - 提示语：“本文仅限注册用户阅读”。
    - 提供“登录 / 立即注册”按钮。

- **订阅可见 (Subscriber)**:
    - 提示语：“这是一篇订阅者专享文章”。
    - 提供“输入邮箱订阅”或“已是订阅者？点此通过邮件验证”的入口。

### 5.2 引导体验
- **错误提示**: 如果用户输入了错误的密码，应显示红色的错误抖动提示。
- **平滑过渡**: 满足条件后切换到正文时，应有平淡的 `fade-in` 动画。
---

## 5. 未来扩展 (Future Extensions / Backlog)

### 5.1 访客投稿工作流 (Guest Posting Workflow)

*注：该功能在初期阶段优先级较低，暂不实现。*

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

#### 权限控制 (Collaboration)

-   访客提交不具备编辑权。
-   若访客是已登录用户，提交后可在个人中心查看“我的审核中”稿件。
