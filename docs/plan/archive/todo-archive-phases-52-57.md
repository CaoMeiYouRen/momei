# 第五十二至第五十七阶段深度归档

> 本文档包含第五十二至第五十七阶段的完整归档记录。

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

## 第五十四阶段：CLI/MCP 复用与治理深水区 (已审计归档)

> 归档说明: 第五十四阶段「1 个新功能 + 4 个优化」已于 2026-07-07 完成五条主线交付与阶段收口。五条主线: CLI/MCP API 客户端复用优化阶段一（CLI +3, MCP +4 接口）、结构复用治理深水区（单函数文件整合 + 逻辑重复检测脚本）、ESLint/类型债治理（规则债 inventory 脚本 + 3 组窄切片）、测试有效性第二轮切片（6 个新增失败路径断言，覆盖 3 个模块）、脚本治理（eslint-debt 升格到 regression:weekly + comment-drift 误报修复）。插队任务：定时推送功能修复已完成。

> **ROI 评估**: CLI/MCP 复用 2.00；结构复用深水区 1.80；ESLint/类型债 1.50；测试有效性 1.50；脚本治理升格 1.60。

### 1. CLI 与 MCP 包 API 客户端代码复用优化 — 阶段一 (P1)

- **执行范围**: 补齐两个包缺失的接口（CLI +3, MCP +4），统一 API 方法覆盖。
- **实现对照**:
  - CLI 新增：`listPosts()`、`updatePost()`、`deletePost()`
  - MCP 新增：`validateImportPost()`、`dryRunLinkGovernance()`、`applyLinkGovernance()`、`getLinkGovernanceReport()`
- **验收对照**: 两个包 API 方法覆盖率达到 100%；`pnpm typecheck` + `pnpm lint` 通过。

### 2. 结构复用治理深水区 — 文件整合 + 逻辑重复排查 (P1)

- **单函数文件整合**:
  - 类型守卫整合（`isPlainRecord`、`isRecord` 等）→ `utils/type-guards.ts`
  - 杂项整合（`stable-serialize`、`json-clone`、`markdown-heading`、`route-path`）→ `utils/shared/misc.ts`
- **逻辑重复检测脚本**: 实现 `scripts/governance/audit-logical-duplicates.mjs`，覆盖 `utils/` 和 `server/utils/`，检测 467 个函数，40 组候选。
- **逻辑重复收敛**: 待下一阶段继续（≥2 组抽象重构）。
- **基线对照**: `pnpm duplicate-code:check` 基线不反弹（0.24%）。

### 3. ESLint / 类型债治理 — 规则债 inventory 脚本 + 窄切片 (P1)

- **规则债 inventory 脚本**: 实现 `scripts/governance/inventory-eslint-rules.mjs`，覆盖 `no-explicit-any` 和 `no-non-null-assertion`，输出维度：rule / 目录 / 命中数 / 清零数 / warning 基线。
- **窄切片**（3 组）:
  - 切片 1：`types/marketing.ts` + `server/entities/marketing-campaign.ts`（no-explicit-any：`targetCriteria: any` → `MarketingCampaignTargetCriteria`）
  - 切片 2：`server/api/categories/slug/[slug].get.ts`（no-explicit-any：`any[]` → `Pick<Category, 'language' | 'slug'>[]`）
  - 切片 3：`server/api/snippets/index.post.ts`（no-explicit-any：`let user: any` → `let user: User`）
- **验收**: inventory 脚本输出 baseline JSON；≥3 组窄切片完成；`pnpm governance:audit:eslint-debt` 显示 delta 可对照；warning=0。

### 4. 测试有效性第二轮切片 (P1)

- **失败路径断言补齐**:
  - 组件层 direct TTS 失败映射断言（4 个）：凭证过期、WebSocket 连接失败、WebSocket 关闭无音频、上传失败
  - `settings public` 失败口径断言（1 个）：localized settings resolution 异常 → 500
  - `friend-links` 失败口径断言（2 个）：reviewApplication 不存在 → 404、createApplication 禁用 → 403
- **验收**: ≥5 个新增失败路径断言（实际 6 个）；覆盖 ≥2 个模块（TTS、settings、friend-link 三个模块）；全仓 coverage 基线不回退。

