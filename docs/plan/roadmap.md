# 墨梅博客 - 项目计划

本文档展示了项目的发展蓝图。具体的任务执行状态请参阅 [待办事项](./todo.md) 及 [待办归档](./todo-archive.md)，长期规划与积压项请参阅 [backlog.md](./backlog.md)。


### 深度归档索引

- 第一至第十阶段全文: [archive/roadmap-phases-01-10.md](./archive/roadmap-phases-01-10.md)
- 第十一至第二十一阶段全文: [archive/roadmap-phases-11-21.md](./archive/roadmap-phases-11-21.md)
- 深度归档治理规则: [archive/index.md](./archive/index.md)

### 主窗口保留范围

- 主文档现在只保留项目概况、近线阶段窗口、当前规划与归档索引。
- 第一至第四十一阶段的完整正文已迁入区间归档分片，避免旧阶段长期挤占当前阅读面。
- 后续若近线窗口再次膨胀，继续按 [archive/index.md](./archive/index.md) 的区间分片规则向深度归档推进。
### 第二十二至第二十四阶段深度归档

第二十二至第二十四阶段的完整正文已迁入区间归档分片：
- 第二十二阶段：质量有效性与创作编排治理深化 (Archived)
- 第二十三阶段：全球触达扩展与运行时稳态治理 (Archived)
- 第二十四阶段：质量守线与回归执行深化 (Archived)

详见 [roadmap-phases-22-24.md](./archive/roadmap-phases-22-24.md)。

### 第二十五至第三十一阶段深度归档

第二十五至第三十一阶段已按路线图分片归档到专用文件，主窗口仅保留索引与近线阶段。

- 第二十五阶段：部署体验与可持续演进收敛（Archived）
- 第二十六阶段：质量治理与数据库流量收敛（Archived）
- 第二十七阶段：渠道稳定性与体验性能推进（Archived）
- 第二十八阶段：内容运营洞察与运行时治理推进（Archived）
- 第二十九阶段：评论翻译与治理事实源收敛推进（Archived）
- 第三十阶段：远程仓库同步与治理基线细化推进（Hexo 风格导出）（Archived）
- 第三十一阶段：认证预研与治理执行面正式上收（Archived）

详见 [roadmap-phases-25-31.md](./archive/roadmap-phases-25-31.md)。
### 第三十二至第四十一阶段深度归档

第三十二至第四十一阶段的完整正文已迁入区间归档分片，主窗口仅保留阶段摘要表。

详见 [roadmap-phases-32-41.md](./archive/roadmap-phases-32-41.md)。

### 第三十二至第四十一阶段概览（已审计归档）

> 以下十阶段的完整正文已迁入 [roadmap-phases-32-41.md](./archive/roadmap-phases-32-41.md)。各阶段详细条目与验收结论另见 [待办事项归档](./todo-archive.md)。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **32** | 2026-05-01~02 | 1 新 + 4 优化 | 多语言资产化增强包承接入口（Benefits 页）；coverage 76%+；duplicate-code 32/697；ESLint no-explicit-any 窄切片；Postgres /api/search 匿名缓存 |
| **33** | 2026-05-03 | 1 新 + 4 优化 | 创作者统计 API；coverage 80%+ 冲刺（新增 38 tests）；ESLint composables 子桶收敛 7 文件；重复代码消除 2 clones；注释治理 upload.ts + post-access.ts |
| **34** | 2026-05-04 | 1 新 + 4 优化 | TTS 前端直连回填；coverage 80%+ 达成 (Lines 80.03%)；ESLint post-access.ts 收敛；isRecord/isPlainRecord 类型收敛；文档门禁候选入口 |
| **35** | 2026-05-17 | 1 新 + 4 优化 | AI task 计量口径校准（estimated/actual 独立聚合）；Postgres 首页热点读（移除前置 settings 查询）；ESLint 第三组窄切片；MaybeReactive 类型收敛；注释治理 locale.ts + 1-auth.ts |
| **36** | 2026-05-17 | 0 新 + 2 优化 | 运行时稳态修补（修复 public settings 503 影响范围）；Postgres 公开列表查询字段裁剪 |
| **37** | 2026-05-20~25 | 1 新 + 4 优化 | Windows 本地性能治理（Nitro 收窄/PWA 关闭/量化基线）；Postgres 长窗口复核（连接阻塞已消失）；ESLint/结构复用继续 |
| **38** | 2026-05-27~28 | 1 新 + 2 优化 | 分发一致性修补（B/Memos 标签标准化+尾注拼装）；ESLint text.ts 收敛；结构复用 admin 列表页 |
| **39** | 2026-05-29~30 | 1 新 + 1 优化 | 微信排版预览（Markdown→WeChat 实时预览）；治理脚本基线化（5 组 governance 脚本） |
| **40** | 2026-05-30~06-01 | 0 新 + 6 优化 | 发布前 pre-check 统一化；TypeORM 升级评估 No-Go 结论；守护策略分级；文档证据自动回填 |
| **41** | 2026-06-01~03 | 0 新 + 5 优化 | TypeORM 前置清障（select: string[]→对象语法）；Postgres archive 字段裁剪；文档门禁 warning 压缩；结构复用 2 组热点；ESLint 四组窄切片（26 文件 warning=0） |

