# 创作者数据统计增强 — 专项设计

本文档定义第三十三阶段唯一新增功能「创作者数据统计增强」的设计，作为 `GET /api/admin/creator-stats` 与后台统计页的唯一事实源。进入代码实现前，本文档必须完成首版指标集合、权限口径与数据源边界三项结论冻结。

## 1. 背景与定位

### 1.1 决策来源

- Phase 28 已落地后台内容洞察首页（`/admin`），提供阅读量 / 评论量 / 发文量趋势与热门排行。
- Phase 32 归档结论指出，当前能力更偏「内容窗口表现」，缺少「创作者经营视角」的产出趋势与分发效果汇总。
- Backlog #12（创作者数据统计增强）已具备明确后续上收条件，本轮正式上收为 Phase 33 唯一新增功能。
- 现有 `/api/admin/content-insights` 已内置 `author` 角色过滤——作者看到的阅读量 / 评论量 / 排行即为本人数据，无需重复实现。

### 1.2 本轮定位

本设计只做「创作者经营视角」的轻量统计增强：在 `/admin` 现有内容洞察基础上增加创作者统计 tab，提供**发文产出趋势**和**分发效果概览**。同时，该 tab 也展示作者视角的**内容窗口表现**（阅读量、评论量、热门排行——复用现有 `content-insights` API）。不另起 BI 系统，不引入埋点基础设施，不覆盖来源归因与订阅转化漏斗。

## 2. 首版指标集合（结论 1：已冻结）

### 2.1 必做指标（新增 API `creator-stats`）

| 指标 | 数据源 | 聚合方式 |
|------|--------|---------|
| **发文趋势**（按周 / 月） | `Post.publishedAt` | 按 `publishedAt` 归入周桶或月桶，统计 `COUNT(DISTINCT COALESCE(translationId, id))` |
| **分发成功率 — WechatSync** | `Post.metadata` JSONB（路径见 §5.4） | 按周统计：`succeeded / (succeeded + failed)`，`total` = `succeeded + failed`（不包含 `delivering` / `cancelled` / `idle` 等中间态） |
| **分发成功率 — 远程仓库同步** | `Post.metadata` JSONB（路径见 §5.4） | 按周统计：`lastSyncedAt` 不为空 = succeeded，`lastFailureAt` 不为空 = failed，同周取最后一次操作；`total` = `succeeded + failed` |
| **草稿存量** | `Post.status = 'draft'` | `SELECT COUNT(*) FROM post WHERE status = 'draft'`；`author` 模式追加 `AND authorId = ?`；始终为当前过滤作者的聚合标量 |
| **已发布文章总数** | `Post.status = 'published'` | `SELECT COUNT(*) FROM post WHERE status = 'published'`；`author` 模式追加 `AND authorId = ?`；翻译簇去重 |

### 2.2 必做指标（复用现有 API `content-insights`）

| 指标 | 来源 | 说明 |
|------|------|------|
| **阅读量 / 评论量趋势** | `GET /api/admin/content-insights`（已有） | 该 API 已内置 `requireAdminOrAuthor` 中间件，`author` 角色自动按本人过滤 |
| **热门文章 / 标签 / 分类排行** | `GET /api/admin/content-insights`（已有） | 同上，ranking 数据天然为作者本人维度 |

### 2.3 延后观察指标（本轮不做）

| 指标 | 延后原因 |
|------|---------|
| 来源渠道归因（UTM / referrer） | 需要新增埋点基础设施，不在本轮范围 |
| 订阅转化率 | 需要跨表关联 `subscriber` 表，且口径定义复杂 |
| 读者留存 / 回访率 | 需要用户级别阅读追踪，无现有数据管道 |
| 平均阅读时长 | 未实现阅读时长埋点 |
| 单篇文章分发详情时间线 | 现有 `Post.metadata.integration.distribution.timeline` 已可用，但按篇展开不在首版范围 |

### 2.4 指标粒度与时间窗口

- 时间窗口：`7d` / `30d` / `90d`（与现有内容洞察 `range` 参数一致）
- 默认窗口：`30d`
- 发文趋势聚合粒度：`range = 7d` 或 `30d` 时按**周**聚合，`range = 90d` 时按**月**聚合（响应中通过 `aggregationGranularity` 字段显式声明）
- 分发成功率始终按**周**聚合（分发事件密度低，按月聚合易出现大量零桶）
- 时间戳字段 `periodStart` 为 ISO 日期字符串（周：周一，月：月初）

## 3. 权限与口径边界（结论 2：已冻结）

### 3.1 权限模型

| 角色 | `creator-stats` 可见范围 | `content-insights` 可见范围 |
|------|------------------------|---------------------------|
| `admin` | 全站汇总（可选按 `authorId` 过滤） | 全站汇总 |
| `author` | 仅本人数据 | 仅本人数据（API 已内置） |

