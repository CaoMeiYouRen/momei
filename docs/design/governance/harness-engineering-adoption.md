# Harness Engineering 方法论引入方案

**时间表**: 2026-05-17 ~ 约 1 - 2 天
**目标**: 基于《从 Vibe Coding 到 Harness Engineering》一文的五层 harness 体系分析，将与本项目现有治理骨架相容、且能跨平台（Claude Code / GitHub Copilot / OpenCode）生效的高优先级层引入，优先补齐"认知层（推理模式切换）"、"交接层（Session 级任务连续性）"，并补充边界层 Hooks / 插件机制的跨平台调研与接入意见。当前已完成 Phase A 的首轮仓库侧实现。

## 背景与问题定义

### 当前项目已有的治理骨架（现状）

本项目经过 37 个阶段的迭代，已形成一套成熟的多智能体协作治理体系：

| 层面 | 已有能力 | 缺口 |
|:---|:---|:---|
| **边界层** | Review Gate (`@code-auditor`)、验证矩阵 V0-V4、安全红线、`generate-evidence.mjs` | 全部在 prompt 层运行，无 OS 级物理拦截 |
| **记忆层** | 规划文档体系 (`docs/plan/`, `docs/design/`)、深度归档、backlog 双轨、`todo-archive.md` | 无自动化语义索引 / RAG |
| **交接层** | Phase 级阶段管理、`todo.md` 进度跟踪、阶段归档标准流程 | 无 Session 级任务连续性 |
| **认知层** | PDTFC+ 工作流、多 agent 矩阵、迭代中途分流规则 | 无基于失败信号的推理模式自动切换 |
| **技能层** | 19 个 skills（`full-stack-master`, `code-quality-auditor`, `todo-manager` 等） | 缺乏 Session 生命周期类 skill |

### 本次要解决的三个具体问题

1. **Bug 排查效率瓶颈**：当前 `@full-stack-master` 或 `@code-auditor` 在遇到 bug 时，容易在同一推理范式内反复尝试，缺乏"换个角度思考"的机制。
2. **跨对话窗口失忆**：每次新开 Claude Code / Copilot / OpenCode 窗口时，agent 是一张白纸。需要重新读取大量文档才能恢复上下文，且无法得知"上一轮尝试过什么方案、为什么失败了"。
3. **检索效率不可预测**：agent 在某些场景下用向量检索代替精确搜索（或反之），导致信息召回不准确。

### 补充问题：为什么仍然希望接入 Hooks

当前治理大量依赖模型在 prompt 内主动遵循规范，这种方式在上下文健康时通常足够，但在以下场景存在失效风险：

1. **上下文膨胀后指令丢失**：当单个 session 长时间运行、出现 compaction、或模型上下文被后续内容稀释时，前面明确声明过的"必须跑验证"、"必须更新 `.session/`"、"必须避免读取敏感文件"等约束，可能不再稳定生效。
2. **规范执行缺乏物理触发点**：目前 Review Gate 与红线主要在事后审计或 prompt 声明层生效，缺少在"工具执行前后"、"会话结束前"、"上下文压缩前"这些关键生命周期点自动触发的强制动作。
3. **跨平台一致性不足**：同一套治理规则若完全依赖模型自行记忆，在 Claude Code、GitHub Copilot、OpenCode 三个平台上的执行稳定性不一致。需要一个尽量贴近生命周期事件的边界层，把高价值规范从"最好这样做"提升为"在事件发生时自动执行"。

## 范围与非目标

### 执行范围

1. **认知层：推理模式融合**
   - 将 7 种推理模式（根因分析、第一性原理、减法、搜索优先、Working Backwards、证据驱动、闭环默认）融入 `@full-stack-master` 和 `@code-auditor` 的 agent 定义。
   - 增加"失败自检"机制：连续 3 次同一方案失败后，agent 必须主动切换推理模式。
   - 推理模式不绑定特定平台，以 agent markdown 指令形式存在。

