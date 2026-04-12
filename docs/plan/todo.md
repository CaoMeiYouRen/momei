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

当前进行中事项
 - PostgreSQL 查询与数据库出网流量治理：`search / external posts` 已完成 payload 收敛与热点指纹基线，且已追加一轮“初始化边界 + 匿名鉴权触发面 + 公开低频接口短 TTL 缓存”增量实现；详见 [regression-log.md](./regression-log.md)。当前仍待补同范围运行期 PostgreSQL 样本后才能关闭主线。

> 阶段状态: 第二十六阶段已于 2026-04-11 正式开启，详见 [roadmap.md](./roadmap.md)。当前执行面围绕测试覆盖率、ESLint 规则收紧、注释治理、重复代码 / 纯函数复用收敛，以及 PostgreSQL 数据库出网流量治理五条主线展开。

### 1. 主线：测试覆盖率与红绿测试有效性推进 (P0)

- [x] **把全仓测试覆盖率从 `68.85%` 继续提升到约 `72%`**
	- 验收: 基于当前 coverage 基线继续提升约 `4%`，并在阶段收口时保留新增覆盖率、模块分布与未覆盖边界。
	- 验收: 优先补齐 `server/services/ai/text.ts`、公开查询热点 API 与数据库治理相关服务层的失败路径、边界断言与回退逻辑，而不是平均铺开式补量。
	- 验收: 每轮补强都要记录失败用例、转绿结果、剩余风险与下一轮优先顺序，避免只追 coverage 数字。
	- 进展: 已完成首轮 `TextService` 服务层增量补测，[server/services/ai/text.test.ts](../../server/services/ai/text.test.ts) 新增 `9` 条用例并完成 `33` 条定向测试转绿；[server/services/ai/text.ts](../../server/services/ai/text.ts) 定向 coverage 已达到 `Statements 85.62%` / `Branches 79.54%` / `Functions 95.83%` / `Lines 85.98%`。本轮属于守线型补测，新增断言已全部转绿；记录、剩余边界与下一优先级详见 [regression-log.md](./regression-log.md)。

### 2. 主线：ESLint / 类型债第二轮收紧 (P1)

- [x] **至少再正式收紧 `1 - 2` 条高 ROI ESLint 规则**
	- 验收: 优先选择命中范围有限、回滚边界清晰、对生产代码收益明确的规则族，不直接扩写到 `no-unsafe-*` 或全仓 `any` 清零工程。
	- 验收: 每批规则提升都要补齐命中清单、回滚方式与最小验证矩阵，并明确受影响目录范围。
	- 验收: 测试、脚本、迁移和历史遗留目录继续保持受控豁免，不因为规则收紧造成失控返工。
	- 完成项: 已完成两条规则的正式收紧并保留最小验证矩阵。第一批把 `@typescript-eslint/no-unnecessary-type-assertion` 提升为仅作用于生产 TS 的 warning，清零 [server/services/external-feed/parser.ts](../../server/services/external-feed/parser.ts) 与 [server/services/ai/tts.ts](../../server/services/ai/tts.ts) 共 `5` 条 production 命中；第二批把 `@typescript-eslint/no-unnecessary-type-arguments` 提升为仅作用于 `server/**` 的 warning，清零 [server/api/ads/script.get.ts](../../server/api/ads/script.get.ts)、[server/services/ai/quota-governance.ts](../../server/services/ai/quota-governance.ts)、[server/services/email-template.ts](../../server/services/email-template.ts)、[server/services/friend-link.ts](../../server/services/friend-link.ts)、[server/services/import-path-alias.ts](../../server/services/import-path-alias.ts)、[server/utils/ai/cost-governance.ts](../../server/utils/ai/cost-governance.ts) 与 [server/utils/email/templates.ts](../../server/utils/email/templates.ts) 共 `12` 条 production 命中。
	- 验收结果: 两批规则均保留了 tests、scripts、migrations 的显式豁免边界，且已通过定向 ESLint、`pnpm exec nuxt typecheck`、相关 Vitest 用例与全仓 `pnpm exec eslint . --max-warnings 10` 校验。`prefer-nullish-coalescing` 仍因编辑器 composable 命中面过宽而留作下一轮拆桶候选。详见 [regression-log.md](./regression-log.md)。

### 3. 主线：存量代码注释治理首轮落地 (P1)

