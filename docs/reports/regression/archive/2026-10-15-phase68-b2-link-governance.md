# 回归历史归档：2026-10-15 第六十八阶段条目 2 第六路由窗口（`/admin/migrations/link-governance`）

本文档收录 2026-10-15 的第六路由窗口，于 2026-10-16 自 `docs/reports/regression/current.md`
滚动迁出（第七次归档），为条目 2 的后续路由窗口恢复 `docs:check:line-count` 余量
（迁出前 `current.md` 为 484 行）。

迁出方式：整体迁移（marker + 标题 + 正文 + end 成对保留），正文逐字未改。
引用检查：该窗口**未被** `docs/plan/**` / `docs/design/**` / `.github/**` 以节名短语引用
（`docs/design/governance/visual-parity-deviation-register.md` 中的第六路由校准记录是偏差处置表
自有内容，非指向 `current.md` 的锚点），故无需改写外部引用。
**待办**：`phase68-transition-shells`（过渡组件基建）窗口被 `docs/plan/todo.md` 以
「过渡组件基建窗口」的节名短语引用，下次归档该窗口时须同步改写该引用（与第六次归档的
「可见文案回归节」同类处置）。

<!-- regression-window:start:phase68-b2-link-governance:第六十八阶段-条目2-第六路由:2026-10-15 -->
## 2026-10-15 第六十八阶段 条目 2 第六路由 B2 迁移（`/admin/migrations/link-governance`）

### 范围

条目 2（B2 剩余数据页迁移一）的第六个路由 `/admin/migrations/link-governance` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 724 行 / 7 个 PrimeVue 列组件 / **30 处在册族开口标签（6 个组件名）**——是当前在册族标签最多的路由（`Button` 9 / `Tag` 7 / `Select` 4 / `InputText` 2 / `DataTable` 1 / `Column` 7），含**懒加载服务端分页 + 详情浮层 + 执行表单**三段交互。同名文件形态（`pages/admin/migrations/link-governance.vue`），守卫无需再改。

**本路由是当前差异最大者**（浅 32070px / 深 34819px，约为既有 6 条路由的 2.2–4.0 倍），故本窗口的归因段落显著长于前五条——差异由「约 20 个在册族组件替换 + 表头行高 -10px + 字段行盒 36px vs 36.39px 的 1px 累计位移」三部分构成，逐项证据见下。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/migrations/link-governance.vue` | `DataTable` + 7 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`；迁移前列组件**均未声明 `field`**，故按插槽语义命名 key）；页头刷新 / 执行区 / 筛选区 / 行内 / 浮层页脚共 9 处 `Button` → `CaomeiButton`（**可见文案落默认插槽**、图标走 lucide `#icon`）；`InputText`×2 → `CaomeiInput`；`Select`×4 → `CaomeiSelect`（筛选两处保留 `show-clear`）；`Tag`×7 → `CaomeiTag`（`severity` → `tone`：`info`→`primary`、`secondary`/`contrast`→`neutral`、`warn`→`warning`） | §6.1 / §6.2 / §6.3 / §5.3 / §5.5 |
| 同上 | **服务端分页页码基准切换**：`@page` 载荷由 PrimeVue 0 基改为 caomei 1 基，原实现恒 `page = event.page + 1` 改为直接取载荷；并补 `:page="page"` 进入受控分页 | 跨组件库事件语义（本页自持 `page`，未走 `useAdminList`） |
| 同上 | 动作列 `class="text-right"` → 列级 `align: 'right'`；其余列不新增显式宽度 | 迁移不改几何 |
| `pages/admin/migrations/link-governance.scss` | 新增 `&__field, &__filters { --caomei-select-max-width: 100% }`——**修复一处本批引入的几何回归**：caomei Select 字段外层默认带 `20rem` 上限（= 320px），会把执行区 / 筛选区下拉截到 **319px 内容宽**（迁移前占满网格单元格 421px）；token 须设在字段外层的**祖先**（`class` 只落触发器，自定义属性不向上继承） | §6.2「全宽：`fluid` → 默认 `width: 100%`；选择器家族另带 `20rem` 上限，需覆盖对应 `*-max-width` token」 |
| 同上 | 新增 `&__table { --caomei-data-table-pagination-justify: center }` 保持 PrimeVue 原居中口径 | §3.8 / §6.2 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/migrations/link-governance` | §5.5 |
| `pages/admin/migrations/link-governance.test.ts`（新增） | 14 条契约用例：页头刷新按钮、列定义与 `align`、`#cell-*` 插槽按 row 渲染（发起人 name→email→userId 回退链、摘要三行、`redirectSeedCount`）、Tag tone 四态映射、**服务端分页 1 基直接采用**（断言 `@page{page:2}` 写回 `page=2` 且按新页码重取）、筛选应用 / 重置的页码归位与查询参数、执行表单→请求体映射、apply 按钮启用门槛（需 `applyConfirmed` + `reviewedDryRunReportId`）、详情渲染（作用域 / 摘要 / 差异项 5 种状态 tone / redirect seeds）、空态、列表与详情失败分支、未在册族 PrimeVue 组件仍保留 | §8.2 层 ① |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵新增 `/admin/migrations/link-governance` → `.caomei-data-table, .admin-link-governance`（矩阵 9 → 10 行） | 层 ② 扩面 |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-link-governance` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；允许清单按 **9 个非重叠功能带**校准（各带声明值 = 该带实测差异像素本身，求和等于全图实测值） | §8.2 层 ③（门禁层） |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

