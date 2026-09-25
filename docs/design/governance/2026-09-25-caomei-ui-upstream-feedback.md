# 2026-09-25 需向上游 caomei-ui 反馈的问题清单（momei 迁移沉淀）

> 来源：momei 侧 PrimeVue → caomei-ui 迁移（第六十七阶段：接入基座 / 视觉回归基座 / token 语义层 / B2 试点页 `/admin/comments`），以及对 B2 全部目标页与共享组件依赖的扫描。
> 口径：只收录**迁移中实际踩到或实测确认**的问题；已在库文档中明确声明的「有意差异」不重复列入（见文末「非问题」）。
> 事实源：`caomei-ui@0.2.0` 产物与仓库文档（本机 `/root/projects/caomei-ui`）。

## 1. 建议优先处理（会在下游造成静默失效或重复补丁）

### 1.1 `Select` 的 `class` 落在触发器，宽度 / `max-width` 钩子在字段外层

- **现象**：`<CaomeiSelect class="x">` 的 `class` 经 `$attrs` 透传到 **触发器**（`.caomei-select`），而 `--caomei-select-max-width` 的宿主是字段外层 `.caomei-select__field`。因此下游想「按容器宽度约束选择器」时，把宽度写在组件上**静默无效**，必须再包一层容器。
- **实测**：B2 试点页首版把宽度 `class` 放在组件上，选择器实测宽 **305px**（未被 180px 约束）；改为包装元素后回到 180px。
- **影响**：筛选行/表单列布局出现非预期宽度，且无报错。
- **建议**：文档在「主题与样式设计 §4.1 / Select 页」显式声明 `class` 落点为触发器；或提供根元素/字段层的 class 透传（如 `fieldClass`）。

### 1.2 `optionValue` 对 `null` 选项静默不渲染

- **现象**：`optionValue` 解析结果非 `string` / `number` 的选项**不渲染**；既有下游（PrimeVue `optionValue` 允许任意值）普遍用 `value: null` 表达「全部 / 不限」，迁移后该选项**静默消失**。
- **实测**：momei 状态筛选的「全部」选项需改为哨兵字符串（如 `'__all__'`）+ 边界还原 `null` 才能保留；同类写法在 B2 多个列表页重复出现。
- **影响**：筛选器丢失「全部」选项，用户无法重置筛选（无报错提示）。
- **建议**：对解析为 `null` / `undefined` 的选项在开发期给出告警；或支持 `null` 值选项（用独立哨兵区分「未选择」）。

### 1.3 无「图标按钮」形态

- **现象**：表格行内动作按钮（仅 `#icon`、`variant="ghost"`）在 caomei `Button` 上仍按 `--caomei-button-padding-x` 渲染，非方形；下游需自行 `--caomei-button-padding-x: 0` + 固定宽度补丁。
- **实测**：B2 试点页为 3 个行内动作按钮各加一条本地类；`posts`/`users` 等页面预计同样重复。
- **建议**：提供 `iconOnly`（或「无默认插槽内容时自动收敛为方形」）；并在 Button 页给出迁移写法。

### 1.4 分页器对齐不可配置

- **现象**：`DataTable` 分页容器固定右对齐（`justify-content: flex-end`），PrimeVue 默认为居中；无 token 钩子。
- **影响**：列表页分页位置发生视觉变化；下游若要保持原样必须做**选择器级覆盖**，与「优先用 `--caomei-*` token 定制」的指引冲突。
- **建议**：提供对齐 token（如 `--caomei-data-table-pagination-justify`）。

### 1.5 `Select` 缺少触发器 `#value` 插槽

- **现象**：PrimeVue 下游常用 `#value` 自定义触发器内容（图标 + 文本等）；caomei `Select` 仅有 `#option`，触发器只能显示 `optionLabel` 解析出的文本。
- **影响**：语言切换器一类的「图标 + 文案」触发器无法等价迁移（momei 因该图标类本身无样式定义而视觉无损，属巧合）。
- **建议**：补 `#value`（或 `#selected`）插槽。

## 2. 建议补充文档或档位

### 2.1 `Avatar` 尺寸档位少于 PrimeVue

- **现象**：caomei `Avatar` 档位为 `sm`(24) / `md`(32) / `lg`(40)；PrimeVue 为 `normal` / `large` / `xlarge`。迁移需档位映射，且当 PrimeVue 侧使用更大档位时 caomei 无对应档位，只能以 `--caomei-avatar-size` 覆盖。
- **建议**：补 `xl` 档位，或在 Avatar 页给出与 PrimeVue 的档位对照表。

### 2.2 `DataTable` 列的 `class` 与 scoped 样式

- **现象**：PrimeVue `<Column class>` 会落到表头与数据单元格；caomei 需分别使用 `headerClass` / `bodyClass`。更关键的是：`<td>` 由子组件渲染、**不带父组件作用域属性**，因此下游 `.vue` 的 scoped 样式对单元格类**静默不生效**（须改用列定义的 `bodyStyle` / `headerStyle` 或全局类）。
- **实测**：B2 试点页首版用 `bodyClass` + scoped `max-width` 落空，改为 `bodyStyle` 后生效。
- **建议**：在 DataTable 页的「列定义 / 从 PrimeVue 迁移」处显式提示该陷阱。

### 2.3 `showClear` 在「哨兵值恒非空」场景下的行为

- **现象**：`clearable = showClear && hasValue && !disabled`，而 `hasValue` 不把「恒非空的哨兵值」视为空；若下游用哨兵承载「全部」，清除按钮会恒显且点击为**无操作**。
- **建议**：文档说明 `hasValue` 口径，或提供「按语义空值」判断的钩子。

## 3. 非问题（已在库文档声明为有意差异，仅记录）

- `DataTable` 的 `page` 为 **1 基**（PrimeVue 0 基偏移）——迁移时不要沿用 `+1`；库文档已说明。
- 列级 `selection-mode` 收敛为表格级 `selectionMode`。
- `frozen` + `align-frozen` 收敛为单个 `frozen: 'left' | 'right'`。
- `Select filter` 未实现，映射 `AutoComplete`（已登记）。
- 浮层（Dialog / Drawer / Popover / DropdownMenu）与 `v-tooltip` 的迁移由 momei 侧延后批次处理，非库侧缺口。
- `ConfirmDeleteDialog` 等共享壳的并存期过渡组件属 momei 侧编排，不需要库侧支持。

## 4. 结论与后续

- 上述 1.1~1.5 属**静默失效或重复补丁**类问题，建议优先在库侧处理或在文档补齐；2.x 属文档/档位完善项。
- momei 侧在库侧处理前均已有可行写法（哨兵映射、包装元素约束 token、本地图标按钮类、`--caomei-avatar-size` 覆盖、列 `bodyStyle`），并已记录在 [迁移方案 §5.5 / §6](./2026-09-18-primevue-to-caomei-ui-migration-plan.md) 与 [回归记录](../../reports/regression/current.md)。
- **尚未向上游仓库提交 issue**：本清单为 momei 侧沉淀，如需同步到 caomei-ui 仓库（Issue / PR）请另行确认后执行。
