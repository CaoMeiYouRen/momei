# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:phase68-item4-coverage-batch9:第六十八阶段-条目4-测试覆盖率第九批:2026-10-22 -->
## 2026-10-22 第六十八阶段 条目 4 测试覆盖率治理第九批（P2）

### 范围

按 [todo.md](../../plan/todo.md) 第六十八阶段条目 4，从 `server/services/` 低覆盖候选中选取 4 个模块补测：`friend-link` / `notification` / `post-distribution` / `upload`。失败 / 边界断言优先，不为覆盖率重构被测模块，不追求全仓 `90%+` 一步到位。基线取 2026-10-22 本批开始前的全量 `coverage-final.json`（Statements 80.45% / 34,857 条）。

### 模块覆盖（全量 `coverage-final.json`，2026-10-22）

| 模块 | Statements 基线 | 本批 | Δ | Branches | Functions |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `server/services/friend-link.ts` | 73.06% | **99.26%** | +26.20pp | 96.46% | 97.22% |
| `server/services/notification.ts` | 70.10% | **98.45%** | +28.35pp | 91.76% | 90.91% |
| `server/services/post-distribution.ts` | 75.32% | **91.91%** | +16.59pp | 85.34% | 100.00% |
| `server/services/upload.ts` | 75.45% | **98.80%** | +23.35pp | 91.78% | 100.00% |

> 口径：模块表数值按 `artifacts/cov-final/coverage-final.json` 以标准四舍五入复算（Branches 为分支路径级口径）；全仓表沿用 vitest 控制台展示值（81.04 / 80.07）。两处差异 ≤0.01pp 属展示舍入。

### 全仓结果与 +1pp 判定

| 指标 | 基线 | 本批 | Δ |
| :--- | ---: | ---: | ---: |
| Statements | 80.45%（28,044/34,857） | **81.04%**（28,251/34,857） | **+0.59pp**（+207） |
| Branches | 69.81%（17,235/24,690） | **70.83%**（17,488/24,690） | +1.02pp（+253） |
| Functions | 79.85%（6,300/7,890） | **80.07%**（6,318/7,890） | +0.22pp（+18） |
| Lines | 80.54%（27,009/33,536） | **81.15%**（27,215/33,536） | +0.61pp（+206） |

- **逐模块验收**：4/4 达成「各 +15pp 以上或达 85%+」。
- **全仓 Statements +1pp 未达成（+0.59pp）**：4 个候选合计仅 **866 条语句**（全仓 34,857 的 2.48%），即使 100% 闭合其全部未覆盖语句上限也仅约 **+0.66pp**，结构上无法在本批达到 +1pp。本批实际达成 **+0.59pp ≈ 该上限的 89%**，余额按验收条款转 [backlog](../../plan/backlog.md) 长期主线 #1（下一批按绝对未覆盖语句数选模，而非百分比）。
- 基线口径说明：`todo.md` 立项时引用的 80.63% 来自第六十六阶段；仓库后续增长使本批开始前实测为 **80.45%**，本记录以实测为准，并按「未达 +1pp 显式记录」条款处置。立项时引用的 `upload` 74.85% / `post-distribution` 75.31% 与本批实测基线 75.45% / 75.32% 存在来源差异（分别为 0.60pp / 0.01pp），一律以本批开始前的实测产物为准。

### 「文件 → 改动点」清单

| 文件 | 新增用例 | 覆盖重点（失败 / 边界优先） |
| :--- | ---: | :--- |
| `server/services/friend-link.applications.test.ts`（新增） | 12 | `getFriendLinks` / `getApplications` 默认分页与组合筛选；`createApplication` 的 logo 白名单、登录申请人上传域名复用、匿名非法外链 400、存储上下文缺失回退；`reviewApplication` 既有友链更新 / 新建友链 / 驳回三条路径与字段继承 |
| `server/services/friend-link.health.test.ts`（新增） | 13 | 功能关闭早退、空候选不写日志、403/405 回退 GET、其他失败不重试、指数退避与上限钳制、自动停用阈值命中 / 关闭 / 非法配置、批量大小上限与非法 / 零值回退 |
| `server/services/friend-link.test.ts`（补） | +6 | 公开列表关闭早退、分类过滤、同分类分组、`featured` 未指定 `limit` 回退页脚数量、申请指南非字符串回退、URL 无法解析 400、更新 URL 持久化 |
| `server/services/post-distribution.failures.test.ts`（新增） | 24 | 文章不存在 404、非作者 403、草稿 400、Memos 关闭 / 空结果 / `republish-new` / 进行中 attempt 复用；9 类错误归类 `it.each`；WechatSync 并发 409、全成功、未知 attempt 404、鉴权词表归类 |
| `server/services/upload.flows.test.ts`（新增） | 35 | `uploadFromUrl` 用本地 HTTP 服务覆盖 Content-Type 推断 / 缺失回退 / 文件名清洗 / 白名单拒绝 / 大小拒绝；`uploadFromBuffer` 限额与用户闸门；`handleFileUploads` 跳过非文件字段 / 无有效文件 / `mustBeImage` / 默认与自定义 `maxFiles`；存储上下文 r2 / vercel-blob / 未知驱动 / 非法数值；公开域名优先级与类型规则 |
| `tests/server/notification.marketing.test.ts`（新增） | 22 | Listmonk 即时投递 / 排期保持 / 已成功跳过 / 缺成功记录补发 / `ListmonkDispatchError` 失败落库与人工提示 / 无远端 ID 回退；`startMarketingCampaignDispatch` 六种状态；`createCampaignFromPost` 语言前缀 / 摘要截断 / 筛选覆盖 / 排期；SSE 连接注册 / 注销 / 实时事件 |
| `tests/server/notification.stream.test.ts`（新增） | 10 | 在线 SSE 成功后 Web Push 跳过、SSE 全失败、用户关闭 Web Push、未配置默认发送、无订阅跳过、0 条发送失败、Web Push 抛错、全局广播无连接 / 统计 / 单点失败隔离 |

新增 **6 个测试文件 / 116 例**，另在既有 `friend-link.test.ts` 补 **6 例**，合计 **122 例**。

### 验证结果

- **全量单测 + 覆盖率**：`NODE_OPTIONS=--max-old-space-size=6144 pnpm exec vitest run --coverage --maxWorkers=1` → **EXIT 0**，**566 文件 / 5012 passed / 1 skipped**，耗时 761.92s。本地执行前已清空 `node_modules/.vitest-cache`（热缓存会触发 i18n 虚拟模块解析失败，见「未覆盖边界」）。
- **定向**：4 个模块相关 10 个测试文件 **220/220 passed**（含既有 `friend-link.test.ts` / `post-distribution.test.ts` / `upload.test.ts` / `notification.test.ts` 回归）。
- **质量门**：`pnpm typecheck` EXIT 0；`pnpm lint` **0 error / 8 warning**（既有 `text.test.ts` 与 `packages/cli` 3 条，本批未新增）；`pnpm lint:css` EXIT 0；`pnpm lint:md` EXIT 0。
- **滚动归档**：按阶段收口必办项执行**第十二次**滚动归档，把 2026-10-13 `caomei-ui@0.6.0` 漂移窗口整体迁至 [归档分片](./archive/2026-10-13-phase68-caomei-drift-060.md)，同步改写 3 个文件共 5 处节名引用（`todo.md` 1、上游反馈 1、迁移方案 3），并更新 [归档索引](./archive/index.md)。

### 未覆盖边界 / 观察项

- **测试暴露的既有缺陷（本批未修复）**：`friend-link` 的 `createFriendLink` / `updateFriendLink` 先 `trim()` `name` / `url`，随后 `saveFriendLinkEntity` 的 `assignDefined(entity, input, …)` 用未清洗的原始 `input` 覆盖，首尾空白仍可能落库。已登记 [backlog](../../plan/backlog.md) 待跟踪，避免在覆盖率批次内扩大业务改动面。
- **本地测试环境噪声**：`node_modules/.vitest-cache` 热命中后，含 `post-copyright` / i18n 依赖的测试文件会报 `Cannot find module '/@id/virtual:intlify-i18n-N'`；冷缓存可正常加载，CI 未复现。本批验证在冷缓存下完成，已登记 backlog 待跟踪（评估 `--no-cache` 或隔离缓存目录）。
- **剩余可提升面**：`server/services/` 当前未覆盖语句最多的模块为 `setting.ts`（43）/ `ai/text-translation-task.ts`（34）/ `migration-link-governance.ts`（32）/ `ai/post-automation.ts`（32）/ `ai/tts.ts`（30）；单模块收益已进入低个位数百分比区间，后续批次需按绝对语句数选模。

<!-- regression-window:end:phase68-item4-coverage-batch9:第六十八阶段-条目4-测试覆盖率第九批:2026-10-22 -->

<!-- regression-window:start:phase68-fix-doc-markers:第六十八阶段-文档标记完整性修复与门禁补强:2026-10-16 -->
## 2026-10-16 第六十八阶段 文档标记完整性修复与门禁补强（Deploy VitePress site to Pages 修复）

### 范围

修复 master 上 **Deploy VitePress site to Pages** 的构建失败（run `38925462341`，job `build` 的 `Build with VitePress` 步骤 8.24s 失败），并按「同类事故第三次」的判据把该缺陷类纳入门禁（本批只涉及文档与脚本，不触碰运行时代码）。

### 根因与引入点

