# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:coverage-batch-10:第六十九阶段条目 4 测试覆盖率治理第十批:2026-11-03 -->
## 2026-11-03 第六十九阶段条目 4 测试覆盖率治理第十批（setting / 文本翻译任务 / 文章自动化）

### 范围

按「未覆盖语句绝对数」选模，补测三个服务模块（仅测试代码，无生产改动）：

| 模块 | 补测内容 | 新增用例 |
| :--- | :--- | :--- |
| `server/services/setting.ts` | `getSetting` / `getSettings` / `resolveSetting` / `resolveSettings` 的未初始化与 DB 异常回退、env 优先与批量提前返回、运行时缓存复用；`setSettings` 的 env 锁定跳过、脱敏占位符保值、legacy alias 清理、值未变化不记审计 | 13（拆到 `setting.fallbacks.test.ts`） |
| `server/services/ai/text-translation-task.ts` | `createTranslateTask` 成功创建 / 超长 413 / 配额拒绝 / 落库失败；`continueTranslateTask` 任务不存在、非 translate、已完成、failed 显式恢复、全部块已完成、lease 抢占失败、连续 3 次失败落 failed、非 serverless 单步多块 | 12 |
| `server/services/ai/post-automation.ts` | `createTranslatePostTask` 同语言 / 缺 scope / confirmed 缺 previewTaskId / 404 / 403 / 异步创建；`processTranslatePostTask` 任务不存在、翻译异常落 failed、preview 不存在、preview 未待确认 | 10 |

### 覆盖率结果

| 指标 | 第六十八阶段基线 | 本批前（推算） | 本批终值 | 本批增量 | 阶段累计 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Statements | 81.04%（28,251/34,857） | 80.98%（28,829/35,598） | **81.17%**（28,897/35,598） | **+0.19pp**（+68 条） | +0.13pp（覆盖 +646 / 总数 +741，净 +45/35,598） |
| Branches | 70.83% | — | **70.90%**（17,824/25,138） | — | +0.07pp |
| Functions | 80.07%（6,318/7,890） | — | **79.98%**（6,482/8,104） | — | −0.09pp（新增 214 个函数稀释） |
| Lines | 81.15% | — | **81.29%**（27,840/34,244） | — | +0.15pp |

> 口径注：`28,897/35,598 = 81.1759%`，vitest 文本报告按截断显示 `81.17%`；模块表按四舍五入显示。增量列按「覆盖数 / 总数」复算，与两个展示值直接相减可能差 0.01pp（如 Lines）。本批无生产代码改动，语句总数与「本批终值」一致，故「本批前」= 终值 − 三模块闭合的 68 条 = 28,829/35,598 = 80.98%（推算值，未单独实测）；`+0.13pp` 是相对第六十八阶段收口的**阶段累计**，差额来自条目 1–3 新增的 741 条语句（覆盖 578 条，78.0%）对分母的稀释。

三模块（statements / branches / functions）：

| 模块 | 补测前（按未覆盖语句数反推） | 补测后 |
| :--- | :--- | :--- |
| `setting.ts` | 83.33%（43 条未覆盖） | **90.31% / 88.35% / 93.18%** |
| `text-translation-task.ts` | 77.03%（34 条未覆盖） | **95.27% / 85.32% / 100%** |
| `post-automation.ts` | 75.76%（32 条未覆盖） | **93.18% / 80.12% / 84.21%** |

三模块均越过「`+15pp` 或达 `85%+`」验收线。

### 全仓 `+0.3pp` 未达的结构性原因

- 本批候选池（三模块）合计 109 条未覆盖语句，理论上限约 **+0.31pp**；实际闭合 68 条（setting 18 / text 27 / post 23），即 **80.98% → 81.17%，本批自身 +0.19pp**。
- 单批 `+0.3pp` 需同时满足「候选池 ≥107 条」与「接近 100% 闭合」；本批 109 条池即使 100% 闭合也只到 +0.31pp，实际闭合 62%，余额 41 条分散在低价值防御分支（`??` 兜底 / 不可达 catch / 类型收窄分支），继续铺量的边际收益低于换更大基数的模块。
- 相对第六十八阶段收口的 **+0.13pp 是阶段累计值**（+646 covered / +741 total），低于本批增量，原因是条目 1–3 的新增代码把分母从 34,857 推到 35,598。
- 结论：后续批次应优先纳入语句基数更大的模块，或以多模块组批，不在低价值分支上铺量。

### 验证结果

- `pnpm test:coverage`：EXIT 0，全量覆盖率如上（`coverage/coverage-final.json` 可复算）。
- `pnpm test`：**578 passed files / 5,119 passed / 1 skipped**（毛新增 36 例，删除 1 例与主文件重复的用例后净增 35；批次前 5,084 → 5,119；`setting.fallbacks.test.ts` 使测试文件数 +1）。
- `pnpm typecheck` 0 error；`pnpm lint`（4 个测试文件）0 error 0 warning。
- 环境隔离回归：在 `EMAIL_PASS` / `NUXT_PUBLIC_SITE_DESCRIPTION` / `NUXT_PUBLIC_DEFAULT_COPYRIGHT` 被外部注入的 shell 下单独跑 `setting.fallbacks.test.ts`，13/13 通过（避免「本地必挂 / 空断言」）。

### 未覆盖边界

