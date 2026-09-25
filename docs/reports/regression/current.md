# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

<!-- regression-window:start:phase42-close:第四十二阶段:2026-06-04 -->

<!-- regression-window:start:periodic-regression:weekly:2026-06-10 -->

<!-- regression-window:start:workflow-precheck:release:2026-07-25 -->

<!-- regression-window:start:periodic-regression:weekly:2026-07-27 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-07-27 -->

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

<!-- regression-window:start:phase67-m4-pilot-comments:第六十七阶段-M4:2026-09-25 -->
## 2026-09-25 第六十七阶段 M4 B2 试点页迁移（PrimeVue → caomei-ui）

### 范围

- 试点页 `/admin/comments`（管理端评论列表）按**路由整体切换**到 caomei-ui，并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（`lib/ui-library.ts`）。覆盖 DataTable 列插槽 / 分页 / Tag / Button / InputText / Select 与共享头部择库。
- 共享壳过渡策略：新增 `components/admin/content-language-switcher-v2.vue`（caomei `Select` 版），由 `AdminPageHeader` 经路由 → 组件来源单一事实源选择，避免未迁移路由出现「共享壳 caomei + 页面 PrimeVue」；`ConfirmDeleteDialog` / 全局 `Toast` / `ConfirmDialog` / `v-tooltip` 按 §5.5 显式豁免（浮层留第六十九阶段）。
- `@lucide/vue` 由传递依赖升为 momei 直接依赖（试点页在 momei 模板直接引用图标；§5.6 / 1b 已登记该前置）。
- 新增「在册组件族零残留」守卫 `tests/modules/ui-library-route-migration-guard.test.ts`；为试点页补截图基线（迁移前采集、归因后更新）与单元层用例。

### 「文件 → 改动点」清单

| 文件 | 改动点 | 依据 |
| :--- | :--- | :--- |
| `pages/admin/comments/index.vue` | `IconField`+`InputIcon`+`InputText` → `CaomeiInput`（`#prefix` + lucide `Search`）；`Select` → `CaomeiSelect`（`option-label/value`、`@change`→`@update:model-value`）；`DataTable`+`Column` → `CaomeiDataTable`+`columns`（`#body`→`#cell-{key}`、列 `class` 宽度→`width`、`text-align`→`align`）；`Tag severity`→`tone`；`Button text/rounded/severity/icon`→`variant="ghost"`/`rounded`/`tone`/`#icon`+`label`；`@page` 由 0 基偏移改 1 基页码；样式 `--p-*`→`--caomei-*` | 迁移方案 §6.1/§6.2/§6.3 |
| `pages/admin/comments/index.vue` | 「全部状态」选项值 `null` → 哨兵 `__all__`（caomei `Select` 的 `optionValue` 非 string/number 不渲染），边界还原为 `null` | caomei Select 文档「对象选项」 |
| `pages/admin/comments/index.vue` | 内容列限宽由 scoped `class` 改为列定义 `bodyStyle`（caomei 内联到单元格）；scoped 类不会命中子组件渲染的 `<td>`，避免留下死规则 | caomei DataTable 列定义 |
| `pages/admin/comments/index.vue` | 图标按钮：caomei Button 无「图标按钮」形态，按 `--caomei-button-padding-x: 0` + 方形宽度收敛（文档化 token 定制路径） | §5.7 约束 1 |
| `components/admin-page-header.vue` | 语言切换器按 `resolveUiLibraryForRoutePath(route.path)` 择库（`<component :is>`），默认仍 PrimeVue | §5.5 共享壳例外 |
| `components/admin/content-language-switcher-v2.vue` | 新增过渡组件（哨兵映射，保持 `null` = 全部语言 的共享语义） | 本批裁定 |
| `lib/ui-library.ts` | 登记 `/admin/comments`；新增 `resolveUiLibraryForRoutePath`（剥离 locale 前缀，`prefix_and_default` 下 `/en-US/...` 亦可命中） | §5.5 |
| `lib/ui-library.test.ts` | 新增 `resolveUiLibraryForRoutePath` 用例（登记项命中 / 三种 locale 前缀剥离 / 未登记回退 / 两字母业务段不误判） | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | `/admin/comments` 就绪选择器由 `.p-datatable` 改为 `.caomei-data-table`（保留 `.admin-page-container` 兜底） | 层 ② 改写 |
| `tests/visual/admin-comments-list.visual.test.ts` + 基线 | 新增试点页浅 / 深 2 张基线（迁移前采集，逐项归因后按迁移后状态更新，见「未覆盖边界」） | §8.2 层 ③ |
| `pages/admin/comments/index.test.ts` | 改写为 caomei 版组件栈的 stub：保留并强化原有 6 项覆盖（页头契约 / 表格渲染 / 筛选控件 / 挂载即加载 / 空态 / 请求失败记录错误），新增列定义与列插槽、tone 映射、动作集合、1 基分页、筛选哨兵往返、PUT 后就地更新 | §8.2 层 ① |
| `components/admin/content-language-switcher-v2.test.ts` | 新增过渡组件契约（哨兵不泄漏到共享状态） | §8.2 层 ① |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 新增守卫（已登记路由不得残留在册族 PrimeVue 组件且至少含一个 caomei 组件） | 本批裁定 |
| `package.json` / `pnpm-lock.yaml` | 新增 `@lucide/vue@^1.45.0`（解析 1.47.0，与 caomei-ui 依赖同版本） | §5.6 |

### 验证结果

- **层 ①（单元）**：`pnpm test` = **532 文件（531 通过 / 1 跳过）· 4494 用例通过 / 1 跳过（4495）**；本批新增/改写用例全部通过。
- **层 ②（E2E 功能）**：`tests/e2e/admin.e2e.test.ts`（含 `/admin/comments` 就绪断言，已改用 caomei 选择器）chromium **7/7** 通过；`mobile-critical` 两项目全绿。`pnpm test:e2e:critical` 中 `auth-session-governance.e2e.test.ts` 出现 firefox/webkit 失败，形态为 `page.goto('/settings')` **超时**（与 M2 登记的已知 flaky 一致）——**已用 HEAD 构建（`997313c5`，本批改动全部 `git stash`）做对照复现**：firefox 单独运行同样 `1 failed / 4 passed / 1 skipped`（同一用例、同一超时）；迁移后同 spec 在 chromium 单独 / webkit 单独均 **6/6 通过**，且 `pnpm test:e2e:critical` 曾整体通过一次。判定为**既有 flaky，非本批回归**。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10**（试点页浅/深 + 既有 6 张 + 桥接契约 2 项）；既有页面（posts / settings / 浮层）逐像素无差异。
- `pnpm lint:css` / `pnpm typecheck` / `pnpm build` / `pnpm test:perf:budget`：通过（`keyCss` 59.47KB / 70KB，未因本批上升）。

### 视觉差异逐项归因（迁移前基线 → 迁移后）

