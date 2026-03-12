# 迁移链接治理与云端资源重写设计 (Migration Link Governance & Cloud Asset Rewrite)

## 1. 概述 (Overview)

第十一阶段的“迁移链接治理与云端资源重写”不再只处理对象存储域名切换，也不再把旧站链接修复拆成多个彼此独立的小工具。当前仓库已经具备以下基础能力：

- `packages/cli` 可以批量导入 Markdown，并把 `permalink` 作为 `slug` 导入。
- `docs/design/modules/storage.md` 已定义 `asset_public_base_url`、对象键前缀和 `POST /api/upload/direct-auth` 的资产访问治理基线。
- 站内公开内容已经具备明确的 canonical 路径模型：文章 `/posts/{slug}`、分类 `/categories/{slug}`、标签 `/tags/{slug}`、归档 `/archives` 以及独立页面路由。

缺口在于：现有能力尚未把“资源 URL、文章内链、分类/标签/归档链接、独立页面和历史 permalink 规则”纳入同一套治理契约，也没有定义 CLI、Open API 与站内服务之间的职责边界。本文件作为本阶段该任务的唯一事实源，用于先冻结范围与契约，再进入后续实现。

## 2. 目标与非目标 (Goals & Non-goals)

### 2.1 目标

- 将迁移治理范围统一收敛为一套可审计、可干跑、可落盘的链接治理模型。
- 明确 CLI、Open API、站内服务三层职责，避免重复解析、重复重写和冲突判定。
- 定义 `dry-run / apply / report` 的最小能力矩阵和输入输出结构。
- 为旧 URL 到新 URL 的映射、redirect seeds、alias 承接和站内静态校验提供统一数据结构。
- 使资源域名迁移与内容链接迁移共享同一份报告与失败处理语义。

### 2.2 非目标

- 本阶段不实现通用外链爬虫，也不把在线探测作为唯一成功条件。
- 本阶段不直接改造前台 UI 路由结构；现有 canonical 路径保持不变。
- 本阶段不承诺自动生成 CDN 或 Web 服务器规则文件的所有方言，只输出通用 redirect seeds。
- 本阶段不把治理范围扩展到后台管理页、登录页、安装页等非迁移关键公开入口。

## 3. 治理范围 (Governed Scope)

| 范围 | 典型来源 | Canonical 目标 | 主要判定依据 |
| :--- | :--- | :--- | :--- |
| 资源 URL | 正文图片、封面图、音频地址、元数据中的附件 URL | 基于 `objectKey` 与 `asset_public_base_url` 计算出的公共地址 | 对象键、受管域名、公共访问前缀 |
| 文章内链 | 旧站绝对链接、站内相对链接、历史 permalink | `/posts/{slug}`，无 slug 时回退 `/posts/{id}` | `slug`、`id`、`translationId`、历史 permalink 规则 |
| 分类链接 | `/categories/{slug}`、旧站分类规则 | `/categories/{slug}` | 分类 `translationId` 优先，`slug` 次之 |
| 标签链接 | `/tags/{slug}`、旧站标签规则 | `/tags/{slug}` | 标签 `translationId` 优先，`slug` 次之 |
| 归档链接 | 年/月归档、旧站年月 permalink | 当前统一收敛到 `/archives` | 归档路由当前仅有总入口，年月作为附加上下文保留在报告中 |
| 独立页面 | `about`、`friend-links`、`feedback`、`submit`、`privacy-policy`、`user-agreement` | 固定页面路由 | `pageKey -> routePath` 映射 |
| 历史 permalink 规则 | Hexo/WordPress/Hugo 风格路径模板 | 对应实体的 canonical 路径或 redirect seed | 规则模板、域名、路径前缀、内容类型 |

范围约束：

- 仅治理受站点控制或可明确判定为“旧站遗留”的链接，不改写第三方外链正文引用。
- 仅治理公开内容和公开资源，不把后台私有地址、鉴权回调地址纳入改写范围。
- 对归档链接，当前 canonical 目标为 `/archives`；若未来引入年/月深链页面，再扩展路由规则，不在本轮提前虚构公开 URL。

## 4. 术语与数据模型 (Terms & Data Model)

### 4.1 核心术语

- `Link Candidate`: 从正文、摘要、元数据或导入清单中抽取出的原始链接。
- `Mapping Seed`: 用于把旧 URL 或旧路径规则解析到新站 canonical 目标的治理种子。
- `Redirect Seed`: 在旧地址不能直接作为新 canonical 地址时，为部署层或站内跳转层导出的承接规则。
- `Governance Report`: 一次治理任务的完整报告，包含统计、差异、失败项和人工确认项。

### 4.2 规范化数据结构

