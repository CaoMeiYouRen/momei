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

### 第七十三阶段概览（已审计归档）

> 本阶段完整规划正文已迁入 [archive/roadmap-phases-73.md](./archive/roadmap-phases-73.md)；各条目的执行明细与验收结论见 [待办事项归档](./todo-archive.md) 的第七十三阶段归档块；回归窗口见 [archive/2026-11-10-to-2026-11-11-phase73.md](../reports/regression/archive/2026-11-10-to-2026-11-11-phase73.md)。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **73** | 2026-11-10 ~ 2026-11-11 | 1 UI 收尾 + 2 门禁硬化 + 1 覆盖率 + 1 依赖迁移 + 1 安全升级 | 共享 `AppEmptyState`（图标 / 说明 / 主操作）替换 7 文件空态、空表按 `total > 0` 判定、三处层序修复；Code Scanning #43 按 false-positive 重分类并移除 `--transition-mode`（门禁恢复完整阻断）；i18n 原文级重复键扫描 + PR 侧 missing 阻断；覆盖率第十四批 4 模块 **171/74/59/22 → 6/3/6/1**，statements 81.79% → 82.63%（+311 条 / +0.84pp）；markdown-it **15.0.3** + anchor 10.1.0 迁移并恢复 linkify 语义（5 处渲染器统一）；nuxt **4.6.4** 安全抬版与 14 张视觉基线归因（PR #1004 解阻）、markdown-it 组 PR #745 关闭 |

### 第七十三阶段归档结论（最近归档阶段）

**审计结论**: 第七十三阶段六条条目全部完成并归档（2026-11-10 立项，2026-11-11 收口）。条目 1 新增共享 `AppEmptyState` 并替换 7 个文件对 `pages.posts.empty` 的复用、空表分页改为按 `total > 0` 渲染（5 处绑定）、`.social-btn` 与 `.admin-form-dialog` 宽度钩子移出 `@layer momei-base`；条目 2 修复 Code Scanning #43 正则（`--!?>`）并重分类为 false positive、清理过期豁免台账、移除 `--transition-mode`；条目 3 新增 `scripts/i18n/audit-raw-duplicate-keys.mjs`（11 例单测）并把 `i18n:audit:missing` 加入 PR 侧 `test` job；条目 4 补测 4 模块（171→6 / 74→3 / 59→6 / 22→1），statements 81.79% → 82.63%（+311 条 / +0.84pp），全量 604→606 文件；条目 5 升级 markdown-it 15、移除 `@types/markdown-it`、新增 linkify 兼容层并在 5 处渲染器统一调用、9 例接线守卫；条目 6 完成 nuxt 4.6.4 抬版与 14 张视觉基线逐处归因（`PR #1004` 解阻）。阶段收口 `regression:phase-close` 结论 **Pass**（`pnpm regression:phase-close` 全步 PASS：`test:coverage` 607 文件 / 5,383 例、Statements 82.63%，`release:check:full` 12 步含 E2E 228 passed / 58 skipped，`docs:check:*`、`test:perf:budget:strict`、`duplicate-code:check:strict`、`review-gate:generate:check` 均通过；证据见 `artifacts/review-gate/2026-11-11-phase-close-regression.md`）。各条 Review Gate 均 Pass（条目 4 Reject→Pass；条目 5 四轮 Reject→Pass）。

> 未覆盖边界与后续观察项：① 首页 SWR 因 i18n 响应 `Set-Cookie` 不再缓存（nuxt 4.6.4 规则），已登记 backlog；② markdown-it 15 的上游行为变更中「裸域名+端口」「认证段邮箱」「实体 / HTML block / 链接目标边界」按接受项登记，未做输出等价恢复；③ 覆盖率剩余 16 条为防御 / 兜底分支（见证据文件）；④ quill 已降为 low 且无补丁，保留 backlog；⑤ 本地全量 Vitest 仍受 `node_modules/.vitest-cache` 的 `virtual:intlify-i18n` 解析问题影响（移走缓存后通过，CI 未复现）。


### 第七十五阶段：依赖与静态规则收口、字号归一与治理口径统一（进行中）

**时间表**: 2026-11-13 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 在第七十四阶段把工具链与门禁转阻断之后，收口「残留的依赖安全告警、静态规则债、Node 运行时基线漂移、i18n 豁免台账与文档口径分歧」，让治理脚本成为单点事实源。本阶段不引入新功能面（字号归一已按容量约束移出至 backlog）。

