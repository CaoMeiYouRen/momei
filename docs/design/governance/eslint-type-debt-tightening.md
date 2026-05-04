# ESLint / 类型债与规则收紧治理

## 1. 概述

第三十阶段的“ESLint / 类型债与规则收紧治理 (P1)”沿长期主线推进了两轮窄切片：先完成 `utils/shared` 生产源码范围的 `@typescript-eslint/no-explicit-any`，再继续把同一条规则推进到 `server/utils` 中命中继续集中的底层工具文件组。

当前阶段继续沿用同一口径推进后续窄切片：先把 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 子桶中的真实生产命中重新冻结，再继续只对回滚边界足够窄的单文件链路做收敛；在目录级 ESLint 被既有 `max-lines` 告警阻塞时，只做最小重复代码复用，不把 `composables/**` 一次性扩写成更大的目录级治理。

## 2. 本轮范围与非目标

### 2.1 执行范围

- 规则配置：`eslint.config.js`
- composables 切片：`composables/use-post-editor-io.ts`、`composables/use-asr-direct.ts`、`composables/use-post-editor-voice.ts`、`composables/use-tts-task.ts`
- API 单文件切片：`server/api/categories/index.get.ts`
- 既有工具复用点：`utils/web/audio-compression.ts`
- shared Markdown 渲染器：`utils/shared/markdown.ts`
- server 工具组：`server/utils/object.ts`、`server/utils/pagination.ts`
- 文档站导航：`docs/.vitepress/config.ts`
- 当前阶段待办与回归记录：`docs/plan/todo.md`、`docs/reports/regression/current.md`

### 2.2 非目标

- 不把 `@typescript-eslint/no-explicit-any` 外溢到全仓生产源码、测试、脚本或整个 `server/**` / `composables/**`。
- 不把本轮扩写为 `no-unsafe-*`、`prefer-nullish-coalescing`、`no-unused-vars` error 化，或“全仓 any 清零”工程。
- 不重写 Markdown 渲染能力、容器语法或图片占位符行为；本轮只做类型收敛与规则上收。

## 3. 候选规则与准入结论

### 3.1 本轮筛选结果

- `@typescript-eslint/prefer-nullish-coalescing`：历史采样仍是千级命中，不符合本轮“命中有限、回滚清晰”的准入要求。
- `@typescript-eslint/no-non-null-assertion`：当前生产源码命中跨 `server/**`、`composables/**` 与前端表单链路，回滚边界还不够窄，不适合在本轮直接上收。
- `@typescript-eslint/no-explicit-any`（`utils/shared` 生产源码范围）：当前生产命中集中在 `utils/shared/markdown.ts`，显式 `any` 共 `7` 处，均位于 MarkdownIt 渲染器回调与容器插件接线点，是当前最适合一次清零的窄边界热点。

### 3.2 准入结论

- 本轮只上收 `utils/shared/**/*.{ts,tsx,mts,cts}` 的 `@typescript-eslint/no-explicit-any`，并继续排除 `*.test.*`、`*.spec.*`、`tests/**` 与 `scripts/**`。
- 选择该切片的原因：`utils/shared` 属于高复用层；当前命中几乎集中在单文件；替换方式可依赖现有 `MarkdownIt` 实例推导出的参数类型完成，不需要引入新依赖或更大范围的范型重构。

### 3.3 第二轮筛选与最终收口结论

- `@typescript-eslint/no-explicit-any` 下一候选：`server/utils/object.ts` 与 `server/utils/pagination.ts` 两文件组当前生产命中共 `2` 处，均位于底层工具函数，且各自有同级测试文件，符合“命中继续集中、回滚边界清晰”的准入要求。
- `@typescript-eslint/no-non-null-assertion` 分桶采样：`server` 约 `15` 处，集中在设置、鉴权与服务层上下文；`composables` 约 `8` 处，集中在广告注入与后台 AI 管理；前端表单组约 `25+` 处，集中在设置管理器、编辑器与管理表单链路。
- 分桶结论：`server` 与前端表单组当前都不适合直接上收，前者会触碰数据库 / 鉴权边界，后者会导致大量模板与 ref 判空噪音；`composables` 风险中等，但命中仍跨多个交互链路，不适合作为本待办的最后一刀。
- 最终结论：本轮继续正式上收 `@typescript-eslint/no-explicit-any`，但只作用于 `server/utils/object.ts` 与 `server/utils/pagination.ts`，同时把 `no-non-null-assertion` 的三桶采样结论落盘，作为关闭第三十阶段该待办的收口依据。