```ts
type GovernanceScope =
    | 'asset-url'
    | 'post-link'
    | 'category-link'
    | 'tag-link'
    | 'archive-link'
    | 'page-link'
    | 'permalink-rule'

type SourceKind = 'absolute' | 'root-relative' | 'relative' | 'path-rule'
type MatchMode = 'exact' | 'prefix' | 'pattern'

type TargetType = 'asset' | 'post' | 'category' | 'tag' | 'archive' | 'page'

interface MappingSeed {
    source: string
    sourceKind: SourceKind
    matchMode: MatchMode
    scope: GovernanceScope
    targetType: TargetType
    targetRef: {
        id?: string
        slug?: string
        translationId?: string
        locale?: string
        objectKey?: string
        pageKey?: 'about' | 'friend-links' | 'feedback' | 'submit' | 'privacy-policy' | 'user-agreement'
        archiveKey?: { year?: number, month?: number }
    }
    redirectMode?: 'rewrite-only' | 'redirect-seed' | 'alias-only'
    notes?: string
}

interface GovernanceIssue {
    code:
        | 'mapping-missing'
        | 'target-not-found'
        | 'domain-out-of-scope'
        | 'redirect-conflict'
        | 'external-unreachable'
        | 'manual-confirmation-required'
    message: string
}

interface GovernanceDiffItem {
    sourceValue: string
    targetValue: string | null
    scope: GovernanceScope
    contentType: 'post' | 'category' | 'tag' | 'page' | 'asset-record'
    contentId: string
    status: 'resolved' | 'rewritten' | 'unchanged' | 'skipped' | 'failed' | 'needs-confirmation'
    issues?: GovernanceIssue[]
}
```

### 4.3 承接规则

- 文章、分类、标签优先使用现有实体事实源解析，即 `translationId` 优先，`slug` 次之。
- 对资源 URL，事实源优先是 `objectKey`；如果历史记录只有绝对地址，则仅在其域名或路径命中受管规则时进入重写流程。
- 对独立页面，不引入任意字符串路由，统一使用 `pageKey` 映射，避免旧站别名直接污染当前页面体系。
- 对旧 permalink 模板，不直接写入实体字段，而是转换为 `MappingSeed` 或 `RedirectSeed`，与内容实体解耦。

## 5. 分层职责边界 (Layer Responsibilities)

| 层级 | 必须负责 | 明确不负责 |
| :--- | :--- | :--- |
| CLI | 本地扫描 Markdown/导出包、抽取候选链接、生成 `MappingSeed`、发起 `dry-run`/`apply`、导出报告 | 不直接写数据库，不自行判定站内 canonical 事实，不绕过站内服务直接重写内容 |
| Open API | 提供认证入口、接收治理请求、返回任务/报告标识、暴露报告查询接口 | 不解析本地文件，不复刻站内路由解析逻辑，不在 API 层内重复执行重写算法 |
| 站内服务 | 解析 canonical 路径、重写正文与元数据、校验资源地址、生成报告、落盘治理结果 | 不直接读取本地迁移目录，不承担 CLI 交互体验，不把部署层 redirect 细节硬编码为单一平台实现 |

边界约束：

- CLI 只能做“输入归一化”和“请求编排”，不能在本地抢先把所有链接改写为最终结果。
- Open API 只负责“受控触发”和“结果传输”，不成为第二个业务编排层。
- 站内服务是唯一允许修改数据库正文、元数据和治理报告状态的执行层。

## 6. 最小能力矩阵 (Minimal Capability Matrix)

| 能力 | CLI | Open API | 站内服务 |
| :--- | :--- | :--- | :--- |
| `dry-run` | 扫描、组装请求、展示 diff 摘要 | 接收请求并返回预览任务 | 解析映射、计算 diff、执行静态校验但不落盘 |
| `apply` | 显式确认后触发执行 | 创建执行任务并返回任务 ID | 按映射重写内容、生成 redirect seeds、记录审计结果 |
| `report` | 拉取并导出 JSON/Markdown 报告 | 返回报告详情/摘要 | 汇总统计、失败项、人工确认项与重试建议 |

最小执行原则：

- `dry-run` 必须先于 `apply`，除非调用方显式携带“已阅读上次 dry-run 报告”的报告 ID。
- `apply` 只对站内受控内容生效；第三方外链探测失败不能单独阻断整个任务。
- `report` 必须可重放读取，不能依赖终端滚动输出作为唯一结果载体。

## 7. 对外契约 (External Contract)

### 7.1 规划中的 Open API 入口

```http
POST /api/external/migrations/link-governance/dry-run
POST /api/external/migrations/link-governance/apply
GET /api/external/migrations/link-governance/reports/:reportId
```

说明：

- 全部复用现有 API Key 鉴权模型。
- `dry-run` 和 `apply` 都使用 `POST`，避免在 query string 中传递复杂种子数据。
- `report` 只读查询使用 `GET`。

### 7.2 请求结构

```ts
interface LinkGovernanceRequest {
    scopes: GovernanceScope[]
    filters?: {
        domains?: string[]
        pathPrefixes?: string[]
        contentTypes?: Array<'post' | 'category' | 'tag' | 'page' | 'asset-record'>
    }
    seeds?: MappingSeed[]
    options?: {
        reportFormat?: 'json' | 'markdown'
        validationMode?: 'static' | 'static+online'
        allowRelativeLinks?: boolean
        retryFailuresFromReportId?: string
        skipConfirmation?: boolean
    }
}
```

