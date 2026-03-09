# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第九阶段：全球化治理与交付基础设施 (Globalization Governance & Delivery Infrastructure) (规划中)

> **当前阶段**: Phase 9
> **核心目标**: 围绕多语言扩展、SEO 深化、AI 成本治理与云端资源交付，补齐系统从“双语单站点”走向“多语言可扩展部署”的基础设施能力。

### 1. 系统配置体验补强 (System Config UX Enhancements) (P1)

> 当前执行策略: 已完成解释层 API / UI 契约收敛，并已进入首轮实现。当前已落地增强元信息、页级概览卡片、字段级来源徽标与 tooltip 提示；下一步重点是继续压缩表单密度、补齐关键交互测试并完成剩余文档同步。

- [x] **智能混合模式可解释性增强**
	- [x] 在后台设置页增加“智能混合模式”说明卡片，明确 `ENV -> DB -> Default` 的优先级与生效路径
	- [x] 为设置接口补充 `envKey`、`defaultUsed`、`lockReason` 等元信息，并完成前端消费
	- [x] 为锁定项补充来源徽标与更细粒度提示，形成完整的只读解释闭环
- [x] **测试与文档同步**
	- [x] 补充设置服务、设置接口与设置页交互测试，覆盖来源解释与锁定提示场景
	- [x] 更新系统配置设计文档，确保 UI 解释层与实现一致

### 2. AI 成本治理与多用户配额 (AI Cost Governance & Multi-user Quotas) (P1)

> 当前执行策略: 先基于现有 `AITask`、后台 AI 统计页与已接入的文本/图像/ASR/TTS 能力，收敛统一审计模型、额度单位和失败扣额口径。首轮优先完成专项设计文档与后台视图契约，再进入实体字段、接口聚合和测试补强实现。

- [x] **统一用量审计模型**
	- [x] 基于 `AITask` 收敛 AI/ASR/TTS 的用量聚合口径，明确成本、时长、调用次数与失败率的统计模型
	- [x] 设计后台审计视图所需的数据结构与查询接口，避免未来重复建模
- [x] **分级额度治理**
	- [x] 建立按角色、用户组或信任等级的配额策略，优先覆盖低信任用户与高成本能力
	- [x] 明确管理员、作者与普通用户的默认策略与豁免边界
- [x] **告警与测试闭环**
	- [x] 提供阈值告警方案与最小可行实现，支持按日或按月维度发现异常消耗
	- [x] 补齐用量统计、额度判定与告警逻辑测试

### 3. 国际化语言扩展与配置模块化 (I18n Expansion & Modularization) (P1)

> 当前执行策略: 本轮不将“国际化语言扩展与配置模块化”和“多语言 SEO 深度优化”拆成两份孤立方案，而是以 Locale Registry 为统一事实源进行一体化设计。设计重点是先收敛默认语言、回退链、Locale 元数据、翻译模块拆分与语言准入规则，再让页面 Head、结构化数据和站点地图共享同一套语言配置。当前已继续补齐公开页 SEO 相关词条，文章列表、分类列表、标签列表、归档、关于、投稿、用户协议与隐私政策页已接入统一 `usePageSeo` 链路；同时已将翻译模块进一步细分为 `public / auth / admin / settings / home / demo / installation / legal`，并通过全局路由中间件按当前路径与 demo 模式渐进加载额外模块，默认首屏仅保留核心词条。下一步继续推进冗余词条清理与旧结构迁移收口。专项设计见 [国际化扩展与多语言 SEO 统一设计](../design/modules/i18n-seo-unification.md)。

- [x] **多语言配置中心化**
	- [x] 将当前双语言能力抽象为可配置 Locale 集合，支持默认语言、回退策略与 Locale 元数据集中管理
	- [x] 建立新增语言的最小准入清单与启用规则，避免出现半完成语种
- [x] **翻译文件模块化拆分**
	- [x] 将翻译文件按 `common`、`auth`、`admin`、`post` 等模块拆分，降低维护成本
	- [x] 支持按需加载或渐进式加载，控制首屏负担
	- [x] 排查未配置字段和未使用字段，清理冗余翻译
- [x] **测试与迁移保障**
	- [x] 设计旧翻译结构到新模块结构的迁移方案，避免现有词条丢失
	- [x] 补充 i18n 配置、加载与回退策略测试

### 4. 多语言 SEO 深度优化 (Multilingual SEO) (P1)

> 当前执行策略: 已完成首轮基础设施落地，并复用 Locale Registry 收敛共享页面 SEO 契约。当前已补齐共享 absolute URL / SEO 图片 / JSON-LD 构建器，首页已切到统一 `usePageSeo` 链路，动态 sitemap 已支持语言变体 alternates；本轮又继续把文章列表、分类列表、标签列表、归档、关于、投稿、用户协议与隐私政策页切到统一 SEO 管线，并将上述静态公开页纳入多语言 sitemap alternates 覆盖，相关定向测试与本轮 `typecheck` 已通过；下一步继续补齐更高层级的自动化回归校验。专项设计见 [国际化扩展与多语言 SEO 统一设计](../design/modules/i18n-seo-unification.md)。

