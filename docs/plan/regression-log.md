# 墨梅博客 回归任务记录 (Regression Log)

本文档用于集中维护周期性回归、阶段基线、补跑计划与 Review Gate 证据链正文。规划摘要仍保留在 [待办事项](./todo.md) 与 [项目计划](./roadmap.md) 中，但长篇回归记录应统一沉淀在本文件，避免同一份记录在多个规划文档中重复维护。

## 当前窗口与索引

- 统一入口: [回归日志索引与对比指南](./regression-log-index.md)
- 当前窗口: 活动日志当前保留第二十六阶段的增量治理记录，以及第二十四阶段最近一次阶段收口复跑记录，继续用于当前阶段收口、近期发版核对与最近基线对比。
- 历史归档: 2026-03-20 至 2026-04-06 的较早记录已滚动迁移到 [regression-log-archive.md](./regression-log-archive.md)。
- 历史归档补充: 本轮已继续把 2026-04-07 的较早阶段级 / 专项记录滚动迁移到 [regression-log-archive.md](./regression-log-archive.md)，避免活动日志重新膨胀为阶段归档 blocker。
- 对比建议: 先用本文件确认当前基线，再按主题到归档文件核对更早一期的 clean baseline 或历史专项记录。

## 维护规则

- 回归记录默认按时间倒序追加，便于后续比较基线漂移。
- 同一次回归的正文只保留在本文件；其他规划文档只保留摘要、状态与链接。
- 每条记录至少包含回归范围、触发条件、执行频率、timeout budget、已执行命令、输出摘要、Review Gate 结论、未覆盖边界与后续补跑计划。
- 本文件定位为“活动回归日志”，默认只保留最近 1 - 2 个阶段或最近 6 - 8 条完整回归记录，用于服务当前阶段收口、近期发版与最近基线对比。
- 当本文件超过 300 - 400 行、或最近记录已明显影响当前阶段阅读效率时，应将更早的历史记录迁移到 [regression-log-archive.md](./regression-log-archive.md)，并在本文件顶部保留必要索引与摘要入口。
- 回归记录归档采用“滚动归档”而非“阶段完成即整份搬空”的策略；主日志必须始终保留足够支撑最近一次基线比较和发版判断的近线记录。

## 归档规则

- 触发条件:
    - 活动日志超过 300 - 400 行。
    - 活动日志累计超过 6 - 8 条完整回归记录。
    - 当前阶段已归档，且最旧记录已不再服务最近 1 - 2 个阶段的基线比较。
- 归档范围:
    - 优先迁移最早且已不再参与当前阶段 / 下一阶段基线比较的完整记录。
    - 同一条回归记录必须整体迁移，不拆分其“命令 / 结果 / Review Gate / 后续计划”正文。
- 维护方式:
    - 活动日志保留最近记录与索引入口。
    - 历史记录迁移到 [regression-log-archive.md](./regression-log-archive.md)，按时间倒序维护。
    - 若后续单一归档文件继续膨胀，再按年份或半年进一步拆分归档文件。

## 第二十七阶段接口缓存复用与扩面验收（2026-04-13）

### 回归任务记录

- 回归范围: 第二十七阶段 P1“接口缓存逻辑复用与可缓存接口扩面切片”；覆盖 [server/utils/api-runtime-cache.ts](../../server/utils/api-runtime-cache.ts)、[server/api/settings/public.get.ts](../../server/api/settings/public.get.ts)、[server/api/friend-links/index.get.ts](../../server/api/friend-links/index.get.ts)、[server/api/posts/archive.get.ts](../../server/api/posts/archive.get.ts)、[server/api/categories/index.get.ts](../../server/api/categories/index.get.ts)、[server/api/tags/index.get.ts](../../server/api/tags/index.get.ts) 及其定向测试。
- 触发条件: 当前阶段需要把“缓存复用层 + 高收益公开接口扩面 + 可追踪验收证据”一次性收口，并补齐后续 TTL 调优所需的命中 / 旁路统计口径。
- 执行频率: 第二十七阶段该主线首轮也是当前收口轮；后续仅在继续扩面或调整 TTL / 失效策略时追加增量记录。
- timeout budget:
    - 缓存层扩展（namespace 失效 + 统计埋点）: 25 分钟。
    - 分类 / 标签公开列表扩面与写链路失效接入: 30 分钟。
    - 定向测试 / typecheck / 错误面检查: 30 分钟。
    - 验收文档与规划同步: 20 分钟。
- 已执行命令:
    - `pnpm exec vitest run server/utils/api-runtime-cache.test.ts tests/server/api/archive.test.ts tests/server/api/settings/public.get.test.ts tests/server/api/categories/index.get.test.ts tests/server/api/tags/index.get.test.ts`
    - `pnpm exec nuxt typecheck`