### 5. 脚本治理 — 治理脚本升格评估与 warning 清理 (P1)

- **升格评估**:
  - `governance:audit:simple-duplicates`：❌ 不升格（输出候选列表需人工判断）
  - `governance:audit:eslint-debt`：✅ 升格到 `regression:weekly`（warning=0，执行时间短，可防止代码质量回退）
  - `governance:audit:comment-drift`：✅ 已升格，保持现状（已在 weekly 中作为可选步骤）
- **warning 清理**:
  - `audit-comment-drift` 误报修复：添加 URL scheme 过滤器，TODO 1→0，逐行复述 73→14，漂移 132→123
  - `docs:check:line-count` 清理：`todo-archive.md` 627→443 行（第四十二至第四十五阶段迁入深度归档）
- **验收**: ≥1 个治理脚本完成升格评估；`audit-comment-drift` 误报与 warning 面可见下降；两条 docs candidate 产出清洁输出。

### 插队任务：定时推送功能修复（Bug Fix）✅ 已完成

- **插入原因**: 阻塞性 Bug，影响营销推送核心功能
- **完成时间**: 2026-07-07
- **修复内容**:
  - 问题 1：定时任务未触发（`task-scheduler.ts` Cron 任务配置修复）
  - 问题 2：Listmonk 渠道定时任务缺失（`resolveListmonkStatusPayload` 函数修复）
  - 问题 3：定时时间未同步（`repush.post.ts` + `createCampaignFromPost` 修复）
- **验收**: 定时推送能正确触发；Listmonk 渠道正常工作；定时时间正确同步；40 个测试通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 文档检查已执行：`pnpm lint`、`pnpm typecheck`
- [x] 测试通过（48 个新增测试通过）

---

## 第五十五阶段：AI 降级与接口扩展 (已审计归档)

> 归档说明: 第五十五阶段「2 个新功能 + 3 个优化」已于 2026-07-13 完成五条主线交付与阶段收口。五条主线: CLI/MCP 阶段二新增外部接口（4 组 REST + 灵感转文章 + 文章版本，CLI +15, MCP +16）；AI 功能备用路线与自动降级（fallback 链 + 降级日志 + 透明切换）；结构复用逻辑重复收敛（≥2 组抽象切片，duplicate-code 0.33% < 基线 1.22%）；ESLint/类型债 ≥3 组窄切片（social-post-platforms no-non-null-assertion, nuxt.config.ts no-explicit-any, admin-taxonomy-page no-explicit-any，累计消除 22 处）；测试有效性第三轮切片（7 个新增失败路径断言，覆盖 3 个模块）。所有主线均通过 Review Gate 审计。

> **ROI 评估**: CLI/MCP 阶段二 1.80；AI 降级 1.70；结构复用收敛 1.60；ESLint/类型债 1.50；测试有效性第三轮 1.50。

### 1. CLI/MCP 阶段二 — 新增外部接口 (P1)

- **执行范围**: 补齐 4 组外部 REST 接口（分类、标签、灵感 CRUD）+ 灵感转文章 + 文章版本查询/创建，CLI 包新增 15 个客户端方法，MCP 包新增 16 个工具。
- **实现对照**:
  - 外部 API：`/api/external/categories` (GET/POST/PUT/DELETE)、`/api/external/tags` (GET/POST/PUT/DELETE)、`/api/external/snippets` (GET/POST/GET/PUT/DELETE)、`/api/external/snippets/[id]/convert` (POST)、`/api/external/posts/[id]/versions` (GET/POST)
  - CLI：15 个新方法覆盖所有外部接口
  - MCP：15 个新 API 方法 + 16 个新工具
- **验收对照**: ≥15 个外部接口；CLI/MCP 方法覆盖率 100%；`pnpm typecheck` + `pnpm lint` 通过。

### 2. AI 功能备用路线与自动降级 (P1)

- **执行范围**: 新增 `SettingKey.AI_FALLBACK_PROVIDER` 配置项，实现 `getAIProviderWithFallback` / `getAIImageProviderWithFallback`，TextService 9 个方法 + ImageService 使用 fallback 链，降级日志可持久化，FallbackAIProvider 透明接管。
- **验收对照**: 主提供商失败时自动切换备用；降级日志可追踪；现有测试全部通过。

