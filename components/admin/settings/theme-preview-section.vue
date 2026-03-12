<template>
    <div v-if="settings" class="theme-preview-section">
        <Panel :header="$t('pages.admin.settings.theme.preview')" class="preview-panel">
            <div class="preview-canvas shadow-2">
                <div
                    ref="previewInner"
                    class="preview-inner"
                    :style="{
                        backgroundColor: 'var(--p-surface-0)',
                        color: 'var(--p-text-color)',
                        filter: settings.themeMourningMode ? 'grayscale(100%)' : 'none'
                    }"
                >
                    <ArticleCard
                        :post="previewPost"
                    />
                    <div class="preview-actions">
                        <Button :label="$t('common.preview')" class="p-button-sm" />
                        <Button
                            label="Accent Action"
                            icon="pi pi-bolt"
                            class="p-button-sm"
                            :style="{
                                backgroundColor: 'var(--m-accent-color)',
                                borderColor: 'var(--m-accent-color)',
                                color: 'var(--p-primary-contrast-color)'
                            }"
                        />
                    </div>
                </div>
            </div>
        </Panel>

        <Panel :header="$t('pages.admin.settings.theme.background')" class="mt-4">
            <div class="form-group">
                <div class="align-items-center flex gap-2">
                    <label>{{ $t('pages.admin.settings.theme.background_type') }}</label>
                    <i
                        v-if="isLocked('themeBackgroundType')"
                        v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                        class="pi pi-lock text-muted-color text-xs"
                    />
                </div>
                <SelectButton
                    v-model="settings.themeBackgroundType"
                    :options="backgroundOptions"
                    option-label="label"
                    option-value="value"
                    :allow-empty="false"
                    class="mt-2"
                    :disabled="isLocked('themeBackgroundType')"
                />
            </div>

            <div v-if="settings.themeBackgroundType === 'color'" class="form-group mt-3">
                <div class="align-items-center flex gap-2">
                    <label>{{ $t('pages.admin.settings.theme.background_color') }}</label>
                    <i
                        v-if="isLocked('themeBackgroundValue')"
                        v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                        class="pi pi-lock text-muted-color text-xs"
                    />
                </div>
                <div class="color-input-group mt-2">
                    <ColorPicker
                        v-model="backgroundPickerModel"
                        format="hex"
                        :disabled="isLocked('themeBackgroundValue')"
                    />
                    <InputText
                        v-model="backgroundColorModel"
                        :placeholder="getCurrentPresetValue('surface', isDark)"
                        :disabled="isLocked('themeBackgroundValue')"
                    />
                </div>
            </div>

            <div v-if="settings.themeBackgroundType === 'image'" class="form-group mt-3">
                <div class="align-items-center flex gap-2">
                    <label>{{ $t('pages.admin.settings.theme.background_image') }} URL</label>
                    <i
                        v-if="isLocked('themeBackgroundValue')"
                        v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                        class="pi pi-lock text-muted-color text-xs"
                    />
                </div>
                <div class="input-with-icon mt-2">
                    <i class="pi pi-image" />
                    <InputText
                        v-model="settings.themeBackgroundValue"
                        placeholder="https://example.com/bg.jpg"
                        :disabled="isLocked('themeBackgroundValue')"
                    />
                </div>
            </div>
        </Panel>
    </div>
</template>

<script setup lang="ts">
import {
    useTheme,
    PRESETS,
    type ThemeMode,
    type ThemePresetColorKey,
    type ThemePresetKey,
    type ThemePresetValueKey,
    type ThemePreviewColorSettingKey,
} from '@/composables/use-theme'
import ArticleCard from '@/components/article-card.vue'
import { PostStatus, PostVisibility, type Post } from '@/types/post'
import { useThemeMode } from '@/composables/use-theme-mode'

const { t } = useI18n()
const { settings, isLocked } = useTheme()
const isDark = useThemeMode()

const previewInner = ref<HTMLElement | null>(null)

