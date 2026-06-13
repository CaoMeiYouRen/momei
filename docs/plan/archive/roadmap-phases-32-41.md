
# 路线图深度归档 — 第三十二至第四十一阶段

> 本文档从 docs/plan/roadmap.md 按 [归档治理规则](./index.md) 区间分片迁入。
> 主文档仅保留阶段摘要与索引入口，完整正文见本文件。

---

### 第三十二阶段：多语言内容资产化承接入口与高风险治理推进 (Multilingual Content Assetization Intake & High-Risk Governance Advancement) (已审计归档)

**时间表**: 2026-05-01 ~ 2026-05-02（提前闭合）
**目标**: 在第三十一阶段完成商业化转型重评与多条治理主线收口后，把"多语言内容资产化增强包"的统一承接入口正式上收为下一阶段唯一新增能力，同时继续推进测试覆盖率与有效性治理、重复代码与纯函数复用、ESLint / 类型债治理，以及 Postgres 查询 / CPU / 连接生命周期平衡治理四条高风险优化主线，保持"1 个新功能 + 4 个优化"的受控组合。

**审计结论**: 第三十二阶段五条正式主线 + 一条 Postgres 派生切片（AITask stale compensation）已于 2026-05-01 / 2026-05-02 全部闭合并归档至 [todo-archive.md](./todo-archive.md)。统一承接入口已落地独立说明 / 申请页、单一主卖点文案、三条公开入口导流接入与候补名单最小闭环；coverage 已从 `76.03% / 76.08%` 继续抬升，`pages/login.vue` 达 statements 100% / branches 84.44%，`80%+` 冲刺目标顺延至下一阶段；重复代码基线降为 `32 clones / 697 duplicated lines / 0.59%`；ESLint `no-explicit-any` 窄切片已覆盖 `composables/use-post-editor-voice.ts` / `server/api/categories/index.get.ts`；Postgres 已完成 `/api/search` 匿名缓存与 AITask stale scan 最小字段集收紧。`存量代码注释治理与注释漂移收敛` 继续保留为 backlog 备用项。

**准入结论**: 五条正式主线均已具备明确执行范围、非目标、验收标准与最小验证矩阵，满足规划规范对下一阶段正式上收的要求。新增功能只保留"统一承接入口"一项，并明确先完成独立说明 / 申请页与真实 CTA，不进入支付、会员中心或营销后台实现；测试覆盖率把 `80%+` 降为冲刺目标而非关闭线；重复代码、ESLint 与 Postgres 三条优化继续保持窄切片，避免重新膨胀为全仓治理。`存量代码注释治理与注释漂移收敛` 仅保留为备用项，继续留在 backlog，只有当前五项容量允许时才可额外补入单组切片。

**执行约束**: 本阶段仍遵守"先范围、后实现；先设计、后扩面"的口径。统一承接入口因涉及新页面入口、跨入口 CTA 与商业化承接边界，进入实现前必须先补齐 `docs/design/governance/` 下的专项设计文档；覆盖率治理不得退化为单纯追求 `80%` 数值的铺量工程；重复代码与 ESLint 治理必须保持单切片策略；Postgres 治理只能选择一组请求入口或一组公开热点读链路，不扩写为全站性能重构。

**ROI 评估**: 多语言内容资产化增强包的统一承接入口 `1.60`；测试覆盖率与有效性治理 `1.67`；重复代码与纯函数复用 `1.60`；ESLint / 类型债治理 `1.50`；Postgres 查询、CPU 与连接生命周期平衡治理 `1.57`。其中统一承接入口与测试覆盖率治理为本轮优先上收项；重复代码、ESLint 与 Postgres 三条优化均属于 backlog 长期主线的受控切片延续。

1. **主线：多语言内容资产化增强包的统一承接入口 (P1)**:
    - **执行范围**: 以独立说明 / 申请页作为唯一事实源，收敛“多语言内容资产化增强包”的主卖点、免费核心与付费增强边界，并从 GitHub README、Demo Banner、About 页或等价公开入口接入至少一条真实 CTA，形成“入口 -> 承接页 -> 申请 / 试用 / 候补名单”的最小闭环。
    - **非目标**: 不直接实现支付、价格页、会员中心、营销自动化后台，不把本轮扩写为完整销售站点改版，也不把现有免费能力简单加锁伪装成付费增强包。
    - **验收标准**: 已补齐专项设计文档，明确首版只做独立说明 / 申请页与真实 CTA；已形成单一主卖点文案，并明确免费核心与付费增强边界；至少有一条公开入口完成导流接入，且页面包含可验证的申请 / 试用 / 候补名单动作。
    - **验证与证据**: 至少完成受影响页面与 CTA 跳转的定向测试或浏览器验证，并将专项设计文档、页面入口与转化动作说明回链到阶段回归记录。

2. **主线：测试覆盖率与有效性治理 (P0)**:
    - **执行范围**: 在当前 `76.03% / 76.08%` 基线上继续提升覆盖率，并优先锁定统一承接入口、公开页 runtime、认证配置退化、共享组件 raw key 暴露，以及公开热点读链路等高风险行为断言。
    - **非目标**: 不把本轮写成全仓 coverage 冲 `80%+` 的铺量工程；`80%+` 仅作为冲刺目标，不作为阶段关闭线；不接受只有 snapshot、缺少失败断言或与高风险链路无关的低价值补测。
    - **验收标准**: 全仓 coverage 基线继续提升且不低于当前水位；至少补齐一组与新承接入口或高风险运行时链路直接相关的失败断言，并明确新增覆盖命中的真实风险、未覆盖边界与 `80%+` 冲刺仍缺的关键模块。
    - **验证与证据**: 至少补跑定向 Vitest、`pnpm i18n:verify:runtime`、`pnpm test:coverage` 与 `pnpm exec nuxt typecheck`，并把 coverage 增量与未覆盖边界回写到活动回归窗口。

3. **主线：重复代码与纯函数复用收敛 (P1)**:
    - **执行范围**: 只处理公共页模板片段与列表型查询 helper 两组高收益重复区，优先收敛 CTA 卡片 / 公共说明块、查询参数归一化、列表读模型组装与分页 helper 的重复实现。
    - **非目标**: 不做跨目录大重构，不把复用治理扩写为通用 UI 框架改造，也不为了压重复率引入难以维护的过度抽象。
    - **验收标准**: 每组切片都必须给出原始重复点、拟抽象边界、收益、潜在过度泛化风险与回滚方式；至少保住重复代码基线不反弹，并说明哪些重复区继续留给下一轮。
    - **验证与证据**: 至少完成受影响公共页与查询 helper 的定向测试 / 类型验证，并在阶段回归记录中补充重复代码基线与剩余热点清单。

4. **主线：ESLint / 类型债治理 (P1)**:
    - **执行范围**: 本轮只允许继续上收单规则窄切片，优先在单文件或双文件范围内推进 `@typescript-eslint/no-explicit-any` 或 `@typescript-eslint/no-non-null-assertion` 的下一组高 ROI 命中点，并同步处理受影响文件的类型债。
    - **非目标**: 不开启第二条并行规则治理，不扩写到 `no-unsafe-*`、全仓 `any` 清零或大规模目录级样式迁移，也不借机清理与本轮目标无关的 warning。
    - **验收标准**: 在进入实现前已明确候选规则、命中清单、影响文件、预期收益、回滚方式与最小验证矩阵；目标切片清理完成后，未外溢到非目标目录，且目录级或定向 ESLint / typecheck 可以稳定通过。
    - **验证与证据**: 至少完成目标文件或目标目录的 ESLint 校验、窄范围类型检查与必要单测，并把残余债务与下一轮候选切片记录到回归窗口或专项治理文档。

5. **主线：Postgres 查询、CPU 与连接生命周期平衡治理 (P0)**:
    - **执行范围**: 本轮只从“一组请求入口”或“一组公开热点读链路”中二选一推进，优先候选为 `0b-db-ready` / 安装态检查 / 匿名鉴权等请求级入口，或 `posts / archive / categories / tags / settings / friend-links` 中的一组公开热点读链路。
    - **非目标**: 不把本轮扩写为全站性能重构，不同时并行推进请求入口与热点读链路两大方向，也不把 CPU / 连接问题泛化为所有数据库访问都要重写。
    - **验收标准**: 已明确当前切片属于哪一组入口或哪一组热点读链路，并给出最小字段集、短 TTL、请求去重或数据库唤醒边界中的至少一组收敛方案；阶段结论需能说明查询次数、结果集体量或连接活跃窗口存在可追溯下降趋势。
    - **验证与证据**: 至少补齐受影响请求入口或热点读链路的定向测试，并通过 `pg_stat_statements`、运行期样本或等价 live sample 记录本轮量化对比结果。

