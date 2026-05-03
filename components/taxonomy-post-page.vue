<template>
    <div class="taxonomy-page">
        <div v-if="entityPending" class="taxonomy-page__header">
            <Skeleton
                width="15rem"
                height="2.5rem"
                class="mb-4"
            />
            <Skeleton width="100%" height="1.5rem" />
        </div>

        <div v-else-if="entityError" class="taxonomy-page__error">
            <Message severity="error" icon="pi pi-times-circle">
                {{ $t('common.not_found') }}
            </Message>
            <Button
                :label="$t('common.back_to_home')"
                icon="pi pi-home"
                class="mt-4"
                @click="navigateTo(localePath('/'))"
            />
        </div>

        <div v-else-if="entity" class="taxonomy-page__content">
            <header class="taxonomy-page__header">
                <div class="taxonomy-page__badge" :class="badgeClass">
                    {{ badgeLabel }}
                </div>
                <h1 class="taxonomy-page__title">
                    <span>{{ entityName }}</span>
                    <a
                        :href="feedHref"
                        target="_blank"
                        class="taxonomy-page__rss"
                        :title="$t('common.rss')"
                        aria-label="RSS Feed"
                    >
                        <RssIcon class="taxonomy-page__rss-icon" />
                    </a>
                </h1>
                <p v-if="entity.description" class="taxonomy-page__description">
                    {{ entity.description }}
                </p>
                <div class="taxonomy-page__meta">
                    <i class="pi pi-file-edit" />
                    <span>{{ $t('pages.posts.total_count', {count: total}) }}</span>
                </div>
            </header>

            <div v-if="postsPending" class="taxonomy-page__list">
                <Skeleton
                    v-for="i in 3"
                    :key="i"
                    height="12rem"
                    class="taxonomy-page__skeleton"
                />
            </div>

            <div v-else-if="postsError || posts.length === 0" class="taxonomy-page__empty">
                <div class="empty-state">
                    <i class="pi pi-inbox" />
                    <p>{{ $t('pages.posts.empty') }}</p>
                </div>
            </div>

            <div v-else class="taxonomy-page__list">
                <ArticleCard
                    v-for="(post, index) in posts"
                    :key="post.id"
                    :post="post"
                    layout="horizontal"
                    :priority="index < 2"
                />
            </div>

            <div v-if="totalPages > 1" class="taxonomy-page__pagination">
                <Paginator
                    v-model:first="first"
                    :rows="limit"
                    :total-records="total"
                    @page="onPageChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '@/types/api'
