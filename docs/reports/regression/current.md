# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:workflow-precheck:test:2026-10-13 -->
## 2026-10-13 workflow pre-check（test，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=test`
- 证据 artifact: `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.md` / `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test critical files=PASS，test environment=PASS，security:validate-overrides=PASS，security:audit-deps=PASS
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:test:2026-10-13 -->

<!-- regression-window:start:phase68-b2-item3-taxonomy:第六十八阶段-条目3-首路由批次:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 3 首路由批次 B2 迁移（`/admin/categories` + `/admin/tags`）

### 范围

条目 3（B2 剩余数据页迁移二：组件型目标与 host 路由）的**首批**：路由自有实体组件 `components/admin/admin-taxonomy-page.vue` 随两个 host 路由（`/admin/categories` + `/admin/tags`）整体迁移，并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（第 12 / 13 项，共 13 项）。两页均为**薄包装页**（59 / 51 行，只有一行 `<AdminTaxonomyPage :config="…" />`），实体组件在册族用量 **39 处 / 18 个组件名** = **基准在册族 29 处 / 10 个组件名**（`Button` 11 / `Column` 7 / `InputText` 4 / `DataTable` 1 / `Badge` 1 / `IconField` 1 / `InputIcon` 1 / `Select` 1 / `Tag` 1 / `ToggleSwitch` 1，含路由自有子组件 `taxonomy-translation-association-card.vue` 的 `Button` 1）+ **路由级增量族 10 处 / 8 个组件名**（`Tabs` 族 5 / `InputGroup` 3 / `Checkbox` 1 / `Textarea` 1）。口径与复算：剥离注释后按守卫的标签边界规则计数（`tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单 + 本路由增量），可脚本复算。

**本批三项「首次」**：

1. **首个「路由级在册族增量」**：`Tabs` / `TabList` / `Tab` / `TabPanels` / `TabPanel` / `InputGroup` / `Checkbox` / `Textarea` 八族以 `CAOMEI_UI_ROUTE_SCOPES[].inScopeComponents` 按路由登记（用户 2026-10-16 裁定「全部纳入、整页迁移」）。主因是 `InputGroup` 与 `InputText` **结构耦合**——PrimeVue `InputGroup` 依赖子元素 `.p-inputtext` 做 flex 与圆角拼接，只迁输入框会静默破版；次因是「整路由迁移、不做半路由切换」。**不全局纳入的原因**：`Checkbox` / `Textarea` 在已收口批次页面中合法存在（实测 `pages/admin/submissions/index.vue` 命中两族），全局纳入会让完成路由被动回改。
2. **首个 `ownedFiles` 登记**：守卫扫描面从「页面文件」扩展到「薄包装页背后的路由自有实体文件」——只扫页面文件时，本路由的「在册族零残留」恒真、「至少使用一个 caomei-ui 组件」恒假，两条断言同时失效。
3. **首个「浮层内控件迁移」**：弹窗本体维持 PrimeVue `Dialog`（浮层豁免，随第六十九阶段），弹窗**内部**的 Tabs 族与表单控件已迁移。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `components/admin/admin-taxonomy-page.vue` | 在册族 39 处 → caomei：`DataTable` → `CaomeiDataTable` + 7 个 `<Column>` → `columns` computed（4~6 列，`parent.name` 用 `accessor` 承载；`style` / `class` 两侧镜像为 `headerStyle`/`bodyStyle`、`headerClass`/`bodyClass`；条件列 `parent` / `description` / 「翻译状态 ↔ 语言」按 `config` 与聚合开关决定）；`p-datatable-sm` 移除、受控 `:page="pagination.page"` + `pageIndexBase: 1`、`--caomei-data-table-pagination-justify: center`；`IconField`+`InputIcon`+`InputText` → `CaomeiInput`+`#prefix`（宽度按实测 261px 显式约束）；`ToggleSwitch` → `CaomeiSwitch`（`input-id` → `id`，原生 `label[for]` 保持）；`Tag value` → `CaomeiTag` 默认插槽；`Badge severity` → `:value` + `tone`；行内动作 `text rounded` 纯图标 → `icon-only`+`variant="ghost"`+lucide `#icon` 并补 `:label`；**弹窗内**：`Tabs` 族 → `CaomeiTabs`/`CaomeiTabList`/`CaomeiTabTrigger`/`CaomeiTabContent`、`InputGroup`+`InputText` 成组 → `CaomeiInputGroup`+`CaomeiInput`（`.p-invalid` → `:invalid`）、`Checkbox :binary` → `CaomeiCheckbox`、`Textarea cols` 移除、`Select filter show-clear` → `CaomeiAutoComplete strict dropdown`（空串回写 `null` 归一）；弹窗宽度显式声明 `min(90vw, 444px)`；名称字段焦点交接机制 | §6.1 / §6.2（执行提示 1~3）/ §6.3 差异 #1 / §5.5 |
| `components/admin/taxonomy-translation-association-card.vue` | `Button :label text size="small" severity="secondary"` → `CaomeiButton` + 默认插槽可见文案（`variant="ghost"` / `size="sm"` / `tone="neutral"`） | §6.2 执行提示 3 |
| `lib/ui-library.ts` | 基准在册族不变；新增 `CaomeiUiRouteScope` 接口、`CAOMEI_UI_ROUTE_SCOPES`（含 `ownedFiles` / `inScopeComponents`）与 `resolveInScopeComponents(scope)`；`CAOMEI_UI_ROUTE_PREFIXES` 改为**派生**（11 → 13 项，消除「前缀清单与范围登记两处维护」的漂移面） | §5.5 |
| `tests/modules/ui-library-route-migration-guard.test.ts` | 守卫改为按范围条目扫描（页面文件 + `ownedFiles`，聚合判定「至少一个 caomei 组件」）；新增 8 条断言（前缀派生一致 / `ownedFiles` 存在性与 POSIX 形态 / 不存在的 `ownedFiles` 抛出并点名 / 薄包装页两态 / 基准在册族不含增量族 / 合并去重 / 同一 `ownedFiles` 的多条登记增量一致） | §5.5 |
| `tests/helpers/taxonomy-page-stubs.ts`（新增） | 三个用例文件共用的 caomei 组件桩 + `config` 夹具（同一组件被三条用例渲染，三处各持一份会在后续批次静默漂移） | §8.2 |
| `components/admin/admin-taxonomy-page.test.ts`、`pages/admin/categories/index.test.ts`、`pages/admin/tags/index.test.ts` | 桩集改为共享模块并改用 caomei 契约断言；组件用例由 1 条扩到 **17 条**（列定义逐列镜像 / 聚合开关列切换 / `Tag` 插槽 / `Badge` tone 两态 / `Switch` id / Tabs 族与表单控件 / `AutoComplete strict` / `parentId` 归一 / icon-only `:label` / 页脚插槽 / 名称字段焦点交接） | §8.2 / §6.2 |
| `tests/visual/parity/routes.ts`、`tests/visual/parity-budget.json` | 新增两条路由（先入 `PENDING_ROUTES` 采集参考态，迁移后移入 `MIGRATED_ROUTES`）；4 个 testName 的允许清单按 **4 个非重叠功能带** 校准（声明值 = 实测值本身） | §8.2 |
| `tests/visual/parity/reference/*.reference.png`、`reference-manifest.json` | 新增 4 张参考态（`--ref=HEAD` 就地采集；**采集前临时回退路由登记**，确保参考态为纯 PrimeVue 原貌，避免「半迁移」的头部切换器进入参考态） | §8.2 |
| `tests/visual/admin-taxonomy-dialog.visual.test.ts`（新增）+ 2 张基线 | 补弹窗截图覆盖——门禁层参考态无数据行 → 弹窗不会打开，弹窗内的 Tabs 族 / 表单控件在门禁层**无截图覆盖**（本批登记的覆盖缺口，由此用例闭合） | §8.2 |
| `tests/e2e/admin.e2e.test.ts` | 原「should load admin categories and tags」单测**折入**路由矩阵（11 → 13 行，避免同一路由两次导航挤占预算），选择器 `.p-datatable` → `.caomei-data-table`，超时 60 → 90s（13 行隔离复跑实测 45.3s） | §8.2 |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

