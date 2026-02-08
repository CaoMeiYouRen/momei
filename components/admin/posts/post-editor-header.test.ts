import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostEditorHeader from './post-editor-header.vue'
import { PostStatus, PostVisibility } from '@/types/post'

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
        hasTranslation: (lang: string) => null,
        getStatusLabel: (status: string) => status,
        getStatusSeverity: (status: string) => 'info',
        saving: false,
        isNew: true,
        aiLoading: {},
        titleSuggestions: [],
    }

    it('renders title input correctly', async () => {
        const wrapper = await mountSuspended(PostEditorHeader, {
            props: defaultProps,
        })

        const input = wrapper.find('.title-input')
        expect(input.exists()).toBe(true)
        expect((input.element as HTMLInputElement).value).toBe('Test Post')
    })

    it('groups AI tools in ButtonGroup', async () => {
        const wrapper = await mountSuspended(PostEditorHeader, {
            props: defaultProps,
        })

        const aiGroup = wrapper.find('.ai-tools-group')
        expect(aiGroup.exists()).toBe(true)
        expect(aiGroup.findAll('button').length).toBe(3) // Suggest, Translate, Format
    })

    it('renders status tag and translation badges in right bar', async () => {
        const wrapper = await mountSuspended(PostEditorHeader, {
            props: {
                ...defaultProps,
                post: { ...mockPost, status: PostStatus.PUBLISHED },
            },
        })

        const rightBar = wrapper.find('.top-bar-right')
        expect(rightBar.findComponent({ name: 'Tag' }).exists()).toBe(true)
        expect(rightBar.find('.translation-status-bar').exists()).toBe(true)
    })
})
