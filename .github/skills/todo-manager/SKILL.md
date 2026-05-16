---
name: todo-manager
description: 专门负责管理项目路线图 (roadmap.md)、待办事项 (todo.md)、待办归档 (todo-archive.md) 与阶段切换收口流程。
metadata:
  internal: true
---

# Todo Manager Skill (待办事项管理技能)

## 核心能力 (Core Capabilities)

-   **状态同步**: 实时更新 `docs/plan/todo.md` 中的任务状态（进行中、已完成）。
-   **任务拆解**: 将复杂需求拆解为 `todo.md` 中的原子化条目。
-   **版本规划**: 根据更改内容更新 `docs/plan/roadmap.md`。
-   **事项分流落点**: 根据优先级把新增事项放到当前阶段或 backlog，而不是一律塞进当前待办。
-   **闭环检查**: 在任务完成前，核对所有 TODO 项是否已打勾。
-   **阶段归档收口**: 在阶段结束时，按统一 checklist 清理 `todo.md`、更新 `todo-archive.md`、同步 `roadmap.md` 与多语路线图摘要。
-   **Session 级任务协议管理**: 维护 `.session/current-task.yaml`，在 session 开局时恢复上下文，在 session 收尾时更新进度与认知状态。

## 指令 (Instructions)

1.  **路径感知**: 规划类操作（`todo.md`, `roadmap.md`）应在项目主根目录（`master` 分支）下执行。
2.  **先判定再落盘**: 新发现的事项在写入 `todo.md` 或 `roadmap.md` 之前，必须先经过 `requirement-analyst` 或等效流程判断其属于当前范围、允许插队事项还是延期事项。
3.  **首尾呼应**: 每个任务开始前必须将对应的 TODO 标记为 `in-progress`；完成后标记为 `completed`。
4.  **严禁无门槛膨胀**: 不得因为开发过程中顺手发现了问题，就直接向当前阶段追加多个新条目。只有阻塞交付、回归修复、安全/合规修复等高优先级事项，才允许插入当前阶段。
5.  **延后有去处**: 不允许简单忽略低优先级事项；应将体验优化、非阻塞依赖升级、探索性想法等写入 `roadmap.md` 的积压区，而不是占用当前迭代容量。
6.  **容量约束**: 若当前阶段核心任务数将超过 5-6 项，必须提示执行"进一出一"策略。
7.  **文档一致**: 确保 `roadmap.md` 与实际开发进度保持同步。
8.  **归档流程唯一事实源**: 凡是涉及"阶段完成、归档、切到下一阶段"，必须严格遵循 `docs/standards/planning.md` 中的"阶段归档与下一阶段规划标准流程"，不得自行省略检查项或改顺序。
9.  **归档前置检查**: 归档前必须逐项确认当前阶段条目已完成、`todo.md` 当前进行中事项已清理、回归记录与质量门证据已可追溯、并且至少有一轮 review 结论。
10. **归档更新顺序**: 先清理 `todo.md`，再写 `todo-archive.md`，再同步 `roadmap.md`，最后按需更新 `docs/i18n/*/plan/roadmap.md`；`todo.md` 与 `backlog.md` 默认保持中文，不为归档动作单独翻译。
11. **最低检查不可跳过**: 阶段归档属于正式规划变更，至少补齐 `lint-md`、`pnpm docs:check:i18n`、质量门状态确认与错误面检查；若缺失这些证据，不得标记"已归档"。
12. **下一阶段闸门**: 当前阶段未完成归档前，只允许输出"候选方案 / 准入分析"，不得直接把下一阶段写入 `todo.md` 或 `roadmap.md`。

### Session 级任务协议管理

`.session/current-task.yaml` 是阶段级 `todo.md` 的 session 级补充。`todo.md` 负责阶段跨度（以周为单位），`.session/current-task.yaml` 负责 session 跨度（以小时为单位）。两者同步不替代。

#### Session 开局恢复

每次新 session 启动时（无论是新对话窗口还是任务切换后继续），按以下顺序恢复上下文：

1.  读取 `.session/current-task.yaml` → 获取 `active_plan`、`progress`（已完成 / 进行中 / 阻塞）、`next_steps` 与 `cognitive` 状态。
2.  读取 `.session/runtime-state.json` → 获取 `failure_count`、`active_mode`、`last_verification`。
3.  读取 `.session/wisdom.md` → 若有跨 session 值得复用的发现，一并加载。
4.  读取 `docs/plan/todo.md` → 对齐阶段级上下文，确认当前进行中的主线是否与 session 协议一致。

#### Session 收尾更新

每次 session 结束前（用户说"收工""结束""今天到这"或主动切换任务时），更新 `.session/current-task.yaml`：

| 字段 | 更新内容 |
|:---|:---|
| `progress.completed` | 追加本 session 已完成的具体步骤 |
| `progress.in_progress` | 更新当前进行中的步骤（最多一项） |
| `progress.blocked_on` | 若有阻塞，写明原因（否则留空） |
| `next_steps` | 下一 session 的优先事项（3 项以内） |
| `cognitive` | 仅本 session 有失败时更新（`failure_count`、`active_mode`、`tried_approaches`、`switched_from`） |
| `session.updated_at` | 更新为当前时间 |

另外：
-   若有值得跨 session 复用的 pattern / bug / decision，追加到 `.session/wisdom.md`。
-   更新 `.session/runtime-state.json` 的 `last_verification`。

#### 关键边界

-   `.session/` 目录为 **git-ignored**，不进入版本库、不进入深度归档、不进入语义索引。
-   Session 协议是**任务态**（每 session 重写），不是历史态。阶段结束时不需要把 `.session/` 内容归档到 `todo-archive.md`。
-   若 `.session/current-task.yaml` 不存在（新项目或首次使用），按正常流程初始化：从 `todo.md` 当前进行中条目派生初始内容。

## 使用示例 (Usage Example)

动作: 读取 `todo.md`，找到排名最高且未开始的任务，启动开发流程并将该条目标记为"开发中"。

动作: 在开发过程中发现一个非阻塞的体验优化点时，不把它直接加入当前阶段，而是补充到 `roadmap.md` 的 backlog，并注明来源背景。

动作: 当当前阶段所有主线都已完成时，先按 `planning.md` 检查归档准入、回归证据、Review Gate 和文档同步，再依次更新 `todo.md`、`todo-archive.md`、`roadmap.md` 与多语路线图摘要，而不是直接删除当前阶段正文。

动作: Session 收尾时，更新 `.session/current-task.yaml` 的 progress、next_steps 与 cognitive 字段，并确认 `todo.md` 的任务状态与 session 协议一致。
