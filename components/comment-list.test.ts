import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import CommentList from './comment-list.vue'
import { CommentStatus } from '@/types/comment'

const stubs = {
    CommentForm: {
        props: ['postId', 'parentId', 'replyToName'],
        emits: ['success', 'cancel-reply'],
        template: `
            <div class="comment-form" :data-parent-id="parentId || ''" :data-reply-to-name="replyToName || ''">
                <button class="comment-form__emit-success" @click="$emit('success')">success</button>
                <button class="comment-form__emit-cancel" @click="$emit('cancel-reply')">cancel</button>
            </div>
        `,
    },
    CommentItem: {
        props: ['comment'],
        emits: ['reply'],
        template: '<button class="comment-item" @click="$emit(\'reply\', comment)">{{ comment.authorName }}</button>',
    },
}

async function mountList(postId: string) {
    return mountSuspended(CommentList, {
        props: { postId },
        global: {
            stubs,
        },
    })
}

describe('CommentList', () => {
    it('renders loading state initially', async () => {
        const postId = 'post-loading'

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
        const postId = 'post-empty'

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
        }, { timeout: 5000 })

        expect(wrapper.text()).toContain('暂无评论')
    })

    it('renders list of comments', async () => {
        const postId = 'post-list'

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
        }, { timeout: 5000 })

        expect(wrapper.text()).toContain('Hello World')
        expect(wrapper.text()).toContain('评论')
        // Total count check
        expect(wrapper.find('.comment-system__count').text()).toBe('(1)')
    })

    it('counts nested replies recursively', async () => {
        const postId = 'post-threaded'

        registerEndpoint(`/api/posts/${postId}/comments`, () => ({
            code: 200,
            data: [
                {
                    id: '1',
                    postId,
                    authorId: null,
                    parentId: null,
                    content: 'Parent comment',
                    authorName: 'Guest 1',
                    authorUrl: null,
                    status: CommentStatus.PUBLISHED,
                    isSticked: false,
                    likes: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    replies: [
                        {
                            id: '2',
                            postId,
                            authorId: null,
                            parentId: '1',
                            content: 'Reply comment',
                            authorName: 'Guest 2',
                            authorUrl: null,
                            status: CommentStatus.PUBLISHED,
                            isSticked: false,
                            likes: 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            replies: [],
                        },
                    ],
                },
            ],
        }))

        const wrapper = await mountList(postId)

        await vi.waitFor(() => {
            expect(wrapper.find('.comment-system__count').text()).toBe('(2)')
        })
    })

    it('tracks reply targets, resets them and refreshes comments after submission', async () => {
        const postId = 'post-reply'
        let fetchCount = 0

        registerEndpoint(`/api/posts/${postId}/comments`, () => {
            fetchCount++

            return {
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
            }
        })

        const scrollIntoViewMock = vi.fn()
        vi.spyOn(document, 'querySelector').mockReturnValue({
            scrollIntoView: scrollIntoViewMock,
        } as unknown as Element)

        const wrapper = await mountList(postId)

        await vi.waitFor(() => {
            expect(wrapper.find('.comment-item').exists()).toBe(true)
        })

        await wrapper.get('.comment-item').trigger('click')
        expect(wrapper.get('.comment-form').attributes('data-parent-id')).toBe('1')
        expect(wrapper.get('.comment-form').attributes('data-reply-to-name')).toBe('Guest 1')
        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })

        await wrapper.get('.comment-form__emit-cancel').trigger('click')
        expect(wrapper.get('.comment-form').attributes('data-parent-id')).toBe('')

        await wrapper.get('.comment-item').trigger('click')
        await wrapper.get('.comment-form__emit-success').trigger('click')

        await vi.waitFor(() => {
            expect(fetchCount).toBe(2)
        })
        expect(wrapper.get('.comment-form').attributes('data-parent-id')).toBe('')
    })

    it('logs fetch errors and falls back to the empty state', async () => {
        const postId = 'post-error'
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        registerEndpoint(`/api/posts/${postId}/comments`, () => {
            throw new Error('fetch failed')
        })

        const wrapper = await mountList(postId)

        await vi.waitFor(() => {
            expect(wrapper.find('.comment-system__empty').exists()).toBe(true)
        })

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch comments:', expect.any(Error))
    })
})
