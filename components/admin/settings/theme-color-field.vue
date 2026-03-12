<template>
    <div class="theme-color-field">
        <div class="align-items-center flex gap-2">
            <label>{{ label }}</label>
            <i
                v-if="locked"
                v-tooltip="$t('pages.admin.settings.system.locked_by_env')"
                class="pi pi-lock text-muted-color text-xs"
            />
        </div>
        <div class="color-input-group mt-2">
            <ColorPicker
                v-model="pickerValue"
                format="hex"
                :disabled="locked"
            />
            <InputText
                v-model="value"
                :placeholder="placeholder"
                :disabled="locked"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
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
