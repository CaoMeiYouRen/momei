# 功能模块索引 (Modules Index)

墨梅博客采用模块化架构，每个功能模块通常包含独立的 UI 组件、API 路由、业务逻辑以及数据库实体。

## 模块总设计 (Canonical Module Docs)

以下文档是各主题的主入口，负责提供稳定的高层总览。若同主题存在专项治理、迁移或阶段复盘文档，应以这里列出的总设计文档作为优先入口。

### 核心业务模块 (Core Business)

- **[博客内容 (Blog Content)](./blog)**: 文章创作、分类、标签及阅读统计。
- **[创作安全 (Creative Security)](./creative-security)**: 本地草稿自动保存与内容版本化管理。
- **[认证系统 (Auth System)](./auth)**: 基于 Better-Auth 的多端登录、 OAuth 及权限管理。
- **[国际化系统 (Internationalization)](./i18n)**: 原生多语言支持、后端全量国际化与翻译关联。
- **[分类与标签 (Taxonomy)](./taxonomy)**: 多维度的内容组织架构，支持翻译。
- **[用户空间 (User Space)](./user)**: 个人资料、偏好设置和我的文章。

### 增强功能模块 (Enhanced Features)

- **[AI 辅助创作 (AI Assistant)](./ai)**: 支持标题生成、SEO 优化及智能翻译。
- **[语音识别 (ASR)](./asr)**: 语音识别模块总览、驱动模式与治理边界。
- **[音频与播客 (Audio & Podcast)](./audio)**: 音频托管、TTS 自动生成以及 Podcast RSS 支持。
- **[AI 绘图 (AI Image)](./ai-image)**: 多模态异步图像生成任务与任务追踪。
- **[内容订阅 (Subscription)](./subscription)**: 全站 RSS/Atom/JSON Feed 及邮件订阅工作流。
- **[通知系统 (Notifications)](./notifications)**: 多维通知矩阵管理、实时站内信推送与偏好控制。
- **[邮件系统 (Email System)](./email)**: 国际化系统邮件、验证码与响应式模板。
- **[搜索系统 (Search)](./search)**: 多维度过滤与即时全文检索。
- **[阅读模式 (Reader Mode)](./reader-mode)**: 极简沉浸式阅读面板与视觉自定义方案。
- **[评论与互动 (Interactions)](./interactions)**: 评论树、订阅表单与反馈机制。
- **[友链系统 (Friend Links)](./friend-links)**: 友链展示、自助申请、后台审核与巡检闭环。
- **[商业化与社交 (Commercial)](./commercial)**: 作者社交链接、打赏配置与文章页赞助展示。
- **[广告投放与外链跳转 (Ad Delivery)](./ad-network-integration)**: 广告位、广告脚本与短链跳转门。

### 系统与定制 (System & Customization)

- **[主题系统 (Theme System)](./theme)**: 可视化风格定制、画廊方案与零闪烁切换。
- **[后台管理 (Admin)](./admin)**: 全局仪表盘、实体运维及系统监控。
- **[系统能力与设置 (System & Settings)](./system)**: 系统能力高层概览与部署边界。
- **[存储管理 (Storage)](./storage)**: 本地存储与对象存储 (S3/Cloudflare) 的统一抽象。
- **[定时任务 (Scheduled Tasks)](./scheduled-publication)**: 自部署与 Serverless 场景的统一任务触发链路。

### 扩展与集成 (Extensions)

- **[开放发布协议 (Federation Protocols)](./federation-protocols)**: WebFinger 与 ActivityPub 只读联邦端点。
- **[看板娘系统 (Live2D)](./live2d)**: 可选虚拟角色组件，支持移动端/省流量降级与异步加载。
- **[第三方集成 (Third-party)](./third-party)**: Wechatsync 插件同步及 Memos 碎片知识集成。
- **[开放接口 (Open API)](./open-api)**: 提供外部发布与数据同步的标准化接口。
- **[MCP 服务器 (MCP Server)](./mcp)**: 基于 Model Context Protocol 的 AI 自动化接口，支持 Claude Desktop 集成。
- **[演示模式 (Demo Mode)](./demo-mode)**: 针对演示环境的权限模拟与交互。
- **[数据迁移 (Migration)](./migration)**: 支持从其他博客平台（如 Hexo, Hugo）平滑迁移到墨梅。
- **[灵感碎片 (Inspiration)](./inspiration)**: 记录瞬间灵感并自动关联知识图谱。
- **[渲染引擎 (Rendering)](./rendering)**: 基于 Nuxt Server Engine 的高效渲染策略。

