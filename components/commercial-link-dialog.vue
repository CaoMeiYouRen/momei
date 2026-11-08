<template>
    <CaomeiDialog
        :open="visible"
        :title="editingIndex > -1 ? $t(`${i18nPrefix}.edit_${kind}`) : $t(`${i18nPrefix}.add_${kind}`)"
        modal
        class="commercial-link-dialog"
        :close-on-overlay="true"
        @update:open="$emit('update:visible', $event)"
    >
        <div class="commercial-link-dialog__body">
            <div class="commercial-link-dialog__field">
                <label>{{ $t(`${i18nPrefix}.platform`) }}</label>
                <CaomeiSelect
                    v-model="link.platform"
                    :options="platforms"
                    option-label="key"
                    option-value="key"
                    class="w-full"
                >
                    <template #option="{option}">
                        <div class="commercial-link-dialog__select-option">
                            <component
                                :is="option.icon"
                                :size="18"
                                :style="{color: option.color}"
                            />
                            <span>{{ option.key === 'custom' ? $t('common.custom') : $t(`${platformI18nPrefix}.${option.key}`) }}</span>
                        </div>
                    </template>
                    <template #value="{option}">
                        <div v-if="option" class="commercial-link-dialog__select-value">
                            <component
                                :is="platformIcon(option.key)"
                                :size="18"
                                :style="{color: platformColor(option.key)}"
                            />
                            <span>{{ option.key === 'custom' ? $t('common.custom') : $t(`${platformI18nPrefix}.${option.key}`) }}</span>
                        </div>
                        <!-- 存量数据里的平台键可能不在当前选项集（旧版本改名 / 手改 DB）：
                             caomei 提供 `#value` 后不再渲染内建 placeholder，需自兜底。 -->
                        <span v-else class="commercial-link-dialog__select-value">
                            {{ link.platform || $t(`${i18nPrefix}.platform`) }}
                        </span>
                    </template>
                </CaomeiSelect>
            </div>

            <div v-if="link.platform === 'custom'" class="commercial-link-dialog__field">
                <label for="dialog-label">{{ $t(`${i18nPrefix}.label`) }}</label>
                <CaomeiInput
                    id="dialog-label"
                    v-model="link.label"
                    class="w-full"
                />
            </div>

            <div v-if="platformType !== 'image'" class="commercial-link-dialog__field">
                <label for="dialog-url">{{ $t(`${i18nPrefix}.url`) }}</label>
                <CaomeiInput
                    id="dialog-url"
                    v-model="link.url"
                    class="w-full"
                    placeholder="https://..."
                />
            </div>

            <div v-if="showImage !== false && (platformType === 'image' || platformType === 'both')" class="commercial-link-dialog__field">
                <label for="dialog-image">{{ $t(`${i18nPrefix}.image`) }}</label>
                <AppUploader v-model="link.image" class="w-full" />
                <div v-if="link.image" class="commercial-link-dialog__preview">
                    <CaomeiImage
                        :src="link.image"
                        alt="Preview"
                        preview
                    />
                </div>
            </div>

            <div class="commercial-link-dialog__field">
                <label>{{ $t(`${i18nPrefix}.locales`) }}</label>
                <CaomeiMultiSelect
                    v-model="link.locales"
                    :options="localeOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t(`${i18nPrefix}.locales_hint`)"
                    class="w-full"
                />
            </div>
        </div>
        <template #footer>
            <div class="commercial-link-dialog__footer">
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    :label="$t('common.cancel')"
                    @click="$emit('update:visible', false)"
                >
                    {{ $t('common.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    :label="$t('common.save')"
                    :data-testid="`${kind}-save`"
                    @click="$emit('save')"
                >
                    {{ $t('common.save') }}
                </CaomeiButton>
            </div>
        </template>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import type { LocaleOption } from '@/types/utils'

interface Link {
    platform: string
    url?: string
    image?: string
    label?: string
    locales?: string[]
}

const link = defineModel<Link>('link', { required: true })
const visible = defineModel<boolean>('visible', { required: true })

const props = withDefaults(defineProps<{
    editingIndex?: number
    platforms: { key: string, icon: Component, color: string }[]
    kind: 'social' | 'donation'
    i18nPrefix: string
    platformI18nPrefix: string
    platformIcon: (key: string) => Component
    platformColor: (key: string) => string
    platformType: string
    showImage?: boolean
    localeOptions: { label: string, value: string | null }[]
}>(), {
    editingIndex: -1,
    showImage: true,
})

defineEmits<{ save: [], 'update:visible': [visible: boolean] }>()
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.commercial-link-dialog {
    &__preview {
        margin-top: $spacing-sm;
        display: flex;
        justify-content: center;
        background-color: var(--m-surface-50);
        padding: $spacing-sm;
        border-radius: $border-radius-sm;
        border: 1px solid var(--m-surface-200);

        /* caomei 的 `Image` 不透传 width / height 到内层 img（`$attrs` 只落根元素），
         * 尺寸必须由包装层承载；内层 img 高度默认 100%，需一并改回 auto 以保持原始比例。 */
        :deep(.caomei-image) {
            width: 120px;
            height: auto;
        }

        :deep(.caomei-image__img) {
            height: auto;
        }

        .dark & {
            background-color: var(--m-surface-900);
            border-color: var(--m-surface-700);
        }
    }

    &__field {
        margin-bottom: $spacing-md;

        label {
            display: block;
            margin-bottom: $spacing-xs;
            font-weight: 500;
            font-size: $font-size-sm;
        }
    }

    &__select-option, &__select-value {
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        i {
            font-size: 1.1rem;
        }
    }

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: $spacing-sm;
    }
}
</style>
