# 2026-09-25 需向上游 caomei-ui 反馈的问题清单（momei 迁移沉淀）

> 来源：momei 侧 PrimeVue → caomei-ui 迁移（第六十七阶段：接入基座 / 视觉回归基座 / token 语义层 / B2 试点页 `/admin/comments`），以及对 B2 全部目标页与共享组件依赖的扫描。
> 口径：只收录**迁移中实际踩到或实测确认**的问题；已在库文档中明确声明的「有意差异」不重复列入（见文末「非问题」）。
> 状态：**上游已评估落档**（上游 commit `bedd2de`，2026-09-25）：真实缺口 3 条（1.3 / 1.4 / 1.5）入上游 Backlog §1.1 待决策；文档缺口 3 条（1.1 / 2.2 / 2.3）入上游 Backlog §1.6；设计如此 2 条（1.2 / 2.1）；`Select` `null` 值支持不纳入（有意契约），结论留档上游 Backlog §3。逐条处置见各条「上游处置」，落点记录见文末指针。
> **后续（2026-10-13 复核）**：3 条真实缺口（1.3 / 1.4 / 1.5）**已由库侧 `caomei-ui@0.4.0` 交付**并在 `0.6.0` 产物中实测存在（见各条「交付复核」）；文档缺口 1.1 / 2.2 / 2.3 的补齐情况未在本轮复核，仍以库侧文档为事实源。复测证据见 [回归记录](../../reports/regression/current.md) 第六十八阶段 caomei-ui 漂移收口节。
> 事实源：`caomei-ui@0.2.0` 产物与仓库文档（本机 `/root/projects/caomei-ui`）；「交付复核」条目按 `caomei-ui@0.6.0` 产物复测（2026-10-13）。

## 1. 建议优先处理（会在下游造成静默失效或重复补丁）

### 1.1 `Select` 的 `class` 落在触发器，宽度 / `max-width` 钩子在字段外层

- **现象**：`<CaomeiSelect class="x">` 的 `class` 经 `$attrs` 透传到 **触发器**（`.caomei-select`），而 `--caomei-select-max-width` 的宿主是字段外层 `.caomei-select__field`。因此下游想「按容器宽度约束选择器」时，把宽度写在组件上**静默无效**，必须再包一层容器。
- **实测**：B2 试点页首版把宽度 `class` 放在组件上，选择器实测宽 **305px**（未被 180px 约束）；改为包装元素后回到 180px。
- **影响**：筛选行/表单列布局出现非预期宽度，且无报错。
- **建议**：文档在「主题与样式设计 §4.1 / Select 页」显式声明 `class` 落点为触发器；或提供根元素/字段层的 class 透传（如 `fieldClass`）。
- **上游处置**：判定为**文档缺口**，登记上游 Backlog **§1.6**。

### 1.2 `optionValue` 对 `null` 选项静默不渲染

- **现象**：`optionValue` 解析结果非 `string` / `number` 的选项**不渲染**；既有下游（PrimeVue `optionValue` 允许任意值）普遍用 `value: null` 表达「全部 / 不限」，迁移后该选项**静默消失**。
- **实测**：momei 状态筛选的「全部」选项需改为哨兵字符串（如 `'__all__'`）+ 边界还原 `null` 才能保留；同类写法在 B2 多个列表页重复出现（`/admin/comments` 状态筛选、`/admin/users` 的角色 / 状态筛选与封禁弹窗的「永不过期」，均按该口径处置）。
- **影响**：筛选器丢失「全部」选项，用户无法重置筛选（无报错提示）。
- **建议**：对解析为 `null` / `undefined` 的选项在开发期给出告警；或支持 `null` 值选项（用独立哨兵区分「未选择」）。
- **上游处置**：判定为**设计如此**——`optionValue` 非 `string` / `number` 不渲染属有意契约；其中「支持 `null` 值选项」的建议**不纳入**，判为有意契约，结论留档上游 Backlog **§3**。

### 1.3 无「图标按钮」形态

- **现象**：表格行内动作按钮（仅 `#icon`、`variant="ghost"`）在 caomei `Button` 上仍按 `--caomei-button-padding-x` 渲染，非方形；下游需自行 `--caomei-button-padding-x: 0` + 固定宽度补丁。
- **实测**：B2 试点页为 3 个行内动作按钮各加一条本地类；`posts`/`users` 等页面预计同样重复。
- **建议**：提供 `iconOnly`（或「无默认插槽内容时自动收敛为方形」）；并在 Button 页给出迁移写法。
- **上游处置**：判定为**真实缺口**，登记上游 Backlog **§1.1 待决策**。
- **交付复核（2026-10-13）**：**已交付** —— `caomei-ui@0.4.0` 为 Button 新增 `iconOnly` prop（`dist/components/button/types.d.ts` 有 `iconOnly?: boolean`）。momei 侧行内图标按钮的本地类补丁写法**不再是必需项**，B2 剩余页应改用 `iconOnly`（见迁移方案 §5.5）。