| 功能带（非重叠） | categories L / D | tags L / D | 归因（处置通道） |
| :--- | ---: | ---: | :--- |
| 头部语言切换器（160,80 200×80） | 863 / 878 | 863 / 878 | 路由登记后 `.content-language-switcher` 由 V1（PrimeVue `Select` 版）切到 V2，控件高 30.09px → 28px（§5.5 消费处静态择库，既有过渡组件差异） |
| 头部创建按钮（1240,80 160×80） | 985 / 1017 | 989 / 1019 | `CaomeiButton` 尺寸档：font 16 → 14px、圆角 6 → 8px、实测 114×36.39 → 102×36px（通道④ 上游反馈：库侧档位口径，本批不做） |
| 筛选行（80,200 1280×44） | 1455 / 1521 | 1436 / 1525 | 字段外壳行盒 36.39px → 36px（font 16 → 14px）+ `CaomeiSwitch` 高度 24 → 22px |
| 表格区（80,244 1280×240） | 5682 / 8104 | 5075 / 7503 | `DataTable` → `CaomeiDataTable`：表头行高 31.39 → 32.59px（font 16 → 14px、padding 8 → 12px、表头带底色）、空态行高 95.39 → 128.59px、分页器高度 56 → 44px |
| **全图实测** | **8985 / 11520** | **8363 / 10925** | 四带求和 = 全图实测值（无带外像素、无余量）；有效检出阈值 = 未归因差异 > 3000px 即红 |

参考态取自迁移前 HEAD（`--ref=HEAD` 就地采集）。弹窗本体不在门禁层截图内（参考态无数据行），其差异单列于下。

**弹窗（基线层覆盖）**：宽度由内容驱动 444px → 372px（caomei 字段宽度只由容器决定）——**已修复**，显式 `:style="{ width: 'min(90vw, 444px)' }"` 回到迁移前实测宽度（用属性而非 scoped 类：该浮层由 PrimeVue 组件渲染，类选择器与 scoped 作用域属性的落点依赖库内部结构）；弹窗内控件自身差异（页签 51.39 → 37.59px、复选框 20 → 18px、页脚按钮 82 → 74px、输入框 328 → 271px）由新增基线层用例接受。

### 行为差异与处置

| 项 | 迁移前 | 迁移后 | 处置 |
| :--- | :--- | :--- | :--- |
| 弹窗初始焦点 | 名称输入框（PrimeVue `Dialog.onAfterEnter` → `focus()` 命中默认插槽内的 `[autofocus]`） | 浮层 focus trap 回落到关闭按钮（caomei `CaomeiInput` 无 `autofocus` 契约，透传属性落在不可聚焦的字段外壳） | **已修复**：`@show` 置位 + 捕获浮层第一次 `focusin`（即 trap 落到关闭按钮那次）后把焦点交回当前语言页签的名称字段；实测 `document.activeElement === input#name_zh-CN` |
| 页签切换焦点 | 逐页签重挂载触发原生 `autofocus` → 焦点进入新页签名称字段 | 焦点留在触发器上（Reka Tabs 的标准 WAI-ARIA 行为） | 登记 backlog，随浮层批次（第六十九阶段）复核 |
| 父级下拉的筛选 | PrimeVue `Select` + `filter`（下拉内搜索） | `CaomeiAutoComplete` + `strict` + `dropdown`（输入即筛选，取值须来自选项） | 迁移方案 §6.3 **有意差异 #1**；空串回写 `null` 维持 `parentId: string \| null` 契约 |
| `v-model.trim` | 声明存在但不生效（PrimeVue 4.5.5 未实现 `modelModifiers`） | 同前（caomei 亦未实现） | 保留原声明以维持意图，不引入新行为（实测确认双方一致） |
| `required` / `Textarea cols` | `required` 打在原生输入上（无 `<form>` 提交路径，本无行为）；`cols` 在流体布局下不改变实际宽度 | 未迁移 | 明确不迁移，避免「属性落到字段外壳」的静默假象 |
| 受控分页 | PrimeVue 自持页码 | 受控 `:page="pagination.page"` + `pageIndexBase: 1` | 与既有 6 条已迁移路由同口径；受控后失去「总条数收缩自动夹取页码」的内部收敛（观察项） |

### 验证结果

- 结构性守卫：`tests/modules/ui-library-route-migration-guard.test.ts` **38 用例通过**（含 13 条范围条目逐条扫描；与 `resolveScopeFiles` 运行时校验重复的 1 条用例已在审计中移除）
- 单元测试：`pnpm test` **554 文件通过 / 1 skipped**；**4812 用例通过 / 1 skipped**
- 契约用例：`admin-taxonomy-page.test.ts` 17 条；`taxonomy-translation-association-card.test.ts` 4 条（真实子组件，审计 S-M1 补强）；`categories/index.test.ts` 8 条；`tags/index.test.ts` 7 条
- 门禁层（截图）：`pnpm test:visual:parity` **26/26 通过**（22 既有 + 4 新增；新增 4 条未归因差异 0px；两条新增路由按既定口径已移入 `MIGRATED_ROUTES`）
- 基线层（截图）：`pnpm test:visual` **16/16 通过**（14 既有 + 新增弹窗 2；既有快照零变化）
- E2E：管理端 **6 用例通过**（含 13 行路由矩阵，实测 44.7s / 90s 预算）；其中「分类搜索 + 聚合开关」用例新增**几何还原断言**（搜索字段 261px、分页器 `justify-content: center`），把此前只靠人工探针核对的「结构性还原」升级为门禁项
- 质量门：`pnpm typecheck` 0 error；`pnpm lint` 0 error / **8 warning**（7 既有 + 1 新增，见下）；`pnpm lint:css` 通过
- 文档：`docs:check:i18n` / `docs:check:line-count` / `docs:check:links`（247 文件）/ `docs:check:source-of-truth` 全通过

### 审计结论与修复（A 阶段）

两分区并发审计：**实现 / 事实源分区判 Pass（附 2 项强制条件）**、**测试 / 门禁 / 文档分区判 Reject（2 blocker + 3 warning）**。全部编号已闭环：

| 编号 | 结论要点 | 处置 |
| :--- | :--- | :--- |
| B1（文档） | 新增 5 行偏差条目被空行踢出「处置表」，渲染为字面竖线段落 | 删除截断空行；用同一渲染器（`markdown-it`）复验「无 `<p>\|` 段落」且新行位于同一 `<table>` 内 |
| B2（文档） | 「在册族 26 处」与自述口径矛盾（复算 = 39 = 基准 29 + 增量 10）；「884 行」与实测不符；「`#icon` 12 处」实为 10 处 | 三处数字按复算口径改写（并给出口径与复算方式） |
| W1（门禁登记） | 两条路由已迁移却仍登记在 `PENDING_ROUTES`（`migrated: false`），与 4 处文档表述矛盾 | 移入 `MIGRATED_ROUTES`；同步 `routes.ts` / 待迁移层用例头注释 / 偏差处置表 / backlog 的表述与张数 |
| W2（测试强度） | 5 类存活 mutant（可见文案、焦点交接身份、交接守卫、Tabs 双向、textarea rows） | 全部补断言：新增真实子组件用例（不桩化翻译关联卡片）+ 焦点 spy 记录 `id` + 二次 `focusin` 只交接一次 + 关闭复位 + `update:modelValue` 双向 + `rows="3"` |
| W3（文档） | 「较迁移前 +28」缺可比基准 | 改写为「较上一窗口记录值 4779 → 4812」 |
| W4 / S1（实现） | 派生机制收益表述过强（未声明「非薄包装页漏登记」仍是已知无守卫面）；两条登记逐字复制 | 注释补覆盖边界；抽出共用范围常量 `TAXONOMY_ROUTE_SCOPE` |
| S2 / S3 / S5（实现 / 测试） | 交接标记无关闭复位；`vertical-align` 缺来源；几何还原无门禁项 | `hideDialog` 复位标记 + 补开关断言；补由来注释；E2E 增两条几何断言；基线层弹窗用例增真实 DOM 焦点断言 |
| W2（实现分区） | 翻译徽标几何未按 `/admin/posts` 口径还原（`p-badge` 规则静默失效） | 补 `--caomei-badge-*` token 还原块（通道①），并在偏差处置表登记 |

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- **新增 lint warning**：`components/admin/admin-taxonomy-page.vue` 904 行 > `max-lines` 800（迁移前 732 行 → 迁移后 904 行）。增量来自 `#icon` 插槽 10 处（lucide 图标用法共 12 处）、焦点交接机制与依据注释；`pnpm lint --max-warnings 10` 仍通过（8/10），抽取方向（列定义 / 弹窗表单外置）登记 backlog（结构复用主线）。
- 弹窗在门禁层无覆盖（参考态无数据行 → 弹窗不打开），已由基线层新增用例补上；**门禁层的两条新路由仅覆盖「筛选行 + 空表 + 空态 + 分页器」**，列表有数据行时 `Tag` / `Badge` / 行内按钮的渲染差异不在截图覆盖内（由契约用例断言承接）。
- 幻影类 `hidden md:table-cell`（描述列）沿用 `/admin/posts` 批次口径：全仓无可命中表格单元格的规则，保留原声明并两侧镜像。
- `CAOMEI_UI_ROUTE_PREFIXES` 前缀语义连带子路由：`/admin/categories` + `/admin/tags` 无子路由，本批无新增落差；条目 3 后续批次登记 `/admin/ai` 时须显式处置 `/admin/ai/tasks/[id]`（用户 2026-10-16 裁定：维持 PrimeVue + 补结构守卫例外登记）。
- 用例增量对账：本批按 `it()` 可数增量 = +30（组件 +16 / 新增子组件用例 +4 / 守卫 +10），而窗口记录为「4779 → 4812」（+33）；两个记录数均为实测，差额 3 未闭环，登记为收尾对账项（不阻塞放行）。
- 环境观察：本机全量 `pnpm test:e2e`（含 firefox 项目与公开页 `networkidle` 依赖）在无外网/高负载下大面积超时失败，本批据既往口径**隔离管理端用例**执行（`--project=chromium tests/e2e/admin.e2e.test.ts`）；该口径与 [backlog](../../plan/backlog.md) 中「`networkidle` 依赖外网可达性」待跟踪项同源。

