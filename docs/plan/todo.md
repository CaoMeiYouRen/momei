# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第五阶段：生态深化与体验极致 (Ecosystem Deepening & Extreme Experience) (策划中)

### 1. 订阅中心与通知系统 (Subscription Hub & Notification System) (P1)
具体文档：[订阅中心与通知系统](../design/modules/notifications.md)
- [x] **多格式集成订阅源 (Universal Feeds)**
    - 验收: 在现有 RSS 2.0 基础上，增加对 **Atom 1.0** 和 **JSON Feed 1.1** 的原生支持。
    - 验收: 确保在所有格式中，音频附件 (Enclosure/Attachment)均能被正确解析且不与封面图冲突。
- [x] **多维订阅管理中心 (Subscription Management)**
    - 验收: 在用户设置中增加“订阅管理”页签，允许用户查看当前订阅状态。
    - 验收: **维度级订阅**: 支持用户按分类/标签勾选感兴趣的内容，实现精准推送。
    - 验收: 提供“一键取消订阅”功能。
- [x] **全站通知控制 (Unified Notifications)**
    - 验收: 整合系统通知（强制：登录提示、安全警告）与营销通知（可选：版本更新、功能推荐）。
    - 验收: 在用户管理中心提供营销类通知的订阅/退订开关。
- [x] **管理员营销管分发中心 (Marketing Admin Center)**
    - 验收: 后台增加营销模板配置页面，支持撰写简单的通知正文。
    - 验收: **灰度/定向分发**: 支持管理员选择特定标签/分类的订阅者进行投递。
    - 验收: 提供发送记录与基本的到达状态查看逻辑。
- [x] **通知系统强化与模块补全 (Notification Strengthening)** (P1)
    - [x] 验收: **营销类型区分**: 扩展 `MarketingCampaign` 类型字段，支持 `UPDATE`, `FEATURE`, `PROMOTION`, `BLOG_POST`, `MAINTENANCE`, `SERVICE`六大类。
    - [x] 验收: **博客推送联动 (二次确认机制)**: 
        - [x] 文章发布确认框增加“推送选项”（不推送/存为草稿/立即发送）。
        - [x] 实现首次发布时的逻辑分支，确保不同步误发。
        - [x] 文章管理页增加“再次推送到邮件”操作，支持预设内容。
    - [x] 验收: **管理员站务接收**: 后台增加管理员通知配置页，涵盖新用户、新评论、API 错误及系统警报。
    - [x] 验收: **通知系统详细设计**: 完成针对站内通知 (In-app) 与 浏览器推送 (Web Push) 的详细设计文档。
- [x] **邮件模板与队列优化 (Templates & Queue)** (P2)
    - [x] 验收: **卡片式 HTML 模板引擎**: 实现基于 `table` 布局的 HTML 模板，支持封面图卡片展示。
    - [x] 验收: **发送前测试**: 增加“发送预览邮件到管理员邮箱”的功能，确保渲染正确。
    - [x] 验收: **变量替换引擎**: 实现支持多语言（$t）和自定义变量（{{articleTitle}}）的替换逻辑。

### 2. 商业化集成 (Monetization) (P2)
- [x] **流量增长与变现 (Growth & Monetization)**
    - [x] 验收: **多维度显隐控制**: 支持按当前页面语言 (zh-CN/en-US) 动态决定外链/打赏码的展示与隐藏。
    - [x] 验收: **后台商业配置优化**: 提取共享组件 CommercialLinkManager 实现代码复用，并增加权限校验 (RBAC)。
    - [x] 验收: **社交链接与打赏集成**: 实现基于“个人配置+全局覆盖”的社交引流与赞助系统。
        - [x] 设计文档设计：[商业化与社交集成设计文档](../design/modules/commercial.md)
        - [x] 共享类型定义：[utils/shared/commercial.ts](../../utils/shared/commercial.ts)
        - [x] 数据库 Schema 更新：User 实体增加链接字段
        - [x] 缓存/配置项更新：COMMERCIAL_SPONSORSHIP
        - [x] 后端 API 实现：全局与个人配置的 CRUD
        - [x] 前端 UI 实现：文章底部渲染、个人中心配置、系统后台配置
    - [x] 验收: **多平台支持**: 覆盖微信、支付宝、爱发电等国内平台及 GitHub, Patreon, PayPal 等国际平台。
    - [x] 验收: **自定义扩展**: 提供 1-2 个自定义位置供用户配置特定图片/链接。
    - [x] 验收: **位置适配**: 在文章详情页末尾（正文后、版权声明前）增加显著的社交引导与打赏入口。
    - [x] 验收: **安全校验**: 对自定义 URL 加载进行白名单与协议校验。

