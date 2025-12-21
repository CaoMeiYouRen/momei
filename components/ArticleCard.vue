<template>
    <div
        class="article-card"
        :class="{'article-card--horizontal': layout === 'horizontal'}"
        @click="navigateToPost"
    >
        <div v-if="post.coverImage" class="article-card__cover">
            <img
                :src="post.coverImage"
                :alt="post.title"
                width="640"
                height="360"
            >
        </div>
        <div class="article-card__content">
            <h2 class="article-card__title">
                {{ post.title }}
            </h2>

            <div class="article-card__meta">
                <span v-if="post.author" class="article-card__meta-item">
                    <i class="pi pi-user" />
                    {{ post.author.name }}
                </span>
                <span v-if="post.publishedAt" class="article-card__meta-item">
                    <i class="pi pi-calendar" />
                    {{ formatDate(post.publishedAt) }}
                </span>
                <span class="article-card__meta-item">
                    <i class="pi pi-eye" />
                    {{ post.views }}
                </span>
            </div>

            <p class="article-card__summary" :title="post.summary || ''">
                {{ formattedSummary }}
            </p>

            <div class="article-card__footer">
                <Tag
                    v-if="post.category"
                    :value="post.category.name"
                    severity="secondary"
                />
                <Button
                    :label="$t('common.read_more')"
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
import { formatDate } from '@/utils/shared/date'

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
    summary?: string | null
    coverImage?: string | null
    views: number
    publishedAt?: string | Date | null
    author?: Author | null
    category?: Category | null
}

const props = withDefaults(defineProps<{
    post: Post
    layout?: 'vertical' | 'horizontal'
}>(), {
    layout: 'vertical',
})

const localePath = useLocalePath()

const formattedSummary = computed(() => {
    const summary = props.post.summary || ''
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary
})

const navigateToPost = () => {
    navigateTo(localePath(`/posts/${props.post.slug || props.post.id}`))
}
</script>

<style lang="scss" scoped>
.article-card {
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.3s ease;

    &:hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);

        .article-card__cover img {
            transform: scale(1.05);
        }
    }

    &__cover {
        aspect-ratio: 16 / 9;
        overflow: hidden;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
    }

    &__content {
        padding: 1rem;
    }

    &__title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.5rem;

        // Line clamp 2
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__meta {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.75rem;

        &-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    }

    &__summary {
        color: #4b5563;
        margin-bottom: 1rem;

        // Line clamp 3
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    // Horizontal layout modifier
    &--horizontal {
        display: flex;
        flex-direction: row;

        .article-card__cover {
            width: 300px;
            flex-shrink: 0;
            aspect-ratio: auto; // Reset aspect ratio
            height: auto;
        }

        .article-card__content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        // Responsive adjustments for mobile
        @media (max-width: 768px) {
            flex-direction: column;

            .article-card__cover {
                width: 100%;
                aspect-ratio: 16 / 9;
            }
        }
    }
}

// Dark mode
:global(.dark) .article-card {
    background-color: #1f2937;
    border-color: #374151;

    &__title {
        color: #f3f4f6;
    }

    &__meta {
        color: #9ca3af;
    }

    &__summary {
        color: #d1d5db;
    }
}
</style>
