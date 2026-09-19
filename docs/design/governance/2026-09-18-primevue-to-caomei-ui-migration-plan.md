# 2026-09-18 PrimeVue → caomei-ui UI 组件库迁移方案（评估阶段）

- 日期：2026-09-18
- 性质：**迁移评估与执行方案**。本文档为文档产物，**不含任何代码改动**；迁移尚未开工。
- 事实源边界：库侧能力面、映射表、有意差异与验收判定口径以 caomei-ui 仓库的治理文档为**唯一事实源**（见 §13）；本文档只承载 momei 侧现状基线、批次编排、momei 侧执行动作与开工前置条件，不重复库侧明细。
- 回链主文档：[UI 设计](../ui.md)（组件库章节在迁移收尾前仍描述 PrimeVue，迁移执行时同步）。
- 上游动因：[2026-08 PrimeVue 5 许可证变更专项评估](./2026-08-29-primevue-5-license-change-evaluation.md)。
- 跟踪载体：[backlog.md](../../plan/backlog.md) 长期主线第 11 条。

## 1. 背景与迁移动因

PrimeVue 5 起并入 **PrimeUI 商业许可**、不再作为开源软件发布，与 momei「MIT + 用户自部署」模型结构性冲突。既有专项评估已判定 Dependabot PR #688 为 No-Go，并将 `primevue` / `@primevue/*` / `@primeuix/*` 长期屏蔽在 4.x。

随后果是：**锁定的 PrimeVue 4.5.5 成为终点依赖**——MIT 授权本身永久有效，但官方未承诺 v4 的长期安全维护窗口，功能与安全更新预期停止。为规避 PrimeUI 商业许可风险并恢复组件库的许可证稳定性，需要迁移到许可证可控、可持续维护的组件库。

选择 **caomei-ui** 的依据：

1. 自研、MIT 许可、许可证风险可由项目自行控制，不会重复踩到同类「许可证转向」。
2. 技术栈一致：Vue 3 + Reka UI + TypeScript，与 momei 的 Nuxt 4 / Vue 3 兼容。
3. 已具备迁移基础设施：Nuxt 模块、自动导入 resolver、样式与主题预设（含 `momei` 预设）、`CaomeiConfigProvider` i18n 注入。
4. 库侧已按 momei 实际用法做过覆盖度核对与能力面补齐（见 §13 的可行性评估与使用复核台账）。

> 迁移范围仅限**组件库与图标体系**。momei 未使用 Tailwind，不涉及 utility 框架迁移；`@primevue/forms` 依赖存在但零使用。

## 2. 评估结论

**结论：可行（有条件），建议按 C3「分批全量」推进；但当前不满足开工条件。**

- **能力面已无不可逾越的阻塞**：库侧对 momei 59 个 PrimeVue 组件的覆盖核对结果为「需新组件 11/11 已交付、需增强受检 24 项 = 完全交付 8 / 部分交付 16 / 完全未交付 0」；部分交付项的剩余缺口全部为「库侧可补的增强」或「一次性机械改写」，不存在「PrimeVue 有、caomei-ui 结构上做不到」的能力。
- **唯一结构性差距已消解**：DataTable 列级插槽（`#body` / `#header`）已由库侧以 `#cell-{key}` / `#header-{key}` 交付；momei 侧 `<Column>` 153 次无需改写为 render 函数。
- **当前阻塞**：caomei-ui B1 库侧补齐中，**M5「浮层与展示类」10 项尚未交付**（Dialog、Popover、DropdownMenu、ConfirmDialog、Toolbar、Image、ProgressSpinner、FileUpload）。交接计划将 B2 的前置设为 **B1 全量出口条件达成**，因此按已达成的一致顺序，**B2 / B3 / B4 的正式开工需等待 M5 交付并通过库侧出口条件**。
- **可先行项**：B0b 视觉基线采集不依赖 M5，且是 B2 的前置，可在 M5 交付期间先行。

三条先决条件（承自可行性评估，均在 momei 侧闭环）：

1. 库侧两张映射表（token / 图标）与并存隔离策略评审通过——已由 caomei-ui 交付。
2. 迁移前视觉基线采集完成且可复现（列表 / 表单 / 浮层各 1 页）。
3. 双库并存按路由 / 页面白名单隔离，禁止同一路由内混用两套组件。