**几何核验方法**：本路由差异量级异常（约为既有 6 条路由的 2.2–4.0 倍），故除「参考态 PNG 行列带扫描」外，**额外把迁移前源码临时恢复到 HEAD 就地构建一次**（`git checkout HEAD -- <页面/scss/lib>` → `pnpm build` → 浏览器探针 → 恢复改动 → 重建），从而取得两态**同口径的 `getBoundingClientRect` 实测值**（而非仅靠 PNG 推断）。

| 量测点 | 迁移前（PrimeVue） | 迁移后（caomei） | Δ |
| :--- | :--- | :--- | :--- |
| 文档高度 | 1247px | 1242px | **−5** |
| 执行区网格 `y` / 高 | 336 / 201 | 336 / 201 | 0 |
| 第 1 行 `MultiSelect` `y`（**未迁移，两态同为 PrimeVue**） | 356 / 36.39px | 356 / 36.39px（探针取整显示 36） | 0 |
| 第 2 行 `InputText`/`Input` `y` | 429 | 428 | −1 |
| 第 3 行 `Select` `y` | 501 | 501 | 0 |
| 筛选行 `y` | 732 | 731 | −1 |
| 复选框行 `y` | 562 | 561 | −1 |
| 执行动作行 `y` | 606 | 605 | −1 |
| 卡片 1 高 | 426 | 425 | −1 |
| 卡片 2 `y` / 高 | 666 / 359 | 665 / 356 | −1 / **−3** |
| 表格 `y` / 高 | 793 / 208 | 791 / 205 | −2 / −3 |
| **表头行高** | **43px** | **33px** | **−10** |
| 筛选下拉宽（网格单元格内） | 421px | 421px（修复后；修复前 319px） | 0 |
| 字段行盒高度 / 字号 | 36.39px / 16px | 36px / 14px | −0.39 / −2 |

> 表中「迁移前 / 迁移后」列为探针 `getBoundingClientRect` 的**整数取整**输出；仅当需要判定亚像素来源时才引用原始小数（见归因③）。故 Δ 列不代表逐点独立实测的精确差值。

**三部分归因**：

