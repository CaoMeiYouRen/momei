# 路线图深度归档：第六十九阶段

> 本文件承接 `docs/plan/roadmap.md` 主窗口迁出的第六十九阶段完整正文（迁出时点：2026-11-03，阶段归档）。
> 正文保持立项与执行期原样，仅标题状态由「进行中」改为「已审计归档」，并把正文相对链接深度按迁入子目录补一级；阶段收口结论见 [roadmap.md](../roadmap.md) 的「第六十九阶段归档结论」与 [待办事项归档](../todo-archive.md) 的第六十九阶段归档块。
> 归档规则见 [深度归档治理索引](./index.md)。

---

### 第六十九阶段：PrimeVue → caomei-ui 迁移（三）——1.0.0-rc.1 升级与 token 角色接线、浮层族整迁、内建文案 locale 接线（Phase 69: caomei-ui 1.0.0-rc.1 Upgrade & Token Roles, Overlay Families, Built-in Locale Wiring）（已审计归档）


**时间表**: 2026-11-01 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 承接 backlog 长期主线第 10 条的第三阶段切片，并纳入用户 2026-11-01 提出的「`caomei-ui` 须更新到 `1.0.0-rc.1` 及以上」硬要求：① 完成 `0.7.0 → 1.0.0-rc.1` 升级，并把 rc.1 新增的 6 个 token 角色接入并存桥接（同批闭合短期候选 #12 的状态色对比度缺口）；② 把浮层族（Dialog / Drawer / Popover / DropdownMenu / Menu / ConfirmDialog / `useConfirm` / `useToast` / `v-tooltip`）整体迁到 caomei-ui，清除「浮层显式豁免」这一长期并行来源；③ 接入 `CaomeiConfigProvider` + `registerLocale`，让后台内建文案跟随应用语言（`0.7.0` 起的 locale 子路径约束）。B3 表单与设置整体下移第七十阶段，B4 展示、图标与 PrimeVue 卸载为第七十一阶段。

**准入结论**: 三条迁移主线来自 [迁移方案 §7](../../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md) 与 backlog 长期主线第 10 条（含 2026-11-01 登记的 `1.0.0-rc.1` 待执行条目，同批并入短期候选 #12），第四条为覆盖率主线第 1 条的第十批切片；阶段构成经用户 2026-11-01 在候选页确认（构成方案 A）。**轨迹调整**：原 69 / 70 两段（B3 + 浮层 / B4 收尾）重切为 69–71 三段，67 / 68 的归档结论不变、批次总跨度为 67–71。重切依据：2026-11-01 复算的剩余迁移面为 PrimeVue `1,161 处 / 146 文件`、浮层族并集约 `100 文件`（生产文件口径）、`primeicons 556 处 / 142 文件`，按第六十八阶段吞吐（14 条路由 + 基线复测）无法在两段内收口；故按「一次一个变量」拆为——69 升级 + 浮层 + locale / 70 B3 表单与设置 / 71 展示族 + 图标 + 测试改写 + 卸载，并在迁移方案 §3.10 / §7 同步落盘。

**准入前置（已核对 2026-11-01）**: 第六十八阶段已审计归档、`todo.md` 无残留、`git status` 干净；`caomei-ui@1.0.0-rc.1` 已于 2026-10-30 发布（`dist-tags.next`；`latest` 仍为 `0.7.0`），已完成 `CHANGELOG` 阅读（**未声明 BREAKING CHANGES**）与 exports / 运行时依赖 / Nuxt 模块 / 组件清单 / 基础层字节 / token 面向对比（迁移方案 §3.10）；`engines.node = 24.x` 与 CI `lts/*` 满足 rc.1 的 `node >= 22`。

**本轮上游事实（2026-11-01 实测，详见迁移方案 §3.10）**:

- **token 面**：基础层 token 由 68 增至 74，新增 `--caomei-color-{primary,success,warning,danger,neutral}-text` 与 `--caomei-color-control-border`，**无重命名 / 删除**；20 余个组件改用 `-text` 角色，Button（secondary / outline）边框由 `-color-border` 改为 `-color-control-border`。
- **基础层体积**：`dist/styles/index.css` 9,492 B → 20,595 B；gzip 1,683 → 2,824 B（`gzip -9` 口径；同一文件 `gzip -6`（默认级别）实测 1,719 B，即历史记录的 1,719 B 为压缩级别差异，非不同实现）。增量主要来自 `forest` / `ink` / `sakura` 三套新设计预设与 6 个新角色；`keyCss` 预判 **+750 B（按 0.66 合并压缩收益折算）~ +1,141 B（无合并收益上界，即基础层 gzip 增量）**。
- **行为修复**：`DataTable` 横向滚动容器键盘可达；行选择全选作用域与 `lazy` 页内状态；`Button` 增加 hover / active 反馈（含 `color` 过渡）。
- **包形态**：exports、运行时依赖、`caomei-ui/nuxt` 模块选项面与 `0.7.0` **逐字一致**；自动导入组件仍为 **95 项**。
- **结论**：rc.1 **不是零视觉差异批次**（与 0.7.0 不同），基线必须重采而不是「复跑即绿」。