- 真实 TypeORM 行为（`repo.create({ id: undefined })`、`In()` 的 SQL 形态、事务内 alias 清理）仍由 mock 替代；本批验证的是服务层分支，不是驱动层。
- `processTranslatePostTask` 仍通过结构类型断言访问私有方法，重构私有签名时不会在编译期报错，只能在运行时暴露。
- `setting.ts` 剩余 25 条、`text-translation-task.ts` 剩余 7 条、`post-automation.ts` 剩余 9 条未覆盖语句未继续处理（验收已达标，避免低价值铺量）。

<!-- regression-window:end:coverage-batch-10:第六十九阶段条目 4 测试覆盖率治理第十批:2026-11-03 -->

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

<!-- regression-window:start:fix-social-provider-runtime-env:社交登录可用性改运行期判定:2026-11-02 -->
## 2026-11-02 修复：社交登录可用性改为运行期判定（构建期环境变量导致生产恒隐藏）

### 根因

`nuxt.config.ts` 的 `runtimeConfig.public.socialProviders` 用 `process.env.GITHUB_CLIENT_SECRET` 等**构建期**求值算布尔值。`nuxt.config` 只在构建时执行，而 Nuxt 运行期注入只认 `NUXT_*` 前缀；容器部署时 `*_CLIENT_SECRET` 在构建机为空 → 布尔被固化 `false`，登录 / 注册页即使配置了 OAuth 也永不显示按钮。

### 修复

- 新增 `server/utils/social-providers.ts`：可用性 / better-auth 配置的**单一运行期解析**（clientId 与 clientSecret 同时存在才可用，值做 `trim`）。
- 新增 `plugins/social-providers.server.ts`：按请求写入 `useState('auth-social-providers')`；页面（login / register）读取该状态，删除 `public.socialProviders`。
- `lib/auth.ts` 改用同一解析函数，保证「按钮可见 = 服务端已启用」。
- 同类问题一并修：私有 `runtimeConfig`（`authCaptchaSecretKey` / `cronSecret` / `tasksToken` / `webhookSecret`）不再在 `nuxt.config` 读构建期环境变量，改为字面量 `''` 声明；`server/utils/captcha.ts` 增加运行期 `process.env.AUTH_CAPTCHA_SECRET_KEY` 回退（其余三项本就有运行期回退）。
- 守卫：`tests/modules/runtime-config-env-injection.test.ts` 静态锁定「私有 runtimeConfig 不得用 process.env 初始化」「public 不得烘焙 socialProviders」「页面只读请求期状态」。

### 验证

- 全量 `pnpm test` **571 文件 / 5051 passed / 1 skipped**；`typecheck` 0；`eslint`（检查态）0。
- 端到端（同一构建产物、构建期无社交 env）：实例 A 不注入 → 登录页 HTML 中 GitHub/Google 命中 **0**；实例 B 仅在**启动时**注入 4 个凭据 → 命中 **3 / 2**（按钮 + payload 状态），证明运行期生效。
- 变异验证：把页面改回读 `public.socialProviders`、把 helper 判定改坏、把 `authCaptchaSecretKey` 改回构建期读值，三类改动均使对应用例转红。
- 文档：新增 [开发规范 §7.1](../../standards/development.md) 与 [环境配置 §1.3](../../guide/variables.md) 口径说明。

### 未覆盖边界

- 插件接线本身无运行时单测（Nuxt 插件在 vitest 中难以按真实 `defineNuxtPlugin` 语义加载）；由静态守卫 + 上述双实例 E2E 覆盖。如需硬覆盖，应在 E2E 层加登录页按钮断言。
- 非 `NUXT_` 前缀的 demo / test 别名（`DEMO_MODE` / `TEST_MODE` / `WINDOWS_LOCAL_DEV_MODE`）仍只在构建期生效，文档已改为推荐 `NUXT_PUBLIC_*`；彻底统一需另立切片。
- 新增任意 API 路由会触发既有多处类型化 `$fetch<T>` 的 `TS2589`（本修复因此不新增端点），属既有类型债，未在本批处理。
<!-- regression-window:end:fix-social-provider-runtime-env:社交登录可用性改运行期判定:2026-11-02 -->

<!-- regression-window:start:phase69-caomei-ui-rc1:caomei-ui 1.0.0-rc.1 升级与 token 角色接线:2026-11-01 -->
## 2026-11-01 第六十九阶段条目 1 caomei-ui 1.0.0-rc.1 升级与 token 角色接线

### 范围

- 将 `caomei-ui` 由精确锁定 `0.7.0` 升级到 `1.0.0-rc.1`（2026-10-30 发布，`dist-tags.next`），按迁移方案 §3.10 / §5.6 的升级纪律执行。
- 桥接补齐 rc.1 新增的 6 个 token 角色：`--caomei-color-{primary,success,warning,danger,neutral}-text` 与 `--caomei-color-control-border`（后者**有意不桥接**）。
- `.github/dependabot.yml` 为 `caomei-ui` 增加 `ignore`（`>=1.0.0-rc.2`），并新增 `tests/modules/caomei-ui-version-pin.test.ts` 把「人工升级」落到 CI。
- 不含：B3 表单与设置、浮层族迁移、`registerLocale` 接线（后续条目）。

### BREAKING CHANGES 与影响判定

