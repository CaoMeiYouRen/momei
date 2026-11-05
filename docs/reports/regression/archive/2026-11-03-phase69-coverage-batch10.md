# 回归记录归档：2026-11-03 第六十九阶段条目 4（测试覆盖率治理第十批）

> 本分片承接 `docs/reports/regression/current.md` 迁出的 1 个窗口（2026-11-05 自活动窗口滚动归档，为第七十阶段条目 5 窗口腾出 `line-count` 余量）。

> 归档窗口的节名锚点引用已同步改写至本分片（`docs/plan/todo-archive.md` 1 处）。



---



<!-- regression-window:start:coverage-batch-10:第六十九阶段条目 4 测试覆盖率治理第十批:2026-11-03 -->
## 2026-11-03 第六十九阶段条目 4 测试覆盖率治理第十批（setting / 文本翻译任务 / 文章自动化）

### 范围

按「未覆盖语句绝对数」选模，补测三个服务模块（仅测试代码，无生产改动）：

| 模块 | 补测内容 | 新增用例 |
| :--- | :--- | :--- |
| `server/services/setting.ts` | `getSetting` / `getSettings` / `resolveSetting` / `resolveSettings` 的未初始化与 DB 异常回退、env 优先与批量提前返回、运行时缓存复用；`setSettings` 的 env 锁定跳过、脱敏占位符保值、legacy alias 清理、值未变化不记审计 | 13（拆到 `setting.fallbacks.test.ts`） |
| `server/services/ai/text-translation-task.ts` | `createTranslateTask` 成功创建 / 超长 413 / 配额拒绝 / 落库失败；`continueTranslateTask` 任务不存在、非 translate、已完成、failed 显式恢复、全部块已完成、lease 抢占失败、连续 3 次失败落 failed、非 serverless 单步多块 | 12 |
| `server/services/ai/post-automation.ts` | `createTranslatePostTask` 同语言 / 缺 scope / confirmed 缺 previewTaskId / 404 / 403 / 异步创建；`processTranslatePostTask` 任务不存在、翻译异常落 failed、preview 不存在、preview 未待确认 | 10 |

### 覆盖率结果

| 指标 | 第六十八阶段基线 | 本批前（推算） | 本批终值 | 本批增量 | 阶段累计 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Statements | 81.04%（28,251/34,857） | 80.98%（28,829/35,598） | **81.17%**（28,897/35,598） | **+0.19pp**（+68 条） | +0.13pp（覆盖 +646 / 总数 +741，净 +45/35,598） |
| Branches | 70.83% | — | **70.90%**（17,824/25,138） | — | +0.07pp |
| Functions | 80.07%（6,318/7,890） | — | **79.98%**（6,482/8,104） | — | −0.09pp（新增 214 个函数稀释） |
| Lines | 81.15% | — | **81.29%**（27,840/34,244） | — | +0.15pp |

> 口径注：`28,897/35,598 = 81.1759%`，vitest 文本报告按截断显示 `81.17%`；模块表按四舍五入显示。增量列按「覆盖数 / 总数」复算，与两个展示值直接相减可能差 0.01pp（如 Lines）。本批无生产代码改动，语句总数与「本批终值」一致，故「本批前」= 终值 − 三模块闭合的 68 条 = 28,829/35,598 = 80.98%（推算值，未单独实测）；`+0.13pp` 是相对第六十八阶段收口的**阶段累计**，差额来自条目 1–3 新增的 741 条语句（覆盖 578 条，78.0%）对分母的稀释。

三模块（statements / branches / functions）：

| 模块 | 补测前（按未覆盖语句数反推） | 补测后 |
| :--- | :--- | :--- |
| `setting.ts` | 83.33%（43 条未覆盖） | **90.31% / 88.35% / 93.18%** |
| `text-translation-task.ts` | 77.03%（34 条未覆盖） | **95.27% / 85.32% / 100%** |
| `post-automation.ts` | 75.76%（32 条未覆盖） | **93.18% / 80.12% / 84.21%** |

三模块均越过「`+15pp` 或达 `85%+`」验收线。

### 全仓 `+0.3pp` 未达的结构性原因

- 本批候选池（三模块）合计 109 条未覆盖语句，理论上限约 **+0.31pp**；实际闭合 68 条（setting 18 / text 27 / post 23），即 **80.98% → 81.17%，本批自身 +0.19pp**。
- 单批 `+0.3pp` 需同时满足「候选池 ≥107 条」与「接近 100% 闭合」；本批 109 条池即使 100% 闭合也只到 +0.31pp，实际闭合 62%，余额 41 条分散在低价值防御分支（`??` 兜底 / 不可达 catch / 类型收窄分支），继续铺量的边际收益低于换更大基数的模块。
- 相对第六十八阶段收口的 **+0.13pp 是阶段累计值**（+646 covered / +741 total），低于本批增量，原因是条目 1–3 的新增代码把分母从 34,857 推到 35,598。
- 结论：后续批次应优先纳入语句基数更大的模块，或以多模块组批，不在低价值分支上铺量。

### 验证结果

- `pnpm test:coverage`：EXIT 0，全量覆盖率如上（`coverage/coverage-final.json` 可复算）。
- `pnpm test`：**578 passed files / 5,119 passed / 1 skipped**（毛新增 36 例，删除 1 例与主文件重复的用例后净增 35；批次前 5,084 → 5,119；`setting.fallbacks.test.ts` 使测试文件数 +1）。
- `pnpm typecheck` 0 error；`pnpm lint`（4 个测试文件）0 error 0 warning。
- 环境隔离回归：在 `EMAIL_PASS` / `NUXT_PUBLIC_SITE_DESCRIPTION` / `NUXT_PUBLIC_DEFAULT_COPYRIGHT` 被外部注入的 shell 下单独跑 `setting.fallbacks.test.ts`，13/13 通过（避免「本地必挂 / 空断言」）。

### 未覆盖边界

- 真实 TypeORM 行为（`repo.create({ id: undefined })`、`In()` 的 SQL 形态、事务内 alias 清理）仍由 mock 替代；本批验证的是服务层分支，不是驱动层。
- `processTranslatePostTask` 仍通过结构类型断言访问私有方法，重构私有签名时不会在编译期报错，只能在运行时暴露。
- `setting.ts` 剩余 25 条、`text-translation-task.ts` 剩余 7 条、`post-automation.ts` 剩余 9 条未覆盖语句未继续处理（验收已达标，避免低价值铺量）。

<!-- regression-window:end:coverage-batch-10:第六十九阶段条目 4 测试覆盖率治理第十批:2026-11-03 -->