2. **交接层：Session 级任务协议**
   - 新增 `.session/` 目录，包含 `current-task.yaml`（任务协议）、`runtime-state.json`（运行时状态）、`wisdom.md`（跨 session 智慧）。
   - 更新 `@full-stack-master` agent：新 session 开局先读 `.session/current-task.yaml` 恢复上下文。
   - `.session/` 全部 git-ignored，不进入版本库、不进入深度归档、不进入记忆索引。

3. **记忆层增强：四工具检索哲学**
   - 将"精确字面量→grep、跨词同义→语义、调用链→代码图谱、时间轴→git log"四种不可替代工具的边界写入 `@qa-assistant` agent 和 `context-analyzer` skill。

### 非目标

- 不在本轮文档阶段直接落地全量 hooks 实现；本次先完成跨平台能力调研、边界判断与 phased rollout 建议。
- 不搭建完整的语义 RAG 系统（与本项目规模不匹配，且记忆层并非当前瓶颈）。
- 不创建 Claude Code 专属的自定义 slash 命令（`/start`、`/handoff` 等），只做平台无关的 agent 内建流程。
- 不改变现有的 Phase 管理、Todo 体系、Agent 矩阵或验证门禁。
- 不在本次实现边界层的 `scripts/review-gate/` 证据闭环增强（保持为观察项）。

### 搁置观察项（记录供后续评估）

- **证据闭环增强**：`generate-evidence.mjs` 增加"证据文件时间戳强制校验"——agent 声称跑过验证时必须附带证据文件路径。搁置原因：需要深入改造 Review Gate 脚本链，超出本次范围。
- **完整语义 RAG**：7000+ chunks 的向量化检索系统。搁置原因：项目文档规模尚不需要，且当前多工具检索组合已能覆盖主力场景。

补充结论：此前对边界层的判断已经过时。根据 2026-05-18 的官方文档，Claude Code 原生支持 hooks，GitHub Copilot 也已原生支持 hooks，OpenCode 虽非同名功能，但可通过插件机制对 `tool.execute.before/after`、`session.compacted`、`session.idle` 等事件实现等效治理。因此，Hooks 不应继续被定义为"跨平台不可复用"，而应升级为"具备跨平台接入路径，但需控制实施范围与阻断力度"。

## 方案设计

### 1. 认知层：推理模式

#### 1.1 七种推理模式（与项目方法论融合后）

| 模式 | 适用场景 | 本项目触发条件 | 核心方法 |
|:---|:---|:---|:---|
| **根因分析** | 修 bug、查事故、审计发现阻塞项 | `@code-auditor` 发现 bug；用户报告异常行为 | 5-Why 追问 + 扫描同类 bug + 查 git log 定位引入 commit |
| **第一性原理** | 干净新建功能、全新模块设计 | `@full-stack-master` P 阶段，设计未受现有实现约束的新能力 | 质疑所有假设 → 删除不必要的 → 简化剩余 → 加速核心路径 → 自动化重复 |
| **减法模式** | 重构、清理类型债、结构复用收敛 | 触发 backlog 长期主线（ESLint/类型债、重复代码、注释治理） | 删除优先，不增加新抽象；先压缩再提取 |
| **搜索优先** | 根因未知、需要先了解现状再动手 | 接手不熟悉的模块；错误信息指向未知领域 | 先查历史决策（`docs/design/`, `docs/plan/`）→ 再查代码实现 → 最后才动手改 |
| **Working Backwards** | 新模块设计、用户体验优化 | `@product-manager` 需求分析；涉及用户可见行为变更 | 从用户终态倒推 → 写验收标准 → 反推实现路径 |
| **证据驱动** | 性能测量、质量审计、覆盖率治理 | 触发 V3/V4 验证层；性能基线检查 | 用数据替代直觉：先跑 benchmark/lighthouse/coverage → 确定缺口 → 收敛改动 |
| **闭环默认** | 部署、运维、配置变更 | `devops-specialist` 相关任务；环境变量变更 | 定目标（验收标准）→ 追过程（验证矩阵）→ 拿结果（证据链） |

