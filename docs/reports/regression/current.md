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
| `tests/visual/parity/routes.ts` + `tests/visual/parity-budget.json` | `admin-waitlist-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；按实测校准允许清单。参考态 provenance（迁移前 HEAD 就地采集 ≡ 对该迁移提交 `--revert`）**不写回机器生成的 `reference-manifest.json`**（重采会被覆盖），改记于门禁规范 §5 / §7.2 与偏差处置表 | §8.2 层 ③（门禁层） |
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
| `tests/visual/parity/routes.ts` + `tests/visual/parity-budget.json` | `admin-ad-campaigns-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；按实测校准允许清单（见下） | §8.2 层 ③（门禁层） |

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

<!-- regression-window:start:phase68-b2-ad-placements:第六十八阶段-条目2-第五路由:2026-10-14 -->
## 2026-10-14 第六十八阶段 条目 2 第五路由 B2 迁移（`/admin/ad/placements`）

### 范围

条目 2（B2 剩余数据页迁移一）的第五个路由 `/admin/ad/placements` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 409 行 / 7 个 PrimeVue 列组件 / 22 处在册族开口标签（6 个组件名），同为**同名文件形态**（`pages/admin/ad/placements.vue`）与**客户端分页 + 行内编辑弹窗**形态，额外含「启用 / 停用」行内切换动作。守卫的两种页面文件形态与 `Dropdown` 在册口径已由上一路由批次铺好，本批无需再改守卫。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/ad/placements.vue` | `DataTable` + 7 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`）；页头创建与行内动作按钮 → `CaomeiButton`（行内用 0.6.0 `iconOnly` + lucide `#icon`）；`Tag severity` → `tone`（位置 `secondary` → `neutral`、格式 `info` → `primary`、状态 `success` / `danger` 直通）；弹窗内 `InputText`×2 → `CaomeiInput`、`Dropdown`×3 → `CaomeiSelect`、页脚 `Button` → `CaomeiButton`（**可见文案落默认插槽**）；`p-invalid` 类 → `:invalid` 布尔 | §6.1 / §6.2 / §6.3 / §5.3 / §5.5 |
| 同上 | 「启用 / 停用」切换按钮的 `:icon`（`pi pi-eye-slash` / `pi pi-eye` 动态切换）→ `#icon` 插槽内的 `EyeOff` / `Eye` 条件渲染 | §6.2 图标 |
| 同上 | 动作列沿用迁移前 `class="text-right"` + `style="min-width: 8rem"`，以 `align: 'right'` + `headerStyle` / `bodyStyle` 等价还原；其余列不新增显式宽度 | 迁移不改几何 |
| 同上 | 客户端分页：`paginator` + `:rows="10"`，不传 `page` / `lazy` / `total-records` 且不监听 `@page`；分页对齐用 `--caomei-data-table-pagination-justify: center` 保持 PrimeVue 原居中口径；删除失效的 `p-datatable-sm` | §3.8 / §6.2；可删除代码收敛 |
| 同上 | `Dialog` / `ConfirmDialog` / `useConfirm` 维持 PrimeVue（显式豁免）；`InputNumber`（优先级）/ `Checkbox`（启用）不在 B2 在册族（§5.5 显式豁免枚举），保持 PrimeVue；弹窗 `p-fluid` 为其保留并已注释说明 | §5.5 / 条目 2 非目标 |
| `i18n/locales/{zh-CN,en-US,ja-JP,ko-KR,zh-TW}/admin-ad.json` | 新增 `pages.admin.ad.placements.actions.{enable,disable}` 两键（五语种同步）——迁移前该切换按钮**既无可见文本也无可访问名**，而 caomei `iconOnly` 契约要求 `label` 提供可访问名，故按 `:label` 补齐 | caomei `CaomeiButton` API；§6.2 可访问名 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/ad/placements` | §5.5 |
| `pages/admin/ad/placements.test.ts`（新增） | 14 条契约用例：页头创建按钮（含可见文案）、列定义与 `align`、`#cell-*` 插槽按 row 渲染（适配器名解析与未知回退、状态文案翻转）、Tag tone 四态、动作集合与 `iconOnly` 形态、**启停按钮可访问名随状态翻转 + 图标两态**、客户端分页委托、弹窗字段映射与 `:invalid`（含 `optionLabel` / `optionValue` 语义）、编辑态回填、保存校验、删除确认、启停 PUT 请求体与成功提示分支、空态 | §8.2 层 ① |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵 `/admin/ad/placements` 就绪选择器 `.p-datatable` → `.caomei-data-table` | 层 ② 改写 |
| `tests/visual/parity/routes.ts` + `tests/visual/parity-budget.json` | `admin-ad-placements-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；按实测校准允许清单（见下） | §8.2 层 ③（门禁层） |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：`pnpm test:visual:parity`（参考态取自迁移前 HEAD；chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画 / pixel threshold 0.2）。归因前先用**参考态行 / 列带扫描 + 实时 `getBoundingClientRect` 探针**核验几何：

- 表格左 / 上边界两态一致（`x=88`，参考态与当前态的下边框均在 `y≈235`，实测 `boundingRect` `x88 y204 w1264`）；页头创建按钮两态均右边缘对齐 `x=1375`、高 36px（参考 81px 宽 vs 现 73px 宽，属按钮排版差异）。
- 分页器两态**均居中**：参考态内容 `x[646,793]`、当前态 `x[668,771]`，中心均落在页面中线 `x=720` —— `--caomei-data-table-pagination-justify: center` 生效；差异为空态行高导致的垂直下移（参考 `y≈390` vs 现 `y≈410`），与既有 4 条列表路由同型。

| 区域（浅色坐标） | 迁移前 | 迁移后 | 实测（浅 / 深） | 归因 |
| :--- | :--- | :--- | :--- | :--- |
| 表头行 `y[200,240] x[80,1360]` | PrimeVue `DataTable` 表头（`p-datatable-sm` 压缩档） | caomei `DataTable` 表头 | 4564 / 4676 | **组件替换**（表头底色 / 边框 / 字号 / 单元格内边距；压缩档删除后行高改由 caomei token 推导） |
| 空态 + 分页区 `x[640,800] y[280,480]`（深色 `x[80,1360] y[280,480]`） | PrimeVue 空态 + 文本式分页器（居中，`y≈390`） | caomei 空态 + 实边框分页器（居中，`y≈410`） | 1965 / 4472 | **组件替换**（空态行高差异导致分页器垂直下移；水平对齐已用 token 收敛） |
| 头部语言切换字段 `x[200,360] y[80,160]` | PrimeVue `Select` 字段外壳 | caomei 字段外壳（过渡组件 `ContentLanguageSwitcherV2`） | 863 / 878 | **组件替换**（与既有 4 路由同区域同量级） |
| 头部创建按钮 `x[1280,1400] y[80,160]` | PrimeVue `Button`（`label` + `pi` 图标） | `CaomeiButton`（primary 实底 + lucide 图标） | 599 / 617 | **组件替换**（边框 / 底纹 / 排版；右边缘与高度已对齐） |

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/ad/placements.test.ts tests/modules/ui-library-route-migration-guard.test.ts` = **37 用例通过（本页 14 条 + 守卫 23 条）**；守卫用例数随 `CAOMEI_UI_ROUTE_PREFIXES` 增长——其中一组为 `for (const prefix of …)` 的循环用例，**每登记一个路由前缀即 +1 条**（本批 5 → 6 前缀，故 22 → 23）。`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` / `pnpm lint:i18n` 通过。
- **层 ②（E2E 功能）**：`node scripts/testing/run-e2e.mjs --grep=extended --project=chromium` = **1 passed / 18.8s**（矩阵现覆盖 9 路由；本批只把 placements 行的就绪选择器由 `.p-datatable` 改为 `.caomei-data-table`，**未新增矩阵行**；该用例已显式 `test.setTimeout(60000)`）；firefox / webkit 本机缺失对应版本目录，属环境限制。
- **层 ③（截图识别 · 门禁层）**：`pnpm test:visual:parity` **22/22 通过**；本路由浅 7991px / 0.617%、深 10643px / 0.821%，允许清单扣减后未归因 **0px**；其余 20 条零回归。
- **全量单测**：`pnpm test` 539 文件 / 4590 用例通过（1 skipped；较上一路由批次 +15 = 本页 14 条 + **因新登记前缀触发的守卫循环用例 1 条**）。
- **计数 / 声明更正（本窗口初版与提交 `717740ae`、`d3aadfb2` 的信息有误，以此为准）**：
    1. 初版层 ① 记为「36 用例（守卫 22 条）」、层 ② 记为「矩阵覆盖 10 路由」，均与提交态不符——实测为 **37 用例（守卫 23 条）** 与 **9 路由**。成因：守卫含一条随登记前缀增长的循环用例（易被漏计），而 E2E 矩阵本批只改选择器未加行。
    2. `d3aadfb2` 的信息称「单语种提交会让 `lint:i18n` 的键集合一致性检查失败」——**实测不成立**：仅删 `en-US` 的一个键后 `pnpm lint:i18n` EXIT 0。跨语种键漂移实际由 `pnpm i18n:audit:missing`（`--fail-on-missing`，在 `regression:weekly` 内执行）检出（EXIT 1 并列出缺失键）；`pnpm i18n:check-sync` 默认只报告（EXIT 0），需 `--fail-on-diff` 才阻断（实测 EXIT 1）。五语种同批提交的结论不变，但**把关者是 `i18n:audit:missing`，不是 per-PR 的 `lint:i18n`**——该覆盖面差异已登记 backlog。
