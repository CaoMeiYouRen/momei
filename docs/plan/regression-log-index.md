# 墨梅博客 回归日志兼容索引

本文档当前仅作为兼容索引入口保留。新的正式管理入口已迁移到 [docs/reports/regression/index.md](../reports/regression/index.md)；本文件不再维护新的窗口统计、归档阈值或近线主题清单。

## 1. 正式入口

- 活动窗口: [docs/reports/regression/current.md](../reports/regression/current.md)
- 历史归档: [docs/reports/regression/archive/index.md](../reports/regression/archive/index.md)
- 深度归档与边界说明: [docs/reports/regression/index.md](../reports/regression/index.md)

## 2. 兼容入口职责

- [regression-log.md](./regression-log.md): 兼容跳转页，指向已迁移的旧活动日志快照与新的正式入口。
- [regression-log-archive.md](./regression-log-archive.md): 兼容跳转页，指向已迁移的旧归档日志快照与新的正式入口。
- 本文件只负责把旧入口导向新的正式入口，不再作为回归治理的事实源。

## 3. 使用约定

1. 新增回归正文统一写入 [docs/reports/regression/current.md](../reports/regression/current.md)。
2. 需要回看旧阶段全文时，再从 [regression-log.md](./regression-log.md) 或 [regression-log-archive.md](./regression-log-archive.md) 跳转到 `docs/reports/regression/archive/` 下的迁移快照。
3. 若需要确认活动窗口、历史归档与兼容入口的边界，以 [docs/reports/regression/index.md](../reports/regression/index.md) 为准。