## 3. 现状基线（momei 侧）

### 3.1 依赖与集成方式

| 项 | 现状（2026-09-18，HEAD `179f186f`） |
| :--- | :--- |
| PrimeVue 版本 | `primevue@^4.5.5`、`@primevue/nuxt-module@^4.5.5`、`@primeuix/themes@2.0.3`、`primeicons@^8.0.1` |
| 接入 | Nuxt 模块（`nuxt.config.ts` `modules`）；`definePreset(Aura, …)` 自定义 `MomeiPreset`（灰阶 primary + light/dark surface 映射） |
| 暗色模式 | `darkModeSelector: '.dark'` |
| CSS 层叠 | `cssLayer.order: 'primevue, momei-base, momei-overrides'` |
| locale | 模块 `locale: zh_CN` + `plugins/primevue-i18n.ts`（监听 Vue-i18n 切换 `primelocale`） |
| 显式导入 | 以 Nuxt 自动导入为主；显式 `from 'primevue/*'` 以 `useToast` / `useConfirm` 为主 |
| unstyled / pt | 无全局 unstyled；`pt` 仅 2 个文件 |
| Tailwind | 未使用、未安装——迁移不涉及 utility 框架 |
| 图标来源 | `primeicons` 字体 + `@mdi/font`（2 处）；无 lucide / iconify / heroicons / tabler 导入 |

### 3.2 用量与耦合面（迁移工作量驱动项）

统计口径见 §3.4；核心计数与 caomei-ui 资产文档 §1.3 / §1.4 的已裁定口径一致（token 1403 处 / 114 唯一；图标 629 处 / 145 文件 / 128 唯一），组件用量与库侧使用复核台账一致。

| 类别 | 计数 | 口径 / 说明 |
| :--- | ---: | :--- |
| PrimeVue 组件种类 | **59** | `.vue` 开标签识别 |
| 组件开标签用法 | **1515** | 分布于 148 个 `.vue`（应用 `.vue` 共 179 个，占比 83%） |
| 图标字符串 `pi pi-*` | **629 处 / 145 文件 / 128 唯一** | 图标体系整体改写；另含 `pi-spin` 旋转修饰类 |
| 主题 token `--p-*` | **1403 处**（`var()` 实际引用 **1323**）/ **114 唯一** / 134 文件 | Top 前缀：`--p-surface` 494、`--p-text` 381、`--p-primary` 259、`--p-content` 126 |
| PrimeVue 组件 class `p-*` | **190 处 / 47 文件** | Top：`p-button`、`p-error`、`p-datatable`、`p-dialog`、`p-invalid` |
| 含 PrimeVue 选择器的 SCSS/CSS | **20 文件** | `.p-*` 选择器 61 处；`:deep(` 119、`:global(` 47（打穿组件内部结构） |
| 列模板体系 | `<Column>` **153 / 20 文件**、`#body` **123**、`slotProps` **163** | 迁移的最大结构性改写面 |

Top 10 组件热点：Button 356、InputText 178、Column 153、Tag 127、Select 73、Message 51、ToggleSwitch 47、InputNumber 39、Dialog 37、Divider 37。

### 3.3 命令式 API、浮层锚点与测试耦合

| 类别 | 现状 | 迁移影响 |
| :--- | :--- | :--- |
| `useToast` | 33 个 `.vue`（含 composables / `.ts` 共 45 文件） | 机械映射到 caomei-ui `useToast` |
| `useConfirm` | 10 个 `.vue`（含 `.ts` 共 15 文件） | 回调式 `require()` → Promise 式 `confirm()` |
| `.toggle(event)` 锚点浮层 | 6 处 / 5 个生产 `.vue`（另有 1 处测试文件命中） | 依赖「以事件坐标为锚点」定位，需结构改写为声明式 trigger（或待库侧命令式入口） |
| `useDialog` / `$primevue` | 0 | 无影响 |
| vitest `vi.mock('primevue/*')` | 18 个测试文件 + `tests/testSetup.ts` | 需同步改写 |
| E2E `p-*` class 断言 | 23 处 / 3 文件 | 需同步改写 |

