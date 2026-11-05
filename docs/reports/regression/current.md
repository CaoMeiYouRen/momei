# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:coverage-batch-11:第七十阶段条目 5 测试覆盖率治理第十一批:2026-11-05 -->
## 2026-11-05 第七十阶段条目 5 测试覆盖率治理第十一批（链接治理 / 链接治理 helpers / TTS）

### 范围

按 [todo.md](../../plan/todo.md) 第七十阶段条目 5，开工时以当次全量 `coverage-final.json` 复算「绝对未覆盖语句数」选模，取 `server/services/` 候选池前三名补测（仅测试代码，无生产改动）：

| 模块 | 基线（未覆盖 / 总数） | 补测内容 | 新增用例 |
| :--- | ---: | :--- | ---: |
| `server/services/migration-link-governance.ts` | 82.61%（32 / 184） | 外部链接在线探测的成功 / 不可达 / 超时中止；相对链接默认跳过；静态模式下域外跳过；seed 命中但目标实体缺失；canonical 路由回退；无匹配 `mapping-missing`；apply 复核报告的 mode / status 校验；contentTypes 与 retry 空集；报告列表分页钳制、筛选与请求人映射；报告 404；默认 seeds | 15（新增 `migration-link-governance.edge-cases.test.ts`） |
| `server/services/migration-link-governance.helpers.ts` | 88.68%（30 / 265） | 空路径 / 非法绝对 URL / 空过滤器回退；托管域名前缀不匹配与非法 base URL；`permalink-rule` 重定向原因；`translationId` 与 slug 回退；托管域名跳过逻辑；绝对地址 seed 匹配；未知分类 / 标签 canonical 返回 null | 7 |
| `server/services/ai/tts.ts` | 88.64%（30 / 264） | 无 owner 早退；模型回填、50KB 进度与进度保存失败；完成 / 失败通知异常；总时长超限；收到数据后读超时保留 partial；流读取错误；后台上传失败；resume 后 latest failed（podcast / tts）；podcast checkpoint 无效 phase 与不支持 phase | 11（新增 `tts.process-task.test.ts`） |

