# 新功能点规划前置调研报告 (2026-06)

> 执行机制：按 [backlog 第 8 项「新功能点规划前置调研机制」](../../plan/backlog.md) 要求，在正式规划新功能前执行一次轻量竞品调研。
>
> 调研时间：2026-06-03
> 信息来源：TinyFish Search、Web Fetch（LeadAdvisors, Superblog, OpenPanel, Nunuqs, Reddit, HN, Dev.to, Maggie Appleton 等）
> 核实依据：CHANGELOG.md、docs/design/modules/index.md、docs/design/governance/index.md、源码审计

## 1. 已有能力基线（来自源码与文档核实）

本节列出墨梅**已实现**的核心能力，仅用于避免重复推荐。详细设计见 [模块总设计索引](../modules/index.md)。

| 领域 | 已实现能力 |
|:---|:---|
| **内容创作** | Markdown 编辑器 (mavon-editor)、AI 标题/摘要/标签生成、全文 AI 翻译、AI 配图、语音输入 (ASR)、TTS 文章朗读（后端 + 前端直连） |
| **邮件系统** | nodemailer + MJML 模板引擎、10 种邮件模板（验证/重置/OTP/MagicLink/安全通知/订阅确认/营销推送）、5 语言 locale、DB 存储模板覆盖 |
| **订阅系统** | 公开订阅表单、订阅者管理 (CRUD + CSV 导出)、用户自助订阅偏好（分类/标签筛选）、退订 (RFC 8058) |
| **营销推送** | 营销活动管理 (CRUD + 测试 + 统计)、Listmonk 集成、按分类/标签精准推送、邮件模板运行时预览 |
| **评论系统** | 树形评论、AI 翻译、游客评论、审核/垃圾过滤、粘性评论、跨 locale 聚合 |
| **通知系统** | SSE 实时推送、站内信 (InApp)、Web Push (VAPID)、邮件通知、通知偏好设置、管理员通知配置、投递日志 |
| **内容分发** | 多格式 Feed (RSS/Atom/JSON)、WechatSync 同步、Memos 集成、远程仓库同步 (Hexo 风格 GitHub/Gitee)、微信公众号预览|
| **GEO/SEO** | Sitemap、JSON-LD 结构化数据、llms.txt、Feed、分类/标签 SEO、多语言 hreflang |
| **国际化** | 5 语言 (zh-CN/zh-TW/en-US/ja-JP/ko-KR)、Locale Registry、动态路由、邮件 i18n、UI 运行时切换 |
| **后台管理** | 内容洞察首页 (趋势/排行)、创作者统计面板、分发状态面板、通知管理、营销管理、订阅者管理 |
| **联邦协议** | ActivityPub WebFinger 端点、RSS/Atom Feed |
| **其他** | 主题系统 (CSS Layers + 自定义配色)、Live2D 看板娘、MCP Server、演示模式、迁移 CLI、候补名单、友链系统、广告投放、存储抽象 (S3/Cloudflare R2) |

## 2. 已有 backlog 候选（避免重复推荐）

以下功能已在 [backlog.md](../../plan/backlog.md) 中存在，本节仅列摘要，不再作为新候选。

| backlog # | 功能 | 状态 |
|:---|:---|:---|
| #1 | 桌面端应用 (Tauri) | 候选 |
| #2 | 主题生态系统/市场 | 候选 |
| #3 | 播客与多媒体扩展 | 候选 |
| #4 | AI 视频生成 | 候选 |
| #5 | 国际化语种扩展 (es/pt/fr/ru/de) | 候选 |
| #6 | 付费增强验证 | 已交付最小闭环 |
| #7 | 可执行代码块 | 候选 |
| -- | 编辑器现代化 | backlog 长期主线提及，但未独立为候选条目 |

## 3. 市场趋势 (2025-2026) 与真实缺口分析

### 3.1 趋势摘要

