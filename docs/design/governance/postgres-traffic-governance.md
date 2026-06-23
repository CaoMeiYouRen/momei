# Postgres 流量治理 — 网络传输与 pg_stat_statements 开销分析

> 更新日期: 2026-06-14
> 数据源 A: Neon Monitoring（2026-06-01 至 2026-06-13）
> 数据源 B: 本地导出的 `pg_stat_statements.csv`（133 条语句样本）
> 结论口径: 同时覆盖网络传输、业务 SQL 流量与数据库 CPU 时间分布

## 1. 执行摘要

当前 Postgres 压力可以拆成两层：

1. Neon 账单层的风险仍然是网络传输偏高，`Network transfer` 已到 `4.43 / 5 GB`，短期内最需要持续压降返回体积。
2. `pg_stat_statements` 视角下，数据库总执行时间约 `1532.123 ms`，其中真正业务 SQL 只占 `114.631 ms`，约 `7.48%`；剩余时间大多消耗在 Neon / Postgres 自监控与元数据查询，而不是业务读写本身。
3. 业务 SQL 内部又高度集中在文章模块：文章相关查询占业务 SQL 总执行时间 `93.81%`，是当前唯一明确的数据库热点域。

## 2. 网络消耗全景

| 指标 | 已用 | 配额 | 占比 | 日均 | 预测耗尽 |
|:---|:---|:---|:---|:---|:---|
| Network transfer | 4.43 GB | 5 GB | **89%** | 341 MB | **4 天内** |
| Compute | 55.81 CU-hrs | 100 | 56% | 4.29 | 正常 |
| Storage | 0.2 GB | 0.5 | 40% | — | 正常 |

这说明治理目标不能只盯单条慢 SQL，还要区分：

- 返回体积大的路径是否在拉高网络配额。
- 执行复杂的路径是否在拉高数据库 CPU。

## 3. pg_stat_statements 总览

### 3.1 总体时间分布

| 维度 | 总执行时间 | 占比 |
|:---|:---|:---|
| 全部语句 | 1532.123 ms | 100% |
| 业务 SQL | 114.631 ms | 7.48% |
| 系统 / 监控 SQL | 1417.492 ms | 92.52% |

### 3.2 业务 SQL 时间分布

| 功能域 | 总执行时间 | 占业务 SQL 比例 | 调用次数 |
|:---|:---|:---|:---|
| 文章（Post / Tag / Category） | 107.533 ms | **93.81%** | 22 |
| 友链（Friend Link） | 3.595 ms | 3.14% | 3 |
| 设置（Setting） | 3.127 ms | 2.73% | 26 |
| 旧 `article` 表 | 0.329 ms | 0.29% | 4 |

### 3.3 业务 SQL 调用分布

| 功能域 | 调用次数 | 结论 |
|:---|:---|:---|
| 设置（Setting） | 26 | 高频但便宜 |
| 文章（Post） | 22 | 中频且最贵 |
| 旧 `article` 表 | 4 | 可忽略 |
| 友链（Friend Link） | 3 | 可忽略 |

结论：

- 业务流量最高的是设置读取，不是文章。
- 业务 CPU 时间最高的是文章查询，不是设置。
- 所以“流量热点”和“CPU 热点”不是同一个模块，治理动作需要分开设计。

## 4. 业务热点查询分析

### 4.1 文章详情页的相关文章查询 — 业务 CPU 第一热点

| 指标 | 值 |
|:---|:---|
| 代码位置 | [server/utils/post-detail.ts](../../../server/utils/post-detail.ts) |
| 入口函数 | `getRelatedPublicPosts()` |
| 单次总耗时 | **29.15 ms** |
| 返回行数 | 319 |
| 主要问题 | 多对多联表 + cluster 去重前候选集膨胀 |