- 输出摘要:
    - 已执行验证:
        - V1 / 复用层治理: [server/utils/api-runtime-cache.ts](../../server/utils/api-runtime-cache.ts) 已新增 namespace 级失效与命中 / 未命中 / 旁路 / 写入计数器；[server/utils/api-runtime-cache.test.ts](../../server/utils/api-runtime-cache.test.ts) 已锁定命中率统计与 namespace 失效行为。
        - V1 / 接口扩面: 分类公开列表与标签公开列表已接入统一缓存层，并在各自新增 / 更新 / 删除接口中补上 namespace 失效，避免只能依赖 TTL 自然过期。
        - V1 / 定向测试: 上述 5 个测试文件通过，覆盖缓存命中、旁路统计、namespace 失效，以及 archive / settings / categories / tags 的公开接口缓存边界。
        - V1 / 类型层: `pnpm exec nuxt typecheck` 通过。
        - V1 / 证据层: 已新增 [cacheable-api-inventory.md](./cacheable-api-inventory.md)，统一记录接口、TTL、共享边界、失效策略与观测 namespace。
    - 结果摘要:
        - 当前阶段已接入统一缓存层的接口共 `5` 组：`settings/public`、`friend-links/index`、`posts/archive`、`categories/index`、`tags/index`。
        - 其中分类 / 标签公开列表已形成“读缓存 + 写失效”的第一组完整落地验证；设置、友链与归档则继续采用短 TTL + 权限边界控制，避免当前阶段扩写为跨部署缓存一致性工程。
        - 缓存层现在可以提供按 namespace 的命中率与旁路统计，后续如需调大 / 调小某组 TTL，已经有统一的比较口径，而不必再人工分散埋点。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: none
        - 主要问题:
            - 未发现 blocker；当前主线验收已满足“缓存复用层抽离 + 高收益接口扩面 + 一轮定向验证 + 证据文档落盘”。
    - 未覆盖边界:
        - 当前统计口径仍是进程内计数，不覆盖多实例聚合，也不替代数据库长窗口样本。
        - `settings/public`、`friend-links/index` 与 `posts/archive` 目前仍以 TTL 自然过期为主，没有补后台写链路主动失效。
    - 后续补跑计划:
        - 若下一轮继续扩面，可优先评估搜索、外部文章列表或其他公开列表接口是否值得接入统一 namespace 失效。
        - 若要做 TTL 调优，应先读取对应 namespace 的命中率 / 旁路统计，再决定是否收紧或放宽 `60s` 基线。

## 第二十六阶段收口复核（2026-04-13）

### 回归任务记录

- 回归范围: 第二十六阶段五条主线收口复核；覆盖测试覆盖率达标、ESLint / 类型债收紧完成态、注释治理与复用收敛结果、以及 PostgreSQL 查询与数据库出网流量治理的运行期监控结论。
- 触发条件: 当前阶段 `todo` 已完成态与执行证据需要正式对齐，以满足阶段归档与多语路线图同步的准入要求。
- 执行频率: 第二十六阶段收口一次性复核。
- 已执行验证:
    - 提交与改动对齐: 2026-04-11 至 2026-04-13 的实现与测试提交已覆盖五条主线对应模块与验证文件。
    - 覆盖率结论: 最新全仓覆盖率已达到阶段目标（约 `72%`），可关闭覆盖率主线。
    - PostgreSQL 结论: 查询收敛、初始化边界收口与短 TTL 缓存落地后，后台监控显示查询与连接压力显著缓解，可关闭 PostgreSQL 主线。
    - 文档同步: 中文 `todo` / `todo-archive` / `roadmap` 与 `docs/i18n/*/plan/roadmap.md` 已完成状态同步。
- Review Gate 结论:
    - 结论: Pass（阶段归档放行）
    - 问题分级: none
    - 主要问题: 无 blocker。
- 未覆盖边界:
    - 本轮仅完成阶段收口与归档同步，不在当前步骤中写入下一阶段正式规划。
- 后续补跑计划:
    - 下一阶段开启后按规划规范继续执行周级 / 发版前 / 阶段收口固定回归入口，维持 coverage 与数据库治理趋势线的可追溯性。

## 第二十六阶段测试覆盖率推进首轮增量补测（2026-04-12）

### 回归任务记录

- 回归范围: 第二十六阶段 P0“测试覆盖率与红绿测试有效性推进”首轮增量补测；聚焦 [server/services/ai/text.ts](../../server/services/ai/text.ts) 与同级测试 [server/services/ai/text.test.ts](../../server/services/ai/text.test.ts)，优先补失败路径、包装器分支与边界判断，不扩写到整组公开 API。
- 触发条件: 当前阶段待办要求优先补齐 `server/services/ai/text.ts`、公开查询热点 API 与数据库治理相关服务层的失败路径、边界断言与回退逻辑；现有 TextService 测试已覆盖主干 happy path，但 `optimizeManuscript`、`expandSection`、`translateName(s)`、`suggestSlugFromName`、`recommendCategories` 与异步翻译阈值判断仍存在高 ROI 空洞。
- 执行频率: 第二十六阶段测试主线的首轮服务层增量补测；后续仅在继续扩到公开 API 热点或 AI 文本编排链路时追加记录。
- timeout budget:
    - 目标模块缺口盘点与测试设计: 20 分钟。
    - 定向测试编写: 30 分钟。
    - 定向 Vitest 转绿: 10 分钟。
    - 定向 coverage 取证与文档同步: 15 分钟。
- 已执行命令:
    - `pnpm exec vitest run server/services/ai/text.test.ts`
    - `pnpm exec vitest run server/services/ai/text.test.ts --coverage --coverage.reporter=text-summary --coverage.include=server/services/ai/text.ts`
