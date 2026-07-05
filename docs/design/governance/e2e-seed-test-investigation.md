# E2E 测试 seed-test 插件失效排查记录

> 创建日期: 2026-07-04
> 解决日期: 2026-07-05
> 状态: ✅ 已解决
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

## 根因分析

### 核心根因：DEMO_MODE 和 TEST_MODE 同时启用导致并发事务竞争

E2E 配置（`playwright.config.ts`）中同时启用了 `DEMO_MODE=true` 和 `TEST_MODE=true`。这导致：

1. `seed-demo` 插件和 `seed-test` 插件同时触发（都使用 `void (async () => { ... })()` 并发启动）
2. 两个插件各自调用 `auth.api.signUpEmail`，底层需要启动 SQLite 事务
3. 内存 SQLite 不支持并发事务 → `SqliteError: cannot start a transaction within a transaction`
4. 两个插件都失败，测试用户 `test@momei.test` 从未被创建

### 为什么之前排查困难

- 之前的排查方向（AUTH_SECRET、headers、构建缓存、FORCE_E2E_BUILD）都聚焦于单个插件的执行条件，没有考虑到两个插件并发竞争的场景
- `seed-test` 插件代码确实存在于构建产物中，`TEST_MODE` 也是运行时检查（非 tree-shake），所以"插件未加载"是错误的假设
- 实际上插件加载了，但执行时因事务锁冲突而失败

### 次要问题：database synchronize 依赖 DEMO_MODE

`server/database/index.ts` 的 `synchronize` 选项原本只依赖 `DEMO_MODE`：
```typescript
synchronize: DATABASE_SYNCHRONIZE || DEMO_MODE || isTestEnv || isDevEnv,
```

去掉 `DEMO_MODE` 后，`TEST_MODE` 环境下表格不会自动创建（因为 `isTestEnv` 检查的是 `NODE_ENV === 'test'`，而 E2E 环境是 `production`）。

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

## 最终修复方案

### 修复 1：E2E 配置去掉 DEMO_MODE（核心）

**文件**: `playwright.config.ts`

```diff
 const e2eServerEnv = [
-    'DEMO_MODE=true',
-    'NUXT_PUBLIC_DEMO_MODE=true',
     'TEST_MODE=true',
     'NUXT_PUBLIC_TEST_MODE=true',
     ...
 ]
```

**理由**: TEST_MODE 已覆盖 DEMO_MODE 的关键功能（内存数据库、自动同步）。两者定位不同，不应同时启用。

### 修复 2：seed-demo 插件加互斥保护（兜底）

**文件**: `server/plugins/seed-demo.ts`

```diff
-if (DEMO_MODE) {
+if (DEMO_MODE && !TEST_MODE) {
```

**理由**: 即使两个模式被同时启用，seed-demo 也会跳过，由 seed-test 独占。

### 修复 3：database synchronize 加入 TEST_MODE

**文件**: `server/database/index.ts`

```diff
-synchronize: DATABASE_SYNCHRONIZE || DEMO_MODE || isTestEnv || isDevEnv,
+synchronize: DATABASE_SYNCHRONIZE || DEMO_MODE || TEST_MODE || isTestEnv || isDevEnv,
```

**理由**: 确保 TEST_MODE 环境下自动建表（E2E 环境 `NODE_ENV=production`，`isTestEnv` 为 false）。

### 恢复的测试

| 文件 | 恢复的用例 | 验证结果 |
|------|-----------|---------|
| `admin-posts-shortcut.e2e.test.ts` | shows top-level desktop nav entry | ✅ passed |
| `auth-session-governance.e2e.test.ts` | should keep authenticated settings page stable | ✅ passed |
| `mobile-critical.e2e.test.ts` | should cover login entry, admin navigation | ✅ passed |
| `admin.e2e.test.ts` | beforeEach 自动恢复 | ✅ passed |

## 经验教训

### 1. 并发插件竞争是隐蔽的 Bug 来源

多个 Nitro 插件使用 `void (async () => { ... })()` 并发启动时，如果底层共享资源（如 SQLite 内存数据库），会产生事务锁竞争。日志中不会直接显示"两个插件同时运行"，只会显示其中一个失败。

### 2. 模式标志（DEMO_MODE / TEST_MODE）应有明确的互斥语义

功能重叠的模式标志应该在设计时就明确互斥关系，而不是依赖调用方避免同时启用。防御性编程：`if (DEMO_MODE && !TEST_MODE)` 比 `if (DEMO_MODE)` 更安全。

### 3. 排查"插件未执行"时，先确认是"未加载"还是"执行失败"

- **未加载**: 构建产物中没有插件代码（tree-shake 掉了）
- **执行失败**: 代码存在但运行时报错被静默吞掉

最快的确认方法：`grep -n "关键字" .output/server/chunks/nitro/nitro.mjs`

### 4. `synchronize` 等隐式依赖需要显式覆盖

`database/index.ts` 的 `synchronize: DEMO_MODE || isTestEnv` 这种模式，当去掉 `DEMO_MODE` 时会意外丢失同步能力。更好的写法是 `synchronize: DATABASE_SYNCHRONIZE || DEMO_MODE || TEST_MODE || isTestEnv || isDevEnv`，让所有需要同步的模式都显式列出。

### 5. 构建产物是调试的第一手资料

Nuxt/Nitro 会将 `process.env.*` 在构建时内联。调试时应直接检查 `.output/server/chunks/nitro/nitro.mjs`，而不是只看源码。
