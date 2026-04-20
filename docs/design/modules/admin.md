# 后台管理模块 (Admin Module)

## 1. 概述 (Overview)

本模块包含系统管理功能，仅供 `admin` 或 `author` (受限) 角色访问。包含用户管理、文章管理、分类/标签管理。

## 2. 管理员初始化逻辑 (Initialization Logic)

为了简化部署流程并确保安全性，系统采用以下管理员确权机制：

-   **安装向导 (Recommended)**: 系统首运行会进入[安装向导](./system#安装向导)，在向导中直接创建首个超级管理员账号。
-   **首位自动提权 (Legacy/Fallback)**: 在未使用安装向导的情况下，若系统检测到数据库用户表为空，第一个成功登录/注册的账号将获得 `admin` 角色。
-   **环境变量手动提权**: 后续若需添加其他管理员，可通过修改环境变量 `ADMIN_USER_IDS`，填入对应用户的唯一 ID（Snowflake ID），并以逗号分隔。
-   **后台管理授权**: 已登录的管理员可以在“用户管理”页面手动调整其他用户的角色。

## 3. 页面设计 (UI Design) - /admin/

### 3.0 管理首页 (`/admin`)

-   **权限**: `admin` / `author`。
-   **定位**: 作为后台默认落点，提供第一轮内容运营洞察看板，不扩张为通用 BI 系统。
-   **筛选项**:
    -   时间窗口：`7 / 30 / 90` 天。
    -   内容语言：复用后台内容语言切换器。
    -   公开范围：`全部内容` / `仅公开内容`。
-   **指标口径**:
    -   阅读量、评论量、发文量均按“当前时间窗口 vs 前一等长窗口”对比展示。
    -   未指定内容语言时，多语言文章按当前 UI 语言 fallback 链选出的代表版本去重，避免同一翻译簇重复计数。
    -   `全部内容` 口径按 `publishedAt` 优先、缺失时回退 `createdAt`；`仅公开内容` 口径只统计 `status=published && visibility=public`。
    -   阅读量来自 `post_view_hourly` 的小时级事件聚合并按请求时区折叠自然日；评论量按 `Comment.createdAt` 聚合；发文量按 `publishedAt` 优先、缺失时回退 `createdAt`。
-   **排行**:
    -   热门文章：按当前时间窗口内的真实阅读事件优先、评论事件次级、标题稳定排序。
    -   热门标签 / 分类：聚合当前时间窗口内代表版本文章的真实阅读事件、评论事件与文章数。

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

#### 3.4.1 当前实现边界 (2026-03)

-   当前后台 Markdown 编辑器统一通过 `components/admin/mavon-editor-client.client.vue` 以 `ClientOnly + defineAsyncComponent` 的方式加载 `mavon-editor@3.0.2`，不再使用全局插件注册。
-   当前共有 3 个直接消费场景：文章编辑页、营销活动内容表单、协议内容编辑表单。其中文章编辑页是最高风险入口，因为它同时叠加了自动保存、版本恢复、翻译工作流、语音输入和发布分发能力。

#### 3.4.2 兼容性根因结论

-   **结论**: 当前阶段应继续修复并收敛现有 `mavon-editor` 接入，不直接进入整体替换；仅在候选方案通过完整功能矩阵与灰度闸门后，才进入替换验证。
-   **根因 1: 框架耦合口径偏旧**。现有包装层仍需依赖纯客户端渲染、动态导入和宽松的 `any` 兼容写法，说明它与 Nuxt 4 / Vue 3 的集成并非项目内原生一等公民，而是经过兼容性包裹后勉强接入。
-   **根因 2: 上传回填契约被库实例方法锁定**。文章编辑器上传链路直接依赖 `$img2Url` 将远端 URL 回填到编辑区；只要替换编辑器，这条契约就必须先被抽象，否则图片上传会先回退。
-   **根因 3: 样式系统未真正纳入主题层**。当前仅在宿主页面对 `.v-note-wrapper` 做边框、圆角和 `z-index` 收口，编辑器内部工具栏、预览区和暗色样式仍由第三方 CSS 主导，未进入 PrimeVue 主题变量与 CSS Layer 的统一治理。
-   **根因 4: 回归面大于“一个输入框”**。文章编辑器本身还承载 AI 标题、翻译、历史版本、语音输入、设置侧栏和发布分发交互，替换风险是整个创作链路回归，而不是单一富文本区域替换。

#### 3.4.3 功能矩阵与当前判定

| 能力项 | 当前状态 | 证据与说明 | 风险判定 |
| :--- | :--- | :--- | :--- |
| 工具栏 | 已接入 | 文章编辑页使用默认工具栏；营销表单显式声明工具栏集合；协议页保留基础编辑能力 | 中 |
| 双栏预览 | 已接入 | `mavon-editor` 默认 `subfield=true`，文章与营销场景沿用该默认行为 | 中 |
| 全屏 | 已接入但缺回归 | 营销表单显式开启 `fullscreen`；文章页依赖默认工具栏能力，但项目内暂无自动化验证 | 中 |
| 图片上传回填 | 仅文章页稳定接入 | 通过 `@img-add` 触发上传，并依赖 `$img2Url` 写回内容；营销和协议场景未接入回填链路 | 高 |
| 快捷插入 / 快捷键 | 库能力存在，项目回归缺失 | 当前依赖编辑器内建快捷键和工具栏插入，但项目未建立跨平台、跨输入法验证 | 中 |
| 暗色模式 | 部分收口，未达稳定 | 宿主容器已接入站点主题变量，但编辑器内部样式仍以第三方默认 CSS 为主，缺少系统化暗色校验 | 高 |

#### 3.4.4 回归清单

1. 文章编辑页首屏渲染、标题与正文双向绑定正常，且不引入额外 SSR/水合告警。
2. 工具栏核心动作可用：标题、粗体、列表、引用、链接、表格、预览切换。
3. 双栏预览、全屏、阅读模式与工具栏开关不遮挡右侧设置抽屉、历史面板和顶部操作区。
4. 图片上传、拖拽上传和上传后内容回填链路保持可用，且不丢失现有存储路径治理。
5. AI 标题、翻译工作流、语音输入、格式化按钮与编辑器正文互操作正常。
6. 自动保存恢复、历史版本回滚、发布分发弹窗与编辑器并行交互不出现焦点错乱或内容覆盖。
7. 营销活动编辑表单和协议编辑表单在桌面端与暗色模式下样式无明显错位。
8. 至少补齐文章编辑器上传契约测试，并为双栏 / 全屏 / 暗色模式建立最小烟雾验证。

#### 3.4.5 渐进替换预案

-   **阶段 0: 先收口现有接入**。保留 `mavon-editor` 为默认实现，优先抽象统一包装层（如 `AdminMarkdownEditor`）和上传回填适配接口，禁止新的业务页面继续直接依赖编辑器实例私有方法。
-   **阶段 1: 候选方案灰度验证**。若需要进入替换验证，优先验证原生 Vue 3 取向的 Markdown 编辑器。当前调研中，`md-editor-v3` 更接近项目栈，具备 Vue 3 + TypeScript、主题、上传、预览和快捷键能力；`@kangc/v-md-editor@next` 可作为次选，但其发布节奏相对更慢。
-   **阶段 2: 单入口灰度**。只允许先在文章编辑页引入显式灰度开关（例如 query / runtime flag / admin setting），营销和协议场景继续沿用旧实现，避免一次替换三个入口。
-   **阶段 3: 可一键回退**。灰度期间必须保留旧包装层与数据契约，保证关闭开关即可回退到 `mavon-editor`，不得在首轮灰度中删除旧实现。

#### 3.4.6 进入替换验证的闸门

-   候选编辑器必须覆盖当前功能矩阵的所有高风险项，尤其是图片上传回填、双栏预览、全屏和暗色模式。
-   新旧编辑器必须先共享统一的上传回填和内容读写适配层，不能继续把业务逻辑绑定到某个库的实例私有 API。
-   至少完成文章编辑器的定向自动化回归，并补一条营销表单或协议表单的烟雾验证，避免替换只覆盖主入口。
-   若任一高风险项需要 DOM 打补丁、手写兼容脚本或额外样式兜底才能工作，则当前阶段判定为“不进入替换”，继续修复现有接入。

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

### 5.4 内容洞察 (Content Insights)

-   `GET /api/admin/content-insights`
    -   **Query**: `range=7|30|90`, `scope=all|public`, `contentLanguage`, `timezone`
    -   **Auth**: `admin` 查看全量内容，`author` 自动收敛为本人内容。
    -   **Response**: 返回窗口汇总指标、按请求时区折叠的 `summaries[].trend` 日趋势、热门文章 / 标签 / 分类排行，以及实际使用的时区与过滤口径。

### 5.5 内容洞察真实趋势实现（小时级稀疏聚合）

#### 5.5.1 准入结论

-   **结论**: 已按当前 P1 范围落地为小时级稀疏聚合方案。
-   **目标**: 将后台首页中的“阅读量趋势”升级为“最近 N 天真实新增阅读事件趋势”。
-   **约束**:
    -   必须兼容多时区展示，不能把单一服务器时区的自然日误当成所有用户的日界线。
    -   不引入逐次 pageview 明细表，避免零阅读日或高流量文章导致历史数据体量失控。
    -   继续复用现有 `pvCache` 批量写回链路，避免把高频读请求改回逐次写库。

#### 5.5.2 设计结论

-   **采用方案**: 小时级稀疏聚合表。
-   **核心思想**:
    -   写入层只记录“发生过阅读”的 UTC 小时桶，不为零阅读小时写记录。
    -   查询层按请求传入的时区，把 UTC 小时桶重新折叠为“用户视角下的自然日”趋势。
    -   公开趋势与全部内容趋势共享同一套阅读历史表，公开状态过滤在查询文章范围时完成，而不是复制一份公开专用历史。

#### 5.5.3 数据模型

-   **新增实体建议**: `server/entities/post-view-hourly.ts`
-   **建议表名**: `post_view_hourly`
-   **字段建议**:
    -   `id`: 复用基础实体 Snowflake 主键。
    -   `postId`: 文章 ID，非空，索引。
    -   `bucketHourUtc`: UTC 小时桶起始时间，例如 `2026-04-18T10:00:00.000Z`，非空，索引。
    -   `views`: 当前小时桶累计阅读数，非空，默认 `0`。
    -   `createdAt` / `updatedAt`: 复用基础实体时间列。
-   **唯一约束建议**:
    -   `(postId, bucketHourUtc)` 唯一，确保 flush 时可以安全 upsert / increment。
-   **索引建议**:
    -   `(postId, bucketHourUtc)` 唯一索引。
    -   `(bucketHourUtc)` 普通索引，用于全局范围趋势查询。
-   **不建议新增字段**:
    -   不存 `timezone`，因为时区只是查询时的折叠视角，不是事件事实。
    -   不存 `date_local` / `hour_local`，避免同一事实在多时区下重复膨胀。

#### 5.5.4 写入链路设计

-   **现状**:
    -   [server/api/posts/[id]/views.post.ts](server/api/posts/%5Bid%5D/views.post.ts) 调用 [server/utils/pv-cache.ts](server/utils/pv-cache.ts) 记录阅读。
    -   `pvCache.flush()` 当前会同时把聚合后的增量写回 `Post.views` 与 `post_view_hourly`。
-   **当前写入口径**:
    -   `record(postId)` 默认仍然只做内存 / Redis 缓冲；仅在无 Redis 的 serverless 回退分支里，会直接事务写入 `Post.views` 与 `post_view_hourly` 以避免丢数。
    -   `flush()` 在拿到待刷入增量后，同时完成两件事：
        -   `Post.views += count`
        -   `post_view_hourly(postId, bucketHourUtc).views += count`
-   **关键改造点**:
    -   `pvCache` 当前只按 `postId -> count` 聚合，需要升级为按 `(postId, bucketHourUtc) -> count` 聚合。
    -   Redis key 也从 `buf:${postId}` 升级为 `buf:${bucketHourUtc}:${postId}` 或等价可拆分结构。
    -   flush 时建议先按小时桶聚合，再批量 upsert，避免同一轮 flush 内重复命中相同行。
-   **时间桶口径**:
    -   统一使用 `dayjs().utc().startOf('hour')` 作为事实桶。
    -   无论请求来自哪个用户时区，写入都只认 UTC 小时桶，展示时再折叠。

#### 5.5.5 查询与展示设计

-   **读取范围**:
    -   `7 / 30 / 90` 天趋势查询时，先把用户请求时区对应的自然日窗口转换为 UTC 边界。
    -   从 `post_view_hourly` 中查询该 UTC 范围内的小时桶，再按目标时区折叠成天。
-   **折叠逻辑**:
    -   例：用户时区为 `Asia/Tokyo`，则 `2026-04-18 00:00~23:59 JST` 会映射到一段 UTC 小时区间；服务端聚合时用同一时区把每个 `bucketHourUtc` 转回本地日期后求和。
    -   缺失的天在 API 层补 `0`，而不是落库存零值行。
-   **排行逻辑**:
    -   热门文章 / 标签 / 分类的“趋势窗口阅读量”当前已改为聚合 `post_view_hourly` 在窗口内的新增值，而不是继续使用 `Post.views` 总量。
    -   当前接口中的排行数值默认表示所选窗口内的新增事件值。
-   **评论趋势**:
    -   评论已有 `createdAt`，优先直接按 `Comment.createdAt` 聚合，不新增评论历史表。
    -   若后续要支持“评论被删除 / 审核状态变化”带来的回放一致性，再单独评估评论小时聚合表。

#### 5.5.6 性能与数据量控制

-   **稀疏存储**:
    -   只有发生阅读的小时才写行；零阅读小时不落库。
    -   即使 90 天窗口要展示 90 个自然日，存储层也不需要 90 * 24 个固定桶。
-   **写放大控制**:
    -   继续通过 `pvCache` 合并同一小时同一文章的增量，再统一 flush。
    -   若单篇文章在一小时内有大量访问，最终只会形成一条小时桶 upsert，而不是 N 次插入。
-   **查询体量控制**:
    -   后台首页默认只查最近 `90` 天内的小时桶，避免无界扫描。
    -   可先按文章范围过滤，再关联 `post_view_hourly` 聚合，减少无关小时桶读取。
-   **归档策略（可选）**:
    -   第一阶段不强制做归档或降采样。
    -   若后续数据量增长明显，可新增离线任务把超过 `180` 或 `365` 天的小时桶汇总进日表，再删除旧小时桶。

#### 5.5.7 受影响文件清单

-   `server/entities/post-view-hourly.ts`: 新增小时级阅读聚合实体。
-   `server/utils/pv-cache.ts`: 将缓存键从单 `postId` 升级为 `(postId, bucketHourUtc)` 聚合，并在 flush 时同时写总量与小时桶。
-   `server/plugins/pv-flush.ts`: flush 调度逻辑可保持不变，但要复用新的小时桶写入实现。
-   `server/api/admin/content-insights.get.ts`: 查询真实趋势时改读 `post_view_hourly`。
-   `server/utils/admin-content-insights.ts`: 新增趋势序列聚合逻辑，并把阅读指标从累计总量拆成 `totalViews` 与 `windowViews` 的清晰口径。
-   `types/admin-content-insights.ts`: 响应结构需要新增 `dailyViewTrend` 或等价趋势字段。
-   `server/api/posts/[id]/views.post.ts`: 保持请求路径不变，但返回值说明仍是“当前累计阅读数估计值”。
-   `docs/design/modules/admin.md`：同步真实趋势设计口径；若后续存在专项治理或阶段任务，再分别落到 `docs/design/governance/` 与 `docs/plan/todo.md`。

#### 5.5.8 风险与回退

-   **风险 1**: 若直接把当前 `pvCache` 的 key 结构改掉，Redis 中旧格式缓冲值可能残留，需要设计一次兼容读取或清理窗口。
-   **风险 2**: 后台首页若同时查文章、标签、分类和小时趋势，查询复杂度会上升，需要优先控制 90 天范围和文章集大小。
-   **风险 3**: 若先做“小时桶趋势”但 UI 文案仍写“阅读量”，用户可能混淆新增阅读与总阅读，需要同步文案说明。
-   **回退策略**:
    -   若小时级趋势链路未通过验证，可继续保留第一版 `Post.views` 累计口径，不影响现有看板可用性。
    -   `Post.views` 总量字段继续作为权威累计值，不因趋势表失败而回退整条阅读计数链路。
