# 回归归档：2026-10-16 第六十八阶段条目 2 第九 / 第十路由（friend-links / posts）

> 来源：`docs/reports/regression/current.md`（2026-10-16 第十一次滚动归档：新增「组件型目标第三批次（`/admin/marketing`）」窗口后 `current.md` 越过 `check-line-count` 的 warn>500 线；迁出条目 2 中最早的两个路由窗口）。
> 锚点改写：① `tests/visual/parity-budget.json` 中 2 处 `reason` 内的「见回归记录第九路由窗口」已同步改写为本分片路径；② `docs/plan/todo.md` 的「第十路由窗口」引用已改写为本分片「第十路由节」。另：本次归档在 `current.md` 留下 3 行孤立注释尾行（`-->`），已清理并登记归档脚本的静态检查缺口（backlog）。

<!-- regression-window:start:phase68-b2-friend-links:第六十八阶段-条目2-第九路由:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 2 第九路由 B2 迁移（`/admin/friend-links`）

### 范围

条目 2（B2 剩余数据页迁移一）的第九个路由 `/admin/friend-links` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（第 10 项）。该路由为**单文件大页面**（`pages/admin/friend-links/index.vue` 565 行，逻辑全部在路由自有 composable `use-admin-friend-links-page` 中），迁移前在册族用量 **55 处 / 6 个组件名**：`Column` 21 / `Button` 16 / `Tag` 6 / `InputText` 6 / `Select` 3 / `DataTable` 3（**3 个表格 / 21 列**，为条目 2 中列数最多的路由）。

**本路由是首个消费共享壳过渡组件 `AppUploaderV2` 的路由**（迁移方案 §5.5「组件内按路由择库」，跨边界展示型壳）；非在册族按批次口径保留 PrimeVue：`Dialog` ×3 / `ConfirmDialog` / `Toast` / `useConfirm` / `InputNumber` ×3 / `Textarea` ×3 / `Checkbox` ×6。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/friend-links/index.vue` | `DataTable` ×3 + `Column` ×21 → `CaomeiDataTable` ×3 + `columns`（`#body` → `#cell-{key}`；`field` 列沿用字段名作 key，无 `field` 的列按插槽语义命名 `category` / `isFeatured` / `isPinned` / `isEnabled` / `actions`；`#empty` 三个空态插槽原样保留）；`Button` ×16 → `CaomeiButton`（页头次要与主色、区块 icon-only 刷新、条件性「建议复核」ghost + warning + sm、行内编辑 / 删除 / 查看 icon-only ghost + rounded + tone，全部补 `:label` 可访问名）；`Tag` ×6 → `CaomeiTag`（`severity` → `tone`）；`InputText` ×6 → `CaomeiInput`、`Select` ×3 → `CaomeiSelect`（**移除 `fluid`**：caomei 字段默认 `width: 100%`）；`AppUploader` → `AppUploaderV2` | §6.1 / §6.2 / §5.3 / §5.5 |
| `composables/use-admin-friend-links-page.ts` | **语义色口径统一为 caomei `tone` 词表**：`getLinkStatusSeverity` / `getHealthStatusSeverity` / `getApplicationStatusSeverity` → `…Tone`（`info→primary`、`secondary→neutral` 两档为有损近似），并导出 3 个表单 / 列表类型供列定义使用 | §6.2 |
| `styles/pages/admin-friend-links.scss` | 字段容器 `.admin-friend-links__field` 增设 `--caomei-select-max-width: 100%`——caomei `Select` 的宽度 / `max-width` 钩子在**字段外层**（默认 20rem = 320px，`class` 只落触发器），本页表单为 2 列栅格（每列约 330px）、审阅弹窗更宽，不放开会截断（上游反馈 §1.1） | 上游 §1.1 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/friend-links`（第 10 项） | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 矩阵内 `/admin/friend-links` 行**就地更新**为 `.caomei-data-table, .admin-friend-links` | 层 ② |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-friend-links-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；允许清单按门禁报出的区域校准（浅 / 深各 4 区） | §8.2 层 ③ |
| `pages/admin/friend-links/index.test.ts`（重写） | 13 条契约用例：页头两按钮、三表列定义与插槽接线、`Tag` tone 映射（含条件性按钮）、动作集合形态与可访问名、空态、`AppUploaderV2` 消费、浮层表单控件迁移（6 `CaomeiInput` / 3 `CaomeiSelect`）与非在册族保留计数、页脚按钮 tone | §8.2 层 ① |
| `composables/use-admin-friend-links-page.test.ts` | 语义色用例改为 `tone` 词表并补边界档（`draft→primary`、`archived→neutral`、未知值→`neutral`） | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

**几何核验**（探针实测）：区块 `x32 y168 1376x215`、split `x32 y403 1376x199`、三表 `49,237 1342x129`（友链）/ `49,456 644x129`（分类）/ `747,456 644x129`（申请，同行并排）与参考态**区块位置一致**；差异为 caomei 表格的**空态行更高**（实测 tbody 行高 **97px** vs PrimeVue 约 76px）——**本路由在 parity 环境中三表均无数据**（种子数据为空，页面渲染 `#empty` 空态），故差异主体是空态行 + 表头 chrome，而非数据行或标签；该高度差使 split 区顶边由 `y373` 下移到 `y403`（**+30px**），已被允许清单区域 2 覆盖。

