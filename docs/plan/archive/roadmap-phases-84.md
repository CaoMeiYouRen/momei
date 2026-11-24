# 第八十四阶段 · 治理收尾与规则面/运行时缺陷收敛（归档分片）

> 本文件为第八十四阶段完整规划正文的深度归档；主窗口只保留摘要表与归档结论。

## 第八十四阶段：治理收尾与规则面/运行时缺陷收敛（已审计归档）

**时间表**: 2026-11-24 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 在第八十三阶段完成「规则面收口 + 文档压缩 + 覆盖率 + 字号」四类滚动治理后，继续收口剩余债务并处理两项高风险项：字号口径内等值清零并修掉 inventory 计数盲区（#11/#9）、文档候选 profile 清零（#6）、结构复用回到 0.32% 基线（#2）、覆盖率第二十五批（#1）、`no-unsafe-argument` 清零 + `PRODUCTION_TS_IGNORES` 收窄（#10）、i18n ALS 注入失效缺陷（#5，设计先行）。

**准入结论**: 用户于 2026-11-24 在候选页选择「A+B+C 全量纳入」，6 条组合并为一个阶段（默认容量 4–6，无需 7–8 档说明）。ROI 均值 **1.75**：字号 2.67 / 文档 2.00 / 结构复用 1.75 / 覆盖率 1.60 / 静态规则 1.33 / i18n ALS 1.14。其中 84.5（1.33）与 84.6（1.14）落在 [规划规范 §3.3](../../standards/planning.md#33-准入基准-decision-rules) 的「1.0 < Score ≤ 1.5」区间，按用户确认纳入，并在条目内标注确认档与 kill-switch。

**准入前置（已核对 2026-11-24）**: 第八十三阶段已审计归档（`c7d72abb`、`3520dcbf`），`todo.md` 无未勾选条目；`git status` 干净且与 `origin/master` 同步；open PR **0**（无待合并依赖 PR，亦无 in-flight 自动合并 / major 升级）、open issue **#262**（ESLint 分批跟踪，无新活动不重复评论）；CI 回执 `3520dcbf` 的 Test / CodeQL / Docker / Pages / TODO-to-Issue 全 success。基线：coverage **87.58%**（`34,768 / 39,697`）、duplicate-code **0.33%**（39 clones / 577 行，基线 0.32%）、字号 452 声明 / token **253（55.97%）** / 口径内等值待替换 **16**、`docs/guide/deploy.md` **274 行**（候选 warn 255 / error 280）、`no-unsafe-argument` **50 命中 / 23 文件**（`governance:inventory:eslint-rules` 最近一次产物 2026-11-22，开工复算）、`coreEntryJs` / `keyCss` 仍按 phase-close 记录。

**阶段容量与移出顺序**: 6 个大条目 / 19 个小条目。小条目超建议 15 项的原因：84.5 拆 4 项是为让 kill-switch 独立判定并满足「≤7 文件 / 提交」分批复核；84.1 / 84.4 各 3 项是为对齐「脚本或基线 → 实现 → 对账」的原子提交链；范围未新增，仅提交粒度拆分，故不拆阶段。顺序 `84.1 → 84.2 → 84.3 → 84.4 → 84.5 → 84.6`（84.1 先行是为让 inventory 计数面先对齐，避免后续覆盖率 / 文档批次沿用带盲区基线；其余按 ROI 由高到低）。若超时，按 `84.6 → 84.5 → 84.4 → 84.3` 移出——先移出扩散面最大的运行时缺陷、规则债与需高覆盖比例的批次，保留字号与文档两项低风险快收益。

**不做范围（阶段级）**: 不新增业务功能；不动认证 / 支付 / 多语言语种扩展；不升级大版本依赖；不重做设计体系；不处理非字阶字号（eval 报告另案）；不启动千级命中 ESLint 规则（`explicit-function-return-type` / `prefer-nullish-coalescing`）；不为降指标放宽任何门禁阈值。

1. **字号归一第六批 B 与 inventory 盲区修复（P3）**
    - **目标**: 口径内等值待替换 **16 → 0**（`styles/main.scss` 2 处按用途甄别，字阶定义不得改）；同批修复 `inventory-font-sizes.mjs` 的 `stripComments` 盲区（Vue 属性 `accept="image/*"` 会吞到下一个 `*/`），修后先按「token +4 / scale +1」对账再替换。
    - **优先级**: P3（长期主线 #11 + 脚本治理 #9）。
    - **范围**: `components/**`、`pages/**`、`styles/_mixins.scss`、`styles/_admin-form.scss`、`styles/main.scss`（用途甄别）；inventory 脚本的注释屏蔽逻辑与其单测。
    - **验收标准**: `governance:inventory:font-sizes` 的 `scaleDeclarationCount = 0`；盲区 3 文件声明重新计入且与预期增量一致；逐元素 `getComputedStyle` 0 差异（8 路由 × 明暗）；`test:visual` 32/32；parity 除既有 `user-settings-dark` 外无新增失败；`pnpm lint:css` 0 error。回滚边界：按文件独立 revert；脚本改动可单独 revert（须同时回退基线对账说明）。
    - **不做什么**: 不改非字阶 149 条；不按现值批量替换；不改暗色 tint；不扩 U1–U6；不修 `styles/main.scss` 的字阶声明本身。
    - **依赖**: 无。
    - **交付物**: 脚本与单测改动、inventory 前后对比、token 替换、对账与截图证据、backlog #9/#11 回填。
    - **风险**: 盲区修复会让基线一次性上跳，若不先对账会把「补记」误判为回归；`styles/main.scss` 的 2 处需按上下文判断是 usage 还是定义。

2. **文档 deploy 压缩（P2）**
    - **目标**: `docs/guide/deploy.md` 274 行 → `≤255`（候选 warn 线内），只合并重复叙述与下沉细节，不删除生效的部署步骤、平台差异与排障入口。
    - **优先级**: P2（长期主线 #6）。
    - **范围**: `docs/guide/deploy.md`；细节下沉到 `docs/design/` 专项或平台文档并回链；同步受影响的四语镜像。
    - **验收标准**: `node scripts/docs/check-line-count.mjs --profile=candidate` 0 error / 0 warn（全仓）；`lint-md` / `docs:check:links` / `docs:check:i18n` / `docs:check:source-of-truth` / `docs:check:markers` 通过；镜像 `last_sync` 提升到改动日。回滚边界：文档可独立 revert，不牵动规划文档结构。
    - **不做什么**: 不删除部署路径与平台差异说明；不为压行数把内容搬到第二事实源；不改阈值脚本。
    - **依赖**: 候选 profile 行数门禁；`docs:check:links` 扫描面。
    - **交付物**: 文档改动、行数对比、门禁日志。
    - **风险**: 压缩易丢锚点，跨文档引用需同批复核。

3. **结构复用切片（P2）**
    - **目标**: duplicate-code `0.33%`（39 clones / 577 行，2026-11-24 复算）收敛到 `≤0.32%` 基线，处理 1–2 组「同源而非同形」热点。
    - **优先级**: P2（长期主线 #2）。
    - **范围**: 优先 `login.vue` ↔ `register.vue` 认证页骨架（需独立设计与 E2E 回归）、`post-distribution-button.vue` 与 composable 的返回面，或本次新增测试引入的重复；不改变公共 API 语义。
    - **验收标准**: jscpd 报告实测 `≤0.32%` 且 `pnpm duplicate-code:check:strict` 通过；定向测试与 `typecheck` 通过；无行为变化；基线是否收紧给出明确结论。回滚边界：每组独立 revert，抽取产物可单独删除。
    - **不做什么**: 不为降指标强行抽象；不动 test fixtures；不合并仅外形相似的领域逻辑。
    - **依赖**: 2026-11-24 jscpd 基线。
    - **交付物**: 收敛改动、复算报告、backlog #2 回填。
    - **风险**: 抽象过度导致耦合；每组先论证同源，不达标只登记不动手。

4. **覆盖率第二十五批（P2）**
    - **目标**: 同源 statements 至少 `+0.3pp`（约 119 条，同源分母 39,697）：`composables/use-tts-volcengine-direct.ts`（229/310，81 未覆盖）、`packages/cli/src/wordpress-parser.ts`（60/116，56 未覆盖）、`scripts/governance/count-primevue-usage.mjs`（214/263，49 未覆盖），三模块合计 186 条未覆盖，需覆盖约 64%。
    - **优先级**: P2（长期主线 #1）。
    - **范围**: 3 个模块；失败 / 边界断言优先；不改生产行为，必要时只做无行为变更的纯函数抽取。
    - **验收标准**: 三模块各自 `≥85%`（模块级过程指标），**且三模块合计 ≥119 条同源 statements（≈ +0.3pp）为阶段门禁**——按当前底座，各取 85% 仅 +84 条（+0.212pp），故需 C 模块约 92% 或按 plan B 追加模块；干净全量 `pnpm test:coverage` 通过；定向测试通过；flaky 记录；证据落 `artifacts/coverage/` 与 `artifacts/review-gate/`。回滚边界：新增测试文件独立可删；生产侧仅无行为变更抽取。
    - **不做什么**: 不追全量 90%；不测真实网络 / 浏览器 / 外部 API；不为凑数写低价值断言。
    - **依赖**: 最新 coverage-final；清 `.vitest-cache` + `--maxWorkers=4` 的干净跑口径。
    - **交付物**: 测试文件、coverage baseline / exit、定向测试证据。
    - **风险**: 三模块需高比例覆盖才达标，若 <64% 按 plan B 追加模块并在证据中说明。

5. **静态规则债第六批（P2，确认档 ROI 1.33）**
    - **目标**: `@typescript-eslint/no-unsafe-argument` 命中（50 / 23 文件，inventory 产物 2026-11-22，开工复算）清零并升 `error`；同批把 `PRODUCTION_TS_IGNORES` 的 `**/migration-*.ts` 收窄为真实迁移路径，并清理收窄带出的新增命中。
    - **优先级**: P2（长期主线 #10）。确认档：Score 1.33 落在「1.0–1.5」，按用户确认纳入。纳入理由：`PRODUCTION_TS_IGNORES` 让 4 个生产模块长期逃逸 typed 检查，与本批 `no-unsafe-argument` 清零同源；拆开处理会留下「规则面已扩、命中未清零」的中间态。
    - **范围**: 命中文件（按 ≤7 文件 / 提交拆批）；`eslint.config.js` 与 `scripts/governance/eslint-debt-targets.mjs` 的常量；收窄后共享该常量的其余规则新增命中。
    - **验收标准**: inventory 该规则 **0 命中 / 0 warning / 0 显式豁免**；收窄后共享常量的其余规则无未清理的新增 error；`pnpm lint` 0 error、`typecheck` 通过；定向测试通过；issue #262 回写。回滚边界：规则配置 / 常量与代码改动同批回滚，避免「已扩面未清零」中间态。**Kill-switch**：若收窄后新增 error > 20 处且无法在本条目内收敛，则回退 glob 收窄、仅保留 `no-unsafe-argument` 清零，并把收窄登记回 backlog #10。
    - **不做什么**: 不动千级命中项；不放宽规则；不新增 `eslint-disable`；不借机扩大 typed 规则作用域到 tests / scripts。
    - **依赖**: `governance:inventory:eslint-rules`（分批跑，单次 ≤10m）。
    - **交付物**: 代码 / 配置改动、inventory 产物、issue 回写、收窄评估结论。
    - **风险**: typed 规则在 `.vue` 与部分文件无类型信息，需先评估作用域；glob 收窄会扩大规则面到 4 个生产模块，可能暴露真实类型缺口。

6. **i18n ALS 缺陷修复（P2，确认档 ROI 1.14，设计先行）**
    - **目标**: 修复 `server/middleware/i18n.ts` 中 `i18nStorage.run(appLocale, () => {})` 上下文在 `run()` 返回即销毁、导致 `server/utils/i18n.ts` 的 `getLocale()` 恒走 `AUTH_DEFAULT_LOCALE` 回退的既有缺陷（2026-11-21 审计发现）。
    - **优先级**: P2（长期主线 #5）。确认档：Score 1.14 落在「1.0–1.5」，按用户确认纳入。纳入理由：`getLocale()` 恒回退 `AUTH_DEFAULT_LOCALE` 是已实锤的运行时行为缺陷（不是设计偏好），修法面集中在单个中间件且可用定向测试锁定；继续搁置会让服务端语言解析长期失真。
    - **范围**: 中间件与 `server/utils/i18n.ts`；先完成设计评估（handler 链包裹 / 删除 ALS 与误导注释 / 保持现状仅修文档三案比较），再按选定方案实现。
    - **验收标准**: 设计文档落 `docs/design/governance/2026-11-24-i18n-als-locale-resolution.md` 并登记治理索引；`getLocale()` 在 SSR 请求内返回请求真实 locale（定向单测 + 至少一条 server 侧集成断言）；`pnpm lint` / `typecheck` / `i18n:audit:missing` 与相关 server 测试通过。回滚边界：实现改动单提交 revert；设计文档保留。**Kill-switch**：若评估判定需改动 >3 个中间件或多处调用链，或回归面不可控，则本阶段只落设计结论并把实现退回 backlog #5。
    - **不做什么**: 不改 locale 解析的产品语义（回退顺序、默认语言）；不借机重写 i18n 模块；不为修 ALS 引入全局可变状态。
    - **依赖**: 无（设计先行）。
    - **交付物**: 设计文档、代码改动、测试、backlog #5 回填。
    - **风险**: 影响全站服务端 locale 解析；需先证明「当前恒回退」与「修复后按请求语言」的行为差异有测试锁定。

**回滚边界（阶段级）**:

- 条目 1：按文件 revert；脚本与基线对账说明同批回退。
- 条目 2：文档独立 revert，不牵动规划结构。
- 条目 3：每组抽取独立 revert。
- 条目 4：新增测试文件独立可删，生产侧仅无行为变更抽取。
- 条目 5：规则 / 常量与代码同批回滚；kill-switch 触发时只回退收窄。
- 条目 6：实现单提交 revert；设计文档与 backlog 记录保留。

**风险提示**: ① 覆盖率与 E2E 受本机负载与 flake 影响，以干净全量跑 + CI 为最终裁决；② inventory 盲区修复会让基线一次性上跳，必须先对账；③ `PRODUCTION_TS_IGNORES` 收窄会扩大规则面，kill-switch 优先于硬凑；④ ALS 修复属运行时行为变更，设计评估不过关即退回；⑤ 结构复用以「同源」为前提；⑥ 本阶段无新增依赖、无迁移类改动，回滚成本低。