#### 1.2 失败自检机制

嵌入 `@full-stack-master` agent 的自检逻辑：

```
在当前 session 中，如果你尝试用同一种方案连续 3 次未能解决问题，
必须执行以下"推理模式切换"流程：
1. 向用户声明当前方案失败，说明失败在哪一步、试了什么。
2. 从 7 种推理模式中至少列举 2 个替代模式作为候选。
3. 选择最匹配的一个，解释切换理由。
4. 用新模式重新分析问题。
```

#### 1.3 平台兼容性

推理模式写在 agent markdown 文件中。Claude Code、GitHub Copilot、OpenCode 均能读取 agent 定义文件并遵循。不依赖任何平台专属机制。

### 2. 交接层：Session 级任务协议

#### 2.1 与现有体系的关系

```
现有体系（不变）：
  docs/plan/todo.md          → 阶段级任务清单（权威事实源，中文化，已提交）
  docs/plan/roadmap.md       → 阶段规划与归档结论
  docs/plan/todo-archive.md  → 历史阶段归档
  docs/plan/backlog.md       → 长期积压项

新增体系（Session 级，git-ignored）：
  .session/current-task.yaml  → Session 级任务协议（每 session 重写）
  .session/runtime-state.json → 运行时状态（hooks/scripts 自动维护）
  .session/wisdom.md          → 跨 session 值得复用的发现
```

**关键架构边界**：`.session/` 内的文件**永不进入版本库、永不进入深度归档、永不进入语义索引**。这是任务态（每 session 重写）而非历史态（长期留存）。此边界防止当前任务状态污染长期记忆，与 [planning.md §4.3 不可逆原则](../../standards/planning.md) 的方向一致。

#### 2.2 `current-task.yaml` 结构

```yaml
# Session 任务协议 — 每次 session 结尾由 agent 更新，新 session 开局由 agent 读取
session:
  id: "2026-05-17-001"          # 日期 + 序号
  started_at: "2026-05-17T14:00:00+08:00"
  updated_at: "2026-05-17T16:30:00+08:00"

current_phase: "第三十七阶段"    # 当前所处的阶段（对齐 todo.md）

active_plan:
  feature: "Harness Engineering 方法论引入"  # 当前功能/任务
  summary: "引入推理模式 + Session 交接层 + 四工具检索哲学"  # 一句话摘要

progress:
  completed:                     # 已完成的步骤
    - "创建设计文档"
    - "创建 .session/ 基础设施"
  in_progress:                   # 进行中的步骤（最多一项）
    - "更新 @full-stack-master agent"
  blocked_on: []                 # 阻塞原因（如有）

next_steps:                      # 下一步（3 项以内）
  - "更新 @code-auditor agent"
  - "更新 @qa-assistant agent"
  - "同步 .claude/ 镜像"

cognitive:                       # 认知状态（仅本 session 有失败时写入）
  failure_count: 0
  active_mode: "第一性原理"
  tried_approaches: []
  switched_from: null
```

#### 2.3 `runtime-state.json` 结构

```json
{
  "session_id": "2026-05-17-001",
  "total_tool_calls": 42,
  "failure_count": 0,
  "active_mode": "第一性原理",
  "command_history": [
    "Bash(pnpm lint)",
    "Read(AGENTS.md)"
  ],
  "file_edits": [
    "docs/design/governance/harness-engineering-adoption.md"
  ],
  "last_verification": {
    "lint": { "timestamp": "2026-05-17T15:00:00+08:00", "result": "pass" },
    "typecheck": { "timestamp": "2026-05-17T15:01:00+08:00", "result": "pass" }
  }
}
```

#### 2.4 `wisdom.md` 结构

