# 短期候选与跟踪项解决归档

本文件承接 [backlog.md](../backlog.md) 中已完成处置的短期候选与跟踪项。backlog 只保留仍需排队或持续观察的条目；已上收、已闭合、已完成的事项整条迁入本文件，避免候选池与阶段正文重复统计。

> **维护约定**:
> 1. 旧编号仅用于对照历史文档与设计笔记。历史上长期主线与短期候选的编号曾多次重排，跨文档引用请按条目名称检索，不要按编号反查。
> 2. 每条只保留「处置阶段 / 日期 / 结论与证据」三要素（日期口径：条目闭合日优先，缺失时取所属阶段收口日）；实施正文见 `docs/plan/archive/` 的阶段规划分片与 [待办归档](../todo-archive.md)。
> 3. 已闭合但仍需长期遵守的边界条件（上游缺口、重新引入时的前置校验）不留在本文件沉睡，须回写为 backlog 的待跟踪项。

## 2026-11-18 清理批次

### 已上收至已完成阶段

| 旧编号 | 条目 | 处置 | 日期 | 结论与证据 |
| :--- | :--- | :--- | :--- | :--- |
| 9（重复编号） | Node 26 运行时基线单点化 | 第七十五阶段条目 7（插队，P1） | 2026-11-14 | `.nvmrc` = 26.13.1、`engines.node` = `26.x`、7 个 workflow 改 `node-version-file`、`Dockerfile` 基础镜像 `node:26.13.1-alpine`；原三处漂移（`engines` 24.x / Docker 24.22.1 / CI `lts/*`）已收敛，`better-sqlite3` ABI 报错消除。 |
| 5 | js-yaml 升级到 5.x | 第七十四阶段条目 1a | 2026-11-13 | override 归属 + 8 处命名导入 + 移除 `@types/js-yaml` + frontmatter 回归，含 kill-switch；`js-yaml@5.5.0` 自带类型。 |
| 6 | JekyllParser | 第七十六阶段条目 2 | 2026-11-15 | `JekyllParser` + `--format=jekyll` + 五字段映射与单测。 |
| 8 | 设置表单 AI Image Fallback 4 项 | 第七十六阶段条目 1 | 2026-11-15 | `SETTING_ENV_MAP` + 表单控件 + 五语。 |
| 9 | 编辑器工具栏 Phase C | 第七十六阶段条目 3 | 2026-11-15 | `PostEditorConsolidatedReviewPanel` 双 Tab + 前端编排两次调用。 |
| 11 | `useI18n()` 内联调用形态收敛 | 第七十一阶段条目 6c | 2026-11-08 | `snippet-aggregate-dialog` 2 处事件 / 异步内调用、`creator-stats-panel` 3 处 `computed` 内调用；含失败 / 边界断言与回归巡检口径。 |
| 12 | caomei-ui 状态色 tone 对比度修正 | 第六十九阶段条目 1 | 2026-11-01（闭合） | 上游以 `--caomei-color-*-text` 角色取代 tone 直用，momei 侧把该角色接入并存桥接；soft 8% 底实测明暗两态全部 ≥ 4.5:1，由 `tests/visual/caomei-token-bridge.visual.test.ts` 长期守卫。取证见 [2026-10-24-caomei-status-tone-contrast.md](../../design/governance/2026-10-24-caomei-status-tone-contrast.md)。 |
| 13 | i18n 键层缺陷清理 | 第七十一阶段条目 6b | 2026-11-08 | `admin-posts.json` 8 个重复键、`admin.json` 与 20 个模块文件的 20 组双源同键、`system.fields.*` 6 个死键、`home.hero.*` 3 个死键、`pages/submit.vue` 1 处硬编码。 |
| 14 | 依赖与工具链现代化 | 第七十四阶段条目 1a / 1b / 1c / 2a / 2b | 2026-11-13 | js-yaml 5、ESLint 严格规则批次（issue #262）、stylelint 18 与 `stylelint-config-cmyr` `^1.1.0` 配对、视觉门禁去 `continue-on-error`、入口包体专项。 |
| 15 | 首页 SWR / i18n cookie 决策 | 第七十六阶段条目 4 | 2026-11-15 | 线上探针确认 `/` 因 `Set-Cookie: i18n_redirected` 恒为 `DYNAMIC`（`/robots.txt` 为 `HIT`），选定「保持现状 + 边缘兜底」，不放宽 nitropack 缓存安全规则；后续改造登记为短期候选「首页缓存与语言检测解耦」。决策见 [2026-11-15-homepage-swr-i18n-cookie-decision.md §7](../../design/governance/2026-11-15-homepage-swr-i18n-cookie-decision.md#7-决策结论2026-11-15)。 |
| 16 | quill 上游补丁跟踪（GHSA-v3m3-f69x-jf25） | 依赖移除 | 2026-11-14 | 全仓检索确认 `quill` 零引用，实际编辑器为 `mavon-editor`；删除依赖与两处 no-op 配置后依赖图不再包含 quill，推送 `b649181e` 后 Dependabot 重扫关闭告警 #22。**边界**：若未来重新引入 quill，须先确认上游已修复 HTML 导出的 XSS（已在 backlog #10 待跟踪登记）。 |
| 17 | devcontainer 运行时基线对齐 | 第七十七阶段条目 6 | 2026-11-16 | 镜像升 `typescript-node:26-bookworm`、`postCreateCommand` 改用 `sudo npm install -g pnpm@11.17.0`；`tests/scripts/node-runtime-baseline.test.ts` 的 6 条静态守卫长期有效（镜像主版本 = `.nvmrc`、corepack 回流判红、pnpm 引导版本漂移判红）。 |

### 已上收至进行中阶段（第七十九阶段，2026-11-18 立项）

- **构建产物尺寸探针常驻** → 条目 2：沉淀为 `scripts/testing/probe-build-geometry.mjs` 并接入 `regression:weekly` 的 `required: false`，覆盖「开发态不可复现、只在生产构建暴露」类缺陷（如 `AppAvatar` 的 Fragment 根丢 attrs）；原一次性证据见 `artifacts/review-gate/2026-11-17-phase78-item5-build-probe.json`。
- **`reviewBy` 复核日期接入日常巡检** → 条目 3：接入 `security:audit-deps:daily` 的 summary / JSON 与 `security:alerts` 输出行，只增可见性，不改 severity 与退出码语义。
- **parity 允许清单清零脚本化** → 条目 4：由 `scripts/testing/prune-parity-allowlist.mjs` 按 testName 清零 `parity-budget.json` 的 `allowlist`（重采后执行），原「手工清零」待跟踪项关闭。

### 第八十阶段上收条目（2026-11-19 立项并完成）

- **CLI 迁移断点续传** → 条目 1（**已完成**）：`momei import` 增加本地状态文件、`--resume` / `--state-file` / `--clean-state`，新增 24 例单测；原候选中的「分布式 / 跨机器续传 / 自动重试」仍为非目标。提交 `bc93c165`。
- **首页缓存与语言检测解耦（② + ③ 组合）** → 条目 2（**已完成**）：`useCookie: false` + 显式切换写偏好 + 客户端根路径应用，`/` 去 `Set-Cookie` 并返回 `s-maxage`；新增 7 例 E2E 与 `probe:i18n-cache`，边缘 Cache Key 验证仍单列为未覆盖边界。提交 `5a6362e1`。

### 已完成 / 已闭合的跟踪项

- **AppAvatar 生产构建尺寸缺陷**（2026-11-17，第七十八阶段条目 5）：自有包装元素承载 `$attrs` 与 `--app-avatar-box`，内层按 100% 填满；构建产物实测 `/settings` 64px、`comments` 48px、`/admin/users` 32px。上游残差（`xlarge` 首字母字号、`comment-item` 原生懒加载）已回写 backlog 上游反馈跟踪。证据见 `artifacts/review-gate/2026-11-17-phase78-item5.md`。
- **会话数据 SSR / CSR 单一来源**（2026-11-16，第七十七阶段条目 2）：服务端注入 `auth:route-session:*` 为唯一来源，移除 `settings-profile` 的 `ClientOnly`，并以守卫钉住「会话驱动型兜底不得扩散」。
- **`task-detail-content` 子路由整迁**（2026-11-06 闭环）：随 `/admin/ai/tasks/[id]` 整路由迁移完成并纳入 `AI_ROUTE_SCOPE.ownedFiles`；`DataTable` 缺 `#header` / `#footer` 的上游缺口已回写 backlog 待跟踪。
- **friend-link 归一化缺陷**（第七十一阶段条目 6d，2026-11-08 完成）：清洗收敛到 `saveFriendLinkEntity`，补「首尾空白不落库」失败断言，并与 `ensureUniqueFriendLinkUrl` 共用同一次清洗结果。
- **creator-stats 跨库聚合**（第七十四阶段条目 3a，2026-11-13）：`DATE_TRUNC('week' | 'month')` 的 PostgreSQL 专有依赖已处理，SQLite 下 `range=30/90` 不再 500。
- **admin-dashboard 响应式断点**（第七十四阶段条目 3b，2026-11-13）：`respond-to("md")` 误用改为 `respond-below`，恢复 1440px 下三卡横排。
- **typeorm-adapter 主键丢弃**（第七十四阶段条目 3c，2026-11-13）：`transformOutput` 不再用 `undefined` 覆盖由 `_id` 落位的 `id`。
- **PrimeVue 卸载后的三处层序失效**（第七十三阶段条目 1，2026-11-11）：社交登录按钮品牌色与布局、`admin-form-dialog` 宽度、`.translation-badge` 尺寸均已修复，并补浏览器人工验收。
- **i18n 原文级重复键扫描**（第七十三阶段条目 3，2026-11-11）：独立入口 `pnpm i18n:audit:raw-duplicates`（默认 warning、`--mode=error` 可阻断）与 `test.yml` 的 `i18n:audit:missing` 阻断已落地。

### 过时 / 已消解跟踪项的复核结论

- **`pnpm ai:check` 在 master 上为红**（2026-10-16 登记）：2026-11-18 复核 `node scripts/ai/check-governance.mjs` 通过（问题清单 / 影响范围 / 修复建议均为「无」），skill 内锚点链接不再命中 `skill-anchor-link` 规则。
- **DatePicker `id` 未关联 `<label for>`**（2026-10-16 登记）：B3 / B4 迁移后统一使用 `CaomeiDatePicker` 且 `id` 直落内层 input（`pages/admin/ad/campaigns.vue`、`components/admin/posts/publish-push-dialog.vue`、`components/admin/marketing-campaign-form.vue`），既有缺陷自然消解。
- **parity 参考态「34 张」的保留方式**（2026-10-16 登记）：口径已过期。当前 `tests/visual/parity/reference/` 有 **82 张**（41 路由 × 明暗两态），全部由 parity 门禁引用承担漂移检出，并由 `visual-reference-refresh.yml` 在 CI 重采；「就地保留 + CI 重采」即既定方式，不再单列收尾决策。相关边界不变：`capture-visual-reference.mjs` 的保护口径以 `--pass-with-no-tests` 处理「无待采目标」，由 `tests/scripts/capture-visual-reference.test.ts` 静态守卫锁定。
- **视觉门禁 `continue-on-error`**（2026-10-15 登记）：已随第七十四阶段条目 2a 移除，`visual` job 的基线层与 parity 层均为阻断门禁。
- **`p-fluid` 与迁移页幻影 token**（2026-10-24 登记）：`p-fluid` 全仓已无引用（2026-11-18 复核）；仅余 `--surface-ground` 3 处，已回写 backlog 长期主线 #6 待跟踪。
- **回归窗口阈值双口径**（2026-10-24 登记）：已收敛为 `scripts/docs/check-line-count.mjs` 的 `BASE_TARGETS` 单点（warn>500 / error>700），`docs/reports/regression/index.md` §3.1 改为指针引用。
- **en-US 规范翻译同步债务**（2026-11-03 登记，2026-11-06 复核消解）：`docs:check:source-of-truth` 当时 4 项 blocker 已消失，仅余 soft warning，按消解处理。
- **治理索引存量缺口**（2026-11-14 登记）：随第七十八阶段条目 2 收口，69 份治理文档分类处置后未登记项归零。
- **归档目录链接门禁盲区**（2026-11-14 登记）：随第七十七阶段条目 4 收口，`archive` 纳入 `docs:check:links`（扫描面 354 个 md、0 失效），新增分片同样受门禁约束。

## 旧编号对照

本表只映射仍在册的候选；#5 / #6 / #8 / #9 / #11–#17 已整条迁出，不再映射，如需反查请按条目名称检索。

| 旧编号 | 条目 | 新编号 |
| :--- | :--- | :--- |
| 1 | 会员 / 付费订阅体系 | 1 |
| 2 | 播客与多媒体扩展 | 2 |
| 3 | AI 视频生成与增强 | 3 |
| 4 | 国际化语种扩展留档 | 4 |
| 7 | 迁移进度可视化与断点续传 | 5 |
| 10 | Mergify 合并策略与 merge queue 采用 | 6 |
| 18 | 首页缓存与语言检测解耦 | 7 |

## 2026-11-26 上收批次（第八十六阶段）

### 已上收至进行中阶段（第八十六阶段，2026-11-26 立项）

| 旧编号 | 条目 | 处置 | 日期 | 结论与证据 |
| :--- | :--- | :--- | :--- | :--- |
| 5 | Mergify 合并策略与 merge queue 采用 | 第八十六阶段条目 86.2.2（确认档） | 2026-11-26 | 用户指令 A+B+C+D 纳入；本阶段只做 6 项可行性验证与 major 门禁，未验证前不改生产 `merge_method`；原文与验证清单见 [详细方案](../../design/governance/2026-10-12-mergify-merge-queue-adoption-evaluation.md)。 |
| 6 | 列表骨架屏视觉基线 | 第八十六阶段条目 86.3.1（C 线直接准入） | 2026-11-26 | 用户指令纳入；要求组件级冻结 pending 或测试专用挂载，不向生产路由注入延迟端点；85 阶段空态基线已交付。 |

## 相关文档

- [Backlog](../backlog.md)
- [项目计划](../roadmap.md)
- [待办事项](../todo.md)
- [待办归档](../todo-archive.md)
- [深度归档索引](./index.md)
