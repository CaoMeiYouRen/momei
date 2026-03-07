# 商业化与社交集成设计文档 (Commercial & Social Integration)

## 1. 概述

本文档作为商业化模块的主文档，只描述当前已经落地的作者社交链接、打赏配置与文章页赞助展示链路。

为避免重复，广告位投放、广告脚本加载、外链短链跳转与点击追踪已收敛到 [广告投放与外链跳转](./ad-network-integration.md)，这里不再重复展开。

## 2. 当前已实现范围

### 2.1 作者级与全局级双层配置

当前商业化信息分为两层来源：

- 作者私有配置：存储在 `User.socialLinks` 与 `User.donationLinks`。
- 全局默认配置：存储在 `SettingKey.COMMERCIAL_SPONSORSHIP`，用于作者未配置时的回退展示。

### 2.2 按语言过滤与回退

渲染逻辑已在 [components/article-sponsor.vue](../../components/article-sponsor.vue) 落地，实际行为如下：

1. 先筛选作者配置中符合当前语言的社交链接和打赏项。
2. 若作者当前语言下无可展示项，则回退到全局商业化配置。
3. 若全局配置被禁用，则不展示任何全局回退内容。

这意味着“作者优先、全局兜底、按语言过滤”的策略已经是运行中行为，而不是设计预案。

### 2.3 前后台编辑能力

当前已存在统一的商业化编辑组件 [components/commercial-link-manager.vue](../../components/commercial-link-manager.vue)，同时服务于：

- 用户个人设置页：维护自己的社交链接与打赏项。
- 管理后台系统设置页：维护站点级的默认商业化配置。

组件已支持：

- 预设平台与自定义平台
- 链接或二维码图片两种目标形式
- 多语言 `locales` 选择
- 图片预览、编辑与删除

## 3. 配置模型与展示规则

### 3.1 数据来源

| 层级 | 存储位置 | 用途 |
| :--- | :--- | :--- |
| 作者级 | `User.socialLinks` / `User.donationLinks` | 个性化社交入口与打赏方式 |
| 全局级 | `COMMERCIAL_SPONSORSHIP` 设置项 | 站点级回退展示与统一开关 |

### 3.2 公开读取与写入接口

当前接口已经和代码保持一致：

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/settings/commercial` | 获取公开可展示的全局商业化配置 |
| GET | `/api/user/commercial` | 获取当前登录用户自己的社交/打赏配置 |
| PUT | `/api/user/commercial` | 更新当前登录用户的社交/打赏配置 |
| GET | `/api/admin/settings/commercial` | 获取后台系统级商业化配置 |
| PUT | `/api/admin/settings/commercial` | 更新系统级商业化配置，并写入设置审计 |

其中：

- [server/api/settings/commercial.get.ts](../../server/api/settings/commercial.get.ts) 会返回 `meta.isLocked`，用于标识全局配置是否被环境变量锁定。
- [server/api/admin/settings/commercial.put.ts](../../server/api/admin/settings/commercial.put.ts) 通过系统设置服务写入 `COMMERCIAL_SPONSORSHIP`，因此天然复用了第八阶段落地的配置审计链路。

### 3.3 文章页渲染规则

[components/article-sponsor.vue](../../components/article-sponsor.vue) 当前已经支持：

- 社交链接与打赏链接分区展示
- 二维码类配置通过对话框弹出预览
- URL 类配置直接跳转
- 平台图标、颜色与名称基于共享配置表渲染

该组件是当前商业化展示的唯一事实来源，后续文档应以该组件行为为准。

## 4. 安全与边界

### 4.1 当前已落地的安全控制

- 用户与管理员写入接口均使用 Zod Schema 校验。
- 全局配置写入通过设置服务统一处理，保留来源、原因与操作者信息。
- 图片目标统一走站内上传组件，避免文档假设存在独立的二维码托管系统。

### 4.2 本文档不再重复的内容

以下能力已经存在，但不在本文重复描述：

- 广告位实体、广告活动与适配器体系
- 广告脚本公开接口与前端注入能力
- 外链短链、黑名单过滤与跳转页

对应内容统一维护在 [广告投放与外链跳转](./ad-network-integration.md)。

## 5. 后续增强方向

当前阶段仍可继续补强以下体验：

- 全局配置锁定原因的可解释性
- 商业化配置与广告投放配置的后台入口整合
- 更细粒度的展示统计与点击归因

## 6. 相关文档

- [广告投放与外链跳转](./ad-network-integration.md)
- [系统能力与设置](./system.md)
- [系统配置深度解耦与统一化](./system-config-unification.md)
