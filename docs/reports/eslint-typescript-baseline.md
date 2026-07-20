# TypeScript ESLint 规则基线报告

> **生成时间**: 2026-07-21
> **扫描范围**: 全仓（含测试文件），`eslint --format json`
> **扫描规则**: 将 `[0]` 全局临时改为 `[1]` 后扫描，完成后已恢复 `[0]`
> **用途**: 作为后续逐步启用 TypeScript 严格规则的数据基线

## 汇总

| 规则 | Warning 数 | 涉及文件数 | 严重程度 |
|------|-----------|-----------|---------|
| `@typescript-eslint/no-explicit-any` | 1080 | 210 | ⚠️ 高 |
| `@typescript-eslint/no-unsafe-assignment` | 830 | 216 | ⚠️ 高 |
| `@typescript-eslint/no-unsafe-member-access` | 1076 | 172 | ⚠️ 高 |
| `@typescript-eslint/no-unsafe-argument` | 649 | 139 | ⚠️ 高 |
| `@typescript-eslint/explicit-module-boundary-types` | 536 | 200 | ⚠️ 高 |
| `@typescript-eslint/no-unsafe-return` | 298 | 90 | ⚠️ 中 |
| `@typescript-eslint/no-unsafe-call` | 228 | 69 | ⚠️ 中 |
| `@typescript-eslint/unbound-method` | 242 | 56 | ⚠️ 中 |
| `@typescript-eslint/no-unnecessary-type-conversion` | 82 | 31 | ⚠️ 低 |

## 各规则详情

### `@typescript-eslint/no-explicit-any` (1080 warnings, 210 files)

不允许使用 `any` 类型。当前全局 `[0]`，采用「需要验证列表」模式逐步治理。

**Top 10 文件**:
- `server/services/post.test.ts` (93 warnings)
- `tests/server/notification.test.ts` (53 warnings)
- `server/utils/logger.ts` (38 warnings)
- `server/api/ai/image/generate.post.test.ts` (27 warnings)
- `tests/server/api/posts/index.get.test.ts` (24 warnings)
- `server/decorators/custom-column.test.ts` (20 warnings)
- `components/app-captcha.test.ts` (19 warnings)
- `server/utils/locale.test.ts` (18 warnings)
- `tests/server/api/search/index.get.test.ts` (17 warnings)
- `server/api/tasks/tts/[id].get.test.ts` (16 warnings)

**生产文件（非 test）集中点**: `server/utils/logger.ts` (38), `server/utils/ai/gemini-provider.ts` (26), `server/services/ai/tts.ts` (21), `server/utils/email/templates-fallback.ts` (29), `server/api/admin/ai/stats.get.ts` (30), `server/utils/author.ts`

### `@typescript-eslint/no-unsafe-assignment` (830 warnings, 216 files)

不允许将 `any` 类型的值赋值给其他类型。

**Top 10 文件**:
- `server/utils/logger.ts` (29 warnings)
- `server/utils/ai/gemini-provider.ts` (26 warnings)
- `server/api/ai/image/generate.post.test.ts` (23 warnings)
- `i18n/config/locale-runtime-loader.test.ts` (21 warnings)
- `server/services/ai/tts.ts` (21 warnings)
- `tests/server/api/posts/index.get.test.ts` (21 warnings)
- `tests/scripts/run-periodic-regression.test.ts` (18 warnings)
- `server/utils/ai/ai.test.ts` (17 warnings)
- `server/utils/feed.test.ts` (14 warnings)
- `components/app-captcha.test.ts` (13 warnings)

### `@typescript-eslint/no-unsafe-member-access` (1076 warnings, 172 files)

不允许对 `any` 类型的值进行成员访问。

**Top 10 文件**:
- `components/commercial-link-manager.test.ts` (64 warnings)
- `server/services/post.test.ts` (47 warnings)
- `server/utils/ai/gemini-provider.ts` (36 warnings)
- `pages/posts/[id].test.ts` (30 warnings)
- `server/api/admin/ai/stats.get.ts` (30 warnings)
- `server/utils/email/templates-fallback.ts` (29 warnings)
- `server/utils/email/service.test.ts` (25 warnings)
- `server/utils/validate-api-key.test.ts` (24 warnings)
- `tests/server/notification.test.ts` (23 warnings)
- `composables/use-post-editor-auto-save.test.ts` (21 warnings)

### `@typescript-eslint/no-unsafe-argument` (649 warnings, 139 files)

不允许传递 `any` 类型的值作为参数。

**Top 10 文件**:
- `composables/use-post-editor-auto-save.test.ts` (28 warnings)
- `tests/server/middleware/db-ready.test.ts` (26 warnings)
- `tests/server/api/posts/index.get.test.ts` (22 warnings)
- `server/services/post.test.ts` (19 warnings)
- `server/utils/locale.test.ts` (18 warnings)
- `server/api/tasks/tts/[id].get.test.ts` (16 warnings)
- `server/decorators/custom-column.test.ts` (15 warnings)
- `server/services/upload.test.ts` (13 warnings)
- `tests/server/api/categories/index.get.test.ts` (13 warnings)
- `server/api/admin/marketing/campaigns/[id]/cancel.post.test.ts` (12 warnings)

### `@typescript-eslint/explicit-module-boundary-types` (536 warnings, 200 files)

要求导出函数和类的公共类方法的显式返回和参数类型。

