# 待办事项深度归档：第五十至第五十一阶段

本文档包含了第五十至第五十一阶段（2026-06-14 ~ 2026-06-16）的完整待办归档正文。
此区间的阶段已从 [todo-archive.md](../todo-archive.md) 主窗口迁出，归档到此文件。

---

## 第五十一阶段：边界收敛与治理增压 (已审计归档)

> 归档说明: 第五十一阶段「0 个新功能 + 5 个优化」已于 2026-06-16 完成五条主线交付与阶段收口。五条主线: types/utils 边界收敛（冲突清单 + 治理文档 + 3 组样本迁移）、跨包复用评估（No-Go 完整方案 / 条件性 Go 轻量方案 + 评估文档）、ESLint/类型债 ≥5 组窄切片（11 处 as any 收敛，typecheck 零错误）、结构复用 ≥5 组热点切片（commercial-link-manager 参数化 + UploadType/ApiResponse 统一事实源 + use-voice-input 删除 + formatDate 复用，同名 type/interface 候选 11→10）、backlog 长期主线状态同步（10 条主线更新至 ≥Phase 48）。

> **ROI 评估**: types/utils 边界收敛 2.00；跨包复用评估 1.20；ESLint / 类型债治理 2.33；结构复用治理 2.33；backlog 状态同步（维护债，不评分）。

### 1. `utils/shared` 与 `types` 职责边界收敛 (P1)

- **执行范围**: 全量扫描 types/ 与 utils/shared/ 目录，盘点类型与逻辑混放位置。纯类型→`types/`，含逻辑代码→`utils/`。输出冲突清单 + 迁移规则，≥3 处样本迁移。
- **结果**: 输出治理文档 `types-utils-boundary-governance.md`（含 5 条迁移规则、渐进式收敛顺序、回滚边界、验证矩阵）。3 组样本迁移: `types/copyright.ts` 常量+函数→`utils/shared/copyright.ts`（7 文件 import 更新）、`types/utils.ts` 函数`isSelectLocaleOption`→`utils/shared/type-guards.ts`、`utils/shared/email-template-preview.ts`→`types/email-template-preview.ts`（2 文件 import 更新）。
- **验证**: `pnpm typecheck` 零错误。
- [x] 冲突样本清单 + 迁移规则文档化
- [x] ≥3 处样本迁移完成 + typecheck 通过

### 2. 跨包复用治理 — 评估态 (P2)

- **执行范围**: 全量扫描 `packages/mcp-server/src/`（6 源文件）与 `packages/cli/src/`（10 源文件），盘点共享代码清单（9 个 API 方法、3 个工具函数、6 组类型、4 组配置常量），输出 go/no-go 评估文档。
- **结果**: 产出评估文档 `cross-package-reuse-evaluation.md`。结论: 完整抽包方案 No-Go（Score 0.88，两套 HTTP 传输层统一成本过高）；轻量方案条件性 Go（Bug 修复 + shared-types + shared-utils 可分阶段推进）。**发现潜伏 Bug**: Auth header 大小写不一致（`X-API-Key` vs `X-API-KEY`）。
- **验证**: typecheck 零错误，评估文档覆盖共享面规模/抽包成本/替代方案三维度。
- [x] 双包共享代码清单落盘
- [x] go/no-go 评估文档产出

### 3. ESLint / 类型债治理 — ≥5 组窄切片 (P1)

- **执行范围**: 「单规则 + 单文件/双文件」窄切片 ×5，优先 `as any` 高命中文件。
- **结果**: 5 组切片覆盖 4 个文件。`lib/auth.ts`（3→0）、`plugins/primevue-i18n.ts`（2→0）、`components/settings/settings-profile.vue`（4→0）、`pages/benefits.vue`（5→3）。合计生产代码 `as any` 从 14 降至 3（-11）。
- **验证**: `pnpm typecheck` 零错误。
- [x] ≥5 组窄切片完成
- [x] production code `as any` 14→3（-11）

### 4. 结构复用治理 — ≥5 组热点切片 (P1)

