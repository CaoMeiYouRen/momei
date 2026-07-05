# E2E 测试 fixme/skip 现状与修复方案

> 创建日期: 2026-07-05
> 状态: 分析完成
> 关联: [seed-test 排查记录](./e2e-seed-test-investigation.md)

## 总览

| 分类 | 数量 | 状态 |
|------|------|------|
| seed-test 根因导致的 fixme | 7 | ✅ 已全部恢复 |
| 独立 UI 流程问题 | 1 | ⚠️ 保持 skip |
| 测试代码缺陷（缺登录逻辑） | 11 | 🔧 需要修复 |
| 测试代码缺陷（缺功能实现） | 5 | 🔧 需要修复 |
| 条件 skip（预期行为） | 10 | ✅ 保持现状 |

## 一、已恢复的 fixme（7 个，同一根因）

根因：DEMO_MODE 和 TEST_MODE 同时启用导致 seed-demo 和 seed-test 并发争抢 SQLite 事务锁。

| 文件 | 用例 | 验证 |
|------|------|------|
| `admin-posts-shortcut.e2e.test.ts` | keeps compact desktop shortcut | ✅ |
| `admin-posts-shortcut.e2e.test.ts` | shows mobile shortcut | ✅ |
| `auth-session-governance.e2e.test.ts` | should sync logout across tabs | ✅ |
| `auth-session-governance.e2e.test.ts` | should redirect to login after session expiry | ✅ |
| `auth-session-governance.e2e.test.ts` | should block immediate protected revisit | ✅ |
| `auth-session-governance.e2e.test.ts` | should switch language on blank draft | ✅ |
| `auth-session-governance.e2e.test.ts` | should protect entered draft from language switch | ✅ |

## 二、独立 UI 流程问题（1 个）

| 文件 | 用例 | 根因 |
|------|------|------|
| `auth.e2e.test.ts` | should login and logout successfully as admin | `loginAsAdmin()` 点击提交后 URL 不变，超时 20s |

**根因分析**：`AuthHelper.loginAsAdmin()` 使用 UI 表单登录，点击提交后 `waitForURL` 超时。可能是 PrimeVue 表单提交行为或前端路由问题，与 seed-test 无关。

**修复方案**：需要单独排查前端登录表单提交流程。

## 三、测试代码缺陷（16 个）

### 3.1 缺少登录逻辑（11 个）

| 文件 | 用例数 | 根因 |
|------|--------|------|
| `admin-workflow.e2e.test.ts` | 11 | 测试直接 `page.goto('/admin')` 但没有先调用 `ensureAdminSession()` 或 `loginAsAdmin()` |

**典型代码**：
```typescript
test.skip('should display admin dashboard after login', async ({ page }) => {
    await page.goto('/admin')  // ← 没有先登录！
    await expect(page.locator('.admin-page-container')).toBeVisible()
})
```

**修复方案**：
- 在 `beforeEach` 或每个测试开头添加 `await new AuthHelper(page).ensureAdminSession()`
- 移除 `test.skip` 标记
- 预估工作量：1h（批量修改 + 验证）

### 3.2 缺少功能实现（5 个）

| 文件 | 用例 | 根因 | 修复方案 |
|------|------|------|---------|
| `user-workflow.e2e.test.ts` | should change user avatar | 注释"需要先登录" | 添加 `ensureAdminSession()` |
| `user-workflow.e2e.test.ts` | should validate required fields | 注释"需要先登录" | 添加 `ensureAdminSession()` |
| `user-workflow.e2e.test.ts` | should submit post successfully | 注释"需要先登录" | 添加 `ensureAdminSession()` |
| `responsive.e2e.test.ts` | should handle post reading on mobile | 注释"需要数据库数据" | 现在 seed-test 已修复，可尝试恢复 |

**修复方案**：
- `user-workflow` 的 3 个测试：添加 `ensureAdminSession()` 并验证
- `responsive` 的 1 个测试：seed-test 已修复，直接恢复验证
- 预估工作量：30min

## 四、条件 skip（预期行为，10 个）

这些 skip 是正常的防御性逻辑，不需要修复：

| 文件 | 用例 | skip 条件 | 说明 |
|------|------|-----------|------|
| `admin.e2e.test.ts` | beforeEach 中的 skip | auth 失败时跳过 | 防御性逻辑 |
| `seo-regression.e2e.test.ts` | SEO 回归测试 | 无已发布文章时跳过 | 数据依赖 |
| `user-workflow.e2e.test.ts` | 3 个 settings 测试 | 被重定向到 login 时跳过 | auth 状态检查 |
| `categories-tags.e2e.test.ts` | 3 个分类测试 | 无分类数据时跳过 | 数据依赖 |
| `auth-session-governance.e2e.test.ts` | Firefox flaky skip | Firefox 浏览器跳过 | 浏览器兼容性 |

## 五、修复优先级建议

| 优先级 | 任务 | 用例数 | 预估工作量 |
|--------|------|--------|-----------|
| P0 | 恢复 responsive.e2e.test.ts 的 skip | 1 | 5min |
| P1 | 修复 user-workflow.e2e.test.ts 缺登录 | 3 | 30min |
| P1 | 修复 admin-workflow.e2e.test.ts 缺登录 | 11 | 1h |
| P2 | 排查 auth.e2e.test.ts UI 登录流程 | 1 | 需要单独分析 |
| - | 条件 skip 保持现状 | 10 | N/A |

## 六、经验教训

1. **测试应自包含认证逻辑**：每个需要认证的测试（或 describe 块）应在 `beforeEach` 中调用 `ensureAdminSession()`，而不是依赖外部状态。
2. **skip 应注释原因**：`test.skip` 应附带注释说明为什么跳过、什么条件下可以恢复。
3. **区分 fixme 和 skip**：`test.fixme` 表示"已知问题待修复"，`test.skip` 表示"条件不满足或故意跳过"。应根据实际情况选择。
