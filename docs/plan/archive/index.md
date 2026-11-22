# 规划文档深度归档治理

本文档是 `roadmap.md` 与 `todo-archive.md` 的深度归档管理入口，负责定义读写压力阈值、主窗口保留范围、后续分片策略与归档触发条件。

## 1. 适用范围

- `docs/plan/roadmap.md`: 保留项目总路线、当前阶段与近线归档结论，不承担无限增长的全量历史正文。
- `docs/plan/todo-archive.md`: 保留最近若干阶段的完整归档块与近线收口依据，不长期充当所有历史阶段的唯一全文容器。
- `docs/plan/backlog.md`: 只保留长期主线、待上收候选与待跟踪项；已上收 / 已闭合 / 已完成的短期候选整条迁入 `docs/plan/archive/backlog-resolved-candidates.md`，主文档不留历史摘要。
- `docs/reports/regression/current.md`: 继续沿用独立活动窗口治理，不并回规划文档。

## 2. 当前基线（2026-11-22）

- `roadmap.md`: `437` 行（`docs:check:line-count` 口径），处于健康窗口（第一至第五十三阶段与第五十四至第六十七阶段已迁入区间分片；第六十八至第八十一阶段分别迁入 `roadmap-phases-68.md` ~ `roadmap-phases-81.md`；当前进行中阶段为第八十二阶段，正文位于「主窗口保留范围」之后、近线归档段之前）。
- `todo-archive.md`: `387` 行（`docs:check:line-count` 口径），健康窗口（主窗口保留第七十至第八十一阶段共 12 个近线归档块；深度归档索引已改为 4 列表格，倒序覆盖 14 个 todo 分片；第六十五至第六十八阶段迁入 `todo-archive-phases-65-68.md`、第六十九阶段迁入 `todo-archive-phases-69.md`）。
- `backlog.md`: `230` 行（`docs:check:line-count` 口径），处于健康窗口（长期主线 11 条 + 周期性回归验证层 + 跨主线待跟踪项；第八十一 / 第八十二阶段上收条目已回填结果，已闭合条目统一迁入 `archive/backlog-resolved-candidates.md`；#1 覆盖率基线为第八十一阶段条目 2 出口（同源 86.69%，`34,068 / 39,299`））。
- `todo.md`: `118` 行（`wc -l` 口径；该文件未纳入 `docs:check:line-count` 目标），当前进行中阶段为第八十二阶段（4 大条目 / 13 小条目），进度表 4 行。
- `docs/reports/regression/current.md`: `64` 行（`docs:check:line-count` 口径），近线窗口（2026-11-18 / 2026-11-19 / 2026-11-21 三个阶段收口窗口；更早窗口迁入 `archive/2026-11-16-to-2026-11-17-phase77-78.md`；长度阈值以 `scripts/docs/check-line-count.mjs` 为单点，条数以 `LOG_WINDOW_LIMITS.maxEntries` 为单点）。

## 3. 阈值定义

### 3.1 `roadmap.md`

- 健康窗口: `<= 800` 行。
- warning 触发: `801 - 900` 行，或当前正式阶段之外的历史阶段正文已经明显影响“当前阶段 + 近线归档结论”的阅读效率。
- 强制分片: `> 900` 行，或新增阶段规划前已经无法在单页内快速定位“当前阶段目标、上一阶段归档结论、长期路线图”。

### 3.2 `todo-archive.md`

- 健康窗口: `<= 500` 行。
- warning 触发: `501 - 700` 行，或单次阶段归档已经让早期阶段检索明显拖慢当前阶段收口。
- 强制分片: `> 700` 行，或下一次阶段归档追加后，主文档已不适合作为近线归档窗口继续维护。
- 行数是唯一硬约束，归档块数量只作观察项；v1 索引表形态见 [规划文档模型 v1](../../standards/planning-docs.md)。

## 4. 主窗口保留策略

### 4.1 `roadmap.md`

- 主文档优先保留：项目概况、长期路线、当前阶段正式规划、最近若干阶段的审计归档摘要。
- 更早且已稳定的阶段，应迁移到后续深度归档分片，只在主文档保留阶段摘要与索引入口。

### 4.2 `todo-archive.md`

- 主文档优先保留最近若干阶段的完整块，确保当前阶段收口、最近发版复盘与相邻阶段对比仍可直接完成；保留数量以行数阈值为准，块数只作观察项，不单独触发迁移。
- 更早阶段在进入分片后，应整体迁移，禁止把验收标准、审计结论与验证记录拆散到多个位置。

