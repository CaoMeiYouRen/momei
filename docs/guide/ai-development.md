# AI 协同开发指南 (AI-Driven Development Guide)

本指南旨在向开发者介绍如何利用 AI 智能体（Agents）高效参与墨梅博客 项目的开发。我们认为，现代开发应当是“人机协同”的，即由人类定义意图，由 AI 负责执行复杂的机械化任务。

## 1. 核心理念：人机双轨 (Hybrid Workflow)

在墨梅项目中，所有的开发任务都可以分为两种路径：

1.  **传统路径**：适用于简单的文本修改、配置调整或 AI 无法触达的极特殊环境。
2.  **AI 增强路径 (推荐)**：适用于功能开发、Bug 修复、大规模重构和测试编写。

### 1.1 Agent-First 使用方法

本项目默认采用 Agent-First 的使用方式：用户应直接把目标交给 Agent，而不是先花精力区分 script、skill 和 agent。
具体定义请参考 [AGENTS.md](../../AGENTS.md)，执行口径请参考 [AI 协作规范](../standards/ai-collaboration.md)。

## 2. 规则来源与入口分工

在本项目中，AI 协作相关文件分为三类，职责必须分离，避免多个入口同时充当“权威规则源”：

| 类别 | 文件 / 入口 | 作用 | 允许承载的内容 |
| :--- | :--- | :--- | :--- |
| **权威事实源** | `AGENTS.md` | 定义项目级 AI 行为准则、职责边界、PDTFC+ 工作流与安全红线 | 核心规则、角色矩阵、红线、冲突顺序 |
| **平台适配文件** | `CLAUDE.md`、各类 Rules / Instructions 入口、`.claude/` / `.github/` 下的平台镜像 | 说明工具差异与加载方式 | 目录发现顺序、回退路径、能力差异、最小门禁 |
| **开发入口说明** | `README.md`、本文档、文档站导航 | 帮助人类和 AI 快速找到正确入口 | 导览、示例、推荐路径、跳转说明 |

冲突顺序遵循以下原则：

1.  `AGENTS.md` 与其显式引用的项目规范文档优先。
2.  平台适配文件只允许补充工具差异，不得覆盖项目级规则。
3.  开发入口说明只负责导览，不重复定义项目规则。

补充约束：

-   治理上以 `.github/agents/` 与 `.github/skills/` 作为主定义目录；`.claude/` 目录只承担 Claude 兼容镜像职责。
-   若 agent 或 skill 需要调整职责边界，应优先更新主定义与权威文档，再同步镜像，不要只修补某一个平台入口。
-   关于 Skills / Agents 的分层、命名、库存、镜像、生命周期、弃用与清理规则，以 [AI 资产治理规范](../standards/ai-governance.md) 为准。
-   平台或编辑器自带的外部 skill / agent 只作为参考来源或调用入口，不纳入项目内部库存，也不应被镜像到 `.github/` / `.claude/`。

## 3. 智能体体系 (Agent System)

项目内置了一套基于 GitHub Copilot (及其他主流 AI) 的智能体角色，详情请参阅 [AGENTS.md](../../AGENTS.md)。

### 如何选择智能体？

| 任务类型 | 推荐智能体 | 你需要提供什么 | 预期产出 |
| :--- | :--- | :--- | :--- |
| **需求澄清 / 规划** | `@product-manager` | 目标、限制、是否已有 Todo/验收标准 | 范围判定、验收标准、后续交接对象 |
| **默认开发路径：功能 / 修复 / 治理** | `@full-stack-master` | 已确认目标、受影响模块、优先级 | 统一方案、全栈代码改动、收口计划 |
| **基础设施 / 部署 / CI 配置** | `@full-stack-master` | 受影响的部署面、平台约束、风险边界 | 统一方案、配置改动、回归与收口计划 |
| **前端局部专项** | `@frontend-developer` | 页面/组件范围、设计约束、交互要求 | 前端代码、自检记录、待验证页面 |
| **后端局部专项** | `@backend-developer` | 接口/数据模型范围、权限要求 | 后端代码、契约说明、待补测试点 |
| **代码审查** | `@code-auditor` | 变更范围、Todo 验收点、验证结果 | 审计结论、风险清单、放行/退回建议 |
| **编写/优化测试** | `@test-engineer` | 改动模块、行为预期、预算约束 | 定向测试、运行结果、剩余缺口 |
| **文档同步** | `@documentation-specialist` | 已确认实现或规划结论、需同步文档范围 | 文档更新、原文回链、同步说明 |
| **理解项目/提问** | `@qa-assistant` | 你想理解的模块、关键词或文件范围 | 只读分析、证据化回答、推荐阅读路径 |

### 默认推荐路径

