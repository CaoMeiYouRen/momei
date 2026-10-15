# 回归历史归档：2026-10-13 第六十八阶段早期窗口（条目 2 首路由 / 第二路由 + 试点页分页修复）

本文档收录 2026-10-13 的 3 个第六十八阶段窗口，于 2026-10-15 自
`docs/reports/regression/current.md` 滚动迁出（第四次之后的又一次滚动归档），为第六十八阶段条目 2 的
持续迁移窗口恢复 `docs:check:line-count` 余量（迁出前 `current.md` 为 645 行，距 error 700 仅余 55 行，
不足以再写入一条路由迁移窗口）。

迁出方式：整体迁移（marker + 标题 + 正文 + end 成对保留），正文逐字未改。
迁出范围：`phase68-b2-submissions`（条目 2 首路由）、`phase68-b2-external-links`（第二路由）、
`phase68-fix-comments-pagination`（试点页分页对齐回归修复）。
引用检查：三条窗口均**未被** `docs/plan/**` / `docs/design/**` / `.github/**` 以节名锚点引用
（仅 `backlog.md` 以窗口 id 自指，已同步更新），故本次归档无需改写外部引用。

<!-- regression-window:start:phase68-b2-submissions:第六十八阶段-条目2-首路由:2026-10-13 -->
## 2026-10-13 第六十八阶段 条目 2 首路由 B2 迁移（`/admin/submissions`）

### 范围

条目 2（B2 剩余数据页迁移一，10 个 `pages/admin` 数据列表路由）的首个路由 `/admin/submissions` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。选它作为首个执行项（用户 2026-10-13 裁定「先做最小路由验证口径」）：388 行 / 19 处在册族开口标签（8 个组件名）/ 5 个 `<Column>`，且不依赖任何待新增的共享壳过渡组件——用于先把「每路由例行改写范式」固定下来，其余 9 个路由按难度递增推进。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/submissions/index.vue` | `IconField`+`InputIcon`+`InputText` → `CaomeiInput`（`#prefix` + lucide `Search`）；`Select`×3 → `CaomeiSelect`（`@change`→`@update:model-value`）；`DataTable`+5×`Column` → `CaomeiDataTable` + `columns` 数组（`#body`→`#cell-{key}`）；`Tag severity`→`tone`；行内图标 `Button` → `CaomeiButton icon-only` + lucide `#icon`；样式 `--p-*`→`--caomei-*` | 迁移方案 §6.1 / §6.2 / §6.3 / §5.3 |
| 同上 | 浮层内**在册族**组件（审核弹窗 `Button`×5、`Select`×2）随路由迁移；`Dialog`/`Divider`/`Textarea`/`Checkbox`/`Toast`/`ConfirmDeleteDialog`/`v-tooltip` 维持 PrimeVue | §5.5（豁免只覆盖浮层**自身**；其内部在册族仍须迁移，否则命中零残留守卫） |
| 同上 | `getSubmissionStatusTone`：`PENDING` 由 PrimeVue `info` 取 `warning`——**偏离** §6.2 的属性级映射（`info → primary`），属本批**新增登记**的有意差异（`primary` 为品牌主色，用于「待审核」状态辨识度不足）；`ACCEPTED → success` / `REJECTED → danger` 与 §6.2 一致 | §6.3 有意差异（本批新增条目） |
| 同上 | 行内动作按钮改用 0.6.0 `iconOnly`（**不再复制** M4 的 `--caomei-button-padding-x: 0` 补丁） | §3.8 / §5.5（0.4.0 缺口闭合） |
| 同上 | 分页容器对齐使用 0.4.0 新增的 `--caomei-data-table-pagination-justify: center`，保持 PrimeVue 原居中口径 | §3.8 |
| 同上 | 删除无引用的 `admin-submissions__col--*` 死类（原 `<Column class>` 无对应样式规则） | 可删除代码收敛 |
| `composables/use-admin-list.ts` | 新增 `pageIndexBase?: 0 \| 1`（默认 `0` 保持既有行为；本页传 `1`）——caomei `@page` 为 1 基（`pageIndex + 1`），PrimeVue 为 0 基，原 `onPage` 恒 `+1` 会二次抬升页码 | 跨组件库事件语义差异（本批新增的跨路由共性项） |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/submissions` | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵中 `/admin/submissions` 就绪选择器 `.p-datatable` → `.caomei-data-table` | 层 ② 改写 |
| `tests/visual/admin-submissions-list.visual.test.ts` + 2 张基线 | 新增浅 / 深基线（**迁移前采集 → 逐项归因 → 按迁移后状态更新**） | §8.2 层 ③ |
| `pages/admin/submissions/index.test.ts` | stub 由 PrimeVue 组件栈换成 caomei 组件栈（保留页头 / 表格 / 筛选 / Toast 四项既有覆盖），并补齐列定义与 `#cell-{key}` 插槽、Tag tone 映射、动作集合、1 基分页转发、筛选映射（含 `null` 往返）契约 | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：迁移前基线以 `git stash push -- pages/admin/submissions/index.vue`（仅回退该页）在既有 HEAD 下构建采集；迁移后用同环境（chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画）截图。因本批执行环境**无视觉模型**，归因采用「纯标准库 PNG 逐像素 + 行带分布」做区域定位（容差 24/通道），再按组件语义对照；`toHaveScreenshot` 阈值（`maxDiffPixels 200`）不参与该对照，故对照差异量级高于阈值属预期。