对应实现见 [server/utils/post-detail.ts](../../../server/utils/post-detail.ts#L215)。该查询会：

- 联 `post.category`
- 联 `post.tags`
- 用 `COALESCE(category.translationId, category.slug, category.id)` 匹配分类 cluster
- 用 `COALESCE(tags.translationId, tags.slug, tags.id)` 匹配标签 cluster
- 再按时间排序后在应用层做 cluster bucket 去重和评分

根因判断：

- 这条 SQL 不是高频，但单次成本最高。
- 返回 `319` 行后最终只取少量相关文章，存在明显的候选集放大。
- CPU 很可能主要花在 join、排序和重复行生成，而不是纯粹的磁盘读取。

### 4.2 上一篇 / 下一篇导航 — 排序表达式热点

| 指标 | 值 |
|:---|:---|
| 代码位置 | [server/utils/post-detail.ts](../../../server/utils/post-detail.ts) |
| 入口函数 | `getAdjacentPublicPosts()` |
| 单次耗时 | 15.20 ms / 11.70 ms |
| 主要问题 | `COALESCE(post.publishedAt, post.createdAt)` 范围过滤与排序 |

对应实现见 [server/utils/post-detail.ts](../../../server/utils/post-detail.ts#L167)。查询特征：

- 条件固定：`language + status + visibility`
- 排除当前文章与当前翻译 cluster
- 用 `COALESCE(post.publishedAt, post.createdAt)` 做范围过滤
- 再按同一表达式排序

根因判断：

- 当前 [server/entities/post.ts](../../../server/entities/post.ts) 只有单列索引和 `(slug, language)` 唯一约束。
- 没有证据显示已存在覆盖 `language + status + visibility + timeline` 的组合索引。
- 因此这两条查询更像是索引形状不贴合，而不是数据体积问题。

### 4.3 文章列表 / 标签页 — 复杂过滤而非重字段失控

| 指标 | 值 |
|:---|:---|
| 代码位置 | [server/api/posts/index.get.ts](../../../server/api/posts/index.get.ts) |
| 入口函数 | 文章列表、标签筛选、归档类读取 |
| 代表耗时 | 10.67 ms / 8.45 ms / 4.89 ms / 2.95 ms |
| 主要问题 | `tag` 多对多 join + 语言 fallback 的 `NOT EXISTS` + `getManyAndCount()` |

对应实现见 [server/api/posts/index.get.ts](../../../server/api/posts/index.get.ts#L206) 和 [server/utils/post-list-query.ts](../../../server/utils/post-list-query.ts#L71)。

这里需要修正文档中的旧判断：

- 当前列表查询已经通过 [server/utils/post-list-query.ts](../../../server/utils/post-list-query.ts#L10) 的 `applyPostListSelect()` 明确限制字段，**不再是“TypeORM 默认 SELECT *”问题**。
- 列表页已主动排除了 `content`、`password` 等重字段，说明网络治理已经有一轮正确优化。

当前真正的复杂度来自：

- 标签页使用 `innerJoin('post.tags', 'tagBySlug', ...)`
- 公开列表启用 `applyPublishedPostLanguageFallbackFilter()`
- fallback 逻辑内部包含 `NOT EXISTS` 子查询，见 [server/utils/post-list-query.ts](../../../server/utils/post-list-query.ts#L71)
- `getManyAndCount()` 在多对多 join 下会生成 `DISTINCT` 包装查询，进一步拉高执行复杂度

结论：

- 这类查询的主要矛盾已经从“列太多”转移为“过滤条件和 join 形状复杂”。
- 它们更偏 CPU / 规划器压力，而不是单纯网络返回膨胀。

### 4.4 文章详情主查询 — 网络体积仍需关注

| 指标 | 值 |
|:---|:---|
| 代码位置 | [server/utils/post-detail-read.ts](../../../server/utils/post-detail-read.ts) |
| 入口函数 | `readPostDetail()` |
| 样本耗时 | 2 次共 8.19 ms，均值 4.10 ms |
| 主要问题 | 会读取正文 `post.content`，并联带作者、分类、标签 |

对应实现见 [server/utils/post-detail-read.ts](../../../server/utils/post-detail-read.ts#L17)。

这条查询不是 CPU 第一热点，但它具备网络治理风险：

- 明确读取 `post.content`
- 会把作者、分类、标签一并装载
- 如果详情页访问量持续升高，它更可能先打满带宽，而不是先打满数据库 CPU

因此它是“网络关注热点”，不是“当前 CPU 第一热点”。

### 4.5 设置读取 — 高频但不是瓶颈

| 指标 | 值 |
|:---|:---|
| 代码位置 | [server/services/setting.ts](../../../server/services/setting.ts#L502) |
| 调用次数 | 26 |
| 总耗时 | 3.127 ms |
| 特征 | 60s 运行时缓存 + 批量查询 |

结论：

- 设置读取是业务调用数第一，但成本极低。
- `getSettings()` 已带缓存与批量查询折叠逻辑，不应作为当前性能治理重点。

### 4.6 友链公共列表 — 当前不是热点

| 指标 | 值 |
|:---|:---|
| 代码位置 | [server/services/friend-link.ts](../../../server/services/friend-link.ts#L410) |
| 调用次数 | 3 |
| 总耗时 | 3.595 ms |
| 结论 | 量级很低，暂不优先优化 |

## 5. 系统 / 监控 SQL 分析

`pg_stat_statements` 中最耗时的并不是业务语句，而是平台和系统层查询，包括：

- `pg_database_size` / `pg_stat_database` / `pg_database`
- `pg_stat_activity`
- `pg_stat_replication`
- `pg_settings`
- `pg_catalog` 元数据读取

典型特征：

- 多条语句调用数在 `712` 次这一档
- 多条语句累计执行时间在 `70 ms ~ 300 ms`
- 样本里总时间占比远高于业务 SQL

治理含义：

- 如果观察到数据库 CPU 偏高，不能直接归因为业务代码。
- 至少在这份样本中，系统监控轮询本身就是总执行时间的大头。
- 业务优化仍然必要，但其目标是压缩文章模块热点，而不是解释全部数据库负载。

## 6. 优化优先级

| 优先级 | 优化项 | 主要文件 | 目标 |
|:---|:---|:---|:---|
| P0 | 相关文章查询改成“两段式候选集 + 回表” | [server/utils/post-detail.ts](../../../server/utils/post-detail.ts) | 降低多对多 join 导致的候选集膨胀 |
| P0 | 为上一篇 / 下一篇查询验证并补齐组合索引或函数索引 | 数据库迁移 + [server/utils/post-detail.ts](../../../server/utils/post-detail.ts) | 降低 `COALESCE(publishedAt, createdAt)` 排序扫描成本 |
| P1 | 评估文章列表 fallback 条件是否可拆分或预计算 | [server/utils/post-list-query.ts](../../../server/utils/post-list-query.ts) | 降低 `NOT EXISTS` 与 `DISTINCT` 组合复杂度 |
| P1 | 复核详情页作者字段选择 | [server/utils/post-detail-read.ts](../../../server/utils/post-detail-read.ts) | 继续压缩详情页返回体积 |
| P2 | 核对 Neon / exporter 监控采样频率 | 平台配置 | 确认系统 SQL 是否过度轮询 |

## 7. 验证建议

下一轮分析建议直接补齐以下证据，而不是只看聚合统计：

1. 对相关文章查询跑 `EXPLAIN ANALYZE`，确认时间主要耗在 join、sort 还是重复行去重。
2. 对上一篇 / 下一篇查询跑 `EXPLAIN ANALYZE`，验证是否命中可用索引。
3. 对标签页 / 文章列表查询分别采集“有 language fallback”和“无 language fallback”的执行计划，量化 `NOT EXISTS` 的真实代价。
4. 将 Neon Monitoring 的网络传输曲线与文章详情 / 列表页访问量对齐，确认当前带宽主因究竟是详情正文还是列表聚合接口。

## 8. 当前结论

- 网络配额风险依旧存在，详情页与列表页仍要持续控制返回体积。
- 业务数据库 CPU 热点已明确收敛到文章模块，尤其是相关文章、上一篇 / 下一篇、标签筛选三类查询。
- 设置读取和友链读取不是当前瓶颈。
- 样本中的数据库总执行时间大头来自系统监控 SQL，因此“数据库整体忙”不等于“业务 SQL 忙”。
## 9. 2026-06-23 补遗：Vercel 缓存层治理

2026-06-23 的跨数据源分析（Vercel 函数日志 + Neon 操作日志）为本文档的"网络传输"问题补充了一个关键发现：**网络传输高企的另一个驱动力是 Vercel Cache MISS 率 100% + Bot 流量 76% 导致的全量 SSR 穿透**，而非单纯的 SQL 查询体积问题。

> 详见 [Vercel 缓存穿透与 Bot 流量治理](./vercel-cache-bot-governance.md)。

两篇文档的关系：

| 文档 | 治理层面 | 解决的问题 |
|:---|:---|:---|
| **本文档** | SQL 层（数据库侧） | 单条查询耗时、返回体积、字段裁剪、索引优化 |
| [Vercel 缓存治理](./vercel-cache-bot-governance.md) | HTTP 层（CDN/SSR 侧） | 阻止不必要的请求穿透到数据库，从源头减少 DB 唤醒次数 |

两条路径互补：SQL 优化减少**每次查询的消耗**，CDN 缓存减少**查询发生的次数**。在 Neon 计费模型下（按 compute 启停和网络传输计费），减少查询次数与单次查询消耗同等重要。
