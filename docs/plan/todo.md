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

> 阶段状态: 第三十阶段已正式开启，当前按“1 个新功能 + 5 个优化”推进；第二十九阶段已完成审计归档，详细收口见 [待办归档](./todo-archive.md) 与 [项目计划](./roadmap.md)。

> 执行约束: 本阶段所有主线在进入实现前，必须先补齐执行范围、非目标、验证矩阵与证据落点；涉及新模块、跨模块或专项治理边界重写的事项，必须先完成 `docs/design/modules/` 或 `docs/design/governance/` 下的设计文档，再进入代码实现。

### 第三十阶段：Hexo 风格仓库同步与治理基线细化推进 (执行中)

1. [x] **Hexo 风格文章仓库同步（GitHub / Gitee）能力评估与候选落地 (P1)**
	- 验收: 先完成一份专项设计 / 评估文档，明确同步方向（单向导出 / 双向同步）、Hexo 目录结构、Front-matter 契约、媒体引用策略、认证方式（Token / SSH）、冲突策略、审计边界与回滚方式。
	- 验收: 首轮候选落地只允许收敛到“已发布文章 -> Hexo 风格 Markdown + Front-matter + 媒体引用 -> 单仓库推送”这一条最小闭环，不得在本阶段扩写为桌面端同步、双向合并、定时任务编排或新的通用 Git 发布平台。
	- 验收: 至少完成 GitHub / Gitee 两类远端的契约评估，并落地一条可复验的候选链路；若只先接通一类 provider，另一类必须保留明确的契约差异、阻塞点与后续落地条件。
	- 验收: 补齐最小验证矩阵，至少覆盖导出结果结构、Front-matter 字段映射、媒体路径策略、认证失败 / 推送失败兜底与审计日志落点。

2. [ ] **文档翻译 freshness 清偿与文档翻译治理 (P0)**
	- 验收: 对当前承诺维护的翻译页完成一轮 freshness 清偿，优先覆盖首页、快速开始、部署、翻译治理，以及 `planning` / `documentation` / `security` / `testing` 等高频规范页，不允许只更新 `last_sync` 而不校正文案。
	- 验收: `pnpm docs:check:source-of-truth` 必须恢复为可通过状态；若决定缩减某类翻译承诺范围，必须同步更新文档规范、目录范围与对应翻译页，而不是通过忽略告警绕过事实源检查。
	- 验收: 明确翻译页分层治理口径，区分“必须同步”“允许摘要同步”“默认只保留中文原文”三类范围，并把残余存量债写回规范或 backlog，而不是留作隐性尾项。
	- 验收: 输出本轮已同步范围、暂缓范围、剩余风险与下一轮清偿顺序，作为后续文档治理基线。

3. [x] **国际化字段治理 (P1)**
	- 验收: 本轮至少明确一组高频模块的 missing blocker 与运行时加载治理边界，优先覆盖 `admin-settings`、`admin-ai`、`admin-snippets`、`admin-friend-links` 与公开页装配链路，不得回退为散点补词。
	- 验收: 明确共享组件文案上收的准入标准，区分页面私有 key、模块级共享 key 与 `common` 级公共文案，避免再次出现跨页面复用后命名空间漂移。
	- 验收: 至少补齐一轮 `i18n:audit:missing`、运行时命中验证与必要的 parity 检查，并形成“哪些入口失败即 blocker”的固定矩阵。
	- 验收: 明确本轮处理模块、未覆盖模块、raw key 风险与后续分批清偿顺序，便于 Review Gate 判定是否达标。
	- 结果: 已固化 `missing` blocker、运行时加载边界与共享 key 准入口径；当前 `i18n:audit:missing` 为 `0`，`i18n:verify:runtime` 与定向 parity 已通过，详见 `docs/design/governance/i18n-field-governance.md` 与 `docs/reports/regression/current.md`。

