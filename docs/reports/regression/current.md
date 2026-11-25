# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径（迁移期，已随路由择库机制退役）：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；PrimeVue 卸载后由 `tests/modules/primevue-residual-guard.test.ts` 以全仓零残留口径替代。

<!-- regression-window:start:periodic-regression:phase-close:2026-11-26 -->
## 2026-11-26 第八十五阶段收口（人工回填）

- 执行入口: 分项执行 `pnpm lint` / `typecheck` / `lint:css` / `lint-md` / `test:visual` / `test:visual:parity` / 移动视觉 `test:visual:mobile` / 移动 E2E（5 个 spec × chromium/firefox/webkit, workers=1）与 `docs:check:{planning-docs,line-count,links,i18n}`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-25-phase85-item{1..9}-*.md`、`../../../artifacts/review-gate/2026-11-25-phase85-shell-forms/touch-targets.json`
- 结果摘要: **Pass**。lint 0 error（10 root + 3 cli 既有 warning）/ typecheck EXIT 0 / lint:css 0 error / lint-md 通过；移动视觉 **26/26**（24 路由 + 2 空态基线）、桌面视觉 **32/32**、parity **82/83**（`user-settings-dark` 3,199px / 0.247% 既有头像数据态，CI 裁决）；移动 E2E **42 passed**（14 用例 × 3 浏览器，workers=1）；`css-viewport-units` 守卫 4 passed（7 处 `dvh` 均有 `vh` 回退）；分页以 12 篇临时文章验证出现 / 44×44 / 点击切页 / URL 变化
- 回归窗口: 7 个活动窗口 / 7 条记录（2026-11-18 ~ 2026-11-26），归档判定=窗口健康。
- Review Gate: `Pass`（85.1–85.2 逐条 Gate；85.3/85.4/85.5 分区并行，R1 Reject → R2/R3 Pass；骨架屏基线登记 backlog 候选 #6）。
- 未覆盖边界: 真机刘海 / 手势条、iOS 键盘遮挡与系统剪贴板未实测；骨架屏独立视觉基线转 backlog 候选 #6；本机 `user-settings-dark` parity 差异以 CI 为裁决。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-26 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-25 -->
## 2026-11-25 第八十四阶段收口（人工回填）

- 执行入口: 分项执行 `pnpm lint` / `typecheck` / `lint:css` / `lint-md` / `test:visual` / `test:visual:parity` / 干净全量 `vitest run --coverage`（清缓存 + `--fsModuleCache=false`）与全部 `docs:check:*`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-24-phase84-item{1,2,3,4,5,6}-*.md`、`../../../artifacts/coverage/2026-11-24-phase84-item4/`、`../../../artifacts/governance/eslint-rules-inventory-84-final.json`
- 结果摘要: **Pass**。lint 0 error / typecheck EXIT 0 / lint:css 0 error / lint-md 通过；干净全量 coverage EXIT 0（649 文件 / 6,177 tests / 1 skipped），statements **87.92%**（34,929 / 39,726，较 87.58% +0.34pp）；`test:visual` 32/32、parity 本机 82/83（`user-settings-dark` 3,199px / 0.247% 既有头像数据态，CI 裁决）；duplicate-code 0.31% strict Pass；inventory `no-unsafe-argument` 0 命中 / 0 warning / 0 豁免 / effectiveSeverity 2；字号 inventory `scale 0` / token 274（59.96%）；docs 门禁 line-count / planning-docs / links / i18n / markers / source-of-truth 全部通过
- 回归窗口: 7 个活动窗口 / 8 条记录（2026-11-18 ~ 2026-11-25），归档判定=窗口健康。
- Review Gate: `Pass`（84.1 / 84.2 / 84.3 / 84.4 / 84.5 / 84.6 各自 Gate 见 todo-archive；归档文档本轮 Gate Pass）。
- 未覆盖边界: i18n ALS 真正修复转 backlog #5；`login`/`register` 认证页骨架、CLI parser 契约统一待下一批；本机 vitest `virtual:intlify-i18n` 缓存污染需清缓存或依赖 CI；typed `no-unsafe-argument` 不覆盖 `.vue`。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-25 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-24 -->
## 2026-11-24 第八十三阶段收口补跑与归因（人工回填）