**差异区域（门禁报出）**：

| 区域 | 浅色 | 深色 | 归因 |
| :--- | :--- | :--- | :--- |
| `x[40,1400] y[240,360]` | 7925px | 9457px | 友链表（`DataTable` → `CaomeiDataTable`：表头底色 / 边框 / 字号 + **空态行高度**；本环境无数据，故不含数据行 / 标签渲染差异） |
| `x[40,1400] y[400,560]`（深色至 y600） | 12065px | 13638px | 下半区（分类表 + 申请表）同上表格差异 + **首表空态行高度差带来的整段位移**（+30px） |
| `x[1200,1440] y[80,120]` | 1540px | 3985px | 页头两个动作按钮（`CaomeiButton` secondary / 默认 vs PrimeVue `Button`，含暗色底纹差异） |
| `x[1360,1400] y[160,240]` | 107px | 110px | 区块 / 表格右缘的边框与溢出差异 |

### 验证结果

- **层 ①（单元）**：`pnpm test` **553 文件 / 4762 用例通过**（1 skipped；较上一批 +12 用例）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：管理端定向 `admin.e2e.test.ts` + `admin-workflow.e2e.test.ts` = **8 passed / 50.1s**（含扩展矩阵 10 行，`/admin/friend-links` 行已就地更新）。
- **层 ③（截图识别 · 门禁层）**：本路由浅 **21637px / 1.670%**（允许清单命中 4/4）、深 **27190px / 2.098%**（命中 4/4），未归因 **0px**；全量 `pnpm test:visual:parity` **22/22 通过**（10 个已迁移路由 20 testName + 1 个待迁移路由 2 testName）。
- **归档**：第七次滚动归档迁出第六路由窗口（`phase68-b2-link-governance`，85 行）至 `archive/2026-10-15-phase68-b2-link-governance.md`；`current.md` 由 484 行降至 398 行（归档后中间态），写入本窗口后为 464 行（`docs:check:line-count` 口径）。
- **依赖同步（本批开工前置）**：按用户指令 `git pull --rebase` 同步远端 15 个 Dependabot 提交（本地 27 笔全部干净重放，**无冲突**），并复跑基线层 `pnpm test:visual` **14/14**、全量单测与 lint 确认依赖升级（`@lucide/vue` 1.55 / `zod` 4.6.6 等）无回归；`caomei-ui` 未被抬版（仍 `0.6.0`），不触发升级纪律。

### 提交拆分依据（本批规模超 §2.8 单提交阈值的说明）

本批工作树合计 **16 个路径 / 983 行新增**（`git diff --numstat` 新增列 + 未跟踪文件逐文件计数；**含首轮审计修复增量**——迁移方案 §6.2 补记与 `backlog.md` 行数同步，随笔 1 提交），超过「单提交 ≤10 文件 / ≤800 行新增」，按职责拆为 **4 笔**，每笔均在双阈值内：

