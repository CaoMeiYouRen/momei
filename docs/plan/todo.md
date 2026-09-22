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

## 第六十七阶段：PrimeVue → caomei-ui 迁移（一）——接入基座、视觉回归与试点

> 阶段规划详情与 ROI 见 [项目计划](./roadmap.md#第六十七阶段primevue--caomei-ui-迁移一接入基座视觉回归与试点phase-67-primevue-to-caomei-ui-migration-i--integration-baseline-visual-regression--pilot)。
> 迁移方案事实源见 [PrimeVue → caomei-ui 迁移方案](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)。
> backlog 来源见 [长期规划与积压项](./backlog.md) 长期主线第 11 条。

**时间表**: 2026-09-19 ~ 待定（按里程碑滚动）

**准入前置（已核对 2026-09-22）**: 库侧 M5 十项已交付、caomei-ui Phase 7 第二阶段已归档、B1 出口条件达成；`caomei-ui@0.2.0` 已发布至 npm（2026-09-22，含包形态破坏性变更：`styles.css` → `theme.css` + 逐模块组件样式）。**目标依赖由 `0.1.0` 上移到 `0.2.0`**，接入基座待重锚（迁移方案 §3.6）。

- [ ] **1. 接入基座与消费路径（P1）**
    - **1a. 基座落地（已完成 2026-09-20）**: 以 `caomei-ui@0.1.0` 引入 npm 依赖、接入 `caomei-ui/nuxt` 与 `@primevue/nuxt-module` 并存、同名自动导入隔离（`modules/caomei-ui-coexistence.ts`）、白名单载体（`lib/ui-library.ts`）、迁移基线重取脚本（`governance:count:primevue-usage`）。**已验证**：两套库同构建共存、白名单载体可单点读出、依赖声明完整、§3.4 基线重新取数已落盘。提交 `90344418`，验证见 [回归记录](../reports/regression/current.md) M1 节。
    - **1b. 重锚到 `caomei-ui@0.2.0`（待办，本项收口条件）**
        - **执行范围**: 依赖 `0.1.0 → 0.2.0`（迁移期锁定精确版本）；确认 `injectStyles` 注入物为**基础层 `caomei-ui/theme.css`**（0.2.0 起取代 `styles.css`；组件样式随模块自带、由打包器按需 tree-shaking）且**基础层注入点唯一**（模块 / resolver / 显式 import 三选一）；确认 CSS `@layer` 顺序不变；确认模块自动导入的 `useLocale` / `provideLocale` 不变（`CaomeiConfigProvider` 包裹与 `primevue-i18n` 插件替换仍延后到启用 caomei-ui 组件的批次）；复测 `pnpm test:perf:budget` 的 `keyCss` 并按迁移方案 §8.4.1 回落并存期配额；复核 §3.4 基线未漂移（如需可重取）；`@lucide/vue` 是否需在 momei 侧显式声明仍按试点页实际引用决定。
        - **非目标**: 不迁移任何页面组件；不移除 PrimeVue；不改动业务逻辑；不引入 Tailwind。
        - **最小验收**: `theme.css` 在产物中仅注入一次；`keyCss` 复测后按迁移方案 §8.4.1 **回落配额（85KB → 70KB）并刷新基线**；`pnpm typecheck` + `pnpm lint` + `pnpm build` 通过；`pnpm test:perf:budget` 不越线。
        - **证据落点**: 复测数值与配额回落写入 [回归记录](../reports/regression/current.md)；决策回链迁移方案 §3.6 / §8.4.1。

- [ ] **2. 视觉验证回归基座（P1）**
    - **执行范围**: 建立三层回归——① 单元层（Vitest + Vue Test Utils 组件渲染 / 关键 DOM、类名、ARIA 断言）；② E2E 功能层（复用既有 Playwright 17 个 spec，确认迁移前全绿）；③ 截图识别层（新增 Playwright `toHaveScreenshot` 视觉回归工程，**独立 project / config**，不并入既有 `test:e2e` 的 `testMatch`）。完成迁移前基线采集（列表页 / 表单（设置）页 / 浮层各 1 页，覆盖浅色 / 深色主题与目标 viewport）。固化环境可复现配置（浏览器渠道与版本、viewport、locale、时区、`animations: 'disabled'`、`caret: 'hide'`）、阈值策略与 CI 接入；动态区域以 `mask` 显式遮蔽；声明 CI 增量耗时预算与基线快照体积 / 保留策略。**基线采集须在接入基座重锚到 `0.2.0` 之后进行**（避免建立在 0.1.0 的单体样式形态上，见迁移方案 §3.6）。
    - **非目标**: 不做全站截图覆盖；不与 caomei-ui 做跨仓触发；不改变既有 `pnpm test:e2e` / `test:e2e:critical` / `test:e2e:review-gate` 的断言语义与证据产出；不以放宽阈值代替差异归因。
    - **最小验收**: 三层入口各自可独立运行且可复现；迁移前基线快照随仓库提交；故意改动一处样式可被截图层稳定检出（假阳性与假阴性各验证一次）；既有 E2E / review-gate 入口行为不变；CI 增量为可解释数值；`pnpm typecheck` + `pnpm lint` 通过；**E2E 基线的已知 flaky 集已显式登记**（当前为 `auth-session-governance`，判定依据见回归记录 M1 节）并给出 M1 前后 flaky 率对比，避免把既有波动当作迁移回归。
    - **证据落点**: 采集 / 比对命令、环境元数据、基线快照、阈值策略、CI 耗时与基线体积数据落盘；CI 接入写入 `.github/workflows/`。

- [ ] **3. 全局 token 语义层桥接（P1）**
    - **执行范围**: 按迁移方案 §5.2 第 ① 层，为 `styles/_variables.scss`、`styles/main.scss`、`layouts/**`、`nuxt.config.ts` 的 `MomeiPreset` 建立 `--caomei-*` 语义 token 与 caomei `momei` 预设的并存桥接；派生档位统一用 `color-mix()` 表达；确定与 PrimeVue 并存的 `@layer` 顺序。
    - **非目标**: 不做消费点提前清理（87 个 components / 27 个 pages 内的 `--p-*` 与 `p-*` 保留至各批整页迁移时删除）；不重命名未迁移页面依赖的 `--p-*`；不移除 PrimeVue 预设。
    - **最小验收**: 语义层桥接后未迁移页面在三层视觉回归下**无差异**；`--caomei-*` 语义 token 可被新页面直接消费；`pnpm lint:css` + `pnpm typecheck` + `pnpm build` 通过。
    - **证据落点**: 语义映射说明 + 视觉回归无差异证据 + `@layer` 顺序记录。

- [ ] **4. B2 试点页迁移（P1）**
    - **执行范围**: 从 B2 数据类页面范围中选取 1-2 个试点页（优先管理端主路径，覆盖 DataTable 列插槽 / 分页 / 选择 / Tag / Button / InputText 等高频组件），按**路由整体切换**完成迁移，含该路由涉及的图标替换、`useToast` / `useConfirm` 调用改写（如涉及）、相关测试与 mock 改写。产出试点结论：链路可行性、实际耗时画像、发现的阻塞与后续批次修正建议。
    - **非目标**: 不迁移试点页以外的任何路由；不处理浮层类（Dialog / Drawer / Popover / DropdownMenu，留第六十九阶段）；不做图标全量替换；不卸载 PrimeVue。
    - **最小验收**: 试点页在浅色 / 深色主题下三层视觉回归通过（差异逐项归因，不属于 16 条有意差异者不得静默出现）；该路由从白名单切换到 caomei-ui 且路由内无混用；相关定向测试与 mock 改写后通过；`pnpm typecheck` + `pnpm lint` 通过。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单；试点结论（含耗时画像与阻塞项）；视觉回归记录。

**回滚边界**:

- 接入基座：1a / 1b 均为配置级改动——移除 `caomei-ui` 依赖与模块 / 样式注册即可回到单库状态；1b 的配额回落若需撤销，恢复 `85 * KB` 与并存期基线即可；无数据与业务逻辑改动。
- 视觉验证回归基座：移除截图层工程与对应 CI 步骤，保留既有单元与 E2E 回归；基线快照可整体删除。
- 全局 token 语义层：移除 `--caomei-*` 桥接与 `momei` 预设注册即可恢复原 token 体系；回滚面限于样式层。
- B2 试点页：该路由白名单切回 PrimeVue 并 `git revert` 该路由改动；单路由回滚可独立执行。

**长期主线容量说明**: 本阶段迁移工作占满阶段容量，测试覆盖率 / ESLint / 结构复用等长期主线本期不上收新切片，改由 `pnpm regression:weekly` 保持不回退。

**风险提示**: 截图层存在跨环境假阳性风险（迁移方案 §9 风险 2b）；本地 `file:` 联调形态误提交会导致 CI / Docker / Vercel 解析失败（风险 2c），提交前须检查 `package.json` 与 `pnpm-lock.yaml` 中的 `caomei-ui` 协议；`caomei-ui` 0.x 不承诺语义化兼容（0.2.0 已实证 `styles.css → theme.css` 破坏性变更），升级须重跑该批回归，不得静默升级（风险 10~12）。


---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
