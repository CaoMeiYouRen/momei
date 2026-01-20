<template>
    <div
        :id="`comment-${comment.id}`"
        class="comment-item"
        :class="{'comment-item--reply': isReply}"
    >
        <div class="comment-item__avatar">
            <img
                :src="avatarUrl"
                :alt="comment.authorName"
                class="comment-item__avatar-img"
            >
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
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
    comment: Comment
    isReply?: boolean
}>()

defineEmits<{
    (e: 'reply', comment: Comment): void
}>()

const { locale } = useI18n()

// 简单的 Markdown 渲染
const md = new MarkdownIt({
    html: false, // 禁止 HTML 注入
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value
            } catch (__) {}
        }

        return '' // use external default escaping
    },
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

// 头像处理 (本地优先，否则 Gravatar)
const avatarUrl = computed(() => {
    if (props.comment.author?.image) {
        return props.comment.author.image
    }
    // 使用简单的 Gravatar 逻辑，由于无法在前端直接 MD5 (除非引入库)
    // 这里暂时使用作者名称的首字母做占位，或者返回一个默认头像
    // 提示：后端应该在返回数据时处理好头像 URL 或者是邮箱的 MD5
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(props.comment.authorName)}&background=random`
})
</script>

<style lang="scss" scoped>
.comment-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--p-content-border-color);

  &:last-child {
    border-bottom: none;
  }

  &--reply {
    padding: 1rem 0 0 1rem;
    border-bottom: none;
    border-left: 2px solid var(--p-surface-100);
    margin-left: 0.5rem;
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
    margin-bottom: 0.5rem;
  }

  &__author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__author-link {
    font-weight: 700;
    color: var(--p-primary-color);
    text-decoration: none;

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
    color: var(--p-text-color-secondary);
  }

  &__content {
    margin-bottom: 0.5rem;
  }

  &__pending {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background-color: var(--p-warn-50);
    color: var(--p-warn-700);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  &__text {
    color: var(--p-text-color);
    overflow-wrap: break-word;
    :deep(p) { margin: 0; }

    :deep(pre) {
      background-color: var(--p-surface-50);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 0.5rem 0;
      border: 1px solid var(--p-surface-200);

      code {
        background-color: transparent;
        padding: 0;
        color: inherit;
        font-family: 'Fira Code', 'Cascadia Code', 'Source Code Pro', monospace;
        font-size: 0.85rem;
      }
    }

    :deep(code) {
      background-color: var(--p-surface-100);
      padding: 0.2em 0.4em;
      border-radius: 0.25em;
      font-size: 0.85em;
      color: var(--p-primary-600);
    }
  }

  &__actions {
    display: flex;
    gap: 1rem;
  }

  &__replies {
    margin-top: 0.5rem;
  }
}

:global(.dark) .comment-item {
  &--reply {
    border-color: var(--p-surface-800);
    border-left-color: var(--p-surface-800);
  }

  .comment-item__author-name {
    color: #f8fafc;
  }

  .comment-item__author-link {
    color: var(--p-primary-400);
  }

  &__pending {
    background-color: rgb(var(--p-warn-500-rgb), 0.1);
    color: var(--p-warn-400);
  }

  .comment-item__text {
    :deep(code) {
      background-color: var(--p-surface-800);
      color: var(--p-primary-400);
    }

    :deep(pre) {
      background-color: #0d1117;
      border-color: #30363d;
    }
  }
}
</style>