- 差异总量：浅色 **7,222 px（Playwright 口径）/ 10,256 px（区域分析口径 0.79%）**；深色 **9,849 / 12,814 px（0.99%）**；包围盒 `x[56,1383] y[164,460]` —— **仅卡片区域**，页头 / 侧栏 / 页脚零差异。
- 过程中收敛掉两处**本批自行引入的非必要几何改动**（列显式 `width`、actions 列 `align: 'right'`）——迁移不应顺带改变列宽与对齐；收敛后浅色差异由 11,196 px 降至 10,256 px。

| 区域 | 迁移前 | 迁移后 | 归因 |
| :--- | :--- | :--- | :--- |
| 筛选行 y[160,200) | PrimeVue `IconField`+`InputIcon`+`InputText` + `Select` | `CaomeiInput`(`#prefix`) + `CaomeiSelect` | **组件替换**（字段外壳 / 触发器 / 聚焦态由 caomei 字段外壳层提供；0.4.0 起统一到基础层 `field-shell.css`） |
| 表头 / 表体 y[200,360) | PrimeVue `DataTable` 表头与网格 | caomei `DataTable` 表头与网格 | **组件替换**（表头底色 / 边框 / 字体；§6.3 有意差异范围内，与 M4 同口径） |
| 空态 y[320,360) | PrimeVue 内建空态文案 | `#empty` 插槽 + `common.no_data` | **有意**（与试点页同口径：空态容器由页面提供） |
| 分页器 y[420,460) | PrimeVue 分页器（居中） | caomei 分页器（居中，经 `pagination-justify` token 对齐） | **组件替换**（分页器自身样式差异约 1.0k px；对齐已保持——残留量级与 M4 记录的对齐错位不符） |

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run tests/modules/ pages/admin/submissions/index.test.ts` = **6 文件 / 35 用例通过**（本页 12 条 = 既有 4 项覆盖 + 新增 8 条）；本页断言覆盖列定义（status / contributor / title / createdAt / actions）与 `#cell-{key}` 插槽按 row 渲染、Tag tone 四态（pending / accepted / rejected / 默认）映射、pending 与非 pending 的动作集合差异、1 基分页事件原样转发、关键词与状态筛选模型映射（`null` 往返）及 `useAdminList` 收到 `pageIndexBase: 1`；扩面后的路由迁移守卫（在册族零残留 + 至少一个 caomei 组件）已覆盖 `/admin/submissions`。`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：`tests/e2e/admin.e2e.test.ts` 的 `should load extended admin management pages`（7 路由矩阵，含 `/admin/submissions`，就绪选择器已改用 `.caomei-data-table`）在**全量并行套件**下两次 30s 超时；按 M4 口径**隔离复跑**（chromium 单 worker、仅该用例）**1 passed / 11.2s**。同轮全量套件另有 webkit `user-workflow` 公开页失败与 `mobile-safari-critical` 失败、chromium `auth-session-governance` 1.5m 超时（后经重跑记为 flaky）。
- **层 ② 验收 spec 的 flaky 定性（本批新增 HEAD 对照证据）**：`pnpm test:e2e:review-gate`（`auth-session-governance.e2e.test.ts`，chromium / firefox / webkit）**12 failed / 6 passed**，与本批改动面（`/admin/submissions` 与 `useAdminList` 分页路径）无交集。按 M4 口径做 **HEAD 对照复现**：`git stash push`（回退全部已跟踪改动）后以同环境跑 chromium 单浏览器同一 spec → **1 failed / 1 flaky / 4 passed**，与迁移后同形。判定：**该 spec 在 master 自身即失败 / flaky（既有问题，非本批回归）**；本批不扩修该 spec（C 类），登记为已知既有 flaky，并把「`auth-session-governance` 在 master 上的稳定失败」作为**阶段内遗留项**另行处理。本路由未做行级 E2E 补强。
- **层 ③（截图识别）**：迁移前基线对照见上；归因完成后已按迁移后状态刷新基线，`pnpm test:visual` **12/12 通过**（新增浅 / 深 2 张 + 既有 10 张，既有页面逐像素零差异——本批未污染其他基线）。

