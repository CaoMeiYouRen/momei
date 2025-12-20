<template>
    <div class="article-card bg-white border border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-700 hover:shadow-md overflow-hidden rounded-lg transition-shadow" @click="navigateToPost">
        <div v-if="post.coverImage" class="article-card__cover aspect-video overflow-hidden">
            <img
                :src="post.coverImage"
                :alt="post.title"
                class="duration-300 h-full hover:scale-105 object-cover transition-transform w-full"
            >
        </div>
        <div class="p-4">
            <h2 class="dark:text-gray-100 font-bold line-clamp-2 mb-2 text-gray-900 text-xl">
                {{ post.title }}
            </h2>

            <div class="dark:text-gray-400 flex gap-4 items-center mb-3 text-gray-500 text-sm">
                <span v-if="post.author" class="flex gap-1 items-center">
                    <i class="pi pi-user" />
                    {{ post.author.name }}
                </span>
                <span v-if="post.publishedAt" class="flex gap-1 items-center">
                    <i class="pi pi-calendar" />
                    {{ formatDate(post.publishedAt) }}
                </span>
                <span class="flex gap-1 items-center">
                    <i class="pi pi-eye" />
                    {{ post.views }}
                </span>
            </div>

            <p class="dark:text-gray-300 line-clamp-3 mb-4 text-gray-600">
                {{ post.summary }}
            </p>

            <div class="flex items-center justify-between">
                <Tag
                    v-if="post.category"
                    :value="post.category.name"
                    severity="secondary"
                />
                <Button
                    :label="$t('common.readMore')"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    link
                    size="small"
                    class="p-0"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Author {
    id: string
    name: string
    image?: string
}

interface Category {
    id: string
    name: string
}

interface Post {
    id: string
    slug: string
    title: string
    summary?: string
    coverImage?: string
    views: number
    publishedAt?: string | Date
    author?: Author
    category?: Category
}

const props = defineProps<{
    post: Post
}>()

const localePath = useLocalePath()

const navigateToPost = () => {
    navigateTo(localePath(`/posts/${props.post.slug || props.post.id}`))
}

const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString()
}
</script>

<style lang="scss" scoped>
/* 样式全部由类和 BEM 结构控制，无需空规则 */
</style>