### 3.4 口径与可复现性

- 组件用量按「`.vue` 内开标签计数」，带 TS 泛型守卫；属性计数 quote-aware 并合并 `attr` 与 `:attr`。
- token 按 `--p-*` 字符串命中计数；图标按 `pi pi-[a-z0-9-]+` 命中计数。
- 计数会随源码演进失效；**迁移开工前必须按 caomei-ui 资产文档 §1.2 的命令在同一 commit 上重新取数**，不得直接沿用本文档数字作为验收基准。

## 4. 目标与非目标

**目标**

1. 将 momei 全部 UI 组件从 PrimeVue 迁移到 caomei-ui，卸载 `primevue` / `@primevue/*` / `@primeuix/*` / `primeicons`，消除 PrimeUI 商业许可风险。
2. 图标体系从 `primeicons` 字符串类名迁移到 `@lucide/vue` 组件（品牌图标另定落点）。
3. 主题与样式从 `--p-*` token 体系迁移到 `--caomei-*` 语义 token，并以视觉基线证明观感等价。
4. 迁移完成后恢复组件库的许可证稳定与可审计性（源码可用、可本地打补丁）。

**非目标**

1. 不做与迁移无关的 UI 改版、交互重设计或设计语言调整。
2. 不引入 Tailwind 或新的 utility 框架。
3. 不迁移 `@primevue/forms`（零使用，直接移除）。
4. 不在本次评估阶段改动任何代码；不重跑全量视觉基线（属执行阶段）。
5. 不处理其他下游仓库（caomei-auth / rss-impact-next 等）的迁移面，按 caomei-ui 既定顺序在 momei 闭环后评估。

## 5. 目标架构与接入方案

### 5.1 接入面

| 能力 | caomei-ui 落点 | momei 迁移动作 |
| :--- | :--- | :--- |
| 组件与 composables 自动导入 | `caomei-ui/nuxt` 模块（组件清单 77 项） | 以模块替换 `@primevue/nuxt-module` |
| 自动导入 resolver | `caomei-ui/resolver` | 如需精细化控制时接入 |
| 样式注入 | `caomei-ui/styles.css` | 接入样式与主题，承接原 PrimeVue preset / theme 的职责；移除 `primeicons/primeicons.css`（图标改组件，无字体 CSS） |
| 主题预设 | `caomei` / `momei` 预设（含暗色与 `auto`）；`theme.css` 支持 `.dark` / `[data-theme=dark]` / `prefers-color-scheme` | 以 `momei` 预设承接现有 `MomeiPreset` 的语义；`.dark` 选择器契约保持 |
| i18n 注入 | `CaomeiConfigProvider` + `provideLocale` / `useLocale`（内建 zh-CN / en-US / zh-TW / ja-JP / ko-KR） | 以 Provider 替换 `plugins/primevue-i18n.ts` 与模块 locale 配置 |
| 消费冒烟 | 库侧 `pnpm test:nuxt-smoke` | momei 侧以既有构建与测试入口等价验证 |

### 5.2 主题与 token 迁移

- 采用**语义映射**而非色阶等比平移：PrimeVue 色阶（`--p-surface-*` / `--p-primary-*` / 状态色阶）在 momei 中承担的是语义角色（页面底 / 抬升底 / 边框 / 次级文本 / 主色 / 状态色），归入 `--caomei-color-*` 语义 token。
- 派生档位（浅底、深档、半透明）统一用 `color-mix(in srgb, var(--caomei-color-*) X%, transparent)` 派生，不在 momei 侧硬编码新色值。
- 组件内部 token（`--p-select-*` / `--p-tabs-*` / `--p-panel-*` 等）不迁移，随迁移删除；确需覆盖时走 caomei-ui 组件级 CSS 变量钩子。
- 无对应语义者（紫色、等宽字体、`info`）保留为 momei 局部自定义变量，在样式层集中声明。
- `--p-surface-400` ~ `--p-surface-600`、`--p-surface-700` ~ `--p-surface-950` 在明暗两套主题下角色不同，**必须按消费点逐点确认语义**，不得按映射表直译。
- 全量 114 项对照表见 caomei-ui 资产文档 §2（唯一事实源）。
- 迁移执行时同步更新 [UI 设计](../ui.md) 的组件库与主题章节。

