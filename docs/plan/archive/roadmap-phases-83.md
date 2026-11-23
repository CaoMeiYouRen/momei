# 第八十三阶段规划正文（规则面收口与文档/覆盖率滚动治理）

> 归档说明：本阶段已于 2026-11-24 审计归档，规划正文自 [项目路线图](../roadmap.md) 主窗口迁出；条目执行明细见 [待办事项归档](../todo-archive.md) 的第八十三阶段归档块，Review Gate 证据见 `artifacts/review-gate/2026-11-23-phase83-item1.md`、`2026-11-23-phase83-item2-docs.md`、`2026-11-23-phase83-item3.md`、`2026-11-23-phase83-item4.md` 与 `artifacts/review-gate/2026-11-23-phase83-close.md`。

## 规划正文

**时间表**: 2026-11-23 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 承接第八十二阶段的滚动治理节奏，收敛四类「已量化但仍有残留」的债务：`.vue` 非空断言 10 处清零并把规则面扩到 `.vue`（规则债 #10）、`documentation.md` / `planning.md` 回到候选行数健康线（文档治理 #6）、覆盖率第二十四批（同源 statements `+0.3pp`，#1）、字号归一第六批 A（口径内等值待替换 `28 → ≤17`，#11）。

**准入结论**: 用户于 2026-11-23 在候选页确认方案 A（4 条，全部为已在 backlog 登记「下一次可切片方向」的滚动治理项，无新增业务能力）。

**准入前置（已核对 2026-11-23）**: 第八十二阶段已审计归档（`15330f2f`），`todo.md` 无未勾选条目；`git status` 干净且与 `origin/master` 同步；open PR **0**、open issue **#262**（ESLint 规则分批跟踪，bot 创建，无新活动不重复评论）；CI 最新回执 Test `45105063136` / Pages `45105063094` / CodeQL `45105063296` / Docker `45105063077` / TODO-to-Issue `45105063075` 全 success；Daily Dependency Risk Audit `45090215721` 与 Security Auto Fix `45089586771` 均 success。基线：coverage **87.27%**（`34,642 / 39,694`，第八十二阶段收口口径，开工按最新 coverage-final 复算）、duplicate-code **0.32%**（38 clones / 561 行）、字号 452 声明 / token **241（53.32%）** / 口径内等值待替换 **28**、`.vue` `no-non-null-assertion` **10 处 / 3 文件**、`documentation.md` **363 行**（候选 error 线 320）、`planning.md` **395 行**（候选 warn 线 365）、`coreEntryJs` 291.64KB / 335KB、`keyCss` 60.21KB / 62KB。

**阶段容量与移出顺序**: 4 个大条目 / 12 个小条目（均在默认容量内）。顺序 `1 → 2 → 3 → 4`；若超时，按 `4 → 3 → 2` 移出——先移出字号归一与覆盖率，保留规则面收口与文档压缩。

**不做范围（阶段级）**: 不新增业务功能；不动认证 / 支付 / 多语言语种扩展；不升级大版本依赖；不重做设计体系、不扩 U1–U6 与暗色 tint；不处理非字阶 149 条字号；不启动千级命中 ESLint 规则（`explicit-function-return-type` / `prefer-nullish-coalescing`）；不为降指标放宽任何门禁阈值。

1. **`.vue` 非空断言清零与规则面收口（P2）**
    - **目标**: `.vue` 内 `no-non-null-assertion` 10 处 / 3 文件（`admin-taxonomy-page.vue` 4、`post-editor-media-settings.vue` 1、`app-captcha.vue` 5）清零，并新增 `NO_NON_NULL_ASSERTION_FILES` 常量供 `eslint.config.js` 与 `scripts/governance/eslint-debt-targets.mjs` 共用（配置面与计数面同源）、同步纳入 `.vue`，维持 `error`。
    - **优先级**: P2（长期主线 #10）。
    - **范围**: 3 个 `.vue` 文件；`eslint.config.js` 与 `scripts/governance/eslint-debt-targets.mjs` 的规则面常量；先改代表文件 + 定向验证，再批量。
    - **验收标准**: `governance:inventory:eslint-rules` 该规则 **0 命中 / 0 warning / 0 显式豁免**（计数面含 `.vue`）；`pnpm lint` 0 error 且无新增 `eslint-disable`；`pnpm typecheck` 通过；相关组件定向测试通过；issue #262 回写。回滚边界：规则面常量与代码改动同批回滚，避免「已纳入 error 但未清零」的中间态。
    - **不做什么**: 不放宽规则；不顺手重构非命中的组件逻辑；不用 `eslint-disable` 或 `as` 断言绕过；不把 `.vue` 模板表达式上的其它类型债混入本条目；本次不改 `PRODUCTION_TS_IGNORES`，`**/migration-*.ts` glob 收窄仍按 backlog #10 待跟踪处理。
    - **依赖**: 现有 `strictTsRuleOverrides` 结构；`governance:inventory:eslint-rules`（本机单跑约 3-5 分钟，必要时按目录分批）。
    - **交付物**: 代码 / 配置改动、inventory 产物、issue 回写、定向测试证据。
    - **风险**: `window.grecaptcha` / `container.value` 这类断言承担运行时存在性判断，替换为显式守卫可能改变无脚本 / 未挂载时的分支；必须保留原有降级路径并用定向测试锁定。

