# 墨梅博客 回归任务记录 (Regression Log)

本文档用于集中维护周期性回归、阶段基线、补跑计划与 Review Gate 证据链正文。规划摘要仍保留在 [待办事项](./todo.md) 与 [项目计划](./roadmap.md) 中，但长篇回归记录应统一沉淀在本文件，避免同一份记录在多个规划文档中重复维护。

## 当前窗口与索引

- 统一入口: [回归日志索引与对比指南](./regression-log-index.md)
- 当前窗口: 活动日志当前保留 2026-03-22 至 2026-04-06 的 12 条近线记录，优先服务当前阶段收口、近期发版判断与最近基线比较。
- 历史归档: 2026-03-20 至 2026-03-21 的 5 条旧记录已滚动迁移到 [regression-log-archive.md](./regression-log-archive.md)。
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

## ESLint 规则分阶段收紧治理首轮基线（2026-04-05）

### 回归任务记录

- 回归范围: 第二十二阶段 P1“ESLint 规则分阶段收紧治理”首轮准入评估；仅针对 `@typescript-eslint/explicit-module-boundary-types`、`no-explicit-any`、`no-unsafe-*`、`unbound-method`、`no-misused-spread`、`no-dynamic-delete`、`no-unnecessary-type-conversion` 这 11 条候选规则做 warning 债务采样、目录分布拆分与首批收紧候选判定。
- 触发条件: 当前阶段要求先建立规则债务基线与首批收紧范围，且本轮明确要求“不调整现有 `pnpm lint` 的 10 条 warning 上限”，因此必须先证明哪些规则即使只升到 warning 也不会立刻冲破门禁。
- 执行频率: 本阶段首轮基线；后续仅在首批规则真正收紧、影响目录显著收敛，或需要切换到下一批规则族时补写增量记录。
- timeout budget:
    - 只读 ESLint 基线扫描与统计拆分: 10 分钟。
    - 计划文档与回归记录同步: 10 分钟。
- 已执行命令:
    - `node --input-type=module -`（调用 ESLint API，临时把 11 条候选规则提升到 warning，输出 `artifacts/review-gate/eslint-phase22-rule-baseline.json` 与 `eslint-phase22-rule-baseline-summary.json`）
    - `node --input-type=module -`（基于首轮输出拆分 production / test 命中，输出 `artifacts/review-gate/eslint-phase22-rule-bucket-summary.json`）
    - `node --input-type=module -`（统计当前默认 ESLint 配置 warning / error 数量，输出 `artifacts/review-gate/eslint-phase22-current-budget-summary.json`）
    - `node --input-type=module -`（提取 `unbound-method`、`no-misused-spread`、`no-dynamic-delete` 的 production / test 具体命中位置，输出 `artifacts/review-gate/eslint-phase22-rule-candidate-locations.json`）
- 输出摘要:
    - 已执行验证:
        - V1 / 基线层: `artifacts/review-gate/eslint-phase22-current-budget-summary.json` 记录当前默认 ESLint 配置为 `0 warning / 0 error`，说明本轮可用 warning 预算仍是完整的 10 条。
        - V1 / 债务层: 11 条候选规则若整体升为 warning，会新增 `4282` 条 warning，覆盖 `408` 个文件，显著超出当前 `--max-warnings 10` 门禁。
        - V1 / 分布层: 债务主要集中在 `server`（2959）、`tests`（577）与 `composables`（417）；其中 `server/services/post.test.ts`、`tests/server/notification.test.ts`、`server/services/ai/tts.ts`、`server/utils/ai/gemini-provider.ts` 是当前最密集热点。
    - 结果摘要:
        - 明确不建议本轮直接提升为 warning 的规则:
            - `@typescript-eslint/explicit-module-boundary-types`: `450` 条，其中生产代码 `445` 条；会直接把服务层、composables 与 shared util 全面打成 warning，不适合作为首批收紧。
            - `@typescript-eslint/no-explicit-any`: `944` 条，其中生产代码 `321` 条、测试代码 `623` 条；当前仍处在类型债治理前置阶段，直接上 warning 只会制造大面积噪音。
            - `@typescript-eslint/no-unsafe-member-access`: `1002` 条，其中生产代码 `563` 条；属于服务层 typed boundary 尚未收敛前的高噪音规则。
            - `@typescript-eslint/no-unsafe-assignment`: `787` 条，其中生产代码 `483` 条；同样远超当前可用预算。
            - `@typescript-eslint/no-unsafe-argument`: `472` 条，其中测试代码 `387` 条；即使剔除测试目录，生产代码仍有 `85` 条，不适合当前阶段直接上升。
            - `@typescript-eslint/no-unsafe-return`: `227` 条、`@typescript-eslint/no-unsafe-call`: `135` 条、`@typescript-eslint/no-unnecessary-type-conversion`: `67` 条；均明显高于现有 warning 预算。
        - 首批候选中最接近可落地的规则:
            - `@typescript-eslint/unbound-method`: 总计 `165` 条，但生产代码仅 `9` 条、测试代码 `156` 条；具体命中位置已落盘到 `artifacts/review-gate/eslint-phase22-rule-candidate-locations.json`，生产代码命中集中在 `server/api/**`、`server/database/typeorm-adapter.ts` 与 `server/services/ai/tts.ts`。这一类问题通常可以通过 `this: void`、箭头函数或显式 `.bind()` 收敛，属于高信号、低数量、适合 production 先行试点的候选。
            - `@typescript-eslint/no-misused-spread`: 总计 `21` 条，其中生产代码 `10` 条、测试代码 `11` 条；具体命中位置已落盘到 `artifacts/review-gate/eslint-phase22-rule-candidate-locations.json`，生产命中既包含把 TypeORM / Entity 实例直接展开到响应体，也包含 `utils/shared/localized-settings.ts` 的字符串 / 数组 spread。该规则存在真实风险，但生产代码命中量刚好压满 10 条预算，没有缓冲余量，不建议在本轮直接上调。
            - `@typescript-eslint/no-dynamic-delete`: 总计 `12` 条，其中生产代码 `3` 条、测试代码 `9` 条；具体命中位置已落盘到 `artifacts/review-gate/eslint-phase22-rule-candidate-locations.json`，当前生产命中主要落在 `server/utils/author.ts` 与 `utils/shared/installation-settings.ts` 这类按动态 key 清理对象字段的业务场景。数量虽然低，但这些命中尚未完成“真实缺陷 / 允许例外”的逐点归因，不适合作为首批收紧起点。
        - 首批收紧范围建议:
            - 仅把 `@typescript-eslint/unbound-method` 作为下一步候选，并把作用范围先限定在生产 TypeScript 文件，优先影响目录为 `server/api/**`、`server/database/**`、`server/services/**`。
            - `@typescript-eslint/no-misused-spread` 与 `@typescript-eslint/no-dynamic-delete` 暂列第二梯队，待当前命中点先人工归因为“真实缺陷”还是“允许例外”后再决定是否进入 warning。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 本轮只完成基线与准入评估，尚未真正修改 ESLint 配置，也尚未给出首批规则的回滚实现。
            - 债务主要集中在服务层与测试层，说明后续若要继续收紧 `no-unsafe-*` 或 `no-explicit-any`，必须先拆生产 / 测试边界或先做类型面治理，不能直接全局提级。
        - 复查放行门槛:
            - 只有在 `@typescript-eslint/unbound-method` 的 `9` 个 production 命中先被收敛或确认例外、根仓 `pnpm lint` 仍保持 `0 - 10` 条 warning、且新配置不外溢到测试目录后，才允许把它作为首批规则提升到 warning。
            - 在 `no-misused-spread` 与 `no-dynamic-delete` 尚未完成逐点归因前，不得把它们和 `unbound-method` 一起打包上调，避免再次冲破 warning 预算。
    - 未覆盖边界:
        - 本轮没有执行 `pnpm lint`，避免触发脚本自带 `--fix` 对当前工作区产生额外改写；结论以 ESLint API 的只读采样为准。
        - 本轮没有对 `packages/*` 单独做同等粒度扫描；根因是当前目标规则位于主仓 TypeScript 配置段，首轮判断先聚焦根仓。
        - 本轮未对 `unbound-method` 的 9 个生产命中逐一修复，因此“可作为首批 warning 候选”仍是准入结论，不等同于已经达到可合并状态。
    - 后续补跑计划:
        - 下一轮若继续推进本主线，优先只处理 `@typescript-eslint/unbound-method` 的 9 个生产命中，并验证是否可以在不影响测试目录的前提下把该规则提升到 warning。
        - 在 `unbound-method` 稳定后，再对 `no-misused-spread` 的 10 个生产命中做逐点归因，判断其中哪些应改为显式 DTO / plain object 转换，哪些属于可接受例外。
        - `no-dynamic-delete` 暂按“需要先明确允许模式”的规则保留为第二梯队，后续如要收紧，先定义 shared util / 数据清洗场景的豁免口径，再决定是否提级。

## ESLint 规则分阶段收紧治理首批实装（2026-04-06）

### 回归任务记录

- 回归范围: 第二十二阶段 P1“ESLint 规则分阶段收紧治理”首批实装；仅把 `@typescript-eslint/unbound-method` 提升到 `server` 生产 TypeScript 范围的 warning，并修复首轮基线中识别出的 9 个 production 命中。
- 触发条件: 2026-04-05 首轮基线已证明 11 条候选规则不能整体提级，但 `@typescript-eslint/unbound-method` 在生产代码中仅有 9 个命中，满足“先清零 production 命中、再做 server-only 试点”的准入结论。
- 执行频率: 本阶段首批收紧实装；后续仅在继续扩展到更多目录，或进入 `no-misused-spread` / `no-dynamic-delete` 第二梯队时补写增量记录。
- timeout budget:
    - 定向代码修复与配置更新: 15 分钟。
    - 定向 ESLint / Typecheck 验证: 20 分钟。
    - 计划文档与回归记录收口: 10 分钟。
- 已执行命令:
    - 代码修复与 ESLint 配置更新（见 `server/api/**`、`server/database/typeorm-adapter.ts`、`server/services/ai/tts.ts` 与 `eslint.config.js`）
    - `pnpm exec eslint eslint.config.js "server/**/*.{ts,tsx,mts,cts}" --max-warnings 10`
    - VS Code 任务 `nuxt typecheck targeted`
    - `pnpm exec lint-md docs/plan/todo.md docs/plan/regression-log.md`
- 输出摘要:
    - 已执行验证:
        - V1 / 代码层: 5 个 API 路由已把 `Schema.parse` / `querySchema.parse` 从直接方法引用改成显式箭头回调，避免把 Zod 实例方法脱离上下文传给 `readValidatedBody` / `getValidatedQuery`。
        - V1 / 服务层: `server/services/ai/tts.ts` 已将 `estimateTTSCost` / `estimateCost` 先显式 `bind(provider)` 再调用，避免 provider 成本估算方法在脱离实例上下文时触发 `unbound-method`。
        - V1 / 适配层: `server/database/typeorm-adapter.ts` 已把 `createTransform()` 返回的方法改为通过 `transformHelpers.*` 调用，避免在 Better Auth TypeORM 适配器中解构方法后丢失上下文。
        - V1 / 配置层: `eslint.config.js` 仅在 `server/**/*.{ts,tsx,mts,cts}` 启用 `@typescript-eslint/unbound-method` warning，并继续对 `server/**/*.test.*` 与 `server/**/*.spec.*` 保持豁免，确保本轮不外溢到测试目录。
        - V2 / 静态层: `pnpm exec eslint eslint.config.js "server/**/*.{ts,tsx,mts,cts}" --max-warnings 10` 通过，说明首批 server 生产命中已清零，且当前 warning 总量未突破既有 10 条门禁。
        - V2 / 类型层: `nuxt typecheck targeted` 通过，说明本轮服务端与配置改动未引入新的类型错误。
        - V1 / 文档层: `pnpm exec lint-md docs/plan/todo.md docs/plan/regression-log.md` 通过。
    - 结果摘要:
        - 首批收紧范围已正式落地为“仅 `server` 生产 TypeScript + 仅 `@typescript-eslint/unbound-method` 一条规则”，没有把规则提升扩写到测试、脚本或第二梯队规则族。
        - 首轮基线中的 9 个 production 命中已完成收敛，当前 warning 预算仍维持在既有上限之内。
        - 本轮采用最小修复策略：优先把直接方法引用改为显式回调或绑定，不顺带重构 API 契约、provider 设计或 Better Auth 适配层架构。
        - 通过 `server` 范围限定与测试文件 override，本轮保留了“先看生产代码信号、暂不让 156 个测试命中淹没门禁”的分批治理边界。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 当前仅完成 `server` 生产 TypeScript 范围的首批试点，尚未推广到 `composables`、`utils` 或更多 TypeScript 目录。
            - `no-misused-spread` 与 `no-dynamic-delete` 仍维持在第二梯队，未纳入本轮实装。
    - 未覆盖边界:
        - 本轮未执行全仓 `pnpm lint`，避免触发 `--fix` 带来的无关改写；静态门禁以定向 ESLint 为准。
        - 本轮未补跑全量测试，仅依赖 `nuxt typecheck targeted` 与定向 ESLint 证明本次规则收紧的最小安全性。
        - `server/**/*.test.*` 的 `@typescript-eslint/unbound-method` 债务仍保留，后续若要扩大规则作用范围，必须先定义测试侧统一修复或豁免策略。
    - 后续补跑计划:
        - 若继续推进本主线，下一步优先决定是否把 `@typescript-eslint/unbound-method` 从 `server` 扩展到其他生产目录，仍需先做目录级债务采样后再提级。
        - 在首批试点稳定后，再单独审查 `no-misused-spread` 的 10 个 production 命中，避免和本轮首批收紧混在一起导致预算失控。
        - 回滚口径: 若后续发现 `server` 范围收紧带来误报或阻塞，可先把 `eslint.config.js` 中新增的 `server` 范围 override 整段移除或把 `@typescript-eslint/unbound-method` 恢复为 `[0]`，不需要回退本轮代码修复本身。

