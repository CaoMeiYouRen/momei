<template>
    <div v-if="settings" class="theme-config-section">
        <Panel :header="$t('common.settings')">
            <div class="config-form">
                <!-- 预设选择 -->
                <div class="form-group">
                    <div class="align-items-center flex gap-2">
                        <label>{{ $t('pages.admin.settings.theme.preset') }}</label>
                        <i
                            v-if="isLocked('themePreset')"
                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                            class="pi pi-lock text-muted-color text-xs"
                        />
                    </div>
                    <Select
                        v-model="settings.themePreset"
                        :options="presetOptions"
                        option-label="label"
                        option-value="value"
                        class="mt-2 w-full"
                        :disabled="isLocked('themePreset')"
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
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.primary_color') }}</label>
                                        <i
                                            v-if="isLocked('themePrimaryColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="primaryPickerModel"
                                            format="hex"
                                            :disabled="isLocked('themePrimaryColor')"
                                        />
                                        <InputText
                                            v-model="primaryColorModel"
                                            :placeholder="getCurrentPresetValue('primary', false)"
                                            :disabled="isLocked('themePrimaryColor')"
                                        />
                                    </div>
                                </div>
                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.accent_color') }}</label>
                                        <i
                                            v-if="isLocked('themeAccentColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="accentPickerModel"
                                            format="hex"
                                            :disabled="isLocked('themeAccentColor')"
                                        />
                                        <InputText
                                            v-model="accentColorModel"
                                            :placeholder="getCurrentPresetValue('accent', false)"
                                            :disabled="isLocked('themeAccentColor')"
                                        />
                                    </div>
                                </div>
                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.surface_color') }}</label>
                                        <i
                                            v-if="isLocked('themeSurfaceColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="surfacePickerModel"
                                            format="hex"
                                            :disabled="isLocked('themeSurfaceColor')"
                                        />
                                        <InputText
                                            v-model="surfaceColorModel"
                                            :placeholder="getCurrentPresetValue('surface', false)"
                                            :disabled="isLocked('themeSurfaceColor')"
                                        />
                                    </div>
                                </div>
                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.text_color') }}</label>
                                        <i
                                            v-if="isLocked('themeTextColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="textPickerModel"
                                            format="hex"
                                            :disabled="isLocked('themeTextColor')"
                                        />
                                        <InputText
                                            v-model="textColorModel"
                                            :placeholder="getCurrentPresetValue('text', false)"
                                            :disabled="isLocked('themeTextColor')"
                                        />
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel value="1">
                                <!-- 深色模式色彩 -->
                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.dark_primary_color') }}</label>
                                        <i
                                            v-if="isLocked('themeDarkPrimaryColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="darkPrimaryPickerModel"
                                            format="hex"
                                            :disabled="isLocked('themeDarkPrimaryColor')"
                                        />
                                        <InputText
                                            v-model="darkPrimaryColorModel"
                                            :placeholder="getCurrentPresetValue('primary', true)"
                                            :disabled="isLocked('themeDarkPrimaryColor')"
                                        />
                                    </div>
                                </div>
                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.dark_accent_color') }}</label>
                                        <i
                                            v-if="isLocked('themeDarkAccentColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="darkAccentPickerModel"
                                            format="hex"
                                            :disabled="isLocked('themeDarkAccentColor')"
                                        />
                                        <InputText
                                            v-model="darkAccentColorModel"
                                            :placeholder="getCurrentPresetValue('accent', true)"
                                            :disabled="isLocked('themeDarkAccentColor')"
                                        />
                                    </div>
                                </div>
                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.dark_surface_color') }}</label>
                                        <i
                                            v-if="isLocked('themeDarkSurfaceColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="darkSurfacePickerModel"
                                            format="hex"
                                            :disabled="isLocked('themeDarkSurfaceColor')"
                                        />
                                        <InputText
                                            v-model="darkSurfaceColorModel"
                                            :placeholder="getCurrentPresetValue('surface', true)"
                                            :disabled="isLocked('themeDarkSurfaceColor')"
                                        />
                                    </div>
                                </div>
                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.dark_text_color') }}</label>
                                        <i
                                            v-if="isLocked('themeDarkTextColor')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="color-input-group mt-2">
                                        <ColorPicker
                                            v-model="darkTextPickerModel"
                                            format="hex"
                                            :disabled="isLocked('themeDarkTextColor')"
                                        />
                                        <InputText
                                            v-model="darkTextColorModel"
                                            :placeholder="getCurrentPresetValue('text', true)"
                                            :disabled="isLocked('themeDarkTextColor')"
                                        />
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel value="2">
                                <!-- 其他设置 -->
                                <div class="form-group">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.border_radius') }}</label>
                                        <i
                                            v-if="isLocked('themeBorderRadius')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <div class="input-with-addon mt-2">
                                        <InputText
                                            v-model="settings.themeBorderRadius"
                                            :placeholder="getCurrentPresetValue('radius')"
                                            :disabled="isLocked('themeBorderRadius')"
                                        />
                                        <span class="addon">rem/px</span>
                                    </div>
                                </div>

                                <Divider />

                                <!-- 品牌标识 -->
                                <div class="form-group">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.logo') }} URL</label>
                                        <i
                                            v-if="isLocked('themeLogoUrl')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <InputText
                                        v-model="settings.themeLogoUrl"
                                        placeholder="/logo.png"
                                        class="mt-2 w-full"
                                        :disabled="isLocked('themeLogoUrl')"
                                    />
                                </div>

                                <div class="form-group mt-3">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.favicon') }} URL</label>
                                        <i
                                            v-if="isLocked('themeFaviconUrl')"
                                            v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                            class="pi pi-lock text-muted-color text-xs"
                                        />
                                    </div>
                                    <InputText
                                        v-model="settings.themeFaviconUrl"
                                        placeholder="/favicon.ico"
                                        class="mt-2 w-full"
                                        :disabled="isLocked('themeFaviconUrl')"
                                    />
                                </div>

                                <Divider />

                                <!-- 特殊模式 -->
                                <div class="form-group">
                                    <div class="align-items-center flex justify-content-between">
                                        <div class="align-items-center flex gap-2">
                                            <label>{{ $t('pages.admin.settings.theme.mourning_mode') }}</label>
                                            <i
                                                v-if="isLocked('themeMourningMode')"
                                                v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                                                class="pi pi-lock text-muted-color text-xs"
                                            />
                                        </div>
                                        <ToggleSwitch v-model="mourningModeRef" :disabled="isLocked('themeMourningMode')" />
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
</template>

