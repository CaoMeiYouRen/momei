# markdown-it 15 迁移与插件兼容矩阵（2026-11-11）

> 本条目的规划与验收口径见 [待办事项 - 第七十三阶段条目 5](../../plan/todo.md)；实现事实源为 [共享 Markdown 渲染器](../../../utils/shared/markdown.ts) 与 [linkify 兼容层](../../../utils/shared/markdown-linkify.ts)。本文件只记录迁移依据与结论，不复制规范条款。

## 1. 版本与范围

| 包 | 变更前 | 变更后 | 说明 |
| :--- | ---: | ---: | --- |
| `markdown-it` | 14.3.3 | 15.0.3 | 主包；15.0.0 起自带 TypeScript 声明 |
| `markdown-it-anchor` | 9.2.1 | 10.1.0 | 10.1.0 起声明支持 markdown-it 15 |
| `@types/markdown-it` | 14.2.0（直接依赖） | 移除直接依赖 | 15 自带声明。该类型包仍留在 store：`@types/markdown-it-container@4.0.1` 与 `@types/markdown-it-emoji@3.0.1` 把它声明为**直接依赖**，`markdown-it-anchor@10.1.0` 声明为**可选 peer**，`vitepress@1.6.4` 为普通依赖；它们不参与本仓 `markdown-it` 模块解析 |
| `@types/markdown-it-container` | 4.0.0 | 4.0.1 | 类型包补丁 |
| `linkify-it`（传递） | 5.0.2 | 6.1.0 | 行为变更来源，见 §3 |
| `uc.micro`（传递） | 2.1.0 | 3.0.0 | 随 linkify-it 6 |
| `argparse`（传递） | 2.0.1 | 3.0.4 | markdown-it CLI 依赖，本仓不使用 CLI |
| `entities`（传递） | 4.5.0 | 8.1.0 | markdown-it 15 将依赖抬到 `^8.1.0`，影响实体解码，见 §3.2 |

锁文件 diff 为 39 增 / 33 删，全部落在上表条目及其 importer / snapshot 键：没有其他包的版本新增或删除，但 `markdown-it` 的 `entities` 解析由 4.5.0 切到 8.1.0，属于本次升级的连带变化。

## 2. 插件兼容矩阵

| 插件 | 版本 | 结论 | 依据 |
| :--- | :--- | :--- | :--- |
| `markdown-it-anchor` | 10.1.0 | 兼容 | 上游 10.1.0 修复「支持 markdown-it 15」；`permalink.headerLink()` 输出的 `id` / `href` 结构与 9.2.1 一致（仓内为结构断言，未做逐字节对照）。10.0.0「`env` 复用会共享 slug 唯一性」的破坏性变更经核查不适用：本仓无跨文档共享 `env` 的调用 |
| `markdown-it-container` | 4.0.0 | 兼容（运行时） | `tip` / `warning` / `danger` / `info` / `code-group` 渲染断言通过；类型包仍引用 v14 命名空间，本地收敛 |
| `markdown-it-emoji` | 3.1.0 | 兼容（运行时） | `:smile:` → 😄 断言通过；`@types/markdown-it-emoji` 仍用 `import = require('markdown-it')`，与 15 实例类型冲突，本地收敛 |
| `markdown-it-github-alerts` | 1.0.1 | 兼容 | peer `markdown-it >= 13.0.0`；`> [!NOTE]` 渲染断言通过 |
| `markdown-it-texmath` | 1.0.0 | 兼容 | `$x^2$` → `class="katex"` 断言通过 |

kill-switch 未触发：5 个插件在运行时全部兼容，无需回退依赖。

## 3. 上游行为变更与处置

### 3.1 linkify-it 6：已恢复的默认值

