<template>
    <div v-if="settings" class="theme-config-section">
        <CaomeiCard :title="$t('common.settings')">
            <div class="config-form">
                <!-- 预设选择 -->
                <div class="form-group">
                    <div class="align-items-center flex gap-2">
                        <label>{{ $t('pages.admin.settings.theme.preset') }}</label>
                        <AppTooltip v-if="isLocked('themePreset')" :content="$t('pages.admin.settings.system.locked_by_env')">
                            <Lock
                                :size="12"
                                class="text-muted-color"
                                aria-hidden="true"
                            />
                        </AppTooltip>
                    </div>
                    <CaomeiSelect
                        v-model="settings.themePreset"
                        :options="presetOptions"
                        option-label="label"
                        option-value="value"
                        class="mt-2 w-full"
                        :disabled="isLocked('themePreset')"
                        @update:model-value="onPresetChange"
                    />
                    <p v-if="settings.themePreset === 'custom'" class="hint-text mt-2">
                        {{ $t('pages.admin.settings.theme.custom_hint') }}
                    </p>
                    <p class="hint-text mt-1">
                        {{ $t('pages.admin.settings.theme.color_reset_hint') }}
                    </p>
                </div>

                <ClientOnly>
                    <CaomeiTabs
                        default-value="0"
                        :unmount-on-hide="false"
                        class="mt-4"
                    >
                        <CaomeiTabList>
                            <CaomeiTabTrigger value="0">
                                {{ $t('pages.admin.settings.theme.color_group_light') }}
                            </CaomeiTabTrigger>
                            <CaomeiTabTrigger value="1">
                                {{ $t('pages.admin.settings.theme.color_group_dark') }}
                            </CaomeiTabTrigger>
                            <CaomeiTabTrigger value="2">
                                {{ $t('common.settings') }}
                            </CaomeiTabTrigger>
                        </CaomeiTabList>
                        <CaomeiTabContent value="0">
                            <div
                                v-for="field in lightColorFields"
                                :key="field.key"
                                class="form-group mt-3"
                            >
                                <AdminSettingsThemeColorField
                                    v-model:value="field.textModel.value"
                                    v-model:picker-value="field.pickerModel.value"
                                    :label="$t(field.labelKey)"
                                    :placeholder="getCurrentPresetValue(field.presetKey, false)"
                                    :locked="isLocked(field.key)"
                                />
                            </div>
                        </CaomeiTabContent>

                        <CaomeiTabContent value="1">
                            <div
                                v-for="field in darkColorFields"
                                :key="field.key"
                                class="form-group mt-3"
                            >
                                <AdminSettingsThemeColorField
                                    v-model:value="field.textModel.value"
                                    v-model:picker-value="field.pickerModel.value"
                                    :label="$t(field.labelKey)"
                                    :placeholder="getCurrentPresetValue(field.presetKey, true)"
                                    :locked="isLocked(field.key)"
                                />
                            </div>
                        </CaomeiTabContent>

                        <CaomeiTabContent value="2">
                            <!-- 其他设置 -->
                            <div class="form-group">
                                <div class="align-items-center flex gap-2">
                                    <label>{{ $t('pages.admin.settings.theme.border_radius') }}</label>
                                    <AppTooltip v-if="isLocked('themeBorderRadius')" :content="$t('pages.admin.settings.system.locked_by_env')">
                                        <Lock
                                            :size="12"
                                            class="text-muted-color"
                                            aria-hidden="true"
                                        />
                                    </AppTooltip>
                                </div>
                                <div class="input-with-addon mt-2">
                                    <SettingInput
                                        v-model="settings.themeBorderRadius"
                                        :placeholder="getCurrentPresetValue('radius')"
                                        :disabled="isLocked('themeBorderRadius')"
                                    />
                                    <span class="addon">rem/px</span>
                                </div>
                            </div>

                            <CaomeiDivider />

                            <!-- 品牌标识 -->
                            <div class="form-group">
                                <div class="align-items-center flex gap-2">
                                    <label>{{ $t('pages.admin.settings.theme.logo') }} URL</label>
                                    <AppTooltip v-if="isLocked('themeLogoUrl')" :content="$t('pages.admin.settings.system.locked_by_env')">
                                        <Lock
                                            :size="12"
                                            class="text-muted-color"
                                            aria-hidden="true"
                                        />
                                    </AppTooltip>
                                </div>
                                <SettingInput
                                    v-model="settings.themeLogoUrl"
                                    placeholder="/logo.png"
                                    class="mt-2 w-full"
                                    :disabled="isLocked('themeLogoUrl')"
                                />
                            </div>

                            <div class="form-group mt-3">
                                <div class="align-items-center flex gap-2">
                                    <label>{{ $t('pages.admin.settings.theme.favicon') }} URL</label>
                                    <AppTooltip v-if="isLocked('themeFaviconUrl')" :content="$t('pages.admin.settings.system.locked_by_env')">
                                        <Lock
                                            :size="12"
                                            class="text-muted-color"
                                            aria-hidden="true"
                                        />
                                    </AppTooltip>
                                </div>
                                <SettingInput
                                    v-model="settings.themeFaviconUrl"
                                    placeholder="/favicon.ico"
                                    class="mt-2 w-full"
                                    :disabled="isLocked('themeFaviconUrl')"
                                />
                            </div>

                            <CaomeiDivider />

                            <!-- 特殊模式 -->
                            <div class="form-group">
                                <div class="align-items-center flex justify-content-between">
                                    <div class="align-items-center flex gap-2">
                                        <label>{{ $t('pages.admin.settings.theme.mourning_mode') }}</label>
                                        <AppTooltip v-if="isLocked('themeMourningMode')" :content="$t('pages.admin.settings.system.locked_by_env')">
                                            <Lock
                                                :size="12"
                                                class="text-muted-color"
                                                aria-hidden="true"
                                            />
                                        </AppTooltip>
                                    </div>
                                    <CaomeiSwitch v-model="mourningModeRef" :disabled="isLocked('themeMourningMode')" />
                                </div>
                                <p class="hint-text mt-1">
                                    {{ $t('pages.admin.settings.theme.mourning_mode_hint') }}
                                </p>
                            </div>
                        </CaomeiTabContent>
                    </CaomeiTabs>
                </ClientOnly>
            </div>
        </CaomeiCard>
    </div>
