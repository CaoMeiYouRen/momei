# 墨梅博客 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

---

## 当前待办

### 第四十阶段：发布前守护与 TypeORM 升级评估收口（进行中）

> 执行顺序：先完成“发布前守护轨”的统一入口，再进入 “TypeORM 评估轨”的兼容性探针，最后由“收口轨”统一沉淀证据与策略口径。
> 当前阶段只做评估与守护，不把 TypeORM 真实升级实施并入本轮。

#### A. 发布前守护轨

1. [x] **CI 前置守护脚本接入首轮落地 (P0)**
	- 执行范围：在正式执行主命令前增加统一 pre-check，并要求 release/test/docker 三条 workflow 复用同一入口。
	- 非目标：不重写全部 workflow；不在本轮把所有 warning 一次性升级为 blocker。
	- 最小验收：release/test/docker 三条 workflow 在执行主体前都调用同一守护入口；至少覆盖依赖风险、关键脚本存在性、必要环境检查。
	- 证据落点：workflow 变更记录、守护入口定向执行结果、至少一条失败样本定位记录。
	- 2026-05-25：共享入口 `pnpm ci:precheck -- --profile=<workflow>` 已接入三条 workflow；首轮执行摘要与失败样本定位记录已回写到 [活动回归窗口](../reports/regression/current.md)。

2. [x] **发布链路最小回归闸门收紧 (P0)**
	- 执行范围：把已有 release:check / regression 脚本编排成固定顺序，先解决本地与 CI 执行顺序不一致的问题。
	- 非目标：不新增第二套回归入口；不把阶段收口专用命令强行塞进日常开发默认流程。
	- 最小验收：失败日志可直接定位到守护子项；本地与 CI 的执行顺序一致，且至少保留一份标准化执行摘要。
	- 证据落点：发布前守护脚本或回归入口定向执行记录、活动回归窗口摘要。
	- 2026-05-25：本地 `pnpm release` 已改为先走 `pnpm regression:pre-release`；[.github/workflows/release.yml](../../.github/workflows/release.yml) 已收敛为 `precheck -> regression -> release`；`regression:pre-release` 摘要会把 `release:check:full` 的内部失败子项直接上浮到 blocker / warning，并保留 `artifacts/review-gate/*-pre-release-regression.{md,json}` 标准化摘要。

#### B. TypeORM 评估轨

3. [ ] **TypeORM 1.0.0 兼容性探针与分桶验证 (P1)**
	- 执行范围：仅做评估态兼容性探针，不直接把 `typeorm` 从 `0.3.29` 升级后作为本阶段已交付；优先覆盖 `server/database/**`、`server/database/typeorm-adapter.ts`、公开热点读链路与依赖 TypeORM 形态的定向测试。
	- 非目标：不在本轮完成真实升级实施；不顺手重写仓库内所有 TypeORM mock。
	- 最小验收：完成一轮 `typeorm@1.0.0` 兼容性探针，并按“数据库与适配层 / 实体层 / 查询与服务层 / API 层 / 测试桩”输出失败分桶；最小验证矩阵至少覆盖 `pnpm run typecheck`、适配层相关测试、数据库初始化与公开读链路定向测试。
	- 证据落点：[docs/design/governance/typeorm-v1-upgrade-assessment.md](../design/governance/typeorm-v1-upgrade-assessment.md)、定向验证记录、活动回归窗口阶段结论。
	- 2026-05-25：已完成隔离 worktree 首轮 probe；`typeorm@1.0.0` 下适配层与初始化层测试通过，首个 runtime blocker 收敛到 [server/utils/translation.ts](../../server/utils/translation.ts) 的字符串数组 `select` 语法，主工作区已落一条前向兼容补丁。当前 `pnpm run typecheck` 仍暴露主工作区剩余 `22` 处 `select: [...]` 与 `38` 处 `relations: [...]` 旧语法，以及待隔离的 `packages/**` 类型噪音；详情见 [docs/design/governance/typeorm-v1-upgrade-assessment.md](../design/governance/typeorm-v1-upgrade-assessment.md) 与 [docs/reports/regression/current.md](../reports/regression/current.md)。

4. [x] **TypeORM 升级 go/no-go 与回滚预案落盘 (P1)**
	- 执行范围：依据兼容性探针结果输出 go/no-go，并把回滚锚点、触发条件与后续是否升格为真实升级实施写清楚。
	- 非目标：不把已有评估文档误写成“升级已可执行”；不在结论不清时强行把真实升级放进下一阶段实施面。
	- 最小验收：明确记录 `typeorm@0.3.29` 回滚锚点、no-go 触发条件、下一次重新评估窗口，以及是否允许把真实升级实施纳入后续阶段。
	- 证据落点：评估文档更新、活动回归窗口结论、roadmap/todo 阶段摘要对齐。
	- 2026-05-25：当前结论已落盘为“`NO-GO（直接升级）` / `GO（继续评估）`”；回滚锚点保持 `typeorm@0.3.29`，下一次重新评估触发点为完成 `FindOptionsSelect` / `FindOptionsRelations` 旧语法迁移、隔离 `packages/**` typecheck 噪音并重跑最小验证矩阵后，再决定是否允许把真实升级实施上收到后续阶段。详情见 [docs/design/governance/typeorm-v1-upgrade-assessment.md](../design/governance/typeorm-v1-upgrade-assessment.md) 与 [docs/reports/regression/current.md](../reports/regression/current.md)。

#### C. 收口轨

5. [ ] **文档证据自动回填 (P1)**
	- 执行范围：将 pre-check、回归摘要与 TypeORM 评估结论自动沉淀到活动回归窗口模板，减少阶段收口时的人工补录。
	- 非目标：不重新设计第二套回归记录文档；不要求本轮自动生成完整审计报告。
	- 最小验收：每次主流程后能生成一条标准化证据记录，至少包含执行入口、结果摘要、阻断项或 go/no-go 结论。
	- 证据落点：[docs/reports/regression/current.md](../reports/regression/current.md) 中的模板化记录与对应脚本输出。

6. [ ] **守护策略分级与依赖风险口径对齐 (P2)**
	- 执行范围：把阻断项和提醒项配置化，并同步校准 `security:audit-deps` 与 `security:audit-deps:daily` 的判断口径。
	- 非目标：不把所有 daily warning 升级为发版 blocker；不新增独立的第三套依赖风险入口。
	- 最小验收：策略表可读、可审计，新增规则不需要改 workflow 结构；同一类风险在 daily 与 release 前的结论一致，只有时机差异。
	- 证据落点：守护策略配置、依赖审计入口定向执行结果、对应文档摘要。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
