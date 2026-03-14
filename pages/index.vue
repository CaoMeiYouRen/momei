<template>
    <div class="home-page">
        <!-- Hero Section -->
        <!-- <section class="hero">
            <div class="container">
                <div class="hero__content">
                    <h1 class="hero__title">
                        {{ $t('home.hero.title') }}
                    </h1>
                    <p class="hero__subtitle">
                        {{ $t('home.hero.subtitle') }}
                    </p>
                    <div class="hero__actions">
                        <NuxtLink :to="localePath('/posts')" class="btn btn--primary">
                            {{ $t('home.hero.cta') }}
                        </NuxtLink>
                        <NuxtLink :to="localePath('/about')" class="btn btn--outline">
                            {{ $t('common.about') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section> -->

        <!-- Latest Posts Section -->
        <section class="latest-posts section">
            <div class="container">
                <div class="section__header">
                    <h2 class="section__title">
                        {{ $t('home.latest_posts.title') }}
                    </h2>
                    <NuxtLink :to="localePath('/posts')" class="link-more">
                        {{ $t('common.view_all') }} &rarr;
                    </NuxtLink>
                </div>

                <div v-if="latestPending" class="posts-grid">
                    <div
                        v-for="i in 3"
                        :key="i"
                        class="post-card-skeleton"
                    >
                        <Skeleton height="200px" class="mb-4" />
                        <Skeleton
                            width="60%"
                            height="1.5rem"
                            class="mb-2"
                        />
                        <Skeleton width="40%" height="1rem" />
                    </div>
                </div>

                <div v-else-if="latestError" class="error-state">
                    <p>{{ $t('common.error_loading') }}</p>
                </div>

                <div v-else class="posts-grid">
                    <ArticleCard
                        v-for="post in latestPosts"
                        :key="post.id"
                        :post="post"
                    />
                </div>
            </div>
        </section>

        <section v-if="popularPending || popularError || popularPosts.length > 0" class="popular-posts section">
            <div class="container">
                <div class="section__header">
                    <h2 class="section__title">
                        {{ $t('home.popular_posts.title') }}
                    </h2>
                    <NuxtLink :to="localePath('/posts')" class="link-more">
                        {{ $t('common.view_all') }} &rarr;
                    </NuxtLink>
                </div>

                <div v-if="popularPending" class="posts-grid">
                    <div
                        v-for="i in 3"
                        :key="`popular-${i}`"
                        class="post-card-skeleton"
                    >
                        <Skeleton height="200px" class="mb-4" />
                        <Skeleton
                            width="60%"
                            height="1.5rem"
                            class="mb-2"
                        />
                        <Skeleton width="40%" height="1rem" />
                    </div>
                </div>

                <div v-else-if="popularError" class="error-state">
                    <p>{{ $t('common.error_loading') }}</p>
                </div>

                <div v-else class="posts-grid">
                    <ArticleCard
                        v-for="post in popularPosts"
                        :key="post.id"
                        :post="post"
                    />
                </div>
            </div>
        </section>

        <!-- Newsletter Section -->
        <section class="newsletter section">
            <div class="container flex justify-center">
                <SubscriberForm class="max-w-4xl w-full" />
            </div>
        </section>

        <!-- About Preview Section -->
        <section class="about-preview section">
            <div class="container">
                <div class="about-content">
                    <div class="about-text">
                        <h2 class="section__title">
                            {{ $t('common.about') }} {{ $t('app.name') }}
                        </h2>
                        <p>{{ $t('home.about.description') }}</p>
                        <NuxtLink :to="localePath('/about')" class="btn btn--text">
                            {{ $t('common.about') }} &rarr;
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '@/types/api'
import type { Post } from '@/types/post'
import {
    HOMEPAGE_LATEST_POST_LIMIT,
    HOMEPAGE_PINNED_POST_LIMIT,
} from '@/utils/shared/post-pinning'

interface PublicPostListData {
    items: Post[]
    total: number
    page: number
    limit: number
    totalPages: number
}

const localePath = useLocalePath()
const { t } = useI18n()

usePageSeo({
    type: 'website',
    title: () => t('home.meta.title'),
    description: () => t('home.meta.description'),
})

const {
    data: pinnedLatestData,
    pending: pinnedLatestPending,
    error: pinnedLatestError,
} = await useAppFetch<ApiResponse<PublicPostListData>>('/api/posts', {
    query: {
        limit: HOMEPAGE_PINNED_POST_LIMIT,
        isPinned: true,
        status: 'published',
        orderBy: 'publishedAt',
        order: 'DESC',
    },
})

const {
    data: regularLatestData,
    pending: regularLatestPending,
    error: regularLatestError,
} = await useAppFetch<ApiResponse<PublicPostListData>>('/api/posts', {
    query: {
        limit: HOMEPAGE_LATEST_POST_LIMIT,
        isPinned: false,
        status: 'published',
        orderBy: 'publishedAt',
        order: 'DESC',
    },
})

const latestPending = computed(() => pinnedLatestPending.value || regularLatestPending.value)
const latestError = computed(() => pinnedLatestError.value || regularLatestError.value)

const latestPosts = computed(() => {
    const pinnedPosts = pinnedLatestData.value?.data?.items || []
    const regularPosts = regularLatestData.value?.data?.items || []

    return [...pinnedPosts, ...regularPosts].slice(0, HOMEPAGE_LATEST_POST_LIMIT)
})

const latestPostIds = computed(() => latestPosts.value.map((post) => String(post.id)))

const { data: popularData, pending: popularPending, error: popularError } = await useAppFetch<ApiResponse<PublicPostListData>>('/api/posts', {
    query: {
        limit: 3,
        isPinned: false,
        status: 'published',
        orderBy: 'views',
        order: 'DESC',
        excludeIds: latestPostIds,
    },
    watch: [latestPostIds],
})

const popularPosts = computed(() => {
    const latestIds = new Set(latestPostIds.value)
    return (popularData.value?.data?.items || []).filter((post) => !latestIds.has(String(post.id)))
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.home-page {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
  padding-bottom: $spacing-xl;
}

.hero {
  background: linear-gradient(135deg, var(--p-primary-50) 0%, var(--p-surface-0) 100%);
  padding: $spacing-xl * 1.5 0;
  text-align: center;

  :global(.dark) & {
    background: linear-gradient(135deg, var(--p-primary-900) 0%, var(--p-surface-900) 100%);
  }

  &__title {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: $spacing-lg;
    background: linear-gradient(to right, var(--p-primary-600), var(--p-primary-400));
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;

    @include respond-below("md") {
      font-size: 2.5rem;
    }
  }

  &__subtitle {
    font-size: 1.25rem;
    color: var(--p-text-muted-color);
    margin-bottom: $spacing-lg;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__actions {
    display: flex;
    gap: $spacing-md;
    justify-content: center;
  }
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-xl;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius-md;
  font-weight: 600;
  transition: $transition-base;
  text-decoration: none;

  &--primary {
    background-color: var(--p-primary-600);
    color: white;

    &:hover {
      background-color: var(--p-primary-700);
    }
  }

  &--outline {
    border: 2px solid var(--p-primary-600);
    color: var(--p-primary-600);

    &:hover {
      background-color: var(--p-primary-50);
    }

    :global(.dark) &:hover {
      background-color: var(--p-primary-900);
    }
  }

  &--text {
    padding: 0;
    color: var(--p-primary-600);

    &:hover {
      text-decoration: underline;
    }
  }
}

.link-more {
  color: var(--p-primary-600);
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.about-preview {
  background-color: var(--p-surface-50);
  padding: $spacing-xl * 2 0;
  border-radius: $border-radius-lg;

  :global(.dark) & {
    background-color: var(--p-surface-800);
  }

  .about-text {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;

    p {
      font-size: 1.125rem;
      color: var(--p-text-muted-color);
      margin-bottom: $spacing-lg;
      line-height: 1.7;
    }
  }
}
</style>