- **直接故障**：两处归档分片中的 **3 行 `regression-window` 结束标记被截断**（只剩「第六十」，缺失后半段与 `-->`）：

| 文件 | 行 | 实际落库形态 |
| :--- | :--- | :--- |
| `archive/2026-09-26-phase68-item1-upgrade-030.md` | 59 | 结束标记在 id 后的中文标题处断开 |
| `archive/2026-10-16-phase68-b2-friend-links-and-posts.md` | 85 | 同上（第九路由窗口） |
| 同上 | 193 | 同上（第十路由窗口） |

- **失败机制**：VitePress 把 md 当 Vue SFC 编译，**块级**未闭合注释（行首 `<!--` 延续到文件末尾仍无 `-->`）触发 `RolldownError / SyntaxError: Unexpected EOF in comment`，构建在 `building client + server bundles...` 阶段中断（本地同命令复现，报错文件与行号与 CI 完全一致；用 `markdown-it` + `@vue/compiler-dom` 实测确认该报错的唯一来源就是这一形态——合法多行注释与正文中段的行内 `<!--` 都会被转义、编译通过）。
- **引入点**（`git blame`）：三处均随归档提交落库——`f4496147`（第十次滚动归档，条目 1 分片）与 `b5d98bb6`（第十一次滚动归档，第九 / 第十路由分片），即**归档文本生成阶段被截断**，非后续编辑引入。
- **门禁盲区（本批补强的靶点）**：同一 run 中 `Lint Markdown files` 与 `Check Markdown links` 均为通过，`docs:build` 前置的 `docs:check:i18n / line-count / links` 亦全部通过——四道检查都不校验注释完整性；更深一层是 `check-links` 的 `EXCLUDED_DIRS` **显式包含 `archive`**，归档分片正文整体不在其扫描面内。
- **同类事故史**：窗口归档仍为人工 / 临时脚本操作，此前已两次留下「孤立注释尾行」（`current.md` 残留单行 `-->`）与一次「外部节名引用未改写」；本次为第三次，故按「补静态检查」而非「再修一次」处置。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| 上述 2 个归档分片 | 3 处结束标记按同文件对应 start 标记还原为完整形态（含 `-->`） | 既有归档口径（end 与 start 同 id） |
| `scripts/docs/check-doc-markers.mjs`（新增） | 三类判据：① **块级注释未闭合**——模拟 markdown-it 的 HTML block type 2（块级 `<!--` 后本行及后续行被原样输出，直到某行出现 `-->` 或 EOF），只报原样输出文本中残留的未闭合 `<!--`（含「本行先闭合、行尾又开一个」形态）；块级开头识别含缩进口径（顶层 / 标记后 ≥4 列视为缩进代码块）、blockquote 与列表前缀、fence 采用「同字符 + 不短于开启长度 + 同 blockquote 深度」的闭合规则（容器边界会提前终止 fence）；**不拦**合法多行注释与 HTML5 空注释（`<!-->` / `<!--->`）、正文中段行内 `<!--`、缩进代码块与 fenced 内的 `<!--`；② 孤立注释尾行；③ 回归窗口 start / end 按栈配对（缺对、id 错配、文件结束仍未闭合，标记 token 大小写不敏感）与标记形态非法。**扫描面含 `archive`**（与 `check-links` 相反） | 本次根因；backlog「归档静态检查」条目 |
| `tests/scripts/check-doc-markers.test.ts`（新增） | **19 条用例**：行级判定、块级未闭合（EOF / 同行先闭合后残留 / 引用与列表前缀）与**假阳性回归锁**（合法多行、空注释、行内、缩进代码块、Tab、标记后多余缩进、fenced（含 4 字符 fence、引用包裹 fence、容器边界）、行内代码闭合）、孤立尾行窄口径、三类配对缺陷、大小写变体、嵌套窗口合法、fence 行号收集、形态非法、扫描面（**断言不排除 `archive`**）、真实仓库 0 问题回归锁；**14 项语义变异全部被杀死**（见「验证结果」清单） | 层 ① |
| `package.json` | 新增稳定入口 `docs:check:markers`，并接入 `docs:build` / `docs:dev` 链（构建前拦截，而非构建后报错） | 既有 `docs:build` 链式口径 |
| `.github/workflows/test.yml` | build-deps job 在 `docs:check:links` 后新增 `docs:check:markers`，使该类缺陷在 push / PR 的主 CI 即失败，不依赖 docs 工作流 | 既有文档检查步骤位置 |
| `scripts/README.md` | `docs` 高频入口与 `scripts/docs/` 目录索引登记新脚本与入口 | 脚本治理要求 |
| `docs/standards/documentation.md` | §7 新增「标记完整性阻塞检查」条款 | 规范同步 |
| `.github/skills/code-quality-auditor/references/review-checklist.md` | §5 验证与证据链新增文档站点改动的必查项，把上一条严格约束挂接到 Review Gate 检查点（规范 §6.2 规则 4 要求） | 审计 warning ① 闭环 |
| `docs/plan/backlog.md` | 删除「待跟踪（责任人：回归归档流程）」条目 | backlog 维护规则：上收后去重 |

### 验证结果

- **修复前复现**：本地 `pnpm exec vitepress build docs` 以**同一报错**失败（同 2 个文件、同行号），确认根因唯一、与本地环境无关。
- **修复后**：同命令 `build complete in 14.94s`。
- **新门禁正向**：`pnpm docs:check:markers` → `263 个 md 文件的注释与回归窗口标记完整`。
- **新门禁反向（回放修复前内容）**：对 `git show 5b0c6657^:<file>` 的两个分片运行判据，**8 项 finding / 3 处截断行无漏报**——第九 / 第十路由分片 5 项（L85 形态非法；L193 块级未闭合 + 形态非法；L6 / L87 两个 start 缺少 end），条目 1 分片 3 项（L59 块级未闭合 + 形态非法；L6 start 缺少 end）。其中 L85 属「块级被后续行 `-->` 意外闭合」形态（VitePress 编译不报错），由形态与配对判据暴露，与实测语义一致。
- **层 ①（单元）**：`pnpm exec vitest run tests/scripts/check-doc-markers.test.ts` = **19 用例通过**；`pnpm exec eslint` 两个新文件 0 error；**14 项语义变异全部被杀死**——孤立尾行口径、顶层缩进上限、fence 跳过、行内代码剥离、start-end 大小写、token 大小写、栈配对 pop、区块跳过、空注释闭合起点、fence 闭合长度、标记空白贪婪、fence 行号豁免、容器深度约束、闭合容器深度（每项均有对应反例用例，变异后立即红）。
- **判据语义对撞**：与 `markdown-it@14.3.1` + `@vue/compiler-dom@3.5.43` 的实测结果逐例比对（20 例：合法多行、空注释、缩进 / Tab、标记后多余缩进、引用与嵌套引用、引用包裹 fence、容器边界提前终止、4 字符与未闭合 fence、行内代码、同行先闭合后残留、跨行闭合、EOF、正文中段行内）；两处**已声明漏报边界**见「未覆盖边界」。
- **质量门**：`pnpm lint` **0 error**（根工程与 `packages/*`；`packages/cli` 3 条既有 warning）、`pnpm typecheck` **EXIT 0**、`lint-md` 通过。
- **脚本治理**：`pnpm governance:check:scripts` 通过（59 脚本 / 0 缺入口 / 6 仅文档引用 / 0 文档漂移）。
- **文档门禁**：`pnpm docs:build` 全链（i18n → line-count → links → markers → VitePress build）通过，`current.md` 本窗口写入后 **456 行**（`docs:check:line-count` 的 `split` 口径；`wc -l` 为 455，差 1 为末行计法；< warn 500）。
- **未重跑项**：本批无运行时代码改动，未重跑单测全量 / 管理端 E2E / 视觉两层。

### A 阶段审计结论与修复（Round 1 → Round 4 → 本笔闭环）

- **Round 1 结论**：`Pass`（audit-depth `standard`；无 blocker，3 条 warning + 4 条 suggest）。
    - **warning ①（判据超集，含可复现假阳性）**：原「同一行内必须闭合」判据**严格强于** VitePress 的真实失败条件，会让 `docs/` 内未来的合法多行 HTML 注释阻断构建与 dev server；已改为块级 + 跨行寻闭合判定。
    - **warning ②（严格约束未挂接 Review Gate 检查点）**：`docs/standards/documentation.md` §7 的「必须」条款按规范 §6.2 规则 4 挂接到 `code-quality-auditor` 审查清单 §5。
    - **warning ③（回归记录数字失真）**：反向回放 finding 数改为实测值（8 项 / 5+3 分片拆分）。
    - **suggest（存活 mutant / 大小写变体静默放过）**：补 `-->x` 窄口径用例、标记正则加 `i` 标志并补变体用例。
- **Round 2 结论**：`Pass`（复审仅覆盖修复点；无 blocker，新增 3 条 warning + 3 条 suggest，其中含 1 条**实测会中断构建的漏报**与 2 条误报面）。
    - **warning ①（缩进 ≥4 列的缩进代码块内 `<!--` 被误拦）**：按 markdown-it 的 `html_block` 缩进规则收口（Tab 计 4 列）。
    - **warning ②（开放块被 fenced / 行内代码中的 `-->` 闭合时误报）**：改为对「原样输出区块」做**原文**扫描，区块内不跳过 fence、不剥离行内代码。
    - **warning ③（`<!-- a --> 之后 <!-- b` 实测会中断构建却漏报）**：补「同一行先闭合、行尾又开一个」判据；该形态此前被错误理由固化在用例里，现已按实测改写并加锁。
    - **suggest（引用 / 列表前缀、M3 / M6 覆盖缺口）**：补引用与列表前缀用例、`regression-window:End`（大写 + 缺 id）形态用例。
