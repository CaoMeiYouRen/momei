# 友链前后博客环导航 — 可行性评估

## 1. 概述

评估在友链页（`pages/friend-links.vue`）中新增「前后博客环」导航功能的最小可行性与实施代价。

**评估日期**: 2026-06-14  
**结论**: **Go**（建议上收，约 4h 工作量）

## 2. 现有基础设施

### 2.1 数据模型

`FriendLink` 实体（`server/entities/friend-link.ts`）已具备环导航所需全部字段：

| 字段 | 类型 | 用途 |
|:---|:---|:---|
| `id` | varchar(36) | 唯一标识 |
| `name` | varchar(120) | 站点名（导航按钮 label） |
| `url` | varchar(500) | 站点链接（导航目标） |
| `logo` | varchar(500) | Logo 图片（导航缩略图） |
| `sortOrder` | int | 排序值（决定环内位置） |
| `isPinned` | boolean | 置顶标记 |
| `status` | varchar(20) | 状态（仅 ACTIVE 参与环） |
| `categoryId` | varchar(36) | 所属分类 |

### 2.2 API 现状

`GET /api/friend-links`（`server/api/friend-links/index.get.ts`）：
- 返回所有 `status=ACTIVE` 的友链，按 `isPinned DESC, sortOrder ASC, createdAt DESC` 排序
- 按分类分组返回
- 60s 运行时缓存

### 2.3 现有排序逻辑

`friendLinkService.getPublicFriendLinks()`（`server/services/friend-link.ts` L410-472）：
```
ORDER BY isPinned DESC, sortOrder ASC, createdAt DESC
```

`sortOrder` 字段在后台管理页可编辑（`pages/admin/friend-links/index.vue`），管理员可以为每个友链手动分配排序值。

### 2.4 现有 Travellings（开往）集成

项目已有独立的外部 Webring 集成（`components/travellings-link.vue`），通过 `https://www.travellings.cn/go.html` 实现跨站点随机跳转。该功能与友链系统**互相独立**，不共享数据模型。

## 3. 功能设计

### 3.1 目标范围

| 项目 | 说明 |
|:---|:---|
| 导航对象 | 公开友链页中每个友链卡片 |
| 排序依据 | 复用现有 `sortOrder` 字段 |
| 环行为 | 循环环：第一个链接的前一个是最后一个，最后一个链接的后一个是第一个 |
| 展示内容 | 相邻友链的名称 + logo + 方向箭头 |

### 3.2 非目标

- 不做随机跳转（已有 Travellings 承担）
- 不新增独立的排序算法（复用 `sortOrder`）
- 不新增数据库表或 Settings 配置项
- 不在后台管理页显示环预览

### 3.3 UX 草案

```
┌──────────────────────────────┐
│  ← 前一个博客    后一个博客 →  │
│  [logo] 站点A    [logo] 站点C  │
├──────────────────────────────┤
│        当前博客卡片            │
│    [logo] 站点B               │
│    https://example.com        │
│    描述文字...                 │
└──────────────────────────────┘
```

在每张友链卡片顶部或底部增加一行导航条，显示前/后友链的 logo 小图和名称，点击可跳转到对应友链站点。

## 4. 实施评估

### 4.1 后端改动

**方案 A（推荐）**: 在现有 `getPublicFriendLinks()` 响应中为每个链接附加 `prevId` / `nextId` 字段。

- 改动文件: `server/services/friend-link.ts`
- 新增 ~15 行：在排序后的链接列表中计算每个链接的前后 ID
- 无需新增 API 端点
- 改动量: <20 行

**方案 B（备选）**: 新增独立端点 `GET /api/friend-links/:id/nav` 返回前后链接。

- 改动文件: 新增 `server/api/friend-links/[id]/nav.get.ts`
- 更灵活但增加 API 面
- 不推荐（增量价值低）

### 4.2 前端改动

- 改动文件: `pages/friend-links.vue`
- 在友链卡片模板中添加导航条 UI
- 新增 ~30 行模板 + ~10 行样式
- 复用现有 PrimeVue 组件和 BEM 样式

### 4.3 i18n

- 新增 2 个翻译 key：`pages.links.prev_blog` / `pages.links.next_blog`
- 5 语言 × 2 key = 10 条翻译

### 4.4 测试

- 扩展现有 `pages/friend-links.test.ts`：验证 prev/next 导航存在
- 扩展现有 `server/services/friend-link.test.ts`：验证 `prevId`/`nextId` 正确计算

### 4.5 工作量估算

| 项目 | 估算 |
|:---|:---|
| 后端 `prevId`/`nextId` 计算 | 0.5h |
| 前端导航 UI | 1.5h |
| i18n 翻译 (5 语言) | 0.5h |
| 测试补充 | 1.0h |
| 文档同步 | 0.5h |
| **合计** | **~4h** |

## 5. 风险评估

| 风险 | 等级 | 缓解措施 |
|:---|:---|:---|
| `sortOrder` 冲突导致环顺序不稳定 | 低 | 使用 `sortOrder, id` 双字段排序确保确定性 |
| 只有一个友链时无前/后链接 | 低 | 当总链接数 ≤1 时隐藏导航条 |
| 导航按钮增加卡片高度 | 低 | 使用紧凑的水平导航条，不影响现有布局 |
| RSS Feed 聚合干扰 | 无 | RSS 功能独立于环导航，互不影响 |

## 6. 竞品参考

| 功能 | 本项目 | 开往 (Travellings) | 十年之约 |
|:---|:---|:---|:---|
| 随机跳转 | ✅ Travellings 集成 | ✅ 核心功能 | ✅ |
| 相邻导航 | ⬜ 本评估目标 | ❌ 不支持 | ❌ 不支持 |
| 友链分类 | ✅ 支持 | ❌ | ❌ |
| RSS 聚合 | ✅ 支持 | ❌ | ❌ |

与外部 Webring 项目相比，本项目已有更丰富的友链管理能力。「前后博客环」是差异化的补充——它让读者可以按顺序浏览友链，而非仅随机跳转。

## 7. Go/No-Go 结论

### ✅ Go

**理由**:
1. **数据模型就绪**: `FriendLink.sortOrder` 字段已存在，无需新增数据库字段
2. **API 改动极小**: 方案 A 只需在现有服务层追加 ~15 行
3. **UX 增量明确**: 为读者提供有序浏览友链的能力，与现有随机跳转（Travellings）互补
4. **实现代价低**: 约 4h 工作量，无新增依赖，无架构变更
5. **测试可覆盖**: 现有测试基座可扩展，回归风险低

### 建议上收条件

- 在下一阶段（Phase 51+）作为 P2 级增强功能正式上收
- 优先使用方案 A（现有端点附加 `prevId`/`nextId`）
- 实现前先冻结 `pages.friend-links.vue` 中导航条的 UI 草案
- 不与其他更高优先级任务并行推进

## 8. 相关文档

- [友链模块设计](../design/modules/friend-links.md)
- [FriendLink 实体定义](../../server/entities/friend-link.ts)
- [友链服务层](../../server/services/friend-link.ts)
- [友链公开页面](../../pages/friend-links.vue)
