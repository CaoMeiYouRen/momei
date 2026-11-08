# 2026-11-08 PrimeVue token 映射表（`--p-*` → `--caomei-*` / `--m-*`）

> 适用阶段：第七十二阶段条目 1「token 语义审计与映射基座」。
> 权威口径：[迁移方案 §5.2](./2026-09-18-primevue-to-caomei-ui-migration-plan.md#52-主题与-token-迁移) 与 [项目计划](../../plan/roadmap.md)。
> 机器事实源：`scripts/governance/data/primevue-token-map.json`；本文映射表由 `scripts/governance/check-primevue-token-map.mjs --markdown` 生成，禁止手改。

## 1. 背景与目标

第七十二阶段开工时（2026-11-08，`governance:count:primevue-usage` 口径）仓库仍有 **1,420 处 `--p-*` / 120 个唯一 token / 136 个文件**。PrimeVue 卸载后 `--p-*` 的定义源（Aura 预设 + `use-theme` 注入）会一并消失，因此必须先回答两个问题，再批量替换：

1. 每个 `--p-*` 是**真实存在的 v4 token**、**v4 原始色板**，还是**从未被定义的幻影 token**？
2. 替换目标应是 caomei 语义角色（`--caomei-*`），还是项目调色板层（`--m-*`）？

本条目只落映射表、`--m-*` 派生层与守卫，不改业务文件的 token 用法；替换动作在条目 3 按三批执行。

## 2. 三分类与处置口径

| 分类 | 判定 | 处置 | 数量 |
| :--- | :--- | :--- | ---: |
| `semantic` | v4 语义角色，或 momei 自定义的语义别名（`--p-surface-card` / `--p-surface-ground`） | 默认映射 `--caomei-*`；无等价角色时落 `--m-*`（见 §3.1 / §4） | 34 |
| `palette` | v4 调色板与运行时色阶（`surface-*` / `primary-*` / `red|green|orange|blue|yellow|purple|emerald-*`） | 映射 `--m-*` | 58 |
| `phantom` | v3 幻影 token、Aura 未产出的引用（`-rgb` 三元组、`*-opacity-*`）与注释中的前缀引用 | 删除或改语义角色 | 28 |

合计 120，覆盖率为 100%；`semantic` 中有 16 个是 **PrimeVue 组件内部 token**（`--p-select-*` / `--p-tabs-*` / `--p-panel-*` / `--p-card-background` / `--p-navigation-background` / `--p-primary-hover-color` / `--p-primary-active-color`），momei 只覆盖定义、没有自研消费点，`disposition=delete`，随卸载一起删除。

「幻影 token」的判定依据：`--p-surface-border` / `--p-text-color-secondary` / `--p-warning-color` 等在 Aura 产物中**从未定义**，`var()` 恒为 `unset`（backlog 长期主线 #11 的 S1）。替换它们会**修复**长期失效的样式，因此条目 3 的视觉差异中会包含这类「从无到有」的归因项，属预期变化。

> 口径说明：120 个唯一 token 中有 2 个是**注释里的前缀片段**（`--p-primary-` / `--p-blue-`，来自 `--p-primary-*` / `--p-blue-*` 的说明文字）。映射表保留它们以与脚本口径一致（脚本不剥离注释），`target` 记为 `--m-primary-*` / `--m-blue-*`；条目 3 改写注释后随之消失。

## 3. `--m-*` 派生层设计

派生层落在 `styles/main.scss` 的 `@layer momei-base` 段，分三组：

| 组 | token | 来源 |
| :--- | :--- | :--- |
| surface | `--m-surface-0` ~ `--m-surface-950` + `ground` / `card` / `hover` 别名 | 运行时基色 `--m-surface`，按明暗方向 `color-mix` |
| primary | `--m-primary-50` ~ `--m-primary-950` | 运行时基色 `--m-primary`，明暗同一公式 |
| 状态色 | `--m-{red,green,orange,blue,yellow,purple,emerald}-*` + `--m-info-500` | Aura primitive 原值冻结 |

另有 `--m-text-muted-color`（与 `use-theme` 同公式）、`--m-shadow-{modal,popover,card}`、`--m-mask-background`（明暗两档）与 `--m-font-mono`。

### 3.1 为什么基色由 `use-theme` 提供，而不是直接 `color-mix` 自 `--caomei-*`

`--m-surface-*` / `--m-primary-*` 的派生源是 `composables/use-theme.ts` 写入的 `--m-surface` / `--m-primary`，而不是 `--caomei-color-bg` / `--caomei-color-primary`。原因：

- **`--caomei-color-bg` 是卡片面，不是页面基面**：暗色下 caomei `bg` 取 `surface-100`，而 `--p-surface-0` 是 `surface-0`。若从 `--caomei-color-bg` 派生，暗色下所有 `--p-surface-0` 的替换都会上浮一档，属可预见的视觉回退；用 `color-mix` 反向「减去」4% 白也无法逐通道还原（sRGB 混合不可精确逆运算）。
- **基色必须跟随用户主题**：主色 / 面基色由用户在主题工作台配置，`use-theme` 是唯一知道当前取值的地方；`--caomei-*` 在并存期仍由 `--p-*` 桥接而来，直接引用会形成「派生层 → 桥接 → 派生层」的绕行。
- **公式逐档一致**：`use-theme` 现有的 `--p-surface-*` / `--p-primary-*` 公式与派生层完全相同（surface：浅色向黑 / 暗色向白，2/4/8/12/20/30/45/60/80/90/95%；primary：white 95/90/70/50/20%、base、black 20/40/60/80/90%），因此条目 3 的替换可做到像素级零差异。

条目 3 完成后，`use-theme` 只保留基色（`--m-primary` / `--m-primary-contrast` / `--m-surface` / `--m-text-color` / `--m-radius`），`--p-*` 色阶行随批次删除；`--caomei-*` 桥接反向为 `var(--m-*)`。

### 3.2 明暗与预设

- surface 色阶在 `.dark` 下改用白色混合（`--m-surface-50` ~ `--m-surface-950` 全部重声明），`--m-surface-ground` / `card` / `hover` 同步换档；`--m-surface-0` 不需要重声明（恒等于基色）。
- primary 色阶明暗同一公式（与 `use-theme` 一致），不需要 `.dark` 覆盖。
- 预设切换只改基色，色阶自动跟随；`--m-surface-ground` 的预设 / 背景色覆盖仍由 `use-theme` 在 `@layer momei-overrides` 写入（层序高于 `momei-base`）。

## 4. 运行时覆盖点（条目 3 必改）

以下位置在运行期直接写 `--p-*` 或依赖其值，替换时必须同步改到 `--m-*`，否则会出现「映射完成但覆盖失效」：

| 位置 | 现状 | 条目 3 处置 |
| :--- | :--- | :--- |
| `composables/use-reader-mode.ts` | 行内写 `--p-content-background` / `--p-surface-0` / `--p-surface-ground` / `--p-text-color` | 同步写 `--m-surface-0` / `--m-surface-ground` / `--m-text-color`（行内优先级最高，必须成对维护） |
| `composables/use-theme.ts` | 生成全部 `--p-*` 色阶与语义别名 | 只保留 `--m-*` 基色与 `--m-surface-ground` 覆盖 |
| `styles/main.scss` 桥接段 | `--caomei-*: var(--p-*)` | 反向为 `--caomei-*: var(--m-*)`，并删除 `--p-surface-card` / `--p-surface-ground` 别名 |
| `tests/visual/caomei-token-bridge.visual.test.ts` | 断言 `--caomei-*` 等于 `--p-*` | 来源改为 `--m-*`（含 `-text` 角色的明暗档） |

## 5. 映射表

<!-- primevue-token-map:start -->

| token | 分类 | 处置 | 目标 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `--p-border-radius-md` | semantic | map | `--caomei-radius-md` | Aura primitive 6px；改走项目圆角角色（默认 8px），预期 +2px 归因 |
| `--p-border-radius-sm` | semantic | map | `--caomei-radius-sm` | Aura primitive 4px，与项目 sm 同值 |
| `--p-card-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-card-shadow` | semantic | map | `--m-shadow-card` | Aura card.root.shadow |
| `--p-content-background` | semantic | map | `--m-surface-0` | Aura content.background 被 use-theme 改写为 surface-0；caomei bg 是卡片面（暗色 surface-100），语义不等价 |
| `--p-content-border-color` | semantic | map | `--caomei-color-border` | Aura content.borderColor |
| `--p-content-border-radius` | semantic | map | `--caomei-radius-md` | Aura content.borderRadius（运行时由 use-theme 写入用户圆角） |
| `--p-content-hover-background` | semantic | map | `--m-surface-hover` | Aura content.hoverBackground：浅色 surface-100 / 暗色 surface-800 |
| `--p-content-text-color` | semantic | map | `--caomei-color-text` | Aura content.color（等价 text.color） |
| `--p-font-family` | semantic | map | `--caomei-font-sans` | v3 幻影（Aura 无 font token），回落到 inherit；改走项目字体栈 |
| `--p-mask-background` | semantic | map | `--caomei-color-mask` | Aura mask.background（明暗两档） |
| `--p-navigation-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-overlay-modal-shadow` | semantic | map | `--m-shadow-modal` | Aura overlay.modal.shadow |
| `--p-overlay-popover-shadow` | semantic | map | `--m-shadow-popover` | Aura overlay.popover.shadow |
| `--p-panel-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-panel-content-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-panel-header-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-primary-active-color` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-primary-color` | semantic | map | `--caomei-color-primary` | Aura primary.color（运行时跟随用户主色） |
| `--p-primary-contrast-color` | semantic | map | `--caomei-color-primary-foreground` | Aura primary.contrastColor（JS 计算） |
| `--p-primary-hover-color` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-select-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-select-list-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-select-option-focus-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-select-option-selected-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-select-option-selected-color` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-surface-card` | semantic | map | `--caomei-color-bg` | momei 别名：浅色 surface-0 / 暗色 surface-100，与 caomei bg 同义 |
| `--p-surface-ground` | semantic | map | `--m-surface-ground` | momei 别名：浅色 surface-50 / 暗色 surface-0，另有 use-theme 运行时覆盖 |
| `--p-tabs-tab-active-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-tabs-tab-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-tabs-tab-list-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-tabs-tabpanel-background` | semantic | delete | （删除） | PrimeVue 组件内部 token，momei 仅覆盖定义、无自研消费点 |
| `--p-text-color` | semantic | map | `--caomei-color-text` | Aura text.color（运行时由 use-theme 写入） |
| `--p-text-muted-color` | semantic | map | `--caomei-color-text-muted` | Aura text.mutedColor（运行时由 use-theme 写入） |
| `--p-blue-300` | palette | map | `--m-blue-300` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-blue-400` | palette | map | `--m-blue-400` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-blue-50` | palette | map | `--m-blue-50` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-blue-500` | palette | map | `--m-blue-500` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-blue-700` | palette | map | `--m-blue-700` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-blue-950` | palette | map | `--m-blue-950` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-emerald-700` | palette | map | `--m-emerald-700` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-green-100` | palette | map | `--m-green-100` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-green-300` | palette | map | `--m-green-300` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-green-400` | palette | map | `--m-green-400` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-green-50` | palette | map | `--m-green-50` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-green-500` | palette | map | `--m-green-500` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-green-700` | palette | map | `--m-green-700` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-green-800` | palette | map | `--m-green-800` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-100` | palette | map | `--m-orange-100` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-300` | palette | map | `--m-orange-300` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-400` | palette | map | `--m-orange-400` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-50` | palette | map | `--m-orange-50` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-500` | palette | map | `--m-orange-500` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-600` | palette | map | `--m-orange-600` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-700` | palette | map | `--m-orange-700` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-800` | palette | map | `--m-orange-800` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-orange-900` | palette | map | `--m-orange-900` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-primary-100` | palette | map | `--m-primary-100` | Aura 调色板 / 运行时色阶 |
| `--p-primary-200` | palette | map | `--m-primary-200` | Aura 调色板 / 运行时色阶 |
| `--p-primary-300` | palette | map | `--m-primary-300` | Aura 调色板 / 运行时色阶 |
| `--p-primary-400` | palette | map | `--m-primary-400` | Aura 调色板 / 运行时色阶 |
| `--p-primary-50` | palette | map | `--m-primary-50` | Aura 调色板 / 运行时色阶 |
| `--p-primary-500` | palette | map | `--m-primary-500` | Aura 调色板 / 运行时色阶 |
| `--p-primary-600` | palette | map | `--m-primary-600` | Aura 调色板 / 运行时色阶 |
| `--p-primary-700` | palette | map | `--m-primary-700` | Aura 调色板 / 运行时色阶 |
| `--p-primary-800` | palette | map | `--m-primary-800` | Aura 调色板 / 运行时色阶 |
| `--p-primary-900` | palette | map | `--m-primary-900` | Aura 调色板 / 运行时色阶 |
| `--p-primary-950` | palette | map | `--m-primary-950` | Aura 调色板 / 运行时色阶 |
| `--p-purple-400` | palette | map | `--m-purple-400` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-purple-500` | palette | map | `--m-purple-500` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-red-100` | palette | map | `--m-red-100` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-red-300` | palette | map | `--m-red-300` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-red-400` | palette | map | `--m-red-400` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-red-50` | palette | map | `--m-red-50` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-red-500` | palette | map | `--m-red-500` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-red-700` | palette | map | `--m-red-700` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-red-900` | palette | map | `--m-red-900` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-surface-0` | palette | map | `--m-surface-0` | Aura 调色板 / 运行时色阶 |
| `--p-surface-100` | palette | map | `--m-surface-100` | Aura 调色板 / 运行时色阶 |
| `--p-surface-200` | palette | map | `--m-surface-200` | Aura 调色板 / 运行时色阶 |
| `--p-surface-300` | palette | map | `--m-surface-300` | Aura 调色板 / 运行时色阶 |
| `--p-surface-400` | palette | map | `--m-surface-400` | Aura 调色板 / 运行时色阶 |
| `--p-surface-50` | palette | map | `--m-surface-50` | Aura 调色板 / 运行时色阶 |
| `--p-surface-500` | palette | map | `--m-surface-500` | Aura 调色板 / 运行时色阶 |
| `--p-surface-600` | palette | map | `--m-surface-600` | Aura 调色板 / 运行时色阶 |
| `--p-surface-700` | palette | map | `--m-surface-700` | Aura 调色板 / 运行时色阶 |
| `--p-surface-800` | palette | map | `--m-surface-800` | Aura 调色板 / 运行时色阶 |
| `--p-surface-900` | palette | map | `--m-surface-900` | Aura 调色板 / 运行时色阶 |
| `--p-surface-950` | palette | map | `--m-surface-950` | Aura 调色板 / 运行时色阶 |
| `--p-yellow-400` | palette | map | `--m-yellow-400` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-yellow-50` | palette | map | `--m-yellow-50` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-yellow-500` | palette | map | `--m-yellow-500` | Aura primitive 原始色板，冻结为项目调色板常量 |
| `--p-blue-` | phantom | map | `--m-blue-*` | 注释文本中的前缀引用（`--p-blue-*`），随批次改写为 `--m-blue-*` |
| `--p-border-radius` | phantom | map | `--caomei-radius-md` | v3 幻影（Aura 无裸 border.radius），恒为 unset；改走圆角角色 |
| `--p-emerald-500-rgb` | phantom | map | `--m-emerald-500` | 幻影 rgb 三元组；改为 color-mix(in srgb, var(--m-emerald-500) α%, transparent) |
| `--p-error-500` | phantom | map | `--caomei-color-danger` | v3 幻影状态色阶，恒为 unset；改走状态 tone 角色 |
| `--p-error-700` | phantom | map | `--caomei-color-danger-text` | v3 幻影状态色阶，恒为 unset；改走状态文字角色 |
| `--p-error-color` | phantom | map | `--caomei-color-danger` | v3 幻影状态色，恒为 unset；改走状态 tone 角色 |
| `--p-font-family-mono` | phantom | map | `--m-font-mono` | v3 幻影，既有 fallback monospace；改走项目等宽字体栈 |
| `--p-font-family-monospace` | phantom | map | `--m-font-mono` | v3 幻影，恒为 unset；改走项目等宽字体栈 |
| `--p-info-500` | phantom | map | `--m-info-500` | v3 幻影状态色阶，恒为 unset；固化为项目 info 色 |
| `--p-info-color` | phantom | map | `--m-info-500` | v3 幻影，既有 fallback #2196f3；固化为项目 info 色 |
| `--p-primary-` | phantom | map | `--m-primary-*` | 注释文本中的前缀引用（`--p-primary-*`），随批次改写为 `--m-primary-*` |
| `--p-primary-900-opacity-20` | phantom | map | `--m-primary-900` | 幻影；改为 color-mix(in srgb, var(--m-primary-900) 20%, transparent) |
| `--p-primary-rgb` | phantom | map | `--m-primary-500` | 幻影 rgb 三元组；改为 color-mix(in srgb, var(--m-primary-500) α%, transparent) |
| `--p-red-500-rgb` | phantom | map | `--m-red-500` | 幻影 rgb 三元组；改为 color-mix(in srgb, var(--m-red-500) α%, transparent) |
| `--p-success-500` | phantom | map | `--caomei-color-success` | v3 幻影状态色阶，恒为 unset；改走状态 tone 角色 |
| `--p-success-700` | phantom | map | `--caomei-color-success-text` | v3 幻影状态色阶，恒为 unset；改走状态文字角色 |
| `--p-surface-0-rgb` | phantom | map | `--m-surface-0` | 幻影 rgb 三元组；改为 color-mix(in srgb, var(--m-surface-0) α%, transparent) |
| `--p-surface-900-rgb` | phantom | map | `--m-surface-900` | 幻影 rgb 三元组；改为 color-mix(in srgb, var(--m-surface-900) α%, transparent) |
| `--p-surface-border` | phantom | map | `--caomei-color-border` | v3 幻影（Aura 无 surface.border），恒为 unset；改走装饰边框角色 |
| `--p-surface-hover` | phantom | map | `--m-surface-hover` | v3 幻影（Aura 无 surface.hover），恒为 unset；改走 hover 面 |
| `--p-text-color-secondary` | phantom | map | `--caomei-color-text-muted` | v3 幻影，恒为 unset；改走次级文本角色 |
| `--p-text-secondary-color` | phantom | map | `--caomei-color-text-muted` | v3 幻影，恒为 unset；改走次级文本角色 |
| `--p-warn-600` | phantom | map | `--m-orange-600` | v3 幻影状态色阶，恒为 unset；改走 warning 色阶 |
| `--p-warn-color` | phantom | map | `--caomei-color-warning` | v3 幻影状态色（warn 别名），恒为 unset；改走状态 tone 角色 |
| `--p-warning-50` | phantom | map | `--m-orange-50` | v3 幻影状态色阶，恒为 unset；改走 warning 色阶 |
| `--p-warning-500` | phantom | map | `--caomei-color-warning` | v3 幻影状态色阶，恒为 unset；改走状态 tone 角色 |
| `--p-warning-700` | phantom | map | `--caomei-color-warning-text` | v3 幻影状态色阶，恒为 unset；改走状态文字角色 |
| `--p-warning-color` | phantom | map | `--caomei-color-warning` | v3 幻影状态色，恒为 unset；改走状态 tone 角色 |

<!-- primevue-token-map:end -->

## 6. 守卫与复算

```bash
pnpm governance:check:token-map                  # 覆盖率校验：未登记的新增 --p-* 直接失败
pnpm governance:check:token-map -- --fail-on-residual   # 条目 4 后：仍有 --p-* 即失败
pnpm governance:check:token-map -- --markdown    # 重新生成 §5 表格
pnpm governance:check:token-map -- --doc=docs/design/governance/2026-11-08-primevue-token-mapping.md
```

守卫与 `governance:count:primevue-usage` 共用扫描面（`collectFiles`），避免两套文件集漂移；`tests/scripts/check-primevue-token-map.test.ts` 覆盖「临时文件新增 `--p-*` 必须判红」与「文档表格与事实源同步」。

## 7. 已知偏差与条目 3 执行提示

1. **`--p-border-radius-md`（Aura 6px）→ `--caomei-radius-md`（用户圆角，默认 8px）**：项目设计口径以主题圆角为准，接受 +2px 差异并在条目 3 逐项归因；`--p-border-radius-sm`（4px）与项目 `sm` 同值，无差异。
2. **`--p-content-background` → `--m-surface-0`**：Aura 语义被 `use-theme` 改写为 `surface-0`，与 caomei 卡片面语义不等价，故落调色板层；不要改回 `--caomei-color-bg`。
3. **`-rgb` / `-opacity-*` 幻影引用**：`rgb(var(--p-primary-rgb), α)` 一类写法改为 `color-mix(in srgb, var(--m-primary-500) α%, transparent)`；映射表 `target` 列给的是基色 token，具体 α 由消费点保留。
4. **`--p-info-*`**：caomei 无 info 角色，`--m-info-500` 固化既有 fallback `#2196f3`，不借用 `--m-blue-500`（否则颜色从 #2196f3 变为 #3b82f6）。
5. **`--p-font-family` / `-mono` / `-monospace`**：均为幻影，替换后字体栈由「inherit / monospace」变为项目字体栈，属预期改善，条目 3 归因时注明。
