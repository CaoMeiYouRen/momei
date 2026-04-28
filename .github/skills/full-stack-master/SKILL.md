---
name: full-stack-master
description: 全局一体化开发与协作工作流技能，覆盖需求评估、开发、测试、质量、文档、提交、发布等全链路阶段，可集成所有基础原子技能，实现 PDTFC+ 循环自动化及分工合作优化。
metadata:
    internal: true
---

# Full Stack Master Workflow Skill

## 一、能力定位 (Capability)

- **工作流自动编排**：串联需求设计开发测试质量文档提交审核发布的全链路。
- **Git Worktree 编排**：根据任务维度（dev/test/fix/docs）自动选择物理隔离的工作目录，加速并行开发。
- **技能聚合**：集成所有核心原子技能（Todo Manager、Technical Planning、Backend Logic Expert、Vue Frontend Expert、Database Expert、Code Quality Auditor、Test Engineer、UI Validator、Conventional Committer、DevOps Specialist）。
- **可复用与可拓展**：可合并新场景（如数据库迁移、API 变更、运营发布等），支持多项目切换。
- **分阶段接棒/派单**：可手动或脚本分配阶段任务给对应技能或专项 agent。

## 二、强制参考文档 (Mandatory Documentation)

在执行任何写操作 or 决策前，必须确保已读取并理解以下文档的最新内容：

- **全周期基石**：[AGENTS.md](../../../AGENTS.md) (安全红线与身份)、[AI 协作规范](../../../docs/standards/ai-collaboration.md)、[Git 规范](../../../docs/standards/git.md)
- **规划与任务**：[项目规划](../../../docs/plan/roadmap.md)、[待办事项](../../../docs/plan/todo.md)、[项目规划规范](../../../docs/standards/planning.md)
- **开发与设计**：[开发规范](../../../docs/standards/development.md)、[API 规范](../../../docs/standards/api.md)、[UI 设计](../../../docs/design/ui.md)
- **安全与质量**：[安全规范](../../../docs/standards/security.md)、[测试规范](../../../docs/standards/testing.md)

## 三、统一执行原则 (Shared Execution Principles)

- 本节只保留全栈编排视角下的执行摘要，不再复制完整项目级规则；权威口径分别以 [AI 协作规范](../../../docs/standards/ai-collaboration.md)、[开发规范](../../../docs/standards/development.md) 与 [测试规范](../../../docs/standards/testing.md) 为准。
- 编排默认遵循四步判断顺序：先暴露假设，再选最小方案，再限制改动范围，最后用最小充分验证决定是否继续扩写。

## 四、标准 PDTFC+ 2.1 工作流 (Standard Workflow)

1. **P (Plan) - 需求分析与规划**
    1. **读取文档**：确认 `todo.md`、`roadmap.md`、当前验收标准与必要规范。
    2. **范围核对**：判断事项是否属于当前待办、当前验收标准或当前阶段规划；若不属于，先按 `planning.md` 完成插队或延期分流。
    3. **方案设计**：输出受影响文件清单、验证矩阵和阶段交接顺序；需要时优先并行拆分只读检索、审计证据收集和文档对照。
    4. **任务落点**：仅对允许执行的事项进入 Do；若仍处于评估阶段，不得提前展开完整实现。
    - **技能**：`requirement-analyst`、`todo-manager`、`technical-planning`、`context-analyzer`

2. **D (Do) - 开发实现**
    1. **单一主责**：同一事项在同一时点只保留一个实现主责；默认由 `full-stack-master` 统筹，边界稳定后才委派前后端专项角色。
    2. **核心实现**：遵循 [开发规范](../../../docs/standards/development.md)；若涉及持久化，优先处理数据模型或实体，再落业务逻辑和界面。
    3. **基础设施例外**：涉及 Docker、CI/CD、部署、构建环境或运维脚本时，仍由全栈主责统一编排，并按需复用 `devops-specialist`。
    4. **发布脚本入口**：发布前统一校验优先使用 `scripts/release/pre-release-check.mjs`；涉及 Review Gate 证据时，优先使用 `scripts/review-gate/generate-evidence.mjs` 生成初始记录，再进入人工审计或补充证据。
    5. **范围闸门**：开发过程中若发现新的优化点或非阻塞事项，必须返回 P 阶段重新分流，不得静默扩写当前任务。
    - **技能**：`database-expert`、`backend-logic-expert`、`vue-frontend-expert`、`nuxt-code-editor`、`devops-specialist`

3. **A (Audit) - 审计放行**
    1. **Review Gate**：所有代码、文档、配置、脚本与治理定义改动都必须进入 `code-quality-auditor` 审计。
    2. **安全与一致性**：同时核对安全边界、Todo 验收点、验证矩阵、证据链与剩余风险。
    3. **退回策略**：若审计失败或发现超出当前范围的新问题，退回 D 或回流 P，而不是带着 blocker 进入后续阶段。
    - **技能**：`code-quality-auditor`、`security-guardian`