### 5.3 图标体系迁移

- `icon="pi pi-x"` 字符串 → `@lucide/vue` 组件，放入 `#icon` 插槽或直接作为组件使用。
- 128 个唯一图标逐项落点、语义改名项与填充变体处理见 caomei-ui 资产文档 §3。
- **11 项品牌图标**（github / google / twitter / linkedin / facebook / instagram / youtube / discord / twitch / tiktok / paypal）lucide 无对应，需在 B4 择一：`@iconify/vue` + Simple Icons、保留 `@mdi/font`、或自建 SVG 组件。
- `pi-spin` 旋转修饰类不是图标；旋转动效改由加载指示组件（`ProgressSpinner` 或 Button / AutoComplete 加载态）承载。

### 5.4 i18n 迁移

- 删除 `plugins/primevue-i18n.ts` 与 `nuxt.config.ts` 的 `primevue.options.locale`。
- 以 `CaomeiConfigProvider` + `useLocale` 接入内建文案；组件文案语言需与 i18n 保持一致时显式传入 locale。
- 迁移后需复核组件内建文案（表格空态、分页、日期面板等）在 5 个语言下的覆盖，避免出现英文回退。
- 相关测试 `tests/plugins/primevue-i18n.test.ts` 需同步删除或改写为 caomei-ui locale 验证。

### 5.5 双库并存隔离

- **隔离单位＝路由**：以路由前缀为最小切换单位，同一路由（含子路由）内组件来源必须唯一，禁止同路由内按组件混用。
- **白名单载体**：由 momei 侧维护（建议落在 `nuxt.config.ts` 运行时配置或独立迁移配置模块）；库侧不感知「并存期」状态、不提供运行时开关。
- **切换粒度**：某路由涉及的组件全部迁移完成并通过该批回归后，才从白名单移除；不做半路由切换。
- **阻断项**：任一路由同时出现两套组件，须在对应批次的「文件 → 改动点」清单中体现切换时点。

## 6. 组件映射方案

### 6.1 处置分组（59 个 PrimeVue 组件）

**A. 机械改写即可就绪（44 类）**——库侧已有对应组件，迁移动作以「标签替换 + 属性改名 + 图标插槽化」为主，属性级差异见 §6.2 与 caomei-ui 设计规范 §7：

InputText 178、Button 356、Column 153、Tag 127、Select 73、Message 51、ToggleSwitch 47、InputNumber 39、Divider 37、Card 33、Password 32、Textarea 31、Skeleton 26、Tab 23、TabPanel 23、DataTable 22、Checkbox 20、RadioButton 12、SelectButton 9、Toast 9、ProgressBar 8、MultiSelect 8、Tabs 6、TabList 6、AccordionPanel 6、InputGroup 6、DatePicker 6、Step 6、StepPanel 6、Badge 5、Slider 3、Paginator 3、Drawer 3、Avatar 3、Accordion 3、SplitButton 2、ColorPicker 2、AutoComplete 2、ButtonGroup 1、DataView 1、ToggleButton 1、Stepper 1、StepList 1、StepPanels 1。

其中以下为**已交付的库侧能力**（M3 / M4 / M6，以及 11 项新组件，可直接按现行 API 迁移）：

- DataTable 列插槽 `#cell-{key}` / `#header-{key}` + `rowsPerPageOptions` / `update:rows`（M3 / M4-8）。
- MultiSelect `#option` / `showClear`；Button `badge` / `badgeTone`；Checkbox 数组模型 + `CaomeiCheckboxGroup`；Switch `change`；ToggleButton `onLabel` / `offLabel`；Paginator `rowsPerPageOptions`。
- InputNumber `useGrouping` / 小数位；Message `variant`；Tag `variant` / `rounded`；Textarea `autoResize`；Password `feedback`；Select / MultiSelect 对象选项映射与数值 value。
- DataTable `frozen` / `selectionMode` / `lazy` / 排序；DatePicker `showTime` / `hourFormat` / `showSeconds` / `dateFormat` / `showIcon`；Drawer / DataView / SplitButton / ColorPicker / AutoComplete / Divider / Stepper / InputGroup。

