# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:b4-a-ai-task:第七十一阶段条目 2 AI 任务详情整路由:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 2（B4-A）：AI 任务详情与共享内容组件迁移

### 范围

- `/admin/ai/tasks/[id]` 整路由：Button / ProgressSpinner / Message / Card + `AdminAiTaskDetailContent`。
- 共享组件：`task-detail-content.vue`（Tag ×3 走 tone、复制按钮、错误 Message、AI 图片包装层）、`task-details-dialog.vue`（ProgressSpinner / Message）、`stats-overview.vue`（5 个 Card + 9 图标）、`metric-card.vue`（Card；`icon` prop 由字符串改为组件）。
- 路由登记：`AI_ROUTE_SCOPE` 移除 `primeVueSubRoutes`，加 `migratedSubRoutes`（任务详情）、`ownedFiles`（task-detail-content）与 `inScopeComponents`（Card / Message / ProgressSpinner / Image）。

### 验证

- parity admin-ai **4 passed**：stats-light 23,503px（2 区域）、stats-dark 24,127px（2 区域）、tasks-list-light 23,542px、tasks-list-dark 26,961px；stats 两条的第二区域按实测复校（24,879→21,377 / 25,661→21,972），未归因 0。
- 详情页错误分支探针：`/admin/ai/tasks/nonexistent-id` → 200，h1「AI 任务详情」，`CaomeiMessage` 显示 "Task not found"，pageerror 0。
- `npx vitest run components/admin/ai "pages/admin/ai/tasks/[id].test.ts"`：**8 passed**（内容 5 + 页面三态 3）；guard 58 passed；`typecheck` 0；`build` 通过（3m05s）。
- 修复（Round 1 审计）：`CaomeiCard` 的 `#title` 内 `space-between` 失效（heading 宽度塌缩）→ 指标卡与告警卡改用 `#extra` 插槽承载图标；补充 Tag tone 顺序断言与页面三态测试；`metric-card` 恢复 CRLF；迁移方案例外清单同步（AI 子路由转正）。
- 复算：组件 429 → **411 处 / 36 类**；图标 374 → **358 处**。

### 未覆盖边界

- `/admin/ai/tasks/[id]` 正常数据态无种子任务，未做浏览器截图；由组件测试与错误分支探针覆盖。
- parity 参考态仍为迁移前 PrimeVue；stats-overview 迁移后的差异按实测归因，未重采参考态。

<!-- regression-window:end:b4-a-ai-task:第七十一阶段条目 2 AI 任务详情整路由:2026-11-06 -->

<!-- regression-window:start:b4-a-snippets:第七十一阶段条目 2 灵感收纳箱整路由:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 2（B4-A 首批）：灵感收纳箱整路由迁移

### 范围

- `/admin/snippets` + `/admin/snippets/capture` 整路由（7 文件：5 组件 + 2 页面）：`snippet-card` / `quick-capture` / `edit-dialog` / `bookmarklet` / `aggregate-dialog` + 两个页面。
- 组件替换：Button（icon-only + lucide `#icon`）、Tag（tone + 默认插槽）、Checkbox（数组模型）、Paginator（1 基 `page` + 自渲染页码报告，`useAdminList` 加 `pageIndexBase: 1`）、Textarea / Select / SelectButton / InputNumber / Divider / Card / Image / Accordion 族；图标 30+ → `@lucide/vue`（`pi-spin` → `LoaderCircle` + 本组件动画）。
- 路由登记：`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin/snippets`（`ownedFiles` 5 个组件 + `migratedSubRoutes` capture）。

### 验证

