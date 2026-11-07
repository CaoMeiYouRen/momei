# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:b4-b-global-shell:第七十一阶段条目 3（B4-B）全局布局壳:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 3（B4-B）：全局布局壳迁移（AppHeader / 搜索 / 通知 / 语言切换 / 反馈入口）

### 范围

- `components/app-header.vue`（17 处：`Button` ×15 / `Divider` ×2）、`app-notifications.vue`（4）、`app-search.vue`（2）、`language-switcher.vue`（1）、`feedback-entry-button.vue`（1）：全部改为 caomei-ui；图标改 `@lucide/vue`（`Menu` / `Calendar` 与 PrimeVue 组件名同名，按别名导入）。
- 全局壳是**所有默认布局页面**共享的渲染面：本批同时影响 29 条已迁移路由与 12 条公开页的头部，以及公开页左下角反馈入口。
- 因共享壳改变，重采 **14 张** `tests/visual` 基线（12 张管理端 + 2 张安装向导），并按实测为 80 条 parity 条目登记头部（公开页另加反馈入口）允许清单；安装向导 6 个区域按新实测回填。

### 顺带修复（B4-B 前置缺陷）

- **CSS `@layer` 层序**：`useHead` 注入的 `#momei-theme-custom` 可能排在外部 `main.css` 之前；若由其中的 `@layer momei-overrides` 先建立层序，`primevue` 会被排到其后并反向胜出，暗色下内容底色取到 Aura 的 `surface.900`（亮色）。实测 `/admin/friend-links` 暗色整页变白（parity 差异 497,229px）；在 `use-theme.ts` 样式串首行补 `@layer primevue, momei-base, momei-overrides;` 后回到 33,436px（仅头部）。
- **E2E 标题选择器**：编辑器迁移后 `.title-input` 是 `CaomeiInput` 根 div，`.fill()` 不再可用；`auth-session-governance` 与 `mobile-critical` 改为 `.title-input input`（`toHaveValue` 同步）。

### 验证

- 定向单测：`language-switcher` / `feedback-entry-button` / `app-notifications` / `app-search` / `app-header` → **5 files / 29 passed**；过渡组件与路由守卫 **76 passed**。
- `pnpm typecheck` 0；`pnpm lint` 0 error / **9 warnings**（预算 10）；`pnpm lint:css` 0；`pnpm lint:i18n` 0。
- `pnpm test:visual` **24/24**（重采后复跑）；`pnpm test:visual:parity` **83/83**。
- `pnpm test:e2e:critical` **17 passed / 1 skipped** + 安装向导 **2 passed**。
- 全量 `pnpm test`：**5,052 passed / 1 skipped**；25 个 suite 因**既有的本地 vitest `virtual:intlify-i18n` 解析问题**失败（在 HEAD 上同样失败，已登记 backlog，CI 不复现）。
- 复算：组件 **188 → 163 处 / 26 类**；图标 **235 → 189 处**；token 1,445（本批 0 变化）。

### 已接受的视觉 / 行为差异

- 头部图标字形与按钮外观：`PrimeVue Button text/rounded` → `CaomeiButton ghost/rounded/icon-only`；图标从 `pi pi-*` 字体改为 lucide SVG，字形轮廓与尺寸略有差异（parity 头部区域逐路由实测 5,870–6,201px，已登记允许清单）。
- 反馈入口按钮：`outlined secondary` → `secondary` 描边；移动端仍隐藏可见文案（由隐藏 `.p-button-label` 改为 `.caomei-button__content`）。
- 安装向导健康检查步骤内的语言切换控件随共享壳改变高度，内容区按区域重分布（已按实测回填 6 个区域）。
- `admin-posts-list` 重采时发现行内「无封面」lucide 图标与旧基线有 1px 级抗锯齿差异（461px）；parity 参考态（迁移前原貌）同一位置差异为 0，判定为旧基线过期而非回归。

### 未覆盖边界

- `app-avatar` / `app-uploader` / `content-language-switcher` 的 V1 消费者尚未清零（公开页与未迁移路由），去 `-v2` 后缀留到条目 3 后续子批。
- 未迁移公开页本体（文章 / 评论 / 首页 / 分类 / 标签 / 归档 / 友链）仍为 PrimeVue；本批只统一了它们共享的布局壳。
- `app-header` 的管理端 / 用户菜单条目图标仍以 `pi pi-*` 类名声明、经 `resolvePrimeIcon` 适配为组件（`CaomeiDropdownMenu` 只接受组件图标）；随条目 4 图标全量替换一并清理。
- 暗色主题的头部差异随路由头部元素显隐在 6,043–6,201px 区间波动，允许清单按逐路由实测登记，不做单值近似。

<!-- regression-window:end:b4-b-global-shell:第七十一阶段条目 3（B4-B）全局布局壳:2026-11-07 -->

<!-- regression-window:start:b4-a-post-editor:第七十一阶段条目 2 编辑器整路由:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 2（B4-A）：文章编辑器整路由迁移

### 范围

