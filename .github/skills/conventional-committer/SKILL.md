---
name: conventional-committer
description: 暂存更改并生成符合 Conventional Commits 规范（使用中文或用户使用的语言）的提交消息。
metadata:
  internal: true
---
# Conventional Committer Skill (规范提交技能)

-   **暂存 (Staging)**: 将修改后的文件添加到 git 暂存区。
-   **消息生成**: 创建遵循 `type(scope): description` 格式的提交消息 (例如: `feat(auth): add login page`)。
-   **提交 (Committing)**: 执行 `git commit`。

## 指令 (Instructions)

0.  **Worktree 感知**: 提交前确认当前所在目录（如 `../momei-dev`），确保提交是在正确的分支和上下文中进行的。
1.  **规范对齐**: 在提交前必须确认遵循 [开发规范](../../../docs/standards/development.md)；消息含 `!` 头部或 `BREAKING CHANGE:` footer 时，先按「破坏性提交人工审查」完成确认。
2.  **规模校验**: 强制检查本次改动的文件数量。原则上文件数 **不要超过 10 个**；对应的功能点必须单一。
3.  **任务关联**: 每次提交应且仅应关联 [待办事项 (Todo)](../../../docs/plan/todo.md) 中的一个原子条目。
4.  **提交前检查**: 在执行任何 git 提交操作前，确认 `@code-auditor` 已经通过了 `pnpm typecheck`, `pnpm lint` 和必要的**定向测试**。
5.  **验证状态**: 检查 `git status` 查看哪些内容需要暂存。
6.  **生成消息**: 分析更改以确定 `type` (feat, fix, docs, style, refactor, test, perf, build, ci, chore, revert), `scope` (可选, 例如: 组件名, 模块) 和 `description`。`description` 使用**中文或用户使用的语言**，遵循 Conventional Commits 格式 `type(scope): description`。
7.  **提交**: 单段消息可用 `git commit -m "..."`；多段消息（含 `Breaking-Review:` / `BREAKING CHANGE:` footer）必须使用 `git commit -F <file>` 或 heredoc，避免双引号写入字面 `\n`。
8.  **推送口径**: 默认只提交不推送。授权例外（修复 CI 验证、完整条目完成后推送、风险隔离分支）见 [Git 工作流规范 §7](../../../docs/standards/git.md)；其余场景仅在用户明确发出"推送""push""推到远端"等指令时执行。提交结果应告知用户推送状态，未推送时说明"已提交到本地，等待推送确认"。
9.  **验证**: 确保消息符合 `commitlint.config.ts`。
10. **合作**: 默认不添加 `Co-Authored-By`，除非确实是多人合作提交。

## 破坏性提交人工审查

> 以下为执行摘要；与 [开发规范 §2.7](../../../docs/standards/development.md) 冲突时以规范为准。

破坏性提交指消息含 `!` 头部（`<type>(<scope>)!:`）或 `BREAKING CHANGE:` footer 的提交。

-   **提交前人工确认**：确认对象是最终 diff 与最终提交消息；由项目所有者或其明确授权的人确认，AI 自查与 Review Gate 不替代，未确认不得提交。
-   **记录格式**：`Breaking-Review: <确认人标识> <YYYY-MM-DD> <approved|approved-with-migration>`。确认人标识为单个 token（无空格，默认 `owner`，也可使用 GitHub 用户名）；`approved-with-migration` 须在提交正文或 `docs/design/governance/` 下的专题文档给出迁移路径（含受影响面与替代方案）。
-   **位置**：`Breaking-Review:` 必须位于 `BREAKING CHANGE:` 之前；写在之后会被并入发布说明的 note 文本。
-   **只写 `!` 不合规**：发布链以 `BREAKING CHANGE:` footer 作为稳定标记，`!` 不能替代破坏面描述。
-   **重确认**：确认后提交树或消息文本有变化（含 amend）需重新确认；新增 `Breaking-Review:` 行不计入比较，已有记录行的确认人、日期或结论变更需重新确认。
-   **合并与回退**：squash merge 由合并者核对 squash 消息预览并在缺失时补写；rebase / merge commit 透传原提交消息，仅需确认未被改写；revert 保留原记录，历史提交不回补。

示例：

```text
feat(api)!: 移除 v1 响应包装

- 响应体改为直接返回业务数据

Breaking-Review: owner 2026-11-21 approved
BREAKING CHANGE: 移除 { code, message, data } 包装，客户端需按新结构解析。
```

## 使用示例 (Usage Example)

输入: "提交新的用户资料功能。"
动作: `git add .`, 分析变更, 生成消息 `feat(user): 实现带有头像上传功能的用户个人资料页面`, `git commit`。

## 反模式

-   不看 diff，直接用模糊消息如 update files。
-   把多类变更混成一个没有 scope 的提交。
-   在质量检查未完成时默认提交。
-   破坏性提交未经人工确认就落库，或只写 `!` 而不写 `BREAKING CHANGE:` footer。