实现方式：
- `creator-stats`：复用 `requireAdminOrAuthor` 中间件；`author` 模式下自动按 `event.context.user.id` 过滤；`author` 角色传入 `authorId` 参数时静默忽略（不回 403，不在 Zod 层校验，在 API handler 中用 `isAdmin()` 守卫跳过非 admin 的 `authorId`）
- `content-insights`：已有逻辑不变

### 3.2 翻译簇去重

- 发文趋势与已发布总数：同一 `translationId`（或同一 `slug` + 不同 `language`）的多语言版本计为 **1 篇**（按最早 `publishedAt` 为准）
- 分发成功率：按**每篇**独立统计（不同语言版本可能有独立的分发状态，且分布在不同时间点）
- 草稿存量：按翻译簇去重

### 3.3 状态过滤

- 发文趋势和分发成功率：只统计 `status = 'published'` 的文章
- 草稿存量：只统计 `status = 'draft'` 的文章
- `hidden` / `rejected` / `scheduled` / `pending` 状态的文章不纳入统计

### 3.4 时区

- 复用 `server/utils/admin-content-insights.ts` 中已有 `resolveAdminContentInsightsTimeZone()`（验证 IANA 时区 + 默认回退 UTC）
- API 支持 `?timezone=` 参数，默认 `UTC`

## 4. 与现有内容洞察的关系（结论 3：已冻结）

### 4.1 数据源对照

| 维度 | 现有内容洞察 (`/api/admin/content-insights`) | 新增创作者统计 (`/api/admin/creator-stats`) |
|------|---------------------------------------------|-------------------------------------------|
| 视角 | 内容窗口表现（阅读量、评论量、热门排行） | 创作者经营视角（产出趋势、分发效果） |
| 核心指标 | views / comments / posts 趋势 + 排行 | 发文趋势、分发成功率、草稿存量、已发布总数 |
| 受众 | 管理员看内容健康度 / 作者看个人表现 | 作者看个人产出 + 管理员看全局产出 |
| 数据源 | `post_view_hourly`、`comment`、`post` | `post`（publishedAt、status、`metadata` JSONB） |

### 4.2 复用策略

- **复用 `content-insights` 端点**：创作者统计页同时调用两个 API（`creator-stats` + `content-insights`），`content-insights` 提供阅读量 / 评论量 / 排行，`author` 角色天然看到本人数据，无需在 `creator-stats` 中重复实现视图聚合
- **复用时区解析**：`server/utils/admin-content-insights.ts` 中 `resolveAdminContentInsightsTimeZone()`
- **复用认证中间件**：`requireAdminOrAuthor`
- **复用 `pvCache`**：不新增视图埋点
- **复用样式变量与设计令牌**：新卡片沿用 BEM 命名和既有 CSS 变量

### 4.3 前端数据流

```
创作者统计 Tab（新增）
├── [调用 creator-stats API]  → 发文趋势、分发成功率、草稿存量、已发布总数
│    └── 展示卡片：使用纯值型 CreatorMetricCard { label, value, icon, iconBg }
└── [调用 content-insights API] → 阅读量/评论量趋势、热门排行（已有）
     └── 展示卡片：复用现有 AdminDashboardMetricCard { total, previousTotal, delta, deltaRate }
```

关键设计决策：创作者统计卡片不强行适配 `AdminDashboardMetricCard`（其要求 `delta/deltaRate` 前后期对比字段）。新建 `CreatorMetricCard` 组件，props 为 `{ label: string, value: number | string, icon?: string, iconBg?: string }`——简洁的值展示卡片，与现有 AI Stats 卡片风格一致。

### 4.4 独立新增

- **新增 API endpoint**：`GET /api/admin/creator-stats`（不修改现有 `content-insights` 端点）
- **新增聚合 utility**：`server/utils/creator-stats.ts`（不修改 `admin-content-insights.ts`）
- **新增加载 composable**：`composables/use-creator-stats-page.ts`
- **新增卡片组件**：`components/admin/dashboard/creator-metric-card.vue`（纯值型）
- **新增后台 tab**：在 `/admin/index.vue` 中包裹 `<Tabs>` 重构（参考 `/admin/ai` 模式）

## 5. API 设计

### 5.1 Endpoint

```
GET /api/admin/creator-stats
```

### 5.2 Query Parameters

| 参数 | Zod 校验 | 默认值 | 说明 |
|------|---------|--------|------|
| `range` | `z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))` | `30` | 时间窗口（天）。客户端传字符串，Zod `coerce` 转为 number。响应中以数字返回。 |
| `timezone` | `z.string().default('UTC')` | `'UTC'` | IANA 时区 |
| `authorId` | `z.string().uuid().optional()` | 当前用户 | `admin` 可按此过滤；`author` 角色传入时 handler 层静默忽略 |