<!-- regression-window:end:phase68-b2-item3-taxonomy:第六十八阶段-条目3-首路由批次:2026-10-16 -->

<!-- regression-window:start:phase68-b2-friend-links:第六十八阶段-条目2-第九路由:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 2 第九路由 B2 迁移（`/admin/friend-links`）

### 范围

条目 2（B2 剩余数据页迁移一）的第九个路由 `/admin/friend-links` 按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（第 10 项）。该路由为**单文件大页面**（`pages/admin/friend-links/index.vue` 565 行，逻辑全部在路由自有 composable `use-admin-friend-links-page` 中），迁移前在册族用量 **55 处 / 6 个组件名**：`Column` 21 / `Button` 16 / `Tag` 6 / `InputText` 6 / `Select` 3 / `DataTable` 3（**3 个表格 / 21 列**，为条目 2 中列数最多的路由）。

**本路由是首个消费共享壳过渡组件 `AppUploaderV2` 的路由**（迁移方案 §5.5「组件内按路由择库」，跨边界展示型壳）；非在册族按批次口径保留 PrimeVue：`Dialog` ×3 / `ConfirmDialog` / `Toast` / `useConfirm` / `InputNumber` ×3 / `Textarea` ×3 / `Checkbox` ×6。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/friend-links/index.vue` | `DataTable` ×3 + `Column` ×21 → `CaomeiDataTable` ×3 + `columns`（`#body` → `#cell-{key}`；`field` 列沿用字段名作 key，无 `field` 的列按插槽语义命名 `category` / `isFeatured` / `isPinned` / `isEnabled` / `actions`；`#empty` 三个空态插槽原样保留）；`Button` ×16 → `CaomeiButton`（页头次要与主色、区块 icon-only 刷新、条件性「建议复核」ghost + warning + sm、行内编辑 / 删除 / 查看 icon-only ghost + rounded + tone，全部补 `:label` 可访问名）；`Tag` ×6 → `CaomeiTag`（`severity` → `tone`）；`InputText` ×6 → `CaomeiInput`、`Select` ×3 → `CaomeiSelect`（**移除 `fluid`**：caomei 字段默认 `width: 100%`）；`AppUploader` → `AppUploaderV2` | §6.1 / §6.2 / §5.3 / §5.5 |
| `composables/use-admin-friend-links-page.ts` | **语义色口径统一为 caomei `tone` 词表**：`getLinkStatusSeverity` / `getHealthStatusSeverity` / `getApplicationStatusSeverity` → `…Tone`（`info→primary`、`secondary→neutral` 两档为有损近似），并导出 3 个表单 / 列表类型供列定义使用 | §6.2 |
| `styles/pages/admin-friend-links.scss` | 字段容器 `.admin-friend-links__field` 增设 `--caomei-select-max-width: 100%`——caomei `Select` 的宽度 / `max-width` 钩子在**字段外层**（默认 20rem = 320px，`class` 只落触发器），本页表单为 2 列栅格（每列约 330px）、审阅弹窗更宽，不放开会截断（上游反馈 §1.1） | 上游 §1.1 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/friend-links`（第 10 项） | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 矩阵内 `/admin/friend-links` 行**就地更新**为 `.caomei-data-table, .admin-friend-links` | 层 ② |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-friend-links-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`；允许清单按门禁报出的区域校准（浅 / 深各 4 区） | §8.2 层 ③ |
| `pages/admin/friend-links/index.test.ts`（重写） | 13 条契约用例：页头两按钮、三表列定义与插槽接线、`Tag` tone 映射（含条件性按钮）、动作集合形态与可访问名、空态、`AppUploaderV2` 消费、浮层表单控件迁移（6 `CaomeiInput` / 3 `CaomeiSelect`）与非在册族保留计数、页脚按钮 tone | §8.2 层 ① |
| `composables/use-admin-friend-links-page.test.ts` | 语义色用例改为 `tone` 词表并补边界档（`draft→primary`、`archived→neutral`、未知值→`neutral`） | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

**几何核验**（探针实测）：区块 `x32 y168 1376x215`、split `x32 y403 1376x199`、三表 `49,237 1342x129`（友链）/ `49,456 644x129`（分类）/ `747,456 644x129`（申请，同行并排）与参考态**区块位置一致**；差异为 caomei 表格的**空态行更高**（实测 tbody 行高 **97px** vs PrimeVue 约 76px）——**本路由在 parity 环境中三表均无数据**（种子数据为空，页面渲染 `#empty` 空态），故差异主体是空态行 + 表头 chrome，而非数据行或标签；该高度差使 split 区顶边由 `y373` 下移到 `y403`（**+30px**），已被允许清单区域 2 覆盖。

**差异区域（门禁报出）**：

| 区域 | 浅色 | 深色 | 归因 |
| :--- | :--- | :--- | :--- |
| `x[40,1400] y[240,360]` | 7925px | 9457px | 友链表（`DataTable` → `CaomeiDataTable`：表头底色 / 边框 / 字号 + **空态行高度**；本环境无数据，故不含数据行 / 标签渲染差异） |
| `x[40,1400] y[400,560]`（深色至 y600） | 12065px | 13638px | 下半区（分类表 + 申请表）同上表格差异 + **首表空态行高度差带来的整段位移**（+30px） |
| `x[1200,1440] y[80,120]` | 1540px | 3985px | 页头两个动作按钮（`CaomeiButton` secondary / 默认 vs PrimeVue `Button`，含暗色底纹差异） |
| `x[1360,1400] y[160,240]` | 107px | 110px | 区块 / 表格右缘的边框与溢出差异 |

### 验证结果

- **层 ①（单元）**：`pnpm test` **553 文件 / 4762 用例通过**（1 skipped；较上一批 +12 用例）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（7 条既有 warning）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：管理端定向 `admin.e2e.test.ts` + `admin-workflow.e2e.test.ts` = **8 passed / 50.1s**（含扩展矩阵 10 行，`/admin/friend-links` 行已就地更新）。
- **层 ③（截图识别 · 门禁层）**：本路由浅 **21637px / 1.670%**（允许清单命中 4/4）、深 **27190px / 2.098%**（命中 4/4），未归因 **0px**；全量 `pnpm test:visual:parity` **22/22 通过**（10 个已迁移路由 20 testName + 1 个待迁移路由 2 testName）。
- **归档**：第七次滚动归档迁出第六路由窗口（`phase68-b2-link-governance`，85 行）至 `archive/2026-10-15-phase68-b2-link-governance.md`；`current.md` 由 484 行降至 398 行（归档后中间态），写入本窗口后为 464 行（`docs:check:line-count` 口径）。
- **依赖同步（本批开工前置）**：按用户指令 `git pull --rebase` 同步远端 15 个 Dependabot 提交（本地 27 笔全部干净重放，**无冲突**），并复跑基线层 `pnpm test:visual` **14/14**、全量单测与 lint 确认依赖升级（`@lucide/vue` 1.55 / `zod` 4.6.6 等）无回归；`caomei-ui` 未被抬版（仍 `0.6.0`），不触发升级纪律。

### 提交拆分依据（本批规模超 §2.8 单提交阈值的说明）

本批工作树合计 **16 个路径 / 983 行新增**（`git diff --numstat` 新增列 + 未跟踪文件逐文件计数；**含首轮审计修复增量**——迁移方案 §6.2 补记与 `backlog.md` 行数同步，随笔 1 提交），超过「单提交 ≤10 文件 / ≤800 行新增」，按职责拆为 **4 笔**，每笔均在双阈值内：

