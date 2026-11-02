<template>
    <CaomeiDropdownMenu>
        <CaomeiDropdownMenuTrigger as-child>
            <Button
                v-tooltip.bottom="$t('components.header.language')"
                v-bind="attrs"
                type="button"
                icon="pi pi-globe"
                text
                rounded
                :aria-label="$t('components.header.language')"
            />
        </CaomeiDropdownMenuTrigger>
        <CaomeiDropdownMenuContent
            id="language_menu"
            :model="localeMenuItems"
        />
    </CaomeiDropdownMenu>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
    inheritAttrs: false,
})

const { locale, locales, setLocale } = useI18n()
const attrs = useAttrs()

const availableLocales = computed(() => {
    return locales.value
})

const localeMenuItems = computed(() => {
    return availableLocales.value.map((l) => ({
        label: l.name,
        class: locale.value === l.code ? 'is-active-locale' : '',
        command: () => {
            setLocale(l.code)
        },
    }))
})
</script>

<style lang="scss">
.caomei-dropdown-menu__item.is-active-locale {
    background-color: var(--p-surface-100);
    font-weight: 600;
    color: var(--p-primary-color);
}

.dark .caomei-dropdown-menu__item.is-active-locale {
    background-color: var(--p-surface-800);
}
</style>
