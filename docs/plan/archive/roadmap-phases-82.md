# 第八十二阶段规划正文（质量滚动治理与债务收敛）

> 归档说明：本阶段已于 2026-11-23 审计归档，规划正文自 [项目路线图](../roadmap.md) 主窗口迁出；条目执行明细见 [待办事项归档](../todo-archive.md) 的第八十二阶段归档块，Review Gate 证据见 `artifacts/review-gate/2026-11-22-phase82-item{1..4}.md` 与 `artifacts/review-gate/2026-11-23-phase82-close.md`。

## 规划正文

**时间表**: 2026-11-22 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 承接第八十一阶段的滚动治理节奏，继续收敛四类可量化债务：覆盖率第二十三批（同源 statements `+0.3pp`）、字号归一第五批（口径内等值待替换 `65 → ≤35`）、静态规则债第五批（`no-non-null-assertion` 24 处清零并升 `error`）、结构复用切片（重复率 `0.38% → ≤0.35%`）。

**准入结论**: 用户于 2026-11-22 在候选页确认方案 A（4 条，ROI 均值 `1.75`）：覆盖率 `1.75` / 字号第五批 `2.00` / 静态规则债第五批 `1.75` / 结构复用 `1.50`。

**准入前置（已核对 2026-11-22）**: 第八十一阶段已审计归档，`todo.md` 无未勾选条目；`git status` 干净且与 `origin/master` 同步；open PR **0**、open issue **#262**（ESLint 规则分批跟踪，无新活动不重复评论）；CI 最新回执 Test `44992764492` / Pages `44992764573` / CodeQL `44992763777` / Docker `44992764514` 全 success，Weekly Regression `44847021795` success（cron 周五 12:00 UTC，下次计划 2026-11-27）。基线：coverage **86.69%**（第八十一阶段收口口径 `34,068 / 39,299`，开工按最新 coverage-final 复算）、duplicate-code **0.38%**（44 clones / 656 行，2026-11-22 复算）、字号 452 声明 / token **204（45.13%）** / 口径内等值待替换 **65**、`no-non-null-assertion` **24 处 / 14 文件**（2026-11-21 inventory，当前 effective `warn`）、`coreEntryJs` 287.20KB / 335KB、`keyCss` 60.01KB / 62KB。

**阶段容量与移出顺序**: 4 个大条目 / 13 个小条目（均在默认容量内）。顺序 `1 → 2 → 3 → 4`；若超时，按 `4 → 2` 移出——先移出结构复用与字号归一，保留覆盖率与静态规则。

**执行进展（2026-11-22）**: 条目 1 已闭环——`inventory-font-sizes.mjs` 53 → 1 未覆盖（99.28%）、`api-client.ts` 62 → 2（98.18%）、`use-post-editor-page.helpers.ts` 69 → 2（98.05%）；干净全量跑 `6,111` 例通过 / 1 skipped，同源 statements **34,368 → 34,585 / 39,624 = 87.28%（+217 条 / +0.55pp）**，其中三模块 +179、`packages/api-client` 委托端点 +28、`0-installation` +11、`use-post-editor-voice` −1。条目 3 已闭环——生产 TS `no-non-null-assertion` 26 处 / 15 文件清零并升 `error`（inventory 计数面 24 处 / 14 文件，差额 2 处 / 1 文件位于 `**/migration-*.ts` 既有豁免面），inventory 现为 0 命中 / 0 warning / 0 豁免 / `effectiveSeverity 2`；`.vue` 余 10 处 / 3 文件另立批次。定向 18 个测试文件 158 例通过（含 `tag` 17 例、`archive` 2 例、`calendar` 4 例与新增 `apply-decorators` 4 例；Round 1 的 `EntityMetadataNotFoundError` 由属性装饰器分派缺陷导致，已修复清零）。条目 2 已闭环——24 文件 37 处等值字面量改为 `var(--m-font-size-*)`（分 3 批提交），口径内等值待替换 **65 → 28**、token 化 204 → **241（53.32%）**；14 组（7 路由 × 明暗）逐元素 `getComputedStyle` 对账 **2,984 元素 font-size / line-height 0 差异**，`pnpm lint:css` 0 error、`test:visual` 32/32、parity **82/83**（唯一失败 `user-settings-dark` 在回退本批改动后复现同一 3199px 头像区域差异，属本机 TEST_MODE 数据态，CI 为最终裁决）。条目 4 已闭环——三组同源重构（设置字段归一 / ActivityPub actor 上下文 / AI 文本端点工厂），重复率 **0.38% → 0.32%**（44 → 38 clones、656 → 561 行），`duplicate-code:check:strict` Pass；定向 8 文件 43 例通过。第八十二阶段 4 条条目全部闭环。

**不做范围（阶段级）**: 不新增业务功能；不动认证 / 支付 / 多语言语种扩展；不升级大版本依赖；不重做设计体系、不扩 U1–U6 与暗色 tint；不拆 `admin-taxonomy-page.vue`（另案评估）；不为降指标放宽任何门禁阈值。