- `pages/admin/posts/[id].vue` + `components/admin/posts/**`（19 个组件；编辑器族整批）。
- 组件替换（此前全部为 PrimeVue）：`Button` / `Tag` / `Select` / `InputText` / `Textarea` / `Message` / `Divider` / `Image` / `ProgressSpinner` / `ProgressBar` / `Checkbox` / `Avatar` / `InputNumber`，以及首次生产迁移的 `RadioButton` → `CaomeiRadioGroup` + `CaomeiRadioButton`、`ToggleSwitch` → `CaomeiSwitch`、`AutoComplete`（`suggestions` / `{query}` → `options` / `query`）、`InputGroup`、`SplitButton`（`model` 的 `icon` 由 `pi` 字符串改为 lucide 组件）、`ButtonGroup`、`TagsInput`。
- 三件套收敛：编辑器改用 `post-audit-badge-v2` / `post-audit-dialog-v2` / `publish-push-dialog-v2`；V1 三件套与其两份「两版等价」契约测试**删除**（`post-audit-dialog.contract.test.ts` / `publish-push-dialog.contract.test.ts`），`/admin/posts/[id]` 不再是 V1 消费者。
- 图标：**81 处** `pi pi-*` → `@lucide/vue`（含数据驱动的 `writingMenuItems` / `translateMenuItems` / `REWRITE_STYLES`）。
- 路由登记：`/admin/posts` 新增 `ownedFiles`（19 个组件）、`inScopeComponents`（Textarea / Message / Skeleton / Divider / Image / ProgressSpinner / ProgressBar / Checkbox / RadioButton / ToggleSwitch / AutoComplete / InputGroup / SplitButton / ButtonGroup / Avatar / InputNumber）与 `migratedSubRoutes`（`[id].vue`），删除原 `primeVueSubRoutes`；`/admin` 树根前缀同步把 `[id].vue` 移入 `migratedSubRoutes`。**全仓 `primeVueSubRoutes` 例外清零**。
- 顺带修复（69 阶段遗留）：`CaomeiPopoverTrigger` 会给锚点元素套默认按钮外观，渲染时留下两个 26×36 空盒子（实测顶栏 `#ai-writing-btn` 之后）；用零尺寸/透明规则复位 `rewrite-popover-anchor` / `title-popover-anchor` / `voice-popover-anchor`。
- 结构治理：`post-editor-header.vue` 因迁移从 753 行增至 836 行（越过 ESLint `max-lines` 800 warn 线），把风格数据外置为 `components/admin/posts/post-editor-rewrite-styles.ts`，并把 `severity → tone` 抽为 `utils/shared/ui-tone.ts`（dashboard / 编辑器 / AI 任务详情三处重复实现收敛），最终 798 行；`ai-image-generator.vue` 787 → 819 后清理死样式 / 死类（含 `.p-*` PrimeVue 内部选择器与未使用的 `&__image-wrapper`），最终 799 行。全仓 lint 警告 **9**（低于 10 的预算上限）。

### 验证

- `pnpm typecheck` 0；`pnpm lint` 0 error / **9 warnings**；`pnpm lint:css` 0；`pnpm lint:i18n` 0。
- `npx vitest run components/admin/posts tests/client/components/admin/posts components/admin/ai tests/modules/ui-library-route-migration-guard.test.ts tests/modules/ui-library-transition-component-guard.test.ts` → **16 files / 152 passed**。
- `pnpm build` 通过（最终一次 2m32s）。
- 浏览器探针（build 产物 + TEST_MODE 登录，1600×900，**headless 与 `xvfb-run` headed 两轮**）：`/admin/posts/new` → 200、标题输入框 1、顶栏 **15 个按钮全部为 `caomei-button`**（`i.pi` 计数 0）、设置面板可见、`pageerror` 0；`Languages` / `Pencil` / `Search` / `AlignLeft` 图标渲染正确；两个锚点实测 `0×0`。
- headed 探针（`xvfb-run`，等待 **8s** 后交互）：标签输入「输入 + Enter」成功新增 chip（输入框清空）、语言 `CaomeiSelect` 展开（`aria-expanded=true`）、置顶 `CaomeiSwitch` 切为 `checked`、侧栏「收起」（`--compact`）与「关闭」（`--visible` 与父级 `editor-area--shifted` 同时消失）均正常，`pageerror` 0。
- **探针时序结论（本条对既有记录同样适用）**：编辑器页体积较大，**水合完成需要 6–8s**；3s 内交互会命中未水合的静态 DOM（表现为点击无响应、`CaomeiSelect` 不展开）。此前若在 2–3s 内探测 `/admin/settings`、`/admin/calendar` 的 `CaomeiSelect`，结论同样不可信——判定「headless 下不展开」的两条历史记录应复查；本批的 headed 探针（8s）显示 `CaomeiSelect` 正常展开。
- 管理端 E2E 主路径：`tests/e2e/admin-workflow.e2e.test.ts` **14 passed**、`tests/e2e/admin-posts-shortcut.e2e.test.ts` **4 passed**（首次并行运行有 1 例 firefox 超时，单文件复跑全绿，判定为冷启动抖动）。
- 复算：组件 **370 → 188 处 / 31 → 26 类**；图标 **328 → 235 处**；token 1,445（本批 0 变化）。

### 已接受的视觉 / 行为差异