- `CHANGELOG` 的 `1.0.0-rc.1` 段**无 BREAKING CHANGES**；`npm pack` 逐项对比确认 exports / `dependencies` / `dist/nuxt.js` / `dist/nuxt/components.js`（95 项）与 0.7.0 **逐字一致**；`engines` 由 `>=20` 升到 `>=22`（本仓 `24.x`、CI `lts/*`）。
- 但**不是零视觉差异批次**：`-text` 角色改变状态文字色，`control-border` 改变控件边框色（Button secondary / outline、Input / Select 等）。这决定了本批必须重采基线而不是「复跑即绿」。
- 基础层 `dist/styles/index.css` 9,492 B → 20,595 B（gzip -9 1,683 → 2,824 B），增量来自 `forest` / `ink` / `sakura` 三套新预设与 6 个新角色。

### 实现落点

- `styles/main.scss`：`html:root` 补 5 个 `-text`——`primary` / `danger` 取运行时 `--p-primary-700` / `--p-red-700`；`success` / `warning` 取 `var(--p-green-800)` / `var(--p-orange-800)`（该原始色板由 PrimeVue 运行期以 `@layer primevue` 内联注入，静态产物中**无定义**、只有桥接处的 `var()` 引用，故不能 grep 产物断言其不存在）；`neutral` 取「文本色 85% + 卡片色」，**不得**复用 tone（`--p-text-muted-color`），否则 tone == text、8% 底对比度仅约 4.26。
- `html:root.dark` 后排块把 4 个状态角色切到 `-400`；`neutral` 为派生值，随文本色自动适应，无需覆盖。
- `--caomei-color-control-border` 有意不桥接（上游 3:1 默认：浅 `#8a8b8d` / 深 `#67676a`）。
- `success` / `warning` 浅色取 `-800`（`#166534` / `#9a3412`）：`-700` 在 `bg-elevated` 上仅 4.34 / 4.44；该原始色板由 PrimeVue 运行期注入（不在 `.output/public` 静态 CSS 中，grep 产物无法断言其不存在）。
- 契约测试 `tests/visual/caomei-token-bridge.visual.test.ts`：新增模式感知断言、neutral「与 tone 分离」断言、`control-border` 默认值断言，以及 **5 角色 × 2 承载面 × 明暗的对比度契约（≥4.5）**。
- `tests/modules/caomei-ui-version-pin.test.ts`：声明值必须精确、lockfile 解析唯一且一致、版本必须在人工批准清单内（机器人抬版即使绕过 Dependabot 也会在 CI 失败）。

### 验证结果

- `pnpm typecheck` 0 error；`pnpm lint` 0 error（仅既有 warning）；`pnpm lint:css` 通过。
- 基线层 `pnpm test:visual` **18/18**（14 条截图 + 2 条桥接契约 + 2 条新增对比度契约）；基线更新 10 张 = 5 个已迁移路由 × 2 主题，2 个未迁移页（设置表单 / 协议弹窗）**零差异**。
  - 逐张差异（升级前基线 → 升级后基线，**阈值 0 的逐像素口径**）：comments L/D 1,720（0.133%）；external-links L/D 656（0.051%）；posts L 2,930 / D 2,941（0.226%，含状态标签文字变深）；submissions L/D 1,344（0.104%）；taxonomy-dialog L 3,840 / D 3,836（**1.129%**，浮层弹窗内控件密度最高）。线性占比 0.80–0.99（线状边框 / 文字描边，无整块位移）。
- 门禁层 `pnpm test:visual:parity` **34/34**；因 `control-border` 让控件边框整体变深，**33/34 条**的带内差异变化（仅 `admin-marketing-overview-dark` 未变；28 条超出 225px 噪声带），已按同一次运行的实测值**全量重校准**允许清单（声明值 = 实测，无余量），并消除 `admin-users-list-light` 区域 0 / 1 的几何重叠（重叠会让扣减额度重复计算）。重校准后复跑残差 ≤ 225px（占比 0.017%，运行间渲染噪声），预算 3,000px。
  - 归因探针（临时用例，验证后删除；逐项还原 token 后重截）：`admin-link-governance` 控件边界贡献 8,187 / 8,190px、状态文字 0（该页无标签入画）；`admin-ai-tasks-list` 控件边界 3,416px、状态文字 251 / 259px。
- 包体 `pnpm test:perf:budget:strict` 通过：`keyCss` **62,382 B（60.92KiB）/ 70KB**——较 0.7.0 批次（61,276 B）**+1,106 B**、较 0.6.0 批次（61,311 B）+1,071 B，落在预判 +750 ~ 1,141 B 区间；`coreEntryJs` 341,231 B / 360KB；`maxAsyncChunkJs` 55,914 B / 130KB；`prIncrementJs` 4,223 B / 20KB。
- 对比度契约（soft 8% 底；`--caomei-color-bg` / `--caomei-color-bg-elevated`）：

  | 角色 | light（内容面 / 次级面） | dark（内容面 / 次级面） |
  | :--- | :--- | :--- |
  | primary | 8.72 / 8.08 | 8.21 / 7.44 |
  | success | 6.66 / 6.17 | 9.75 / 8.85 |
  | warning | 6.74 / 6.24 | 7.68 / 6.99 |
  | danger | 5.83 / 5.40 | 6.43 / 5.88 |
  | neutral | 10.36 / 9.60 | 11.38 / 10.34 |

  全部 ≥ 4.5，闭合 backlog 短期候选 #12（原 2.12 / 2.59 / 3.39；neutral 若复用 tone 仅约 4.26，已通过「与 tone 分离」的派生取值消除）。矩阵按 tag / badge 的 8% soft 底建模，`CaomeiMessage` 默认 4% 混合更严。
