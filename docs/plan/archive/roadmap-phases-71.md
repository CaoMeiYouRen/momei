# 第七十一阶段规划归档：B4 剩余路由、图标全量与门禁收口

> 本分片承接 `docs/plan/roadmap.md` 主窗口迁出的第七十一阶段完整规划正文（2026-11-08 阶段收口归档）。
> 条目执行明细、验收结论与证据见 [待办事项归档](../todo-archive.md) 的第七十一阶段归档块与 [回归归档分片](../../reports/regression/archive/2026-11-08-phase71-close.md)。

---

## 第七十一阶段：PrimeVue → caomei-ui 迁移（五）——B4 剩余路由、图标全量与门禁收口（已审计归档）

**时间表**: 2026-11-06 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 承接 backlog 长期主线第 10 条的第五阶段切片，在双库并存前提下把**剩余全部路由**（管理端编辑器 / 仪表盘 / 日历 / 片段 / AI 任务详情，以及公开页与布局壳）整路由迁到 caomei-ui，并完成图标全量替换（含 11 项品牌图标）与测试 / E2E 断言改写。2026-11-06 现取口径（`governance:count:primevue-usage`）：组件 **482 处 / 40 类 / 82 文件**（其中 `resolveUiLibraryForRoute` 判定为未迁移的页面 19 个、页面文件口径 90 处）、图标 **411 处 / 94 文件 / 118 唯一**、token **1,442 处 / 135 文件**（本阶段不清）、PrimeVue class 203 处 / 52 文件（开工复算值；本阶段只做随路由自然消减与收口复算，清零在第七十二阶段）。目录分桶（按同一组件名清单统计，与脚本口径存在 ±4 处正则差异）：`components/admin/**` + `pages/admin/**` 约 341 处，公开页 / 共享壳 / 布局约 140 处。

**准入结论**: 六条条目经用户 2026-11-06 在候选页确认（阶段构成 B 两阶段 / 品牌图标 A 保留 `@mdi/font` / 并入 i18n 键层、`useI18n` 内联、`friend-link` 归一化三项小治理）。条目 1–5 来自 [迁移方案 §7](../../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) 的 B4 段与 backlog #10，条目 6 来自长期主线 #1 与 #5、短期候选 #11（`useI18n` 内联）与 #13（i18n 键层缺陷）。ROI：开工基座 2.00 / 管理端余面 1.50 / 公开页与布局壳 1.60 / 图标全量 1.80 / 测试守卫 1.40 / 覆盖率与小治理 1.75；**条目 5 低于 1.5 阈值，是本期唯一可延后的条目**（若阶段超时，优先把 E2E 改写拆到第七十二阶段随卸载同批）。不上收：长期主线 #2 结构复用 / #4 Postgres / #8 CWV 专项；短期候选 #5 js-yaml 5 / #10 Mergify；长期主线 #11 的 S1 幻影 token（随第七十二阶段与卸载同批）。

**准入前置（已核对 2026-11-06）**: 第七十阶段已审计归档、`todo.md` 无已完成阶段正文、`git status` 干净且 `master` 与 `origin/master` 同步（`b1c8aa73`）；CI 回执 Test / CodeQL / VitePress / TODO-to-Issue 均 success，`Publish Docker Image` 为 `cancelled`（按口径不计通过）；`pnpm docs:check:source-of-truth` PASS（仅 4 项 soft warning）；覆盖率 80.66%；入口包体 369,212 B / 373,760 B、`keyCss` 63,336 B / 70KB。

**长期主线容量说明**: 迁移主线占本阶段绝大部分容量（剩余路由 482 处 / 82 文件 + 图标 411 处 / 94 文件，均高于 B3 的 589 处 / 54 文件），故条目 2 / 3 内部按目录分批、各自独立 Review Gate；治理侧只上收覆盖率第十二批与三项既有缺陷小治理，其余主线由 `pnpm regression:weekly` 保持不回退。**token 1,442 处与 PrimeVue 卸载不在本阶段**（见文末后续阶段轨迹）：二者必须同批（卸载会使 `--p-*` 定义源消失），且属全局主题切换，与本阶段「像素级整路由迁移」的风险类型不同。

