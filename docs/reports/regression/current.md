# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径（迁移期，已随路由择库机制退役）：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；PrimeVue 卸载后由 `tests/modules/primevue-residual-guard.test.ts` 以全仓零残留口径替代。

<!-- regression-window:start:ui-s1:空态三态与层序收尾:2026-11-10 -->
## 2026-11-10 UI S1 收尾：空态三态、空表分页与三处层序失效

- 执行入口: `pnpm build`、`pnpm test:visual`、`pnpm test:visual:parity`、`pnpm lint` / `pnpm lint:css` / `pnpm typecheck`、定向 `pnpm exec vitest run`（11 文件）、`pnpm i18n:check-sync` / `i18n:audit:missing` / `docs:check:i18n`、`pnpm docs:check:links` / `docs:check:line-count` / `lint-md`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-10-phase73-entry1-ui.md`、`../../../artifacts/review-gate/entry1/`（截图 + `empty-states.json` / `layer-order.json`）
- 结果摘要: `Pass`；blocker=0，warning=1（google 品牌蓝 `#4285f4` 白底 3.56:1，登记为品牌色例外）。
- 变更范围: 新增 `AppEmptyState`（图标 + 说明 + 主操作），替换 7 个文件对 `pages.posts.empty` 的复用并按对象补齐五语 key（评论 / 订阅者 / 候补 / 分类 / 标签 / 文章管理 + 公开列表说明）；空表分页改为 `total > 0` 才渲染（5 处绑定，分类 / 标签共用组件）；`.social-btn` 与 `.admin-form-dialog` 宽度钩子移出 `@layer momei-base`；`docs/design/ui.md` §3.1–§3.4 按 caomei-ui 重写。
- 实测: 空态 8 处（明暗）图标 / 说明 / 操作齐全且分页隐藏；社交按钮品牌色 light `rgb(36,41,46)` / `rgb(66,133,244)`、dark `rgb(255,255,255)`；弹窗 608 / 576 / 544px；徽标 24px / 32px；`/posts` 错误态含重试。
- 基线: `admin-comments-list` 明暗两张按新空态重采；parity `admin-categories-list` / `admin-tags-list` 明暗四条表格区允许带 240 → 276px 重取，声明值 = 最终实测（6999 / 9528 / 6540 / 9095），其余 78 条未变（83 = 82 条比对 + 1 条登记用例）。
- 回归窗口: 10 行 / 1 条，归档判定=窗口健康。
- Review Gate: `Reject` → `Pass`（Round 1 blocker：空态与页头双 primary、证据引用失真；Round 2 blocker：`ui.md` 分页口径与实现相反；Round 3 仅复审修复点，taxonomy 错误分支测试登记为已知边界）。
<!-- regression-window:end:ui-s1:空态三态与层序收尾:2026-11-10 -->

<!-- regression-window:start:security-gate:发布安全门禁收口:2026-11-10 -->
## 2026-11-10 发布安全门禁收口：Code Scanning #43、过期台账与去过渡模式

- 执行入口: `pnpm security:alerts`（无 `--transition-mode`）、`pnpm security:audit-deps`、`pnpm exec vitest run tests/scripts/check-doc-markers.test.ts`、`pnpm lint` / `pnpm typecheck`、`pnpm docs:check:links` / `lint-md`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-10-security-alerts.md`（+ `.json`）
- 结果摘要: `Pass`；blocker=0，warning=0（`transition findings: 0`、`high+ blocking alerts: 0`）。
- 变更范围: `scripts/docs/check-doc-markers.mjs` 的孤立尾行正则改为同时接受 `-->` / `--!>`（HTML5 comment end bang state）并补单测；GitHub 侧把 #43 由 `won't fix` 重分类为 `false positive`，台账登记 `category: false-positive`、`location`、`expiresAt: 2027-05-15`；移除 `package.json` 的 `--transition-mode`；删除 mjml（已无告警）与 quill（降为 low、无补丁）两条过期台账；同步 `docs/standards/security.md §5.3` 与 dismissed / fail-closed 治理文档。
- 验证: `security:alerts` Pass（transition off、excepted 1、warning 0）；`security:audit-deps` Pass（relevant risks 0）；`check-doc-markers.test.ts` 20 passed。
- 回归窗口: 8 行 / 1 条，归档判定=窗口健康。
- Review Gate: `Reject` → `Pass`（Round 1 blocker：`security.md §5.3` 规范正文含日期 / 阶段号历史叙述；warning：quill 无落点、CI 证据未取证、旧 transition 口径残留、回归记录预填 Pass；Round 2/3 仅复审修复点）。
<!-- regression-window:end:security-gate:发布安全门禁收口:2026-11-10 -->

<!-- regression-window:start:dependency-upgrade:nuxt 4.6.4 安全升级与视觉基线归因:2026-11-10 -->
## 2026-11-10 nuxt 4.6.4 安全升级与视觉基线归因

