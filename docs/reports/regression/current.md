# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:phase69-caomei-ui-rc1:caomei-ui 1.0.0-rc.1 升级与 token 角色接线:2026-11-01 -->
## 2026-11-01 第六十九阶段条目 1 caomei-ui 1.0.0-rc.1 升级与 token 角色接线

### 范围

- 将 `caomei-ui` 由精确锁定 `0.7.0` 升级到 `1.0.0-rc.1`（2026-10-30 发布，`dist-tags.next`），按迁移方案 §3.10 / §5.6 的升级纪律执行。
- 桥接补齐 rc.1 新增的 6 个 token 角色：`--caomei-color-{primary,success,warning,danger,neutral}-text` 与 `--caomei-color-control-border`（后者**有意不桥接**）。
- `.github/dependabot.yml` 为 `caomei-ui` 增加 `ignore`（`>=1.0.0-rc.2`），并新增 `tests/modules/caomei-ui-version-pin.test.ts` 把「人工升级」落到 CI。
- 不含：B3 表单与设置、浮层族迁移、`registerLocale` 接线（后续条目）。

### BREAKING CHANGES 与影响判定

- `CHANGELOG` 的 `1.0.0-rc.1` 段**无 BREAKING CHANGES**；`npm pack` 逐项对比确认 exports / `dependencies` / `dist/nuxt.js` / `dist/nuxt/components.js`（95 项）与 0.7.0 **逐字一致**；`engines` 由 `>=20` 升到 `>=22`（本仓 `24.x`、CI `lts/*`）。
- 但**不是零视觉差异批次**：`-text` 角色改变状态文字色，`control-border` 改变控件边框色（Button secondary / outline、Input / Select 等）。这决定了本批必须重采基线而不是「复跑即绿」。
- 基础层 `dist/styles/index.css` 9,492 B → 20,595 B（gzip -9 1,683 → 2,824 B），增量来自 `forest` / `ink` / `sakura` 三套新预设与 6 个新角色。

### 实现落点

- `styles/main.scss`：`html:root` 补 5 个 `-text`——`primary` / `danger` 取运行时 `--p-primary-700` / `--p-red-700`；`success` / `warning` 取 `var(--p-green-800)` / `var(--p-orange-800)`（该原始色板由 PrimeVue 运行期以 `@layer primevue` 内联注入，静态产物中**无定义**、只有桥接处的 `var()` 引用，故不能 grep 产物断言其不存在）；`neutral` 取「文本色 85% + 卡片色」，**不得**复用 tone（`--p-text-muted-color`），否则 tone == text、8% 底对比度仅约 4.26。
- `html:root.dark` 后排块把 4 个状态角色切到 `-400`；`neutral` 为派生值，随文本色自动适应，无需覆盖。
- `--caomei-color-control-border` 有意不桥接（上游 3:1 默认：浅 `#8a8b8d` / 深 `#67676a`）。
- `success` / `warning` 浅色取 `-800`（`#166534` / `#9a3412`）：`-700` 在 `bg-elevated` 上仅 4.34 / 4.44；该原始色板由 PrimeVue 运行期注入（不在 `.output/public` 静态 CSS 中，grep 产物无法断言其不存在）。
- 契约测试 `tests/visual/caomei-token-bridge.visual.test.ts`：新增模式感知断言、neutral「与 tone 分离」断言、`control-border` 默认值断言，以及 **5 角色 × 2 承载面 × 明暗的对比度契约（≥4.5）**。
- `tests/modules/caomei-ui-version-pin.test.ts`：声明值必须精确、lockfile 解析唯一且一致、版本必须在人工批准清单内（机器人抬版即使绕过 Dependabot 也会在 CI 失败）。

### 验证结果

- `pnpm typecheck` 0 error；`pnpm lint` 0 error（仅既有 warning）；`pnpm lint:css` 通过。
- 基线层 `pnpm test:visual` **18/18**（14 条截图 + 2 条桥接契约 + 2 条新增对比度契约）；基线更新 10 张 = 5 个已迁移路由 × 2 主题，2 个未迁移页（设置表单 / 协议弹窗）**零差异**。
  - 逐张差异（升级前基线 → 升级后基线，**阈值 0 的逐像素口径**）：comments L/D 1,720（0.133%）；external-links L/D 656（0.051%）；posts L 2,930 / D 2,941（0.226%，含状态标签文字变深）；submissions L/D 1,344（0.104%）；taxonomy-dialog L 3,840 / D 3,836（**1.129%**，浮层弹窗内控件密度最高）。线性占比 0.80–0.99（线状边框 / 文字描边，无整块位移）。
