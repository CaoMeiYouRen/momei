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

### 第五十四至第六十七阶段深度归档

第五十四至第六十七阶段的完整正文已迁入区间归档分片，主窗口仅保留阶段摘要表与最近阶段归档结论。

详见 [roadmap-phases-54-67.md](./archive/roadmap-phases-54-67.md)。

### 第五十四至第六十七阶段概览（已审计归档）

> 以下十四阶段的完整正文已归档至 [archive/roadmap-phases-54-67.md](./archive/roadmap-phases-54-67.md)；各阶段详细条目与验收结论见 [待办事项归档](./todo-archive.md) 及各区间分片。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **54** | 2026-07-06 ~ 约 1-2 周 | 1 新 + 4 优化 | CLI/MCP 环节一（CLI +3 / MCP +4）；结构复用深水区（单函数整合 + 逻辑重复检测脚本）；ESLint/类型债规则债 inventory 脚本 + 3 组窄切片；测试有效性第二轮 6 断言；脚本治理 eslint-debt 升格 |
| **55** | 2026-07-07 ~ 约 1-2 周 | 2 新 + 3 优化 | CLI/MCP 阶段二（4 组 REST + 灵感转文章 + 版本接口，CLI +15 / MCP +16）；AI 降级 fallback 链；结构复用逻辑重复 2 组收敛；ESLint/类型债 3 组窄切片（消除 22 处）；测试有效性第三轮 7 断言 |
| **56** | 2026-07-13 ~ 约 1 天（实际交付周期） | 1 重构 + 1 新 + 3 优化 | 共享 API 客户端库（`packages/api-client` + 29 测试，CLI/MCP 移除 axios）；CLI 导出命令（`momei export`）；ESLint/类型债 3 组窄切片；结构复用 2 组热点；测试有效性第四轮 6 断言 |
| **57** | — | 2 新 + 3 优化 | 迁移体验增强（本地图片自动上传 + `updatedAt` 元数据扩展）；测试有效性第五轮（4 模块补测）；ESLint/类型债 3 组窄切片；结构复用主线延期至第五十八阶段 |
| **58** | 2026-07-20 ~ 2026-07-22（3 天，密集交付） | 2 新 + 3 治理 | MCP HTTP 传输；RSS 订阅链接美化；api-client 类型收敛 2 组；ESLint/类型债治理循环关闭（NO_EXPLICIT_ANY 全清零 + 全量基线报告）；测试有效性第六轮 12 断言 |
| **59** | 2026-07-22 ~ 2026-07-23（2 天，密集交付） | 2 新 + 1 修复 + 2 优化 | AI 编辑增强改写 + 审查（6 风格 + 缓存）；近期热门文章列表；Demo Banner 暗色修复；E2E CI 限流修复 + 共享构建架构；覆盖率 90%+ 首批（8 文件 ≈+1.09%） |
| **60** | 2026-07-23 ~ 约 3-4 天 | 1 编辑增强 + 1 新 + 3 治理 | AI 续写；Hugo 格式支持（`ContentParser` + `HugoParser` + `--format hugo`）；reactive→ref Step 1（5 文件）；Zod Schema 复用首批；覆盖率 90%+ 第二批（69 测试 / 3 AI Provider） |
| **61** | 2026-07-24（密集交付） | 1 新 + 4 优化 | AI 扩写 + 缩写（端点 + 工具栏 + 计费）；CLI 包类型收敛 + 共享函数抽取；reactive→ref Step 2（9 处）；覆盖率 90%+ 第三批（4 模块）；Zod Schema 复用第二批 |
| **62** | 2026-07-24 ~ 约 3-4 天 | 1 新 + 4 优化 | WordPressParser（WXR）；覆盖率 90%+ 第四批（4 纯函数至 100%）；AI 编辑视角 / 读者视角检查；reactive→ref Step 3（6 处深层）；脚本治理 warning 清理 |
| **63** | 2026-07-26 ~ 约 3-5 天 | 5 优化 | 设置表单 UI Phase 1（缺口清单 + 5 映射）；reactive→ref Step 4（5 处）；结构复用 2 组（`getErrorDetail` + 编辑器面板 SCSS）；覆盖率 90%+ 第五批（22 测试）；翻译质量审计（10 项修复） |
| **64** | — | 5 优化 | 设置表单 UI Phase 2（5 字段 + 五语种）；reactive→ref Step 5（收尾）；结构复用 2 组（`safeDeleteCategory` + `handleExternalLinkError`）；覆盖率第六批（privacy 边缘 case）；ko-KR/ja-JP 文档治理 |
| **65** | 2026-07-27 ~ 2026-07-28 | 4/5 交付 | 编辑器工具栏收敛 Phase A（5 入口分组）；设置表单 UI Phase 3（5 控件 + `ExternalFeedSourcesEditor`）；结构复用 1 组；simple-duplicates 升格评估（Go）；覆盖率第七批未达 ≥1% 目标转长期治理；修复 vitest threads 竞态 + 新增 `regression-weekly.yml` |
| **66** | 2026-08-07 ~ 约 3-5 天 | 5 优化 | 编辑器工具栏 Phase B（风格扩展）；设置表单 UI Phase 4（AI Fallback 3 项）；覆盖率 90%+ 第八批（58 用例，Statements 80.63% 达标）；结构复用 theme 颜色 model 抽取；comment-drift 升格复核（Go） |
| **67** | 2026-09-19 ~ 待定（按里程碑滚动，不预设结束日） | 1 迁移 + 3 使能 | caomei-ui 接入基座（重锚 0.2.0 + `keyCss` 配额回落）；三层视觉验证回归基座（独立截图工程 + 6 张基线 + CI job）；全局 token 语义层桥接（unlayered `html:root` + 级联契约守卫）；B2 试点页 `/admin/comments` 整路由迁移（在册族零残留守卫 + 差异逐项归因） |