- 执行入口: `pnpm build`、`pnpm test:visual`（归因后 `--update-snapshots` 重采再复跑）、`pnpm test:visual:parity`、`pnpm test`、`pnpm lint` / `pnpm lint:css` / `pnpm typecheck`、`pnpm security:audit-deps`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-10-nuxt-4.6.4-upgrade.md`
- 结果摘要: `Pass`；blocker=0，warning=1（首页 SWR 因 i18n 响应 `Set-Cookie` 不再缓存，已登记 backlog 候选）。
- 变更范围: nuxt 4.6.4 依赖升级由 base 的 `8e354fa3`（dependabot，PR #1004）合入，本提交不再包含 `package.json` / `pnpm-lock.yaml`；源码仅 `components/admin/settings/theme-preview-section.vue` 预览日期固定为常量，消除主题工作台基线每日漂移；14 张视觉基线全部重采（其中 `admin-theme-settings` 2 张额外因日期固定再采），rebase 到含 rollup 4.68.0 / moment / qs 等 bump 的 base 后复跑仍 32 passed。
- 基线归因: ① 页头整体右移 144px——4.6.3 下 `caomei-ui` 按钮规则压过组件 `display:none`，桌面端多渲染 3 个本应隐藏的控件（`mobile-only` ×2 + `compact-admin-posts`）；② 主题画廊弹窗 364 → 384px——`:deep(.caomei-card__body)` 的 `1.25rem` padding 恢复生效；③ 页脚外链图标为 0.45px 亚像素抗锯齿差异（bbox 与颜色一致）；④ `admin-theme-settings` 预览卡日期由动态改为固定常量后重采。
- 缓存实测: `/robots.txt` / `/sitemap_index.xml` 两次请求 SWR 命中且响应头符合新规则；`/` 每次响应带 `set-cookie: i18n_redirected=zh-CN`，按 2.13.6 规则不缓存；`/posts/:slug` 无 cookie，`isr` 仍由 Vercel CDN Tier 2 承担。
- 验证: `pnpm build` = success；`test:visual` 32 passed（重采后两次运行一致）、`test:visual:parity` 83 passed、`test` 601 files / 5272 passed（1 skipped）、`lint` / `lint:css` / `typecheck` 0 error、`security:audit-deps` Pass（relevant risks 0）。
- 备注: `.output/nitro.json` 的 `nitro: 2.13.5` 来自上游包内硬编码 meta（`nitropack@2.13.6` 未同步），运行时实际为 2.13.6（含 `isCacheableResponse`）。
- 回归窗口: 40 行 / 2 条，归档判定=窗口健康。
- Review Gate: `Pass` / `warning`×4（文档口径、动态日期、窗口顺序、勾选时序），均已按审计意见修正。
<!-- regression-window:end:dependency-upgrade:nuxt 4.6.4 安全升级与视觉基线归因:2026-11-10 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-09 -->
## 2026-11-09 阶段收口前周期性回归（自动回填 + 环境补装复跑）

- 执行入口: `pnpm regression:phase-close`（12 步中 11 步通过）+ 补齐 Playwright 浏览器后单独复跑 E2E
- 证据 artifact: `../../../artifacts/review-gate/2026-11-09-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-09-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=1（E2E 因本机 Playwright 浏览器版本落后于依赖升级后的 Playwright，补装后复跑通过）。
- 已执行验证: test:coverage=PASS（600 passed / 1 skipped，Statements 81.82%）、release:check:full 的 11/12 步 PASS（lint / lint:i18n / i18n:audit:missing / lint:css / lint:md / test / typecheck / docs:check:line-count / docs:check:source-of-truth / security:audit-deps / security:alerts）、docs:check:i18n=PASS、docs:check:line-count=PASS、test:perf:budget:strict=PASS、duplicate-code:check:strict=PASS（0.39%）、review-gate:generate:check=PASS（5/5）。
- 回归窗口: 25 行 / 1 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 补充证据: 补装 chromium / firefox 1572 / webkit 2388 后 `pnpm exec playwright test` **227 passed / 1 flaky / 58 skipped**（6.1m）；包体 `coreEntryJs` 331,206 B / 335KB、`keyCss` 60,482 B / 62KB、`maxAsyncChunkJs` 56,916 B / 130KB（依赖升级后重建产物复测，已刷新基线）。
- 环境说明: 本机 `~/.cache/ms-playwright` 缺少依赖升级后 Playwright 所需的 firefox 1572 / webkit 2388；CI 的浏览器安装步骤自带对应版本，不受影响。E2E 的 1 个 flaky 为既有 webkit 管理端用例（重试通过）。
<!-- regression-window:end:periodic-regression:phase-close:2026-11-09 -->
