# 商业化与社交集成设计文档 (Commercial & Social Integration)

## 1. 概述
本文档描述了“墨梅”博客的商业化集成与社交链接功能设计。该功能旨在通过多语言、多地区的差异化展示逻辑，为博主提供精准的引流与变现能力。

## 2. 核心功能
### 2.1 打赏/赞助 (Donation & Sponsorship)
*   **混合模式**：支持“个人作者打赏码”与“全局站长打赏码”。
    *   **优先级**：作者个人配置 > 全局系统配置。
    *   **回退逻辑**：若作者未配置任何符合当前语言条件的打赏项，则回退显示全局配置中符合条件的项。
*   **多语言动态显隐 (Locale-Aware)**：
    *   **逻辑**：每个打赏项可绑定一个或多个 `locales`。
    *   **应用**：微信/支付宝仅在 `zh-CN` 下显示；GitHub Sponsors 在全语种或 `en-US` 下显示。
*   **支持平台**：
    *   **国内**：微信支付 (WeChat Pay)、支付宝 (Alipay)、爱发电 (Afdian)。
    *   **国际**：GitHub Sponsors, Open Collective, Patreon, Buy Me a Coffee, PayPal。
    *   **自定义**：支持自定义名称、图标与目标（URL 或二维码图片）。

### 2.2 社交链接 (Social Links)
*   **归属**：仅归属于个人作者，展示在文章末尾或作者名片处。
*   **多语言动态显隐**：同打赏模块。
*   **支持平台**：微信公众号、B 站、微博、知乎、掘金、GitHub、X (Twitter)、YouTube、Facebook、Discord 等。
*   **展示形式**：作者信息区域或文章末尾。
*   **自定义**：支持自定义名称、图标与目标（URL 或二维码图片）。

## 3. 技术实现方案

### 3.1 数据结构定义

#### 后端实体存储
*   **`User` 实体**：增加 `socialLinks` 和 `donationLinks` (类型为 `simple-json`)。
*   **`Setting` 表**：增加 `COMMERCIAL_SPONSORSHIP` 键，存储全局打赏 JSON。

#### TypeScript 接口 (`utils/shared/commercial.ts`)
```typescript
export interface SocialLink {
    platform: string; // 预设平台 ID 或 'custom'
    url: string;      // 链接地址
    label?: string;   // 自定义标签（仅 custom 使用）
    locales?: string[]; // 适用语种，为空代表全选
}

export interface DonationLink {
    platform: string;
    url?: string;     // 外部跳转链接
    image?: string;   // 二维码图片内链/外链
    label?: string;
    locales?: string[];
}
```

### 3.2 逻辑处理流程

#### 前端渲染逻辑 (Pseudocode)
```typescript
function getDisplaySponsors(authorLinks, globalLinks, currentLocale) {
  // 1. 过滤作者配置中符合 locale 的项
  const filteredAuthor = (authorLinks || []).filter(link => 
    !link.locales || link.locales.length === 0 || link.locales.includes(currentLocale)
  );
  
  if (filteredAuthor.length > 0) return filteredAuthor;

  // 2. 如果作者没配，过滤全局配置中符合 locale 的项
  return (globalLinks || []).filter(link => 
    !link.locales || link.locales.length === 0 || link.locales.includes(currentLocale)
  );
}
```

### 3.3 接口设计 (API)

*   **GET `/api/settings/commercial`**: 获取公开的全局商业化配置（过滤掉敏感信息）。
*   **PUT `/api/admin/settings/commercial`**: (管理员) 更新全局商业化配置。
*   **GET `/api/user/commercial`**: (登录用户) 获取自己的社交与打赏配置。
*   **PUT `/api/user/commercial`**: (登录用户) 更新自己的社交与打赏配置。

### 3.4 安全校验规则
1.  **URL 校验**：仅允许 `http://` 或 `https://` 协议，防范 `javascript:` 脚本注入。
2.  **图片校验**：自定义二维码图片需符合站点 `Allowed File Types` 规范，且在使用外部 URL 时需经过白名单过滤。
3.  **频率限制**：更新配置接口需接入 `rateLimit` 保护。

## 4. UI 交互设计
*   **配置页**：采用“列表 + 弹窗/行内编辑”模式。
    *   用户点击“添加”，选择平台，填写信息，并利用 **Multi-select 多选框** 选择展示语言（中文/英文/全部）。
*   **渲染页**：文章末尾增加 `ArticleSponsor` 组件。
    *   若仅有 1 个项：直接展示（若是图片则点击放大，若是链接则展示按钮）。
    *   若有多个项：展示“赞赏支持”按钮，点击弹出对话框选择平台。

## 5. 相关文档
*   [项目计划](../../plan/roadmap.md)
*   [待办事项](../../plan/todo.md)
*   [API 设计](../api.md)
