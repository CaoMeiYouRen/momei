# 第七十阶段规划归档：B3 表单与设置、GA 升级与门禁扩面

> 本分片承接 `docs/plan/roadmap.md` 主窗口迁出的第七十阶段完整规划正文（2026-11-05 阶段收口归档）。
> 条目执行明细、验收结论与证据见 [待办事项归档](../todo-archive.md) 的第七十阶段归档块与 [回归归档分片](../../reports/regression/archive/2026-11-05-phase70-close.md)。

---

## 第七十阶段：PrimeVue → caomei-ui 迁移（四）——B3 表单与设置、GA 升级与门禁扩面（已审计归档）



**时间表**: 2026-11-03 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 承接 backlog 长期主线第 10 条的第四阶段切片，把 B3 表单与设置族整路由迁到 caomei-ui，并补齐本阶段特有的两个门禁空白（安装向导未安装态、`reader` 档从未启用）。2026-11-03 现取口径：**54 文件 / 598 处 PrimeVue（占剩余面 54.7%）/ 38 个组件族 / 100 处图标（其中 65 处为组件 `icon` prop）/ 282 处 token（组件文件口径）**；分组为管理端设置与通知 406 处（33 文件）、安装向导 87 处（8 文件）、用户设置与认证 105 处（13 文件）。同批完成 `caomei-ui@1.0.0` GA 升级，并上收覆盖率第十一批。

**准入结论**: 五条条目经用户 2026-11-03 在候选页确认（阶段构成 A / 安装向导门禁 A / 认证页档位 A / 覆盖率 A）。条目 1–4 来自 [迁移方案 §7](../../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) 的 B3 段与 backlog #10，条目 5 来自 backlog #1。ROI：基座 2.00 / 管理端设置 1.50 / 安装向导 1.33 / 用户设置与认证 1.80 / 覆盖率 1.75；**条目 3 低于 1.5 阈值，是本期唯一可延后的条目**（若阶段超时，优先移入第七十一阶段）。不上收：#2 结构复用、#5 i18n 重复键扫描、#6 回归窗口阈值单点化、#11 S1 幻影 token（随 71）、#9 `--transition-mode` 移除（下次发布后）。

**准入前置（已核对 2026-11-03）**: 第六十九阶段已审计归档、`todo.md` 无已完成阶段正文、`git status` 干净且 `master` 与 `origin/master` 同步（`888c3bd9`）；CI 回执 Test / CodeQL 均 success（`#44` 已复扫关闭）；`caomei-ui@1.0.0` GA 已于 2026-11-02 发布（`dist-tags.latest`），与 `1.0.0-rc.1` 实测 `.js` / `.mjs` / `.css` / `.vue` 产物零差异、`dist/styles/index.css` sha256 一致，差异仅 `package.json` 版本、README 与 28 个 `.d.ts` 的声明顺序；升级仍须经人工批准入口（`tests/modules/caomei-ui-version-pin.test.ts` 的 `APPROVED_VERSIONS`）。

**长期主线容量说明**: 迁移主线占本阶段主要容量（B3 是剩余迁移面中体量最大的一批：598 处 / 54 文件，占剩余面 54.7%），故条目 2 拆 3 次提交、各自独立 Review Gate；治理侧只上收覆盖率第十一批（3 模块、全仓 `+0.3pp` 容量目标），其余主线由 `pnpm regression:weekly` 保持不回退。

