import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SubmitPage from './submit.vue'

const fetchMock = vi.fn()
const toastAddMock = vi.fn()
const usePageSeoMock = vi.fn()
const resetCaptchaMock = vi.fn()

const routeState = {
    query: {} as Record<string, unknown>,
    path: '/submit',
    fullPath: '/submit',
    params: {},
    matched: [],
    meta: {},
    hash: '',
    redirectedFrom: undefined,
    name: 'submit___zh-CN___default',
}

const routerState = {
    push: vi.fn(),
    replace: vi.fn(() => Promise.resolve()),
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
    currentRoute: { value: routeState },
}

const runtimeConfigState = {
    app: {
        baseURL: '/',
        buildAssetsDir: '/_nuxt/',
        cdnURL: '',
    },
    public: {
        authCaptcha: {
            provider: 'cloudflare-turnstile' as string | undefined,
            siteKey: 'submit-site-key' as string | undefined,
        },
    },
}

const translate = (key: string) => {
    switch (key) {
        case 'pages.submit.title':
            return 'Submit your article'
        case 'pages.submit.subtitle':
            return 'Share something worth reading with the community.'
        case 'pages.submit.meta.description':
            return 'Submit content for review.'
        case 'pages.submit.form.title':
            return 'Title'
        case 'pages.submit.form.title_placeholder':
            return 'A clear, specific title'
        case 'pages.submit.form.content':
            return 'Content'
        case 'pages.submit.form.content_placeholder':
            return 'Write at least 10 characters'
        case 'pages.submit.form.name':
            return 'Your name'
        case 'pages.submit.form.name_placeholder':
            return 'How should we credit you?'
        case 'pages.submit.form.email':
            return 'Email'
        case 'pages.submit.form.email_placeholder':
            return 'you@example.com'
        case 'pages.submit.form.url':
            return 'Website'
        case 'pages.submit.form.url_placeholder':
            return 'https://example.com'
        case 'pages.submit.form.submit':
            return 'Submit now'
        case 'pages.submit.form.submitting':
            return 'Submitting...'
        case 'pages.submit.form.captcha_required':
            return 'Please complete the captcha first'
        case 'pages.submit.form.success':
            return 'Submission received'
        case 'pages.submit.form.error':
            return 'Submission failed'
        default:
            return key
    }
}

mockNuxtImport('useI18n', () => () => ({
    t: translate,
}))
mockNuxtImport('useToast', () => () => ({
    add: (...args: Parameters<typeof toastAddMock>) => toastAddMock(...args),
}))
mockNuxtImport('useRouter', () => () => routerState)
mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfigState)
mockNuxtImport('usePageSeo', () => (...args: Parameters<typeof usePageSeoMock>) => usePageSeoMock(...args))

const AppCaptchaStub = defineComponent({
    name: 'AppCaptchaStub',
    props: {
        modelValue: {
            type: String,
            default: '',
        },
    },
    emits: ['update:modelValue'],
    methods: {
        reset: resetCaptchaMock,
    },
    template: '<input class="captcha-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
})

const stubs = {
    Card: { template: '<div class="submit-card"><slot name="content" /></div>' },
    Button: {
        template: '<button :type="type" :data-loading="String(!!loading)">{{ label }}</button>',
        props: ['type', 'label', 'loading', 'class'],
    },
    InputText: {
        template: '<input :id="id" :value="modelValue" :type="type" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['id', 'modelValue', 'type', 'invalid', 'placeholder', 'fluid'],
        emits: ['update:modelValue'],
    },
    Textarea: {
        template: '<textarea :id="id" :value="modelValue" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['id', 'modelValue', 'invalid', 'placeholder', 'rows', 'fluid'],
        emits: ['update:modelValue'],
    },
    Message: {
        template: '<div class="message"><slot /></div>',
        props: ['severity', 'size', 'variant'],
    },
    Toast: { template: '<div class="toast-stub" />' },
    'app-captcha': AppCaptchaStub,
}

async function mountPage() {
    return mountSuspended(SubmitPage, {
        global: {
            stubs,
            mocks: {
                $t: translate,
            },
        },
    })
}

