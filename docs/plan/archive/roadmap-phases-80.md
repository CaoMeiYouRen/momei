# 第八十阶段规划正文（功能与体验收口）

> 归档说明：本阶段已于 2026-11-19 审计归档，规划正文自 [项目路线图](../roadmap.md) 主窗口迁出；条目执行明细见 [待办事项归档](../todo-archive.md) 的第八十阶段归档块，Review Gate 证据见 `artifacts/review-gate/2026-11-19-phase80-item{1..6}.md`。

## 规划正文

**时间表**: 2026-11-19 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 在第七十九阶段把门禁可信度收口后，转入一轮「一项用户可见功能 + 五项体验 / 债务收口」：CLI 迁移断点续传、首页缓存与语言检测解耦、字号归一第三批、覆盖率第二十一批、PWA 依赖窗口（2.0.2 + `generateSW` 迁移）与 parity 参考态重采清零。

**准入结论**: 用户于 2026-11-19 在候选页确认「方案 A：功能与体验优先」6 条组合，容量 6 条；ROI 均值 `2.00`（CLI 断点续传 `2.33` / 首页缓存解耦 `1.33` / 字号第三批 `2.33` / 覆盖率第二十一批 `1.50` / PWA 依赖窗口 `1.50` / parity 重采清零 `3.00`），为当轮三方案最高；未选方案 B（债务收口 III，`1.74`）与 C（性能专项，`1.87`），全部纳入分两期（D）亦未选。首页缓存解耦 ROI 落在 `1.0–1.5` 受控档，经用户在同一候选页明确确认纳入，保留 kill-switch。

**准入前置（已核对 2026-11-19）**: 第七十九阶段已审计归档（`todo.md` 无进行中阶段、`roadmap.md` 仅留摘要表与归档结论、回归窗口 51 行 / 3 条）；`master` 最新提交 `68ac1fab` 的 Test / Pages / Docker / TODO 全绿；open PR 0、open issue 仅 #262（ESLint 规则分批）；`pnpm security:audit-deps` 6 条台账豁免均 `reviewBy 2027-05-14`，`security:alerts` Pass。阶段基线：同源 statements **85.97%**（33,622 / 39,105）、`duplicate-code` 0.38%（43 clones / 665 行）、i18n `missing` 0 / duplicates 64 组（allowlist 预算 74）、字号 457 声明（token 139 / 可等价替换 274 / 口径内待替换 135 / 非字阶 149 / scss 变量 34）、`coreEntryJs` 281.07KB / 335KB、`keyCss` 59.44KB / 62KB、parity 41 路由 / 82 张参考态（`user-settings` 明暗各 2 条允许清单位于待清零状态）。

**阶段容量与移出顺序**: 6 条在办。排程 `3 → 5 → 1 → 4 → 6 → 2`（视觉与依赖窗口先落，CLI 与覆盖率在中段，parity 依赖 CI 重采时机，首页缓存放最后）；若阶段超时，按 `2 → 6 → 4` 的顺序移出——先移出外部依赖与风险最高项，不牺牲已稳定的实现面。

1. **CLI 迁移断点续传（P2 功能）**: 为 `momei import` 增加本地迁移状态文件（默认 `<sourceDir>/.momei-migration-state.json`），记录每篇的相对路径、内容哈希、`pending / success / failed / skipped` 状态、`postId`、错误与更新时间；新增 `--resume`（跳过已成功项）、`--state-file <path>`、`--clean-state`（运行前清除状态）。**非目标**: 不做分布式 / 跨机器续传、不做失败项自动重试、不做 Web 端进度页、不改导入接口契约。**验收标准**: 中断后重跑可跳过已成功项且仅重试失败 / 待处理项；内容变更（哈希不同）不得被误跳过；损坏 / 缺失状态文件可降级并给出可读提示；`--clean-state` 与 `--dry-run`（不写状态）行为明确；报告文件与退出码语义不变；单测覆盖状态读写、损坏降级、哈希变更、续传跳过与清理。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`packages/cli/src/import-command.test.ts` + 新增状态模块单测，证据落 `artifacts/review-gate/`。**回滚边界**: CLI 新增模块与命令参数独立 revert，不影响既有导入行为。

2. **首页缓存与语言检测解耦（P2 性能 / SEO，受控纳入）**: 落实 backlog 短期候选「② + ③ 组合」中仓库内可控部分——关闭或条件化 `detectBrowserLanguage.useCookie`（仅在显式切换语言时写偏好），使 `/` 不再返回 `Set-Cookie` 并进入既有 `routeRules['/'] = { swr }`；补五语根重定向与显式切换持久化的 E2E；提供可复跑响应头探针（`set-cookie` / `cache-control` / `cf-cache-status`）。**非目标**: 不放宽 nitropack 2.13.6 缓存安全规则、不改 `routeRules` 时长、不改鉴权 / 会话与 cookie 安全属性、不把 Cloudflare Cache Key 配置写成仓库内保证（边缘验证需用户 / 运维配合，单独登记）。**验收标准**: 本地 preview 探针显示 `/` 无 `Set-Cookie` 且有 `s-maxage`；五语根重定向与显式切换偏好持久化 E2E 通过且无 hydration 错误；前缀路由（`/en-US` 等）行为与决策记录一致；`docs/design/governance/2026-11-15-homepage-swr-i18n-cookie-decision.md` 补齐执行结果与未覆盖边界。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；探针 JSON / 截图与 E2E 日志落 `artifacts/review-gate/`。**回滚边界**: i18n 配置与 E2E 用例独立 revert；kill-switch 为恢复 `useCookie: true` 并保留既有 SSR 行为。**受控纳入说明**: ROI `1.33` 属 `1.0–1.5` 档，因用户候选页明确确认且与首页性能 / SEO 长期目标一致而纳入。

