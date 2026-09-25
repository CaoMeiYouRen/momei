# 墨梅博客 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 深度归档索引

- 第一至第十阶段全文: [archive/todo-archive-phases-01-10.md](./archive/todo-archive-phases-01-10.md)
- 第十一至第二十一阶段全文: [archive/todo-archive-phases-11-21.md](./archive/todo-archive-phases-11-21.md)
- 第二十二至第二十四阶段全文: [archive/todo-archive-phases-22-24.md](./archive/todo-archive-phases-22-24.md)
- 第二十五至第四十一阶段全文: [archive/todo-archive-phases-25-31.md](./archive/todo-archive-phases-25-31.md)、[archive/todo-archive-phases-32-41.md](./archive/todo-archive-phases-32-41.md)
- 第四十二至第四十五阶段全文: [archive/todo-archive-phases-42-45.md](./archive/todo-archive-phases-42-45.md)
- 第四十六至第四十九阶段全文: [archive/todo-archive-phases-46-49.md](./archive/todo-archive-phases-46-49.md)
- 第五十至第五十一阶段全文: [archive/todo-archive-phases-50-51.md](./archive/todo-archive-phases-50-51.md)
- 第五十二至第五十七阶段全文: [archive/todo-archive-phases-52-57.md](./archive/todo-archive-phases-52-57.md)
- 第五十八至第六十阶段全文: [archive/todo-archive-phases-58-60.md](./archive/todo-archive-phases-58-60.md)
- 第六十一至第六十三阶段全文: [archive/todo-archive-phases-61-63.md](./archive/todo-archive-phases-61-63.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档当前保留第六十四至第六十七阶段的近线归档块。
- 第一至第六十三阶段的完整待办归档正文已迁入区间分片。
- 后续若近线窗口再次膨胀，继续按 archive/index.md 的规则把更早阶段整体迁出。

---

## 第六十七阶段：PrimeVue → caomei-ui 迁移（一）——接入基座、视觉回归与试点（已审计归档）

> 归档说明: 第六十七阶段「1 个迁移主线 + 3 个使能主线」已于 2026-09-25 完成四条主线交付与阶段收口。接入基座完成 `caomei-ui@0.2.0` 重锚（`theme.css` 注入点唯一、`keyCss` 配额回落 70KB 并刷新基线）；三层视觉验证回归基座落地为独立截图工程（6 张基线 + 假阳性/假阴性双向验证 + CI `visual` job，初期 `continue-on-error`）；全局 token 语义层桥接以 **unlayered `html:root`** 落地并配级联契约守卫；B2 试点页 `/admin/comments` 完成整路由切换（在册组件族零残留守卫、三层回归、视觉差异逐项归因）。阶段内一并产出「共享壳过渡组件替换清单」与「上游 caomei-ui 反馈问题清单」。E2E `auth-session-governance` 的 firefox 导航超时已用 HEAD 构建对照复现，判定为既有 flaky 而非本阶段回归。

> **ROI 评估**: 接入基座与消费路径 `1.67`；视觉验证回归基座 `1.80`；全局 token 语义层 `1.13`（使能项例外）；B2 试点页 `1.29`。

- [x] **1. 接入基座与消费路径（P1）**
    - **1a. 基座落地（已完成 2026-09-20）**: 以 `caomei-ui@0.1.0` 引入 npm 依赖、接入 `caomei-ui/nuxt` 与 `@primevue/nuxt-module` 并存、同名自动导入隔离（`modules/caomei-ui-coexistence.ts`）、白名单载体（`lib/ui-library.ts`）、迁移基线重取脚本（`governance:count:primevue-usage`）。**已验证**：两套库同构建共存、白名单载体可单点读出、依赖声明完整、§3.4 基线重新取数已落盘。提交 `90344418`，验证见 [回归记录](../reports/regression/current.md) M1 节。
    - **1b. 重锚到 `caomei-ui@0.2.0`（已完成 2026-09-24，本项收口条件）**
        - **执行范围**: 依赖 `0.1.0 → 0.2.0`（迁移期锁定精确版本）；确认 `injectStyles` 注入物为**基础层 `caomei-ui/theme.css`**（0.2.0 起取代 `styles.css`；组件样式随模块自带、由打包器按需 tree-shaking）且**基础层注入点唯一**（模块 / resolver / 显式 import 三选一）；确认 CSS `@layer` 顺序不变；确认模块自动导入的 `useLocale` / `provideLocale` 不变（`CaomeiConfigProvider` 包裹与 `primevue-i18n` 插件替换仍延后到启用 caomei-ui 组件的批次）；复测 `pnpm test:perf:budget` 的 `keyCss` 并按迁移方案 §8.4.1 回落并存期配额；复核 §3.4 基线未漂移（如需可重取）；`@lucide/vue` 是否需在 momei 侧显式声明仍按试点页实际引用决定。
        - **非目标**: 不迁移任何页面组件；不移除 PrimeVue；不改动业务逻辑；不引入 Tailwind。
        - **最小验收**: `theme.css` 在产物中仅注入一次；`keyCss` 复测后按迁移方案 §8.4.1 **回落配额（85KB → 70KB）并刷新基线**；`pnpm typecheck` + `pnpm lint` + `pnpm build` 通过；`pnpm test:perf:budget` 不越线。
        - **已验证**: `theme.css` 在 `nuxt.options.css` 中恰好 1 次（`styles.css` 0 次）、`caomei-ui` 模块无重复安装；`keyCss` 75,110 → **60,684** 字节（gzip），并存期配额回落 70KB 并刷新基线；`@layer` 顺序与自动导入隔离均不变；§3.4 基线未漂移（59 类 / 1515 处）；typecheck / lint / test（527 文件 / 4473 用例）/ build / test:perf:budget 全部通过。验证见 [回归记录](../reports/regression/current.md) M1b 节。
        - **证据落点**: 复测数值与配额回落写入 [回归记录](../reports/regression/current.md)；决策回链迁移方案 §3.6 / §8.4.1。

- [x] **2. 视觉验证回归基座（P1）**
    - **执行范围**: 建立三层回归——① 单元层（Vitest + Vue Test Utils 组件渲染 / 关键 DOM、类名、ARIA 断言）；② E2E 功能层（复用既有 Playwright 17 个 spec，确认迁移前全绿）；③ 截图识别层（新增 Playwright `toHaveScreenshot` 视觉回归工程，**独立 project / config**，不并入既有 `test:e2e` 的 `testMatch`）。完成迁移前基线采集（列表页 / 表单（设置）页 / 浮层各 1 页，覆盖浅色 / 深色主题与目标 viewport）。固化环境可复现配置（浏览器渠道与版本、viewport、locale、时区、`animations: 'disabled'`、`caret: 'hide'`）、阈值策略与 CI 接入；动态区域以 `mask` 显式遮蔽；声明 CI 增量耗时预算与基线快照体积 / 保留策略。**基线采集须在接入基座重锚到 `0.2.0` 之后进行**（避免建立在 0.1.0 的单体样式形态上，见迁移方案 §3.6）。
    - **非目标**: 不做全站截图覆盖；不与 caomei-ui 做跨仓触发；不改变既有 `pnpm test:e2e` / `test:e2e:critical` / `test:e2e:review-gate` 的断言语义与证据产出；不以放宽阈值代替差异归因。
    - **最小验收**: 三层入口各自可独立运行且可复现；迁移前基线快照随仓库提交；故意改动一处样式可被截图层稳定检出（假阳性与假阴性各验证一次）；既有 E2E / review-gate 入口行为不变；CI 增量为可解释数值；`pnpm typecheck` + `pnpm lint` 通过；**E2E 基线的已知 flaky 集已显式登记**（当前为 `auth-session-governance`，判定依据见回归记录 M1 节）并给出 M1 前后 flaky 率对比，避免把既有波动当作迁移回归。
    - **已验证（2026-09-24）**: 截图识别层落地为独立工程 `playwright.visual.config.ts` + `tests/visual/`（入口 `pnpm test:visual` / `test:visual:update`，复用 e2e 构建与浏览器前置），不触碰既有 e2e `testMatch`；采集列表页（`/admin/posts`）/ 表单页（`/admin/settings`）/ 浮层（协议创建对话框）× 浅色 / 深色共 **6 张基线快照**（随仓库提交，合计约 664KB）；环境固定 chromium / 1440×900 / DSF 1 / `zh-CN` / `Asia/Shanghai` / 关闭动画 / 隐藏光标，动态区域以 `[data-visual-mask]` 遮蔽；阈值 `maxDiffPixels 200` + 单像素容差 0.2（绝对值口径，不以比例兜底）。**假阳性**：无变更连续多次全绿；**假阴性**：故意改 `--p-surface-card` 后 3 项浅色用例稳定失败（深色因 `.dark` 覆盖未受影响，符合预期）。E2E 功能层：`pnpm test:e2e:critical` 两阶段全绿，`auth-session-governance` chromium `--repeat-each=3` = 18/18 通过（M2 采样 0 失败）。单元层：既有设置页测试保留，新增浮层组件结构契约测试（`components/admin/settings/agreement-edit-dialog.test.ts`）。CI 接入为 `test.yml` 的 `visual` job（**初期 `continue-on-error`**，待 CI 环境确认基线后转阻断）。详见 [回归记录](../reports/regression/current.md) M2 节。
    - **证据落点**: 采集 / 比对命令、环境元数据、基线快照、阈值策略、CI 耗时与基线体积数据落盘；CI 接入写入 `.github/workflows/`。

- [x] **3. 全局 token 语义层桥接（P1）**
    - **执行范围**: 按迁移方案 §5.2 第 ① 层，为 `styles/_variables.scss`、`styles/main.scss`、`layouts/**`、`nuxt.config.ts` 的 `MomeiPreset` 建立 `--caomei-*` 语义 token 与 caomei `momei` 预设的并存桥接；派生档位统一用 `color-mix()` 表达；确定与 PrimeVue 并存的 `@layer` 顺序。
    - **非目标**: 不做消费点提前清理（87 个 components / 27 个 pages 内的 `--p-*` 与 `p-*` 保留至各批整页迁移时删除）；不重命名未迁移页面依赖的 `--p-*`；不移除 PrimeVue 预设。
    - **最小验收**: 语义层桥接后未迁移页面在三层视觉回归下**无差异**；`--caomei-*` 语义 token 可被新页面直接消费；`pnpm lint:css` + `pnpm typecheck` + `pnpm build` 通过。
    - **已验证（2026-09-25）**: 桥接落在 `styles/main.scss` 末尾（**unlayered `html:root`**，取值方向 `--p-* → --caomei-*`，派生档位用 `color-mix()`），映射与层叠依据见迁移方案 §5.2 与回归记录 M3 节。**无差异**：`pnpm test:visual` 8/8（6 张既有基线逐像素无差异 + 2 项新增桥接级联契约，浅 / 深双主题）。**可消费性有实证**：新增 `tests/visual/caomei-token-bridge.visual.test.ts` 在真实浏览器读取**计算后**的 `--caomei-*`，断言其等于对应 `--p-*` 且**不等于 caomei-ui 基础层默认值**（非空断言）。**假阴性**：仿真「桥接回落到库默认」后该 guard 双断言稳定失败。`pnpm lint:css` / `pnpm typecheck` / `pnpm build` 全部通过。**未改 `styles/_variables.scss` 与 `layouts/**`**：桥接为 token 级、无需 SCSS 别名（避免死代码）；`layouts/**` 消费的 `--p-surface-ground`（页面底）在 caomei 侧无对应语义（caomei `bg` 实为内容面），改写会造成观感回退，故按「最小改动」保留。
    - **证据落点**: 语义映射说明 + 视觉回归无差异证据 + `@layer` 顺序记录。

- [x] **4. B2 试点页迁移（P1）**
    - **执行范围**: 从 B2 数据类页面范围中选取 1-2 个试点页（优先管理端主路径，覆盖 DataTable 列插槽 / 分页 / 选择 / Tag / Button / InputText 等高频组件），按**路由整体切换**完成迁移，含该路由涉及的图标替换、`useToast` / `useConfirm` 调用改写（如涉及）、相关测试与 mock 改写。产出试点结论：链路可行性、实际耗时画像、发现的阻塞与后续批次修正建议。
    - **非目标**: 不迁移试点页以外的任何路由；不处理浮层类（Dialog / Drawer / Popover / DropdownMenu，留第六十九阶段）；不做图标全量替换；不卸载 PrimeVue。
    - **最小验收**: 试点页在浅色 / 深色主题下三层视觉回归通过（差异逐项归因，不属于 16 条有意差异者不得静默出现）；该路由从白名单切换到 caomei-ui 且路由内无混用；相关定向测试与 mock 改写后通过；`pnpm typecheck` + `pnpm lint` 通过。
    - **已验证（2026-09-25）**: 试点页定为 `/admin/comments` 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`。**三层回归**：层 ① `pnpm test` 532 文件 / 4494 用例通过（含保留并强化原有用例：页头契约、表格、筛选、加载、空态、请求失败）；层 ② `tests/e2e/admin.e2e.test.ts`（已改用 caomei 选择器）chromium 7/7 + `mobile-critical` 两项目全绿；层 ③ `pnpm test:visual` 10/10（试点页浅/深 + 既有 6 张 + 桥接契约 2 项，既有页面逐像素无差异）。`pnpm lint:css` / `typecheck` / `build` / `test:perf:budget` 通过。**「无混用」判定口径经裁定收窄为「批次在册组件族」**（全局壳 / 延后浮层 / 跨路由共享壳显式豁免，见迁移方案 §5.5），并由新增守卫 `tests/modules/ui-library-route-migration-guard.test.ts` 强制（该守卫同时让白名单首次具备可验证语义）。共享 `AdminContentLanguageSwitcher` 以过渡组件 `…-v2.vue` + `AdminPageHeader` 路由择库处理，避免影响未迁移路由。**E2E 已知 flaky**：`auth-session-governance` 的 firefox `/settings` 导航超时已用 HEAD 构建（`997313c5`）对照复现，判定为既有 flaky、非本批回归。**视觉差异逐项归因**、**耗时画像**与**阻塞项/修正建议**见 [回归记录](../reports/regression/current.md) M4 节；顺带闭合 `@lucide/vue` 直接依赖前置。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单；试点结论（含耗时画像与阻塞项）；视觉回归记录。

**回滚边界**:

- 接入基座：1a / 1b 均为配置级改动——移除 `caomei-ui` 依赖与模块 / 样式注册即可回到单库状态；1b 的配额回落若需撤销，恢复 `85 * KB` 与并存期基线即可；无数据与业务逻辑改动。
- 视觉验证回归基座：移除截图层工程与对应 CI 步骤，保留既有单元与 E2E 回归；基线快照可整体删除。
- 全局 token 语义层：移除 `--caomei-*` 桥接与 `momei` 预设注册即可恢复原 token 体系；回滚面限于样式层。
- B2 试点页：该路由白名单切回 PrimeVue 并 `git revert` 该路由改动；单路由回滚可独立执行。

**长期主线容量说明**: 本阶段迁移工作占满阶段容量，测试覆盖率 / ESLint / 结构复用等长期主线本期不上收新切片，改由 `pnpm regression:weekly` 保持不回退。

**风险提示**: 截图层存在跨环境假阳性风险（迁移方案 §9 风险 2b）；本地 `file:` 联调形态误提交会导致 CI / Docker / Vercel 解析失败（风险 2c），提交前须检查 `package.json` 与 `pnpm-lock.yaml` 中的 `caomei-ui` 协议；`caomei-ui` 0.x 不承诺语义化兼容（0.2.0 已实证 `styles.css → theme.css` 破坏性变更），升级须重跑该批回归，不得静默升级（风险 10~12）。

### 阶段收口检查清单

- [x] 当前阶段核心条目已完成
- [x] `todo.md` 已清理
- [x] `todo-archive.md` 已追加归档块
- [x] `roadmap.md` 已同步阶段状态与结论
- [x] 回归记录 / Review Gate 证据可追溯
- [x] `lint-md` / `docs:check:i18n` / `docs:check:line-count` 与最小质量门已确认
- [x] 已形成 Pass / Reject 结论

---

## 第六十六阶段：编辑器续航与覆盖率攻坚（已审计归档）

> 归档说明: 第六十六阶段「1 个功能扩展 + 4 个优化」已于 2026-08-13 完成五条主线交付与阶段收口。编辑器工具栏收敛 Phase B（风格扩展）为续写/扩写/缩写新增 `style` 参数并复用 6 种风格定义，Phase A 工具栏分组无回归；设置表单 UI Phase 4 补齐 AI Fallback 文本备用 3 项（`AI_FALLBACK_API_KEY`/`AI_FALLBACK_MODEL`/`AI_FALLBACK_ENDPOINT`）表单控件与五语种翻译；结构复用治理完成 theme 颜色 model composable 抽取（duplicate-code 基线 0.31%→0.30%）；测试覆盖率 90%+ 第八批补测 5 个高价值模块（text 55.64%→94.82%、tts 59.84%→88.63%、parser 60.00%→92.00%、aggregator 68.29%→97.56%、category 63.01%→98.63%），全仓 Statements 79.55%→80.63%（≥80.48% 目标达标，+1.08%）；脚本治理完成 audit:comment-drift 升格复核（GO，维持 Phase 52 已升格状态）并收口 7 处文档漂移。所有主线均通过 typecheck + lint 质量门与 Code Auditor Review Gate 审计。

> **ROI 评估**: 测试覆盖率 90%+ 第八批 `1.00`；编辑器工具栏收敛 Phase B `1.60`；设置表单 UI Phase 4 `1.75`；结构复用治理 `1.60`；脚本治理 comment-drift 升格 `2.00`。

### 1. 测试覆盖率 90%+ 第八批（长期主线 #1）（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告（[`phase-66-coverage-gap-analysis.md`](../design/governance/phase-66-coverage-gap-analysis.md)），吸取第七批教训——优先选择 `server/services/` 层代码量大、分支数多的模块，确保每批覆盖 ≥1% 的数字可见提升。选取 5 个高价值缺口模块推进。
- **非目标**: 不做低价值铺量补测；不牺牲断言有效性换取数字增长；不选代码量 <50 行的小模块。
- **实现对照**:
  - `server/services/ai/text.ts`：55.64% → **94.82%**（新增 18 用例：rewrite/review/perspectiveCheck/translate 完整路径、JSON 解析失败 fallback、10 方法无 chat 降级 it.each、suggestTitles JSON fallback）
  - `server/services/ai/tts.ts`：59.84% → **88.63%**（新增 14 用例：compensateStaleTask 各分支、generateSpeech 成功/失败、getVoices、estimateCostBreakdown、getAvailableProviders、generateAndUploadSpeech、processTask 失败路径）
  - `server/services/external-feed/parser.ts`：60.00% → **92.00%**（新增 12 用例：实体解码、相对链接、封面解析、Atom 规范化、CDATA 对象、异常格式）
  - `server/services/external-feed/aggregator.ts`：68.29% → **97.56%**（新增 7 用例：fixed-locale 过滤、同时间去重排序、refresh 失败 degraded、缓存刷新计数）
  - `server/services/category.ts`：63.01% → **98.63%**（新增 7 用例：ensureCategory 全分支、updateCategory translation/parent 冲突）
  - `category.test.ts` beforeEach 加 mockReset 修复 once 队列跨测试污染
- **验收对照**: ✅ 全仓 Statements 80.63% ≥ 80.48%（+1.08%，Branches 69.26% +1.32% / Lines 80.68% +1.12% / Funcs 78.64% +0.39%）；✅ 定向 subset 134/134 全绿 + 周边 14/14 无回归；✅ `pnpm typecheck` + `pnpm lint` 通过（0 errors）。
- **交付**: `85d69d7d`

### 2. 编辑器工具栏收敛 Phase B — 风格扩展（短期候选 #14）（P2）

- **执行范围**: 为续写（Continue）/ 扩写（Expand）/ 缩写（Condense）新增 `style` 参数，复用 Phase A 已完成的 6 种风格定义（专业/简洁/创意/学术/技术/友好）。后端 `TextService` 扩展 `style` 参数传递；前端工具栏 SplitButton 子项支持风格选择。
- **非目标**: 不新增 AI Provider；不改动 AI 计费/配额逻辑；不改写（Rewrite）已有风格参数。
- **验收对照**: ✅ 续写/扩写/缩写支持 6 种风格选择；✅ Phase A 工具栏分组无回归；✅ `pnpm typecheck` + `pnpm lint` + 受影响 AI 测试通过。

### 3. 设置表单 UI Phase 4（短期候选 #13 延续）（P2）

- **执行范围**: 按缺口清单选取 AI Fallback 3 项（`AI_FALLBACK_API_KEY`/`AI_FALLBACK_MODEL`/`AI_FALLBACK_ENDPOINT`）。范围校准：`WEBHOOK_TIMESTAMP_TOLERANCE` 当前实现不读取、`hexo_sync_*` 已实现且定位 `INTERNAL_ONLY`/`ADMIN_EXCLUDED`，均不在本批处理；AI Image Fallback 4 项留 Phase 5。
- **非目标**: 不暴露基础设施密钥到后台管理；不改变 `FORCED_ENV_LOCKED_KEYS` 安全锁定策略；不做通用 Key-Value 编辑器；不做 AI Image Fallback 系列（留 Phase 5）。
- **实现对照**:
  - 补齐 SETTING_ENV_MAP 3 条映射 + `.env.full.example` 注释示例
  - `ai-settings.vue` 实现 Password + InputText + InputText 表单控件（`v-if` 跟随 `ai_fallback_provider`）并补齐五语种翻译
  - 新增 `setting.constants.test.ts` + `ai-settings.test.ts` 共 6 个新用例
- **验收对照**: ✅ ≥2 个配置项新增后台 UI 控件（3/3）；✅ `pnpm typecheck` + `pnpm lint` + `pnpm lint:i18n` + `i18n:audit:missing = 0` 通过 + 定向测试 49/49 全绿；✅ A 阶段 `@code-auditor` Review Gate Pass（RG-W01 同轮闭环、RG-W02 待手动浏览器验证）。

### 4. 结构复用治理（长期主线 #3）（P1）

- **执行范围**: 基于 `duplicate-code: 0.30%` 最新基线识别 ≥1 组重复热点。优先方向：检查 Phase 64-65 新增代码（共享查询层、设置表单扩展等）是否引入重复；检查 `server/api/` 层请求上下文/参数校验的共性逻辑。
- **非目标**: 不推动跨模块大重构；不为复用而复用；不改变业务行为。
- **实现对照**:
  - 新建 `composables/use-theme-color-models.ts`：抽取 4 个共享函数（`resolveThemePresetKey` / `getPresetValue` 纯函数 + `createThemeColorModel` / `createThemeColorPickerModel<K>` 泛型工厂）
  - `theme-config-section.vue` ↔ `theme-preview-section.vue` 组件保留模板调用点，本地 1-3 行 closure 委托到 composable
  - 新增 `composables/use-theme-color-models.test.ts` 20 个单测覆盖关键分支
  - 消除 jscpd id 12+13 共 41 行重复 / 201 tokens，duplicate-code 基线 0.31%→0.30%
- **验收对照**: ✅ ≥1 组热点切片完成；✅ `pnpm duplicate-code:check` 基线 ≤0.30%；✅ `pnpm typecheck` + `pnpm lint` 通过。
- **交付**: `8fb91ecd`

### 5. 脚本治理 — audit:comment-drift 升格评估（长期主线 #10）（P1）

- **执行范围**: 复核 `audit:comment-drift` 是否满足升格条件——确认脚本输出稳定、误报率可控、warning 面清洁；输出明确 go/no-go 结论与理由。
- **非目标**: 不新增脚本；不改脚本 API；不引入新治理基线。
- **实现对照**:
  - 实测运行验证：exit 0，扫描 1294 文件，TODO=0 / restatement=6 / drift=139（较 Phase 65 基线 136 仅 +3 正常波动），五维评估（稳定/清洁/轻量/互补/可消费）全部满足
  - 结论 **GO**：维持 Phase 52 已升格状态（`regression:weekly` 第 10 步，required: false），无需重复升格操作
  - 评估文档：`docs/design/governance/script-promotion-eval-phase66.md`
  - 更正 comment-drift 升格归属 Phase 54 → Phase 52（经 git 提交 `8eb2c923` 与 `todo-archive-phases-52-57.md` 权威归档核实），收口 7 处文档漂移（backlog / README / planning / script-governance / phase65 评估文档 / todo-archive）
- **验收对照**: ✅ 输出升格评估结论（go + 理由）；✅ `regression:weekly` 配置确认已纳入（Phase 52 第 10 步，测试断言同步）；✅ `pnpm governance:audit:comment-drift` 清洁输出。
- **交付**: `1fc73e54`

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

---

---

## 第六十五阶段：编辑器工具栏收敛与设置 UI 续航（已审计归档）

> 归档说明: 第六十五阶段「2 个增量功能 + 3 个治理切片」于 2026-07-27~28 完成 4/5 主线交付。编辑器工具栏收敛 Phase A（10→5 按钮折叠 + 标题栏弹性宽度）验收通过；设置表单 UI Phase 3（AI_TEMPERATURE/AI_CHUNK_SIZE/AI_FALLBACK_PROVIDER UI + tts_credential_ttl_seconds + ExternalFeedSourcesEditor + 五语种翻译 + SettingKey 映射）验收通过；结构复用治理（Categories/Tags 共享查询层，-226 行重复，基线 0.34%→0.30%）验收通过；脚本治理升格评估（simple-duplicates 升格至 regression:weekly）验收通过；测试覆盖率 90%+ 第七批新增 3 个测试文件（external-links-shared.test.ts + settings.test.ts + setting.constants.test.ts），全仓覆盖率 79.48%（未达 ≥1% 目标，未通过验收，转入长期治理）。vitest.shared.ts 统一为 forks 池修复 `<repo-root>/tmp` 竞态问题；新增 regression-weekly.yml 定时 CI 回归工作流。所有已交付主线均通过 typecheck + lint + test 质量门。

> **ROI 评估**: 编辑器工具栏收敛 Phase A `2.33`；设置表单 UI Phase 3 `1.75`；测试覆盖率 90%+ 第七批 `1.00`；结构复用治理 `1.60`；脚本治理升格评估 `2.50`。

### 1. 编辑器工具栏收敛 Phase A（候选 #14）（P1）

- **执行范围**: 将文章编辑器的 10 个独立 AI 按钮折叠为 5 个入口：「AI 写作（SplitButton: 改写/续写/扩写/缩写）」+「AI 审校（审查）」+「AI 翻译」+「格式化」+「语音」，标题输入框获得完整弹性宽度。
- **非目标**: 不改动 MavonEditor 原生工具栏；不改动编辑器页面整体布局；不改动 AI 计费/配额逻辑；不新增 AI Provider。
- **设计文档**: [`docs/design/governance/editor-toolbar-consolidation-eval.md`](../design/governance/editor-toolbar-consolidation-eval.md)
- **验收对照**: ✅ 5 个入口代替原有 10 个按钮；✅ 标题输入框宽度恢复正常；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 编辑器功能无回归（4 单元测试通过 + 14/14 UI 验证通过）。
- **交付**: `e936ec1e`

### 2. 设置表单 UI Phase 3（候选 #13 延续）（P1）

- **执行范围**: 基于 Phase 1 缺口清单，新增 5 个表单控件——ai-settings.vue 扩展（`AI_TEMPERATURE` InputNumber + `AI_CHUNK_SIZE` InputNumber + `AI_FALLBACK_PROVIDER` Select + `TTS_CREDENTIAL_TTL_SECONDS` InputNumber）+ 第三方标签页新增 `external_feed_sources` 组件；补齐五语种翻译条目及 SettingKey/SETTING_ENV_MAP 映射。
- **非目标**: 不新增独立标签页（归入现有 AI/第三方标签页）；不改动 `FORCED_ENV_LOCKED_KEYS`；不做 AI_IMAGE_FALLBACK 系列（留 Phase 4）。
- **详细方案**: [`docs/design/governance/settings-form-ui-phase1-gap-inventory.md`](../design/governance/settings-form-ui-phase1-gap-inventory.md)
- **验收对照**: ✅ ≥4 个字段 UI 完成（5/5）；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 受影响表单保存/验证通过。
- **交付**: `01ce9670`

### 3. 测试覆盖率 90%+ 第七批（长期主线 #1）（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告，选取 3-5 个高价值缺口模块（优先 `server/services/` 或 `server/utils/` 层尚未深度覆盖的模块），推进全仓 coverage +≥1%。
- **非目标**: 不做低价值铺量补测；不牺牲断言有效性换取数字增长。
- **测试新增**:
  - `server/utils/external-links-shared.test.ts`：handleExternalLinkError 覆盖
  - `server/utils/settings.test.ts`：inferSettingMaskType 行为变更 + isPublicSettingKey
  - `server/services/setting.constants.test.ts`：isSettingEnvLocked / resolveSettingEnvEntry / getSettingLockReason 覆盖
- **验收对照**: ❌ 全仓覆盖率 Statements 79.48%（未达 ≥1% 提升目标）；✅ 516/517 测试文件通过，0 失败；✅ `pnpm typecheck` + `pnpm lint` 通过。
- **结论**: 未通过验收，转入长期治理继续推进。

### 4. 结构复用治理（长期主线 #3）（P1）

- **执行范围**: 基于 `duplicate-code` 0.35% 最新基线识别 ≥2 组重复热点；优先检查 Phase 63-64 新增代码是否引入重复。
- **非目标**: 不推动跨模块大重构；不为复用而复用；不改变业务行为。
- **实现对照**:
  - 新建 `server/utils/category-public-list.ts`：`queryCategoryPublicList()` 共享函数
  - 新建 `server/utils/tag-public-list.ts`：`queryTagPublicList()` 共享函数
  - 4 端点 handler 简化：`api/categories/index.get.ts` / `api/external/categories/index.get.ts` / `api/tags/index.get.ts` / `api/external/tags/index.get.ts`
  - 累计消除 226 行重复（+14/-226），2 克隆消除，基线 0.34%→0.30%
- **验收对照**: ✅ ≥2 组热点切片完成；✅ `duplicate-code` 基线 0.30% ≤ 0.35%；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 22/22 测试通过。

### 5. 脚本治理升格评估（长期主线 #10）（P1）

- **执行范围**: 评估将 `governance:audit:simple-duplicates` 和 `governance:audit:comment-drift` 从独立 baseline 升格进入 `regression:weekly` warning 面；输出明确 go/no-go 结论与理由；确保所有治理脚本当前清洁运行。
- **非目标**: 不新增脚本；不改脚本 API；不引入新治理基线。
- **实现对照**:
  - 升格评估报告输出：`docs/design/governance/script-promotion-eval-phase65.md`
  - `audit:simple-duplicates` Go → 已加入 `regression:weekly` step 11（required: false）
  - `audit:comment-drift` 确认已升格（Phase 52 已接入）
  - 四组治理脚本清洁运行（simple-duplicates 114/11/10, comment-drift TODO=0 restatement=6 drift=136, eslint-debt 0w, check-scripts 50/50/50）
- **验收对照**: ✅ 升格评估报告输出；✅ `regression:weekly` 步骤列表更新；✅ 治理脚本清洁运行。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

---

---

## 第六十四阶段：设置 UI Phase 2 与治理续航（已审计归档）

> 归档说明: 第六十四阶段「1 个新功能 + 4 个优化」已于 2026-07-27 完成五条主线交付与阶段收口。设置表单 UI Phase 2（首批 UI 组件）将 Phase 63 的 SoT 映射落地为 5 个可交互表单控件（EMAIL_SECURE/EMAIL_EXPIRES_IN/TEMP_EMAIL_DOMAIN_NAME/AI_MAX_TOKENS/TTS_DEFAULT_VOICE）并补齐五语种翻译；reactive→ref Step 5 收尾剩余 3 个表单/弹窗类文件（admin-taxonomy-page/marketing-campaign-form/comment-form）；结构复用治理完成 2 组热点切片（safeDeleteCategory + handleExternalLinkError），duplicate-code 基线保持 0.35%；测试覆盖率第六批为 privacy.ts 新增 7 个边缘 case 测试；ko-KR/ja-JP 文档治理完成 freshness 审计报告、ko-KR 13 文件 last_sync 刷新、ja-JP 语种升格为已支持、补齐 features/variables 翻译。所有主线均通过 typecheck + lint + test 质量门。

> **ROI 评估**: 设置表单 UI Phase 2 `1.60`；reactive→ref Step 5 `1.60`；结构复用治理 `1.80`；测试覆盖率 90%+ 第六批 `1.50`；ko-KR/ja-JP 文档治理 `1.50`。

### 1. 设置表单 UI Phase 2 — 首批 UI 组件（P1）

- **执行范围**: 为 Phase 63 新映射的 5 个 SettingKey 开发 PrimeVue 表单控件：email-settings.vue（EMAIL_SECURE ToggleSwitch、EMAIL_EXPIRES_IN InputNumber、TEMP_EMAIL_DOMAIN_NAME InputText）、ai-settings.vue（AI_MAX_TOKENS InputNumber、TTS_DEFAULT_VOICE Select + ttsVoiceOptions computed）。types/setting.ts AISettingsFields 补齐新字段。
- **非目标**: 不新增标签页；不改动 FORCED_ENV_LOCKED_KEYS。
- **实现对照**:
  - `components/admin/settings/email-settings.vue`：新增 3 个表单控件
  - `components/admin/settings/ai-settings.vue`：新增 2 个表单控件 + ttsVoiceOptions computed
  - `types/setting.ts`：AISettingsFields 新增 2 字段
  - `i18n/locales/*/admin-settings.json`：五语种各 5 个翻译条目
- **验收对照**: ✅ 5 字段 UI 完成；✅ 五语种 20 个翻译条目；✅ `pnpm typecheck` + `pnpm lint` + `pnpm test` 通过。

### 2. 响应式状态模型收敛 — reactive→ref Step 5（P1）

- **执行范围**: 补齐 Phase 63 延期的 3 个表单/弹窗类文件 `reactive` → `ref` 迁移。
- **迁移明细**:
  - `components/admin/admin-taxonomy-page.vue`：deleteDialog reactive → ref（6 处 .value）
  - `components/admin/marketing-campaign-form.vue`：form reactive → ref（15+ 处 .value）
  - `components/comment-form.vue`：form reactive → ref（8 处 .value）
- **验收对照**: ✅ 3 文件迁移完成；✅ 所有 template v-model 零改动；✅ `pnpm typecheck` + `pnpm lint` + 9 tests 通过。

### 3. 结构复用治理 — 下一轮热点切片（P1）

- **执行范围**: 基于 duplicate-code 0.35% 基线做增量切片收敛。
- **收敛切片**:
  - Slice 1：`server/utils/category-delete.ts` 新建 `safeDeleteCategory()`，内部/external categories/[id].delete 双端点共用，消除 26 行重复
  - Slice 2：`server/utils/external-links-shared.ts` 新建 `handleExternalLinkError()`，POST + PUT external-links 双端点共用，消除 21 行重复
- **验收对照**: ✅ 2 组切片完成；✅ duplicate-code 基线 0.35%（47 clones，不反弹）；✅ `pnpm typecheck` + `pnpm lint` + 7 tests 通过。

### 4. 测试覆盖率 90%+ 第六批（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告选取高价值模块。
- **测试新增**:
  - `utils/shared/privacy.test.ts`：新增 7 个边缘 case（custom maskString/undefined/maskEmail/@/maskPhone 短值/maskIP IPv4 短段）
  - `server/utils/logger.test.ts`：维持已有 508 行全面覆盖
- **验收对照**: ✅ 75 tests 全部通过；✅ `pnpm typecheck` + `pnpm lint` 通过。

### 5. ko-KR/ja-JP 文档治理（P2）

- **执行范围**:
  - Phase A：产出翻译文档 freshness 审计报告 `docs/design/governance/i18n-docs-freshness-audit-ko-ja.md`
  - Phase B：ko-KR 13 个文档 last_sync 从 2026-03 刷新至 2026-07-27；ja-JP 由 seo-ready 提升为已支持语种
  - Phase C：创建 ja-JP guide/features.md（7 节）和 guide/variables.md（3 节 + 映射表）翻译；documentation.md 矩阵同步 ja-JP 范围升级至与 ko-KR 一致
- **验收对照**: ✅ 审计报告输出；✅ 13 个文档问题修复；✅ ja-JP 升格 + 2 新翻译文件；✅ `docs:check:source-of-truth` 通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

---
