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

### 第四十九阶段：延期清缴与流量治理（0 新功能 + 5 优化）

> 背景：第四十八阶段完成深度治理后，本阶段以「0 新功能 + 5 个优化」组合推进——最紧迫项为 Postgres 网络传输已耗尽 89% 配额，同时清缴 Phase 44/48 的延期项。

- [ ] **主线：Postgres 流量治理 — 网络传输削减 (P0)**
	- 执行范围：Tag 列表页查询减列（35→10 列）、Settings 公共读取加缓存（5min TTL）、文章详情页减列 + 移除 author.email、前/后文章导航 COALESCE 索引优化。
	- 非目标：不做数据库迁移、不做全量查询改造。
	- 当前进度：待开始。
	- 最小验收：Network transfer 日均有可测量下降；≥2 条热点查询完成减列/缓存。

- [ ] **主线：formatDate 函数级复用 (P0)**
	- 执行范围：8 处自定义 `formatDate`/`formatDateTime` → 统一使用 `useI18nDate().formatDate`。
	- 非目标：不改动 `useI18nDate` 签名。
	- 当前进度：待开始。
	- 最小验收：自定义 formatDate 减少 ≥4 处。

- [ ] **主线：延期测试回填 (P1)**
	- 执行范围：Phase C feed 渲染/降级 + Admin checkbox 交互 + 前/后文章导航逻辑。
	- 非目标：不扩写到非 Phase 44 相关模块。
	- 当前进度：待开始。
	- 最小验收：新增 ≥3 个测试用例。

- [ ] **主线：清理收口 (P1)**
	- 执行范围：`subscriptions` 删除、`vendor.css` 清理、backlog.md 清理（Blogroll #12、隐私分析状态、Phase 47/48 方向修正）。
	- 非目标：不新增删除未确认端点。
	- 当前进度：待开始。
	- 最小验收：清理项全部完成，backlog.md 无 Phase 44-48 残留。

- [ ] **主线：type 收敛 + 归档索引修正 (P2)**
	- 执行范围：同名 type/interface 12→≤10；`governance/archive/index.md` 计数同步。
	- 非目标：不推动生产代码大重构。
	- 当前进度：待开始。
	- 最小验收：同名 type ≤10；archive/index.md 计数正确。

> **阶段收口时统一处理**: 文档归档治理延至本阶段结束时执行。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