对照方法：迁移前基线在本批改动前用 `git stash` 回到 `997313c5` 构建后采集，迁移后用同环境（chromium / 1440×900 / DSF1 / zh-CN / Asia/Shanghai / 关闭动画）截图，再以像素级「行内容跨度」与差异区域定位做**人工逐项归因**（`toHaveScreenshot` 阈值 `maxDiffPixels 200` 不参与该对照，故差异总量高于阈值属预期）；归因完成后基线已按迁移后状态更新（见「未覆盖边界」）。差异总量 0.6%~1.2%：

| 区域 | 迁移前 | 迁移后 | 归因 |
| :--- | :--- | :--- | :--- |
| 头部语言切换器（y80-108，x152-301） | PrimeVue `Select` | caomei `Select`（V2 过渡组件） | **有意**（共享壳择库，用户 2026-09-25 裁定 (a)） |
| 筛选行（y152-200） | 搜索框 + 状态选择器（左对齐） | 同区间 | **组件替换**；几何已刻意对齐——首版误用 `flex` 撑满 + 把宽度 `class` 置于 `<CaomeiSelect>`（caomei 的 `class` 落触发器）致输入 ~990px / 选择器 ~305px，已改为「包装元素约束 + 输入 260px」 |
| 表头列位置（y212-240） | 表头文本 x48/259/472/682/894/1211 | x43/144/365/596/828/1366 | **有意**：迁移前 SCSS 声明的列宽未被 PrimeVue 自动布局生效；caomei 按列定义渲染（status 100px / author 220px / actions 右对齐），方向与作者意图一致（属组件语义差异，非本批新引入） |
| 空态 + 表格样式（y216-256 / y312-336） | PrimeVue DataTable 空态 | caomei DataTable 空态（`bg-elevated` 系表头 / 边框 / 字体） | **组件替换**（§6.3 有意差异范围内） |
| 分页器（y408-448） | PrimeVue 分页器居中 | caomei 分页器右对齐 | **组件替换**；caomei 分页器对齐无 token 钩子，登记为后续批次可选项（如需居中需选择器级覆盖，§5.7 约束 2） |

> 口径说明：上表「跨度」为**行内容可见跨度**（含控件边框与文本，不含外部留白），故与元素盒模型宽度不等（如筛选行内容跨度 56-301 对应盒宽 260px）；迁移前几行的判断依据是迁移前采集记录与组件语义（基线已更新，不能从仓库复现），标注为推断而非可复核实测。

### 试点结论（链路可行性与耗时画像）

- **链路可行**：`接入 → token → 图标 → 组件 → 测试改写 → 三层回归` 全链路闭合；`--caomei-*` 桥接（M3）在真实组件上生效，无需为本页追加任何样式 token。
- **耗时画像（本批实测）**：范围裁定与 API/差异对照 ≈ 1.5h（含 20 个候选页 × 共享组件扫描）；实现 ≈ 1.5h；全量构建 ≈ 8 次（含迁移前基线采集 1 次、HEAD 对照复现 1 次；单次约 4–6 min）；视觉全量 1 轮约 1.5–2.0 min；全量单测 156s；E2E critical 约 4–6 min（含已知 flaky 复跑与 HEAD 对照）。
- **发现的阻塞与修正建议（供后续批次）**：
    1. **共享壳是主线成本**：`AdminContentLanguageSwitcher` / `ConfirmDeleteDialog` / `AppAvatar` 等跨路由共享组件决定「路由内无双库混用」能否成立；建议 B2 全量前先完成共享壳的**过渡组件化清单**（本批已为语言切换器打样），否则每页都要处理同类冲突。
    2. **`optionValue` 不接受 `null`** 是高频坑（「全部 / 不限」选项普遍以 `null` 表达），建议后续批次统一采用「哨兵 + 边界还原」写法并抽公共常量。
    3. **`class` 落点在 caomei 组件上不一致**（Button/Input 落根元素；Select 落触发器，宽度需约束字段外层），建议在迁移写法里固化「Select 宽度用包装元素」规则。
    4. **无「图标按钮」形态**：表格行内动作按钮需按 `--caomei-button-padding-x` 收敛，建议评估是否在库侧提供 `iconOnly` 档位（属库侧变更，走 caomei-ui 流程）。
    5. **分页器对齐 / 列宽生效差异**需在各页「文件 → 改动点」清单中显式登记，避免被当作回归。

### 未覆盖边界

- TEST_MODE 未播种评论数据，截图基线为**空态**渲染；表格行级结构由单元层用例承担（列插槽 / tone / 动作集合 / 分页 / 筛选映射）。
- **截图基线 provenance**：仓库内 `tests/visual/__screenshots__/admin-comments-list.visual.test.ts/` 的两张 PNG 是**逐项归因后按迁移后状态更新**的结果（`test:visual:update`）；迁移前对照图仅作一次性本地记录、不随仓库保存，因此「迁移前基线」对照无法从仓库复现，归因表属文本记录（推断已显式标注）。
- 列排序、行选择在本页无用量（未覆盖）；`useToast` / `useConfirm` 本页未使用（B3 覆盖）。
- 共享壳 `ConfirmDeleteDialog` 仍为 PrimeVue（豁免）；`v-tooltip` 仍为 PrimeVue 指令（豁免，随浮层批次处理）。
- **包体归因**：`admin-page-header.vue` 静态导入 V1 + V2，使每个 admin 页的 `admin-page-header` chunk 含 caomei `Select` 组件样式（约 6KB，仅 admin 域，未进入 `entry` / 公共页）；`keyCss` 预算未受影响（59.47KB / 70KB）。后续批次可评估 V2 懒加载或共享壳整体回收。
- 未在 CI 实跑（本地无 CI 环境）；`visual` job 仍为 `continue-on-error`。

<!-- regression-window:end:phase67-m4-pilot-comments:第六十七阶段-M4:2026-09-25 -->

<!-- regression-window:start:phase67-m3-token-bridge:第六十七阶段-M3:2026-09-25 -->
## 2026-09-25 第六十七阶段 M3 全局 token 语义层桥接（PrimeVue → caomei-ui）

### 范围

- 落地迁移方案 §5.2 第 ① 层「语义层与预设桥接」：在 `styles/main.scss` 末尾新增 **unlayered `html:root`** 桥接块，把 `--caomei-*` 语义 token 指向 momei 现行 `--p-*` 语义（含 `useTheme` 运行时按用户主题生成的覆盖）；派生档位（次级面、实底深档）统一用 `color-mix()` / 色阶深档表达。
- `nuxt.config.ts`：更新 `caomeiUI` 与 PrimeVue `cssLayer` 注释，记录「caomei-ui 保持未分层」「不启用 `data-preset="momei"`」的决策依据。
- 新增级联契约守卫 `tests/visual/caomei-token-bridge.visual.test.ts`（真实浏览器读取**计算后**的 `--caomei-*`）。
- 未改动 `styles/_variables.scss` 与 `layouts/**`：桥接为 token 级、SCSS 别名会成死代码；`layouts/**` 消费的 `--p-surface-ground`（页面底）在 caomei 侧无对应语义（caomei `bg` 实为内容面），改写即造成观感回退，按最小改动保留。

### 关键决策与依据（实测）

