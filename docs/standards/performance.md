# 墨梅博客 性能基准与优化规范 (Performance Baseline & Optimization Standards)

## 1. 概述 (Overview)

本文档定义第七阶段”性能基准与优化”任务的统一标准，用于约束性能回退、指导优化优先级，并作为 CI/CD 发布门禁依据。

适用范围：

-   前台核心页面（首页、文章详情、归档/列表类页面）。
-   Nuxt Web 应用构建产物（客户端 JS/CSS、关键渲染路径资源）。
-   预发布环境与持续集成流程中的 Lighthouse 审计。

## 2. 评估对象与采样策略

### 2.1 核心页面清单 (Core Routes)

-   首页：`/`
-   文章详情：`/posts/:slug`
-   归档/列表页：`/archive`（如路由存在）

### 2.2 测试环境基线 (Baseline Environment)

-   必须基于 `pnpm build` 的生产构建结果执行审计。
-   审计环境使用预发布站点（Preview URL），避免本地开发模式噪声。
-   每个页面采样 3 次，取中位数作为判定值。

### 2.3 设备维度 (Device Profiles)

-   移动端（主门禁）：Slow/Fast 4G + 中低端 CPU 节流场景。
-   桌面端（次门禁）：无网络节流，标准桌面性能配置。

## 3. Lighthouse 红线 (Release Gates)

为避免“标准过高导致流程无法落地”，采用分阶段爬坡策略。

### 3.0 阶段化策略 (Phased Baseline)

#### Phase A：跑通基线（当前阶段，先稳定）

-   目标：流水线稳定产出 Lighthouse 报告，不因环境噪声（如安装态重定向）失败。
-   判定：以 `warn` 级断言为主，不阻断合并。
-   建议阈值（移动端中位数）：
	-   Performance >= 60
	-   Accessibility >= 80
	-   Best Practices >= 85
	-   SEO >= 90

#### Phase B：守住基线（短周期）

-   目标：先锁住 A11y / Best Practices / SEO，防止回退。
-   判定：
	-   Accessibility / Best Practices / SEO 进入 `error` 阻断。
	-   Performance 继续 `warn`，并逐步提升到 >= 60。

#### Phase C：红线门禁（目标态）

-   目标：核心页面四维度全部 >= 90，进入发布阻断门禁。
-   判定：四类评分均为 `error`，低于阈值即阻断发布。

### 3.1 分类得分红线 (Category Gates)

以下阈值适用于核心页面中位数结果（目标态，Phase C）：

| 维度 | 移动端硬门槛 | 桌面端硬门槛 |
| :--- | :--- | :--- |
| Performance | >= 90 | >= 90 |
| Accessibility | >= 90 | >= 90 |
| Best Practices | >= 90 | >= 90 |
| SEO | >= 90 | >= 90 |

任一页面任一维度低于阈值，视为红线触发，CI 失败。

### 3.2 核心 Web 指标红线 (CWV-Oriented Gates)

以下指标用于辅助定位和回归控制（以 Lighthouse 实验室数据为准）：

-   LCP <= 2.5s
-   CLS <= 0.10
-   TBT <= 200ms

若分类分数通过但关键指标持续超阈值（连续 2 次流水线），必须进入修复清单。

### 3.3 CWV 基线采集 (CWV Baseline Collection)

通过 `test:perf:cwv` 脚本建立可追溯的 CWV 基线，覆盖以下公开页：

| 页面 | 路由 | 说明 |
| :--- | :--- | :--- |
| 首页 | `/` | 文章卡片列表 |
| 文章详情 | `/posts/welcome-to-momei-demo` | 完整文章渲染 |
| 分类列表 | `/categories` | 分类聚合页 |
| 标签列表 | `/tags` | 标签聚合页 |
| 归档页 | `/archives` | 时间线归档 |

执行方式：

```bash
pnpm build && pnpm test:perf:cwv
```

输出 `.lighthouseci/cwv-baseline.json`，包含：
- 各页面 3 次采样的 LCP / CLS / TBT 中位数与 rating（good / needs-improvement / poor）
- Performance / Accessibility / Best Practices / SEO 四项分类得分
- 诊断指标（Total Byte Weight、DOM Size、Render Blocking Resources）

基线更新时机：
- 每阶段结束时作为收口动作更新一次。
- 核心页面布局或资源加载策略变更后必须重采。
- 优化前后必须记录对比数据（before / after）。

## 4. 资源预算标准 (Bundle & Asset Budgets)

### 4.1 JS/CSS 预算

-   核心页面首屏客户端 JS（gzip 合计，口径：Nuxt 客户端 manifest 的 `entrypoints` + `preload` JS 去重）：<= 360KB
-   单异步 Chunk（gzip）：<= 130KB
-   首屏关键 CSS（gzip）：<= 70KB