### 5.3 Response

```typescript
interface CreatorStatsResponse {
    range: 7 | 30 | 90
    timezone: string
    aggregationGranularity: 'week' | 'month'   // 显式声明聚合粒度
    // 发文产出
    publishing: {
        totalPublished: number           // 已发布文章总数（翻译簇去重）
        draftCount: number               // 草稿存量（当前过滤作者的聚合标量）
        trend: PublishingTrendPoint[]    // 按周或月聚合
    }
    // 分发效果
    distribution: {
        wechatsync: DistributionChannelStats | null     // null = 渠道未启用/无数据
        hexoRepositorySync: DistributionChannelStats | null
    }
    generatedAt: string
}

interface PublishingTrendPoint {
    periodStart: string  // ISO 日期（周一或月初）
    count: number         // 该周期内发布数（翻译簇去重）
}

interface DistributionChannelStats {
    enabled: boolean              // 站点是否配置了该渠道（查 settings 表，非数据推断）
    overallSuccessRate: number    // 0-1，所选窗口内整体成功率；无事件时返回 0
    trend: DistributionTrendPoint[]
}

interface DistributionTrendPoint {
    periodStart: string  // ISO 日期（周一）
    total: number         // succeeded + failed（不含进行中/已取消）
    succeeded: number
    failed: number
}
```

### 5.4 实现要点

1. **发文趋势**：`SELECT DATE_TRUNC('week', publishedAt)` + `COUNT(DISTINCT COALESCE(translationId, id))`，按 `publishedAt` 过滤时间窗口。`aggregationGranularity` 根据 `range` 选择：`7d` 或 `30d` → `'week'`（`DATE_TRUNC('week', ...)`），`90d` → `'month'`（`DATE_TRUNC('month', ...)`）。按 `range` 切换聚合函数而非固定为 `week`。
2. **分发成功率 — WechatSync**（参考类型定义 `types/post.ts:196` `PostDistributionChannelState`）：读取 JSONB 路径 `metadata -> 'integration' -> 'distribution' -> 'channels' -> 'wechatsync'`，提取 `lastSuccessAt` / `lastFailureAt`，按事件时间归入周桶。`total` = `succeeded + failed`，不包含 `delivering` / `cancelled` / `idle` 中间态。
3. **分发成功率 — Hexo 同步**（参考类型定义 `types/post.ts:201` `PostHexoRepositorySyncState`）：读取 JSONB 路径 `metadata -> 'integration' -> 'hexoRepositorySync'`，提取 `lastSyncedAt` / `lastFailureAt`，同周取最后一次操作。NULL 时间戳的文章不纳入该周统计（不产生零值桶，空桶直接省略）。
4. **草稿存量**：`SELECT COUNT(*) FROM post WHERE status = 'draft'`，`author` 模式追加 `AND authorId = ?`。始终返回标量 `number`——对于 `author` 是本人草稿数，对于 `admin`（未指定 `authorId`）是全站草稿总数。
5. **分发统计 JSONB 查询性能**：优先用 `metadata ->> 'integration' IS NOT NULL` 预过滤，减少全表 JSONB 路径扫描。TypeORM 不支持 JSONB 路径聚合，需使用原生 SQL 片段（`createQueryBuilder().select(rawSql)`）。含分发字段且 `publishedAt` 在窗口内的文章预计远少于全表，首轮不做索引优化。
6. **`enabled` 字段计算**：读取 settings 配置键 `HEXO_SYNC_ENABLED`（远程仓库）和 `WECHATSYNC_ENABLED`（如有对应设置），不通过数据存在性推断。若设置表中不存在对应 key，默认 `enabled: false`。

## 6. 前端设计

### 6.1 页面结构（新增 tab，重构 `/admin/index.vue`）

```
/admin
├── <Tabs>（新增，参考 /admin/ai/index.vue 模式）
│   └── <TabList>
│       ├── <Tab value="insights">内容洞察</Tab>
│       └── <Tab value="creator">创作者统计</Tab>
│   └── <TabPanels>
│       ├── <TabPanel value="insights">
│       │   └── [现有 content-insights 全部内容，提取为 <AdminContentInsights /> 组件]
│       └── <TabPanel value="creator">
│           ├── Range 选择按钮行（7d / 30d / 90d）
│           ├── 产出概览行
│           │   ├── CreatorMetricCard: 已发布文章
│           │   ├── CreatorMetricCard: 草稿存量
│           │   ├── CreatorMetricCard: WechatSync 成功率
│           │   └── CreatorMetricCard: Hexo 同步成功率
│           ├── 内容表现区（复用 content-insights API）
│           │   ├── MetricCard 行: 阅读量、评论量、发文量
│           │   └── 排行: 热门文章、标签、分类
│           └── 分发趋势区
│               ├── 发文趋势（按周/月列表）
│               ├── WechatSync 分发趋势（按周列表）
│               └── Hexo 同步趋势（按周列表）
```