**准入结论**: 用户于 2026-11-13 在候选页确认「方案 A：治理收口」6 条组合；其余候选（性能专项、功能类）留在 [backlog](./backlog.md)。ROI（Value+Alignment / Difficulty+Risk）：依赖安全 `1.25`、ESLint 第二批 `1.50`、字号归一 `1.50`、i18n 复核 `2.00`、覆盖率 `1.67`、文档口径 `2.50`；依赖安全低于 §3.3 准入线 `1.5`，因含 2 条 medium 告警且为发布门禁输入，经用户确认纳入并保留 kill-switch（仅评估后无法安全抬版时转台账豁免）。**插队变更（2026-11-14）**: 用户决策按「方案 B」把 Node 运行时基线升级到 26 并插队进本阶段；该事项严格分类属 C 类（非阻塞的基线漂移治理），按用户明确指示纳入，并以「进一出一」把条目 3（字号归一）移出至 backlog（长期主线 #11）。Node 26 的 ROI：Value 2 / Alignment 4 / Difficulty 3 / Risk 3 = `1.00`，低于准入线，属决策性纳入而非评分驱动。

**准入前置（已核对 2026-11-13）**: 第七十四阶段已审计归档（`todo.md` 清空、`roadmap.md` 已迁出正文、回归窗口已写入）；工作区干净、`master` 与 `origin/master` 同步于 `49e7a078`，该提交 CI（Test / Docker / VitePress / TODO）全绿；Dependabot open 告警 4 条（minimatch / glob medium，deepmerge / quill low），`@hono/node-server` 两条 medium 已随 2.1.8 关闭。阶段基线：statements 同源口径 `83.31%`（30,815 / 36,989）、`font-size` 声明 455 条（token 化 10.33%、口径内待替换 225 条、非字阶 149 条）、`i18n:audit:duplicates` 64 组 / 149 keys / 33 跨模块、`duplicate-code` 0.39%、`coreEntryJs` 280.63KB / 335KB、`keyCss` 59.12KB / 62KB。

**阶段容量与移出顺序**: 本阶段维持 6 条在办（1 / 2 / 4 / 5 / 6 / 7），条目 3 已于 2026-11-14 按「进一出一」移出至 backlog #11。条目 1 只动 override / 台账；条目 2 只动 ESLint 规则与 17 个文件；条目 4 动 i18n key 与 allowlist；条目 5 是测试批次；条目 6 只动文档与脚本阈值；条目 7 动 `.nvmrc` / `engines` / 7 个 workflow / `Dockerfile` / README 与原生模块冒烟。排程上先做条目 1（发布面阻断）与条目 7（运行时基线，影响后续所有构建与镜像），再做条目 5（收口需要干净基线），其余按编号。若阶段超时，按 6 → 4 → 5 的顺序移出。

1. **依赖安全收口（P1）**: **1a minimatch / glob**——GHSA #286（minimatch `>=7.0.0 <11.0.1`，修 11.0.1）与 #284（glob `>=9.0.0 <=14.0.1`，修 14.0.2）当前分别解析到 10.2.5 / 10.2.6 与 10.5.0 / 11.1.0 / 13.0.7 / 14.0.4：先用 `pnpm why` 列全消费链，按**父级 scoped override** 定向抬版；禁止裸名跨大版本强推（minimatch v3 的 `minimatch(str, pattern)` 与 v10+ 命名导出不兼容），确需裸名必须先证明全部消费者 API 兼容。**1b 无补丁项**——deepmerge 4.3.1（#275，无补丁）与 quill 2.0.3（#22，无补丁）登记 `.github/security/dependency-risk-allowlist.json` 或告警豁免台账，写明影响面、不可修原因、复核日期（≤6 个月），并确认 quill 仅经编辑器链路触达、不进入公开页运行时。**非目标**: 不做依赖全量升级；不为变绿关闭或放宽安全门禁；不连带其他 Dependabot 项。**验收标准**: 2 条 medium 关闭或按 [安全规范 §5.3](../standards/security.md#53-发布前安全告警门禁-release-security-alert-gate) 受控豁免并留证据；`security:audit-deps` relevant risks 0（high+）与 `security:alerts` Pass；`pnpm install --frozen-lockfile`、`security:validate-overrides`、`lint` / `typecheck` / 定向测试通过；台账每条含理由与复核日期。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`pnpm why` 消费链清单、override diff、audit / alerts 输出写入 `artifacts/review-gate/`。**kill-switch**: 若定向 override 会破坏构建或工具链且一轮修不好，改为受控豁免 + backlog 记录上游修复跟踪，不强行抬版。**回滚边界**: override 与锁文件同批 revert；台账条目可单独回退。