1. **覆盖率第二十三批（P2）**
    - **目标**: 同源 statements 至少 `+0.3pp`（约 118 条，同源分母 39,299），优先 `scripts/governance/inventory-font-sizes.mjs`（53/140 未覆盖）、`composables/use-post-editor-page.helpers.ts`（69/103）、`packages/cli/src/api-client.ts`（62/110；2026-11-22 复算 `artifacts/coverage/2026-11-21-phase81-item2/coverage-final.json`，开工时按最新 coverage-final 复核）。
    - **优先级**: P2（长期主线 #1）。
    - **范围**: 3 个模块；失败 / 边界分支优先；新增或扩充测试；不改生产行为，必要时只做不改变行为的纯函数抽取。
    - **验收标准**: 三个模块**各自** statements `+15pp` 或 `≥85%`；同源 statements `+0.3pp`（约 118 条）；干净全量 `pnpm test:coverage` 通过；定向测试通过；flaky 记录；证据落 `artifacts/coverage/` 与 `artifacts/review-gate/`。回滚边界：新增测试文件独立可删，生产文件仅做无行为变更的抽取且可单独 revert。
    - **不做什么**: 不追全量 90%；不测真实网络 / 浏览器 / 外部 API；不为凑数写低价值断言；不动 `admin-taxonomy-page.vue`。
    - **依赖**: 最新 coverage-final；清 `.vitest-cache` + `--maxWorkers=4` 的干净跑口径。
    - **交付物**: 测试文件、coverage baseline / exit、定向测试证据。
    - **风险**: coverage 分母变化、0-test 套件、异步 flake；先复算再选模块，必要时换模块。

2. **字号归一第五批（P3）**
    - **目标**: 按 `governance:inventory:font-sizes` 处理口径内等值待替换 `65` 条中的 `≥30` 条（单批 ≤10 文件），优先 admin 路由面与非 admin 残留文件。
    - **优先级**: P3（长期主线 #11）。
    - **范围**: 等值字面量 → `var(--m-font-size-*)`；单批 ≤10 文件；需要 tour 的页面按「启动 tour 后截图」取证。
    - **验收标准**: 口径内等值待替换下降 `≥30` 条；逐元素 `getComputedStyle` 0 差异；`test:visual` 32/32、parity 83/83 未归因差异 0；`pnpm lint:css` 0 error。回滚边界：按文件独立 revert，token 定义不动。
    - **不做什么**: 不改非字阶取值（149 条 off-scale）；不按现值批量替换；不改暗色 tint；不扩 U1–U6；不动 `admin-taxonomy-page.vue`。
    - **依赖**: inventory 复算；parity 参考态；tour 截图环境（如需）。
    - **交付物**: token 替换、inventory 复算、对账 / 截图证据。
    - **风险**: 参考态覆盖不足时登记偏差表；单文件视觉回归立即回退。

3. **静态规则债第五批（P2）**
    - **目标**: `no-non-null-assertion` 24 处 / 14 文件（2026-11-21 inventory 口径，开工复算）清零并升 `error`；同步 inventory / debt / issue #262。
    - **优先级**: P2（长期主线 #10）。
    - **范围**: 24 处 / 14 文件；按 ≤7 文件 / 提交拆为 2 个批量小条目；先改 1 个代表文件 + 定向测试，再批量；保留必要的类型收窄语义，改为显式判断而非删断言。
    - **验收标准**: inventory 该规则 0 命中 / 0 warning / 0 显式豁免；`pnpm lint` 0 error、warning ≤10；定向测试与 `typecheck` 通过；issue #262 回写。回滚边界：规则配置与代码改动按文件回退，升 `error` 与清零需同批回滚。
    - **不做什么**: 不动千级命中项（`explicit-function-return-type` / `prefer-nullish-coalescing`）；不放宽规则；不新增 `eslint-disable`。
    - **依赖**: `governance:inventory:eslint-rules`（timeout budget 10m，必要时按目录分批跑）。
    - **交付物**: 代码 / 配置改动、inventory 产物、issue 回写。
    - **风险**: 非空断言多承担类型窄化，替换为显式判断可能引入运行时分支差异；逐文件定向测试，风险高的文件保留并登记原因。

4. **结构复用切片（P2）**
    - **目标**: duplicate-code `0.38%`（44 clones / 656 行，2026-11-22 复算）收敛到 `≤0.35%`，处理 2-3 组「同源而非同形」的热点。
    - **优先级**: P2（长期主线 #2）。
    - **范围**: 2-3 组重复收敛；优先 `scripts/` 与 `composables/` 的纯函数 / 输出装配重复；不改变公共 API 语义。
    - **验收标准**: jscpd 报告实测重复率 `≤0.35%`（以报告数值为准，不以 strict 通过代替）且 `pnpm duplicate-code:check:strict` 通过；定向测试与 `typecheck` 通过；无行为变化；本期不收紧 baseline，是否收紧在阶段收口评估。回滚边界：每组独立 revert，抽取产物可单独删除。
    - **不做什么**: 不为降指标强行抽象；不动 test fixtures；不合并仅外形相似的领域逻辑。
    - **依赖**: jscpd 报告（2026-11-22 基线）；结构复用口径。
    - **交付物**: 抽取 / 收敛改动、复算报告、证据。
    - **风险**: 抽象过度导致耦合；每组先论证同源，不达标则只登记不动手。

**回滚边界（阶段级）**:

- 条目 1：新增测试文件独立可删；生产侧仅无行为变更抽取，可单独 revert。
- 条目 2：按文件独立 revert；`--m-font-size-*` 定义与 inventory 脚本不动。
- 条目 3：规则配置与代码改动同批回滚，避免留下「已升 error 但未清零」的中间态。
- 条目 4：每组抽取独立 revert，回归达标线不随单组回退而放宽。

**风险提示**: ① 覆盖率受 flake 影响，以干净全量跑 + CI 为最终裁决；② 字号批次依赖 parity 参考态，本机数据态差异需按既有偏差处置表登记、不得写 allowlist 掩盖；③ 静态规则替换可能暴露真实类型缺口，逐文件定向测试；④ 结构复用以「同源」为前提，禁止把相似外形强行抽成共享层；⑤ 本阶段无新增依赖、无迁移类改动，回滚成本低。
