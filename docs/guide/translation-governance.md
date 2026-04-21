# 翻译治理与贡献流程

## 1. 目标与适用范围

本文档定义墨梅博客多语言文档与产品词条的协作规则，目标是避免出现“页面已翻译、系统链路未补齐、质量门禁未覆盖”的半完成语言。

适用范围包括：

- 应用前端词条与模块文案
- 邮件模板文案
- 文档站公开页面
- 文档仓库路径与公共 URL 映射
- 与语言发布相关的 SEO、站点地图和回退策略

## 2. 语言发布分级

新增语言采用分级准入：

- `draft`：仅允许本地验证，不进入公开语言切换入口。
- `ui-ready`：完成核心 UI、语言入口、回退链和基础质量校验，可公开展示。
- `seo-ready`：在 `ui-ready` 基础上补齐邮件、SEO、站点地图与回归检查，可作为正式全球语言发布。

发布原则：

- 默认先接入 `ui-ready`，避免一次性追求全量翻译。
- 没有通过回归校验的语言，不得升级为 `seo-ready`。
- 快速迭代模块允许暂时回退到中文原文，但必须在文档与待办中明确标注。

## 2.1 文档翻译 freshness 分层

文档翻译不再统一按“所有页面都必须 30 天内同步”处理，而是按页面职责分层治理：

| Tier | freshness 口径 | 允许内容形态 | 当前典型范围 |
| :-- | :-- | :-- | :-- |
| `must-sync` | `30` 天 | 面向公开入口的操作等价翻译 | `en-US` 首页、快速开始、部署、翻译治理 |
| `summary-sync` | `45` 天 | 摘要同步，保留原文回链 | 路线图摘要、`en-US` 核心高频规范页、`zh-TW` / `ko-KR` / `ja-JP` 公开入口页 |
| `source-only` | 不做天数 SLA，但必须显式声明“中文事实源优先” | 保留 locale URL 的入口页，不承诺持续维护正文 | 低频设计页、低频 Guide、当前不再维护的深层 Standards |

补充约束：

1. `source-only` 页面必须显式提供中文原文入口，不允许保留看起来像完整翻译、实际上已长期失新的旧正文。
2. `source-only` 页面不得继续占据 locale 导航和侧边栏主入口，避免用户误判维护承诺范围。
3. `summary-sync` 页面允许结构摘要化，但必须覆盖本轮已经进入质量门、导航主入口或贡献流程的关键变化点。

## 2.2 当前 locale 文档范围

| Locale | 当前承诺范围 |
| :-- | :-- |
| `en-US` | 公开入口页保持 `must-sync`；路线图、开发指南与核心高频规范页保持 `summary-sync`；设计页、低频 Guide 与 `API` 规范降为 `source-only` |
| `zh-TW` | 首页、快速开始、部署、翻译治理、功能特性、变量映射与路线图保持 `summary-sync`；设计页、低频 Guide 与 Standards 全部降为 `source-only` |
| `ko-KR` | 与 `zh-TW` 相同，优先维护公开入口页摘要同步，深层页统一回到中文事实源 |
| `ja-JP` | 保持当前公开范围：首页、快速开始、部署、翻译治理、路线图摘要；其他页面默认不新增翻译承诺 |

## 3. 模块覆盖清单

每次新增语言至少确认以下五类门禁：

1. 模块 parity：`common`、组件、公共页面、认证、设置、首页、法律页等高频模块具备完整键集。
2. UI 依赖：PrimeVue locale、语言切换入口、Locale Registry、日期/数字格式行为同步生效。
3. 邮件链路：注册、验证码、重置密码、安全提醒等邮件文案具备独立 locale，不依赖错误复用回退。
4. SEO 链路：语言路由、canonical、hreflang、sitemap 与 locale readiness 保持一致。
5. 文档入口：文档站首页、快速开始、翻译治理页至少具备可访问页面，说明该语言当前覆盖范围。

### 3.1 运行时加载边界

- 路由级 locale 模块继续由全局中间件按路由负责加载，不将所有页面词条提升为启动时全量加载。
- 共享组件如果按条件命中后台或其他可选模块词条，不能假设“当前页面一定已经加载过该模块”。
- 这类组件必须显式声明可选模块依赖，并在模块 ready 前回退到当前已加载的稳定文案；当前统一复用 `composables/use-locale-message-modules.ts`。

### 3.2 文案归属层级

