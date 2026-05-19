# 微信公众号格式预览与导出辅助（第三十九阶段 P0）

本文档用于冻结第三十九阶段 P0 条目“微信公众号格式预览 / 导出辅助”的首版范围，确保实现只覆盖“公众号风格预览 + 复制排版后内容”，不扩写为编辑器替换工程。

## 1. 目标与范围

- 目标：在现有 WechatSync 分发预览面内新增 `wechat_mp` 预览 profile，并提供固定的“复制排版后内容”入口。
- 适用入口：后台文章管理中的分发弹窗与 expanded preview。
- 首版输出：
  - 公众号风格的 preview payload 标签（`wechat_mp`）。
  - 针对公众号编辑器的 markdown 降级预览（标题、图片、引用、代码块保留；提示容器/代码分组/锚点做降级）。
  - 在 expanded preview 中提供“复制排版后内容”按钮，优先复制 `text/html`，回退 `text/plain`。

## 2. 非目标

- 不替换现有编辑器，不引入新的富文本编辑器链路。
- 不改变 WechatSync 运行时 dispatch 契约；仍保持 raw/default payload 投递路径。
- 不新增独立渠道，不把 `wechat_mp` 升级为站内一等分发通道。

## 3. 设计决策

### 3.1 Profile 分层

- 预览层：新增 `wechat_mp` 内容 profile，用于 preview/precheck 的兼容分析与排版降级展示。
- 运行时层：即使选中公众号账号，dispatch payload 仍按 raw/default 发送，避免破坏既有联调契约。

### 3.2 渲染链路

- 输入：`DistributionMaterialBundle.canonical.bodyMarkdown` + `copyrightMarkdown`。
- 处理：
  - 保留：标题层级、图片、引用块、代码块。
  - 降级：`::: tip/warning/info/danger`、`::: code-group`、GitHub Alert、标题锚点、复制按钮类结构。
  - 风险项：`table/iframe/video/audio` 继续标记为 blocker。
- 输出：`WechatSyncDistributionPreviewGroup.finalMarkdown`（`wechat_mp` 版本）与对应 compatibility 结果。

### 3.3 复制能力

- 入口：expanded preview footer，仅 `wechatsync + wechat_mp` 显示。
- 复制策略：
  - 首选 `navigator.clipboard.write` + `ClipboardItem` 同时写入 `text/html` 与 `text/plain`。
  - 降级为 `navigator.clipboard.writeText`。
- 一致性：复制内容与当前 preview 使用同一渲染输出，保证“所见即所得”。

## 4. 验收映射

- 标题层级：`wechat_mp` 降级后保留 Markdown heading。
- 图片：保留图片 markdown/html 渲染路径。
- 引用块：保留 blockquote。
- 代码块 / 提示容器：代码块保留，提示容器降级为引用提示。
- 长文阅读连续性：移除站内增强锚点/按钮，避免粘贴后断裂。
- 复制一致性：复制按钮输出与 preview 渲染链路一致。

## 5. 最小验证矩阵

- 单元测试：
  - `utils/shared/distribution-tags.test.ts`
  - `utils/shared/post-distribution-preview.test.ts`
  - `utils/shared/post-distribution-precheck.test.ts`
  - `utils/web/post-distribution-dialog.test.ts`
- 类型检查：`pnpm exec nuxt typecheck`（或等价任务入口）。
- 浏览器验证（本地环境可用时）：
  - 打开分发弹窗，选择公众号账号，验证 `wechat_mp` 预览标签、复制按钮显隐与复制结果。

## 6. 风险与回退

- 风险：不同浏览器对 `ClipboardItem(text/html)` 支持不一致。
- 回退：自动降级到 `writeText`，至少保证 markdown 文本可复制。
- 风险：公众号编辑器对复杂结构兼容性仍有差异。
- 回退：precheck 保留 blocker/warn 提示，不阻断现有 dispatch 链路。
