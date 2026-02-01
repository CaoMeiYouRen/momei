<template>
    <div class="article-copyright">
        <div class="article-copyright__title">
            {{ $t('components.post.copyright.title') }}
        </div>
        <div class="article-copyright__content">
            <div class="article-copyright__item">
                <span class="article-copyright__label">{{ $t('components.post.copyright.author') }}:</span>
                <span class="article-copyright__value">{{ authorName }}</span>
            </div>
            <div class="article-copyright__item">
                <span class="article-copyright__label">{{ $t('components.post.copyright.link') }}:</span>
                <span class="article-copyright__value">
                    <a
                        :href="url"
                        class="article-copyright__link"
                        target="_blank"
                    >{{ url }}</a>
                </span>
            </div>
            <div class="article-copyright__item">
                <span class="article-copyright__label">{{ $t('components.post.copyright.license_title') }}:</span>
                <span class="article-copyright__value">
                    <template v-if="licenseKey === 'all-rights-reserved'">
                        <strong class="license-name">{{ licenseName }}</strong>
                    </template>
                    <template v-else>
                        {{ $t('components.post.copyright.license_pre') }}
                        <a
                            v-if="licenseUrl"
                            :href="licenseUrl"
                            target="_blank"
                            class="article-copyright__link"
                        >
                            <strong class="license-name">{{ licenseName }}</strong>
                        </a>
                        <strong v-else class="license-name">{{ licenseName }}</strong>
                        {{ $t('components.post.copyright.license_post') }}
                    </template>
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { COPYRIGHT_LICENSES, type CopyrightType } from '@/types/copyright'

const props = defineProps<{
    authorName: string
    url: string
    license?: string | null
}>()

const { t, locale } = useI18n()
const config = useRuntimeConfig()

const licenseKey = computed(() => {
    return (props.license || config.public.defaultCopyright || t('components.post.copyright.default_license')) as CopyrightType
})

const licenseName = computed(() => {
    return t(`components.post.copyright.licenses.${licenseKey.value}`)
})

const licenseUrl = computed(() => {
    const meta = COPYRIGHT_LICENSES[licenseKey.value]
    if (!meta || !meta.url) return null

    // For CC licenses, append language if available
    if (licenseKey.value.startsWith('cc-')) {
        const langMap: Record<string, string> = {
            'zh-CN': 'deed.zh-hans',
            'en-US': 'deed.en',
        }
        const suffix = langMap[locale.value] || ''
        return suffix ? `${meta.url}${suffix}` : meta.url
    }
    return meta.url
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.article-copyright {
    margin: $spacing-xl 0;
    padding: $spacing-lg;
    border-left: 0.25rem solid var(--p-primary-color);
    background-color: var(--p-surface-50);
    border-radius: $border-radius-md;
    font-size: 0.95rem;
    line-height: 1.6;

    &__title {
        font-weight: 700;
        margin-bottom: $spacing-md;
        color: var(--p-primary-color);
        font-size: 1.1rem;
        border-bottom: 1px solid var(--p-surface-200);
        padding-bottom: $spacing-xs;
    }

    &__content {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__item {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;
    }

    &__label {
        font-weight: 600;
        color: var(--p-text-muted-color);
    }

    &__value {
        color: var(--p-text-color);
    }

    &__link {
        color: var(--p-primary-color);
        text-decoration: none;
        word-break: break-all;
        transition: color $transition-fast;

        &:hover {
            text-decoration: underline;
        }
    }

    :deep(.license-name) {
        color: var(--p-primary-color);
    }
}

:global(.dark) .article-copyright {
    border-left-color: var(--p-primary-500);

    &__title {
        border-bottom-color: var(--p-surface-700);
    }
}
</style>
