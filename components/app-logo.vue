<template>
    <NuxtLink :to="localePath('/')" class="app-logo">
        <img
            v-if="siteLogo"
            :src="siteLogo"
            alt="Logo"
            class="app-logo__img"
            :width="size"
            :height="size"
        >
        <img
            v-else
            src="/logo.png"
            alt="Momei Logo"
            class="app-logo__img"
            :width="size"
            :height="size"
        >
        <span v-if="showTitle" class="app-logo__title">
            {{ currentTitle }}
        </span>
    </NuxtLink>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    size?: number | string
    showTitle?: boolean
}>(), {
    size: 32,
    showTitle: true,
})

const localePath = useLocalePath()
const { siteLogo, currentTitle } = useMomeiConfig()
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.app-logo {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    text-decoration: none;
    color: var(--p-text-color);
    transition: opacity $transition-fast;

    &:hover {
        opacity: 0.8;
    }

    &__img {
        // height: auto;
        object-fit: contain;
    }

    &__title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-primary-color);
    }
}
</style>