- 定向单测 **70/70**（`caomei-ui-coexistence` + 路由迁移守卫 + 过渡组件守卫 + 新增版本锁定守卫）。

### 未覆盖边界

- 未跑全量 `pnpm test` 与 E2E：本批只改 CSS、依赖版本与契约 / 守卫测试，全量在阶段收口统一跑。
- **`DataTable` 两处上游修复（横向滚动键盘可达、全选作用域与 `lazy` 页内状态）未做运行时行为回归**：现有 15 条已迁移路由的排序 / 分页 / 选择行为未变（视觉与 parity 均无结构性差异），但键盘可达性与全选语义缺一次显式 E2E；已转第七十一阶段的全量 E2E 收口，登记为未覆盖边界。
- `coreEntryJs`（341,231 B）相对 0.3.0 基线口径（337,008 B）+4,223 B **未逐项归因**；`prIncrementJs` 4,223 B 即该差值的门禁口径。已核对 rc.1 的组件 JS 仅 `data-table` +883 B（路由 chunk），与入口增量无直接关系。
- 三套新设计预设（`forest` / `ink` / `sakura`）无条件进入基础层（约 +1.1KB gzip 的主体），**尚未登记**到上游反馈清单，列为候选。
<!-- regression-window:end:phase69-caomei-ui-rc1:caomei-ui 1.0.0-rc.1 升级与 token 角色接线:2026-11-01 -->

<!-- regression-window:start:maintenance-caomei-ui-070:caomei-ui 0.7.0 升级与既有 parity 漂移复核:2026-10-24 -->
## 2026-10-24 维护批次 caomei-ui 0.7.0 升级与既有 parity 漂移复核

### 范围

- 将 `caomei-ui` 由精确锁定 `0.6.0` 升级到 `0.7.0`（2026-10-20 发布），按迁移方案 §5.6「在飞依赖每次升版须读 `BREAKING CHANGES` + 复测」执行。
- 不含 locale 接线（`CaomeiConfigProvider` / `registerLocale`）：那是功能变更，登记为第六十九阶段切片。

### BREAKING CHANGES 与影响

- 唯一 BREAKING 为 **locale 内建语言改为「预注册 + 按需子路径」**：包根只保留 `zh-CN` / `en-US`，其余语种须 `caomei-ui/locale/<code>` + `registerLocale()`，未注册回落 `zh-CN`。
- 影响判定：momei 当前**未调用** `provideLocale` / `CaomeiConfigProvider`，组件内建文案本就回落 `zh-CN` → 本次升级**不产生行为变化**；接线时须注册在用的 `zh-TW` / `ja-JP` / `ko-KR`。
- 其余面：exports 仅新增 locale 子路径；运行时依赖版本（`reka-ui@2.10.4` / `vue-table@9.2.4` / `@internationalized/date@3.12.4` / `@vavt/cm-extension@2.0.0`）与既有解析一致；新增 `echarts` / `vue-echarts` 为 optional peer；基础层 `dist/styles/index.css` 与 0.6.0 **sha256 相同**（9,492 B）；已消费的 13 个组件族（button / select / auto-complete / data-table / tag / badge / switch / checkbox / textarea / input / input-group / avatar / tabs）运行时 JS/CSS 零变化（仅 `.d.ts` 差异；`FileUpload` 为 PrimeVue 侧用法，caomei 侧零用量）；自动导入组件 81 → **95** 项（+Alert / Chart / Tooltip 族 / Menu 族 / Breadcrumb 族 / Row / Col）。

### 验证结果

- `pnpm typecheck` 0 error；`pnpm lint` 0 error（8 条 warning 均为既有）；`pnpm lint:css` 通过。
- 定向单测：`tests/modules/ui-library-route-migration-guard.test.ts` + `components/admin/admin-taxonomy-page.test.ts` + `pages/admin/posts/index.test.ts` → **87 passed**。
- 全量单测：`pnpm test` → **567 files passed / 1 skipped（568）**、**5029 passed / 1 skipped（5030）**，exit 0（依赖升级后补跑，替代仅定向的兜底）。
- 基线层视觉回归：`pnpm test:visual` **16/16**（零差异）。
- 门禁层 parity：`pnpm test:visual:parity` **33/34**；失败项 `admin-marketing-form-dialog-light`（实测 128,174px / 9.89%，允许清单扣减后未归因 114,174px / 8.81%）。
- 包体：`pnpm test:perf:budget:strict` 通过 —— `keyCss` **59.84KB / 70KB**（未反弹，与 0.6.0 实测 61,311 B 同量级）、`coreEntryJs` 331.71KB / 360KB、`maxAsyncChunkJs` 54.59KB / 130KB、`prIncrementJs` 2.60KB / 20KB。
- 锁文件：仅 `caomei-ui` 一条包记录变更（`pnpm install --frozen-lockfile` 通过）；安装时顺带被重解析的 `legacy-javascript 0.0.3→0.0.4`（lighthouse 传递依赖，与本次无关）已手工还原，避免无关 churn。

### 既有 parity 漂移复核（非本批引入）

