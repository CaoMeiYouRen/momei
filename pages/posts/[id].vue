<template>
    <div class="post-detail">
        <div v-if="pending" class="post-detail__loading">
            <Skeleton height="30rem" class="post-detail__skeleton-cover" />
            <div class="post-detail__skeleton-content">
                <div class="post-detail__skeleton-main">
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
                <div class="post-detail__skeleton-sidebar">
                    <Skeleton height="20rem" />
                </div>
            </div>
        </div>

        <div v-else-if="error" class="post-detail__error">
            <Message severity="error" :text="error.message" />
        </div>

        <div v-else-if="post" class="post-detail__content">
            <!-- Cover Image -->
            <div v-if="post.coverImage" class="post-detail__cover">
                <img
                    :src="post.coverImage"
                    :alt="post.title"
                    width="1200"
                    height="514"
                >
            </div>

            <div class="post-detail__layout">
                <!-- Main Content -->
                <main class="post-detail__main">
                    <!-- Header -->
                    <header class="post-detail__header">
                        <div class="post-detail__breadcrumb">
                            <NuxtLink :to="localePath('/')" class="breadcrumb-link">
                                {{ $t('common.home') }}
                            </NuxtLink>
                            <i class="pi pi-angle-right post-detail__breadcrumb-separator" />
                            <NuxtLink :to="localePath('/posts')" class="breadcrumb-link">
                                {{ $t('pages.posts.title') }}
                            </NuxtLink>
                            <i class="pi pi-angle-right post-detail__breadcrumb-separator" />
                            <span class="truncate">{{ post.title }}</span>
                        </div>

                        <h1 class="post-detail__title">
                            {{ post.title }}
                        </h1>

                        <div class="post-detail__meta">
                            <div v-if="post.author" class="post-detail__author">
                                <Avatar
                                    :image="post.author.image"
                                    :label="post.author.name?.[0]"
                                    shape="circle"
                                />
                                <span class="font-medium">{{ post.author.name }}</span>
                            </div>
                            <span v-if="post.publishedAt" class="post-detail__meta-item">
                                <i class="pi pi-calendar" />
                                {{ formatDate(post.publishedAt) }}
                            </span>
                            <span class="post-detail__meta-item">
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
                    <footer class="post-detail__footer">
                        <div class="post-detail__tags">
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
                <!-- <aside class="flex-shrink-0 hidden lg:block w-64">
                    <TableOfContents :content="post.content" />
                </aside> -->
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { isSnowflakeId } from '@/utils/shared/validate'
import { formatDate } from '@/utils/shared/date'

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const idOrSlug = route.params.id as string

// Determine if the parameter is an ID or a Slug
const isId = isSnowflakeId(idOrSlug)
const endpoint = isId ? `/api/posts/${idOrSlug}` : `/api/posts/slug/${idOrSlug}`

const { data, pending, error } = await useFetch<any>(endpoint)

const post = computed(() => data.value?.data)

useHead({
    title: computed(() => post.value?.title || 'Article'),
    meta: [
        { name: 'description', content: computed(() => post.value?.summary || '') },
    ],
})
</script>

<style lang="scss" scoped>
.post-detail {
    max-width: 72rem; // max-w-6xl
    margin: 0 auto;
    padding: 2rem 1rem; // py-8 px-4

    &__loading {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    &__skeleton-cover {
        width: 100%;
        border-radius: 0.75rem;
    }

    &__skeleton-content {
        display: flex;
        gap: 2rem;
    }

    &__skeleton-main {
        flex: 1;
        background-color: #fff;
        padding: 2.5rem;
        border-radius: 1rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        border: 1px solid #f3f4f6;

        :global(.dark) & {
            background-color: #1f2937;
            border-color: #374151;
        }

        @media (max-width: 768px) {
            padding: 1.5rem;
            border-radius: 0.75rem;
        }
    }

    &__skeleton-sidebar {
        display: none;
        width: 16rem;

        @media (min-width: 1024px) {
            display: block;
        }
    }

    &__error {
        padding: 3rem 0;
        text-align: center;
    }

    &__cover {
        aspect-ratio: 21 / 9;
        margin-bottom: 2rem;
        overflow: hidden;
        border-radius: 0.75rem; // rounded-xl
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); // shadow-lg

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    &__layout {
        display: flex;
        flex-direction: column;
        gap: 3rem; // gap-12

        @media (min-width: 1024px) { // lg:flex-row
            flex-direction: row;
        }
    }

    &__main {
        flex: 1;
        min-width: 0;
        background-color: #fff;
        padding: 2.5rem;
        border-radius: 1rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        border: 1px solid #f3f4f6;

        :global(.dark) & {
            background-color: #1f2937;
            border-color: #374151;
        }

        @media (max-width: 768px) {
            padding: 1.5rem;
            border-radius: 0.75rem;
        }
    }

    &__header {
        margin-bottom: 2rem;
    }

    &__breadcrumb {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: #6b7280; // text-gray-500

        :global(.dark) & {
            color: #9ca3af; // dark:text-gray-400
        }
    }

    &__breadcrumb-separator {
        font-size: 0.75rem; // text-xs
    }

    &__title {
        font-size: 2.25rem; // text-4xl
        font-weight: 700;
        line-height: 1.25;
        margin-bottom: 1.5rem;
        color: #111827; // text-gray-900

        :global(.dark) & {
            color: #f3f4f6; // dark:text-gray-100
        }
    }

    &__meta {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        padding-bottom: 2rem;
        border-bottom: 1px solid #e5e7eb; // border-gray-200
        font-size: 0.875rem;
        color: #6b7280;

        :global(.dark) & {
            border-color: #374151; // dark:border-gray-700
            color: #9ca3af;
        }
    }

    &__author {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__meta-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__footer {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;

        :global(.dark) & {
            border-color: #374151;
        }
    }

    &__tags {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
}

.breadcrumb-link {
    color: var(--p-text-muted-color);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: var(--p-primary-color);
        text-decoration: underline;
    }
}
</style>
