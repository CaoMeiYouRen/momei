<template>
    <Dialog
        :visible="visible"
        :header="editingIndex > -1 ? $t(`${i18nPrefix}.edit_${kind}`) : $t(`${i18nPrefix}.add_${kind}`)"
        modal
        class="commercial-link-dialog"
        :dismissable-mask="true"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="commercial-link-dialog__body">
            <div class="commercial-link-dialog__field">
                <label>{{ $t(`${i18nPrefix}.platform`) }}</label>
                <Select
                    v-model="link.platform"
                    :options="platforms"
                    option-label="key"
                    option-value="key"
                    class="w-full"
                >
                    <template #option="slotProps">
                        <div class="commercial-link-dialog__select-option">
                            <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                            <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`${platformI18nPrefix}.${slotProps.option.key}`) }}</span>
                        </div>
                    </template>
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="commercial-link-dialog__select-value">
                            <i :class="platformIcon(slotProps.value)" :style="{color: platformColor(slotProps.value)}" />
                            <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`${platformI18nPrefix}.${slotProps.value}`) }}</span>
                        </div>
                        <span v-else>{{ slotProps.placeholder }}</span>
                    </template>
                </Select>
            </div>

            <div v-if="link.platform === 'custom'" class="commercial-link-dialog__field">
                <label for="dialog-label">{{ $t(`${i18nPrefix}.label`) }}</label>
                <InputText
                    id="dialog-label"
                    v-model="link.label"
                    class="w-full"
                />
            </div>

            <div v-if="platformType !== 'image'" class="commercial-link-dialog__field">
                <label for="dialog-url">{{ $t(`${i18nPrefix}.url`) }}</label>
                <InputText
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
                    <Image
                        :src="link.image"
                        alt="Preview"
                        width="120"
                        preview
                    />
                </div>
            </div>

            <div class="commercial-link-dialog__field">
                <label>{{ $t(`${i18nPrefix}.locales`) }}</label>
                <MultiSelect
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
                <Button
                    :label="$t('common.cancel')"
                    text
                    severity="secondary"
                    @click="$emit('update:visible', false)"
                />
                <Button
                    :label="$t('common.save')"
                    :data-testid="`${kind}-save`"
                    @click="$emit('save')"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
    platforms: { key: string, icon: string, color: string }[]
    kind: 'social' | 'donation'
    i18nPrefix: string
    platformI18nPrefix: string
    platformIcon: (key: string) => string
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
        background-color: var(--p-surface-50);
        padding: $spacing-sm;
        border-radius: $border-radius-sm;
        border: 1px solid var(--p-surface-200);

        .dark & {
            background-color: var(--p-surface-900);
            border-color: var(--p-surface-700);
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
