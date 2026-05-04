import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SubscriberForm from './subscriber-form.vue'

interface SessionData {
    user: {
        email: string
    }
}

const { sessionRef, localeRef, fetchMock } = vi.hoisted(() => ({
    sessionRef: {
        value: {
            data: null as SessionData | null,
        },
    },
    localeRef: {
        value: 'zh-CN',
    },
    fetchMock: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: () => sessionRef,
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => {
        switch (key) {
            case 'components.subscriber_form.title':
                return 'Subscribe for updates'
            case 'components.subscriber_form.description':
                return 'Receive new post updates in your inbox.'
            case 'components.subscriber_form.placeholder':
                return 'Enter your email'
            case 'components.subscriber_form.submit':
                return 'Subscribe'
            case 'components.subscriber_form.submitting':
                return 'Submitting...'
            case 'components.subscriber_form.success':
                return 'Subscription successful'
            case 'common.unexpected_error':
                return 'Unexpected error'
            default:
                return key
        }
    },
    locale: localeRef,
}))

vi.stubGlobal('$fetch', fetchMock)

const stubs = {
    IconField: { template: '<div class="icon-field"><slot /></div>' },
    InputIcon: { template: '<span class="input-icon"><slot /></span>' },
    InputText: {
        template: '<input :value="modelValue" :disabled="disabled" :type="type" @input="$emit(\'update:modelValue\', $event.target.value)">',
        props: ['modelValue', 'disabled', 'type', 'placeholder'],
        emits: ['update:modelValue'],
    },
    Button: {
        template: '<button :type="type" :disabled="loading" @click="$emit(\'click\')">{{ label }}</button>',
        props: ['type', 'label', 'loading'],
        emits: ['click'],
    },
    Message: {
        template: '<div class="message" :data-severity="severity"><slot /></div>',
        props: ['severity', 'size', 'variant'],
    },
}

async function mountForm() {
    return mountSuspended(SubscriberForm, {
        global: {
            stubs,
        },
    })
}

describe('SubscriberForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionRef.value = { data: null }
        localeRef.value = 'zh-CN'
        fetchMock.mockResolvedValue({ code: 200 })
    })

    it('prefills the email for signed-in readers', async () => {
        sessionRef.value = {
            data: {
                user: {
                    email: 'member@example.com',
                },
            },
        }

        const wrapper = await mountForm()

        expect(wrapper.get('input').element.value).toBe('member@example.com')
    })

    it('submits anonymous subscriptions and clears the email after success', async () => {
        const wrapper = await mountForm()

        await wrapper.get('input').setValue('reader@example.com')
        await wrapper.get('form').trigger('submit')

        expect(fetchMock).toHaveBeenCalledWith('/api/subscribers/subscribe', {
            method: 'POST',
            body: {
                email: 'reader@example.com',
                language: 'zh-CN',
            },
        })
        expect(wrapper.find('.message').attributes('data-severity')).toBe('success')
        expect(wrapper.text()).toContain('Subscription successful')
        expect(wrapper.get('input').element.value).toBe('')
    })

    it('keeps the signed-in email visible after a successful subscription', async () => {
        sessionRef.value = {
            data: {
                user: {
                    email: 'member@example.com',
                },
            },
        }

        const wrapper = await mountForm()
        await wrapper.get('form').trigger('submit')

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(wrapper.get('input').element.value).toBe('member@example.com')
    })

    it('does not submit when the email is blank', async () => {
        const wrapper = await mountForm()

        await wrapper.get('form').trigger('submit')

        expect(fetchMock).not.toHaveBeenCalled()
        expect(wrapper.find('.message').exists()).toBe(false)
    })

    it('shows backend errors when subscription fails', async () => {
        fetchMock.mockRejectedValueOnce({
            data: {
                message: 'Subscription failed',
            },
        })

        const wrapper = await mountForm()
        await wrapper.get('input').setValue('reader@example.com')
        await wrapper.get('form').trigger('submit')

        expect(wrapper.find('.message').attributes('data-severity')).toBe('error')
        expect(wrapper.text()).toContain('Subscription failed')
        expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
    })
})
