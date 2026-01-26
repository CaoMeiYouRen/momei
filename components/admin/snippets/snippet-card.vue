<template>
    <div class="snippet-card" :class="`snippet-card--${snippet.status}`">
        <div class="snippet-card__header">
            <div class="snippet-card__meta">
                <span class="snippet-card__date">
                    <i class="pi pi-clock" />
                    {{ formatDate(snippet.createdAt) }}
                </span>
                <Tag
                    v-if="snippet.status"
                    :value="$t(`pages.admin.snippets.${snippet.status}`)"
                    :severity="statusSeverity"
                    size="small"
                />
                <span class="snippet-card__source">
                    <i :class="sourceIcon" />
                    {{ $t(`pages.admin.snippets.source_types.${snippet.source}`) }}
                </span>
            </div>
            <div class="snippet-card__actions">
                <Button
                    v-if="snippet.status === 'inbox'"
                    v-tooltip.top="$t('pages.admin.snippets.convert_to_post')"
                    icon="pi pi-file-export"
                    rounded
                    text
                    size="small"
                    @click="$emit('convert', snippet)"
                />
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    size="small"
                    @click="$emit('edit', snippet)"
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    rounded
                    text
                    size="small"
                    @click="$emit('delete', snippet)"
                />
            </div>
        </div>

        <div class="snippet-card__body">
            <div class="snippet-card__content" v-html="renderMarkdown(snippet.content)" />

            <div v-if="snippet.media && snippet.media.length" class="snippet-card__media">
                <Image
                    v-for="(url, index) in snippet.media"
                    :key="index"
                    :src="url"
                    preview
                    alt="media"
                    class="snippet-card__image"
                />
            </div>

            <div v-if="snippet.post" class="snippet-card__link">
                <i class="pi pi-link" />
                <NuxtLink :to="`/admin/posts/${snippet.post.id}`" class="snippet-card__post-link">
                    {{ $t('pages.admin.snippets.converted') }}: {{ snippet.post.title || snippet.post.id }}
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Snippet } from '@/types/snippet'
import { formatDate } from '@/utils/shared/date'
import markdownit from 'markdown-it'

const props = defineProps<{
    snippet: Snippet
}>()

defineEmits(['edit', 'delete', 'convert'])

const md = markdownit()
const renderMarkdown = (content: string) => {
    return md.render(content || '')
}

const statusSeverity = computed(() => {
    switch (props.snippet.status) {
        case 'inbox': return 'warn'
        case 'converted': return 'success'
        case 'archived': return 'secondary'
        default: return 'info'
    }
})

const sourceIcon = computed(() => {
    switch (props.snippet.source) {
        case 'web': return 'pi pi-desktop'
        case 'api': return 'pi pi-code'
        case 'shortcut': return 'pi pi-mobile'
        case 'bookmarklet': return 'pi pi-bookmark'
        case 'pwa': return 'pi pi-external-link'
        default: return 'pi pi-info-circle'
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
