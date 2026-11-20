# 专项设计与治理索引 (Governance & Delta Index)

本文档收录跨模块专项设计、治理契约、迁移方案、执行态补充与阶段复盘。它们不再与模块总设计混放，避免 `docs/design/modules/` 同时承担“稳定总览”和“增量治理”两类职责。

使用约定：

- 模块的稳定高层入口统一放在 [模块总设计索引](../modules/index.md)。
- 本目录只保留专项结论、治理边界、迁移契约、执行矩阵与阶段复盘。
- 若某份专项文档已经无法代表当前实现，应收敛为更短的 delta 文档，或直接归档 / 删除。

## 系统治理与运行时边界

- **[首页 SWR 与 i18n cookie 冲突决策](./2026-11-15-homepage-swr-i18n-cookie-decision)**: 第七十六阶段条目 4 的事实源，记录 nitropack 2.13.6 缓存安全规则后的 3 个候选方案与决策标准；结论为 ① 保持现状（/robots.txt 验证边缘可用，/ 仍 DYNAMIC），②/③ 转 backlog「首页缓存与语言检测解耦」。

- **[系统配置深度解耦与统一化](./system-config-unification)**: `system.md` 的配置治理补充，聚焦来源解释、锁定与审计口径。
- **[存量代码注释治理与注释漂移治理](./comment-drift-governance)**: 第三十阶段治理切片文档，聚焦设置来源判定、locale 归一化与请求上下文挂载链路的高价值注释补强。
- **[ESLint / 类型债与规则收紧治理](./eslint-type-debt-tightening)**: 第三十阶段治理切片文档，聚焦 `utils/shared` 生产源码范围的 `no-explicit-any` 上收、命中清单与回滚边界。
- **[脚本治理与量化基线设计](./script-governance)**: 聚合 backlog、planning、development 中分散的 script-first 规则，聚焦长期脚本资产、量化口径、固定回归接入顺序与首批新增治理脚本候选。
- **[配置项多语言国际化与回退治理](./settings-i18n-fallback-governance)**: `system.md` / `i18n.md` 的联合治理补充，聚焦管理员可编辑配置的结构化多语言存储、旧值兼容与统一回退链。
- **[Windows 本地 Dev / Build 性能治理](./windows-dev-build-performance-governance)**: 本地 Windows 生命周期治理文档，聚焦首请求阻塞、构建尾耗时、量化脚本与后续切片边界。外部调研报告见 `research-output/nuxt-windows-build-slow-2026-06-04.md`。
- **[Post 元数据统一化迁移方案](./post-metadata-unification)**: `blog.md` / `system.md` 之间的跨模块专项文档，聚焦 `Post` 元数据模型统一与迁移。
- **[依赖 override 区间与 patched 版本对齐校验](./2026-09-03-dependency-override-patched-version-validation)**: `pnpm-workspace.yaml` 的 override 区间必须同时满足「装到的最高版本 ≥ advisory patched 阈值」，配套 `security:validate-overrides`。
- **[Mergify 合并策略与 merge queue 采用评估](./2026-10-12-mergify-merge-queue-adoption-evaluation)**: 调研与改动方案（未授权开工），结论仍留在 backlog。
- **[发布前安全门禁 dismissed 与 fail-closed 对齐](./2026-11-03-release-security-gate-dismissed-fail-closed)**: `security:alerts` 的 dismissed high+ 与数据源缺口判定口径，规范正文见 [安全开发规范 §5.3](../../standards/security.md)。
- **[质量门阈值重定标](./2026-11-05-quality-gate-recalibration)**: 首屏包体、重复代码 clone 数与 E2E 环境性失败的重定标依据（用户确认选项 A）。
- **[Node 26 运行时基线评估与单点化](./2026-11-14-node-26-runtime-baseline)**: `.nvmrc` 为唯一版本声明，Dockerfile / workflows 为其副本。
- **[GitHub 协作边界与推送授权治理](./2026-11-12-github-collaboration-and-push-authorization)**: 人工协作与定时任务共用同一套边界，权威口径见 [Git 工作流规范 §6–§7](../../standards/git.md)。
- **[管理端单测等待口径与 networkidle 处置结论](./2026-11-18-test-flake-waiting-and-networkidle)**: 第七十九阶段条目 1 的事实源，记录「交互 → 等待可观测状态 → 断言」的统一辅助与 `networkidle` 明确保留结论。
- **[`@vite-pwa/nuxt` 2.0.1 追溯评估与去留结论](./2026-11-18-vite-pwa-nuxt-2-retrospective)**: 第七十九阶段条目 6 的事实源，记录 major 静默落地后的影响面、构建产物实测、保留结论与回滚步骤。
- **[API Schema 覆盖与复用治理](./api-schema-coverage-governance)**: schema 文件与 endpoint 的覆盖基线、复用规则与分层验收。
- **[页面与 API 路径规范化治理](./route-api-path-governance)**: `pages/` 路由与 `server/api/` 路径的命名 / 分层基线。
- **[多包发布架构设计](./package-publishing)**: `packages/` 子包的自动化 npm 发布与 OIDC Trusted Publishing 方案。