### 第六十七阶段归档结论（最近归档阶段）

**审计结论**: 第六十七阶段四条主线已在实现代码、测试、脚本与规划文档中完成闭环。接入基座已完成 `caomei-ui@0.2.0` 重锚（`theme.css` 注入点唯一、`keyCss` 配额回落 70KB 并刷新基线）；三层视觉验证回归基座已落地为独立截图工程（6 张基线 + 假阳性/假阴性双向验证 + CI `visual` job，初期 `continue-on-error`）；全局 token 语义层桥接以 **unlayered `html:root`** 落地并配级联契约守卫；B2 试点页 `/admin/comments` 完成整路由切换（在册组件族零残留守卫、三层回归、视觉差异逐项归因）。阶段内一并产出「共享壳过渡组件替换清单」与「上游 caomei-ui 反馈问题清单」。`pnpm lint` / `typecheck` / `test` / `test:visual` / `test:perf:budget` 与定向 E2E 均通过；E2E `auth-session-governance` 的 firefox 导航超时已用 HEAD 构建对照复现，判定为既有 flaky 而非本阶段回归。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块。

> 后续阶段轨迹（方案 A，已授权方向，未展开规划）见 [迁移方案 §7](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) 与 backlog 长期主线「UI 组件库许可证风险与迁移可行性治理」；各阶段范围须在其准入时按规划规范单独评估，本阶段不提前落盘其原子条目。`caomei-ui@0.3.0` 已于 2026-09-24 发布且无破坏性变更，为目标基线；升级与基线复测登记为该主线的待执行条目。


### 第六十八阶段：PrimeVue → caomei-ui 迁移（二）——0.3.0 基线复测与 B2 数据页全量（Phase 68: PrimeVue to caomei-ui Migration II — 0.3.0 Baseline Re-measurement & B2 Data Pages）（规划中）

**时间表**: 2026-09-26 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 承接 backlog 长期主线第 10 条「UI 组件库许可证风险与迁移可行性治理」的第二阶段切片，把迁移从「试点验证」推进到「数据页批量落地」：先完成 `caomei-ui@0.3.0` 升级与基线复测（消除目标基线与口径冲突），再按路由整体切换推进 B2 剩余数据列表页（10 个 `pages/admin` 路由 + 组件型目标与 host 路由），同时以第九批补测维持覆盖率主线的治理节奏。B3 表单与设置、浮层类合并第六十九阶段，B4 收尾与 PrimeVue 卸载为第七十阶段。

