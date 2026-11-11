# 第七十三阶段规划归档：迁移后质量收尾与门禁硬化

> 本分片承接 `docs/plan/roadmap.md` 主窗口迁出的第七十三阶段完整规划正文（2026-11-11 阶段收口归档）。
> 条目执行明细、验收结论与证据见 [待办事项归档](../todo-archive.md) 的第七十三阶段归档块与 [回归归档分片](../../reports/regression/archive/2026-11-11-phase73-close.md)。

---

## 第七十三阶段：迁移后质量收尾与门禁硬化（已审计归档）

**时间表**: 2026-11-10 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 收口 PrimeVue 卸载后的视觉债与空态缺口，把发布安全门禁从过渡模式切回完整阻断，补齐 i18n 原文级重复键与 PR 侧键漂移门禁，推进覆盖率第十四批与 markdown-it 15 迁移，并解阻 nuxt 4.6.4 安全升级。本阶段不引入新功能，只做「迁移后收尾 + 门禁硬化 + 依赖解阻」。

**准入结论**: 六条条目经用户在候选页 2026-11-10 确认（方案 A；备注 A+B+C 的依赖 / 工具链余项排入第七十四阶段轨迹）：① UI S1 按 [界面自检清单 U1](../design/ui-review-checklist.md) 收尾——空态组件化（图标 + 说明 + 主操作）、空表不渲染分页、三处层序失效修复，并同批改写 `docs/design/ui.md` §3.1+；② 安全门禁优先修复 Code Scanning #43，无法修复则按 `false-positive` 重分类并留证，随后移除 `--transition-mode`；③ i18n 只补「原文级重复键扫描 + PR 侧 missing 阻断」，不动现有 99 组已解析重复键；④ 覆盖率沿用「清 `.vitest-cache` + `--maxWorkers=4`」的干净全量跑口径；⑤ markdown-it 15 先查上游迁移指南与插件兼容矩阵，不兼容即退回 backlog；⑥ nuxt 4.6.4 为官方安全发布（8 条 Nuxt + 3 条 Nitro 通告），GitHub Advisory DB 现行条目多于 4.6.2 / 4.6.3 已修复，本仓直接暴露面待复核（server island 未使用、routeRules 不承担鉴权，主要风险是 `swr` / `isr` 缓存与反代协议识别），故按 P2 与依赖解阻纳入，先于条目 1 执行以避免视觉基线二次漂移。ROI：UI S1 1.60 / 安全门禁 2.00 / i18n 1.75 / 覆盖率 2.00 / markdown-it 1.00（低于 §3.3 的 1.5 准入线，经用户确认以 kill-switch 纳入；若阶段超时优先移出）/ nuxt 升级 1.75。

**准入前置（已核对 2026-11-10）**: 第七十二阶段已审计归档、`todo.md` 无已完成阶段正文、工作区仅含本规划改动、`HEAD=2bffa330` 已推送；`docs/reports/regression/current.md` 仅保留 2026-11-09 阶段收口窗口；CI `Test` 与 `Publish Docker Image`（2bffa330）已于 2026-11-10 实测全绿，开工前置满足。若 Docker 原生多架构首次运行失败，按 B 类插队先修，不并入本阶段条目。

**阶段容量与移出顺序**: 本阶段是「收尾型」阶段，六条条目彼此独立、可分批提交：条目 1 涉及视觉与五语 key，条目 2 涉及安全台账与 CI 门禁，条目 3 涉及脚本与 PR 门禁，条目 4 是常规覆盖率批次，条目 5 是依赖迁移（含 kill-switch），条目 6 是 nuxt 安全抬版与视觉基线归因（解阻 PR #1004）。条目 1 与 2 为 P1，条目 3–6 为 P2；条目 6 与条目 1 都会改动 `tests/visual/__screenshots__/`，排程上先做条目 6 再做条目 1，避免同一批基线二次漂移。若阶段超时，按 5 → 6 → 3 → 4 的顺序移出。

