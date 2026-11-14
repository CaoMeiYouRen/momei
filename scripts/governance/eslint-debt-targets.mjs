export const RUNTIME_TS_IGNORES = ['**/*.test.*', '**/*.spec.*', 'tests/**', 'scripts/**']
export const PRODUCTION_TS_IGNORES = [...RUNTIME_TS_IGNORES, 'server/api/admin/migrations/**', '**/migration-*.ts']
// typed 规则不进 nuxt.config.ts（allowDefaultProject 下无类型信息，会直接抛错）
export const PRODUCTION_TYPED_TS_IGNORES = [...PRODUCTION_TS_IGNORES, 'nuxt.config.ts']

const NO_EXPLICIT_ANY_UTILITY_FILES = [
    'types/ad.ts',
    'utils/shared/**/*.{ts,tsx,mts,cts}',
    'server/utils/object.ts',
    'server/utils/pagination.ts',
    'server/utils/ad.ts',
    'server/utils/agreement-public.ts',
    'server/utils/post-access.ts',
    'server/services/adapters/base.ts',
    'server/services/upload.ts',
    'server/services/setting.ts',
]

const NO_EXPLICIT_ANY_API_FILES = [
    'server/api/categories/index.get.ts',
    'server/api/posts/index.get.ts',
    'server/api/tags/index.get.ts',
]

const NO_EXPLICIT_ANY_AGREEMENTS_API_FILES = [
    'server/api/admin/agreements/index.get.ts',
    'server/api/admin/agreements/index.post.ts',
    'server/api/admin/agreements/[id].put.ts',
    'server/api/admin/agreements/[id].delete.ts',
    'server/api/admin/agreements/[id]/activate.post.ts',
    'server/api/admin/agreements/[id]/review-status.post.ts',
]

const NO_EXPLICIT_ANY_SUBMISSIONS_API_FILES = [
    'server/api/admin/submissions/[id].delete.ts',
    'server/api/admin/submissions/[id]/review.put.ts',
]

const NO_EXPLICIT_ANY_AI_UTILS_FILES = [
    'server/utils/ai/tts-openai.ts',
    'server/utils/ai/tts-siliconflow.ts',
]

const NO_EXPLICIT_ANY_APP_FILES = [
    'app.vue',
]

const NO_EXPLICIT_ANY_ADMIN_SETTINGS_FILES = [
    'components/admin/settings/analytics-settings.vue',
    'components/admin/settings/auth-settings.vue',
    'components/admin/settings/security-settings.vue',
]

const NO_EXPLICIT_ANY_CONFIG_FILES = [
    'nuxt.config.ts',
]

const NO_EXPLICIT_ANY_ADMIN_FILES = [
    'components/admin/admin-taxonomy-page.vue',
]

const NO_EXPLICIT_ANY_SCHEMA_FILES = [
    'utils/schemas/submission.ts',
]

const NO_EXPLICIT_ANY_PAGE_FILES = [
    'pages/settings.vue',
]

const NO_EXPLICIT_ANY_COMPONENT_FILES = [
    'components/commercial-link-manager.vue',
]

const NO_EXPLICIT_ANY_SERVER_AUTH_FILES = [
    'server/utils/validate-api-key.ts',
]

const NO_EXPLICIT_ANY_TRANSLATION_FILES = [
    'server/utils/translation.ts',
]

const NO_EXPLICIT_ANY_AI_TYPE_FILES = [
    'types/ai.ts',
]

export const NO_EXPLICIT_ANY_FILES = [
    ...NO_EXPLICIT_ANY_UTILITY_FILES,
    ...NO_EXPLICIT_ANY_API_FILES,
    ...NO_EXPLICIT_ANY_AGREEMENTS_API_FILES,
    ...NO_EXPLICIT_ANY_SUBMISSIONS_API_FILES,
    ...NO_EXPLICIT_ANY_AI_UTILS_FILES,
    ...NO_EXPLICIT_ANY_APP_FILES,
    ...NO_EXPLICIT_ANY_ADMIN_SETTINGS_FILES,
    ...NO_EXPLICIT_ANY_CONFIG_FILES,
    ...NO_EXPLICIT_ANY_ADMIN_FILES,
    ...NO_EXPLICIT_ANY_SCHEMA_FILES,
    ...NO_EXPLICIT_ANY_PAGE_FILES,
    ...NO_EXPLICIT_ANY_COMPONENT_FILES,
    ...NO_EXPLICIT_ANY_SERVER_AUTH_FILES,
    ...NO_EXPLICIT_ANY_TRANSLATION_FILES,
    ...NO_EXPLICIT_ANY_AI_TYPE_FILES,
    'composables/use-admin-ai.ts',
    'composables/use-admin-i18n.ts',
    'composables/use-asr-task.ts',
    'composables/use-onboarding.ts',
    'composables/use-post-editor-ai.ts',
    'composables/use-post-editor-auto-save.ts',
    'composables/use-post-editor-io.ts',
    'composables/use-post-editor-page.helpers.ts',
    'composables/use-post-editor-voice.ts',
    'composables/use-tts-task.ts',
    'composables/use-tts-volcengine-direct.ts',
    'composables/use-upload.ts',
    'server/services/ai/tts.ts',
]

