<template>
    <div class="external-feed-panel">
        <div class="external-feed-panel__header">
            <div>
                <h2 class="external-feed-panel__title">
                    {{ $t('home.external_feed.title') }}
                </h2>
                <p class="external-feed-panel__subtitle">
                    {{ $t('home.external_feed.subtitle') }}
                </p>
            </div>
            <div class="external-feed-panel__status">
                <Tag
                    v-if="stale"
                    severity="warn"
                    :value="$t('home.external_feed.stale')"
                />
                <Tag
                    v-if="degraded"
                    severity="secondary"
                    :value="$t('home.external_feed.degraded')"
                />
            </div>
        </div>

        <div v-if="pending" class="external-feed-panel__grid">
            <div
                v-for="index in 3"
                :key="index"
                class="external-feed-panel__skeleton"
            >
                <Skeleton
                    width="50%"
                    height="1rem"
                    class="mb-3"
                />
                <Skeleton
                    width="85%"
                    height="1.5rem"
                    class="mb-2"
                />
                <Skeleton width="100%" height="3rem" />
            </div>
        </div>

        <div v-else-if="hasError" class="external-feed-panel__state external-feed-panel__state--error">
            <p>{{ $t('common.error_loading') }}</p>
        </div>

        <div v-else-if="items.length === 0" class="external-feed-panel__state">
            <p>{{ $t('home.external_feed.empty') }}</p>
        </div>

        <template v-else>
            <Message
                v-if="degraded"
                severity="secondary"
                :closable="false"
                class="external-feed-panel__notice"
            >
                {{ $t('home.external_feed.degraded_notice') }}
            </Message>

            <div class="external-feed-panel__grid">
                <article
                    v-for="item in items"
                    :key="item.id"
                    class="external-feed-panel__card"
                >
                    <div class="external-feed-panel__meta-row">
                        <div class="external-feed-panel__meta-left">
                            <Tag
                                v-if="item.sourceBadge"
                                severity="contrast"
                                :value="item.sourceBadge"
                            />
                            <span class="external-feed-panel__source">{{ item.sourceTitle }}</span>
                        </div>
                        <span v-if="item.publishedAt" class="external-feed-panel__date">
                            {{ formatDate(item.publishedAt) }}
                        </span>
                    </div>

                    <h3 class="external-feed-panel__item-title">
                        <a
                            :href="item.url"
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            class="external-feed-panel__link"
                        >
                            {{ item.title }}
                        </a>
                    </h3>

                    <p v-if="item.summary" class="external-feed-panel__summary">
                        {{ item.summary }}
                    </p>

                    <div class="external-feed-panel__footer">
                        <span v-if="item.authorName" class="external-feed-panel__author">
                            {{ item.authorName }}
                        </span>
                        <a
                            :href="item.url"
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            class="external-feed-panel__action"
                        >
                            {{ $t('home.external_feed.open_external') }}
                            <i class="pi pi-external-link" />
                        </a>
                    </div>
                </article>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { ExternalFeedItem } from '@/types/external-feed'
import { formatDate } from '@/utils/shared/date'

withDefaults(defineProps<{
    items: ExternalFeedItem[]
    pending?: boolean
    hasError?: boolean
    stale?: boolean
    degraded?: boolean
}>(), {
    pending: false,
    hasError: false,
    stale: false,
    degraded: false,
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.external-feed-panel {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;

    &__header {
        display: flex;
        justify-content: space-between;
        gap: $spacing-md;
        align-items: flex-start;

        @include respond-below("md") {
            flex-direction: column;
        }
    }

    &__title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
    }

    &__subtitle {
        margin: 0.5rem 0 0;
        color: var(--p-text-muted-color);
    }

    &__status {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
    }

    &__notice {
        margin: 0;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: $spacing-lg;
    }

    &__card,
    &__skeleton,
    &__state {
        @include card-base(0);

        padding: $spacing-lg;
    }

    &__meta-row,
    &__footer {
        display: flex;
        justify-content: space-between;
        gap: $spacing-sm;
        align-items: center;
    }

    &__meta-left {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        min-width: 0;
    }

    &__source,
    &__date,
    &__author {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }

    &__item-title {
        margin: $spacing-md 0 0.75rem;
        font-size: 1.1rem;
        line-height: 1.5;
    }

    &__link,
    &__action {
        color: inherit;
        text-decoration: none;

        &:hover,
        &:focus-visible {
            color: var(--m-accent-color);
        }
    }

    &__summary {
        margin: 0 0 $spacing-md;
        color: var(--p-text-muted-color);

        @include text-ellipsis-multiline(3);
    }

    &__action {
        display: inline-flex;
        gap: 0.375rem;
        align-items: center;
        font-weight: 600;
        white-space: nowrap;
    }

    &__state {
        color: var(--p-text-muted-color);

        p {
            margin: 0;
        }

        &--error {
            color: var(--p-red-500);
        }
    }
}
</style>
