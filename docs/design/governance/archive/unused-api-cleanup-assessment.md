# 未使用 API 清单与清理可行性评估

> 生成日期: 2026-06-11
> 基线: ~120 API endpoints, 交叉验证 composables + pages + tests + services

## 1. 评估方法

对全部 server/api/ 端点进行三层交叉验证：

| 验证层 | 搜索范围 | 含义 |
|:---|:---|:---|
| **前端引用** | `composables/` + `pages/` + `components/` | 是否存在前端 fetch 调用 |
| **服务层引用** | `server/services/` + `server/utils/` | 是否存在后端内部调用 |
| **测试覆盖** | `tests/` + `server/api/**/*.test.ts` | 是否存在测试文件 |

满足三层均为 0 的端点标记为「可安全删除」。

## 2. 分级清单

### 2.1 可安全删除（7 个端点）

经三层交叉验证确认，以下端点均无前端调用、无内部引用：

| # | 端点 | 文件 | 测试 | 备注 |
|:---|:---|:---|:---|:---|
| 1 | `DELETE /api/admin/theme-configs/:id` | `admin/theme-configs/[id].delete.ts` | 无 | 主题 CRUD 无前端调用 |
| 2 | `PUT /api/admin/theme-configs/:id` | `admin/theme-configs/[id].put.ts` | 无 | 同上 |
| 3 | `POST /api/admin/theme-configs/:id/apply` | `admin/theme-configs/[id]/apply.post.ts` | 无 | 同上 |
| 4 | `POST /api/admin/notifications/broadcast` | `admin/notifications/broadcast.post.ts` | 无 | 通知广播未启用 |
| 5 | `POST /api/admin/snippets/:id/convert` | `admin/snippets/[id]/convert.post.ts` | 无 | 前端无对应入口 |
| 6 | `POST /api/admin/posts/:id/audit` | `admin/posts/[id]/audit.post.ts` | 无 | AI 审计内嵌编辑器 |
| 7 | `POST /api/admin/marketing/campaigns/test` | `admin/marketing/campaigns/test.post.ts` | 无 | 营销测试邮件未启用 |

### 2.2 观察（2 个端点）

| # | 端点 | 原因 |
|:---|:---|:---|
| 1 | `GET/PUT /api/admin/subscriptions` | 端点存在但无前端调用；web-push.ts 用同名概念但非同一端点 |
| 2 | `POST /api/admin/marketing/campaigns/:id/send` | 有测试（`send.post.test.ts`）但无前端调用；保留至营销功能评估

### 2.3 保留兼容（其余 ~108 个端点）

所有其他端点均有前端引用或测试覆盖，属于活跃使用状态。

## 3. 安全下线候选 — 第 1 组

### 候选端点（9 个）

| 端点 | 评估 | 风险 |
|:---|:---|:---|
| `DELETE/PUT /api/admin/theme-configs/:id` | 主题 CRUD 无前端调用 | 低 — 主题管理走 `admin/settings/theme` 页面 |
| `POST /api/admin/theme-configs/:id/apply` | 主题应用无前端调用 | 低 — 同上 |
| `POST /api/admin/notifications/broadcast` | 广播通知无调用 | 低 — 通知功能未启用 Push |
| `POST /api/admin/marketing/campaigns/:id/test` | 营销测试邮件 | 中 — 营销功能未完整实现 |
| `POST /api/admin/marketing/campaigns/:id/send` | 营销发送 | 中 — 同上 |
| `POST /api/admin/snippets/:id/convert` | 灵感→文章转换 | 低 — 前端无此功能入口 |
| `POST /api/admin/posts/:id/audit` | 文章审计 | 低 — AI 审计功能在编辑器中内嵌 |
| `PUT /api/admin/posts/:id/status` | 文章状态更新 | 中 — 状态变更可能走其他路径 |

### 回滚锚点

所有拟删除端点均对应独立 `.ts` 文件，删除后可随时通过 `git revert` 恢复。回滚窗口：下一阶段收口前（~2 周）。

### 建议

- **本阶段执行（P0）**: 删除 7 个零引用端点
- **观察后执行（P1）**: `campaigns/:id/send`（有测试但无前端调用）
- **延后**: `subscriptions` 端点保留至推送通知功能评估

## 4. 证据来源

- 前端引用扫描: `rg` 搜索 `composables/` + `pages/` + `components/` 中 `/api/admin/*` 路径
- 服务层引用扫描: `rg` 搜索 `server/services/` + `server/utils/` 中端点关键词
- 测试覆盖扫描: 文件存在性检查 `server/api/**/*.test.ts` + `tests/server/api/**/*.test.ts`