1. **B4 开工基座与现取复核（P1）**: 1a 开工复算（脚本家族分桶 + 未迁移路由清单 + 路由 → 文件 → 组件族映射），产出「文件 → 改动点 → 依据指针」清单骨架；1b 在**任何页面改动前**把剩余路由登记为待迁移并采集参考态（公开页与布局壳缺口优先，`reader` 档按实测校准）；1c 在册族扩展：把展示族（`Card` / `Message` / `Skeleton` / `Divider` / `ProgressSpinner` / `Image` / `ProgressBar` / `Badge` / `RadioButton` / `Checkbox` / `Textarea` / `InputNumber` / `Accordion` 族 / `Tabs` 族 / `InputGroup` / `SplitButton` / `ButtonGroup` / `SelectButton` / `AutoComplete` / `MultiSelect` / `DatePicker` / `FileUpload` / `Stepper` 族 / `ColorPicker` / `DataView` / `Panel` / `Toolbar`）按批次登记为在册族，并复核子路由例外。**非目标**: 不改页面、不清 `--p-*`、不卸载 PrimeVue。**验收**: 迁移前 `test:visual` / `test:visual:parity` 全绿；新增参考态 100%（含 manifest 与来源）；未迁移路由清单与脚本口径一致。

2. **B4-A 管理端剩余路由整迁（P1）**: 2a 文章编辑器族（`/admin/posts/[id]`（现为已登记前缀下的例外子路由）与 `components/admin/posts/**`，含 `post-editor-header` / `post-editor-settings` / `post-editor-media-settings` / `post-distribution-button` / `publish-push-dialog(-v2)` / `ai-image-generator` / `post-tts-dialog` / `post-audit-dialog` / `post-history-panel` / `post-social-dialog` / `post-translation-workflow-dialog` / `post-editor-perspective-panel` / `post-editor-voice-overlay`）；2b 其余未迁移管理端路由（`/admin/index` 仪表盘、`/admin/calendar`、`/admin/snippets`（含 `capture`）、`/admin/ai/tasks/[id]`）；`/admin/friend-links`、`/admin/migrations/link-governance`、`/admin/submissions` 等已迁移路由不在本批，仅随图标与布局壳复核。**决策点**: `components/admin/ai/task-detail-content.vue` 与豁免子路由共享，须在「V2 分支」与「子路由整迁」间择一并留记录；`DataTable` 无 `#header` / `#footer` 插槽的缺口按包装元素处置并登记偏差；`Column` 2 处 / `slotProps` 22 处残余随本批核对。**非目标**: 不改编辑 / 发布 / AI 任务业务逻辑；不做半路由切换。**验收**: 在册族零残留守卫通过；每条新增路由 parity 差异逐项归因、未归因 0；管理端 E2E 主路径通过；`/admin/posts/[id]` 不再是 V1 消费者。

3. **B4-B 公开页与布局壳整迁（P1）**: 3a 全局壳（`app-header` / `app-notifications` / `app-search` / `app-uploader` / `app-avatar` / `app-voice-input-*` / `reader-controls` / `language-switcher` / `feedback-entry-button` / `article-*` / `comment-*` / `subscriber-form` / `home/**` / `taxonomy-post-page`）；3b 公开路由（`/`、`/posts`、`/posts/[id]`、`/friend-links`、`/about`、`/benefits`、`/feedback`、`/archives`、`/categories`、`/categories/[slug]`、`/tags`、`/tags/[slug]`、`/goto/[code]`、`/privacy-policy`、`/user-agreement` 等）；`/login` / `/register` / `/forgot-password` / `/reset-password` / `/submit` 已于第七十阶段条目 4 整路由迁移，本批仅随图标与布局壳复核，不重复整路由迁移。**重点**: 公开页 SSR / hydration（`Avatar` / `Image` / 浮层的 fragment 根与异步资源）；`reader` 档基线按实测校准，禁止为变绿放宽阈值。**非目标**: 不改内容渲染与 SEO 逻辑；不重做信息架构。**验收**: 公开页 `reader` 档 parity 全量归因；公开页关键 E2E（首页 / 文章详情 / 评论 / 搜索 / 友链）通过；SSR + hydration 复核记录落盘。

