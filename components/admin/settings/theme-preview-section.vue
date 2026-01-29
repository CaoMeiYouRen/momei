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
                        :post="{
                            id: 1,
                            title: '预览文章标题 (Preview Title)',
                            summary: '这是一个预览摘要，用于展示主题配置后的实时效果。您可以尝试更改主色调、圆角或背景来观察变化。',
                            cover: settings?.themeLogoUrl || '',
                            createdAt: new Date().toISOString(),
                            tags: [{name: 'Theme'}, {name: 'Preview'}],
                            viewCount: 1234,
                            commentCount: 56,
                            category: {name: 'Demo'}
                        } as any"
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
import { useTheme, PRESETS } from '@/composables/use-theme'
import ArticleCard from '@/components/article-card.vue'

const { t } = useI18n()
const { settings, isLocked } = useTheme()
const isDark = useDark()

const previewInner = ref<HTMLElement | null>(null)

defineExpose({
    previewInner,
})

const getCurrentPresetValue = (type: 'primary' | 'accent' | 'surface' | 'text' | 'radius', forceDark?: boolean) => {
    if (!settings.value) {
        return ''
    }
    const presetKey = (settings.value.themePreset || 'default') as keyof typeof PRESETS
    const preset = PRESETS[presetKey] || PRESETS.default
    if (!preset) {
        return ''
    }
    if (type === 'radius') {
        return preset.radius || ''
    }
    const mode = forceDark ? 'dark' : 'light'
    const value = (preset[type] as any)?.[mode]
    return value || ''
}

const backgroundOptions = computed(() => [
    { label: t('pages.admin.settings.theme.background_none'), value: 'none' },
    { label: t('pages.admin.settings.theme.background_color'), value: 'color' },
    { label: t('pages.admin.settings.theme.background_image'), value: 'image' },
])

// 专门为 ColorPicker 创建的 Model，处理 fallback 到 Preset 默认值，且去掉 # 号
const createColorPickerModel = (key: any) => {
    const typeMap: Record<string, string> = {
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

    return computed({
        get: () => {
            let val = (settings.value as any)?.[key]
            if (!val) {
                const isDarkField = key.toLowerCase().includes('dark') || (key === 'themeBackgroundValue' && isDark.value)
                val = getCurrentPresetValue(typeMap[key] as any, isDarkField)
            }
            return val ? val.replace('#', '') : ''
        },
        set: (newVal: string) => {
            if (settings.value) {
                (settings.value as any)[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}

const createColorModel = (key: any) => {
    return computed({
        get: () => {
            const val = (settings.value as any)?.[key]
            if (!val) {
                return ''
            }
            return val.startsWith('#') ? val : `#${val}`
        },
        set: (newVal: string) => {
            if (settings.value) {
                if (!newVal) {
                    (settings.value as any)[key] = null
                    return
                }
                (settings.value as any)[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}

const backgroundPickerModel = createColorPickerModel('themeBackgroundValue')
const backgroundColorModel = createColorModel('themeBackgroundValue')
</script>

<style lang="scss" scoped>
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
    margin-bottom: 1.5rem;

    label {
        display: block;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
        color: var(--p-text-color);
    }
}

.color-input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;

    :deep(.p-colorpicker) {
        flex-shrink: 0;
        width: 32px;
        height: 32px;

        .p-colorpicker-preview {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: 1px solid var(--p-content-border-color);
        }
    }

    :deep(.p-inputtext) {
        flex: 1;
        min-width: 0;
    }
}

.input-with-icon {
    position: relative;
    display: flex;
    align-items: center;

    i {
        position: absolute;
        left: 0.75rem;
        color: var(--p-text-muted-color);
        z-index: 1;
    }

    :deep(.p-inputtext) {
        padding-left: 2.25rem;
        width: 100%;
    }
}
</style>