- 现象：light 参考态中弹窗宽 680px（380–1060），当前渲染 543px（448–991），遮罩与其余元素一致，差异集中在弹窗左右边缘与表单文本换行。
- 证伪：临时回装 `caomei-ui@0.6.0` 复跑同一用例，得到**完全相同**的 `128,174px / 9.89%`（扣减后 `114,174px / 8.81%`）与同一组超差区域 → 与 0.7.0 无关，属参考态采集（2026-10-16）后发生的漂移。两次复跑的报告已本地留档对照（`artifacts/review-gate/2026-10-24-caomei-ui-070-parity-{060,070}-marketing-dialog-light.json`；`artifacts/` 按仓库约定不入库）：两者 `diffPixels=128174` / `remaining=114174` 完全一致。
- 处置：不在本批「修绿」，避免用重采参考态掩盖未归因差异；登记 backlog 长期主线 #10 待跟踪（重采参考态 + 逐项归因）。

### 未覆盖边界 / 观察项

- 未重跑 `test:coverage`（依赖升级不改变覆盖口径；覆盖率基线沿用 2026-10-22 记录）。
- E2E 未重跑（本批无业务代码改动；`pnpm build` 成功）。
- `Message` / `ButtonGroup` / `RichTextEditor` 的样式哈希变化属库侧重建噪声，momei 零消费，未纳入验证面。
<!-- regression-window:end:maintenance-caomei-ui-070:caomei-ui 0.7.0 升级与既有 parity 漂移复核:2026-10-24 -->



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

<!-- regression-window:start:phase70-item-2a:第七十阶段条目 2a 管理端设置主体迁移:2026-11-03 -->
## 2026-11-03 第七十阶段条目 2a 管理端设置主体迁移（`/admin/settings`）

### 范围

`/admin/settings` 整路由迁移到 caomei-ui：设置页 + 23 个设置组件 + 共享保存条 `admin-floating-actions`（共 25 个修改文件），另新增 3 个字段适配层。按 HEAD 口径合计 **341 处** PrimeVue（27 个 `ownedFiles` 310 处 + 页面 31 处）。本批不含主题工作台（2b）与 `/admin/notifications`（2c）。

### 组件映射与处置

| PrimeVue | caomei | 说明 / 差异 |
| :--- | :--- | :--- |
| `InputText` / `Password` / `Textarea` | `CaomeiInput` / `CaomeiPassword` / `CaomeiTextarea` | 经 3 个薄适配层（`setting-{input,password,textarea}.vue`）做 `null → ''` 归一；删除 `fluid`、`:toggle-mask`；`rows="N"` → `:rows="N"` |
| `InputNumber` | `CaomeiInputNumber` | 删除 `fluid`；字符串型值经 `Number()` 归一 |
| `Select` / `MultiSelect` | `CaomeiSelect` / `CaomeiMultiSelect` | 删除 `fluid` / `append-to`；**字符串数组选项映射为 `{ label, value }`**（5 处） |
| `ToggleSwitch` | `CaomeiSwitch` | 行为一致（布尔 v-model） |
| `Divider` / `Card` / `Message` | `CaomeiDivider` / `CaomeiCard` / `CaomeiMessage` | `Card` 的 `#content` → 默认插槽；`Message` 的 `severity` → `tone`，`info` → `primary` |
| `Tag` | `CaomeiTag` | `severity` → `tone`（`warn`→`warning`、`secondary` → `neutral`、`info` → `primary`），可见文案改默认插槽 |
| `Button` | `CaomeiButton` | 可见文案写默认插槽、`label` 仅作可访问名；图标改 `#icon` + `@lucide/vue`；`outlined/text/severity` → `variant` / `tone` |
| `DataTable` + `Column` | `CaomeiDataTable` + `columns` prop + `#cell-*` | 无 `#header` 插槽，表头内容移到表格上方；`@page` 由 0 基改 1 基 |
| `Tabs` 族 | `CaomeiTabs` / `CaomeiTabList` / `CaomeiTabTrigger` / `CaomeiTabContent` | `v-model:value` → `v-model`；`TabPanels` 由 `TabContent` 直接承接 |
| `Accordion` 族 | `CaomeiAccordion` + `CaomeiAccordionItem` | `title` + 默认插槽；`default-value` 保持默认展开 |
| `Image` | `CaomeiImage` | `width="48"` → `style="width: 48px"`（无 width prop） |
| `AppUploader`（V1） | `AppUploaderV2` | 路由已登记，按事实源渲染 caomei 版（字段行为共用） |

### 路由守卫与文件

- `lib/ui-library.ts` 新增 `/admin/settings` scope：27 个 `ownedFiles` + 路由级在册族增量（`Password` / `InputNumber` / `Textarea` / `Card` / `Message` / `Divider` / `Image` / `MultiSelect` / `Accordion` 族 / `Tabs` 族）。
- `/admin/settings/theme` 登记为 `primeVueSubRoutes` 例外（条目 2b 前仍为 PrimeVue）。
- 迁移后 2a 文件集 PrimeVue 开口标签 **0 处**；在册族与过渡组件守卫 **63/63**。

### 关键结论（实施期发现）

1. **Nuxt 组件名带目录前缀**：新增的 `components/admin/settings/setting-*.vue` 自动导入名为 `AdminSettingsSettingInput`，模板里写 `<SettingInput>` 会**静默解析为未知元素**（不报错、不渲染）。首轮视觉采集因此拍到了缺控件的页面（设置表单差异 62,534px），修正为显式 import 后重采（64,028px）。已写入迁移方案 §6.2 执行提示 5。
2. **可空字段与新库类型不兼容**：caomei 字段组件 `modelValue` 只收 `string | undefined`，设置项通用类型含 `null`；适配层只做边界归一，避免 200+ 处重复回写。
3. **字符串选项数组**：PrimeVue `Select` 接受 `string[]`，caomei 只接受对象数组；5 处改为 `{ label, value }` 并把 `option-label` / `option-value` 显式声明。
4. 迁移后**设置内容区**已无 PrimeVue 控件（结构抽查：15 inputs / 7 switches / 0 个 `.p-inputtext` / 0 个 `.p-button`）；页面级仍会出现 `.p-button`，来源于全局布局 `AppHeader`（不在本路由 scope 内）。

