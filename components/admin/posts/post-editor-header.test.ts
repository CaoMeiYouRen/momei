import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostEditorHeader from './post-editor-header.vue'
import { PostStatus } from '@/types/post'
import type { PerspectiveMode } from '@/types/ai'

const stubs = {
    AppVoiceInputTrigger: {
        template: '<button class="voice-trigger-stub" />',
    },
    AdminPostsPostDistributionButton: {
        template: '<button class="distribution-button-stub" />',
    },
}

describe('PostEditorHeader', () => {
    const mockPost = {
        title: 'Test Post',
        content: '# Test Content',
        status: PostStatus.DRAFT,
        language: 'zh-CN',
    }

    const defaultProps = {
        post: mockPost,
        errors: {},
        locales: [
            { code: 'zh-CN', name: '中文' },
            { code: 'en-US', name: 'English' },
        ],
        hasTranslation: () => null,
        getStatusLabel: (status: string) => status,
        getStatusSeverity: () => 'info',
        saving: false,
        isNew: true,
        hasUnsavedContent: false,
        aiLoading: {},
        titleSuggestions: [],
        reviewSuggestions: [],
        reviewPanelVisible: false,
        perspectiveResults: [],
        perspectivePanelVisible: false,
        perspectiveMode: 'editor' as PerspectiveMode,
    }

    const mountHeader = (props = defaultProps) => mountSuspended(PostEditorHeader, {
        props,
        global: {
            mocks: {
                $t: (key: string) => key,
            },
            stubs,
        },
    })

    it('renders title input correctly', async () => {
        const wrapper = await mountHeader()

        const input = wrapper.find('.title-input')
        expect(input.exists()).toBe(true)
        expect((input.element as HTMLInputElement).value).toBe('Test Post')
    })

    it('groups AI tools in ButtonGroup (5 consolidated entries)', async () => {
        const wrapper = await mountHeader()

        const aiGroup = wrapper.find('.ai-tools-group')
        expect(aiGroup.exists()).toBe(true)
        // 5 entries: AI 写作 (SplitButton→2 buttons), AI 审校 (1), AI 翻译 (SplitButton→2), 格式化 (1), 语音 input (1) = 7 button elements total
        expect(aiGroup.findAll('button').length).toBe(7)
        // Verify the 5 key entry points exist
        const buttons = aiGroup.findAll('button')
        expect(buttons.length).toBeGreaterThanOrEqual(5)
    })

    it('renders status tag and translation badges in right bar', async () => {
        const wrapper = await mountHeader({
            ...defaultProps,
            post: { ...mockPost, status: PostStatus.PUBLISHED },
        })

        const rightBar = wrapper.find('.top-bar-right')
        expect(rightBar.findComponent({ name: 'Tag' }).exists()).toBe(true)
        expect(rightBar.find('.translation-status-bar').exists()).toBe(true)
    })

    it('emits translation switch after clicking a language badge', async () => {
        const wrapper = await mountHeader({
            ...defaultProps,
            post: { ...mockPost, title: '', content: '' },
        })

        await wrapper.find('.title-input').trigger('focus')
        await wrapper.findAll('.translation-badge')[1]?.trigger('click')
        await nextTick()

        expect(wrapper.emitted('handle-translation')).toEqual([['en-US']])
    })
})