3. **字号归一第三批（P3 视觉）**: 处理 `components/admin/settings`（当前最大单点 35 处）与 `styles/_onboarding.scss` 的口径内待替换字面量，单批 ≤10 文件；`_onboarding.scss` 需在启动 tour 后截图取证。**非目标**: 不改非字阶取值、不批量按现值替换、不改暗色 tint、不扩 U1–U6、不动 admin-taxonomy 组件。**验收标准**: `governance:inventory:font-sizes` 口径内待替换由 135 降至 ≤100（本批 ≥35 处）且 token 覆盖上升；逐元素 `getComputedStyle` 对账 0 差异；`pnpm test:visual` 32/32、`pnpm test:visual:parity` 83/83 且未归因差异 0。**验证矩阵 / 证据落点**: V1 + V3 + RG；inventory JSON 与对账 / 截图落 `artifacts/review-gate/`。**回滚边界**: 按文件独立 revert。

4. **覆盖率第二十一批（P2）**: 取 `scripts/docs/check-line-count.mjs`（当前 10/56 = 17.9%）与 `scripts/testing/probe-build-geometry.mjs`（94/190 = 49.5%）的纯函数 / 参数解析 / 失败路径，目标同源 `+0.3pp`（约 115 条）或模块级 `+15pp / ≥85%`。**非目标**: 不对 `runRealProbes` 的真实浏览器启动做单测（保持脚本集成边界）；不重构脚本公开行为；不新增测试依赖；不为凑数测模板分支。**验收标准**: 干净全量跑基线 / 收口 delta 落 `artifacts/coverage/`；定向测试通过；flaky 归因记录；`check-line-count` ≥48/56，`probe-build-geometry` ≥162/190。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。**回滚边界**: 测试文件与覆盖率产物独立可回滚。

5. **PWA 依赖窗口与 `generateSW` 迁移（P2）**: `@vite-pwa/nuxt` 由 `^2.0.1` 升至 `^2.0.2`（含上游 #241 SW / manifest route rules 修复），并把已 deprecated 的 `pwa.workbox` 选项迁移到 `pwa.generateSW`，保持 `cleanupOutdatedCaches` / `clientsClaim` / `skipWaiting` / `navigateFallback` / denylist / `globPatterns` 语义不变。**非目标**: 不改 PWA 运行时策略与 manifest 内容、不引入新 PWA 能力、不升其他 major、不改 `nuxt.config` 之外的服务端路由。**验收标准**: `pnpm i --frozen-lockfile` 通过；`pnpm build` 无 `workbox option deprecated` 警告；产物 `sw.js` / `workbox-*.js` / `manifest.webmanifest` 与迁移前语义一致（precache 清单、skipWaiting、denylist）；`pnpm probe:build-geometry` 3/3；`test:visual` 32/32 与 parity 83/83；`security:audit-deps` / `security:alerts` Pass。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；构建产物与探针 JSON 落 `artifacts/review-gate/`。**回滚边界**: `package.json` / `pnpm-lock.yaml` / `nuxt.config.ts` 的 `pwa` 段同批 revert。

6. **parity 参考态重采与允许清单清零（P2）**: 触发 CI `visual-reference-refresh.yml` 全量重采，下载产物覆盖 `tests/visual/parity/reference/` 与 `reference-manifest.json`；运行 `pnpm prune:parity-allowlist --dry-run` 核对后落盘；复跑 `pnpm test:visual:parity` 并把「重采后的绿」或「预算内吸收的绿」写入 [偏差处置表](../../design/governance/visual-parity-deviation-register.md)。**非目标**: 不以本地重采作为门禁基线、不改预算阈值、不删除 note 历史、不自动重采。**验收标准**: 参考态与 manifest 来自 CI 同一次运行；`user-settings-light/dark` 与其余非空 allowlist 清零；parity 83/83 且未归因差异 0；偏差表中 `admin-posts-list` 与 `user-settings` 的「未归因·预算内吸收」行关闭或改写。**验证矩阵 / 证据落点**: V2 + RG；CI run 链接、prune 输出与 parity 报告落 `artifacts/review-gate/`。**回滚边界**: 参考态、manifest 与 `parity-budget.json` 独立 revert。

**回滚边界（阶段级）**: 条目 1 只动 CLI 与状态模块；条目 2 只动 i18n 配置 / E2E / 探针；条目 3 按文件 revert；条目 4 只动测试；条目 5 依赖声明与 `pwa` 选项同批 revert；条目 6 参考态与预算独立 revert。

**风险提示**: ① 首页缓存解耦会改变语言偏好持久化路径，必须先用 E2E 锁住五语根重定向与显式切换，边缘 Cache Key 未验证前不得声称「首屏已命中边缘」；② CLI 状态文件不得写进源仓库，默认放 `<sourceDir>` 且加入 `.gitignore` 提示与 `--state-file` 覆盖；③ 字号批次的 `_onboarding.scss` 必须启动 tour 后取证，禁止按静态值推断；④ 覆盖率若发现 `probe-build-geometry` 的纯函数与运行路径耦合，先抽纯函数再加用例，不为凑数 mock 浏览器；⑤ PWA 迁移必须核对产物而不只看无警告；⑥ parity 清零必须在 CI 重采之后，禁止把旧参考态差异当成已归因。

