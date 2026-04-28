import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import CommercialLinkManager from './commercial-link-manager.vue'

const locale = ref('zh-CN')

const translations: Record<string, string> = {
    'common.cancel': 'cancel',
    'common.confirmation': 'confirmation',
    'common.custom': 'custom',
    'common.languages.en-US': 'English',
    'common.languages.zh-CN': '简体中文',
    'common.save': 'save',
    'common.validation_error': 'validation error',
    'common.warn': 'warn',
    'pages.admin.settings.commercial.global_donation_desc': 'admin donation desc',
    'pages.admin.settings.commercial.global_social_desc': 'admin social desc',
    'pages.settings.commercial.add_donation': 'add donation',
    'pages.settings.commercial.add_social': 'add social',
    'pages.settings.commercial.delete_confirm': 'delete confirm',
    'pages.settings.commercial.donation_desc': 'public donation desc',
    'pages.settings.commercial.donation_links': 'donation links',
    'pages.settings.commercial.empty_donation': 'empty donation',
    'pages.settings.commercial.empty_social': 'empty social',
    'pages.settings.commercial.locales_hint': 'locale hint',
    'pages.settings.commercial.social_desc': 'public social desc',
    'pages.settings.commercial.social_links': 'social links',
}

function createDeferred() {
    let resolve!: () => void
    const promise = new Promise<void>((nextResolve) => {
        resolve = nextResolve
    })

    return { promise, resolve }
}

const { mockEnsureLocaleMessageModules } = vi.hoisted(() => ({
    mockEnsureLocaleMessageModules: vi.fn(),
}))

const { mockConfirmRequire, mockToastAdd } = vi.hoisted(() => ({
    mockConfirmRequire: vi.fn(),
    mockToastAdd: vi.fn(),
}))

vi.mock('@/i18n/config/locale-runtime-loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/i18n/config/locale-runtime-loader')>()

    return {
        ...actual,
        ensureLocaleMessageModules: mockEnsureLocaleMessageModules,
    }
})

vi.mock('primevue/useconfirm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/useconfirm')>()

    return {
        ...actual,
        useConfirm: () => ({
            require: mockConfirmRequire,
        }),
    }
})

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({
            add: mockToastAdd,
        }),
    }
})

mockNuxtImport('useI18n', () => () => ({
    locale,
    t: (key: string) => translations[key] || key,
}))