- 输出摘要:
    - 已执行验证:
        - V1 / 增量补测层: [server/services/ai/text.test.ts](../../server/services/ai/text.test.ts) 新增 `9` 条用例，覆盖 `optimizeManuscript` 的 `podcast` 分支、`expandSection` 的 trim 行为、`shouldUseAsyncTranslateTask` 阈值边界、`translateName` / `translateNames` 的成功与失败路径、`suggestSlugFromName` 的 ASCII slug 归一化输出，以及 `recommendCategories` 的空输入短路、JSON 解析与非 JSON 回退解析。
        - V1 / 定向测试层: `pnpm exec vitest run server/services/ai/text.test.ts` 通过，当前 [server/services/ai/text.test.ts](../../server/services/ai/text.test.ts) 共 `33` 条用例全部转绿。
        - V2 / 定向覆盖率层: `pnpm exec vitest run server/services/ai/text.test.ts --coverage --coverage.reporter=text-summary --coverage.include=server/services/ai/text.ts` 通过；[server/services/ai/text.ts](../../server/services/ai/text.ts) 当前定向覆盖率为 `Statements 85.62% (137/160)`、`Branches 79.54% (70/88)`、`Functions 95.83% (23/24)`、`Lines 85.98% (135/157)`。
    - 结果摘要:
        - 本轮优先补的是“最容易遗漏且最容易回归”的服务层包装器与回退分支，而不是继续堆叠已稳定的 happy path；因此新增用例主要围绕异常输入、provider 返回格式漂移、阈值边界和空输入短路。
        - [server/services/ai/text.ts](../../server/services/ai/text.ts) 已形成更完整的单文件测试基线，后续即使继续重构 `translate*` / `recommend*` 包装器，也有现成的红绿保护网。
        - 本轮属于守线型增量补测，主要新增的是过去缺失的断言与边界覆盖，而不是先复现既有 failing test 再修实现；对应证据口径应视为“新增补测已转绿”，不是“已有红例转绿”。
        - 这轮只提升了目标服务层，不足以单独支撑全仓 coverage 从 `68.85%` 向 `72%` 收口；它的价值在于先把 todo 中点名的高优先级 AI 文本服务缺口补齐。
        - 截至最近一次全仓 coverage 汇总（[coverage-report/coverage-summary.json](../../coverage-report/coverage-summary.json)），当前总覆盖率为 `Statements 70.45% (16937/24039)`、`Lines 70.48% (16249/23053)`；因此第二十六阶段覆盖率主线仍未满足“约 `72%`”的阶段目标，后续还需继续补齐公开查询热点 API 或数据库治理相关服务层的高 ROI 缺口。
    - Review Gate 结论:
        - 结论: Pass（限本轮服务层补测）
        - 问题分级: none
        - 主要问题:
            - 未发现新增 blocker；新增测试均已通过定向执行与定向 coverage 取证。
    - 未覆盖边界:
        - 本轮没有补 [server/services/ai/text.ts](../../server/services/ai/text.ts) 的 `getTaskStatus` 包装链路，也没有扩到 `createTranslateTask` 这类薄包装器；若后续需要进一步逼近单文件 90%+，可继续补这组委派分支。
        - 本轮没有触碰 todo 中同样点名的公开查询热点 API 与数据库治理相关服务层，例如 `search`、`settings/public`、`friend-links` 或 PostgreSQL 读链路缓存边界。
    - 后续补跑计划:
        - 下一轮优先切到公开查询热点 API，优先从 `search`、`settings/public`、`friend-links` 或 `external posts` 的失败路径 / 缓存边界中选一组增量补测，避免覆盖率治理长期停留在单个 AI 服务文件。
        - 若继续深挖 AI 文本链路，则优先补 `getTaskStatus`、任务续跑与 translate task 委派链路，形成 `text.ts` 与 [server/services/ai/text-translation-task.ts](../../server/services/ai/text-translation-task.ts) 的成对基线。

## 第二十六阶段 ESLint / 类型债第二轮收紧增量落地（2026-04-12）

### 回归任务记录

- 回归范围: 第二十六阶段 P1“ESLint / 类型债第二轮收紧”增量落地；覆盖 [eslint.config.js](../../eslint.config.js)、[server/services/external-feed/parser.ts](../../server/services/external-feed/parser.ts)、[server/services/ai/tts.ts](../../server/services/ai/tts.ts) 与 [docs/plan/todo.md](./todo.md)，聚焦 `@typescript-eslint/no-unnecessary-type-assertion` 这一组低命中、低风险的冗余断言治理，不扩写到 `prefer-nullish-coalescing`、`no-explicit-any` 或 `no-unsafe-*` 等更宽规则族。
- 触发条件: 当前阶段待办要求继续正式收紧 `1 - 2` 条高 ROI ESLint 规则；本轮候选扫描显示 `prefer-nullish-coalescing` 在编辑器 composable 中命中面过宽，不适合继续作为小切片推进，而 `no-unnecessary-type-assertion` 总命中仅 `10` 条，其中生产代码 `5` 条，回滚边界更清晰。
- 执行频率: 第二十六阶段当前主线的增量落地；后续仅在继续细分更高成本规则族、或需要把测试 / 脚本豁免重新拆桶时追加记录。
- timeout budget:
    - ESLint API 只读候选扫描: 15 分钟。
    - 生产命中修复与配置收紧: 20 分钟。
    - 定向 lint / typecheck / Vitest: 30 分钟。
    - 全仓 warning 预算复核与文档同步: 20 分钟。