**备用项说明**: `存量代码注释治理与注释漂移收敛` 继续保留在 backlog，不作为第三十二阶段正式主线。仅当前五项执行容量允许、且已明确只做 backlog 中候选组 A / B / C 的单组切片时，才允许以后补任务方式追加，不得在阶段启动时直接与五条正式主线并列上收。

### 第三十三阶段：创作者统计与质量冲刺 (Creator Statistics & Quality Sprint) (已审计归档)

**时间表**: 2026-05-03（当日闭合）
**目标**: 在第三十二阶段完成多语言资产化承接入口与高风险治理收口后，以"创作者数据统计增强"作为唯一新增能力，配合 coverage `80%+` 冲刺、ESLint `composables` 子桶继续收紧、重复代码认证页模板收敛，以及存量代码注释治理候选组 B 四条优化主线，保持"1 个新功能 + 4 个优化"的受控组合。本轮同时把两条距上次上收最久的治理线（注释治理 P30、ESLint `composables` P31）正式补上。

**审计结论**: 第三十三阶段五条主线已在实现代码、定向测试、设计文档、i18n 翻译、lint/typecheck 与 duplicate-code 基线中完成闭环，满足归档条件。创作者数据统计已落地 `GET /api/admin/creator-stats` + 后台「创作者统计」Tab；覆盖率从 `~76%` 推进至 Lines 75.8% / Statements 75.67%（新增 38 条定向测试，`80%+` 冲刺顺延）；ESLint 完成两轮 `no-explicit-any` 窄切片（7 文件收口）；重复代码三轮收敛累计消除 2 clones / 106 dup lines（基线降至 `31/575/0.48%`）；注释治理完成 `upload.ts` + `post-access.ts` 两条安全敏感链路补强。Playwright E2E 配置同步优化（workers 2→4、video `retain-on-failure`、browser args 精简）。

**准入结论**: 新功能来自 backlog 短期候选池 #12（创作者数据统计增强），四条优化均来自长期主线。新功能进入实现前必须先冻结首版指标集合、权限口径与归因来源——这三项结论以 `docs/design/governance/` 下专项设计文档形式冻结，未完成前不得进入代码实现。重复代码与 ESLint 继续保持窄切片策略；注释治理本轮只允许从候选组 B 中选 `1-2` 组高复杂度链路，不扩写为全仓注释重写工程。Postgres 本轮不上收——上轮刚完成 `/api/search` + AITask 两条切片，本轮让数据库面观察一轮。

**执行约束**: 新功能必须复用 `post_view_hourly`、`pvCache` 与既有评论 / 分发记录作为数据源，不另起埋点体系；Coverage 以 `>= 78%` 为阶段收口线、`80%+` 为冲刺目标，不接受低价值铺量测试；ESLint 继续锁定 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 子桶，不并行开启新规则；注释治理只做候选组 B 中的 `upload.ts` + `post-access.ts` 两条高复杂度链路，同步清理失效旧注释。

**ROI 评估**: 创作者数据统计增强 `1.55`；测试覆盖率冲刺 80%+ `1.83`；ESLint `composables` 子桶继续收紧 `1.50`；重复代码认证页模板收敛 `1.40`；存量代码注释治理候选组 B `1.33`。其中覆盖率冲刺为 P0 主线，其余四项为 P1 主线。

1. **主线：创作者数据统计增强 (P1)**:
    - **前置工作**: 进入代码实现前，必须先在 `docs/design/governance/` 下冻结三项结论：① 首版指标集合（必做 vs 延后观察），② 权限与口径边界（`admin` 全站 / `author` 本人、翻译簇去重、时区 / 草稿 / 私密过滤），③ 与现有内容洞察的关系（新增 API 但复用 `post_view_hourly`、`pvCache`、评论 / 分发记录作为数据源）。
    - **执行范围**: 后台 `/admin` 增加「创作者统计」tab 或专区，提供发文趋势图（按周 / 月）与分发效果概览卡片（WechatSync 成功率、远程仓库同步成功率）。新增 `GET /api/admin/creator-stats`（支持 `?range=7d|30d|90d` 和 `?authorId=` 过滤），前端复用现有图表和卡片基础设施，不引入新图表库。
    - **非目标**: 不扩写为全站 BI 系统，不做来源渠道归因（UTM / referrer），不做订阅转化漏斗，不新增埋点基础设施。
    - **验收标准**: 专项设计文档已冻结首版指标集合与权限口径；后台至少展示发文趋势图与分发效果卡片；API 支持时间范围与作者过滤，空数据状态有明确 UI 反馈；已有 `admin` 内容洞察不被破坏。
    - **验证与证据**: 至少完成受影响 API、前端组件与权限隔离的定向测试，并执行至少一次浏览器 UI 验证截图。

2. **主线：测试覆盖率冲刺 80%+ (P0)**:
    - **执行范围**: 从当前 `~76%+` 基线继续提升，优先锁定上轮残余高风险链路：其余认证流边角分支（`forgot-password` / `reset-password` 失败路径）、共享组件 raw key 暴露、热点公开读链路失败路径，以及新增创作者统计 API 的失败断言。
    - **非目标**: 不回到低价值铺量测试，不接受只有 snapshot 且缺少失败断言的用例。`80%+` 仅作为冲刺目标，阶段收口线为 `>= 78%`。
    - **验收标准**: 全仓 coverage 不低于 `78%`，冲刺 `80%+`；至少补齐一组与认证配置退化或 raw key 暴露直连的失败断言；明确记录本轮新增覆盖边界与仍缺的关键模块。
    - **验证与证据**: 至少补跑定向 Vitest、`pnpm i18n:verify:runtime`、`pnpm test:coverage` 与 `pnpm exec nuxt typecheck`，并把 coverage 增量与未覆盖边界回写到活动回归窗口。

3. **主线：ESLint / 类型债 composables 子桶继续收紧 (P1)**:
    - **执行范围**: 本轮继续锁定 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 子桶的下一组命中点。先产出命中清单、回滚边界与替代写法策略，再执行有限范围清理。若命中点已在前两轮大量收敛、本轮可清理项过少，允许回退到单文件 `no-explicit-any` 切片。
    - **非目标**: 不并行开启 `no-unsafe-*` 或全仓 `any` 清零工程，不把规则收紧外溢到非目标目录。
    - **验收标准**:``pnpm exec eslint composables --max-warnings`` 通过；残余债务清单与下一轮候选已记录；若触发回退方案，必须以单文件 `no-explicit-any` 切片完成等量治理。
    - **验证与证据**: 至少完成目标子桶或目标文件的 ESLint 校验、窄范围类型检查与必要单测。

4. **主线：重复代码 — 公开认证页模板收敛 (P1)**:
    - **执行范围**: 聚焦上轮剩余热点：`pages/forgot-password.vue` vs `pages/reset-password.vue` 的公共模板片段与表单逻辑（表单校验、提交状态管理、错误展示与成功反馈的重复实现），下沉为共享 composable 或组件。
    - **非目标**: 不扩写为全仓认证重构，不改动 Better-Auth 集成层，不为了去重而削弱各页面独立演进的灵活性。
    - **验收标准**: 至少完成一组认证页模板片段的抽象；`pnpm duplicate-code:check` 基线不反弹（当前 `32 clones / 0.59%`）；受影响认证页的定向测试通过。
    - **验证与证据**: 至少完成受影响页面与共享抽象的定向测试 / 类型验证，并记录重复代码基线变化与剩余热点。

