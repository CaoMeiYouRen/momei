import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CommentForm from './comment-form.vue'
import { authClient } from '@/lib/auth-client'

// Mock PrimeVue components
const stubs = {
    Button: { template: '<button><slot /></button>' },
    InputText: {
        props: ['modelValue'],
        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Textarea: {
        props: ['modelValue'],
        template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
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
vi.mock('primevue/usetoast', () => ({
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
        expect(wrapper.emitted('success')).toBeTruthy()
    })
})
