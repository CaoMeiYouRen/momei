# 编辑器工具栏收敛方案评估

## 1. 现状与问题

### 1.1 工具栏现状

当前文章编辑器顶部栏（`PostEditorHeader`）左侧包含 10 个 AI 功能按钮 + 1 个语音输入组件，**全部平铺在单行 4rem 高度内**，与标题输入框共享左侧区域：

| 序号 | 按钮 | 图标 | 交互方式 | 操作对象 |
|:---|:---|:---|:---|:---|
| 1 | AI 标题建议 | `pi-sparkles` | 单击 → Popover 列表 | 全文 |
| 2 | AI 续写 | `pi-forward` | 单击 → 直接执行 | 光标/选中 |
| 3 | AI 扩写 | `pi-arrow-right` | 单击 → 直接执行 | 选中文本 |
| 4 | AI 缩写 | `pi-arrow-left` | 单击 → 直接执行 | 选中文本 |
| 5 | AI 改写 | `pi-pencil` | 单击 → Popover 选风格 → 对比 | 选中文本 |
| 6 | AI 审查 | `pi-search` | 单击 → 侧面板 | 全文 |
| 7 | 视角检查 | `pi-eye` | 单击 → Popover 选模式 → 侧面板 | 全文 |
| 8 | AI 翻译辅助 | `pi-language` | 单击 → Popover 选语言 | 全文 |
| 9 | 格式化 Markdown | `pi-align-left` | 单击 → 直接执行 | 全文 |
| 10 | AI 语音输入 | (AppVoiceInputTrigger) | 长按录音 | 输入区 |

### 1.2 主要问题

1. **空间不足**：10 个图标按钮 + 标题输入框 + 返回按钮挤压在一行，标题输入框 `max-width: 40rem` 但常被压缩到不足 20rem，长标题无法完整显示。
2. **功能平铺无层级**：高频（续写/改写）与低频（格式化/语音）按钮同级展示，用户找不到核心功能。
3. **审查与视角检查重叠**：两者均对全文做 AI 质量分析，输出结构化 JSON 指标，但分属两个按钮、两个侧面板，用户需等待两次 AI 调用。
4. **续写/扩写/缩写缺少风格控制**：仅改寫支持 6 种风格，其余直接执行单一模式，用户无法控制输出风格。

---

## 2. 方案设计

### 2.1 总体策略

| 策略 | 说明 |
|:---|:---|
| **分组收敛** | 将 10 个按钮合并为 ≤5 个入口，同类功能归入二级菜单 |
| **审查+视角合并** | 合并为统一的"AI 审校"，一次调用完成多维质量分析 |
| **风格扩展** | 为续写/扩写/缩写增加可选风格参数，复用改写风格的 6 种风格 |
| **布局优化** | 标题输入框宽度弹性扩大，AI 按钮组收起后为标题让出空间 |

### 2.2 按钮组织方案

#### 最终方案：三级分组

```
[标题输入] [✨ AI 写作 ▼] [✓ AI 审校] [🌐 AI 翻译] [⌨ 格式化] [🎤 语音]  |  [状态栏 保存 发布 ...]
```

| 按钮 | 类型 | 行为 |
|:---|:---|:---|
| **AI 写作** | 分组按钮 (SplitButton) | 主操作：AI 改写（上次使用的风格）；下拉菜单显示 4 个子项 |
| **AI 审校** | 普通按钮 (badge) | 单击 → 一次性执行审查 + 视角检查 → 合并侧面板展示 |
| **AI 翻译** | 分组按钮 (SplitButton) | 主操作：AI 翻译当前内容；下拉菜单选语言 |
| **格式化** | 普通按钮 | 单击 → 格式化（不变） |
| **语音输入** | 组件 | 不变 |

> 标题建议功能并入 **AI 写作** 下拉菜单，作为子项之一。

#### AI 写作下拉菜单

```
┌─────────────────────────────┐
│ ✨ AI 标题建议              │
│ ✏️  AI 改写                  │ → 展开子菜单选风格
│ 📝  AI 续写                  │ → 展开子菜单选风格
│ ➕  AI 扩写                  │ → 展开子菜单选风格
│ ➖  AI 缩写                  │ → 展开子菜单选风格
└─────────────────────────────┘
```

#### 从 10 → 5 的映射

| 现状 | 归入位置 |
|:---|:---|
| AI 标题建议 | AI 写作 → 子项 1 |
| AI 续写 | AI 写作 → 子项 2 |
| AI 扩写 | AI 写作 → 子项 3 |
| AI 缩写 | AI 写作 → 子项 4 |
| AI 改写 | AI 写作 → 默认主操作 + 子菜单再选风格 |
| AI 审查 | 并入 AI 审校 |
| 视角检查 | 并入 AI 审校 |
| AI 翻译 | AI 翻译（Separate） |
| 格式化 Markdown | 保留独立按钮 |
| 语音输入 | 保留独立组件 |

### 2.3 AI 审校合并方案