5. **主线：存量代码注释治理 — 候选组 B (P1)**:
    - **执行范围**: 从 backlog 候选组 B 中选 `server/services/upload.ts`（上传存储解析、S3/R2 直传授权、对象键策略）与 `server/utils/post-access.ts`（文章访问控制、密码解锁与内容安全处理）两条运行时安全敏感链路。新增注释解释约束、契约、边界条件与副作用，同步清理失效 / 逐行复述代码的低价值注释。
    - **非目标**: 不扩写为全仓注释重写工程，不把候选组 B 中的 AI 服务治理（`base.ts` / `quota-governance.ts` / `text.ts`）一并打包，只做 `upload` + `post-access` 两条链路。
    - **验收标准**: 两条链路均已补齐"为什么这样写 / 边界条件 / 副作用或契约"类高价值注释；已清理失效或逐行复述的旧注释；导出函数与跨层契约的注释补齐后已记录已覆盖范围与仍未覆盖边界。
    - **验证与证据**: 至少完成一轮受影响文件的 Review Gate 复核，自检注释准确性与实现同步性。

### 第三十四阶段：TTS 前端化评估与长期治理补欠 (TTS Frontend Evaluation & Long-Term Governance Catch-Up) (已审计归档)

**时间表**: 2026-05-04 ~ 2026-05-06
**目标**: 在第三十三阶段完成创作者统计与多条治理收口后，以「前端直出 TTS + 直传 OSS 评估与原型」作为唯一新增能力候选，配合 coverage `80%+` 冲刺、周期性回归执行、ESLint 下一轮切片、i18n 运行时继续扩面，以及文档翻译 freshness 续五条优化主线，完成「1 个新功能评估 + 5 个优化」的受控组合，并把周期性回归、i18n 运行时和文档翻译三条欠账主线重新拉回正式闭环。

**审计结论**: 第三十四阶段 6 条主线已在实现代码、专项设计文档、活动回归窗口、`phase-close` 回归结果与多语路线图摘要中完成闭环，满足归档条件。`todo.md` 当前待办区已清理，`todo-archive.md` 已收录完整归档块；第三十五阶段的正式规划见下文当前规划。

**收口结果**: 前端直出 TTS + 直传 OSS 评估与原型已形成 Volcengine 最小闭环；全仓 coverage 已从第三十三阶段基线继续推高到 lines `80.05%`；`pnpm regression:phase-close` 真实回归已转绿；`composables` 子桶 ESLint 回退切片、i18n 运行时扩面与文档翻译 freshness 五条治理线全部关闭。

**ROI 评估**: TTS 前端化评估与原型 `1.33`；测试覆盖率冲刺 80%+ `1.83`；周期性回归执行 `1.50`；ESLint 下一轮切片 `1.50`；i18n 运行时继续扩面 `1.50`；文档翻译 freshness 续 `1.33`。其中 coverage 冲刺为 P0 主线，其余为 P1 主线。

1. **主线：前端直出 TTS + 直传 OSS 评估与原型 (P1)**:
    - **阶段结果**: 已完成 `docs/design/governance/archive/tts-frontend-direct-evaluation.md` 评估文档，并落地 Volcengine JWT 凭证下发、前端直连 composable、OSS 直传复用与 TTS 元数据回写闭环。
    - **边界控制**: 本轮没有重写 `TTSService.processTask()`，也未扩写到 `media-task-monitor` 或 AI Image 链路；仅在 serverless / 直连场景补齐最小原型。
    - **验证与证据**: 评估文档、活动回归窗口与相关实现文件共同构成收口证据。

2. **主线：测试覆盖率冲刺 80%+ (P0)**:
    - **阶段结果**: 全仓 coverage 已正式越过 `80%+` 收口线。2026-05-06 最终全量 `pnpm test:coverage` checkpoint 为 statements `80.03%` / branches `67.18%` / functions `78.99%` / lines `80.05%`。
    - **推进方式**: 本轮优先命中后台 settings / editor 高 ROI 切片，而不是回到低价值铺量测试；[components/admin/settings/general-settings.vue](../../components/admin/settings/general-settings.vue)、[components/admin/settings/ai-quota-policies-editor.vue](../../components/admin/settings/ai-quota-policies-editor.vue)、[components/admin/settings/ai-alert-thresholds-editor.vue](../../components/admin/settings/ai-alert-thresholds-editor.vue)、[components/admin/settings/ai-cost-factors-editor.vue](../../components/admin/settings/ai-cost-factors-editor.vue)、[components/admin/settings/commercial-settings.vue](../../components/admin/settings/commercial-settings.vue)、[components/admin/settings/external-feed-sources-editor.vue](../../components/admin/settings/external-feed-sources-editor.vue) 与 [components/admin/settings/theme-save-dialog.vue](../../components/admin/settings/theme-save-dialog.vue) 已形成连续增量。
    - **验证与证据**: 定向 Vitest / coverage、定向 ESLint 与全量 coverage checkpoint 详见活动回归窗口 2026-05-06 记录。

3. **主线：周期性回归执行 (P1)**:
    - **阶段结果**: 已完成真实 `pnpm regression:phase-close`，期间清除了依赖安全、导航 E2E、严格性能预算与回归窗口超限四类 blocker。
    - **放行依据**: `release:check:full`、`docs:check:i18n`、`test:perf:budget:strict`、`duplicate-code:check:strict` 与 `review-gate:generate:check` 均已通过。
    - **验证与证据**: 详见活动回归窗口 2026-05-05 记录与 `artifacts/review-gate/2026-05-05-phase-close-regression.md`。

4. **主线：ESLint 下一轮切片 (P1)**:
    - **阶段结果**: 已确认 `composables` 子桶没有新的高 ROI `no-non-null-assertion` 生产命中，并沿回退口径完成 production composable 的 `no-explicit-any` 单文件 / 双文件切片收口。
    - **范围控制**: 本轮未把规则外溢到测试文件或其他目录，也未并行开启 `no-unsafe-*`、`prefer-nullish-coalescing` 等更宽规则治理。
    - **验证与证据**: 定向 ESLint、同级 Vitest、`pnpm exec nuxt typecheck` 与根仓 `npm run lint` 均已通过，详见活动回归窗口 2026-05-04 记录。

5. **主线：i18n 运行时继续扩面 (P1)**:
    - **阶段结果**: 已将 `pages/archives/index.test.ts` 纳入 `i18n:verify:runtime` 固定入口，补齐 `archives` 公开页装配链路，并收口 `auth-card`、`taxonomy-post-page` 与 taxonomy RSS 等相关运行时守线。
    - **验收结论**: `pnpm i18n:audit:missing` 持续保持``total:``，固定运行时矩阵已覆盖新增公开页链路。
    - **验证与证据**: 详见活动回归窗口 2026-05-05 记录。

6. **主线：文档翻译 freshness 续 (P1)**:
    - **阶段结果**: 高频设计页与对外 guide 的翻译 freshness 已恢复到可通过状态，本轮不再存在 `docs:check:source-of-truth` blocker。
    - **同步范围**: 中文规划事实源、待办归档与多语路线图摘要已同步到第三十四阶段归档状态。
    - **验证与证据**: `pnpm docs:check:source-of-truth`、`pnpm docs:check:i18n` 与 `pnpm lint:md` 通过。

### 第三十五阶段：运行时计量校准与结构治理续推 (Runtime Metering Calibration & Structural Governance Continuation) (已审计归档)

**时间表**: 约 1 - 2 周
**目标**: 在第三十四阶段完成前端直连 TTS 原型验证与五条治理主线收口后，下一阶段不再引入新功能，而是以”0 个新功能 + 5 个优化”的受控组合继续推进：围绕 AI task 计量口径与前端直连 TTS 防回归、Postgres 热点公开读链路与数据库唤醒、ESLint / 类型债下一轮窄切片、结构复用治理（重复代码 / 零散类型 / 纯函数与工具函数），以及存量代码注释治理候选组 A 五条主线，优先修复统计失真、运行期成本与结构性复用不足，而不是继续扩写新的能力面。

**审计结论**: 第三十五阶段五条主线已在实现代码、定向测试、活动回归窗口、`pg_stat_statements` live sample 与规划文档中完成闭环，满足归档条件。AI task 计量口径已完成前端直连 TTS 任务处理与结算闭环；Postgres 治理已通过本地 PostgreSQL 17 对照采样证明首页 popular posts 的前置 settings 查库已移除；ESLint 窄切片已收敛 `server/utils/post-access.ts` 中 3 处显式 `any`；结构复用治理已完成 `isRecord` / `isPlainRecord` 与 `MaybeReactive<T>` 两组类型收敛；存量代码注释治理已完成 `server/utils/locale.ts` 与 `server/middleware/1-auth.ts` 的高价值注释补强。`todo.md` 当前待办区已清理，`todo-archive.md` 已收录完整归档块；下一阶段候选分析不直接上收为正式 Phase 36。

