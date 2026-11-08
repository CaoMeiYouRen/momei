<template>
    <div class="taxonomy-page">
        <div v-if="entityPending" class="taxonomy-page__header">
            <CaomeiSkeleton
                width="15rem"
                height="2.5rem"
                class="mb-4"
            />
            <CaomeiSkeleton width="100%" height="1.5rem" />
        </div>

        <div v-else-if="entityError" class="taxonomy-page__error">
            <CaomeiMessage tone="danger">
                <template #icon>
                    <CircleX :size="16" />
                </template>
                {{ $t('common.not_found') }}
            </CaomeiMessage>
            <CaomeiButton
                class="mt-4"
                @click="navigateTo(localePath('/'))"
            >
                <template #icon>
                    <Home :size="16" />
                </template>
                {{ $t('common.back_to_home') }}
            </CaomeiButton>
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
                        :aria-label="$t('common.rss')"
                    >
                        <RssIcon class="taxonomy-page__rss-icon" />
                    </a>
                </h1>
                <p v-if="entity.description" class="taxonomy-page__description">
                    {{ entity.description }}
                </p>
                <div class="taxonomy-page__meta">
                    <FilePenLine :size="14" />
                    <span>{{ $t('pages.posts.total_count', {count: total}) }}</span>
                </div>
            </header>

            <div v-if="postsPending" class="taxonomy-page__list">
                <CaomeiSkeleton
                    v-for="i in 3"
                    :key="i"
                    height="12rem"
                    class="taxonomy-page__skeleton"
                />
            </div>

            <div v-else-if="postsError || posts.length === 0" class="taxonomy-page__empty">
                <div class="empty-state">
                    <Inbox :size="40" />
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
                <CaomeiPaginator
                    :page="page"
                    :items-per-page="limit"
                    :total="total"
                    show-edges
                    @update:page="onPageChange"
                />
            </div>
        </div>

        <div v-else class="taxonomy-page__error">
            <CaomeiMessage tone="danger">
                <template #icon>
                    <CircleX :size="16" />
                </template>
                {{ $t('common.not_found') }}
            </CaomeiMessage>
            <CaomeiButton
                class="mt-4"
                @click="navigateTo(localePath('/'))"
            >
                <template #icon>
                    <Home :size="16" />
                </template>
                {{ $t('common.back_to_home') }}
            </CaomeiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CircleX, FilePenLine, Home, Inbox } from '@lucide/vue'
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

type Entity = Category | Tag

// Entity fetch
const fetchUrl = computed(() => `/api/${props.taxonomyType === 'category' ? 'categories' : 'tags'}/slug/${slug.value}`)
const { data: entityData, pending: entityPending, error: entityError } = await useAppFetch<ApiResponse<Entity>>(() => fetchUrl.value)
const entity = computed(() => entityData.value?.data as (Category & { description?: string | null }) | null)

// Posts
const { page, limit, posts, total, totalPages, postsPending, postsError, onPageChange } = await useTaxonomyPostPage({
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

function resolveTaxonomyCollectionPath(taxonomyType: 'category' | 'tag') {
    return taxonomyType === 'category' ? '/categories' : '/tags'
}

const homePath = computed(() => buildLocalizedPath('/', entityLanguage.value))
const collectionPath = computed(() => resolveTaxonomyCollectionPath(props.taxonomyType))
const indexPath = computed(() => buildLocalizedPath(collectionPath.value, entityLanguage.value))
const canonicalPath = computed(() => buildLocalizedPath(`${collectionPath.value}/${entitySlug.value}`, entityLanguage.value))
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
        background-color: var(--caomei-color-primary);
        color: var(--caomei-color-primary-foreground, #fff);
        border-radius: 2rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 1rem;

        &--tag {
            background-color: var(--m-info-500, #2196f3);
            color: #fff;
        }
    }

    &__title {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--caomei-color-text);
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
        color: var(--caomei-color-text-muted);
        max-width: 36rem;
        margin: 0 auto 1.5rem;
    }

    &__meta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: var(--caomei-color-text-muted);
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
            svg {
                color: var(--m-surface-400);
                margin-bottom: 1rem;
            }

            p {
                color: var(--caomei-color-text-muted);
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