1. **UI S1 收尾：空态三态、空表分页与三处层序失效（P1）**: 空态组件化（以 `AdminTableEmptyState` 为基座补齐图标 / 说明 / 主操作，或新建共享 `AppEmptyState`）；替换 `pages/admin/{posts,comments,subscribers,waitlist}/index.vue`、`pages/posts/index.vue`、`components/admin/admin-taxonomy-page.vue`、`components/taxonomy-post-page.vue` 共 7 个文件对 `pages.posts.empty` 的复用（清单计划原口径为 4 文件 / 5 页，按 2026-11-10 复算），按对象新增五语 key；空表不渲染分页（`paginator` + 空态判据约 7–10 处）；三处层序修复（`.social-btn` 移出 `@layer` 或走 `--caomei-button-*`、`.admin-form-dialog` 宽度改用 Dialog `width` 或移出层、`.translation-badge` 尺寸核实 token 钩子）；同批改写 `docs/design/ui.md` §3.1+ 与文首指针。**非目标**: 不做 U2 字阶全量替换、不做暗色 tint（S2）、不把 U1 扩到全部列表、不扩 reader parity 档。**验收**: 空态 / 加载 / 错误三态截图（空态含图标 + 说明 + 操作）；空表无分页截图；五语 key 完整且无 raw key；三处 `getComputedStyle` 实测符合预期（社交按钮品牌色与布局、弹窗宽度 576 / 544 / 608px、徽标高 24px / min-width 32px）；`test:visual` / `parity` 通过并按实测更新基线；`lint` / `stylelint` / `typecheck` / 定向测试通过；`ui.md` 通过 `lint-md` / `docs:check:links` / `docs:check:line-count`。**验证矩阵**: V0 + V1 + V2 + V3 + RG。
2. **发布安全门禁收口：Code Scanning #43、过期台账与去过渡模式（P1）**: Code Scanning #43（`js/bad-tag-filter`，`scripts/docs/check-doc-markers.mjs`，dismissed `won't fix`）——优先修复正则；若确认脚本只读、输入为仓库受信文档、正则是检测器而非过滤器，则按 `false-positive` 重分类并登记依据；复核 `security-alert-exceptions.json` 的 mjml / quill 过期条目（续期并写明理由与跟踪，或替换 / 移除依赖）；移除 `package.json` 的 `--transition-mode`；同步 `docs/standards/security.md §5.3` 与 [dismissed 与 fail-closed 对齐](../design/governance/2026-11-03-release-security-gate-dismissed-fail-closed.md)。**非目标**: 不改 critical 不可豁免与 open 告警阻断口径；不借机放宽 `--min-severity`。**验收**: `pnpm security:alerts`（无 transition）Pass；`pnpm security:audit-deps` Pass；台账无过期项；CI `security:alerts` 绿；文档同步。**回滚**: `--transition-mode` 移除可单独回退；#43 的 false-positive 重分类需在 GitHub 侧恢复原 dismiss 原因。**验证矩阵**: V0 + V1 + V2 + RG。
3. **i18n 审计硬化：原文级重复键扫描与 PR 侧键漂移阻断（P2）**: 在 `scripts/i18n/audit-duplicate-messages.mjs`（或独立脚本）补原文级重复键扫描（对象栈检测，30–50 行 + 单测 fixture 能判红），接入 `i18n:audit:duplicates` 或新增 `i18n:audit:raw-duplicates`；先以 warning 面运行；把 `i18n:audit:missing`（或 `i18n:check-sync --fail-on-diff`）加入 PR 侧 `test.yml` 的 `test` job（现执行 `pnpm run lint` / `lint:i18n` / `lint:css`）。**非目标**: 不做全量 key 重构、不清现有 99 组已解析重复键（只处理原文级与新增）。**验收**: 新脚本单测通过（含重复键 fixture 判红）；当前原文级重复键 0；五语 sync 通过；PR 侧缺失键能判红（用单测或临时分支模拟）；`lint:i18n` 与 `docs:check:i18n` 绿。**验证矩阵**: V0 + V1 + V2 + RG。
4. **覆盖率第十四批（P2）**: 按绝对未覆盖语句数选 4 模块且含 ≥1 大基数（候选 `composables/use-post-editor-ai.ts` 171 / `server/utils/ai/tts-volcengine-websocket.ts` 59 / `server/api/tasks/run-scheduled.post.ts` 22 + 1 个按实测选取），目标单批 `+0.3pp`（约 111 条）或模块级 `+15pp / ≥85%`。**非目标**: 不做全量铺量；不追不可达分支；不重构测试结构。**验收**: 干净全量跑基线 / 收口；statements delta 落盘；定向测试通过；flaky 归因记录。**验证矩阵**: V0 + V1 + V2 + RG。
5. **markdown-it 15 迁移（P2，含 kill-switch）**: 先查 markdown-it 15.0.3 官方迁移说明与 5 个插件（`markdown-it-anchor` / `-container` / `-emoji` / `-github-alerts` / `-texmath`）兼容性；并同步升级 `@types/markdown-it`（当前 `^14.1.2`）；在 `utils/shared/markdown.ts` 收敛适配 `MarkdownRendererInstance.render` 的类型 / API 变化；修复 `article-content.vue` / `comment-item.vue` / `table-of-contents.vue` / `pages/admin/submissions/index.vue` / `utils/shared/distribution-template.ts` / `markdown.test.ts` 等 8+ 处类型错误。**非目标**: 不改插件行为与渲染输出语义；不连带其他依赖升级；不做 Markdown 渲染重构。**验收**: `pnpm typecheck` 0 error；`markdown.test.ts` + 全量 test 绿；Visual Regression 绿；PR #745 合入或关闭；若插件不兼容 15，记录证据并退回 backlog（kill-switch）。**验证矩阵**: V0 + V1 + V2 + V3 + RG。
6. **nuxt 4.6.4 安全升级与视觉基线归因（P2，解阻 PR #1004）**: `package.json` 将 `nuxt` 由 `^4.6.3` 抬至 `^4.6.4` 并重解析 `pnpm-lock.yaml`（PR #1004 仅改这两个文件；传递升级含 `nitropack 2.13.6` / `unrouting 0.3.2` / `archiver 8` / `readdir-glob 3` 等（规划阶段预估的 `rollup` / `unimport` / `unhead` / `unctx` 实际未变））；先在本地复现并逐处归因 Visual Regression 的 14 张失败快照（7 个用例文件 × 明暗两套，`Test` 的 lint / typecheck 已绿）：`AppHeader` 导航行约 144px 横向位移（疑似 admin-only 入口与通知区条件渲染）、列表页表格区多出 1px 竖线、`admin-theme-gallery-dialog` 元素高 364 → 384px，需判定是 `adminLocaleReady` 异步装载时序还是 4.6.4「内联组件样式改在样式表链接之后渲染」引发的层叠顺序变化，再决定修代码 / 修等待时序 / 更新基线，禁止直接 `--update-snapshots` 掩盖；同批复核行为变更：生产错误详情剥离（`error.vue` 现取 `statusMessage || message`）、`swr` / `isr` 仅缓存 GET/HEAD 且带 cookie 或 `private` / `no-store` 不再缓存、`x-forwarded-proto` 仅在 opt-in 时信任（反代绝对 URL 与安全 cookie）、`devServer.allowedHosts`、`workspaceDir` 检测；落地后在 master 提交并关闭 PR #1004（不推 dependabot 分支）。**非目标**: 不连带 `typescript-checking` / `stylelint` / `markdown-it` 升级；不放宽 `maxDiffPixels` / `threshold`；不重构 `AppHeader`。**验收**: `lint` / `lint:css` / `typecheck` 0 error；`test:visual` 绿且每处基线变化有归因；`test:visual:parity` 无回归；SWR / ISR 二次请求实测命中与响应头符合新规则；反代 HTTPS 下绝对 URL 与安全 cookie 实测；`security:audit-deps` 无新增 high+；CI `Test`（含 Visual Regression）与 `Publish Docker Image` 绿；PR #1004 关闭。**验证矩阵**: V0 + V1 + V2 + V3 + RG。