### 3.4 `composables` 子桶复核与第三轮切片

- 2026-04-27 重新按生产源码复核 `composables/` 子桶后，`@typescript-eslint/no-non-null-assertion` 的真实命中已不再分散在广告注入与后台 AI 管理链路，而是收敛到 `composables/use-post-editor-io.ts` 单文件的 Markdown frontmatter 导入分支，共 `8` 处。
- 这 `8` 处都位于 `slug`、`summary`、`coverImage`、`copyright`、`language`、`audio url`、`audio size` 与 `audio mimeType` 的别名读取路径，替代策略统一为“先取局部别名，再用显式 truthy 守卫和类型分支收窄”，不需要改动 frontmatter 兼容契约或导入行为。
- 目录级复核时，临时对生产文件逐个启用 `@typescript-eslint/no-non-null-assertion` 后，仅剩 `composables/use-asr-direct.ts` 的既有 `max-lines` warning 阻塞 `pnpm exec eslint composables --max-warnings 0`；进一步复核发现该文件尾部重复实现了 PCM 转换 helper，可通过复用现有 `utils/web/audio-compression.ts` 能力把行数压回阈值内，而无需引入精确豁免。
- 准入结论：第三轮对 `composables/use-post-editor-io.ts` 启用 `@typescript-eslint/no-non-null-assertion` warning，并允许为目录级 ESLint 收口补一刀最小的重复 helper 复用；不把 `use-asr-direct.ts` 扩写成新的 ASR 重构主线。

## 4. 实施策略

### 4.1 规则上收策略

- 在 `eslint.config.js` 中新增 `utils/shared` 生产源码 override，仅对该目录启用 `@typescript-eslint/no-explicit-any` warning。
- 第二轮仅对 `server/utils/object.ts` 与 `server/utils/pagination.ts` 启用同一条规则，避免把 `server/utils` 整体提升成高噪音目录级治理。
- 第三轮仅对 `composables/use-post-editor-io.ts` 启用 `@typescript-eslint/no-non-null-assertion`，继续保持 `composables/**` 其余文件不受该规则影响，确保回滚边界仍然等于“单文件 + 配置一处”。
- 新一轮继续沿用 `@typescript-eslint/no-explicit-any` 的单文件切片策略，对 `composables/use-post-editor-voice.ts` 清掉显式 `any` 后再把该文件并入既有的 `no-explicit-any` override；不为同一条规则继续复制一份新的 `files` / `ignores` 判断。
- 再下一刀继续沿用同一口径，对 `server/api/categories/index.get.ts` 这类已有同级测试、且只剩单个 `attachTranslations(... as any)` 调用点的入口，用显式泛型替代 cast，并把该文件纳入 `no-explicit-any` 的 API 子组，而不是再新增一条散落 override。
- 当前轮按 todo 的回退方案，继续沿用同一条 `@typescript-eslint/no-explicit-any` 的单文件切片策略，对 `composables/use-tts-task.ts` 中的 `$fetch<any>` 与 `catch (e: any)` 收窄为本地任务状态 payload 和 `unknown` 错误解析，并直接并入既有的 `noExplicitAnyFiles` 聚合列表。
- `eslint.config.js` 中重复出现的 TS `files` / `ignores` 作用域，应优先抽成共享常量与轻量 helper，再在不同规则切片间复用，避免随着治理轮次增加让配置本身成为新的重复代码热点。
- 若目录级 ESLint 仅被受影响目录内的既有 `max-lines` 告警阻塞，优先复用现有工具函数或删除重复实现压回阈值，而不是先加规则豁免。
- 测试文件中的 `as any` 保持豁免，避免为了非法输入断言或 mock 边界而把本轮切片扩写到测试治理。
- 新增治理页进入 `docs/design/governance/index.md` 后，必须同步接入 `docs/.vitepress/config.ts` 的“专项设计与治理”侧边栏分组，避免设计文档事实源与文档站导航漂移。

