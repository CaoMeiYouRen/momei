<template>
    <div class="content-language-switcher">
        <Select
            v-model="contentLanguage"
            :options="availableLocales"
            option-label="label"
            option-value="value"
            class="language-select"
            size="small"
        >
            <template #value="slotProps">
                <div v-if="slotProps.value" class="align-items-center flex">
                    <span :class="'mr-2 flag-' + slotProps.value.toLowerCase()" />
                    <div>{{ getLabel(slotProps.value) }}</div>
                </div>
                <span v-else>
                    {{ $t('common.all_languages') }}
                </span>
            </template>
            <template #option="slotProps">
                <div class="align-items-center flex">
                    <span v-if="slotProps.option.value" :class="'mr-2 flag-' + slotProps.option.value.toLowerCase()" />
                    <div>{{ slotProps.option.label }}</div>
                </div>
            </template>
        </Select>
    </div>
</template>

<script setup lang="ts">
import { useAdminI18n } from '@/composables/use-admin-i18n'

const { contentLanguage, availableLocales } = useAdminI18n()

const getLabel = (value: string | null) => {
    if (!value) return ''
    const opt = availableLocales.value.find((o) => o.value === value)
    return opt ? opt.label : value
}
</script>

<style lang="scss" scoped>
.content-language-switcher {
  display: inline-block;
  min-width: 150px;
}

.language-select {
  width: 100%;
}
</style>
