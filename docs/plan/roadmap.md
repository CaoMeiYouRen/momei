# 墨梅博客 - 项目计划

本文档展示了项目的发展蓝图。具体的任务执行状态请参阅 [待办事项](./todo.md) 及 [待办归档](./todo-archive.md)，长期规划与积压项请参阅 [backlog.md](./backlog.md)。


## 深度归档索引

- 第一至第十阶段： [archive/roadmap-phases-01-10.md](./archive/roadmap-phases-01-10.md)
- 第十一至第二十一阶段： [archive/roadmap-phases-11-21.md](./archive/roadmap-phases-11-21.md)
- 第二十二至第四十一阶段： [archive/roadmap-phases-22-24.md](./archive/roadmap-phases-22-24.md)、[archive/roadmap-phases-25-31.md](./archive/roadmap-phases-25-31.md)、[archive/roadmap-phases-32-41.md](./archive/roadmap-phases-32-41.md)
- 第四十二至第五十三阶段： [archive/roadmap-phases-42-53.md](./archive/roadmap-phases-42-53.md)
- 第五十四至第六十七阶段： [archive/roadmap-phases-54-67.md](./archive/roadmap-phases-54-67.md)
- 第六十八阶段： [archive/roadmap-phases-68.md](./archive/roadmap-phases-68.md)
- 第六十九阶段： [archive/roadmap-phases-69.md](./archive/roadmap-phases-69.md)
- 第七十阶段： [archive/roadmap-phases-70.md](./archive/roadmap-phases-70.md)
- 深度归档治理索引： [archive/index.md](./archive/index.md)

## 主窗口保留范围

- 主文档现在只保留项目概况、近线阶段窗口、当前规划与归档索引。
- 第一至第五十三阶段的完整正文已迁入区间归档分片，第五十四至第七十阶段的完整正文已迁入阶段区间分片（主窗口仅保留摘要表与归档结论），避免旧阶段长期挤占当前阅读面。
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

### 第六十七阶段归档结论（已归档）

**审计结论**: 第六十七阶段四条主线已在实现代码、测试、脚本与规划文档中完成闭环。接入基座已完成 `caomei-ui@0.2.0` 重锚（`theme.css` 注入点唯一、`keyCss` 配额回落 70KB 并刷新基线）；三层视觉验证回归基座已落地为独立截图工程（6 张基线 + 假阳性/假阴性双向验证 + CI `visual` job，初期 `continue-on-error`）；全局 token 语义层桥接以 **unlayered `html:root`** 落地并配级联契约守卫；B2 试点页 `/admin/comments` 完成整路由切换（在册组件族零残留守卫、三层回归、视觉差异逐项归因）。阶段内一并产出「共享壳过渡组件替换清单」与「上游 caomei-ui 反馈问题清单」。`pnpm lint` / `typecheck` / `test` / `test:visual` / `test:perf:budget` 与定向 E2E 均通过；E2E `auth-session-governance` 的 firefox 导航超时已用 HEAD 构建对照复现，判定为既有 flaky 而非本阶段回归。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块。

> 后续阶段轨迹（方案 A，已授权方向，未展开规划）见 [迁移方案 §7](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) 与 backlog 长期主线「UI 组件库许可证风险与迁移可行性治理」；各阶段范围须在其准入时按规划规范单独评估，本阶段不提前落盘其原子条目。`caomei-ui@0.3.0` 已于 2026-09-24 发布且无破坏性变更，为目标基线；升级与基线复测登记为该主线的待执行条目。


### 第六十八阶段概览（已审计归档）

> 本阶段完整规划正文（含 2026-10-13 版本口径校正段）已迁入 [archive/roadmap-phases-68.md](./archive/roadmap-phases-68.md)；各条目的执行明细与验收结论见 [待办事项归档](./todo-archive.md) 的第六十八阶段归档块。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **68** | 2026-09-26 ~ 2026-10-22 | 3 迁移 + 1 治理 | caomei-ui 基线与版本口径收口（`0.3.0` 升级与基线复测完成，随后 `0.6.0` 漂移按升级纪律补做）；B2 剩余数据页全量（10 个数据列表路由 + 3 个组件型目标共 4 条 host 路由 + 5 个共享壳过渡组件，`CAOMEI_UI_ROUTE_PREFIXES` 终态 15 项）；覆盖率第九批（4 个 `server/services/` 模块，全仓 Statements 80.45%→81.04%） |

