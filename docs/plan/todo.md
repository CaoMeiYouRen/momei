# 墨梅博客 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

---

## 当前待办

### 第三十九阶段：公众号排版预览与治理基线落盘

> 执行策略: 本阶段按“`1` 个新功能 + `4` 个优化”推进，且所有治理项都必须保留 baseline / delta 对比；若执行中新增治理候选，不得直接膨胀待办，必须先回到 [backlog.md](./backlog.md) 或复用现有脚本口径。

1. [ ] 微信公众号格式预览 / 导出辅助 (P0)
- 验收标准: 先在 `docs/design/governance/` 或等价入口落一份专项设计文档，明确首版只交付“公众号风格预览 / 复制排版后内容”，不做编辑器替换；随后基于现有编辑器 / 分发预览表面补一条公众号样式转换链路，并验证标题层级、图片、引用块、代码块 / 提示容器、长文阅读连续性，以及复制结果一致性。
- 数据参考: 当前仓库已支持 `Memos / WechatSync` expanded preview 与 `finalMarkdown / bodyMarkdown / copyrightMarkdown` 三类输出，但尚无 dedicated `wechat_mp` render profile，也没有固定的“复制排版后内容”入口。
- 最小验证: 受影响组件 / composable 定向测试、必要的浏览器验证与剪贴板复制验证。
- 当前进展 (2026-05-20): 已补专项设计文档 `docs/design/governance/wechat-mp-preview-export-assist.md`，并在分发预览链路落地 `wechat_mp` profile（预览 / 预检）与 expanded preview 的“复制排版后内容”入口；运行时 dispatch 维持 raw/default payload，不改变既有 WechatSync 投递契约。本轮新增“外链自动转文末引用”转换能力（仅 `wechat_mp` preview/copy 生效，内链保持原样），同时兼容旧文章里的裸 URL，并将文末引用改为“标题在前、URL 代码样式在后”的不可点击格式；已补齐定向测试。待补收口项为浏览器侧复制验证证据。

