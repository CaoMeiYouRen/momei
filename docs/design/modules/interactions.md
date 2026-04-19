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
| `translationCache` | text (JSON) | 按 `AppLocaleCode` 缓存 AI 翻译结果，避免重复请求 |

### 3.3 评论翻译只读切换 (Read-only Comment Translation)

-   **只读切换**: 评论列表与回复树中的单条评论提供“查看翻译 / 查看原文”切换，不改写原始评论正文。
-   **写入边界**: 评论创建仍绑定当前正在浏览的文章版本 (`postId`)，不在本阶段引入跨语言共享线程或额外迁移字段。
-   **读取策略**: 评论列表读取时以当前文章语言版本优先，同一翻译簇中的其他公开语言版本作为补位来源，避免语言切换后评论区被误判为“消失”。
-   **补位粒度**: 跨语言补位以顶层评论线程为单位排序；当前语言线程优先，其余语言线程保持既有置顶与时间顺序，不拆散回复链路。
-   **展示约定**: 跨语言补位评论必须标记原始语言；若该评论已缓存当前阅读语言的译文，则默认展示译文，同时保留“查看原文”切换入口。
-   **语言归一化**: 目标语言统一收敛到 `AppLocaleCode`，并以该值作为 `translationCache` 的键，避免 `zh` / `zh-CN` 等别名造成重复缓存。
-   **缓存复用**: 首次翻译成功后把目标语言结果持久化到 `Comment.translationCache`，后续同语言请求直接复用缓存。
-   **权限复用**: 翻译接口读取评论时必须沿用评论可见性规则，公开访客只能翻译自己可见的评论，管理员仍保留完整视图。
-   **匿名审计主体**: 未登录读者通过签名的 visitor actor cookie 参与 AI 审计、频率限制与配额统计；已登录用户继续复用现有 `userId` 口径。
-   **服务端封装**: 长评论若触发 `AITask` 异步翻译，由服务端内部轮询并在完成后写回缓存；前端仅感知一次性结果或失败兜底。

### 3.4 管理与安全 (Management & Security)

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

### 3.5 身份与隐私保护 (Identity & Privacy)

-   **邮箱作为数字指纹**:
    -   游客评论必须填写邮箱。系统使用邮箱作为其在站点上的唯一身份标识，用于聚合其历史评论、关联 Gravatar 头像以及后续转化为注册用户/订阅者。
-   **隐私过滤逻辑**:
    -   **公众视窗 (Public View)**: 文章页面的公开评论列表中，严禁直接展示评论者的邮箱地址，以防隐私泄露和采集器抓取。
    -   **作者视窗 (Author View)**: 普通作者 (Author) 在管理后台仅能查看评论内容与昵称，无法直接获取评论者的真实邮箱。
    -   **管理员视窗 (Admin View)**: 仅系统管理员 (Admin) 具备查看评论者邮箱、IP 等敏感信息的权限，用于追责或管理。

## 4. 访客投稿工作流 (Visitor Submission Workflow)

### 4.1 核心流程 (Core Flow)

本功能允许外部贡献者提交文章，通过审核后发布。旨在降低投稿门槛，同时保证内容质量。

1.  **提交 (Submission)**：访客通过前台 `/submit` 页面填写投稿表单。
2.  **暂存 (Drafting)**：提交成功后，系统在数据库中创建一条状态为 `pending` 的投稿记录。
3.  **审核 (Review)**：管理员在后台收到通知，进入“稿件审核”界面进行查看、编辑、采纳或拒绝。
4.  **发布 (Publish)**：管理员采纳后，系统将其转为正式文章。管理员可以修改分类、标签，并决定最终署名（可以是贡献者本人，或将其归入特定作者）。

### 4.2 数据库设计 (Data Model)

#### Submission (投稿表)

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | varchar | 主键 (Snowflake) |
| `title` | varchar | 投稿标题 |
| `content` | text | Markdown 正文 |
| `contributorName` | varchar | 投稿者显示昵称 |
| `contributorEmail` | varchar | 投稿者邮箱 (用于反馈审核结果) |
| `contributorUrl` | varchar | 个人站点 (可选) |
| `status` | varchar | 状态: pending (待审), accepted (采纳), rejected (拒绝) |
| `authorId` | varchar | 若投稿者已登录，则关联其用户 ID |
| `adminNote` | text | 管理员审核备注 (内部可见) |
| `ip` | varchar | 提交者 IP |
| `userAgent` | text | 提交者设备信息 |

### 4.3 接口设计 (API Design)

-   **POST `/api/posts/submissions`**: 公开投稿接口。
    -   **校验**: 使用 Zod Schema 校验输入。
    -   **安全**: 必须携带有效的 Cloudflare Turnstile 验证 Token。
    -   **限频**: 单 IP 24 小时内限制提交 3 次。
-   **GET `/api/admin/submissions`**: 管理员获取投稿列表，支持按状态筛选。
-   **PUT `/api/admin/submissions/:id/review`**: 管理员执行审核。
    -   支持修改投稿内容并设置审核备注。
    -   采纳时可选择是否同步发送通知邮件。

### 4.4 权限与协同 (Collaboration)

-   **外部访客**: 提交后不可二次编辑，仅能通过预留邮箱接收状态通知。
-   **正式作者 (Author)**: 投稿若被采纳，该文章的 `authorId` 可指向该作者，计入其创作统计。
-   **管理员 (Admin)**: 拥有完整的 CRUD 权限，负责最终的排版与润色。

## 5. 模块关联 (Module Linkages)

-   **Admin**: 增加“稿件审核”工作台。
-   **Blog**: 文章底部集成评论列表与访问校验 UI；侧边栏或导航栏增加“我要投稿”入口。
-   **User**: “我的投稿”记录，实时查看审核进度。
-   **Email**: 配置投稿状态变更的邮件模板。
## 6. UI 交互设计 (UI/UX Design)

### 6.1 受限内容占位符 (Restricted Content Placeholder)
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

### 6.2 引导体验
- **错误提示**: 如果用户输入了错误的密码，应显示红色的错误抖动提示。
- **平滑过渡**: 满足条件后切换到正文时，应有平淡的 `fade-in` 动画。