**ROI 评估**: `1.0.0-rc.1` 升级与 token 接线 `3.20`（用户硬要求 + 同批闭合 #12）；浮层族整迁 `1.90`；locale 接线 `1.60`；覆盖率第十批 `2.10`。均高于 [规划规范 §3.3](../../standards/planning.md) 的 `1.5` 优先阈值。

**长期主线容量说明**: 迁移主线占本阶段主要容量（浮层族并集约 100 文件，为最大项）；仅上收覆盖率第十批一个治理切片，且以「3 模块、全仓 `+0.3pp`」为容量现实目标（单批 `+1pp` 在第六十八阶段已证结构上不可达）。结构复用 / 国际化 / 注释治理 / Postgres 等主线本期不上收新切片，由 `pnpm regression:weekly` 保持不回退。

1. **caomei-ui 1.0.0-rc.1 升级与新 token 角色接线（P1）**: 精确锁定升级；补齐 6 个新 token 的桥接（`-text` 模式感知：**`primary` 取 `--p-primary-700` / `--p-primary-400` 以跟随运行时主色**、`danger` 取 `--p-red-700` / `-400`、`success` / `warning` 取 `--p-{green,orange}-800` / `-400`、neutral 取「文本色 → 卡片色」派生并与 tone 分离；`control-border` 采用上游默认并登记为有意偏差）；`dependabot.yml` 增加 `caomei-ui` 的 `ignore`；重采 18 条 `test:visual` 用例（14 张截图 + 2 条桥接契约 + 2 条对比度契约）、重校准 34 条 parity 允许清单、复测 `keyCss`；对 `DataTable` 两处上游修复在 15 条已迁移路由做定向回归。**非目标**: 不改 solid / 主色 / surface / 圆角 / 字体，不做选择器覆盖，不接入未发布的更高预发布版本，不迁移页面。**验收**: 精确锁定且无 `file:`；`-text` 契约计算值按模式成立且 `primary` 跟随运行时主色；soft 8% 底文字对比度两态 ≥ 4.5（沿用 #12 原验收）；`control-border` 等于上游默认；视觉 / parity 差异逐项归因；`keyCss` ≤ 70KB 且增量归因到基础层；`dependabot.yml` 规则语义经核对。
2. **浮层族整迁（P1）**: Dialog / Drawer / Popover / DropdownMenu / Menu / ConfirmDialog / `ConfirmDeleteDialog` / `useConfirm` / `useToast` / `v-tooltip` 整族迁移（组件标签 64 处 / 50 文件，叠加服务层后并集约 100 文件，含 posts 编辑与发布链路、snippets、users、settings 弹窗、公开页浮层）；6 处生产锚点的 `.toggle(event)` 改写；按 caomei 契约统一弹窗焦点；守卫在册族与 `ownedFiles` 同步扩面；mock / E2E `p-*` 断言改写。**非目标**: settings 表单控件本体与 installation（B3）、图标全量、PrimeVue 卸载。**验收**: 全仓无该族 PrimeVue 标签与 API 残留；交互回归与三层视觉回归逐项归因；守卫通过；质量门通过。
3. **内建文案 locale 接线（P1）**: 挂载前 `registerLocale` 注册 `zh-TW` / `ja-JP` / `ko-KR`；`CaomeiConfigProvider` 以应用语言驱动内建文案；先实测静态 / 异步 import 两种形态的 `coreEntryJs` 差量再择一；补接线单测。**非目标**: 不新增语种、不改 momei i18n 结构、不替换 `primevue-i18n`。**验收**: 5 语种内建文案跟随语言、未注册语种回落 `zh-CN`、`coreEntryJs` 未越 360KB。
4. **测试覆盖率治理第十批（P2）**: 按未覆盖语句绝对数取 `setting.ts`（43）/ `ai/text-translation-task.ts`（34）/ `ai/post-automation.ts`（32）三模块补测。**验收**: 各 `+15pp` 或 `85%+`；全仓 `+0.3pp` 容量目标，未达记录结构性原因。

**回滚边界**:

- 条目 1：版本回退 `0.7.0` 并还原桥接新增块 / 基线 JSON / `dependabot.yml` 即可，无业务代码改动。
- 条目 2：按路由 / 组件独立回滚，在册族登记同步收缩；`v-tooltip` 回退须同时还原指令注册。
- 条目 3：删除 plugin 与 provider 包裹即回到 `zh-CN` 回落（既有行为）。
- 条目 4：测试文件独立可删。

**风险提示**: rc.1 是首个**非静默**升级（控件边界与按钮 hover/active 改变静态外观），禁止为保持门禁绿而回退上游 token；浮层迁移涉及 teleport 与 scoped 样式（`&__dialog` 对 teleport 元素失效已有实证），须逐浮层核对宽度与定位写法；浮层族迁完后「浮层显式豁免」必须同批收缩，否则守卫口径与事实脱节；locale 接线属用户可见行为变更，须在 V 阶段做 5 语种浏览器验证。