2. **文档规范压缩切片（P2）**
    - **目标**: `docs/standards/documentation.md` 363 行 → `≤320`（候选 error 线内；执行时按脚本口径复测起点为 362）、`docs/standards/planning.md` 395 行 → `≤365`（候选 warn 线内），只合并重复叙述与逐阶段历史，不降低规则强度。
    - **优先级**: P2（长期主线 #6）。
    - **范围**: 两个规范文件；可下沉的历史叙述改写为对 `docs/design/governance/` 的索引引用；同步核对被引用锚点。
    - **验收标准**: `node scripts/docs/check-line-count.mjs --profile=candidate` 对两文件 0 error / 0 warn；`lint-md` 通过；`docs:check:planning-docs`、`docs:check:source-of-truth`、`docs:check:i18n`、`docs:check:links` 通过；规则条目数量不减少（合并后保留原文语义）。回滚边界：两文件可独立 revert，不牵动 `todo.md` / `roadmap.md` 结构。
    - **不做什么**: 不删除仍生效的强制条款；不为压行数把规则搬到别处形成第二事实源；不改阈值脚本本身。
    - **依赖**: 候选 profile 行数门禁；`docs:check:links` 扫描面。
    - **交付物**: 两份规范改动、行数对比、门禁日志。
    - **风险**: 合并段落易丢锚点导致跨文档链接失效；压缩后需逐条比对「规则是否仍在正文可检索」，必要时保留索引行。

3. **覆盖率第二十四批（P2）**
    - **目标**: 同源 statements 至少 `+0.3pp`（约 119 条，同源分母 39,694），优先从剩余脚本池（`audit-comment-drift` / `check-duplicate-code` 等）与组件池选取 3 个模块。
    - **优先级**: P2（长期主线 #1）。
    - **范围**: 3 个模块；失败 / 边界断言优先；不改生产行为，必要时只做无行为变更的纯函数抽取。
    - **验收标准**: 三个模块**各自** statements `+15pp` 或 `≥85%`；同源 statements `+0.3pp`；干净全量 `pnpm test:coverage` 通过；定向测试通过；flaky 记录；证据落 `artifacts/coverage/` 与 `artifacts/review-gate/`。回滚边界：新增测试文件独立可删；生产侧仅无行为变更抽取，可单独 revert。
    - **不做什么**: 不追全量 90%；不测真实网络 / 浏览器 / 外部 API；不为凑数写低价值断言；不动 `admin-taxonomy-page.vue` 的组件拆分。
    - **依赖**: 最新 coverage-final；清 `.vitest-cache` + `--maxWorkers=4` 的干净跑口径。
    - **交付物**: 测试文件、coverage baseline / exit、定向测试证据。
    - **风险**: 分母随新增源码文件变化；0-test 套件与异步 flake 会污染判定；先复算再选模块，必要时换模块。

4. **字号归一第六批 A（P3）**
    - **目标**: 按 `governance:inventory:font-sizes` 处理口径内等值待替换 `28` 条中的 `≥11` 条（单批 ≤10 文件），`28 → ≤17`。
    - **优先级**: P3（长期主线 #11）。
    - **范围**: 等值字面量 → `var(--m-font-size-*)`；单批 ≤10 文件；单文件命中数少，按文件聚合后取最大值优先。
    - **验收标准**: 口径内等值待替换下降 `≥11` 条；逐元素 `getComputedStyle` 0 差异；`test:visual` 32/32、parity 未归因差异 0；`pnpm lint:css` 0 error。回滚边界：按文件独立 revert，token 定义与 inventory 脚本不动。
    - **不做什么**: 不改非字阶 149 条；不按现值批量替换；不改暗色 tint；不扩 U1–U6。
    - **依赖**: inventory 复算；parity 参考态。
    - **交付物**: token 替换、inventory 复算、对账与截图证据。
    - **风险**: 参考态覆盖不足时登记偏差表；单文件视觉回归立即回退。

**回滚边界（阶段级）**:

- 条目 1：规则面常量与代码同批回滚；不得只回滚代码留下已扩面规则。
- 条目 2：两份规范各自独立 revert，规划文档结构与门禁脚本不动。
- 条目 3：新增测试文件独立可删；生产侧仅无行为变更抽取。
- 条目 4：按文件独立 revert；`--m-font-size-*` 定义与 inventory 脚本不动。

**风险提示**: ① 覆盖率受 flake 影响，以干净全量跑 + CI 为最终裁决；② 文档压缩可能触发跨文档锚点失效，`docs:check:links` 必须同批复核；③ `.vue` 断言替换涉及运行时存在性判断，须用定向测试锁定降级分支；④ 字号批次依赖 parity 参考态，本机数据态差异按既有偏差处置表登记、不得写 allowlist 掩盖；⑤ 本阶段无新增依赖、无迁移类改动，回滚成本低。