- **Round 3 结论**：`Pass`（复审仅覆盖上轮修复点；无 blocker，新增 2 条 warning + 6 条 suggest）。
    - **新 warning ①（`skipFencedBlock` 丢失 fence 长度：4 字符 fence 被 3 字符行误判为闭合，造成假阳性）**：闭合 fence 改为「同字符且不短于开启长度」（CommonMark），并新增 fence 行号收集供规则 2 / 3 复用同一套口径。
    - **新 warning ②（判据与 VitePress 失败面仍有 5 类窄形态差异，且 docblock 表述超范围）**：① 标记后 ≥5 空格的误报（改为标记只吞一个空白 + 缩进上限判定）；② blockquote 包裹 fence 的误报（fence 支持 `>` 前缀）；③ `<!-->` / `<!--->` 空注释误报（闭合搜索起点与开启符重叠）；④ 顶层 ≥4 列缩进 fence 的漏报（保留，登记为边界）；⑤ 列表项内 ≥4 列缩进的漏报（保留，登记为边界）。docblock 已按实测改写并显式登记两条边界。
    - **suggest（行数口径 / 表述中性化 / 变异清单 / backlog 指向）**：均已在窗口内修订（行数补脚本口径注、Round 2 表述改为中性、变异按项列名、锚点改写口径只指向 backlog §6）。
    - **补充证据**：审计方对 263 个 `docs/**/*.md` 做「markdown-it + compiler-dom vs 判据」的全语料差分，修复前后均为 **0 假阳性 / 0 漏报**。
- **Round 4 结论**：`Pass`（复审仅覆盖 Round 3 修复点；无 blocker，新增 2 条 warning + 2 条 suggest）。
    - **新 warning ①（fence 的容器引用不一致，造成双向偏差）**：Round 3 引入的 `>` 前缀使 fence 闭合判定**容器无关**——「顶层 fence 内含引用形态行」会提前闭合（假阳性），「引用内 fence 由未引用行收尾」则漏报。已把闭合条件收紧为**同 blockquote 深度**，更浅的行视为容器提前结束并按普通 markdown 继续扫描；补「容器边界提前终止」与「更深引用行不关闭顶层 fence」两类用例。语义对撞扩至 20 例逐项一致。
    - **新 warning ②（回归记录变异计数失真）**：Round 3 稿写「9 项」而 Round 4 认定值为 **12 项**（本轮再追加 2 项容器变异后为 14 项），已按项列名并复跑复核。
    - **suggest（规范与 docblock 措辞）**：`documentation.md` §7 改为「块级 `<!--`（含引用 / 列表前缀形态）」，docblock 补记 fence 的容器边界口径。
- **仍未闭环（非 blocker，已登记）**：两条**漏报侧**边界（列表项内 ≥4 列缩进；顶层 ≥4 列缩进 fence）；backlog 原条目第三项「引用已迁出窗口的节名短语需改写」本身仍未实现。

### 提交拆分依据

按「先修主分支构建阻断 → 再落加固与接线 → 最后治理记录」拆 **3 笔**，每笔均在单提交阈值内（≤10 文件 / ≤800 行新增；本批合计 9 路径 / 816 行新增，超阈值故必须拆）：

| # | 提交 | 文件数 | 新增行 | 内容 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `5b0c6657` `fix(docs)` | 2 | 3 | 3 处截断标记还原（仅标记行），可独立 cherry-pick / 回退 |
| 2 | `40ff0650` `test(docs)` | 5 | 721 | 新脚本 395 + 单测 319 + `package.json` 入口与链 3 + CI 步骤 1 + `scripts/README.md` 登记 3 |
| 3 | `39613329` `docs(docs)` | 4 | 96 | 本回归窗口 93 + `documentation.md` §7 条款 1 + Review Gate 清单挂接 1 + backlog 去重净 1 |

**提交后实测（`git show --numstat` 逐笔复算）**：第 1 笔 2 文件 / ±3 行，第 2 笔 5 文件 / 721 新增，第 3 笔 4 文件 / 96 新增——与计划口径逐笔一致（合计 9 路径 / 816 行新增，故必须拆 3 笔）。

### 未覆盖边界 / 观察项

- **锚点漏改未纳入门禁**：backlog 原条目所列第三项「引用了已迁出窗口的节名短语需改写」未实现（相似度判定成本高、误报风险大）；其承载为 [backlog.md](../../plan/backlog.md) §6 的「窗口归档与锚点改写一并执行」口径。若再次出现锚点漏改，建议改为「归档走确定性脚本 + 迁出清单核对」，而非文本相似度兜底。
- **扫描面限定 `docs/`**：根目录 README 等其他 md 不在 VitePress 构建面内，故未纳入，避免为 GitHub 渲染场景引入新的误报面。
- **孤立尾行判据保持窄口径**：只把「整行以 `-->` 起始」判为残留，正文中作为普通符号出现的 `-->` 不报错——宁可漏报也不引入假阳性。
- **两条漏报侧边界（已在脚本 docblock 登记）**：① 列表项 / 嵌套列表内**缩进 ≥4 列**的块级开头按缩进代码块跳过（markdown-it 按列表内容缩进判定为列表内块级开头）；② 顶层**缩进 ≥4 列的 fence**（markdown-it 视其为缩进代码块）仍按 fence 跳过，其后的块级开头不被检查——后者为保留前者的真实用例（本仓多处列表内缩进 fence）所作的取舍。两条在当前语料均 0 命中。
- **另有三条 0 命中的窄形态（同为已登记边界，无需改代码）**：① 「某行先闭合、行尾又开 `<!--`、由**后续块**的 `-->` 跨块闭合」会被误报（未建模跨块拼接）；② 列表项内开启、随后被转义或裁断的块级注释漏报；③ `blockquoteDepth` 对「标记间 ≥2 空格」的嵌套引用欠计一层（开启 / 闭合同风格时两侧抵消，实测无判定偏差）。审计方的随机对撞亦确认这些形态属既有边界、非本轮引入。
- **`pnpm ai:check` 在 master 上已是红（非本批引入）**：`code-quality-auditor` / `full-stack-master` 两个 skill 的 3 处相对链接携带锚点，命中 `skill-anchor-link`；已登记 backlog（该入口未接入 workflow，故此前未暴露）。本批对 `code-quality-auditor` 的改动不新增锚点链接。

<!-- regression-window:end:phase68-fix-doc-markers:第六十八阶段-文档标记完整性修复与门禁补强:2026-10-16 -->

<!-- regression-window:start:phase68-b2-item3-marketing:第六十八阶段-条目3-组件型目标第三批次:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 3 组件型目标第三批次 B2 迁移（`/admin/marketing`）

### 范围

条目 3 的**收尾批次**（该条目的三个目标全部完成）：`/admin/marketing` 整路由迁移，涉及三个文件——`pages/admin/marketing/index.vue`（在册族 **1 处 / 1 名**：`Button`）、`components/admin/marketing-campaign-list.vue`（**14 处 / 4 名**：`Button` 5 / `Column` 4 / `DataTable` 1 / `Tag` 4）、`components/admin/marketing-campaign-form.vue`（**5 处 / 3 名**：`Button` 3 / `InputText` 1 / `Select` 1），合计在册族 **20 处 / 6 个组件名**，**无路由级在册族增量**（全部落在批次基准内）。刻意保留 PrimeVue：`Card` ×3 / `Dialog` ×1（浮层豁免 + B4）、`RadioButton` ×2 / `MultiSelect` ×2 / `DatePicker` ×1（B3 / B4）。

**本批三项「首次」**：

