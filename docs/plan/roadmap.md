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
- 第一至第五十三阶段的完整正文已迁入区间归档分片，第五十四至第七十二阶段的完整正文已迁入阶段区间分片（主窗口仅保留摘要表与归档结论），避免旧阶段长期挤占当前阅读面。
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

### 第七十阶段归档结论（已审计归档）

**审计结论**: 第七十阶段五条条目已完成并归档。基座完成 `1.0.0-rc.1 → 1.0.0` 精确升级（GA 与 rc.1 运行时产物逐字节一致、锁文件 5 处（+5/−5）、视觉 18/18、parity 34/34、`keyCss` 61.79KB / 70KB），并落地 parity 第二 webServer（`MOMEI_INSTALLED=false` + `TEST_MODE=false` + 内存库 + `DATABASE_SYNCHRONIZE=true`）与 `reader` 档预算校准能力（10 条待迁移路由登记、参考态 34 → 54）；B3 迁移按 2a / 2b / 2c / 3 / 4 分批完成管理端设置与通知（341 + 42 处）、安装向导（87 处）与用户设置 / 认证 / 提交（16 文件 / 119 处），并首次生产使用 `Stepper` / `Accordion` / `ColorPicker` / `DatePicker` / `FileUpload`；覆盖率第十一批闭合 95 条（89 直接 + 6 间接），三模块 statements 100% / 98.87% / 100%，全仓 80.40% → 80.66%（本批 +0.26pp），`+0.3pp` 因 3 模块池上限 +0.25pp 结构性不可达并已量化登记。剩余迁移面复算（2026-11-05 `governance:count:primevue-usage`）：组件 1,094 → **482 处 / 40 类**、`primeicons` 540 → **411 处**、token 1,445 → **1,442 处**。验证：条目 5 全量 `test:coverage` **EXIT 0（586 文件 / 5,202 例）**、`typecheck` 0、`lint` 0、视觉 24/24、parity 55/55、chromium E2E 24 passed / 4 skipped（auth 5/1 + submit 2/2 + user-workflow 17/3）；阶段收口结论 **Pass**：最终 `regression:phase-close` **EXIT 0**（全量 E2E 228 passed / 34.1m，`security:alerts` 随修复推送后关闭 #45，CI `Test` run `42016033169` 亦全绿）；首屏包体与重复代码基线按 2026-11-05 实测重定标（365KB、0.5% / 48 clones）并通过 strict 门禁。明细见本阶段回归分片。各批 Review Gate 均 Pass（Round 1–4 的 blocker 已逐项闭环）。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块，回归窗口整体迁入 [归档分片](../reports/regression/archive/2026-11-05-phase70-close.md)。

> 未覆盖边界与后续观察项：① B3 后剩余组件 **482 处 / 40 类**、图标 **411 处**、token **1,442 处**，随 B4 收尾（2026-11-06 轨迹调整：第七十一阶段 = 路由与图标，第七十二阶段 = token 切换 + 卸载）并卸载 PrimeVue；② `plugins/primevue-i18n.ts` 保留至第七十二阶段删除；③ 入口包体 369,212 B / 373,760 B（余量 4,548 B，2026-11-05 重定标）与 `keyCss` 61.85KB / 70KB，B4 前任何入口增长先评估拆包、再决定是否重定标；④ `--p-*` 幻影 token 与独立 `<i class="pi">` 清理留待第七十二阶段（token 切换与卸载同批）；⑤ E2E 4 worker 并行冷启动的 `networkidle` 抖动为既有问题（CI 单 worker 正常），不视为迁移回归。

---

### 第七十一阶段概览（已审计归档）

> 本阶段完整规划正文已迁入 [archive/roadmap-phases-71.md](./archive/roadmap-phases-71.md)；各条目的执行明细与验收结论见 [待办事项归档](./todo-archive.md) 的第七十一阶段归档块。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **71** | 2026-11-06 ~ 2026-11-08 | 1 基座 + 2 迁移 + 1 图标 + 1 门禁 + 1 治理 | B4 剩余路由整迁（管理端 6 路由 + 公开页 9 文件）与布局壳；`pi pi-*` **136 处清零**（品牌 11 类落 `@mdi/font`，tiktok / discord / paypal 内联）；过渡组件收口（V1 清零、6 组去 `-v2`）；E2E `p-*` 断言清零与守卫扩到 35 条路由；覆盖率第十二批 +154 条 / **+0.42pp**；i18n 键层与 `friend-link` 归一化修复；发布 **v1.30.0** |

