# GitHub Copilot Workspace Instructions

本文件是 GitHub Copilot / Copilot Workspace 的轻量入口，只负责把模型引导到本项目已经存在的权威规则与规范文档，不再重复定义第二套项目规则。

## 使用边界

1.  先读取 [AGENTS.md](../AGENTS.md)。项目级行为准则、职责边界、PDTFC+ 工作流与安全红线一律以该文件为准。
2.  本文件只补充 Copilot 平台的最小执行门禁，不重写 `AGENTS.md`、`docs/standards/development.md`、`docs/standards/security.md`、`docs/standards/testing.md` 的正文。
3.  若本文件与 [AGENTS.md](../AGENTS.md) 冲突，以 [AGENTS.md](../AGENTS.md) 为准。

## 最小执行门禁

1.  规划与准入：先读 [docs/plan/todo.md](../docs/plan/todo.md)、[docs/plan/roadmap.md](../docs/plan/roadmap.md)、[docs/standards/planning.md](../docs/standards/planning.md)。
2.  代码实现：再读 [docs/standards/development.md](../docs/standards/development.md)、[docs/standards/security.md](../docs/standards/security.md)、[docs/standards/testing.md](../docs/standards/testing.md)。
3.  文档同步：涉及 README / Guide / Standards / Plan 更新时，再读 [docs/standards/documentation.md](../docs/standards/documentation.md)。
4.  默认开发路径：代码实现默认由 `@full-stack-master` 统一考虑、设计和实现；部署、CI/CD、Docker 与环境配置变更也沿用这一路径，并按需复用 `.github/skills/devops-specialist/SKILL.md`。

## 目录约束

1.  `.github/agents/` 与 `.github/skills/` 是主定义目录。
2.  `.claude/agents/` 与 `.claude/skills/` 仅为 Claude 兼容镜像，不得独立扩展职责边界。
3.  若需要新增 GitHub Copilot 专属规则，优先保持轻量，只写平台差异与入口提示，不复制项目级总规范。