1. **组件替换（主体）**：约 20 个在册族组件（9 `Button` / 7 `Tag` / 4 `Select` / 2 `InputText` / 表格 7 列 + 分页器）替换为 caomei——字段外壳盒模型、字号（caomei 字段 14px vs PrimeVue 16px）、按钮边框 / 底纹 / 排版、Tag `tone` 色板均属 §6.2 / §6.3 已接受差异，处置走通道① `--caomei-*` token。
2. **表头行高 −10px**：PrimeVue `DataTable` 表头行 43px → caomei 33px。**与表体的关系**：表头 −10px 会把表体起点上移 10px，但 caomei 空态行比 PrimeVue 高约 7px，两者相抵后**表格总高仅 −3px**（208 → 205，`y` 793 → 791）——即表头变化被空态行高部分抵消，**不存在「表体与分页器整体上移 10px」**；表体内部（空态行 / 分页器）的差异见归因表与带 I 说明。
3. **字段行盒 0.39px 的亚像素累计 → 1px 级（整数取整）下游位移**：caomei 字段行盒 `36px`（固定高度 token `--caomei-control-height-md: 36px`，font 14px）vs PrimeVue `36.39px`（font 16px / line-height 18.4）——**第 1 行 `MultiSelect` 未迁移、两态同高**，真正缩短的是第 2 行（`CaomeiInput`）与第 3 行（`CaomeiSelect`），合计约 `2 × 0.39 ≈ 0.78px`。**该亚像素差是本批唯一可归因的几何来源，与观测到的下游 1px 级位移「量级一致」**（探针为亚像素输出：当前态字段行 `y=428.44`、筛选行 `y=730.92`；本表其余量测点的探针值为整数取整后的呈现，故 `429 → 428`、`732 → 731` 等记法是**取整表现**，不是逐点独立实测的完整 1px）。**本窗口不做逐点因果断言**：0.78px 的亚像素累计经浏览器行盒取整后，在下游不同元素上可能表现为 −1px 或 0px（例如第 3 行字段行顶实测两态均为 501），故只声明「量级一致 + 唯一可归因来源」，不声明每个量测点都发生 1px 位移。**该差异源于库侧字段设计口径，本批不做覆盖**（强行对齐需覆写 caomei 字段的 padding / line-height / font-size token，会改变库侧设计意图，超出「迁移不改几何」的可控范围）；已作为口径项登记上游反馈清单 §2.5。

**允许清单（9 个非重叠功能带，声明值 = 各带实测值）**：

| 带 | 区域（浅色坐标） | 浅 / 深（px） | 归因 |
| :--- | :--- | :--- | :--- |
| A | `x[120,380] y[80,160]` | 863 / 878 | 头部语言切换字段外壳（过渡组件 `ContentLanguageSwitcherV2`） |
| B | `x[1280,1440] y[80,160]` | 346 / 525 | 头部刷新按钮（`CaomeiButton` secondary 描边 + lucide 图标） |
| C | `x[40,1400] y[260,340]` | 2229 / 2263 | 执行区「标题 + 描述」文本带的 1px 位移（归因 3） |
| D | `x[40,1400] y[340,545]` | 10773 / 12901 | 执行区字段行（`CaomeiInput`×2 / `CaomeiSelect`×2 + label）：盒模型 + 字号 + 行盒高（归因 1+3） |
| E | `x[40,1400] y[545,600]` | 2574 / 2769 | 复选框行的 1px 位移（`Checkbox` 未迁移，差异全来自归因 3） |
| F | `x[40,1400] y[600,665]` | 2758 / 2569 | 执行动作按钮（干跑 / 执行改写，含 `tone="warning"`） |
| G | `x[40,1400] y[665,790]` | 6141 / 6336 | 报告列表卡片顶部 + 筛选行（`CaomeiSelect`×2 + 应用 / 重置按钮）+ 上游 1px 位移 |
| H | `x[40,1400] y[790,860]` | 5799 / 5993 | 表格表头行（底色 / 边框 / 字号 / 内边距 + **行高 −10px**）。另含**动作列表头对齐差异**：迁移前 `class="text-right"` 在 PrimeVue 表头被 `.p-datatable-column-header-content{display:flex}` 抵消（表头仍左对齐），而 caomei `align:'right'` 同时作用于表头（「操作」表头 x1241 → x1328，+87px）——即「`align` 等价还原 `text-right`」仅对表体成立，表头对齐属本批**新增差异**（已进允许清单） |
| I | `x[40,1400] y[860,900]` | 587 / 585 | **表体空态行**（`暂无治理报告`）：空态行高与文本位置差异。注：分页器位于 `y≈952`，**在本路由的 900px 视口截图之外**，故本带不含分页器 |