### 审核修复（Review Gate Round 1 的 warning / suggest）

| 编号 | 问题 | 处置 |
| :--- | :--- | :--- |
| W1 | `general-settings.vue` 的两处 `::rows` 拼写使 `rows` prop 丢失（回落默认值） | 改回 `:rows` |
| W2 | `external-feed-sources-editor.vue` 用 `:input-id`（PrimeVue 契约），caomei 只认 `id`，7 个 label 关联断链 | 统一改 `:id` |
| W3 | `show-buttons` 残留 11 处（caomei 为 `controls`）；且未声明时 caomei 默认显示步进按钮，与迁移前不一致 | 删除 `show-buttons`；按 HEAD 版本比对，对原本无步进按钮的 21 个 `InputNumber` 显式 `:controls="false"` |
| W4 | `setting-audit-log-list.vue` 的 `:deep(.p-datatable-tbody …)` 已成死选择器 | 改为 `:deep(.caomei-data-table__td)` |
| W5 | 主题工作台子路由存在「caomei 保存条 + PrimeVue 页面体」混用 | 在 `lib/ui-library.ts` 的子路由例外理由中显式登记；该提前迁移给 `admin-settings-theme` 带来 parity 实测 **1,492px / 0.115%**（light）与 **1,457px / 0.112%**（dark）的未归因增量（低于 admin 档 3,000px 阈值而 PASS），待 2b 整页迁移时归因或吸收 |
| W6 | 协议操作按钮的 `:title` 提示（限制原因）在迁移后丢失 | 5 个图标按钮补回 `:title` |
| S1 | 3 个适配层无直接单测 | 新增 `setting-field-adapters.test.ts`（6 例：null/数字归一、string 回写、属性透传） |
| S2/S3 | 路由登记无防静默移除钉子、`lib/ui-library.ts` 子路由注释过期 | `lib/ui-library.test.ts` 补 `/admin/settings` 断言；注释补第三条子路由 |
| S4 | 部分测试 stub 与新契约漂移 | `CaomeiTag` 改默认插槽；`CaomeiAccordionItem` 补 `title` 并移除已不存在的 Header/Content stub；`general-settings` 的 `AppUploader` stub 改 `AppUploaderV2` |
| S5 | `CaomeiMultiSelect` 上的 `display="chip"` 无对应 prop | 删除（3 处） |
| S6 | 新增注释含规划编号 | 保留（本仓库既有同型写法，后续统一），不阻塞 |
| S7 | `agreements-settings.vue` 已 776 行（限 800） | 登记为 2b / 收口前的拆分候选，不在本批处置 |

修复后复跑：设置组件 22 files / 55 tests、页面 8/8、守卫双测试 63/63、`lib/ui-library.test.ts` 13/13（合计 **139/139**）、`typecheck` 0 error、`eslint`（设置目录 / 守卫 / 测试）0 error。

### 验证结果

- `pnpm test`：**582 files passed / 1 skipped（583）**、**5,153 passed / 1 skipped（5,154）**，EXIT 0（新增适配层单测 1 个文件 / 6 例）。
- `pnpm typecheck` 0 error；`pnpm lint`（设置目录）0 error 0 warning。
- `pnpm test:visual`：**18/18**；4 张基线按迁移后观感重采（`admin-settings-form` 浅/深 + `admin-agreements-dialog` 浅/深）。
- `pnpm test:visual:parity`：**55/55**；`admin-settings-form-light` 64,028px / 4.940%、`admin-settings-form-dark` 91,926px / 7.093%，按区域登记允许清单后未归因 **0px**（light 2 区域 / dark 4 区域）。
- 页面单测 `tests/pages/admin/settings/{index,theme}.test.ts` 8/8；设置组件单测 **22 files / 55 tests**（含适配层 6 例；stub 与选择器改到 caomei 契约，未放宽断言）。

### 未覆盖边界

- 主题工作台（`/admin/settings/theme`）与 `/admin/notifications` 仍未迁移，分别留条目 2b / 2c。
- `Message` 的 `variant` 维度未使用（仅 `tone`）；`Tag` 的 `selectable` / `closable` 在设置页零用量。
- 适配层只覆盖 `Input` / `Password` / `Textarea`；`Select` 的回写仍可能给出 `number`（已在使用处按字符串处理）。
- 截图仅覆盖「常规」标签页与协议弹窗；其余标签页依赖单测 + 结构抽查，未逐页截图。
- 全量 parity 首次复跑时 `user-settings-dark` 出现 `page.goto` 60s 超时；单条复跑 2/2、全量复跑 **55/55**（9.4 分钟）通过，判定为运行期资源竞争导致的偶发（与本批改动无关联），保留观察。
- **低于门禁阈值的暗色整列背景变化**：深色设置内容列背景由 `rgb(2,6,23)` 变为 `rgb(12,16,32)`（Δ≤10/通道，约 46 万像素），未达到 pixelmatch 阈值（`0.2` → YIQ 平方距离 ≈1,409，实测 ≈60），因此不进入未归因统计。该变化由 `CaomeiCard` / `CaomeiTabs` 的容器 token 引起，属本批有意观感差异，登记为已知项（若后续 token 继续漂移只有超过阈值才会报警）。
- 逐文件「文件 → 改动点 → 依据指针」清单在条目 2 收口（2a/2b/2c 合并）时按迁移方案 §8.5 统一产出；本窗口已给出组件族映射表与文件集口径。
<!-- regression-window:end:phase70-item-2a:第七十阶段条目 2a 管理端设置主体迁移:2026-11-03 -->

