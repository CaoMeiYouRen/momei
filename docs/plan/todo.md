# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 第六十九阶段：PrimeVue → caomei-ui 迁移（三）——1.0.0-rc.1 升级与 token 角色接线、浮层族整迁、内建文案 locale 接线

**状态**: 进行中（2026-11-01 立项；条目 1 已完成，条目 2–4 未开工）

> 阶段规划详情、ROI 与回滚边界见 [项目计划](./roadmap.md)。
> 迁移方案事实源见 [PrimeVue → caomei-ui 迁移方案](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)（本阶段对应 §3.10 / §7 重切后的 69 段）。
> backlog 来源见 [长期规划与积压项](./backlog.md) 长期主线第 10 条（UI 组件库迁移，含 `1.0.0-rc.1` 待执行条目）与第 1 条（测试覆盖率）。

**时间表**: 2026-11-01 ~ 待定（按里程碑滚动，不预设结束日）

**准入前置（已核对 2026-11-01）**: 第六十八阶段已审计归档、`todo.md` 无残留、`git status` 干净；`caomei-ui@1.0.0-rc.1` 已于 2026-10-30 发布（`dist-tags.next`，`latest` 仍为 `0.7.0`），已完成 `CHANGELOG` / exports / 依赖 / 组件清单 / 基础层字节 / token 面向对比（见迁移方案 §3.10）；本仓 `engines.node = 24.x`、CI 为 `lts/*`，满足 rc.1 的 `node >= 22`；阶段构成（构成方案 A：69 升级 + 浮层族 + locale / 70 B3 / 71 B4）经用户 2026-11-01 在候选页确认。

**剩余迁移面（2026-11-01 复算）**: PrimeVue 开口标签 **1,161 处 / 146 文件 / 58 个组件名**（`pnpm governance:count:primevue-usage` 口径）；浮层族组件标签 **64 处 / 50 文件**（Dialog 39 处 / 34 文件、ConfirmDeleteDialog 8、ConfirmDialog 6、Popover 5、Drawer 3、Menu 3），叠加服务层与指令调用（生产文件口径，排除 `*.test.ts`：`useToast` 42 文件、`useConfirm` 14 文件、`v-tooltip` 37 文件）后**并集约 100 文件**；`primeicons` **556 处 / 142 文件 / 126 个唯一图标**。原四段轨迹中的 69 / 70 两段无法覆盖剩余迁移面，故重切为 69–71 三段（67 / 68 归档结论不变，批次总跨度为 67–71；偏离记录见迁移方案 §7 / §3.10）。