- v5.0.2 默认 `fuzzyLink: true`、`fuzzyEmail: true`、`fuzzyIP: false`，且没有 `urlAuth` 选项（默认允许 URL 的认证段）。
- v6.1.0 默认 `fuzzyLink: false`、`fuzzyEmail: true`、`fuzzyIP: false`，新增 `urlAuth: false`。
- 处置：`applyMarkdownLinkifyCompatibility`（`utils/shared/markdown-linkify.ts`）显式恢复 `fuzzyLink` 与 `urlAuth`；共享渲染器与 4 处服务端直连渲染器（`server/utils/feed.ts`、`server/utils/fed/mapper.ts`、`server/routes/fed/outbox/[username].ts`、`server/api/admin/marketing/campaigns/test.post.ts`）统一调用，避免文章页与 Feed / ActivityPub / 营销邮件输出不一致。
- `fuzzyIP` 两版均为 `false`，无需处理。
- 断言：`utils/shared/markdown-linkify.test.ts`（3 例）+ `markdown.test.ts` 的 fuzzy link / urlAuth 两例；删除恢复调用即变红。

### 3.2 上游行为变更（未恢复，接受）

| 变更 | v14 行为 | v15 行为 | 处置 |
| :--- | :--- | :--- | :--- |
| Unicode 标点终止链接（CJK 改进，对 ASCII 冒号同样生效） | `example.com:8080` 链接到 `http://example.com:8080` | 不再自动链接 | 接受：上游修复，仓库正文与测试未依赖「裸域名 + 端口」形态 |
| 认证段邮箱 | `user:pass@example.com` 生成 `mailto:` 链接 | 不再链接 | 接受：上游收紧了 fuzzy 邮箱识别；显式 Markdown 链接不受影响 |
| 命名实体必须带分号 | `&copy` 被当作实体 | 仅 `&copy;` 视为实体，缺分号按字面输出 | 接受：CommonMark 对齐 |
| 小写声明识别为 HTML block | `<!doctype html>` 在段落内 | `html: true` 下识别为 HTML block | 接受：`html: true` 的渲染器（共享 / Feed / AP / 邮件）输出更符合规范 |
| 链接目标末尾「反斜杠 + 空格」保留 | 被吞掉 | 保留 | 接受：CommonMark 6.3 对齐 |
| IPv6 字面量方括号保留 | 规范化时可能丢失 | 保留 | 接受：上游修复 |
| `entities` 4 → 8 | `![alt &copy;](x)` 的 alt 丢弃实体，仅保留尾随空格 | `alt="alt ©"` | 接受：实体解码更正确 |
| `text_join` 处理图片 alt 与行内代码 | 图片 alt 中的行内代码/换行处理不一致 | 统一 | 接受：渲染输出更符合预期 |
| linkify 链接长度上限 | — | 带 schema 的链接限制 10000 字符 | 接受：仅影响异常长链接 |

- 影响面：文章页、Feed（RSS/Atom/JSON）、ActivityPub Outbox、邮件正文与预览；上述均为上游行为改进，不涉及安全回退。
- 复核方式：迁移前后同一语料对照，除本表与 §3.1 的差异外未见其他输出差异；该结论的语料为本仓测试用例与既有文档内容，语料未覆盖的边界以本表登记为准。

## 4. 适配层改动

`utils/shared/markdown.ts`：

| 变更 | 原因 |
| :--- | :--- |
| `MarkdownRendererInstance` 由 `interface extends MarkdownIt` 改为 `MarkdownItInstance & MarkdownImagePlaceholderMethods` | 15 的默认导出是可调用包装 `MarkdownItCallable`，实例类型改为具名导出的 type-only `MarkdownIt` |
| `attachMarkdownImagePlaceholderSupport(md): MarkdownRendererInstance` 用 `Object.assign` 挂载 `__image` / `image_add` / `image_del` | 取消 `as MarkdownRendererInstance` 断言，改为结构化赋值 |
| `md.use(markdownEmojiPlugin)` 使用本地签名 `(md: MarkdownItInstance) => void` | `@types/markdown-it-emoji` 仍以 `import = require('markdown-it')` 引用 v14 命名空间；上游类型包声明支持 15 后删除桥接 |
| `MarkdownContainerPlugin` 的 `md` 参数改为 `MarkdownItInstance` | 同上，容器插件类型包仍指向 v14 |
| `markdownContainerPlugin` 保留 `as unknown as` 桥接 | 容器插件类型包无 v15 声明，运行时签名等价 |