- **落点必须 unlayered**：实测 `nuxt.options.css` 顺序为 `… @/styles/main.scss(4) → caomei-ui/theme.css(5)`，且 caomei 基础层 `grep -c @layer` = 0；按层叠规则未分层优先于任何具名层，故 `@layer momei-base` 内的桥接会被 caomei 的 `:root` 覆盖。选择器取 `html:root`（特异性 `0,1,1`）高于库侧 `:root` / `:is(.dark, [data-theme="dark"])`（均 `0,1,0`），与加载顺序解耦。
- **不启用 `data-preset="momei"`**：其暗色选择器 `:is([data-preset="momei"].dark, …)` 特异性 `0,2,0` 会压过桥接并把暗色 token 冻结为静态预设值，使运行时主题失效；桥接覆盖 momei 主题驱动的全部**映射项**（预设的暗色状态色微调与主色 `-solid` 深档为已知偏离），故预设保持「可用但不启用」。
- **`bg` 语义核对**：caomei 组件用法显示 `--caomei-color-bg` 承载卡片 / 输入 / 表格 / 浮层 / 工具栏（内容面），对应 `--p-surface-card`；`bg-elevated` 为表头 / 斑马纹 / 悬停 / 骨架等次级面，按 `color-mix(--p-surface-card 96%, --p-text-color)` 派生（与 caomei 预设中二者的相对关系一致）。
- **幻影 token**：`--p-error-500` / `--p-success-500` / `--p-warning-500` / `--p-surface-border` 等 momei 既有声明在 Aura 产物中**并不存在**（Aura 语义层无 `success|warning|error|info`），状态色改引真实存在的原始色板 `--p-red-500` / `--p-green-500` / `--p-orange-500`（由 `primitive-variables` 样式表产出），边框改引 `--p-content-border-color`。

### 验证结果

- `pnpm lint:css`：PASS。
- `pnpm typecheck`：PASS。
- `pnpm build`：PASS（由 `test:visual` 的构建新鲜度前置执行 `pnpm run build`；产物 `Σ 71.5 MB / 18.4 MB gzip`）。
- `pnpm test:visual`：**8/8 通过**——6 张既有基线浅 / 深逐像素无差异（未迁移页面观感无回退）+ 2 项桥接级联契约（浅 / 深）。
- 定向单测：`pnpm exec vitest run tests/scripts tests/modules` = 23 文件 / 197 用例全通过。
- **假阴性（守卫非空转）**：在真实页面仿真「桥接回落到 caomei 基础层默认值」（追加同特异性更靠后的 `html:root` 覆盖）后，守卫在浅 / 深两主题均稳定失败（`--caomei-color-primary(#2563eb/#60a5fa) != --p-primary-color(#64748b/#94a3b8)`，并命中「等于库默认值」断言）；未仿真时 0 失败。
- 附带确认：向页面追加更靠后的未分层 `:root{--caomei-color-primary:…}`（特异性 `0,1,0`）**无法**覆盖桥接，从反面验证 `html:root` 特异性设计生效。

### 未覆盖边界

- 本层仅保证「token 可被消费且与 momei 主题一致」；caomei-ui 组件在未迁移页面上尚未渲染，故截图层「无差异」是必然结果而非对桥接的验证——桥接正确性由级联契约守卫承担。
- 桥接守卫位于 `visual` CI job（初期 `continue-on-error: true`），待该 job 确认基线转阻断后才成为硬门禁；守卫内 `CAOMEI_BASE_DEFAULT_PRIMARY`（caomei 基础层默认主色）须随 caomei-ui 升级复核（§5.6 升级纪律）。
- 已知偏离：主色 `-solid`（`--p-primary-700`）在暗色下随主题重算，与 caomei「实底跨主题同值」的约定不同；状态色 `-color` / `-solid` 取固定原始色板、两主题同值，且 caomei 预设的暗色状态色微调（`#f87171` / `#4ade80` / `#fb923c`）未被采用。两类偏离留待 B2 试点页按实际用法定案。
- 未运行全量 `pnpm test` 与 `pnpm test:e2e:critical`（本次改动仅样式层 + 注释 + 一个 Playwright spec，未触及 TS 逻辑与既有断言语义；定向单测已覆盖受影响入口）。

<!-- regression-window:end:phase67-m3-token-bridge:第六十七阶段-M3:2026-09-25 -->

<!-- regression-window:start:phase67-m2-visual-base:第六十七阶段-M2:2026-09-24 -->
## 2026-09-24 第六十七阶段 M2 视觉验证回归基座（PrimeVue → caomei-ui）

### 范围