| # | 提交主题 | 文件数 | 新增行（逐文件复算） | 依赖顺序 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 治理记录：第七次滚动归档 + 第九路由窗口 / 校准记录 / 进度 | 7 | 188 | 无 |
| 2 | 路由自有 composable 语义色口径 + 字段容器宽度口径 | 3 | 30 | 无 |
| 3 | 页面迁移 + 路由登记 + E2E 矩阵 + parity 台账 | 5 | 370 | 依赖 2 |
| 4 | 页面契约用例 | 1 | 395 | 依赖 3 |

拆分依据：① 按「治理记录 / composable 与样式 / 实现与台账 / 测试」切分；② 语义色口径（composable）与字段宽度口径（样式）同笔，二者均为页面的前置依赖；③ 页面测试单独成笔（368 行），确保每笔 ≤800 行。

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- **表格空态行高度差异**：caomei 空态行 97px vs PrimeVue 约 76px，使含表格的区块整体更高；属组件替换本身，已进允许清单。
- **门禁无法覆盖本路由的数据行 / 标签渲染**（重要）：parity 环境**种子数据为空**，三表均渲染 `#empty` 空态 → `Tag` 的渲染（含首轮审计发现的「`CaomeiTag` 无 `value` prop 导致空标签」缺陷）**不在任何自动门禁的覆盖内**；该缺陷由首轮审计以源码 + SSR 产物取证发现并修复，已同步在迁移方案 §6.2 补记 `Tag` 可见文案陷阱。**建议**：为含状态标签的列表路由补一条数据行级断言（E2E 或组件级），封堵同类「桩自造 prop」漂移。
- **`Select` 宽度口径的第三次出现**：本批在**字段容器**上放开 `--caomei-select-max-width`（上游 §1.1）。三次处置位置不同（包装元素 / 字段容器 / 字段容器），根因同一：caomei `Select` 的 `class` 只落触发器、宽度钩子在字段外层。**建议后续把该口径写入迁移方案 §6.2 的执行提示**（避免每个新路由重新踩一次）。
- **语义色口径迁移**：`info` / `secondary` 两档为有损近似（§6.2），本批把三处 severity 函数统一改名并返回 tone；公开页 `pages/friend-links.vue` 有**同名但独立**的 `getHealthStatusSeverity`（未迁移，不在本批范围）。
- **`fluid` 移除**：本批在 6 个 `InputText` 与 3 个 `Select` 上移除 `fluid`（caomei 字段默认全宽）；非在册族的 `InputNumber` / `Textarea` 仍保留 `fluid`（PrimeVue 语义，随 B3 批次处理）。

<!-- regression-window:end:phase68-b2-friend-links:第六十

<!-- regression-window:start:phase68-b2-posts:第六十八阶段-条目2-第十路由:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 2 第十路由 B2 迁移（`/admin/posts`）+ 条目 2 收口

### 范围

条目 2（B2 剩余数据页迁移一）的**最后一条**路由 `/admin/posts`（列表页）按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（第 11 项）。该页 624 行 / **31 处在册族开口标签（10 个组件名）**——是本条目**在册族组件名最多**的路由（`Column` 14 / `Button` 7 / `Tag` 3，以及 `Badge` / `DataTable` / `IconField` / `InputIcon` / `InputText` / `Select` / `ToggleSwitch` 各 1），也是**唯一含行多选**的路由。三项「首次」：首个消费 `CaomeiSwitch`；首个使用 `selection-mode="multiple"` + 冻结列 `frozen: 'right'`；首个以 `headerStyle` / `bodyStyle` 镜像 PrimeVue `Column` 的 `style` / `class`（实测后者同时落 `th` 与 `td`）。

本批同时完成**条目 2 收口**：10 条数据列表路由全部迁移，parity 门禁 `PENDING_ROUTES` 清空，三件套过渡组件（`PostAuditBadgeV2` / `PostAuditDialogV2` / `PublishPushDialogV2`）由「仅落基建」切换为「被已迁移路由消费」，`/admin/posts/[id]` 成为本族**唯一**剩余 V1 消费者。