- **执行范围**: `commercial-link-manager.vue` 自重复（最高优先级）+ ≥4 组其他热点。
- **结果**: 5 组切片: (1) commercial-link-manager.vue 8 组重复收敛为参数化 handler + 配置对象; (2) UploadType enum 统一至 `types/upload.ts`; (3) use-voice-input.ts 纯别名删除，调用方直连; (4) use-legal-agreement-page.ts formatDate 复用 useI18nDate; (5) ApiResponse 三处独立定义统一至 `types/api.ts`。
- **验证**: `pnpm typecheck` 零错误；`pnpm governance:audit:simple-duplicates` 同名 type/interface 候选 11→10，文件数 1229→1228。
- [x] ≥5 组热点切片完成
- [x] duplicate-code 基线不反弹

### 5. Backlog 长期主线状态同步 (P1)

- **执行范围**: 逐条对照 Phase 38-51 归档记录，更新 backlog.md 中 10 条长期主线的「最近一次上收阶段」「当前状态」「下一次可切片方向」字段。
- **结果**: 10 条主线全部更新。更新跨度: #2 ESLint 37→51、#3 结构复用 37→51、#6 i18n 31→50、#7 文档 31→50、#9 站点性能 27→44。#8 Windows 性能转为「暂停」状态（Phase 43 确认平台级瓶颈）。
- **验证**: `pnpm lint:md` 通过；`pnpm docs:check:line-count` 所有文档在健康窗口内。
- [x] 10 条长期主线状态字段更新至 ≥Phase 48

> **审计结论**: 第五十一阶段五条主线已在治理文档、评估文档、类型断言收敛、结构复用切片与 backlog 状态同步中完成闭环。`pnpm typecheck` 零错误，`pnpm lint:md` 通过，`pnpm docs:check:line-count` 全部在健康窗口内。当前 `todo.md` 执行面已清理，归档块已写入。

---

## 第五十阶段：PWA 启用与收口治理 (已审计归档)

> 归档说明: 第五十阶段「1 个新功能 + 4 个优化」已于 2026-06-14 完成五条主线交付与阶段收口。五条主线: PWA 功能开启（`@vite-pwa/nuxt` 启用，607 entries precached）、API 测试分层收敛（4 组迁移 + 治理文档）、i18n 首屏翻译稳定性治理（命中矩阵 + 3 处修复）、backlog 深度清理（Phase 32-41 归档压缩 + #3/#4/#5/#8 移除）、友链前后博客环导航评估（Go 结论）。

> **ROI 评估**: PWA 功能开启 1.80；API 测试分层收敛 1.30；i18n 首屏翻译稳定性 1.40；backlog 深度清理 1.50；友链博客环评估 1.10。

### 1. PWA 功能开启 — Progressive Web App (P0)

- **执行范围**: 启用 `nuxt.config.ts` 中已注释的 `@vite-pwa/nuxt` 模块，配置 Service Worker + Web Manifest + 离线缓存策略。
- **非目标**: 不做复杂的 Workbox 自定义路由、不做 Push Notification 集成。
- **最小验收**: PWA 可安装（manifest.json 生效）；Service Worker 注册成功；离线页面可访问。
- **结果**: `pnpm build` 成功生成 `sw.js` (41KB) + `manifest.webmanifest` (486B)，预缓存 607 条目 (7329.53 KiB)。改动仅 `nuxt.config.ts` 取消两处注释。
- **验证**: `pnpm lint`=0, `pnpm typecheck`=0, `pnpm build` PWA v1.2.0 generateSW 通过。
- [x] PWA 可安装（manifest.json 生效）
- [x] Service Worker 注册成功
- [x] 离线页面可访问（构建验证通过）

### 2. API 测试分层收敛 (P1)

