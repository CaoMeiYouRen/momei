import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

const mockState = new Map()

vi.mock('#app', async (importOriginal) => {
    const actual = await importOriginal() as any
    return {
        ...actual,
        useState: vi.fn((key: string, init?: () => any) => {
            if (!mockState.has(key)) {
                mockState.set(key, ref(init ? init() : null))
            }
            return mockState.get(key)
        }),
    }
})

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        locale: ref('en'),
        locales: ref([
            { code: 'en', name: 'English' },
            { code: 'zh-CN', name: '简体中文' },
            { code: 'ja', name: '日本語' },
        ]),
        t: (key: string) => {
            if (key === 'common.all_languages') { return 'All Languages' }
            if (key === 'common.languages.en') { return 'English' }
            if (key === 'common.languages.zh-CN') { return '简体中文' }
            if (key === 'common.languages.ja') { return '日本語' }
            return key
        },
    }),
    createI18n: vi.fn(),
}))

describe('useAdminI18n', () => {
    beforeEach(() => {
        mockState.clear()
        vi.clearAllMocks()
    })

    it('should initialize with null content language', async () => {
        const { useAdminI18n } = await import('./use-admin-i18n')
        const { contentLanguage } = useAdminI18n()
        expect(contentLanguage.value).toBeNull()
    })

    it('should set content language', async () => {
        const { useAdminI18n } = await import('./use-admin-i18n')
        const { contentLanguage, setContentLanguage } = useAdminI18n()

        setContentLanguage('zh-CN')
        expect(contentLanguage.value).toBe('zh-CN')
    })

    it('should allow setting content language to null', async () => {
        const { useAdminI18n } = await import('./use-admin-i18n')
        const { contentLanguage, setContentLanguage } = useAdminI18n()

        setContentLanguage('zh-CN')
        expect(contentLanguage.value).toBe('zh-CN')

        setContentLanguage(null)
        expect(contentLanguage.value).toBeNull()
    })

    it('should provide available locales with all languages option', async () => {
        const { useAdminI18n } = await import('./use-admin-i18n')
        const { availableLocales } = useAdminI18n()

        expect(availableLocales.value).toHaveLength(4)
        expect(availableLocales.value[0]).toEqual({ label: 'All Languages', value: null })
        expect(availableLocales.value[1]).toEqual({ label: 'English', value: 'en' })
    })

    it('should share content language across multiple instances', async () => {
        const { useAdminI18n } = await import('./use-admin-i18n')
        const instance1 = useAdminI18n()
        const instance2 = useAdminI18n()

        instance1.setContentLanguage('ja')
        expect(instance2.contentLanguage.value).toBe('ja')
    })
})
