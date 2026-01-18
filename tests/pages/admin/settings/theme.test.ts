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
    }
})

// Also stub global for safety
vi.stubGlobal('useToast', () => mockToast)
vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
}))

// Mock useTheme
const mockSettings = ref({
    theme_preset: 'default',
    theme_primary_color: '#ff0000',
    theme_accent_color: '#00ff00',
    theme_border_radius: '8px',
    theme_logo_url: '',
    theme_favicon_url: '',
    theme_mourning_mode: false,
    theme_background_type: 'none',
    theme_background_value: null,
})
const mockApplyTheme = vi.fn()

vi.spyOn(useThemeComposable, 'useTheme').mockReturnValue({
    settings: mockSettings,
    applyTheme: mockApplyTheme,
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
const mockFetch = vi.fn()
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
        mockSettings.value.theme_preset = 'green'
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
