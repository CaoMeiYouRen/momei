<template>
    <div class="sticky toc top-24">
        <h3 class="dark:text-gray-100 font-bold mb-4 text-gray-900 text-lg">
            {{ $t('components.toc.title') }}
        </h3>
        <ul class="list-none m-0 p-0">
            <li
                v-for="heading in headings"
                :key="heading.id"
                :class="['mb-2', `pl-${(heading.level - 1) * 4}`]"
            >
                <a
                    :href="`#${heading.id}`"
                    class="block dark:hover:text-primary-400 dark:text-gray-400 hover:text-primary-500 text-gray-600 text-sm transition-colors truncate"
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