### 1.4 分页器对齐不可配置

- **现象**：`DataTable` 分页容器固定右对齐（`justify-content: flex-end`），PrimeVue 默认为居中；无 token 钩子。
- **影响**：列表页分页位置发生视觉变化；下游若要保持原样必须做**选择器级覆盖**，与「优先用 `--caomei-*` token 定制」的指引冲突。
- **建议**：提供对齐 token（如 `--caomei-data-table-pagination-justify`）。
- **上游处置**：判定为**真实缺口**，登记上游 Backlog **§1.1 待决策**。
- **交付复核（2026-10-13）**：**已交付** —— `caomei-ui@0.4.0` 新增 `--caomei-data-table-pagination-justify` token（`0.6.0` 产物中实测存在）。需要与 PrimeVue 对齐时用该 token 定制，不再做选择器级覆盖。

### 1.5 `Select` 缺少触发器 `#value` 插槽

- **现象**：PrimeVue 下游常用 `#value` 自定义触发器内容（图标 + 文本等）；caomei `Select` 仅有 `#option`，触发器只能显示 `optionLabel` 解析出的文本。
- **影响**：语言切换器一类的「图标 + 文案」触发器无法等价迁移（momei 因该图标类本身无样式定义而视觉无损，属巧合）。
- **建议**：补 `#value`（或 `#selected`）插槽。
- **上游处置**：判定为**真实缺口**，登记上游 Backlog **§1.1 待决策**。
- **交付复核（2026-10-13）**：**已交付** —— `caomei-ui@0.4.0` 为 Select 新增触发器 `#value` 插槽（`0.6.0` 产物中实测存在）。「图标 + 文案」触发器可等价迁移，原文「属巧合」的迁移限制已解除。

## 2. 建议补充文档或档位

### 2.1 `Avatar` 尺寸档位少于 PrimeVue

- **现象**：caomei `Avatar` 档位为 `sm`(24) / `md`(32) / `lg`(40)；PrimeVue 为 `normal` / `large` / `xlarge`。迁移需档位映射，且当 PrimeVue 侧使用更大档位时 caomei 无对应档位，只能以 `--caomei-avatar-size` 覆盖。
- **建议**：补 `xl` 档位，或在 Avatar 页给出与 PrimeVue 的档位对照表。
- **上游处置**：判定为**设计如此**（Avatar 档位少于 PrimeVue）。
- **momei 侧落地（2026-10-15）**：过渡组件 `AppAvatarV2` 已按本条目口径实现几何保真映射——PrimeVue 有效档位 `normal`(32px) → caomei `md`(32px)；`large`(48px) / `xlarge`(64px) → caomei `lg` + 内联 `--caomei-avatar-size` 覆盖回 48 / 64px；PrimeVue 不存在的档位（如 `small`，实测被忽略并回落默认 2rem）一律回落 `md`(32px)。**不再产生边框盒尺寸缩水**（`font-size` 未覆盖，属 momei 侧已登记残差）。

### 2.2 `DataTable` 列的 `class` 与 scoped 样式

- **现象**：PrimeVue `<Column class>` 会落到表头与数据单元格；caomei 需分别使用 `headerClass` / `bodyClass`。更关键的是：`<td>` 由子组件渲染、**不带父组件作用域属性**，因此下游 `.vue` 的 scoped 样式对单元格类**静默不生效**（须改用列定义的 `bodyStyle` / `headerStyle` 或全局类）。
- **实测**：B2 试点页首版用 `bodyClass` + scoped `max-width` 落空，改为 `bodyStyle` 后生效。
- **建议**：在 DataTable 页的「列定义 / 从 PrimeVue 迁移」处显式提示该陷阱。
- **上游处置**：判定为**文档缺口**，登记上游 Backlog **§1.6**。

### 2.3 `showClear` 在「哨兵值恒非空」场景下的行为

- **现象**：`clearable = showClear && hasValue && !disabled`，而 `hasValue` 不把「恒非空的哨兵值」视为空；若下游用哨兵承载「全部」，清除按钮会恒显且点击为**无操作**。
- **建议**：文档说明 `hasValue` 口径，或提供「按语义空值」判断的钩子。
- **上游处置**：判定为**文档缺口**，登记上游 Backlog **§1.6**。

### 2.4 `Button` 的 `label` 只映射可访问名，可见文本须落默认插槽

