export const RUNTIME_TS_IGNORES = ['**/*.test.*', '**/*.spec.*', 'tests/**', 'scripts/**']
export const PRODUCTION_TS_IGNORES = [...RUNTIME_TS_IGNORES, 'server/api/admin/migrations/**', '**/migration-*.ts']

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

export const NO_EXPLICIT_ANY_FILES = [
    ...NO_EXPLICIT_ANY_UTILITY_FILES,
    ...NO_EXPLICIT_ANY_API_FILES,
    ...NO_EXPLICIT_ANY_AGREEMENTS_API_FILES,
    ...NO_EXPLICIT_ANY_SUBMISSIONS_API_FILES,
    ...NO_EXPLICIT_ANY_AI_UTILS_FILES,
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
]

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
]
