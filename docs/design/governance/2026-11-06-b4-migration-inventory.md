# 2026-11-06 第七十一阶段 B4 迁移清单（条目 1 产出）

> 本文件是第七十一阶段条目 1「B4 开工基座与现取复核」的落盘产物：现取口径、未迁移路由与文件映射、参考态纳入清单、在册族扩族策略与「文件 → 改动点」清单骨架。
> 条目 2 / 3 / 4 在迁移时逐行填充 §5，并把该批实测差异写入回归记录；本文件只保留**可复算事实与归属**，不重复回归证据。
> 事实源：[迁移方案 §7 / §8.5](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)、[视觉一致性门禁](./2026-10-13-visual-parity-gate.md)、[项目计划](../../plan/roadmap.md) 第七十一阶段。

## 1. 现取口径（2026-11-06）

- 命令：`pnpm governance:count:primevue-usage`（输出 `artifacts/governance/primevue-usage-latest.json`）。
- 组件：**482 处 / 40 类 / 82 文件**；图标 **411 处 / 94 文件 / 118 唯一**；token **1,442 处 / 135 文件**（本阶段不清）；PrimeVue class **203 处 / 52 文件**。
- 路由判定：`lib/ui-library.ts` 的 `resolveUiLibraryForRoute` 口径（前缀段匹配 + 子路由例外）。未迁移页面 **19 个**，页面文件口径 **90 处**组件开标签（含 `pages/index.vue` 的 1 处注释引用，剥离注释后 89 处）。
- 目录分桶：`components/admin/**` + `pages/admin/**` 约 341 处，公开页 / 共享壳 / 布局约 140 处（按同一组件名清单统计，与脚本口径存在 ±4 处正则差异）。
- **当前剩余（2026-11-07 公开页内容组件子批后复算）**：组件 **132 处 / 23 类**、图标 **176 处**、token **1,426 处**；`/admin/snippets`、`/capture`、`/admin/ai/tasks/[id]`、`/admin/calendar`、`/admin`、`/admin/posts/[id]`、全局布局壳与公开页内容组件（文章分享 / 赞助 / 评论 / 订阅 / 阅读控件）已完成并移出本节清单。

## 2. 未迁移路由与文件映射

> 本节为**开工口径**（2026-11-06 取数）；已完成迁移项在 §5 标记状态，不在本节删除，便于核对批次差异。

### 2.1 页面文件

| 路由 | 组件处数 | 组件族 |
| :--- | ---: | :--- |
| `/admin` | 18 | Button / Tabs / TabList / Tab / TabPanels / TabPanel / Select / Tag / ProgressSpinner / Card |
| `/friend-links` | 18 | Card / Tag / InputText / Select / Textarea / Button |
| `/posts/[id]` | 13 | Skeleton / Button / Message / Tag / InputText |
| `/` | 10 | Skeleton |
| `/admin/calendar` | 8 | Select / Tabs / TabList / Tab / TabPanels / TabPanel |
| `/admin/snippets/capture` | 7 | Button / ProgressSpinner / Textarea / Tag |
| `/goto/[code]` | 4 | ProgressSpinner / Button |
| `/admin/snippets` | 3 | Button / Checkbox / Paginator |
| `/posts` | 3 | Skeleton / Message / Paginator |
| `/archives` | 2 | Skeleton |
| `/categories` | 2 | Skeleton / Message |
| `/tags` | 2 | Skeleton / Message |
| `/about` | 0 | 仅布局壳与图标 |
| `/benefits` | 0 | 仅布局壳与图标 |
| `/feedback` | 0 | 仅布局壳与图标 |
| `/categories/[slug]` | 0 | 仅布局壳与图标 |
| `/tags/[slug]` | 0 | 仅布局壳与图标 |
| `/privacy-policy` | 0 | 仅布局壳与图标 |
| `/user-agreement` | 0 | 仅布局壳与图标 |

### 2.2 子路由例外（仍为 PrimeVue，随本阶段转正）

