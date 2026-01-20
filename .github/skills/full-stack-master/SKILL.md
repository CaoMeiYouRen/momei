---
name: full-stack-master
description: 全局一体化开发与协作工作流技能，覆盖需求评估、开发、测试、质量、文档、提交、发布等全链路阶段，可集成所有基础原子技能，实现 PDTFC+ 循环自动化及分工合作优化。
version: 1.0.0
author: CaoMeiYouRen & Copilot
appliesTo: "**/*"
---

# Full Stack Master Workflow Skill

## 一、能力定位 (Capability)

- **工作流自动编排**：串联“需求→设计→开发→测试→质量→文档→提交→审核→发布”的全链路。
- **技能聚合**：集成所有基础子技能（Context Analyzer、Nuxt Code Editor、Test Engineer、Quality Guardian、Documentation Specialist、Code Reviewer、Conventional Committer）。
- **可复用与可拓展**：可合并新场景（如数据库迁移、API 变更、运营发布等），支持多项目切换。
- **分阶段接棒/派单**：可手动或脚本分配阶段任务给对应技能或专项 agent。

## 二、标准工作流 (Workflow Steps)

1. **需求分析 & 技术调研**
    - 任务：理解 issue/需求卡，分析 docs/plan/todo.md。
    - 技能：`context-analyzer`、`documentation-specialist`
    - 产出：需求澄清、任务分解清单。

2. **方案设计 & 文档同步**
    - 任务：设计 API/架构/组件声明，整理至 docs/design/。
    - 技能：`documentation-specialist`
    - 产出：设计文档更新，技术细节确定。

3. **测试编写（TDD），用例驱动开发**
    - 任务：先行/同步写 Vitest 用例，覆盖正反例与边界。
    - 技能：`test-engineer`
    - 产出：tests/ 目录下用例。

4. **代码开发 & 组件实现**
    - 任务：实现 features/bugfix/模块代码（Vue3/TS/SCSS）。
    - 技能：`nuxt-code-editor`
    - 产出：新/修改的代码文件。

5. **质量检测（Lint/Typecheck/覆盖率）**
    - 任务：运行并修复 lint、typecheck、单元测试覆盖不足等问题。
    - 技能：`quality-guardian`
    - 产出：无告警报告，CI/CD 通过。

6. **文档 & 计划同步**
    - 任务：所有变更如有影响须同步 docs/plan/todo.md、API 文档等。
    - 技能：`documentation-specialist`
    - 产出：同步后的文档。

7. **代码审查与安全校验**
    - 任务：严格按 `code-reviewer` 审查新变更，聚焦规划对齐 & 安全审计。
    - 技能：`code-reviewer`
    - 产出：审查结论，“Approve” 或 “Request changes”。

8. **规范化提交**
    - 任务：Conventional Commits 格式生成 commit 并推送。
    - 技能：`conventional-committer`
    - 产出：符合规范的提交/PR。


---

## 三、技能引用（Each Sub-Skill Reference）

- [context-analyzer](../context-analyzer/SKILL.md)
- [nuxt-code-editor](../nuxt-code-editor/SKILL.md)
- [test-engineer](../test-engineer/SKILL.md)
- [quality-guardian](../quality-guardian/SKILL.md)
- [documentation-specialist](../documentation-specialist/SKILL.md)
- [code-reviewer](../code-reviewer/SKILL.md)
- [conventional-committer](../conventional-committer/SKILL.md)

---

## 四、编写规范 (Authoring Rules)

1. **Imperative & Structured**
   - 用“动词+目标描述”标准化每一步/每个技能的 usage section。
   - 禁止冗长废话和“流程介绍”型文字。

2. **明确输入输出**
   - 每步须说明本阶段输入依赖、输出产物（如文件路径、文档链接）。
   - 例：“输入：docs/plan/，输出：docs/design/xx.md”。

3. **可链式组合**
   - 每步技能应允许独立、或作为全局 master 调用链局部片段。
   - 部分技能支持多角色协同（如测试、文档可并行）。

4. **安全检查与通用异常处理**
   - 强行插入 typecheck、lint 等质量关卡，禁止在未检测前进入提交/发布环节。
   - 明确安全等级和数据保护点。

5. **国际化与文档优先**
   - 所有工作流/技能创建应默认兼容 i18n 和标准文档同步动作。

---

## 五、模板用法 (Usage Example)

```yaml
workflow:
  - step: "需求分析"        # context-analyzer
  - step: "更新 design 文档" # documentation-specialist
  - step: "编写测试"        # test-engineer
  - step: "开发实现"        # nuxt-code-editor
  - step: "质量检测"        # quality-guardian
  - step: "补全部署文档"    # documentation-specialist
  - step: "代码审查"        # code-reviewer
  - step: "规范提交"        # conventional-committer
```
