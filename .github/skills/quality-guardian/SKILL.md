---
name: quality-guardian
description: 运行和分析项目质量检查（Linting, 类型检查, 测试）。
version: 1.0.0
author: GitHub Copilot
tools: ["terminal"]
---

# Quality Guardian Skill (质量守门员技能)

## 能力 (Capabilities)

-   **类型检查**: 运行 `pnpm typecheck` (包装了 `nuxi typecheck`) 以验证 TypeScript 有效性。
-   **Linting**: 运行 `pnpm lint` (ESLint) 和 `pnpm lint:css` (Stylelint)。
-   **测试**: 运行 `pnpm test` (Vitest) 进行单元和集成测试。

## 指令 (Instructions)

1.  **执行检查**: 使用 `run_in_terminal` 或 `runTests` 工具通过终端运行相应的 npm 脚本。
2.  **分析输出**: 解析 stdout/stderr 以识别导致错误的特定文件和行。
3.  **报告**: 向用户或其他 Agent 提供失败摘要以便修复。
4.  **单元测试**: 如果全量测试太慢， focused 运行与最近更改相关的特定测试文件。

## 使用示例 (Usage Example)

输入: "验证最近的更改。"
动作: 运行 `pnpm typecheck` 和 `pnpm test`。如果 `pnpm typecheck` 失败，报告具体的类型不匹配错误。
