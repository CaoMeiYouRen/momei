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

## 当前进行中阶段

**第七十三阶段：迁移后质量收尾与门禁硬化（筹备中：条目 1–5 待开工，条目 6 已完成）**

> 阶段规划、准入结论、ROI、回滚边界与风险提示见 [项目计划](./roadmap.md)；立项 2026-11-10，用户确认方案 A（备注 A+B+C：依赖 / 工具链余项排入第七十四阶段轨迹）。开工前置：`HEAD=2bffa330` 的 CI `Test` / `Publish Docker Image` 绿；若 Docker 原生多架构首次运行失败，按 B 类插队先修。

- [x] **1. UI S1 收尾：空态三态、空表分页与三处层序失效（P1）**
    - **执行范围**: 空态组件化（`AdminTableEmptyState` 补齐图标 / 说明 / 主操作，或新建共享 `AppEmptyState`）；替换 `pages/admin/{posts,comments,subscribers,waitlist}/index.vue`、`pages/posts/index.vue`、`components/admin/admin-taxonomy-page.vue`、`components/taxonomy-post-page.vue` 共 7 个文件对 `pages.posts.empty` 的复用（清单计划原口径 4 文件 / 5 页），按对象新增五语 key；空表不渲染分页（`paginator` + 空态判据约 7–10 处）；三处层序修复（`.social-btn` / `.admin-form-dialog` 宽度 / `.translation-badge` 尺寸）；同批改写 `docs/design/ui.md` §3.1+ 与文首指针。
    - **非目标**: 不做 U2 字阶全量替换、不做暗色 tint（S2）、不把 U1 扩到全部列表、不扩 reader parity 档。
    - **验收标准**: 空态 / 加载 / 错误三态截图（空态含图标 + 说明 + 操作）；空表无分页截图；五语 key 完整且无 raw key；三处 `getComputedStyle` 实测符合预期（社交按钮品牌色与布局、弹窗宽度 576 / 544 / 608px、徽标高 24px / min-width 32px）；`test:visual` / `parity` 通过并按实测更新基线；`lint` / `stylelint` / `typecheck` / 定向测试通过；`ui.md` 通过 `lint-md` / `docs:check:links` / `docs:check:line-count`。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；截图与 `getComputedStyle` 取值写入 `artifacts/review-gate/`，结论回填 `docs/reports/regression/current.md`。
    - **回滚边界**: 空态组件 / 分页绑定 / 三处样式修复按文件组独立回滚；`ui.md` 可单独回退。
    - **完成摘要（2026-11-10）**: 新增共享 `AppEmptyState`（图标 + 说明 + 主操作），替换 7 个文件对 `pages.posts.empty` 的复用并按对象补齐五语 key（评论 / 订阅者 / 候补 / 分类 / 标签 / 文章管理 + 公开列表说明）；空表分页改为按 `total` 判定（`total > 0` 才渲染，避免末页删空后无法回退），5 处绑定同步（分类 / 标签共用组件）；三处层序修复——`.social-btn` 与 `.admin-form-dialog` 宽度钩子移出 `@layer momei-base`（实测社交按钮品牌色生效、弹窗 608 / 576 / 544px），`.translation-badge` 复核维持 24px / 32px token 口径；`ui.md` §3.1–§3.4 按 caomei-ui 重写。验证：`test:visual` 32 passed、`test:visual:parity` 83 passed、`lint` / `lint:css` / `typecheck` 0 error、定向 vitest 144 passed；证据见 `artifacts/review-gate/2026-11-10-phase73-entry1-ui.md` 与 `artifacts/review-gate/entry1/`。

- [x] **2. 发布安全门禁收口：Code Scanning #43、过期台账与去过渡模式（P1）**
    - **执行范围**: #43（`js/bad-tag-filter`，`scripts/docs/check-doc-markers.mjs`，dismissed `won't fix`）优先修复正则；若确认脚本只读、输入为仓库受信文档、正则是检测器而非过滤器，则按 `false-positive` 重分类并登记依据；复核 `security-alert-exceptions.json` 的 mjml / quill 过期条目（续期并写明理由与跟踪，或替换 / 移除依赖）；移除 `package.json` 的 `--transition-mode`；同步 `docs/standards/security.md §5.3` 与 dismissed / fail-closed 治理文档。
    - **非目标**: 不改 critical 不可豁免与 open 告警阻断口径；不借机放宽 `--min-severity`。
    - **验收标准**: `pnpm security:alerts`（无 transition）Pass；`pnpm security:audit-deps` Pass；台账无过期项；CI `security:alerts` 绿；文档同步。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；门禁输出写入 `artifacts/review-gate/*-security-alerts.*`。
    - **回滚边界**: `--transition-mode` 移除可单独回退；#43 的 false-positive 重分类需在 GitHub 侧恢复原 dismiss 原因。
    - **完成摘要（2026-11-10）**: `scripts/docs/check-doc-markers.mjs` 的孤立尾行正则改为 `^--!?>(\s|$)`（同时接受 HTML5 的 `-->` / `--!>`）并补单测；GitHub 侧 #43 由 `won't fix` 重分类为 `false positive`，台账登记 `category: false-positive` / `location` / `expiresAt: 2027-05-15`；移除 `package.json` 的 `--transition-mode`，`security:alerts` 恢复完整阻断；删除 mjml（已无告警）与 quill（降为 low、无补丁，留 backlog）两条过期台账；同步 `security.md §5.3` 与 dismissed / fail-closed 治理文档退出记录。验证：`security:alerts` Pass（transition off、transition findings 0、warning 0）、`security:audit-deps` Pass（relevant risks 0）、`check-doc-markers.test.ts` 20 passed；CI `security:alerts` 待推送后回填。