- 执行入口: `E2E_PORT=3015 pnpm regression:phase-close`（首跑发生于 2026-11-24 00:12 +08:00，脚本按 UTC 记为 2026-11-23，窗口按本地日期归入本键）→ 失败项定位后定向复验
- 证据 artifact: `../../../artifacts/review-gate/2026-11-23-phase83-close.md`、`../../../artifacts/review-gate/2026-11-23-phase83-close-regression.log`
- 结果摘要: 首跑 `Reject`（11/13，`test:coverage` PASS / `release:check:full` FAIL）；两项失败均已归因并复验——① `docs:check:source-of-truth` 因 `docs/guide/translation-governance.md` 已在第八十三阶段条目 2 压缩、四语镜像未同步，补 `last_sync: 2026-11-24` 与同步说明后复跑 **PASS**；② `test:e2e` 在本机 load average 33（同机另有 `/work` Nuxt 构建与多个 headless Chrome）下大面积超时，负载回落后定向复验：`theme-switcher` + `submit` 9/9 通过、`seo-regression` 7/7 通过、`user-workflow` 16 通过 + 1 flaky（重试通过）+ 3 skipped。
- 已执行验证: test:coverage=PASS（836.5s，statements 87.58%）；release:check:full=11/13（lint 580.8s / lint:i18n / i18n:audit:missing / lint:css / lint:md / test 490.2s / typecheck / line-count / planning-docs / security:audit-deps / security:alerts 全 PASS；source-of-truth 与 test:e2e 见上）；docs:check:source-of-truth 复跑 PASS
- 回归窗口: 6 个活动窗口 / 7 条记录（`entryCount` 口径含说明节，2026-11-18 ~ 2026-11-24），归档判定=窗口健康。
- Review Gate: `Pass`（唯一 blocker 为环境性 E2E 与镜像同步，均已复验；CI 为最终裁决）。
- 未覆盖边界: 本机 `user-settings-dark` parity 头像数据态差异 3,199px / 0.247% 沿用既有处置；`user-workflow` 的 `commercial link thumbnails` 用例在负载下 flaky（重试通过），登记待 CI 观察。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-24 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-23 -->
## 2026-11-23 阶段收口前周期性回归（自动回填 + 收口复验）

- 执行入口: `pnpm regression:phase-close`（首跑）→ 按 required 命令逐项复验
- 证据 artifact: `../../../artifacts/review-gate/2026-11-23-phase-close-regression.md` / `.json`；收口逐项映射 `../../../artifacts/review-gate/2026-11-23-phase82-close.md`
- 结果摘要: 首跑在 `test:coverage` 被既有并发 flake `pages/submit.test.ts` 阻断（该文件孤立复跑 6/6 通过）；按 required 命令逐项复验后 **Pass**（blocker=0）。
- 已执行验证: test:coverage=EXIT 0（645 文件 / 6,125 例通过 + 1 跳过，statements 87.27%）；release:check:full=12/13（仅 `docs:check:source-of-truth` 待四语 roadmap 镜像同步，本归档提交修复；其余 lint / lint:i18n / lint:css / lint:md / test / typecheck / security / build / E2E 全绿）；docs:check:i18n / line-count / planning-docs=PASS；test:perf:budget:strict=PASS（coreEntryJs 291.64KB / 335KB、keyCss 60.21KB / 62KB）；duplicate-code:check:strict=PASS（0.32%）；review-gate:generate:check=PASS
- 回归窗口: 本窗口并入 2026-11-23 近线记录，归档判定=窗口健康。
- Review Gate: `Pass`（首跑 flake 已孤立证伪，coverage 以干净全量跑为裁决）
- 未覆盖边界: 本机 parity 82/83（`user-settings-dark` 头像数据态，CI 裁决）；本机 3001 端口被外部占用，E2E / 视觉以 `E2E_PORT=3015` / `E2E_INSTALLATION_PORT=3016` 运行

<!-- regression-window:end:periodic-regression:phase-close:2026-11-23 -->

<!-- regression-window:start:maintenance:caomei-ui-upgrade:2026-11-22 -->
## 2026-11-22 caomei-ui 1.3.0 → 1.4.0 维护批次

