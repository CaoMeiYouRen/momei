---
name: test-engineer
description: 编写、运行和优化项目测试用例（Vitest）。
metadata:
  internal: true
---
# Test Engineer Skill

-   **测试编写**: 使用 Vitest 编写针对 Vue 组件和 TypeScript 逻辑的测试。
-   **测试运行**: 熟练运行 `pnpm test` 或针对特定文件的测试命令。
-   **覆盖率分析**: 阅读和理解测试覆盖率报告。
-   **Mocking**: 模拟 API 响应、Nuxt composables (如 `useI18n`)，以及 Nuxt auto-import 模块（`ofetch`、`#build/fetch.mjs`）。

## 指令 (Instructions)

1.  **Worktree 意识**: 务必在 `../momei-test` 工作树中运行测试命令。如果尚不存在该路径，应引导用户或自动创建之。
2.  **规范对齐**: 在运行测试前必须阅读并遵循 [测试规范](../../../docs/standards/testing.md) 和 [Nuxt 4.5.0+ \$fetch Mock 模式](#nuxt-450-auto-import-mock-模式)。
3.  **测试策略**: 优先执行**定向测试** (Targeted Testing)，仅运行与改动相关的测试文件。
4.  **全量测试条件**: 除非涉及大规模重构或安全风险，否则避免全量测试。全量测试通常仅在专门的"测试增强"任务中进行。
5.  **风险优先**: 先锁定当前要证明或否证的行为风险，再决定写哪条测试；不要为了铺 coverage 同时扩写多个低相关场景。
6.  **失败路径优先**: 修复缺陷或补守卫时，优先编写在缺陷存在时会失败的断言，再补成功路径回归。
7.  **用例设计**: 同时覆盖正常流程、异常流程和边缘情况，但每个测试块应尽量围绕单一风险命名与归因。
8.  **Mock 配置**: 在测试文件中配置必要的 mock（如 `useI18n`）。
9.  **执行验证**: 编写完后必须运行测试确保其通过；若首轮定向测试未能区分风险，再决定是否升级验证范围。
10. **CI 最终验证**: 所有修复类任务的最终通过了断是 CI 流水线全部通过。本地通过 ≠ CI 通过。提交后必须等待 CI 结果，发现遗漏则针对性补修。

## Nuxt 4.5.0+ Auto-Import Mock 模式

### 背景

Nuxt 4.5.0 将 `$fetch` 的 auto-import 从"全局变量"改为通过 `unimport` 从 `ofetch`（经由 `#build/fetch.mjs`）注入编译时本地引用，导致以下传统模式失效：

```typescript
// ❌ 失效模式
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ❌ 同样失效
globalThis.$fetch = mockFetch
```

### 正确模式

```typescript
// ✅ Nuxt 4.5.0+ 兼容
const { mockFetch } = vi.hoisted(() => ({
    mockFetch: vi.fn().mockResolvedValue({}),
}))
vi.mock('ofetch', () => ({ $fetch: mockFetch }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))
```

**要点**：
- `mockFetch` 必须在 `vi.hoisted()` 中创建（确保 `vi.mock` 工厂捕获时已初始化）
- 同时 mock `ofetch` 和 `#build/fetch.mjs`（后者作为虚拟模块的冗余保障）
- 如果测试 mock 了 `#imports`，`importOriginal` 会获取到已 mock 的 `$fetch`，无需额外配置

### mockNuxtImport 兼容

```typescript
// ❌ 失效
const mockFetch = vi.fn()
mockNuxtImport('$fetch', () => mockFetch)

// ✅ 正确
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))
mockNuxtImport('$fetch', () => mockFetch)
```
