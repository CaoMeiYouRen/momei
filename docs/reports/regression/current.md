# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:workflow-precheck:test:2026-10-13 -->
## 2026-10-13 workflow pre-check（test，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=test`
- 证据 artifact: `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.md` / `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test critical files=PASS，test environment=PASS，security:validate-overrides=PASS，security:audit-deps=PASS
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:test:2026-10-13 -->

<!-- regression-window:start:phase68-fix-comments-pagination:第六十八阶段-试点页分页对齐回归修复:2026-10-13 -->
## 2026-10-13 第六十八阶段 试点页分页对齐欠账回收（`/admin/comments`）

### 问题溯源

- **现象**：`/admin/comments`（M4 试点页，迁移提交 `44774147`，2026-09-25）的 caomei `DataTable` **分页容器右对齐**，与迁移前 PrimeVue 的居中口径不符（用户截图确认横向位置明显偏移）；同批后续迁移的 `/admin/submissions`（`ff443447`）与 `/admin/external-links`（`04d12c17`）均已居中。
- **根因（时间线）**：caomei `DataTable` 分页容器默认 `justify-content: flex-end`（PrimeVue 默认居中）。对齐 token `--caomei-data-table-pagination-justify` 由 `caomei-ui@0.4.0`（库侧提交 `b19f077`，2026-09-28）才交付，**晚于试点页迁移 4 天**；试点页迁移时（库锁 `0.2.0`）**没有可用的对齐 API**，故当时按协议登记为「组件替换」差异。本次属 token 到齐后的**欠账回收**，非新增变更。

### 修复写法

| 文件 | 改动点 |
| :--- | :--- |
| `pages/admin/comments/index.vue` | 在 `CaomeiDataTable` 的根 class（`admin-comments__table`）上补 `--caomei-data-table-pagination-justify: center`，并加注释说明「PrimeVue 默认居中 / caomei 默认右对齐 / `0.4.0` 起由该 token 还原」——与 `/admin/submissions`、`/admin/external-links` **同一写法**（token 落在表格根 class，不做选择器级覆盖、不新增依赖） |
| `tests/visual/__screenshots__/admin-comments-list.visual.test.ts/*.png` | 浅 / 深 2 张基线按修复后状态刷新（刷新前先做修复前后区域级归因，见下节） |

### 差异归因证据（修复前基线 → 修复后基线）

方法：本环境**无视觉模型**，用纯标准库 PNG 逐像素（容差 24/通道）+ 行带分布做区域定位；`toHaveScreenshot` 阈值（`maxDiffPixels 200`）不参与归因，故对照量级高于阈值属预期。修复前基线取自 `git show HEAD:` 的已提交快照，并经同环境复采确认**逐字节一致**（同环境：chromium / 1440×900 / DSF1 / zh-CN / Asia-Shanghai / 关闭动画）；修复后用同环境 `--update-snapshots` 采集。

- **差异总量**：浅色 **2,106 px（0.163% 视口）**；深色 **2,114 px（0.163%）**；包围盒 `x[461,1392] y[171,446]`（页头 / 侧栏 / 卡片外区域零差异）。
- **行带分布**：`y[415,446]`（32 行）**2,066 / 2,074 px = 98.1%**（分页器行）；`y[171,178]`（8 行）**40 px = 1.9%**（残项，见末尾两条）。
- **分页器行带 ink 横向分布**（带内众数色为背景，统计非背景像素）：修复前 ink **1,033（浅）/ 1,037（深）px**、`x[1317,1392]`、质心 `x=1354.5`（**94.1%** 视口宽 → 右端）；修复后 ink **同值**、`x[682,757]`、质心 `x=719.5`（**50.0%** 视口宽 → 正中）。三等分归属 `left / center / right`：修复前 `0 / 0 / 全部` → 修复后 `0 / 全部 / 0`。**ink 总量不变、仅横向平移**，即同一分页控件由右端移回中部（浅 / 深两套的位置与质心完全一致）。
- **因果对照（同构建 token 注入实验）**：在修复后页面上把该 token 覆盖回 `flex-end` 后截图，与**修复前基线**的差异**只剩**上述 40 px 图标（分页器区域像素完全一致）；token 在 `center` / `flex-end` 间切换只影响 `y[415,446]` 行带（2,066 px）。即本次修复的效果面**严格等于**分页器行带，无外溢。
- **残留 40 px 定位**：位于状态过滤器（caomei `Select`，`x[325,505] y[157,193]`）内的 `x[461,468] y[171,178]`，形状为 8×8 px 灰色「×」类图标，修复前有、修复后无。判定**与本次改动无因果关系**：① token 切换不改变该像素（见上条）；② 未改动路由 `/admin/submissions`、`/admin/external-links` 在**同一构建**下的渲染与各自已提交基线**逐像素零差异**（4 张基线 diff = 0），故非构建级漂移；③ 现构建下该页状态过滤器的 select 只渲染「值 + chevron」两个子节点、无 clear 类节点（caomei 的 clear 按钮仅在 `clearable` 形态下渲染，本页 4 处 select 均未声明该 prop）。据此判定为旧快照（迁移期构建）的一次性渲染状态差异、机制未进一步溯源。残留量 40 px 远低于 `maxDiffPixels 200`，不构成门禁风险，登记为观察项。

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run tests/modules/ pages/admin/comments/index.test.ts` = **6 文件 / 34 用例通过**（含「在册组件族零残留」路由守卫与试点页契约，本页契约未改）。
- **层 ③（截图识别）**：修复后基线经 `--update-snapshots` 刷新，`pnpm test:visual` **14/14 通过**（浅 / 深 2 张刷新基线 + 既有 12 张）；门禁轮因 `package.json` / visual config 时间戳触发**重建**，重建后刷新基线与本地采集**逐字节一致**（`sha256` 相同），确认修复后渲染可复现。
- **质量门（实测）**：`pnpm lint` 根工程 `eslint .` **0 error / 7 warning**（7 条与既往同源，均不在本窗口文件）+ `packages/*` 子工程 0 error / 3 warning；`pnpm lint:css` 通过（前置无 fix 轮同样 0 error）；`pnpm docs:check:line-count`、`pnpm docs:check:links`、`lint-md docs/reports/regression/current.md` 通过。**`pnpm typecheck`**：本轮窗口内曾因同工作区**另一并行会话的未跟踪在制品**（`tests/visual/parity/helpers.ts`，非本窗口文件、非本批引入）而红；该在制品已在视觉门禁批次完成，并复测 **0 error**（本窗口改动只有 6 行 SCSS + 2 张基线，不产生类型错误）。
- **未跑项**：本窗口为几何对齐回收，未改分页语义与列定义，故未重跑 E2E 功能层；如需可在阶段收口时随 B2 批次统一覆盖。

### 未覆盖边界 / 观察项

- 修复前基线沿用 `HEAD` 已提交快照（同环境复采已证实逐字节一致），故本次未做 `git stash` 重建采集；归因方法（逐像素 + 行带 + token 因果对照）与既有口径一致。
- 上述 40 px「×」类图标残项未做进一步溯源（跨构建的一次性渲染差异，低于阈值）；若后续路由出现同类残项，再按「先做同构建 token 对照、再做跨构建复采」的顺序判定。
- 本窗口写入后 `current.md` 为 **598 行**（脚本口径；写入前 557 行 / 本窗口 41 行），触发 `docs:check:line-count` 的 warning（>500）但未越 error 线（>700），且未超本次约定的 650 行归档触发线，故未做滚动归档；该 warning 在写入前即已存在（557 > 500），属既有治理项（见 0.6.0 漂移窗口的滚动归档逾期条目）。

<!-- regression-window:end:phase68-fix-comments-pagination:第六十八阶段-试点页分页对齐回归修复:2026-10-13 -->

<!-- regression-window:start:phase68-b2-waitlist:第六十八阶段-条目2-第三路由:2026-10-14 -->
## 2026-10-14 第六十八阶段 条目 2 第三路由 B2 迁移（`/admin/waitlist`）

### 范围

条目 2（B2 剩余数据页迁移一）的第三个路由 `/admin/waitlist` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 202 行 / 6 个 PrimeVue 列组件 / 17 处在册族开口标签（7 个组件名），是**懒加载服务端分页**列表（`useAdminList` + `lazy` + `total-records` + `@page`），与首路由 `/admin/submissions` 同类：必须声明 `pageIndexBase: 1`（PrimeVue `@page` 为 0 基、caomei 为 1 基，否则页码被二次抬升）。不依赖任何待新增共享壳过渡组件，故在 `subscribers` / `users` / `posts` / `friend-links` 四个待落基建的路由之前推进。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/waitlist/index.vue` | `IconField` + `InputIcon` + `InputText`×2 → `CaomeiInput`（`#prefix` + lucide `Search` / `Tag`）；`DataTable` + 6 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`）；`Tag severity` → `tone`；行内删除与页头导出按钮 → `CaomeiButton`（行内图标按钮用 0.6.0 `iconOnly` + lucide `#icon`） | §6.1 / §6.2 / §6.3 / §5.3 |
| 同上 | **可见文案必须落在默认插槽**：`CaomeiButton` 的 `label` 仅映射 `aria-label`，只写 `:label` 且无默认插槽会静默退化为纯图标按钮 | caomei-ui 组件 API（本轮首次命中；已回灌历史路由，见下条） |
| 同上 | `severity` → `tone`：`purpose` 列 `info` → `primary`（§6.2 口径）；`locale` 列 `secondary` → `neutral`（有损近似）；`isActive` 断点在本页不存在 | §6.2 / §6.3 |
| 同上 | 动作列由迁移前 `class="text-right"` 改为列级 `align: 'right'`（等价还原）；筛选输入显式 `width: 260px`（caomei 字段默认 `width: 100%`，PrimeVue `InputText` 在 `IconField` 内固有宽实测 260px） | 迁移不改几何 |
| 同上 | `useAdminList` 增 `pageIndexBase: 1`；`CaomeiDataTable` 接收 1 基 `:page` 受控值 | 跨组件库事件语义（与首路由同源） |
| 同上 | 分页容器对齐用 `--caomei-data-table-pagination-justify: center` 保持 PrimeVue 原居中口径；删除迁移后失效的 `p-datatable-sm` | §3.8 / §6.2；可删除代码收敛 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/waitlist` | §5.5 |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 守卫加固：扫描前扣除**显式非 PrimeVue 导入**的标识符（lucide `Tag` 与在册族 PrimeVue `Tag` 同名，直接扫描会假阳性）；同时**不排除** `primevue/*` 导入；新增 5 条假阳性 / 假阴性双向验证用例 | 守卫最小假阳性口径 |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵新增 `/admin/waitlist` → `.caomei-data-table, .admin-page-container` | 层 ② 扩面 |
| `pages/admin/waitlist/index.test.ts`（新增） | 12 条契约用例：页头导出按钮（含**可见文案**断言）、筛选 `CaomeiInput`、列定义与 `align: 'right'`、`#cell-*` 插槽按 row 渲染、Tag tone 与空值回落、`pageIndexBase: 1` / `initialLimit: 20` 声明、1 基 `@page` 原样转发、空态插槽、导出查询串 | §8.2 层 ① |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-waitlist-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；按实测校准允许清单。参考态 provenance（迁移前 HEAD 就地采集 ≡ 对该迁移提交 `--revert`）**不写回机器生成的 `reference-manifest.json`**（重采会被覆盖），改记于门禁规范 §5 / §7.2 与偏差处置表 | §8.2 层 ③（门禁层） |
| `scripts/testing/capture-visual-reference.mjs` | 参考态覆盖保护口径由「只保护 `source` 以 `worktree` 开头的清单条目」改为「**磁盘上已存在 `<name>.reference.png` 的 testName 一律排除**（含就地采集的待迁移路由）」——旧口径下就地采集的路由在迁移落地后会被下一次 HEAD 全量采集覆盖成「迁移后渲染」，门禁退化为自比自；`getProtectedTestNames` / `buildHeadCaptureGrepArgs` 增加可注入 `root` 以便单测 | §7.2 / 门禁 §5「就地采集的等价性」 |
| `tests/scripts/capture-visual-reference.test.ts`（新增） | 7 条用例：磁盘快照保护、`worktree` 清单保护、`in-place` 清单条目不单独作保护依据、去重排序、空输入不进 `--grep-invert`、全量采集排除表达式、`--only` 不参与排除 | §8.2 层 ①（脚本契约） |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：`pnpm test:visual:parity`（参考态取自迁移前 HEAD；chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画 / pixel threshold 0.2）。本批在门禁层归因前先用「参考态行 / 列带扫描 + 实时 `getBoundingClientRect` 探针」核验几何：筛选输入两态边界均为 `x[56,316]` / `x[332,592]`（宽 260px，±1px），页头导出按钮两态均右对齐且高 36px（参考 118px vs 现 107px，差 11px 属按钮排版，非几何）。

- 页面主体（筛选行 + 表格）浅 `x[40,1400] y[160,360]` 7,008px / 深 10,696px：字段外壳盒模型（`field-shell` 包裹 vs PrimeVue 字段）、表头底色、`p-datatable-sm` 行高、列内 Tag `tone` 综合差异 —— **组件替换**，处置走通道① `--caomei-*` token。
- 空态 / 分页区 浅 `x[640,800] y[400,480]` 1,168px：caomei `DataTable` 分页容器默认右对齐（已用 `--caomei-data-table-pagination-justify: center` 收敛水平对齐）+ 空态行高差所致的垂直偏移 —— **组件替换**。
- 页头语言切换字段 浅 `x[120,320] y[80,120]` 863px / 深 878px：跨路由共享壳过渡组件 `ContentLanguageSwitcherV2` 的字段外壳差异 —— **组件替换**（与 `/admin/external-links` 同区域同量级，属既有已接受项）。
- 页头导出按钮 浅 `x[1280,1400] y[80,120]` 494px / 深 4,028px：`CaomeiButton variant="secondary"` 的边框 / 底纹 / 排版差异（几何已对齐）；深色差异被像素阈值放大 —— **组件替换**。

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/waitlist/index.test.ts tests/modules/ui-library-route-migration-guard.test.ts tests/scripts/capture-visual-reference.test.ts lib/ui-library.test.ts` = 本页 12 条 + 守卫 15 条 + 参考态保护 7 条通过；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` / `pnpm lint:i18n` 通过。
- **层 ②（E2E 功能）**：`node scripts/testing/run-e2e.mjs --grep=extended --project=chromium` = 1 passed（矩阵现覆盖 8 路由，含新增 `/admin/waitlist`）；firefox / webkit 本机未安装浏览器二进制，`browserType.launch` 报 `Executable doesn't exist`，属环境限制而非断言失败。
- **层 ③（截图识别 · 门禁层）**：`pnpm test:visual:parity` **22/22 通过**（本路由浅 / 深 2 条已迁入 `MIGRATED_ROUTES`，未归因差异 0px；其余 20 条为零回归（7 条待迁移路由 / 14 testName 实测 0px））。
- **包体**：本批未新增依赖，`pnpm build` 通过；包体由后续批次统一复测。

### 未覆盖边界 / 观察项

- **`CaomeiButton` 可见文案陷阱（本轮新发现，属历史缺陷）**：`/admin/external-links`（头部「创建」按钮 + 弹窗页脚「取消 / 保存」）与 `/admin/submissions`（审核弹窗页脚 4 个按钮）在先前批次中写成 `:label` 无默认插槽，**可见文案已丢失**（外链页创建按钮由参考态 82px 退化为 42px 纯图标），却被既有 parity 允许清单按「头部操作区差异」接受。本页已按正确写法实现；两处历史缺陷经用户裁定**在本次迁移会话内单独修复**（独立 fix 提交 + 该两条路由的允许清单重新校准），不并入本批。
- 本路由**未新增基线层用例**（`tests/visual/*.visual.test.ts`）。理由：§8.2 层 ③ 的采集对象要求为「列表 / 表单 / 浮层各 1」，已由既有 6 条基线满足；本路由的逐路由观感守线由**门禁层**（相对迁移前原貌，且允许清单上限收紧到实测值）承担，比「相对上一次迁移后基线」更强。若审计认为需与既有 3 路由保持同形，可在后续批次补齐。
- TEST_MODE 未播种候补名单数据，故门禁基线为**空态**渲染，行级渲染（列插槽 / Tag tone / 动作集合）由单元层逐项断言覆盖。
- `docs/reports/regression/current.md` 本批后约 660 行，仍高于 `docs:check:line-count` 的 500 行 warning 线（未越 700 行 error 线）；滚动归档（含 `2026-06-04 ~ 2026-07-27` 段遗留窗口）登记在 [backlog](../../plan/backlog.md) #6，与既有双阈值口径问题一并处置。

<!-- regression-window:end:phase68-b2-waitlist:第六十八阶段-条目2-第三路由:2026-10-14 -->

<!-- regression-window:start:phase68-fix-button-visible-label:第六十八阶段-CaomeiButton可见文案回归修复:2026-10-14 -->
## 2026-10-14 第六十八阶段 `CaomeiButton` 可见文案回归修复（`/admin/external-links`、`/admin/submissions`）

### 问题溯源

- **现象**：`/admin/external-links` 头部「创建」按钮在参考态（PrimeVue）为 **82px 宽**（图标 + 文案，实测 `x[1294,1375] y[113,148]`），迁移后退化为 **42px 纯图标**（`x[1334,1376]`）；同页编辑弹窗页脚「取消 / 保存」、`/admin/submissions` 审核弹窗页脚「取消 / 受理 / 确认 / 驳回」同型——**可见文案整体丢失**。
- **根因（5-Why）**：① 按钮无字 → ② `CaomeiButton` 未渲染默认插槽内容 → ③ 页面只写了 `:label`，未写默认插槽 → ④ caomei `CaomeiButton` 的 `label` 经 `useLabelAttrs` 仅输出 `aria-label`，可见文本只来自 `!iconOnly && $slots.default`，而 PrimeVue `Button` 的 `label` 直接渲染可见文本 → ⑤ 「标签替换 + 属性改名」式机械迁移在**同名 prop 语义不同**时静默失真：不报错、不被 `typecheck` / 零残留守卫 / parity 允许清单捕获（被记为「头部操作区差异」）。
- **引入点**：`04d12c17`（外链页）与 `ff443447`（投稿页）的迁移批次；缺陷代码形态与 `029ee324` 起的原实现一致，属**迁移改写时未察觉的 API 语义差异**，非本批次引入。
- **发现路径**：第六十八阶段条目 2 第三路由（`/admin/waitlist`）迁移时以 `getBoundingClientRect` 探针核对按钮几何，发现「参考 118px vs 实际 107px」偏差后回查同型写法，从而暴露两页历史缺陷（用户 2026-10-14 裁定作为**独立 fix 提交**处置）。

### 范围

- 修复两页**全部**非 icon-only 按钮的可见文案：改写为默认插槽渲染，保留可访问名语义（`label` 不再传，可访问名由插槽文本提供）。
- 顺带修复同页同批发现的**第二个缺陷**：`/admin/submissions` 的 `openReview` 在**事件处理器内**调用 `useI18n()`，而 vue-i18n 11 的 `useI18n()` 在 `getCurrentInstance() === null` 时**抛错**（`MUST_BE_CALL_SETUP_TOP`），使 `reviewVisible = true` 永不执行——即「审核」按钮点击后弹窗打不开（功能阻塞，非观感问题）。修复方式为改用 setup 内已解构的 `locale`。
- **非目标**：不改按钮视觉样式 / 布局；不动 `/admin/comments` 的本地 padding 补丁（有意保留，见迁移方案 §5.5 范围限定）；不处理仓库内其余 `useI18n()` 内联用法（登记 backlog）。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/external-links/index.vue` | 头部「创建」按钮与弹窗页脚「取消 / 保存」：`:label` → **默认插槽文本** | caomei-ui 组件 API（`label` 仅映射 `aria-label`） |
| `pages/admin/submissions/index.vue` | 审核弹窗页脚 4 个按钮同样改为默认插槽文本；新增代码注释固化该陷阱 | 同上 |
| `pages/admin/submissions/index.vue` | `openReview` 内的 `useI18n().locale.value` → setup 已解构的 `locale.value`（`const { t, locales, locale } = useI18n()`） | vue-i18n 11 `useI18n` 契约（setup 外调用抛错） |
| `pages/admin/external-links/index.test.ts` | 新增 `findButtonByText` 助手（有字按钮按文本定位、`data-label` 只对纯图标按钮有效）；创建按钮断言补**可见文案 + 非 icon-only**；新增弹窗页脚可见文案用例；原「按 `data-label` 定位创建 / 保存按钮」改为按文本定位 | §8.2 层 ① |
| `pages/admin/submissions/index.test.ts` | `CaomeiButton` stub 改为渲染默认插槽（忠实镜像组件语义）；新增 2 条用例：审核弹窗页脚可见文案（idle 分支 3 按钮 / accept 分支 2 按钮） | §8.2 层 ① |
| `tests/visual/parity-budget.json` | 外链页允许清单按修复后实测重新校准（浅 8992 → **7931**、深 11597 → **10529**）；头部区域 reason 收敛为「按钮渲染差异」事实（历史演进叙述下沉本记录）；`meta.note` / `tiers.admin` 的检出阈值上界 +36% → **+38%** | §8.2 层 ③ |
| `tests/visual/__screenshots__/admin-external-links-list.visual.test.ts/*.png` | 迁移后基线按修复后状态刷新（浅 / 深 2 张）；投稿页基线经比对**无需改动**（审核弹窗不在截图内） | §8.2 层 ③（基线层） |
| `docs/design/governance/2026-09-25-caomei-ui-upstream-feedback.md` | 新增 §2.4（`Button` 的 `label` 只映射可访问名 / 可见文本须落默认插槽），并补 §4 说明 | 通道④ 文档缺口 |
| `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md` | §5.5 补「按钮可见文案陷阱」blockquote，约束 B2 剩余页写法 | §5.5 / §6 |
| `docs/design/governance/visual-parity-deviation-register.md` | 「`CaomeiButton` 可见文案丢失」行 待修 → **已修复**；「字段外壳」行数值同步为修复后实测；校准记录新增外链页重校准表；状态列词汇表补入「已修复」 | 偏差处置表 |
| `docs/reports/regression/current.md` + `archive/{index.md,2026-06-04-to-2026-09-11.md}` | 本批写入前 `current.md` 已 **712 行（越过 error 700）**，故先滚动归档 6 个最旧窗口（2026-06-04 ~ 2026-09-11；含 5 个历史遗留的孤立 `start` marker 一并归位），`current.md` 回落 **616 行**；分片按时间升序、正文逐字未改，登记入 `archive/index.md` | 文档规范 §5.4；`docs:check:line-count` |
| `docs/plan/todo.md` / `docs/plan/backlog.md` | todo 条目 2 的跨批遗留条目改为「已修复」并写明证据落点；backlog 新增待上收候选 #11（`useI18n()` 内联调用形态收敛，含现状盘点） | `planning.md` §3.4 |

### 视觉差异逐项归因（修复前 → 修复后）

- 外链页差异总量：浅色 **8992 → 7931px（-11.8%）**、深色 **11597 → 10529px（-9.2%）**；减少量集中在页头按钮区域（浅 1660 → 599、深 1685 → 617），即文案恢复后「按钮宽度 / 文本像素」类差异被消除，剩余差异为该按钮 primary 实底的边框 / 底纹 / 排版与高度差（属组件替换）。
- 外链页主体（`x[80,1360] y[200,360]` 浅 6469 / 深 9034）与语言切换字段（浅 863 / 深 878）**未变**，说明本批未波及其它区域。
- 投稿页差异总量**未变**（浅 8344 / 深 10959）：其截图基线为空态表格，审核弹窗不在截图范围内；本批对该页的修复由单元层 2 条用例覆盖（页脚可见文案 + accept 分支）。
- 全量门禁：`pnpm test:visual:parity` **22/22 通过**（未归因差异全为 0px）；基线层 `pnpm test:visual` **14/14 通过**。

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/external-links/index.test.ts pages/admin/submissions/index.test.ts` = **28 用例通过**（各 14 条；本批新增 3 条、改写 3 条定位方式）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error。
- **层 ②（E2E 功能）**：本批未改路由就绪选择器与 E2E 断言面；功能修复（弹窗可打开）由单元层覆盖（见「未覆盖边界」）。
- **层 ③（截图识别）**：门禁层 22/22、基线层 14/14 通过（见上）。
- **文档门禁**：`pnpm docs:check:line-count` passed（`current.md` 616 行；归档前 712 行曾越 error 线）；`pnpm docs:check:source-of-truth` / `docs:check:links`（247 md）/ `lint-md` 均通过。
- **全量单测**：`pnpm test` 537 文件 / 4557 用例通过（1 skipped）。
- **可复算证据**：`test-results/visual-parity/report/admin-external-links-list-{light,dark}.json` 的 `measured.diffPixels` 与允许清单扣减后 `remaining.pixels = 0`。

### 未覆盖边界 / 观察项

- **`useI18n()` 内联调用为仓库级形态问题（登记 backlog）**：同一缺陷形态在 `components/admin/dashboard/creator-stats-panel.vue`（3 处，位于 `computed` 内，模板渲染期求值故当前可用）与 `components/admin/snippets/snippet-aggregate-dialog.vue`（2 处，位于事件处理器 / 异步函数内，**同属会抛错的形态**）存在。本批只修 `/admin/submissions` 一处（为解除审核弹窗功能阻塞），其余登记为跨批治理项，不在本批顺带修改。
- 本批修复后「有字按钮必须按可见文本定位」成为测试约定：`data-label` 仅对 `:label` + `iconOnly` 的纯图标按钮有效，已写入两页测试的助手注释。
- 截图层不覆盖弹窗内部（Dialog 类浮层属第六十九阶段），故页脚文案回归由单元层把关；外链页页脚同理。

<!-- regression-window:end:phase68-fix-button-visible-label:第六十八阶段-CaomeiButton可见文案回归修复:2026-10-14 -->

<!-- regression-window:start:phase68-b2-ad-campaigns:第六十八阶段-条目2-第四路由:2026-10-14 -->
## 2026-10-14 第六十八阶段 条目 2 第四路由 B2 迁移（`/admin/ad/campaigns`）

### 范围

条目 2（B2 剩余数据页迁移一）的第四个路由 `/admin/ad/campaigns` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 333 行 / 8 个 PrimeVue 列组件 / 17 处在册族开口标签（6 个组件名），是**客户端分页 + 行内编辑弹窗**形态（`useAdminEntityList` 消费整份 `value`，不接服务端分页；弹窗内 `InputText` / `Dropdown` / `Button` 属在册族）。**该路由是以「同名文件」形态存在的页面**（`pages/admin/ad/campaigns.vue`，非 `index.vue`），故本批同时把零残留守卫的页面文件解析扩展到两种形态。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/ad/campaigns.vue` | `DataTable` + 8 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`）；页头创建与行内动作按钮 → `CaomeiButton`（行内用 0.6.0 `iconOnly` + lucide `#icon`）；`Tag severity` → `tone`；弹窗内 `InputText` → `CaomeiInput`、`Dropdown` → `CaomeiSelect`、页脚 `Button` → `CaomeiButton`（**可见文案落默认插槽**）；`p-invalid` 类 → `:invalid` 布尔 | §6.1 / §6.2 / §6.3 / §5.3 / §5.5 |
| 同上 | 动作列沿用迁移前 `class="text-right"` + `style="min-width: 8rem"`，以 `align: 'right'` + `headerStyle` / `bodyStyle` 的 `minWidth: 8rem` 等价还原；其余列不新增显式宽度 | 迁移不改几何 |
| 同上 | 客户端分页：`paginator` + `:rows="10"`，不传 `page` / `lazy` / `total-records` 且不监听 `@page`（无页码换算）；分页对齐用 `--caomei-data-table-pagination-justify: center` 保持 PrimeVue 原居中口径；删除失效的 `p-datatable-sm` | §3.8 / §6.2；可删除代码收敛 |
| 同上 | `getAdCampaignStatusSeverity` → `getAdCampaignStatusTone`：`success` / `warning` / `danger` 直通，PrimeVue `secondary` 取有损近似 `neutral` | §6.2 / §6.3 |
| 同上 | `Dialog` / `ConfirmDialog` / `useConfirm` 维持 PrimeVue（显式豁免）；`DatePicker`×2 **不在 B2 在册族清单内**，保持 PrimeVue（随浮层 / 表单批次） | §5.5 / 条目 2 非目标 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/ad/campaigns` | §5.5 |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 页面文件解析由「只认 `pages/<prefix>/index.vue`」扩展为**候选两种形态**（`index.vue` 优先，其次 `<prefix>.vue`），两种都不存在时报错并列出已尝试路径（避免同名文件形态的守卫静默失效）；在册族补入 `Dropdown`（PrimeVue `Select` 的旧名，§6.1 C 组；否则改用旧名即可绕过「Select 零残留」）；新增 4 条形态解析用例 | 守卫最小假阴性口径 |
| `pages/admin/ad/campaigns.test.ts`（新增） | 11 条契约用例：页头创建按钮（含**可见文案**断言）、列定义与 `align`、`#cell-*` 插槽按 row 渲染（日期空值回落 / 收益 `toFixed` 与 `undefined` 回落）、Tag tone 四态 + 默认分支、动作集合与 `iconOnly` 形态、客户端分页委托（不传 `page` / `lazy`、翻页无请求）、弹窗字段映射与 `:invalid`、编辑态回填、保存校验、删除确认 | §8.2 层 ① |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵新增 `/admin/ad/campaigns` → `.caomei-data-table, .admin-page-container` | 层 ② 扩面 |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-ad-campaigns-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；按实测校准允许清单（见下） | §8.2 层 ③（门禁层） |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：`pnpm test:visual:parity`（参考态取自迁移前 HEAD；chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画 / pixel threshold 0.2）。归因前先用**参考态行 / 列带扫描 + 实时 `getBoundingClientRect` 探针**核验几何：

- 表格左 / 上边界两态一致（`x=88`，`y≈235`，实测 `boundingRect` `x88 y204 w1264`）；页头创建按钮两态均右边缘对齐 `x=1375`、高 36px（参考 81px 宽 vs 现 73px 宽，属按钮排版差异）。
- 分页器两态**均居中**：参考态内容 `x[646,793]`、当前态 `x[668,771]`，中心均落在页面中线 `x=720` —— 说明 `--caomei-data-table-pagination-justify: center` 生效；差异是**空态行高**导致的垂直下移（参考 `y≈390` vs 现 `y≈410`），与既有 `submissions` / `external-links` / `comments` 同型。

| 区域（浅色坐标） | 迁移前 | 迁移后 | 实测（浅 / 深） | 归因 |
| :--- | :--- | :--- | :--- | :--- |
| 表头行 `y[200,240] x[80,1360]` | PrimeVue `DataTable` 表头（`p-datatable-sm` 压缩档） | caomei `DataTable` 表头 | 5735 / 5845 | **组件替换**（表头底色 / 边框 / 字号 / 单元格内边距；压缩档删除后行高改由 caomei token 推导） |
| 空态 + 分页区 `x[640,800] y[280,480]`（深色 `x[80,1360] y[280,480]`） | PrimeVue 空态 + 文本式分页器（居中，`y≈390`） | caomei 空态 + 实边框分页器（居中，`y≈410`） | 2146 / 4656 | **组件替换**（空态行高差异导致分页器垂直下移；水平对齐已用 token 收敛） |
| 头部语言切换字段 `x[160,360] y[80,160]` | PrimeVue `Select` 字段外壳 | caomei 字段外壳（过渡组件 `ContentLanguageSwitcherV2`） | 863 / 878 | **组件替换**（与既有 3 路由同区域同量级） |
| 头部创建按钮 `x[1280,1400] y[80,160]` | PrimeVue `Button`（`label` + `pi` 图标） | `CaomeiButton`（primary 实底 + lucide 图标） | 599 / 617 | **组件替换**（边框 / 底纹 / 排版；右边缘与高度已对齐） |

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/ad/campaigns.test.ts tests/modules/ui-library-route-migration-guard.test.ts` = 33 用例通过（本页 11 条 + 守卫 22 条，后者含新增 4 条形态解析用例与 2 条 `Dropdown` 口径用例——成员清单含 `Dropdown`、无显式导入时 `<Dropdown>` 被检出，以及 `<DropdownMenu` / `<DropdownTrigger` 前缀不误判）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css`（含本页）通过。
- **层 ②（E2E 功能）**：`node scripts/testing/run-e2e.mjs --grep=extended --project=chromium` —— 首次隔离调用**连续两次尝试超时失败**（31.5s / 35.5s），随后**连续 3 次隔离复跑均 1 passed**（15.9s / 17.6s / 24.7s，其中 24.7s 已占默认 30s 预算 82%）。
    - **flaky 定性（保守口径，未证伪即按观察项登记）**：仓库已有同类记录（首路由窗口层 ②：**全量并行套件**下两次 30s 超时、隔离复跑 1 passed / 11.2s），但**触发条件不同型**——本轮失败发生在**隔离调用**而非并行负载下，故「既有负载相关 flaky」这一根因归因**未获证明**。可确证的负面证据：矩阵断言面未变（仅新增一行选择器）、本页两个就绪选择器（`.caomei-data-table` / `.admin-page-container`）均由层 ③ 实测渲染确认存在、3 次复跑连续通过。已采两条处置：① 为该用例显式 `test.setTimeout(60000)`，把「矩阵随迁移逐批增长」与超时瓶颈解耦（本批生效）；② 登记「补一次 HEAD 对照（矩阵去掉新增行）或 `--repeat-each` 对比以证实/证伪既有性」为**未覆盖边界**（见下）。
- **firefox / webkit**：本机缺失对应版本目录（playwright 1.64.0 期望 `firefox-1555` / `webkit-2370`，本机仅有更早版本目录），`browserType.launch` 报 `Executable doesn't exist`，属环境限制而非断言失败。
- **层 ③（截图识别 · 门禁层）**：`pnpm test:visual:parity` **22/22 通过**；本路由浅 9343px / 0.721%、深 11996px / 0.926%，允许清单扣减后未归因 **0px**；其余 20 条零回归。
- **全量单测**：`pnpm test` 538 文件 / 4575 用例通过（1 skipped；较上一路由批次 +2，即本批新增的 2 条 `Dropdown` 守卫用例）。
- **包体**：本批未新增依赖，`pnpm build` 通过；包体由后续批次统一复测。

### 未覆盖边界 / 观察项

- **本路由未新增基线层用例**（`tests/visual/*.visual.test.ts`）。理由同第三路由：§8.2 层 ③ 的采集对象要求为「列表 / 表单 / 浮层各 1」，已由既有 6 条基线满足；本路由的逐路由观感守线由**门禁层**承担（相对迁移前原貌，允许清单上限收紧到实测值本身）。
- TEST_MODE 未播种广告活动数据，故门禁基线为**空态**渲染，行级渲染（列插槽 / Tag tone / 日期与收益格式 / 动作集合）由单元层逐项断言覆盖；因此本批允许清单的 reason **不含 Tag tone 类归因**（空态无数据行，未渲染 Tag）。
- `DatePicker` 仍为 PrimeVue：它不在 §5.5 的 B2 在册族清单内，按条目 2 非目标随浮层 / 表单批次的处置口径保持现状；该「同页两库并存」是 §5.5 收窄后「无混用」口径允许的形态（按**批次在册族**判定），本页已在代码注释中显式标注。
- `/admin/ad/placements`（同为「同名文件」形态且同样使用 `Dropdown` / `InputNumber` / `Checkbox`）为下一条候选路由，本批已为其铺好守卫形态解析。
- **E2E 超时既有性未证实**：本轮已把该矩阵用例超时显式抬到 60s 并连续 3 次复跑通过，但「两次超时是否与本批新增路由无关」尚无 HEAD 对照（去掉新增行）或 `--repeat-each` 对比证据；已登记为待补跑项，不作为「flaky 已定性」的结论使用。
- `DatePicker` 维持 PrimeVue 的口径出处本批已补入迁移方案 §5.5 显式豁免枚举（此前既不在在册族也不在豁免清单）；本页 `label for` 与 caomei 字段 `id` 的真实关联由库源码实证（`input.js` / `select.js` 均把 `props.id` 绑到内层控件），浏览器侧点击聚焦未由本批验证。

<!-- regression-window:end:phase68-b2-ad-campaigns:第六十八阶段-条目2-第四路由:2026-10-14 -->

<!-- regression-window:start:phase68-b2-external-links:第六十八阶段-条目2-第二路由:2026-10-13 -->
## 2026-10-13 第六十八阶段 条目 2 第二路由 B2 迁移（`/admin/external-links`）

### 范围

条目 2（B2 剩余数据页迁移一）的第二个路由 `/admin/external-links` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 455 行 / 6 个 PrimeVue 列组件 / 18 处在册族开口标签（6 个组件名），是**客户端分页**列表（迁移前 PrimeVue 表格即消费整份 `value`、不接服务端分页），与首路由 `/admin/submissions`（服务端分页 + `useAdminList`）不同：本页不引入 `pageIndexBase` 契约，分页完全委托 caomei `DataTable` 自持的 1 基内部态。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/external-links/index.vue` | PrimeVue `DataTable` + 6 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`）；`Tag severity` → `tone`；页头与行内 PrimeVue 按钮 → `CaomeiButton`（行内图标按钮用 0.6.0 `iconOnly` + lucide `#icon`，不再复制 M4 的 padding 补丁）；跳转页 PrimeVue 勾选 / 叉号图标 → lucide `Check` / `X`（保留 `text-success` / `text-secondary` 色类） | §6.1 / §6.2 / §6.3 / §5.3 |
| 同上 | 浮层内**在册族**组件随路由迁移：编辑弹窗 `InputText`×2 → `CaomeiInput`、`Dropdown` → `CaomeiSelect`、弹窗页脚与页头 `Button` → `CaomeiButton`；`Dialog` / `Checkbox` / `ConfirmDialog` / `useConfirm` / `v-tooltip` 维持 PrimeVue | §5.5（豁免只覆盖浮层**自身**；其内部在册族仍须迁移，否则命中零残留守卫） |
| 同上 | `p-invalid` 类 → `:invalid` 布尔（`CaomeiInput` / `CaomeiSelect` 的校验态入口） | §6.2 校验态 |
| 同上 | 客户端分页委托：`DataTable` 不传 `page` / `lazy` / `total-records`、不监听 `@page`，页码由 caomei 1 基内部态自持——本页不存在 PrimeVue（0 基）与 caomei（1 基）之间的换算，故无需 `pageIndexBase` | 跨组件库事件语义（本页与首路由的差异项） |
| 同上 | 分页容器水平对齐用 `--caomei-data-table-pagination-justify: center` 保持 PrimeVue 原居中口径 | §3.8 / §6.2 |
| 同上 | 动作列沿用迁移前声明的 `text-right` + `min-width: 8rem`（PrimeVue 的 `class` / `style` 同时落在表头与表体单元格），以 `align: 'right'` + `headerStyle` / `bodyStyle` 的 `minWidth: 8rem` 等价还原；其余列不新增显式宽度 | 迁移不改几何 |
| 同上 | 删除迁移后无意义的 PrimeVue 表格尺寸类 `p-datatable-sm`（caomei `DataTable` 无对应压缩档，保留只会成为死类） | 可删除代码收敛 |
| 同上 | `getExternalLinkStatusSeverity` → `getExternalLinkStatusTone`：`success` / `danger` / `warning` 直通，PrimeVue `secondary` 取有损近似 `neutral` | §6.2 / §6.3 有意差异 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/external-links` | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵中 `/admin/external-links` 就绪选择器 `.p-datatable` → `.caomei-data-table` | 层 ② 改写 |
| `tests/visual/admin-external-links-list.visual.test.ts` + 2 张基线 | 新增浅 / 深基线（**迁移前采集 → 逐项归因 → 按迁移后状态更新**） | §8.2 层 ③ |
| `pages/admin/external-links/index.test.ts` | 新增页面单测 13 条：列定义、6 个 `#cell-{key}` 插槽按 row 渲染、Tag tone 四态、跳转页图标分支、动作集合、`iconOnly` 形态、客户端分页委托（无 `page` / `lazy` / 无服务端请求）、弹窗字段映射与 `:invalid` 校验、删除确认、统计弹窗 | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：迁移前基线以 `git stash push -- pages/admin/external-links/index.vue`（仅回退该页）在同一工作树（`lib/ui-library.ts` 已登记本路由，故页头语言切换器在两态均为 caomei 版）下构建采集；迁移后用同环境（chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画）截图。因本批执行环境**无视觉模型**，归因采用「纯标准库 PNG 逐像素 + 行带 / 列带分布」做区域定位（容差 24/通道），再按组件语义对照；`toHaveScreenshot` 阈值（`maxDiffPixels 200`）不参与该对照，故对照差异量级高于阈值属预期。

- 差异总量：浅色 **7,030 px（Playwright 口径）/ 12,096 px（区域分析口径 0.93%）**；深色 **9,554 px / 12,009 px（0.93%）**；包围盒 浅色 `x[66,1375] y[112,369]`、深色 `x[88,1375] y[112,344]` —— 页头左侧标题、侧栏、页脚零差异。
- 过程中收敛掉**一处本批自行引入的非必要对齐改动**：`DataTable` 分页容器水平对齐。caomei 默认右对齐、PrimeVue 默认居中，直接用会改变分页器水平位置；已按 §3.8 用 `--caomei-data-table-pagination-justify: center` 收敛为居中。列带证据：收敛前右侧 `x[1280,1360)` 差异 3,311 px、中部 `x[680,760)` 742 px → 收敛后 2,290 px / 1,775 px（分页器由右移回中部）。区域指标**总量未下降**（收敛前 ~12.1k → 收敛后 ~12.1k），因该分页器在两态同时存在**垂直偏移**（PrimeVue 与 caomei 空态行高不同，见下表），水平对齐收敛只改变差异落点、不改变像素总量。

| 区域（浅色坐标） | 迁移前 | 迁移后 | 归因 |
| :--- | :--- | :--- | :--- |
| 页头动作按钮 `y[111,150] x[1294,1375]` | PrimeVue 按钮（label + `pi` 图标） | `CaomeiButton`（label + lucide 图标） | **组件替换**（按钮外壳 / 内边距 / 高度由 caomei 按钮提供） |
| 表头 `y[210,237] x[88,1351]` | PrimeVue `DataTable` 表头 | caomei `DataTable` 表头 | **组件替换**（表头底色 / 边框 / 字体 / 单元格内边距；列宽由表格自动分配，列头文本 x 位置随各列宽微移，非页面声明所致） |
| 空态文案 `y[243,261]`（左 `x[96,159]`） / `y[261,276]`（中 `x[692,747]`） | PrimeVue 空态行内**左对齐**文案 | caomei 空态行**居中**文案 | **组件替换**（空态行对齐与行高差异；页面 `#empty` 插槽写法未变） |
| 分页器 `y[288,300] x[646,793]` / `y[312,345] x[704,735]` | PrimeVue 分页器（居中，文本式按钮） | caomei 分页器（居中，实边框按钮） | **组件替换**（水平对齐已用 token 收敛；垂直偏移来自空态行高差） |
| 表格容器横线 `y[234,237]` / `y[348,351]` / `y[369,372]`（深色 `y[234,237]` / `y[264,267]` / `y[321,324]`） | PrimeVue 表头底边框与表格边框所在 y | caomei 对应边框所在 y | **组件替换**（表头 / 空态行高度不同，导致下方边框整体下移） |

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/external-links/index.test.ts tests/modules/ composables/use-admin-list.test.ts` = **7 文件 / 43 用例通过**（本页 13 条）；扩面后的路由迁移守卫（在册族零残留 + 至少一个 caomei 组件）已覆盖 `/admin/external-links`。`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过；`pnpm lint:i18n` 通过。
- **层 ②（E2E 功能）**：`tests/e2e/admin.e2e.test.ts` 的路由矩阵就绪选择器已由 `.p-datatable` 改为 `.caomei-data-table`；本路由实际加载由层 ③ 的 `page.goto('/admin/external-links')` 与页头可见断言覆盖（未单独复跑全量 E2E，见「未覆盖边界」）。
- **层 ③（截图识别）**：迁移前基线对照见上；归因与收敛完成后已按迁移后状态刷新基线，`pnpm test:visual` **14/14 通过**（本批新增浅 / 深 2 张 + 既有 12 张，既有页面逐像素零差异——本批未污染其他基线）。
- **包体**：`pnpm test:perf:budget` 全项不越线（`keyCss` 59.87KB / 70KB；本路由的组件样式进入路由 chunk，未抬升入口 `keyCss`）。

### 未覆盖边界 / 观察项

- TEST_MODE 未播种外链数据，截图基线为**空态**渲染，故截图层不覆盖行级渲染；行级结构（列定义与列插槽 / Tag tone / 跳转页图标分支 / 动作集合 / 客户端分页委托 / 弹窗字段映射与校验）已由本页单元层用例逐项断言。**截图基线 provenance**：迁移前 actual / diff 产物未入库，仓库仅存迁移后快照（浅 / 深 2 张），如需以「迁移前基线」作为判定依据应由 CI 复采。
- **客户端分页与压缩档**：本页为客户端分页（无服务端分页），caomei `DataTable` 无 PrimeVue `p-datatable-sm` 一类的压缩档，已有数据行时的行高 / 内边距将随组件替换变化——该差异不在空态基线覆盖范围内，登记为观察项；因 TEST_MODE 无种子数据，本轮未做行级截图对照。
- **遗留 PrimeVue v3 幻影 token（本页未清理，属有意保留）**：页面 scoped 样式保留 `var(--surface-ground)` / `var(--border-radius)` / `var(--text-color-secondary)` 三处声明。经核验这些名字在 Aura / MomeiPreset 产物中**从未被定义**（真实名为 `--p-surface-*`），当前按 `unset` 生效；若改写为 `--caomei-*` 会使 `.short-code` / 统计弹窗**首次显现背景色与圆角**，属超出「路由迁移不改观感」的行为变更，故本批保留。同类幻影 token 在仓库内十余处页面 / 组件（`pages/goto/[code].vue`、`components/admin/ai/*` 等）普遍存在，宜作为跨批清理项统一处置，不在本路由内顺带修改。
- **信息损失映射（§6.2 有损近似）**：行内「统计 / 编辑」按钮的 PrimeVue `severity="info"` 按 §6.2 映射为 `tone="primary"`（品牌主色，非 info 色）；`Tag` 的 `secondary` → `neutral`。两者均在空态基线覆盖范围外，登记为已接受的损失项。
- 其余 8 个路由（含 `AppAvatarV2` / `AppUploaderV2` / `PostAuditBadge` 过渡件）仍待办。

<!-- regression-window:end:phase68-b2-external-links:第六十八阶段-条目2-第二路由:2026-10-13 -->

<!-- regression-window:start:phase68-b2-submissions:第六十八阶段-条目2-首路由:2026-10-13 -->
## 2026-10-13 第六十八阶段 条目 2 首路由 B2 迁移（`/admin/submissions`）

### 范围

条目 2（B2 剩余数据页迁移一，10 个 `pages/admin` 数据列表路由）的首个路由 `/admin/submissions` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。选它作为首个执行项（用户 2026-10-13 裁定「先做最小路由验证口径」）：388 行 / 19 处在册族开口标签（8 个组件名）/ 5 个 `<Column>`，且不依赖任何待新增的共享壳过渡组件——用于先把「每路由例行改写范式」固定下来，其余 9 个路由按难度递增推进。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/submissions/index.vue` | `IconField`+`InputIcon`+`InputText` → `CaomeiInput`（`#prefix` + lucide `Search`）；`Select`×3 → `CaomeiSelect`（`@change`→`@update:model-value`）；`DataTable`+5×`Column` → `CaomeiDataTable` + `columns` 数组（`#body`→`#cell-{key}`）；`Tag severity`→`tone`；行内图标 `Button` → `CaomeiButton icon-only` + lucide `#icon`；样式 `--p-*`→`--caomei-*` | 迁移方案 §6.1 / §6.2 / §6.3 / §5.3 |
| 同上 | 浮层内**在册族**组件（审核弹窗 `Button`×5、`Select`×2）随路由迁移；`Dialog`/`Divider`/`Textarea`/`Checkbox`/`Toast`/`ConfirmDeleteDialog`/`v-tooltip` 维持 PrimeVue | §5.5（豁免只覆盖浮层**自身**；其内部在册族仍须迁移，否则命中零残留守卫） |
| 同上 | `getSubmissionStatusTone`：`PENDING` 由 PrimeVue `info` 取 `warning`——**偏离** §6.2 的属性级映射（`info → primary`），属本批**新增登记**的有意差异（`primary` 为品牌主色，用于「待审核」状态辨识度不足）；`ACCEPTED → success` / `REJECTED → danger` 与 §6.2 一致 | §6.3 有意差异（本批新增条目） |
| 同上 | 行内动作按钮改用 0.6.0 `iconOnly`（**不再复制** M4 的 `--caomei-button-padding-x: 0` 补丁） | §3.8 / §5.5（0.4.0 缺口闭合） |
| 同上 | 分页容器对齐使用 0.4.0 新增的 `--caomei-data-table-pagination-justify: center`，保持 PrimeVue 原居中口径 | §3.8 |
| 同上 | 删除无引用的 `admin-submissions__col--*` 死类（原 `<Column class>` 无对应样式规则） | 可删除代码收敛 |
| `composables/use-admin-list.ts` | 新增 `pageIndexBase?: 0 \| 1`（默认 `0` 保持既有行为；本页传 `1`）——caomei `@page` 为 1 基（`pageIndex + 1`），PrimeVue 为 0 基，原 `onPage` 恒 `+1` 会二次抬升页码 | 跨组件库事件语义差异（本批新增的跨路由共性项） |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/submissions` | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵中 `/admin/submissions` 就绪选择器 `.p-datatable` → `.caomei-data-table` | 层 ② 改写 |
| `tests/visual/admin-submissions-list.visual.test.ts` + 2 张基线 | 新增浅 / 深基线（**迁移前采集 → 逐项归因 → 按迁移后状态更新**） | §8.2 层 ③ |
| `pages/admin/submissions/index.test.ts` | stub 由 PrimeVue 组件栈换成 caomei 组件栈（保留页头 / 表格 / 筛选 / Toast 四项既有覆盖），并补齐列定义与 `#cell-{key}` 插槽、Tag tone 映射、动作集合、1 基分页转发、筛选映射（含 `null` 往返）契约 | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：迁移前基线以 `git stash push -- pages/admin/submissions/index.vue`（仅回退该页）在既有 HEAD 下构建采集；迁移后用同环境（chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画）截图。因本批执行环境**无视觉模型**，归因采用「纯标准库 PNG 逐像素 + 行带分布」做区域定位（容差 24/通道），再按组件语义对照；`toHaveScreenshot` 阈值（`maxDiffPixels 200`）不参与该对照，故对照差异量级高于阈值属预期。

- 差异总量：浅色 **7,222 px（Playwright 口径）/ 10,256 px（区域分析口径 0.79%）**；深色 **9,849 / 12,814 px（0.99%）**；包围盒 `x[56,1383] y[164,460]` —— **仅卡片区域**，页头 / 侧栏 / 页脚零差异。
- 过程中收敛掉两处**本批自行引入的非必要几何改动**（列显式 `width`、actions 列 `align: 'right'`）——迁移不应顺带改变列宽与对齐；收敛后浅色差异由 11,196 px 降至 10,256 px。

| 区域 | 迁移前 | 迁移后 | 归因 |
| :--- | :--- | :--- | :--- |
| 筛选行 y[160,200) | PrimeVue `IconField`+`InputIcon`+`InputText` + `Select` | `CaomeiInput`(`#prefix`) + `CaomeiSelect` | **组件替换**（字段外壳 / 触发器 / 聚焦态由 caomei 字段外壳层提供；0.4.0 起统一到基础层 `field-shell.css`） |
| 表头 / 表体 y[200,360) | PrimeVue `DataTable` 表头与网格 | caomei `DataTable` 表头与网格 | **组件替换**（表头底色 / 边框 / 字体；§6.3 有意差异范围内，与 M4 同口径） |
| 空态 y[320,360) | PrimeVue 内建空态文案 | `#empty` 插槽 + `common.no_data` | **有意**（与试点页同口径：空态容器由页面提供） |
| 分页器 y[420,460) | PrimeVue 分页器（居中） | caomei 分页器（居中，经 `pagination-justify` token 对齐） | **组件替换**（分页器自身样式差异约 1.0k px；对齐已保持——残留量级与 M4 记录的对齐错位不符） |

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run tests/modules/ pages/admin/submissions/index.test.ts` = **6 文件 / 35 用例通过**（本页 12 条 = 既有 4 项覆盖 + 新增 8 条）；本页断言覆盖列定义（status / contributor / title / createdAt / actions）与 `#cell-{key}` 插槽按 row 渲染、Tag tone 四态（pending / accepted / rejected / 默认）映射、pending 与非 pending 的动作集合差异、1 基分页事件原样转发、关键词与状态筛选模型映射（`null` 往返）及 `useAdminList` 收到 `pageIndexBase: 1`；扩面后的路由迁移守卫（在册族零残留 + 至少一个 caomei 组件）已覆盖 `/admin/submissions`。`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：`tests/e2e/admin.e2e.test.ts` 的 `should load extended admin management pages`（7 路由矩阵，含 `/admin/submissions`，就绪选择器已改用 `.caomei-data-table`）在**全量并行套件**下两次 30s 超时；按 M4 口径**隔离复跑**（chromium 单 worker、仅该用例）**1 passed / 11.2s**。同轮全量套件另有 webkit `user-workflow` 公开页失败与 `mobile-safari-critical` 失败、chromium `auth-session-governance` 1.5m 超时（后经重跑记为 flaky）。
- **层 ② 验收 spec 的 flaky 定性（本批新增 HEAD 对照证据）**：`pnpm test:e2e:review-gate`（`auth-session-governance.e2e.test.ts`，chromium / firefox / webkit）**12 failed / 6 passed**，与本批改动面（`/admin/submissions` 与 `useAdminList` 分页路径）无交集。按 M4 口径做 **HEAD 对照复现**：`git stash push`（回退全部已跟踪改动）后以同环境跑 chromium 单浏览器同一 spec → **1 failed / 1 flaky / 4 passed**，与迁移后同形。判定：**该 spec 在 master 自身即失败 / flaky（既有问题，非本批回归）**；本批不扩修该 spec（C 类），登记为已知既有 flaky，并把「`auth-session-governance` 在 master 上的稳定失败」作为**阶段内遗留项**另行处理。本路由未做行级 E2E 补强。
- **层 ③（截图识别）**：迁移前基线对照见上；归因完成后已按迁移后状态刷新基线，`pnpm test:visual` **12/12 通过**（新增浅 / 深 2 张 + 既有 10 张，既有页面逐像素零差异——本批未污染其他基线）。

### 未覆盖边界 / 观察项

- TEST_MODE 未播种稿件数据，截图基线为**空态**渲染，故截图层不覆盖行级渲染；行级结构（列定义与列插槽 / Tag tone / 动作集合 / 1 基分页转发 / 筛选映射）已由本页单元层用例逐项断言（见「验证结果」层 ①），本路由未新增行级 E2E。**截图基线 provenance**：迁移前 actual / diff 产物未入库，仓库仅存迁移后快照（浅 / 深 2 张），如需以「迁移前基线」作为判定依据应由 CI 复采。
- 审核弹窗为浮层（PrimeVue 豁免），其内部 caomei `Select` 的浮层层级与 PrimeVue `Dialog` 共存未做截图覆盖（无自动化用例），登记为观察项；异常时按 caomei 0.5.0「模态内浮层面板层级 / z-index 覆盖钩子」复核。
- 分页 `pagination-justify` token 的实际效果未做单页对照实验（仅由差异量级间接判定）；后续路由若要精确还原对齐，应先做对照再定论。
- 本批次写入前已按 [index.md](./index.md) §3.1 完成**滚动归档**（第四十二 ~ 第四十九阶段窗口迁入 [archive/2026-06-04-to-2026-06-13.md](./archive/2026-06-04-to-2026-06-13.md)，`current.md` 由 676 → 448 行）；`index.md` §3.1（300-400 行）与 `docs:check:line-count`（500/700）两套阈值仍不一致，待治理。
- 其余 9 个路由（含 `AppAvatarV2` / `AppUploaderV2` / `PostAuditBadge` 过渡件）仍待办。

<!-- regression-window:end:phase68-b2-submissions:第六十八阶段-条目2-首路由:2026-10-13 -->

<!-- regression-window:start:phase68-caomei-drift-060:第六十八阶段-caomei漂移收口:2026-10-13 -->
## 2026-10-13 第六十八阶段 caomei-ui 0.3.0 → 0.6.0 版本漂移收口

### 范围

条目 1 于 2026-09-26 完成 `caomei-ui@0.3.0` 升级与基线复测后，`caomei-ui` 又经两次 Dependabot 单包升级静默抬版到 `0.6.0`（`53d1dc21` 0.3.0→0.5.0，2026-10-06；`823517f5` 0.5.0→0.6.0，2026-10-11），两次提交只改 `package.json` / `pnpm-lock.yaml`，未按迁移方案 §5.6「0.x 不得静默升级，每次升级须先读目标版本 `BREAKING CHANGES` 并重跑该批回归」留任何复测与记录，规划 / 设计文档也仍停在 `0.3.0` 口径。本批补做升级纪律要求的全部动作：补读 `0.4.0` / `0.5.0` / `0.6.0` 的 `BREAKING CHANGES` 与影响面、按 `0.6.0` 重数组件清单、重跑三层视觉回归与包体预算、同步受影响文档。对应 [todo.md](../../plan/todo.md) 第六十八阶段条目 1 的补记。

### BREAKING CHANGES 阅读结论（升级纪律）

- 三个版本（`0.4.0` 2026-09-29 / `0.5.0` 2026-09-30 / `0.6.0` 2026-10-08）`CHANGELOG` **均无 `BREAKING CHANGES` 段落**；`0.2.0` 的 `styles.css → theme.css` 仍是迁移期内唯一破坏性包形态变更（M1b 已处理）。
- exports 面（`.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json`）与 `0.3.0` 一致，不需重定样式入口或 `injectStyles` 唯一性口径。
- 主题 token **取值未变**：`src/styles/theme.css` 的 `v0.3.0 → v0.6.0` 差异只有选择器由 `:root` 扩写为 `:root, [data-preset='minimal']` 与相应注释（把既有默认预设正式命名为「极简」），无任何 token 值增删改；`presets/caomei.css` / `presets/momei.css` 未变。故缺省渲染与 `0.3.0` 逐值一致，momei 侧「不启用 `data-preset='momei'`」的既有决策不受影响。
- 基础层**字节级变化**：`theme.css` 落点新增 `@import './field-shell.css'`（库侧 0.4.0「抽离字段外壳共享样式层并迁移 4 组件」），基础层由 5,880 B / gzip 1,089 B 增至 9,492 B / gzip 1,719 B。基础层是 `keyCss` 里**唯一的 caomei-ui 贡献来源**，故 `keyCss` 的增量可归因到它。
- 其余变更面（0.4.0：Button `iconOnly`、DataTable 分页对齐 token、Select `#value` 触发器插槽、soft 变体底色 8%、字段外壳共享层；0.5.0：`CaomeiRichTextEditor` 新组件、浮层 z-index 语义门禁、模态内浮层层级修正；0.6.0：DataTable 排序指示条常驻占位、组件背景色与阴影更新、Tabs 与 a11y 修正）均为库侧能力增强与缺陷修正，**momei 当前消费面零命中**，不产生迁移动作。

### 组件清单（0.6.0 口径重数）

自动导入组件 **81 项**（`0.3.0` 的 80 项 + `0.5.0` 新增 `CaomeiRichTextEditor`；按库侧 `src/nuxt/components.ts` 在 `v0.3.0` / `v0.6.0` 标签逐项对账，唯一差集即该组件）。`CaomeiRichTextEditor` momei 零用量；试点页消费清单仍为 5 族 / 8 处（`CaomeiButton` ×3、`CaomeiSelect` ×2、`CaomeiTag` ×1、`CaomeiInput` ×1、`CaomeiDataTable` ×1），与 `0.3.0` 批一致。

### 上游反馈缺口闭合（0.4.0 交付）

`0.4.0` 交付的三项能力正好闭合 [上游反馈清单](../../design/governance/2026-09-25-caomei-ui-upstream-feedback.md) 中标为「真实缺口」的 1.3 / 1.4 / 1.5，并在 `0.6.0` 产物中实测存在：Button `iconOnly`（`dist/components/button/types.d.ts` 有 `iconOnly?: boolean`）、DataTable `--caomei-data-table-pagination-justify` token、Select 触发器 `#value` 插槽。**对 B2 的影响**：原需在多个列表页重复的「行内图标按钮本地类」与「分页对齐选择器覆盖」补丁不再必需，B2 剩余页可直接用库侧原生能力；`Select` 触发器插槽也解除了语言切换器一类的等价迁移限制。B2 各批「文件 → 改动点」清单应改按 `0.6.0` 能力口径引用（见迁移方案 §5.5 / §6）。

### 包体复测与归因

- **本批实测**（`pnpm test:perf:budget`）：`keyCss` **61,311 B**（59.87KB / 70KB 配额）、`coreEntryJs` 343,968 B（335.91KB / 360KB）、`maxAsyncChunkJs` 50,346 B（49.17KB / 130KB）、`prIncrementJs` 6,960 B（6.80KB / 20KB），**全项不越线**。
- **可归因到 caomei-ui 的部分（字节级对照）**：基础层 5,880 B / gzip 1,089 B → 9,492 B / gzip 1,719 B（+3,612 B 原始 / **+630 B gzip**，全部来自新增 `field-shell.css`），对应 `keyCss` 实测 60,896 B → 61,311 B（**+415 B**）。同口径（gzip）对照下基础层 +630 B 对 `keyCss` +415 B，差 215 B 为与入口既有 CSS 合并压缩的收益。
- **基线状态（显式记录，避免误读为已对齐）**：`.github/perf/bundle-baseline.json` 保持 0.3.0 批次口径不变，其参考值已低于当前实测（`keyCssGzipBytes` 60,896 vs 61,311；`coreEntryJsGzipBytes` 337,008 vs 343,968），本批**不刷新基线**。
- **归因边界（未做逐提交字节对照，不写结论）**：`coreEntryJs` 相对 0.3.0 批次基线（2026-09-26 刷新）的 +6,960 B 与 `maxAsyncChunkJs` 的 +1,199 B **不落在 caomei-ui**（其 JS 产物未变，新增的 `CaomeiRichTextEditor` momei 零消费），系 0.3.0 批次之后的其他依赖变更（nuxt 4.5.2→4.6.1、`@sentry/nuxt` 10→11 等）的累计差；本批不做进一步归因，`.github/perf/bundle-baseline.json` 保持 0.3.0 批次口径不变，是否重取基线交由 B2 各批或 B4 决定。

### 验证结果

- **层 ①（单元）**：`tests/modules/ui-library-route-migration-guard.test.ts` 3/3 通过（在册族零残留守卫在 `0.6.0` 组件清单下仍成立）。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10 通过**（列表 / 表单 / 浮层 / token 桥接，浅深双主题），**零像素差异**——`0.6.0` 对既有基线零影响，无需逐项归因（与上条「基础层只新增字段外壳变量与类，且语义 token 由 momei 桥接覆盖」一致）。
- **层 ②（E2E 功能）**：复用当前 `master`（`39e00f21`，即 `0.6.0` 状态）的 CI `Test` 全 job 证据——`E2E (1/4~4/4)` / `Unit` / `Coverage` / `Build & Lighthouse` 均 success；本批未重跑 E2E。
- **质量门**：`pnpm typecheck` 通过；`pnpm test:perf:budget` 全项不越线。

### 未覆盖边界 / 观察项

- **治理缺口（本批触发原因）**：`caomei-ui` 作为精确锁定的迁移在飞依赖，仍被 Dependabot 单包升级路径抬版；在 `0.x` 不承诺语义兼容的前提下，该路径缺少「升级须读 `BREAKING CHANGES` + 重跑该批回归」的强制拦截。已在迁移方案 §5.6 补记「迁移收尾前须为 `caomei-ui` 配置 Dependabot `ignore` 或改走人工升级」，避免再次静默漂移。
- **本批为纯文档收口，无代码 / 依赖改动**：`package.json` 的 `caomei-ui: 0.6.0` 与锁文件已是现状，文档口径对齐即完成。
- `major` 级 Dependabot 升级（PR #745 `markdown-it 15` / #748 `better-auth 1.7`）与 `master` 上 `Publish Docker Image` 的 build 红灯不在本批范围，另行处理。
- **滚动归档逾期（本批新增观察项）**：本文件已约 675 行 / 20 个窗口，超过 [index.md](./index.md) §3.1 的「300-400 行或 6-8 条记录即须先滚动归档」阈值。按 [backlog.md](../../plan/backlog.md)「滚动归档由回归层在阶段收口时统一触发」，本批属阶段中途收口、**不触发归档**，登记为第六十八阶段收口必办项。另：`index.md` §3.1 的行数阈值（300-400）与 `docs:check:line-count`（warn>500 / error>700）不一致，建议一并校准（推荐以 `backlog.md` 的 500-700 / 700+ 为单点口径、`index.md` 改为指针引用），避免两套口径长期并存。
- **审计提示的归因边界**：`0.6.0` 的「组件背景色与阴影更新」属全局样式面，本批以 10 条视觉基线零差异佐证「当前消费面零命中」；若某已消费组件的变体未被这 10 条基线覆盖，细微波级变化存在漏检可能（观察项，交由 B2 逐页回归覆盖）。

<!-- regression-window:end:phase68-caomei-drift-060:第六十八阶段-caomei漂移收口:2026-10-13 -->

<!-- regression-window:start:phase68-item1-upgrade-030:第六十八阶段-条目1:2026-09-26 -->
## 2026-09-26 第六十八阶段 条目 1 caomei-ui 升级到 0.3.0 与基线复测

### 范围

`caomei-ui` `0.2.0` → `0.3.0` 精确锁定升级（不加 `^`、无 `file:` 形态）；升级前读 `CHANGELOG` 确认 `BREAKING CHANGES`；重跑视觉回归与定向测试；`keyCss` 重测与 `.github/perf/bundle-baseline.json` 刷新；「零 caomei 组件消费」口径澄清；组件消费清单按 `0.3.0` 口径重数。对应 [todo.md](../../plan/todo.md) 第六十八阶段条目 1。

### BREAKING CHANGES 阅读结论（升级纪律）

`0.3.0`（2026-09-24 发布）`CHANGELOG`（[GitHub `master/CHANGELOG.md`](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/CHANGELOG.md)，npm tarball 内不含 changelog，经 `npm view` / tarball 列表核实）无 `BREAKING CHANGES` 段落（唯一破坏性变更为 `0.2.0` 的 `styles.css → theme.css`，已在 M1b 处理）。变更面：DataTable 能力增强（可折叠分组 / 多列排序与降序优先 / 行展开 / 行分组）、新增 `TagsInput` 组件、docs 面 6 项。exports 面（`.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json`）与 `sideEffects` 与 `0.2.0` 一致。**关注点**：DataTable 排序语义变化可能影响消费页，故定向回归以试点页（消费 `CaomeiDataTable`）为重点。

### 升级记录

- `package.json` / `pnpm-lock.yaml` 精确锁定 `caomei-ui@0.3.0`，lockfile diff 仅该包（无无关 churn）。
- `caomei-ui/nuxt` 的 `theme.css` 注入点保持唯一（§5.7 约束 3 继续成立）。

### keyCss 复测与口径澄清（包体归因）

- **本批实测**（`pnpm test:perf:budget`）：`keyCss` **60,896 字节**（59.47KB / 70KB 配额）；`coreEntryJs` 337,008；`maxAsyncChunkJs` 49,147。全部不越线。
- **口径澄清（原「零消费」前提修正）**：「momei 零 caomei 组件消费故组件样式零进入产物」仅成立于 0.2.0 重锚时点。组件样式**随消费方 chunk 归属**——当前消费面（B2 试点 5 族）的组件样式落在路由 chunk（`comments.*.css` 含 `caomei-badge` 等组件类），入口 `entry.*.css` 仅含基础层（`.caomei-root` ×1、`--caomei-*` token ×167；在册组件类 `caomei-button` / `caomei-data-table` / `caomei-tag` / `caomei-badge` / `caomei-avatar` / `caomei-toggle` / `caomei-paginator` 零命中，`caomei-select` / `caomei-input` / `caomei-skeleton` 的命中均为 `--caomei-*` token 名如 `--caomei-select-max-width`）。若入口 / 全局壳消费组件，其样式将计入 `keyCss`。
- **归因更正（审计 RG-B1）**：`0.2.0` 与 `0.3.0` 的基础层字节级一致（`dist/styles/index.css` 同 sha256，5,880 B / gzip 1,089 B），**0.3.0 升级对三项包体指标贡献 0**；且 M4 期（仍锁 0.2.0）记录已为 59.47KB / 329.11KB / 48.00KB，与本批实测一致。较 M1b 期（2026-09-24）基线 60,684 / 336,333 / 49,055 的 **+212 / +675 / +92 系相对 M1b 期的累计差**（入口 CSS 侧净增量，主因 M3 `html:root` token 桥接块），**非 0.3.0 单批增量**。`.github/perf/bundle-baseline.json` 指标与 `note` 已按该口径刷新；`docs/standards/performance.md` 与迁移方案 §8.4.1 的「口径待复测」同步闭环。

### 组件消费清单（0.3.0 口径重数）

B2 试点页 5 族 / 8 处，与升级前一致：`CaomeiButton` ×3、`CaomeiSelect` ×2、`CaomeiTag` ×1、`CaomeiInput` ×1、`CaomeiDataTable` ×1。`0.3.0` 新增 `TagsInput` **零用量**；DataTable 新能力（`expandableRows` / `rowGroup` / `multiSort`）零用量。上游组件清单按 `0.3.0` 重数为 80 项（79 + `TagsInput`），迁移方案 §5.1 已同步。

### 验证结果

- **层 ①（单元）**：路由迁移守卫 + `lib/ui-library` + 试点页单测 **25/25**；批次收尾全量 `pnpm test` **4497 通过 / 533 文件**（1 skip 为既有）。
- **层 ②（E2E 功能）**：试点页定向 `tests/e2e/admin.e2e.test.ts` chromium **7/7**（含 `/admin/comments` + `.caomei-data-table` 断言）。全量 E2E 抽查出现 `installation` / `posts` / `public-pages` / `seo-regression` 30s 超时，**隔离复跑 17 通过 / 1 flaky（`/archives` retry 过）/ 1 失败**，判定为负载超时；唯一稳定失败 `seo-regression` 文章详情 SEO 用例已**逐请求归因**：挂起资源为作者头像外链 `https://0.gravatar.com/avatar/…`（沙箱不可达拖死 `load` 事件，页面 DOM 完整渲染、该页零 caomei 消费），属**环境固有 flaky，非本批回归**（对照 M4 的 flaky 判定口径）。处置：不扩修测试代码（C 类），登记为已知环境 flaky。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10 通过**（列表 / 表单 / 浮层 / token 桥接，浅深双主题），无像素差异——0.3.0 对既有基线零影响，无需归因。
- **质量门**：`pnpm typecheck` 通过；`pnpm lint` 0 error（3 条既有 warning 在 `packages/cli`，不在本次面）；`pnpm test:perf:budget` 全项不越线。

### 未覆盖边界 / 观察项

- 全量 E2E 三浏览器矩阵未完整重跑（迁移方案 §8.1 不要求每批全量）；gravatar 外链拖死 `load` 的环境 flaky 已登记，若后续阻塞可考虑测试侧拦截外链头像（属测试有效性主线候选，不进本批）。
- DataTable 多列排序 / 行分组等新能力零用量，其行为差异清单待 B2 剩余页用到时再核对。

<!-- regression-window:end:phase68-item1-upgrade-030:第六十八阶段-条目1:2026-09-26 -->