- 门禁层 `pnpm test:visual:parity` **34/34**；因 `control-border` 让控件边框整体变深，**33/34 条**的带内差异变化（仅 `admin-marketing-overview-dark` 未变；28 条超出 225px 噪声带），已按同一次运行的实测值**全量重校准**允许清单（声明值 = 实测，无余量），并消除 `admin-users-list-light` 区域 0 / 1 的几何重叠（重叠会让扣减额度重复计算）。重校准后复跑残差 ≤ 225px（占比 0.017%，运行间渲染噪声），预算 3,000px。
  - 归因探针（临时用例，验证后删除；逐项还原 token 后重截）：`admin-link-governance` 控件边界贡献 8,187 / 8,190px、状态文字 0（该页无标签入画）；`admin-ai-tasks-list` 控件边界 3,416px、状态文字 251 / 259px。
- 包体 `pnpm test:perf:budget:strict` 通过：`keyCss` **62,382 B（60.92KiB）/ 70KB**——较 0.7.0 批次（61,276 B）**+1,106 B**、较 0.6.0 批次（61,311 B）+1,071 B，落在预判 +750 ~ 1,141 B 区间；`coreEntryJs` 341,231 B / 360KB；`maxAsyncChunkJs` 55,914 B / 130KB；`prIncrementJs` 4,223 B / 20KB。
- 对比度契约（soft 8% 底；`--caomei-color-bg` / `--caomei-color-bg-elevated`）：

  | 角色 | light（内容面 / 次级面） | dark（内容面 / 次级面） |
  | :--- | :--- | :--- |
  | primary | 8.72 / 8.08 | 8.21 / 7.44 |
  | success | 6.66 / 6.17 | 9.75 / 8.85 |
  | warning | 6.74 / 6.24 | 7.68 / 6.99 |
  | danger | 5.83 / 5.40 | 6.43 / 5.88 |
  | neutral | 10.36 / 9.60 | 11.38 / 10.34 |

  全部 ≥ 4.5，闭合 backlog 短期候选 #12（原 2.12 / 2.59 / 3.39；neutral 若复用 tone 仅约 4.26，已通过「与 tone 分离」的派生取值消除）。矩阵按 tag / badge 的 8% soft 底建模，`CaomeiMessage` 默认 4% 混合更严。
- 定向单测 **70/70**（`caomei-ui-coexistence` + 路由迁移守卫 + 过渡组件守卫 + 新增版本锁定守卫）。

### 未覆盖边界

- 未跑全量 `pnpm test` 与 E2E：本批只改 CSS、依赖版本与契约 / 守卫测试，全量在阶段收口统一跑。
- **`DataTable` 两处上游修复（横向滚动键盘可达、全选作用域与 `lazy` 页内状态）未做运行时行为回归**：现有 15 条已迁移路由的排序 / 分页 / 选择行为未变（视觉与 parity 均无结构性差异），但键盘可达性与全选语义缺一次显式 E2E；已转第七十一阶段的全量 E2E 收口，登记为未覆盖边界。
- `coreEntryJs`（341,231 B）相对 0.3.0 基线口径（337,008 B）+4,223 B **未逐项归因**；`prIncrementJs` 4,223 B 即该差值的门禁口径。已核对 rc.1 的组件 JS 仅 `data-table` +883 B（路由 chunk），与入口增量无直接关系。
- 三套新设计预设（`forest` / `ink` / `sakura`）无条件进入基础层（约 +1.1KB gzip 的主体），**尚未登记**到上游反馈清单，列为候选。
<!-- regression-window:end:phase69-caomei-ui-rc1:caomei-ui 1.0.0-rc.1 升级与 token 角色接线:2026-11-01 -->

<!-- regression-window:start:maintenance-caomei-ui-070:caomei-ui 0.7.0 升级与既有 parity 漂移复核:2026-10-24 -->
## 2026-10-24 维护批次 caomei-ui 0.7.0 升级与既有 parity 漂移复核

### 范围

- 将 `caomei-ui` 由精确锁定 `0.6.0` 升级到 `0.7.0`（2026-10-20 发布），按迁移方案 §5.6「在飞依赖每次升版须读 `BREAKING CHANGES` + 复测」执行。
- 不含 locale 接线（`CaomeiConfigProvider` / `registerLocale`）：那是功能变更，登记为第六十九阶段切片。

### BREAKING CHANGES 与影响

