# 回归历史归档：2026-09-21 PostgreSQL 值类型解析热修复

本文档收录 2026-09-21 的 PostgreSQL 值类型解析退化热修复窗口，于 2026-10-14 自
`docs/reports/regression/current.md` 滚动迁出（第三次归档），为第六十八阶段条目 2 的持续迁移窗口恢复 `docs:check:line-count` 余量。

迁出方式：整体迁移（marker + 标题 + 正文 + end 成对保留），正文逐字未改。
选此窗口的理由：它是当前窗口内**唯一**未被 `docs/plan/**` / `docs/design/**` 以节名锚点
（如「回归记录 M1 节 / M3 节」「caomei-ui 漂移收口节」「第六十八阶段条目 1 节」）引用的窗口——其余窗口归档前须先改写引用方，见
[backlog.md](../../plan/backlog.md) 长期主线第 6 条的「归档约束」补记。

<!-- regression-window:start:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->
## 2026-09-21 PostgreSQL 值类型解析退化导致「所有文章显示置顶」修复

### 范围

- 现象：后台文章管理列表所有行「置顶」列显示「是」；友链页 `isPinned` / `isFeatured`、站内通知 `isRead` 等布尔徽章存在同类误判风险。
- 根因：Nitro 2.13 的 Rollup `treeshake.moduleSideEffects` 白名单默认不含 `pg-types`，其顶层 `textParsers.init(...)` / `binaryParsers.init(...)` 被摇树；`getTypeParser` 永久回退 `noParse`，PostgreSQL 的 `bool` / `int4` / `json` 等全部以原始文本返回（`isPinned: 'f'`、`views: '0'`、`metadata` 为 JSON 字符串）。前端 `data.isPinned ? 是 : 否` 把非空字符串 `'f'` 判为真值。
- 取证：线上 `GET /api/posts` 返回 `"isPinned":"f"`；`isPinned=true` 过滤 `total: 0`（库内为真实 false，排除数据迁移）；修复前构建产物中 `textParsers` / `binaryParsers` 出现 0 次。
- 修复：
    - 新增 `modules/nitro-pg-types-side-effects.ts`：`nitro:init` 阶段把 `pg-types` 追加进 `nitro.options.moduleSideEffects`，并以 `nitro:build:before` 护栏断言注入生效。
    - 新增 `server/database/pg-value-types.ts`，并在 `initializeDB` 接入启动自检：PostgreSQL 下跑 `SELECT true, 1::integer, '{"ok":true}'::json` 探针，类型退化时记录 `[db-type-guard]` error（不抛出）。
    - `server/decorators/custom-column.ts`：`type: 'boolean'` 列统一注入归一化 transformer（`'t'/'1'/1` → true，`'f'/'0'/0` → false）。
    - `AdminNotificationSettings` / `InAppNotification` 的布尔列改用 `CustomColumn`，消除绕过点。

### 验证结果

- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS（0 error；7 warning 为既有、与本次改动无关）。
- `pnpm test`：PASS（527 文件 / 4471 用例通过，1 skipped）。
- `pnpm build`：PASS；产物 `chunks/nitro/nitro.mjs` 已包含 `textParsers.init` / `binaryParsers.init`。
- 真实 PostgreSQL 16 端到端（Docker + 重建产物）：修复前 `/api/posts` 返回 `isPinned: 'f'` / `views: '0'`；修复后返回 `isPinned=True/False (bool)`、`views=7/0 (int)`、`metadata` 为对象、`audioUrl` 由 `metadata.audio` 正确回填；`isPinned=true` 过滤 `total: 0`；启动日志出现 `pg-value-type-check` 且无 `db-type-guard` 报错。
- 定向测试：`server/decorators/custom-column.test.ts` + `tests/modules/nitro-pg-types-side-effects.test.ts` + `server/database/pg-value-types.test.ts` 共 26 用例 PASS。
- Review Gate：初审 Pass（0 blocker / 3 warning / 7 suggest）→ 修复 W1/W2/W3 与 S1/S3 后复审 Pass（0 blocker / 0 warning）。审计记录见 `artifacts/review-gate/2026-09-21-pinned-boolean-pg-types.md`。

### 未覆盖边界

- 未逐 preset 验证 dev / Vercel / Cloudflare 产物（依据 nitropack 源码与 node-server 产物判定因果充分）。
- 启动自检为 log-only（不 fail-fast），依赖日志可观测性；后续可选在 CI 增加产物断言（grep `textParsers.init`）。
- 未在真实 MySQL / SQLite 实例复核水合（仅单测覆盖归一化语义）。
- 本批无 UI 模板 / 样式 / 交互变更，UI 浏览器验证按「数据契约修复」口径豁免；用户可见行为已由真实 PostgreSQL API 契约验证。
- S7（补「非布尔列不注入 transformer」负向断言）仍敞口，非阻塞。

<!-- regression-window:end:hotfix-pinned-pg-types:PostgreSQL 值类型解析修复:2026-09-21 -->