| # | 提交主题 | 文件数 | 新增行（逐文件复算） | 依赖顺序 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 治理记录：第七次滚动归档 + 第九路由窗口 / 校准记录 / 进度 | 7 | 188 | 无 |
| 2 | 路由自有 composable 语义色口径 + 字段容器宽度口径 | 3 | 30 | 无 |
| 3 | 页面迁移 + 路由登记 + E2E 矩阵 + parity 台账 | 5 | 370 | 依赖 2 |
| 4 | 页面契约用例 | 1 | 395 | 依赖 3 |

拆分依据：① 按「治理记录 / composable 与样式 / 实现与台账 / 测试」切分；② 语义色口径（composable）与字段宽度口径（样式）同笔，二者均为页面的前置依赖；③ 页面测试单独成笔（368 行），确保每笔 ≤800 行。

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- **表格空态行高度差异**：caomei 空态行 97px vs PrimeVue 约 76px，使含表格的区块整体更高；属组件替换本身，已进允许清单。
- **门禁无法覆盖本路由的数据行 / 标签渲染**（重要）：parity 环境**种子数据为空**，三表均渲染 `#empty` 空态 → `Tag` 的渲染（含首轮审计发现的「`CaomeiTag` 无 `value` prop 导致空标签」缺陷）**不在任何自动门禁的覆盖内**；该缺陷由首轮审计以源码 + SSR 产物取证发现并修复，已同步在迁移方案 §6.2 补记 `Tag` 可见文案陷阱。**建议**：为含状态标签的列表路由补一条数据行级断言（E2E 或组件级），封堵同类「桩自造 prop」漂移。
- **`Select` 宽度口径的第三次出现**：本批在**字段容器**上放开 `--caomei-select-max-width`（上游 §1.1）。三次处置位置不同（包装元素 / 字段容器 / 字段容器），根因同一：caomei `Select` 的 `class` 只落触发器、宽度钩子在字段外层。**建议后续把该口径写入迁移方案 §6.2 的执行提示**（避免每个新路由重新踩一次）。
- **语义色口径迁移**：`info` / `secondary` 两档为有损近似（§6.2），本批把三处 severity 函数统一改名并返回 tone；公开页 `pages/friend-links.vue` 有**同名但独立**的 `getHealthStatusSeverity`（未迁移，不在本批范围）。
- **`fluid` 移除**：本批在 6 个 `InputText` 与 3 个 `Select` 上移除 `fluid`（caomei 字段默认全宽）；非在册族的 `InputNumber` / `Textarea` 仍保留 `fluid`（PrimeVue 语义，随 B3 批次处理）。

<!-- regression-window:end:phase68-b2-friend-links:第六十八阶段-条目2-第九路由:2026-10-16 -->

<!-- regression-window:start:phase68-b2-posts:第六十八阶段-条目2-第十路由:2026-10-16 -->
## 2026-10-16 第六十八阶段 条目 2 第十路由 B2 迁移（`/admin/posts`）+ 条目 2 收口

### 范围

条目 2（B2 剩余数据页迁移一）的**最后一条**路由 `/admin/posts`（列表页）按**路由整体切换**到 caomei-ui 并登记进 `CAOMEI_UI_ROUTE_PREFIXES`（第 11 项）。该页 624 行 / **31 处在册族开口标签（10 个组件名）**——是本条目**在册族组件名最多**的路由（`Column` 14 / `Button` 7 / `Tag` 3，以及 `Badge` / `DataTable` / `IconField` / `InputIcon` / `InputText` / `Select` / `ToggleSwitch` 各 1），也是**唯一含行多选**的路由。三项「首次」：首个消费 `CaomeiSwitch`；首个使用 `selection-mode="multiple"` + 冻结列 `frozen: 'right'`；首个以 `headerStyle` / `bodyStyle` 镜像 PrimeVue `Column` 的 `style` / `class`（实测后者同时落 `th` 与 `td`）。

本批同时完成**条目 2 收口**：10 条数据列表路由全部迁移，parity 门禁 `PENDING_ROUTES` 清空，三件套过渡组件（`PostAuditBadgeV2` / `PostAuditDialogV2` / `PublishPushDialogV2`）由「仅落基建」切换为「被已迁移路由消费」，`/admin/posts/[id]` 成为本族**唯一**剩余 V1 消费者。

非在册族按批次口径保留 PrimeVue：`ConfirmDeleteDialog`、三件套 V2 内的浮层壳 `Dialog` 与 `ProgressBar`（B4）、`post-media-preview-cell.vue` 的 `Image`（展示容器，B4）、`v-tooltip` 指令。

### 「文件 → 改动点 → 依据指针」清单

| 文件 | 改动点 | 依据指针 |
| :--- | :--- | :--- |
| `pages/admin/posts/index.vue` | `DataTable` + 14 个 `Column` → `CaomeiDataTable` + `columns`（`#body` → `#cell-{key}`；有 `field` 的列沿用字段名作 key，`author.name` / `category.name` 由 `accessor` 承载以避免含点号的插槽名，无 `field` 的列按插槽语义命名 `translations` / `audit` / `actions`；`<Column selection-mode="multiple" />` → 表格级 `selection-mode="multiple"` + `row-key="id"`）；`Button` ×7 → `CaomeiButton`（页头两个走默认插槽可见文案；行内 5 个改 0.6.0 `iconOnly` + lucide `#icon`，并按契约补 `:label`——迁移前编辑 / 删除两个按钮**既无可见文本也无可访问名**，复用既有 `common.edit` / `common.delete` 键）；`IconField` + `InputIcon` + `InputText` → `CaomeiInput` 的 `#prefix`（图标换 lucide `Search`）；`ToggleSwitch` → `CaomeiSwitch`（`input-id` → `id`，保留原生 `label[for]` 关联与可访问名推导）；`Select` → `CaomeiSelect`（`show-clear` 沿用；PrimeVue 专有 `@change` → `@update:model-value`）；`Tag` ×3 → `CaomeiTag`（**可见文案落默认插槽**）；`Badge` → `CaomeiBadge`（**保留 `:value`**，与 Tag 不同）；三件套 `PostAuditBadge` / `PostAuditDialog` / `PublishPushDialog` → `…V2`（消费处静态择库） | §6.1 / §6.2 / §5.5 / §5.3 |
| 同上 | 状态 Tag 的 `severity` → `tone` 转换落在**页面本地**（`SEVERITY_TO_TONE_MAP`：`info→primary`、`secondary→neutral` 为有损近似），不改共享 helper `getPostStatusSeverity`——后者同时服务 `/admin/posts/[id]` 编辑器路由（本阶段仍为 PrimeVue）且有单测锁定 PrimeVue 词表 | §5.5「路由内组件来源唯一」+ §6.2 |
| 同上 | 列声明保真：`header-style` → `headerStyle`；`style` → `headerStyle` + `bodyStyle` **两侧镜像**（PrimeVue `Column` 的 `style` / `class` 实测同时落 `th` 与 `td`）；`header-class` / `body-class` → `headerClass` / `bodyClass`；`frozen` + `align-frozen="right"` → `frozen: 'right'`；条件列 `language` 以同一 `!filters.aggregate` 条件决定是否入 `columns`；`views` 的 `width: 6rem` 两侧镜像 | 上游反馈 §2.2 / §2.7；本批两态探针实测 |
| 同上 | 几何保真三处：搜索字段按参考态实测 **261px** 显式约束（caomei 字段默认 `width: 100%`）；状态选择器 **10rem** 由**包装元素**承载（`class` 只落触发器，上游 §1.1）；`--caomei-data-table-pagination-justify: center` 保持分页居中 | §6.2 执行提示；迁移不改几何 |
| 同上 | 迁移前 `table-style="min-width: 80rem"`（PrimeVue `scrollable` + 冻结列形态）以 `:deep(.caomei-data-table__table)` 保留；翻译徽标按原 `.translation-badge.p-badge` 口径以 `--caomei-badge-{height,min-width,padding-x,font-size}` token 还原（24px / 32px / 4px / 0.7rem） | 通道① token；迁移不改几何 |
| `components/admin/posts/post-media-preview-cell.vue` | 路由自有组件随页迁移（§5.5「路由自有」）：`Button`（`:icon` 二态 `pi pi-play` / `pi pi-times` + `aria-label`）→ `CaomeiButton`（`iconOnly` + `#icon` 内 lucide `Play` / `X` 条件渲染 + `:label`）；`Image`（展示容器）维持 PrimeVue | §5.5 / §6.2 |
| `lib/ui-library.ts` | `CAOMEI_UI_ROUTE_PREFIXES` 登记 `/admin/posts`（第 11 项） | §5.5 |
| `tests/e2e/admin.e2e.test.ts` | 扩展矩阵新增 `/admin/posts` 行（就绪选择器 `.caomei-data-table, .admin-page-container`），与既有首条 `/admin/posts` 页头用例互补 | 层 ② |
| `tests/visual/parity/{routes.ts,parity-budget.json}` | `admin-posts-list` 由 `PENDING_ROUTES` 迁入 `MIGRATED_ROUTES`（`PENDING_ROUTES` 清空并注明「待迁移层已空」）；允许清单按 **3 个非重叠功能带 + 2 个头部区域**校准（见下） | §8.2 层 ③ |
| `pages/admin/posts/index.test.ts`（重写） | **23 条契约用例**：页头两按钮（可见文案 / 未选中不渲染批量导出）、筛选行（`#prefix` lucide `Search` / 6 项状态选择器 + `show-clear`）、`CaomeiSwitch` 的 `id` 与 `label[for]`、12 列稳定顺序 + 条件列 `language` 出现 / 消失 + 动作列 `frozen: 'right'`、列 `class` 两侧镜像、单元格插槽（状态 / 置顶 `tone` 映射、封面 / 播客预览、翻译徽标 `:value` + `tone`、语言 Tag）、动作集合形态与可访问名（含图标分支互斥断言）、跳转 / 导出 / 删除动作、`pageIndexBase: 1` 与受控分页 / 多选 / 每页条数候选、`@page` / `@sort` 原样转发、状态选择器与聚合开关触发刷新、**消费处静态择库（V2 标记）**、审计徽标契约、空态 | §8.2 层 ① |
| `components/admin/posts/post-media-preview-cell.test.ts` | 桩由 `Button` 改为 `CaomeiButton`（按库契约补 `iconOnly` / `label`，不再自造 `ariaLabel` 等不存在形态）；新增**二态图标互斥**断言（`svg.lucide-play` ↔ `svg.lucide-x`）与可访问名翻转断言 | §8.2 层 ① |

