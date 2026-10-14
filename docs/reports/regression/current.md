# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

<!-- regression-window:start:phase42-close:第四十二阶段:2026-06-04 -->

<!-- regression-window:start:periodic-regression:weekly:2026-06-10 -->

<!-- regression-window:start:workflow-precheck:release:2026-07-25 -->

<!-- regression-window:start:periodic-regression:weekly:2026-07-27 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-07-27 -->

<!-- regression-window:start:phase68-fix-comments-pagination:第六十八阶段-试点页分页对齐回归修复:2026-10-13 -->

<!-- regression-window:start:workflow-precheck:test:2026-10-13 -->
## 2026-10-13 workflow pre-check（test，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=test`
- 证据 artifact: `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.md` / `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test critical files=PASS，test environment=PASS，security:validate-overrides=PASS，security:audit-deps=PASS
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:test:2026-10-13 -->

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

<!-- regression-window:start:phase68-b2-external-links:第六十八阶段-条目2-第二路由:2026-10-13 -->
## 2026-10-13 第六十八阶段 条目 2 第二路由 B2 迁移（`/admin/external-links`）

### 范围

条目 2（B2 剩余数据页迁移一）的第二个路由 `/admin/external-links` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 455 行 / 6 个 PrimeVue 列组件 / 17 个在册族标签，是**客户端分页**列表（迁移前 PrimeVue 表格即消费整份 `value`、不接服务端分页），与首路由 `/admin/submissions`（服务端分页 + `useAdminList`）不同：本页不引入 `pageIndexBase` 契约，分页完全委托 caomei `DataTable` 自持的 1 基内部态。

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

<!-- regression-window:start:phase68-b2-submissions:第六十八阶段-条目2-首路由:2026-10-13 -->
## 2026-10-13 第六十八阶段 条目 2 首路由 B2 迁移（`/admin/submissions`）

### 范围

条目 2（B2 剩余数据页迁移一，10 个 `pages/admin` 数据列表路由）的首个路由 `/admin/submissions` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。选它作为首个执行项（用户 2026-10-13 裁定「先做最小路由验证口径」）：388 行 / 19 个在册族标签 / 5 个 `<Column>`，且不依赖任何待新增的共享壳过渡组件——用于先把「每路由例行改写范式」固定下来，其余 9 个路由按难度递增推进。

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

<!-- regression-window:start:phase68-caomei-drift-060:第六十八阶段-caomei漂移收口:2026-10-13 -->
## 2026-10-13 第六十八阶段 caomei-ui 0.3.0 → 0.6.0 版本漂移收口

### 范围

条目 1 于 2026-09-26 完成 `caomei-ui@0.3.0` 升级与基线复测后，`caomei-ui` 又经两次 Dependabot 单包升级静默抬版到 `0.6.0`（`53d1dc21` 0.3.0→0.5.0，2026-10-06；`823517f5` 0.5.0→0.6.0，2026-10-11），两次提交只改 `package.json` / `pnpm-lock.yaml`，未按迁移方案 §5.6「0.x 不得静默升级，每次升级须先读目标版本 `BREAKING CHANGES` 并重跑该批回归」留任何复测与记录，规划 / 设计文档也仍停在 `0.3.0` 口径。本批补做升级纪律要求的全部动作：补读 `0.4.0` / `0.5.0` / `0.6.0` 的 `BREAKING CHANGES` 与影响面、按 `0.6.0` 重数组件清单、重跑三层视觉回归与包体预算、同步受影响文档。对应 [todo.md](../../plan/todo.md) 第六十八阶段条目 1 的补记。

### BREAKING CHANGES 阅读结论（升级纪律）

- 三个版本（`0.4.0` 2026-09-29 / `0.5.0` 2026-09-30 / `0.6.0` 2026-10-08）`CHANGELOG` **均无 `BREAKING CHANGES` 段落**；`0.2.0` 的 `styles.css → theme.css` 仍是迁移期内唯一破坏性包形态变更（M1b 已处理）。
- exports 面（`.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json`）与 `0.3.0` 一致，不需重定样式入口或 `injectStyles` 唯一性口径。
- 主题 token **取值未变**：`src/styles/theme.css` 的 `v0.3.0 → v0.6.0` 差异只有选择器由 `:root` 扩写为 `:root, [data-preset='minimal']` 与相应注释（把既有默认预设正式命名为「极简」），无任何 token 值增删改；`presets/caomei.css` / `presets/momei.css` 未变。故缺省渲染与 `0.3.0` 逐值一致，momei 侧「不启用 `data-preset='momei'`」的既有决策不受影响。
- 基础层**字节级变化**：`theme.css` 落点新增 `@import './field-shell.css'`（库侧 0.4.0「抽离字段外壳共享样式层并迁移 4 组件」），基础层由 5,880 B / gzip 1,089 B 增至 9,492 B / gzip 1,719 B。基础层是 `keyCss` 里**唯一的 caomei-ui 贡献来源**，故 `keyCss` 的增量可归因到它。
- 其余变更面（0.4.0：Button `iconOnly`、DataTable 分页对齐 token、Select `#value` 触发器插槽、soft 变体底色 8%、字段外壳共享层；0.5.0：`CaomeiRichTextEditor` 新组件、浮层 z-index 语义门禁、模态内浮层层级修正；0.6.0：DataTable 排序指示条常驻占位、组件背景色与阴影更新、Tabs 与 a11y 修正）均为库侧能力增强与缺陷修正，**momei 当前消费面零命中**，不产生迁移动作。

### 组件清单（0.6.0 口径重数）

自动导入组件 **81 项**（`0.3.0` 的 80 项 + `0.5.0` 新增 `CaomeiRichTextEditor`；按库侧 `src/nuxt/components.ts` 在 `v0.3.0` / `v0.6.0` 标签逐项对账，唯一差集即该组件）。`CaomeiRichTextEditor` momei 零用量；试点页消费清单仍为 5 族 / 8 处（`CaomeiButton` ×3、`CaomeiSelect` ×2、`CaomeiTag` ×1、`CaomeiInput` ×1、`CaomeiDataTable` ×1），与 `0.3.0` 批一致。

### 上游反馈缺口闭合（0.4.0 交付）

`0.4.0` 交付的三项能力正好闭合 [上游反馈清单](../../design/governance/2026-09-25-caomei-ui-upstream-feedback.md) 中标为「真实缺口」的 1.3 / 1.4 / 1.5，并在 `0.6.0` 产物中实测存在：Button `iconOnly`（`dist/components/button/types.d.ts` 有 `iconOnly?: boolean`）、DataTable `--caomei-data-table-pagination-justify` token、Select 触发器 `#value` 插槽。**对 B2 的影响**：原需在多个列表页重复的「行内图标按钮本地类」与「分页对齐选择器覆盖」补丁不再必需，B2 剩余页可直接用库侧原生能力；`Select` 触发器插槽也解除了语言切换器一类的等价迁移限制。B2 各批「文件 → 改动点」清单应改按 `0.6.0` 能力口径引用（见迁移方案 §5.5 / §6）。

### 包体复测与归因

