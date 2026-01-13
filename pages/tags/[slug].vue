<template>
    <div class="taxonomy-page">
        <div v-if="tagPending" class="taxonomy-page__header">
            <Skeleton
                width="15rem"
                height="2.5rem"
                class="mb-4"
            />
        </div>

        <div v-else-if="tagError" class="taxonomy-page__error">
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

        <div v-else-if="tag" class="taxonomy-page__content">
            <header class="taxonomy-page__header">
                <div class="taxonomy-page__badge taxonomy-page__badge--tag">
                    {{ $t('common.tag') }}
                </div>
                <h1 class="taxonomy-page__title">
                    #{{ tag.name }}
                </h1>
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
                    v-for="post in posts"
                    :key="post.id"
                    :post="post"
                    layout="horizontal"
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
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const setI18nParams = useSetI18nParams()
const localePath = useLocalePath()

const slug = computed(() => route.params.slug as string)
const page = ref(Number(route.query.page) || 1)
const limit = ref(10)
const first = ref((page.value - 1) * limit.value)

// 1. Fetch Tag Info
const { data: tagData, pending: tagPending, error: tagError } = await useAppFetch<any>(() => `/api/tags/slug/${slug.value}`)
const tag = computed(() => tagData.value?.data)

// Handle dynamic route translations for i18n language switcher
watch(tag, (newTag) => {
    if (newTag?.translations) {
        const params: Record<string, any> = {}
        newTag.translations.forEach((tr: any) => {
            params[tr.language] = { slug: tr.slug }
        })
        setI18nParams(params)
    }
}, { immediate: true })

// 2. Fetch Posts with this tag
const { data: postsData, pending: postsPending, error: postsError } = await useAppFetch<any>('/api/posts', {
    query: {
        page,
        limit,
        tag: slug,
        status: 'published',
    },
    watch: [page, slug],
})

const posts = computed(() => postsData.value?.data?.items || [])
const total = computed(() => postsData.value?.data?.total || 0)
const totalPages = computed(() => postsData.value?.data?.totalPages || 0)

const onPageChange = (event: any) => {
    page.value = event.page + 1
    first.value = event.first
    router.push({ query: { ...route.query, page: page.value } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

useHead({
    title: computed(() => tag.value ? `#${tag.value.name} - ${t('pages.posts.title')}` : t('pages.posts.title')),
})
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
        color: white;
        border-radius: 2rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 1rem;

        &--tag {
            background-color: var(--p-info-color);
        }
    }

    &__title {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--p-text-color);
        margin-bottom: 1rem;
        line-height: 1.2;
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
