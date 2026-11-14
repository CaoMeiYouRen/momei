# 待办事项归档分片：第六十九阶段

> 从 [主归档窗口](../todo-archive.md) 迁出的近线历史块，保留完整验收标准与收口记录。索引见 [深度归档索引](./index.md)。

---

## 第六十九阶段：PrimeVue → caomei-ui 迁移（三）——1.0.0-rc.1 升级与 token 角色接线、浮层族整迁、内建文案 locale 接线（已审计归档）

> 归档说明: 第六十九阶段「3 条迁移主线 + 1 条覆盖率治理主线」已于 2026-11-03 完成全部条目交付并归档。条目 1 完成 `caomei-ui@1.0.0-rc.1` 精确锁定与 6 个新 token 角色桥接（视觉 18/18、parity 34/34、`keyCss` 62,382 B / 70KB、soft 8% 对比度两态 ≥4.5、`dependabot.yml` 全量 `ignore`）；条目 2 把浮层族（Dialog 39 / Drawer 3 / Popover 5 / Menu 3 / ConfirmDialog 6 + 服务层 + `v-tooltip` 84 处）整族迁到 caomei-ui，新增 `AppTooltip` 桥接与全仓零残留守卫，`test:visual` 18/18、`test:visual:parity` 34/34、critical E2E 三浏览器通过；条目 3 以静态 `registerLocale` + `CaomeiConfigProvider` 接通内建文案，5 语种 Paginator/分页实测跟随语言，`coreEntryJs` 357.41KB / 360KB 并按阶段收口重取基线；条目 4 补测 `setting` / `text-translation-task` / `post-automation` 三模块（statements 90.31% / 95.27% / 93.18%），全仓 Statements 80.98% → 81.17%（本批 +0.19pp），`+0.3pp` 未达的结构性原因与后续观察项已登记。各批 Review Gate 均 Pass（Round 1–4 的 blocker 已逐项闭环）。`todo.md` 已清理，`roadmap.md` 已同步归档结论，`docs/reports/regression/current.md` 保留第六十九阶段五个活动窗口（条目 1–4 + 一个 2026-11-02 修复窗口），`docs/i18n/*/plan/roadmap.md` 摘要已同步。

> **ROI 评估**: `1.0.0-rc.1` 升级与 token 接线 `3.20`；浮层族整迁 `1.90`；locale 接线 `1.60`；覆盖率第十批 `2.10`。


> 阶段规划详情、ROI 与回滚边界见 [项目计划](../roadmap.md)。
> 迁移方案事实源见 [PrimeVue → caomei-ui 迁移方案](../../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)（本阶段对应 §3.10 / §7 重切后的 69 段）。
> backlog 来源见 [长期规划与积压项](../backlog.md) 长期主线第 10 条（UI 组件库迁移，含 `1.0.0-rc.1` 待执行条目）与第 1 条（测试覆盖率）。

**时间表**: 2026-11-01 ~ 待定（按里程碑滚动，不预设结束日）

**准入前置（已核对 2026-11-01）**: 第六十八阶段已审计归档、`todo.md` 无残留、`git status` 干净；`caomei-ui@1.0.0-rc.1` 已于 2026-10-30 发布（`dist-tags.next`，`latest` 仍为 `0.7.0`），已完成 `CHANGELOG` / exports / 依赖 / 组件清单 / 基础层字节 / token 面向对比（见迁移方案 §3.10）；本仓 `engines.node = 24.x`、CI 为 `lts/*`，满足 rc.1 的 `node >= 22`；阶段构成（构成方案 A：69 升级 + 浮层族 + locale / 70 B3 / 71 B4）经用户 2026-11-01 在候选页确认。

**剩余迁移面（2026-11-01 复算）**: PrimeVue 开口标签 **1,161 处 / 146 文件 / 58 个组件名**（`pnpm governance:count:primevue-usage` 口径）；浮层族组件标签 **64 处 / 50 文件**（Dialog 39 处 / 34 文件、ConfirmDeleteDialog 8、ConfirmDialog 6、Popover 5、Drawer 3、Menu 3），叠加服务层与指令调用（生产文件口径，排除 `*.test.ts`：`useToast` 42 文件、`useConfirm` 14 文件、`v-tooltip` 37 文件）后**并集约 100 文件**；`primeicons` **556 处 / 142 文件 / 126 个唯一图标**。原四段轨迹中的 69 / 70 两段无法覆盖剩余迁移面，故重切为 69–71 三段（67 / 68 归档结论不变，批次总跨度为 67–71；偏离记录见迁移方案 §7 / §3.10）。

