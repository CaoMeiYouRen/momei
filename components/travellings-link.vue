<template>
    <a
        v-if="isVisible"
        :href="travellingsUrl"
        target="_blank"
        rel="noopener noreferrer external"
        class="travellings-link"
        :class="`travellings-link--${placement}`"
        :title="t('common.travellings_title')"
        :aria-label="t('common.travellings_title')"
    >

        <span
            v-if="placement === 'mobile'"
            class="travellings-link__leading-icon"
            aria-hidden="true"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                :style="{fill: 'var(--p-text-muted-color)'}"
            >
                <!-- !Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. -->
                <path d="M128 160C128 107 171 64 224 64L416 64C469 64 512 107 512 160L512 416C512 456.1 487.4 490.5 452.5 504.8L506.4 568.5C515 578.6 513.7 593.8 503.6 602.3C493.5 610.8 478.3 609.6 469.8 599.5L395.8 512L244.5 512L170.5 599.5C161.9 609.6 146.8 610.9 136.7 602.3C126.6 593.7 125.3 578.6 133.9 568.5L187.8 504.8C152.6 490.5 128 456.1 128 416L128 160zM192 192L192 288C192 305.7 206.3 320 224 320L296 320L296 160L224 160C206.3 160 192 174.3 192 192zM344 320L416 320C433.7 320 448 305.7 448 288L448 192C448 174.3 433.7 160 416 160L344 160L344 320zM224 448C241.7 448 256 433.7 256 416C256 398.3 241.7 384 224 384C206.3 384 192 398.3 192 416C192 433.7 206.3 448 224 448zM448 416C448 398.3 433.7 384 416 384C398.3 384 384 398.3 384 416C384 433.7 398.3 448 416 448C433.7 448 448 433.7 448 416z" />
            </svg>
        </span>

        <span class="travellings-link__content">
            <span class="travellings-link__title-row">
                <span class="travellings-link__title">{{ t('common.travellings') }}</span>
                <i class="pi pi-external-link travellings-link__icon" aria-hidden="true" />
            </span>
            <span v-if="placement === 'sidebar'" class="travellings-link__description">
                {{ t('common.travellings_description') }}
            </span>
        </span>
    </a>
</template>

<script setup lang="ts">
type TravellingsPlacement = 'header' | 'footer' | 'sidebar' | 'mobile'

const props = defineProps<{
    placement: TravellingsPlacement
}>()

const { t } = useI18n()
const { siteConfig } = useMomeiConfig()

const travellingsUrl = 'https://www.travellings.cn/go.html'

const placementEnabledMap: Record<TravellingsPlacement, keyof typeof siteConfig.value> = {
    header: 'travellingsHeaderEnabled',
    footer: 'travellingsFooterEnabled',
    sidebar: 'travellingsSidebarEnabled',
    mobile: 'travellingsHeaderEnabled',
}

const isVisible = computed(() => {
    if (!siteConfig.value.travellingsEnabled) {
        return false
    }

    return Boolean(siteConfig.value[placementEnabledMap[props.placement]])
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.travellings-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: inherit;
    line-height: inherit;
    text-decoration: none;
    transition: color $transition-fast;

    &__content {
        display: inline-flex;
        align-items: center;
        min-width: 0;
    }

    &__title-row {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__title {
        font-size: inherit;
        font-weight: inherit;
        line-height: inherit;
        white-space: nowrap;
    }

    &__icon {
        font-size: 0.7rem;
        color: currentcolor;
        opacity: 0.8;
    }

    &__leading-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.1rem;
        font-size: 1rem;
        color: var(--p-text-muted-color);
        line-height: 1;
        flex-shrink: 0;
    }

    &__description {
        margin-top: 0.35rem;
        font-size: 0.8125rem;
        line-height: 1.5;
        color: var(--p-text-muted-color);
    }

    &--header {
        color: inherit;
    }

    &--footer {
        color: inherit;
    }

    &--sidebar {
        width: 100%;
        align-items: flex-start;
        padding: 0;
        color: var(--p-text-color);

        .travellings-link__content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .travellings-link__title {
            font-size: 0.95rem;
            font-weight: 600;
        }
    }

    &--mobile {
        width: 100%;
        color: var(--p-text-color);
        padding: 0.75rem;
        border-radius: $border-radius-md;
        background: transparent;

        &:hover {
            background-color: var(--p-surface-hover);
        }

        .travellings-link__content {
            display: inline-flex;
            align-items: center;
        }

        .travellings-link__leading-icon {
            color: var(--p-text-muted-color);
        }

        .travellings-link__title {
            font-size: 0.95rem;
        }
    }
}
</style>
