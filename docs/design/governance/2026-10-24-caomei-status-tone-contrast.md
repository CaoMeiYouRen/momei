# caomei-ui 状态色 tone 对比度修正方案

> 状态：候选评估（未上收）。落点为 [backlog 短期候选 #12](../../plan/backlog.md)。
> 关联主线：[UI 组件库许可证风险与迁移可行性治理](../../plan/backlog.md)（#10）；迁移批次事实源为 [PrimeVue → caomei-ui 迁移方案](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)。

## 1. 背景与问题定义

第六十七阶段落地的 token 桥接（`styles/main.scss` 的「caomei-ui 语义 token 并存桥接」段）把状态色拆成两层：

- **tone 层**：`--caomei-color-success` / `-warning` / `-danger` → `--p-{green,orange,red}-500`。
- **solid 层**：`--caomei-color-{success,warning,danger}-solid` → 同名 `-700`。

caomei-ui 的 soft / outline / simple 变体把 `tone` **直接当作文字或边框颜色**消费（soft 底为 `color-mix(tone 8%, transparent)`），因此 tone 必须是“作为文本仍可读”的深档。上游基础层（minimal）正是按此取值：`#15803d` / `#b45309` / `#dc2626`，均在 5:1 左右。

桥接改为 500 档后，浅色模式下状态文字明显变浅，且低于 WCAG AA 正文门槛；其中 success / warning 的落差最大，这正是「切换 caomei-ui 后差异最大」的直接来源。暗色模式下桥接把 tone 冻结在 500 档，也没有跟随上游暗色的 400 档提亮（迁移方案 §5.2 已登记的「已知偏离 ①」）。

### 1.1 实测对比度（2026-10-24）

度量口径：Chromium 计算后的 token 值按 sRGB 相对亮度计算；「soft 8%」为 tone 与卡片底色按 8% 混合后的实际文字底色，对应 `CaomeiTag` 默认 soft 变体、`CaomeiMessage` soft / outline / simple 与 `CaomeiToast` 图标色（Badge 默认 solid，走 solid 层）；「卡片」为 `--caomei-color-bg`。

| 状态 | 当前 light（500） | soft 8% 对比度 | 当前 dark（500） | soft 8% 对比度 |
| :--- | :--- | :--- | :--- | :--- |
| success | `#22c55e` | **2.12**（AA 4.5 不达标） | `#22c55e` | 7.49 |
| warning | `#f97316` | **2.59**（不达标） | `#f97316` | 6.20 |
| danger | `#ef4444` | **3.39**（不达标） | `#ef4444` | 4.73 |

作为卡片上的裸文本（`simple` message、`ghost` 图标按钮）时为 2.28 / 2.80 / 3.76，success / warning 连非文本 3:1 也未达标。solid 层不变：`#15803d` / `#c2410c` / `#b91c1c` 配白字为 5.02 / 5.18 / 6.47，全部达标。

### 1.2 为什么既有门禁没有暴露

- 视觉一致性门禁的多数已迁移路由基线为**空态**，数据行与状态标签不入画（[偏差处置表](./visual-parity-deviation-register.md) 多处注明「Tag 不入画」）。
- 「Tag tone 映射」本身已被登记为**有意差异**（[偏差处置表](./visual-parity-deviation-register.md) 的「Tag tone 映射（severity → tone）」行），像素比对不会把它判为回归。
- 契约测试只断言「桥接值等于对应 `--p-*-500`」，不校验可读性。

因此这是一次**契约层正确、可访问性与迁移前观感回退**的缺口，而不是桥接未生效。

## 2. 范围与非目标

### 2.1 范围

- `styles/main.scss` 桥接段的状态色 tone 三项改为模式感知：light 取 `-700`，dark 取 `-400`。
- 为暗色补充 unlayered `html.dark` 覆盖块（原因见 §3.1）。
- 同步契约测试 `tests/visual/caomei-token-bridge.visual.test.ts` 的期望映射（按主题区分）。
- 同步迁移方案 §5.2 的 token 表与「已知偏离 ①」表述、偏差处置表中 Tag tone 行的备注。
- 复跑三层视觉回归与定向人工核验（浅色 / 暗色 / 四套主题预设）。

### 2.2 非目标

- 不改 solid 层（`-700` 是上游 `momei`、`caomei` 预设的规范值，且白字对比度达标）。
- 不改主色、surface、text、border、圆角与字体映射。
- 不改 `neutral` / `on-solid`（保持库默认）。
- 不做选择器打穿或组件级样式覆盖；仍只走文档化的 `--caomei-*` 变量。
- 不升级 `caomei-ui` 版本，不改组件库构建形态。
- 不重做全站状态色体系，不调整 `Tag` / `Badge` 的默认变体。

## 3. 事实与约束

### 3.1 层叠约束

现有桥接为 unlayered `html:root`（特异性 0,1,1），高于库侧 `:root` 与 `:is(.dark, [data-theme="dark"])`（均 0,1,0）。要按主题给不同值，必须再引入一个同特异性、且**源码顺序在后**的暗色选择器：

```scss
html:root { /* 现有桥接：状态 tone 改取 -700 */ }
html.dark { /* 暗色：状态 tone 改取 -400 */ }
```

`html.dark` 与 `html:root` 特异性相同（均为 0,1,1），源码在后的 `html.dark` 生效；同时两者仍高于库侧的 0,1,0。**不得**把暗色覆盖写进任何 `@layer`，否则会被库的未分层样式反压。

暗色类挂在 `html` 上（`composables/use-theme-mode.ts` 的 `useDark({ selector: 'html', attribute: 'class' })`），与本方案一致。

### 3.2 取值可得性

`--p-green-700` / `--p-orange-700` / `--p-red-700` 与 `--p-green-400` / `--p-orange-400` / `--p-red-400` 均来自 Aura `primitive-variables`，与主题模式无关、两套模式均可解析，不需要新增硬编码色值。

### 3.3 影响面

- 标签：48 处 `CaomeiTag` 实例，默认 `soft`（仅 1 处显式 `outline`）；其中静态写死 `tone="success"` 1 处、`tone="warning"` 3 处，其余由状态 helper 动态返回 success / warning / danger。
- Badge：5 处 `CaomeiBadge`，默认 `solid` 走 `-solid`，仅在改用 soft / outline 时受 tone 影响。
- 表单：`--caomei-field-invalid-border-color` 派生自 danger tone，错误边框会同步变深。
- 浮层：`CaomeiToast` 的图标色与左侧强调边当前尚未迁入（第六十九阶段），落地后自动继承修正后的值。
- 包体：只改 CSS 变量值，`keyCss` 预计零增长（新增一个选择器块，量级为数十字节，需实测确认）。

## 4. 方案比较

| 方案 | 内容 | 浅色 AA | 暗色与上游一致 | 与迁移前观感 | 改动面 | 结论 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| A（推荐） | tone：light `-700` / dark `-400`，solid 不变 | 通过（4.51 / 4.62 / 5.66） | 是 | 回到 PrimeVue 时代的 700 档文字 | 桥接 3 项 + 暗色块 + 契约测试 | 采纳 |
| B | 只把 light 改为 `-700`，dark 维持 500 | 通过 | 否（仍冻结 500，danger 4.73 擦线） | 浅色对齐、暗色不变 | 最小 | 备选；暗色偏离未消除 |
| C | 维持现状，仅补文档说明 | 不通过（2.12 / 2.59 / 3.39） | 否 | 状态文字持续偏浅 | 零 | 不采纳 |

不采纳「把 solid 提亮到 500」的路径：白字会降到 2.28 / 2.80 / 3.76，均不合格；若产品希望状态块更轻，应改用 `soft` 变体，而不是改 solid token。

## 5. 推荐方案（A）细节

### 5.1 取值

| token | light（改后） | soft 8% 对比度 | dark（改后） | soft 8% 对比度 |
| :--- | :--- | :--- | :--- | :--- |
| `--caomei-color-success` | `#15803d` | 4.51 | `#4ade80` | 9.56 |
| `--caomei-color-warning` | `#c2410c` | 4.62 | `#fb923c` | 7.55 |
| `--caomei-color-danger` | `#b91c1c` | 5.66 | `#f87171` | 6.24 |

卡片裸文本口径下同样达标：light 5.02 / 5.18 / 6.47，dark 10.85 / 8.35 / 6.84。

### 5.2 代码落点

```scss
html:root {
    /* 状态色 tone：作为 soft / outline / simple 的文本与边框色，必须取文本安全深档；
     * light 取 -700（原 -500 在 8% soft 底上仅 2.12 / 2.59 / 3.39）。 */
    --caomei-color-danger: var(--p-red-700);
    --caomei-color-success: var(--p-green-700);
    --caomei-color-warning: var(--p-orange-700);
    /* solid 保持 -700 */
}

/* 暗色：上游暗色 tone 为 400 档；与 html:root 同特异性、源码在后，故生效。 */
html.dark {
    --caomei-color-danger: var(--p-red-400);
    --caomei-color-success: var(--p-green-400);
    --caomei-color-warning: var(--p-orange-400);
}
```

保留 light 的 `-solid` 声明不变。暗色 warning 采用 `--p-orange-400`（`#fb923c`）而非上游的 amber-400（`#fbbf24`），是为与浅色使用同一 orange 色阶；两者均达标，如需与上游逐值一致可单独再议。

### 5.3 契约测试调整

`tests/visual/caomei-token-bridge.visual.test.ts` 的 `DIRECT_BRIDGE_PAIRS` 目前是主题无关的成对断言。改为按主题取期望来源：

- light：`--caomei-color-success` → `--p-green-700`，warning → `--p-orange-700`，danger → `--p-red-700`。
- dark：对应 `-400`；solid 三项仍为 `-700`（两主题一致）。

同时保留「全部桥接 token 非空」与「主色不得等于库默认」两条既有断言。

## 6. 风险与回滚

| 风险 | 说明 | 处置 |
| :--- | :--- | :--- |
| 浅色 tone 与 solid 同值 | soft / outline 与实底只靠底色区分，层次减弱 | 与 caomei minimal 预设一致；如坚持要层次，可退回方案 B 并接受暗色偏离 |
| 错误边框变深 | `#b91c1c` 比原 `#ef4444` 更深，表单错误态更醒目 | 随视觉回归逐页确认，必要时只对 field token 保留 500（需另立结论，不在本方案默认范围） |
| 暗色状态文字变亮 | 图标 / 文字更抢眼 | 暗色截图复核；对比度提升，不影响可读性 |
| 视觉基线漂移 | 带状态标签的页面会出现预期内色差 | 先补带数据行的基线再更新快照，差异逐项归因，禁止静默更新 |

回滚方式：还原 3 项 tone 取值与暗色块、还原契约测试期望，重跑 `pnpm test:visual`；无数据 / 构建产物残留。

## 7. 验证计划

- 契约层：`pnpm test:visual` 中的 bridge 用例（浅色 + 暗色两套断言）。
- 截图层：三层视觉回归（浅色 / 暗色），覆盖带状态标签与数据行的已迁移路由（如 `/admin/posts`、`/admin/users`、友链与订阅者相关页面）。
- 人工核验：四套主题预设（default / green / amber / geek）× 明暗两态，检查 `CaomeiTag` 的 soft / outline / solid、`CaomeiBadge`、表单错误边框与 `ghost` 危险按钮。
- 质量门：`pnpm lint`、`pnpm lint:css`、`pnpm typecheck`、定向测试；`keyCss` 复测不越线。
- 文档一致性：迁移方案 §5.2 表与偏离登记、偏差处置表备注、`docs:check:links`。

## 8. 验收标准

1. 计算值断言：light 的 success / warning / danger 分别等于 `--p-green-700` / `--p-orange-700` / `--p-red-700`；dark 分别等于对应 `-400`；solid 恒为 `-700`。
2. 浅色 soft 8% 底上的状态文字对比度 ≥ 4.5:1；暗色 ≥ 4.5:1。
3. 视觉回归差异仅限状态色相关区域，且逐项归因；无布局、几何或非状态色漂移。
4. `keyCss` 不越 70KB 配额，且相对现值增幅可解释。
5. 质量门通过；迁移方案与偏差处置表完成回写。

## 9. 上收前置与待决

- **上收时机**：建议作为独立小切片，排在第六十九阶段（B3 / 浮层）之前或与之同批；B2 已上线的状态标签正在承受该差异，不宜拖到 B4。
- **待决 1**：是否接受浅色 `tone == solid` 的层次收敛（方案 A）还是保留 500 档的层次（方案 B）。
- **待决 2**：错误边框是否跟随 tone 变深；若否，需单列 field token 的例外口径。
- **待决 3**：暗色 warning 是否改用 amber-400 以逐值对齐上游。
- 上收前需确认：视觉基线覆盖到带数据行与状态标签的页面，否则无法验收第 3 条。

## 10. 相关文档

- [PrimeVue → caomei-ui 迁移方案](./2026-09-18-primevue-to-caomei-ui-migration-plan.md)
- [视觉一致性门禁](./2026-10-13-visual-parity-gate.md)
- [视觉一致性偏差处置表](./visual-parity-deviation-register.md)
- [项目规划规范](../../standards/planning.md)
- [Backlog](../../plan/backlog.md)