### 第七十一阶段归档结论（已审计归档）

**审计结论**: 第七十一阶段六条条目全部完成并归档，阶段内 16 个业务 / 测试 / 文档提交（另有 1 个 CI 修复提交与语义化发布提交）。条目 1 落盘 B4 迁移清单（19 个未迁移页面 / 90 处）并采集 14 条参考态（28 张）；条目 2 完成管理端剩余路由（snippets / AI 任务详情 / 日历 / 仪表盘 / 编辑器子批）；条目 3 完成公开页与布局壳（全局壳 5 文件 25 处、内容组件 6 文件 31 处、外围组件 4 文件 24 处、公开路由 9 文件 61 处 + 7 条 scope），并把过渡组件收敛为单一实现；条目 4 把 `pi pi-*` 从 136 处清零（非品牌 → `@lucide/vue`、8 类品牌 → `mdi mdi-*`、3 类字体未收录 → 内联 Simple Icons），5 个数据驱动配置改为组件；条目 5 清零 E2E `p-*` 断言、守卫支持动态参数页与根前缀（`CAOMEI_UI_ROUTE_PREFIXES` 35 条）、`keyCss` 63,337 B / 70KB、入口 `coreEntryJs` 375,368 B（配额按归因 365 → 370KB）；条目 6 补测 4 模块（+154 条 / +0.42pp）、收敛 i18n 重复键 / 双源同键 / 死键 / 硬编码、新增 `useI18n` 位置守卫并修复 `friend-link` 归一化被覆盖。阶段收口复算：组件 **188 → 46 处 / 26 → 14 类**、图标 **235 → 0**、token 1,420（留第七十二阶段）；parity **83/83**（41 条已迁移、0 待迁移）、`test:visual` 24/24、CI `Test` 15 job 全绿、本地 `release:check` 10/10；**v1.30.0 经手动触发的 Release workflow 发布成功**（含子包与多架构镜像）。各批 Review Gate 均 Pass。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块，回归窗口整体迁入 [归档分片](../reports/regression/archive/2026-11-08-phase71-close.md)。

> 未覆盖边界与后续观察项：① `--p-*` token 1,420 处与 PrimeVue 组件 46 处（Checkbox / Card / DatePicker / MultiSelect / InputNumber / Textarea 等）留第七十二阶段「token 切换 + 卸载」同批处理；② `app-uploader.scss` 与若干页面仍引用 `--p-primary-*`，随预设卸载改名；③ `plugins/primevue-i18n.ts` 与其单测保留至第七十二阶段删除（故「vitest PrimeVue mock 文件数」为 1）；④ 本地全量 Vitest 仍受 `node_modules/.vitest-cache` 的 `virtual:intlify-i18n` 解析问题影响（清缓存后通过、CI 未复现），已登记 backlog；⑤ `typeorm-adapter.transformOutput` 的 `_id` 被字段回写覆盖（低影响）与 99 组跨模块同文案键留在 backlog；⑥ `security:alerts` 有 2 条已过期豁免（`mjml` / `quill`）待复核。

### 第七十二阶段概览（已审计归档）

> 本阶段完整规划正文已迁入 [archive/roadmap-phases-72.md](./archive/roadmap-phases-72.md)；各条目的执行明细与验收结论见 [待办事项归档](./todo-archive.md) 的第七十二阶段归档块。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **72** | 2026-11-08 ~ 2026-11-09 | 1 基座 + 1 迁移 + 1 token + 1 卸载 + 1 治理 | `--p-*` token **1,420 处清零**（120 唯一，语义角色 → `--caomei-*`、调色板 → `--m-*`，幻影 token 分两类处置）；剩余 PrimeVue 组件 **46 → 0**；PrimeVue 全家桶卸载（依赖 / Aura 预设 / `primevue-i18n` / 路由择库机制 / `p-*` class / `.p-*` 选择器全部清零），新增全量零残留守卫；补回 `box-sizing` / `color-scheme` 两条运行期全局基线；包体 `coreEntryJs` 375,543 → **329,891 B**、`keyCss` 64,103 → **60,482 B**，配额收紧至 335KB / 62KB；覆盖率第十三批 **+140 条 / +0.38pp** |

### 第七十二阶段归档结论（最近归档阶段）