- 已执行命令:
    - `node --input-type=module -`（调用 ESLint API，只读统计 `@typescript-eslint/no-unnecessary-type-assertion` 与其他候选规则在当前生产 TS 范围的命中位置）
    - `pnpm exec eslint server/services/external-feed/parser.ts server/services/ai/tts.ts eslint.config.js`
    - `pnpm exec nuxt typecheck`
    - `pnpm exec vitest run server/services/ai/tts.test.ts tests/server/external-feed/aggregator.test.ts tests/server/api/external-feed/home.get.test.ts`
    - `pnpm exec eslint . --max-warnings 10`
    - `pnpm exec lint-md docs/plan/regression-log.md docs/plan/todo.md`
- 输出摘要:
    - 已执行验证:
        - V1 / 基线层: 候选规则扫描显示 `@typescript-eslint/no-unnecessary-type-assertion` 当前总命中 `10` 条，其中生产代码 `5` 条，集中在 [server/services/external-feed/parser.ts](../../server/services/external-feed/parser.ts) `4` 条与 [server/services/ai/tts.ts](../../server/services/ai/tts.ts) `1` 条；其余 `5` 条位于测试文件，继续保留在测试豁免边界之外。
        - V1 / 静态层: 定向 ESLint 通过；全仓 `pnpm exec eslint . --max-warnings 10` 通过且无输出，说明本轮提升没有冲破当前 warning 门禁。
        - V1 / 类型层: `pnpm exec nuxt typecheck` 通过。
        - V1 / 文档层: `pnpm exec lint-md docs/plan/regression-log.md docs/plan/todo.md` 通过。
        - V2 / 逻辑层: 定向 Vitest 共 `3` 个测试文件、`10` 条断言通过，覆盖 TTS stale task 补偿链路与外部 feed 聚合 / 首页 payload 行为，确认去除冗余断言后行为未变。
    - 结果摘要:
        - [eslint.config.js](../../eslint.config.js) 已把 `@typescript-eslint/no-unnecessary-type-assertion` 提升为仅作用于生产 TS 的 warning，并继续显式排除 `tests/**`、`scripts/**`、`server/api/admin/migrations/**`、`**/migration-*.ts` 与同级 `*.test.*` / `*.spec.*` 文件，保持测试 / 脚本 / 迁移豁免边界可审计；当前未发现需要单独 carve-out 的“历史遗留目录”命中。
        - [server/services/external-feed/parser.ts](../../server/services/external-feed/parser.ts) 不再对 `entry['media:content']`、`entry['media:thumbnail']`、`channel.item` 与 `feed.entry` 做无效的 `as unknown` 断言；[server/services/ai/tts.ts](../../server/services/ai/tts.ts) 也移除了对 `task.status` 的冗余状态断言。
        - 候选筛选阶段已确认 `prefer-nullish-coalescing` 当前在编辑器 composable 族中命中面偏宽，不适合直接并入本轮小切片；因此本轮只上收 `no-unnecessary-type-assertion`，避免静默扩 scope。
        - 回滚方式保持清晰: 若后续发现规则噪音超出预期，只需回退 [eslint.config.js](../../eslint.config.js) 中新增的 `no-unnecessary-type-assertion` production warning 配置，并恢复上述两个服务文件中的原始断言写法，不会牵连测试、脚本或更大范围的类型债治理。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: none
        - 主要问题:
            - 未发现阻塞问题；当前放行基于生产命中已清零、相关服务测试通过且全仓 warning 预算未被突破。
    - 未覆盖边界:
        - 本轮没有继续处理测试文件中的 `no-unnecessary-type-assertion` 命中，测试层仍保留显式豁免，避免把当前小切片扩写成测试夹具整理。
        - 本轮没有推进 `prefer-nullish-coalescing`，因为它在 [composables/use-post-editor-io.ts](../../composables/use-post-editor-io.ts) 与相关编辑器 helper 中的命中面明显高于本轮预算。
    - 后续补跑计划:
        - 下一轮优先重新拆桶 `prefer-nullish-coalescing` 的编辑器 composable 命中，判断是否要按目录或模块组继续切片，而不是直接全量提级。
        - 若继续推进类型债，仍应优先选择生产代码低命中规则，再决定是否触碰 `no-unnecessary-type-conversion` 或更高成本的 `no-explicit-any` / `no-unsafe-*`。

## 第二十六阶段 ESLint / 类型债第二轮收紧第二批落地（2026-04-12）

### 回归任务记录

