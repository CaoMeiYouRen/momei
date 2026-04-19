import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import CommentItem from './comment-item.vue'
import { CommentStatus, type Comment } from '@/types/comment'

describe('CommentItem', () => {
    const mockComment: Comment = {
        id: '1',
        postId: 'post-1',
        authorId: null,
        parentId: null,
        content: 'Test content',
        authorName: 'Test User',
        authorUrl: null,
        status: CommentStatus.PUBLISHED,
        isSticked: false,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
    }

    it('renders published comment normally', async () => {
        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: mockComment,
            },
        })

        expect(wrapper.text()).toContain('Test User')
        expect(wrapper.text()).toContain('Test content')
        expect(wrapper.text()).not.toContain('comments.pending_audit')
    })

    it('renders avatar and content images with lazy loading', async () => {
        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: {
                    ...mockComment,
                    content: '![comment img](/comment.jpg)',
                },
            },
        })

        // Check avatar
        const avatarImg = wrapper.find('.comment-item__avatar-img')
        expect(avatarImg.exists()).toBe(true)
        expect(avatarImg.attributes('loading')).toBe('lazy')
        expect(avatarImg.attributes('decoding')).toBe('async')

        // Check content image
        const contentImg = wrapper.find('.comment-item__main img')
        expect(contentImg.exists()).toBe(true)
        expect(contentImg.attributes('loading')).toBe('lazy')
        expect(contentImg.attributes('decoding')).toBe('async')
    })

    it('renders pending audit message for pending comments', async () => {
        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: {
                    ...mockComment,
                    status: CommentStatus.PENDING,
                },
            },
        })

        // 检查实际翻译后的文本
        expect(wrapper.text()).toContain('您的评论已提交')
    })

    it('renders author tag if authorId is present', async () => {
        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: {
                    ...mockComment,
                    authorId: 'user-1',
                },
            },
        })

        expect(wrapper.text()).toContain('作者')
    })

    it('renders sticked tag if isSticked is true', async () => {
        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: {
                    ...mockComment,
                    isSticked: true,
                },
            },
        })

        expect(wrapper.text()).toContain('置顶')
    })

    it('emits reply event when reply button is clicked', async () => {
        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: mockComment,
            },
        })

        const replyButton = wrapper.find('button') // PrimeVue button
        await replyButton.trigger('click')

        const emitted = wrapper.emitted('reply')
        expect(emitted).toBeTruthy()
        expect(emitted?.[0]?.[0]).toEqual(mockComment)
    })

    it('toggles translated content and can switch back to original', async () => {
        registerEndpoint('/api/ai/comment-translation', () => ({
            code: 200,
            data: {
                commentId: mockComment.id,
                targetLanguage: 'zh-CN',
                content: '翻译后的评论',
                updatedAt: new Date().toISOString(),
                fromCache: false,
            },
        }))

        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: mockComment,
            },
        })

        const buttons = wrapper.findAll('button')
        const translateButton = buttons[1]
        expect(translateButton?.text()).toContain('查看翻译')

        await translateButton!.trigger('click')

        await vi.waitFor(() => {
            if (wrapper.text().includes('翻译后的评论')) {
                return true
            }
            throw new Error('Translated content not found')
        })

        expect(wrapper.text()).toContain('AI 翻译结果仅供参考')
        expect(wrapper.text()).toContain('查看原文')

        await translateButton!.trigger('click')

        await vi.waitFor(() => {
            if (wrapper.text().includes('Test content')) {
                return true
            }
            throw new Error('Original content not restored')
        })
    })

    it('keeps original content when translation request fails', async () => {
        registerEndpoint('/api/ai/comment-translation', () => {
            throw createError({
                statusCode: 500,
                statusMessage: 'Translation failed',
            })
        })

        const wrapper = await mountSuspended(CommentItem, {
            props: {
                comment: mockComment,
            },
        })

        const buttons = wrapper.findAll('button')
        await buttons[1]!.trigger('click')

        await vi.waitFor(() => {
            if (wrapper.text().includes('翻译暂时不可用，请稍后重试')) {
                return true
            }
            throw new Error('Translation error not rendered')
        })

        expect(wrapper.text()).toContain('Test content')
    })
})