## AI、国际化与自动化专项

- **[AI 成本治理与多用户配额](./ai-cost-governance)**: `ai.md` 的治理补充，聚焦额度、失败扣额与后台审计口径。
- **[ASR 性能与体验优化](./asr-performance-optimization)**: `asr.md` 的专项优化，聚焦临时凭证、压缩与异步追踪。
- **[文档翻译 freshness 清偿与分层治理](./docs-translation-freshness-governance)**: 文档翻译专项治理文档，聚焦 tier 化 freshness 规则、locale 范围矩阵与 `source-only` 降级口径。
- **[国际化扩展与多语言 SEO 统一设计](./i18n-seo-unification)**: `i18n.md` 的专项扩展，聚焦 Locale Registry、语言就绪度与 SEO 契约统一。
- **[国际化字段治理与共享文案边界收敛](./i18n-field-governance)**: `i18n.md` 的执行态治理补充，聚焦 missing blocker、运行时加载边界、共享 key 准入标准与第三十阶段关闭口径。
- **[CLI / MCP 自动化能力扩展设计](./cli-mcp-automation)**: 自动化工具链专项文档，聚焦 CLI、MCP 与脚本化协作边界。
- **[OpenCode + GitHub Codespaces 提供商收敛集成方案](./opencode-codespaces-provider-integration-plan)**: 聚焦 Hermes 编排下的 Codespaces 执行链路，并将模型提供商收敛为 opencode-go / deepseek。
- **[CLI / MCP API 客户端代码复用优化方案](./cli-mcp-api-client-reuse)**: CLI 与 MCP 包的 API 客户端代码复用治理文档，覆盖 Phase 54 阶段一与 Phase 55 阶段二的接口扩展与方法补齐。
- **[文章批量翻译编排能力评估](./batch-translation-orchestration)**: `ai.md` / `cli-mcp-automation.md` 的专项评估文档，聚焦批次范围冻结、父子任务模型、确认流与 Serverless 边界。
- **[types/ 与 utils/shared/ 职责边界收敛治理](./types-utils-boundary-governance)**: 第五十一阶段治理文档，聚焦类型与运行时代码的目录边界、迁移规则、冲突清单与渐进式收敛顺序。
- **[AI 编辑增强功能套件评估](./ai-editing-enhancement-evaluation)**: 六类编辑增强能力的 Go/No-Go 结论与上线顺序。
- **[i18n 首屏翻译命中矩阵与回退策略](./i18n-first-screen-hit-matrix)**: 加载链路、首屏路由模块命中矩阵与缺失回退口径。

## 文档、规范与流程治理

- **[规划文档模型 v1 落地说明](./2026-11-20-planning-document-model-v1)**: 定义阶段 / 大条目 / 小条目三级粒度、6 列进度表、4 列归档索引与 6 项归档块字段；规范本体见 [规划文档模型 v1](../../standards/planning-docs.md)。
- **[docs:check:source-of-truth freshness 判定重构](./2026-08-29-docs-source-of-truth-freshness-redesign)**: 治理改动单点说明；规范本体见 [文档规范 §6.3](../../standards/documentation.md) 与 [翻译治理指南 §2.1](../../guide/translation-governance.md)。
- **[VitePress 构建：`§3.5` 反例清单占位符被误识别为 HTML](./2026-08-29-vitepress-md-html-placeholder-fix)**: 治理改动单点说明；规范本体见 [文档规范 §3.5](../../standards/documentation.md)。
- **[API 测试分层规则](./api-test-layering)**: 固化 API 测试文件的目录归属，消除 `tests/server/api/` 与 `server/api/**/*.test.ts` 双轨并存。
- **[Session Wisdom 蒸馏机制](./session-wisdom-distillation)**: `.session/wisdom.md` 的临时知识点提纯规则与永久落点。

## 内容分发、订阅与执行态补充

- **[第三方分发解耦与投递控制](./content-distribution-governance)**: `third-party.md` 的分发治理补充，聚焦外部分发状态机与投递边界。
- **[渠道分发模板与标签适配方案](./content-distribution-template-tag-adaptation)**: `content-distribution-governance.md` 的增量方案，聚焦渠道内容模板与标签适配收口。
- **[外部 RSS / RSSHub 聚合挂载设计](./subscription-external-feed-aggregation)**: `subscription.md` 的专项增量文档，聚焦外部源统一接入、缓存降级与首页挂载模型。
- **[可缓存公开接口清单](./cacheable-api-inventory)**: `blog.md` / `system.md` 的运行期治理补充，聚焦已接入统一缓存复用层的公开读接口、TTL、失效策略与观测 namespace。
- **[markdown-it 15 迁移与插件兼容矩阵](./2026-11-11-markdown-it-15-migration)**: 渲染器升级的版本范围、插件兼容结论与回归口径；实现事实源为 `utils/shared/markdown.ts`。
- **[迁移链接治理与云端资源重写设计](./migration-link-governance)**: 对象存储域名切换与旧站链接修复的统一管线。

