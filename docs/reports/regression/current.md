# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

<!-- regression-window:start:phase42-close:第四十二阶段:2026-06-04 -->
## 2026-06-04 第四十二阶段收口回归

### 范围

- 目标：第四十二阶段「AI 深化与运营闭环」5 条主线全部交付后的阶段收口回归，覆盖 typecheck、lint、CWV 基线、代码审计与归档操作。
- 本轮覆盖：全仓 typecheck + ESLint (`--max-warnings 0`)，Code Auditor 审计及修复，plan 文档归档（roadmap 深度分片 + todo-archive 滚动归档）。
- 非目标：不包含浏览器端 E2E 回归测试，不包含 CWV 实际数值采集（由 CI `build-lighthouse` job 产出）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 无静态错误 |
| `pnpm lint` | Pass | ESLint `--max-warnings 0` 通过 |
| Code Auditor | Pass | 4 个问题（1H+3M）已修复提交 |
| CWV 基线 | 待 CI | 基础设施就绪，实际数值由 CI 产出 |
| roadmap.md 深度归档 | 完成 | Phase 22-24 迁入 `roadmap-phases-22-24.md`，主文档 799→719 行 |
| todo-archive.md 滚动归档 | 完成 | Phase 32-37 迁入 `todo-archive-phases-32-37.md`，主文档保留 Phase 38-42 |
| todo.md 状态 | 清理 | Phase 42 5/5 主线 `[x]`，进度与验收均已填写 |

### 未覆盖边界

- CWV 中位数基线需等待 CI 运行 `pnpm build && pnpm test:perf:cwv` 产出后，回填到性能规范 `docs/standards/performance.md`。
- `pnpm lint:i18n` 未在本轮单独执行，新增 i18n 键依赖 typecheck + 运行时验证。

<!-- regression-window:end:phase42-close:第四十二阶段:2026-06-04 -->

<!-- regression-window:start:phase42-docs-sync:第四十二阶段收口后:2026-06-04 -->
## 2026-06-04 第四十二阶段收口后文档同步

### 范围

- 目标：执行第四十二阶段归档后的文档收口，包括 todo.md 清理、搜索优先原则规范文档同步、英文翻译同步。
- 本轮覆盖：todo.md（Phase 42 完成项归档）、AGENTS.md（4.5 搜索优先摘要）、ai-collaboration.md（1.4 搜索优先详细规则）、development.md（搜索优先原则）、ai-development.md（搜索优先指引）、CLAUDE.md（搜索优先触发规则）、full-stack-master/code-auditor/qa-assistant agent 定义（搜索优先强化）。
- 非目标：不新增功能、不改变代码。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | — | 仅文档改动，不涉及代码 |
| `pnpm lint` | — | 仅文档改动 |
| `pnpm docs:check:source-of-truth` | Pass | 文档事实源层级正确 |
| `pnpm docs:check:i18n` | Pass | 翻译文档时效性通过 |
| en-US 翻译同步 | 完成 | ai-collaboration.md（1.3/1.4 搜索优先）、development.md（搜索优先原则） |
| todo.md 清理 | 完成 | Phase 42 完成项归档，当前执行面清空 |

### 未覆盖边界

- `en-US/standards/ai-collaboration.md` 仅同步搜索优先相关章节（1.3/1.4），完整 PDTFC+ 2.0 细节仍待后续同步。
- `zh-TW` / `ko-KR` 翻译保持 source-only，无需更新。

<!-- regression-window:end:phase42-docs-sync:第四十二阶段收口后:2026-06-04 -->

<!-- regression-window:start:phase43-close:第四十三阶段:2026-06-05 -->
## 2026-06-05 第四十三阶段收口回归

### 范围

