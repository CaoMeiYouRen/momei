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
                    {{ $t('components.post.copyright.license_pre') }}
                    <strong class="license-name">{{ licenseName }}</strong>
                    {{ $t('components.post.copyright.license_post') }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    authorName: string
    url: string
    license?: string | null
}>()

const { t } = useI18n()

const licenseName = computed(() => {
    return props.license || t('components.post.copyright.default_license')
})
</script>

<style lang="scss" scoped>
.article-copyright {
    margin: 3rem 0;
    padding: 1.5rem;
    border-left: 0.25rem solid var(--p-primary-color);
    background-color: var(--p-surface-50);
    border-radius: 0.5rem;
    font-size: 0.95rem;
    line-height: 1.6;

    &__title {
        font-weight: 700;
        margin-bottom: 1rem;
        color: var(--p-primary-color);
        font-size: 1.1rem;
        border-bottom: 1px solid var(--p-surface-200);
        padding-bottom: 0.5rem;
    }

    &__content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__item {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
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

        &:hover {
            text-decoration: underline;
        }
    }

    :deep(.license-name) {
        color: var(--p-primary-color);
    }
}

:global(.dark) .article-copyright {
    background-color: var(--p-surface-900);
    border-color: var(--p-primary-400);

    &__title {
        border-bottom-color: var(--p-surface-700);
    }
}
</style>
