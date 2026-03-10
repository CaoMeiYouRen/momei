# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)



---

> **说明**: 长期规划与积压项已统一迁移至 [项目计划](./roadmap.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [roadmap.md](./roadmap.md) 中添加。

## 第十阶段：通知闭环与全球体验增强 (Notification Closure & Global Experience Enhancement) (规划中)

> **当前阶段**: Phase 10
> **核心目标**: 基于现有 SSE、Locale Registry、Demo / Onboarding 与质量门禁基础设施，补齐“通知触达 -> 语言扩展 -> 工程治理 -> 新用户体验”闭环。
> **ROI 评估**: 浏览器推送补强 1.67；代码质量与工程化 1.80；国际化与本地化增强 1.80；用户体验优化 1.60。四项均满足下一阶段准入条件。

### 1. 浏览器推送补强 (Browser Push Reinforcement) (P0)

- [x] **通知订阅与投递链路**
	- 验收: 基于现有 SSE 通知中心新增浏览器订阅注册、失效清理与权限状态感知。
	- 验收: 管理员站务通知与高价值异步任务完成事件可在在线场景走 SSE、离线场景走 Web Push，避免重复推送。
	- 验收: 补齐 VAPID、Service Worker、订阅持久化配置说明与最小测试闭环。
- [x] **通知场景收敛**
	- 验收: 首轮仅覆盖管理员站务通知、AI / ASR / TTS 等异步任务完成提醒，明确不纳入营销通知与低价值提醒。
	- 验收: 管理端可配置浏览器通知开关，并与现有邮件通知策略保持一致。

### 2. 代码质量与工程化 (Code Quality & Engineering) (P0, 进行中)

- [ ] **核心路径类型治理** (进行中)
	- 验收: 为通知、设置、编辑器、AI 相关核心模块建立 `any` 清单，按优先级完成首轮消减与类型收敛。
	- 验收: 新增或重构的接口边界统一使用共享 schema / type，避免继续扩散隐式对象结构。
	- 当前拆解:
		- [x] 基线盘点：围绕 `pages/admin/ai/index.vue`、`components/admin/ai/*`、`components/admin/settings/*.vue`、`components/admin/posts/post-editor-*`、`components/app-notifications.vue`、`composables/use-admin-list.ts`、`composables/use-app-fetch.ts` 建立首轮 `any` 清单，并按“请求边界 -> 列表页 -> 详情/弹窗 -> 设置页”排序处理。
		- [x] AI 管理域收口：补齐 `types/ai.ts` 周边的共享类型，新增任务列表项、任务详情、统计面板、成本展示等前后端共用 type，优先替换 `pages/admin/ai/index.vue` 与 `components/admin/ai/task-list.vue`、`stats-overview.vue`、`task-details-dialog.vue` 中的 `any`。
		- [ ] 设置与主题收口：为 `components/admin/settings/ai-settings.vue`、`general-settings.vue`、`theme-config-section.vue`、`theme-preview-section.vue` 的 `settings` / `metadata` / theme key 建立明确类型，减少 `defineModel<any>`、`Record<string, any>` 和颜色 key 的隐式写法。
		- [ ] 公共请求层收口：收紧 `useAdminList` 与 `useAppFetch` 的泛型、查询参数和返回结构，统一 `items` / `total` / `costDisplay` 等契约，避免 `options: any`、`filters: any`、`response: any` 继续向页面层扩散。
- [ ] **AI 成本口径统一与货币展示**
	- 验收: TTS provider 预估接口命名与调用链统一，避免同类能力出现多套成本估算入口。
	- 验收: 基于系统设置提供 `AI_COST_FACTORS`，由管理员统一配置展示货币、符号、额度单价与汇率。
	- 验收: 后台 AI 统计、任务列表、任务详情和文章 TTS 弹窗统一消费同一套成本映射与货币展示配置，不再混用美元与人民币符号。
	- 当前拆解:
		- [ ] 事实源统一：以 `server/utils/ai/cost-governance.ts`、`server/services/ai/cost-display.ts` 与 `AI_COST_FACTORS` 为唯一成本口径，梳理 provider 原始成本、quota 单价、汇率换算与展示货币的责任边界。
		- [ ] TTS 预估命名收口：梳理 `TTSService.estimateProviderCost`、`TTSService.estimateCost`、`/api/ai/tts/estimate` 三层命名与返回结构，统一成“provider 原始估算 + display cost 展示值”的单一路径，避免后续再出现平行入口。
		- [ ] 前端展示收口：为 AI 后台页和文章 TTS 弹窗新增共享 `AICostDisplay` 类型/格式化入口，统一替换 `components/admin/ai/*` 与 `components/admin/posts/post-tts-dialog.vue` 中各自维护的 `currencySymbol`、`currencyCode`、`formatMoney` 与默认币种回退逻辑。
		- [ ] 定向回归：补齐 `/api/admin/ai/stats`、`/api/admin/ai/tasks`、`/api/ai/tts/estimate` 的契约测试，并补充 AI 后台页和 TTS 弹窗的定向回归，确保展示符号、汇率与金额精度一致。
- [ ] **复用抽象与质量门禁**
	- 验收: 抽离至少一组高重复的管理端列表、表单或服务逻辑为共享能力，并通过既有场景复用验证。
	- 验收: 收紧 ESLint、TypeScript、i18n audit 与定向测试门禁，确保新增代码默认纳入质量检查。
	- 当前拆解:
		- [ ] 工具函数去重：优先抽离 AI 管理页中的状态 Tag severity、成本格式化、日期展示、JSON 序列化等重复函数，并检查 `utils/`、`server/utils/`、`composables/` 内完全相同或高度相似的 helper，统一归并到共享工具层。
		- [ ] 样式复用：以 `components/admin/settings/theme-config-section.vue`、`theme-preview-section.vue`、`components/admin/posts/post-editor-settings.vue` 为首批样本，抽离可复用的 `form-group`、`color-input-group`、输入附加器和 AI 详情块样式，沉淀到共享 SCSS 片段或管理端公共样式层。
		- [ ] 模板与组件复用：针对主题设置、AI 统计卡片、AI 详情指标块和管理端表单项提炼可复用的展示组件或 slot 模板，减少同类 `<label + 输入 + 锁定提示>`、`<标题 + 指标 + 图标>`、`<label + value>` 结构的重复。
		- [ ] 大文件拆分：首轮优先拆分 `components/admin/posts/post-tts-dialog.vue`、`components/admin/settings/theme-config-section.vue`、`components/admin/posts/post-editor-settings.vue`、`pages/admin/ai/index.vue`，按“容器页 / 纯展示组件 / composable / 样式”分层，避免继续向 500+ 行增长。
		- [ ] 质量门禁收紧：在首轮重构范围内同步补齐 lint、typecheck、i18n audit 与定向测试清单；新增代码默认要求无新增 `any`、有共享类型边界、并覆盖至少一条对应回归用例。

### 3. 国际化与本地化增强 (I18n & L10n Enhancements) (P1)

- [x] **体验与本地化缺陷修复**
	- 验收: 首页、文章列表等文章卡片改为链接语义导航，不再仅依赖按钮或整卡点击跳转。
	- 验收: 沉浸式阅读开启后自动隐藏 Live2D 挂件，避免打断阅读。
	- 验收: 登录页首次进入时确保认证文案模块已预加载，`pages.login.submit` 等按钮文案不再缺失。
- [x] **新增繁体中文与韩语支持** (进行中)
	- 验收: Locale Registry、新语言词条、语言切换入口与回退策略完成接入。
	- 验收: 首轮至少覆盖公共页面、认证、核心设置与 Demo / Onboarding 关键链路。
	- 验收: 文档站补齐繁体中文与韩语首页、快速开始与翻译治理页面。
	- 当前拆解:
		- [x] 设计方案：明确 `zh-TW` / `ko-KR` 的 readiness、路由前缀、回退链与 SEO 发布边界。
		- [x] 基础接入：扩展 Locale Registry、PrimeVue locale 与语言切换入口。
		- [x] 词条补齐：完成 `common / components / public / settings / legal / auth / home / demo / admin / email` 首轮翻译补齐。
		- [x] 文档站接入：补齐 `zh-TW` / `ko-KR` 首页、快速开始与翻译治理页面。
		- [x] 质量校验：补齐 locale registry、模块加载、登录页与 Onboarding 的定向测试，并执行 i18n audit。
- [x] **翻译治理与贡献流程**
	- 验收: 建立新增语言准入 checklist、术语约束与翻译贡献指南。
	- 验收: 补齐 i18n audit、SEO、邮件文本的定向回归校验，避免出现“UI 已翻译、系统链路未跟上”的半完成语种。
	- 当前拆解:
		- [x] 准入策略：新增语言默认以 `ui-ready` 接入，待邮件与 SEO 回归齐备后再升级到 `seo-ready`。
		- [x] 治理清单：沉淀模块 parity、PrimeVue、邮件 locale、SEO 与 sitemap 五类发布门禁。
		- [x] 贡献指南：补充新增语言的术语约束、翻译流程与回归命令说明。
		- [x] 发布回归：补齐 i18n audit、SEO 与邮件链路的定向回归记录。

### 4. 反馈与互动增强 (Feedback & Interaction Enhancement) (P1)

- [x] **友链系统 (Friend Links System) (P0, 进行中)**
	- [x] 验收: 实现 `friend-links` 独立页面，支持按“友链分类”展示及自定义排序。
	- [x] 验收: 实现前端自助申请表单，支持 Logo、名称、描述录入，并具备基础防骚扰规则（若已启用验证码，则接入验证码渠道）。应当可以设置准入条件说明（如：仅限相关领域、需提供交换友链的站点信息等），并在申请列表中展示申请来源 IP 和时间戳，便于管理员审核。
	- [x] 验收: 管理后台提供友链审核、置顶、排序与分类管理功能。
	- [x] 验收: 底栏 (`app-footer.vue`) 支持精选友链展示。
	- [x] 验收: 实现定时任务调度器（基于现有 `task-scheduler.ts`），定期检测友链可访问性并标记失效状态。
	- 当前拆解:
		- [x] 设计文档落地：新增 `docs/design/modules/friend-links.md`，明确实体、接口、页面与巡检策略。
		- [x] 首轮数据层：补齐友链分类、正式友链、申请记录实体与共享 schema。
		- [x] 公开侧：落地 `friend-links` 页面、公开列表接口、申请接口与准入条件展示。
		- [x] 后台侧：落地友链管理、申请审核、分类与排序能力。
		- [x] 展示与运维：接入底栏精选友链与定时巡检逻辑。
- [x] **“开往”全站集成 (Travellings Integration) (P0)**
     [开往](https://www.travellings.cn/) 是一个专注于博客友链互换的平台，提供了丰富的博客资源和友链交换功能。通过与开往的集成，我们可以为用户提供更多优质博客资源，并简化友链交换流程。
	- 验收: 遵循官方 Logo 模式，在页眉 (`app-header.vue`)、底栏 (`app-footer.vue`) 及侧边栏提供展示入口（由管理员配置具体展示哪些位置）。
	- 验收: 区分内链与外链样式（如：外链增加 `i-lucide-external-link` 图标或特定颜色标识），防止用户误解。
- [x] **Demo 与 Onboarding 体验增强** (进行中)
	- 验收: 丰富 Demo 预置内容、展示路径与首次访问引导，使核心能力可在 3 - 5 分钟内被体验到。
	- 验收: 优化 onboarding 触发条件、步骤节奏与多语言文案，降低打断感。
	- 当前拆解:
		- [x] 首轮 Demo 入口：升级 Banner，提供“示例文章 / 内容浏览 / 创作后台”三条快捷体验路径。
		- [x] 首轮引导收敛：按 public / login / editor 三段触发，并支持跨路由续接。
		- [x] 首轮预置内容：补齐覆盖公开阅读、AI 创作与多语言工作流的 Demo 文章。
		- [x] Demo 安全增强：补齐 `/api/admin/settings`、`/api/auth/admin` 与 `/api/user/api-keys` 等敏感读写拦截，并增加 Guard 回归测试。
- [ ] **反馈入口与闭环**
	- 验收: 提供轻量反馈入口，支持区分产品建议、Bug 反馈与体验问题。
	- 验收: 反馈结果可进入管理员可见的处理链路（站内通知、邮件或后台列表任选其一），形成最小闭环。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