- **i18n**：新增 2 键在 5 个语种镜像中键集合完全一致（脚本比对 missing 0 / extra 0）；`pnpm lint:i18n` 通过。
- **包体**：本批未新增依赖，`pnpm build` 通过。

### 未覆盖边界 / 观察项

- **新增 i18n 键属「可访问名补齐」而非文本变更**：迁移前该切换按钮为无可见文本、无可访问名的纯图标按钮；caomei `iconOnly` 要求 `label`，故按 `actions.enable` / `actions.disable` 补齐可访问名（五语种同步）。该补齐**不改变任何渲染**（`label` 只落 `aria-label`），故视觉门禁基线不受影响；由于是行为面（可访问性）的唯一变化，特此显式登记。
- 本路由未新增基线层用例：理由同第四 / 第三路由（§8.2 层 ③ 采集对象「列表 / 表单 / 浮层各 1」已由既有 6 条基线满足，逐路由守线由门禁层承担）。
- TEST_MODE 未播种广告位数据，门禁基线为**空态**渲染；行级渲染（列插槽 / Tag tone / 适配器解析 / 动作集合与可访问名 / 启停请求体）由单元层逐项断言覆盖。
- `InputNumber` / `Checkbox` 仍为 PrimeVue（§5.5 显式豁免枚举，随 B3 表单批次）；本页 `label for` 与 caomei 字段 `id` 的真实关联由库源码实证（`input.js` / `select.js` 把 `props.id` 绑到内层控件），浏览器侧点击聚焦未由本批验证。
- 剩余 4 条路由均需先落基建：`subscribers` / `users`（+`AppAvatarV2`）、`posts`（+`PostAuditBadge` 过渡件）、`friend-links`（+`AppUploaderV2`）；`migrations/link-governance` 可直接推进（守卫形态与 `Dropdown` 口径已铺好，且其页面无待新增过渡组件）。

<!-- regression-window:end:phase68-b2-ad-placements:第六十八阶段-条目2-第五路由:2026-10-14 -->

<!-- regression-window:start:phase68-b2-link-governance:第六十八阶段-条目2-第六路由:2026-10-15 -->
## 2026-10-15 第六十八阶段 条目 2 第六路由 B2 迁移（`/admin/migrations/link-governance`）

### 范围

条目 2（B2 剩余数据页迁移一）的第六个路由 `/admin/migrations/link-governance` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页 724 行 / 7 个 PrimeVue 列组件 / **30 处在册族开口标签（6 个组件名）**——是当前在册族标签最多的路由（`Button` 9 / `Tag` 7 / `Select` 4 / `InputText` 2 / `DataTable` 1 / `Column` 7），含**懒加载服务端分页 + 详情浮层 + 执行表单**三段交互。同名文件形态（`pages/admin/migrations/link-governance.vue`），守卫无需再改。

**本路由是当前差异最大者**（浅 32070px / 深 34819px，约为既有 6 条路由的 2.2–4.0 倍），故本窗口的归因段落显著长于前五条——差异由「约 20 个在册族组件替换 + 表头行高 -10px + 字段行盒 36px vs 36.39px 的 1px 累计位移」三部分构成，逐项证据见下。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/migrations/link-governance.vue` | `DataTable` + 7 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`；迁移前列组件**均未声明 `field`**，故按插槽语义命名 key）；页头刷新 / 执行区 / 筛选区 / 行内 / 浮层页脚共 9 处 `Button` → `CaomeiButton`（**可见文案落默认插槽**、图标走 lucide `#icon`）；`InputText`×2 → `CaomeiInput`；`Select`×4 → `CaomeiSelect`（筛选两处保留 `show-clear`）；`Tag`×7 → `CaomeiTag`（`severity` → `tone`：`info`→`primary`、`secondary`/`contrast`→`neutral`、`warn`→`warning`） | §6.1 / §6.2 / §6.3 / §5.3 / §5.5 |
| 同上 | **服务端分页页码基准切换**：`@page` 载荷由 PrimeVue 0 基改为 caomei 1 基，原实现恒 `page = event.page + 1` 改为直接取载荷；并补 `:page="page"` 进入受控分页 | 跨组件库事件语义（本页自持 `page`，未走 `useAdminList`） |
| 同上 | 动作列 `class="text-right"` → 列级 `align: 'right'`；其余列不新增显式宽度 | 迁移不改几何 |
| `pages/admin/migrations/link-governance.scss` | 新增 `&__field, &__filters { --caomei-select-max-width: 100% }`——**修复一处本批引入的几何回归**：caomei Select 字段外层默认带 `20rem` 上限（= 320px），会把执行区 / 筛选区下拉截到 **319px 内容宽**（迁移前占满网格单元格 421px）；token 须设在字段外层的**祖先**（`class` 只落触发器，自定义属性不向上继承） | §6.2「全宽：`fluid` → 默认 `width: 100%`；选择器家族另带 `20rem` 上限，需覆盖对应 `*-max-width` token」 |
| 同上 | 新增 `&__table { --caomei-data-table-pagination-justify: center }` 保持 PrimeVue 原居中口径 | §3.8 / §6.2 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/migrations/link-governance` | §5.5 |
| `pages/admin/migrations/link-governance.test.ts`（新增） | 14 条契约用例：页头刷新按钮、列定义与 `align`、`#cell-*` 插槽按 row 渲染（发起人 name→email→userId 回退链、摘要三行、`redirectSeedCount`）、Tag tone 四态映射、**服务端分页 1 基直接采用**（断言 `@page{page:2}` 写回 `page=2` 且按新页码重取）、筛选应用 / 重置的页码归位与查询参数、执行表单→请求体映射、apply 按钮启用门槛（需 `applyConfirmed` + `reviewedDryRunReportId`）、详情渲染（作用域 / 摘要 / 差异项 5 种状态 tone / redirect seeds）、空态、列表与详情失败分支、未在册族 PrimeVue 组件仍保留 | §8.2 层 ① |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵新增 `/admin/migrations/link-governance` → `.caomei-data-table, .admin-link-governance`（矩阵 9 → 10 行） | 层 ② 扩面 |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-link-governance` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；允许清单按 **9 个非重叠功能带**校准（各带声明值 = 该带实测差异像素本身，求和等于全图实测值） | §8.2 层 ③（门禁层） |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

