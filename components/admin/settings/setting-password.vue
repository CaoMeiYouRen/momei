<template>
    <CaomeiPassword
        v-bind="$attrs"
        :model-value="normalizedValue"
        @update:model-value="(value: string) => emit('update:modelValue', value)"
    />
</template>

<script setup lang="ts">
import type { SettingFormValue } from '@/types/setting'
import { normalizeSettingFormValue } from '@/utils/shared/setting-form-value'

/** 设置表单的密码输入适配层；归一逻辑见 `utils/shared/setting-form-value.ts`。 */
defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue?: SettingFormValue }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const normalizedValue = computed(() => normalizeSettingFormValue(props.modelValue))
</script>
