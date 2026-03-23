import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostTranslationWorkflowDialog from './post-translation-workflow-dialog.vue'
import type {
    PostTranslationTargetStatus,
    TranslationScopeField,
} from '@/types/post-translation'

const translations: Record<string, string> = {
    'common.cancel': '取消',
    'pages.admin.posts.translation_workflow.title': '全文翻译工作流',
    'pages.admin.posts.translation_workflow.intro': 'intro',
    'pages.admin.posts.translation_workflow.no_sources': 'no_sources',
    'pages.admin.posts.translation_workflow.source_post': '来源文章',
    'pages.admin.posts.translation_workflow.select_source': '选择来源版本',
    'pages.admin.posts.translation_workflow.target_language': '目标语言',
    'pages.admin.posts.translation_workflow.target_status_title': '目标版本状态',
    'pages.admin.posts.translation_workflow.action_title': '本次动作',
    'pages.admin.posts.translation_workflow.source_language_value': '来源语言：{language}',
    'pages.admin.posts.translation_workflow.target_language_value': '目标语言：{language}',
    'pages.admin.posts.translation_workflow.scope_title': '翻译范围',
    'pages.admin.posts.translation_workflow.scope_hint': 'hint',
    'pages.admin.posts.translation_workflow.fields.title': '标题',
    'pages.admin.posts.translation_workflow.fields.content': '正文',
    'pages.admin.posts.translation_workflow.fields.summary': '摘要',
    'pages.admin.posts.translation_workflow.fields.category': '分类',
    'pages.admin.posts.translation_workflow.fields.tags': '标签',
    'pages.admin.posts.translation_workflow.fields.coverImage': '封面',
    'pages.admin.posts.translation_workflow.fields.audio': '播客音频',
    'pages.admin.posts.translation_workflow.same_language_warning': '来源语言和目标语言不能相同，请重新选择。',
    'pages.admin.posts.translation_workflow.actions.create': '新建翻译',
    'pages.admin.posts.translation_workflow.actions.continue': '继续翻译',
    'pages.admin.posts.translation_workflow.actions.overwrite': '覆盖翻译',
    'pages.admin.posts.translation_workflow.target_states.missing': '未创建版本',
    'pages.admin.posts.translation_workflow.target_states.draft': '草稿版本',
    'pages.admin.posts.translation_workflow.target_states.published': '已发布版本',
    'pages.admin.posts.translation_workflow.action_descriptions.create': 'create description',
    'pages.admin.posts.translation_workflow.action_descriptions.continue': 'continue description',
    'pages.admin.posts.translation_workflow.action_descriptions.overwrite': 'overwrite description',
    'pages.admin.posts.translation_workflow.switch_target_hint': '开始后会先切换到对应目标版本编辑器，并保留来源与范围选择。',
    'pages.admin.posts.translation_workflow.start': '开始翻译',
    'pages.admin.posts.translation_workflow.progress_running': '翻译进行中',
    'pages.admin.posts.translation_workflow.progress_completed': '翻译已完成',
    'pages.admin.posts.translation_workflow.progress_failed': '翻译失败',
    'pages.admin.posts.translation_workflow.current_field': '当前字段：{field}',
    'pages.admin.posts.translation_workflow.applied_content': '已回填内容',
    'pages.admin.posts.translation_workflow.applied_content_empty': '当前还没有已回填内容',
    'pages.admin.posts.translation_workflow.progress_detail': '已完成 {completed}/{total} 块',
    'pages.admin.posts.translation_workflow.retry_field': '重试字段',
    'pages.admin.posts.translation_workflow.cancel_field': '取消字段',
    'pages.admin.posts.translation_workflow.field_statuses.idle': '未开始',
    'pages.admin.posts.translation_workflow.field_statuses.pending': '等待中',
    'pages.admin.posts.translation_workflow.field_statuses.processing': '翻译中',
    'pages.admin.posts.translation_workflow.field_statuses.completed': '已完成',
    'pages.admin.posts.translation_workflow.field_statuses.failed': '失败',
    'pages.admin.posts.translation_workflow.field_statuses.cancelled': '已取消',
    'pages.admin.posts.translation_workflow.modes.direct': '直返回填',
    'pages.admin.posts.translation_workflow.modes.chunk': '分段回填',
    'pages.admin.posts.translation_workflow.modes.stream': '流式回填',
    'pages.admin.posts.translation_workflow.modes.task': '任务轮询',
}

