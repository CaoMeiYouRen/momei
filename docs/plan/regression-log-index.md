# 墨梅博客 回归日志索引与对比指南

本文档为 `regression-log.md` 与 `regression-log-archive.md` 提供统一索引入口，明确活动日志与历史归档在“当前基线 / 历史基线 / 发版对比”中的职责分工，并给出最小可用的对比路径。

## 1. 入口职责

| 入口 | 定位 | 默认用途 |
| :-- | :-- | :-- |
| [regression-log.md](./regression-log.md) | 活动回归日志 | 保留最近 1 - 2 个阶段或最近 6 - 8 条完整记录，优先用于当前阶段收口、近期发版判断与最近基线比较。 |
| [regression-log-archive.md](./regression-log-archive.md) | 历史归档日志 | 保留已滚动迁出的旧记录，优先用于历史基线回溯、长期漂移比对与旧阶段证据追溯。 |

## 2. 当前基线索引

当前活动窗口以“近线可比较”为目标，保留 2026-03-22 至 2026-03-30 的 7 条记录。

| 时间 | 主题 | 阶段 / 用途 | 入口 |
| :-- | :-- | :-- | :-- |
| 2026-03-30 | PostgreSQL 数据库流量热点首轮收敛回归 | 第十九阶段当前基线；用于数据库流量热点与最小治理判断 | [regression-log.md](./regression-log.md) |
| 2026-03-30 | 重复代码治理与纯函数复用基线回归 | 第十九阶段当前基线；用于 shared helper 复用收敛对比 | [regression-log.md](./regression-log.md) |
| 2026-03-23 | MJML 依赖链 high 风险替换回归 | 最近一次 release 安全门禁与依赖替换对比基线 | [regression-log.md](./regression-log.md) |
| 2026-03-23 | 浏览器验证与性能预算基线深化回归 | 最近一次 V3 / V4 浏览器与预算收敛基线 | [regression-log.md](./regression-log.md) |
| 2026-03-22 | 文章新建页多语言切换回归 | 最近一次后台编辑器交互修复基线 | [regression-log.md](./regression-log.md) |
| 2026-03-22 | release 依赖包风险门禁回归 | 最近一次 release 依赖审计基线 | [regression-log.md](./regression-log.md) |
| 2026-03-22 | AI 视觉资产收敛回归 | 最近一次视觉资产与生成契约收敛基线 | [regression-log.md](./regression-log.md) |

## 3. 历史基线索引

当前归档窗口保留 2026-03-20 至 2026-03-21 的 5 条记录，主要承担“旧阶段基线回溯”的职责。

| 时间 | 主题 | 阶段 / 用途 | 入口 |
| :-- | :-- | :-- | :-- |
| 2026-03-21 | 认证会话获取频率治理回归 | 第十七阶段认证链路历史基线 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-03-21 | 测试、性能与依赖安全干净基线回归 | 早期 clean baseline；用于 release / 质量门禁纵向对比 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-03-21 | 专项回归记录 | 第十六阶段代码质量与结构收敛历史基线 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-03-21 | 文档、配置与数据库基线同步回归 | 第十六阶段 docs / config / database 历史基线 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-03-20 | 首次回归基线记录 | 第十五阶段首次基线；用于长期历史追溯 | [regression-log-archive.md](./regression-log-archive.md) |

## 4. 最小对比路径

1. 当前基线: 先看 [regression-log.md](./regression-log.md) 的近线记录，判断当前阶段是否已经形成可放行的最新证据。
2. 历史基线: 若需要核对“是否比早期更好”或“某类问题首次出现于何时”，再对照 [regression-log-archive.md](./regression-log-archive.md) 中的旧记录。
3. 发版对比: 遇到 release、依赖安全、浏览器稳定性等发版敏感主题，优先使用活动日志中的最近一条同主题记录，对照归档中的最近 clean baseline 或历史同类专项。

## 5. 本轮滚动归档演示（2026-03-30）

- 归档前: `regression-log.md` 共 648 行，包含 11 条完整记录；`regression-log-archive.md` 为空归档占位。
- 归档后: `regression-log.md` 收敛为近线 7 条记录；`regression-log-archive.md` 接管 2026-03-20 至 2026-03-21 的 5 条历史记录。
- 主日志 vs 归档日志示例 1:
  - 近线入口: `MJML 依赖链 high 风险替换回归（2026-03-23）`
  - 历史入口: `测试、性能与依赖安全干净基线回归（2026-03-21，V2）`
  - 用途: 对比 release 依赖安全门禁从“仍有 high 风险延期”到“风险链已替换并放行”的演进。
- 主日志 vs 归档日志示例 2:
  - 近线入口: `浏览器验证与性能预算基线深化回归（2026-03-23，V3/V4）`
  - 历史入口: `认证会话获取频率治理回归（2026-03-21）`
  - 用途: 对比浏览器验证从认证链路专项回归，扩展到多引擎与移动端最小关键路径的范围升级。

## 6. 维护约定

- 活动日志继续遵循“最近 1 - 2 个阶段或最近 6 - 8 条完整记录”的窗口约束。
- 新增记录时，优先更新 [regression-log.md](./regression-log.md)；只有当主日志再次超出阅读窗口时，才整体迁移旧记录到 [regression-log-archive.md](./regression-log-archive.md)。
- 若归档文件继续膨胀，再按年份或半年拆分，但入口仍统一从本索引页进入。