**几何核验方法**：本路由差异量级异常（约为既有 6 条路由的 2.2–4.0 倍），故除「参考态 PNG 行列带扫描」外，**额外把迁移前源码临时恢复到 HEAD 就地构建一次**（`git checkout HEAD -- <页面/scss/lib>` → `pnpm build` → 浏览器探针 → 恢复改动 → 重建），从而取得两态**同口径的 `getBoundingClientRect` 实测值**（而非仅靠 PNG 推断）。

| 量测点 | 迁移前（PrimeVue） | 迁移后（caomei） | Δ |
| :--- | :--- | :--- | :--- |
| 文档高度 | 1247px | 1242px | **−5** |
| 执行区网格 `y` / 高 | 336 / 201 | 336 / 201 | 0 |
| 第 1 行 `MultiSelect` `y`（**未迁移，两态同为 PrimeVue**） | 356 / 36.39px | 356 / 36.39px（探针取整显示 36） | 0 |
| 第 2 行 `InputText`/`Input` `y` | 429 | 428 | −1 |
| 第 3 行 `Select` `y` | 501 | 501 | 0 |
| 筛选行 `y` | 732 | 731 | −1 |
| 复选框行 `y` | 562 | 561 | −1 |
| 执行动作行 `y` | 606 | 605 | −1 |
| 卡片 1 高 | 426 | 425 | −1 |
| 卡片 2 `y` / 高 | 666 / 359 | 665 / 356 | −1 / **−3** |
| 表格 `y` / 高 | 793 / 208 | 791 / 205 | −2 / −3 |
| **表头行高** | **43px** | **33px** | **−10** |
| 筛选下拉宽（网格单元格内） | 421px | 421px（修复后；修复前 319px） | 0 |
| 字段行盒高度 / 字号 | 36.39px / 16px | 36px / 14px | −0.39 / −2 |

> 表中「迁移前 / 迁移后」列为探针 `getBoundingClientRect` 的**整数取整**输出；仅当需要判定亚像素来源时才引用原始小数（见归因③）。故 Δ 列不代表逐点独立实测的精确差值。

**三部分归因**：

1. **组件替换（主体）**：约 20 个在册族组件（9 `Button` / 7 `Tag` / 4 `Select` / 2 `InputText` / 表格 7 列 + 分页器）替换为 caomei——字段外壳盒模型、字号（caomei 字段 14px vs PrimeVue 16px）、按钮边框 / 底纹 / 排版、Tag `tone` 色板均属 §6.2 / §6.3 已接受差异，处置走通道① `--caomei-*` token。
2. **表头行高 −10px**：PrimeVue `DataTable` 表头行 43px → caomei 33px。**与表体的关系**：表头 −10px 会把表体起点上移 10px，但 caomei 空态行比 PrimeVue 高约 7px，两者相抵后**表格总高仅 −3px**（208 → 205，`y` 793 → 791）——即表头变化被空态行高部分抵消，**不存在「表体与分页器整体上移 10px」**；表体内部（空态行 / 分页器）的差异见归因表与带 I 说明。
3. **字段行盒 0.39px 的亚像素累计 → 1px 级（整数取整）下游位移**：caomei 字段行盒 `36px`（固定高度 token `--caomei-control-height-md: 36px`，font 14px）vs PrimeVue `36.39px`（font 16px / line-height 18.4）——**第 1 行 `MultiSelect` 未迁移、两态同高**，真正缩短的是第 2 行（`CaomeiInput`）与第 3 行（`CaomeiSelect`），合计约 `2 × 0.39 ≈ 0.78px`。**该亚像素差是本批唯一可归因的几何来源，与观测到的下游 1px 级位移「量级一致」**（探针为亚像素输出：当前态字段行 `y=428.44`、筛选行 `y=730.92`；本表其余量测点的探针值为整数取整后的呈现，故 `429 → 428`、`732 → 731` 等记法是**取整表现**，不是逐点独立实测的完整 1px）。**本窗口不做逐点因果断言**：0.78px 的亚像素累计经浏览器行盒取整后，在下游不同元素上可能表现为 −1px 或 0px（例如第 3 行字段行顶实测两态均为 501），故只声明「量级一致 + 唯一可归因来源」，不声明每个量测点都发生 1px 位移。**该差异源于库侧字段设计口径，本批不做覆盖**（强行对齐需覆写 caomei 字段的 padding / line-height / font-size token，会改变库侧设计意图，超出「迁移不改几何」的可控范围）；已作为口径项登记上游反馈清单 §2.5。

**允许清单（9 个非重叠功能带，声明值 = 各带实测值）**：

