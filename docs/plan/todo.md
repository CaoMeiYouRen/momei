# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 当前进行中阶段

**第七十一阶段：PrimeVue → caomei-ui 迁移（五）——B4 剩余路由、图标全量与门禁收口（筹备中）**

> 阶段规划、准入结论、ROI、回滚边界与风险提示见 [项目计划](./roadmap.md)；立项 2026-11-06，经用户在候选页确认「B 两阶段 / 品牌图标保留 `@mdi/font` / 并入三项既有缺陷小治理」。现取迁移面（`governance:count:primevue-usage`）：组件 482 处 / 40 类 / 82 文件、图标 411 处 / 94 文件、token 1,442 处（本阶段不清）。

- [x] **1. B4 开工基座与现取复核（P1）**
    - **执行范围**: 开工复算（脚本家族分桶 + 未迁移路由清单 + 路由 → 文件 → 组件族映射）；页面改动前登记剩余路由并采集参考态（公开页与布局壳缺口优先，`reader` 档按实测校准）；按批次扩展在册族（展示族与表单族随对应路由整迁登记，残留清零后再全局扩）。
    - **非目标**: 不改页面、不清 `--p-*`、不卸载 PrimeVue。
    - **验收**: 迁移前 `test:visual` / `test:visual:parity` 全绿；新增参考态 100%（含 manifest 与来源）；未迁移路由清单与脚本口径一致。
    - **收口（2026-11-06）**: 1a 未迁移页面 **19 个 / 页面口径 90 处**（剥离注释后 89 处，含 1 处 `pages/index.vue` 的注释引用），与脚本 482 处 / 82 文件一致；清单落盘 [B4 迁移清单](../design/governance/2026-11-06-b4-migration-inventory.md)（路由 → 文件 → 组件族 + 文件 → 改动点骨架）。1b 登记 **14 条**待迁移路由（管理端 2 + 公开页 12），采集参考态 **28 张**（manifest `ref=HEAD`）；`/admin` 与 `/admin/calendar` 因运行时日期窗口 / 「今天」高亮不纳入，另 5 条动态 id / 无种子路由不纳入（2 条日期型 + 2 条动态 id + 3 条无种子 = 7 条路由，清单表内 6 行）；`/privacy-policy`、`/user-agreement` 按默认 agreement 兜底纳入。1c 扩族策略：全局扩基准在册族会使 **8 条已收口路由**立即判红（合法残留），改为随条目 2 / 3 的路由整迁登记 `inScopeComponents`，B3 残留族另行收口后再并入全局基准；子路由例外 `/admin/posts/[id]`、`/admin/ai/tasks/[id]` 随本阶段转正。验证：`test:visual` **24 passed**、`test:visual:parity` **83 passed**、`ui-library-route-migration-guard` **57 passed**、capture 单测 **9 passed**、`typecheck` / `lint` 0 error、`lint-md` 通过。

