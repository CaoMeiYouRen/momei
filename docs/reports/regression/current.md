# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

兼容期内，既有历史正文仍可通过 [docs/plan/regression-log.md](../../plan/regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

## 2026-04-21 重复代码与纯函数复用治理首轮切片

### 范围

- 目标：按第三十阶段 `重复代码与纯函数复用治理 (P1)` 的准入边界，只处理 `2` 组高收益重复区，不扩写为全仓重构。
- 本轮覆盖：`server/api/admin/ai/tasks.get.ts` 与 `server/services/ai/task-detail.ts` 的 AI 管理任务读模型装配重复；`server/api/admin/notifications/delivery-logs.get.ts`、`server/api/admin/settings/audit-logs.get.ts`、`server/api/admin/migrations/link-governance/reports.get.ts` 的分页 query `safeParse + 默认回退` 模板重复；以及 `scripts/review-gate/check-duplicate-code.mjs` 的 Windows 运行入口恢复。
- 非目标：不处理仍然使用 `Number(query.page || 1)` / `Number(query.limit || x)` 的后台分页接口，因为这些入口对非法值的既有语义并不完全一致；本轮只收敛完全同构的分页回退模板。

### 原始重复点与抽象边界

- 重复点 1：AI 任务列表接口与任务详情服务各自维护同一组 `task.* + user.*` 字段选择和同一组数字字段归一化。
- 抽象边界 1：把共享的 QueryBuilder 装配与读模型归一化统一收到 `server/services/ai/task-detail.ts`，由列表接口复用 `createAIAdminTaskReadModelQuery` 与 `normalizeAIAdminTaskListItem`，不额外引入新的跨模块 service surface。
- 重复点 2：多个后台分页接口重复书写 `querySchema.safeParse(getQuery(event))` 失败后回退 `{ page: 1, limit: 10 }` 的模板。
- 抽象边界 2：在 `server/utils/pagination.ts` 中新增 `safeParsePaginatedQuery`，只抽取“schema-safeParse + 分页默认值回退”这一个纯函数，不吞并各接口自己的过滤字段、demo 分支或 service 调用。

### 收益、风险与回滚边界

- 复用收益：AI 管理任务读模型后续再扩字段时，只需维护一处字段选择和一处数字归一化，避免列表和详情继续漂移。
- 复用收益：分页 query 回退口径统一后，后台 demo 预览和报表接口不再各自维护完全相同的 fallback 模板。
- 风险控制：`safeParsePaginatedQuery` 只替换原本就使用同一 fallback 的三条链路，不触碰手写 `Number(...)` 的历史接口，避免改变非法 query 值的运行时语义。
- 回滚边界：若本轮出现回归，回滚只需撤销 `server/services/ai/task-detail.ts`、`server/api/admin/ai/tasks.get.ts`、`server/utils/pagination.ts` 与 3 个后台分页接口；不涉及数据库、前端渲染层或公共 API 契约重写。

### 当前基线与剩余热点

- `pnpm duplicate-code:check`
	- 结果：通过；`34 clones / 868 duplicated lines / 0.73%`，低于既有 baseline 容差，Review Gate 结论仍为 `Pass`。
- 读模型 / 路由层剩余热点：`server/api/posts/home.get.ts` <-> `server/api/posts/index.get.ts`、`server/api/ai/translate.post.ts` <-> `server/api/ai/translate.stream.post.ts`、`server/routes/fed/actor/[username].ts` <-> `server/routes/fed/outbox/[username].ts`。
- 页面 / 模板层剩余热点：`pages/privacy-policy.vue` <-> `pages/user-agreement.vue`、`pages/forgot-password.vue` <-> `pages/reset-password.vue`、`pages/categories/[slug].vue` <-> `pages/tags/[slug].vue`。
- 手写分页热点保留：`server/api/admin/friend-link-applications/index.get.ts`、`server/api/admin/friend-links/index.get.ts`、`server/api/admin/submissions/index.get.ts` 仍属于下一轮候选，但需要先明确非法 query 语义后再收敛。

### 已执行验证

- 定向 ESLint：`pnpm exec eslint server/utils/pagination.ts server/utils/pagination.test.ts server/api/admin/notifications/delivery-logs.get.ts server/api/admin/settings/audit-logs.get.ts server/api/admin/migrations/link-governance/reports.get.ts server/services/ai/task-detail.ts server/api/admin/ai/tasks.get.ts scripts/review-gate/check-duplicate-code.mjs tests/server/api/admin/settings/audit-logs.get.test.ts --max-warnings 0`
	- 结果：通过；无输出。
- 定向 Vitest：`server/utils/pagination.test.ts`、`server/api/admin/ai/tasks.get.test.ts`、`tests/server/api/admin/notifications/delivery-logs.get.test.ts`、`tests/server/api/admin/link-governance-reports.test.ts`、`server/api/ai/tasks/[id].get.test.ts`
	- 结果：通过；`18` 个测试全部通过。
- 补充 Vitest：`tests/server/api/admin/settings/audit-logs.get.test.ts`
	- 结果：通过；`2` 个测试通过，覆盖合法参数透传与非法分页参数回退到 `page=1 / limit=10`。
- 类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；无输出、无新增诊断。
- 重复代码基线：`pnpm duplicate-code:check`
	- 结果：通过；最新 artifact 已写入 `artifacts/review-gate/2026-04-21-duplicate-code.json` 与 `artifacts/review-gate/2026-04-21-duplicate-code.md`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮收敛保持在既定的 `2` 组重复区内，且 lint、typecheck、定向测试与重复代码基线均已补齐。

### 未覆盖边界

- `scripts/review-gate/check-duplicate-code.mjs` 在 Windows 下已恢复可运行，但当前实现仍依赖 shell 模式拉起 `pnpm`；后续若要继续治理该脚本，可再评估更稳妥的跨平台子进程封装。
- `safeParsePaginatedQuery` 目前只服务于 `page/limit` 默认回退模板；如果后续要统一 `pageSize`、排序或非法值兼容口径，应另开切片，不要把本 helper 继续膨胀成“大一统 query parser”。
- `server/api/admin/settings/audit-logs.get.ts` 的 `demoMode` 预览分支本轮未补直接 handler 级回归；当前只覆盖了正常 service 路径与非法分页参数回退，后续若继续收紧该链路，再单独为 demo 分支补测。

## 2026-04-21 国际化字段治理关闭复核

### 范围

- 目标：完成第三十阶段 `国际化字段治理 (P1)` 的正式关闭复核，确认本轮已不再停留在“散点补词”，而是已经形成可复核的 blocker 矩阵、运行时边界与共享文案上收口径。
- 本轮收口：覆盖后台壳层导航运行时加载边界、公开友链元信息显式 locale 覆盖、友链公开页 / 后台页共享字段标签上收，以及缺词 / parity / runtime 三类验证基线。
- 证据事实源：`docs/design/governance/i18n-field-governance.md`、`components/app-header.test.ts`、`tests/server/api/friend-links/meta.get.test.ts`、`pages/friend-links.test.ts`、`pages/admin/friend-links/index.test.ts`、`i18n/config/locale-modules.test.ts`、`i18n/config/locale-runtime-loader.test.ts`、`components/commercial-link-manager.test.ts`。

### 基线对比

- 本轮前：长期治理主线已经明确 `missing` 优先于 `unused`，也已把 `i18n:audit:missing` 上收到固定入口，但第三十阶段 `todo` 仍缺一份正式的共享 key 准入标准、覆盖模块清单与关闭口径说明。
- 本轮后：第三十阶段的国际化字段治理已具备明确的字段归属规则、运行时加载边界、blocker 矩阵与已覆盖链路说明，可从当前阶段 `todo` 关闭；长期 i18n 主线继续保留在 backlog。
- 当前仓库基线：`pnpm i18n:audit:missing -- --summary-limit=12` 返回 `total: 0`，仓库级缺词 blocker 已清零。

### 实施说明

- 新增专项治理文档 `docs/design/governance/i18n-field-governance.md`，正式固化页面私有 key、模块级共享 key、组件 / 领域共享 key 与 `common` 级公共文案四层准入标准。
- 友链链路已完成一轮跨公开页与后台页的共享字段上收：`site_url`、`logo`、`rss_url`、`contact_email` 统一迁移到 `components.friend_links.fields.*`，旧的 `public` / `admin-friend-links` 模块仅保留页面私有 placeholder 与 hint。
- 后台壳层导航继续锁定只依赖 `admin` 核心词条，不跨到 `admin-settings`、`admin-ai`、`admin-snippets`、`admin-friend-links` 等可选模块。
- 公开友链元信息接口继续锁定 query 显式覆盖 locale 的行为，避免客户端切换语言时误回退到 cookie / header。

### 已执行验证

- `pnpm i18n:audit:missing -- --summary-limit=12`
	- 结果：通过；`Missing parity summary: total: 0`。
- `pnpm i18n:verify:runtime`
	- 结果：通过；`5` 个测试文件、`45` 个测试全部通过。
- `pnpm i18n:check-sync -- --locale=en-US --module=components --fail-on-diff`
	- 结果：通过；`en-US: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=en-US --module=public --fail-on-diff`
	- 结果：通过；`en-US: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=en-US --module=admin-friend-links --fail-on-diff`
	- 结果：通过；`en-US: parity with zh-CN`。
- 定向友链回归：`pnpm exec vitest run pages/friend-links.test.ts pages/admin/friend-links/index.test.ts components/app-header.test.ts tests/server/api/friend-links/meta.get.test.ts server/utils/locale.test.ts`
	- 结果：通过；`5` 个测试文件、`62` 个测试全部通过。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前剩余内容已降为长期主线的下一轮候选切片，不再阻塞第三十阶段当前 `todo` 关闭。

### 未覆盖边界

- 本轮没有继续把友链 placeholder / hint 类页面私有文案上收到共享命名空间；这属于后续语义复核问题，不是当前关闭 blocker。
- 本轮没有展开 `unused` 字段清理；当前仍坚持 `missing` blocker 优先、`unused` 分级观察的治理策略。
- 长期主线仍需继续守线：后续新增字段或跨模块复用场景，仍必须重新跑 `i18n:audit:missing`、runtime 命中验证与定向 parity。

## 2026-04-21 settings API ESLint / 类型债窄边界收紧

### 范围

- 目标：继续推进第二十九阶段 P1“ESLint / 类型债与规则收紧治理”，但保持单次只上收一条低噪音规则，不把当前切片扩写成全仓清理工程。
- 本轮上收：仅在 `server/api/settings/**` 生产源码范围启用 `@typescript-eslint/no-unnecessary-type-conversion`。
- 回滚边界：仅涉及 `eslint.config.js`、`server/api/settings/public.get.ts` 与 `tests/server/api/settings/public.get.test.ts`；未触碰 `server/services/**`、`composables/**`、测试豁免边界与其他高噪音规则族。

### 命中清单

- 候选筛选：只读采样显示 `@typescript-eslint/prefer-nullish-coalescing` 当前生产源码命中 `1315` 处，明显超出本轮预算；不适合作为继续收紧的小切片。
- 候选筛选：`@typescript-eslint/no-unnecessary-type-conversion` 当前生产源码命中 `42` 处，其中 `server/api/settings/public.get.ts` 集中命中 `5` 处，是当前可清零且回滚面清晰的窄边界热点。
- settings API 范围：本轮定向 lint 通过后，`server/api/settings/**` 下该规则命中已清零。

### 最小验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：记录候选规则采样、切片范围与回滚边界。
- V1：执行 settings API 定向 ESLint、编辑器诊断与 Nuxt typecheck。
- V2：执行 `tests/server/api/settings/public.get.test.ts`，确认公开设置接口的布尔兜底与缓存路径未回归。
- RG：本轮 Review Gate 结论为 `Pass`。

### 实施说明

- `eslint.config.js` 新增 `server/api/settings/**/*.{ts,tsx,mts,cts}` 的窄 override，只对该目录启用 `@typescript-eslint/no-unnecessary-type-conversion`，继续排除测试与脚本范围。
- `server/api/settings/public.get.ts` 新增局部 helper，收敛 `travellings*` 与 `effectsMobileEnabled` 的布尔兜底逻辑，移除 5 处冗余 `String(...)` 包装。
- `tests/server/api/settings/public.get.test.ts` 补充断言，锁定 `travellings*` 默认开启与 `effectsMobileEnabled` 保持 `null` 的既有行为。

### 已执行验证

- 编辑器诊断：`eslint.config.js`、`server/api/settings/public.get.ts`
	- 结果：均无新增错误。
- 定向 ESLint：`pnpm exec eslint server/api/settings/public.get.ts server/api/settings/commercial.get.ts server/api/settings/theme.get.ts eslint.config.js`
	- 结果：通过，无输出。
- 根仓类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过，无输出。
- 定向 Vitest：`tests/server/api/settings/public.get.test.ts`
	- 结果：通过，`3` 个测试全部通过。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮规则上收只作用于 settings API 窄目录，且实际命中、行为回归与类型层都已补齐证据。

### 未覆盖边界

- 本轮没有继续推进 `server/services/email-template.ts` 等 `no-unnecessary-type-conversion` 高频文件，避免把 settings API 小切片扩写为跨服务层治理。
- 本轮没有触碰 `@typescript-eslint/no-unnecessary-condition`；尽管 `server/api/settings/public.get.ts` 仍有该类候选命中，但不属于当前已批准的规则范围。
- `prefer-nullish-coalescing`、`no-explicit-any` 与 `no-unsafe-*` 仍保持观望状态，后续如要继续推进，应按目录或模块组重新拆桶，而不是直接全局提级。

## 2026-04-20 文档事实源、回归入口与深度归档阈值收敛

### 范围

- 目标：完成第二十九阶段 P1“文档事实源、回归记录与深度归档治理”的首轮可落地收敛，不把本轮扩写成全量历史搬迁工程。
- 本轮覆盖：`docs/design/modules/` 与 `docs/design/governance/` 的目录分层、代表性专项文档去 Todo 化与索引重组、`docs/reports/regression/**` 与 `docs/plan/regression-log*.md` 的入口边界收敛，以及 `roadmap.md` / `todo-archive.md` 的深度归档阈值文档化。
- 约束：保留旧 `docs/plan/regression-log*.md` 的历史回看能力，但禁止继续把它们作为新的正式回归写入入口。

### 基线对比

- 回归活动窗口：`docs/reports/regression/current.md` 当前仍低于 `300 - 400` 行阈值，处于健康窗口内；问题不在活动窗口超限，而在旧 `docs/plan/regression-log*.md` 仍承载了过多“像正式入口一样”的说明文字。
- 路线图体量：`docs/plan/roadmap.md` 当前约 `797` 行，已接近 warning 上限，继续追加长篇阶段摘要前需要先定义深度归档触发规则。
- 待办归档体量：`docs/plan/todo-archive.md` 当前约 `1971` 行，已进入 warning 区间，说明下一次阶段归档前应优先准备第一轮深度分片。

### 实施说明

- `docs/reports/regression/index.md` 与 `docs/reports/regression/archive/index.md` 已进一步明确“活动窗口 / 历史归档 / 兼容入口”三层职责，并把旧 `docs/plan/regression-log*.md` 降级为冻结兼容入口。
- `docs/plan/regression-log-index.md` 已收敛为薄兼容页，不再维护具体窗口数字；`docs/plan/regression-log.md` 与 `docs/plan/regression-log-archive.md` 顶部说明也改为“历史快照，只读回看”。
- 新增 `docs/plan/archive/index.md`，正式定义 `roadmap.md` 与 `todo-archive.md` 的 warning / 强制分片阈值、主窗口保留策略与后续阶段区间分片方案。
- `docs/design/modules/index.md` 已收敛为纯模块总设计索引，专项治理、执行矩阵与阶段复盘统一迁移到 `docs/design/governance/index.md`；`cacheable-api-inventory.md`、`demo-mode.md` 与 `i18n-seo-unification.md` 也同步完成首轮去 Todo 化收敛。

### 已执行验证

- `pnpm lint:md`
	- 结果：通过，新增与更新的 Markdown 文档未引入格式问题。
- `pnpm docs:check:source-of-truth`
	- 结果：命令失败，但失败项来自仓库既有的多语文档 `last_sync` 超窗告警；本轮未新增新的层级一致性错误，也未扩大翻译时效债范围。
- `pnpm docs:check:i18n`
	- 结果：通过；本轮文档变更未引入旧目录回流或重复翻译页。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前剩余问题是仓库既有的翻译时效告警，不阻塞本轮“模块设计文档收敛 + 回归入口边界澄清 + 深度归档阈值文档化”的最小闭环。

### 未覆盖边界

- 本轮只定义了深度归档阈值与后续分片策略，尚未真的把 `roadmap.md` 或 `todo-archive.md` 的早期阶段正文迁移到新的阶段区间分片。
- 旧 `docs/plan/regression-log*.md` 仍保留完整历史正文，当前只是完成入口降级与冻结说明，未进行全量正文搬迁。

## 2026-04-20 共享复用层 CSV 列表解析收敛

### 范围

- 目标：在不新增 shared API surface 的前提下，优先收敛一组高收益的列表型查询 / 查询参数处理重复区，把手写的 CSV 解析逻辑统一回收到现有 `splitAndNormalizeStringList`。
- 本轮覆盖：`utils/shared/roles.ts`、`utils/shared/env.ts`、`utils/schemas/post.ts`、`composables/use-post-editor-translation.ts`、`server/database/index.ts`、`server/utils/ai/tts-volcengine.ts`。
- 约束：所有新调用点都显式固定 `delimiters: ','`，避免把 `splitAndNormalizeStringList` 默认支持的分号、全角逗号、顿号等语义外溢到本轮原本只接受英文逗号的链路。

### 基线对比

- 典型手写模式基线：`split(',').map(trim).filter(Boolean)` 在运行时源码中命中 `4` 处，分别位于 `utils/shared/roles.ts`、`server/database/index.ts`、`server/utils/ai/tts-volcengine.ts` 与 `packages/cli/src/cli-shared.ts`。
- 收敛后：运行时源码中仅剩 `packages/cli/src/cli-shared.ts` `1` 处保留；其余 `3` 处已统一切回 shared helper。
- 相邻重复区：`utils/schemas/post.ts` 中的数组查询参数拆分与 `composables/use-post-editor-translation.ts` 中的翻译范围解析也同步回收至同一 helper，避免“同语义、不同实现”继续扩散。

### 实施说明

- `utils/shared/roles.ts` 与 `server/database/index.ts` 不再各自维护角色 CSV 解析细节，统一使用 `splitAndNormalizeStringList` 处理角色串。
- `utils/shared/env.ts` 把 `ADMIN_USER_IDS` 的环境变量解析收回 shared helper，避免启动期配置解析继续保留手写 split / trim / filter 链。
- `utils/schemas/post.ts` 将列表型查询参数解析改为复用 shared helper，继续保持仅按英文逗号拆分的既有行为。
- `composables/use-post-editor-translation.ts` 将翻译范围解析切回 shared helper，并保留去重、白名单过滤与默认回退逻辑。
- `server/utils/ai/tts-volcengine.ts` 统一复用 shared helper 解析字符串形式的 podcast speaker 输入。
- `packages/cli/src/cli-shared.ts` 暂未跟进：该包使用独立 `tsconfig.json` 与 `rootDir=src`，本轮不跨包拉取应用层 shared 依赖，避免为了复用一个纯函数而破坏包边界。

### 抽象收益

- 统一了“CSV 字符串 -> 干净字符串数组”的实现来源，减少角色串、环境变量、查询参数与翻译范围等相近链路的局部漂移风险。
- 没有新增新的工具层接口，只是把既有 helper 真正用到重复区，符合“先收敛、后扩面”的窄边界治理原则。

### 已执行验证

- 定向基线复核：使用 grep 复核后，典型手写 `split(',').map(trim).filter(Boolean)` 运行时命中从 `4` 处降为 `1` 处。
- 根仓定向 ESLint：`pnpm exec eslint utils/shared/roles.ts utils/shared/env.ts composables/use-post-editor-translation.ts utils/schemas/post.ts server/database/index.ts server/utils/ai/tts-volcengine.ts utils/shared/string-list.test.ts utils/schemas/post.test.ts --max-warnings 0`
	- 结果：通过，输出 `ESLINT_OK`。
- 定向 Vitest：`pnpm exec vitest run utils/shared/roles.test.ts utils/shared/string-list.test.ts utils/schemas/post.test.ts composables/use-post-editor-translation.test.ts server/utils/ai/tts-volcengine.test.ts`
	- 结果：通过，`5` 个测试文件、`113` 个测试全部通过。
- 根仓类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过，输出 `TYPECHECK_OK`。
- 编辑器诊断：本轮受影响文件经诊断检查后无新增错误。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮抽象未扩大既有输入语义，也没有跨出 CLI 包的独立构建边界。

### 未覆盖边界

- `packages/cli/src/cli-shared.ts` 仍保留手写 CSV 解析；若后续要继续收敛，应优先在 `packages/cli/src` 内部补一个同构 helper，或先统一包间共享代码策略，而不是直接引用主应用 shared 目录。
- `utils/shared/env.ts` 与 `server/database/index.ts` 这两条链路本轮未新增专门测试，只依赖等价替换、编辑器诊断与类型检查兜底；后续若继续深挖配置装配 / 启动链路，可再补更直接的单测。

## 2026-04-20 mcp-server ESLint / 类型债治理首批收紧

### 范围

- 目标：以最小边界先完成一轮可回滚的 ESLint / 类型债收紧，不把治理扩写成全仓规则改造。
- 本轮上收：仅在 `packages/mcp-server` 生产源码范围启用 `@typescript-eslint/no-explicit-any` 与 `@typescript-eslint/explicit-module-boundary-types`。
- 回滚边界：仅涉及 `packages/mcp-server/eslint.config.js` 与该包 `src/**` 下的 4 个源码文件；`src/**/*.test.ts` 与 `src/**/*.bench.ts` 继续显式排除在本轮收紧范围之外。

### 命中清单

- `@typescript-eslint/no-explicit-any`：共命中 `16` 处。
- 命中文件：`packages/mcp-server/src/lib/api.ts` `3` 处、`packages/mcp-server/src/tools/automation.ts` `7` 处、`packages/mcp-server/src/tools/posts.ts` `6` 处。
- `@typescript-eslint/explicit-module-boundary-types`：共命中 `15` 处。
- 命中文件：`packages/mcp-server/src/lib/api.ts` `13` 处、`packages/mcp-server/src/tools/automation.ts` `1` 处、`packages/mcp-server/src/tools/posts.ts` `1` 处。

### 最小验证矩阵

- 验证层级：`V0 + V1 + V2 + RG`。
- V0：记录规则命中清单、回滚边界与受影响文件。
- V1：执行包内 `lint`、`typecheck` 与根仓 `lint:md`，并确认改动文件无编辑器诊断。
- V2：执行包内 `test`，确认工具注册与 API 包装链路未被本轮类型收紧破坏。
- RG：本轮 Review Gate 结论为 `Pass`。

### 实施说明

- `packages/mcp-server/eslint.config.js` 新增生产源码作用域，仅对 `src/**/*.{ts,tsx,mts,cts}` 上收两条规则，继续排除测试与 bench，保证回滚面清晰。
- `packages/mcp-server/src/lib/api.ts` 收敛为带泛型的 API envelope 包装，移除 `any` 查询 / 入参，补齐 MCP API 类对外方法的显式返回类型。
- 新增 `packages/mcp-server/src/lib/error.ts` 统一处理 `unknown` 异常消息，避免工具注册文件继续使用 `catch (error: any)`。
- `packages/mcp-server/src/tools/posts.ts` 与 `packages/mcp-server/src/tools/automation.ts` 改为 `unknown` 异常处理，并为对外注册函数补显式返回类型。

### 已执行验证

- `packages/mcp-server`: `pnpm lint`
	- 结果：通过；新上收规则命中已清零。
- `packages/mcp-server`: `pnpm typecheck`
	- 结果：通过；API 包装层补充类型后未引入新的类型错误。
- `packages/mcp-server`: `pnpm test`
	- 结果：通过，`2` 个测试文件、`7` 个测试全部通过。
- 根仓：`pnpm lint:md`
	- 结果：通过；`todo.md` 与回归窗口文档改动未引入新的 Markdown 结构问题。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前剩余 ESLint / 类型债仍主要分布在主应用仓库的共享工具层、服务层与前端组件层，不再阻塞本轮包内规则上收闭环。

### 未覆盖边界

- 本轮只治理 `packages/mcp-server` 生产源码，未继续上收该包的 `test` / `bench` 文件规则，也未触碰主应用根仓的共享工具层和服务层历史类型债。
- 根仓 Flat Config 通过 CLI 临时注入插件规则的方式不适合作为采样入口；后续若继续推进全仓治理，应优先按目录或包级边界增量上收，而不是重新尝试全仓命令行覆盖。

### 后续候选

- 下一轮优先考虑 `utils/shared` 这类复用层的窄边界，继续上收 `@typescript-eslint/no-explicit-any` 或等价高 ROI 规则，并优先处理像 `utils/shared/markdown.ts` 这种少量集中命中。
- 若继续推进 `packages/mcp-server`，可再评估是否把同一组规则扩展到 `src/**/*.test.ts` 与 `src/**/*.bench.ts`，但应先确认 benchmark mock 与测试桩是否值得同步收紧。

## 2026-04-18 i18n 重复文案抽取

### 范围

- 目标：先清理低风险、可复用的跨模块重复文案，优先处理平台名称。
- 本轮抽取：将社交平台名称统一收敛到 `common.platforms`，保留 `components.post.share.platforms.wechat_mp` 作为分享场景专属文案，保留 `components.post.sponsor.platforms.*` 中打赏平台专属文案。
- 受影响消费点：`article-share`、`article-sponsor`、`commercial-link-manager`。

### 基线对比

- 抽取前：Shared non-empty string keys `1138 / 2488`，Duplicate groups `63`，Cross-module groups `38`，Keys involved `138`。
- 抽取后：Shared non-empty string keys `1118 / 2465`，Duplicate groups `48`，Cross-module groups `23`，Keys involved `100`。
- 结果：Cross-module groups 减少 `15` 组，Keys involved 减少 `38` 个，说明平台名称这一组重复已被批量压降。

### 实施说明

- 新增 `common.platforms` 作为跨页面、跨组件的共享平台名称来源，覆盖 `github`、`discord`、`telegram`、`whatsapp`、`email` 等社交平台。
- `article-share` 对 `wechat_mp` 继续使用分享场景文案，其余平台统一走 `common.platforms`，避免把“微信”误替换成“微信公众号”。
- `article-sponsor` 仅将社交平台名称切换到 `common.platforms`，打赏平台仍保留在 `components.post.sponsor.platforms`。
- 删除各语言 `settings.commercial.social_platforms` 重复字典，并清理 `components.post.share.platforms` / `components.post.sponsor.platforms` 中已转为共享来源的社交平台条目。

### 已执行验证

- `pnpm i18n:audit:duplicates -- --format=markdown --cross-module-only --limit=0 --output=artifacts/i18n-duplicate-messages-cross-module-2026-04-18.md`
	- 结果：报告已刷新，当前 cross-module duplicate 基线为 `23` 组。
- 定向组件测试：`article-share.test.ts`、`article-sponsor.test.ts`、`commercial-link-manager.test.ts`
	- 结果：`11` 个测试全部通过。
- `pnpm i18n:verify:runtime`
	- 结果：`5` 个测试文件、`41` 个测试全部通过，exit code `0`。

### 后续候选

- 继续优先处理 cross-module report 中已经具备单一语义来源的基础按钮文案，例如 `refresh`、`retry`、`back_to_home`。
- 对 `email`、`language` 等高频词条，需要先确认页面语义是否允许继续合并，避免误把字段标签和动作文案混为同一来源。

## 2026-04-20 第二十八阶段收口复核

### 范围

- 目标：核对第二十八阶段五条主线是否已与当前代码、测试与运行期证据对齐，并为阶段归档提供统一事实源。
- 本轮复核：覆盖后台内容洞察看板、Postgres 查询 / CPU / 连接生命周期平衡治理、全仓 coverage `> 76%`、国际化运行时加载治理，以及编辑器 Markdown / 外观一致性增强。
- 受影响事实源：`docs/plan/todo.md`、`docs/plan/todo-archive.md`、`docs/plan/roadmap.md`、`docs/i18n/*/plan/roadmap.md` 与 `docs/plan/backlog.md`。

### 基线对比

- 复核前：`todo.md` 仍保留 PostgreSQL 平衡治理与 coverage 治理两条未关闭主线，阶段状态仍为“执行中”。
- 复核后：五条主线均满足关闭条件，第二十八阶段可以从“执行中”切换为“已审计归档”。
- 长期主线状态：coverage 治理与 Postgres 平衡治理继续保留在 backlog 中，但第二十八阶段切片本身已完成，不再占用当前执行面。

### 实施说明

- 后台内容洞察主线已完成 `/admin` 首页切换、`GET /api/admin/content-insights`、`post_view_hourly` 真实趋势聚合与对应测试，能力边界与设计文档保持一致。
- Postgres 主线已在代码中完成请求级数据库预热收紧、匿名公开链路按需会话解析，以及公开设置 / 友链读取的短 TTL 运行时缓存；对应入口与测试分别落在 `server/middleware/0b-db-ready.ts`、`server/middleware/1-auth.ts`、`server/api/settings/public.get.ts`、`server/api/friend-links/index.get.ts`、`tests/server/middleware/db-ready.test.ts`、`tests/server/middleware/auth-optional-session.test.ts` 与 `tests/server/api/settings/public.get.test.ts`。
- coverage 主线已补齐后台统计、数据库中间件边界、编辑器语音回退与运行时加载相关高风险测试；本轮以最新全仓 coverage 结果超过 `76%` 为关闭口径，并据此解除第二十八阶段的覆盖率 blocker。
- 国际化运行时加载与编辑器 Markdown / 外观一致性两条主线已在现有代码、设计文档与定向测试中闭环，无需继续保留为当前阶段尾项。

### 已执行验证

- 代码与测试对照：已逐项核对后台内容洞察、数据库预热 / 会话解析 / 短 TTL 缓存、编辑器语音回退与 i18n 运行时相关实现和测试文件，未发现与第二十八阶段验收标准冲突的缺口。
- 文档结构检查：`pnpm exec lint-md` 已对本轮变更的规划、回归与多语路线图摘要文件通过校验。
- 文档目录检查：`pnpm docs:check:i18n` 已通过，确认未引入旧目录回流或重复翻译页。
- 类型状态：`pnpm exec nuxt typecheck` 已通过，当前归档涉及的规划文档未见新的编辑器诊断错误。
- 运行期证据：Postgres 平衡治理结合既有热点基线文档与后台最新观测数据复核后，已能支持“查询次数、重复读取与连接活跃窗口下降趋势已成立”的关闭结论。
- 覆盖率结论：依据最新全仓 coverage 收口结果与本轮复核，coverage 已高于 `76%` 目标线，可关闭本轮 coverage 主线。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前剩余事项仅为长期主线的下一轮候选切片，不再阻塞第二十八阶段归档。

### 未覆盖边界

- 当前活动回归窗口只记录了阶段关闭结论，没有把全仓 coverage 的精确四维百分比重新固化成单独 JSON 摘要；若后续继续上收 coverage 主线，建议补充机器可读的 summary artifact 以降低复查成本。
- Postgres 主线本轮已满足关闭条件，但若未来继续上收下一轮平衡治理，仍应补更长窗口的 `pg_stat_statements` 或等价 live sample，而不是复用本轮关闭结论直接代替新阶段证据。

### 后续候选

- 下一阶段若继续切 coverage 主线，优先围绕 `76%+` 之后的高风险模块深挖，而不是回到平均铺量测试。
- 下一阶段若继续切 Postgres 主线，优先补更长窗口运行期样本、热点 SQL 分组与连接寿命对比，而不是先扩写新的查询裁剪工程。

## 2026-04-18 admin-posts parity 与缺词门禁上收

### 范围

- 目标：压降后台文章管理英文缺词债，避免 `pages.admin.posts.media.audio_missing` 之类 raw key 继续直接漏到 UI，并把缺词审计上收到更高频的固定质量门。
- 本轮处理：完整补齐 `i18n/locales/en-US/admin-posts.json`，将 `pnpm i18n:audit:missing` 接入 `release:check` 与 `regression:weekly`，并同步更新开发、测试、规划、指南和 backlog 治理口径。
- 影响范围：`/admin/posts` 后台编辑链路、发布前校验脚本、周期性回归脚本、i18n 相关开发规范与回归记录事实源。

### 基线对比

- 本轮处理前：定向 parity 审计曾显示 `en-US/admin-posts` 相对 `zh-CN` 缺失 `309` 个 keys。
- 本轮处理后：`en-US`、`zh-CN`、`zh-TW` 的 `admin-posts` 模块均已通过定向 parity 校验。
- 仓库级现状：按 `scripts/i18n/audit-locale-keys.mjs` 当前逻辑直接重算后，`missingParity = 4092`，仍存在大规模历史缺词债；当前最高热点集中在 `en-US/admin-settings.json (1996)`、`en-US/admin-ai.json (360)`、`en-US/admin-link-governance.json (280)`、`en-US/admin-friend-links.json (276)`、`en-US/admin-snippets.json (248)`、`en-US/admin-users.json (220)`、`en-US/admin-ad.json (216)`。

### 实施说明

- 直接将 `en-US/admin-posts.json` 补齐到与当前后台文章管理功能一致的完整 parity，优先消除最频繁暴露到英文后台 UI 的缺词。
- `scripts/release/pre-release-check.mjs` 新增 `i18n:audit:missing` 必经步骤，作为 release blocker 的一部分。
- `scripts/regression/run-periodic-regression.mjs` 的 weekly profile 新增 `i18n:audit:missing`，并将回归日志事实源统一写到 `docs/reports/regression/current.md`。
- `docs/standards/development.md`、`docs/standards/testing.md`、`docs/standards/planning.md`、`docs/guide/development.md` 与 `docs/plan/backlog.md` 已同步声明：i18n 变更后必须补跑缺词 parity 审计，且 release / phase-close 入口不得再放过此类低级错误。

### 已执行验证

- `pnpm i18n:check-sync -- --locale=en-US --module=admin-posts --fail-on-diff`
	- 结果：通过，`en-US: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=zh-CN --module=admin-posts --fail-on-diff`
	- 结果：通过，`zh-CN: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=zh-TW --module=admin-posts --fail-on-diff`
	- 结果：通过，`zh-TW: parity with zh-CN`。
- `pnpm lint:md`
	- 结果：通过，规范与回归文档改动未引入 Markdown 问题。
- `pnpm i18n:audit:missing`
	- 结果：失败，按当前脚本逻辑重算后仓库级 `missingParity = 4092`；说明新的 blocker 已具备实际拦截能力，但全仓历史缺词债仍远未清零。

### 后续候选

- 下一轮优先按热点文件继续清偿 `en-US/admin-settings`、`en-US/admin-ai`、`en-US/admin-link-governance`、`en-US/admin-friend-links` 和 `en-US/admin-snippets` 的缺词债，避免 release blocker 长期处于全局红灯。
- 审计输出当前还会同时暴露大量 unused candidate keys；后续需要拆清“真正缺词 blocker”和“未引用清理候选”的治理节奏，避免一次性输出过大影响回归阅读效率。
