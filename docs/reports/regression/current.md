# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。


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