### 视觉差异逐项归因（迁移前基线 → 迁移后）

**几何核验**（同一探针脚本、同一视口 1440×900 / DSF1 / zh-CN；迁移前为「改动前的 HEAD 构建」实测，迁移后为当前构建实测）：

| 元素 | 迁移前（PrimeVue） | 迁移后（caomei） | 判定 |
| :--- | :--- | :--- | :--- |
| 搜索字段 | `x88 y204.39 261×36.39` | `x88 y204 261×36` | 宽度**逐值一致**（按参考态实测约束 261px）；高度差 0.39px 属字段行盒口径（上游 §2.5） |
| 聚合开关 | 40×24（`y210.58`） | 40×22（`y211`） | 高度差 2px；标签 `x1092 84×16.09` **两态一致** |
| 状态选择器 | `x1192 160×36.39` | `x1192 160×36` | 宽度由包装元素承载后**逐值一致** |
| 表格宽 | 1674px（13 列） | 1656px（13 列） | **仅选择列 52 → 34px**；其余 12 列宽**逐值一致**（240 / 128 / 112 / 96 / 112 / 224 / 128 / 128 / 70 / 144 / 112 / 128） |
| 表头行高 | 61.78px | 34.5px | PrimeVue 表头文本在 `th` 内换行为两行 vs caomei `white-space: nowrap` |
| 数据行高 | 145px | 125px | 动作列 3 行 icon-only 按钮主导行高（120 → 108px） |
| 分页器 | 内容 `x568.09 w303.8`（中心 x≈720） | `nav x618 w204`（中心 x≈720） | **水平居中两态一致**（token 生效）；垂直随表格总高（263.78 → 204px）上移 47.5px |
| 翻译徽标 | 42.81 / 44.05 × 24（`min-width` 32px / `padding 2px 4px` / `font 11.2px`） | 44.81 / 46.05 × 24（同口径 token 覆盖） | 高度 / 最小宽 / 内边距 / 字号按原口径还原，宽度差异仅来自库侧排版 |
| 头部创建按钮 | `x1262 114×36.39` | `x1274 102×36` | 右边缘（x=1376）与高度对齐；宽度差属按钮排版差异 |

**差异区域（门禁报出，按 3 个非重叠功能带登记）**：

| 功能带 | 浅色 | 深色 | 归因 |
| :--- | :--- | :--- | :--- |
| 筛选行 `y[200,244]` | 2143px | 2221px | `CaomeiInput` / `CaomeiSwitch` / `CaomeiSelect` 外壳与控件高度（字段行盒 36 vs 36.39px、开关 22 vs 24px） |
| 表格区 `y[244,432]` | 17569px | 19488px | 表头行高 61.78 → 34.5px、数据行高 145 → 125px、选择列 52 → 34px 致整表左移 18px，叠加表头 / 行底色与冻结列渲染差异 |
| 分页器与卡片下缘 `y[432,560]` | 1747px | 4313px | 分页器随表格总高上移（居中口径已由 token 保持）+ 卡片下缘位移 60px（暗色下页面底与卡片底对比更强，故像素更高） |
| 头部操作按钮 `x[1240,1400] y[80,160]` | 955px | 986px | `CaomeiButton`（primary 实底 + lucide 图标）vs PrimeVue `Button`（`label` + `pi` 图标） |
| 头部语言切换 `x[160,360] y[80,160]` | 863px | 878px | 跨路由共享壳过渡组件 `ContentLanguageSwitcherV2`（与既有 9 条路由同区域同量级） |

各带声明值 = 该带实测差异像素本身（浅 2143 + 17569 + 1747 + 955 + 863 = 23277px；深 2221 + 19488 + 4313 + 986 + 878 = 27886px，均无带外像素、无余量）。

### 验证结果

- **层 ①（单元）**：`pnpm test` **553 文件通过 / 1 skipped（554 文件），4779 用例通过 / 1 skipped（4780 用例）**（较上一批 **+17 用例**：本页契约用例由 6 条扩为 23 条，媒体预览单元二态断言同量替换；216.7s）；`pnpm typecheck` EXIT 0；`pnpm lint` 0 error（既有 7 条 warning，新增文件零警告）；`pnpm lint:css` 通过。
- **层 ②（E2E 功能）**：管理端定向 `pnpm exec playwright test tests/e2e/admin.e2e.test.ts tests/e2e/admin-workflow.e2e.test.ts --project=chromium` = **8 passed / 11 skipped / 49.3s**（含扩展矩阵新增的 `/admin/posts` 行——矩阵 11 行在本机隔离复跑 30.6s，仍显著低于既有 `test.setTimeout(60000)` 预算；skipped 为既有登录前置跳过，与本批无关）。
- **层 ③（截图识别 · 门禁层）**：本路由浅 **23277px / 1.796%**（允许清单命中 5/5）、深 **27886px / 2.152%**（命中 5/5），未归因 **0px**；全量 `pnpm test:visual:parity` **22/22 通过**（11 个已迁移路由 22 testName；`PENDING_ROUTES` 清空后待迁移层已无用例，且无消费者的 `ALL_PARITY_ROUTES` 兼容导出已随本批删除——待迁移层本身保留，作为 B3 / 条目 3 的落点）。
- **归档**：第八次滚动归档迁出本条目第三批次 4 个窗口（`phase68-b2-ad-placements` / `phase68-transition-shells` / `phase68-b2-subscribers` / `phase68-b2-users`）至 `archive/2026-10-14-to-2026-10-15-phase68-b2-batch3.md`，并**同步改写** `docs/plan/todo.md` 中「过渡组件基建窗口」的节名短语引用（第四次归档后的既定口径：窗口归档与锚点改写一并执行）；`current.md` 由 464 行降至 182 行（归档后中间态，均取 `docs:check:line-count` 口径），写入本窗口后为 **271 行 / 5 个窗口**（`docs:check:line-count` 口径；`wc -l` 为 270）。
- **口径沉淀**：迁移方案 §6.2 新增**执行提示**（字段宽度钩子 / 列定义 / 可见文案三条），闭合第九路由批次登记的「口径写入 §6.2」待办；上游反馈清单新增 **§2.7**（`DataTable` 无列最小宽契约、选择列宽度不可配置、`width` 单位口径）。

### 提交拆分依据（本批规模超 §2.8 单提交阈值的说明）

本批工作树合计 **22 个路径 / 1790 行新增**（`git diff --numstat` 新增列 + 未跟踪文件逐文件计数；含 2 个二进制基线快照，不计行数），超过 [开发规范 §2.8](../../standards/development.md) 的「单提交 ≤10 文件 / ≤800 行新增」，按职责拆为 **3 笔**，每笔均在双阈值内：