> 九带求和 = 全图实测值（浅 32070 / 深 34819），**带外像素为 0**、无余量、无低报——门禁复核时该路由的「未归因差异」应为 0px。

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/migrations/link-governance.test.ts tests/modules/ui-library-route-migration-guard.test.ts` = 41 用例通过（本页 17 条 + 守卫 24 条）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：`node scripts/testing/run-e2e.mjs --grep=extended --project=chromium` = **1 passed / 18.2s**（矩阵 9 → 10 行，含本路由；该用例已显式 `test.setTimeout(60000)`）。
- **层 ③（截图识别 · 门禁层）**：`pnpm test:visual:parity` **22/22 通过**；本路由浅 32070px / 2.475%、深 34819px / 2.687%，允许清单 **命中 9/9 条**、扣减后未归因 **0px**；其余 20 条零回归。
- **全量单测**：`pnpm test` 540 文件 / 4605 用例通过（1 skipped；较上一路由批次的 539 / 4590 为 **+1 文件 / +15 用例**）。**增量分解**：本页新增 **14** 条 + 守卫 **24** 条（守卫含一条随 `CAOMEI_UI_ROUTE_PREFIXES` 增长的循环用例，本批前缀 6 → 7 故 23 → 24）= 新增 15 条 ✓ 与全量 +15 一致。**计数口径提示**：仓库另有既有文件 `tests/pages/admin/migrations/link-governance.test.ts`（3 条，未改动），按 CLI 过滤器运行时会被一并命中，故 `vitest` 报「2 文件 / 17 条」——本窗口「本页 14 条」指**新增文件本身**。
- **包体**：本批未新增依赖，`pnpm build` 通过。

### 未覆盖边界 / 观察项

- **本路由未新增基线层用例**：理由同前四条路由（§8.2 层 ③ 采集对象「列表 / 表单 / 浮层各 1」已由既有 6 条基线满足；逐路由守线由门禁层承担）。**但本路由是本批唯一「差异量级异常」者**，其 9 带允许清单已按功能带细粒度登记，任何单带内的漂移增长都会被捕获（`allowed = min(带内差异, 声明值)`）。
- **字段行盒 0.39px 差异不做覆盖（已登记上游 §2.5）**：强行对齐需覆写 caomei 字段的 padding / line-height / font-size，会改变库侧设计意图并可能影响已迁移路由的既有基线；本批按「接受 + 登记」处置。该差异在多字段长页面上的可见后果是「文本 1px 重影」，单字段页面（前五条路由）几乎不可见。
- **`Card` / `MultiSelect` / `Checkbox` / `ProgressSpinner` 保持 PrimeVue**：四者均不在 B2 在册族清单内，本批已把 `Card` / `MultiSelect` 补入 §5.5 显式豁免枚举（此前仅列 `DatePicker` / `InputNumber` / `Checkbox` / `ProgressSpinner`），使「为何可在已迁移路由内保留 PrimeVue」有单点出处；页面级样式沿用 `--p-*` token 与 `:deep(.p-card-body)` 即因其仍在 PrimeVue 侧。
- **约 27% 页面高度不在门禁覆盖内（本路由特有）**：门禁为 1440×900 视口截图，本页文档高 1242px，故 `y>900` 的内容（表体下半 + 分页器 `y≈952` + 卡片 2 尾部）**不参与比对**；其中 `--caomei-data-table-pagination-justify: center`（本页分页居中 token）在本路由**未被门禁验证**——两态分页器都在画面外。如需覆盖，应另采 fullPage 参考态（按门禁 §7 前置条件在 CI 复采）或补基线层用例；本批按现状登记为未覆盖边界。
- 剩余 4 条路由（`subscribers` / `users` / `posts` / `friend-links`）均需先落共享壳过渡组件，条目 2 的剩余工作转入基建。

<!-- regression-window:end:phase68-b2-link-governance:第六十八阶段-条目2-第六路由:2026-10-15 -->
