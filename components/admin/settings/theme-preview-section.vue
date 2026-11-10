<template>
    <div v-if="settings" class="theme-preview-section">
        <CaomeiCard :title="$t('pages.admin.settings.theme.preview')" class="preview-panel">
            <div class="preview-canvas shadow-2">
                <div
                    ref="previewInner"
                    class="preview-inner"
                    :style="{
                        backgroundColor: 'var(--m-surface-0)',
                        color: 'var(--caomei-color-text)',
                        filter: settings.themeMourningMode ? 'grayscale(100%)' : 'none'
                    }"
                >
                    <ArticleCard
                        :post="previewPost"
                    />
                    <div class="preview-actions">
                        <CaomeiButton size="sm" :label="$t('common.preview')">
                            {{ $t('common.preview') }}
                        </CaomeiButton>
                        <CaomeiButton
                            size="sm"
                            :label="$t('pages.admin.settings.theme.accent_action')"
                            :style="{
                                backgroundColor: 'var(--m-accent-color)',
                                borderColor: 'var(--m-accent-color)',
                                color: 'var(--caomei-color-primary-foreground)'
                            }"
                        >
                            <template #icon>
                                <Bolt :size="16" />
                            </template>
                            {{ $t('pages.admin.settings.theme.accent_action') }}
                        </CaomeiButton>
                    </div>
                </div>
            </div>
        </CaomeiCard>

        <CaomeiCard :title="$t('pages.admin.settings.theme.background')" class="mt-4">
            <div class="form-group">
                <div class="align-items-center flex gap-2">
                    <label>{{ $t('pages.admin.settings.theme.background_type') }}</label>
                    <AppTooltip v-if="isLocked('themeBackgroundType')" :content="$t('pages.admin.settings.system.locked_by_env')">
                        <Lock
                            :size="12"
                            class="text-muted-color"
                            aria-hidden="true"
                        />
                    </AppTooltip>
                </div>
                <CaomeiSelectButton
                    v-model="backgroundTypeModel"
                    :options="backgroundOptions"
                    option-label="label"
                    option-value="value"
                    class="mt-2"
                    :disabled="isLocked('themeBackgroundType')"
                />
            </div>

            <div v-if="settings.themeBackgroundType === 'color'" class="form-group mt-3">
                <div class="align-items-center flex gap-2">
                    <label>{{ $t('pages.admin.settings.theme.background_color') }}</label>
                    <AppTooltip v-if="isLocked('themeBackgroundValue')" :content="$t('pages.admin.settings.system.locked_by_env')">
                        <Lock
                            :size="12"
                            class="text-muted-color"
                            aria-hidden="true"
                        />
                    </AppTooltip>
                </div>
                <div class="color-input-group mt-2">
                    <CaomeiColorPicker
                        v-model="backgroundPickerModel"
                        format="hex"
                        :disabled="isLocked('themeBackgroundValue')"
                    />
                    <CaomeiInput
                        v-model="backgroundColorModel"
                        :placeholder="getCurrentPresetValue('surface', isDark)"
                        :disabled="isLocked('themeBackgroundValue')"
                    />
                </div>
            </div>

            <div v-if="settings.themeBackgroundType === 'image'" class="form-group mt-3">
                <div class="align-items-center flex gap-2">
                    <label>{{ $t('pages.admin.settings.theme.background_image') }} URL</label>
                    <AppTooltip v-if="isLocked('themeBackgroundValue')" :content="$t('pages.admin.settings.system.locked_by_env')">
                        <Lock
                            :size="12"
                            class="text-muted-color"
                            aria-hidden="true"
                        />
                    </AppTooltip>
                </div>
                <div class="input-with-icon mt-2">
                    <ImageIcon :size="16" aria-hidden="true" />
                    <CaomeiInput
                        v-model="settings.themeBackgroundValue"
                        placeholder="https://example.com/bg.jpg"
                        :disabled="isLocked('themeBackgroundValue')"
                    />
                </div>
            </div>
        </CaomeiCard>
    </div>
</template>

<script setup lang="ts">
import { Bolt, Image as ImageIcon, Lock } from '@lucide/vue'
import type { ThemeBackgroundType } from '@/composables/use-theme'
import {
    useTheme,
    type ThemePresetColorKey,
    type ThemePresetValueKey,
    type ThemePreviewColorSettingKey,
} from '@/composables/use-theme'
import ArticleCard from '@/components/article-card.vue'
import { PostStatus, PostVisibility, type Post } from '@/types/post'
import { useThemeMode } from '@/composables/use-theme-mode'
import {
    createThemeColorModel,
    createThemeColorPickerModel,
    getPresetValue,
} from '@/composables/use-theme-color-models'

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
    // 固定日期：预览卡日期会进入视觉基线，使用 new Date() 会让基线每天漂移并吃掉像素容差。
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    language: 'zh-CN',
}))

const getCurrentPresetValue = (type: ThemePresetValueKey, forceDark = false) =>
    getPresetValue(settings.value, type, forceDark)

const backgroundOptions = computed<Array<{ label: string, value: 'none' | 'color' | 'image' }>>(() => [
    { label: t('pages.admin.settings.theme.background_none'), value: 'none' },
    { label: t('pages.admin.settings.theme.background_color'), value: 'color' },
    { label: t('pages.admin.settings.theme.background_image'), value: 'image' },
])

// 专门为 ColorPicker 创建的 Model，处理 fallback 到 Preset 默认值，且去掉 # 号
const createColorPickerModel = (key: ThemePreviewColorSettingKey) =>
    createThemeColorPickerModel(settings, key, previewColorTypeMap, (k) => k === 'themeBackgroundValue' && isDark.value)

const createColorModel = (key: ThemePreviewColorSettingKey) => createThemeColorModel(settings, key)

const backgroundTypeModel = computed({
    get: () => settings.value?.themeBackgroundType ?? undefined,
    set: (value: string | number | undefined) => {
        if (settings.value) {
            settings.value.themeBackgroundType = (value as ThemeBackgroundType | undefined) ?? null
        }
    },
})

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
    background-color: var(--m-surface-100);
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
    border-radius: var(--caomei-radius-md);
    transition: all 0.3s ease;
    border: 1px solid var(--caomei-color-border);
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