### 4.2 代码收敛策略

- 通过 `MarkdownRendererInstance['renderer']['rules']['image']` 派生参数类型，收敛图片渲染 fallback 回调中的 `any`。
- 为自定义容器渲染建立窄类型别名，去掉 `MarkdownItContainer as any` 与容器 `render(tokens: any, idx: number)` 的显式 `any`。
- 把 `assignDefined()` 内部的赋值桥接改写为 `Record<keyof S & keyof T, unknown>` 视图，去掉目标对象同步时的显式 `any`。
- 将 `parsePagination()` 的输入从 `any` 收紧为 `unknown`，保持 `zod safeParse` 的既有行为不变。
- 将 `use-post-editor-io.ts` 中 frontmatter 多别名读取的非空断言改写为局部变量与显式守卫，保持音频导入、封面导入与基础字段导入行为不变。
- 将 `use-asr-direct.ts` 里的重复 PCM 转换 helper 删除，改为复用 `utils/web/audio-compression.ts` 中现有的 `float32ToPcmInt16()`，以最小变更消除目录级 `max-lines` blocker。
- 将 `server/api/categories/index.get.ts` 中的 `attachTranslations(items as any, ...)` 改为显式 `attachTranslations<Category>(items, ...)`，用实体基线类型替代调用点 cast，不改动 helper 契约。
- 将 `use-tts-task.ts` 中的轮询响应收敛为本地 `TTSTaskStatusPayload` / `TTSTaskResultPayload`，复用 `AITaskStatus` 事实源，避免继续依赖 `$fetch<any>` 与 `catch (error: any)`。
- 保持 Markdown 渲染输出、图片占位符替换、提示块与 code-group 容器结构不变。

## 5. 回滚边界

- 配置回滚：只需回退 `eslint.config.js` 中新增的 `utils/shared` override。
- 第二轮配置回滚：只需回退 `eslint.config.js` 中针对 `server/utils/object.ts` 与 `server/utils/pagination.ts` 的窄 override。
- 第三轮配置回滚：只需回退 `eslint.config.js` 中针对 `composables/use-post-editor-io.ts` 的窄 override。
- 新一轮 `no-explicit-any` 配置回滚：只需从聚合后的 `no-explicit-any` override 中移除 `composables/use-post-editor-voice.ts`，不影响其它既有窄切片。
- API 单文件 `no-explicit-any` 配置回滚：只需从 `noExplicitAnyApiFiles` 中移除 `server/api/categories/index.get.ts`，不影响工具层与 composable 切片。
- 当前回退切片配置回滚：只需从聚合后的 `no-explicit-any` override 中移除 `composables/use-tts-task.ts`，不影响其它既有窄切片。
- 代码回滚：只需回退 `utils/shared/markdown.ts` 的类型收敛改动。
- 第二轮代码回滚：只需回退 `server/utils/object.ts` 与 `server/utils/pagination.ts` 的类型收敛改动。
- 第三轮代码回滚：只需回退 `composables/use-post-editor-io.ts` 中 frontmatter 别名读取的局部变量与守卫改动。
- 新一轮代码回滚：只需回退 `composables/use-post-editor-voice.ts` 中本地 Web Speech / 错误对象类型与配置响应归一化收窄。
- API 单文件代码回滚：只需回退 `server/api/categories/index.get.ts` 中 `attachTranslations<Category>(...)` 的显式泛型调用。
- 当前回退切片代码回滚：只需回退 `composables/use-tts-task.ts` 中本地任务状态 payload、音频结果提取与错误消息解析收窄。
- 目录级 ESLint 收口补刀回滚：只需回退 `composables/use-asr-direct.ts` 对 `float32ToPcmInt16()` 的复用接线。
- 文档站回滚：若撤回本轮治理页，需同步回退 `docs/.vitepress/config.ts` 中新增的侧边栏入口。
- 文档回滚：只需回退本设计文档、`todo.md` 与 `docs/reports/regression/current.md` 的本轮记录。