### 第四十二阶段：AI 深化与运营闭环 (AI Deepening & Operations Loop)

**时间表**: 2026-06-03 ~ 约 2 周
**目标**: 在第四十一阶段完成 TypeORM 前置清障与治理切片收口后，首次引入「新功能 + 优化」组合：以 AI 内容审计和内容日历作为两条新增能力，同时推进站点性能基线建设、ESLint / 类型债加速清偿与结构复用深化治理。

**准入结论**: 五条主线均来自 backlog 已验证候选，容量控制在 `5` 项内，符合规划规范。两条新功能均复用现有 AI 管线和 Post 实体，增量风险低。三条优化主线中 ESLint 和结构复用各要求至少三组切片，旨在加速此前进展偏慢的治理面。

**ROI 评估**: AI 内容审计 `1.60`；内容日历 `1.50`；站点性能基线 `1.80`；ESLint / 类型债治理 `1.50`；结构复用治理 `1.60`。

1. **主线：AI 内容审计与质量优化 (P1)**:
    - **执行范围**: 为后台文章列表提供 SEO / 质量评分徽章与一键审计报告，覆盖 meta 完整性、内部链接、alt text、可读性等维度，并给出 AI 改进建议。复用现有 AI 管线 (openai/volcengine)，纯增量功能。
    - **非目标**: 不做全站批量内容重写、不自动修改已发布内容、不做实时监控。
    - **最小验收**: 后台文章列表展示质量评分徽章；至少支持 meta 完整性和可读性两个审计维度；AI 改进建议可生成但仅展示、不自动应用。

2. **主线：内容日历 / 编辑排期 (P1)**:
    - **执行范围**: 提供后台月/周日历视图与草稿管线看板（构思→写作→待发布三列），与现有定时发布功能联动。复用 Post 实体的 `status` + `publishedAt` 字段。
    - **非目标**: 不做团队任务分配、不做跨站点排期、不做 Gantt 图。
    - **最小验收**: 日历视图可按月/周切换，草稿看板支持拖拽变更状态，日历中已排期文章可点击跳转编辑。

3. **主线：站点性能与 Core Web Vitals 基线 (P0)**:
    - **执行范围**: 建立公开页 CWV 基线（LCP / CLS / INP），优先收敛首页 banner 图片加载、mavon-editor bundle 懒加载、PrimeVue 组件 tree-shaking 三项热点。复用现有 Lighthouse CI 与 `test:perf:budget`。
    - **非目标**: 不做整站重构、不引入新性能框架、不触及后台管理页性能。
    - **最小验收**: 完成首页、文章详情页、分类/标签列表页的 CWV 基线记录；至少完成一项可量化优化（如 mavon-editor 懒加载或图片尺寸优化），并给出前后对比。

4. **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**:
    - **执行范围**: 继续坚持「单规则 + 单文件 / 双文件」窄切片，本轮至少完成三组独立切片（每组覆盖 2-5 个文件），优先选择命中数多、回滚边界清晰的规则族。继续保持 `warning=0`。
    - **非目标**: 不扩写为全仓 `any` 清零、不引入新规则族、不改变治理脚本基线。
    - **最小验收**: 至少三组窄切片完成并通过定``eslint --max-warnings`` 验证；规则债 inventory 输出显示本轮清偿数量。

5. **主线：结构复用治理 — 至少三组热点切片 (P1)**:
    - **执行范围**: 聚焦重复类型声明、纯函数、工具函数的收敛。优先处理同名/近似名函数、同形状 type/interface 声明、重复导入后轻包装的 helper。每组切片必须给出原始重复点、抽象边界与回滚方式。
    - **非目标**: 不推动跨目录大重构、不为复用而复用、不改变业务行为。
    - **最小验收**: 至少三组热点切片完成且 `duplicate-code` 基线不反弹；`pnpm governance:audit:simple-duplicates` 输出显示收敛趋势。

**审计结论**: 第四十二阶段五条主线已在实现代码、前端组件、API 端点、i18n 密钥与规划文档中完成闭环。站点性能 CWV 基线采集脚本与图片懒加载就已落地，AI 内容审计（评分徽章 + 审计报告 + 缓存 24h + 行级权限）与内容日历（月/周日历视图 + 看板拖拽 + 管线阶段 PATCH）均已交付，ESLint / 类型债三组窄切片与结构复用三组热点切片均延续治理切片推进。typecheck + lint 通过，Code Auditor 审计问题已修复并提交。`todo.md` 已清理、`todo-archive.md` 阶段归档块将在本阶段收口时补入。

> 详细条目见 [待办事项](./todo.md)；backlog 来源见 [长期规划与积压项](./backlog.md)。


### 第四十三阶段：AI 分发复用与治理深化 (AI Distribution Reuse & Governance Deepening)

**时间表**: 2026-06-05 ~ 约 2 周
**目标**: 在第四十二阶段完成 AI 内容审计与内容日历交付后，以「1 个新功能 + 4 个优化」的受控组合推进：AI 内容多格式复用作为轻量新增能力，四条优化主线延续治理节奏（ESLint 窄切片、结构复用、Windows 性能、i18n 验证扩面）。CWV 性能优化因 Windows 本地环境前置条件不足，延后至后续阶段。

