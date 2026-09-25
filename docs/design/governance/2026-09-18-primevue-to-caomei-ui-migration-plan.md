# 2026-09-18 PrimeVue → caomei-ui UI 组件库迁移方案（已授权执行）

- 日期：2026-09-18（2026-09-20 更新：库侧前置已归档、消费路径已确定、方案 A 三阶段获授权；2026-09-22 更新：目标依赖由 `caomei-ui@0.1.0` 上移到 `0.2.0`，样式入口与并存期包体口径随上游破坏性变更重定，见 §3.6；2026-09-25 更新：上游 0.3.0 已发布并调整目标基线口径，见 §3.7）
- 性质：**迁移评估与执行方案**。本文档为文档产物，**不含任何代码改动**；迁移已授权开工。
- 状态：**已开工规划**。库侧前置（caomei-ui Phase 7 第二阶段，含 M5）已于 2026-09-19 完成归档；`caomei-ui@0.2.0` 已于 2026-09-22 发布（覆盖库侧 Phase 11 M1~M5，含包形态破坏性变更），迁移目标依赖随之更新；momei 侧按方案 A 三阶段轨迹推进，第六十七阶段为首个执行阶段——接入基座已按 0.1.0 落地，**已于 2026-09-24 重锚到 0.2.0**（`keyCss` 配额回落 70KB，见 §3.6 与 §8.4.1）；`caomei-ui@0.3.0` 已于 2026-09-24 发布且无 `BREAKING CHANGES`，为**目标基线**，**已于 2026-09-26 完成升级与基线复测**（第六十八阶段条目 1，见 §3.7 与 [回归记录](../../reports/regression/current.md) 第六十八阶段条目 1 节）。
- 事实源边界：库侧能力面、映射表、有意差异与验收判定口径以 caomei-ui 仓库的治理文档为**唯一事实源**（见 §13）；本文档只承载 momei 侧现状基线、批次编排、momei 侧执行动作与开工前置条件，不重复库侧明细。
- 回链主文档：[UI 设计](../ui.md)（组件库章节在迁移收尾前仍描述 PrimeVue，迁移执行时同步）。
- 上游动因：[2026-08 PrimeVue 5 许可证变更专项评估](./2026-08-29-primevue-5-license-change-evaluation.md)。
- 跟踪载体：[backlog.md](../../plan/backlog.md) 长期主线第 11 条。

## 1. 背景与迁移动因

PrimeVue 5 起并入 **PrimeUI 商业许可**、不再作为开源软件发布，与 momei「MIT + 用户自部署」模型结构性冲突。既有专项评估已判定 Dependabot PR #688 为 No-Go，并将 `primevue` / `@primevue/*` / `@primeuix/*` 长期屏蔽在 4.x。

随后果是：**锁定的 PrimeVue 4.5.5 成为终点依赖**——MIT 授权本身永久有效，但官方未承诺 v4 的长期安全维护窗口，功能与安全更新预期停止。为规避 PrimeUI 商业许可风险并恢复组件库的许可证稳定性，需要迁移到许可证可控、可持续维护的组件库。

选择 **caomei-ui** 的依据：

1. 自研、MIT 许可、许可证风险可由项目自行控制，不会重复踩到同类「许可证转向」。
2. 技术栈一致：Vue 3 + Reka UI + TypeScript，与 momei 的 Nuxt 4 / Vue 3 兼容。
3. 已具备迁移基础设施：Nuxt 模块、自动导入 resolver、样式与主题预设（含 `momei` 预设）、`CaomeiConfigProvider` i18n 注入。
4. 库侧已按 momei 实际用法做过覆盖度核对与能力面补齐（见 §13 的可行性评估与使用复核台账）。

> 迁移范围仅限**组件库与图标体系**。momei 未使用 Tailwind，不涉及 utility 框架迁移；`@primevue/forms` 依赖存在但零使用。

## 2. 评估结论

**结论：可行（有条件），按 C3「分批全量」推进；2026-09-19 起开工条件已满足。**

- **能力面已无不可逾越的阻塞**：库侧对 momei 59 个 PrimeVue 组件的覆盖核对结果为「需新组件 11/11 已交付、需增强受检 24 项 = 完全交付 8 / 部分交付 16 / 完全未交付 0」；部分交付项的剩余缺口全部为「库侧可补的增强」或「一次性机械改写」，不存在「PrimeVue 有、caomei-ui 结构上做不到」的能力。
- **唯一结构性差距已消解**：DataTable 列级插槽（`#body` / `#header`）已由库侧以 `#cell-{key}` / `#header-{key}` 交付；momei 侧 `<Column>` 153 次无需改写为 render 函数。
- **原唯一阻塞已解除（2026-09-19）**：caomei-ui **M5「浮层与展示类」10 项已全部交付**（M5-1 ~ M5-10），caomei-ui Phase 7 第二阶段已归档，B1 出口条件（补齐项带单测与文档、DataTable 列插槽有中英迁移示例、库侧 `pnpm verify` 通过）已达成——最后一次全量 `pnpm verify` 为 71 文件 / 1368 例通过。因此 B2 / B3 / B4 不再受库侧阻塞。
- **消费路径已确定（2026-09-19，2026-09-22 更新）**：`caomei-ui@0.2.0` 已发布至 npm（MIT，导出 `.` / `./nuxt` / `./resolver` / `./theme.css`），CI / Docker / Vercel 可按常规 npm 依赖解析；本地联调需要未发布改动时改用 `file:` 协议。
- **momei 侧新增强制项**：迁移期间必须建立**视觉验证回归**（单元 / E2E / 截图三层，见 §8.2），并在迁移前采集 PrimeVue 基线。此项为第六十七阶段的先行主线，不建立则不满足逐批验收口径。
- **上游 0.2.0 已发布并改变两项关键前提（2026-09-22）**：① 样式入口由单体 `caomei-ui/styles.css` 改为基础层 `caomei-ui/theme.css` + 逐模块组件 CSS（打包器按需 tree-shaking），本方案原「双库并存期包体膨胀（`keyCss` +15.3KB gzip）」的前提消失，见 §3.6 与 §8.4.1；② 库侧 Phase 11 M3 补齐了 Select 分组、Tag 可选态、AutoComplete 严格模式、DropdownMenu 嵌套子菜单等能力，§6 的映射与差异清单需同步。目标依赖由 `0.1.0` 上移到 `0.2.0`（仍精确锁定）。

三条先决条件（承自可行性评估）的当前状态：

1. 库侧两张映射表（token / 图标）与并存隔离策略评审通过——**已由 caomei-ui 交付**。
2. 迁移前视觉基线采集完成且可复现（列表 / 表单 / 浮层各 1 页）——**待第六十七阶段完成，并升级为可自动比对的截图回归**。
3. 双库并存按路由 / 页面白名单隔离，禁止同一路由内混用两套组件——**待第六十七阶段落地载体**。

上述三条之外另有版本相关约束，分两条：① **B0b 硬前置**——接入基座的 `0.1.0 → 0.2.0` 重锚与 `keyCss` 复测回落（口径已复测澄清，见 §8.4.1）须先于 B0b 完成，**已完成**（见 §3.6）；该条不满足时 B0b 视觉基线会建立在即将被替换的样式形态上，属无效基线。② **收尾前待执行条目（不门控 B0b）**——目标基线升级到 `caomei-ui@0.3.0`（`package.json` 精确锁定）**已于 2026-09-26 完成**（第六十八阶段条目 1）；`0.3.0` 无包形态破坏性变更、exports 面与 `0.2.0` 一致（见 §3.7），不替换样式入口形态，故不构成 B0b 前置。

## 3. 现状基线（momei 侧）

### 3.1 依赖与集成方式

| 项 | 现状（2026-09-18，HEAD `179f186f`） |
| :--- | :--- |
| PrimeVue 版本 | `primevue@^4.5.5`、`@primevue/nuxt-module@^4.5.5`、`@primeuix/themes@2.0.3`、`primeicons@^8.0.1` |
| 接入 | Nuxt 模块（`nuxt.config.ts` `modules`）；`definePreset(Aura, …)` 自定义 `MomeiPreset`（灰阶 primary + light/dark surface 映射） |
| 暗色模式 | `darkModeSelector: '.dark'` |
| CSS 层叠 | `cssLayer.order: 'primevue, momei-base, momei-overrides'` |
| locale | 模块 `locale: zh_CN` + `plugins/primevue-i18n.ts`（监听 Vue-i18n 切换 `primelocale`） |
| 显式导入 | 以 Nuxt 自动导入为主；显式 `from 'primevue/*'` 以 `useToast` / `useConfirm` 为主 |
| unstyled / pt | 无全局 unstyled；`pt` 仅 2 个文件 |
| Tailwind | 未使用、未安装——迁移不涉及 utility 框架 |
| 图标来源 | `primeicons` 字体 + `@mdi/font`（2 处）；无 lucide / iconify / heroicons / tabler 导入 |

### 3.2 用量与耦合面（迁移工作量驱动项）

统计口径见 §3.4；**下表数字已于 2026-09-20（第六十七阶段 M1）用 `pnpm governance:count:primevue-usage` 重新取数**，命令与脚本入口见 §3.4。

| 类别 | 计数（2026-09-20 重取） | 口径 / 说明 |
| :--- | ---: | :--- |
| PrimeVue 组件种类 | **59** | `.vue` 开标签识别，组件名取自 `@primevue/metadata@4.5.5` |
| 组件开标签用法 | **1515** | 分布于 **148** 个 `.vue`（应用 `.vue` 共 179 个，占比 83%） |
| 图标字符串 `pi pi-*` | **629 处 / 145 文件 / 129 唯一** | 唯一数比 2026-09-18 记录的 128 多 1，因本次口径含 `pi pi-spin` 旋转修饰类 |
| 主题 token `--p-*` | **1403 处**（`var()` 实际引用 **1323**）/ **114 唯一** / **134 文件** | Top 前缀（按**唯一 token 名数**）：`surface` 18、`primary` 17、`orange` 7、`red` 7、`blue` 6、`green` 6 |
| PrimeVue 组件 class `p-*` | **211 处 / 50 文件** | 口径 `(?<![\w-])p-[a-z][a-z0-9-]*`（比 2026-09-18 的 190/47 更宽，含 `p-button-label` 等内部类）；Top：`p-error`、`p-datatable-sm`、`p-dialog-content`、`p-invalid` |
| 含 PrimeVue 选择器（`.p-*`） | **122 处**；**SCSS/CSS 6 文件** + **`.vue` 26 文件** | 2026-09-18 记录的「20 文件」承自库侧资产文档、口径不可复现（审计 RG-W03），已由本行替换 |
| 选择器打穿 | `:deep(` **119**、`:global(` **47** | 打穿组件内部结构，是样式耦合的主要风险面 |
| 列模板体系 | `<Column>` **153**、`#body` **123**、`slotProps` **163** | 迁移的最大结构性改写面（`<Column>` 涉及 20 个文件） |

