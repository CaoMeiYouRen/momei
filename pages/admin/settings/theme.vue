<template>
    <div v-if="settings" class="admin-theme-settings">
        <AdminPageHeader :title="$t('pages.admin.settings.theme.title')">
            <template #actions>
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    :loading="loading"
                    @click="saveTheme"
                />
            </template>
        </AdminPageHeader>

        <div class="theme-grid">
            <!-- 左侧：实时预览 -->
            <div class="theme-preview-section">
                <Panel :header="$t('pages.admin.settings.theme.preview')" class="preview-panel">
                    <div class="preview-canvas shadow-2">
                        <div
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
                        <label>{{ $t('pages.admin.settings.theme.background_type') }}</label>
                        <SelectButton
                            v-model="settings.themeBackgroundType"
                            :options="backgroundOptions"
                            option-label="label"
                            option-value="value"
                            :allow-empty="false"
                            class="mt-2"
                        />
                    </div>

                    <div v-if="settings.themeBackgroundType === 'color'" class="form-group mt-3">
                        <label>{{ $t('pages.admin.settings.theme.background_color') }}</label>
                        <div class="color-input-group mt-2">
                            <ColorPicker v-model="backgroundPickerModel" format="hex" />
                            <InputText v-model="backgroundColorModel" placeholder="#ffffff" />
                        </div>
                    </div>

                    <div v-if="settings.themeBackgroundType === 'image'" class="form-group mt-3">
                        <label>{{ $t('pages.admin.settings.theme.background_image') }} URL</label>
                        <div class="input-with-icon mt-2">
                            <i class="pi pi-image" />
                            <InputText v-model="settings.themeBackgroundValue" placeholder="https://example.com/bg.jpg" />
                        </div>
                    </div>
                </Panel>
            </div>

            <!-- 右侧：设置面板 -->
            <div class="theme-config-section">
                <Panel :header="$t('common.settings')">
                    <div class="config-form">
                        <!-- 预设选择 -->
                        <div class="form-group">
                            <label>{{ $t('pages.admin.settings.theme.preset') }}</label>
                            <Dropdown
                                v-model="settings.themePreset"
                                :options="presetOptions"
                                option-label="label"
                                option-value="value"
                                class="mt-2 w-full"
                                @change="onPresetChange"
                            />
                            <p v-if="settings.themePreset === 'custom'" class="hint-text mt-2">
                                {{ $t('pages.admin.settings.theme.custom_hint') }}
                            </p>
                            <p class="hint-text mt-1">
                                {{ $t('pages.admin.settings.theme.color_reset_hint') }}
                            </p>
                        </div>

                        <ClientOnly>
                            <Tabs value="0" class="mt-4">
                                <TabList>
                                    <Tab value="0">
                                        {{ $t('pages.admin.settings.theme.color_group_light') }}
                                    </Tab>
                                    <Tab value="1">
                                        {{ $t('pages.admin.settings.theme.color_group_dark') }}
                                    </Tab>
                                    <Tab value="2">
                                        {{ $t('common.settings') }}
                                    </Tab>
                                </TabList>
                                <TabPanels class="px-0">
                                    <TabPanel value="0">
                                        <!-- 浅色模式色彩 -->
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.primary_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="primaryPickerModel" format="hex" />
                                                <InputText
                                                    v-model="primaryColorModel"
                                                    :placeholder="getCurrentPresetValue('primary', false)"
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.accent_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="accentPickerModel" format="hex" />
                                                <InputText
                                                    v-model="accentColorModel"
                                                    :placeholder="getCurrentPresetValue('accent', false)"
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.surface_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="surfacePickerModel" format="hex" />
                                                <InputText
                                                    v-model="surfaceColorModel"
                                                    :placeholder="getCurrentPresetValue('surface', false)"
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.text_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="textPickerModel" format="hex" />
                                                <InputText
                                                    v-model="textColorModel"
                                                    :placeholder="getCurrentPresetValue('text', false)"
                                                />
                                            </div>
                                        </div>
                                    </TabPanel>

                                    <TabPanel value="1">
                                        <!-- 深色模式色彩 -->
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.dark_primary_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="darkPrimaryPickerModel" format="hex" />
                                                <InputText
                                                    v-model="darkPrimaryColorModel"
                                                    :placeholder="getCurrentPresetValue('primary', true)"
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.dark_accent_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="darkAccentPickerModel" format="hex" />
                                                <InputText
                                                    v-model="darkAccentColorModel"
                                                    :placeholder="getCurrentPresetValue('accent', true)"
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.dark_surface_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="darkSurfacePickerModel" format="hex" />
                                                <InputText
                                                    v-model="darkSurfaceColorModel"
                                                    :placeholder="getCurrentPresetValue('surface', true)"
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.dark_text_color') }}</label>
                                            <div class="color-input-group mt-2">
                                                <ColorPicker v-model="darkTextPickerModel" format="hex" />
                                                <InputText
                                                    v-model="darkTextColorModel"
                                                    :placeholder="getCurrentPresetValue('text', true)"
                                                />
                                            </div>
                                        </div>
                                    </TabPanel>

                                    <TabPanel value="2">
                                        <!-- 其他设置 -->
                                        <div class="form-group">
                                            <label>{{ $t('pages.admin.settings.theme.border_radius') }}</label>
                                            <div class="input-with-addon mt-2">
                                                <InputText
                                                    v-model="settings.themeBorderRadius"
                                                    :placeholder="getCurrentPresetValue('radius')"
                                                />
                                                <span class="addon">rem/px</span>
                                            </div>
                                        </div>

                                        <Divider />

                                        <!-- 品牌标识 -->
                                        <div class="form-group">
                                            <label>{{ $t('pages.admin.settings.theme.logo') }} URL</label>
                                            <InputText
                                                v-model="settings.themeLogoUrl"
                                                placeholder="/logo.png"
                                                class="mt-2 w-full"
                                            />
                                        </div>

                                        <div class="form-group mt-3">
                                            <label>{{ $t('pages.admin.settings.theme.favicon') }} URL</label>
                                            <InputText
                                                v-model="settings.themeFaviconUrl"
                                                placeholder="/favicon.ico"
                                                class="mt-2 w-full"
                                            />
                                        </div>

                                        <Divider />

                                        <!-- 特殊模式 -->
                                        <div class="form-group">
                                            <div class="align-items-center flex justify-content-between">
                                                <label>{{ $t('pages.admin.settings.theme.mourning_mode') }}</label>
                                                <ToggleSwitch v-model="mourningModeRef" />
                                            </div>
                                            <p class="hint-text mt-1">
                                                {{ $t('pages.admin.settings.theme.mourning_mode_hint') }}
                                            </p>
                                        </div>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        </ClientOnly>
                    </div>
                </Panel>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useTheme, PRESETS } from '@/composables/use-theme'