**回滚边界**:

- 条目 1：空态组件 / 分页绑定 / 三处样式修复按文件组独立回滚；`ui.md` 为文档改动，可单独回退。
- 条目 2：`--transition-mode` 移除可单独回退；#43 的 false-positive 重分类需在 GitHub 侧恢复原 dismiss 原因。
- 条目 3：新脚本与 CI 步骤独立可回滚（回退后回到 weekly 阻断）。
- 条目 4：测试文件与覆盖率产物独立可回滚。
- 条目 5：依赖升级与适配层同批 revert；插件不兼容时不动依赖。
- 条目 6：`package.json` + `pnpm-lock.yaml` 与视觉基线更新同批 revert；若归因为测试时序，等待 / fixture 改动可单独回滚。

**风险提示**: ① 空态替换会改变 parity 基线（基线本身多为空态），须同批更新并归因；② 三处层序修复可能牵动其他依赖同一 `@layer` 的规则，须用浏览器 `getComputedStyle` 逐项验收，不能只看截图；③ #43 若无法修复且 false-positive 依据不足，保留过渡模式并记录，不强行放行；④ i18n 原文级扫描先以 warning 面运行，避免误报阻断；⑤ markdown-it 15 的插件兼容性是本阶段最大不确定项，先调研后动代码；⑥ nuxt 4.6.4 的 14 张视觉差异必须先归因再更新基线——若「管理入口未渲染」实为 `adminLocaleReady` 异步装载时序，应改等待 / fixture，否则会把不稳定渲染固化成基线；该批基线与条目 1 重叠，须按条目 6 → 条目 1 顺序执行。