### 第六十八阶段归档结论（已归档）

**审计结论**: 第六十八阶段四条主线已完成并归档，并闭合第六十七阶段归档结论中登记的 `caomei-ui@0.3.0` 升级待执行条目。`caomei-ui` 侧完成 `0.3.0` 升级与基线复测（`keyCss` 口径澄清），并在依赖经 Dependabot 单包路径抬版到 `0.5.0` / `0.6.0` 后按升级纪律补做 `0.4.0~0.6.0` 的 `BREAKING CHANGES` 阅读、组件清单重数（81 项）、三层视觉回归（10/10，零像素差异）与包体复测（`keyCss` 61,311 B / 70KB，未越线）；B2 侧完成 10 个 `pages/admin` 数据列表路由与 3 个组件型目标的 4 条 host 路由整路由迁移（`CAOMEI_UI_ROUTE_PREFIXES` 终态 15 项），落地 `ownedFiles`、路由级在册族增量与子路由例外三项守卫机制，5 个过渡组件均已就位并统一消费 V2（`/admin/posts/[id]` 为唯一剩余 V1 消费者）；覆盖率第九批 4 个模块全部达成「+15pp 或 ≥85%」（`friend-link` 99.26% / `notification` 98.45% / `post-distribution` 91.91% / `upload` 98.80%），全仓 Statements 80.45% → 81.04%、Branches → 70.83%、Lines → 81.15%，全仓 `+1pp` 结构上不可达——候选池 866 条语句占全仓 2.48%，但其**基线未覆盖语句仅约 233 条**（约占全仓 0.67pp），全数闭合仍不足 1pp；原因已按验收条款记录并转长期主线 #1。阶段内另以 B 类插队完成「文档标记完整性门禁」派生修复（`docs:check:markers` 接入 `docs:build` / `docs:dev`）。验证以 2026-10-22 全量为准：`pnpm test` **5012 passed / 1 skipped（566 文件）**、`test:coverage` EXIT 0、`typecheck` / `lint` / `lint:css` 通过，文档四项检查通过；其后提交为依赖升级、安全修复（`95c95fed`，server 侧 Brotli 响应过滤；10 个文件 = 5 测试 + 5 实现）、测试工具链与文档修补，各自独立验证并以 CI 结论为准；业务代码的全量回归基线仍取 2026-10-22 记录。各批 Review Gate 均 Pass（Round 1 / Round 2 的 blocker 已逐项闭环）。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块，`docs/reports/regression/current.md` 的第六十八阶段活动窗口已整体迁入 [归档分片](../reports/regression/archive/2026-10-16-to-2026-10-22-phase68-close.md)。

> 未覆盖边界与后续观察项：① `friend-link` 的 name/url 归一化被 `assignDefined` 覆盖（既有缺陷，已登记 backlog 待跟踪）；② 迁移页的幻影 token、页面注释中的阶段号与浮层 focus 行为随 B3 / B4 收尾统一清理；③ `keyCss` 基线仍沿用 `0.3.0` 批次口径（实测 61,311 B），待 B4 重取（**2026-11-01 更新**：rc.1 升级批次已复测 `keyCss` = 62,382 B（60.92KiB），仍决定**不刷新基线**，交 B4 统一重取（**2026-11-06 轨迹调整**：B4 已切为第七十一阶段路由与图标 / 第七十二阶段 token 切换与卸载，`keyCss` 重取落在第七十二阶段））；④ `caomei-ui` 的 Dependabot `ignore` 须在第七十阶段前配置，阻断静默抬版路径（**2026-11-01 更新**：已上收为第六十九阶段条目 1 的执行范围）。

### 第六十九阶段概览（已审计归档）

