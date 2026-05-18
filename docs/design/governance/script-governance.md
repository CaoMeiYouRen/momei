# 脚本治理与量化基线设计

本文档用于集中收敛当前分散在规划、开发规范、文档治理与回归入口中的脚本治理要求。它不替代 [项目规划规范](../../standards/planning.md)、[开发规范](../../standards/development.md) 或 [文档规范](../../standards/documentation.md)，而是把“长期治理优先落脚本、脚本如何成为事实源、何时进入固定回归入口”整理为一份可执行的专项设计文档。

## 1. 背景与问题

当前仓库已经具备一批长期治理脚本与固定入口：

- 文档门禁：`scripts/docs/check-line-count.mjs`、`scripts/docs/check-source-of-truth.mjs`、`scripts/docs/check-i18n-duplicates.mjs`
- 回归调度：`scripts/regression/run-periodic-regression.mjs`
- 结构复用：`scripts/review-gate/check-duplicate-code.mjs`
- 性能、安全与发布：`scripts/perf/check-bundle-budget.mjs`、`scripts/security/check-dependency-risk.mjs`、`scripts/release/pre-release-check.mjs`

但近期长期主线继续扩充后，暴露出三个新的治理缺口：

1. 多条长期主线已经明确要求“量化进度”，但进度事实源仍分散在 backlog 叙述、回归记录和单次命令输出里，没有统一的 script-first 设计入口。
2. 现有脚本覆盖了文档、性能、安全与重复代码，却还没有统一回答“脚本本身是否健康、是否存在孤儿脚本、是否有稳定入口、是否真正承担了长期治理的 baseline 输出”。
3. 一些新的治理目标已经被提出，但仍停留在规划文本里，没有被组织成明确的脚本资产路线，例如：
   - 简单内部函数 / type / interface 的重复盘点
   - ESLint / 类型债的分规则、分目录 inventory
   - 注释缺失、注释漂移与低价值注释候选盘点
   - 高频治理文档的行数扩面与翻译 freshness 收紧

这意味着当前“脚本优先”虽然已经成为规划原则，但还没有一份完整的专项文档来定义范围、优先级、入口、回归接入顺序与非目标边界。

## 2. 目标与非目标

### 2.1 目标

- 建立一份单一事实源，统一说明脚本治理的职责边界、资产分层、接入门槛与固定回归关系。
- 把“长期主线优先量化”落实成脚本设计约束，避免未来再回到只靠阶段叙述判断进度。
- 为首批新增治理脚本给出明确候选清单、优先级与验收标准。
- 明确哪些门槛已经在仓库中落地，哪些仍处于“候选上收、尚未生效”的状态，避免规划文本和实际脚本口径漂移。

### 2.2 非目标

- 不在本轮直接实现新脚本；本文档只定义治理设计、优先顺序与接入策略。
- 不把所有长期主线都扩写为“必须立即有全量脚本覆盖”；首轮只要求高 ROI、可重复执行、可比较的 baseline 输出。
- 不替代现有规范文档中关于脚本写法、文档分层、阶段规划或回归流程的正文；本文只回链并聚焦脚本治理本身。
- 不把一次性调试命令、临时本地草稿或个人辅助脚本伪装为长期脚本资产。

## 3. 当前事实源与分散点

当前与脚本治理直接相关的要求，主要散落在以下几处：

- [docs/plan/backlog.md](../../plan/backlog.md)：定义了新的长期主线“脚本资产、量化口径与回归入口治理”，并把 script-first 要求分别注入 ESLint / 类型债、结构复用、注释治理与文档治理。
- [docs/standards/planning.md](../../standards/planning.md)：新增了“治理脚本优先”“量化事实源优先”，并要求稳定治理脚本逐步接入固定回归入口。
- [docs/standards/development.md](../../standards/development.md)：定义了长期脚本准入、临时脚本清理与脚本输出至少应提供计数 / 分桶 / delta 的约束。
- [docs/guide/development.md](../../guide/development.md)：说明了三条固定回归入口，但没有集中说明“脚本治理何时进入这些入口”。
- 现有专项治理文档：如 [ESLint / 类型债治理](./eslint-type-debt-tightening.md)、[文档翻译 freshness 治理](./docs-translation-freshness-governance.md)、[Windows Dev / Build 性能治理](./windows-dev-build-performance-governance.md)，都分别提到了“量化口径”，但仍是分散陈述。

本专项文档的作用，就是把上述规则收束为同一套脚本治理契约。

## 4. 治理模型

### 4.1 脚本资产分层