- **现象**：caomei `CaomeiButton` 的 `label` prop 仅经 `useLabelAttrs` 输出 `aria-label`，**可见文本只来自默认插槽**（`!iconOnly && $slots.default`）。PrimeVue `Button` 的 `label` 则直接渲染可见文本，因此「标签替换 + 属性改名」式机械迁移会得到**无文案的按钮**（外形退化为图标按钮），且不报错、不被类型检查捕获。
- **实测（momei 侧）**：`/admin/external-links` 头部「创建」按钮由参考态的 82px（图标 + 文案）静默退化为 42px 纯图标；同页弹窗页脚「取消 / 保存」与 `/admin/submissions` 审核弹窗页脚 4 个按钮同型。逐像素门禁最初把该退化当作「头部操作区差异」**接受**，直到按 `getBoundingClientRect` 复核几何才暴露。
- **建议**：在 Button 页 / PrimeVue 迁移指引中显式提示——「`label` 是可访问名；可见文本写默认插槽」，并在文档给出最小对照：
    ```vue
    <Button label="保存" />
    <!-- ↓ -->
    <CaomeiButton>保存</CaomeiButton>
    ```
- **上游处置**：判定为**文档缺口**类，登记于本清单 §2.4（**待上游落档**）。momei 侧已修正两处历史用法并把该陷阱写入迁移方案 §5.5 与本清单。

### 2.5 字段行盒高度口径（多字段页面产生 1px 累计位移）

- **现象**：caomei 字段（`CaomeiInput` / `CaomeiSelect` 的字段外层）行盒为 **`36px`**（font 14px / line-height 16.1px / padding 0 12px / border 1px）；PrimeVue `InputText` / `Select` 为 **`36.39px`**（font 16px / line-height 18.4px / padding 8px 12px / border 1px）。每行差 **0.39px**。
- **实测（momei 侧）**：单字段页面几乎不可见；`/admin/migrations/link-governance` 有 2 行**迁移字段**（第 1 行 `MultiSelect` 未迁移、两态同高），经累计后在卡片内产生**下游 1px 文本位移**（描述带 / 复选框行 / 动作行 / 下一卡片），表现为跨带「文本重影」差异（浅色 C 带 2229px / E 带 2574px）。
- **建议**：在「从 PrimeVue 迁移」指引中说明字段行盒口径（高度 / padding / line-height 组合），或提供可对齐 PrimeVue 行盒高度的 token；便于下游在「保持几何不变」与「采用库侧口径」之间显式选择。
- **上游处置**：判定为**口径项（文档缺口）**，登记于本清单 §2.5（**待上游落档**）。momei 侧本批按「接受 + 登记」处置——强行对齐需覆写 caomei 字段的 padding / line-height / font-size token，会改变库侧设计意图并波及已迁移路由的既有基线。

### 2.6 `lazy` 只关分页、不关排序（服务端排序场景下仍会本地重排）

- **现象**：`DataTable` 的 `lazy` 只映射到 `manualPagination`（产物内无 `manualSorting`），TanStack 的 sorted row model 始终生效；受控排序（提供 `sortField` / `sortOrder`）下表格仍会按同一 key 对**当前页**再排一次。
- **实测（momei 侧）**：`/admin/users` 是首个接线**服务端排序**的迁移路由（PrimeVue `lazy` + `@sort` 语义为「不本地排序」）。迁移后点击表头会同时触发服务端重排与当前页本地重排；两者排序口径不一致时（如 DB collation vs 内置 `alphanumeric`）当前页顺序会被本地重排覆盖。
- **建议**：提供 `manualSorting`（或让 `lazy` 同时关闭排序）开关；至少在文档中说明 `lazy` 与排序的关系。
- **上游处置**：**待上游确认**。momei 侧本批按「接受 + 登记」处置：保持与迁移前一致的**不绑定受控排序 prop** 形态（排序指示器初始态与迁移前相同），并把 `@sort` 载荷（caomei 字符串 `'asc' | 'desc' | ''` ↔ PrimeVue 数值 `1 | -1 | 0`）的归一收敛在共享 composable 内。

### 2.7 `DataTable` 无「列最小宽」契约，且选择列宽度不可配置