- `pnpm test:visual:parity`（仅 4 条，**样式修复后重测**）：**4 passed**；list-light 17,628px / list-dark 18,318px / capture-light 9,087px / capture-dark 9,410px，全部由 allowlist 按实测扣减，未归因 0。修复前 list-dark 为 73,535px（快捷采集卡片高度塌缩导致），修复 textarea 内层控件后回落。
- `npx vitest run pages/admin/snippets/index.test.ts components/admin/snippets tests/modules/ui-library-*-guard.test.ts tests/scripts/parity-budget.test.ts`：**7 files / 98 passed**（页面 5 + 组件 10 + 守卫 74 + 预算 9）。
- `ui-library-route-migration-guard` + transition guard：**74 passed**（路由守卫 58 + 过渡组件 16）。
- `pnpm typecheck` 0；`pnpm lint` 0 error；`pnpm build` 通过（2m27s）。
- 页面结构探测（Playwright + admin storage）：h1、聚合按钮 disabled、空态、capture 标题 / textarea / Tag 均正常，`pageerror` 0。

### 修复（Round 1 审计）

- 补 5 个语言包 `common.back`（返回按钮可访问名）；
- `CaomeiTextarea` 内层 control 的 flex / 高度 / 字号 / 行高（capture 20px、quick-capture 18px、edit 16px）；
- 缩略图补 `.caomei-image` 根节点尺寸；
- 聚合弹窗移除 `useI18n()` 内联调用（改用 setup 顶层 `locale`，避免事件处理器内抛错）；
- parity allowlist 按互斥连通区域重登记（list-dark 改为 4 个 allowlist 区域（5 个连通域），声明值 = 各区域实测）。

### 未覆盖边界

- 非空片段列表的分页交互未用真实数据验证（TEST_MODE 无片段种子），分页转换由单测覆盖。
- E2E 补跑计划：`tests/e2e` 无 snippets 专用 spec，随下一次 `regression:weekly` / 管理端 E2E 补跑 `/admin/snippets` 主路径；本窗口不以探针替代 E2E 证据。
- list-dark 修复前 73,535px 中约 55,000px 来自快捷采集卡片高度塌缩（内层 `textarea` 仅 45px）；修复后降至 18,318px，剩余为卡片 / 折叠面板内边距与暗色底色差异。
- capture 的差异由 5,620 / 5,956 增至 9,087 / 9,410：文本域修复为填满容器后，外观差异区域随之扩大，属结构正确后的真实差异。

<!-- regression-window:end:b4-a-snippets:第七十一阶段条目 2 灵感收纳箱整路由:2026-11-06 -->

<!-- regression-window:start:b4-item-1-baseline:第七十一阶段条目 1 B4 开工基座:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 1：B4 开工基座与参考态采集

### 范围

- 现取复核：未迁移页面 **19 个 / 页面口径 90 处**（剥离注释 89 处）；脚本口径组件 **482 处 / 40 类 / 82 文件**。
- 参考态：`PENDING_ROUTES` 登记 **14 条**（管理端 2 + 公开页 12），HEAD 采集 **28 张**；`/admin` 与 `/admin/calendar` 因运行时日期窗口 /「今天」高亮不纳入，另 5 条动态 id / 无种子路由不纳入（2 条日期型 + 2 条动态 id + 3 条无种子 = 7 条路由，清单表内 6 行）；`/privacy-policy`、`/user-agreement` 按默认 agreement 兜底纳入。
- 门禁基建：`gotoWaitUntil` 支持（外部头像阻塞 `load`）；heading 等待改为 `exact: true` + `.first()`（保留 `.first()` 作为精确同名时的 DOM 顺序兜底）；`--only` 改为后缀锚定，避免 `posts-list` 误命中 `admin-posts-list`。
- 在册族：全局扩族会使 **8 条已收口路由**判红（合法残留），改为随条目 2 / 3 路由整迁登记 `inScopeComponents`，B3 残留族另行收口后再并入全局基准；清单见 [B4 迁移清单](../../design/governance/2026-11-06-b4-migration-inventory.md)。

### 验证