**审计结论**: 第七十二阶段五条条目全部完成并归档（2026-11-08 立项，2026-11-09 收口）。条目 1 落盘 120 个唯一 `--p-*` 的三分类映射表与 `--m-*` 派生层，并建立禁新增守卫；条目 2 完成剩余 46 处 / 14 类 PrimeVue 组件替换（组件口径 46 → 0）；条目 3 按样式基座 / 公开页与共享组件 / 管理端三批把 token 从 1,420 清零，桥接方向反转为 `--m-* → --caomei-*`；条目 4 卸载 `primevue` / `@primevue/*` / `@primeuix/*` / `primeicons` / `primelocale` 与 Aura 预设、`plugins/primevue-i18n.ts`、路由择库机制，`p-*` class 151 → 0、`.p-*` 选择器 83 → 0，并以 `tests/modules/primevue-residual-guard.test.ts`（组件 / 图标 / token / class / 选择器 / 依赖 / 包引用 / `@layer` / `usePrimeVue` / `*-v2.vue`）建立全量零残留守卫；卸载同时补回 PrimeVue 主题运行期注入的 `* { box-sizing: border-box }` 与 `color-scheme` 两条全局基线（缺失导致 15 张视觉基线失败）。条目 5 补测 4 个主模块 + 6 个小模块，全仓 statements **29,995 → 30,135 / 36,828（+140 条 / +0.3801pp）**，并清理 4 处「Mock PrimeVue」残留注释。验证：全量 `pnpm test:coverage` 600 passed / 1 skipped（601 文件）/ 5,265 passed；`test:visual` 32/32、`parity` 83/83、E2E critical 17 passed / 1 skipped + mobile 2 + 安装向导 2；`typecheck` / `lint` / `stylelint` / `docs:check:*` 全通过；`test:perf:budget` 通过（`coreEntryJs` 322.16KB / 335KB、`keyCss` 59.06KB / 62KB）。阶段收口 `regression:phase-close` 结论 **Pass**（12 步中 11 步通过；补齐 Playwright 浏览器后 E2E 复跑 227 passed / 1 flaky / 58 skipped；证据见 `artifacts/review-gate/2026-11-09-phase-close-regression.md`）。各批 Review Gate 均 Pass（条目 4 Round 1 Reject → Round 2 Pass；条目 5 Round 1–2 Reject → Round 3 Pass）。

> 未覆盖边界与后续观察项：① 三处**层序导致的既有样式失效**（社交登录按钮品牌色 / `admin-form-dialog` 宽度 / `.translation-badge` 尺寸）已登记 backlog #11，需浏览器人工验收后修复；② `@mdi/font` 保留（11 类品牌图标 / 22 处），体积收敛另立候选；③ `--m-radius-md` / `--m-radius-sm` 冻结 6px / 4px，管理端圆角不再随主题变化（与 PrimeVue 原行为一致）；④ `docs/design/ui.md` 的组件库对照表仍为迁移期描述，需后续改写；⑤ 本地全量覆盖率存在 `virtual:intlify-i18n` 并发 0-test 抖动，统一以「清 `.vitest-cache` + `--maxWorkers=4`」的干净跑为准，CI 为最终裁决。

---

## 第七十三阶段：迁移后质量收尾与门禁硬化（筹备中：条目 1–5 已规划，待开工）

**时间表**: 2026-11-10 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 收口 PrimeVue 卸载后的视觉债与空态缺口，把发布安全门禁从过渡模式切回完整阻断，补齐 i18n 原文级重复键与 PR 侧键漂移门禁，并推进覆盖率第十四批与 markdown-it 15 迁移。本阶段不引入新功能，只做「迁移后收尾 + 门禁硬化 + 依赖解阻」。

**准入结论**: 五条条目经用户在候选页 2026-11-10 确认（方案 A；备注 A+B+C 的依赖 / 工具链余项排入第七十四阶段轨迹）：① UI S1 按 [界面自检清单 U1](../design/ui-review-checklist.md) 收尾——空态组件化（图标 + 说明 + 主操作）、空表不渲染分页、三处层序失效修复，并同批改写 `docs/design/ui.md` §3.1+；② 安全门禁优先修复 Code Scanning #43，无法修复则按 `false-positive` 重分类并留证，随后移除 `--transition-mode`；③ i18n 只补「原文级重复键扫描 + PR 侧 missing 阻断」，不动现有 99 组已解析重复键；④ 覆盖率沿用「清 `.vitest-cache` + `--maxWorkers=4`」的干净全量跑口径；⑤ markdown-it 15 先查上游迁移指南与插件兼容矩阵，不兼容即退回 backlog。ROI：UI S1 1.60 / 安全门禁 2.00 / i18n 1.75 / 覆盖率 2.00 / markdown-it 1.00（低于 §3.3 的 1.5 准入线，经用户确认以 kill-switch 纳入；若阶段超时优先移出）。

