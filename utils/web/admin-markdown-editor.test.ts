import { describe, expect, it, vi } from 'vitest'
import {
    configureAdminMarkdownEditorInstance,
    createAdminMarkdownPreviewRenderer,
    createAdminMarkdownToolbars,
    patchMavonEditorComponent,
    resolveMavonEditorLanguage,
} from './admin-markdown-editor'

describe('admin-markdown-editor', () => {
    it('maps unsupported application locales to a supported mavon locale', () => {
        expect(resolveMavonEditorLanguage('zh-CN')).toBe('zh-CN')
        expect(resolveMavonEditorLanguage('zh-TW')).toBe('zh-TW')
        expect(resolveMavonEditorLanguage('ja-JP')).toBe('ja')
        expect(resolveMavonEditorLanguage('ko-KR')).toBe('en')
        expect(resolveMavonEditorLanguage('en-US')).toBe('en')
    })

    it('builds a toolbar matrix aligned to the shared renderer capabilities', () => {
        const toolbars = createAdminMarkdownToolbars({
            enableImageUpload: true,
            enableSave: false,
        })

        expect(toolbars.imagelink).toBe(true)
        expect(toolbars.save).toBe(false)
        expect(toolbars.underline).toBe(false)
        expect(toolbars.mark).toBe(false)
        expect(toolbars.subfield).toBe(true)
    })

    it('injects the shared preview renderer into mavon-compatible instances', () => {
        const iRender = vi.fn()
        const editor = { iRender } as NonNullable<Parameters<typeof configureAdminMarkdownEditorInstance>[0]>

        const renderer = configureAdminMarkdownEditorInstance(editor)

        expect(editor.markdownIt).toBe(renderer)
        expect(iRender).toHaveBeenCalledWith(true)
    })

    it('reuses the shared markdown renderer features for editor preview output', () => {
        const renderer = createAdminMarkdownPreviewRenderer()
        const html = renderer.render('> [!NOTE]\n> preview')

        expect(html).toContain('markdown-alert-note')
        expect(html).toContain('preview')
    })

    it('guards textarea access before mavon inner refs are fully ready', () => {
        const component = patchMavonEditorComponent({ methods: {} })
        const methods = component.methods as Record<string, ((...args: any[]) => unknown) | undefined>
        const host = {
            editable: false,
            $refs: {},
        }

        expect(() => methods.editableTextarea?.call(host)).not.toThrow()

        const wrapper = document.createElement('div')
        const textarea = document.createElement('textarea')
        const focusSpy = vi.spyOn(textarea, 'focus')
        wrapper.appendChild(textarea)

        host.$refs = {
            vNoteTextarea: {
                $el: wrapper,
            },
        }

        methods.editableTextarea?.call(host)
        expect(textarea.getAttribute('disabled')).toBe('disabled')

        host.editable = true
        methods.editableTextarea?.call(host)
        expect(textarea.hasAttribute('disabled')).toBe(false)
        expect(methods.getTextareaDom?.call(host)).toBe(textarea)

        methods.textAreaFocus?.call(host)
        expect(focusSpy).toHaveBeenCalledOnce()
    })
})