- 首屏组件基线差异随 caomei 组件统一呈现：`CaomeiButton`（`secondary` = 描边、`ghost` = 无底色）、`CaomeiTag` 的 tone 色板、`CaomeiSwitch` / `CaomeiRadioGroup` 的指示器样式、`CaomeiInput` / `CaomeiSelect` 的字段高度与圆角。`PrimeVue` 的 `contrast` 语义无对应 tone，统一落 `neutral`（§6.2 有损近似）。
- `SelectButton` 的 `allowEmpty` 语义不适用（整数 / 字符串枚举，无「取消选中」路径）。
- **标签字段改用 `CaomeiTagsInput`**：caomei `AutoComplete` 在多选模式下没有自由文本入口（`onEnter` / `commitFreeText` 直接返回），照搬会**丢失「新建标签」能力**（提示文案「输入标签名称并回车」与服务端 `ensureTags` 都依赖它）。代价是**失去输入时的标签联想下拉**（`search-tags` / `filteredTags` 链路随之删除）；后续若需要「联想 + 新建」二合一，需上游提供带 options 的 tags input。
- **翻译菜单的语言图标**：原 `fi fi-cn` / `fi fi-us` 等旗标类名改为统一的 lucide `Languages`（caomei `DropdownMenuModelItem.icon` 只接受组件，无法传 CSS 类）；菜单项文本仍显示语言名。
- **进度条的条内百分比**：PrimeVue `ProgressBar` 默认在条内渲染 `88%`，caomei `ProgressBar` 无该能力（审计弹窗 7 条与翻译工作流进度条受影响）；百分比数值在每条旁仍有文本，信息未丢失。
- `AutoComplete` 的 `#option` / 值形状按 caomei 契约重写；`post-editor-settings` 的标签建议与翻译来源搜索仍在 `complete` 事件里把字符串包成 `{ query }`，与既有 composable 契约一致。

### 未覆盖边界

- `/admin/posts/[id]` 无 parity 基线（无稳定种子 id；新建态默认展开设置面板、无 heading）；本批以组件测试 + 浏览器探针 + E2E 覆盖。既有文章编辑页未做浏览器截图（TEST_MODE 种子库无文章，列表为空）。
- 暗色主题未单独截图；下拉 / 浮层的真实展开在 headless 探针中仍无法触发（与 `/admin/settings`、`/admin/calendar` 同一既有环境行为）。
- **既有缺陷，未在本批修复**：`publish-push-dialog-v2` 的排期仍用 PrimeVue `DatePicker`（B3 表单族，随 B3 残留族收口）；`/admin/marketing` 与 `/admin/migrations/link-governance` 的 `Card` / `ProgressSpinner` 残留同属 B3 / B4 收口。
- **本地环境限制**：`utils/shared/post-copyright.ts` 的 locale JSON 导入在本地 vitest 下会报 `Cannot find module '/@id/virtual:intlify-i18n-N'`（已登记 backlog；`utils/shared/post-copyright.test.ts` 同样受影响，与本次改动无关）。`post-editor-header.test.ts` 通过模块级 mock 掉 `post-distribution-button.vue` 绕开该传递依赖，本地可正常执行（该 mock 与 `global.stubs` 并存，属已登记的测试技术债）。
- **提交规模**：本批 **46 个变更文件**（38 修改 + 5 删除 + 3 新增）/ 约 +1400 行，超出「≤10 文件」的常规粒度。**拆分依据**：编辑器是**单个路由**，`pages/admin/posts/[id].vue`、19 个路由自有组件与 V1 三件套的删除必须在同一点落库——先迁一半会让该路由同时运行两套库（违反「不做半路由切换」），先删 V1 会让页面引用空模块（编译失败）。测试与文档同批是为了让「登记 / 断言 / 证据」与实现保持同一可复算基线。

<!-- regression-window:end:b4-a-post-editor:第七十一阶段条目 2 编辑器整路由:2026-11-07 -->

<!-- regression-window:start:b4-a-admin-dashboard:第七十一阶段条目 2 仪表盘整路由:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 2（B4-A）：仪表盘 `/admin` 整路由迁移

### 范围

- `pages/admin/index.vue` + `components/admin/dashboard/{metric-card,creator-metric-card,creator-stats-panel}.vue`。
- 组件替换：`Button` → `CaomeiButton`（刷新，`loading` + lucide `RefreshCw`）；Tabs 族 → `CaomeiTabs` + `CaomeiTabTrigger` / `CaomeiTabContent`（`unmount-on-hide=false` 保留创作面板已加载状态）；范围筛选 `Select` → `CaomeiSelect`（`:model-value` + 收窄回写，避免把 `string | number | null` 直接写进 `'all' | 'public'`）；10 处 `Tag` → `CaomeiTag` 走 tone（页面 5 + 创作面板 4 + 指标卡 1；`secondary` / `contrast` → `neutral`、`info` → `primary`、`warn` → `warning`）；`ProgressSpinner` → `CaomeiProgressSpinner`；3 张排行卡 + 3 张指标卡 `Card` → `CaomeiCard`（`#content` → 默认插槽）；**17 处** `pi pi-*` → `@lucide/vue`（页面 12 + 创作面板 5）；`icon` prop 由字符串改为组件（`metric-card` / `creator-metric-card`）。
- 样式：`.dashboard-metric-card` 与 `.admin-dashboard__ranking-card` 的描边 / 背景改走 `--caomei-card-border` / `--caomei-card-bg` 覆盖钩子——直接写 `border` / `background` 与 `.caomei-card--outlined[data-v-*]` **同特异性**，胜负取决于样式表加载顺序（跨 chunk 不确定），实测用钩子后稳定生效（描边 `1px solid`、渐变背景保留、图标右对齐距卡右内侧 17px）。
- 路由登记：`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin`（树根前缀），`ownedFiles` 三个 dashboard 组件、`inScopeComponents` 仅 Tabs 族；`migratedSubRoutes` 登记 22 个已迁移的管理端子页面、`primeVueSubRoutes` 保留编辑器 `/admin/posts/[id]`。
- 测试：新增 `pages/admin/index.test.ts`（5）、`components/admin/dashboard/metric-card.test.ts`（4）、`creator-stats-panel.test.ts` 补 3 例 = **新增 12 例**。`creator-stats-panel.test.ts` 同时把 mock 的 `stats` 从普通对象改为真正的 `ref`：旧形状下模板 `v-else-if="stats"` 为真（指标卡仍渲染），但 computed 里的 `stats.value` 为 `undefined`，`hasTrendData` / `hasDistributionData` / `granularityLabel` 永久走空分支——**排行 / 趋势区从未被覆盖**；修复后该区才有真实断言。

