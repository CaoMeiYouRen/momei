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

**第七十二阶段：PrimeVue → caomei-ui 迁移（六）——token 语义层反向切换与 PrimeVue 卸载（筹备中）**

> 阶段规划、准入结论、ROI、回滚边界与风险提示见 [项目计划](./roadmap.md)；立项 2026-11-08，用户确认「调色板走项目语义层 `--m-*` / 同批移除 `primeicons`、`primelocale` 与路由择库机制 / 纳入覆盖率第十三批」。开工口径（`governance:count:primevue-usage`）：组件 46 处 / 14 类 / 16 文件、图标 0、token 1,420 处 / 120 唯一 / 136 文件、PrimeVue class 151 处 / 36 文件、`.p-*` 选择器 83 处。

- [x] **1. token 语义审计与映射基座（P1）**（2026-11-08 完成）
    - **执行范围**: 把 120 个唯一 `--p-*` 分为三类——v4 语义角色（`text` / `border` / `background` 等，直接映射 `--caomei-*`）、v4 调色板（`surface-*` / `primary-*` / 状态色，映射项目语义层 `--m-*`）、v3 幻影 token（`--p-surface-border` / `--p-text-color-secondary` 等，删除或改语义角色）；在 `styles/main.scss` 落地 `--m-*` 派生层（`color-mix` 从 `--caomei-*` 生成，含 surface / primary / 状态色三组）；映射表落盘并补「禁止新增 `--p-*`」守卫；采集卸载前基线（`keyCss` / `coreEntryJs` / `visual` / `parity`）。
    - **非目标**: 本条目不改业务文件里的 token 用法（仅新增 `--m-*` 与映射表）、不删依赖、不动组件。
    - **验收**: 120 个唯一 token 100% 归类且映射表可机械复算；`--m-*` 派生层在浅色 / 暗色 / 三套预设下取值可解析；新增 `--p-*` 的守卫能判红（用临时文件验证）；基线四项落盘。
    - **完成记录（2026-11-08）**: 映射表 `scripts/governance/data/primevue-token-map.json`（semantic 34 / palette 58 / phantom 28，100% 覆盖）；守卫 `pnpm governance:check:token-map`（临时文件判红单测 7 例）；`--m-*` 派生层 + 明暗/三预设解析契约 8 例；基线 `coreEntryJs` 375,543 B / 370KB、`keyCss` 64,103 B / 70KB、`test:visual` 32/32、`parity` 83/83。口径见 [PrimeVue token 映射表](../design/governance/2026-11-08-primevue-token-mapping.md)。

- [x] **2. 剩余 PrimeVue 组件替换（P1）**（2026-11-08 完成）
    - **执行范围**: 46 处 / 14 类全部替换——`Checkbox`（12，布尔与数组两种模型）、`Card`（5）、`DatePicker`（4）、`MultiSelect`（4）、`InputNumber`（4）、`Textarea`（4）、`Column`（2，残留 DataTable 复核）、`RadioButton`（2，切 `CaomeiRadioGroup`）、`ProgressSpinner`（2）、`Button`（2，`error.vue`）及余下类别；按宿主路由分批（friend-links / marketing / link-governance / ad / submissions / external-links / 用户会话抽屉）并同步测试 stub 与断言。
    - **非目标**: 不改表单业务逻辑与校验；不做半路由切换。
    - **验收**: 组件脚本口径 **0**；`parity` 83/83（差异逐项归因）；`test:visual` 24/24；E2E critical 17 passed / 1 skipped + 安装向导 2 passed；定向单测全绿。
    - **完成记录（2026-11-08）**: 脚本口径 46 处 / 14 类 → **0**（先清 4 处口径假阳性：2 处注释 `<Column …>`、1 处注释 `<Skeleton>`、1 处 lucide `Tag` 图标）；42 处真实用法全部替换（Checkbox 12 / Card 5 / DatePicker 4 / MultiSelect 4 / InputNumber 4 / Textarea 4 / RadioButton 2 / ProgressSpinner 2 / Button 2 / Toolbar 1 / Divider 2）。验证：定向 19 文件 / 202 例 + 守卫 80 例；`test:visual` 32/32；`parity` 83/83（`admin-link-governance` 浅深 allowlist 按实测重校准、`admin-users-list` 修正 `.p-toolbar`→`.caomei-toolbar` 选择器）；E2E critical 17 passed / 1 skipped + mobile 2 passed + 安装向导 2 passed；`coreEntryJs` 375,543 → **359,547 B**（-15,996 B，`error.vue` 的 PrimeVue `Button` 退出入口 chunk）、`keyCss` 64,102 B / 70KB。

