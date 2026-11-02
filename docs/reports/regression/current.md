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


