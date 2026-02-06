# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第五阶段：生态深化与体验极致 (Ecosystem Deepening & Extreme Experience) (策划中)

### 1. 订阅中心与通知系统 (Subscription Hub & Notification System) (P1)
具体文档：[订阅中心与通知系统](../modules/notifications.md)
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
- [ ] **通知系统强化与模块补全 (Notification Strengthening)** (P1)
    - [x] 验收: **营销类型区分**: 扩展 `MarketingCampaign` 类型字段，支持 `UPDATE`, `FEATURE`, `PROMOTION`, `BLOG_POST`, `MAINTENANCE`, `SERVICE`六大类。
    - [x] 验收: **博客推送联动 (二次确认机制)**: 
        - [x] 文章发布确认框增加“推送选项”（不推送/存为草稿/立即发送）。
        - [x] 实现首次发布时的逻辑分支，确保不同步误发。
        - [x] 文章管理页增加“再次推送到邮件”操作，支持预设内容。
    - [x] 验收: **管理员站务接收**: 后台增加管理员通知配置页，涵盖新用户、新评论、API 错误及系统警报。
- [ ] **邮件模板与队列优化 (Templates & Queue)** (P2)
    - [x] 验收: **卡片式 HTML 模板引擎**: 实现基于 `table` 布局的 HTML 模板，支持封面图卡片展示。
    - [ ] 验收: **发送前测试**: 增加“发送预览邮件到管理员邮箱”的功能，确保渲染正确。
    - [x] 验收: **变量替换引擎**: 实现支持多语言（$t）和自定义变量（{{articleTitle}}）的替换逻辑。

### 2. 商业化集成 (Monetization) (P2)
- [ ] **流量增长与变现 (Growth & Monetization)**
    - [ ] 验收: **私域引流**: 文章详情页增加公众号关注二维码及引导说明。
    - [ ] 验收: **打赏模块**: 支持后台配置微信/支付宝收款二维码图片，并在前台页面展示。

### 3. AI 语音创作增强 (AI Voice Creative Enhancement) (P1)
- [ ] **语音创作工作流 (Voice-to-Post)**
    - 验收: 集成 Whisper 模型进行语音录入。
    - 验收: 配合 AI 助手实现“语音转博文”或“对话式润色”工作流，显著提升移动端/碎片化写作体验。

### 4. 高级 AI 创作流 (Advanced AI Creative Flow) (P1)
- [ ] **多模态创作增强**
    - 验收: 集成 AI 封面图生成 (DALL-E) 与 DeepL 专业协议翻译系统。

### 5. 文档国际化与系统固化 (Documentation & Hardening) (P1)
- [ ] **文档全球化 (Docs i18n)**
    - 验收: 部署指南、开发手册等核心文档完成英文翻译，VitePress 站点支持双语切换。

### 6. 第三方平台集成 (Third-party Integration) (P2)
- [ ] **多平台同步发布 (Multi-platform Sync)**
    - 验收: 调研并集成 Memos API，支持在发布文章时勾选同步发布。
    - 验收: 集成 Wechatsync (或其 MCP 接口)，支持一键发布至知乎、头条等 25+ 平台。

### 7. AI Agent 与自动化生态 (AI Agent & Automation Ecosystem) (P1)
- [ ] **Anthropic MCP Server 实现**
    - 验收: 实现符合 MCP 协议的服务端逻辑，通过 AI 助手自动化执行发布、查询及更新动作。
- [ ] **定时发布功能**
    - 验收: 实现独立定时任务调度逻辑，支持自部署(Cron)与 Serverless(Webhook) 触发，并在编辑页提供 UI 配置。

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