> 本阶段完整规划正文已迁入 [archive/roadmap-phases-69.md](./archive/roadmap-phases-69.md)；各条目的执行明细与验收结论见 [待办事项归档](./todo-archive.md) 的第六十九阶段归档块。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **69** | 2026-11-01 ~ 2026-11-03 | 2 迁移 + 1 接线 + 1 治理 | `caomei-ui@1.0.0-rc.1` 精确锁定与 6 个 token 角色桥接（视觉 18/18、parity 34/34、`keyCss` 62,382 B / 70KB）；浮层族整族迁移（Dialog/Drawer/Popover/Menu/ConfirmDialog + 服务层 + `v-tooltip` 84 处 → `AppTooltip`，全仓零残留守卫）；内建文案 locale 接线（5 语种 Paginator 实测、`coreEntryJs` 357.41KB / 360KB）；覆盖率第十批（三模块 statements 90.31% / 95.27% / 93.18%，全仓 80.98% → 81.17%，本批 +0.19pp） |

### 第六十九阶段归档结论（已归档）

**审计结论**: 第六十九阶段四条主线已完成并归档。`caomei-ui` 侧完成 `1.0.0-rc.1` 精确锁定、6 个新 token 角色桥接与 `dependabot.yml` 全量 `ignore`，`control-border` 按上游默认登记为有意偏差，soft 8% 状态文字两态 ≥4.5；浮层族整族迁到 caomei-ui（Dialog 39 / Drawer 3 / Popover 5 / Menu 3 / ConfirmDialog 6 + 185 处 `toast.add` / 18 处 `confirm.require` + 84 处 `v-tooltip`），新增 `AppTooltip` 桥接、`useAnchoredPopover` 与全仓浮层族零残留守卫，视觉 18/18、parity 34/34、critical E2E 三浏览器通过；内建文案接入 `registerLocale` + `CaomeiConfigProvider`，5 语种分页文案跟随语言且无 hydration mismatch；覆盖率第十批闭合 68 条未覆盖语句，全仓 Statements 80.98% → 81.17%（本批 +0.19pp），`+0.3pp` 未达的结构性原因已登记。各批 Review Gate 均 Pass（Round 1–4 的 blocker 已逐项闭环）。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块，回归证据保留在 `docs/reports/regression/current.md`（条目 2 / 3 窗口）与 [回归归档索引](../reports/regression/archive/index.md) 登记的第六十九阶段分片（条目 1 / 4 及 2026-11-02 修复 / 尾段窗口）。

> 未覆盖边界与后续观察项：① `AppTooltip` 嵌在 `DropdownMenuTrigger` / `PopoverTrigger` 的 `as-child` 内时，内层 tooltip 的 `data-state` 会覆盖外层菜单状态（`aria-expanded` / 事件正常，迁移前该底色规则也不作用于 PrimeVue `Button`，已登记为已知偏差）；② `CaomeiDatePicker` 尚无生产使用，日期面板文案只做键级验证，随第七十阶段 B3 实测；③ 入口包体余量仅 2,652 B（365,988 B / 368,640 B），第七十 / 七十一阶段任何入口增长须先评估优化或重新定标，已登记 backlog；④ `plugins/primevue-i18n.ts` 保留至第七十二阶段随 PrimeVue 卸载删除（**2026-11-06 轨迹调整**：原第七十一阶段拆为两段，卸载落在第七十二阶段）。

---

### 第七十阶段概览（已审计归档）

> 本阶段完整规划正文已迁入 [archive/roadmap-phases-70.md](./archive/roadmap-phases-70.md)；各条目的执行明细与验收结论见 [待办事项归档](./todo-archive.md) 的第七十阶段归档块。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **70** | 2026-11-03 ~ 2026-11-05 | 1 基座 + 3 迁移 + 1 治理 | `caomei-ui@1.0.0` GA 精确升级与门禁扩面（运行时产物与 rc.1 逐字节一致、视觉 18/18、parity 34/34、`keyCss` 61.79KB / 70KB）；B3 表单与设置整批迁移（立项口径 54 文件 / 598 处；条目级实测 589 处）——管理端设置与通知、安装向导、用户设置 / 认证 / 提交；`Stepper` / `Accordion` / `ColorPicker` / `DatePicker` / `FileUpload` 首次生产迁移；parity 第二 webServer（未安装态）与 `reader` 档首次启用（12 条预算按实测校准）；覆盖率第十一批（三模块 100% / 98.87% / 100%，全仓 80.40% → 80.66%，本批 +0.26pp） |

