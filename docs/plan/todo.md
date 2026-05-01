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

> 阶段状态: 第三十一阶段已完成审计归档；第三十二阶段已正式上收，当前执行面固定为“1 个新功能 + 4 个优化”的受控组合。`存量代码注释治理与注释漂移收敛` 仅保留为备用项，继续留在 [backlog.md](./backlog.md)，只有当前五项容量允许时才可后续补入单组切片。

> 当前进行中: `AITask stale compensation 宽行扫描收敛 (P0 / Postgres 派生切片)`；已完成最小字段集扫描改造、V1 / V2 定向验证，待下一次 live sample 复核后再决定是否关闭。

### 第三十二阶段：多语言内容资产化承接入口与高风险治理推进

- [x] **多语言内容资产化增强包的统一承接入口 (P1)**
	- **增强项 (2026-05-01)**:
		- ✅ 候补名单已实现邮箱应用层去重（`benefitWaitlistService` 中 `findOne` + early return 策略，相同邮箱静默返回已有记录）
		- ✅ 已登录用户自动填充默认值（`pages/benefits.vue` 中 `watch(loggedInUser)` 首次自动填充 `name` + `email`）
		- ✅ 多语言翻译已补全：`pages.enhanced_pack` 已添加到 `ja-JP`、`ko-KR`、`zh-TW` 的 `public.json`，`demo.paths.enhanced_pack` 已同步补全到对应三语 `demo.json`
		- ✅ Footer 新增增强包链接（`components/app-footer.vue`，5 语种 `common.enhanced_pack` 翻译已补齐）
	- 验收: 已在 `docs/design/governance/multilingual-assetization-intake.md` 补齐专项设计文档，首版只做独立说明 / 申请页与真实 CTA。
	- 验收: 已形成「让你的技术内容自动触达全球读者」单一主卖点文案，并明确免费核心与付费增强边界；已有 3 条公开入口完成导流接入（Demo Banner / About 页 / Footer），形成"入口 -> 承接页 -> 申请 / 候补名单"的最小闭环。
	- 非目标: 未对现有免费能力加锁，未扩写为完整销售站点改版。
	- 验证: `pages/benefits.test.ts`（6 tests）、`waitlist.post.test.ts`（2 tests）、`benefit-waitlist.test.ts`（7 tests）全部通过；`lint:i18n` 与 `nuxt typecheck` 通过；回归记录已回链到活动回归窗口。

- [ ] **测试覆盖率与有效性治理 (P0)**
	- 验收: 在当前 `76.03% / 76.08%` 基线上继续提升覆盖率，并优先锁定统一承接入口、公开页 runtime、认证配置退化、共享组件 raw key 暴露，以及公开热点读链路等高风险行为断言。
	- 验收: `80%+` 仅作冲刺目标，不作为阶段关闭线；回归记录必须明确新增失败断言命中的真实风险、未覆盖边界与后续冲刺还缺的关键模块。
	- 非目标: 不做与高风险链路无关的铺量补测，不接受只有 snapshot 的低价值测试。
	- 推进记录（2026-05-01）: 已启动“公开页 runtime / raw key 暴露”首轮切片，将 `pages/categories/index.test.ts` 与 `pages/tags/index.test.ts` 从结构存在断言升级为真实翻译装配断言，并同步纳入 `i18n:verify:runtime` 固定入口；新增断言会直接拦截 `common.category` / `common.tags`、`pages.posts.total_categories` / `pages.posts.total_tags` 与 `pages.posts.article_count` 回退到 UI 的回归。
	- 推进记录（2026-05-01）: 本轮定向测试、固定 runtime 回归、全仓 coverage 与类型检查均已通过；全仓 coverage 已从 `76.03% / 76.08%` 小幅抬升到 `76.05% / 76.10%`，其中 `pages/categories/index.vue` 达到 statements `100%` / lines `100%`，`pages/tags/index.vue` 达到 statements `93.93%` / lines `100%`。剩余优先候选继续保持为 `archives` 公开页 runtime、认证配置退化与统一承接入口高风险断言。
	- 验证: 至少补跑定向 Vitest、`pnpm i18n:verify:runtime`、`pnpm test:coverage` 与 `pnpm exec nuxt typecheck`。

