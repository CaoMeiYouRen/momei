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
        <img
            v-if="currentLogoUrl"
            :src="currentLogoUrl"
            :alt="t('common.travellings_title')"
            class="travellings-link__logo"
            @error="handleLogoError"
        >
        <span
            v-else
            class="travellings-link__logo-fallback"
            aria-hidden="true"
        >
            <span class="travellings-link__logo-fallback-glyph">🚇</span>
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

        <span v-if="placement === 'sidebar'" class="travellings-link__cta">
            {{ t('common.travellings_cta') }}
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
const travellingsLogoUrls = [
    'https://www.travellings.cn/assets/logo.svg',
    'https://cdn.jsdelivr.net/gh/travellings-link/travellings/assets/logo.svg',
] as const

const logoUrlIndex = ref(0)

const currentLogoUrl = computed(() => travellingsLogoUrls[logoUrlIndex.value] ?? '')

const handleLogoError = () => {
    if (logoUrlIndex.value < travellingsLogoUrls.length) {
        logoUrlIndex.value += 1
    }
}

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
    gap: 0.625rem;
    text-decoration: none;
    transition:
        transform $transition-fast,
        border-color $transition-fast,
        background-color $transition-fast,
        color $transition-fast;

    &:hover {
        transform: translateY(-1px);
    }

    &__logo {
        display: block;
        width: 1.375rem;
        height: 1.375rem;
        object-fit: contain;
        flex-shrink: 0;
    }

    &__logo-fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.375rem;
        height: 1.375rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
        color: var(--p-primary-color);
        flex-shrink: 0;
    }

    &__logo-fallback-glyph {
        font-size: 0.875rem;
        line-height: 1;
    }

    &__content {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    &__title-row {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
    }

    &__title {
        font-weight: 600;
        white-space: nowrap;
    }

    &__icon {
        font-size: 0.75rem;
        color: var(--p-primary-color);
    }

    &__description {
        margin-top: 0.25rem;
        font-size: 0.8125rem;
        line-height: 1.5;
        color: var(--p-text-muted-color);
    }

    &__cta {
        margin-left: auto;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
        color: var(--p-primary-color);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
    }

    &--header {
        padding: 0.42rem 0.75rem;
        border: 1px solid color-mix(in srgb, var(--p-primary-color) 22%, var(--p-surface-border));
        border-radius: 999px;
        background: color-mix(in srgb, var(--p-primary-color) 7%, var(--p-surface-card));
        color: var(--p-text-color);

        .travellings-link__title {
            font-size: 0.875rem;
        }
    }

    &--footer {
        color: var(--p-text-muted-color);

        .travellings-link__title {
            font-size: 0.875rem;
        }

        &:hover {
            color: var(--p-primary-color);
        }
    }

    &--sidebar {
        width: 100%;
        align-items: flex-start;
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-surface-card) 90%, var(--p-primary-color) 10%);
        color: var(--p-text-color);

        .travellings-link__logo {
            width: 1.75rem;
            height: 1.75rem;
            margin-top: 0.125rem;
        }

        .travellings-link__logo-fallback {
            width: 1.75rem;
            height: 1.75rem;
            margin-top: 0.125rem;
        }

        .travellings-link__title {
            font-size: 0.95rem;
        }
    }

    &--mobile {
        width: 100%;
        padding: 0.75rem;
        border-radius: $border-radius-md;
        color: var(--p-text-color);
        background: color-mix(in srgb, var(--p-primary-color) 7%, transparent);

        .travellings-link__title {
            font-size: 0.95rem;
        }
    }
}
</style>
