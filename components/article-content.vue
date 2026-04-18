<!-- eslint-disable vue/no-v-html -->
<template>
    <div
        ref="articleRef"
        class="markdown-body"
        @click="handleContentClick"
        v-html="renderedContent"
    />

    <!-- 预览大图 Lightbox -->
    <Dialog
        v-model:visible="lightboxVisible"
        modal
        dismissable-mask
        :show-header="false"
        content-class="lightbox-dialog-content"
    >
        <div class="lightbox-wrapper" @click="lightboxVisible = false">
            <img :src="lightboxImage" class="lightbox-image">
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { copyRenderedMarkdownCode, initRenderedMarkdownCodeGroups } from '@/utils/web/rendered-markdown'

const props = defineProps<{
    content: string
}>()

const articleRef = ref<HTMLElement | null>(null)
const lightboxVisible = ref(false)
const lightboxImage = ref('')

defineExpose({
    lightboxVisible,
    lightboxImage,
})

const { createMarkdownRenderer, sanitizeRenderedMarkdownHtml } = await import('@/utils/shared/markdown')

/**
 * 处理正文区域的点击事件（代理模式）
 */
const handleContentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    // 1. 处理图片点击（Lightbox）
    if (target.tagName === 'IMG' && target.closest('.markdown-body')) {
        lightboxImage.value = (target as HTMLImageElement).src
        lightboxVisible.value = true
        return
    }

    // 2. 处理代码复制
    const copyButton = target.closest('.copy-code-button')
    if (copyButton instanceof HTMLElement) {
        void copyRenderedMarkdownCode(copyButton)
    }
}

const md = createMarkdownRenderer({
    html: true,
    withAnchor: true,
})

const renderedContent = computed(() => sanitizeRenderedMarkdownHtml(md.render(props.content || '')))

onMounted(() => {
    initRenderedMarkdownCodeGroups(articleRef.value)
})

watch(() => props.content, () => {
    nextTick(() => {
        initRenderedMarkdownCodeGroups(articleRef.value)
    })
})
</script>

<style lang="scss">
@use "@/styles/variables" as *;
@import "katex/dist/katex.min.css";

.markdown-body {
    line-height: 1.8;
    color: var(--p-text-color);
    font-size: 1.1rem;
    font-family: $font-sans;

    h1, h2, h3, h4, h5, h6 {
        margin-top: 2em;
        margin-bottom: 0.8em;
        font-weight: 700;
        line-height: 1.3;
        color: var(--p-text-color);
    }

    h1 { font-size: 2.25em; }

    h2 {
        font-size: 1.75em;
        border-bottom: 1px solid var(--p-surface-200);
        padding-bottom: 0.3em;
    }
    h3 { font-size: 1.5em; }
    h4 { font-size: 1.25em; }

    p {
        margin-bottom: 1.5em;
        color: inherit;
    }

    ul, ol {
        padding-left: 1.5em;
        margin-bottom: 1.5em;
    }

    li {
        margin-bottom: 0.5em;
        color: inherit;
    }

    a {
        color: var(--p-primary-500);
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color $transition-fast;

        &:hover {
            border-bottom-color: var(--p-primary-500);
        }
    }

    blockquote {
        border-left: 4px solid var(--p-primary-500);
        padding: 0.5em 1em;
        margin: 1.5em 0;
        background-color: var(--p-surface-50);
        border: 1px solid var(--p-surface-100);
        border-radius: 0 $border-radius-md $border-radius-md 0;
        color: color-mix(in srgb, var(--p-text-color) 78%, var(--p-surface-0) 22%);

        p:last-child {
            margin-bottom: 0;
        }
    }

    code {
        background-color: var(--p-surface-100);
        padding: 0.2em 0.4em;
        border-radius: $border-radius-sm;
        font-family: $font-mono;
        font-size: 0.9em;
        color: var(--p-primary-600);
    }

    pre {
        padding: 0;
        border-radius: $border-radius-md;
        overflow: hidden;
        margin: 1.5em 0;
        background-color: var(--p-surface-50);
        border: 1px solid var(--p-surface-200);

        code {
            padding: 1.5em;
            display: block;
            background-color: transparent;
            color: inherit;
            font-size: 0.9em;
            overflow-x: auto;
            font-family: $font-mono;
        }
    }

    img {
        max-width: 100%;
        height: auto;
        border-radius: $border-radius-md;
        margin: 2em auto;
        display: block;
        box-shadow: $shadow-md;
    }

    hr {
        border: 0;
        border-top: 1px solid var(--p-surface-200);
        margin: 3em 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5em 0;
        color: inherit;

        th, td {
            border: 1px solid var(--p-surface-200);
            padding: 0.75em;
            text-align: left;
        }

        th {
            background-color: var(--p-surface-50);
            font-weight: 600;
        }
    }

    // Dark mode adjustments
    .dark & {
        color: color-mix(in srgb, var(--p-text-color) 96%, white 4%);

        h2 { border-bottom-color: var(--p-surface-800); }

        blockquote {
            background-color: var(--p-surface-50);
            border-color: var(--p-primary-600);
            color: color-mix(in srgb, var(--p-text-color) 82%, white 18%);
        }

        code {
            background-color: $color-code-bg-dark;
            color: $color-code-text-dark;
        }

        pre {
            background-color: $color-pre-bg-dark;
            border-color: $color-pre-border-dark;
        }

        hr {
            border-top-color: var(--p-surface-800);
        }

        table {
            th, td {
                border-color: var(--p-surface-800);
            }

            th {
                background-color: var(--p-surface-100);
            }
        }
    }
}
</style>
