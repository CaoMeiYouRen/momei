import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import PostEditorSettings from './post-editor-settings.vue'
import type { PostEditorData } from '@/types/post-editor'

/**
 * 编辑器设置面板：迁移后两条高风险回调的回归测试。
 *
 * 1. 标签字段改用 `CaomeiTagsInput`——迁移前是 `AutoComplete multiple`，而 caomei 的多选
 *    **没有自由文本入口**（`onEnter` / `commitFreeText` 都直接返回），若照搬会静默失去「新建标签」能力；
 * 2. `AutoComplete` 的清除按钮写空串（PrimeVue 写 `null`），`translationId` 必须归一为 `null`，
 *    否则空串会被当成合法「翻译簇键」参与 `IS NULL` / 相等匹配。
 */

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({ t: (key: string) => key }),
    }
})

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()

    return {
        ...actual,
        useConfirm: () => ({ confirm: vi.fn() }),
    }
})

vi.mock('@/composables/use-post-export', () => ({
    usePostExport: () => ({ exporting: { value: false }, exportPost: vi.fn() }),
}))

const CaomeiTagsInputStub = defineComponent({
    name: 'CaomeiTagsInput',
    props: { modelValue: { type: Array, default: () => [] }, placeholder: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('div', {
            class: 'tags-input-stub',
            'data-tags': (props.modelValue as string[]).join(','),
            onClick: () => emit('update:modelValue', [...(props.modelValue as string[]), 'new-tag']),
        })
    },
})

const CaomeiAutoCompleteStub = defineComponent({
    name: 'CaomeiAutoComplete',
    props: { modelValue: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('div', {
            class: 'auto-complete-stub',
            'data-value': props.modelValue,
            onClick: () => emit('update:modelValue', ''),
        })
    },
})

const PassThrough = (name: string) => defineComponent({
    name,
    setup: (_, { slots }) => () => h('div', slots.default?.()),
})

const stubs = {
    CaomeiButton: PassThrough('CaomeiButton'),
    CaomeiDivider: PassThrough('CaomeiDivider'),
    CaomeiInput: defineComponent({
        name: 'CaomeiInput',
        props: { modelValue: { type: String, default: '' } },
        emits: ['update:modelValue'],
        setup: () => () => h('input'),
    }),
    CaomeiSelect: defineComponent({ name: 'CaomeiSelect', setup: () => () => h('div', { class: 'select-stub' }) }),
    CaomeiInputGroup: PassThrough('CaomeiInputGroup'),
    CaomeiSwitch: defineComponent({ name: 'CaomeiSwitch', setup: () => () => h('span', { class: 'switch-stub' }) }),
    CaomeiTextarea: defineComponent({ name: 'CaomeiTextarea', setup: () => () => h('textarea') }),
    CaomeiAutoComplete: CaomeiAutoCompleteStub,
    CaomeiTagsInput: CaomeiTagsInputStub,
    AdminPostsPostEditorMediaSettings: defineComponent({
        name: 'AdminPostsPostEditorMediaSettings',
        setup: () => () => h('div', { class: 'media-settings-stub' }),
    }),
}

const createPost = (overrides: Partial<PostEditorData> = {}): PostEditorData => reactive({
    id: 'post-1',
    title: 'T',
    content: '',
    slug: 't',
    status: 'draft',
    visibility: 'public',
    password: null,
    summary: null,
    coverImage: null,
    metadata: null,
    categoryId: null,
    copyright: null,
    tags: [],
    isPinned: false,
    language: 'zh-CN',
    translationId: null,
    publishedAt: null,
    metaVersion: 0,
    views: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
} as PostEditorData)

const mountSettings = (post: PostEditorData) => mountSuspended(PostEditorSettings, {
    props: {
        post,
        errors: {},
        categories: [],
        aiLoading: {},
        postsForTranslation: [],
        languageOptions: [],
        licenseOptions: [],
        visibilityOptions: [],
        defaultLicenseLabel: '',
    },
    global: { stubs },
})

describe('post-editor-settings 迁移契约', () => {
    it('标签字段使用 TagsInput 并支持追加自由文本（新建标签）', async () => {
        const post = createPost({ tags: ['vue'] })
        const wrapper = await mountSettings(post)

        const tagsInput = wrapper.find('.tags-input-stub')
        expect(tagsInput.exists()).toBe(true)
        expect(tagsInput.attributes('data-tags')).toBe('vue')

        await tagsInput.trigger('click')
        expect(post.tags).toEqual(['vue', 'new-tag'])
    })

    it('翻译组清空时归一为 null，而非空串', async () => {
        const post = createPost({ translationId: 'group-1' })
        const wrapper = await mountSettings(post)

        const autoComplete = wrapper.find('.auto-complete-stub')
        expect(autoComplete.attributes('data-value')).toBe('group-1')

        await autoComplete.trigger('click')
        expect(post.translationId).toBeNull()
    })
})