| # | 提交主题 | 文件数 | 新增行（逐文件复算） | 依赖顺序 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 治理记录：第八次滚动归档（含「过渡组件基建窗口」锚点改写）+ 第十路由窗口 / 校准记录 / 上游 §2.7 / §6.2 执行提示 / 条目 2 收口 | 8 | 458 | 无 |
| 2 | 页面迁移 + 路由自有组件 + 路由登记 + E2E 矩阵 + parity 台账与待迁移层收口 + 采集脚本退出语义 + 基线层快照刷新 | 10（含 2 个 PNG） | 568 | 无（与 1 互补） |
| 3 | 页面 / 组件 / 事实源契约用例 + 采集脚本守卫 | 4 | 764 | 依赖 2 |

**提交后实测（`git show --numstat` 逐笔复算）**：`pre-commit` 的 `lint-staged` 会把被其覆盖的已暂存文件重新 `git add`，本批因此把 `tests/visual/parity/pending-routes.visual-parity.test.ts`（7 行）由第 2 笔扫入第 1 笔——落库实测为 **第 1 笔 9 文件 / 465 行、第 2 笔 9 文件 / 561 行、第 3 笔 4 文件 / 764 行（合计 22 路径 / 1790 行）**；三笔仍全部满足 ≤10 文件 / ≤800 行，拆分结论不变（同第九路由批次的同类校正）。

拆分依据：① 按「治理记录 / 实现与台账 / 测试」切分；② 治理记录先行——`pre-commit` 的 `lint-md --fix` 会重排 `current.md` 并顺带 stage，先提交含该文档的一批可使后续批次的钩子对其无操作（既有踩坑口径）；③ 契约用例（700 行）独立成笔，确保每笔 ≤800 行。

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- **选择列宽度不可配置**（上游 §2.7）：PrimeVue 52px vs caomei 34px，无 prop / token 可覆盖，使整表左移 18px。本批按「接受 + 登记」处置，不引入魔法数字选择器覆盖；若上游补齐钩子，须重跑本路由 parity 并重校准允许清单（已登记 backlog）。
- **`/admin/posts/[id]` 子路由的被动波及（已显式核对）**：`CAOMEI_UI_ROUTE_PREFIXES` 的登记语义是「前缀**及其子路由**」，故登记 `/admin/posts` 后编辑器路由 `/admin/posts/[id]` 对**路由择库型**过渡组件一律解析为 caomei-ui。本批逐处核对：全仓仅 3 处消费 `lib/ui-library.ts` 的路由择库（`AdminPageHeader` / `AppAvatarV2` / `AppUploaderV2`），而编辑器路由**不使用** `AdminPageHeader`（用自有 `PostEditorHeader`），也不消费 `AppAvatarV2` / `AppUploaderV2`（`post-editor-media-settings.vue` 直接引用 **V1** `AppUploader`），故**当前无被动混用**；三件套过渡组件为「消费处静态择库」（不经事实源），`[id]` 继续用 V1。**风险留存（已登记）**：若后续把 `post-editor-media-settings.vue` 的 `AppUploader` 换成 `AppUploaderV2`，编辑器会顺带切到 caomei 组件——届时须先迁移该路由或在组件内显式排除。
- **基线层刷新**：`tests/visual/__screenshots__` 中 `/admin/posts` 的 2 张基线快照（浅 / 深）为 M2 时期采集的**迁移前 PrimeVue 原貌**，本批按既有口径用 `pnpm test:visual:update` 刷新为迁移后现状（`pnpm test:visual` 随后 14/14 通过）；门禁层参考态（`tests/visual/parity/reference/`）**未受影响、未重采**（两者目录与用途互不覆盖）。
- **固定 `pause` 之外的同步风险**：本路由 parity 用例未新增 `readyResponse` / `readySelector`（沿用迁移前口径）——首屏数据为种子 1 篇文章且已稳定（迁移前后各 3 次复跑实测 0px 漂移）。若后续种子数据变化导致行数波动，须按 `/admin/users` 的口径补 `readyResponse: '/api/posts'` + `readySelector`。
- **数据行渲染已纳入门禁（本条目首次）**：与 `/admin/users` 同型，本路由参考态**含数据行**（种子 1 篇），故 `Tag` / `Badge` / 行内按钮的渲染**在门禁覆盖内**——这正是第九路由窗口登记的「建议为含状态标签的列表路由补行级断言」在本路由的自然落地（门禁 + 页面契约用例双覆盖）。
- **幻影类收尾**：列上的 `class="hidden sm|md|lg:table-cell"` 在本仓**无任何可命中表格单元格的样式规则**（全仓 SCSS 与构建产物均无 `table-cell` 定义；`components/app-uploader.scss` 内的 `.hidden` 是 `.app-uploader` 下的 scoped 嵌套规则，不命中表格 `th` / `td`；实测列宽差异为 0）。按批次口径「保留原声明、不静默丢弃既有意图」两侧镜像为 `headerClass` / `bodyClass`，并保持为迁移期幻影类收尾项（与 `p-fluid` / `*__dialog` 同批清理，见 backlog）。
- **受控分页的语义边界（与既有 5 条已迁移路由同型）**：迁移前 PrimeVue 未绑定 `v-model:first`（组件自持页码），本页改为受控 `:page`，使「筛选后回到第 1 页」由 `page` 状态统一驱动；代价是 caomei 的 `watch([rows, totalRecords])` 在受控下提前返回，**不再有「总条数收缩时自动夹取页码」的内部收敛**——极端场景（删除末页最后一条后 `page` 越过末页）下分页器会停在越界页。本批按「迁移不改流程」处置并在此登记，未追加行为改动。
- **图标字体残留（非在册族）**：`post-media-preview-cell.vue` 的两处空态图标仍为 `pi pi-image` / `pi pi-headphones`（`pi` 图标不在批次在册族，本条目非目标亦含「不做图标全量替换」）——B4 卸载 PrimeVue 前须随图标批次一并替换（已在本窗口登记）。
- **共享 helper 未改写的理由已落注释**：`getPostStatusSeverity` 的词表转换放在页面本地（而非 helper），避免波及 `/admin/posts/[id]` 与其单测；待编辑器路由迁移时再统一口径。
- **单测覆盖的剩余缺口（审计建议项，未在本批补齐）**：`confirmRepush` → `PublishPushDialogV2.open` 的载荷、`handleRepushConfirm` 的 `$fetch` 与成功 / 失败分支、`handleDelete` 的 `$fetch → close → load` 链路、`runAudit` / `handleReAudit` 的请求与结果写回，以及 `handleExport` 在聚合关闭时的 `all: false` 分支——均属既有逻辑的旁路（本批未改动其实现），登记为后续测试补强候选；本批已补的是**新迁移引入**的两处高风险盲区（状态 tone 六态、路由登记加钉）与批量导出的正向对照。
- **审计期内的收口（A 阶段三轮分区审计结论 → 修复）**：① 实现分区 `Pass`（1 warning + 8 suggest）——已按 warning 补 `lib/ui-library.ts` 的子路由例外与可达性核对结论，并修 4 条注释归因（幻影类口径 / 徽标 24px 来源 / `warn` 词表 / `:exportable="false"` 惰性），顺带删除本文件既有的两处死代码（未使用的 `useToast` 导入与 `isTranslationPublished`）；② 测试分区 `Pass`（2 warning + 7 suggest）——两个**存活 mutant** 已补测：状态 `tone` 六态逐档断言（原仅覆盖 2 态）与 `CAOMEI_UI_ROUTE_PREFIXES` 对本批登记项的显式加钉（原删条目不报错）；另补批量导出的正向对照与 `handleBatchExport` 的 id 展开断言，改锚点由 `/admin/settings`（待迁移路由）改为结构性不会登记的 `/settings`；③ 台账/文档分区 `Reject`（2 blocker + 2 warning + 7 suggest）——已修治理表脱离表格（空行断开）、提交拆分表数字重锚、中间态行数口径、迁出空行残留；并针对「参考态齐备后 HEAD 全量采集硬失败」在就地采集块补 `--pass-with-no-tests`（含静态守卫用例），删除无消费者的 `ALL_PARITY_ROUTES` 导出，更新待迁移层文件头语义与处置表列头日期口径。

<!-- regression-window:end:phase68-b2-posts:第六十八阶段-条目2-第十路由:2026-10-16 -->

<!-- regression-window:start:phase68-caomei-drift-060:第六十八阶段-caomei漂移收口:2026-10-13 -->
## 2026-10-13 第六十八阶段 caomei-ui 0.3.0 → 0.6.0 版本漂移收口

### 范围

