# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第五阶段：生态深化与体验极致 (Ecosystem Deepening & Extreme Experience) (策划中)

### 1. 精准推送与订阅 (Advanced Subscription) (P1)
- [ ] **多格式集成订阅源 (Universal Feeds)**
    - 验收: 在现有 RSS 2.0 基础上，增加对 **Atom 1.0** 和 **JSON Feed 1.1** 的原生支持。
    - 验收: 确保在所有格式中，音频附件 (Enclosure/Attachment) 均能被正确解析且不与封面图冲突。
- [ ] **维度级订阅推送**
    - 验收: 支持用户按分类/标签订阅特定邮件内容。
- [ ] **推送频率管理**
    - 验收: 实现用户的日报/周报聚合推送模式。

### 2. 商业化集成 (Monetization) (P2)
- [ ] **支付与会员体系**
    - 验收: 集成 Stripe 或支付宝接口，支持针对特定内容的打赏或 Pro 会员准入。
- [ ] **流量增长与变现 (Growth & Monetization)**
    - [ ] 验收: **私域引流**: 文章详情页增加公众号关注二维码及引导说明。
    - [ ] 验收: **打赏模块**: 支持后台配置微信/支付宝收款二维码图片，并在前台页面展示。

### 3. 播客与多媒体原生支持 (Podcast & Multimedia) (P1)
- [ ] **播客内容管理与 RSS**
    - 验收: 实现音轨上传与元数据管理，生成符合标准的 Podcast RSS 订阅源。
- [ ] **语音输入增强与转录**
    - 验收: 集成 Whisper 模型进行语音录入，配合 AI 助手实现“语音转博文”或“对话式润色”工作流。
- [ ] **音频文章协同 (AI TTS)**
    - 验收: 集成 AI TTS 服务，为文章一键生成/刷新音频版本。
- [ ] **全站播放体验**
    - 验收: 实现全站沉浸式悬浮播放器，支持跨页面断点续播。

### 4. 高级 AI 创作流 (Advanced AI Creative Flow) (P1)
- [ ] **多模态创作增强**
    - 验收: 集成 AI 封面图生成 (DALL-E) 与 DeepL 专业协议翻译系统。
- [ ] **灵感碎片深度重构**
    - 验收: 实现 AI 驱动的灵感片段自动分类、标注与关联知识图谱构建。

### 5. 文档国际化与系统固化 (Documentation & Hardening) (P1)
- [ ] **文档全球化 (Docs i18n)**
    - 验收: 部署指南、开发手册等核心文档完成英文翻译，VitePress 站点支持双语切换。
- [ ] **权限安全深度校验**
    - 验收: 彻底排查并修复特定页面（如后台敏感设置页等）的权限逻辑漏洞。

---

## 待规划与长期积压 (Backlog & Long-term Roadmap)

此处列出已规划但未纳入当前阶段执行的任务，用于长期版本跟踪。

### 1. 桌面端应用 (Desktop Application)
- [ ] **Tauri 跨平台应用**
    - 验收: 实现桌面客户端骨架，支持单站点/多站点管理。
    - 验收: 支持离线 Markdown 写作与间断性云端同步功能。

### 2. 极客技术增强 (Geek Tech Extras)
- [ ] **可执行代码块支持**
    - 验收: 实现 Markdown 代码块在特定环境下的运行与结果输出。
- [ ] **Git 版本管理**
    - 验收: 实现文章变更的 Git Commit 化追踪，支持查看历史版本差异。

### 3. 主题生态系统 (Theme Ecosystem)
- [ ] **主题社区与发布平台**
    - 验收: 允许创作者发布、分享并由他人安装自定义主题；建立安全审核机制防范 XSS 攻击。

### 4. 第三方平台集成 (Third-party Integration)
- [ ] **Memos 等多平台同步发布**
    - 验收: 调研并集成 [Memos](https://github.com/usememos/memos) API。
    - 验收: 支持在发布文章时勾选同步发布到已配置的第三方平台。

### 5. 其他优化项
- [ ] **感官体验增强**
    - 验收: 实现看板娘、背景粒子等可选的视觉增强开关。

### 6. AI Agent 与自动化生态 (AI Agent & Automation Ecosystem)
- [ ] **Anthropic MCP Server 实现 (基础版)**
    - 验收: 实现符合 MCP 协议的服务端逻辑，对接现有文章 API。
    - 验收: 提供三个核心工具定义：`publish_post` (发布新文章), `query_post_status` (查询文章状态/阅读数), `update_post` (更新已有内容)。
    - 验收: 在 Claude Desktop 等客户端中验证通过 AI 助手自动化执行上述动作。
- [ ] **定时发布功能 (任务驱动设计)**
    - 验收: **数据架构**: 建立独立的定时任务表 (`scheduled_tasks`)，记录目标文章 ID、预计发布时间及执行状态，避免污染文章元数据表。
    - 验收: **多环境调度支持**: 
        - [ ] 自部署场景实现基于内置调度或系统 `cronjob` 的触发逻辑。
        - [ ] Serverless 场景提供标准的 Webhook 触发入口以对接外部 Cron 服务。
    - 验收: **交互设计**: 文章编辑页增加“预约发布”专用按钮，弹窗配置发布时间。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