**准入结论**: 本阶段明确不引入新功能。五条主线均来自 backlog 长期治理任务或第三十四阶段已完成能力的稳定化需求，且总数控制在 `5` 项以内，满足当前阶段容量约束。`前端直出 TTS + 直传 OSS` 已在第三十四阶段完成原型收口，因此本轮只允许作为”能力稳定化与计量口径校准”继续推进，不得以新增功能名义重复上收。原”重复代码与纯函数复用收敛”长期主线，本轮已正式扩充为”结构复用治理”，把零散类型与简单纯函数 / 工具函数纳入受控治理范围。

**执行约束**: AI task 计量治理必须显式区分 `estimated` 与 `actual` 两套口径，且完成态优先以 provider 最终 usage 为准；Postgres 切片本轮仍坚持”一组请求入口或一组热点读链路”的受控范围，不把问题泛化为全站重写；结构复用治理必须承认 `duplicate-code:check` 当前仅覆盖 `jscpd` 行级重复，因此要同步补一轮”零散类型 + 简单纯函数 / 工具函数”只读盘点，不得把所有局部类型都强行上收到共享层。

**ROI 评估**: AI task 计量口径校准与 TTS 前端直连防回归 `1.75`；Postgres 热点公开读链路与数据库唤醒继续治理 `1.75`；ESLint / 类型债下一轮窄切片 `1.50`；结构复用治理（重复代码 / 零散类型 / 纯函数与工具函数）`1.60`；存量代码注释治理候选组 A `1.33`。其中 AI task 计量口径与 Postgres 治理为 P0 主线，其余三项为 P1 主线。

1. **主线：AI task 计量口径校准与 TTS 前端直连防回归 (P0)**:
    - **执行范围**: 以第三十四阶段完成的 Volcengine 前端直连链路为基础，继续收敛 `estimated` vs `actual` 的计量边界，明确 AI task 列表、详情与聚合统计的实际用量口径；优先利用 provider 最终 usage 或等价完成态信息修正完成任务的 `actualCost` / `quotaUnits`，并补齐前端直连成功 / 失败 / 回退路径的高风险断言。
    - **非目标**: 不重写 `TTSService.processTask()`，不把更多 Provider 扩写为浏览器直连，不把本轮做成新的 AI 计费系统重构。
    - **验收标准**: 完成态 AI task 的 `actual` 口径优先取 provider 最终 usage，缺失时才回退到估算值；前端直连 TTS / Podcast 至少有一组“成功 / 失败 / 回退”断言；AI 管理端列表、详情与聚合统计在同一任务样本上的用量口径保持一致，不再出现明显统计失真。
    - **验证与证据**: 至少完成受影响 API、composable 与统计读模型的定向 Vitest、必要 ESLint / typecheck，以及活动回归窗口中的一条专项记录。

2. **主线：Postgres 热点公开读链路与数据库唤醒继续治理 (P0)**:
    - **执行范围**: 本轮只选择一组高热公开读链路或一组请求级数据库唤醒入口继续推进，优先围绕首页 `posts public list` 查询对及其相邻装配链路，补最小字段集、短 TTL、请求去重或运行时缓存复用中的至少一项收敛，并同步记录数据库唤醒边界。
    - **非目标**: 不把本轮扩写为全站性能重构，不同时并行改造全部请求入口与全部热点读路径。
    - **验收标准**: 已明确当前切片属于哪一组热点读链路或哪一组请求入口；至少实现一项字段裁剪、缓存扩面、请求去重或数据库唤醒收敛；并通过 `pg_stat_statements`、live sample 或等价证据说明查询体量、结果集大小或连接活跃窗口存在可追溯下降趋势。
    - **验证与证据**: 至少完成受影响链路的定向测试、`pnpm exec nuxt typecheck`，以及一组数据库级长窗口样本或等价 live sample。

3. **主线：ESLint / 类型债下一轮窄切片 (P1)**:
    - **执行范围**: 继续按单规则、单文件或双文件高 ROI 切片推进，优先评估服务端工具层与跨层 helper；进入实现前先冻结命中清单、替代写法、回滚边界与最小验证矩阵。
    - **非目标**: 不回到已基本清空的 `composables` 子桶做低收益清尾，不并行开启 `no-unsafe-*`、全仓 `any` 清零或更宽范围的目录级收紧工程。
    - **验收标准**: 本轮切片的命中清单、回滚边界与最小验证矩阵已经明确；定向规则校验通过；残余债务与下一轮候选已记录。
    - **验证与证据**: 定向 ESLint、必要单测、`pnpm exec nuxt typecheck` 与受影响文件诊断结果。

4. **主线：结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛 (P1)**:
    - **执行范围**: 在现有 `duplicate-code:check` 行级重复基线之上，继续推进一组 `jscpd` 可见的简单重复收敛，并补一轮“零散类型 + 简单纯函数 / 工具函数”只读盘点，优先识别 `isPlainRecord` / `isRecord`、`LocaleOption`、`MaybeReactive`、轻量 `ResponseData / StatusPayload` 壳层，以及“重复导入同一共享函数后再做轻包装”的结构性重复。
    - **非目标**: 不发起全仓类型重写，不把所有局部类型都强行上收到共享层，不把复杂业务逻辑抽象伪装成“简单工具函数复用”。
    - **验收标准**: 至少完成``1 -`` 组可安全复用的共享抽象；`pnpm duplicate-code:check` 基线不反弹；并留下本轮无法由 `jscpd` 自动覆盖的结构性重复清单，作为后续脚本或治理依据。
    - **验证与证据**: `pnpm duplicate-code:check`、定向 Vitest / typecheck，以及只读盘点结果或专项治理记录。

5. **主线：存量代码注释治理 — 候选组 A (P1)**:
    - **执行范围**: 从候选组 A 中选择 `server/services/setting*`、`server/utils/locale.ts` / `server/middleware/i18n.ts`、`server/middleware/1-auth.ts` 里的``1 -`` 组高复杂度链路推进，补齐设置来源判定、locale 归一化与鉴权上下文挂载相关的高价值注释。
    - **非目标**: 不扩写为全仓注释重写工程，不把候选组 A / B / C 全部打包并入同一轮。
    - **验收标准**: 本轮已补齐“为什么这样写 / 边界条件 / 副作用或契约”类高价值注释；已同步清理失效、误导性或逐行复述代码的低价值注释；并记录已覆盖范围、仍未覆盖边界与注释漂移检查结论。
    - **验证与证据**: 受影响文件 Review Gate 自检、必要的定向测试 / typecheck，以及对应回归或审计记录。

### 第三十六阶段：运行时稳态补漏与结构治理收口 (Runtime Stability Patch-Up & Structural Governance Closure) (已审计归档)

**时间表**: 2026-05-09 ~ 2026-05-11
**目标**: 在第三十五阶段完成运行时计量校准与结构复用首轮收口后，继续以“0 个新功能 + 5 个优化”的受控组合完成剩余高 ROI 收尾：围绕数据库初始化竞态与 Redis 连接稳态、TTS 前端直连 / 直传 OSS backlog 清理、ESLint / 类型债窄切片续推、结构复用治理补漏，以及公开读接口注释治理候选组 C 完成当前阶段闭环，而不提前把下一阶段候选上收为正式规划。

**审计结论**: 第三十六阶段五条主线已在当前仓库实现、对应用例入口、backlog 去重状态与规划文档中完成闭环，满足归档条件。`server/database/index.ts` 与 `server/utils/redis.ts` 的运行时稳态修复已落地；TTS 前端直连链路测试入口与 backlog 状态已完成对账；`server/services/ai/tts.ts` 的 `any` 收敛、`server/utils/ai/tts-task-shared.ts` 与 `types/utils.ts` 的共享抽象，以及公开读接口注释治理候选组 C 也均可在当前代码中对照。`todo.md` 当前执行面已清理，`todo-archive.md` 已收录完整归档块；下一阶段当前仍只保留候选分析，不在本轮直接上收。