<!-- regression-window:start:phase70-item-2b:第七十阶段条目 2b 主题工作台迁移:2026-11-04 -->
## 2026-11-04 第七十阶段条目 2b 主题工作台迁移（`/admin/settings/theme`）

### 范围

主题工作台整路由迁移到 caomei-ui：`pages/admin/settings/theme.vue` + 5 个 `theme-*` 组件（42 处 PrimeVue）。同批把 `/admin/settings` 的子路由例外移除，改为「已迁移子路由」纳入零残留扫描面。

### 组件映射与处置

| PrimeVue | caomei | 说明 / 差异 |
| :--- | :--- | :--- |
| `Panel` | `CaomeiCard` | `:header` → `:title`；内容走默认插槽（`#header` / `#title` / `#extra` / `#footer` 另有专用插槽） |
| `Tabs` 族 | `CaomeiTabs` + `CaomeiTabList` + `CaomeiTabTrigger` + `CaomeiTabContent` | 静态 `value="0"` 改 `default-value="0"`；底部无 `TabPanels` 容器 |
| `Select` | `CaomeiSelect` | `@change` → `@update:model-value`；选项为对象数组，契约一致 |
| `SelectButton` | `CaomeiSelectButton` | 删 `allow-empty`；`modelValue` 不收 `null`，用 computed 在 `null ↔ undefined` 之间映射 |
| `ColorPicker` | `CaomeiColorPicker` | `format="hex"` 只决定序列化；**`modelValue` 必须是带 `#` 的 CSS 颜色串**（PrimeVue 旧契约是裸十六进制，已在 `use-theme-color-models` 修正并更新单测） |
| `DataView` | `CaomeiDataView` | `#grid="{ items }"` 与 `#empty` 契约一致；`layout="grid"` |
| `InputText` | `SettingInput`（可空字段）/ `CaomeiInput` | 主题设置项类型为 `string \| null`，沿用 2a 的适配层；`saveForm` 等非空字段直接用 `CaomeiInput` |
| `Textarea` | `CaomeiTextarea` | `rows="3"` → `:rows="3"` |
| `ToggleSwitch` / `Divider` | `CaomeiSwitch` / `CaomeiDivider` | 行为一致 |
| `Tag` | `CaomeiTag` | `severity` → `tone`，文案改默认插槽 |
| `Button` | `CaomeiButton` | 文案入默认插槽、图标走 `#icon` + lucide；`outlined` → `variant="secondary"`、`text` → `variant="ghost"` |
| `Message` | `CaomeiMessage` | `severity="info"` → `tone="primary"` |

**结构差异**：`CaomeiCard` 没有 `#subtitle` 插槽（只有 `title` / `subtitle` prop），且传入 `#header` 会整段替换默认头（含 `#title`）——主题画廊卡片因此把「主题名 + 当前/系统标签」与描述一并放进默认插槽，避免标题被吞掉；描述容器保留原生 `title` 的 tooltip 语义。

### 守卫机制变更

- `CaomeiUiRouteScope` 新增 `migratedSubRoutes`：已随本路由迁移的子路由页面**纳入零残留扫描面**（同 `ownedFiles`），与 `primeVueSubRoutes`（未迁移例外）二选一显式登记。
- `/admin/settings` 移除 theme 子路由例外，`theme.vue` 改登记到 `migratedSubRoutes`；`ownedFiles` 追加 5 个 `theme-*` 组件，`inScopeComponents` 追加 `Panel` / `ColorPicker` / `SelectButton` / `DataView`。
- 守卫测试同步：子路由「必须显式登记」的判定改为 `primeVueSubRoutes ∪ migratedSubRoutes`，扫描面合并两类；守卫三件套 **76/76** 通过。

### 关键结论（实施期发现）

1. **`CaomeiCard` 无 `#subtitle` 插槽**：画廊卡片的描述文本改走默认插槽，视觉位置不变；`title` 属性（原生 tooltip）保留在描述容器上。
2. **`CaomeiSelectButton` 的 `modelValue` 不收 `null`**：`themeBackgroundType` 在设置模型里是 `... | null`，用 `computed` 做 `null ↔ undefined` 映射，避免类型逃逸。
3. **`ClientOnly` 内容挂载晚于首屏**：主题配置的标签页在 `ClientOnly` 内，本地实测约 4–5 秒后才能查到 4 个色彩字段；视觉/parity 的就绪等待（networkidle + 标题）已足够，但结构抽查需留出余量。
4. 迁移后主题路由内 PrimeVue 开口标签 **0 处**，运行时 `.p-inputtext` / `.p-button` / `.p-panel` / `.p-tab*` / `.p-colorpicker` / `.p-selectbutton` 均为 0；渲染 3 个 `CaomeiCard`、4 个色彩字段。

### 审核修复（Review Gate Round 1 的 blocker / warning）

