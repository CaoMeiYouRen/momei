# 墨梅博客 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 深度归档索引

- 第一至第十阶段全文: [archive/todo-archive-phases-01-10.md](./archive/todo-archive-phases-01-10.md)
- 第十一至第二十一阶段全文: [archive/todo-archive-phases-11-21.md](./archive/todo-archive-phases-11-21.md)
- 第二十二至第二十四阶段全文: [archive/todo-archive-phases-22-24.md](./archive/todo-archive-phases-22-24.md)
- 第二十五至第三十一阶段全文: [archive/todo-archive-phases-25-31.md](./archive/todo-archive-phases-25-31.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档当前只保留最近 7 个阶段的完整归档块、相邻阶段对比所需的收口依据与归档索引。
- 第一至第三十一阶段的完整待办归档正文已迁入区间分片，避免主文档继续承担所有历史阶段全文。
- 后续若近线窗口再次膨胀，继续按 [archive/index.md](./archive/index.md) 的规则把更早阶段整体迁出，而不是拆散验收标准与结果记录。

---
## 第三十九阶段：公众号排版预览与治理基线落盘 (已审计归档)

> 归档说明: 第三十九阶段「1 个新功能 + 4 个优化」已于 2026-05-23 完成对账、文档同步与归档收口。当前仓库可对照到五条主线的实现与证据落点：`wechat_mp` 预览 / 复制能力、结构复用第三轮热点收敛、注释治理首轮切片、文档 / 脚本治理最小收口包、国际化文案复用治理。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

> **ROI 评估**: 微信公众号格式预览 / 导出辅助 `1.56`；结构复用第三轮（3 个热点）`1.72`；注释治理首轮（1 - 2 组模块）`1.43`；文档 / 脚本治理最小收口包 `1.67`；国际化文案复用治理 `1.60`。

### 1. 微信公众号格式预览 / 导出辅助 (P0)

- 结果: `wechat_mp` profile 已落地到分发预览与预检链路，覆盖公众号兼容规则（标题 / 引用 / 代码块降级、提示容器 / 代码分组转换）、外链转文末引用（去重、代码块排除、裸 URL 兼容），并新增“复制排版后内容”入口（`ClipboardItem` 双格式 + `writeText` 降级）。
- 证据: 提交 `3f0989d8`、`9c7a5eb2`，设计文档 [docs/design/governance/wechat-mp-preview-export-assist.md](../../docs/design/governance/wechat-mp-preview-export-assist.md)，以及分发预览相关测试集。
- [x] 仅交付“公众号风格预览 + 复制排版后内容”，未扩写为编辑器替换工程。
- [x] 定向验证已覆盖转换链路与复制逻辑，核心行为可复现。

### 2. 结构复用第三轮：3 个热点收敛 (P1)

- 结果: `confirmDelete`、`getStatusSeverity`、`DistributionMaterialBundle` 三组热点均已在 `simple-duplicates` 基线中消失；统计由同名内部函数候选 `112` 降至 `110`，同名 type/interface 候选由 `156` 降至 `27`，近似命名函数候选保持 `10`。
- 证据: `pnpm governance:audit:simple-duplicates` 产物、`pnpm duplicate-code:check`（warn 模式 `40 clones / 0.69%`）与定向测试通过记录。
- [x] 至少 `3` 组热点完成收敛。
- [x] `duplicate-code` 基线未反弹。

### 3. 注释治理首轮：1 - 2 组模块 (P1)

- 结果: `usePostEditorIO`、`usePostEditorAI` 与 `useInstallationWizard` 已完成契约 / 副作用 / 失败回退注释补齐，并清理所选文件内 TODO / 临时口吻；`comment-drift` 基线已形成本轮可追溯 delta。
- 证据: `pnpm governance:audit:comment-drift` 产物与三组 composable 定向测试通过记录。
- [x] 已按高复杂度优先策略完成首轮模块切片。
- [x] 所选范围内未保留低价值 TODO 注释噪音。

### 4. 文档 / 脚本治理最小收口包 (P0)

- 结果: 回归活动窗口完成历史滚动归档（`588` 行降至 `235` 行），英文高频 must-sync 页 freshness 回补到 `2026-05-19`，脚本治理三条 finding 完成处置闭环（稳定入口补齐与失效声明下线）。
- 证据: `pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`、`pnpm governance:check:scripts` 均通过；脚本治理统计收敛为“缺少稳定入口 `0`、文档声明但缺失 `0`”。
- [x] 文档与脚本两条治理面均完成最小闭环。
- [x] 已保留前后对比的可追溯事实源。

### 5. 国际化文案复用治理 (P1)

- 结果: `AppFooter`、`archives`、`categories`、`tags` 四组公开装配链路已并入固定 runtime 验证面；页面私有命名空间与共享组件命名空间边界已在 runtime 装配测试中固化，同时完成首个重复键收敛切片（`common.refresh` 统一）。
- 证据: `pnpm i18n:audit:missing` 维持 `0`，`pnpm i18n:audit:duplicates` 命中由 `101/56` 降至 `100/55`，`pnpm i18n:verify:runtime`（`15` 文件 / `108` 用例）通过。
- [x] 新增范围未出现 raw key 暴露。
- [x] 复用治理与运行时装配边界保持一致。

## 第三十八阶段：分发一致性修补与热点治理续推 (已审计归档)

> 归档说明: 第三十八阶段「0 个新功能 + 5 个优化」已于 2026-05-19 完成对账、文档同步与归档收口。当前仓库已可对照到五条主线的实现落点：`B 站 / Memos` 标签尾注与预览一致性、高风险测试有效性第二轮切片、公开热点读链路止损式瘦身与根因收敛、至少 3 处结构复用热点，以及 AI provider 聚合层 ESLint / 类型债窄切片。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

> **ROI 评估**: 第三方分发标签尾注与预览一致性修补 1.60；测试有效性第二轮切片 1.85；Postgres 公开热点读链路继续瘦身 1.75；结构复用第二轮（至少 3 处热点）1.70；ESLint / 类型债下一轮窄切片 1.50。

### 1. 第三方分发标签尾注与预览一致性修补 (P1)

- 结果: `B 站 / Memos` 两个渠道已统一复用同一条标签标准化与尾注拼装入口；`B 站` 预览、`B 站` 实际同步 payload 与 `Memos` 预览三处输出已按“标签尾注中的标签项去除空格后再输出”的同一规则收敛。
- 验证: 分发物料 helper / template 测试、实际分发 / 导出层测试，以及必要的后台分发预览组件测试已在当前仓库与阶段事实源中闭环。
- [x] 仅覆盖 `B 站 / Memos` 两个渠道，不扩写到其他分发器。
- [x] 预览构造与实际分发复用同一条标签标准化 / 尾注拼装入口。

### 2. 测试有效性第二轮切片 (P0)

- 结果: 本轮已完成 `3` 组高风险切片：[components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts) 覆盖 direct TTS 任务创建失败后的可见错误映射；[pages/login.test.ts](../../pages/login.test.ts) 与 [pages/login.vue](../../pages/login.vue) 覆盖登录页 logical failure 后 `refreshAuthSession` 退化不吞主错误；[tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 覆盖 `503` bootstrap 失败不污染短 TTL runtime cache、后续成功请求可恢复。
- 验证: `pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts pages/login.test.ts tests/server/api/settings/public.get.test.ts`、`pnpm exec nuxt typecheck`，以及 [docs/reports/regression/current.md](../reports/regression/current.md) 中的本轮定向回归矩阵记录。
- [x] 至少完成 `3` 组高风险失败 / 边界断言。
- [x] 其中至少 `1` 组覆盖用户可见错误映射，而不是只断言内部异常被抛出。

### 3. Postgres 公开热点读链路继续瘦身 (P0)

- 结果: 已将 [server/api/posts/home.get.ts](../../server/api/posts/home.get.ts)、[server/api/categories/index.get.ts](../../server/api/categories/index.get.ts) 与 [server/api/tags/index.get.ts](../../server/api/tags/index.get.ts) 从完整 `initializeDB()` 语义切到 connection-only helper [server/database/index.ts](../../server/database/index.ts)，并同步修正两阶段初始化状态机，确保 connection/full init 的 in-flight promise 在每轮结束后释放，维护链失败后下一次请求仍可重试。
- 结果: [server/api/posts/home.get.ts](../../server/api/posts/home.get.ts) 已把首页列表查询切到 `includeAuthorEmail: false`，并在首页响应剥离 `author.email / emailHash`，避免公开首页卡片继续为未消费的作者邮箱链路付费；对应守线见 [tests/server/api/posts/home.get.test.ts](../../tests/server/api/posts/home.get.test.ts) 与 [tests/server/database/init-boundary.test.ts](../../tests/server/database/init-boundary.test.ts)。
- 结果: 基于 [2026-05-19 第三十八阶段 Neon Live Sample 摘要](../../artifacts/review-gate/2026-05-19-phase-38-neon-live-sample.md)，当前超预算更像“公开热读 + 稀疏公共流量持续打醒 compute”的组合，而不是剩余显式 `initializeDB()` 调用点继续主导成本。本阶段据此完成“单路径瘦身 + 根因收敛 + 停止继续沿连接初始化链路硬挤收益”的止损收口；剩余缓存侧优化继续回收到长期主线候选，而不伪装为本阶段已彻底根治。
- 验证: `pnpm exec vitest run tests/server/database/init-boundary.test.ts tests/server/api/posts/home.get.test.ts tests/server/api/categories/index.get.test.ts tests/server/api/tags/index.get.test.ts`，受影响文件无错误静态诊断，以及 [2026-05-19 第三十八阶段 Neon Live Sample 摘要](../../artifacts/review-gate/2026-05-19-phase-38-neon-live-sample.md)。
- [x] 本轮只推进“公开热点读链路继续瘦身”，不并行开启剩余显式 `initializeDB()` 调用点审计。
- [x] 已形成一组新的等价 live sample，并完成“当前超预算更像公开热读问题而不是初始化误触问题”的根因回答。

### 4. 结构复用第二轮（至少 3 处热点） (P1)

- 结果: 已完成 `3` 处热点收敛：`components/commercial-link-manager.vue` 将社交 / 打赏卡片区下沉到共享组件 `components/commercial-link-section.vue`；`utils/shared/commercial-schema.ts` 已把 `SocialLinkSchema / DonationLinkSchema` 收敛到同一工厂函数；`utils/shared/duration.ts` 已把秒 / 分钟解析与 fallback + clamp 逻辑收敛到共享内部 helper。
- 验证: `components/commercial-link-manager.test.ts`、`utils/shared/commercial-schema.test.ts`、`utils/shared/duration.test.ts`、`pnpm exec nuxt typecheck`、`pnpm duplicate-code:check`，以及浏览器侧验证 `http://127.0.0.1:3002/settings?tab=commercial` 的定向交互记录。
- [x] 至少 `3` 处热点完成收敛，其中包含 `commercial-link-manager` 文件内自重复。
- [x] `pnpm duplicate-code:check` 基线未反弹。

### 5. ESLint / 类型债下一轮窄切片 (P1)

- 结果: 已在 `server/utils/ai/index.ts` 为数据库 provider 值补上 `AIProviderType` 守卫与归一化 helper，移除直接写入 `AIConfig.provider` 的 `as any`；`server/utils/ai/index.test.ts` 同步把聚合层邻近的多处 `unknown as` 历史结构断言改为 `toMatchObject`，并补上“stored provider 不受支持时回退到 `openai`”的守线用例。
- 验证: `pnpm exec eslint server/utils/ai/index.ts server/utils/ai/index.test.ts`、`pnpm exec vitest run server/utils/ai/index.test.ts`、`pnpm exec nuxt typecheck`。
- [x] 定向 ESLint、定向测试与类型检查通过。
- [x] 残余债务与下一轮候选已明确记录。

## 第三十七阶段：Windows 本地性能与治理链路深化 (Windows Local Performance & Governance Deepening) (已审计归档)

> 归档说明: 第三十七阶段「0 个新功能 + 5 个优化」已于 2026-05-18 完成对账、文档同步与归档收口。当前仓库已可对照到五条主线的实现落点：Windows 本地 `nuxt dev` / `nuxt build` 可用性与长尾首轮收敛、高风险测试有效性切片、AI 服务层 ESLint / 类型债窄切片、至少 3 处结构复用热点，以及 Postgres 长窗口复核闭环。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

> **ROI 评估**: Windows 本地 Dev / Build 性能治理 2.00；测试有效性切片 1.80；ESLint / 类型债治理 1.50；结构复用治理（至少 3 处热点）1.70；Postgres 长窗口复核切片 1.45。

### 1. Windows 本地 Dev / Build 性能治理 (P0)

- 结果: [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts)、[server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts)、[server/middleware/1-auth.ts](../../server/middleware/1-auth.ts)、[server/middleware/2-log.ts](../../server/middleware/2-log.ts) 与 [server/utils/permission.ts](../../server/utils/permission.ts) 已完成 installation state、连接级初始化、optional session、request log 与 permission 边界收紧；[server/services/installation-probe.ts](../../server/services/installation-probe.ts) 已承接轻量安装态探针；Windows 本地 `nuxt build` 长尾首轮已通过关闭 server sourcemap 收敛，`nuxt dev` 首响也已从约 `502279ms` 收敛到约 `58549ms`。
- 验证: 事实源已统一沉淀到 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md)、`artifacts/nuxt-*-performance.json`、`artifacts/nitro-resolve-probe.json` 与相关 dev 日志；2026-05-16 用户实测 `pnpm run dev` 后首页、`settings/public`、`settings/theme`、`posts/home` 与 `friend-links` 均可访问。
- [x] 冻结 [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 的 installation state 探测边界，明确哪些路径只需要安装态、哪些路径才必须等待完整 `initializeDB()`。
- [x] 为数据库初始化与首请求冷路径补齐分阶段耗时口径，并把事实源统一沉淀到 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md) 与 `artifacts/nuxt-*-performance.json`。
- [x] 针对 `Server built -> Build complete` 长尾完成一轮 Nitro / `.output/server` 写出侧剖析与首轮收敛。

### 2. 测试有效性切片 (P0)

- 结果: 本轮已围绕前端直连 TTS、AI task `estimated / actual` 口径一致性与公开热点读链路完成 3 组高风险断言补强：[server/api/ai/tts/task.post.test.ts](../../server/api/ai/tts/task.post.test.ts) 覆盖 post-backed / `404` / `403`， [server/api/admin/ai/stats.get.test.ts](../../server/api/admin/ai/stats.get.test.ts) 覆盖 `estimated / actual` 独立口径与非终态 `successRate / failureRate = 0`， [tests/server/api/posts/access-error-mapping.test.ts](../../tests/server/api/posts/access-error-mapping.test.ts) 覆盖 `/api/posts/home` 统一 `503` 映射。
- 验证: 定向回归矩阵已收敛为 `pnpm exec vitest run server/api/ai/tts/task.post.test.ts server/api/admin/ai/stats.get.test.ts tests/server/api/posts/access-error-mapping.test.ts`，结果为 `14` 通过、`0` 失败；详细证据见 [docs/reports/regression/current.md](../reports/regression/current.md) 的 2026-05-18 记录。
- [x] 围绕前端直连 TTS、AI task `estimated / actual` 口径一致性、认证退化与公开热点读链路，选择已有测试基座且回归风险最高的 `2 - 3` 组路径补失败断言或边界断言。
- [x] 至少补一组统计一致性或失败路径回归，不把本轮退化为单纯补 coverage 数字。
- [x] 将本轮新增测试入口纳入可复用的定向回归矩阵，并记录未覆盖边界。

### 3. ESLint / 类型债治理 (P1)

- 结果: [server/services/ai/asr.ts](../../server/services/ai/asr.ts)、[server/services/ai/image.ts](../../server/services/ai/image.ts)、[server/services/ai/tts.ts](../../server/services/ai/tts.ts) 与 [server/services/ai/base.ts](../../server/services/ai/base.ts) 已完成 `unknown + 显式收窄` 收敛，新增 `resolveAudioSize`、`resolveProviderModel`、`toErrorMessage` 等窄 helper，去掉 `catch any` 并收紧基础任务记录接口中的多态日志字段。
- 验证: 已执行 `pnpm exec eslint server/services/ai/asr.ts server/services/ai/image.ts server/services/ai/tts.ts server/services/ai/base.ts`、`pnpm exec vitest run server/services/ai/asr.test.ts server/services/ai/image.test.ts server/services/ai/tts.test.ts`（`26` 通过、`0` 失败）与 `pnpm run typecheck`；残余候选继续收敛为测试桩层历史 `as any` 与 provider 聚合层去断言化。
- [x] 继续按“单规则 + 单文件 / 双文件”窄切片推进，优先上收 [server/services/ai/asr.ts](../../server/services/ai/asr.ts) 的高 ROI `no-explicit-any` 收敛候选。
- [x] 进入实现前先冻结命中清单、替代写法、回滚边界与最小验证矩阵。
- [x] 定向 ESLint 与 `nuxt typecheck` 通过后，再记录残余债务与下一轮候选。

### 4. 结构复用治理：至少 3 处热点收敛 (P1)

- 结果: 已完成 3 处热点收敛。[pages/admin/subscribers/index.vue](../../pages/admin/subscribers/index.vue) / [pages/admin/waitlist/index.vue](../../pages/admin/waitlist/index.vue) 共享后台列表页壳层；[pages/admin/ad/campaigns.vue](../../pages/admin/ad/campaigns.vue) / [pages/admin/ad/placements.vue](../../pages/admin/ad/placements.vue) 收敛到 [composables/use-admin-entity-list.ts](../../composables/use-admin-entity-list.ts) 与 [composables/use-admin-form-dialog.ts](../../composables/use-admin-form-dialog.ts) 两条窄 composable；[server/utils/email/service.ts](../../server/utils/email/service.ts) 已把模板解析 / 发送 / 记录日志压回内部 helper。
- 验证: 已执行 [server/utils/email/service.test.ts](../../server/utils/email/service.test.ts)（`13` 通过、`0` 失败）、`pnpm exec nuxt typecheck` 与 `pnpm duplicate-code:check`，确认 baseline 未反弹；[components/commercial-link-manager.vue](../../components/commercial-link-manager.vue) 继续保留为下一轮候选。
- [x] 在 `jscpd` 可见重复与文件内自重复中，至少完成 `3` 处热点收敛，优先处理 `pages/admin/subscribers/index.vue` vs `pages/admin/waitlist/index.vue`、`pages/admin/ad/campaigns.vue` vs `pages/admin/ad/placements.vue`、[server/utils/email/service.ts](../../server/utils/email/service.ts) 与 [components/commercial-link-manager.vue](../../components/commercial-link-manager.vue)。
- [x] 每组抽象前先写清共享边界、收益与回滚方式，不把复杂业务逻辑伪装成通用框架。
- [x] 复核 `pnpm duplicate-code:check` 基线不反弹，并补记结构性重复盘点结论。

### 5. Postgres 长窗口复核切片 (P1)

- 结果: 基于 2026-05-12 与 2026-05-14 的 Neon 长窗口样本，已确认当前最主要的放大器是非生产环境定时 Cron 与请求入口误触完整初始化，而非单条业务 SQL；[server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts) 已改为非生产默认不注册内置 Cron，[server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts) / [server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 已收紧为连接级初始化。
- 验证: [docs/reports/regression/current.md](../reports/regression/current.md) 已保留 2026-05-12 与 2026-05-14 两轮长窗口复核记录；同日 System Operations 在 `5` 分钟 autosuspend 延迟下保持成功的 `start / suspend` 交替，未再出现 compute 长期钉住 Active 的阻塞形态。剩余候选已回收到 [backlog.md](./backlog.md)。
- [x] 补一组 `pg_stat_statements` 或等价 live sample 长窗口样本，先确认当前最耗 CPU 或最拉长连接寿命的请求组。
- [x] 在“请求入口组”与“公开热点读链路组”中二选一推进最小治理动作，不并行扩写成全站数据库重构。
- [x] 对照查询体量、结果集大小或连接活跃窗口给出可追溯结论，并把下一轮候选收敛回 [backlog.md](./backlog.md)。

## 第三十六阶段：运行时稳态补漏与结构治理收口 (Runtime Stability Patch-Up & Structural Governance Closure) (已审计归档)

> 归档说明: 第三十六阶段「0 个新功能 + 5 个优化」已于 2026-05-11 完成对账、文档同步与归档收口。当前仓库已可对照到五条主线的实现落点：`initializeDB()` 并发窗口与 Redis 连接超时治理、TTS 前端直连 / 直传 OSS backlog 清理、ESLint / 类型债窄切片、TTS task 与 `LocaleOption` 结构复用收敛，以及公开读接口注释治理。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

> **ROI 评估**: 数据库初始化并发与 Redis 连接稳态修复 1.75；TTS 前端直连 / 直传 OSS backlog 清理 1.50；ESLint / 类型债继续治理 1.50；结构复用治理（TTS task + locale 类型收敛）1.60；存量代码注释治理候选组 C 1.33。

### 1. 修复数据库查询并发问题与 Redis 连接异常（P0）

- 结果: `server/database/index.ts` 已保留单一 `initializationPromise` 守卫并收紧 `isInitialized` 时序，`server/utils/redis.ts` 已补 `connectTimeout` 与有限次 `retryStrategy`，不再沿用无边界的默认连接等待策略。
- 验证: 对应实现与测试入口已分别落在 `server/database/index.ts`、`server/utils/redis.ts`、`server/utils/redis.test.ts` 与数据库相关定向测试目录；本轮归档后继续以类型检查与文档质量门作为最小放行补验。
- [x] 修复 `server/database/index.ts` 中 `initializeDB()` 竞态窗口（`isInitialized = true` 时序 + 移除 `finally` 中的 `initializationPromise = null`）
- [x] 修复 `server/utils/redis.ts` 中 ioredis 连接超时（添加 `connectTimeout` + `retryStrategy`）

### 2. TTS 前端直出 + 直传 OSS 审查与 backlog 清理（P1）

- 结果: TTS 前端直连链路的测试入口已齐备，`docs/plan/backlog.md` 第 13 条已明确标注为“已交付（第三十四—三十五阶段）”，`use-tts-volcengine-direct.ts` 的超长类型定义也已抽离到共享类型文件。
- 验证: 相关入口包括 `composables/use-tts-volcengine-direct.test.ts`、`server/api/posts/[id]/tts-metadata.put.test.ts` 与 backlog 事实源对账；本轮主要完成规划侧闭环，不新增实现面。
- [x] 审查 TTS 前端直连 pipeline 测试覆盖完整性（9/9 测试通过）
- [x] 运行 TTS 相关测试确认通过
- [x] 从 `docs/plan/backlog.md` 标注 #13「前端直出 TTS + 直传 OSS」为已交付
- [x] 审查 `composables/use-tts-volcengine-direct.ts` max-lines 阈值（类型抽取至 `types/tts-direct.ts`）

### 3. ESLint / 类型债继续治理（P1）

- 结果: 本轮已清掉既有 4 个 warning，并将 `no-explicit-any` 窄切片推进到 `server/services/ai/tts.ts`；`server/services/ai/asr.ts` 仍按容量约束保留为下阶段候选，不伪装为本轮已完成。
- 验证: 受影响范围已在 `eslint.config.js`、`server/services/ai/tts.ts` 与对应测试 / 类型检查入口中闭环，规划状态与当前代码事实一致。
- [x] 修复 4 个 ESLint warning（2 unused imports, 1 max-lines 类型抽取, 1 no-misused-spread → Object.assign）
- [x] 扩展 `no-explicit-any` 窄切片到 `server/services/ai/tts.ts`（~16 处 `any`/`as any` 收敛）
- [-] `server/services/ai/asr.ts`：本轮容量有限，延后至下阶段

### 4. 结构复用治理：重复代码 + 零散类型收敛（P1）

- 结果: 双 TTS task 端点已共享 `server/utils/ai/tts-task-shared.ts`，`LocaleOption` 与相关选择项类型已收敛到 `types/utils.ts`；邮件服务自重复收敛因容量约束继续留在后续候选池。
- 验证: 当前代码中可直接对照 `createTTSTask` 共享 helper、`LocaleOption` 共享类型及 `isLocaleOption` 守卫的收敛结果，且 backlog 未再保留重复的当前阶段正文。
- [x] TTS task API 重复收敛：提取 `server/utils/ai/tts-task-shared.ts`，双端点使用共享 helper
- [-] 邮件服务自重复收敛：本轮容量有限，延后至下阶段
- [x] `LocaleOption` 类型收敛：4 个 composable → `types/utils.ts`（`LocaleOption` + `SelectLocaleOption`）
- [x] 类型守卫收敛：`isAdminAiLocaleOption` / `isAdminI18nLocaleOption` → 统一 `isLocaleOption`

### 5. 存量代码注释治理候选组 C（P1）

- 结果: 公开读接口链路的多语言聚合、缓存策略、管理模式差异和 taxonomy 过滤复用边界均已补入高价值注释，当前规划描述与代码实现一致。
- 验证: 受影响文件集中在 `server/api/posts/index.get.ts`、`server/api/posts/archive.get.ts`、`server/api/categories/index.get.ts` 与 `server/api/tags/index.get.ts`，本轮归档只补事实源，不扩写新的注释范围。
- [x] `server/api/posts/index.get.ts`：补多语言聚合、缓存策略、管理模式注释
- [x] `server/api/posts/archive.get.ts`：补 SQL 差异逻辑与 aggregation 注释
- [x] `server/api/categories/index.get.ts`：补缓存键与 taxonomy filter 复用注释
- [x] `server/api/tags/index.get.ts`：同上

### 本轮基线

| 指标 | 起始 | 结束 | 变化 |
|------|------|------|------|
| ESLint | 4 warnings | 0 warnings | ✅ |
| jscpd | 34/629/0.52% | 33/608/0.50% | ↓1 clone, ↓21 lines |
| `tts.ts` any | ~16 | 0 | ✅ |
| LocaleOption 定义 | 4 scattered | 1 shared | ✅ |

## 第三十五阶段：运行时计量校准与结构治理续推 (Runtime Metering Calibration & Structural Governance Continuation) (已审计归档)

> 归档说明: 第三十五阶段「0 个新功能 + 5 个优化」已于 2026-05-08 完成收口并归档至本文件。5 条主线均已在实现代码、定向测试、活动回归窗口、`pg_stat_statements` live sample 与规划文档中完成闭环；`todo.md` 当前待办区已清理，下一阶段仍停留在候选分析，不在本轮直接上收。

> **ROI 评估**: AI task 计量口径校准与 TTS 前端直连防回归 1.75；Postgres 热点公开读链路与数据库唤醒继续治理 1.75；ESLint / 类型债下一轮窄切片 1.50；结构复用治理（重复代码 / 零散类型 / 纯函数与工具函数）1.60；存量代码注释治理候选组 A 1.33。

### 1. AI task 计量口径校准与 TTS 前端直连防回归 (P0)

- [x] **AI task 计量口径校准与 TTS 前端直连防回归 (P0)**
    - 验收: 完成态 AI task 的 `actual` 口径优先取 provider 最终 usage，缺失时才回退到估算值；前端直连 TTS / Podcast 至少有一组"成功 / 失败 / 回退"断言；AI 管理端列表、详情与聚合统计在同一任务样本上的用量口径保持一致，不再出现明显统计失真。
    - 结果: 已完成前端直连 TTS 任务处理与结算功能（`0ba4f295`）、TTS 元数据处理优化（`228fcb79`），以及 Volcengine 前端直连链路闭环。本轮未重写 `TTSService.processTask()`，未把更多 Provider 扩写为浏览器直连。
    - 验证: 定向 Vitest、受影响 API / composable 断言、`pnpm exec nuxt typecheck` 通过。

### 2. Postgres 热点公开读链路与数据库唤醒继续治理 (P0)

- [x] **Postgres 热点公开读链路与数据库唤醒继续治理 (P0)**
    - 验收: 只选择首页 `posts public list` 查询对及其相邻装配链路，补最小字段集、请求去重或缓存复用中的至少一项收敛；并通过 `pg_stat_statements` live sample 说明查询体量或结果集存在可追溯下降趋势。
    - 结果: `server/api/posts/index.get.ts` 已把 `POSTS_PER_PAGE` 读取推迟到缺省 `limit` 请求；本地 PostgreSQL 17 + `pg_stat_statements` 对照样本显示，首页 popular posts 等价请求（显式 `limit=3` 等）重复命中仅留下 `3` 条 `momei_post` 查询指纹，未再留下 `momei_setting` 查询。同组缺省 `limit` 对照仍留下 `1` 条 `momei_setting` 查询（`calls=1`、`rows=1`）。本轮已去掉首页 popular posts 这条公开热读路径的前置 settings 查库。
    - 验证: `pnpm exec vitest run tests/server/api/posts/index.get.test.ts`（19 tests 通过）、`nuxt typecheck targeted`、本地 PostgreSQL 17 `pg_stat_statements` 对照采样。

### 3. ESLint / 类型债下一轮窄切片 (P1)

- [x] **ESLint / 类型债下一轮窄切片 (P1)**
    - 验收: 本轮切片的命中清单、回滚边界与最小验证矩阵已经明确；定向规则校验通过；残余债务与下一轮候选已记录。
    - 结果: 命中 `server/utils/post-access.ts`（3 处 `any` → `PostAccessUser` / `PostAccessSession` 接口），规则 `@typescript-eslint/no-explicit-any`，回滚边界见 `eslint.config.js` `noExplicitAnyUtilityFiles`。残余 `server/utils/ai/` Provider 层仍有 `error: any` 等（低 ROI，留后续切片）；`server/utils/translation.ts` 多处 `as any`。
    - 验证: `pnpm exec nuxt typecheck` 通过，`pnpm exec vitest run server/utils/post-access.test.ts`（定向）。

### 4. 结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛 (P1)

- [x] **结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛 (P1)**
    - 验收: 至少完成 `1 - 2` 组可安全复用的共享抽象；`pnpm duplicate-code:check` 基线不反弹；留下 jscpd 无法覆盖的结构性重复清单。
    - 结果: Group 1 将 `isRecord` / `isPlainRecord`（6 个文件各定义一次）收敛到 `utils/shared/is-record.ts`；Group 2 将 `MaybeReactive<T>`（2 个文件各定义一次）收敛到 `types/utils.ts`。jscpd 无法覆盖边界：类型别名重复（同一 type 定义在多个文件），非行级代码重复。
    - 受影响文件: `use-asr-direct.ts`, `localized-settings.ts`, `post-export.ts`, `email-template-config.ts`, `request-feedback.ts`, `ad-network-config.ts`, `use-locale-message-modules.ts`, `use-app-fetch.ts`
    - 验证: `pnpm exec nuxt typecheck` 通过。

### 5. 存量代码注释治理 — 候选组 A (P1)

- [x] **存量代码注释治理 — 候选组 A (P1)**
    - 验收: 本轮已补齐"为什么这样写 / 边界条件 / 副作用或契约"类高价值注释；已同步清理失效、误导性或逐行复述代码的低价值注释；并记录已覆盖范围、仍未覆盖边界与注释漂移检查结论。
    - 结果: 本轮选择 `server/utils/locale.ts`（locale 归一化）+ `server/middleware/1-auth.ts`（鉴权上下文挂载）。已补注释包括 `LOCALE_MAPPING` 四级回退策略说明、`getAuthLocaleFromRequest` 手动 Cookie 解析原因、`detectRequestAuthLocale` 的 `includeQuery` 安全语义、`AUTH_TO_APP_LOCALE_MAP` 的 default 折叠理由。`server/services/setting*.ts` 注释已较充分，本轮不追加。未覆盖: locale 文件的测试层、`server/middleware/i18n.ts`（与 locale.ts 共享事实源，注释可沿用）。
    - 验证: `pnpm exec nuxt typecheck` 通过。

## 第三十四阶段：TTS 前端化评估与长期治理补欠 (已审计归档)

> 归档说明: 第三十四阶段「1 个新功能评估 + 5 个优化」已于 2026-05-06 完成收口并归档至本文件。6 条主线均已在实现代码、专项设计文档、活动回归窗口、`phase-close` 回归结果与多语路线图摘要中完成闭环；`todo.md` 当前待办区已清理，下一阶段仍停留在候选分析，不在本轮直接上收。

> **ROI 评估**: 前端直出 TTS + 直传 OSS 评估与原型 1.33；测试覆盖率冲刺 80%+ 1.83；周期性回归执行 1.50；ESLint 下一轮切片 1.50；i18n 运行时继续扩面 1.50；文档翻译 freshness 续 1.33。

### 1. 前端直出 TTS + 直传 OSS 评估与原型 (P1)

- [x] **前端直出 TTS + 直传 OSS 评估与原型 (P1)**
    - 验收: 已在 `docs/design/governance/tts-frontend-direct-evaluation.md` 固化 Provider CORS、JWT 凭证下发与浏览器直传 OSS 的设计边界。
    - 结果: 已落地火山 JWT 凭证、前端直连 composable、服务端代理兼容、TTS 元数据回写与 serverless 自动降级；本轮只为 Volcengine 打通前端直连闭环，不重写 `TTSService.processTask()`。
    - 验证: 详见活动回归窗口中与 TTS 前端化原型对应的专项记录，以及 `docs/design/governance/tts-frontend-direct-evaluation.md` 的结论。

### 2. 测试覆盖率冲刺 80%+ (P0)

- [x] **测试覆盖率冲刺 80%+ (P0)**
    - 验收: 全仓 coverage 已从第三十三阶段基线 lines `75.8%` 继续拉升，并正式越过 `80%+` 目标线。
    - 结果: 2026-05-06 最终全量 `pnpm test:coverage` checkpoint 为 statements `80.03%` / branches `67.18%` / functions `78.99%` / lines `80.05%`；后台 settings / editor 高 ROI 切片已形成稳定增量。
    - 验证: `pnpm test:coverage`、定向 Vitest / coverage、定向 ESLint 与受影响文件诊断均已通过，详见 `docs/reports/regression/current.md` 2026-05-06 记录。

### 3. 周期性回归执行 (P1)

- [x] **周期性回归执行 (P1)**
    - 验收: 已执行一次真实 `pnpm regression:phase-close`，覆盖 coverage、lint / typecheck、重复代码、文档事实源与 Review Gate 证据生成。
    - 结果: 依赖安全、导航 E2E、严格性能预算与回归窗口超限四类 blocker 已全部解除；phase-close、pre-release 与 Review Gate 证据均已转绿。
    - 验证: `pnpm regression:phase-close` 通过，对应证据见 `docs/reports/regression/current.md` 2026-05-05 记录与 `artifacts/review-gate/2026-05-05-phase-close-regression.md`。

### 4. ESLint 下一轮切片 (P1)

- [x] **ESLint 下一轮切片 (P1)**
    - 验收: 已完成 `composables` 子桶复核，并沿回退口径收口 production composable 的高 ROI `no-explicit-any` 单文件 / 双文件切片。
    - 结果: `use-tts-task.ts`、`use-upload.ts`、`use-asr-task.ts`、`use-admin-ai.ts`、`use-admin-i18n.ts`、`use-post-editor-auto-save.ts`、`use-onboarding.ts`、`use-post-editor-page.helpers.ts`、`use-tts-volcengine-direct.ts`、`use-post-editor-ai.ts` 与 `use-post-editor-io.ts` 等文件已完成类型收窄；当前生产源码范围内无这条主线的残余 blocker。
    - 验证: 定向 ESLint、同级 Vitest、`pnpm exec nuxt typecheck` 与根仓 `npm run lint` 均通过。

### 5. i18n 运行时继续扩面 (P1)

- [x] **i18n 运行时继续扩面 (P1)**
    - 验收: `i18n:audit:missing` 持续保持 `0`，并新增一条公开页装配链路纳入 `i18n:verify:runtime` 固定回归入口。
    - 结果: 已将 `pages/archives/index.test.ts` 并入固定运行时矩阵，同时完成 `auth-card`、`taxonomy-post-page`、归档页和 taxonomy RSS 相关运行时守线收口。
    - 验证: `pnpm i18n:audit:missing` 与 `pnpm i18n:verify:runtime` 通过，详见 `docs/reports/regression/current.md` 2026-05-05 记录。

### 6. 文档翻译 freshness 续 (P1)

- [x] **文档翻译 freshness 续 (P1)**
    - 验收: 高频设计页与对外 guide 的翻译 freshness 已恢复通过，`docs:check:source-of-truth` 无阻塞页。
    - 结果: 当前阶段不再存在该条目的翻译 freshness blocker；多语路线图摘要与中文规划事实源现已同步到最新阶段状态。
    - 验证: `pnpm docs:check:source-of-truth`、`pnpm docs:check:i18n` 与本轮 roadmap 翻译同步校验通过。

## 第三十三阶段：创作者统计与质量冲刺 (已审计归档)

> 归档说明: 第三十三阶段「1 个新功能 + 4 个优化」已于 2026-05-03 全部闭合并归档至本文件。5 条主线均在代码、测试、设计文档与 lint/typecheck 中完成闭环。Coverage 80%+ 为冲刺目标，实际收口基线为 Lines 75.8% / Statements 75.67%，顺延至 Phase 34。

> **ROI 评估**: 创作者数据统计增强 1.55；测试覆盖率冲刺 80%+ 1.83；ESLint composables 子桶收紧 1.50；重复代码收敛（三轮）1.40；注释治理候选组 B 1.33。

### 1. 创作者数据统计增强 (P1)

- [x] **创作者数据统计增强 (P1)**
	- 验收: 专项设计文档 docs/design/governance/creator-statistics.md 已冻结首版指标集合、权限口径与归因来源，两轮 Review Gate Pass。
	- 验收: 后台 /admin 新增「创作者统计」Tab，产出卡片 + 发文/分发趋势列表。
	- 验收: GET /api/admin/creator-stats 已落地（?range= + ?authorId=），发文 7d→天/30d→周/90d→月聚合，分发从 Post.metadata JSONB 提取按周分桶。
	- 结果: types/creator-stats.ts, server/utils/creator-stats.ts, server/api/admin/creator-stats.get.ts, creator-metric-card.vue, use-creator-stats-page.ts 落地；i18n 五语完整。
	- 验证: 31 条定向测试 + typecheck + lint 全部通过。

### 2. 测试覆盖率冲刺 80%+ (P0)

- [x] **测试覆盖率冲刺 80%+ (P0)**
	- 验收: 新增 38 条定向测试，修复 3 个回归测试（auth-card/taxonomy-post-page 重构）。E2E categories-tags 选择器适配 + Playwright CI 配置优化（workers 2→4、video retain-on-failure）。
	- 结果: 基线 Lines 75.8% / Statements 75.67%，80%+ 顺延 Phase 34。
	- 验证: pnpm test:coverage, pnpm exec nuxt typecheck, pnpm exec eslint --max-warnings 0。

### 3. ESLint / 类型债 composables 子桶继续收紧 (P1)

- [x] **ESLint / 类型债 composables 子桶继续收紧 (P1)**
	- 验收: composables/ no-non-null-assertion 命中 0（Phase 31 清零），46 个全在测试文件。回退 no-explicit-any 两轮切片：use-ad-injection.ts（3 处）+ server/utils/ad.ts & agreement-public.ts（6 处），eslint.config.js 守线清单新增。
	- 验证: 每轮 eslint --max-warnings 0, nuxt typecheck。

### 4. 重复代码 — 公开认证页模板收敛 + 追加切片 (P1)

- [x] **重复代码 — 公开认证页模板收敛 + 追加切片 (P1)**
	- 首轮: auth-card.vue 共享认证壳组件（-16 dup lines）。
	- 次轮: taxonomy-post-page.vue 统一 categories/tags 页面（-1 clone, -47 dup lines）。
	- 三轮: voice-popover.scss 共享 SCSS（-1 clone, -59 dup lines）。
	- 累计: 33/681/0.57% → 31/575/0.48%（-2 clones, -106 lines, ↓0.09%）。
	- 验证: 每轮 duplicate-code:check Pass, eslint, typecheck。

### 5. 存量代码注释治理 — 候选组 B (P1)

- [x] **存量代码注释治理 — 候选组 B (P1)**
	- upload.ts: 新增 11 处 JSDoc（优先级链、vercel-blob 映射、安全意图、匹配规则矩阵等）。
	- post-access.ts: 新增 rethrowPostAccessError JSDoc；补充 any 类型说明；移除 2 处冗余注释。
	- 验证: eslint --max-warnings 0, nuxt typecheck, post-access.test.ts 通过。

## 第三十二阶段：多语言内容资产化承接入口与高风险治理推进 (已审计归档)

> 归档说明: 第三十二阶段 5 条正式主线 + 1 条 Postgres 派生切片（AITask stale compensation）已于 2026-05-01 / 2026-05-02 全部闭合并归档至本文件；`测试覆盖率与有效性治理 (P0)` 已于 2026-05-02 完成阶段收口（当前基线继续抬升，`80%+` 冲刺目标顺延至下一阶段）。阶段正式收口后，`todo.md` 已清理当前待办区。

> **ROI 评估**: 多语言内容资产化增强包的统一承接入口 1.80；测试覆盖率与有效性治理 1.67；重复代码与纯函数复用收敛 1.60；ESLint / 类型债治理 1.40；Postgres 查询治理（含 AITask 派生切片）2.00。五项均已按本阶段准入边界完成收口，其中 Postgres P0 为本轮最高优先级治理项。

### 1. 多语言内容资产化增强包的统一承接入口 (P1)

- [x] **多语言内容资产化增强包的统一承接入口 (P1)**
	- **增强项 (2026-05-01)**:
		- ✅ 候补名单已实现邮箱应用层去重（`benefitWaitlistService` 中 `findOne` + early return 策略，相同邮箱静默返回已有记录）
		- ✅ 已登录用户自动填充默认值（`pages/benefits.vue` 中 `watch(loggedInUser)` 首次自动填充 `name` + `email`）
		- ✅ 多语言翻译已补全：`pages.enhanced_pack` 已添加到 `ja-JP`、`ko-KR`、`zh-TW` 的 `public.json`，`demo.paths.enhanced_pack` 已同步补全到对应三语 `demo.json`
		- ✅ Footer 新增增强包链接（`components/app-footer.vue`，5 语种 `common.enhanced_pack` 翻译已补齐）
	- 验收: 已在 `docs/design/governance/multilingual-assetization-intake.md` 补齐专项设计文档，首版只做独立说明 / 申请页与真实 CTA。
	- 验收: 已形成「让你的技术内容自动触达全球读者」单一主卖点文案，并明确免费核心与付费增强边界；已有 3 条公开入口完成导流接入（Demo Banner / About 页 / Footer），形成"入口 -> 承接页 -> 申请 / 候补名单"的最小闭环。
	- 非目标: 未对现有免费能力加锁，未扩写为完整销售站点改版。
	- 验证: `pages/benefits.test.ts`（6 tests）、`waitlist.post.test.ts`（2 tests）、`benefit-waitlist.test.ts`（7 tests）全部通过；`lint:i18n` 与 `nuxt typecheck` 通过；回归记录已回链到活动回归窗口。

### 2. 测试覆盖率与有效性治理 (P0)

- [x] **测试覆盖率与有效性治理 (P0)**
	- 验收: 在本阶段基线上继续提升覆盖率，并优先锁定公开页 runtime、认证配置退化、认证页 raw key 暴露三大高风险链路的真实文案装配断言补强。
	- 验收: 不接受只有 snapshot、缺少失败断言或与高风险链路无关的低价值补测；`80%+` 仅作为冲刺目标，不作为阶段关闭线。
	- 非目标: 不把本轮写成全仓 coverage 冲 `80%+` 的铺量工程。
	- **阶段收口记录（2026-05-02）**: 本阶段已完成公开页 runtime（categories / tags / archives / posts）、认证配置退化（auth-client / auth lib）、认证页 raw key 暴露（forgot-password / reset-password / register / login）三大高风险链路的真实文案装配断言补强。全仓覆盖率从 `76.03% / 76.08%` 抬升至当前基线，`pages/login.vue` 达 statements 100% / branches 84.44%。`80%+` 冲刺目标顺延至下一阶段，优先沿其余认证流边角分支、共享组件 raw key 暴露与热点公开读链路失败路径继续补强。
	- 验证: 多轮定向 Vitest、`pnpm i18n:verify:runtime`、`pnpm test:coverage` 与 `pnpm exec nuxt typecheck` 均通过。

### 3. 重复代码与纯函数复用收敛 (P1)

- [x] **重复代码与纯函数复用收敛 (P1)**
	- 验收: 本轮只处理公共页模板片段与列表型查询 helper 两组高收益重复区，需写清原始重复点、拟抽象边界、收益、潜在过度泛化风险与回滚方式。
	- 验收: 至少保住重复代码基线不反弹，并输出本轮收敛后的剩余热点清单。
	- 非目标: 不做跨目录大重构，不扩写为通用 UI 框架改造。
	- 闭合记录（2026-05-01）: 已完成两组高收益重复区收敛。公共页模板片段将 `privacy-policy` / `user-agreement` 两页的整页模板、样式与取数逻辑下沉到 `components/legal-agreement-page.vue` + `composables/use-legal-agreement-page.ts`，同时保留有限集合 i18n key 的显式映射，避免共享组件继续扩大成动态 key 工厂；列表型查询 helper 将 `categories` / `tags` 公开列表端点中重复的缓存 key 组装、公共过滤与 `postCount` 排序逻辑收敛到 `server/utils/taxonomy-public-list.ts`，各自 handler 只保留实体专属差异（如 `parentId`）。
	- 闭合记录（2026-05-01）: `pnpm duplicate-code:check` 当前结果为 `32 clones / 697 duplicated lines / 0.59%`，低于此前 backlog 记录的 `34 clones / 879 duplicated lines / 0.79%` 基线，本轮未出现反弹。
	- 验证: `server/utils/taxonomy-public-list.test.ts`、`tests/server/api/categories/index.get.test.ts`、`tests/server/api/tags/index.get.test.ts`、`pages/privacy-policy.test.ts`、`pages/user-agreement.test.ts`、`components/legal-agreement-page.test.ts` 共 `32` 条断言通过；`nuxt typecheck targeted` 与 `pnpm duplicate-code:check` 通过。

### 4. ESLint / 类型债治理 (P1)

- [x] **ESLint / 类型债治理 (P1)**
	- 验收: 只允许继续上收单规则窄切片，进入实现前必须先冻结候选规则、命中清单、影响文件、预期收益、回滚方式与最小验证矩阵。
	- 非目标: 不并行开启第二条规则治理，不扩写到 `no-unsafe-*` 或全仓 `any` 清零工程。
	- 闭合记录（2026-05-01）: `@typescript-eslint/no-explicit-any` 窄切片已覆盖 `composables/use-post-editor-voice.ts`、`server/api/categories/index.get.ts` 与工具层文件组；同规则 override 已归并为统一配置片段。
	- 闭合记录（2026-05-01）: 当前阶段的 ESLint / 类型债治理已满足"单规则窄切片 + 同规则归组 + 定向验证 + 残余债务说明"四个收口条件。
	- 验证: `pnpm exec eslint composables/use-post-editor-voice.ts server/api/categories/index.get.ts --rule '{"@typescript-eslint/no-explicit-any":2}'`、受影响测试文件与 `pnpm exec nuxt typecheck` 均通过。

### 5. Postgres 查询、CPU 与连接生命周期平衡治理 (P0)

- [x] **Postgres 查询、CPU 与连接生命周期平衡治理 (P0)**
	- 验收: 本轮只从"公开热点读链路"推进，给出数据库唤醒边界、最小字段集、短 TTL 或请求去重中的至少一组收敛方案。
	- 非目标: 不扩写为全站性能重构，不同时并行推进请求入口与热点读链路两大方向。
	- 闭合记录（2026-05-01）: `/api/search` 匿名请求已接入 `60s` 运行时缓存；Neon live sample 已补齐，Top SQL 中 `settings/public` batched `IN (...)` 查询（`5.8ms / 5.4ms`），精选友链（`4.3ms / 4.1ms`），`/api/search` 未继续停留在热点 SQL 顶部。
	- 闭合记录（2026-05-01）: 同一窗口内 compute 仍可反复成功 `start / suspend`，未出现持续钉住 Active 的异常。
	- 验证: `tests/server/api/search/index.get.test.ts`（8 tests）、`nuxt typecheck targeted`、Neon 2026-05-01 live sample 均通过。

### 6. AITask stale compensation 宽行扫描收敛 (P0 / Postgres 派生切片)

- [x] **AITask stale compensation 宽行扫描收敛 (P0 / Postgres 派生切片)**
	- **派生原因（2026-05-01）**: 2026-05-01 Neon live sample 中 `momei_ai_tasks` stale compensation 扫描仍是当前剩余重样本之一（`53.9ms / 1 call`）。
	- 验收: `scanAndCompensateTimedOutMediaTasks()` 首轮扫描只保留 `claim + dispatch` 所需字段。
	- 非目标: 不改 `TTSService` / `ImageService` 的补偿逻辑，不重写调度器。
	- 推进记录（2026-05-01）: 已将 stale scan 收紧为 `id / type / status / result / startedAt / progress` 最小字段集。
	- 推进记录（2026-05-02）: 修复 `RecoverableMediaTaskScanItem` 类型定义中 `error` 字段与 `select` 不一致的问题。
	- **闭合记录（2026-05-02）**: 已补新一轮 Neon live sample。本轮 Top SQL 中 `momei_ai_tasks` stale compensation 扫描（前次 `53.9ms / 1 call`）已完全退出热点列表；System Operations 全天 30+ 次 start/suspend 正常交替。本条 P0 派生切片代码、测试、类型与 live sample 四条证据链已闭环，正式关闭。
	- 验证: `pnpm exec vitest run server/services/ai/media-task-monitor.test.ts`（7 tests）、受影响文件 ESLint、`nuxt typecheck targeted`、Neon 2026-05-02 live sample 均通过。

### 3. 主线：ESLint / 类型债与规则收紧治理 (P1)

- [x] **按窄边界完成两轮规则上收与回滚边界固化**
    - 验收: 只上收 `1 - 2` 条命中有限、回滚边界清晰的高 ROI 规则，不扩写为全仓规则重构。
    - 验收: 输出命中清单、回滚边界与最小验证矩阵，并同步处理受影响文件的 warning / 类型债。
    - 结果: 已完成 `packages/mcp-server` 范围的 `no-explicit-any` / `explicit-module-boundary-types` 收紧，以及 settings API 范围的 `no-unnecessary-type-conversion` 收紧，均保留了命中清单、回滚边界与最小验证矩阵。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21 近线记录与 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20 / 2026-04-21 归档条目；两轮 Review Gate 结论均为 `Pass`。

### 4. 主线：重复代码与纯函数复用收敛 (P1)

- [x] **完成共享 CSV 列表解析与高收益重复区收敛**
    - 验收: 优先收敛公共页模板片段、列表型查询 helper、查询参数处理或读模型组装中的高收益重复区。
    - 验收: 记录重复基线变化、抽象收益与未覆盖边界，并确认未引入过度泛化。
    - 结果: 已将多处 CSV 列表解析统一回收到 `splitAndNormalizeStringList`，并继续压降前台公共页与查询处理重复区；本轮保持“先复用、后扩面”的窄边界治理策略。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20“共享复用层 CSV 列表解析收敛”条目，Review Gate 结论为 `Pass`。

### 5. 主线：国际化运行时加载、文案复用与 unused 审计治理 (P1)

- [x] **明确 missing blocker 分级并补一轮 duplicate / unused 治理基线**
    - 验收: 在现有运行时治理基础上，补一轮 unused 字段排查与 missing blocker 分级治理。
    - 验收: 明确哪些入口必须把 `i18n:audit:missing` 视为 blocker，并沉淀 i18n 变更后的最小检查矩阵。
    - 验收: 继续减少 raw key 直出、命名空间漂移与不受控的跨页面文案复用。
    - 结果: 已补齐 `admin-posts` 缺词 parity，明确 `release`、`weekly` 与 `phase-close` 对 `i18n:audit:missing` 的 blocker 口径，并完成一轮 cross-module duplicate 抽取与 unused 分级说明。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-18“admin-posts parity 与缺词门禁上收”与“i18n 重复文案抽取”条目。

### 6. 主线：文档事实源、回归记录与深度归档治理 (P1)

- [x] **完成目录分层、回归入口与深度归档阈值的首轮收敛**
    - 验收: 至少完成一轮模块设计文档、专项治理目录、回归记录入口与深度归档阈值的组合收敛。
    - 验收: 明确活动窗口、历史归档与兼容入口的边界，并沉淀后续拆分策略。
    - 验收: `docs/design/modules/` 只保留模块总设计，专项治理 / 增量设计 / 阶段复盘统一迁移到 `docs/design/governance/`。
    - 结果: 已完成 `docs/design/modules/` 与 `docs/design/governance/` 的职责分层、`docs/reports/regression/**` 的正式入口收敛，以及 `roadmap.md` / `todo-archive.md` 的 warning / 强制分片阈值文档化。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20“文档事实源、回归入口与深度归档阈值收敛”条目，Review Gate 结论为 `Pass`。

### 1. 部署体验与初始化收敛 (P0)

- [x] **最小可运行路径与部署前体检收敛**
    - 验收: 梳理并收敛“首次部署成功启动”的最小路径，明确核心必填项、可延后增强项与常见错误分层，不再让新部署者主要依赖散落文档自行拼接。
    - 验收: 为部署前体检、启动期配置缺失提示或等价机制补齐最小可用能力，至少能显式识别关键环境变量缺失、配置组合冲突或当前平台不支持的运行方式。
    - 验收: 相关实现必须复用现有 README、部署指南、变量映射、安装向导与设置元信息，不新增第二套配置事实源。
    - 结果: 已在 `server/services/installation.ts`、`utils/shared/installation-diagnostics.ts` 与 `components/installation/step-health-check.vue` 收敛部署运行时识别、阻塞项摘要与安装向导首步体检展示，并通过 `utils/shared/installation-doc-links.ts` 继续复用 locale registry 生成文档入口。
    - 验证: `pnpm exec vitest run utils/shared/installation-diagnostics.test.ts utils/shared/installation-doc-links.test.ts components/installation/step-health-check.test.ts server/services/installation.test.ts`、`pnpm exec eslint server/services/installation.ts components/installation/step-health-check.vue components/installation/step-health-check.test.ts utils/shared/installation-diagnostics.ts utils/shared/installation-diagnostics.test.ts utils/shared/installation-doc-links.ts utils/shared/installation-doc-links.test.ts`、`pnpm exec nuxt typecheck`、`pnpm lint:md` 与 `pnpm docs:check:i18n` 通过。
- [x] **初始化反馈与排障入口统一**
    - 验收: 收敛初始化阶段的提示、失败反馈与排障入口，降低“能看到错误但不知道下一步该做什么”的心智负担。
    - 验收: 至少覆盖本地开发、Vercel / Docker、自托管 Node 三类高频部署路径；Cloudflare 运行时仍按平台边界单独提示，不混淆为已支持路径。
    - 验收: 补齐最小验证，至少确认新部署者可根据提示完成核心变量配置、识别不支持的平台路径，并定位初始化失败原因。
    - 结果: 安装向导首步已输出运行时标签、阻塞 / 警告计数、环境变量提示与统一排障入口；Cloudflare 路径继续按不支持的整站运行时单独提示。
    - 验证: 定向测试覆盖 `utils/shared/installation-diagnostics.test.ts`、`utils/shared/installation-doc-links.test.ts`、`components/installation/step-health-check.test.ts` 与 `server/services/installation.test.ts`，共 24 项通过；`pnpm exec nuxt typecheck`、定向 `eslint`、`pnpm lint:md` 与 `pnpm docs:check:i18n` 通过。

### 2. 编辑器与正文渲染体验第二轮收口 (P0)

- [x] **编辑器兼容性与核心创作路径稳定性补强**
    - 验收: 在继续沿用 `mavon-editor` 异步包装接入的前提下，补齐编辑器核心创作链路的兼容性、交互稳定性与高频操作体验收口。
    - 验收: 至少覆盖工具栏、实时预览、图片 / 媒体插入、翻译回填、多语言切换与未保存状态保护等高频路径，不因局部修补引入新的编辑器回退。
    - 验收: 明确本阶段不直接启动整体替换工程，若发现替换需求，只允许沉淀后续门槛与证据，不扩大当前阶段范围。
    - 结果: 已继续沿用 `components/admin/mavon-editor-client.client.vue` 异步包装，并补齐未保存保护快照、媒体插入链路回归、翻译回填 / 新稿语言切换保护，以及移动端编辑器 smoke。
    - 验证: `pnpm exec vitest run components/admin/posts/post-editor-media-settings.test.ts composables/use-post-editor-translation.test.ts components/article-content.test.ts components/table-of-contents.test.ts utils/shared/markdown.test.ts composables/use-post-editor-page.helpers.test.ts composables/use-unsaved-changes-guard.test.ts`、`pnpm exec playwright test tests/e2e/mobile-critical.e2e.test.ts tests/e2e/auth-session-governance.e2e.test.ts --project=chromium --grep "editor interaction|blank new draft|protect entered new draft"`、`pnpm typecheck` 与定向 `eslint` 通过。
- [x] **预览 / 渲染一致性与多语言编辑体验收敛**
    - 验收: 收敛 Markdown 预览、正文最终渲染、翻译编辑回填与多语言版本切换之间的一致性，减少“编辑时正常、展示时错位”的体验偏差。
    - 验收: 至少覆盖代码块、公式、图片、提示容器、长文本翻译回填与目标语言预览 6 类高风险内容。
    - 验收: 补齐最小定向测试或浏览器验证，记录仍未覆盖的边界与后续观察项。
    - 结果: 已在 `utils/shared/markdown.ts` 收敛正文最终渲染清洗策略，并抽离 `utils/shared/markdown-heading.ts` 作为标题 slug 单一事实源。
    - 验证: `components/article-content.vue`、`components/table-of-contents.vue`、`utils/shared/markdown.test.ts`、`components/article-content.test.ts` 与 `components/table-of-contents.test.ts` 已补齐关键场景验证；专项证据见 [2026-04-10-editor-rendering-round2.md](./../../artifacts/review-gate/2026-04-10-editor-rendering-round2.md)。

### 3. 构建速度与包体性能深化 (P1)

- [x] **高收益热点构建性能收敛**
    - 验收: 基于现有 bundle budget 与性能预算结果，锁定 1 - 2 组高收益热点继续优化构建耗时、首屏依赖与大块 vendor 负担。
    - 验收: 热点范围需显式限定，例如编辑器 / Markdown 渲染链、后台高频页面或文档站构建链路，不扩写为全仓性能重构。
    - 验收: 至少输出优化前后对比结果、预算变化与未继续处理的剩余热点。
    - 结果: 已完成首轮热点收敛，聚焦 `sentry.client.config.ts` 启动重块与 reader / onboarding 低频样式入口污染。
    - 验证: `pnpm build`、`pnpm test:perf:budget`、`pnpm test:perf:budget:strict`、`pnpm typecheck`、`pnpm lint:css`、`pnpm lint:md`、`pnpm exec eslint sentry.client.config.ts components/reader-controls.vue composables/use-onboarding.ts`、`pnpm exec vitest run composables/use-onboarding.test.ts composables/use-reader-mode.test.ts` 通过；`keyCss` 由 `61.04KB` 降至 `59.98KB`，Sentry 配置壳从约 `53.65KB gzip` 拆到约 `0.35KB gzip`。
- [x] **性能守线与验证入口复用**
    - 验收: 继续复用 `test:perf:budget`、strict 预算与现有性能报告链路，不另起第二套性能验证体系。
    - 验收: 若本轮涉及包体切分、依赖替换或构建流程调整，必须补齐对应验证与风险说明，避免“体感优化”缺少证据链。
    - 验收: 保留本轮优化收益、未覆盖边界与下轮可继续切片的方向。
    - 结果: 已继续复用 `.lighthouseci/bundle-budget-report.json` 与现有构建产物进行预算复核，并通过临时 Nitro 验证实例补齐运行期证据。
    - 验证: 当前 `maxAsyncChunkJs` 为 `53.09KB / 120KB`、`keyCss` 为 `59.98KB / 70KB`；剩余热点优先关注运行时壳 `DYc0WSYY.js` 与最大业务 chunk `B653ImUS.js`。

### 4. Cloudflare 运行时兼容研究与止损结论 (P1)

- [x] **Cloudflare 运行时阻塞清单与最小样机研究**
    - 验收: 面向 Cloudflare Pages / Workers / D1 路线输出可追溯的阻塞清单，至少覆盖 TypeORM、Node 运行时依赖、数据库契约、文件存储与定时任务差异。
    - 验收: 若存在最小样机路径，需明确它只代表技术可行性研究，不代表当前项目已支持整站 Cloudflare 部署。
    - 验收: 研究产物至少能够支撑“继续推进 / 暂停投入 / 仅保留外围能力接入”三选一的方向结论。
    - 结果: 已新增 [docs/design/governance/cloudflare-runtime-study.md](../design/governance/cloudflare-runtime-study.md)，并把唯一推荐的最小样机路径收敛为“Cloudflare 仅做外围能力与任务触发，应用主体继续运行在 Vercel / Docker / 自托管 Node”。
- [x] **Cloudflare 平台边界说明与止损结论收口**
    - 验收: 若研究结论仍为短期不适合推进，需进一步收敛对外说明、内部设计约束与后续触发条件，避免未来重复投入同类预研却缺少止损结论。
    - 验收: 若研究结论允许继续推进，也必须先定义下一阶段的技术闸门与替代成本，不得在本阶段直接扩写为整站适配开发。
    - 验收: 补齐对应文档或研究说明入口，确保后续规划可直接复用本轮结论。
    - 结果: 已同步更新部署指南、快速开始、设计入口与文档站导航，将当前对外说明统一收敛为“短期暂停整站 Cloudflare 运行时适配，仅保留外围能力接入”。
    - 验证: `pnpm lint:md` 与 `pnpm docs:check:i18n` 已通过；专项证据见 [2026-04-09-cloudflare-runtime-study.md](./../../artifacts/review-gate/2026-04-09-cloudflare-runtime-study.md)。

### 5. AI 初始化 / 配置问答助手评估 (P1)

- [x] **启用式问答助手范围冻结与事实源复用评估**
    - 验收: 评估是否提供面向新部署者的 AI 初始化 / 配置问答助手，并先冻结可回答范围、可写配置范围、权限边界与失败回退策略。
    - 验收: 明确复用现有安装向导、设置元信息、`qa-assistant` 与文档知识源的可行路径，不额外维护第二套知识或配置事实源。
    - 验收: 若评估结论为不立项，也需保留清晰的拒绝理由与后续触发条件，而不是停留在模糊候选状态。
    - 结果: 已基于现有安装向导字段模型、`ENV -> DB -> Default` 设置解释层、`qa-assistant` 只读边界与部署文档知识源，冻结“只读解释型助手”的可回答范围、禁止写入面与事实源复用路径。
    - 验证: `pnpm lint:md` 与 `pnpm docs:check:i18n` 已通过；专项证据见 [2026-04-09-ai-setup-assistant-evaluation.md](./../../artifacts/review-gate/2026-04-09-ai-setup-assistant-evaluation.md)。
- [x] **安全边界与交互原型评估**
    - 验收: 至少澄清 ENV 锁定字段、敏感配置写入保护、越权问题、错误回答回退与用户确认链路等关键安全边界。
    - 验收: 若进入原型阶段，只允许做启用前引导或配置解释类最小交互，不直接承诺全功能站内 AI 助手体验。
    - 验收: 补齐评估结论、风险分级与是否建议进入下一轮正式实现的产品判断。
    - 结果: 评估结论已明确当前阶段只建议推进安装页 / 设置页双入口的最小交互原型，默认不开放 AI 侧写配置；高风险项收敛为“敏感配置泄露”“只读解释误扩为可写代理”“平台边界误判”三类。