| 带 | 区域（浅色坐标） | 浅 / 深（px） | 归因 |
| :--- | :--- | :--- | :--- |
| A | `x[120,380] y[80,160]` | 863 / 878 | 头部语言切换字段外壳（过渡组件 `ContentLanguageSwitcherV2`） |
| B | `x[1280,1440] y[80,160]` | 346 / 525 | 头部刷新按钮（`CaomeiButton` secondary 描边 + lucide 图标） |
| C | `x[40,1400] y[260,340]` | 2229 / 2263 | 执行区「标题 + 描述」文本带的 1px 位移（归因 3） |
| D | `x[40,1400] y[340,545]` | 10773 / 12901 | 执行区字段行（`CaomeiInput`×2 / `CaomeiSelect`×2 + label）：盒模型 + 字号 + 行盒高（归因 1+3） |
| E | `x[40,1400] y[545,600]` | 2574 / 2769 | 复选框行的 1px 位移（`Checkbox` 未迁移，差异全来自归因 3） |
| F | `x[40,1400] y[600,665]` | 2758 / 2569 | 执行动作按钮（干跑 / 执行改写，含 `tone="warning"`） |
| G | `x[40,1400] y[665,790]` | 6141 / 6336 | 报告列表卡片顶部 + 筛选行（`CaomeiSelect`×2 + 应用 / 重置按钮）+ 上游 1px 位移 |
| H | `x[40,1400] y[790,860]` | 5799 / 5993 | 表格表头行（底色 / 边框 / 字号 / 内边距 + **行高 −10px**）。另含**动作列表头对齐差异**：迁移前 `class="text-right"` 在 PrimeVue 表头被 `.p-datatable-column-header-content{display:flex}` 抵消（表头仍左对齐），而 caomei `align:'right'` 同时作用于表头（「操作」表头 x1241 → x1328，+87px）——即「`align` 等价还原 `text-right`」仅对表体成立，表头对齐属本批**新增差异**（已进允许清单） |
| I | `x[40,1400] y[860,900]` | 587 / 585 | **表体空态行**（`暂无治理报告`）：空态行高与文本位置差异。注：分页器位于 `y≈952`，**在本路由的 900px 视口截图之外**，故本带不含分页器 |

> 九带求和 = 全图实测值（浅 32070 / 深 34819），**带外像素为 0**、无余量、无低报——门禁复核时该路由的「未归因差异」应为 0px。

### 验证结果

- **层 ①（单元）**：`pnpm exec vitest run pages/admin/migrations/link-governance.test.ts tests/modules/ui-library-route-migration-guard.test.ts` = 41 用例通过（本页 17 条 + 守卫 24 条）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：`node scripts/testing/run-e2e.mjs --grep=extended --project=chromium` = **1 passed / 18.2s**（矩阵 9 → 10 行，含本路由；该用例已显式 `test.setTimeout(60000)`）。
- **层 ③（截图识别 · 门禁层）**：`pnpm test:visual:parity` **22/22 通过**；本路由浅 32070px / 2.475%、深 34819px / 2.687%，允许清单 **命中 9/9 条**、扣减后未归因 **0px**；其余 20 条零回归。
- **全量单测**：`pnpm test` 540 文件 / 4605 用例通过（1 skipped；较上一路由批次的 539 / 4590 为 **+1 文件 / +15 用例**）。**增量分解**：本页新增 **14** 条 + 守卫 **24** 条（守卫含一条随 `CAOMEI_UI_ROUTE_PREFIXES` 增长的循环用例，本批前缀 6 → 7 故 23 → 24）= 新增 15 条 ✓ 与全量 +15 一致。**计数口径提示**：仓库另有既有文件 `tests/pages/admin/migrations/link-governance.test.ts`（3 条，未改动），按 CLI 过滤器运行时会被一并命中，故 `vitest` 报「2 文件 / 17 条」——本窗口「本页 14 条」指**新增文件本身**。
- **包体**：本批未新增依赖，`pnpm build` 通过。

### 未覆盖边界 / 观察项

- **本路由未新增基线层用例**：理由同前四条路由（§8.2 层 ③ 采集对象「列表 / 表单 / 浮层各 1」已由既有 6 条基线满足；逐路由守线由门禁层承担）。**但本路由是本批唯一「差异量级异常」者**，其 9 带允许清单已按功能带细粒度登记，任何单带内的漂移增长都会被捕获（`allowed = min(带内差异, 声明值)`）。
- **字段行盒 0.39px 差异不做覆盖（已登记上游 §2.5）**：强行对齐需覆写 caomei 字段的 padding / line-height / font-size，会改变库侧设计意图并可能影响已迁移路由的既有基线；本批按「接受 + 登记」处置。该差异在多字段长页面上的可见后果是「文本 1px 重影」，单字段页面（前五条路由）几乎不可见。
- **`Card` / `MultiSelect` / `Checkbox` / `ProgressSpinner` 保持 PrimeVue**：四者均不在 B2 在册族清单内，本批已把 `Card` / `MultiSelect` 补入 §5.5 显式豁免枚举（此前仅列 `DatePicker` / `InputNumber` / `Checkbox` / `ProgressSpinner`），使「为何可在已迁移路由内保留 PrimeVue」有单点出处；页面级样式沿用 `--p-*` token 与 `:deep(.p-card-body)` 即因其仍在 PrimeVue 侧。
- **约 27% 页面高度不在门禁覆盖内（本路由特有）**：门禁为 1440×900 视口截图，本页文档高 1242px，故 `y>900` 的内容（表体下半 + 分页器 `y≈952` + 卡片 2 尾部）**不参与比对**；其中 `--caomei-data-table-pagination-justify: center`（本页分页居中 token）在本路由**未被门禁验证**——两态分页器都在画面外。如需覆盖，应另采 fullPage 参考态（按门禁 §7 前置条件在 CI 复采）或补基线层用例；本批按现状登记为未覆盖边界。
- 剩余 4 条路由（`subscribers` / `users` / `posts` / `friend-links`）均需先落共享壳过渡组件，条目 2 的剩余工作转入基建。

<!-- regression-window:end:phase68-b2-link-governance:第六十八阶段-条目2-第六路由:2026-10-15 -->

<!-- regression-window:start:phase68-transition-shells:第六十八阶段-条目2-过渡组件基建:2026-10-15 -->
## 2026-10-15 第六十八阶段 条目 2 过渡组件基建（共享壳 5 件套）

### 范围

条目 2 剩余 4 条路由（`subscribers` / `users` / `friend-links` / `posts`）均因**共享壳混用**而无法直接整路由切换，故先落过渡组件基建。本批**不迁移任何路由**（`CAOMEI_UI_ROUTE_PREFIXES` 不变），只交付过渡组件、共享行为/状态 composable、样式块抽取与结构守卫。

产出：`AppAvatarV2`、`AppUploaderV2`、`PostAuditBadgeV2`、`PostAuditDialogV2`、`PublishPushDialogV2` 共 5 个过渡组件 + 2 个共享 composable + 3 个样式块抽取 + 1 个新守卫 + 在册族清单单点化。

### 两种择库机制（判定口径见迁移方案 §5.5）

