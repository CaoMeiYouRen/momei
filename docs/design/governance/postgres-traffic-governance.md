# Postgres 流量治理 — 网络传输削减分析

> 日期: 2026-06-13
> 数据源: Neon Monitoring (6 月 1-13 日)
> 基线: Network transfer 4.43/5 GB (89%)

## 1. 网络消耗全景

| 指标 | 已用 | 配额 | 占比 | 日均 | 预测耗尽 |
|:---|:---|:---|:---|:---|:---|
| Network transfer | 4.43 GB | 5 GB | **89%** | 341 MB | **4 天内** |
| Compute | 55.81 CU-hrs | 100 | 56% | 4.29 | 正常 |
| Storage | 0.2 GB | 0.5 | 40% | — | 正常 |

## 2. 热点查询分析

### 2.1 Tag 列表页 — 最热路径 (#1)

| 指标 | 值 |
|:---|:---|
| 文件 | `server/api/posts/index.get.ts` |
| 调用次数 | 12 + 6 + 2 + 1 + 1 = **22 次**（占总调用 ~17%） |
| 单次耗时 | 0.1ms ~ 1.2ms |
| 问题 | **无 `.select()` 限制**，TypeORM `getManyAndCount()` 默认 `SELECT *` |

**当前查询**:

```sql
-- 35 列全量读取，含 post.content（最大字段）
SELECT post.id, post.title, post.slug, post.content, ...,
       author.id, author.name, author.email, ...,
       category.id, category.name, category.description, ...,
       tags.id, tags.name, tags.slug, ...
FROM momei_post post
LEFT JOIN momei_user author ON ...
LEFT JOIN momei_category category ON ...
LEFT JOIN momei_tag tags ON ...
INNER JOIN momei_tag tagBySlug ON tagBySlug.slug = $1
WHERE post.status = $2 AND ...
```

**根因**: `getManyAndCount()` 没有 `.select()` 约束，TypeORM 默认 `SELECT *`，包含：
- `post.content` (文章正文，最大字段)
- `post.metadata` (JSON 元数据)
- `author.email`, `author.socialLinks`, `author.donationLinks` (非公开信息)
- `category.description` (分类描述)
- `tags.translation_id` (翻译 ID)

**优化方向**: 列表页仅需 10 列：`id, title, slug, summary, coverImage, language, status, isPinned, publishedAt, createdAt` + `author.name` + `category.name, category.slug` + `tags.name, tags.slug`。

### 2.2 Settings 公开读取 (#3)

| 指标 | 值 |
|:---|:---|
| 文件 | `server/api/settings/public.get.ts` |
| 调用次数 | 5 (53-key batch) + 5 (15-key batch) + 31 (单 key) |
| 缓存 | **已有 60s TTL** (`PUBLIC_SETTINGS_CACHE_TTL_SECONDS`) |
| 单 key 调用 | 31 次 × 0ms = cache hit，**不是问题** |

**结论**: 公开 settings 已有缓存机制，31 次单 key 均为 cache hit（0ms），无需优化。批量读取是正常的冷启动/缓存过期行为。

### 2.3 文章详情页 (#4)

| 指标 | 值 |
|:---|:---|
| 文件 | `server/utils/post-detail-read.ts` |
| 调用次数 | 1 |
| 单次耗时 | 6.8ms |
| 问题 | `.addSelect(['author.email', 'author.socialLinks', 'author.donationLinks'])` |

**当前代码** (`post-detail-read.ts:21`):

```ts
.addSelect(['author.id', 'author.name', 'author.image',
            'author.email', 'author.socialLinks', 'author.donationLinks'])
```

`author.socialLinks` 和 `author.donationLinks` 是 JSON 数组字段，体积显著。`author.email` 已在后续 `processAuthorPrivacy()` 中处理，但网络层已传输。

**优化方向**: 移除 `author.socialLinks` 和 `author.donationLinks`（仅在作者公开页或管理后台需要），移除 `author.email`（已在隐私处理后剥离）。

### 2.4 前/后文章导航 (#2)

| 指标 | 值 |
|:---|:---|
| 文件 | `server/utils/post-detail.ts` |
| 调用次数 | 2 |
| 单次耗时 | 13.4ms |
| 问题 | COALESCE 多重排序，无索引命中 |

**当前查询**:

```sql
WHERE post.language = $1 AND post.status = $2 AND post.visibility = $3
  AND post.id != $4
  AND COALESCE(post.translation_id, post.id) != $5
  AND (COALESCE(post.published_at, post.created_at) < $6
       OR (COALESCE(post.published_at, post.created_at) = $6 AND post.id < $4))
ORDER BY COALESCE(post.published_at, post.created_at) DESC, post_id DESC
```

**优化方向**: 为 `(language, status, visibility, COALESCE(published_at, created_at))` 创建复合索引。

### 2.5 Category/Tag 归档页 (#5)

| 指标 | 值 |
|:---|:---|
| 调用次数 | 1 |
| 单次耗时 | 8.7ms |
| 问题 | 同上—无 select 限制 + COALESCE 排序 |

## 3. 优化优先级

| # | 优化项 | 文件 | 预期收益 | 工作量 |
|:---|:---|:---|:---|:---|
| **P0-1** | Tag 列表查询加 `.select()` 减列 (35→10) | `posts/index.get.ts` | **-60% 该路径传输** | 1h |
| **P0-2** | 文章详情移除 author.socialLinks/donationLinks/email | `post-detail-read.ts` | **-40% 该路径传输** | 0.5h |
| **P1** | 前/后导航索引优化 | `post-detail.ts` | -50% 耗时 | 1h |
| **P2** | 归档页减列（复用 P0-1 的 select 配置） | 同上 | — | 含在 P0-1 |

## 4. 预期总量削减

| 路径 | 当前行数 | 优化后 | 削减 |
|:---|:---|:---|:---|
| Tag 列表 (35→10 列) | ~35 cols × 22 calls | ~10 cols | **~60%** |
| 文章详情 (移除 3 个 JSON 字段) | ~42 cols × 1 call | ~30 cols | **~30%** |
| **综合预估** | 基准 | — | **日均 Network 从 341MB → ~200MB** |

## 5. 注意事项

- Settings 已有 60s 缓存，31 次单 key 0ms 调用为 cache hit，**无需优化**
- 减列时需确认前端页面不使用被移除的字段（如 `author.email` 在公开列表页不应暴露）
- 索引优化需在 Neon 上执行 `CREATE INDEX`，需验证不阻塞现有查询
