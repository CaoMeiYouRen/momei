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
> 开始进行待办时，在本区域填写正在进行的待办，结束后清理并更新对应条目状态。

> 阶段状态: 第三十三阶段已完成审计归档。第三十四阶段正式上收 —「1 个新功能评估 + 5 个优化」。新功能：前端直出 TTS + 直传 OSS 评估与原型；优化：coverage `80%+` 冲刺、周期性回归执行、ESLint 切片、i18n 扩面、文档翻译。

> 当前进行中: 第三十四阶段。

### 第三十四阶段：TTS 前端化评估与长期治理补欠

- [x] **前端直出 TTS + 直传 OSS 评估与原型 (P1)** ✅ 调试通过
	- 评估文档: `docs/design/governance/tts-frontend-direct-evaluation.md`
	- 火山 JWT 凭证: `server/utils/ai/tts-credentials.ts` + `server/api/ai/tts/credentials.post.ts`
	- 前端直连 (speech HTTP + podcast WebSocket): `composables/use-tts-volcengine-direct.ts`
	- 服务端代理兼容: `composables/use-post-tts-dialog.ts`（火山引擎自动走直连）
	- 元数据回写 + AI 计费: `server/api/posts/[id]/tts-metadata.put.ts`
	- 自动降级: `server/api/ai/tts/task.post.ts`（serverless 环境自动走直连）
	- 二进制协议对齐: V3 podcast WebSocket 帧构建/解析完全对齐 `volcengine-protocol.ts`
	- 环境变量: `TTS_FRONTEND_DIRECT` / `TTS_CREDENTIAL_TTL_SECONDS`
	- 非目标: 不重写 `TTSService.processTask()`，不动 `media-task-monitor`

- [ ] **测试覆盖率冲刺 80%+ (P0)**
	- 范围: 已从全仓 lines `75.28%` 拉升到 `78.06%`，本轮优先命中了 Phase 33/34 settings 面板、认证/通知边角、热点读链路失败路径与高 ROI composable / service 切片；后续继续冲 `80%+`。
	- 收口线: `>= 78%`（`80%+` 冲刺）。
	- 最新进度: 2026-05-04 全量 `pnpm test:coverage` 已达到 lines `78.06%`，阶段收口线达成；条目暂不关闭，后续从 `>= 78%` 转为继续冲 `80%+`。

- [ ] **周期性回归执行 (P1)**
	- 范围: `pnpm regression:phase-close` 真实回归，覆盖 coverage / lint-typecheck / dup code / docs / RG。
	- 非目标: 不新做回归规范体系。

- [x] **ESLint 下一轮切片 (P1)**
	- 范围: `no-non-null-assertion` composables 子桶；命中少则回退单文件 `no-explicit-any`。
	- 最新进度: 2026-05-04 已确认 `composables` 子桶没有新的 `no-non-null-assertion` 高 ROI 命中可继续上收，并已沿回退口径完成 `use-tts-task.ts`、`use-upload.ts`、`use-asr-task.ts`、`use-admin-ai.ts`、`use-admin-i18n.ts`、`use-post-editor-auto-save.ts`、`use-onboarding.ts`、`use-post-editor-page.helpers.ts`、`use-tts-volcengine-direct.ts`、`use-post-editor-ai.ts`、`use-post-editor-io.ts` 等 production composable 的 `no-explicit-any` 单文件 / 双文件切片；定向 ESLint、同级 Vitest 与 `npm run lint` 均通过，当前 `composables` 生产源码范围内已无这条主线的残余阻塞，因此条目正式关闭。

- [ ] **i18n 运行时继续扩面 (P1)**
	- 范围: `app-footer` / 公开页装配链路 / Phase 33 新增共享组件（auth-card, taxonomy-post-page）命名空间。
	- 验收: `i18n:audit:missing` 保持 0，新增一条公开页纳入 `i18n:verify:runtime`。
	- 最新进度: 2026-05-04 已修正 `auth-card` 真实 key 传递契约，移除 `taxonomy-post-page` 的 RSS `aria-label` 硬编码，并将 `pages/forgot-password.test.ts`、`pages/reset-password.test.ts`、`tests/pages/taxonomy-rss-discovery.test.ts` 纳入 `i18n:verify:runtime`；`pnpm exec vitest run --config vitest.i18n.config.ts` 通过。

- [x] **文档翻译 freshness 续 (P1)**
	- 范围: 清偿高频设计页 + 对外 guide 翻译 freshness。
	- 验收: `pnpm docs:check:source-of-truth` 可通过。
	- 最新进度: 2026-05-04 已复核 `pnpm docs:check:source-of-truth`，翻译文档 freshness 全量通过，当前阶段不再存在该条目的阻塞页。


## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

