# Phase 44 测试覆盖率缺口分析

> 分析日期: 2026-06-07  
> 基线数据: `pnpm test:coverage` — 478 files passed, 3638 tests passed (statements 79.98%, branches 67.08%)

## 1. 近期迭代新增功能 → 覆盖率映射

| 新增功能 | 核心文件 | 当前覆盖 | 缺口 |
| :--- | :--- | :--- | :--- |
| **友链 RSS 聚合** | `server/services/friend-link-feed.ts` (166 行) | **0%** (未出现在报告中) | 全量缺失 |
| | `server/api/friend-links/feed.get.ts` (~25 行) | **0%** (未出现在报告中) | 全量缺失 |
| | `server/entities/friend-link.ts` → `showRssFeed` 字段 | 100% 行覆盖 | schema 测试不足 |
| **友链管理 showRssFeed** | `pages/admin/friend-links/index.vue` | 59.55% stmts, **16.66% funcs** | Checkbox 交互 + save 链路 |
| | `composables/use-admin-friend-links-page.ts` | 86.75% stmts, 62.29% branch | `showRssFeed` 字段分派 |
| | `utils/schemas/friend-link.ts` | 94.73% stmts | `showRssFeed` 校验路径 |
| | `server/services/friend-link.ts` | 69.37% stmts, 48.98% branch | `saveFriendLinkEntity` 分支 |
| **公开页 RSS 区域** | `pages/friend-links.vue` | 96.12% stmts | feed 渲染 + 空状态 + 错误降级 |
| **ESLint / 类型债治理** | `server/services/ai/gemini-provider.ts` | 26.92% stmts | 整体偏低，非本次引入 |
| **结构复用治理** | 4 组件 → `types/setting.ts` import | 间接 | 需确认 import 路径测试 |
| **i18n 迁移** | `i18n/config/locale-modules.ts` | 88.88% stmts | `resolveLocaleMessageModulesForRoute` 分支 |

## 2. 分级缺口清单

### 🔴 P0 — 零覆盖 / 核心功能无测试

| 文件 | 行数 | 功能 | 风险 |
| :--- | :--- | :--- | :--- |
| `server/services/friend-link-feed.ts` | 166 | RSS/Atom 抓取 + 解析 + 缓存 | 全链路盲区：fetch 超时、XML 解析异常、缓存击穿、空结果 |
| `server/api/friend-links/feed.get.ts` | ~25 | API 端点 + rate-limit | 无集成测试 |

### 🟡 P1 — 分支覆盖不足（branch < 70%）

| 文件 | Branch% | 缺口 |
| :--- | :--- | :--- |
| `server/services/friend-link.ts` | 48.98% | `saveFriendLinkEntity` 各字段分支、`reviewApplication` |
| `composables/use-admin-friend-links-page.ts` | 62.29% | `showRssFeed` 字段在 `resetLinkForm` / `openLinkDialog` / `saveLink` 中未覆盖 |

### 🟢 P2 — 行覆盖可提升

| 文件 | Stmt% | 缺口 |
| :--- | :--- | :--- |
| `pages/admin/friend-links/index.vue` | 59.55% | `showRssFeed` Checkbox toggle + save payload |

## 3. 测试增强计划

### Phase A: RSS 聚合核心（P0，预估 2-3h）

```text
1. server/services/friend-link-feed.test.ts (新文件)
   ├── fetchXml: 正常响应 / 非 2xx / 超时 / 网络错误 / 空 body
   ├── parseRssFeed: RSS 2.0 单条目 / 多条目 / 空 channel
   ├── parseRssFeed: Atom 格式 / 无 entry / 混合 link 类型
   ├── parseDate: 有效 ISO / 无效字符串 / undefined
   ├── extractAtomLink: href 属性 / 纯字符串 / 空数组
   ├── getFriendLinkFeeds: 缓存命中 / 缓存穿透 / 无匹配友链
   ├── getFriendLinkFeeds: 多友链聚合 / 部分抓取失败降级
   └── getFriendLinkFeeds: 排序降序 / 结果截断

2. server/api/friend-links/feed.get.test.ts (新文件)
   ├── 正常返回 FeedItem[]
   ├── 无权限（未登录）→ 401
   └── rate-limit 触发 → 429
```

### Phase B: 友链管理 showRssFeed 链路（P1，预估 1-2h）

```text
3. composables/use-admin-friend-links-page.test.ts (补充)
   ├── resetLinkForm: showRssFeed 初始值为 false
   ├── openLinkDialog: 编辑已有友链时回填 showRssFeed=true
   ├── saveLink: showRssFeed 字段包含在 POST body 中

4. pages/admin/friend-links/index.test.ts (补充)
   ├── Checkbox showRssFeed 渲染 → 打勾/取消

5. utils/schemas/friend-link.test.ts (补充)
   ├── showRssFeed: true / false / 缺失 → 通过 safeParse

6. server/services/friend-link.test.ts (补充)
   ├── createFriendLink 带 showRssFeed=true
   └── updateFriendLink 切换 showRssFeed
```

### Phase C: 公开页 RSS 区域 + 降级（P1-P2，预估 1h）

```text
7. pages/friend-links.test.ts (补充)
   ├── feedItems 正常渲染
   ├── feedItems 为空 → 不显示 section
   ├── formatFeedDate 格式化
   ├── API 返回错误 → 优雅降级（feedItems=[]）
   └── mockFetch 断言已修正（toHaveBeenCalledTimes 2→3 ✓）
```

## 4. 预估投入

| Phase | 新增/补充文件 | 用例数（估） | 预估工时 |
| :--- | :--- | :--- | :--- |
| A — RSS 聚合核心 | 2 新文件 | ~15 | 2-3h |
| B — 管理后台链路 | 4 补充 | ~8 | 1-2h |
| C — 公开页渲染 | 1 补充 | ~5 | 1h |
| **合计** | | **~28** | **4-6h** |

## 5. 风险说明

- `server/services/friend-link-feed.ts` 零覆盖为最 urgent 技术债：任何 RSS 解析逻辑变更均无安全保障。
- 友链管理页面 `showRssFeed` 字段当前通过 `friendLinkSchema.safeParse` 校验，schema 缺失测试意味着字段"静默丢弃"类 bug（如已修复的 `#e29e3750`）可能再次引入。
- 公开页 RSS 区域的错误降级路径无测试覆盖，依赖方变更可能导致页面崩溃。