**B. 待库侧 M5 交付（B4 前置，8 类 / 10 项）**：

| PrimeVue 组件 | 用量 / 文件 | 待交付能力（库侧 M5） |
| :--- | :--- | :--- |
| Dialog | 37 / 32 | `showHeader`、`breakpoints`、`@hide`、`title` 可选化（M5-1 / M5-2） |
| ConfirmDialog | 6 / 6 | `useConfirm` 的 `icon`（M5-3） |
| Popover | 5 / 4 | 命令式入口，或声明式等价迁移写法（M5-4） |
| DropdownMenu（Menu） | 3 / 2 | `:model` 数据驱动项模型、`:popup`、`toggle(event)` 锚点定位（M5-5 / M5-6） |
| Toolbar | 1 / 1 | `#start` / `#center` / `#end` 分区插槽（M5-7） |
| Image | 11 / 10 | `preview` 点击放大与遮罩（M5-8） |
| ProgressSpinner | 14 / 13 | `strokeWidth` prop（M5-9） |
| FileUpload | 1 / 1 | `mode` / `maxFileSize` / `auto` / `chooseLabel` 与上传事件（M5-10） |

**C. 由其他组件承接 / 别名（7 类）**：

- Panel（3）→ `CaomeiCard` 的 `title` prop / `#title` / `#header` / `#extra` / `#footer`；可折叠场景改 `CaomeiAccordion`。
- IconField / InputIcon（10 / 10）→ `CaomeiInput` 的 `#prefix` / `#suffix` 插槽。
- TabPanels（6）→ 普通容器；AccordionHeader（6）/ AccordionContent（6）→ `CaomeiAccordionItem` 内建。
- Dropdown（5）→ `CaomeiSelect`（旧名）；DropdownMenu 的 `Menu` 落点见 B 组。

**D. 库侧未实现但 momei 零用量（无需处理）**：

`Drawer position="full"` 与生命周期事件、`DatePicker selection-mode`（范围选择）与手工键入、`DataView` 分页 / 排序、`SplitButton` 子菜单与 `url` / `target`、`MultiSelect #option` 的 `index`、`Menu` 的 `items` 子菜单等。

**E. 库侧未实现且 momei 有少量用量（迁移时按迁移写法自行补足）**：

- Paginator `template` / `CurrentPageReport`（1 处）→ 在分页器旁按 `page` / `itemsPerPage` / `total` 自行渲染。

### 6.2 属性级映射规则

| 维度 | PrimeVue | caomei-ui | 说明 |
| :--- | :--- | :--- | :--- |
| 语义色 | `severity` | `tone` + `variant` | `primary→primary`、`success→success`、`warn→warning`、`error/danger→danger`、`secondary/contrast→neutral`、`info→primary`；`secondary` / `contrast` / `info` 为**有损近似** |
| 尺寸 | `small` / `large` | `sm` / `lg` | |
| 按钮形态 | `text` / `outlined` / `rounded` | `variant="ghost"` / `variant="secondary"`（Button）/ `variant="outline"`（Tag、Message）/ `rounded` | |
| 图标 | `icon="pi pi-x"` 字符串 | `#icon` 插槽 + `@lucide/vue` | 全量改写 |
| 受控字段 | `v-model:visible` / `v-model:value` / `v-model:first` | `v-model:open` / `v-model` / `v-model:page` | Paginator 由 0 基偏移切为 1 基页码 |
| 浮层标题 | `header` | `title`（当前必填；可选化由库侧 M5-1 承接） | |
| 校验态 | `class="p-invalid"` | `:invalid` | |
| 全宽 | `fluid` | 默认 `width: 100%` | **删除 `fluid`**；选择器家族另带 `20rem` 上限，需真正全宽时覆盖对应 `*-max-width` token |
| 可访问名 | `aria-label` / `input-id` | `label` / `id` | 本库 `label` 统一为不可见可访问名 |
| 确认弹窗 | `useConfirm().require({...})` 回调 | `confirm()` Promise | |
| 提示条 | `severity` / `summary` / `detail` / `life` | `tone` / `title` / `description` / `duration` | |

> 逐组件、逐 prop 的完整映射与已知行为差异，以 caomei-ui 设计规范 §7 为唯一事实源；本文档只保留迁移执行所需的总则。