const stubs = {
    AppUploader: { template: '<div class="app-uploader" />' },
    Button: { template: '<button @click="$emit(\'click\')">{{ label }}</button>', props: ['label'] },
    Dialog: { template: '<div><slot /><slot name="footer" /></div>', props: ['visible', 'header'] },
    Divider: { template: '<hr />' },
    Image: { template: '<div><slot name="image" /><slot /></div>', props: ['src', 'alt', 'preview', 'width'] },
    InputText: { template: '<input />' },
    MultiSelect: { inheritAttrs: false, template: '<div class="multi-select-stub" />', props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'] },
    Select: { inheritAttrs: false, template: '<div class="select-stub" />', props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'] },
    Tag: { template: '<span>{{ value }}</span>', props: ['value'] },
}

describe('CommercialLinkManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        locale.value = 'zh-CN'
        mockEnsureLocaleMessageModules.mockResolvedValue(undefined)
    })

    it('loads admin-settings locale messages before showing admin-only descriptions', async () => {
        const deferred = createDeferred()
        mockEnsureLocaleMessageModules.mockReturnValueOnce(deferred.promise)

        const wrapper = await mountSuspended(CommercialLinkManager, {
            props: {
                isAdmin: true,
            },
            global: { stubs },
        })

        expect(mockEnsureLocaleMessageModules).toHaveBeenCalledWith(expect.objectContaining({
            locale: 'zh-CN',
            modules: ['admin-settings'],
        }))
        expect(wrapper.text()).toContain('public social desc')
        expect(wrapper.text()).toContain('public donation desc')
        expect(wrapper.text()).not.toContain('admin social desc')
        expect(wrapper.text()).not.toContain('admin donation desc')

        deferred.resolve()
        await nextTick()
        await nextTick()

        expect(wrapper.text()).toContain('admin social desc')
        expect(wrapper.text()).toContain('admin donation desc')
    })

    it('does not load admin locale modules in public settings mode', async () => {
        const wrapper = await mountSuspended(CommercialLinkManager, {
            global: { stubs },
        })

        expect(mockEnsureLocaleMessageModules).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('public social desc')
        expect(wrapper.text()).toContain('public donation desc')
    })

    it('validates, adds, edits and deletes donation links through dialog actions', async () => {
        const wrapper = await mountSuspended(CommercialLinkManager, {
            props: {
                donationLinks: [
                    {
                        platform: 'paypal',
                        url: 'https://paypal.me/original',
                        locales: ['en-US'],
                    },
                ],
            },
            global: { stubs },
        })

        const vm = wrapper.vm as any

        vm.openDonationDialog()
        expect(vm.dialogVisible).toBe(true)
        expect(vm.editingIndex).toBe(-1)
        expect(vm.currentLink).toMatchObject({
            platform: 'wechat_pay',
            url: '',
            image: '',
            locales: [],
        })

        vm.addLink()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            summary: 'warn',
            detail: 'validation error',
        }))
        expect(vm.dialogVisible).toBe(true)
        expect(vm.donationLinks).toHaveLength(1)

        vm.currentLink.url = 'https://paypal.me/new'
        vm.currentLink.locales = ['zh-CN']
        vm.addLink()
        await nextTick()

        expect(vm.dialogVisible).toBe(false)
        expect(vm.donationLinks).toHaveLength(2)
        expect(vm.donationLinks[1]).toMatchObject({
            platform: 'wechat_pay',
            url: 'https://paypal.me/new',
            locales: ['zh-CN'],
        })

        const originalLink = vm.donationLinks[0]
        vm.openDonationDialog(originalLink, 0)
        expect(vm.editingIndex).toBe(0)
        expect(vm.currentLink.locales).toEqual(['en-US'])

        vm.currentLink.url = 'https://paypal.me/updated'
        vm.currentLink.locales.push('zh-CN')
        expect(originalLink.locales).toEqual(['en-US'])

        vm.addLink()
        await nextTick()

        expect(vm.donationLinks[0]).toMatchObject({
            platform: 'paypal',
            url: 'https://paypal.me/updated',
            locales: ['en-US', 'zh-CN'],
        })

        vm.confirmDelete(0)
        expect(mockConfirmRequire).toHaveBeenCalledWith(expect.objectContaining({
            message: 'delete confirm',
            header: 'confirmation',
            icon: 'pi pi-exclamation-triangle',
        }))

        const confirmOptions = mockConfirmRequire.mock.calls[0]?.[0]
        confirmOptions.accept()
        await nextTick()

        expect(vm.donationLinks).toHaveLength(1)
        expect(vm.donationLinks[0]).toMatchObject({
            url: 'https://paypal.me/new',
        })
    })

    it('validates, adds, edits and deletes social links through dialog actions', async () => {
        const wrapper = await mountSuspended(CommercialLinkManager, {
            props: {
                socialLinks: [
                    {
                        platform: 'github',
                        url: 'https://github.com/original',
                        locales: ['en-US'],
                    },
                ],
            },
            global: { stubs },
        })

        const vm = wrapper.vm as any

        vm.openSocialDialog()
        expect(vm.socialDialogVisible).toBe(true)
        expect(vm.editingSocialIndex).toBe(-1)
        expect(vm.currentSocialLink).toMatchObject({
            platform: 'github',
            url: '',
            locales: [],
        })

        vm.addSocialLink()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            summary: 'warn',
            detail: 'validation error',
        }))
        expect(vm.socialDialogVisible).toBe(true)
        expect(vm.socialLinks).toHaveLength(1)

        vm.currentSocialLink.url = 'https://github.com/new'
        vm.currentSocialLink.locales = ['zh-CN']
        vm.addSocialLink()
        await nextTick()

        expect(vm.socialDialogVisible).toBe(false)
        expect(vm.socialLinks).toHaveLength(2)
        expect(vm.socialLinks[1]).toMatchObject({
            platform: 'github',
            url: 'https://github.com/new',
            locales: ['zh-CN'],
        })

        const originalLink = vm.socialLinks[0]
        vm.openSocialDialog(originalLink, 0)
        expect(vm.editingSocialIndex).toBe(0)
        expect(vm.currentSocialLink.locales).toEqual(['en-US'])

        vm.currentSocialLink.url = 'https://github.com/updated'
        vm.currentSocialLink.locales.push('zh-CN')
        expect(originalLink.locales).toEqual(['en-US'])

        vm.addSocialLink()
        await nextTick()

        expect(vm.socialLinks[0]).toMatchObject({
            platform: 'github',
            url: 'https://github.com/updated',
            locales: ['en-US', 'zh-CN'],
        })

        vm.confirmDeleteSocial(0)
        expect(mockConfirmRequire).toHaveBeenCalledWith(expect.objectContaining({
            message: 'delete confirm',
            header: 'confirmation',
            icon: 'pi pi-exclamation-triangle',
        }))

        const confirmOptions = mockConfirmRequire.mock.calls[0]?.[0]
        confirmOptions.accept()
        await nextTick()

        expect(vm.socialLinks).toHaveLength(1)
        expect(vm.socialLinks[0]).toMatchObject({
            url: 'https://github.com/new',
        })
    })
})