#### 2.3.1 现状重叠分析

| 维度 | AI 审查 | 视角检查（编辑） | 视角检查（读者） |
|:---|:---|:---|:---|
| 调用方式 | API `/api/ai/review` | API `/api/ai/perspective-check` | 同上 |
| 温度 | 0.3 | 0.4 | 0.4 |
| 输出 | JSON 数组 (`AIReviewSuggestion[]`) | JSON 数组 (`PerspectiveCheckItem[]`) | 同上 |
| 侧面板 | `PostEditorReviewPanel` | `PostEditorPerspectivePanel` | 同上 |
| 关注点 | 语法/拼写/逻辑/风格/事实 | 结构/清晰度/节奏/论点/过渡/语调 | 参与度/困惑/情感/完整性/清晰度/节奏 |

**重叠**：两者都分析内容质量、都输出结构化 JSON、都用侧面板展示、都关注"清晰度(clarity)"和"节奏(pacing)"维度。

**差异**：审查侧重"正确性"(correctness)，视角检查侧重"有效性"(effectiveness)。

#### 2.3.2 合并方案

**不合并服务端 API**（保持关注点分离），而是**在前端合并为一个按钮 + 一个侧面板**：

1. 用户单击 **AI 审校** 按钮
2. 前端依次（或并行）调用 `/api/ai/review` 和 `/api/ai/perspective-check`（默认 editor 模式）
3. 结果统一展示在 **一个侧面板** `PostEditorConsolidatedReviewPanel` 中，分 "问题修正" 和 "视角建议" 两个 tab

```
┌──── AI 审校结果 ──────────────┐
│  [ 问题修正 ] [ 视角建议 ]     │ ← 两个 tab
│                                │
│  ■ 语法问题 (2)                │
│  • "..." → "..."              │
│  ■ 逻辑问题 (1)                │
│  • ...                        │
│                                │
│  读者模式                      │ ← 可下拉切换 editor/reader
│  ■ 清晰度 (1)                  │
│  • ...                        │
└────────────────────────────────┘
```

**增量**：
- 新增 `/api/ai/consolidated-review` 端点（可选，仅在需要合并请求时，否则用前端编排两次调用）
- 新增 `PostEditorConsolidatedReviewPanel` 组件，替代现有的 `PostEditorReviewPanel` + `PostEditorPerspectivePanel`
- 在 `usePostEditorAI` 中新增 `consolidatedReview` 方法

### 2.4 风格扩展方案

#### 2.4.1 现状

仅 `rewrite` 支持 `style` 参数（6 种风格），`continue`/`expand`/`condense` 均无风格控制。

#### 2.4.2 扩展方式

为 `continue`、`expand`、`condense` 增加 `style` 参数：

| 方法 | 当前参数 | 新增参数 |
|:---|:---|:---|
| `TextService.continueWriting` | `content, language, userId` | + `style = 'casual'` |
| `TextService.expandContent` | `content, language, userId` | + `style = 'casual'` |
| `TextService.condenseContent` | `content, language, userId` | + `style = 'casual'` |

#### 2.4.3 Prompt 模板更新

| 模板 | 当前 | 更新后 |
|:---|:---|:---|
| `CONTINUE` | `Maintain the same style, tone...` | `Maintain the same style, tone... Write in a {{style}} style.` |
| `EXPAND` | `Make it more comprehensive...` | 追加 `Use a {{style}} style when expanding.` |
| `CONDENSE` | `Make it more concise...` | 追加 `Use a {{style}} style when condensing.` |

`styleMap` 复用改写已有的 6 种风格定义（casual/formal/academic/technical/creative/concise）。

#### 2.4.4 API 端点更新

- `POST /api/ai/continue` — body 新增可选 `style`
- `POST /api/ai/expand` — body 新增可选 `style`
- `POST /api/ai/condense` — body 新增可选 `style`

#### 2.4.5 UI 交互

在 AI 写作下拉菜单中，续写/扩写/缩写进入后进一步弹出风格选择 Popover（类似当前改写的风格选择）：

```
AI 写作 ▼
├── ✨ 标题建议  → (直接执行)
├── ✏️  改写     → [casual / formal / academic / technical / creative / concise]
├── 📝  续写     → [casual / formal / ...]  ← 新增
├── ➕  扩写     → [casual / formal / ...]  ← 新增
└── ➖  缩写     → [casual / formal / ...]  ← 新增
```

或简化版：选择动作后弹出风格选择 Popover（类似当前改写流程）。

### 2.5 布局优化

| 项目 | 当前 | 优化后 |
|:---|:---|:---|
| 标题输入 `max-width` | 40rem | 取消上限（`flex: 1`），按钮组折叠后标题自然扩展 |
| 按钮数目（左侧） | 10 + 1 组件 | 3 按钮 + 1 下拉 + 1 组件 |
| 顶部栏高度 | 4rem | 维持 4rem |

---

## 3. 建议实施顺序