function translate(key: string, params?: Record<string, string>) {
    const template = translations[key]

    if (!template) {
        return key
    }

    if (!params) {
        return template
    }

    return template.replace(/\{(\w+)\}/g, (_, token: string) => params[token] ?? `{${token}}`)
}

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
        }),
    }
})

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
        }),
    }
})

vi.stubGlobal('useI18n', () => ({
    t: translate,
}))

const defaultProps = {
    visible: true,
    locales: [
        { code: 'zh-CN', name: '简体中文' },
        { code: 'en-US', name: 'English' },
    ],
    sourceOptions: [
        {
            id: 'source-1',
            title: '源文章',
            language: 'zh-CN',
        },
    ],
    defaultSourcePostId: 'source-1',
    defaultTargetLanguage: 'en-US',
    defaultScopes: ['title', 'summary'] as TranslationScopeField[],
    targetStatuses: [
        {
            language: 'en-US',
            state: 'draft',
            action: 'continue',
            postId: 'draft-1',
            isCurrentEditor: true,
        },
        {
            language: 'zh-CN',
            state: 'published',
            action: 'overwrite',
            postId: 'post-zh',
            isCurrentEditor: false,
        },
    ] as PostTranslationTargetStatus[],
}

const globalOptions = {
    mocks: {
        $t: translate,
    },
    stubs: {
        Dialog: {
            template: '<div class="dialog-stub"><slot /><slot name="footer" /></div>',
        },
        Select: {
            props: ['modelValue', 'options', 'optionLabel', 'optionValue'],
            emits: ['update:modelValue'],
            template: '<select class="select-stub" />',
        },
        Message: {
            template: '<div class="message-stub"><slot /></div>',
        },
        Checkbox: {
            props: ['modelValue', 'binary', 'disabled'],
            emits: ['update:modelValue'],
            template: '<input class="checkbox-stub" type="checkbox" />',
        },
        Tag: {
            props: ['value', 'severity'],
            template: '<span class="tag-stub" :data-severity="severity">{{ value }}</span>',
        },
        ProgressBar: {
            props: ['value'],
            template: '<div class="progress-stub">{{ value }}</div>',
        },
        Button: {
            props: ['label', 'severity', 'disabled', 'loading'],
            emits: ['click'],
            template: '<button class="button-stub" :data-label="label" :data-severity="severity" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
        },
    },
}

