# 墨梅博客 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 深度归档索引

> 索引表按阶段倒序；`归档日期` 取分片首次入库日期。新增分片必须匹配 `todo-archive-phases-<起>[-<止>].md`，并同步登记本表与 [archive/index.md](./archive/index.md)。

| 阶段 | 主题 | 归档文件 | 归档日期 |
| :--- | :--- | :--- | :--- |
| 69 | PrimeVue → caomei-ui 迁移（三）与内建文案 locale 接线 | [todo-archive-phases-69.md](./archive/todo-archive-phases-69.md) | 2026-11-15 |
| 65-68 | 编辑器续航、覆盖率攻坚与 caomei-ui 迁移（一）（二） | [todo-archive-phases-65-68.md](./archive/todo-archive-phases-65-68.md) | 2026-11-14 |
| 64 | 设置 UI Phase 2 与治理续航 | [todo-archive-phases-64.md](./archive/todo-archive-phases-64.md) | 2026-11-05 |
| 61-63 | AI 编辑增强、迁移适配扩展与设置 UI 盘点 | [todo-archive-phases-61-63.md](./archive/todo-archive-phases-61-63.md) | 2026-09-25 |
| 58-60 | HTTP MCP、AI 编辑增强与代码质量治理 | [todo-archive-phases-58-60.md](./archive/todo-archive-phases-58-60.md) | 2026-08-13 |
| 52-57 | 缓存架构、CLI/MCP 复用与迁移体验 | [todo-archive-phases-52-57.md](./archive/todo-archive-phases-52-57.md) | 2026-07-24 |
| 50-51 | PWA 启用、边界收敛与治理增压 | [todo-archive-phases-50-51.md](./archive/todo-archive-phases-50-51.md) | 2026-07-24 |
| 46-49 | 隐私部署、接口契约与深度治理 | [todo-archive-phases-46-49.md](./archive/todo-archive-phases-46-49.md) | 2026-07-22 |
| 42-45 | AI 深化、友链生态、隐私闭环与文档治理 | [todo-archive-phases-42-45.md](./archive/todo-archive-phases-42-45.md) | 2026-07-07 |
| 32-41 | 内容资产化、性能、Postgres 与 TypeORM 前置治理 | [todo-archive-phases-32-41.md](./archive/todo-archive-phases-32-41.md) | 2026-06-14 |
| 25-31 | 部署体验、数据库流量、国际化与认证预研 | [todo-archive-phases-25-31.md](./archive/todo-archive-phases-25-31.md) | 2026-05-18 |
| 22-24 | 质量有效性、社交 / AI 优化与回归执行 | [todo-archive-phases-22-24.md](./archive/todo-archive-phases-22-24.md) | 2026-04-28 |
| 11-21 | 迁移治理、内容编排与质量门禁闭环 | [todo-archive-phases-11-21.md](./archive/todo-archive-phases-11-21.md) | 2026-04-28 |
| 01-10 | MVP 到生态深化与通知闭环 | [todo-archive-phases-01-10.md](./archive/todo-archive-phases-01-10.md) | 2026-04-28 |

> v1 起：新增归档块按 [规划文档模型 v1](../standards/planning-docs.md) 的 6 项必填填写；本文件已有的近线归档块保持原样，不回改。
> 深度归档治理规则见 [archive/index.md](./archive/index.md)。

## 主窗口保留范围

- 主文档当前保留第七十至第八十三阶段共 14 个近线归档块（`411` 行，`docs:check:line-count` 口径，低于 warning `500`，暂不迁出）；行数为唯一硬约束，归档块数量只作观察项。
- 深度归档索引已改为 4 列表格（阶段 / 主题 / 归档文件 / 归档日期），倒序覆盖 14 个 todo 分片；新增分片必须同步更新本表。
- 第六十五至第六十八阶段与第六十九阶段的完整待办归档正文分别见 [archive/todo-archive-phases-65-68.md](./archive/todo-archive-phases-65-68.md)、[archive/todo-archive-phases-69.md](./archive/todo-archive-phases-69.md)。
- 第一至第六十四阶段的完整待办归档正文已迁入区间分片。
- 后续若近线窗口再次膨胀，继续按 archive/index.md 的规则把更早阶段整体迁出。

---

## 第八十三阶段：规则面收口与文档/覆盖率滚动治理（已审计归档）

> **归档块模型**: v1

-   **阶段名与时间**: 第八十三阶段 · 2026-11-23 ~ 2026-11-24
-   **大条目清单与状态**: 1. `.vue` 非空断言清零与规则面收口（[x]）；2. 文档规范压缩切片（[x]）；3. 覆盖率第二十四批（[x]）；4. 字号归一第六批 A（[x]）
-   **提交清单**: `3f7d0c20`（立项）；`dde8afb4`（83.1）；`81ae829d`（83.2）；`2235c0b8`（83.3.1 基线回填）；`8e87eae8`（83.3）；`0d28324c`（83.4）
-   **质量门结果**: 干净全量 `test:coverage` EXIT 0，statements **87.58%**（34,768 / 39,697，较本批 83.3.1 复算基线 34,647 / 39,697 **+0.305pp**；该基线与第八十二阶段收口的 34,642 / 39,694 分母 +3，不可直接相减）；`pnpm lint` 0 error（10 root + 3 cli 既有 warning）、`typecheck` 0 error、`lint:css` 0 error、`lint-md` 通过；`test:visual` 32/32、parity 本机 82/83（`user-settings-dark` 3,199px / 0.247% 既有 TEST_MODE 头像数据态，CI 裁决）；`docs:check:planning-docs` / `links`（372 md、321 md markers）/ `i18n` / `source-of-truth` / `governance:check:index` 通过；阶段收口 `regression:phase-close` 结论见 `artifacts/review-gate/2026-11-23-phase83-close.md`
-   **Review Gate 结论与轮次**: 立项 R1 Reject → R2 Pass；83.1 R1 Pass → W1 修复 → R2 Pass；83.2 R1 Reject → R2 Reject → R3 Pass；83.3 R1 Reject → R2 Reject → R3 Pass；83.4 R1 Pass（W1–W3 文档事实项已修）；归档文档本轮 Gate
-   **未覆盖边界**: ① `audit-comment-drift` / `check-duplicate-code` / `audit-field-copy` 余 27 / 6 / 2 条 statements（`main()` 直执行守卫与外部命令错误分支不可达）；② inventory `stripComments` 对 `accept="image/*"` 盲区（3 文件，修好后预期 token +4 / scale +1，backlog #9 待跟踪）；③ `snippet-edit-dialog.vue` 弹窗与 `external-feed-panel` 无直接逐元素视觉证据；④ 本机 `user-settings-dark` parity 差异以 CI 为裁决；⑤ `docs/guide/deploy.md` 274 行仍在候选 warn 线
-   **规划正文**: [roadmap 分片](./archive/roadmap-phases-83.md)

## 第八十二阶段：质量滚动治理与债务收敛（已审计归档）

> **归档块模型**: v1

-   **阶段名与时间**: 第八十二阶段 · 2026-11-22 ~ 2026-11-23
-   **大条目清单与状态**: 1. 覆盖率第二十三批（[x]）；2. 字号归一第五批（[x]）；3. 静态规则债第五批（[x]）；4. 结构复用切片（[x]）
-   **提交清单**: `f8a2f385`（立项）；`ac4cb00f`（82.1）；`d66239ad`、`fdd1933c`、`386c1f9f`（82.2）；`e625a1e9`、`bef0f871`、`18cd75b8`（82.3）；`6ceb2767`、`6d173e74`、`cfa05aae`（82.4）；`255b2602`、`e9e4a76d`、`6f2f5a02`（进度回填）；`80032677`（eslint 忽略 `.session`）
-   **质量门结果**: 干净全量 `test:coverage` EXIT 0（645 文件 / 6,125 例通过 + 1 跳过，statements **87.27%**，34,642 / 39,694）；`release:check:full` 12/13（唯一失败 `docs:check:source-of-truth` 为四语 roadmap 镜像待本归档提交同步，归档提交后修复；其余 lint / lint:i18n / lint:css / lint:md / test / typecheck / security / build / E2E 全绿）；`test:perf:budget:strict`（`coreEntryJs` 291.64KB / 335KB、`keyCss` 60.21KB / 62KB）；`duplicate-code:check:strict` 0.32%；`docs:check:i18n` / `line-count` / `planning-docs` 与 `review-gate:generate:check` 通过；`test:visual` 32/32、parity 82/83（本机头像数据态，CI 裁决）
-   **Review Gate 结论与轮次**: 82.1 R1 Reject → R2 Pass；82.2 分区 A/B R1 Pass；82.3 分区 A R1 Reject → R2 Pass、分区 B R1 Pass（条件已闭环）；82.4 分区 A/B R1 Pass；归档文档本轮 Gate
-   **未覆盖边界**: ① `.vue` 内 10 处非空断言（3 文件）未纳入规则面；② `**/migration-*.ts` 命中的 4 个生产模块维持 `[0]`（backlog #10 待跟踪）；③ `login.vue` ↔ `register.vue` 140 行模板与 CLI / `post-export` 的 fence 解析重复；④ 本机 3001 端口被占用，视觉 / E2E 以 `E2E_PORT=3015` 运行；⑤ 本机 `user-settings-dark` parity 头像数据态差异以 CI 为裁决
-   **规划正文**: [roadmap 分片](./archive/roadmap-phases-82.md)

## 第八十一阶段：质量底线与债务收口（已审计归档）

> **归档块模型**: v1

