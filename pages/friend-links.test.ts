import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

import FriendLinksPage from './friend-links.vue'

const mockRefreshMeta = vi.fn()
const mockRefreshLinks = vi.fn()
const mockToastAdd = vi.fn()

const translations: Record<string, string> = {
    'common.friend_links': 'Friend Links',
    'components.friend_links.fields.site_url': 'Shared Site URL',
    'components.friend_links.fields.logo': 'Shared Logo',
    'components.friend_links.fields.rss_url': 'Shared RSS URL',
    'components.friend_links.fields.contact_email': 'Shared Contact Email',
    'pages.links.title': 'Friend Links',
    'pages.links.subtitle': 'Subtitle',
    'pages.links.guidelines_title': 'Guidelines',
    'pages.links.application_title': 'Apply',
    'pages.links.application_subtitle': 'Apply subtitle',
    'pages.links.empty': 'Empty',
    'pages.links.disabled': 'Disabled',
    'pages.links.health_reference_notice': 'Health notice',
    'pages.links.form.logo_placeholder': 'logo placeholder',
    'pages.links.form.logo_hint': 'logo hint',
    'pages.links.form.logo_upload_placeholder': 'logo upload placeholder',
    'pages.links.form.logo_upload_hint': 'logo upload hint',
    'pages.links.form.contact_name': 'Contact Name',
    'pages.links.form.category_placeholder': 'Category Placeholder',
    'pages.links.form.category_suggestion': 'Category Suggestion',
    'pages.links.form.reciprocal_url': 'Reciprocal Link Page',
    'pages.links.form.message': 'Message',
    'pages.links.form.submit': 'Submit',
    'pages.links.form.submitting': 'Submitting',
    'common.name': 'Name',
    'common.category': 'Category',
    'common.description': 'Description',
    'common.visit_site': 'Visit',
    'common.no_description': 'No description',
}

const translate = (key: string) => translations[key] ?? key

mockNuxtImport('useI18n', () => () => ({
    t: translate,
    locale: ref('en-US'),
}))

mockNuxtImport('useToast', () => () => ({
    add: mockToastAdd,
}))

mockNuxtImport('useRuntimeConfig', () => () => ({
    app: {
        baseURL: '/',
    },
    public: {
        authCaptcha: {},
    },
}))

mockNuxtImport('useRouter', () => () => ({
    replace: vi.fn(async () => undefined),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
}))

mockNuxtImport('usePageSeo', () => vi.fn())

mockNuxtImport('useAsyncData', () => async (key: string) => {
    if (key === 'friend-links-meta') {
        return {
            data: ref({
                enabled: true,
                applicationEnabled: true,
                applicationGuidelines: 'Guidelines copy',
                categories: [],
            }),
            refresh: mockRefreshMeta,
        }
    }

    return {
        data: ref({
            items: [],
            groups: [],
        }),
        refresh: mockRefreshLinks,
    }
})

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: () => ref({ data: null }),
    },
}))

const stubs = {
    Card: { template: '<section class="card"><slot /><slot name="content" /></section>' },
    InputText: { template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'type'], emits: ['update:modelValue'] },
    Textarea: { template: '<textarea :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'rows'], emits: ['update:modelValue'] },
    Select: { template: '<select :id="id"><slot /></select>', props: ['id', 'modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'], emits: ['update:modelValue'] },
    Button: { template: '<button :type="type">{{ label }}<slot /></button>', props: ['label', 'type', 'loading'] },
    AppUploader: { template: '<div class="uploader">{{ placeholder }}</div>', props: ['id', 'modelValue', 'type', 'accept', 'placeholder'], emits: ['update:modelValue'] },
    ClientOnly: { template: '<div><slot /><slot name="fallback" /></div>' },
    Toast: { template: '<div class="toast" />' },
    AppCaptcha: { template: '<div class="captcha" />' },
}

describe('FriendLinksPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders shared friend link field labels instead of page-private keys', async () => {
        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        const text = wrapper.text()

        expect(text).toContain('Shared Site URL')
        expect(text).toContain('Shared Logo')
        expect(text).toContain('Shared RSS URL')
        expect(text).toContain('Shared Contact Email')
        expect(text).not.toContain('pages.links.form.url')
        expect(text).not.toContain('pages.links.form.logo')
        expect(text).not.toContain('pages.links.form.rss_url')
        expect(text).not.toContain('pages.links.form.contact_email')
    })
})
