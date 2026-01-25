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
import { createMarkdownRenderer } from '@/utils/shared/markdown'
const props = defineProps<{
    content: string
}>()

const articleRef = ref<HTMLElement | null>(null)
const lightboxVisible = ref(false)
const lightboxImage = ref('')

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
    if (target.classList.contains('copy-code-button')) {
        const pre = target.closest('pre')
        const code = pre?.querySelector('code')?.innerText || ''
        navigator.clipboard.writeText(code).then(() => {
            target.classList.add('copied')
            setTimeout(() => {
                target.classList.remove('copied')
            }, 2000)
        })
    }
}

const md = createMarkdownRenderer({
    html: true,
    withAnchor: true,
})

const renderedContent = computed(() => md.render(props.content || ''))

/**
 * 初始化代码组 (Code Group) 的交互逻辑
 */
const initCodeGroups = () => {
    if (!articleRef.value || import.meta.server) {
        return
    }

    const groups = articleRef.value.querySelectorAll('.code-group')
    groups.forEach((group) => {
        // 避重复初始化
        if (group.querySelector('.code-group-tabs')) {
            return
        }

        const preElements = group.querySelectorAll('pre')
        if (preElements.length === 0) {
            return
        }

        const tabsContainer = document.createElement('div')
        tabsContainer.className = 'code-group-tabs'

        const contentContainer = document.createElement('div')
        contentContainer.className = 'code-group-content'

        preElements.forEach((pre, index) => {
            const title = pre.getAttribute('data-title') || (pre.classList.contains('hljs') ? pre.className.split(' ').find((c) => c !== 'hljs' && !c.startsWith('lang-'))?.replace('language-', '') : '') || `Code ${index + 1}`

            const button = document.createElement('button')
            button.innerText = title
            if (index === 0) {
                button.className = 'active'
                pre.classList.add('active')
            }

            button.onclick = () => {
                tabsContainer.querySelectorAll('button').forEach((b) => b.classList.remove('active'))
                contentContainer.querySelectorAll('pre').forEach((p) => p.classList.remove('active'))
                button.classList.add('active')
                pre.classList.add('active')
            }

            tabsContainer.appendChild(button)
            contentContainer.appendChild(pre)
        })

        group.appendChild(tabsContainer)
        group.appendChild(contentContainer)
    })
}

onMounted(() => {
    initCodeGroups()
})

defineExpose({
    lightboxVisible,
    lightboxImage,
})

watch(() => props.content, () => {
    nextTick(() => {
        initCodeGroups()
    })
})
</script>

<style lang="scss">
@import "katex/dist/katex.min.css";

.markdown-body {
    line-height: 1.8;
    color: var(--p-text-color);
    font-size: 1.1rem;

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
    }

    ul, ol {
        padding-left: 1.5em;
        margin-bottom: 1.5em;
    }

    li {
        margin-bottom: 0.5em;
    }

    a {
        color: var(--p-primary-500);
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s;

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
        border-radius: 0 0.5em 0.5em 0;
        color: var(--p-text-muted-color);

        p:last-child {
            margin-bottom: 0;
        }
    }

    code {
        background-color: var(--p-surface-100);
        padding: 0.2em 0.4em;
        border-radius: 0.25em;
        font-family: 'Fira Code', monospace;
        font-size: 0.9em;
        color: var(--p-primary-600);
    }

    pre {
        padding: 0;
        border-radius: 0.5em;
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
            font-family: 'Fira Code', 'Cascadia Code', 'Source Code Pro', monospace;
        }
    }

    img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5em;
        margin: 2em auto;
        display: block;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
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
        h2 { border-bottom-color: var(--p-surface-800); }

        blockquote {
            background-color: var(--p-surface-50);
            border-color: var(--p-primary-600);
            color: var(--p-text-muted-color);
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
