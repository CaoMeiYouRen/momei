<template>
    <Dialog
        :visible="modelValue"
        :header="$t('pages.admin.settings.theme.save_as_new')"
        modal
        class="save-theme-dialog"
        :style="{width: '450px'}"
        @update:visible="$emit('update:modelValue', $event)"
    >
        <div class="save-theme-form">
            <div class="save-theme-form__field">
                <label class="save-theme-form__label">{{ $t('common.name') }}</label>
                <InputText
                    v-model="saveForm.name"
                    class="save-theme-form__input"
                    :placeholder="$t('pages.admin.settings.theme.name_placeholder')"
                    autofocus
                />
            </div>
            <div class="save-theme-form__field">
                <label class="save-theme-form__label">{{ $t('common.description') }}</label>
                <Textarea
                    v-model="saveForm.description"
                    rows="3"
                    class="save-theme-form__input"
                    :placeholder="$t('pages.admin.settings.theme.description_placeholder')"
                    auto-resize
                />
            </div>
            <div class="save-theme-form__hint">
                <i class="pi pi-info-circle" />
                <span>{{ $t('pages.admin.settings.theme.save_preset_hint') }}</span>
            </div>
        </div>
        <template #footer>
            <div class="save-theme-form__actions">
                <Button
                    :label="$t('common.cancel')"
                    text
                    severity="secondary"
                    @click="$emit('update:modelValue', false)"
                />
                <Button
                    :label="$t('common.confirm')"
                    :loading="loading"
                    :disabled="!saveForm.name"
                    @click="saveAsNewTheme"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { PRESETS } from '@/composables/use-theme'

const props = defineProps<{
    modelValue: boolean
    settings: any
    previewInner: HTMLElement | null | undefined
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'saved'): void
}>()

const { t } = useI18n()
const toast = useToast()

const loading = ref(false)
const saveForm = ref({
    name: '',
    description: '',
})

const getCurrentPresetValue = (type: 'primary' | 'accent' | 'surface' | 'text' | 'radius', forceDark?: boolean) => {
    if (!props.settings) {
        return ''
    }
    const presetKey = (props.settings.themePreset || 'default') as keyof typeof PRESETS
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

const saveAsNewTheme = async () => {
    if (!saveForm.value.name || !props.settings) {
        return
    }
    loading.value = true
    try {
        // 核心：计算完整“快照”，将预设值与手动覆盖值合并
        const snapshot: any = { ...props.settings }

        const colorFields: Array<[string, 'primary' | 'accent' | 'surface' | 'text']> = [
            ['themePrimaryColor', 'primary'],
            ['themeAccentColor', 'accent'],
            ['themeSurfaceColor', 'surface'],
            ['themeTextColor', 'text'],
        ]

        const darkColorFields: Array<[string, 'primary' | 'accent' | 'surface' | 'text']> = [
            ['themeDarkPrimaryColor', 'primary'],
            ['themeDarkAccentColor', 'accent'],
            ['themeDarkSurfaceColor', 'surface'],
            ['themeDarkTextColor', 'text'],
        ]

        // 处理浅色模式颜色
        for (const [field, type] of colorFields) {
            if (!snapshot[field]) {
                snapshot[field] = getCurrentPresetValue(type, false)
            }
        }

        // 处理深色模式颜色
        for (const [field, type] of darkColorFields) {
            if (!snapshot[field]) {
                snapshot[field] = getCurrentPresetValue(type, true)
            }
        }

        // 处理圆角
        if (!snapshot.themeBorderRadius) {
            snapshot.themeBorderRadius = getCurrentPresetValue('radius')
        }

        // 如果是基于某个预设保存的，保存后将其标记为自定义
        snapshot.themePreset = 'custom'

        // 抓取当前预览区域的快照
        let previewImage = ''
        if (props.previewInner && import.meta.client) {
            try {
                // 动态导入以避免 SSR 错误
                const domtoimage = (await import('dom-to-image-more')).default
                previewImage = await domtoimage.toJpeg(props.previewInner, {
                    quality: 0.8,
                    bgcolor: getComputedStyle(props.previewInner).backgroundColor || '#ffffff',
                })
            } catch (error) {
                console.error('Failed to capture theme preview:', error)
            }
        }

        await $fetch('/api/admin/theme-configs', {
            method: 'POST',
            body: {
                ...saveForm.value,
                configData: JSON.stringify(snapshot),
                previewImage,
            },
        })

        emit('update:modelValue', false)
        emit('saved')

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.theme.save_preset_success'),
            life: 3000,
        })

        // 重置表单
        saveForm.value = { name: '', description: '' }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.data?.message || error.message,
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}

watch(() => props.modelValue, (val) => {
    if (val) {
        saveForm.value = { name: '', description: '' }
    }
})
</script>

<style lang="scss" scoped>
.save-theme-dialog {
    :deep(.p-dialog-content) {
        padding: 0 1.5rem 1.5rem;
    }
}

.save-theme-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-top: 0.5rem;

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--p-text-color);
    }

    &__input {
        width: 100%;
    }

    &__hint {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        background-color: var(--p-surface-50);
        border: 1px solid var(--p-content-border-color);
        border-radius: 8px;
        color: var(--p-text-muted-color);
        font-size: 0.75rem;
        line-height: 1.5;
        align-items: flex-start;

        i {
            margin-top: 0.125rem;
            color: var(--p-primary-color);
        }
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
}
</style>
