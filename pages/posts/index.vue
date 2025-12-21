<template>
    <div class="container max-w-4xl mx-auto px-4 py-8">
        <h1 class="dark:text-gray-100 font-bold mb-8 text-3xl text-gray-900">
            {{ $t('pages.posts.title') }}
        </h1>

        <div v-if="pending" class="flex flex-col gap-6">
            <Skeleton
                v-for="i in 6"
                :key="i"
                height="12rem"
                class="rounded-lg"
            />
        </div>

        <div v-else-if="error" class="py-12 text-center">
            <Message severity="error" :text="error.message" />
        </div>

        <div v-else-if="posts.length === 0" class="py-12 text-center text-gray-500">
            {{ $t('pages.posts.empty') }}
        </div>

        <div v-else class="flex flex-col gap-6">
            <ArticleCard
                v-for="post in posts"
                :key="post.id"
                :post="post"
                layout="horizontal"
            />
        </div>

        <div v-if="totalPages > 1" class="flex justify-center mt-8">
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
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const page = ref(Number(route.query.page) || 1)
const limit = ref(10)
const first = ref((page.value - 1) * limit.value)

const { data, pending, error } = await useFetch('/api/posts', {
    query: {
        page,
        limit,
        status: 'published',
    },
    watch: [page],
})

const posts = computed(() => data.value?.data?.items || [])
const total = computed(() => data.value?.data?.total || 0)
const totalPages = computed(() => data.value?.data?.totalPages || 0)

const onPageChange = (event: any) => {
    page.value = event.page + 1
    first.value = event.first
    router.push({ query: { ...route.query, page: page.value } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(() => route.query.page, (newPage) => {
    if (newPage) {
        page.value = Number(newPage)
        first.value = (page.value - 1) * limit.value
    }
})

useHead({
    title: t('pages.posts.title'),
})
</script>
