import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

import FriendLinksPage from './friend-links.vue'

interface TestFriendLinkItem {
    id: string
    name: string
    url: string
    description: string
    logo: string
    healthStatus?: string
    lastCheckedAt?: string | null
}

interface TestFriendLinkGroup {
    category: {
        id: string
        name: string
        description?: string
    } | null
    items: TestFriendLinkItem[]
}

interface TestFriendLinksMeta {
    enabled: boolean
    applicationEnabled: boolean
    applicationGuidelines: string
    categories: {
        id: string
        name: string
    }[]
}

interface TestFriendLinksData {
    items: TestFriendLinkItem[]
    groups: TestFriendLinkGroup[]
}

const createDefaultMeta = (): TestFriendLinksMeta => ({
    enabled: true,
    applicationEnabled: true,
    applicationGuidelines: 'Guidelines copy',
    categories: [],
})

const createDefaultLinksData = (): TestFriendLinksData => ({
    items: [],
    groups: [],
})

const mockRefreshMeta = vi.fn()
const mockRefreshLinks = vi.fn()
const mockToastAdd = vi.fn()
const mockFetch = vi.fn()
const mockUsePageSeo = vi.fn()
const mockAsyncDataMode = ref<'stub' | 'handler'>('stub')
const mockSession = ref<{
    data: {
        user?: {
            name?: string | null
            email?: string | null
        } | null
    } | null
}>({
    data: null,
})
const mockRuntimeConfig: {
    app: {
        baseURL: string
    }
    public: {
        authCaptcha: {
            provider?: string
            siteKey?: string
        }
    }
} = {
    app: {
        baseURL: '/',
    },
    public: {
        authCaptcha: {},
    },
}
const mockMetaData = ref<TestFriendLinksMeta>(createDefaultMeta())
const mockLinksData = ref<TestFriendLinksData>(createDefaultLinksData())

vi.stubGlobal('$fetch', mockFetch)

const translations: Record<string, string> = {
    'common.friend_links': 'Friend Links',
    'components.friend_links.fields.site_url': 'Shared Site URL',
    'components.friend_links.fields.logo': 'Shared Logo',
    'components.friend_links.fields.rss_url': 'Shared RSS URL',
    'components.friend_links.fields.contact_email': 'Shared Contact Email',
    'pages.links.title': 'Friend Links',
    'pages.links.subtitle': 'Subtitle',
    'pages.links.meta.description': 'Friend links meta description',
    'pages.links.guidelines_title': 'Guidelines',
    'pages.links.application_title': 'Apply',
    'pages.links.application_subtitle': 'Apply subtitle',
    'pages.links.empty': 'Empty',
    'pages.links.disabled': 'Disabled',
    'pages.links.uncategorized': 'Uncategorized',
    'pages.links.last_checked_at': 'Last checked',
    'pages.links.health_statuses.healthy': 'Healthy',
    'pages.links.health_statuses.unreachable': 'Unreachable',
    'pages.links.health_statuses.checking': 'Checking',
    'pages.links.health_statuses.unknown': 'Unknown',
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
    'common.error': 'Error',
    'common.success': 'Success',
    'common.visit_site': 'Visit',
    'common.no_description': 'No description',
    'pages.links.form.success': 'Submitted successfully',
    'pages.links.form.error': 'Submit failed',
    'pages.links.form.captcha_required': 'Captcha is required',
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
    ...mockRuntimeConfig,
}))

mockNuxtImport('useRouter', () => () => ({
    replace: vi.fn(() => Promise.resolve(undefined)),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
}))

mockNuxtImport('usePageSeo', () => (...args: Parameters<typeof mockUsePageSeo>) => mockUsePageSeo(...args))

mockNuxtImport('useAsyncData', () => async (key: string, handler?: () => Promise<unknown>) => {
    if (mockAsyncDataMode.value === 'handler' && handler) {
        return {
            data: ref(await handler()),
            refresh: key === 'friend-links-meta' ? mockRefreshMeta : mockRefreshLinks,
        }
    }

    if (key === 'friend-links-meta') {
        return Promise.resolve({
            data: mockMetaData,
            refresh: mockRefreshMeta,
        })
    }

    return Promise.resolve({
        data: mockLinksData,
        refresh: mockRefreshLinks,
    })
})

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: () => mockSession,
    },
}))

