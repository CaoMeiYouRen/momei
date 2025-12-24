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

                <div v-if="pending" class="posts-grid">
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

                <div v-else-if="error" class="error-state">
                    <p>{{ $t('common.error_loading') }}</p>
                </div>

                <div v-else class="posts-grid">
                    <ArticleCard
                        v-for="post in posts"
                        :key="post.id"
                        :post="post"
                    />
                </div>
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
const localePath = useLocalePath()
const { t } = useI18n()

useHead({
    title: t('home.meta.title'),
    meta: [
        { name: 'description', content: t('home.meta.description') },
    ],
})

// Fetch latest 3 posts
const { data, pending, error } = await useFetch('/api/posts', {
    query: {
        limit: 3,
        status: 'published',
    },
})

const posts = computed(() => data.value?.data?.items || [])
</script>

<style lang="scss" scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.hero {
  background: linear-gradient(135deg, var(--p-primary-50) 0%, var(--p-surface-0) 100%);
  padding: 3rem 0;
  text-align: center;

  :global(.dark) & {
    background: linear-gradient(135deg, var(--p-primary-900) 0%, var(--p-surface-900) 100%);
  }

  &__title {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(to right, var(--p-primary-600), var(--p-primary-400));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
  }

  &__subtitle {
    font-size: 1.25rem;
    color: var(--p-text-muted-color);
    margin-bottom: 1.5rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
}

.section {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--p-text-color);
  }
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
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
  padding: 4rem 0;
  border-radius: 1rem;

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
      margin-bottom: 2rem;
      line-height: 1.7;
    }
  }
}
</style>