## 5. 后续分片策略

- `roadmap.md` 深度归档优先按阶段区间切分；当前已落地 `docs/plan/archive/roadmap-phases-01-10.md`、`roadmap-phases-11-21.md`、`roadmap-phases-22-24.md`、`roadmap-phases-25-31.md`、`roadmap-phases-32-41.md`、`roadmap-phases-42-53.md`、`roadmap-phases-54-67.md`、`roadmap-phases-68.md`、`roadmap-phases-69.md`、`roadmap-phases-70.md`、`roadmap-phases-71.md`、`roadmap-phases-72.md`、`roadmap-phases-73.md`、`roadmap-phases-74.md`、`roadmap-phases-75.md`、`roadmap-phases-76.md`、`roadmap-phases-77.md`、`roadmap-phases-78.md`、`roadmap-phases-79.md`、`roadmap-phases-80.md` 与 `roadmap-phases-81.md`。
- `todo-archive.md` 深度归档优先按阶段区间切分；已落地 `docs/plan/archive/todo-archive-phases-01-10.md`、`todo-archive-phases-11-21.md`、`todo-archive-phases-22-24.md`、`todo-archive-phases-25-31.md`、`todo-archive-phases-32-41.md`、`todo-archive-phases-42-45.md`、`todo-archive-phases-46-49.md`、`todo-archive-phases-50-51.md`、`todo-archive-phases-52-57.md`、`todo-archive-phases-58-60.md`、`todo-archive-phases-61-63.md`、`todo-archive-phases-64.md`、`todo-archive-phases-65-68.md` 与 `todo-archive-phases-69.md`。
- 现有 14 个 todo 分片与 21 个 roadmap 分片全部符合 `todo-archive-phases-<起>[-<止>].md` / `roadmap-phases-<起>[-<止>].md` 命名式，不安排改名批次；新增分片必须按命名式创建并同步登记 `todo-archive.md` 索引表与本文件。
- 若未来阶段数继续显著增长，再评估按年份或半年度拆分，而不是重新把旧正文塞回主文档。
- `docs/plan/archive/backlog-resolved-candidates.md` 承接 backlog 的已上收 / 已闭合 / 已完成短期候选与跟踪项；每次清理追加一个按日期分组的小节，旧条目不再回写 backlog。
- 主文档只保留摘要、索引与最近窗口，不再复制完整历史正文。

## 6. 本轮结论与下一步

> **维护约定**: 本文件中的行数声明必须与 `pnpm docs:check:line-count` 输出逐字对账后再写入；任何涉及 `docs/plan/` 文件的增删改后，先复跑脚本再更新本文件，防止声明漂移。