4. [x] **重复代码与纯函数复用治理 (P1)**
	- 验收: 只处理 `1 - 2` 组高收益重复区，优先围绕公共页模板片段、列表型查询 helper、查询参数归一化与读模型组装边界推进，不得扩写为全仓重构。
	- 验收: 每组切片都必须给出原始重复点、拟抽象边界、复用收益、潜在过度泛化风险与回滚方式，而不是只写“继续复用”。
	- 验收: 至少保住重复代码基线不反弹，并输出本轮收敛后的剩余热点列表，作为下一轮切片入口。
	- 验收: 补齐最小验证矩阵，确认共享 helper / 纯函数抽象不会改变公开页、查询参数解析与读模型装配行为。
	- 结果: 已完成两轮窄边界切片，覆盖 AI 管理任务读模型装配共享 helper、后台分页 query `safeParse + 默认回退` 模板，以及公开文章列表 locale fallback 过滤 helper；`pnpm duplicate-code:check` 最新为 `33 clones / 830 duplicated lines / 0.70%`，低于 baseline 容差，剩余热点、风险与验证记录见 `docs/reports/regression/current.md`。

5. [x] **存量代码注释治理与注释漂移治理 (P1)**
	- 验收: 首轮只允许选择 `1 - 2` 组高复杂度链路推进，优先覆盖设置来源判定、locale 归一化、鉴权上下文挂载、上传存储解析、文章访问控制或 AI 服务治理，不得扩成全仓平均补注释工程。
	- 验收: 每组链路都必须同时补“为什么这样写 / 边界条件 / 副作用或契约”类高价值注释，并清理失效、误导性或逐行复述代码的低价值注释，不能只做加法。
	- 验收: 导出函数、跨层契约与复杂分支的注释补齐后，需明确记录已覆盖范围、仍未覆盖边界与注释漂移风险，便于后续继续切片。
	- 验收: 至少完成一轮针对受影响文件的 review，自检“注释是否准确、是否过量、是否与实现同步”，不接受只凭主观感觉判定完成。
	- 结果: 已完成候选组 A 的首轮注释治理，覆盖 `server/services/setting.ts`、`server/utils/locale.ts`、`server/middleware/1-auth.ts` 与 `server/middleware/i18n.ts`；本轮补齐了设置来源优先级、locale 归一化边界，以及 `/api/auth` 固定准入、公开接口会话痕迹准入与 i18n 白名单跳过的请求上下文契约说明，并清理了复述型旧注释。收口阶段已补充函数级 JSDoc 保留策略与模板，明确导出函数、复用函数与复杂函数优先保留简短 JSDoc，当前任务到此结束，不再扩到候选组 B/C。覆盖范围、模板、未覆盖边界、验证矩阵与漂移风险见 `docs/design/governance/comment-drift-governance.md` 与 `docs/reports/regression/current.md`。

6. [x] **ESLint / 类型债与规则收紧治理 (P1)**
	- 验收: 本轮仍只允许选择 `1 - 2` 条命中有限、回滚边界清晰的高 ROI 规则推进，不直接扩写到 `no-unsafe-*`、全仓 `any` 清零或大规模样式迁移。
	- 验收: 在进入实现前，必须先给出候选规则命中清单、影响文件、预期收益、回滚方式与最小验证矩阵；若命中过广或回滚边界不清晰，必须退回 backlog 重新切片。
	- 验收: 对受影响文件同步处理 warning / 类型债，并明确哪些属于本轮收口范围、哪些仍为后续债务，不允许借“顺手修一修”把执行面继续膨胀。
	- 验收: 输出本轮规则上收结论、残余债务清单与下一轮候选规则建议，便于阶段收口与后续准入复用。
	- 结果: 已完成 `utils/shared` 生产源码范围的 `@typescript-eslint/no-explicit-any` 首轮上收，并清零 `utils/shared/markdown.ts` 中 `7` 处显式 `any` 命中；候选规则、回滚边界、最小验证矩阵、残余债与下一轮候选已落盘至 [专项设计与治理索引](../design/governance/eslint-type-debt-tightening.md) 与 [活动回归窗口](../reports/regression/current.md)。



## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

