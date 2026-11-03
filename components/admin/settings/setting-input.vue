<template>
    <CaomeiInput
        v-bind="$attrs"
        :model-value="normalizedValue"
        @update:model-value="(value: string) => emit('update:modelValue', value)"
    />
</template>

<script setup lang="ts">
import type { SettingFormValue } from '@/types/setting'

/**
 * 设置表单的文本输入适配层。
 *
 * 为什么需要：`CaomeiInput` 的 `modelValue` 只接受 `string | undefined`，而设置项的通用类型
 * `SettingFormValue` 允许 `null`（DB 中未设置为 null）。迁移前 PrimeVue 接受 null；
 * 这里统一把 null 归一为空串、回写 string，避免在每个字段上重复写 `?? ''` 与回写逻辑。
 *
 * 其余属性（`id` / `disabled` / `placeholder` / `invalid` / `type` 等）通过 `$attrs` 透传。
 */
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