Top 10 组件热点：Button 356、InputText 178、Column 153、Tag 127、Select 73、Message 51、ToggleSwitch 47、InputNumber 39、Dialog 37、Divider 37。

### 3.3 命令式 API、浮层锚点与测试耦合

| 类别 | 现状（2026-09-20 重取） | 迁移影响 |
| :--- | :--- | :--- |
| `useToast` | **42 文件**（口径：出现 `useToast(` 的文件数） | 机械映射到 caomei-ui `useToast` |
| `useConfirm` | **14 文件** | 回调式 `require()` → Promise 式 `confirm()` |
| `.toggle(event)` 锚点浮层 | **7 处**（生产 `.vue` 6 处 / 5 文件，另有 1 处测试文件命中） | 依赖「以事件坐标为锚点」定位，需结构改写为声明式 trigger（库侧 M5-4 已定案为声明式写法） |
| `useDialog` / `$primevue` | 0 | 无影响 |
| vitest `vi.mock('primevue/*')` | **19 文件**（18 个测试文件 + `tests/testSetup.ts`） | 需同步改写 |
| E2E `p-*` class 断言 | **23 处 / 3 文件** | 需同步改写 |

### 3.4 口径与可复现性

**取数入口（第六十七阶段 M1 新增，取代此前的一次性人工统计）**：

```bash
pnpm governance:count:primevue-usage
# 等价：node scripts/governance/count-primevue-usage.mjs --output=artifacts/governance/primevue-usage-latest.json
```

输出 `artifacts/governance/primevue-usage-latest.json`（机器可读）与同名 `.md`（人读摘要）。组件名清单来自仓库内提交的 `scripts/governance/data/primevue-components.json`（由 `@primevue/metadata@4.5.5` 生成，升级 primevue 主版本时需重新生成），避免运行期依赖传递依赖解析。

- 组件用量按「`.vue` 内开标签计数」：`(?<![\w$])<Name(?=[\s/>]|$)`，前置守卫排除 TS 泛型（如 `ref<Tag[]>`）与更长名字的前缀误命中。
- 图标按 `pi pi-[a-z0-9-]+` 命中计数（含 `pi pi-spin`，故唯一数比库侧口径多 1）。
- token 按 `--p-[a-z0-9-]+` 命中计数，`var()` 引用另行统计。
- 「含 PrimeVue 选择器」按 `.p-[a-z][a-z0-9-]*` 在 SCSS / CSS 与 `.vue` 内分别统计；**此前「20 文件」为库侧口径、不可复现，已废弃**。
- 计数会随源码演进失效；**迁移开工前与每批收尾都必须在目标 commit 上重新取数**（`pnpm governance:count:primevue-usage`），不得直接沿用本文档数字作为验收基准。

### 3.5 目标依赖（2026-09-25 核实）

| 项 | 目标值 | 说明 |
| :--- | :--- | :--- |
| 包名与版本 | 当前锁定 `caomei-ui@0.3.0`（目标基线） | npm `dist-tags.latest = 0.3.0`（registry 发布时间 2026-09-24T10:47:52Z）；`0.2.0` registry 发布时间 2026-09-22T12:21:29Z；许可证 MIT；`0.3.0` 升级已于 2026-09-26 完成（第六十八阶段条目 1） |
| 导出面 | `.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json` | **`./styles.css` 已在 0.2.0 移除**；`./theme.css` → `dist/styles/index.css`（基础层）。接入面所需入口齐备 |
| peer 依赖 | `vue@^3.5.0`、`@nuxt/kit@^4.0.0` | momei 侧均已满足 |
| 运行时依赖 | `reka-ui@2.10.4`、`@lucide/vue@^1.45.0`、`@tanstack/vue-table@9.2.4`、`@internationalized/date@3.12.4` | 由 caomei-ui 自带；**momei 若在自身模板中直接使用 `@lucide/vue` 图标，须在 momei 侧显式声明该依赖**（pnpm 严格 node_modules 不允许直接引用传递依赖） |
| 版本策略 | 迁移期间**锁定精确版本**（当前 `0.3.0`，不加 `^`） | 库侧「版本与兼容策略」明示 0.x **不承诺**语义化兼容，`minor` 可含破坏性变更（`styles.css → theme.css` 即为例证）；每次升级须重跑该批回归，不得静默升级 |
| 消费前提 | 产物保留逐模块 CSS import，**裸 Node ESM 不能直接 `import` 包根**（`ERR_UNKNOWN_FILE_EXTENSION: .css`） | momei 走 Nuxt / Vite 打包器，满足前提；momei 侧任何 Node 脚本不得直接 import `caomei-ui` 包根 |
| 本地联调 | `"caomei-ui": "file:../caomei-ui"` | 仅在需要使用未发布改动时启用；切换后需重跑 `pnpm install`（`file:` 为硬链接，重建后须重装）；**该形态不得进入提交** |

### 3.6 上游 0.2.0 变更基线与影响（2026-09-22）

`caomei-ui@0.2.0` 覆盖库侧 Phase 11（组件样式按需化与能力增强）的代码改动，含一处**破坏性包形态变更**。库侧明细以 caomei-ui 的 [CHANGELOG](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/CHANGELOG.md) 与[发布指南 §9 包形态与兼容性](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/guide/release.md)为唯一事实源；下表只列**对本方案有影响**的项，momei 侧结论与动作以本方案为准。

| 0.2.0 变更 | 事实（momei 侧实测 / 库侧披露） | 对本方案的影响 |
| :--- | :--- | :--- |
| **样式入口破坏性变更** | 移除 `./styles.css`，改为 `./theme.css`（基础层：tokens + 暗色 + `.caomei-root` + 品牌预设；实测 5,880 B / gzip 1,089 B）；组件样式改逐模块产出（`unbundle + css.inject`，约 73 个组件 CSS；`dist/` 下共 75 个 CSS，含基础层与图标样式），由打包器 tree-shaking 按需丢弃 | §5.1 接入面、§5.7 层叠决策、§8.4.1 包体口径需按新形态改写；**并存期 `keyCss` 膨胀前提消失**——原 +15.3KB gzip 来自单体 167,585 B 样式，现仅基础层约 1KB gzip，组件样式随消费方 chunk 归属（`keyCss` 口径已复测澄清，见 §8.4.1） |
| **Nuxt 模块语义调整** | `injectStyles` 由注入 `styles.css` 改为注入 `theme.css`（基础层）；模块选项面（`prefix` / `darkMode` / `injectStyles` / `theme`）不变 | momei 的 `caomeiUI: { injectStyles: true }` 无需改配置即可继续工作，但注入物变为基础层；**注入点须唯一**（模块 / resolver / 显式 import 不可重复注入），见 §5.7 约束 3 |
| **组件能力增强（库侧 M3）** | `CaomeiSelectGroup`（Select 分组选项）；Tag `selectable` + `selected`；Badge `offset`；DropdownMenu `model` 支持嵌套子菜单（≤3 层）+ 逐条目 class；ButtonGroup / SplitButton `role="group"` + `groupLabel`；AutoComplete `strict` | §6.1 能力面与 §6.3 差异清单同步：原「库侧未实现、momei 零用量」的 `Menu` 子菜单已交付；AutoComplete `strict` 为差异 #1（Select `filter` → AutoComplete）提供了保持原「自由文本不写入模型」语义的手段 |
| **样式治理（库侧 M2）** | 尺寸档位选择器归一为 `:where()`（特异性降为 0，默认值由基类 `var(…, fallback)` 消费）；触发器收敛为库内包装组件并启用 `unstyled`；同规则重复声明清理 + 机检守卫 | `:where()` 降低了库侧尺寸档位特异性，momei 侧选择器覆盖更易生效；但定制仍优先走 `--caomei-*` token（见 §5.7 约束 1） |
| **质量装置（库侧 M3-5 / M4）** | 计算样式取证装置（`capture:styles` + 冻结基线）与组件级 a11y 审计（axe-core，含例外清单）入库并接入库侧周期回归 | 与 momei §8.2 三层回归的「计算样式 / 截图」层同源，方法可借鉴；**不替代** momei 侧自建三层回归的强制要求 |
| **组件清单** | 自动导入组件由 78 → **79**（新增 `CaomeiSelectGroup`）；包根导出 88 项 | §5.1 的「组件清单 77 项」口径更新为 79 |
| **0.x 兼容策略** | 库侧新增「版本与兼容策略」页：0.x **不承诺**语义化兼容；破坏性变更在 CHANGELOG 与发布指南披露；建议下游**精确锁定**并升级后复跑 typecheck / build | §5.6 的精确锁定策略由库侧策略背书；每次升级必须重跑该批回归 |

**momei 侧由此产生的动作**（登记到第六十七阶段接入基座主线）：把已落地的 `caomei-ui@0.1.0` 基座**重锚到 0.2.0**——升级依赖、确认 `injectStyles` 注入物为 `theme.css`、复测 `pnpm test:perf:budget` 的 `keyCss` 并按 §8.4.1 回落并存期配额。**该动作须在 B0b 视觉基线采集之前完成**，以免基线建立在 0.1.0 形态上。**已于 2026-09-24 完成**（第六十七阶段 M1b，验证见 [回归记录](../../reports/regression/current.md) M1b 节）。

### 3.7 上游 0.3.0 变更基线与影响

`caomei-ui@0.3.0` 已于 2026-09-24 发布（npm `dist-tags.latest = 0.3.0`），**无 `BREAKING CHANGES`**。库侧明细以 caomei-ui 的 [CHANGELOG](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/CHANGELOG.md) 与[发布指南 §9 包形态与兼容性](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/guide/release.md)为唯一事实源；下表只列**对本方案有影响**的项，momei 侧结论与动作以本方案为准。

| 0.3.0 变更 | 事实（上游披露 / momei 侧实测） | 对本方案的影响 |
| :--- | :--- | :--- |
| **包形态** | 无破坏性变更；exports 面（`.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json`）与 deps / peerDeps 与 `0.2.0` 完全一致 | 不需重定样式入口、不需重定 `injectStyles` 唯一性口径（§5.7 约束 3 继续有效）；升级风险显著低于 `0.1.0 → 0.2.0` 的重锚 |
| **DataTable 能力增强** | 可折叠分组、多列排序与降序优先、行展开、行分组 | **0.3.0 已交付、momei 零用量**（`expandableRows` / `rowGroup` / `multiSort` / `collapsedRowGroups` 全库检索零命中）；§6 的映射与差异清单同步为该口径，不产生迁移收益、不构成阻塞 |
| **TagsInput 新组件** | 上游组件页标注「稳定」 | momei 零用量（全库检索零命中）；§5.1 的组件清单已按 `0.3.0` 重数为 **80 项**（`79 + TagsInput`，2026-09-26，第六十八阶段条目 1） |

