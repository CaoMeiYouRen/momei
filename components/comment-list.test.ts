import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import CommentList from './comment-list.vue'
import { CommentStatus } from '@/types/comment'

describe('CommentList', () => {
    const postId = 'post-1'

    it('renders loading state initially', async () => {
        // Mock slow endpoint
        registerEndpoint(`/api/posts/${postId}/comments`, () => new Promise((resolve) => {
            setTimeout(() => resolve({ code: 200, data: [] }), 100)
        }))

        const wrapper = await mountSuspended(CommentList, {
            props: { postId },
        })

        expect(wrapper.find('.comment-system__loading').exists()).toBe(true)
    })

    it('renders empty message when no comments', async () => {
        registerEndpoint(`/api/posts/${postId}/comments`, () => ({
            code: 200,
            data: [],
        }))

        const wrapper = await mountSuspended(CommentList, {
            props: { postId },
        })

        // Wait for fetch
        await vi.waitFor(() => {
            if (wrapper.text().includes('暂无评论')) {
                return true
            }
            throw new Error('Not empty')
        })

        expect(wrapper.text()).toContain('暂无评论')
    })

    it('renders list of comments', async () => {
        registerEndpoint(`/api/posts/${postId}/comments`, () => ({
            code: 200,
            data: [
                {
                    id: '1',
                    postId,
                    authorId: null,
                    parentId: null,
                    content: 'Hello World',
                    authorName: 'Guest 1',
                    authorUrl: null,
                    status: CommentStatus.PUBLISHED,
                    isSticked: false,
                    likes: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    replies: [],
                },
            ],
        }))

        const wrapper = await mountSuspended(CommentList, {
            props: { postId },
        })

        await vi.waitFor(() => {
            if (wrapper.text().includes('Guest 1')) {
                return true
            }
            throw new Error('Comment not found')
        })

        expect(wrapper.text()).toContain('Hello World')
        expect(wrapper.text()).toContain('评论')
        // Total count check
        expect(wrapper.find('.comment-system__count').text()).toBe('(1)')
    })
})
