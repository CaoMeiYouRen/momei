# 墨梅博客 回归日志索引与对比指南

本文档为 `regression-log.md` 与 `regression-log-archive.md` 提供统一索引入口，明确活动日志与历史归档在“当前基线 / 历史基线 / 发版对比”中的职责分工，并给出最小可用的对比路径。

## 1. 入口职责

| 入口 | 定位 | 默认用途 |
| :-- | :-- | :-- |
| [regression-log.md](./regression-log.md) | 活动回归日志 | 保留最近 1 - 2 个阶段或最近 6 - 8 条完整记录，优先用于当前阶段收口、近期发版判断与最近基线比较。 |
| [regression-log-archive.md](./regression-log-archive.md) | 历史归档日志 | 保留已滚动迁出的旧记录，优先用于历史基线回溯、长期漂移比对与旧阶段证据追溯。 |

## 2. 当前基线索引

当前活动窗口已完成滚动归档；[regression-log.md](./regression-log.md) 现收敛为 `389` 行、`6` 条近线记录，保留第二十二阶段当前收口所需的最小基线。更早记录已迁移至 [regression-log-archive.md](./regression-log-archive.md)。

当前仍应优先关注以下近线主题：

| 时间 | 主题 | 阶段 / 用途 | 入口 |
| :-- | :-- | :-- | :-- |
| 2026-04-06 | 周期性回归调度入口落地 | 第二十二阶段主线 2 当前基线；用于周级 / 发版前 / 阶段收口前三条固定 cadence 的执行入口与 blocker 判定 | [regression-log.md](./regression-log.md) |
| 2026-04-06 | 测试有效性增强治理首轮切入 | 第二十二阶段内容访问控制链路失败路径与异常映射基线 | [regression-log.md](./regression-log.md) |
| 2026-04-06 | ESLint 规则分阶段收紧治理首批实装 | 第二十二阶段规则收紧的首次实装基线 | [regression-log.md](./regression-log.md) |
| 2026-04-06 | ESLint 规则分阶段收紧治理测试债清零与扩面 | 第二十二阶段规则治理当前基线；用于 production / test 边界与 warning 收紧对比 | [regression-log.md](./regression-log.md) |
| 2026-04-06 | ESLint 规则分阶段收紧治理第二梯队生产命中收敛 | 第二十二阶段第二梯队生产债务清零基线 | [regression-log.md](./regression-log.md) |
| 2026-04-05 | ESLint 规则分阶段收紧治理首轮基线 | 第二十二阶段规则债务准入与采样基线 | [regression-log.md](./regression-log.md) |

## 3. 历史基线索引

当前归档窗口保留 2026-03-20 至 2026-04-02 的 `17` 条记录，主要承担“旧阶段基线回溯”和“已完成阶段证据追溯”的职责。

| 时间 | 主题 | 阶段 / 用途 | 入口 |
| :-- | :-- | :-- | :-- |
| 2026-04-02 | 测试覆盖率阶段性抬升治理首轮基线 | 第二十一阶段 coverage 历史基线 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-04-01 | UI 真实环境 Review Gate 证据规范补强 | 第二十一阶段 UI Review Gate 历史基线 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-04-01 | 重复代码检测自动化回归 | 第二十阶段重复代码治理历史基线 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-03-21 | 认证会话获取频率治理回归 | 第十七阶段认证链路历史基线 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-03-21 | 测试、性能与依赖安全干净基线回归 | 早期 clean baseline；用于 release / 质量门禁纵向对比 | [regression-log-archive.md](./regression-log-archive.md) |
| 2026-03-20 至 2026-03-31 | 更早阶段专项记录 | 第十五至第二十阶段的历史专题基线 | [regression-log-archive.md](./regression-log-archive.md) |

## 4. 最小对比路径

1. 当前基线: 先看 [regression-log.md](./regression-log.md) 的近线记录，判断当前阶段是否已经形成可放行的最新证据。
2. 历史基线: 若需要核对“是否比早期更好”或“某类问题首次出现于何时”，再对照 [regression-log-archive.md](./regression-log-archive.md) 中的旧记录。
3. 发版对比: 遇到 release、依赖安全、浏览器稳定性等发版敏感主题，优先使用活动日志中的最近一条同主题记录，对照归档中的最近 clean baseline 或历史同类专项。

## 5. 本轮滚动归档演示（2026-04-06）

- 归档前: [regression-log.md](./regression-log.md) 一度膨胀到约 `1015` 行、`17` 条记录，并触发 `pnpm regression:phase-close --dry-run` 的窗口 blocker。
- 归档后: [regression-log.md](./regression-log.md) 收敛为 `389` 行、`6` 条近线记录；[regression-log-archive.md](./regression-log-archive.md) 接管 2026-03-20 至 2026-04-02 的 `17` 条历史记录。
- 主日志 vs 归档日志示例 1:
  - 近线入口: `周期性回归调度入口落地（2026-04-06）`
  - 历史入口: `测试覆盖率阶段性抬升治理首轮基线（2026-04-02）`
  - 用途: 对比第二十二阶段的固定 cadence 调度口径，与上一阶段 coverage 基线如何衔接到 phase-close 收口。
- 主日志 vs 归档日志示例 2:
  - 近线入口: `ESLint 规则分阶段收紧治理测试债清零与扩面（2026-04-06）`
  - 历史入口: `重复代码检测自动化回归（2026-04-01）`
  - 用途: 对比第二十二阶段规则门禁扩面与第二十阶段脚本化质量治理的连续演进。

补充状态（2026-04-06）:

- 当前主日志窗口已恢复可用；下一次归档应继续遵循“超过 300 - 400 行或 6 - 8 条完整记录”再滚动迁移旧记录的规则。
- 下次 phase-close 可直接基于新的主日志窗口重新执行，无需再为同一批历史记录重复整理索引。

## 6. 维护约定

- 活动日志继续遵循“最近 1 - 2 个阶段或最近 6 - 8 条完整记录”的窗口约束。
- 新增记录时，优先更新 [regression-log.md](./regression-log.md)；只有当主日志再次超出阅读窗口时，才整体迁移旧记录到 [regression-log-archive.md](./regression-log-archive.md)。
- 若归档文件继续膨胀，再按年份或半年拆分，但入口仍统一从本索引页进入。