**准入结论**: 本阶段不引入新功能。五条主线均属于当前已实现能力的稳定化收口或长期治理主线的受控切片，总数维持在 `5` 项内，满足阶段容量约束。原本未完成的 `server/services/ai/asr.ts` 与邮件服务自重复收敛仍保留在下一阶段候选池，不借归档动作改写为“已完成”。

**ROI 评估**: 数据库初始化并发与 Redis 连接稳态修复 `1.75`；TTS 前端直连 / 直传 OSS backlog 清理 `1.50`；ESLint / 类型债继续治理 `1.50`；结构复用治理（TTS task + locale 类型收敛）`1.60`；存量代码注释治理候选组 C `1.33`。其中运行时稳态修复为 P0 主线，其余四项维持 P1 受控治理切片。

1. **主线：修复数据库查询并发问题与 Redis 连接异常 (P0)**:
    - **执行范围**: 修复 `initializeDB()` 竞态窗口、保留单一初始化 promise 守卫，并为 Redis 客户端补齐有限超时与重试边界。
    - **非目标**: 不把本轮扩写为数据库层全面重构，也不新增第二套缓存或连接管理策略。
    - **阶段结果**: `server/database/index.ts` 已把 `isInitialized` 的设置时机后移并保留 `initializationPromise` 复用；`server/utils/redis.ts` 已补 `connectTimeout` 与有限 `retryStrategy`，避免 serverless 场景下无边界等待。
    - **验证与证据**: 对应代码入口与测试文件已落在 `server/database/index.ts`、`server/utils/redis.ts`、`server/utils/redis.test.ts` 与数据库定向测试目录。

2. **主线：TTS 前端直出 + 直传 OSS 审查与 backlog 清理 (P1)**:
    - **执行范围**: 对账 TTS 前端直连链路测试覆盖、清理 backlog 中已交付条目，并确认超长类型定义已完成拆分收口。
    - **非目标**: 不在本阶段继续扩写新的 TTS provider 或新的前端直连协议。
    - **阶段结果**: TTS 前端直连与元数据回写的测试入口已齐备，`docs/plan/backlog.md` 第 13 条已标注为“已交付（第三十四—三十五阶段）”，`use-tts-volcengine-direct.ts` 的类型负担也已抽离到共享类型文件。
    - **验证与证据**: 对应入口包括 `composables/use-tts-volcengine-direct.test.ts`、`server/api/posts/[id]/tts-metadata.put.test.ts` 与 backlog 中文事实源。

3. **主线：ESLint / 类型债继续治理 (P1)**:
    - **执行范围**: 关闭既有 warning，并把 `no-explicit-any` 单文件窄切片继续推进到 `server/services/ai/tts.ts`。
    - **非目标**: 不并行开启 `server/services/ai/asr.ts` 或更宽范围的目录级规则提升。
    - **阶段结果**: 本轮已完成 4 个 warning 收口，并把 `server/services/ai/tts.ts` 中约 `16` 处 `any` / `as any` 收敛；`server/services/ai/asr.ts` 明确保留为后续候选。
    - **验证与证据**: 受影响实现与规则边界已同步到 `eslint.config.js`、`server/services/ai/tts.ts` 及其相关验证入口。

4. **主线：结构复用治理：重复代码 + 零散类型收敛 (P1)**:
    - **执行范围**: 收敛双 TTS task 端点共享逻辑与 `LocaleOption` 相关散落类型，不扩写到更大规模的跨目录抽象。
    - **非目标**: 不把邮件服务自重复收敛强行并入本阶段，也不借共享类型名义扩大为全仓类型重写。
    - **阶段结果**: `server/utils/ai/tts-task-shared.ts` 已承接双端点共享 helper，`types/utils.ts` 已沉淀 `LocaleOption` / `SelectLocaleOption`，相关守卫收敛为统一 `isLocaleOption`。
    - **验证与证据**: 当前代码已可直接对照 `createTTSTask` 共享 helper、locale 类型共享与双端点调用面。

5. **主线：存量代码注释治理候选组 C (P1)**:
    - **执行范围**: 为公开读接口链路补齐多语言聚合、缓存策略、SQL 差异与 taxonomy 过滤复用边界的高价值注释。
    - **非目标**: 不将注释治理扩写成全仓重写，也不继续上收候选组外的其他文件。
    - **阶段结果**: `posts/index.get.ts`、`posts/archive.get.ts`、`categories/index.get.ts` 与 `tags/index.get.ts` 已补入与当前实现匹配的高价值注释，规划描述与代码事实一致。
    - **验证与证据**: 对应实现均位于当前 server API 文件中，可直接与阶段归档块对照复核。

### 第三十七阶段：Windows 本地性能与治理链路深化 (Windows Local Performance & Governance Deepening) (已审计归档)

**时间表**: 2026-05-11 ~ 2026-05-18
**目标**: 在第三十六阶段完成运行时稳态补漏与结构治理收口后，继续以“0 个新功能 + 5 个优化”的受控组合推进下一阶段，优先解决 Windows 本地 `nuxt dev` / `nuxt build` 的可感知阻塞，同时补一轮高风险测试有效性、ESLint / 类型债窄切片、至少 3 处结构复用热点，以及 Postgres 长窗口复核闭环。

**审计结论**: 第三十七阶段五条主线已在当前仓库实现、回归记录、性能 / 长窗口事实源与规划文档中完成闭环，满足归档条件。Windows 本地 `nuxt dev` 已恢复首页与公开设置链路可用，`nuxt build` 长尾已完成首轮收敛；测试有效性、AI 服务层类型债、结构复用热点与 Postgres 长窗口复核也都已具备可追溯证据。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

**ROI 评估**: Windows 本地 Dev / Build 性能治理 `2.00`；测试有效性切片 `1.80`；ESLint / 类型债治理 `1.50`；结构复用治理（至少 3 处热点）`1.70`；Postgres 长窗口复核切片 `1.45`。其中 Windows 性能与测试有效性为 P0 主线，其余三项为受控 P1 治理切片。

1. **主线：Windows 本地 Dev / Build 性能治理 (P0)**:
    - **阶段结果**: installation state、连接级初始化、optional session、request log 与 permission 的 always-loaded 边界已完成收紧；新增 [server/services/installation-probe.ts](../design/governance/windows-dev-build-performance-governance.md) 对应的轻量探针事实源后，Windows 本地 `nuxt dev` 首响已由约 `502279ms` 收敛到约 `58549ms`，`nuxt build` 也已完成 `Server built -> Build complete` 长尾首轮止血。
    - **验证与证据**: 见 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md)、`artifacts/nuxt-*-performance.json`、`artifacts/nitro-resolve-probe.json` 以及 2026-05-16 的用户实测记录。

2. **主线：测试有效性切片 (P0)**:
    - **阶段结果**: 已围绕前端直连 TTS、AI task `estimated / actual` 口径一致性与公开热点读链路补齐 3 组高风险断言，避免本轮退化为单纯补 coverage 数字。
    - **验证与证据**: 定向回归矩阵为 `pnpm exec vitest run server/api/ai/tts/task.post.test.ts server/api/admin/ai/stats.get.test.ts tests/server/api/posts/access-error-mapping.test.ts`，结果 `14` 通过、`0` 失败；详见 [docs/reports/regression/current.md](../reports/regression/current.md) 的 2026-05-18 记录。

3. **主线：ESLint / 类型债治理 (P1)**:
    - **阶段结果**: [server/services/ai/asr.ts](../../server/services/ai/asr.ts)、[server/services/ai/image.ts](../../server/services/ai/image.ts)、[server/services/ai/tts.ts](../../server/services/ai/tts.ts) 与 [server/services/ai/base.ts](../../server/services/ai/base.ts) 已完成 `unknown + 显式收窄` 收敛，AI 服务层日志字段与 provider model 多态断言已同步收紧。
    - **验证与证据**: 定向 ESLint、对应单测与 `pnpm run typecheck` 已通过；残余候选继续收敛为测试桩历史 `as any` 与 provider 聚合层进一步去断言化。