- 本轮（2026-11-05）完成第七十阶段归档收口：`roadmap.md` 迁出第七十阶段正文至 `roadmap-phases-70.md`（主窗口仅保留阶段摘要表 + 最近阶段归档结论）；`todo-archive.md` 收录第七十阶段归档块，并把第六十四阶段整体迁入 `todo-archive-phases-64.md`，主窗口保留第六十五至第七十阶段共 6 个近线窗口；`todo.md` 已清空已完成阶段正文（2026-11-05 快照：当时无进行中阶段；2026-11-06 已立项第七十一阶段）；`backlog.md` 同步 #10 的 B3 完成状态、剩余迁移面（482 处 / 40 类、图标 411 处、token 1,442 处）与 #1 的覆盖率基线（80.66%）。
- 本轮（2026-11-08）完成第七十一阶段归档收口：`roadmap.md` 迁出第七十一阶段正文至 `roadmap-phases-71.md`（主窗口仅保留阶段摘要表 + 最近阶段归档结论）；`todo-archive.md` 收录第七十一阶段归档块，主窗口保留第六十五至第七十一阶段共 7 个近线窗口；`todo.md` 已清空已完成阶段正文（2026-11-08 快照：无进行中阶段，第七十二阶段待准入）；`backlog.md` 同步 #10 的 B4 完成状态、剩余面（46 处 / 14 类、图标 0、token 1,420）与 #1 的覆盖率基线（79.23%）。
- 本轮（2026-11-09）完成第七十二阶段归档收口：`roadmap.md` 迁出第七十二阶段正文至 `roadmap-phases-72.md`（主窗口仅保留阶段摘要表 + 最近阶段归档结论）；`todo-archive.md` 收录第七十二阶段归档块，主窗口保留第六十五至第七十二阶段共 8 个近线窗口；`todo.md` 已清空已完成阶段正文（2026-11-09 快照：无进行中阶段）；`backlog.md` 同步 #10 迁移收口、#1 覆盖率第十三批基线（81.83%）与 #11 三处层序偏差待跟踪。
- `docs/reports/regression/current.md` 本轮滚动归档：第七十阶段 6 个窗口（条目 5 覆盖率 / 1a / 1b-1c / 2c / 3 / 4）整体迁入 `reports/regression/archive/2026-11-05-phase70-close.md`；活动窗口保留阶段收口门禁窗口与第六十九阶段条目 2 / 3 两个窗口（`105` 行，健康窗口）。条目 2a / 2b 窗口已在阶段内分别归档。
- `roadmap.md` 当前保留第一至第五十三阶段的索引 / 摘要、第五十四至第六十七阶段摘要表、第六十八至第八十一阶段摘要与归档结论（`docs:check:line-count` 口径 `437` 行，低于 800 行 warn 线）；当前进行中阶段为第八十二阶段。
- `todo-archive.md` 当前保留第七十至第八十一阶段共 12 个近线归档块（`docs:check:line-count` 口径 `387` 行，健康窗口）；第六十五至第六十八阶段与第六十九阶段已分别迁入 `todo-archive-phases-65-68.md`、`todo-archive-phases-69.md`。
- 后续：第八十一阶段已于 2026-11-21 审计归档；第八十二阶段已于 2026-11-22 按 §4.5 Step 7 完成候选确认（用户确认方案 A）并按 Step 8 复核工作区与归档一致性后立项，当前按 `todo.md` 的 4 个大条目推进。

- 本轮（2026-11-14）完成第七十五阶段归档收口：`roadmap.md` 迁出第七十五阶段正文至 `roadmap-phases-75.md`（主窗口 `261` 行）；`todo-archive.md` 收录第七十五阶段归档块并把第六十九阶段迁入 `todo-archive-phases-69.md`，主窗口保留第七十至第七十五阶段共 6 个近线窗口（`234` 行）；`todo.md` 已清空当前阶段（无进行中阶段）；回归窗口保留 4 条（含说明节，3 个活动窗口，`51` 行）。

- 本轮（2026-11-15）完成第七十六阶段归档与第七十七阶段立项：`roadmap.md` 迁出第七十六阶段正文至 `roadmap-phases-76.md`，并把第七十七阶段 6 条规划正文写入主窗口（`317` 行）；`todo-archive.md` 收录第七十六阶段归档块，主窗口保留第七十至第七十六阶段共 7 个近线窗口（`258` 行）；`backlog.md` 同步 #1 第十八批上收、#6 归档链接治理上收、#9 零引用组件扫描、#11 字号归一第一批、#17 devcontainer 上收与认证会话待跟踪项上收，并修正 #5 / #8 / #10 的过期「进行中 / 筹备中」状态、按 2026-11-15 inventory 复算 #10 候选命中（`263` 行）；回归窗口 `74` 行 / 5 条；本文件 §2 / §5 的行数与分片清单同步更新。


- 本轮（2026-11-16）完成第七十七阶段归档收口：`roadmap.md` 迁出第七十七阶段正文至 `roadmap-phases-77.md`（主窗口 `297` 行，仅保留摘要表与归档结论）；`todo-archive.md` 收录第七十七阶段归档块，主窗口保留第七十至第七十七阶段共 8 个近线窗口（`292` 行）；`todo.md` 已清空当前阶段（无进行中阶段）；归档链接治理把 `archive` 纳入 `docs:check:links`（扫描面 `354` 个 md，0 失效）；回归窗口 `87` 行 / 7 条（含 2026-11-16 阶段收口回填）；本文件 §2 / §5 的行数与分片清单同步更新。