| 层级 | 说明 | 当前典型资产 |
| :-- | :-- | :-- |
| 固定回归入口 | 负责按节奏统一编排脚本执行、输出 Review Gate 结论与日志窗口判定 | `scripts/regression/run-periodic-regression.mjs` |
| 长期治理脚本 | 为某条长期主线或长期质量门提供可重复执行的 inventory / audit / check 输出 | `check-line-count`、`check-source-of-truth`、`check-duplicate-code`、`check-bundle-budget` |
| 专项阶段脚本 | 服务某一治理专题，但尚未稳定进入固定入口；需要先证明长期复用价值 | 候选中的 `simple duplicate inventory`、`eslint debt inventory`、`comment inventory` |
| 临时脚本 / 调试脚本 | 只服务当前任务，不进入 `package.json`、规范文档或回归入口 | `scripts/temp/**` 或本地一次性命令 |

### 4.2 长期脚本的事实源职责

一条脚本只有在满足以下任一职责时，才适合进入长期治理范围：

1. 能输出稳定的 baseline，供跨阶段比较。
2. 能把长期主线拆成可计数的维度，例如 rule、目录、文件、候选项、warning 数量、重复组数。
3. 能发现人工 review 容易漏掉的漂移，例如孤儿脚本、临时脚本残留、文档膨胀、翻译 freshness 超时、结构复用基线反弹。
4. 能被 `package.json`、规范文档、治理文档或固定回归入口稳定引用，而不是只在某一次阶段执行时手工运行。

### 4.3 从“脚本存在”到“脚本生效”的三段式

一条治理脚本不应在入库后长期停留在“存在但没人用”的状态。建议统一走三段式：

1. **P0 候选阶段**：先证明该脚本能稳定输出 baseline，且输出字段足够支持人工复核。
2. **P1 正式入口阶段**：接入 `package.json`，并在专项治理文档与相关长期主线中被明确引用。
3. **P2 回归接入阶段**：进入 `regression:weekly`；若对发版或阶段收口构成 blocker，再逐步升级到 `pre-release` / `phase-close`。

## 5. 首批应统一纳管的主题

### 5.1 脚本资产自身治理

优先级：P0

目标：先回答“当前脚本目录是否健康”。

当前已落地脚本：`scripts/governance/check-script-governance.mjs`

当前稳定入口：`pnpm governance:check:scripts`

当前状态：已按 warning 口径进入 `pnpm regression:weekly`

建议最小输出：

- 长期脚本是否存在稳定入口：`package.json` / workflow / 文档 / 规范至少命中其一
- 是否存在孤儿长期脚本
- 是否存在 `scripts/temp/**` 或等价临时脚本残留
- 是否存在文档已声明、但脚本文件不存在或路径失效
- 是否存在脚本文件已落地、但没有任何稳定入口引用

当前验收状态：

- 已完成首轮 warning 接入 `regression:weekly`
- 后续待误报率收敛后，再评估是否升级为 `pre-release` 或 `phase-close` blocker

### 5.2 结构复用的“简单重复”盘点

优先级：P0

目标：补齐 `jscpd` 看不见的重复候选。

当前已落地脚本：`scripts/governance/audit-simple-duplicates.mjs`

当前稳定入口：`pnpm governance:audit:simple-duplicates`

当前状态：已形成独立 baseline 入口，暂不接入固定回归

建议最小输出：

- 同名内部函数候选数
- 同名 `type` / `interface` 候选数
- 近似命名函数候选数（例如语义接近但名称略有差异）
- 候选按目录与文件分桶
- 人工判定结果占位：`可复用` / `保留局部实现` / `待观察`

当前验收状态：

- 已作为结构复用主线的独立 baseline 落地，不直接阻断回归
- 后续待人工判定口径稳定后，再考虑与 `duplicate-code:check` 组合输出

### 5.3 ESLint / 类型债 inventory

优先级：P0

目标：让 ESLint / 类型债主线具备稳定的可比较数据，而不只记录“本轮清了几处”。

建议新增脚本：`scripts/governance/audit-eslint-debt.mjs`

建议最小输出：

- 按 rule 分桶的命中数
- 按目录分桶的命中数
- 已进入窄切片规则的残余清单
- `warning` 与显式豁免的数量变化
- 与上一轮 baseline 的 delta

建议验收：

- 首轮只覆盖当前长期主线中已经明确提到的规则族，例如 `no-explicit-any`、`no-non-null-assertion`
- 不把它扩写成全仓所有 ESLint 规则的统一大盘

### 5.4 注释治理 inventory

优先级：P1

目标：把“高价值注释补齐”和“低价值注释清理”从叙述推进到可量化候选。

建议新增脚本：`scripts/governance/audit-comment-drift.mjs`

建议最小输出：

- 高复杂度导出函数缺注释候选数
- 带 `TODO` / “临时” / “后续补” 口吻的注释候选数
- 疑似逐行复述型注释候选数
- 疑似与代码不一致的漂移注释候选数

建议验收：

- 首轮以 inventory 和人工复核清单为主，不自动判定 blocker
- 只有在误报可控后，才考虑纳入周级治理的 warning 面