- 执行入口: 人工升级（按 §3.8 / §5.6 升级纪律）；上游 `1.4.0` 无 `BREAKING CHANGES`，exports 13 键不变
- 证据 artifact: `../../../artifacts/review-gate/2026-11-22-caomei-ui-1.4.0.md`
- 结果摘要: `Pass`；blocker=0，warning=2（`CaomeiButton` fragment 根导致父级 scoped 选择器失效，已全仓修复 22 处；主题画廊卡片宽度 +12px，已重采基线并登记）。
- 已执行验证: typecheck=0 error、lint=0 error、lint:css=PASS、build=success、`test:visual`=32/32（画廊 2 条重采）、`test:visual:parity`=82/83（唯一失败 `user-settings-dark` 为本机 `TEST_MODE` 头像已知偏差，CI 为 83/83）、全量单测=638 文件通过 / 2 既有 flake / 1 跳过（6061 例通过；两例孤立复跑 28/28）、`test:e2e:critical`=19/19、admin + admin-workflow E2E=246 passed / 3 flaky、包体 `coreEntryJs` 291.63/335KB、`keyCss` 60.21/62KB、`maxAsyncChunkJs` 92.56/130KB、`prIncrementJs` 11.01/20KB。
- 回归窗口: 代码侧修复 3 类上游形态变化——`CaomeiButton` fragment 根的 scoped 属性断链（25 文件 / 35 个 class 选择器 `:deep()`）、`CaomeiTooltipText` 行盒 +3px（`styles/main.scss` 未分层 `vertical-align: top`）、按钮单行截断契约导致的画廊卡片 +12px（重采基线）；新增能力本批不采纳。
- Review Gate: `Pass`（standard 档）；上游 API 差分 0 个 prop / 导出移除，19 个新组件均为 `Caomei*` 前缀，无本地同名冲突。
- 未覆盖边界: 受控列可见性 / 顺序 / 宽度、固定表头、`selectAllScope`、列宽拖拽、`allowEmptyValue` 与新组件族未采纳；悬停态内建提示未纳入静态基线；全量 E2E 未重跑，CI 为最终裁决。
<!-- regression-window:end:maintenance:caomei-ui-upgrade:2026-11-22 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-21 -->
## 2026-11-21 阶段收口前周期性回归（自动回填）

- 执行入口: `E2E_PORT=3101 E2E_INSTALLATION_PORT=3102 pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-21-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-21-phase-close-regression.json`；映射说明 `../../../artifacts/review-gate/2026-11-21-phase81-close.md`
- 结果摘要: 本机首跑 `test:coverage` 被 2 个既有并发 flake 阻断（`components/app-header.test.ts` drawer 点击、`pages/admin/comments/index.test.ts` 筛选后 fetch 次数）；两文件孤立复跑 24/24 通过。CI Test run `44869703295` 的 Coverage job 通过，作为最终裁决。
- 已执行验证: test:coverage=CI PASS（本地 `--retry=2` 全量 640 passed / 1 skipped）；release:check=11/11 PASS；docs:check:i18n / line-count PASS；test:perf:budget:strict PASS；duplicate-code:check:strict PASS；review-gate:generate:check PASS
- 回归窗口: 52 行 / 3 条，归档判定=窗口健康。
- Review Gate: `Pass`（本机 flake 已逐例证伪，CI 兜底）。
- 未覆盖边界: 本机 `user-settings-dark` parity 头像差异为本机 TEST_MODE 数据态（CI 83/83），不登记 allowlist；ALS 注入失效为既有缺陷，登记 backlog 国际化主线。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-21 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-19 -->
## 2026-11-19 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-19-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-19-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 46 行 / 2 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 本机运行记录: 第 1 次在 `test:e2e` 被 webkit 管理端导航层 flake（`Frame load interrupted`）与本阶段新增 E2E 的菜单点击时序阻断；第 2 次在 `test (Vitest)` 被 `pages/admin/posts/index.test.ts`「翻译徽标点击」的「点击后立即断言」flake 阻断；第 3 次 `Pass`。前者已给菜单点击加有界重试，后者按第七十九阶段口径补 `settleUi`（该文件连跑 3 次 24/24 通过）。
- 未覆盖边界: 本机 `user-settings-dark` parity 仍有 1 条头像兜底数据态差异（CI 通过，已在偏差处置表登记）；边缘 `cf-cache-status` 未在仓库内验证。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-19 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-18 -->

## 2026-11-18 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-18-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-18-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 39 行 / 3 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-18 -->
