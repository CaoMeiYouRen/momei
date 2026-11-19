# 2026-11-19 字号归一第三批（admin settings + onboarding）

- 数据源: `pnpm governance:inventory:font-sizes`（`artifacts/governance/font-sizes-inventory-latest.json`）
- 口径: 只替换与字阶逐档等值的字面量（`0.75 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.25rem` → `--m-font-size-{xs,sm,md,lg,xl,2xl,3xl,4xl}`），不改取值、不改 token 定义、不动非字阶与 SCSS 变量。
- 主文档: [UI 设计 §2.3 字号字阶](../ui.md#23-字体-typography)；分桶口径见 [字号治理试点 §2](./2026-11-13-font-size-scale-pilot.md#2-字阶)；非字阶清单见 [字号归一评估](./2026-11-15-font-size-normalization-evaluation.md)。

## 1. 范围与拆分依据

第七十八阶段第二批已完成非 admin 路由面 9 文件 51 处（token 化 88 → 139）。本批按「admin 路由面优先」接手，并按开发规范 §2.8 的提交规模约束拆成两个可独立复核的批次，单批均 ≤10 文件。

| 批次 | 文件 | 替换数 | 说明 |
|:---|:---|:---|:---|
| A | `components/admin/settings/*.vue` × 10 | 18 | `components/admin/settings` 中口径内声明数 ≥1 的 10 个文件 |
| B | `components/admin/settings/*.vue` × 2 + `styles/_onboarding.scss` + `components/admin/snippets/snippet-aggregate-dialog.vue` + `pages/admin/migrations/link-governance.scss` | 19 | 收尾 settings 剩余 2 文件、onboarding（tour 取证）与两个 admin 相邻高密度文件 |

逐文件明细：

| 文件 | 批次 | 替换数 |
|:---|:---|:---|
| `components/admin/settings/theme-gallery-dialog.vue` | A | 3 |
| `components/admin/settings/admin-notification-settings.vue` | A | 2 |
| `components/admin/settings/localized-setting-editor.vue` | A | 2 |
| `components/admin/settings/notification-delivery-log-list.vue` | A | 2 |
| `components/admin/settings/setting-explanation-card.vue` | A | 2 |
| `components/admin/settings/setup-follow-up-card.vue` | A | 2 |
| `components/admin/settings/theme-save-dialog.vue` | A | 2 |
| `components/admin/settings/ai-alert-thresholds-editor.vue` | A | 1 |
| `components/admin/settings/ai-cost-factors-editor.vue` | A | 1 |
| `components/admin/settings/ai-quota-policies-editor.vue` | A | 1 |
| `components/admin/settings/email-template-settings-panel.vue` | B | 1 |
| `components/admin/settings/third-party-settings.vue` | B | 1 |
| `styles/_onboarding.scss` | B | 5 |
| `components/admin/snippets/snippet-aggregate-dialog.vue` | B | 7 |
| `pages/admin/migrations/link-governance.scss` | B | 5 |

合计 **15 文件 / 37 处**。

## 2. 与阶段条目的偏差说明

阶段条目写作「`components/admin/settings`（当前最大单点 35 处）与 `styles/_onboarding.scss`」。复算后：`components/admin/settings` 目录共 35 条 `font-size` 声明，但**与字阶等值、可等价替换的只有 20 处**（其余为 `0.85rem` / `0.9rem` / `0.8125rem` 等非字阶取值，替换会改版式，属另案归一）；`styles/_onboarding.scss` 为 5 处。两处合计 25 处，不足条目要求的「本批 ≥35 处、口径内待替换 135 → ≤100」。

因此本批在完成 settings 全部 20 处与 onboarding 5 处之后，追加 `snippet-aggregate-dialog.vue`（7 处）与 `pages/admin/migrations/link-governance.scss`（5 处）两个 admin 相邻文件补齐到 37 处。偏差与理由同步登记在 Review Gate 证据 `artifacts/review-gate/2026-11-19-phase80-item3.md`。

## 3. 等价性

- `--m-font-size-*` 只在 `styles/main.scss` 的 `html:root` 定义一次，无媒体查询 / 容器查询 / 主题覆盖，token 取值与替换前字面量逐字节相同。
- 替换只命中 `font-size: <等值字面量>` 声明，注释、`clamp()` / `calc()` / `em` / `px` / `!important` 组合与媒体查询内改写一律跳过。
- `styles/_onboarding.scss` 由 `composables/use-onboarding.ts` 在启动引导时动态 import，本批按条目要求以「启动 tour 后截图」取证（`artifacts/review-gate/2026-11-19-phase80-item3/onboarding-tour-popover.png`）。

## 4. 执行结果

| 指标 | 替换前 | 替换后 |
|:---|:---|:---|
| `font-size` 声明数 | 457 | 457 |
| 已 token 化 | 139（30.42%） | **176（38.51%）** |
| 字阶口径内待替换 | 135 | **98** |

验证结论见 Review Gate 证据：逐元素 `getComputedStyle` 对账 2,278 个元素 0 差异、`test:visual` 32/32、parity 83/83 未归因差异 0。

## 5. 未覆盖边界

- 仍余 98 处口径内字面量，分布见 inventory 目录分桶；下一批可继续按目录密度滚动。
- `components/admin/**` 内仍余约 16 处口径内字面量（`admin/ai`、`admin/calendar`、`admin/snippets` 其余文件、`admin/users`、`pages/admin/*`）。
- demo 模式首页存在 1 条 `Hydration completed but contains mismatches` 控制台提示；本批仅改 CSS 字号声明，不参与水合判定，登记为观察项（`TEST_MODE` 路径 0 页面错误）。