- `pnpm test:visual`：**24 passed**（4.7m）。
- `pnpm test:visual:parity`：**83 passed**（82 条比对 + 1 条安装路由登记守卫，18.5m），新 28 条实测 0px / 0.000%。
- `npx vitest run tests/scripts/capture-visual-reference.test.ts tests/scripts/parity-budget.test.ts tests/modules/ui-library-route-migration-guard.test.ts`：**74 passed**。
- `pnpm typecheck` 0；`pnpm lint` 0 error（9 个既有 warning）；`lint-md` 通过。
- 误采修复：`--only=posts-list` / `friend-links` 曾子串命中已迁移路由并覆盖 4 张参考态，已恢复原图与 manifest 记录；`--only` 已改为后缀锚定并补单测。

### 未覆盖边界

- `/admin`、`/admin/calendar`、`/admin/posts/[id]`、`/admin/ai/tasks/[id]`、`/categories/[slug]`、`/tags/[slug]`、`/goto/[code]` 未纳入 parity；前两者为运行时日期依赖，其余为动态 id / 无种子。
- 新 28 条参考态为「HEAD 当前渲染」，与采集时点绑定；条目 2 / 3 迁移后只比对这些参考态。

<!-- regression-window:end:b4-item-1-baseline:第七十一阶段条目 1 B4 开工基座:2026-11-06 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-05 -->
## 2026-11-05 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-05-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-05-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 105 行 / 3 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 补充证据: `test:e2e` 单 worker **228 passed**（34.1m）；CI 同提交 `Test` run `42016033169` 的 E2E 1/4–4/4 分片亦全部 success。
- 阈值处置: 首屏 JS 360KB → **365KB**（实测 369,212 B）；重复代码基线 1.22% / 45 clones → **0.5% / 48 clones**（允许 0.65% / 50）；依据见 [2026-11-05 质量门阈值重定标](../../design/governance/2026-11-05-quality-gate-recalibration.md)。
- 环境说明: 此前本地 `seo-regression` 文章详情 `page.goto` 外部资源加载超时，已将该用例改为 `waitUntil: 'domcontentloaded'` 后通过，断言强度不变。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-05 -->

<!-- regression-window:start:caomei-locale-wiring:第六十九阶段条目 3 内建文案 locale 接线:2026-11-02 -->

## 2026-11-02 第六十九阶段条目 3 内建文案 locale 接线（`CaomeiConfigProvider` + `registerLocale`）

### 范围

- 新增 `plugins/caomei-locale.ts`：模块顶层静态 import `caomei-ui/locale/{zh-tw,ja-jp,ko-kr}` 并 `registerLocale`；`zh-CN` / `en-US` 由包根预注册，未重复注册。
- `app.vue`：`<CaomeiConfigProvider :locale="caomeiLocale">` 包在 `CaomeiToastProvider` / `CaomeiConfirmDialog` 外层；`caomeiLocale` 由 `composables/use-caomei-locale.ts` 提供（应用 registry 归一化 + `satisfies Record<AppLocaleCode, CaomeiLocale>` 映射，无 `as` 断言）。
- 测试：`tests/plugins/caomei-locale.test.ts`（注册表 / 切换 / 未注册回落 + 告警 / 表格·分页·日期文案键）、`tests/plugins/caomei-locale-ordering.test.ts`（注册晚于 provider 首帧不追溯）、`tests/composables/use-caomei-locale.test.ts`（归一化 / 响应式 / `app.vue` 接线结构）。
- 附带修正：`composables/use-admin-ai-page.test.ts` 的整模块 `vi.mock('caomei-ui')` 改为 `importOriginal`（插件顶层 `registerLocale` 在旧全量 stub 下不存在）。

### 两种注册形态的取舍