- 本轮（2026-11-18）完成第七十八阶段归档收口：`roadmap.md` 迁出第七十八阶段正文至 `roadmap-phases-78.md`（主窗口 `318` 行，仅保留摘要表与归档结论）；`todo-archive.md` 收录第七十八阶段归档块，主窗口保留第七十至第七十八阶段共 9 个近线窗口（`319` 行）；`todo.md` 已清空当前阶段（无进行中阶段）；`backlog.md` 同步 #1 覆盖率第十九批（85.99%）、#6 治理索引、#9 周回归接线、#10 规则债第三批与 picomatch 台账、#11 字号第二批与 `AppAvatar`（`268` 行，`wc -l` 口径 267）；回归窗口把 2026-11-15 的 5 个窗口滚动归档到 `reports/regression/archive/2026-11-15-to-2026-11-17-phase76-78.md`；本文件 §2 / §5 / §7 的行数与分片清单同步更新。

- 本轮（2026-11-18）完成 backlog 候选池清理（文档-only，不涉及阶段规划）：12 条已上收 / 已闭合短期候选与 9 条已完成跟踪项整条迁入 [backlog-resolved-candidates.md](./backlog-resolved-candidates.md)，并复核 9 项过时跟踪项（`ai:check`、DatePicker `id`、parity 参考态张数、`continue-on-error`、`p-fluid`、回归窗口双口径、en-US 同步债务、治理索引缺口、归档链接盲区）；`backlog.md` `268` → `240` 行，待上收候选重排为 7 条并补旧编号对照；同步刷新 #2 / #8 基线、补齐 #10 的回归覆盖矩阵行、清理 #5 / #11 的「已上收」残留叙述。

- 本轮（2026-11-21）立项第八十一阶段「质量底线与债务收口」：用户于候选页确认方案 A（5 条，ROI 均值 `2.42`）；`roadmap.md` 写入 5 条完整规划（`424` 行，`docs:check:line-count` 口径），`todo.md` 同步 5 个大条目 / 17 个小条目与 6 列进度表（`141` 行，`wc -l` 口径）；`backlog.md` 回填 #1 / #6 / #10 / #11 的「最近一次上收阶段」（`228` 行，`wc -l` 口径）；四语种 roadmap 摘要同步「第八十一阶段已立项」并刷新 `last_sync`。

## 7. 相关入口

- 当前路线图: [../roadmap.md](../roadmap.md)
- 当前待办归档: [../todo-archive.md](../todo-archive.md)
- 规划文档模型 v1: [../../standards/planning-docs.md](../../standards/planning-docs.md)
- 路线图分片: [roadmap-phases-01-10.md](./roadmap-phases-01-10.md)、[roadmap-phases-11-21.md](./roadmap-phases-11-21.md)、[roadmap-phases-22-24.md](./roadmap-phases-22-24.md)、[roadmap-phases-25-31.md](./roadmap-phases-25-31.md)、[roadmap-phases-32-41.md](./roadmap-phases-32-41.md)、[roadmap-phases-42-53.md](./roadmap-phases-42-53.md)、[roadmap-phases-54-67.md](./roadmap-phases-54-67.md)、[roadmap-phases-68.md](./roadmap-phases-68.md)、[roadmap-phases-69.md](./roadmap-phases-69.md)、[roadmap-phases-70.md](./roadmap-phases-70.md)、[roadmap-phases-71.md](./roadmap-phases-71.md)、[roadmap-phases-72.md](./roadmap-phases-72.md)、[roadmap-phases-73.md](./roadmap-phases-73.md)、[roadmap-phases-74.md](./roadmap-phases-74.md)、[roadmap-phases-75.md](./roadmap-phases-75.md)、[roadmap-phases-76.md](./roadmap-phases-76.md)、[roadmap-phases-77.md](./roadmap-phases-77.md)、[roadmap-phases-78.md](./roadmap-phases-78.md)、[roadmap-phases-79.md](./roadmap-phases-79.md)、[roadmap-phases-80.md](./roadmap-phases-80.md)、[roadmap-phases-81.md](./roadmap-phases-81.md)
- 待办归档分片: [todo-archive-phases-01-10.md](./todo-archive-phases-01-10.md)、[todo-archive-phases-11-21.md](./todo-archive-phases-11-21.md)、[todo-archive-phases-22-24.md](./todo-archive-phases-22-24.md)、[todo-archive-phases-25-31.md](./todo-archive-phases-25-31.md)、[todo-archive-phases-32-41.md](./todo-archive-phases-32-41.md)、[todo-archive-phases-42-45.md](./todo-archive-phases-42-45.md)、[todo-archive-phases-46-49.md](./todo-archive-phases-46-49.md)、[todo-archive-phases-50-51.md](./todo-archive-phases-50-51.md)、[todo-archive-phases-52-57.md](./todo-archive-phases-52-57.md)、[todo-archive-phases-58-60.md](./todo-archive-phases-58-60.md)、[todo-archive-phases-61-63.md](./todo-archive-phases-61-63.md)、[todo-archive-phases-64.md](./todo-archive-phases-64.md)、[todo-archive-phases-65-68.md](./todo-archive-phases-65-68.md)、[todo-archive-phases-69.md](./todo-archive-phases-69.md)
- 短期候选解决归档: [backlog-resolved-candidates.md](./backlog-resolved-candidates.md)
- 回归记录入口: [../../reports/regression/index.md](../../reports/regression/index.md)