### 第七十阶段归档结论（最近归档阶段）

**审计结论**: 第七十阶段五条条目已完成并归档。基座完成 `1.0.0-rc.1 → 1.0.0` 精确升级（GA 与 rc.1 运行时产物逐字节一致、锁文件 5 处（+5/−5）、视觉 18/18、parity 34/34、`keyCss` 61.79KB / 70KB），并落地 parity 第二 webServer（`MOMEI_INSTALLED=false` + `TEST_MODE=false` + 内存库 + `DATABASE_SYNCHRONIZE=true`）与 `reader` 档预算校准能力（10 条待迁移路由登记、参考态 34 → 54）；B3 迁移按 2a / 2b / 2c / 3 / 4 分批完成管理端设置与通知（341 + 42 处）、安装向导（87 处）与用户设置 / 认证 / 提交（16 文件 / 119 处），并首次生产使用 `Stepper` / `Accordion` / `ColorPicker` / `DatePicker` / `FileUpload`；覆盖率第十一批闭合 95 条（89 直接 + 6 间接），三模块 statements 100% / 98.87% / 100%，全仓 80.40% → 80.66%（本批 +0.26pp），`+0.3pp` 因 3 模块池上限 +0.25pp 结构性不可达并已量化登记。剩余迁移面复算（2026-11-05 `governance:count:primevue-usage`）：组件 1,094 → **482 处 / 40 类**、`primeicons` 540 → **411 处**、token 1,445 → **1,442 处**。验证：条目 5 全量 `test:coverage` **EXIT 0（586 文件 / 5,202 例）**、`typecheck` 0、`lint` 0、视觉 24/24、parity 55/55、chromium E2E 24 passed / 4 skipped（auth 5/1 + submit 2/2 + user-workflow 17/3）；阶段收口结论 **Pass**：最终 `regression:phase-close` **EXIT 0**（全量 E2E 228 passed / 34.1m，`security:alerts` 随修复推送后关闭 #45，CI `Test` run `42016033169` 亦全绿）；首屏包体与重复代码基线按 2026-11-05 实测重定标（365KB、0.5% / 48 clones）并通过 strict 门禁。明细见本阶段回归分片。各批 Review Gate 均 Pass（Round 1–4 的 blocker 已逐项闭环）。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块，回归窗口整体迁入 [归档分片](../reports/regression/archive/2026-11-05-phase70-close.md)。

> 未覆盖边界与后续观察项：① B3 后剩余组件 **482 处 / 40 类**、图标 **411 处**、token **1,442 处**，随 B4 收尾（2026-11-06 轨迹调整：第七十一阶段 = 路由与图标，第七十二阶段 = token 切换 + 卸载）并卸载 PrimeVue；② `plugins/primevue-i18n.ts` 保留至第七十二阶段删除；③ 入口包体 369,212 B / 373,760 B（余量 4,548 B，2026-11-05 重定标）与 `keyCss` 61.85KB / 70KB，B4 前任何入口增长先评估拆包、再决定是否重定标；④ `--p-*` 幻影 token 与独立 `<i class="pi">` 清理留待第七十二阶段（token 切换与卸载同批）；⑤ E2E 4 worker 并行冷启动的 `networkidle` 抖动为既有问题（CI 单 worker 正常），不视为迁移回归。

---

## 第七十一阶段：PrimeVue → caomei-ui 迁移（五）——B4 剩余路由、图标全量与门禁收口（筹备中）

**时间表**: 2026-11-06 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 承接 backlog 长期主线第 10 条的第五阶段切片，在双库并存前提下把**剩余全部路由**（管理端编辑器 / 仪表盘 / 日历 / 片段 / AI 任务详情，以及公开页与布局壳）整路由迁到 caomei-ui，并完成图标全量替换（含 11 项品牌图标）与测试 / E2E 断言改写。2026-11-06 现取口径（`governance:count:primevue-usage`）：组件 **482 处 / 40 类 / 82 文件**（其中 `resolveUiLibraryForRoute` 判定为未迁移的页面 19 个、页面文件口径 90 处）、图标 **411 处 / 94 文件 / 118 唯一**、token **1,442 处 / 135 文件**（本阶段不清）、PrimeVue class 203 处 / 52 文件（开工复算值；本阶段只做随路由自然消减与收口复算，清零在第七十二阶段）。目录分桶（按同一组件名清单统计，与脚本口径存在 ±4 处正则差异）：`components/admin/**` + `pages/admin/**` 约 341 处，公开页 / 共享壳 / 布局约 140 处。