| 阶段 | 范围 | 工作量估计 | 并行度 |
|:---|:---|:---|:---|
| **Phase A** | UI 分组收敛：将 10 个按钮折叠为 3 组入口，不改变后端逻辑 | 2-3 天 (前端) | 独立 |
| **Phase B** | 风格扩展：为 continue/expand/condense 增加 style 参数 + prompt 更新 | 1-2 天 (前后端) | 与 A 可部分并行 |
| **Phase C** | 审查+视角合并：合并侧面板组件，保留双 API 调用 | 2-3 天 (前端) | 依赖 A |
| **Phase D** | （可选）合并后端 API：新增 consolidated-review 端点，一次调用返回双向结果 | 1-2 天 (后端) | 依赖 C |

> **推荐**：先做 A（快速释放标题空间），再做 C（消除功能重复），B 和 D 视时间灵活安排。

---

## 4. 风险与注意事项

| 风险 | 影响 | 缓解 |
|:---|:---|:---|
| 用户习惯变化：从单点直达到二级菜单，操作路径变长 | 高频用户可能不适 | 默认主操作设为最常用的"AI 改写（上次风格）"和"AI 翻译当前内容" |
| 审查+视角合并后单次操作成本更高 | 等待时间更长 | 并行调用双 API；首次加载加 cache |
| 风格选择增加交互复杂度 | 用户困惑 | 默认不选 = casual；可在设置中记忆偏好 |
| Prompt 模板变更影响输出质量 | 回复格式漂移 | Phase B 需补回归测试（`text.test.ts`） |
| API 端点 body 结构变更（style 字段） | 客户端兼容性 | style 字段可选，默认值向后兼容 |

---

## 5. 非目标（明确不做的）

- 不改动 MavonEditor 原生工具栏
- 不改动编辑器页面布局（仅收缩顶部栏左侧按钮组）
- 不改动后端 AI 服务的核心 prompt 逻辑（仅扩展参数）
- 不改动 AI 计费/配额逻辑
- 不新增 AI Provider

---

## 6. 受影响文件清单

### Phase A — UI 分组收敛

| 文件 | 改动 |
|:---|:---|
| `components/admin/posts/post-editor-header.vue` | 重构模板：按钮组折叠为 SplitButton + 下拉菜单 |
| `composables/use-post-editor-ai.ts` | 调整 emit 与 UI 状态的交互逻辑 |
| `pages/admin/posts/[id].vue` | 适配新的 emit 事件名 |
| `i18n/locales/*/admin-posts.json` | 新增分组标签、子项、tooltip 翻译 |

### Phase B — 风格扩展

| 文件 | 改动 |
|:---|:---|
| `server/utils/ai/prompt.ts` | CONTINUE/EXPAND/CONDENSE 模板追加 `{{style}}` |
| `server/services/ai/text.ts` | `continueWriting`/`expandContent`/`condenseContent` 新增 style 参数 |
| `server/api/ai/continue.post.ts` | body 新增可选 `style` 字段 |
| `server/api/ai/expand.post.ts` | 同上 |
| `server/api/ai/condense.post.ts` | 同上 |
| `composables/use-post-editor-ai.ts` | 方法调用时传递 style 参数 |
| `server/services/ai/text.test.ts` | 新增 style 参数测试 |

### Phase C — 审查+视角合并

| 文件 | 改动 |
|:---|:---|
| `components/admin/posts/post-editor-consolidated-review-panel.vue` | **新建**：Tab 切换的合并侧面板 |
| `components/admin/posts/_editor-panel-shared.scss` | 扩充共享 SCSS |
| `components/admin/posts/post-editor-header.vue` | 替换两个独立面板为合并面板 |
| `composables/use-post-editor-ai.ts` | 新增 `consolidatedReview` 方法，管理合并状态 |
| `components/admin/posts/post-editor-review-panel.vue` | 保留或标记废弃 |
| `components/admin/posts/post-editor-perspective-panel.vue` | 保留或标记废弃 |
| `pages/admin/posts/[id].vue` | 替换面板组件引用 |

---

## 7. 验收标准

| 验收项 | Phase |
|:---|:---|
| 左侧 AI 按钮从 10 个减少到 ≤5 个入口 | A |
| 标题输入框在常规编辑器宽度下能完整显示 30+ 中文字符 | A |
| 所有收敛后的功能与原功能等价（映射表已覆盖） | A |
| 续写/扩写/缩写可指定风格，默认 casusal 向后兼容 | B |
| 风格选择后 prompt 正确传递、AI 输出符合预期 | B |
| 审查+视角检查合并为一键执行，侧面板分 Tab 展示 | C |
| 两个 API 调用可并行执行，总等待时间 ≤ max(审查, 视角) | C |
| 旧版单一点按钮仍可用（通过下拉层级可达） | A+B+C |
| `pnpm typecheck` + `pnpm lint` + `pnpm test` 通过 | A+B+C |
| 五语种 i18n 翻译补齐 | A+B+C |
