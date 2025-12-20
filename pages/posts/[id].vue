<template>
    <div class="container max-w-6xl mx-auto px-4 py-8">
        <div v-if="pending" class="flex flex-col gap-8">
            <Skeleton height="30rem" class="rounded-xl w-full" />
            <div class="flex gap-8">
                <div class="flex-1">
                    <Skeleton
                        width="60%"
                        height="3rem"
                        class="mb-4"
                    />
                    <Skeleton
                        width="40%"
                        height="1.5rem"
                        class="mb-8"
                    />
                    <Skeleton
                        v-for="i in 10"
                        :key="i"
                        height="1rem"
                        class="mb-2"
                    />
                </div>
                <div class="hidden lg:block w-64">
                    <Skeleton height="20rem" />
                </div>
            </div>
        </div>

        <div v-else-if="error" class="py-12 text-center">
            <Message severity="error" :text="error.message" />
        </div>

        <div v-else-if="post" class="article-detail">
            <!-- Cover Image -->
            <div v-if="post.coverImage" class="aspect-[21/9] mb-8 overflow-hidden rounded-xl shadow-lg">
                <img
                    :src="post.coverImage"
                    :alt="post.title"
                    class="h-full object-cover w-full"
                >
            </div>

            <div class="flex flex-col gap-12 lg:flex-row">
                <!-- Main Content -->
                <main class="flex-1 min-w-0">
                    <!-- Header -->
                    <header class="mb-8">
                        <div class="dark:text-gray-400 flex gap-2 items-center mb-4 text-gray-500 text-sm">
                            <NuxtLink :to="localePath('/')" class="hover:text-primary-500">
                                Home
                            </NuxtLink>
                            <i class="pi pi-angle-right text-xs" />
                            <NuxtLink :to="localePath('/posts')" class="hover:text-primary-500">
                                {{ $t('pages.posts.title') }}
                            </NuxtLink>
                            <i class="pi pi-angle-right text-xs" />
                            <span class="truncate">{{ post.title }}</span>
                        </div>

                        <h1 class="dark:text-gray-100 font-bold leading-tight mb-6 text-4xl text-gray-900">
                            {{ post.title }}
                        </h1>

                        <div class="border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 flex gap-6 items-center pb-8 text-gray-500 text-sm">
                            <div v-if="post.author" class="flex gap-2 items-center">
                                <Avatar
                                    :image="post.author.image"
                                    :label="post.author.name?.[0]"
                                    shape="circle"
                                />
                                <span class="dark:text-gray-200 font-medium text-gray-900">{{ post.author.name }}</span>
                            </div>
                            <span v-if="post.publishedAt" class="flex gap-1 items-center">
                                <i class="pi pi-calendar" />
                                {{ formatDate(post.publishedAt) }}
                            </span>
                            <span class="flex gap-1 items-center">
                                <i class="pi pi-eye" />
                                {{ post.views }} {{ $t('common.views') }}
                            </span>
                            <Tag
                                v-if="post.category"
                                :value="post.category.name"
                                severity="secondary"
                            />
                        </div>
                    </header>

                    <!-- Content -->
                    <ArticleContent :content="post.content" />

                    <!-- Footer -->
                    <footer class="border-gray-200 border-t dark:border-gray-700 mt-12 pt-8">
                        <div class="flex gap-2 mb-8">
                            <Tag
                                v-for="tag in post.tags"
                                :key="tag.id"
                                :value="tag.name"
                                severity="info"
                                rounded
                            />
                        </div>
                    </footer>
                </main>

                <!-- Sidebar (TOC) -->
                <aside class="flex-shrink-0 hidden lg:block w-64">
                    <TableOfContents :content="post.content" />
                </aside>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { isSnowflakeId } from '@/utils/shared/validate'

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const idOrSlug = route.params.id as string

// Determine if the parameter is an ID or a Slug
const isId = isSnowflakeId(idOrSlug)
const endpoint = isId ? `/api/posts/${idOrSlug}` : `/api/posts/slug/${idOrSlug}`

const { data, pending, error } = await useFetch<any>(endpoint)

const post = computed(() => data.value?.data)

const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString()
}

useHead({
    title: computed(() => post.value?.title || 'Article'),
    meta: [
        { name: 'description', content: computed(() => post.value?.summary || '') },
    ],
})
</script>