| 机制 | 判定 | 组件 | 关键实现 |
| :--- | :--- | :--- | :--- |
| 组件内按路由择库 | 跨边界展示型壳：消费者 ≥3 且横跨公开页与 admin，组件自身无业务状态 | `AppAvatarV2`、`AppUploaderV2` | 内部调用 `resolveUiLibraryForRoutePath`，未迁移路由回退 V1；可在任意路由安全采用 |
| 消费处静态择库 | admin 专属、消费者恰好两个（一迁移一未迁移）、组件持有状态或 `open()` / `expose` 语义 | posts 三件套（+ M4 既有 `content-language-switcher-v2`） | 组件为纯 caomei 实现；已迁移路由直接用 V2，编辑器路由继续用 V1（避免第二份 `open()` 语义） |

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `components/app-avatar-v2.vue`（新增） | 过渡头像：内部择库 + V1 回退；`image`→`src`、姓名首字母→`fallback`；**档位映射** `small/normal/large/xlarge` → `sm/md/lg`（`xlarge` 有损落 `lg`，上游 §2.1）；`shape` 缺省补 PrimeVue 默认值 `square` 以免两分支分叉。**注（2026-10-15 补记）**：该档位映射已在第七路由批次改为**几何保真**（`large`/`xlarge` 以 `--caomei-avatar-size` 覆盖回 48/64px、非法值回落 32px），见本文件第七路由窗口 | §5.5 / §6.2 / 上游 §2.1 |
| `components/app-uploader-v2.vue`（新增） | 过渡上传字段：内部择库 + V1 回退；`CaomeiInputGroup` + `CaomeiInput` + 纯图标 `CaomeiButton`（补可访问名）；`modelValue` 读写归一（caomei `Input` 的 model 为 `string`） | §5.5 / §6.2 |
| `composables/use-app-uploader-field.ts`（新增） | 抽出两版共用的字段行为（文件选择 / 拖放 / 上传回写 / 上传中与禁用阻断），避免「只修好一版」 | 复用优先（全局规范） |
| `composables/use-publish-push-dialog.ts`（新增） | 抽出两版共用的弹窗状态与语义（`open()` 回填、非法日期容错、`confirm` 载荷形状），不持有 `visible` | 同上 |
| `components/admin/posts/post-audit-badge-v2.vue`（新增） | 过渡审计徽标：纯 caomei（消费处择库）；三态（图标按钮 / 加载 Tag / 结果 Tag）+ `tone` 映射（`info`→`primary`、`warn`→`warning`）+ 自备旋转动画 + 补可访问名 | §5.5 / §6.2 |
| `components/admin/posts/post-audit-dialog-v2.vue`（新增） | 过渡审计详情浮层：**浮层 `Dialog` 与 `ProgressBar` 保持 PrimeVue**，仅内部 `Button` / `Tag` 迁移；页脚可见文案落默认插槽（`label` 只映射可访问名） | §5.5 / §6.2 |
| `components/admin/posts/publish-push-dialog-v2.vue`（新增） | 过渡发布确认浮层：**`Dialog` / `RadioButton` / `DatePicker` 保持 PrimeVue**，仅页脚 `Button` 迁移；`severity="contrast"` → `tone="neutral"`（§6.2 有损近似）；与 V1 共用状态 composable 并保持同一 `open()` / `expose` 契约 | §5.5 / §6.2 |
| `components/{app-uploader,admin/posts/post-audit-dialog,admin/posts/publish-push-dialog}.scss`（新增） | 样式块抽取为独立 scss，供 V1 / V2 共用（**逐字搬迁**：`post-audit-dialog` / `publish-push-dialog` 与 HEAD 样式块逐字一致；`app-uploader` 仅多共享说明注释与一行空行，规则体一致） | 复用优先（全局规范） |
| `components/app-uploader.vue` / `components/admin/posts/{post-audit-dialog,publish-push-dialog}.vue`（改） | V1 改为引用共享 composable 与独立样式块（脚本逻辑等价搬移） | 同上 |
| `lib/ui-library.ts`（改） | 新增并导出 `CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS`——把原先只存在于「文档说明 + 守卫本地常量」的在册族清单收敛为**单点事实源**（含 `Dropdown` 加固项） | §5.5 |
| `tests/modules/ui-library-guard-helpers.ts`（新增） | 抽出「零残留」扫描口径（注释剥离 / 显式导入扣除 / 标签边界匹配），供两个守卫共用 | 避免两处漂移 |
| `tests/modules/ui-library-route-migration-guard.test.ts`（改） | 改为从单点事实源与共享辅助导入（原 24 条用例口径不变） | 同上 |
| `tests/modules/ui-library-transition-component-guard.test.ts`（新增） | 过渡组件结构守卫：① `components/**` 下 `*-v2.vue` 必须全部登记；② 过渡组件内不得残留在册族 PrimeVue 组件且至少渲染一个 caomei 组件；③ 机制声明与实现一致（组件内择库必须**导入并调用**事实源、且保留 V1 回退分支；消费处择库不得引用） | §5.5 |
| 5 个过渡组件测试文件 + 2 个「两版契约等价」测试文件（新增） | 77 条用例：过渡组件侧 53 条（两条分支渲染、档位 / 色调映射、事件与载荷、`open()` 回填与日期容错、`expose` 契约、`extra` 插槽、委托分支 props 透传与上传失败不写回、被替换组件保持 PrimeVue 的边界）；**契约等价侧 24 条**——`publish-push-dialog` 用**同一套行为断言跑 V1 与 V2**（9×2：含浮层标题 / 宽度 / 模态、三档选项 `input-id` 集合、criteria 提示文案）证明消费处替换安全并补齐此前无直接单测的 V1，`post-audit-dialog` 断言**两版正文与页脚内容逐项一致**（分值 / 区块标题 / 因子行 / 建议 / 缓存时间 / 进度条 / 浮层标题 / 页脚文案），使「V2 复刻 V1 正文」的临时重复漂移可被检出 | §8.2 层 ① |

### 验证结果

- **层 ①（单元）**：新增 **77** 条（过渡组件 53：`app-avatar-v2` 12 / `app-uploader-v2` 15 / `post-audit-badge-v2` 6 / `post-audit-dialog-v2` 11 / `publish-push-dialog-v2` 9；契约等价 24：`publish-push-dialog.contract` 18 / `post-audit-dialog.contract` 6）+ 过渡组件结构守卫 **16** 条；`pnpm test` **548 文件 / 4698 用例通过**（1 skipped；较上一批 540/4605 为 +8 文件 / +93 用例 = 77 + 16）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **结构守卫负向验证（3 例，均已还原）**：① 向 `app-avatar-v2.vue` 注入 `<Button label="x" />` → 零残留用例失败；② 把 `resolveUiLibraryForRoutePath(` 改名为 `…Renamed(` → 机制用例失败；③ 把事实源导入改到 `@/lib/ui-library-other` → 机制用例失败。第 ② 例首轮**未被抓到**（裸字符串包含判定被改名骗过），故把判定改为「调用 + 导入来源」双正则后复验通过。
- **层 ③（截图识别 · 门禁层）**：`pnpm test:visual:parity` **22/22 通过**（本批未改任何已迁移路由的渲染路径，属零回归确认）。
- **层 ③（截图识别 · 基线层）**：`pnpm test:visual` **14/14 通过**（含 `/admin/posts` 列表页——其 `PostAuditBadge` 仍走 V1；`post-audit-dialog` / `publish-push-dialog` 的样式块抽取与脚本搬移随之验证）。
- **首轮审计（4 分区并发）**：分区一（avatar / uploader）**Pass**、分区二（posts 三件套）**Pass**、分区三（测试质量）**Pass**；分区四（守卫 + 文档）**Reject**（2 blocker + 5 warning）。已闭环：`lib/ui-library.ts` 新常量**截断 `CAOMEI_UI_ROUTE_PREFIXES` 的 JSDoc 锚点**（文档丢失，已把常量移到该 JSDoc 之前并把在册族枚举改为指针）、**注释声称未迁移路由「已迁移」**（`/admin/posts`、`users` / `subscribers` / `friend-links` 实为「B2 目标路由，本批只交付壳」，已统一改为如实口径）、`AppAvatarV2` 改为**显式 `inheritAttrs: false` + `v-bind="$attrs"`**（不再依赖 Vue 对组件根的隐式 fallthrough）、`fallbackText` 无姓名时传 `undefined`（保留 caomei 回退到 `alt` 首字母的默认能力）、补 `alt` 与 `severity="secondary"` 口径到**组件级差异清单**（`AppAvatarV2` / `AppUploaderV2` 文件头注释；§6.2 表为跨组件映射规则，不逐属性收录组件级补充）、`app-uploader.scss` 补 `--p-primary-*` 的**收口指针**、`usePublishPushDialog` 不再对外暴露未被消费的 `parsePublishedAt`、按审计建议补 8 条断言（上传失败不写回 / 拖放离开清类 / 两分支 class 透传 / 契约侧浮层标题与选项集合与提示文案）；分区四 blocker/warning 闭环：`backlog.md` 行数口径改为脚本实测值（首轮修复时为 628 行；本窗口补「提交拆分依据」后最终为 **645 行 / 余量 55 行**，以 `backlog.md` 记载为准）、窗口构成数字同步、**守卫两处盲区**（机制判定「注释盲」——把真实导入与调用改成注释即可通过；注册表只扫 `components/**/*-v2.vue`——`*-v3.vue` / `FooV2.vue` / `pages/**` 形态漏扫）已修并复验（注释化注入与命名族外探针文件现均被拦下）、机制判定兼容别名 / 命名空间导入、§5.5 机制表补 `content-language-switcher-v2` 并把判定改写为「消费者为单一择库点或恰好两个」、`lib/ui-library.ts` JSDoc 方向与豁免清单指针修正、M4 行标签改为「消费处静态择库」。
- **V1 重构等价性**：三个样式块抽取的**逐字一致性已用脚本核验**（见上表）；`app-uploader` 的 4 条原单测与 6 个消费方测试文件（`friend-links` 管理页 / 公开页、`general-settings`、`commercial-link-manager`、`post-editor-media-settings`、`posts/index`）共 35 条用例全部通过。