- [x] **1. caomei-ui 1.0.0-rc.1 升级与新 token 角色接线（P1；并入 backlog 短期候选 #12）**
    - **执行范围**: `caomei-ui` 由 `0.7.0` 精确锁定升级到 `1.0.0-rc.1`（不加 `^`、不写范围；1.0.0 GA 后再评估是否转 `^`）；升级前留 `BREAKING CHANGES` 阅读记录（rc.1 **未声明** BREAKING，但含渲染面变更，见迁移方案 §3.10）。桥接扩展（`styles/main.scss`，保持 unlayered）：补齐 6 个新角色——`--caomei-color-{primary,success,warning,danger,neutral}-text` 与 `--caomei-color-control-border`；`-text` 按模式感知取值：**`primary` 必须取 `var(--p-primary-700)` / `var(--p-primary-400)`**（主色由用户在运行时配置，`--p-primary-*` 由 `use-theme.ts` 动态生成，**不得写死 Aura 静态蓝 `--p-blue-700`**），`danger` 取 `--p-red-700` / `-400`，`success` / `warning` 取 `--p-{green,orange}-800` / `-400`（`-700` 在 `bg-elevated` 上跌破 4.5），neutral **不得复用 tone**（取「文本色 85% + 卡片色」派生）；暗色用特异性更高的 `html:root.dark` 后排块（按 0.7.0 选择器形态推断，以契约测试实测为准）；`control-border` **不桥接**，采用上游默认（控件边界 3:1），并在 [偏差处置表](../../design/governance/visual-parity-deviation-register.md) 登记「控件边界深于 PrimeVue 并存观感」一条。同步 `tests/visual/caomei-token-bridge.visual.test.ts` 契约断言（light / dark 两态 × 4 个 tone + neutral）。`.github/dependabot.yml` 为 `caomei-ui` 增加 `ignore`（或改走人工升级），阻断「精确锁定仍被机器人抬版」路径（迁移方案 §3.8 / §5.6 收尾必办）。复测：`test:visual` 18 条用例（14 张截图 + 2 条桥接契约 + 2 条对比度契约）重采并逐张归因；`test:visual:parity` 34 条按新增已登记偏差重校准允许清单；`test:perf:budget:strict` 复测（预判 `keyCss` +750 B ~ +1,141 B：下限按 0.6.0 批次约 0.66 的合并压缩收益折算，上限即无合并收益时等于基础层 gzip 1,683 B → 2,824 B（+1,141 B））；`DataTable` 的两个上游修复（横向滚动容器键盘可达、全选作用域与 lazy 页内状态）在 15 条已迁移路由做定向回归；组件清单按 rc.1 复数为 **95 项**（与 0.7.0 逐项一致）。
    - **非目标**: 不改 solid 层、主色、surface、圆角、字体；不做选择器级组件覆盖（仍只走 `--caomei-*` 变量）；不接入未发布的后续预发布版本（`rc.2+` 发布后按同一纪律另立批次）；不迁移任何页面。
    - **最小验收**: `package.json` / `pnpm-lock.yaml` 中 `caomei-ui` 为 `1.0.0-rc.1` 精确锁定且无 `file:` 形态；`html:root` 桥接下 4 个 `-text` 角色 light 计算值等于对应来源（`primary` = `--p-primary-700`、`danger` = `--p-red-700`、`success` / `warning` = `--p-{green,orange}-800`）、dark 等于对应 `-400`，neutral **与 tone（`--p-text-muted-color`）分离**；**`CaomeiTag` / `CaomeiMessage` 的 soft 8% 底文字在 light / dark 实测对比度均 ≥ 4.5**（沿用 backlog #12 原验收，不以 token 计算值断言替代对比度实测）；`control-border` 计算值等于上游默认（未被桥接）；`test:visual` 18/18 且差异逐项归因（新增偏差必须登记，不得静默）；`test:visual:parity` 全绿且允许清单只按已登记偏差增长；`keyCss` ≤ 70KB 且增量已归因到基础层；`typecheck` / `lint` / `lint:css` 通过；`dependabot.yml` 的 `ignore` 规则语义经核对（精确版本与 `>=` 形态均被拦）。
    - **证据落点**: 回归记录新增窗口（升级 + 桥接 + 基线重采 + 包体复测）；迁移方案 §3.5 / §3.10 / §5.2 / §5.6 / §8.4.1；偏差处置表新增条目；权限相关产物按仓库约定不入库（`artifacts/review-gate/`）。
    - **收口（2026-11-01）**: 已完成。`caomei-ui` 精确锁定 `1.0.0-rc.1`（锁文件仅该包变更，顺带重解析的 `tslib@2.9.1` 已还原）；桥接补接 5 个 `-text`（`html:root` 浅色深档 + `html:root.dark` 取 `-400`，primary 走运行时 `--p-primary-700/-400`），`control-border` 有意不桥接（上游 3:1 默认，登记为有意偏差）；`dependabot.yml` 全量 `ignore`。验证：视觉 18/18（14 截图 + 2 桥接 + 2 新增对比度契约；基线更新 10 张、2 个未迁移页零差异）、parity 34/34（33 条按实测全量重校准，复跑残差 ≤225px；归因探针实测控件边界贡献 8,187/8,190px 与 3,416px、状态文字 0 与 251/259px）、`keyCss` 62,382 B / 70KB（较 0.7.0 批次 +1,106 B，命中预判）、soft 8% 底对比度浅 5.83–10.36 / 深 6.43–11.38（次级面亦 ≥5.4；`success` / `warning` 取 `-800` 后为 6.66 / 6.74；闭合 #12；neutral 若复用 tone 仅 4.26，已通过分离取值消除）、定向单测 70/70（含新增版本锁定守卫）。**未覆盖**：`DataTable` 两处上游修复的运行时行为回归转第七十一阶段全量 E2E。证据见回归记录 2026-11-01 窗口。