约束：

- `validationMode=static` 是默认值；`static+online` 只追加在线探测结果，不改变 canonical 解析口径。
- `filters.domains` 和 `filters.pathPrefixes` 用于分组治理与审计，避免一次任务吞下整个站点。
- `seeds` 允许 CLI 提供补充事实，但不能覆盖站内已确认的 canonical 事实源。

### 7.3 响应结构

```ts
interface LinkGovernanceResponse {
    code: 200
    data: {
        reportId: string
        mode: 'dry-run' | 'apply'
        summary: {
            total: number
            resolved: number
            rewritten: number
            unchanged: number
            skipped: number
            failed: number
            needsConfirmation: number
        }
        items: GovernanceDiffItem[]
        redirectSeeds?: Array<{
            source: string
            target: string
            statusCode: 301 | 302
            reason: 'legacy-permalink' | 'path-rule' | 'asset-domain-migration'
        }>
    }
}
```

## 8. 旧链接映射与承接策略 (Legacy Mapping & Handoff)

### 8.1 文章与历史 permalink

- 如果旧 permalink 可以直接作为当前 `slug`，优先沿用 `slug`，不额外生成 redirect seed。
- 如果旧 permalink 与当前 canonical 路径不同，则正文改写目标使用 canonical 路径，同时导出 redirect seed 作为部署层承接输入。
- 旧规则如 `/yyyy/mm/dd/:slug/`、`/post/:slug/`、`/:slug.html` 不直接写死在代码中，而是作为 `path-rule` 类型种子进入解析器。

### 8.2 分类、标签与翻译簇

- 分类和标签解析优先命中 `translationId`，其次命中 `slug`。
- 若某个翻译成员缺失显式 `translationId`，允许沿用当前代码中的 `slug` 回退策略，但该回退必须在报告中注明，避免静默绑定错误簇。

### 8.3 独立页面

固定 `pageKey` 与当前公开页面路由映射如下：

| `pageKey` | 路由 |
| :--- | :--- |
| `about` | `/about` |
| `friend-links` | `/friend-links` |
| `feedback` | `/feedback` |
| `submit` | `/submit` |
| `privacy-policy` | `/privacy-policy` |
| `user-agreement` | `/user-agreement` |

### 8.4 资源地址

- 资源重写仅对受管域名、受管路径前缀或可解析出 `objectKey` 的 URL 生效。
- 旧域名迁移优先通过 `asset_public_base_url` 完成“零改数据”切换；只有命中硬编码绝对地址且无法被公共前缀覆盖时，才进入批量改写。
- 资源重写与正文内链重写共享同一份报告，但统计口径按 `scope` 分组。

## 9. 校验、失败处理与报告 (Validation, Failure Handling & Reporting)

### 9.1 静态校验

`dry-run` 和 `apply` 都必须包含静态校验：

- 域名是否在治理白名单或旧站域名集合中。
- 目标实体是否存在，且能解析为 canonical 路径。
- 资源 URL 是否能命中对象键或受管公共前缀。
- 是否产生循环重写、重复映射或多目标冲突。

### 9.2 在线探测

- 在线探测只作为可选附加信息，用于标记明显失效的外链或旧域名响应异常。
- 即使在线探测失败，只要静态映射成立，治理任务仍可成功；报告中将该项标记为 `external-unreachable`。

### 9.3 失败处理策略

- `retry`: 仅允许基于已有 `reportId` 重跑失败项，避免重复扫描成功项。
- `skip`: 对已知非阻塞项显式跳过，并保留原因。
- `manual confirmation`: 对多目标冲突、alias 绑定不确定、目标实体缺失但可能稍后导入完成的场景保留人工确认状态。

## 10. 实施拆分与测试计划 (Implementation Breakdown & Tests)

### 10.1 受影响模块

- `packages/cli`: 新增链接治理命令面与报告导出。
- `server/services`: 新增链接治理服务、映射解析、报告落盘与静态校验逻辑。
- `server/api/external`: 新增 `dry-run / apply / report` 外部接口。
- `docs/design/modules/storage.md`: 继续收敛资源 URL 专项规则。
- `docs/design/modules/open-api.md`: 记录外部调用入口与限制。

### 10.2 测试最小集合

- 映射解析单元测试：覆盖文章、分类、标签、页面、资源 URL 和 path-rule。
- 迁移报告集成测试：覆盖 `dry-run`、`apply`、`report` 的统计与失败项输出。
- 典型旧站样本回归测试：至少覆盖资源 URL、文章内链、相对路径、不可访问外链、重复映射冲突五类样例。

## 11. 与现有文档的关系 (Document Relationships)

- 本文档负责“链接治理契约”和“跨层职责边界”。
- `docs/design/modules/storage.md` 继续负责“资源地址解析、对象键与上传模式”。
- `docs/design/modules/migration.md` 继续负责“迁移 CLI 与安装引导”的高层总览。
- `docs/design/modules/open-api.md` 继续负责“外部接口入口与鉴权说明”。

后续开发必须同时满足本文件和上述文档，不允许在任一实现层单独发明另一套治理口径。