describe('PostTranslationWorkflowDialog', () => {
    it('renders target draft state with continue action semantics', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: defaultProps,
            global: globalOptions,
        })

        await nextTick()

        expect(wrapper.text()).toContain('目标版本状态')
        expect(wrapper.text()).toContain('草稿版本')
        expect(wrapper.text()).toContain('继续翻译')
        expect(wrapper.text()).toContain('封面')
        expect(wrapper.text()).toContain('播客音频')

        const startButton = wrapper.find('button[data-label="继续翻译"]')
        expect(startButton.exists()).toBe(true)
        expect(startButton.attributes('data-severity')).toBe('warn')
    })

    it('emits action metadata and preserved scopes on start', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: defaultProps,
            global: globalOptions,
        })

        await nextTick()
        await wrapper.find('button[data-label="继续翻译"]').trigger('click')

        expect(wrapper.emitted('start')?.[0]?.[0]).toEqual({
            sourcePostId: 'source-1',
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
            scopes: ['title', 'summary'],
            action: 'continue',
            targetState: 'draft',
            targetPostId: 'draft-1',
        })
    })

    it('uses default scopes with cover image enabled and audio disabled', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: {
                ...defaultProps,
                defaultScopes: undefined,
            },
            global: globalOptions,
        })

        await nextTick()
        await wrapper.find('button[data-label="继续翻译"]').trigger('click')

        expect(wrapper.emitted('start')?.[0]?.[0]).toEqual(expect.objectContaining({
            scopes: ['title', 'content', 'summary', 'category', 'tags', 'coverImage'],
        }))
    })

    it('shows switch hint and danger action for published target in another editor', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: {
                ...defaultProps,
                defaultTargetLanguage: 'zh-CN',
            },
            global: globalOptions,
        })

        await nextTick()

        expect(wrapper.text()).toContain('已发布版本')
        expect(wrapper.text()).toContain('覆盖翻译')
        expect(wrapper.text()).toContain('开始后会先切换到对应目标版本编辑器，并保留来源与范围选择。')

        const startButton = wrapper.find('button[data-label="覆盖翻译"]')
        expect(startButton.attributes('data-severity')).toBe('danger')
    })

    it('shows same-language warning and disables start when source and target languages match', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: {
                ...defaultProps,
                defaultTargetLanguage: 'zh-CN',
                targetStatuses: [
                    {
                        language: 'zh-CN',
                        state: 'draft',
                        action: 'continue',
                        postId: 'draft-zh',
                        isCurrentEditor: true,
                    },
                ],
            },
            global: globalOptions,
        })

        await nextTick()

        expect(wrapper.text()).toContain('来源语言和目标语言不能相同，请重新选择。')
        expect(wrapper.find('button[data-label="继续翻译"]').attributes('disabled')).toBeDefined()
    })

    it('shows no-source warning and disables start when no source is available', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: {
                ...defaultProps,
                sourceOptions: [],
                defaultSourcePostId: null,
                targetStatuses: [],
            },
            global: globalOptions,
        })

        await nextTick()

        expect(wrapper.text()).toContain('no_sources')
        expect(wrapper.find('button[data-label="开始翻译"]').attributes('disabled')).toBeDefined()
    })

    it('shows progress details and failure message during translation', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: {
                ...defaultProps,
                progress: 66,
                translationStatus: 'failed',
                activeField: 'content',
                errorText: 'network error',
            },
            global: globalOptions,
        })

        await nextTick()

        expect(wrapper.text()).toContain('翻译失败')
        expect(wrapper.text()).toContain('当前字段：正文')
        expect(wrapper.text()).toContain('network error')
        expect(wrapper.text()).toContain('66')
    })

    it('shows tags progress card when tags scope is selected', async () => {
        const wrapper = await mountSuspended(PostTranslationWorkflowDialog, {
            props: {
                ...defaultProps,
                defaultScopes: ['tags'],
                progress: 100,
                translationStatus: 'completed',
                activeField: 'tags',
                fieldProgressMap: {
                    title: {
                        status: 'idle',
                        progress: 0,
                        mode: null,
                        content: '',
                        completedChunks: 0,
                        totalChunks: 0,
                        error: null,
                        canRetry: false,
                        canCancel: false,
                    },
                    summary: {
                        status: 'idle',
                        progress: 0,
                        mode: null,
                        content: '',
                        completedChunks: 0,
                        totalChunks: 0,
                        error: null,
                        canRetry: false,
                        canCancel: false,
                    },
                    content: {
                        status: 'idle',
                        progress: 0,
                        mode: null,
                        content: '',
                        completedChunks: 0,
                        totalChunks: 0,
                        error: null,
                        canRetry: false,
                        canCancel: false,
                    },
                    tags: {
                        status: 'completed',
                        progress: 100,
                        mode: 'direct',
                        content: 'Translated Tag',
                        completedChunks: 1,
                        totalChunks: 1,
                        error: null,
                        canRetry: false,
                        canCancel: false,
                    },
                },
            },
            global: globalOptions,
        })

        await nextTick()

        expect(wrapper.text()).toContain('当前字段：标签')
        expect(wrapper.text()).toContain('已完成 1/1 块')
        expect(wrapper.text()).toContain('Translated Tag')
        expect(wrapper.text()).toContain('直返回填')
    })
})