export const NO_NON_NULL_ASSERTION_FILES = [
    'composables/use-post-editor-io.ts',
    'server/services/ad.ts',
    'utils/shared/citable-content.ts',
    'server/services/ai/text.ts',
    'server/api/posts/index.get.ts',
    'server/services/notification.ts',
    'utils/shared/social-post-platforms.ts',
]

/**
 * 生产 TS / Vue 代码中已生效的 ban-ts-comment 切片。
 * 测试与脚本维持显式豁免边界，若扩到 tests / scripts 需单列条目。
 */
export const BAN_TS_COMMENT_FILES = ['**/*.{ts,tsx,mts,cts,vue}']

/**
 * `eslint.config.js` 中显式配置为 `[0]` / `[0, opts]` 的 25 条规则。
 * 用于 inventory 产出「规则 × configuredSeverity × effectiveSeverity × 命中数」表，
 * 候选规则须同时满足 configuredSeverity === 0 且未被 `strictTsRuleOverrides` 覆盖。
 */
export const DISABLED_TS_RULES = [
    'non-nullable-type-assertion-style',
    'no-inferrable-types',
    'explicit-function-return-type',
    'prefer-nullish-coalescing',
    'no-extraneous-class',
    'no-confusing-void-expression',
    'use-unknown-in-catch-callback-variable',
    'restrict-template-expressions',
    'no-non-null-assertion',
    'no-unnecessary-condition',
    'restrict-plus-operands',
    'ban-ts-comment',
    'no-unnecessary-type-arguments',
    'prefer-reduce-type-parameter',
    'explicit-module-boundary-types',
    'no-explicit-any',
    'no-unsafe-argument',
    'no-unsafe-assignment',
    'no-unsafe-member-access',
    'no-unsafe-return',
    'no-unsafe-call',
    'unbound-method',
    'no-dynamic-delete',
    'no-unnecessary-type-conversion',
    'no-unnecessary-type-assertion',
].map((ruleName) => ({
    ruleId: `@typescript-eslint/${ruleName}`,
    scope: ruleName,
}))

export const ESLINT_DEBT_RULE_SLICES = [
    {
        files: NO_EXPLICIT_ANY_FILES,
        ignores: [...RUNTIME_TS_IGNORES],
        rationale: '继续以工具层、API 单文件与高 ROI composable 为 no-explicit-any 的窄切片治理范围。',
        ruleId: '@typescript-eslint/no-explicit-any',
        scope: 'no-explicit-any',
    },
    {
        files: NO_NON_NULL_ASSERTION_FILES,
        ignores: [],
        rationale: '先维持 post editor IO 单文件的非空断言收敛切片，避免一次性扩散到全仓。',
        ruleId: '@typescript-eslint/no-non-null-assertion',
        scope: 'no-non-null-assertion',
    },
    {
        files: BAN_TS_COMMENT_FILES,
        ignores: [...PRODUCTION_TS_IGNORES],
        rationale: 'ESLint 严格规则首批：生产 TS / Vue 已无 @ts-<directive> 命中，先在生产范围升为 warning 锁定回归。',
        ruleId: '@typescript-eslint/ban-ts-comment',
        scope: 'ban-ts-comment',
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        ignores: [...PRODUCTION_TYPED_TS_IGNORES],
        rationale: 'ESLint 严格规则第二批：生产 TS 的 reduce 显式类型参数已清零，升 warning 锁定回归。',
        ruleId: '@typescript-eslint/prefer-reduce-type-parameter',
        scope: 'prefer-reduce-type-parameter',
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        ignores: [...PRODUCTION_TYPED_TS_IGNORES],
        rationale: 'ESLint 严格规则第二批：纯静态类已改为对象字面量（静态基类单独 allowStaticOnly），升 warning 锁定回归。',
        ruleId: '@typescript-eslint/no-extraneous-class',
        scope: 'no-extraneous-class',
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        ignores: [...PRODUCTION_TYPED_TS_IGNORES],
        rationale: 'ESLint 严格规则第二批：生产 TS 的跨类型加法已清零，升 warning 锁定回归。',
        ruleId: '@typescript-eslint/restrict-plus-operands',
        scope: 'restrict-plus-operands',
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        ignores: [...PRODUCTION_TYPED_TS_IGNORES],
        rationale: 'ESLint 严格规则第二批：生产 TS 的非空类型断言已清零，升 warning 锁定回归。',
        ruleId: '@typescript-eslint/non-nullable-type-assertion-style',
        scope: 'non-nullable-type-assertion-style',
    },
]