### 未覆盖边界 / 观察项

- TEST_MODE 未播种稿件数据，截图基线为**空态**渲染，故截图层不覆盖行级渲染；行级结构（列定义与列插槽 / Tag tone / 动作集合 / 1 基分页转发 / 筛选映射）已由本页单元层用例逐项断言（见「验证结果」层 ①），本路由未新增行级 E2E。**截图基线 provenance**：迁移前 actual / diff 产物未入库，仓库仅存迁移后快照（浅 / 深 2 张），如需以「迁移前基线」作为判定依据应由 CI 复采。
- 审核弹窗为浮层（PrimeVue 豁免），其内部 caomei `Select` 的浮层层级与 PrimeVue `Dialog` 共存未做截图覆盖（无自动化用例），登记为观察项；异常时按 caomei 0.5.0「模态内浮层面板层级 / z-index 覆盖钩子」复核。
- 分页 `pagination-justify` token 的实际效果未做单页对照实验（仅由差异量级间接判定）；后续路由若要精确还原对齐，应先做对照再定论。
- 本批次写入前已按 [index.md](./index.md) §3.1 完成**滚动归档**（第四十二 ~ 第四十九阶段窗口迁入 [archive/2026-06-04-to-2026-06-13.md](./archive/2026-06-04-to-2026-06-13.md)，`current.md` 由 676 → 448 行）；`index.md` §3.1（300-400 行）与 `docs:check:line-count`（500/700）两套阈值仍不一致，待治理。
- 其余 9 个路由（含 `AppAvatarV2` / `AppUploaderV2` / `PostAuditBadge` 过渡件）仍待办。

<!-- regression-window:end:phase68-b2-submissions:第六十八阶段-条目2-首路由:2026-10-13 -->

<!-- regression-window:start:phase68-b2-external-links:第六十八阶段-条目2-第二路由:2026-10-13 -->
## 2026-10-13 第六十八阶段 条目 2 第二路由 B2 迁移（`/admin/external-links`）

### 范围