```markdown
# Session Wisdom (跨 Session 复用发现)

> 仅在发现值得跨 session 复用的非平凡 pattern/bug/decision 时记录。
> 无则保持空文件。不要为了填而填。

## 2026-05-17

- [pattern] xxx 类问题的通用排查路径: ...
- [decision] 选择方案 A 而非 B 的原因: ...
```

#### 2.5 Agent 开局 / 收尾流程

**新 Session 开局**（嵌入 `@full-stack-master` agent）：
```
每次新 session 启动时，按以下顺序恢复上下文：
1. 读取 .session/current-task.yaml → 了解当前任务、进度、下一步
2. 读取 .session/runtime-state.json → 了解失败计数、当前推理模式
3. 读取 .session/wisdom.md → 了解跨 session 值得复用的发现
4. 读取 docs/plan/todo.md → 确认阶段级任务上下文
5. 给用户输出一份不超过 10 行的 briefing：
   - 当前阶段 + 任务
   - 已完成步骤
   - 下一步
   - 上次 session 的认知状态（失败次数、推理模式）
```

**Session 收尾**（嵌入 `@full-stack-master` agent）：
```
每次 session 结束前（用户说"收工""结束""今天到这"或需要切换任务时）：
1. 更新 .session/current-task.yaml 的 progress、next_steps
2. 若本 session 有失败，更新 cognitive 子段
3. 若发现值得复用的 pattern/decision，追加到 .session/wisdom.md
4. 更新 .session/runtime-state.json 的 last_verification
5. 给用户输出 5 行以内的收尾摘要
```

#### 2.6 平台兼容性

`.session/` 目录中的文件是标准 YAML/JSON/Markdown 格式。Claude Code、GitHub Copilot、OpenCode 均能通过文件读写工具访问。不需要任何平台专属机制。

Claude Code 特殊说明：Claude Code 本身有跨 session 的上下文压缩（compaction）能力，但压缩后的内容是高噪音的对话流水账。本协议的 `.session/` 文件是结构化的结论摘要，质量高于自动压缩。两者可以共存，但 default 开局路径以 `.session/` 为准。

### 3. 记忆层增强：四工具检索哲学

#### 3.1 四种信息需求与正确工具

| 场景 | 正确工具 | 用错工具的后果 |
|:---|:---|:---|
| 精确字面量（字段名/URL/环境变量） | `grep` / `Glob` | 语义检索给出模糊 top-K，全错 |
| 跨词同义召回（业务术语↔代码术语） | 语义检索（无实现时退化为人工对照文档） | `grep` 0 hits |
| 调用链 / import 关系 | AST 图谱（无实现时退化为手动 `grep import`） | 语义检索不理解语法结构 |
| 谁何时改过什么 | `git log` / `git blame` | 其他工具没有时间轴 |

#### 3.2 设计原则（写入 agent 指令）

```
在需要检索信息时，先判断问题属于哪种类型，再选择对应工具：
- 精确字面量 → 用 Grep/Glob（不是语义搜索）
- 跨词同义 → 先查 docs/ 文档目录，再用语义关联
- 调用链 → 先查文件 import 关系，再读引用目标
- 时间轴 → 用 git log/blame

不要写"智能路由器"（自动判断用哪个工具的代码）。
让模型自己判断，今天的模型分不清的场景，明年的模型能分清。
```

### 4. 边界层补充：Hooks / 插件接入意见

#### 4.1 官方能力调研结论