| 文件 | 所属登记前缀 | 现状 |
| :--- | :--- | :--- |
| ~~`pages/admin/posts/[id].vue`~~ | `/admin/posts` | **2026-11-07 转正**：编辑器子批整迁完成，登记为 `migratedSubRoutes`（新建设置面板默认展开、无 heading，仍不进 parity 基线） |
| ~~`pages/admin/ai/tasks/[id].vue`~~ | `/admin/ai` | **2026-11-06 转正**：任务详情整迁，登记为 `migratedSubRoutes` |

> **本阶段结束时已无 `primeVueSubRoutes` 例外**；维护机制保留（新增未迁移子路由时仍需显式登记）。

### 2.3 共享壳与组件文件（B4 需迁移，按处数降序）

> 本表是**开工口径快照**（2026-11-06 取数），不随迁移进度删行。已迁移文件在 §5 标注状态；
> `components/admin/posts/{publish-push-dialog,post-audit-dialog}.vue` 两行对应的 V1 组件已随
> 2026-11-07 编辑器子批**删除**（实现收敛到同名 `-v2` 文件）。

| 文件 | 处数 | 组件族 |
| :--- | ---: | :--- |
| `components/admin/posts/post-distribution-button.vue` | 28 | Button / Tag / RadioButton / Checkbox |
| `components/admin/posts/post-editor-settings.vue` | 21 | Button / Select / InputGroup / AutoComplete / InputText / ToggleSwitch / Textarea / Divider |
| `components/admin/snippets/snippet-aggregate-dialog.vue` | 19 | ProgressSpinner / Button / Divider / InputText / Select / SelectButton / InputNumber / Checkbox |
| `components/admin/posts/post-translation-workflow-dialog.vue` | 18 | Message / Select / Tag / Checkbox / ProgressBar / Button |
| `components/app-header.vue` | 17 | Button / Divider |
| `components/admin/posts/post-editor-header.vue` | 15 | Button / InputText / ButtonGroup / SplitButton / Tag |
| `components/admin/posts/ai-image-generator.vue` | 12 | SelectButton / Button / InputText / Textarea / ProgressSpinner / Image |
| `components/admin/posts/post-tts-dialog.vue` | 12 | RadioButton / Select / Button / Textarea / ProgressBar / Message |
| `components/admin/posts/post-editor-media-settings.vue` | 11 | Divider / Button / Image / InputText / InputNumber |
| `components/admin/posts/post-editor-voice-overlay.vue` | 11 | SelectButton / ProgressBar / Button |
| `components/admin/posts/publish-push-dialog.vue` | 8 | RadioButton / DatePicker / Button |
| `components/app-voice-input-overlay.vue` | 8 | SelectButton / ProgressBar / Button |
| `components/taxonomy-post-page.vue` | 8 | Skeleton / Message / Button / Paginator |
| `components/admin/dashboard/creator-stats-panel.vue` | 7 | Tag / ProgressSpinner / Card |
| `components/admin/marketing-campaign-form.vue` | 7 | RadioButton / MultiSelect / DatePicker / Tag |
| `components/admin/posts/post-audit-dialog.vue` | 7 | Tag / ProgressBar / Button |
| `components/admin/posts/post-history-panel.vue` | 7 | ProgressSpinner / Tag / Avatar / Select / Button |
| `components/admin/snippets/snippet-edit-dialog.vue` | 7 | Textarea / Image / Button / Select |
| `components/admin/snippets/snippet-quick-capture.vue` | 7 | Card / Textarea / Image / Button / Divider |
| `components/home/external-feed-panel.vue` | 7 | Tag / Skeleton / Message |
| `components/admin/ai/task-detail-content.vue` | 6 | Button / Tag / Message / Image |
| `components/admin/posts/publish-push-dialog-v2.vue` | 6 | RadioButton / DatePicker |
| `components/comment-form.vue` | 6 | Button / InputText / Textarea |
| `components/reader-controls.vue` | 6 | Slider / Button |
| `components/admin/ai/stats-overview.vue` | 5 | Card（已迁移路由 `/admin/ai` 的残留） |
| 其余 34 文件（2–5 处） | — | 见 `governance:count:primevue-usage` 的逐文件明细 |