- 页面私有：只服务单一路由或单一后台子页的词条，保留在对应 `pages.*` 命名空间。
- 模块共享：同一业务模块下多个页面都会复用的词条，收敛到该模块共享命名空间，不跨页面互引。
- 全局共享：跨模块稳定复用的按钮、状态、提示和壳层文案，放在 `common`、`components` 等核心模块。
- 禁止为了减少翻译工作量，让公共页长期引用后台页面 key，或让后台页直接复用公共页私有 key；若必须短期复用，需同步补齐依赖声明与迁移计划。
- 在决定是否上收到共享命名空间前，先运行 `pnpm i18n:audit:duplicates`。该脚本只标记“所有扫描语言里翻译签名完全一致”的重复候选，避免因为单语种撞词就误判为可复用文案。
- 审计结果只提供候选，不直接等于应该抽取；是否提取到模块共享或全局共享，仍要结合组件职责、加载边界和未来演进方向逐条判断。

## 4. 术语约束

翻译时遵循以下约束：

- 保留产品名、协议名、云厂商名与主流技术名：如 `OpenAI`、`Cloudflare R2`、`Live2D`、`VAPID`。
- 同一术语在同一语言中保持统一，不允许同页混用不同译法。
- `Locale Registry`、`readiness`、`fallback` 等治理术语优先与现有设计文档保持一致。
- 繁体中文必须避免残留简体字；韩语页面避免用英文占位直接暴露给 UI。

推荐在提交前抽样检查以下高风险词：

- 文案状态词：启用、停用、发布、审核、失败、成功
- 设置键名：上传、邮件、友链、巡检、音频、图像、同步
- AI 治理词：额度、阈值、成本、并发、告警、供应商

### 4.1 `ja-JP` 首轮术语表

在日语首轮接入中，优先固定以下术语，避免与 `zh-TW`、`ko-KR` 出现额外漂移：

- `AI Powered, Global Creation`：保留品牌标语原文，必要时可辅以“AI 駆動、グローバル創作”的解释性文案。
- `Locale Registry`：统一保留英文原词，不另造日文缩写。
- `readiness`：统一译为“公開段階”或“readiness 段階”，避免与权限状态混淆。
- `fallback`：统一译为“フォールバック”。
- `translation cluster` / `translation_id`：统一译为“翻訳クラスター” / “翻訳関連 ID”。

### 4.2 同步节奏

`ja-JP` 的文档同步按以下节奏推进：

1. README、文档首页、快速开始与翻译治理页应与语言准入同一批次落地。
2. `ja-JP` 在当前正式对齐阶段已补充部署指南，README、文档首页、快速开始、部署与翻译治理页应保持同批次同步。
3. 路线图仅提供摘要页，按阶段结论同步，不要求逐段全量跟进。
4. 其他 Guide / Standards / Design 页面默认后续补齐，不得因为尚未翻译而阻塞 `ui-ready` 准入。

## 5. 贡献流程

### 5.1 开始前

1. 明确目标语言与阶段目标：是补齐 `ui-ready`，还是推进到 `seo-ready`。
2. 检查对应模块是否已有 locale 文件、邮件 locale 和文档目录。
3. 在 [todo.md](../plan/todo.md) 中更新当前阶段状态，避免重复劳动。

### 5.2 翻译中

1. 优先补高频路径：首页、认证、设置、法律页、后台关键链路。
2. 新增文档页时，优先同步首页、快速开始和翻译治理页。
3. `ja-JP` 当前阶段至少同步 README、文档首页、快速开始、部署、翻译治理、路线图摘要与必要贡献入口；未覆盖页面必须显式回链中文原文。
4. 翻译文档的物理路径统一落在 `docs/i18n/<locale>/`，对外文档站 URL 继续保持 `/<locale>/...`。
5. 当前迁移已经完成，不再保留或重新创建 `docs/<locale>/` 目录；若发现遗留翻译页，必须在同一变更中迁入 `docs/i18n/<locale>/` 并同步更新 VitePress rewrites / editLink 配置。
6. 合并前必须通过 `pnpm docs:check:i18n`；若发现旧目录回流，或同一翻译页同时存在于旧目录与 `docs/i18n/<locale>/`，视为阻塞问题，禁止继续提交。
7. 若某页决定降为 `source-only`，必须同步更新页面正文、Frontmatter、locale 导航范围与翻译治理说明，不能只在脚本里豁免。
8. 若某模块暂不翻译，需保留原文来源说明，而不是留空或放英文占位。

### 5.3 提交前

至少执行以下校验：

```bash
pnpm docs:check:source-of-truth
pnpm docs:check:i18n
pnpm lint
pnpm lint:i18n
pnpm typecheck
```

涉及 locale 字段同步治理时，额外执行：

