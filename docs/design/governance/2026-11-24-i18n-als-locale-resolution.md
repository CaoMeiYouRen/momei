# 请求级 i18n 上下文（ALS）缺陷评估与处置决策

- 状态：已决策（2026-11-24，第八十四阶段条目 6）
- 缺陷来源：第八十一阶段条目 3 审计发现（2026-11-21）
- 关联：`server/middleware/i18n.ts`、`server/utils/i18n.ts`、backlog #5

## 1. 缺陷事实

`server/middleware/i18n.ts` 用 `i18nStorage.run(appLocale, () => {})` 注入请求级 locale，但 `run()` 只在其回调的同步 / 异步作用域内生效；空回调立即返回后上下文即销毁，后续 handler 与深层 helper 不在 ALS 作用域内。因此 `server/utils/i18n.ts` 的 `getLocale()` 在生产请求中恒走 `AUTH_DEFAULT_LOCALE` 回退，而中间件注释宣称「确保深层工具链读取同一份事实」，与实际行为不符。

影响面：服务端响应封装（`server/utils/response.ts`、`error.ts`）、邮件模板语言（`server/utils/email/i18n.ts`）、Feed 语言（`server/utils/feed.ts`）在未显式传 locale 时统一使用默认语言；页面渲染本身由 `@nuxtjs/i18n` 的请求侧检测驱动，不受影响。另：`event.context.locale` 当前只有写入、没有读取方，属「预留但未消费」的字段。

## 2. 三案比较

| 方案 | 做法 | 改动面 | 主要风险 | 结论 |
| :--- | :--- | :--- | :--- | :--- |
| A. 框架级请求上下文（替代「handler 链包裹」） | 开启 Nuxt `experimental.asyncContext`（透传为 `nitro.experimental.asyncContext`），`getLocale()` 改用 Nitro `useEvent()` 读 `event.context.locale`，删除自建 ALS | `nuxt.config.ts` + `server/utils/i18n.ts` + 中间件清理（3 文件） | 实验性框架开关对**每个请求**生效；非 Node 运行时（如边缘环境）的可用性尚未验证（本地仅核对类型注释「Enable native async context support for useEvent()」）；需全量回归（E2E / 视觉 / 覆盖率）才能放行 | 不在本批实施，转 backlog #5 独立立项 |
| B. 显式传参 | `getLocale(event?)` 读 `event.context.locale`，把 event 逐层传入 `response` / `error` / `email` / `feed` 等工具与调用链 | ≥10 文件、跨 API 响应 / 邮件 / Feed 多条链路（`server/utils/response.ts` 被 96 个文件显式 import，另有 Nitro 自动导入的调用点；Feed 相关 11 个文件，邮件 5 个文件） | 触及公共工具签名与全部调用点，回归面覆盖 API 契约与邮件模板 | 超出 kill-switch 的「>3 个中间件或多处调用链」阈值 |
| C. 保持运行时行为 + 修正事实陈述 | 移除中间件里无效的 `i18nStorage.run` 与误导注释，把「请求级 locale 在 `event.context.locale`，ALS 仅供显式 `run()` 的调用方使用」写清；缺陷登记 backlog #5 跟踪 | 2 文件（中间件 + 工具注释） | 无运行时行为变化；默认语言回退的既有偏差保留 | **本批采用** |

## 3. 决策与理由

采用方案 C。理由：

1. 方案 A 的收益（深层工具拿到请求 locale）成立，但代价是把一个**实验性框架开关**引入所有请求路径，而非 Node 运行时的可用性尚未验证；本阶段的验收矩阵不含跨运行时验证，按 kill-switch「回归面不可控则只落设计结论」处理。
2. 方案 B 是长期正确形态，但改动面远超 3 文件 / 单条链路，且会改变公共工具签名，须单独立项并配套 API / 邮件回归。
3. 方案 C 消除「注释宣称已生效、实际恒回退」的认知误导，把缺陷从「隐性错误」变为「显性已知限制」，且零运行时风险。

**被排除项（roadmap 指定的「handler 链包裹」）**：h3 的 `defineEventHandler` 中间件没有 `next()` 语义，无法把后续 handler 包进 `i18nStorage.run()`；要包裹只能在 Nitro app 层改写 handler 栈或逐路由改造，前者依赖框架内部结构、后者等同方案 B 的多调用链改造。因此「handler 链包裹」不单列为可实施方案，其等价目标由方案 A（框架级异步上下文）承接。

**Kill-switch 判定**：A 的回归面（全请求链 + 非 Node 运行时未验证）与 B 的改动面（>3 文件、多条调用链）均触发本条目 kill-switch，故本阶段只落设计结论。

## 4. 后续跟踪（backlog #5）

- 触发条件：需要服务端响应 / 邮件 / Feed 按请求语言本地化时，或决定升级 Nitro 并评估 `asyncContext` 时。
- 实施前置：跨运行时（Node / Vercel）验证 `useEvent()` 可用性；为 API 响应、邮件、Feed 各补至少一条语言断言；评估每请求 unctx 包裹的 CPU / 内存开销。
- 回滚边界：方案 A 以单提交回滚（配置开关 + `getLocale` 实现 + 中间件清理同批）。

## 5. 本批落地内容

- `server/middleware/i18n.ts`：删除 `i18nStorage.run(appLocale, () => {})` 与其误导注释，保留 `event.context.locale` 写入；注释如实说明该字段当前无读取方、页面语言由 `@nuxtjs/i18n` 驱动。
- `server/utils/i18n.ts`：`getLocale()` 注释改为说明「仅当调用方显式 `i18nStorage.run` 时生效，生产代码当前无该调用；请求级 locale 在 `event.context.locale`，本函数不自动读取」。
- 新增 `tests/server/middleware/i18n.test.ts`：锁定「写入 `event.context.locale`」「跳过内部路径」「不向 ALS 注入、`getLocale()` 仍回退 `AUTH_DEFAULT_LOCALE`」三条契约。
- 现有单测（`server/utils/i18n.test.ts`）继续覆盖「无 store 回退默认语言」与「显式 run 生效」两条事实。