4. **主线：结构复用治理：至少 3 处热点收敛 (P1)**:
    - **阶段结果**: 后台订阅 / waitlist 列表页壳层、广告 campaigns / placements 实体列表与表单弹窗控制流，以及邮件服务内部发送管线已完成 3 处热点收敛；[components/commercial-link-manager.vue](../../components/commercial-link-manager.vue) 保留为下一轮候选。
    - **验证与证据**: `pnpm duplicate-code:check`、[server/utils/email/service.test.ts](../../server/utils/email/service.test.ts) 与 `pnpm exec nuxt typecheck` 已通过，baseline 未反弹。

5. **主线：Postgres 长窗口复核切片 (P1)**:
    - **阶段结果**: 已通过 2026-05-12 与 2026-05-14 的 Neon 长窗口样本确认，当前不再存在“非生产自部署 Cron + 请求入口误触完整初始化”导致的长期 compute 占用阻塞；剩余热点已回收到 backlog 继续管理。
    - **验证与证据**: 详见 [docs/reports/regression/current.md](../reports/regression/current.md) 中两轮长窗口复核记录，以及 [backlog.md](./backlog.md) 的后续候选收敛说明。

### 第三十八阶段：分发一致性修补与热点治理续推 (Distribution Consistency Patch-Up & Hotspot Governance Continuation) (已审计归档)

**时间表**: 2026-05-18 ~ 约 1 - 2 周
**目标**: 在第三十七阶段完成 Windows 本地性能、测试有效性、结构复用、ESLint 窄切片与 Postgres 长窗口复核后，继续以“0 个新功能 + 5 个优化”的受控组合推进下一阶段，优先修补第三方分发标签尾注与预览一致性，并围绕测试有效性第二轮、Postgres 单路径收敛、结构复用第二轮与 AI provider / 测试桩类型债继续做窄切片治理。

**审计结论**: 第三十八阶段五条主线已在当前仓库实现、定向测试、live sample、活动回归窗口与规划文档中完成闭环，满足归档条件。`B 站 / Memos` 标签尾注与预览一致性已收口；测试有效性第二轮、结构复用第二轮与 AI provider 聚合层 ESLint / 类型债窄切片也均具备可追溯证据。Postgres P0 当前已完成“公开热点读链路止损式瘦身 + 根因收敛”的本阶段目标，剩余缓存侧优化继续回收到 backlog 长期主线，而不再作为本阶段阻塞项。`todo.md` 当前执行面已清理，下一阶段仍只保留候选分析，不在本轮直接上收。

**准入结论**: 五条主线均来自 [backlog.md](./backlog.md) 的长期主线或短期候选，总数控制在 `5` 项内，符合当前阶段容量约束。当前阶段不引入新增功能，执行优先级为 `2 个 P0 + 3 个 P1`。

**ROI 评估**: 第三方分发标签尾注与预览一致性修补 `1.60`；测试有效性第二轮切片 `1.85`；Postgres 公开热点读链路继续瘦身 `1.75`；结构复用第二轮（至少 3 处热点）`1.70`；ESLint / 类型债下一轮窄切片 `1.50`。其中测试有效性与 Postgres 热点读链路为 P0 主线，其余三项为受控 P1 治理切片。

1. **主线：第三方分发标签尾注与预览一致性修补 (P1)**:
    - **执行范围**: 只覆盖``B`` 与 `Memos` 两个渠道；优先复用 [Phase 38 执行计划](../design/governance/archive/phase-38-plan.md) 中冻结的分发物料入口，收敛“标签标准化 + 尾注拼装 + 预览展示”到同一 helper，而不是分别对预览层和投递层做热修。
    - **非目标**: 不扩写到 WechatSync、邮件、Hexo 仓库同步或其他分发器；不重做整套分发 UI。
    - **验收标准**:``B`` 预览``B`` 实际同步 payload 与 `Memos` 预览三处输出在标签尾注上保持一致；并明确“标签尾注中的标签项去除空格后再输出”的唯一规则。
    - **验证与证据**: 至少补齐一组分发物料 helper / template 测试与一组实际分发 / 导出层测试；必要时补一组后台分发预览组件测试。

2. **主线：测试有效性第二轮切片 (P0)**:
    - **执行范围**: 继续沿已有测试基座推进第二轮高风险断言，优先补组件层 direct TTS 失败映射、页面级 auth degradation，以及 `settings public` 或 `friend-links` 的失败口径。
    - **非目标**: 不回到低价值 coverage 铺量；不把 snapshot 或纯存在性断言当作主要成果。
    - **验收标准**: 至少完成 `3` 组高风险失败 / 边界断言，其中至少 `1` 组覆盖用户可见错误映射，而不是只断言内部异常被抛出。
    - **验证与证据**: 定向 Vitest、受影响文件类型检查，以及本轮新增入口的定向回归矩阵记录。

3. **主线：Postgres 公开热点读链路继续瘦身 (P0)**:
    - **阶段结果**: `posts/home`、`categories` 与 `tags` 公开链路已切到 connection-only 初始化边界，`server/database/index.ts` 的两阶段初始化状态机也已修正为“connection/full init 锁在每轮结束后释放，维护链失败后下一次仍可重试”；首页列表响应已剥离 `author.email / emailHash`，避免为未消费字段继续承担公共热读成本。
    - **阶段结果**: 基于 [2026-05-19 第三十八阶段 Neon Live Sample 摘要](../../artifacts/review-gate/2026-05-19-phase-38-neon-live-sample.md)，当前超预算更像“公开热读 + 稀疏公共流量持续打醒 compute”的组合，而不是初始化误触问题；本阶段据此完成单路径瘦身与根因收敛，并将剩余缓存侧继续优化回收到 backlog 长期主线。
    - **验证与证据**: `tests/server/database/init-boundary.test.ts`、`tests/server/api/posts/home.get.test.ts`、受影响 API 定向测试、受影响文件类型检查，以及 [2026-05-19 第三十八阶段 Neon Live Sample 摘要](../../artifacts/review-gate/2026-05-19-phase-38-neon-live-sample.md)。

4. **主线：结构复用第二轮（至少 3 处热点） (P1)**:
    - **执行范围**: 再次完成 `3` 处以上热点收敛，优先处理 [components/commercial-link-manager.vue](../../components/commercial-link-manager.vue) 文件内自重复；其余候选优先选择轻量 shared helper，而不是复杂业务抽象。
    - **非目标**: 不把复杂页面状态机包装成新的通用框架；不重复统计第三十七阶段已收口的热点。
    - **验收标准**: 至少 `3` 处热点完成收敛，其中必须包含 `commercial-link-manager` 文件内自重复；`pnpm duplicate-code:check` 基线不反弹。
    - **验证与证据**: 受影响组件 / helper 定向测试、`pnpm duplicate-code:check` 与受影响文件类型检查。

5. **主线：ESLint / 类型债下一轮窄切片 (P1)**:
    - **执行范围**: 继续坚持“单规则、单文件或双文件”的窄切片，优先在 AI provider 聚合层与高 ROI 测试桩历史断言之间二选一推进。
    - **非目标**: 不并行开启 `no-unsafe-*` 或全目录规则收紧；不把测试桩清理扩大成整仓 mock 体系重写。
    - **验收标准**: 定向 ESLint、定向测试与类型检查通过；残余债务与下一轮候选有明确记录。
    - **验证与证据**: 定向 ESLint、定向 Vitest、受影响文件类型检查与对应残余债务记录。

### 第三十九阶段：公众号排版预览与治理基线落盘 (WeChat Layout Preview & Governance Baseline Landing) (已审计归档)

**时间表**: 2026-05-19 ~ 约 1 - 2 周
**目标**: 在第三十八阶段完成分发一致性修补、测试有效性第二轮与 Postgres 止损式瘦身收口后，正式切到“`1` 个新功能 + `4` 个优化”的下一阶段执行面：以“公众号格式预览 / 导出辅助”作为唯一新增能力，同时把结构复用第三轮、注释治理首轮、文档 / 脚本治理最小收口包，以及国际化文案复用治理四条优化统一纳入 script-first / design-first 的受控组合，避免再次回到“只有叙述目标、缺少 baseline 和对比口径”的阶段规划。

**审计结论**: 第三十九阶段五条主线已在实现代码、定向测试、设计文档、治理 baseline 与规划文档中完成闭环。`todo.md` 已清理当前阶段正文，`todo-archive.md` 已收录完整归档块；多语路线图摘要已同步阶段状态。下一阶段当前仅保留候选分析，不在本轮直接上收。

