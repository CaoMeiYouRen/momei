import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock PrimeVue 配置
const mockPrimeVueConfig = {
    config: {
        locale: {},
    },
}

// Mock i18n
const mockLocale = ref('zh-CN')
const mockI18n = {
    locale: mockLocale,
}

// Mock PrimeVue composable
vi.mock('primevue/config', () => ({
    default: {},
    usePrimeVue: () => mockPrimeVueConfig,
}))

// Mock vue-i18n composable
vi.mock('vue-i18n', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useI18n: () => mockI18n,
}))

// Mock primelocale
vi.mock('primelocale/js/zh_CN.js', () => ({
    zh_CN: {
        startsWith: '开始于',
        contains: '包含',
        notContains: '不包含',
        endsWith: '结束于',
        equals: '等于',
        notEquals: '不等于',
    },
}))

vi.mock('primelocale/js/en.js', () => ({
    en: {
        startsWith: 'Starts with',
        contains: 'Contains',
        notContains: 'Not contains',
        endsWith: 'Ends with',
        equals: 'Equals',
        notEquals: 'Not equals',
    },
}))

describe('primevue-i18n plugin', () => {
    beforeEach(() => {
        // 重置 mock 配置
        mockPrimeVueConfig.config.locale = {}
        mockLocale.value = 'zh-CN'
        vi.clearAllMocks()
    })

    it('should sync PrimeVue locale on initialization', async () => {
        // 动态导入插件
        const plugin = await import('@/plugins/primevue-i18n')

        // 执行插件
        const nuxtApp = {
            provide: vi.fn(),
            $i18n: mockI18n,
        }
        await plugin.default(nuxtApp as any)

        // 验证 locale 已同步
        expect(mockPrimeVueConfig.config.locale).toHaveProperty('startsWith')
        expect(mockPrimeVueConfig.config.locale).toHaveProperty('contains')
    })

    it('should update PrimeVue locale when i18n locale changes', async () => {
        const plugin = await import('@/plugins/primevue-i18n')

        const nuxtApp = {
            provide: vi.fn(),
            $i18n: mockI18n,
        }
        await plugin.default(nuxtApp as any)

        // 初始状态应该是中文
        expect((mockPrimeVueConfig.config.locale as any).startsWith).toBe('开始于')

        // 切换到英文
        mockLocale.value = 'en-US'

        // 等待 watch 触发
        await new Promise((resolve) => setTimeout(resolve, 100))

        // 验证已切换到英文
        expect((mockPrimeVueConfig.config.locale as any).startsWith).toBe('Starts with')
    })

    it('should handle unsupported locale gracefully', async () => {
        const plugin = await import('@/plugins/primevue-i18n')

        const nuxtApp = {
            provide: vi.fn(),
            $i18n: mockI18n,
        }

        // 设置不支持的语言
        mockLocale.value = 'fr-FR'

        await plugin.default(nuxtApp as any)

        // 不应该抛出错误
        expect(nuxtApp.provide).not.toThrow()
    })
})
