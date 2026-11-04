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

### 第七十阶段：B3 表单与设置（筹备中，2026-11-03 立项）

> 规划依据：[项目计划 § 第七十阶段](./roadmap.md) | [迁移方案 §7](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) | backlog 长期主线 #10 / #1。立项构成经用户 2026-11-03 确认（A/A/A/A）。

- [x] **1. B3 开工基座：caomei-ui 1.0.0 GA 升级 + 门禁扩展 + 参考态采集**
    - 执行范围：`1.0.0-rc.1 → 1.0.0` 精确升级并把版本加入 `APPROVED_VERSIONS`；复核 `dependabot.yml` 的 `caomei-ui` ignore 注释；产物字节点检（`.js` / `.mjs` / `.css` / `.vue` 零差异、`dist/styles/index.css` sha256 一致、仅 `.d.ts` 声明顺序与 README / `package.json` 差异）；parity 配置扩第二 webServer（`MOMEI_INSTALLED=false`、独立端口与 project）与 `reader` 档预算校准能力；页面改动前采集 10 条参考态并写入 `reference-manifest.json`（`admin-settings-form` / `admin-settings-theme` / `admin-notifications-list` / `installation-wizard` / `user-settings` / `auth-login` / `auth-register` / `auth-forgot-password` / `auth-reset-password` / `submit-page`）。
    - 非目标：不改任何页面 / 组件，不清 `--p-*`，不做图标全量，不调整既有 `admin` 档预算。
    - 验收标准：GA 与 rc.1 的差异记录可复现且结论一致；参考态 100% 就绪；迁移前 `pnpm test:visual` 与 `pnpm test:visual:parity` 全绿；`keyCss` ≤ 70KB 且无回归。
    - 证据落点：`docs/reports/regression/current.md` 第七十阶段条目 1 窗口、`tests/visual/parity/reference-manifest.json`、迁移方案 §3.11。
    - 进度：**已完成**（2026-11-03）。1a 版本与复测证据见回归记录「条目 1a」窗口；1b/1c 见「条目 1b/1c」窗口（10 条参考态 + 54 条 manifest + parity 55/55）。
- [x] **2. B3-A 管理端设置与通知整路由迁移**
    - 执行范围：2a 设置主体（26 个设置组件 + `pages/admin/settings/index.vue` + `admin-floating-actions`，含 13 个 `TabPanel` 与 **3 张 DataTable**：`agreements-settings` / `setting-audit-log-list` / `admin-notification-settings`；InputText / Password / InputNumber / Textarea / ToggleSwitch / Select / `Tabs` 族 / `MultiSelect` / `Image` / `Divider` / `Message`）；2b 主题工作台（`Panel→Card`、`ColorPicker`、`SelectButton`、`DataView`、3 个浮层内表单）；2c **剩余 1 张 DataTable**（`notification-delivery-log-list`，含 `DatePicker`）+ `/admin/notifications` 整路由（该组件属 B3 范围目录、唯一消费路由为该路由）；路由 scope + `ownedFiles`（含 `components/admin/admin-floating-actions.vue`）与路由级在册族增量登记。
    - 非目标：`--p-*` 与独立 `<i class="pi">` 清理（B4）；不改设置读写 API 与权限逻辑；不做半路由切换。
    - 验收标准：在册族零残留守卫与过渡组件守卫通过；parity 新增 `admin-settings-form` / `admin-settings-theme` / `admin-notifications-list`，未归因差异为 0，差异逐项归因；`tests/pages/admin/settings/{index,theme}.test.ts` 断言改写后通过；`/admin/settings` 视觉基线按迁移后重采。
    - 证据落点：回归记录条目 2 三个窗口、「文件 → 改动点 → 依据指针」清单（按迁移方案 §8.5）、parity 预算条目与 `note`。
    - 进度：**已完成**（2026-11-03 ~ 2026-11-04）。2a 设置主体 25 文件 + 3 个适配层；2b 主题工作台 6 文件（子路由改 `migratedSubRoutes`）；2c 通知管理 2 文件（`DatePicker` 首个生产用法）。
- [x] **3. B3-C 安装向导整路由迁移**
    - 执行范围：`Stepper` 族（Stepper / StepList / Step / StepPanels / StepPanel）、`Accordion` 族、`Password`、`Message` 整批迁移；`pages/installation.vue` 的 21 处 `:deep()` 复核（其中 1 处 `:deep(.p-tag)` 需改写为 caomei 契约，其余为页面自有类选择器）；E2E 改为强制未安装态的六步真实流程断言（含步骤头 `linear` 不可前跳）。
    - 非目标：不改服务端安装逻辑 / API / 中间件；不做真实安装环境改造；`--p-*` token 消费点仍留待 B4 统一清理（仅新增样式不得引入 `--p-*`）。
    - 验收标准：未安装态 server 下视觉基线与 parity 双绿；安装六步真实流程 E2E 2/2 通过（含步骤头不可前跳）；`:deep()` 对 `.p-*` 的依赖归零。
    - 证据落点：回归记录条目 3 窗口、第三条 parity 路由预算、E2E 运行记录。
    - 进度：**已完成**（2026-11-04）。页面 + 6 个步骤组件 + 1 个字段状态组件（共 87 处）；`Stepper` / `Accordion` 族首次生产迁移；E2E 改未安装态六步真实流程（含第二 webServer + 步骤头不可前跳断言）；基线层补 2 张、parity 55/55。
- [ ] **4. B3-D 用户设置与认证 / 提交页整路由迁移（首次启用 reader 档）**
    - 执行范围：`/settings` 页面 + `components/settings/` 6 个组件（5 个由条件 Tab 消费，`notification-history-list` 内嵌于通知面板；`FileUpload` / `ProgressSpinner` / `ToggleButton` / `Checkbox`；验证 `AppUploaderV2` / `AppAvatarV2` 在该路由登记后自动切换）+ `login` / `register` / `forgot-password` / `reset-password` / `submit` 与 `components/auth-card.vue`（`Card` / `Message` / `fluid` 删除 / `severity→tone`）；`reader` 档首次启用并按实测校准预算。
    - 非目标：不改认证 / 注册 / 投稿业务逻辑与字段；不改服务端限流与校验。
    - 验收标准：`reader` 档未归因差异为 0；6 条路由 × 2 主题参考态就绪；`auth` / `submit` E2E 的 `p-*` 断言改写后三浏览器通过。
    - 证据落点：回归记录条目 4 窗口、`reader` 档预算 `note`、偏差处置表（若产生豁免）。
- [ ] **5. 测试覆盖率治理第十一批**
    - 执行范围：开工时按绝对未覆盖语句数复算并选 3 个模块（2026-11-03 候选：`server/services/migration-link-governance.ts` 32 / `.helpers.ts` 30 / `ai/tts.ts` 30 / `ai/quota-governance.ts` 28 / `agreement.ts` 26 / `setting.ts` 25）。
    - 非目标：不做全量铺量、不为冲数字写低价值断言。
    - 验收标准：3 模块各 `+15pp` 或 `≥85%`；全仓 `+0.3pp` 容量目标，未达须记录结构性原因；覆盖率增量与阶段累计分列。
    - 证据落点：`pnpm test:coverage` 产物、回归记录条目 5 窗口、backlog #1 的基线与下一切片回填。

> 历史任务见 [待办事项归档](./todo-archive.md)；候选主线与下一阶段切片见 [项目计划](./roadmap.md) 与 [长期规划与积压项](./backlog.md)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