- [x] **在 `1 - 2` 组高复杂度模块中补齐高价值注释**
	- 验收: 首轮优先从设置读取 / 来源判定、locale 归一化 / 鉴权上下文、上传存储 / 文章访问控制、AI 文本 / 配额治理，或公开查询裁剪逻辑中选择 `1 - 2` 组模块推进。
	- 验收: 新增注释必须解释约束、契约、边界、副作用或回退原因，不做逐行复述代码式补注释。
	- 验收: 阶段收口时需保留受影响范围、已补注释类型、未覆盖边界与注释漂移检查结论。
	- 完成项: 已完成两组高复杂度模块注释补强，覆盖 `server/utils/locale.ts` 与 `server/services/ai/quota-governance.ts`。本轮重点补充“来源优先级链路”“归一化回退口径”“策略优先级与合并规则”“重任务并发限流边界”等约束型注释。
	- 第二刀进展: 已按“模块级”继续补强注释，扩展覆盖 i18n 核心链路（`i18n/config/locale-registry.ts`、`i18n/config/locale-runtime-loader.ts`、`i18n/config/locale-modules.ts`、`server/utils/email/locale.ts`），以及访问控制与公开查询裁剪/缓存链路（`server/utils/post-access.ts`、`server/utils/post-list-query.ts`、`server/utils/runtime-cache.ts`、`server/api/settings/public.get.ts`、`server/api/friend-links/index.get.ts`、`server/api/external/posts.get.ts`、`server/services/upload.ts`）。
	- 验收结果: 新增注释均围绕契约/边界/回退原因，不涉及逐行复述；对应定向回归 `pnpm exec vitest run server/utils/locale.test.ts server/services/ai/quota-governance.test.ts` 共 `46` 条用例通过。
	- 未覆盖边界: AI 文本编排层（`server/services/ai/text.ts` 及其任务编排链路）与部分公开查询入口（`archive / categories / tags` 的接口级注释一致性）仍待下一轮继续切片。
	- 注释漂移检查: 本轮仅新增说明性注释且未改动业务逻辑，注释与当前实现一致，暂无漂移项。

### 4. 主线：重复代码与纯函数复用继续收敛 (P1)

- [x] **至少完成 `1` 组公共页模板或查询 helper / 纯函数收敛**
	- 完成项：提取 `useTaxonomyPostPage` composable（`composables/use-taxonomy-post-page.ts`），消除 `pages/categories/[slug].vue` 与 `pages/tags/[slug].vue` 100% 重复的分页/posts 请求/i18nParams watch/onPageChange 逻辑；同步将 `PublicPostListData` 接口（在 `pages/index.vue`、`pages/posts/index.vue`、`pages/categories/[slug].vue`、`pages/tags/[slug].vue` 中各自本地定义）收敛为 `types/post.ts` 导出的 `PostListData`，消除 4 处重复接口声明。
	- 验收：受影响 6 个文件 typecheck 通过、全部 119 个测试通过、目标文件 eslint 无告警。
	- 剩余热点：`pages/index.vue` 内部的 `HOMEPAGE_*` 分页逻辑、admin 页面列表模板暂缓，待后续阶段继续切片。

### 5. 主线：PostgreSQL 查询与数据库出网流量治理 (P0)

- [x] **优先降低 PostgreSQL 数据库出网流量与查询压力**
	- 验收: 至少形成一份 `posts / archive / categories / tags` 等公开高频读接口的热点清单，并补齐 `pg_stat_statements` 或等价长窗口样本。
	- 验收: 至少完成 `1 - 2` 组针对宽查询 / 重复查库 / 短 TTL 缓存 / 最小字段集的收敛证据，明确数据库返回体量或重复读取次数已下降。
	- 验收: CPU 使用时机仅作为次级观测指标；阶段结论需明确说明哪些优化直接服务于数据库出网流量下降，哪些仍属于后续观察项。
	- 进展: `posts / archive / categories / tags` 最小字段集与 taxonomy 聚合 helper 已落地，`search / external posts` 的 payload 也已收敛并补齐热点指纹候选基线；新增的“系统性优化方案”已写入 [regression-log.md](./regression-log.md)，并已完成首轮增量实现：收紧数据库模块级自动初始化、安装态检查短缓存、匿名请求鉴权触发面收敛，以及公开 settings / friend-links 接口 60 秒短 TTL 缓存。当前仍需补同范围运行期 PostgreSQL 样本，再决定是否关闭主线。详见 [regression-log.md](./regression-log.md) 与 `artifacts/postgres-hot-read-governance-2026-04-12.*`。


## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

