<template>
    <div class="posts-page">
        <h1 class="posts-page__title">
            {{ $t('pages.posts.title') }}
        </h1>

        <div v-if="pending" class="posts-page__list">
            <Skeleton
                v-for="i in 6"
                :key="i"
                height="12rem"
                class="posts-page__skeleton"
            />
        </div>

        <div v-else-if="error" class="posts-page__error">
            <Message severity="error" :text="error.message" />
        </div>

        <div v-else-if="posts.length === 0" class="posts-page__empty">
            {{ $t('pages.posts.empty') }}
        </div>

        <div v-else class="posts-page__list">
            <ArticleCard
                v-for="post in posts"
                :key="post.id"
                :post="post"
                layout="horizontal"
            />
        </div>

        <div v-if="totalPages > 1" class="posts-page__pagination">
            <Paginator
                v-model:first="first"
                :rows="limit"
                :total-records="total"
                @page="onPageChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '@/types/api'
import type { PostListData } from '@/types/post'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const page = ref(Number(route.query.page) || 1)
const first = ref(0)

const { data, pending, error } = await useAppFetch<ApiResponse<PostListData>>('/api/posts', {
    query: {
        page,
        status: 'published',
    },
    watch: [page],
})

const posts = computed(() => data.value?.data?.items || [])
const total = computed(() => data.value?.data?.total || 0)
const totalPages = computed(() => data.value?.data?.totalPages || 0)
const limit = computed(() => data.value?.data?.limit || 10)

const onPageChange = (event: any) => {
    page.value = event.page + 1
    first.value = event.first
    router.push({ query: { ...route.query, page: page.value } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(() => route.query.page, (newPage) => {
    if (newPage) {
        page.value = Number(newPage)
    }
})

watch([page, limit], ([currentPage, currentLimit]) => {
    first.value = (currentPage - 1) * currentLimit
}, { immediate: true })

usePageSeo({
    type: 'collection',
    title: () => t('pages.posts.title'),
    description: () => t('pages.posts.meta.description'),
})
</script>

<style lang="scss" scoped>
.posts-page {
    max-width: 56rem; // max-w-4xl
    margin: 0 auto;
    padding: 2rem 1rem; // py-8 px-4

    &__title {
        font-size: 1.875rem; // text-3xl
        font-weight: 700;
        margin-bottom: 2rem; // mb-8
        color: var(--p-text-color);
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem; // gap-6
    }

    &__skeleton {
        border-radius: 0.5rem; // rounded-lg
    }

    &__error,
    &__empty {
        padding: 3rem 0; // py-12
        text-align: center;
    }

    &__empty {
        color: var(--p-text-muted-color);
    }

    &__pagination {
        display: flex;
        justify-content: center;
        margin-top: 2rem; // mt-8
    }
}
</style>