| 平台 | 官方机制 | 配置位置 | 生命周期覆盖 | 是否可阻断 | 与本项目的关系 |
|:---|:---|:---|:---|:---|:---|
| **Claude Code** | 原生 hooks | `.claude/settings.json` | `SessionStart`、`PostToolUse`、`Stop`、异步 hooks、compaction 相关 hooks | 部分可阻断；异步 hooks 不可阻断 | 适合做会话开局恢复、写文件后异步验证、Stop 前收尾提醒 |
| **GitHub Copilot** | 原生 hooks | `.github/hooks/*.json`，以及 `.github/copilot/settings.json` 的 inline hooks | `sessionStart`、`sessionEnd`、`preToolUse`、`postToolUse`、`preCompact`、`agentStop`、`subagentStop` 等 | `preToolUse` 可 allow / deny / modify；`agentStop` / `subagentStop` 可 block | 适合做仓库级规范固化，且可同时覆盖 CLI 与 cloud agent |
| **OpenCode** | 插件事件机制（hooks 等效层） | `.opencode/plugins/` 或 `opencode.json` npm 插件 | `tool.execute.before/after`、`session.compacted`、`session.idle`、`session.updated`、`permission.asked` 等 | 可在插件中抛错或改写输出，具备事实上的阻断能力 | 适合用薄适配插件实现与 Hooks 类似的边界层自动化 |

关键信息摘要：

- **Claude Code**：官方文档已明确支持异步 hooks、`additionalContext` 回灌、Windows PowerShell hook、以及 `.claude/settings.json` 仓库级配置。说明它不仅能做本地命令包装，也能在写文件、Stop、压缩前后等生命周期点补充治理。
- **GitHub Copilot**：官方文档已明确支持仓库级 `.github/hooks/*.json` 配置、`preToolUse` 决策控制、`agentStop/subagentStop` 强制继续一轮，以及 `sessionStart/sessionEnd/preCompact` 等事件。此前"Copilot 没有 hooks"这一前提已失效。
- **OpenCode**：虽然名义上是插件而非 hooks，但其插件系统可订阅工具前后、会话压缩、空闲、权限等事件，还能抛错中断或改写输出，在治理语义上已足以承担 Hooks 的角色。

#### 4.2 为什么建议接入，但不建议一步到位强拦截

本项目现在真正缺的不是"更多 prompt 规则"，而是把少数高价值规范挂到稳定生命周期点上自动执行。Hooks 的价值不在于把所有规范都变成拦截器，而在于给以下三类高风险动作增加物理触发点：

1. **会话开局恢复**：读取 `.session/current-task.yaml`、`.session/runtime-state.json`、`.session/wisdom.md` 并生成 briefing，避免新窗口靠模型自行想起要恢复上下文。
2. **工具后最小闭环**：在 `Write/Edit/Create` 后自动记录改动文件、更新 `.session/runtime-state.json`，并触发最小化验证或至少提醒待验证状态，降低"改了但忘跑检查"的概率。
3. **压缩 / 收尾前持久化**：在 `preCompact`、`session.compacted`、`Stop`、`sessionEnd` 等事件前后刷新 `.session/` 中的结构化状态，降低 compaction 后命令丢失与任务断片风险。

但不建议一步到位做"全量强拦截"，原因也很明确：

- 三个平台在阻断语义上不完全一致。Claude 的异步 hooks 适合补充上下文，不适合强阻断；Copilot cloud agent 的某些事件与 CLI 行为不同；OpenCode 插件虽然灵活，但实现成本更高。
- hooks / 插件普遍具备 **fail-open** 或脚本失败被跳过的特性，不能把它们误当成绝对安全边界。
- `Stop` / `agentStop` 类阻断如果设计不当，容易出现无限循环、误阻塞和工作流摩擦。

因此，推荐把 Hooks 定位为"规范执行放大器"而非"唯一治理手段"：prompt 层继续表达目标，hooks 层只承接最关键、最容易因为上下文膨胀而丢失的动作。

#### 4.3 建议的接入架构

推荐采用"共享脚本 + 平台薄适配"模式，而不是三套平台各写一套逻辑：

```text
共享治理逻辑：
  scripts/ai-hooks/
    session-governance.mjs
    session-governance-shared.mjs

平台薄适配：
  .claude/settings.json
  .github/hooks/momei.json
  .opencode/plugins/session-governance.js
```

设计原则：

