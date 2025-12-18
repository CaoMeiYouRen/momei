<template>
    <Select
        v-model="currentLocale"
        :options="availableLocales"
        option-label="name"
        option-value="code"
        class="language-switcher"
        :aria-label="$t('components.header.language')"
        @change="onLocaleChanged"
    >
        <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center">
                <span>{{ getLocaleName(slotProps.value) }}</span>
            </div>
            <span v-else>
                {{ slotProps.placeholder }}
            </span>
        </template>
        <template #option="slotProps">
            <div class="flex items-center">
                <span>{{ slotProps.option.name }}</span>
            </div>
        </template>
    </Select>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const currentLocale = computed({
    get: () => locale.value,
    set: (value) => {
        setLocale(value)
    },
})

const availableLocales = computed(() => {
    return locales.value
})

const getLocaleName = (code: string) => {
    const found = locales.value.find((l: any) => l.code === code)
    return found ? found.name : code
}

const onLocaleChanged = (event: any) => {
    setLocale(event.value)
}
</script>

<style lang="scss" scoped>
.language-switcher {
    width: 140px;
}
</style>