非在册族按批次口径保留 PrimeVue：`ConfirmDeleteDialog`、三件套 V2 内的浮层壳 `Dialog` 与 `ProgressBar`（B4）、`post-media-preview-cell.vue` 的 `Image`（展示容器，B4）、`v-tooltip` 指令。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/posts/index.vue` | `DataTable` + 14 个 `Column` → `CaomeiDataTable` + `columns`（`#body` → `#cell-{key}`；有 `field` 的列沿用字段名作 key，`author.name` / `category.name` 由 `accessor` 承载以避免含点号的插槽名，无 `field` 的列按插槽语义命名 `translations` / `audit` / `actions`；`<Column selection-mode="multiple" />` → 表格级 `selection-mode="multiple"` + `row-key="id"`）；`Button` ×7 → `CaomeiButton`（页头两个走默认插槽可见文案；行内 5 个改 0.6.0 `iconOnly` + lucide `#icon`，并按契约补 `:label`——迁移前编辑 / 删除两个按钮**既无可见文本也无可访问名**，复用既有 `common.edit` / `common.delete` 键）；`IconField` + `InputIcon` + `InputText` → `CaomeiInput` 的 `#prefix`（图标换 lucide `Search`）；`ToggleSwitch` → `CaomeiSwitch`（`input-id` → `id`，保留原生 `label[for]` 关联与可访问名推导）；`Select` → `CaomeiSelect`（`show-clear` 沿用；PrimeVue 专有 `@change` → `@update:model-value`）；`Tag` ×3 → `CaomeiTag`（**可见文案落默认插槽**）；`Badge` → `CaomeiBadge`（**保留 `:value`**，与 Tag 不同）；三件套 `PostAuditBadge` / `PostAuditDialog` / `PublishPushDialog` → `…V2`（消费处静态择库） | §6.1 / §6.2 / §5.5 / §5.3 |
| 同上 | 状态 Tag 的 `severity` → `tone` 转换落在**页面本地**（`SEVERITY_TO_TONE_MAP`：`info→primary`、`secondary→neutral` 为有损近似），不改共享 helper `getPostStatusSeverity`——后者同时服务 `/admin/posts/[id]` 编辑器路由（本阶段仍为 PrimeVue）且有单测锁定 PrimeVue 词表 | §5.5「路由内组件来源唯一」+ §6.2 |
| 同上 | 列声明保真：`header-style` → `headerStyle`；`style` → `headerStyle` + `bodyStyle` **两侧镜像**（PrimeVue `Column` 的 `style` / `class` 实测同时落 `th` 与 `td`）；`header-class` / `body-class` → `headerClass` / `bodyClass`；`frozen` + `align-frozen="right"` → `frozen: 'right'`；条件列 `language` 以同一 `!filters.aggregate` 条件决定是否入 `columns`；`views` 的 `width: 6rem` 两侧镜像 | 上游反馈 §2.2 / §2.7；本批两态探针实测 |
| 同上 | 几何保真三处：搜索字段按参考态实测 **261px** 显式约束（caomei 字段默认 `width: 100%`）；状态选择器 **10rem** 由**包装元素**承载（`class` 只落触发器，上游 §1.1）；`--caomei-data-table-pagination-justify: center` 保持分页居中 | §6.2 执行提示；迁移不改几何 |
| 同上 | 迁移前 `table-style="min-width: 80rem"`（PrimeVue `scrollable` + 冻结列形态）以 `:deep(.caomei-data-table__table)` 保留；翻译徽标按原 `.translation-badge.p-badge` 口径以 `--caomei-badge-{height,min-width,padding-x,font-size}` token 还原（24px / 32px / 4px / 0.7rem） | 通道① token；迁移不改几何 |
| `components/admin/posts/post-media-preview-cell.vue` | 路由自有组件随页迁移（§5.5「路由自有」）：`Button`（`:icon` 二态 `pi pi-play` / `pi pi-times` + `aria-label`）→ `CaomeiButton`（`iconOnly` + `#icon` 内 lucide `Play` / `X` 条件渲染 + `:label`）；`Image`（展示容器）维持 PrimeVue | §5.5 / §6.2 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/posts`（第 11 项） | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 扩展矩阵新增 `/admin/posts` 行（就绪选择器 `.caomei-data-table, .admin-page-container`），与既有首条 `/admin/posts` 页头用例互补 | 层 ② |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-posts-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`（`PENDING_ROUTES` 清空并注明「待迁移层已空」）；允许清单按 **3 个非重叠功能带 + 2 个头部区域**校准（见下） | §8.2 层 ③ |
| `pages/admin/posts/index.test.ts`（重写） | **23 条契约用例**：页头两按钮（可见文案 / 未选中不渲染批量导出）、筛选行（`#prefix` lucide `Search` / 6 项状态选择器 + `show-clear`）、`CaomeiSwitch` 的 `id` 与 `label[for]`、12 列稳定顺序 + 条件列 `language` 出现 / 消失 + 动作列 `frozen: 'right'`、列 `class` 两侧镜像、单元格插槽（状态 / 置顶 `tone` 映射、封面 / 播客预览、翻译徽标 `:value` + `tone`、语言 Tag）、动作集合形态与可访问名（含图标分支互斥断言）、跳转 / 导出 / 删除动作、`pageIndexBase: 1` 与受控分页 / 多选 / 每页条数候选、`@page` / `@sort` 原样转发、状态选择器与聚合开关触发刷新、**消费处静态择库（V2 标记）**、审计徽标契约、空态 | §8.2 层 ① |
| `components/admin/posts/post-media-preview-cell.test.ts` | 桩由 `Button` 改为 `CaomeiButton`（按库契约补 `iconOnly` / `label`，不再自造 `ariaLabel` 等不存在形态）；新增**二态图标互斥**断言（`svg.lucide-play` ↔ `svg.lucide-x`）与可访问名翻转断言 | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

