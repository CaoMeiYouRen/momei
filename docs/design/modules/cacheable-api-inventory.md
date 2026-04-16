# 可缓存接口清单

本文档用于沉淀当前阶段已落地的服务端接口短缓存策略，作为“接口缓存逻辑复用与可缓存接口扩面切片”主线的验收证据之一。它只记录当前已经接入统一缓存复用层的接口，不扩写为全站缓存设计总规范。

## 1. 适用范围

- 事实源: 当前阶段已接入 [server/utils/api-runtime-cache.ts](../../server/utils/api-runtime-cache.ts) 的公开读接口。
- 目标: 统一记录接口、TTL、共享边界、失效策略与观测 namespace，支撑后续 TTL 调优和回归审计。
- 非目标: 不描述 CDN、Redis、Nitro 多实例一致性缓存，也不替代运行期 `pg_stat_statements` 样本。

## 2. 接口清单

| 接口 | 代码入口 | TTL | 共享边界 | 失效策略 | 观测 namespace |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 公开站点设置 | [server/api/settings/public.get.ts](../../server/api/settings/public.get.ts) | `60s` | 仅匿名公共响应共享；非公共响应走 `private, no-store` | 当前以短 TTL 自然过期为主；后续若后台设置写接口统一接入 namespace 失效，可进一步缩短陈旧窗口 | `settings:public` |
| 公开友情链接列表 | [server/api/friend-links/index.get.ts](../../server/api/friend-links/index.get.ts) | `60s` | 公开读共享 | 当前以短 TTL 自然过期为主；后续可在友链管理写接口补 namespace 失效 | `friend-links:public` |
| 文章归档摘要 / 明细 | [server/api/posts/archive.get.ts](../../server/api/posts/archive.get.ts) | `60s` | 仅 `scope=public` 且匿名请求共享；管理态与带会话请求强制 `private, no-store` | 当前以短 TTL 自然过期为主，避免把文章写入链路立即扩写成全链路缓存工程 | `posts:archive` |
| 分类公开列表 | [server/api/categories/index.get.ts](../../server/api/categories/index.get.ts) | `60s` | 公开列表共享 | 分类新增 / 更新 / 删除时，通过 [server/api/categories/index.post.ts](../../server/api/categories/index.post.ts)、[server/api/categories/[id].put.ts](../../server/api/categories/%5Bid%5D.put.ts)、[server/api/categories/[id].delete.ts](../../server/api/categories/%5Bid%5D.delete.ts) 执行 namespace 级失效 | `categories:public-list` |
| 标签公开列表 | [server/api/tags/index.get.ts](../../server/api/tags/index.get.ts) | `60s` | 公开列表共享 | 标签新增 / 更新 / 删除时，通过 [server/api/tags/index.post.ts](../../server/api/tags/index.post.ts)、[server/api/tags/[id].put.ts](../../server/api/tags/%5Bid%5D.put.ts)、[server/api/tags/[id].delete.ts](../../server/api/tags/%5Bid%5D.delete.ts) 执行 namespace 级失效 | `tags:public-list` |

## 3. 观测口径

[server/utils/api-runtime-cache.ts](../../server/utils/api-runtime-cache.ts) 当前为每个 namespace 维护以下运行期计数器：

| 字段 | 含义 |
| :-- | :-- |
| `requests` | 进入缓存复用层的总请求次数 |
| `hits` | 命中运行时缓存次数 |
| `misses` | 未命中缓存、需执行 loader 的次数 |
| `bypasses` | 因共享边界不满足而直接旁路缓存的次数 |
| `writes` | 将响应写入运行时缓存的次数 |
| `hitRate` | `hits / requests`，用于后续 TTL 调优对比 |

当前阶段提供以下辅助能力：

- 统计快照: `getRuntimeApiCacheStatsSnapshot(namespace?)`
- 统计重置: `resetRuntimeApiCacheStats(namespace?)`
- namespace 失效: `invalidateRuntimeApiCacheNamespace(namespace)`

## 4. 当前结论

- 已形成统一的接口短缓存复用层，避免在接口内重复手写 TTL、`Cache-Control`、权限边界与 key 拼接逻辑。
- 已完成两组高频公共列表接口扩面验证: 分类公开列表与标签公开列表。
- 已形成可审计的“TTL + 共享边界 + 失效策略 + 观测 namespace”清单，可直接作为第二十七阶段该主线的验收证据入口。

## 5. 关联证据

- 活动回归日志: [docs/reports/regression/current.md](../../reports/regression/current.md)
- 当前待办: [docs/plan/todo.md](./todo.md)
- 路线图阶段摘要: [docs/plan/roadmap.md](./roadmap.md)