> 以上数值与 `scripts/perf/check-bundle-budget.mjs` 的 `BUDGETS` 保持一致，是**唯一的门禁口径**。
> 两类变更的来源不同，**不要一并处理**：
>
> - **首屏 JS 360KB = 度量口径修复后的重新定标**：原 260KB 对应的口径（入口识别失败时回退为「最小的 3 个 chunk」）从未真正生效、实测只有 210 字节，故该检查此前恒真。改用 Nuxt 客户端 manifest 口径后实测 328.45KB，据此重新定标并留约 10% 余量。它**不是**并存期配额，后续要收紧应作为独立的性能目标（见 [backlog 长期主线 #9](./../plan/backlog.md)），**不得**在迁移收尾时机械回落到 260KB。
> - **关键 CSS 70KB = 并存期临时配额已回落后的现行值**：并存期曾临时放开至 85KB（`caomei-ui@0.1.0` 单体 `styles.css` 导致），**已于 2026-09-24 在接入基座重锚到 `caomei-ui@0.2.0` 的批次内复测并回落至 70KB**（实测 60,684 字节）；85KB 仅作沿革保留，不再是门禁值。PrimeVue 卸载后只需确认未反弹。该实测的口径**待复测**：「零 caomei 组件消费故组件样式零进入产物」的前提与 B2 试点页已消费 5 个 caomei-ui 组件（`CaomeiButton` / `CaomeiSelect` / `CaomeiTag` / `CaomeiInput` / `CaomeiDataTable`）冲突，60,684 字节与 70KB 配额的判定须在 `caomei-ui@0.3.0` 升级批次内重测澄清（升级属待执行条目，见 [迁移方案 §3.7](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)），复测前不作结论、数值保持现状。
>
> 配额来源、度量口径修正与回落要求见 [迁移方案 §8.4.1](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)；修改任一数值时必须同步脚本、基线与本文件三处，并说明属于上述哪一类。

### 4.2 变更预算

-   单个 PR 对核心页面首屏 JS 增量：<= 20KB（gzip）
-   若超过预算，必须在 PR 描述中给出收益说明与回滚预案。

### 4.3 MVP 执行策略 (Current Rollout)

当前阶段采用“先跑通、后收紧”的预算执行策略：

-   CI 在 `build` 后执行 `pnpm run test:perf:budget`，生成 `.lighthouseci/bundle-budget-report.json`。
-   MVP 阶段使用 `warn` 模式，不阻断合并，先建立稳定的预算观测能力。
-   报告通过 GitHub Actions Artifact 上传，供 PR 评审查看超预算项。
-   PR 场景会优先下载 `master` 分支最近一次成功构建产出的 `bundle-baseline-report` 作为增量基线。
-   `master` 推送时会同步上传最新 `bundle-baseline-report`，供后续 PR 增量对比。
-   当预算波动趋稳后，切换到 `pnpm run test:perf:budget:strict`（`error` 模式）进入阻断门禁。

## 5. 关键路径渲染标准 (Critical Path)

必须满足以下实践要求：

-   非关键脚本延迟加载（`defer`/动态导入），避免阻塞首屏渲染。
-   首屏图片优先优化尺寸与格式（`webp/avif`），非首屏图片默认懒加载。
-   避免在首屏同步执行高成本脚本（如大型第三方 SDK）。
-   路由级按需加载，避免将低频功能打入主包。

## 6. CI/CD 门禁策略 (Pipeline Policy)

-   Pull Request：执行核心页面 Lighthouse 审计；Phase A 以 `warn` 为主，Phase B/C 按阶段切换到阻断。
-   主分支发布前：执行完整审计（移动端 + 桌面端 + 预算检查）。
-   每周基线任务：生成趋势快照，识别“缓慢退化”而非仅检测“硬失败”。

## 7. 优化优先级与处置规则

发现性能问题时，按以下顺序处理：

1.  首屏阻塞资源（JS/CSS/字体）
2.  大体积依赖与重复依赖
3.  图片与富媒体资源
4.  次要交互与低频路由优化

涉及架构取舍时，使用规划评分矩阵评估：

$$Score = \frac{Value + Alignment}{Difficulty + Risk}$$

优先处理 Score > 1.5 的优化项。

## 9. 验收清单 (Acceptance Checklist)

-   核心页面 Lighthouse 四项分数均达到门槛。
-   关键指标（LCP/CLS/TBT）满足红线。
-   JS/CSS 与 PR 增量预算均满足约束。
-   CI 中存在可追溯审计记录（报告或日志）。

## 10. 事实源与边界 (Source & Scope)

### 10.1 唯一事实源
本文档是前端性能优化的权威规范，定义 Lighthouse 评分、核心 Web 指标和资源预算标准。

实际的性能测试脚本和预算检查逻辑位于：
- `scripts/perf/check-bundle-budget.mjs`: 资源预算检查脚本
- `scripts/perf/cwv-baseline.mjs`: CWV 基线采集脚本
- `package.json` 中的 `test:perf`、`test:perf:cwv`、`test:perf:budget`、`test:perf:budget:strict` 脚本

### 10.2 非目标内容
以下内容不属于本规范范围（但相关治理文档已覆盖）：
- **API 响应时间**: 属于后端性能范畴，不包含在前端 Lighthouse 审计中
- **服务端渲染 (SSR) 时间**: 属于服务端性能优化范畴
- **数据库查询性能**: 属于后端性能优化范畴，参考数据库规范
- **Nitro 服务端构建产物大小**: 属于服务端部署配置范畴
- **第三方 API 调用延迟**: 属于外部依赖性能范畴
- **Windows 本地 Dev / Build 性能**: 由 [windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md) 专项覆盖

### 10.3 与其他规范的关系
- **安全规范**: 性能优化不得牺牲安全控制（如禁用必要的 CSP）
- **开发规范**: 资源预算需与代码复杂度平衡，避免过度优化

## 11. 相关文档

-   [项目计划](../plan/roadmap.md)
-   [待办事项](../plan/todo.md)
-   [项目规划规范](./planning.md)
-   [开发规范](./development.md)
-   [测试规范](./testing.md)
-   [性能优化历史记录](../design/governance/performance-optimization-log.md)