-   **阶段名与时间**: 第八十一阶段 · 2026-11-21 ~ 2026-11-21
-   **大条目清单与状态**: 1. Weekly 安全告警门禁 403 与 fallback 测试隔离（[x]）；2. 覆盖率第二十二批（[x]）；3. 静态规则债第四批（[x]）；4. 字号归一第四批（[x]）；5. 规划文档 v1 首轮实战与回归窗口插入修复（[x]）
-   **提交清单**: `b5eed8f8`、`d398ea18`（81.1，81.1.3 为复跑验证不单独提交）；`1b517ae0`（81.2）；`8f560060`、`0762e86b`、`10639741`、`096bd653`（81.3）；`689469f1`（81.4）；`1e117400`、`b78c2092` 与本归档提交（81.5）
-   **质量门结果**: CI Test `44867691632` / `44869703295` 全绿（Unit / Coverage / Visual 32 + parity 83 / E2E / Build & Lighthouse）；Weekly Regression `44847021795` success；同源 statements 86.35% → 86.69%（+0.34pp）；`pnpm lint` 0 error、`typecheck` / `lint:css` / `lint-md` 通过；docs links 366 文件、markers 315 文件、planning-docs / line-count / source-of-truth 通过。阶段收口 `regression:phase-close` 本机首跑被 2 个既有 coverage 并发 flake 阻断，孤立复跑 24/24 通过；required 命令逐项映射见 `artifacts/review-gate/2026-11-21-phase81-close.md`（test:coverage 以 CI Coverage job 为最终裁决）
-   **Review Gate 结论与轮次**: 81.1 R1 Reject → R2 Pass；81.2 R1 Pass（W1 修复）→ R2 Pass；81.3 并行双分区 R1 Pass + R2 Pass；81.4 R1 Reject → R2 Pass；81.5 归档 R1 Reject → R2 Pass
-   **未覆盖边界**: ① `server/middleware/i18n.ts` 的 ALS 注入失效为既有缺陷，登记 backlog 国际化主线；② `no-confusing-void-expression` 为 typed 规则，`.vue`、scripts、tests、migrations 维持既有豁免；③ 本机 `user-settings-dark` parity 头像差异为本机 TEST_MODE 数据态，CI 已 83/83，不登记 allowlist；④ `GH_TOKEN` secret 权限由 CI 运行证明，失效时门禁按 fail-closed 判 Reject
-   **规划正文**: [roadmap 分片](./archive/roadmap-phases-81.md)

## 第八十阶段：功能与体验收口（已审计归档）

> 归档说明: 第八十阶段 6 条条目已于 2026-11-19 完成并归档（2026-11-19 立项并收口）；阶段规划正文见 [roadmap 分片](./archive/roadmap-phases-80.md)，Review Gate 证据见 `artifacts/review-gate/2026-11-19-phase80-item{1..6}.md`。

- [x] **1. CLI 迁移断点续传（P2 功能）**
    - **完成摘要**: 新增 `packages/cli/src/import-state.ts`（状态文件默认 `<sourceDir>/.momei-migration-state.json`，记录相对路径 / 内容哈希 / `pending·success·failed·skipped` / `postId` / 错误 / 更新时间）与 `--resume` / `--state-file` / `--clean-state`；损坏或缺失状态文件降级为空状态并提示，写盘失败不阻断导入，`--dry-run` 不读写状态，内容哈希变化不误跳过。新增 24 例单测（`import-state.test.ts` 16 例 + `import-command.test.ts` 8 例），`packages/cli` 12 文件 / 176 例全绿。提交 `bc93c165`，Review Gate Pass。

- [x] **2. 首页缓存与语言检测解耦（P2 性能 / SEO，受控纳入）**
    - **完成摘要**: `detectBrowserLanguage.useCookie` 置 `false`，偏好改由 `composables/use-locale-preference.ts` 在显式切换时写入，`plugins/i18n-preference.client.ts` 于 `app:mounted` 后仅在根路径做客户端应用（不进 SSR 响应头）。`/` 现返回 `cache-control: s-maxage=3600, stale-while-revalidate` 且无 `Set-Cookie`，五语根重定向与 `htmlLang` 正确。新增 `tests/e2e/i18n-locale-preference.e2e.test.ts` 7 例（五语重定向 / 显式切换与回访 / 首页响应头）与 `pnpm probe:i18n-cache` 探针；E2E 配置固定 `locale: 'zh-CN'` 保证渲染确定性。排查结论：插件 setup 期调用 `useI18n()` 会让应用渲染错误页，i18n 状态须从 `nuxtApp.$i18n` 读取。提交 `5a6362e1`，Review Gate Pass。

- [x] **3. 字号归一第三批（P3 视觉）**
    - **完成摘要**: 15 文件 37 处等值字面量替换为 `var(--m-font-size-*)`（`components/admin/settings` 全部 20 处 + `styles/_onboarding.scss` 5 处 + `snippet-aggregate-dialog.vue` 7 处 + `link-governance.scss` 5 处），按单批 ≤10 文件拆为 A/B 两批提交；inventory 口径内待替换 **135 → 98**、token 化 **139 → 176**；逐元素 `getComputedStyle` 对账 **2,278 元素 0 差异**，`test:visual` 32/32、parity 83/83，tour 以 demo 模式启动后截图取证。提交 `fd47eb21` / `d85a4a7f`，Review Gate Pass。

- [x] **4. 覆盖率第二十一批（P2）**
    - **完成摘要**: 补 `check-line-count.test.ts` 18 例与 `probe-build-geometry.runtime.test.ts` 20 例；几何探针按「先抽纯函数再加用例」把等待 / 登录 / 测量 / 编排改为可注入依赖（真实浏览器与进程仍不单测）。模块覆盖 `check-line-count` **10/56 → 55/56**、`probe-build-geometry` **94/190 → 193/208**；干净全量 `pnpm test:coverage` 一次通过，同源 statements **85.97% → 86.35%（+0.38pp）**。提交 `94c1633c`（+ `057bec69` 修 Docker QA 类型检查），Review Gate Pass。

- [x] **5. PWA 依赖窗口与 generateSW 迁移（P2）**
    - **完成摘要**: `@vite-pwa/nuxt` 升 `^2.0.2`，`pwa.workbox` 迁移为 `pwa.generateSW`（缓存 / `skipWaiting` / denylist / glob 语义原样保留）。构建无 deprecated 警告，`sw.js` 23,402 B / 535 条预缓存、`workbox-*.js` 与 `manifest.webmanifest` 除 build id 外与迁移前逐字节一致；`probe:build-geometry` 3/3、`test:visual` 32/32、parity 83/83、安全门禁 Pass。提交 `dd2e5b6b`，Review Gate Pass。

- [x] **6. parity 参考态重采与允许清单清零（P2）**
    - **完成摘要**: CI `visual-reference-refresh.yml` run 44521494648（HEAD `bc93c165`）同一次运行重采 82 张参考态与 manifest（45 张字节变化），`prune:parity-allowlist` 清零 `user-settings` 明暗各 2 条允许清单，`admin-posts-list` 的「未归因·预算内吸收」随之关闭。本机 parity 82/83（余 1 条为 `/settings` 头像兜底的本机数据态差异），CI Visual Regression 通过。提交 `3199227c`（+ `17f87a03` 修文档相对链接），Review Gate Pass。

## 第七十九阶段：质量稳定性与门禁可信度（已审计归档）

> 归档说明: 第七十九阶段 6 条条目已于 2026-11-18 完成并归档（2026-11-18 立项并收口）；阶段规划正文见 [roadmap 分片](./archive/roadmap-phases-79.md)，Review Gate 证据见 `artifacts/review-gate/2026-11-18-phase79-item{1..6}.md`。

- [x] **1. 测试 flake 收敛与门禁可信度（P1 修复型）**
    - **完成摘要**: 定位三类确定性缺陷（`?.trigger` 静默跳过、单次 `nextTick` 不覆盖 async 处理器、`onMounted` 拉取未落地），新增 `tests/helpers/ui-interaction.ts`（`settleUi` / `clickWhenReady` / `expectEventually`）并统一 6 个已知用例；6 文件连跑 **20/20 次退出码 0（57/57 例）**，`pnpm test:coverage` **连跑 3 次全绿无 retry**（33,622/39,105 = 85.97%），`pnpm regression:phase-close` 本机一次 Pass。`networkidle` 待跟踪项结论为「明确保留」并写明重新评估条件。提交 `a1592fb6`，Review Gate Pass。

- [x] **2. 构建产物尺寸探针常驻（P2）**
    - **完成摘要**: 新增 `scripts/testing/probe-build-geometry.mjs` 与 `pnpm probe:build-geometry`，在生产 `.output` 上以 Playwright `getComputedStyle` 实测；真实产物 **3/3 通过**（`/settings` 64×64、`/admin/users` 32×32、合成 large 48×48）；`.output` 缺失时跳过并写明原因，`--dry-run` 只打印清单；以 `required: false` 接入 `regression:weekly` 并同步 `scripts/README.md`；单测 11 例覆盖解析 / 缺元素 / 失败路径。提交 `6b0eff0f`，Review Gate Pass。

- [x] **3. `reviewBy` 复核日期接入日常巡检（P2）**
    - **完成摘要**: `security:audit-deps:daily` 的 JSON / Markdown 增加 `allowlistReview` 段（过期 / 即将到期 / 计划内 / 未登记四类分桶），`security:alerts` 打印逐条复核日期；退出码与 severity 语义不变。真实 daily 产物含 6 条计划内台账；alerts 为 Pass。单测覆盖四类分桶与摘要缺省。提交 `cf1539f8`，Review Gate Pass。

- [x] **5. 覆盖率第二十批（P2）**
    - **完成摘要**: 补 `check-script-governance` 的空 / 非空报告、非法模式、`main` 落盘与产物路径分支，模块 statements **191/255 = 74.90% → 244/255 = 95.69%**（+20.79pp）、branches 85.93%；`capture-visual-reference` 维持 statements 98.69% / branches 88.11%。达成条目「模块级 +15pp / ≥85%」目标。提交 `b379eb0c`，Review Gate Pass。

- [x] **6. 依赖 PR 处置与已合并 major 的追溯评估（P2）**
    - **完成摘要**: #1068（`sanitize-html` 2.18.2，dependabot）已合并为 `6964e10d`，Test / Pages / Docker / TODO / CodeQL 全绿，`pnpm i --frozen-lockfile` 通过；`@vite-pwa/nuxt` 2.0.1 追溯评估结论为**保留**——`sw.js` + Workbox 8 运行时、manifest、`skipWaiting` / `clientsClaim` / denylist 与 `/sw.js` client plugin 注册链均按预期，回滚步骤与 `^2.0.2` / `generateSW` 后续项写入治理文档；backlog 依赖主线回填结论。提交 `150eb835`，Review Gate Pass。

