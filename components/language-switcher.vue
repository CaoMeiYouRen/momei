<template>
    <CaomeiDropdownMenu>
        <CaomeiDropdownMenuTrigger as-child>
            <AppTooltip :content="$t('components.header.language')" side="bottom">
                <CaomeiButton
                    v-bind="attrs"
                    type="button"
                    variant="ghost"
                    rounded
                    icon-only
                    :label="$t('components.header.language')"
                >
                    <template #icon>
                        <Globe :size="16" />
                    </template>
                </CaomeiButton>
            </AppTooltip>
        </CaomeiDropdownMenuTrigger>
        <CaomeiDropdownMenuContent
            id="language_menu"
            :model="localeMenuItems"
        />
    </CaomeiDropdownMenu>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Globe } from '@lucide/vue'

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
