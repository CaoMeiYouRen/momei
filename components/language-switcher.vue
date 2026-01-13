<template>
    <Button
        v-tooltip.bottom="$t('components.header.language')"
        type="button"
        icon="pi pi-globe"
        text
        rounded
        aria-haspopup="true"
        aria-controls="language_menu"
        @click="toggleMenu"
    />
    <Menu
        id="language_menu"
        ref="menu"
        :model="localeMenuItems"
        :popup="true"
    />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const menu = ref()

const availableLocales = computed(() => {
    return locales.value
})

const localeMenuItems = computed(() => {
    return availableLocales.value.map((l: any) => ({
        label: l.name,
        class: locale.value === l.code ? 'is-active-locale' : '',
        command: () => {
            // const path = switchLocalePath(l.code)
            // if (path) {
            //     navigateTo(path)
            // }
            setLocale(l.code)
        },
    }))
})

const toggleMenu = (event: any) => {
    menu.value.toggle(event)
}
</script>

<style lang="scss">
.is-active-locale {
    .p-menuitem-content {
        background-color: var(--p-surface-100);
        font-weight: 600;
        color: var(--p-primary-color);
    }
}

:global(.dark) .is-active-locale {
    .p-menuitem-content {
        background-color: var(--p-surface-800);
    }
}
</style>