- [x] **3. i18n 审计硬化：原文级重复键扫描与 PR 侧键漂移阻断（P2）**
    - **执行范围**: 在 `scripts/i18n/audit-duplicate-messages.mjs`（或独立脚本）补原文级重复键扫描（对象栈检测，30–50 行 + 单测 fixture 能判红），接入 `i18n:audit:duplicates` 或新增 `i18n:audit:raw-duplicates`；先以 warning 面运行；把 `i18n:audit:missing`（或 `i18n:check-sync --fail-on-diff`）加入 PR 侧 `test.yml` 的 `test` job（现执行 `pnpm run lint` / `lint:i18n` / `lint:css`）。
    - **非目标**: 不做全量 key 重构、不清现有 99 组已解析重复键（只处理原文级与新增）。
    - **验收标准**: 新脚本单测通过（含重复键 fixture 判红）；当前原文级重复键 0；五语 sync 通过；PR 侧缺失键能判红（用单测或临时分支模拟）；`lint:i18n` 与 `docs:check:i18n` 绿。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；脚本输出与 PR 门禁结论回填回归记录。
    - **回滚边界**: 新脚本与 CI 步骤独立可回滚（回退后回到 weekly 阻断）。
    - **完成摘要（2026-11-10）**: 新增 `scripts/i18n/audit-raw-duplicate-keys.mjs`（对象栈扫描同对象重复键，默认 warning、`--mode=error` 可阻断）与 11 例单测（7 纯函数 + 3 CLI + 1 目录扫描，含重复键 fixture 判红）；`i18n:audit:duplicates` 保持原样（仅跨语言文案候选），原文级扫描独立为 `i18n:audit:raw-duplicates` 入口（Round 1 的串联方案已回退）；`test.yml` 的 `test` job 增加 `i18n:audit:missing`（阻断）与 `i18n:audit:raw-duplicates`（warning）。实测 130 个 locale JSON 原文级重复键 0、五语 sync 通过；临时删除 `pages.admin.waitlist.empty_description` 后 `i18n:audit:missing` 退出 1 并点名该键，恢复后为 0。验证：`lint` / `lint:i18n` / `typecheck` 0 error、`docs:check:i18n` 通过。

- [ ] **4. 覆盖率第十四批（P2）**
    - **执行范围**: 按绝对未覆盖语句数选 4 模块且含 ≥1 大基数（候选 `composables/use-post-editor-ai.ts` 171 / `server/utils/ai/tts-volcengine-websocket.ts` 59 / `server/api/tasks/run-scheduled.post.ts` 22 + 1 个按实测选取），目标单批 `+0.3pp`（约 111 条）或模块级 `+15pp / ≥85%`。
    - **非目标**: 不做全量铺量；不追不可达分支；不重构测试结构。
    - **验收标准**: 干净全量跑（清 `.vitest-cache` + `--maxWorkers=4`）基线 / 收口；statements delta 落盘；定向测试通过；flaky 归因记录。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；基线 / 收口 `coverage-final.json` 副本写入 `artifacts/coverage/`。
    - **回滚边界**: 测试文件与覆盖率产物独立可回滚。

