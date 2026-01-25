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
                loading="lazy"
                decoding="async"
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
                <span v-if="post.audioUrl" class="article-card__meta-item article-card__meta-item--podcast">
                    <i class="pi pi-headphones" />
                    {{ $t('common.podcast') }}
                </span>
            </div>

            <p class="article-card__summary" :title="post.summary || ''">
                {{ formattedSummary }}
            </p>

            <div class="article-card__footer">
                <div class="article-card__taxonomy" @click.stop>
                    <NuxtLink
                        v-if="post.category"
                        :to="localePath(`/categories/${post.category.slug}`)"
                        class="article-card__category"
                    >
                        <Tag
                            :value="post.category.name"
                            severity="secondary"
                        />
                    </NuxtLink>
                    <div v-if="post.tags && post.tags.length > 0" class="article-card__tags">
                        <NuxtLink
                            v-for="tag in post.tags.slice(0, 2)"
                            :key="tag.id"
                            :to="localePath(`/tags/${tag.slug}`)"
                            class="article-card__tag"
                        >
                            #{{ tag.name }}
                        </NuxtLink>
                    </div>
                </div>
                <Button
                    :label="$t('common.read_more')"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    link
                    size="small"
                    class="article-card__read-more"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Post } from '@/types/post'
import { formatDate } from '@/utils/shared/date'

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
    background-color: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
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
        color: var(--p-text-color);
        margin-bottom: 0.5rem;

        // Line clamp 2
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.25rem;
        align-items: center;
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        margin-bottom: 0.75rem;

        &-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            white-space: nowrap;
        }
    }

    &__summary {
        color: var(--p-text-muted-color);
        margin-bottom: 1rem;

        // Line clamp 5
        display: -webkit-box;
        -webkit-line-clamp: 5;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__taxonomy {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
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

    &__tags {
        display: flex;
        gap: 0.5rem;
    }

    &__tag {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            color: var(--m-accent-color);
        }
    }

    &__read-more {
        &.p-button {
            padding: 0;
        }
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
        @media (width <= 768px) {
            flex-direction: column;

            .article-card__cover {
                width: 100%;
                aspect-ratio: 16 / 9;
            }
        }
    }
}
</style>