**重构范围**：`/admin/index.vue` 当前为单体式内容洞察页（548 行）。需要：
1. 将现有内容洞察 DOM 提取为 `components/admin/dashboard/content-insights-panel.vue`
2. 在 `/admin/index.vue` 外层包裹 `<Tabs>` 组件
3. 新增创作者统计 tab 面板（含上述布局）
4. 风险：重构可能影响现有内容洞察的 PrimeVue 样式和 DOM 层；回退策略为保留原 `/admin/index.vue` 作为 `TabPanel` 的子内容，不做组件提取也可以运行

### 6.2 卡片组件设计

**CreatorMetricCard**（纯值型，新增）：

```typescript
// Props
{
    label: string          // 卡片标签
    value: number | string // 展示值（成功率显示 "85%"）
    icon?: string          // PrimeIcons class
    iconBg?: string        // 背景色调（warm / cool / neutral）
    emptyText?: string     // 无数据时替代文案，默认 "—"
}
```

与 `AdminDashboardMetricCard` 的区别：不要求 `delta` / `deltaRate` / `previousTotal` 前后期对比字段。样式沿用同一套 BEM class 体系（`dashboard-metric-card`）。

**AdminDashboardMetricCard**（不变）：
创作者统计 tab 中的「内容表现区」（阅读量 / 评论量趋势）继续复用此组件——数据来自 `content-insights` API，天然包含 `delta` / `deltaRate`。

### 6.3 不引入图表库

首版趋势展示**不引入第三方图表库**。采用与现有 AI stats 一致的文本 / 列表式展示：
- 发文趋势：按周排列的简单列表，每行显示「MM/DD - MM/DD：X 篇」
- 分发趋势：按周排列的列表，每行显示「MM/DD - MM/DD：成功 Y / 总数 Z」，配合颜色标签（绿：100%，红：<50%，灰：无数据）

若后续需要可视化图表，再评估引入轻量图表库（如 `chart.js`），不在本轮范围。

### 6.4 交互

- Tab 切换复用 PrimeVue `Tabs` 组件（参考 `/admin/ai` 页面）
- `range` 选择复用现有内容洞察的 7 / 30 / 90 天按钮组（两个 tab 共享同一 range 状态）
- `author` 角色不显示 `authorId` 下拉；`admin` 角色可选按作者过滤

## 7. 非目标（边界固化）

| 不做的事项 | 原因 |
|-----------|------|
| 引入图表可视化库 | 首版用文本列表展示趋势，图表延后评估 |
| 来源渠道归因（UTM / referrer） | 无埋点基础设施 |
| 订阅转化漏斗 | 口径复杂，需独立设计 |
| 阅读时长统计 | 无埋点基础设施 |
| 导出 PDF / CSV | 首版只做页面展示 |
| 定时报告邮件 | 不在本轮范围 |
| 修改现有 `content-insights` API | 新增独立端点，不动已有能力 |

## 8. 验证矩阵

| 验证项 | 方法 | 通过标准 |
|--------|------|---------|
| API 空数据响应 | 单元测试（`no published posts` 场景） | 返回空 `trend` 数组 + `totalPublished: 0` |
| 权限隔离 | 单元测试（`author` 只能看自己的） | `author` 模式下 `authorId` 过滤生效，静默忽略传入的 `authorId` |
| `range` 类型转换 | 单元测试（传 `'7'` / `'30'` / `'90'` 字符串） | `z.coerce.number()` 正确转为数字 |
| 时间窗口切换 | 单元测试（7d / 30d / 90d） | 不同窗口返回正确时间范围 + 正确 `aggregationGranularity` |
| 翻译簇去重 | 单元测试（同 cluster 多语言版） | 发文趋势按 cluster 去重，`totalPublished` 不计重复 |
| 分发成功率计算 | 单元测试（succeeded / failed 混合） | 成功率 = `succeeded / total` |
| 无分发事件场景 | 单元测试（`no articles ever synced`） | 返回 `null` channel 或空 `trend`，不抛异常 |
| 浏览器 UI | UI Validator 截图 | Tab 切换正常、卡片数据展示正确、空数据有反馈 |
| 不破坏现有内容洞察 | 回归测试 | 现有 `content-insights.get.test.ts` 全部通过 |

## 9. 相关入口

- [后台内容洞察模块设计](../modules/admin.md)
- [项目路线图（第三十三阶段）](../../plan/roadmap.md)
- [待办事项（第三十三阶段）](../../plan/todo.md)
- [长期规划与积压项 #12](../../plan/backlog.md)