- **现象**：① PrimeVue `Column` 的 `style` / `class` **同时落 `th` 与 `td`**（实测两态 inline style 与 class 逐字一致），caomei 需分别用 `headerStyle` / `bodyStyle` 镜像，而 `DataTableColumn.width` **只落 `th`**（且只参与冻结列的 `tableMinWidth` 推导）；② caomei **没有「列最小宽」prop**——PrimeVue `header-style="min-width: 15rem"` 这类声明在 caomei 只能以 `headerStyle: { minWidth }` 承载；③ 冻结列的 `tableMinWidth` 只统计**以 `px` 结尾**的 `width`，`rem` 宽度既不参与 min-width 推导，也不参与冻结偏移估算（`columnWidth()` 回落 `DEFAULT_PINNED_WIDTH`）；④ **选择列宽度不可配置**：PrimeVue 可在 `<Column selection-mode="multiple" header-style="width: 3rem" />` 上声明，caomei 内建选择列固定 `width: 1%` + `--caomei-space-2` 横向内边距，无 prop / token 可覆盖。
- **实测（momei 侧，2026-10-16 `/admin/posts`）**：逐列宽度两态**完全一致**（title 240 / author 128 / status 112 / pinned 96 / cover 112 / audio 224 / translations 128 / category 128 / views 70 / publishedAt 144 / audit 112 / actions 128），证明 `headerStyle` / `bodyStyle` 镜像可等价还原 min-width 声明；**唯一无法还原的是选择列**——PrimeVue 实测 **52px**（20px 复选框 + 单元格 `16px` 横向内边距）vs caomei **34px**（18px 复选框 + `space-2`），使整表宽度 1674px → 1656px、其余列**整体左移 18px**。
- **建议**：① 在 DataTable 页给出一行对照表（`style` / `class` → `headerStyle` + `bodyStyle`，并显式说明 `width` 只落 `th`）；② 提供选择列宽度钩子（prop 或 token / class），便于下游保持几何不变；③ 明确 `width` 的单位口径（`px` 参与冻结偏移，`rem` 不参与）。
- **上游处置**：**待上游确认**。momei 侧本批按「接受 + 登记」处置——不引入选择列的魔法数字选择器覆盖，差异进允许清单（`/admin/posts` 表格带内整列位移）并登记于本清单 §2.7 与迁移方案 §6.2 执行提示。

## 3. 非问题（已在库文档声明为有意差异，仅记录）

- `DataTable` 的 `page` 为 **1 基**（PrimeVue 0 基偏移）——迁移时不要沿用 `+1`；库文档已说明。
- 列级 `selection-mode` 收敛为表格级 `selectionMode`。
- `frozen` + `align-frozen` 收敛为单个 `frozen: 'left' | 'right'`。
- `Select filter` 未实现，映射 `AutoComplete`（已登记）。
- 浮层（Dialog / Drawer / Popover / DropdownMenu）与 `v-tooltip` 的迁移由 momei 侧延后批次处理，非库侧缺口。
- `ConfirmDeleteDialog` 等共享壳的并存期过渡组件属 momei 侧编排，不需要库侧支持。

## 4. 结论与后续

- 上述 1.1~1.5 属**静默失效或重复补丁**类问题，建议优先在库侧处理或在文档补齐；2.x 属文档/档位完善项。
- **2026-10-15 补记**：2.5（字段行盒高度口径）同属**文档 / 口径缺口**类；**待上游落档**。
- **2026-10-14 补记**：2.4（`Button` 的 `label` 与默认插槽）与 2.2 同属**文档缺口**类；**待上游落档**——本清单已登记，但尚未取得上游 commit / PR 锚点（与 1.1 / 2.2 / 2.3 的「上游已评估落档 `bedd2de`」不同，不得读作上游已受理）。
- momei 侧在库侧处理前均已有可行写法（哨兵映射、包装元素约束 token、本地图标按钮类、`--caomei-avatar-size` 覆盖、列 `bodyStyle`、按钮文案置默认插槽），并已记录在 [迁移方案 §5.5 / §6](./2026-09-18-primevue-to-caomei-ui-migration-plan.md) 与 [回归记录](../../reports/regression/current.md)。
- **上游已评估落档**（上游 commit `bedd2de`，2026-09-25）：真实缺口 3 条（1.3 / 1.4 / 1.5）→ 上游 Backlog **§1.1 待决策**；文档缺口 3 条（1.1 / 2.2 / 2.3）→ 上游 Backlog **§1.6**；设计如此 2 条（1.2 / 2.1）；`Select` `null` 值支持**不纳入**，判为有意契约，结论留档上游 Backlog **§3**。
- **交付复核**（2026-10-13，`caomei-ui@0.6.0`）：3 条真实缺口（1.3 / 1.4 / 1.5）**已在 `0.4.0` 全部交付**并在 `0.6.0` 产物中实测存在，momei 侧对应的行内补丁写法可从 B2 剩余页移除；2.x 文档 / 档位项未在本轮复核。
- 上游落点记录：`caomei-ui` 仓库 [momei 上游反馈评估](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-25-momei-upstream-feedback-evaluation.md) 与 [docs/plan/backlog.md](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/plan/backlog.md) §1.1 / §1.6 / §3。