## 3. 参考态纳入清单（条目 1b，已采集）

**纳入口径**：有稳定路径、稳定 heading、且在 TEST_MODE 种子下可渲染。全部使用 `stable: 'lenient'`（登录态布局含 SSE，`networkidle` 不保证达成）；公开页首页与文章详情额外使用 `gotoWaitUntil: 'domcontentloaded'`（外部头像等资源阻塞 `load`）。

| name | path | tier | heading |
| :--- | :--- | :--- | :--- |
| `admin-snippets-list` | `/admin/snippets` | admin | 灵感收纳箱 |
| `admin-snippets-capture` | `/admin/snippets/capture` | admin | 极简采集模式 |
| `home` | `/` | reader | 最新文章 |
| `posts-list` | `/posts` | reader | 文章列表 |
| `post-detail` | `/posts/hello-momei-test` | reader | Hello Momei Test |
| `friend-links` | `/friend-links` | reader | 友链 |
| `categories-index` | `/categories` | reader | 分类 |
| `tags-index` | `/tags` | reader | 标签 |
| `archives` | `/archives` | reader | 归档 |
| `about` | `/about` | reader | 墨梅 |
| `benefits` | `/benefits` | reader | 让你的技术内容自动触达全球读者 |
| `feedback` | `/feedback` | reader | 问题反馈与支持 |
| `privacy-policy` | `/privacy-policy` | reader | 隐私政策 |
| `user-agreement` | `/user-agreement` | reader | 用户协议 |

- 参考态：14 条 × 2 主题 = **28 张**，`pnpm test:visual:reference` 以 HEAD（PrimeVue 原貌）采集，manifest 记录 `ref=HEAD` 与采集时间。管理端 2 条（片段列表 / 极简采集）+ 公开页 12 条。
- 复核：`pnpm test:visual:parity` **83 passed**（82 条比对 + 1 条安装路由登记守卫），新 28 条实测均为 0px / 0.000%。
- 既有 54 张参考态未重采；其中 `admin-posts-list` 与 `admin-friend-links-list` 因 `--only` 子串匹配被误采一次，已用 `git checkout` 恢复原图并从 HEAD 版本回填 manifest 记录。

**未纳入与理由**

| 路由 | 理由 |
| :--- | :--- |
| `/admin`（仪表盘） | 指标与趋势图依赖「最近 N 天」运行时窗口，参考态跨日即漂移 |
| `/admin/calendar` | 「今天」高亮为整格背景填充，且默认视图随当月变化，参考态跨日 / 跨月不可复现；**2026-11-07 已迁移**，由页面 / 月历 / 看板组件测试（迁移新增 9 例）+ 浏览器探针覆盖，不承诺跨日基线 |
| `/admin/posts/[id]` | 无稳定 id；新建态 `/admin/posts/new` 默认展开设置面板，且页面无 heading。由 E2E + 编辑器组件单测覆盖 |
| `/admin/ai/tasks/[id]` | 任务 id 无固定种子；页面无 heading。由 E2E + 组件单测覆盖 |
| `/categories/[slug]`、`/tags/[slug]` | TEST_MODE 种子只建文章，无分类 / 标签实体数据 → 404 |
| `/goto/[code]` | 无短链种子 → 404 |

`/privacy-policy` 与 `/user-agreement` 已纳入：`LegalAgreementPage` 在无 active agreement 时使用默认 payload，heading 稳定，可正常采集。

## 4. 在册族扩族策略（条目 1c）

**结论：不在开工时全局扩基准在册族。** 实测把展示族加入 `CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS` 后，8 条已收口路由立即判红（均为合法残留，属 B4 后续面）：

