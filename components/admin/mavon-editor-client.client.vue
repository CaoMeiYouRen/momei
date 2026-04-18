<template>
    <div
        class="admin-markdown-editor"
        :class="containerClass"
        :style="containerStyle"
        @click="handlePreviewClick"
    >
        <component
            :is="MavonEditorComponent"
            ref="editorRef"
            v-bind="childAttrs"
            class="admin-markdown-editor__instance"
            :language="resolvedLanguage"
            :toolbars="mergedToolbars"
            :toolbars-background="toolbarsBackground"
            :editor-background="editorBackground"
            :preview-background="previewBackground"
            :box-shadow="boxShadow"
            :external-link="externalLink"
            :code-style="codeStyle"
        >
            <template #left-toolbar-before>
                <slot name="left-toolbar-before" />
            </template>
            <template #left-toolbar-after>
                <slot name="left-toolbar-after" />
            </template>
            <template #right-toolbar-before>
                <slot name="right-toolbar-before" />
            </template>
            <template #right-toolbar-after>
                <slot name="right-toolbar-after" />
            </template>
        </component>
    </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import 'katex/dist/katex.min.css'
import 'mavon-editor/dist/css/index.css'
import {
    configureAdminMarkdownEditorInstance,
    createAdminMarkdownPreviewRenderer,
    createAdminMarkdownToolbars,
    patchMavonEditorComponent,
    resolveMavonEditorLanguage,
    type AdminMarkdownEditorInstance,
} from '@/utils/web/admin-markdown-editor'
import { copyRenderedMarkdownCode, initRenderedMarkdownCodeGroups } from '@/utils/web/rendered-markdown'

defineOptions({
    inheritAttrs: false,
})

const props = withDefaults(defineProps<{
    language?: string
    toolbars?: Record<string, boolean> | null
    toolbarsBackground?: string
    editorBackground?: string
    previewBackground?: string
    boxShadow?: boolean
    externalLink?: boolean | Record<string, (...args: string[]) => string | false>
    codeStyle?: string
}>(), {
    language: undefined,
    toolbars: null,
    toolbarsBackground: 'var(--momei-md-toolbar-bg)',
    editorBackground: 'var(--momei-md-editor-bg)',
    previewBackground: 'var(--momei-md-preview-bg)',
    boxShadow: false,
    externalLink: false,
    codeStyle: 'github',
})

const attrs = useAttrs()
const { locale } = useI18n()

const editorRef = ref<AdminMarkdownEditorInstance | null>(null)
let previewObservers: MutationObserver[] = []
let previewRenderer = createAdminMarkdownPreviewRenderer()

const containerClass = computed(() => attrs.class)
const containerStyle = computed(() => attrs.style)
const childAttrs = computed(() => {
    const { class: _class, style: _style, ...rest } = attrs
    return rest
})
const supportsImageUpload = computed(() => typeof childAttrs.value.onImgAdd === 'function')
const supportsSave = computed(() => typeof childAttrs.value.onSave === 'function')
const mergedToolbars = computed(() => ({
    ...createAdminMarkdownToolbars({
        enableImageUpload: supportsImageUpload.value,
        enableSave: supportsSave.value,
    }),
    ...(props.toolbars || {}),
}))
const resolvedLanguage = computed(() => props.language || resolveMavonEditorLanguage(locale.value))

const MavonEditorComponent = defineAsyncComponent(async () => {
    const mod = await import('mavon-editor') as any
    return patchMavonEditorComponent(mod.default?.mavonEditor || mod.mavonEditor || mod.default || mod)
})

function disconnectPreviewObservers() {
    previewObservers.forEach((observer) => observer.disconnect())
    previewObservers = []
}

function getPreviewContainers() {
    const rootElement = editorRef.value?.$el
    if (!rootElement) {
        return [] as HTMLElement[]
    }

    return Array.from(rootElement.querySelectorAll('.v-show-content, .v-note-read-content')) as HTMLElement[]
}

function applyPreviewEnhancements() {
    getPreviewContainers().forEach((container) => {
        initRenderedMarkdownCodeGroups(container)
    })
}

function observePreviewContainers() {
    disconnectPreviewObservers()

    if (typeof MutationObserver === 'undefined') {
        return
    }

    getPreviewContainers().forEach((container) => {
        const observer = new MutationObserver(() => {
            initRenderedMarkdownCodeGroups(container)
        })
        observer.observe(container, {
            childList: true,
            subtree: true,
        })
        previewObservers.push(observer)
    })
}