**几何核验**（同一探针脚本、同一视口 1440×900 / DSF1 / zh-CN；迁移前为「改动前的 HEAD 构建」实测，迁移后为当前构建实测）：

| 元素 | 迁移前（PrimeVue） | 迁移后（caomei） | 判定 |
| :--- | :--- | :--- | :--- |
| 搜索字段 | `x88 y204.39 261×36.39` | `x88 y204 261×36` | 宽度**逐值一致**（按参考态实测约束 261px）；高度差 0.39px 属字段行盒口径（上游 §2.5） |
| 聚合开关 | 40×24（`y210.58`） | 40×22（`y211`） | 高度差 2px；标签 `x1092 84×16.09` **两态一致** |
| 状态选择器 | `x1192 160×36.39` | `x1192 160×36` | 宽度由包装元素承载后**逐值一致** |
| 表格宽 | 1674px（13 列） | 1656px（13 列） | **仅选择列 52 → 34px**；其余 12 列宽**逐值一致**（240 / 128 / 112 / 96 / 112 / 224 / 128 / 128 / 70 / 144 / 112 / 128） |
| 表头行高 | 61.78px | 34.5px | PrimeVue 表头文本在 `th` 内换行为两行 vs caomei `white-space: nowrap` |
| 数据行高 | 145px | 125px | 动作列 3 行 icon-only 按钮主导行高（120 → 108px） |
| 分页器 | 内容 `x568.09 w303.8`（中心 x≈720） | `nav x618 w204`（中心 x≈720） | **水平居中两态一致**（token 生效）；垂直随表格总高（263.78 → 204px）上移 47.5px |
| 翻译徽标 | 42.81 / 44.05 × 24（`min-width` 32px / `padding 2px 4px` / `font 11.2px`） | 44.81 / 46.05 × 24（同口径 token 覆盖） | 高度 / 最小宽 / 内边距 / 字号按原口径还原，宽度差异仅来自库侧排版 |
| 头部创建按钮 | `x1262 114×36.39` | `x1274 102×36` | 右边缘（x=1376）与高度对齐；宽度差属按钮排版差异 |

**差异区域（门禁报出，按 3 个非重叠功能带登记）**：