- [x] **4. parity 允许清单清零脚本化（P3）**
    - **完成摘要**: 新增 `scripts/testing/prune-parity-allowlist.mjs` 与 `pnpm prune:parity-allowlist`，按 testName 清零 `allowlist`，只在 `note` 追加清零记录，不改预算 / tiers；dry-run 列出 `user-settings-light` / `user-settings-dark` 各 2 条；单测覆盖命中 / 未命中 / 幂等 / dry-run 不写盘。测试规范补「CI 重采 → prune → 复跑」流程并区分「重采后的绿」与「预算内吸收的绿」。提交 `550bdf6a`，Review Gate Pass。

**阶段收口**: `pnpm regression:phase-close`（`E2E_PORT=3011` / `E2E_INSTALLATION_PORT=3012`）一次 **Pass**（blocker=0 / warning=0，7/7 步骤），同源 statements **33,622 / 39,105 = 85.97%**；证据见 `artifacts/review-gate/2026-11-18-phase-close-regression.{md,json}` 与 `docs/reports/regression/current.md` 的 2026-11-18 窗口。

---

## 第七十八阶段：质量门禁与债务收口（已审计归档）

> 归档说明: 第七十八阶段 6 条条目已于 2026-11-18 完成并归档（2026-11-16 立项）；阶段规划正文见 [roadmap 分片](./archive/roadmap-phases-78.md)，Review Gate 证据见 `artifacts/review-gate/2026-11-17-phase78-item{1..6}.md`。

- [x] **5. AppAvatar 生产构建尺寸缺陷修复（P1 修复型）**
    - **完成摘要**: 定位 `caomei-ui` 的 `CaomeiAvatar` 以 Fragment 为根导致 attrs 在生产构建被丢弃（`xlarge` 实测 40px）；改由自有包装元素承载 `$attrs` 与 `--app-avatar-box`，内层按 100% 填满。构建产物实测 `/settings` 64px、评论区 48px、`/admin/users` 32px；`test:visual` 32/32、parity 83/83（`user-settings` 明暗按实测登记已归因带）。提交 `708691b3`，Review Gate Pass（Round 1 Reject → Round 3 Pass）。

- [x] **1. 静态规则债第三批与依赖台账复核（P2）**
    - **完成摘要**: `no-inferrable-types`（45 处，含 1 处 `.vue`）与 `use-unknown-in-catch-callback-variable`（32 处）清零后直接升 `error`，并导出 `NO_INFERRABLE_TYPES_FILES` 让配置面与治理切片同源；inventory 两规则 `effectiveSeverity 2 / hitCount 0 / warningCount 0 / explicitExemptionCount 0`，debt 产物 9 切片全 0。`dependency-risk-allowlist.json` 5 条补 `reviewBy`，过期或未登记在 `--mode=error` 判红（含 `--mode=warn` 不判红与真实台账 ratchet 断言）。提交 `3c917186` + `90356df8`，issue #262 已回写，Review Gate Pass（三分区并发审计 + Round 2）。

- [x] **2. 治理索引补全与索引检查（P2）**
    - **完成摘要**: `docs/design/governance` 69 份文档分类——25 份在役补索引（新增「文档、规范与流程治理」「性能、缓存与流量」两节）、15 份一次性报告进 allowlist 并写明替代事实源，未登记归零；新增 `check-governance-index.mjs` 与 `pnpm governance:check:index`（默认报告模式，`--mode=error` 才置 1）+ 9 例单测（不读真实仓库目录，避免经 `pnpm test` 升为阻断）。提交 `f114739d` + `c9a5fc91`，Review Gate Pass（Round 1 Reject → Round 2 Pass）。

- [x] **6. 脚本治理入口晋级与回归接线（P3）**
    - **完成摘要**: `governance:check:index`（5m）与 `governance:audit:unused-components`（5m）以 `required: false` 接入 `regression:weekly`（governance 面 5 → 7 步），并补断言锁住「除 token-map 外全部 warning 面」；同步 `docs/standards/planning.md` 中英双语周级组合与 `scripts/README.md`；`docs:check:*:candidate` 复核结论为维持独立只读 baseline。提交 `3c727117` + `c7446c7e`（CI 链接修复），Review Gate Pass。

- [x] **3. 字号归一第二批（P2）**
    - **完成摘要**: 非 admin 路由面 9 文件 51 处与 `--m-font-size-*` 逐字节等值的字面量替换为 token；inventory 声明 457（不变）、token 化 88 → 139、等值可替换 186 → 135；`test:visual` 32/32、parity 83/83 未归因差异 0。`demo-banner` 与 `settings-api-keys` 共 13 处无截图证据（TEST_MODE 与页签条件），以静态等值 + 产物抽查取证并登记。提交 `d0ffcc7e`，Review Gate Pass。

- [x] **4. 覆盖率第十九批（P2）**
    - **完成摘要**: `import-command.ts` 8/145 → **139/145（95.86%）**（CAC action 捕获 + `ora` / api-client / 图片迁移替身，报告文件走真实临时目录）；复审补 `parser.ts` 真实 `parseHexoFiles` 2 例（124/136 = 91.18%）。干净全量 statements **33,378 / 38,812 = 85.99%**（阶段基线 85.6%；本批纯贡献 +138 条 / +0.36pp = import-command.ts +131 与 parser.ts +7）；首跑 2 例时序 flake 经孤立复跑与干净重跑裁决。提交 `96609b83`，Review Gate Pass。

**阶段收口**: `pnpm regression:phase-close` 本地连跑 5 次，覆盖与单测在干净全量跑中一次通过（631 文件 / 5,893 例通过 + 1 跳过，statements 85.99%），阻断点均为管理端点击时序 flake（逐例孤立复跑通过）与一次新披露的 picomatch high 依赖告警（无补丁，已登记台账），按测试规范以 CI 为最终裁决——推送 `70a6f3a5` 后 Test / Pages / Docker / TODO 四工作流全部 success，回归门禁按 CI 记为 Pass，逐次记录见 `docs/reports/regression/current.md` 的 2026-11-17 窗口；回归窗口已把 2026-11-15 的 5 个窗口滚动归档到 [archive/2026-11-15-to-2026-11-17-phase76-78.md](../reports/regression/archive/2026-11-15-to-2026-11-17-phase76-78.md)。

---

## 第七十七阶段：体验与债务收口（已审计归档）

> 归档说明: 第七十七阶段 6 条条目已于 2026-11-16 完成并归档（2026-11-15 立项）；阶段规划正文见 [roadmap 分片](./archive/roadmap-phases-77.md)。

- [x] **1. 字号归一第一批（P2）**
    - **完成摘要**: `components/admin/posts` 与 `components/admin/settings` 的口径内字号字面量归一到字阶 token（41 处字面量与 token 逐字节等值），`test:visual` 32/32、parity 83/83 未归因差异 0，并产出 150 条非字阶取值归一评估报告。提交 `e8594ed2`，Review Gate Pass。

- [x] **2. 认证会话 SSR/CSR 单一来源（P2）**
    - **完成摘要**: `server/middleware/1-auth.ts` 扩展到「带会话 cookie 的页面 GET」，SSR 把会话种入 `auth:route-session:*`；移除 `settings-profile` 的 `ClientOnly` 与占位并新增会话驱动型 `ClientOnly` 守卫；`/settings` 首帧含头像 / 昵称 / 角色，页签切换无 `insertBefore`。提交 `daf19695`，Review Gate Pass。

- [x] **3. 零引用面板清理与组件扫描守卫（P3）**
    - **完成摘要**: 删除 `post-editor-review-panel.vue` 与 `post-editor-perspective-panel.vue`（共 469 行），新增 `scripts/governance/find-unused-components.mjs` + `governance:audit:unused-components` 报告型入口与假阳性单测；脚本在当前 HEAD 输出 0 未登记项。提交 `7b0d1bfa`，Review Gate Pass。

- [x] **4. 归档文档链接治理（P2）**
    - **完成摘要**: `archive` 从 `docs:check:links` 排除清单移除（扫描面 260 → 354 个 md），45 个归档分片中的 739 处失效链接修复（祖先基准重解 / 同名后缀映射 / 行内代码化 / 机器路径占位 / 8 处失效锚点摘除 / 17 处方括号标签链接），新增 `scripts/docs/scan-archive-links.mjs`、`pnpm docs:scan:archive-links`（报告模式，`--ref` / `--json`）与 8 例单测，门禁覆盖后 0 失效。立项申报 791 处来自未入库快照，脚本以 `--ref=c877bf38` 为可复现单点（链接 740 = 门禁可见 734 + 仅扫描可见 6，正文机器路径 6）。提交 `605fd5b8`（归档正文）、`fff74f0b`（门禁 / 脚本 / 测试 / 文档），Review Gate 分区审计 Round 1–4 收敛后 Pass。

- [x] **5. 覆盖率第十八批（P2）**
    - **完成摘要**: 补测 `packages/mcp-server/src/lib/api.ts`（0% → 100%）与 `scripts/security/security-alert-gate-shared.mjs`（62.7% → 94.67%），同源 statements 32,484 / 38,103 → 32,904 / 38,432 = **+420 条 / +0.37pp（85.62%）**；`import-command.ts` 与 `admin-taxonomy-page.vue` 按验收条款登记后续切片。提交 `4439248f`，Review Gate Pass。

- [x] **6. devcontainer 运行时对齐（P3）**
    - **完成摘要**: 基础镜像升至 `typescript-node:26-*`（与 `.nvmrc` 同主版本），`corepack enable` 换成 `npm i -g pnpm@11.17.0` 引导；`tests/scripts/node-runtime-baseline.test.ts` 扩展为「镜像主版本 = `.nvmrc` 主版本」与「`corepack` 不回流」守卫（含 JSONC 与负向用例）。提交 `b40dacd9`，Review Gate Pass（Codespaces 实测标注「未实测」）。

**回滚边界**:

- 条目 1：按目录批次独立 revert，`--m-font-size-*` 定义不动。
- 条目 2：中间件判定与 SSR 种子同批 revert，`ClientOnly` 恢复原状。
- 条目 3：两个零引用面板与新扫描脚本独立回滚。
- 条目 4：归档正文提交与门禁提交分离，门禁可独立回退。
- 条目 5：测试文件与覆盖率产物独立可回滚。
- 条目 6：`devcontainer.json` 与守卫扩展独立回滚。