### 5.5 文档门禁扩面与 freshness 收紧

优先级：P1

目标：把已经提出的文档治理候选从规划文本推进到脚本设计。

当前已落地事实：

- `docs:check:line-count` 已覆盖 README、`roadmap.md`、`backlog.md`、`todo-archive.md` 与 `docs/reports/regression/current.md`
- `docs:check:source-of-truth` 已按 `must-sync 30 天 / summary-sync 45 天 / source-only` 运行

下一轮候选：

- 将 [docs/guide/translation-governance.md](../../guide/translation-governance.md)、[docs/guide/deploy.md](../../guide/deploy.md)、[docs/standards/planning.md](../../standards/planning.md)、[docs/standards/documentation.md](../../standards/documentation.md) 纳入 line-count
- 评估将 `must-sync` 收紧到 `21` 天、`summary-sync` 收紧到 `30` 天的可执行性

约束：

- 在脚本与文档规范同步落地前，这些新阈值仍属于候选，不视为已正式生效
- 不允许只在规划里宣称“门禁收紧”，却不回写脚本契约

## 6. 固定回归接入策略

### 6.1 默认接入顺序

| 阶段 | 接入位置 | 默认口径 |
| :-- | :-- | :-- |
| 首轮稳定 | 独立 `package.json` 命令 + 专项治理文档 | baseline / warning |
| 第二轮稳定 | `pnpm regression:weekly` | warning，失败进入回归记录 |
| 风险升高后 | `pnpm regression:pre-release` | 视影响面升级为 warning 或 blocker |
| 收口前必须保证 | `pnpm regression:phase-close` | 若影响阶段放行，则升级为 blocker |

### 6.2 何时不应该接入固定回归

以下情形不应过早接入固定回归：

- 误报率明显偏高，仍需要人工大规模过滤
- 输出字段尚不稳定，跨轮次无法比较
- 只服务某一次性的阶段任务，没有长期复用价值
- 尚未接入稳定入口，团队无法在本地与 CI 中一致运行

## 7. 文档、入口与事实源同步要求

当脚本治理发生变化时，至少同步以下位置：

1. 本专项文档：说明新脚本处于候选、正式入口还是回归接入阶段。
2. 对应长期主线文档或规划条目：说明该脚本解决的是哪条长期主线的 baseline 缺口。
3. `package.json`：提供稳定执行入口。
4. 若脚本进入固定回归：同步更新 [docs/guide/development.md](../../guide/development.md)、[docs/standards/planning.md](../../standards/planning.md) 或相应的治理文档。

## 8. 最小验证矩阵

| 维度 | 最小验证 |
| :-- | :-- |
| 文档结构 | `pnpm exec lint-md docs/design/governance/script-governance.md docs/design/governance/index.md` |
| 文档站入口 | `pnpm docs:build` 至少能识别新增治理页和侧边栏入口 |
| 事实源一致性 | 本文与 [docs/plan/backlog.md](../../plan/backlog.md)、[docs/standards/planning.md](../../standards/planning.md)、[docs/standards/development.md](../../standards/development.md) 的新增规则不冲突 |
| 入口可发现性 | `docs/.vitepress/config.ts` 与 [docs/design/governance/index.md](./index.md) 已新增文档入口 |

## 9. 下一轮切片建议

1. 先落 `check-script-governance`，因为它能先回答“脚本目录本身是否健康”，也是所有新增治理脚本的准入前提。
2. 再在 `simple duplicate inventory` 与 `eslint debt inventory` 中二选一并行推进；优先级取决于下一阶段是更偏结构复用还是更偏规则收紧。
3. 注释 inventory 与文档门禁扩面留作第二梯队，避免一开始把脚本治理扩写成新的全仓治理工程。
4. 所有新增脚本在进入 `weekly` 前，都要先给出样例输出和误报说明，不接受“先接入回归、之后再慢慢调”。

## 10. 相关文件

- [docs/plan/backlog.md](../../plan/backlog.md)
- [docs/standards/planning.md](../../standards/planning.md)
- [docs/standards/development.md](../../standards/development.md)
- [docs/guide/development.md](../../guide/development.md)
- [docs/design/governance/eslint-type-debt-tightening.md](./eslint-type-debt-tightening.md)
- [docs/design/governance/docs-translation-freshness-governance.md](./docs-translation-freshness-governance.md)
- [scripts/regression/run-periodic-regression.mjs](../../../scripts/regression/run-periodic-regression.mjs)
- [scripts/docs/check-line-count.mjs](../../../scripts/docs/check-line-count.mjs)
- [scripts/docs/check-source-of-truth.mjs](../../../scripts/docs/check-source-of-truth.mjs)
- [scripts/review-gate/check-duplicate-code.mjs](../../../scripts/review-gate/check-duplicate-code.mjs)