**准入结论**: 五条主线均来自 backlog 已验证候选，容量控制在 `5` 项内，符合规划规范。新功能复用现有 AI 管线，增量风险低。四条优化中 Windows 性能基于 2026-06-04 外部调研报告继续尝试可量化优化，ESLint、结构复用与 i18n 验证扩面延续长期主线治理节奏。

**ROI 评估**: AI 内容多格式复用 `1.40`；ESLint / 类型债治理 `1.50`；结构复用治理 `1.60`；Windows Dev/Build 性能治理 `2.00`；i18n 运行时验证扩面 `1.45`。

1. **主线：AI 内容多格式复用 (P1)**:
    - **执行范围**: 为已发布文章提供一键 AI 生成社交帖子功能。复用现有 AI 摘要/翻译管线，纯前端 + API 增量功能。后端新增 `POST /api/admin/posts/:id/social-post` 端点（接受 `platform: 'twitter' | 'linkedin'`），AI 生成对应平台格式的帖子文案，返回文本供复制。
    - **非目标**: 不建全功能社交媒体调度器、不自动发送到社交平台、不做视频脚本/图片生成。
    - **最小验收**: 至少支持 Twitter Thread + LinkedIn 两种格式；AI 帖子可复制；复用现有 AI 计费体系。

2. **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**:
    - **执行范围**: 继续「单规则 + 单文件 / 双文件」窄切片，本轮至少完成三组独立切片（每组 2-5 个文件），优先选择命中数多、回滚边界清晰的规则族。`warning=0`。
    - **非目标**: 不扩写为全仓 `any` 清零、不引入新规则族。
    - **最小验收**: 至少三组窄切片完成并通过定向验证；`pnpm governance:audit:eslint-debt` 显示本轮清偿数量。

3. **主线：结构复用治理 — commercial-link-manager 自重复 + 至少三组热点切片 (P1)**:
    - **执行范围**: 聚焦 backlog 长期主线标注的最高优热点 `components/commercial-link-manager.vue` 文件内自重复（多块模板/样式/逻辑块间的结构性重复），同时至少完成 3 组其他热点切片。
    - **非目标**: 不推动跨目录大重构、不为复用而复用。
    - **最小验收**: `commercial-link-manager.vue` 自重复收敛；至少三组其他热点完成且 `duplicate-code` 基线不反弹。

4. **主线：Windows 本地 Dev / Build 性能治理 (P0)**:
    - **执行范围**: 基于 2026-06-04 外部调研报告，至少尝试 2 项可量化优化（WSL2 评估、Vite warmup、显式 import 扩展名等），并用 `pnpm perf:nuxt:dev` / `pnpm perf:nuxt:build` 采集前后对比数据。
    - **非目标**: 不重写构建配置、不承诺达到 Linux 性能水平。
    - **最小验收**: 至少 2 项可量化优化且 build 总耗时不高于当前基线；对比数据写入 `artifacts/`。

5. **主线：i18n 运行时验证扩面 (P1)**:
    - **执行范围**: 把 app-footer（友链/关于区域）、archives、categories、tags 四组公开装配链路纳入 `i18n:verify:runtime` 回归面，同步清理重复键或跨模块归属漂移。
    - **非目标**: 不做整仓 key 改名、不改写 route-module 装配边界。
    - **最小验收**: 四组链路纳入 runtime 验证并通过；`i18n:audit:missing` 与 `i18n:audit:duplicates` 保``total:``。

**审计结论**: 第四十三阶段五条主线已在实现代码、测试、i18n 与规划文档中完成闭环。Code Auditor 审计发现 2 blocker（i18n nesting + sourceMap cross-platform）已修复并重新验证通过（`0d9b9f47`）。Windows 性能主线确认平台级瓶颈（Linux CI 106s vs Windows >1800s，>17x），已上收关闭。`todo.md` 已清理、`todo-archive.md` 已收录本阶段归档块。

> 详细条目见 [待办事项](./todo.md)；backlog 来源见 [长期规划与积压项](./backlog.md)。


### 第四十四阶段：友链生态与性能闭环 (Friend-Link Ecosystem & Performance Loop) (已审计归档)

**时间表**: 2026-06-06 ~ 2026-06-07（2 天，窄切片组合交付）
**目标**: 在第四十三阶段完成 AI 多格式复用与四治理优化后，以「1 个新功能 + 1 个评估 + 3 个优化」组合推进：友链 RSS 聚合作为轻量新增能力，隐私自托管分析为评估态，三条优化主线延续治理节奏（ESLint、结构复用、CWV 性能）。

**审计结论**: 第四十四阶段已围绕友链 RSS 聚合、隐私自托管分析评估、ESLint/类型债治理、结构复用治理、CWV 性能优化、Phase 44 测试回填六条主线完成收口。`pnpm typecheck` + `pnpm lint` 全部通过，四项测试验收指标全部达成（零覆盖模块 > 70% stmts, 低分支模块 > 55%/70%）。当前阶段的实现代码、设计文档、优化记录、i18n 翻译与测试证据均已落盘，正式放行。