**准入结论**: 五条主线中，“公众号格式预览 / 导出辅助”是唯一新增功能，其余四条均已有可重复执行 baseline 或稳定事实源：`artifacts/governance/simple-duplicates-latest.md`、`artifacts/governance/comment-drift-latest.md`、`pnpm docs:check:line-count:candidate`、`pnpm docs:check:source-of-truth:candidate`、`artifacts/governance/script-governance-latest.md`，以及 `i18n:audit:missing` / `i18n:verify:runtime` 与 [i18n/config/locale-modules.ts](../../i18n/config/locale-modules.ts) 的运行时装配基线。总数控制在 `5` 项内，符合当前阶段容量约束。

**ROI 评估**: 微信公众号格式预览 / 导出辅助 `1.56`；结构复用第三轮（3 个热点）`1.72`；注释治理首轮（1 - 2 组模块）`1.43`；文档 / 脚本治理最小收口包 `1.67`；国际化文案复用治理 `1.60`。其中公众号能力与文档 / 脚本治理作为本阶段优先主线，其余三项保持受控治理切片推进。

1. **主线：微信公众号格式预览 / 导出辅助 (P0)**:
    - **执行范围**: 只做“Markdown -> 公众号风格 HTML / 样式预览 / 复制排版后内容”三件事，且坚持“格式转换优先，样式美化次之”；优先复用现有编辑器与分发预览表面，如 [components/admin/mavon-editor-client.client.vue](../../components/admin/mavon-editor-client.client.vue)、[components/admin/posts/post-editor-header.vue](../../components/admin/posts/post-editor-header.vue)、[components/admin/posts/post-distribution-button.vue](../../components/admin/posts/post-distribution-button.vue)、[composables/use-post-distribution-button.ts](../../composables/use-post-distribution-button.ts) 与 [utils/web/post-distribution-dialog.ts](../../utils/web/post-distribution-dialog.ts)，而不是新建一套完整编辑器。
    - **非目标**: 不整体引入 `doocs/md` 的完整编辑器、图床、AI、草稿与部署体系；不替换 `mavon-editor`；不把范围扩写为新的富文本编辑器工程。
    - **数据基线**: 当前仓库已存在 `Memos / WechatSync` 的 expanded preview 与 `finalMarkdown / bodyMarkdown / copyrightMarkdown` 三类预览输出，但尚不存在 dedicated 的 `wechat_mp` 风格渲染 profile，也没有“复制排版后内容”的固定入口。
    - **验收标准**: 先在 `docs/design/governance/` 或等价入口落一份专项设计文档，明确首版只交付“公众号风格预览 / 复制排版后内容”，不交付整体编辑器替换；再补齐一条可复用的公众号样式转换链路，并至少验证标题层级、图片、引用块、代码块 / 提示容器、长文阅读连续性，以及编辑器预览与复制结果的一致性。
    - **验证与证据**: 设计文档、受影响组件 / composable 定向测试、必要的浏览器验证与剪贴板复制验证，以及新增预览入口的回归记录。

2. **主线：结构复用第三轮（3 个热点） (P1)**:
    - **执行范围**: 继续沿 `simple-duplicates` baseline 做窄切片，当前基线为“同名内部函数候选 `112`、同名 type/interface 候选 `156`”；本轮优先锁定 `confirmDelete`（`13` 处）、`getStatusSeverity`（`9` 处）与 `DistributionMaterialBundle`（`6` 处）三组热点，而不是继续追逐测试桩里的 `translate` / `mountComponent`。
    - **非目标**: 不把复杂页面状态机包装成新的通用框架；不要求一轮清掉整仓同名候选；`duplicate-code:check` 与 `simple-duplicates` 两套口径只做增量收敛，不做大爆炸式重构。
    - **验收标准**: 至少完成 `3` 组热点收敛，且本轮选中的三组热点在重跑 `pnpm governance:audit:simple-duplicates` 后都要出现可对比的 delta；同时 `pnpm duplicate-code:check` 基线不得反弹。
    - **验证与证据**: `artifacts/governance/simple-duplicates-latest.md/.json` 的前后对比、受影响 helper / 组件定向测试、`pnpm duplicate-code:check` 与受影响文件类型检查。

3. **主线：注释治理首轮（1 - 2 组模块） (P1)**:
    - **执行范围**: 以 `comment-drift` baseline 为事实源推进首轮高复杂度模块补注释，当前基线为“高复杂度导出函数缺注释候选 `177`、TODO / 临时口吻 `27`、疑似漂移注释 `298`”；本轮优先锁定 [composables/use-post-editor-io.ts](../../composables/use-post-editor-io.ts)（complexity `61`）与 [composables/use-post-editor-ai.ts](../../composables/use-post-editor-ai.ts)（complexity `44`），第二组只允许在 [composables/use-notifications.ts](../../composables/use-notifications.ts)、[composables/use-installation-wizard.ts](../../composables/use-installation-wizard.ts)、[composables/use-admin-friend-links-page.ts](../../composables/use-admin-friend-links-page.ts) 中三选一。
    - **非目标**: 不把本轮扩大成全仓平均补注释；不把逐行复述代码的注释当作成果；不为了数字好看而跳过 TODO / 漂移注释清理。
    - **验收标准**: 本轮选中的``1 -`` 组模块必须补齐“为什么这样写 / 契约 / 副作用 / 失败回退”类高价值注释，并同步清理对应文件中的 TODO / 漂移注释；重跑 `pnpm governance:audit:comment-drift` 后，所选模块在缺注释 / 漂移候选中应出现可追溯下降。
    - **验证与证据**: `artifacts/governance/comment-drift-latest.md/.json` 对比、受影响 composable 定向测试与受影响文件类型检查。

4. **主线：文档 / 脚本治理最小收口包 (P0)**:
    - **执行范围**: 只做一组最小闭环，不扩写成全仓文档整顿。当前 docs candidate 事实源显示 `docs/reports/regression/current.md`（`588` 行）、`docs/guide/deploy.md`（`228` 行）、`docs/guide/translation-governance.md`（`214` 行）、`docs/standards/planning.md`（`360` 行）与 `docs/standards/documentation.md`（`280` 行）已进入 warning 面；`docs:check:source-of-truth:candidate` 还暴露了 `6` 条英文 freshness 违规。脚本侧 baseline 为“长期脚本 `39`、稳定入口 `37`、缺少稳定入口 `2`、文档声明但缺失 `1`”。
    - **非目标**: 不重写文档体系；不在本轮同时收紧 candidate 门槛；不把 perf 研究脚本全部强制升级为 blocker 入口。
    - **验收标准**: 至少完成 `1` 组回归 / 指南类超长页收敛、`4` 份高频英文 must-sync 文档 freshness 回补，以及脚本治理 `3` 条现存 finding 的处置闭环（补脚本、补稳定入口，或明确下线），并在对应脚本重跑后保留前后对比。
    - **验证与证据**: `pnpm lint:md`、`pnpm docs:check:i18n`、`pnpm docs:check:line-count`、`pnpm docs:check:source-of-truth`、`pnpm governance:check:scripts`，以及对应 artifact / 文档 diff。

5. **主线：国际化文案复用治理 (P1)**:
    - **执行范围**: 继续坚持“先守住模块归属和运行时命中，再做有限复用”。当前 `i18n:audit:missing` 已保持``total:``，友链场景共享字段已统一沉淀到 `components.friend_links.fields`；下一轮优先把运行时验证面从 About / friend-links 扩到 [components/app-footer.vue](../../components/app-footer.vue)、[pages/archives/index.vue](../../pages/archives/index.vue)、[pages/categories/index.vue](../../pages/categories/index.vue) 与 [pages/tags/index.vue](../../pages/tags/index.vue) 这 `4` 组公开装配链路。
    - **非目标**: 不为了去重强行把页面私有语义上收到 `common`；不把 `unused` 清理扩成整仓 key 改名工程；不改写现有 route-module 装配边界。
    - **验收标准**: 在保持 `pnpm i18n:audit:missing` 为 `0` 的前提下，把上述 `4` 组公开装配链路纳入固定 runtime 验证面，并明确哪些字段继续保留页面私有命名空间、哪些字段可稳定沉淀到共享组件命名空间；新增范围内不得再出现 raw key 暴露。
    - **验证与证据**: `pnpm i18n:audit:missing`、`pnpm i18n:verify:runtime`、受影响页面 / 组件定向测试，以及 [i18n/config/locale-modules.ts](../../i18n/config/locale-modules.ts) 对应模块装配的变更记录。