## 6. 验证矩阵

- V0：记录候选规则、命中范围、收益与回滚边界。
- V1：执行受影响文件定向 ESLint、编辑器诊断与 Nuxt typecheck。
- V2：执行 `utils/shared/markdown.test.ts`，确认 Markdown 图片占位符、容器渲染与锚点行为未回归。
- V2：执行 `server/utils/object.test.ts` 与 `server/utils/pagination.test.ts`，确认对象同步与分页参数解析行为未回归。
- V2：执行 `composables/use-post-editor-io.test.ts`，确认 frontmatter 导入、音频元数据映射与拖拽导入行为未回归。
- V2：执行 `composables/use-asr-direct.test.ts`，确认 ASR 直连重连、停止与音频发送行为未回归。
- V2：执行 `composables/use-post-editor-voice.test.ts`，确认 Web Speech、云端批量与流式回退行为未回归。
- V2：执行 `composables/use-tts-task.test.ts`，确认 TTS 任务轮询、结果解析与错误回退行为未回归。
- V2：执行 `tests/server/api/categories/index.get.test.ts`，确认分类公开列表分页、翻译回退、聚合与缓存行为未回归。
- 文档验证：执行 `pnpm docs:build`，确认新增治理页与侧边栏配置已被文档站正确接入。
- RG：在 `docs/reports/regression/current.md` 中沉淀 Review Gate 结论、未覆盖边界与下一轮候选。

## 7. 残余债务与下一轮候选

### 7.1 当前仍保留的债务

- `no-explicit-any` 仍未扩展到 `server/**`、`composables/**`、前端组件层与测试层。
- `use-post-editor-voice.ts` 本轮已完成 `@typescript-eslint/no-explicit-any` 清零，但这不等同于 `composables/**` 整体已具备提级条件；后续仍需继续维持单文件 / 双文件节奏。
- `server/api/categories/index.get.ts` 已完成当前单文件切片，但 `server/api/tags/index.get.ts` 与 `server/api/posts/index.get.ts` 中同类 `attachTranslations(... as any)` 仍保留为后续候选，避免当前收口扩成多入口治理。
- `use-tts-task.ts` 当前已完成回退切片，但这不等同于 TTS 相关 composable 整体已具备提级条件；`use-upload.ts`、`use-tts-volcengine-direct.ts` 与其它任务轮询链路仍需继续按单文件 / 双文件节奏评估。
- `no-non-null-assertion` 目前只在 `composables/use-post-editor-io.ts` 单文件切片中上收；`use-asr-direct.ts` 的目录级 `max-lines` blocker 已通过复用现有 PCM helper 收敛，但并未继续扩写为独立 ASR helper 下沉工程。
- `prefer-nullish-coalescing`、`no-unsafe-*` 仍属于更宽的规则族，本轮不触碰。

### 7.2 下一轮候选规则建议

- 继续按目录切片推进 `@typescript-eslint/no-explicit-any`，优先选择 shared / server 中命中继续集中的单文件或单模块组，而不是直接全仓提级。
- 若要继续推进 `@typescript-eslint/no-non-null-assertion`，优先保持“单一 composable / 单一链路”切片策略，而不是直接把规则外溢到整个 `composables/**`。
- 若要处理 warning 债，优先评估生产源码范围的 `@typescript-eslint/no-unused-vars` 是否适合从 warning 升为 error，但必须先确认当前命中已足够窄。

## 8. 证据落点

- 实施结果与验证记录：`docs/reports/regression/current.md`
- 当前阶段执行状态：`docs/plan/todo.md`
