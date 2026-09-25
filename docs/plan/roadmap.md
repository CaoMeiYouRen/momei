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

### 第六十七阶段归档结论（最近阶段）

**审计结论**: 第六十七阶段四条主线已在实现代码、测试、脚本与规划文档中完成闭环。接入基座已完成 `caomei-ui@0.2.0` 重锚（`theme.css` 注入点唯一、`keyCss` 配额回落 70KB 并刷新基线）；三层视觉验证回归基座已落地为独立截图工程（6 张基线 + 假阳性/假阴性双向验证 + CI `visual` job，初期 `continue-on-error`）；全局 token 语义层桥接以 **unlayered `html:root`** 落地并配级联契约守卫；B2 试点页 `/admin/comments` 完成整路由切换（在册组件族零残留守卫、三层回归、视觉差异逐项归因）。阶段内一并产出「共享壳过渡组件替换清单」与「上游 caomei-ui 反馈问题清单」。`pnpm lint` / `typecheck` / `test` / `test:visual` / `test:perf:budget` 与定向 E2E 均通过；E2E `auth-session-governance` 的 firefox 导航超时已用 HEAD 构建对照复现，判定为既有 flaky 而非本阶段回归。`todo.md` 已清理，`todo-archive.md` 已收录本阶段归档块。

> 后续阶段轨迹（方案 A，已授权方向，未展开规划）见 [迁移方案 §7](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) 与 backlog 长期主线「UI 组件库许可证风险与迁移可行性治理」；各阶段范围须在其准入时按规划规范单独评估，本阶段不提前落盘其原子条目。


## 3. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [长期规划与积压项](./backlog.md)
-   [待办事项](./todo.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