**未覆盖边界与后续观察项**: ① 归档中 8 处失效锚点改为指向归档索引页，深链精度下降；② 归档 6 处 fenced / 行内代码示例链接按扫描口径保留；③ 立项申报 791 处的逐条原表未入库，脚本以 `--ref` 快照为单点并输出分类与逐条差量；④ `import-command.ts` 与 `admin-taxonomy-page.vue` 覆盖率留待后续切片；⑤ 本机 3001 / 3002 被外部进程占用时，阶段收口 E2E 以 `E2E_PORT=3011` / `E2E_INSTALLATION_PORT=3012` 跑通，CI 仍用默认端口。

---

## 第七十六阶段：内容与编辑体验收口、首页缓存决策与质量基线（已审计归档）

> 归档说明: 第七十六阶段 6 条条目已于 2026-11-15 完成并归档（同日立项与收口）；阶段规划正文见 [roadmap 分片](./archive/roadmap-phases-76.md)。

- [x] **1. 设置表单 AI Image Fallback 4 项（P2）**
    - **完成摘要**: `SETTING_ENV_MAP` 补 `AI_IMAGE_FALLBACK_PROVIDER/API_KEY/MODEL/ENDPOINT` 并导出 `getSettingEnvKeys`；`.env.full.example` 补 4 条示例（注明留空继承全局 `AI_FALLBACK_*`）；`ai-settings.vue` 在 AI 图像组内补 provider + api_key/model/endpoint（`v-if` 跟随 provider、锁定态只读）；五语补 4 键。V3 浏览器 2/2（渲染顺序/联动、保存后回显与 key 掩码、env 注入四项 disabled）。提交 `188d30a2`，Review Gate Round 2 Pass。

- [x] **2. JekyllParser 适配器（P2）**
    - **完成摘要**: 新增 `packages/cli/src/jekyll-parser.ts`（YAML front-matter，单数键 `tag`/`category` 优先、复数键空白拆分、`YYYY-MM-DD-` 文件名日期按 UTC 推导、`published:false` → draft）；`import-command` 增 `--format jekyll` 分支并导出 `getParser`，帮助文本与 README（中英）同步。CLI 全量 140 例、`--format=jekyll` 冒烟与 `--help` 通过。提交 `3c02f149`，Round 2 Pass。

- [x] **3. 编辑器工具栏 Phase C — AI 审校合并（P2）**
    - **完成摘要**: 新增 `PostEditorConsolidatedReviewPanel`（问题修正/视角建议双 Tab + editor/reader，`inert`/`aria-pressed`）；`usePostEditorAI.consolidatedReview` 单入口并行 `/api/ai/review` + `/api/ai/perspective-check`（`Promise.allSettled`），缓存键含 language、零结果参与缓存、部分失败降级、重试清失败分段；header/页面切换到合并面板，旧面板保留未删。相关 4 套件 84 例、V3 探针 6/6。提交 `ede17ef7`，Round 3 Pass。

- [x] **4. 首页 SWR / i18n cookie 决策与最小实现（P2）**
    - **完成摘要**: 线上探针确认 `/` 每次写 `i18n_redirected`、无 `cache-control`、`cf-cache-status: DYNAMIC`；`/robots.txt` 为 `HIT`（`age: 95`），边缘可用但被 `Set-Cookie` 阻断。选定 ① 保持现状 + 边缘兜底（零代码改动），②/③ 转 backlog「首页缓存与语言检测解耦」；决策文档含证据表、取舍与可复跑探针。提交 `f18da5ae`，Round 2 Pass。

- [x] **5. 覆盖率第十七批（P2）**
    - **完成摘要**: 四脚本模块补测（audit-duplicate 50→288/291、check-governance 108→351/352、inventory 16→230/231、capture 39→226/229），新增 4 个测试文件 155 例；干净全量 statements 31,597/38,076 = **82.98%** → 32,484/38,103 = **85.25%**（+887 条 / 分母 +27 / +2.27pp）。提交 `8019de79`，Round 3 Pass。

- [x] **6. 浮层守卫正则清理（P3）**
    - **完成摘要**: `stripNonTemplateBlocks`/`stripComments` 改为手写扫描（大小写不敏感、嵌套配对、标签边界、未闭合保留剩余内容），`accept="image/*"` 不再误判块注释；新增 9 条负向自检（定向 13 例）。4 条 Code Scanning 告警 fixed、open=0。提交 `9ba3f200` + `66ad22ad`，Round 2 Pass。

- **阶段收口**: 收口门禁结果见回归窗口 `periodic-regression:phase-close:2026-11-15`。

## 第七十五阶段：依赖与静态规则收口、运行时基线升级与治理口径统一（已审计归档）

> 归档说明: 第七十五阶段「1 条依赖安全 + 1 条静态规则 + 1 条 i18n 复核 + 1 条覆盖率 + 1 条文档口径 + 1 条 Node 运行时」已于 2026-11-14 完成全部条目并归档（2026-11-13 立项；条目 3 字号归一按「进一出一」移至 backlog #11，条目 7 为 2026-11-14 插队）。

- [x] **1. 依赖安全收口（P1）**
    - **完成摘要**: minimatch / glob 按父级 scoped override 定向抬版（受影响区间清零，裸名 override 与 glob 7 链保持不动）；quill 2.0.3 经全仓零引用确认后直接移除并清理 `nuxt.config.ts` 两处无效配置；deepmerge 4.3.1 无补丁，登记 low 台账（含影响面与复核日期）；新增锁文件版本地板守卫。验证：`security:audit-deps` relevant risks 0、`security:alerts` Pass、`install --frozen-lockfile` / `security:validate-overrides` 通过。

- [x] **2. ESLint #262 第二批（P2）**
    - **完成摘要**: `prefer-reduce-type-parameter` / `no-extraneous-class` / `restrict-plus-operands` / `non-nullable-type-assertion-style` 4 条规则升 `error` 并清零（22 命中 / 17 文件）；同步 `eslint-debt-targets.mjs`、config 注释与 inventory baseline，issue #262 回写批次记录。验证：`pnpm lint` 0 error、warning ≤ 10、effectiveSeverity=1。

- [x] **4. i18n allowlist 复核与公开页 runtime 审计（P2）**
    - **完成摘要**: 64 组 / 149 keys 逐条复核：恢复 3 组被误判为静态的动态查表理由（`comments` / `submissions` 的 `status_${status}`）、修正 3 组 `users.*` 静态理由、跨模块组补齐语义说明；日期续期至 2027-05-14。新增 `tests/scripts/i18n-duplicate-allowlist.test.ts`（5 例：字段 / id 哈希 / 日期窗 / 三类互斥分类 / runtime 列表页）。验证：duplicates gate 64 ≤ 74、`check-sync` 四语 parity、`audit:missing` 0、`verify:runtime` 17 文件 / 129 例。

- [x] **5. 覆盖率第十六批（P2）**
    - **完成摘要**: 4 模块补齐（`check-governance` 108/341、`check-bundle-budget` 227/258、`ai-image-generator.vue` 141/161、`use-asr-direct.ts` 282/329），新增 386 条覆盖。同源 statements 31,055 → 31,441 / 37,755 = **83.28%**（+386 条 / +1.02pp，774 源文件）；「分母或文件集合变化时按同源比较」写入测试规范。证据见 `artifacts/review-gate/2026-11-14-entry5-coverage-batch16.md`。

- [x] **6. 文档与治理口径收敛（P2）**
    - **完成摘要**: 回归窗口阈值改为脚本指针（行数 → `docs:check:line-count` 的 `current.md` 目标，条数 → `LOG_WINDOW_LIMITS.maxEntries`），并修掉 `phase-close` 仍硬编码 400 行的第三处口径；`todo-archive.md` 554 → **292 行**（第六十五至第六十八阶段迁入 `archive/todo-archive-phases-65-68.md`）；governance >180 天巡检 20 份、归档 2 份并留巡检记录；阶段收口分母口径并入测试规范（en-US 同步）。验证：`docs:check` 五项全 PASS、`lint-md` 0 error。

- [x] **7. Node 26 运行时基线单点化（P1，插队）**
    - **完成摘要**: 新增 `.nvmrc` = 26.13.1，`engines.node` 改 `26.x`，7 个 workflow 共 22 处改 `node-version-file: .nvmrc`；Docker 基础镜像改 `node:26.13.1-alpine`（保留 `--build-arg` 覆盖）；`pnpm rebuild better-sqlite3`（node-v147 prebuild），`.output` 与容器双探针 `/api/install/status` 200、DB 36 表可读写；README / 开发规范 / 治理文档同步。验证：全量单测 609 文件 / 5,456 例、视觉 32/32、parity 83/83、`test:perf:budget:strict` PASS。

- **阶段收口**: `pnpm regression:phase-close` **Pass**（coverage 83.2% / 615 文件 / 5,523 例通过、1 跳过；`release:check:full` 12/12，E2E 226 passed / 2 flaky / 58 skipped；docs / budget / duplicate 0.39% / review-gate 全 PASS）。证据见 `artifacts/review-gate/2026-11-14-phase-close-regression.md`。

## 第七十四阶段：工具链现代化、门禁转阻断与存量缺陷收口（已审计归档）

> 归档说明: 第七十四阶段「1 条工具链现代化 + 2 条门禁硬化 + 1 条存量缺陷批 + 1 条 i18n 收敛 + 1 条字阶试点 + 1 条覆盖率」已于 2026-11-13 完成全部条目并归档（2026-11-12 立项，2 天交付）。

- [x] **1. 依赖与静态规则现代化（P1）**
    - **完成摘要**: js-yaml 5：`pnpm-workspace.yaml` 裸名 override 抬至 `^5.5.0`（`read-yaml-file>js-yaml` 保留 `^3.14.1`），8 处默认导入改 `{ load, dump }`，移除 `@types/js-yaml`，`security:validate-overrides` Pass；ESLint #262 首批把 `ban-ts-comment` 从 `[0]` 升 `[1]` 并清零，inventory 扩至全仓分桶；stylelint 18.0.0 与 `stylelint-config-cmyr ^1.1.0` 成对升级（17.x + 1.0.0 可同批回滚），不带 `--fix` 的全仓扫描 0 error 且无样式改写，PR #1008 收口。

- [x] **2. 质量门禁硬化（P1/P2）**
    - **完成摘要**: 视觉 parity 以 CI 产物复采 41 路由 / 82 张参考态并刷新 `parity-budget.json`（allowlist 归零），移除 visual job 的 `continue-on-error`，`test.yml` / 门禁 §7 / 测试规范 §7.2 同步；入口包体产出构成清单并把 Sentry 客户端移出入口预载，`test:perf:budget:strict` 保持通过。

