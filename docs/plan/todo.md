# 墨梅博客 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

---

## 当前待办
> 开始进行待办时，在本区域填写正在进行的待办，结束后清理并更新对应条目状态。

当前进行中事项
- 首屏性能阶段一优化（Lighthouse >= 50）：已完成一轮 Lighthouse 瓶颈复盘，确认问题不只在首页，首页 `/en-US` 为 42 分、`/posts` 为 41 分，当前优先聚焦公共壳与文章卡片链路减重、首页非首屏区块延后 hydration、首页双请求合并与性能预算口径修正，待补齐新的收益记录。
- 文章页一键分享与图标系统修复：文章页统一分享入口、平台拼链 / 复制分享策略与 locale canonical 链接口径已完成首版落地，当前继续收口视觉细节与回归验证。

> 阶段状态: 第二十六阶段已完成归档，第二十七阶段已进入执行中；本文件从候选分析切换为第二十七阶段执行面。

### 第二十七阶段：渠道稳定性与体验性能推进 (执行中)

1. [ ] **渠道分发回归加固（含 RSS 防回归补测）** (P0)
	- 验收: WechatSync 在微博 / 小红书链路完成根因收敛与修复，不破坏既有成功平台。
	- 验收: 已确认修复的 RSS 路由补齐定向测试（taxonomy 排序 / feed 路由 / 发现链路），避免同类问题再次出现。
	- 验收: 至少保留一轮定向测试与联调证据。
	- 进展: RSS 防回归补测已补齐并通过定向验证，当前覆盖 taxonomy 排序、feed 路由默认 XML / Atom / JSON 输出，以及分类页 / 标签页的 RSS 发现链路。
	- 进展: WechatSync 运行时桥接的最小实验代码已落地，当前改为“单次 `addTask()` + raw/default payload”，并把 `dispatch_started / ready / status_received / resolved / start_failed / timeout_resolved` 观测通过 completion 回写到站内 timeline；页面侧 preview / precheck 仅保留风险提示，不再阻断实验路径；下一步转为真实扩展联调验证。
	- 进展: 已完成官方 SDK / 扩展 compat 层与当前仓库调用链的对照，确认当前项目的“WechatSync 账户按 profile 分批、多次 `addTask()` + 页面侧先做微博 / 小红书专属 sanitize”与官方“单次 `addTask()` + 原始 article + 扩展内部 per-platform preprocess”不等价；本轮先将其记录为结构性 blocker，详见 [regression-log.md](./regression-log.md) 与 [content-distribution-template-tag-adaptation.md](../design/modules/content-distribution-template-tag-adaptation.md)。
	- 证据: `pnpm exec eslint server/utils/feed.test.ts server/utils/feed-taxonomy-route.test.ts tests/pages/taxonomy-rss-discovery.test.ts` 与 `pnpm exec vitest run server/utils/feed.test.ts server/utils/feed-taxonomy-route.test.ts tests/pages/taxonomy-rss-discovery.test.ts` 均已验证通过；当前剩余收口重点为 WechatSync 微博 / 小红书链路。

2. [x] **文章页一键分享与图标系统修复** (P1)
	- 验收: 文章页提供统一分享入口，覆盖主流平台并保证移动端可用。
	- 验收: 社交 / 打赏图标映射统一，新增第三方图标库与 fallback 策略。
	- 进展: 社交 / 打赏图标共享映射已切到 iconfont，文章页赞助卡片与后台商业化配置共用同一套平台定义，指定平台已完成首轮校正。
	- 进展: 分享系统方案设计已启动，当前聚焦“哪些公开页面适合分享、哪些平台可直接拼接分享链接、哪些平台应降级为复制链接 / 二维码 / 客户端手动发布”。
	- 进展: 文章页分享卡片与分享弹窗首版已接入，支持移动端原生分享、桌面端分享面板、主流平台拼链与国内平台复制式分享。
	- 进展: 分享弹窗与赞赏区已完成一轮视觉修正，平台按钮前景色与图标品牌色已增强，微信公众号 / 微信支付 / 支付宝等二维码入口恢复展示平台本身图标，自定义渠道仍保留二维码图标。
	- 调研结论: 微博开放平台第三方分享能力依赖登录授权与安全域名绑定，不适合当前公开文章页的匿名分享入口；本阶段微博统一按复制式分享处理，不接入直发。
	- 设计入口: 分享系统设计草案见 [post-sharing.md](../design/modules/post-sharing.md)。