- [x] **重复代码与纯函数复用收敛 (P1)**
	- 验收: 本轮只处理公共页模板片段与列表型查询 helper 两组高收益重复区，需写清原始重复点、拟抽象边界、收益、潜在过度泛化风险与回滚方式。
	- 验收: 至少保住重复代码基线不反弹，并输出本轮收敛后的剩余热点清单。
	- 非目标: 不做跨目录大重构，不扩写为通用 UI 框架改造。
	- 闭合记录（2026-05-01）: 已完成两组高收益重复区收敛。公共页模板片段将 `privacy-policy` / `user-agreement` 两页的整页模板、样式与取数逻辑下沉到 `components/legal-agreement-page.vue` + `composables/use-legal-agreement-page.ts`，同时保留有限集合 i18n key 的显式映射，避免共享组件继续扩大成动态 key 工厂；列表型查询 helper 将 `categories` / `tags` 公开列表端点中重复的缓存 key 组装、公共过滤与 `postCount` 排序逻辑收敛到 `server/utils/taxonomy-public-list.ts`，各自 handler 只保留实体专属差异（如 `parentId`）。
	- 闭合记录（2026-05-01）: 当前收益已落到“共享改动只需改一处、同类页面与 taxonomy 列表避免继续手写同构逻辑、测试与 typecheck 回归面缩小且更集中”；过度泛化风险已通过“helper 只收公共过滤 / 排序 / cache key，页面共享组件只消费显式 copy 对象”受控，回滚方式也保持为“页面或 handler 可单独内联回原实现，不影响其他目录”。
	- 闭合记录（2026-05-01）: `pnpm duplicate-code:check` 当前结果为 `32 clones / 697 duplicated lines / 0.59%`，低于此前 backlog 记录的 `34 clones / 879 duplicated lines / 0.79%` 基线，本轮未出现反弹；剩余热点已记录到活动回归窗口，当前优先观察 `pages/categories/[slug].vue` vs `pages/tags/[slug].vue`、`pages/forgot-password.vue` vs `pages/reset-password.vue`，以及首页 / 公开列表读模型装配边界。
	- 验证: `server/utils/taxonomy-public-list.test.ts`、`tests/server/api/categories/index.get.test.ts`、`tests/server/api/tags/index.get.test.ts`、`pages/privacy-policy.test.ts`、`pages/user-agreement.test.ts`、`components/legal-agreement-page.test.ts` 共 `32` 条断言通过；`nuxt typecheck targeted` 与 `pnpm duplicate-code:check` 通过；重复代码基线已回写到活动回归窗口。

- [x] **ESLint / 类型债治理 (P1)**
	- 验收: 只允许继续上收单规则窄切片，进入实现前必须先冻结候选规则、命中清单、影响文件、预期收益、回滚方式与最小验证矩阵。
	- 验收: 目标切片清理完成后，未外溢到非目标目录，且目录级或定向 ESLint / typecheck 可以稳定通过。
	- 非目标: 不并行开启第二条规则治理，不扩写到 `no-unsafe-*` 或全仓 `any` 清零工程。
	- 推进记录（2026-05-01）: 本轮继续沿单规则窄切片推进 `@typescript-eslint/no-explicit-any`，只上收到 `composables/use-post-editor-voice.ts` 单文件；`9` 处显式 `any` 已收敛为本地 Web Speech / 错误对象最小类型、配置响应归一化与局部实例收窄，未外溢到其他 composable 或测试目录。
	- 推进记录（2026-05-01）: `eslint.config.js` 已把重复出现的 TS `files` / `ignores` 作用域抽成共享常量与 `createRuleOverride()`，并将同一条 `no-explicit-any` 的既有窄切片（`utils/shared/**/*`、`server/utils/object.ts`、`server/utils/pagination.ts`、`composables/use-post-editor-voice.ts`）合并到同一条 override，避免后续治理继续复制边界判断。
	- 闭合记录（2026-05-01）: 收口前继续上收了 `server/api/categories/index.get.ts` 这条单文件 `no-explicit-any` 切片，将 `attachTranslations(items as any, ...)` 改为显式泛型调用，不改 helper 契约也不并行开启第二条规则；同规则配置则进一步收敛为“工具层 / API 单文件切片”共用的聚合文件组，保持 tests / scripts 豁免边界不变。
	- 闭合记录（2026-05-01）: 当前阶段的 ESLint / 类型债治理已满足“单规则窄切片 + 同规则归组 + 定向验证 + 残余债务说明”四个收口条件；剩余 `no-explicit-any` 与更宽的 `no-unsafe-*` / `no-non-null-assertion` 债务继续保留在治理设计文档与长期主线中，不再阻塞本阶段关闭。
	- 验证: `pnpm exec eslint composables/use-post-editor-voice.ts --rule '{"@typescript-eslint/no-explicit-any":2}'`、`pnpm exec eslint server/api/categories/index.get.ts --rule '{"@typescript-eslint/no-explicit-any":2}'`、`composables/use-post-editor-voice.test.ts`（13 tests）、`tests/server/api/categories/index.get.test.ts`（12 tests）与 `pnpm exec nuxt typecheck` 均通过；残余债务与下一轮候选已回写到治理设计文档和活动回归窗口。