### 验证

- `pnpm typecheck` 0；`pnpm lint` 0 error；`pnpm lint:i18n` 0；`pnpm lint:css` 0；`pnpm build` 通过（2m28s）。
- `npx vitest run components/admin/dashboard pages/admin/index.test.ts tests/modules/ui-library-route-migration-guard.test.ts tests/modules/ui-library-transition-component-guard.test.ts` → **6 files / 100 passed**（分文件实测：dashboard **19** / 页面 **5** / 路由守卫 **60** / 过渡守卫 **16**；逐文件复算：`npx vitest run components/admin/dashboard`、`npx vitest run pages/admin/index.test.ts`、`npx vitest run tests/modules/ui-library-route-migration-guard.test.ts`、`npx vitest run tests/modules/ui-library-transition-component-guard.test.ts`）。
- 计数复算命令（**钉迁移前提交 `f63b7639`**，否则本次提交后 `HEAD` 前移、命令返回 0）：`git show f63b7639:pages/admin/index.vue | grep -o 'pi pi-[a-z-]*' | wc -l` → 12；`git show f63b7639:components/admin/dashboard/creator-stats-panel.vue | grep -o 'pi pi-[a-z-]*' | wc -l` → 5；`git show f63b7639:pages/admin/index.vue | grep -c '<Tag\b'` → 5。
- 浏览器探针（build 产物 + TEST_MODE 登录，1440×900）：`/admin` → 200、h1「内容洞察」、`role=tab` 2 条、`CaomeiCard` 3 张（指标卡）、`CaomeiTag` 8 个、`pageerror` 0；指标卡实测描边 / 渐变 / 图标右对齐均正确；创作页签切换后无报错。
- 复算：组件 **398 → 370 处 / 36 → 31 类**；图标 **352 → 328 处**；token 1,445（本批 0 变化）。

### 已接受的视觉 / 行为差异（无 parity 基线，人工核对）

- `Card` → `CaomeiCard` 的组件基线差异：阴影消失（PrimeVue Aura `0 1px 3px rgb(0 0 0/.1)` → caomei `--outlined` 无阴影）、body 内边距 `20px → 16px`、标题 `20px/500 → 16px/600`。影响 6 张卡（3 指标 + 3 排行）与创作面板 2 张卡的标题；描边与渐变背景已用 `--caomei-card-*` 钩子显式保留。
- `Tabs` 面板挂载时机：PrimeVue `TabPanel` 未设 `lazy` 时首屏即渲染，reka `TabsContent` 走 `Presence`，`unmount-on-hide=false` 只保证**首次激活后**不卸载——创作面板的 `onMounted` 取数因此从「页面加载即请求」变为「首次点击创作页签才请求」。功能无回归（少一次首屏请求），但属行为差异；面板未挂载时 `creatorRefreshSignal` 自增会丢失（当前交互不可达：无页签外的刷新入口）。
- 「迁移前后无像素对照」：`/admin` 的指标窗口按运行时「最近 N 天」计算，参考态跨日即漂移，故无 parity 基线。

### 未覆盖边界

- `/admin` 不进跨日 parity 基线（指标窗口按「最近 N 天」运行时计算），本批以组件测试 + 浏览器探针替代；无「迁移前 / 迁移后」像素对照。
- 创作页签在浏览器探针中只到「空状态」：`/api/admin/creator-stats` 在 SQLite 下 `range=30` 返回 500（`no such function: DATE_TRUNC`，PostgreSQL 专有函数），属**既有后端缺陷**，已登记 backlog 待跟踪；卡片 / 趋势 / 分发标签的渲染由组件测试（含 `CaomeiCard` / tone 断言）覆盖。
- 指标卡网格在 1440px 下为单列（`.admin-dashboard__metrics` 计算宽 1312px）：`_admin-dashboard.scss` 末尾 `respond-to("md")`（`min-width`）把三列布局压成 `1fr`，与基础规则矛盾，属**既有布局缺陷**（本批未改该媒体查询），已登记 backlog。
- 暗色主题未单独截图；下拉展开在 headless 探针中仍无法触发（与 `/admin/settings`、`/admin/calendar` 同一既有环境行为）。

<!-- regression-window:end:b4-a-admin-dashboard:第七十一阶段条目 2 仪表盘整路由:2026-11-07 -->

<!-- regression-window:start:b4-a-calendar:第七十一阶段条目 2 内容日历整路由:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 2（B4-A）：内容日历整路由迁移

### 范围

- `/admin/calendar` + `components/admin/calendar/{calendar-view,kanban-view}.vue`。
- 组件替换：Tabs 族 → `CaomeiTabs` + `CaomeiTabTrigger` / `CaomeiTabContent`（模板 `#panel` → 子组件）；语言选择 `Select` → `CaomeiSelect`（size `sm`）；月历工具栏两枚 icon-only 按钮（lucide Chevron）+ Today 按钮；视图切换 `SelectButton`；加载态统一 `CaomeiProgressSpinner`；看板计数 `Tag` → `CaomeiTag`（tone `primary`）。
- 路由登记：`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin/calendar`（`ownedFiles` 两视图 + Tabs 族 / `SelectButton` / `ProgressSpinner` 增量）。