**准入结论**: 五条主线均来自 backlog 已验证候选，容量控制在 `5` 项内，符合规划规范。友链 RSS 复用现有 `FriendLink` 实体，增量风险低；隐私分析为评估态，不进入代码实现；ESLint 和结构复用延续治理切片节奏；CWV 优化因 CI（Linux）验证路径已打通，终可进入优化闭环。

**ROI 评估**: 友链 RSS 聚合 `1.45`；隐私自托管分析评估 `1.20`；ESLint / 类型债治理 `1.50`；结构复用治理 `1.60`；CWV 性能优化 `1.70`。

1. **主线：友链 RSS 聚合 — Blogroll Feed (P1)**:
    - **执行范围**: 为友链页面增加「最近更新」RSS 聚合摘要。后端抓取友链站点 Feed（RSS/Atom），缓存于 Redis（1h TTL）；前端友链页新增摘要卡片区域。
    - **非目标**: 不建 RSS 阅读器、不建内容聚合平台、不做全文索引。
    - **最小验收**: 友链页展示至少一个站点的最近更新摘要；RSS 抓取带缓存；失败时优雅降级。

2. **主线：隐私优先自托管分析集成 — 评估态 (P1)**:
    - **执行范围**: 对 Umami Docker 方案进行 go/no-go 评估（资源开销/兼容性/接入复杂度），产出评估文档。
    - **非目标**: 不在本阶段实施部署、不自建分析引擎、不替换现有 GA4/Clarity。
    - **最小验收**: 评估文档输出明确的 go/no-go 结论，至少覆盖三个维度。

3. **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**:
    - **执行范围**: 继续「单规则 + 单文件 / 双文件」窄切片，至少三组独立切片。`warning=0`。
    - **非目标**: 不扩写为全仓 `any` 清零。
    - **最小验收**: 三组切片完成；`pnpm governance:audit:eslint-debt` 显示清偿数量。

4. **主线：结构复用治理 — 至少两组热点切片 (P1)**:
    - **执行范围**: 在 Phase 43 四组切片基础上继续收敛，聚焦同名函数/重复类型/工具函数。
    - **非目标**: 不推动跨目录大重构、不为复用而复用。
    - **最小验收**: 两组切片完成且 `duplicate-code` 基线不反弹。

5. **主线：CWV 性能优化 — 至少一项可量化优化 (P0)**:
    - **执行范围**: 基于 Phase 42 CWV 基线，借助 CI 环境验证至少一项可量化优化（首屏 CSS 内联/JS 延迟/图片格式优化）。
    - **非目标**: 不做整站重构、不引入新性能框架。
    - **最小验收**: 一项优化完成且 CWV 至少一项有可测量改善；前后对比数据记录到 `performance.md`。

> 详细条目见 [待办事项](./todo.md)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第四十五阶段：隐私闭环与文档治理 (Privacy Closure & Docs Governance)（已审计归档）

**时间表**: 2026-06-07 ~ 约 2 周
**目标**: 在第四十四阶段完成友链 RSS 聚合、分析评估与四条优化后，以「1 个新功能 + 1 个评估 + 3 个优化」组合推进：Umami 隐私自托管分析作为 Phase 44 评估的落地实现，Digital Garden 为探索评估态，三条优化主线延续治理节奏（文档治理、ESLint/类型债、结构复用）。

**准入结论**: Umami 核心集成（~4h, 9 文件）在 Phase 44 评估中已确认 Go；Digital Garden 为评估态不进入代码实现；文档治理、ESLint 和结构复用延续治理切片节奏。五条主线均来自 backlog 已验证候选或长期主线，容量控制在 `5` 项内。

**ROI 评估**: Umami 隐私分析集成 `1.50`；Digital Garden 探索评估 `0.90`；文档治理收口 `1.70`；ESLint / 类型债治理 `1.40`；结构复用治理 `1.50`。