| 功能带 | 浅色 | 深色 | 归因 |
| :--- | :--- | :--- | :--- |
| 筛选行 `y[200,244]` | 2143px | 2221px | `CaomeiInput` / `CaomeiSwitch` / `CaomeiSelect` 外壳与控件高度（字段行盒 36 vs 36.39px、开关 22 vs 24px） |
| 表格区 `y[244,432]` | 17569px | 19488px | 表头行高 61.78 → 34.5px、数据行高 145 → 125px、选择列 52 → 34px 致整表左移 18px，叠加表头 / 行底色与冻结列渲染差异 |
| 分页器与卡片下缘 `y[432,560]` | 1747px | 4313px | 分页器随表格总高上移（居中口径已由 token 保持）+ 卡片下缘位移 60px（暗色下页面底与卡片底对比更强，故像素更高） |
| 头部操作按钮 `x[1240,1400] y[80,160]` | 955px | 986px | `CaomeiButton`（primary 实底 + lucide 图标）vs PrimeVue `Button`（`label` + `pi` 图标） |
| 头部语言切换 `x[160,360] y[80,160]` | 863px | 878px | 跨路由共享壳过渡组件 `ContentLanguageSwitcherV2`（与既有 9 条路由同区域同量级） |

各带声明值 = 该带实测差异像素本身（浅 2143 + 17569 + 1747 + 955 + 863 = 23277px；深 2221 + 19488 + 4313 + 986 + 878 = 27886px，均无带外像素、无余量）。

### 验证结果

- **层 ①（单元）**：`pnpm test` **553 文件通过 / 1 skipped（554 文件），4779 用例通过 / 1 skipped（4780 用例）**（较上一批 **+17 用例**：本页契约用例由 6 条扩为 23 条，媒体预览单元二态断言同量替换；216.7s）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（既有 7 条 warning，新增文件零警告）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：管理端定向 `pnpm exec playwright test tests/e2e/admin.e2e.test.ts tests/e2e/admin-workflow.e2e.test.ts --project=chromium` = **8 passed / 11 skipped / 49.3s**（含扩展矩阵新增的 `/admin/posts` 行——矩阵 11 行在本机隔离复跑 30.6s，仍显著低于既有 `test.setTimeout(60000)` 预算；skipped 为既有登录前置跳过，与本批无关）。
- **层 ③（截图识别 · 门禁层）**：本路由浅 **23277px / 1.796%**（允许清单命中 5/5）、深 **27886px / 2.152%**（命中 5/5），未归因 **0px**；全量 `pnpm test:visual:parity` **22/22 通过**（11 个已迁移路由 22 testName；`PENDING_ROUTES` 清空后待迁移层已无用例，且无消费者的 `ALL_PARITY_ROUTES` 兼容导出已随本批删除——待迁移层本身保留，作为 B3 / 条目 3 的落点）。
- **归档**：第八次滚动归档迁出本条目第三批次 4 个窗口（`phase68-b2-ad-placements` / `phase68-transition-shells` / `phase68-b2-subscribers` / `phase68-b2-users`）至 `archive/2026-10-14-to-2026-10-15-phase68-b2-batch3.md`，并**同步改写** `docs/plan/todo.md` 中「过渡组件基建窗口」的节名短语引用（第四次归档后的既定口径：窗口归档与锚点改写一并执行）；`current.md` 由 464 行降至 182 行（归档后中间态，均取 `docs:check:line-count` 口径），写入本窗口后为 **271 行 / 5 个窗口**（`docs:check:line-count` 口径；`wc -l` 为 270）。
- **口径沉淀**：迁移方案 §6.2 新增**执行提示**（字段宽度钩子 / 列定义 / 可见文案三条），闭合第九路由批次登记的「口径写入 §6.2」待办；上游反馈清单新增 **§2.7**（`DataTable` 无列最小宽契约、选择列宽度不可配置、`width` 单位口径）。

### 提交拆分依据（本批规模超 §2.8 单提交阈值的说明）

本批工作树合计 **22 个路径 / 1790 行新增**（`git diff --numstat` 新增列 + 未跟踪文件逐文件计数；含 2 个二进制基线快照，不计行数），超过 [开发规范 §2.8](../../standards/development.md) 的「单提交 ≤10 文件 / ≤800 行新增」，按职责拆为 **3 笔**，每笔均在双阈值内：