> 选模口径：按绝对未覆盖语句数排序（[测试规范 §2.3](../../standards/testing.md#23-覆盖率补测节奏-coverage-batch-pacing)），前三名为 32 / 30 / 30；`quota-governance`（28）、`agreement`（26）、`setting`（25）因绝对数更低未入选，未按百分比排序。`helpers` / `tts` 基线已高于 85% 门槛，本批对二者的验收由「`≥85%`」条款承接，补测目标是其残留的失败 / 兜底分支。

### 覆盖率结果

| 指标 | 本批前基线（2026-11-05 实测） | 本批终值 | 本批增量 | 阶段累计（相对第六十九阶段收口） |
| :--- | ---: | ---: | ---: | ---: |
| Statements | 80.40%（29,220/36,340） | **80.66%**（29,315/36,340） | **+0.26pp**（+95 条） | −0.51pp（覆盖 +418 / 总数 +742） |
| Branches | 70.70%（18,043/25,519） | **71.07%**（18,137/25,519） | +0.37pp（+94） | +0.17pp（覆盖 +313 / 总数 +381） |
| Functions | 78.92%（6,578/8,335） | **79.08%**（6,592/8,335） | +0.17pp（+14） | −0.90pp（覆盖 +110 / 总数 +231，新增函数稀释） |
| Lines | 80.55%（28,151/34,947） | **80.81%**（28,241/34,947） | +0.26pp（+90） | −0.49pp（覆盖 +401 / 总数 +703） |

> 口径注：`29,315/36,340 = 80.6687%`，vitest 文本报告按截断显示 `80.66%`；模块表按四舍五入显示；**增量 / 阶段累计按「覆盖数 / 总数」复算，与两个展示值相减可能差 0.01pp**。本批无生产代码改动，语句总数与「本批前」一致；+95 条中 89 条为三模块直接闭合，另 6 条为间接闭合（`server/utils/snowflake.ts` +5、`server/utils/ai/task-result.ts` +1）。**阶段累计 −0.51pp = 开工前条目 1–4 稀释 −0.77pp（覆盖 +323 / 总数 +742，43.5%）＋ 本批 +0.26pp**，是本批终值相对第六十九阶段收口 81.17%（28,897/35,598）的净差，不是本批回退。

三模块（statements / branches / functions）：

| 模块 | 补测前 | 补测后 | Δ（statements） |
| :--- | ---: | ---: | ---: |
| `migration-link-governance.ts` | 82.61% / 65.36% / 73.08% | **100.00% / 85.47% / 100.00%** | +17.39pp |
| `migration-link-governance.helpers.ts` | 88.68% / 77.27% / 100.00% | **98.87% / 92.27% / 100.00%** | +10.19pp |
| `ai/tts.ts` | 88.64% / 74.21% / 73.91% | **100.00% / 83.73% / 100.00%** | +11.36pp |

三模块均越过「`+15pp` 或 `≥85%`」验收线（MLG +17.39pp；helpers / tts 基线已达 85%+）。

### 全仓 `+0.3pp` 未达的结构性原因

- 单批 `+0.3pp` 需闭合 **109 条**语句（36,340 × 0.3%）。在「3 模块 + `server/services/` 前列」口径下，前三模块未覆盖合计仅 **92 条**（理论上限 +0.25pp），**即使 100% 闭合也不可达**。
- 本批实际直接闭合 **89 / 92 = 96.7%**（MLG 32、helpers 27、tts 30），加 6 条间接闭合共 95 条，仍差 14 条；剩余 3 条为 helpers 的空 slug 防御分支（正则 `([^/]+)` 已保证 slug 非空，属不可达兜底）。
- 结论：目标不可达源于**选模粒度（3 模块）**，不是闭合率不足。后续批次若要达 +0.3pp，需放宽为 4 模块或纳入更大基数模块（当前 `server/database/typeorm-adapter.ts` 84 条、`server/utils/logger.ts` 61 条）；已回填 backlog #1 的下一切片方向。

### 「文件 → 改动点」清单

| 文件 | 类型 | 覆盖重点（失败 / 边界优先） |
| :--- | :--- | :--- |
| `server/services/migration-link-governance.edge-cases.test.ts` | 新增（15 例） | 探测成功 / 网络失败 / 3s 中止；相对链接默认跳过；静态域外跳过；seed 目标缺失；canonical 回退；mapping-missing；apply 报告非 dry-run（400）/ 未完成（409）；contentTypes 过滤；retry 空集；列表分页钳制与用户映射；空列表；404；默认 seeds |
| `server/services/migration-link-governance.helpers.test.ts` | 补 7 例 | 空路径与非法绝对 URL；托管域前缀不匹配 / 非法 base URL；`permalink-rule`；`translationId` / slug 回退；空托管域；绝对地址 seed；未知分类 / 标签 |
| `server/services/ai/tts.process-task.test.ts` | 新增（11 例） | 无 owner；模型回填 + 50KB 进度 + 进度保存异常 + 完成通知异常；总时长超限；收到数据后读超时；流错误 + 失败通知异常；后台上传失败；resume 后 latest failed；checkpoint 无效 / 不支持 phase |
| `server/services/ai/tts.test.ts` | 未改 | 既有 provider / 计费 / 补偿基线 |

> 拆分依据：本批 3 个测试文件合计新增约 928 行，超过开发规范 §2.8.2 的 800 行软阈值；按「一个模块一个测试文件」承载（MLG 边界用例、TTS `processTask` 流式 / 补偿用例各自独立成文件），未把不同模块塞进同一文件，也未改动既有大文件结构；初版追加到 `migration-link-governance.test.ts` 触发 `max-lines-per-function`（902/800）后按此规则拆分。

### 验证结果

- `pnpm test:coverage`：**EXIT 0**，全量 **586 个测试文件（1 skipped）／5,202 例通过（1 skipped）**（批次前 5,169 例；净增 33 例，测试文件 +2）。运行前已移走 `node_modules/.vitest-cache`。
- `pnpm typecheck`：EXIT 0。
- `pnpm exec eslint`（3 个新增 / 修改测试文件）：**0 error / 0 warning**（初版 `migration-link-governance.test.ts` 追加后触发 `max-lines-per-function` 902/800，已拆分到独立 `edge-cases.test.ts`，原文件保持 582 行）。
- 定向复跑：5 个相关测试文件 **80 / 80 passed**。

### 未覆盖边界

- `migration-link-governance.helpers.ts` 剩余 3 条为空 slug 防御分支（正则 `([^/]+)` 要求至少一个非斜杠字符，`/posts/`、`/categories/`、`/tags/` 在路径归一化后无法产生空捕获），未为覆盖率引入不可达断言。
- `tts.ts` 分支 83.73%，剩余为 provider 兼容兜底与类型收窄分支；真实流式 provider / OSS 行为仍由 mock 替代。
- `migration-link-governance.ts` 分支 85.47%，剩余为 summary 计数的类型收窄与 `dataSource` 兜底。

<!-- regression-window:end:coverage-batch-11:第七十阶段条目 5 测试覆盖率治理第十一批:2026-11-05 -->
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

<!-- regression-window:start:phase70-caomei-ga:第七十阶段条目 1a caomei-ui 1.0.0 GA 升级:2026-11-03 -->
## 2026-11-03 第七十阶段条目 1a caomei-ui 1.0.0 GA 升级与门禁复跑

### 范围

`caomei-ui` 由 `1.0.0-rc.1` 精确升级到 `1.0.0`（GA 于 2026-11-02 发布，`dist-tags.latest`），版本追加进 `tests/modules/caomei-ui-version-pin.test.ts` 的 `APPROVED_VERSIONS`；复核 `.github/dependabot.yml` 的 `caomei-ui` ignore（`>=1.0.0-rc.2` 继续覆盖 GA 与 1.0.x，无需调整区间）。本批无业务代码改动，条目 1b / 1c 未开始。

### 上游差异实测（与迁移方案 §3.11 一致）

| 类别 | 结果 |
| :--- | :--- |
| `.js` / `.mjs` / `.css` / `.vue` | **零差异**（`npm pack` 双版本解包后 `diff -rq`） |
| `dist/styles/index.css` | 20,595 B，sha256 `ac48aa0b…2591e0` 两版本一致 |
| 差异总数 | **31 条** = 28 个 `.d.ts`（成员顺序）+ 2 个 README + `package.json` |
| 安装产物 | `node_modules/caomei-ui` 与 GA tarball `diff -rq` 为空 |

### 锁文件与依赖树

- 改动面：`package.json` 1 行、`pnpm-lock.yaml` **5 处（+5/−5，diff 计 10 行）**（importer 的 specifier / version、package 键 + integrity、snapshot 键），无无关包版本漂移。
- 首次 `pnpm add` 顺带重解析的 `electron-to-chromium` / `node-releases` / `rollup@4.66.0` 已按「复原 HEAD 锁文件后只改 caomei-ui 三处」的手工方式还原；`pnpm install --frozen-lockfile` 通过（2719 entries supply-chain policy 通过），安装版本 `1.0.0`。

### 验证结果

- `pnpm build`：EXIT 0，2m04s。
- `pnpm test:visual`：**18/18**（14 张截图 + 2 条桥接契约 + 2 条对比度契约），零差异。
- `pnpm test:visual:parity`：**34/34**，未归因差异 0。
- `pnpm test:perf:budget:strict`：通过 —— `keyCss` **61.79KB / 70KB**、`coreEntryJs` **357.41KB / 360KB**、`maxAsyncChunkJs` **55.45KB / 130KB**、`prIncrementJs` **0.00KB / 20KB**。
- `pnpm typecheck` 0 error；`pnpm lint` 0 error（warning 均为既有）；版本守护单测 **2/2**。
- `pnpm test`：**580 files passed / 1 skipped（581）**、**5,142 passed / 1 skipped（5,143）**，EXIT 0，与批次前基线一致。

### 未覆盖边界

- 条目 1b（parity 第二 webServer + `reader` 档校准）与 1c（10 条参考态采集）未开始，`reader` 档仍为 0 路由。
- `.d.ts` 的成员顺序变化未做逐 prop 语义比对，判据为「成员集合一致 + 全量 `typecheck` 通过」。
- E2E 未重跑：本批无业务 / 样式代码改动，且 GA 运行时产物与 rc.1 逐字节一致。
<!-- regression-window:end:phase70-caomei-ga:第七十阶段条目 1a caomei-ui 1.0.0 GA 升级:2026-11-03 -->

<!-- regression-window:start:phase70-parity-harness:第七十阶段条目 1b/1c 门禁扩面与参考态采集:2026-11-03 -->
## 2026-11-03 第七十阶段条目 1b/1c parity 门禁扩面与 10 条参考态采集

### 范围

条目 1b（门禁能力）与 1c（参考态采集）：把 B3 的 10 条路由登记进 `PENDING_ROUTES` 并采集迁移前参考态；扩展门禁以支持「未安装态第二 server」与「`reader` 档显式声明」。本批无页面 / 组件实现改动。

### 能力变更

| 变更 | 落点 | 说明 |
| :--- | :--- | :--- |
| 第二 webServer + 独立 project | `playwright.visual-parity.config.ts` | `chromium-visual-parity-installation`（3002）承载 `installation.visual-parity.test.ts`；默认 project 以 `testIgnore` 排除该文件 |
| 安装向导 spec | `tests/visual/parity/installation.visual-parity.test.ts` | 固定 mock `/api/install/status`（避免机器相关字段与真实安装态）；含「至少登记一条 installation 路由」的防退化断言 |
| 档位显式化 | `tests/visual/parity/budget.ts`（自 `helpers.ts` 抽出） | `getBudgetEntry(name, tier?)` 以路由定义的 `tier` 优先，名字启发式仅作回退；由 `tests/scripts/parity-budget.test.ts`（4 例）锁定 |
| 路由登记 | `tests/visual/parity/routes.ts` | 10 条：`admin-settings-form` / `admin-settings-theme` / `admin-notifications-list` / `installation-wizard` / `user-settings` / `auth-login` / `auth-register` / `auth-forgot-password` / `auth-reset-password` / `submit-page` |
| CI 超时 | `.github/workflows/test.yml` | `visual` job 20 → 30 分钟（parity 单次约 10.4 分钟） |

### 关键结论（实施期发现）

1. **`MOMEI_INSTALLED=false` 不等于「强制未安装」**：中间件仅跳过环境变量短路，随后仍做数据库探测；主库被 TEST_MODE 种子写成已安装，`/installation` 依旧 302。第二 server 必须同时 `TEST_MODE=false`（不跑种子）与 `DATABASE_TYPE=sqlite` / `DATABASE_PATH=:memory:`（每次启动都是干净未安装态）。
2. **`/settings` 不能等 `networkidle`**：登录态 AppHeader 的 `/api/notifications/stream`（SSE）会让 `networkidle` 不达成（与 `/admin/users` 同源），该路由登记为 `stable: 'lenient'`。
3. 首轮采集因上述两点失败 4 条（`user-settings` ×2、`installation-wizard` ×2）；修复后 `pnpm test:visual:reference` 通过。
4. 首轮失败前已落盘 16 张参考态但 manifest 未记录；随后以 `--only=<8 个路由名>` 重采这 16 张，使 `reference-manifest.json` 完整（54 条 = 原 34 + 新 20）。

### 参考态与比对

- 参考态：新增 **20 张**（10 条路由 × 2 主题），`tests/visual/parity/reference-manifest.json` 共 **54** 条 captures。
- `pnpm test:visual:parity`：**55/55**（54 条比对 + 1 条登记守卫），用时 **10.4 分钟**；`reader` 档实测生效（`user-settings-*` / `auth-*` 行显示 `reader | 2000px / 0.300%`），未归因差异 0。
- 采集与比对使用同一段渲染代码，故待迁移路由当前为「自比自」；迁移落地后该批用例即开始反映真实漂移。

### 验证结果

- `pnpm test:visual:reference`：EXIT 0（分两次完成，共 20 张）。
- `pnpm test:visual:parity`：EXIT 0，55/55。
- `pnpm vitest run tests/scripts/parity-budget.test.ts`：4/4。
- `pnpm typecheck` 0 error；`pnpm exec eslint`（parity 目录 / config / 新单测）0 error。
- 文档门禁：`docs:check:links` / `markers` / `line-count` / `i18n` 通过。

### 未覆盖边界

- 认证页参考态为**登录态**（沿用门禁统一 `storageState`），未覆盖匿名访问形态；页面本身不依赖登录态文案，迁移前后比对仍成立。
- 安装向导按 `admin` 档判定（非公开页），未冻结「点击下一步」后的步骤页；后续条目 3 可按需追加 `activate` 面。
- 第二 server 使用内存库，Better Auth 会打印 `no such table: momei_jwks` 错误日志（页面不依赖、截图不受影响），保留为观察项。
- 参考态就绪锚点缺口：`admin-settings-form` / `admin-settings-theme` / `admin-notifications-list` 依赖异步接口渲染，当前未声明 `readyResponse` / `readySelector`（两次运行 0 差异）；迁移（条目 2）时补锚点，避免数据加载时序变化制造假红。
- `pnpm test:visual`（基线层）未重跑：本批未改动基线层配置与快照。
<!-- regression-window:end:phase70-parity-harness:第七十阶段条目 1b/1c 门禁扩面与参考态采集:2026-11-03 -->

<!-- regression-window:start:phase70-item-2c:第七十阶段条目 2c 通知管理迁移:2026-11-04 -->
## 2026-11-04 第七十阶段条目 2c 通知管理迁移（`/admin/notifications`）

### 范围

`/admin/notifications` 整路由迁移到 caomei-ui：页面（标题 + 操作按钮 + 简介 + 卡片）与共享投递日志列表 `notification-delivery-log-list.vue`（DataTable / 7 个 Column / 筛选行 / DatePicker ×2 / Tag ×3 / 4 个 Button）。本条收口后，第七十阶段 B3 的三段（设置主体 / 主题工作台 / 通知管理）全部完成。

### 组件映射与处置

| PrimeVue | caomei | 说明 / 差异 |
| :--- | :--- | :--- |
| `DataTable` + `Column` | `CaomeiDataTable` + `columns` prop + `#cell-*` | 无 `#header` 插槽，标题与筛选行移到表格上方；`@page` 由 0 基改 1 基 |
| `InputText` | `CaomeiInput` | 筛选收件人；删除 `fluid` |
| `Select` | `CaomeiSelect` | 三个筛选下拉，选项本为对象数组，契约一致；保留 `show-clear` |
| `DatePicker` | `CaomeiDatePicker` | **首个生产用法**：删 `icon-display`，保留 `date-format="yy-mm-dd"`；面板文案跟随已接线的 locale（实测「2026 年 11 月」、周一至周日） |
| `Tag` | `CaomeiTag` | `severity` → `tone`（`info`→`primary`、`contrast`/`secondary`→`neutral`、`warn`→`warning`） |
| `Button` | `CaomeiButton` | 刷新 / 应用 / 重置 / 复制 ID / 跳转营销；图标改 `#icon` + lucide，`aria-label` 保留 |
| `Card` | `CaomeiCard` | `#content` → 默认插槽；页面 scoped 的 `:deep(.p-card-body)` 改 `.caomei-card__body` |

### 守卫与留存

- `lib/ui-library.ts` 新增 `/admin/notifications` scope：`ownedFiles` = `notification-delivery-log-list.vue`，路由级在册族增量 = `Card` / `DatePicker`。
- 迁移后该路由 PrimeVue 开口标签 **0**；运行时 `.p-inputtext` / `.p-button` / `.p-datatable` 均为 0（内容区 106 个 caomei 类）。
- `admin-notifications-list` 从待迁移层移入 `MIGRATED_ROUTES`，参考态保持迁移前 HEAD 采集。

### 验证结果

- `pnpm test`：**584 files passed / 1 skipped（585）**、**5,158 passed / 1 skipped（5,159）**，EXIT 0。
- `pnpm typecheck` 0 error；`pnpm lint`（列表 / 页面 / 守卫 / parity 目录）0 error 0 warning。
- `pnpm test:visual`：**22/22**（本批无新增 / 变更基线）。
- `pnpm test:visual:parity`：**55/55**；`admin-notifications-list` light **52,786px / 4.073%**（6 区域）、dark **53,759px / 4.148%**（4 区域），按实测登记后未归因 **0px**。
- 浏览器抽查（本地 dev 库，非 parity 的内存测试库）：页面标题「通知管理」、列表渲染 1 行；DatePicker 打开后为中文月份 / 星期文案，无 hydration 报错。

### 未覆盖边界

- 列表筛选的交互（日期区间查询、下拉清空后重置）未做 E2E，依赖既有服务端接口测试与本次结构检查。
- `DatePicker` 只在 zh-CN 下实测面板文案；其余 4 语种沿用第六十九阶段的 locale 接线证据，未逐语种复查。
- 该路由没有基线层用例（与既有 admin 列表页一致），像素守线由 parity 承担。
- 已知样式债：时间列的 `headerClass` / `bodyClass` 由 `CaomeiDataTable` 内部节点承载，父组件 scoped 选择器无法命中（`min-width: 12rem` 实际未生效）；`setting-audit-log-list.vue` 同型。属迁移前既有机制问题、无行为回归，随 B4 的选择器 / token 清理统一改为 `:deep()` 或全局 utility class。
<!-- regression-window:end:phase70-item-2c:第七十阶段条目 2c 通知管理迁移:2026-11-04 -->

<!-- regression-window:start:phase70-item-3:第七十阶段条目 3 安装向导迁移:2026-11-04 -->
## 2026-11-04 第七十阶段条目 3 安装向导整路由迁移（`/installation`）

### 范围

`/installation` 整路由迁移到 caomei-ui：容器页 `pages/installation.vue` + `components/installation/` 的 7 个组件（6 个步骤 + 字段状态），按 HEAD 口径合计 **87 处** PrimeVue（页面 17 + 组件 70）。`Stepper` 族与 `Accordion` 族均为首次生产迁移。

同时把 E2E 从「已安装即通过」的弱断言改为**未安装态实例上的六步真实流程**（健康检查 → 初始化数据库 → 站点配置 → 管理员 → 可选功能 → 完成安装），并为基线层补齐 `/installation` 的两张截图。

### 组件映射与处置

| PrimeVue | caomei | 说明 / 差异 |
| :--- | :--- | :--- |
| `Card` | `CaomeiCard` | `#title` / `#subtitle` 两个插槽合并为单个 `#header`（caomei 无 `subtitle` 插槽）；外壳样式改走 `--caomei-card-*` 覆盖钩子；header 需 `flex: 1; width: 100%`（外层是 flex 容器） |
| `Stepper` / `StepList` / `Step` / `StepPanels` / `StepPanel` | `CaomeiStepper` / `CaomeiStepperList` / `CaomeiStepperItem` / `CaomeiStepperTrigger` / `CaomeiStepperIndicator` / `CaomeiStepperTitle` / `CaomeiStepperSeparator` | **caomei 无面板容器**：步骤内容改为页面内 `v-if="currentStep === N"`；`v-model` 由字符串步号改为数字（1 基）；`activateCallback` 改为页面的 `goToStep` 回调；`CaomeiStepperItem` 需 `:disabled="item.value !== currentStep"` 才能复刻 PrimeVue `linear` 的「仅当前步可点」 |
| `Accordion` / `AccordionPanel` / `AccordionHeader` / `AccordionContent` | `CaomeiAccordion` + `CaomeiAccordionItem` | `multiple` → `type="multiple"`；`title` prop + 默认插槽（无 Header / Content 组件）；显式 `:unmount-on-hide="false"`（PrimeVue 非 lazy 用 `v-show` 保留折叠内容） |
| `InputText` / `Textarea` / `Password` | `CaomeiInput` / `CaomeiTextarea` / `CaomeiPassword` | 删除 `fluid`；`rows="N"` → `:rows="N"`；`toggle-mask` 由内建显示 / 隐藏按钮承接。**有意差异**：管理密码保留 `:feedback`（PrimeVue 默认开启强度条），`ai_api_key` / `email_pass` / `s3_key` / `s3_secret` 四处按 caomei 默认关闭强度条（密钥字段无意义） |
| `InputNumber` | `CaomeiInputNumber` | 删除 `fluid`；显式 `:controls="false"`；宽度上限由字段外层 `--caomei-input-number-max-width: 100%` 复位 |
| `Select` | `CaomeiSelect` | **字符串选项数组改为 `{ label, value }`**；`AdminLanguageCode` / `CopyrightType` 用 computed 收窄回写类型；宽度上限由 `--caomei-select-max-width: 100%` 复位 |
| `Message` | `CaomeiMessage` | `severity` → `tone`：`error`→`danger`、`success`→`success`、`warn`→`warning` |
| `Tag` | `CaomeiTag` | `severity="contrast"` → `tone="neutral"`，文案改默认插槽；高度按 token 回落 36 → 24px 以保持迁移前观感 |
| `Button` | `CaomeiButton` | 文案入默认插槽、图标走 `#icon` + lucide；`text` → `variant="ghost"`、`severity="secondary"` → `variant="secondary"` |
| `ProgressSpinner` | `CaomeiProgressSpinner` | `style="width:50px;height:50px"` → `size="lg"` + `--caomei-progress-spinner-size: 50px` |
| PrimeIcons `<i class="pi pi-*">` | `@lucide/vue` | 状态图标（对勾 / 叉 / 警告）、卡片头图标与 14 个安装清单图标全部换源 |

### 守卫与门禁

- `lib/ui-library.ts` 新增 `/installation` scope：6 个步骤组件 + 1 个字段状态组件 + 1 个清单图标映射共 **8 条 `ownedFiles`**；路由级在册族增量 = `Stepper` 族 / `Accordion` 族 / `Card` / `Message` / `Password` / `Textarea` / `InputNumber` / `ProgressSpinner`。
- 迁移后该路由 PrimeVue 开口标签 **0 处**，页面内 `:deep()` 不再依赖任何 `.p-*` 类。
- **E2E 第二个 webServer**（端口 3002）：`MOMEI_INSTALLED=false` + `TEST_MODE=false` + `DATABASE_PATH=:memory:` + `DATABASE_SYNCHRONIZE=true`（内存库需建表，否则 `init-db` 直接 500）；新增 `installation` project（chromium 单实例），三个主 project 的 `testIgnore` 排除该 spec。env / command / baseURL 由 `tests/helpers/playwright-servers.ts` 统一提供给 e2e、基线层与门禁层三份配置。
- **基线层也接入第二实例**：`playwright.visual.config.ts` 增加同源 webServer / project，`tests/visual/installation.visual.test.ts` 用固定 status mock 采集浅 / 深两张基线，并补 4 条结构断言（6 个步骤项、概览 `Tag` 24px、卡片无横向溢出、标题中心与卡片中心 ≤2px）。

### 关键结论（实施期发现）

1. **`CaomeiStepper` 没有面板容器**：PrimeVue 的 `StepPanels` / `StepPanel` 在 caomei 侧不存在，内容必须由页面按 `modelValue` 自行渲染；「步骤内容懒挂载」语义也从库内转移到页面（`v-if`）。
2. **步号类型不同**：PrimeVue 用字符串（`'1'`），caomei 用数字（1 基）。`useInstallationWizard` 的 `currentStep` 与保存回调签名一并改为 `number`。
3. **`linear` 只拦 `goToStep`**：Reka 允许点击「下一步」头直接切换，必须给 `CaomeiStepperItem` 加 `:disabled`，否则可绕过步骤 1 的阻断项与步骤 2 的初始化。
4. **标题区高度是「两个插槽叠加」的结果**：迁移前 `#title` 与 `#subtitle` 各带一份 `2rem` 内边距，合并成单 header 后若只保留一份，整页内容会整体上移 60px；已按原总高还原（`3.5rem` 顶部 + 标题下 `3.5rem`）。
5. **`CaomeiCard` 的 `#header` 外层是 flex 容器**：自定义 header 不设 `flex: 1 / width: 100%` 会被压成内容宽度（实测 304px），标题从左对齐变成「居中」的假象消失又复现——本批先出现、后修复。
6. **步骤条在 800px 容器内是紧凑布局**：6 步等分后每步约 120px，`StepperItem` 内含分隔线。分隔线用默认 `flex:1` 会与触发器平分宽度、把标题压成多行；改为固定 `1rem` 并把剩余宽度让给触发器。
7. **`Tag` 默认取控件高度档（36px）**，迁移前 `.p-tag` 约 24px；不回落会让概览区整体高 12px。
8. **caomei 字段默认带宽带上限**：`Select` 20rem / `InputNumber` 12rem，迁移前 `fluid` 为 100%；须在字段外层用 token 复位（写在组件标签上会静默无效）。
9. **内存库必须开 `DATABASE_SYNCHRONIZE`**：未安装态实例关闭 `TEST_MODE` 后不再跑种子，`synchronize` 也随之关闭，`/api/install/init-db` 会因缺表返回 500。
10. **同名可访问名**：完成步骤的步骤条触发器与主按钮都叫「完成安装」，E2E 必须限定 `.installation-wizard__panels` 作用域。
11. **跨路由共享壳仍为 PrimeVue**：页面内的 `LanguageSwitcher` 未在本批迁移（与 `AppHeader` 共用），迁移后该路由仍有 1 个 `.p-button`，已在迁移方案 §5.5 登记为共享壳例外。

### 审核修复（Review Gate 两轮）

| 编号 | 问题 | 处置 |
| :--- | :--- | :--- |
| B1 | 步骤头可前跳，绕过步骤 1 阻断项与步骤 2 初始化 | `CaomeiStepperItem` 加 `:disabled="item.value !== currentStep"`；E2E 补「非当前步 `toBeDisabled` + 强点不切换面板」 |
| B2 | `Select` / `InputNumber` 默认上限 20rem / 12rem，步骤 3/5 字段仅 320 / 166px | `.form-field` 声明 `--caomei-select-max-width: 100%` / `--caomei-input-number-max-width: 100%`；E2E 断言两者宽度 > 600px |
| B3 | 新增样式触发 5 条 stylelint error | `pnpm lint:css` 修复后 stylelint EXIT 0 |
| B4 | `CaomeiCard` header 的 flex 收缩导致标题左对齐（中心差 248px），且 parity 误归因为「4px 基线」 | `.installation-wizard__header` 加 `flex: 1; width: 100%`；基线补 `titleOffset ≤ 2px` 断言；重采基线并重校准允许清单 |
| B5 | 门禁层配置还留有第三份安装实例 env 副本且缺 `DATABASE_SYNCHRONIZE`，复用 3002 时会让 e2e `init-db` 500 | 三份配置统一改用 `tests/helpers/playwright-servers.ts` |
| W1 | E2E 注释「五步 / 三组 / 只依赖标题」与实际不符 | 统一为六步 / 四组，并注明 `.caomei-*` 的用途 |
| W2 | 数据库初始化断言默认 5s 超时 | 该步 `{ timeout: 15000 }`，整条流程 `test.slow()` |
| W3 | 两份配置重复安装实例 env | 抽取共享 helper（见 B5） |
| W4 | `storageState` 清空注释原因不成立 | 改为「防御性默认」并说明 cookie 跨端口语义 |
| W5 | 反向测试硬编码 3001 | 改用共享 `e2eBaseURL` |
| W6 | ownedFiles 注释口径 | 改为「6 个步骤组件 + 1 个字段状态组件 + 1 个清单图标映射（共 8 条）」 |
| S1 | 状态图标迁移后单色 | 与迁移前一致（仓库无 `text-green-500` 等定义），登记为有意一致 |
| S2 | 步骤 1 的 `.p-inputtext` 断言恒真 | 删除，保留步骤 3/4/5 的防回退断言 |
| S3 | 完成页用 `v-else` | 改 `v-else-if="currentStep === 6"` |
| S4 | 文档把 `icon` 类型写成 `Component` | 改为「语义键 + 渲染侧映射」 |
| S5 | 4 个密钥字段的强度条关闭 | 在组件映射表登记为有意差异 |

### 批次拆分依据（§2.8）

单条 Todo 条目内做了三层同源改动，不拆分提交的理由：① `Stepper` / `Accordion` 族首次生产迁移必须整路由切换，半路由会同时混用两套组件来源（违反 §5.5）；② 视觉基线、parity 参考态与第二 webServer 必须与实现同批落地，否则任一侧单独运行都会红；③ E2E 的六步流程依赖未安装态实例，实例配置只能随实现一起提交。提交按「实现 + E2E」「视觉证据 + 预算」「文档」三个逻辑单元拆分，便于逐段回滚。

### 验证结果

- `pnpm test`：**584 files passed / 1 skipped（585）**、**5,159 passed / 1 skipped（5,160）**，EXIT 0。
- `pnpm typecheck` 0 error；`pnpm lint`（页面 / 组件 / 组合式 / 清单 / 守卫 / 视觉 / E2E / 三份 Playwright 配置）0 error 0 warning；`stylelint`（页面 / 组件 / 布局）EXIT 0。
- `pnpm test:visual`：**24/24**（条目 4 未新增基线；协议对话框 2 张按「编辑器加载完成」重采，见 B5）。
- `pnpm test:visual:parity`：**55/55**；`installation-wizard` 从待迁移层移入 `MIGRATED_ROUTES`，参考态保持迁移前 HEAD 采集；light **48,145px / 3.715%**、dark **48,708px / 3.758%**，各按 6 个区域 / 条带登记后未归因 **0px**。
- E2E：`pnpm exec playwright test tests/e2e/installation.e2e.test.ts --project=installation` **2/2**（六步真实流程 + 步骤头不可前跳 + 步骤 3/5 字段宽度 >600px + 已安装态实例仍 302 的反向断言）。

### 未覆盖边界

- 安装向导的失败分支（数据库初始化失败、站点配置校验错误、管理员密码强度不足、扩展配置接口 500 后仍推进到预览）未做 E2E。
- 步骤 5 的 4 个 Accordion 只断言了条目数量与邮件分组展开后的数字框宽度；其余分组展开态未逐个截图。
- 其余 4 个语种的步骤标题在 800px 下的换行形态未逐语种截图。
- 基线层与 parity 只覆盖步骤 1；步骤 2–6 的整体布局由 E2E 结构 / 宽度断言承担，未逐步截图。
- `docs:check:source-of-truth` 仍有翻译债务（4 个语种的 `docs/i18n/*/plan/roadmap.md` 的 `last_sync` 停在 2026-11-03，源文件已随 2a/2b/2c 与本批变更；另有 4 个 en-US 标准文档）。属既有债务 + 本批新增 1 次源变更（仅周回归失败，主 CI 不跑该检查），未清零。
- 页面底部 `:global(.dark) { .installation-wizard { … } }` 的暗色覆盖在本仓库的 Vue scoped 编译下退化为 `.dark { … }`（作用到 `<html>` 而非目标元素）——迁移前即如此，参考态记录的也是该渲染结果；本批为避免改变暗色观感未改写，登记为 B4 样式清理项。
- 页面内 `LanguageSwitcher`（PrimeVue `Button`）为跨路由共享壳，随全站收口统一迁移。
<!-- regression-window:end:phase70-item-3:第七十阶段条目 3 安装向导迁移:2026-11-04 -->

<!-- regression-window:start:phase70-item-4:第七十阶段条目 4 用户设置与认证迁移:2026-11-04 -->
## 2026-11-04 第七十阶段条目 4 用户设置与认证 / 提交页迁移（reader 档首用）

### 范围

`/settings` + `/login` / `/register` / `/forgot-password` / `/reset-password` / `/submit` 共 **6 条路由**、**16 个文件 / 119 处** PrimeVue（`pages/settings.vue`、`components/settings/` 6 个面板、商用链接三件套、5 个认证 / 提交页与 `components/auth-card.vue`）。**首次启用 `reader` 档**（2000px / 0.3%）并按实测校准 12 条预算。

### 组件映射与处置

| PrimeVue | caomei | 说明 / 差异 |
| :--- | :--- | :--- |
| `Card` | `CaomeiCard` | `#title` / `#content` / `#footer` 三插槽：内容改默认插槽；卡片 body 内边距 1.5rem → 1rem（`padding="md"`），页面整体高度随之变化 |
| `InputText` / `Password` / `Textarea` | `CaomeiInput` / `CaomeiPassword` / `CaomeiTextarea` | 删除 `fluid`；`toggle-mask` 由内建显示 / 隐藏按钮承接；`rows` 改为数字绑定 |
| `Select` | `CaomeiSelect` | 选项对象保持不变；**时区选择的 `filter` 无对应能力**（12 项可滚动），登记为有意差异 |
| `Checkbox` | `CaomeiCheckbox` | `binary` 与 `input-id` 不再需要：布尔 `v-model` + `id`；分类多选沿用数组 `v-model` + `value` |
| `ToggleSwitch` / `ToggleButton` / `ProgressSpinner` | `CaomeiSwitch` / `CaomeiToggleButton` / `CaomeiProgressSpinner` | 属性一一对应；`size="small"` → `size="sm"` |
| `FileUpload` | `CaomeiFileUpload` | `mode="basic"` + `custom-upload` + `auto` + `uploader` 事件契约一致；上传仍走 `/api/user/avatar` |
| `DataTable` + `Column` | `CaomeiDataTable` + `columns` + `#cell-*` | API Key 表与通知历史表；标题行 / 操作行移出 `#header`，`@page` 由 0 基改 1 基 |
| `Tag` / `Message` / `Divider` / `Image` / `MultiSelect` | `Caomei*` | `severity` → `tone`（`info`→`primary`、`secondary`/`contrast`→`neutral`、`warn`→`warning`）；`Image` 预览指示器保留 |
| `AppAvatar`（V1） | `AppAvatarV2` | 该路由登记后自动渲染 caomei 分支；**头像子树改 `ClientOnly`**（见关键结论 1） |
| 品牌图标 `pi-github` / `pi-google` | 保留 PrimeIcons | lucide 无品牌图标；与平台图标一同留待 B4 图标全量批次 |
| `auth-card.vue` 的按钮 / 错误条 | `CaomeiButton` / lucide | 提交按钮文案入默认插槽；错误条图标换 lucide |

### 关键结论（实施期发现）

1. **`AppAvatarV2` + 异步头像 URL 会触发 `insertBefore` 运行时错误**：`useAvatar` 依赖异步哈希且会话数据在 SSR / 客户端首帧不一致；Reka 的 `AvatarImage` / `AvatarFallback` 在带 hydration mismatch 的 patch 中报 “node before which ... is not a child”，表现为**切换设置页签时整页 500**。处置：头像子树包 `<ClientOnly>`（仅该子树延迟到客户端），页签切换恢复正常；未改动共享过渡组件，避免影响 admin 路由。
2. **卡片内边距差 0.5rem**：PrimeVue card body 1.5rem，`CaomeiCard padding="md"` 为 1rem；`/settings` 内容高度减少约 40px、页脚随之上移，已按区域登记。
3. **reader 档首次实测**：6 条路由差异 0.265%–2.661%，均落在“布局基本不变、控件外壳差异”范围；`reader` 预算 2000px / 0.3% 对 `auth-forgot-password`（0.285%）已接近上限，后续该档路由需先评估。
4. **商用链接三件套此前是漏扫面**：`commercial-link-{manager,section,dialog}` 同时被 `/admin/settings` 消费，但两条路由都未把它登记进 `ownedFiles`；本批两条路由均已迁移，一并登记并迁移。
5. **`Image` 的 `#image` 插槽无对应能力**：原实现用该插槽把缩略图替换成一个按钮；caomei 无该插槽，改为直接渲染缩略图 + `preview` 指示器（观感更符合“图片链接”语义），登记为有意差异。
6. **E2E 并行抖动（非迁移引入）**：`user-workflow` / `submit` 在 4 个 worker 并行冷启动时会卡在 `waitForLoadState('networkidle')`（默认布局的 SSE 与外部头像请求），`--workers=1` 下 21/21 通过；CI 默认单 worker，未改动这些既有等待策略。
7. **品牌图标保留 PrimeIcons**：`pi-github` / `pi-google` 无 lucide 对应项，与商用平台图标一并留给 B4 的图标全量批次。

### 审核修复（Review Gate Round 1）

| 编号 | 问题 | 处置 |
| :--- | :--- | :--- |
| B1 | `CaomeiImage` 不透传 `width` / `height` 到内层 `img`：弹窗 `width="120"` 成死属性，列表缩略图无尺寸约束；两处均不在 parity / 基线覆盖内 | 尺寸改由包装层承载：列表 40×40、弹窗 120px 宽 + 内层 `height: auto` 保持比例；新增定向 E2E `should constrain commercial link thumbnails to a fixed size`（客户端切到商用页签 + mock `/api/user/commercial*`，断言 40×40 与 120px） |
| W1 | `.p-button.social-btn` 品牌样式在迁移后成死选择器（品牌色 / 边框 / hover 静默丢失） | `styles/main.scss` 选择器扩为 `.p-button…, .caomei-button.caomei-button.social-btn`（双类压过库内 `--secondary`），图标选择器补 `i` |
| W3 | 只读密钥输入用 `:value`，`CaomeiInput` 挂载时被 `vModelText` 覆盖为首帧空串 | 改 `:model-value="newlyCreatedKey ?? ''"` |
| W4 | 商用对话框 `Select` 的 `#value` 插槽无兜底，未知平台键时触发器空白 | 补 `v-else` 回退原始 `link.platform`（caomei 提供 `#value` 后不再渲染内建 placeholder） |
| W5 | `ClientOnly` 无占位导致水合时插入 64px 头像引发布局偏移；根因未登记 | 补同尺寸 `aria-hidden` 占位；backlog 新增「会话数据 SSR / CSR 单一来源」跟踪项，收口后删除 `ClientOnly` |
| W6 | `app-avatar-v2` / `app-uploader-v2` 注释仍把已迁移路由列为回退 | 同步注释（`settings-profile` / `commercial-link-dialog` 已走 caomei 分支） |
| W7 | `commercial-link-manager.test.ts` / `settings-commercial.test.ts` 的 stub 仍指向旧组件名 | stub 改 `Caomei*` / `AppUploaderV2`，`Image` 桩移除已删除的 `#image` 插槽 |
| S1 | 新增样式使用 `--p-red-500` | 与 `auth-card` 保持一致，登记随 B4 token 清理 |
| S3 | `notification-history-list__time-column` 经列配置落子组件节点，scoped 规则不生效 | 与条目 2c 的同类样式债合并登记，随 B4 改用 `headerStyle` / `bodyStyle` |
| S4 | 两个 `DataTable` 未设 `row-key` | 当前无选择 / 展开状态，登记为后续加选择列时的前置项 |
| S5 | Switch / Select 的可访问名依赖外部 label | 与既有可访问性口径一致，未在本批扩大改动 |
| B5（复审新增） | `test:visual` 的 `admin-agreements-dialog` 两条基线是「编辑器尚未加载」的中间态（协议表单内 Mavon 编辑器约 1s 后才挂载），与迁移无关但卡住 24/24 | 视觉用例补 `.admin-markdown-editor .v-note-wrapper` 可见等待 + `waitForVisualStable`，并在编辑器加载完成后重采这 2 张基线；`test:visual` 24/24 |

### 验证结果

- `pnpm test`：**584 files passed / 1 skipped（585）**、**5,169 passed / 1 skipped（5,170）**，EXIT 0。
- `pnpm typecheck` 0 error；`eslint`（页面 / 设置组件 / 商用三件套 / 守卫 / 视觉 / E2E）0 error 0 warning；`stylelint`（改动页面与组件）0 error。
- `pnpm test:visual:parity`：**55/55**（54 条比对 + 1 条登记守卫）。`reader` 档 12 条实测：

| 路由 | light | dark |
| :--- | :--- | :--- |
| `user-settings` | 29,943px / 2.310%（3 区域） | 29,901px / 2.307%（3 区域） |
| `auth-login` | 16,237px / 1.253% | 16,268px / 1.255% |
| `auth-register` | 28,360px / 2.188%（3 区域） | 28,328px / 2.186%（4 区域） |
| `auth-forgot-password` | 3,697px / 0.285%（3 区域） | 3,438px / 0.265%（3 区域） |
| `auth-reset-password` | 9,267px / 0.715%（9 区域） | 8,806px / 0.679%（9 区域） |
| `submit-page` | 34,491px / 2.661% | 33,575px / 2.591% |

  全部按区域登记后未归因 **0px**；`auth-reset-password` 的 9 区域含页脚右侧 36 / 34px 小区域。
- E2E（chromium `--workers=1`）：`auth` **5 passed / 1 skipped**（其中受选择器影响的 3 条 3/3）、`submit` **2/2**、`user-workflow` **17 passed / 3 skipped**（含新增的商用缩略图尺寸断言）；`auth` + `submit` 在 firefox / webkit 补跑 **14 passed / 2 skipped**。选择器由 `#password input` 改为 `input#password`，`admin` 的 `.p-card` 改为 `.caomei-card`。
- 运行时抽查：6 条路由的内容区 `.p-inputtext` / `.p-button` 均为 0；`/settings` 5 个页签切换正常，通知页 7 个 Switch 与 API Key 表格渲染正常。

### 批次拆分依据（§2.8）

单条 Todo 条目内跨 6 条路由与 3 个共享组件，不拆分的理由：① 三条商用链接组件同时被 `/admin/settings` 与 `/settings` 消费，只迁一侧会造成同组件两套库并存；② `reader` 预算、路由台账与 E2E 选择器必须与实现同批落地，否则门禁两侧单独运行都会红；③ 认证页共享 `auth-card`，四条路由必须同批切换。提交按「实现 + 单测」「视觉预算 + E2E」「文档」三个逻辑单元拆分。

### 未覆盖边界

- 6 条路由没有基线层截图（沿用「admin 列表页无基线」的口径，像素守线由 parity 承担）。
- 分类多选 `CaomeiCheckbox` 只在单测中覆盖数组回写；测试账号无分类数据，浏览器未实测勾选。
- `AppAvatarV2` 的 `insertBefore` 问题只在 `/settings` 用 `ClientOnly` 规避，未修复共享过渡组件；已知同型风险统一登记在 backlog「会话数据 SSR / CSR 单一来源」；该兜底不扩散，根因修复后连同 `ClientOnly` 与占位一起移除。
- 认证失败分支（验证码错误、限流、社交登录回调失败）未新增 E2E。
- 4 个非中文语种的认证页排版未逐语种截图。
- `docs:check:source-of-truth` 翻译债务未清零（4 个语种 roadmap + 4 个 en-US 标准文档）。
<!-- regression-window:end:phase70-item-4:第七十阶段条目 4 用户设置与认证迁移:2026-11-04 -->
