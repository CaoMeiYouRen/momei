# Agent Admission Guide

## Skill 还是 Agent

### 适合做成 Skill

- 主要是一个可复用的工作流或检查清单。
- 不需要上下文隔离，单个执行者就能完成。
- 主要价值来自 SKILL.md、references/、scripts/、assets/ 的组合。
- 适合作为被多个 agent 或默认助手按需调用的原子能力。

### 适合做成 Agent

- 需要上下文隔离，让一个专门角色独立分析后再给出结果。
- 需要明确的阶段接棒、角色身份或治理职责。
- 需要整合多个 skills 或其他 agents，承担编排责任。
- 需要对某类任务设置稳定的角色视角与边界，而不是一次性流程。

## 准入标准

### 必须满足

- 目标清晰，能说清楚为什么现有能力不够。
- 与现有 skills / agents 不高度重复。
- 有明确输入、输出、边界和不负责事项。
- 引用的技能、文档和路径都真实存在。
- 不引导危险操作、越权访问或模糊授权。
- 满足仓库的最低智能体性能要求，基础能力不低于 Gemini 3 Flash / Claude Sonnet 4.5 / GPT-5 这一档。

### 一票否决

- 只是现有 skill 或 agent 的轻微补充，却试图新增一个新角色。
- 职责描述模糊，如“负责所有工程管理”。
- 通过虚构文档、虚构流程或虚构工具支撑角色。
- 没有安全边界，默认可以做任何高风险操作。

## 本项目推荐的 Agent 文件骨架

1. frontmatter：name、description
2. 角色设定：说明它是谁、负责什么
3. Integrated Skills：列出真实存在的 skills
4. Mandatory Documentation：只引用真实存在的文档或目录
5. Core Responsibilities：职责分点
6. Collaboration Workflow：输入、处理、接棒关系

## 审计问题清单

- 这个需求真的需要 agent，而不是 skill 吗？
- 现有哪个 agent 或 skill 最接近？为什么不能直接补进去？
- 新角色是否有清晰边界，而不是万能角色？
- 集成的 skills 是否真实存在且确实必要？
- 描述是否足以让系统正确触发这个 agent？