| # | 提交主题 | 文件数 | 新增行（逐文件复算） | 依赖顺序 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 治理记录：第八次滚动归档（含「过渡组件基建窗口」锚点改写）+ 第十路由窗口 / 校准记录 / 上游 §2.7 / §6.2 执行提示 / 条目 2 收口 | 8 | 458 | 无 |
| 2 | 页面迁移 + 路由自有组件 + 路由登记 + E2E 矩阵 + parity 台账与待迁移层收口 + 采集脚本退出语义 + 基线层快照刷新 | 10（含 2 个 PNG） | 568 | 无（与 1 互补） |
| 3 | 页面 / 组件 / 事实源契约用例 + 采集脚本守卫 | 4 | 764 | 依赖 2 |

**提交后实测（`git show --numstat` 逐笔复算）**：`pre-commit` 的 `lint-staged` 会把被其覆盖的已暂存文件重新 `git add`，本批因此把 `tests/visual/parity/pending-routes.visual-parity.test.ts`（7 行）由第 2 笔扫入第 1 笔——落库实测为 **第 1 笔 9 文件 / 465 行、第 2 笔 9 文件 / 561 行、第 3 笔 4 文件 / 764 行（合计 22 路径 / 1790 行）**；三笔仍全部满足 ≤10 文件 / ≤800 行，拆分结论不变（同第九路由批次的同类校正）。