- 建立迁移期三层视觉验证回归基座（迁移方案 §8.2）：① 单元层、② E2E 功能层、③ 截图识别层。
- 截图识别层落地为**独立工程**：新增 `playwright.visual.config.ts`（独立 config / project）与 `tests/visual/`，入口 `pnpm test:visual` / `pnpm test:visual:update`（经 `scripts/testing/run-visual.mjs` 复用 e2e 的构建新鲜度检查与浏览器安装前置）。**不并入**既有 `pnpm test:e2e` / `test:e2e:critical` / `test:e2e:review-gate` 的 `testMatch` 与断言语义。
- 采集对象：列表页 `/admin/posts`、表单 / 设置页 `/admin/settings`、浮层（`/admin/settings` → 协议管理 → 新增 → 创建协议对话框），各覆盖浅色 / 深色两套主题，共 6 张基线快照，随仓库提交。
- CI 接入：`test.yml` 新增 `visual` job（下载共享 Nuxt 构建 → 安装 chromium → `pnpm test:visual` → 失败产物上传）。
- `vitest.shared.ts` 排除 `tests/visual/**`，避免 Vitest 误收集 Playwright spec。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次无关）。
- `pnpm test`：PASS（530 文件（529 通过 / 1 跳过）· 用例 4479 通过 / 1 跳过；视觉 spec 未被 Vitest 收集）。
- 截图识别层环境可复现配置：chromium（`devices['Desktop Chrome']`）/ viewport 1440×900 / deviceScaleFactor 1 / locale `zh-CN` / timezone `Asia/Shanghai` / `colorScheme: light` + 显式 `localStorage.theme` 覆盖 / `reducedMotion: reduce` / `animations: 'disabled'` / `caret: 'hide'`。
- 阈值策略：仅配置绝对上限 `maxDiffPixels: 200` + 单像素容差 `threshold: 0.2`（不设比例兜底；绝对值口径保证细粒度 token 改动不被视口比例吞掉）。禁止为让测试变绿而放宽。
- 动态区域策略：统一以 `[data-visual-mask]` 显式遮蔽（辅助函数 `dynamicMask`）。列表页「发布时间」单元格（`pages/admin/posts/index.vue` 的 `.user-created-at`，含绝对时间 `formatDateTime` 与相对时间 `relativeTime`）**整体标注 `data-visual-mask`**：两者均源自运行时种子 `publishedAt: new Date()`（`server/utils/seed-test.ts`），既随真实时间漂移，也会因 CI 重建数据库而与本地基线不同；此前未遮蔽时仅靠「被 frozen actions 列遮挡」侥幸稳定，属布局巧合，现改为显式遮蔽以消除隐患。因遮蔽改变该页基线像素，已重新生成列表页 2 张基线快照并复验全绿。
- **假阳性验证**：无样式变更时连续两次运行 6/6 全绿（逐像素稳定）。
- **假阴性验证**：故意将 `--p-surface-card` 改为 `#ff0000` 后，3 项浅色用例稳定失败（深色用例因 `.dark` 覆盖该 token 而未受影响，符合预期）；还原后恢复全绿。
- 灵敏度边界（实测登记）：仅影响**未进入捕获区域**的元素时不会产生差异——如 `$border-radius-md`（命中 `components/app-header.vue`）改动进产物（`.output` CSS 出现 `border-radius:1.5rem` 2 处）但在 3 个目标页捕获区域内无可见差异。此类 token 级改动由单元层 DOM/ARIA 断言与 E2E 行为层兜底。
- E2E 功能层：`pnpm test:e2e:critical` 两阶段（`auth-session-governance` × chromium/firefox/webkit + `mobile-critical` × mobile-chrome/safari）全绿。
- **已知 flaky 集登记**：`tests/e2e/auth-session-governance.e2e.test.ts`（判定依据见 M1 节：失败形态均为 timeout、两次运行失败项不同、firefox 单独运行全通过）。**M1 前后 flaky 率对比**：M1 采样 chromium `--repeat-each=3` 为 2 通过 / 1 失败（当次 33%）；M2 采样 chromium `--repeat-each=3`（18/18）+ 全量 critical（3 浏览器各 1 次）**共 21 次执行 0 失败**。结论：属**负载相关超时**而非迁移回归，登记为已知 flaky，不因偶发失败判定迁移回归。
- 单元层：保留既有设置页 / 主题页测试；新增浮层目标组件 `components/admin/settings/agreement-edit-dialog.vue` 的**同目录**结构契约测试 `components/admin/settings/agreement-edit-dialog.test.ts`（对话框 `role` / label-`for` 与控件 `id` 绑定 / 编辑态与创建态渲染差异 / `update:formData` v-model 契约 / `save` 事件），断言只覆盖**迁移无关**的可访问性与事件契约；新增 `tests/scripts/run-visual.test.ts` 覆盖视觉入口编排。
- 既有入口未变：`tests/scripts/run-e2e.test.ts` + `run-e2e-critical.test.ts` 共 25 用例通过（`run-e2e.mjs` 仅新增 `export`，无行为改动）；新增 `tests/scripts/run-visual.test.ts` 覆盖 `run-visual.mjs` 的编排顺序与独立 config 参数。
- 基线快照体积与保留策略：6 张合计 **663,994 字节（约 664KB）**（`tests/visual/__screenshots__/`）；基线随仓库提交、由 `pnpm test:visual:update` 原地覆盖，不做历史版本堆积（历史即 git 记录）；CI 失败产物（actual/diff）落 `test-results/visual/`，按 `retention-days: 7` 上传。**不引入 Git LFS**（2026-09-24 决策，体量与单文件尺寸远低于 LFS 适用区间，且 LFS 会带来指针文件失真 / tarball 不可复现等硬成本；再评估触发线见迁移方案 §8.2 成本预算段）。CI 增量耗时：本机实测约 1.4–2.4 分钟（6 用例，串行 1 worker，不含构建复用）。

### 审计建议处置（M2 两分区 Review Gate）

- 分区一（截图工程 + CI）：S1 config 注释口径 / `.gitignore` 死规则 → **已修复**；S2 `maxDiffPixelRatio` 被绝对上限压制 → **已修复**（删除，仅留 `maxDiffPixels: 200`）；S3 `run-visual.mjs` 死变量与缺单测 → **已修复**（删变量 + 新增 `tests/scripts/run-visual.test.ts`）；**S4 `snapshotPathTemplate` 未含 `{-projectName}` → 接受延后**（当前单 project；后续若加 firefox / webkit project 须补 `{-projectName}` 防路径冲突，此处登记为约束）；S5 `reuseExistingServer` 与 e2e 不一致 → **已修复**（改为 `!process.env.CI` 并注明与 e2e 共用端口 3001 的本地并发约束）；**S6 `continue-on-error` 无到期跟踪 → 已登记**（见「未覆盖边界」首条，CI 确认基线后须转阻断）。
- 分区二（单元层 + 文档）：S1 单测目录 → **已修复**（移至与源码同级的 `components/admin/settings/agreement-edit-dialog.test.ts`）；S2 断言强度 / S3 契约遗漏 → **已修复**（补 `update:formData` v-model 断言、`sourceAgreementId` / `content` label 断言）；S4 快照体积 → **已修复**（663,994 字节）；S5 保留策略 → **已修复**（补声明）；S6 绝对时间漂移 → **已修复**（整体遮蔽 + 说明）；**S7 「todo 标 `[x]` 但 CI 未阻断」→ 已登记**（第 2 项「完成」以「CI 确认基线并转阻断」为最终界；CI 未实跑属已声明边界）。

### 未覆盖边界

- **基线来源跨环境风险（需 CI 确认）**：本批基线在本地 Linux（WSL2）环境生成；迁移方案 §8.2 要求跨环境差异无法消除时以 **CI 生成为唯一基线来源**。因此 `visual` CI job 初期设 `continue-on-error: true`，首次 CI 运行用于在 ubuntu runner 上确认基线；若与本地基线不一致，须以 CI 产物重建基线后提交，再将 job 转为阻断门禁。
- 列表页（`/admin/posts`）暂无页面级 Vitest 单元测试（其行为由 E2E 功能层 + 截图层覆盖）；如需补页面级结构契约测试，登记为后续项。
- 浮层基线仅覆盖「协议创建对话框」；Dialog / Drawer / Popover 全量浮层留待 B3 / B4 批次逐类建立。
- 未在 CI 实跑验证 `visual` job（本地无 CI 环境），job 语法与步骤按既有 e2e job 模式镜像。

<!-- regression-window:end:phase67-m2-visual-base:第六十七阶段-M2:2026-09-24 -->

<!-- regression-window:start:phase67-m1b-reanchor:第六十七阶段-M1b:2026-09-24 -->
## 2026-09-24 第六十七阶段 M1b caomei-ui 重锚到 0.2.0（PrimeVue → caomei-ui）

### 范围

