import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { usePostExport } from './use-post-export'

const mockToast = {
    add: vi.fn(),
}

const mockT = vi.fn((key: string) => key)

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockToast,
}))

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: mockT,
    }),
}))

global.fetch = vi.fn()
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('usePostExport', () => {
    let mockAnchorElement: HTMLAnchorElement | null = null
    let appendChildSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('location', { origin: 'http://localhost' })
        mockAnchorElement = null
        document.body.innerHTML = ''

        // Mock appendChild to capture the anchor element
        appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
            if (node instanceof HTMLAnchorElement || (node as any).tagName === 'A') {
                mockAnchorElement = node as HTMLAnchorElement
            }
            return node
        })
    })

    afterEach(() => {
        appendChildSpy.mockRestore()
    })

    describe('exportPost', () => {
        it('should export single post successfully', async () => {
            const mockBlob = new Blob(['markdown content'], { type: 'text/markdown' })
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as Response)

            const { exportPost, exporting } = usePostExport()

            expect(exporting.value).toBe(false)

            const exportPromise = exportPost('post-123', { slug: 'test-post' })
            expect(exporting.value).toBe(true)

            await exportPromise

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/posts/post-123/export'),
            )
            expect(mockToast.add).toHaveBeenCalledWith({
                severity: 'success',
                summary: 'pages.admin.posts.export_success',
                life: 3000,
            })
            expect(exporting.value).toBe(false)
        })

        it('should use slug as filename when provided', async () => {
            const mockBlob = new Blob(['content'])
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as Response)

            const { exportPost } = usePostExport()
            await exportPost('post-123', { slug: 'my-awesome-post' })

            expect(mockAnchorElement?.download).toBe('my-awesome-post.md')
        })

        it('should use id as filename when slug not provided', async () => {
            const mockBlob = new Blob(['content'])
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as Response)

            const { exportPost } = usePostExport()
            await exportPost('post-123')

            expect(mockAnchorElement?.download).toBe('post-123.md')
        })

        it('should extract filename from Content-Disposition header', async () => {
            const mockBlob = new Blob(['content'])
            const headers = new Headers()
            headers.set('Content-Disposition', 'attachment; filename="custom-name.md"')

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers,
            } as Response)

            const { exportPost } = usePostExport()
            await exportPost('post-123')

            expect(mockAnchorElement?.download).toBe('custom-name.md')
        })

        it('should handle UTF-8 encoded filename', async () => {
            const mockBlob = new Blob(['content'])
            const headers = new Headers()
            headers.set('Content-Disposition', 'attachment; filename*=UTF-8\'\'%E4%B8%AD%E6%96%87.md')

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers,
            } as Response)

            const { exportPost } = usePostExport()
            await exportPost('post-123')

            expect(mockAnchorElement?.download).toBe('中文.md')
        })

        it('should export all translations when all option is true', async () => {
            const mockBlob = new Blob(['zip content'])
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as Response)

            const { exportPost } = usePostExport()
            await exportPost('post-123', { slug: 'test-post', all: true })

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('all=true'),
            )

            expect(mockAnchorElement?.download).toBe('momei-translations-test-post.zip')
        })

        it('should handle export failure', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: false,
            } as Response)

            const { exportPost, exporting } = usePostExport()
            await exportPost('post-123')

            expect(mockToast.add).toHaveBeenCalledWith({
                severity: 'error',
                summary: 'pages.admin.posts.export_error',
                life: 3000,
            })
            expect(exporting.value).toBe(false)
        })

        it('should clean up blob URL after download', async () => {
            const mockBlob = new Blob(['content'])
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as Response)

            const { exportPost } = usePostExport()
            await exportPost('post-123')

            expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
        })
    })

    describe('exportBatch', () => {
        it('should export multiple posts as zip', async () => {
            const mockBlob = new Blob(['zip content'])
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as Response)

            const { exportBatch } = usePostExport()
            await exportBatch(['post-1', 'post-2', 'post-3'])

            expect(fetch).toHaveBeenCalledWith('/api/posts/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ['post-1', 'post-2', 'post-3'] }),
            })

            expect(mockAnchorElement?.download).toMatch(/^momei-export-\d{4}-\d{2}-\d{2}\.zip$/)
        })

        it('should do nothing when ids array is empty', async () => {
            const { exportBatch } = usePostExport()
            await exportBatch([])

            expect(fetch).not.toHaveBeenCalled()
        })

        it('should handle batch export failure', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: false,
            } as Response)

            const { exportBatch, exporting } = usePostExport()
            await exportBatch(['post-1', 'post-2'])

            expect(mockToast.add).toHaveBeenCalledWith({
                severity: 'error',
                summary: 'pages.admin.posts.export_error',
                life: 3000,
            })
            expect(exporting.value).toBe(false)
        })

        it('should set exporting state during batch export', async () => {
            const mockBlob = new Blob(['content'])
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as Response)

            const { exportBatch, exporting } = usePostExport()

            expect(exporting.value).toBe(false)

            const exportPromise = exportBatch(['post-1'])
            expect(exporting.value).toBe(true)

            await exportPromise
            expect(exporting.value).toBe(false)
        })
    })
})
