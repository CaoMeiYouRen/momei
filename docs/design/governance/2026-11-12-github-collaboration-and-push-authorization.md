# 2026-11-12 GitHub 协作边界与推送授权治理

> 权威口径：[Git 工作流规范 §6–§7](../../standards/git.md) 与 [AGENTS.md §7.3 / §7.6](../../../AGENTS.md)。
> 适用范围：人工协作与定时任务（每日 CI 巡检、每日待办推进）共用同一套 GitHub 协作边界。

## 1. 背景与问题

仓库同时接受三类来源的 issue / PR：项目所有者与贡献者、外部提交者、依赖机器人（`dependabot[bot]` / `dependfix[bot]`）。此前缺少统一的作者可信度判据，导致两类风险：

1. **越权处置**：外部 issue / PR 与内部条目被同等对待，存在未经核实就进入实现、关闭或合并的可能。
2. **推送失控**：定时任务被笼统授权推送 `master`，缺少"何时必须推、何时不该推"的边界，容易出现未验证改动连续叠加。

## 2. 决策

### 2.1 可信提交者

- 仅项目所有者（`OWNER`）、项目贡献者（`MEMBER` / `COLLABORATOR`）以及本书登记的受信机器人（`dependabot[bot]`、`dependabot-preview[bot]`、`dependfix[bot]`）允许合并；新增受信机器人须先登记。
- 判定以 GitHub 返回的 `author_association` 与 `user.type` 配合上述清单为准，不按昵称推断。
- 不可信来源的 PR 可以审查、评论、关闭，但不得合并。

### 2.2 Issue

- Issue 默认只做调研，不直接进入实现。
- 项目所有者提交的 issue：评估 ROI 后可进入 `docs/plan/backlog.md`。
- 外部提交的 issue：核实后给出简要反馈；问题成立则保留并等待开发者审批，不成立则关闭并写明依据。
- 外部 issue 进入 backlog 必须经项目所有者审批。

### 2.3 PR

- 无论来源，PR 都必须审查，并给出保留开放 / 关闭 / 合并的明确结论与依据。
- 仅可信提交者的 PR 允许合并；合并前要求 CI 通过、无冲突、非 draft。
- 对可信提交者的 PR，允许为消除冲突或修正明显错误做简单修改后合并；复杂修改回到常规流程（新分支 + 审查 + CI）。
- 不可信来源 PR 的改动不得以 cherry-pick / 重新提交的方式绕过合并门槛；需由可信提交者重新提交并重走 review。
- 关闭 PR 必须写明理由（已由 `master` 覆盖 / 重复 / 无效 / 需重新提交）。

### 2.4 依赖与机器人 PR

- 命中 [`.github/mergify.yml`](../../../.github/mergify.yml) 规则（`Test` 通过 + `dependencies` label + 受信作者）的 `dependabot[bot]` / `dependabot-preview[bot]` 依赖 PR 继续走自动合并，依赖升级引入的风险由 CI 门禁承担。
- 未命中规则的机器人 PR（含 `dependfix[bot]` 及其余机器人）按常规 PR 审查、修复（rebase / 锁文件重解析）后合并。

### 2.5 推送授权

默认仍不推送（见 Git 规范 §4）。以下三类例外允许代理主动推送：

| 例外 | 触发条件 | 约束 |
| :--- | :--- | :--- |
| 修复 CI 验证 | 修复 CI 失败必须触发新 run 才能验证 | 推送后必须等待该次 run 的结论再决定下一步，结论未出前不得再推送；同一时间至多一个修复批次在 CI 中验证；连续 3 次不通过即停止转人工 |
| 完整条目完成 | 一个原子条目已完成且通过本地验证 | 非默认动作；建议积累若干条后一次推送；推送前做本地必要验证，长耗时检查可跳过并登记；推送后监控 CI |
| 风险隔离 | 改动可能影响整体运行状态，或规模较大 | 开短生命周期分支 + PR，CI 通过后合并回 `master`，合并后清理分支与工作树 |

### 2.6 上游 issue

- 依赖作者为 `CaoMeiYouRen` 的包，确认问题来自该包时可在查重后向上游提交 issue；与上游 / 下游存在协作关系的项目同理。
- 上游 issue 内容须符合上游项目规范并提供最小复现；提交前必须由用户审查并授权，代理只负责起草与查重。

### 2.7 重复评论抑制

- 已评估过的 issue / PR，若无新活动（新评论、新提交、状态变化），不重复 comment。

## 3. 落地位置

| 位置 | 内容 |
| :--- | :--- |
| `docs/standards/git.md` §4 / §6 / §7 | 可信提交者、issue / PR 处置、上游联动、推送授权（唯一事实源） |
| `AGENTS.md` §7.3 / §7.6 | 推送默认关闭 + 例外摘要、GitHub 协作摘要 |
| `.github/skills/full-stack-master/SKILL.md` | 强制参考文档与 F 阶段推送口径 |
| `.github/skills/conventional-committer/SKILL.md` | 提交环节的推送口径（避免与 Git 规范 §7 互斥） |
| `.github/skills/code-quality-auditor/references/review-checklist.md` | GitHub 协作口径一致性检查点 |
| `docs/standards/planning.md` §4.5 Step 7 | 下一阶段规划前的 issue / PR / Actions 盘点 |
| 定时任务「每日 CI 与 issue/PR 修复」 | 外部产物（OpenChamber），作者判定、issue 调研优先、PR 合并门槛、CI 修复推送等待；需在任务编辑页同步 |
| 定时任务「每日待办推进」 | 外部产物（OpenChamber），积累式推送、风险隔离分支、阶段规划前的 issue / PR / Actions 盘点；需在任务编辑页同步 |

## 4. 影响面与非目标

- **影响面**：代理在 issue / PR 处置与推送时的默认行为；定时任务的两个提示词；Git 规范与 AGENTS.md 的对应章节。
- **非目标**：不改变 CI 门禁本身、不放宽安全告警豁免、不引入新的自动化合并配置、不改变 `conventional-committer` 的提交格式约束。

## 5. 回滚

- 规范、AGENTS.md、skill 与检查清单条目按章节回退；定时任务提示词可在 OpenChamber 定时任务编辑页恢复旧文本。
- 若 §7.1 在实践中产生未验证推送，先把判定条件收紧为"必须等待全量 CI 绿且禁止并发修复批次"，而不是整体取消授权。
- 回退后重新执行 `pnpm lint:md`、`pnpm ai:check` 与 `pnpm docs:check:links`，确认规范单点声明与链接仍然自洽。
