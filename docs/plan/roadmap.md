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
- 第一至第五十三阶段的完整正文已迁入区间归档分片，第五十四至第七十一阶段的完整正文已迁入阶段区间分片（主窗口仅保留摘要表与归档结论），避免旧阶段长期挤占当前阅读面。
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

### 第七十一阶段归档结论（最近归档阶段）

**审计结论**: 第七十一阶段六条条目全部完成并归档，阶段内 16 个业务 / 测试 / 文档提交（另有 1 个 CI 修复提交与语义化发布提交）。条目 1 落盘 B4 迁移清单（19 个未迁移页面 / 90 处）并采集 14 条参考态（28 张）；条目 2 完成管理端剩余路由（snippets / AI 任务详情 / 日历 / 仪表盘 / 编辑器子批）；条目 3 完成公开页与布局壳（全局壳 5 文件 25 处、内容组件 6 文件 31 处、外围组件 4 文件 24 处、公开路由 9 文件 61 处 + 7 条 scope），并把过渡组件收敛为单一实现；条目 4 把 `pi pi-*` 从 136 处清零（非品牌 → `@lucide/vue`、8 类品牌 → `mdi mdi-*`、3 类字体未收录 → 内联 Simple Icons），5 个数据驱动配置改为组件；条目 5 清零 E2E `p-*` 断言、守卫支持动态参数页与根前缀（`CAOMEI_UI_ROUTE_PREFIXES` 35 条）、`keyCss` 63,337 B / 70KB、入口 `coreEntryJs` 375,368 B（配额按归因 365 → 370KB）；条目 6 补测 4 模块（+154 条 / +0.42pp）、收敛 i18n 重复键 / 双源同键 / 死键 / 硬编码、新增 `useI18n` 位置守卫并修复 `friend-link` 归一化被覆盖。阶段收口复算：组件 **188 → 46 处 / 26 → 14 类**、图标 **235 → 0**、token 1,420（留第七十二阶段）；parity **83/83**（41 条已迁移、0 待迁移）、`test:visual` 24/24、CI `Test` 15 job 全绿、本地 `release:check` 10/10；**v1.30.0 经手动触发的 Release workflow 发布成功**（含子包与多架构镜像）。各批 Review Gate 均 Pass。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块，回归窗口整体迁入 [归档分片](../reports/regression/archive/2026-11-08-phase71-close.md)。

> 未覆盖边界与后续观察项：① `--p-*` token 1,420 处与 PrimeVue 组件 46 处（Checkbox / Card / DatePicker / MultiSelect / InputNumber / Textarea 等）留第七十二阶段「token 切换 + 卸载」同批处理；② `app-uploader.scss` 与若干页面仍引用 `--p-primary-*`，随预设卸载改名；③ `plugins/primevue-i18n.ts` 与其单测保留至第七十二阶段删除（故「vitest PrimeVue mock 文件数」为 1）；④ 本地全量 Vitest 仍受 `node_modules/.vitest-cache` 的 `virtual:intlify-i18n` 解析问题影响（清缓存后通过、CI 未复现），已登记 backlog；⑤ `typeorm-adapter.transformOutput` 的 `_id` 被字段回写覆盖（低影响）与 99 组跨模块同文案键留在 backlog；⑥ `security:alerts` 有 2 条已过期豁免（`mjml` / `quill`）待复核。

## 第七十二阶段：PrimeVue → caomei-ui 迁移（六）——token 语义层反向切换与 PrimeVue 卸载（执行中：条目 1–5 完成，待阶段收口）

**时间表**: 2026-11-08 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 收口双库并存的最后一公里——把剩余 **46 处 / 14 类** PrimeVue 组件替换为 caomei 等价件，把 **1,420 处 `--p-*`**（120 唯一 / 136 文件，含 v3 幻影 token）反向切到 caomei 语义角色（`--caomei-*`）与项目调色板层（`--m-*`），随后卸载 PrimeVue 全家桶、Aura 预设、`primeicons`、`primelocale`、`primevue-i18n` 插件与路由择库机制，并复算包体把 `keyCss` / `coreEntryJs` 配额回收。开工口径（2026-11-08 `governance:count:primevue-usage`）：组件 46 处 / 14 类 / 16 文件；图标 0；token 1,420 处 / 120 唯一 / 136 文件；PrimeVue class 151 处 / 36 文件；`.p-*` 选择器 83 处（5 SCSS + 12 Vue）；`:deep()` 134 / `:global()` 41。分桶：`styles/` 229 处、公开页与共享组件约 551 处、管理端约 513 处。

**准入结论**: 五条条目经用户在候选页 2026-11-08 确认：① 调色板 token 走**项目语义层 `--m-*`**（`color-mix` 从 `--caomei-*` 派生，业务文件只引用 `--m-*`）；② 卸载范围包含 **`primeicons` / `primelocale` / 路由择库机制**（`resolveUiLibraryForRoute*` + 路由 scope 守卫改为「全站 caomei + 零 PrimeVue 残留」全量守卫，浮层族专用守卫保留）；③ **纳入覆盖率第十三批**（P2，超时可移出）。条目 1–4 来自 backlog 长期主线 #10 与 #11 的 S1 幻影 token；条目 5 来自长期主线 #1。ROI：基座 2.00 / 组件替换 1.60 / token 切换 1.50 / 卸载收口 1.80 / 覆盖率 1.75。