- [x] **2. B4-A 管理端剩余路由整迁（P1）**
    - **执行范围**: 2a 文章编辑器族（`/admin/posts/[id]`（现为例外子路由）与 `components/admin/posts/**`）；2b 其余未迁移管理端路由（`/admin/index`、`/admin/calendar`、`/admin/ai/tasks/[id]`；`/admin/snippets`（含 `capture`）已于 2026-11-06 完成迁移（待 Round 3 复审））；`/admin/friend-links`、`/admin/migrations/link-governance`、`/admin/submissions` 等已迁移路由仅随图标与布局壳复核。决策点：`task-detail-content.vue` 的「V2 分支 vs 子路由整迁」、`DataTable` 无 `#header` / `#footer` 插槽的包装元素处置。
    - **进度（2026-11-06）**: `/admin/snippets` + `/capture` 整路由迁移完成（待 Round 3 复审；7 文件：5 组件 + 2 页面；Button / Tag / Checkbox / Paginator / Textarea / Select / SelectButton / InputNumber / Divider / Card / Image / Accordion 族 + 图标 30+）；parity 4/4 PASS（allowlist 按实测登记）、单测 15 例（页面 5 + 组件 10）、guard 全绿；路由 scope 与 `migratedSubRoutes` 已登记。剩余 `/admin/posts/[id]`（编辑器族）。
    - **进度（2026-11-06 追加）**: `/admin/ai/tasks/[id]` + `task-detail-content` / `task-details-dialog` / `stats-overview` / `metric-card` 迁完；`AI_ROUTE_SCOPE` 由子路由例外转为 `migratedSubRoutes`，parity admin-ai 4/4 PASS、单测 8 例、guard 58。
    - **进度（2026-11-07 追加）**: `/admin/calendar` + `calendar-view` / `kanban-view` 迁完；Tabs 族改 CaomeiTabs + Trigger/Content，看板计数 Tag 走 tone；迁移新增组件测试 9 例（另保留既有 9 例）、浏览器探针 pageerror 0。
    - **进度（2026-11-07 追加，仪表盘）**: `/admin` + `dashboard/{metric-card,creator-metric-card,creator-stats-panel}` 迁完（Button / Tabs 族 / Select / Tag / ProgressSpinner / Card + 图标 17 处（页面 12 + 创作面板 5））；`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin` 前缀登记（前缀语义 → 管理端树逐页声明归属，仅编辑器留作例外）；新增单测 12 例（页面 5 + 指标卡 4 + 创作面板 3）、浏览器探针 pageerror 0。
    - **进度（2026-11-07 追加，编辑器）**: `/admin/posts/[id]` + 19 个 `components/admin/posts/**` 迁完（RadioButton → RadioGroup、ToggleSwitch → Switch、ProgressBar、AutoComplete / InputGroup / SplitButton / ButtonGroup / Divider / Image / Message / Avatar / InputNumber / Textarea + 图标 81 处）；V1 三件套（`post-audit-badge` / `post-audit-dialog` / `publish-push-dialog`）与两份「两版等价」契约测试删除；`/admin/posts` 登记 `ownedFiles` / `inScopeComponents` / `migratedSubRoutes`，`primeVueSubRoutes` 全仓清零；顺带修复 69 阶段遗留的浮层锚点空盒子。验证：组件测试 152（含守卫）、`typecheck` / `lint` / `lint:css` 0 error、build 通过、管理端 E2E 主路径通过、浏览器探针 pageerror 0。复算：组件 370 → **188 处 / 26 类**，图标 328 → **235 处**。
    - **非目标**: 不改编辑 / 发布 / AI 任务业务逻辑；不做半路由切换。
    - **收口（2026-11-07）**: 验收逐项达成——① 在册族零残留守卫 **60 passed**（`/admin`、`/admin/posts`、`/admin/calendar` 等全绿，含新增的 19 个 `ownedFiles`）；② parity：snippets 4/4、admin-ai 4/4、仪表盘与编辑器无跨日 / 无稳定种子基线，改由组件测试 + 浏览器探针 + E2E 覆盖（`/admin` 与 `/admin/posts/[id]` 的偏差与残余已登记回归窗口）；③ 管理端 E2E 主路径（`admin-workflow.e2e.test.ts` 14 passed、`admin-posts-shortcut.e2e.test.ts` 4 passed）通过；④ `/admin/posts/[id]` 已切 V2 且 V1 三件套删除，不再是 V1 消费者。**遗留**：`/admin/marketing` 与 `/admin/migrations/link-governance` 的展示族残留（`Card` / `ProgressSpinner`）按 §4 口径留待 B3 残留族收口；发布确认浮层的 `DatePicker` 仍为 PrimeVue（B3 表单族）。

- [x] **3. B4-B 公开页与布局壳整迁（P1）**
    - **执行范围**: 3a 全局壳（`app-header` / `app-notifications` / `app-search` / `app-uploader` / `app-avatar` / `app-voice-input-*` / `reader-controls` / `language-switcher` / `feedback-entry-button` / `article-*` / `comment-*` / `subscriber-form` / `home/**` / `taxonomy-post-page`）；3b 公开路由（首页 / 文章列表与详情 / 友链 / 关于 / 权益 / 反馈 / 分类 / 标签 / 归档 / 跳转页 / 隐私政策 / 用户协议等）。认证 4 页与 `/submit` 已于第七十阶段条目 4 迁移，本批仅随图标与布局壳复核。
    - **非目标**: 不改内容渲染与 SEO 逻辑；不重做信息架构。
    - **验收**: 公开页 `reader` 档 parity 全量归因；关键 E2E（首页 / 文章详情 / 评论 / 搜索 / 友链）通过；SSR + hydration 复核记录落盘。
    - **完成（2026-11-08）**: 3a 组件面三批——全局布局壳 5 文件（25 处）、公开页内容组件 6 文件（31 处）、公开页外围组件 4 文件（24 处）；3b 公开路由 9 文件（首页 / 文章列表与详情 / 友链 / 归档 / 分类 / 标签 / 跳转页 / 法务协议页，61 处）+ 7 条路由 scope 登记；过渡组件收口（`AppAvatar` / `AppUploader` / `AdminContentLanguageSwitcher` 删除路由择库并删 V1，6 组 `-v2` 文件去后缀）。组件 **188 → 47 处 / 26 → 15 类**、图标 **235 → 136**、token 1,420；parity **41 条已迁移 / 0 待迁移**、`test:visual` 24/24、E2E critical 17 passed + 安装向导 2 passed。同批修复 `use-theme` 的 `@layer` 层序位置与 scoped `:global(.dark)` 的 token 全局污染，并写入回归窗口。
    - **遗留（转条目 5）**: 首页 `/` 与 `/goto/[code]` 因守卫口径（`prefix !== '/'`、`resolvePageFile` 不识别 `[code].vue`）暂未登记路由 scope。

