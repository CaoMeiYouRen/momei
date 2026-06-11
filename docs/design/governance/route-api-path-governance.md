# 页面与 API 路径规范化治理

> 生成日期: 2026-06-11  
> 基线: pages/ 46 routes, server/api/ ~120 endpoints

## 1. 页面 ↔ API 路径映射清单

### 1.1 前台公开路由

| Page Route | API Endpoint(s) | 一致性 |
|:---|:---|:---|
| `/` (index) | `GET /api/posts/home` | ✅ 语义一致 |
| `/posts` | `GET /api/posts`, `GET /api/posts/archive` | ✅ REST |
| `/posts/:id` | `GET /api/posts/:id`, `GET /api/posts/:id/comments` | ✅ REST |
| `/categories` | `GET /api/categories` | ✅ 一致 |
| `/categories/:slug` | `GET /api/categories/:slug` | ✅ 一致 |
| `/tags` | `GET /api/tags` | ✅ 一致 |
| `/tags/:slug` | `GET /api/tags/:slug` | ✅ 一致 |
| `/archives` | `GET /api/posts/archive` | ⚠️ 路由路径不一致：`/archives` ≠ `/api/posts/archive` |
| `/friend-links` | `GET /api/friend-links`, `GET /api/friend-links/meta`, `GET /api/friend-links/feed` | ✅ 模块一致 |
| `/about` | (无专用 API，使用 settings public) | — |
| `/search` | `GET /api/search` | ✅ 一致 |
| `/feedback` | (无专用 API) | — |
| `/submit` | `GET /api/submissions` (public?), `POST /api/posts/submissions` | ⚠️ 杂乱 |
| `/settings` | `GET /api/settings/commercial`, `GET /api/settings/public`, `GET /api/settings/theme` | ✅ 一致 |

### 1.2 后台管理路由

| Page Route | API Endpoint(s) | 一致性 |
|:---|:---|:---|
| `/admin` | `GET /api/admin/content-insights` | ✅ 一致 |
| `/admin/posts` | `GET/POST /api/admin/posts` | ✅ REST |
| `/admin/posts/:id` | `GET/PUT/DELETE /api/admin/posts/:id` | ✅ REST |
| `/admin/calendar` | 无专用 calendar API (复用 posts 端点) | ⚠️ 无专用端点 |
| `/admin/categories` | `GET/POST/DELETE/PUT /api/admin/categories` | ✅ REST |
| `/admin/tags` | `GET/POST/DELETE/PUT /api/admin/tags` | ✅ REST |
| `/admin/comments` | `GET/PUT/DELETE /api/admin/comments` | ✅ REST |
| `/admin/submissions` | `GET/DELETE /api/admin/submissions` | ✅ REST |
| `/admin/subscribers` | `GET/PUT/DELETE /api/admin/subscribers` | ✅ REST |
| `/admin/friend-links` | `GET/POST /api/admin/friend-links`, `GET /api/admin/friend-link-categories` | ⚠️ categories 路径不在 friend-links 子路经 |
| `/admin/snippets` | `GET/POST/DELETE/PUT /api/admin/snippets` | ✅ REST |
| `/admin/ai` | `GET/POST/DELETE /api/admin/ai/tasks`, `GET /api/admin/ai/stats` | ✅ REST |
| `/admin/users` | (user 端点) | — |
| `/admin/settings` | `GET/PUT /api/admin/settings` | ✅ 一致 |
| `/admin/marketing` | `GET/POST /api/admin/marketing/campaigns` | ✅ REST |
| `/admin/notifications` | `GET /api/admin/notifications/delivery-logs` | ✅ REST |

## 2. 发现的不一致项

### P0 — 路径不一致

| # | 问题 | 具体 | 影响 |
|:---|:---|:---|:---|
| 1 | **Archives 路由命名偏移** | Page: `/archives`, API: `/api/posts/archive` | 一个用名词 "archives"，另一个用 "archive"。命名应统一。 |
| 2 | **友链分类不在子路径** | API: `/api/admin/friend-link-categories` 而非 `/api/admin/friend-links/categories` | 分类是友链的子资源，应嵌套 |

### P1 — 风格不一致

| # | 问题 | 具体 |
|:---|:---|:---|
| 3 | `calendar.vue` 平面文件 vs 目录模式 | `admin/calendar.vue` 而 `admin/waitlist/index.vue` 使用目录 |
| 4 | 无专用 calendar API | 日历页依赖通用 posts 端点，无 `/api/admin/calendar` |

### P2 — 命名偏差

| # | 问题 | 具体 |
|:---|:---|:---|
| 5 | Submit 端点混乱 | `POST /api/posts/submissions` vs 页面 `/submit` — 路径不一致 |

## 3. 标准化规则（冻结）

### 3.1 页面路径规则

1. **目录优先模式**: 所有 `pages/admin/` 下路由统一使用 `<name>/index.vue`，不再使用 `<name>.vue` 平面文件。
2. **REST 语义命名**: 资源用复数 (posts, tags, categories)；操作单独处理 (settings, dashboard)。
3. **动态路由**: `[id].vue` 代表单资源操作，子资源通过目录组织。

### 3.2 API 路径规则

1. **模块前缀一致**: 管理端点统一使用 `/api/admin/<resource>`。
2. **子资源嵌套**: 如果 X 是 Y 的子资源，端点应为 `/api/.../y/:yId/x`（如 `/admin/posts/:id/versions`）。
3. **动作端点**: 非 CRUD 动作使用 `POST /api/<resource>/<action>`（如 `/admin/posts/:id/distribution`）。
4. **命名约定**: 全部使用 kebab-case，复数为标准 CRUD 资源。

### 3.3 迁移优先级

| 优先级 | 项目 | 影响 | 迁移难度 |
|:---|:---|:---|:---|
| **1 (本阶段)** | `calendar.vue` → `calendar/index.vue` | 纯重命名，无行为变化 | **低** |
| **2 (本阶段)** | archives 命名对齐 | API 端点重命名需前端配合 | 中 |
| **3 (下阶段)** | 友链分类路径嵌套 | 需重建 API 路由并保留旧路径兼容 | 高 |

## 4. 样板验证

### 4.1 样板 1: admin/posts 模块

- Page: `/admin/posts` 和 `/admin/posts/:id` 使用目录/动态路由模式 ✅
- API: `GET/POST/PUT/DELETE /api/admin/posts` + 子动作端点 ✅
- 结论: **符合规范**，作为标准样板。

### 4.2 样板 2: admin/friend-links 模块

- Page: `/admin/friend-links` 使用 `index.vue` ✅
- API: `GET/POST/PUT/DELETE /api/admin/friend-links` + 子端点 ✅
- 问题: 友链分类 endpoint 在 `/api/admin/friend-link-categories` (非嵌套) ⚠️
- 结论: **部分符合**，分类路径需后续调整。

### 4.3 样板 3: admin/calendar 模块

- Page: `/admin/calendar.vue` (平面文件风格) ❌
- API: 无专用端点 (依赖 posts) ⚠️
- 结论: **待修正** — `calendar.vue` → `calendar/index.vue`（P0 修复）。