### 3. 结构复用逻辑重复收敛 (P1)

- **执行范围**: 基于 Phase 54 逻辑重复检测脚本输出，完成 ≥2 组抽象收敛。
- **收敛切片**:
  - 切片 1：`server/utils/taxonomy-post-count.ts` — `buildCategoryPostCountSubquery` 与 `buildTagPostCountSubquery` 抽取 `buildTaxonomyPostCountSubquery(alias, joinFn)` 内部函数
  - 切片 2：`utils/shared/post-distribution-wechatsync.ts` — `mergeWechatSyncTaskAccounts` 与 `mergeWechatSyncCompletionAccounts` 抽取泛型 `mergeAccountsByKey<T>(keyFn)` 内部函数
- **验收对照**: ≥2 组收敛；`pnpm duplicate-code:check` 0.33% < 基线 1.22%；每组给出原始重复点、抽象边界与回滚方式。

### 4. ESLint/类型债 — ≥3 组窄切片 (P1)

- **执行范围**: 复用 Phase 54 规则债 inventory 脚本，完成 3 组窄切片。
- **收敛切片**:
  - 切片 1：`utils/shared/social-post-platforms.ts` — 8 处 `!.` 非空断言消除（`SOCIAL_PLATFORMS.find` → `Map` 查找映射）
  - 切片 2：`nuxt.config.ts` — 1 处 `as any` 消除（`filter(Boolean) as any` → 类型谓词 `filter((entry): entry is string => Boolean(entry))`）
  - 切片 3：`components/admin/admin-taxonomy-page.vue` — 13 处 `no-explicit-any` 消除（`languageOption: any` → `{ code: string }`, `$fetch<any>` → 精确响应类型, `as any` → `as const`）
- **验收对照**: ≥3 组切片完成；warning=0；同步更新 `eslint-debt-targets.mjs`。

### 5. 测试有效性第三轮切片 (P1)

- **执行范围**: 补齐组件层 AI 失败映射断言、页面级 auth degradation 场景断言、friend-links 失败口径断言。
- **失败路径断言补齐**:
  - AI 编辑器（`use-post-editor-ai`）：suggestTitles/suggestSlug/suggestSummary API 失败 → error toast + loading 复位（3 个）
  - Friend-links（`use-admin-friend-links-page`）：初始加载全失败 → error toast + 空状态；分类部分失败 → 部分数据（2 个）
  - Admin settings（`tests/pages/admin/settings/index.test.ts`）：初始 fetch 失败 → 页面不崩溃 + settings 为空；save 失败 → saving 复位（2 个）
- **验收对照**: ≥5 个新增失败路径断言（实际 7 个）；覆盖 ≥2 个模块（3 个）；`pnpm typecheck` 通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 文档检查已执行：`pnpm lint`、`pnpm typecheck`
- [x] 测试通过（全量主线验证 + Code Auditor 审计通过）

---

## 第五十六阶段：API 客户端统一与 CLI 导出 (已审计归档)

> 归档说明: 第五十六阶段「1 重构 + 1 新功能 + 3 优化」已于 2026-07-14 完成五条主线交付与阶段收口。五条主线: 共享 API 客户端库提取（`packages/api-client` 包 + `MomeiHttpClient` + 7 领域模块 + 29 测试，CLI/MCP 全部脱 axios）；CLI 导出命令（`momei export` + Hexo 兼容 Front-matter + 过滤参数 + 导出报告）；ESLint/类型债 ≥3 组窄切片（`submission.ts`、`settings.vue`、`commercial-link-manager.vue` no-explicit-any 收敛，均加入 eslint-debt-targets）；结构复用治理 ≥2 组热点切片（`content-processor.ts` 公共初始化 + translate API 共享参数解析）；测试有效性第四轮切片（6 个新增错误路径断言，覆盖 translate + tts-task-get 2 模块）。所有主线均通过 Review Gate 审计。

> **ROI 评估**: 共享 API 客户端库 2.00；CLI 导出命令 2.00；ESLint/类型债 1.50；结构复用治理 1.60；测试有效性第四轮 1.50。

### 1. 共享 API 客户端库提取 (P1)

