# 专项设计与治理索引 (Governance & Delta Index)

本文档收录跨模块专项设计、治理契约、迁移方案、执行态补充与阶段复盘。它们不再与模块总设计混放，避免 `docs/design/modules/` 同时承担“稳定总览”和“增量治理”两类职责。

使用约定：

- 模块的稳定高层入口统一放在 [模块总设计索引](../modules/index.md)。
- 本目录只保留专项结论、治理边界、迁移契约、执行矩阵与阶段复盘。
- 若某份专项文档已经无法代表当前实现，应收敛为更短的 delta 文档，或直接归档 / 删除。

## 系统治理与运行时边界

- **[系统配置深度解耦与统一化](./system-config-unification)**: `system.md` 的配置治理补充，聚焦来源解释、锁定与审计口径。
- **[存量代码注释治理与注释漂移治理](./comment-drift-governance)**: 第三十阶段治理切片文档，聚焦设置来源判定、locale 归一化与请求上下文挂载链路的高价值注释补强。
- **[配置项多语言国际化与回退治理](./settings-i18n-fallback-governance)**: `system.md` / `i18n.md` 的联合治理补充，聚焦管理员可编辑配置的结构化多语言存储、旧值兼容与统一回退链。
- **[Cloudflare 运行时兼容研究与止损结论](./cloudflare-runtime-study)**: `system.md` / `scheduled-publication.md` 的平台边界补充，聚焦 Workers / Pages / D1 的阻塞清单、最小样机边界与止损条件。
- **[迁移链接治理与云端资源重写](./migration-link-governance)**: `migration.md` 的专项治理补充，聚焦链接治理和 `dry-run / apply / report` 契约。
- **[Post 元数据统一化迁移方案](./post-metadata-unification)**: `blog.md` / `system.md` 之间的跨模块专项文档，聚焦 `Post` 元数据模型统一与迁移。

## AI、国际化与自动化专项

- **[AI 成本治理与多用户配额](./ai-cost-governance)**: `ai.md` 的治理补充，聚焦额度、失败扣额与后台审计口径。
- **[AI 初始化 / 配置问答助手评估](./ai-setup-assistant-evaluation)**: `ai.md` / `system.md` / `qa-assistant` 交界处的专项评估文档，聚焦范围冻结、事实源复用、安全边界与最小原型建议。
- **[ASR 性能与体验优化](./asr-performance-optimization)**: `asr.md` 的专项优化，聚焦临时凭证、压缩与异步追踪。
- **[国际化扩展与多语言 SEO 统一设计](./i18n-seo-unification)**: `i18n.md` 的专项扩展，聚焦 Locale Registry、语言就绪度与 SEO 契约统一。
- **[国际化字段治理与共享文案边界收敛](./i18n-field-governance)**: `i18n.md` 的执行态治理补充，聚焦 missing blocker、运行时加载边界、共享 key 准入标准与第三十阶段关闭口径。
- **[CLI / MCP 自动化能力扩展设计](./cli-mcp-automation)**: 自动化工具链专项文档，聚焦 CLI、MCP 与脚本化协作边界。
- **[文章批量翻译编排能力评估](./batch-translation-orchestration)**: `ai.md` / `cli-mcp-automation.md` 的专项评估文档，聚焦批次范围冻结、父子任务模型、确认流与 Serverless 边界。

## 内容分发、订阅与执行态补充

- **[第三方分发解耦与投递控制](./content-distribution-governance)**: `third-party.md` 的分发治理补充，聚焦外部分发状态机与投递边界。
- **[Hexo 风格文章仓库同步能力评估](./hexo-repository-sync)**: `migration.md` / `content-distribution-governance.md` 之间的专项评估文档，聚焦 GitHub / Gitee 单仓库同步候选方案、媒体策略与失败审计。
- **[渠道分发模板与标签适配方案](./content-distribution-template-tag-adaptation)**: `content-distribution-governance.md` 的增量方案，聚焦渠道内容模板与标签适配收口。
- **[文章分享系统设计文档](./post-sharing)**: 页面分享能力的专项设计，聚焦平台拼链、复制分享与统一口径。
- **[外部 RSS / RSSHub 聚合挂载设计](./subscription-external-feed-aggregation)**: `subscription.md` 的专项增量文档，聚焦外部源统一接入、缓存降级与首页挂载模型。
- **[可缓存公开接口清单](./cacheable-api-inventory)**: `blog.md` / `system.md` 的运行期治理补充，聚焦已接入统一缓存复用层的公开读接口、TTL、失效策略与观测 namespace。

## 测试与阶段复盘

- **[E2E 测试增强设计文档](./e2e-testing-enhancement)**: 跨模块质量设计，聚焦关键路径验证与自动化测试增强。
- **[E2E 覆盖矩阵](./e2e-coverage-matrix)**: `e2e-testing-enhancement.md` 的执行态补充，聚焦页面 / 写链路风险分级、当前 Playwright 覆盖状态与下一轮补测优先级。
- **[第八阶段实施审计与复盘](./phase-8-feasibility-report)**: 已完成阶段的收尾审计文档，只保留阶段结论与索引，不再承担当前设计说明职责。
