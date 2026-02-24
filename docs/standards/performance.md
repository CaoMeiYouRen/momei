# 墨梅 (Momei) 性能基准与优化规范 (Performance Baseline & Optimization Standards)

## 1. 概述 (Overview)

本文档定义第七阶段“性能基准与优化”任务的统一标准，用于约束性能回退、指导优化优先级，并作为 CI/CD 发布门禁依据。

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

## 4. 资源预算标准 (Bundle & Asset Budgets)

### 4.1 JS/CSS 预算

-   核心页面首屏客户端 JS（gzip 合计）：<= 260KB
-   单异步 Chunk（gzip）：<= 120KB
-   首屏关键 CSS（gzip）：<= 70KB

### 4.2 变更预算

-   单个 PR 对核心页面首屏 JS 增量：<= 20KB（gzip）
-   若超过预算，必须在 PR 描述中给出收益说明与回滚预案。

### 4.3 MVP 执行策略 (Current Rollout)

当前阶段采用“先跑通、后收紧”的预算执行策略：

-   CI 在 `build` 后执行 `pnpm run test:perf:budget`，生成 `.lighthouseci/bundle-budget-report.json`。
-   MVP 阶段使用 `warn` 模式，不阻断合并，先建立稳定的预算观测能力。
-   报告通过 GitHub Actions Artifact 上传，供 PR 评审查看超预算项。
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

## 8. 验收清单 (Acceptance Checklist)

-   核心页面 Lighthouse 四项分数均达到门槛。
-   关键指标（LCP/CLS/TBT）满足红线。
-   JS/CSS 与 PR 增量预算均满足约束。
-   CI 中存在可追溯审计记录（报告或日志）。

## 9. 相关文档

-   [项目计划](../plan/roadmap.md)
-   [待办事项](../plan/todo.md)
-   [项目规划规范](./planning.md)
-   [开发规范](./development.md)
-   [测试规范](./testing.md)