2. **ESLint #262 第二批（P2）**: 按 `governance:inventory:eslint-rules` 全仓分桶结果，把 4 条「配置值 `[0]` 且未被 `strictTsRuleOverrides` 覆盖」的规则升档并清零：`prefer-reduce-type-parameter`（2 命中 / 2 文件）、`no-extraneous-class`（3 / 3，`server/services/adapters`）、`restrict-plus-operands`（6 / 4，`server/services`）、`non-nullable-type-assertion-style`（11 / 8，`server/api/posts`），合计 22 命中 / 17 文件；同步 `scripts/governance/eslint-debt-targets.mjs`、`eslint.config.js` 注释与 baseline，并在 issue #262 回写本批清单。**非目标**: 不启用 `no-unsafe-*` 系列（233 / 50 / 21 / 19 命中，需单列条目）；不为通过而放宽 `--max-warnings 10`；不动测试 / 脚本豁免边界。**验收标准**: 4 条规则命中清零且 effectiveSeverity=1；`pnpm lint` 0 error、warning ≤ 10；inventory 的「规则 × configured × effective × 命中数」表更新落盘；issue #262 附批次记录。**验证矩阵 / 证据落点**: V0 + V1 + RG；inventory 前后对照与 lint 输出写入 `artifacts/review-gate/`。**回滚边界**: 按规则独立回退（配置与代码修复同批）。

3. ~~**字号归一与字阶批量替换（P2）**~~ **【已移出，2026-11-14 移至 backlog #11】**: **A 评估**——对 149 条非字阶取值（`0.85rem` 17 / `1.1rem` 17 / `0.95rem` 16 / `0.8125rem` 13 / `0.8rem` 11 / `0.7rem` 10 / `0.9rem` 9 / `2rem` 8 / `2.5rem` 6 / `0.9em` 4 / `3rem` 4 等）产出「归一目标 → 受影响组件 / 版式」评估报告，只对实测 ±0 或经用户确认的档位执行归一，未确认的保留在报告内。**B 替换**——按目录分批把剩余 225 处口径内字面量改为 `var(--m-font-size-*)`（`components/admin/posts` 67 处优先），单批 ≤10 文件。**非目标**: 不新增字阶档（如 `2xs`）；不改 [界面自检清单](../design/ui-review-checklist.md) U1–U6；不做暗色 tint；未评估的 `clamp()` / `em` 用法不动。**验收标准**: 评估报告落盘 `docs/design/governance/`；每批 `getComputedStyle` 逐元素对账 0 差异（浅色 / 深色）、`test:visual` 与 `parity` 通过且未归因差异 0、`lint:css` 0 error；`governance:inventory:font-sizes` 的 token 覆盖率单调上升且无未登记回退。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；分桶前后报告、对账 JSON 与截图写入 `artifacts/review-gate/`。**回滚边界**: 每批独立可回滚；token 定义与首批同批 revert。

4. **i18n allowlist 复核与公开页 runtime 审计（P2）**: 对剩余 64 组 / 149 keys / 33 跨模块按三类复核——① 动态 key 拼接（优先改为显式静态映射，不扩 allowlist）；② 模块内语义不同（保留并写理由）；③ 跨模块对象语义不同（评估是否上收 `common.*`）；allowlist 每条补「理由 + 复核日期」；把归档 / 分类 / 标签列表页纳入 `i18n:verify:runtime` 覆盖。**非目标**: 不重命名业务语义 key；不合并「值同义不同」组；不动原文级扫描口径；不新增语种。**验收标准**: 组数下降或 allowlist 100% 具备理由与日期；`i18n:check-sync` 五语一致、`i18n:audit:missing` 0、`i18n:verify:runtime` 通过；`i18n:audit:duplicates:gate` 对未登记新增仍判红。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`i18n:audit:duplicates` 前后输出与 allowlist diff 写入 `artifacts/review-gate/`。**回滚边界**: key 合并与 allowlist 变更独立回滚。