### 验证

- 单测：`pages/admin/calendar/index.test.ts`（3）+ `calendar-view.test.ts`（3）+ `kanban-view.test.ts`（3）= **迁移新增 9 passed**；既有 `tests/client/.../calendar-view.test.ts` **9 passed 保留**；guard **59 passed**。
- 浏览器探针（build 产物 + TEST_MODE 登录）：`/admin/calendar` → 200、h1「内容日历」、`role=tab` 2 条、看板 3 列、`pageerror` 0。
- 复算：组件 411 → **398 处 / 36 类**（本批消除 calendar 路由的 1 处 lucide `Calendar` 假阳性；398 仍含 marketing 路由 1 处既有假阳性，真实 PrimeVue 组件面 397）；图标 358 → **352 处**；token 1,445（本批 0 变化）。
- 未纳入跨日 parity：日历「今天」高亮与当月网格跨日 / 跨月不可复现，按条目 1 的判定改用组件测试 + 探针覆盖。
- 修复（Round 1 审计）：`CaomeiSelect` 丢弃 `null` 值选项 → 语言筛选改用非空哨兵 `'__all__'`（空串会触发 reka `SelectItem` 断言）并在回写时还原 null（「全部语言」恢复可选）；`CaomeiTabs` 补 `:unmount-on-hide="false"` 保留月历状态；prev / next 改用 `pages.admin.calendar.prev_period` / `next_period`（5 语言）；页面测试补语言哨兵与页签切换用例。

### 未覆盖边界

- 月历网格在 TEST_MODE 无文章数据时页面持续显示「加载中」（`calendarLoading` 由 setup 顶层 `void loadData()` 驱动，SSR 与 hydration 时序既有行为；迁移未改该逻辑），未做 HEAD 对照验证；登记为观察项。
- 月历 / 看板无截图基线；看板卡片拖拽与更新阶段路径未在浏览器验证（原有 E2E 未覆盖）。

<!-- regression-window:end:b4-a-calendar:第七十一阶段条目 2 内容日历整路由:2026-11-07 -->

<!-- regression-window:start:b4-a-ai-task:第七十一阶段条目 2 AI 任务详情整路由:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 2（B4-A）：AI 任务详情与共享内容组件迁移

### 范围

- `/admin/ai/tasks/[id]` 整路由：Button / ProgressSpinner / Message / Card + `AdminAiTaskDetailContent`。
- 共享组件：`task-detail-content.vue`（Tag ×3 走 tone、复制按钮、错误 Message、AI 图片包装层）、`task-details-dialog.vue`（ProgressSpinner / Message）、`stats-overview.vue`（5 个 Card + 9 图标）、`metric-card.vue`（Card；`icon` prop 由字符串改为组件）。
- 路由登记：`AI_ROUTE_SCOPE` 移除 `primeVueSubRoutes`，加 `migratedSubRoutes`（任务详情）、`ownedFiles`（task-detail-content）与 `inScopeComponents`（Card / Message / ProgressSpinner / Image）。

### 验证

- parity admin-ai **4 passed**：stats-light 23,503px（2 区域）、stats-dark 24,127px（2 区域）、tasks-list-light 23,542px、tasks-list-dark 26,961px；stats 两条的第二区域按实测复校（24,879→21,377 / 25,661→21,972），未归因 0。
- 详情页错误分支探针：`/admin/ai/tasks/nonexistent-id` → 200，h1「AI 任务详情」，`CaomeiMessage` 显示 "Task not found"，pageerror 0。
- `npx vitest run components/admin/ai "pages/admin/ai/tasks/[id].test.ts"`：**8 passed**（内容 5 + 页面三态 3）；guard 58 passed；`typecheck` 0；`build` 通过（3m05s）。
- 修复（Round 1 审计）：`CaomeiCard` 的 `#title` 内 `space-between` 失效（heading 宽度塌缩）→ 指标卡与告警卡改用 `#extra` 插槽承载图标；补充 Tag tone 顺序断言与页面三态测试；`metric-card` 恢复 CRLF；迁移方案例外清单同步（AI 子路由转正）。
- 复算：组件 429 → **411 处 / 36 类**；图标 374 → **358 处**。

### 未覆盖边界

- `/admin/ai/tasks/[id]` 正常数据态无种子任务，未做浏览器截图；由组件测试与错误分支探针覆盖。
- parity 参考态仍为迁移前 PrimeVue；stats-overview 迁移后的差异按实测归因，未重采参考态。

<!-- regression-window:end:b4-a-ai-task:第七十一阶段条目 2 AI 任务详情整路由:2026-11-06 -->

<!-- regression-window:start:b4-a-snippets:第七十一阶段条目 2 灵感收纳箱整路由:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 2（B4-A 首批）：灵感收纳箱整路由迁移

### 范围

- `/admin/snippets` + `/admin/snippets/capture` 整路由（7 文件：5 组件 + 2 页面）：`snippet-card` / `quick-capture` / `edit-dialog` / `bookmarklet` / `aggregate-dialog` + 两个页面。
- 组件替换：Button（icon-only + lucide `#icon`）、Tag（tone + 默认插槽）、Checkbox（数组模型）、Paginator（1 基 `page` + 自渲染页码报告，`useAdminList` 加 `pageIndexBase: 1`）、Textarea / Select / SelectButton / InputNumber / Divider / Card / Image / Accordion 族；图标 30+ → `@lucide/vue`（`pi-spin` → `LoaderCircle` + 本组件动画）。
- 路由登记：`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin/snippets`（`ownedFiles` 5 个组件 + `migratedSubRoutes` capture）。

