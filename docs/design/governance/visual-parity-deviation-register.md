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
| 状态 | 已覆盖 / 已接受（进允许清单）/ 待上游 / 已闭环 |

## 处置表

| 区域 | 迁移前（PrimeVue） | 迁移后（caomei-ui） | 差异像素（2026-10-14 实测） | 通道① | 通道② | 通道③ | 通道④ | 责任人 | 状态 |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| DataTable 分页器对齐（列表页底部） | 居中 | 右对齐（`justify-content: flex-end`） | submissions L1018 / D1022；comments L1177 | `--caomei-data-table-pagination-justify`（0.4.0 已交付） | 不适用 | 不需要（token 已够） | 已在 2026-09-25 反馈并交付 | `@full-stack-master` | 对齐已覆盖（token）；分页按钮自身渲染差异仍接受（同区域 comments L1177 / submissions L1018 / D1022 进允许清单） |
| DataTable 表头底色 | `--p-surface-*` 系列底色 | caomei 表头底色 token 推导值 | comments L9122 / D13052；submissions L7326 / D9937；external L6469 / D9034 | `--caomei-color-*` 桥接后复核 | 不适用 | 不需要 | — | `@frontend-developer` | 已接受（进允许清单） |
| 字段外壳（输入 / 选择）宽度与内边距 | PrimeVue 字段盒模型 | caomei `field-shell` 包裹模型 | external L1660+863 / D1685+878 | `--caomei-*` 字段类 token | 不适用 | 触发 `class` 落点陷阱时用外层包装 | 文档缺口（2026-09-25 §1.1 已反馈） | `@frontend-developer` | 已接受（进允许清单） |
| 空态对齐 | PrimeVue `EmptyMessage` 居中 | caomei 空态居中参数 | submissions L1018 / D1022；comments L1177 | 不适用 | 不适用 | 不需要 | — | `@frontend-developer` | 已接受（进允许清单） |
| `p-datatable-sm` 行高 | 紧凑行高（sm 尺寸） | caomei 表格行高 token 推导值 | 含于「表头底色」所在的「页面主体」区域 | `--caomei-*` 行高 token 或 `size` 属性 | 不适用 | 不需要 | — | `@frontend-developer` | 已接受（进允许清单） |
| Tag tone 映射（severity → tone） | `severity` 语义色 | `tone` 语义色 | 含于「表头底色」所在的「页面主体」区域 | `--caomei-color-*` | 预设色板 | 不需要 | 已声明为有意差异（迁移方案 §6.3） | `@full-stack-master` | 有意差异（映射核对） |

> 说明：表中「有意差异」条目不进允许清单（属迁移方案 §6.3 已声明项，按映射核对），其余「已接受」条目必须同时登记到 `tests/visual/parity-budget.json` 的 `allowlist`。

## 校准记录

> 校准命令：`pnpm test:visual:parity`
> 参考态采集：`pnpm test:visual:reference`（待迁移路由，HEAD）与
> `pnpm test:visual:reference -- --revert=<迁移提交> --only=<route>`（已迁移路由）。
> 实测差异按 testName 落盘 `test-results/visual-parity/report/<name>.json`。
> 环境：chromium / 本机 Linux / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 浅色默认，pixel threshold 0.2。

**2026-10-14 首次实测（已迁移 3 路由，6 个 testName）**

| testName | tier | 预算（px / 比例） | 实测（px / 比例） | 允许清单扣减 | 未归因 | 结果 |
|:---|:---|:---|:---|:---|:---|:---|
| admin-comments-list-light | admin | 16000 / 1.200% | 10299 / 0.795% | 2/2 条，10299px | 0px / 0.000% | PASS |
| admin-comments-list-dark | admin | 16000 / 1.200% | 13052 / 1.007% | 1/1 条，13052px | 0px / 0.000% | PASS |
| admin-submissions-list-light | admin | 16000 / 1.200% | 8344 / 0.644% | 2/2 条，8344px | 0px / 0.000% | PASS |
| admin-submissions-list-dark | admin | 16000 / 1.200% | 10959 / 0.846% | 2/2 条，10959px | 0px / 0.000% | PASS |
| admin-external-links-list-light | admin | 16000 / 1.200% | 8992 / 0.694% | 3/3 条，8992px | 0px / 0.000% | PASS |
| admin-external-links-list-dark | admin | 16000 / 1.200% | 11597 / 0.895% | 3/3 条，11597px | 0px / 0.000% | PASS |

观察：深色主题差异普遍高于浅色（+0.1~0.3 个百分点）；已迁移 3 路由的实测差异全部落在 `admin` 默认预算内，且可被登记的区域完整覆盖。待迁移 8 路由的参考态即当前 PrimeVue 渲染（HEAD 采集），迁移落地后其用例将开始反映漂移。

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