- 唯一 BREAKING 为 **locale 内建语言改为「预注册 + 按需子路径」**：包根只保留 `zh-CN` / `en-US`，其余语种须 `caomei-ui/locale/<code>` + `registerLocale()`，未注册回落 `zh-CN`。
- 影响判定：momei 当前**未调用** `provideLocale` / `CaomeiConfigProvider`，组件内建文案本就回落 `zh-CN` → 本次升级**不产生行为变化**；接线时须注册在用的 `zh-TW` / `ja-JP` / `ko-KR`。
- 其余面：exports 仅新增 locale 子路径；运行时依赖版本（`reka-ui@2.10.4` / `vue-table@9.2.4` / `@internationalized/date@3.12.4` / `@vavt/cm-extension@2.0.0`）与既有解析一致；新增 `echarts` / `vue-echarts` 为 optional peer；基础层 `dist/styles/index.css` 与 0.6.0 **sha256 相同**（9,492 B）；已消费的 13 个组件族（button / select / auto-complete / data-table / tag / badge / switch / checkbox / textarea / input / input-group / avatar / tabs）运行时 JS/CSS 零变化（仅 `.d.ts` 差异；`FileUpload` 为 PrimeVue 侧用法，caomei 侧零用量）；自动导入组件 81 → **95** 项（+Alert / Chart / Tooltip 族 / Menu 族 / Breadcrumb 族 / Row / Col）。

### 验证结果

- `pnpm typecheck` 0 error；`pnpm lint` 0 error（8 条 warning 均为既有）；`pnpm lint:css` 通过。
- 定向单测：`tests/modules/ui-library-route-migration-guard.test.ts` + `components/admin/admin-taxonomy-page.test.ts` + `pages/admin/posts/index.test.ts` → **87 passed**。
- 全量单测：`pnpm test` → **567 files passed / 1 skipped（568）**、**5029 passed / 1 skipped（5030）**，exit 0（依赖升级后补跑，替代仅定向的兜底）。
- 基线层视觉回归：`pnpm test:visual` **16/16**（零差异）。
- 门禁层 parity：`pnpm test:visual:parity` **33/34**；失败项 `admin-marketing-form-dialog-light`（实测 128,174px / 9.89%，允许清单扣减后未归因 114,174px / 8.81%）。
- 包体：`pnpm test:perf:budget:strict` 通过 —— `keyCss` **59.84KB / 70KB**（未反弹，与 0.6.0 实测 61,311 B 同量级）、`coreEntryJs` 331.71KB / 360KB、`maxAsyncChunkJs` 54.59KB / 130KB、`prIncrementJs` 2.60KB / 20KB。
- 锁文件：仅 `caomei-ui` 一条包记录变更（`pnpm install --frozen-lockfile` 通过）；安装时顺带被重解析的 `legacy-javascript 0.0.3→0.0.4`（lighthouse 传递依赖，与本次无关）已手工还原，避免无关 churn。

### 既有 parity 漂移复核（非本批引入）

- 现象：light 参考态中弹窗宽 680px（380–1060），当前渲染 543px（448–991），遮罩与其余元素一致，差异集中在弹窗左右边缘与表单文本换行。
- 证伪：临时回装 `caomei-ui@0.6.0` 复跑同一用例，得到**完全相同**的 `128,174px / 9.89%`（扣减后 `114,174px / 8.81%`）与同一组超差区域 → 与 0.7.0 无关，属参考态采集（2026-10-16）后发生的漂移。两次复跑的报告已本地留档对照（`artifacts/review-gate/2026-10-24-caomei-ui-070-parity-{060,070}-marketing-dialog-light.json`；`artifacts/` 按仓库约定不入库）：两者 `diffPixels=128174` / `remaining=114174` 完全一致。
- 处置：不在本批「修绿」，避免用重采参考态掩盖未归因差异；登记 backlog 长期主线 #10 待跟踪（重采参考态 + 逐项归因）。

### 未覆盖边界 / 观察项

- 未重跑 `test:coverage`（依赖升级不改变覆盖口径；覆盖率基线沿用 2026-10-22 记录）。
- E2E 未重跑（本批无业务代码改动；`pnpm build` 成功）。
- `Message` / `ButtonGroup` / `RichTextEditor` 的样式哈希变化属库侧重建噪声，momei 零消费，未纳入验证面。
<!-- regression-window:end:maintenance-caomei-ui-070:caomei-ui 0.7.0 升级与既有 parity 漂移复核:2026-10-24 -->