### 验证

- `pnpm test:visual:parity`（仅 4 条，**样式修复后重测**）：**4 passed**；list-light 17,628px / list-dark 18,318px / capture-light 9,087px / capture-dark 9,410px，全部由 allowlist 按实测扣减，未归因 0。修复前 list-dark 为 73,535px（快捷采集卡片高度塌缩导致），修复 textarea 内层控件后回落。
- `npx vitest run pages/admin/snippets/index.test.ts components/admin/snippets tests/modules/ui-library-*-guard.test.ts tests/scripts/parity-budget.test.ts`：**7 files / 98 passed**（页面 5 + 组件 10 + 守卫 74 + 预算 9）。
- `ui-library-route-migration-guard` + transition guard：**74 passed**（路由守卫 58 + 过渡组件 16）。
- `pnpm typecheck` 0；`pnpm lint` 0 error；`pnpm build` 通过（2m27s）。
- 页面结构探测（Playwright + admin storage）：h1、聚合按钮 disabled、空态、capture 标题 / textarea / Tag 均正常，`pageerror` 0。

### 修复（Round 1 审计）

- 补 5 个语言包 `common.back`（返回按钮可访问名）；
- `CaomeiTextarea` 内层 control 的 flex / 高度 / 字号 / 行高（capture 20px、quick-capture 18px、edit 16px）；
- 缩略图补 `.caomei-image` 根节点尺寸；
- 聚合弹窗移除 `useI18n()` 内联调用（改用 setup 顶层 `locale`，避免事件处理器内抛错）；
- parity allowlist 按互斥连通区域重登记（list-dark 改为 4 个 allowlist 区域（5 个连通域），声明值 = 各区域实测）。

### 未覆盖边界

- 非空片段列表的分页交互未用真实数据验证（TEST_MODE 无片段种子），分页转换由单测覆盖。
- E2E 补跑计划：`tests/e2e` 无 snippets 专用 spec，随下一次 `regression:weekly` / 管理端 E2E 补跑 `/admin/snippets` 主路径；本窗口不以探针替代 E2E 证据。
- list-dark 修复前 73,535px 中约 55,000px 来自快捷采集卡片高度塌缩（内层 `textarea` 仅 45px）；修复后降至 18,318px，剩余为卡片 / 折叠面板内边距与暗色底色差异。
- capture 的差异由 5,620 / 5,956 增至 9,087 / 9,410：文本域修复为填满容器后，外观差异区域随之扩大，属结构正确后的真实差异。

<!-- regression-window:end:b4-a-snippets:第七十一阶段条目 2 灵感收纳箱整路由:2026-11-06 -->

<!-- regression-window:start:b4-item-1-baseline:第七十一阶段条目 1 B4 开工基座:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 1：B4 开工基座与参考态采集

### 范围

- 现取复核：未迁移页面 **19 个 / 页面口径 90 处**（剥离注释 89 处）；脚本口径组件 **482 处 / 40 类 / 82 文件**。
- 参考态：`PENDING_ROUTES` 登记 **14 条**（管理端 2 + 公开页 12），HEAD 采集 **28 张**；`/admin` 与 `/admin/calendar` 因运行时日期窗口 /「今天」高亮不纳入，另 5 条动态 id / 无种子路由不纳入（2 条日期型 + 2 条动态 id + 3 条无种子 = 7 条路由，清单表内 6 行）；`/privacy-policy`、`/user-agreement` 按默认 agreement 兜底纳入。
- 门禁基建：`gotoWaitUntil` 支持（外部头像阻塞 `load`）；heading 等待改为 `exact: true` + `.first()`（保留 `.first()` 作为精确同名时的 DOM 顺序兜底）；`--only` 改为后缀锚定，避免 `posts-list` 误命中 `admin-posts-list`。
- 在册族：全局扩族会使 **8 条已收口路由**判红（合法残留），改为随条目 2 / 3 路由整迁登记 `inScopeComponents`，B3 残留族另行收口后再并入全局基准；清单见 [B4 迁移清单](../../design/governance/2026-11-06-b4-migration-inventory.md)。

### 验证

- `pnpm test:visual`：**24 passed**（4.7m）。
- `pnpm test:visual:parity`：**83 passed**（82 条比对 + 1 条安装路由登记守卫，18.5m），新 28 条实测 0px / 0.000%。
- `npx vitest run tests/scripts/capture-visual-reference.test.ts tests/scripts/parity-budget.test.ts tests/modules/ui-library-route-migration-guard.test.ts`：**74 passed**。
- `pnpm typecheck` 0；`pnpm lint` 0 error（9 个既有 warning）；`lint-md` 通过。
- 误采修复：`--only=posts-list` / `friend-links` 曾子串命中已迁移路由并覆盖 4 张参考态，已恢复原图与 manifest 记录；`--only` 已改为后缀锚定并补单测。

### 未覆盖边界

- `/admin`、`/admin/calendar`、`/admin/posts/[id]`、`/admin/ai/tasks/[id]`、`/categories/[slug]`、`/tags/[slug]`、`/goto/[code]` 未纳入 parity；前两者为运行时日期依赖，其余为动态 id / 无种子。
- 新 28 条参考态为「HEAD 当前渲染」，与采集时点绑定；条目 2 / 3 迁移后只比对这些参考态。