| 趋势 | 描述 | 墨梅状态 |
|:---|:---|:---|
| **Indie Web 自托管迁移** | 创作者从 Substack / Medium 向自托管 (Ghost) 迁移 ([source](https://newsletter.projectc.biz/p/creator-journalism-is-fueling-a-bigger-decentralization-shift)) | ✅ 已具备 |
| **Digital Garden / 知识花园** | 非时序、双向链接、常青笔记、知识图谱组织内容 ([Maggie Appleton](https://maggieappleton.com/garden-history)) | ❌ 未覆盖 |
| **AI Agent 自动化** | 自主内容策划、排期、分发、优化闭环 ([source](https://www.admove.ai/blog/ai-agents-for-social-media-guide)) | ⚠️ 部分覆盖 (AI 创作) |
| **隐私优先自托管分析** | Plausible / Umami / OpenPanel 替代 GA4 的趋势 ([source](https://openpanel.dev/articles/self-hosted-web-analytics)) | ⚠️ 已接入 GA4/Clarity/百度，无自托管分析 |
| **内容多格式复用** | AI 将博文自动转为社交媒体帖子/视频脚本 ([source](https://bit-social.com/blog/content-repurposing-cant-ignore-it/)) | ❌ 未覆盖 |
| **协同编辑** | 多人实时协同编辑 (Google Docs / Notion 风格) | ❌ 未覆盖 |

### 3.2 墨梅差异化确认

基于本轮核实，墨梅的能力密度远超此前估计。以下优势在 2026 年市场上**仍然独有**：

1.  **「自托管 + AI 全链路创作 + 原生 5 语言国际化 + 多通道分发」一体化** — 无竞品能在所有这些维度上匹敌。
2.  **通知 / 订阅 / 营销三系统深度融合** — SSE + InApp + Email + WebPush + Listmonk 五位一体。
3.  **联邦协议已就绪** — ActivityPub WebFinger 端点已实现。

**需要追赶的方向**：
-   Ghost 在「会员付费 + Newsletter 原生」上更强（但墨梅已有完整邮件和订阅体系，差距主要在付费闭环）
-   Astro 在「纯内容站点性能」上更优（但墨梅 SSR/SSG/ISR 已可满足）

## 4. 真正的新增候选功能（未在 backlog 或已实现中出现）

### 4.1 Digital Garden / 知识花园模式 (P2, 探索)

**背景**: Digital Garden（数字花园）是 2025-2026 年个人网站的重要趋势。它区别于传统博客的「按时间倒序发布」模式，强调：
-   双向链接 (bidirectional links)：文章之间互相引用自动形成知识图谱
-   笔记状态 (seed → sapling → evergreen)：内容不是一次性发布，而是持续生长
-   非时序导航：按主题/标签/知识图谱浏览，而非只看最新文章

**墨梅缺口**: 当前只有分类 + 标签的树形组织，缺少双向链接追踪和内容生长状态。

**最小范围**: 文章间双向引用自动检测与展示、内容成熟度标记 (draft/evergreen)、知识图谱可视化 (可选)。
**非目标**: 不做完整 Zettelkasten 笔记系统、不与 Obsidian/Logseq 竞争。

### 4.2 AI 内容审计与质量优化 (P2)

**背景**: AI 写作工具已普遍支持「生成」，但「审计已有内容质量」是 2026 年的新方向 ([source](https://www.ryrob.com/ai-content-writing-tools/))。

**墨梅缺口**: AI 能力强在「生成」，缺少「审计」维度，如：
-   SEO 完整性检查（缺失 meta description、alt text、内部链接建议）
-   内容新鲜度扫描（过时信息标记、建议更新）
-   可读性评分与改进建议

**最小范围**: 后台文章列表显示 SEO/质量评分徽章、一键审计报告 (meta 完整性/链接有效性/可读性)、AI 改进建议。
**非目标**: 不做全站批量重写、不自动修改已发布内容。

### 4.3 隐私优先自托管分析集成 (P2)

**背景**: 2026 年隐私优先分析工具 (Plausible/Umami/OpenPanel) 已成为自托管博客社区的标准配置，作为 GA4 的互补或替代 ([source](https://openpanel.dev/articles/self-hosted-web-analytics))。

**墨梅缺口**: 已接入 GA4 + Clarity + 百度统计，但无自托管/cookieless 分析选项。这与「自托管、隐私优先」的产品理念存在张力。

**最小范围**: 提供 Umami 或 Plausible 的 Docker Compose 部署模板和 tracking script 自动注入配置。
**非目标**: 不自建分析引擎、不替代现有 GA4/Clarity 接入。

### 4.4 AI 内容多格式复用 (P2)

**背景**: 2026 年「一次创作、多渠道分发」是主流创作工作流。AI 自动将博文转为 Twitter Thread、LinkedIn 帖子、短视频脚本 ([source](https://bit-social.com/blog/content-repurposing-cant-ignore-it/))。

**墨梅缺口**: 已有 WechatSync 和远程仓库分发，但缺少面向社交媒体平台的内容格式转换。

**最小范围**: 「发布后」提供一键 AI 生成 Twitter Thread / LinkedIn 帖子 / 摘要卡片，支持复制或直接调度发送。
**非目标**: 不建全功能社交媒体调度器、不与 Hootsuite/Buffer 竞争。

### 4.5 内容日历 / 编辑排期 (P2)

**背景**: 专业博主的内容策划和排期是高频刚需。多篇草稿管理和发布节奏规划在现有平台上仍较原始。

**墨梅缺口**: 有定时发布功能，但缺少可视化排期视图和多草稿管线管理。

**最小范围**: 后台日历视图 (月/周)、草稿管线看板 (Kanban)、发布窗口冲突检测。
**非目标**: 不做团队协作任务分配、不做跨站点排期。

### 4.6 Blogroll / 友链增强 (P2)

**背景**: Indie Web 运动强调博客间的互链发现。Webring（博客环）和 Blogroll（友链列表）是去中心化内容发现的核心机制。

**墨梅缺口**: 已有友链系统（自助申请 + 后台审核），但缺少 RSS 聚合展示和博客环导航。

**最小范围**: 友链页面增加「最近更新」RSS 聚合摘要、支持博客环前后导航链接。
**非目标**: 不建 RSS 阅读器、不建内容聚合平台。

## 5. 优先级建议

| 优先级 | 候选 | ROI 理由 |
|:---|:---|:---|
| **P1 短期** | AI 内容审计 | 复用现有 AI 管线、零新增基础设施、对 SEO 有直接收益 |
| **P1 短期** | 内容日历 | 已有定时发布为基础、解决高频刚需、实现成本低 |
| **P2 中期** | 自托管分析集成 | 强化隐私定位、社区标准配置、Docker Compose 模板即可 |
| **P2 中期** | AI 多格式复用 | 利用现有 AI 能力、补齐分发链路最后一步 |
| **P2 探索** | Digital Garden | 差异化定位、但在传统博客用户中需求待验证 |
| **P2 探索** | Blogroll 增强 | 对齐 IndieWeb 趋势、实现成本极低 |

## 6. 结论

墨梅的现有功能密度远超初次调研时的估计。经过 CHANGELOG、源码、设计文档三方核实后，确认以下事实：

-   **邮件/订阅/营销/通知四系统已极为成熟**，不需要作为「新增候选」推荐。
-   **评论系统已具备树形结构、AI 翻译、游客评论**，增强空间在于协作功能而非基础能力。
-   **联邦协议 (ActivityPub) 已实现 WebFinger 端点**，IndieWeb 基础已就位。
-   真正的新增机会集中在 **AI 内容审计、Digital Garden、自托管分析、多格式复用** 四个方向。

> **修正说明**：本报告第一版 (2026-06-03 初版) 高估了邮件订阅/评论系统的缺口，已在第二版 (同日修订) 中基于源码审计和 CHANGELOG 核实完全重写。

## 参考来源

-   [17 Best Blogging Platforms in 2025-2026](https://leadadvisors.com/blog/best-blogging-platform/) (LeadAdvisors)
-   [Self-Hosted Web Analytics 2026 Comparison](https://openpanel.dev/articles/self-hosted-web-analytics) (OpenPanel)
-   [A Brief History & Ethos of the Digital Garden](https://maggieappleton.com/garden-history) (Maggie Appleton)
-   [Content Repurposing in 2026](https://bit-social.com/blog/content-repurposing-cant-ignore-it/) (Bit Social)
-   [Creator Journalism & Decentralization Shift](https://newsletter.projectc.biz/p/creator-journalism-is-fueling-a-bigger-decentralization-shift) (Project C)
-   [AI Agents for Social Media: 2026 Guide](https://www.admove.ai/blog/ai-agents-for-social-media-guide) (AdMove AI)
-   [Best AI Writing Tools in 2026 (Tested)](https://www.ryrob.com/ai-content-writing-tools/) (RyRob)
-   墨梅 CHANGELOG.md v1.0.0 - v1.18.0
-   墨梅 docs/design/modules/index.md
-   墨梅 docs/design/governance/index.md
-   墨梅源码审计（email/subscription/comment/notification 模块）