- [x] **3. 存量缺陷修复批（P1）**
    - **完成摘要**: `creator-stats` 改用可移植的周 / 月聚合（含跨年边界用例）、`_admin-dashboard.scss` 断点方向改为 `respond-below("md")`、`typeorm-adapter` 的 `transformOutput` 在只有 `_id` 时仍回填 `id` 并补单测。

- [x] **4. i18n 重复键收敛（P2）**
    - **完成摘要**: 跨模块同文案收敛至 `common.*` / `legal.*` 并迁移全部引用与五语，剩余组登记 allowlist（组 id + 理由 + 复核日期）并由脚本读取、误报判红；`i18n:check-sync` / `i18n:audit:missing` / `i18n:verify:runtime` 通过。

- [x] **5. UI 字阶治理首批（P2）**
    - **完成摘要**: 新增 `scripts/governance/inventory-font-sizes.mjs`（口径 455 条声明 / 64 种取值，区分 token / 字阶 / SCSS 变量 / 非字阶）与 `governance:inventory:font-sizes`；`styles/main.scss` 定义 `--m-font-size-{xs,sm,md,lg,xl,2xl,3xl,4xl}` 字阶；公开页 4 文件 + 管理端 4 文件共 47 处等价替换，token 化 0% → 10.33%，非字阶 149 条登记待归一。验证：8 路由 × 明暗双主题逐元素 `getComputedStyle` 的 `font-size` / `line-height` 差异 0；`parity` 83 passed、基线层 32 passed、`lint:css` 0 error。证据见 `artifacts/review-gate/2026-11-13-entry5-font-size-pilot.md` 与 `docs/design/governance/2026-11-13-font-size-scale-pilot.md`。

- [x] **6. 覆盖率第十五批（P2）**
    - **完成摘要**: 四模块补齐（tts 播客直连全流程 / ASR 压缩与未知包 / 语音采集管道 / 协议设置行内操作），新增 27 例。同源文件口径 statements 82.64% → 83.31%（+247 条 / +0.67pp）：`use-tts-volcengine-direct` 46.5→73.9、`use-asr-direct` 72.3→82.4、`use-post-editor-voice` 77.9→87.8、`agreements-settings.vue` 33.5→69.4；全量 609 文件 / 5,453 例通过。证据见 `artifacts/review-gate/2026-11-13-entry6-coverage-batch15.md` 与 `artifacts/coverage/coverage-final.batch-15-exit.json`。

## 第七十三阶段：迁移后质量收尾与门禁硬化（已审计归档）

> 归档说明: 第七十三阶段「1 条 UI 收尾 + 1 条安全门禁收口 + 1 条 i18n 门禁 + 1 条覆盖率治理 + 1 条依赖迁移 + 1 条 nuxt 安全升级」已于 2026-11-11 完成全部条目交付并归档（2026-11-10 立项，2 天交付）。阶段内落地共享 `AppEmptyState` 与空表分页判定、把发布安全门禁从过渡模式切回完整阻断、新增 i18n 原文级重复键扫描与 PR 侧缺失键阻断、覆盖率第十四批 **+311 条 / +0.84pp**、markdown-it 15 迁移并恢复 linkify 语义、nuxt 4.6.4 安全抬版与 14 张视觉基线归因。阶段收口 `regression:phase-close` 结论 **Pass**（`test:coverage` 607 文件 / 5,383 例、Statements 82.63%；`release:check:full` 12 步含 E2E 228 passed / 58 skipped；`docs:check:*` / `test:perf:budget:strict` / `duplicate-code:check:strict` / `review-gate:generate:check` 全 PASS）。

- [x] **1. UI S1 收尾：空态三态、空表分页与三处层序失效（P1）**
    - **完成摘要（2026-11-10）**: 新增共享 `AppEmptyState`（图标 + 说明 + 主操作），替换 7 个文件对 `pages.posts.empty` 的复用并按对象补齐五语 key（评论 / 订阅者 / 候补 / 分类 / 标签 / 文章管理 + 公开列表说明）；空表分页改为按 `total` 判定（`total > 0` 才渲染，避免末页删空后无法回退），5 处绑定同步（分类 / 标签共用组件）；三处层序修复——`.social-btn` 与 `.admin-form-dialog` 宽度钩子移出 `@layer momei-base`（实测社交按钮品牌色生效、弹窗 608 / 576 / 544px），`.translation-badge` 复核维持 24px / 32px token 口径；`ui.md` §3.1–§3.4 按 caomei-ui 重写。验证：`test:visual` 32 passed、`test:visual:parity` 83 passed、`lint` / `lint:css` / `typecheck` 0 error、定向 vitest 144 passed；证据见 `artifacts/review-gate/2026-11-10-phase73-entry1-ui.md` 与 `artifacts/review-gate/entry1/`。

- [x] **2. 发布安全门禁收口：Code Scanning #43、过期台账与去过渡模式（P1）**
    - **完成摘要（2026-11-10）**: `scripts/docs/check-doc-markers.mjs` 的孤立尾行正则改为 `^--!?>(\s|$)`（同时接受 HTML5 的 `-->` / `--!>`）并补单测；GitHub 侧 #43 由 `won't fix` 重分类为 `false positive`，台账登记 `category: false-positive` / `location` / `expiresAt: 2027-05-15`；移除 `package.json` 的 `--transition-mode`，`security:alerts` 恢复完整阻断；删除 mjml（已无告警）与 quill（降为 low、无补丁，留 backlog）两条过期台账；同步 `security.md §5.3` 与 dismissed / fail-closed 治理文档退出记录。验证：`security:alerts` Pass（transition off、transition findings 0、warning 0）、`security:audit-deps` Pass（relevant risks 0）、`check-doc-markers.test.ts` 20 passed；CI `security:alerts` 待推送后回填。

- [x] **3. i18n 审计硬化：原文级重复键扫描与 PR 侧键漂移阻断（P2）**
    - **完成摘要（2026-11-10）**: 新增 `scripts/i18n/audit-raw-duplicate-keys.mjs`（对象栈扫描同对象重复键，默认 warning、`--mode=error` 可阻断）与 11 例单测（7 纯函数 + 3 CLI + 1 目录扫描，含重复键 fixture 判红）；`i18n:audit:duplicates` 保持原样（仅跨语言文案候选），原文级扫描独立为 `i18n:audit:raw-duplicates` 入口（Round 1 的串联方案已回退）；`test.yml` 的 `test` job 增加 `i18n:audit:missing`（阻断）与 `i18n:audit:raw-duplicates`（warning）。实测 130 个 locale JSON 原文级重复键 0、五语 sync 通过；临时删除 `pages.admin.waitlist.empty_description` 后 `i18n:audit:missing` 退出 1 并点名该键，恢复后为 0。验证：`lint` / `lint:i18n` / `typecheck` 0 error、`docs:check:i18n` 通过。

- [x] **4. 覆盖率第十四批（P2）**
    - **完成摘要（2026-11-11）**: 第 4 模块按实测选 `utils/shared/post-audit-quick.ts`（74 条未覆盖 / 75 条总量，被 `/admin/posts` 与 `server/services/ai/content-audit.ts` 消费）。四模块收口：`use-post-editor-ai` 171 → 6（98.08%）、`post-audit-quick` 74 → 3（96.00%）、`tts-volcengine-websocket` 59 → 6（96.94%）、`run-scheduled.post` 22 → 1（98.18%）；4 个测试文件（1 新增 / 3 扩充）共 47 / 19 / 17 / 16 例（本批 +79 例）。全仓 Statements 81.79% → 82.63%（30,260 → 30,571 / 36,994，+311 条 / +0.84pp）、Branches 72.86% → 73.59%、Functions 79.61% → 80.00%、Lines 81.93% → 82.78%；全量 604 passed / 1 skipped（605 文件、5,368 例）。剩余 16 条为防御 / 兜底分支，逐条列于证据文件。证据见 `artifacts/review-gate/2026-11-11-coverage-batch-14.md` 与 `artifacts/coverage/coverage-final.batch-14-{baseline,exit}.json`。

- [x] **5. markdown-it 15 迁移（P2，含 kill-switch）**
    - **完成摘要（2026-11-11）**: 升级 `markdown-it` 15.0.3 / `markdown-it-anchor` 10.1.0 / `@types/markdown-it-container` 4.0.1，移除 `@types/markdown-it` 直接依赖（15 自带声明）；锁文件 39 增 / 33 删，传递变化为 `linkify-it` 6.1.0 / `uc.micro` 3.0.0 / `argparse` 3.0.4 / `entities` 4.5.0 → 8.1.0，无其他包版本增删，`pnpm install --frozen-lockfile` 通过。适配层：`utils/shared/markdown.ts` 的 `MarkdownRendererInstance` 改为 `MarkdownItInstance & MarkdownImagePlaceholderMethods` 类型别名、`attachMarkdownImagePlaceholderSupport` 改用 `Object.assign` 返回（去掉 `as` 断言）、emoji / container 插件改用本地签名桥接；`utils/web/admin-markdown-editor.ts` 的 `render` 包装改用 `Env`，`AdminMarkdownEditorInstance.markdownIt` 收窄为 `Pick<MarkdownRendererInstance, 'render'>`；`utils/shared/markdown.test.ts` 与新增 `utils/shared/markdown-linkify.test.ts` 钉住 fuzzy link / urlAuth / texmath。linkify-it 6 默认关闭的 `fuzzyLink` / `urlAuth` 由新增 `utils/shared/markdown-linkify.ts` 统一恢复，共享渲染器与 4 处服务端直连渲染器（feed / ActivityPub mapper / outbox / 营销邮件测试发送）一致调用；新增 `tests/modules/markdown-linkify-wiring.test.ts`（9 例）守卫 5 处接线；未恢复的上游行为变更（裸域名+端口、认证段邮箱、实体/HTML block/链接目标边界、entities v8）在治理文档 §3.2 登记为接受项。5 个插件运行时全部兼容，kill-switch 未触发；兼容矩阵与迁移结论见 `docs/design/governance/2026-11-11-markdown-it-15-migration.md`。验证：`typecheck` 0 error、定向 11 文件 / 100 例（含 `markdown.test.ts` 15 例、`markdown-linkify.test.ts` 3 例与 5 处渲染器接线的 9 例静态守卫，复跑命令见治理文档 §5）、全量 606 文件 passed / 1 skipped（607 文件）、5,383 例 passed / 1 skipped（5,384 例）、`test:visual` 32 passed、`test:visual:parity` 83 passed、`test:perf:budget` 未越线。PR #745 待本次提交推送后关闭（本摘要落盘时 `state=OPEN`、未合并）。