- **本批实测**（`pnpm test:perf:budget`）：`keyCss` **61,311 B**（59.87KB / 70KB 配额）、`coreEntryJs` 343,968 B（335.91KB / 360KB）、`maxAsyncChunkJs` 50,346 B（49.17KB / 130KB）、`prIncrementJs` 6,960 B（6.80KB / 20KB），**全项不越线**。
- **可归因到 caomei-ui 的部分（字节级对照）**：基础层 5,880 B / gzip 1,089 B → 9,492 B / gzip 1,719 B（+3,612 B 原始 / **+630 B gzip**，全部来自新增 `field-shell.css`），对应 `keyCss` 实测 60,896 B → 61,311 B（**+415 B**）。同口径（gzip）对照下基础层 +630 B 对 `keyCss` +415 B，差 215 B 为与入口既有 CSS 合并压缩的收益。
- **基线状态（显式记录，避免误读为已对齐）**：`.github/perf/bundle-baseline.json` 保持 0.3.0 批次口径不变，其参考值已低于当前实测（`keyCssGzipBytes` 60,896 vs 61,311；`coreEntryJsGzipBytes` 337,008 vs 343,968），本批**不刷新基线**。
- **归因边界（未做逐提交字节对照，不写结论）**：`coreEntryJs` 相对 0.3.0 批次基线（2026-09-26 刷新）的 +6,960 B 与 `maxAsyncChunkJs` 的 +1,199 B **不落在 caomei-ui**（其 JS 产物未变，新增的 `CaomeiRichTextEditor` momei 零消费），系 0.3.0 批次之后的其他依赖变更（nuxt 4.5.2→4.6.1、`@sentry/nuxt` 10→11 等）的累计差；本批不做进一步归因，`.github/perf/bundle-baseline.json` 保持 0.3.0 批次口径不变，是否重取基线交由 B2 各批或 B4 决定。

### 验证结果

- **层 ①（单元）**：`tests/modules/ui-library-route-migration-guard.test.ts` 3/3 通过（在册族零残留守卫在 `0.6.0` 组件清单下仍成立）。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10 通过**（列表 / 表单 / 浮层 / token 桥接，浅深双主题），**零像素差异**——`0.6.0` 对既有基线零影响，无需逐项归因（与上条「基础层只新增字段外壳变量与类，且语义 token 由 momei 桥接覆盖」一致）。
- **层 ②（E2E 功能）**：复用当前 `master`（`39e00f21`，即 `0.6.0` 状态）的 CI `Test` 全 job 证据——`E2E (1/4~4/4)` / `Unit` / `Coverage` / `Build & Lighthouse` 均 success；本批未重跑 E2E。
- **质量门**：`pnpm typecheck` 通过；`pnpm test:perf:budget` 全项不越线。

### 未覆盖边界 / 观察项

- **治理缺口（本批触发原因）**：`caomei-ui` 作为精确锁定的迁移在飞依赖，仍被 Dependabot 单包升级路径抬版；在 `0.x` 不承诺语义兼容的前提下，该路径缺少「升级须读 `BREAKING CHANGES` + 重跑该批回归」的强制拦截。已在迁移方案 §5.6 补记「迁移收尾前须为 `caomei-ui` 配置 Dependabot `ignore` 或改走人工升级」，避免再次静默漂移。
- **本批为纯文档收口，无代码 / 依赖改动**：`package.json` 的 `caomei-ui: 0.6.0` 与锁文件已是现状，文档口径对齐即完成。
- `major` 级 Dependabot 升级（PR #745 `markdown-it 15` / #748 `better-auth 1.7`）与 `master` 上 `Publish Docker Image` 的 build 红灯不在本批范围，另行处理。
- **滚动归档逾期（本批新增观察项）**：本文件已约 675 行 / 20 个窗口，超过 [index.md](./index.md) §3.1 的「300-400 行或 6-8 条记录即须先滚动归档」阈值。按 [backlog.md](../../plan/backlog.md)「滚动归档由回归层在阶段收口时统一触发」，本批属阶段中途收口、**不触发归档**，登记为第六十八阶段收口必办项。另：`index.md` §3.1 的行数阈值（300-400）与 `docs:check:line-count`（warn>500 / error>700）不一致，建议一并校准（推荐以 `backlog.md` 的 500-700 / 700+ 为单点口径、`index.md` 改为指针引用），避免两套口径长期并存。
- **审计提示的归因边界**：`0.6.0` 的「组件背景色与阴影更新」属全局样式面，本批以 10 条视觉基线零差异佐证「当前消费面零命中」；若某已消费组件的变体未被这 10 条基线覆盖，细微波级变化存在漏检可能（观察项，交由 B2 逐页回归覆盖）。

<!-- regression-window:end:phase68-caomei-drift-060:第六十八阶段-caomei漂移收口:2026-10-13 -->

<!-- regression-window:start:phase68-item1-upgrade-030:第六十八阶段-条目1:2026-09-26 -->
## 2026-09-26 第六十八阶段 条目 1 caomei-ui 升级到 0.3.0 与基线复测

### 范围

`caomei-ui` `0.2.0` → `0.3.0` 精确锁定升级（不加 `^`、无 `file:` 形态）；升级前读 `CHANGELOG` 确认 `BREAKING CHANGES`；重跑视觉回归与定向测试；`keyCss` 重测与 `.github/perf/bundle-baseline.json` 刷新；「零 caomei 组件消费」口径澄清；组件消费清单按 `0.3.0` 口径重数。对应 [todo.md](../../plan/todo.md) 第六十八阶段条目 1。

### BREAKING CHANGES 阅读结论（升级纪律）

`0.3.0`（2026-09-24 发布）`CHANGELOG`（[GitHub `master/CHANGELOG.md`](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/CHANGELOG.md)，npm tarball 内不含 changelog，经 `npm view` / tarball 列表核实）无 `BREAKING CHANGES` 段落（唯一破坏性变更为 `0.2.0` 的 `styles.css → theme.css`，已在 M1b 处理）。变更面：DataTable 能力增强（可折叠分组 / 多列排序与降序优先 / 行展开 / 行分组）、新增 `TagsInput` 组件、docs 面 6 项。exports 面（`.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json`）与 `sideEffects` 与 `0.2.0` 一致。**关注点**：DataTable 排序语义变化可能影响消费页，故定向回归以试点页（消费 `CaomeiDataTable`）为重点。

### 升级记录

- `package.json` / `pnpm-lock.yaml` 精确锁定 `caomei-ui@0.3.0`，lockfile diff 仅该包（无无关 churn）。
- `caomei-ui/nuxt` 的 `theme.css` 注入点保持唯一（§5.7 约束 3 继续成立）。

### keyCss 复测与口径澄清（包体归因）

- **本批实测**（`pnpm test:perf:budget`）：`keyCss` **60,896 字节**（59.47KB / 70KB 配额）；`coreEntryJs` 337,008；`maxAsyncChunkJs` 49,147。全部不越线。
- **口径澄清（原「零消费」前提修正）**：「momei 零 caomei 组件消费故组件样式零进入产物」仅成立于 0.2.0 重锚时点。组件样式**随消费方 chunk 归属**——当前消费面（B2 试点 5 族）的组件样式落在路由 chunk（`comments.*.css` 含 `caomei-badge` 等组件类），入口 `entry.*.css` 仅含基础层（`.caomei-root` ×1、`--caomei-*` token ×167；在册组件类 `caomei-button` / `caomei-data-table` / `caomei-tag` / `caomei-badge` / `caomei-avatar` / `caomei-toggle` / `caomei-paginator` 零命中，`caomei-select` / `caomei-input` / `caomei-skeleton` 的命中均为 `--caomei-*` token 名如 `--caomei-select-max-width`）。若入口 / 全局壳消费组件，其样式将计入 `keyCss`。
- **归因更正（审计 RG-B1）**：`0.2.0` 与 `0.3.0` 的基础层字节级一致（`dist/styles/index.css` 同 sha256，5,880 B / gzip 1,089 B），**0.3.0 升级对三项包体指标贡献 0**；且 M4 期（仍锁 0.2.0）记录已为 59.47KB / 329.11KB / 48.00KB，与本批实测一致。较 M1b 期（2026-09-24）基线 60,684 / 336,333 / 49,055 的 **+212 / +675 / +92 系相对 M1b 期的累计差**（入口 CSS 侧净增量，主因 M3 `html:root` token 桥接块），**非 0.3.0 单批增量**。`.github/perf/bundle-baseline.json` 指标与 `note` 已按该口径刷新；`docs/standards/performance.md` 与迁移方案 §8.4.1 的「口径待复测」同步闭环。

