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

## 第六十阶段：用户体验闭环与代码质量治理

> 执行时间: 2026-07-23 ~ 约 3-4 天
> 详细规划: [项目计划 - 第六十阶段](./roadmap.md#第六十阶段用户体验闭环与代码质量治理phase-60-ux-closure--code-quality-governance)

### P0 — 安装引导向导（候选 #11）

- [ ] 新增 `/onboarding` 页面（基于 PrimeVue Stepper 组件），包含环境自检 → 管理员创建 → 站点基本配置 → 数据迁移建议四步
- [ ] 新增 `server/api/system/initialize` 接口，处理管理员创建、配置写入及初始化锁定逻辑
- [ ] 实现 `RuntimeConfig = Merged(Environment, Database Settings)` 配置混合模式
- [ ] 创建 `server/utils/settings.ts` 工具函数，用于从数据库加载动态配置
- [ ] App 顶层增加重定向逻辑：当数据库用户表为空时自动跳转 `/onboarding`
- [ ] 初始化完成后禁止再次访问向导
- [ ] i18n：新增引导向导相关文案翻译（zh-CN/en-US/zh-TW/ja-JP/ko-KR）
- [ ] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过

### P1 — AI 编辑增强：续写（Continue，候选 #9 子功能）

- [ ] 后端：新增 `/api/ai/continue` 端点，复用现有 AI 管线
- [ ] 前端：编辑器工具栏新增"续写"按钮，基于光标位置或选中文本续写内容
- [ ] 计费：复用 AI 计费和额度管理，扩展支持 continue 操作类型
- [ ] 续写流程：选中文本 → 调用 AI → 在光标处插入续写内容，支持撤销
- [ ] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过
- [ ] 审计 (A)：`code-quality-auditor` Review Gate Pass

### P1 — 响应式状态模型收敛：reactive 到 ref 渐进迁移 Step 1（候选 #14）

- [ ] 识别 Step 1 目标文件清单：登录页、注册页、权益页、个人设置、安全设置中的 `form`/`errors` 类 `reactive` 对象
- [ ] 逐文件迁移：`reactive({...})` → `ref<{...}>()`，补齐 `.value` 读取路径
- [ ] 同步调整模板中对应变量的引用方式（`.value` 传播仅在 script 层，模板不变）
- [ ] 定向验证：受影响页面的表单校验失败、提交成功/失败、弹窗开关行为不回退
- [ ] 验证：`pnpm typecheck` + `pnpm lint` 通过

### P1 — Zod Schema 复用治理首批：Ad Campaign + Ad Placement（候选 #18）

- [ ] 将 Ad Campaign 的 `createCampaignSchema`（`campaigns.post.ts`）和 `updateCampaignSchema`（`campaigns/[id].put.ts`）抽取到 `utils/schemas/ad.ts`：共享基对象 + `.partial()` 派生 update
- [ ] 将 Ad Placement 的 `createPlacementSchema`（`placements.post.ts`）和 `updatePlacementSchema`（`placements/[id].put.ts`）抽取到 `utils/schemas/ad.ts`：共享基对象 + `.partial()` 派生 update
- [ ] 确认 Ad Campaign/Placement 的 create/update 参数语义一致性（如有字段在 create 时必填但在 update 时不可改，使用 `.omit()` 而非 `.partial()`）
- [ ] 更新 API handler 中的 import 路径指向共享 schema
- [ ] 验证：`pnpm typecheck` + `pnpm lint` + 受影响 API（campaign/create/update、placement/create/update）的定向测试通过

### P2 — 测试覆盖率 90%+ 第二批（长期主线 #1）

- [ ] 基于 Phase 59 缺口报告，选择下一批高价值覆盖缺口模块
- [ ] 补高价值缺口覆盖度，推进全仓 coverage +1%
- [ ] 验证：覆盖改进确认；`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过

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
