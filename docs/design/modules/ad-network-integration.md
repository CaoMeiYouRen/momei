# 广告投放与外链跳转 (Ad Delivery & Redirect Gate)

## 1. 概述

本文档聚焦第八阶段已经落地的广告位投放、广告脚本加载、外链短链跳转与点击追踪能力。

作者社交链接、打赏项回退与文章页赞助区属于商业化主链路，已统一收敛到 [商业化与社交集成设计文档](./commercial.md)。这里不再重复描述作者级/全局级赞助展示规则。

## 2. 当前实现结构

### 2.1 广告适配器与配置解析

广告平台能力已经以“适配器 + 配置解析 + 广告位实体”的方式落地：

- 适配器抽象定义在 [server/services/adapters/base.ts](../../server/services/adapters/base.ts)
- 内置适配器注册在 [server/services/adapters/index.ts](../../server/services/adapters/index.ts)
- 广告网络配置解析位于 [server/utils/ad-network-config.ts](../../server/utils/ad-network-config.ts)
- 公共脚本接口位于 [server/api/ads/script.get.ts](../../server/api/ads/script.get.ts)

当前脚本接口并不是凭空生成，而是先从 `COMMERCIAL_SPONSORSHIP` 中解析可用广告网络配置，再按适配器生成脚本内容。

### 2.2 广告位与广告活动

广告位选择与定向逻辑已经落地在 [server/services/ad.ts](../../server/services/ad.ts)，并依赖以下实体：

- `AdPlacement`
- `AdCampaign`

当前服务能力包括：

- 按位置获取广告位
- 按语言、分类、标签进行定向过滤
- 校验广告活动状态和生效时间
- 基于 `maxViewsPerSession` 做会话级展示频控

公开查询入口为 [server/api/ads/placements.get.ts](../../server/api/ads/placements.get.ts)。该接口会为访问者建立 `momei_ad_session_id` Cookie，用于频控统计。

### 2.3 前端渲染与内容注入

当前前端已具备两类广告消费方式：

- 独立广告位组件：[components/ad-placement.vue](../../components/ad-placement.vue)
- 文章正文广告注入：[composables/use-ad-injection.ts](../../composables/use-ad-injection.ts)

脚本加载则由 [composables/use-ad-script.ts](../../composables/use-ad-script.ts) 统一处理，避免同一适配器脚本重复注入。

## 3. 外链短链与跳转门

### 3.1 当前链路

外链管理能力已在代码中形成独立链路：

- 业务服务：[server/services/link.ts](../../server/services/link.ts)
- 跳转接口：[server/api/goto/[code].get.ts](../../server/api/goto/[code].get.ts)

当前行为包括：

- 生成唯一短码
- 校验 URL 仅允许 `http` / `https`
- 支持环境变量黑名单过滤
- 记录点击次数
- 返回目标链接、标题、favicon 与是否显示跳转页的元信息

### 3.2 当前安全约束

外链服务已经具备以下基础安全控制：

- 黑名单域名拦截：通过 `EXTERNAL_LINK_BLACKLIST` 控制
- 非法 URL 拒绝写入
- 被封禁或过期链接在跳转接口层面直接返回拒绝结果

## 4. 接口与文件索引

### 4.1 对外接口

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/ads/placements` | 获取当前上下文可展示的广告位 |
| GET | `/api/ads/script` | 获取一个或多个广告适配器脚本 |
| GET | `/api/goto/:code` | 获取短链跳转信息并记录点击 |

### 4.2 核心实现文件

| 文件 | 说明 |
| :--- | :--- |
| [server/services/ad.ts](../../server/services/ad.ts) | 广告位筛选、活动状态判断与频控 |
| [server/services/link.ts](../../server/services/link.ts) | 短链生成、黑名单过滤与点击追踪 |
| [components/ad-placement.vue](../../components/ad-placement.vue) | 广告位渲染组件 |
| [composables/use-ad-injection.ts](../../composables/use-ad-injection.ts) | 正文广告注入 |
| [composables/use-ad-script.ts](../../composables/use-ad-script.ts) | 广告脚本去重加载 |

## 5. 当前边界

以下事项仍属于后续增强，而不是当前已完整交付范围：

- 广告位和广告活动的后台运维界面补齐
- 更完整的收益统计与转化报表
- 广告回调验签与第三方回传整合

也就是说，第八阶段已经不再只是“广告系统方案设计”，但仍未扩展成完整的商业投放后台。

## 6. 相关文档

- [商业化与社交集成设计文档](./commercial.md)
- [系统能力与设置](./system.md)