`utils/web/admin-markdown-editor.ts`：

- `renderer.render` 包装的 `env` 参数由 `unknown` 改为 `Env`（15 的 `render(src, env?: Env)`），同时去掉多余断言。
- `AdminMarkdownEditorInstance.markdownIt` 收窄为 `Pick<MarkdownRendererInstance, 'render'>`：模板 ref 推导出的实例与该接口在 `markdownIt` 上分属两份声明（15 自带 vs 传递的 `@types/markdown-it@14`），只能收窄到实际使用的渲染入口。

## 5. 验证

- `pnpm typecheck`：0 error（迁移前 8+ 处报错全部收敛）。
- `pnpm install --frozen-lockfile`：`Already up to date`（锁文件自洽，无隐式重解析）。
- 定向（可复跑；先移走 `node_modules/.vitest-cache`，否则 `virtual:intlify-i18n-*` 热缓存会导致 `distribution-template` 收集失败）：

  ```bash
  mv node_modules/.vitest-cache /tmp/vitest-cache.bak 2>/dev/null
  pnpm exec vitest run utils/shared/markdown.test.ts utils/shared/markdown-linkify.test.ts \
    tests/modules/markdown-linkify-wiring.test.ts server/utils/feed.test.ts server/utils/feed-query.test.ts \
    utils/shared/distribution-template.test.ts utils/web/admin-markdown-editor.test.ts \
    components/article-content.test.ts components/comment-item.test.ts \
    components/table-of-contents.test.ts pages/admin/submissions/index.test.ts
  ```

  结果：11 文件 / 100 例通过（含 5 处渲染器接线的 9 例静态守卫，按「调用形态」匹配并剥离注释）。
- 全量 `vitest`（移走 `.vitest-cache` 后 `--maxWorkers=4`）：606 文件 passed / 1 skipped（607 文件）、5,383 例 passed / 1 skipped（5,384 例）。
- `pnpm test:visual`：32 passed；`pnpm test:visual:parity`：83 passed（markdown 渲染改动未引起视觉差异）。
- `pnpm test:perf:budget`（warn 模式）：`coreEntryJs` 323.42KB / 335KB、`maxAsyncChunkJs` 55.58KB / 130KB、`keyCss` 59.08KB / 62KB、`prIncrementJs` −0.02KB / 20KB，均未越线。
- 备注：本地出现过的套件失败均为 `.vitest-cache` 热命中导致 `virtual:intlify-i18n-*` 解析失败（既有环境噪声），移走缓存后同一命令全绿。

## 6. 回滚

- `package.json` + `pnpm-lock.yaml` 与适配层同批 revert 即可；插件行为未改动，无需数据侧回滚。
- 若只想放弃 linkify 语义恢复，回退 `utils/shared/markdown-linkify.ts` 的调用点即可（5 处渲染器各自独立），但必须同批回退全部 5 处，避免输出不一致。

## 7. Review Gate 记录

| 轮次 | 结论 | 关闭项 |
| :--- | :--- | :--- |
| Round 1 | Reject | blocker 1：4 处服务端直连渲染器未恢复 linkify；warning 5 / suggest 5（依赖表事实、语义清单、urlAuth 断言、todo/PR 口径、文档回链、类型收窄归因等） |
| Round 2 | Reject | blocker 3：治理文档与 todo / 回归记录的全量数字不一致、定向例数不可复现、回归窗口预填 Pass；warning：类型包依赖性质表述、接受项清单不完整、直连渲染器缺回归断言、收窄归因未证实 |
| Round 3 | Reject | blocker 1：全量数字与新增守卫测试后的树不同源；warning：守卫判别力不足（注释命中）、定向命令缺缓存前置、helper 注释与仓内渲染器事实相反 |
| Round 4 | Pass | 关闭 B1（全量数字与 9 例守卫树同源）、W1（守卫改为剥离注释后的调用形态匹配）、W2（定向命令补缓存前置）、W3（helper 注释与仓内渲染器事实一致）；S1 的重复 Round 2 行已在本轮记录清理中删除 |
