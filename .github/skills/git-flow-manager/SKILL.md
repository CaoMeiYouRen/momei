---
name: git-flow-manager
description: 专注于 Git 暂存、规范化提交与变更记录管理。
version: 1.0.0
author: GitHub Copilot
applyTo: "**/*"
---

# Git Flow Manager Skill (Git 工作流管理技能)

## 能力 (Capabilities)

-   **分支管理**: 创建、切换、删除分支 (`git branch`, `git checkout`, `git switch`)。
-   **同步协作**: 拉取、推送与变基 (`git pull`, `git push`, `git rebase`, `git fetch`)。
-   **工作空间维护**: 使用 `git worktree` 管理多个工作目录；使用 `git stash` 暂存未完成的代码。
-   **合并与冲突**: 处理代码合并 (`git merge`) 并辅助解决冲突。
-   **历史审查**: 使用 `git log`, `git show`, `git diff` 审查变更历史。

## 指令 (Instructions)

1.  **原子操作**: 在执行推送 (`push`) 前，必须确保本地代码已与远程分支同步 (`pull --rebase`)。
2.  **上下文保护**: 当需要处理紧急 Bug 或审查其他分支代码时，优先使用 `git worktree` 或 `git stash` 保护当前工作现场。
3.  **安全性**: 严禁在主分支执行危险操作（如 `force push`），除非有明确指示。
4.  **与提交分离**: 本技能专注于 Git 基础架构操作。具体的代码暂存与规范化提交动作，请调用 [@conventional-committer](../conventional-committer/SKILL.md)。

## 使用示例 (Usage Example)

输入: "我想在不影响当前开发的情况下，另开一个目录修复 Bug。"
动作: 执行 `git worktree add ../momei-hotfix hotfix-branch`。

输入: "把现在的改动存起来，我要切换到 master。"
动作: 执行 `git stash push -m "work in progress"` 随后执行 `git checkout master`。
