<!-- eslint-disable vue/no-v-html -->
<template>
    <div
        class="momei-markdown-editor v-note-wrapper"
        :class="[
            attrs.class,
            {
                'momei-markdown-editor--fullscreen': isFullscreen,
                'momei-markdown-editor--single': !props.subfield
            }
        ]"
        :style="attrs.style"
    >
        <div class="v-note-op">
            <div class="v-note-op__group">
                <button
                    v-for="action in toolbarActions"
                    :key="action.key"
                    type="button"
                    class="v-note-op__button"
                    :title="action.title"
                    :aria-label="action.title"
                    @click="action.run"
                >
                    <i :class="action.icon" />
                </button>
            </div>

            <div class="v-note-op__group v-note-op__group--right">
                <button
                    type="button"
                    class="v-note-op__button"
                    :title="modeTitle"
                    :aria-label="modeTitle"
                    @click="toggleMode"
                >
                    <i :class="modeIcon" />
                </button>
                <button
                    type="button"
                    class="v-note-op__button"
                    :title="fullscreenTitle"
                    :aria-label="fullscreenTitle"
                    @click="toggleFullscreen"
                >
                    <i :class="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" />
                </button>
            </div>
        </div>

        <div class="v-note-panel">
            <div v-if="showEditor" class="v-note-edit">
                <textarea
                    :id="textareaId"
                    ref="textareaRef"
                    class="v-note-textarea"
                    :placeholder="props.placeholder"
                    :disabled="props.editable === false"
                    :value="content"
                    @input="handleInput"
                />
            </div>

            <div v-if="showPreview" class="v-note-show">
                <div class="markdown-body v-show-content" v-html="renderedContent" />
            </div>
        </div>

        <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            hidden
            @change="handleImageSelection"
        >
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch } from 'vue'
import { createMarkdownRenderer } from '@/utils/shared/markdown'

defineOptions({
    inheritAttrs: false,
})

type EditorMode = 'edit' | 'preview' | 'split'

interface ToolbarState {
    [key: string]: boolean | undefined
}

const props = withDefaults(defineProps<{
    modelValue: string
    placeholder?: string
    subfield?: boolean
    editable?: boolean
    toolbars?: ToolbarState
}>(), {
    placeholder: '',
    subfield: true,
    editable: true,
    toolbars: () => ({}),
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'img-add': [position: number, file: File]
}>()

const { t } = useI18n()
const attrs = useAttrs()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const isFullscreen = ref(false)
const imageToken = ref(0)
const content = ref(props.modelValue || '')
const mode = ref<EditorMode>(props.subfield ? 'split' : 'edit')

const markdown = createMarkdownRenderer({
    html: true,
    withAnchor: true,
})

const textareaId = computed(() => {
    return typeof attrs.id === 'string' ? attrs.id : undefined
})

const showEditor = computed(() => mode.value === 'edit' || mode.value === 'split')
const showPreview = computed(() => mode.value === 'preview' || mode.value === 'split')

const renderedContent = computed(() => markdown.render(content.value || ''))
const modeIcon = computed(() => mode.value === 'preview' ? 'pi pi-pencil' : 'pi pi-eye')
const modeTitle = computed(() => mode.value === 'preview' ? t('common.edit') : t('common.preview'))
const fullscreenTitle = computed(() => isFullscreen.value ? t('common.cancel') : t('common.preview'))

watch(() => props.modelValue, (value) => {
    if (value !== content.value) {
        content.value = value || ''
    }
})

watch(() => props.subfield, (value) => {
    mode.value = value ? 'split' : 'edit'
})

const handleInput = (event: Event) => {
    const nextValue = (event.target as HTMLTextAreaElement).value
    content.value = nextValue
    emit('update:modelValue', nextValue)
}

const updateContent = (nextValue: string, selectionStart?: number, selectionEnd?: number) => {
    content.value = nextValue
    emit('update:modelValue', nextValue)

    void nextTick(() => {
        if (!textareaRef.value) {
            return
        }

        textareaRef.value.focus()

        if (selectionStart !== undefined && selectionEnd !== undefined) {
            textareaRef.value.setSelectionRange(selectionStart, selectionEnd)
        }
    })
}

const wrapSelection = (prefix: string, suffix = prefix) => {
    if (!textareaRef.value) {
        return
    }

    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.value.slice(start, end)
    const replacement = `${prefix}${selectedText}${suffix}`
    const nextValue = `${content.value.slice(0, start)}${replacement}${content.value.slice(end)}`
    const cursorStart = start + prefix.length
    const cursorEnd = cursorStart + selectedText.length

    updateContent(nextValue, cursorStart, cursorEnd)
}

const prefixLines = (prefix: string) => {
    if (!textareaRef.value) {
        return
    }

    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.value.slice(start, end)
    const source = selectedText || ''
    const replacement = source
        ? source.split('\n').map((line) => `${prefix}${line}`).join('\n')
        : `${prefix}`
    const nextValue = `${content.value.slice(0, start)}${replacement}${content.value.slice(end)}`
    const cursor = start + replacement.length

    updateContent(nextValue, cursor, cursor)
}

const insertBlock = (block: string) => {
    if (!textareaRef.value) {
        return
    }

    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextValue = `${content.value.slice(0, start)}${block}${content.value.slice(end)}`
    const cursor = start + block.length

    updateContent(nextValue, cursor, cursor)
}

const insertLink = () => {
    if (!import.meta.client || !textareaRef.value) {
        return
    }

    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.value.slice(start, end) || 'link'
    const url = window.prompt('URL', 'https://')

    if (!url) {
        return
    }

    const replacement = `[${selectedText}](${url})`
    const nextValue = `${content.value.slice(0, start)}${replacement}${content.value.slice(end)}`
    updateContent(nextValue, start + 1, start + 1 + selectedText.length)
}

const openImagePicker = () => {
    imageInputRef.value?.click()
}

const handleImageSelection = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file || !textareaRef.value) {
        return
    }

    imageToken.value += 1
    const token = imageToken.value
    const alt = file.name.replace(/\.[^.]+$/u, '') || 'image'
    const markdownText = `![${alt}](${token})`
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextValue = `${content.value.slice(0, start)}${markdownText}${content.value.slice(end)}`

    updateContent(nextValue, start + markdownText.length, start + markdownText.length)
    emit('img-add', token, file)
    input.value = ''
}