- 目标：第四十三阶段「AI 分发复用与治理深化」5 条主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、Code Auditor 审计及修复、i18n nesting bug 修复、sourceMap 跨平台修正。
- 非目标：不包含 Windows 本地 perf 测量（确认为平台级瓶颈，已关闭）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0w（pre-existing 4 个除外） |
| `pnpm i18n:audit:missing` | Pass | total: 0 |
| `pnpm i18n:audit:duplicates` | Pass | 97 组（Phase 43 收敛后） |
| `pnpm governance:audit:simple-duplicates` | Pass | 同名函数 110, 同名类型 20 |
| Code Auditor | Pass | 2 blocker 已修复（i18n nesting + sourceMap） |
| roadmap.md 归档 | 完成 | Phase 43 审计结论已写入 |
| todo-archive.md 滚动归档 | 完成 | Phase 43 归档块已写入 |
| todo.md 状态 | 清理 | Phase 43 5/5 主线完成，执行面清空 |

### Phase 43 交付清单

| 主线 | 交付 | 提交 |
|---|---|---|
| AI 内容多格式复用 | social-post API + Service + Prompt + Dialog + 5 locale i18n | `e749f3de` |
| ESLint / 类型债 | vue emits/props + max-statements + max-lines + no-non-null-assertion 扩展 | `d3068ab5` |
| 结构复用治理 | commercial-link-manager 自重复 + PostNavigationItem/DirectUploadStrategy/toErrorMessage | `a9cf62ff` |
| Windows 性能治理 | warmup + extensions + inline 瘦身 + sourceMap + build:done；平台级瓶颈确认关闭 | `227eca85`, `c8e5ba39`, `9afe8553` |
| i18n duplicates 收敛 | voice/actions 键统一至 common，-5 组 -11 keys | `7bc309df` |

### 未覆盖边界

- AI 社交帖子 API 无速率限制（审计 warning #3）
- AI 服务 + API 无测试覆盖（审计 warning #4）
- Windows 本地 perf 采集受平台瓶颈阻塞，对比数据仅 CI Linux 对照（106s）

<!-- regression-window:end:phase43-close:第四十三阶段:2026-06-05 -->

<!-- regression-window:start:phase44-close:第四十四阶段:2026-06-07 -->
## 2026-06-07 第四十四阶段收口回归

### 范围

- 目标：第四十四阶段「友链生态与性能闭环」6 条主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、i18n 键完整性、Phase 44 全部主线、docs 归档。
- 非目标：不包含 CWV 实际数值采集（需 CI `build-lighthouse` 产出）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0 errors, 10 pre-existing warnings |
| i18n key 覆盖 | Pass | feed_title / feed_empty / show_rss_feed 在 5 locale 中完整 |
| todo-archive.md 滚动归档 | 完成 | Phase 44 归档块已写入 |
| todo.md 状态 | 清理 | Phase 44 6/6 主线完成，执行面已清空 |

### Phase 44 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| 友链 RSS 聚合 | showRssFeed 管理配置 + RSS/Atom 抓取/解析/缓存 + 公开页最近更新 | `3fa5b924`, `d580d6c0`, `b06314b6` |
| 隐私自托管分析评估 | Umami 评估文档，条件性 Go 结论 | `2d41ae1d` |
| ESLint / 类型债 | 3 组窄切片: no-non-null-assertion + no-explicit-any | `28e171f8` |
| 结构复用治理 | SettingFieldMetadata + AgreementFormData 收敛 | `249eb90a` |
| CWV 性能优化 | Logo 预加载 + CSS @import 扁平化 | `8669d0c0` |
| Phase 44 测试回填 | Phase A (19 用例) + Phase B (7 用例) | `2d41ae1d`, `8d35652f` |

### 未覆盖边界

- CWV 基线数值待 CI 运行 `pnpm build && pnpm test:perf:cwv` 后回填。
- 友链管理页 Checkbox 渲染测试及公开页 feed 渲染/降级测试已回灌 backlog。
<!-- regression-window:end:phase44-close:第四十四阶段:2026-06-07 -->
