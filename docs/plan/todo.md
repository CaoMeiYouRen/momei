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

### 第四十一阶段：TypeORM 前置清障与治理切片推进（进行中）

- [ ] **主线：TypeORM 升级前置清障切片 (P0)**
	- 执行范围：按第四十阶段 `NO-GO` 结论，优先处理适配层契约、测试桩形态与查询链路兼容缺口，形成可复跑清障清单。
	- 非目标：不直接升级到 `typeorm@1.0.0`，不把评估态任务当成升级实施完成。
	- 最小验收：输出阻断项分桶、清障优先级与下一轮复评触发条件。

- [ ] **主线：Postgres 热点读链路治理 (P0)**
	- 执行范围：聚焦公开热点读接口（`posts / archive / categories / tags / settings / friend-links`）单路径或单组切片，优先收敛结果集体量与重复读。
	- 非目标：不并行扩写为全站数据库重构。
	- 最小验收：给出至少一组热点读链路的 calls / rows / 网络体量对比证据。

- [ ] **主线：文档门禁和脚本治理 (P1)**
	- 执行范围：推进 docs candidate 门禁与治理脚本基线收敛，优先处理 warning 面、误报与入口漂移。
	- 非目标：不在本轮把全部候选门禁升级为 blocker。
	- 最小验收：至少完成 1 轮候选门禁重跑与脚本治理基线对比。

- [x] **主线：结构复用治理 (P1)**
	- 执行范围：继续按“重复代码 + 零散类型 + 纯函数 / 工具函数”口径做小切片，优先选择可量化收益热点。
	- 非目标：不推动跨目录大重构，不为复用而复用。
	- 最小验收：已完成 2 组热点切片并确认 `duplicate-code` 基线不反弹。

- [ ] **主线：ESLint / 类型债治理 (P1)**
	- 执行范围：坚持“单规则 + 单文件 / 双文件”窄切片，结合规则债 inventory 输出推进下一轮清偿。
	- 非目标：不扩写为全仓 `any` 清零或多规则并行治理。
	- 当前进度：已完成公开列表 API 子组 `no-explicit-any`、广告配置类型组 `no-explicit-any` 与文本 / 广告目标断言组 `no-non-null-assertion` 三组窄切片。
	- 最小验收：目标规则命中数下降且定向 lint / typecheck 通过。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
