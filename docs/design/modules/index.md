# 功能模块索引 (Modules Index)

墨梅博客采用模块化架构，每个功能模块通常包含独立的 UI 组件、API 路由、业务逻辑以及数据库实体。

## 核心业务模块 (Core Business)

- **[博客内容 (Blog Content)](./blog)**: 文章创作、分类、标签及阅读统计。
- **[创作安全 (Creative Security)](./creative-security)**: 本地草稿自动保存与内容版本化管理。
- **[认证系统 (Auth System)](./auth)**: 基于 Better-Auth 的多端登录、OAuth 及权限管理。
- **[分类与标签 (Taxonomy)](./taxonomy)**: 多维度的内容组织架构，支持翻译。
- **[用户空间 (User Space)](./user)**: 个人资料、偏好设置和我的文章。

## 增强功能模块 (Enhanced Features)

- **[AI 辅助创作 (AI Assistant)](./ai)**: 支持标题生成、SEO 优化及智能翻译。
- **[AI 语音创作 (Voice)](./voice)**: 浏览器原生 V2T 与后端 AI 润色集成。
- **[AI 绘图 (AI Image)](./ai-image)**: 多模态异步图像生成任务与任务追踪。
- **[订阅与通知 (Notifications)](./notifications)**: 多维订阅、邮件推送营销及通知偏好管理。
- **[邮件系统 (Email System)](./email)**: 国际化系统邮件、验证码与周刊推送。
- **[搜索系统 (Search)](./search)**: 多维度过滤与即时全文检索。
- **[评论与互动 (Interactions)](./interactions)**: 评论树、订阅表单与反馈机制。

## 系统与定制 (System & Customization)

- **[主题系统 (Theme System)](./theme)**: 可视化风格定制、画廊方案与零闪烁切换。
- **[后台管理 (Admin)](./admin)**: 全局仪表盘、实体运维及系统监控。
- **[系统能力与设置 (System & Settings)](./system)**: 混合配置模式、安装向导与部署优化。
- **[存储管理 (Storage)](./storage)**: 本地存储与对象存储 (S3/Cloudflare) 的统一抽象。
- **[定时任务 (Scheduled Tasks)](./scheduled-publication)**: 适配 Serverless 的定时发布与任务引擎。

## 扩展与集成 (Extensions)

- **[商业化与社交 (Commercial)](./commercial)**: 打赏赞助系统及多语言社交名片展示。
- **[第三方集成 (Third-party)](./third-party)**: Wechatsync 插件同步及 Memos 碎片知识集成。
- **[开放接口 (Open API)](./open-api)**: 提供外部发布与数据同步的标准化接口。
- **[MCP 服务器 (MCP Server)](./mcp)**: 基于 Model Context Protocol 的 AI 自动化接口，支持 Claude Desktop 集成。
- **[离线/桌面支持 (Desktop)](./demo-mode)**: 基于 Tauri 或 PWA 的桌面体验 (开发中)。
- **[播客与多媒体 (Podcast)](./podcast)**: 音频托管与 Podcast RSS 支持。
- **[数据迁移 (Migration)](./migration)**: 支持从其他博客平台（如 Hexo, Hugo）平滑迁移到墨梅。
- **[灵感碎片 (Inspiration)](./inspiration)**: 记录瞬间灵感并自动关联知识图谱。
- **[渲染引擎 (Rendering)](./rendering)**: 基于 Nuxt Server Engine 的高效渲染策略。

---

### 文档维护原则

1. **唯一事实来源**: 确保文档与代码实现同步，避免陈旧设计误导。
2. **结构一致性**: 每个模块文档应包含：概述、核心功能、技术实现和开发建议。
3. **低耦合**: 描述模块时明确其依赖项。