| 形态 | 结论 | 依据 |
| :--- | :--- | :--- |
| 静态 import 三门语言（采用） | `coreEntryJs` 353.05KB → **357.41KB**（+4.36KB；三份文件 gzip -9 分别为 1,307 / 1,483 / 1,405 B，合计 4,195 B 仅为单文件参考，入口重压后不可逐字节相加），未越 360KB 配额 | 本轮实测；无首帧阻塞、无切换竞态 |
| 按当前语言异步 import（未采用，未单独构建实测） | 功能上不可选 | `registerLocale` 写入的是普通对象（`dist/locale/index.js`），`provideLocale` 的文案是 `computed` 且只在语言标识变化时重算（`dist/composables/use-locale.js`）。异步注册若晚于 provider 首帧，该语言会一直显示 `zh-CN`；若在语言切换时才 await，切换路径会出现「先回落、后不重算」的竞态。项目内已有 `tests/plugins/caomei-locale-ordering.test.ts` 钉住该契约 |

### 验证结果

- 质量门：`typecheck` 0 error；`lint` 0 error；全量 `pnpm test` **577 passed / 1 skipped（共 578 个测试文件）**；`pnpm build` 成功；`test:visual` **18/18**。
- 包体：`test:perf:budget:strict` 通过——`coreEntryJs` **357.41KB / 360KB**、`maxAsyncChunkJs` 55.45KB / 130KB、`keyCss` 61.79KB / 70KB、`prIncrementJs` 0（基线重取后）。基线三项已按本轮实测重取（`coreEntryJs` 337,008 → 365,988 B、`maxAsync` 49,147 → 56,779 B、`keyCss` 60,896 → 63,270 B），归因写入 `.github/perf/bundle-baseline.json`。
- 浏览器抽查（5 语种，`/admin/users`，无 hydration mismatch）：

| 语种 | Paginator `aria-label` | 「上一页」按钮 |
| :--- | :--- | :--- |
| `zh-CN` | 分页 | 上一页 |
| `en-US` | Pagination | Previous page |
| `zh-TW` | 分頁 | 上一頁 |
| `ja-JP` | ページネーション | 前のページ |
| `ko-KR` | 페이지네이션 | 이전 페이지 |

- 未注册语言回落：`provideLocale({ locale: 'fr-FR' })` 返回 `zh-CN` 文案并在非生产环境输出「未注册」告警（单测覆盖）。

### 未覆盖边界

- `CaomeiDatePicker` 目前无生产使用（日期控件仍是 PrimeVue，随第七十阶段 B3 迁移），故「日期面板」只做到文案键级断言（`datePicker.label` 在 `ja-JP` / `ko-KR` 下分别为 `日付` / `날짜`），未做浏览器面板抽查。
- `ConfirmDialog` 的内建按钮文案同理由单测覆盖（`confirm.confirm`）：现有调用点均显式传 `confirmLabel` / `cancelLabel`，浏览器侧无法触发「未传 label」路径。
- DataTable 空态在浏览器侧未稳定构造（后台列表均有种子数据，`?page=99` 被后端归位到首页），改由文案键断言 + 既有 `Paginator` 实渲染共同覆盖。

<!-- regression-window:end:caomei-locale-wiring:第六十九阶段条目 3 内建文案 locale 接线:2026-11-02 -->

<!-- regression-window:start:overlay-family-migration:第六十九阶段条目 2 浮层族整迁:2026-11-02 -->
## 2026-11-02 第六十九阶段条目 2 浮层族整迁（服务层 / 浮层组件 / v-tooltip）

### 范围

- 服务层：`app.vue` 挂载 `CaomeiToastProvider` / `CaomeiConfirmDialog`，185 处 `toast.add` → `toast.show`、18 处 `confirm.require` → `confirm.confirm` 的 Promise 形态改写；`useToast` / `useConfirm` 仅从 `caomei-ui` 引入。
- 浮层组件：Dialog 39 / Drawer 3 / Popover 5 / Menu 3 / ConfirmDialog 6 全量迁移；6 处生产锚点改声明式触发器或 `useAnchoredPopover`。
- 指令：84 处 `v-tooltip`（36 文件）改由 `components/app-tooltip.vue` 桥接 `CaomeiTooltip`，方位修饰符按 `.top` / `.right` / `.bottom` / `.left` 映射为 `side`（默认 `top`，12 处 `bottom`、2 处 `left`、23 处显式 `top`）。
- 守卫：`tests/modules/overlay-family-residual-guard.test.ts` 以全仓口径（含 `app.vue` / `utils` / `middleware` / `modules`）守住 `v-tooltip`、浮层族 PrimeVue 标签与 PrimeVue 服务层残留。

