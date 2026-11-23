# 文档维护陷阱清单 (Documentation Maintenance Traps)

> 本文件是 [文档规范 §5.4](../../standards/documentation.md#54-规划与治理维护陷阱) 的逐项展开，承接「规划与治理文档维护陷阱」的事实记录。
> 规范正文只保留强制要求与本清单入口；新增陷阱先补本文件，再判断是否需要回写规范。

| 陷阱 | 结论 |
|:---|:---|
| `regression-window` marker | `docs/reports/regression/current.md` 的 marker 必须成对（`start` + `## 标题` + 正文 + `end`，且 marker 日期与标题日期一致）；只写 `start` 会让下一轮自动回填把新块插进 marker 与标题之间，导致分组错乱。marker 成对也可能出现「start 在顶部、正文在底部」的 LIFO 形态，检查不会报错；归档时须整块归位并保持 newest-first。 |
| 改 `roadmap.md` 连带翻译镜像 | `docs/i18n/{en-US,ja-JP,ko-KR,zh-TW}/plan/roadmap.md` 为 summary-sync tier，blocker 判据是「源文档自镜像 `last_sync` 起在 git 中有提交（**严格大于**日期）」；必须同一提交内更新镜像摘要并把 `last_sync` 提升到源提交日（同日不算 stale）。**提交前的 `docs:check:*` PASS 不能作为提交后证据。** |
| 规划文档口径混写 | 「实测值」与「门禁配额」不可混写（如把 `keyCss` 配额当成迁移前实测值写进增长对比，会使算式自相矛盾）；写数值对比前先回读同节表格的三列口径。 |
| 阈值类改动的同步点 | 改包体预算阈值时 `docs/standards/performance.md` 是第三处必同步点（与脚本 `BUDGETS`、基线 JSON 并列，规范中明写「三处同步」）；只改脚本 + 基线会被 Review Gate 判 blocker。 |
| 阶段范围口径 | 确认「本阶段还剩哪些待办」只以 `todo.md` / `roadmap.md` 为准：迁移方案等文档的「分批执行计划」是**跨阶段批次表**，不是本阶段 todo（roadmap 明写「本阶段不提前落盘其原子条目」），不能据此直接开工。 |
| 归档一致性 | 归档前确认 `docs/plan/archive/` 的 roadmap 分片与 todo-archive 分片覆盖区间匹配；压缩已完成阶段正文前必须先创建归档分片（可从 git HEAD 恢复原文），禁止未建分片直接丢弃阶段详情。 |
| 长文本替换 | 用「截断的 oldString」做替换会把原行残余拼成重复句；`lint-md` 与 i18n 检查都检测不到句内重复，替换后必须回读该行。 |
| 新增型路径也要查存在性 | 写「新增」文件前先 `git log --oneline -- <path>` / `git status` 确认该路径未被跟踪；改写既有测试必须先用 `git show HEAD:<path>` 取回原文，逐条核对覆盖面后再改写。 |
| `docs:check:links` 的锚点规则 | 锚点按「小写 + 去标点 / 符号 / 空白」宽松比较，且生成标题锚点时会**剥离行内代码**（反引号内容不进入锚点）；标题含反引号时，锚点只能写到代码之前，VitePress 实际 slug 会保留代码内容（`ignoreDeadLinks` 兜底）。 |
| 归档分片的相对链接深度 | 正文迁入 `docs/plan/archive/` 或 `docs/reports/regression/archive/` 后，原相对链接必须整体 +1 级（`../design/` → `../../design/`）；`archive` 已纳入 `docs:check:links` 扫描面，失效指针由门禁拦截，`pnpm docs:scan:archive-links` 仅用于快照复现与分类差量。 |
| 滚动归档残行与引用 | 整块迁出后必须检查孤立 `-->` 尾行（VitePress 会渲染成正文，`docs:check:markers` 兜底）与全仓「窗口节名 / 节名短语」引用；引用改写与窗口迁移一并执行。 |
| 新增文档门禁的扫描面 | 新写的文档检查必须显式包含 `archive`（`docs:check:markers` 已按此口径），否则归档产物长期处于门禁盲区；`lint-md` / line-count / links / i18n 四道检查都不校验注释完整性。 |
| 回归窗口的插入位置 | 新窗口必须插在**首个 `## YYYY-MM-DD` 标题之前**（newest-first，与 `scripts/shared/regression-window.mjs` 的定位规则一致）；手工把它贴在「同阶段父条目」旁边会让后续 `regression:weekly` 自动写入插到顶端，造成时间序错乱。 |
| 表格插入行被空行截断 | 处置表 / 台账类表格插入新行时，前置空行会把行踢出表格、渲染成字面竖线段落，且 `lint-md` 不拦截。改完用 `markdown-it` 复验两件事：① 不存在以竖线开头的段落（表格未被截断）；② **每行列数与表头一致**（单元格内裸竖线同样会吞列，只查前者会漏报）。 |
| 同一批次的数字改写 | 用例条数 / 组件处数 / 参考态张数等数字出现在多个文档与多节中时，必须**全仓 grep 同一名词**统一改写；只改正文会留下同文件其它节的旧值，审计按「可复算」直接判 blocker。 |
| 长文件的正则替换 | 对 `current.md` 这类长文件用 `re.sub(..., count=1)` 会命中**首个**匹配（往往是别的窗口），必须按窗口 / 小节边界切片后再替换。 |
| VitePress 的注释判据 | md 被当作 Vue SFC 编译，但**只有块级** `<!--`（行首起始，CommonMark HTML block type 2）延续到 EOF 才报 `Unexpected EOF in comment`；合法多行注释、正文中段的行内 `<!--`、缩进代码块与 fenced 内的 `<!--` 均无害。判据必须用 `markdown-it` + `@vue/compiler-dom` 实测校准，凭直觉写「同一行内必须闭合」会引入假阳性并阻断 `docs:build`。 |
| 新增文档门禁的接线 | 按层级接线，并在 `scripts/README.md` 声明所属层级：**构建期门禁**＝脚本 + `pnpm` 入口 + 构建链前置拦截（`docs:build` / `docs:dev` 或对应构建 workflow）+ PR 覆盖（`test.yml` 或文档构建 workflow）；**发布 / 周期级门禁**＝走 `release:check:full` / `regression:weekly` 等固定入口作等效接线（不强行塞进 `docs:build`，两者的预算与触发点不同）。任一形式都须在 `scripts/README.md` 声明层级与触发点，避免「脚本存在但仍靠人工补跑」。 |
| 数字的可复算性 | 审计会逐项复算派生比例（如闭环比、分支百分比、舍入口径）；无法从留存产物复算的派生数字宁可不写，改用「实际值 / 理论上限」的相对表述。行数声明一律取 `docs:check:line-count` 口径（= `wc -l` + 1），同一句内不得混用两套口径。 |
| 阈值口径要连「行数 + 条数」一起收 | 新增 / 改写阈值条款时，行数指向 `scripts/docs/check-line-count.mjs`，条数指向 `scripts/regression/run-periodic-regression.mjs` 的 `LOG_WINDOW_LIMITS.maxEntries`；只改行数会留下无门禁可校验的条数口径，形成同文件自相矛盾。 |
| 索引引用要用两种链接形态核对 | 判断「文档是否被索引」时，扩展名链接（`./x.md`）与省略扩展名链接（`./x`）都要匹配；只 grep 前者会把在役文档误判成无引用。 |
| untracked 文档与 `artifacts/` 引用 | `docs:check:links` / `markers` 走 `git ls-files`（新增 / 改名文档在 `git add` 前不参与扫描，提交后须复跑）；`line-count` 走固定目标清单，新增目标需显式登记。引用 `artifacts/` 产物路径必须用行内代码：写成链接时本地可通过、CI 与全新克隆会因 gitignore 失效。 |
| 回归窗口脚本的插入锚点 | `upsertRegressionWindowContent` 取「首个 managed `start` 与首个日期标题中更靠前者」（`resolveManagedInsertionIndex` 的 `Math.min`）；只用日期标题会落在既有 `start` 之后产生嵌套，改脚本前先补「连续两次 upsert / 重 upsert 不嵌套」的单测。 |
| 编辑历史 md 前先确认换行 | 对 CRLF 文件用脚本整文件写入会变成 LF 并产生全文件 diff；先 `file` 或用 git 确认换行，恢复后只保留语义行，规模审计才看得到真实改动。 |
| 终态数字与收口时点 | 阶段摘要里的数字不能沿用**条目收口时点**的值（如路由登记数在后续条目继续增长）；写摘要前回到事实源复算，并在归档改完后做最后一轮 line-count 回写（合并章节会改变总行数）。 |