1. **门禁层 `selectTab` → `activate` 泛化**：对照面从「只能激活页签」扩到「可激活页签或按钮」，并新增 `expect`（激活后必须出现的就绪锚点）——首个**弹窗对照面**（`/admin/marketing` 点击「创建推送」打开弹窗截表单），使弹窗内的在册族迁移首次进入逐像素对照（此前 `taxonomy` 弹窗仅在基线层覆盖）。
2. **守卫扫描口径修正（两守卫共用）**：`FindInScopePrimeVueResiduals` 原先整文件匹配 `<Name`，`.vue` **脚本块内的 TS 泛型实参**（实测 `$fetch<ApiResponse<PaginatedData<Tag>>>`）被误判为「残留在册族组件」；改为 `stripNonTemplateBlocks`（剥离 `<script>` / `<style>` 块）后消除该类假阳性——首个因组件型目标路由（表单含类型注解）触发的守卫缺陷修复。
3. **首个「列表本体无 `#header` 插槽的第二次复现」**：`/admin/ai` 首次命中后已在规范中登记（上游反馈 §2.8），本批是第 2 个使用者（刷新按钮由表格容器内移到表格之上），按既有口径处置并补证据。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/marketing/index.vue` | 页头创建按钮 `icon="pi pi-plus"` → `CaomeiButton` + `#icon` 内 lucide `Plus`；`Card` ×3 / `Dialog` ×1 维持 PrimeVue（未迁移族 + 浮层豁免） | §6.2（图标行） |
| `components/admin/marketing-campaign-list.vue` | `DataTable` → `CaomeiDataTable`（`:value`→`:data`、`data-key` 无需、`@page` 0 基→1 基 + 受控 `:page`、`lazy` / `paginator` / `total-records` 保留）；`<Column>` ×4 → `columns`（`cell-*` 插槽；动作列用 caomei 原生 `align: 'right'` 取代 `:deep(.p-column-header-content)`）；`Tag` ×4 → `CaomeiTag` + 页面本地 `severity → tone`（`secondary → neutral` 有损近似）；状态图标 `pi pi-spin pi-spinner` / `pi pi-calendar` → lucide `LoaderCircle`（本地 keyframes + `prefers-reduced-motion`）/ `Calendar`；行内 4 按钮 → `icon-only` + `variant`/`tone` + `size="sm"` + `:label` 可访问名；刷新按钮由 `#header` 插槽移到表格之上 | §6.2 / §6.3 / 上游反馈 §2.8 |
| `components/admin/marketing-campaign-form.vue` | `Select` / `InputText` → `CaomeiSelect` / `CaomeiInput`（删除 `fluid`，保留 `id` 以维持 `<label for>` 关联——caomei 两组件 `inheritAttrs: false` + `mergeProps` 已核对）；动作按钮 `variant="outlined"` + `severity` → `variant="secondary"` + `tone`，`icon="pi pi-send"` → `#icon` + lucide `Send`；选择器宽度钩子 `:deep(.caomei-select__field) { --caomei-select-max-width: 100% }`（解除 20rem 上限） | §6.2（全宽 / 按钮形态 / 图标行）/ 上游反馈 §1.1 |
| `lib/ui-library.ts` | 登记 `/admin/marketing` 范围（`ownedFiles` 两个自有组件；无增量、无子路由例外） | §5.5 |
| `tests/modules/ui-library-guard-helpers.ts` | 新增 `stripNonTemplateBlocks`（剥离 `<script>` / `<style>` 块）并在 `findInScopePrimeVueResiduals` 内生效；子路由例外页面的标记扫描同步收窄 | §5.5 |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 新增 2 条口径用例（「脚本块内的 TS 泛型实参不被误判为组件标签」/「片段来源（无 `<script>` 块）不受剥离影响，外层标签仍被计入（防假阴性）」） | §5.5 / §8.2 |
| `components/admin/marketing-campaign-list.test.ts`、`components/admin/marketing-campaign-form.test.ts`、`pages/admin/marketing/index.test.ts`（均新增） | 32 条契约用例（列表 14 / 表单 11 / 页面 7）：列定义与 `align` / 受控分页与 `@page` 1 基 / 状态 tone 与可见文案与图标 / 行内动作形态与裁剪 / 刷新按钮位置 / 标题与空态；表单的 `id` 透传与 `fluid` 删除 / 保留族仍在原位 / 按钮形态与文案；页面的创建按钮、统计卡片、弹窗标题、编辑与保存接线 | §8.2 |
| `tests/helpers/caomei-component-stubs.ts` | `CaomeiInput` / `CaomeiSelect` 桩补 `data-id`（表单用例需断言 `id` 透传） | §8.2 |
| `tests/visual/parity/routes.ts`、`parity-budget.json`、`reference/*.png` | `selectTab` → `activate` 泛化；`/admin/marketing` 两个对照面（默认视图 + 弹窗表单，各 2 主题 = 4 testName）；参考态 4 张（迁移前 HEAD 就地采集） | §8.2 |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵 14 → 15 行；新增「营销页」用例（列表就绪 + 弹窗内出现 caomei 字段，`toPass` 重试 + 显式 `setTimeout(60s)`） | §8.2 |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

| 对照面 | light | dark | 归因（处置通道） |
| :--- | ---: | ---: | :--- |
| `admin-marketing-overview`（默认视图） | 10485px（3 带：8384 / 934 / 1167） | 13450px（3 带：8674 / 3800 / 976） | ① 列表区：`CaomeiDataTable` 表头 / 空白态 / 单元格外壳 + `CaomeiTag` + 行内按钮；② 页头创建按钮；③ 底部分页器随表格高度的行位差异 |
| `admin-marketing-form-dialog`（打开弹窗） | 14000px（4 带：4950 / 6101 / 993 / 1956） | 14370px（4 带：4580 / 5604 / 2215 / 1971） | 弹窗内表单：`CaomeiSelect` / `CaomeiInput` 字段外壳与高度、`fluid` 删除后的宽度、动作按钮 `variant` + `tone`；字段高度变化引起的弹窗内纵向位移（`RadioButton` / `MultiSelect` / `DatePicker` 为未迁移族，自身差异不在其中） |

参考态取自迁移前 HEAD（`--ref=HEAD` 就地采集）。四条对照的带求和均等于全图实测值（无带外像素、无余量）。

### 行为差异与处置

| 项 | 迁移前 | 迁移后 | 处置 |
| :--- | :--- | :--- | :--- |
| 刷新按钮位置 | PrimeVue `DataTable` 的 `#header` 插槽内（表格容器内，与标题同一行） | caomei `DataTable` 无该插槽，同一 `.marketing-campaign-list__header` 结构改置于表格之上 | 上游反馈 §2.8 的**第 2 个使用者**；契约用例断言「表格之上且唯一」防回退；差异进允许清单 |
| 列表分页 | PrimeVue 0 基 `@page`，组件内 `+1` 抬升后请求 | caomei 1 基 `@page`，直取（受控 `:page`） | 与各路由的 `pageIndexBase: 1` 同口径；契约用例用桩的 1 基载荷断言请求参数 `page=2`（防「二次抬升」回归） |
| 动作列右对齐 | `:deep(.p-column-header-content) { justify-content: flex-end }` | caomei 原生列选项 `align: 'right'` | 该 PrimeVue 内部类在 caomei 侧不存在；改用组件原生能力后删除本地 `:deep` 规则（契约用例锁定 `align`） |
| 字段宽度 | PrimeVue `fluid`（选择器家族全宽） | caomei 字段默认 100%，但选择器家族另有 `--caomei-select-max-width: 20rem` 上限 | 在字段外层解除上限（上游反馈 §1.1 的第 4 处处置，落在字段容器上） |
| 加载旋转图标 | primeicons 的 `pi-spin pi-spinner`（库内置 CSS 动画） | lucide `LoaderCircle` + 本组件 keyframes（含 `prefers-reduced-motion` 关闭） | 与 `post-audit-badge-v2.vue` 既有写法同口径 |
| 未迁移族 | `Card` / `Dialog` / `RadioButton` / `MultiSelect` / `DatePicker` | 维持 PrimeVue（浮层豁免 + B3 / B4 族） | 与全批口径一致；表单的**在册族**已迁移，未迁移族留在原位不构成混用（同浮层豁免，路由级登记覆盖） |

### 验证结果

- 结构性守卫：`tests/modules/ui-library-route-migration-guard.test.ts` **46 用例通过**（含 15 条范围条目扫描 + 4 条子路由例外断言 + 2 条新扫描口径用例）
- 契约用例：列表 **14 条** / 表单 **11 条** / 页面 **7 条**（均为新增，共 32 条；含写路径、`confirm` 接线、处理中态、保存 payload、弹窗重开的编辑态复位）
- 门禁层（截图）：`pnpm test:visual:parity` **34/34 通过**（30 既有 + 4 新增；新增 4 条未归因差异 0px）
- 基线层（截图）：`pnpm test:visual` **16/16 通过**（既有快照零变化）
- E2E：管理端 **7 用例通过**（路由矩阵 15 行 + 营销页弹窗断言）；为排除「首跑依赖 retry」的抖动疑点，另以 `--repeat-each=2` 复跑 **14 passed（2.3m，无 flaky）**——两个交互用例已显式 `test.setTimeout(60000)`（内部等待预算贴 60s，属失败路径上限）
- 质量门：`pnpm typecheck` 0 error；`pnpm lint` 0 error / 8 warning（无新增）；`pnpm lint:css` 通过；`pnpm test` 全量通过（**559 文件 · 4870 用例通过 / 1 skipped**，2026-10-16 实跑）
- 文档：`docs:check:*` 四项 + `lint-md` 通过

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模超「单次 commit ≤10 文件 / 800 行新增」阈值，按「一个原子条目的分段产出」拆分提交（每笔 ≤10 文件；实测落库规模如下，含 `lint-staged` 的 `git add` 扫入的偏差）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `dc5a0e4e` `feat(migration)` | 实现 + 事实源（列表 / 表单 / 页面 / `lib/ui-library.ts`）+ `parity-budget.json`（被 `lint-staged` 扫入） | 5 文件 / +410 / −122 |
| 2 | `640ccf97` `test(migration)` | 契约用例 32 条 + 守卫扫描口径修正与 2 条新用例 + 共享桩扩展 | 6 文件 / +736 / −4 |
| 3 | `0802365e` `test(visual)` | 门禁 `activate` 泛化 + 4 张迁移前参考态 + 预算校准 + E2E 矩阵与用例 | 9 文件（含 4 张二进制）/ +114 / −20 |
| 4 | 本笔 `docs(migration)` | 治理记录（回归窗口 / 第十一次滚动归档 / §5.5 / 上游反馈 §2.8 / 偏差处置表 / backlog / todo） | 8 文件 |

**哈希口径**：本批 6 笔在推送前重写过一次**提交信息正文**（字面 `\n` 转义 → 真实换行；`git diff <重写前> <重写后>` 为空，内容零变化），表中为**重写后**哈希。

