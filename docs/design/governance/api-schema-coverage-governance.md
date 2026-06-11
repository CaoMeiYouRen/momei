# API Schema 覆盖与复用治理

> 生成日期: 2026-06-11
> 基线: 26 schema 文件, ~120 API endpoints

## 1. Schema 覆盖率分层

### 1.1 覆盖矩阵

| 模块 | Endpoints | Schema 文件 | 覆盖状态 | 说明 |
|:---|:---|:---|:---|:---|
| **posts** | 15+ | `post.ts`, `post-distribution.ts`, `post-hexo-repository-sync.ts` | **部分** | 核心 CRUD 有 schema，部分动作端点缺失 |
| **categories** | 5 | `category.ts` | **完整** | CRUD 全覆盖 |
| **tags** | 5 | `tag.ts` | **完整** | CRUD 全覆盖 |
| **comments** | 5 | `comment.ts` | **完整** | CRUD 全覆盖 |
| **submissions** | 3 | `submission.ts` | **完整** | 全部覆盖 |
| **subscribers** | 4 | `subscriber.ts` | **完整** | 全部覆盖 |
| **friend-links** | 8 | `friend-link.ts` | **完整** | 全部覆盖 |
| **snippets** | 5 | `snippet.ts` | **部分** | CRUD 有 schema，convert 缺失 |
| **notifications** | 5 | `notification.ts` | **部分** | 部分端点有 schema |
| **settings** | 15+ | `settings.ts` | **部分** | 核心设置完整，子模块分散 |
| **agreements** | 8 | `agreement.ts` | **完整** | 全部覆盖 |
| **auth** | 6 | `auth.ts` | **完整** | 全部覆盖 |
| **install** | 6 | `install.ts` | **完整** | 全部覆盖 |
| **search** | 1 | `search.ts` | **完整** | 唯一端点覆盖 |
| **ai** | 20+ | `ai.ts`, `audio.ts` | **部分** | 核心 AI 有，specific 端点缺失 |
| **waitlist** | 2 | `benefit-waitlist.ts` | **完整** | 全部覆盖 |
| **external** | 10+ | `external-feed.ts`, `external-post-import.ts` | **部分** | 部分端点无 schema |
| **migration** | 5 | `migration-link-governance.ts` | **部分** | 部分端点无 schema |
| **upload** | 3 | `upload.ts` | **完整** | 全部覆盖 |
| **calendar** | 0 | — | **缺失** | 无独立 API，无 schema 需求 |

### 1.2 统计

| 分层 | 数量 | 占比 |
|:---|:---|:---|
| **完整覆盖** | 11 模块 | 58% |
| **部分覆盖** | 7 模块 | 37% |
| **缺失** | 1 模块 | 5% |

## 2. 可共享 Schema 候选清单

| # | Schema | 可共享到 | 收益 |
|:---|:---|:---|:---|
| 1 | `pagination.ts` (`paginationSchema`, `sortingSchema`) | 所有列表端点 | 消除内联分页定义重复 |
| 2 | `category.ts` / `tag.ts` | 合并为 `taxonomy.ts` | 分类和标签 schema 结构高度相似 |
| 3 | UUID/ID 校验 | 所有 `[id]` 端点 | 统一路由参数校验 |

## 3. Schema 复用样板

### 样板 1: `paginationSchema` 复用 — 通知列表

将内联分页替换为共享 `paginationSchema`。

### 样板 2: `category.ts` ↔ `tag.ts` 共享合并

两者均有 `name`, `slug`, `sortOrder` 字段，可提取公共 `taxonomyBaseSchema`。

### 样板 3: 通知端点 Schema 完善

`delivery-logs.get.ts` 当前无 schema，补上 `paginationSchema` + 日期范围查询。
