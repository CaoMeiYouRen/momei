# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供平台适配指导。
同时必须遵守 [AGENTS.md](./AGENTS.md) 中的项目级规则。

## 平台适配说明

### Claude 目录发现与回退

- **主定义目录**：治理上以 `.github/agents/` 与 `.github/skills/` 为主定义
- **优先目录**：Claude Code 应优先读取 `.claude/agents/` 与 `.claude/skills/`
- **回退目录**：若对应定义不存在，回退读取 `.github/agents/` 与 `.github/skills/`
- **镜像约束**：`.claude/` 中的文件名、职责边界和推荐路径必须与 `.github/` 主定义保持一致
- **能力受限处理**：当 Claude Code 无法完整执行某项项目规则时，应显式说明能力缺口和回退做法

### 冲突处理

- `AGENTS.md` 是唯一权威事实源
- 若本文件与 `AGENTS.md` 存在冲突，一律以 `AGENTS.md` 为准
- 本文件只允许补充：目录发现顺序、工具能力差异、加载回退与降级策略

## 常用命令（快速参考）

| 分类 | 命令 | 说明 |
|------|------|------|
| 开发 | `pnpm dev` | 启动开发服务器 |
| 开发 | `pnpm build` | 构建生产版本 |
| 测试 | `pnpm test` | 运行所有测试 |
| 测试 | `pnpm vitest run <path>` | 运行单个测试文件 |
| 质量 | `pnpm lint` | ESLint 检查与修复 |
| 质量 | `pnpm lint:i18n` | 单独执行 `@intlify/vue-i18n` 慢规则检查 |
| 质量 | `pnpm typecheck` | TypeScript 类型检查 |
| 文档 | `pnpm docs:dev` | 启动文档开发服务器 |

## Claude 执行前检查

1. 在进入任何写操作前，先按 [AGENTS.md](./AGENTS.md) 要求读取对应阶段必须参考的项目文档
2. 涉及模块级实现时，从 `docs/standards/`、`docs/design/`、`docs/guide/` 中补读对应文档
3. 若 `.claude/` 目录中缺少某个 agent 或 skill 定义，按回退规则查找 `.github/`

## 相关文档

| 文档 | 用途 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 唯一权威事实源，定义项目级 AI 行为准则、PDTFC+ 工作流 |
| [docs/standards/development.md](./docs/standards/development.md) | 开发规范、技术栈指南、代码生成准则 |
| [docs/standards/api.md](./docs/standards/api.md) | API 设计规范 |
| [docs/standards/testing.md](./docs/standards/testing.md) | 测试规范 |
| [docs/standards/security.md](./docs/standards/security.md) | 安全规范 |
| [docs/standards/ai-collaboration.md](./docs/standards/ai-collaboration.md) | AI 协作与 PDTFC+ 工作流详情 |

---

*本文件由 `@documentation-specialist` 维护，每次 `AGENTS.md` 重大变更后应同步检查是否需要精简。*