4. **V (Validate) - 浏览器与流程验证**
    1. **界面验证**：涉及页面渲染、交互流程或视觉行为时，使用 `ui-validator` 完成浏览器侧验证。
    2. **跳过规则**：若当前事项没有 UI 面或流程层影响，必须显式记录 V 阶段为何可跳过，而不是默认省略。
    - **技能**：`ui-validator`

5. **T (Test) - 测试与回归**
    1. **先读测试规范**：执行测试前必须读取 [测试规范](../../../docs/standards/testing.md)。
    2. **按风险选验证**：根据改动类型和预算选择定向测试、全量测试、coverage、`verify` 或性能验证，不得一刀切全量执行。
    3. **测试回流**：若测试新增了代码改动或暴露 blocker，必须回到 D，并重新经过 A 阶段审计。
    - **技能**：`test-engineer`、`code-quality-auditor`

6. **F (Finish) - 文档与收口**
    1. **文档同步**：更新 `todo.md` 状态，并按需同步 README、Guide、Standards、Design、Plan 文档。
    2. **证据收口**：发布或治理收口时，优先用 `scripts/review-gate/generate-evidence.mjs` 刷新 Review Gate 证据文件，再汇总验证记录、Review Gate 结论、未覆盖边界与后续补跑计划。
    3. **提交说明**：`Commit` 不是本技能默认的独立主阶段；只有在用户明确要求提交，或当前流程被明确委派为提交流程时，才在 F 阶段收口后调用 `conventional-committer`。
    - **技能**：`documentation-specialist`、`todo-manager`、`conventional-committer`

## 五、需求挖掘方法论 (Intent Extraction Methodology)

1. **逐级递进**：先锁定整体结构和目标，再深入到具体实现细节。
2. **单点突破**：一次仅问一个问题，待用户回答后再进行下一步追问。
3. **循环校验**：当用户回答不清晰时，尝试换一种表述方式进行确认。
4. **意图抽离**：分析用户想要什么背后的为什么，提供更优专业建议。

## 六、技能引用（Each Sub-Skill Reference）

- [requirement-analyst](../requirement-analyst/SKILL.md)
- [todo-manager](../todo-manager/SKILL.md)
- [technical-planning](../technical-planning/SKILL.md)
- [context-analyzer](../context-analyzer/SKILL.md)
- [database-expert](../database-expert/SKILL.md)
- [backend-logic-expert](../backend-logic-expert/SKILL.md)
- [vue-frontend-expert](../vue-frontend-expert/SKILL.md)
- [nuxt-code-editor](../nuxt-code-editor/SKILL.md)
- [code-quality-auditor](../code-quality-auditor/SKILL.md)
- [security-guardian](../security-guardian/SKILL.md)
- [ui-validator](../ui-validator/SKILL.md)
- [test-engineer](../test-engineer/SKILL.md)
- [documentation-specialist](../documentation-specialist/SKILL.md)
- [conventional-committer](../conventional-committer/SKILL.md)
- [devops-specialist](../devops-specialist/SKILL.md)

## 七、编写规范 (Authoring Rules)

1. **Imperative & Structured**
   - 用动词+目标描述标准化每一步/每个技能的 usage section。
   - 禁止冗长废话和流程介绍型文字。

2. **明确输入输出**
   - 每步须说明本阶段输入依赖、输出产物（如文件路径、文档链接）。
   - 例：输入：docs/plan/，输出：docs/design/xx.md。

3. **可链式组合**
   - 每步技能应允许独立、或作为全局 master 调用链局部片段。
   - 部分技能支持多角色协同（如测试、文档可并行）。

4. **安全检查与通用异常处理**
   - 强行插入 typecheck、lint 等质量关卡，禁止在未检测前进入提交/发布环节。
   - 明确安全等级和数据保护点。
    - 对迭代中途新增事项强制执行“先规划、后实现”的闸门，禁止边做边扩 scope。

5. **国际化与文档优先**
   - 所有工作流/技能创建应默认兼容 i18n 和标准文档同步动作。

## 八、模板用法 (Usage Example)

```yaml
workflow:
  - step: "需求分析"        # context-analyzer, documentation-specialist
  - step: "功能开发"        # nuxt-code-editor
  - step: "UI 验证"         # ui-validator
  - step: "质量检测"        # code-quality-auditor, security-guardian
  - step: "功能提交"        # conventional-committer
  - step: "测试补充"        # test-engineer
  - step: "测试提交"        # conventional-committer
```