- [x] **Postgres 查询、CPU 与连接生命周期平衡治理 (P0)**
	- 验收: 本轮只从“一组请求入口”或“一组公开热点读链路”中二选一推进，需明确当前切片属于哪一组，并给出数据库唤醒边界、最小字段集、短 TTL 或请求去重中的至少一组收敛方案。
	- 验收: 阶段结论需能说明查询次数、结果集体量或连接活跃窗口存在可追溯下降趋势。
	- 非目标: 不扩写为全站性能重构，不同时并行推进请求入口与热点读链路两大方向。
	- 推进记录（2026-05-01）: 当前切片已明确为“公开热点读链路”，首轮选择 `/api/search`；匿名请求已接入 `60s` 运行时缓存，cache key 覆盖 `q / language / category / tags / sortBy / page / limit`，并新增重复请求命中缓存的定向断言。
	- 闭合记录（2026-05-01）: 带会话请求继续旁路共享缓存，避免订阅可见性差异污染匿名缓存；Neon `query performance + system operations` live sample 已补齐，当前 Top SQL 中 `settings/public` 仅表现为 `32 key` 与 `15 key` 两组 batched `IN (...)` 查询（`5.8ms / 5.4ms`），精选友链仅表现为一组 `DISTINCT + IN (...)` 跟进查询（`4.3ms / 4.1ms`），`/api/search` 未继续停留在当前热点 SQL 顶部。
	- 闭合记录（2026-05-01）: 同一窗口内 compute 仍可反复成功 `start / suspend`，未出现持续钉住 Active 的异常；剩余较重样本已收敛到 `AITask` stale scan（`53.9ms / 1 call`）与首页 posts public list 的 `DISTINCT + IN (...)` 查询对（`53.3ms / 40.5ms`，各 `1 call`），转入后续候选，不再阻塞本轮“公开热点读链路”单路径切片关闭。
	- 验证: 至少补齐受影响入口或链路的定向测试，并通过 `pg_stat_statements`、运行期样本或等价 live sample 记录量化对比结果。

- [ ] **AITask stale compensation 宽行扫描收敛 (P0 / Postgres 派生切片)**
	- **派生原因（2026-05-01）**: 2026-05-01 Neon live sample 中 `momei_ai_tasks` stale compensation 扫描仍是当前剩余重样本之一（`53.9ms / 1 call`）；`/api/search` 主线关闭后，当前阶段释放出的优化槽位继续只上收这一条单路径派生切片。
	- 验收: `scanAndCompensateTimedOutMediaTasks()` 首轮扫描只保留 `claim + dispatch` 所需字段，避免把整行 `AITask` 记录拉入热点查询；定向测试需锁定 `select` 边界，防止回退到宽行读取。
	- 验收: 本轮只覆盖定时补偿路径，不并行扩写到首页 `posts public list` 查询对；若未补新一轮 live sample，只能完成代码 / 测试 / 文档闭环，不得提前宣称该热点已完全退出 Top SQL。
	- 非目标: 不改 `TTSService` / `ImageService` 的补偿逻辑，不重写调度器，不把首页公开列表治理并入本条。
	- 推进记录（2026-05-01）: 已将 stale scan 收紧为 `id / type / status / result / startedAt / progress` 最小字段集，并在 `media-task-monitor.test.ts` 锁定查询参数断言，避免宽行回退。
	- 验证: 至少完成 `pnpm exec vitest run server/services/ai/media-task-monitor.test.ts`、受影响文件 ESLint、`nuxt typecheck targeted` 与回归窗口同步；若后续补到新的 Neon / `pg_stat_statements` 样本，再决定是否关闭。

> 备用项：`存量代码注释治理与注释漂移收敛` 当前不作为第三十二阶段正式待办；若后续容量允许，只能按 backlog 中候选组 A / B / C 的单组切片方式补入，不得扩写为全仓补注释工程。



## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