### 验证结果

- 质量门：`typecheck` 0 error；`lint` 0 error（9 条既有 `max-lines` / `packages/cli` warning）；全量 `pnpm test` 574 文件 / **5,071 passed / 1 skipped**；`pnpm build` 成功。
- 截图识别层：`pnpm test:visual` **18/18**。`admin-agreements-dialog` / `admin-taxonomy-dialog` 浅深两态共 4 张基线按迁移后观感重采，归因见下节。
- 视觉一致性门禁：`pnpm test:visual:parity` **34/34**（含 `admin-marketing-form-dialog` 浅深两态）。
- E2E：`pnpm test:e2e:critical` 三浏览器复跑通过（首轮超时均为并发资源争抢，单测复跑通过）；`pnpm exec playwright test --project=chromium` 72 passed / 1 flaky / 2 failed，失败项归因见下节。

### 差异归因

| 项 | 现象 | 归因 |
| :--- | :--- | :--- |
| `admin-agreements-dialog` 浅 / 深 | 关闭图标由 `pi pi-times` 文本字形变 SVG；内容区左右内边距变宽，提示文案在同宽下多折一行，弹窗总高变化 | `CaomeiDialog` 统一 `--caomei-space-4` 内边距与内建关闭按钮；迁移方案 §5.5 的预期差异，重采基线 |
| `admin-taxonomy-dialog` 浅 / 深 | 标题字号 / 字段间距略增、关闭图标同上 | 同上；弹窗内控件（Tabs / Input / Switch / Checkbox / Select / Textarea）来源未变 |
| `admin-marketing-form-dialog` 浅 / 深 | 旧参考态含 PrimeVue Dialog 外壳，与当前 `CaomeiDialog` 外观整体不一致（未归因 34,572px / 2.668%） | 表单控件在参考态已迁移，外壳本次才迁移；该用例的守卫目标是**弹窗内表单控件**，故按迁移后观感重采参考态，避免为外壳差异登记一条覆盖整个弹窗的允许清单而削弱控件回归灵敏度 |
| `should display settings page`（E2E） | `page.goto('/settings')` 等 `load` 事件 30s 超时 | 环境性：默认页头像指向 `gravatar.com` / `ui-avatars.com`，当前沙箱无外网导致两张图片请求悬挂，`load` 永不触发；同页 `?tab=apiKeys` / `?tab=notifications` 用例均通过，页面本体（`.settings-page`）已渲染 |
| `should load post list page` / SEO 文章元数据（E2E） | `waitForLoadState` / `page.goto` 30s 超时 | 并发资源争抢：单 worker 复跑通过；与浮层改动无交集 |

### 未覆盖边界

- `DropdownMenuTrigger` / `PopoverTrigger` 的 `as-child` 内嵌 `AppTooltip` 时，内层 tooltip 的 `data-state` 会覆盖外层菜单状态（`aria-expanded` / `aria-haspopup` / 事件均正常；浏览器实测菜单可开、可 Esc 关闭、焦点回填）。当前唯一消费方是下拉触发器的 `[data-state='open']` 底色规则，该规则在迁移前也不作用于 PrimeVue `Button` 子节点，故无观感回退；已登记为已知偏差。
- 三层视觉回归的静态截图不含 hover 态；tooltip 的 `side` 方位由桥接层单测 + 浏览器抽查（语言切换器 `bottom`）覆盖，`left` 方位未做浏览器抽查。
- 全量 E2E 的三浏览器矩阵仅跑了 critical 子集，覆盖面以 chromium 全量 + critical 跨浏览器为准。

<!-- regression-window:end:overlay-family-migration:第六十九阶段条目 2 浮层族整迁:2026-11-02 -->
