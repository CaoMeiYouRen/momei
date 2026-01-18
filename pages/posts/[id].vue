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
            <!-- Status Banner -->
            <div
                v-if="post.status !== 'published'"
                class="post-detail__status-banner"
            >
                <Message
                    severity="warn"
                    :closable="false"
                >
                    <i class="pi pi-exclamation-triangle" />
                    {{ $t('pages.posts.status_warning', {status: $t(`common.status.${post.status}`)}) }}
                </Message>
            </div>

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
                <!-- Sidebar (TOC) -->
                <aside class="post-detail__sidebar">
                    <div class="post-detail__sidebar-content">
                        <TableOfContents :content="post.content" />
                    </div>
                </aside>

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
                            <template v-if="post.category">
                                <i class="pi pi-angle-right post-detail__breadcrumb-separator" />
                                <NuxtLink :to="localePath(`/categories/${post.category.slug}`)" class="breadcrumb-link">
                                    {{ post.category.name }}
                                </NuxtLink>
                            </template>
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
                                {{ formatDateTime(post.publishedAt) }}
                            </span>
                            <span class="post-detail__meta-item">
                                <i class="pi pi-eye" />
                                {{ post.views }} {{ $t('common.views') }}
                            </span>
                            <span class="post-detail__meta-item">
                                <i class="pi pi-pencil" />
                                {{ countWords(post.content) }} {{ $t('common.word_count') }}
                            </span>
                            <span class="post-detail__meta-item">
                                <i class="pi pi-clock" />
                                {{ $t('common.minutes', {min: estimateReadingTime(post.content)}) }}
                            </span>
                            <NuxtLink
                                v-if="post.category"
                                :to="localePath(`/categories/${post.category.slug}`)"
                                class="post-detail__category"
                            >
                                <Tag
                                    :value="post.category.name"
                                    severity="secondary"
                                />
                            </NuxtLink>
                        </div>
                    </header>

                    <!-- Content -->
                    <ArticleContent :content="post.content" />

                    <!-- Copyright -->
                    <ArticleCopyright
                        :author-name="post.author?.name || post.author?.email || ''"
                        :url="fullUrl"
                        :license="post.copyright"
                    />

                    <!-- Footer -->
                    <footer class="post-detail__footer">
                        <div v-if="post.tags && post.tags.length > 0" class="post-detail__tags">
                            <NuxtLink
                                v-for="tag in post.tags"
                                :key="tag.id"
                                :to="localePath(`/tags/${tag.slug}`)"
                                class="post-detail__tag-link"
                            >
                                <Tag
                                    :value="tag.name"
                                    severity="info"
                                    rounded
                                />
                            </NuxtLink>
                        </div>
                        <hr class="post-detail__divider">
                        <SubscriberForm />
                    </footer>
                </main>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { isSnowflakeId } from '@/utils/shared/validate'
import { countWords, estimateReadingTime } from '@/utils/shared/post-stats'

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const setI18nParams = useSetI18nParams()
const { formatDateTime } = useI18nDate()

const idOrSlug = route.params.id as string

const fullUrl = computed(() => {
    if (import.meta.server) {
        return useRequestURL().href
    }
    return window.location.href
})

// Determine if the parameter is an ID or a Slug
const isId = isSnowflakeId(idOrSlug)
const endpoint = isId ? `/api/posts/${idOrSlug}` : `/api/posts/slug/${idOrSlug}`

const { data, pending, error } = await useAppFetch<any>(() => endpoint)

const post = computed(() => data.value?.data)

// Handle dynamic route translations for i18n language switcher
watch(post, (newPost) => {
    if (newPost?.translations) {
        const params: Record<string, any> = {}
        newPost.translations.forEach((tr: any) => {
            params[tr.language] = { id: tr.slug }
        })
        setI18nParams(params)
    }
}, { immediate: true })

useHead({
    title: computed(() => post.value?.title || 'Article'),
    meta: [
        { name: 'description', content: computed(() => post.value?.summary || '') },
    ],
})

