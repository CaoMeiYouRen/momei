<template>
    <div class="toc">
        <h3 v-if="!hideTitle" class="toc__title">
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

const props = withDefaults(defineProps<{
    content: string
    /** 为 true 时不自行滚动，由父级在关闭抽屉 / 解除滚动锁后处理（移动端目录抽屉）。 */
    deferScroll?: boolean
    /** 抽屉等已自带标题的场景下隐藏组件内标题，避免重复。 */
    hideTitle?: boolean
}>(), {
    deferScroll: false,
    hideTitle: false,
})

const emit = defineEmits<{
    /** 点击目录项后触发，供移动端抽屉关闭（滚动逻辑仍由本组件负责）。 */
    navigate: [id: string]
}>()

const { createMarkdownRenderer } = await import('@/utils/shared/markdown')

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
    emit('navigate', id)

    if (props.deferScroll) {
        return
    }

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
        font-size: var(--m-font-size-lg);
        font-weight: 700;
        margin-bottom: 1rem;
        color: var(--caomei-color-text);
    }

    &__list {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: calc(100vh - 12rem);
        max-height: calc(100dvh - 12rem);
        overflow-y: auto;
    }

    &__item {
        margin-bottom: 0.5rem;
    }

    &__link {
        display: block;
        font-size: var(--m-font-size-sm);
        color: var(--caomei-color-text-muted);
        transition: color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;

        &:hover {
            color: var(--caomei-color-primary);
            text-decoration: underline;
        }

        &:focus-visible {
            outline: 2px solid var(--m-primary-500);
            outline-offset: 2px;
        }

        /* 触屏：无 hover，按压态反馈并保证 44px 触控高度（保留 block 以免丢失省略号）。 */
        @media (hover: none), (pointer: coarse) {
            min-height: 44px;
            padding: 0.75rem 0;

            &:active {
                color: var(--caomei-color-primary);
                text-decoration: underline;
            }
        }
    }
}

@media (hover: none), (pointer: coarse) {
    .toc__link {
        min-height: 44px;
        display: flex;
        align-items: center;
    }
}
</style>