条目 2（B2 剩余数据页迁移一）的第二个路由 `/admin/external-links` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 455 行 / 6 个 PrimeVue 列组件 / 18 处在册族开口标签（6 个组件名），是**客户端分页**列表（迁移前 PrimeVue 表格即消费整份 `value`、不接服务端分页），与首路由 `/admin/submissions`（服务端分页 + `useAdminList`）不同：本页不引入 `pageIndexBase` 契约，分页完全委托 caomei `DataTable` 自持的 1 基内部态。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/external-links/index.vue` | PrimeVue `DataTable` + 6 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`）；`Tag severity` → `tone`；页头与行内 PrimeVue 按钮 → `CaomeiButton`（行内图标按钮用 0.6.0 `iconOnly` + lucide `#icon`，不再复制 M4 的 padding 补丁）；跳转页 PrimeVue 勾选 / 叉号图标 → lucide `Check` / `X`（保留 `text-success` / `text-secondary` 色类） | §6.1 / §6.2 / §6.3 / §5.3 |
| 同上 | 浮层内**在册族**组件随路由迁移：编辑弹窗 `InputText`×2 → `CaomeiInput`、`Dropdown` → `CaomeiSelect`、弹窗页脚与页头 `Button` → `CaomeiButton`；`Dialog` / `Checkbox` / `ConfirmDialog` / `useConfirm` / `v-tooltip` 维持 PrimeVue | §5.5（豁免只覆盖浮层**自身**；其内部在册族仍须迁移，否则命中零残留守卫） |
| 同上 | `p-invalid` 类 → `:invalid` 布尔（`CaomeiInput` / `CaomeiSelect` 的校验态入口） | §6.2 校验态 |
| 同上 | 客户端分页委托：`DataTable` 不传 `page` / `lazy` / `total-records`、不监听 `@page`，页码由 caomei 1 基内部态自持——本页不存在 PrimeVue（0 基）与 caomei（1 基）之间的换算，故无需 `pageIndexBase` | 跨组件库事件语义（本页与首路由的差异项） |
| 同上 | 分页容器水平对齐用 `--caomei-data-table-pagination-justify: center` 保持 PrimeVue 原居中口径 | §3.8 / §6.2 |
| 同上 | 动作列沿用迁移前声明的 `text-right` + `min-width: 8rem`（PrimeVue 的 `class` / `style` 同时落在表头与表体单元格），以 `align: 'right'` + `headerStyle` / `bodyStyle` 的 `minWidth: 8rem` 等价还原；其余列不新增显式宽度 | 迁移不改几何 |
| 同上 | 删除迁移后无意义的 PrimeVue 表格尺寸类 `p-datatable-sm`（caomei `DataTable` 无对应压缩档，保留只会成为死类） | 可删除代码收敛 |
| 同上 | `getExternalLinkStatusSeverity` → `getExternalLinkStatusTone`：`success` / `danger` / `warning` 直通，PrimeVue `secondary` 取有损近似 `neutral` | §6.2 / §6.3 有意差异 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/external-links` | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵中 `/admin/external-links` 就绪选择器 `.p-datatable` → `.caomei-data-table` | 层 ② 改写 |
| `tests/visual/admin-external-links-list.visual.test.ts` + 2 张基线 | 新增浅 / 深基线（**迁移前采集 → 逐项归因 → 按迁移后状态更新**） | §8.2 层 ③ |
| `pages/admin/external-links/index.test.ts` | 新增页面单测 13 条：列定义、6 个 `#cell-{key}` 插槽按 row 渲染、Tag tone 四态、跳转页图标分支、动作集合、`iconOnly` 形态、客户端分页委托（无 `page` / `lazy` / 无服务端请求）、弹窗字段映射与 `:invalid` 校验、删除确认、统计弹窗 | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：迁移前基线以 `git stash push -- pages/admin/external-links/index.vue`（仅回退该页）在同一工作树（`lib/ui-library.ts` 已登记本路由，故页头语言切换器在两态均为 caomei 版）下构建采集；迁移后用同环境（chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画）截图。因本批执行环境**无视觉模型**，归因采用「纯标准库 PNG 逐像素 + 行带 / 列带分布」做区域定位（容差 24/通道），再按组件语义对照；`toHaveScreenshot` 阈值（`maxDiffPixels 200`）不参与该对照，故对照差异量级高于阈值属预期。

- 差异总量：浅色 **7,030 px（Playwright 口径）/ 12,096 px（区域分析口径 0.93%）**；深色 **9,554 px / 12,009 px（0.93%）**；包围盒 浅色 `x[66,1375] y[112,369]`、深色 `x[88,1375] y[112,344]` —— 页头左侧标题、侧栏、页脚零差异。
- 过程中收敛掉**一处本批自行引入的非必要对齐改动**：`DataTable` 分页容器水平对齐。caomei 默认右对齐、PrimeVue 默认居中，直接用会改变分页器水平位置；已按 §3.8 用 `--caomei-data-table-pagination-justify: center` 收敛为居中。列带证据：收敛前右侧 `x[1280,1360)` 差异 3,311 px、中部 `x[680,760)` 742 px → 收敛后 2,290 px / 1,775 px（分页器由右移回中部）。区域指标**总量未下降**（收敛前 ~12.1k → 收敛后 ~12.1k），因该分页器在两态同时存在**垂直偏移**（PrimeVue 与 caomei 空态行高不同，见下表），水平对齐收敛只改变差异落点、不改变像素总量。