### 组件消费清单（0.3.0 口径重数）

B2 试点页 5 族 / 8 处，与升级前一致：`CaomeiButton` ×3、`CaomeiSelect` ×2、`CaomeiTag` ×1、`CaomeiInput` ×1、`CaomeiDataTable` ×1。`0.3.0` 新增 `TagsInput` **零用量**；DataTable 新能力（`expandableRows` / `rowGroup` / `multiSort`）零用量。上游组件清单按 `0.3.0` 重数为 80 项（79 + `TagsInput`），迁移方案 §5.1 已同步。

### 验证结果

- **层 ①（单元）**：路由迁移守卫 + `lib/ui-library` + 试点页单测 **25/25**；批次收尾全量 `pnpm test` **4497 通过 / 533 文件**（1 skip 为既有）。
- **层 ②（E2E 功能）**：试点页定向 `tests/e2e/admin.e2e.test.ts` chromium **7/7**（含 `/admin/comments` + `.caomei-data-table` 断言）。全量 E2E 抽查出现 `installation` / `posts` / `public-pages` / `seo-regression` 30s 超时，**隔离复跑 17 通过 / 1 flaky（`/archives` retry 过）/ 1 失败**，判定为负载超时；唯一稳定失败 `seo-regression` 文章详情 SEO 用例已**逐请求归因**：挂起资源为作者头像外链 `https://0.gravatar.com/avatar/…`（沙箱不可达拖死 `load` 事件，页面 DOM 完整渲染、该页零 caomei 消费），属**环境固有 flaky，非本批回归**（对照 M4 的 flaky 判定口径）。处置：不扩修测试代码（C 类），登记为已知环境 flaky。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10 通过**（列表 / 表单 / 浮层 / token 桥接，浅深双主题），无像素差异——0.3.0 对既有基线零影响，无需归因。
- **质量门**：`pnpm typecheck` 通过；`pnpm lint` 0 error（3 条既有 warning 在 `packages/cli`，不在本次面）；`pnpm test:perf:budget` 全项不越线。

### 未覆盖边界 / 观察项

- 全量 E2E 三浏览器矩阵未完整重跑（迁移方案 §8.1 不要求每批全量）；gravatar 外链拖死 `load` 的环境 flaky 已登记，若后续阻塞可考虑测试侧拦截外链头像（属测试有效性主线候选，不进本批）。
- DataTable 多列排序 / 行分组等新能力零用量，其行为差异清单待 B2 剩余页用到时再核对。

<!-- regression-window:end:phase68-item1-upgrade-030:第六十八阶段-条目1:2026-09-26 -->

<!-- regression-window:start:phase67-m4-pilot-comments:第六十七阶段-M4:2026-09-25 -->
## 2026-09-25 第六十七阶段 M4 B2 试点页迁移（PrimeVue → caomei-ui）

### 范围

- 试点页 `/admin/comments`（管理端评论列表）按**路由整体切换**到 caomei-ui，并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（`lib/ui-library.ts`）。覆盖 DataTable 列插槽 / 分页 / Tag / Button / InputText / Select 与共享头部择库。
- 共享壳过渡策略：新增 `components/admin/content-language-switcher-v2.vue`（caomei `Select` 版），由 `AdminPageHeader` 经路由 → 组件来源单一事实源选择，避免未迁移路由出现「共享壳 caomei + 页面 PrimeVue」；`ConfirmDeleteDialog` / 全局 `Toast` / `ConfirmDialog` / `v-tooltip` 按 §5.5 显式豁免（浮层留第六十九阶段）。
- `@lucide/vue` 由传递依赖升为 momei 直接依赖（试点页在 momei 模板直接引用图标；§5.6 / 1b 已登记该前置）。
- 新增「在册组件族零残留」守卫 `tests/modules/ui-library-route-migration-guard.test.ts`；为试点页补截图基线（迁移前采集、归因后更新）与单元层用例。

### 「文件 → 改动点」清单

| 文件 | 改动点 | 依据 |
| :--- | :--- | :--- |
| `pages/admin/comments/index.vue` | `IconField`+`InputIcon`+`InputText` → `CaomeiInput`（`#prefix` + lucide `Search`）；`Select` → `CaomeiSelect`（`option-label/value`、`@change`→`@update:model-value`）；`DataTable`+`Column` → `CaomeiDataTable`+`columns`（`#body`→`#cell-{key}`、列 `class` 宽度→`width`、`text-align`→`align`）；`Tag severity`→`tone`；`Button text/rounded/severity/icon`→`variant="ghost"`/`rounded`/`tone`/`#icon`+`label`；`@page` 由 0 基偏移改 1 基页码；样式 `--p-*`→`--caomei-*` | 迁移方案 §6.1/§6.2/§6.3 |
| `pages/admin/comments/index.vue` | 「全部状态」选项值 `null` → 哨兵 `__all__`（caomei `Select` 的 `optionValue` 非 string/number 不渲染），边界还原为 `null` | caomei Select 文档「对象选项」 |
| `pages/admin/comments/index.vue` | 内容列限宽由 scoped `class` 改为列定义 `bodyStyle`（caomei 内联到单元格）；scoped 类不会命中子组件渲染的 `<td>`，避免留下死规则 | caomei DataTable 列定义 |
| `pages/admin/comments/index.vue` | 图标按钮：caomei Button 无「图标按钮」形态，按 `--caomei-button-padding-x: 0` + 方形宽度收敛（文档化 token 定制路径） | §5.7 约束 1 |
| `components/admin-page-header.vue` | 语言切换器按 `resolveUiLibraryForRoutePath(route.path)` 择库（`<component :is>`），默认仍 PrimeVue | §5.5 共享壳例外 |
| `components/admin/content-language-switcher-v2.vue` | 新增过渡组件（哨兵映射，保持 `null` = 全部语言 的共享语义） | 本批裁定 |
| `lib/ui-library.ts` | 登记 `/admin/comments`；新增 `resolveUiLibraryForRoutePath`（剥离 locale 前缀，`prefix_and_default` 下 `/en-US/...` 亦可命中） | §5.5 |
| `lib/ui-library.test.ts` | 新增 `resolveUiLibraryForRoutePath` 用例（登记项命中 / 三种 locale 前缀剥离 / 未登记回退 / 两字母业务段不误判） | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | `/admin/comments` 就绪选择器由 `.p-datatable` 改为 `.caomei-data-table`（保留 `.admin-page-container` 兜底） | 层 ② 改写 |
| `tests/visual/admin-comments-list.visual.test.ts` + 基线 | 新增试点页浅 / 深 2 张基线（迁移前采集，逐项归因后按迁移后状态更新，见「未覆盖边界」） | §8.2 层 ③ |
| `pages/admin/comments/index.test.ts` | 改写为 caomei 版组件栈的 stub：保留并强化原有 6 项覆盖（页头契约 / 表格渲染 / 筛选控件 / 挂载即加载 / 空态 / 请求失败记录错误），新增列定义与列插槽、tone 映射、动作集合、1 基分页、筛选哨兵往返、PUT 后就地更新 | §8.2 层 ① |
| `components/admin/content-language-switcher-v2.test.ts` | 新增过渡组件契约（哨兵不泄漏到共享状态） | §8.2 层 ① |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 新增守卫（已登记路由不得残留在册族 PrimeVue 组件且至少含一个 caomei 组件） | 本批裁定 |
| `package.json` / `pnpm-lock.yaml` | 新增 `@lucide/vue@^1.45.0`（解析 1.47.0，与 caomei-ui 依赖同版本） | §5.6 |

### 验证结果