<!-- regression-window:end:b4-item-1-baseline:第七十一阶段条目 1 B4 开工基座:2026-11-06 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-05 -->
## 2026-11-05 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-05-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-05-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 105 行 / 3 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 补充证据: `test:e2e` 单 worker **228 passed**（34.1m）；CI 同提交 `Test` run `42016033169` 的 E2E 1/4–4/4 分片亦全部 success。
- 阈值处置: 首屏 JS 360KB → **365KB**（实测 369,212 B）；重复代码基线 1.22% / 45 clones → **0.5% / 48 clones**（允许 0.65% / 50）；依据见 [2026-11-05 质量门阈值重定标](../../design/governance/2026-11-05-quality-gate-recalibration.md)。
- 环境说明: 此前本地 `seo-regression` 文章详情 `page.goto` 外部资源加载超时，已将该用例改为 `waitUntil: 'domcontentloaded'` 后通过，断言强度不变。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-05 -->

<!-- regression-window:start:caomei-locale-wiring:第六十九阶段条目 3 内建文案 locale 接线:2026-11-02 -->

## 2026-11-02 第六十九阶段条目 3 内建文案 locale 接线（`CaomeiConfigProvider` + `registerLocale`）

### 范围

- 新增 `plugins/caomei-locale.ts`：模块顶层静态 import `caomei-ui/locale/{zh-tw,ja-jp,ko-kr}` 并 `registerLocale`；`zh-CN` / `en-US` 由包根预注册，未重复注册。
- `app.vue`：`<CaomeiConfigProvider :locale="caomeiLocale">` 包在 `CaomeiToastProvider` / `CaomeiConfirmDialog` 外层；`caomeiLocale` 由 `composables/use-caomei-locale.ts` 提供（应用 registry 归一化 + `satisfies Record<AppLocaleCode, CaomeiLocale>` 映射，无 `as` 断言）。
- 测试：`tests/plugins/caomei-locale.test.ts`（注册表 / 切换 / 未注册回落 + 告警 / 表格·分页·日期文案键）、`tests/plugins/caomei-locale-ordering.test.ts`（注册晚于 provider 首帧不追溯）、`tests/composables/use-caomei-locale.test.ts`（归一化 / 响应式 / `app.vue` 接线结构）。
- 附带修正：`composables/use-admin-ai-page.test.ts` 的整模块 `vi.mock('caomei-ui')` 改为 `importOriginal`（插件顶层 `registerLocale` 在旧全量 stub 下不存在）。

### 两种注册形态的取舍

| 形态 | 结论 | 依据 |
| :--- | :--- | :--- |
| 静态 import 三门语言（采用） | `coreEntryJs` 353.05KB → **357.41KB**（+4.36KB；三份文件 gzip -9 分别为 1,307 / 1,483 / 1,405 B，合计 4,195 B 仅为单文件参考，入口重压后不可逐字节相加），未越 360KB 配额 | 本轮实测；无首帧阻塞、无切换竞态 |
| 按当前语言异步 import（未采用，未单独构建实测） | 功能上不可选 | `registerLocale` 写入的是普通对象（`dist/locale/index.js`），`provideLocale` 的文案是 `computed` 且只在语言标识变化时重算（`dist/composables/use-locale.js`）。异步注册若晚于 provider 首帧，该语言会一直显示 `zh-CN`；若在语言切换时才 await，切换路径会出现「先回落、后不重算」的竞态。项目内已有 `tests/plugins/caomei-locale-ordering.test.ts` 钉住该契约 |

### 验证结果

- 质量门：`typecheck` 0 error；`lint` 0 error；全量 `pnpm test` **577 passed / 1 skipped（共 578 个测试文件）**；`pnpm build` 成功；`test:visual` **18/18**。
- 包体：`test:perf:budget:strict` 通过——`coreEntryJs` **357.41KB / 360KB**、`maxAsyncChunkJs` 55.45KB / 130KB、`keyCss` 61.79KB / 70KB、`prIncrementJs` 0（基线重取后）。基线三项已按本轮实测重取（`coreEntryJs` 337,008 → 365,988 B、`maxAsync` 49,147 → 56,779 B、`keyCss` 60,896 → 63,270 B），归因写入 `.github/perf/bundle-baseline.json`。
- 浏览器抽查（5 语种，`/admin/users`，无 hydration mismatch）：

| 语种 | Paginator `aria-label` | 「上一页」按钮 |
| :--- | :--- | :--- |
| `zh-CN` | 分页 | 上一页 |
| `en-US` | Pagination | Previous page |
| `zh-TW` | 分頁 | 上一頁 |
| `ja-JP` | ページネーション | 前のページ |
| `ko-KR` | 페이지네이션 | 이전 페이지 |

- 未注册语言回落：`provideLocale({ locale: 'fr-FR' })` 返回 `zh-CN` 文案并在非生产环境输出「未注册」告警（单测覆盖）。

### 未覆盖边界

- `CaomeiDatePicker` 目前无生产使用（日期控件仍是 PrimeVue，随第七十阶段 B3 迁移），故「日期面板」只做到文案键级断言（`datePicker.label` 在 `ja-JP` / `ko-KR` 下分别为 `日付` / `날짜`），未做浏览器面板抽查。
- `ConfirmDialog` 的内建按钮文案同理由单测覆盖（`confirm.confirm`）：现有调用点均显式传 `confirmLabel` / `cancelLabel`，浏览器侧无法触发「未传 label」路径。
- DataTable 空态在浏览器侧未稳定构造（后台列表均有种子数据，`?page=99` 被后端归位到首页），改由文案键断言 + 既有 `Paginator` 实渲染共同覆盖。