### 第四十阶段：发布前守护与 TypeORM 升级评估收口 (Release Guardrails & TypeORM Upgrade Assessment) (已审计归档)

**时间表**: 2026-05-23 ~ 约 1 - 2 周
**目标**: 在第三十九阶段完成治理基线落盘后，把第四十阶段明确收敛为“两条主线并行、一个收口层兜底”的执行面：一条主线负责发布前守护与回归闸门固化，另一条主线负责 TypeORM 1.0.0 升级评估的兼容性探针、go/no-go 结论与回滚预案，避免阶段标题已经写了 TypeORM、但实际执行面只剩 CI 守护的规划漂移。

**审计结论**: 第四十阶段六条主线均已在代码、workflow、回归证据与规划文档中完成闭环。当前状态为：发布前守护轨已统一 pre-check 入口并收敛执行顺序；TypeORM 评估轨维持 `NO-GO（直接升级）` / `GO（评估任务收口）`；收口轨已把 pre-check、周期性回归与 TypeORM 评估结论稳定沉淀到 [活动回归窗口](../reports/regression/current.md)。`todo.md` 已清理、`todo-archive.md` 已收录本阶段归档块，满足阶段归档条件。

**准入结论**: 本阶段共 `6` 条主线，按“先守护入口、再跑 TypeORM 兼容性探针、最后统一留痕与策略收口”的顺序推进；当前容量为 `2` 条 P0 + `3` 条 P1 + `1` 条 P2，仍在规划规范要求的``5 -`` 项窗口内。

**ROI 评估**: CI 前置守护脚本接入 `2.25`；发布链路最小回归闸门收紧 `2.00`；TypeORM 1.0.0 兼容性探针与分桶验证 `1.75`；TypeORM 升级 go/no-go 与回滚预案落盘 `1.67`；文档证据自动回填 `1.60`；守护策略分级与依赖风险口径对齐 `1.40`。

1. **主线：CI 前置守护脚本接入首轮落地 (P0)**:
    - **执行范围**: 在正式执行主命令前增加统一 pre-check，并要求 release / test / docker 三条 workflow 复用同一入口，而不是各自维护散落的前置判断。
    - **非目标**: 不在本轮重写全部 workflow；不把所有 warning 一次性升级为 blocker。
    - **最小验收**: release / test / docker 三条 workflow 在执行主体前都调用同一守护入口；至少覆盖依赖风险、关键脚本存在性、必要环境检查。
    - **验证与证据**: workflow 变更记录、守护入口定向执行结果，以及最少一条失败样本能直接定位到对应子项。

2. **主线：发布链路最小回归闸门收紧 (P0)**:
    - **执行范围**: 把已有 release:check / regression 脚本收敛成可复用、可复盘的固定顺序，优先解决“本地一套、CI 一套”的漂移。
    - **非目标**: 不新增第二套回归入口；不把阶段收口专用命令直接并入日常开发默认流程。
    - **最小验收**: 失败日志可直接定位到守护子项；本地与 CI 的执行顺序一致，且至少有一份标准化执行摘要可供引用。
    - **验证与证据**: 发布前守护脚本或回归入口定向执行记录，以及对应回归窗口摘要。

3. **主线：TypeORM 1.0.0 兼容性探针与分桶验证 (P1)**:
    - **执行范围**: 仅做评估态兼容性探针，不直接把 `typeorm` 从 `0.3.29` 升到 `1.0.0` 并宣布实施完成；优先覆盖 `server/database/**`、`server/database/typeorm-adapter.ts`、公开热点读链路与依赖 TypeORM 形态的定向测试。
    - **非目标**: 不在本阶段完成真实升级实施；不顺手重写仓库内所有 TypeORM mock。
    - **最小验收**: 至少完成一轮 `typeorm@1.0.0` 兼容性探针，按“数据库与适配层 / 实体层 / 查询与服务层 / API 层 / 测试桩”输出失败分桶，并跑通最小验证矩阵中的静态检查与关键定向验证。
    - **验证与证据**: [docs/design/governance/archive/typeorm-v1-upgrade-assessment.md](../design/governance/archive/typeorm-v1-upgrade-assessment.md)、定向验证记录与活动回归窗口中的阶段结论。

4. **主线：TypeORM 升级 go/no-go 与回滚预案落盘 (P1)**:
    - **执行范围**: 依据兼容性探针结果输出 go/no-go，并把回滚锚点、触发条件与后续是否升格为真实升级实施写清楚。
    - **非目标**: 不把“已有评估文档”误写成“升级已可执行”；不在结论不清时强行上收到下一阶段实施面。
    - **最小验收**: 明确记录 `typeorm@0.3.29` 回滚锚点、no-go 触发条件、下一次重新评估的触发窗口，以及是否允许把真实升级实施纳入后续阶段。
    - **验证与证据**: 评估文档更新、活动回归窗口结论与 roadmap/todo 的阶段摘要保持一致。

5. **主线：文档证据自动回填 (P1)**:
    - **执行范围**: 将 pre-check、回归摘要与 TypeORM 评估结论自动沉淀到活动回归窗口模板，减少阶段收口时的人工补录。
    - **非目标**: 不重新设计第二套回归记录文档；不要求本轮自动生成完整审计报告。
    - **最小验收**: 每次主流程后能生成一条标准化证据记录，至少包含执行入口、结果摘要、阻断项或 go/no-go 结论。
    - **验证与证据**: [docs/reports/regression/current.md](../reports/regression/current.md) 中的模板化记录与对应脚本输出。

6. **主线：守护策略分级与依赖风险口径对齐 (P2)**:
    - **执行范围**: 把阻断项和提醒项配置化，并同步校准 `security:audit-deps` 与 `security:audit-deps:daily` 的判断口径，避免 release 前与 daily 巡检出现双标。
    - **非目标**: 不把所有 daily warning 升级为发版 blocker；不新增独立的第三套依赖风险入口。
    - **最小验收**: 策略表可读、可审计，新增规则不需要改 workflow 结构；同一类风险在 daily 与 release 前的结论一致，只有时机差异。
    - **验证与证据**: 守护策略配置、依赖审计入口定向执行结果与对应文档摘要。

### 第四十一阶段：TypeORM 前置清障与治理切片推进 (TypeORM Pre-Clearance & Governance Slices) (已审计归档)

**时间表**: 2026-06-01 ~ 2026-06-03
**目标**: 在第四十阶段完成发布前守护与 TypeORM 评估归档后，以「0 个新功能 + 5 个优化」的受控组合推进，优先把 TypeORM 升级阻断项前置清障，并同步收敛 Postgres 热点读链路、文档门禁 / 脚本治理、结构复用与 ESLint / 类型债，形成可复跑、可量化、可继续上收的治理闭环。

**审计结论**: 五条主线已在实现代码、定向测试、回归记录与规划文档中完成闭环，满足归档条件。TypeORM 前置清障已产出可复跑的阻断项分桶与清障清单（`select: string[]` → 对象语法全量迁移）；Postgres 热点读链路已通过 `archive` 接口字段裁剪给出下行对比证据；文档门禁 warning 面已显著压缩（`docs:check:source-of-truth` 已恢复通过）；结构复用完成 2 组热点切片且基线不反弹；ESLint / 类型债完成四组窄切片（覆盖 26 文件）且 `warning=0`。

**准入结论**: 五条主线均来自 backlog 长期主线或候选组合，容量控制在 `5` 项内，符合规划规范。`TypeORM 前置清障` 与 `Postgres 热点读链路` 设为 P0，其余三条治理切片为 P1；本阶段不引入新增功能。

**ROI 评估**: TypeORM 升级前置清障切片 `1.80`；Postgres 热点读链路治理 `1.75`；文档门禁和脚本治理 `1.60`；结构复用治理 `1.60`；ESLint / 类型债治理 `1.50`。

> 详细条目与验收结论已归档至 [待办事项归档](./todo-archive.md)。