**规模口径说明**：① `lint-staged` 的 `git add` 会把当时未暂存的改动一并 stage——`parity-budget.json` 因此从计划中的第 3 笔落到第 1 笔，按**实测落库**记录（与第二批次同型）；② 逐笔均 ≤10 文件，且各笔自洽可回滚（源码 / 测试 / 门禁资产 / 治理记录互不耦合）。

### 未覆盖边界 / 观察项

- 门禁层参考态为**空推送列表**（种子数据无营销推送），有数据行时的行内按钮组与状态标签渲染差异不在门禁层覆盖内（由契约用例承接）。
- 弹窗对照面靠「点击创建按钮 + `[role="dialog"]` 就绪锚点」定位；若按钮文案（`create_btn`）或弹窗实现变更，需同步 `routes.ts` 的 `activate.name` / `expect`。
- `MultiSelect` 仅在选择「按条件定向」后渲染，门禁层弹窗对照面停在默认（全量订阅者）态，故该族与其选项列表无截图覆盖（未迁移族，随 B3 批次处理）。
- 守卫的「脚本块剥离」口径收窄了扫描面：脚本内以**字符串形式**出现的旧标签名不再计入（本仓无此写法，已登记为已知边界）。
- 本批审计按 mutant 视角列出的**仍无断言**的行为（已登记、随后续批次处理）：① 状态图标的旋转动画与 `prefers-reduced-motion` 关闭（契约用例只钉类存在，门禁参考态为空列表、截图 `animations: 'disabled'`，三重盲区）；② 表格 `:loading="loading"` 透传；③ 表单回显时 categoryIds / tagIds 的**反聚合**（跨语言簇展开）与 `targetType` 还原；④ 保留族（`MultiSelect` / `DatePicker`）的 props 只做存在性计数（属 B3 / B4 待批）。
- `onPage` 未同步 `event.rows`（同类自持分页页 `pages/admin/migrations/link-governance.vue` 有同步）：当前无实害（未传 `rows-per-page-options`，每页条数不可变），若后续补该选项需按 caomei `setPageSize` 口径一并取 `rows`。

<!-- regression-window:end:phase68-b2-item3-marketing:第六十八阶段-条目3-组件型目标第三批次:2026-10-16 -->

<!-- regression-window:start:phase68-b2-item3-ai:第六十八阶段-条目3-组件型目标第二批次:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 3 组件型目标第二批次 B2 迁移（`/admin/ai`）

### 范围

条目 3 的**第二批次**：`/admin/ai` 整路由迁移，涉及三个文件——`pages/admin/ai/index.vue`（`Tabs` 族 **7 处 / 5 名** + 受控分页接线）、`components/admin/ai/task-list.vue`（**27 处 / 9 名**：`Avatar` 1 / `Button` 4 / `Column` 12 / `DataTable` 1 / `IconField` 1 / `InputIcon` 1 / `InputText` 1 / `Select` 2 / `Tag` 4）、`components/admin/ai/stats-overview.vue`（`Tag` **7 处**）。合计在册族 **41 处 / 14 个组件名**（基准 34 处 / 9 名 + 路由级增量 `Tabs` 族 7 处 / 5 名）。

**本批三项「首次」**：

1. **首个「子路由例外登记」**：新机制 `CAOMEI_UI_ROUTE_SCOPES[].primeVueSubRoutes`——登记前缀是**前缀语义**，子路由会被连带解析为 caomei-ui；不在批次范围内的子路由须显式登记并给出理由，守卫据此放行其「在册族零残留」判定，但**强制**其不得引用组件内择库型过渡组件或开启 `show-language-switcher`，且前缀下**其他**未登记的非 `index.vue` 页面会响亮失败。首个使用者为 `/admin/ai` → `pages/admin/ai/tasks/[id].vue`（B4 展示族 + 与未迁移共享组件），并**回溯登记**既有落差 `/admin/posts` → `pages/admin/posts/[id].vue`（编辑器路由）。
2. **门禁层首个「同路由第二对照面」**：新增 `ParityRoute.selectTab`（**2026-10-16 第三批次已泛化为 `activate`**，见后文窗口），`/admin/ai` 因此登记两条对照（默认「使用统计」页签 + 激活「任务记录」页签），使本批主要迁移面（任务列表）进入逐像素对照，而非只覆盖默认页签。
3. **首个「上游插槽缺失导致的结构性移动」处置**：caomei `DataTable` **无** `#header` 插槽（插槽面为 `cell-*` / `header-*` / `empty` / `groupheader` / `expansion`），迁移前位于表格容器内的刷新按钮改置于表格之上（保持「右对齐单个图标按钮」意图），差异登记于偏差处置表与下文「行为差异」。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/ai/index.vue` | `Tabs` / `TabList` / `Tab` / `TabPanels` / `TabPanel` → `CaomeiTabs` / `CaomeiTabList` / `CaomeiTabTrigger` / `CaomeiTabContent`（`v-model:value` → `v-model`；页签内 `pi pi-chart-bar` / `pi pi-list` → lucide `ChartColumn` / `List`）；`AdminAiTaskList` 增传 `:page`（受控分页）；`useAdminAiPage({ pageIndexBase: 1 })` | §6.1 C 组 / §6.2 / §5.5 |
| `components/admin/ai/task-list.vue` | `IconField` + `InputIcon` + `InputText` → `CaomeiInput` + `#prefix`；`Select` ×2 → `CaomeiSelect`（`@change` → `@update:model-value`）；批量删除按钮 `outlined` + `severity="danger"` → `variant="secondary"` + `tone="danger"` + `icon-only` + `:label`；`DataTable` + `<Column>` ×12 → `CaomeiDataTable` + `columns`（`data-key="id"` → `row-key="id"`；`selection-mode="multiple"` 内建首列）；`Avatar` → 共享壳过渡组件 `AppAvatarV2`（组件内按路由择库）；`Tag` ×4 → `CaomeiTag` + 页面本地 `severity → tone` 映射（`getAITaskStatusSeverity` / `getAIChargeStatusSeverity` 同时服务未迁移的详情组件，故不改共享 helper）；类型列 `pi pi-*` 动态图标 → lucide 组件映射（`getAITaskTypeIcon` 保留给未迁移消费方）；行内动作 `icon-only` + `:label`；**刷新按钮由 `#header` 插槽移到表格之上** | §6.1 / §6.2（执行提示 3）/ §5.5 |
| `components/admin/ai/stats-overview.vue` | `Tag` ×7 → `CaomeiTag`（`:value` → 默认插槽；`severity → tone`：`danger→danger`、`warn→warning`、`warning→warning`、`info→primary`、`secondary / contrast→neutral`）；本地 `getAlertTagSeverity` → `getAlertTagTone`（消除「返回 tone 却叫 severity」的误导） | §6.2 / §6.3 差异 #2 |
| `composables/use-admin-ai-page.ts` | 新增 `pageIndexBase?: 0 \| 1` 选项（与 `use-admin-list.ts` 同口径）并在 `onPage` 归一；导出 `page` 供受控 `:page` 使用 | §5.5（共享 composable 兼容两侧事件语义） |
| `lib/ui-library.ts` | `CaomeiUiRouteScope` 新增 `primeVueSubRoutes`；登记 `/admin/ai` 范围（`ownedFiles` 五个组件 + `inScopeComponents` = `Tabs` 族 + 子路由例外）；回溯登记 `/admin/posts` 的子路由例外 | §5.5 |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 新增 4 条子路由断言（未登记响亮失败 / 例外路径存在 / 例外页面不得含路由择库标记 / 每条须有理由） | §5.5 |
| `tests/helpers/caomei-component-stubs.ts`（原 `taxonomy-page-stubs.ts` 更名） | 桩集扩展为「迁移期组件桩」通用模块（唯一入口 `caomeiComponentStubs`）：新增 `CaomeiSelect` / `AppAvatarV2` 桩与 `variant` / `selectionMode` 契约位；消费方导入路径与常量名同步更名 | §8.2 |
| `components/admin/ai/task-list.test.ts`（新增） | 12 条契约用例：列定义逐列镜像 / 行多选与受控分页契约 / `Tag` 插槽与 `tone` 逐档 / 供应商 `outline` 变体 / lucide 图标 / `AppAvatarV2` / `icon-only` 可访问名 / 批量删除形态 / 刷新按钮位置（插槽缺失的显式断言）/ 筛选区形态 | §8.2 |
| `tests/visual/parity/routes.ts`、`parity-budget.json`、`reference/*.png` | 新增 2 个对照面（stats / tasks，各 2 主题 = 4 testName）与 `selectTab` 机制；参考态 4 张（迁移前 HEAD 就地采集，任务记录页签已激活）；允许清单按 stats 2 带 / tasks 1 带校准 | §8.2 |
| `tests/e2e/admin.e2e.test.ts` | 路由矩阵补 `/admin/ai`（13 → 14 行）；「AI 页」用例补「任务记录页签可激活并渲染 caomei 表格」断言，并用 `toPass` 重试「点击 → 断言」以规避水合竞态（单次点击在 SSR 首屏可见但未水合时会静默失效） | §8.2 |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