**准入前置（已核对 2026-11-08）**: 第七十一阶段已审计归档、`todo.md` 无已完成阶段正文、工作区干净且 `master` 与 `origin/master` 同步；CI `Test` 15 job 全绿（`2c954194`）、`v1.30.0` 经手动触发的 Release workflow 发布成功；本地 `release:check` 10/10；`docs:check:source-of-truth` PASS（仅 soft warning）；覆盖率 79.23%（29,147 / 36,790）；入口包体 `coreEntryJs` 375,368 B / 378,880 B、`keyCss` 63,337 B / 70KB。

**长期主线容量说明**: token 切换是单阶段体量最大的样式改动（1,420 处 / 136 文件，含 120 个唯一 token 的语义判定），因此条目 1 必须先落映射表与 `--m-*` 派生层，条目 3 再按 3 批执行、各自独立视觉门禁；条目 4 的卸载必须与条目 3 同批收口（卸载会使 `--p-*` 定义源消失）。治理侧只上收覆盖率第十三批，其余主线由 `pnpm regression:weekly` 保持不回退。

1. **token 语义审计与映射基座（P1）**: 120 个唯一 token 三分类（v4 语义角色 / v4 调色板 / v3 幻影）；`styles/main.scss` 落地 `--m-*` 派生层（surface / primary / 状态色三组，`color-mix` 从 `--caomei-*` 生成）；映射表落盘；新增「禁止新增 `--p-*`」守卫；采集卸载前基线。**非目标**: 不改业务用法、不删依赖。**验收**: 分类覆盖 100%、`--m-*` 在三套预设下可解析、守卫可判红、基线四项落盘。
2. **剩余 PrimeVue 组件替换（P1）**: 46 处 / 14 类全部换 caomei 等价件（Checkbox 布尔/数组双模型、`Column` 残留复核、`error.vue` 的 Button）；按宿主路由分批并同步测试 stub。**非目标**: 不改表单业务逻辑。**验收**: 组件口径 0、parity 83/83、visual 24/24、E2E critical 全绿。
3. **token 反向切换（P1）**: 1,420 处按「样式基座 229 → 公开页与共享组件约 551 → 管理端约 513」三批替换；语义角色换 `--caomei-*`、调色板换 `--m-*`；幻影 token 清理并入。**非目标**: 不改视觉设计、不做 `:deep()` 泛化清理。**验收**: `--p-*` 口径 0、主题工作台基线不回退、visual 24/24、parity 83/83。
4. **PrimeVue 卸载、样式耦合清理与预算回落（P1）**: 移除 `primevue` / `@primevue/*` / `@primeuix/*` / `primeicons` / `primelocale` 与 `plugins/primevue-i18n.ts`；清 Aura 预设 / `cssLayer` / locale / dedupe / optimizeDeps / `primeicons.css`；删除路由择库机制并改为零残留全量守卫（浮层族专用守卫保留）；清理 `p-*` class 151 处、`.p-*` 选择器 83 处与 PrimeVue 专用 `:deep()`；复算并收紧 `keyCss` / `coreEntryJs`。**非目标**: 不升级 caomei-ui、不删 `@mdi/font`。**验收**: build / frozen-lockfile 干净、脚本口径全 0（或脚本退役）、三层视觉与 E2E 全绿、包体下降且配额三处联动、文档同步。
5. **覆盖率第十三批 + 卸载后回归补齐（P2）**: 4 模块且含 ≥1 大基数（`setting.ts` 25 / `post.ts` 23 / `server/utils/logger.ts` 61 / `agreement.ts` 1），目标 `+0.3pp`；补测卸载后失去 PrimeVue mock 的测试文件。**非目标**: 不做全量铺量。**验收**: 覆盖率算式与增量落盘、`typecheck` / `lint` 0 error。

**回滚边界**:

- 条目 1：`--m-*` 派生层与守卫可独立移除，不影响现有 `--p-*`。
- 条目 2：按宿主路由独立回滚。
- 条目 3：按 3 批独立回滚（样式基座 / 公开页 / 管理端）。
- 条目 4：与条目 3 同批提交，回滚需整体 revert（恢复 nuxt 配置、依赖、插件与路由择库机制）。
- 条目 5：测试文件与覆盖率产物独立可回滚。

**风险提示**: ① token 切换触及 136 文件，必须先落映射表再批量替换，禁止边改边猜；② `--m-*` 的 `color-mix` 派生在暗色与三套预设下需逐组验算，避免浅色通过、暗色回退；③ 卸载会使 `--p-*` 定义源消失，**token 清零与卸载必须同批**，不得先删依赖再补样式；④ `:deep()` / `:global()` 中混有 caomei 与通用用法，只能清理确认仅服务 PrimeVue 的部分；⑤ 卸载后 `coreEntryJs` / `keyCss` 的回落幅度不得直接用于放宽配额，须按实测收紧；⑥ 覆盖率第十三批为 P2，若阶段超时优先移出，不得为凑增量放宽断言。

> 后续阶段轨迹（未展开规划）：**第七十三阶段 = 卸载后观察与性能/覆盖率回归**——监控 `coreEntryJs` / `keyCss` 回落是否稳定、`test:perf:budget:strict` 与 CWV 基线、PrimeVue 残留守卫长期有效性，以及长期主线 #1 的下一批覆盖率切片。具体分桶与验收在准入时按 [项目规划规范 §4.5 Step 7](../standards/planning.md) 单独评估，本阶段不提前落盘。

---

## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
