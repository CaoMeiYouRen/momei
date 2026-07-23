# 墨梅博客 待办事项 （Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事（ (To）o) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 （Todo）
- [x] 已完成 （Done）
- [-] 已取消 （Cancelled）

---

## 第五十九阶段：AI 编辑增强与展示优化（已审计归档）

> 执行时间: 2026-07-22 ~ 2026-07-23（2 天，密集交付）
> 本阶段已审计归档，详细记录见 [待办归档](./todo-archive.md#第五十九阶段ai-编辑增强与展示优化-已审计归档)。

---

## 第六十阶段：编辑器延续与代码质量治理

> 执行时间: 2026-07-23 ~ 约 3-4 天
> 详细规划: [项目计划 - 第六十阶段](./roadmap.md#第六十阶段编辑器延续与代码质量治理phase-60-editor-continuation--code-quality-governance)

### P0 — AI 编辑增强：续写（Continue，候选 #9 子功能）

- [x] 后端：新增 `/api/ai/continue` 端点（`server/api/ai/continue.post.ts`），复用现有 AI 管线（`TextService.continueWriting()` + `AI_PROMPTS.CONTINUE` 模板）
- [x] 前端：编辑器工具栏新增"续写"按钮（`#ai-continue-btn`），基于光标位置或选中文本续写内容
- [x] 计费：复用 AI 计费和额度管理，支持 continue 操作类型（`recordTask({ type: 'continue' })`）
- [x] 续写流程：取光标前上下文内容 → 调用 AI → 在光标处插入续写内容，支持撤销（Ctrl+Z）
- [x] i18n：新增续写相关文案翻译（zh-CN/en-US/zh-TW/ja-JP/ko-KR）
- [x] 验证：`pnpm typecheck` ✅ + `pnpm lint` ✅ + `pnpm test` ✅（503/504 files, 3958/3959 tests）
- [x] 审计 (A)：`code-quality-auditor` Review Gate Pass（无 blocker，证据见 `artifacts/review-gate/2026-07-23-ai-continue.md`）

### P1 — 响应式状态模型收敛：reactive 到 ref 渐进迁移 Step 1（候选 #14）

- [x] 识别 Step 1 目标文件清单：登录页、注册页、权益页、个人设置、安全设置中的 `form`/`errors` 类 `reactive` 对象
- [x] 逐文件迁移：`reactive({...})` → `ref<{...}>()`，补齐 `.value` 读取路径
- [x] 同步调整模板中对应变量的引用方式（`.value` 传播仅在 script 层，模板不变）
- [x] 定向验证：受影响页面的表单校验失败、提交成功/失败、弹窗开关行为不回退
- [x] 验证：`pnpm typecheck` + `pnpm lint` 通过

### P1 — Zod Schema 复用治理首批：Ad Campaign + Ad Placement（候选 #18）

- [x] 将 Ad Campaign 的 `createCampaignSchema`（`campaigns.post.ts`）和 `updateCampaignSchema`（`campaigns/[id].put.ts`）抽取到 `utils/schemas/ad.ts`：共享基对象 + `.partial()` 派生 update
- [x] 将 Ad Placement 的 `createPlacementSchema`（`placements.post.ts`）和 `updatePlacementSchema`（`placements/[id].put.ts`）抽取到 `utils/schemas/ad.ts`：共享基对象 + `.partial()` 派生 update
- [x] 确认 Ad Campaign/Placement 的 create/update 参数语义一致性（无 create 必填但 update 不可改字段，使用 `.partial()` 正确；update 独有字段 `impressions/clicks/revenue` 通过 `.extend()` 追加）
- [x] 更新 API handler 中的 import 路径指向共享 schema
- [x] 验证：`pnpm typecheck` ✅ + `pnpm lint`（定向文件）✅ + 受影响的定向测试（`placements.post.test.ts` 4/4 + `ad.service.test.ts` 6/6 + `ad.test.ts` + `post.test.ts` 46/46）全部通过 ✅

### P2 — 测试覆盖率 90%+ 第二批（长期主线 #1）

- [ ] 基于 Phase 59 缺口报告，选择下一批高价值覆盖缺口模块
- [ ] 补高价值缺口覆盖度，推进全仓 coverage +1%
- [ ] 验证：覆盖改进确认；`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过

### P2 — 多平台迁移适配器：Hugo 格式支持（候选 #12）

- [ ] 设计 `ContentParser` 接口抽象：`parse(sourceDir): Promise<ParsedPost[]>`
- [ ] 调研 Hugo Front-matter 格式差异（TOML/YAML/JSON），产出差异清单
- [ ] 实现 `HugoParser` 适配器（解析 TOML/YAML Front-matter → `ParsedPost` 结构）
- [ ] CLI 命令增加 `--format hugo` 参数，复用现有导入链路
- [ ] 添加适配器单元测试：title/date/tags/categories/content 正确映射
- [ ] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过；Hexo 解析无回归

---

## 阶段收口检查清单

- [ ] `todo.md` 当前阶段条目全部完成
- [ ] `roadmap.md` 同步阶段状态与收口结论
- [ ] 多语路线图摘要更新（`docs/i18n/*/plan/roadmap.md`）
- [ ] `pnpm typecheck` + `pnpm lint` 通过
- [ ] `pnpm test` + `pnpm test:coverage` 通过
- [ ] `pnpm docs:build` 通过
- [ ] Code Auditor Review Gate 通过
- [ ] 归档记录写入 `todo-archive.md`

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
