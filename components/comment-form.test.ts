import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CommentForm from './comment-form.vue'
import { authClient } from '@/lib/auth-client'

// Mock PrimeVue components
const stubs = {
    Button: {
        emits: ['click'],
        props: ['loading', 'label', 'type'],
        template: '<button :disabled="loading" :type="type" @click="$emit(\'click\')">{{ label }}<slot /></button>',
    },
    InputText: {
        props: ['modelValue'],
        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Textarea: {
        props: ['modelValue', 'placeholder'],
        template: '<textarea :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
}

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => ({ value: { data: null } })),
    },
}))

// Mock useToast
const mockToast = {
    add: vi.fn(),
}
vi.mock('primevue/usetoast', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useToast: () => mockToast,
}))

describe('CommentForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - mock function
        authClient.useSession.mockReturnValue({ value: { data: null } })
    })

    it('renders guest fields when not logged in', async () => {
        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: '1',
            },
            global: {
                stubs,
            },
        })

        expect(wrapper.find('#nickname').exists()).toBe(true)
        expect(wrapper.find('#email').exists()).toBe(true)
        expect(wrapper.find('#website').exists()).toBe(true)
    })

    it('hides guest fields when logged in', async () => {
        // @ts-expect-error - mock function
        authClient.useSession.mockReturnValue({
            value: {
                data: {
                    user: { id: '1', name: 'Admin' },
                },
            },
        })

        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: '1',
            },
            global: {
                stubs,
            },
        })

        expect(wrapper.find('#nickname').exists()).toBe(false)
        expect(wrapper.find('#email').exists()).toBe(false)
    })

    it('shows replying to info when parentId is provided', async () => {
        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: '1',
                parentId: '2',
                replyToName: 'Someone',
            },
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.comment-form__replying-to').exists()).toBe(true)
        expect(wrapper.text()).toContain('@Someone')
    })

    it('submits the form successfully', async () => {
        const mockFetch = vi.fn().mockResolvedValue({})
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined)
        vi.stubGlobal('$fetch', mockFetch)

        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: 'post-123',
            },
            global: {
                stubs,
            },
        })

        // Fill guest info
        await wrapper.find('#nickname').setValue('John Doe')
        await wrapper.find('#email').setValue('john@example.com')
        await wrapper.find('textarea').setValue('This is a test comment')

        await wrapper.find('form').trigger('submit')

        expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-123/comments', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                authorName: 'John Doe',
                authorEmail: 'john@example.com',
                content: 'This is a test comment',
                postId: 'post-123',
            }),
        }))

        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
        }))
        expect(setItemSpy).toHaveBeenCalledWith('momei_guest_info', JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            url: '',
        }))
        expect(wrapper.emitted('success')).toBeTruthy()
    })

    it('shows the guest moderation hint for anonymous readers', async () => {
        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: '1',
            },
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.comment-form__tip').exists()).toBe(true)
        expect(wrapper.find('textarea').attributes('placeholder')).toBeTruthy()
    })

    it('emits cancel-reply when closing the replying banner', async () => {
        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: '1',
                parentId: 'reply-1',
                replyToName: 'Alice',
            },
            global: {
                stubs,
            },
        })

        await wrapper.get('.comment-form__replying-to button').trigger('click')

        expect(wrapper.emitted('cancel-reply')).toBeTruthy()
    })

    it('submits with the signed-in user profile and skips guest persistence', async () => {
        const mockFetch = vi.fn().mockResolvedValue({})
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined)
        vi.stubGlobal('$fetch', mockFetch)
        // @ts-expect-error - mock function
        authClient.useSession.mockReturnValue({
            value: {
                data: {
                    user: {
                        id: 'user-1',
                        name: 'Member',
                        email: 'member@example.com',
                    },
                },
            },
        })

        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: 'post-456',
            },
            global: {
                stubs,
            },
        })

        await wrapper.find('textarea').setValue('Signed in comment')
        await wrapper.find('form').trigger('submit')

        expect(mockFetch).toHaveBeenCalledWith('/api/posts/post-456/comments', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                authorName: 'Member',
                authorEmail: 'member@example.com',
                content: 'Signed in comment',
            }),
        }))
        expect(setItemSpy).not.toHaveBeenCalled()
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: expect.any(String),
        }))
    })

    it('shows an error toast when comment submission fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const mockFetch = vi.fn().mockRejectedValue({
            statusMessage: 'Submission failed',
        })
        vi.stubGlobal('$fetch', mockFetch)

        const wrapper = await mountSuspended(CommentForm, {
            props: {
                postId: 'post-789',
            },
            global: {
                stubs,
            },
        })

        await wrapper.find('#nickname').setValue('John Doe')
        await wrapper.find('#email').setValue('john@example.com')
        await wrapper.find('textarea').setValue('This will fail')
        await wrapper.find('form').trigger('submit')

        expect(consoleErrorSpy).toHaveBeenCalledWith('Comment submission failed:', expect.objectContaining({
            statusMessage: 'Submission failed',
        }))
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Submission failed',
        }))
        expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
    })
})