拆分依据：① 按「治理记录 / 实现与台账 / 测试」切分；② 治理记录先行——`pre-commit` 的 `lint-md --fix` 会重排 `current.md` 并顺带 stage，先提交含该文档的一批可使后续批次的钩子对其无操作（既有踩坑口径）；③ 契约用例（700 行）独立成笔，确保每笔 ≤800 行。

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- **选择列宽度不可配置**（上游 §2.7）：PrimeVue 52px vs caomei 34px，无 prop / token 可覆盖，使整表左移 18px。本批按「接受 + 登记」处置，不引入魔法数字选择器覆盖；若上游补齐钩子，须重跑本路由 parity 并重校准允许清单（已登记 backlog）。
- **`/admin/posts/[id]` 子路由的被动波及（已显式核对）**：`CAOMEI_UI_ROUTE_PREFIXES` 的登记语义是「前缀**及其子路由**」，故登记 `/admin/posts` 后编辑器路由 `/admin/posts/[id]` 对**路由择库型**过渡组件一律解析为 caomei-ui。本批逐处核对：全仓仅 3 处消费 `lib/ui-library.ts` 的路由择库（`AdminPageHeader` / `AppAvatarV2` / `AppUploaderV2`），而编辑器路由**不使用** `AdminPageHeader`（用自有 `PostEditorHeader`），也不消费 `AppAvatarV2` / `AppUploaderV2`（`post-editor-media-settings.vue` 直接引用 **V1** `AppUploader`），故**当前无被动混用**；三件套过渡组件为「消费处静态择库」（不经事实源），`[id]` 继续用 V1。**风险留存（已登记）**：若后续把 `post-editor-media-settings.vue` 的 `AppUploader` 换成 `AppUploaderV2`，编辑器会顺带切到 caomei 组件——届时须先迁移该路由或在组件内显式排除。
- **基线层刷新**：`tests/visual/__screenshots__` 中 `/admin/posts` 的 2 张基线快照（浅 / 深）为 M2 时期采集的**迁移前 PrimeVue 原貌**，本批按既有口径用 `pnpm test:visual:update` 刷新为迁移后现状（`pnpm test:visual` 随后 14/14 通过）；门禁层参考态（`tests/visual/parity/reference/`）**未受影响、未重采**（两者目录与用途互不覆盖）。
- **固定 `pause` 之外的同步风险**：本路由 parity 用例未新增 `readyResponse` / `readySelector`（沿用迁移前口径）——首屏数据为种子 1 篇文章且已稳定（迁移前后各 3 次复跑实测 0px 漂移）。若后续种子数据变化导致行数波动，须按 `/admin/users` 的口径补 `readyResponse: '/api/posts'` + `readySelector`。
- **数据行渲染已纳入门禁（本条目首次）**：与 `/admin/users` 同型，本路由参考态**含数据行**（种子 1 篇），故 `Tag` / `Badge` / 行内按钮的渲染**在门禁覆盖内**——这正是第九路由窗口登记的「建议为含状态标签的列表路由补行级断言」在本路由的自然落地（门禁 + 页面契约用例双覆盖）。
- **幻影类收尾**：列上的 `class="hidden sm|md|lg:table-cell"` 在本仓**无任何可命中表格单元格的样式规则**（全仓 SCSS 与构建产物均无 `table-cell` 定义；`components/app-uploader.scss` 内的 `.hidden` 是 `.app-uploader` 下的 scoped 嵌套规则，不命中表格 `th` / `td`；实测列宽差异为 0）。按批次口径「保留原声明、不静默丢弃既有意图」两侧镜像为 `headerClass` / `bodyClass`，并保持为迁移期幻影类收尾项（与 `p-fluid` / `*__dialog` 同批清理，见 backlog）。
- **受控分页的语义边界（与既有 5 条已迁移路由同型）**：迁移前 PrimeVue 未绑定 `v-model:first`（组件自持页码），本页改为受控 `:page`，使「筛选后回到第 1 页」由 `page` 状态统一驱动；代价是 caomei 的 `watch([rows, totalRecords])` 在受控下提前返回，**不再有「总条数收缩时自动夹取页码」的内部收敛**——极端场景（删除末页最后一条后 `page` 越过末页）下分页器会停在越界页。本批按「迁移不改流程」处置并在此登记，未追加行为改动。
- **图标字体残留（非在册族）**：`post-media-preview-cell.vue` 的两处空态图标仍为 `pi pi-image` / `pi pi-headphones`（`pi` 图标不在批次在册族，本条目非目标亦含「不做图标全量替换」）——B4 卸载 PrimeVue 前须随图标批次一并替换（已在本窗口登记）。
- **共享 helper 未改写的理由已落注释**：`getPostStatusSeverity` 的词表转换放在页面本地（而非 helper），避免波及 `/admin/posts/[id]` 与其单测；待编辑器路由迁移时再统一口径。
- **单测覆盖的剩余缺口（审计建议项，未在本批补齐）**：`confirmRepush` → `PublishPushDialogV2.open` 的载荷、`handleRepushConfirm` 的 `$fetch` 与成功 / 失败分支、`handleDelete` 的 `$fetch → close → load` 链路、`runAudit` / `handleReAudit` 的请求与结果写回，以及 `handleExport` 在聚合关闭时的 `all: false` 分支——均属既有逻辑的旁路（本批未改动其实现），登记为后续测试补强候选；本批已补的是**新迁移引入**的两处高风险盲区（状态 tone 六态、路由登记加钉）与批量导出的正向对照。
- **审计期内的收口（A 阶段三轮分区审计结论 → 修复）**：① 实现分区 `Pass`（1 warning + 8 suggest）——已按 warning 补 `lib/ui-library.ts` 的子路由例外与可达性核对结论，并修 4 条注释归因（幻影类口径 / 徽标 24px 来源 / `warn` 词表 / `:exportable="false"` 惰性），顺带删除本文件既有的两处死代码（未使用的 `useToast` 导入与 `isTranslationPublished`）；② 测试分区 `Pass`（2 warning + 7 suggest）——两个**存活 mutant** 已补测：状态 `tone` 六态逐档断言（原仅覆盖 2 态）与 `CAOMEI_UI_ROUTE_PREFIXES` 对本批登记项的显式加钉（原删条目不报错）；另补批量导出的正向对照与 `handleBatchExport` 的 id 展开断言，改锚点由 `/admin/settings`（待迁移路由）改为结构性不会登记的 `/settings`；③ 台账/文档分区 `Reject`（2 blocker + 2 warning + 7 suggest）——已修治理表脱离表格（空行断开）、提交拆分表数字重锚、中间态行数口径、迁出空行残留；并针对「参考态齐备后 HEAD 全量采集硬失败」在就地采集块补 `--pass-with-no-tests`（含静态守卫用例），删除无消费者的 `ALL_PARITY_ROUTES` 导出，更新待迁移层文件头语义与处置表列头日期口径。

<!-- regression-window:end:phase68-b2-posts:第六十
