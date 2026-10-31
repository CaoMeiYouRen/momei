# 视觉一致性偏差处置表（Visual Parity Deviation Register）

> 用途：登记「组件迁移后与 PrimeVue 原貌不一致」的每一处**已接受偏差**，确保偏差不静默增长。
> 配套：`tests/visual/parity-budget.json`（预算与允许清单）、`tests/visual/parity/reference-manifest.json`（参考态元数据）。
> 口径与流程：[视觉一致性门禁](./2026-10-13-visual-parity-gate.md) 与 [测试规范 §7.2](../../standards/testing.md#72-视觉一致性门禁-visual-parity-gate)。

## 字段口径

| 列 | 含义 |
|:---|:---|
| 区域 | 偏差在页面上的位置（选择器或坐标区域），须与允许清单 `region` 对应 |
| 迁移前 | PrimeVue 原貌（颜色 / 尺寸 / 对齐等可核对值） |
| 迁移后 | caomei-ui 现状（可核对值） |
| 差异像素 | 参考态实测差异像素（校准值，作为允许清单扣减上限的依据） |
| 通道① | `--caomei-*` token 覆盖（`styles/main.scss` 桥接） |
| 通道② | caomei 具名预设（`theme` 选项） |
| 通道③ | 外层包装 + 选择器级覆盖（须留理由） |
| 通道④ | 上游反馈（issue 草稿） |
| 责任人 | 处置与复核责任角色 |
| 状态 | 已覆盖 / 已接受（进允许清单）/ 待上游 / 已修复 / 已闭环 |

## 处置表

| 区域 | 迁移前（PrimeVue） | 迁移后（caomei-ui） | 差异像素（最新一次校准实测） | 通道① | 通道② | 通道③ | 通道④ | 责任人 | 状态 |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| DataTable 分页器对齐（列表页底部） | 居中 | 右对齐（`justify-content: flex-end`） | submissions L1018 / D1022；comments L1177；waitlist L1168 | `--caomei-data-table-pagination-justify`（0.4.0 已交付） | 不适用 | 不需要（token 已够） | 已在 2026-09-25 反馈并交付 | `@full-stack-master` | 对齐已覆盖（token）；分页按钮自身渲染差异仍接受（同区域 comments L1177 / submissions L1018 / D1022 / waitlist L1168 进允许清单） |
| DataTable 表头底色 | `--p-surface-*` 系列底色 | caomei 表头底色 token 推导值 | comments L9122 / D13052；submissions L7326 / D9937；external L6469 / D9034；waitlist L7008 / D10696；campaigns L5735 / D5845；placements L4564 / D4676 | `--caomei-color-*` 桥接后复核 | 不适用 | 不需要 | — | `@frontend-developer` | 已接受（进允许清单） |
| 字段外壳（输入 / 选择 / 按钮）宽度与内边距 | PrimeVue 字段盒模型 | caomei `field-shell` 包裹模型 | external L599+863 / D617+878（2026-10-14 可见文案修复后；修复前为 L1660+863 / D1685+878）；waitlist L494（页头 secondary 按钮）+ L863（头部语言切换）/ D4028+878；campaigns L599（页头 primary 按钮）+ L863（头部语言切换）/ D617+878；placements L599+863 / D617+878 | `--caomei-*` 字段类 token | 不适用 | 触发 `class` 落点陷阱时用外层包装 | 文档缺口（2026-09-25 §1.1 已反馈） | `@frontend-developer` | 已接受（进允许清单） |
| 空态对齐 | PrimeVue `EmptyMessage` 居中 | caomei 空态居中参数 | submissions L1018 / D1022；comments L1177；waitlist L1168；campaigns L2146 / D4656（与分页器垂直下移合并为一个区域）；placements L1965 / D4472 | 不适用 | 不适用 | 不需要 | — | `@frontend-developer` | 已接受（进允许清单） |
| `p-datatable-sm` 行高 | 紧凑行高（sm 尺寸） | caomei 表格行高 token 推导值 | 含于「表头底色」所在的「页面主体」区域 | `--caomei-*` 行高 token 或 `size` 属性 | 不适用 | 不需要 | — | `@frontend-developer` | 已接受（进允许清单） |
| Tag tone 映射（severity → tone） | `severity` 语义色 | `tone` 语义色 | 含于「表头底色」所在的「页面主体」区域 | `--caomei-color-*` | 预设色板 | 不需要 | 已声明为有意差异（迁移方案 §6.3） | `@full-stack-master` | 有意差异（映射核对） |
| **字段行盒高度**（`Input` / `Select` 行；`MultiSelect` 未迁移不参与） | `36.39px`（font 16px / line-height 18.4px） | `36px`（固定高度 token `--caomei-control-height-md: 36px`；font 14px） | 单字段页几乎不可见；多字段长页面（link-governance）经 **2 行**迁移字段累计（≈0.78px）+ 卡片内边距取整后产生下游 **1px 文本位移**（浅 C 带 2229 / E 带 2574） | 需覆写 caomei 字段的 padding / line-height / font-size token（会改变库侧设计意图，本批不做） | 不适用 | 不适用 | 已登记上游反馈清单 §2.5（字段行盒口径，**待上游落档**） | `@full-stack-master` | 已接受（登记为口径项 + 1px 位移进允许清单） |
| **DataTable 表头行高** | PrimeVue `43px` | caomei `33px` | link-governance 表头带浅 5799 / 深 5993（表头 −10px 被 caomei 空态行高 +7px 部分抵消，**表格总高仅 −3px**；**不存在「表体与分页器整体上移 10px」**） | `--caomei-*` 表头/行高 token 或 `size` 属性 | 不适用 | 不需要 | — | `@frontend-developer` | 已接受（进允许清单；与既有「表头底色 / 行高」同类） |
| `CaomeiButton` 可见文案丢失 | PrimeVue `Button` 的 `label` 渲染可见文本 | `CaomeiButton` 的 `label` 仅映射 `aria-label`；可见文本须落默认插槽 | 修复前 external 头部创建按钮区域 L1660 / D1685；修复后降至 L599 / D617（仅剩按钮渲染差异） | 不适用（非样式问题） | 不适用 | 不适用 | 已在上游反馈清单 §2.4 登记，**待上游落档**（尚未取得上游 commit / PR 锚点） | `@full-stack-master` | **已修复**（2026-10-14 独立 fix 提交：外链页头部 + 弹窗页脚、投稿审核弹窗页脚改为默认插槽渲染；外链页允许清单与基线层快照已重新校准，投稿页差异总量不变——其弹窗不在截图内）。连带修复同页同批发现的 `openReview` 内 `useI18n()` 抛错（审核弹窗打不开） |
| **DataTable 选择列宽度**（唯一含行多选的已迁移路由 `/admin/posts`） | PrimeVue 实测 **52px**（20px 复选框 + 单元格 `12px/16px` 内边距；`<Column selection-mode="multiple" header-style="width: 3rem" />`） | caomei 内建选择列实测 **34px**（`width: 1%` + `--caomei-space-2` 内边距 + 18px 复选框）；**无 prop / token 可覆盖** | posts 表格带内整列位移（表宽 1674px → 1656px，其余列整体左移 18px；含于表格带 17569px / 19488px） | 无（选择列内边距无 token） | 不适用 | 需魔法数字覆盖（本批不做） | 已登记上游反馈清单 §2.7（**待上游确认**） | `@full-stack-master` | 已接受（进允许清单；含于表格功能带）+ 上游登记 |
| **行内 icon-only 按钮尺寸** | PrimeVue `p-button-icon-only` **40×40px** | caomei `CaomeiButton iconOnly` **36×36px**（`--caomei-control-height-md`） | posts 数据行高 **145px → 125px**（动作列 3 行按钮主导行高：120px → 108px），表格总高 263.78px → 204px，分页器连带上移 | `--caomei-button-height`（会偏离库侧控件高度档位，本批不做） | 不适用 | 不需要 | — | `@full-stack-master` | 已接受（进允许清单；含于表格带 / 分页带） |
| **DataTable 表头行高（含换行形态）** | PrimeVue `/admin/posts` 实测 **61.78px**（表头文本在 `th` 内**换行**为两行：padding 12px×2 + 2 × 18.4px） | caomei 实测 **34.5px**（`th` 为 `white-space: nowrap`，单行） | posts 表格带内（与表格总高收缩合并计入 17569px / 19488px） | `--caomei-*` 表头 / 行高 token 或 `size` 属性（不改变 `nowrap` 行为） | 不适用 | 不需要 | — | `@full-stack-master` | 已接受（进允许清单；与既有「DataTable 表头行高」同类） |
| **`CaomeiButton` 尺寸档（页头动作按钮）** | PrimeVue `Button`：font **16px** / 圆角 **6px** / 实测 **114×36.39px** | caomei `CaomeiButton`：font **14px** / 圆角 **8px** / 实测 **102×36px**（`--caomei-control-height-md`） | categories L985 / D1017；tags L989 / D1019（头部创建按钮带） | `--caomei-button-font-size`（会偏离库侧控件档位，本批不做，与既有 `/admin/posts` 同口径） | 不适用 | 不需要 | — | `@full-stack-master` | 已接受（进允许清单） |
| **`CaomeiSwitch` 高度** | PrimeVue `ToggleSwitch` **40×24px** | caomei `CaomeiSwitch` **40×22px** | 含于 categories / tags 筛选行带（L1455 / D1521；tags L1436 / D1525） | `--caomei-switch-height`（本批不做） | 不适用 | 不需要 | — | `@full-stack-master` | 已接受（进允许清单） |
| **DataTable 表头 / 空态 / 分页器行高（`/admin/categories` + `/admin/tags`）** | 表头 **31.39px**（font 16px / padding 8px）、空态 **95.39px**、分页器 **56px** | 表头 **32.59px**（font 14px / padding 12px / 表头带底色）、空态 **128.59px**、分页器 **44px** | 表格带 categories L5682 / D8104；tags L5075 / D7503 | `--caomei-*` 表头 / 行高 token 或 `size` 属性 | 不适用 | 不需要 | — | `@full-stack-master` | 已接受（进允许清单；与既有「DataTable 表头底色 / 行高」同类） |
| **头部语言切换器（V2 触发）** | PrimeVue `Select` 版 `.content-language-switcher` 高 **30.09px** | caomei 版高 **28px** | categories L863 / D878；tags L863 / D878（头部切换器带） | 不适用 | 不适用 | 不需要 | — | `@full-stack-master` | 已接受（进允许清单；属路由登记后按迁移方案 §5.5「消费处静态择库」切换的既有过渡组件差异） |
| **翻译徽标几何（`/admin/categories` + `/admin/tags`，数据行态）** | PrimeVue `Badge` 三处叠加口径：高 **24px** / 最小宽 **32px** / padding **2px 4px** / font **11.2px** | caomei `CaomeiBadge` 默认高 **20px** / font **12px**；元素类由 `p-badge` 变 `caomei-badge` 后全局 `.translation-badge.p-badge` 规则静默失效 | 本路由参考态为空表（**数据行不入画**）→ 门禁层无像素对照 | 不适用 | 不适用 | **已修复**：按 `/admin/posts` 同口径补 `--caomei-badge-height` / `--caomei-badge-min-width` / `--caomei-badge-padding-x` / `--caomei-badge-font-size` 还原块（token 通道） | — | `@full-stack-master` | **已修复**（2026-10-16 审计 W2：补 token 还原块；数据行态截图覆盖缺口登记为未覆盖边界） |
| **taxonomy 弹窗宽度（内容驱动）** | PrimeVue 由内容驱动、实测 **444px**（`p-fluid` 字段撑满弹窗） | caomei 字段宽度只由容器决定 → 弹窗收窄到 **372px**（弹窗内控件同步收窄：输入框 328→271、复选 20→18、页脚按钮 82→74） | 弹窗不在门禁层截图内（parity 参考态无数据行 → 弹窗不打开），由基线层用例 `admin-taxonomy-dialog` 覆盖 | 不适用 | 不适用 | **已修复**：显式 `:style="{ width: 'min(90vw, 444px)' }"` 回到迁移前实测宽度（用属性而非 scoped 类：该浮层由 PrimeVue 组件渲染，类选择器与 scoped 作用域属性的落点依赖库内部结构） | — | `@full-stack-master` | **已修复**（弹窗宽度回到 444px；弹窗内控件自身差异按基线层快照接受——页签 51.39→37.59px 等） |
| **`Tabs` 族替换（`/admin/ai` 页签）** | PrimeVue `Tabs` / `Tab`：页签高与内边距按 Aura 档位，激活态下边框指示 | caomei `CaomeiTabs` / `CaomeiTabTrigger`：页签高 37.59px（同 taxonomy 弹窗实测档位）、内边距与指示条渲染差异 | `admin-ai-stats` L2072 / D2127（页签行带）；页签高度变化触发的整体纵向位移计入内容带 | `--caomei-tabs-*` token（本批不做，与弹窗内 Tabs 同口径） | 不适用 | 不需要 | — | `@full-stack-master` | 已接受（进允许清单） |
| **`Tag` → `CaomeiTag`（`/admin/ai` 统计卡片 7 处 + 任务列表状态标签）** | PrimeVue `Tag`：`severity` 语义色 + 尺寸档 | caomei `CaomeiTag`：`tone` 语义色（`secondary` / `contrast` → `neutral` 为有损近似）、尺寸档差异 | `admin-ai-stats` L24879 / D25661（内容带，与页签位移合并计）；`admin-ai-tasks-list` L20419 / D24039（单带） | `--caomei-tag-*` token（本批不做） | 不适用 | 不需要 | 不适用（属迁移方案 §6.3 有意差异 #2 的映射核对） | `@full-stack-master` | 已接受（进允许清单） |
| **任务列表刷新按钮位置（caomei `DataTable` 无 `#header` 插槽）** | 按钮位于 PrimeVue `DataTable` 的 `#header` 插槽内（表格容器内右上角一行） | caomei 侧同一 `.table-header` 结构改置于**表格之上**（保持右对齐单个图标按钮意图） | `admin-ai-tasks-list` 单带内（L20419 / D24039 含该行位移） | 不适用 | 不适用 | 不需要（无插槽可对齐） | 已登记上游反馈清单 §2.8（`DataTable` 缺 `#header` / `#footer` 插槽，2026-10-16 新增条目） | `@full-stack-master` | 已接受（进允许清单）+ 登记为结构性差异（契约用例显式断言位置，避免静默丢失入口） |
| **推送历史列表区（`/admin/marketing`）** | PrimeVue `DataTable` + 4 `Column`（`#header` 插槽内标题 + 刷新按钮）+ `Tag` 语义色 | caomei `CaomeiDataTable` + `columns`（`cell-*` 插槽）+ `CaomeiTag tone`（`secondary → neutral` 有损近似）；刷新按钮移出插槽到表格之上 | `admin-marketing-overview` L8384 / D8674（列表带）+ 分页器带 L1167 / D3800 | `--caomei-*` 表格 token（本批不做） | 不适用 | 不需要 | §2.8（同 `/admin/ai`，第 2 个使用者） | `@full-stack-master` | 已接受（进允许清单） |
| **页头创建按钮（`/admin/marketing`）** | `Button icon="pi pi-plus"`（primeicons 字体图标） | `CaomeiButton` + `#icon` 内 lucide `Plus` | `admin-marketing-overview` L934 / D976 | 不适用 | 不适用 | 不需要 | 不适用（§6.2 图标行映射核对） | `@full-stack-master` | 已接受（进允许清单） |
| **弹窗宽度（`/admin/marketing` 创建推送）** | 内容驱动、实测 **679px**（`p-fluid` 字段撑满弹窗） | caomei 字段更窄 → 弹窗收窄到 **542px**，整窗错位 8.81%（`admin-marketing-form-dialog-light`，2026-10-24 起 CI 红） | 归位前 L128174（9.890%）/ D26214；归位后并入下方「弹窗表单字段」四带 | 不适用 | 不适用 | **已修复**：`:style="dialogStyle"` 显式 `min(90vw, 680px)`（页面 scoped 的 `&__dialog` 对 teleport 浮层长期失效，属规则落点缺陷，非样式设计） | — | `@full-stack-master` | **已修复**（2026-10-28：宽度归位后实测面板 380~1059，参考态 381~1059；门禁 34/34 回绿） |
| **弹窗表单字段（`/admin/marketing`）** | PrimeVue `Select` / `InputText`（`fluid`）+ `outlined` + `severity` 按钮 | caomei `CaomeiSelect` / `CaomeiInput`（默认 100% 宽；选择器上限在字段外层解除）+ `variant="secondary"` + `tone` | `admin-marketing-form-dialog` L 四带 6432/7110/1273/2846（合计 17886），D 四带 5854/8158/2215/2820（合计 19234）——2026-10-28 复测（含字段高度变化引起的弹窗内纵向位移） | `--caomei-field-*`（本批不做） | 不适用 | 不需要 | 不适用（§6.2 全宽 / 按钮形态行映射核对） | `@full-stack-master` | 已接受（进允许清单） |

**允许清单的灵敏度是单侧的**：判定为 `allowed = min(带内差异, 声明值)`、`剩余 = 全图差异 − Σ allowed`（`tests/visual/parity/helpers.ts`）——
故「带内差异**增长**」会被检出（剩余超阈值即红），而「带内差异**减少**」（如某处被回退成更接近 PrimeVue）不会报警。声明值一律取实测值（无余量）以保证增长方向灵敏；
如需「少则报」的对称口径，须在门禁层另设下限断言（当前未做，已登记为已知口径）。

**icon-only 刷新按钮约定**：`variant="ghost"` + `rounded` + `:label` 可访问名是迁移后的统一形态（`/admin/ai` 与 `/admin/marketing` 两处）；迁移前 PrimeVue `variant="text"` 无 `rounded`，该形态差异计入对应路由的允许清单，**不作为漂移回退**。

> 说明：表中「有意差异」条目不进允许清单（属迁移方案 §6.3 已声明项，按映射核对），其余「已接受」条目必须同时登记到 `tests/visual/parity-budget.json` 的 `allowlist`。

## 校准记录

> 校准命令：`pnpm test:visual:parity`

- 全量门禁复跑（2026-10-28，`/admin/marketing` 弹窗宽度归位）：**34/34 通过**，未归因差异 L225px / D187px；弹窗表单四带按归位后实测重新登记（L 6432/7110/1273/2846 = 17886，D 5854/8158/2215/2820 = 19234）。根因：`pages/admin/marketing/index.vue` 的 `&__dialog` 写在 scoped 块内，而 `Dialog` 由 PrimeVue 渲染到 body，选择器带不上作用域属性 → 规则长期失效，弹窗宽度随内容固有宽度漂移（caomei 字段更窄 → 542px，参考态 679px）。改为 `:style="{ width: 'min(90vw, 680px)' }"`（与 taxonomy 弹窗同一条处置通道）后宽度归位；余下差异仍为在册族字段外壳 / 按钮与字段高度引起的弹窗内纵向位移，属已归因范围。
- 全量门禁复跑（2026-10-16，组件型目标第三批次：`/admin/marketing`）：**34/34 通过**，未归因差异 **0px**；新增 4 条按 2 个对照面校准（默认视图 3 带 / 弹窗表单 4 带，声明值 = 各带实测值，求和 = 全图实测值：默认视图浅 10485 / 深 13450；弹窗表单浅 14000 / 深 14370——后者是首个**弹窗内**迁移面的逐像素对照）。
- 全量门禁复跑（2026-10-16，组件型目标第二批次：`/admin/ai`）：**30/30 通过**，未归因差异 **0px**；新增 4 条按 2 个对照面校准（stats 2 带 / tasks 1 带，声明值 = 各带实测值，求和 = 全图实测值：stats 浅 26951 / 深 27788；tasks 浅 20419 / 深 24039）。
- 全量门禁复跑（2026-10-16，组件型目标首路由批次：`/admin/categories` + `/admin/tags`）：**26/26 通过**，未归因差异 **0px**；新增 4 条按 4 个非重叠功能带校准（声明值 = 各带实测值，四带求和 = 全图实测值：浅 8985 / 深 11520、浅 8363 / 深 10925）。
> 参考态采集：`pnpm test:visual:reference`（待迁移路由，HEAD）与
> `pnpm test:visual:reference -- --revert=<迁移提交> --only=<route>`（已迁移路由）。
> 实测差异按 testName 落盘 `test-results/visual-parity/report/<name>.json`。
> 环境：chromium / 本机 Linux / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 浅色默认，pixel threshold 0.2。

**2026-10-14 首次实测（已迁移 3 路由，6 个 testName）**

> 预算列（16000 / 1.200%）为该次实测时的口径快照；admin 档随后于 2026-10-14 收紧为 3000px / 0.35%，现行值以 `tests/visual/parity-budget.json` 为准（下表与第 2 张表分属收紧前后两个快照，不做直接比较）。

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-comments-list-light | admin | 16000 / 1.200% | 10299 / 0.795% | 2/2 条，10299px | 0px / 0.000% | PASS |
| admin-comments-list-dark | admin | 16000 / 1.200% | 13052 / 1.007% | 1/1 条，13052px | 0px / 0.000% | PASS |
| admin-submissions-list-light | admin | 16000 / 1.200% | 8344 / 0.644% | 2/2 条，8344px | 0px / 0.000% | PASS |
| admin-submissions-list-dark | admin | 16000 / 1.200% | 10959 / 0.846% | 2/2 条，10959px | 0px / 0.000% | PASS |
| admin-external-links-list-light | admin | 16000 / 1.200% | 8992 / 0.694% | 3/3 条，8992px | 0px / 0.000% | PASS |
| admin-external-links-list-dark | admin | 16000 / 1.200% | 11597 / 0.895% | 3/3 条，11597px | 0px / 0.000% | PASS |

观察：深色主题差异普遍高于浅色（+0.1~0.3 个百分点）；已迁移 3 路由的实测差异全部落在 `admin` 默认预算内，且可被登记的区域完整覆盖。待迁移 8 路由的参考态即当前 PrimeVue 渲染（HEAD 采集），迁移落地后其用例将开始反映漂移。

**2026-10-14 第三路由实测（`/admin/waitlist`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-waitlist-list-light | admin | 3000 / 0.350% | 9533 / 0.736% | 4/4 条，9533px | 0px / 0.000% | PASS |
| admin-waitlist-list-dark | admin | 3000 / 0.350% | 15602 / 1.204% | 3/3 条，15602px | 0px / 0.000% | PASS |

几何核验（先于归因）：筛选输入两态边界均为 `x[56,316]` / `x[332,592]`（260px，±1px）；页头导出按钮两态均右对齐、高 36px。故上表差异全部为**组件替换**（字段外壳盒模型 / 表头底色 / 行高 / 按钮排版），无几何漂移。

> 全量门禁复跑（2026-10-14 第三路由批次）：`pnpm test:visual:parity` **22/22 通过**，当时已迁移 4 路由（8 testName）未归因差异均为 0；待迁移 7 路由（14 testName）实测 0px。

**2026-10-14 可见文案修复后外链页重校准（2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-external-links-list-light | admin | 3000 / 0.350% | 8992 → **7931** / 0.612% | 3/3 条，7931px | 0px / 0.000% | PASS |
| admin-external-links-list-dark | admin | 3000 / 0.350% | 11597 → **10529** / 0.812% | 3/3 条，10529px | 0px / 0.000% | PASS |

> 重校准原因：`CaomeiButton` 可见文案修复后页头按钮区域差异由 L1660 / D1685 降至 L599 / D617（文案像素恢复），允许清单同步下调到实测值本身。投稿页两条**未变**（浅 8344 / 深 10959）——其弹窗不在截图范围内。基线层仅外链页 2 张快照刷新。

**2026-10-14 第四路由实测（`/admin/ad/campaigns`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-ad-campaigns-list-light | admin | 3000 / 0.350% | 9343 / 0.721% | 4/4 条，9343px | 0px / 0.000% | PASS |
| admin-ad-campaigns-list-dark | admin | 3000 / 0.350% | 11996 / 0.926% | 4/4 条，11996px | 0px / 0.000% | PASS |

几何核验（先于归因）：表格左 / 上边界两态一致（`x=88`、`y≈235`）；页头创建按钮两态右边缘均 `x=1375`、高 36px；分页器两态**均居中**（参考内容 `x[646,793]` vs 当前 `x[668,771]`，中心均落在页面中线 `x=720`），差异为**空态行高**导致的垂直下移（参考 `y≈390` vs 当前 `y≈410`）。故上表差异全部为**组件替换**，无几何漂移；本路由门禁基线为空态，未渲染数据行，故 reason 不含 Tag tone 类归因。

> 全量门禁复跑（2026-10-14）：`pnpm test:visual:parity` **22/22 通过**，已迁移 5 路由（10 testName）未归因差异均为 0；待迁移 6 路由（12 testName）实测 0px。

**2026-10-14 第五路由实测（`/admin/ad/placements`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-ad-placements-list-light | admin | 3000 / 0.350% | 7991 / 0.617% | 4/4 条，7991px | 0px / 0.000% | PASS |
| admin-ad-placements-list-dark | admin | 3000 / 0.350% | 10643 / 0.821% | 4/4 条，10643px | 0px / 0.000% | PASS |

几何核验（先于归因）：表格左 / 上边界两态一致（`x=88`、下边框 `y≈235`）；页头创建按钮两态右边缘均 `x=1375`、高 36px；分页器两态**均居中**（参考内容 `x[646,793]` vs 当前 `x[668,771]`，中心均 `x=720`），差异为**空态行高**导致的垂直下移（参考 `y≈390` vs 当前 `y≈410`）。故上表差异全部为**组件替换**，无几何漂移；本路由门禁基线为空态，未渲染数据行，reason 不含 Tag tone 类归因。

> 全量门禁复跑（2026-10-14，第五路由批次）：`pnpm test:visual:parity` **22/22 通过**，已迁移 6 路由（12 testName）未归因差异均为 0；待迁移 5 路由（10 testName）实测 0px。

**2026-10-15 第六路由实测（`/admin/migrations/link-governance`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-link-governance-light | admin | 3000 / 0.350% | 32070 / 2.475% | 9/9 条，32070px | 0px / 0.000% | PASS |
| admin-link-governance-dark | admin | 3000 / 0.350% | 34819 / 2.687% | 9/9 条，34819px | 0px / 0.000% | PASS |

**本路由是当前差异最大者（约为既有 6 条路由的 2.2–4.0 倍）**，归因分三部分：① 约 20 个在册族组件替换（9 `Button` / 7 `Tag` / 4 `Select` / 2 `InputText` / 表格 7 列 + 分页器）；② 表头行高 −10px（43 → 33，被 caomei 空态行高部分抵消后表格总高仅 −3px）；③ 字段行盒 36px vs 36.39px 的 **0.39px × 2 行累计（≈0.78px）+ 取整 → 1px 文本位移**（本表第 2 行）。另注：本路由约 27% 页面高度（含分页器）在 900px 视口截图外，不在门禁比对范围。

几何核验（**本路由额外把迁移前源码临时恢复到 HEAD 就地构建一次**，取得两态同口径 `getBoundingClientRect`）：执行区网格 `y`/高 336/201 两态一致；第 2 行字段 429 → 428（−1）、筛选行 732 → 731、复选框行 562 → 561、执行动作行 606 → 605；表格 793 → 791；文档高 1247 → 1242。另修复一处本批引入的几何回归：caomei `Select` 的 `20rem` 上限（= 320px）把下拉截到 319px 内容宽（迁移前 421px），已用 `--caomei-select-max-width: 100%`（设在字段外层祖先）还原。

> 全量门禁复跑（2026-10-15，第六路由批次）：`pnpm test:visual:parity` **22/22 通过**，已迁移 7 路由（14 testName）未归因差异均为 0；待迁移 4 路由（8 testName）实测 0px。

**2026-10-15 第七路由实测（`/admin/subscribers`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-subscribers-list-light | admin | 3000 / 0.350% | 8635 / 0.666% | 4/4 条，8635px | 0px / 0.000% | PASS |
| admin-subscribers-list-dark | admin | 3000 / 0.350% | 14839 / 1.145% | 3/3 条，14839px | 0px / 0.000% | PASS |

**本路由是首个采用共享壳过渡组件（`AppAvatarV2`）的路由**，其差异结构与既有 `/admin/waitlist` **同型**：门禁报出的分页器区（1168px）、语言切换区（863 / 878px）、导出按钮区（494px）三处像素与 waitlist **完全一致**，差异仅在第一区（列数与内容不同：6110 vs 7008 / 9933 vs 10696）。该一致性是本路由归因可信度的主要证据。

几何核验：筛选输入参考态实测边框盒 `x56..316 / y172..210`（261×38），迁移后 `x56 / y172 / 260×36` —— 位置与宽度**精确对齐**（高度差 2px 为字段行盒 36 vs 36.39 的取整差）；表格表头底边 `y263` → `y264`（1px）。

未覆盖边界：parity 参考态为**空表**（测试环境无订阅数据），故 `AppAvatarV2` 的 caomei 分支在本路由**无截图覆盖**，仅由单测与消费处契约覆盖——首轮审计正是由此漏出「`small` 档位使头像 32px → 24px」的几何回归；该映射已改为几何保真（`large` / `xlarge` 以 `--caomei-avatar-size` 覆盖回 48 / 64px），但**覆盖的像素级验证仍缺**（静态依据 + 单测断言，待 `users` / `settings-profile` 迁移批次补实测）。

> 全量门禁复跑（2026-10-15，第七路由批次）：`pnpm test:visual:parity` **22/22 通过**，已迁移 8 路由（16 testName）未归因差异均为 0；待迁移 3 路由（6 testName）实测 0px。

**2026-10-15 第八路由实测（`/admin/users`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-users-list-light | admin | 3000 / 0.350% | 14019 / 1.082% | 3/3 条，14019px | 0px / 0.000% | PASS |
| admin-users-list-dark | admin | 3000 / 0.350% | 18831 / 1.453% | 2/2 条，18831px | 0px / 0.000% | PASS |

**本路由是首个参考态含数据行的已迁移列表路由**（其余为空表），差异主体为单元格渲染（`CaomeiBadge` / `AppAvatarV2` / 动作按钮组）× 行数，故允许清单显著大于空表路由。

**本批修复的两处口径问题（均在门禁内被量化）**：① `Select` 的 `class` 只落触发器、宽度钩子在字段外层（上游 §1.1）——初次实现使筛选工具条由 36px 涨到 124px、表格下移 57px（浅色实测一度 32324px / 2.494%），改包装元素约束后回到 ±2px；② 就绪口径——已迁移测试此前不消费条目上的 `stable` / `ready*`（只有 pending 测试消费），使本路由迁入后立即走严格 `networkidle`，而页面存在两条长期 pending 连接（`/api/notifications/stream` 与外部 gravatar 头像），修复为「已迁移测试与 pending 测试共用就绪口径」。

**未覆盖边界**：允许清单按当前种子数据（1 行）校准，数据量变化会改变区域像素；门禁与 E2E 的 `networkidle` 依赖外网可达性（CI 有外网、本地无外网），跨环境不可复现，已登记为后续「阻断非本地请求」收敛项。

> 全量门禁复跑（2026-10-15，第八路由批次）：`pnpm test:visual:parity` **22/22 通过**，已迁移 9 路由（18 testName）未归因差异均为 0；待迁移 2 路由（4 testName）实测 0px。

**2026-10-16 第九路由实测（`/admin/friend-links`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-friend-links-list-light | admin | 3000 / 0.350% | 21637 / 1.670% | 4/4 条，21637px | 0px / 0.000% | PASS |
| admin-friend-links-list-dark | admin | 3000 / 0.350% | 27190 / 2.098% | 4/4 条，27190px | 0px / 0.000% | PASS |

本页为**单文件大页面**（565 行 / 3 个表格 / 21 列），差异主体为表格渲染 × 三表叠加。

几何核验（探针实测）：区块 `x32 y168 1376x215`、split `x32 y403 1376x199`、三表 `49,237 1342x129` / `49,456 644x129` / `747,456 644x129`——**区块位置与参考态一致**；差异为 caomei 表格的**空态行更高**（caomei 空态行 97px vs PrimeVue 约 76px）——**本路由 parity 环境无种子数据**（`server/utils/seed-test.ts` 只播种 settings + posts），三表均渲染 `#empty` 空态，故差异主体是空态行 + 表头 chrome，而非数据行或标签；该高度差使 split 区顶边 `y373 → y403`（+30px），已被允许清单区域 2 覆盖。**本门禁不覆盖数据行 / `Tag` 渲染**（标签不入画）——首轮审计发现的「`CaomeiTag` 无 `value` prop 导致空标签」即由此漏出，已修复并在迁移方案 §6.2 补记该陷阱。

本批另处置上游 §1.1 的**第三次出现**（`Select` 的 `class` 只落触发器、宽度钩子在字段外层）：在**字段容器**上放开 `--caomei-select-max-width`；该口径已随第十路由批次写入迁移方案 §6.2 的**执行提示**（见下）。

**2026-10-16 第十路由实测（`/admin/posts`，2 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-posts-list-light | admin | 3000 / 0.350% | 23277 / 1.796% | 5/5 条，23277px | 0px / 0.000% | PASS |
| admin-posts-list-dark | admin | 3000 / 0.350% | 27886 / 2.152% | 5/5 条，27886px | 0px / 0.000% | PASS |

本页是**含数据行的列表页**（parity 环境种子 1 篇文章），也是**唯一含行多选**的已迁移路由；差异主体为表格 chrome（表头 / 行底色 / 边框 / 字号）+ 选择列宽度差导致的**整表左移 18px** + 行高收缩导致的**纵向收缩**（表格总高 263.78px → 204px）。

几何核验（探针实测，迁移前 → 迁移后）：

| 元素 | 迁移前（PrimeVue） | 迁移后（caomei） | 判定 |
|:---|:---|:---|:---|
| 搜索字段 | `x88 y204.39 261×36.39` | `x88 y204 261×36` | 宽度**逐值一致**（按参考态实测约束 261px）；高差 0.39px 属字段行盒口径 |
| 聚合开关 | 40×24（`y210.58`） | 40×22（`y211`） | 高度差 2px（`--caomei-switch-height: 22px`）；标签 `x1092 84×16.09` **两态一致** |
| 状态选择器 | `x1192 160×36.39` | `x1192 160×36` | 宽度由包装元素承载（`10rem`）后**逐值一致** |
| 表格宽 | 1674px（13 列） | 1656px（13 列） | **仅选择列 52 → 34px**；其余 12 列宽**逐值一致**（240/128/112/96/112/224/128/128/70/144/112/128） |
| 表头行高 | 61.78px | 34.5px | PrimeVue 表头文本换行（2 行）vs caomei `nowrap`（1 行） |
| 数据行高 | 145px | 125px | 动作列 icon-only 按钮 40px → 36px（3 行按钮 120 → 108px） |
| 分页器中心 | `x≈720`（内容 `x568.09 w303.8`） | `x≈720`（`nav x618 w204`） | **水平居中两态一致**（token 生效）；垂直随表格总高上移 47.5px |
| 翻译徽标 | 42.81 / 44.05 × 24（`min-width` 32px / `padding 2px 4px` / `font 11.2px`） | 44.81 / 46.05 × 24（同口径 token 覆盖） | 高度 / 最小宽 / 内边距 / 字号按 `.translation-badge.p-badge` 原口径以 `--caomei-badge-*` token 还原 |
| 头部创建按钮 | `x1262 114×36.39` | `x1274 102×36` | 右边缘（x=1376）与高度对齐；宽度差属按钮排版差异 |

允许清单按 **3 个非重叠功能带**（筛选行 / 表格区 / 分页器与卡片下缘）+ 2 个头部区域登记，各带声明值 = 该带实测差异像素本身（浅 2143 + 17569 + 1747 + 955 + 863 = 23277px；深 2221 + 19488 + 4313 + 986 + 878 = 27886px，均无带外像素、无余量）。

> 全量门禁复跑（2026-10-16，第十路由批次）：`pnpm test:visual:parity` **22/22 通过**，已迁移 **11 路由（22 testName）** 未归因差异均为 0；当时 `PENDING_ROUTES` 为空（10 条 admin 数据列表路由全部迁移完成）。

> 迁移期参考态留存口径（**待收尾决策**）：迁移全部落地后，`tests/visual/parity/reference/*.reference.png`（截至第十路由批次为 22 张，分类 / 标签批次后 26 张，`/admin/ai` 批次后 30 张，`/admin/marketing` 批次后 **34 张**）已不再具备「待迁移参考态」的运行时职责；它们是「PrimeVue 原貌」的唯一存档，卸载 PrimeVue（B4）后无法重采。收尾时须显式决策保留方式（就地归档 / 迁移到设计文档证据目录 / 另存为 release 资产），不得直接删除——已登记 backlog。

> 全量门禁复跑（2026-10-16，第九路由批次）：`pnpm test:visual:parity` **22/22 通过**，已迁移 10 路由（20 testName）未归因差异均为 0；待迁移 1 路由（2 testName）实测 0px。

> 预算与允许清单的权威值以 `tests/visual/parity-budget.json` 为准；本表为校准快照，重跑后若数值变化须同步更新。

## 待上游反馈（通道④）

当前无「①~③ 均不可解」的未决项：分页对齐与行内图标按钮已由 `caomei-ui@0.4.0` 交付 token / `iconOnly`；字段外壳 `class` 落点与 DataTable 列 `class` / scoped 样式属文档缺口，已登记上游 Backlog §1.6（见 [2026-09-25 上游反馈清单](./2026-09-25-caomei-ui-upstream-feedback.md)）。

后续若出现新缺口，按下方模板产出 issue 草稿，并在本表新增行（通道④列填写 issue 链接）。

## 上游反馈模板（通道④）

无法用通道 ①②③ 解决时，产出 issue 草稿，至少包含：

1. **现象**：页面 / 组件、区域、差异表现（截图与坐标）；
2. **最小复现**：最小 props / 插槽组合 + 期望 vs 实测（含像素量 / 色值）；
3. **期望 token**：期望上游提供的 `--caomei-*` token（名称与语义）或 prop / 插槽；
4. **影响面**：本仓库命中的路由 / 组件数量 + 当前临时写法（包装层 / 选择器覆盖）。

已提交的上游反馈与落点记录见 [2026-09-25 上游反馈清单](./2026-09-25-caomei-ui-upstream-feedback.md)。
