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

## 二、标准 PDTFC+ 工作流 (Workflow Steps)

1. **需求分析与计划 (Plan/Analysis)**
    - 任务：区分任务类型（feat/fix/docs）。分析 `roadmap.md` 及 `todo.md`。如果是 `fix`，分析根因并排查截图/日志；如果是 `feat`，更新规划文档。
    - 技能：`context-analyzer`、`documentation-specialist`
    - 约束：**针对模糊需求必须启动“采访追问”模式，抽离核心真实意图，对齐共识前禁止开工**。

2. **开发实现 (Do)**
    - 任务：实现功能代码。遵循 Nuxt 4, Vue 3, TS, SCSS BEM, i18n。
    - 技能：`nuxt-code-editor`

3. **UI 自动化验证 (UI Validate)**
    - 任务：若属于 UI 相关改动，必须先检查端口状态并确保开发服务器运行，随后通过浏览器访问受影响页面。通过截图、快照或计算样式验证渲染效果。
    - 技能：`ui-validator`
    - 约束：**严禁跳过浏览器验证环节**。必须覆盖 `light` 和 `dark` 两种主题模式。

4. **质量检测与审查 (Test/Review)**
    - 任务：运行 `pnpm lint`, `pnpm typecheck`, `pnpm test`。
    - 约束：**严禁破坏原有测试**。若失败需分析根本原因。
    - 技能：`quality-guardian`、`test-engineer`

5. **问题修复 (Fix)**
    - 任务：修复执行阶段发现的缺陷、测试失败或 UI 样式偏差。
    - 技能：`nuxt-code-editor`

6. **功能提交 (Commit - Phase 1)**
    - 任务：执行最终质量检查，使用 Conventional Commits 规范（中文/用户语言）提交。
    - 技能：`conventional-committer`

7. **测试增强 (Enhance)**
    - 任务：检查覆盖率，补充测试用例。再次运行 `pnpm test`。
    - 技能：`test-engineer`

8. **测试提交 (Commit - Phase 2)**
    - 任务：最终质量监测后提交增强测试。
    - 技能：`conventional-committer`


---

## 三、技能引用（Each Sub-Skill Reference）

- [context-analyzer](../context-analyzer/SKILL.md)
- [nuxt-code-editor](../nuxt-code-editor/SKILL.md)
- [test-engineer](../test-engineer/SKILL.md)
- [quality-guardian](../quality-guardian/SKILL.md)
- [documentation-specialist](../documentation-specialist/SKILL.md)
- [code-reviewer](../code-reviewer/SKILL.md)
- [conventional-committer](../conventional-committer/SKILL.md)
- [ui-validator](../ui-validator/SKILL.md)

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
  - step: "UI 验证"         # ui-validator
  - step: "质量检测"        # quality-guardian
  - step: "补全部署文档"    # documentation-specialist
  - step: "代码审查"        # code-reviewer
  - step: "规范提交"        # conventional-committer
```
