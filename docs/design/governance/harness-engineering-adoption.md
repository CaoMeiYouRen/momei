# Harness Engineering 方法论引入方案

**时间表**: 2026-05-17 ~ 约 1 - 2 天
**目标**: 基于《从 Vibe Coding 到 Harness Engineering》一文的五层 harness 体系分析，将与本项目现有治理骨架相容、且能跨平台（Claude Code / GitHub Copilot / OpenCode）生效的高优先级层引入，优先补齐"认知层（推理模式切换）"和"交接层（Session 级任务连续性）"两块缺口。边界层的 OS 级 Hooks 不做当前阶段目标，仅记录为候选观察项。

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

- 不引入 OS 级 hooks 拦截（Claude Code 专属，无法跨平台复用）。
- 不搭建完整的语义 RAG 系统（与本项目规模不匹配，且记忆层并非当前瓶颈）。
- 不创建 Claude Code 专属的自定义 slash 命令（`/start`、`/handoff` 等），只做平台无关的 agent 内建流程。
- 不改变现有的 Phase 管理、Todo 体系、Agent 矩阵或验证门禁。
- 不在本次实现边界层的 `scripts/review-gate/` 证据闭环增强（保持为观察项）。

### 搁置观察项（记录供后续评估）

- **边界层 Hooks 等效机制**：GitHub Copilot / OpenCode 无等价能力，当前 Review Gate + 红线声明已覆盖本项目风险面。
- **证据闭环增强**：`generate-evidence.mjs` 增加"证据文件时间戳强制校验"——agent 声称跑过验证时必须附带证据文件路径。搁置原因：需要深入改造 Review Gate 脚本链，超出本次范围。
- **完整语义 RAG**：7000+ chunks 的向量化检索系统。搁置原因：项目文档规模尚不需要，且当前多工具检索组合已能覆盖主力场景。

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

### 4. 受影响文件清单

| 文件 | 操作 | 说明 |
|:---|:---|:---|
| `docs/design/governance/harness-engineering-adoption.md` | 新增 | 本设计文档 |
| `.session/current-task.yaml` | 新增 | Session 任务协议 |
| `.session/runtime-state.json` | 新增 | 运行时状态 |
| `.session/wisdom.md` | 新增 | 跨 session 智慧 |
| `.gitignore` | 修改 | 新增 `.session/` 忽略规则 |
| `.github/agents/full-stack-master.agent.md` | 修改 | 融入推理模式 + Session 感知 |
| `.github/agents/code-auditor.agent.md` | 修改 | 融入根因分析 + 搜索优先模式 |
| `.github/agents/qa-assistant.agent.md` | 修改 | 融入四工具检索哲学 |
| `.github/skills/context-analyzer/SKILL.md` | 修改 | 融入四工具检索哲学 + Session 上下文恢复 |
| `.github/skills/todo-manager/SKILL.md` | 修改 | 融入 Session 级任务协议管理（开局恢复 + 收尾更新） |
| `docs/design/governance/index.md` | 修改 | 新增索引条目 |

### 5. 验证计划

| 层级 | 验证内容 | 方式 |
|:---|:---|:---|
| V0 | 变更范围与风险说明 | 本文档 |
| V1 | Markdown 静态检查 | `pnpm lint:md` 对改动的 md 文件 |
| V1 | agent/skill 文件结构完整性 | 人工 review：YAML frontmatter 正确、引用路径存在 |
| RG | Review Gate | `@code-auditor` 审计，重点核对：agent 职责边界是否漂移、与 AGENTS.md 是否冲突、.claude/ 镜像是否需要同步 |

### 6. 回滚方式

所有改动均为纯文档/agent 定义层改动，不涉及运行时代码。回滚方式：

- 删除 `docs/design/governance/harness-engineering-adoption.md`。
- 将四个 agent/skill 文件 revert 到改动前版本。
- 从 `docs/design/governance/index.md` 移除索引条目。
- `.session/` 目录为 git-ignored，无需回滚操作（本地删除即可）。
- `.gitignore` 中 `.session/` 行可保留（不影响其他行为）。

### 7. 下一轮候选（搁置观察项转正条件）

- **边界层 Hooks**：当 (a) 项目迁移到多租户架构 或 (b) Claude Code 的 hooks 机制被 Copilot/OpenCode 跟进提供等价能力时，重新评估引入。
- **证据闭环增强**：当 Review Gate 中出现 agent 未实际跑验证却声称通过的情况时，升级为 P0 blocker 列入下一阶段。
- **语义 RAG 系统**：当 `docs/` 目录文件数超过 200 个且当前多工具检索组合出现明显效率下降时，重新评估。

## 相关文档

- [Harness Engineering 引入分析（本对话）](../../../AGENTS.md) — 原始分析上下文
- [AI 协作规范](../../standards/ai-collaboration.md)
- [项目规划规范](../../standards/planning.md)
- [专项设计与治理索引](./index.md)
