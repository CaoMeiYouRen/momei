<template>
    <div class="theme-color-field">
        <div class="align-items-center flex gap-2">
            <label>{{ label }}</label>
            <AppTooltip v-if="locked" :content="$t('pages.admin.settings.system.locked_by_env')">
                <Lock
                    :size="12"
                    class="text-muted-color"
                    aria-hidden="true"
                />
            </AppTooltip>
        </div>
        <div class="color-input-group mt-2">
            <CaomeiColorPicker
                v-model="pickerValue"
                format="hex"
                :disabled="locked"
            />
            <CaomeiInput
                v-model="value"
                :placeholder="placeholder"
                :disabled="locked"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Lock } from '@lucide/vue'

defineProps<{
    label: string
    placeholder?: string
    locked?: boolean
}>()

const value = defineModel<string>('value', { default: '' })
const pickerValue = defineModel<string>('pickerValue', { default: '' })
</script>

<style lang="scss" scoped>
@use "@/styles/admin-form" as *;

.color-input-group {
    @include admin-color-input-group;
}
</style>