### 6.3 有意差异

迁移**接受** 16 条有意差异（影响面最大的三条：`Select filter → AutoComplete` 2 处、`Tag severity → tone` 125 处、`Dialog title` 必填）。逐条差异、momei 侧核对动作与判定口径见 caomei-ui 交接计划 §6，本方案不重复。

## 7. 分批执行计划

批次划分、执行主体与出口条件以 caomei-ui 交接计划 §2 / §4 / §5 为唯一事实源；本文档只写 momei 侧的批次内容、产出物与依赖。

| 批次 | momei 侧内容 | momei 侧产出物 | 依赖 |
| :--- | :--- | :--- | :--- |
| **B0b 视觉基线** | 采集列表页 / 表单（设置）页 / 浮层各 1 页：迁移前截图、关键元素计算样式快照、环境元数据（浏览器与版本、视口、主题与明暗、locale、`@layer`） | 基线采集脚本 / 命令、环境、两仓 commit、快照日期齐全的可复现记录 | 库侧 B0a 映射表评审通过；**不依赖 M5** |
| **B2 数据类页面** | 20 个 `<Column>` 文件迁移：`pages/admin/posts`、`users`、`friend-links`、`comments`、`submissions`、`subscribers`、`waitlist`、`external-links`、`ad/campaigns`、`ad/placements`、`migrations/link-governance`、`components/admin/admin-taxonomy-page.vue`、`components/admin/ai/task-list.vue`、`components/admin/marketing-campaign-list.vue`、`components/admin/settings/{admin-notification-settings,agreements-settings,notification-delivery-log-list,setting-audit-log-list}.vue`、`components/settings/{notification-history-list,settings-api-keys}.vue` | 逐页功能回归（排序 / 分页 / 选择 / 列插槽）+ 「文件 → 改动点」清单 | B1 全量出口条件达成 + 视觉基线可复现 |
| **B3 表单与设置页面** | `components/admin/settings/*`、`components/installation/*`、auth / submit / register 等表单页；`useToast` / `useConfirm` 映射 | 表单交互回归（校验 / 提交 / 提示）+ 「文件 → 改动点」清单 | B2 |
| **B4 展示、浮层与收尾** | 展示类组件、浮层（Dialog / Drawer / Popover / DropdownMenu）、`.toggle(event)` 结构改写、图标全量替换、i18n 插件替换、测试与 E2E 改写、品牌图标落点选定、卸载 `primevue` / `@primevue/*` / `@primeuix/*` / `primeicons` | 全量测试与 E2E 通过 + 包体对比记录 + 「文件 → 改动点」清单 + PrimeVue 相关产物归零 | B3；**Dialog / Popover / DropdownMenu / ConfirmDialog / Toolbar / Image / ProgressSpinner / FileUpload 依赖库侧 M5** |

**开工顺序**（承自交接计划 §4）：库侧 B0a 资产 → 库侧 B1 补齐（M3 → M4 → M5）→ 视觉基线采集（B0b，可与 M5 并行）→ B2 → B3 → B4。

## 8. 验收与质量门

### 8.1 质量门

每批合并前必须满足仓库既有门禁，不因迁移降低标准：

- `pnpm lint` 零 error、`pnpm lint:css`、`pnpm lint:md` 通过。
- `pnpm typecheck` 零 error。
- 受影响范围的定向单元测试通过；批次收尾跑 `pnpm test`。
- `pnpm build` 无报错；B4 收尾对生产产物做等价冒烟。
- 每批改动进入 A 阶段 Review Gate（`@code-auditor`）；涉及界面 / 样式时另经 `@ui-validator` 浏览器验证。

### 8.2 视觉基线

- 采集对象：列表页 1 个（优先管理端主路径）、表单 / 设置页 1 个、浮层 1 个。
- 判定口径：以 B0b 基线为准逐项归因；属于 16 条有意差异的按 §6.3 核对，**不属于差异清单的视觉变化不得静默出现**。
- 采集与判定方法由 caomei-ui 交接计划 §7 定义。

### 8.3 回归