| 已迁移路由 | 残留族 | 归属 |
| :--- | :--- | :--- |
| `/admin/submissions` | Divider / Checkbox / Textarea | B3 表单族残留；该路由无 `inScopeComponents` 登记（同源登记在 `/admin/categories` / `/admin/tags`） |
| `/admin/external-links` | Checkbox | B3 表单族残留 |
| `/admin/ad/campaigns` | DatePicker | B3 表单族残留 |
| `/admin/ad/placements` | Checkbox / InputNumber | B3 表单族残留 |
| `/admin/migrations/link-governance` | Card / ProgressSpinner / Checkbox / MultiSelect | B2 + B3 混合残留 |
| `/admin/friend-links` | Checkbox / Textarea / InputNumber | B3 表单族残留 |
| `/admin/ai` | Card（`stats-overview.vue`） | 展示族残留 |
| `/admin/marketing` | Card（`index.vue`） | 展示族残留 |

**执行口径**：

1. 条目 2 / 3 每完成一条路由整迁，把该路由实际消费且已清零的族登记到该路由的 `inScopeComponents`（路由级增量），保持「已收口批次不因后续批次被动回改」。
2. 全部 B4 路由迁移完成，**且另行安排 B3 残留族收口**（上述 8 条路由的展示族与表单族）后，再把展示族 + B3 表单族并入基准在册族（`CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS`），使后续任何回退都被全局拦截。仅完成 B4 路由迁移不足以清零这些残留——它们位于已迁移路由，B4 只随图标与布局壳复核。
3. 子路由例外复核：`/admin/posts/[id]` 与 `/admin/ai/tasks/[id]` 在本阶段由例外转为正式迁移；转正前不得把 `/admin/posts` / `/admin/ai` 的族约束扩展到这两个文件（当前守卫已按例外放行）。

## 5. 文件 → 改动点清单（snippets / AI 任务详情 / 内容日历 / 仪表盘子批已填，其余待条目 2 / 3 / 4 填充）