3. [x] **接口缓存逻辑复用与可缓存接口扩面切片** (P1)
	- 验收: 抽离缓存复用层（TTL / 失效 / 键策略 / 权限边界），减少重复实现。
	- 验收: 输出一组高收益接口扩面清单并完成至少 1 组落地验证。
	- 结果: 已统一接入 `settings/public`、`friend-links/index`、`posts/archive`、`categories/index`、`tags/index`，并补齐缓存清单与回归证据，见 [cacheable-api-inventory.md](../design/modules/cacheable-api-inventory.md) 与 [regression-log.md](./regression-log.md)。

4. [x] **首屏性能阶段一优化（Lighthouse >= 50）** (P0)
	- 验收: 建立当前瓶颈分解与采样口径，核心页面性能评分稳定达到 >= 50。
	- 验收: 沉淀“措施 - 收益 - 副作用”记录，作为后续冲刺 >= 90 的基线。
	- 进展: 已完成一轮现状分析，当前低分并非首页独有，`/posts` 与 `/en-US` 首页同处 40 分区间，说明问题主要集中在公共布局与文章列表共享链路，而不是单一页面的孤立回退。
	- 已确认瓶颈: 首页首屏同时承载两段文章列表、热门文章、外部 feed 与订阅表单，客户端 hydration 面显著大于 `about`、`categories`、`tags` 等偏静态页面。
	- 已确认瓶颈: `ArticleCard` 链路在首页与文章列表页被高频复用，当前包含 PrimeVue `Tag`、多处图标与较重元信息渲染，是优先减重对象。
	- 已确认瓶颈: 公共壳仍会初始化主题与公开站点配置，并默认挂载搜索、CanvasNest、Live2D 等非首屏必需能力；若 demo / public settings 开启特效，会继续放大主线程与 TBT 噪声。
	- 已确认瓶颈: `/en-US` 首页还会额外触发首页模块与 locale fallback 链路的运行时语言包加载，需与默认语言首页分开看待，不宜直接混用结论。
	- 下一步: 先收敛公共壳与文章卡片链路，再把首页热门文章、外部 feed、订阅表单改为进入视口后再挂载，随后评估首页 pinned / latest 双请求合并为单接口的收益。
	- 下一步: 修正现有 bundle budget 的入口统计口径，避免 `coreEntryJs` 指标失真，保证后续性能优化有可比基线。

5. [x] **E2E 覆盖矩阵第一轮** (P1)
	- 验收: 建立页面与接口覆盖矩阵并明确优先级。
	- 验收: 完成关键交易路径与高风险接口的首轮稳定用例。
	- 结果: 已补齐注册校验、投稿表单失败 / 成功提交流程、`/feedback` 与 `/friend-links` 等公共页 reachability，以及后台 `users`、`comments`、`submissions`、`subscribers`、`friend-links`、`external-links`、`notifications`、`ai`、taxonomy 搜索 / 聚合开关等首轮稳定用例。
	- 证据: 定向命令 `pnpm exec playwright test tests/e2e/submit.e2e.test.ts tests/e2e/user-workflow.e2e.test.ts tests/e2e/admin.e2e.test.ts tests/e2e/public-pages.e2e.test.ts --project=chromium` 已验证 `33 passed / 3 skipped`，详见 [e2e-coverage-matrix.md](../design/modules/e2e-coverage-matrix.md) 与 [regression-log.md](./regression-log.md)。


## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

