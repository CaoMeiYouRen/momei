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

> 阶段状态: 第三十阶段已完成审计归档；第三十一阶段已正式上收，当前尚未开启进行中事项。详细范围、非目标、验收标准与最小验证矩阵见 [项目计划](./roadmap.md) 与 [第三十一阶段候选上收草案](../design/governance/phase-31-candidate-draft.md)。

### 第三十一阶段：认证预研与治理执行面正式上收

- [ ] **`caomei-auth` 第三方登录支持评估与接入预研 (P1)**
	- 验收: 已明确 `genericOAuth` / `genericOAuthClient` 接入锚点，以及 `caomei-auth` 的 Discovery、授权、令牌、用户信息、JWKS、动态注册与刷新令牌能力是否满足最小接入前提。
	- 验收: 已明确字段映射、账号绑定、同邮箱合并、回调地址与 ENV 锁定边界，并输出“允许进入实现 / 需上游补齐 / 暂缓接入”的三选一结论。
	- 非目标: 不直接落地真实登录按钮、回调处理或账号绑定实现。
	- 验证: 回链 [caomei-auth OAuth / OIDC 接入预研](../design/governance/caomei-auth-oauth-evaluation.md)。

- [ ] **路线图 / Todo 深度归档治理 (P1)**
	- 验收: 已对 `roadmap.md` 与 `todo-archive.md` 完成首轮深度归档，补齐区间分片、兼容入口与回链说明，并重新量化主文档行数。
	- 验收: 若主文档未完全回到健康窗口，已明确记录剩余阻塞点与下一步拆分计划。
	- 非目标: 不改写既有阶段完成事实，不扩写成多语翻译同步工程。
	- 验证: `pnpm lint:md`，以及归档索引与主文档链接可回查。

- [ ] **国际化运行时加载与文案复用治理 (P0)**
	- 验收: `i18n:audit:missing` 继续保持 `0` blocker，且 `i18n:verify:runtime` 已覆盖至少一条公开页装配链路与一组共享组件文案场景。
	- 验收: 已明确共享 key 上收准入标准、缺词定级口径与下一批高风险历史热点。
	- 非目标: 不发起全仓 i18n 重构，不把 `unused` 字段清理升级为本轮 blocker。
	- 验证: `pnpm i18n:audit:missing`、`pnpm i18n:verify:runtime`。

- [ ] **ESLint / 类型债治理（`composables` 子桶） (P1)**
	- 验收: 已冻结 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 子桶的命中清单、替代写法与回滚边界。
	- 验收: 目标子桶中的非空断言已按显式守卫、默认值、类型收窄或提前返回收敛，且未外溢到非目标目录。
	- 非目标: 不并行开启其他规则的全仓治理，不把 `any`、`unsafe-*`、`max-lines` 等主线打包并入。
	- 验证: `pnpm exec eslint composables --max-warnings 0`、`pnpm exec nuxt typecheck`。

- [ ] **测试覆盖率与有效性治理 (P0)**
	- 验收: 全仓 coverage 基线不低于当前 `76%+` 水位，并至少补齐一组“命名空间漂移 / raw key 暴露 / 认证配置退化时会失败”的高风险行为断言。
	- 验收: 回归记录已说明新增覆盖命中的真实风险与未覆盖边界。
	- 非目标: 不把本轮扩大成全仓 coverage 冲 `80%` 的铺量工程，不接受只有 snapshot 的低价值补测。
	- 验证: `pnpm test:coverage`、`pnpm i18n:verify:runtime` 与受影响 `vitest` 用例。

- [ ] **商业化转型可行性重评 (P1)**
	- 验收: 已按统一评分维度完成打分，并输出“继续推进 / 暂缓推进 / 降级观察”三选一结论。
	- 验收: 已明确一个最值得继续验证的付费增强能力，或明确说明当前尚不存在该主卖点，并指出统一承接入口的优先落点。
	- 非目标: 不直接进入支付、价格页、会员中心或营销后台增强实现。
	- 验证: 回链 [商业化转型可行性重评框架](../design/governance/commercialization-reassessment-framework.md)。



## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

