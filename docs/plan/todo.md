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

2. [ ] 结构复用第三轮：3 个热点收敛 (P1，进行中)
- 验收标准: 以 `simple-duplicates` baseline 为事实源，至少完成 `3` 组热点收敛，并确保 `confirmDelete`（`13` 处）、`getStatusSeverity`（`9` 处）、`DistributionMaterialBundle`（`6` 处）这三组在重跑脚本后都能看到可对比的 delta；`pnpm duplicate-code:check` 基线不得反弹。
- 数据参考: 当前 baseline 为同名内部函数候选 `112`、同名 type/interface 候选 `156`、近似命名函数候选 `10`，产物落点为 `artifacts/governance/simple-duplicates-latest.md/.json`。
- 最小验证: `pnpm governance:audit:simple-duplicates`、`pnpm duplicate-code:check`、受影响 helper / 组件定向测试与类型检查。
- 当前进展 (2026-05-19): `confirmDelete`、`getStatusSeverity`、`DistributionMaterialBundle` 已从最新 `simple-duplicates` baseline 消失；最新统计为同名内部函数候选 `110`、同名 type/interface 候选 `27`、近似命名函数候选 `10`，`pnpm duplicate-code:check` 维持 `warn` 未反弹。
- 阻塞: 当前 diff 审查发现 [pages/admin/ad/placements.vue](pages/admin/ad/placements.vue#L38) 列表误删 adapter 列，且 [components/commercial-link-manager.test.ts](components/commercial-link-manager.test.ts#L208) 仍调用旧的 `confirmDelete` 导致定向测试失败；修复并补回验证前不得标记完成。

3. [ ] 注释治理首轮：1 - 2 组模块 (P1)
- 验收标准: 以 `comment-drift` baseline 为事实源，优先处理 `usePostEditorIO`（complexity `61`）与 `usePostEditorAI`（complexity `44`）；第二组只允许在 `useNotifications`、`useInstallationWizard`、`useAdminFriendLinksPage` 中三选一。所选模块必须补齐契约 / 副作用 / 失败回退类高价值注释，并同步清理对应文件中的 TODO / 漂移注释。
- 数据参考: 当前 baseline 为高复杂度导出函数缺注释候选 `177`、TODO / 临时口吻 `27`、疑似漂移注释 `298`，产物落点为 `artifacts/governance/comment-drift-latest.md/.json`。
- 最小验证: `pnpm governance:audit:comment-drift`、受影响 composable 定向测试与类型检查。

4. [ ] 文档 / 脚本治理最小收口包 (P0)
- 验收标准: 至少完成 `1` 组回归 / 指南类超长页收敛、`4` 份高频英文 must-sync 文档 freshness 回补，以及脚本治理 `3` 条现存 finding 的处置闭环（补脚本、补稳定入口，或明确下线），并保留前后对比证据。
- 数据参考: docs candidate 当前已暴露 `5` 个 line-count warning 面与 `6` 条 source-of-truth freshness 违规；脚本治理 baseline 为长期脚本 `39`、稳定入口 `37`、缺少稳定入口 `2`、文档声明但缺失 `1`。
- 最小验证: `pnpm lint:md`、`pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`、`pnpm governance:check:scripts`。

5. [ ] 国际化文案复用治理 (P1)
- 验收标准: 在保持 `pnpm i18n:audit:missing` 为 `0` 的前提下，把 `AppFooter`、`archives`、`categories`、`tags` 这 `4` 组公开装配链路纳入固定 runtime 验证面，并明确页面私有命名空间与共享组件命名空间的边界；新增范围内不得出现 raw key 暴露。
- 数据参考: 当前共享字段已在友链场景统一到 `components.friend_links.fields`，既有 runtime 验证已覆盖 About / friend-links；route-module 装配事实源位于 `i18n/config/locale-modules.ts`。
- 最小验证: `pnpm i18n:audit:missing`、`pnpm i18n:verify:runtime`、受影响页面 / 组件定向测试。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

