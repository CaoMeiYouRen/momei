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
> 开始进行待办时，在本区域填写正在进行的待办，结束后清理并更新对应条目状态。

当前进行中事项
- [ ] 插队热修复：Postgres 下 taxonomy 排序别名回归导致分类/标签页与 RSS/站点地图链路异常。
	- 原因：`/api/categories` 与 `/api/tags` 在 `orderBy=postCount` 时使用了大小写混合别名排序，Postgres 标识符折叠后触发 `column *_postcount does not exist`。
	- 影响：分类页、标签页出现 500，且可能连带影响 RSS/sitemap 等依赖分类与标签数据的链路。
	- 当前执行：已上收为插队修复，正在验证线上恢复情况与订阅路由稳定性。

> 阶段状态: 第二十六阶段已完成归档，详见 [待办事项归档](./todo-archive.md) 与 [项目计划](./roadmap.md)。下一阶段仅保留候选分析，不在本文件提前写入正式规划。


## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

