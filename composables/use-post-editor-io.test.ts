import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const {
    mockToastAdd,
    mockUploadFile,
    mockUseUpload,
} = vi.hoisted(() => ({
    mockToastAdd: vi.fn(),
    mockUploadFile: vi.fn(),
    mockUseUpload: vi.fn(),
}))

mockUseUpload.mockImplementation(() => ({
    uploadFile: mockUploadFile,
    uploading: ref(false),
}))

vi.mock('primevue/usetoast', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useToast: () => ({
        add: mockToastAdd,
    }),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useI18n: () => ({
        t: (key: string, params?: Record<string, string>) => {
            if (key === 'pages.admin.posts.category_not_found' && params?.name) {
                return `category:${params.name}`
            }
            return key
        },
    }),
}))

vi.mock('@/composables/use-upload', () => ({
    UploadType: {
        IMAGE: 'image',
    },
    useUpload: mockUseUpload,
}))

import { usePostEditorIO } from './use-post-editor-io'

let nextFileReaderResult: string | null = null

class MockFileReader {
    result: string | null = null
    onload: (() => void) | null = null

    readAsText(_file: File, _encoding?: string) {
        this.result = nextFileReaderResult
        queueMicrotask(() => {
            this.onload?.()
        })
    }
}

async function flushFileReader() {
    await Promise.resolve()
    await Promise.resolve()
}

function createFileList(files: File[]) {
    return {
        length: files.length,
        item: (index: number) => files[index] ?? null,
    }
}

function createEditorIoContext() {
    const post = ref({
        id: 'post-123',
        title: '',
        content: '',
        slug: '',
        summary: '',
        coverImage: '',
        categoryId: null,
        language: 'zh-CN',
        copyright: null,
        metadata: {},
    } as any)
    const selectedTags = ref<string[]>([])
    const categories = ref<{ id: string, name: string }[]>([
        { id: 'cat-1', name: 'Tech' },
        { id: 'cat-2', name: 'Life' },
    ])
    const md = ref({
        $img2Url: vi.fn(),
    })

    return {
        post,
        selectedTags,
        categories,
        md,
        io: usePostEditorIO(post, selectedTags, categories, md),
    }
}

