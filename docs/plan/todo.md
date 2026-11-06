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

- [ ] **1. B4 开工基座与现取复核（P1）**
    - **执行范围**: 开工复算（脚本家族分桶 + 未迁移路由清单 + 路由 → 文件 → 组件族映射）；页面改动前登记剩余路由并采集参考态（公开页与布局壳缺口优先，`reader` 档按实测校准）；按批次扩展在册族（`Card` / `Message` / `Skeleton` / `Divider` / `ProgressSpinner` / `Image` / `ProgressBar` / `Badge` / `RadioButton` / `Checkbox` / `Textarea` / `InputNumber` / `Accordion` 族 / `Tabs` 族 / `InputGroup` / `SplitButton` / `ButtonGroup` / `SelectButton` / `AutoComplete` / `MultiSelect` / `DatePicker` / `FileUpload` / `Stepper` 族 / `ColorPicker` / `DataView` / `Panel` / `Toolbar`）。
    - **非目标**: 不改页面、不清 `--p-*`、不卸载 PrimeVue。
    - **验收**: 迁移前 `test:visual` / `test:visual:parity` 全绿；新增参考态 100%（含 manifest 与来源）；未迁移路由清单与脚本口径一致。

- [ ] **2. B4-A 管理端剩余路由整迁（P1）**
    - **执行范围**: 2a 文章编辑器族（`/admin/posts/[id]`（现为例外子路由）与 `components/admin/posts/**`）；2b 其余未迁移管理端路由（`/admin/index`、`/admin/calendar`、`/admin/snippets`（含 `capture`）、`/admin/ai/tasks/[id]`）；`/admin/friend-links`、`/admin/migrations/link-governance`、`/admin/submissions` 等已迁移路由仅随图标与布局壳复核。决策点：`task-detail-content.vue` 的「V2 分支 vs 子路由整迁」、`DataTable` 无 `#header` / `#footer` 插槽的包装元素处置。
    - **非目标**: 不改编辑 / 发布 / AI 任务业务逻辑；不做半路由切换。
    - **验收**: 在册族零残留守卫通过；每条新增路由 parity 逐项归因、未归因 0；管理端 E2E 主路径通过；`/admin/posts/[id]` 不再是 V1 消费者。

- [ ] **3. B4-B 公开页与布局壳整迁（P1）**
    - **执行范围**: 3a 全局壳（`app-header` / `app-notifications` / `app-search` / `app-uploader` / `app-avatar` / `app-voice-input-*` / `reader-controls` / `language-switcher` / `feedback-entry-button` / `article-*` / `comment-*` / `subscriber-form` / `home/**` / `taxonomy-post-page`）；3b 公开路由（首页 / 文章列表与详情 / 友链 / 关于 / 权益 / 反馈 / 分类 / 标签 / 归档 / 跳转页 / 隐私政策 / 用户协议等）。认证 4 页与 `/submit` 已于第七十阶段条目 4 迁移，本批仅随图标与布局壳复核。
    - **非目标**: 不改内容渲染与 SEO 逻辑；不重做信息架构。
    - **验收**: 公开页 `reader` 档 parity 全量归因；关键 E2E（首页 / 文章详情 / 评论 / 搜索 / 友链）通过；SSR + hydration 复核记录落盘。

- [ ] **4. B4-C 图标全量替换与品牌图标落点（P1）**
    - **执行范围**: `pi pi-*` 411 处 / 94 文件 / 118 唯一；其中品牌图标 22 处 / 11 类 → `mdi mdi-*`（保留 `@mdi/font`，零新依赖），其余 389 处 → `@lucide/vue`；数据驱动 `icon: 'pi pi-*'` 改为显式图标映射；`pi-spin` 12 处（生产用法）改由加载态组件承载。
    - **非目标**: 不改 `@mdi/font` 加载方式与体积策略（另登记 backlog）；不做图标视觉重设计。
    - **验收**: 全仓 `pi pi-` 零残留（脚本口径 0）；11 项品牌图标逐一登记落点；视觉 24/24、parity 全绿。

- [ ] **5. B4-D 测试 / E2E 断言改写与守卫收口（P2）**
    - **执行范围**: vitest PrimeVue mock 2 文件与 E2E `p-*` 断言 9 处 / 2 文件改写；`CAOMEI_UI_ROUTE_PREFIXES` 补齐剩余路由，`ownedFiles` / 子路由例外同步（`/admin/posts/[id]` 与 `/admin/ai/tasks/[id]` 由例外转为正式迁移）；视觉与 parity 基线按迁移后实测校准；复算 `keyCss` 与 `coreEntryJs` 并归因（`keyCss` 不得越过 70KB）。
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
