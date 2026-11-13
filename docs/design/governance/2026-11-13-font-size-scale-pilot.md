# 2026-11-13 字号治理：字阶 token 与首批试点

> 适用阶段：第七十四阶段条目 5「UI 字阶治理首批」。
> 机器事实源：`scripts/governance/inventory-font-sizes.mjs`（`pnpm governance:inventory:font-sizes`，产物 `artifacts/governance/font-sizes-inventory-latest.{json,md}`）；字阶定义在 `styles/main.scss` 的 `:root` 段，本文的分桶表为脚本快照，禁止手改数字。

## 1. 目标与边界

全仓 `font-size` 声明此前是散落的字面量，无法回答「哪些字号是字阶、哪些是历史漂移」。本条目只做两件事：

1. 把字阶固化为 `--m-font-size-*` CSS 变量，并产出可复跑的分桶报告；
2. 在公开页与管理端各选 4 个文件做**等价替换**（视觉 ±0），验证「字面量 → token」这条路对现有渲染没有副作用。

非目标：不做 455 条全量替换；不把非字阶取值（`0.85rem` / `0.95rem` / `1.1rem` 等）强行归一到阶梯（会改变渲染，属另案）；不动暗色 tint 与 U1–U6 自检边界。

## 2. 字阶

字阶与 `styles/_variables.scss` 的 `$font-size-*` 逐档等值，由 `:root`（`@layer momei-base`）暴露给组件消费：

| token | value | 与 SCSS 变量对应 |
| :--- | :--- | :--- |
| `--m-font-size-xs` | `0.75rem` | `$font-size-xs` |
| `--m-font-size-sm` | `0.875rem` | `$font-size-sm` |
| `--m-font-size-md` | `1rem` | `$font-size-base` |
| `--m-font-size-lg` | `1.125rem` | `$font-size-lg` |
| `--m-font-size-xl` | `1.25rem` | `$font-size-xl` |
| `--m-font-size-2xl` | `1.5rem` | `$font-size-2xl` |
| `--m-font-size-3xl` | `1.875rem` | `$font-size-3xl` |
| `--m-font-size-4xl` | `2.25rem` | `$font-size-4xl` |

`md` 与 SCSS 的 `base` 是同一档，只是命名对齐 CSS 变量既有习惯（`--m-surface-*` 用档位名而非 `base`）。token 声明在 `:root` 而非 `html:root`：字号不参与明暗换挡，也不被 caomei-ui 的主题 `:root` 覆盖，无需特异性抬升。

## 3. 分桶基线（2026-11-13）

扫描面：`app.vue`、`components`、`error.vue`、`layouts`、`modules`、`pages`、`styles` 下全部 `.scss` / `.css` / `.vue`（211 个文件，129 个含 `font-size`）。

| 指标 | 治理前 | 试点后 |
| :--- | ---: | ---: |
| `font-size` 声明数 | 455 | 455 |
| 唯一取值数 | 64 | 64 |
| 已 token 化 | 0（0%） | 47（10.33%） |
| 字阶口径内、可等价替换 | 272 | 225 |
| 非字阶取值 | 149 | 149 |
| SCSS 变量取值（`$font-size-*`） | 34 | 34 |

> 口径差异说明：backlog #11 记「503 条 / 60 种写法」来自包含 `packages/` 与文档示例的更宽扫描面；本文与脚本一致，只统计应用样式面。两者不冲突，后续批次以脚本口径为准。

### 3.1 取值分桶 Top 12

| value | count |
| :--- | ---: |
| `0.875rem` | 83 |
| `0.75rem` | 50 |
| `1rem` | 36 |
| `1.125rem` | 19 |
| `0.85rem` | 17 |
| `1.1rem` | 17 |
| `0.95rem` | 16 |
| `1.25rem` | 16 |
| `1.5rem` | 16 |
| `var(--m-font-size-sm)` | 15 |
| `$font-size-sm` | 14 |
| `0.8125rem` | 13 |

### 3.2 目录分桶

| directory | count |
| :--- | ---: |
| `components` | 102 |
| `pages` | 81 |
| `components/admin/posts` | 67 |
| `components/admin/settings` | 35 |
| `styles` | 33 |
| `pages/posts` | 20 |
| `components/admin/snippets` | 17 |
| `components/settings` | 12 |
| `components/admin/ai` | 10 |
| `components/admin/calendar` | 10 |

### 3.3 非字阶取值（需另案归一，Top 10）

| value | count |
| :--- | ---: |
| `0.85rem` | 17 |
| `1.1rem` | 17 |
| `0.95rem` | 16 |
| `0.8125rem` | 13 |
| `0.8rem` | 11 |
| `0.7rem` | 10 |
| `0.9rem` | 9 |
| `2rem` | 8 |
| `2.5rem` | 6 |
| `0.9em` | 4 |

这十档合计 111 条，是下一批的唯一候选项：归一前必须先产出「归一后字号 → 受影响的组件 / 版式」评估，不能直接替换。

## 4. 首批试点文件

| 面 | 文件 | 替换数 |
| :--- | :--- | ---: |
| 公开 | `pages/posts/post-detail.scss` | 13 |
| 公开 | `pages/about.vue` | 9 |
| 公开 | `components/article-card.vue` | 6 |
| 公开 | `pages/categories/index.vue` | 4 |
| 管理端 | `pages/admin/comments/index.vue` | 4 |
| 管理端 | `components/admin/settings/agreements-settings.scss` | 4 |
| 管理端 | `pages/admin/snippets/index.vue` | 4 |
| 管理端 | `components/admin/snippets/snippet-quick-capture.vue` | 3 |

合计 47 处，全部是「字面量取值本来就等于某一档」的等价替换；`0.8125rem`（13px）等非阶梯值原样保留。

## 5. 等价性验证

- **逐元素对账**：在 CI 同源产物（`MOMEI_INSTALLED=true` + `TEST_MODE` 种子，`127.0.0.1:3001`）上，对 8 条试点路由的 BEM 作用域逐元素采集 `getComputedStyle().fontSize` 与 `lineHeight`，浅色 / 深色各一轮，替换前后逐项比对；证据见 `artifacts/review-gate/font-size-pilot/`（`font-size-before.json`、`font-size-after.json` 与 16 张截图）。
- **像素门**：`test:visual` 基线层与 `parity` 门禁层覆盖 `admin-comments-list`、`admin-settings-form`、`admin-snippets`、首页与文章详情等受影响路由，未归因差异须为 0。
- **样式门**：`lint:css` 0 error。

## 6. 后续批次（未立项）

1. 非字阶取值归一（§3.3），需先评估版式影响；
2. 剩余 225 处字阶口径内的字面量批量替换（按目录分批，`components/admin/posts` 67 处优先，收益最高）；
3. `$font-size-*` SCSS 变量消费点（34 处）是否统一改走 CSS 变量，需与 `additionalData` 注入策略一起评估。
