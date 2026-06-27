# 第二轮未使用 API 扩大调研

> 日期: 2026-06-13
> 基线: Phase 47 第一轮评估后续

## 调研端点（4 个）

### 1. `admin/subscriptions` (GET/PUT/DELETE)

| 验证层 | 结果 | 说明 |
|:---|:---|:---|
| 前端引用 | 0 | 无 composable/page/component 调用 |
| 服务层引用 | 1 (false positive) | `web-push.ts` 中 `subscriptions` 为推送数据库实体,非该 API |
| 测试覆盖 | 0 | 无测试文件 |
| Git 历史 | 早期创建 | 推送订阅管理端点,创建后从未接入前端 |

**结论**: **可删除**。唯一真正确认无引用的端点。

### 2. `admin/waitlist/export` (GET)

| 验证层 | 结果 | 说明 |
|:---|:---|:---|
| 前端引用 | 1 | `pages/admin/waitlist/index.vue:165` — `exportWaitlist()` 按钮调用 |
| 服务层引用 | 0 | — |
| 测试覆盖 | 0 | 无测试文件 |
| Git 历史 | `446c53f3` | 候补名单功能引入 |

**结论**: **保留**。有前端调用，功能完整。

### 3. `admin/snippets/scaffold-to-post` (POST)

| 验证层 | 结果 | 说明 |
|:---|:---|:---|
| 前端引用 | 1 | `components/admin/snippets/snippet-aggregate-dialog.vue:344` |
| 服务层引用 | 0 | — |
| 测试覆盖 | 0 | 无测试文件 |
| Git 历史 | `1677202c` | 灵感聚合转换功能引入 |

**结论**: **保留**。有前端调用，功能完整。

### 4. `admin/posts/:id/versions/:versionId/restore` (POST)

| 验证层 | 结果 | 说明 |
|:---|:---|:---|
| 前端引用 | 1 | 版本管理页面调用 |
| 服务层引用 | 0 | — |
| 测试覆盖 | 2 | 有测试文件覆盖 |
| Git 历史 | `7f31fb6c` | Phase 48 刚刚创建并测试 |

**结论**: **保留**。新功能，有完整测试。

## 总结

| 端点 | 结论 |
|:---|:---|
| `admin/subscriptions` | **删除** |
| `admin/waitlist/export` | 保留 |
| `admin/snippets/scaffold-to-post` | 保留 |
| `admin/posts/:id/versions/:versionId/restore` | 保留 |

本轮确认 1 个新删除候选（subscriptions），3 个误标候选已排除。建议下阶段将 subscriptions 纳入安全删除清单。