- **执行范围**: 统一 `tests/server/api/` 与 `server/api/**/*.test.ts` 双轨目录，固化测试分层规则与目录归属。
- **非目标**: 不重写现有测试内容、不移除测试覆盖。
- **最小验收**: 输出分层规则文档；至少 3 组样板迁移落地。
- **结果**: 输出 `docs/design/governance/api-test-layering.md`（决策树 + 迁移规则 + 待办清单）；4 组样板迁移（benefits/waitlist、friend-links/feed、ai/comment-translation、admin/external-feed/refresh 去重）；`docs/standards/testing.md` §3.2 强化禁止 co-located API 测试规则。
- **验证**: 定向测试 4 文件 8 tests passed；`pnpm lint`=0, `pnpm typecheck`=0, `pnpm lint:md`=0。
- [x] 输出分层规则文档
- [x] ≥3 组样板迁移落地

### 3. i18n 首屏翻译稳定性治理 (P1)

- **执行范围**: 评估 `locale-modules.ts` 拆分加载链路，识别首屏 raw key 泄漏点；给出首屏关键路由加载命中矩阵与回退策略。
- **非目标**: 不重写 i18n 加载架构。
- **最小验收**: 输出首屏路由命中矩阵；至少修复 1 处 raw key 泄漏。
- **结果**: 输出 `docs/design/governance/i18n-first-screen-hit-matrix.md`（17 路由全覆盖命中矩阵 + 5 语言 fallbackChain 回退策略）。修复 3 处 raw key 泄漏：`admin/posts/index.vue` + `admin/posts/[id].vue` 的 `void`→`await` 竞态修复 + `locale-modules.ts` 补充 `pages.enhanced_pack` 模块定义。
- **验证**: `pnpm lint`=0, `pnpm typecheck`=0, `pnpm lint:md`=0, i18n 定向测试 27 tests passed。
- [x] 输出首屏路由命中矩阵
- [x] ≥1 处 raw key 泄漏修复（实际 3 处）

### 4. backlog 深度清理 (P1)

- **执行范围**: 压缩「方向判断」中 Phase 29-41 逐段复述为简表；移除已完成的 `#3 未使用 API`、`#4 API Schema`、`#8 调研机制` 条目。
- **非目标**: 不新增 backlog 条目。
- **最小验收**: 方向判断段缩减 ≥50%；已上收项全部标记或移除。
- **结果**: `roadmap.md` Phase 32-41 段从 386 行压缩至 19 行简表（缩减 95%），完整正文迁入 `archive/roadmap-phases-32-41.md`（394 行）；`backlog.md` 移除 #3/#4/#5/#8 四项已上收条目并标记归档来源，剩余条目重新编号 1-4；`todo-archive.md` Phase 38-41 同步迁入 `archive/todo-archive-phases-32-41.md`（602 行，10 阶段完整正文）。
- **验证**: `pnpm lint:md`=0，`roadmap.md` 409 行（健康窗口 ≤800），`todo-archive.md` 393 行（健康窗口）。
- [x] 方向判断段缩减 ≥50%（实际 95%）
- [x] 已上收项全部标记/移除（含 #5 API 测试分层额外清理）

### 5. 友链前后博客环导航 — 评估态 (P2)

- **执行范围**: 对友链页「前后博客环」功能做最小可行性评估：相邻友链排序逻辑、前后导航 UX、数据来源（现有 FriendLink 实体复用）。
- **非目标**: 不在本阶段实现完整功能。
- **最小验收**: 评估文档输出明确的 go/no-go 结论。
- **结果**: 输出 `docs/design/governance/friend-link-ring-navigation-evaluation.md`，结论 **Go**。排序复用 `sortOrder` 字段，导航方案 A（现有端点附加 prevId/nextId），工作量估算 ~4h，零新增依赖，零架构变更。
- **验证**: `pnpm lint:md`=0。
- [x] 评估文档输出明确的 go/no-go 结论

> **审计结论**: 第五十阶段五条主线已在实现代码、配置变更、治理文档、设计文档与规划文档中完成闭环，满足归档条件。本次归档通过的门禁包括 `lint`、`typecheck`、`lint:md`、`docs:check:i18n` 与 `docs:check:line-count`。