2. [ ] 结构复用第三轮：3 个热点收敛 (P1，进行中)
- 验收标准: 以 `simple-duplicates` baseline 为事实源，至少完成 `3` 组热点收敛，并确保 `confirmDelete`（`13` 处）、`getStatusSeverity`（`9` 处）、`DistributionMaterialBundle`（`6` 处）这三组在重跑脚本后都能看到可对比的 delta；`pnpm duplicate-code:check` 基线不得反弹。
- 数据参考: 当前 baseline 为同名内部函数候选 `112`、同名 type/interface 候选 `156`、近似命名函数候选 `10`，产物落点为 `artifacts/governance/simple-duplicates-latest.md/.json`。
- 最小验证: `pnpm governance:audit:simple-duplicates`、`pnpm duplicate-code:check`、受影响 helper / 组件定向测试与类型检查。
- 当前进展 (2026-05-19): `confirmDelete`、`getStatusSeverity`、`DistributionMaterialBundle` 已从最新 `simple-duplicates` baseline 消失；最新统计为同名内部函数候选 `110`、同名 type/interface 候选 `27`、近似命名函数候选 `10`，`pnpm duplicate-code:check` 维持 `warn` 未反弹；`components/commercial-link-manager.test.ts`、`composables/use-delete-dialog-state.test.ts`、`tests/scripts/audit-simple-duplicates.test.ts`、`pnpm exec nuxt typecheck` 与 `pnpm lint` 已通过。
- 阻塞: 旧代码 blocker 已关闭，当前仅剩 [pages/admin/ad/placements.vue](pages/admin/ad/placements.vue#L46) 的最小浏览器验证证据未补齐；本地 Nuxt dev 在访问 `/login` / `/admin/ad/placements` 时首个 HTTP 响应卡住，尚未拿到实际页面 DOM，需待该既有环境问题恢复后补证据再正式收口。

3. [x] 注释治理首轮：1 - 2 组模块 (P1)
- 验收标准: 以 `comment-drift` baseline 为事实源，优先处理 `usePostEditorIO`（complexity `61`）与 `usePostEditorAI`（complexity `44`）；第二组只允许在 `useNotifications`、`useInstallationWizard`、`useAdminFriendLinksPage` 中三选一。所选模块必须补齐契约 / 副作用 / 失败回退类高价值注释，并同步清理对应文件中的 TODO / 漂移注释。
- 数据参考: 当前 baseline 为高复杂度导出函数缺注释候选 `177`、TODO / 临时口吻 `27`、疑似漂移注释 `298`，产物落点为 `artifacts/governance/comment-drift-latest.md/.json`。
- 最小验证: `pnpm governance:audit:comment-drift`、受影响 composable 定向测试与类型检查。
- 当前进展 (2026-05-19): 已完成 `usePostEditorIO`、`usePostEditorAI` 与 `useInstallationWizard` 三个 composable 的首轮注释治理，补齐导出契约、关键副作用与失败回退说明；所选文件内未命中 TODO / 临时口吻注释。最新 `comment-drift` 统计为高复杂度导出函数缺注释候选 `174`、TODO / 临时口吻 `27`、疑似逐行复述注释 `71`、疑似漂移注释 `298`；`composables/use-post-editor-io.test.ts`、`composables/use-post-editor-ai.test.ts`、`composables/use-installation-wizard.test.ts` 共 `19` 条定向测试通过，`pnpm exec nuxt typecheck` 与 Review Gate 均已通过。

4. [x] 文档 / 脚本治理最小收口包 (P0)
- 验收标准: 至少完成 `1` 组回归 / 指南类超长页收敛、`4` 份高频英文 must-sync 文档 freshness 回补，以及脚本治理 `3` 条现存 finding 的处置闭环（补脚本、补稳定入口，或明确下线），并保留前后对比证据。
- 数据参考: docs candidate 当前已暴露 `5` 个 line-count warning 面与 `6` 条 source-of-truth freshness 违规；脚本治理 baseline 为长期脚本 `39`、稳定入口 `37`、缺少稳定入口 `2`、文档声明但缺失 `1`。
- 最小验证: `pnpm lint:md`、`pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`、`pnpm governance:check:scripts`。
- 当前进展 (2026-05-19): 已完成 `docs/reports/regression/current.md` 的历史窗口滚动归档（新增 `docs/reports/regression/archive/2026-05-04-to-2026-05-06.md`，并同步 `archive/index.md`），活动窗口由 `588` 行降至 `235` 行；存储重写脚本的失效文档声明已下线，`capture-remote-cpuprofile.mjs` 与 `fs-watch-probe.mjs` 已补 package 级稳定入口（`pnpm perf:cpuprofile:remote`、`pnpm perf:fs-watch:probe:dev`）并同步到 `scripts/README.md`；`docs/i18n/en-US/index.md`、`docs/i18n/en-US/guide/quick-start.md`、`docs/i18n/en-US/guide/deploy.md`、`docs/i18n/en-US/guide/translation-governance.md` 的 `last_sync` 已回补到 `2026-05-19`。
- 验证结果 (2026-05-19): `pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`、`pnpm governance:check:scripts` 已通过；脚本治理最新统计为长期脚本 `39`、稳定入口 `39`、缺少稳定入口 `0`、文档声明但缺失 `0`。

5. [x] 国际化文案复用治理 (P1)
- 验收标准: 在保持 `pnpm i18n:audit:missing` 为 `0` 的前提下，同步执行 `pnpm i18n:audit:duplicates` 并将重复键分组作为复用治理事实源；同时把 `AppFooter`、`archives`、`categories`、`tags` 这 `4` 组公开装配链路纳入固定 runtime 验证面，并明确页面私有命名空间与共享组件命名空间的边界；新增范围内不得出现 raw key 暴露。
- 数据参考: 当前共享字段已在友链场景统一到 `components.friend_links.fields`，既有 runtime 验证已覆盖 About / friend-links；route-module 装配事实源位于 `i18n/config/locale-modules.ts`。
- 最小验证: `pnpm i18n:audit:duplicates`、`pnpm i18n:audit:missing`、`pnpm i18n:verify:runtime`、受影响页面 / 组件定向测试。
- 当前进展 (2026-05-19): 已将 `AppFooter`、`archives`、`categories`、`tags` 四组公开装配链路固定到 `i18n:verify:runtime` 测试面（`components/app-footer.test.ts`、`pages/archives/index.test.ts`、`pages/categories/index.test.ts`、`pages/tags/index.test.ts`），并补充 `i18n/config/locale-modules.test.ts` 与 `i18n/config/locale-runtime-loader.test.ts` 的边界断言，明确 `public` 模块承载页面私有命名空间（`pages.archives` / `pages.categories_index` / `pages.tags_index` / `pages.posts`），`components` 模块承载共享组件命名空间（`components.*` / `comments.*`）。本轮已启动首个重复键收敛切片：将 `pages.admin.link_governance.actions.refresh`、`pages.admin.notifications.delivery_logs.refresh`、`pages.admin.settings.system.audit_logs.refresh`、`pages.admin.users.refresh`、`pages.settings.notifications.history.refresh` 统一切换为 `common.refresh`，并同步删除 `5` 个 locale 下对应冗余键。
- 验证结果 (2026-05-19): `pnpm i18n:audit:duplicates` 已执行（扫描 `5` 个 locale，命中 `100` 组跨全语种一致的重复键组，其中 `55` 组跨模块；较治理前 `101` / `56` 下降 `1` 组）；`pnpm i18n:audit:missing` 结果为 `0`；`pnpm i18n:verify:runtime` 通过（`15` 个测试文件、`108` 条用例），新增范围未出现 raw key 暴露。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

