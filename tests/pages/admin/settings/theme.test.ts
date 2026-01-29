import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ThemePage from '@/pages/admin/settings/theme.vue'
import * as useThemeComposable from '@/composables/use-theme'

// Mock PrimeVue components and others
vi.mock('@/components/admin-page-header.vue', () => ({
    default: {
        name: 'AdminPageHeader',
        template: '<div><slot name="actions" /></div>',
    },
}))

vi.mock('@/components/article-card.vue', () => ({
    default: {
        name: 'ArticleCard',
        template: '<div>ArticleCard</div>',
    },
}))

// Mock PrimeVue usetoast
vi.mock('primevue/usetoast', () => ({
    useToast: () => mockToast,
}))

// Mock more components to avoid PrimeVue injection errors
const stubs = {
    Panel: { template: '<div><slot /></div>' },
    Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
    Divider: { template: '<hr />' },
    SelectButton: { template: '<div />' },
    ColorPicker: { template: '<div />' },
    InputText: { template: '<input />' },
    Dropdown: { template: '<div />' },
    ToggleSwitch: { template: '<div />' },
    Tabs: { template: '<div><slot /></div>' },
    TabList: { template: '<div><slot /></div>' },
    Tab: { template: '<div><slot /></div>' },
    TabPanels: { template: '<div><slot /></div>' },
    TabPanel: { template: '<div><slot /></div>' },
}

// Mock composables
const mockToast = {
    add: vi.fn(),
}

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useToast: () => mockToast,
        useI18n: () => ({
            t: (key: string) => key,
        }),
        useFetch: vi.fn(),
        definePageMeta: vi.fn(),
        getAppManifest: vi.fn(() => Promise.resolve({
            publicPath: '/',
            buildId: 'test',
            routes: {},
            matcher: {},
            prerendered: [],
        })),
        getRouteRules: vi.fn(() => ({})),
    }
})

// Also stub global for safety
vi.stubGlobal('useToast', () => mockToast)
vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
}))

// Mock useTheme
const mockSettings = ref({
    themePreset: 'default',
    themePrimaryColor: '#ff0000',
    themeAccentColor: '#00ff00',
    themeBorderRadius: '8px',
    themeLogoUrl: '',
    themeFaviconUrl: '',
    themeMourningMode: false,
    themeBackgroundType: 'none',
    themeBackgroundValue: null,
})
const mockPreviewSettings = ref(null)
const mockApplyTheme = vi.fn()
const mockIsLocked = vi.fn().mockReturnValue(false)

vi.spyOn(useThemeComposable, 'useTheme').mockReturnValue({
    settings: mockSettings,
    previewSettings: mockPreviewSettings,
    applyTheme: mockApplyTheme,
    isLocked: mockIsLocked,
    // Add other properties if needed by useTheme return type
} as any)

vi.mock('@vueuse/core', async () => {
    const actual = await vi.importActual('@vueuse/core')
    return {
        ...actual,
        useDark: () => ref(false),
    }
})

// Mock $fetch
const mockFetch = vi.fn().mockResolvedValue({})
vi.stubGlobal('$fetch', mockFetch)

describe('Admin Theme Settings Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads settings on mount', async () => {
        const wrapper = await mountSuspended(ThemePage, {
            global: {
                stubs,
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('updates preset and resets specific colors', async () => {
        await mountSuspended(ThemePage, {
            global: {
                stubs,
            },
        })

        // Change preset
        mockSettings.value.themePreset = 'green'
    })

    it('saves theme settings successfully', async () => {
        mockFetch.mockResolvedValue({ success: true })
        const wrapper = await mountSuspended(ThemePage, {
            global: {
                stubs,
            },
        })

        // @ts-expect-error - call internal method for testing
        await wrapper.vm.saveTheme()

        expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/theme', expect.objectContaining({
            method: 'PUT',
            body: mockSettings.value,
        }))
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
        }))
    })

    it('handles save error', async () => {
        const errorMsg = 'Save failed'
        mockFetch.mockRejectedValue(new Error(errorMsg))
        const wrapper = await mountSuspended(ThemePage, {
            global: {
                stubs,
            },
        })

        // @ts-expect-error - call internal method for testing
        await wrapper.vm.saveTheme()

        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: errorMsg,
        }))
    })
})
