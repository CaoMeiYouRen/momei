# 破坏性提交人工审查（2026-11-21）

> 规范本体见 [开发规范 §2.7](../../standards/development.md)；执行摘要见 [conventional-committer skill](../../../.github/skills/conventional-committer/SKILL.md)。本文记录 issue #1072 的决策背景、口径与回滚边界。

## 1. 背景

破坏性提交会直接改变线上行为，但本仓提交门禁只覆盖 commitlint 与 lint-staged，AI Review Gate 与作者自检无法替代“谁确认破坏面与迁移方式”的责任。issue #1072 提案要求在破坏性提交进入本地历史前增加人工确认，并把确认结果写入提交消息。

## 2. 核验事实

-   本仓无 `!` 头部或 `BREAKING CHANGE:` footer 历史提交（2026-11-21 核对）。
-   `.husky/commit-msg` 仅运行 commitlint，没有破坏性提交专项检查。
-   squash 合并取分支提交消息（`squash_merge_commit_message=COMMIT_MESSAGES`）。
-   发布链以 `BREAKING CHANGE:` footer 识别破坏性变更，`!` 头部不能替代破坏面描述。

## 3. 决策

1.  **落点分层**：开发规范 §2.7 写完整条款；`AGENTS.md` §7.4 写一行政策与指针；`conventional-committer` skill 写执行摘要与示例；`git.md` §3 写 squash 合并核对。
2.  **确认人标识**：单个无空格 token，默认 `owner`，也允许 GitHub 用户名，便于机检按空格解析。
3.  **squash 合并**：PR 模板增加检查项，合并者合并前核对 squash 消息预览，缺失时补写。
4.  **机检**：本期不接入针对 `Breaking-Review:` 的 `commit-msg` 检查，先落人工纪律；本仓累计 3 笔破坏性提交或出现漏记时再评估。
5.  **历史不回补**：不追溯既有提交，不 reset / rebase 已推送历史。

## 4. 验收与回滚

-   提交规范小节包含时机、主体、记录格式与重确认条件。
-   破坏性提交同时含 `Breaking-Review:` 与 `BREAKING CHANGE:`，且前者在前。
-   squash 落库消息保留记录，或由合并者补写。
-   失败判据：破坏性提交无记录、记录被并入 `BREAKING CHANGE:` 文本、`approved-with-migration` 未给迁移路径。
-   回滚：revert 规范条目提交；机检（如已接入）先降为 warning 一个发布周期再移除；历史记录保留，不批量清洗。