| 对照面 | light | dark | 归因（处置通道） |
| :--- | ---: | ---: | :--- |
| `admin-ai-stats`（默认「使用统计」页签） | 26951px（2 带：2072 + 24879） | 27788px（2127 + 25661） | ① 页签行：`Tabs` 族替换（页签高 / 内边距 / 指示条）；② 统计内容区：`Tag` → `CaomeiTag` 7 处（标签尺寸与语义色）+ 页签高度变化导致的**整体纵向位移**（卡片位置整体变化，是差异量级的主因） |
| `admin-ai-tasks-list`（激活「任务记录」页签） | 20419px（1 带） | 24039px（1 带） | 同一连通区域（筛选行 + 表格）：`CaomeiInput` / `CaomeiSelect` 字段外壳、`CaomeiDataTable` 表头与空态、刷新按钮由 `#header` 插槽移到表格之上的行位变化 |

参考态取自迁移前 HEAD（`--ref=HEAD` 就地采集）。两条对照的四带/单带求和均等于全图实测值（无带外像素、无余量）。

### 行为差异与处置

| 项 | 迁移前 | 迁移后 | 处置 |
| :--- | :--- | :--- | :--- |
| 刷新按钮位置 | PrimeVue `DataTable` 的 `#header` 插槽内（表格容器内右上角一行） | caomei `DataTable` **无 `#header` 插槽**，同一结构改置于表格之上 | 登记（偏差处置表 + 窗口）：保持「右对齐单个图标按钮」意图；契约用例显式断言「表格之上且唯一」，避免静默丢失入口 |
| 任务列表分页 | PrimeVue 0 基 `@page`，页面自持页码 | caomei 1 基 `@page`；`useAdminAiPage({ pageIndexBase: 1 })` 归一 + 受控 `:page` | 与 `useAdminList` 同口径；受控后同样失去「总条数收缩自动夹取页码」的内部收敛（观察项，与既有批次同型） |
| 标签页签切换 | PrimeVue `Tabs` | Reka Tabs（`activationMode: 'automatic'`） | 激活语义一致；E2E 增补「页签可激活并渲染表格」断言（含水合竞态重试） |
| 类型列图标 | `getAITaskTypeIcon` 返回 `pi pi-*` 字体类（共享 util） | 页面本地 lucide 组件映射（保留同一分支顺序） | 共享 util 不改（同时服务未迁移的 `task-detail-content.vue`），属图标随组件库迁移 |
| 详情弹窗内容 | `task-detail-content.vue` 的 `Button` / `Tag`（PrimeVue） | **本批不迁移**（与豁免子路由 `/admin/ai/tasks/[id]` 共享） | 延后到子路由（B4 展示族）批次；副作用是详情弹窗内容与弹窗本体同为 PrimeVue，无库间混排；已登记 backlog |

### 验证结果

- 结构性守卫：`tests/modules/ui-library-route-migration-guard.test.ts` **43 用例通过**（含 14 条范围条目扫描 + 4 条子路由例外断言）
- 契约用例：`components/admin/ai/task-list.test.ts` **12 条**（新增）；`composables/use-admin-ai-page.test.ts` **5 条**（含新增的 `pageIndexBase` 两条）；`stats-overview.test.ts` 既有用例保持通过
- 门禁层（截图）：`pnpm test:visual:parity` **30/30 通过**（26 既有 + 4 新增；新增 4 条未归因差异 0px）
- 基线层（截图）：`pnpm test:visual` **16/16 通过**（既有快照零变化）
- E2E：管理端 **6 用例通过**（含 14 行路由矩阵与 AI 页签断言，44.5s / 90s 预算）
- 质量门：`pnpm typecheck` 0 error；`pnpm lint` 0 error / 8 warning（无新增）；`pnpm lint:css` 通过
- 文档：`docs:check:*` 四项 + `lint-md` 通过

### 审计结论与修复（A 阶段）

两分区并发审计：**实现 / 事实源分区判 Pass（附条件）**、**测试 / 门禁 / 文档分区判 Reject（1 blocker + 6 warning）**。全部编号已闭环：

| 编号 | 结论要点 | 处置 |
| :--- | :--- | :--- |
| B1（文档，两分区同判） | 偏差处置表新增的 `Tabs` 族行被 ` || `粘进上一行，渲染后整行丢失（`lint-md` 不拦此类表格破形） | 拆为两行；用同一渲染器复验「处置表 `<tr>` = 22（含表头）」且 `Tabs` 行可见 |
| W2 / W3（测试强度） | ① `provider` / `status` / `chargeStatus` 仅断言 `tone` / `variant` 不断言**文本**（`:value` 误用会静默丢文案）；② 批量删除 / 刷新按钮的 `:label` 无断言；③ `pageIndexBase` 归一零断言（off-by-one 可静默） | 补：三格文本断言、两处 `data-label` 断言、未知类型图标兜底断言；`use-admin-ai-page.test.ts` 新增 2 条（1 基直取 / 缺省 0 基归一） |
| W3（实现分区，头像） | `Avatar` → `AppAvatarV2` 未传 `:email`：既无 `image` 也无 `email` 时组件会生成 **ui-avatars 远程头像**，替代迁移前的**首字母**回退（未登记观感变化 + 逐行外部请求） | 补 `:email="row.user_email"`（与 `/admin/users`、`/admin/subscribers` 同口径，回退走 gravatar）；组件内补注释说明该必传契约 |
| W4（实现分区，守卫边界） | 子路由「无混用」守卫为静态子串匹配，kebab / camel / 动态 `:is` / 再包一层可绕过，且不扫 import 子树 | 标记改为**归一化匹配**（去大小写与连字符）；在守卫注释中显式声明三条已知边界（动态择库、不扫子树、防回退而非替代人工核对），剩余缺口登记 backlog |
| W1（测试分区） | backlog 的子路由缺口条目未同步「已闭环」 | 改写为「该维度已闭环（`primeVueSubRoutes` + 4 条断言）；剩余缺口收窄为 `components/<prefix>/**` 子树未被标记扫描」 |
| W4 / W5 / W6（测试分区） | ① `caomeiTaxonomyStubs` 为死别名、「导出面收敛」措辞与实测不符；② backlog 参考态「后 4 张」过期；③ 批次拆分依据缺失 | 删除死别名并改写窗口措辞；参考态口径改为「30 张 = 22 + 4 + 4」；补本节与「提交拆分依据」小节 |
| S1 / S2 / S3 / S4 / S5 | `getAITaskTypeIcon` 未使用导入；子路由枚举的两处漏扫面（嵌套 `index.vue` / 裸 catch）；上游反馈缺锚点；`selectTab` 无重试；几何可更贴近迁移前 | 删除导入；枚举只豁免前缀根 `index.vue` 且只吞 ENOENT；上游反馈新增 §2.8 并在处置表引用；`selectTab` 改为「点击 → 断言 `aria-selected`」有界重试（与 E2E 的 `toPass` 同口径，4 条门禁复跑通过）；几何备选方案留作备查 |
| P1-W5（行尾归一） | `use-admin-ai-page.ts` 的 CRLF → LF 归一被静默并入本批（diff 由 20 行膨胀到 512 行） | 在提交信息中显式声明该行尾归一（净效果符合 `.editorconfig` 的 `end_of_line = lf`），不静默混入 |

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模超「单次 commit ≤10 文件 / 800 行新增」阈值，按「一个原子条目的分段产出」拆分提交（每笔 ≤10 文件；实测落库规模如下）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `bd5f2c36` `feat(migration)` | 实现 + 事实源（`task-list.vue` / `stats-overview.vue` / `pages/admin/ai/index.vue` / `lib/ui-library.ts` / `composables/use-admin-ai-page.ts`）+ 共享桩模块**更名**（内容改动留在第 2 笔） | 6 文件 / +630 / −474 |
| 2 | `test(migration)` | 契约用例（任务列表 12 条 + composable 2 条）+ 子路由例外守卫 4 条 + 共享桩扩展 + E2E 矩阵与页签断言 | 9 文件 / +658 / −258 |
| 3 | `test(visual)` | 门禁层两条对照面（`selectTab` 机制）+ 4 张迁移前参考态 + 预算校准 | 9 文件（含 4 张二进制） |
| 4 | 本笔 `docs(migration)` | 治理记录（回归窗口 / 第十次滚动归档 / §5.5 / 上游反馈 §2.8 / 偏差处置表 / backlog / todo / 基线 note 锚点改写） | 10 文件 |

**哈希口径**：本批 6 笔在推送前重写过一次**提交信息正文**（字面 `\n` 转义 → 真实换行；`git diff <重写前> <重写后>` 为空，内容零变化），表中为**重写后**哈希。

**规模口径说明**：① `lint-staged` 的 `git add` 会把当时未暂存的改动一并 stage，故按**实测落库**记录；②「行尾归一」类改动共两处（`composables/use-admin-ai-page.ts` 与 `composables/use-admin-ai-page.test.ts` 的 CRLF → LF，净效果符合 `.editorconfig` 的 `end_of_line = lf`）：第 1 笔（`use-admin-ai-page.ts`）已在提交信息显式声明；第 2 笔（`use-admin-ai-page.test.ts`）的归一未在提交信息单列（表现为整文件重写），**在此显式补登**，不以「看不出来」的方式静默混入。

### 未覆盖边界 / 观察项