- [ ] **3. token 反向切换（P1，体量最大）**
    - **执行范围**: 1,420 处按 3 批替换——① 样式基座 229 处（`styles/main.scss` 桥接反向、`_variables`、`_rendering`、`use-theme`）；② 公开页与共享组件约 551 处；③ 管理端约 513 处。语义角色直接换 `--caomei-*`（text / border / background / field / status），调色板换 `--m-*`；幻影 token 清理并入本条目，不单独拆批；每批以「视觉零差异或按实测归因」为门禁，新增样式不得再引入 `--p-*`。
    - **非目标**: 不改视觉设计与布局；不改主题预设语义；不做 `:deep()` / `:global()` 的泛化清理（属条目 4）。
    - **验收**: 全仓 `--p-*` 脚本口径 **0**（含 `vue` / `scss` / `css` / `ts`）；主题工作台浅深两张基线不回退；`test:visual` 24/24、`parity` 83/83；`--m-*` 与 `--caomei-*` 的解析链在三套预设下可验证。

- [ ] **4. PrimeVue 卸载、样式耦合清理与预算回落（P1，须与条目 3 同批收口）**
    - **执行范围**: 移除 `plugins/primevue-i18n.ts` 与其单测；`nuxt.config.ts` 去掉 Aura `MomeiPreset` / `cssLayer` / PrimeVue locale / `dedupe` / `optimizeDeps` / `css` 中的 `primeicons.css`；卸载 `primevue` / `@primevue/{core,forms,icons,nuxt-module}` / `@primeuix/{styled,styles,themes,utils}` / `primeicons` / `primelocale`；删除路由择库机制（`resolveUiLibraryForRoute*`、`CAOMEI_UI_ROUTE_SCOPES`、迁移守卫）并改为「全站 caomei + 零 PrimeVue 残留」单一守卫；清理 `p-*` class（151 处）、`.p-*` 选择器（83 处）与仅服务于 PrimeVue 的 `:deep()`；复算 `keyCss` / `coreEntryJs` 并按回落收紧配额（含移除的 `primeicons.css` gzip 3,163 B）。
    - **非目标**: 不升级 caomei-ui、不引入新依赖；不改业务组件 API；不删除 `@mdi/font`（品牌图标仍用）。
    - **验收**: `pnpm build` 成功、`pnpm i --frozen-lockfile` 后依赖图无 prime 包；`governance:count:primevue-usage` 组件 / 图标 / token 全 0（或脚本退役并留零残留守卫）；`test:visual` 24/24、`parity` 83/83、E2E critical 全绿；`test:perf:budget` 通过且 `keyCss` / `coreEntryJs` 较卸载前下降（配额按实测收紧并三处联动）；文档（迁移方案、开发规范、性能规范、B4 清单）同步。

- [ ] **5. 覆盖率第十三批 + 卸载后回归补齐（P2）**
    - **执行范围**: 按绝对未覆盖语句数选 4 模块且含 ≥1 个大基数模块（候选 `setting.ts` 25 / `post.ts` 23 / `server/utils/logger.ts` 61 / `agreement.ts` 1），目标单批 `+0.3pp`；补测卸载后失去 PrimeVue mock 的测试文件，确认无「为通过而放宽」的断言。
    - **非目标**: 不做全量铺量；不借机重构测试结构。
    - **验收**: 覆盖率目标与算式落盘（statements 增量 ≥ +0.3pp）；`typecheck` / `lint` 0 error；新增用例有判别力；卸载相关守卫单测全绿。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
