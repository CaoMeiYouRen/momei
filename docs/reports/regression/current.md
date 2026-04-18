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