const toggleMode = () => {
    if (props.subfield) {
        mode.value = mode.value === 'split' ? 'preview' : 'split'
        return
    }

    mode.value = mode.value === 'edit' ? 'preview' : 'edit'
}

const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
}

const isToolbarEnabled = (key: string) => props.toolbars?.[key] !== false

const toolbarActions = computed(() => [
    isToolbarEnabled('bold')
        ? { key: 'bold', icon: 'pi pi-bold', title: 'Bold', run: () => wrapSelection('**') }
        : null,
    isToolbarEnabled('italic')
        ? { key: 'italic', icon: 'pi pi-slash', title: 'Italic', run: () => wrapSelection('*') }
        : null,
    isToolbarEnabled('header')
        ? { key: 'header', icon: 'pi pi-heading', title: 'Heading', run: () => prefixLines('## ') }
        : null,
    isToolbarEnabled('quote')
        ? { key: 'quote', icon: 'pi pi-comment', title: 'Quote', run: () => prefixLines('> ') }
        : null,
    isToolbarEnabled('ol')
        ? { key: 'ol', icon: 'pi pi-list', title: 'Ordered List', run: () => prefixLines('1. ') }
        : null,
    isToolbarEnabled('ul')
        ? { key: 'ul', icon: 'pi pi-bars', title: 'Bullet List', run: () => prefixLines('- ') }
        : null,
    isToolbarEnabled('link')
        ? { key: 'link', icon: 'pi pi-link', title: 'Link', run: insertLink }
        : null,
    isToolbarEnabled('image')
        ? { key: 'image', icon: 'pi pi-image', title: 'Image', run: openImagePicker }
        : null,
    isToolbarEnabled('code')
        ? { key: 'code', icon: 'pi pi-code', title: 'Code Block', run: () => wrapSelection('\n```\n', '\n```\n') }
        : null,
    isToolbarEnabled('hr')
        ? { key: 'hr', icon: 'pi pi-minus', title: 'Divider', run: () => insertBlock('\n\n---\n\n') }
        : null,
].filter((action): action is {
    key: string
    icon: string
    title: string
    run: () => void
} => Boolean(action)))

const $img2Url = (position: number, url: string) => {
    const pattern = new RegExp(`(!\\[[^\\]]*\\]\\()\\s*${position}\\s*(\\))`, 'g')
    updateContent(content.value.replace(pattern, `$1${url}$2`))
}

defineExpose({
    $img2Url,
    focus: () => textareaRef.value?.focus(),
})
</script>

<style scoped lang="scss">
.momei-markdown-editor {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 24rem;
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: var(--p-content-border-radius);
    overflow: hidden;

    &--fullscreen {
        position: fixed;
        inset: 1rem;
        z-index: 1200;
        min-height: 0;
        box-shadow: 0 24px 64px rgb(0 0 0 / 0.24);
    }

    &--single {
        .v-note-panel {
            grid-template-columns: 1fr;
        }
    }
}

.v-note-op {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--p-surface-border);
    background: color-mix(in srgb, var(--p-surface-card) 92%, var(--p-primary-color) 8%);

    &__group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
    }

    &__group--right {
        justify-content: flex-end;
    }

    &__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border: 1px solid transparent;
        border-radius: 0.625rem;
        background: transparent;
        color: var(--p-text-muted-color);
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;

        &:hover {
            background: var(--p-surface-hover);
            color: var(--p-text-color);
            border-color: var(--p-surface-border);
        }
    }
}

.v-note-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-height: 0;
    flex: 1;

    @media (width <= 960px) {
        grid-template-columns: 1fr;
    }
}

.v-note-edit,
.v-note-show {
    min-height: 20rem;
    background: var(--p-surface-card);
}

.v-note-edit {
    border-right: 1px solid var(--p-surface-border);

    @media (width <= 960px) {
        border-right: 0;
        border-bottom: 1px solid var(--p-surface-border);
    }
}

.v-note-textarea {
    display: block;
    width: 100%;
    min-height: 20rem;
    height: 100%;
    padding: 1rem 1.125rem;
    border: 0;
    resize: vertical;
    background: var(--p-surface-card);
    color: var(--p-text-color);
    font: inherit;
    line-height: 1.75;
    box-sizing: border-box;

    &:focus {
        outline: none;
    }
}

.v-note-show {
    overflow: auto;
}

.v-show-content {
    padding: 1rem 1.125rem;
    min-height: 100%;
    background: color-mix(in srgb, var(--p-surface-card) 94%, var(--p-surface-ground) 6%);
}

:deep(.markdown-body) {
    font-size: 1rem;
}

:deep(.markdown-body pre) {
    margin-top: 0;
}

:deep(.markdown-body img) {
    max-width: 100%;
}
</style>