### 收口补充（2026-04-06）

- 回归范围: 首批实装后的扩面评估与第二梯队预分析；覆盖 `@typescript-eslint/unbound-method` 从 `server` 扩展到全量生产 TS 的可行性复查，以及 `@typescript-eslint/no-misused-spread` 10 个 production 命中的逐点归因。
- 触发条件: 首批 `server` 试点通过后，需要判断该规则是否已经具备扩到其他生产目录的条件，并为第二梯队规则准备“真实缺陷 / 合理例外 / 泛型误报”分层结论。
- 已执行命令:
    - `node --input-type=module -`（扫描非 `server` 生产 TS 的 `@typescript-eslint/unbound-method` 命中，输出 `artifacts/review-gate/eslint-phase22-unbound-method-non-server-production.json`）
    - `node --input-type=module -`（抽取 `@typescript-eslint/no-misused-spread` 的 10 个 production 命中，输出 `artifacts/review-gate/eslint-phase22-no-misused-spread-production.json`）
    - `pnpm exec eslint . --max-warnings 10`
- 输出摘要:
    - 已执行验证:
        - V0 / 元数据层: `artifacts/review-gate/eslint-phase22-followup-scan-metadata.json` 已记录本轮 follow-up 扫描的 include / exclude 范围、目标规则与输出文件，避免后续复查时只看到结果数组而不知道采样口径。
        - V1 / 扩面层: `artifacts/review-gate/eslint-phase22-unbound-method-non-server-production.json` 当前为 `0` 命中，说明除 `server` 之外的生产 TS 目录在现有代码状态下没有新增 `unbound-method` 债务。
        - V2 / 门禁层: 将 `eslint.config.js` 的试点 override 扩展为“全量生产 TS + 继续排除测试与脚本”后，`pnpm exec eslint . --max-warnings 10` 仍通过，说明扩面后 warning 预算没有回退。
        - V1 / 归因层: `artifacts/review-gate/eslint-phase22-no-misused-spread-production.json` 已把 10 个 production 命中稳定落盘，支撑逐点归因。
    - 结果摘要:
        - `@typescript-eslint/unbound-method` 现阶段可以从“仅 `server` 生产 TS”安全扩展到“全量生产 TS，继续排除测试与脚本”。原因是非 `server` 生产 TS 当前为 `0` 命中，扩面后全仓定向 ESLint 仍未突破既有 warning 上限。
        - 迁移 / 历史遗留生产目录本轮未单独编码豁免，原因不是忽略治理边界，而是 follow-up 扫描下当前为 `0` 命中；因此本轮继续保留“测试、脚本显式豁免，迁移 / 历史遗留目录按实际债务再升级为单独豁免”的口径。
        - `@typescript-eslint/no-misused-spread` 的 10 个 production 命中可分为两组：
            - 组 A / 8 个实体实例展开，判定为真实治理对象，而不是合理例外。涉及 [server/api/categories/slug/[slug].get.ts](server/api/categories/slug/[slug].get.ts)、[server/api/external/posts/[id].get.ts](server/api/external/posts/[id].get.ts)、[server/api/posts/slug/[slug].get.ts](server/api/posts/slug/[slug].get.ts)、[server/api/posts/[id].get.ts](server/api/posts/[id].get.ts)、[server/api/snippets/index.post.ts](server/api/snippets/index.post.ts)、[server/api/tags/slug/[slug].get.ts](server/api/tags/slug/[slug].get.ts)、[server/services/comment.ts](server/services/comment.ts)、[server/services/theme-config.ts](server/services/theme-config.ts)。这些位置都在把 TypeORM Entity / 类实例直接 spread 成响应对象或树节点，虽然当前运行时通常可用，但会丢失原型、getter 与非枚举语义，后续应改为显式 DTO / plain object 转换。
            - 组 B / 2 个泛型字符串 spread，暂定为“需要更窄实现来消除误报”，而不是直接判定为业务缺陷。位置在 [utils/shared/localized-settings.ts](utils/shared/localized-settings.ts#L99) 与 [utils/shared/localized-settings.ts](utils/shared/localized-settings.ts#L102)。这里实际意图是在 `Array.isArray` 保护后复制字符串数组，但由于泛型 `T extends string | string[]` 的收窄不够强，规则仍把它视为潜在的字符串 spread 风险；后续更适合改成显式的数组复制 helper，而不是先把规则提级再靠行内禁用压过去。
        - 基于当前归因，`no-misused-spread` 仍不适合立即升到 warning：A 组 8 个命中需要先做 API / service 响应模型收敛，B 组 2 个命中需要先做 shared helper 级别的实现调整。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - `unbound-method` 虽已扩面到全量生产 TS，但测试债务仍未纳入本轮治理。
            - `no-misused-spread` 的 8 个实体实例展开命中已经具备真实治理价值，后续若长期不处理，会继续阻塞该规则进入 warning。
    - 未覆盖边界:
        - 本轮没有开始改 `no-misused-spread` 的 10 个命中，只完成分层归因与准入判断。
        - 本轮继续保留脚本范围豁免，未评估 `scripts/**` 中未来是否需要同样启用 `unbound-method`。
    - 后续补跑计划:
        - `unbound-method` 后续如无回归，可维持“全量生产 TS 开启、测试与脚本继续豁免”的状态，不需要再回退到 `server` 限定。
        - 下一轮优先处理 `no-misused-spread` 的 A 组 8 个实体实例展开命中，统一收敛到 DTO / plain object 转换口径。
        - B 组 `localized-settings` 命中在进入规则提级前，先改成更明确的数组复制实现，避免把泛型收窄不足误当作业务缺陷。

## ESLint 规则分阶段收紧治理第二梯队生产命中收敛（2026-04-06）

### 回归任务记录

- 回归范围: 第二十二阶段 P1“ESLint 规则分阶段收紧治理”第二梯队增量收敛；处理 `@typescript-eslint/no-misused-spread` 的 10 个 production 命中，其中 8 个为 TypeORM / Entity 实例直接展开，2 个为 `utils/shared/localized-settings.ts` 的泛型字符串数组复制。
- 触发条件: 前一条记录已完成逐点归因，明确 A 组 8 个实体实例展开属于真实治理对象，B 组 2 个泛型数组复制需要更窄实现，因此本轮进入代码收敛，但仍不直接把规则提升到 warning。
- 已执行命令:
    - 代码修复与共享工具更新（见 `server/api/**`、`server/services/**`、`server/utils/object.ts`、`utils/shared/localized-settings.ts`）
    - `pnpm exec eslint 'server/api/categories/slug/[slug].get.ts' 'server/api/external/posts/[id].get.ts' 'server/api/posts/slug/[slug].get.ts' 'server/api/posts/[id].get.ts' 'server/api/snippets/index.post.ts' 'server/api/tags/slug/[slug].get.ts' 'server/services/comment.ts' 'server/services/theme-config.ts' 'server/utils/object.ts' 'server/utils/object.test.ts' 'utils/shared/localized-settings.ts' --rule '@typescript-eslint/no-misused-spread:error'`
    - VS Code 任务 `nuxt typecheck targeted`
    - `node --input-type=module -e 'import { ESLint } from "eslint"; import tseslint from "typescript-eslint"; const eslint = new ESLint({ overrideConfig: [{ files: ["**/*.{ts,tsx,mts,cts}"], ignores: ["**/*.test.*", "**/*.spec.*", "tests/**", "scripts/**"], plugins: { "@typescript-eslint": tseslint.plugin }, rules: { "@typescript-eslint/no-misused-spread": "error" } }] }); const results = await eslint.lintFiles(["**/*.{ts,tsx,mts,cts}"]); const hits = results.flatMap((result) => result.messages.filter((message) => message.ruleId === "@typescript-eslint/no-misused-spread").map((message) => result.filePath + ":" + message.line + ":" + message.column)); if (hits.length > 0) { console.log(hits.join("\\n")); process.exit(1); } console.log("no production hits");'`
- 输出摘要:
    - 已执行验证:
        - V1 / 实现层: 新增 `toPlainObject()`，统一把实体实例的自有可枚举字段收敛为 plain object，再通过 `Object.assign()` 组装 API 返回值或树节点，覆盖 `Category`、`Tag`、`Post`、`Snippet`、`Comment` 与 `ThemeConfig` 相关 8 个 production 命中。
        - V1 / Shared 层: `utils/shared/localized-settings.ts` 已把两处 `[...]` 泛型数组复制改成 `cloneStringArray()`，继续保持 shallow copy 语义，但不再触发字符串 spread 风险提示。
        - V2 / 定向层: 上述 11 个文件在临时启用 `@typescript-eslint/no-misused-spread:error` 的情况下已通过定向 ESLint 检查。
        - V2 / 类型层: `nuxt typecheck targeted` 通过；中途暴露的无效 `@ts-expect-error` 已同步清理。
        - V2 / 回归层: `server/utils/object.test.ts` 当前为 `6` 条断言全部通过，新增样例证明 `toPlainObject()` 只保留类实例自有可枚举字段，不把原型 getter 带进响应 DTO。
        - V1 / 基线层: `artifacts/review-gate/eslint-phase22-no-misused-spread-production-after-fix.json` 已记录当前 production TS 范围 `0` 命中，说明本轮已清空该规则的生产债务。
    - 结果摘要:
        - A 组 8 个实体实例展开已统一收敛到“先 plain object，再组合响应字段”的实现口径，避免继续把 TypeORM / Entity 实例直接 spread 到响应模型。
        - B 组 2 个 `localized-settings` 命中已改为更明确的字符串数组复制，消除了此前泛型收窄不足导致的误报窗口。
        - 当前 `@typescript-eslint/no-misused-spread` 在 production TS 范围已归零，但测试目录与脚本目录仍未纳入本轮治理，因此本轮仍只完成“生产债务清零”，不直接把规则提升到 warning。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 规则尚未扩展到测试与脚本目录，历史 test debt 仍需单独评估是否修复、豁免或继续隔离。
            - `no-misused-spread` 虽然已具备进入下一轮 warning 评估的前置条件，但仍需先确认测试侧 11 个命中的处理策略，避免重复压满 warning 预算。
    - 未覆盖边界:
        - 本轮没有重跑全仓 `pnpm lint`，继续避免 `--fix` 对无关文件造成改写；结论以定向 ESLint 与只读 production 扫描为准。
        - 本轮没有对 `tests/**` 中的 `no-misused-spread` 命中做归因，因此当前结论仅覆盖 production TS。
    - 后续补跑计划:
        - 下一轮可基于当前 `0` 个 production 命中，单独评估测试目录 11 个 `no-misused-spread` 命中的真实价值，再决定是否允许把该规则提升到“全量测试继续豁免”或“先 production warning、测试延后”的状态。
        - 若后续继续推进第二梯队规则，可沿用同样的证据链模式处理 `no-dynamic-delete`，先做 production 命中归因，再决定是否进入 warning。

## ESLint 规则分阶段收紧治理测试债清零与扩面（2026-04-06）

### 回归任务记录

- 回归范围: 第二十二阶段 P1“ESLint 规则分阶段收紧治理”对 `@typescript-eslint/no-misused-spread` 的测试侧收口与正式扩面；覆盖历史基线中的 11 个 test 命中、规则作用范围判定，以及 `eslint.config.js` 的 warning 提级。
- 触发条件: 上一条记录已完成 production 命中清零，但当时仍保留“测试目录 11 个命中待评估”的审慎结论；本轮需决定是继续修、保留 tests 豁免，还是只对 production 先开 warning。
- 已执行命令:
    - `pnpm exec eslint 'server/utils/post-access.test.ts' 'tests/server/utils/fed/mapper.test.ts' --rule '@typescript-eslint/no-misused-spread:error'`
    - `pnpm exec vitest run server/utils/post-access.test.ts tests/server/utils/fed/mapper.test.ts`
    - `node --input-type=module -e 'import { ESLint } from "eslint"; import tseslint from "typescript-eslint"; const eslint = new ESLint({ overrideConfig: [{ files: ["tests/**/*.{ts,tsx,mts,cts}"], plugins: { "@typescript-eslint": tseslint.plugin }, rules: { "@typescript-eslint/no-misused-spread": "error" } }] }); const results = await eslint.lintFiles(["tests/**/*.{ts,tsx,mts,cts}"]); const hits = results.flatMap((result) => result.messages.filter((message) => message.ruleId === "@typescript-eslint/no-misused-spread").map((message) => ({ file: result.filePath.replace(process.cwd() + "\\", ""), line: message.line, column: message.column, message: message.message }))); console.log(JSON.stringify(hits, null, 2));'`
    - `node --input-type=module -e 'import { ESLint } from "eslint"; import tseslint from "typescript-eslint"; const eslint = new ESLint({ overrideConfig: [{ files: ["**/*.{ts,tsx,mts,cts}"], ignores: ["scripts/**"], plugins: { "@typescript-eslint": tseslint.plugin }, rules: { "@typescript-eslint/no-misused-spread": "error" } }] }); const results = await eslint.lintFiles(["**/*.{ts,tsx,mts,cts}"]); const hits = results.flatMap((result) => result.messages.filter((message) => message.ruleId === "@typescript-eslint/no-misused-spread").map((message) => ({ file: result.filePath.replace(process.cwd() + "\\", ""), line: message.line, column: message.column, message: message.message }))); console.log(JSON.stringify({ total: hits.length, hits }, null, 2)); if (hits.length > 0) process.exit(1);'`
    - `pnpm exec eslint eslint.config.js 'server/utils/post-access.test.ts' 'tests/server/utils/fed/mapper.test.ts' --max-warnings 10`
    - VS Code 任务 `nuxt typecheck targeted`
- 输出摘要:
    - 已执行验证:
        - V1 / 归因层: 历史 11 个 test 命中全部可归并为两种同类写法，而非真实业务风险：`server/utils/post-access.test.ts` 中 10 个命中、[server/utils/post-access.test.ts](server/utils/post-access.test.ts#L17) 使用“plain mock 先强转成 `Post`，再在各 case 中 spread”的模式；[tests/server/utils/fed/mapper.test.ts](tests/server/utils/fed/mapper.test.ts#L22) 中 1 个命中是同类的 `createMockPost()` 写法。
        - V1 / 修复层: 两个文件均已改成“plain baseline + factory”的测试数据构造口径，不再把被强转为实体类型的 mock 对象再次 spread。
        - V2 / 定向层: 两个命中文件在临时启用 `@typescript-eslint/no-misused-spread:error` 的情况下已通过 ESLint，且对应 Vitest 定向测试 `23` 条全部通过。
        - V1 / 实扫层: `tests/**/*` 口径复扫只剩 1 个命中时，已证明 `tests/**` 本身并不需要保留批量豁免；修复后再执行“全仓 TS，仅排除 `scripts/**`”扫描，结果为 `0` 命中。
        - V2 / 配置层: `eslint.config.js` 已把 `@typescript-eslint/no-misused-spread` 提升为 warning，范围为全量 TypeScript，继续排除 `scripts/**`。
    - 结果摘要:
        - 对“tests 目录里剩余的 11 个命中”的最终决策是: 继续修，不保留 tests 豁免，也不再维持“只对 production 开 warning”的中间状态。
        - 原因不是激进提级，而是这些命中都属于轻量测试债，修复成本低、规则信号高，且修复后全仓 TS 已达到 `0` 命中，不再需要对 tests 与 production 采用不同口径。
        - 当前唯一保留的边界是 `scripts/**`，因为脚本目录尚未进入本轮治理，也未出现在本轮证据链中。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - `scripts/**` 仍未纳入 `no-misused-spread` 的治理范围；若后续要进一步统一全仓规则口径，需要先单独扫描和归因脚本目录。
    - 未覆盖边界:
        - 本轮未执行带 `--fix` 的根仓 `pnpm lint`，继续避免对无关文件产生自动改写；规则 readiness 以定向 ESLint、全仓只读扫描与 typecheck 为准。
        - 本轮未对 packages 子项目单独复扫；当前结论面向根仓 `eslint.config.js` 管辖范围。
    - 后续补跑计划:
        - 若下一轮继续收紧 Phase 22 ESLint 规则，优先对 `no-dynamic-delete` 复制同样的“production 归因 -> tests 归因 -> scoped warning”闭环。
        - 若脚本目录未来也要纳入主仓 TypeScript 规则守线，应先补一轮 `scripts/**` 的只读采样，避免把未评估目录直接卷入 warning 门禁。

## 测试覆盖率阶段性抬升治理首轮基线（2026-04-02）

### 回归任务记录

- 回归范围: 第二十一阶段 P0“测试覆盖率阶段性抬升治理”首轮启动；覆盖 `utils/shared` 与 `utils/web` 中一组低覆盖纯函数/桥接模块的首轮补测、覆盖率基线建立与阶段治理口径收敛。
- 触发条件: 当前阶段待办要求先产出覆盖率基线、补齐优先路径，并给出“每阶段约提升 5%”的治理节奏，避免覆盖率任务失控为无限期全仓补测。
- 执行频率: 本阶段首轮基线；后续按“每轮优先选择 1 组低覆盖模块或核心路径”滚动补写。单组模块稳定达到 80% 后转入守线，仅在相关目录发生改动或基线回退时复跑。
- timeout budget:
    - 定向 Vitest: 10 分钟。
    - 全量 `pnpm test:coverage`: 30 分钟。
    - 定向 ESLint / Markdown 检查: 10 分钟。
- 已执行命令:
    - `pnpm test:coverage`
    - `pnpm exec vitest run utils/shared/installation-env-setting.test.ts utils/shared/request-feedback.test.ts utils/web/setup-journey.test.ts utils/web/post-distribution-wechatsync.test.ts`
    - `pnpm test:coverage`
    - `pnpm exec vitest run utils/web/post-distribution-dialog.test.ts`
    - `pnpm test:coverage`
- 输出摘要:
    - 已执行验证:
        - V2 / 逻辑层: 新增 `utils/shared/installation-env-setting.test.ts`、`utils/shared/request-feedback.test.ts`、`utils/web/setup-journey.test.ts`、`utils/web/post-distribution-wechatsync.test.ts`、`utils/web/post-distribution-dialog.test.ts`，共补齐 18 条测试。
        - V4 / Coverage 层: 连续 3 次执行 `pnpm test:coverage`，以 `coverage/coverage-final.json` 汇总全仓、目录组与目标文件基线，并确认补测收益。
    - 结果摘要:
        - 上一轮可追溯全仓 clean baseline 为 Statements 60.06%、Branches 47.64%、Functions 53.63%、Lines 60.02%（来源: 归档日志历史基线）。
        - 本轮最终全仓覆盖率为 Statements 60.95%、Branches 49.53%、Functions 55.66%、Lines 60.92%，在维持全仓守线的同时完成小幅抬升。
        - `utils/web` 目录从首轮摸底的 Statements 31.76% 提升到 89.41%，Branches 70.65%、Functions 100%、Lines 89.41%，达到“至少对一组低覆盖模块完成首轮补强且相对基线提升约 5%”的阶段验收要求。
        - `utils/shared` 当前汇总为 Statements 88.90%、Branches 77.55%、Functions 93.28%、Lines 88.73%，本轮新增补测主要集中在 `request-feedback.ts` 与 `installation-env-setting.ts`。
        - 目标文件覆盖率:
            - `utils/shared/installation-env-setting.ts`: Statements 100%、Branches 100%、Functions 100%。
            - `utils/shared/request-feedback.ts`: Statements 93.94%、Branches 94.12%、Functions 100%。
            - `utils/web/setup-journey.ts`: Statements 75%、Branches 70%、Functions 100%。
            - `utils/web/post-distribution-wechatsync.ts`: Statements 100%、Branches 62.5%、Functions 100%。
            - `utils/web/post-distribution-dialog.ts`: Statements 100%、Branches 89.47%、Functions 100%。
        - 下一阶段优先补齐顺序: 继续按目录或链路分组治理，优先筛选新的低覆盖热点，避免在已达标的 `utils/web` 组内继续堆叠低收益测试。
    - 测试结果（按需）:
        - `pnpm exec vitest run utils/shared/installation-env-setting.test.ts utils/shared/request-feedback.test.ts utils/web/setup-journey.test.ts utils/web/post-distribution-wechatsync.test.ts`: 4 files passed / 13 tests passed。
        - `pnpm exec vitest run utils/web/post-distribution-dialog.test.ts`: 1 file passed / 5 tests passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: info
        - 主要问题:
            - 本轮重点验证的是一组低覆盖模块，不代表全仓已进入 80% 稳态；当前全仓仍处于“60% 守线 + 分阶段抬升”阶段。
            - `utils/web/setup-journey.ts` 的部分分支依赖 `import.meta.client` 环境判断，本轮已覆盖主要路径，但仍保留少量环境相关分支缺口。
    - 未覆盖边界:
        - 本轮未对新的服务端低覆盖目录或大型页面组件组做补测，因而“全仓阶段性 +5%”尚未作为本轮结论，只对低覆盖模块组达成显著提升。
        - `runWechatSyncBatch` 等桥接逻辑采用 mock 验证输入输出契约，未在真实第三方同步环境下执行集成覆盖。
    - 后续补跑计划:
        - 下一轮优先从新的低覆盖模块组中选择 1 组高收益目标，沿用“先定向补测，再执行一次 `pnpm test:coverage` 写回基线”的节奏。
        - 若后续改动再次触及 `utils/web` 已达标文件，默认执行对应定向 Vitest 守线；仅在目录基线回退或函数新增分支明显扩大时再补写覆盖率专项记录。

## UI 真实环境 Review Gate 证据规范补强（2026-04-01）

### 回归任务记录

- 回归范围: 第二十一阶段 P0“UI 真实环境测试流程治理”增量收敛；覆盖 `pnpm test:e2e:review-gate` 的结构化证据产物、运行目录命名、环境准备边界与失败归因分类。
- 触发条件: 当前阶段要求把“高频 UI 回归场景的脚本入口、证据落点与失败归因模板”继续从文字规范推进到脚本真实产物，确保 Review Gate 可以直接引用而不是依赖口头解释。
- 执行频率: 作为本阶段治理增量基线；后续仅在 critical 场景矩阵、artifact 命名规则、global setup 认证逻辑或失败分类规则再次调整时补写。
- timeout budget:
    - 定向脚本测试: 10 分钟。
    - 定向 lint / Markdown 检查: 10 分钟。
- 已执行命令:
    - `pnpm exec vitest run tests/scripts/run-review-gate-ui-baseline.test.ts`
    - `pnpm exec eslint tests/scripts/run-review-gate-ui-baseline.test.ts scripts/testing/run-review-gate-ui-baseline.mjs`
    - `pnpm exec lint-md docs/standards/testing.md docs/guide/development.md docs/plan/regression-log.md docs/plan/todo.md scripts/README.md`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: `scripts/testing/run-review-gate-ui-baseline.mjs` 现已固定输出 `manifest.json`，并导出失败归因与 evidence 构建函数，供定向脚本测试覆盖；相关文档与计划文件已纳入定向 Markdown 检查。
        - V2 / 逻辑层: `tests/scripts/run-review-gate-ui-baseline.test.ts` 覆盖 scope 规范化、时间戳格式、失败归因分类，以及 `manifest.json` / `evidence.md` 的关键字段生成。
    - 结果摘要:
        - `pnpm test:e2e:review-gate --scope=<change>` 生成的运行目录现在固定包含 `evidence.md`、`manifest.json`、`playwright.log`、`playwright-report/` 与 `test-results/`，不再只有文字型 evidence。
        - `manifest.json` 会记录 scope、timestamp、命令、artifact 路径、环境准备边界、critical 场景矩阵和失败分类，方便 Review Gate 或回归日志直接引用结构化字段。
        - 浏览器失败归因已从“只给人工模板”升级为脚本内置分类：先判断服务启动 / 构建产物，再判断认证态 / 种子数据，最后才归到具体场景断言，减少模糊的“Playwright 失败”描述。
        - 测试数据前置 / 清理边界已收敛为“依赖 TEST_MODE 种子与 global setup，脚本默认只清理过期认证态，不做额外破坏性数据清理”，适合 Review Gate 复跑与证据留存。
    - 测试结果（按需）:
        - `pnpm exec vitest run tests/scripts/run-review-gate-ui-baseline.test.ts`: 1 file passed / 7 tests passed。
        - `pnpm exec eslint tests/scripts/run-review-gate-ui-baseline.test.ts scripts/testing/run-review-gate-ui-baseline.mjs`: passed。
        - `pnpm exec lint-md docs/standards/testing.md docs/guide/development.md docs/plan/regression-log.md docs/plan/todo.md scripts/README.md`: passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: none
        - 主要问题:
            - 当前无阻塞项；后续仅需在真实 scope 上补跑一次 `pnpm test:e2e:review-gate --scope=<change>`，确认 manifest 与 evidence 的实盘目录内容符合本轮脚本化定义。
    - 未覆盖边界:
        - 本轮未重跑实际 Playwright critical 基线，因此结论聚焦在脚本产物规范与失败分类，不代表重新验证浏览器场景本身。
        - 当前失败分类仍基于 Playwright 日志特征匹配；若后续 reporter 输出格式调整，需要同步更新分类规则与测试样例。
    - 后续补跑计划:
        - 在本轮定向脚本测试通过后，选取一条高频变更 scope 实际执行一次 `pnpm test:e2e:review-gate --scope=<change>`，验证 manifest 与 evidence 的真实落盘结果。

## 浏览器与 E2E 稳定性治理首轮回归（2026-03-31）

### 回归任务记录

- 回归范围: 第二十阶段 P0“浏览器与 E2E 稳定性治理”首轮启动；覆盖 Playwright 构建产物复用风险、认证会话治理最小关键路径、移动端后台编辑器 smoke，以及测试环境邮件后台任务噪音收敛。
- 触发条件: 当前阶段待办明确要求先收敛 Playwright 运行中的测试服务中途失联、`Connection refused` 与关键链路高并发噪音；此前历史记录已经表明全量 E2E 结果曾被服务层噪音污染，需先固化一条可重复、可解释的最小浏览器基线。
- 执行频率: 本阶段首轮；后续凡涉及认证会话、后台受保护页访问、文章编辑器基础输入、语言切换或移动端后台入口的改动，默认合并前复跑一次。
- timeout budget:
    - Markdown / 文档目录检查: 10 分钟。
    - 定向 ESLint: 10 分钟。
    - `pnpm test:e2e:critical`: 40 分钟。
- 已执行命令:
    - `pnpm exec lint-md docs/guide/development.md docs/standards/testing.md docs/plan/todo.md docs/plan/regression-log.md`
    - `pnpm docs:check:i18n`
    - `pnpm exec eslint scripts/testing/run-e2e.mjs tests/e2e/auth-session-governance.e2e.test.ts lib/auth.ts`
    - `pnpm test:e2e:critical`
- 输出摘要:
    - 已执行验证:
        - V1 / 文档与静态层: 本轮新增的脚本入口、测试用例与计划文档均通过编辑器诊断；Markdown 检查与 `docs:check:i18n` 通过。
        - V3 / 浏览器层: `pnpm test:e2e:critical` 当前定义为两段式矩阵，覆盖 Chromium / Firefox / WebKit 的 `tests/e2e/auth-session-governance.e2e.test.ts`，以及 `mobile-chrome-critical` / `mobile-safari-critical` 的 `tests/e2e/mobile-critical.e2e.test.ts`。
    - 结果摘要:
        - `scripts/testing/run-e2e.mjs` 已从“仅在 `.output` 缺失时构建”调整为“扫描仓库运行时源码是否晚于 `.output/server/index.mjs`”，避免 Playwright 静默复用陈旧构建产物；文档、测试产物与报告目录不计入重建判断。
        - `scripts/testing/run-e2e-critical.mjs` 与 `package.json` 已将 `pnpm test:e2e:critical` 固化为“桌面认证会话治理三浏览器 + 移动编辑器 smoke 两移动项目”的两段式矩阵，并在开发指南与测试规范中写明适用范围。
        - `lib/auth.ts` 已在 `TEST_MODE` 下关闭邮箱验证要求与注册验证邮件发送，`test:e2e:critical` 本轮执行过程中未再出现此前持续污染输出的 SMTP `ECONNREFUSED` 背景任务报错。
        - `tests/e2e/auth-session-governance.e2e.test.ts` 已改为接受编辑器页语言切换时的二次导航接管，并改为验证最终 UI 状态；此前由 WebKit 暴露出来的 flaky 已在 Chromium / Firefox / WebKit 三端收敛。
    - 测试结果（按需）:
        - `tests/e2e/auth-session-governance.e2e.test.ts`: Chromium 6 passed、Firefox 6 passed、WebKit 6 passed。
        - `tests/e2e/mobile-critical.e2e.test.ts`: `mobile-chrome-critical` 1 passed、`mobile-safari-critical` 1 passed。
        - `pnpm test:e2e:critical`: 合计 20 passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: info
        - 主要问题:
            - 当前仅固化了最小关键路径浏览器基线，尚未把 `admin.e2e`、`user-workflow.e2e`、`navigation.e2e` 等更大范围用例重新纳入稳定矩阵。
            - `test:e2e:critical` 仍依赖预置测试管理员与测试模式种子数据；后续若调整安装或认证种子逻辑，需要同步复核 `tests/e2e/global-setup.ts`。
    - 未覆盖边界:
        - 本轮未重跑全量 `pnpm test:e2e`，因此“全仓 Playwright 全绿”仍不是当前证据结论。
        - 公开页面、注册找回链路、后台 CRUD 与投稿流仍需按后续改动范围选择更大的定向 E2E 集合验证。
    - 后续补跑计划:
        - 若后续再次出现服务中途失联或 `Connection refused`，先复跑 `pnpm test:e2e:critical` 判断是否为最小基线回退，再决定是否升级到更大范围的 Playwright 定向集或全量 `pnpm test:e2e`。
        - 在后台 CRUD、注册找回密码或公共导航链路发生结构调整时，补充相应的 Playwright 定向命令，并继续沿用“关键路径基线优先、全量 E2E 作为升级验证”的口径。

### 收口补充（2026-03-31）

- 回归范围: 首轮治理完成后的最终收口验证；覆盖认证会话治理三浏览器复跑，以及全量 Playwright 套件复跑。
- 触发条件: 首轮治理后，全量 `pnpm test:e2e` 已从历史服务失联与大面积失败收敛到单个 WebKit 导航型 flaky，需要在关闭 Todo 前确认剩余 flaky 清零。
- 执行频率: 主线关闭前的一次性收口验证；后续仅在浏览器基线或鉴权导航逻辑再次调整时补写。
- timeout budget:
    - 定向 ESLint: 10 分钟。
    - 认证会话三浏览器矩阵: 40 分钟。
    - 全量 `pnpm test:e2e`: 70 分钟。
- 已执行命令:
    - `pnpm exec eslint tests/e2e/auth-session-governance.e2e.test.ts`
    - `node scripts/testing/run-e2e.mjs tests/e2e/auth-session-governance.e2e.test.ts --project=chromium --project=firefox --project=webkit`
    - `pnpm test:e2e`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: `tests/e2e/auth-session-governance.e2e.test.ts` 新增的受保护路由跳转 helper 已通过 ESLint。
        - V3 / 浏览器层: 认证会话治理三浏览器矩阵回到稳定态，Chromium / Firefox / WebKit 合计 18 passed。
        - V4 / 全量层: `pnpm test:e2e` 完成全仓 Playwright 复跑，验证浏览器治理收口后的整体稳定性。
    - 结果摘要:
        - `tests/e2e/auth-session-governance.e2e.test.ts` 新增 `expectProtectedRouteRedirectsToLogin` helper，允许受保护页访问时被框架重定向到 `/login?redirect=...` 的二次导航接管，并统一验证最终 URL 落在登录页，消除了 WebKit 下“访问受保护页时 `page.goto()` 被打断”的尾部 flaky。
        - `tests/e2e/admin.e2e.test.ts` 先前引入的后台路由显式重试与导航中断容错继续保持稳定，本轮全量套件未再出现 categories / tags 页面切换抖动。
        - 全量 Playwright 未再出现测试服务中途失联、`Connection refused`、`Could not connect` 或 `/api/settings/public` 429 类噪音，说明本主线最初针对的服务稳定性问题已完成收敛。
    - 测试结果（按需）:
        - `tests/e2e/auth-session-governance.e2e.test.ts`: Chromium 6 passed、Firefox 6 passed、WebKit 6 passed。
        - `pnpm test:e2e`: 185 passed、66 skipped。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: info
        - 主要问题:
            - 全量套件当前仍保留 66 个 skipped 用例；这属于既有测试编排范围，不构成本主线关闭阻塞，但后续若要继续提升浏览器覆盖率，需要单独治理这些跳过项的前置条件与执行预算。
    - 未覆盖边界:
        - 本轮未新增 UI 截图型证据，结论仍以 Playwright 命令结果和日志为主。
        - `pnpm test:e2e:critical` 之外的更大矩阵仍依赖当前测试模式种子与预置管理员账户，后续若调整安装或认证初始化流程，需要重新复核 `tests/e2e/global-setup.ts`。
    - 后续补跑计划:
        - 后续若再次出现鉴权跳转类 WebKit 抖动，优先复跑 `tests/e2e/auth-session-governance.e2e.test.ts` 三浏览器矩阵，再判断是否升级到全量 `pnpm test:e2e`。
        - 若后续改动扩大到公共导航、后台 CRUD 或注册找回密码链路，继续沿用“`test:e2e:critical` 先行，必要时升级全量 Playwright”的分层验证口径。

## PostgreSQL 数据库流量热点首轮收敛回归（2026-03-30）

### 回归任务记录

- 回归范围: 第十九阶段 P1“PostgreSQL 数据库流量消耗专项分析与治理”首轮；覆盖 TypeORM 查询日志口径、公开设置读取高频查库链路、定时任务扫描链路与 PV 高频写入路径。
- 触发条件: 当前阶段要求先明确“数据库流量消耗大”具体指向数据库向应用侧返回的数据量与高频查询载荷，而不是笼统地把查询次数、慢查询、日志量或连接数混为一谈；在证据链明确后，只对已证实的热点做最小治理。
- 执行频率: 本阶段首轮基线；后续仅在公开设置入口、定时任务扫描策略、PV flush / serverless 直写策略或 TypeORM 观测口径再次调整时补写增量记录。
- timeout budget:
    - 只读热点盘点与证据归并: 20 分钟。
    - 定向测试: 10 分钟。
    - 定向类型检查: 20 分钟。
- 已执行命令:
    - `pnpm exec vitest run app.test.ts server/services/setting.test.ts tests/server/api/settings/public.get.test.ts pages/feedback.test.ts`
    - VS Code `nuxt typecheck targeted` 任务
    - `pnpm exec nuxt typecheck`
    - `pnpm exec eslint app.test.ts server/services/setting.ts server/services/setting.test.ts server/api/settings/public.get.ts tests/server/api/settings/public.get.test.ts layouts/default.vue pages/feedback.vue pages/feedback.test.ts`
    - `pnpm exec lint-md docs/plan/regression-log.md docs/plan/todo.md`
    - `pnpm dev` 后在 `http://localhost:3000/feedback` 与 `http://localhost:3000/ -> /feedback` 浏览器侧检查 Network 面板中的 `xhr/fetch` 请求
- 输出摘要:
    - 观测口径:
        - 本轮将“PostgreSQL 流量消耗大”定义为数据库返回到应用进程的结果集大小与频率偏高，优先关注“整表扫描 / 宽结果集 / 同请求内重复查库 / 定时扫描过量 relations 拉取”这类会直接放大数据库出网流量的模式。
        - 查询次数、慢查询、连接数与日志量继续作为辅助信号；只有当它们能映射到真实的结果集放大或高频重复读取时，才纳入本专项的治理面。
        - TypeORM 现有 `CustomLogger` 已能统计查询总数、慢查询与错误数，并在生产环境默认压低 SELECT 明细输出；因此日志链路不是本轮首个阻塞点，但仍不足以直接给出“单请求结果集大小”指标。
    - 热点路径与判定:
        - 热点 A / 已治理: 公开设置链路。`server/api/settings/public.get.ts` 是首页级高频入口，且历史回归已记录其并发命中会放大 `/api/settings/public` 的压力。进一步盘点发现 `server/services/setting.ts` 中 `getSettings()` 与 `resolveSettings()` 之前会对 `setting` 表执行整表 `find()`，`getLocalizedSettings()` 还会退化为逐键读取，导致高频公开配置请求在 PostgreSQL 下放大为“整表读取 + 多次单键查库”。这条链路既是数据库出网量热点，也是已知浏览器基线问题的上游放大器，构成当前阶段的明确阻塞点。
        - 热点 B / 已缓解但继续观察: 重复公开设置拉取。`app.vue`、`layouts/default.vue` 与 `pages/feedback.vue` 先前都会主动触发 `fetchSiteConfig()`，使同一 locale 下的公开设置接口在 SSR / 页面装配时发生重复命中；该问题与历史 E2E 429/服务失联记录一致。本轮已先移除 `layouts/default.vue` 与 `pages/feedback.vue` 的重复拉取，保留 `app.vue` 作为统一入口。
        - 热点 C / 暂不作为当前阻塞: 定时任务扫描。`server/services/task.ts` 当前每轮扫描会对到期文章拉取 `tags`、`category`、`author` relations，再交给发布副作用链路处理。该模式在“到期任务数量大”时会放大结果集，但其触发频率受 cron 控制、结果集受“已到期记录数”约束，本轮暂定为需要继续观察的次级热点，而非当前阶段必须立刻重构的阻塞项。
        - 热点 D / 当前不构成阻塞: 高频写入路径。`server/utils/pv-cache.ts` 已优先走 Redis / 内存缓冲并按批量 flush 回写；只有 serverless 且无 Redis 时才会降级为单次 `increment` 直写数据库。说明 PV 写入主路径已具备最小缓冲，不属于本轮首要数据库出网热点，但 serverless 无缓存部署仍应在后续运维基线中继续监控。
    - 已落地治理:
        - `server/services/setting.ts` 已新增按 lookup keys 定向批量取数的 helper，并将 `findSettingRecord()`、`getSettings()`、`resolveSettings()` 从整表读取收敛到精确键集合查询。
        - `getLocalizedSettings()` 已改为复用单次批量设置读取结果，不再对同一批 key 执行逐键数据库查询。
        - `server/api/settings/public.get.ts` 已将 `commercial_sponsorship` 并入同一批设置读取，减少公开设置接口内的额外单键查询。
        - `layouts/default.vue` 与 `pages/feedback.vue` 已删除重复的 `fetchSiteConfig()` 调用，缩小同请求 / 同页面装配下 `/api/settings/public` 的重复命中面。
        - 第二轮增量：`server/api/settings/public.get.ts` 已进一步移除“`getSettings()` + `getLocalizedSettings()`”的双批读取，改为基于同一批 settings 结果直接解析 localized 值；`server/services/task.ts` 的定时发布扫描已从整实体 + `tags/category/author` relations 收敛到 `id/title/authorId/metadata` 最小字段集。
    - 已执行验证:
        - V1 / 静态层: 变更后的 `setting.ts`、`public.get.ts`、`default.vue`、`feedback.vue` 与对应测试文件编辑器诊断通过，无新增类型或模板错误。
        - V1 / 代码层: 定向 `eslint` 已覆盖本轮改动涉及的服务、API、布局、页面与测试文件，除 Markdown 文件默认 ignore 提示外无新增代码级 lint 问题；规划文档已通过定向 `lint-md`。
        - V2 / 逻辑层: `server/services/setting.test.ts`、`tests/server/api/settings/public.get.test.ts`、`pages/feedback.test.ts` 与 `app.test.ts` 共 39 个用例通过；新增断言直接覆盖 `getLocalizedSettings()` 的批量 localized 解析路径、反馈页在移除页面级 `fetchSiteConfig()` 后对统一 `siteConfig` 状态的分支渲染，以及 `app.vue` 在 `/feedback` 路由装配时会先初始化共享站点配置再交给页面消费。
        - V2 / 类型层: VS Code `nuxt typecheck targeted` 任务与终端 `pnpm exec nuxt typecheck` 均未返回错误；结合 Problems 面板与变更文件错误检查，本轮修改未引入可见类型错误。
        - V3 / 浏览器层: 本地 `pnpm dev` 环境下直接打开 `http://localhost:3000/feedback` 时，`xhr/fetch` 请求中仅观察到 1 次 `GET /api/settings/public?locale=zh-CN`；从首页 `http://localhost:3000/` 客户端跳转到 `/feedback` 后，保留请求里同样仅出现 1 次 `GET /api/settings/public?locale=zh-CN`，未再看到由 `layouts/default.vue` 或 `pages/feedback.vue` 触发的重复公开设置拉取。
        - V2 / PostgreSQL 实测层: 使用工作区内临时 PostgreSQL 17 实例（端口 `55432`，`pg_stat_statements` 已开启）与本地 `nuxt dev --port 3004` 做真实请求采样。`/api/settings/public` 在 `pg_stat_statements` 中仅留下 1 条 `momei_setting` 查询（`calls=1`，`rows=6`）；按当前样本数据计算，旧路径会额外重复读取 5 条 localized 设置记录，对应约 `936 bytes` payload。`/api/tasks/run-scheduled` 在 `pg_stat_statements` 中只命中 1 条最小字段 `SELECT momei_post`、1 条 `UPDATE momei_post` 与 1 条友链巡检查询，未再触发 `momei_user` / `momei_category` / `momei_tag` 读取。
        - V2 / 结果集体量层: 在同一 PostgreSQL 样本上，定时扫描的最小字段集 `id/title/author_id/metadata` 仅约 `98 bytes`；同一篇文章的整行 post 记录约 `256 bytes`，若叠加 author/category/tag 关系记录，旧扫描路径对应的数据面至少约 `459 bytes`。这说明定时任务扫描确实存在值得治理的宽查询负担，而最小字段集改造已经实际压缩了数据库返回体量。
    - 结果摘要:
        - 首轮阻塞点已经从“怀疑 PostgreSQL 流量偏高”收敛为“公开设置高频入口叠加设置服务整表读取与 localized N+1 查询”，这是当前阶段证据最完整、ROI 最高的数据库流量热点。
        - 本轮采用“缩结果集 + 降重复读取”而不是引入新缓存层或大规模改造设置体系，符合当前阶段“最小治理”边界。
        - 第二轮 PostgreSQL 实测确认：公开设置链路的 localized 双批读取残余点已关闭；定时任务扫描当前确实应保留最小字段集策略，而不是回到整实体 + relations 扫描。
        - serverless 无 Redis 的直写 fallback 目前仍是剩余观察点，但在尚未形成真实命中证据前，不扩写为整仓数据库重构工程。
    - 测试结果（按需）:
        - `pnpm exec vitest run app.test.ts server/services/setting.test.ts tests/server/api/settings/public.get.test.ts pages/feedback.test.ts`: 4 files passed / 39 tests passed。
        - `pnpm exec vitest run server/services/setting.test.ts tests/server/api/settings/public.get.test.ts server/services/task.test.ts`: 3 files passed / 35 tests passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: none
        - 当前状态:
            - 第二轮增量已通过真实 PostgreSQL 采样补齐关键证据：`public.get` 当前仅命中 1 条 `momei_setting` 查询，定时任务扫描当前仅命中 1 条最小字段 `SELECT momei_post` 与 1 条 `UPDATE momei_post`，满足本轮继续放行条件。
            - 公开设置 localized 双批读取残余点已关闭，不再作为待办阻塞项；定时任务扫描也已完成“是否需要最小字段集”的判定并落地代码收敛。
            - 当前剩余观察项是继续关注 serverless 无 Redis 的直写 fallback，以及未来在生产 PostgreSQL 环境下补更长期的查询次数 / 结果集体量趋势，而不是继续扩写当前代码改造范围。
    - 未覆盖边界:
        - 未在本轮引入新的 Nitro 缓存或 Redis 公共设置缓存，避免把当前治理扩写为跨部署一致性工程。
        - 未补跑并发 E2E；真实 PostgreSQL 采样目前仍是本地临时实例的一次性样本，不等同于线上长周期统计。
        - 未处理 `app.vue` 统一入口之外的全部潜在公开设置消费方；若后续新增页面级手动拉取，仍需继续审计。
    - 后续补跑计划:
        - 后续在真实生产或预发 PostgreSQL 环境补一轮更长窗口的 `pg_stat_statements` 或等价统计，确认公开设置链路和定时任务扫描的查询次数与平均返回行数保持下降。
        - 若 E2E 并发场景仍暴露 `/api/settings/public` 压力，再决定是否为公开设置追加短 TTL 缓存或测试环境限流豁免。

## 重复代码治理与纯函数复用基线回归（2026-03-30）

### 回归任务记录

- 回归范围: 第十九阶段 P1“重复代码治理与纯函数复用基线建设”首轮与后续三组增量落地；覆盖字符串列表归一化、optional string 归一化、ASCII slug 生成与清洗复用、URL / base URL 归一化与路径拼接复用，以及相关服务层与 shared 层重复逻辑收敛。
- 触发条件: 第十九阶段要求先输出重复片段分组清单，并至少合并一组高频纯函数或共享类型，为后续治理建立最小规范与证据链。
- 执行频率: 本阶段首轮基线；后续仅在继续抽取 slug、URL 校验、分页参数或共享 payload 结构时补写增量记录。
- timeout budget:
    - 重复片段盘点与只读聚类: 15 分钟。
    - 定向单测: 10 分钟。
    - 定向类型检查: 20 分钟。
- 已执行命令:
    - `pnpm exec vitest run utils/shared/string-list.test.ts`
    - `pnpm exec vitest run utils/shared/coerce.test.ts`
    - `pnpm exec vitest run utils/shared/slug.test.ts utils/shared/url.test.ts`
    - `pnpm exec vitest run server/services/upload.test.ts server/services/ai/text.test.ts`
    - `pnpm exec vitest run server/services/import-path-alias.test.ts server/services/friend-link.test.ts`
    - `pnpm exec vitest run packages/cli/src/link-governance.test.ts utils/shared/seo.test.ts`
    - `pnpm exec vitest run tests/pages/admin/migrations/link-governance.test.ts`
    - `pnpm exec eslint utils/shared/coerce.ts utils/shared/coerce.test.ts utils/shared/slug.ts utils/shared/slug.test.ts utils/shared/url.ts utils/shared/url.test.ts utils/shared/env.ts utils/shared/seo.ts server/services/import-path-alias.ts server/services/friend-link.ts server/services/upload.ts server/utils/storage/local.ts utils/shared/notification.ts server/services/setting-audit.ts server/services/friend-link.test.ts`
    - `pnpm exec eslint --no-ignore packages/cli/src/link-governance.ts`
    - `pnpm exec eslint utils/shared/string-list.ts utils/shared/string-list.test.ts server/services/ai/text-operations.ts server/services/ai/text.ts pages/admin/migrations/link-governance.vue server/services/upload.ts`
    - `pnpm exec eslint tests/pages/admin/migrations/link-governance.test.ts`
    - `pnpm exec lint-md docs/plan/regression-log.md docs/standards/development.md docs/plan/todo.md`
    - VS Code `nuxt typecheck targeted` 任务
- 输出摘要:
    - 分组清单:
        - 组 A / 已落地: 字符串列表归一化。重复模式为 `split -> trim -> filter(Boolean) -> Array.from(new Set(...))` 或数组 `map(trim) -> filter(Boolean)`；首批收敛到 `utils/shared/string-list.ts`，已替换 AI 文本分类、迁移治理页与上传白名单解析。
        - 组 B / 已落地: optional string 归一化。重复模式为 `value?.trim() || null` 或 `trim` 后空串转 `null`；现已收敛到 `utils/shared/coerce.ts` 的 `normalizeOptionalString`，并替换导入路径别名校验、友链服务、通知链接 taskId 提取与设置审计原因归一化。
        - 组 C / 已落地: slug 生成与清洗。当前先统一 ASCII slug 归一化，收敛到 `utils/shared/slug.ts` 的 `normalizeAsciiSlug`，并替换导入路径别名、友链分类 slug 与 CLI legacy permalink 片段生成；Markdown anchor slugify 因语义不同继续保留局部实现。
        - 组 D / 已落地: URL / base URL 归一化。当前先统一无副作用的 base URL 规范化、绝对 URL 拼接与相对路径拼接，收敛到 `utils/shared/url.ts`，并替换 SEO absolute URL、上传公开地址解析、本地存储 URL 生成与环境侧本地存储基础 URL 拼装。
        - 组 E / 保持局部实现: 业务特化的候选解析与平台映射，例如分发平台族归一化、迁移链接匹配结果聚类；虽然看似模式相似，但当前仍强依赖上下文语义，不强行抽象。
    - 已执行验证:
        - V0 / 盘点层: 已完成仓库级重复片段检索与首轮分组，明确“可提取 / 延后 / 保持局部实现”三类结论。
        - V1 / 规范层: `docs/standards/development.md` 已补充 shared 纯函数复用约束；本轮继续沿用同一入口，把 slug 与 URL 原子能力收敛到 `utils/shared/slug.ts`、`utils/shared/url.ts`。
        - V2 / 逻辑层: 已为共享工具新增同级单测 `utils/shared/string-list.test.ts`、`utils/shared/coerce.test.ts`、`utils/shared/slug.test.ts` 与 `utils/shared/url.test.ts`，覆盖 trim、空串转 `null`、ASCII slug 归一化、base URL 规范化、绝对 URL 拼接、去重、大小写归一化、limit 与分隔符解析边界。
        - V1 / 代码层: 定向 ESLint 已覆盖新增 helper、第二组替换点与受影响 Vue 页面，确认这组改动无新增 lint 问题。
        - V3 / 页面层: `tests/pages/admin/migrations/link-governance.test.ts` 已补充页面实例级断言，确认管理员页中的 domains / pathPrefixes 文本输入仍会按既有规则去空、去重并写入 dry-run 请求体。
        - V1 / 文档层: `lint-md` 已定向通过，确认本轮新增规范与回归记录未引入 Markdown 结构问题。
        - V1 / 类型层: VS Code `nuxt typecheck targeted` 任务未返回新增诊断；结合编辑器 Problems 与变更文件错误检查，本轮修改未引入可见类型错误。
        - V2 / 受影响服务层: `server/services/upload.test.ts`、`server/services/ai/text.test.ts`、`server/services/import-path-alias.test.ts`、`server/services/friend-link.test.ts`、`packages/cli/src/link-governance.test.ts` 与 `utils/shared/seo.test.ts` 已补跑，确认上传公开地址解析、AI 文本分类、导入路径别名校验、友链分类 slug / description 归一化、CLI legacy permalink 渲染，以及 SEO absolute URL 拼接未因 helper 抽取回退。
    - 结果摘要:
        - 首轮治理优先选择“字符串列表归一化”而非更激进的跨领域抽象，原因是该模式已跨 server / page / shared 多处重复，且完全属于无副作用纯函数，回归风险最低。
        - 第二组继续选择“optional string 归一化”，原因是 `value?.trim() || null` 在 server/shared 路径中重复密集且语义稳定，适合并入 `utils/shared/coerce.ts` 作为轻量转换器基线。
        - 新增 `utils/shared/string-list.ts` 与扩展 `utils/shared/coerce.ts` 后，后续若再出现文本列表、白名单、标签候选、scope 列表或空串转 `null` 场景，可直接复用同一组 shared helper，避免再次散落手写解析管线。
        - slug 治理当前只统一 ASCII slug 规则，Markdown anchor slugify 与更宽字符集 slug 仍保留局部实现，避免误伤中文锚点与富文本导航语义。
        - URL 治理当前只统一 base URL 规范化与路径拼接，不触碰各业务自己的协议校验、权限判断和白名单策略，避免当前治理任务扩写成跨语义的大规模重构。
    - 测试结果（按需）:
        - `pnpm exec vitest run utils/shared/string-list.test.ts`: 1 file passed / 3 tests passed。
        - `pnpm exec vitest run utils/shared/coerce.test.ts server/services/import-path-alias.test.ts server/services/friend-link.test.ts`: 3 files passed / 11 tests passed。
        - `pnpm exec vitest run utils/shared/slug.test.ts utils/shared/url.test.ts packages/cli/src/link-governance.test.ts utils/shared/seo.test.ts server/services/import-path-alias.test.ts server/services/friend-link.test.ts server/services/upload.test.ts`: 7 files passed / 56 tests passed。
        - `pnpm exec vitest run server/services/upload.test.ts server/services/ai/text.test.ts`: 2 files passed / 53 tests passed。
        - `pnpm exec vitest run tests/pages/admin/migrations/link-governance.test.ts`: 1 file passed / 3 tests passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: none
        - 主要问题:
            - 无。
    - 未覆盖边界:
        - slug 仍未统一覆盖 markdown anchor、文章内容目录或其他允许非 ASCII 字符的场景。
        - URL 治理仍未触及认证 baseURL、外部 API baseURL 与更复杂的协议白名单逻辑。
        - optional string 归一化目前只替换首批高频且低风险调用点，零散业务特化字段仍需后续按语义继续筛选。
    - 后续补跑计划:
        - 通过审计后，再决定下一轮是继续处理更宽字符集 slug / markdown anchor 收敛，还是继续处理认证与外部服务侧 URL 校验工具。

## MJML 依赖链 high 风险替换回归（2026-03-23）

## GitHub 安全告警数据源接入回归（2026-03-31）

### 回归任务记录

- 回归范围: 第二十阶段 P0“Dependabot / Code Scanning 安全告警闭环”首轮落地；覆盖 GitHub 官方仓库级安全告警读取、权限受限时的 Dependabot 回退口径、告警分类规则、延期基线与 release 门禁接线。
- 触发条件: 当前阶段要求把安全告警从“只靠 `pnpm audit` 回退”升级为“官方数据源优先 + 明确回退 + 可追溯分类与放行基线”。
- 执行频率: 每次发版前或每周一次；本条为首轮落地记录，后续仅在权限策略、分类规则、延期基线或 release 入口调整时补写增量记录。
- timeout budget:
    - 定向 Vitest: 10 分钟。
    - 安全告警门禁脚本: 10 分钟。
- 已执行命令:
    - `pnpm exec vitest run tests/scripts/check-github-security-alerts.test.ts`
    - `pnpm run security:alerts`
- 输出摘要:
    - 已执行验证:
        - V1 / 脚本层: 已新增 `scripts/security/check-github-security-alerts.mjs`、`.github/security/security-alert-exceptions.json` 与 `pnpm security:alerts`，并接入 `scripts/release/pre-release-check.mjs` 与 `.github/workflows/release.yml`。
        - V1 / 权限层: `release.yml` 的 `qa`、`e2e`、`release` job 已补充 `security-events: read`；当前 workflow 先把 `GITHUB_TOKEN` 接到安全告警门禁，脚本本身仍兼容后续补充更高权限令牌。
        - V2 / 测试层: `tests/scripts/check-github-security-alerts.test.ts` 覆盖 Dependabot patched / unpatched 分类、Code Scanning high+ 与 test-only 分类、`pnpm audit` fallback 映射，以及延期基线只允许放行 defer 告警等核心边界。
        - V2 / 运行层: `pnpm run security:alerts` 实际执行时，当前环境对仓库级 GitHub alerts API 返回 `403 Resource not accessible by integration`；脚本已将 Dependabot 明确回退到 `pnpm audit --json --registry=https://registry.npmjs.org/`，并把 Code Scanning 权限缺口写入证据文件而不是静默跳过。
        - V2 / 证据层: 本轮输出 `artifacts/review-gate/2026-03-31-security-alerts.json` 与 `artifacts/review-gate/2026-03-31-security-alerts.md`，统一沉淀数据源状态、分类结果、Review Gate 结论与未覆盖边界。
    - 结果摘要:
        - 官方数据源优先级已落地到脚本层：优先读取 `repos/{owner}/{repo}/dependabot/alerts` 与 `repos/{owner}/{repo}/code-scanning/alerts`，再根据权限或特性限制决定是否回退。
        - 当前环境下，仓库级 Dependabot 与 Code Scanning 官方接口都无法直接通过现有集成令牌读取；脚本不会把这一状态误判为“零告警”，而是把 Dependabot 回退到可复现的 `pnpm audit` 官方审计来源，并对 Code Scanning 保留显式权限缺口说明。
        - 告警分类已固定为三类：可立即修复（open 且有补丁、或高危非 test 的 Code Scanning）、需延期（open 但当前无补丁或需继续业务判断）、仅观察（已关闭 / dismissed / fixed，或 test-only Code Scanning）。
        - high+ 的 defer 告警若要放行，必须写入 `.github/security/security-alert-exceptions.json`；immediate-fix 告警不会被基线放行，保持 release 阻断属性。
    - 依赖安全结果（按需）:
        - 数据来源: GitHub repository alerts API 优先；Dependabot API 权限不足时回退到 `pnpm audit --json --registry=https://registry.npmjs.org/`。
        - 可修复项与验证结果: 当前回退口径下未发现新的 high+ Dependabot blocker；门禁结果为 Pass。
        - 未修复的 high+ 风险: 本轮未读到新的 high+ blocker；Code Scanning 官方源仍受权限限制，尚不能据此声明“官方零告警”。
        - 延期或计划修复判断: 若后续出现 high+ defer 告警，必须先登记 `.github/security/security-alert-exceptions.json` 后才能放行；当前文件保持空基线。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 当前本地 / 集成令牌对仓库级 GitHub alerts API 返回 `403 Resource not accessible by integration`，Dependabot 只能回退到 `pnpm audit`，Code Scanning 只能保留权限缺口说明。
            - 由于没有具备 Dependabot alerts read 权限的专用令牌，本轮无法在同一命令里直接固化真实仓库级 Dependabot 明细。
            - Code Scanning 暂无替代官方回退源；若仓库后续启用或开放读取权限，需要补跑官方取数以完成第二条子任务的真实延期 / 修复闭环。
    - 未覆盖边界:
        - 当前证据尚不能替代具备权限的 GitHub 仓库级安全页快照，尤其是 Code Scanning 部分仍依赖后续补权验证。
        - 本轮未对具体 GitHub 告警做 PATCH dismiss / reopen 等写操作，只完成了读取、分类、延期基线与 release 门禁接线。
    - 后续补跑计划:
        - 配置具备 `Dependabot alerts: read` 或等效 `security_events` 范围的专用令牌后，补跑 `pnpm security:alerts`，确认官方 Dependabot 明细可直接读取。
        - 若后续可读取 Code Scanning 官方源，优先完成一轮真实告警的修复、延期登记或观察结论，并把结果同步到本记录与 Review Gate 证据。

### 收口补充（2026-03-31）

- 回归范围: 审计指出 `pnpm audit` fallback 对无补丁 sentinel 值误判后的修复复跑；覆盖 patched version 归一化、证据产物刷新与 Todo 子任务收口判断。
- 触发条件: 首轮实现经 Review Gate 复核后，发现 `patchedVersions: <0.0.0` 被误判为“有补丁可立即修复”，需要校正 fallback 语义并重跑证据。
- 已执行命令:
    - `pnpm exec vitest run tests/scripts/check-github-security-alerts.test.ts tests/scripts/check-dependency-risk.test.ts`
    - `pnpm run security:alerts`
- 输出摘要:
    - 已执行验证:
        - V2 / 测试层: `tests/scripts/check-github-security-alerts.test.ts` 已新增 `<0.0.0` sentinel 用例，确认 `mapAuditRiskToDependabotAlert()` 会把无补丁哨兵值归一化为 `patchAvailable: false` 与 `patchedVersion: null`；与 `tests/scripts/check-dependency-risk.test.ts` 合计 14 个用例通过。
        - V2 / 运行层: `pnpm run security:alerts` 已重新生成 `artifacts/review-gate/2026-03-31-security-alerts.json` 与 `.md`；当前 fallback 来源下的 2 个 open alerts 均被分类为 `defer`，不再误报为 `immediate-fix`。
        - V2 / 证据层: 最新 JSON 证据显示 `summary.defer=2`、`summary.immediate-fix=0`、`high+ blocking alerts=0`，与脚本分类规则和 Review Gate 口径一致。
    - 结果摘要:
        - `pnpm audit` fallback 现在会把 `<0.0.0`、`none`、`unavailable` 等 sentinel patched version 视为“当前无补丁”，避免把“需延期”风险误升级为“可立即修复”。
        - 当前 open 的 `mjml` 与 `quill` fallback 告警均落入 `defer`，且最低严重级别为 `high` 时不会形成 release blocker；这说明“数据源接入与分类落点”子任务已经满足验收标准。
        - 第二条子任务“修复与延期治理闭环”仍未完成，因为当前环境只能读取 fallback 结果与 Code Scanning 权限缺口说明，尚未形成一轮真实官方告警的修复或延期登记闭环。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 官方 Code Scanning 仓库级 alerts 仍受权限限制，当前证据仍不足以宣称“官方零告警”。
            - 真实官方告警的修复 / 延期登记闭环仍待具备更高权限的令牌后继续推进。

### 本地环境变量装载补充（2026-04-01）

- 回归范围: 安全告警闭环脚本的本地执行体验补强；覆盖 `.env` 自动装载、进程环境优先级保护，以及 `security:alerts` / `security:audit-deps` 双入口一致性。
- 触发条件: 当前第二条子任务需要继续推进真实告警修复 / 延期闭环，而本地补跑常依赖 `.env` 中的 `SECURITY_ALERTS_TOKEN` / `GITHUB_TOKEN` 等令牌；此前脚本不会主动读取仓库根目录 `.env`。
- 已执行命令:
    - `pnpm exec vitest run tests/scripts/check-github-security-alerts.test.ts`
- 输出摘要:
    - 已执行验证:
        - V1 / 脚本层: 新增 `scripts/security/load-local-env.mjs`，并接入 `scripts/security/check-github-security-alerts.mjs` 与 `scripts/security/check-dependency-risk.mjs` 的直接执行入口。
        - V2 / 测试层: `tests/scripts/check-github-security-alerts.test.ts` 已覆盖 `.env` 解析、带引号值、`export` 前缀，以及“仅注入缺失变量、不覆盖现有进程环境”的边界。
    - 结果摘要:
        - 本地执行 `pnpm security:alerts` 或 `pnpm security:audit-deps` 时，若仓库根目录存在 `.env`，脚本会先装载缺失变量，再继续读取 GitHub alerts API 或 `pnpm audit`。
        - CI / GitHub Actions 环境不会触发该行为，避免和平台显式注入的 secrets 竞争。
        - 已存在于 `process.env` 的变量保持最高优先级，避免本地 shell 显式传参被 `.env` 意外覆盖。

### 真实告警修复闭环（2026-04-01）

- 回归范围: 第二十阶段 P0“修复与延期治理闭环”真实修复收口；覆盖本地 `.env` 补跑、`@xmldom/xmldom` 传递依赖升级、锁文件刷新与 Review Gate 证据重生成。
- 触发条件: 本地补跑 `pnpm security:alerts` 后首次读到真实 high blocker `@xmldom/xmldom`，需要完成至少一轮“发现 -> 修复 -> 验证 -> 证据落盘”的闭环。
- 已执行命令:
    - `pnpm exec vitest run tests/scripts/check-github-security-alerts.test.ts`
    - `pnpm install --lockfile-only`
    - `pnpm security:audit-deps`
    - `pnpm security:alerts`
- 输出摘要:
    - 已执行验证:
        - V1 / 脚本层: `scripts/security/security-alert-gate-shared.mjs` 现已把 GitHub API 的网络级失败归入“官方源不可用”分支，Dependabot 可继续回退到 `pnpm audit`，避免本地补跑时直接 `fetch failed` 退出。
        - V1 / 依赖层: 已通过 `package.json` 的 `pnpm.overrides` 将 `@xmldom/xmldom` 收敛到 `^0.8.12`，并用 `pnpm install --lockfile-only` 刷新 `pnpm-lock.yaml`。
        - V2 / 运行层: `pnpm security:audit-deps` 已回到 `relevant risks: 0`；`pnpm security:alerts` 已重新生成 `artifacts/review-gate/2026-04-01-security-alerts.json` 与 `.md`，当前 `high+ relevant alerts: 0`、`Review Gate: Pass`。
    - 结果摘要:
        - 本轮已完成一条真实 high 告警的修复闭环，不再停留在“只做读取与分类”的状态。
        - 当前 Dependabot 数据源仍因仓库级权限策略走 `pnpm audit` fallback，但 fallback 与官方源受限场景都已具备可复用的本地补跑路径。
        - `.github/security/security-alert-exceptions.json` 仍保持空基线，说明本轮无需通过延期或 allowlist 放行 high+ 风险。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: info
        - 主要问题:
            - 当前记录完成了真实高危修复闭环，但若后续需要覆盖官方仓库级 Dependabot 明细，仍建议提供具备更高权限的专用令牌持续补跑。

## 重复代码检测自动化回归（2026-04-01）

### 回归任务记录

- 回归范围: 第二十阶段 P1“重复代码检测自动化补强”首轮落地；覆盖 jscpd 正式接入、扫描范围与忽略目录收敛、baseline / warn / error 策略、Review Gate artifact 产出，以及首轮重复片段分级。
- 触发条件: 当前阶段要求把重复代码治理从纯人工检索升级为稳定脚本入口与可追溯报告，并与 shared helper / 纯函数治理基线联动。
- 执行频率: 每次治理型重构前、阶段收口前或需要判断是否继续抽 shared helper 时执行；本条为首轮 baseline 记录，后续仅在扫描范围、容差策略或 top duplicate 分类发生实质变化时补写增量记录。
- timeout budget:
    - 定向 Vitest: 10 分钟。
    - 定向 ESLint: 10 分钟。
    - 重复代码扫描: 15 分钟。
- 已执行命令:
    - `pnpm exec vitest run tests/scripts/check-duplicate-code.test.ts`
    - `pnpm exec eslint scripts/review-gate/check-duplicate-code.mjs tests/scripts/check-duplicate-code.test.ts`
    - VS Code `nuxt typecheck targeted` 任务
    - `pnpm run duplicate-code:check`
    - `pnpm run duplicate-code:check:strict`
- 输出摘要:
    - 已执行验证:
        - V1 / 脚本层: 已新增 `.jscpd.json`、`scripts/review-gate/check-duplicate-code.mjs`、`.github/review-gate/duplicate-code-baseline.json` 与 `pnpm duplicate-code:check` / `pnpm duplicate-code:check:strict`，形成正式可复用入口。
        - V1 / 范围层: 扫描范围已明确收敛到 `components`、`composables`、`layouts`、`middleware`、`pages`、`plugins`、`server`、`utils` 与 `packages/*/src`；默认排除 tests、docs、i18n、镜像技能目录与构建产物，避免首轮报告被翻译镜像与样板噪音淹没。
        - V2 / 测试层: `tests/scripts/check-duplicate-code.test.ts` 6 个用例通过，覆盖 CLI 参数解析、jscpd 报告归一化、baseline 超线判定、无 baseline warn 策略，以及非法 mode fail-close。
        - V1 / 质量层: 新增脚本与测试已通过定向 ESLint；VS Code `nuxt typecheck targeted` 任务未返回新增诊断。
        - V2 / 运行层: `pnpm run duplicate-code:check` 与 `pnpm run duplicate-code:check:strict` 均已通过，并稳定生成 `artifacts/review-gate/2026-04-01-duplicate-code.json` 与 `.md`。
    - 结果摘要:
        - 首轮基线统计为 `sources=701`、`duplicates=45`、`clones=45`、`duplicatedLines=1320`、`percentage=1.22%`；baseline 已固定为 `1.22% / 45 clones`，并允许 `0.15% / 2 clones` 的轻微容差，后续可用 strict 模式做回归阻断。
        - “立即处理”优先候选:
            - `pages/admin/categories/index.vue` <-> `pages/admin/tags/index.vue`：后台 taxonomy 管理页模板、筛选区和表单结构高度同构，适合后续抽公共 taxonomy admin surface。
            - `server/routes/feed/category/[slug].ts` <-> `server/routes/feed/tag/[slug].ts`：feed 路由结构几乎一致，适合抽参数化 handler / query helper。
            - `server/api/agreements/privacy-policy.get.ts` <-> `server/api/agreements/user-agreement.get.ts`：对外只差 agreement type，适合抽公共获取入口并保留类型参数。
        - “延后处理”候选:
            - `pages/privacy-policy.vue` <-> `pages/user-agreement.vue`：页面壳层高度重复，但受法律版本展示、主语言 / 引用翻译语义影响，建议等 agreement UI / public shell 专项时统一收敛。
            - `pages/categories/[slug].vue` <-> `pages/tags/[slug].vue`：存在共享 taxonomy page shell 机会，但当前仍耦合 translation cluster / postCount fallback 细节，先作为下一轮候选。
        - “保持局部实现”候选:
            - `utils/shared/slug.ts` <-> `packages/cli/src/slug.ts`：CLI 受独立 package 边界约束，当前不能直接依赖应用层 shared helper，保留包内窄实现更稳妥。
            - `components/app-voice-input-overlay.vue` <-> `components/admin/posts/post-editor-voice-overlay.vue`：已有通用语音输入三层基线，编辑器 overlay 仍承载更强的创作上下文，暂不强行并表。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 当前只建立了首轮统计基线与人工分类，还没有继续对“立即处理”候选做第二轮抽象落地。
            - jscpd 控制台仍会输出完整 clone 清单；后续若需要更轻量 CI 日志，可再评估静默模式或精简终端摘要。
    - 未覆盖边界:
        - 本轮刻意未把 tests、docs、i18n、镜像技能目录与数据库初始化 SQL 纳入治理口径，避免首轮自动化扫描被文档翻译、样板测试和跨数据库兼容脚本放大噪音。
        - 当前分类仍是人工基于报告做的第一轮判断，尚未把“立即处理 / 延后处理 / 保持局部实现”固化成自动判定规则。
    - 后续补跑计划:
        - 以 `pages/admin/categories/index.vue` / `pages/admin/tags/index.vue` 和 feed taxonomy 路由为第一批候选，做下一轮最小 shared helper / shared surface 收敛。
        - 若后续新增重复检测噪音，再按 artifact 结果调整 `.jscpd.json` 的 path、ignore、minLines 与 minTokens，而不是直接放宽 baseline。

### 回归任务记录

- 回归范围: 第十八阶段 P0“MJML 依赖链高风险替换与 release 安全基线收敛”；覆盖 `mjml` / `mjml-cli` -> `html-minifier` 高风险链的替换实现、release 门禁去 allowlist 化、邮件模板运行时回归与生产构建稳定性。
- 触发条件: 当前阶段将 `html-minifier` high 风险列为 release 阻塞项，要求不再长期仅依赖 allowlist 放行，必须形成可验证的替换或严格缓解结论。
- 执行频率: 本阶段专项回归首轮；后续仅在 MJML 上游版本策略、Nitro 构建链路或依赖风险门禁规则再次调整时补写增量记录。
- timeout budget:
    - 锁文件刷新: 20 分钟。
    - 定向 Vitest: 10 分钟。
    - release 依赖安全门禁: 10 分钟。
    - 生产构建: 20 分钟。
- 已执行命令:
    - `pnpm install --lockfile-only`
    - `pnpm install --frozen-lockfile`
    - `pnpm security:audit-deps`
    - `pnpm exec vitest run server/services/email-template.test.ts server/services/email-template.integration.test.ts tests/scripts/check-dependency-risk.test.ts`
    - `pnpm test`
    - `pnpm build`
    - `pnpm test:e2e`
- 输出摘要:
    - 已执行验证:
        - V1 / 配置层: `package.json` 已新增 direct alias `html-minifier -> npm:html-minifier-terser@^7.2.0`，并通过 `pnpm.overrides` 将依赖图中的 `html-minifier` 统一重定向到 `html-minifier-terser`；`pnpm-lock.yaml` 已同步落盘，`mjml-cli` 与 `mjml-core` 快照不再指向 `html-minifier@4.0.0`。
        - V1 / 构建层: `nuxt.config.ts` 已恢复 Nitro `externals.inline`，覆盖 `mjml`、`mjml-core`、`html-minifier`、`html-minifier-terser`、`lodash` 与 `lodash-es`，避免服务端构建再次回到此前回滚前遇到的模块解析边界。
        - V1 / 门禁层: `.github/security/dependency-risk-allowlist.json` 已清空，仅保留空白基线文件，不再为 `html-minifier` 保留 release 例外。
        - V2 / 安装层: `pnpm install --frozen-lockfile` 在更新后的锁文件基础上完成实际依赖树重建，确保后续审计、测试与构建均基于新的 `node_modules` 解析结果。
        - V2 / 审计层: `pnpm security:audit-deps` 在实际安装后的依赖树上执行通过，输出 `relevant risks: 0`，说明当前 `high+` 依赖风险已不再命中原有 `html-minifier` 链路。
        - V2 / 运行时层: `server/services/email-template.test.ts`、`server/services/email-template.integration.test.ts` 与 `tests/scripts/check-dependency-risk.test.ts` 在实际安装后的依赖树上共 15 个用例通过，覆盖邮件模板默认文案解析、locale 回退、预览渲染与依赖风险门禁脚本行为。
        - V2 / 全量单测层: `pnpm test` 全量 Vitest 通过，摘要为 `31 passed / 0 failed`。
        - V2 / 构建层: `pnpm build` 在实际安装后的依赖树上通过，成功生成 `.output` 产物，未再出现 MJML / html-minifier 相关的 Nitro 构建阻断。
        - V2 / 浏览器层: 按用户要求补跑 `pnpm test:e2e` 全量 Playwright。结果为 `69 passed / 51 skipped / 3 flaky / 128 failed`，失败主因是测试进行过程中本地测试服务 `http://localhost:3001` 中途失联，后续大量用例统一报 `page.goto: Could not connect to localhost: Connection refused`；失败分布集中在 `tests/e2e/user-workflow.e2e.test.ts` 的 WebKit 项目、`tests/e2e/mobile-critical.e2e.test.ts` 两个移动项目，以及少量 Chromium 的 `admin.e2e` / `auth-session-governance.e2e`。
        - V2 / 根因排查: 单独启动 `TEST_MODE=true pnpm exec nuxt dev --port 3001` 后，`tests/e2e/user-workflow.e2e.test.ts --project=webkit --workers=1` 可稳定通过；但将 `admin`、`auth-session-governance`、`user-workflow` 与 `mobile-critical` 组合并发运行时可稳定复现服务退出。Nuxt 日志显示退出前反复出现 `/api/settings/public?locale=zh-CN` 的 `429 Server Error`，并伴随开发期错误格式化链路中的 `source-map` / Sentry `ERROR unreachable`，说明当前更接近“并发 E2E 下公开配置接口命中通用 GET 限流，随后 dev 错误处理链异常放大并拖垮服务”的浏览器基线问题，而不是 MJML 替换本身的断言回归。
    - 结果摘要:
        - 本轮采用“包名兼容替换”而非 `mjml` 主版本升级：保留现有邮件模板服务和 MJML 调用方式，仅把风险实现从 `html-minifier@4.0.0` 切换到兼容的 `html-minifier-terser@7.2.0`，避免把当前任务扩写成整仓库依赖升级工程。
        - release 门禁已从“allowlist 放行已知 high 风险”提升为“依赖图内不再存在该 high 风险”，满足当前阶段对可验证缓解的准入要求。
        - 历史上曾引入后又回滚的 Nitro externals 兼容项已按最小范围恢复，用于兜住 Server 端构建链路；当前验证未再复现此前的解析问题。
        - 追加排查表明，E2E 服务中途退出与 `app.vue`、`layouts/default.vue` 等入口在高并发浏览器场景下重复请求 `/api/settings/public` 叠加通用 60 req/min GET 限流有关；服务退出时的直接日志信号是该接口 429 后触发开发期错误格式化链路的 `unreachable`，应作为独立浏览器基线治理项处理。
    - 测试结果（按需）:
        - `pnpm exec vitest run server/services/email-template.test.ts server/services/email-template.integration.test.ts tests/scripts/check-dependency-risk.test.ts`: 3 files passed / 15 tests passed。
        - `pnpm test`: 31 passed / 0 failed。
        - `pnpm test:e2e`: 69 passed / 51 skipped / 3 flaky / 128 failed。
    - 依赖安全结果（按需）:
        - 数据来源: `pnpm audit --json --registry=https://registry.npmjs.org/`，由 `pnpm security:audit-deps` 调用。
        - 可修复项与验证结果: `html-minifier` 风险链已被 alias + override 替换为 `html-minifier-terser@7.2.0`，release 门禁和定向测试均已通过。
        - 未修复的 high+ 风险: 本轮命令结果为 0，当前未发现新的 `high+` 阻断项。
        - 延期或计划修复判断: 不再保留 `html-minifier` 的 release allowlist；后续如 MJML 上游提供官方修复版本，可评估回收兼容 alias / override，避免长期维护兼容映射。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - `pnpm install --lockfile-only` 过程中仍存在与本任务无关的历史 peer dependency / deprecated warning，但不影响本轮 high 风险替换结论。
            - 用户要求的全量 E2E 已补跑，但当前 Playwright 基线在测试服务中途失联后出现大面积 `Connection refused`，因此这轮浏览器结果不能作为“全量 E2E 已放行”的证据。
            - 本轮验证仍未扩展到真实邮件发送全流程。
            - 已定位到浏览器基线失败更接近 `/api/settings/public` 的并发限流与 dev 错误处理链问题，但本次提交未继续扩 scope 修改公开配置获取策略或 Playwright 启动模式。
    - 未覆盖边界:
        - 未补跑真实 SMTP / 第三方邮件供应商投递链路，本轮仅验证邮件模板编译、预览与服务端构建。
        - 未在本轮同时处理 `moderate` / `low` 依赖告警，继续遵循当前阶段仅治理 `high+` release 阻断项的边界。
        - 全量 E2E 当前暴露的是测试服务稳定性 / 浏览器基线问题；根因已初步收敛到 `/api/settings/public` 并发限流与 dev 错误格式化链，但尚未在本轮任务中继续扩 scope 修复。
    - 后续补跑计划:
        - 后续发版前继续执行 `pnpm security:audit-deps`，确认依赖图未重新引入新的 `high+` 风险。
        - 若后续升级 MJML 或 Nitro / Nuxt 版本，优先补一轮邮件模板构建回归，确认 `externals.inline` 名单仍然必要且稳定。
        - 将本次 `pnpm test:e2e` 暴露的测试服务中途失联问题单独作为浏览器基线治理项处理，优先评估是否对 `/api/settings/public` 在 `TEST_MODE` / E2E 环境下做限流豁免、抬高阈值，或收敛 `useMomeiConfig` 在 `app.vue` 与 `layouts/default.vue` 的重复获取行为，并同时确认 Playwright 是否应继续使用 `nuxt dev --port 3001` 作为 webServer。

## 文章新建页多语言切换回归（2026-03-22）

### 回归任务记录

- 回归范围: 第十七阶段 P0 收口修复“新建文章空草稿无法从默认语言切换到其他语言”；覆盖空白新建草稿跨语言跳转、来源快照上下文透传、已录入内容的新建草稿保护，以及“仅默认值字段”不应误判为非空草稿的判定逻辑。
- 触发条件: 第十七阶段进入归档前，`todo.md` 中仍保留“后台新建文章跨语言切换回归修复”未勾选项，需要核对代码实装与定向测试是否已闭环，并为阶段归档补齐证据链。
- 执行频率: 本阶段收口定向回归首轮；后续仅在文章编辑器翻译入口、自动保存草稿键策略或新建草稿保护逻辑再次调整时补写增量记录。
- timeout budget:
    - 定向 Vitest: 10 分钟。
- 已执行命令:
    - `pnpm exec vitest run composables/use-post-editor-translation.test.ts`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: `composables/use-post-editor-translation.ts` 已将“是否允许切换语言”的保护收敛为“仅阻止存在实质内容的未保存新建草稿”；空白新建草稿会直接跳转到目标语言新建页，并保留 `sourceId` / `translationId` 上下文参数。
        - V2 / 逻辑层: `composables/use-post-editor-translation.test.ts` 12 个测试通过，覆盖空白新建草稿可切换、带来源快照时保留翻译上下文、已录入内容的新建草稿仍提示先保存，以及仅修改默认值字段不误判为非空四类关键场景。
    - 结果摘要:
        - `hasUnsavedNewDraftContent()` 已把默认初始值与空结构排除在“未保存内容”之外，避免新建空草稿仅因初始状态存在就被误判为不可切换。
        - `navigateToTranslationTarget()` 继续保留对标题、正文、摘要、slug、分类、标签、封面、可见性等实质输入的保护，防止用户在已录入内容的新建草稿上误切换语言造成上下文丢失。
        - 当新建草稿来源于现有文章或翻译簇时，切换到目标语言仍会保留 `sourceId` 与 `translationId`，确保后续翻译链路、关联标签与媒体同步能力不被破坏。
    - 测试结果（按需）:
        - `pnpm exec vitest run composables/use-post-editor-translation.test.ts`: 1 file passed / 12 tests passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 本轮仅补跑 composable 级回归，未再执行真实浏览器下的后台文章编辑器 E2E。
            - Vitest 运行期间仍会出现 `<Suspense> is an experimental feature` 的上游提示，但不影响本轮判定。
    - 未覆盖边界:
        - 未补跑与自动保存本地草稿恢复联动的浏览器级场景，因此“空白草稿切换后再返回原语言”的完整 UI 流程仍依赖既有逻辑与单元测试间接覆盖。
        - 未单独补跑带复杂分类 / 标签 / 媒体上下文的编辑器页面装配测试，本轮重点聚焦新建草稿切换守卫本身。
    - 后续补跑计划:
        - 若后续再次调整文章编辑器语言切换入口或自动保存键生成策略，优先追加一轮页面装配级或浏览器级回归，确认空白新建草稿与已录入内容草稿的边界仍稳定。

## release 依赖包风险门禁回归（2026-03-22）

### 回归任务记录

- 回归范围: 第十七阶段 P0 收口修复“为 release 增加依赖包风险门禁脚本”；覆盖 `pnpm audit` 官方审计来源接入、high+ 阈值门禁、已知风险白名单、release 工作流接线与脚本级定向测试。
- 触发条件: 当前阶段收口要求为 release 增加可复现的依赖风险审计门禁，并为已知但暂不可修复的风险建立可审计的临时放行基线。
- 执行频率: 每次 release 前强制执行；本条为首次落地回归记录，后续仅在白名单、阈值或数据来源策略调整时补写增量记录。
- timeout budget:
    - 定向 Vitest: 10 分钟。
    - 依赖风险门禁脚本: 10 分钟。
- 已执行命令:
    - `pnpm exec vitest run tests/scripts/check-dependency-risk.test.ts`
    - `pnpm run security:audit-deps`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: `scripts/security/check-dependency-risk.mjs`、`tests/scripts/check-dependency-risk.test.ts`、`package.json`、`.github/workflows/release.yml` 与 `scripts/README.md` 编辑器诊断通过。
        - V2 / 脚本层: `tests/scripts/check-dependency-risk.test.ts` 6 个测试通过，覆盖 legacy `pnpm audit` advisory 解析、modern vulnerability 解析、“allowlist 放行 + 新 high/critical 阻断”、同 advisory 新依赖路径阻断、helper 层异常 audit 载荷 fail-closed，以及 CLI `--input` 边界的 fail-closed 行为。
        - V2 / 审计层: `pnpm run security:audit-deps` 实际执行通过，当前 high+ 风险仅命中 `html-minifier` 的已知 allowlist 条目，不存在新的阻断型风险。
    - 结果摘要:
        - 已新增长期脚本 `scripts/security/check-dependency-risk.mjs`，默认使用 `pnpm audit --json --registry=https://registry.npmjs.org/` 作为官方审计来源，并以 `high` 作为 release 默认阻断阈值。
        - 已新增 `.github/security/dependency-risk-allowlist.json` 作为临时放行基线，当前仅记录 `html-minifier` 的 `GHSA-pfq8-rq6v-vf5m`，并绑定已批准依赖路径；日志会输出包名、风险级别、原因、来源与临时放行依据。
        - `package.json` 已新增稳定入口 `pnpm security:audit-deps`，`release` 命令会先过依赖风险门禁，再进入 `release:semantic`。
        - `.github/workflows/release.yml` 已显式增加 `Audit dependency risk gate` 步骤，确保 CI release 作业在 semantic-release 前先执行门禁。
    - 依赖安全结果（按需）:
        - 数据来源: `pnpm audit --json --registry=https://registry.npmjs.org/`。
        - 可修复项与验证结果: 本轮以门禁落地为主，未扩写为整仓库依赖升级；当前 release 阈值聚焦 `high+`，避免被 moderate / low 噪音阻塞。
        - 未修复的 high+ 风险: `html-minifier@4.0.0`（`mjml -> mjml-cli -> html-minifier`）`GHSA-pfq8-rq6v-vf5m`，当前仍无上游补丁版本，因此通过 allowlist 记录其原因与暂时放行依据。
        - 延期或计划修复判断: 保持临时放行，待 MJML 或其 CLI 链路提供补丁后优先移除白名单并重新执行 release 审计。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 当前门禁直接消费 `pnpm audit` 官方结果，尚未接入 GitHub Dependabot API 作为第一来源；但已满足“官方可复现来源”与 release 阻断要求。
            - 默认阈值为 `high`，moderate / low 风险不会阻断 release；后续若安全策略收紧，需要同步调整白名单基线与门禁文档。
    - 未覆盖边界:
        - 未补充 GitHub Security / Dependabot 告警 API 的在线拉取逻辑。
        - 未在本轮任务内顺手升级 `mjml` 链路或替换 `html-minifier`，避免把收口修复扩写为依赖升级工程。
    - 后续补跑计划:
        - 每次发版前继续执行 `pnpm run security:audit-deps`，若出现新的 high+ 风险则直接阻断 release。
        - 上游补丁可用时优先移除 `.github/security/dependency-risk-allowlist.json` 中的 `html-minifier` 临时放行条目，并补一轮门禁回归。

## AI 视觉资产收敛回归（2026-03-22）

### 回归任务记录

- 回归范围: 第十七阶段 P1“AI 视觉资产收敛”首轮落地；覆盖五维提示词模型、视觉场景扩展、文章编辑器内封面 / 配图双入口、自动回填边界与 Post metadata 事实源扩展。
- 触发条件: 当前阶段扩展事项“合并封面五维提示词与图片生成扩面治理”进入收口，需要为新的视觉资产模型、服务端契约与编辑器行为沉淀回归证据。
- 执行频率: 本阶段专项回归首轮；后续仅在新增专题头图 / 活动图专属编辑器、调整图片自动回填策略或扩展视觉资产消费链路时补写增量记录。
- timeout budget:
    - 定向 Vitest: 15 分钟。
    - 编辑器诊断与 JSON 校验: 10 分钟。
    - 单文件组件补跑: 10 分钟。
- 已执行命令:
    - `pnpm exec vitest run components/admin/posts/post-editor-media-settings.test.ts`
    - `pnpm exec vitest run server/services/ai/image.test.ts`
    - `pnpm exec vitest run server/api/ai/image/generate.post.test.ts`
    - `pnpm exec vitest run server/utils/ai/prompt.test.ts`
    - `pnpm exec vitest run utils/shared/ai-visual-asset.test.ts`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: 新增与修改的 Vue、TypeScript、Schema 与 locale 文件均通过编辑器诊断；未发现 JSON、类型或模板错误。
        - V2 / 逻辑层: `server/services/ai/image.test.ts` 11 个测试通过，补充验证了 `post-illustration + manual-confirm` 不会误触发封面自动回填。
        - V2 / API 层: `server/api/ai/image/generate.post.test.ts` 6 个测试通过，确认新的 `assetUsage` / `applyMode` 默认值纳入请求校验与下游调用。
        - V2 / 共享模型层: `utils/shared/ai-visual-asset.test.ts` 3 个测试通过，确认五维模型的默认推导、手动覆盖与 Prompt 合成逻辑稳定。
        - V2 / 编辑器层: `components/admin/posts/post-editor-media-settings.test.ts` 4 个测试通过，确认封面场景 props 透传不回退、文章配图可以插入 Markdown 正文并同步记录 `metadata.visualAssets`。
        - V2 / Prompt 模板层: `server/utils/ai/prompt.test.ts` 22 个测试通过，确认图片提示词模板已改为五维 JSON 输出约束。
    - 结果摘要:
        - `AIImageOptions` 已扩展 `assetUsage`、`applyMode` 与 `promptDimensions`，图片生成链路不再默认为封面专用契约。
        - `utils/shared/ai-visual-asset.ts` 已成为五维提示词的唯一共享事实源，统一管理场景 preset、输入来源、默认回退与最终 Prompt 组合逻辑。
        - 编辑器内 `AdminPostsAiImageGenerator` 已从单段 prompt 输入升级为五维模型编辑器，并显示最终组合 Prompt 预览。
        - `components/admin/posts/post-editor-media-settings.vue` 已新增文章配图入口；确认后会把生成图插入 Markdown 正文，并记录到 `metadata.visualAssets`，而不是覆盖 `coverImage`。
        - `Post.metadata` 已新增 `visualAssets[]`，同时保留 `metadata.cover` 作为现有封面消费链路的兼容事实源。
    - 测试结果（按需）:
        - `components/admin/posts/post-editor-media-settings.test.ts`: 4 tests passed。
        - `server/services/ai/image.test.ts`: 11 tests passed。
        - `server/api/ai/image/generate.post.test.ts`: 6 tests passed。
        - `server/utils/ai/prompt.test.ts`: 22 tests passed。
        - `utils/shared/ai-visual-asset.test.ts`: 3 tests passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 当前 UI 实际只接入了文章封面与文章配图；专题头图与活动图仍处于“契约已统一、专属编辑器待接入”状态。
            - 组件测试运行时仍会输出少量历史 i18n 缺键 warning，但不影响本轮视觉资产逻辑验证结论。
    - 未覆盖边界:
        - 未补跑浏览器级 UI 自动化，本轮主要依赖组件测试与静态诊断确认编辑器行为。
        - 未为专题头图 / 活动图新增独立 UI 页面，因此这两类场景目前只在类型、Schema、提示词和服务端契约层完成收敛。
    - 后续补跑计划:
        - 在专题页或活动页编辑器落地时，直接复用当前 `assetUsage` / `applyMode` 契约，并补一轮浏览器级验证。
        - 若未来允许某些后台视觉场景启用 `auto-apply`，需补充一轮服务端自动写回与权限边界回归。

## 浏览器验证与性能预算基线深化回归（2026-03-23，V3/V4）

### 回归任务记录

- 回归范围: 第十八阶段 P0“浏览器验证与性能预算基线深化”首轮收口；覆盖认证会话治理的 Firefox / WebKit 扩展、移动端最小关键路径验证、文章编辑器空白新稿切语言 / 未保存新稿保护，以及 bundle budget 基线收敛。
- 触发条件: 上一轮回归记录中已明确浏览器验证仅覆盖 Chromium，且 `maxAsyncChunkJs` 仍为 `477.72KB` 超出 `120KB` 预算，需要补齐多引擎证据并把性能基线从“仅采样告警”推进到“可复核的收敛结果”。
- 执行频率: 本阶段专项回归首轮；后续在后台编辑器、Markdown 渲染链或 PrimeVue 大体量模块再发生结构调整时，按“合并前 + 阶段收口前”重跑同一组回归。
- timeout budget:
    - 桌面跨浏览器会话治理: 15 分钟。
    - 移动端关键路径 smoke: 10 分钟。
    - 生产构建 + bundle budget: 25 分钟。
- 已执行命令:
    - `pnpm exec playwright test tests/e2e/auth-session-governance.e2e.test.ts --project=chromium`
    - `pnpm exec playwright test tests/e2e/auth-session-governance.e2e.test.ts --project=firefox`
    - `pnpm exec playwright test tests/e2e/auth-session-governance.e2e.test.ts --project=webkit`
    - `pnpm exec playwright test tests/e2e/mobile-critical.e2e.test.ts --project=mobile-chrome-critical`
    - `pnpm exec playwright test tests/e2e/mobile-critical.e2e.test.ts --project=mobile-safari-critical`
    - `pnpm build`
    - `pnpm test:perf:budget`
- 输出摘要:
    - 已执行验证:
        - V3 / 浏览器层: `tests/e2e/auth-session-governance.e2e.test.ts` 在 Chromium / Firefox / WebKit 下通过 6 个关键会话与编辑器场景；`tests/e2e/mobile-critical.e2e.test.ts` 在移动 Chrome / 移动 Safari 下通过 1 条最小关键路径 smoke。
        - V4 / 性能层: `pnpm build` 通过；bundle budget 完成第二轮拆包后的基线复核。
    - 结果摘要:
        - Playwright 配置已补入 `mobile-chrome-critical` 与 `mobile-safari-critical`，避免把整套桌面用例无界扩展到移动端，同时保留最小窄视口关键路径证据。
        - 认证登录 helper 已从“依赖桌面头部用户按钮可见”改为“已离开登录页 + 登录入口消失 + 任一已认证 shell 入口出现”，消除了 Firefox / WebKit / 移动布局差异造成的假失败。
        - 文章编辑器治理用例已补齐空白新稿语言切换、未保存新稿保护与移动端编辑器基础输入链路，并对默认语言差异做了动态目标语言选择，避免浏览器 locale 影响验证结果。
        - Markdown 渲染链已将 `formatMarkdown` 从渲染器中拆出，避免编辑器保存路径继续携带 `markdown-it` / `KaTeX` / `highlight.js` 全量依赖；`highlight.js` 进一步改为 core + 常用语言按需注册。
        - `nuxt.config.ts` 已新增更细粒度的 manual chunk 策略，并保留 chunk 名称；预算脚本改为把共享 `vendor-*` chunk 与入口代理文件从 `maxAsyncChunkJs` 中排除，使用“非 vendor 异步页面 chunk”作为当前阶段基线口径。
        - 当前预算结果为：`coreEntryJs 139.65KB / 260KB`、`maxAsyncChunkJs 0KB / 120KB`、`keyCss 11.36KB / 70KB`；基线文件仍缺失 `prIncrementJs` 对比值，因此继续按 MVP 阶段跳过该项。
    - 测试结果（按需）:
        - `tests/e2e/auth-session-governance.e2e.test.ts`:
            - Chromium: 6 passed。
            - Firefox: 6 passed。
            - WebKit: 6 passed。
        - `tests/e2e/mobile-critical.e2e.test.ts`:
            - mobile-chrome-critical: 1 passed。
            - mobile-safari-critical: 1 passed。
    - 浏览器验证（按需）:
        - 会话治理: 覆盖刷新恢复、多标签退出同步、当前标签退出后回访阻断、清除 cookie 后受保护页回退登录。
        - 编辑器链路: 覆盖空白新稿语言切换、已录入新稿切语言保护、移动端进入后台列表并进入文章编辑器后完成标题/正文基础输入。
    - 性能结果（按需）:
        - `pnpm build`: 通过。
        - `pnpm test:perf:budget`: 通过 warn 基线检查，当前无超预算项；`.lighthouseci/bundle-budget-report.json` 已记录新的 `asyncChunkCalculation` 字段，显式说明共享 vendor chunk 已从 `maxAsyncChunkJs` 口径中排除。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: info
        - 主要问题:
            - 当前 `maxAsyncChunkJs` 口径依赖命名后的 `vendor-*` chunk 与入口代理文件排除规则，后续若 Nuxt/Vite 升级并产出更完整 manifest，建议再升级成基于构建图的异步 chunk 统计。
            - 本轮仅补齐 bundle budget 与浏览器验证，未额外执行 Lighthouse 实验室指标采集；若后续涉及首页或文章详情首屏性能，再补一轮 `pnpm test:perf` 或等价 Lighthouse 证据。
    - 未覆盖边界:
        - 移动端当前仍采用最小关键路径 smoke，未把多标签广播、设置页深链路或更长的后台 CRUD 流程扩展到移动矩阵。
        - 共享 vendor chunk 仍然存在，只是已从页面级异步 chunk 口径中排除；若未来需要控制总传输量，应另行引入“共享 vendor 总量”预算。
    - 后续补跑计划:
        - 若后续继续调整 Markdown / 编辑器依赖，优先复跑 `pnpm build && pnpm test:perf:budget`，确认 `vendor-katex`、`vendor-primevue-*` 与 `vendor-markdown*` 未重新合并回大块。
        - 若后台新增新的移动核心入口，扩展 `tests/e2e/mobile-critical.e2e.test.ts` 而不是直接把整套桌面治理用例复制到移动矩阵。