- [x] **2. 浮层族整迁（P1；B4 前置）**（2026-11-02 按渐进式推进拆为 2a–2d 并完成；不再按单条 100 文件批次收口）
    - [x] **2a. 服务层与全局壳**: `CaomeiToastProvider` / `CaomeiConfirmDialog` 挂载；`toast.add` / `confirm.require` 全量改写；`useToast` / `useConfirm` 仅从 `caomei-ui` 引入。
    - [x] **2b. 浮层组件**: Dialog / Drawer / Popover / DropdownMenu / Menu / ConfirmDialog / `ConfirmDeleteDialog` 迁移；命令式锚点改 `useAnchoredPopover`；在册族扩面。
    - [x] **2c. `v-tooltip` → `CaomeiTooltip`**: 84 处 / 36 文件（`v-for` 展开前；其中 12 处 `.bottom`、2 处 `.left`、23 处显式 `.top`）。按渐进式策略先以 `setting-form-field` 验证组合写法，再批量落地。
        - **实现口径（2026-11-02）**: 新增 `components/app-tooltip.vue` 作桥接层（`CaomeiTooltip` + `Trigger as-child` + `Content`），调用点只保留 `content` / `side` 两个语义参数；桥接层内部自带 `CaomeiTooltipProvider`（`delay-duration=0` 对齐原指令即时出现），并以 `inheritAttrs: false` + `v-bind="$attrs"` 把外层 `as-child` 触发器（DropdownMenu / Popover）的 aria 与事件转发到真实触发元素。
        - **验证**: `AppTooltip` 单测 6 例（默认方位、修饰符映射、空内容禁用、attrs 透传、真实 `CaomeiButton` 子节点、嵌套 `DropdownMenuTrigger as-child`）；`tests/modules/overlay-family-residual-guard.test.ts` 新增全仓守卫（`v-tooltip` / 浮层族 PrimeVue 标签 / PrimeVue 服务层导入与调用零残留）。
    - [x] **2d. 验证与收尾**: 浏览器交互回归、三层视觉回归、E2E / mock 收尾、文档与归档。
        - **验证（2026-11-02）**: `test:visual` 18/18（协议 / 分类弹窗 4 张基线按 caomei Dialog 观感重采）；`test:visual:parity` 34/34；浏览器抽查 tooltip（`side=bottom`、`data-state=delayed-open`、`aria-describedby`）与嵌套下拉（开合 / Esc / 焦点回填）、分类弹窗（Esc / 焦点回填）；E2E 选择器把 `.p-dialog` / `.p-toast-message-success` 改为 `[role="dialog"]` / `.caomei-toast--success`；`test:e2e:critical` 三浏览器通过，chromium 全量 72 passed / 1 flaky / 2 failed（失败均为外网头像请求悬挂与并发资源争抢，已归因）。差异与未覆盖边界见 [回归记录](../../reports/regression/archive/2026-11-02-to-2026-11-05-phase69-70-tail.md#2026-11-02-第六十九阶段条目-2-浮层族整迁服务层--浮层组件--v-tooltip)。
        - **已修复（2026-11-02，2d）**: 草稿恢复确认与路由离开确认并发时，caomei `confirm.open()` 会以 `false` 了结前一条待决请求。`promptDraftRecovery` 改为非破坏性 reject——取消 / 被取代时保留本地草稿，只有确认恢复才写回；`draft_discarded` 文案随之移除（5 语种同步）。
        - **已知偏差（2026-11-02 2c Review Gate）**: `AppTooltip` 嵌在 `CaomeiDropdownMenuTrigger` / `CaomeiPopoverTrigger` 的 `as-child` 内时，两层触发器的 `data-state` 同名，内层 tooltip 的 `closed` 会覆盖外层菜单的 `open`（`aria-expanded` 不受影响）。当前唯一消费方是下拉触发器 `[data-state='open']` 底色且被 `:hover` 规则掩盖；2d 需实测该底色与 `reader-controls` 的左侧（`side="left"`）弹出方位。
    - **执行范围**: 把 Dialog / Drawer / Popover / DropdownMenu / Menu（含 SubMenu / Item）/ ConfirmDialog / `ConfirmDeleteDialog` / `useConfirm` / `useToast` / `v-tooltip`（→ `CaomeiTooltip`）整族迁到 caomei-ui；覆盖范围分两种口径——**组件标签 64 处 / 50 文件**（Dialog 39 处 / 34 文件、ConfirmDeleteDialog 8、ConfirmDialog 6、Popover 5、Drawer 3、Menu 3），叠加服务层与指令调用（生产文件口径：`useToast` 42 文件、`useConfirm` 14 文件、`v-tooltip` 37 文件）后**并集约 100 文件**。含 `components/admin/posts/*`（distribution / translation-workflow / tts / social / audit / publish-push V2 / rewrite-compare）、`components/admin/snippets/*`、`components/admin/users/*`、`components/admin/settings/*-dialog`、`components/admin/ai/task-details-dialog`、`components/app-search` / `article-content` / `article-share` / `article-sponsor` / `commercial-link-dialog` / `confirm-delete-dialog` / `settings-api-keys`，以及 `pages/admin/friend-links`、`pages/admin/marketing`、`pages/admin/migrations/link-governance`、`pages/posts/[id]`；**6 处生产锚点**的 `.toggle(event)`（`post-editor-voice-overlay` / `app-voice-input-overlay` / `app-header` ×2 / `language-switcher` / `app-notifications`）改写为 caomei 触发器形态（另有 1 处测试桩同步调整）；按 caomei 契约复核并统一弹窗焦点（`autofocus` / focus trap，含 backlog 中「切换语言页签后焦点停在触发器」的遗留）；`CAOMEI_UI_ROUTE_SCOPES` / 在册族清单登记浮层族并扩面守卫；`tests/**` 中与浮层相关的 PrimeVue mock 与 E2E `p-*` 断言同步改写（全量基线为 25 个 vitest mock 文件 / 3 文件 11 处断言，本条只承担浮层相关子集，剩余部分随第七十一阶段收口）。
    - **非目标**: 不迁移 settings 表单控件本体与 installation 流程（B3，第七十阶段）；不做图标全量替换（第七十一阶段）；不卸载 PrimeVue；不改浮层视觉设计与信息架构。
    - **最小验收**: 全仓无 `Dialog` / `Drawer` / `Popover` / `DropdownMenu` / `Menu` / `ConfirmDialog` 的 PrimeVue 标签残留；`useConfirm` / `useToast` 仅从 `caomei-ui` 引入；浮层交互回归通过（打开 / 关闭 / 嵌套 / Esc / 焦点回填 / 滚动锁定 / teleport 下的宽度与定位）；三层视觉回归差异逐项归因；在册族零残留守卫通过；`typecheck` / `lint` / `lint:css` / 定向单测 / 相关 E2E 通过。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单；焦点契约结论（含 teleport 下 scoped 样式陷阱的核对记录）；回归记录窗口。
    - **收口（2026-11-02）**: 服务层与浮层组件已迁移——`app.vue` 挂载 `CaomeiToastProvider` / `CaomeiConfirmDialog`，185 处 `toast.add` 与 18 处 `confirm.require` 改写为 caomei API（`useToast` / `useConfirm` 仅从 `caomei-ui` 显式引入）；Dialog 39 / Drawer 3 / Popover 5 / Menu 3 / ConfirmDialog 6 全部迁移，全仓已无该族 PrimeVue 标签与 `.toggle(event)`；`ConfirmDeleteDialog`、`app-search`、`app-notifications`、`app-header`、`language-switcher` 等共享壳同步迁移；6 处生产锚点改为声明式触发器或 `useAnchoredPopover` 锚点；`CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS` 已扩面到浮层族。`v-tooltip` 已由 `AppTooltip`（`CaomeiTooltip` 桥接）承接（84 处 / 36 文件，指令计数归零）。验证与收尾已完成（`test:visual` 18/18、`test:visual:parity` 34/34、浏览器交互抽查、E2E 选择器改写与 critical 三浏览器通过）；`typecheck` / `lint` / 全量单测（5,071 passed）通过。证据见 [回归记录](../../reports/regression/archive/2026-11-02-to-2026-11-05-phase69-70-tail.md#2026-11-02-第六十九阶段条目-2-浮层族整迁服务层--浮层组件--v-tooltip)。

- [x] **3. 内建文案 locale 接线（P1）**
    - **执行范围**: 新增 Nuxt plugin：挂载前 `registerLocale()` 注册 `zh-TW` / `ja-JP` / `ko-KR`（`zh-CN` / `en-US` 为包根预注册，不得重复注册）；以 `CaomeiConfigProvider`（`:locale` 取 `useI18n().locale`）包裹应用根或后台布局，使组件内建文案（表格空态、分页、日期面板、ConfirmDialog 等）跟随语言；先实测「静态 import 三门语言」与「按当前语言异步 import」两种形态的 `coreEntryJs` 差量（条目开工实测 353.05KB / 360KB）再择一；补接线单测（注册早于挂载、未注册语种回落 `zh-CN`）。
    - **非目标**: 不新增语种；不改 momei 自有 i18n 结构与翻译键；不替换 `primevue-i18n`（随第七十一阶段卸载）；不改写 caomei 文案内容。
    - **最小验收**: 5 个语种下后台内建文案跟随语言（抽查 DataTable 空态、Paginator、DatePicker、ConfirmDialog）；未注册语种回落 `zh-CN` 且非生产告警存在；`coreEntryJs` 未越 360KB；`typecheck` / `lint` / 定向测试通过。
    - **证据落点**: 回归记录窗口（5 语种抽查表 + `coreEntryJs` 实测）；迁移方案 §5.4。
    - **收口（2026-11-02）**: 已完成。新增 `plugins/caomei-locale.ts`（静态 import 三门语言 + 模块顶层 `registerLocale`）与 `composables/use-caomei-locale.ts`（registry 归一化 + `satisfies` 映射），`app.vue` 以 `<CaomeiConfigProvider :locale>` 包住 toast / confirm；5 语种浏览器抽查 Paginator 内建文案跟随语言、无 hydration mismatch；`coreEntryJs` 353.05 → **357.41KB**（+4.36KB，未越 360KB），异步形态因 provider 的 `computed` 语义存在切换竞态而否决（裁定与证据见回归记录）；基线三项按本轮实测重取（`prIncrementJs` 归零），入口余量 2,652 B 已登记 backlog 跟踪。`typecheck` / `lint` / 全量单测（577 passed / 1 skipped，共 578 个测试文件）/ `test:visual` 18/18 / `test:perf:budget:strict` 均通过。

- [x] **4. 测试覆盖率治理第十批（P2）**
    - **执行范围**: 按未覆盖语句绝对数取 `server/services/setting.ts`（43）/ `server/services/ai/text-translation-task.ts`（34）/ `server/services/ai/post-automation.ts`（32）三模块补测；失败 / 边界断言优先，不做低价值铺量。
    - **非目标**: 不追求全仓 `90%+` 一步到位；不为覆盖率重构被测模块。
    - **最小验收**: 三模块各 `+15pp` 或达 `85%+`；全仓 Statements 以 `+0.3pp` 为容量现实目标（第六十八阶段已证单批 `+1pp` 结构上不可达），未达时记录结构性原因；`typecheck` / `lint` / 定向 `pnpm test` 通过。
    - **证据落点**: coverage 数值与模块清单写入回归记录；backlog 长期主线第 1 条基线随阶段归档同步。
    - **收口（2026-11-03）**: 已完成。三模块补测后 statements / branches / functions 分别为 `setting.ts` 90.31% / 88.35% / 93.18%、`text-translation-task.ts` 95.27% / 85.32% / 100%、`post-automation.ts` 93.18% / 80.12% / 84.21%，均越过「+15pp 或 85%+」验收线；全仓 Statements **80.98% → 81.17%（本批 +0.19pp，闭合 68 条）**；相对第六十八阶段收口 81.04% 的阶段累计为 +0.13pp（分母由 34,857 增至 35,598，条目 1–3 新增代码稀释），Branches 70.83% → 70.90%、Lines 81.15% → 81.29%、Functions 80.07% → 79.98%（同样被新增函数稀释）。全仓 +0.3pp 未达的结构性原因：本批候选池 109 条的理论上限仅 +0.31pp，实际闭合 68 条（62%）；剩余 41 条分散在低价值防御分支，继续铺量收益低于换更大基数的模块。验证：`pnpm test:coverage` EXIT 0、全量 `pnpm test` 578 files / 5,119 passed / 1 skipped（毛新增 36 例、删除 1 例重复后净增 35）、`typecheck` 0 error、`lint` 0 error；证据见[回归记录](../../reports/regression/archive/2026-11-03-phase69-coverage-batch10.md#2026-11-03-第六十九阶段条目-4-测试覆盖率治理第十批setting--文本翻译任务--文章自动化)。

**回滚边界**:

- 条目 1：版本回退 `0.7.0` 并还原桥接新增块、基线 JSON 与 `dependabot.yml` 即可，无业务代码改动。
- 条目 2：按路由 / 组件独立回滚，浮层族在册登记同步收缩；`v-tooltip` 指令回退须同时还原指令注册。
- 条目 3：删除 plugin 与 provider 包裹即回到 `zh-CN` 回落（既有行为）。
- 条目 4：测试文件独立可删，不影响业务代码。

**风险提示**:

- rc.1 是**首个非静默升级**：`control-border` 与 Button hover/active 会改变已迁移路由的静态外观，基线重采与允许清单必须按实测校准；禁止为「保持门禁绿」回退上游 token。
- 浮层涉及 teleport 与 scoped 样式：`&__dialog` 类规则对 teleport 元素失效已有 2026-10-28 实证（`/admin/marketing`），迁移时须逐浮层核对外层宽度 / 定位的书写位置。
- 浮层族迁完后「浮层显式豁免」消失，`CAOMEI_UI_IN_SCOPE_PRIMEVUE_COMPONENTS` 口径与「浮层显式豁免」（原 34 个含 `<Dialog>` 的文件）须同批收缩，避免登记与事实脱节。
- locale 接线是**用户可见行为变更**（ja-JP / ko-KR / zh-TW 的后台内建文案从 `zh-CN` 变成本语种），须在 V 阶段做 5 语种浏览器验证。


### 阶段收口检查清单

- [x] 当前阶段核心条目已完成（条目 1–4 全部关闭）
- [x] `todo.md` 已清理（当前无进行中阶段）
- [x] `todo-archive.md` 已追加归档块
- [x] `roadmap.md` 已同步阶段状态与结论（正文迁入 `archive/roadmap-phases-69.md`）
- [x] 回归记录 / Review Gate 证据可追溯（第六十九阶段条目 1–4 窗口保留在 `docs/reports/regression/current.md`，未滚动归档）
- [x] `lint:md` / `docs:check:i18n` / `docs:check:line-count` / `docs:check:links` / `docs:check:markers` 与最小质量门已确认
- [x] wisdom 蒸馏已执行：21 条 → 4 处文档（迁移方案 §6.2、测试规范 §2.3 / §7.3、文档规范 §5.4、Git 规范 §5），活跃条目 18 → 3
- [x] 已形成 Pass / Reject 结论（Review Gate Round 1–4 的 blocker 已逐项闭环）
