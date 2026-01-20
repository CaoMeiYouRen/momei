<!-- eslint-disable vue/no-v-html -->
<template>
    <div class="markdown-body" v-html="renderedContent" />
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import hljs from 'highlight.js'

const props = defineProps<{
    content: string
}>()

const md = new MarkdownIt({
    html: true,
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

md.use(MarkdownItAnchor, {
    slugify: (s) => s.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
    permalink: MarkdownItAnchor.permalink.headerLink(),
})

const renderedContent = computed(() => md.render(props.content || ''))
</script>

<style lang="scss">
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
        background-color: #0d1117; // GitHub Dark background

        code {
            padding: 1.5em;
            display: block;
            background-color: transparent;
            color: #c9d1d9; // GitHub Dark text color
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
    :global(.dark) & {
        h2 { border-bottom-color: var(--p-surface-700); }

        blockquote {
            background-color: var(--p-surface-800);
        }

        code {
            background-color: var(--p-surface-800);
            color: var(--p-primary-400);
        }

        pre {
            background-color: #0d1117; // Keep consistent with github-dark
            code {
                color: #c9d1d9;
            }
        }

        hr {
            border-top-color: var(--p-surface-700);
        }

        table {
            th, td {
                border-color: var(--p-surface-700);
            }

            th {
                background-color: var(--p-surface-800);
            }
        }
    }
}
</style>