**准入结论**: 六条条目经用户 2026-11-06 在候选页确认（阶段构成 B 两阶段 / 品牌图标 A 保留 `@mdi/font` / 并入 i18n 键层、`useI18n` 内联、`friend-link` 归一化三项小治理）。条目 1–5 来自 [迁移方案 §7](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) 的 B4 段与 backlog #10，条目 6 来自长期主线 #1 与 #5、短期候选 #11（`useI18n` 内联）与 #13（i18n 键层缺陷）。ROI：开工基座 2.00 / 管理端余面 1.50 / 公开页与布局壳 1.60 / 图标全量 1.80 / 测试守卫 1.40 / 覆盖率与小治理 1.75；**条目 5 低于 1.5 阈值，是本期唯一可延后的条目**（若阶段超时，优先把 E2E 改写拆到第七十二阶段随卸载同批）。不上收：长期主线 #2 结构复用 / #4 Postgres / #8 CWV 专项；短期候选 #5 js-yaml 5 / #10 Mergify；长期主线 #11 的 S1 幻影 token（随第七十二阶段与卸载同批）。

**准入前置（已核对 2026-11-06）**: 第七十阶段已审计归档、`todo.md` 无已完成阶段正文、`git status` 干净且 `master` 与 `origin/master` 同步（`b1c8aa73`）；CI 回执 Test / CodeQL / VitePress / TODO-to-Issue 均 success，`Publish Docker Image` 为 `cancelled`（按口径不计通过）；`pnpm docs:check:source-of-truth` PASS（仅 4 项 soft warning）；覆盖率 80.66%；入口包体 369,212 B / 373,760 B、`keyCss` 63,336 B / 70KB。

**长期主线容量说明**: 迁移主线占本阶段绝大部分容量（剩余路由 482 处 / 82 文件 + 图标 411 处 / 94 文件，均高于 B3 的 589 处 / 54 文件），故条目 2 / 3 内部按目录分批、各自独立 Review Gate；治理侧只上收覆盖率第十二批与三项既有缺陷小治理，其余主线由 `pnpm regression:weekly` 保持不回退。**token 1,442 处与 PrimeVue 卸载不在本阶段**（见文末后续阶段轨迹）：二者必须同批（卸载会使 `--p-*` 定义源消失），且属全局主题切换，与本阶段「像素级整路由迁移」的风险类型不同。

1. **B4 开工基座与现取复核（P1）**: 1a 开工复算（脚本家族分桶 + 未迁移路由清单 + 路由 → 文件 → 组件族映射），产出「文件 → 改动点 → 依据指针」清单骨架；1b 在**任何页面改动前**把剩余路由登记为待迁移并采集参考态（公开页与布局壳缺口优先，`reader` 档按实测校准）；1c 在册族扩展：把展示族（`Card` / `Message` / `Skeleton` / `Divider` / `ProgressSpinner` / `Image` / `ProgressBar` / `Badge` / `RadioButton` / `Checkbox` / `Textarea` / `InputNumber` / `Accordion` 族 / `Tabs` 族 / `InputGroup` / `SplitButton` / `ButtonGroup` / `SelectButton` / `AutoComplete` / `MultiSelect` / `DatePicker` / `FileUpload` / `Stepper` 族 / `ColorPicker` / `DataView` / `Panel` / `Toolbar`）按批次登记为在册族，并复核子路由例外。**非目标**: 不改页面、不清 `--p-*`、不卸载 PrimeVue。**验收**: 迁移前 `test:visual` / `test:visual:parity` 全绿；新增参考态 100%（含 manifest 与来源）；未迁移路由清单与脚本口径一致。