- 承载者：momei 既有 [Weekly Regression](../../../.github/workflows/regression-weekly.yml)（`pnpm run regression:weekly` + typecheck + build + lint:css / lint:md + 包体预算 + 覆盖率）。
- 强度：不要求每批跑全量 E2E；**每批合并后至少经过一次每周回归且无新增失败**，新增失败逐条归因处理后才进入下一批。
- 跨仓自动化（「caomei-ui 变更即验证 momei」）不在本方案范围，需另行授权。

### 8.4 包体对比

- 对比点：B0b 基线（PrimeVue 在产物内）↔ B4 收尾（PrimeVue 卸载后）。
- 记录项：构建命令与两仓 commit；产物总量与 gzip / brotli 体积；按 chunk 体积；PrimeVue 与 primeicons 相关 chunk 是否归零；快照日期。
- 判定口径：记录含命令 + commit + 日期即视为可复现；PrimeVue 与 primeicons 相关 chunk 归零；总量与主 chunk 体积变化有数值。阈值由 momei 既有包体预算（`test:perf:budget` / `.github/perf/bundle-baseline.json`）承担，本方案不预设新阈值。

### 8.5 逐批清单

B2 / B3 / B4 各产出一份「文件 → 改动点 → 依据指针（差异编号 / 映射表条目 / 库侧能力项）」清单并留存；清单文件数须与该批统计口径一致，不保留无依据行。

## 9. 风险登记与缓解

| # | 风险 | 影响 | 缓解 |
| :-: | :--- | :--- | :--- |
| 1 | **样式 / 主题耦合是最大盲区**：1403 处 `--p-*` + 20 个含 PrimeVue 选择器的 SCSS 文件 + 119 处 `:deep()`，momei 已把 Aura 调成自己的设计语言 | 无法靠计数判断完成度，易出现观感回退 | token 对照表 + 计算样式 / 截图基线逐项闭环；按消费点核对多义色阶；B4 前保持"不属于差异清单的变化不得静默出现" |
| 2 | **B4 依赖库侧 M5 未交付** | 浮层 / 展示类 8 个组件无法按现行 API 迁移 | 待 M5 出口条件达成；B0b / B2 / B3 先行；M5 交付前不启动 B4 |
| 3 | **双库并存期**：两套 token 与组件样式同时进产物，组件同名不同源 | 包体膨胀、主题互相覆盖、同路由混用风险 | 按路由白名单隔离、整路由迁移完成才切换；包体监控；白名单状态可从单点配置读出 |
| 4 | **命令式 API 与锚点定位**：6 处 `.toggle(event)` 依赖事件坐标定位 | 需结构改写，可能引发浮层定位回归 | 优先等库侧 M5-4 / M5-6 结论；逐处 UI 复核；改写点登记到 B4 清单 |
| 5 | **SSR / hydration 稳定性**：两侧组件均用 portal / teleport，momei 为 Nuxt 4 SSR | hydration 不匹配或样式闪烁 | 迁移后对受影响路由做 SSR + hydration 复核；E2E 覆盖关键路径 |
| 6 | **测试与 E2E 耦合**：18 个 vitest mock 文件 + 3 个 E2E 文件的 `p-*` 断言 | 迁移期间测试大面积失败，掩盖真实回归 | 与迁移同批改写 mock 与断言；按批次定向跑，收尾全量 |
| 7 | **行为差异未预期**：`Switch change` 载荷由原生事件改为布尔值、`Password feedback` 默认关闭、`InputNumber useGrouping` 默认开启、`Select filter` 改组件等 | 用户可感知的行为变化 | 16 条差异逐条核对；变更点显式记录；必要处显式传参保持原行为 |
| 8 | **品牌图标无直接对应** | 11 项品牌图标需额外方案 | B4 择一并登记；候选见 §5.3 |
| 9 | **PrimeVue 4 期间的安全窗口**：迁移完成前仍依赖终点版本 | 迁移周期内无安全更新 | 缩短迁移周期；迁移未完成期关注 dependabot / audit 告警，必要时局部打补丁 |

## 10. 工作量画像与排期建议