- 门禁层参考态为**空任务列表**（种子数据无 AI 任务），故有数据行时的 `CaomeiTag` / `AppAvatarV2` / 行内按钮渲染差异不在截图覆盖内（由契约用例承接）。
- `/admin/ai` 的两条对照共用同一 URL，靠 `selectTab` 区分；若后续页签改名，两条对照与 E2E 断言需同步（角色名匹配为可访问名，非 class）。
- `selectTab` 为数据驱动（`routes.ts` 内的字符串），不引入函数式准备逻辑，保持「参考态采集与当前态比对使用同一段渲染代码」的门禁纪律。
- 子路由例外机制当前只静态检查「不得引用组件内择库型过渡组件 / 不得开启 `show-language-switcher`」；若后续出现新的路由择库型组件，需同步扩展 `ROUTE_PICKING_MARKERS`。

<!-- regression-window:end:phase68-b2-item3-ai:第六十八阶段-条目3-组件型目标第二批次:2026-10-16 -->

<!-- regression-window:start:phase68-b2-item3-taxonomy:第六十八阶段-条目3-首路由批次:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 3 首路由批次 B2 迁移（`/admin/categories` + `/admin/tags`）

### 范围

条目 3（B2 剩余数据页迁移二：组件型目标与 host 路由）的**首批**：路由自有实体组件 `components/admin/admin-taxonomy-page.vue` 随两个 host 路由（`/admin/categories` + `/admin/tags`）整体迁移，并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（第 12 / 13 项，共 13 项）。两页均为**薄包装页**（59 / 51 行，只有一行 `<AdminTaxonomyPage :config="…" />`），实体组件在册族用量 **39 处 / 18 个组件名** = **基准在册族 29 处 / 10 个组件名**（`Button` 11 / `Column` 7 / `InputText` 4 / `DataTable` 1 / `Badge` 1 / `IconField` 1 / `InputIcon` 1 / `Select` 1 / `Tag` 1 / `ToggleSwitch` 1，含路由自有子组件 `taxonomy-translation-association-card.vue` 的 `Button` 1）+ **路由级增量族 10 处 / 8 个组件名**（`Tabs` 族 5 / `InputGroup` 3 / `Checkbox` 1 / `Textarea` 1）。口径与复算：剥离注释后按守卫的标签边界规则计数（`tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单 + 本路由增量），可脚本复算。

**本批三项「首次」**：

1. **首个「路由级在册族增量」**：`Tabs` / `TabList` / `Tab` / `TabPanels` / `TabPanel` / `InputGroup` / `Checkbox` / `Textarea` 八族以 `CAOMEI_UI_ROUTE_SCOPES[].inScopeComponents` 按路由登记（用户 2026-10-16 裁定「全部纳入、整页迁移」）。主因是 `InputGroup` 与 `InputText` **结构耦合**——PrimeVue `InputGroup` 依赖子元素 `.p-inputtext` 做 flex 与圆角拼接，只迁输入框会静默破版；次因是「整路由迁移、不做半路由切换」。**不全局纳入的原因**：`Checkbox` / `Textarea` 在已收口批次页面中合法存在（实测 `pages/admin/submissions/index.vue` 命中两族），全局纳入会让完成路由被动回改。
2. **首个 `ownedFiles` 登记**：守卫扫描面从「页面文件」扩展到「薄包装页背后的路由自有实体文件」——只扫页面文件时，本路由的「在册族零残留」恒真、「至少使用一个 caomei-ui 组件」恒假，两条断言同时失效。
3. **首个「浮层内控件迁移」**：弹窗本体维持 PrimeVue `Dialog`（浮层豁免，随第六十九阶段），弹窗**内部**的 Tabs 族与表单控件已迁移。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `components/admin/admin-taxonomy-page.vue` | 在册族 39 处 → caomei：`DataTable` → `CaomeiDataTable` + 7 个 `<Column>` → `columns` computed（4~6 列，`parent.name` 用 `accessor` 承载；`style` / `class` 两侧镜像为 `headerStyle`/`bodyStyle`、`headerClass`/`bodyClass`；条件列 `parent` / `description` / 「翻译状态 ↔ 语言」按 `config` 与聚合开关决定）；`p-datatable-sm` 移除、受控 `:page="pagination.page"` + `pageIndexBase: 1`、`--caomei-data-table-pagination-justify: center`；`IconField`+`InputIcon`+`InputText` → `CaomeiInput`+`#prefix`（宽度按实测 261px 显式约束）；`ToggleSwitch` → `CaomeiSwitch`（`input-id` → `id`，原生 `label[for]` 保持）；`Tag value` → `CaomeiTag` 默认插槽；`Badge severity` → `:value` + `tone`；行内动作 `text rounded` 纯图标 → `icon-only`+`variant="ghost"`+lucide `#icon` 并补 `:label`；**弹窗内**：`Tabs` 族 → `CaomeiTabs`/`CaomeiTabList`/`CaomeiTabTrigger`/`CaomeiTabContent`、`InputGroup`+`InputText` 成组 → `CaomeiInputGroup`+`CaomeiInput`（`.p-invalid` → `:invalid`）、`Checkbox :binary` → `CaomeiCheckbox`、`Textarea cols` 移除、`Select filter show-clear` → `CaomeiAutoComplete strict dropdown`（空串回写 `null` 归一）；弹窗宽度显式声明 `min(90vw, 444px)`；名称字段焦点交接机制 | §6.1 / §6.2（执行提示 1~3）/ §6.3 差异 #1 / §5.5 |
| `components/admin/taxonomy-translation-association-card.vue` | `Button :label text size="small" severity="secondary"` → `CaomeiButton` + 默认插槽可见文案（`variant="ghost"` / `size="sm"` / `tone="neutral"`） | §6.2 执行提示 3 |
| `lib/ui-library.ts` | 基准在册族不变；新增 `CaomeiUiRouteScope` 接口、`CAOMEI_UI_ROUTE_SCOPES`（含 `ownedFiles` / `inScopeComponents`）与 `resolveInScopeComponents(scope)`；`CAOMEI_UI_ROUTE_PREFIXES` 改为**派生**（11 → 13 项，消除「前缀清单与范围登记两处维护」的漂移面） | §5.5 |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 守卫改为按范围条目扫描（页面文件 + `ownedFiles`，聚合判定「至少一个 caomei 组件」）；新增 8 条断言（前缀派生一致 / `ownedFiles` 存在性与 POSIX 形态 / 不存在的 `ownedFiles` 抛出并点名 / 薄包装页两态 / 基准在册族不含增量族 / 合并去重 / 同一 `ownedFiles` 的多条登记增量一致） | §5.5 |
| `tests/helpers/taxonomy-page-stubs.ts`（新增；**2026-10-16 更名为 `tests/helpers/caomei-component-stubs.ts`**，见后者批次的窗口） | 三个用例文件共用的 caomei 组件桩 + `config` 夹具（同一组件被三条用例渲染，三处各持一份会在后续批次静默漂移） | §8.2 |
| `components/admin/admin-taxonomy-page.test.ts`、`pages/admin/categories/index.test.ts`、`pages/admin/tags/index.test.ts` | 桩集改为共享模块并改用 caomei 契约断言；组件用例由 1 条扩到 **17 条**（列定义逐列镜像 / 聚合开关列切换 / `Tag` 插槽 / `Badge` tone 两态 / `Switch` id / Tabs 族与表单控件 / `AutoComplete strict` / `parentId` 归一 / icon-only `:label` / 页脚插槽 / 名称字段焦点交接） | §8.2 / §6.2 |
| `tests/visual/parity/routes.ts`、`tests/visual/parity-budget.json` | 新增两条路由（先入 `PENDING_ROUTES` 采集参考态，迁移后移入 `MIGRATED_ROUTES`）；4 个 testName 的允许清单按 **4 个非重叠功能带** 校准（声明值 = 实测值本身） | §8.2 |
| `tests/visual/parity/reference/*.reference.png`、`reference-manifest.json` | 新增 4 张参考态（`--ref=HEAD` 就地采集；**采集前临时回退路由登记**，确保参考态为纯 PrimeVue 原貌，避免「半迁移」的头部切换器进入参考态） | §8.2 |
| `tests/visual/admin-taxonomy-dialog.visual.test.ts`（新增）+ 2 张基线 | 补弹窗截图覆盖——门禁层参考态无数据行 → 弹窗不会打开，弹窗内的 Tabs 族 / 表单控件在门禁层**无截图覆盖**（本批登记的覆盖缺口，由此用例闭合） | §8.2 |
| `tests/e2e/admin.e2e.test.ts` | 原「should load admin categories and tags」单测**折入**路由矩阵（11 → 13 行，避免同一路由两次导航挤占预算），选择器 `.p-datatable` → `.caomei-data-table`，超时 60 → 90s（13 行隔离复跑实测 45.3s） | §8.2 |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

| 功能带（非重叠） | categories L / D | tags L / D | 归因（处置通道） |
| :--- | ---: | ---: | :--- |
| 头部语言切换器（160,80 200×80） | 863 / 878 | 863 / 878 | 路由登记后 `.content-language-switcher` 由 V1（PrimeVue `Select` 版）切到 V2，控件高 30.09px → 28px（§5.5 消费处静态择库，既有过渡组件差异） |
| 头部创建按钮（1240,80 160×80） | 985 / 1017 | 989 / 1019 | `CaomeiButton` 尺寸档：font 16 → 14px、圆角 6 → 8px、实测 114×36.39 → 102×36px（通道④ 上游反馈：库侧档位口径，本批不做） |
| 筛选行（80,200 1280×44） | 1455 / 1521 | 1436 / 1525 | 字段外壳行盒 36.39px → 36px（font 16 → 14px）+ `CaomeiSwitch` 高度 24 → 22px |
| 表格区（80,244 1280×240） | 5682 / 8104 | 5075 / 7503 | `DataTable` → `CaomeiDataTable`：表头行高 31.39 → 32.59px（font 16 → 14px、padding 8 → 12px、表头带底色）、空态行高 95.39 → 128.59px、分页器高度 56 → 44px |
| **全图实测** | **8985 / 11520** | **8363 / 10925** | 四带求和 = 全图实测值（无带外像素、无余量）；有效检出阈值 = 未归因差异 > 3000px 即红 |