2. **B4-A 管理端剩余路由整迁（P1）**: 2a 文章编辑器族（`/admin/posts/[id]`（现为已登记前缀下的例外子路由）与 `components/admin/posts/**`，含 `post-editor-header` / `post-editor-settings` / `post-editor-media-settings` / `post-distribution-button` / `publish-push-dialog(-v2)` / `ai-image-generator` / `post-tts-dialog` / `post-audit-dialog` / `post-history-panel` / `post-social-dialog` / `post-translation-workflow-dialog` / `post-editor-perspective-panel` / `post-editor-voice-overlay`）；2b 其余未迁移管理端路由（`/admin/index` 仪表盘、`/admin/calendar`、`/admin/snippets`（含 `capture`）、`/admin/ai/tasks/[id]`）；`/admin/friend-links`、`/admin/migrations/link-governance`、`/admin/submissions` 等已迁移路由不在本批，仅随图标与布局壳复核。**决策点**: `components/admin/ai/task-detail-content.vue` 与豁免子路由共享，须在「V2 分支」与「子路由整迁」间择一并留记录；`DataTable` 无 `#header` / `#footer` 插槽的缺口按包装元素处置并登记偏差；`Column` 2 处 / `slotProps` 22 处残余随本批核对。**非目标**: 不改编辑 / 发布 / AI 任务业务逻辑；不做半路由切换。**验收**: 在册族零残留守卫通过；每条新增路由 parity 差异逐项归因、未归因 0；管理端 E2E 主路径通过；`/admin/posts/[id]` 不再是 V1 消费者。

3. **B4-B 公开页与布局壳整迁（P1）**: 3a 全局壳（`app-header` / `app-notifications` / `app-search` / `app-uploader` / `app-avatar` / `app-voice-input-*` / `reader-controls` / `language-switcher` / `feedback-entry-button` / `article-*` / `comment-*` / `subscriber-form` / `home/**` / `taxonomy-post-page`）；3b 公开路由（`/`、`/posts`、`/posts/[id]`、`/friend-links`、`/about`、`/benefits`、`/feedback`、`/archives`、`/categories`、`/categories/[slug]`、`/tags`、`/tags/[slug]`、`/goto/[code]`、`/privacy-policy`、`/user-agreement` 等）；`/login` / `/register` / `/forgot-password` / `/reset-password` / `/submit` 已于第七十阶段条目 4 整路由迁移，本批仅随图标与布局壳复核，不重复整路由迁移。**重点**: 公开页 SSR / hydration（`Avatar` / `Image` / 浮层的 fragment 根与异步资源）；`reader` 档基线按实测校准，禁止为变绿放宽阈值。**非目标**: 不改内容渲染与 SEO 逻辑；不重做信息架构。**验收**: 公开页 `reader` 档 parity 全量归因；公开页关键 E2E（首页 / 文章详情 / 评论 / 搜索 / 友链）通过；SSR + hydration 复核记录落盘。

4. **B4-C 图标全量替换与品牌图标落点（P1）**: `pi pi-*` **411 处 / 94 文件 / 118 唯一**：其中品牌图标 **22 处 / 11 类**（github / google / twitter / linkedin / facebook / instagram / youtube / discord / twitch / tiktok / paypal）按用户确认**保留 `@mdi/font`**（零新依赖，`nuxt.config` 已全局加载，`utils/shared/commercial.ts` 已有 `mdi mdi-*` 用法），改走 `mdi mdi-*`；其余 **389 处** → `@lucide/vue`。数据驱动 `icon: 'pi pi-*'` 形态（`social-post-platforms.ts` / `commercial.ts` / `app-notifications.vue` 等）改为显式图标映射，不做运行时字符串解析；`pi-spin` 12 处（生产用法）改由加载态组件承载。**非目标**: 不改 `@mdi/font` 的加载方式与体积策略（另登记 backlog）；不做图标视觉重设计。**验收**: 全仓 `pi pi-` 零残留（脚本口径 0）；11 项品牌图标逐一登记落点；视觉 24/24、parity 全绿。