条目 1 于 2026-09-26 完成 `caomei-ui@0.3.0` 升级与基线复测后，`caomei-ui` 又经两次 Dependabot 单包升级静默抬版到 `0.6.0`（`53d1dc21` 0.3.0→0.5.0，2026-10-06；`823517f5` 0.5.0→0.6.0，2026-10-11），两次提交只改 `package.json` / `pnpm-lock.yaml`，未按迁移方案 §5.6「0.x 不得静默升级，每次升级须先读目标版本 `BREAKING CHANGES` 并重跑该批回归」留任何复测与记录，规划 / 设计文档也仍停在 `0.3.0` 口径。本批补做升级纪律要求的全部动作：补读 `0.4.0` / `0.5.0` / `0.6.0` 的 `BREAKING CHANGES` 与影响面、按 `0.6.0` 重数组件清单、重跑三层视觉回归与包体预算、同步受影响文档。对应 [todo.md](../../plan/todo.md) 第六十八阶段条目 1 的补记。

### BREAKING CHANGES 阅读结论（升级纪律）

- 三个版本（`0.4.0` 2026-09-29 / `0.5.0` 2026-09-30 / `0.6.0` 2026-10-08）`CHANGELOG` **均无 `BREAKING CHANGES` 段落**；`0.2.0` 的 `styles.css → theme.css` 仍是迁移期内唯一破坏性包形态变更（M1b 已处理）。
- exports 面（`.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json`）与 `0.3.0` 一致，不需重定样式入口或 `injectStyles` 唯一性口径。
- 主题 token **取值未变**：`src/styles/theme.css` 的 `v0.3.0 → v0.6.0` 差异只有选择器由 `:root` 扩写为 `:root, [data-preset='minimal']` 与相应注释（把既有默认预设正式命名为「极简」），无任何 token 值增删改；`presets/caomei.css` / `presets/momei.css` 未变。故缺省渲染与 `0.3.0` 逐值一致，momei 侧「不启用 `data-preset='momei'`」的既有决策不受影响。
- 基础层**字节级变化**：`theme.css` 落点新增 `@import './field-shell.css'`（库侧 0.4.0「抽离字段外壳共享样式层并迁移 4 组件」），基础层由 5,880 B / gzip 1,089 B 增至 9,492 B / gzip 1,719 B。基础层是 `keyCss` 里**唯一的 caomei-ui 贡献来源**，故 `keyCss` 的增量可归因到它。
- 其余变更面（0.4.0：Button `iconOnly`、DataTable 分页对齐 token、Select `#value` 触发器插槽、soft 变体底色 8%、字段外壳共享层；0.5.0：`CaomeiRichTextEditor` 新组件、浮层 z-index 语义门禁、模态内浮层层级修正；0.6.0：DataTable 排序指示条常驻占位、组件背景色与阴影更新、Tabs 与 a11y 修正）均为库侧能力增强与缺陷修正，**momei 当前消费面零命中**，不产生迁移动作。

### 组件清单（0.6.0 口径重数）

自动导入组件 **81 项**（`0.3.0` 的 80 项 + `0.5.0` 新增 `CaomeiRichTextEditor`；按库侧 `src/nuxt/components.ts` 在 `v0.3.0` / `v0.6.0` 标签逐项对账，唯一差集即该组件）。`CaomeiRichTextEditor` momei 零用量；试点页消费清单仍为 5 族 / 8 处（`CaomeiButton` ×3、`CaomeiSelect` ×2、`CaomeiTag` ×1、`CaomeiInput` ×1、`CaomeiDataTable` ×1），与 `0.3.0` 批一致。

### 上游反馈缺口闭合（0.4.0 交付）

`0.4.0` 交付的三项能力正好闭合 [上游反馈清单](../../design/governance/2026-09-25-caomei-ui-upstream-feedback.md) 中标为「真实缺口」的 1.3 / 1.4 / 1.5，并在 `0.6.0` 产物中实测存在：Button `iconOnly`（`dist/components/button/types.d.ts` 有 `iconOnly?: boolean`）、DataTable `--caomei-data-table-pagination-justify` token、Select 触发器 `#value` 插槽。**对 B2 的影响**：原需在多个列表页重复的「行内图标按钮本地类」与「分页对齐选择器覆盖」补丁不再必需，B2 剩余页可直接用库侧原生能力；`Select` 触发器插槽也解除了语言切换器一类的等价迁移限制。B2 各批「文件 → 改动点」清单应改按 `0.6.0` 能力口径引用（见迁移方案 §5.5 / §6）。

### 包体复测与归因

- **本批实测**（`pnpm test:perf:budget`）：`keyCss` **61,311 B**（59.87KB / 70KB 配额）、`coreEntryJs` 343,968 B（335.91KB / 360KB）、`maxAsyncChunkJs` 50,346 B（49.17KB / 130KB）、`prIncrementJs` 6,960 B（6.80KB / 20KB），**全项不越线**。
- **可归因到 caomei-ui 的部分（字节级对照）**：基础层 5,880 B / gzip 1,089 B → 9,492 B / gzip 1,719 B（+3,612 B 原始 / **+630 B gzip**，全部来自新增 `field-shell.css`），对应 `keyCss` 实测 60,896 B → 61,311 B（**+415 B**）。同口径（gzip）对照下基础层 +630 B 对 `keyCss` +415 B，差 215 B 为与入口既有 CSS 合并压缩的收益。
- **基线状态（显式记录，避免误读为已对齐）**：`.github/perf/bundle-baseline.json` 保持 0.3.0 批次口径不变，其参考值已低于当前实测（`keyCssGzipBytes` 60,896 vs 61,311；`coreEntryJsGzipBytes` 337,008 vs 343,968），本批**不刷新基线**。
- **归因边界（未做逐提交字节对照，不写结论）**：`coreEntryJs` 相对 0.3.0 批次基线（2026-09-26 刷新）的 +6,960 B 与 `maxAsyncChunkJs` 的 +1,199 B **不落在 caomei-ui**（其 JS 产物未变，新增的 `CaomeiRichTextEditor` momei 零消费），系 0.3.0 批次之后的其他依赖变更（nuxt 4.5.2→4.6.1、`@sentry/nuxt` 10→11 等）的累计差；本批不做进一步归因，`.github/perf/bundle-baseline.json` 保持 0.3.0 批次口径不变，是否重取基线交由 B2 各批或 B4 决定。

### 验证结果

- **层 ①（单元）**：`tests/modules/ui-library-route-migration-guard.test.ts` 3/3 通过（在册族零残留守卫在 `0.6.0` 组件清单下仍成立）。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10 通过**（列表 / 表单 / 浮层 / token 桥接，浅深双主题），**零像素差异**——`0.6.0` 对既有基线零影响，无需逐项归因（与上条「基础层只新增字段外壳变量与类，且语义 token 由 momei 桥接覆盖」一致）。
- **层 ②（E2E 功能）**：复用当前 `master`（`39e00f21`，即 `0.6.0` 状态）的 CI `Test` 全 job 证据——`E2E (1/4~4/4)` / `Unit` / `Coverage` / `Build & Lighthouse` 均 success；本批未重跑 E2E。
- **质量门**：`pnpm typecheck` 通过；`pnpm test:perf:budget` 全项不越线。

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- **治理缺口（本批触发原因）**：`caomei-ui` 作为精确锁定的迁移在飞依赖，仍被 Dependabot 单包升级路径抬版；在 `0.x` 不承诺语义兼容的前提下，该路径缺少「升级须读 `BREAKING CHANGES` + 重跑该批回归」的强制拦截。已在迁移方案 §5.6 补记「迁移收尾前须为 `caomei-ui` 配置 Dependabot `ignore` 或改走人工升级」，避免再次静默漂移。
- **本批为纯文档收口，无代码 / 依赖改动**：`package.json` 的 `caomei-ui: 0.6.0` 与锁文件已是现状，文档口径对齐即完成。
- `major` 级 Dependabot 升级（PR #745 `markdown-it 15` / #748 `better-auth 1.7`）与 `master` 上 `Publish Docker Image` 的 build 红灯不在本批范围，另行处理。
- **滚动归档逾期（本批新增观察项）**：本文件已约 675 行 / 20 个窗口，超过 [index.md](./index.md) §3.1 的「300-400 行或 6-8 条记录即须先滚动归档」阈值。按 [backlog.md](../../plan/backlog.md)「滚动归档由回归层在阶段收口时统一触发」，本批属阶段中途收口、**不触发归档**，登记为第六十八阶段收口必办项。另：`index.md` §3.1 的行数阈值（300-400）与 `docs:check:line-count`（warn>500 / error>700）不一致，建议一并校准（推荐以 `backlog.md` 的 500-700 / 700+ 为单点口径、`index.md` 改为指针引用），避免两套口径长期并存。
- **审计提示的归因边界**：`0.6.0` 的「组件背景色与阴影更新」属全局样式面，本批以 10 条视觉基线零差异佐证「当前消费面零命中」；若某已消费组件的变体未被这 10 条基线覆盖，细微波级变化存在漏检可能（观察项，交由 B2 逐页回归覆盖）。