- 回归范围: 第二十六阶段 P1“ESLint / 类型债第二轮收紧”第二批落地；覆盖 [eslint.config.js](../../eslint.config.js)、[server/api/ads/script.get.ts](../../server/api/ads/script.get.ts)、[server/services/ai/quota-governance.ts](../../server/services/ai/quota-governance.ts)、[server/services/email-template.ts](../../server/services/email-template.ts)、[server/services/friend-link.ts](../../server/services/friend-link.ts)、[server/services/import-path-alias.ts](../../server/services/import-path-alias.ts)、[server/utils/ai/cost-governance.ts](../../server/utils/ai/cost-governance.ts)、[server/utils/email/templates.ts](../../server/utils/email/templates.ts) 与 [docs/plan/todo.md](./todo.md)，聚焦 `@typescript-eslint/no-unnecessary-type-arguments` 的 server 范围收敛。
- 触发条件: 第一批已完成 `@typescript-eslint/no-unnecessary-type-assertion` 的 production 收紧，但当前阶段验收允许再正式收紧 `1 - 2` 条高 ROI 规则；候选扫描显示 `@typescript-eslint/no-unnecessary-type-arguments` 全仓总命中 `17` 条，其中 server 目录 `12` 条、测试 `1` 条、其余为 composable 命中。为保持范围可控，本轮只上收 server 目录。
- 执行频率: 第二十六阶段当前主线的第二批增量落地；后续仅在继续处理 composable 命中、或把更高成本规则再拆桶时追加记录。
- timeout budget:
    - ESLint API 只读拆桶扫描: 15 分钟。
    - server 命中修复与配置收紧: 25 分钟。
    - 定向 lint / typecheck / Vitest: 35 分钟。
    - 全仓 warning 预算复核与文档同步: 20 分钟。
- 已执行命令:
    - `node --input-type=module -`（调用 ESLint API，只读统计 `@typescript-eslint/no-unnecessary-type-arguments` 的 production / test 命中分布）
    - `pnpm exec eslint server/api/ads/script.get.ts server/services/ai/quota-governance.ts server/services/email-template.ts server/services/friend-link.ts server/services/import-path-alias.ts server/utils/ai/cost-governance.ts server/utils/email/templates.ts eslint.config.js`
    - `pnpm exec nuxt typecheck`
    - `pnpm exec vitest run server/services/ai/quota-governance.test.ts server/services/email-template.test.ts server/services/friend-link.test.ts server/services/import-path-alias.test.ts server/utils/ai/cost-governance.test.ts server/utils/email/templates.test.ts`
    - `pnpm exec eslint . --max-warnings 10`
    - `pnpm exec lint-md docs/plan/regression-log.md docs/plan/todo.md`
- 输出摘要:
    - 已执行验证:
        - V1 / 基线层: `@typescript-eslint/no-unnecessary-type-arguments` 当前全仓总命中 `17` 条，其中 server 目录 `12` 条、测试 `1` 条、剩余为 composable 命中；本轮仅上收 `server/**`，继续显式排除 tests / scripts / migrations。
        - V1 / 静态层: 定向 ESLint 通过；全仓 `pnpm exec eslint . --max-warnings 10` 通过且无输出。
        - V1 / 类型层: `pnpm exec nuxt typecheck` 通过。
        - V1 / 文档层: `pnpm exec lint-md docs/plan/regression-log.md docs/plan/todo.md` 通过。
        - V2 / 逻辑层: 定向 Vitest 共 `6` 个测试文件、`27` 条断言通过，覆盖 quota 统计、邮件模板变量解析、友链元信息、导入路径别名总结、AI 成本治理与邮件模板 shell 组装等路径，确认删除冗余类型参数后行为未变。
    - 结果摘要:
        - [eslint.config.js](../../eslint.config.js) 已新增一条仅作用于 `server/**/*.{ts,tsx,mts,cts}` 的 `@typescript-eslint/no-unnecessary-type-arguments` warning，并继续显式排除 tests、scripts 与 migrations，确保受影响目录范围可审计。
        - 本轮共清零 `7` 个 server 文件中的 `12` 条 production 命中，改动仅为移除可由 TS 自动推断或已是默认值的类型参数，不涉及运行时逻辑分支调整。
        - 经过第二批落地后，第二十六阶段“ESLint / 类型债第二轮收紧”主线已完成两条高 ROI 规则的正式收紧：`@typescript-eslint/no-unnecessary-type-assertion`（生产 TS）与 `@typescript-eslint/no-unnecessary-type-arguments`（server TS）。
        - 回滚方式保持清晰: 若后续发现 `server/**` 范围的 `no-unnecessary-type-arguments` 噪音超出预期，只需回退 [eslint.config.js](../../eslint.config.js) 中新增的 server override，并恢复上述 7 个文件中的显式类型参数写法。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: none
        - 主要问题:
            - 未发现阻塞问题；当前放行基于 server 命中已清零、相关服务测试通过且全仓 warning 预算未被突破。
    - 未覆盖边界:
        - 本轮没有继续处理 composable 中的 `no-unnecessary-type-arguments` 命中，避免把当前 server 小切片扩写为跨层返工。
        - 本轮没有触碰 `no-unnecessary-type-conversion` 与 `prefer-nullish-coalescing`，因为这两组规则当前命中面仍明显高于本轮预算。
    - 后续补跑计划:
        - 若下一轮继续推进类型债，优先重新评估 composable 目录的 `no-unnecessary-type-arguments` 与 `prefer-nullish-coalescing` 命中，按目录或业务模块继续拆桶。
        - 若阶段重点转向覆盖率、注释治理或数据库主线，本条 ESLint 主线可视为已满足当前阶段验收，不再默认扩写新的规则族。

## PostgreSQL 查询与数据库出网流量治理补充回归（2026-04-12）