- [ ] **5. markdown-it 15 迁移（P2，含 kill-switch）**
    - **执行范围**: 先查 markdown-it 15.0.3 官方迁移说明与 5 个插件（`markdown-it-anchor` / `-container` / `-emoji` / `-github-alerts` / `-texmath`）兼容性；并同步升级 `@types/markdown-it`（当前 `^14.1.2`）；在 `utils/shared/markdown.ts` 收敛适配 `MarkdownRendererInstance.render` 的类型 / API 变化；修复 `article-content.vue` / `comment-item.vue` / `table-of-contents.vue` / `pages/admin/submissions/index.vue` / `utils/shared/distribution-template.ts` / `markdown.test.ts` 等 8+ 处类型错误。
    - **非目标**: 不改插件行为与渲染输出语义；不连带其他依赖升级；不做 Markdown 渲染重构。
    - **验收标准**: `pnpm typecheck` 0 error；`markdown.test.ts` + 全量 test 绿；Visual Regression 绿；PR #745 合入或关闭；若插件不兼容 15，记录证据并退回 backlog（kill-switch）。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；迁移指南结论与兼容矩阵写入 `docs/design/governance/` 或本阶段回归记录。
    - **回滚边界**: 依赖升级与适配层同批 revert；插件不兼容时不动依赖。

- [x] **6. nuxt 4.6.4 安全升级与视觉基线归因（P2，解阻 PR #1004）**
    - **执行范围**: `package.json` 将 `nuxt` 由 `^4.6.3` 抬至 `^4.6.4` 并重解析 `pnpm-lock.yaml`（PR #1004 仅改这两个文件；传递升级含 `nitropack 2.13.6` / `unrouting 0.3.2` / `archiver 8` / `readdir-glob 3` 等；规划阶段预估的 `rollup` / `unimport` / `unhead` / `unctx` 实际未变）；先在本地复现并逐处归因 Visual Regression 的 14 张失败快照（7 个用例文件 × 明暗两套）：`Test` 的 lint / typecheck 已绿，差异为 `AppHeader` 导航行约 144px 横向位移（疑似 admin-only 入口与通知区条件渲染）、列表页表格区多出 1px 竖线、`admin-theme-gallery-dialog` 元素高 364 → 384px，需判定是 `adminLocaleReady` 异步装载时序还是 4.6.4「内联组件样式改在样式表链接之后渲染」引发的层叠顺序变化，再决定修代码 / 修等待时序 / 更新基线，禁止直接 `--update-snapshots` 掩盖；同批复核行为变更：生产错误详情剥离（`error.vue` 现取 `statusMessage || message`）、`swr` / `isr` 仅缓存 GET/HEAD 且带 cookie 或 `private` / `no-store` 不再缓存（`/`、`/posts/:id`、`/tags/:slug`、`/categories/:slug`）、`x-forwarded-proto` 仅在 opt-in 时信任（反代绝对 URL 与安全 cookie）、`devServer.allowedHosts`、`workspaceDir` 检测；PR #1004 已由 dependabot 于 2026-11-10 合并（`8e354fa3`），无需再手动关闭或向 dependabot 分支推送。
    - **非目标**: 不连带 `typescript-checking` / `stylelint` / `markdown-it` 升级（条目 5 与各自 PR 单列）；不放宽 `maxDiffPixels` / `threshold`；不重构 `AppHeader`；不顺带做条目 1 的空态改造。
    - **验收标准**: `lint` / `lint:css` / `typecheck` 0 error；`test:visual` 绿且每处基线变化都有归因（不得只写「上游升级」）；`test:visual:parity` 无回归；SWR / ISR 二次请求实测命中与响应头符合新规则；反代 HTTPS 场景绝对 URL 与安全 cookie 实测通过；`security:audit-deps` 无新增 high+；CI `Test`（含 Visual Regression）与 `Publish Docker Image` 绿；PR #1004 关闭。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；差异对照图、归因结论与 `getComputedStyle` 取值写入 `artifacts/review-gate/`，阶段结论回填 `docs/reports/regression/current.md`。
    - **回滚边界**: `package.json` + `pnpm-lock.yaml` 与基线更新同批 revert；若归因为测试时序，等待 / fixture 改动可单独回滚。
    - **完成摘要（2026-11-10）**: 依赖升级已由 base 的 `8e354fa3`（dependabot，PR #1004）合入；本提交只剩预览卡日期固定与 14 张基线归因（原 `new Date()` 使主题工作台基线每日漂移，占用约一半像素容差）——页头整体右移 144px 是 4.6.3 下 `caomei-ui` 按钮规则压过组件 `display:none` 导致 3 个桌面隐藏控件泄漏，弹窗 +20px 是 `:deep(.caomei-card__body)` 的 `1.25rem` padding 恢复生效，页脚外链图标为 0.45px 亚像素抗锯齿差异；`test:visual` 32 passed、`test:visual:parity` 83 passed、`lint` / `lint:css` / `typecheck` 0 error；证据见 `artifacts/review-gate/2026-11-10-nuxt-4.6.4-upgrade.md`。遗留：首页 SWR 因 i18n 响应 `Set-Cookie` 不再缓存，已登记 backlog 候选；CI `Test` / `Publish Docker Image` 待推送后回填。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