### 提交拆分依据（本批规模超 §2.8 单提交阈值的说明）

本批工作树合计 **28 个路径 / 3226 行新增**（`git diff --numstat` 的新增列 + 未跟踪文件行数），远超「单提交 ≤10 文件 / ≤800 行新增」。按模块与依赖顺序拆为 **7 个提交**，每笔均在双阈值内；**文件数合计 28、行数合计 3226，与工作树逐项吻合**：

| # | 提交主题 | 文件数 | 新增行 | 依赖顺序 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | avatar / uploader 过渡组件实现 + 共享字段 composable + 共享外壳样式 | 5 | 385 | 无（被 2 依赖） |
| 2 | avatar / uploader 单元测试 | 2 | 553 | 依赖 1 |
| 3 | posts 三件套实现 + 共享状态 composable + 两个样式块抽取 | 8 | 780 | 依赖 1 |
| 4 | posts 三件套单元测试 | 3 | 591 | 依赖 3 |
| 5 | 两版契约等价测试（`publish-push-dialog` / `post-audit-dialog`） | 2 | 473 | 依赖 3 |
| 6 | 结构守卫（共享扫描辅助 / 过渡组件守卫 / 路由守卫重构）+ 在册族清单导出 | 4 | 350 | 依赖 1、3（守卫要遍历已落地的过渡组件；`lib` 导出被守卫消费） |
| 7 | 文档与治理记录（迁移方案 §5.5、本窗口、`todo`、`backlog`） | 4 | 94 | 依赖全部（记录最终状态） |

拆分依据：① 按「实现 / 测试 / 守卫 / 文档」四类职责切分，每笔可独立评审；② 保持依赖顺序，任何单笔 checkout 后守卫与测试都不会指向不存在的文件；③ 单笔规模上限由测试文件体量决定（`app-uploader-v2.test.ts` 343 行、`publish-push-dialog.contract.test.ts` 277 行等），故测试必须分笔（三件套单测与契约等价测试分开）才能不越 800 行线；④ 表中行数为**逐文件复算值**（`git diff --numstat` 新增列 + 未跟踪文件 `splitlines()` 计数），非估算。提交信息内亦逐笔记录拆分依据。

### 未覆盖边界 / 观察项

- **过渡组件尚未被任何路由采用**：5 个 V2 的 caomei 分支当前**只有单元层覆盖**（视觉层需等各路由迁移批次把它们纳入页面后才生效）。故本批不产生任何路由级视觉变化，门禁层 22/22 属「零回归确认」而非「新界面验证」。
- **基线层不覆盖 `AppUploader`（实测结论）**：向 `app-uploader.scss` 注入 3px 红色描边后重跑 `admin-settings-form` 基线仍 **2 passed**——即该组件不在该基线视口内。因此本批三处 V1 重构的「零视觉漂移」证据**只到「样式块逐字搬迁 + 脚本等价搬移 + 单测」这一层**，不作更强的视觉断言；`friend-links` 迁移批次会把该组件带入门禁覆盖面。
- **`posts` 三件套的消费处切换待办**：本批只交付 V2；`pages/admin/posts/index.vue` 改用 V2、`pages/admin/posts/[id].vue` **必须继续用 V1** 的动作在 posts 迁移批次执行。守卫当前只覆盖「过渡组件自身」的机制一致性，**不检查消费处的选择**——该点作为 posts 批次的显式检查项登记（见 `docs/plan/todo.md`）。
- **`xlarge` 头像档位有损**：caomei 无 `xlarge` 对应档位（上游 §2.1 判定为「设计如此」），V2 落到 `lg`；`settings/profile`（非 B2）仍走 V1，故当前无实际影响。（**2026-10-15 补记**：该档位映射已在第七路由批次改为**边框盒尺寸保真**——`large`/`xlarge` 以 `--caomei-avatar-size` 覆盖回 48/64px、非法值回落 32px，见本文件第七路由窗口）
- **`publish-push-dialog.scss` 含预先存在的死规则**：`&__sync-field` / `&__sync-desc`（Memos 同步功能移除后遗留）两版模板均无引用；本批按「逐字抽取」原样带入共享文件，未顺手删除（属预先存在、非本批引入），登记为后续清理项。
- **两版「`secondary` / `contrast` → `neutral`」落地形态不同**：审计对话框重审按钮走 `variant="secondary"`（既有范式），发布对话框确认按钮走 `tone="neutral"`（§6.2 语义色行）；两者均与仓库既有页面范式一致，`/admin/posts` 路由批次做 parity 时确认该差异是否被偏差处置表吸收。
- **测试风格上的已知限制（审计 suggest，未在本批整改）**：① 多处断言落在 stub 自造的 `data-*` 属性上（真实产物是 `caomei-tag--{tone}` / `caomei-button--{variant}` 类名）——映射**取值**写错仍能被捕获，但断言验证的是 stub 编码而非真实类名（`typecheck` 兜住 prop 名与取值联合类型）；② stub 在 7 个测试文件间有重复且保真度不一致（`Dialog` 3 份、`CaomeiButton` 4 份），建议后续抽到 `tests/modules/` 共享工厂；③ `defineExpose` 暴露的 `visible` ref 未被直接断言（其受控渲染有覆盖）；④ `emailHash` 透传与 caomei `Input` 的输入回写路径（`caomeiModel` 的 `null → ''` 归一 setter）无用例驱动。
- **`post-distribution-button.vue` 无消费者**：扫描显示其未被任何页面 / 组件引用（含 `Tag`），本批不动，作为观察项登记（后续若确认废弃应另行清理，不在本批范围）。