1. **B3 开工基座：GA 升级 + 门禁扩展 + 参考态采集（P1）**: 1a `1.0.0-rc.1 → 1.0.0` 精确升级（`APPROVED_VERSIONS`、`dependabot.yml` 注释复核、产物字节点检、复跑视觉 / parity / `keyCss`）；1b parity harness 扩第二 webServer（`MOMEI_INSTALLED=false`，独立端口 + 独立 project）与 `reader` 档预算校准能力；1c 在**任何页面改动前**采集 10 条参考态（HEAD 就地采集，manifest 记录 ref）。**非目标**: 不改页面、不清 `--p-*`、不做图标全量。**验收**: GA 与 rc.1 的产物差异记录可复现；参考态 100%（含 manifest）；迁移前 `test:visual` / `test:visual:parity` 全绿。
2. **B3-A 管理端设置与通知（P1）**: 2a 设置主体（26 个设置组件 + 页面 + 保存条，含 13 个 `TabPanel` 与 3 张 DataTable：`agreements-settings` / `setting-audit-log-list` / `admin-notification-settings`；InputText / Password / InputNumber / Textarea / ToggleSwitch / Select / `Tabs` 族 / `MultiSelect` / `Image` / `Divider` / `Message`）；2b 主题工作台（`Panel→Card`、`ColorPicker`、`SelectButton`、`DataView`；已于 2026-11-04 完成）；2c 剩余 1 张 DataTable（`notification-delivery-log-list`，含 `DatePicker`）+ **`/admin/notifications` 整路由**（该组件位于 B3 范围目录、唯一消费路由为 `/admin/notifications`，必须同批整路由迁完；已于 2026-11-04 完成）。路由登记 `/admin/settings` scope + `ownedFiles`（含 `components/admin/admin-floating-actions.vue`），在册族走**路由增量**。**非目标**: `--p-*` 清理、独立 `<i class="pi">`。**验收**: 在册族零残留守卫通过；parity 新增 3 条路由且差异逐项归因；两页单测（533 + 233 行）断言改写后通过。
3. **B3-C 安装向导（P2，已于 2026-11-04 完成）**: `Stepper` 族 / `Accordion` 族 / `Password` 整批迁移（页面 + 6 个步骤组件 + 1 个字段状态组件（共 87 处））+ `pages/installation.vue` 的 `:deep()` 复核（`.p-tag` 依赖归零）；E2E 由「已安装即通过」的弱断言改为未安装态实例上的六步真实流程（并断言步骤头不可越过校验门）。**非目标**: 不改服务端安装逻辑与 API。**验收**: 未安装态 server 下视觉基线（24/24）+ parity（55/55）双绿，未归因差异 0；安装流程 E2E 2/2 通过。
4. **B3-D 用户设置与认证/提交（P2，已于 2026-11-04 完成）**: `/settings` 页面 + `components/settings/` 6 个组件（5 个由条件 Tab 消费，另有 `notification-history-list` 内嵌于通知面板；`FileUpload` / `ProgressSpinner` / `ToggleButton` / `Checkbox`；`AppUploaderV2` / `AppAvatarV2` 在该路由登记后自动切换需实测）+ 5 个认证/提交页（`auth-card` 共享壳、`Card` / `Message`、`fluid` 删除、`severity→tone`）；**首次启用 `reader` 档**（6 条路由 × 2 主题，按实测校准 2000 px / 0.3% 预算）。**验收**: `reader` 档未归因差异为 0（实测 12 条全部登记，清零）；登录 / 注册 / 提交三条主路径在 chromium 单 worker 下通过（并行抖动为既有 networkidle 等待策略所致，未改动）。
5. **测试覆盖率治理第十一批（P2，已于 2026-11-05 完成）**: 按绝对未覆盖语句数选模（开工复算，2026-11-03 候选：`migration-link-governance.ts` 32 / `migration-link-governance.helpers.ts` 30 / `ai/tts.ts` 30 / `ai/quota-governance.ts` 28 / `agreement.ts` 26 / `setting.ts` 25）。**验收**: 3 模块 `+15pp` 或 `≥85%`（实测 100% / 98.87% / 100%）；全仓 `+0.3pp` 容量目标未达，已记录结构性原因（3 模块池上限 +0.25pp，需 109 条而池仅 92 条）。

**回滚边界**:

- 条目 1：版本、parity 配置与参考态各自独立可回退；删除参考态不影响迁移前基线。
- 条目 2：按 2a / 2b / 2c 独立回滚，`CAOMEI_UI_ROUTE_SCOPES` 同步收缩。
- 条目 3：安装路由独立回滚；第二 server 配置可单独摘除。
- 条目 4：`reader` 档预算条目可单条移除，路由回滚同步收缩 scope。
- 条目 5：测试文件独立可删。

**风险提示**: ① `notification-delivery-log-list` 属 B3 范围目录但唯一消费路由是 `/admin/notifications`，漏迁该路由会让组件迁移后落在未登记路由内（守卫只扫描已登记前缀，抓不到这类混用）；② 参考态必须在页面改动前采集，`--revert` 只能补救、成本翻倍；③ `DatePicker` / `MultiSelect` / `Stepper` / `ColorPicker` / `DataView` / `FileUpload` 属首次生产迁移，须先做 1 个代表文件 + 定向回归再批量；④ `ToggleSwitch` 44 处的 `change` 载荷差异逐处核对；⑤ `reader` 档首次启用可能暴露历史漂移，校准样值入预算 `note`，禁止为变绿放宽阈值。