**准入前置（已核对 2026-11-10）**: 第七十二阶段已审计归档、`todo.md` 无已完成阶段正文、工作区仅含本规划改动、`HEAD=2bffa330` 已推送；`docs/reports/regression/current.md` 仅保留 2026-11-09 阶段收口窗口；CI `Test` 与 `Publish Docker Image`（2bffa330）已于 2026-11-10 实测全绿，开工前置满足。若 Docker 原生多架构首次运行失败，按 B 类插队先修，不并入本阶段条目。

**阶段容量与移出顺序**: 本阶段是「收尾型」阶段，五条条目彼此独立、可分批提交：条目 1 涉及视觉与五语 key，条目 2 涉及安全台账与 CI 门禁，条目 3 涉及脚本与 PR 门禁，条目 4 是常规覆盖率批次，条目 5 是依赖迁移（含 kill-switch）。条目 1 与 2 为 P1，条目 3–5 为 P2；若阶段超时，按 5 → 3 → 4 的顺序移出。

1. **UI S1 收尾：空态三态、空表分页与三处层序失效（P1）**: 空态组件化（以 `AdminTableEmptyState` 为基座补齐图标 / 说明 / 主操作，或新建共享 `AppEmptyState`）；替换 `pages/admin/{posts,comments,subscribers,waitlist}/index.vue`、`pages/posts/index.vue`、`components/admin/admin-taxonomy-page.vue`、`components/taxonomy-post-page.vue` 共 7 个文件对 `pages.posts.empty` 的复用（清单计划原口径为 4 文件 / 5 页，按 2026-11-10 复算），按对象新增五语 key；空表不渲染分页（`paginator` + 空态判据约 7–10 处）；三处层序修复（`.social-btn` 移出 `@layer` 或走 `--caomei-button-*`、`.admin-form-dialog` 宽度改用 Dialog `width` 或移出层、`.translation-badge` 尺寸核实 token 钩子）；同批改写 `docs/design/ui.md` §3.1+ 与文首指针。**非目标**: 不做 U2 字阶全量替换、不做暗色 tint（S2）、不把 U1 扩到全部列表、不扩 reader parity 档。**验收**: 空态 / 加载 / 错误三态截图（空态含图标 + 说明 + 操作）；空表无分页截图；五语 key 完整且无 raw key；三处 `getComputedStyle` 实测符合预期（社交按钮品牌色与布局、弹窗宽度 576 / 544 / 608px、徽标高 24px / min-width 32px）；`test:visual` / `parity` 通过并按实测更新基线；`lint` / `stylelint` / `typecheck` / 定向测试通过；`ui.md` 通过 `lint-md` / `docs:check:links` / `docs:check:line-count`。**验证矩阵**: V0 + V1 + V2 + V3 + RG。
2. **发布安全门禁收口：Code Scanning #43、过期台账与去过渡模式（P1）**: Code Scanning #43（`js/bad-tag-filter`，`scripts/docs/check-doc-markers.mjs`，dismissed `won't fix`）——优先修复正则；若确认脚本只读、输入为仓库受信文档、正则是检测器而非过滤器，则按 `false-positive` 重分类并登记依据；复核 `security-alert-exceptions.json` 的 mjml / quill 过期条目（续期并写明理由与跟踪，或替换 / 移除依赖）；移除 `package.json` 的 `--transition-mode`；同步 `docs/standards/security.md §5.3` 与 [dismissed 与 fail-closed 对齐](../design/governance/2026-11-03-release-security-gate-dismissed-fail-closed.md)。**非目标**: 不改 critical 不可豁免与 open 告警阻断口径；不借机放宽 `--min-severity`。**验收**: `pnpm security:alerts`（无 transition）Pass；`pnpm security:audit-deps` Pass；台账无过期项；CI `security:alerts` 绿；文档同步。**回滚**: `--transition-mode` 移除可单独回退；#43 的 false-positive 重分类需在 GitHub 侧恢复原 dismiss 原因。**验证矩阵**: V0 + V1 + V2 + RG。
3. **i18n 审计硬化：原文级重复键扫描与 PR 侧键漂移阻断（P2）**: 在 `scripts/i18n/audit-duplicate-messages.mjs`（或独立脚本）补原文级重复键扫描（对象栈检测，30–50 行 + 单测 fixture 能判红），接入 `i18n:audit:duplicates` 或新增 `i18n:audit:raw-duplicates`；先以 warning 面运行；把 `i18n:audit:missing`（或 `i18n:check-sync --fail-on-diff`）加入 PR 侧 `test.yml` 的 `test` job（现执行 `pnpm run lint` / `lint:i18n` / `lint:css`）。**非目标**: 不做全量 key 重构、不清现有 99 组已解析重复键（只处理原文级与新增）。**验收**: 新脚本单测通过（含重复键 fixture 判红）；当前原文级重复键 0；五语 sync 通过；PR 侧缺失键能判红（用单测或临时分支模拟）；`lint:i18n` 与 `docs:check:i18n` 绿。**验证矩阵**: V0 + V1 + V2 + RG。
4. **覆盖率第十四批（P2）**: 按绝对未覆盖语句数选 4 模块且含 ≥1 大基数（候选 `composables/use-post-editor-ai.ts` 171 / `server/utils/ai/tts-volcengine-websocket.ts` 59 / `server/api/tasks/run-scheduled.post.ts` 22 + 1 个按实测选取），目标单批 `+0.3pp`（约 111 条）或模块级 `+15pp / ≥85%`。**非目标**: 不做全量铺量；不追不可达分支；不重构测试结构。**验收**: 干净全量跑基线 / 收口；statements delta 落盘；定向测试通过；flaky 归因记录。**验证矩阵**: V0 + V1 + V2 + RG。
5. **markdown-it 15 迁移（P2，含 kill-switch）**: 先查 markdown-it 15.0.3 官方迁移说明与 5 个插件（`markdown-it-anchor` / `-container` / `-emoji` / `-github-alerts` / `-texmath`）兼容性；并同步升级 `@types/markdown-it`（当前 `^14.1.2`）；在 `utils/shared/markdown.ts` 收敛适配 `MarkdownRendererInstance.render` 的类型 / API 变化；修复 `article-content.vue` / `comment-item.vue` / `table-of-contents.vue` / `pages/admin/submissions/index.vue` / `utils/shared/distribution-template.ts` / `markdown.test.ts` 等 8+ 处类型错误。**非目标**: 不改插件行为与渲染输出语义；不连带其他依赖升级；不做 Markdown 渲染重构。**验收**: `pnpm typecheck` 0 error；`markdown.test.ts` + 全量 test 绿；Visual Regression 绿；PR #745 合入或关闭；若插件不兼容 15，记录证据并退回 backlog（kill-switch）。**验证矩阵**: V0 + V1 + V2 + V3 + RG。