import type { Category } from '@/types/category'
import type { Tag } from '@/types/tag'
import { resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'
import { buildAbsoluteUrl, buildBreadcrumbListStructuredData } from '@/utils/shared/seo'

const props = defineProps<{
    taxonomyType: 'category' | 'tag'
}>()

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const runtimeConfig = useRuntimeConfig()

const slug = computed(() => route.params.slug as string)
const isCategory = computed(() => props.taxonomyType === 'category')

// Entity fetch
type Entity = Category | Tag
const fetchUrl = computed(() => `/api/${props.taxonomyType}s/slug/${slug.value}`)
const { data: entityData, pending: entityPending, error: entityError } = await useAppFetch<ApiResponse<Entity>>(() => fetchUrl.value)
const entity = computed(() => entityData.value?.data as (Category & { description?: string | null }) | null)

// Posts
const { page, limit, first, posts, total, totalPages, postsPending, postsError, onPageChange } = await useTaxonomyPostPage({
    filterKey: props.taxonomyType,
    slug,
    entityData: entity,
})

// Display
const badgeLabel = computed(() => isCategory.value ? t('common.category') : t('common.tag'))
const badgeClass = computed(() => isCategory.value ? '' : 'taxonomy-page__badge--tag')
const entityName = computed(() => {
    if (!entity.value) {
        return ''
    }
    return isCategory.value ? entity.value.name : `#${entity.value.name}`
})

// SEO
const siteUrl = computed(() => runtimeConfig.public.siteUrl || 'https://momei.app')
const entityLanguage = computed(() => entity.value?.language ? resolveAppLocaleCode(entity.value.language) : null)
const entitySlug = computed(() => entity.value?.slug || slug.value)

function buildLocalizedPath(targetPath: string, language: AppLocaleCode | null) {
    return language ? localePath({ path: targetPath }, language) : localePath(targetPath)
}

const homePath = computed(() => buildLocalizedPath('/', entityLanguage.value))
const indexPath = computed(() => buildLocalizedPath(`/${props.taxonomyType}s`, entityLanguage.value))
const canonicalPath = computed(() => buildLocalizedPath(`/${props.taxonomyType}s/${entitySlug.value}`, entityLanguage.value))
const canonicalUrl = computed(() => buildAbsoluteUrl(siteUrl.value, canonicalPath.value))
const feedHref = computed(() => {
    const searchParams = new URLSearchParams()
    if (entityLanguage.value) {
        searchParams.set('language', entityLanguage.value)
    }
    const query = searchParams.toString()
    return `/feed/${props.taxonomyType}/${entitySlug.value}.xml${query ? `?${query}` : ''}`
})

const structuredData = computed(() => {
    if (!entity.value) {
        return []
    }
    return [
        buildBreadcrumbListStructuredData({
            items: [
                { name: t('common.home'), item: buildAbsoluteUrl(siteUrl.value, homePath.value) },
                { name: badgeLabel.value, item: buildAbsoluteUrl(siteUrl.value, indexPath.value) },
                { name: entity.value.name, item: canonicalUrl.value },
            ],
        }),
    ]
})

usePageSeo({
    type: 'collection',
    title: () => entity.value?.name
        ? `${isCategory.value ? '' : '#'}${entity.value.name} - ${badgeLabel.value}`
        : t('pages.posts.title'),
    locale: () => entityLanguage.value,
    description: () => (entity.value as Category)?.description || t('app.description'),
    path: () => canonicalPath.value,
    structuredData: () => structuredData.value,
})

useHead(() => ({
    link: entity.value
        ? [
                { rel: 'canonical', href: canonicalUrl.value },
                { rel: 'alternate', type: 'application/rss+xml', title: `${entity.value.name} RSS`, href: feedHref.value },
            ]
        : [],
}))
</script>

<style lang="scss" scoped>
.taxonomy-page {
    max-width: 56rem;
    margin: 0 auto;
    padding: 3rem 1rem;

    &__header {
        margin-bottom: 3rem;
        text-align: center;
    }

    &__badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: var(--p-primary-color);
        color: var(--p-primary-contrast-color, #fff);
        border-radius: 2rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 1rem;

        &--tag {
            background-color: var(--p-info-color, #2196f3);
            color: #fff;
        }
    }

    &__title {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--p-text-color);
        margin-bottom: 1rem;
        line-height: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    }

    &__rss {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #f26522;
        font-size: 1.5rem;
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
        flex-shrink: 0;

        &:hover {
            transform: scale(1.1);
            background-color: rgba(#f26522, 0.1);
            color: #ff7f41;
        }

        &-icon {
            font-size: 1.25rem;
        }
    }

    &__description {
        font-size: 1.125rem;
        color: var(--p-text-muted-color);
        max-width: 36rem;
        margin: 0 auto 1.5rem;
    }

    &__meta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    &__skeleton {
        border-radius: 1rem;
    }

    &__empty {
        padding: 4rem 0;
        text-align: center;

        .empty-state {
            i {
                font-size: 3rem;
                color: var(--p-surface-400);
                margin-bottom: 1rem;
            }

            p {
                color: var(--p-text-muted-color);
            }
        }
    }

    &__pagination {
        margin-top: 3rem;
        display: flex;
        justify-content: center;
    }

    &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 5rem 0;
    }
}
</style>
