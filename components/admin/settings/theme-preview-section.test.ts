import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import type { ThemeSettings } from '@/composables/use-theme'

const themeState = vi.hoisted(() => ({
    settings: null as unknown,
    isLocked: ((_key: string) => false) as (key: string) => boolean,
    isDark: false,
}))

vi.mock('@/composables/use-theme', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/composables/use-theme')>()

    return {
        ...actual,
        useTheme: () => ({
            settings: themeState.settings,
            isLocked: (key: string) => themeState.isLocked(key),
        }),
    }
})

vi.mock('@/composables/use-theme-mode', async () => {
    const { ref: createRef } = await import('vue')
    return {
        useThemeMode: () => createRef(themeState.isDark),
    }
})

const stubs = {
    CaomeiCard: {
        props: ['title'],
        template: '<section class="card-stub" :data-title="title"><slot /></section>',
    },
    CaomeiButton: {
        props: ['label', 'size'],
        template: '<button class="button-stub" type="button"><slot name="icon" /><slot /></button>',
    },
    ArticleCard: {
        props: ['post'],
        template: '<article class="article-card-stub" :data-title="post.title" :data-cover="post.coverImage" />',
    },
    AppTooltip: {
        props: ['content'],
        template: '<span class="tooltip-stub" :data-content="content"><slot /></span>',
    },
    CaomeiSelectButton: {
        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'disabled'],
        emits: ['update:modelValue'],
        template: `
            <div class="select-button-stub" :data-value="modelValue" :data-disabled="String(disabled)">
                <span v-for="option in options" :key="option.value" class="select-option">{{ option.label }}</span>
                <button class="select-image" type="button" @click="$emit('update:modelValue', 'image')">image</button>
                <button class="select-none" type="button" @click="$emit('update:modelValue', 'none')">none</button>
            </div>
        `,
    },
    CaomeiColorPicker: {
        props: ['modelValue', 'format', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input class="color-picker-stub" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
    CaomeiInput: {
        props: ['modelValue', 'placeholder', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input class="input-stub" :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
}

function createSettings(overrides: Partial<ThemeSettings> = {}): ThemeSettings {
    return {
        themePreset: 'default',
        themePrimaryColor: '#123456',
        themeAccentColor: null,
        themeSurfaceColor: null,
        themeTextColor: null,
        themeDarkPrimaryColor: null,
        themeDarkAccentColor: null,
        themeDarkSurfaceColor: null,
        themeDarkTextColor: null,
        themeBorderRadius: null,
        themeLogoUrl: 'https://example.com/logo.png',
        themeFaviconUrl: null,
        themeMourningMode: false,
        themeBackgroundType: 'none',
        themeBackgroundValue: null,
        ...overrides,
    } as ThemeSettings
}

async function mountComponent() {
    const { default: ThemePreviewSection } = await import('./theme-preview-section.vue')

    return await mountSuspended(ThemePreviewSection, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('ThemePreviewSection', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        themeState.settings = ref(createSettings())
        themeState.isLocked = () => false
        themeState.isDark = false
    })

    it('renders nothing while theme settings are not loaded', async () => {
        themeState.settings = ref(null)

        const wrapper = await mountComponent()

        expect(wrapper.find('.theme-preview-section').exists()).toBe(false)
    })

    it('renders the preview card with the current logo as cover', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.find('.theme-preview-section').exists()).toBe(true)
        expect(wrapper.find('.card-stub').attributes('data-title')).toBe('pages.admin.settings.theme.preview')
        expect(wrapper.find('.article-card-stub').attributes('data-title')).toBe('预览文章标题 (Preview Title)')
        expect(wrapper.find('.article-card-stub').attributes('data-cover')).toBe('https://example.com/logo.png')
        expect(wrapper.find('.preview-inner').attributes('style')).toContain('filter: none')
        expect(wrapper.findAll('.button-stub')).toHaveLength(2)
        expect(wrapper.findAll('.select-option')).toHaveLength(3)
        expect(wrapper.find('.input-stub').exists()).toBe(false)
    })

    it('applies the grayscale filter when mourning mode is enabled', async () => {
        themeState.settings = ref(createSettings({ themeMourningMode: true }))

        const wrapper = await mountComponent()

        expect(wrapper.find('.preview-inner').attributes('style')).toContain('grayscale(100%)')
    })

    it('switches background type through the select button', async () => {
        const settings = createSettings()
        themeState.settings = ref(settings)
        const wrapper = await mountComponent()

        expect(wrapper.find('.select-button-stub').attributes('data-value')).toBe('none')

        await wrapper.find('.select-image').trigger('click')

        expect(settings.themeBackgroundType).toBe('image')
    })

    it('updates the background image URL when the image type is selected', async () => {
        const settings = createSettings({ themeBackgroundType: 'image' })
        themeState.settings = ref(settings)
        const wrapper = await mountComponent()

        const input = wrapper.find('.input-stub')
        expect(input.exists()).toBe(true)
        await input.setValue('https://example.com/bg.jpg')

        expect(settings.themeBackgroundValue).toBe('https://example.com/bg.jpg')
    })

    it('updates the background color through the text input and color picker', async () => {
        const settings = createSettings({ themeBackgroundType: 'color' })
        themeState.settings = ref(settings)
        const wrapper = await mountComponent()

        expect(wrapper.find('.input-stub').attributes('placeholder')).toBe('#ffffff')
        const picker = wrapper.find('.color-picker-stub')
        expect(picker.exists()).toBe(true)
        await picker.setValue('abcdef')
        expect(settings.themeBackgroundValue).toBe('#abcdef')

        await wrapper.find('.input-stub').setValue('112233')
        expect(settings.themeBackgroundValue).toBe('#112233')

        // 清空颜色输入映射为 null
        await wrapper.find('.input-stub').setValue('')
        expect(settings.themeBackgroundValue).toBeNull()
    })

    it('falls back to the dark preset color when the dark mode is active', async () => {
        themeState.isDark = true
        themeState.settings = ref(createSettings({ themeBackgroundType: 'color' }))

        const wrapper = await mountComponent()

        expect(wrapper.find('.input-stub').attributes('placeholder')).toBe('#020617')
    })

    it('locks background controls and shows env hints when fields are locked', async () => {
        themeState.isLocked = (key: string) => key.startsWith('themeBackground')
        themeState.settings = ref(createSettings({ themeBackgroundType: 'color' }))

        const wrapper = await mountComponent()

        expect(wrapper.find('.select-button-stub').attributes('data-disabled')).toBe('true')
        expect(wrapper.find('.color-picker-stub').attributes('disabled')).toBeDefined()
        expect(wrapper.find('.input-stub').attributes('disabled')).toBeDefined()
        const tooltips = wrapper.findAll('.tooltip-stub')
        expect(tooltips).toHaveLength(2)
        expect(tooltips[0]?.attributes('data-content')).toBe('pages.admin.settings.system.locked_by_env')
    })

    it('locks the image URL input when the background value is locked', async () => {
        themeState.isLocked = (key: string) => key === 'themeBackgroundValue'
        themeState.settings = ref(createSettings({ themeBackgroundType: 'image' }))

        const wrapper = await mountComponent()

        expect(wrapper.find('.input-stub').attributes('disabled')).toBeDefined()
        expect(wrapper.findAll('.tooltip-stub')).toHaveLength(1)
    })
})
