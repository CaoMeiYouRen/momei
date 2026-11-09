# 第七十二阶段规划归档：token 语义层反向切换与 PrimeVue 卸载

> 本分片承接 `docs/plan/roadmap.md` 主窗口迁出的第七十二阶段完整规划正文（2026-11-09 阶段收口归档）。
> 条目执行明细、验收结论与证据见 [待办事项归档](../todo-archive.md) 的第七十二阶段归档块与 [回归归档分片](../../reports/regression/archive/2026-11-09-phase72-close.md)。

---

## 第七十二阶段：PrimeVue → caomei-ui 迁移（六）——token 语义层反向切换与 PrimeVue 卸载（已审计归档）

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
