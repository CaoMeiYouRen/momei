# E2E 测试 seed-test 插件失效排查记录

> 创建日期: 2026-07-04
> 状态: 待排查
> 优先级: P0
> 关联: [GitHub Actions Run](https://github.com/CaoMeiYouRen/momei/actions/runs/28716174986)

## 问题描述

CI 环境中 E2E 测试全部失败，报错 `401 INVALID_EMAIL_OR_PASSWORD`。根因是 `seed-test` 插件未创建测试用户 `test@momei.test`。

### 受影响的测试（19 个用例，5 个文件）

| 文件 | 用例数 | 状态 |
|------|--------|------|
| `admin-posts-shortcut.e2e.test.ts` | 3 | 已标记 fixme |
| `auth-session-governance.e2e.test.ts` | 6 | 已标记 fixme |
| `admin.e2e.test.ts` | 7 | beforeEach 自动 skip |
| `auth.e2e.test.ts` | 1 | 已标记 skip |
| `mobile-critical.e2e.test.ts` | 1 | 已标记 fixme |

### 关键现象

- 日志中**没有任何 `[Test Seed]` 输出**（说明 seed-test 插件未执行或 `seedTestData` 未被调用）
- `[Global Setup] System already installed`（说明 `system_installed` 设置存在，可能是之前的 E2E 运行遗留）
- `[WebServer] WARN [Better Auth]: User not found`（说明用户确实不存在）

## 已尝试的修复

### 1. CI build 步骤设置 AUTH_SECRET ❌ 不够

- **原因**：Better-Auth 在 `NODE_ENV=production` 时要求 `AUTH_SECRET` 非空
- **结果**：解决了 Better-Auth 报错，但 seed-test 插件仍未执行

### 2. seed-test.ts 添加 headers 参数 ❌ 不够

- **原因**：`auth.api.signUpEmail` 可能需要 `Content-Type` header
- **结果**：无法验证（因为 seed-test 插件根本没执行）

### 3. CI build 步骤设置 TEST_MODE=true ❌ 不够

- **原因**：Nuxt 构建时内联 `process.env.TEST_MODE`，运行时无法改变
- **结果**：设置了 TEST_MODE，但 build 可能被缓存复用

### 4. 添加 FORCE_E2E_BUILD=true ❌ 不够

- **原因**：`run-e2e.mjs` 的 `shouldRebuildOutput` 只检查文件时间戳
- **结果**：强制重建了，但 seed-test 插件仍未执行

### 5. 去掉独立 build 步骤，统一由 run-e2e.mjs 构建 ❌ 不够

- **原因**：确保 TEST_MODE 在构建时生效
- **结果**：构建确实使用了 TEST_MODE=true（从日志可见），但 seed-test 插件仍未执行

## 待排查方向

### 方向 1：Nitro 插件加载时机

`seed-test.ts` 使用 `defineNitroPlugin`，在服务器启动时异步执行：
```typescript
export default defineNitroPlugin(() => {
    if (TEST_MODE) {
        void (async () => {
            await initializeDB()
            await seedTestData(dataSource)
        })()
    }
})
```

可能的问题：
- `void` 异步执行可能在服务器开始处理请求前未完成
- `initializeDB()` 可能在 Nitro 插件上下文中行为不同

### 方向 2：TEST_MODE 内联时机

`TEST_MODE` 在 `utils/shared/env.ts` 中定义：
```typescript
export const TEST_MODE =
    process.env.NUXT_PUBLIC_TEST_MODE === 'true'
    || process.env.TEST_MODE === 'true'
    || process.env.NODE_ENV === 'test'
    || !!process.env.VITEST
```

可能的问题：
- Nuxt 可能使用 `import.meta.env` 而不是 `process.env` 来内联
- 构建时 `TEST_MODE` 可能被 tree-shaking 掉

### 方向 3：auth.api.signUpEmail 在 Nitro 插件中的行为

可能的问题：
- `auth` 实例在 Nitro 插件加载时可能未完全初始化
- `signUpEmail` 可能在没有完整请求上下文时失败

### 方向 4：数据库内存 SQLite 竞态

E2E 使用 `DATABASE_PATH=:memory:`，可能的问题：
- 多个 worker 共享同一个内存数据库
- `initializeDB()` 和 `seedTestData()` 之间的竞态条件

## 建议的排查步骤

1. **添加更多日志**：在 `seed-test.ts` 的每个关键步骤添加 `console.log`
2. **检查构建产物**：确认构建后的 `.output/server/` 中包含 seed-test 插件代码
3. **本地复现**：在本地使用 `TEST_MODE=true` 构建并运行，检查 seed-test 是否执行
4. **检查 Nitro 插件注册**：确认 `server/plugins/seed-test.ts` 在构建后被正确加载
5. **简化测试**：创建一个最小化的 seed-test 插件，只做 `console.log('SEED TEST EXECUTED')`，确认插件是否被加载