const previewColorTypeMap: Record<ThemePreviewColorSettingKey, ThemePresetColorKey> = {
    themePrimaryColor: 'primary',
    themeAccentColor: 'accent',
    themeSurfaceColor: 'surface',
    themeTextColor: 'text',
    themeDarkPrimaryColor: 'primary',
    themeDarkAccentColor: 'accent',
    themeDarkSurfaceColor: 'surface',
    themeDarkTextColor: 'text',
    themeBackgroundValue: 'surface',
}

function resolvePresetKey(preset: string | null | undefined): ThemePresetKey {
    return preset && preset in PRESETS ? preset as ThemePresetKey : 'default'
}

defineExpose({
    previewInner,
})

const previewPost = computed<Post>(() => ({
    id: 'theme-preview-post',
    title: '预览文章标题 (Preview Title)',
    content: '',
    summary: '这是一个预览摘要，用于展示主题配置后的实时效果。您可以尝试更改主色调、圆角或背景来观察变化。',
    slug: 'theme-preview',
    status: PostStatus.PUBLISHED,
    visibility: PostVisibility.PUBLIC,
    coverImage: settings.value?.themeLogoUrl || null,
    category: {
        id: 'theme-preview-category',
        name: 'Demo',
        slug: 'demo',
    },
    tags: [
        { id: 'theme-preview-tag', name: 'Theme', slug: 'theme' },
        { id: 'theme-preview-preview-tag', name: 'Preview', slug: 'preview' },
    ],
    views: 1234,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    language: 'zh-CN',
}))

const getCurrentPresetValue = (type: ThemePresetValueKey, forceDark = false) => {
    if (!settings.value) {
        return ''
    }
    const presetKey = resolvePresetKey(settings.value.themePreset)
    const preset = PRESETS[presetKey] || PRESETS.default
    if (!preset) {
        return ''
    }
    if (type === 'radius') {
        return preset.radius || ''
    }
    const mode: ThemeMode = forceDark ? 'dark' : 'light'
    const value = preset[type][mode]
    return value || ''
}

const backgroundOptions = computed<Array<{ label: string, value: 'none' | 'color' | 'image' }>>(() => [
    { label: t('pages.admin.settings.theme.background_none'), value: 'none' },
    { label: t('pages.admin.settings.theme.background_color'), value: 'color' },
    { label: t('pages.admin.settings.theme.background_image'), value: 'image' },
])

// 专门为 ColorPicker 创建的 Model，处理 fallback 到 Preset 默认值，且去掉 # 号
const createColorPickerModel = (key: ThemePreviewColorSettingKey) => {
    return computed({
        get: () => {
            let val = settings.value?.[key]
            if (!val) {
                const isDarkField = key.toLowerCase().includes('dark') || (key === 'themeBackgroundValue' && isDark.value)
                val = getCurrentPresetValue(previewColorTypeMap[key], isDarkField)
            }
            return val ? val.replace('#', '') : ''
        },
        set: (newVal: string) => {
            if (settings.value) {
                settings.value[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}

const createColorModel = (key: ThemePreviewColorSettingKey) => {
    return computed({
        get: () => {
            const val = settings.value?.[key]
            if (!val) {
                return ''
            }
            return val.startsWith('#') ? val : `#${val}`
        },
        set: (newVal: string) => {
            if (settings.value) {
                if (!newVal) {
                    settings.value[key] = null
                    return
                }
                settings.value[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}

const backgroundPickerModel = createColorPickerModel('themeBackgroundValue')
const backgroundColorModel = createColorModel('themeBackgroundValue')
</script>

<style lang="scss" scoped>
@use "@/styles/admin-form" as *;

.theme-preview-section {
    min-width: 0;
    width: 100%;
}

// 预览区域样式
.preview-canvas {
    background-color: var(--p-surface-100);
    padding: 3rem 2rem;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    position: relative;
    overflow: hidden;
}

.preview-inner {
    width: 100%;
    max-width: 500px;
    padding: 1.5rem;
    border-radius: var(--p-content-border-radius);
    transition: all 0.3s ease;
    border: 1px solid var(--p-content-border-color);
}

.preview-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.form-group {
    @include admin-form-group($hint-selector: null);
}

.color-input-group {
    @include admin-color-input-group;
}

.input-with-icon {
    @include admin-input-with-icon;
}
</style>
