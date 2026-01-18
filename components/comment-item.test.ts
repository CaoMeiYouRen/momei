import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
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
})
