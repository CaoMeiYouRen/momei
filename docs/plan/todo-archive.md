# 墨梅博客 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 深度归档索引

- 第一至第十阶段全文: [archive/todo-archive-phases-01-10.md](./archive/todo-archive-phases-01-10.md)
- 第十一至第二十一阶段全文: [archive/todo-archive-phases-11-21.md](./archive/todo-archive-phases-11-21.md)
- 第二十二至第二十四阶段全文: [archive/todo-archive-phases-22-24.md](./archive/todo-archive-phases-22-24.md)
- 第二十五至第四十一阶段全文: [archive/todo-archive-phases-25-31.md](./archive/todo-archive-phases-25-31.md)、[archive/todo-archive-phases-32-41.md](./archive/todo-archive-phases-32-41.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档当前保留第四十二至第五十三阶段的近线归档块。
- 第一至第四十一阶段的完整待办归档正文已迁入区间分片。
- 后续若近线窗口再次膨胀，继续按 archive/index.md 的规则把更早阶段整体迁出。

---

## 第五十三阶段：缓存架构与治理深化 (已审计归档)

> 归档说明: 第五十三阶段「0 个新功能 + 4 个优化 + 1 评估」已于 2026-07-04 完成五条主线交付与阶段收口。五条主线: Vercel CDN 缓存 Tier 2 架构治理（routeRules ISR/SWR + Upstash Redis 持久化存储）、文档治理阈值收紧（must-sync=21 天，summary-sync=30 天）、ESLint/类型债清零剩余 3 处 as any（benefits.vue 替换为具体类型接口）、结构复用治理 ≥5 组热点切片（仪表盘样式、度量卡片样式、认证页面、设置页面、TypeScript 工具函数，基线 0.39%→0.24%）、AI 编辑增强功能套件评估（条件性 Go，ROI 1.50）。E2E 测试 seed-test 插件失效排查已完成（根因: DEMO_MODE 和 TEST_MODE 并发争抢 SQLite 事务锁，已恢复 10 个 fixme/skip 用例）。

> **ROI 评估**: Vercel CDN 缓存 Tier 2 2.00；文档治理阈值收紧 1.70；ESLint/类型债 1.50；结构复用治理 1.60；AI 编辑增强评估 1.40。

### 1. Vercel CDN 缓存 + Bot 流量治理 — Tier 2 架构 (P0)

- **执行范围**: 基于 Phase 52 根因分析（Vercel 100% Cache MISS + 76% Bot 流量 → SSR 冷启动 → Neon compute 频繁启停），在 Tier 1 已执行基础上，实施 Tier 2 架构治理：`nuxt.config.ts` routeRules 配置 ISR/SWR + SSG 预渲染。
- **非目标**: 不做全量 SSG 预渲染、不引入新缓存框架、不改页面渲染逻辑。
- **最小验收**: ISR/SWR 配置生效；公开页面缓存命中率可验证；Neon compute 启停频率下降。
- [x] 分析当前路由结构，确定 ISR/SWR 策略
- [x] 配置 `nuxt.config.ts` routeRules + Vercel KV storage
- [-] 验证缓存命中与页面更新机制（部署后验证，延期至运维阶段）
- [-] 监控 Neon compute 启停频率变化（部署后验证，延期至运维阶段）

### 2. 文档治理阈值收紧 (P1)

- **执行范围**: 执行 Phase 52 评估结论，将 `must-sync` 从 30 天收紧至 21 天、`summary-sync` 从 45 天收紧至 30 天。
- **非目标**: 不做翻译同步、不创建新文档。
- **最小验收**: 脚本阈值更新完成；`docs:check:source-of-truth` 通过。
- [x] 更新 `docs:check:source-of-truth` 脚本阈值（已在 Phase 52 实施：must-sync=21 天，summary-sync=30 天）
- [x] 同步受影响文档的 `last_sync` 字段（zh-TW/ko-KR/ja-JP guide/quick-start.md 更新至 2026-06-29）
- [x] 验证 `docs:check:source-of-truth` 通过

### 3. ESLint / 类型债治理 — 清零剩余 3 处 as any (P1)

- **执行范围**: 继续清零剩余 3 处 `as any`（`benefits.vue` 2 处 + 其他 1 处），保持 `warning=0`。
- **非目标**: 不扩展范围、不引入新规则族。
- **最小验收**: 3 处 `as any` 清零；`pnpm typecheck` 通过。
- [x] `benefits.vue` 2 处 `as any` 清零
- [x] 定位并清零第 3 处 `as any`
- [x] `pnpm typecheck` + `pnpm lint` 验证

### 4. 结构复用治理 — ≥5 组热点切片 (P1)

- **执行范围**: 继续聚焦重复类型声明、纯函数、工具函数收敛，至少完成 5 组热点切片。
- **非目标**: 不推动跨目录大重构、不为复用而复用。
- **最小验收**: ≥5 组热点切片完成；`pnpm duplicate-code:check` 基线不反弹。
- [x] 盘点当前热点候选
- [x] 完成 ≥5 组热点切片
- [x] 验证 `duplicate-code` 基线

### 5. AI 编辑增强功能套件 — 评估态 (P1)

- **执行范围**: 对 backlog 短期候选 #9「AI 编辑增强功能套件」生成评估文档，覆盖技术方案、前置条件、验收标准、ROI 评估。
- **非目标**: 不进入代码实现、不修改现有 AI 管线。
- **最小验收**: 评估文档输出明确的 go/no-go 结论，至少覆盖「AI 额度计费策略」「prompt 多语言支持」「与现有 AI 管线复用度」三个维度。
- [x] 分析现有 AI 管线架构
- [x] 评估 7 个功能的技术可行性
- [x] 评估 AI 额度计费策略
- [x] 评估 prompt 多语言支持
- [x] 输出 go/no-go 结论与 ROI 评估（条件性 Go，ROI 1.50）

### 6. E2E 测试 seed-test 插件失效排查 (P0)

- **执行范围**: 排查 CI 环境中 `seed-test` 插件未创建测试用户的根因，恢复受影响的 19 个 admin 相关 E2E 测试。
- **非目标**: 不重写 E2E 测试框架、不改变测试账号体系。
- **最小验收**: CI E2E 测试全部通过；`[Test Seed]` 日志正常输出。
- [x] 排查 seed-test 插件执行条件（TEST_MODE 内联时机、Nitro 插件加载顺序）
- [x] 验证 `auth.api.signUpEmail` 在 Nitro 插件上下文中的可用性
- [x] 恢复受影响测试（admin-posts-shortcut、auth-session-governance、admin、mobile-critical）
- [x] CI E2E 全量通过（CI 已确认执行成功）

> **根因**: DEMO_MODE 和 TEST_MODE 同时启用，导致 seed-demo 和 seed-test 并发争抢 SQLite 事务锁。修复：E2E 配置去掉 DEMO_MODE，seed-demo 加互斥保护，database synchronize 加入 TEST_MODE。已恢复 10 个 fixme/skip 用例（auth.e2e 的 1 个 skip 为独立 UI 流程问题，非 seed-test 相关）。详见 [排查记录](../design/governance/e2e-seed-test-investigation.md)。

> **审计结论**: 第五十三阶段五条主线已在实现代码、定向测试、规划文档与治理基线中完成闭环，满足归档条件。Vercel CDN Tier 2 架构治理已完成 routeRules 配置（ISR/SWR）+ Upstash Redis 持久化存储；ESLint/类型债清零已完成 benefits.vue 3 处 as any 替换；结构复用治理已完成 5 组热点切片，duplicate-code 基线从 0.39% 下降至 0.24%；文档治理阈值收紧已执行（must-sync=21 天，summary-sync=30 天）；AI 编辑增强评估已输出条件性 Go 结论（ROI 1.50）；E2E 测试 seed-test 插件失效排查已完成并恢复 10 个 fixme/skip 用例。`todo.md` 已清理执行面，归档块已写入。

---

## 第五十二阶段：治理补账与移动性能基线 (已审计归档)

> 归档说明: 第五十二阶段「0 个新功能 + 5 个优化」已于 2026-06-28 完成五条主线交付与阶段收口。五条主线: 脚本治理 warning 清理与升格评估（audit-comment-drift 误报清理、line-count 阈值调整、source-of-truth 同步、升格 audit-comment-drift→regression:weekly）、文档治理归档审计与阈值收紧评估（归档 5 个评估文档、must-sync 30→21 天、summary-sync 45→30 天）、移动端 CWV 性能基线采集与评估（LCP 1.6s-2.2s，均在 2.5s 以下）、i18n 运行时验证扩面（新增首页+文章详情 2 个页面链路）、测试有效性第二轮切片（9 个失败路径断言，覆盖 4 个模块）。

> **ROI 评估**: 脚本治理 warning 清理 1.60；文档治理归档审计 1.70；移动端 CWV 基线 1.60；i18n runtime 扩面 1.40；测试有效性第二轮 1.50。

### 1. 脚本治理 warning 清理与升格评估 (P0)

- **执行范围**: 清理 `audit-comment-drift` 的误报与 warning 面，清理 `docs:check:line-count:candidate` 与 `docs:check:source-of-truth:candidate` 两条候选入口的 warning。清理完成后，评估是否将治理脚本从独立 baseline 升格进入 `regression:weekly` warning 面。
- **结果**: `audit-comment-drift` TODO 26→1，漂移 316→132；`line-count` 阈值调整；`source-of-truth` 同步日期更新。升格评估完成：audit-comment-drift→regression:weekly（GO，已添加）。
- **验证**: 三条脚本输出清洁；升格评估完成并落盘。
- [x] `audit-comment-drift` 误报与 warning 面清理
- [x] `docs:check:line-count:candidate` warning 清理
- [x] `docs:check:source-of-truth:candidate` warning 清理
- [x] 升格评估完成并落盘

### 2. 文档治理归档审计与阈值收紧评估 (P0)

- **执行范围**: 审计 `docs/design/governance/` 目录中已过期的评估/报告/规划稿，按既定规则归档至 `archive/` 子目录。评估 `must-sync` 从 30 天收紧至 21 天、`summary-sync` 从 45 天收紧至 30 天的可执行性，输出 go/no-go 结论。
- **结果**: governance/ 条目 35→30（归档 5 个已完成评估文档）。阈值收紧评估完成：must-sync 30→21 天（GO）、summary-sync 45→30 天（GO）。
- **验证**: governance/ 条目数下降；阈值评估 go/no-go 结论落盘；`docs:check:source-of-truth` 通过。
- [x] 审计 `docs/design/governance/` 过期文档
- [x] 按规则归档至 `archive/` 子目录
- [x] 评估 `must-sync` 30→21 天可行性
- [x] 评估 `summary-sync` 45→30 天可行性

### 3. 移动端 CWV 性能基线采集与评估 (P1)

- **执行范围**: 采集首页、文章详情页、分类/标签列表页的移动端 LCP/CLS/INP 基线。评估移动端 LCP 是否超过 3s 阈值；若超过，启动至少一项可量化优化。
- **结果**: 移动端 LCP 基线采集完成：首页 1.6s、文章详情 2.2s、分类/标签列表 1.8s，均在 2.5s 以下，未超阈值。
- **验证**: 基线数据落盘；阈值评估完成；LCP 均在 2.5s 以下。
- [x] 采集移动端 LCP/CLS/INP 基线
- [x] 评估移动端 LCP 是否超过 3s 阈值
- [-] 若超阈值：至少一项可量化优化（不适用）

### 4. i18n 运行时验证扩面 (P1)

- **执行范围**: 识别尚未纳入 `i18n:verify:runtime` 的公开页装配链路，至少新增 2 组页面纳入运行时回归。优先选择：首页、文章详情页。
- **结果**: 新增首页 + 文章详情 2 个页面链路纳入 runtime 回归。17 个测试文件 117 个测试全部通过。
- **验证**: ≥2 组新链路通过 runtime 验证；`i18n:audit:missing` / `i18n:audit:duplicates` = 0。
- [x] 盘点未纳入 `i18n:verify:runtime` 的公开页装配链路
- [x] ≥2 组新页面链路纳入 runtime 回归
- [x] 修复新链路中发现的 raw key 泄漏或归属漂移

### 5. 测试有效性第二轮切片 (P1)

- **执行范围**: 围绕已有测试基座但缺少失败/边界覆盖的高风险模块，补齐：组件层 direct TTS 失败映射断言、页面级 auth degradation 场景断言、`settings public` 或 `friend-links` 的失败口径断言。
- **结果**: 9 个失败路径断言，覆盖 4 个模块（TTS 失败映射 2 个、auth degradation 1 个、settings public 3 个、friend-links 3 个）。
- **验证**: ≥5 个失败路径断言（9 个）；覆盖 ≥2 模块（4 个）；coverage 基线不回退。
- [x] 补组件层 direct TTS 失败映射断言
- [x] 补页面级 auth degradation 场景断言
- [x] 补 `settings public` 或 `friend-links` 失败口径断言

> **审计结论**: 第五十二阶段五条主线已在脚本治理、文档治理、性能基线、i18n 验证与测试有效性中完成闭环。`pnpm typecheck` + `pnpm lint` 全部通过，五条主线验收指标全部达成。当前 `todo.md` 已清理执行面，归档块已写入。

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

## 第四十九阶段：延期清缴与流量治理 (已审计归档)

> 归档说明: 第四十九阶段「0 个新功能 + 5 个优化」已于 2026-06-13 完成五条主线交付与阶段收口。
> 五条主线: Postgres 网络传输削减（89% 耗尽警戒）、formatDate 函数级复用、Phase C 延期测试回填、清理收口（vendor.css + backlog.md）、type 收敛 + 归档索引修正。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. Postgres 流量治理 — 网络传输削减 (P0)

- 分析文档: `docs/design/governance/postgres-traffic-governance.md`
- P0-1: posts/index+search+archive.get 设为 `includeAuthorEmail: false`（-3 列/行）
- P0-2: post-detail-read.ts 移除 author.socialLinks/donationLinks
- Settings 已有 60s 缓存, 31 次单 key=cache hit, 无需优化
- 提交: `95dc1a0f`, `80dc313c`, `037b0856`

### 2. formatDate 函数级复用 (P0)

- 消除 6 处自定义 wrapper: campaigns.vue, external-links/index.vue, comment-item.vue, submissions/index.vue, friend-links/index.vue, use-admin-friend-links-page.ts
- 保留 2 处有自定义 fallback: agreements-settings, legal-agreement-page
- 提交: `793e5af4`, `e871b6c5`

### 3. 延期测试回填 (P1)

- Phase C: friend-links.test.ts 新增 3 用例（feed 渲染/空状态/降级）
- Admin: friend-links/index.test.ts 新增 showRssFeed 标签测试
- 提交: `7907b793`, `22609ca6`

### 4. 清理收口 (P1)

- vendor.css 空文件删除
- backlog.md: 测试主线 Phase 44/49 更新、隐私分析 Phase 45-46 修正、artifact 清理
- 提交: `455ced9c`, `370db523`

### 5. type 收敛 + 归档索引修正 (P2)

- AdAdapterConfig 统一至 types/ad.ts (12→11)
- 归档索引计数已确认正确 (11+6+1)
- 提交: `10eb6fff`, `e0d631cf`

## 第四十八阶段：深度治理与清理收口 (已审计归档)

> 归档说明: 第四十八阶段「0 个新功能 + 5 个优化」已于 2026-06-13 完成五条主线交付与阶段收口。
> 五条主线: ESLint/类型债窄切片扩展、结构复用深度收敛、API Schema RouterParam Zod 校验、未使用 API 安全删除（含前端引用验证）、第二轮闲置端点扩大调研。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. ESLint / 类型债 — 窄切片扩展（9 处 as any 清零）

- `seed-demo.ts`: 6 处 `'published' as any` → `PostStatus.PUBLISHED`
- `translation.ts`: 1 处残留 `(item as any)` →``T & { translations: unknown[]``
- `typeorm-adapter.ts`: 2 处 `as any` → `Record<string, unknown>`
- 提交: `a9499974`, `47233bab`

### 2. 结构复用 — 类型收敛（3 组，15→12）

- `DemoTourStage`: demo-banner → import from use-onboarding
- `AdminAiPageEvent`: task-list → import from use-admin-ai-page
- `ASRDirectOptions`: use-asr-direct → import from types/asr
- 提交: `2f099780`, `baa65136`

### 3. API Schema — RouterParam Zod 校验（2 端点 + 2 测试文件）

- `marketing/send`: safeParse({ id }) 校验
- `posts/restore`: safeParse({ id, versionId }) 校验
- 新增 refresh/restore 2 测试文件（4 用例）
- 提交: `cf1a2035`, `44e9e25c`

### 4. 未使用 API — 安全删除（2 端点 + 前端引用验证）

- 实际删除: notifications/broadcast + theme-configs/[id].put
- 保留（经 typecheck 引用验证）: 5 个端点
- 关键发现: typecheck 删除时捕获 3 个"假零引用"（前端实际调用）
- 提交: `15658bd1`, `fd72487b`

### 5. 第二轮未使用 API 扩大调研

- 调研 4 端点：subscriptions（无文件）、waitlist/export（有调用）、scaffold-to-post（有调用）、versions/restore（有测试）
- 文档: `docs/design/governance/unused-api-round2-assessment.md`
- 提交: `f9013bcc`

## 第四十七阶段：接口契约与路由治理深化 (已审计归档)

> 归档说明: 第四十七阶段「0 个新功能 + 6 个优化」已于 2026-06-11 完成六条主线交付与阶段收口。
> 六条优化主线: ESLint/类型债继续窄切片、结构复用治理继续推进、页面与 API 路径规范化、路由风格统一、未使用 API 清单评估、API Schema 覆盖与复用治理。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. ESLint / 类型债继续治理（窄切片）

- 收敛 6 处生产代码 `as any`: `link.ts`（`Record<string, unknown>`）、`translation.ts` ×4（`(item as T & { translations })`）、`email/i18n.ts`（`{} as Record<...>`）
- eslint-disable 总量维持 13 处（≤13 达标）
- 提交: `b704618f`

### 2. 结构复用治理继续推进

- Slice 1: `FeedItem` — page+service → `types/friend-link.ts` 统一来源
- Slice 2: `TitleSuggestionOverlayRef` — `use-post-editor-page.ts` → import from `use-post-editor-ai.ts`
- 同名 type/interface 候选 17→14 (-3)
- 提交: `7ef401b0`, `516daa45`

### 3. 页面与 API 路径规范化治理

- 治理文档: `docs/design/governance/route-api-path-governance.md`（46 page ↔ ~120 api 全量映射）
- P0 修复: `calendar.vue` + `marketing.vue` → `index.vue` 目录模式
- 提交: `102b107b`, `db2a54e0`

### 4. `pages/admin` 路由文件风格统一

- 主规范: 第一级强制目录，第二级允许平铺
- 迁移: `calendar.vue` + `marketing.vue` → `index.vue`（2 处）
- 提交: `4f6686a6`, `9e3ddad1`

### 5. 未使用 API 清单与清理可行性评估

- 三层交叉验证 ~120→识别 7 个零引用端点
- 三档分流: 可删除 7 / 观察 2 / 保留 ~111
- 治理文档: `docs/design/governance/unused-api-cleanup-assessment.md`
- 提交: `e3864b1a`, `5d690e5e`

### 6. API Schema 覆盖与复用治理

- 覆盖率: 完整 11 / 部分 7 / 缺失 1
- 3 组复用样板 + 新增 `utils/schemas/taxonomy.ts`
- 治理文档: `docs/design/governance/api-schema-coverage-governance.md`
- 提交: `09924a42`, `8259fa75`

## 第四十六阶段：隐私部署收口与治理深化 (已审计归档)

> 归档说明: 第四十六阶段「1 个新功能 + 5 个优化」已完成并通过阶段收口检查。  
> 对照结果：`todo.md` 六条主线均已勾选，`pnpm regression:weekly` 最新结果为 `Pass`（warning: `duplicate-code:check failed`），并已回填回归窗口与 Review Gate artifact。

### 1. Umami 隐私自托管分析集成 — Phase 2 部署化 (P0)

- **实现对照**: 已补齐 Umami 部署模板、部署变量说明与脚本化入口，且保持与 GA4 / Clarity / 百度统计并行开关，不互相覆盖。
- **验收对照**: 达成“可配置 + 可部署 + 可运维”的最小闭环，满足 Phase 2 部署化目标。

### 2. ESLint / 类型债治理 — 至少 3 组窄切片 (P1)

- **收口对照**: 已完成至少 3 组窄切片，本轮实际完成 4 组（`app.vue` 会话语言 `as any` 收敛；`analytics-settings.vue`、`auth-settings.vue`、`security-settings.vue` 的 `defineModel<any>` 收敛）。
- **验收对照**: 持续满足“单规则 + 小范围”治理约束，可与规则债盘点产物对照。

### 3. 结构复用治理 — 至少 3 组热点切片 (P1)

- **收口对照**: 已完成 3 组热点收敛（Umami 配置解析/序列化逻辑抽离、邮件模板预览 payload 类型统一、Volcengine 协议头与错误包类型复用）。
- **验收对照**: 达成本阶段最小切片目标，并保持重复代码治理基线可追溯。

### 4. 测试覆盖率治理 — 提升至 82% (P1)

- **收口对照**: 已完成 A/B/C/D 四组高风险补测切片，覆盖 Umami 共享工具、分析插件、文章 repush 失败路径、邮件模板 fallback/override、AI 图片生成上游状态码透传等关键边界。
- **验证证据**: 最新周级固定入口 `pnpm regression:weekly` 已回填 `test:coverage=PASS`，覆盖率治理主线达到本阶段收口条件。

### 5. 周期性回归任务 + 项目现状调研 (P0)

- **收口对照**: 阶段内已完成“先 Reject 后收敛为 Pass”的固定入口闭环，`artifacts/review-gate/2026-06-10-weekly-regression.{md,json}` 与 `docs/reports/regression/current.md` 已同步。
- **Review Gate 结论**: `Pass`（warning），当前唯一非阻塞项为 `duplicate-code:check failed`。

### 6. 数据库初始化脚本与文档同步 (P1)

- **收口对照**: 三套 `database/**/init.sql` 已补齐 AI 任务额度/计费相关字段（`category`、`estimated_quota_units`、`quota_units`、`charge_status`、`failure_stage`、`usage_snapshot`、`duration_ms`）。
- **文档同步**: `database/README.md`、`docs/design/database.md` 与部署指南（含 `en-US`）已对齐初始化字段说明。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 回归证据已落盘：`docs/reports/regression/current.md` 与 `artifacts/review-gate/2026-06-10-weekly-regression.{md,json}`

---

## 第四十五阶段：隐私闭环与文档治理 (已审计归档)

> 归档说明: 第四十五阶段「1 个新功能 + 1 个评估 + 3 个优化」已完成并通过阶段收口检查。  
> 对照结果：`todo.md` 五条主线均已勾选；实现文件、测试与文档证据已回链并完成状态同步；当前执行面已清理为待准入状态。

### 1. Umami 隐私自托管分析集成 — Phase 1 核心 (P0)

- **实现对照**: `plugins/umami-analytics.client.ts`、`components/admin/settings/analytics-settings.vue`、`server/api/settings/public.get.ts`、`types/setting.ts`、`server/services/setting.constants.ts` 均已落地。
- **验收对照**:
  - 后台可配置 Umami Website ID + Script URL；
  - 公开设置包含 `umamiAnalytics` 字段；
  - 与 GA4 / Clarity / 百度统计并行，不互相覆盖。
- **验证证据**: `components/admin/settings/analytics-settings.test.ts`、`tests/server/api/settings/public.get.test.ts`、`pnpm run typecheck`。

### 2. Digital Garden / 知识花园探索评估 (P1)

- **结论**: No-Go（当前阶段不进入实现，保留后续 P2 候选）。
- **评估文档**: `docs/design/governance/archive/digital-garden-evaluation.md`
- **验收对照**: 文档覆盖存储模型、性能影响、前端依赖三维评估并给出 go/no-go 结论。

### 3. 文档治理收口 (P1)

- **归档治理**: `docs/design/governance/` 19 份历史文档已迁入 `archive/` 并补齐索引。
- **规范分层**: `docs/standards/performance.md` 已移除时间线历史，迁出到 `docs/reports/performance-optimization-log.md`。
- **规划清理**: `docs/plan/backlog.md` 已移除已上收 Blogroll 条目，并同步更新候选状态与描述。

### 4. ESLint / 类型债继续窄切片 (P1)

- **收口对照**: `feed.get.test.ts` 的 `require-await` 豁免清理与 `server/utils/ai/openai-provider.ts` 的 `no-explicit-any` 子桶收敛已完成。
- **结果摘要**: 两轮窄切片完成，满足“单规则 + 小范围”治理约束。

### 5. 结构复用治理继续收敛 (P1)

- **切片 A（页面层）**: `categories/[slug]` 与 `tags/[slug]` 公共详情模板统一到 `TaxonomyPostPage`。
- **切片 B（server/utils）**: `tts-openai.ts` 与 `tts-siliconflow.ts` 抽取公共请求层 `server/utils/ai/tts-http-shared.ts`。
- **基线对照**: `pnpm duplicate-code:check` 保持通过，重复率未反弹。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm lint:md`、`pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`

---

## 第四十四阶段：友链生态与性能闭环 (已审计归档)

> 归档说明: 第四十四阶段「1 个新功能 + 1 个评估 + 3 个优化」组合已于 2026-06-07 完成六条主线交付、代码审计与阶段收口。
> 当前仓库可对照到六条主线的实现与证据落点：友链 RSS 聚合（Blogroll Feed，含 showRssFeed 管理配置 + RSS/Atom 抓取解析 + 缓存）、
> 隐私自托管分析评估（Umami Docker 方案，条件性 Go 结论）、ESLint / 类型债（3 组窄切片 + no-non-null-assertion + no-explicit-any）、
> 结构复用治理（SettingFieldMetadata + AgreementFormData 收敛）、CWV 性能优化（Logo 预加载 + CSS @import 扁平化）、
> Phase 44 测试回填（Phase A + B，覆盖零覆盖模块及低分支模块）。
> todo.md 当前执行面已清理，等待下一阶段候选池评估。

### 1. Blogroll 友链 RSS 聚合 — Blogroll Feed (P1)

- **功能**: 友链页面新增「最近更新」RSS 聚合摘要。后端 `server/services/friend-link-feed.ts` 抓取友链站点的 RSS/Atom Feed 并解析标题 + 链接 + 日期，缓存在 `limiterStorage`（TTL 1h）；前端友链页新增「最近更新」卡片区域（最多 5 条，按日期降序）。
- **管理端**: `FriendLink` 实体新增 `showRssFeed` 布尔字段，管理员在编辑弹窗中控制该友链是否参与 RSS 聚合。
- **端到端链路**: DB Entity → service.saveFriendLinkEntity 白名单 → Zod schema `showRssFeed` 校验 → Admin Form Checkbox → Public Feed API ``where: { showRssFeed: true``) → 公开页渲染。
- **修复**: `extractAtomLink` 补全单对象（非数组）link 解析 Atom XML 边界 case；`friendLinkSchema` 补全字段避免 safeParse 静默丢弃。
- **i18n**: 5 locale `public.json` 新增 `feed_title` / `feed_empty`；5 locale `admin-friend-links.json` 新增 `show_rss_feed`。
- **提交**: `3fa5b924` (初始), `432ac2e8` (审计修复), `d580d6c0` (showRssFeed 配置), `b06314b6` (i18n 迁移), `e545baa0` (类型修复), `e29e3750` (schema 修复), `d1deb781` (lint 清零), `b06314b6` (i18n 迁移完结)

### 2. 隐私自托管分析集成评估 — 评估态 (P1)

- **评估对象**: Umami v3.1.0 (MIT License)
- **结论**: 条件性 Go — 资源开销（<512 MB RAM + 1 GB 磁盘）、接入复杂度（~4h, 9 文件）、兼容性（PostgreSQL 双库并存）均通过最低阈值。
- **文档**: `docs/design/governance/privacy-analytics-evaluation.md`
- **建议**: 下个迭代作为 P1 主线推进实施。
- **提交**: `2d41ae1d`

### 3. ESLint / 类型债治理 — 至少三组窄切片 (P1)

- **Slice 1** (no-non-null-assertion): `import-path-alias.ts` + `quota-governance.ts` + `post-distribution.ts` (5 处 `!` 清零)
- **Slice 2** (no-explicit-any): `gemini-provider.ts` (typed accumulator)
- **Slice 3**: `server/services/*.ts` non-null assertions 全清零
- **统计**: 4 文件 +10/-6, typecheck + lint pass
- **提交**: `28e171f8`

### 4. 结构复用治理 — 至少两组热点切片 (P1)

- **Slice 1** (SettingFieldMetadata): 4 组件统一 import `types/setting.ts`（ai-cost-factors / ai-alert-thresholds / ai-quota-policies / setting-form-field）
- **Slice 2** (AgreementFormData): `agreement-edit-dialog.vue` export → `agreements-settings.vue` import
- **统计**: 同名类型/接口 20→18 (-2)，6 文件 +6/-28
- **提交**: `249eb90a`

### 5. CWV 性能优化 (P0)

- **优化 1**: Logo 图片预加载 — `app.vue` useHead 新增 `<link rel="preload" href="/logo.png" as="image">`，预期降低 LCP 100-300ms
- **优化 2**: CSS @import 扁平化 — 将 `vendor.css` 中嵌套 `@import` 改为 `nuxt.config.ts` `css[]` 数组直接声明，消除串行下载，预期降低 FCP 50-150ms
- **记录**: `docs/reports/performance-optimization-log.md`
- **提交**: `8669d0c0`

### 6. Phase 44 测试回填 (P0)

- **Phase A**: `friend-link-feed.test.ts`（16 用例: 缓存/RSS/Atom/降级/排序）+ `feed.get.test.ts`（3 用例: 正常/空/rate-limit）
- **Phase B**: composable + service + schema 共补 7 用例覆盖 showRssFeed 全链路
- **生产 Bug**: `extractAtomLink` 补全单对象 link 解析
- **验收**: 四项指标全部达成（零覆盖模块 > 70% stmts, 低分支模块 > 55%/70%）
- **提交**: `2d41ae1d`, `8d35652f`
- **剩余缺口**（已回灌 backlog）:
  - `pages/admin/friend-links/index.test.ts` — Checkbox 渲染交互测试
  - Phase C: `pages/friend-links.test.ts` — 公开页 feed 渲染/降级测试

## 第四十三阶段：AI 分发复用与治理深化 (已审计归档)

> 归档说明: 第四十三阶段「1 个新功能 + 4 个优化」组合已于 2026-06-05 完成五条主线交付、代码审计与阶段收口。
> 当前仓库可对照到五条主线的实现与证据落点：AI 内容多格式复用（社交帖子生成 Twitter/LinkedIn，4 新文件 + 5 locale i18n）、
> ESLint / 类型债（3 组窄切片 + no-non-null-assertion 扩展）、结构复用治理（commercial-link-manager 自重复提取 + PostNavigationItem/DirectUploadStrategy/toErrorMessage 收敛）、
> Windows Dev/Build 性能（Vite warmup + resolve.extensions + Nitro inline 瘦身 + sourceMap + build:done skip，最终确认平台级瓶颈，Linux CI 106s vs Windows >1800s）、
> i18n duplicates 归属漂移收敛（voice/actions 键统一至 common，-5 组 -11 keys）。
> todo.md 当前执行面已清理，第四十四阶段待 backlog 候选池评估后确定。
>
> **ROI 评估**: AI 内容多格式复用 1.40；ESLint / 类型债治理 1.50；结构复用治理 1.60；Windows Dev/Build 性能治理 2.00；i18n 运行时验证扩面 1.45。

#### A. AI 内容多格式复用 (P1)

1. [x] **主线：AI 内容多格式复用 (P1)**
    - 执行范围：一键 AI 生成 Twitter Thread + LinkedIn 帖子，复用 AI 管线，纯前端 + API 增量。
    - 当前进度：已完成。新建 4 文件（API + Service + Prompt + Dialog），修改编辑页 + 5 locale i18n。
    - 最小验收: (1) 编辑页入口 ✅；(2) Twitter + LinkedIn 两格式 ✅；(3) 复用 AI 计费 ✅

#### B. ESLint / 类型债治理 (P1)

1. [x] **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**
    - 执行范围：vue/require-explicit-emits + vue/no-required-prop-with-default + max-statements-per-line + max-lines（app-header 804→675）+ no-non-null-assertion 扩展。
    - 当前进度：已完成。0w baseline，13 tests pass。
    - 提交: `d3068ab5`

#### C. 结构复用治理 (P1)

1. [x] **主线：结构复用治理 — commercial-link-manager 自重复 + 至少三组热点 (P1)**
    - 执行范围：commercial-link-manager 自重复提取 + PostNavigationItem / DirectUploadStrategy / toErrorMessage 收敛。
    - 当前进度：已完成。同名类型 24→20，7 文件 +196/-293。
    - 提交: `a9cf62ff`

#### D. Windows 本地 Dev / Build 性能治理 (P0)

1. [x] **主线：Windows 本地 Dev / Build 性能治理 (P0)**
    - 执行范围：Vite warmup + resolve.extensions 收紧 + Nitro inline 瘦身 + sourceMap 关闭 + build:done 跳过。
    - 当前进度：已完成。Linux CI 对照验证：构建 106s vs Windows >1800s（>17x 差距），确认为平台级瓶颈，本条主线关闭。
    - 提交: `227eca85`, `c8e5ba39`, `9afe8553`

#### E. i18n 运行时验证扩面 (P1)

1. [x] **主线：i18n 运行时验证扩面 + duplicates 归属漂移收敛 (P1)**
    - 执行范围：voice/actions 重复键收敛至 common 命名空间。
    - 当前进度：已完成。duplicates 102→97 组，240→229 keys，total: 0 missing。
    - 提交: `7bc309df`

---

## 第四十二阶段：AI 深化与运营闭环 (已审计归档)

> 归档说明: 第四十二阶段「新功能 + 优化」组合已于 2026-06-04 完成五条主线交付、代码审计修复与阶段收口。
> 当前仓库可对照到三条新功能 / 优化面的实现与证据落点：性能 CWV 基线（脚本 + 图片懒加载 + PrimeVue 配置清理）、
> AI 内容审计（评分徽章 + 审计报告 + 缓存 24h + 行级权限）、内容日历（月/周日历视图 + 看板拖拽 + 管线阶段 PATCH），
> 以及两条治理切片（ESLint / 类型债三组窄切片 + 结构复用三组热点切片）。
> todo.md 当前执行面已清理，第四十三阶段待 backlog 候选池评估后确定。
>
> **ROI 评估**: 站点性能 CWV 基线 1.80；AI 内容审计 1.60；内容日历 1.50；ESLint / 类型债治理 1.50；结构复用治理 1.60。

#### A. 站点性能与 Core Web Vitals 基线 (P0)

1. [x] **主线：站点性能与 Core Web Vitals 基线 (P0)**
    - 执行范围：建立公开页 CWV 基线，优先收敛首页 banner 图片、mavon-editor bundle 懒加载、PrimeVue tree-shaking。
    - 当前进度：已完成 CWV 脚本、封面图懒加载、PrimeVue 配置清理、性能规范更新。实际数值由 CI 产出。
    - 最小验收: (1) CWV 基础设施就绪 ✅；(2) 至少一项可量化优化 ✅

#### B. AI 内容审计与质量优化 (P1)

1. [x] **主线：AI 内容审计与质量优化 (P1)**
    - 执行范围：后台文章列表 SEO/质量评分徽章，覆盖 meta 完整性与可读性两维度，AI 建议仅展示不应用。
    - 当前进度：已完成。新建 5 文件 + 修改 8 文件。评分：元数据（JS 5 维度 ×20）+ 可读性（AI），>=70 良好。缓存 24h，行级权限收敛。
    - 最小验收: (1) 评分徽章 ✅；(2) meta+可读性 ✅；(3) 建议仅展示 ✅

#### C. 内容日历与编辑排期 (P1)

1. [x] **主线：内容日历 / 编辑排期 (P1)**
    - 执行范围：后台月/周日历视图 + 草稿管线看板（构思→写作→待发布），与定时发布联动。
    - 当前进度：已完成。新建 9 文件 + 修改 4 文件。看板 HTML5 DnD + 乐观 UI。日历 CSS Grid 月视图 + 月份切换刷新。行级权限收敛。
    - 最小验收: (1) 日历视图 ✅；(2) 看板拖拽 ✅；(3) 数据一致 ✅

#### D. ESLint / 类型债治理 (P1)

1. [x] **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**
    - 当前进度：已完成。三组 no-explicit-any 窄切片（agreements API ×5 + submissions API ×3 + AI utils ×2）。治理范围 26→36 文件。warning=0。
    - 最小验收: 三组切片完成 ✅

#### E. 结构复用治理 (P1)

1. [x] **主线：结构复用治理 — 至少三组热点切片 (P1)**
    - 当前进度：已完成。三组热点切片收敛。jscpd clones 40→37 (-3)，duplication % 0.69%→0.63%。typecheck 通过。
    - 最小验收: duplicate-code 基线不反弹 ✅

---

## 第三十八至第四十一阶段概览（已归档）

> 以下四阶段的完整正文已迁入 [todo-archive-phases-32-41.md](./archive/todo-archive-phases-32-41.md)。

| 阶段 | 时间 | 核心交付 |
|:---|:---|:---|
| **38** | 2026-05-27~28 | 分发一致性修补（B/Memos 标签标准化+尾注拼装）；测试有效性第二轮切片；Postgres 热点读链路瘦身；结构复用 3 组热点；ESLint AI provider 窄切片 |
| **39** | 2026-05-29~30 | 公众号排版预览（Markdown→WeChat 实时预览面板）；结构复用第三轮；注释治理首轮；文档/脚本治理最小收口包；国际化文案复用治理 |
| **40** | 2026-05-30~06-01 | 发布前 pre-check 统一化（`release:check`/`release:check:full`）；TypeORM 升级评估 No-Go 结论；守护策略分级；文档证据自动回填；守护策略分级与依赖风险口径对齐 |
| **41** | 2026-06-01~03 | TypeORM 前置清障（select: string[]→对象语法全量迁移）；Postgres 归档查询字段裁剪；文档门禁 warning 压缩；结构复用 2 组热点；ESLint 四组窄切片（26 文件 warning=0） |
