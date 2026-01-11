<template>
    <div class="categories-index">
        <header class="categories-index__header">
            <h1 class="categories-index__title">
                {{ $t('common.category') }}
            </h1>
            <p class="categories-index__subtitle">
                {{ $t('pages.posts.total_categories', {count: total}) }}
            </p>
        </header>

        <div v-if="pending" class="categories-index__grid">
            <Skeleton
                v-for="i in 6"
                :key="i"
                height="8rem"
                class="categories-index__skeleton"
            />
        </div>

        <div v-else-if="error" class="categories-index__error">
            <Message severity="error">
                {{ error.message }}
            </Message>
        </div>

        <div v-else class="categories-index__grid">
            <NuxtLink
                v-for="category in categories"
                :key="category.id"
                :to="localePath(`/categories/${category.slug}`)"
                class="category-card"
            >
                <div class="category-card__content">
                    <h2 class="category-card__name">
                        {{ category.name }}
                    </h2>
                    <p v-if="category.description" class="category-card__description">
                        {{ category.description }}
                    </p>
                </div>
                <div class="category-card__footer">
                    <i class="pi pi-file" />
                    <span>{{ $t('pages.posts.article_count', {count: category.postCount || 0}) }}</span>
                </div>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data, pending, error } = await useFetch<any>('/api/categories', {
    query: {
        language: locale,
        limit: 100, // Show all
    },
})

const categories = computed(() => data.value?.data?.items || [])
const total = computed(() => data.value?.data?.total || 0)

useHead({
    title: `${t('pages.admin.categories.title')} - ${t('components.header.title')}`,
})
</script>

<style lang="scss" scoped>
.categories-index {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 1rem;

    &__header {
        margin-bottom: 3rem;
        text-align: center;
    }

    &__title {
        font-size: 2.25rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
    }

    &__subtitle {
        color: var(--p-text-muted-color);
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
        gap: 1.5rem;
    }

    &__skeleton {
        border-radius: 1rem;
    }
}

.category-card {
    display: flex;
    flex-direction: column;
    background-color: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 1rem;
    padding: 1.5rem;
    text-decoration: none;
    transition: all 0.2s ease;
    height: 100%;

    &:hover {
        transform: translateY(-4px);
        border-color: var(--p-primary-color);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);

        .category-card__name {
            color: var(--p-primary-color);
        }
    }

    &__content {
        flex: 1;
        margin-bottom: 1rem;
    }

    &__name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--p-text-color);
        margin-bottom: 0.5rem;
        transition: color 0.2s;
    }

    &__description {
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__footer {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
    }
}
</style>