<script setup lang="ts">
import {
    useTheme,
    PRESETS,
    type ThemeColorSettingKey,
    type ThemeMode,
    type ThemePresetColorKey,
    type ThemePresetKey,
    type ThemePresetValueKey,
} from '@/composables/use-theme'

const { t } = useI18n()
const { settings, isLocked } = useTheme()
const isDark = useDark()

type ThemeSelectablePresetKey = ThemePresetKey | 'custom'

const colorTypeMap: Record<ThemeColorSettingKey, ThemePresetColorKey> = {
    themePrimaryColor: 'primary',
    themeAccentColor: 'accent',
    themeSurfaceColor: 'surface',
    themeTextColor: 'text',
    themeDarkPrimaryColor: 'primary',
    themeDarkAccentColor: 'accent',
    themeDarkSurfaceColor: 'surface',
    themeDarkTextColor: 'text',
}

function resolvePresetKey(preset: string | null | undefined): ThemePresetKey {
    return preset && preset in PRESETS ? preset as ThemePresetKey : 'default'
}

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

const presetOptions = computed<Array<{ label: string, value: ThemeSelectablePresetKey }>>(() => [
    { label: t('pages.admin.settings.theme.presets.default'), value: 'default' },
    { label: t('pages.admin.settings.theme.presets.green'), value: 'green' },
    { label: t('pages.admin.settings.theme.presets.amber'), value: 'amber' },
    { label: t('pages.admin.settings.theme.presets.geek'), value: 'geek' },
    { label: t('pages.admin.settings.theme.presets.custom'), value: 'custom' },
])

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

// 处理颜色值的双向绑定
const createColorModel = (key: ThemeColorSettingKey) => {
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

// 专门为 ColorPicker 创建的 Model
const createColorPickerModel = (key: ThemeColorSettingKey) => {
    return computed({
        get: () => {
            let val = settings.value?.[key]
            if (!val) {
                const isDarkField = key.toLowerCase().includes('dark')
                val = getCurrentPresetValue(colorTypeMap[key], isDarkField)
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

const primaryColorModel = createColorModel('themePrimaryColor')
const accentColorModel = createColorModel('themeAccentColor')
const surfaceColorModel = createColorModel('themeSurfaceColor')
const textColorModel = createColorModel('themeTextColor')

const darkPrimaryColorModel = createColorModel('themeDarkPrimaryColor')
const darkAccentColorModel = createColorModel('themeDarkAccentColor')
const darkSurfaceColorModel = createColorModel('themeDarkSurfaceColor')
const darkTextColorModel = createColorModel('themeDarkTextColor')

const primaryPickerModel = createColorPickerModel('themePrimaryColor')
const accentPickerModel = createColorPickerModel('themeAccentColor')
const surfacePickerModel = createColorPickerModel('themeSurfaceColor')
const textPickerModel = createColorPickerModel('themeTextColor')

const darkPrimaryPickerModel = createColorPickerModel('themeDarkPrimaryColor')
const darkAccentPickerModel = createColorPickerModel('themeDarkAccentColor')
const darkSurfacePickerModel = createColorPickerModel('themeDarkSurfaceColor')
const darkTextPickerModel = createColorPickerModel('themeDarkTextColor')

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
</script>

<style lang="scss" scoped>
@use "@/styles/admin-form" as *;

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
    @include admin-form-group;
}

.color-input-group {
    @include admin-color-input-group;
}

.input-with-addon {
    @include admin-input-with-addon;
}
</style>