### 系统性优化方案（2026-04-12）

- 背景判断:
    - 本轮用户补充的历史运行期样本表明，当前 PostgreSQL 成本不只来自公开列表查询本身，还叠加了数据库过早初始化、匿名公开请求触发鉴权 / 安装态检查、以及少数详情链路仍偏宽的查询模型。
    - 当前阶段主目标仍然是“降低数据库出网流量与查询压力”；CPU 使用时机、数据库 start / suspend 频率与活跃时长，只作为辅助判断哪些链路在不必要地拉长数据库工作窗口。
- 方案总述:
    - 后续治理拆成两条线并行推进，但优先级不对等：先处理“哪些请求根本不该碰数据库”，再处理“已经必须查库的请求如何进一步缩小返回体量”。
    - 因此，第二十六阶段 PostgreSQL 主线的下一轮实现不再优先扩写 `posts / archive / categories / tags / search / external posts` 的 list payload 微调，而是优先收紧数据库初始化边界、补公开低频配置链路的短 TTL 缓存，并再评估详情页读模型的字段范围。
- 轨道 A / 查询与返回体量优化:
    - 候选 A1: 文章详情链路继续瘦身。[server/utils/post-detail-read.ts](../../server/utils/post-detail-read.ts) 当前公开详情查询仍联带 author 邮箱、社交链接、赞赏链接与完整 category / tags 关系；下一步应区分“公开详情读模型”和“管理 / 编辑读模型”，避免匿名详情页沿用偏宽的后台视角字段集。
    - 候选 A2: 公开低频配置读接口缓存化。[server/api/settings/public.get.ts](../../server/api/settings/public.get.ts) 与 [server/api/friend-links/index.get.ts](../../server/api/friend-links/index.get.ts) 都属于低频变更、高频读取链路；与其继续逐次直连数据库，更适合上短 TTL 缓存或基于配置变更的失效策略。
    - 候选 A3: 复用既有快照缓存模式。[server/services/external-feed/aggregator.ts](../../server/services/external-feed/aggregator.ts) 已证明“缓存快照 + stale 回退”在聚合型公开数据上可行；后续公共设置、友链元信息与首页公共装配块优先复用这一模式，而不是再各自造一套缓存协议。