5. **覆盖率第十六批（P2）**: 按绝对未覆盖语句数取 4 模块且含 ≥1 大基数：`scripts/ai/check-governance.mjs`（284 未覆盖 / 341，16.7%）、`scripts/perf/check-bundle-budget.mjs`（242 / 258，6.2%）、`components/admin/posts/ai-image-generator.vue`（138 / 161，14.3%）、`composables/use-asr-direct.ts`（58 / 329，82.4%，剩余为重连时序与凭据降级分支）；目标同源口径 `+0.3pp` 或模块级 `+15pp / ≥85%`；同批把「分母变化时按同源文件比较」的口径写入 [测试规范](../standards/testing.md) coverage 小节。**非目标**: 不为凑数测 getter / 模板分支；不重构测试结构；不新增测试依赖。**验收标准**: 干净全量跑（移 `.vitest-cache` + `--maxWorkers=4`）基线 / 收口，delta 落盘 `artifacts/coverage/`；定向测试通过；flaky 归因记录；规范口径已更新。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。**回滚边界**: 测试文件与覆盖率产物独立可回滚。

6. **文档与治理口径收敛（P2）**: ① 回归窗口阈值双口径（`docs/reports/regression/index.md` 的「300–400 行 / 6–8 条」与 `scripts/docs/check-line-count.mjs` 的 warn>500 / error>700）收敛为脚本单点，`index.md` 改为指针引用；② `todo-archive.md`（555 行，warning）按近线窗口拆分或给出提升阈值的实测依据；③ `docs/design/governance/` 过期报告巡检：列出 >180 天且已被后续结论取代者，迁入对应 archive 并在索引留链；④ coverage 同源口径与阶段收口的分母说明写入测试规范。**非目标**: 不做全站文档重写；不新增翻译件；不改 MUST-SYNC / SUMMARY-SYNC tier 阈值本身。**验收标准**: `docs:check:line-count` / `docs:check:source-of-truth` / `docs:check:links` / `docs:check:markers` 全 PASS；`index.md` 与脚本口径单点一致；巡检与归档清单落盘可查。**验证矩阵 / 证据落点**: V0 + V1 + RG；脚本输出与归档清单写入 `artifacts/review-gate/`。**回滚边界**: 按文件独立回滚。

7. **Node 26 运行时基线单点化（P1，插队）**: **7a 单点声明**——新增 `.nvmrc` = `26.13.1`，`engines.node` 改 `26.x`，7 个 workflow（`test` / `docker` / `release` / `docs` / `regression-weekly` / `dependency-risk-daily` / `visual-reference-refresh`，共 22 处）改 `node-version-file: .nvmrc` 并同步步骤名。**7b 生产镜像**——`Dockerfile` 的 `NODE_BUILD_IMAGE` / `NODE_RUNTIME_IMAGE` 默认值改 `node:26.13.1-alpine`，保留 `--build-arg` 覆盖与安全版校验白名单。**7c 原生模块与冒烟**——`pnpm rebuild better-sqlite3`，Node 26 构建 `.output` 后启动并验证 `/api/install/status` 与 DB 读写；`docker build` 后容器内复跑同一探针。**7d 文档**——README「依赖要求」改 Node.js 26.13.1+，`docs/standards/development.md` 补一行本地环境要求（指向 `.nvmrc`），`docs/design/governance/2026-11-14-node-26-runtime-baseline.md` 记录升级评估与回退路径。**非目标**: 不升 pnpm / Nuxt / Vite 大版本；不采纳 Node 26 新特性；不改 22 / 24 / 26 安全版校验白名单；不做双版本 CI 矩阵。**验收标准**: `nvm use` 读到 26.13.1；CI 日志 `node: v26.13.1` 且无 `Unsupported engine`；Node 26 下 `install --frozen-lockfile` / `build` / `.output` 探针 200 且 DB 读写正常；Docker 镜像构建成功、容器探针 200；`pnpm test`、`test:visual` 32、`test:visual:parity` 83、`test:perf:budget:strict` 全过；`engines` / `.nvmrc` / workflow / Dockerfile 无 `lts/*` 与版本残留不一致。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + V4 + RG；原生模块重建日志、本地与容器探针输出、CI run 链接、包体与视觉结论写入 `artifacts/review-gate/`。**回滚边界**: `.nvmrc` / `engines` / workflow / `Dockerfile` / README 同批 revert 回 24.22.1 并用旧镜像重建。**kill-switch**: `node:26.13.1-alpine` 不可用或容器冒烟失败时按治理文档 §6 执行（退到最近可用的 26.x 具体补丁标签并同步 `.nvmrc` 与 Dockerfile 双 ARG）；仍失败则回退 24 基线并把本项移回 backlog。

**回滚边界（阶段级）**:

- 条目 1：override 与锁文件同批 revert；台账条目独立回退。
- 条目 2：按 ESLint 规则独立回退。
- 条目 3：按替换批次独立回退；字阶 token 与首批同批 revert。
- 条目 4：key 合并与引用替换同批 revert；allowlist 独立回退。
- 条目 5：测试文件与覆盖率产物独立可回滚。
- 条目 6：按文档 / 脚本文件独立回滚。