4. **B4-C 图标全量替换与品牌图标落点（P1）**: `pi pi-*` **411 处 / 94 文件 / 118 唯一**：其中品牌图标 **22 处 / 11 类**（github / google / twitter / linkedin / facebook / instagram / youtube / discord / twitch / tiktok / paypal）按用户确认**保留 `@mdi/font`**（零新依赖，`nuxt.config` 已全局加载，`utils/shared/commercial.ts` 已有 `mdi mdi-*` 用法），改走 `mdi mdi-*`；其余 **389 处** → `@lucide/vue`。数据驱动 `icon: 'pi pi-*'` 形态（`social-post-platforms.ts` / `commercial.ts` / `app-notifications.vue` 等）改为显式图标映射，不做运行时字符串解析；`pi-spin` 12 处（生产用法）改由加载态组件承载。**非目标**: 不改 `@mdi/font` 的加载方式与体积策略（另登记 backlog）；不做图标视觉重设计。**验收**: 全仓 `pi pi-` 零残留（脚本口径 0）；11 项品牌图标逐一登记落点；视觉 24/24、parity 全绿。

5. **B4-D 测试 / E2E 断言改写与守卫收口（P2）**: vitest 的 PrimeVue mock 2 文件与 E2E `p-*` 断言 9 处 / 2 文件改写；`CAOMEI_UI_ROUTE_PREFIXES` 补齐剩余路由，`ownedFiles` / 子路由例外同步（`/admin/posts/[id]` 与 `/admin/ai/tasks/[id]` 由例外转为正式迁移）；视觉与 parity 基线按迁移后实测校准（新增 / 失效基线的保留与归档口径随本批定稿）；复算 `keyCss` 与 `coreEntryJs` 并逐项归因（`keyCss` 不得越过 70KB）。**非目标**: 不借机重构无关测试；不降低断言强度。**验收**: 全量 `pnpm test` 通过；guard 全绿；E2E critical 三浏览器通过；包体与样式预算复算记录落盘。

6. **覆盖率第十二批 + 既有缺陷小治理（P2）**: 6a 覆盖率按**绝对未覆盖语句数**复算，**4 模块粒度且须含 ≥1 个大基数模块**（3 模块池上限 +0.25pp 已证明不足：达成 `+0.3pp` 需 109 条，而 `ai/quota-governance.ts` 28 + `agreement.ts` 26 + `setting.ts` 25 + `post-hexo-repository-sync.ts` 23 仅 102 条，目标不可达；须纳入 `server/database/typeorm-adapter.ts` 84 或 `server/utils/logger.ts` 61 之一），目标单批 `+0.3pp`；6b i18n 键层缺陷（`admin-posts.json` 8 个重复键、20 组双源同键、6 + 3 个死键、`pages/submit.vue` 1 处硬编码）；6c `useI18n()` 非 setup 顶层调用（`snippet-aggregate-dialog` 2 处、`creator-stats-panel` 3 处，含失败 / 边界断言）；6d `friend-link` 的 `name` / `url` 归一化被 `assignDefined` 覆盖（补「首尾空白不落库」失败断言）。**非目标**: 不做全量铺量；不改 UI 布局与 i18n 装配方式。**验收**: 覆盖率目标与算式落盘；6b–6d 各带可判别断言；`i18n:audit:duplicates` 组数不增、`i18n:audit:missing = 0`、`lint:i18n` 通过。

**回滚边界**:

- 条目 1：参考态与在册族登记各自独立可回退；删除新增参考态不影响既有基线。
- 条目 2 / 3：按 2a / 2b、3a / 3b 独立回滚，`CAOMEI_UI_ROUTE_SCOPES` 同步收缩。
- 条目 4：图标替换按文件回滚，不改依赖与加载方式。
- 条目 5：测试与 E2E 改写独立回滚；守卫扩展须与路由登记同批回退。
- 条目 6：测试文件与 i18n 键改动各自独立可回滚。

**风险提示**: ① 公开页此前只有 `reader` 档 6 条路由 / 12 条基线（明暗各一），B4-B 会一次性扩面，**不得以「未登记即不比对」替代归因**；② 布局壳（`app-header` / `app-notifications` / `app-voice-input-*`）被所有路由消费，迁错会全站回退，须先做 1 个代表文件 + 全量视觉回归再批量；③ 数据驱动图标改映射会触及公共服务层（`commercial.ts` / `social-post-platforms.ts`），须同步其单测；④ `--p-*` 1,442 处在本阶段**不清**，但新增样式不得再引入 `--p-*`，否则会加重第七十二阶段的切换面；⑤ 若阶段超时，按 ROI 先移出条目 5（E2E 改写随卸载同批），不得拆分条目 4 的「零残留」标准。

