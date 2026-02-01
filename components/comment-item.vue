<template>
    <div
        :id="`comment-${comment.id}`"
        class="comment-item"
        :class="{'comment-item--reply': isReply}"
    >
        <div class="comment-item__avatar">
            <AppAvatar
                :image="comment.author?.image"
                :email-hash="comment.authorEmailHash"
                :name="comment.authorName"
                class="comment-item__avatar-img"
                loading="lazy"
                decoding="async"
            />
        </div>

        <div class="comment-item__main">
            <div class="comment-item__header">
                <div class="comment-item__author">
                    <a
                        v-if="comment.authorUrl"
                        :href="comment.authorUrl"
                        target="_blank"
                        rel="nofollow noopener"
                        class="comment-item__author-link"
                    >
                        {{ comment.authorName }}
                    </a>
                    <span v-else class="comment-item__author-name">
                        {{ comment.authorName }}
                    </span>
                    <Tag
                        v-if="comment.authorId"
                        :value="$t('common.author')"
                        size="small"
                        class="comment-item__author-tag"
                    />
                    <Tag
                        v-if="comment.isSticked"
                        :value="$t('comments.sticked')"
                        severity="warn"
                        size="small"
                        class="comment-item__sticked-tag"
                    />
                </div>
                <div class="comment-item__meta">
                    <time :datetime="comment.createdAt" class="comment-item__date">
                        {{ formatDate(comment.createdAt) }}
                    </time>
                </div>
            </div>

            <div class="comment-item__content">
                <p v-if="comment.status === 'pending'" class="comment-item__pending">
                    <i class="pi pi-clock" /> {{ $t('comments.pending_audit') }}
                </p>
                <!-- eslint-disable vue/no-v-html -->
                <div
                    class="comment-item__text"
                    v-html="renderedContent"
                />
            </div>

            <div class="comment-item__actions">
                <Button
                    icon="pi pi-reply"
                    :label="$t('comments.reply')"
                    text
                    size="small"
                    @click="$emit('reply', comment)"
                />
                <!-- 后续可以增加点赞功能 -->
            </div>

            <!-- 子评论列表 -->
            <div v-if="comment.replies && comment.replies.length > 0" class="comment-item__replies">
                <CommentItem
                    v-for="reply in comment.replies"
                    :key="reply.id"
                    :comment="reply"
                    :is-reply="true"
                    @reply="(c) => $emit('reply', c)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import type { Comment } from '@/types/comment'
import { createMarkdownRenderer } from '@/utils/shared/markdown'

const props = defineProps<{
    comment: Comment
    isReply?: boolean
}>()

defineEmits<{
    (e: 'reply', comment: Comment): void
}>()

const { locale } = useI18n()

// 简单的 Markdown 渲染
const md = createMarkdownRenderer({
    html: false, // 禁止 HTML 注入
})

const renderedContent = computed(() => md.render(props.comment.content || ''))

// 格式化日期
const formatDate = (date: string) => {
    return new Date(date).toLocaleString(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.comment-item {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg 0;
  border-bottom: 1px solid var(--p-surface-border);

  &:last-child {
    border-bottom: none;
  }

  &--reply {
    padding: $spacing-md 0 0 $spacing-md;
    border-bottom: none;
    border-left: 2px solid var(--p-surface-100);
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__avatar-img {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--p-surface-100);
  }

  &--reply &__avatar-img {
    width: 2rem;
    height: 2rem;
  }

  &__main {
    flex-grow: 1;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__author {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__author-link {
    font-weight: 700;
    color: var(--p-primary-color);
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      text-decoration: underline;
    }
  }

  &__author-name {
    font-weight: 700;
    color: var(--p-text-color);
  }

  &__meta {
    font-size: 0.875rem;
    color: var(--p-text-muted-color);
  }

  &__content {
    margin-bottom: $spacing-sm;
  }

  &__pending {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background-color: var(--p-warning-50);
    color: var(--p-warning-700);
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
    margin-bottom: $spacing-sm;
  }

  &__text {
    color: var(--p-text-color);
    overflow-wrap: break-word;
    :deep(p) { margin: 0; }

    :deep(pre) {
      background-color: var(--p-surface-50);
      padding: $spacing-md;
      border-radius: $border-radius-md;
      overflow-x: auto;
      margin: $spacing-sm 0;
      border: 1px solid var(--p-surface-200);

      code {
        background-color: transparent;
        padding: 0;
        color: inherit;
        font-family: $font-mono;
        font-size: 0.85rem;
      }
    }

    :deep(code) {
      background-color: var(--p-surface-100);
      padding: 0.2em 0.4em;
      border-radius: $border-radius-sm;
      font-size: 0.85em;
      color: var(--p-primary-600);
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-md;
  }

  &__replies {
    margin-top: $spacing-sm;
  }
}

:global(.dark) .comment-item {
  &--reply {
    border-color: var(--p-surface-700);
    border-left-color: var(--p-surface-700);
  }

  .comment-item__author-name {
    color: var(--p-text-color);
  }

  .comment-item__author-link {
    color: var(--p-primary-color);
  }

  &__pending {
    background-color: rgb(var(--p-primary-rgb), 0.1);
    color: var(--p-primary-400);
  }

  .comment-item__text {
    :deep(code) {
      background-color: var(--p-surface-100);
      color: var(--p-primary-400);
    }

    :deep(pre) {
      background-color: var(--p-surface-50);
      border-color: var(--p-surface-100);
    }
  }
}
</style>