其余 `0.3.0` 变更（docs 类 5 项与文档站导航栏 768–959px 横向溢出修复）经核对属库侧文档面，对 momei 接入面无影响、无动作。

**momei 侧由此产生的动作**：`0.3.0` 升级（含组件清单按 `0.3.0` 重数、`keyCss` 口径复测，见 §8.4.1）**已于 2026-09-26 完成**（第六十八阶段条目 1）——升级前已读 `0.3.0` `CHANGELOG` 确认无 `BREAKING CHANGES`；`package.json` / `pnpm-lock.yaml` 精确锁定 `0.3.0`；视觉回归 10/10、定向单测 25/25 与试点页 E2E 7/7 通过；`keyCss` 实测 60,896 字节（口径澄清见 §8.4.1）；组件消费清单按 `0.3.0` 重数仍为 B2 试点 5 族 8 处。验证见 [回归记录](../../reports/regression/current.md) 第六十八阶段条目 1 节。

## 4. 目标与非目标

**目标**

1. 将 momei 全部 UI 组件从 PrimeVue 迁移到 caomei-ui，卸载 `primevue` / `@primevue/*` / `@primeuix/*` / `primeicons`，消除 PrimeUI 商业许可风险。
2. 图标体系从 `primeicons` 字符串类名迁移到 `@lucide/vue` 组件（品牌图标另定落点）。
3. 主题与样式从 `--p-*` token 体系迁移到 `--caomei-*` 语义 token，并以视觉基线证明观感等价。
4. 迁移完成后恢复组件库的许可证稳定与可审计性（源码可用、可本地打补丁）。

**非目标**

1. 不做与迁移无关的 UI 改版、交互重设计或设计语言调整。
2. 不引入 Tailwind 或新的 utility 框架。
3. 不迁移 `@primevue/forms`（零使用，直接移除）。
4. 评估阶段已结束，不再作为非目标；执行阶段按 §7 批次推进——第六十七阶段只做接入基座、视觉验证回归、全局 token 语义层与试点页，**不批量迁移页面**；全量视觉回归与包体对比属 B4 收尾。
5. 不处理其他下游仓库（caomei-auth / rss-impact-next 等）的迁移面，按 caomei-ui 既定顺序在 momei 闭环后评估。

## 5. 目标架构与接入方案

### 5.1 接入面

| 能力 | caomei-ui 落点 | momei 迁移动作 |
| :--- | :--- | :--- |
| 组件与 composables 自动导入 | `caomei-ui/nuxt` 模块（组件清单 **80** 项，0.3.0 口径 = 0.2.0 的 79 项 + `TagsInput`，2026-09-26 重数） | 以模块替换 `@primevue/nuxt-module` |
| 自动导入 resolver | `caomei-ui/resolver` | 如需精细化控制时接入；其 `sideEffects` 注入基础层，与模块注入同源去重 |
| 样式注入 | **基础层 `caomei-ui/theme.css`**（0.2.0 起取代 `caomei-ui/styles.css`）+ 组件样式随模块自带（打包器 tree-shaking 按需） | 接入基础层与主题，承接原 PrimeVue preset / theme 的职责；移除 `primeicons/primeicons.css`（图标改组件，无字体 CSS）。**基础层注入点须唯一**（模块 `injectStyles` / resolver / 显式 import 三选一，重复注入会引发覆盖丢失，见 §5.7） |
| 主题预设 | `caomei` / `momei` 预设（含暗色与 `auto`）；`theme.css` 支持 `.dark` / `[data-theme=dark]` / `prefers-color-scheme` | 以 `momei` 预设承接现有 `MomeiPreset` 的语义；`.dark` 选择器契约保持 |
| i18n 注入 | `CaomeiConfigProvider` + `provideLocale` / `useLocale`（内建 zh-CN / en-US / zh-TW / ja-JP / ko-KR） | 以 Provider 替换 `plugins/primevue-i18n.ts` 与模块 locale 配置 |
| 消费冒烟 | 库侧 `pnpm test:nuxt-smoke` | momei 侧以既有构建与测试入口等价验证 |

### 5.2 主题与 token 迁移

- 采用**语义映射**而非色阶等比平移：PrimeVue 色阶（`--p-surface-*` / `--p-primary-*` / 状态色阶）在 momei 中承担的是语义角色（页面底 / 抬升底 / 边框 / 次级文本 / 主色 / 状态色），归入 `--caomei-color-*` 语义 token。
- 派生档位（浅底、深档、半透明）统一用 `color-mix(in srgb, var(--caomei-color-*) X%, transparent)` 派生，不在 momei 侧硬编码新色值。
- 组件内部 token（`--p-select-*` / `--p-tabs-*` / `--p-panel-*` 等）不迁移，随迁移删除；确需覆盖时走 caomei-ui 组件级 CSS 变量钩子。
- 无对应语义者（紫色、等宽字体、`info`）保留为 momei 局部自定义变量，在样式层集中声明。
- `--p-surface-400` ~ `--p-surface-600`、`--p-surface-700` ~ `--p-surface-950` 在明暗两套主题下角色不同，**必须按消费点逐点确认语义**，不得按映射表直译。
- 0.2.0 的 `theme.css` 即本方案所指的**基础层**（tokens + 暗色 + `.caomei-root` + `caomei` / `momei` 品牌预设）；组件样式随模块自带、不并入基础层，因此「语义层桥接」的载体仍是基础层，与组件样式按需化正交。
- 库侧尺寸档位选择器已归一为 `:where()`（特异性 0），momei 侧选择器覆盖较此前更易生效；但定制仍优先走 `--caomei-*` token（见 §5.7 约束 1）。
- 全量 114 项对照表见 caomei-ui 资产文档 §2（唯一事实源）。
- 迁移执行时同步更新 [UI 设计](../ui.md) 的组件库与主题章节。

**分层与排序约束（重要）**：token 迁移必须拆成三层处理，不得整体重命名：

| 层 | 载体 | 归属批次 | 约束 |
| :--- | :--- | :--- | :--- |
| **① 语义层** | `styles/_variables.scss`、`styles/main.scss`、`layouts/**`、`nuxt.config.ts` 的 `MomeiPreset` | 第六十七阶段（早做） | 以**并存桥接**方式引入 `--caomei-*` 语义 token 与 caomei `momei` 预设，同时保留 `--p-*` 供给未迁移的 PrimeVue 组件；不得直接重命名导致未迁移页面失去主题 |
| **② 组件 / 页面消费点** | 87 个 components、27 个 pages 内的 `.vue` 样式、`:deep()` / `:global()` 打穿、`p-*` class | 随 B2 / B3 / B4 各批逐页迁移 | 消费点 `--p-*` 与 `p-*` 只在其所属路由整页迁移时删除，不做跨批提前清理 |
| **③ PrimeVue 预设** | `@primeuix/themes` Aura 定制 | 保留至 B4 | B4 卸载 PrimeVue 时一并移除；并存期继续为未迁移组件提供样式 |

排序理由：`--p-*` 同时被 PrimeVue 组件内部与 momei 自研样式消费。若在组件迁移前整体改名，未迁移页面会同时失去 PrimeVue 主题与自研样式来源，属不可接受的观感回退。因此「全局 token 早做」的正确含义是**语义层与预设桥接早做**，而非**消费点提前清空**。

**第 ① 层已落地（2026-09-25，第六十七阶段第 3 项）**：桥接实现与逐项依据以 `styles/main.scss` 末尾的「caomei-ui 语义 token 并存桥接」段及其注释为准；下表为口径记录（取值方向 `--p-* → --caomei-*`，因此用户切换主题预设 / 主色 / 圆角时 caomei-ui 侧同步生效，momei 侧不硬编码新色值）。