- [x] **6. nuxt 4.6.4 安全升级与视觉基线归因（P2，解阻 PR #1004）**
    - **完成摘要（2026-11-10）**: 依赖升级已由 base 的 `8e354fa3`（dependabot，PR #1004）合入；本提交只剩预览卡日期固定与 14 张基线归因（原 `new Date()` 使主题工作台基线每日漂移，占用约一半像素容差）——页头整体右移 144px 是 4.6.3 下 `caomei-ui` 按钮规则压过组件 `display:none` 导致 3 个桌面隐藏控件泄漏，弹窗 +20px 是 `:deep(.caomei-card__body)` 的 `1.25rem` padding 恢复生效，页脚外链图标为 0.45px 亚像素抗锯齿差异；`test:visual` 32 passed、`test:visual:parity` 83 passed、`lint` / `lint:css` / `typecheck` 0 error；证据见 `artifacts/review-gate/2026-11-10-nuxt-4.6.4-upgrade.md`。遗留：首页 SWR 因 i18n 响应 `Set-Cookie` 不再缓存，已登记 backlog 候选；CI `Test` / `Publish Docker Image` 待推送后回填。

## 第七十二阶段：PrimeVue → caomei-ui 迁移（六）——token 语义层反向切换与 PrimeVue 卸载（已审计归档）

> 归档说明: 第七十二阶段「1 条映射基座 + 1 条组件替换 + 1 条 token 切换 + 1 条卸载收口 + 1 条覆盖率治理」已于 2026-11-09 完成全部条目交付并归档（2026-11-08 立项，2 天交付）。阶段内把 `--p-*` token 从 1,420 清零、剩余 46 处 PrimeVue 组件清零、卸载 PrimeVue 全家桶与路由择库机制，并建立全量零残留守卫；包体回落 `coreEntryJs` 375,543 → 329,891 B、`keyCss` 64,103 → 60,482 B（配额收紧至 335KB / 62KB）；覆盖率第十三批 +140 条 / +0.38pp。阶段收口 `regression:phase-close` 结论 **Pass**（12 步中 11 步通过；补齐 Playwright 浏览器后 E2E 复跑 227 passed / 1 flaky / 58 skipped；证据见 `artifacts/review-gate/2026-11-09-phase-close-regression.md`）。

> **ROI 评估**: 映射基座 `2.00`；组件替换 `1.60`；token 切换 `1.50`；卸载收口 `1.80`；覆盖率 `1.75`。

> 阶段规划详情、ROI 与回滚边界见 [项目计划归档](./archive/roadmap-phases-72.md)。
> 迁移方案事实源见 [PrimeVue → caomei-ui 迁移方案](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)（本阶段对应 §5.2 / §7 / §8.4.2）。
> token 映射事实源见 [PrimeVue token 映射表](../design/governance/2026-11-08-primevue-token-mapping.md)。
> backlog 来源见 [长期规划与积压项](./backlog.md) 长期主线第 10 条（UI 组件库迁移）与第 1 条（测试覆盖率）。

**时间表**: 2026-11-08 ~ 2026-11-09

**准入前置（已核对 2026-11-08）**: 第七十一阶段已审计归档、`todo.md` 无已完成阶段正文、工作区干净且 `master` 与 `origin/master` 同步；CI `Test` 15 job 全绿（`2c954194`）、`v1.30.0` 经手动触发的 Release workflow 发布成功；本地 `release:check` 10/10；覆盖率 79.23%（口径见 backlog #1）；入口包体 `coreEntryJs` 375,368 B / 378,880 B、`keyCss` 63,337 B / 70KB。

- [x] **1. token 语义审计与映射基座（P1）**
    - **收口（2026-11-08）**: 映射表 `scripts/governance/data/primevue-token-map.json`（semantic 34 / palette 58 / phantom 28，100% 覆盖）；守卫 `pnpm governance:check:token-map`（临时文件判红单测 7 例）；`--m-*` 派生层 + 明暗 / 三预设解析契约 8 例；基线 `coreEntryJs` 375,543 B / 370KB、`keyCss` 64,103 B / 70KB、`test:visual` 32/32、`parity` 83/83。口径见 [PrimeVue token 映射表](../design/governance/2026-11-08-primevue-token-mapping.md)。

- [x] **2. 剩余 PrimeVue 组件替换（P1）**
    - **收口（2026-11-08）**: 脚本口径 46 处 / 14 类 → **0**（先清 4 处口径假阳性）；42 处真实用法全部替换（Checkbox 12 / Card 5 / DatePicker 4 / MultiSelect 4 / InputNumber 4 / Textarea 4 / RadioButton 2 / ProgressSpinner 2 / Button 2 / Toolbar 1 / Divider 2）。验证：定向 19 文件 / 202 例 + 守卫 80 例；`test:visual` 32/32；`parity` 83/83；E2E critical 17 passed / 1 skipped + mobile 2 + 安装向导 2；`coreEntryJs` 375,543 → 359,547 B、`keyCss` 64,102 B / 70KB。

- [x] **3. token 反向切换（P1）**
    - **收口（2026-11-09）**: 三批完成（① 样式基座 / ② 公开页与共享组件 / ③ 管理端 + 定义清零），token **1,420 → 0**；桥接反向为 `--m-* → --caomei-*`，`use-theme` 只保留 `--m-*` 基色、`use-reader-mode` 只写 `--m-*`。幻影 token 按「删除声明」保持视觉（边框 / 文本 / 悬停 / 圆角 / rgb），状态色按 S1 映射到真实角色（法务页提示条差异按实测登记）。验证：`test:visual` 32/32、`parity` 83/83、E2E critical 17/1 + mobile 2 + 安装向导 2；`coreEntryJs` 359,061 B / 370KB、`keyCss` 64,006 B / 70KB。

- [x] **4. PrimeVue 卸载、样式耦合清理与预算回落（P1）**
    - **收口（2026-11-09）**: 卸载 `primevue` / `@primevue/*` / `@primeuix/*` / `primeicons` / `primelocale`；移除 Aura 预设、`primevue` 模块与配置、`plugins/primevue-i18n.ts`、路由择库机制（`lib/ui-library.ts` + 2 套迁移守卫 + helper）；`p-*` class 151 → **0**、`.p-*` 选择器 83 → **0**；新增 `tests/modules/primevue-residual-guard.test.ts` 全量零残留守卫（浮层族专用守卫保留）。补回 `* { box-sizing: border-box }` 与 `:root` / `.dark` 的 `color-scheme`（卸载后 15 张视觉基线失败的根因）。包体：`coreEntryJs` 359,061 → **329,891 B**（配额 370 → 335KB）、`keyCss` 64,006 → **60,482 B**（配额 70 → 62KB）、`maxAsyncChunkJs` 56,781 B / 130KB。验证：`test:visual` 32/32、`parity` 83/83、E2E critical 17/1 + mobile 2 + 安装向导 2。文档同步：迁移方案 §8.4.2、B4 清单 §0、UI 设计迁移指针、性能规范 §4.1、backlog 当前基线。

- [x] **5. 覆盖率第十三批 + 卸载后回归补齐（P2）**
    - **收口（2026-11-09）**: 4 主模块（`logger` 61→2 / `post` 23→0 / `setting` 25→3 / `database/logger` 15→0）+ 6 小模块；新增 4 个测试文件 + 扩展 8 处，+68 例；全仓 statements **29,995 → 30,135 / 36,828（+140 条 / +0.3801pp）**，Branches 72.40 → 72.88、Functions 79.49 → 79.73、Lines 81.57 → 81.96。补 `snowflake` 序列回绕确定性用例；清理 4 处「Mock PrimeVue」残留注释。全量 `pnpm test:coverage` 600 passed / 1 skipped（601 文件）/ 5,265 passed（`--maxWorkers=4` + 清 `.vitest-cache`）。`agreement.ts` 上批已 26 → 1（剩 184 不可达分支），第 4 模块由 `database/logger` 顶替。

## 第七十一阶段：PrimeVue → caomei-ui 迁移（五）——B4 剩余路由、图标全量与门禁收口（已审计归档）

> 归档说明: 第七十一阶段「1 条开工基座 + 2 条迁移主线 + 1 条图标主线 + 1 条门禁收口 + 1 条治理主线」已于 2026-11-08 完成全部条目交付并归档（2026-11-06 立项，3 天交付；2026-11-08 发布 **v1.30.0**）。条目 1 现取复核（19 个未迁移页面 / 90 处）并采集 14 条参考态（28 张）；条目 2 完成管理端剩余路由（snippets / AI 任务详情 / 日历 / 仪表盘 / 编辑器子批，组件 370 → 188）；条目 3 完成公开页与布局壳（全局壳 25 处、内容组件 31 处、外围组件 24 处、公开路由 9 文件 61 处 + 7 条 scope），并收口过渡组件（删 3 个 V1、6 组去 `-v2`）；条目 4 把 `pi pi-*` **136 处清零**（8 类品牌走 `mdi mdi-*`、3 类字体未收录走内联 Simple Icons、5 个数据驱动配置改组件）；条目 5 清零 E2E `p-*` 断言、守卫扩到 35 条路由（含 `/` 与 `/goto` 动态参数页）、复算 `keyCss` 63,337 B / 70KB 与 `coreEntryJs` 375,368 B（配额 365 → 370KB 并归因）；条目 6 补测 4 模块（+154 条 / +0.42pp）、收敛 i18n 键层缺陷、新增 `useI18n` 位置守卫并修复 `friend-link` 归一化覆盖。阶段收口复算：组件 **188 → 46 处 / 26 → 14 类**、图标 **235 → 0**、token 1,420（留第七十二阶段）；parity **83/83**（`PENDING_ROUTES` 清零）、`test:visual` 24/24、E2E critical 17 passed / 1 skipped + 安装向导 2 passed、CI `Test` 15 job 全绿、本地 `release:check` 10/10、**Release workflow 发布 v1.30.0 成功**（子包 + 多架构镜像）。各批 Review Gate 均 Pass。`todo.md` 已清理，`roadmap.md` 已同步归档结论，回归窗口整体迁入 [2026-11-08-phase71-close.md](../reports/regression/archive/2026-11-08-phase71-close.md)，`docs/i18n/*/plan/roadmap.md` 摘要已同步。