1. **共享脚本负责事实逻辑**：统一读写 `.session/`、决定是否需要提示验证、决定哪些文件属于敏感路径。
2. **平台配置只做事件绑定**：Claude / Copilot 的 JSON 只负责把事件映射到共享脚本；OpenCode 插件只做事件转发和参数归一化。
3. **保持 `.session/` 为唯一任务态事实源**：hooks 只更新 `.session/`，不另起一套隐藏状态文件，避免交接层再次分叉。
4. **阻断只用于高价值、低误伤的规则**：例如阻止直接读取 `.env`、阻止在未记录验证状态时结束 session；不建议对所有写文件动作都做硬阻断。

#### 4.4 分阶段接入意见

**Phase A：只做非阻断自动化，优先解决命令丢失**

- `sessionStart` / `SessionStart` / `session.created`：自动生成 session briefing，恢复 `.session/` 上下文。
- `postToolUse` / `PostToolUse` / `tool.execute.after`：记录改动文件、写入 `runtime-state.json`、标记 `last_verification` 为 stale。
- `preCompact` / `session.compacted`：把当前任务、已编辑文件、未完成验证写回 `.session/`，优先解决 compaction 丢失。
- `sessionEnd` / `Stop` / `session.idle`：自动生成 5 行以内的收尾摘要草稿，写入 `.session/current-task.yaml`。

这是最值得优先落地的一层，因为它直接针对当前痛点：模型忘记执行规范、上下文压缩后任务态丢失。

#### 4.4.1 Phase A 当前仓库侧实现状态（2026-05-18）

本轮已完成首批 Phase A 的仓库侧实现，当前实现如下：

1. **Claude Code**：已在 `.claude/settings.json` 绑定 `SessionStart`、`PostToolUse`、`PreCompact`、`Stop` 四类事件，统一调用 `scripts/ai-hooks/session-governance.mjs`。
2. **GitHub Copilot**：已在 `.github/hooks/momei.json` 绑定 `sessionStart`、`postToolUse`、`preCompact`、`sessionEnd` 四类事件，统一调用同一脚本。
3. **OpenCode**：已在 `.opencode/plugins/session-governance.js` 中绑定 `session.created`、`session.compacted`、`session.idle`、`tool.execute.after` 与 `experimental.session.compacting`，并复用同一份共享逻辑。
4. **共享状态层**：`scripts/ai-hooks/session-governance-shared.mjs` 已负责 `.session/` 自举、`current-task.yaml` / `runtime-state.json` 更新、session briefing 生成、写后 stale 标记、compaction / idle handoff 摘要生成。

当前实现边界：

- **Claude / Copilot**：仓库侧已具备 session 开局恢复、写后状态跟踪、compaction 前刷盘、结束前 handoff 摘要写入的基础能力；但当前文档仍不把这视为“平台侧真实事件 smoke test 已完成”，真实触发链路仍需在对应客户端内补跑一次。
- **OpenCode**：已具备 `.session` 自举、写后状态跟踪、`session.idle` / `session.compacted` 收尾，以及 `experimental.session.compacting` 的 compaction 上下文注入；但根据当前公开插件文档，尚未看到与 Claude / Copilot 等价的“session.created 时直接向模型注入 additional context”接口，因此目前在 `session.created` 上采用“生成 briefing + 写入 `.session` + 输出应用日志”的近似实现。

**Phase B：引入轻度约束，限制高风险漏执行**

- 针对 `.env`、密钥文件、部署配置等敏感路径，在工具前置事件中做 deny 或显式告警。
- 当本轮会话有文件改动但没有任何验证记录时，在 `Stop` / `agentStop` / `session.idle` 注入阻断性提醒，要求先补一轮最小验证或明确记录跳过原因。
- 当用户触发发布、部署、迁移类命令时，自动附加证据链检查提示，而不是仅靠 agent 自觉回忆。

**Phase C：只在确有收益时启用硬阻断**

- 若 Review Gate 持续发现"声称已验证但实际未跑"、"跳过 `.session/` 收尾"、"敏感文件被误读写"等高频问题，再把少数规则提升为硬阻断。
- 硬阻断应限定在极小集合内，并要求每条规则都能回答：误伤成本是多少，如何逃生，如何在三平台上保持行为大体一致。

