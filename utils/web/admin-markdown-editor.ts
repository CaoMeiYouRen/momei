import { createMarkdownRenderer, sanitizeRenderedMarkdownHtml, type MarkdownRendererInstance } from '@/utils/shared/markdown'

export interface AdminMarkdownEditorInstance {
    $el?: Element
    $img2Url?: (position: number, url: string) => void
    iRender?: (toggleChange?: boolean) => void
    markdownIt?: MarkdownRendererInstance
    textAreaFocus?: () => void
}

interface MavonTextareaLike {
    focus: () => void
    removeAttribute: (qualifiedName: string) => void
    setAttribute: (qualifiedName: string, value: string) => void
}

interface MavonTextareaHost {
    editable?: boolean
    $refs?: {
        vNoteTextarea?: {
            $refs?: {
                vTextarea?: unknown
            }
            $el?: {
                querySelector?: (selector: string) => unknown
            }
        }
    }
}

interface PatchableMavonEditorComponent {
    __momeiTextareaGuardPatched?: boolean
    methods?: Record<string, ((...args: any[]) => any) | undefined>
}

function isMavonTextareaLike(value: unknown): value is MavonTextareaLike {
    return Boolean(value)
        && typeof (value as MavonTextareaLike).focus === 'function'
        && typeof (value as MavonTextareaLike).removeAttribute === 'function'
        && typeof (value as MavonTextareaLike).setAttribute === 'function'
}

function resolveMavonTextarea(host: MavonTextareaHost) {
    const directTextarea = host.$refs?.vNoteTextarea?.$refs?.vTextarea
    if (isMavonTextareaLike(directTextarea)) {
        return directTextarea
    }

    const fallbackTextarea = host.$refs?.vNoteTextarea?.$el?.querySelector?.('textarea')
    return isMavonTextareaLike(fallbackTextarea) ? fallbackTextarea : null
}

export interface AdminMarkdownToolbarOptions {
    enableImageUpload?: boolean
    enableSave?: boolean
}

export function createAdminMarkdownToolbars(options: AdminMarkdownToolbarOptions = {}) {
    const { enableImageUpload = false, enableSave = false } = options

    return {
        bold: true,
        italic: true,
        header: true,
        underline: false,
        strikethrough: true,
        mark: false,
        superscript: false,
        subscript: false,
        quote: true,
        ol: true,
        ul: true,
        link: true,
        imagelink: enableImageUpload,
        code: true,
        table: true,
        fullscreen: true,
        readmodel: true,
        htmlcode: true,
        help: true,
        undo: true,
        redo: true,
        trash: true,
        save: enableSave,
        navigation: true,
        alignleft: false,
        aligncenter: false,
        alignright: false,
        subfield: true,
        preview: true,
    }
}

export function resolveMavonEditorLanguage(locale: string | null | undefined) {
    if (!locale) {
        return 'zh-CN'
    }

    if (locale === 'zh-TW') {
        return 'zh-TW'
    }

    if (locale === 'ja-JP') {
        return 'ja'
    }

    if (locale === 'ko-KR') {
        return 'en'
    }

    if (locale.startsWith('en')) {
        return 'en'
    }

    return 'zh-CN'
}

export function createAdminMarkdownPreviewRenderer() {
    const renderer = createMarkdownRenderer({ html: true, withAnchor: true })
    const unsafeRender = renderer.render.bind(renderer)

    renderer.render = ((source: string, env?: unknown) => sanitizeRenderedMarkdownHtml(unsafeRender(source, env))) as MarkdownRendererInstance['render']
    return renderer
}

export function patchMavonEditorComponent<T extends PatchableMavonEditorComponent>(component: T) {
    if (component.__momeiTextareaGuardPatched || !component.methods) {
        return component
    }

    component.methods.editableTextarea = function editableTextarea(this: MavonTextareaHost) {
        const textarea = resolveMavonTextarea(this)
        if (!textarea) {
            return
        }

        if (this.editable) {
            textarea.removeAttribute('disabled')
            return
        }

        textarea.setAttribute('disabled', 'disabled')
    }

    component.methods.getTextareaDom = function getTextareaDom(this: MavonTextareaHost) {
        return resolveMavonTextarea(this)
    }

    component.methods.textAreaFocus = function textAreaFocus(this: MavonTextareaHost) {
        resolveMavonTextarea(this)?.focus()
    }

    component.__momeiTextareaGuardPatched = true
    return component
}

export function configureAdminMarkdownEditorInstance(
    editor: AdminMarkdownEditorInstance | null,
    renderer = createAdminMarkdownPreviewRenderer(),
) {
    if (!editor) {
        return renderer
    }

    editor.markdownIt = renderer
    editor.iRender?.(true)
    return renderer
}