- [x] **1. caomei-ui 1.0.0-rc.1 升级与新 token 角色接线（P1；并入 backlog 短期候选 #12）**
    - **执行范围**: `caomei-ui` 由 `0.7.0` 精确锁定升级到 `1.0.0-rc.1`（不加 `^`、不写范围；1.0.0 GA 后再评估是否转 `^`）；升级前留 `BREAKING CHANGES` 阅读记录（rc.1 **未声明** BREAKING，但含渲染面变更，见迁移方案 §3.10）。桥接扩展（`styles/main.scss`，保持 unlayered）：补齐 6 个新角色——`--caomei-color-{primary,success,warning,danger,neutral}-text` 与 `--caomei-color-control-border`；`-text` 按模式感知取值：**`primary` 必须取 `var(--p-primary-700)` / `var(--p-primary-400)`**（主色由用户在运行时配置，`--p-primary-*` 由 `use-theme.ts` 动态生成，**不得写死 Aura 静态蓝 `--p-blue-700`**），`danger` 取 `--p-red-700` / `-400`，`success` / `warning` 取 `--p-{green,orange}-800` / `-400`（`-700` 在 `bg-elevated` 上跌破 4.5），neutral **不得复用 tone**（取「文本色 85% + 卡片色」派生）；暗色用特异性更高的 `html:root.dark` 后排块（按 0.7.0 选择器形态推断，以契约测试实测为准）；`control-border` **不桥接**，采用上游默认（控件边界 3:1），并在 [偏差处置表](../design/governance/visual-parity-deviation-register.md) 登记「控件边界深于 PrimeVue 并存观感」一条。同步 `tests/visual/caomei-token-bridge.visual.test.ts` 契约断言（light / dark 两态 × 4 个 tone + neutral）。`.github/dependabot.yml` 为 `caomei-ui` 增加 `ignore`（或改走人工升级），阻断「精确锁定仍被机器人抬版」路径（迁移方案 §3.8 / §5.6 收尾必办）。复测：`test:visual` 18 条用例（14 张截图 + 2 条桥接契约 + 2 条对比度契约）重采并逐张归因；`test:visual:parity` 34 条按新增已登记偏差重校准允许清单；`test:perf:budget:strict` 复测（预判 `keyCss` +750 B ~ +1,141 B：下限按 0.6.0 批次约 0.66 的合并压缩收益折算，上限即无合并收益时等于基础层 gzip 1,683 B → 2,824 B（+1,141 B））；`DataTable` 的两个上游修复（横向滚动容器键盘可达、全选作用域与 lazy 页内状态）在 15 条已迁移路由做定向回归；组件清单按 rc.1 复数为 **95 项**（与 0.7.0 逐项一致）。
    - **非目标**: 不改 solid 层、主色、surface、圆角、字体；不做选择器级组件覆盖（仍只走 `--caomei-*` 变量）；不接入未发布的后续预发布版本（`rc.2+` 发布后按同一纪律另立批次）；不迁移任何页面。
    - **最小验收**: `package.json` / `pnpm-lock.yaml` 中 `caomei-ui` 为 `1.0.0-rc.1` 精确锁定且无 `file:` 形态；`html:root` 桥接下 4 个 `-text` 角色 light 计算值等于对应来源（`primary` = `--p-primary-700`、`danger` = `--p-red-700`、`success` / `warning` = `--p-{green,orange}-800`）、dark 等于对应 `-400`，neutral **与 tone（`--p-text-muted-color`）分离**；**`CaomeiTag` / `CaomeiMessage` 的 soft 8% 底文字在 light / dark 实测对比度均 ≥ 4.5**（沿用 backlog #12 原验收，不以 token 计算值断言替代对比度实测）；`control-border` 计算值等于上游默认（未被桥接）；`test:visual` 18/18 且差异逐项归因（新增偏差必须登记，不得静默）；`test:visual:parity` 全绿且允许清单只按已登记偏差增长；`keyCss` ≤ 70KB 且增量已归因到基础层；`typecheck` / `lint` / `lint:css` 通过；`dependabot.yml` 的 `ignore` 规则语义经核对（精确版本与 `>=` 形态均被拦）。
    - **证据落点**: 回归记录新增窗口（升级 + 桥接 + 基线重采 + 包体复测）；迁移方案 §3.5 / §3.10 / §5.2 / §5.6 / §8.4.1；偏差处置表新增条目；权限相关产物按仓库约定不入库（`artifacts/review-gate/`）。
    - **收口（2026-11-01）**: 已完成。`caomei-ui` 精确锁定 `1.0.0-rc.1`（锁文件仅该包变更，顺带重解析的 `tslib@2.9.1` 已还原）；桥接补接 5 个 `-text`（`html:root` 浅色深档 + `html:root.dark` 取 `-400`，primary 走运行时 `--p-primary-700/-400`），`control-border` 有意不桥接（上游 3:1 默认，登记为有意偏差）；`dependabot.yml` 全量 `ignore`。验证：视觉 18/18（14 截图 + 2 桥接 + 2 新增对比度契约；基线更新 10 张、2 个未迁移页零差异）、parity 34/34（33 条按实测全量重校准，复跑残差 ≤225px；归因探针实测控件边界贡献 8,187/8,190px 与 3,416px、状态文字 0 与 251/259px）、`keyCss` 62,382 B / 70KB（较 0.7.0 批次 +1,106 B，命中预判）、soft 8% 底对比度浅 5.83–10.36 / 深 6.43–11.38（次级面亦 ≥5.4；`success` / `warning` 取 `-800` 后为 6.66 / 6.74；闭合 #12；neutral 若复用 tone 仅 4.26，已通过分离取值消除）、定向单测 70/70（含新增版本锁定守卫）。**未覆盖**：`DataTable` 两处上游修复的运行时行为回归转第七十一阶段全量 E2E。证据见回归记录 2026-11-01 窗口。

