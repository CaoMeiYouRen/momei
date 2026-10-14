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
| 门禁层 | `playwright.visual-parity.config.ts` | `tests/visual/parity/*.visual-parity.test.ts` | `tests/visual/parity/reference/<name>.reference.png` | 相对迁移前原貌的一致性 |

产物隔离：报告目录 `playwright-report/visual` ↔ `playwright-report/visual-parity`，失败产物 `test-results/visual` ↔ `test-results/visual-parity`；两层互不覆盖。

## 3. 分级严格度

口径由用户设定，落于 `tests/visual/parity-budget.json`：

- `reader`（面向读者 / 公开页）：布局必须基本不变、极小容差；
- `admin`（面向管理员）：容许一定偏差，但需「看起来差不多」。

逐 testName 可在 `entries` 覆盖。判定为「取严」：`maxDiffPixels` 与 `maxDiffPixelRatio` 任一超限即失败。

## 4. 偏差处置通道（优先级从高到低）

1. **墨梅主题层 `--caomei-*` token 覆盖**：`styles/main.scss` 既有的 `html:root` 桥接块（迁移方案 §5.2 第 ① 层）；
2. **caomei 具名预设**：`theme` 选项切换预设；
3. **组件外层包装 + 选择器级覆盖**：仅在前两者无法覆盖且确有必要时使用（迁移方案 §5.7 约束 2：须与 caomei 样式同级或更高特异性、加载顺序在后，不得依赖 `@layer` 取胜），**逐条在偏差处置表留理由**；
4. **上游反馈**：以上均无法解决时，产出 issue 草稿（见 §6）。

## 5. 参考态采集

```bash
# 待迁移路由（仍为 PrimeVue）：在 HEAD 采集
pnpm test:visual:reference

# 已迁移路由：用 --revert 回退「迁移提交」的源码到其父提交（当前依赖下采集）
pnpm test:visual:reference -- --revert=44774147 --only=admin-comments-list        # /admin/comments
pnpm test:visual:reference -- --revert=ff443447 --only=admin-submissions-list     # /admin/submissions
pnpm test:visual:reference -- --revert=04d12c17 --only=admin-external-links-list  # /admin/external-links
```

- 脚本 `scripts/testing/capture-visual-reference.mjs` 以 `git worktree` 检出 HEAD（或 `--ref=<ref>`）、按当前锁文件安装依赖、把 `--revert` 指定提交的源码改动回退到父提交、构建后以 `--update-snapshots` 采集；
- **为何用 `--revert` 而非直接检出历史 ref**：直接检出迁移前的 ref 构建时，其依赖版本（PrimeVue 依赖的 `@primeuix/utils` 子路径导出）在当前 pnpm 布局下不可解析，服务端启动即崩溃；`--revert` 让参考态与当前态的差异**只来自组件迁移本身**，隔离依赖漂移，是更干净的判定基线；
- 采集环境固定：chromium、1440×900、DSF1、zh-CN、Asia/Shanghai、浅色、`reducedMotion: reduce`、关闭动画、隐藏光标；
- 环境元数据与逐 testName 的 ref / commit 记录于 `tests/visual/parity/reference-manifest.json`；
- 采集顺序建议：**先**历史 ref（已迁移路由），**再** HEAD（待迁移路由）；HEAD 全量采集会自动 `--grep-invert` 已由历史 ref 采集的用例，防止覆盖。
- **就地采集的等价性**：若某路由的参考态是在其迁移提交**之前**于 HEAD 就地采集（如 `/admin/waitlist`，2026-10-14），它与「对该迁移提交执行 `--revert`」等价（两者都是「迁移前源码 + 当前依赖」）；重采时应改用 `--revert` 以沿用统一口径，见 §7.2。

## 6. 上游反馈（通道④）

当偏差无法用通道 ①~③ 解决（例如缺少 token 钩子、组件结构不可配置）时，产出 issue 草稿，至少包含：