</template>

<script setup lang="ts">
import type { WritableComputedRef } from 'vue'
import { Lock } from '@lucide/vue'
import SettingInput from '@/components/admin/settings/setting-input.vue'
import {
    useTheme,
    type ThemeColorSettingKey,
    type ThemePresetColorKey,
    type ThemePresetKey,
    type ThemePresetValueKey,
} from '@/composables/use-theme'
import { useThemeMode } from '@/composables/use-theme-mode'
import {
    createThemeColorModel,
    createThemeColorPickerModel,
    getPresetValue,
} from '@/composables/use-theme-color-models'

const { t } = useI18n()
const { settings, isLocked } = useTheme()
const isDark = useThemeMode()

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

const getCurrentPresetValue = (type: ThemePresetValueKey, forceDark = false) =>
    getPresetValue(settings.value, type, forceDark)

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
const createColorModel = (key: ThemeColorSettingKey) => createThemeColorModel(settings, key)

// 专门为 ColorPicker 创建的 Model
const createColorPickerModel = (key: ThemeColorSettingKey) =>
    createThemeColorPickerModel(settings, key, colorTypeMap)

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

interface ThemeColorFieldDescriptor {
    key: ThemeColorSettingKey
    labelKey: string
    presetKey: ThemePresetColorKey
    textModel: WritableComputedRef<string>
    pickerModel: WritableComputedRef<string>
}

const lightColorFields: ThemeColorFieldDescriptor[] = [
    {
        key: 'themePrimaryColor',
        labelKey: 'pages.admin.settings.theme.primary_color',
        presetKey: 'primary',
        textModel: primaryColorModel,
        pickerModel: primaryPickerModel,
    },
    {
        key: 'themeAccentColor',
        labelKey: 'pages.admin.settings.theme.accent_color',
        presetKey: 'accent',
        textModel: accentColorModel,
        pickerModel: accentPickerModel,
    },
    {
        key: 'themeSurfaceColor',
        labelKey: 'pages.admin.settings.theme.surface_color',
        presetKey: 'surface',
        textModel: surfaceColorModel,
        pickerModel: surfacePickerModel,
    },
    {
        key: 'themeTextColor',
        labelKey: 'pages.admin.settings.theme.text_color',
        presetKey: 'text',
        textModel: textColorModel,
        pickerModel: textPickerModel,
    },
]

const darkColorFields: ThemeColorFieldDescriptor[] = [
    {
        key: 'themeDarkPrimaryColor',
        labelKey: 'pages.admin.settings.theme.dark_primary_color',
        presetKey: 'primary',
        textModel: darkPrimaryColorModel,
        pickerModel: darkPrimaryPickerModel,
    },
    {
        key: 'themeDarkAccentColor',
        labelKey: 'pages.admin.settings.theme.dark_accent_color',
        presetKey: 'accent',
        textModel: darkAccentColorModel,
        pickerModel: darkAccentPickerModel,
    },
    {
        key: 'themeDarkSurfaceColor',
        labelKey: 'pages.admin.settings.theme.dark_surface_color',
        presetKey: 'surface',
        textModel: darkSurfaceColorModel,
        pickerModel: darkSurfacePickerModel,
    },
    {
        key: 'themeDarkTextColor',
        labelKey: 'pages.admin.settings.theme.dark_text_color',
        presetKey: 'text',
        textModel: darkTextColorModel,
        pickerModel: darkTextPickerModel,
    },
]

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
    height: fit-content;

    /* 外层不再自行绘制边框 / 底色：`CaomeiCard` 已提供唯一一层外壳。 */
    :deep(.caomei-tabs) {
        width: 100%;
        margin-top: 1rem;
    }

    :deep(.caomei-tabs__list) {
        background: transparent;
        border-color: var(--caomei-color-border);
        display: flex;
    }

    :deep(.caomei-tabs__trigger) {
        flex: 1;
        padding: 0.75rem 0.25rem;
        font-size: 0.8125rem;
        white-space: nowrap;
        justify-content: center;
        color: var(--caomei-color-text-muted);
        border-bottom: 2px solid transparent;
        transition: all 0.2s;

        &[data-state='active'] {
            color: var(--caomei-color-primary);
            border-bottom-color: var(--caomei-color-primary);
        }

        &:hover:not([data-state='active']) {
            color: var(--caomei-color-text);
            background: var(--m-surface-50);
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
