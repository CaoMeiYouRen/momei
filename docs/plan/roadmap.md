# 墨梅博客 - 项目计划

本文档展示了项目的发展蓝图。具体的任务执行状态请参阅 [待办事项](./todo.md) 及 [待办归档](./todo-archive.md)，长期规划与积压项请参阅 [backlog.md](./backlog.md)。


## 深度归档索引

- 第一至第十阶段： [archive/roadmap-phases-01-10.md](./archive/roadmap-phases-01-10.md)
- 第十一至第二十一阶段： [archive/roadmap-phases-11-21.md](./archive/roadmap-phases-11-21.md)
- 第二十二至第四十一阶段： [archive/roadmap-phases-22-24.md](./archive/roadmap-phases-22-24.md)、[archive/roadmap-phases-25-31.md](./archive/roadmap-phases-25-31.md)、[archive/roadmap-phases-32-41.md](./archive/roadmap-phases-32-41.md)
- 第四十二至第五十三阶段： [archive/roadmap-phases-42-53.md](./archive/roadmap-phases-42-53.md)
- 深度归档治理索引： [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档现在只保留项目概况、近线阶段窗口、当前规划与归档索引。
- 第一至第五十三阶段的完整正文已迁入区间归档分片，避免旧阶段长期挤占当前阅读面。
- 后续若近线窗口再次膨胀，继续按 [archive/index.md](./archive/index.md) 的区间分片规则向深度归档推进。
### 第二十二至第二十四阶段深度归档

第二十二至第二十四阶段的完整正文已迁入区间归档分片：
- 第二十二阶段：质量有效性与创作编排治理深化（已归档）
- 第二十三阶段：全球触达扩展与运行时稳态治理（已归档）
- 第二十四阶段：质量守线与回归执行深化（已归档）

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
| **34** | 2026-05-04 | 1 新 + 4 优化 | TTS 前端直连回填；coverage 80%+ 达成（Lines 80.03）；ESLint post-access.ts 收敛；isRecord/isPlainRecord 类型收敛；文档门禁候选入口 |
| **35** | 2026-05-17 | 1 新 + 4 优化 | AI task 计量口径校准（estimated/actual 独立聚合）；Postgres 首页热点读（移除前置 settings 查询）；ESLint 第三组窄切片；MaybeReactive 类型收敛；注释治理 locale.ts + 1-auth.ts |
| **36** | 2026-05-17 | 0 新 + 2 优化 | 运行时稳态修补（修复 public settings 503 影响范围）；Postgres 公开列表查询字段裁剪 |
| **37** | 2026-05-20~25 | 1 新 + 4 优化 | Windows 本地性能治理（Nitro 收窄/PWA 关闭/量化基线）；Postgres 长窗口复核（连接阻塞已消失）；ESLint/结构复用继续 |
| **38** | 2026-05-27~28 | 1 新 + 2 优化 | 分发一致性修补（B/Memos 标签标准化+尾注拼装）；ESLint text.ts 收敛；结构复用 admin 列表页 |
| **39** | 2026-05-29~30 | 1 新 + 1 优化 | 微信排版预览（Markdown→WeChat 实时预览）；治理脚本基线化（5 组 governance 脚本） |
| **40** | 2026-05-30~06-01 | 0 新 + 6 优化 | 发布前 pre-check 统一化；TypeORM 升级评估 No-Go 结论；守护策略分级；文档证据自动回填 |
| **41** | 2026-06-01~03 | 0 新 + 5 优化 | TypeORM 前置清障（select: string[]→对象语法）；Postgres archive 字段裁剪；文档门禁 warning 压缩；结构复用 2 组热点；ESLint 四组窄切片（26 文件 warning=0） |

### 第四十二至第五十三阶段深度归档

第四十二至第五十三阶段的完整正文已迁入区间归档分片，主窗口仅保留阶段摘要表。

详见 [roadmap-phases-42-53.md](./archive/roadmap-phases-42-53.md)。

### 第四十二至第五十三阶段概览（已审计归档）

> 以下十二阶段的完整正文已归档至 [archive/roadmap-phases-42-53.md](./archive/roadmap-phases-42-53.md)，详细验收结论另见 [待办事项归档](./todo-archive.md)。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **42** | 2026-06-03~约 2 周 | 1 新 + 4 优化 | AI 内容审计（评分徽章+审计报告 24h 缓存+行级权限）；内容日历（月/周日历+看板拖拽+PATCH 管线）；CWV 基线脚本+图片懒加载；ESLint 三组窄切片；结构复用三组热点 |
| **43** | 2026-06-05~约 2 周 | 1 新 + 4 优化 | AI 多格式复用（Twitter Thread+LinkedIn）；ESLint 三组窄切片；结构复用 commercial-link-manager 自重复提取；Windows 性能确认平台级瓶颈上收关闭；i18n 四组链路纳入 runtime 回归 |
| **44** | 2026-06-06~07 | 1 新 + 1 评估 + 3 优化 | 友链 RSS 聚合（抓取+缓存+降级）；隐私分析评估（Umami → Go）；ESLint 三组+结构复用两组+CWV 首轮优化 |
| **45** | 2026-06-07~约 2 周 | 1 新 + 1 评估 + 3 优化 | Umami Phase 1 核心集成（SettingKey+插件+设置页+5 i18n）；Digital Garden 评估（No-Go）；文档治理收口（19 份归档）；ESLint require-await+any；结构复用 categories/tags 模板统一 |
| **46** | 2026-06-08~约 2 周 | 1 新 + 5 优化 | Umami Phase 2 部署化（Docker Compose+脚本+文档）；ESLint 4 组（app.vue+settings defineModel 收敛）；结构复用 3 组；覆盖率 82%+；回归调研；脚本文档同步 |
| **47** | 2026-06-10~约 2 周 | 0 新 + 6 优化 | ESLint 6 处 as any 收敛；结构复用 2 组（FeedItem+TitleSuggestionOverlayRef）；页面/API 路径规范冻结；admin 路由风格首批迁移；未使用 API 清单；Schema 覆盖率分层 |
| **48** | 2026-06-11~13 | 0 新 + 5 优化 | ESLint 9 处 as any 清零；结构复用 5 组（4 类型统一+formatDate）；Schema 8 端点 full+测试；7 端点安全删除；第二轮调研 |
| **49** | 2026-06-13 | 0 新 + 5 优化 | Postgres 流量治理（减列+缓存+移除 author.email）；formatDate 8→4；测试回填+清理+type 收敛 12→11 |
| **50** | 2026-06-13~14 | 1 新 + 4 优化 | PWA 启用（SW+Manifest+离线）；API 测试分层固化+4 样板迁移；i18n 首屏修复 3 raw key；backlog 深度压缩；博客环评估（Go） |
| **51** | 2026-06-16~约 2 周 | 0 新 + 5 优化 | types/utils 边界收敛 3 样本迁移；跨包复用评估文档（Go）；ESLint 5 组（11 as any 收敛）；结构复用 5 组；backlog 10 条主线状态同步 |
| **52** | 2026-06-23~28 | 0 新 + 4 优化 + 1 评估 | 脚本 warning 清理+eslint-debt 升格 weekly；文档归档审计+阈值收紧评估（Go）；移动端 CWV 基线采集；i18n runtime 扩面；测试有效性 5 失败断言 |
| **53** | 2026-06-29~07-04 | 0 新 + 4 优化 + 1 评估 | Vercel CDN Tier 2（ISR/SWR+Upstash Redis）；文档阈值收紧（must-sync 21 天）；ESLint 3 as any 清零；结构复用 5 组（基线 0.39%→0.24%）；AI 编辑评估（条件性 Go） |

### 第五十四阶段：CLI/MCP 复用与治理深水区（CLI/MCP Reuse & Governance Deepwater）

**时间表**: 2026-07-06 ~ 约 1-2 周
**目标**: 在第五十三阶段完成 Vercel CDN 缓存架构治理后，以「1 个新功能 + 4 个优化」组合推进：CLI/MCP API 客户端复用优化作为用户明确需求的轻量新增能力，结构复用治理进入深水区（文件整合 + 逻辑重复排查），ESLint 补规则债 inventory 脚本为长期治理奠基，测试有效性延续 Phase 52 节奏，脚本治理承接 Phase 52 评估结论完成升格评估。

**准入结论**: 五条主线均来自用户明确需求或 backlog 长期主线，容量控制在 `5` 项内，符合规划规范。CLI/MCP 复用阶段一工作量小（2-3h）、风险低；结构复用进入深水区需要新的治理脚本支撑；ESLint 补 inventory 脚本为长期治理的事实源；测试有效性延续 Phase 52 节奏；脚本治理承接 Phase 52 评估结论。

**ROI 评估**: CLI/MCP 复用 `2.00`；结构复用深水区 `1.80`；ESLint/类型债 `1.50`；测试有效性 `1.50`；脚本治理升格 `1.60`。

1. **主线：CLI 与 MCP 包 API 客户端代码复用优化 — 阶段一（P1）**:
    - **执行范围**: 补齐两个包缺失的接口（CLI +3, MCP +4），统一 API 方法覆盖。CLI 新增：`listPosts()`、`updatePost()`、`deletePost()`；MCP 新增：`validateImportPost()`、`dryRunLinkGovernance()`、`applyLinkGovernance()`、`getLinkGovernanceReport()`。
    - **非目标**: 不提取共享包（留到后续阶段）、不新增外部接口。
    - **最小验收**: 两个包 API 方法覆盖率达到 100%；`pnpm typecheck` + `pnpm lint` 通过。
    - **详细方案**: [CLI 与 MCP 包 API 客户端代码复用优化方案](../design/governance/cli-mcp-api-client-reuse.md)

2. **主线：结构复用治理深水区 — 文件整合 + 逻辑重复排查（P1）**:
    - **执行范围**:
        - **文件整合**: 将单函数单文件的工具函数按功能/模块整合，减少文件碎片化。目标：将 `utils/` 下的单函数文件（如 `isPlainRecord.ts`、`isRecord.ts`）按功能域合并（如 `utils/type-guards.ts`、`utils/format.ts`）。
        - **逻辑重复排查**: 在 `jscpd` 行级重复检测基础上，新增逻辑重复检测能力。检测"不同函数名但逻辑相似"、"重复导入后轻包装"、"相似参数组合 + 相似处理流程"的情况。
        - **写法优化**: 对识别出的逻辑重复，评估是否可以抽象为高阶函数或策略模式。
    - **非目标**: 不推动跨模块大重构、不为复用而复用、不改变业务行为。
    - **最小验收**: ≥3 组单函数文件完成整合（文件数减少 ≥3）；逻辑重复检测脚本原型输出（至少覆盖 `utils/` 和 `server/utils/`）；≥2 组逻辑重复完成抽象收敛；`pnpm duplicate-code:check` 基线不反弹。

3. **主线：ESLint / 类型债治理 — 规则债 inventory 脚本 + ≥3 组窄切片（P1）**:
    - **执行范围**: 先补规则债 inventory 脚本（覆盖 `no-explicit-any`、`no-non-null-assertion`、warning 基线与目录分桶），再完成 ≥3 组独立窄切片。复用现有 `governance:audit:eslint-debt` 脚本基础结构。
    - **非目标**: 不扩写为全仓 `any` 清零、不引入新规则族。
    - **最小验收**: inventory 脚本输出 JSON baseline；≥3 组窄切片完成并通过定向验证；`pnpm governance:audit:eslint-debt` 显示 delta 可对照。

4. **主线：测试有效性第二轮切片（P1）**:
    - **执行范围**: 补组件层 direct TTS 失败映射断言、页面级 auth degradation 场景断言、`settings public` 或 `friend-links` 的失败口径断言。
    - **非目标**: 不做 coverage 数字冲刺、不做低价值全量补测。
    - **最小验收**: ≥5 个新增失败路径断言；覆盖 ≥2 个模块；全仓 coverage 基线不回退。

5. **主线：脚本治理 — 治理脚本升格评估与 warning 清理（P1）**:
    - **执行范围**: 基于 Phase 52 评估结论，将 `governance:audit:simple-duplicates`、`governance:audit:eslint-debt`、`governance:audit:comment-drift` 从独立 baseline 评估是否升格进入 `regression:weekly` warning 面；清理 `audit-comment-drift` 的误报与 warning 面，清理两条 docs candidate 的 warning。
    - **非目标**: 不新增脚本、不改脚本 API、不引入新的治理基线。
    - **最小验收**: ≥1 个治理脚本完成升格评估并输出明确 go/no-go 结论与理由；`audit-comment-drift` 误报与 warning 面可见下降；两条 docs candidate 产出清洁输出。

**审计结论**: 第五十四阶段五条主线已在实现代码、测试、脚本与规划文档中完成闭环。CLI/MCP API 客户端复用优化已完成阶段一（CLI +3, MCP +4 接口）；结构复用治理深水区已完成单函数文件整合（类型守卫、杂项函数）与逻辑重复检测脚本，逻辑重复收敛待下一阶段继续；ESLint/类型债治理已完成规则债 inventory 脚本与 3 组窄切片（types/marketing.ts、server/api/categories/slug/[slug].get.ts、server/api/snippets/index.post.ts）；测试有效性第二轮切片已完成 6 个新增失败路径断言（TTS 4 个、settings 1 个、friend-link 1 个）；脚本治理已完成升格评估（eslint-debt 升格到 regression:weekly）与 comment-drift 误报修复（URL scheme 过滤器）。typecheck + lint 通过，Code Auditor 审计问题已修复并提交。`todo.md` 已清理、`todo-archive.md` 阶段归档块将在本阶段收口时补入。

> 详细条目见 [待办事项](./todo.md)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第五十五阶段：AI 降级与接口扩展（AI Fallback & API Expansion）（已审计归档）

**时间表**: 2026-07-07 ~ 约 1-2 周
**目标**: 在第五十四阶段完成 CLI/MCP 阶段一与治理深水区后，以「2 个新功能 + 3 个优化」组合推进：CLI/MCP 外部接口扩展作为用户明确需求的延续，AI 功能备用路线与自动降级提升 AI 可用性，三条优化延续治理节奏（结构复用逻辑重复收敛、ESLint/类型债窄切片、测试有效性第三轮）。

**准入结论**: 五条主线均来自用户明确需求或 backlog 长期主线，容量控制在 `5` 项内，符合规划规范。CLI/MCP 阶段二延续 Phase 54 工作；AI 降级为 backlog #12 已验证候选；结构复用、ESLint 和测试有效性延续治理节奏。Vercel CDN 相关优化因计划迁移 Docker 部署而延期。

**ROI 评估**: CLI/MCP 外部接口扩展 `1.80`；AI 功能备用路线 `1.70`；结构复用逻辑重复收敛 `1.60`；ESLint/类型债治理 `1.50`；测试有效性第三轮 `1.50`。

1. **主线：CLI/MCP 阶段二 — 新增外部接口（P1）**:
    - **执行范围**: 基于 Phase 54 阶段一已完成的接口补齐，新增高优先级外部接口：分类管理（`GET/POST/PUT/DELETE /api/external/categories`）、标签管理（`GET/POST/PUT/DELETE /api/external/tags`）、灵感管理（`GET/POST/PUT/DELETE /api/external/snippets`）、灵感转文章（`POST /api/external/snippets/[id]/convert`）、文章版本（`GET/POST /api/external/posts/[id]/versions`）。CLI 和 MCP 包同步实现对应客户端方法。
    - **非目标**: 不暴露管理后台全部接口，只暴露适合外部集成的子集。
    - **最小验收**: 新增 ≥15 个外部接口；所有接口有 Zod schema 验证；CLI 和 MCP 包方法覆盖率达到 100%；接口文档更新；`pnpm typecheck` + `pnpm lint` 通过。
    - **详细方案**: [CLI 与 MCP 包 API 客户端代码复用优化方案](../design/governance/cli-mcp-api-client-reuse.md)

2. **主线：AI 功能备用路线与自动降级（P1）**:
    - **执行范围**: 实现 backlog #12 中 P1 项：文本生成备用路线（主提供商失败 → 自动切换备用）和图片生成备用路线（主提供商失败 → 自动切换备用）。新增 `SettingKey.AI_FALLBACK_PROVIDER` 配置项（按类别：text/image），修改 `getAIProvider` 函数支持 fallback 链，实现重试逻辑，记录降级日志。
    - **非目标**: 不改变现有提供商实现、不引入新 AI 提供商、不做负载均衡、不实现 TTS/ASR 备用路线（P2，留后续）。
    - **最小验收**: 主提供商失败时自动切换备用；降级过程对用户透明；降级日志可追踪；所有现有测试通过。

3. **主线：结构复用逻辑重复收敛（P1）**:
    - **执行范围**: 基于 Phase 54 已完成的逻辑重复检测脚本输出，收敛识别出的逻辑重复。重点方向：不同函数名但逻辑相似的函数抽象、重复导入后轻包装的 helper 收敛、相似参数组合 + 相似处理流程的策略模式提取。
    - **非目标**: 不推动跨模块大重构、不为复用而复用、不改变业务行为。
    - **最小验收**: ≥2 组逻辑重复完成抽象收敛；`pnpm duplicate-code:check` 基线不反弹；每组切片给出原始重复点、抽象边界与回滚方式。

4. **主线：ESLint/类型债 — ≥3 组窄切片（P1）**:
    - **执行范围**: 继续「单规则 + 单文件/双文件」窄切片策略，复用 Phase 54 已完成的规则债 inventory 脚本作为 baseline，优先选择命中数多、回滚边界清晰的规则族。
    - **非目标**: 不扩写为全仓 `any` 清零、不引入新规则族。
    - **最小验收**: ≥3 组窄切片完成并通过定向验证；`pnpm governance:audit:eslint-debt` 显示 delta 可对照；`warning=0` 保持。

5. **主线：测试有效性第三轮切片（P1）**:
    - **执行范围**: 延续 Phase 54 节奏，继续围绕已有测试基座但缺少失败/边界覆盖的高风险模块。重点方向：补组件层 AI 失败映射断言、补页面级 auth degradation 场景断言、补 `settings public` 或 `friend-links` 失败口径断言。
    - **非目标**: 不做 coverage 数字冲刺、不做低价值全量补测。
    - **最小验收**: ≥5 个新增失败路径断言；覆盖 ≥2 个模块；全仓 coverage 基线不回退。

**审计结论**: 第五十五阶段五条主线已在实现代码、测试、治理脚本与规划文档中完成闭环。CLI/MCP 阶段二已完成 4 组外部 REST 接口 + 灵感转文章 + 文章版本接口，CLI +15, MCP +16；AI 降级已完成 fallback 链透明切换机制；结构复用逻辑重复收敛已完成 2 组抽象切片（taxonomy-post-count 子查询构建器、post-distribution-wechatsync 泛型 mergeByKey），duplicate-code 基线 0.33% < 1.22%；ESLint/类型债已完成 3 组窄切片（累计消除 22 处 any/non-null-assertion），同步更新 eslint-debt-targets.mjs；测试有效性第三轮已完成 7 个新增失败路径断言，覆盖 3 个模块（AI 编辑器、friend-links、admin settings）。typecheck + lint 通过，Code Auditor 审计问题已修复并提交。`todo.md` 已清理、`todo-archive.md` 已收录本阶段归档块。

> 详细条目见 [待办事项](./todo.md)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第五十六阶段：API 客户端统一与 CLI 导出（API Client Unification & CLI Export）（已审计归档）

**时间表**: 2026-07-13 ~ 约 1 天（实际交付周期）
**目标**: 以「1 重构 + 1 新功能 + 3 优化」组合推进：共享 API 客户端库提取作为本阶段主重构，将 CLI 从 axios 迁移到 fetch 消除两包代码重复；CLI 导出命令填补迁移工具体验缺口；三条优化延续治理节奏（ESLint/类型债窄切片、结构复用治理、测试有效性 server 层错误码覆盖）。

**审计结论**: 第五十六阶段五条主线已在实现代码、测试、治理脚本与规划文档中完成闭环。共享 API 客户端库已完成 `packages/api-client` 包创建、统一 HTTP 客户端（`MomeiHttpClient` + `MomeiApiError`）、7 领域模块迁移、CLI/MCP 两包改造、axios 依赖移除，新增 29 测试；CLI 导出命令已完成 `momei export` 完整实现（Markdown/JSON + Hexo Front-matter + 过滤参数）；ESLint/类型债已完成 3 组窄切片（`submission.ts`、`settings.vue`、`commercial-link-manager.vue`），同步更新 `eslint-debt-targets.mjs`；结构复用治理已完成 2 组热点切片（`prepareSplitContent` + `parseTranslateBody`），duplicate-code 基数 0.30% < 基线；测试有效性第四轮已完成 6 个新增错误路径断言（401/400/404/500），覆盖 2 个模块（translate + tts-task-get）。typecheck 通过，Code Auditor 审计问题已修复并提交。todo.md 已清理、todo-archive.md 已收录本阶段归档块。

> 详细条目见 [待办归档](./todo-archive.md)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第五十七阶段：迁移体验增强与治理续航（Migration UX Enhancement & Governance Continuity）（已审计归档）

> 第五十七阶段已完成归档，详细记录见 [待办归档](./todo-archive.md#第五十七阶段迁移体验增强与治理续航-已完成归档)。结构复用主线因容量限制延期至第五十八阶段。

### 第五十八阶段：HTTP MCP 与展示增强（HTTP MCP & Presentation Enhancement）（已审计归档）

**时间表**: 2026-07-20 ~ 2026-07-22（3 天，密集交付）
**目标**: 以「2 个新功能 + 3 个治理延续」组合推进：MCP HTTP 传输与本体挂载作为基础设施增强，RSS 订阅链接美化作为展示体验优化，三条长期治理主线（结构复用、ESLint/类型债、测试有效性）延续小步快跑节奏。

**准入结论**: 五条主线均来自 backlog 已验证候选或长期主线延续，容量控制在 `5` 项内，符合规划规范。MCP HTTP 已完成设计文档和全部决策确认；RSS 美化范围明确、改动量小（~2h）；三条治理主线均有成熟脚本基线，实施面聚焦且回滚边界清晰。

**ROI 评估**: MCP HTTP 传输与本体挂载 `1.40`；RSS 订阅链接美化 `1.30`；结构复用热点切片 `1.60`；ESLint/类型债窄切片 `1.50`；测试有效性第六轮 `1.50`。

**审计结论**: 第五十八阶段五条主线已在实现代码、测试、设计文档与规划文档中完成闭环。MCP HTTP 传输（`server/plugins/mcp-http.ts` + `server/api/mcp/index.ts`）与 RSS 订阅链接美化（`public/feed-style.css` + `injectRssStylesheet`）两条新功能主线均已交付；结构复用完成 2 组 api-client 类型收敛切片，duplicate-code 基线 0.31% 未反弹；ESLint/类型债完成治理循环关闭（全量 TypeScript 规则基线扫描报告落盘，NO_EXPLICIT_ANY_FILES 目标文件全部清零）；测试有效性第六轮完成 12 个失败路径断言（feed utils 5 + feed-taxonomy-route 3 + MCP endpoint 4）。`pnpm typecheck` + `pnpm lint` 通过，Code Auditor 审计问题已修复并提交。归档记录已写入 todo-archive.md。

### 第五十九阶段：AI 编辑增强与展示优化（AI Editing Enhancement & Display Optimization）（已审计归档）

**时间表**: 2026-07-22 ~ 2026-07-23（2 天，密集交付）
**目标**: 在第五十八阶段完成 HTTP MCP 与 RSS 展示增强后，以「2 个新功能 + 1 个修复 + 2 个优化」组合推进：AI 编辑增强（改写+审查）与近期热门文章列表作为两条新功能，Demo Banner 暗色模式修复为快速修复项，E2E CI 限流修复与测试覆盖率 90%+ 首批作为优化延续。

**准入结论**: 五条主线均来自 backlog 已验证候选或已评估结论，容量控制在 `5` 项内，符合规划规范。AI 编辑增强已在 Phase 53 完成评估（条件性 Go，ROI 1.50），本期选取改写（Rewrite）+ 审查（Review）两个 P1 子功能；近期热门文章基于 post_view_hourly 表聚合，复用现有视图计数架构；Demo Banner 修复为纯 CSS 改动，风险极低；E2E CI 限流修复 + GHA 分片从候选 #17 首阶段升格，三层限流修复（config 规则 + TEST_MODE 守卫 + 精准 match）+ 共享构建与 4 矩阵分片同步落地，预期将 CI 总时间从 ~60min 降至 ~15min；覆盖率提升按 1% 分批渐进。

**ROI 评估**: Demo Banner 暗色模式修复 `2.00`；近期热门文章列表 `1.50`；AI 编辑增强（改写+审查） `1.50`；E2E CI 限流修复 + GHA 分片 `1.80`；测试覆盖率 90%+ 首批 `1.00`。

**审计结论**: 第五十九阶段五条主线已在实现代码、测试、设计文档与规划文档中完成闭环。Demo Banner 暗色模式修复已完成（`37b38773`）；近期热门文章列表已完成（`b7b765d9` + `721a563b` 重构三合一）并同步 i18n 五语种翻译；AI 编辑增强改写+审查已完成（`a4319a9f` + `d1c28283`），支持 6 种风格 + 审查缓存 + Code Auditor Review Gate Pass；E2E CI 限流修复 + GHA 分片已完成三层限流修复与共享构建架构（`b6b567a7` + 后续 5 个 CI 修复 commits），CI 验证依赖外部运行时延迟验证；测试覆盖率 90%+ 首批已完成缺口盘点与两批次 8 文件补测，覆盖改进 ~252 行（≈+1.09%）。`pnpm typecheck` + `pnpm lint` + `pnpm test`（503/504 files, 3958/3959 tests）通过。归档记录已写入 todo-archive.md。

> 详细条目见 [待办归档](./todo-archive.md#第五十九阶段ai-编辑增强与展示优化-已审计归档)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第六十阶段：编辑器延续与代码质量治理（Phase 60: Editor Continuation & Code Quality Governance）

**时间表**: 2026-07-23 ~ 约 3-4 天
**目标**: 在第五十九阶段完成 AI 编辑改写+审查与展示优化后，以「1 个编辑增强 + 1 个新功能 + 3 个治理」组合推进：AI 续写作为编辑器增强的自然延续（提升为 P0），多平台迁移适配器（Hugo 格式）作为迁移体验扩展，响应式状态模型收敛（reactive→ref）与 Zod Schema 复用治理作为代码质量重构，测试覆盖率 90%+ 第二批作为长期治理延续。

**准入结论**: 五条主线均来自 backlog 已验证候选或已评估结论，容量控制在 `5` 项内，符合规划规范。安装引导向导（原候选 #11）经核实已在 `/installation` 完整实现（6 步 Stepper + 6 API 端点 + 中间件守卫），无需重复开发，已从本阶段移除并将 backlog 状态更新为已交付。AI 续写在 Phase 53 评估中已有方案，复用 Phase 59 AI 管线；多平台迁移适配器首轮聚焦 Hugo 格式，边界清晰（仅解析层，不改导入链路）；reactive→ref Step 1 已有完整文件清单与三步计划；Zod Schema 复用已有缺口清单；覆盖率第二批可直接基于 Phase 59 缺口报告推进。

**ROI 评估**: AI 续写 `1.40`；reactive→ref Step 1 `1.60`；Zod Schema 复用首批 `1.60`；测试覆盖率 90%+ 第二批 `1.00`；多平台迁移适配器 `1.50`。

1. **主线：AI 编辑增强 — 续写（P0）**:
    - **执行范围**: 基于 Phase 59 已交付的改写+审查管线，新增续写（Continue）功能。后端新增 `/api/ai/continue` 端点，复用现有 AI 管线与计费体系。前端编辑器工具栏新增"续写"按钮，基于光标位置或选中文本续写内容，支持撤销。
    - **非目标**: 不做扩写/缩写/视角检查（P2，留后续阶段）。
    - **最小验收**: 续写内容在光标处正确插入；支持撤销；计费正确记录；`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过；Code Auditor Review Gate Pass。

2. **主线：响应式状态模型收敛 — reactive→ref Step 1（P1）**:
    - **执行范围**: 选取低风险首批文件（登录页、注册页、权益页、个人设置、安全设置中的 `form`/`errors` 类 `reactive` 对象），逐文件迁移为 `ref<{...}>()`，补齐 `.value` 读取路径。至少完成 5 个文件的迁移。
    - **非目标**: 不追求全仓 reactive 清零；不改动 API 契约或页面交互语义；不在同一阶段重构业务流程与状态模型。
    - **最小验收**: Step 1 目标文件全部迁移完成；`pnpm typecheck` + `pnpm lint` 通过；受影响页面的表单校验/提交/弹窗行为无回归。

3. **主线：Zod Schema 复用治理首批 — Ad Campaign + Ad Placement（P1）**:
    - **执行范围**: 将 Ad Campaign（`campaigns.post.ts` / `campaigns/[id].put.ts`）和 Ad Placement（`placements.post.ts` / `placements/[id].put.ts`）的内联 schema 抽取到 `utils/schemas/ad.ts`，使用共享基对象 + `.partial()` / `.omit()` 派生 update schema。消除 ~25 行重复定义。
    - **非目标**: 不重构已有良好模式（Snippet/ThemeConfig/Agreement/FriendLink）；不改动 API 行为或验证语义。
    - **最小验收**: Ad Campaign/Placement 共享基对象；update schema 通过 `.partial()` 派生；`pnpm typecheck` + `pnpm lint` + 受影响 API 定向测试通过；无 API 行为回归。

4. **主线：测试覆盖率 90%+ 第二批（P2）**:
    - **执行范围**: 基于 Phase 59 缺口报告，选取下一批高价值覆盖缺口模块，推进全仓 coverage +1%。保持测试有效性不退化。
    - **非目标**: 不做低价值铺量补测、不牺牲断言有效性换取数字增长。
    - **最小验收**: 全仓 coverage 提升 ≥1%；`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过。

5. **主线：多平台迁移适配器 — Hugo 格式支持（P2）**:
    - **执行范围**: 抽象 `ContentParser` 接口，调研 Hugo Front-matter 差异（TOML/YAML/JSON），实现 `HugoParser` 适配器。CLI 命令增加 `--format hugo` 参数，复用现有导入链路。新增适配器单元测试覆盖 title/date/tags/categories/content 映射。
    - **非目标**: 不支持 WordPress/Jekyll（留后续阶段）、不做自动格式检测、不改变现有 Hexo 解析行为。
    - **最小验收**: `--format hugo` 参数正确选择 HugoParser；TOML/YAML Front-matter 正确映射到 `ParsedPost`；`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过；Hexo 解析无回归。

**审计结论**: 第六十阶段五条主线已在实现代码、测试、i18n 与规划文档中完成闭环。AI 续写已完成（`697b00a4`），支持光标上下文续写 + Ctrl+Z 撤销 + AI 计费续写类型；响应式状态模型迁移已完成（`d3f7314c`），5 个文件（登录页、注册页、权益页、个人设置、安全设置）从 `reactive` 迁移为 `ref`；Zod Schema 复用治理已完成（`6216fedf`），Ad Campaign + Ad Placement 的 create/update schema 抽取到 `utils/schemas/ad.ts`，共享基对象 + `.partial()` 派生；测试覆盖率 90%+ 第二批已完成（`9cea2f38`），新增 69 个测试覆盖 3 个 AI Provider 模块；多平台迁移适配器 Hugo 格式支持已完成（`6075d073`），新增 `ContentParser` 接口 + `HugoParser` 适配器（TOML/YAML/JSON）+ `--format hugo` CLI 参数 + 17 个单元测试。`pnpm typecheck` + `pnpm lint` + `pnpm test` 全部通过。归档记录已写入 todo-archive.md，多语路线图摘要已同步。

> 详细条目见 [待办归档](./todo-archive.md#第六十阶段编辑器延续与代码质量治理-已审计归档)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第六十一阶段：AI 编辑增强扩展与治理延续（Phase 61: AI Editing Enhancement Extension & Governance Continuation）（已审计归档）

**时间表**: 2026-07-24（密集交付）
**目标**: 在第六十阶段完成编辑器延续与代码质量治理后，以「1 个新功能 + 4 个优化」组合推进：AI 编辑增强扩写+缩写作为候选 #9 的剩余 P2 子功能交付，结构复用治理恢复切片节奏（两阶段未碰），reactive→ref Step 2 延续状态模型收敛路线，测试覆盖率 90%+ 第三批与 Zod Schema 复用第二批作为长期治理延续。

**准入结论**: 五条主线均来自 backlog 已验证候选或已评估结论，容量控制在 `5` 项内，符合规划规范。AI 扩写+缩写复用 Phase 59-60 成熟的 AI 管线（`usePostEditorAI` composable + `TextService`），增量风险低；结构复用从 CLI 包类型收敛和 `toDateOrNull`/`toDateOrUndefined` 抽取入手，边界清晰；reactive→ref Step 2 经 Step 1 已验证迁移模式可行（template 零改动），风险可控；覆盖率第三批基于 Phase 60 最新缺口报告；Zod Schema 第二批为纯清理型重构，无行为变更。

**ROI 评估**: AI 编辑增强（扩写+缩写）`1.20`；结构复用治理 `1.50`；reactive→ref Step 2 `1.40`；测试覆盖率 90%+ 第三批 `1.00`；Zod Schema 复用第二批 `1.30`。

1. **主线：AI 编辑增强 — 扩写+缩写（P2）**:
    - **执行范围**: 基于 Phase 59-60 已交付的改写+审查+续写管线，新增扩写（Expand）和缩写（Condense）功能。后端新增 `/api/ai/expand` + `/api/ai/condense` 端点，复用现有 `TextService` 方法与计费体系。前端编辑器工具栏新增"扩写"和"缩写"按钮，选中文本后调用对应 API，支持撤销。提示词模板复用现有 `AI_PROMPTS` 结构扩展。
    - **非目标**: 不做编辑视角检查 / 读者视角检查（P2，留后续阶段）；不做扩写/缩写的自定义程度调节（如扩写幅度）。
    - **最小验收**: 扩写/缩写端点正确返回 AI 结果；前端按钮触发对应操作；支持 Ctrl+Z 撤销；计费正确记录（`recordTask({ type: 'expand' | 'condense' })`）；`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过；Code Auditor Review Gate Pass。

2. **主线：结构复用治理 — CLI 包类型收敛 + 工具函数抽取（P1）**:
    - **执行范围**: 聚焦 CLI 包（`packages/api-client`、`packages/cli/src/types.ts`）与主项目的类型收敛，以及 `toDateOrNull`/`toDateOrUndefined` 重复函数抽取。至少完成 2 组热点切片：
        - **切片 1**：`MomeiPostStatus`/`MomeiPostVisibility` → 从主项目 `types/post.ts` 的 `PostStatus`/`PostVisibility` 枚举派生，消除 `string` union 重复定义
        - **切片 2**：`MomeiPostScaffoldMetadata` → `PostScaffoldMetadata` 类型别名（保留向后兼容 + `@deprecated` 标记）
        - **切片 3**（可选）：`toDateOrNull`/`toDateOrUndefined` 从 `server/api/admin/ad/campaigns.post.ts` 和 `campaigns/[id].put.ts` 抽取到 `server/utils/date.ts`
    - **非目标**: 不推动跨目录大重构、不为复用而复用、不改动 API 契约与业务行为。
    - **最小验收**: ≥2 组热点切片完成；`pnpm typecheck` + `pnpm lint` 通过；`pnpm duplicate-code:check` 基线不反弹。

3. **主线：响应式状态模型收敛 — reactive→ref Step 2（P1）**:
    - **执行范围**: 在 Step 1（5 文件低风险迁移）已验证模式可行后，推进 Step 2 中风险文件：后台列表页和筛选组件中的 `filters`/`pagination`/`sort`/`dialog` 类 `reactive` 对象。目标文件至少包括：`composables/use-admin-friend-links-page.ts`（4 处）、`pages/admin/users/index.vue`（3 处）、`composables/use-admin-list.ts`（2 处）等。逐文件迁移为 `ref<{...}>()`，补齐 `.value` 读取路径。
    - **非目标**: 不追求全仓 reactive 清零；不触及 Step 3 高风险复合对象（`settings-notifications.vue` 等）；不改动 API 契约或页面交互语义。
    - **最小验收**: ≥5 处 `reactive` 迁移完成；`pnpm typecheck` + `pnpm lint` 通过；受影响页面的筛选/分页/弹窗/排序行为无回归。

4. **主线：测试覆盖率 90%+ 第三批（P2）**:
    - **执行范围**: 基于 Phase 60 最新全仓覆盖率缺口报告，选取下一批高价值覆盖缺口模块（如 `server/services/` 层或 `server/utils/` 层尚未深度覆盖的模块），推进全仓 coverage +1%-2%。保持测试有效性不退化。
    - **非目标**: 不做低价值铺量补测、不牺牲断言有效性换取数字增长。
    - **最小验收**: 全仓 coverage 提升 ≥1%；`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过。

5. **主线：Zod Schema 复用治理第二批 — 清理（P2）**:
    - **执行范围**: 在首批（Ad Campaign + Ad Placement）完成后，推进第二批清理任务：移除 Category/Tag `updateSchema` 中不必要的 `.extend({slug})`（`.partial()` 已覆盖）、将 Post 的 `createdAt`/`publishedAt`/`updatedAt`/`views` 4 字段抽取为共享对象、为 Marketing Campaign 创建 `marketingCampaignUpdateSchema = marketingCampaignSchema.partial()`。
    - **非目标**: 不重构已有良好模式（Snippet/ThemeConfig/Agreement/FriendLink）；不改动 API 行为或验证语义。
    - **最小验收**: Category/Tag `updateSchema` 不再冗余；Post 日期/视图字段共享；Marketing Campaign 独立 update schema 可用；`pnpm typecheck` + `pnpm lint` + 受影响 API 定向测试通过；无 API 行为回归。

**审计结论**: 第六十一阶段五条主线已在实现代码、测试、i18n 与规划文档中完成闭环。AI 编辑增强扩写+缩写已完成（`d980cf69`），后端 `/api/ai/expand` + `/api/ai/condense` 端点、前端工具栏按钮、提示词模板（`AI_PROMPTS.EXPAND` + `CONDENSE`）、AI 计费（`recordTask({ type: 'expand' | 'condense' })`）均以交付；结构复用治理已完成 CLI 包类型收敛（`MomeiPostStatus`/`MomeiPostVisibility` 枚举派生、`MomeiPostScaffoldMetadata` 别名 + `@deprecated`）与 `toDateOrNull`/`toDateOrUndefined` 共享函数抽取（`c3554a17`）；响应式状态模型 reactive→ref Step 2 已完成 9 处迁移（`a5bd2c7b`），覆盖 `use-admin-friend-links-page.ts`、`use-admin-list.ts`、`pages/admin/users/index.vue`；测试覆盖率 90%+ 第三批已完成 4 个高价值模块补测（`cac21db3` + `6d4a940f`），installation.ts 86.84%、comment.ts 86.82%、admin-drafts.ts 92.45%、post-automation-helpers.ts 全覆盖；Zod Schema 复用治理第二批已完成 Category/Tag 冗余清理、Post 4 字段共享、Marketing Campaign updateSchema（`db424e4b`）。`pnpm typecheck` + `pnpm lint` + `pnpm docs:build` 通过，Code Auditor 审计已放行。归档记录已写入 todo-archive.md，多语路线图摘要已同步。

> 详细条目见 [待办归档](./todo-archive.md#第六十一阶段ai-编辑增强扩展与治理延续-已审计归档)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第六十二阶段：迁移适配扩展与治理续航（Phase 62: Migration Adapter Expansion & Governance Continuation）（已审计归档）

**时间表**: 2026-07-24 ~ 约 3-4 天
**目标**: 在第六十一阶段完成 AI 扩写+缩写与治理延续后，以「1 个新功能 + 4 个优化」组合推进：多平台迁移适配器 WordPressParser 作为轻量新增能力（复用 Phase 60 HugoParser 的 `ContentParser` 接口），四条优化延续治理节奏——测试覆盖率 90%+ 第四批、AI 编辑视角/读者视角检查（候选 #9 剩余子功能）、reactive→ref Step 3 高风险复合对象迁移、脚本治理 warning 清理（长期主线 #10）。

**准入结论**: 五条主线均来自 backlog 已验证候选或长期主线，容量控制在 `5` 项内，符合规划规范。WordPressParser 复用已有 `ContentParser` 接口（`packages/cli/src/types.ts`）+ HugoParser 实现模式（`packages/cli/src/hugo-parser.ts`），使用 `fast-xml-parser` 解析 WordPress eXtended RSS (WXR) 格式，增量风险低；AI 视角检查复用现有 `usePostEditorAI` composable + `TextService`，纯增量 P2 子功能；reactive→ref Step 3 经 Step 1+2 已验证迁移模式可行，但涉及 `settings-notifications.vue` 等复合状态对象，回归面较大，需配测试先行；脚本治理为 Phase 52-54 已开面的延续，边界清晰。

**ROI 评估**: 多平台迁移适配器 WordPressParser `1.50`；测试覆盖率 90%+ 第四批 `1.00`；AI 编辑视角/读者视角检查 `1.20`；reactive→ref Step 3 `1.60`；脚本治理 warning 清理 `1.30`。

1. **主线：多平台迁移适配器 — WordPress Parser（P2）**:
    - **执行范围**: 基于 Phase 60 已抽象的 `ContentParser` 接口（`packages/cli/src/types.ts`），实现 `WordPressParser` 适配器，支持解析 WordPress eXtended RSS (WXR) 导出文件中的文章（`item` → `ParsedPost`）。CLI 命令增加 `--format wordpress` 参数，复用现有导入链路。新增适配器单元测试覆盖 title/date/tags/categories/content/slug/draft 映射。
    - **非目标**: 不支持 WordPress REST API 在线导入、不做自动格式检测、不改变现有 Hexo/Hugo 解析行为、不做 WordPress 插件/主题迁移。
    - **最小验收**: `--format wordpress` 参数正确选择 WordPressParser；WXR 中的 title/date/content/tags/categories 正确映射到 `ParsedPost`；`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过；Hexo/Hugo 解析无回归。

2. **主线：测试覆盖率 90%+ 第四批（P2）**:
    - **执行范围**: 基于 Phase 61 最新全仓覆盖率缺口报告，选取下一批高价值覆盖缺口模块（优先 `server/utils/` 层或 `server/api/` 层尚未深度覆盖的模块），推进全仓 coverage +1%~2%。保持测试有效性不退化。
    - **非目标**: 不做低价值铺量补测、不牺牲断言有效性换取数字增长。
    - **最小验收**: 全仓 coverage 提升 ≥1%；`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过。

3. **主线：AI 编辑视角/读者视角检查（P2）**:
    - **执行范围**: 基于 Phase 59-61 已交付的改写+审查+续写+扩写+缩写管线，新增编辑视角检查（Edit Perspective Check）和读者视角检查（Reader Perspective Check）功能。后端新增 `/api/ai/perspective-check` 端点（支持 `mode: 'editor' | 'reader'`），复用现有 `TextService` 方法与计费体系。前端编辑器工具栏新增"视角检查"按钮，选中文本后调用 API 返回结构化建议列表（不自动修改内容），支持撤销。
    - **非目标**: 不自动修改文章内容；不涉及重写/扩写/缩写等生成式操作。
    - **最小验收**: 视角检查端点正确返回结构化建议；前端按钮触发对应操作；计费正确记录；`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过。

4. **主线：响应式状态模型收敛 — reactive→ref Step 3（P1）**:
    - **执行范围**: 在 Step 2（后台列表页 9 处迁移已验证模式可行）后，推进 Step 3 高风险复合对象：`components/settings/settings-notifications.vue`（聚合订阅状态）、`pages/admin/comments/index.vue`、`pages/admin/submissions/index.vue` 中的深层嵌套 `reactive` 对象。按"单文件单切片"推进，每文件配定向测试验证表单校验/提交/弹窗/开关行为不回退。
    - **非目标**: 不追求全仓 reactive 清零；不改动 API 契约或页面交互语义；某文件出问题不阻断其他切片推进。
    - **最小验收**: ≥3 处生产代码 `reactive` 迁移完成（实际 ~15 处剩余中的一部分）；`pnpm typecheck` + `pnpm lint` 通过；受影响页面的表单/弹窗/开关行为无回归（配 ≥10 定向测试）。

5. **主线：脚本治理 warning 清理（P1）**:
    - **执行范围**: 继续 Phase 52-54 已开面的脚本治理工作：清理 `audit-comment-drift` 的 TODO 计数与逐行复述误报、清理 `docs:check:line-count:candidate` 与 `docs:check:source-of-truth:candidate` 两条候选入口的 warning 面。
    - **非目标**: 不新增脚本、不改脚本 API、不引入新的治理基线。
    - **最小验收**: `audit-comment-drift` 的 TODO/漂移计数可见下降；两条 docs candidate 产出清洁输出。

**审计结论**: 第六十二阶段五条主线已在实现代码、测试、i18n 与规划文档中完成闭环。多平台迁移适配器 WordPressParser 已完成（`602326cb`），支持 WXR 格式 title/date/tags/categories/content/slug/draft 映射 + `--format wordpress` 参数 + Hexo/Hugo 无回归；测试覆盖率 90%+ 第四批已完成（`98d5268c`），新增 26 个测试覆盖 4 个纯函数（`toDateOrNull`、`toDateOrUndefined`、`toQueryString`、`toQueryStringArray`）至 100%；AI 编辑视角/读者视角检查已完成（`f48f39b3`），新增 `/api/ai/perspective-check` 端点（`mode: 'editor' | 'reader'`）+ 编辑器工具栏按钮 + `PostEditorPerspectivePanel` 组件 + AI 计费；响应式状态模型 reactive→ref Step 3 已完成（`405825cb`），3 文件 6 处深层嵌套 reactive 迁移（settings-notifications/comments/submissions）+ 11 个定向测试通过；脚本治理 warning 清理已完成（`ab87cd32`），audit-comment-drift TODO 归零 + 逐行复述误报 15→6（-60%）+ docs candidate warning 全部清洁。`pnpm typecheck` + `pnpm lint` + `pnpm test`（4198 passed） + `pnpm docs:build` 全部通过。归档记录已写入 todo-archive.md，多语路线图摘要已同步。

> 详细条目见 [待办归档](./todo-archive.md#第六十二阶段迁移适配扩展与治理续航-已审计归档)；backlog 来源见 [长期规划与积压项](./backlog.md)。

### 第六十三阶段：设置 UI 盘点与治理续航（Phase 63: Settings UI Inventory & Governance Continuation）（已审计归档）

**时间表**: 2026-07-26 ~ 约 3-5 天
**目标**: 在第六十二阶段完成迁移适配扩展与治理续航后，以「5 个优化」组合推进：设置表单 UI Phase 1（盘点映射）作为后台管理体验的前置分析，reactive→ref Step 4 延续状态模型收敛路线（≥5 处），结构复用治理恢复切片节奏，测试覆盖率 90%+ 第五批作为长期治理延续，翻译质量审计（ko-KR/ja-JP）提升 i18n 品质。

**准入结论**: 五条主线均来自 backlog 已验证候选或已评估结论，容量控制在 `5` 项内，符合规划规范。设置表单 UI Phase 1 为纯盘点/映射，不涉及 UI 组件开发，风险极低；reactive→ref Step 4 经前三步已验证迁移模式可行（template 零改动），本次优先筛选/简单类后表单类；结构复用基于 0.39% 健康基线做增量切片；覆盖率第五批基于最新缺口报告推进；翻译质量审计不改变 key 覆盖，仅提升已有翻译的自然度与一致性。

**ROI 评估**: 设置表单 UI Phase 1 `1.60`；reactive→ref Step 4 `1.60`；结构复用治理 `1.50`；测试覆盖率 90%+ 第五批 `1.00`；翻译质量审计 `1.30`。

**审计结论**: 第六十三阶段五条主线已在实现代码、测试、i18n 与规划文档中完成闭环。设置表单 UI Phase 1 已完成缺口清单（Gap A/B 分类）与 5 个新 SettingKey + SETTING_ENV_MAP 映射；响应式状态模型 reactive→ref Step 4 已完成 5 处筛选/表单错误类迁移；结构复用治理已完成 2 组热点切片（`getErrorDetail` 共享抽取 + 编辑器面板 SCSS 共享），duplicate-code 基线 0.35% ≤ 0.39%；测试覆盖率 90%+ 第五批已完成 22 个新增测试覆盖 3 个模块；翻译质量审计已完成 10 项问题修复（ja-JP 5 + ko-KR 5），`i18n:audit:missing = 0` 保持。`pnpm typecheck` + `pnpm lint` + `pnpm test` 全部通过。归档记录已写入 todo-archive.md，多语路线图摘要已同步。

1. **主线：设置表单 UI Phase 1 — 盘点与 SoT 映射补齐（P2）**:
    - **执行范围**: 产出现有配置项的缺口清单（缺口 A：env-only 直读适合加 SettingKey 的；缺口 B：已有 SettingKey 但缺 UI 的）。为 ≥3-5 个适合后台管理的 env var 补充 `SettingKey` + `SETTING_ENV_MAP` 映射。不适合后台管理的（基础设施密钥等）标记 `INTERNAL_ONLY` 并更新 `env.ts` 文档注释。Phase 1 不涉及任何 UI 组件开发。
    - **非目标**: 不做 UI 组件、不改 `FORCED_ENV_LOCKED_KEYS` 安全锁定策略、不做通用 Key-Value 编辑器。
    - **最小验收**: ≥3-5 个 env var 完成 SettingKey + SETTING_ENV_MAP 映射；`env.ts` 注释和 `SETTING_ENV_MAP` 同步更新；`pnpm typecheck` + `pnpm lint` 通过。

2. **主线：响应式状态模型收敛 — reactive→ref Step 4（P1）**:
    - **执行范围**: 在 Step 3（3 文件 18 处深层嵌套迁移已验证模式可行）后，推进 Step 4 剩余生产代码 `reactive()` 迁移。从 8 处剩余中选取 ≥5 处优先迁移：筛选类（`user-filters.vue`、`notification-delivery-log-list.vue`、`waitlist/index.vue`、`subscribers/index.vue`）和简单错误类（`submit.vue`）优先，表单/弹窗类（`admin-taxonomy-page.vue`、`marketing-campaign-form.vue`、`comment-form.vue`）视时间推进。每文件配定向测试验证表单/筛选/弹窗行为不回退。
    - **非目标**: 不追求全仓 reactive 清零；不改动 API 契约或页面交互语义；某文件出问题不阻断其他切片推进。
    - **最小验收**: ≥5 处生产代码 `reactive` 迁移完成；`pnpm typecheck` + `pnpm lint` 通过；受影响页面的筛选/表单/弹窗行为无回归。

3. **主线：结构复用治理 — 下一轮热点切片（P1）**:
    - **执行范围**: 基于 `duplicate-code: 0.39%` 最新基线，识别新的重复热点。优先方向：检查 Phase 62 新增代码（WordPressParser、perspective-check 等）是否引入重复；检查 CLI/MCP 包与主项目间的残留类型/工具函数重复。选取 ≥2 组逻辑简单、收益明确的切片收敛。
    - **非目标**: 不推动跨模块大重构、不为复用而复用、不改变业务行为。
    - **最小验收**: ≥2 组热点切片完成；`pnpm duplicate-code:check` 基线 ≤0.39%；`pnpm typecheck` + `pnpm lint` 通过。

4. **主线：测试覆盖率 90%+ 第五批（P2）**:
    - **执行范围**: 基于最新全仓覆盖率缺口报告，选取 `server/services/` 或 `server/utils/` 层高价值缺口模块。优先选择已有测试基座但覆盖不足的模块，推进全仓 coverage +≥1%。保持测试有效性不退化。
    - **非目标**: 不做低价值铺量补测、不牺牲断言有效性换取数字增长。
    - **最小验收**: 全仓 coverage 提升 ≥1%；`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过。

5. **主线：翻译质量审计 — ko-KR/ja-JP（P2）**:
    - **执行范围**:
        - **Phase A**: 产出翻译质量审计报告。遍历 ko-KR/ja-JP 的 26 个 locale 文件中用户可见模块（home、auth、common、components、public、settings、posts），标记不自然、不一致或机器翻译味重的条目。
        - **Phase B**: 修复审计发现的 ≥10 个问题条目。
        - **Phase C（可选）**: 清理 `i18n:audit:duplicates` 中可合并的 duplicate key 组。
    - **非目标**: 不新增语种、不做全量翻译重写、不改变 key 结构。
    - **最小验收**: 翻译质量审计报告输出；≥10 个问题修复（以 commit 可见）；`pnpm i18n:audit:missing` = 0 保持；`pnpm typecheck` + `pnpm lint` 通过。

### 第六十四阶段：设置 UI Phase 2 与治理续航（已审计归档）

> 详细条目见 [归档记录](./todo-archive.md#第六十四阶段设置-ui-phase-2-与治理续航已审计归档)。backlog 来源: [长期规划与积压项](./backlog.md)。

已完成 5 项主线：设置表单 UI Phase 2（5 字段 + 五语种翻译）；reactive→ref Step 5（3 文件收尾）；结构复用 2 组热点切片（safeDeleteCategory + handleExternalLinkError）；测试覆盖率第六批（privacy 7 边缘 case）；ko-KR/ja-JP 文档治理（审计报告 + 13 日期修复 + ja-JP 升格 + features/variables 翻译）。所有主线通过 typecheck + lint + test 质量门。

## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