<!-- regression-window:end:caomei-locale-wiring:第六十九阶段条目 3 内建文案 locale 接线:2026-11-02 -->

<!-- regression-window:start:overlay-family-migration:第六十九阶段条目 2 浮层族整迁:2026-11-02 -->
## 2026-11-02 第六十九阶段条目 2 浮层族整迁（服务层 / 浮层组件 / v-tooltip）

### 范围

- 服务层：`app.vue` 挂载 `CaomeiToastProvider` / `CaomeiConfirmDialog`，185 处 `toast.add` → `toast.show`、18 处 `confirm.require` → `confirm.confirm` 的 Promise 形态改写；`useToast` / `useConfirm` 仅从 `caomei-ui` 引入。
- 浮层组件：Dialog 39 / Drawer 3 / Popover 5 / Menu 3 / ConfirmDialog 6 全量迁移；6 处生产锚点改声明式触发器或 `useAnchoredPopover`。
- 指令：84 处 `v-tooltip`（36 文件）改由 `components/app-tooltip.vue` 桥接 `CaomeiTooltip`，方位修饰符按 `.top` / `.right` / `.bottom` / `.left` 映射为 `side`（默认 `top`，12 处 `bottom`、2 处 `left`、23 处显式 `top`）。
- 守卫：`tests/modules/overlay-family-residual-guard.test.ts` 以全仓口径（含 `app.vue` / `utils` / `middleware` / `modules`）守住 `v-tooltip`、浮层族 PrimeVue 标签与 PrimeVue 服务层残留。

### 验证结果

- 质量门：`typecheck` 0 error；`lint` 0 error（9 条既有 `max-lines` / `packages/cli` warning）；全量 `pnpm test` 574 文件 / **5,071 passed / 1 skipped**；`pnpm build` 成功。
- 截图识别层：`pnpm test:visual` **18/18**。`admin-agreements-dialog` / `admin-taxonomy-dialog` 浅深两态共 4 张基线按迁移后观感重采，归因见下节。
- 视觉一致性门禁：`pnpm test:visual:parity` **34/34**（含 `admin-marketing-form-dialog` 浅深两态）。
- E2E：`pnpm test:e2e:critical` 三浏览器复跑通过（首轮超时均为并发资源争抢，单测复跑通过）；`pnpm exec playwright test --project=chromium` 72 passed / 1 flaky / 2 failed，失败项归因见下节。

### 差异归因

| 项 | 现象 | 归因 |
| :--- | :--- | :--- |
| `admin-agreements-dialog` 浅 / 深 | 关闭图标由 `pi pi-times` 文本字形变 SVG；内容区左右内边距变宽，提示文案在同宽下多折一行，弹窗总高变化 | `CaomeiDialog` 统一 `--caomei-space-4` 内边距与内建关闭按钮；迁移方案 §5.5 的预期差异，重采基线 |
| `admin-taxonomy-dialog` 浅 / 深 | 标题字号 / 字段间距略增、关闭图标同上 | 同上；弹窗内控件（Tabs / Input / Switch / Checkbox / Select / Textarea）来源未变 |
| `admin-marketing-form-dialog` 浅 / 深 | 旧参考态含 PrimeVue Dialog 外壳，与当前 `CaomeiDialog` 外观整体不一致（未归因 34,572px / 2.668%） | 表单控件在参考态已迁移，外壳本次才迁移；该用例的守卫目标是**弹窗内表单控件**，故按迁移后观感重采参考态，避免为外壳差异登记一条覆盖整个弹窗的允许清单而削弱控件回归灵敏度 |
| `should display settings page`（E2E） | `page.goto('/settings')` 等 `load` 事件 30s 超时 | 环境性：默认页头像指向 `gravatar.com` / `ui-avatars.com`，当前沙箱无外网导致两张图片请求悬挂，`load` 永不触发；同页 `?tab=apiKeys` / `?tab=notifications` 用例均通过，页面本体（`.settings-page`）已渲染 |
| `should load post list page` / SEO 文章元数据（E2E） | `waitForLoadState` / `page.goto` 30s 超时 | 并发资源争抢：单 worker 复跑通过；与浮层改动无交集 |

### 未覆盖边界

- `DropdownMenuTrigger` / `PopoverTrigger` 的 `as-child` 内嵌 `AppTooltip` 时，内层 tooltip 的 `data-state` 会覆盖外层菜单状态（`aria-expanded` / `aria-haspopup` / 事件均正常；浏览器实测菜单可开、可 Esc 关闭、焦点回填）。当前唯一消费方是下拉触发器的 `[data-state='open']` 底色规则，该规则在迁移前也不作用于 PrimeVue `Button` 子节点，故无观感回退；已登记为已知偏差。
- 三层视觉回归的静态截图不含 hover 态；tooltip 的 `side` 方位由桥接层单测 + 浏览器抽查（语言切换器 `bottom`）覆盖，`left` 方位未做浏览器抽查。
- 全量 E2E 的三浏览器矩阵仅跑了 critical 子集，覆盖面以 chromium 全量 + critical 跨浏览器为准。

<!-- regression-window:end:overlay-family-migration:第六十九阶段条目 2 浮层族整迁:2026-11-02 -->