const stubs = {
    Card: { template: '<section class="card"><slot /><slot name="content" /></section>' },
    Tag: { template: '<span class="tag" :data-severity="severity">{{ value }}</span>', props: ['value', 'severity'] },
    InputText: { template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'type'], emits: ['update:modelValue'] },
    Textarea: { template: '<textarea :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'rows'], emits: ['update:modelValue'] },
    Select: {
        template: '<select :id="id" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value=""></option><option v-for="option in options" :key="option[optionValue]" :value="option[optionValue]">{{ option[optionLabel] }}</option><slot /></select>',
        props: ['id', 'modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
        emits: ['update:modelValue'],
    },
    Button: { template: '<button :type="type">{{ label }}<slot /></button>', props: ['label', 'type', 'loading'] },
    AppUploader: { template: '<input :id="id" class="uploader" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'type', 'accept', 'placeholder'], emits: ['update:modelValue'] },
    ClientOnly: { template: '<div><slot /><slot name="fallback" /></div>' },
    Toast: { template: '<div class="toast" />' },
    AppCaptcha: { template: '<div class="captcha" />' },
}

describe('FriendLinksPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('$fetch', mockFetch)
        mockFetch.mockReset()
        mockUsePageSeo.mockReset()
        mockAsyncDataMode.value = 'stub'
        mockSession.value = { data: null }
        mockRuntimeConfig.public.authCaptcha = {}
        mockMetaData.value = createDefaultMeta()
        mockLinksData.value = createDefaultLinksData()
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

    it('renders disabled state when friend links are turned off', async () => {
        mockMetaData.value = {
            enabled: false,
            applicationEnabled: false,
            applicationGuidelines: '',
            categories: [],
        }

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        expect(wrapper.text()).toContain('Disabled')
        expect(wrapper.find('.links-page__apply-card').exists()).toBe(false)
        expect(wrapper.find('.links-page__groups').exists()).toBe(false)
    })

    it('renders grouped links with uncategorized and fallback copy', async () => {
        mockMetaData.value = {
            enabled: true,
            applicationEnabled: false,
            applicationGuidelines: 'Guidelines copy',
            categories: [],
        }
        mockLinksData.value = {
            items: [
                {
                    id: 'friend-link-1',
                    name: 'Momei Partner',
                    url: 'https://partner.example.com',
                    description: '',
                    logo: '',
                    healthStatus: 'healthy',
                    lastCheckedAt: '2026-04-30T00:00:00.000Z',
                },
            ],
            groups: [
                {
                    category: null,
                    items: [
                        {
                            id: 'friend-link-1',
                            name: 'Momei Partner',
                            url: 'https://partner.example.com',
                            description: '',
                            logo: '',
                            healthStatus: 'healthy',
                            lastCheckedAt: '2026-04-30T00:00:00.000Z',
                        },
                    ],
                },
            ],
        }

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        const text = wrapper.text()

        expect(text).toContain('Uncategorized')
        expect(text).toContain('No description')
        expect(text).toContain('Healthy')
        expect(text).toContain('Last checked')
        expect(text).toContain('Visit')
        expect(wrapper.find('.links-page__logo--fallback').text()).toBe('M')
        expect(wrapper.find('.links-page__apply-card').exists()).toBe(false)
    })

    it('renders category descriptions and uploaded logos when grouped links are available', async () => {
        mockMetaData.value = {
            enabled: true,
            applicationEnabled: false,
            applicationGuidelines: 'Guidelines copy',
            categories: [],
        }
        mockLinksData.value = {
            items: [
                {
                    id: 'friend-link-2',
                    name: 'Design Partner',
                    url: 'https://design.example.com',
                    description: 'Curated design articles',
                    logo: 'https://design.example.com/logo.png',
                    healthStatus: 'healthy',
                    lastCheckedAt: '2026-04-30T00:00:00.000Z',
                },
            ],
            groups: [
                {
                    category: {
                        id: 'cat-1',
                        name: 'Design',
                        description: 'Curated design links',
                    },
                    items: [
                        {
                            id: 'friend-link-2',
                            name: 'Design Partner',
                            url: 'https://design.example.com',
                            description: 'Curated design articles',
                            logo: 'https://design.example.com/logo.png',
                            healthStatus: 'healthy',
                            lastCheckedAt: '2026-04-30T00:00:00.000Z',
                        },
                    ],
                },
            ],
        }

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        expect(wrapper.text()).toContain('Design')
        expect(wrapper.text()).toContain('Curated design links')
        expect(wrapper.text()).toContain('Curated design articles')
        expect(wrapper.find('.links-page__logo').attributes('src')).toBe('https://design.example.com/logo.png')
        expect(wrapper.find('.links-page__card-link').attributes('href')).toBe('https://design.example.com')
    })

    it('prefills authenticated contact fields, uses the uploader branch, and exposes SEO copy', async () => {
        mockSession.value = {
            data: {
                user: {
                    name: 'Alice Example',
                    email: 'alice@example.com',
                },
            },
        }

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        expect(wrapper.find('.uploader').exists()).toBe(true)
        expect((wrapper.get('#contactName').element as HTMLInputElement).value).toBe('Alice Example')
        expect((wrapper.get('#contactEmail').element as HTMLInputElement).value).toBe('alice@example.com')
        expect(wrapper.text()).toContain('logo upload hint')

        const seoConfig = mockUsePageSeo.mock.calls[0]?.[0] as {
            title: () => string
            description: () => string
        }

        expect(seoConfig.title()).toBe('Friend Links')
        expect(seoConfig.description()).toBe('Friend links meta description')
    })

    it('executes async data handlers and maps health fallback states', async () => {
        mockAsyncDataMode.value = 'handler'
        mockFetch.mockImplementation((request: string) => {
            if (request === '/api/friend-links/meta') {
                return Promise.resolve({
                    data: {
                        enabled: true,
                        applicationEnabled: false,
                        applicationGuidelines: '',
                        categories: [],
                    },
                })
            }

            if (request === '/api/friend-links') {
                return Promise.resolve({
                    data: {
                        items: [],
                        groups: [
                            {
                                category: null,
                                items: [
                                    {
                                        id: 'checking-link',
                                        name: 'Checking Link',
                                        url: 'https://checking.example.com',
                                        description: '',
                                        logo: '',
                                        healthStatus: 'checking',
                                        lastCheckedAt: null,
                                    },
                                    {
                                        id: 'unreachable-link',
                                        name: 'Unreachable Link',
                                        url: 'https://unreachable.example.com',
                                        description: '',
                                        logo: '',
                                        healthStatus: 'unreachable',
                                        lastCheckedAt: null,
                                    },
                                    {
                                        id: 'unknown-link',
                                        name: 'Unknown Link',
                                        url: 'https://unknown.example.com',
                                        description: '',
                                        logo: '',
                                        lastCheckedAt: undefined,
                                    },
                                ],
                            },
                        ],
                    },
                })
            }

            throw new Error(`Unexpected request: ${request}`)
        })

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        expect(mockFetch).toHaveBeenCalledWith('/api/friend-links/meta', expect.objectContaining({
            query: {
                locale: 'en-US',
            },
        }))
        expect(mockFetch).toHaveBeenCalledWith('/api/friend-links')

        const tags = wrapper.findAll('.tag')

        expect(tags.map((tag) => tag.text())).toEqual(expect.arrayContaining(['Checking', 'Unreachable', 'Unknown']))
        expect(tags.map((tag) => tag.attributes('data-severity'))).toEqual(expect.arrayContaining(['warning', 'danger', 'secondary']))
        expect(wrapper.text()).toContain('Last checked: -')
    })

    it('falls back to disabled defaults when async data loading fails', async () => {
        mockAsyncDataMode.value = 'handler'
        mockFetch.mockRejectedValue(new Error('load failed'))

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        expect(wrapper.text()).toContain('Disabled')
        expect(wrapper.find('.links-page__groups').exists()).toBe(false)
        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('shows a toast error when the application form is invalid', async () => {
        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        await wrapper.find('form').trigger('submit')

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: 'Error',
        }))
    })

    it('submits a valid friend link application and refreshes page data', async () => {
        mockFetch.mockResolvedValue({})

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        await wrapper.find('#name').setValue('Momei Partner')
        await wrapper.find('#url').setValue('https://partner.example.com')
        await wrapper.find('#contactEmail').setValue('contact@example.com')
        await wrapper.find('form').trigger('submit')

        expect(mockFetch).toHaveBeenCalledWith('/api/friend-links/applications', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                name: 'Momei Partner',
                url: 'https://partner.example.com',
                contactEmail: 'contact@example.com',
            }),
        }))
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: 'Success',
            detail: 'Submitted successfully',
        }))
        expect(mockRefreshMeta).toHaveBeenCalled()
        expect(mockRefreshLinks).toHaveBeenCalled()
    })

    it('submits optional friend link fields alongside the selected category', async () => {
        mockFetch.mockResolvedValue({})
        mockMetaData.value = {
            ...createDefaultMeta(),
            categories: [
                {
                    id: 'design',
                    name: 'Design',
                },
            ],
        }

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        await wrapper.find('#name').setValue('Optional Partner')
        await wrapper.find('#url').setValue('https://optional.example.com')
        await wrapper.find('#logo').setValue('https://optional.example.com/logo.png')
        await wrapper.find('#rssUrl').setValue('https://optional.example.com/rss.xml')
        await wrapper.find('#contactName').setValue('Optional Contact')
        await wrapper.find('#contactEmail').setValue('optional@example.com')
        await wrapper.find('#categoryId').setValue('design')
        await wrapper.find('#categorySuggestion').setValue('Design Systems')
        await wrapper.find('#reciprocalUrl').setValue('https://optional.example.com/friend-links')
        await wrapper.find('#description').setValue('Optional description')
        await wrapper.find('#message').setValue('Optional message')
        await wrapper.find('form').trigger('submit')

        expect(mockFetch).toHaveBeenCalledWith('/api/friend-links/applications', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                name: 'Optional Partner',
                url: 'https://optional.example.com',
                logo: 'https://optional.example.com/logo.png',
                rssUrl: 'https://optional.example.com/rss.xml',
                contactName: 'Optional Contact',
                contactEmail: 'optional@example.com',
                categoryId: 'design',
                categorySuggestion: 'Design Systems',
                reciprocalUrl: 'https://optional.example.com/friend-links',
                description: 'Optional description',
                message: 'Optional message',
            }),
        }))
    })

    it('requires captcha tokens when captcha is enabled', async () => {
        mockRuntimeConfig.public.authCaptcha = {
            provider: 'turnstile',
            siteKey: 'site-key',
        }

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        await wrapper.find('#name').setValue('Momei Partner')
        await wrapper.find('#url').setValue('https://partner.example.com')
        await wrapper.find('#contactEmail').setValue('contact@example.com')
        await wrapper.find('form').trigger('submit')

        expect(wrapper.find('.links-page__captcha').exists()).toBe(true)
        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Captcha is required',
        }))
    })

    it('shows backend errors when the application request fails', async () => {
        mockFetch.mockRejectedValue({
            data: {
                message: 'API failed',
            },
            message: 'API failed',
        })

        const wrapper = await mountSuspended(FriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        await wrapper.find('#name').setValue('Momei Partner')
        await wrapper.find('#url').setValue('https://partner.example.com')
        await wrapper.find('#contactEmail').setValue('contact@example.com')
        await wrapper.find('form').trigger('submit')

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'API failed',
        }))
        expect(mockRefreshMeta).not.toHaveBeenCalled()
        expect(mockRefreshLinks).not.toHaveBeenCalled()
    })
})
