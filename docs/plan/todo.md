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

> 第三十八阶段已正式上收为当前执行面，具体验收标准以 [项目计划](./roadmap.md) 与 [Phase 38 执行计划](../design/governance/phase-38-plan.md) 为准。

### 第三十八阶段：分发一致性修补与热点治理续推

- [x] **第三方分发标签尾注与预览一致性修补 (P1)**
	- 验收: 仅覆盖 `B 站 / Memos` 两个渠道；`B 站` 预览、`B 站` 实际同步 payload 与 `Memos` 预览三处输出在标签尾注上保持一致。
	- 验收: 预览构造与实际分发必须复用同一条标签标准化 / 尾注拼装入口，并明确“标签尾注中的标签项去除空格后再输出”的规则。
	- 验证: 分发物料 helper / template 测试 + 实际分发 / 导出层测试；必要时补一组后台分发预览组件测试。

- [x] **测试有效性第二轮切片 (P0)**
	- 验收: 至少完成 `3` 组高风险失败 / 边界断言，优先覆盖组件层 direct TTS 失败映射、页面级 auth degradation，以及 `settings public` 或 `friend-links` 的失败口径。
	- 验收: 其中至少 `1` 组必须覆盖用户可见错误映射，而不是只断言内部异常被抛出。
	- 结果: 已完成 `3` 组高风险切片：[components/admin/posts/post-tts-dialog.test.ts](../../components/admin/posts/post-tts-dialog.test.ts) 覆盖 direct TTS 任务创建失败后的可见错误映射；[pages/login.test.ts](../../pages/login.test.ts) 与 [pages/login.vue](../../pages/login.vue) 覆盖登录页 logical failure 后 `refreshAuthSession` 退化不吞主错误；[tests/server/api/settings/public.get.test.ts](../../tests/server/api/settings/public.get.test.ts) 覆盖 `503` bootstrap 失败不污染短 TTL runtime cache、后续成功请求可恢复。
	- 结果: 本轮至少 `2` 组直接覆盖用户可见错误映射（direct TTS 对话框错误文案、login 页认证失败提示），满足“不可只断言内部异常”的准入要求。
	- 验证: `pnpm exec vitest run components/admin/posts/post-tts-dialog.test.ts pages/login.test.ts tests/server/api/settings/public.get.test.ts`、`pnpm exec nuxt typecheck`，以及 [docs/reports/regression/current.md](../reports/regression/current.md) 中的本轮定向回归矩阵记录。

- [ ] **Postgres 公开热点读链路继续瘦身 (P0)**
	- 验收: 本轮只允许推进“公开热点读链路继续瘦身”，不并行开启剩余显式 `initializeDB()` 调用点审计。
	- 验收: 至少形成一组新的 `pg_stat_statements` 或等价 live sample，对照说明目标公开读路径的 calls、rows、mean time 或网络体量存在下降趋势，并回答当前超预算为何更像公开热读问题。
	- 验证: 受影响 API 定向测试、受影响文件类型检查，以及一组 live sample 或本地等价观测记录。

- [x] **结构复用第二轮（至少 3 处热点） (P1)**
	- 结果: 已完成 `3` 处热点收敛：`components/commercial-link-manager.vue` 将社交 / 打赏卡片区下沉到共享组件 `components/commercial-link-section.vue`；`utils/shared/commercial-schema.ts` 已把 `SocialLinkSchema / DonationLinkSchema` 收敛到同一工厂函数；`utils/shared/duration.ts` 已把秒 / 分钟解析与 fallback + clamp 逻辑收敛到共享内部 helper。
	- 基线: `pnpm duplicate-code:check` 已从 `55 clones / 1112 duplicated lines / 0.89%` 降到 `52 clones / 1035 duplicated lines / 0.83%`，且 `commercial-link-manager` 已脱离当前 `jscpd` 热点清单。
	- 候选: 下一轮可优先关注 `packages/cli/src/cli-shared.ts` vs `packages/mcp-server/src/tools/automation.ts`、`server/api/admin/external-links.post.ts` vs `server/api/admin/external-links/[id].put.ts`、`middleware/admin.ts` vs `middleware/author.ts`，以及 `components/admin/dashboard/creator-metric-card.vue` vs `components/admin/dashboard/metric-card.vue`。
	- 验证: `components/commercial-link-manager.test.ts`、`utils/shared/commercial-schema.test.ts`、`utils/shared/duration.test.ts`、`pnpm exec nuxt typecheck`、`pnpm duplicate-code:check`，以及浏览器侧验证 `http://127.0.0.1:3002/settings?tab=commercial` 上 `social-add -> social-save -> social-edit-0` 可回读新增 URL、`donation-add` 可打开打赏对话框（默认图片上传分支）。

- [x] **ESLint / 类型债下一轮窄切片 (P1)**
	- 验收: 继续坚持“单规则、单文件或双文件”切片，优先在 AI provider 聚合层与高 ROI 测试桩历史断言之间二选一推进。
	- 验收: 定向 ESLint、定向测试与类型检查通过，残余债务与下一轮候选有明确记录。
	- 结果: 已在 `server/utils/ai/index.ts` 为数据库 provider 值补上 `AIProviderType` 守卫与归一化 helper，移除直接写入 `AIConfig.provider` 的 `as any`；`server/utils/ai/index.test.ts` 同步把聚合层邻近的多处 `unknown as` 历史结构断言改为 `toMatchObject`，并补上“stored provider 不受支持时回退到 `openai`”的守线用例。
	- 残余债务: `server/utils/ai/index.ts` 当前仍维护一份本地 provider allowlist，与 `types/ai.ts` 中的 `AIProviderType` 不是单一事实源；若后续扩 provider，需要同步补一条 parity 守线，避免遗漏时静默回退到 `openai`。
	- 候选: 下一轮继续保持二选一，不并行扩面；可优先关注 `server/utils/ai/index.ts` 邻近的 provider / error typing 收口，或转向一组高 ROI 测试桩历史断言的继续收敛。
	- 验证: 定向 ESLint、定向 Vitest 与受影响文件类型检查。
	- 验证: `pnpm exec eslint server/utils/ai/index.ts server/utils/ai/index.test.ts`、`pnpm exec vitest run server/utils/ai/index.test.ts`、`pnpm exec nuxt typecheck`。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