## 专项治理与增量设计 (Supplemental Governance & Delta Docs)

以下文档用于记录阶段性收敛、治理契约、迁移方案或专项优化，不应与上方主文档重复描述整套模块能力：

- **[国际化扩展与多语言 SEO 统一设计](./i18n-seo-unification)**: `i18n.md` 的专项扩展，聚焦 Locale Registry、语言就绪度与 SEO 契约统一。
- **[配置项多语言国际化与回退治理](./settings-i18n-fallback-governance)**: `system.md` / `i18n.md` 的联合治理补充，聚焦管理员可编辑配置的结构化多语言存储、旧值兼容与统一回退链。
- **[AI 成本治理与多用户配额](./ai-cost-governance)**: `ai.md` 的治理补充，聚焦额度、失败扣额与后台审计口径。
- **[ASR 性能与体验优化](./asr-performance-optimization)**: `asr.md` 的专项优化，聚焦临时凭证、压缩与异步追踪。
- **[第三方分发解耦与投递控制](./content-distribution-governance)**: `third-party.md` 的分发治理补充，聚焦外部分发状态机与投递边界。
- **[系统配置深度解耦与统一化](./system-config-unification)**: `system.md` 的配置治理补充，聚焦来源解释、锁定和审计。
- **[Cloudflare 运行时兼容研究与止损结论](./cloudflare-runtime-study)**: `system.md` / `scheduled-publication.md` 的平台边界补充，聚焦 Workers / Pages / D1 的阻塞清单、最小样机边界与止损条件。
- **[AI 初始化 / 配置问答助手评估](./ai-setup-assistant-evaluation)**: `ai.md` / `system.md` / `qa-assistant` 交界处的专项评估文档，聚焦范围冻结、事实源复用、安全边界与最小原型建议。
- **[Post 元数据统一化迁移方案](./post-metadata-unification)**: `blog.md` / `system.md` 之间的跨模块专项文档，聚焦 `Post` 元数据模型统一与迁移。
- **[迁移链接治理与云端资源重写](./migration-link-governance)**: `migration.md` 的专项治理补充，聚焦链接治理和 `dry-run / apply / report` 契约。
- **[CLI / MCP 自动化能力扩展设计](./cli-mcp-automation)**: 自动化工具链专项文档，聚焦 CLI、MCP 与脚本化协作边界。
- **[文章批量翻译编排能力评估](./batch-translation-orchestration)**: `ai.md` / `cli-mcp-automation.md` 的专项评估文档，聚焦批次范围冻结、父子任务模型、确认流与 Serverless 边界。
- **[E2E 测试增强设计文档](./e2e-testing-enhancement)**: 跨模块质量设计，聚焦关键路径验证与自动化测试增强。
- **[外部 RSS / RSSHub 聚合挂载设计](./subscription-external-feed-aggregation)**: `subscription.md` 的专项增量文档，聚焦外部源统一接入、缓存降级与首页挂载模型。

## 阶段复盘与审计记录 (Phase Review & Audit Docs)

- **[第八阶段实施审计与复盘](./phase-8-feasibility-report)**: 已完成阶段的收尾审计文档，只保留阶段结论与索引，不再承担当前设计说明职责。

---

### 文档维护原则

1. **唯一事实来源**: 模块总设计负责总览，专项文档只记录增量结论与治理规则。
2. **真实实现优先**: 设计文档以当前代码实现为准，不保留已失效的方案稿表述。
3. **索引可发现**: 已落地的重要专项文档应在模块索引与站点侧边栏中可见。
4. **避免重复扩写**: 若专项文档已经冻结某一子问题，不应再在主文档中全文重复；主文档应改为链接与摘要。
5. **严重漂移可下线**: 若专项治理文档长期无法代表当前实现，优先收敛为更短的 delta 文档；若已无参考价值，应归档或直接删除，不保留完整的失效说明书。