> **ROI 评估**: 开工基座 `2.00`；管理端余面 `1.50`；公开页与布局壳 `1.60`；图标全量 `1.80`；测试守卫 `1.40`；覆盖率与小治理 `1.75`。

> 阶段规划详情、ROI 与回滚边界见 [项目计划归档](./archive/roadmap-phases-71.md)。
> 迁移方案事实源见 [PrimeVue → caomei-ui 迁移方案](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)（本阶段对应 §7 的 B4 段）。
> B4 清单见 [第七十一阶段 B4 迁移清单](../design/governance/2026-11-06-b4-migration-inventory.md)。
> backlog 来源见 [长期规划与积压项](./backlog.md) 长期主线第 10 条（UI 组件库迁移）与第 1 条（测试覆盖率）。

**时间表**: 2026-11-06 ~ 2026-11-08

**准入前置（已核对 2026-11-06）**: 第七十阶段已审计归档、`todo.md` 无已完成阶段正文、`git status` 干净且 `master` 与 `origin/master` 同步（`b1c8aa73`）；CI 回执 Test / CodeQL / VitePress / TODO-to-Issue 均 success；`pnpm docs:check:source-of-truth` PASS；覆盖率 80.66%；入口包体 369,212 B / 373,760 B、`keyCss` 63,336 B / 70KB。

**剩余迁移面（2026-11-08 阶段收口复算，`governance:count:primevue-usage` 口径）**: 组件 **46 处 / 14 类**（Checkbox 12 / Card 5 / DatePicker 4 / MultiSelect 4 / InputNumber 4 / Textarea 4 / Column 2 / RadioButton 2 / ProgressSpinner 2 / Button 2 等）；图标 **0**；token **1,420 处**（第七十二阶段与卸载同批）；`vitest PrimeVue mock 文件数` 1（`primevue-i18n` 插件单测，随卸载删除）；E2E `p-*` 断言 0。

- [x] **1. B4 开工基座与现取复核（P1）**
    - **收口（2026-11-06）**: 未迁移页面 **19 个 / 页面口径 90 处**；14 条参考态（管理端 2 + 公开页 12）/ 28 张，manifest `ref=HEAD`；扩族策略改为随路由整迁登记 `inScopeComponents`；`test:visual` 24 passed、parity 83 passed、guard 57 passed、`typecheck` / `lint` 0。

- [x] **2. B4-A 管理端剩余路由整迁（P1）**
    - **收口（2026-11-06 ~ 11-07）**: `/admin/snippets` + `/capture`（7 文件）、`/admin/ai/tasks/[id]` + 4 个共享 AI 组件、`/admin/calendar` + 月历 / 看板、`/admin` 仪表盘 + 3 个 dashboard 组件、编辑器整路由（`[id].vue` + 19 组件，V1 三件套删除、`primeVueSubRoutes` 清零）。复算组件 370 → 188、图标 328 → 235；parity 全绿、管理端 E2E 主路径通过。

- [x] **3. B4-B 公开页与布局壳整迁（P1）**
    - **收口（2026-11-07 ~ 11-08）**: 3a 全局布局壳 5 文件（25 处，重采 14 张基线）、内容组件 6 文件（31 处）、外围组件 4 文件（24 处）；3b 公开路由 9 文件（61 处）+ 7 条 scope（`/archives` / `/categories` / `/tags` / `/posts` / `/friend-links` / `/privacy-policy` / `/user-agreement`），`PENDING_ROUTES` 清零；过渡组件收口（`AppAvatar` / `AppUploader` / `AdminContentLanguageSwitcher` 删 V1、posts 三件套去 `-v2`）。同批修复 `use-theme` 的 `@layer` 层序与 scoped `:global(.dark)` token 全局污染。复算组件 188 → 47、图标 235 → 136；parity 83/83、visual 24/24、E2E critical 全绿。

- [x] **4. B4-C 图标全量替换与品牌图标落点（P1）**
    - **收口（2026-11-08）**: `pi pi-*` 136 处 / 40 文件清零（生产约 110 处 + 注释与测试断言 18 处）；非品牌 → `@lucide/vue`（按原 CSS 字号换算 `:size`）；品牌 11 类：8 类 `mdi mdi-*`、tiktok / discord / paypal 字体未收录 → 内联 Simple Icons；5 个数据驱动配置（菜单 / 商业平台 / AI 任务类型 / 分享 / 社交发布）改组件并同步消费方；同批固定种子文章发布时间（消除参考态日期漂移）并重采 2 张主题工作台基线。组件 47 → 46、图标 → 0；visual 24/24、parity 83/83。

- [x] **5. B4-D 测试 / E2E 断言改写与守卫收口（P2）**
    - **收口（2026-11-08）**: E2E `p-*` 断言 9 处 / 2 文件清零；删除 `testSetup` 的 PrimeVue toast / confirm mock；守卫支持动态参数页回退与根前缀精确匹配，登记 `/` 与 `/goto`（`CAOMEI_UI_ROUTE_PREFIXES` 35 条，全站登记完成）；`keyCss` 63,337 B / 70KB、`coreEntryJs` 375,368 B（+6,156 B 归因为全局菜单 16 个 lucide 图标，配额 365 → 370KB 三处联动）；guard 70 + 收口守卫 4 全绿。

- [x] **6. 覆盖率第十二批 + 既有缺陷小治理（P2）**
    - **收口（2026-11-08）**: 6a 4 模块补测（`typeorm-adapter` 84→6 / `quota-governance` 28→0 / `agreement` 26→1 / `post-hexo-sync` 23→0，新增 50 例），全仓 statements **28,993 → 29,147 / 36,790（+154 条 / +0.42pp）**；6b `admin-posts.json` 8 个原文级重复键去重、20 组双源同键收敛、删除 `system.fields.*` 6 个死键、`submit` 硬编码词条化（`duplicates` 101 → 99、`missing` 0）；6c 新增 `useI18n` 位置守卫（可判别失败已验证）；6d `friend-link` 归一化移到 `assignDefined` 之后并补 2 例空白断言。i18n runtime 129 passed；发现 `_id` 覆盖缺陷已登记 backlog。

## 第七十阶段：PrimeVue → caomei-ui 迁移（四）——B3 表单与设置、GA 升级与门禁扩面（已审计归档）

> 归档说明: 第七十阶段「1 条开工基座 + 3 条迁移主线 + 1 条覆盖率治理主线」已于 2026-11-05 完成全部条目交付并归档（2026-11-03 立项，2 天密集交付）。条目 1 完成 `caomei-ui@1.0.0` GA 精确升级（与 rc.1 运行时产物逐字节一致、锁文件 5 处、视觉 18/18、parity 34/34、`keyCss` 61.79KB / 70KB），并把 parity 扩到未安装态第二 webServer、首次启用 `reader` 档预算校准（参考态 34 → 54）；条目 2 分 2a / 2b / 2c 完成管理端设置与通知整路由迁移（341 + 42 处，含 4 张 DataTable 与主题工作台）；条目 3 完成安装向导整路由（页面 + 6 个步骤组件 + 1 个字段状态组件，87 处；`Stepper` / `Accordion` 首次生产迁移；E2E 改为未安装态六步真实流程）；条目 4 完成用户设置与认证 / 提交页（6 条路由 / 16 文件 / 119 处），`reader` 档 12 条预算按实测校准；条目 5 按绝对未覆盖语句数补测三模块（statements 100% / 98.87% / 100%），全仓 Statements 80.40% → 80.66%（本批 +0.26pp，闭合 95 条），`+0.3pp` 因 3 模块池上限 +0.25pp 结构性不可达并已量化登记。剩余迁移面复算：组件 1,094 → **482 处 / 40 类**、`primeicons` 540 → **411 处**、token 1,445 → **1,442 处**。各批 Review Gate 均 Pass（Round 1–4 的 blocker 已逐项闭环）；阶段内共 37 个提交（含立项 1 个；其中 7 个为 Dependabot 依赖升级，业务 / 测试 / 文档提交 30 个）。`todo.md` 已清理，`roadmap.md` 已同步归档结论，回归窗口整体迁入 [2026-11-05-phase70-close.md](../reports/regression/archive/2026-11-05-phase70-close.md)，`docs/i18n/*/plan/roadmap.md` 摘要已同步。

> **ROI 评估**: 开工基座 `2.00`；管理端设置与通知 `1.50`；安装向导 `1.33`；用户设置与认证 `1.80`；覆盖率第十一批 `1.75`。

> 阶段规划详情、ROI 与回滚边界见 [项目计划归档](./archive/roadmap-phases-70.md)。
> 迁移方案事实源见 [PrimeVue → caomei-ui 迁移方案](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)（本阶段对应 §7 的 B3 段与 §3.11）。
> backlog 来源见 [长期规划与积压项](./backlog.md) 长期主线第 10 条（UI 组件库迁移）与第 1 条（测试覆盖率）。

**时间表**: 2026-11-03 ~ 2026-11-05

**准入前置（已核对 2026-11-03）**: 第六十九阶段已审计归档、`todo.md` 无已完成阶段正文、`git status` 干净且 `master` 与 `origin/master` 同步（`888c3bd9`）；CI 回执 Test / CodeQL 均 success；`caomei-ui@1.0.0` GA 已于 2026-11-02 发布，与 `1.0.0-rc.1` 运行时产物逐字节一致；阶段构成（A/A/A/A）经用户 2026-11-03 在候选页确认。

**剩余迁移面（2026-11-05 阶段收口复算，`governance:count:primevue-usage` 口径）**: PrimeVue 组件 **482 处 / 40 个组件名**；浮层族标签 8 处 / 8 文件（自有共享壳 `ConfirmDeleteDialog`，内部已用 `CaomeiDialog`）；`primeicons` **411 处**；token **1,442 处**；生产文件并集 56。

