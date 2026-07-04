# 专项设计与治理索引 (Governance & Delta Index)

本文档收录跨模块专项设计、治理契约、迁移方案、执行态补充与阶段复盘。它们不再与模块总设计混放，避免 `docs/design/modules/` 同时承担“稳定总览”和“增量治理”两类职责。

使用约定：

- 模块的稳定高层入口统一放在 [模块总设计索引](../modules/index.md)。
- 本目录只保留专项结论、治理边界、迁移契约、执行矩阵与阶段复盘。
- 若某份专项文档已经无法代表当前实现，应收敛为更短的 delta 文档，或直接归档 / 删除。

## 系统治理与运行时边界

- **[系统配置深度解耦与统一化](./system-config-unification)**: `system.md` 的配置治理补充，聚焦来源解释、锁定与审计口径。
- **[存量代码注释治理与注释漂移治理](./comment-drift-governance)**: 第三十阶段治理切片文档，聚焦设置来源判定、locale 归一化与请求上下文挂载链路的高价值注释补强。
- **[ESLint / 类型债与规则收紧治理](./eslint-type-debt-tightening)**: 第三十阶段治理切片文档，聚焦 `utils/shared` 生产源码范围的 `no-explicit-any` 上收、命中清单与回滚边界。
- **[脚本治理与量化基线设计](./script-governance)**: 聚合 backlog、planning、development 中分散的 script-first 规则，聚焦长期脚本资产、量化口径、固定回归接入顺序与首批新增治理脚本候选。
- **[配置项多语言国际化与回退治理](./settings-i18n-fallback-governance)**: `system.md` / `i18n.md` 的联合治理补充，聚焦管理员可编辑配置的结构化多语言存储、旧值兼容与统一回退链。
- **[Windows 本地 Dev / Build 性能治理](./windows-dev-build-performance-governance)**: 本地 Windows 生命周期治理文档，聚焦首请求阻塞、构建尾耗时、量化脚本与后续切片边界。外部调研报告见 [research-output/nuxt-windows-build-slow-2026-06-04.md](../../../research-output/nuxt-windows-build-slow-2026-06-04.md)。
- **[Post 元数据统一化迁移方案](./post-metadata-unification)**: `blog.md` / `system.md` 之间的跨模块专项文档，聚焦 `Post` 元数据模型统一与迁移。

## AI、国际化与自动化专项

- **[AI 成本治理与多用户配额](./ai-cost-governance)**: `ai.md` 的治理补充，聚焦额度、失败扣额与后台审计口径。
- **[ASR 性能与体验优化](./asr-performance-optimization)**: `asr.md` 的专项优化，聚焦临时凭证、压缩与异步追踪。
- **[Windows 本地 Dev / Build 性能治理](./windows-dev-build-performance-governance)**: 本地 Windows 生命周期治理文档，聚焦首请求阻塞、构建尾耗时、量化脚本与后续切片边界。外部调研报告见 [research-output/nuxt-windows-build-slow-2026-06-04.md](../../../research-output/nuxt-windows-build-slow-2026-06-04.md)。
- **[文档翻译 freshness 清偿与分层治理](./docs-translation-freshness-governance)**: 文档翻译专项治理文档，聚焦 tier 化 freshness 规则、locale 范围矩阵与 `source-only` 降级口径。
- **[国际化扩展与多语言 SEO 统一设计](./i18n-seo-unification)**: `i18n.md` 的专项扩展，聚焦 Locale Registry、语言就绪度与 SEO 契约统一。
- **[国际化字段治理与共享文案边界收敛](./i18n-field-governance)**: `i18n.md` 的执行态治理补充，聚焦 missing blocker、运行时加载边界、共享 key 准入标准与第三十阶段关闭口径。
- **[CLI / MCP 自动化能力扩展设计](./cli-mcp-automation)**: 自动化工具链专项文档，聚焦 CLI、MCP 与脚本化协作边界。
- **[OpenCode + GitHub Codespaces 提供商收敛集成方案](./opencode-codespaces-provider-integration-plan)**: 聚焦 Hermes 编排下的 Codespaces 执行链路，并将模型提供商收敛为 opencode-go / deepseek。
- **[文章批量翻译编排能力评估](./batch-translation-orchestration)**: `ai.md` / `cli-mcp-automation.md` 的专项评估文档，聚焦批次范围冻结、父子任务模型、确认流与 Serverless 边界。
- **[types/ 与 utils/shared/ 职责边界收敛治理](./types-utils-boundary-governance)**: 第五十一阶段治理文档，聚焦类型与运行时代码的目录边界、迁移规则、冲突清单与渐进式收敛顺序。

## 内容分发、订阅与执行态补充

- **[第三方分发解耦与投递控制](./content-distribution-governance)**: `third-party.md` 的分发治理补充，聚焦外部分发状态机与投递边界。
- **[渠道分发模板与标签适配方案](./content-distribution-template-tag-adaptation)**: `content-distribution-governance.md` 的增量方案，聚焦渠道内容模板与标签适配收口。
- **[外部 RSS / RSSHub 聚合挂载设计](./subscription-external-feed-aggregation)**: `subscription.md` 的专项增量文档，聚焦外部源统一接入、缓存降级与首页挂载模型。
- **[可缓存公开接口清单](./cacheable-api-inventory)**: `blog.md` / `system.md` 的运行期治理补充，聚焦已接入统一缓存复用层的公开读接口、TTL、失效策略与观测 namespace。

## 已归档文档入口

- 历史阶段规划稿、已完成评估、已完成工程文档与阶段分析报告已迁入 [archive/](./archive/index.md)。
- **已完成评估归档**: [Cloudflare 运行时研究](./archive/cloudflare-runtime-study.md)、[Harness Engineering 方案](./archive/harness-engineering-adoption.md)、[微信公众号预览](./archive/wechat-mp-preview-export-assist.md)、[第八阶段复盘](./archive/phase-8-feasibility-report.md)、[跨包复用治理评估](./archive/cross-package-reuse-evaluation.md)、[隐私分析集成评估](./archive/privacy-analytics-evaluation.md)、[友链导航评估](./archive/friend-link-ring-navigation-evaluation.md)、[未使用 API 清理评估](./archive/unused-api-cleanup-assessment.md)、[未使用 API 第二轮评估](./archive/unused-api-round2-assessment.md)。
