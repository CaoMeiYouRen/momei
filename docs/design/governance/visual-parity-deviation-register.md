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

| 区域 | 迁移前（PrimeVue） | 迁移后（caomei-ui） | 差异像素（2026-10-15 实测） | 通道① | 通道② | 通道③ | 通道④ | 责任人 | 状态 |
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

> 说明：表中「有意差异」条目不进允许清单（属迁移方案 §6.3 已声明项，按映射核对），其余「已接受」条目必须同时登记到 `tests/visual/parity-budget.json` 的 `allowlist`。

## 校准记录

> 校准命令：`pnpm test:visual:parity`
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
