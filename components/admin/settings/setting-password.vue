<template>
    <CaomeiPassword
        v-bind="$attrs"
        :model-value="normalizedValue"
        @update:model-value="(value: string) => emit('update:modelValue', value)"
    />
</template>

<script setup lang="ts">
import type { SettingFormValue } from '@/types/setting'

/** 设置表单的密码输入适配层；同 `setting-input.vue`，负责 `null → ''` 归一。 */
defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue?: SettingFormValue }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const normalizedValue = computed(() => {
    const value = props.modelValue

    if (value === null || value === undefined) {
        return ''
    }

    return typeof value === 'string' ? value : String(value)
})
</script>