参考态取自迁移前 HEAD（`--ref=HEAD` 就地采集）。弹窗本体不在门禁层截图内（参考态无数据行），其差异单列于下。

**弹窗（基线层覆盖）**：宽度由内容驱动 444px → 372px（caomei 字段宽度只由容器决定）——**已修复**，显式 `:style="{ width: 'min(90vw, 444px)' }"` 回到迁移前实测宽度（用属性而非 scoped 类：该浮层由 PrimeVue 组件渲染，类选择器与 scoped 作用域属性的落点依赖库内部结构）；弹窗内控件自身差异（页签 51.39 → 37.59px、复选框 20 → 18px、页脚按钮 82 → 74px、输入框 328 → 271px）由新增基线层用例接受。

### 行为差异与处置

| 项 | 迁移前 | 迁移后 | 处置 |
| :--- | :--- | :--- | :--- |
| 弹窗初始焦点 | 名称输入框（PrimeVue `Dialog.onAfterEnter` → `focus()` 命中默认插槽内的 `[autofocus]`） | 浮层 focus trap 回落到关闭按钮（caomei `CaomeiInput` 无 `autofocus` 契约，透传属性落在不可聚焦的字段外壳） | **已修复**：`@show` 置位 + 捕获浮层第一次 `focusin`（即 trap 落到关闭按钮那次）后把焦点交回当前语言页签的名称字段；实测 `document.activeElement === input#name_zh-CN` |
| 页签切换焦点 | 逐页签重挂载触发原生 `autofocus` → 焦点进入新页签名称字段 | 焦点留在触发器上（Reka Tabs 的标准 WAI-ARIA 行为） | 登记 backlog，随浮层批次（第六十九阶段）复核 |
| 父级下拉的筛选 | PrimeVue `Select` + `filter`（下拉内搜索） | `CaomeiAutoComplete` + `strict` + `dropdown`（输入即筛选，取值须来自选项） | 迁移方案 §6.3 **有意差异 #1**；空串回写 `null` 维持 `parentId: string \| null` 契约 |
| `v-model.trim` | 声明存在但不生效（PrimeVue 4.5.5 未实现 `modelModifiers`） | 同前（caomei 亦未实现） | 保留原声明以维持意图，不引入新行为（实测确认双方一致） |
| `required` / `Textarea cols` | `required` 打在原生输入上（无 `<form>` 提交路径，本无行为）；`cols` 在流体布局下不改变实际宽度 | 未迁移 | 明确不迁移，避免「属性落到字段外壳」的静默假象 |
| 受控分页 | PrimeVue 自持页码 | 受控 `:page="pagination.page"` + `pageIndexBase: 1` | 与既有 6 条已迁移路由同口径；受控后失去「总条数收缩自动夹取页码」的内部收敛（观察项） |

### 验证结果

- 结构性守卫：`tests/modules/ui-library-route-migration-guard.test.ts` **38 用例通过**（含 13 条范围条目逐条扫描；与 `resolveScopeFiles` 运行时校验重复的 1 条用例已在审计中移除）
- 单元测试：`pnpm test` **554 文件通过 / 1 skipped**；**4812 用例通过 / 1 skipped**
- 契约用例：`admin-taxonomy-page.test.ts` 17 条；`taxonomy-translation-association-card.test.ts` 4 条（真实子组件，审计 S-M1 补强）；`categories/index.test.ts` 8 条；`tags/index.test.ts` 7 条
- 门禁层（截图）：`pnpm test:visual:parity` **26/26 通过**（22 既有 + 4 新增；新增 4 条未归因差异 0px；两条新增路由按既定口径已移入 `MIGRATED_ROUTES`）
- 基线层（截图）：`pnpm test:visual` **16/16 通过**（14 既有 + 新增弹窗 2；既有快照零变化）
- E2E：管理端 **6 用例通过**（含 13 行路由矩阵，实测 44.7s / 90s 预算）；其中「分类搜索 + 聚合开关」用例新增**几何还原断言**（搜索字段 261px、分页器 `justify-content: center`），把此前只靠人工探针核对的「结构性还原」升级为门禁项
- 质量门：`pnpm typecheck` 0 error；`pnpm lint` 0 error / **8 warning**（7 既有 + 1 新增，见下）；`pnpm lint:css` 通过
- 文档：`docs:check:i18n` / `docs:check:line-count` / `docs:check:links`（247 文件）/ `docs:check:source-of-truth` 全通过

### 审计结论与修复（A 阶段）

两分区并发审计：**实现 / 事实源分区判 Pass（附 2 项强制条件）**、**测试 / 门禁 / 文档分区判 Reject（2 blocker + 3 warning）**。全部编号已闭环：

| 编号 | 结论要点 | 处置 |
| :--- | :--- | :--- |
| B1（文档） | 新增 5 行偏差条目被空行踢出「处置表」，渲染为字面竖线段落 | 删除截断空行；用同一渲染器（`markdown-it`）复验「无 `<p>\|` 段落」且新行位于同一 `<table>` 内 |
| B2（文档） | 「在册族 26 处」与自述口径矛盾（复算 = 39 = 基准 29 + 增量 10）；「884 行」与实测不符；「`#icon` 12 处」实为 10 处 | 三处数字按复算口径改写（并给出口径与复算方式） |
| W1（门禁登记） | 两条路由已迁移却仍登记在 `PENDING_ROUTES`（`migrated: false`），与 4 处文档表述矛盾 | 移入 `MIGRATED_ROUTES`；同步 `routes.ts` / 待迁移层用例头注释 / 偏差处置表 / backlog 的表述与张数 |
| W2（测试强度） | 5 类存活 mutant（可见文案、焦点交接身份、交接守卫、Tabs 双向、textarea rows） | 全部补断言：新增真实子组件用例（不桩化翻译关联卡片）+ 焦点 spy 记录 `id` + 二次 `focusin` 只交接一次 + 关闭复位 + `update:modelValue` 双向 + `rows="3"` |
| W3（文档） | 「较迁移前 +28」缺可比基准 | 改写为「较上一窗口记录值 4779 → 4812」 |
| W4 / S1（实现） | 派生机制收益表述过强（未声明「非薄包装页漏登记」仍是已知无守卫面）；两条登记逐字复制 | 注释补覆盖边界；抽出共用范围常量 `TAXONOMY_ROUTE_SCOPE` |
| S2 / S3 / S5（实现 / 测试） | 交接标记无关闭复位；`vertical-align` 缺来源；几何还原无门禁项 | `hideDialog` 复位标记 + 补开关断言；补由来注释；E2E 增两条几何断言；基线层弹窗用例增真实 DOM 焦点断言 |
| W2（实现分区） | 翻译徽标几何未按 `/admin/posts` 口径还原（`p-badge` 规则静默失效） | 补 `--caomei-badge-*` token 还原块（通道①），并在偏差处置表登记 |

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- **新增 lint warning**：`components/admin/admin-taxonomy-page.vue` 904 行 > `max-lines` 800（迁移前 732 行 → 迁移后 904 行）。增量来自 `#icon` 插槽 10 处（lucide 图标用法共 12 处）、焦点交接机制与依据注释；`pnpm lint --max-warnings 10` 仍通过（8/10），抽取方向（列定义 / 弹窗表单外置）登记 backlog（结构复用主线）。
- 弹窗在门禁层无覆盖（参考态无数据行 → 弹窗不打开），已由基线层新增用例补上；**门禁层的两条新路由仅覆盖「筛选行 + 空表 + 空态 + 分页器」**，列表有数据行时 `Tag` / `Badge` / 行内按钮的渲染差异不在截图覆盖内（由契约用例断言承接）。
- 幻影类 `hidden md:table-cell`（描述列）沿用 `/admin/posts` 批次口径：全仓无可命中表格单元格的规则，保留原声明并两侧镜像。
- `CAOMEI_UI_ROUTE_PREFIXES` 前缀语义连带子路由：`/admin/categories` + `/admin/tags` 无子路由，本批无新增落差；条目 3 后续批次登记 `/admin/ai` 时须显式处置 `/admin/ai/tasks/[id]`（用户 2026-10-16 裁定：维持 PrimeVue + 补结构守卫例外登记）。
- 用例增量对账：本批按 `it()` 可数增量 = +30（组件 +16 / 新增子组件用例 +4 / 守卫 +10），而窗口记录为「4779 → 4812」（+33）；两个记录数均为实测，差额 3 未闭环，登记为收尾对账项（不阻塞放行）。
- 环境观察：本机全量 `pnpm test:e2e`（含 firefox 项目与公开页 `networkidle` 依赖）在无外网/高负载下大面积超时失败，本批据既往口径**隔离管理端用例**执行（`--project=chromium tests/e2e/admin.e2e.test.ts`）；该口径与 [backlog](../../plan/backlog.md) 中「`networkidle` 依赖外网可达性」待跟踪项同源。

<!-- regression-window:end:phase68-b2-item3-taxonomy:第六十八阶段-条目3-首路由批次:2026-10-16 -->
