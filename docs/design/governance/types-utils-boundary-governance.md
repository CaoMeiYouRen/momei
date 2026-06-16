# types/ 与 utils/shared/ 职责边界收敛治理

## 1. 问题定义

`types/` 目录应仅包含纯类型定义（`type` / `interface` / `import type`），`utils/shared/` 存放含运行时行为的复用代码（函数 / 常量 / Zod schema / 副作用）。

经过全量扫描（2026-06-16），发现以下边界违规：

| 类别 | 数量 | 详情 |
|:---|:---|:---|
| utils/ → types/（纯类型在 utils） | 1 | `email-template-preview.ts` |
| types/ → utils/（运行时代码在 types） | 2 | `utils.ts`（函数）、`copyright.ts`（常量+函数） |
| types/ SPLIT（常量与类型混放） | 5 | `post.ts`、`setting.ts`、`admin-content-insights.ts`、`federation.ts`、`migration-link-governance.ts` |
| types/ enum（灰色地带） | 8 | `ad.ts`、`comment.ts`、`friend-link.ts`、`post.ts`、`post-version.ts`、`setting.ts`、`snippet.ts`、`submission.ts` |

## 2. 迁移规则（统一规范）

### 规则 1：纯类型归 types/

- 文件仅包含 `type` / `interface` / `import type` + `export type` → 移至 `types/`
- 若原文件同时包含纯类型和运行时代码 → 拆分：类型留 `types/`，运行时代码迁 `utils/shared/`

### 规则 2：运行时代码归 utils/

- 函数（含 type guard）、常量（`const X = ...`）、Zod schema、带副作用的模块 → 必须在 `utils/`
- 从 `types/` 迁出时，新建 `utils/shared/<module>.ts`，文件名与 types/ 中的来源一一对应

### 规则 3：import 策略

- 运行时 import → `@/utils/shared/<module>`
- 类型 import → `@/types/<module>`（用 `import type`）
- 同一调用方可同时从两个来源 import，不使用 barrel re-export 桥接

### 规则 4：enum 暂不迁移

- TypeScript `enum` 编译为运行时代码，严格应归 `utils/`
- 但 8 个 enum 文件被 30+ 文件广泛引用，迁移代价过高
- 当前策略：保留在 `types/`，待后续评估 `const enum` / union type 替代方案

### 规则 5：新增文件守门

- 新建文件前先判断：含 `function` / `const` / Zod / 副作用 → `utils/`；纯类型 → `types/`
- Review Gate 检查：`types/` 下不得出现 `export function` 或 `export const`（`as const` 除外的运行时常量）

## 3. 首批迁移（第五十一阶段，已完成）

### 样本 1：`types/utils.ts` 函数迁出

- **原状**：`isSelectLocaleOption()` 函数定义在 `types/utils.ts`
- **处置**：函数迁至 `utils/shared/type-guards.ts`；类型 `SelectLocaleOption` 保留在 `types/utils.ts`
- **影响面**：0 个外部调用方（函数无外部引用），零 import 更新

### 样本 2：`types/copyright.ts` 常量+函数迁出

- **原状**：`COPYRIGHT_LICENSES` 常量 + `isCopyrightType()` / `resolveCopyrightType()` 在 `types/copyright.ts`
- **处置**：三者迁至 `utils/shared/copyright.ts`；类型 `CopyrightType` / `LicenseMeta` 保留在 `types/copyright.ts`
- **影响面**：7 个文件更新 import 路径

### 样本 3：`utils/shared/email-template-preview.ts` 类型迁入

- **原状**：4 个纯 `interface` 定义在 `utils/shared/`
- **处置**：整文件移至 `types/email-template-preview.ts`
- **影响面**：2 个文件更新 import 路径

## 4. 渐进式收敛顺序

### 第二轮（下一阶段候选）

| 优先级 | 文件 | 处置 |
|:---|:---|:---|
| 高 | `types/post.ts` — `AUDIT_*` 常量 | 迁至 `utils/shared/post-constants.ts` |
| 高 | `types/setting.ts` — `PUBLIC_SETTING_KEYS` | 迁至 `utils/shared/setting-constants.ts` |
| 中 | `types/admin-content-insights.ts` — `ADMIN_CONTENT_INSIGHT_RANGES` | 迁至 `utils/shared/admin-content-insights.ts` |

### 第三轮（延后）

| 优先级 | 文件 | 处置 |
|:---|:---|:---|
| 低 | `types/federation.ts` — 4 个常量 | 迁至 `utils/shared/federation-constants.ts` |
| 低 | `types/migration-link-governance.ts` — 13 个常量 | 迁至 `utils/shared/link-governance-constants.ts` |
| 观察 | 8 个 enum 文件 | 待评估 `const enum` 替代方案 |

## 5. 回滚边界

- 任何迁移必须保证 `pnpm typecheck` 零错误
- 若 import 更新导致循环依赖或类型推断退化，立即回滚该组迁移
- 每个样本独立可回滚，不形成级联依赖

## 6. 验证矩阵

| 检查项 | 命令 | 阈值 |
|:---|:---|:---|
| 类型检查 | `pnpm typecheck` | 零错误 |
| 代码风格 | `pnpm lint` | `--max-warnings 0` |
| types/ 纯类型 | `grep -r "export function\|export const" types/` | 仅允许 enum 和已记录例外 |