describe('usePostEditorIO', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        nextFileReaderResult = null
        vi.stubGlobal('FileReader', MockFileReader)
    })

    it('should use shared upload composable for image uploads', async () => {
        mockUploadFile.mockResolvedValueOnce('https://assets.example.com/posts/post-123/image/test.jpg')
        const post = ref({
            id: 'post-123',
            content: '',
            metadata: {},
        } as any)
        const selectedTags = ref<string[]>([])
        const categories = ref<{ id: string, name: string }[]>([])
        const md = ref({
            $img2Url: vi.fn(),
        })

        const { imgAdd } = usePostEditorIO(post, selectedTags, categories, md)

        await imgAdd(2, new File(['content'], 'test.jpg', { type: 'image/jpeg' }))

        expect(mockUseUpload).toHaveBeenCalledWith(expect.objectContaining({
            type: 'image',
            showErrorToast: false,
            postId: expect.any(Object),
        }))
        expect(mockUploadFile).toHaveBeenCalledTimes(1)
        expect(md.value.$img2Url).toHaveBeenCalledWith(2, 'https://assets.example.com/posts/post-123/image/test.jpg')
    })

    it('shows an error toast when markdown image upload fails', async () => {
        mockUploadFile.mockRejectedValueOnce(new Error('upload failed'))
        const { io } = createEditorIoContext()

        await io.imgAdd(1, new File(['content'], 'test.jpg', { type: 'image/jpeg' }))

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.upload_failed',
        }))
    })

    it('imports markdown front matter and audio metadata from dropped files', async () => {
        nextFileReaderResult = [
            '---',
            'title: Imported Title',
            'abbrlink: imported-slug',
            'description: Imported Summary',
            'cover: https://example.com/cover.jpg',
            'license: CC BY-SA',
            'lang: en-US',
            'tags:',
            '  - Vue',
            '  - Nuxt',
            'category: Tech',
            'audio_url: https://example.com/audio.mp3',
            'audio_duration: 01:02:03',
            'medialength: "1024"',
            'mediaType: audio/mpeg',
            '---',
            'Imported content',
        ].join('\n')

        const { post, selectedTags, io } = createEditorIoContext()

        await io.onDrop({
            dataTransfer: {
                files: createFileList([
                    new File(['md'], 'post.md', { type: 'text/markdown' }),
                ]),
            },
        } as DragEvent)
        await flushFileReader()

        expect(post.value).toMatchObject({
            title: 'Imported Title',
            slug: 'imported-slug',
            summary: 'Imported Summary',
            content: 'Imported content',
            coverImage: 'https://example.com/cover.jpg',
            copyright: 'CC BY-SA',
            language: 'en-US',
            categoryId: 'cat-1',
        })
        expect(post.value.metadata).toMatchObject({
            audio: {
                url: 'https://example.com/audio.mp3',
                duration: 3723,
                size: 1024,
                mimeType: 'audio/mpeg',
            },
        })
        expect(selectedTags.value).toEqual(['Vue', 'Nuxt'])
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.import_success',
        }))
    })

    it('warns when importing an empty markdown file', async () => {
        nextFileReaderResult = ''
        const { io } = createEditorIoContext()

        await io.onDrop({
            dataTransfer: {
                files: createFileList([
                    new File([''], 'empty.md', { type: 'text/markdown' }),
                ]),
            },
        } as DragEvent)
        await flushFileReader()

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.file_empty',
        }))
    })

    it('shows info toast when imported category cannot be matched', async () => {
        nextFileReaderResult = [
            '---',
            'title: Imported Title',
            'category: Missing Category',
            'tags: SingleTag',
            '---',
            'Imported content',
        ].join('\n')

        const { post, selectedTags, categories, io } = createEditorIoContext()
        categories.value = [{ id: 'cat-2', name: 'Life' }]

        await io.onDrop({
            dataTransfer: {
                files: createFileList([
                    new File(['md'], 'post.md', { type: 'text/markdown' }),
                ]),
            },
        } as DragEvent)
        await flushFileReader()

        expect(post.value.categoryId).toBeNull()
        expect(selectedTags.value).toEqual(['SingleTag'])
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'info',
            detail: 'category:Missing Category',
        }))
    })

    it('uploads dropped images and appends markdown image syntax', async () => {
        mockUploadFile.mockResolvedValueOnce('https://assets.example.com/dropped.png')
        const { post, io } = createEditorIoContext()

        await io.onDrop({
            dataTransfer: {
                files: createFileList([
                    new File(['png'], 'dropped.png', { type: 'image/png' }),
                ]),
            },
        } as DragEvent)

        expect(post.value.content).toContain('![dropped.png](https://assets.example.com/dropped.png)')
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.image_upload_success',
        }))
    })

    it('warns for unsupported dropped file types', async () => {
        const { io } = createEditorIoContext()

        await io.onDrop({
            dataTransfer: {
                files: createFileList([
                    new File(['zip'], 'archive.zip', { type: 'application/zip' }),
                ]),
            },
        } as DragEvent)

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.unsupported_file_type',
        }))
    })

    it('tracks drag state only for file drags and clears it when leaving the drop area', () => {
        const { io } = createEditorIoContext()
        const currentTarget = {
            contains: vi.fn().mockReturnValue(false),
        } as unknown as HTMLElement

        io.onDragOver({
            dataTransfer: { types: ['Files'] },
        } as DragEvent)
        expect(io.isDragging.value).toBe(true)

        io.onDragLeave({
            currentTarget,
            relatedTarget: null,
        } as DragEvent)
        expect(io.isDragging.value).toBe(false)
    })

    it('ignores drops without any files', async () => {
        const { io } = createEditorIoContext()

        await io.onDrop({
            dataTransfer: {
                files: createFileList([]),
            },
        } as DragEvent)

        expect(mockToastAdd).not.toHaveBeenCalled()
        expect(mockUploadFile).not.toHaveBeenCalled()
    })
})
