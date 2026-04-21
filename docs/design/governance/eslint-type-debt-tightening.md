# ESLint / 类型债与规则收紧治理

## 1. 概述

第三十阶段的“ESLint / 类型债与规则收紧治理 (P1)”继续沿长期主线推进，但本轮只冻结一个窄切片：`utils/shared` 生产源码范围的 `@typescript-eslint/no-explicit-any`。

本轮目标不是把历史 `any` 一次性清零，而是先在高复用的 shared 工具层建立一条可回滚、可复验的规则上收路径，并把当前命中收敛到单文件闭环。

## 2. 本轮范围与非目标

### 2.1 执行范围

- 规则配置：`eslint.config.js`
- shared Markdown 渲染器：`utils/shared/markdown.ts`
- 文档站导航：`docs/.vitepress/config.ts`
- 当前阶段待办与回归记录：`docs/plan/todo.md`、`docs/reports/regression/current.md`

### 2.2 非目标

- 不把 `@typescript-eslint/no-explicit-any` 外溢到全仓生产源码、测试、脚本或 `server/**` / `composables/**`。
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

## 4. 实施策略

### 4.1 规则上收策略

- 在 `eslint.config.js` 中新增 `utils/shared` 生产源码 override，仅对该目录启用 `@typescript-eslint/no-explicit-any` warning。
- 测试文件中的 `as any` 保持豁免，避免为了非法输入断言或 mock 边界而把本轮切片扩写到测试治理。
- 新增治理页进入 `docs/design/governance/index.md` 后，必须同步接入 `docs/.vitepress/config.ts` 的“专项设计与治理”侧边栏分组，避免设计文档事实源与文档站导航漂移。

### 4.2 代码收敛策略

- 通过 `MarkdownRendererInstance['renderer']['rules']['image']` 派生参数类型，收敛图片渲染 fallback 回调中的 `any`。
- 为自定义容器渲染建立窄类型别名，去掉 `MarkdownItContainer as any` 与容器 `render(tokens: any, idx: number)` 的显式 `any`。
- 保持 Markdown 渲染输出、图片占位符替换、提示块与 code-group 容器结构不变。

## 5. 回滚边界

- 配置回滚：只需回退 `eslint.config.js` 中新增的 `utils/shared` override。
- 代码回滚：只需回退 `utils/shared/markdown.ts` 的类型收敛改动。
- 文档站回滚：若撤回本轮治理页，需同步回退 `docs/.vitepress/config.ts` 中新增的侧边栏入口。
- 文档回滚：只需回退本设计文档、`todo.md` 与 `docs/reports/regression/current.md` 的本轮记录。

## 6. 验证矩阵

- V0：记录候选规则、命中范围、收益与回滚边界。
- V1：执行受影响文件定向 ESLint、编辑器诊断与 Nuxt typecheck。
- V2：执行 `utils/shared/markdown.test.ts`，确认 Markdown 图片占位符、容器渲染与锚点行为未回归。
- 文档验证：执行 `pnpm docs:build`，确认新增治理页与侧边栏配置已被文档站正确接入。
- RG：在 `docs/reports/regression/current.md` 中沉淀 Review Gate 结论、未覆盖边界与下一轮候选。

## 7. 残余债务与下一轮候选

### 7.1 当前仍保留的债务

- `no-explicit-any` 仍未扩展到 `server/**`、`composables/**`、前端组件层与测试层。
- `no-non-null-assertion`、`prefer-nullish-coalescing`、`no-unsafe-*` 仍属于更宽的规则族，本轮不触碰。

### 7.2 下一轮候选规则建议

- 继续按目录切片推进 `@typescript-eslint/no-explicit-any`，优先选择 shared / server 中命中继续集中的单文件或单模块组，而不是直接全仓提级。
- 若要推进 `@typescript-eslint/no-non-null-assertion`，应先按 `server`、`composables`、前端表单分别拆桶，再决定是否进入正式切片。
- 若要处理 warning 债，优先评估生产源码范围的 `@typescript-eslint/no-unused-vars` 是否适合从 warning 升为 error，但必须先确认当前命中已足够窄。

## 8. 证据落点

- 实施结果与验证记录：`docs/reports/regression/current.md`
- 当前阶段执行状态：`docs/plan/todo.md`