| 编号 | 问题 | 处置 |
| :--- | :--- | :--- |
| B1 | 预览按钮引用了 5 个语种都不存在的 `accent_action`，文案回落为 key 字面量并被 parity 当作「尺寸差异」吸收 | 补齐 5 语种文案，`pnpm lint:i18n` 0 error；重跑 parity |
| B2 | 画廊 `CaomeiCard` 同时传 `#header` + `#title`，而 `#header` 会替换默认头 → 主题名与状态标签永不渲染（且无任何门禁覆盖） | 标题行移入默认插槽；新增 `theme-gallery-dialog.test.ts`（断言主题名 + 2 个标签 + 按钮数）与打开态基线 2 张 |
| B3 | 取色器模型沿用 PrimeVue 的裸十六进制契约，caomei 解析失败回退红色 → 9 个取色器颜色全错 | `use-theme-color-models` getter 归一为 `#rrggbb`，更新单测；重跑 parity 并重新归因右侧面板区域 |
| B4 | `:deep(.p-panel)` / `.p-tabs` / `.p-tab` / `.p-card-*` 与 `i` 选择器成死规则：双层边框、页签不等分、卡片页脚不贴底、图标尺寸丢失 | 逐条改写为 `.caomei-tabs__*` / `.caomei-card__*` / `svg`，外层容器不再自绘边框；图标尺寸改 `:size`（占位 48 / 空态 64） |
| W1 | `unmountOnHide` 默认 `true`，与迁移前「三个面板全挂载」不一致 | 显式 `:unmount-on-hide="false"` |
| W2 | 主题页单测 stub 仍指向 PrimeVue 组件（死配置），且未覆盖标签页 / 画廊 | stub 全部改 caomei 契约；画廊交互由新增组件测试与基线覆盖 |
| W4 | `migratedSubRoutes` 的「互斥 / 位于 `pages/<prefix>/` / 存在性」只写在注释里 | 守卫测试补 2 条断言（互斥 + 前缀目录；存在性独立报错） |
| W7 | `lib/ui-library.ts` 仍写「主题子路由为例外」「子路由无守卫兜底」 | 注释同步为当前机制（`migratedSubRoutes` + 既有守卫） |

Round 2 追加修复（复审 Reject 两项）：

| 编号 | 问题 | 处置 |
| :--- | :--- | :--- |
| B5 | 新增画廊测试触发 16 条 ESLint 缩进告警，`--max-warnings 0` 失败 | `eslint --fix` 后 0 warning；回归记录的 lint 证据口径同步更正 |
| B6 | `.theme-config-card` 的 `display:flex` 被库内同特异性规则覆盖，页脚 `margin-top:auto` 失效（内容不等长时页脚悬空） | 选择器提为 `.theme-config-card.theme-config-card`；画廊 mock 的第二种卡片改用长描述制造高度差，并运行时实测两张卡 `footerTop` 一致（520）、贴底 1px，重采 2 张画廊基线 |
| W2 补充 | 页签行为无可执行覆盖 | 新增 `theme-config-section.test.ts`，断言 3 个页签、默认 `default-value=0`、`unmount-on-hide=false`、8 个色彩字段 |

未采纳：W5（换行符整文件改写，仓库无 `.gitattributes` 统一口径，保留）、W6（流程编号注释，与既有写法一致，后续统一）、W8（视觉覆盖已通过新增 4 张基线补强）、W9（提交规模属单条 todo 原子项，在提交说明记录拆分依据）。

### 验证结果

- `pnpm test`：**584 files passed / 1 skipped（585）**、**5,157 passed / 1 skipped（5,158）**，EXIT 0。
- `pnpm typecheck` 0 error；`pnpm lint`（theme 目录 / 页面）0 error 0 warning。
- `pnpm test:visual`：**22/22**（新增主题工作台与主题画廊弹窗各 2 张基线）；首轮曾出现一次未命名用例失败，复跑 22/22 通过（运行期资源竞争，保留观察）。
- `pnpm test:visual:parity`：**55/55**；`admin-settings-theme` 从待迁移层移入已迁移层，参考态保持迁移前 HEAD 采集；修正取色器颜色格式、页签等分与卡片外壳后，light **42,263px / 3.261%**、dark **50,759px / 3.917%**，各 6 个区域按实测登记后未归因 **0px**。
- 页面单测 `tests/pages/admin/settings/theme.test.ts`（stub 全部改到 caomei 契约）、`theme-save-dialog.test.ts`、新增 `theme-gallery-dialog.test.ts`（锁定「主题名 + 当前/系统标签」不被 header 槽吞掉）与 `theme-config-section.test.ts`（3 个页签、默认页签、`unmount-on-hide=false`、8 个色彩字段）通过。

### 未覆盖边界

- 主题画廊的三种状态（当前 / 系统 / 自定义删除）由新增的打开态基线（固定 mock 两张卡）与组件测试覆盖；删除 / 应用后的二次状态未逐状态截图。
- `CaomeiDataView` 的 `grid` 布局在窄屏下的列数未单独验证。
- 2a 阶段登记的主题子路由 parity 增量（1,492 / 1,457px）已被 2b 的整页差异吸收，不再单列。
- 色彩字段的 `ColorPicker` 弹出面板交互（选择色板）未做 E2E；视觉只覆盖关闭态，颜色正确性由 `use-theme-color-models` 单测与截图观感共同守线。
<!-- regression-window:end:phase70-item-2b:第七十阶段条目 2b 主题工作台迁移:2026-11-04 -->
