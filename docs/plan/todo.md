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

## 当前待办

### 第五十八阶段：HTTP MCP 与展示增强（HTTP MCP & Presentation Enhancement）

- [x] 主线 1（P2）：MCP HTTP 传输与本体挂载
	- 执行范围：在墨梅主应用中挂载 MCP HTTP 服务。新增 `server/plugins/mcp-http.ts`（Nitro Plugin），条件守卫 + 动态导入 `@modelcontextprotocol/sdk`，使用 `WebStandardStreamableHTTPServerTransport` 处理 `GET/POST/DELETE /api/mcp`；新增环境变量 `MOMEI_ENABLE_MCP_HTTP`（默认 false）；根依赖新增 `@modelcontextprotocol/sdk`；复用外部 API Key 鉴权；全量 33 个工具注册。
	- 设计文档：[MCP HTTP 传输与本体挂载设计](../design/modules/mcp-http.md)
	- 非目标：不替换现有 stdio 模式；不做 MCP 共享层抽取（延后）；不新增独立端口。
	- 最小验收：`MOMEI_ENABLE_MCP_HTTP=true` 时 `/api/mcp` 端点可用，工具调用正常返回；未设置时 SDK 不加载，零冷启动影响；Serverless 环境静默降级；API Key 缺失返回 401；`pnpm typecheck` + `pnpm lint` 通过。

- [x] 主线 2（P2）：RSS 订阅链接美化
	- 执行范围：在 RSS feed 输出 XML 头部添加 `<?xml-stylesheet?>` 指令指向 CSS 样式文件（`/feed-style.css`），使浏览器直接访问 RSS 时显示为美观的 HTML 样式页面。CSS 支持响应式设计，保留 RSS 阅读器正常解析能力。
	- 非目标：不改变 feed 内容结构、不引入 JavaScript 交互、不做完整 RSS 阅读器。
	- 最小验收：✅ 浏览器访问 `/feed.xml` 时显示美化样式而非原始 XML；✅ 响应式设计移动端可用；✅ RSS 阅读器仍能正常解析；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 现有 12 条 feed 测试全部通过。
	- 设计文档：[RSS 订阅链接美化设计](../design/modules/rss-beautification.md)
	- 涉及文件：`public/feed-style.css`（新增）、`server/utils/feed.ts`（新增 `injectRssStylesheet`）、`server/routes/feed.xml.ts`、`server/routes/feed/podcast.xml.ts`、`server/utils/feed-taxonomy-route.ts`、`docs/design/modules/rss-beautification.md`

- [x] 主线 3（P1）：结构复用下一轮热点切片（Phase 57 延续）
	- 执行范围：承接 Phase 57 未完成的结构复用主线，继续收敛高频重复逻辑与轻量类型重复，优先迁移工具链路中复用收益高的候选点。
	- 最小验收：✅ 完成 ≥2 组热点切片（Slice 1: PostStatus/PostVisibility enum 派生；Slice 2: PostScaffoldMetadata/PublishIntent 接口重命名）；✅ `duplicate-code` 基线不反弹（45 clones, 0.31%, vs 前值 45/0.31%）；✅ `pnpm typecheck` + `pnpm lint` + api-client `29/29 tests` 全部通过。
	- 涉及文件：`packages/api-client/src/types.ts`（PostStatus/PostVisibility 枚举 + 派生类型别名 + PostScaffoldMetadata/PublishIntent 接口重命名）

- [x] 主线 4（P1）：ESLint / 类型债下一轮窄切片
	- 执行范围：继续「单规则 + 单文件/双文件」窄切片策略，优先选择命中集中且回滚边界清晰的生产文件。保持 `warning=0`。
	- 非目标：不扩写为全仓 `any` 清零，不新增规则族大范围治理。
	- 最小验收：✅ 确认 `NO_EXPLICIT_ANY_FILES` 全部 65 项已在前序阶段逐步收敛完毕，本轮将豁免列表清零；✅ `warning=0` 保持；✅ `pnpm typecheck` + `eslint types/ad.ts` 0 warning 通过；✅ `duplicate-code` 基线不反弹 (45 clones, 0.31%)。
	- 涉及文件：`scripts/governance/eslint-debt-targets.mjs`（移除全部已失效的豁免分组变量 + 空列表置换）、`eslint.config.js`（条件展开 override，空列表时跳过）
	- 说明：所有文件已在 Phase 51-57 逐批收敛完毕，本轮不做新切片而是关闭已完成的治理循环。
- 附加产出：全量 TypeScript 规则基线扫描报告 [`docs/reports/eslint-typescript-baseline.md`](../reports/eslint-typescript-baseline.md)，覆盖 9 条已禁用规则的数据基线，供后续阶段决策参考。

- [x] 主线 5（P1）：测试有效性第六轮切片
	- 执行范围：围绕已有测试基座但失败路径不足的高风险链路补断言，优先覆盖 Phase 58 新增代码路径（MCP HTTP 端点、RSS feed 路由等）。
	- 非目标：不做 coverage 数字冲刺，不做低价值铺量补测。
	- 最小验收：✅ 新增失败路径断言 ≥5 条（实际 12 条）；✅ 覆盖模块 ≥3 个（feed utils、feed-taxonomy-route、MCP endpoint）；✅ `pnpm test` 全部通过。
	- 涉及文件：
		- `server/utils/feed.test.ts`（新增 `injectRssStylesheet` 5 条测试：主路径/回退路径/自定义 href/内容顺序）
		- `server/utils/feed-taxonomy-route.test.ts`（新增 3 条样式注入条件断言：rss2 注入 / atom 不注入 / json 不注入）
		- `server/api/mcp/index.test.ts`（新增 4 条失败路径+行为验证：401 鉴权失败/Web Request 正确构造/GET 跳过 body/null body 返回）

---

## 待准入（筹备中）

> 第五十八阶段已进入执行面；新增需求仍先写入 [backlog.md](./backlog.md) 候选区，评估后再上收。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
