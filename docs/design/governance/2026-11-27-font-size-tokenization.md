# 非字阶字号评估与 token 化（2026-11-27）

> 主文档: [UI 设计 §2.3 字体与字阶](../../design/ui.md#23-字体-typography)。上一轮归一评估见 [2026-11-15 字号归一评估](./2026-11-15-font-size-normalization-evaluation.md)。

## 1. 结论

- 基线：`font-size` 声明 460 条 / token 274 条（**59.57%**）。计划口径的 149 条差额来自第八十五阶段移动端表单新增的 3 条声明，本次按 152 条实际基线评估。
- 收口：token **324 条（70.43%）**，超过 ≥65% 验收线；本轮新增 token 化 **50 条**（≥40）。
- 三个补充 token 的取值与替换前完全一致，属于「等值 token 化」，不改变任何渲染像素。
- 剩余 102 条非字阶声明按分组评估保留，理由见 §4。

## 2. 新增 token

| token | 值 | 替换条数 | 用途 |
| :--- | :--- | ---: | :--- |
| `--m-font-size-sm-tight` | `0.85rem` | 17 | 管理端卡片次要文案、评论元信息等紧凑说明文字 |
| `--m-font-size-sm-relaxed` | `0.95rem` | 16 | 正文相邻的辅助阅读文本 |
| `--m-font-size-md-wide` | `1.1rem` | 17 | 卡片标题、面板小标题等介于 md 与 lg 之间的标题 |

token 定义在 `styles/main.scss` 的 `:root` 字阶块内，与原有 8 档并列；取值逐项对账，无四舍五入。

## 3. 评估与执行顺序

1. `pnpm governance:inventory:font-sizes` 产出 56 个去重取值、39 个非字阶取值。
2. 按「出现次数 × 复用面 × 语义稳定性」分组：17 / 16 / 17 次的三组被判定为可语义化复用。
3. 先新增 token 定义，再按精确字面量替换 `font-size: <value>`；替换后 inventory 复算 324 条（+50）。
4. `pnpm build` 通过，编译产物确认三个 token 解析为 `.85rem / .95rem / 1.1rem`。

## 4. 保留项分组

| 分组 | 取值 | 条数 | 保留理由 |
| :--- | :--- | ---: | :--- |
| 管理端紧凑字号 | `0.8125rem` / `0.8rem` / `0.7rem` / `0.9rem` | 43 | 后台表格、标签、徽标的有意紧凑层级；抽 token 会诱导前台误用 |
| 一次性展示字号 | `2rem` / `2.5rem` / `3rem` / `3.5rem` / `3.75rem` / `1.75rem` | 23 | 各页面 hero / 空态 / 营销区块的一次性排版，未形成复用面 |
| 微调值 | `0.935rem` / `0.9375rem` / `1.2rem` / `1.35rem` / `0.65rem` / `0.825rem` / `0.92rem` / `1.05rem` / `1.15rem` / `1.4rem` / `1.8rem` / `10px !important` | 16 | 单点视觉微调，需与具体组件版式绑定，抽 token 反而失去上下文 |
| 相对单位 | `0.9em` / `0.85em` / `1.1em` / `1.25em` / `1.5em` / `1.75em` / `2.25em` / `2.5em` / `inherit` | 12 | 相对父级字号，属于排版上下文，不可替换为 rem token |
| 流体排版 | `clamp(...)` ×3 | 3 | 响应式流体字号，token 化会丢失断点语义 |
| 平台阈值 | `16px` ×4 | 4 | 公开表单的 iOS 聚焦阈值，保留字面量表达「≥16px」的平台约束 |
| 运行时变量 | `var(--reader-font-size)` | 1 | 阅读器用户可调字号，不能固定 |

## 5. 验证

- `pnpm governance:inventory:font-sizes`：460 条 / token 324（70.43%）/ 可等价替换 0。
- `pnpm lint` 0 error、`pnpm lint:css` 0 error、`pnpm typecheck` EXIT 0、`pnpm build` EXIT 0。
- 值等价：三个 token 定义与原字面量逐一相同，属零像素变更；视觉/parity 由 CI 作业复核。
- 未放宽 `parity-budget.json` 或任何视觉阈值。