**准入结论**: 四条主线来自 [迁移方案 §7](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)、backlog 长期主线第 10 条（含 `0.3.0` 升级待执行条目）与第 1 条，阶段构成经用户 2026-09-26 确认（构成方案 A），容量 `4` 项符合规划规范。与迁移方案 §5.5 原预写口径（六十八 = B2 剩余 + B3）的偏离已显式记录：按试点耗时画像（1 页 + 基建即占满第六十七阶段），B2 剩余与 B3 同期会违反阶段聚焦，B3 与浮层类合并第六十九阶段；§5.5 明示批次划分在本阶段准入时单独评估，本结论即该评估输出。同时，原「方案 A 三阶段轨迹」经本次准入重划分为第六十七 ~ 第七十阶段四段（67 基座与试点 / 68 0.3.0 复测与 B2 / 69 B3 与浮层 / 70 B4 收尾与 PrimeVue 卸载），内容总量不变、仅拆分粒度变化。

**准入前置（已核对 2026-09-26）**: 第六十七阶段已审计归档、`todo.md` 无残留、工作区清洁检查（`docs:check:source-of-truth` / 归档一致性）通过；`caomei-ui@0.3.0` 已于 2026-09-24 发布且无 `BREAKING CHANGES`；共享壳过渡组件替换清单（迁移方案 §5.5）与上游反馈清单已产出。

**ROI 评估**: `0.3.0` 升级与基线复测 `3.00`；B2 剩余数据页（一）`1.80`；B2 剩余数据页（二）`1.60`（两条按 B2 剩余整体 `1.80` 评估后拆分估值）；覆盖率第九批 `2.30`。全部达到规划规范 §3.3 优先进入阈值。

**长期主线容量说明**: 迁移主线占阶段主要容量；仅上收测试覆盖率第 1 条一个治理切片。结构复用 / 国际化 / 注释治理 / Postgres 等主线本期不上收新切片，由 `pnpm regression:weekly` 保持不回退。

1. **主线：caomei-ui 0.3.0 升级与基线复测（backlog #10 待执行条目上收）（P1）**:

    - **执行范围**: `caomei-ui` 由 `0.2.0` 精确锁定升级到 `0.3.0`（保持精确锁定、不加 `^`）；升级前先读 `0.3.0` 的 `BREAKING CHANGES` 并留阅读记录（已知无破坏性变更，仍不得静默升级）；重跑视觉回归（`pnpm test:visual`）与定向测试（路由迁移守卫单测、试点页 `/admin/comments` 相关单测 / E2E）；重测 `keyCss` 并按需刷新 `.github/perf/bundle-baseline.json`（数值变更须脚本 `BUDGETS` / 基线 JSON / [性能规范](../standards/performance.md) 三处联动）；澄清基线口径——「零 caomei 组件消费」表述与 B2 试点页已消费 5 个组件的事实冲突，按实测口径改写；组件消费清单按 `0.3.0` 口径重数。
    - **非目标**: 不迁移新页面；不连带其他依赖升级；不改动包体其他阈值。
    - **最小验收**: `package.json` / `pnpm-lock.yaml` 中 `caomei-ui` 为 `0.3.0` 精确锁定且无 `file:` 形态；视觉回归与定向测试通过并在回归记录留痕；`keyCss` 实测值与基线 JSON 一致、口径表述已修正；`pnpm test:perf:budget` 不越线；`pnpm typecheck` + `pnpm lint` 通过。
    - **证据落点**: `BREAKING CHANGES` 阅读结论、升级记录、`keyCss` 复测数据写入 `docs/reports/regression/current.md`；基线 JSON 与口径表述修正落对应文件。

