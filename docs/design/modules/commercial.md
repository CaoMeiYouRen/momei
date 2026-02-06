# 商业化与社交集成设计文档 (Commercial & Social Integration)

## 1. 概述
本文档描述了“墨梅”博客的商业化集成与社交链接功能设计，旨在提升博主的获利能力（打赏/赞助）并增强社交媒体引流能力。

## 2. 核心功能
### 2.1 打赏/赞助 (Donation & Sponsorship)
*   **混合模式**：支持“个人作者打赏码”与“全局站长打赏码”。若作者配置了个人打赏，则在文章末尾显示作者的；否则回退到显示全局配置。
*   **多语言动态显隐 (Locale-Aware)**：
    *   允许为每个打赏项配置适用的语种（如：微信/支付宝仅在 `zh-CN` 下显示，GitHub Sponsors 在全语种或 `en-US` 下显示）。
    *   避免在不相关的语种页面展示无法使用的平台，提升专业感。
*   **支持平台**：
    *   **国内**：微信支付 (WeChat Pay)、支付宝 (Alipay)、爱发电 (Afdian)。
    *   **国际**：GitHub Sponsors, Open Collective, Patreon, Buy Me a Coffee, PayPal。
    *   **自定义**：支持 1-2 个自定义打赏项（名称 + URL / 二维码图片）。
*   **展示形式**：文章末尾显著的“打赏”按钮，点击后弹出选择框或直接显示（取决于当前语种过滤后的配置数量）。

### 2.2 社交链接 (Social Links)
*   **归属**：归属于个人作者。
*   **多语言动态显隐**：同打赏模块，可配置链接在特定语言下才生效（例如：B 站链接仅在中文版展示）。
*   **支持平台**：微信公众号、B 站、微博、知乎、X (Twitter)、YouTube、Facebook 等。
*   **展示形式**：作者信息区域或文章末尾。

## 3. 技术实现方案

### 3.1 数据库架构扩展

#### `User` 实体扩展
在 `User` 实体中增加两个 JSON 字段（或文本字段存储 JSON）：
*   `socialLinks`: 存储社交平台链接。
*   `donationLinks`: 存储打赏配置。

```typescript
interface SocialLink {
  platform: string; // 标识符，如 'bilibili', 'x', 'wechat_mp'
  url: string;      // 目标链接
  label?: string;   // 自定义标签（用于自定义平台）
}

interface DonationLink {
  platform: string;
  url?: string;     // 外部链接按钮
  image?: string;   // 二维码图片 URL（微信/支付宝）
  label?: string;
}
```

#### `Setting` 扩展 (SettingKey)
增加全局配置项：
*   `COMMERCIAL_SPONSORSHIP`: 存储全局打赏配置 (JSON)。

### 3.2 安全与验证
*   **图片上传**：支持通过 `app-uploader` 上传二维码图片。
*   **URL 白名单**：手动填写 URL 时，校验协议（https）及防范恶意链接。

### 3.3 UI 设计
1.  **管理后台 - 系统设置 - 商业化**：配置全局打赏。
2.  **个人中心 - 资料编辑 - 社交与打赏**：作者编辑个人链接。
3.  **前台文章页**：
    *   在文章正文结束后、版权声明前，插入 `ArticleSponsor` 组件。
    *   提供“赞赏支持”按钮，点击展示模态框。

## 4. 相关文档
*   [项目计划](../../plan/roadmap.md)
*   [待办事项](../../plan/todo.md)
*   [UI 设计](../ui.md)
