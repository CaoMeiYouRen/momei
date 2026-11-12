# 2026-10-13 视觉一致性门禁（Visual Parity Gate）

> 适用阶段：PrimeVue → caomei-ui 组件迁移（迁移方案 §8.2「截图识别层」）。
> 权威口径：`AGENTS.md` 与 [迁移方案](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)；本文档只补充「逐路由视觉一致性门禁」的落地方式与偏差处置流程。
> 用法速查见 [测试规范 §7.2](../../standards/testing.md#72-视觉一致性门禁-visual-parity-gate)。

## 1. 为什么需要门禁层

基线层（`tests/visual/*.visual.test.ts`）只能回答「渲染是否相对上一次基线变了」，无法回答「是否与迁移前的 PrimeVue 原貌一致」——仓库里的基线本身是迁移后状态，无法自证。因此新增门禁层：把**迁移前 PrimeVue 参考态**固化为独立快照（`<name>.reference.png`），逐路由比较当前渲染，并按受众分级预算判定。

## 2. 分层与产物

| 层 | config | 用例目录 | 基线 | 用途 |
|:---|:---|:---|:---|:---|
| 基线层 | `playwright.visual.config.ts` | `tests/visual/*.visual.test.ts` | `tests/visual/__screenshots__/…/<name>.png` | 相对上次基线的回归 |
| 门禁层 | `playwright.visual-parity.config.ts` | `tests/visual/parity/*.visual-parity.test.ts` | `tests/visual/parity/reference/<name>.reference.png` | 相对 CI 复采基线的漂移检测 |

产物隔离：报告目录 `playwright-report/visual` ↔ `playwright-report/visual-parity`，失败产物 `test-results/visual` ↔ `test-results/visual-parity`；两层互不覆盖。

### 2.1 第二 server 实例（2026-11-03 新增，B3 安装向导）

门禁层按 **project** 分流两个 server 实例：

| project | baseURL | server env | 承载 |
|:---|:---|:---|:---|
| `chromium-visual-parity` | `127.0.0.1:3001` | `TEST_MODE=true`、`MOMEI_INSTALLED=true` | 除安装向导外的全部路由 |
| `chromium-visual-parity-installation` | `127.0.0.1:3002` | `TEST_MODE=false`、`MOMEI_INSTALLED=false`、`DATABASE_TYPE=sqlite`、`DATABASE_PATH=:memory:` | 仅 `installation.visual-parity.test.ts` |

为什么需要第二实例：已安装态主实例对 `/installation` 直接 302（`server/middleware/0-installation.ts`），前端 `page.route` 无法补救。**`MOMEI_INSTALLED=false` 本身不等于强制未安装**——中间件只是跳过环境变量短路，随后仍按数据库探测；主库已被 TEST_MODE 种子写成「已安装」，页面照样被 302。因此第二实例必须同时关闭 TEST_MODE（不跑种子）并使用独立内存库，使每次启动都是干净的未安装态。

安装向导的状态响应在 spec 内固定 mock（`/api/install/status`），避免机器相关字段（node / OS / DB 版本）与真实安装态进入截图；同一份 mock 由 `tests/visual/helpers/installation-fixture.ts` 提供，基线层与门禁层共用。

**2026-11-04（条目 3）扩展**：基线层也接入了第二实例。`playwright.visual.config.ts` 增加同源 webServer（`DATABASE_SYNCHRONIZE=true`，否则内存库未建表）与 `chromium-visual-installation` project，`tests/visual/installation.visual.test.ts` 采集浅 / 深两张基线并补结构断言（6 个步骤项 / 概览 `Tag` 24px / 卡片无横向溢出）。两层使用同一份 `installation-fixture` 的 status mock，避免「门禁绿、基线拍的是真实机器信息」的漂移。

## 3. 分级严格度

口径由用户设定，落于 `tests/visual/parity-budget.json`：

- `reader`（面向读者 / 公开页）：布局必须基本不变、极小容差；
- `admin`（面向管理员）：容许一定偏差，但需「看起来差不多」。

逐 testName 可在 `entries` 覆盖。判定为「取严」：`maxDiffPixels` 与 `maxDiffPixelRatio` 任一超限即失败。

**档位解析（2026-11-03 起）**：档位由 `tests/visual/parity/routes.ts` 的 `tier` **显式声明**并透传到预算解析（`tests/visual/parity/budget.ts` 的 `getBudgetEntry(name, tier)`）；仅当未传 tier 时才回退旧的「testName 含 `reader`」名字启发式。原因是 B3 的公开页命名（`auth-login` / `submit-page` / `user-settings`）不含 `reader`，只靠启发式会**静默**落到 `admin` 档且不报错。该口径由 `tests/scripts/parity-budget.test.ts` 锁定。

## 4. 偏差处置通道（优先级从高到低）

1. **墨梅主题层 `--caomei-*` token 覆盖**：`styles/main.scss` 既有的 `html:root` 桥接块（迁移方案 §5.2 第 ① 层）；
2. **caomei 具名预设**：`theme` 选项切换预设；
3. **组件外层包装 + 选择器级覆盖**：仅在前两者无法覆盖且确有必要时使用（迁移方案 §5.7 约束 2：须与 caomei 样式同级或更高特异性、加载顺序在后，不得依赖 `@layer` 取胜），**逐条在偏差处置表留理由**；
4. **上游反馈**：以上均无法解决时，产出 issue 草稿（见 §6）。

## 5. 参考态采集

当前基线由 ubuntu runner 的 `Refresh Visual Reference` 工作流生成，CI 产物是门禁唯一判定依据：

```bash
# 触发 CI 全量重采（默认入口）
gh workflow run visual-reference-refresh.yml --ref master
# 本地等价命令仅用于排障，产物不得作为门禁基线提交
pnpm test:visual:reference -- --force-all
```

- 工作流在 ubuntu runner 构建后以 `--force-all` 重采 `tests/visual/parity/routes.ts` 台账中的全部路由（浅 / 深两态），上传 `tests/visual/parity/reference/` 与 `reference-manifest.json`；
- 下载 artifact 后覆盖仓库同名目录，按实测刷新 `parity-budget.json`（当前参考态与当前态同源，allowlist 已归零）；
- `--force-all` 与 `--only` 互斥；`--force-all` 在非 CI 环境会打印警告，本地产物不得提交；
- 历史取证：`--revert=<迁移提交> --only=<route-name>` 可在当前依赖下复现某一迁移提交的「迁移前源码」观感（脚本以 `git worktree` 检出 HEAD、回退该提交源码到父提交、构建后采集）；`--ref=<历史 ref>` 直接检出模式仍保留，但部分历史 ref 会因依赖子路径导出缺失而构建崩溃；
- 采集环境固定：chromium、1440×900、DSF1、zh-CN、Asia/Shanghai、浅色、`reducedMotion: reduce`、关闭动画、隐藏光标；
- 环境元数据与逐 testName 的 ref / commit 记录于 `tests/visual/parity/reference-manifest.json`。

### 5.1 参考态稳定性与排障（2026-11-09 第七十二阶段收口沉淀）

- **种子数据必须用固定时间**：TEST_MODE 走 `:memory:` 库并在每次启动重新种子，`new Date()` 会让参考态里的日期文本随运行日漂移，被误判为组件差异；`server/utils/seed-test.ts` 统一固定为 `2026-11-06T04:00:00.000Z`（与参考态采集日一致）。
- **排障先用独立截图脚本**：同一 TEST_MODE 种子 + 独立截图脚本约 4 分钟，远快于全量 parity（约 18 分钟）；可用于快速定位差异区域，但最终仍须用真实 parity 复跑确认，且截图来源必须与测试种子一致。

## 6. 上游反馈（通道④）

当偏差无法用通道 ①~③ 解决（例如缺少 token 钩子、组件结构不可配置）时，产出 issue 草稿，至少包含：

1. **现象**：哪类页面 / 组件、哪个区域、差异表现；
2. **最小复现**：最小 props / 插槽组合 + 期望值 vs 实测值（含像素量或色值）；
3. **期望 token**：希望上游提供的 `--caomei-*` token 名称与语义（或期望的 prop / 插槽）；
4. **影响面**：在本仓库命中的路由 / 组件数量，及当前用的临时写法（包装层 / 选择器覆盖）。

上游反馈清单与落点记录见 [2026-09-25 上游反馈](./2026-09-25-caomei-ui-upstream-feedback.md)。

## 7. CI 接入与转阻断条件

`visual` job 包含 `pnpm test:visual` 基线层与 `pnpm test:visual:parity` 门禁层，任一层失败即 job 失败（`continue-on-error` 已移除）。

**当前判定基线**：参考态由 ubuntu runner 的 `Refresh Visual Reference` 工作流（`gh workflow run visual-reference-refresh.yml --ref master`）按当前 HEAD 复采，CI 产物是唯一判定依据；本地快照不参与判定。复采后 82 条 allowlist 归零，参考态与当前态同源，未归因差异预期为 0（以首轮阻断 run 实测回填）；后续漂移由 `tiers` 阈值（reader 2000px / 0.3%，admin 3000px / 0.35%）直接判定。重采 run id 与产物核对结果记录于本节与 `reference-manifest.json`。

**转阻断前置**：① 参考态由 CI 复采并刷新预算（已完成，run `43251811066`）；② 新参考态下 `pnpm test:visual` 与 `pnpm test:visual:parity` 已全绿（run `43257379765`，保留 `continue-on-error` 状态）；③ 转阻断后 master 连续 2 次全绿（已完成：run `43259530123` attempt 2 与独立 `workflow_dispatch` run `43264952603`，visual job 的 baseline / parity 两层均 success；attempt 1 的 visual 同样全绿，Test 其余 job 因既有 E2E firefox 导航 flake 重跑后通过）。强制力来自 `Test` workflow 与 Mergify 的 `check-success=Test`（master 未启用 branch protection）；新增允许清单仍须附实测像素、归因与责任人，不得以放宽阈值换取绿灯。

### 7.1 首次落地结果（2026-10-14，快照时点＝首次落地）

> 下述路由计数是**首次落地时点**的快照；逐路由迁移的最新状态以 §7.2 与 `tests/visual/parity/routes.ts` 为单点事实源。

- 参考态采集：首轮 22 个 testName 全部就绪（当时已迁移 3 路由用 `--revert` 取迁移前原貌；待迁移 8 路由取 HEAD）。环境元数据见 `tests/visual/parity/reference-manifest.json`。
- 门禁实测：`pnpm test:visual:parity` 22 用例全绿；已迁移 3 路由的未归因差异为 0（实测差异已全部登记进允许清单），详见 [偏差处置表 §校准记录](./visual-parity-deviation-register.md#校准记录)。
- 注意：Playwright 的 `updateSnapshots` 默认值为 `'missing'`，不可用于判定「采集模式」；采集由显式环境变量 `PARITY_CAPTURE=1` 触发（见 `tests/visual/parity/helpers.ts`）。

### 7.2 逐路由推进（2026-10-14 起滚动更新）

- `/admin/waitlist` 于 2026-10-14 迁入 `MIGRATED_ROUTES`：参考态沿用其迁移前 HEAD 采集（等价 `--revert <迁移提交>`），允许清单按实测校准（浅 9533px / 深 15602px）。
- 当前基线统一由刷新工作流复采；`--revert=<迁移提交> --only=<route-name>` 仅用于历史取证，不再作为门禁基线入口。
- **覆盖保护口径修正（2026-10-14）**：`buildHeadCaptureGrepArgs` 原先只排除 `source` 以 `worktree` 开头的清单条目，故**就地（`in-place`）采集的待迁移路由**在迁移落地后会被下一次 HEAD 全量采集覆盖成「迁移后渲染」，门禁退化为自比自（`/admin/waitlist` 分区二审计发现）。现改为「**磁盘上已存在 `<name>.reference.png` 的 testName 一律排除**」；需要专门刷新某条参考态时显式使用 `--only=<name>`。该契约由 `tests/scripts/capture-visual-reference.test.ts` 覆盖。
- **第七十阶段（2026-11-03）**：B3 的 10 条路由登记进 `PENDING_ROUTES`（管理端设置 3 条 / 安装向导 1 条 / 用户设置与认证提交 6 条），参考态按 HEAD 就地采集完成（20 张，`reference-manifest.json` 共 54 条）。**`reader` 档首次启用**（6 条路由），档位由路由定义显式声明。安装向导由第二 server 承载（见 §2.1）。比对侧 `pnpm test:visual:parity` 55/55（54 条比对 + 1 条登记守卫），用时约 10.4 分钟；参考态与当前态同源（待迁移路由），差异 0，迁移落地后该批用例即开始反映真实漂移。
- **第七十阶段条目 3（2026-11-04）**：`installation-wizard` 移入 `MIGRATED_ROUTES`（参考态不变）；允许清单按实测登记——light 48,145px / 3.715%（6 区域）、dark 48,708px / 3.758%（6 条带，深色差异分散故按横向条带归因），未归因 0。`Stepper` / `Accordion` 族首次进入已迁移路由的渲染面。
- **第七十阶段条目 4（2026-11-04）**：`user-settings` / `auth-login` / `auth-register` / `auth-forgot-password` / `auth-reset-password` / `submit-page` 六条 `reader` 路由移入 `MIGRATED_ROUTES`，`PENDING_ROUTES` 清空。`reader` 档首次实测：原始差异 0.265%–2.661%，按区域登记后未归因 0（`auth-reset-password` 含页脚右侧 36 / 34px 小区域）。注意 0.3% 约束的是**扣减后剩余比例**，不是原始差异；`auth-forgot-password` 原始 0.285% 已全额归因。
- **保护口径的边界（2026-11-03 补记）**：`getProtectedTestNames` 的「磁盘已有即排除」只作用于 **HEAD 就地采集**；`--ref=<ref>` 的 worktree 模式在全量采集时会把工作树内的参考态 `copyReferences` 回主仓库并改写 manifest，不参与该排除。使用 worktree 模式刷新时须显式给 `--only`。

## 8. 相关文档

- [迁移方案 §8.2](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)
- [偏差处置表](./visual-parity-deviation-register.md)
- [测试规范 §7.2](../../standards/testing.md#72-视觉一致性门禁-visual-parity-gate)
