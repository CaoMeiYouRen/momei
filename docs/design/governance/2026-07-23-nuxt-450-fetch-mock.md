# Nuxt 4.5.0 `$fetch` Mock 修复复盘

日期: 2026-07-23
涉及范围: 41 个测试文件，272 行插入，168 行删除
关联 PR/Commit: `966af0cd`, `36dcfdb0`

## 背景

Dependabot 将 Nuxt 从 4.4.8 升级到 4.5.0 后，CI 的 Unit 测试突然出现 **38 个文件失败**（原 460 个通过中的 38 个）。

## 根因

Nuxt 4.5.0 是一次重大版本升级（Vite 8、unhead v3、unctx v3、框架构建切换到 tsdown），其中 `$fetch` 的 auto-import 机制改变：

| Nuxt 版本 | \$fetch 解析方式 | 测试 Mock 方式 |
|-----------|----------------|---------------|
| <= 4.4.8 | 全局变量（globalThis） | `vi.stubGlobal('$fetch', mock)` |
| >= 4.5.0 | 编译时从 `ofetch` 导入（auto-import） | `vi.mock('ofetch', ...)` + `vi.hoisted()` |

组件中的 `$fetch(...)` 在编译时被 `unimport` 转换为对 `ofetch.$fetch` 的本地导入引用，因此 `vi.stubGlobal` 无法拦截。

## 时间线

| 时间 | 事件 | 耗时 |
|------|------|------|
| T+0 | 收到 CI 失败报告，开始调查 | - |
| T+0.5 | 提交全局 mock 方案（破坏 `registerEndpoint`） | 30min |
| T+1.0 | 切换共享 mock 方案（闭包捕获问题）| 30min |
| T+1.5 | 编写 `__debug.test.ts`，5 秒确认 `globalThis.$fetch !== $fetch` | 30min |
| T+2.0 | 锁定 `vi.hoisted()` + `vi.mock('ofetch')` 方案 | 30min |
| T+2.5 | 批量修复 36 个使用 `vi.stubGlobal` 的文件 | 30min |
| T+3.0 | 发现 4 个使用 `mockNuxtImport` 的文件 + 3 个 typecheck 错误 | 30min |
| T+3.5 | 修复 captcha 测试遗漏 | 30min |
| T+4.0 | CI 全部通过 | 30min |

**总计约 4 小时**，其中约 1.5 小时浪费在错误的方案上。

## 教训

### 1. 最小复现测试能大幅缩短排查时间

如果第一小时就写 `__debug.test.ts`（5 秒出结果的验证 `globalThis.$fetch` vs bare `$fetch` 的差异），可以在 5 分钟内锁定根因，而非花费 1.5 小时在两个错误的方案上反复跑全量测试验证。

### 2. 全量测试应作为"最后确认"而非"验证手段"

每次方案猜测都跑全量测试（10 min），3 次就是 30 min 的纯等待时间。应该先用最小复现测试验证假设，再用定向 subset 确认方案，最后才跑全量。

### 3. CI 的测试范围比本地大

第一次提交（`966af0cd`）本地通过了 `pages/` + `components/` 的测试，但 CI 的 Unit 作业包含 `server/` 目录的 `captcha.test.ts`，该文件使用了 `globalThis.$fetch = mockFetch` 模式，未被覆盖。

### 4. 批量修复前应确认搜索条件的完整性

第一次只搜索了 `vi.stubGlobal('$fetch'`，漏掉了使用 `mockNuxtImport('$fetch', ...)` 和 `globalThis.$fetch =` 的文件，导致需要后续补修。

## ## 修复工作流

本报告沉淀的修复工作流如下：

```
根因排查               方案验证                批量修复         提交前              上线
┌──────────┐      ┌──────────────┐      ┌──────────┐    ┌──────────┐      ┌──────────┐
│ 最小复现  │ ──→ │ 定向 subset   │ ──→ │ 批量应用  │ ─→ │ typecheck │ ─→  │ CI 裁决  │
│ 测试      │     │ (3-5 文件)   │     │ 到所有匹配│    │ + lint   │      │ 最终确认 │
│ (<5s)    │     │ (1-2min)     │     │ 文件      │    │          │      │          │
└──────────┘      └──────────────┘      └──────────┘    └──────────┘      └─────┬────┘
                                                                               │
                                                                    ┌──────────▼──────┐
                                                                    │ CI 失败 → 分析   │
                                                                    │ 具体失败点 →     │
                                                                    │ 针对性补修       │
                                                                    │（不回退全量重试） │
                                                                    └─────────────────┘
```

### 验证成本金字塔

| 验证方式 | 耗时 | 使用时机 |
|---------|------|---------|
| 最小复现测试 | ~5s | 根因排查 |
| 定向 subset (3-5 文件) | 1-2min | 方案验证 |
| 全量本地 | 10-15min | 提交前最终确认 |
| **CI** | 5-15min | **最终裁决** |

## 改进措施

1. **测试规范 (`docs/standards/testing.md`)** — 新增 Nuxt 4.5.0+ `$fetch` Mock 模式和修复工作流章节
2. **AI 协作规范 (`docs/standards/ai-collaboration.md`)** — 新增最小复现测试优先和 CI 最终裁决原则
3. **Test Engineer Skill (`.agents/skills/test-engineer/SKILL.md`)** — 新增 auto-import mock 模式指南
4. **Full Stack Master Agent (`.github/agents/full-stack-master.agent.md`)** — 新增修复工作流阶段化指引