**风险提示**: ① minimatch / glob 的裸名 override 会同时改所有消费者，必须先列 `pnpm why` 再定向；② ESLint 升档后若发现规则与 typed lint 作用域冲突，按规则回退而不是放宽；③ 字号归一必然改变渲染，未确认档位不得替换，每批都要 `getComputedStyle` 而非截图对账；④ i18n 合并会改引用点位，必须先脚本列引用再替换；⑤ 覆盖率口径若不先写进规范，下一批仍会出现「百分比下降但实际变好」的误读；⑥ 文档阈值收敛会改变回归归档节奏，需与回归层同批说明；⑦ Node 26 升级会同时改变 CI、镜像与本地基线，必须一次性单点化并保留 `--build-arg` 覆盖能力，容器冒烟不通过时按 kill-switch 回退而不是逐点放宽；⑧ `visual-reference-refresh` 的 Node 版本变化会写进参考态 manifest，切版后首跑 parity 需确认无系统性差异。

---

### 第七十四阶段概览（已审计归档）

> 本阶段完整规划正文已迁入 [archive/roadmap-phases-74.md](./archive/roadmap-phases-74.md)；各条目的执行明细与验收结论见 [待办事项归档](./todo-archive.md) 的第七十四阶段归档块。

| 阶段 | 时间 | 组合 | 核心交付 |
|:---|:---|:---|:---|
| **74** | 2026-11-12 ~ 2026-11-13 | 1 工具链现代化 + 2 门禁硬化 + 1 存量缺陷批 + 1 i18n + 1 字阶 + 1 覆盖率 | js-yaml 5 与 stylelint 18 + `stylelint-config-cmyr` 配对升级、ESLint `ban-ts-comment` 首批升档清零；视觉 parity 以 CI 复采参考态并移除 `continue-on-error`、入口包体护栏收敛（Sentry 移出首屏预载）；SQLite 统计分组 / 仪表盘断点 / 适配器 id 回填三处缺陷修复；i18n 重复文案收敛至 `common` / `legal` 并加 allowlist 门禁；`--m-font-size-*` 字阶与 47 处试点等价替换（`getComputedStyle` 零差异）；覆盖率第十五批 **+247 条 / +0.67pp**（同源文件口径） |

### 第七十四阶段归档结论（最近归档阶段）

**审计结论**: 第七十四阶段六条条目全部完成并归档（2026-11-12 立项，2026-11-13 收口）。条目 1 完成 js-yaml 5 override 与 8 处 `{ load, dump }` 导入、ESLint `ban-ts-comment` 升档清零、stylelint 18.0.0 + `stylelint-config-cmyr` 1.1.0 配对升级（PR #1008 收口）；条目 2 以 CI 复采参考态刷新 parity 预算并把两层视觉门禁转为阻断，入口包体把 Sentry 客户端移出预载；条目 3 修复 `creator-stats` SQLite 分组、`_admin-dashboard` 断点方向与 `typeorm-adapter` 的 `_id` 回填；条目 4 收敛跨模块重复文案并落 allowlist 门禁；条目 5 定义 `--m-font-size-{xs..4xl}` 字阶、产出分桶清单脚本与 8 文件 47 处等价替换（8 路由 × 明暗双主题 `font-size` / `line-height` 零差异，parity 83/83、基线层 32/32）；条目 6 补齐四模块覆盖率（同源口径 +0.67pp / +247 条）。各条 Review Gate 均 Pass（条目 6 为 standard 档）。

> 未覆盖边界与后续观察项：① 字阶剩余 225 处口径内字面量与 149 处非字阶取值待分批归一，需先评估版式影响；② `use-asr-direct` 未达模块级 85%（82.4%），剩余为重连时序与凭据降级分支；③ 本地 parity 在 `post-detail` 头像区域存在 32px / 851px 残差（CI 参考态与本地环境差异，均在预算内）；④ 首页 SWR 缓存方案仍待决策（backlog）。

---

> 后续阶段候选（未立项）：功能类（会员 / 付费订阅预研、播客与多媒体、JekyllParser、设置表单 AI Image Fallback 4 项、编辑器工具栏 Phase C）与首页 SWR 缓存方案决策，见 [backlog](./backlog.md)；按 [项目规划规范 §4.5 Step 7](../standards/planning.md) 在准入时重新评估。

---

## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
