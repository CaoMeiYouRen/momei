<template>
    <div class="snippet-card" :class="`snippet-card--${snippet.status}`">
        <div class="snippet-card__header">
            <div class="snippet-card__meta">
                <span class="snippet-card__date">
                    <Clock :size="14" />
                    {{ formatDate(snippet.createdAt) }}
                </span>
                <CaomeiTag
                    v-if="snippet.status"
                    :tone="statusTone"
                    size="sm"
                >
                    {{ $t(`pages.admin.snippets.${snippet.status}`) }}
                </CaomeiTag>
                <span class="snippet-card__source">
                    <component :is="sourceIcon" :size="14" />
                    {{ $t(`pages.admin.snippets.source_types.${snippet.source}`) }}
                </span>
            </div>
            <div class="snippet-card__actions">
                <AppTooltip v-if="snippet.status === 'inbox'" :content="$t('pages.admin.snippets.convert_to_post')">
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        tone="neutral"
                        rounded
                        size="sm"
                        :label="$t('pages.admin.snippets.convert_to_post')"
                        @click="$emit('convert', snippet)"
                    >
                        <template #icon>
                            <FileOutput :size="16" />
                        </template>
                    </CaomeiButton>
                </AppTooltip>
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    size="sm"
                    :label="$t('common.edit')"
                    @click="$emit('edit', snippet)"
                >
                    <template #icon>
                        <Pencil :size="16" />
                    </template>
                </CaomeiButton>
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="danger"
                    rounded
                    size="sm"
                    :label="$t('common.delete')"
                    @click="$emit('delete', snippet)"
                >
                    <template #icon>
                        <Trash2 :size="16" />
                    </template>
                </CaomeiButton>
            </div>
        </div>

        <div class="snippet-card__body">
            <!-- eslint-disable vue/no-v-html -->
            <div class="snippet-card__content" v-html="renderMarkdown(snippet.content)" />

            <div v-if="snippet.media && snippet.media.length" class="snippet-card__media">
                <CaomeiImage
                    v-for="(url, index) in snippet.media"
                    :key="index"
                    :src="url"
                    preview
                    alt="media"
                    class="snippet-card__image"
                />
            </div>

            <div v-if="snippet.post" class="snippet-card__link">
                <Link :size="14" />
                <NuxtLink :to="`/admin/posts/${snippet.post.id}`" class="snippet-card__post-link">
                    {{ $t('pages.admin.snippets.converted') }}: {{ snippet.post.title || snippet.post.id }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { Snippet } from '@/types/snippet'
import { formatDate } from '@/utils/shared/date'
import { Bookmark, Clock, Code, ExternalLink, FileOutput, Info, Link, Monitor, Pencil, Smartphone, Trash2 } from '@lucide/vue'
import markdownit from 'markdown-it'

const props = defineProps<{
    snippet: Snippet
}>()

defineEmits(['edit', 'delete', 'convert'])

const md = markdownit()
const renderMarkdown = (content: string) => {
    return md.render(content || '')
}

const statusTone = computed(() => {
    switch (props.snippet.status) {
        case 'inbox': return 'warning' as const
        case 'converted': return 'success' as const
        case 'archived': return 'neutral' as const
        default: return 'primary' as const
    }
})

const sourceIcon = computed<Component>(() => {
    switch (props.snippet.source) {
        case 'web': return Monitor
        case 'api': return Code
        case 'shortcut': return Smartphone
        case 'bookmarklet': return Bookmark
        case 'pwa': return ExternalLink
        default: return Info
    }
})
</script>

<style lang="scss" scoped>
.snippet-card {
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-border-radius-md);
  padding: 1rem;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: var(--p-primary-color);
    box-shadow: var(--p-overlay-modal-shadow);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: var(--p-text-muted-color);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  &__date,
  &__source {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  &__actions {
    display: flex;
    gap: 0.25rem;
  }

  &__body {
    overflow-wrap: break-word;
  }

  &__content {
    line-height: 1.6;
    :deep(p) { margin: 0 0 0.5rem; }
    :deep(p:last-child) { margin-bottom: 0; }
  }

  &__media {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  &__image {
    width: 80px;
    height: 80px;

    :deep(img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--p-border-radius-sm);
    }
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    font-size: 0.875rem;
    padding: 0.5rem;
    background: var(--p-content-hover-background);
    border-radius: var(--p-border-radius-sm);
  }

  &__post-link {
    color: var(--p-primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