onMounted(async () => {
    if (!post.value?.id) {
        return
    }

    if (import.meta.browser) { // 只在客户端执行
        const postId = post.value.id
        const storageKey = `momei_view_${postId}`

        if (!sessionStorage.getItem(storageKey)) {
            try {
                const res = await $fetch<{ code: number, data: { views: number } }>(`/api/posts/${postId}/views`, {
                    method: 'POST',
                })
                if (res.code === 200 && data.value?.data) {
                    data.value.data.views = res.data.views
                    sessionStorage.setItem(storageKey, '1')
                }
            } catch (error) {
                console.error('Failed to increment view count:', error)
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.post-detail {
    max-width: 72rem;
    margin: 0 auto;
    padding: 2rem 1rem;

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
        background-color: var(--p-surface-card);
        padding: 2.5rem;
        border-radius: 1rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        border: 1px solid var(--p-surface-border);

        @media (width <= 768px) {
            padding: 1.5rem;
            border-radius: 0.75rem;
        }
    }

    &__skeleton-sidebar {
        display: none;
        width: 16rem;

        @media (width >= 1024px) {
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
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    &__layout {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        align-items: flex-start;

        @media (width >= 1024px) {
            flex-direction: row;
        }
    }

    &__sidebar {
        display: none;
        width: 16rem;
        flex-shrink: 0;

        @media (width >= 1024px) {
            display: block;
            position: sticky;
            top: 6rem;
        }
    }

    &__sidebar-content {
        background-color: var(--p-surface-card);
        padding: 1.5rem;
        border-radius: 1rem;
        border: 1px solid var(--p-surface-border);
        max-height: calc(100vh - 8rem);
        overflow-y: auto;
    }

    &__main {
        flex: 1;
        min-width: 0;
        background-color: var(--p-surface-card);
        padding: 2.5rem;
        border-radius: 1rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        border: 1px solid var(--p-surface-border);

        @media (width <= 768px) {
            padding: 1.5rem;
            border-radius: 0.75rem;
        }
    }

    &__header {
        margin-bottom: 2rem;
    }

    &__status-banner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        background-color: color-mix(in srgb, var(--p-warning-color), white 85%);
        border: 2px solid var(--p-warning-color);
        border-radius: 0.75rem;
        color: color-mix(in srgb, var(--p-warning-color), black 40%);
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.5;
        box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--p-warning-color), transparent 80%);
        animation: slide-down 0.4s ease-out;

        :global(.dark) & {
            background-color: color-mix(in srgb, var(--p-warning-color), black 85%);
            border-color: color-mix(in srgb, var(--p-warning-color), transparent 30%);
            color: color-mix(in srgb, var(--p-warning-color), white 20%);
        }

        i {
            font-size: 1.25rem;
        }
    }

    @keyframes slide-down {
        from {
            transform: translateY(-1rem);
            opacity: 0;
        }

        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    &__breadcrumb {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
    }

    &__breadcrumb-separator {
        font-size: 0.75rem;
    }

    &__title {
        font-size: 2.25rem;
        font-weight: 700;
        line-height: 1.25;
        margin-bottom: 1.5rem;
        color: var(--p-text-color);
    }

    &__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1.5rem;
        align-items: center;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--p-surface-border);
        font-size: 0.875rem;
        color: var(--p-text-muted-color);

        @media (width <= 768px) {
            gap: 0.75rem 1rem;
        }
    }

    &__author {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
    }

    &__category {
        display: inline-flex;
        text-decoration: none;
        transition: transform 0.2s;
        white-space: nowrap;

        &:hover {
            transform: translateY(-1px);
        }
    }

    &__meta-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        white-space: nowrap;
    }

    &__footer {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid var(--p-surface-border);
    }

    &__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 2rem;
    }

    &__tag-link {
        text-decoration: none;
        transition: transform 0.2s, filter 0.2s;

        &:hover {
            transform: scale(1.05);
            filter: brightness(1.1);
        }
    }

    &__divider {
        margin: 2rem 0;
        border: 0;
        border-top: 1px solid var(--p-surface-border);
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