| 区域（浅色坐标） | 迁移前 | 迁移后 | 归因 |
| :--- | :--- | :--- | :--- |
| 页头动作按钮 `y[111,150] x[1294,1375]` | PrimeVue 按钮（label + `pi` 图标） | `CaomeiButton`（label + lucide 图标） | **组件替换**（按钮外壳 / 内边距 / 高度由 caomei 按钮提供） |
| 表头 `y[210,237] x[88,1351]` | PrimeVue `DataTable` 表头 | caomei `DataTable` 表头 | **组件替换**（表头底色 / 边框 / 字体 / 单元格内边距；列宽由表格自动分配，列头文本 x 位置随各列宽微移，非页面声明所致） |
| 空态文案 `y[243,261]`（左 `x[96,159]`） / `y[261,276]`（中 `x[692,747]`） | PrimeVue 空态行内**左对齐**文案 | caomei 空态行**居中**文案 | **组件替换**（空态行对齐与行高差异；页面 `#empty` 插槽写法未变） |
| 分页器 `y[288,300] x[646,793]` / `y[312,345] x[704,735]` | PrimeVue 分页器（居中，文本式按钮） | caomei 分页器（居中，实边框按钮） | **组件替换**（水平对齐已用 token 收敛；垂直偏移来自空态行高差） |
| 表格容器横线 `y[234,237]` / `y[348,351]` / `y[369,372]`（深色 `y[234,237]` / `y[264,267]` / `y[321,324]`） | PrimeVue 表头底边框与表格边框所在 y | caomei 对应边框所在 y | **组件替换**（表头 / 空态行高度不同，导致下方边框整体下移） |

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/external-links/index.test.ts tests/modules/ composables/use-admin-list.test.ts` = **7 文件 / 43 用例通过**（本页 13 条）；扩面后的路由迁移守卫（在册族零残留 + 至少一个 caomei 组件）已覆盖 `/admin/external-links`。`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过；`pnpm lint:i18n` 通过。
- **层 ②（E2E 功能）**：`tests/e2e/admin.e2e.test.ts` 的路由矩阵就绪选择器已由 `.p-datatable` 改为 `.caomei-data-table`；本路由实际加载由层 ③ 的 `page.goto('/admin/external-links')` 与页头可见断言覆盖（未单独复跑全量 E2E，见「未覆盖边界」）。
- **层 ③（截图识别）**：迁移前基线对照见上；归因与收敛完成后已按迁移后状态刷新基线，`pnpm test:visual` **14/14 通过**（本批新增浅 / 深 2 张 + 既有 12 张，既有页面逐像素零差异——本批未污染其他基线）。
- **包体**：`pnpm test:perf:budget` 全项不越线（`keyCss` 59.87KB / 70KB；本路由的组件样式进入路由 chunk，未抬升入口 `keyCss`）。

### 未覆盖边界 / 观察项

- TEST_MODE 未播种外链数据，截图基线为**空态**渲染，故截图层不覆盖行级渲染；行级结构（列定义与列插槽 / Tag tone / 跳转页图标分支 / 动作集合 / 客户端分页委托 / 弹窗字段映射与校验）已由本页单元层用例逐项断言。**截图基线 provenance**：迁移前 actual / diff 产物未入库，仓库仅存迁移后快照（浅 / 深 2 张），如需以「迁移前基线」作为判定依据应由 CI 复采。
- **客户端分页与压缩档**：本页为客户端分页（无服务端分页），caomei `DataTable` 无 PrimeVue `p-datatable-sm` 一类的压缩档，已有数据行时的行高 / 内边距将随组件替换变化——该差异不在空态基线覆盖范围内，登记为观察项；因 TEST_MODE 无种子数据，本轮未做行级截图对照。
- **遗留 PrimeVue v3 幻影 token（本页未清理，属有意保留）**：页面 scoped 样式保留 `var(--surface-ground)` / `var(--border-radius)` / `var(--text-color-secondary)` 三处声明。经核验这些名字在 Aura / MomeiPreset 产物中**从未被定义**（真实名为 `--p-surface-*`），当前按 `unset` 生效；若改写为 `--caomei-*` 会使 `.short-code` / 统计弹窗**首次显现背景色与圆角**，属超出「路由迁移不改观感」的行为变更，故本批保留。同类幻影 token 在仓库内十余处页面 / 组件（`pages/goto/[code].vue`、`components/admin/ai/*` 等）普遍存在，宜作为跨批清理项统一处置，不在本路由内顺带修改。
- **信息损失映射（§6.2 有损近似）**：行内「统计 / 编辑」按钮的 PrimeVue `severity="info"` 按 §6.2 映射为 `tone="primary"`（品牌主色，非 info 色）；`Tag` 的 `secondary` → `neutral`。两者均在空态基线覆盖范围外，登记为已接受的损失项。
- 其余 8 个路由（含 `AppAvatarV2` / `AppUploaderV2` / `PostAuditBadge` 过渡件）仍待办。