import AdminPageHeader from '@/components/admin-page-header.vue'
import ArticleCard from '@/components/article-card.vue'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const toast = useToast()
const { settings, applyTheme } = useTheme()
const loading = ref(false)

// 处理颜色值的双向绑定，确保 ColorPicker (无#) 和 InputText (有#) 同步
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
                // 统一存储为带 # 的格式，确保 CSS 变量解析正确
                if (!newVal) {
                    (settings.value as any)[key] = null
                    return
                }
                (settings.value as any)[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}

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
        themeBackgroundValue: 'primary',
    }

    return computed({
        get: () => {
            let val = (settings.value as any)?.[key]
            if (!val) {
                const isDarkField = key.toLowerCase().includes('dark')
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

const primaryColorModel = createColorModel('themePrimaryColor')
const accentColorModel = createColorModel('themeAccentColor')
const surfaceColorModel = createColorModel('themeSurfaceColor')
const textColorModel = createColorModel('themeTextColor')

const darkPrimaryColorModel = createColorModel('themeDarkPrimaryColor')
const darkAccentColorModel = createColorModel('themeDarkAccentColor')
const darkSurfaceColorModel = createColorModel('themeDarkSurfaceColor')
const darkTextColorModel = createColorModel('themeDarkTextColor')

const backgroundColorModel = createColorModel('themeBackgroundValue')

const primaryPickerModel = createColorPickerModel('themePrimaryColor')
const accentPickerModel = createColorPickerModel('themeAccentColor')
const surfacePickerModel = createColorPickerModel('themeSurfaceColor')
const textPickerModel = createColorPickerModel('themeTextColor')

const darkPrimaryPickerModel = createColorPickerModel('themeDarkPrimaryColor')
const darkAccentPickerModel = createColorPickerModel('themeDarkAccentColor')
const darkSurfacePickerModel = createColorPickerModel('themeDarkSurfaceColor')
const darkTextPickerModel = createColorPickerModel('themeDarkTextColor')

const backgroundPickerModel = createColorPickerModel('themeBackgroundValue')

// 用于判断当前模式（深/浅）以显示正确的 Placeholder
const isDark = useDark()

const getCurrentPresetValue = (type: 'primary' | 'accent' | 'surface' | 'text' | 'radius', forceDark?: boolean) => {
    if (!settings.value) {
        return ''
    }
    const presetKey = (settings.value.themePreset || 'default') as keyof typeof PRESETS
    const preset = PRESETS[presetKey]
    if (type === 'radius') {
        return preset.radius
    }
    const mode = forceDark ? 'dark' : 'light'
    return (preset[type] as any)[mode]
}

// 转换 mourning_mode 为布尔值用于 ToggleSwitch
const mourningModeRef = computed({
    get: () => {
        const val = settings.value?.themeMourningMode
        return val === true || val === 'true'
    },
    set: (val: boolean) => {
        if (settings.value) {
            settings.value.themeMourningMode = val
        }
    },
})

const backgroundOptions = computed(() => [
    { label: t('pages.admin.settings.theme.background_none'), value: 'none' },
    { label: t('pages.admin.settings.theme.background_color'), value: 'color' },
    { label: t('pages.admin.settings.theme.background_image'), value: 'image' },
])

const presetOptions = computed(() => [
    { label: t('pages.admin.settings.theme.presets.default'), value: 'default' },
    { label: t('pages.admin.settings.theme.presets.green'), value: 'green' },
    { label: t('pages.admin.settings.theme.presets.amber'), value: 'amber' },
    { label: t('pages.admin.settings.theme.presets.geek'), value: 'geek' },
    { label: t('pages.admin.settings.theme.presets.custom'), value: 'custom' },
])

// 监听设置变化以进行实时预览
watch(settings, () => {
    applyTheme()
}, { deep: true })

const onPresetChange = () => {
    if (!settings.value || settings.value.themePreset === 'custom') {
        return
    }
    // 切换预设时清空手动覆盖项，使其使用预设默认值
    settings.value.themePrimaryColor = null
    settings.value.themeAccentColor = null
    settings.value.themeSurfaceColor = null
    settings.value.themeTextColor = null
    settings.value.themeDarkPrimaryColor = null
    settings.value.themeDarkAccentColor = null
    settings.value.themeDarkSurfaceColor = null
    settings.value.themeDarkTextColor = null
    settings.value.themeBorderRadius = null
}

const saveTheme = async () => {
    if (!settings.value) {
        return
    }
    loading.value = true
    try {
        await $fetch('/api/admin/settings/theme', {
            method: 'PUT',
            body: settings.value,
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.theme.save_success'),
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('common.error'),
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.admin-theme-settings {
    padding-bottom: 3rem;
}

.theme-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;
    margin-top: 1.5rem;
    align-items: start;

    @media (width <= 1400px) {
        grid-template-columns: 1fr 340px;
    }

    @media (width <= 1200px) {
        grid-template-columns: 1fr;
    }
}

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

// 表单样式
.config-form {
    padding: 0;
}

.theme-config-section {
    background-color: var(--p-surface-0);
    border-radius: 12px;
    border: 1px solid var(--p-content-border-color);
    height: fit-content;

    :deep(.p-panel) {
        border: none;
        background: transparent;

        .p-panel-header {
            background: transparent;
            border: none;
            padding: 1.25rem;
            color: var(--p-text-color);
        }

        .p-panel-content {
            border: none;
            background: transparent;
            padding: 0 1.25rem 1.25rem;
        }
    }

    :deep(.p-tabs) {
        background: transparent;
        border: none;
        width: 100%;
        margin-top: 1rem;
    }

    :deep(.p-tablist) {
        background: transparent;
    }

    :deep(.p-tablist-tab-list) {
        background: transparent;
        border-color: var(--p-content-border-color);
        display: flex;
    }

    :deep(.p-tab) {
        flex: 1;
        padding: 0.75rem 0.25rem;
        font-size: 0.8125rem;
        white-space: nowrap;
        justify-content: center;
        color: var(--p-text-muted-color);
        border-bottom: 2px solid transparent;
        transition: all 0.2s;

        &.p-tab-active {
            color: var(--p-primary-color);
            border-bottom-color: var(--p-primary-color);
        }

        &:hover:not(.p-tab-active) {
            color: var(--p-text-color);
            background: var(--p-surface-50);
        }
    }
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

    .hint-text {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        line-height: 1.4;
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

.input-with-addon {
    display: flex;
    align-items: stretch;

    :deep(.p-inputtext) {
        flex: 1;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    .addon {
        display: flex;
        align-items: center;
        background-color: var(--p-surface-100);
        border: 1px solid var(--p-content-border-color);
        border-left: none;
        padding: 0 0.75rem;
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
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

:deep(.p-divider) {
    margin: 1.25rem 0;
}
</style>
