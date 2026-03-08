# 功能模块索引 (Modules Index)

墨梅博客采用模块化架构，每个功能模块通常包含独立的 UI 组件、API 路由、业务逻辑以及数据库实体。

## 核心业务模块 (Core Business)

- **[博客内容 (Blog Content)](./blog)**: 文章创作、分类、标签及阅读统计。
- **[创作安全 (Creative Security)](./creative-security)**: 本地草稿自动保存与内容版本化管理。
- **[认证系统 (Auth System)](./auth)**: 基于 Better-Auth 的多端登录、 OAuth 及权限管理。
- **[国际化系统 (Internationalization)](./i18n)**: 原生多语言支持、后端全量国际化与翻译关联。
- **[国际化扩展与多语言 SEO 统一设计 (I18n & SEO Unification)](./i18n-seo-unification)**: 面向多语言扩展、翻译模块化、页面 SEO 契约与 sitemap 统一生成的阶段性专项设计。
- **[分类与标签 (Taxonomy)](./taxonomy)**: 多维度的内容组织架构，支持翻译。
- **[用户空间 (User Space)](./user)**: 个人资料、偏好设置和我的文章。

## 增强功能模块 (Enhanced Features)

- **[AI 辅助创作 (AI Assistant)](./ai)**: 支持标题生成、SEO 优化及智能翻译。
- **[AI 成本治理与多用户配额 (AI Cost Governance)](./ai-cost-governance)**: 统一 AI 审计模型、额度单位、失败扣额口径与后台治理视图。
- **[语音识别 (ASR)](./asr)**: 语音识别模块总览、驱动模式与治理边界。
- **[ASR 性能与体验优化 (ASR Performance)](./asr-performance-optimization)**: 临时凭证、轻量压缩与异步任务追踪。
- **[音频与播客 (Audio & Podcast)](./audio)**: 音频托管、TTS 自动生成以及 Podcast RSS 支持。
- **[AI 绘图 (AI Image)](./ai-image)**: 多模态异步图像生成任务与任务追踪。
- **[内容订阅 (Subscription)](./subscription)**: 全站 RSS/Atom/JSON Feed 及邮件订阅工作流。
- **[通知系统 (Notifications)](./notifications)**: 多维通知矩阵管理、实时站内信推送与偏好控制。
- **[邮件系统 (Email System)](./email)**: 国际化系统邮件、验证码与响应式模板。
- **[搜索系统 (Search)](./search)**: 多维度过滤与即时全文检索。
- **[阅读模式 (Reader Mode)](./reader-mode)**: 极简沉浸式阅读面板与视觉自定义方案。
- **[评论与互动 (Interactions)](./interactions)**: 评论树、订阅表单与反馈机制。
- **[商业化与社交 (Commercial)](./commercial)**: 作者社交链接、打赏配置与文章页赞助展示。
- **[广告投放与外链跳转 (Ad Delivery)](./ad-network-integration)**: 广告位、广告脚本与短链跳转门。

## 系统与定制 (System & Customization)

- **[主题系统 (Theme System)](./theme)**: 可视化风格定制、画廊方案与零闪烁切换。
- **[后台管理 (Admin)](./admin)**: 全局仪表盘、实体运维及系统监控。
- **[系统能力与设置 (System & Settings)](./system)**: 系统能力高层概览与部署边界。
- **[系统配置深度解耦与统一化 (System Config Unification)](./system-config-unification)**: 配置来源、锁定与审计细节。
- **[文章元数据统一化 (Post Metadata Unification)](./post-metadata-unification)**: 面向 `Post` 的统一元数据模型、Patch 规则与分阶段迁移方案。
- **[存储管理 (Storage)](./storage)**: 本地存储与对象存储 (S3/Cloudflare) 的统一抽象。
- **[定时任务 (Scheduled Tasks)](./scheduled-publication)**: 自部署与 Serverless 场景的统一任务触发链路。

## 扩展与集成 (Extensions)

- **[开放发布协议 (Federation Protocols)](./federation-protocols)**: WebFinger 与 ActivityPub 只读联邦端点。
- **[看板娘系统 (Live2D)](./live2d)**: 可选虚拟角色组件，支持移动端/省流量降级与异步加载。
- **[第三方集成 (Third-party)](./third-party)**: Wechatsync 插件同步及 Memos 碎片知识集成。
- **[开放接口 (Open API)](./open-api)**: 提供外部发布与数据同步的标准化接口。
- **[MCP 服务器 (MCP Server)](./mcp)**: 基于 Model Context Protocol 的 AI 自动化接口，支持 Claude Desktop 集成。
- **[演示模式 (Demo Mode)](./demo-mode)**: 针对演示环境的权限模拟与交互。
- **[数据迁移 (Migration)](./migration)**: 支持从其他博客平台（如 Hexo, Hugo）平滑迁移到墨梅。
- **[灵感碎片 (Inspiration)](./inspiration)**: 记录瞬间灵感并自动关联知识图谱。
- **[渲染引擎 (Rendering)](./rendering)**: 基于 Nuxt Server Engine 的高效渲染策略。

---

### 文档维护原则

1. **唯一事实来源**: 高层文档只保留总览，细节统一下沉到专项文档。
2. **真实实现优先**: 设计文档以当前代码实现为准，不保留已失效的方案稿表述。
3. **索引可发现**: 已落地的重要专项文档应在模块索引与站点侧边栏中可见。