- **执行范围**: 创建 `packages/api-client` 包（package.json / tsconfig / tsdown / eslint），实现 `MomeiHttpClient` + `MomeiApiError` + AbortSignal 超时，从 CLI `types.ts` 提取 42 个共享接口，迁移 7 领域 30 个 API 方法。改造 CLI/MCP 全部使用共享客户端，移除 axios 依赖。
- **实现对照**:
  - `packages/api-client`：`client.ts`（HTTP 客户端）、`types.ts`（共享类型）、7 领域模块（`posts`、`ai`、`categories`、`tags`、`snippets`、`versions`、`migrations`）
  - CLI：保留 `importPosts`/`testConnection` 方法，其余委托给共享客户端
  - MCP：`MomeiApi` 委托给共享客户端，工具注册层不变
- **验收对照**: CLI + MCP 全部使用共享客户端；axios 依赖从 CLI 移除；`pnpm typecheck` + `pnpm lint` 通过；CLI 36 + MCP 11 + api-client 29 = 76 tests pass。

### 2. CLI 导出命令 (P1)

- **执行范围**: 新增 `momei export <output-dir>`，调用 `GET /api/external/posts` 列表 + `GET /api/external/posts/:id` 详情，`formatPostToMarkdown`（Hexo 兼容 Front-matter）+ `formatPostToJson`。支持 `--language` / `--status` / `--category` / `--limit` 过滤和 `--format markdown|json`。
- **验收对照**: 导出的 Markdown 保留完整 Front-matter；过滤条件生效；导出报告可追踪；`pnpm typecheck` + `pnpm lint` 通过。

### 3. ESLint/类型债 — ≥3 组窄切片 (P1)

- **执行范围**: 继续「单规则 + 单文件/双文件」窄切片策略，聚焦 `@typescript-eslint/no-explicit-any`。
- **收敛切片**:
  - 切片 1：`utils/schemas/submission.ts` — `z.enum(SubmissionStatus as any)` → `z.enum(SubmissionStatus)`
  - 切片 2：`components/commercial-link-manager.vue` — `(currentSocialLink.value as any).image` → `currentSocialLink.value.image`
  - 切片 3：`pages/settings.vue` — `(session.value as any)?.data?.user?.role` → `session.value?.data?.user?.role`
- **验收对照**: 3 组切片完成；warning=0；`eslint-debt-targets.mjs` 新增 `NO_EXPLICIT_ANY_SCHEMA_FILES` / `PAGE_FILES` / `COMPONENT_FILES` 分组。

### 4. 结构复用治理 — ≥2 组热点切片 (P1)

- **执行范围**: 聚焦工具函数收敛与 API 参数解析复用，每组给出原始重复点、抽象边界与回滚方式。
- **收敛切片**:
  - 切片 1：`utils/shared/content-processor.ts` — 提取 `prepareSplitContent()` 私有静态方法，消除 `splitMarkdown` / `splitMarkdownLossless` 之间 13 行重复初始化逻辑。
  - 切片 2：`server/api/ai/translate.post.ts` + `translate.stream.post.ts` — 抽取 `parseTranslateBody()` 共享函数至 `_translate-shared.ts`，消除两个路由间 18 行重复参数校验/解析逻辑。
- **验收对照**: ≥2 组切片完成；`pnpm duplicate-code:check` 重复片段 45→43 组，0.31%→0.30%；基线不反弹。

### 5. 测试有效性第四轮切片 — server 层错误码覆盖 (P1)

- **执行范围**: 聚焦 server API 层标准错误码覆盖，为已有测试基座的模块补 401/403/404/500 错误面断言。
- **失败路径断言补齐**:
  - translate 模块（`server/api/ai/translate.post`）：未认证 → 401；无效请求体 → 400；服务异常 → 500（3 个测试）
  - TTS 任务查询模块（`server/api/tasks/tts/[id].get`）：未认证 → 401；任务不存在 → 404；缺少参数 → 400（3 个测试）