- [x] **4. B4-C 图标全量替换与品牌图标落点（P1）**
    - **执行范围**: `pi pi-*` 411 处 / 94 文件 / 118 唯一；其中品牌图标 22 处 / 11 类 → `mdi mdi-*`（保留 `@mdi/font`，零新依赖），其余 389 处 → `@lucide/vue`；数据驱动 `icon: 'pi pi-*'` 改为显式图标映射；`pi-spin` 12 处（生产用法）改由加载态组件承载。
    - **非目标**: 不改 `@mdi/font` 加载方式与体积策略（另登记 backlog）；不做图标视觉重设计。
    - **验收**: 全仓 `pi pi-` 零残留（脚本口径 0）；11 项品牌图标逐一登记落点；视觉 24/24、parity 全绿。
    - **完成（2026-11-08）**: 剩余 136 处 / 40 文件清零（生产约 110 处 + 注释与测试断言 18 处）；非品牌改 `@lucide/vue`（按原 CSS 字号换算 `:size`），8 类品牌走 `mdi mdi-*`、tiktok / discord / paypal 因 `@mdi/font` 未收录改内联 Simple Icons；5 个数据驱动配置（菜单 / 商业平台 / AI 任务类型 / 分享平台 / 社交发布平台）改为组件并同步消费方。同批把种子文章发布时间固定，消除参考态日期漂移；组件复算 47 → **46 处 / 14 类**、图标 **0**、token 1,420；`test:visual` 24/24、parity 83/83、typecheck / lint 0 error。

- [ ] **5. B4-D 测试 / E2E 断言改写与守卫收口（P2）**
    - **执行范围**: vitest PrimeVue mock 2 文件与 E2E `p-*` 断言 9 处 / 2 文件改写；`CAOMEI_UI_ROUTE_PREFIXES` 补齐剩余路由，`ownedFiles` / 子路由例外同步；视觉与 parity 基线按迁移后实测校准；复算 `keyCss` 与 `coreEntryJs` 并归因（`keyCss` 不得越过 70KB）。
    - **过渡组件去 `-v2` 后缀（2026-11-07 用户确认）**: **已于 2026-11-08 随条目 3 收口完成**（posts 三件套 + `app-avatar` / `app-uploader` / `content-language-switcher`，含文件重命名、`import` / 模板标签 / 测试 mock / `ownedFiles` 同步与守卫改写），本条保留为验收口径记录。
    - **原口径**: `components/admin/posts/{post-audit-badge-v2,post-audit-dialog-v2,publish-push-dialog-v2}.vue` 的 V1 已随条目 2 删除，重命名为去 `-v2` 的正式名，并同步 `pages/admin/posts/{index,[id]}.vue` 的 import 与模板标签、`pages/admin/posts/index.test.ts` 的模块 mock 与断言标记、`lib/ui-library.ts` 的 `ownedFiles`、`tests/modules/ui-library-transition-component-guard.test.ts` 的消费处择库注册表，以及迁移方案 §5.5 / B4 清单 / 回归窗口中的引用。`app-avatar-v2` / `app-uploader-v2` / `content-language-switcher-v2` **等条目 3 把其 V1 消费者清零后**再统一处理。**验收**：posts 族无 `-v2` 残留；过渡守卫「注册表与磁盘一致」通过；定向组件测试与 `typecheck` / `lint` 0 error。
    - **非目标**: 不借机重构无关测试；不降低断言强度。
    - **验收**: 全量 `pnpm test` 通过；guard 全绿；E2E critical 三浏览器通过；包体与样式预算复算记录落盘。

- [ ] **6. 覆盖率第十二批 + 既有缺陷小治理（P2）**
    - **执行范围**: 6a 覆盖率按绝对未覆盖语句数复算、**4 模块粒度且须含 ≥1 个大基数模块**（前四个 `server/services/` 小模块合计仅 102 条，不足 `+0.3pp` 所需 109 条；须纳入 `typeorm-adapter.ts` 84 或 `logger.ts` 61 之一），目标单批 `+0.3pp`；6b i18n 键层缺陷（8 个重复键 / 20 组双源同键 / 6 + 3 个死键 / 1 处硬编码）；6c `useI18n()` 非 setup 顶层调用（`snippet-aggregate-dialog` 2 处、`creator-stats-panel` 3 处）；6d `friend-link` 的 `name` / `url` 归一化被 `assignDefined` 覆盖。
    - **非目标**: 不做全量铺量；不改 UI 布局与 i18n 装配方式。
    - **验收**: 覆盖率目标与算式落盘；6b–6d 各带可判别断言；`i18n:audit:duplicates` 组数不增、`i18n:audit:missing = 0`、`lint:i18n` 通过。

> 历史任务见 [待办事项归档](./todo-archive.md)；token 切换与 PrimeVue 卸载为第七十二阶段候选方向，见 [项目计划](./roadmap.md) 与 [长期规划与积压项](./backlog.md)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