- 迁移面：**1515 个组件开标签 / 148 个 `.vue`**（占应用页面 83%）；图标 629 处 / 145 文件；token 1403 处；命令式 API 43 个 `.vue`；测试耦合 21 个文件。
- 批次容量建议：B2 以 20 个列表页为一批（可按管理端主路径再拆 2-3 个子批）；B3 以设置 / 安装 / auth 分组推进；B4 因涉及全量图标、浮层与卸载，体量最大，建议单独成阶段。
- **排期约束（重要）**：当前 momei 处于阶段归档后的「下一阶段筹备中」，且行内规则要求新需求先入 `backlog.md`，不得在 `roadmap.md` 直接开启下一阶段正式规划。因此本方案的排期落地路径为：
  1. 本评估文档落盘并登记 backlog 长期主线第 11 条；
  2. caomei-ui M5 交付后，在阶段准入评估中把迁移按 B0b / B2 / B3 / B4 切片上收为正式阶段主线；
  3. 每个批次走完整 PDTFC+ 与 Review Gate。

## 11. 前置条件与开工检查清单

1. caomei-ui B1 全量出口条件达成（M3 / M4 已交付；**M5 待交付**），且交接计划 §5 的 B1 出口条件（补齐项带单测与文档、DataTable 列插槽有中英迁移示例、库侧 `pnpm verify` 通过）已满足。
2. B0a 两张映射表与并存隔离策略评审通过、可复现（已交付，开工前复核一致性）。
3. B0b 视觉基线采集完成且与迁移前现场一致。
4. momei 工作区干净、与远端同步（快照期遗留的未提交 `AGENTS.md` 已不存在，当前工作区干净）。
5. 开工前按 §3.4 在目标 commit 上重新取数，更新本文档基线数字。
6. 明确双库并存白名单的载体与初始范围，并登记阻断规则（同路由混用为阻断项）。
7. 品牌图标落点方案、`useToast` / `useConfirm` 映射写法在 B3 / B4 开工前定稿。

## 12. 未决问题

1. **B2 是否可在 M5 交付前启动**：交接计划将 B2 前置设为「B1 全量出口条件达成」，但 B2 仅依赖 M3（DataTable），M4 / M5 与其无直接耦合。是否与库侧协商把 B2 前置放宽为「M3 出口条件达成」，需用户决策，本方案不单方面变更既定顺序。
2. **品牌图标方案**：`@iconify/vue` + Simple Icons / 保留 `@mdi/font` / 自建 SVG 三选一，待 B4 决策。
3. **Popover / DropdownMenu 命令式入口**：库侧 M5-4 为「补命令式入口或给迁移写法指引」二选一，momei 侧改写量取决于该结论。
4. **排期窗口**：迁移作为阶段主线上收的时机，取决于 caomei-ui M5 交付节奏与 momei 下一阶段容量。
5. **PrimeVue 4 的最终安全窗口**：迁移完成前若出现 4.x 安全告警，需要局部打补丁还是加速迁移，待实际发生时的风险处置。

## 13. 相关文档

**momei 侧**

- [2026-08 PrimeVue 5 许可证变更专项评估](./2026-08-29-primevue-5-license-change-evaluation.md)（迁移动因与屏蔽策略）
- [backlog.md](../../plan/backlog.md) 长期主线第 11 条「UI 组件库许可证风险与迁移可行性治理」（跟踪载体）
- [UI 设计](../ui.md)（迁移收尾时同步组件库与主题章节）
- [项目规划规范](../../standards/planning.md)、[测试规范](../../standards/testing.md)、[文档规范](../../standards/documentation.md)
- [Weekly Regression](../../../.github/workflows/regression-weekly.yml)（回归承载者）

**caomei-ui 侧（唯一事实源）**

- [momei 迁移计划与验收标准（交接文档）](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-17-momei-migration-handover-plan.md)（批次划分、出口条件、16 条差异、基线 / 回归 / 包体判定口径）
- [momei 迁移可行性评估记录](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-17-momei-migration-feasibility.md)（能力覆盖、风险与反面验证）
- [momei 迁移 B0a 库侧资产](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-17-momei-migration-assets.md)（token 对照表、图标映射表、并存策略与包体口径）
- [momei 组件使用复核台账](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-14-momei-usage-audit.md)（逐组件判定与迁移映射规范）
- [caomei-ui 设计规范 §7 迁移映射](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/design-spec.md)（逐组件 prop 级现行映射）