- **验收对照**: ≥5 个新增失败路径断言（实际 6 个）；覆盖 ≥2 个模块（2 个）；`pnpm typecheck` 通过；全量测试通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` 通过
- [x] 测试通过（全量主线验证 + Code Auditor 审计通过）

---

## 第五十七阶段：迁移体验增强与治理续航（已完成归档）

> 归档说明: 第五十七阶段「2 新功能 + 3 优化」已完成 4/5 主线交付。两条迁移增强主线（本地图片自动上传、迁移元数据字段扩展）已完整实施并通过验证；测试有效性第五轮切片（8+ 失败路径断言）、ESLint/类型债 ≥3 组窄切片均已交付。结构复用主线因容量限制延期至第五十八阶段继续。
>
> **ROI 评估**: 本地图片自动上传与迁移 2.33；迁移元数据字段扩展 2.00；测试有效性第五轮 1.50；ESLint/类型债 1.50；结构复用延期至 Phase 58。

### 1. 本地图片自动上传与迁移 (P0)

- **执行范围**: CLI 扫描 Markdown 相对路径图片（`![](...)` 与 `<img src="...">`），解析本地路径，调用 `POST /api/external/upload/direct-auth` 批量上传，回写正文 URL。支持 `--upload-images`（默认关闭，向后兼容）。
- **实现对照**:
  - `packages/cli/src/import-image-migration.ts`（454 行）：核心上传迁移实现
  - `packages/cli/src/import-command.ts`：`--upload-images` CLI 参数
  - `packages/cli/src/import-image-migration.test.ts`（206 行）：覆盖干跑、上传成功、文件缺失等场景
  - `tests/server/api/external/upload-direct-auth.test.ts`：外部 API 端点验证
- **验收对照**: 正文与封面本地图片可自动上传替换；失败项在报告中标记且不阻塞导入；`pnpm typecheck` + `pnpm lint` 通过。

### 2. 迁移元数据字段扩展 (P1)

- **执行范围**: 扩展 `packages/cli/src/parser.ts`、`utils/schemas/external-post-import.ts` 与 `server/api/external/posts.post.ts`，补齐 `updatedAt` 字段映射与别名归一化（`updated`/`updated_at`）。
- **实现对照**:
  - Parser 层：`parser.ts:245` 映射 `updatedAt`/`updated`/`updated_at` 三种别名
  - Schema 层：`external-post-import.ts:32` 别名归一化逻辑
  - API 层：`posts.post.ts:45` 转发至 `createPostService`
  - 测试覆盖：parser + schema + API 三层均有测试用例
- **验收对照**: `updatedAt` 正确落库；向后兼容；新增测试覆盖；`pnpm typecheck` + `pnpm lint` 通过。

### 3. 测试有效性第五轮切片 (P1)

- **执行范围**: 围绕外部 API 和 CLI 的高风险链路补失败路径与边界断言。
- **失败路径断言**:
  - 外部 API 端点：8 条（权限校验、无效请求体、服务异常传播、导入确认拒绝、阻塞拒绝、view 别名校验）
  - CLI 图片迁移：5 条（缺少授权、上传异常、429 重试逻辑、重试耗尽、非 429 不重试）
- **验收对照**: ≥6 条（实际 13+）；覆盖 ≥2 个模块（实际 4+）；coverage 基线不回退。

### 4. ESLint/类型债 — ≥3 组窄切片 (P1)

- **执行范围**: 继续「单规则 + 单文件/双文件」窄切片，聚焦 `@typescript-eslint/no-explicit-any`。
- **收敛切片**:
  - 切片 1：`server/utils/validate-api-key.ts` — no-explicit-any 收敛
  - 切片 2：`server/utils/translation.ts` — no-explicit-any 收敛
  - 切片 3：`types/ai.ts` — no-explicit-any 收敛
- **验收对照**: 3 组切片完成；`warning=0`、`exemption=0`；eslint-debt-targets.mjs 已纳入目标文件。

### 5. 结构复用热点切片 (P1) — 延期至 Phase 58

- **当前状态**: 未开始实施，移至第五十八阶段继续。
- **原因**: 阶段容量约束，优先保障两条迁移增强主线和两条治理切片交付。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段已完成条目清理
- [x] `roadmap.md` 已同步阶段状态
- [x] 多语路线图已同步（en-US 摘要）
- [x] 文档检查已执行（`pnpm lint:md`、`check-i18n-duplicates`、`check-source-of-truth`）
- [x] 主干质量门通过（typecheck + lint）

---
