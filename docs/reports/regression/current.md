# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是后续迁移后的主要写入位置。

在迁移完成前，现有回归正文仍可通过 [docs/plan/regression-log.md](../../plan/regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

## 2026-04-18 i18n 重复文案抽取

### 范围

- 目标：先清理低风险、可复用的跨模块重复文案，优先处理平台名称。
- 本轮抽取：将社交平台名称统一收敛到 `common.platforms`，保留 `components.post.share.platforms.wechat_mp` 作为分享场景专属文案，保留 `components.post.sponsor.platforms.*` 中打赏平台专属文案。
- 受影响消费点：`article-share`、`article-sponsor`、`commercial-link-manager`。

### 基线对比

- 抽取前：Shared non-empty string keys `1138 / 2488`，Duplicate groups `63`，Cross-module groups `38`，Keys involved `138`。
- 抽取后：Shared non-empty string keys `1118 / 2465`，Duplicate groups `48`，Cross-module groups `23`，Keys involved `100`。
- 结果：Cross-module groups 减少 `15` 组，Keys involved 减少 `38` 个，说明平台名称这一组重复已被批量压降。

### 实施说明

- 新增 `common.platforms` 作为跨页面、跨组件的共享平台名称来源，覆盖 `github`、`discord`、`telegram`、`whatsapp`、`email` 等社交平台。
- `article-share` 对 `wechat_mp` 继续使用分享场景文案，其余平台统一走 `common.platforms`，避免把“微信”误替换成“微信公众号”。
- `article-sponsor` 仅将社交平台名称切换到 `common.platforms`，打赏平台仍保留在 `components.post.sponsor.platforms`。
- 删除各语言 `settings.commercial.social_platforms` 重复字典，并清理 `components.post.share.platforms` / `components.post.sponsor.platforms` 中已转为共享来源的社交平台条目。

### 已执行验证

- `pnpm i18n:audit:duplicates -- --format=markdown --cross-module-only --limit=0 --output=artifacts/i18n-duplicate-messages-cross-module-2026-04-18.md`
	- 结果：报告已刷新，当前 cross-module duplicate 基线为 `23` 组。
- 定向组件测试：`article-share.test.ts`、`article-sponsor.test.ts`、`commercial-link-manager.test.ts`
	- 结果：`11` 个测试全部通过。
- `pnpm i18n:verify:runtime`
	- 结果：`5` 个测试文件、`41` 个测试全部通过，exit code `0`。

### 后续候选

- 继续优先处理 cross-module report 中已经具备单一语义来源的基础按钮文案，例如 `refresh`、`retry`、`back_to_home`。
- 对 `email`、`language` 等高频词条，需要先确认页面语义是否允许继续合并，避免误把字段标签和动作文案混为同一来源。

## 2026-04-20 第二十八阶段收口复核

### 范围

- 目标：核对第二十八阶段五条主线是否已与当前代码、测试与运行期证据对齐，并为阶段归档提供统一事实源。
- 本轮复核：覆盖后台内容洞察看板、Postgres 查询 / CPU / 连接生命周期平衡治理、全仓 coverage `> 76%`、国际化运行时加载治理，以及编辑器 Markdown / 外观一致性增强。
- 受影响事实源：`docs/plan/todo.md`、`docs/plan/todo-archive.md`、`docs/plan/roadmap.md`、`docs/i18n/*/plan/roadmap.md` 与 `docs/plan/backlog.md`。

### 基线对比

- 复核前：`todo.md` 仍保留 PostgreSQL 平衡治理与 coverage 治理两条未关闭主线，阶段状态仍为“执行中”。
- 复核后：五条主线均满足关闭条件，第二十八阶段可以从“执行中”切换为“已审计归档”。
- 长期主线状态：coverage 治理与 Postgres 平衡治理继续保留在 backlog 中，但第二十八阶段切片本身已完成，不再占用当前执行面。

### 实施说明

- 后台内容洞察主线已完成 `/admin` 首页切换、`GET /api/admin/content-insights`、`post_view_hourly` 真实趋势聚合与对应测试，能力边界与设计文档保持一致。
- Postgres 主线已在代码中完成请求级数据库预热收紧、匿名公开链路按需会话解析，以及公开设置 / 友链读取的短 TTL 运行时缓存；对应入口与测试分别落在 `server/middleware/0b-db-ready.ts`、`server/middleware/1-auth.ts`、`server/api/settings/public.get.ts`、`server/api/friend-links/index.get.ts`、`tests/server/middleware/db-ready.test.ts`、`tests/server/middleware/auth-optional-session.test.ts` 与 `tests/server/api/settings/public.get.test.ts`。
- coverage 主线已补齐后台统计、数据库中间件边界、编辑器语音回退与运行时加载相关高风险测试；本轮以最新全仓 coverage 结果超过 `76%` 为关闭口径，并据此解除第二十八阶段的覆盖率 blocker。
- 国际化运行时加载与编辑器 Markdown / 外观一致性两条主线已在现有代码、设计文档与定向测试中闭环，无需继续保留为当前阶段尾项。

### 已执行验证

- 代码与测试对照：已逐项核对后台内容洞察、数据库预热 / 会话解析 / 短 TTL 缓存、编辑器语音回退与 i18n 运行时相关实现和测试文件，未发现与第二十八阶段验收标准冲突的缺口。
- 文档结构检查：`pnpm exec lint-md` 已对本轮变更的规划、回归与多语路线图摘要文件通过校验。
- 文档目录检查：`pnpm docs:check:i18n` 已通过，确认未引入旧目录回流或重复翻译页。
- 类型状态：`pnpm exec nuxt typecheck` 已通过，当前归档涉及的规划文档未见新的编辑器诊断错误。
- 运行期证据：Postgres 平衡治理结合既有热点基线文档与后台最新观测数据复核后，已能支持“查询次数、重复读取与连接活跃窗口下降趋势已成立”的关闭结论。
- 覆盖率结论：依据最新全仓 coverage 收口结果与本轮复核，coverage 已高于 `76%` 目标线，可关闭本轮 coverage 主线。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；当前剩余事项仅为长期主线的下一轮候选切片，不再阻塞第二十八阶段归档。

### 未覆盖边界

- 当前活动回归窗口只记录了阶段关闭结论，没有把全仓 coverage 的精确四维百分比重新固化成单独 JSON 摘要；若后续继续上收 coverage 主线，建议补充机器可读的 summary artifact 以降低复查成本。
- Postgres 主线本轮已满足关闭条件，但若未来继续上收下一轮平衡治理，仍应补更长窗口的 `pg_stat_statements` 或等价 live sample，而不是复用本轮关闭结论直接代替新阶段证据。

### 后续候选

- 下一阶段若继续切 coverage 主线，优先围绕 `76%+` 之后的高风险模块深挖，而不是回到平均铺量测试。
- 下一阶段若继续切 Postgres 主线，优先补更长窗口运行期样本、热点 SQL 分组与连接寿命对比，而不是先扩写新的查询裁剪工程。

## 2026-04-18 admin-posts parity 与缺词门禁上收

### 范围

- 目标：压降后台文章管理英文缺词债，避免 `pages.admin.posts.media.audio_missing` 之类 raw key 继续直接漏到 UI，并把缺词审计上收到更高频的固定质量门。
- 本轮处理：完整补齐 `i18n/locales/en-US/admin-posts.json`，将 `pnpm i18n:audit:missing` 接入 `release:check` 与 `regression:weekly`，并同步更新开发、测试、规划、指南和 backlog 治理口径。
- 影响范围：`/admin/posts` 后台编辑链路、发布前校验脚本、周期性回归脚本、i18n 相关开发规范与回归记录事实源。

### 基线对比

- 本轮处理前：定向 parity 审计曾显示 `en-US/admin-posts` 相对 `zh-CN` 缺失 `309` 个 keys。
- 本轮处理后：`en-US`、`zh-CN`、`zh-TW` 的 `admin-posts` 模块均已通过定向 parity 校验。
- 仓库级现状：按 `scripts/i18n/audit-locale-keys.mjs` 当前逻辑直接重算后，`missingParity = 4092`，仍存在大规模历史缺词债；当前最高热点集中在 `en-US/admin-settings.json (1996)`、`en-US/admin-ai.json (360)`、`en-US/admin-link-governance.json (280)`、`en-US/admin-friend-links.json (276)`、`en-US/admin-snippets.json (248)`、`en-US/admin-users.json (220)`、`en-US/admin-ad.json (216)`。

### 实施说明

- 直接将 `en-US/admin-posts.json` 补齐到与当前后台文章管理功能一致的完整 parity，优先消除最频繁暴露到英文后台 UI 的缺词。
- `scripts/release/pre-release-check.mjs` 新增 `i18n:audit:missing` 必经步骤，作为 release blocker 的一部分。
- `scripts/regression/run-periodic-regression.mjs` 的 weekly profile 新增 `i18n:audit:missing`，并将回归日志事实源统一写到 `docs/reports/regression/current.md`。
- `docs/standards/development.md`、`docs/standards/testing.md`、`docs/standards/planning.md`、`docs/guide/development.md` 与 `docs/plan/backlog.md` 已同步声明：i18n 变更后必须补跑缺词 parity 审计，且 release / phase-close 入口不得再放过此类低级错误。

### 已执行验证

- `pnpm i18n:check-sync -- --locale=en-US --module=admin-posts --fail-on-diff`
	- 结果：通过，`en-US: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=zh-CN --module=admin-posts --fail-on-diff`
	- 结果：通过，`zh-CN: parity with zh-CN`。
- `pnpm i18n:check-sync -- --locale=zh-TW --module=admin-posts --fail-on-diff`
	- 结果：通过，`zh-TW: parity with zh-CN`。
- `pnpm lint:md`
	- 结果：通过，规范与回归文档改动未引入 Markdown 问题。
- `pnpm i18n:audit:missing`
	- 结果：失败，按当前脚本逻辑重算后仓库级 `missingParity = 4092`；说明新的 blocker 已具备实际拦截能力，但全仓历史缺词债仍远未清零。

### 后续候选

- 下一轮优先按热点文件继续清偿 `en-US/admin-settings`、`en-US/admin-ai`、`en-US/admin-link-governance`、`en-US/admin-friend-links` 和 `en-US/admin-snippets` 的缺词债，避免 release blocker 长期处于全局红灯。
- 审计输出当前还会同时暴露大量 unused candidate keys；后续需要拆清“真正缺词 blocker”和“未引用清理候选”的治理节奏，避免一次性输出过大影响回归阅读效率。