async function syncEditorPreview() {
    await nextTick()
    previewRenderer = createAdminMarkdownPreviewRenderer()
    configureAdminMarkdownEditorInstance(editorRef.value, previewRenderer)
    applyPreviewEnhancements()
    observePreviewContainers()
}

function handlePreviewClick(event: MouseEvent) {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
        return
    }

    const copyButton = target.closest('.copy-code-button')
    if (!(copyButton instanceof HTMLElement)) {
        return
    }

    event.preventDefault()
    void copyRenderedMarkdownCode(copyButton)
}

watch(() => editorRef.value, (instance) => {
    if (instance) {
        void syncEditorPreview()
    }
}, { flush: 'post' })

onMounted(() => {
    void syncEditorPreview()
})

onBeforeUnmount(() => {
    disconnectPreviewObservers()
})

defineExpose({
    $img2Url(position: number, url: string) {
        editorRef.value?.$img2Url?.(position, url)
    },
    iRender(toggleChange?: boolean) {
        editorRef.value?.iRender?.(toggleChange)
    },
    getMarkdownIt() {
        return previewRenderer
    },
    textAreaFocus() {
        editorRef.value?.textAreaFocus?.()
    },
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.admin-markdown-editor {
    --momei-md-border-color: var(--p-content-border-color);
    --momei-md-toolbar-bg: color-mix(in srgb, var(--p-surface-100) 88%, var(--p-surface-0));
    --momei-md-editor-bg: var(--p-surface-0);
    --momei-md-preview-bg: color-mix(in srgb, var(--p-surface-0) 92%, var(--p-surface-50));
    --momei-md-panel-bg: var(--p-surface-card);
    --momei-md-muted-color: var(--p-text-muted-color);
    --momei-md-active-color: var(--p-primary-500);
    --momei-md-active-surface: color-mix(in srgb, var(--p-primary-500) 12%, transparent);

    width: 100%;
    height: 100%;
    min-height: 20rem;
    color: var(--p-text-color);

    &__instance {
        width: 100%;
        height: 100%;
        min-height: inherit;
    }

    :deep(.v-note-wrapper) {
        min-height: inherit;
        border: 1px solid var(--momei-md-border-color);
        border-radius: var(--p-content-border-radius, var(--p-border-radius-md));
        overflow: hidden;
        box-shadow: none;
        background: var(--momei-md-panel-bg);
    }

    :deep(.v-note-op) {
        border-bottom: 1px solid var(--momei-md-border-color);
    }

    :deep(.v-note-op .op-icon) {
        color: var(--momei-md-muted-color);
        border-radius: $border-radius-sm;
        transition: color $transition-fast, background-color $transition-fast;
    }

    :deep(.v-note-op .op-icon:hover),
    :deep(.v-note-op .op-icon.active) {
        color: var(--momei-md-active-color);
        background: var(--momei-md-active-surface);
    }

    :deep(.v-note-panel),
    :deep(.v-note-edit),
    :deep(.v-note-show) {
        background: transparent;
    }

    :deep(.content-input-wrapper),
    :deep(.auto-textarea-wrapper),
    :deep(.auto-textarea-input),
    :deep(.v-show-content),
    :deep(.v-show-content-html),
    :deep(.v-note-read-content),
    :deep(.v-note-read-model),
    :deep(.v-note-help-content),
    :deep(.v-note-navigation-wrapper) {
        color: var(--p-text-color);
    }

    :deep(.auto-textarea-input) {
        font-family: $font-mono;
    }

    :deep(.auto-textarea-input::placeholder) {
        color: var(--p-text-muted-color);
    }

    :deep(.v-show-content),
    :deep(.v-show-content-html),
    :deep(.v-note-read-content),
    :deep(.v-note-read-model),
    :deep(.v-note-help-content),
    :deep(.v-note-navigation-wrapper) {
        background: var(--momei-md-preview-bg);
    }

    :deep(.v-show-content),
    :deep(.v-note-read-content) {
        padding: $spacing-lg;
    }

    :deep(.v-note-help-content),
    :deep(.v-note-navigation-wrapper) {
        border: 1px solid var(--momei-md-border-color);
    }

    :deep(.v-note-navigation-title) {
        border-bottom: 1px solid var(--momei-md-border-color);
    }
}
</style>
