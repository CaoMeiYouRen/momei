# 回归历史归档

本文档用于说明回归历史归档的组织方式与检索入口。

## 1. 归档策略

- 优先按模块或日期拆分历史记录。
- 若单个归档继续膨胀，再按年份或半年拆分。
- 同一条记录必须整体迁移，不能拆散执行命令、结果摘要与 Review Gate 结论。

## 2. 入口说明

- 新归档入口应优先放入本目录下的模块 / 日期分片。
- 2026-04-21 治理切片归档: [2026-04-21-governance-rollup.md](./2026-04-21-governance-rollup.md)
- 2026-04 中旬历史窗口: [2026-04-18-to-2026-04-21.md](./2026-04-18-to-2026-04-21.md)
- 旧活动日志迁移快照: [legacy-plan-regression-log.md](./legacy-plan-regression-log.md)
- 旧归档日志迁移快照: [legacy-plan-regression-log-archive.md](./legacy-plan-regression-log-archive.md)
- 旧 `docs/plan/` 目录中的回归正文已整体迁移到上述 legacy 快照；原 plan 侧入口已移除。
- 若本目录下的单一索引继续膨胀，应再向年份或半年度分片，而不是把新旧记录混回 `docs/plan/`。