| 文件 | 路由 | 组件族 | 改动点 | 依据指针 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pages/admin/index.vue` + `components/admin/dashboard/{metric-card,creator-metric-card,creator-stats-panel}.vue` | `/admin` | Button / Tabs 族 / Select / Tag / ProgressSpinner / Card | 已迁完：Tabs 族改 `CaomeiTabs` + Trigger/Content（`unmount-on-hide=false` 保留创作面板状态）；范围 `Select` 走 `:model-value` + 收窄回写；10 处 `Tag` 走 tone（页面 5 + 创作面板 4 + 指标卡 1；`secondary/contrast→neutral`、`info→primary`、`warn→warning`）；3 张排行卡 + 3 张指标卡改 `CaomeiCard`（`#content` → 默认插槽，描边/背景改走 `--caomei-card-*` 覆盖钩子，避免与组件类同特异性竞争）；`icon` prop 由 `pi` 字符串改为组件；17 处图标 → lucide（页面 12 + 创作面板 5） | 迁移方案 §6.2 / §6.3 / 清单 §2.1 | **已完成**：新增单测 12 例、guard 60、浏览器探针 pageerror 0（创作面板受 `/api/admin/creator-stats` 的 `DATE_TRUNC` 限制，见回归窗口） |
| `pages/friend-links.vue` | `/friend-links` | Card / Tag / InputText / Select / Textarea / Button | （待填） | 同上 | 待迁移 |
| `pages/posts/[id].vue` | `/posts/[id]` | Skeleton / Button / Message / Tag / InputText | （待填） | 同上 | 待迁移 |
| `pages/index.vue` | `/` | Skeleton | （待填） | 同上 | 待迁移 |
| `pages/admin/snippets/**` + `components/admin/snippets/**`（7 文件：5 组件 + 2 页面） | `/admin/snippets`、`/capture` | Button / Checkbox / Paginator / ProgressSpinner / Textarea / Tag / Select / SelectButton / InputNumber / Image / Card / Divider / Accordion 族 | 已迁完：Button（icon-only + lucide #icon）、Tag（tone + 默认插槽）、Checkbox（数组模型）、Paginator（1 基 `page` + 自渲染页码报告，`useAdminList` 加 `pageIndexBase: 1`）、Textarea/Select/SelectButton/InputNumber/Divider/Card/Image/Accordion 族替换；图标 30+ → `@lucide/vue`（`pi-spin` → `LoaderCircle` + 本组件动画） | 迁移方案 §6.2 / §6.1 E 组 / 清单 §2.1 | **已迁移（待 Round 3 复审）**：parity 4/4 PASS（allowlist 按实测登记）、单测 15 例（页面 5 + 组件 10）、guard 58 + 16 |
| `pages/admin/posts/[id].vue` + `components/admin/posts/**`（19 文件） | `/admin/posts/[id]` | Button / Tag / Select / InputText / Textarea / Message / Divider / Image / ProgressSpinner / ProgressBar / Checkbox / RadioButton / ToggleSwitch / AutoComplete / InputGroup / SplitButton / ButtonGroup / Avatar / InputNumber | 已迁完：三件套 V1 → V2 并由编辑器消费（V1 与两份「两版等价」契约测试一并删除）；`RadioButton` → `CaomeiRadioGroup` + `CaomeiRadioButton`、`ToggleSwitch` → `CaomeiSwitch`、`ProgressBar` → `CaomeiProgressBar`、`AutoComplete` 的 `suggestions`/`{query}` → `options`/`query`；81 处 `pi pi-*` → `@lucide/vue`；同时修复 69 阶段遗留的浮层锚点空盒子（`CaomeiPopoverTrigger` 默认外观） | 迁移方案 §6.2 / §6.3 | **已完成**：组件测试 152（含守卫）、浏览器探针 pageerror 0、管理端 E2E 主路径通过；`/admin/posts/[id]` 不再是 V1 消费者 |
| `pages/admin/ai/tasks/[id].vue` + `components/admin/ai/{task-detail-content,task-details-dialog,stats-overview,metric-card}.vue` | `/admin/ai/tasks/[id]` | Button / Tag / Message / Image / Card / ProgressSpinner | 已迁完：详情页三态；共享内容组件 Tag×3 走 tone、图片走包装层；`metric-card` 的 `icon` 由字符串改组件 | 迁移方案 §6.2 / §6.3 | **已完成（3ad69ec0）**：parity 4/4、单测 8 例、guard 58 |
| `pages/admin/calendar/index.vue` + `components/admin/calendar/{calendar-view,kanban-view}.vue` | `/admin/calendar` | Select / Tabs 族 / SelectButton / ProgressSpinner / Button / Tag | 已迁完：Tabs 族改 CaomeiTabs + Trigger/Content；语言选择 size sm；月历工具栏 icon-only + Chevron；看板计数 Tag 走 tone | 迁移方案 §6.2 / §6.1 C 组 | **已迁移（待复审）**：迁移新增单测 9 例（另保留既有 9 例）、浏览器探针 pageerror 0、tabs 2 / 看板 3 列 |
| `components/app-header.vue` / `app-search.vue` / `app-notifications.vue` / `language-switcher.vue` / `feedback-entry-button.vue` | 公开页共享壳 | Button ×21 / Divider ×2 | 已迁完（25 处）：全部 `Button` → `CaomeiButton`（`text rounded` → `ghost`、图标按钮 → `icon-only` + `#icon` + lucide；`Menu` / `Calendar` 与 PrimeVue 组件同名，按别名导入）；`Divider` → `CaomeiDivider`；通知徽标改 `badge` / `badgeTone`，消息条 `severity` → `tone`；搜索输入改 `CaomeiInput`（`@keyup.enter` → `@enter`，聚焦改暴露的 `focus()`） | 迁移方案 §6.2 / 清单 §2.3 | **已完成（2026-11-07）**：定向单测 29、parity 83/83（头部与反馈入口按实测登记）、基线重采 14 张、E2E critical 全绿 |
| `components/article-share.vue` / `article-sponsor.vue` / `comment-form.vue` / `comment-item.vue` / `subscriber-form.vue` / `reader-controls.vue` | 公开页内容组件 | Button 17 / InputText 4 / Textarea 1 / Tag 3 / Message 1 / Slider 3 / IconField + InputIcon 2 | 已迁完（31 处）：`Button` → `CaomeiButton`（ghost / secondary / icon-only + `#icon` + lucide）；`IconField` + `InputIcon` + `InputText` → `CaomeiInput` + `#prefix`；`Textarea` → `CaomeiTextarea`（`autoResize` 保留）；`Tag` → `CaomeiTag`（作者 primary / 置顶 warning / 语言 neutral）；`Message` → `CaomeiMessage`（`severity` → `tone`）；`Slider` → `CaomeiSlider`；`article-sponsor` 的 `Button as="a"` 改为原生 `<a>` + 按钮样式（保留新标签页语义）；`comment-item` 头像改用 `AppAvatarV2`（路由未登记时仍回退 V1，视觉不变） | 迁移方案 §6.2 / 清单 §2.3 | **已完成（2026-11-07）**：定向单测 36、关联页面测试 130、parity 83/83、E2E critical 全绿；组件 163 → 132、图标 189 → 176 |
| `components/app-uploader.vue` / `app-avatar.vue` / `app-voice-input-*` / `home/**` / `taxonomy-post-page.vue` | 公开页共享壳 / 组件 | 见 §2.3 | （待填） | 同上 | 待迁移 |
| `pages/about.vue` / `benefits.vue` / `feedback.vue` / `archives/index.vue` / `categories/index.vue` / `tags/index.vue` / `posts/index.vue` | 公开路由 | 见 §2.1 | （待填） | 同上 | 待迁移 |

