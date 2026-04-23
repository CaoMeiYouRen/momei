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
                        v-for="(post, index) in latestPosts"
                        :key="post.id"
                        :post="post"
                        :priority="index < 2"
                    />
                </div>
            </div>
        </section>

        <div
            ref="secondarySectionsTrigger"
            class="home-page__deferred-trigger"
            aria-hidden="true"
        />

        <section v-if="shouldHydrateSecondarySections && (popularPending || popularError || popularPosts.length > 0)" class="popular-posts section">
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
                        v-for="(post, index) in popularPosts"
                        :key="post.id"
                        :post="post"
                        :priority="index === 0"
                    />
                </div>
            </div>
        </section>

        <section v-if="shouldHydrateSecondarySections && (externalFeedPending || externalFeedError || externalFeedItems.length > 0)" class="external-feed section">
            <div class="container">
                <LazyHomeExternalFeedPanel
                    :items="externalFeedItems"
                    :pending="externalFeedPending"
                    :has-error="Boolean(externalFeedError)"
                    :stale="externalFeedStale"
                    :degraded="externalFeedDegraded"
                />
            </div>
        </section>

        <!-- Newsletter Section -->
        <section class="newsletter section">
            <div class="container flex justify-center">
                <LazySubscriberForm
                    v-if="shouldHydrateSecondarySections"
                    class="max-w-4xl w-full"
                />
                <div
                    v-else
                    class="newsletter__placeholder"
                    aria-hidden="true"
                />
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
import type { ExternalFeedHomePayload } from '@/types/external-feed'
import type { PostListData } from '@/types/post'

const localePath = useLocalePath()
const { t } = useI18n()
const { runWhenIdle } = useClientEffectGuard()
const secondarySectionsTrigger = useTemplateRef<HTMLElement>('secondarySectionsTrigger')
const shouldHydrateSecondarySections = ref(import.meta.test || import.meta.env.MODE === 'test')
let secondarySectionsObserver: IntersectionObserver | null = null

const revealSecondarySections = () => {
    shouldHydrateSecondarySections.value = true
}

usePageSeo({
    type: 'website',
    title: () => t('home.meta.title'),
    description: () => t('home.meta.description'),
})

const {
    data: latestData,
    pending: latestPending,
    error: latestError,
} = await useAppFetch<ApiResponse<Pick<PostListData, 'items'>>>('/api/posts/home')

const latestPosts = computed(() => latestData.value?.data?.items || [])

const latestPostIds = computed(() => latestPosts.value.map((post) => String(post.id)))

const {
    data: popularData,
    pending: popularPending,
    error: popularError,
    execute: loadPopularPosts,
} = useAppFetch<ApiResponse<PostListData>>('/api/posts', {
    query: {
        limit: 3,
        isPinned: false,
        status: 'published',
        orderBy: 'views',
        order: 'DESC',
        excludeIds: latestPostIds,
    },
    server: false,
    lazy: true,
    immediate: false,
    watch: [latestPostIds],
})

const popularPosts = computed(() => {
    const latestIds = new Set(latestPostIds.value)
    return (popularData.value?.data?.items || []).filter((post) => !latestIds.has(String(post.id)))
})

const {
    data: externalFeedData,
    pending: externalFeedPending,
    error: externalFeedError,
    execute: loadExternalFeed,
} = useAppFetch<ApiResponse<ExternalFeedHomePayload>>('/api/external-feed/home', {
    server: false,
    lazy: true,
    immediate: false,
})

watch(shouldHydrateSecondarySections, (ready) => {
    if (!ready) {
        return
    }

    void loadPopularPosts?.()
    void loadExternalFeed?.()
}, { immediate: true })

onMounted(() => {
    if (shouldHydrateSecondarySections.value) {
        return
    }

    runWhenIdle(revealSecondarySections, {
        timeout: 5000,
        fallbackDelay: 2200,
    })

    if (!('IntersectionObserver' in window) || !secondarySectionsTrigger.value) {
        return
    }

    secondarySectionsObserver = new window.IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            revealSecondarySections()
            secondarySectionsObserver?.disconnect()
            secondarySectionsObserver = null
        }
    }, {
        rootMargin: '240px 0px',
    })

    secondarySectionsObserver.observe(secondarySectionsTrigger.value)
})

onBeforeUnmount(() => {
    secondarySectionsObserver?.disconnect()
    secondarySectionsObserver = null
})

const externalFeedItems = computed(() => externalFeedData.value?.data?.items || [])
const externalFeedStale = computed(() => Boolean(externalFeedData.value?.data?.stale))
const externalFeedDegraded = computed(() => Boolean(externalFeedData.value?.data?.degraded))
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.home-page {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
  padding-bottom: $spacing-xl;

  &__deferred-trigger {
    height: 1px;
    margin-top: -1px;
  }
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

.newsletter {
  &__placeholder {
    width: min(100%, 56rem);
    min-height: 13rem;
    border-radius: $border-radius-lg;
    background: linear-gradient(135deg, var(--p-surface-100) 0%, var(--p-surface-0) 100%);
    border: 1px dashed var(--p-surface-border);
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