- **层 ①（单元）**：`pnpm test` = **532 文件（531 通过 / 1 跳过）· 4494 用例通过 / 1 跳过（4495）**；本批新增/改写用例全部通过。
- **层 ②（E2E 功能）**：`tests/e2e/admin.e2e.test.ts`（含 `/admin/comments` 就绪断言，已改用 caomei 选择器）chromium **7/7** 通过；`mobile-critical` 两项目全绿。`pnpm test:e2e:critical` 中 `auth-session-governance.e2e.test.ts` 出现 firefox/webkit 失败，形态为 `page.goto('/settings')` **超时**（与 M2 登记的已知 flaky 一致）——**已用 HEAD 构建（`997313c5`，本批改动全部 `git stash`）做对照复现**：firefox 单独运行同样 `1 failed / 4 passed / 1 skipped`（同一用例、同一超时）；迁移后同 spec 在 chromium 单独 / webkit 单独均 **6/6 通过**，且 `pnpm test:e2e:critical` 曾整体通过一次。判定为**既有 flaky，非本批回归**。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10**（试点页浅/深 + 既有 6 张 + 桥接契约 2 项）；既有页面（posts / settings / 浮层）逐像素无差异。
- `pnpm lint:css` / `pnpm typecheck` / `pnpm build` / `pnpm test:perf:budget`：通过（`keyCss` 59.47KB / 70KB，未因本批上升）。

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：迁移前基线在本批改动前用 `git stash` 回到 `997313c5` 构建后采集，迁移后用同环境（chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画）截图，再以像素级「行内容跨度」与差异区域定位做**人工逐项归因**（`toHaveScreenshot` 阈值 `maxDiffPixels 200` 不参与该对照，故差异总量高于阈值属预期）；归因完成后基线已按迁移后状态更新（见「未覆盖边界」）。差异总量 0.6%~1.2%：

| 区域 | 迁移前 | 迁移后 | 归因 |
| :--- | :--- | :--- | :--- |
| 头部语言切换器（y80-108，x152-301） | PrimeVue `Select` | caomei `Select`（V2 过渡组件） | **有意**（共享壳择库，用户 2026-09-25 裁定 (a)） |
| 筛选行（y152-200） | 搜索框 + 状态选择器（左对齐） | 同区间 | **组件替换**；几何已刻意对齐——首版误用 `flex` 撑满 + 把宽度 `class` 置于 `<CaomeiSelect>`（caomei 的 `class` 落触发器）致输入 ~990px / 选择器 ~305px，已改为「包装元素约束 + 输入 260px」 |
| 表头列位置（y212-240） | 表头文本 x48/259/472/682/894/1211 | x43/144/365/596/828/1366 | **有意**：迁移前 SCSS 声明的列宽未被 PrimeVue 自动布局生效；caomei 按列定义渲染（status 100px / author 220px / actions 右对齐），方向与作者意图一致（属组件语义差异，非本批新引入） |
| 空态 + 表格样式（y216-256 / y312-336） | PrimeVue DataTable 空态 | caomei DataTable 空态（`bg-elevated` 系表头 / 边框 / 字体） | **组件替换**（§6.3 有意差异范围内） |
| 分页器（y408-448） | PrimeVue 分页器居中 | caomei 分页器右对齐 | **组件替换**；caomei 分页器对齐无 token 钩子，登记为后续批次可选项（如需居中需选择器级覆盖，§5.7 约束 2） |

> 口径说明：上表「跨度」为**行内容可见跨度**（含控件边框与文本，不含外部留白），故与元素盒模型宽度不等（如筛选行内容跨度 56-301 对应盒宽 260px）；迁移前几行的判断依据是迁移前采集记录与组件语义（基线已更新，不能从仓库复现），标注为推断而非可复核实测。

### 试点结论（链路可行性与耗时画像）

- **链路可行**：`接入 → token → 图标 → 组件 → 测试改写 → 三层回归` 全链路闭合；`--caomei-*` 桥接（M3）在真实组件上生效，无需为本页追加任何样式 token。
- **耗时画像（本批实测）**：范围裁定与 API/差异对照 ≈ 1.5h（含 20 个候选页 × 共享组件扫描）；实现 ≈ 1.5h；全量构建 ≈ 8 次（含迁移前基线采集 1 次、HEAD 对照复现 1 次；单次约 4–6 min）；视觉全量 1 轮约 1.5–2.0 min；全量单测 156s；E2E critical 约 4–6 min（含已知 flaky 复跑与 HEAD 对照）。
- **发现的阻塞与修正建议（供后续批次）**：
    1. **共享壳是主线成本**：`AdminContentLanguageSwitcher` / `ConfirmDeleteDialog` / `AppAvatar` 等跨路由共享组件决定「路由内无双库混用」能否成立；建议 B2 全量前先完成共享壳的**过渡组件化清单**（本批已为语言切换器打样），否则每页都要处理同类冲突。
    2. **`optionValue` 不接受 `null`** 是高频坑（「全部 / 不限」选项普遍以 `null` 表达），建议后续批次统一采用「哨兵 + 边界还原」写法并抽公共常量。
    3. **`class` 落点在 caomei 组件上不一致**（Button/Input 落根元素；Select 落触发器，宽度需约束字段外层），建议在迁移写法里固化「Select 宽度用包装元素」规则。
    4. **无「图标按钮」形态**：表格行内动作按钮需按 `--caomei-button-padding-x` 收敛，建议评估是否在库侧提供 `iconOnly` 档位（属库侧变更，走 caomei-ui 流程）。
    5. **分页器对齐 / 列宽生效差异**需在各页「文件 → 改动点」清单中显式登记，避免被当作回归。

### 未覆盖边界

- TEST_MODE 未播种评论数据，截图基线为**空态**渲染；表格行级结构由单元层用例承担（列插槽 / tone / 动作集合 / 分页 / 筛选映射）。
- **截图基线 provenance**：仓库内 `tests/visual/__screenshots__/admin-comments-list.visual.test.ts/` 的两张 PNG 是**逐项归因后按迁移后状态更新**的结果（`test:visual:update`）；迁移前对照图仅作一次性本地记录、不随仓库保存，因此「迁移前基线」对照无法从仓库复现，归因表属文本记录（推断已显式标注）。
- 列排序、行选择在本页无用量（未覆盖）；`useToast` / `useConfirm` 本页未使用（B3 覆盖）。
- 共享壳 `ConfirmDeleteDialog` 仍为 PrimeVue（豁免）；`v-tooltip` 仍为 PrimeVue 指令（豁免，随浮层批次处理）。
- **包体归因**：`admin-page-header.vue` 静态导入 V1 + V2，使每个 admin 页的 `admin-page-header` chunk 含 caomei `Select` 组件样式（约 6KB，仅 admin 域，未进入 `entry` / 公共页）；`keyCss` 预算未受影响（59.47KB / 70KB）。后续批次可评估 V2 懒加载或共享壳整体回收。
- 未在 CI 实跑（本地无 CI 环境）；`visual` job 仍为 `continue-on-error`。

<!-- regression-window:end:phase67-m4-pilot-comments:第六十七阶段-M4:2026-09-25 -->

<!-- regression-window:start:phase67-m3-token-bridge:第六十七阶段-M3:2026-09-25 -->
## 2026-09-25 第六十七阶段 M3 全局 token 语义层桥接（PrimeVue → caomei-ui）

### 范围

- 落地迁移方案 §5.2 第 ① 层「语义层与预设桥接」：在 `styles/main.scss` 末尾新增 **unlayered `html:root`** 桥接块，把 `--caomei-*` 语义 token 指向 momei 现行 `--p-*` 语义（含 `useTheme` 运行时按用户主题生成的覆盖）；派生档位（次级面、实底深档）统一用 `color-mix()` / 色阶深档表达。
- `nuxt.config.ts`：更新 `caomeiUI` 与 PrimeVue `cssLayer` 注释，记录「caomei-ui 保持未分层」「不启用 `data-preset="momei"`」的决策依据。
- 新增级联契约守卫 `tests/visual/caomei-token-bridge.visual.test.ts`（真实浏览器读取**计算后**的 `--caomei-*`）。
- 未改动 `styles/_variables.scss` 与 `layouts/**`：桥接为 token 级、SCSS 别名会成死代码；`layouts/**` 消费的 `--p-surface-ground`（页面底）在 caomei 侧无对应语义（caomei `bg` 实为内容面），改写即造成观感回退，按最小改动保留。

