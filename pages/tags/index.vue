<template>
    <div class="tags-index">
        <header class="tags-index__header">
            <h1 class="tags-index__title">
                {{ $t('pages.admin.tags.title') }}
            </h1>
            <p class="tags-index__subtitle">
                {{ $t('pages.posts.total_tags', {count: total}) }}
            </p>
        </header>

        <div v-if="pending" class="tags-index__list">
            <Skeleton
                v-for="i in 20"
                :key="i"
                width="6rem"
                height="2rem"
                class="tags-index__skeleton"
            />
        </div>

        <div v-else-if="error" class="tags-index__error">
            <Message severity="error">
                {{ error.message }}
            </Message>
        </div>

        <div v-else class="tags-index__cloud">
            <NuxtLink
                v-for="tag in tags"
                :key="tag.id"
                :to="localePath(`/tags/${tag.slug}`)"
                class="tag-cloud-item"
                :style="{fontSize: getTagWeight(tag.postCount)}"
            >
                <div class="tag-cloud-item__inner">
                    #{{ tag.name }}
                    <span class="tag-cloud-item__count">{{ tag.postCount || 0 }}</span>
                </div>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data, pending, error } = await useFetch<any>('/api/tags', {
    query: {
        language: locale,
        limit: 200, // Show all tags
    },
})

const tags = computed(() => data.value?.data?.items || [])
const total = computed(() => data.value?.data?.total || 0)

const maxCount = computed(() => {
    if (!tags.value.length) return 1
    return Math.max(...tags.value.map((t: any) => t.postCount || 0))
})

const getTagWeight = (count: number = 0) => {
    const min = 0.875
    const max = 2.5
    if (maxCount.value <= 1) return `${min}rem`
    const size = min + (count / maxCount.value) * (max - min)
    return `${size}rem`
}

useHead({
    title: `${t('pages.admin.tags.title')} - ${t('components.header.title')}`,
})
</script>

<style lang="scss" scoped>
.tags-index {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 1rem;

    &__header {
        margin-bottom: 4rem;
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

    &__cloud {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 1.5rem 2rem;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
    }

    &__skeleton {
        border-radius: 0.5rem;
    }
}

.tag-cloud-item {
    text-decoration: none;
    color: var(--p-text-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0.85;

    &:hover {
        opacity: 1;
        color: var(--p-primary-color);
        transform: scale(1.1);

        .tag-cloud-item__count {
            background-color: var(--p-primary-color);
            color: white;
        }
    }

    &__inner {
        display: flex;
        align-items: flex-start;
        gap: 0.25rem;
    }

    &__count {
        font-size: 0.75rem;
        padding: 0.125rem 0.375rem;
        background-color: var(--p-surface-200);
        border-radius: 1rem;
        color: var(--p-text-muted-color);
        font-weight: 500;
        transition: inherit;
        line-height: 1;
        vertical-align: super;
    }
}
</style>