- [x] **1. B3 开工基座：caomei-ui 1.0.0 GA 升级 + 门禁扩展 + 参考态采集（P1）**
    - **执行范围**: 1a `1.0.0-rc.1 → 1.0.0` 精确升级（`APPROVED_VERSIONS`、`dependabot.yml` 注释复核、产物字节点检、复跑视觉 / parity / `keyCss`）；1b parity harness 扩第二 webServer（`MOMEI_INSTALLED=false`、独立端口 3002 与独立 project）与 `reader` 档预算校准能力；1c 在页面改动前采集 10 条参考态并写入 `reference-manifest.json`。
    - **非目标**: 不改页面 / 组件，不清 `--p-*`，不做图标全量，不调整既有 `admin` 档预算。
    - **收口（2026-11-03）**: 1a 完成精确升级，GA 与 rc.1 的 `.js` / `.mjs` / `.css` / `.vue` 产物零差异、`dist/styles/index.css` sha256 一致，锁文件 5 处（+5/−5）无无关漂移；复测 build 2m04s、视觉 18/18、parity 34/34、`keyCss` 61.79KB / 70KB、`typecheck` 0、全量 5,142 passed。1b/1c 完成第二 webServer（3002，`MOMEI_INSTALLED=false` + `TEST_MODE=false` + 内存库 + `DATABASE_SYNCHRONIZE=true`）与 `reader` 档预算显式化（`budget.ts` + 4 例单测），10 条 B3 路由登记为待迁移并采集参考态 20 张（manifest 34 → 54）；`reader` 档首次启用（6 条，2000px / 0.3%）。验证：parity 55/55（10.4 分钟）、全量 5,146 passed、`typecheck` / `lint` 0 error、CI visual job 超时改 30 分钟。

- [x] **2. B3-A 管理端设置与通知整路由迁移（P1）**
    - **执行范围**: 2a 设置主体（26 个设置组件 + `pages/admin/settings/index.vue` + `admin-floating-actions`，含 13 个 `TabPanel` 与 3 张 DataTable）；2b 主题工作台（`Panel→Card`、`ColorPicker`、`SelectButton`、`DataView`、3 个浮层内表单）；2c 剩余 1 张 DataTable（`notification-delivery-log-list`，含 `DatePicker`）+ `/admin/notifications` 整路由。
    - **非目标**: `--p-*` 与独立 `<i class="pi">` 清理（B4）；不改设置读写 API 与权限逻辑；不做半路由切换。
    - **收口（2026-11-04）**: 2a 25 个修改文件 + 3 个适配层（341 处；3 张 DataTable 一并迁完；设置页 light 64,028px / dark 91,926px，未归因 0；test 582 files / 5,153 passed、visual 18/18、parity 55/55）；2b 主题工作台 6 文件（42 处；新增主题页 / 画廊基线 4 张；子路由改 `migratedSubRoutes`；test 584 / 5,157、visual 22/22、parity 55/55；主题页 light 42,263px / dark 50,759px；审核 Round 1–4）；2c 通知管理 2 文件（`DatePicker` 首个生产用法；test 584 / 5,158、visual 22/22、parity 55/55；通知列表 light 52,786px / dark 53,759px；审核 Round 1 Pass → 2）。

- [x] **3. B3-C 安装向导整路由迁移（P2）**
    - **执行范围**: `Stepper` 族 / `Accordion` 族 / `Password` / `Message` 整批迁移；`pages/installation.vue` 的 21 处 `:deep()` 复核（其中 1 处 `.p-tag` 改写为 caomei 契约）；E2E 改为未安装态六步真实流程（含步骤头不可前跳）。
    - **非目标**: 不改服务端安装逻辑 / API / 中间件；不做真实安装环境改造；新增样式不得引入 `--p-*`。
    - **收口（2026-11-04）**: 页面 + 6 个步骤组件 + 1 个字段状态组件（共 87 处）；`Stepper` / `Accordion` 族首次生产迁移；E2E 第二 webServer（3002）改为未安装态六步真实流程并断言步骤头不可越过校验门，基线层补 4 条结构断言。验证：test 584 / 5,159 passed、visual 24/24、parity 55/55（安装向导 light 48,145px / dark 48,708px，未归因 0）、E2E 2/2；审核 A 轮 3 blocker（步骤头前跳 / 字段宽度上限 / stylelint）→ Pass，B 轮 6 blocker（基线时刻 / 标题左对齐 / 数字口径 / 五步口径 / backlog 过期 / 拆分依据）→ Pass。

- [x] **4. B3-D 用户设置与认证 / 提交页整路由迁移（P2，首次启用 reader 档）**
    - **执行范围**: `/settings` 页面 + `components/settings/` 6 个组件（5 个由条件 Tab 消费，`notification-history-list` 内嵌于通知面板；`FileUpload` / `ProgressSpinner` / `ToggleButton` / `Checkbox`）+ `login` / `register` / `forgot-password` / `reset-password` / `submit` 与 `components/auth-card.vue`（`Card` / `Message` / `fluid` 删除 / `severity→tone`）；`reader` 档首次启用并按实测校准预算。
    - **非目标**: 不改认证 / 注册 / 投稿业务逻辑与字段；不改服务端限流与校验。
    - **收口（2026-11-04）**: 16 个文件 / 119 处；6 条路由 × 2 主题参考态就绪，`reader` 档 12 条预算按实测校准（未归因 0）；`auth` / `submit` E2E 选择器改写后通过（chromium 单 worker；firefox / webkit 补跑 14 passed / 2 skipped）。验证：test 584 / 5,169 passed、visual 24/24、parity 55/55、chromium E2E 24 passed / 4 skipped（auth 5/1 + submit 2/2 + user-workflow 17/3）；实现审核 3 轮（Image 尺寸 / 品牌样式 / stub 契约）→ Pass，视觉文档审核 2 轮（归因错误 / 基线中间态 / 计数口径）→ Pass。

- [x] **5. 测试覆盖率治理第十一批（P2）**
    - **执行范围**: 开工时按绝对未覆盖语句数复算取前三模块 `migration-link-governance.ts`（32）/ `.helpers.ts`（30）/ `ai/tts.ts`（30）补测；失败 / 边界断言优先。
    - **非目标**: 不做全量铺量、不为冲数字写低价值断言。
    - **收口（2026-11-05）**: 三模块 statements 100% / 98.87% / 100%，均达「`+15pp` 或 `≥85%`」；全仓 Statements **80.40% → 80.66%（本批 +0.26pp，闭合 95 条 = 89 直接 + 6 间接）**；Branches 70.70% → 71.07%、Functions 78.92% → 79.08%、Lines 80.55% → 80.81%；`+0.3pp` 需 109 条而三模块池仅 92 条（上限 +0.25pp），结构性不可达并已量化登记。验证：`test:coverage` EXIT 0（586 文件 / 5,202 例，净增 33 例）、`typecheck` 0、`eslint` 0；审核 Round 1 双 Reject（测试非自包容 / 2 例断言无判别力；增量口径 / 阶段累计表述 / 归档指针）→ 修复 → Round 2 双 Pass。证据见 [回归归档分片](../reports/regression/archive/2026-11-05-phase70-close.md)。

**回滚边界**:

- 条目 1：版本、parity 配置与参考态各自独立可回退；删除参考态不影响迁移前基线。
- 条目 2：按 2a / 2b / 2c 独立回滚，`CAOMEI_UI_ROUTE_SCOPES` 同步收缩。
- 条目 3：安装路由独立回滚；第二 server 配置可单独摘除。
- 条目 4：`reader` 档预算条目可单条移除，路由回滚同步收缩 scope。
- 条目 5：测试文件独立可删。

**风险提示**:

- `notification-delivery-log-list` 属 B3 范围目录但唯一消费路由是 `/admin/notifications`，漏迁该路由会让组件迁移后落在未登记路由内（守卫只扫描已登记前缀，抓不到这类混用）。
- 参考态必须在页面改动前采集，`--revert` 只能补救、成本翻倍。
- `DatePicker` / `MultiSelect` / `Stepper` / `ColorPicker` / `DataView` / `FileUpload` 属首次生产迁移，须先做 1 个代表文件 + 定向回归再批量。
- `ToggleSwitch` 44 处的 `change` 载荷差异逐处核对。
- `reader` 档首次启用可能暴露历史漂移，校准样值入预算 `note`，禁止为变绿放宽阈值。

**验证汇总（阶段口径）**: 条目 1a 全量 5,142 → 条目 5 全量 **5,202 passed / 1 skipped（586 文件）**（阶段收口复跑 `test:coverage` 为 29,314/36,340，与条目 5 收口的 29,315 相差 1 条，差异来自 `composables/use-reader-mode.ts` 的非确定性覆盖路径，模块与百分比口径不变）；视觉 24/24、parity 55/55（含未安装态第二实例与 reader 档 12 条，未归因 0）、chromium E2E 24 passed / 4 skipped（auth 5/1 + submit 2/2 + user-workflow 17/3）；`typecheck` / `lint` / `lint:css` 0 error；阶段收口 `regression:phase-close` **EXIT 0**（含全量 E2E 228 passed / 34.1m），首屏包体与重复代码基线按 2026-11-05 实测重定标（365KB、0.5% / 48 clones）。

### 阶段收口检查清单

- [x] 当前阶段核心条目已完成（条目 1–5 全部关闭）
- [x] `todo.md` 已清理（当前无进行中阶段）
- [x] `todo-archive.md` 已追加归档块
- [x] `roadmap.md` 已同步阶段状态与结论（正文迁入 `archive/roadmap-phases-70.md`）
- [x] 回归记录 / Review Gate 证据可追溯（第七十阶段窗口整体迁入 `reports/regression/archive/2026-11-05-phase70-close.md`）
- [x] `lint-md` / `docs:check:i18n` / `docs:check:line-count` / `docs:check:links` / `docs:check:markers` 与最小质量门已确认
- [x] wisdom 蒸馏已执行：32 条 → 迁移至 `docs/standards/` 与 `docs/design/governance/`
- [x] 各条目 Review Gate 已 Pass（Round 1–4 的 blocker 已逐项闭环）
- [x] 阶段收口门禁：**Pass**。完整 `regression:phase-close` **EXIT 0**（`test:coverage` / `release:check:full` / 文档 / 包体 / 重复代码 / Review Gate 全通过；全量 E2E **228 passed** / 34.1m）；`security:alerts` 随修复推送后 CodeQL 重扫转 `fixed`；CI `Test` run `42016033169` 亦全绿（E2E 4/4 分片）