1. **现象**：哪类页面 / 组件、哪个区域、差异表现；
2. **最小复现**：最小 props / 插槽组合 + 期望值 vs 实测值（含像素量或色值）；
3. **期望 token**：希望上游提供的 `--caomei-*` token 名称与语义（或期望的 prop / 插槽）；
4. **影响面**：在本仓库命中的路由 / 组件数量，及当前用的临时写法（包装层 / 选择器覆盖）。

上游反馈清单与落点记录见 [2026-09-25 上游反馈](./2026-09-25-caomei-ui-upstream-feedback.md)。

## 7. CI 接入与转阻断条件

`visual` job 新增 `pnpm test:visual:parity` 步骤（`if: always()`），工件包含两层报告与 `reference-manifest.json`。

**当前仍保留 `continue-on-error: true`**，理由：参考态基线与预算在本地 Linux/chromium 生成，尚需在 ubuntu runner 上确认渲染一致（字体回退等跨环境差异会导致假红）。转阻断条件：

1. master 连续 2 次 CI 运行 parity 全绿（无尺寸不一致、未归因差异为 0）；
2. `pnpm test:visual` 基线层同样连续 2 次全绿；
3. **前置条件（非可选分支）：参考态由 CI 复采。** 依据迁移方案 §8.2 第 18 行口径——「跨环境差异（CI 与本地渲染差异）若无法消除，则**以 CI 生成为唯一基线来源，不采用本地快照作为判定依据**」。因此移除 `continue-on-error` 前，必须先在 ubuntu runner 上以 CI 产物为准复采参考态（`pnpm test:visual:reference`）并刷新预算；在完成该复采前，本地快照不得作为判定依据，`continue-on-error` 不得移除。该前置同步落于 `.github/workflows/test.yml` 的 visual job 注释。

### 7.1 首次落地结果（2026-10-14，快照时点＝首次落地）

> 下述路由计数是**首次落地时点**的快照；逐路由迁移的最新状态以 §7.2 与 `tests/visual/parity/routes.ts` 为单点事实源。

- 参考态采集：首轮 22 个 testName 全部就绪（当时已迁移 3 路由用 `--revert` 取迁移前原貌；待迁移 8 路由取 HEAD）。环境元数据见 `tests/visual/parity/reference-manifest.json`。
- 门禁实测：`pnpm test:visual:parity` 22 用例全绿；已迁移 3 路由的未归因差异为 0（实测差异已全部登记进允许清单），详见 [偏差处置表 §校准记录](./visual-parity-deviation-register.md#校准记录)。
- 注意：Playwright 的 `updateSnapshots` 默认值为 `'missing'`，不可用于判定「采集模式」；采集由显式环境变量 `PARITY_CAPTURE=1` 触发（见 `tests/visual/parity/helpers.ts`）。

### 7.2 逐路由推进（2026-10-14 起滚动更新）

- `/admin/waitlist` 于 2026-10-14 迁入 `MIGRATED_ROUTES`：参考态沿用其迁移前 HEAD 采集（等价 `--revert <迁移提交>`），允许清单按实测校准（浅 9533px / 深 15602px）。
- 迁移路由的参考态若需以 `--revert` 重采，命令为 `pnpm test:visual:reference -- --revert=<迁移提交> --only=<route-name>`；就地采集的路由应改用 `--revert` 以消除依赖漂移后再复采。
- **覆盖保护口径修正（2026-10-14）**：`buildHeadCaptureGrepArgs` 原先只排除 `source` 以 `worktree` 开头的清单条目，故**就地（`in-place`）采集的待迁移路由**在迁移落地后会被下一次 HEAD 全量采集覆盖成「迁移后渲染」，门禁退化为自比自（`/admin/waitlist` 分区二审计发现）。现改为「**磁盘上已存在 `<name>.reference.png` 的 testName 一律排除**」；需要专门刷新某条参考态时显式使用 `--only=<name>`。该契约由 `tests/scripts/capture-visual-reference.test.ts` 覆盖。

## 8. 相关文档

- [迁移方案 §8.2](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)
- [偏差处置表](./visual-parity-deviation-register.md)
- [测试规范 §7.2](../../standards/testing.md#72-视觉一致性门禁-visual-parity-gate)