describe('SubmitPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeState.query = {}
        routeState.path = '/submit'
        routeState.fullPath = '/submit'
        routeState.params = {}
        routeState.matched = []
        routeState.meta = {}
        routeState.hash = ''
        routeState.redirectedFrom = undefined
        routerState.currentRoute.value = routeState
        runtimeConfigState.public.authCaptcha = {
            provider: 'cloudflare-turnstile',
            siteKey: 'submit-site-key',
        }
        fetchMock.mockResolvedValue({ code: 200 })
        vi.stubGlobal('$fetch', fetchMock)
    })

    it('renders localized copy and configures SEO without raw keys', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(text).toContain('Submit your article')
        expect(text).toContain('Share something worth reading with the community.')
        expect(text).toContain('Submit now')
        expect(text).not.toContain('pages.submit.title')
        expect(usePageSeoMock).toHaveBeenCalledWith(expect.objectContaining({
            type: 'website',
            title: expect.any(Function),
            description: expect.any(Function),
        }))
    })

    it('shows schema validation errors instead of posting an invalid payload', async () => {
        const wrapper = await mountPage()

        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()

        expect(fetchMock).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('标题不能为空')
        expect(wrapper.text()).toContain('内容太少，请填写至少 10 个字符')
        expect(wrapper.text()).toContain('姓名不能为空')
        expect(wrapper.text()).toContain('无效的邮箱地址')
    })

    it('blocks submission with a translated captcha error when captcha is enabled but missing', async () => {
        const wrapper = await mountPage()

        await wrapper.find('#title').setValue('A valid title')
        await wrapper.find('#content').setValue('This body is definitely long enough.')
        await wrapper.find('#name').setValue('Tester')
        await wrapper.find('#email').setValue('tester@momei.dev')
        await wrapper.find('#url').setValue('https://example.com')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()

        expect(fetchMock).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Please complete the captcha first')
    })

    it('submits successfully, resets the form, and clears the captcha widget', async () => {
        const wrapper = await mountPage()

        await wrapper.find('#title').setValue('A valid title')
        await wrapper.find('#content').setValue('This body is definitely long enough.')
        await wrapper.find('#name').setValue('Tester')
        await wrapper.find('#email').setValue('tester@momei.dev')
        await wrapper.find('#url').setValue('https://example.com')
        await wrapper.find('.captcha-input').setValue('captcha-token')
        await wrapper.find('form').trigger('submit.prevent')

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/posts/submissions', expect.objectContaining({
                method: 'POST',
                body: {
                    title: 'A valid title',
                    content: 'This body is definitely long enough.',
                    contributorName: 'Tester',
                    contributorEmail: 'tester@momei.dev',
                    contributorUrl: 'https://example.com',
                    captchaToken: 'captcha-token',
                },
            }))
        })

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: 'Submission received',
            life: 5000,
        }))
        expect(resetCaptchaMock).toHaveBeenCalledTimes(1)
        expect((wrapper.find('#title').element as HTMLInputElement).value).toBe('')
        expect((wrapper.find('#content').element as HTMLTextAreaElement).value).toBe('')
        expect((wrapper.find('.captcha-input').element as HTMLInputElement).value).toBe('')
    })

    it('surfaces backend errors, keeps user input, and resets captcha on failure', async () => {
        fetchMock.mockRejectedValue({
            message: 'Network exploded',
            data: {
                message: 'Submission quota exceeded',
            },
        })

        const wrapper = await mountPage()

        await wrapper.find('#title').setValue('A valid title')
        await wrapper.find('#content').setValue('This body is definitely long enough.')
        await wrapper.find('#name').setValue('Tester')
        await wrapper.find('#email').setValue('tester@momei.dev')
        await wrapper.find('.captcha-input').setValue('captcha-token')
        await wrapper.find('form').trigger('submit.prevent')

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                summary: 'Submission failed',
                detail: 'Submission quota exceeded',
                life: 3000,
            }))
        })

        expect(resetCaptchaMock).toHaveBeenCalledTimes(1)
        expect((wrapper.find('#title').element as HTMLInputElement).value).toBe('A valid title')
        expect((wrapper.find('.captcha-input').element as HTMLInputElement).value).toBe('captcha-token')
        expect(wrapper.find('button').attributes('data-loading')).toBe('false')
    })

    it('allows submission without captcha when the captcha provider is disabled', async () => {
        runtimeConfigState.public.authCaptcha = {
            provider: undefined,
            siteKey: undefined,
        }

        const wrapper = await mountPage()

        await wrapper.find('#title').setValue('A valid title')
        await wrapper.find('#content').setValue('This body is definitely long enough.')
        await wrapper.find('#name').setValue('Tester')
        await wrapper.find('#email').setValue('tester@momei.dev')
        await wrapper.find('form').trigger('submit.prevent')

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })

        expect(wrapper.find('.captcha-input').exists()).toBe(false)
    })
})
