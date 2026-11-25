## 第八十五阶段：移动端访问体验优化（公开页，已审计归档）

**时间表**: 2026-11-25 ~ 2026-11-26（已审计归档）

**目标**: 在不改后台与不重做设计体系的前提下，把公开页（reader 面）的移动端体验从「零散 E2E + 桌面视觉门禁」提升为「可回归的移动基线 + 明确可用的阅读 / 导航 / 表单 / 列表体验」。当前缺口已核对：视觉层与 parity 仅跑 1440×900 桌面视口；公开页移动 E2E 仅 1 条汉堡菜单用例；markdown 表格无横向滚动；代码复制按钮仅在 hover 出现；文章目录在移动端直接隐藏；`safe-area-inset` 只覆盖 admin 与反馈按钮；多处 `100vh`；79 处公开面 `:hover` 规则未区分粗指针设备（口径见候选页）。

**准入结论**: 用户于 2026-11-25 给出主题「开始下一阶段规划。继续优化移动端访问体验（不含 admin 页面）」，授权落盘。候选评估见 `artifacts/review-gate/2026-11-25-phase85-mobile-candidates.md`：5 个大条目 / 14 个小条目，Score 按 [规划规范 §3.2](../../standards/planning.md#32-计算公式) 计算 `(Value + Alignment) / (Difficulty + Risk)`，均值 **1.44**（85.1 1.67 / 85.2 1.67 / 85.3 1.33 / 85.4 1.33 / 85.5 1.20）。

**确认档处置**: 85.3 / 85.4 / 85.5 落在「1.0 < Score ≤ 1.5」，标注为**确认档·待用户确认**：本阶段先启动 85.1 / 85.2（Score > 1.5，无需确认），三条确认档条目在用户确认候选页后按 85.3 → 85.4 → 85.5 顺序接入；未确认前不启动、不占容量移出顺序。

**准入前置（已核对 2026-11-25）**: 第八十四阶段已审计归档（`45ab0c9e`）；`todo.md` 无未关闭条目；open PR **0**，无 in-flight 依赖 major 升级 / 自动合并（Mergify 自动合并风险见 backlog #10）；open issue 仅 #262（ESLint 分批，本阶段不涉及）；master 因 `@sentry/nuxt` 11.16 构建期注入导致 `pg` TDZ，已用 `sentry.buildTimeInstrumentation: false` 修复（`3b9cb5e6`）并以 CI 回执作为基线。基线：桌面视觉 32/32、parity 82/83（`user-settings-dark` 既有头像差异）；移动端无视觉基线；duplicate-code 0.31%；coverage 87.92%。

**阶段容量与移出顺序**: 名义容量 5 个大条目 / 14 个小条目（默认容量 4–6）；确认档未确认前实际排期 2 大 / 6 小（85.1 / 85.2），确认后补足至 5 / 14，不额外加项。启动顺序 `85.1 → 85.2`，确认后按 `85.3 → 85.4 → 85.5` 接入；若超时，按 `85.5 → 85.4 → 85.3` 移出，保留门禁与阅读页两项高 Score 条目。

**不做范围（阶段级）**: 不改 `/admin/**`、后台编辑器与安装向导；不新增业务功能；不改路由 / API 契约；不重做设计体系；不引入新 UI 库；不新增第二套设计 token；不放宽既有门禁阈值；不升级 major 依赖。

1. **移动端视觉与回归门禁（P1）**
    - **目标**: 建立 `390×844`（DPR 3）移动视觉基线，覆盖 10–12 条 reader 路由（首页 / 列表 / 详情 / 归档 / 分类 / 标签 / 友链 / 关于 / 提交 / 登录 / 注册 / 设置），并补移动关键路径 E2E。
    - **优先级**: P1（先立护栏，后做优化）。
    - **范围**: `playwright.visual*.config.ts`、`scripts/testing/run-visual*.mjs`、`tests/visual/**`、`tests/e2e/responsive.e2e.test.ts`；CI workflow 视觉任务。
    - **验收标准**: 新增移动视觉脚本可独立运行并在 CI 中通过；移动基线覆盖 ≥10 条路由、动态区域以 `[data-visual-mask]` 遮蔽；移动关键路径 E2E ≥8 条断言（菜单开关、搜索打开/关闭、分页、目录入口、表单提交入口），沿用 `tests/e2e/responsive.e2e.test.ts` 的 `iPhone 13` device override（不新增 project、不改 `mobileCriticalSpecPattern`）；桌面视觉 32/32 与 parity 82/83 不回归。
    - **不做什么**: 不替换桌面视觉门禁；不为移动基线放宽桌面阈值。
    - **依赖**: 现有视觉 / parity 基建与 TEST_MODE 种子数据。
    - **交付物**: 移动视觉脚本与基线、移动 E2E、CI 接入、证据。
    - **风险**: 动态头像 / 封面导致基线抖动；CI 时长增加，需评估并行度。

2. **阅读页移动体验（P1）**
    - **目标**: 让文章页在 360–430px 宽度下可读、可复制、可导航：表格与长内容不撑破视口，代码复制可触达，目录在移动端有入口。
    - **优先级**: P1。
    - **范围**: `styles/_rendering.scss`、`pages/posts/post-detail.scss`、`components/table-of-contents.vue`、`components/article-content.vue`、`components/article-share.vue`。
    - **验收标准**: markdown 表格在窄屏横向滚动且容器可聚焦（键盘可滚动）、不产生页面级横向滚动；代码复制按钮在 `(hover: none)` 或粗指针设备常显且可点击；长 URL / 公式 / 行内代码不溢出；移动端目录可打开、可跳转、可关闭；分享按钮触控目标 ≥44px；文章页移动快照通过。
    - **不做什么**: 不改 markdown 渲染器语义；不引入新目录库；不改文章数据结构。
    - **依赖**: 85.1 移动视觉基线（用于回归）。
    - **交付物**: 样式与目录改动、移动快照、定向 E2E。
    - **风险**: 目录抽屉与文章锚点滚动偏移；表格滚动容器与灯箱手势冲突。

3. **全局壳层与触控目标（P2，确认档 ROI 1.33）**
    - **目标**: 移动端壳层不遮挡、可关闭、可聚焦，触控目标达到可用尺寸。
    - **优先级**: P2。确认档：Score 1.33 落在「1.0–1.5」，按用户主题指令纳入。**Kill-switch**: 若抽屉可访问性改造需替换 `CaomeiDrawer` 或改动 >3 个共享组件，则本阶段只落「安全区 + 视口高度 + 触控尺寸」子项，抽屉焦点管理退回 backlog #11。
    - **范围**: `components/app-header.vue`、`components/app-footer.vue`、`layouts/default.vue`、`components/feedback-entry-button.vue`、公开页样式。
    - **验收标准**: 抽屉打开后焦点进入、Esc / 关闭按钮可关闭、关闭后焦点回到触发按钮、背景滚动锁定、`aria-expanded` 正确（E2E 断言）；header / footer / 悬浮入口的 CSS 声明 `env(safe-area-inset-*)` 并带 fallback（E2E `getComputedStyle(padding*)` 取值断言）；`100vh` 改为 `100dvh` 且提供 `vh` 回退（E2E 计算值断言 + 仓库脚本 grep 确认 `dvh` 声明与 `vh` 回退成对出现）；公开页主要可点击元素触控目标 ≥44×44px（抽样审计 ≥20 个，证据落盘）；hover-only 交互在粗指针设备有可见替代（`@media (hover: none)` 断言 + 至少 2 条 E2E）。真机浏览器栏遮挡与虚拟键盘不在 Playwright 模拟能力内，单列为人工验证项。
    - **不做什么**: 不改 admin 浮层；不改抽屉动画时长；不引入 focus-trap 依赖（用现有能力实现）。
    - **依赖**: 85.1。
    - **交付物**: 壳层改动、触控审计清单、移动快照。
    - **风险**: 焦点管理与 Nuxt 路由切换的竞态；`dvh` 在旧浏览器回退。

4. **表单与输入体验（P2，确认档 ROI 1.33）**
    - **目标**: 移动端表单不再因 iOS 聚焦缩放、键盘遮挡或属性缺失而难以完成。
    - **优先级**: P2。确认档：Score 1.33。**Kill-switch**: 若键盘遮挡需要引入新依赖，或需改动表单提交 API 契约 / 字段 / 失败重试语义，则只落「字号 / `inputmode` / `autocomplete` / 密码显隐」并在 backlog 记录键盘方案评估结论。
    - **范围**: `pages/login.vue`、`register.vue`、`forgot-password.vue`、`reset-password.vue`、`pages/submit.vue`、`pages/settings.vue`、`pages/feedback.vue` 与 `styles/pages/_auth-pages.scss`。`styles/_admin-form.scss` 仅被 admin 组件消费，不在本阶段范围（与「不改 admin」边界一致）。
    - **验收标准**: 输入框在移动端计算字号 ≥16px（`getComputedStyle` 断言）；邮箱 / 密码 / URL 等字段具备正确 `type` / `inputmode` / `autocomplete` / `enterkeyhint`（E2E 属性断言）；密码可见性切换可触达；提交按钮在 `visualViewport` 高度收缩模拟后仍落在可视区内（boundingBox 断言），并声明 sticky + `safe-area-inset-bottom`；校验错误可见并聚焦首个错误；移动快照与定向 E2E 通过。
    - **不做什么**: 不改校验规则与提交接口；不新增第三方表单库。
    - **依赖**: 85.1。
    - **交付物**: 表单属性与样式、移动快照、E2E。
    - **风险**: 16px 字号改变既有视觉密度；`autocomplete` 与密码管理器行为差异。

5. **列表与信息密度（P3，ROI 1.20）**
    - **目标**: 首屏与列表页在窄屏下信息密度合理、分页可点、空态不塌陷。
    - **优先级**: P3。确认档：Score 1.20 落在「1.0–1.5」，标注为**待用户确认**，未确认前不启动。**Kill-switch**: 360px 下无页面级横向滚动 ∧ 卡片标题 ≤2 行不截断 ∧ 分页触控目标 ≥44px 同时成立时，仅登记证据、不做密度调整，并从本阶段移出。
    - **范围**: `pages/index.vue`、`pages/posts/index.vue`、`components/article-card.vue`、`pages/categories/index.vue`、`pages/tags/index.vue`、`pages/archives/index.vue`、`pages/friend-links.vue`、`components/home/external-feed-panel.vue`。
    - **验收标准**: 360px 宽度下卡片不溢出、标题不截断到不可读；分页控件点击后 URL / 列表内容变化且触控目标 ≥44px；分类 / 标签 / 归档 / 友链的标签与元信息正常换行；空态独立基线已交付（骨架屏基线转 backlog 待上收候选 #6，TEST_MODE 无法稳定复现 pending 态）；CLS 基线以 `pnpm test:perf:cwv` 独立观测；移动快照通过。
    - **不做什么**: 不改列表查询与分页协议；不为移动端新建第二套卡片组件。
    - **依赖**: 85.1。
    - **交付物**: 样式与模板微调、移动快照。
    - **风险**: 密度调整影响桌面端，需双向快照对账。

**验证矩阵（阶段级）**:

| 层级 | 命令 / 检查 | 适用条目 |
| :--- | :--- | :--- |
| V0 | `pnpm lint`、`pnpm lint:css`、`pnpm typecheck` | 全部 |
| V1 | 定向 `pnpm exec vitest run tests/e2e/...` / `tests/scripts/...`（按条目指定） | 2 / 3 / 4 / 5 |
| V2 | `pnpm test:visual`（桌面 32）+ 新增移动视觉脚本 | 1 / 2 / 3 / 4 / 5 |
| V2-parity | `pnpm test:visual:parity`（桌面 82/83 + 移动） | 1 / 2 / 3 / 4 |
| V3 | `pnpm test:e2e` 定向（`responsive` / 表单 / 文章页） | 1 / 2 / 3 / 4 |
| RG | `docs:check:*`、`pnpm lint:md`、证据落 `artifacts/review-gate/2026-11-25-phase85-item*-*.md` | 全部 |

**回滚边界（阶段级）**:

- 条目 1：移动视觉脚本、基线目录、移动 E2E 用例、`.github/workflows/test.yml` 新增视觉步骤、`package.json` script 入口、`tests/visual/helpers/visual.ts` 共享 helper 改动六项一并回退；共享 helper 改动须单独提交并在提交前确认桌面 32/32。
- 条目 2–5：按条目、按文件独立 revert；公共样式 mixin 改动单独提交以便回退；85.5 未确认时直接移出，无代码回滚需求。

**风险提示**: ① 移动视觉基线受数据态（头像 / 封面 / 外链）影响，必须先遮罩再定基线；② 85.3 的焦点管理若牵动共享抽屉组件，按 kill-switch 降级；③ 输入字号与密度调整会改变既有视觉，需同时看桌面快照；④ 不引入新依赖是硬约束，键盘遮挡优先用 `visualViewport` 与 sticky 组合。

---

**归档结论（2026-11-26）**: 5 个大条目 / 14 个小条目全部完成并归档。移动视觉基线（24 路由 × 2 主题）与 CI 门禁、阅读页溢出 / 复制 / 目录、壳层可访问性与安全区、公开表单 16px / 属性 / 提交可达 / 错误聚焦、列表 360px 与分页触控均已落地；分页以 12 篇临时文章完成真实点击验证。骨架屏视觉基线因 TEST_MODE 无法稳定复现 pending 态，转 backlog 待上收候选 #6。证据见 `artifacts/review-gate/2026-11-25-phase85-item{1..9}-*.md`。