#### 4.5 本项目的具体接入意见

结论不是"继续搁置 hooks"，而是：**建议接入，但以 Session 连续性和最小闭环为主线，先软后硬，先共享脚本后平台适配。**

具体意见如下：

1. **应当接入**：因为三平台都已经存在可用事件面，且当前 prompt-only 治理确实暴露出上下文膨胀后的命令丢失问题。
2. **第一优先级不是安全拦截，而是任务态持久化**：先解决 `.session/` 自动维护、compaction 前刷盘、会话开局 briefing，这比一开始就拦截所有命令更符合当前痛点。
3. **Copilot 现在应视为一等公民**：仓库已经存在 [`.github/hooks/momei.json`](./../../../.github/hooks/momei.json) 占位文件，后续可以直接在此处接入仓库级 hooks，而不需要把 Copilot 视为无等价能力平台。
4. **OpenCode 不必因为没有原生 hooks 而被排除**：把 `.opencode/plugins/` 视为它的等效边界层即可，但要控制插件代码体积，避免反过来引入一套难维护的小框架。
5. **不要把 hooks 当成单一真理**：prompt 规则、Review Gate、验证矩阵、`.session/` 协议仍然是主骨架；hooks 只是把关键动作从"靠记忆"抬升到"靠事件"。
6. **文档结论必须区分“仓库侧实现”与“平台侧验证”**：配置写入仓库不等于三端真实事件链路已经全部验证通过；客户端内 smoke test 应作为下一步证据补齐项保留。

#### 4.6 Phase A 已实施文件

本轮已新增或修改以下文件：

| 文件 | 操作 | 说明 |
|:---|:---|:---|
| `.github/hooks/momei.json` | 修改 | 定义 Copilot 仓库级 hooks 绑定 |
| `.claude/settings.json` | 新增 | 定义 Claude Code 仓库级 hooks |
| `.opencode/package.json` | 新增 | 固定 OpenCode 插件目录的 ESM 边界 |
| `.opencode/plugins/session-governance.js` | 新增 | OpenCode 的 Phase A session 插件适配层 |
| `scripts/ai-hooks/session-governance.mjs` | 新增 | Claude / Copilot 共用的 CLI hook 入口 |
| `scripts/ai-hooks/session-governance-shared.mjs` | 新增 | 三端共用的 `.session` 自举与状态写回逻辑 |

### 5. 受影响文件清单

| 文件 | 操作 | 说明 |
|:---|:---|:---|
| `docs/design/governance/harness-engineering-adoption.md` | 新增 | 本设计文档 |
| `.claude/settings.json` | 新增 | Claude Code Phase A hooks 配置 |
| `.github/hooks/momei.json` | 修改 | Copilot Phase A hooks 配置 |
| `.opencode/package.json` | 新增 | OpenCode 插件目录 ESM 边界 |
| `.opencode/plugins/session-governance.js` | 新增 | OpenCode Phase A session 插件 |
| `.session/current-task.yaml` | 新增 | Session 任务协议 |
| `.session/runtime-state.json` | 新增 | 运行时状态 |
| `.session/wisdom.md` | 新增 | 跨 session 智慧 |
| `.gitignore` | 修改 | 新增 `.session/` 忽略规则 |
| `package.json` | 修改 | 新增 `ai:session:hook` 稳定入口 |
| `scripts/ai-hooks/session-governance.mjs` | 新增 | 统一的 hook CLI 入口 |
| `scripts/ai-hooks/session-governance-shared.mjs` | 新增 | `.session` 自举与状态同步核心逻辑 |
| `.github/agents/full-stack-master.agent.md` | 修改 | 融入推理模式 + Session 感知 |
| `.github/agents/code-auditor.agent.md` | 修改 | 融入根因分析 + 搜索优先模式 |
| `.github/agents/qa-assistant.agent.md` | 修改 | 融入四工具检索哲学 |
| `.github/skills/context-analyzer/SKILL.md` | 修改 | 融入四工具检索哲学 + Session 上下文恢复 |
| `.github/skills/todo-manager/SKILL.md` | 修改 | 融入 Session 级任务协议管理（开局恢复 + 收尾更新） |
| `docs/design/governance/index.md` | 修改 | 新增索引条目 |

