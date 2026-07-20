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

- [ ] 主线 3（P1）：结构复用下一轮热点切片（Phase 57 延续）
	- 执行范围：承接 Phase 57 未完成的结构复用主线，继续收敛高频重复逻辑与轻量类型重复，优先迁移工具链路中复用收益高的候选点。
	- 最小验收：完成 ≥2 组热点切片，`duplicate-code` 基线不反弹。

- [ ] 主线 4（P1）：ESLint / 类型债下一轮窄切片
	- 执行范围：继续「单规则 + 单文件/双文件」窄切片策略，优先选择命中集中且回滚边界清晰的生产文件。保持 `warning=0`。
	- 非目标：不扩写为全仓 `any` 清零，不新增规则族大范围治理。
	- 最小验收：完成 ≥3 组窄切片；`warning=0` 保持；`pnpm governance:audit:eslint-debt` delta 可对照。

- [ ] 主线 5（P1）：测试有效性第六轮切片
	- 执行范围：围绕已有测试基座但失败路径不足的高风险链路补断言，优先覆盖 Phase 58 新增代码路径（MCP HTTP 端点、RSS feed 路由等）。
	- 非目标：不做 coverage 数字冲刺，不做低价值铺量补测。
	- 最小验收：新增失败路径断言 ≥5 条；覆盖模块 ≥2 个；coverage 基线不回退。

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