- 依赖 `caomei-ui` 由 `0.1.0` 精确锁定上移到 `0.2.0`（迁移期仍精确锁定，不加 `^`）；`pnpm install` 后 lockfile 同步。
- 上游 0.2.0 含包形态破坏性变更：移除单体 `caomei-ui/styles.css`，改为基础层 `caomei-ui/theme.css`（落点 `dist/styles/index.css`，5,880 B / gzip ~1,089 B，0 个 `@layer`）+ 逐模块组件样式（`dist/` 下共 75 个 CSS）。
- 按迁移方案 §8.4.1 在本次升级批次内回落并存期配额（`keyCss` 85KB → 70KB）并刷新基线。
- 口径与事实源同步：`docs/standards/performance.md` 的现行首屏 CSS 预算同步为 `70KB`（该文件 §4.1 要求脚本 / 基线 / 规范三处一致）；`docs/plan/{todo,roadmap,backlog}.md`、`docs/design/ui.md`、迁移方案与 2026-08-29 许可证评估、`docs/i18n/{en-US,ja-JP,ko-KR,zh-TW}/plan/roadmap.md` 四份镜像摘要随重锚完成同步（镜像 `last_sync` → `2026-09-24`，避免提交后 `docs:check:source-of-truth` 判 stale）。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（527 文件 / 4473 用例通过，1 skipped；相对 2026-09-21 窗口 +2，来自 `0fab59d7` 的 `server/services/upload.test.ts`）。
- `pnpm build`：PASS。
- `pnpm test:perf:budget`：PASS（`keyCss` 59.26KB / 70KB 回落配额；`coreEntryJs` 328.45KB / 360KB；`maxAsyncChunkJs` 47.91KB / 130KB）。
- `keyCss` 复测：75,110 → **60,684** 字节（gzip）；相对迁移前基线 59,795 仅多出基础层约 0.87KB。产物 `entry.*.css` 含 49 个 `--caomei-*` token 与唯一类 `.caomei-root`，**零 caomei 组件样式**（`caomei-button` 出现 0 次，符合「momei 当前零 caomei 组件消费」预期）。
- 注入点唯一性（`loadNuxt` 读取解析后的 `nuxt.options.css`）：`caomei-ui/theme.css` 恰好 **1** 次，`caomei-ui/styles.css` 0 次；`_installedModules` 中 `caomei-ui` 无重复安装。
- `@layer` 顺序不变：产物仍为 `primevue, momei-base, momei-overrides`；caomei-ui 基础层以未分层形态加载。
- 自动导入隔离不变：`.nuxt/imports.d.ts` 中 `useToast` 归 `primevue/usetoast`、`useConfirm` 归 `primevue/useconfirm`、`useTheme` 归 `composables/use-theme.ts`；caomei-ui 仅保留 `useLocale` / `provideLocale`。
- §3.4 基线未漂移：`pnpm governance:count:primevue-usage` 重取 = 组件 59 类 / 1515 处；图标 629 处；token 1403 处（与 M1 完全一致）。
- `@lucide/vue` 未在 momei 源码直接引用，本批不新增直接依赖（留待试点页按实际引用决定）。

### 未覆盖边界

- 视觉验证回归（单元 / E2E / 截图三层）仍未建立，属 M2 范围；本批无 UI 可见变化，仅样式形态与包体口径变更。
- 未逐 preset 验证 dev / Vercel / Cloudflare 产物（与 M1 同口径，依据 node-server 产物判定因果充分）。
- 白名单初始仍为空（尚无路由迁移），路由级隔离规则未被真实用例触发。
- 本批未采集 E2E 基线；已知 flaky 集 `auth-session-governance` 的显式登记与 M1 前后 flaky 率对比仍属 M2 待办。

<!-- regression-window:end:phase67-m1b-reanchor:第六十七阶段-M1b:2026-09-24 -->

<!-- regression-window:start:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->
## 2026-09-21 PostgreSQL 值类型解析退化导致「所有文章显示置顶」修复

### 范围

- 现象：后台文章管理列表所有行「置顶」列显示「是」；友链页 `isPinned` / `isFeatured`、站内通知 `isRead` 等布尔徽章存在同类误判风险。
- 根因：Nitro 2.13 的 Rollup `treeshake.moduleSideEffects` 白名单默认不含 `pg-types`，其顶层 `textParsers.init(...)` / `binaryParsers.init(...)` 被摇树；`getTypeParser` 永久回退 `noParse`，PostgreSQL 的 `bool` / `int4` / `json` 等全部以原始文本返回（`isPinned: 'f'`、`views: '0'`、`metadata` 为 JSON 字符串）。前端 `data.isPinned ? 是 : 否` 把非空字符串 `'f'` 判为真值。
- 取证：线上 `GET /api/posts` 返回 `"isPinned":"f"`；`isPinned=true` 过滤 `total: 0`（库内为真实 false，排除数据迁移）；修复前构建产物中 `textParsers` / `binaryParsers` 出现 0 次。
- 修复：
    - 新增 `modules/nitro-pg-types-side-effects.ts`：`nitro:init` 阶段把 `pg-types` 追加进 `nitro.options.moduleSideEffects`，并以 `nitro:build:before` 护栏断言注入生效。
    - 新增 `server/database/pg-value-types.ts`，并在 `initializeDB` 接入启动自检：PostgreSQL 下跑 `SELECT true, 1::integer, '{"ok":true}'::json` 探针，类型退化时记录 `[db-type-guard]` error（不抛出）。
    - `server/decorators/custom-column.ts`：`type: 'boolean'` 列统一注入归一化 transformer（`'t'/'1'/1` → true，`'f'/'0'/0` → false）。
    - `AdminNotificationSettings` / `InAppNotification` 的布尔列改用 `CustomColumn`，消除绕过点。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（527 文件 / 4471 用例通过，1 skipped）。
- `pnpm build`：PASS；产物 `chunks/nitro/nitro.mjs` 已包含 `textParsers.init` / `binaryParsers.init`。
- 真实 PostgreSQL 16 端到端（Docker + 重建产物）：修复前 `/api/posts` 返回 `isPinned: 'f'` / `views: '0'`；修复后返回 `isPinned=True/False (bool)`、`views=7/0 (int)`、`metadata` 为对象、`audioUrl` 由 `metadata.audio` 正确回填；`isPinned=true` 过滤 `total: 0`；启动日志出现 `pg-value-type-check` 且无 `db-type-guard` 报错。
- 定向测试：`server/decorators/custom-column.test.ts` + `tests/modules/nitro-pg-types-side-effects.test.ts` + `server/database/pg-value-types.test.ts` 共 26 用例 PASS。
- Review Gate：初审 Pass（0 blocker / 3 warning / 7 suggest）→ 修复 W1/W2/W3 与 S1/S3 后复审 Pass（0 blocker / 0 warning）。审计记录见 `artifacts/review-gate/2026-09-21-pinned-boolean-pg-types.md`。

### 未覆盖边界

- 未逐 preset 验证 dev / Vercel / Cloudflare 产物（依据 nitropack 源码与 node-server 产物判定因果充分）。
- 启动自检为 log-only（不 fail-fast），依赖日志可观测性；后续可选在 CI 增加产物断言（grep `textParsers.init`）。
- 未在真实 MySQL / SQLite 实例复核水合（仅单测覆盖归一化语义）。
- 本批无 UI 模板 / 样式 / 交互变更，UI 浏览器验证按「数据契约修复」口径豁免；用户可见行为已由真实 PostgreSQL API 契约验证。
- S7（补「非布尔列不注入 transformer」负向断言）仍敞口，非阻塞。

<!-- regression-window:end:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->

<!-- regression-window:start:phase67-m1-integration:第六十七阶段-M1:2026-09-20 -->
## 2026-09-20 第六十七阶段 M1 接入基座验证（PrimeVue → caomei-ui）

### 范围