**Top 10 文件**:
- `composables/use-post-translation-ai.runtime.ts` (20 warnings)
- `server/services/ai/text.ts` (18 warnings)
- `server/services/friend-link.ts` (14 warnings)
- `composables/use-post-editor-page.helpers.ts` (12 warnings)
- `utils/web/post-distribution-dialog.ts` (12 warnings)
- `server/services/migration-link-governance.helpers.ts` (11 warnings)
- `server/services/upload.ts` (11 warnings)
- `utils/shared/date.ts` (10 warnings)
- `composables/use-post-translation-ai.helpers.ts` (9 warnings)
- `server/services/setting.constants.ts` (9 warnings)

### `@typescript-eslint/no-unsafe-return` (298 warnings, 90 files)

不允许从函数返回 `any` 类型的值。

**Top 10 文件**:
- `server/services/post.test.ts` (67 warnings)
- `tests/server/notification.test.ts` (37 warnings)
- `server/services/ai/image.test.ts` (9 warnings)
- `pages/login.test.ts` (8 warnings)
- `server/services/installation.test.ts` (8 warnings)
- `server/services/ai/post-automation.test.ts` (7 warnings)
- `tests/scripts/run-periodic-regression.test.ts` (7 warnings)
- `app.test.ts` (6 warnings)
- `server/utils/author.ts` (6 warnings)
- `tests/testSetup.ts` (6 warnings)

### `@typescript-eslint/no-unsafe-call` (228 warnings, 69 files)

不允许对 `any` 类型的值进行调用。

**Top 10 文件**:
- `server/utils/validate-api-key.test.ts` (19 warnings)
- `components/commercial-link-manager.test.ts` (18 warnings)
- `pages/posts/[id].test.ts` (14 warnings)
- `server/api/admin/marketing/campaigns.post.test.ts` (12 warnings)
- `server/api/admin/posts/[id]/repush.post.test.ts` (12 warnings)
- `server/api/ai/image/generate.post.test.ts` (8 warnings)
- `tests/scripts/run-periodic-regression.test.ts` (8 warnings)
- `server/services/ai/image.test.ts` (7 warnings)
- `components/app-header.test.ts` (6 warnings)
- `components/confirm-delete-dialog.test.ts` (6 warnings)

### `@typescript-eslint/unbound-method` (242 warnings, 56 files)

不允许不绑定上下文的类方法引用。

**Top 10 文件**:
- `server/services/post.test.ts` (26 warnings)
- `server/utils/pv-cache.test.ts` (22 warnings)
- `tests/server/notification.test.ts` (22 warnings)
- `server/services/ai/media-task-monitor.test.ts` (14 warnings)
- `server/services/comment-translation.test.ts` (13 warnings)
- `server/api/ai/translate.post.test.ts` (12 warnings)
- `server/services/friend-link.test.ts` (11 warnings)
- `server/services/installation.test.ts` (9 warnings)
- `server/services/ai/admin-drafts.test.ts` (7 warnings)
- `server/utils/translation.test.ts` (7 warnings)

### `@typescript-eslint/no-unnecessary-type-conversion` (82 warnings, 31 files)

禁止在表达式类型或值未发生变化时使用转换惯用法。

**Top 10 文件**:
- `server/services/friend-link.test.ts` (29 warnings)
- `server/services/email-template.ts` (8 warnings)
- `server/services/setting.test.ts` (5 warnings)
- `server/services/ai/quota-governance.test.ts` (3 warnings)
- `utils/shared/env.ts` (3 warnings)
- `composables/use-post-editor-voice.ts` (2 warnings)
- `server/services/ai/cost-display.ts` (2 warnings)
- `server/services/ai/usage-alerts.test.ts` (2 warnings)
- `server/services/upload.ts` (2 warnings)
- `server/utils/ai/cost-governance.ts` (2 warnings)

## 治理建议

### 按影响面排序

1. **`no-explicit-any`** (1080) — 核心债务，治理 `any` 后其他 unsafe 系列规则自然减少
2. **`no-unsafe-member-access`** (1076) — 与 `no-explicit-any` 强相关
3. **`no-unsafe-assignment`** (830) — 与 `no-explicit-any` 强相关
4. **`no-unsafe-argument`** (649) — 与 `no-explicit-any` 强相关
5. **`explicit-module-boundary-types`** (536) — 独立治理维度，主要影响 composable/service 导出
6. **`no-unsafe-return`** (298) — 与 `no-explicit-any` 强相关
7. **`no-unsafe-call`** (228) — 与 `no-explicit-any` 强相关
8. **`unbound-method`** (242) — 独立问题，主要存在于测试文件中 mock 调用
9. **`no-unnecessary-type-conversion`** (82) — 独立问题，修复成本低

### 按修复难度排序（从易到难）

1. **`no-unnecessary-type-conversion`** — 82 warnings，多数在测试中，可快速修复
2. **`unbound-method`** — 242 warnings，主要集中在测试 mock，可通过 `.bind()` 或箭头函数修复
3. **`explicit-module-boundary-types`** — 主要是缺少导出函数类型标注，逐个文件补即可
4. **`no-explicit-any` + unsafe 系列** — 治理 `any` 后这一族同步下降，可采用窄切片策略

### 当前策略

沿用「需要验证列表」模式（全局 `[0]`，`NO_EXPLICIT_ANY_FILES` 中的文件设 `[1]`），以 `no-explicit-any` 为切入点，逐步将高频文件加入验证列表并修复。

---

*报告自动生成于全仓扫描。如需更新，将目标规则临时改为 `[1]` 后执行 `eslint --format json .` 即可。*
