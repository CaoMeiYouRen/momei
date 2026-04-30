# 墨梅博客 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 深度归档索引

- 第一至第十阶段全文: [archive/todo-archive-phases-01-10.md](./archive/todo-archive-phases-01-10.md)
- 第十一至第二十一阶段全文: [archive/todo-archive-phases-11-21.md](./archive/todo-archive-phases-11-21.md)
- 第二十二至第二十四阶段全文: [archive/todo-archive-phases-22-24.md](./archive/todo-archive-phases-22-24.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档当前只保留最近 6 个阶段的完整归档块、相邻阶段对比所需的收口依据与归档索引。
- 第一至第二十四阶段的完整待办归档正文已迁入区间分片，避免主文档继续承担所有历史阶段全文。
- 后续若近线窗口再次膨胀，继续按 [archive/index.md](./archive/index.md) 的规则把更早阶段整体迁出，而不是拆散验收标准与结果记录。

---

## 第二十五阶段：部署体验与可持续演进收敛 (已审计归档)

> 审计结论: 第二十五阶段围绕部署体验与初始化收敛、编辑器与正文渲染体验第二轮收口、构建速度与包体性能深化、Cloudflare 运行时兼容研究与止损结论，以及 AI 初始化 / 配置问答助手评估五条主线，已在实现代码、部署 / 设计 / 指南文档、多语言翻译页与专项 Review Gate 证据中形成闭环，满足归档条件。正式放行依据为 [2026-04-11-phase-25-archive.md](./../../artifacts/review-gate/2026-04-11-phase-25-archive.md) 的 `Pass` 结论；其中部署体验收敛、Cloudflare 研究结论、AI 助手评估与编辑器 / 渲染收口分别继续引用 2026-04-09 至 2026-04-10 的专项证据，不再额外起第二套事实源。

> **ROI 评估**: 部署体验与初始化收敛 2.00；编辑器与正文渲染体验第二轮收口 1.80；构建速度与包体性能深化 1.60；AI 初始化 / 配置问答助手评估 1.33；Cloudflare 运行时兼容研究与止损结论 1.14。五项均已按本阶段准入边界完成收口，其中部署体验与编辑器 / 渲染收口为本轮 P0 主线。

### 1. 部署体验与初始化收敛 (P0)

- [x] **最小可运行路径与部署前体检收敛**
    - 验收: 梳理并收敛“首次部署成功启动”的最小路径，明确核心必填项、可延后增强项与常见错误分层，不再让新部署者主要依赖散落文档自行拼接。
    - 验收: 为部署前体检、启动期配置缺失提示或等价机制补齐最小可用能力，至少能显式识别关键环境变量缺失、配置组合冲突或当前平台不支持的运行方式。
    - 验收: 相关实现必须复用现有 README、部署指南、变量映射、安装向导与设置元信息，不新增第二套配置事实源。
    - 结果: 已在 `server/services/installation.ts`、`utils/shared/installation-diagnostics.ts` 与 `components/installation/step-health-check.vue` 收敛部署运行时识别、阻塞项摘要与安装向导首步体检展示，并通过 `utils/shared/installation-doc-links.ts` 继续复用 locale registry 生成文档入口。
    - 验证: `pnpm exec vitest run utils/shared/installation-diagnostics.test.ts utils/shared/installation-doc-links.test.ts components/installation/step-health-check.test.ts server/services/installation.test.ts`、`pnpm exec eslint server/services/installation.ts components/installation/step-health-check.vue components/installation/step-health-check.test.ts utils/shared/installation-diagnostics.ts utils/shared/installation-diagnostics.test.ts utils/shared/installation-doc-links.ts utils/shared/installation-doc-links.test.ts`、`pnpm exec nuxt typecheck`、`pnpm lint:md` 与 `pnpm docs:check:i18n` 通过。
- [x] **初始化反馈与排障入口统一**
    - 验收: 收敛初始化阶段的提示、失败反馈与排障入口，降低“能看到错误但不知道下一步该做什么”的心智负担。
    - 验收: 至少覆盖本地开发、Vercel / Docker、自托管 Node 三类高频部署路径；Cloudflare 运行时仍按平台边界单独提示，不混淆为已支持路径。
    - 验收: 补齐最小验证，至少确认新部署者可根据提示完成核心变量配置、识别不支持的平台路径，并定位初始化失败原因。
    - 结果: 安装向导首步已输出运行时标签、阻塞 / 警告计数、环境变量提示与统一排障入口；Cloudflare 路径继续按不支持的整站运行时单独提示。
    - 验证: 定向测试覆盖 `utils/shared/installation-diagnostics.test.ts`、`utils/shared/installation-doc-links.test.ts`、`components/installation/step-health-check.test.ts` 与 `server/services/installation.test.ts`，共 24 项通过；`pnpm exec nuxt typecheck`、定向 `eslint`、`pnpm lint:md` 与 `pnpm docs:check:i18n` 通过。

### 2. 编辑器与正文渲染体验第二轮收口 (P0)

- [x] **编辑器兼容性与核心创作路径稳定性补强**
    - 验收: 在继续沿用 `mavon-editor` 异步包装接入的前提下，补齐编辑器核心创作链路的兼容性、交互稳定性与高频操作体验收口。
    - 验收: 至少覆盖工具栏、实时预览、图片 / 媒体插入、翻译回填、多语言切换与未保存状态保护等高频路径，不因局部修补引入新的编辑器回退。
    - 验收: 明确本阶段不直接启动整体替换工程，若发现替换需求，只允许沉淀后续门槛与证据，不扩大当前阶段范围。
    - 结果: 已继续沿用 `components/admin/mavon-editor-client.client.vue` 异步包装，并补齐未保存保护快照、媒体插入链路回归、翻译回填 / 新稿语言切换保护，以及移动端编辑器 smoke。
    - 验证: `pnpm exec vitest run components/admin/posts/post-editor-media-settings.test.ts composables/use-post-editor-translation.test.ts components/article-content.test.ts components/table-of-contents.test.ts utils/shared/markdown.test.ts composables/use-post-editor-page.helpers.test.ts composables/use-unsaved-changes-guard.test.ts`、`pnpm exec playwright test tests/e2e/mobile-critical.e2e.test.ts tests/e2e/auth-session-governance.e2e.test.ts --project=chromium --grep "editor interaction|blank new draft|protect entered new draft"`、`pnpm typecheck` 与定向 `eslint` 通过。
- [x] **预览 / 渲染一致性与多语言编辑体验收敛**
    - 验收: 收敛 Markdown 预览、正文最终渲染、翻译编辑回填与多语言版本切换之间的一致性，减少“编辑时正常、展示时错位”的体验偏差。
    - 验收: 至少覆盖代码块、公式、图片、提示容器、长文本翻译回填与目标语言预览 6 类高风险内容。
    - 验收: 补齐最小定向测试或浏览器验证，记录仍未覆盖的边界与后续观察项。
    - 结果: 已在 `utils/shared/markdown.ts` 收敛正文最终渲染清洗策略，并抽离 `utils/shared/markdown-heading.ts` 作为标题 slug 单一事实源。
    - 验证: `components/article-content.vue`、`components/table-of-contents.vue`、`utils/shared/markdown.test.ts`、`components/article-content.test.ts` 与 `components/table-of-contents.test.ts` 已补齐关键场景验证；专项证据见 [2026-04-10-editor-rendering-round2.md](./../../artifacts/review-gate/2026-04-10-editor-rendering-round2.md)。

### 3. 构建速度与包体性能深化 (P1)

- [x] **高收益热点构建性能收敛**
    - 验收: 基于现有 bundle budget 与性能预算结果，锁定 1 - 2 组高收益热点继续优化构建耗时、首屏依赖与大块 vendor 负担。
    - 验收: 热点范围需显式限定，例如编辑器 / Markdown 渲染链、后台高频页面或文档站构建链路，不扩写为全仓性能重构。
    - 验收: 至少输出优化前后对比结果、预算变化与未继续处理的剩余热点。
    - 结果: 已完成首轮热点收敛，聚焦 `sentry.client.config.ts` 启动重块与 reader / onboarding 低频样式入口污染。
    - 验证: `pnpm build`、`pnpm test:perf:budget`、`pnpm test:perf:budget:strict`、`pnpm typecheck`、`pnpm lint:css`、`pnpm lint:md`、`pnpm exec eslint sentry.client.config.ts components/reader-controls.vue composables/use-onboarding.ts`、`pnpm exec vitest run composables/use-onboarding.test.ts composables/use-reader-mode.test.ts` 通过；`keyCss` 由 `61.04KB` 降至 `59.98KB`，Sentry 配置壳从约 `53.65KB gzip` 拆到约 `0.35KB gzip`。
- [x] **性能守线与验证入口复用**
    - 验收: 继续复用 `test:perf:budget`、strict 预算与现有性能报告链路，不另起第二套性能验证体系。
    - 验收: 若本轮涉及包体切分、依赖替换或构建流程调整，必须补齐对应验证与风险说明，避免“体感优化”缺少证据链。
    - 验收: 保留本轮优化收益、未覆盖边界与下轮可继续切片的方向。
    - 结果: 已继续复用 `.lighthouseci/bundle-budget-report.json` 与现有构建产物进行预算复核，并通过临时 Nitro 验证实例补齐运行期证据。
    - 验证: 当前 `maxAsyncChunkJs` 为 `53.09KB / 120KB`、`keyCss` 为 `59.98KB / 70KB`；剩余热点优先关注运行时壳 `DYc0WSYY.js` 与最大业务 chunk `B653ImUS.js`。

### 4. Cloudflare 运行时兼容研究与止损结论 (P1)

- [x] **Cloudflare 运行时阻塞清单与最小样机研究**
    - 验收: 面向 Cloudflare Pages / Workers / D1 路线输出可追溯的阻塞清单，至少覆盖 TypeORM、Node 运行时依赖、数据库契约、文件存储与定时任务差异。
    - 验收: 若存在最小样机路径，需明确它只代表技术可行性研究，不代表当前项目已支持整站 Cloudflare 部署。
    - 验收: 研究产物至少能够支撑“继续推进 / 暂停投入 / 仅保留外围能力接入”三选一的方向结论。
    - 结果: 已新增 [docs/design/governance/cloudflare-runtime-study.md](../design/governance/cloudflare-runtime-study.md)，并把唯一推荐的最小样机路径收敛为“Cloudflare 仅做外围能力与任务触发，应用主体继续运行在 Vercel / Docker / 自托管 Node”。
- [x] **Cloudflare 平台边界说明与止损结论收口**
    - 验收: 若研究结论仍为短期不适合推进，需进一步收敛对外说明、内部设计约束与后续触发条件，避免未来重复投入同类预研却缺少止损结论。
    - 验收: 若研究结论允许继续推进，也必须先定义下一阶段的技术闸门与替代成本，不得在本阶段直接扩写为整站适配开发。
    - 验收: 补齐对应文档或研究说明入口，确保后续规划可直接复用本轮结论。
    - 结果: 已同步更新部署指南、快速开始、设计入口与文档站导航，将当前对外说明统一收敛为“短期暂停整站 Cloudflare 运行时适配，仅保留外围能力接入”。
    - 验证: `pnpm lint:md` 与 `pnpm docs:check:i18n` 已通过；专项证据见 [2026-04-09-cloudflare-runtime-study.md](./../../artifacts/review-gate/2026-04-09-cloudflare-runtime-study.md)。

### 5. AI 初始化 / 配置问答助手评估 (P1)

- [x] **启用式问答助手范围冻结与事实源复用评估**
    - 验收: 评估是否提供面向新部署者的 AI 初始化 / 配置问答助手，并先冻结可回答范围、可写配置范围、权限边界与失败回退策略。
    - 验收: 明确复用现有安装向导、设置元信息、`qa-assistant` 与文档知识源的可行路径，不额外维护第二套知识或配置事实源。
    - 验收: 若评估结论为不立项，也需保留清晰的拒绝理由与后续触发条件，而不是停留在模糊候选状态。
    - 结果: 已基于现有安装向导字段模型、`ENV -> DB -> Default` 设置解释层、`qa-assistant` 只读边界与部署文档知识源，冻结“只读解释型助手”的可回答范围、禁止写入面与事实源复用路径。
    - 验证: `pnpm lint:md` 与 `pnpm docs:check:i18n` 已通过；专项证据见 [2026-04-09-ai-setup-assistant-evaluation.md](./../../artifacts/review-gate/2026-04-09-ai-setup-assistant-evaluation.md)。
- [x] **安全边界与交互原型评估**
    - 验收: 至少澄清 ENV 锁定字段、敏感配置写入保护、越权问题、错误回答回退与用户确认链路等关键安全边界。
    - 验收: 若进入原型阶段，只允许做启用前引导或配置解释类最小交互，不直接承诺全功能站内 AI 助手体验。
    - 验收: 补齐评估结论、风险分级与是否建议进入下一轮正式实现的产品判断。
    - 结果: 评估结论已明确当前阶段只建议推进安装页 / 设置页双入口的最小交互原型，默认不开放 AI 侧写配置；高风险项收敛为“敏感配置泄露”“只读解释误扩为可写代理”“平台边界误判”三类。

## 第二十六阶段：质量治理与数据库流量收敛 (已审计归档)

> 审计结论: 第二十六阶段围绕测试覆盖率推进、ESLint / 类型债第二轮收紧、存量代码注释治理、重复代码与纯函数复用收敛，以及 PostgreSQL 查询与数据库出网流量治理五条主线，已在实现代码、定向测试、回归记录、运行期监控与规划文档中完成闭环，满足归档条件。阶段放行基于 2026-04-13 收口复核结论：全仓覆盖率已达到阶段目标（约 `72%`），且后台监控显示 PostgreSQL 查询与连接压力已显著缓解。

> **ROI 评估**: 测试覆盖率与红绿测试有效性推进 2.00；ESLint / 类型债第二轮收紧 1.50；存量代码注释治理首轮落地 1.33；重复代码与纯函数复用继续收敛 1.40；PostgreSQL 查询与数据库出网流量治理 1.80。五项均已按本阶段准入边界完成收口。

### 1. 测试覆盖率与红绿测试有效性推进 (P0)

- [x] **把全仓测试覆盖率从 `68.85%` 继续提升到约 `72%`**
    - 验收: 基于当前 coverage 基线继续提升约 `4%`，并在阶段收口时保留新增覆盖率、模块分布与未覆盖边界。
    - 验收: 优先补齐 `server/services/ai/text.ts`、公开查询热点 API 与数据库治理相关服务层的失败路径、边界断言与回退逻辑，而不是平均铺开式补量。
    - 结果: 已完成 `TextService` 首轮增量补测及多批高 ROI 测试补强；结合最新全仓覆盖率结果，阶段目标“约 `72%`”已达成。

### 2. ESLint / 类型债第二轮收紧 (P1)

- [x] **至少再正式收紧 `1 - 2` 条高 ROI ESLint 规则**
    - 验收: 优先选择命中范围有限、回滚边界清晰、对生产代码收益明确的规则族，不直接扩写到 `no-unsafe-*` 或全仓 `any` 清零工程。
    - 结果: 已完成 `@typescript-eslint/no-unnecessary-type-assertion` 与 `@typescript-eslint/no-unnecessary-type-arguments` 两条规则的分批收紧，配套命中清单、回滚边界与最小验证矩阵已落盘。

### 3. 存量代码注释治理首轮落地 (P1)

- [x] **在 `1 - 2` 组高复杂度模块中补齐高价值注释**
    - 验收: 新增注释解释约束、契约、边界、副作用与回退原因，不做逐行复述。
    - 结果: 已完成 locale、配额治理、公开查询裁剪 / 缓存与上传链路等高复杂度模块注释补强，并通过定向测试验证。

### 4. 重复代码与纯函数复用继续收敛 (P1)

- [x] **至少完成 `1` 组公共页模板或查询 helper / 纯函数收敛**
    - 验收: 至少完成一组可复用抽象，不把治理扩大为跨目录重构。
    - 结果: 已提取 `useTaxonomyPostPage` 并收敛 `PostListData` 共享类型，消除 categories / tags 页面与多页面列表数据结构重复实现。

### 5. PostgreSQL 查询与数据库出网流量治理 (P0)

- [x] **优先降低 PostgreSQL 数据库出网流量与查询压力**
    - 验收: 形成 `posts / archive / categories / tags / search / external posts` 热点清单，并完成最小字段集与短 TTL 缓存收敛。
    - 验收: 基于运行期监控补齐“查询与连接压力已显著缓解”的阶段证据。
    - 结果: 已完成热点读链路收敛、初始化边界与匿名鉴权触发面收口；结合后台监控数据，PostgreSQL 查询与连接压力显著下降，主线关闭。

## 第二十七阶段：渠道稳定性与体验性能推进 (已审计归档)

> 审计结论: 第二十七阶段围绕渠道分发回归加固、文章页分享与图标系统收口、接口缓存复用扩面、首屏性能阶段一优化与 E2E 覆盖矩阵第一轮五条主线，已在实现代码、定向测试、回归记录、性能基线与规划文档中完成闭环，满足归档条件。WechatSync 微博 / 小红书链路、RSS 防回归、分享入口与图标映射、性能口径与 E2E 基线均已收口，阶段正式归档。

### 1. 主线：渠道分发回归加固（含 RSS 防回归补测） (P0)

- [x] **收敛 WechatSync 在微博 / 小红书平台的同步回归问题，并补齐 RSS 防回归测试**
    - 验收: WechatSync 在微博 / 小红书链路完成根因收敛与修复，不破坏既有成功平台。
    - 验收: 已确认修复的 RSS 路由补齐定向测试（taxonomy 排序 / feed 路由 / 发现链路），避免同类问题再次出现。
    - 验收: 至少保留一轮定向测试与联调证据。
    - 结果: 已完成微博 / 小红书分发回归收口，WechatSync 运行时桥接与共享分发模板已按实际兼容边界回写；RSS 防回归补测覆盖 taxonomy 排序、feed 路由默认 XML / Atom / JSON 输出与分类页 / 标签页发现链路。
    - 验证: `pnpm exec eslint server/utils/feed.test.ts server/utils/feed-taxonomy-route.test.ts tests/pages/taxonomy-rss-discovery.test.ts` 与 `pnpm exec vitest run server/utils/feed.test.ts server/utils/feed-taxonomy-route.test.ts tests/pages/taxonomy-rss-discovery.test.ts` 通过。

### 2. 主线：文章页一键分享与图标系统修复 (P1)

- [x] **文章页分享入口能力与图标库映射统一打包推进**
    - 验收: 文章页提供统一分享入口，覆盖主流平台并保证移动端可用。
    - 验收: 社交 / 打赏图标映射统一，新增第三方图标库与 fallback 策略。
    - 结果: 已完成文章页分享卡片、分享弹窗与平台图标映射收口，移动端原生分享、桌面端分享面板、主流平台拼链与国内平台复制式分享均已落地；微博在当前阶段统一按复制式分享处理。
    - 设计入口: 分享系统设计草案见 [post-sharing.md](../design/governance/post-sharing.md)。

### 3. 主线：接口缓存逻辑复用与可缓存接口扩面切片 (P1) (已完成)

- [x] **抽离缓存复用层并对高收益公开读接口完成至少一组扩面验证**
    - 验收: 抽离缓存复用层（TTL / 失效 / 键策略 / 权限边界），减少重复实现。
    - 验收: 输出一组高收益接口扩面清单并完成至少 1 组落地验证。
    - 结果: 已统一接入 `settings/public`、`friend-links/index`、`posts/archive`、`categories/index`、`tags/index`，并补齐缓存清单与回归证据，见 [cacheable-api-inventory.md](../design/governance/cacheable-api-inventory.md) 与 [旧活动日志迁移快照](../reports/regression/archive/legacy-plan-regression-log.md)。

### 4. 主线：首屏性能阶段一优化（Lighthouse >= 50） (P0)

- [x] **聚焦关键页面性能瓶颈并建立统一采样口径**
    - 验收: 建立当前瓶颈分解与采样口径，核心页面性能评分稳定达到 >= 50。
    - 验收: 沉淀“措施 - 收益 - 副作用”记录，作为后续冲刺 >= 90 的基线。
    - 结果: 已完成公共壳、文章卡片与编辑器依赖拆分后的基线复核，当前性能预算口径已调整为“非 vendor 异步页面 chunk”；`pnpm build` 与 `pnpm test:perf:budget` 通过，当前预算结果为 `coreEntryJs 139.65KB / 260KB`、`maxAsyncChunkJs 0KB / 120KB`、`keyCss 11.36KB / 70KB`。

### 5. 主线：E2E 覆盖矩阵第一轮 (P1)

- [x] **建立页面与接口覆盖矩阵并补齐首轮稳定基线**
    - 验收: 建立页面与接口覆盖矩阵并明确优先级。
    - 验收: 完成关键交易路径与高风险接口的首轮稳定用例。
    - 结果: 已补齐注册校验、投稿表单失败 / 成功提交流程、`/feedback` 与 `/friend-links` 等公共页 reachability，以及后台 `users`、`comments`、`submissions`、`subscribers`、`friend-links`、`external-links`、`notifications`、`ai`、taxonomy 搜索 / 聚合开关等首轮稳定用例。
    - 证据: 定向命令 `pnpm exec playwright test tests/e2e/submit.e2e.test.ts tests/e2e/user-workflow.e2e.test.ts tests/e2e/admin.e2e.test.ts tests/e2e/public-pages.e2e.test.ts --project=chromium` 已验证 `33 passed / 3 skipped`，详见 [e2e-coverage-matrix.md](../design/governance/e2e-coverage-matrix.md) 与 [旧活动日志迁移快照](../reports/regression/archive/legacy-plan-regression-log.md)。

## 第二十八阶段：内容运营洞察与运行时治理推进 (已审计归档)

> 审计结论: 第二十八阶段围绕后台内容洞察看板、Postgres 查询 / CPU / 连接生命周期平衡治理、coverage `> 76%`、国际化运行时加载与文案复用治理，以及编辑器 Markdown / 外观一致性增强五条主线，已在实现代码、定向测试、活动回归窗口与规划文档中完成闭环，满足归档条件。后台内容洞察首页、数据库预热 / 可选会话解析 / 短 TTL 缓存、i18n 运行时加载治理与编辑器包装层增强均已落地；结合最新全仓 coverage 收口结果与后台运行期数据，Postgres 与 coverage 两条 P0 主线也已满足关闭条件。

### 1. 主线：后台内容统计与热点分析看板 (P1)

- [x] **在后台管理侧交付内容运营洞察首页**
    - 验收: 提供阅读量、评论量、发文量与最近 `7 / 30 / 90` 天趋势，且阅读 / 评论按真实事件趋势呈现。
    - 验收: 提供热门文章、热门标签、热门分类排行，并支持时间范围、语言与公开状态筛选。
    - 验收: 第一轮实现明确翻译簇去重、时区、空数据与草稿过滤口径，不膨胀为通用 BI 系统。
    - 结果: 已将 `/admin` 切换为内容洞察首页，落地 `GET /api/admin/content-insights`、`post_view_hourly` 小时级阅读聚合、`pvCache` 小时桶写入、按请求时区折叠的真实阅读 / 评论趋势，以及热门文章 / 标签 / 分类排行。
    - 验证: `server/api/admin/content-insights.get.test.ts`、`server/utils/admin-content-insights.test.ts` 与 `composables/use-admin-content-insights-page.test.ts` 已覆盖时间聚合、排行稳定性与筛选交互。

### 2. 主线：Postgres 查询、CPU 与连接生命周期平衡治理 (P0)

- [x] **收紧数据库预热范围并完成公开热点读路径继续瘦身**
    - 验收: 收紧会唤醒数据库的请求范围，减少匿名公开流量、安装检查与鉴权链路带来的不必要数据库预热。
    - 验收: 对必须查库的热点读路径继续压缩字段集、重复读取与短 TTL 缓存边界，兼顾查询体量、CPU 使用与连接活跃时长。
    - 验收: 使用 `pg_stat_statements` 或等价 live sample 记录本轮运行期证据，至少能说明查询次数、结果集体量或连接活跃窗口的下降趋势。
    - 结果: 已在 `0b-db-ready` 中间件收紧数据库预热边界，在 `1-auth` 中间件收紧匿名公开链路会话解析触发面，并为 `settings/public`、`friend-links` 等公开读路径补齐短 TTL 运行时缓存；结合后台最新运行期观测，查询次数、重复读取与连接活跃窗口下降趋势已可支撑主线关闭。
    - 验证: `tests/server/middleware/db-ready.test.ts`、`tests/server/middleware/auth-optional-session.test.ts` 与 `tests/server/api/settings/public.get.test.ts` 已覆盖预热边界、可选会话解析与缓存命中契约；运行期背景基线与热点清单继续见 [postgres-hot-read-governance-2026-04-12.md](../../artifacts/postgres-hot-read-governance-2026-04-12.md) 与 [current.md](../reports/regression/current.md)。

### 3. 主线：测试覆盖率与有效性治理（目标 > 76%） (P0)

- [x] **将全项目 coverage 推进到 `76%+` 并保持高风险路径优先补强**
    - 验收: 全项目 coverage 提升到 `76%` 以上，并记录本轮新增覆盖率、模块分布与未覆盖边界。
    - 验收: 优先补齐后台统计、数据库中间件边界、公开读接口、编辑器关键工作流与多语言回退链路的高风险测试，而不是平均铺量。
    - 验收: 新增测试继续覆盖失败路径、边界断言与回退逻辑，不接受只刷 happy path 的低价值用例。
    - 结果: 已补齐后台内容洞察、数据库预热 / 可选会话解析、公开设置短 TTL 缓存、编辑器语音回退与 i18n 运行时加载相关高风险测试；最新全仓 coverage 已超过 `76%` 目标线，本轮 coverage 主线关闭。
    - 验证: 以 2026-04-19 最新全仓 coverage 收口结果为阶段关闭依据；本轮新增高收益测试覆盖 `db-ready`、`auth-optional-session`、`settings/public`、`use-post-editor-voice` 与内容洞察相关关键路径。

### 4. 主线：国际化运行时加载与文案复用治理 (P1)

- [x] **收敛 locale 模块注册、运行时命中与共享文案归属规则**
    - 验收: 审计 locale 模块注册、路由动态加载与运行时命中链路，降低 raw key 直出和跨页面复用后命名空间漂移风险。
    - 验收: 为后台 / 公共页高频共享组件建立页面私有、模块共享、全局共享三层文案归属规则，谨慎推进文案复用。
    - 验收: 将 `lint:i18n` 与定向运行时验证组合成固定补跑入口，并至少补 1 轮高频页面回归验证。
    - 结果: 已补 `use-locale-message-modules`、`pnpm i18n:verify:runtime`、`pnpm i18n:audit:duplicates`，并生成跨语言 cross-module 重复文案候选报告用于后续逐条收敛。

### 5. 主线：编辑器 Markdown 与外观一致性增强 (P1)

- [x] **在现有 `mavon-editor` 包装层内完成主题与 Markdown 能力对齐增强**
    - 验收: 在现有 `mavon-editor` 包装层上补齐工具栏、背景栏与主题变量接入，提升与后台及站点主题的一致性。
    - 验收: 梳理并补齐编辑器 Markdown 能力与文章页渲染能力的对齐范围，优先覆盖高频语法与扩展项，而不是直接替换底层编辑器。
    - 验收: 补齐至少 1 轮定向交互测试或视觉验证，确认不影响自动保存、上传回填与翻译工作流。
    - 结果: 已保留 `mavon-editor` 并在包装层注入 shared renderer，统一工具栏矩阵、主题变量、代码组 tabs / copy 行为与只读模式增强；`markdown`、`admin-markdown-editor`、`rendered-markdown` 相关测试与后台编辑器 smoke 均已收口。

## 第二十九阶段：评论翻译与治理事实源收敛推进 (已审计归档)

> 审计结论: 第二十九阶段围绕评论区翻译、GEO / SEO / AI crawler 可见性补强、ESLint / 类型债窄边界收紧、重复代码与纯函数复用收敛、国际化第二轮治理，以及文档事实源 / 回归记录 / 深度归档治理六条主线，已在实现代码、定向测试、活动回归窗口、设计文档与专项验证记录中完成闭环，满足归档条件。评论区翻译已完成只读切换、缓存复用与匿名阅读兼容；GEO / SEO 抽样验证见 [geo-seo-ai-crawler-validation-2026-04-20.md](../../artifacts/geo-seo-ai-crawler-validation-2026-04-20.md)；其余治理切片分别在 [current.md](../reports/regression/current.md) 的 2026-04-21 近线记录与 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 归档记录中收口并给出 Review Gate `Pass` 结论。

> **ROI 评估**: 评论区翻译功能 1.67；GEO / SEO / AI crawler 可见性与文章可引用性补强 1.80；ESLint / 类型债与规则收紧治理 1.50；重复代码与纯函数复用收敛 1.60；国际化运行时加载 / 文案复用 / unused 审计治理 1.50；文档事实源、回归记录与深度归档治理 1.40。六项均已按本阶段准入边界完成收口，其中评论区翻译、GEO / SEO 与重复代码复用为本轮优先上收项。

### 1. 主线：评论区翻译功能 (P1)

- [x] **在评论列表与评论详情区交付只读翻译切换**
    - 验收: 在评论列表与评论详情 / 展开区提供“查看翻译 / 查看原文”的只读切换。
    - 验收: 当前语言版本评论优先展示；同一翻译簇中的其他公开语言版本按线程补位，避免语言切换后评论区出现空白错觉。
    - 验收: 跨语言补位评论需标记原始语言；若已命中当前阅读语言缓存，则默认显示译文并保留“查看原文”入口。
    - 验收: 不改写原文，不破坏评论审核、回复链路与现有匿名阅读体验。
    - 验收: 若调用 AI 翻译能力，必须沿用现有配额、频率限制与审计口径，并提供失败兜底与缓存复用。
    - 结果: 已落地评论翻译服务、评论缓存字段与前端只读切换 UI；当前语言评论优先展示，跨语言补位保留原始语言标记，匿名阅读、评论审核与回复链路不受影响。
    - 验证: `components/comment-item.test.ts`、`server/services/comment-translation.test.ts`、`server/api/ai/comment-translation.post.test.ts` 与 `server/services/comment.test.ts` 已覆盖按钮切换、缓存复用、失败兜底与作者隐私链路；模块设计见 [interactions.md](../design/modules/interactions.md)。

### 2. 主线：GEO / SEO / AI crawler 可见性与文章可引用性补强 (P0)

- [x] **补齐公开入口校验与文章可引用性抽样**
    - 验收: 公开 `feed`、`robots`、`sitemap`、`llms` 相关入口具备可复验的状态码与内容校验。
    - 验收: 首页、文章页、分类页的 `canonical`、OG、Twitter、JSON-LD 抽样验证通过。
    - 验收: 至少抽样 `3 - 5` 篇文章验证摘要 / 要点 / FAQ 或等价可引用性增强，不破坏现有渲染与国际化体验。
    - 结果: 已完成 `/robots.txt`、`/feed.atom`、`/sitemap.xml`、`/llms.txt` 与 `/llms-full.txt` 的公开入口抽样，并确认首页、文章页、分类页的 canonical / OG / JSON-LD 对齐；5 篇文章样本均具备摘要块与 `BlogPosting.abstract`。
    - 验证: 专项验证记录见 [geo-seo-ai-crawler-validation-2026-04-20.md](../../artifacts/geo-seo-ai-crawler-validation-2026-04-20.md)；相关运行时能力继续由 `server/utils/llms.ts`、`server/routes/robots.txt.ts`、`server/api/_sitemap-urls.ts` 与页面级 SEO 测试守线。

### 3. 主线：ESLint / 类型债与规则收紧治理 (P1)

- [x] **按窄边界完成两轮规则上收与回滚边界固化**
    - 验收: 只上收 `1 - 2` 条命中有限、回滚边界清晰的高 ROI 规则，不扩写为全仓规则重构。
    - 验收: 输出命中清单、回滚边界与最小验证矩阵，并同步处理受影响文件的 warning / 类型债。
    - 结果: 已完成 `packages/mcp-server` 范围的 `no-explicit-any` / `explicit-module-boundary-types` 收紧，以及 settings API 范围的 `no-unnecessary-type-conversion` 收紧，均保留了命中清单、回滚边界与最小验证矩阵。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21 近线记录与 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20 / 2026-04-21 归档条目；两轮 Review Gate 结论均为 `Pass`。

### 4. 主线：重复代码与纯函数复用收敛 (P1)

- [x] **完成共享 CSV 列表解析与高收益重复区收敛**
    - 验收: 优先收敛公共页模板片段、列表型查询 helper、查询参数处理或读模型组装中的高收益重复区。
    - 验收: 记录重复基线变化、抽象收益与未覆盖边界，并确认未引入过度泛化。
    - 结果: 已将多处 CSV 列表解析统一回收到 `splitAndNormalizeStringList`，并继续压降前台公共页与查询处理重复区；本轮保持“先复用、后扩面”的窄边界治理策略。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20“共享复用层 CSV 列表解析收敛”条目，Review Gate 结论为 `Pass`。

### 5. 主线：国际化运行时加载、文案复用与 unused 审计治理 (P1)

- [x] **明确 missing blocker 分级并补一轮 duplicate / unused 治理基线**
    - 验收: 在现有运行时治理基础上，补一轮 unused 字段排查与 missing blocker 分级治理。
    - 验收: 明确哪些入口必须把 `i18n:audit:missing` 视为 blocker，并沉淀 i18n 变更后的最小检查矩阵。
    - 验收: 继续减少 raw key 直出、命名空间漂移与不受控的跨页面文案复用。
    - 结果: 已补齐 `admin-posts` 缺词 parity，明确 `release`、`weekly` 与 `phase-close` 对 `i18n:audit:missing` 的 blocker 口径，并完成一轮 cross-module duplicate 抽取与 unused 分级说明。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-18“admin-posts parity 与缺词门禁上收”与“i18n 重复文案抽取”条目。

### 6. 主线：文档事实源、回归记录与深度归档治理 (P1)

- [x] **完成目录分层、回归入口与深度归档阈值的首轮收敛**
    - 验收: 至少完成一轮模块设计文档、专项治理目录、回归记录入口与深度归档阈值的组合收敛。
    - 验收: 明确活动窗口、历史归档与兼容入口的边界，并沉淀后续拆分策略。
    - 验收: `docs/design/modules/` 只保留模块总设计，专项治理 / 增量设计 / 阶段复盘统一迁移到 `docs/design/governance/`。
    - 结果: 已完成 `docs/design/modules/` 与 `docs/design/governance/` 的职责分层、`docs/reports/regression/**` 的正式入口收敛，以及 `roadmap.md` / `todo-archive.md` 的 warning / 强制分片阈值文档化。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20“文档事实源、回归入口与深度归档阈值收敛”条目，Review Gate 结论为 `Pass`。

## 第三十阶段：远程仓库同步与治理基线细化推进（Hexo 风格导出） (已审计归档)

> 审计结论: 第三十阶段围绕远程仓库同步（Hexo 风格 / GitHub / Gitee）候选落地、文档翻译 freshness 清偿、国际化字段治理、重复代码与纯函数复用治理、存量代码注释治理，以及 ESLint / 类型债与规则收紧治理六条主线，已在实现代码、专项设计文档、活动回归窗口、Guide / Standards 文档与定向测试中完成闭环，满足归档条件。远程仓库同步已完成 GitHub / Gitee provider 契约评估与单篇文章手动推送最小闭环；其余五条治理主线均已在 [current.md](../reports/regression/current.md) 的 2026-04-21 记录中给出 Review Gate `Pass` 结论。

> **ROI 评估**: 远程仓库同步（Hexo 风格 / GitHub / Gitee）能力评估与候选落地 1.60；文档翻译 freshness 清偿与文档翻译治理 1.60；国际化字段治理 1.60；重复代码与纯函数复用治理 1.60；存量代码注释治理与注释漂移治理 1.40；ESLint / 类型债与规则收紧治理 1.50。六项均已按当前阶段的执行边界完成收口，其中远程仓库同步、文档翻译 freshness、国际化字段治理与重复代码复用为本轮高优先级上收项。

### 1. 主线：远程仓库同步（Hexo 风格 / GitHub / Gitee）能力评估与候选落地 (P1)

- [x] **完成 GitHub / Gitee 单仓库同步候选闭环**
    - 验收: 先完成一份专项设计 / 评估文档，明确同步方向（单向导出 / 双向同步）、Hexo 目录结构、Front-matter 契约、媒体引用策略、认证方式（Token / SSH）、冲突策略、审计边界与回滚方式。
    - 验收: 首轮候选落地只允许收敛到“已发布文章 -> Hexo 风格 Markdown + Front-matter + 媒体引用 -> 单仓库推送”这一条最小闭环，不得在本阶段扩写为桌面端同步、双向合并、定时任务编排或新的通用 Git 发布平台。
    - 验收: 至少完成 GitHub / Gitee 两类远端的契约评估，并落地一条可复验的候选链路；若只先接通一类 provider，另一类必须保留明确的契约差异、阻塞点与后续落地条件。
    - 验收: 补齐最小验证矩阵，至少覆盖导出结果结构、Front-matter 字段映射、媒体路径策略、认证失败 / 推送失败兜底与审计日志落点。
    - 结果: 已完成专项设计文档 [hexo-repository-sync.md](../design/governance/hexo-repository-sync.md)，并落地 `server/services/post-hexo-repository-sync.ts`、`POST /api/admin/posts/:id/hexo-repository-sync` 与分发摘要 `hexoRepositorySync` 派生状态。当前已支持将已发布文章导出为 Hexo 风格 Markdown，改写站内媒体为绝对 URL，并通过 GitHub / Gitee Contents API 推送到单仓库指定目录，同时把最近一次同步状态回写到文章元数据。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“远程仓库同步（Hexo 风格）候选链路收口”条目，Review Gate 结论为 `Pass`。

### 2. 主线：文档翻译 freshness 清偿与文档翻译治理 (P0)

- [x] **完成翻译 freshness 首轮清偿与 tier 化治理收口**
    - 验收: 对当前承诺维护的翻译页完成一轮 freshness 清偿，优先覆盖首页、快速开始、部署、翻译治理，以及 `planning` / `documentation` / `security` / `testing` 等高频规范页，不允许只更新 `last_sync` 而不校正文案。
    - 验收: `pnpm docs:check:source-of-truth` 必须恢复为可通过状态；若决定缩减某类翻译承诺范围，必须同步更新文档规范、目录范围与对应翻译页，而不是通过忽略告警绕过事实源检查。
    - 验收: 明确翻译页分层治理口径，区分“必须同步”“允许摘要同步”“默认只保留中文原文”三类范围，并把残余存量债写回规范或 backlog，而不是留作隐性尾项。
    - 验收: 输出本轮已同步范围、暂缓范围、剩余风险与下一轮清偿顺序，作为后续文档治理基线。
    - 结果: 已完成文档翻译 tier 化治理设计与脚本收口，正式固化 `must-sync / summary-sync / source-only` 三层口径；`pnpm docs:check:source-of-truth`、`pnpm docs:check:i18n` 与 `pnpm lint:md` 均已通过。已同步 `en-US` 高频入口与核心规范摘要页，以及 `zh-TW` / `ko-KR` / `ja-JP` 的公共入口页；深层 design / guide / standards 页则按新规则降级为 `source-only` 并显式回链中文事实源。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“文档翻译 freshness 清偿与文档翻译治理”条目，Review Gate 结论为 `Pass`。

### 3. 主线：国际化字段治理 (P1)

- [x] **完成 missing blocker、运行时加载边界与共享字段准入口径收口**
    - 验收: 本轮至少明确一组高频模块的 missing blocker 与运行时加载治理边界，优先覆盖 `admin-settings`、`admin-ai`、`admin-snippets`、`admin-friend-links` 与公开页装配链路，不得回退为散点补词。
    - 验收: 明确共享组件文案上收的准入标准，区分页面私有 key、模块级共享 key 与 `common` 级公共文案，避免再次出现跨页面复用后命名空间漂移。
    - 验收: 至少补齐一轮 `i18n:audit:missing`、运行时命中验证与必要的 parity 检查，并形成“哪些入口失败即 blocker”的固定矩阵。
    - 验收: 明确本轮处理模块、未覆盖模块、raw key 风险与后续分批清偿顺序，便于 Review Gate 判定是否达标。
    - 结果: 已固化 `missing` blocker、运行时加载边界与共享 key 准入口径；当前 `i18n:audit:missing` 为 `0`，`i18n:verify:runtime` 与定向 parity 已通过，并把友链公开页 / 后台页共享字段标签统一上收到 `components.friend_links.fields`。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“国际化字段治理关闭复核”条目，Review Gate 结论为 `Pass`。

### 4. 主线：重复代码与纯函数复用治理 (P1)

- [x] **完成两轮高收益重复区收口并保住重复代码基线**
    - 验收: 只处理 `1 - 2` 组高收益重复区，优先围绕公共页模板片段、列表型查询 helper、查询参数归一化与读模型组装边界推进，不得扩写为全仓重构。
    - 验收: 每组切片都必须给出原始重复点、拟抽象边界、复用收益、潜在过度泛化风险与回滚方式，而不是只写“继续复用”。
    - 验收: 至少保住重复代码基线不反弹，并输出本轮收敛后的剩余热点列表，作为下一轮切片入口。
    - 验收: 补齐最小验证矩阵，确认共享 helper / 纯函数抽象不会改变公开页、查询参数解析与读模型装配行为。
    - 结果: 已完成两轮窄边界切片，覆盖 AI 管理任务读模型装配共享 helper、后台分页 query `safeParse + 默认回退` 模板，以及公开文章列表 locale fallback 过滤 helper；`pnpm duplicate-code:check` 最新为 `33 clones / 830 duplicated lines / 0.70%`，低于 baseline 容差。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“重复代码与纯函数复用治理首轮切片”与“重复代码与纯函数复用治理第二轮收口”条目，两轮 Review Gate 结论均为 `Pass`。

### 5. 主线：存量代码注释治理与注释漂移治理 (P1)

- [x] **完成首轮高复杂度链路注释治理与漂移复核**
    - 验收: 首轮只允许选择 `1 - 2` 组高复杂度链路推进，优先覆盖设置来源判定、locale 归一化、鉴权上下文挂载、上传存储解析、文章访问控制或 AI 服务治理，不得扩成全仓平均补注释工程。
    - 验收: 每组链路都必须同时补“为什么这样写 / 边界条件 / 副作用或契约”类高价值注释，并清理失效、误导性或逐行复述代码的低价值注释，不能只做加法。
    - 验收: 导出函数、跨层契约与复杂分支的注释补齐后，需明确记录已覆盖范围、仍未覆盖边界与注释漂移风险，便于后续继续切片。
    - 验收: 至少完成一轮针对受影响文件的 review，自检“注释是否准确、是否过量、是否与实现同步”，不接受只凭主观感觉判定完成。
    - 结果: 已完成候选组 A 的首轮注释治理，覆盖 `server/services/setting.ts`、`server/utils/locale.ts`、`server/middleware/1-auth.ts` 与 `server/middleware/i18n.ts`；本轮补齐了设置来源优先级、locale 归一化边界，以及 `/api/auth` 固定准入、公开接口会话痕迹准入与 i18n 白名单跳过的请求上下文契约说明，并清理了复述型旧注释。收口阶段已补充函数级 JSDoc 保留策略与模板，明确导出函数、复用函数与复杂函数优先保留简短 JSDoc。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“存量代码注释治理与注释漂移治理首轮切片”条目，Review Gate 结论为 `Pass`。

### 6. 主线：ESLint / 类型债与规则收紧治理 (P1)

- [x] **完成两轮 `no-explicit-any` 窄边界收紧与下一轮采样定位**
    - 验收: 本轮仍只允许选择 `1 - 2` 条命中有限、回滚边界清晰的高 ROI 规则推进，不直接扩写到 `no-unsafe-*`、全仓 `any` 清零或大规模样式迁移。
    - 验收: 在进入实现前，必须先给出候选规则命中清单、影响文件、预期收益、回滚方式与最小验证矩阵；若命中过广或回滚边界不清晰，必须退回 backlog 重新切片。
    - 验收: 对受影响文件同步处理 warning / 类型债，并明确哪些属于本轮收口范围、哪些仍为后续债务，不允许借“顺手修一修”把执行面继续膨胀。
    - 验收: 输出本轮规则上收结论、残余债务清单与下一轮候选规则建议，便于阶段收口与后续准入复用。
    - 结果: 已完成两轮 `@typescript-eslint/no-explicit-any` 窄边界收紧，覆盖 `utils/shared/markdown.ts` 的 `7` 处显式 `any` 与 `server/utils/object.ts`、`server/utils/pagination.ts` 的 `2` 处显式 `any`；同时已完成 `@typescript-eslint/no-non-null-assertion` 在 `server / composables / 前端表单` 三桶采样，并明确下一轮优先从 `composables` 继续缩窄。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-21“utils/shared ESLint / 类型债窄边界收紧”条目与 [current.md](../reports/regression/current.md) 的 2026-04-21“server/utils ESLint / 类型债第二轮收紧”条目，两轮 Review Gate 结论均为 `Pass`。

## 第三十一阶段：认证预研与治理执行面正式上收 (已审计归档)

> 审计结论: 第三十一阶段围绕 `caomei-auth` 第三方登录支持评估与接入预研、路线图 / Todo 深度归档治理、国际化运行时加载与文案复用治理、ESLint / 类型债治理（`composables` 子桶）、测试覆盖率与有效性治理，以及商业化转型可行性重评六条主线，已在专项设计文档、实现代码、定向测试、活动回归窗口与规划文档中完成闭环，满足归档条件。`caomei-auth` 预研、国际化运行时治理、`composables` ESLint 收口与 coverage `76%+` 关闭线的收口证据均已写入 [current.md](../reports/regression/current.md) 的近线记录；路线图 / Todo 深度归档治理与商业化重评也已在中文事实源与设计文档中形成可追溯结论。

> **ROI 评估**: `caomei-auth` 第三方登录支持评估与接入预研 1.33；路线图 / Todo 深度归档治理 1.40；国际化运行时加载与文案复用治理 1.60；ESLint / 类型债治理（`composables` 子桶）1.50；测试覆盖率与有效性治理 1.83；商业化转型可行性重评 1.20。六项均已按当前阶段执行边界完成收口，其中测试覆盖率与国际化运行时治理为本轮 P0 主线。

### 1. 主线：`caomei-auth` 第三方登录支持评估与接入预研 (P1)

- [x] **`caomei-auth` 第三方登录支持评估与接入预研**
    - 验收: 已明确 `genericOAuth` / `genericOAuthClient` 接入锚点，以及 `caomei-auth` 的 Discovery、授权、令牌、用户信息、JWKS、动态注册与刷新令牌能力是否满足最小接入前提。
    - 验收: 已明确字段映射、账号绑定、同邮箱合并、回调地址与 ENV 锁定边界，并输出“允许进入实现 / 需上游补齐 / 暂缓接入”的三选一结论。
    - 非目标: 不直接落地真实登录按钮、回调处理或账号绑定实现。
    - 结果: 已确认 `better-auth` 现有 `genericOAuth` 接入锚点可承接 `caomei-auth`，但上游当前仍缺少明确的 revocation / refresh token 能力保证，故阶段结论为“暂缓接入，待上游补齐后再评估真实实现”。
    - 验证: 详见 [caomei-auth OAuth / OIDC 接入预研](../design/governance/caomei-auth-oauth-evaluation.md)。

### 2. 主线：路线图 / Todo 深度归档治理 (P1)

- [x] **路线图 / Todo 深度归档治理**
    - 验收: 已对 `roadmap.md` 与 `todo-archive.md` 完成首轮深度归档，补齐区间分片、兼容入口与回链说明，并重新量化主文档行数。
    - 验收: 主文档已回到健康窗口；若后续再次膨胀，已明确记录下一步拆分计划。
    - 非目标: 不改写既有阶段完成事实，不扩写成多语翻译同步工程。
    - 结果: 已新增 `docs/plan/archive/roadmap-phases-01-10.md`、`docs/plan/archive/roadmap-phases-11-21.md`、`docs/plan/archive/todo-archive-phases-01-10.md`、`docs/plan/archive/todo-archive-phases-11-21.md` 与 `docs/plan/archive/todo-archive-phases-22-24.md` 五个区间分片；`docs/plan/regression-log*.md` 旧正文已迁移到 `docs/reports/regression/archive/legacy-plan-regression-log*.md`，原路径现已删除。
    - 验证: `pnpm exec lint-md docs/plan/roadmap.md docs/plan/todo-archive.md docs/plan/archive/index.md docs/plan/archive/roadmap-phases-01-10.md docs/plan/archive/roadmap-phases-11-21.md docs/plan/archive/todo-archive-phases-01-10.md docs/plan/archive/todo-archive-phases-11-21.md docs/plan/archive/todo-archive-phases-22-24.md docs/reports/regression/index.md docs/reports/regression/archive/index.md`。

### 3. 主线：国际化运行时加载与文案复用治理 (P0)

- [x] **国际化运行时加载与文案复用治理**
    - 验收: `i18n:audit:missing` 继续保持 `0` blocker，且 `i18n:verify:runtime` 已覆盖至少一条公开页装配链路与一组共享组件文案场景。
    - 验收: 已明确共享 key 上收准入标准、缺词定级口径与下一批高风险历史热点，并完成一批有限集合动态 key 显式化与废弃通知字段删除，使 `i18n:audit:unused` 回到 `0`。
    - 非目标: 不发起全仓 i18n 重构，不把后续新增 `unused` 字段清理扩写为独立 blocker 工程。
    - 结果: 已把固定运行时回归入口扩到 About 公开页装配链路，并将友链公开页 / 后台页共享字段场景并入 `i18n:verify:runtime`；同时已把友链后台页、通知设置页中的有限集合动态 key 改为显式静态引用，删除 `settings` 模块一组确认废弃的浏览器通知字段，当前 `i18n:audit:missing` 与 `i18n:audit:unused` 均为 `total: 0`。
    - 验证: `pnpm i18n:audit:unused -- --summary-limit=20`、`pnpm i18n:audit:missing -- --summary-limit=12`、`pnpm i18n:verify:runtime`、`pnpm exec nuxt typecheck`，以及 [活动回归窗口](../reports/regression/current.md) 的 2026-04-24 记录。

### 4. 主线：ESLint / 类型债治理（`composables` 子桶） (P1)

- [x] **ESLint / 类型债治理（`composables` 子桶）**
    - 验收: 已冻结 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 子桶的命中清单、替代写法与回滚边界。
    - 验收: 目标子桶中的非空断言已按显式守卫、默认值、类型收窄或提前返回收敛，且未外溢到非目标目录。
    - 非目标: 不并行开启其他规则的全仓治理，不把 `any`、`unsafe-*`、`max-lines` 等主线打包并入。
    - 结果: 已确认当前生产源码中的 `@typescript-eslint/no-non-null-assertion` 命中收敛到 `composables/use-post-editor-io.ts` 单文件 `8` 处，并已改为局部变量、显式守卫与类型收窄；同时通过复用 `utils/web/audio-compression.ts` 中的 PCM 转换 helper 消除了 `composables/use-asr-direct.ts` 的目录级 `max-lines` blocker，使 `composables` 子桶 ESLint 收口重新打通。
    - 验证: `pnpm exec eslint composables --max-warnings 0`、`pnpm exec nuxt typecheck`。

### 5. 主线：测试覆盖率与有效性治理 (P0)

- [x] **测试覆盖率与有效性治理**
    - 验收: 全仓 coverage 基线不低于当前 `76%+` 水位，并至少补齐一组“命名空间漂移 / raw key 暴露 / 认证配置退化时会失败”的高风险行为断言。
    - 验收: 回归记录已说明新增覆盖命中的真实风险与未覆盖边界。
    - 非目标: 不把本轮扩大成全仓 coverage 冲 `80%` 的铺量工程，不接受只有 snapshot 的低价值补测。
    - 结果: 2026-04-30 已补 `components/app-footer.test.ts`、`pages/friend-links.test.ts`、`lib/auth-client.test.ts` 与 `components/comment-list.test.ts` 的高风险断言，并把 `AppFooter` 纳入 `i18n:verify:runtime` 固定入口；当前全仓 coverage 为 statements `76.03%` / lines `76.08%`，达到本轮 `76%+` 关闭线，故本项完成。
    - 验证: `pnpm exec vitest run pages/friend-links.test.ts`、`pnpm i18n:verify:runtime`、`pnpm test:coverage`，以及 `pnpm exec nuxt typecheck`（输出回写到 `artifacts/typecheck-coverage-governance-2026-04-30.txt`，无诊断输出）。

### 6. 主线：商业化转型可行性重评 (P1)

- [x] **商业化转型可行性重评**
    - 验收: 已按统一评分维度完成打分，并输出“继续推进 / 暂缓推进 / 降级观察”三选一结论。
    - 验收: 已明确一个最值得继续验证的付费增强能力，或明确说明当前尚不存在该主卖点，并指出统一承接入口的优先落点。
    - 非目标: 不直接进入支付、价格页、会员中心或营销后台增强实现。
    - 结果: 已结合既有 `opc-doc` 利基 / 价值主张 / 商业模式 / 转化闭环产物，以及首页、Demo、About 三个公开入口审计完成重评；统一评分为 `17 / 25`，结论为“降级观察”。已确认“开源核心 + 付费增强功能”仍是唯一主路径，但赞助 / 会员继续只承担辅助收入角色；当前最值得继续验证的候选收敛为“多语言内容资产化增强包”。
    - 验证: 详见 [商业化转型可行性重评框架](../design/governance/commercialization-reassessment-framework.md) 与 [项目长期规划与积压项](./backlog.md)。