**审计结论**: 五条主线均已完成并归档，当前阶段实现、测试与文档证据已对齐；`todo.md` 已清理为“待准入（筹备中）”状态。详细收口见 [todo-archive 第四十五阶段](./todo-archive.md#第四十五阶段隐私闭环与文档治理-已审计归档)。

1. **主线：Umami 隐私自托管分析集成 — Phase 1 核心 (P0)**:
    - **执行范围**: 基于 Phase 44 评估结论和 `docs/design/governance/privacy-analytics-evaluation.md` 中的实施路线 Phase 1，完成：Schema（`SettingKey.UMAMI_ANALYTICS` + env mapping）、Nuxt 客户端插件（`plugins/umami-analytics.client.ts`）、后台设置页（`analytics-settings.vue` 新增输入框 + 锁定逻辑）、5 locale i18n 翻译、`server/api/settings/public.get.ts` 公开字段。
    - **非目标**: 不在本阶段完成 Docker 部署模板（Phase 2）、不替换现有 GA4/Clarity/百度统计。
    - **最小验收**: 后台设置页可配置 Umami Website ID + Script URL；公开页面注入正确 Umami 追踪脚本；与现有 GA4/Clarity/百度统计可独立开关。

2. **主线：Digital Garden / 知识花园探索评估 (P1)**:
    - **执行范围**: 对 backlog #10「Digital Garden / 知识花园模式」进行 go/no-go 评估，覆盖：双向链接存储模型（JSON 字段 vs 关联表）现有文章体量下的性能影响预估、非时序导航对现有路由 / 信息架构的侵入度、知识图谱可视化的前端依赖与 bundle 增量。产出评估文档 `docs/design/governance/archive/digital-garden-evaluation.md`。
    - **非目标**: 不在本阶段实施双向链接、内容成熟度标记或知识图谱可视化。
    - **最小验收**: 评估文档输出明确的 go/no-go 结论，至少覆盖存储模型、性能影响、前端依赖三个维度。

3. **主线：文档治理收口 (P1)**:
    - **执行范围**:
        - `docs/design/governance/` 清理过期文档（Phase 规划稿 5 份 + 已完成评估 7 份 + 已完成工程 6 份 + Phase 44 报告 1 份 → 共 ~19 份归档至 `archive/`）
        - `docs/standards/performance.md` Section 11「优化历史」迁出至 `docs/reports/performance-optimization-log.md`
        - `docs/plan/backlog.md` 清理已完成条目（#12 Blogroll 删除 + `#9` 状态更新 + Phase 44 方向描述改写 + `#8` 调研机制移除/合并）
    - **非目标**: 不做新文档创建、不做翻译同步（延至阶段收口时统一执行）。
    - **最小验收**: governance/ 文档从 45 份缩减到 ~25 份；performance.md 恢复纯规范定位；backlog.md 无 Phase 44 残留引用。

4. **主线：ESLint / 类型债 — 继续窄切片 (P1)**:
    - **执行范围**: 继续「单规则 + 单文件 / 双文件」窄切片，至少完成两轮：清理 `require-await` 2 处（`feed.get.test.ts`）；继续 `no-explicit-any` 在 `server/utils/ai/openai-provider.ts` 子桶收敛 1 桶。
    - **非目标**: 不做全仓 `any` 清零、不改变治理脚本基线。
    - **最小验收**: eslint-disable 总量从 15 降至 ≤13；生产代码新增 any 清零至少 3 处。

5. **主线：结构复用治理 — 继续收敛 (P1)**:
    - **执行范围**: 在 Phase 44 两组切片基础上继续收敛，聚焦 `pages/categories/[slug].vue` vs `pages/tags/[slug].vue` 的公共模板片段，以及 `server/utils/` 下近似工具函数的抽取。每组切片必须输出原始重复点、拟抽象边界、复用收益。
    - **非目标**: 不推动跨目录大重构、不为复用而复用。
    - **最小验收**: 至少两组热点切片完成，`pnpm duplicate-code:check` 基线不反弹。

### 第四十六阶段：隐私部署收口与治理深化 (Privacy Deployment Closure & Governance Deepening) (已审计归档)

**时间表**: 2026-06-08 ~ 约 2 周  
**目标**: 在第四十五阶段完成归档后，以“1 个新功能 + 5 个优化”组合推进下一阶段：围绕 Umami 集成剩余部署化能力（Phase 2）完成闭环，同时继续推进 ESLint/类型债、结构复用、覆盖率与回归治理，并同步数据库初始化脚本和部署文档，优先降低后续维护与部署漂移成本。

**准入结论**: 六条主线均来自 backlog 长期主线或已验证候选，满足 `docs/standards/planning.md` 的容量约束与准入要求；Digital Garden 维持 No-Go，不在本阶段进入实现范围。

**审计结论**: 第四十六阶段六条主线已在实现代码、定向测试、回归记录与规划文档中完成闭环，满足归档条件。当前 `todo.md` 已清理执行面；`docs/reports/regression/current.md` 与 `artifacts/review-gate/2026-06-10-weekly-regression.{md,json}` 已回填 `Pass` 结论（含 1 条非阻塞 warning：`duplicate-code:check failed`）。

**ROI 评估**: Umami Phase 2 部署化 `1.75`；ESLint / 类型债治理 `1.50`；结构复用治理 `1.60`；覆盖率提升至 82% `1.55`；周期性回归与现状调研 `2.00`；数据库初始化脚本与文档同步 `1.45`。

1. **主线：Umami 隐私自托管分析集成 — Phase 2 部署化 (P0)**:
    - **执行范围**: 在 Phase 1 核心已落地基础上，补齐 Umami Docker Compose 模板、部署入口脚本化和部署文档对齐，完成“可配置 + 可部署 + 可运维”的最小闭环。
    - **非目标**: 不替换现有 GA4/Clarity/百度统计，不在本阶段引入新的分析引擎。
    - **最小验收**: 部署模板、必要变量与文档入口可直接复用；与既有统计能力可并行开关且不互相覆盖。

2. **主线：ESLint / 类型债治理 — 至少 3 组窄切片 (P1)**:
    - **执行范围**: 继续“单规则 + 小范围”策略，至少推进 3 组独立窄切片，优先高 ROI 历史热点文件和近期新增链路。
    - **非目标**: 不扩写为全仓 `any` 清零或目录级大工程。
    - **最小验收**: 三组切片完成并可在 `pnpm governance:audit:eslint-debt` 产物中对照本轮清偿结果。

3. **主线：结构复用治理 — 至少 3 组热点切片 (P1)**:
    - **执行范围**: 继续围绕同名函数、重复类型和轻量工具函数推进至少 3 组热点收敛，优先处理低风险高复用收益场景。
    - **非目标**: 不推动跨模块大重构，不为复用而复用。
    - **最小验收**: 三组切片完成且 `pnpm duplicate-code:check` 基线不反弹。

4. **主线：测试覆盖率治理 — 提升至 82% (P1)**:
    - **执行范围**: 以最近新增功能和高风险链路为优先对象，补齐失败断言与边界断言，推动全仓 coverage 到 `82%+`。
    - **非目标**: 不做低价值铺量补测，不牺牲断言有效性换取数字增长。
    - **最小验收**: 全仓 coverage 指标达到 `82%+`，并保留本轮覆盖增量与未覆盖边界说明。

5. **主线：周期性回归任务 + 项目现状调研 (P0)**:
    - **执行范围**: 执行一次固定回归入口，结合当前主线状态输出项目现状分析与下一阶段重点候选建议。
    - **非目标**: 不把调研结论直接等同于实现承诺。
    - **最小验收**: 回归记录写入 `docs/reports/regression/current.md`，并产出可用于下一阶段准入的重点建议摘要。

6. **主线：数据库初始化脚本与文档同步 (P1)**:
    - **执行范围**: 核对 `database/**/init.sql` 与实体/数据库设计文档一致性，修正初始化脚本漂移，并同步 `database/README.md` 与部署文档说明。
    - **非目标**: 不在本阶段引入额外数据库方言或重写迁移体系。
    - **最小验收**: 三套 `init.sql` 同步完成且文档说明与当前实现一致，避免新实例初始化偏差。

### 第四十七阶段：接口契约与路由治理深化 (API Contract & Routing Governance Deepening) (规划中)

**时间表**: 2026-06-10 ~ 约 2 周  
**目标**: 在第四十六阶段完成归档后，下一阶段明确采用“0 个新功能 + 6 个优化”的治理组合，围绕 ESLint/类型债、结构复用、页面/API 路径规范、`pages/admin` 路由风格统一、未使用 API 清单治理，以及 API Schema 覆盖与复用六条主线展开，优先降低维护成本、契约漂移与路由认知负担。

**准入结论**: 六条主线均属于 backlog 已存在的长期治理或短期候选优化项，本轮不新增功能面；其中“页面与 API 路径规范化治理”“`pages/admin` 路由文件风格统一”“未使用 API 清单与清理可行性评估”“API Schema 覆盖与复用治理”来自 backlog 短期候选，已在本阶段正式上收为执行项。

**执行约束**: 本阶段涉及目录、路由与契约治理，必须遵循“先盘点与规则冻结，再小批迁移与验证”原则；禁止一次性全仓重排。所有条目均需补齐最小验证矩阵与回滚边界。

**ROI 评估**: ESLint / 类型债治理 `1.50`；结构复用治理 `1.60`；页面与 API 路径规范化 `1.33`；`pages/admin` 路由风格统一 `1.25`；未使用 API 清单与清理评估 `1.40`；API Schema 覆盖与复用治理 `1.57`。

1. **主线：ESLint / 类型债继续治理 (P1)**:
    - **执行范围**: 继续“单规则 + 单文件/双文件”窄切片，至少上``3 -`` 条高 ROI 规则债切片，并补齐命中清单、回滚边界与验证矩阵。
    - **非目标**: 不扩写为全仓 `any` 清零或目录级大规模治理。
    - **最小验收**: 规则债 baseline 与 delta 可对照，目标切片 lint/typecheck 稳定通过。

2. **主线：结构复用治理继续推进 (P1)**:
    - **执行范围**: 继续围绕重复代码、零散类型与轻量纯函数热点推进收敛，至少完``3 -`` 组高收益切片。
    - **非目标**: 不做跨模块大重构，不为抽象而抽象。
    - **最小验收**: `duplicate-code` 基线不反弹，输出每组切片的收益与未覆盖边界。

3. **主线：页面与 API 路径规范化治理 (P1)**:
    - **执行范围**: 输出页面路径与 API 路径映射清单，冻结命名与分层规则，并先完成一轮高频模块样板迁移方案。
    - **非目标**: 不在首轮执行全仓路由迁移。
    - **最小验收**: 映射清单、统一规则与优先级列表落盘，至少一组样板模块验证通过。

4. **主线：`pages/admin` 路由文件风格统一 (P1)**:
    - **执行范围**: 明确 `pages/admin/*.vue` 与 `pages/admin/**/index.vue` 的单一主规范与例外条件，产出迁移批次计划。
    - **非目标**: 不一次性改完全部 admin 页面。
    - **最小验收**: 风格规范冻结并完成首批迁移样板，相关路由行为无回归。

5. **主线：未使用 API 清单与清理可行性评估 (P1)**:
    - **执行范围**: 基于调用链、日志与测试引用产出未使用 API 清单，按“可删除/观察/保留兼容”三档分流并给出回滚锚点。
    - **非目标**: 不在无证据前提下直接删接口。
    - **最小验收**: 端点级清单可追溯，至少形成 3 组可安全下线候选并附验证方式。

6. **主线：API Schema 覆盖与复用治理 (P1)**:
    - **执行范围**: 盘点 API 输入/输出 schema 覆盖率，分层标注“完整/部分/缺失”，并输出可上收共享 schema 的候选清单。
    - **非目标**: 不在本阶段重写全部 API 契约。
    - **最小验收**: 覆盖率分层结果落盘，至少完成 3 组高收益 schema 复用样板。

### 第四十八阶段：深度治理与清理收口 (Deep Governance & Cleanup Closure) (已审计归档)

**时间表**: 2026-06-11 ~ 2026-06-13（3 天，密集治理交付）
**目标**: 在第四十七阶段完成 6 条治理优化后，以「0 个新功能 + 5 个优化」组合继续深化：ESLint/类型债扩展窄切片、结构复用深度收敛、API Schema 全量推进至完整覆盖、未使用 API 弃用标记与删除、第二轮闲置端点调研。

**准入结论**: 五条主线均延续第四十七阶段治理切片节奏，不引入新功能面。ESLint 和复用已建立稳定「单规则 + 双文件」模式；Schema 覆盖从 58% 完整率推进到 ~85%；未使用 API 经 git 历史验证可安全下架。

**ROI 评估**: ESLint/类型债 `1.40`；结构复用 `1.45`；Schema 覆盖 `1.60`；未使用 API 删除 `1.80`；第二轮调研 `1.10`。

1. **主线：ESLint / 类型债 — 窄切片扩展 ≥5 模块 (P0)**:
    - **执行范围**: 继续「单规则 + 单文件」窄切片：`seed-demo.ts`（6 处 `as any` → `PostStatus` 枚举）、`typeorm-adapter.ts`（2 处 `as any` 窄类型断言）、`translation.ts` 残留 `as any` 收尾、`use-tts-volcengine-direct.ts` composable 拆分降低 eslint-disable、`server/services/ai/` 子桶 `no-explicit-any` 收敛。
    - **非目标**: 不做全仓 any 清零、不改变治理脚本基线。
    - **最小验收**: eslint-disable 生产代码减少 ≥2 处；`as any` 清零 ≥4 处。

2. **主线：结构复用 — 类型/函数深度收敛 ≥5 切片 (P0)**:
    - **执行范围**: 基于 Phase 47 的 15 组同名 type/interface 基线继续收敛：`AdminAiPageEvent`、`DemoTourStage`、`VolcengineResponsePacket`、`AuthBoundaryLocale` 四组类型统一 + `formatDate` 多处重复统一使用 `useI18nDate().formatDate`。
    - **非目标**: 不推动跨目录大重构。
    - **最小验收**: 同名 type/interface 从 15 降至 ≤12；至少 1 组函数级复用落地。

3. **主线：API Schema 全面覆盖 — partial→full + 测试 (P0)**:
    - **执行范围**: 为 external-links（POST+PUT）、snippets（PUT+POST scaffold）、theme-configs（POST+PUT+apply）、marketing（POST send）、link-governance（POST apply+dry-run）共 ≥8 个端点补全 Zod schema；每个补全端点追加测试用例（schema 通过/拒绝断言）。
    - **非目标**: 不重写已有 schema、不补 calendar 模块（无独立 API）。
    - **最小验收**: POST/PUT 无 schema 端点从 27 降至 ≤19；新增 ≥8 个 schema 测试用例。

4. **主线：未使用 API 弃用标记 + 安全删除 (P0)**:
    - **执行范围**: 基于 Phase 47 评估结果和 git 历史验证，对 7 个零引用端点：标记 `@deprecated` → 删除文件 → 记录 git revert 回滚锚点。
    - **非目标**: 不删除有测试覆盖的端点。
    - **最小验收**: 7 个端点全部删除；`pnpm lint` + `pnpm typecheck` 通过。

5. **主线：第二轮未使用 API 扩大调研 (P1)**:
    - **执行范围**: 对 `admin/subscriptions`、`admin/waitlist/export`、`admin/snippets/scaffold-to-post`、`admin/posts/:id/versions/:versionId/restore` 进行三层交叉验证 + git 历史分析，产出第二轮弃用候选清单。
    - **非目标**: 不在本阶段删除未确认端点。
    - **最小验收**: 输出第二轮评估结果（至少 4 个端点的使用证据分析）。

### 第四十九阶段：延期清缴与流量治理 (Deferred Clearance & Traffic Governance) (已审计归档)

**时间表**: 2026-06-13 ~ 2026-06-13（1 天，密集交付）
**目标**: 在第四十八阶段完成深度治理后，以「0 个新功能 + 5 个优化」组合推进：Postgres 网络传输削减（89% 耗尽警戒）、formatDate 函数级复用、延期测试回填、清理收口、type 收敛。

**准入结论**: 五条主线中，Postgres 流量治理为 P0 最紧迫项（6 月仅 13 天已耗尽 89% 网络传输配额，按此趋势 4 天内将超限）；formatDate 复用和测试回填为 Phase 44/48 延期项；清理和收敛延续治理节奏。无新功能面。

**ROI 评估**: Postgres 流量治理 `2.00`；formatDate 复用 `1.30`；延期测试回填 `1.20`；清理收口 `1.50`；type 收敛 `1.10`。

1. **主线：Postgres 流量治理 — 网络传输削减 (P0)**:
    - **执行范围**: 基于 Neon 监控数据（6 月前 13 天 Network 4.43/5 GB = 89%），锁定：Tag 列表页查询减列（35→10 列）、Settings 公共读取加缓存（5min TTL）、文章详情页减列 + 移除 author.email、前/后文章导航 COALESCE 索引优化。
    - **非目标**: 不做数据库迁移、不做全量查询改造、不回退已落地的安全查询。
    - **最小验收**: Network transfer 日均有可测量下降；至少 2 条热点查询完成减列/缓存优化。

2. **主线：formatDate 函数级复用 (P0)**:
    - **执行范围**: 8 处自定义 `formatDate`/`formatDateTime` → 统一使用 `useI18nDate().formatDate`，消除 Phase 48 延期项。
    - **非目标**: 不改动 `useI18nDate` 签名。
    - **最小验收**: 自定义 formatDate 函数减少 ≥4 处。

3. **主线：延期测试回填 (P1)**:
    - **执行范围**: Phase C `pages/friend-links.test.ts` feed 渲染/降级测试、Admin checkbox 渲染交互测试、前/后文章导航逻辑测试。
    - **非目标**: 不扩写到非 Phase 44 相关模块。
    - **最小验收**: 新增 ≥3 个测试用例。

4. **主线：清理收口 (P1)**:
    - **执行范围**: 删除已确认的 `subscriptions` 端点、清理 `vendor.css` 空文件、backlog.md 清理已完成条目（Blogroll #12、隐私分析状态更新、Phase 47/48 切片方向修正）。
    - **非目标**: 不新增删除未确认端点。
    - **最小验收**: 清理项全部完成，backlog.md 无 Phase 44-48 残留引用。

5. **主线：type 收敛 + 归档索引修正 (P2)**:
    - **执行范围**: 同名 type/interface 12→≤10（测试文件重复可忽略）；`governance/archive/index.md` 已完成评估 11→13 计数同步。
    - **非目标**: 不推动生产代码大重构。
    - **最小验收**: 同名 type ≤10；archive/index.md 计数正确。

### 第五十阶段：PWA 启用与收口治理 (PWA Enablement & Closure Governance) (已审计归档)

**时间表**: 2026-06-13 ~ 2026-06-14
**目标**: 经过 Phase 39-49 共 11 个阶段（5 新功能 + 46 治理）后，以「1 个新功能 + 4 个优化」组合重启新功能面：PWA 作为轻量新增能力，三条优化延续治理节奏（API 测试分层、i18n 首屏稳定性、backlog 深度清理），外加友链博客环导航评估。

**审计结论**: 第五十阶段五条主线已于 2026-06-14 全部闭合并归档至 [todo-archive.md](./todo-archive.md)。PWA 模块已启用并验证构建通过（SW + Manifest 生成）；API 测试分层已固化规则并完成 4 组样板迁移；i18n 首屏翻译稳定性已完成命中矩阵并修复 3 处 raw key 泄漏；backlog 深度清理已完成 Phase 32-41 路线图归档压缩（772→409 行）与 backlog 候选条目去重；友链博客环导航评估已输出 Go 结论（~4h 工作量）。

**准入结论**: PWA 配置已在 nuxt.config.ts 中预置（`@vite-pwa/nuxt` 已安装但注释），启用工作量低（~2h）；API 测试分层和 i18n 首屏稳定性为 backlog 中已识别的技术债；backlog 清理为常规维护。

**ROI 评估**: PWA 功能开启 `1.80`；API 测试分层 `1.30`；i18n 首屏稳定性 `1.40`；backlog 深度清理 `1.50`；友链博客环评估 `1.10`。

1. **主线：PWA 功能开启 — Progressive Web App (P0)**:
    - **执行范围**: 启用 `nuxt.config.ts` 中已注释的 `@vite-pwa/nuxt` 模块，配置 Service Worker + Web Manifest + 离线缓存策略。
    - **非目标**: 不做复杂 Workbox 自定义路由、不做 Push Notification。
    - **最小验收**: PWA 可安装（manifest.json 生效）；Service Worker 注册成功；离线页面可访问。

2. **主线：API 测试分层收敛 (P1)**:
    - **执行范围**: 统一 `tests/server/api/` 与 `server/api/**/*.test.ts` 双轨目录，固化测试分层规则。
    - **非目标**: 不重写测试内容。
    - **最小验收**: 输出分层规则文档；≥3 组样板迁移落地。

3. **主线：i18n 首屏翻译稳定性治理 (P1)**:
    - **执行范围**: 评估 `locale-modules.ts` 拆分加载链路，识别首屏 raw key 泄漏点。
    - **非目标**: 不重写 i18n 加载架构。
    - **最小验收**: 输出首屏路由命中矩阵；至少修复 1 处 raw key 泄漏。

4. **主线：backlog 深度清理 (P1)**:
    - **执行范围**: 压缩方向判断历史 → 简表；移除已完成条目（#3 未使用 API、#4 API Schema、#8 调研机制）。
    - **非目标**: 不新增条目。
    - **最小验收**: 方向判断段缩减 ≥50%；已上收项全部标记/移除。

5. **主线：友链前后博客环导航 — 评估态 (P2)**:
    - **执行范围**: 相邻友链排序逻辑、前后导航 UX、数据来源复用评估。
    - **非目标**: 不在本阶段实现完整功能。
    - **最小验收**: 评估文档输出 go/no-go 结论。

## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