<!-- regression-window:end:phase68-b2-external-links:第六十八阶段-条目2-第二路由:2026-10-13 -->

<!-- regression-window:start:phase68-fix-comments-pagination:第六十八阶段-试点页分页对齐回归修复:2026-10-13 -->
## 2026-10-13 第六十八阶段 试点页分页对齐欠账回收（`/admin/comments`）

### 问题溯源

- **现象**：`/admin/comments`（M4 试点页，迁移提交 `44774147`，2026-09-25）的 caomei `DataTable` **分页容器右对齐**，与迁移前 PrimeVue 的居中口径不符（用户截图确认横向位置明显偏移）；同批后续迁移的 `/admin/submissions`（`ff443447`）与 `/admin/external-links`（`04d12c17`）均已居中。
- **根因（时间线）**：caomei `DataTable` 分页容器默认 `justify-content: flex-end`（PrimeVue 默认居中）。对齐 token `--caomei-data-table-pagination-justify` 由 `caomei-ui@0.4.0`（库侧提交 `b19f077`，2026-09-28）才交付，**晚于试点页迁移 4 天**；试点页迁移时（库锁 `0.2.0`）**没有可用的对齐 API**，故当时按协议登记为「组件替换」差异。本次属 token 到齐后的**欠账回收**，非新增变更。

### 修复写法

| 文件 | 改动点 |
| :--- | :--- |
| `pages/admin/comments/index.vue` | 在 `CaomeiDataTable` 的根 class（`admin-comments__table`）上补 `--caomei-data-table-pagination-justify: center`，并加注释说明「PrimeVue 默认居中 / caomei 默认右对齐 / `0.4.0` 起由该 token 还原」——与 `/admin/submissions`、`/admin/external-links` **同一写法**（token 落在表格根 class，不做选择器级覆盖、不新增依赖） |
| `tests/visual/__screenshots__/admin-comments-list.visual.test.ts/*.png` | 浅 / 深 2 张基线按修复后状态刷新（刷新前先做修复前后区域级归因，见下节） |

### 差异归因证据（修复前基线 → 修复后基线）

方法：本环境**无视觉模型**，用纯标准库 PNG 逐像素（容差 24/通道）+ 行带分布做区域定位；`toHaveScreenshot` 阈值（`maxDiffPixels 200`）不参与归因，故对照量级高于阈值属预期。修复前基线取自 `git show HEAD:` 的已提交快照，并经同环境复采确认**逐字节一致**（同环境：chromium / 1440×900 / DSF1 / zh-CN / Asia-Shanghai / 关闭动画）；修复后用同环境 `--update-snapshots` 采集。