**回滚边界**:

- 条目 1：空态组件 / 分页绑定 / 三处样式修复按文件组独立回滚；`ui.md` 为文档改动，可单独回退。
- 条目 2：`--transition-mode` 移除可单独回退；#43 的 false-positive 重分类需在 GitHub 侧恢复原 dismiss 原因。
- 条目 3：新脚本与 CI 步骤独立可回滚（回退后回到 weekly 阻断）。
- 条目 4：测试文件与覆盖率产物独立可回滚。
- 条目 5：依赖升级与适配层同批 revert；插件不兼容时不动依赖。

**风险提示**: ① 空态替换会改变 parity 基线（基线本身多为空态），须同批更新并归因；② 三处层序修复可能牵动其他依赖同一 `@layer` 的规则，须用浏览器 `getComputedStyle` 逐项验收，不能只看截图；③ #43 若无法修复且 false-positive 依据不足，保留过渡模式并记录，不强行放行；④ i18n 原文级扫描先以 warning 面运行，避免误报阻断；⑤ markdown-it 15 的插件兼容性是本阶段最大不确定项，先调研后动代码。

> 后续阶段候选（未立项）：依赖与工具链现代化（js-yaml 5 / ESLint 严格规则批次 #262 / 视觉门禁去 `continue-on-error` / 入口包体专项），见 [backlog 短期候选](./backlog.md)；按 [项目规划规范 §4.5 Step 7](../standards/planning.md) 在准入时重新评估。

---

## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