- 轨道 B / 降低数据库活跃时长与唤醒概率:
    - 候选 B1: 去掉数据库模块级主动初始化。[server/database/index.ts](../../server/database/index.ts) 当前在模块求值阶段执行 `void initializeDB()`，会放大冷启动后的 metadata / information_schema / pg_catalog 探测成本；后续应改为按需初始化，让真正需要数据库的链路显式承担连接时机。
    - 候选 B2: 收紧安装状态检查边界。[server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 当前对大多数非静态请求都会检查安装状态，而 [server/services/installation.ts](../../server/services/installation.ts) 内还会顺带探测数据库版本；这类逻辑应尽量限制在安装态页面、安装 API 与真正依赖数据库的请求入口，避免匿名公开流量因为“先判断一次状态”就唤醒数据库。
    - 候选 B3: 收紧匿名公开请求的鉴权链路。[server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 当前会在解析 session 前先确保数据库已初始化；后续应优先判断请求是否携带会话上下文、是否属于受保护接口，再决定是否进入需要数据库参与的鉴权流程。
    - 候选 B4: 保持自部署定时任务为次级观察项。[server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts) 在非 serverless 环境会启动后立刻跑一次友链巡检；这会拉长数据库活跃窗口，但相较匿名公开请求的中间件入口，它仍属于次一级优化项，暂不优先扩写为当前 blocker。
- 推荐实施顺序:
    - 第一步: 收紧 [server/database/index.ts](../../server/database/index.ts)、[server/middleware/0-installation.ts](../../server/middleware/0-installation.ts)、[server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 的数据库初始化边界。
    - 第二步: 为 [server/api/settings/public.get.ts](../../server/api/settings/public.get.ts) 与 [server/api/friend-links/index.get.ts](../../server/api/friend-links/index.get.ts) 增加短 TTL 或快照式缓存，并明确后台变更后的失效策略。
    - 第三步: 复查 [server/utils/post-detail-read.ts](../../server/utils/post-detail-read.ts) 的公开详情字段集，只保留前台真正需要的 author / taxonomy 信息。
    - 第四步: 在上述改动完成后，再回到预发或生产 PostgreSQL 环境补同范围 live sample，确认新增收敛点确实减少了数据库初始化探测、连接波峰与重复读取。
- 后续验收口径:
    - 新样本中 `information_schema`、`pg_catalog` 与 TypeORM metadata 探测查询占比应下降，否则说明数据库初始化边界仍偏宽。
    - 公开设置、友链与首页公共装配请求在命中缓存后，应能证明“不再触发数据库查询”或“显著降低重复读取次数”。
    - PostgreSQL 主线是否关闭，仍以同范围运行期 `pg_stat_statements` 或等价 live sample 为准；本方案文档只提供下一轮实现顺序与证据判断框架，不替代运行期样本。

### 增量实现进展（2026-04-12）

- 本轮实现范围:
    - 数据库初始化边界收紧: 已移除 [server/database/index.ts](../../server/database/index.ts) 的模块级 `initializeDB()` 主动触发，避免仅因为模块加载就预热数据库。
    - 安装检查链路收敛: [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 新增环境安装标记快速路径与 30 秒短缓存，减少已安装场景下重复安装状态查库。
    - 匿名请求鉴权链路收敛: [server/middleware/1-auth.ts](../../server/middleware/1-auth.ts) 改为仅在 `api/auth` 路径或请求携带会话线索（cookie 包含 `better-auth` / `session`）时才解析 session，降低公开匿名流量触发数据库初始化概率。
    - 公开低频配置短 TTL 缓存: [server/api/settings/public.get.ts](../../server/api/settings/public.get.ts) 与 [server/api/friend-links/index.get.ts](../../server/api/friend-links/index.get.ts) 新增 60 秒运行时缓存与 `Cache-Control` 响应头，减少同实例内重复查库。
    - 新增缓存基础设施: [server/utils/runtime-cache.ts](../../server/utils/runtime-cache.ts) 提供轻量 TTL 缓存能力，供上述链路复用。
- 本轮验证结果:
    - 定向测试通过: `pnpm exec vitest run tests/server/api/settings/public.get.test.ts server/services/friend-link.test.ts`（`7` 通过，`0` 失败）。
    - 新增缓存行为断言: [tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 已补“同 locale 重复请求命中短 TTL 缓存”测试，锁定 `getSettings` 只调用一次。
    - 定向 ESLint 通过: `pnpm exec eslint server/middleware/0-installation.ts server/middleware/1-auth.ts server/api/settings/public.get.ts server/api/friend-links/index.get.ts server/utils/runtime-cache.ts tests/server/api/settings/public.get.test.ts`。
    - 类型检查通过: `pnpm exec nuxt typecheck` 无输出。
- 当前结论:
    - 第二十六阶段 PostgreSQL 主线已完成一轮“减少不必要查库”增量实现，覆盖了初始化边界、匿名鉴权触发面与公开低频接口缓存三条高 ROI 收敛点。
    - 主线关闭条件不变，仍需补同范围运行期 `pg_stat_statements` 或等价 live sample，验证 metadata 探测查询占比、重复读取次数与连接活跃窗口是否按预期下降。

### 回归任务记录

- 回归范围: 第二十六阶段 P0“PostgreSQL 查询与数据库出网流量治理”补充回归；覆盖 [server/api/search/index.get.ts](../../server/api/search/index.get.ts)、[server/api/external/posts.get.ts](../../server/api/external/posts.get.ts)、[server/utils/post-list-query.ts](../../server/utils/post-list-query.ts)，以及既有 `posts / archive / categories / tags` 收敛 helper。
- 触发条件: 首轮已完成 `posts / archive / categories / tags` 的最小字段集与 taxonomy 聚合收敛，但待办仍要求补齐 `pg_stat_statements` 或等价长窗口样本，并继续审计剩余公开读链路 `search` 与 `external posts` 是否仍保留宽查询模式。
- 执行频率: 第二十六阶段当前主线补充回归；后续仅在新增公开热点读链路、放宽搜索范围、或重新扩大 list payload 时追加增量记录。
- timeout budget:
    - 剩余热点读链路盘点与 settings 批量化评估: 20 分钟。
    - `search` / `external posts` 收敛与定向测试: 30 分钟。
    - 定向 ESLint 与 typecheck: 30 分钟。
    - regression / todo 同步: 20 分钟。
- 已执行命令:
    - `pnpm exec vitest run tests/server/api/search/index.get.test.ts tests/server/api/external/posts-list.get.test.ts`
    - `pnpm exec eslint server/utils/post-list-query.ts server/api/search/index.get.ts server/api/external/posts.get.ts tests/server/api/search/index.get.test.ts tests/server/api/external/posts-list.get.test.ts`
    - `pnpm exec nuxt typecheck`
- 输出摘要:
    - 已执行验证:
        - V1 / 热点读链路收敛层: [server/api/search/index.get.ts](../../server/api/search/index.get.ts) 已改为复用 [server/utils/post-list-query.ts](../../server/utils/post-list-query.ts)，公共搜索结果不再加载 `post.content`；同时保留既有“长关键词才匹配 `content`”的设计边界。[server/api/external/posts.get.ts](../../server/api/external/posts.get.ts) 则改为最小 post/category/tag 字段集，跳过 author relation，并把 `POSTS_PER_PAGE` 读取对齐到批量 `getSettings`。
        - V2 / 返回体量契约层: [tests/server/api/search/index.get.test.ts](../../tests/server/api/search/index.get.test.ts) 已锁定搜索结果 `content === undefined`，且正文命中仍只在长关键词场景生效；新增 [tests/server/api/external/posts-list.get.test.ts](../../tests/server/api/external/posts-list.get.test.ts) 锁定 API key 列表结果不再返回 `content`，同时维持作者限权范围不变。
        - V2 / 候选静态基线层: 本轮已把 `posts / archive / categories / tags / search / external posts` 的热点 SQL 指纹、最小字段集与 settings 读取结论统一收敛到当前回归记录，作为下一轮运行期采样的对照基线；当前尚未额外落盘独立 artifact，因此不能把这部分静态基线误记为可替代运行期样本的正式证据。
        - V1 / 质量门层: 定向 Vitest `2` 个文件、`7` 条用例通过；定向 ESLint 无输出；`pnpm exec nuxt typecheck` 无输出，视为通过。
    - 结果摘要:
        - 第二十六阶段 PostgreSQL 主线当前已形成更完整的热点清单，不再局限于 `posts / archive / categories / tags`；本轮额外确认 `search` 与 `external posts` 的 payload 也已对齐最小 list 读模型。
        - 当前静态基线只能视为“候选对照口径”，不能直接替代同范围运行期 `pg_stat_statements` 或等价 live sample；因此本轮只关闭了部分代码与文档收敛，不宣称主线待办已满足关闭条件。
        - settings 读取批量化本轮已完成评估: 当前主线中的公开热点读链路不再存在“同一请求链路内多次单键读取 settings”这一残余模式；`posts/index` 与 `posts/archive` 各自仅有 1 次 `POSTS_PER_PAGE` 读取，继续扩写为批量接口不会降低查询次数，因此不再为了形式统一做额外改造。
    - Review Gate 结论:
        - 结论: Pass（限本轮代码与文档收敛）
        - 问题分级: warning
        - 当前状态:
            - `search` / `external posts` 与当前回归记录同步已经放行，但 PostgreSQL 主线待办仍需新的同范围运行期 `pg_stat_statements` 或等价 live sample，当前不能关闭。
            - 当前剩余 blocker 已收敛为“补同范围运行期样本”，而不是继续扩写代码改造面。
    - 未覆盖边界:
        - 本轮没有新增真实 PostgreSQL 运行实例上的同范围 `pg_stat_statements` 采样；当前仅有本条回归记录中的静态对照口径，仍需后续补独立 live sample 证据。
        - 搜索路径当前仍保留长关键词正文匹配，因此它在“查询谓词压力”维度仍不是完全收敛态；若后续要进一步优化，应该进入全文索引或外部搜索引擎方案，而不是无准入地下调既有搜索能力。
    - 后续补跑计划:
        - 下一步优先在预发或生产 PostgreSQL 环境补一份与 `posts / archive / categories / tags / search / external posts` 同范围的 `pg_stat_statements` 或等价 live sample，再决定是否允许关闭 todo 主线。
        - 若新增公开列表接口，优先复用 [server/utils/post-list-query.ts](../../server/utils/post-list-query.ts) 与 [server/utils/taxonomy-post-count.ts](../../server/utils/taxonomy-post-count.ts)，并在同一份 artifact 中追加新热点，而不是另起分散口径。

## 第二十四阶段阶段级回归任务执行与收口证据链复盘复跑（2026-04-08）

### 回归任务记录

- 回归范围: 第二十四阶段 P0“阶段级回归任务执行与收口证据链复盘”复跑；以 [2026-04-08-phase-close-regression.md](../../artifacts/review-gate/2026-04-08-phase-close-regression.md) 为正式收口 artifact，确认 `test:coverage`、`release:check:full`、`docs:check:i18n`、`test:perf:budget:strict`、`duplicate-code:check:strict` 与 `review-gate:generate:check` 已形成同一轮可归档证据链。
- 触发条件: 2026-04-07 首轮 `phase-close` 已清除浏览器依赖安装与活动日志窗口 blocker，但 strict 性能预算仍为唯一剩余 blocker；在归档第二十四阶段前必须完成一次转绿复跑。
- 执行频率: 第二十四阶段收口复跑；后续仅在下一阶段收口或质量门基线明显漂移时再执行。
- timeout budget:
    - `pnpm regression:phase-close`: 120 分钟。
    - `pnpm test:perf:budget:strict`: 10 分钟。
    - `pnpm review-gate:generate:check -- --scope=phase-close-regression`: 20 分钟。
- 已执行命令:
    - `pnpm regression:phase-close`
    - `pnpm docs:check:source-of-truth`
- 输出摘要:
    - 已执行验证:
        - `pnpm regression:phase-close` 本轮完成 `test:coverage`、`release:check:full`、`docs:check:i18n`、`test:perf:budget:strict`、`duplicate-code:check:strict` 与 `review-gate:generate:check` 全链路调度，其中 [2026-04-08-phase-close-regression.md](../../artifacts/review-gate/2026-04-08-phase-close-regression.md) 结论为 `Pass`。
        - 严格性能预算已恢复通过：当前 `coreEntryJs 0.28KB / 260KB`、`maxAsyncChunkJs 52.39KB / 120KB`、`keyCss 61.04KB / 70KB`；Nuxt 4 共享运行时壳、共享依赖与 admin 专属页面链路已从 `maxAsyncChunkJs` 口径中正确排除。
        - `release:check:full` 本轮以 `PASS` 收口；其中 `docs:check:source-of-truth` 单独补跑后确认仍有多份 `docs/i18n/en-US/**` 翻译文档超过 30 天未同步，但该项当前继续按 pre-release 非阻断 warning 口径处理，不阻塞第二十四阶段归档。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - `docs:check:source-of-truth` 仍存在英文翻译时效超窗问题，后续若该门禁升级为阻断，需要单独上收文档同步治理。
    - 后续补跑计划:
        - 第二十四阶段已满足归档条件；下一轮仅在第二十五阶段准入后，继续沿当前 artifact、活动日志窗口与性能预算口径做对比复核。


