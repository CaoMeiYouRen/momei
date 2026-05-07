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

> 阶段状态: 第三十五阶段已正式开启，当前按“0 个新功能 + 5 个优化”推进，聚焦 AI task 计量口径、Postgres、ESLint / 类型债、结构复用治理，以及存量代码注释治理五条主线。

> 当前进行中: 无（等待第三十五阶段下一条待办上收）。

### 第三十五阶段：运行时计量校准与结构治理续推

- [x] **AI task 计量口径校准与 TTS 前端直连防回归 (P0)**
	- 验收: 明确 `estimated` 与 `actual` 的计量边界，前端直连 TTS / Podcast 在可获取 provider 最终 usage 时优先按最终 usage 落盘；缺少最终 usage 时才回退到估算值，避免后台统计与任务明细失真。
	- 验收: 至少补齐一组“前端直连成功 / 失败 / 回退”高风险断言，并验证管理端 AI task 列表、详情与聚合统计的口径一致性。
	- 非目标: 不重写 `TTSService.processTask()`，不把更多 Provider 扩写为浏览器直连。
	- 验证: 定向 Vitest、受影响 API / composable 断言、`pnpm exec nuxt typecheck`。

- [x] **Postgres 热点公开读链路与数据库唤醒继续治理 (P0)**
	- 验收: 只选择一组高热公开读链路或一组请求级数据库唤醒入口继续推进，优先围绕首页 `posts public list` 查询对及其相邻装配链路补最小字段集、短 TTL、请求去重或缓存复用中的至少一项收敛。
	- 验收: 留下数据库级长窗口样本或等价 live sample，对比说明查询体量、结果集大小或连接活跃窗口存在可追溯下降趋势。
	- 非目标: 不把本轮扩写为全站性能重构，不同时并行改造全部请求入口与全部热点读路径。
	- 闭合记录（2026-05-06）: [server/api/posts/index.get.ts](../../server/api/posts/index.get.ts) 已把 `POSTS_PER_PAGE` 读取推迟到缺省 `limit` 请求；本地 PostgreSQL 17 + `pg_stat_statements` 对照样本显示，首页 popular posts 等价请求（显式 `limit=3`、`isPinned=false`、`orderBy=views`、`order=DESC`、`excludeIds=post-hot-read-01,post-hot-read-02`）重复命中仅留下 `3` 条 `momei_post` 查询指纹，未再留下 `momei_setting` 查询；同组缺省 `limit` 对照仍留下 `1` 条 `momei_setting` 查询（`calls=1`、`rows=1`）。结合定向回归测试，可追溯证明本轮已去掉首页 popular posts 这条公开热读路径的前置 settings 查库。
	- 验证: `pnpm exec vitest run tests/server/api/posts/index.get.test.ts`、`nuxt typecheck targeted`、本地 PostgreSQL 17 `pg_stat_statements` 对照采样。

- [x] **ESLint / 类型债下一轮窄切片 (P1)** ✅
	- 命中: `server/utils/post-access.ts`（3 处 `any` → `PostAccessUser` / `PostAccessSession` 接口）
	- 规则: `@typescript-eslint/no-explicit-any`
	- 回滚边界: 见 `eslint.config.js` `noExplicitAnyUtilityFiles`，可随时移除单文件
	- 验证: `pnpm exec nuxt typecheck` 通过，`pnpm exec vitest run server/utils/post-access.test.ts`（定向）
	- 残余: `server/utils/ai/` Provider 层仍有 `error: any` 等（低 ROI，留后续切片）；`server/utils/translation.ts` 多处 `as any`

- [x] **结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛 (P1)** ✅
	- Group 1: `isRecord` / `isPlainRecord` — 6 个文件各定义一次 → 收敛到 `utils/shared/is-record.ts`
	- Group 2: `MaybeReactive<T>` — 2 个文件各定义一次 → 收敛到 `types/utils.ts`
	- 受影响文件: `use-asr-direct.ts`, `localized-settings.ts`, `post-export.ts`, `email-template-config.ts`, `request-feedback.ts`, `ad-network-config.ts`, `use-locale-message-modules.ts`, `use-app-fetch.ts`
	- jscpd 无法覆盖边界: 类型别名重复（同一 type 定义在多个文件），非行级代码重复
	- 验证: `pnpm exec nuxt typecheck` 通过

- [x] **存量代码注释治理 — 候选组 A (P1)** ✅
	- 本轮选择: `server/utils/locale.ts`（locale 归一化）+ `server/middleware/1-auth.ts`（鉴权上下文挂载）
	- 已补注释: `LOCALE_MAPPING` 四级回退策略说明、`getAuthLocaleFromRequest` 手动 Cookie 解析原因、`detectRequestAuthLocale` 的 `includeQuery` 安全语义、`AUTH_TO_APP_LOCALE_MAP` 的 default 折叠理由
	- 已审文件 `1-auth.ts` 注释已充分（`shouldResolveSession` 策略 + 中间件不阻断语义 + DB 自保护），本轮不追加
	- `server/services/setting*.ts` 注释已较充分，本轮不追加
	- 未覆盖: locale 文件的测试层、`server/middleware/i18n.ts`（与 locale.ts 共享事实源，注释可沿用）
	- 验证: `pnpm exec nuxt typecheck` 通过

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