### 关键决策与依据（实测）

- **落点必须 unlayered**：实测 `nuxt.options.css` 顺序为 `… @/styles/main.scss(4) → caomei-ui/theme.css(5)`，且 caomei 基础层 `grep -c @layer` = 0；按层叠规则未分层优先于任何具名层，故 `@layer momei-base` 内的桥接会被 caomei 的 `:root` 覆盖。选择器取 `html:root`（特异性 `0,1,1`）高于库侧 `:root` / `:is(.dark, [data-theme="dark"])`（均 `0,1,0`），与加载顺序解耦。
- **不启用 `data-preset="momei"`**：其暗色选择器 `:is([data-preset="momei"].dark, …)` 特异性 `0,2,0` 会压过桥接并把暗色 token 冻结为静态预设值，使运行时主题失效；桥接覆盖 momei 主题驱动的全部**映射项**（预设的暗色状态色微调与主色 `-solid` 深档为已知偏离），故预设保持「可用但不启用」。
- **`bg` 语义核对**：caomei 组件用法显示 `--caomei-color-bg` 承载卡片 / 输入 / 表格 / 浮层 / 工具栏（内容面），对应 `--p-surface-card`；`bg-elevated` 为表头 / 斑马纹 / 悬停 / 骨架等次级面，按 `color-mix(--p-surface-card 96%, --p-text-color)` 派生（与 caomei 预设中二者的相对关系一致）。
- **幻影 token**：`--p-error-500` / `--p-success-500` / `--p-warning-500` / `--p-surface-border` 等 momei 既有声明在 Aura 产物中**并不存在**（Aura 语义层无 `success|warning|error|info`），状态色改引真实存在的原始色板 `--p-red-500` / `--p-green-500` / `--p-orange-500`（由 `primitive-variables` 样式表产出），边框改引 `--p-content-border-color`。

### 验证结果

- `pnpm lint:css`：PASS。
- `pnpm typecheck`：PASS。
- `pnpm build`：PASS（由 `test:visual` 的构建新鲜度前置执行 `pnpm run build`；产物 `Σ 71.5 MB / 18.4 MB gzip`）。
- `pnpm test:visual`：**8/8 通过**——6 张既有基线浅 / 深逐像素无差异（未迁移页面观感无回退）+ 2 项桥接级联契约（浅 / 深）。
- 定向单测：`pnpm exec vitest run tests/scripts tests/modules` = 23 文件 / 197 用例全通过。
- **假阴性（守卫非空转）**：在真实页面仿真「桥接回落到 caomei 基础层默认值」（追加同特异性更靠后的 `html:root` 覆盖）后，守卫在浅 / 深两主题均稳定失败（`--caomei-color-primary(#2563eb/#60a5fa) != --p-primary-color(#64748b/#94a3b8)`，并命中「等于库默认值」断言）；未仿真时 0 失败。
- 附带确认：向页面追加更靠后的未分层 `:root{--caomei-color-primary:…}`（特异性 `0,1,0`）**无法**覆盖桥接，从反面验证 `html:root` 特异性设计生效。

### 未覆盖边界

- 本层仅保证「token 可被消费且与 momei 主题一致」；caomei-ui 组件在未迁移页面上尚未渲染，故截图层「无差异」是必然结果而非对桥接的验证——桥接正确性由级联契约守卫承担。
- 桥接守卫位于 `visual` CI job（初期 `continue-on-error: true`），待该 job 确认基线转阻断后才成为硬门禁；守卫内 `CAOMEI_BASE_DEFAULT_PRIMARY`（caomei 基础层默认主色）须随 caomei-ui 升级复核（§5.6 升级纪律）。
- 已知偏离：主色 `-solid`（`--p-primary-700`）在暗色下随主题重算，与 caomei「实底跨主题同值」的约定不同；状态色 `-color` / `-solid` 取固定原始色板、两主题同值，且 caomei 预设的暗色状态色微调（`#f87171` / `#4ade80` / `#fb923c`）未被采用。两类偏离留待 B2 试点页按实际用法定案。
- 未运行全量 `pnpm test` 与 `pnpm test:e2e:critical`（本次改动仅样式层 + 注释 + 一个 Playwright spec，未触及 TS 逻辑与既有断言语义；定向单测已覆盖受影响入口）。

<!-- regression-window:end:phase67-m3-token-bridge:第六十七阶段-M3:2026-09-25 -->

<!-- regression-window:start:phase67-m2-visual-base:第六十七阶段-M2:2026-09-24 -->
## 2026-09-24 第六十七阶段 M2 视觉验证回归基座（PrimeVue → caomei-ui）

### 范围