| `--caomei-*` | 取值来源 | 说明 |
| :--- | :--- | :--- |
| `-color-primary` | `var(--p-primary-color)` | 主色基准 |
| `-color-primary-foreground` | `var(--p-primary-contrast-color)` | 配套前景色（随明暗切换） |
| `-color-primary-solid` | `var(--p-primary-700)` | 实底深档；恒配 `-on-solid`(#fff)，故须取深档 |
| `-color-danger` / `-color-success` / `-color-warning` | `var(--p-red-500)` / `var(--p-green-500)` / `var(--p-orange-500)` | 见下「幻影 token」注 |
| `-color-danger-solid` / `-color-success-solid` / `-color-warning-solid` | `var(--p-red-700)` / `var(--p-green-700)` / `var(--p-orange-700)` | 深档，与 caomei `momei` 预设取值一致 |
| `-color-bg` | `var(--p-surface-card)` | caomei `bg` 在组件中承载**内容面**（卡片 / 输入 / 表格 / 浮层 / 工具栏），非页面底 |
| `-color-bg-elevated` | `color-mix(in srgb, var(--p-surface-card) 96%, var(--p-text-color))` | 次级面（表头 / 斑马纹 / 悬停 / 骨架）；派生档位用 `color-mix()` |
| `-color-text` / `-color-text-muted` | `var(--p-text-color)` / `var(--p-text-muted-color)` | |
| `-color-border` | `var(--p-content-border-color)` | momei 既有 `--p-surface-border` 在 Aura 中不存在（见下注） |
| `-color-mask` | `var(--p-mask-background)` | 遮罩 |
| `-radius-md` | `var(--p-content-border-radius)` | `sm` / `lg` 用 `calc()` 按半 / 双派生 |
| `-font-sans` | `$font-sans`（`styles/_variables.scss`） | 沿用 momei 字体栈 |

落点与层叠约束（与 §5.7 一致）：

- 桥接段必须 **unlayered**：caomei-ui 基础层未分层（§5.7 事实）且在 `nuxt.options.css` 中排在 `@/styles/main.scss` **之后**，按层叠规则「未分层优先于任何具名层」，写在 `@layer momei-base` 内的桥接会被 caomei-ui 的 `:root` 覆盖并**静默失效**（像素与构建均不报错）。因此选择器取 `html:root`（特异性 `0,1,1`）高于库侧 `:root` / `:is(.dark, [data-theme="dark"])`（均 `0,1,0`），使桥接与加载顺序解耦；这是「不单方面改造库侧构建形态」（§5.7 依据 2）下的最小方案。
- **不启用** `data-preset="momei"`：其暗色选择器 `:is([data-preset="momei"].dark, …)` 特异性为 `0,2,0`，会压过桥接并把暗色 token 冻结为静态预设值，使运行时主题失效；桥接已覆盖 momei 主题驱动的全部**映射项**，故预设保持「可用但不启用」。**已知偏离（留待 B2 试点页按实际用法复核）**：① caomei `momei` 预设的暗色状态色微调（`danger` / `success` / `warning` 暗色为 `#f87171` / `#4ade80` / `#fb923c`）未被桥接采用——桥接状态色恒取模式无关、且被 `components/**` 直接消费的原始色板（`--p-red-500` 等），形态与 `$color-*`「模式无关单一声明」一致（注意 `$color-*` 引用的 `--p-{error,success,warning}-500` 为幻影 token，见下注）；② 主色 `-solid` 取 `--p-primary-700` 深档，与预设「实底跨主题同值」的约定不同（状态色 `-solid` 取固定 `-700`，两主题同值，与预设一致）。
- 未映射项保留 caomei-ui 默认，不做逐点搬运：组件内部 token 与 `space` / `control-height` / `font-size` / `z-index` / `shadow` / `skeleton-highlight` / 等宽字体 / `info` / `neutral-solid`（后两类属 §5.2 第 4 条「无对应语义者」）。这些档位随各批「文件 → 改动点」清单按消费点确认后再处理。
- 级联契约由 `tests/visual/caomei-token-bridge.visual.test.ts` 守卫（在真实浏览器读取计算后的 `--caomei-*`，断言其等于对应 `--p-*` 且不等于 caomei-ui 基础层默认值）；`layouts/**` 与 `styles/_variables.scss` 的消费点不在本层改动范围内（前者无对应语义，后者属 §5.2 第 ② 层）。

**幻影 token 注（2026-09-25 实测）**：momei 侧既有 `--p-error-500` / `--p-success-500` / `--p-warning-500` / `--p-surface-border` / `--p-text-color-secondary` 等 token 在 Aura / MomeiPreset 的产物中**并不存在**——Aura 语义层只有 `primary|surface|highlight|mask|formField|text|content|overlay|list|navigation`，不含 `success|warning|error|info`；上述名字仅以 `var()` 被消费、从未被定义（即未迁移页面上这些声明本就按 `unset` 生效）。故桥接**不按幻影 token 直译**，状态色改引由库 `primitive-variables` 样式表真实产出的原始色板（`--p-red-500` / `--p-green-500` / `--p-orange-500` 等），边框改引真实语义 `--p-content-border-color`。该缺口是否顺带修正由各批「文件 → 改动点」清单决定，本层不做消费点清理。

### 5.3 图标体系迁移

- `icon="pi pi-x"` 字符串 → `@lucide/vue` 组件，放入 `#icon` 插槽或直接作为组件使用。
- 唯一图标逐项落点、语义改名项与填充变体处理见 caomei-ui 资产文档 §3（库侧口径为 128 项；本仓库含 `pi pi-spin` 时为 129，差异原因见 §3.2）。
- **11 项品牌图标**（github / google / twitter / linkedin / facebook / instagram / youtube / discord / twitch / tiktok / paypal）lucide 无对应，需在 B4 择一：`@iconify/vue` + Simple Icons、保留 `@mdi/font`、或自建 SVG 组件。
- `pi-spin` 旋转修饰类不是图标；旋转动效改由加载指示组件（`ProgressSpinner` 或 Button / AutoComplete 加载态）承载。

### 5.4 i18n 迁移

- 删除 `plugins/primevue-i18n.ts` 与 `nuxt.config.ts` 的 `primevue.options.locale`。
- 以 `CaomeiConfigProvider` + `useLocale` 接入内建文案；组件文案语言需与 i18n 保持一致时显式传入 locale。
- 迁移后需复核组件内建文案（表格空态、分页、日期面板等）在 5 个语言下的覆盖，避免出现英文回退。
- 相关测试 `tests/plugins/primevue-i18n.test.ts` 需同步删除或改写为 caomei-ui locale 验证。

### 5.5 双库并存隔离

- **隔离单位＝路由**：以路由前缀为最小切换单位，同一路由（含子路由）内组件来源必须唯一，禁止同路由内按组件混用。
- **白名单载体**：由 momei 侧维护（建议落在 `nuxt.config.ts` 运行时配置或独立迁移配置模块）；库侧不感知「并存期」状态、不提供运行时开关。
- **切换粒度**：某路由涉及的组件全部迁移完成并通过该批回归后，才从白名单移除；不做半路由切换。
- **阻断项**：任一路由同时出现两套组件，须在对应批次的「文件 → 改动点」清单中体现切换时点。

**批次在册范围与共享壳例外（2026-09-25 裁定，B2 试点落地）**：落地时确认「同一路由内组件来源必须唯一」无法按字面执行——`app.vue` 全局渲染 PrimeVue `Toast` / `ConfirmDialog`（任何路由都含），浮层类（Dialog / Drawer / Popover / DropdownMenu）显式延后到第六十九阶段，且 B2 候选页的 render tree 普遍引用跨路由共享组件（`ConfirmDeleteDialog`、`AdminContentLanguageSwitcher`、`AppAvatar` 等）。故「无混用」按**批次在册组件族**判定：

- **在册（B2）**：DataTable / Column（列插槽·选择·排序·lazy·分页）、Paginator、Tag、Button、InputText、Select、Badge、ToggleSwitch、IconField / InputIcon、Skeleton、Avatar。
- **显式豁免**：全局壳 `Toast` / `ConfirmDialog`；延后批次的浮层（含 `ConfirmDeleteDialog`）；`v-tooltip` 指令（随浮层批次处理）。
- **跨路由共享组件**：不直接改写（否则未迁移路由会立刻出现「共享壳 caomei + 页面 PrimeVue」混用），改为**过渡组件 + 路由选择**——新增 `components/admin/content-language-switcher-v2.vue`，由 `AdminPageHeader` 经 `lib/ui-library.ts` 的路由 → 组件来源单一事实源选择实现，待全站迁完后再回收统一。
- **守卫**：`tests/modules/ui-library-route-migration-guard.test.ts` 遍历已登记前缀，断言其页面文件不残留在册族 PrimeVue 组件、且至少使用一个 caomei-ui 组件；`CAOMEI_UI_ROUTE_PREFIXES` 由此获得首个消费者（此前为纯登记）。

**共享壳过渡组件替换清单（2026-09-25 扫描 B2 全部目标 + 共享组件依赖后产出）**：

| 类别 | 组件 | PrimeVue 依赖 | 消费者 | 处置 |
| :--- | :--- | :--- | :--- | :--- |
| 无需处理 | `AdminPageHeader` / `AdminListShell` / `AdminTableEmptyState` / `useDeleteDialogState` | 无 | 多路由 | 已是 PrimeVue-free（`AdminPageHeader` 已完成路由择库） |
| 已完成 | `AdminContentLanguageSwitcher` → `…-v2.vue` | `Select` | 共享头部 | M4 已落地（路由择库） |
| **待新增过渡组件** | `AppAvatar` → `AppAvatarV2` | `Avatar` | B2：users / subscribers；非 B2：`pages/posts/[id]`、`comment-item`、`settings-profile` | 过渡组件 + 组件内按路由择库（避免公开页头像被动改变） |
| **待新增过渡组件** | `AppUploader` → `AppUploaderV2` | `InputGroup` / `InputText` / `Button` | B2：friend-links；非 B2：`friend-links`（公开页）、`general-settings`、`post-editor-media-settings`、`commercial-link-dialog` | 同上 |
| 显式豁免 | `ConfirmDeleteDialog` | `Dialog` / `Button` | 8 个 admin 列表页 | 浮层类，随第六十九阶段 |
| 显式豁免 | 页面内 `Dialog` / `Drawer` / `ConfirmDialog` / `Popover` / `useConfirm` / `v-tooltip` | 多种 | 各页 | 浮层/指令类，随第六十九阶段 |
| 路由自有 | `components/admin/users/*`（filters / role-dialog / ban-dialog / sessions-drawer） | `Toolbar` / `IconField` / `InputText` / `Select` / `Dialog` / `Drawer` / `Badge` / `ProgressSpinner` / `Button` | 仅 `/admin/users` | 随该页整路由迁移（无需过渡） |
| 跨路由共享（延后） | `components/admin/posts/{post-audit-badge,post-audit-dialog,publish-push-dialog}.vue` | `Tag` / `Image` / `Dialog` / `ProgressBar` / `RadioButton` / `DatePicker` / `Button` | B2：posts 列表；非 B2：`/admin/posts/[id]` | 与 `/admin/posts/[id]` 同期迁移，或列表批次内做过渡（否则编辑器路由被动混用） |
| 跨路由共享（延后） | `components/admin/settings/{agreements-settings,notification-delivery-log-list,setting-audit-log-list,admin-notification-settings}.vue`、`components/settings/{notification-history-list,settings-api-keys}.vue`、`setting-form-field`、`admin-floating-actions` | `DataTable` / `Tag` / `Button` 等 | host 路由 `/admin/settings`（B3） | **随 B3 迁移**（否则 B3 页面被动混用、且 `/admin/settings` 已有截图基线） |
| 组件型目标 | `admin-taxonomy-page.vue`、`ai/task-list.vue`、`marketing-campaign-list.vue` | `DataTable` / `Tabs` / `Dialog` 等 | host：`/admin/categories` + `/admin/tags`、`/admin/ai`、`/admin/marketing` | 随各自 host 路由整路由迁移 |

> 结论：本清单为**工程事实记录**，作为后续批次（第六十八阶段：B2 剩余数据页 + B3）准入评估的输入；批次划分与原子条目在该阶段准入时按规划规范单独评估，本阶段不提前落盘。

### 5.6 消费路径与版本锁定

- **默认消费路径**：npm 常规依赖 `caomei-ui@0.2.0`，CI（`pnpm i --frozen-lockfile`）、Docker、Vercel 均可按标准依赖解析，不需要额外 checkout 兄弟仓库。
- **本地联调降级路径**：仅在需要验证库侧未发布改动时，临时改为 `file:../caomei-ui`；该形态**不得进入提交**（否则 CI / Docker / Vercel 会因解析不到 `../caomei-ui` 而失败）。
- **锁定策略**：迁移在飞期使用精确版本（当前 `0.2.0`、目标 `0.3.0`，不加 `^`），避免库侧 minor 发布引入非预期行为漂移；迁移收尾后可评估恢复 `^`。
- **升级纪律（0.2.0 / 0.3.0 对照背书）**：库侧「版本与兼容策略」明示 0.x **不承诺**语义化兼容——`0.1.0 → 0.2.0` 的 `styles.css → theme.css` 破坏性形态变更即为例证；`0.3.0` 无 `BREAKING CHANGES`，作为反面印证进一步说明「不得静默升级、升级前先读目标版本 `BREAKING CHANGES`」的必要性（无破坏性变更的版本同样须读过再升）。因此每次升级 caomei-ui 版本都须重跑该批次视觉回归与定向测试，并在提交信息与回归记录中留痕，不得静默升级；升级前先读目标版本的 `BREAKING CHANGES`。

### 5.7 样式层叠与 `@layer` 决策（第六十七阶段落地）

**事实（2026-09-22，按 0.2.0 复核）**：

- 基础层 `caomei-ui/theme.css`（落点 `dist/styles/index.css`）内**没有任何 `@layer`**（实测 `grep -c @layer` = 0），也不含 `html` / `body` / `button` / `*` 等全局元素规则；其规则全部落在 `:root` token、`[data-preset="…"]` 与 `.caomei-*` 组件类上。
- 0.2.0 起**组件样式不再并入单体文件**，改为逐模块产出（约 73 个组件 CSS）并由 `css.inject` 在 JS 产物中保留 import；组件样式同样未分层。
- PrimeVue 侧则继续由其 `cssLayer` 注入到具名层 `primevue`。

**决策**：**保留 `@layer primevue, momei-base, momei-overrides` 顺序不变，caomei-ui 样式（基础层与逐模块组件样式）以「未分层（unlayered）」形态加载。**

- 依据 1：CSS 层叠规则中未分层样式优先于任何具名层。因此 caomei-ui 规则在所有 `momei-*` 层之上。
- 依据 2：不采用「把 caomei-ui 塞进具名层」的写法。0.2.0 后组件样式经 JS import 注入，包进具名层需改造库侧构建形态，属库侧变更，本方案不单方面改造。
- 依据 3：类名空间不重叠（`.caomei-*` vs `.p-*` vs momei 自有类），未分层并不会造成实际互相覆盖。

**由此产生的约束（迁移期与收尾均适用）**：

1. momei 对 caomei-ui 组件的定制**走 `--caomei-*` token**（库的文档化定制路径），不通过 `momei-overrides` 层做选择器覆盖——后者对未分层样式无效。
2. 若确需选择器级覆盖，必须写在与 caomei-ui 样式**同级或更高特异性**、且加载顺序在后的位置，不得依赖 `@layer` 取胜。
3. **基础层注入点须唯一**：`caomei-ui/nuxt` 的 `injectStyles`、`caomei-ui/resolver` 的 `sideEffects`、手写 `import 'caomei-ui/theme.css'` 三者只能选一；重复注入会使基础层与 `theme` 覆盖的层叠顺序不确定。升级到 0.2.0 时须核对 `nuxt.options.css` 中 `theme.css` 仅出现一次。
4. B4 卸载 PrimeVue 后，若 caomei-ui 仍未分层，须重新评估是否需要在**库侧**引入分层（属库侧变更，走 caomei-ui 流程），本方案不单方面改造。

## 6. 组件映射方案

### 6.1 处置分组（59 个 PrimeVue 组件）

**A. 机械改写即可就绪（44 类）**——库侧已有对应组件，迁移动作以「标签替换 + 属性改名 + 图标插槽化」为主，属性级差异见 §6.2 与 caomei-ui 设计规范 §7：

InputText 178、Button 356、Column 153、Tag 127、Select 73、Message 51、ToggleSwitch 47、InputNumber 39、Divider 37、Card 33、Password 32、Textarea 31、Skeleton 26、Tab 23、TabPanel 23、DataTable 22、Checkbox 20、RadioButton 12、SelectButton 9、Toast 9、ProgressBar 8、MultiSelect 8、Tabs 6、TabList 6、AccordionPanel 6、InputGroup 6、DatePicker 6、Step 6、StepPanel 6、Badge 5、Slider 3、Paginator 3、Drawer 3、Avatar 3、Accordion 3、SplitButton 2、ColorPicker 2、AutoComplete 2、ButtonGroup 1、DataView 1、ToggleButton 1、Stepper 1、StepList 1、StepPanels 1。

其中以下为**已交付的库侧能力**（M3 / M4 / M6，以及 11 项新组件，可直接按现行 API 迁移）：

- DataTable 列插槽 `#cell-{key}` / `#header-{key}` + `rowsPerPageOptions` / `update:rows`（M3 / M4-8）。
- MultiSelect `#option` / `showClear`；Button `badge` / `badgeTone`；Checkbox 数组模型 + `CaomeiCheckboxGroup`；Switch `change`；ToggleButton `onLabel` / `offLabel`；Paginator `rowsPerPageOptions`。
- InputNumber `useGrouping` / 小数位；Message `variant`；Tag `variant` / `rounded`；Textarea `autoResize`；Password `feedback`；Select / MultiSelect 对象选项映射与数值 value。
- DataTable `frozen` / `selectionMode` / `lazy` / 排序；DatePicker `showTime` / `hourFormat` / `showSeconds` / `dateFormat` / `showIcon`；Drawer / DataView / SplitButton / ColorPicker / AutoComplete / Divider / Stepper / InputGroup。

**0.2.0 新增能力（库侧 Phase 11 M3，2026-09-22）**——以下项此前列为「库侧未实现」或需替代方案，现已有原生能力，迁移时应按现行 API 使用：

- `CaomeiSelectGroup` / `SelectOptionGroup`：Select 分组选项（momei 当前无分组选项用法，属可选项）。
- Tag `selectable` + `selected`（v-model）：可选中的标签（momei 当前无 Tag 点击 / 选中用法，属可选项）。
- Badge `offset`：浮标位置微调。
- DropdownMenu `model` 嵌套子菜单（≤3 层）+ 逐条目 class：**§6.1 D 组原「`Menu` 的 `items` 子菜单」缺口已闭合**。
- ButtonGroup / SplitButton `role="group"` + `groupLabel`：分组可访问名。
- AutoComplete `strict`：严格模式下自由文本不写入模型（对应 PrimeVue 的 `forceSelection` 语义），用于差异 #1 的 Select `filter` → AutoComplete 映射保持原行为（见 §6.3）。

**0.3.0 新增能力（库侧 DataTable 增强）**——以下项为库侧原生能力，但 momei **零用量**（全库检索零命中），不产生迁移收益、不构成阻塞：

- DataTable 可折叠分组 / 多列排序（含降序优先）/ 行展开 / 行分组：**0.3.0 已交付、momei 零用量**（`expandableRows` / `rowGroup` / `multiSort` / `collapsedRowGroups` 零命中），迁移仍按现行基础能力（列插槽 / 选择 / 排序 / lazy / 分页）执行。

**B. M5 浮层与展示类（B4 前置，8 类 / 10 项）——已于 2026-09-19 全部交付**：

| PrimeVue 组件 | 用量 / 文件 | 库侧 M5 交付能力（已交付） |
| :--- | :--- | :--- |
| Dialog | 37 / 32 | `showHeader`、`breakpoints`、`@hide`、`title` 可选化（M5-1 / M5-2） |
| ConfirmDialog | 6 / 6 | `useConfirm` 的 `icon`（M5-3） |
| Popover | 5 / 4 | 命令式入口收敛为声明式迁移写法 + `CaomeiPopoverTrigger` 的 `unstyled`（M5-4） |
| DropdownMenu（Menu） | 3 / 2 | `:model` 数据驱动项模型 + 声明式锚点（M5-5 / M5-6） |
| Toolbar | 1 / 1 | `#start` / `#center` / `#end` 分区插槽（M5-7） |
| Image | 11 / 10 | `preview` 点击放大与遮罩（M5-8） |
| ProgressSpinner | 14 / 13 | `strokeWidth` prop（M5-9） |
| FileUpload | 1 / 1 | `mode` / `maxFileSize` / `auto` / `chooseLabel` 与上传事件（M5-10） |

**C. 由其他组件承接 / 别名（7 类）**：

- Panel（3）→ `CaomeiCard` 的 `title` prop / `#title` / `#header` / `#extra` / `#footer`；可折叠场景改 `CaomeiAccordion`。
- IconField / InputIcon（10 / 10）→ `CaomeiInput` 的 `#prefix` / `#suffix` 插槽。
- TabPanels（6）→ 普通容器；AccordionHeader（6）/ AccordionContent（6）→ `CaomeiAccordionItem` 内建。
- Dropdown（5）→ `CaomeiSelect`（旧名）；DropdownMenu 的 `Menu` 落点见 B 组。

**D. 库侧未实现但 momei 零用量（无需处理）**：

`Drawer position="full"` 与生命周期事件、`DatePicker selection-mode`（范围选择）与手工键入、`DataView` 分页 / 排序、`SplitButton` 子菜单与 `url` / `target`、`MultiSelect #option` 的 `index` 等。原列的 `Menu` 的 `items` 子菜单已由 0.2.0 交付，移出本组；DataTable 行分组 / 行展开 / 多列排序 / 可折叠分组已由 0.3.0 交付、momei 零用量，移出本组（见 §6.1「0.3.0 新增能力」）。

**E. 库侧未实现且 momei 有少量用量（迁移时按迁移写法自行补足）**：

- Paginator `template` / `CurrentPageReport`（1 处）→ 在分页器旁按 `page` / `itemsPerPage` / `total` 自行渲染。

### 6.2 属性级映射规则

| 维度 | PrimeVue | caomei-ui | 说明 |
| :--- | :--- | :--- | :--- |
| 语义色 | `severity` | `tone` + `variant` | `primary→primary`、`success→success`、`warn→warning`、`error/danger→danger`、`secondary/contrast→neutral`、`info→primary`；`secondary` / `contrast` / `info` 为**有损近似** |
| 尺寸 | `small` / `large` | `sm` / `lg` | |
| 按钮形态 | `text` / `outlined` / `rounded` | `variant="ghost"` / `variant="secondary"`（Button）/ `variant="outline"`（Tag、Message）/ `rounded` | |
| 图标 | `icon="pi pi-x"` 字符串 | `#icon` 插槽 + `@lucide/vue` | 全量改写 |
| 受控字段 | `v-model:visible` / `v-model:value` / `v-model:first` | `v-model:open` / `v-model` / `v-model:page` | Paginator 由 0 基偏移切为 1 基页码 |
| 浮层标题 | `header` | `title`（当前必填；可选化由库侧 M5-1 承接） | |
| 校验态 | `class="p-invalid"` | `:invalid` | |
| 全宽 | `fluid` | 默认 `width: 100%` | **删除 `fluid`**；选择器家族另带 `20rem` 上限，需真正全宽时覆盖对应 `*-max-width` token |
| 可访问名 | `aria-label` / `input-id` | `label` / `id` | 本库 `label` 统一为不可见可访问名 |
| 确认弹窗 | `useConfirm().require({...})` 回调 | `confirm()` Promise | |
| 提示条 | `severity` / `summary` / `detail` / `life` | `tone` / `title` / `description` / `duration` | |

> 逐组件、逐 prop 的完整映射与已知行为差异，以 caomei-ui 设计规范 §7 为唯一事实源；本文档只保留迁移执行所需的总则。

### 6.3 有意差异

迁移**接受** 16 条有意差异（影响面最大的三条：`Select filter → AutoComplete` 2 处、`Tag severity → tone` 125 处、`Dialog title` 必填）。逐条差异、momei 侧核对动作与判定口径见 caomei-ui 交接计划 §6，本方案不重复。

> 0.2.0 的 AutoComplete `strict` 使差异 #1 的替代写法可显式保持「自由文本不写入模型」的原语义（等价 PrimeVue `forceSelection`）；核对时按此口径判定，差异本身仍成立（组件已由 Select 改为 AutoComplete）。

## 7. 分批执行计划

批次划分、执行主体与出口条件以 caomei-ui 交接计划 §2 / §4 / §5 为唯一事实源；本文档只写 momei 侧的批次内容、产出物与依赖。

| 批次 | momei 侧内容 | momei 侧产出物 | 依赖 |
| :--- | :--- | :--- | :--- |
| **接入基座**（momei 侧新增） | 引入 `caomei-ui@0.2.0`（基础层 `theme.css`，0.2.0 起取代 `styles.css`）与 `caomei-ui/nuxt` 模块、模块自动导入的 `useLocale` / `provideLocale`（`CaomeiConfigProvider` 包裹与 `primevue-i18n` 插件替换延后到启用 caomei-ui 组件的批次）、CSS `@layer` 顺序、双库并存白名单载体、开工重新取数（§3.4）。**0.1.0 基座已落地，已于 2026-09-24 重锚到 0.2.0**（§3.6） | 双库可同时加载的最小可用基座 + 白名单单点配置 + `keyCss` 复测与配额回落 | npm `caomei-ui@0.2.0` 已发布 |
| **B0b 视觉验证回归基座** | 在迁移前采集基线，并升级为可自动比对的三层回归（单元 / E2E / 截图，见 §8.2）：列表页 / 表单（设置）页 / 浮层各 1 页，含关键元素计算样式快照与环境元数据（浏览器与版本、视口、主题与明暗、locale、`@layer`） | 基线采集脚本 / 命令、比对脚本、CI 接入、阈值策略、环境、两仓 commit、快照日期齐全的可复现记录 | 接入基座；**不依赖 M5** |
| **全局 token 语义层**（momei 侧新增） | 按 §5.2 第 ① 层，以并存桥接方式引入 `--caomei-*` 语义 token 与 caomei `momei` 预设，保留 `--p-*` 供给未迁移组件 | 语义层映射说明 + `@layer` 顺序记录 + 视觉回归无差异证据 | 接入基座 + B0b（需先有比对能力才可判定无回退） |
| **B2 数据类页面** | 先做**试点页 1-2 个**（端到端验证「接入 → token → 图标 → 组件 → 测试改写 → 回归」全链路），再推 20 个 `<Column>` 文件：`pages/admin/posts`、`users`、`friend-links`、`comments`、`submissions`、`subscribers`、`waitlist`、`external-links`、`ad/campaigns`、`ad/placements`、`migrations/link-governance`、`components/admin/admin-taxonomy-page.vue`、`components/admin/ai/task-list.vue`、`components/admin/marketing-campaign-list.vue`、`components/admin/settings/{admin-notification-settings,agreements-settings,notification-delivery-log-list,setting-audit-log-list}.vue`、`components/settings/{notification-history-list,settings-api-keys}.vue` | 试点结论（链路可行性 + 耗时画像）、逐页功能回归（排序 / 分页 / 选择 / 列插槽）+「文件 → 改动点」清单 | 接入基座 + B0b + 全局 token 语义层 |
| **B3 表单与设置页面** | `components/admin/settings/*`、`components/installation/*`、auth / submit / register 等表单页；`useToast` / `useConfirm` 映射 | 表单交互回归（校验 / 提交 / 提示）+「文件 → 改动点」清单 | B2 |
| **B4 展示、浮层与收尾** | 展示类组件、浮层（Dialog / Drawer / Popover / DropdownMenu）、`.toggle(event)` 结构改写、图标全量替换、i18n 插件替换、测试与 E2E 改写、品牌图标落点选定、卸载 `primevue` / `@primevue/*` / `@primeuix/*` / `primeicons` | 全量测试与 E2E 通过 + 包体对比记录 +「文件 → 改动点」清单 + PrimeVue 相关产物归零 | B3；库侧 M5 能力**已于 2026-09-19 交付，不再阻塞** |

**开工顺序（2026-09-19 更新）**：库侧 B0a 资产（已交付）→ 库侧 B1 补齐（已交付，含 M5）→ **接入基座（momei 侧）** → **B0b 视觉验证回归基座** → **全局 token 语义层** → B2 试点页 → B2 全量 → B3 → B4。

> **momei 侧新增批次说明**：「接入基座」与「全局 token 语义层」两项在 caomei-ui 交接计划的既有批次表（B0b / B2 / B3 / B4）中没有编号，属本文档按开工实际依赖补充的 momei 侧执行面，不改变库侧既定批次编号。

**B2 试点页已落地（2026-09-25）**：试点页定为 `/admin/comments`（管理端评论列表），按路由整体切换并登记到 `CAOMEI_UI_ROUTE_PREFIXES`。链路结论、实际耗时画像、「文件 → 改动点」清单、视觉差异逐项归因与发现的阻塞/修正建议见 [回归记录 M4 节](../../reports/regression/current.md)；共享壳过渡策略与在册范围判定见 §5.5；已顺带闭合的原缺口：`@lucide/vue` 由传递依赖升为 momei 直接依赖（试点页在 momei 模板直接引用图标）。


## 8. 验收与质量门

### 8.1 质量门

每批合并前必须满足仓库既有门禁，不因迁移降低标准：

- `pnpm lint` 零 error、`pnpm lint:css`、`pnpm lint:md` 通过。
- `pnpm typecheck` 零 error。
- 受影响范围的定向单元测试通过；批次收尾跑 `pnpm test`。
- **视觉验证回归三层通过**（单元 / E2E / 截图，见 §8.2）；截图层差异必须逐项归因，不得以放宽阈值替代归因。
- `pnpm build` 无报错；B4 收尾对生产产物做等价冒烟。
- 每批改动进入 A 阶段 Review Gate（`@code-auditor`）；涉及界面 / 样式时另经 `@ui-validator` 浏览器验证。

### 8.2 视觉验证回归（三层强制项）

迁移期间必须建立**可自动比对**的视觉验证回归，取代「只采集一次性基线截图」的做法。三层各司其职，缺一层即视为该批验收不完整：

| 层 | 载体 | 迁移前 | 迁移后 | 判定 |
| :--- | :--- | :--- | :--- | :--- |
| **① 单元层** | Vitest + Vue Test Utils 组件渲染断言 / 快照 | 采集受影响组件渲染结果与关键 DOM / 类名 / ARIA 断言 | 同型断言必须继续通过 | 结构性回归（插槽、可访问名、状态类） |
| **② E2E 功能层** | 既有 Playwright 17 个 spec（`pnpm test:e2e` / `test:e2e:critical`） | 迁移前全绿 | 每批迁移后同断言全绿 | 行为回归（排序 / 分页 / 校验 / 提交 / 浮层开关） |
| **③ 截图识别层** | 新增 Playwright `toHaveScreenshot` 视觉回归工程（**独立 project / config**） | 采集并提交基线快照 | 逐批比对，差异超阈值即失败 | 像素级观感回归 |

**截图识别层的落点与纪律**：

- **独立工程**：截图层落在独立 Playwright project / config 中，**不得并入既有 `test:e2e` default project 的 `testMatch`**；必须显式声明「不改变 `pnpm test:e2e` / `pnpm test:e2e:critical` / `pnpm test:e2e:review-gate`（`run-review-gate-ui-baseline.mjs`）的既有断言语义与证据产出」。
- 采集对象：列表页 1 个（优先管理端主路径）、表单 / 设置页 1 个、浮层 1 个；覆盖浅色 / 深色两套主题与目标 viewport。
- 环境必须**可复现**：固定浏览器渠道与版本、固定 viewport / deviceScaleFactor、固定 locale 与时区、关闭动画（`animations: 'disabled'`）、隐藏光标（`caret: 'hide'`）；基线快照随仓库提交。
- 阈值策略：以明确的 `maxDiffPixelRatio` / `maxDiffPixels` 阈值判定，阈值只能通过显式评审调整，禁止为「让测试变绿」而放宽。
- 动态区域（时间戳、随机封面、用户头像等）必须用 `mask` 显式遮蔽，不得依赖像素容差兜底。
- 跨环境差异（CI 与本地渲染差异）若无法消除，则**以 CI 生成为唯一基线来源**，不采用本地快照作为判定依据。
- **成本预算与基线存储（第六十七阶段 M2 落盘）**：
    - CI 增量耗时：本机实测约 1.4–2.4 分钟（6 用例，串行 1 worker，不含构建复用）。
    - 基线快照体积：6 张合计 663,994 字节（约 664KB），单张最大 193KB（设置页）。
    - 阈值口径：仅用绝对上限 `maxDiffPixels`（当前 200）+ 单像素容差 `threshold`（当前 0.2），不设比例兜底（`maxDiffPixelRatio` 与绝对上限取较小值时会被压制，故不配置）。
    - 保留策略：基线随仓库提交，由 `pnpm test:visual:update` 原地覆盖、不做历史副本堆积（历史即 git 记录）；失败产物 actual / diff 落 `test-results/visual/` 且不入库。
    - **不引入 Git LFS（2026-09-24 决策）**：当前体量与单文件尺寸远低于 LFS 适用区间（单张 <200KB、全量 <1MB），而 LFS 会引入硬前置——`git-lfs` 未安装时 checkout 得到指针文件、比对静默失真；CI 需 `lfs: true` 并消耗带宽配额；tarball / `git archive` 不含 LFS 对象，使「基线随仓库提交」在下载场景不可复现。仓库历史体积的实际驱动是 `pnpm-lock.yaml` churn（833 个 blob / 743MB 未压缩），非图片，故 LFS 亦无法改善仓库体积。**再评估触发线**（命中任一即重新评估 LFS，或改用「CI artifact / 专用分支」方案）：① 单张快照 > 1MiB；② `tests/visual/__screenshots__` 总量 > 25MiB；③ 截图相关 `.git` 增量 > 50MiB；④ 快照数量 > 150。

**判定口径**：以迁移前基线为准逐项归因；属于 16 条有意差异的按 §6.3 核对，**不属于差异清单的视觉变化不得静默出现**。视觉差异的批准必须留下记录（差异条目编号或显式接受说明）。

采集与判定方法的上游依据由 caomei-ui 交接计划 §7 定义；momei 侧在此之上补齐上述自动化与阈值纪律。

### 8.3 回归

- 承载者：momei 既有 [Weekly Regression](../../../.github/workflows/regression-weekly.yml)（`pnpm run regression:weekly` + typecheck + build + lint:css / lint:md + 包体预算 + 覆盖率）。
- 强度：不要求每批跑全量 E2E；**每批合并后至少经过一次每周回归且无新增失败**，新增失败逐条归因处理后才进入下一批。
- 跨仓自动化（「caomei-ui 变更即验证 momei」）不在本方案范围，需另行授权。

### 8.4 包体对比

- 对比点：B0b 基线（PrimeVue 在产物内）↔ B4 收尾（PrimeVue 卸载后）。
- 记录项：构建命令与两仓 commit；产物总量与 gzip / brotli 体积；按 chunk 体积；PrimeVue 与 primeicons 相关 chunk 是否归零；快照日期。
- 判定口径：记录含命令 + commit + 日期即视为可复现；PrimeVue 与 primeicons 相关 chunk 归零；总量与主 chunk 体积变化有数值。阈值由 momei 既有包体预算（`test:perf:budget` / `.github/perf/bundle-baseline.json`）承担；除 §8.4.1 记录的并存期配额（`keyCss` 临时 85KB，**已于 2026-09-24 在 0.2.0 重锚批次内回落至 70KB 并刷新基线**——口径已复测澄清，见 §8.4.1）外，本方案不预设其他新阈值。

#### 8.4.1 并存期配额与门禁度量口径修正（2026-09-20 用户决策；2026-09-22 按 0.2.0 重定）

**以下内容（至「2026-09-22 按 0.2.0 重定」之前）为 2026-09-20 在 `caomei-ui@0.1.0` 形态下的取证与决策快照。** 该快照的 `keyCss` 结论已被 0.2.0 推翻，保留作为历史依据；据此可判断回落可在 0.2.0 升级批次提前完成，无须顺延到 B4。

并存期两套组件库样式必须同时进产物，而 caomei-ui 的 `styles.css` 是**单一全量文件**（167,585 B 原始 / gzip 25.60 KB），无法按组件裁剪。M1 接入基座后实测：

| 指标（gzip） | 口径修正前 | 修正后实测 | 门禁配额 | 说明 |
| :--- | ---: | ---: | ---: | :--- |
| `keyCssGzipBytes` | 59,795 | **75,110**（+15.3KB，+25.6%） | 70KB → **85KB** | caomei-ui 全量样式注入导致的并存期增长 |
| `coreEntryJsGzipBytes` | 210（无意义代理） | **336,333**（88 个 JS） | 260KB → **360KB** | 度量对象修复后重新定标 |
| `maxAsyncChunkJsGzipBytes` | 126,807（含 admin chunk） | **49,055** | 130KB | 修正 manifest 路径后 admin chunk 正确排除 |

**同期修正的两个既有度量缺陷**（非本迁移引入，但会使上表数字失真，故一并修正）：

1. `coreEntryJsGzipBytes` 原先在入口识别失败时回退为「gzip 体积最小的 3 个 chunk」，实测只量到 3 个 70 字节的运行时垫片，使该检查恒真。现改为读取 **Nuxt 客户端 manifest** 的 `entrypoints` + `preload` JS（`scripts/perf/check-bundle-budget.mjs` 的 `collectEntryPayloadFilesFromManifest`），实测入口启动载荷为 **88 个 JS / 336,333 B**。因该预算从未真正生效、无有效基线可沿用，按实测值重新定标为 `360 * KB`（约 10% 余量）；若后续要收紧，应作为独立的性能目标而非迁移前置。
2. `maxAsyncChunkJsGzipBytes` 原先读取的 manifest 路径（`chunks/build/client.precomputed.mjs`）已被 Nitro 改为 `chunks/virtual/precomputed.mjs`，异常被 `catch` 吞掉，导致 admin 路由 chunk 长期未被排除而虚高（旧值 126,807 中含 admin chunk）。修正路径后 admin 侧共排除 24 个路由 chunk 与 47 个关联 chunk，实测降至 **49,055 B**。
3. `mode=error`（阶段收口 / 发版前检查使用的 `test:perf:budget:strict`）下，预算项「无法度量」（skipped）现计为失败，避免入口识别失效时被静默放过。

该增长即风险登记 #3「双库并存期包体膨胀」的预期代价。经用户决策采用**显式且可撤销**的并存期配额：

- `scripts/perf/check-bundle-budget.mjs` 的 `keyCssGzipBytes` 放开至 `85 * KB`，并在脚本内注明原因与回落要求。
- `.github/perf/bundle-baseline.json` 同步刷新为并存期基线（含 `note` 字段说明）。
- **B4 卸载 PrimeVue 后必须回落**：`keyCssGzipBytes` 恢复 `70 * KB` 并刷新基线；届时 PrimeVue 主题样式退出产物，预期 CSS 重新低于 70KB。未回落即视为 B4 未完成。

**2026-09-22 按 0.2.0 重定（重要）**：上表的并存期增长（`keyCssGzipBytes` **59,795 → 75,110**，+15.3KB gzip；门禁配额同步由 70KB 放开至 85KB）**其唯一驱动是 0.1.0 的单体 `styles.css`（167,585 B / gzip 25.60 KB）**。`caomei-ui@0.2.0` 已移除该单体文件，改为：

- 基础层 `caomei-ui/theme.css` 实测 **5,880 B / gzip ~1,089 B**（`injectStyles` 的注入物；gzip 值随压缩实现可有 ±1 B 差异）；
- 组件样式逐模块产出（约 73 个组件 CSS；`dist/` 下共 75 个 CSS，含基础层与图标样式），由打包器 tree-shaking 按需丢弃——momei 当前零 caomei-ui 组件消费，故**预期组件样式零进入产物（以 0.2.0 升级批次的 `keyCss` 复测为准）**。**复测已确认零进入产物**（产物仅含基础层 `.caomei-root` 与 `--caomei-*` token，`caomei-button` 出现 0 次，见 [回归记录](../../reports/regression/current.md) M1b 节）。注：该结论对应「尚未消费任何 caomei-ui 组件」的重锚时点；自 B2 开始消费组件后，按需组件样式会进入对应路由 chunk（首个实例见 [回归记录](../../reports/regression/current.md) M4 节「包体归因」）。

因此：

1. **升级到 0.2.0 后必须复测 `pnpm test:perf:budget` 的 `keyCss`**；预期其回落到 `70KB` 预算以内（相对 0.1.0 的 75,110 至少下降约 14KB gzip）。**已于 2026-09-24 复测：实测 60,684 字节，组件样式零进入产物，符合预期**（该口径已于 2026-09-26 在 0.3.0 批次复测澄清，见下）。
2. 复测确认后，**在 0.2.0 升级批次内即回落配额与基线**（`scripts/perf/check-bundle-budget.mjs` 的 `keyCssGzipBytes` 恢复 `70 * KB`；`.github/perf/bundle-baseline.json` 刷新），**不再顺延到 B4**；原「B4 必须回落」的约束随之改为「若 0.2.0 升级批次已回落，B4 只需确认未反弹」。**已于 2026-09-24 完成（第六十七阶段 M1b）。**
3. 后续 B2~B4 逐批迁移时，caomei-ui 组件样式随消费方 chunk 归属（路由页消费进路由 chunk，入口 / 全局壳消费进 `keyCss`）；每批收尾的 `keyCss` 变化应归因到基础层 / 入口 CSS 侧变更（含全局壳新消费组件的样式），不得出现无法解释的跃升。

**口径复测结论（2026-09-26，`caomei-ui@0.3.0` 升级批次，第六十八阶段条目 1）**：`.github/perf/bundle-baseline.json` 原「momei 当前零 caomei 组件消费故组件样式零进入产物」的前提仅成立于 0.2.0 重锚时点，与 B2 试点页已消费 5 个 caomei-ui 组件的冲突已按实测澄清——组件样式**随消费方 chunk 归属**：当前消费面（B2 试点 5 族）的组件样式落在路由 chunk（`comments.*.css` 含 `caomei-badge` 等），入口 `entry.*.css` 仅含基础层（`.caomei-root` 与 `--caomei-*` token；在册组件类零命中，`caomei-select` / `caomei-input` / `caomei-skeleton` 的命中均为 `--caomei-*` token 名）；若入口 / 全局壳消费组件，其样式将计入 `keyCss`。**归因更正**：`0.2.0` 与 `0.3.0` 的基础层字节级一致（`dist/styles/index.css` 同 sha256），**`0.3.0` 升级对包体三项指标贡献 0**；现行 `keyCss` 60,896 字节（59.47KB / 70KB 配额）为 0.2.0 期（M3 token 桥接后）既达值，较 M1b 期（2026-09-24）60,684 的 +212、`coreEntryJs` 337,008（+675）、`maxAsyncChunkJs` 49,147（+92）均为**相对 M1b 期基线的累计差**（入口 CSS 侧净增量，主因 M3 `html:root` 桥接块），非 0.3.0 单批增量。基线 JSON 指标与 `note` 已按该口径刷新，`docs/standards/performance.md` 同步闭环。

> 说明：上表同时记录的两个既有度量缺陷修正（`coreEntryJsGzipBytes` 入口口径、`maxAsyncChunkJsGzipBytes` manifest 路径）与本迁移无关，继续有效，不随 0.2.0 回退。

### 8.5 逐批清单

B2 / B3 / B4 各产出一份「文件 → 改动点 → 依据指针（差异编号 / 映射表条目 / 库侧能力项）」清单并留存；清单文件数须与该批统计口径一致，不保留无依据行。

## 9. 风险登记与缓解

| # | 风险 | 影响 | 缓解 |
| :-: | :--- | :--- | :--- |
| 1 | **样式 / 主题耦合是最大盲区**：1403 处 `--p-*` + `.p-*` 选择器 122 处（SCSS/CSS 6 文件 + `.vue` 26 文件）+ 119 处 `:deep()`，momei 已把 Aura 调成自己的设计语言 | 无法靠计数判断完成度，易出现观感回退 | token 对照表 + 计算样式 / 截图基线逐项闭环；按消费点核对多义色阶；B4 前保持"不属于差异清单的变化不得静默出现" |
| 2 | **B4 依赖库侧 M5** | ~~浮层 / 展示类 8 个组件无法按现行 API 迁移~~ **已解除（2026-09-19）** | M5 十项已交付、B1 出口条件达成、caomei-ui Phase 7 第二阶段已归档；0.2.0（库侧 Phase 11）进一步补齐 Select 分组 / Tag 可选态 / DropdownMenu 子菜单等能力，B2 / B3 / B4 均不再受库侧阻塞 |
| 2b | **截图回归的环境脆弱性**：跨 OS / 浏览器渲染差异、字体、动画、动态数据导致假阳性 | 视觉回归被误判为失败或被迫放宽阈值，失去守线意义 | 固定浏览器 / viewport / locale / 时区、关闭动画、mask 动态区域；以 CI 生成为唯一基线来源；阈值调整必须显式评审 |
| 2c | **npm 本地联调形态误提交**：临时改用 `file:../caomei-ui` 后忘记改回 | CI / Docker / Vercel 解析失败 | 提交前检查 `package.json` 与 `pnpm-lock.yaml` 中 `caomei-ui` 协议；把该检查写入批次清单 |
| 3 | **双库并存期**：两套 token 与组件样式同时进产物，组件同名不同源 | 主题互相覆盖、同路由混用风险（**包体膨胀风险已随 0.2.0 大幅缓解**） | 按路由白名单隔离（`lib/ui-library.ts` 单点事实源）、整路由迁移完成才切换；同名 composables 由 `modules/caomei-ui-coexistence.ts` 隔离；包体口径见 §8.4.1——单体 167KB 样式已被基础层（gzip ~1KB）+ 按需组件样式取代，`keyCss` 配额在 0.2.0 升级批次回落至 70KB |
| 4 | **命令式 API 与锚点定位**：7 处 `.toggle(event)`（生产 6 / 测试 1）依赖事件坐标定位 | 需结构改写，可能引发浮层定位回归 | 库侧 M5-4 / M5-6 已定案为声明式写法；逐处 UI 复核；改写点登记到 B4 清单 |
| 5 | **SSR / hydration 稳定性**：两侧组件均用 portal / teleport，momei 为 Nuxt 4 SSR | hydration 不匹配或样式闪烁 | 迁移后对受影响路由做 SSR + hydration 复核；E2E 覆盖关键路径 |
| 6 | **测试与 E2E 耦合**：19 个 vitest mock 文件（18 测试文件 + `tests/testSetup.ts`）+ 3 个 E2E 文件的 23 处 `p-*` 断言 | 迁移期间测试大面积失败，掩盖真实回归 | 与迁移同批改写 mock 与断言；按批次定向跑，收尾全量 |
| 7 | **行为差异未预期**：`Switch change` 载荷由原生事件改为布尔值、`Password feedback` 默认关闭、`InputNumber useGrouping` 默认开启、`Select filter` 改组件等 | 用户可感知的行为变化 | 16 条差异逐条核对；变更点显式记录；必要处显式传参保持原行为 |
| 8 | **品牌图标无直接对应** | 11 项品牌图标需额外方案 | B4 择一并登记；候选见 §5.3 |
| 9 | **PrimeVue 4 期间的安全窗口**：迁移完成前仍依赖终点版本 | 迁移周期内无安全更新 | 缩短迁移周期；迁移未完成期关注 dependabot / audit 告警，必要时局部打补丁 |
| 10 | **0.2.0 基础层注入点重复**：`injectStyles` / resolver / 显式 import 三者任一重复 | 基础层与 `theme` 覆盖的层叠顺序不确定、主题覆盖丢失 | §5.7 约束 3；升级批次核对 `nuxt.options.css` 中 `theme.css` 仅出现一次，并加断言防回流 |
| 11 | **0.2.0 逐模块 CSS 的加载顺序**：组件样式经 JS import 注入且未分层，顺序由模块图决定 | 同路由内组件样式互相覆盖（低概率，类名空间不重叠） | §5.7 决策 3；B2 试点页在真实浏览器核对计算样式（§8.2 ①），并在批次清单中登记 |
| 12 | **裸 Node ESM 消费限制**：0.2.0 产物保留逐模块 CSS import，包根不能被裸 Node 直接 import | 若 momei 治理 / 构建脚本直接 import 包根会失败（`ERR_UNKNOWN_FILE_EXTENSION`） | 已核实 momei 无此类脚本；新增脚本不得直接 import `caomei-ui` 包根 |

## 10. 工作量画像与排期建议

- 迁移面：**1515 个组件开标签 / 148 个 `.vue`**（占应用页面 83%）；图标 629 处 / 145 文件；token 1403 处；命令式 API `useToast` 42 文件 / `useConfirm` 14 文件；测试耦合 19 个 mock 文件 + 3 个 E2E 文件。
- **上游节奏（2026-09-22 更新）**：caomei-ui 已发布 0.2.0，含本方案依赖的样式按需化（**降低并存期包体风险**）与 M3 能力增强；库侧当前处于 Phase 12（发布就绪、文档对外与一致性收官），不产出本方案必需的新组件能力（0.3.0 交付的 DataTable 高级能力与 `TagsInput` 均为 momei 零用量，见 §3.7）。因此 momei 迁移**不再等待库侧**，唯一新增前置是接入基座重锚到 0.2.0（§3.6）。
- 批次容量建议：B2 以 20 个列表页为一批（可按管理端主路径再拆 2-3 个子批）；B3 以设置 / 安装 / auth 分组推进；B4 因涉及全量图标、浮层与卸载，体量最大，建议单独成阶段。
- **排期落地（2026-09-19 用户授权）**：采用**方案 A 三阶段轨迹**，迁移从第六十七阶段起正式上收为阶段主线：
  1. **第六十七阶段**：接入基座 + 视觉验证回归基座 + 全局 token 语义层 + B2 试点页（先验证全链路再全量）。
  2. **第六十八阶段**：B2 剩余数据页 + B3 表单与设置。
  3. **第六十九阶段**：B4 展示、浮层与收尾（含卸载 PrimeVue）。
- 每个批次走完整 PDTFC+ 与 Review Gate；跨批次的阶段准入、容量与验收以 [roadmap.md](../../plan/roadmap.md) 与 [todo.md](../../plan/todo.md) 为准。

## 11. 前置条件与开工检查清单

**A. 阶段启动前置（第六十七阶段开工即需满足——§2「开工条件已满足」指本组）**

1. ~~caomei-ui B1 全量出口条件达成（M3 / M4 已交付；**M5 待交付**）~~ **已满足（2026-09-19）**：M3 ~ M5 全部交付，B1 出口条件（补齐项带单测与文档、DataTable 列插槽有中英迁移示例、库侧 `pnpm verify` 通过）达成。
2. B0a 两张映射表与并存隔离策略评审通过、可复现（已交付，开工前复核一致性）。
3. **消费路径确定**：npm `caomei-ui@0.2.0` 可用（已核实发布、导出面 `./theme.css` 与许可证）；本地联调 `file:` 形态不得进入提交。
4. momei 工作区干净、与远端同步。
5. 开工前按 §3.4 在目标 commit 上重新取数，更新本文档基线数字。
6. **接入基座重锚到 0.2.0（2026-09-22 新增）**：依赖升级、`injectStyles` 注入物确认为 `theme.css`、注入点唯一、`keyCss` 复测并按 §8.4.1 回落配额——须在 B0b 基线采集**之前**完成。**已完成（2026-09-24，第六十七阶段 M1b）。**

**B. 批次迁移前置（进入 B2 实际页面迁移前必须满足，属第六十七阶段内任务）**

7. **视觉验证回归基座建立**：三层（单元 / E2E / 截图）齐备、迁移前基线已采集且可复现（见 §8.2）。
8. 明确双库并存白名单的载体与初始范围，并登记阻断规则（同路由混用为阻断项）。
9. 全局 token 语义层桥接完成，且未迁移页面在三层回归下无差异。
10. 品牌图标落点方案、`useToast` / `useConfirm` 映射写法在 B3 / B4 开工前定稿。

## 12. 未决问题

1. ~~**B2 是否可在 M5 交付前启动**~~ **已消解（2026-09-19）**：M5 已交付，B2 / B3 / B4 不再存在库侧前置争议。
2. **品牌图标方案**：`@iconify/vue` + Simple Icons / 保留 `@mdi/font` / 自建 SVG 三选一，待 B4 决策。
3. ~~**Popover / DropdownMenu 命令式入口**~~ **已消解（2026-09-19）**：库侧 M5-4 已收敛为声明式迁移写法（`CaomeiPopoverTrigger` 支持 `unstyled` 外观豁免、DropdownMenu 支持 `model` 项模型 + 声明式锚点），momei 侧按声明式改写。
4. ~~**排期窗口**~~ **已决策（2026-09-19）**：采用方案 A 三阶段轨迹，第六十七阶段起上收。
5. **PrimeVue 4 的最终安全窗口**：迁移完成前若出现 4.x 安全告警，需要局部打补丁还是加速迁移，待实际发生时的风险处置。
6. **截图回归的初值与阈值**：基线快照在哪一环境生成、`maxDiffPixelRatio` / `maxDiffPixels` 初值、是否纳入每批强制门禁，需在第六十七阶段确定并落盘（不预先在本文档写死）。
7. **B2 试点页选择**：以哪 1-2 个数据页作为试点（覆盖度 vs 风险），需在第六十七阶段开工时定稿。
8. ~~**0.2.0 升级批次的粒度（2026-09-22 新增）**~~ **已定稿（2026-09-24）**：接入基座重锚到 0.2.0 已作为独立原子条目（第六十七阶段 1b，依赖升级 + `theme.css` 注入核对 + `keyCss` 复测与配额回落）并在 B0b 之前完成，与「接入基座」条目（1a）同属第 1 项。

## 13. 相关文档

**momei 侧**

- [2026-08 PrimeVue 5 许可证变更专项评估](./2026-08-29-primevue-5-license-change-evaluation.md)（迁移动因与屏蔽策略）
- [backlog.md](../../plan/backlog.md) 长期主线第 11 条「UI 组件库许可证风险与迁移可行性治理」（跟踪载体）
- [UI 设计](../ui.md)（迁移收尾时同步组件库与主题章节）
- [项目规划规范](../../standards/planning.md)、[测试规范](../../standards/testing.md)、[文档规范](../../standards/documentation.md)
- [Weekly Regression](../../../.github/workflows/regression-weekly.yml)（回归承载者）

**caomei-ui 侧（唯一事实源）**

- [momei 迁移计划与验收标准（交接文档）](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-17-momei-migration-handover-plan.md)（批次划分、出口条件、16 条差异、基线 / 回归 / 包体判定口径）
- [momei 迁移可行性评估记录](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-17-momei-migration-feasibility.md)（能力覆盖、风险与反面验证）
- [momei 迁移 B0a 库侧资产](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-17-momei-migration-assets.md)（token 对照表、图标映射表、并存策略与包体口径）
- [momei 组件使用复核台账](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/governance/2026-09-14-momei-usage-audit.md)（逐组件判定与迁移映射规范）
- [caomei-ui 设计规范 §7 迁移映射](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/design-spec.md)（逐组件 prop 级现行映射）
- [caomei-ui 发布指南 §9 包形态与兼容性](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/guide/release.md)（0.2.0 破坏性变更、下游修复指引与消费前提）
- [caomei-ui 版本与兼容策略](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/guide/version-policy.md)（0.x 兼容策略与下游 pin 建议）
- [caomei-ui CHANGELOG](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/CHANGELOG.md)（0.2.0 变更清单与 `BREAKING CHANGES`）