5. **B4-D 测试 / E2E 断言改写与守卫收口（P2）**: vitest 的 PrimeVue mock 2 文件与 E2E `p-*` 断言 9 处 / 2 文件改写；`CAOMEI_UI_ROUTE_PREFIXES` 补齐剩余路由，`ownedFiles` / 子路由例外同步（`/admin/posts/[id]` 与 `/admin/ai/tasks/[id]` 由例外转为正式迁移）；视觉与 parity 基线按迁移后实测校准（新增 / 失效基线的保留与归档口径随本批定稿）；复算 `keyCss` 与 `coreEntryJs` 并逐项归因（`keyCss` 不得越过 70KB）。**非目标**: 不借机重构无关测试；不降低断言强度。**验收**: 全量 `pnpm test` 通过；guard 全绿；E2E critical 三浏览器通过；包体与样式预算复算记录落盘。

6. **覆盖率第十二批 + 既有缺陷小治理（P2）**: 6a 覆盖率按**绝对未覆盖语句数**复算，**4 模块粒度且须含 ≥1 个大基数模块**（3 模块池上限 +0.25pp 已证明不足：达成 `+0.3pp` 需 109 条，而 `ai/quota-governance.ts` 28 + `agreement.ts` 26 + `setting.ts` 25 + `post-hexo-repository-sync.ts` 23 仅 102 条，目标不可达；须纳入 `server/database/typeorm-adapter.ts` 84 或 `server/utils/logger.ts` 61 之一），目标单批 `+0.3pp`；6b i18n 键层缺陷（`admin-posts.json` 8 个重复键、20 组双源同键、6 + 3 个死键、`pages/submit.vue` 1 处硬编码）；6c `useI18n()` 非 setup 顶层调用（`snippet-aggregate-dialog` 2 处、`creator-stats-panel` 3 处，含失败 / 边界断言）；6d `friend-link` 的 `name` / `url` 归一化被 `assignDefined` 覆盖（补「首尾空白不落库」失败断言）。**非目标**: 不做全量铺量；不改 UI 布局与 i18n 装配方式。**验收**: 覆盖率目标与算式落盘；6b–6d 各带可判别断言；`i18n:audit:duplicates` 组数不增、`i18n:audit:missing = 0`、`lint:i18n` 通过。

**回滚边界**:

- 条目 1：参考态与在册族登记各自独立可回退；删除新增参考态不影响既有基线。
- 条目 2 / 3：按 2a / 2b、3a / 3b 独立回滚，`CAOMEI_UI_ROUTE_SCOPES` 同步收缩。
- 条目 4：图标替换按文件回滚，不改依赖与加载方式。
- 条目 5：测试与 E2E 改写独立回滚；守卫扩展须与路由登记同批回退。
- 条目 6：测试文件与 i18n 键改动各自独立可回滚。

**风险提示**: ① 公开页此前只有 `reader` 档 6 条路由 / 12 条基线（明暗各一），B4-B 会一次性扩面，**不得以「未登记即不比对」替代归因**；② 布局壳（`app-header` / `app-notifications` / `app-voice-input-*`）被所有路由消费，迁错会全站回退，须先做 1 个代表文件 + 全量视觉回归再批量；③ 数据驱动图标改映射会触及公共服务层（`commercial.ts` / `social-post-platforms.ts`），须同步其单测；④ `--p-*` 1,442 处在本阶段**不清**，但新增样式不得再引入 `--p-*`，否则会加重第七十二阶段的切换面；⑤ 若阶段超时，按 ROI 先移出条目 5（E2E 改写随卸载同批），不得拆分条目 4 的「零残留」标准。

> 后续阶段轨迹（已授权方向，未展开规划）：**第七十二阶段 = token 语义层反向切换 + PrimeVue 卸载**——`--p-*` 1,442 处 / 135 文件清零（含 `--p-surface-border` 93 / 38 文件、`--p-text-color-secondary` 15 / 9 文件等幻影 token 与 backlog #11 的 S1）、样式耦合清理（`p-*` class / `.p-*` 选择器 / `:deep()` / `:global()`）、`plugins/primevue-i18n.ts` 与 Aura 预设移除、依赖卸载、包体对比与 `keyCss` 回落确认、文档收口。**卸载与 token 清零必须同批**（卸载会使 `--p-*` 定义源消失），且不得把幻影 token 清理拆出。具体分桶与验收在准入时按 [项目规划规范 §4.5 Step 7](../standards/planning.md) 单独评估，本阶段不提前落盘。

---

## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