- 接入 npm `caomei-ui@0.1.0`（迁移期精确锁定）；`caomei-ui/nuxt` 与 `@primevue/nuxt-module` 并存。（`@lucide/vue` 延后到真正直连图标的批次再声明为直接依赖。）
- 新增同名自动导入隔离模块 `modules/caomei-ui-coexistence.ts`（`useToast` / `useConfirm` / `useTheme`）。
- 新增并存期白名单载体 `lib/ui-library.ts`（路由 → 组件来源单一事实源）。
- 新增迁移基线重取脚本 `scripts/governance/count-primevue-usage.mjs` 与 npm 入口 `governance:count:primevue-usage`（含组件名清单再生成入口）。
- 包体预算并存期配额调整（`keyCssGzipBytes` 70KB → 85KB）与基线刷新。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（524 文件 / 4448 用例通过，1 skipped）。
- `pnpm build`：PASS；产物同时包含 `--caomei-color-primary` / `.caomei-button` 与 `--p-*`，双库同产物共存已实证。
- `pnpm test:perf:budget`：PASS（`keyCss` 73.35KB / 85KB 并存期配额；口径与决策见迁移方案 §8.4.1）。
- 定向测试：`lib/ui-library.test.ts` 8 用例 + `tests/modules/caomei-ui-coexistence.test.ts` 6 用例，共 14 用例 PASS。
- 自动导入隔离实证：`nuxt prepare` 无 `Duplicated imports` 警告；`.nuxt/imports.d.ts` 中 `useToast` 归 `primevue/usetoast`、`useConfirm` 归 `primevue/useconfirm`、`useTheme` 归 `composables/use-theme.ts`，caomei-ui 仅保留 `useLocale` / `provideLocale`。
- 迁移基线重取：组件 59 类 / 1515 处 / 148 文件；图标 629 处 / 145 文件；token 1403 处（`var()` 1323）/ 114 唯一 / 134 文件；`<Column>` 153；`.toggle()` 7。

### 未覆盖边界

- **E2E 关键集未稳定通过**：`pnpm test:e2e:critical` 首次运行 `auth-session-governance` 超时失败。已取证判定为 **flaky 而非回归**——firefox 单独运行全通过、chromium `--repeat-each=3` 为 2 通过 / 1 失败、两次运行失败的不是同一条测试、失败形态均为 timeout。**M2 采集 E2E 基线时必须显式登记已知 flaky 集**，并对比 M1 前后的 flaky 率是否有实质上升。
- **`CaomeiConfigProvider` 与组件内建文案 locale 注入延后**：本批只接入模块与自动导入的 `useLocale` / `provideLocale`，Provider 包裹与 `plugins/primevue-i18n.ts` 替换推迟到真正启用 caomei-ui 组件的批次，避免在 PrimeVue 仍在使用时提前切换文案来源。
- **CSS `@layer` 顺序决策已落盘**：保持既有层序 `primevue, momei-base, momei-overrides` 不变，caomei-ui 以未分层形态加载（依据：其实测无 `@layer`、无全局元素规则）。由此产生的定制约束见迁移方案「样式层叠与 @layer 决策」章节。
- 视觉验证回归（单元 / E2E / 截图三层）尚未建立，属 M2 范围；本批无 UI 可见变化。
- 白名单初始为空（尚无路由迁移），路由级隔离规则未被真实用例触发。

### 窗口结论适用性（2026-09-22 追加）

- **样式形态将被 0.2.0 取代**：本批基于 `caomei-ui@0.1.0` 的单体 `styles.css`；上游 `0.2.0` 已改为基础层 `theme.css` + 逐模块组件样式，接入基座待重锚（迁移方案 §3.6 / §8.4.1），届时 `keyCss` 复测并回落配额。本窗口的 `keyCss 73.35KB / 85KB` 结论**不代表重锚后状态**。**已于 2026-09-24 重锚完成**（见上方 M1b 窗口：`keyCss` 回落 60,684 字节 / 70KB 配额）。

<!-- regression-window:end:phase67-m1-integration:第六十七阶段-M1:2026-09-20 -->

<!-- regression-window:start:periodic-regression:weekly:2026-09-11 -->
## 2026-09-11 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly`
- 证据 artifact: `../../../artifacts/review-gate/2026-09-11-weekly-regression.md` / `../../../artifacts/review-gate/2026-09-11-weekly-regression.json`
- 结果摘要: `Reject`；blocker=1，warning=1。
- 已执行验证: test:coverage=PASS，security:audit-deps=FAIL
- 回归窗口: 323 行 / 13 条，归档判定=需要滚动归档。
- Review Gate: `Reject` / `blocker`；主要问题=security:audit-deps failed。
- 未覆盖边界: 活动日志当前 13 条记录，超过 8 条窗口

<!-- regression-window:end:periodic-regression:weekly:2026-09-11 -->

## 2026-07-27 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `artifacts/review-gate/2026-07-27-phase-close-regression.md` / `artifacts/review-gate/2026-07-27-phase-close-regression.json`
- 结果摘要: `Reject`；blocker=2，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=FAIL
- 回归窗口: 322 行 / 13 条，归档判定=需要滚动归档。
- Review Gate: `Reject` / `blocker`；主要问题=release:check:full failed -> test (Vitest)；regression-log window exceeded: 活动日志当前 13 条记录，超过 8 条窗口。
- 未覆盖边界: 活动日志当前 13 条记录，超过 8 条窗口

<!-- regression-window:end:periodic-regression:phase-close:2026-07-27 -->

## 2026-07-27 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly -- --dry-run`
- 证据 artifact: `artifacts/review-gate/2026-07-27-weekly-regression.md` / `artifacts/review-gate/2026-07-27-weekly-regression.json`
- 结果摘要: `Prepared`；blocker=0，warning=1。
- 已执行验证: test:coverage=DRY RUN，security:audit-deps=DRY RUN，docs:check:source-of-truth=DRY RUN，docs:check:i18n=DRY RUN，docs:check:line-count=DRY RUN，i18n:audit:missing=DRY RUN，duplicate-code:check=DRY RUN，governance:check:scripts=DRY RUN，governance:audit:eslint-debt=DRY RUN，governance:audit:comment-drift=DRY RUN，governance:audit:simple-duplicates=DRY RUN
- 回归窗口: 294 行 / 11 条，归档判定=需要滚动归档。
- Review Gate: `Prepared` / `warning`；主要问题=regression-log window exceeded: 活动日志当前 11 条记录，超过 8 条窗口。
- 未覆盖边界: 本轮为 dry-run，仅验证编排与回填，不代表真实回归执行结果。

<!-- regression-window:end:periodic-regression:weekly:2026-07-27 -->

## 2026-07-25 workflow pre-check（release，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=release`
- 证据 artifact: `artifacts/review-gate/2026-07-25-ci-precheck-release.md` / `artifacts/review-gate/2026-07-25-ci-precheck-release.json`
- 结果摘要: `Reject`；blocker=1，warning=0。
- 已执行验证: release critical files=PASS，release environment=FAIL
- Review Gate: `Reject` / `blocker`；主要问题=release environment failed。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:release:2026-07-25 -->

## 2026-06-10 周级周期性回归（自动回填）

