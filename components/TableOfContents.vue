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
import MarkdownIt from 'markdown-it'

const props = defineProps<{
    content: string
}>()

interface Heading {
    id: string
    text: string
    level: number
}

const headings = computed(() => {
    if (!props.content) return []

    const md = new MarkdownIt()
    const tokens = md.parse(props.content, {})
    const result: Heading[] = []

    tokens.forEach((token, index) => {
        if (token.type === 'heading_open') {
            const level = parseInt(token.tag.slice(1))
            if (level > 1) { // Skip h1
                const inlineToken = tokens[index + 1]
                if (inlineToken && inlineToken.type === 'inline') {
                    const text = inlineToken.content
                    const id = text.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                    result.push({ id, text, level: level - 1 })
                }
            }
        }
    })

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
    position: sticky;
    top: 6rem; // top-24

    &__title {
        font-size: 1.125rem; // text-lg
        font-weight: 700;
        margin-bottom: 1rem;
        color: #111827; // text-gray-900

        :global(.dark) & {
            color: #f3f4f6; // dark:text-gray-100
        }
    }

    &__list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__item {
        margin-bottom: 0.5rem;
    }

    &__link {
        display: block;
        font-size: 0.875rem; // text-sm
        color: #4b5563; // text-gray-600
        transition: color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;

        &:hover {
            color: var(--primary-500);
        }

        :global(.dark) & {
            color: #9ca3af; // dark:text-gray-400

            &:hover {
                color: var(--primary-400);
            }
        }
    }
}
</style>