```bash
node scripts/i18n/audit-locale-keys.mjs --fail-on-missing
pnpm i18n:check-sync -- --locale=<target-locale>
```

当前 `ja-JP` 已完成与 `zh-CN` 的全量 locale parity，`pnpm i18n:check-sync -- --locale=ja-JP` 不再只是缺口追踪工具，也可作为 `ja-JP` 相关变更的定向对齐校验。本轮专项已补齐邮件、SEO、站点地图与专项回归链路验证，并完成 `Locale Registry` 的 `seo-ready` 升格；后续对 `ja-JP` 的变更仍需维持这些发布证据的一致性，不得回退为“只有 parity、没有发布证据”的状态。

如本轮涉及邮件或关键业务链路，建议额外执行对应定向测试。

针对 unused 候选的定向排查，统一使用：

```bash
pnpm i18n:audit:unused -- --locale=<target-locale> --module=<target-module>
```

`i18n:audit:unused` 默认只作为治理线索，不自动升级为 blocker；只有在你准备删除历史 key、收敛命名空间，或需要证明某一批旧 key 已无运行时引用时，才把它作为本轮变更的必查项。

涉及 locale 模块动态加载、共享组件跨页面复用或后台 / 公共页共用壳层文案时，额外执行：

```bash
pnpm i18n:verify:runtime
pnpm i18n:audit:duplicates
```

前者固定串联 `lint:i18n` 与高频运行时回归测试，用于尽早暴露高频模块加载回归、模块未声明与 missing-key 警告；后者用于输出“跨所有语言都重复”的文案候选，支撑后续的人工复用决策。

### 5.4 Blocker 入口与最小检查矩阵

`pnpm i18n:audit:missing` 的口径统一为“缺词 parity blocker”，但只在以下入口和改动类型上按 blocker 处理：

| 场景 | 必跑命令 | blocker 判定 |
| :-- | :-- | :-- |
| 周级治理 | `pnpm regression:weekly` | 内含 `i18n:audit:missing`，任一 required 步骤失败即 blocker |
| 发版前 | `pnpm regression:pre-release` / `pnpm release:check:full` | `i18n:audit:missing` 失败直接阻断发版 |
| 阶段收口前 | `pnpm regression:phase-close` | `release:check:full` 内部的 `i18n:audit:missing` 失败直接阻断归档 |
| 日常 i18n 代码改动 | `pnpm lint:i18n` + `pnpm i18n:audit:missing` | 只要本次变更触及 `i18n/locales/**`、`i18n/config/**`、共享组件命名空间或 locale 模块装配，缺词就按本次 PR / Review Gate blocker 处理 |

`pnpm i18n:audit:unused` 的口径统一为 warning / cleanup candidate，不直接阻断 release、weekly 或 phase-close。只有当本次任务目标本身就是“删除旧 key、收敛未使用文案、证明某模块可安全裁剪”时，才把 unused 结果升级为当前任务的必过检查。

i18n 相关改动的最小检查矩阵统一如下：

| 改动类型 | 最小检查矩阵 |
| :-- | :-- |
| 仅补 locale 文案 | `pnpm lint:i18n` + `pnpm i18n:audit:missing` + `pnpm i18n:check-sync -- --locale=<locale> --module=<module> --fail-on-diff` |
| locale 模块注册、运行时加载、共享组件跨页面复用 | 上述命令 + `pnpm i18n:verify:runtime` |
| 文案复用 / 命名空间收敛 | 上述命令 + `pnpm i18n:audit:duplicates` + `pnpm i18n:audit:unused -- --locale=<locale> --module=<module>` |
| 发版前或阶段收口 | 直接走 `pnpm regression:pre-release` 或 `pnpm regression:phase-close`，不再手工降级 |

## 6. 回归检查清单

每轮语言扩展完成后，按以下顺序回归：

1. 语言切换入口是否可见，且能正确切换 locale。
2. 公共页面、后台关键页面是否仍有明显未翻译占位。
3. 邮件 locale 是否已独立注册，未复用其他语言对象。
4. i18n audit 是否通过，且无缺失 key。
5. 文档站对应语言首页与快速开始页是否可访问。
6. `docs:check:source-of-truth` 是否与当前 locale 范围声明一致，不再把 `source-only` 页面误判为 freshness blocker。

## 7. PR / 交付说明建议

提交翻译相关变更时，说明中建议包含：

- 本轮新增或补齐的语言与模块
- 是否涉及独立邮件 locale
- 是否新增文档站页面
- 已执行的校验命令与结果
- 仍未覆盖的模块或已知残留