- [x] **多语言元标签增强**
	- [x] 自动生成并校验 `hreflang`、canonical、Open Graph、Twitter Card 的多语言版本
	- [x] 明确 SSR 输出策略，确保搜索引擎抓取结果稳定
- [x] **结构化数据与站点地图深化**
	- [x] 为多语言页面补齐 JSON-LD 等结构化数据输出
	- [x] 扩展站点地图，确保语言变体在 Google、Bing、Baidu 等搜索引擎中可稳定索引
- [x] **回归验证**
	- [x] 建立多语言 SEO 关键页面的自动化校验方案，覆盖首页、文章页、分类页等核心场景

### 5. 云端存储与静态资源优化 (Cloud Storage & Static Assets Optimization) (P1)
> 当前执行策略: 已完成统一直传授权、存储类型规范化、通用上传 Composable 与编辑器接入，并落地了 BaseURL/Prefix 地址治理配置。当前正在开发“存量链接重写与迁移工具”；同时已确认业务默认路径策略将继续按归属实体收敛，头像维持 `avatars/{user.id}/`，文章资源统一归档到 `posts/{post.id}/{image|audio|video|file}/`，文章相关 AI 图片与 TTS 音频不再额外拆分来源型顶级目录；后续将补齐对象存储 Profile 扩展与部署文档同步。

- [x] **前端直传 OSS 能力**
	- [x] 建立后端签名、前端直传的图片/音频/视频上传链路，减少服务端中转压力
	- [x] 兼容主流对象存储接口（如 S3 兼容协议），并明确权限与时效边界
- [x] **静态资源统一管理**
	- [x] 收敛 CDN 前缀、资源路径与公共访问地址的配置方式
	- [-] 支持对存量资源链接进行重写或迁移，降低存储后端切换成本
- [x] **业务默认路径策略收敛**
	- [x] 明确并统一 `avatars/{user.id}/` 与 `posts/{post.id}/{image|audio|video|file}/` 的目录约定
	- [x] 将文章相关 AI 图片、TTS 音频等直接写入文章目录，避免来源型顶级目录继续扩散
	- [x] 补齐对象键生成、直传授权与上传服务测试，覆盖新路径策略与兼容回退
- [x] **测试与迁移验证**
	- [x] 补充上传签名、资源访问、路径重写逻辑（初步）与 Composable 测试
	- [x] 更新存储模块设计文档与部署说明，明确直传与 CDN 配置路径

### 6. 安全热修复 (Security Hotfixes) (P0)
- [x] **Dependabot 传递依赖漏洞热修复**
	- [x] 通过 pnpm overrides 将 `immutable` 锁定到 `>= 5.1.5`
	- [x] 通过 pnpm overrides 将 `tar` 锁定到 `>= 7.5.10`
	- [x] 通过 pnpm overrides 将 `svgo` 锁定到 `>= 4.0.1`
	- [x] 更新 lockfile 并验证漏洞版本不再出现在依赖树中

### 7. 管理端代码治理热修复 (Admin Code Quality Hotfix) (P1)
- [x] **超长文件拆分以恢复 ESLint max-lines 合规**
	- [x] 拆分 `components/admin/settings/ai-settings.vue` 中的配额策略与告警阈值编辑区，避免单文件继续膨胀
	- [x] 抽离 `pages/admin/posts/[id].vue` 的派生展示逻辑或辅助逻辑，使页面重新满足 `max-lines` 限制
	- [x] 运行针对性 Lint / Typecheck，确认拆分后行为与现有编辑流程一致

### 8. 内容分发集成热修复 (Content Distribution Integration Hotfix) (P1)

> 当前执行策略: 已完成本轮热修复。已补齐文章发布后同步到 Memos 的真实落地逻辑，并补录遗漏的实现任务与测试闭环。

- [x] **Memos 发布同步逻辑补完**
	- [x] 在 `server/services/post-publish.ts` 中接入现有 Memos 工具，生成可读摘要与文章链接并发起创建请求
	- [x] 在同步成功后回写文章集成元数据，记录 `metadata.integration.memosId` 以便追踪
	- [x] 补齐定向测试，覆盖同步成功与异常兜底场景

### 9. 分发版权声明热修复 (Distribution Copyright Hotfix) (P1)

> 当前执行策略: 已完成本轮热修复。已为邮件、Memos、WechatSync 多渠道分发统一追加与文章页一致的版权尾注，并补齐定向测试。

- [x] **多渠道版权尾注统一**
	- [x] 抽取共享版权尾注工具，统一许可解析、作者/地址/声明格式与 text/markdown/html 输出
	- [x] 在营销邮件、Memos 同步与 WechatSync 导出正文末尾追加版权声明
	- [x] 同步更新文章页版权文案与定向测试，确保站内外声明一致


---

> **说明**: 长期规划与积压项已统一迁移至 [项目计划](./roadmap.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [roadmap.md](./roadmap.md) 中添加。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