- **差异总量**：浅色 **2,106 px（0.163% 视口）**；深色 **2,114 px（0.163%）**；包围盒 `x[461,1392] y[171,446]`（页头 / 侧栏 / 卡片外区域零差异）。
- **行带分布**：`y[415,446]`（32 行）**2,066 / 2,074 px = 98.1%**（分页器行）；`y[171,178]`（8 行）**40 px = 1.9%**（残项，见末尾两条）。
- **分页器行带 ink 横向分布**（带内众数色为背景，统计非背景像素）：修复前 ink **1,033（浅）/ 1,037（深）px**、`x[1317,1392]`、质心 `x=1354.5`（**94.1%** 视口宽 → 右端）；修复后 ink **同值**、`x[682,757]`、质心 `x=719.5`（**50.0%** 视口宽 → 正中）。三等分归属 `left / center / right`：修复前 `0 / 0 / 全部` → 修复后 `0 / 全部 / 0`。**ink 总量不变、仅横向平移**，即同一分页控件由右端移回中部（浅 / 深两套的位置与质心完全一致）。
- **因果对照（同构建 token 注入实验）**：在修复后页面上把该 token 覆盖回 `flex-end` 后截图，与**修复前基线**的差异**只剩**上述 40 px 图标（分页器区域像素完全一致）；token 在 `center` / `flex-end` 间切换只影响 `y[415,446]` 行带（2,066 px）。即本次修复的效果面**严格等于**分页器行带，无外溢。
- **残留 40 px 定位**：位于状态过滤器（caomei `Select`，`x[325,505] y[157,193]`）内的 `x[461,468] y[171,178]`，形状为 8×8 px 灰色「×」类图标，修复前有、修复后无。判定**与本次改动无因果关系**：① token 切换不改变该像素（见上条）；② 未改动路由 `/admin/submissions`、`/admin/external-links` 在**同一构建**下的渲染与各自已提交基线**逐像素零差异**（4 张基线 diff = 0），故非构建级漂移；③ 现构建下该页状态过滤器的 select 只渲染「值 + chevron」两个子节点、无 clear 类节点（caomei 的 clear 按钮仅在 `clearable` 形态下渲染，本页 4 处 select 均未声明该 prop）。据此判定为旧快照（迁移期构建）的一次性渲染状态差异、机制未进一步溯源。残留量 40 px 远低于 `maxDiffPixels 200`，不构成门禁风险，登记为观察项。

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run tests/modules/ pages/admin/comments/index.test.ts` = **6 文件 / 34 用例通过**（含「在册组件族零残留」路由守卫与试点页契约，本页契约未改）。
- **层 ③（截图识别）**：修复后基线经 `--update-snapshots` 刷新，`pnpm test:visual` **14/14 通过**（浅 / 深 2 张刷新基线 + 既有 12 张）；门禁轮因 `package.json` / visual config 时间戳触发**重建**，重建后刷新基线与本地采集**逐字节一致**（`sha256` 相同），确认修复后渲染可复现。
- **质量门（实测）**：`pnpm lint` 根工程 `eslint .` **0 error / 7 warning**（7 条与既往同源，均不在本窗口文件）+ `packages/*` 子工程 0 error / 3 warning；`pnpm lint:css` 通过（前置无 fix 轮同样 0 error）；`pnpm docs:check:line-count`、`pnpm docs:check:links`、`lint-md docs/reports/regression/current.md` 通过。**`pnpm typecheck`**：本轮窗口内曾因同工作区**另一并行会话的未跟踪在制品**（`tests/visual/parity/helpers.ts`，非本窗口文件、非本批引入）而红；该在制品已在视觉门禁批次完成，并复测 **0 error**（本窗口改动只有 6 行 SCSS + 2 张基线，不产生类型错误）。
- **未跑项**：本窗口为几何对齐回收，未改分页语义与列定义，故未重跑 E2E 功能层；如需可在阶段收口时随 B2 批次统一覆盖。

### 未覆盖边界 / 观察项

- 修复前基线沿用 `HEAD` 已提交快照（同环境复采已证实逐字节一致），故本次未做 `git stash` 重建采集；归因方法（逐像素 + 行带 + token 因果对照）与既有口径一致。
- 上述 40 px「×」类图标残项未做进一步溯源（跨构建的一次性渲染差异，低于阈值）；若后续路由出现同类残项，再按「先做同构建 token 对照、再做跨构建复采」的顺序判定。
- 本窗口写入后 `current.md` 为 **598 行**（脚本口径；写入前 557 行 / 本窗口 41 行），触发 `docs:check:line-count` 的 warning（>500）但未越 error 线（>700），且未超本次约定的 650 行归档触发线，故未做滚动归档；该 warning 在写入前即已存在（557 > 500），属既有治理项（见 0.6.0 漂移窗口的滚动归档逾期条目）。

<!-- regression-window:end:phase68-fix-comments-pagination:第六十八阶段-试点页分页对齐回归修复:2026-10-13 -->
