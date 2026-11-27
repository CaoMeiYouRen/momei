## 第八十六阶段：质量、依赖、移动与性能四线收口（已审计归档）

> 本文件为立项规划原文，归档时仅改状态与补实际结束时间；结论见 [roadmap 主文档](../roadmap.md#第八十六阶段质量依赖移动与性能四线收口已审计归档) 与 [todo-archive](../todo-archive.md)。

**时间表**: 2026-11-26 ~ 2026-11-27（规划原文，实际于 2026-11-27 收口）

**目标**: 在第八十五阶段移动体验收口后，用四条可量化主线巩固工程基座：质量滚动治理（覆盖率 / 静态规则 / 结构复用 / 非字阶字号）、依赖与合并治理（major 升级门禁 + merge queue 可行性 + 依赖台账）、移动端残差收尾（骨架屏基线 / 评论表单 / 触控兜底第二批）、性能与包体（CWV 基线节奏 + 包体余量）。四条线都以现有门禁为判定依据，不新增业务功能、不放宽阈值。

**准入结论**: 用户于 2026-11-26 指令「A+B+C+D」全量纳入（对应候选 A 质量滚动治理 / B 依赖与合并治理 / C 移动端收尾 / D 性能与包体）。准入前置已复核：第八十五阶段已审计归档；`todo.md` 无进行中阶段；open PR 0；open issue 仅 #262（ESLint 批次母单，由 86.1.2 承接）；master CI 最新 Test 成功；`security:audit-deps` Pass（6 条豁免均未过期）；干净全量 coverage 基线 **87.92%**、duplicate-code **0.31%**、字号 token 274（59.96%）、`keyCss` 60.01KB / 62KB（余量 3.2%）。2026-11-26 `git fetch` 后 HEAD `ba943ca3` 与 `@{u}` 同步；无 in-flight major PR；工作区干净（规划 Step 8 清洁检查通过）。

**候选评分**（4 维矩阵 = 准入；双轴 = 排序；用户已确认全部四线）:

| 候选 | Value | Alignment | Difficulty | Risk | Score | 双轴 | 结论 |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- | :--- |
| A 质量滚动治理 | 4 | 4 | 3 | 2 | **1.60** | 5 / 3 → 排期 | 纳入 86.1 |
| B 依赖与合并治理 | 4 | 5 | 4 | 4 | **1.125** | 4 / 3 → 排期 | 确认档（用户特批，Alignment 4→5）；纳入 86.2 |
| C 移动端收尾 | 3 | 4 | 2 | 2 | **1.75** | 3 / 2 → 延后 | Score>1.5 直接准入，用户指定；纳入 86.3 |
| D 性能与包体 | 4 | 4 | 3 | 2 | **1.60** | 3 / 2 → 延后 | Score>1.5 直接准入，用户指定；纳入 86.4 |

> 双轴快照（2026-11-26）：A 重要 5 / 紧急 3 / 建议 排期；B 重要 4 / 紧急 3 / 建议 排期；C 重要 3 / 紧急 2 / 建议 延后；D 重要 3 / 紧急 2 / 建议 延后。象限只决定顺序，不构成启动授权；四线均由用户指令纳入阶段。

**阶段容量与执行顺序**: 名义容量 4 个大条目 / 12 个小条目（默认容量 4–6）；启动顺序 `86.1 → 86.2 → 86.3 → 86.4`，P1 小条目优先。若超时按「先移出次级保留（86.3.3 → 86.1.4 → 86.4.2 视实测取舍）→ 再移出 86.2.2」；硬收益集为 86.1.1 / 86.1.2 / 86.2.1 / 86.2.3 / 86.3.1 / 86.4.1 六项，次级保留为 86.1.3 / 86.1.4 / 86.3.2 / 86.3.3 / 86.4.2 五项；86.2.2 为第三档（外部依赖，最后移出）。P1 优先级服从硬收益判定。

**不做范围（阶段级）**: 不新增业务功能（会员 / 播客 / AI 视频不上收）；不改路由 / API 契约；不升级 major 依赖（只加门禁与验证）；不放宽任何阈值或允许清单；不重做设计体系；不把 merge queue 强推到未验证的生产配置。

1. **质量滚动治理（P1）**
    - **目标**: 覆盖率第二十六批、静态规则债第七批、认证页结构复用、非字阶字号评估四条线各自可量化收口。
    - **优先级**: P1（覆盖率与规则债）、P2（复用与字号）。
    - **范围**: `packages/mcp-server/src/tools/**`、`plugins/*-analytics.client.ts`、`components/admin/settings/{setting-audit-log-list,admin-notification-settings,theme-preview-section}.vue`、`eslint.config.js`、`pages/login.vue` / `register.vue` / 认证组件、字号 inventory 命中文件。
    - **验收标准**:
        - 86.1.1：三组模块 statements 均 ≥80%（mcp tools 0% / analytics 8–57% / admin 设置组件 14–22%），同源 statements **≥88.4%**（+0.5pp），干净全量 coverage EXIT 0。
        - 86.1.2：默认承接 backlog 指定的下一候选 `no-unnecessary-type-conversion`（41 命中 / 26 文件），命中清零并在生产 TS 升 `error`；inventory 0 命中 / 0 豁免 / effectiveSeverity 2，issue #262 回写。**Kill-switch**: 若开工复测 >60 命中或必须 `any` / `ts-ignore` 逃逸 → 按目录分批（单批 ≤40 命中）并登记余量；`no-unsafe-assignment`（230）与 `no-unsafe-member-access`（288）继续按目录分桶，不在本批一次清零。
        - 86.1.3：认证页共享骨架落地，duplicate-code **≤0.25%** 且无新增 clone；登录 / 注册单测 + E2E 全绿，视觉 32/32、parity 不低于 82/83。**Kill-switch**: 若验证码 / 社交登录 / 记住我 / 校验行为分叉 >3 处，只抽卡片壳与样式，不抽表单逻辑。
        - 86.1.4：非字阶 149 条完成分组评估，token 化 ≥40 条（token 覆盖率 ≥65%），视觉 32/32、parity 无新增失败。**Kill-switch**: 任一分组导致 parity 新增失败 >2000px 或 >2 条用例，即停止该组并转为评估记录，不强行替换。
    - **不做什么**: 不为覆盖率写低价值铺量断言；不为规则清零加 `ts-ignore` / `any`；不合并跨包同形不同源代码；不按现值批量替换字号。
    - **依赖**: 85 阶段视觉 / E2E 基线；`governance:inventory:*`、`duplicate-code:check`。
    - **交付物**: 测试与重构改动、inventory / coverage 证据、规则回写、字号评估报告。
    - **风险**: 组件测试 stub 成本；规则命中可能超预算；认证页多行为分叉；字号替换影响 parity。

2. **依赖与合并治理（P2，确认档）**
    - **目标**: 阻止 major 升级静默自动合并；验证 merge queue 是否适用于本仓；保持依赖台账与安全门禁可复核。
    - **优先级**: P2（用户指定纳入）。
    - **范围**: `.github/mergify.yml`、`.github/dependabot.yml`、新增 major 检测脚本 / workflow、`docs/design/governance/2026-10-12-mergify-merge-queue-adoption-evaluation.md`。
    - **验收标准**:
        - 86.2.1：major 版本升级不再命中自动合并（标签 / 条件 + 检测脚本单测通过）；minor / patch 自动合并保持现状；文档写明回滚方式。**Kill-switch**: 检测脚本误伤（把 minor / patch 判为 major）>1 次即回退为「仅标签告警 + 人工合并」，不阻断正常依赖 PR；Dependabot 触发 token 只读时，标签改为维护者按需手工添加，其余依赖 PR 恢复自动合并。
        - 86.2.2：在测试仓库完成 merge queue 6 项验证并出结论（采用 / 不采用 / 分步）；未完成验证时不得修改生产 `merge_method`。**Kill-switch**: 无法访问测试仓库或套餐不覆盖时，只落 86.2.1 与评估报告；queue 退回需重新登记 backlog（含双轴评分与本次验证结论），不得直接复用已归档编号。
        - 86.2.3：依赖台账与安全门禁复核：6 条 `dependency-risk-allowlist` 的 `reviewBy` 均在期内，`security:audit-deps` 与 `security:alerts` 通过并留证据；Dependabot open 状态与 major PR 盘点写入报告。
    - **不做什么**: 不升级任何 major 依赖；不改分支保护策略；不用 GitHub 原生 merge queue 替代（无 batch / `conflict_resolvers`）。
    - **依赖**: 用户提供的测试仓库 / 套餐权限；`.github` 配置变更需 CI 预检。
    - **交付物**: 配置 / workflow / 脚本、验证报告、回滚说明。
    - **风险**: Mergify 条件误伤正常依赖 PR；merge queue 行为与 rebase 语义冲突。

3. **移动端收尾（P2，确认档）**
    - **目标**: 关闭 85 阶段遗留的骨架屏基线、评论表单 16px 与触控兜底第二批。
    - **优先级**: P2（用户指定纳入）。
    - **范围**: `pages/posts/[id].vue` 评论入口、`components/comment-form.vue`、`components/post-toc-drawer.vue`、公开页交互样式、移动视觉层。
    - **验收标准**:
        - 86.3.1：骨架屏独立基线落地（组件级冻结 pending 或测试专用挂载），移动视觉用例数由 26 增至 ≥27（1 个新用例 × 2 主题）并通过，且不向生产路由注入延迟端点。
        - 86.3.2：评论框及剩余公开表单输入字号 ≥16px、`autocomplete` / `enterkeyhint` 补齐；定向 E2E 在 chromium / firefox / webkit 通过；移动基线无回归。
        - 86.3.3：公开页第二批触控审计 ≥20 个可点击元素 ≥44×44（行内文字链按 24px 最小命中宽度登记理由），至少 2 条 hover-only 交互有可见替代并由 E2E 覆盖。
    - **不做什么**: 不改评论提交协议；不重做评论 UI；不为通过审计放大行内文字链破坏排版。
    - **依赖**: 85 移动视觉层与 E2E 辅助。
    - **交付物**: 基线、样式 / 组件改动、E2E、审计清单。
    - **风险**: 骨架屏 pending 冻结稳定性；评论框字号影响密度；触控放大影响卡片布局。

4. **性能与包体（P2）**
    - **目标**: 建立可复跑的 CWV 基线并接入周期回归；评估包体余量并至少收敛一项可归因的体积。
    - **优先级**: P2（用户指定纳入）。
    - **范围**: `scripts/perf/cwv-baseline.mjs`、`.lighthouseci/**`、`.github/perf/bundle-baseline.json`、`regression-weekly.yml`、CSS / 构建入口。
    - **验收标准**:
        - 86.4.1：对齐 [性能规范 §3.3](../../standards/performance.md) 与现有 `test:perf:cwv`：首页 / 文章详情 / 分类 / 标签 / 归档 **5 条路由**产出 LCP / CLS / TBT 基线 JSON 与报告，接入 `regression:weekly` warning 面；连续两次运行波动 ≤10%（或记录环境差异）。**范围说明**: 第五十二阶段已完成一次性移动 CWV 评估，本条增量是「CI 可复跑 + weekly 接入」；移动形态与 INP 作为扩展评估项，若脚本无 INP 代理指标则如实记录「未覆盖」，不伪造指标、不改 performance.md 口径。
        - 86.4.2：`keyCss` / `coreEntryJs` / `maxAsyncChunkJs` 现状与 top 贡献者报告（字段：现状值 / top 贡献者 / 尝试的削减项 / gzip 差值 / 失败原因）；至少完成一项 ≥2KB gzip 的可归因瘦身，或按上述字段给出「不瘦身」实测依据；`test:perf:budget:strict` 通过且不放宽预算。
    - **不做什么**: 不放宽 bundle budget；不为 Lighthouse 分数做无归因改动；不升级 major 依赖换取分数。
    - **依赖**: 本机 / CI Lighthouse 可用；生产构建产物。
    - **交付物**: CWV 基线、报告、包体对比、回归接入。
    - **风险**: CWV 环境波动；CSS 瘦身可能影响视觉 parity。

**验证矩阵（阶段级）**:

| 层级 | 命令 / 检查 | 适用条目 |
| :--- | :--- | :--- |
| V0 | `pnpm lint`、`pnpm lint:css`、`pnpm typecheck`、`pnpm lint:md` | 全部 |
| V1 | 定向 `pnpm exec vitest run <相关测试>`；`pnpm governance:inventory:eslint-rules` / `governance:inventory:font-sizes` / `duplicate-code:check` | 1 / 2 / 3 |
| V2 | `pnpm test:visual`（32）+ `pnpm test:visual:mobile`（26+）+ `pnpm test:visual:parity`（82/83） | 1.3 / 1.4 / 3 |
| V3 | 定向 E2E：认证页、评论表单、移动触控（chromium / firefox / webkit） | 1.3 / 3 |
| V4 | 干净全量 `pnpm test:coverage` | 1.1 |
| V5 | `pnpm test:perf:budget:strict`、`pnpm test:perf:cwv` | 4 |
| RG | `docs:check:{planning-docs,line-count,links,i18n,markers,source-of-truth}`、证据落 `artifacts/review-gate/2026-11-26-phase86-item*-*.md` | 全部 |

**回滚边界（阶段级）**:

- 86.1：测试文件按模块独立 revert；ESLint 规则与配置同批 revert 并回写 issue #262；认证页重构按组件 / 页面文件 revert；字号按分组提交独立 revert。
- 86.2：Mergify / dependabot / workflow / 脚本独立 revert，恢复原自动合并规则；merge queue 仅文档时无代码回滚。
- 86.3：骨架屏测试 / 基线、评论表单、触控样式分别 revert；移动基线重采后随改动回退。
- 86.4：CWV 脚本 / 报告 / 回归接入独立 revert；包体瘦身按 CSS 文件回退，预算文件不得回退放宽。
- 阶段回滚时先回退最后一条，保持 `todo.md` 与归档记录一致。

**风险提示**: ① 规则命中可能超出单批预算，按 kill-switch 先按目录切片；② major 检测依赖 PR 标题 / 标签，需单测覆盖并避免误伤；③ merge queue 验证依赖外部仓库，未验证前不动生产；④ 字号与触控改动必须双向快照对账；⑤ CWV 受网络 / 运行环境影响，以 CI 与基线波动区间为准。