- 建立迁移期三层视觉验证回归基座（迁移方案 §8.2）：① 单元层、② E2E 功能层、③ 截图识别层。
- 截图识别层落地为**独立工程**：新增 `playwright.visual.config.ts`（独立 config / project）与 `tests/visual/`，入口 `pnpm test:visual` / `pnpm test:visual:update`（经 `scripts/testing/run-visual.mjs` 复用 e2e 的构建新鲜度检查与浏览器安装前置）。**不并入**既有 `pnpm test:e2e` / `test:e2e:critical` / `test:e2e:review-gate` 的 `testMatch` 与断言语义。
- 采集对象：列表页 `/admin/posts`、表单 / 设置页 `/admin/settings`、浮层（`/admin/settings` → 协议管理 → 新增 → 创建协议对话框），各覆盖浅色 / 深色两套主题，共 6 张基线快照，随仓库提交。
- CI 接入：`test.yml` 新增 `visual` job（下载共享 Nuxt 构建 → 安装 chromium → `pnpm test:visual` → 失败产物上传）。
- `vitest.shared.ts` 排除 `tests/visual/**`，避免 Vitest 误收集 Playwright spec。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次无关）。
- `pnpm test`：PASS（530 文件（529 通过 / 1 跳过）· 用例 4479 通过 / 1 跳过；视觉 spec 未被 Vitest 收集）。
- 截图识别层环境可复现配置：chromium（`devices['Desktop Chrome']`）/ viewport 1440×900 / deviceScaleFactor 1 / locale `zh-CN` / timezone `Asia/Shanghai` / `colorScheme: light` + 显式 `localStorage.theme` 覆盖 / `reducedMotion: reduce` / `animations: 'disabled'` / `caret: 'hide'`。
- 阈值策略：仅配置绝对上限 `maxDiffPixels: 200` + 单像素容差 `threshold: 0.2`（不设比例兜底；绝对值口径保证细粒度 token 改动不被视口比例吞掉）。禁止为让测试变绿而放宽。
- 动态区域策略：统一以 `[data-visual-mask]` 显式遮蔽（辅助函数 `dynamicMask`）。列表页「发布时间」单元格（`pages/admin/posts/index.vue` 的 `.user-created-at`，含绝对时间 `formatDateTime` 与相对时间 `relativeTime`）**整体标注 `data-visual-mask`**：两者均源自运行时种子 `publishedAt: new Date()`（`server/utils/seed-test.ts`），既随真实时间漂移，也会因 CI 重建数据库而与本地基线不同；此前未遮蔽时仅靠「被 frozen actions 列遮挡」侥幸稳定，属布局巧合，现改为显式遮蔽以消除隐患。因遮蔽改变该页基线像素，已重新生成列表页 2 张基线快照并复验全绿。
- **假阳性验证**：无样式变更时连续两次运行 6/6 全绿（逐像素稳定）。
- **假阴性验证**：故意将 `--p-surface-card` 改为 `#ff0000` 后，3 项浅色用例稳定失败（深色用例因 `.dark` 覆盖该 token 而未受影响，符合预期）；还原后恢复全绿。
- 灵敏度边界（实测登记）：仅影响**未进入捕获区域**的元素时不会产生差异——如 `$border-radius-md`（命中 `components/app-header.vue`）改动进产物（`.output` CSS 出现 `border-radius:1.5rem` 2 处）但在 3 个目标页捕获区域内无可见差异。此类 token 级改动由单元层 DOM/ARIA 断言与 E2E 行为层兜底。
- E2E 功能层：`pnpm test:e2e:critical` 两阶段（`auth-session-governance` × chromium/firefox/webkit + `mobile-critical` × mobile-chrome/safari）全绿。
- **已知 flaky 集登记**：`tests/e2e/auth-session-governance.e2e.test.ts`（判定依据见 M1 节：失败形态均为 timeout、两次运行失败项不同、firefox 单独运行全通过）。**M1 前后 flaky 率对比**：M1 采样 chromium `--repeat-each=3` 为 2 通过 / 1 失败（当次 33%）；M2 采样 chromium `--repeat-each=3`（18/18）+ 全量 critical（3 浏览器各 1 次）**共 21 次执行 0 失败**。结论：属**负载相关超时**而非迁移回归，登记为已知 flaky，不因偶发失败判定迁移回归。
- 单元层：保留既有设置页 / 主题页测试；新增浮层目标组件 `components/admin/settings/agreement-edit-dialog.vue` 的**同目录**结构契约测试 `components/admin/settings/agreement-edit-dialog.test.ts`（对话框 `role` / label-`for` 与控件 `id` 绑定 / 编辑态与创建态渲染差异 / `update:formData` v-model 契约 / `save` 事件），断言只覆盖**迁移无关**的可访问性与事件契约；新增 `tests/scripts/run-visual.test.ts` 覆盖视觉入口编排。
- 既有入口未变：`tests/scripts/run-e2e.test.ts` + `run-e2e-critical.test.ts` 共 25 用例通过（`run-e2e.mjs` 仅新增 `export`，无行为改动）；新增 `tests/scripts/run-visual.test.ts` 覆盖 `run-visual.mjs` 的编排顺序与独立 config 参数。
- 基线快照体积与保留策略：6 张合计 **663,994 字节（约 664KB）**（`tests/visual/__screenshots__/`）；基线随仓库提交、由 `pnpm test:visual:update` 原地覆盖，不做历史版本堆积（历史即 git 记录）；CI 失败产物（actual/diff）落 `test-results/visual/`，按 `retention-days: 7` 上传。**不引入 Git LFS**（2026-09-24 决策，体量与单文件尺寸远低于 LFS 适用区间，且 LFS 会带来指针文件失真 / tarball 不可复现等硬成本；再评估触发线见迁移方案 §8.2 成本预算段）。CI 增量耗时：本机实测约 1.4–2.4 分钟（6 用例，串行 1 worker，不含构建复用）。

### 审计建议处置（M2 两分区 Review Gate）

- 分区一（截图工程 + CI）：S1 config 注释口径 / `.gitignore` 死规则 → **已修复**；S2 `maxDiffPixelRatio` 被绝对上限压制 → **已修复**（删除，仅留 `maxDiffPixels: 200`）；S3 `run-visual.mjs` 死变量与缺单测 → **已修复**（删变量 + 新增 `tests/scripts/run-visual.test.ts`）；**S4 `snapshotPathTemplate` 未含 `{-projectName}` → 接受延后**（当前单 project；后续若加 firefox / webkit project 须补 `{-projectName}` 防路径冲突，此处登记为约束）；S5 `reuseExistingServer` 与 e2e 不一致 → **已修复**（改为 `!process.env.CI` 并注明与 e2e 共用端口 3001 的本地并发约束）；**S6 `continue-on-error` 无到期跟踪 → 已登记**（见「未覆盖边界」首条，CI 确认基线后须转阻断）。
- 分区二（单元层 + 文档）：S1 单测目录 → **已修复**（移至与源码同级的 `components/admin/settings/agreement-edit-dialog.test.ts`）；S2 断言强度 / S3 契约遗漏 → **已修复**（补 `update:formData` v-model 断言、`sourceAgreementId` / `content` label 断言）；S4 快照体积 → **已修复**（663,994 字节）；S5 保留策略 → **已修复**（补声明）；S6 绝对时间漂移 → **已修复**（整体遮蔽 + 说明）；**S7 「todo 标 `[x]` 但 CI 未阻断」→ 已登记**（第 2 项「完成」以「CI 确认基线并转阻断」为最终界；CI 未实跑属已声明边界）。

### 未覆盖边界

- **基线来源跨环境风险（需 CI 确认）**：本批基线在本地 Linux（WSL2）环境生成；迁移方案 §8.2 要求跨环境差异无法消除时以 **CI 生成为唯一基线来源**。因此 `visual` CI job 初期设 `continue-on-error: true`，首次 CI 运行用于在 ubuntu runner 上确认基线；若与本地基线不一致，须以 CI 产物重建基线后提交，再将 job 转为阻断门禁。
- 列表页（`/admin/posts`）暂无页面级 Vitest 单元测试（其行为由 E2E 功能层 + 截图层覆盖）；如需补页面级结构契约测试，登记为后续项。
- 浮层基线仅覆盖「协议创建对话框」；Dialog / Drawer / Popover 全量浮层留待 B3 / B4 批次逐类建立。
- 未在 CI 实跑验证 `visual` job（本地无 CI 环境），job 语法与步骤按既有 e2e job 模式镜像。

<!-- regression-window:end:phase67-m2-visual-base:第六十七阶段-M2:2026-09-24 -->

<!-- regression-window:start:phase67-m1b-reanchor:第六十七阶段-M1b:2026-09-24 -->
## 2026-09-24 第六十七阶段 M1b caomei-ui 重锚到 0.2.0（PrimeVue → caomei-ui）

### 范围

- 依赖 `caomei-ui` 由 `0.1.0` 精确锁定上移到 `0.2.0`（迁移期仍精确锁定，不加 `^`）；`pnpm install` 后 lockfile 同步。
- 上游 0.2.0 含包形态破坏性变更：移除单体 `caomei-ui/styles.css`，改为基础层 `caomei-ui/theme.css`（落点 `dist/styles/index.css`，5,880 B / gzip ~1,089 B，0 个 `@layer`）+ 逐模块组件样式（`dist/` 下共 75 个 CSS）。
- 按迁移方案 §8.4.1 在本次升级批次内回落并存期配额（`keyCss` 85KB → 70KB）并刷新基线。
- 口径与事实源同步：`docs/standards/performance.md` 的现行首屏 CSS 预算同步为 `70KB`（该文件 §4.1 要求脚本 / 基线 / 规范三处一致）；`docs/plan/{todo,roadmap,backlog}.md`、`docs/design/ui.md`、迁移方案与 2026-08-29 许可证评估、`docs/i18n/{en-US,ja-JP,ko-KR,zh-TW}/plan/roadmap.md` 四份镜像摘要随重锚完成同步（镜像 `last_sync` → `2026-09-24`，避免提交后 `docs:check:source-of-truth` 判 stale）。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（527 文件 / 4473 用例通过，1 skipped；相对 2026-09-21 窗口 +2，来自 `0fab59d7` 的 `server/services/upload.test.ts`）。
- `pnpm build`：PASS。
- `pnpm test:perf:budget`：PASS（`keyCss` 59.26KB / 70KB 回落配额；`coreEntryJs` 328.45KB / 360KB；`maxAsyncChunkJs` 47.91KB / 130KB）。
- `keyCss` 复测：75,110 → **60,684** 字节（gzip）；相对迁移前基线 59,795 仅多出基础层约 0.87KB。产物 `entry.*.css` 含 49 个 `--caomei-*` token 与唯一类 `.caomei-root`，**零 caomei 组件样式**（`caomei-button` 出现 0 次，符合「momei 当前零 caomei 组件消费」预期）。
- 注入点唯一性（`loadNuxt` 读取解析后的 `nuxt.options.css`）：`caomei-ui/theme.css` 恰好 **1** 次，`caomei-ui/styles.css` 0 次；`_installedModules` 中 `caomei-ui` 无重复安装。
- `@layer` 顺序不变：产物仍为 `primevue, momei-base, momei-overrides`；caomei-ui 基础层以未分层形态加载。
- 自动导入隔离不变：`.nuxt/imports.d.ts` 中 `useToast` 归 `primevue/usetoast`、`useConfirm` 归 `primevue/useconfirm`、`useTheme` 归 `composables/use-theme.ts`；caomei-ui 仅保留 `useLocale` / `provideLocale`。
- §3.4 基线未漂移：`pnpm governance:count:primevue-usage` 重取 = 组件 59 类 / 1515 处；图标 629 处；token 1403 处（与 M1 完全一致）。
- `@lucide/vue` 未在 momei 源码直接引用，本批不新增直接依赖（留待试点页按实际引用决定）。

