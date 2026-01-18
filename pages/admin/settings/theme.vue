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
                            :style="{backgroundColor: 'var(--p-surface-0)', color: 'var(--p-text-color)'}"
                        >
                            <ArticleCard
                                :post="{
                                    id: 1,
                                    title: '预览文章标题 (Preview Title)',
                                    summary: '这是一个预览摘要，用于展示主题配置后的实时效果。您可以尝试更改主色调、圆角或背景来观察变化。',
                                    cover: settings?.theme_logo_url || '',
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
                                    :style="{backgroundColor: 'var(--m-accent-color)', borderColor: 'var(--m-accent-color)', color: '#fff'}"
                                />
                            </div>
                        </div>
                    </div>
                </Panel>

                <Panel :header="$t('pages.admin.settings.theme.background')" class="mt-4">
                    <div class="form-group">
                        <label>{{ $t('pages.admin.settings.theme.background_type') }}</label>
                        <SelectButton
                            v-model="settings.theme_background_type"
                            :options="backgroundOptions"
                            option-label="label"
                            option-value="value"
                            :allow-empty="false"
                            class="mt-2"
                        />
                    </div>

                    <div v-if="settings.theme_background_type === 'color'" class="form-group mt-3">
                        <label>{{ $t('pages.admin.settings.theme.background_color') }}</label>
                        <div class="color-input-group mt-2">
                            <ColorPicker v-model="settings.theme_background_value" format="hex" />
                            <InputText v-model="backgroundColorModel" placeholder="#ffffff" />
                        </div>
                    </div>

                    <div v-if="settings.theme_background_type === 'image'" class="form-group mt-3">
                        <label>{{ $t('pages.admin.settings.theme.background_image') }} URL</label>
                        <div class="input-with-icon mt-2">
                            <i class="pi pi-image" />
                            <InputText v-model="settings.theme_background_value" placeholder="https://example.com/bg.jpg" />
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
                                v-model="settings.theme_preset"
                                :options="presetOptions"
                                option-label="label"
                                option-value="value"
                                class="mt-2 w-full"
                                @change="onPresetChange"
                            />
                            <p v-if="settings.theme_preset === 'custom'" class="hint-text mt-2">
                                {{ $t('pages.admin.settings.theme.custom_hint') }}
                            </p>
                        </div>

                        <Divider />

                        <!-- 主色调 -->
                        <div class="form-group">
                            <label>{{ $t('pages.admin.settings.theme.primary_color') }}</label>
                            <div class="color-input-group mt-2">
                                <ColorPicker v-model="primaryPickerModel" format="hex" />
                                <InputText
                                    v-model="primaryColorModel"
                                    :placeholder="getCurrentPresetValue('primary')"
                                />
                            </div>
                        </div>

                        <!-- 点缀色 -->
                        <div class="form-group mt-3">
                            <label>{{ $t('pages.admin.settings.theme.accent_color') }}</label>
                            <div class="color-input-group mt-2">
                                <ColorPicker v-model="accentPickerModel" format="hex" />
                                <InputText
                                    v-model="accentColorModel"
                                    :placeholder="getCurrentPresetValue('accent')"
                                />
                            </div>
                        </div>

                        <!-- 圆角 -->
                        <div class="form-group mt-3">
                            <label>{{ $t('pages.admin.settings.theme.border_radius') }}</label>
                            <div class="input-with-addon mt-2">
                                <InputText v-model="settings.theme_border_radius" :placeholder="getCurrentPresetValue('radius')" />
                                <span class="addon">rem/px</span>
                            </div>
                        </div>

                        <Divider />

                        <!-- 品牌标识 -->
                        <div class="form-group">
                            <label>{{ $t('pages.admin.settings.theme.logo') }} URL</label>
                            <InputText
                                v-model="settings.theme_logo_url"
                                placeholder="/logo.png"
                                class="mt-2"
                            />
                        </div>

                        <div class="form-group mt-3">
                            <label>{{ $t('pages.admin.settings.theme.favicon') }} URL</label>
                            <InputText
                                v-model="settings.theme_favicon_url"
                                placeholder="/favicon.ico"
                                class="mt-2"
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
const createColorModel = (key: 'theme_primary_color' | 'theme_accent_color' | 'theme_background_value') => {
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
                // 统一存储为带 # 的格式，确保 CSS 变量解析正确
                if (!newVal) {
                    settings.value[key] = ''
                    return
                }
                settings.value[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}

// 专门为 ColorPicker 创建的 Model，处理 fallback 到 Preset 默认值，且去掉 # 号
const createColorPickerModel = (key: 'theme_primary_color' | 'theme_accent_color' | 'theme_background_value') => {
    const typeMap = {
        theme_primary_color: 'primary',
        theme_accent_color: 'accent',
        theme_background_value: 'primary', // 背景色暂时 fallback 到主色或默认
    }
    return computed({
        get: () => {
            let val = settings.value?.[key]
            if (!val) {
                val = getCurrentPresetValue(typeMap[key] as any)
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

const primaryColorModel = createColorModel('theme_primary_color')
const accentColorModel = createColorModel('theme_accent_color')
const backgroundColorModel = createColorModel('theme_background_value')

const primaryPickerModel = createColorPickerModel('theme_primary_color')
const accentPickerModel = createColorPickerModel('theme_accent_color')
const backgroundPickerModel = createColorPickerModel('theme_background_value')

// 用于判断当前模式（深/浅）以显示正确的 Placeholder
const isDark = useDark()

const getCurrentPresetValue = (type: 'primary' | 'accent' | 'radius') => {
    if (!settings.value) {
        return ''
    }
    const presetKey = (settings.value.theme_preset || 'default') as keyof typeof PRESETS
    const preset = PRESETS[presetKey]
    if (type === 'radius') {
        return preset.radius
    }
    const mode = isDark.value ? 'dark' : 'light'
    return (preset[type] as any)[mode]
}

// 转换 mourning_mode 为布尔值用于 ToggleSwitch
const mourningModeRef = computed({
    get: () => {
        const val = settings.value?.theme_mourning_mode
        return val === true || val === 'true'
    },
    set: (val: boolean) => {
        if (settings.value) {
            settings.value.theme_mourning_mode = val
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
    if (!settings.value || settings.value.theme_preset === 'custom') {
        return
    }
    // 切换预设时清空手动覆盖项，使其使用预设默认值
    settings.value.theme_primary_color = null
    settings.value.theme_accent_color = null
    settings.value.theme_border_radius = null
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
@use "@/styles/_variables.scss" as *;

.admin-theme-settings {
    padding-bottom: 3rem;
}

.theme-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 2rem;
    margin-top: 1.5rem;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
    }
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

    :global(.dark) & {
        background-color: var(--p-surface-900);
    }
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
    padding: 0.25rem 0;
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
        background-color: var(--p-surface-50);
        border: 1px solid var(--p-content-border-color);
        border-left: none;
        padding: 0 0.75rem;
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;

        :global(.dark) & {
            background-color: var(--p-surface-800);
        }
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

:deep(.p-panel) {
    .p-panel-header {
        background: transparent;
        border: none;
        padding-bottom: 0.5rem;
    }
    .p-panel-content {
        border: none;
        background: transparent;
        padding-top: 0;
    }
}
</style>