### 3. AI 语音创作增强 (AI Voice Creative Enhancement) (P1)
具体文档：[AI 语音创作增强](../design/modules/voice.md)
- [ ] **语音创作工作流 (Voice-to-Post)**
    - [ ] 验收: **轻量化识别内核**: 实现基于 Web Speech API 的浏览器原生 V2T (Voice-to-Text) 识别。
    - [ ] 验收: **多语言适配**: 识别引擎根据当前博文语言自动切换识别语种 (zh/en)。
    - [ ] 验收: **实时反馈 UI**: 实现带动画的录音按钮及流式文本预览浮层。
    - [ ] 验收: **AI 联动润色**: 提供“一键 AI 优化”动作，将识别出的口语文本通过现有 AI 路由转化为书面博文片段。
    - [ ] 验收: **回退机制**: 针对不支持 Web Speech API 的浏览器提供优雅降级方案。

### 4. 高级 AI 创作流 (Advanced AI Creative Flow) (P1)
- [ ] **多模态创作增强**
    - 验收: 集成 AI 封面图生成 (DALL-E) 与 DeepL 专业协议翻译系统。

### 5. 文档国际化与系统固化 (Documentation & Hardening) (P1)
- [ ] **文档全球化 (Docs i18n)**
    - 验收: 部署指南、开发手册等核心文档完成英文翻译，VitePress 站点支持双语切换。

### 6. 第三方平台集成 (Third-party Integration) (P2)
- [x] **设计与调研 (Design & Research)**
    - 验收: 完成 Wechatsync 与 Memos 的接口调研，编写详细设计文档 [third-party.md](../design/modules/third-party.md)。
- [x] **Memos API 集成**
    - 验收: 实现 Memos v1 API 封装，支持在发布文章时同步推送摘要/正文。
    - 验收: 后台增加 Memos 实例 URL 与 Access Token 配置。
- [x] **Wechatsync 插件联动**
    - 验收: 集成 `article-syncjs` SDK，支持在后台管理页面一键唤起同步框。
    - 验收: 确保图片路径与 Markdown 格式转换符合国内平台（知乎/头条）抓取规范。

### 7. AI Agent 与自动化生态 (AI Agent & Automation Ecosystem) (P1)
- [ ] **Anthropic MCP Server 实现**
    - 验收: 实现符合 MCP 协议的服务端逻辑，通过 AI 助手自动化执行发布、查询及更新动作。
- [ ] **定时发布功能**
    - 验收: 实现独立定时任务调度逻辑，支持自部署(Cron)与 Serverless(Webhook) 触发，并在编辑页提供 UI 配置。

### 8. 系统固化 (System Hardening) (P1)
- [x] **认证配置强制锁定**: 
    - 验收: 在系统设置中，强制锁定 `AUTH_SECRET` 及 OAuth 凭据，防止在未重构前通过数据库修改导致配置不一致。
    - 验收: 更新系统设计文档，说明当前 Auth 变量的使用机制及长期优化路径。

### 9. 质量与维护 (Quality & Maintenance) (P0)
- [x] **文章编辑页面 UI/UX 优化 (Article Editor UI/UX Optimization)** (P1)
    - [x] 验收: **顶部工具栏聚合**: 将 AI 建议、翻译与格式化按钮进行视觉聚合，提升空间利用率。
    - [x] 验收: **发布状态重定位**: 将文章发布状态标签移至“发布”按钮旁，与操作逻辑对齐。
    - [x] 验收: **语言切换器优化**: 重构顶部语言切换逻辑，使其更符合直觉。
    - [x] 验收: **“同步”图标纠偏**: 将微信/多平台同步按钮图标更改为 `pi-sync`，明确“同步”而非“分享”语义。
    - [x] 验收: **设置侧边栏交互升级**: 
        - [x] 将 Drawer 改为自定义侧边栏（不产生遮罩）。
        - [x] 实现内容区随侧边栏开关的平滑位移动画，头部工具栏不再被遮挡。
        - [x] 新建文章时侧边栏默认展开，并支持“精简”与“标准”两种宽度切换。
- [x] **修复类型检查错误**
    - [x] 识别 `cli/src/parser.test.ts` 中未使用变量 `vi` (TS6133)
    - [x] 移除冗余代码并验证 `pnpm run typecheck`

---

> **说明**: 长期规划与积压项已统一迁移至 [项目计划](./roadmap.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [roadmap.md](./roadmap.md) 中添加。
## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