<!-- regression-window:end:phase68-transition-shells:第六十八阶段-条目2-过渡组件基建:2026-10-15 -->

<!-- regression-window:start:phase68-b2-subscribers:第六十八阶段-条目2-第七路由:2026-10-15 -->
## 2026-10-15 第六十八阶段 条目 2 第七路由 B2 迁移（`/admin/subscribers`）

### 范围

条目 2（B2 剩余数据页迁移一）的第七个路由 `/admin/subscribers` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。该页迁移前 194 行 / **15 处在册族开口标签（7 个组件名）**：`Button` 2 / `Tag` 3 / `Column` 6 / `DataTable` 1 / `InputText` 1 / `IconField` 1 / `InputIcon` 1。

**本路由是首个采用共享壳过渡组件的路由**：`AppAvatar` → `AppAvatarV2`（上一批交付的过渡组件），消费处按「已迁移路由用 V2」替换；`ConfirmDeleteDialog`（浮层显式豁免）、`AdminListShell` / `AdminTableEmptyState`（无在册族依赖）保持不变。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/subscribers/index.vue` | `DataTable` + 6 个 PrimeVue 列组件 → `CaomeiDataTable` + `columns` 数组（`#body` → `#cell-{key}`；`field` 列沿用字段名作 key，无 `field` 的两列按插槽语义命名 `user` / `actions`）；导出按钮 → `CaomeiButton`（`variant="secondary"` + lucide `Download` + **可见文案落默认插槽**）；`IconField` + `InputIcon` + `InputText` → `CaomeiInput`（`#prefix` 图标）；`Tag`×3 → `CaomeiTag`（`secondary`→`neutral`、`success`→`success`、`warning`→`warning`）；行内删除按钮 → `CaomeiButton`（`icon-only` + `variant="ghost"` + `rounded` + `tone="danger"` + 补可访问名）；`AppAvatar` → `AppAvatarV2` | §6.1 / §6.2 / §6.3 / §5.3 / §5.5 |
| 同上 | **服务端分页页码基准切换**：`useAdminList` 显式声明 `pageIndexBase: 1`，并把 1 基当前页作为受控值回传 `:page="pagination.page"` | 跨组件库事件语义（§5.3） |
| 同上 | 状态 Tag 的内联 `style="cursor: pointer"` → scoped 类 `&__status-tag`（迁移不改观感，仅换承载方式） | 迁移方案 §6.2 |
| 同上 | 移除 `class="p-datatable-sm"`：该 PrimeVue 内部类在 caomei 表格上**无匹配元素**（恒为惰性），移除不产生视觉变化；表格密度差异属组件替换本身 | §6.1（`p-*` 类处置） |
| 同上 | 动作列 `class="text-right"` → 列级 `align: 'right'`；`email` 列保留 `sortable`（口径见下方观察项） | 迁移不改几何 |
| 同上 | 新增 scoped 样式：筛选输入宽度 **260px**（按参考态实测边框盒 261px 约束）、分页容器居中 token `--caomei-data-table-pagination-justify` | §3.8 / §6.2 |
| `components/app-avatar-v2.vue` | **档位映射改为边框盒尺寸保真**（首轮审计 blocker 修复；其单测同步重写，随本笔提交）：PrimeVue 有效档位为 `normal`(32px) / `large`(48px) / `xlarge`(64px)（`small` 等非法值被忽略并回落默认 2rem），caomei 为 `sm`(24) / `md`(32) / `lg`(40)。原实现把 `small` 映射为 `sm`(24px)、`large`/`xlarge` 有损落 `lg`(40px)，会使头像缩水；现改为 `normal→md`、`large/xlarge→lg + 内联`--caomei-avatar-size`覆盖回 48/64px`、缺省与非法值一律回落 `md`(32px)（与 PrimeVue 忽略非法档位一致）。**措辞限定**：保真范围为**边框盒尺寸**，`font-size` 未覆盖（PrimeVue `large` 1.5rem / `xlarge` 2rem vs caomei `lg` 16px），已登记为残差 | 上游反馈 §2.1（「无对应档位时以 `--caomei-avatar-size` 覆盖」） |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/subscribers`（第 8 项） | §5.5 |
| `pages/admin/subscribers/index.test.ts`（新增） | 17 条契约用例：页头导出按钮（可见文案落默认插槽 + secondary 变体）、筛选输入（`#prefix` 图标）、列定义与 `align` / `sortable`、邮箱与时间列渲染、语言 / 状态 Tag 的 tone 映射、状态 Tag 点击 → PUT 与就地翻转、关联用户列两态（`AppAvatarV2` 的 props 透传 + `warning` Tag）、**服务端分页 1 基受控与 `@page` 原样转发**、空态、删除按钮打开浮层与 DELETE、导出链接 | §8.2 层 ① |
| `tests/e2e/admin.e2e.test.ts` | 矩阵内 `/admin/subscribers` 行**就地更新并移至矩阵末位**（选择器改为 `.caomei-data-table, .admin-subscribers`；矩阵保持 10 行——该路由此前已在矩阵内，故不新增行） | 层 ② |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-subscribers-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；允许清单按门禁报出的非重叠区域校准（浅 4 区 / 深 3 区） | §8.2 层 ③（门禁层） |
| `docs/reports/regression/{current.md,archive/*}`、`docs/design/governance/{visual-parity-deviation-register,2026-09-25-caomei-ui-upstream-feedback}.md`、`docs/plan/{todo,backlog}.md` | 治理记录：第五次滚动归档（3 个早期窗口整体迁移 + `archive/index.md` 登记）、本窗口、第七路由校准记录、上游 §2.1 的 momei 侧落地补记、条目进度与行数口径重锚 | 规划 / 文档规范 |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

**几何核验**：筛选输入在参考态实测边框盒 `x56..316 / y172..208`（261×37），迁移后实测 `x56 / y172 / 260×36` —— **位置与宽度精确对齐**，高度差 2px 属 caomei 字段行盒 36px vs PrimeVue 36.39px 的取整差（同前批口径）。表格表头底边参考态 `y263`、迁移后 `y264`（差 1px）。

**差异区域（门禁报出，非重叠）**：

| 区域 | 浅色 | 深色 | 归因 |
| :--- | :--- | :--- | :--- |
| `x[40,1400] y[160,360]`（深色至 y480） | 6110px | 9933px | 筛选行（`IconField`+`InputIcon`+`InputText` → `CaomeiInput`）+ 表格（`DataTable` → `CaomeiDataTable`：表头底色 / 边框 / 字号 / 行高、`p-datatable-sm` 移除后的行距）+ 表体空态行 |
| `x[640,800] y[400,480]`（仅浅色） | 1168px | — | 分页器（实边框按钮 vs 文本式）+ 空态行高差异带来的位移 |
| `x[120,320] y[80,120]` | 863px | 878px | 头部语言切换字段外壳（共享壳过渡组件 `ContentLanguageSwitcherV2`） |
| `x[1280,1400] y[80,120]`（深色扩至 x1440） | 494px | 4028px | 头部导出按钮：`CaomeiButton` secondary 描边 vs PrimeVue `Button` `severity="secondary"`（暗色底纹差异显著） |