2. **主线：B2 剩余数据页迁移（一）`pages/admin` 数据列表页（backlog #10）（P1）**:

    - **执行范围**: 按路由整体切换迁移 `pages/admin/posts`、`users`、`friend-links`、`submissions`、`subscribers`、`waitlist`、`external-links`、`ad/campaigns`、`ad/placements`、`migrations/link-governance` 共 10 个数据列表路由；新增共享壳过渡组件 `AppAvatarV2`（users / subscribers 用）与 `AppUploaderV2`（friend-links 用），按迁移方案 §5.5 过渡策略以路由择库实现；`pages/admin/posts` 的 3 个跨路由共享组件按 §5.5 处置——`post-audit-badge` 的在册族依赖（`Tag`）以过渡组件 + 路由择库隔离，`post-audit-dialog` / `publish-push-dialog` 属浮层显式豁免、维持 PrimeVue 至第六十九阶段；`users` 路由自有组件族（filters / role-dialog / ban-dialog / sessions-drawer）随该路由迁移；各路由登记 `CAOMEI_UI_ROUTE_PREFIXES` 并扩面 `tests/modules/ui-library-route-migration-guard.test.ts` 守卫；同步改写相关测试与 mock。
    - **非目标**: 不迁移 `/admin/posts/[id]` 编辑器路由；不做 settings 族组件（随 B3）；不处理浮层类（Dialog / Drawer / Popover / DropdownMenu / `ConfirmDeleteDialog` / `useConfirm` / `v-tooltip`，留第六十九阶段）；不做图标全量替换；不卸载 PrimeVue。
    - **最小验收**: 各路由「批次在册组件族」零残留守卫通过且至少使用一个 caomei-ui 组件；共享壳按过渡组件路由择库口径无混用；逐页功能回归通过（排序 / 分页 / 选择 / 列插槽）；三层视觉回归通过且截图差异逐项归因（不属于迁移方案 §6.3 有意差异者不得静默出现）；`pnpm typecheck` + `pnpm lint` + `pnpm lint:css` 通过；定向单测与相关 E2E 通过。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单（含过渡组件路由择库登记）；视觉回归归因记录写入 `docs/reports/regression/current.md`。

3. **主线：B2 剩余数据页迁移（二）组件型目标与 host 路由（backlog #10）（P1）**:

    - **执行范围**: `components/admin/admin-taxonomy-page.vue`（host `/admin/categories` + `/admin/tags`）、`components/admin/ai/task-list.vue`（host `/admin/ai`）、`components/admin/marketing-campaign-list.vue`（host `/admin/marketing`）随各自 host 路由整路由迁移；若目标页涉及试点在册清单外的组件族（如 `Tabs`），先在迁移方案 §5.5 在册清单登记并同步守卫口径后方可迁移；含路由登记、守卫扩面、相关测试与 mock 改写。
    - **非目标**: 同条目 2 的浮层 / settings / 图标 / 卸载豁免；不迁移 host 路由之外的页面。
    - **最小验收**: 同条目 2（在册族零残留守卫、无混用、三层回归差异逐项归因、质量门通过）。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单；视觉回归归因记录。

4. **治理：测试覆盖率第九批（backlog #1）（P2）**:

    - **执行范围**: 从 `server/services/` 低覆盖模块中选 3-5 个补测（优先候选：`friend-link.ts` 73.06%、`notification.ts` 70.10%、`post-distribution.ts` 75.31%、`upload.ts` 74.85%；`ai/task-detail.ts` 28.57% 与 `external-feed/cache.ts` 50.00% 经缺口报告标记低收益 / 排除（体量过小），仅在优先候选不足 3-5 个时作为边界候选评估），失败 / 边界断言优先，不做低价值铺量。
    - **非目标**: 不追求全仓 `90%+` 一步到位；不为覆盖率重构被测模块。
    - **最小验收**: 目标模块覆盖率显著提升（各 +15pp 以上或达 85%+）；全仓 Statements 以 `80.63%` 为基线目标提升 ≥1pp，未达 ≥1pp 时显式记录原因并转长期治理；新增用例含失败 / 边界断言；`pnpm typecheck` + `pnpm lint` + 定向 `pnpm test` 通过。
    - **证据落点**: coverage 数值与模块清单写入 `docs/reports/regression/current.md`；backlog 长期主线第 1 条基线随阶段归档同步。

**回滚边界**:

- 条目 1：版本锁定回退 `0.2.0` 并还原 `pnpm-lock.yaml` 与基线 JSON 即可，无业务代码改动。
- 条目 2 / 3：逐路由独立回滚——路由前缀从 `CAOMEI_UI_ROUTE_PREFIXES` 移除并 `git revert` 该路由改动即可切回 PrimeVue；过渡组件随其消费者路由同进退。
- 条目 4：测试文件独立可删，不影响业务代码。

## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