### 未覆盖边界

- 视觉验证回归（单元 / E2E / 截图三层）仍未建立，属 M2 范围；本批无 UI 可见变化，仅样式形态与包体口径变更。
- 未逐 preset 验证 dev / Vercel / Cloudflare 产物（与 M1 同口径，依据 node-server 产物判定因果充分）。
- 白名单初始仍为空（尚无路由迁移），路由级隔离规则未被真实用例触发。
- 本批未采集 E2E 基线；已知 flaky 集 `auth-session-governance` 的显式登记与 M1 前后 flaky 率对比仍属 M2 待办。

<!-- regression-window:end:phase67-m1b-reanchor:第六十七阶段-M1b:2026-09-24 -->

<!-- regression-window:start:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->
## 2026-09-21 PostgreSQL 值类型解析退化导致「所有文章显示置顶」修复

### 范围

- 现象：后台文章管理列表所有行「置顶」列显示「是」；友链页 `isPinned` / `isFeatured`、站内通知 `isRead` 等布尔徽章存在同类误判风险。
- 根因：Nitro 2.13 的 Rollup `treeshake.moduleSideEffects` 白名单默认不含 `pg-types`，其顶层 `textParsers.init(...)` / `binaryParsers.init(...)` 被摇树；`getTypeParser` 永久回退 `noParse`，PostgreSQL 的 `bool` / `int4` / `json` 等全部以原始文本返回（`isPinned: 'f'`、`views: '0'`、`metadata` 为 JSON 字符串）。前端 `data.isPinned ? 是 : 否` 把非空字符串 `'f'` 判为真值。
- 取证：线上 `GET /api/posts` 返回 `"isPinned":"f"`；`isPinned=true` 过滤 `total: 0`（库内为真实 false，排除数据迁移）；修复前构建产物中 `textParsers` / `binaryParsers` 出现 0 次。
- 修复：
    - 新增 `modules/nitro-pg-types-side-effects.ts`：`nitro:init` 阶段把 `pg-types` 追加进 `nitro.options.moduleSideEffects`，并以 `nitro:build:before` 护栏断言注入生效。
    - 新增 `server/database/pg-value-types.ts`，并在 `initializeDB` 接入启动自检：PostgreSQL 下跑 `SELECT true, 1::integer, '{"ok":true}'::json` 探针，类型退化时记录 `[db-type-guard]` error（不抛出）。
    - `server/decorators/custom-column.ts`：`type: 'boolean'` 列统一注入归一化 transformer（`'t'/'1'/1` → true，`'f'/'0'/0` → false）。
    - `AdminNotificationSettings` / `InAppNotification` 的布尔列改用 `CustomColumn`，消除绕过点。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（527 文件 / 4471 用例通过，1 skipped）。
- `pnpm build`：PASS；产物 `chunks/nitro/nitro.mjs` 已包含 `textParsers.init` / `binaryParsers.init`。
- 真实 PostgreSQL 16 端到端（Docker + 重建产物）：修复前 `/api/posts` 返回 `isPinned: 'f'` / `views: '0'`；修复后返回 `isPinned=True/False (bool)`、`views=7/0 (int)`、`metadata` 为对象、`audioUrl` 由 `metadata.audio` 正确回填；`isPinned=true` 过滤 `total: 0`；启动日志出现 `pg-value-type-check` 且无 `db-type-guard` 报错。
- 定向测试：`server/decorators/custom-column.test.ts` + `tests/modules/nitro-pg-types-side-effects.test.ts` + `server/database/pg-value-types.test.ts` 共 26 用例 PASS。
- Review Gate：初审 Pass（0 blocker / 3 warning / 7 suggest）→ 修复 W1/W2/W3 与 S1/S3 后复审 Pass（0 blocker / 0 warning）。审计记录见 `artifacts/review-gate/2026-09-21-pinned-boolean-pg-types.md`。

### 未覆盖边界

- 未逐 preset 验证 dev / Vercel / Cloudflare 产物（依据 nitropack 源码与 node-server 产物判定因果充分）。
- 启动自检为 log-only（不 fail-fast），依赖日志可观测性；后续可选在 CI 增加产物断言（grep `textParsers.init`）。
- 未在真实 MySQL / SQLite 实例复核水合（仅单测覆盖归一化语义）。
- 本批无 UI 模板 / 样式 / 交互变更，UI 浏览器验证按「数据契约修复」口径豁免；用户可见行为已由真实 PostgreSQL API 契约验证。
- S7（补「非布尔列不注入 transformer」负向断言）仍敞口，非阻塞。

<!-- regression-window:end:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->

<!-- regression-window:start:phase67-m1-integration:第六十七阶段-M1:2026-09-20 -->
## 2026-09-20 第六十七阶段 M1 接入基座验证（PrimeVue → caomei-ui）

### 范围

- 接入 npm `caomei-ui@0.1.0`（迁移期精确锁定）；`caomei-ui/nuxt` 与 `@primevue/nuxt-module` 并存。（`@lucide/vue` 延后到真正直连图标的批次再声明为直接依赖。）
- 新增同名自动导入隔离模块 `modules/caomei-ui-coexistence.ts`（`useToast` / `useConfirm` / `useTheme`）。
- 新增并存期白名单载体 `lib/ui-library.ts`（路由 → 组件来源单一事实源）。
- 新增迁移基线重取脚本 `scripts/governance/count-primevue-usage.mjs` 与 npm 入口 `governance:count:primevue-usage`（含组件名清单再生成入口）。
- 包体预算并存期配额调整（`keyCssGzipBytes` 70KB → 85KB）与基线刷新。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（524 文件 / 4448 用例通过，1 skipped）。
- `pnpm build`：PASS；产物同时包含 `--caomei-color-primary` / `.caomei-button` 与 `--p-*`，双库同产物共存已实证。
- `pnpm test:perf:budget`：PASS（`keyCss` 73.35KB / 85KB 并存期配额；口径与决策见迁移方案 §8.4.1）。
- 定向测试：`lib/ui-library.test.ts` 8 用例 + `tests/modules/caomei-ui-coexistence.test.ts` 6 用例，共 14 用例 PASS。
- 自动导入隔离实证：`nuxt prepare` 无 `Duplicated imports` 警告；`.nuxt/imports.d.ts` 中 `useToast` 归 `primevue/usetoast`、`useConfirm` 归 `primevue/useconfirm`、`useTheme` 归 `composables/use-theme.ts`，caomei-ui 仅保留 `useLocale` / `provideLocale`。
- 迁移基线重取：组件 59 类 / 1515 处 / 148 文件；图标 629 处 / 145 文件；token 1403 处（`var()` 1323）/ 114 唯一 / 134 文件；`<Column>` 153；`.toggle()` 7。