## 6. 变更记录

- 2026-11-06：条目 1 立项产出（现取复核、14 条参考态纳入与采集、扩族策略、清单骨架）。
- 2026-11-06（B4-A 首批）：`/admin/snippets` + `/admin/snippets/capture` 整路由迁移完成（7 文件：5 组件 + 2 页面），路由 scope 与 `migratedSubRoutes` 登记，parity 4/4 PASS；其余管理端路由待迁移。
- 2026-11-06（B4-A）：`/admin/ai/tasks/[id]` 与 4 个共享 AI 组件迁移完成；`AI_ROUTE_SCOPE` 移除子路由例外并扩户；parity 4/4 PASS。
- 2026-11-07（B4-A）：`/admin/calendar` + 月历 / 看板视图迁移完成；路由 scope 登记；迁移新增测试 9 例（另保留既有 9 例）。lucide `Calendar` 别名后复算 398 处；其中仍含 marketing 路由 1 处既有假阳性（真实 PrimeVue 组件面 397）。
- 2026-11-07（B4-A）：`/admin` 仪表盘与 3 个 dashboard 组件迁移完成；`/admin` 以**前缀语义**登记（整个管理端树逐页声明归属，编辑器留作 `primeVueSubRoutes` 例外），复算组件 370 / 31 类、图标 328。
- 2026-11-07（B4-A）：编辑器子批（`/admin/posts/[id]` + 19 个 `components/admin/posts/**`）迁移完成；`/admin/posts` 登记 `ownedFiles` / `inScopeComponents` / `migratedSubRoutes`，V1 三件套删除，`primeVueSubRoutes` 全仓清零；复算组件 188 / 26 类、图标 235。
- 2026-11-07（B4-B 第二批）：公开页内容组件 6 文件迁移完成（`article-share` / `article-sponsor` / `comment-form` / `comment-item` / `subscriber-form` / `reader-controls`，31 处），图标 13 处改 lucide；复算组件 132 / 23 类、图标 176。
- 2026-11-07（B4-B 首批）：全局布局壳 5 文件迁移完成（`app-header` / `app-search` / `app-notifications` / `language-switcher` / `feedback-entry-button`，25 处），图标 46 处改 lucide；同批修复 `use-theme` 的 `@layer` 层序声明位置（暗色内容底色误取 Aura `surface.900`）与编辑器 E2E 的 `.title-input` 选择器。复算组件 163 / 26 类、图标 189。
- 条目 2 / 3 / 4 迁移时在本表逐行补「改动点 / 依据指针 / 状态」，不新增第二份清单。

## 7. 相关文档

- [PrimeVue → caomei-ui 迁移方案](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)
- [视觉一致性门禁](./2026-10-13-visual-parity-gate.md)
- [项目计划](../../plan/roadmap.md)、[待办事项](../../plan/todo.md)
- [测试规范](../../standards/testing.md) §7.2
