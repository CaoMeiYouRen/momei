<template>
    <div class="toc">
        <h3 class="toc__title">
            {{ $t('components.toc.title') }}
        </h3>
        <ul class="toc__list">
            <li
                v-for="heading in headings"
                :key="heading.id"
                class="toc__item"
                :style="{paddingLeft: ((heading.level - 1) * 1) + 'rem'}"
            >
                <a
                    :href="`#${heading.id}`"
                    class="toc__link"
                    @click.prevent="scrollToHeading(heading.id)"
                >
                    {{ heading.text }}
                </a>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { sanitizeHtmlToText } from '@/utils/shared/html'
import { createMarkdownRenderer } from '@/utils/shared/markdown'

const props = defineProps<{
    content: string
}>()

interface Heading {
    id: string
    text: string
    level: number
}

const headingRenderer = createMarkdownRenderer({
    withAnchor: true,
})

function stripHeadingHtml(value: string) {
    return sanitizeHtmlToText(value)
}

const headings = computed(() => {
    if (!props.content) return []

    const renderedHtml = headingRenderer.render(props.content)
    const headingPattern = /<h([23]) id="([^"]+)"[^>]*>(.*?)<\/h\1>/gisu
    const result: Heading[] = []

    for (const match of renderedHtml.matchAll(headingPattern)) {
        const level = Number.parseInt(match[1] || '0', 10)
        const id = match[2] || ''
        const rawHtml = match[3] || ''

        if (!level || !id) {
            continue
        }

        result.push({
            id,
            text: stripHeadingHtml(rawHtml),
            level: level - 1,
        })
    }

    return result
})

const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
        const offset = 80
        const bodyRect = document.body.getBoundingClientRect().top
        const elementRect = element.getBoundingClientRect().top
        const elementPosition = elementRect - bodyRect
        const offsetPosition = elementPosition - offset

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
        })
    }
}
</script>

<style lang="scss" scoped>
.toc {
    &__title {
        font-size: 1.125rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: var(--p-text-color);
    }

    &__list {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: calc(100vh - 12rem);
        overflow-y: auto;
    }

    &__item {
        margin-bottom: 0.5rem;
    }

    &__link {
        display: block;
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        transition: color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;

        &:hover {
            color: var(--p-primary-color);
            text-decoration: underline;
        }
    }
}
</style>