## 组件库迁移与视觉一致性

- **[PrimeVue → caomei-ui 迁移方案](./2026-09-18-primevue-to-caomei-ui-migration-plan)**: 迁移批次、组件映射、样式层叠与验收质量门（§8.2 截图识别层）。
- **[caomei-ui 状态色 tone 对比度修正方案](./2026-10-24-caomei-status-tone-contrast)**: 状态 tone 的模式感知取值、与上游预设 / 迁移前观感的对照、契约测试调整与验收口径（候选，待上收）。
- **[视觉一致性门禁](./2026-10-13-visual-parity-gate)**: 逐路由「当前渲染 vs 迁移前 PrimeVue 参考态」门禁的落地方式、分级预算、参考态采集与上游反馈路径。
- **[视觉一致性偏差处置表](./visual-parity-deviation-register)**: 已接受偏差的区域 / 差异像素 / 通道①~④ 处置 / 责任人登记。
- **[界面自检清单与视觉债治理计划](./2026-10-26-ui-review-checklist-plan)**: 从通用 UI 规则中筛出 U1–U6 检查项、筛选口径、执行切片与验收标准（候选，待上收）。
- **[需向上游 caomei-ui 反馈的问题清单](./2026-09-25-caomei-ui-upstream-feedback)**: 迁移中实测确认的库侧缺口与文档缺口及上游落点。
- **[B4 迁移清单（开工基座与现取复核）](./2026-11-06-b4-migration-inventory)**: 未迁移路由与文件映射、参考态纳入清单、在册族扩族策略。
- **[PrimeVue token 映射表（`--p-*` → `--caomei-*` / `--m-*`）](./2026-11-08-primevue-token-mapping)**: 由 `governance:check:token-map:doc` 校验文档与映射脚本一致。
- **[字号治理：字阶 token 与首批试点](./2026-11-13-font-size-scale-pilot)**: 字阶定义、分桶表快照与试点范围（数字以 `governance:inventory:font-sizes` 为准）。
- **[非字阶字号取值归一评估](./2026-11-15-font-size-normalization-evaluation)**: 逐处清单、等距桶判定与后续批次的处置建议。
- **[字号归一第三批（admin settings + onboarding）](./2026-11-19-font-size-batch3-admin-settings)**: 15 文件 37 处等值替换、批次拆分依据、与条目口径的偏差说明与未覆盖边界。

## 性能、缓存与流量

- **[入口包体构成与首屏 JS 收敛](./2026-11-13-entry-bundle-composition)**: `coreEntryJs` / `keyCss` 的口径与首屏收敛结论。
- **[性能优化历史记录](./performance-optimization-log)**: 已实施的性能优化条目与验证口径（阈值以 [性能规范](../../standards/performance.md) 为准）。
- **[Postgres 流量治理](./postgres-traffic-governance)**: 网络传输与 `pg_stat_statements` 开销分析及减列 / 缓存结论。
- **[Vercel 缓存穿透与 Bot 流量治理](./vercel-cache-bot-governance)**: 边缘缓存命中、Bot 流量与函数启停循环的处置记录。

## 治理巡检

- [2026-11-14 专项治理报告巡检（>180 天）](./2026-11-14-governance-report-inspection.md): 巡检 20 份 >180 天文档，2 份归档、18 份在役。

## 已归档文档入口

- 历史阶段规划稿、已完成评估、已完成工程文档与阶段分析报告已迁入 [archive/](./archive/index.md)。
- **已完成评估归档**: [API Schema 校验治理初审](./archive/api-schema-validation-governance.md)、[多语言内容资产化承接入口](./archive/multilingual-assetization-intake.md)、[Cloudflare 运行时研究](./archive/cloudflare-runtime-study.md)、[Harness Engineering 方案](./archive/harness-engineering-adoption.md)、[微信公众号预览](./archive/wechat-mp-preview-export-assist.md)、[第八阶段复盘](./archive/phase-8-feasibility-report.md)、[跨包复用治理评估](./archive/cross-package-reuse-evaluation.md)、[隐私分析集成评估](./archive/privacy-analytics-evaluation.md)、[友链导航评估](./archive/friend-link-ring-navigation-evaluation.md)、[未使用 API 清理评估](./archive/unused-api-cleanup-assessment.md)、[未使用 API 第二轮评估](./archive/unused-api-round2-assessment.md)。