### 未覆盖边界

- **E2E 关键集未稳定通过**：`pnpm test:e2e:critical` 首次运行 `auth-session-governance` 超时失败。已取证判定为 **flaky 而非回归**——firefox 单独运行全通过、chromium `--repeat-each=3` 为 2 通过 / 1 失败、两次运行失败的不是同一条测试、失败形态均为 timeout。**M2 采集 E2E 基线时必须显式登记已知 flaky 集**，并对比 M1 前后的 flaky 率是否有实质上升。
- **`CaomeiConfigProvider` 与组件内建文案 locale 注入延后**：本批只接入模块与自动导入的 `useLocale` / `provideLocale`，Provider 包裹与 `plugins/primevue-i18n.ts` 替换推迟到真正启用 caomei-ui 组件的批次，避免在 PrimeVue 仍在使用时提前切换文案来源。
- **CSS `@layer` 顺序决策已落盘**：保持既有层序 `primevue, momei-base, momei-overrides` 不变，caomei-ui 以未分层形态加载（依据：其实测无 `@layer`、无全局元素规则）。由此产生的定制约束见迁移方案「样式层叠与 @layer 决策」章节。
- 视觉验证回归（单元 / E2E / 截图三层）尚未建立，属 M2 范围；本批无 UI 可见变化。
- 白名单初始为空（尚无路由迁移），路由级隔离规则未被真实用例触发。

### 窗口结论适用性（2026-09-22 追加）

- **样式形态将被 0.2.0 取代**：本批基于 `caomei-ui@0.1.0` 的单体 `styles.css`；上游 `0.2.0` 已改为基础层 `theme.css` + 逐模块组件样式，接入基座待重锚（迁移方案 §3.6 / §8.4.1），届时 `keyCss` 复测并回落配额。本窗口的 `keyCss 73.35KB / 85KB` 结论**不代表重锚后状态**。**已于 2026-09-24 重锚完成**（见上方 M1b 窗口：`keyCss` 回落 60,684 字节 / 70KB 配额）。

<!-- regression-window:end:phase67-m1-integration:第六十七阶段-M1:2026-09-20 -->

<!-- regression-window:start:periodic-regression:weekly:2026-09-11 -->
## 2026-09-11 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly`
- 证据 artifact: `../../../artifacts/review-gate/2026-09-11-weekly-regression.md` / `../../../artifacts/review-gate/2026-09-11-weekly-regression.json`
- 结果摘要: `Reject`；blocker=1，warning=1。
- 已执行验证: test:coverage=PASS，security:audit-deps=FAIL
- 回归窗口: 323 行 / 13 条，归档判定=需要滚动归档。
- Review Gate: `Reject` / `blocker`；主要问题=security:audit-deps failed。
- 未覆盖边界: 活动日志当前 13 条记录，超过 8 条窗口

<!-- regression-window:end:periodic-regression:weekly:2026-09-11 -->

## 2026-07-27 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `artifacts/review-gate/2026-07-27-phase-close-regression.md` / `artifacts/review-gate/2026-07-27-phase-close-regression.json`
- 结果摘要: `Reject`；blocker=2，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=FAIL
- 回归窗口: 322 行 / 13 条，归档判定=需要滚动归档。
- Review Gate: `Reject` / `blocker`；主要问题=release:check:full failed -> test (Vitest)；regression-log window exceeded: 活动日志当前 13 条记录，超过 8 条窗口。
- 未覆盖边界: 活动日志当前 13 条记录，超过 8 条窗口

<!-- regression-window:end:periodic-regression:phase-close:2026-07-27 -->

## 2026-07-27 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly -- --dry-run`
- 证据 artifact: `artifacts/review-gate/2026-07-27-weekly-regression.md` / `artifacts/review-gate/2026-07-27-weekly-regression.json`
- 结果摘要: `Prepared`；blocker=0，warning=1。
- 已执行验证: test:coverage=DRY RUN，security:audit-deps=DRY RUN，docs:check:source-of-truth=DRY RUN，docs:check:i18n=DRY RUN，docs:check:line-count=DRY RUN，i18n:audit:missing=DRY RUN，duplicate-code:check=DRY RUN，governance:check:scripts=DRY RUN，governance:audit:eslint-debt=DRY RUN，governance:audit:comment-drift=DRY RUN，governance:audit:simple-duplicates=DRY RUN
- 回归窗口: 294 行 / 11 条，归档判定=需要滚动归档。
- Review Gate: `Prepared` / `warning`；主要问题=regression-log window exceeded: 活动日志当前 11 条记录，超过 8 条窗口。
- 未覆盖边界: 本轮为 dry-run，仅验证编排与回填，不代表真实回归执行结果。

<!-- regression-window:end:periodic-regression:weekly:2026-07-27 -->

## 2026-07-25 workflow pre-check（release，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=release`
- 证据 artifact: `artifacts/review-gate/2026-07-25-ci-precheck-release.md` / `artifacts/review-gate/2026-07-25-ci-precheck-release.json`
- 结果摘要: `Reject`；blocker=1，warning=0。
- 已执行验证: release critical files=PASS，release environment=FAIL
- Review Gate: `Reject` / `blocker`；主要问题=release environment failed。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:release:2026-07-25 -->

## 2026-06-10 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly`
- 证据 artifact: `artifacts/review-gate/2026-06-10-weekly-regression.md` / `artifacts/review-gate/2026-06-10-weekly-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=1。
- 已执行验证: test:coverage=PASS，security:audit-deps=PASS，docs:check:source-of-truth=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，i18n:audit:missing=PASS，duplicate-code:check=FAIL，governance:check:scripts=PASS
- 回归窗口: 189 行 / 7 条，归档判定=窗口健康。
- Review Gate: `Pass` / `warning`；主要问题=duplicate-code:check failed。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:weekly:2026-06-10 -->

## 2026-06-04 第四十二阶段收口回归

### 范围

- 目标：第四十二阶段「AI 深化与运营闭环」5 条主线全部交付后的阶段收口回归，覆盖 typecheck、lint、CWV 基线、代码审计与归档操作。
- 本轮覆盖：全仓 typecheck + ESLint (`--max-warnings 0`)，Code Auditor 审计及修复，plan 文档归档（roadmap 深度分片 + todo-archive 滚动归档）。
- 非目标：不包含浏览器端 E2E 回归测试，不包含 CWV 实际数值采集（由 CI `build-lighthouse` job 产出）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 无静态错误 |
| `pnpm lint` | Pass | ESLint `--max-warnings 0` 通过 |
| Code Auditor | Pass | 4 个问题（1H+3M）已修复提交 |
| CWV 基线 | 待 CI | 基础设施就绪，实际数值由 CI 产出 |
| roadmap.md 深度归档 | 完成 | Phase 22-24 迁入 `roadmap-phases-22-24.md`，主文档 799→719 行 |
| todo-archive.md 滚动归档 | 完成 | Phase 32-37 迁入 `todo-archive-phases-32-37.md`，主文档保留 Phase 38-42 |
| todo.md 状态 | 清理 | Phase 42 5/5 主线 `[x]`，进度与验收均已填写 |

### 未覆盖边界

- CWV 中位数基线需等待 CI 运行 `pnpm build && pnpm test:perf:cwv` 产出后，回填到性能规范 `docs/standards/performance.md`。
- `pnpm lint:i18n` 未在本轮单独执行，新增 i18n 键依赖 typecheck + 运行时验证。

<!-- regression-window:end:phase42-close:第四十二阶段:2026-06-04 -->