- [ ] **2. 浮层族整迁（P1；B4 前置）**
    - **执行范围**: 把 Dialog / Drawer / Popover / DropdownMenu / Menu（含 SubMenu / Item）/ ConfirmDialog / `ConfirmDeleteDialog` / `useConfirm` / `useToast` / `v-tooltip`（→ `CaomeiTooltip`）整族迁到 caomei-ui；覆盖范围分两种口径——**组件标签 64 处 / 50 文件**（Dialog 39 处 / 34 文件、ConfirmDeleteDialog 8、ConfirmDialog 6、Popover 5、Drawer 3、Menu 3），叠加服务层与指令调用（生产文件口径：`useToast` 42 文件、`useConfirm` 14 文件、`v-tooltip` 37 文件）后**并集约 100 文件**。含 `components/admin/posts/*`（distribution / translation-workflow / tts / social / audit / publish-push V2 / rewrite-compare）、`components/admin/snippets/*`、`components/admin/users/*`、`components/admin/settings/*-dialog`、`components/admin/ai/task-details-dialog`、`components/app-search` / `article-content` / `article-share` / `article-sponsor` / `commercial-link-dialog` / `confirm-delete-dialog` / `settings-api-keys`，以及 `pages/admin/friend-links`、`pages/admin/marketing`、`pages/admin/migrations/link-governance`、`pages/posts/[id]`；**6 处生产锚点**的 `.toggle(event)`（`post-editor-voice-overlay` / `app-voice-input-overlay` / `app-header` ×2 / `language-switcher` / `app-notifications`）改写为 caomei 触发器形态（另有 1 处测试桩同步调整）；按 caomei 契约复核并统一弹窗焦点（`autofocus` / focus trap，含 backlog 中「切换语言页签后焦点停在触发器」的遗留）；`CAOMEI_UI_ROUTE_SCOPES` / 在册族清单登记浮层族并扩面守卫；`tests/**` 中与浮层相关的 PrimeVue mock 与 E2E `p-*` 断言同步改写（全量基线为 25 个 vitest mock 文件 / 3 文件 11 处断言，本条只承担浮层相关子集，剩余部分随第七十一阶段收口）。
    - **非目标**: 不迁移 settings 表单控件本体与 installation 流程（B3，第七十阶段）；不做图标全量替换（第七十一阶段）；不卸载 PrimeVue；不改浮层视觉设计与信息架构。
    - **最小验收**: 全仓无 `Dialog` / `Drawer` / `Popover` / `DropdownMenu` / `Menu` / `ConfirmDialog` 的 PrimeVue 标签残留；`useConfirm` / `useToast` 仅从 `caomei-ui` 引入；浮层交互回归通过（打开 / 关闭 / 嵌套 / Esc / 焦点回填 / 滚动锁定 / teleport 下的宽度与定位）；三层视觉回归差异逐项归因；在册族零残留守卫通过；`typecheck` / `lint` / `lint:css` / 定向单测 / 相关 E2E 通过。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单；焦点契约结论（含 teleport 下 scoped 样式陷阱的核对记录）；回归记录窗口。

- [ ] **3. 内建文案 locale 接线（P1）**
    - **执行范围**: 新增 Nuxt plugin：挂载前 `registerLocale()` 注册 `zh-TW` / `ja-JP` / `ko-KR`（`zh-CN` / `en-US` 为包根预注册，不得重复注册）；以 `CaomeiConfigProvider`（`:locale` 取 `useI18n().locale`）包裹应用根或后台布局，使组件内建文案（表格空态、分页、日期面板、ConfirmDialog 等）跟随语言；先实测「静态 import 三门语言」与「按当前语言异步 import」两种形态的 `coreEntryJs` 差量（现行 331.71KB / 360KB）再择一；补接线单测（注册早于挂载、未注册语种回落 `zh-CN`）。
    - **非目标**: 不新增语种；不改 momei 自有 i18n 结构与翻译键；不替换 `primevue-i18n`（随第七十一阶段卸载）；不改写 caomei 文案内容。
    - **最小验收**: 5 个语种下后台内建文案跟随语言（抽查 DataTable 空态、Paginator、DatePicker、ConfirmDialog）；未注册语种回落 `zh-CN` 且非生产告警存在；`coreEntryJs` 未越 360KB；`typecheck` / `lint` / 定向测试通过。
    - **证据落点**: 回归记录窗口（5 语种抽查表 + `coreEntryJs` 实测）；迁移方案 §5.4。

- [ ] **4. 测试覆盖率治理第十批（P2）**
    - **执行范围**: 按未覆盖语句绝对数取 `server/services/setting.ts`（43）/ `server/services/ai/text-translation-task.ts`（34）/ `server/services/ai/post-automation.ts`（32）三模块补测；失败 / 边界断言优先，不做低价值铺量。
    - **非目标**: 不追求全仓 `90%+` 一步到位；不为覆盖率重构被测模块。
    - **最小验收**: 三模块各 `+15pp` 或达 `85%+`；全仓 Statements 以 `+0.3pp` 为容量现实目标（第六十八阶段已证单批 `+1pp` 结构上不可达），未达时记录结构性原因；`typecheck` / `lint` / 定向 `pnpm test` 通过。
    - **证据落点**: coverage 数值与模块清单写入回归记录；backlog 长期主线第 1 条基线随阶段归档同步。

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

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