- 本轮（2026-11-18）完成第七十九阶段归档收口：`roadmap.md` 迁出第七十九阶段正文至 `roadmap-phases-79.md`（主窗口 `334` 行，仅保留摘要表与归档结论）；`todo-archive.md` 收录第七十九阶段归档块，主窗口保留第七十至第七十九阶段共 10 个近线窗口（`344` 行）；`todo.md` 已清空当前阶段（无进行中阶段，`33` 行）；`backlog.md` 同步 `networkidle` 明确保留与 `@vite-pwa/nuxt` 2.0.1 保留结论（`239` 行）；回归窗口 `51` 行 / 3 条（含 2026-11-18 阶段收口回填）；新增 `roadmap-phases-79.md` 并登记本索引 §7。

- 本轮（2026-11-19）立项第八十阶段「功能与体验收口」：用户于候选页确认方案 A（6 条，ROI 均值 `2.00`）；`roadmap.md` 写入 6 条完整规划（`364` 行），`todo.md` 同步执行面（`79` 行）；`backlog.md` 将 CLI 断点续传与首页缓存解耦迁入短期候选解决归档，并回填 #1 / #9 / #10 / #11 的「最近一次上收阶段」（`228` 行）；四语种 roadmap 摘要同步「第八十阶段已立项」并刷新 `last_sync`。

- 本轮（2026-11-19）完成第八十阶段归档收口：`roadmap.md` 迁出第八十阶段正文至 `roadmap-phases-80.md`（主窗口 `350` 行，仅保留摘要表与近线归档结论）；`todo-archive.md` 收录第八十阶段归档块，主窗口保留第七十至第八十阶段共 11 个近线归档块（`366` 行）；`todo.md` 已清空当前阶段（`34` 行，无进行中阶段）；`backlog.md` 回填第八十阶段 6 条上收条目的完成结果（`228` 行），`archive/backlog-resolved-candidates.md` 同步；四语种 roadmap 摘要把「已立项」改为「已审计归档」；回归窗口把 2026-11-16 / 2026-11-17 两个窗口滚动归档到 `reports/regression/archive/2026-11-16-to-2026-11-17-phase78-79.md`，活动窗口保留 2026-11-18 / 2026-11-19 两个窗口（`46` 行）；阶段收口 `regression:phase-close` 本机第 3 次运行 **Pass**（statements 86.33%，33,935 / 39,306）。

- 本轮（2026-11-20）采纳规划文档模型 v1（issue #1071）：`todo.md` 增加 6 列进度表（空阶段占位行）；`todo-archive.md` 索引改为 4 列表格，倒序覆盖 14 个 todo 分片；新增 [规划文档模型 v1](../../standards/planning-docs.md) 与 `pnpm docs:check:planning-docs`；主窗口阈值维持 500，分片命名无需改名；`backlog.md` 候选字段规范化延后至长期主线 #6。变更说明见 [落地说明](../../design/governance/2026-11-20-planning-document-model-v1.md)。

- 本轮（2026-11-21）完成第八十一阶段归档收口：`roadmap.md` 迁出第八十一阶段正文至 `roadmap-phases-81.md`（主窗口 `372` 行，仅保留概览表与归档结论）；`todo-archive.md` 收录首个 v1 归档块（6 项 + 标记），主窗口保留第七十至第八十一阶段共 12 个近线归档块（`387` 行）；`todo.md` 已清空当前阶段（`36` 行，进度表为占位行）；`backlog.md` 回填 #1 / #6 / #10 / #11 的第八十一阶段完成结果（`230` 行）；四语种 roadmap 摘要改为「已审计归档」；新增 `roadmap-phases-81.md` 并登记 §5 / §7 与 `roadmap.md` 索引。