<!-- regression-window:end:phase68-caomei-drift-060:第六十八阶段-caomei漂移收口:2026-10-13 -->

<!-- regression-window:start:phase68-item1-upgrade-030:第六十八阶段-条目1:2026-09-26 -->
## 2026-09-26 第六十八阶段 条目 1 caomei-ui 升级到 0.3.0 与基线复测

### 范围

`caomei-ui` `0.2.0` → `0.3.0` 精确锁定升级（不加 `^`、无 `file:` 形态）；升级前读 `CHANGELOG` 确认 `BREAKING CHANGES`；重跑视觉回归与定向测试；`keyCss` 重测与 `.github/perf/bundle-baseline.json` 刷新；「零 caomei 组件消费」口径澄清；组件消费清单按 `0.3.0` 口径重数。对应 [todo.md](../../plan/todo.md) 第六十八阶段条目 1。

### BREAKING CHANGES 阅读结论（升级纪律）

`0.3.0`（2026-09-24 发布）`CHANGELOG`（[GitHub `master/CHANGELOG.md`](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/CHANGELOG.md)，npm tarball 内不含 changelog，经 `npm view` / tarball 列表核实）无 `BREAKING CHANGES` 段落（唯一破坏性变更为 `0.2.0` 的 `styles.css → theme.css`，已在 M1b 处理）。变更面：DataTable 能力增强（可折叠分组 / 多列排序与降序优先 / 行展开 / 行分组）、新增 `TagsInput` 组件、docs 面 6 项。exports 面（`.` / `./nuxt` / `./resolver` / `./theme.css` / `./package.json`）与 `sideEffects` 与 `0.2.0` 一致。**关注点**：DataTable 排序语义变化可能影响消费页，故定向回归以试点页（消费 `CaomeiDataTable`）为重点。

### 升级记录

- `package.json` / `pnpm-lock.yaml` 精确锁定 `caomei-ui@0.3.0`，lockfile diff 仅该包（无无关 churn）。
- `caomei-ui/nuxt` 的 `theme.css` 注入点保持唯一（§5.7 约束 3 继续成立）。

### keyCss 复测与口径澄清（包体归因）

- **本批实测**（`pnpm test:perf:budget`）：`keyCss` **60,896 字节**（59.47KB / 70KB 配额）；`coreEntryJs` 337,008；`maxAsyncChunkJs` 49,147。全部不越线。
- **口径澄清（原「零消费」前提修正）**：「momei 零 caomei 组件消费故组件样式零进入产物」仅成立于 0.2.0 重锚时点。组件样式**随消费方 chunk 归属**——当前消费面（B2 试点 5 族）的组件样式落在路由 chunk（`comments.*.css` 含 `caomei-badge` 等组件类），入口 `entry.*.css` 仅含基础层（`.caomei-root` ×1、`--caomei-*` token ×167；在册组件类 `caomei-button` / `caomei-data-table` / `caomei-tag` / `caomei-badge` / `caomei-avatar` / `caomei-toggle` / `caomei-paginator` 零命中，`caomei-select` / `caomei-input` / `caomei-skeleton` 的命中均为 `--caomei-*` token 名如 `--caomei-select-max-width`）。若入口 / 全局壳消费组件，其样式将计入 `keyCss`。
- **归因更正（审计 RG-B1）**：`0.2.0` 与 `0.3.0` 的基础层字节级一致（`dist/styles/index.css` 同 sha256，5,880 B / gzip 1,089 B），**0.3.0 升级对三项包体指标贡献 0**；且 M4 期（仍锁 0.2.0）记录已为 59.47KB / 329.11KB / 48.00KB，与本批实测一致。较 M1b 期（2026-09-24）基线 60,684 / 336,333 / 49,055 的 **+212 / +675 / +92 系相对 M1b 期的累计差**（入口 CSS 侧净增量，主因 M3 `html:root` token 桥接块），**非 0.3.0 单批增量**。`.github/perf/bundle-baseline.json` 指标与 `note` 已按该口径刷新；`docs/standards/performance.md` 与迁移方案 §8.4.1 的「口径待复测」同步闭环。

### 组件消费清单（0.3.0 口径重数）

B2 试点页 5 族 / 8 处，与升级前一致：`CaomeiButton` ×3、`CaomeiSelect` ×2、`CaomeiTag` ×1、`CaomeiInput` ×1、`CaomeiDataTable` ×1。`0.3.0` 新增 `TagsInput` **零用量**；DataTable 新能力（`expandableRows` / `rowGroup` / `multiSort`）零用量。上游组件清单按 `0.3.0` 重数为 80 项（79 + `TagsInput`），迁移方案 §5.1 已同步。

### 验证结果

- **层 ①（单元）**：路由迁移守卫 + `lib/ui-library` + 试点页单测 **25/25**；批次收尾全量 `pnpm test` **4497 通过 / 533 文件**（1 skip 为既有）。
- **层 ②（E2E 功能）**：试点页定向 `tests/e2e/admin.e2e.test.ts` chromium **7/7**（含 `/admin/comments` + `.caomei-data-table` 断言）。全量 E2E 抽查出现 `installation` / `posts` / `public-pages` / `seo-regression` 30s 超时，**隔离复跑 17 通过 / 1 flaky（`/archives` retry 过）/ 1 失败**，判定为负载超时；唯一稳定失败 `seo-regression` 文章详情 SEO 用例已**逐请求归因**：挂起资源为作者头像外链 `https://0.gravatar.com/avatar/…`（沙箱不可达拖死 `load` 事件，页面 DOM 完整渲染、该页零 caomei 消费），属**环境固有 flaky，非本批回归**（对照 M4 的 flaky 判定口径）。处置：不扩修测试代码（C 类），登记为已知环境 flaky。
- **层 ③（截图识别）**：`pnpm test:visual` **10/10 通过**（列表 / 表单 / 浮层 / token 桥接，浅深双主题），无像素差异——0.3.0 对既有基线零影响，无需归因。
- **质量门**：`pnpm typecheck` 通过；`pnpm lint` 0 error（3 条既有 warning 在 `packages/cli`，不在本次面）；`pnpm test:perf:budget` 全项不越线。

### 提交拆分依据（本批规模超开发规范 §2.8 单提交阈值的说明）

本批工作树规模 **23 个已改 / 新增文件、约 1300 行新增**（另含 6 张二进制快照），超 [开发规范](../../standards/development.md) §2.8 的「单次 commit ≤10 文件 / 800 行新增」阈值，故按「一个原子条目的六段产出」拆分提交（每笔均 ≤10 文件且 ≤800 行新增）：

| 序号 | 提交 | 内容 | 实测落库规模 |
| :--- | :--- | :--- | :--- |
| 1 | `6bcad295` `feat(migration)` | 实现 + 事实源扩面（`admin-taxonomy-page.vue` / `taxonomy-translation-association-card.vue` / `lib/ui-library.ts`） | 4 文件 / 745 行新增（含被 lint-staged 扫入的门禁预算，见下） |
| 2 | `6dc7ff6c` `test(migration)` | 结构性守卫扩面 + 共享组件桩与夹具 | 2 文件 / 551 行新增 |
| 3 | `f0e2c6d7` `test(migration)` | 契约用例（组件 / 子组件 / 两个 host 页面）+ 管理端 E2E 矩阵 | 5 文件 / 423 行新增 |
| 4 | `dbf177f3` `test(visual)` | 门禁层路由登记 + 4 张迁移前参考态 + 元数据 | 7 文件（含 4 张二进制快照） |
| 5 | `ece4a8fc` `test(visual)` | 基线层弹窗用例 + 2 张基线快照 | 3 文件（含 2 张二进制快照） |
| 6 | 本笔 `docs(migration)` | 治理记录（回归窗口 / §5.5 / 偏差处置表 / backlog / todo） | 5 文件 |

**规模口径说明**：`lint-staged` 的 `git add` 会把当时未暂存的门禁预算改动一并 stage，故 `tests/visual/parity-budget.json`（208 行新增）实测落在**第 1 笔**而非第 4 笔——此处按**实测落库**记录，不按计划口径回填（与第十路由批次「提交拆分表按实测重锚」同口径）。

### 未覆盖边界 / 观察项

- 全量 E2E 三浏览器矩阵未完整重跑（迁移方案 §8.1 不要求每批全量）；gravatar 外链拖死 `load` 的环境 flaky 已登记，若后续阻塞可考虑测试侧拦截外链头像（属测试有效性主线候选，不进本批）。
- DataTable 多列排序 / 行分组等新能力零用量，其行为差异清单待 B2 剩余页用到时再核对。

<!-- regression-window:end:phase68-item1-upgrade-030:第六十八阶段-条目1:2026-09-26 -->