- 执行入口: `pnpm regression:weekly`
- 证据 artifact: `artifacts/review-gate/2026-06-10-weekly-regression.md` / `artifacts/review-gate/2026-06-10-weekly-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=1。
- 已执行验证: test:coverage=PASS，security:audit-deps=PASS，docs:check:source-of-truth=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，i18n:audit:missing=PASS，duplicate-code:check=FAIL，governance:check:scripts=PASS
- 回归窗口: 189 行 / 7 条，归档判定=窗口健康。
- Review Gate: `Pass` / `warning`；主要问题=duplicate-code:check failed。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:weekly:2026-06-10 -->

## 2026-06-04 第四十二阶段收口回归

### 范围

- 目标：第四十二阶段「AI 深化与运营闭环」5 条主线全部交付后的阶段收口回归，覆盖 typecheck、lint、CWV 基线、代码审计与归档操作。
- 本轮覆盖：全仓 typecheck + ESLint (`--max-warnings 0`)，Code Auditor 审计及修复，plan 文档归档（roadmap 深度分片 + todo-archive 滚动归档）。
- 非目标：不包含浏览器端 E2E 回归测试，不包含 CWV 实际数值采集（由 CI `build-lighthouse` job 产出）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 无静态错误 |
| `pnpm lint` | Pass | ESLint `--max-warnings 0` 通过 |
| Code Auditor | Pass | 4 个问题（1H+3M）已修复提交 |
| CWV 基线 | 待 CI | 基础设施就绪，实际数值由 CI 产出 |
| roadmap.md 深度归档 | 完成 | Phase 22-24 迁入 `roadmap-phases-22-24.md`，主文档 799→719 行 |
| todo-archive.md 滚动归档 | 完成 | Phase 32-37 迁入 `todo-archive-phases-32-37.md`，主文档保留 Phase 38-42 |
| todo.md 状态 | 清理 | Phase 42 5/5 主线 `[x]`，进度与验收均已填写 |

### 未覆盖边界

- CWV 中位数基线需等待 CI 运行 `pnpm build && pnpm test:perf:cwv` 产出后，回填到性能规范 `docs/standards/performance.md`。
- `pnpm lint:i18n` 未在本轮单独执行，新增 i18n 键依赖 typecheck + 运行时验证。

<!-- regression-window:end:phase42-close:第四十二阶段:2026-06-04 -->

<!-- regression-window:start:phase42-docs-sync:第四十二阶段收口后:2026-06-04 -->
## 2026-06-04 第四十二阶段收口后文档同步

### 范围

- 目标：执行第四十二阶段归档后的文档收口，包括 todo.md 清理、搜索优先原则规范文档同步、英文翻译同步。
- 本轮覆盖：todo.md（Phase 42 完成项归档）、AGENTS.md（4.5 搜索优先摘要）、ai-collaboration.md（1.4 搜索优先详细规则）、development.md（搜索优先原则）、ai-development.md（搜索优先指引）、CLAUDE.md（搜索优先触发规则）、full-stack-master/code-auditor/qa-assistant agent 定义（搜索优先强化）。
- 非目标：不新增功能、不改变代码。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | — | 仅文档改动，不涉及代码 |
| `pnpm lint` | — | 仅文档改动 |
| `pnpm docs:check:source-of-truth` | Pass | 文档事实源层级正确 |
| `pnpm docs:check:i18n` | Pass | 翻译文档时效性通过 |
| en-US 翻译同步 | 完成 | ai-collaboration.md（1.3/1.4 搜索优先）、development.md（搜索优先原则） |
| todo.md 清理 | 完成 | Phase 42 完成项归档，当前执行面清空 |

### 未覆盖边界

- `en-US/standards/ai-collaboration.md` 仅同步搜索优先相关章节（1.3/1.4），完整 PDTFC+ 2.0 细节仍待后续同步。
- `zh-TW` / `ko-KR` 翻译保持 source-only，无需更新。

<!-- regression-window:end:phase42-docs-sync:第四十二阶段收口后:2026-06-04 -->

<!-- regression-window:start:phase43-close:第四十三阶段:2026-06-05 -->
## 2026-06-05 第四十三阶段收口回归

### 范围

- 目标：第四十三阶段「AI 分发复用与治理深化」5 条主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、Code Auditor 审计及修复、i18n nesting bug 修复、sourceMap 跨平台修正。
- 非目标：不包含 Windows 本地 perf 测量（确认为平台级瓶颈，已关闭）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0w（pre-existing 4 个除外） |
| `pnpm i18n:audit:missing` | Pass | total: 0 |
| `pnpm i18n:audit:duplicates` | Pass | 97 组（Phase 43 收敛后） |
| `pnpm governance:audit:simple-duplicates` | Pass | 同名函数 110, 同名类型 20 |
| Code Auditor | Pass | 2 blocker 已修复（i18n nesting + sourceMap） |
| roadmap.md 归档 | 完成 | Phase 43 审计结论已写入 |
| todo-archive.md 滚动归档 | 完成 | Phase 43 归档块已写入 |
| todo.md 状态 | 清理 | Phase 43 5/5 主线完成，执行面清空 |

### Phase 43 交付清单

| 主线 | 交付 | 提交 |
|---|---|---|
| AI 内容多格式复用 | social-post API + Service + Prompt + Dialog + 5 locale i18n | `e749f3de` |
| ESLint / 类型债 | vue emits/props + max-statements + max-lines + no-non-null-assertion 扩展 | `d3068ab5` |
| 结构复用治理 | commercial-link-manager 自重复 + PostNavigationItem/DirectUploadStrategy/toErrorMessage | `a9cf62ff` |
| Windows 性能治理 | warmup + extensions + inline 瘦身 + sourceMap + build:done；平台级瓶颈确认关闭 | `227eca85`, `c8e5ba39`, `9afe8553` |
| i18n duplicates 收敛 | voice/actions 键统一至 common，-5 组 -11 keys | `7bc309df` |

### 未覆盖边界

- AI 社交帖子 API 无速率限制（审计 warning #3）
- AI 服务 + API 无测试覆盖（审计 warning #4）
- Windows 本地 perf 采集受平台瓶颈阻塞，对比数据仅 CI Linux 对照（106s）

<!-- regression-window:end:phase43-close:第四十三阶段:2026-06-05 -->

<!-- regression-window:start:phase49-close:第四十九阶段:2026-06-13 -->
## 2026-06-13 第四十九阶段收口回归

### 范围

- 目标：第四十九阶段「延期清缴与流量治理」5 条优化主线交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、5 条主线全部交付。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0 errors, 0 warnings |
| todo-archive.md 滚动归档 | 完成 | Phase 49 归档块已写入 |
| todo.md 状态 | 清理 | 执行面已清空 |

### Phase 49 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| Postgres 流量治理 | includeAuthorEmail:false + 移除 JSON 字段 | `95dc1a0f`, `80dc313c` |
| formatDate 复用 | 6 处自定义 wrapper 消除 | `793e5af4` |
| 延期测试回填 | friend-links.test 3 用例 + admin checkbox | `7907b793` |
| 清理收口 | vendor.css 删除 + backlog.md | `455ced9c` |
| type 收敛 | AdAdapterConfig 统一 (12→11) | `10eb6fff` |
<!-- regression-window:end:phase49-close:第四十九阶段:2026-06-13 -->

<!-- regression-window:start:phase48-close:第四十八阶段:2026-06-13 -->
## 2026-06-13 第四十八阶段收口回归

### 范围

- 目标：第四十八阶段「深度治理与清理收口」5 条优化主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、治理文档 2 份、todo-archive 滚动归档。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors（删除 API 时捕获 3 处前端引用） |
| `pnpm lint` | Pass | 0 errors |
| todo-archive.md 滚动归档 | 完成 | Phase 48 归档块已写入 |
| todo.md 状态 | 清理 | 执行面已清空 |

### Phase 48 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| ESLint / 类型债 | 9 处 as any 清零 | `a9499974`, `47233bab` |
| 结构复用 | 3 组类型收敛 (15→12) | `2f099780`, `baa65136` |
| API Schema | 2 端点 RouterParam Zod + 2 测试 | `cf1a2035`, `44e9e25c` |
| 未使用 API 删除 | 2 端点删除 + 前端引用验证 | `15658bd1`, `fd72487b` |
| 第二轮调研 | 4 端点评估 + 1 确认候选 | `f9013bcc` |

### 关键发现

- 删除 API 时 typecheck 捕获 3 处"假零引用"（前端实际调用）：posts/audit、theme-configs/delete、snippets/convert
<!-- regression-window:end:phase48-close:第四十八阶段:2026-06-13 -->

<!-- regression-window:start:phase47-close:第四十七阶段:2026-06-11 -->
## 2026-06-11 第四十七阶段收口回归

### 范围

- 目标：第四十七阶段「接口契约与路由治理深化」6 条优化主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、治理文档 4 份、todo-archive 滚动归档。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0 errors |
| todo-archive.md 滚动归档 | 完成 | Phase 47 归档块已写入 |
| todo.md 状态 | 清理 | 执行面已清空 |

### Phase 47 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| ESLint / 类型债 | 6 处 as any 收敛 | `b704618f` |
| 结构复用治理 | 3 组类型收敛 (FeedItem/TitleSuggestionOverlayRef) | `7ef401b0`, `516daa45` |
| API 路径规范化 | route-api-path-governance.md + 2 处 P0 修复 | `102b107b`, `db2a54e0` |
| 路由风格统一 | 规范冻结 + calendar/marketing → index.vue | `4f6686a6`, `9e3ddad1` |
| 未使用 API 评估 | unused-api-cleanup-assessment.md | `e3864b1a`, `5d690e5e` |
| API Schema 治理 | taxonomy.ts + 3 组复用样板 | `09924a42`, `8259fa75` |

### 未覆盖边界

- Phase 44-46 的回归窗口不在本轮扫描范围（已有独立窗口）。
<!-- regression-window:end:phase47-close:第四十七阶段:2026-06-11 -->

<!-- regression-window:start:phase44-close:第四十四阶段:2026-06-07 -->
## 2026-06-07 第四十四阶段收口回归

### 范围

- 目标：第四十四阶段「友链生态与性能闭环」6 条主线全部交付后的阶段收口回归。
- 本轮覆盖：全仓 typecheck + ESLint、i18n 键完整性、Phase 44 全部主线、docs 归档。
- 非目标：不包含 CWV 实际数值采集（需 CI `build-lighthouse` 产出）。

### 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `pnpm typecheck` | Pass | 0 errors |
| `pnpm lint` | Pass | 0 errors, 10 pre-existing warnings |
| i18n key 覆盖 | Pass | feed_title / feed_empty / show_rss_feed 在 5 locale 中完整 |
| todo-archive.md 滚动归档 | 完成 | Phase 44 归档块已写入 |
| todo.md 状态 | 清理 | Phase 44 6/6 主线完成，执行面已清空 |

### Phase 44 交付清单

| 主线 | 交付 | 提交 |
|------|------|------|
| 友链 RSS 聚合 | showRssFeed 管理配置 + RSS/Atom 抓取/解析/缓存 + 公开页最近更新 | `3fa5b924`, `d580d6c0`, `b06314b6` |
| 隐私自托管分析评估 | Umami 评估文档，条件性 Go 结论 | `2d41ae1d` |
| ESLint / 类型债 | 3 组窄切片: no-non-null-assertion + no-explicit-any | `28e171f8` |
| 结构复用治理 | SettingFieldMetadata + AgreementFormData 收敛 | `249eb90a` |
| CWV 性能优化 | Logo 预加载 + CSS @import 扁平化 | `8669d0c0` |
| Phase 44 测试回填 | Phase A (19 用例) + Phase B (7 用例) | `2d41ae1d`, `8d35652f` |

### 未覆盖边界

- CWV 基线数值待 CI 运行 `pnpm build && pnpm test:perf:cwv` 后回填。
- 友链管理页 Checkbox 渲染测试及公开页 feed 渲染/降级测试已回灌 backlog。
<!-- regression-window:end:phase44-close:第四十四阶段:2026-06-07 -->

<!-- regression-window:start:phase46-weekly-kickoff:第四十六阶段:2026-06-10 -->
## 2026-06-10 第四十六阶段周级回归执行结果（已收口）

### 范围

- 目标：完成第四十六阶段 P0 主线「周期性回归任务 + 项目现状调研」的固定入口执行，并沉淀可复查证据。
- 本轮覆盖：执行 `pnpm regression:weekly`，完成 `test:coverage` 全量运行并落盘 Review Gate artifact。
- 非目标：本条记录不直接修复 blocker，仅输出本轮回归结论与后续治理入口。

### 执行快照

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 固定入口 `pnpm regression:weekly` | 已完成 | 本轮执行完成，退出码 `1` |
| `test:coverage` | 失败 | `485` 个测试文件中 `2` 个失败文件，`3` 条失败用例 |
| 周级回归 artifact | 已生成 | `artifacts/review-gate/2026-06-10-weekly-regression.{md,json}` |
| 回归窗口记录 | 已更新 | 自动回填条目已写入当前窗口（`Reject` / blocker=1） |

### 项目现状调研（阶段候选）

- 候选 1：后台与设置页测试链路存在高频 i18n 缺词告警（如 `pages.admin.*`、`pages.admin.settings.theme.*`），应优先治理“测试环境 locale 装配与键完整性”基线。
- 候选 2：全量 coverage 成本高且输出噪音大，建议补“周级回归稳定执行策略”（隔离日志、分段回归或覆盖率分片），降低周期性任务被中断风险。
- 候选 3：部分组件测试暴露第三方 mock 契约噪音（如 `primevue/usetoast` 导出提示），建议纳入“测试 mock 契约一致性”专项窄切片。

### 后续治理计划

- 优先修复 `tests/scripts/run-e2e.test.ts` 中 `walks directories recursively while skipping ignored entries` 的不稳定断言。
- 对齐 `server/api/ai/tts/estimate.post.test.ts` 与最新 Zod 校验契约，修复 `voice/text` 缺失时断言口径漂移。
- 修复后再次执行 `pnpm regression:weekly`，将本轮 `Reject` 收敛为可放行结论。

<!-- regression-window:end:phase46-weekly-kickoff:第四十六阶段:2026-06-10 -->