> **与本批既有路由的同型性**：本页与 `/admin/waitlist` 结构同型（同为 `AdminListShell` + 筛选行 + 懒加载表格 + 浮层删除）。门禁报出的**分页器区（1168px）、语言切换区（863 / 878px）、导出按钮区（494 / 4028px 浅/深）三处像素与 waitlist 完全一致**，差异仅出现在第一区（列数与内容不同）。该一致性是本路由归因可信度的主要证据。

### 验证结果

- **层 ①（单元）**：新增 17 条；`pnpm test` 全量通过（见下方「全量」）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：`node scripts/testing/run-e2e.mjs --grep=extended --project=chromium` = **1 passed / 22.2s**（矩阵 10 行，其中 `/admin/subscribers` 行为就地更新）。
- **层 ③（截图识别 · 门禁层）**：`pnpm test:visual:parity` 本路由浅 8635px / 0.666%、深 14839px / 1.145%，允许清单**命中 4/4 与 3/3 条**、扣减后未归因 **0px**；**全量门禁复跑 22/22 通过**（8 个已迁移路由 16 个 testName + 3 个待迁移路由 6 个 testName，总数不随路由迁移变化）。
- **首轮审计 blocker 闭环（头像几何）**：审计独立核验发现 PrimeVue `Avatar` **无 `small` 档位**——`size="small"` 与 `size="normal"` 渲染出完全相同的类名（无尺寸修饰类），Aura 默认 `.p-avatar` = 2rem = 32px；而原 `AppAvatarV2` 把 `small` 映射为 caomei `sm` = 24px，使本页头像缩小 8px。该面**三层回归均无覆盖**（parity 参考态为空表 → 头像不入画；单测只断言 props 透传），故属未登记几何回归。修复取「还原几何」路径：① 过渡组件档位映射改为几何保真（见上表）；② 消费处把 PrimeVue 下无效的 `size="small"` 改为有效档位 `normal`（渲染同尺寸 32px，仅澄清意图）。修复后单测（`app-avatar-v2` 12 条档位映射含 token 断言 + 本页 17 条）与全量单测通过。
- **回归过程记录**：首次 E2E 运行**失败**——矩阵内旧条目仍要求 `.p-datatable`（该路由已不再渲染 PrimeVue 表格），本批按「就地更新」修正为 `.caomei-data-table, .admin-subscribers`；该失败属矩阵维护遗漏，非页面缺陷。

### 提交拆分依据（本批规模超 §2.8 单提交阈值的说明）

本批工作树合计 **15 个路径 / 999 行新增**（`git diff --numstat` 新增列 + 未跟踪文件逐文件计数），超过「单提交 ≤10 文件 / ≤800 行新增」，按职责拆为 **3 笔**，每笔均在双阈值内：

| # | 提交主题 | 文件数 | 新增行（逐文件复算） | 依赖顺序 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 治理记录：第五次滚动归档 + 第七路由窗口 / 校准记录 / 进度与行数口径 | 7 | 230 | 无 |
| 2 | 路由实现：页面迁移 + 过渡组件档位映射修复（含其单测）+ 路由登记 + E2E 矩阵 + parity 台账 | 7 | 285 | 依赖 1（台账与记录同批） |
| 3 | 路由测试：`/admin/subscribers` 契约用例 | 1 | 484 | 依赖 2 |

拆分依据：① 按「治理记录 / 实现与台账 / 测试」三类职责切分；② 单笔规模上限由测试文件体量决定（本页测试 484 行），故测试单独成笔；③ 台账与实现同批，避免「已迁移但无预算」的失配态；④ 过渡组件**自身的单测**（`components/app-avatar-v2.test.ts`）随实现同笔（第 2 笔），不与路由页面测试混同。

### 未覆盖边界 / 观察项

- **`font-size` 残差（边框盒保真的未覆盖面）**：`large` / `xlarge` 的边框盒已覆盖回 48 / 64px，但回退文案字号仍取 caomei `lg` 的 16px（PrimeVue 为 1.5rem / 2rem）；当前**无实际消费者**（唯一 `xlarge` 消费方 `settings/profile` 仍走 V1），待其迁移批次一并核验。
- **`--caomei-avatar-size` 覆盖的像素级验证仍缺**：`large` / `xlarge` 的尺寸覆盖目前只有**静态依据**（caomei 产物注释明示「`--caomei-avatar-size` 作为覆盖钩子、档位选择器用 `:where()` 归零特异性以保证消费处覆盖生效」+ 标准层叠规则）与**单测断言**（断言 `:style` 注入的 token 值），尚无真实浏览器像素实测——现有消费者中只有 `settings/profile` 用 `xlarge`，且该路由未迁移（走 V1）。待 `users` / `settings-profile` 迁移批次（届时页面带真实头像数据）补像素验证。
- **`AppAvatarV2` 的 caomei 分支仍无截图覆盖**：parity 参考态为**空表**（测试环境无订阅数据），头像不出现在画面内；其覆盖限于单测（12 条）与消费处替换的编译期契约。若要补齐，需在视觉测试中注入带用户的订阅数据或另采基线。
- **`sortable` 列的客户端排序差异（跨批观察项）**：迁移前 `email` 列在 `lazy` 表上**未接** `@sort` 实现（服务端排序未接线，属无效声明）；迁移后 caomei 在无受控 `sortField` 时会对**当前页**做客户端排序。本批沿用既有 3 条已迁移路由（external-links / campaigns / placements）的同一口径保留 `sortable`，并在此登记为跨批观察项——如需服务端排序，应另行接线 `useAdminList` 的 `onSort` 与 API 排序参数（不在迁移范围）。
- **`p-datatable-sm` 移除的影响面**：该类的行距效果仅作用于 PrimeVue 表格；移除后本页表格密度由 caomei 自身决定（属组件替换差异，已进允许清单）。`/admin/users` 与 `components/admin/{ai/task-list,admin-taxonomy-page}.vue` 仍保留该类，随各自路由批次处理。
- **导出接口无筛选参数**：迁移前后一致（`window.open('/api/subscribers/export')`），本批未改。
- **E2E 就绪选择器的 `.admin-page-container` 兜底对本页无效**（首轮审计 suggest）：本页容器类是 `admin-subscribers page-container`，不存在 `.admin-page-container`；迁移前该行实际仅靠 `.p-datatable` 命中，迁移后该类消失即暴露该问题（本批已就地更新选择器）。同类兜底在 waitlist 等路由上同样为死选择器，建议后续统一改为路由真实容器类——登记为跨批清理项。

<!-- regression-window:end:phase68-b2-subscribers:第六十八阶段-条目2-第七路由:2026-10-15 -->

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