1.  需求不够清楚时，先找 `@product-manager`，不要直接要求开发角色“边做边想”。
2.  在本项目里，开发默认交给 `@full-stack-master` 统一考虑、设计和实现，不把前后端默认拆成两条平行主线。
3.  Docker、CI/CD、部署配置和环境治理也默认归 `@full-stack-master` 统一编排，按需复用 `devops-specialist` skill，而不是额外创建并行主责角色。
4.  只有在任务边界已经稳定切清时，才交 `@frontend-developer` 或 `@backend-developer` 处理局部专项。
5.  任何代码改动收尾都要交 `@code-auditor`，不能跳过 Review Gate。
6.  有界面改动时，再交 `@ui-validator`；有测试缺口时，交 `@test-engineer`。
7.  当实现或规划发生变化后，再交 `@documentation-specialist` 做文档沉淀。
8.  如果所用 AI 工具支持 sub-agent、agent team 或等效多代理能力，优先把大范围检索、只读审计、文档差异核对、验证证据收集等高负载环节拆给子代理执行，再由当前主责角色统一收口，避免单 agent 因上下文过载而遗漏约束。

### 避免重复派单

-   不要把 `@full-stack-master` 与前后端专项角色同时作为同一事项的并行主责；如果已经交给全栈角色，就不要再平行拆一份前端/后端实现。
-   不要让 `@code-auditor` 代替 `@test-engineer` 写完整测试，也不要让 `@test-engineer` 代替 `@ui-validator` 做浏览器视觉审计。
-   `@qa-assistant` 是纯只读角色，适合先理解问题，不适合直接开工修改。

## 4. 如何使用 PDTFC+

完整的 PDTFC+ 阶段定义、门禁与职责边界以 [AGENTS.md](../../AGENTS.md) 和 [AI 协作规范](../standards/ai-collaboration.md) 为准。本指南只说明开发者在协作时需要关注的检查点：

1.  **Plan**: 先核对事项是否属于 `todo.md` 当前范围，再决定是否继续执行。
2.  **Do / Audit**: 要求 AI 给出受影响文件和修改范围，不接受无边界扩写。
3.  **Validate / Test**: 检查 Lint、类型、测试或文档构建证据，而不是只听“已验证”。
4.  **Finish**: 确认 `todo.md`、相关文档和平台入口说明是否同步更新。

## 5. 给开发者的建议 (Best Practices)

-   **清晰定义意图**：在调用智能体前，确保你已经明确了“想要什么”。如果需求模糊，请让智能体先进行“需求采访”。
-   **信任但核实 (Trust but Verify)**：AI 会处理繁琐的细节，但架构选择应由你把控。在 AI 进入 `Commit` 阶段前，仔细审查它的 `Do` 阶段产物。
-   **指定上下文**：如果你知道某个功能相关的具体文件，可以在指令中直接告知 AI（如：`参考 server/api/auth.ts 进行修改`），这能极大节省 AI 的检索时间。
-   **优先并行只读工作**：当工具支持多代理时，优先把检索、考古、审计证据汇总、文档对照等只读任务并行化；真正的决策、写入和 Review Gate 结论仍保持单一主责，避免多人同时改同一份事实源。

## 6. 针对不同 AI 工具的适配

虽然本项目以 **GitHub Copilot** 开发为主，但以下工具同样适用：

| 平台 / 工具 | 最小入口 | 作用边界 |
| :--- | :--- | :--- |
| **GitHub Copilot / Copilot Workspace** | `.github/copilot-instructions.md` | 仅补充 Copilot 的加载入口与最小执行门禁；项目规则仍以 `AGENTS.md` 为准。 |
| **Claude Code** | `CLAUDE.md` | 仅补充 Claude 的目录发现顺序、镜像回退与能力差异。 |
| **Cursor** | `.cursor/rules/momei-governance.mdc` | 作为 Rules-only 轻量入口，只引用 `AGENTS.md` 和必要规范，不重复维护整套项目规则。 |
| **Codex** | `AGENTS.md` | Codex 直接复用权威事实源，不再额外创建一份 Codex 专用规则副本，避免双份说明漂移。 |
| **Windsurf 等同类工具** | `AGENTS.md` + 对应平台轻量规则 | 可以沿用 PDTFC+，但平台层只能补充工具差异，不能覆盖项目级规则。 |

补充约束：

1.  Rules / Instructions 文件只能承载“工具差异、触发顺序、最小门禁”，不得把 `AGENTS.md`、开发规范、安全规范整段拷贝进去。
2.  若平台需要额外入口文件，应优先引用 `AGENTS.md`、`docs/standards/development.md`、`docs/standards/security.md`、`docs/standards/testing.md`，而不是再造一份项目级总规范。

---

::: tip 提示
如果你是第一次使用本项目的 AI 工作流，建议尝试让 `@qa-assistant` 向你介绍项目：
> "@qa-assistant 请帮我分析一下这个项目的目录结构和核心技术栈，我是一个新加入的开发者。"
:::