### 6. 验证计划

| 层级 | 验证内容 | 方式 |
|:---|:---|:---|
| V0 | 变更范围与风险说明 | 本文档 |
| V1 | Markdown 静态检查 | `pnpm lint:md` 对改动的 md 文件 |
| V1 | hooks / 插件配置语法 | JSON 解析、Node import、自定义脚本静态错误检查 |
| V2 | session 开局与写后状态同步 | 手动伪造 `session-start` / `post-tool-use` payload 调用 `scripts/ai-hooks/session-governance.mjs` |
| V2 | 治理配置完整性 | `pnpm ai:check` |
| RG | Review Gate | `@code-auditor` 审计，重点核对：agent 职责边界是否漂移、与 AGENTS.md 是否冲突、.claude/ 镜像是否需要同步 |

#### 6.1 当前已执行验证（2026-05-18）

- 已手动伪造 `session-start` payload 调用 `node scripts/ai-hooks/session-governance.mjs --platform=manual --event=session-start`，确认 briefing 生成与 `.session/current-task.yaml` 阶段同步可用。
- 已手动伪造 `post-tool-use` payload 调用 `node scripts/ai-hooks/session-governance.mjs --platform=manual --event=post-tool-use`，确认写后 stale 标记与 `runtime-state.json` 更新可用。
- 已执行 Node import / JSON 解析自检，确认 `.claude/settings.json`、`.github/hooks/momei.json` 与 `.opencode/plugins/session-governance.js` 语法有效。
- 已执行 `pnpm ai:check` 与定向 `lint-md`，通过仓库治理检查与本轮文档静态检查。

### 7. 回滚方式

本轮改动主要是 hooks / 插件配置与本地 `.session` 状态同步脚本，不涉及 Nuxt 运行时代码。回滚方式：

- 删除 `docs/design/governance/harness-engineering-adoption.md`。
- 删除 `.claude/settings.json`、`.opencode/package.json`、`.opencode/plugins/session-governance.js`。
- 将 `.github/hooks/momei.json`、`package.json` 与 `scripts/ai-hooks/*` revert 到改动前版本。
- `.session/` 目录为 git-ignored，本地删除即可恢复到无任务态状态。
- 从 `docs/design/governance/index.md` 移除索引条目。
- `.gitignore` 中 `.session/` 行可保留（不影响其他行为）。

### 8. 下一轮候选（搁置观察项转正条件）

- **边界层 Hooks / 插件接入**：已从"搁置观察项"升级为下一轮可执行候选。转正前提不再是"等待跨平台等价能力出现"，而是先完成共享脚本边界设计、阻断规则最小集合定义、以及三平台事件映射的最小样机验证。
- **证据闭环增强**：当 Review Gate 中出现 agent 未实际跑验证却声称通过的情况时，升级为 P0 blocker 列入下一阶段。
- **语义 RAG 系统**：当 `docs/` 目录文件数超过 200 个且当前多工具检索组合出现明显效率下降时，重新评估。

## 相关文档

- [Harness Engineering 引入分析（本对话）](../../../AGENTS.md) — 原始分析上下文
- [AI 协作规范](../../standards/ai-collaboration.md)
- [项目规划规范](../../standards/planning.md)
- [专项设计与治理索引](./index.md)
- https://code.claude.com/docs/zh-CN/hooks
- https://docs.github.com/en/copilot/reference/hooks-reference?versionId=free-pro-team%40latest&productId=copilot
- https://opencode.ai/docs/zh-cn/plugins/
