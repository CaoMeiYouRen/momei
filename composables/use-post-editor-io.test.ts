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

describe('usePostEditorIO', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should use shared upload composable for image uploads', async () => {
        mockUploadFile.mockResolvedValueOnce('https://assets.example.com/file/test.jpg')
        const post = ref({
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

        expect(mockUseUpload).toHaveBeenCalledWith({
            type: 'image',
            showErrorToast: false,
        })
        expect(mockUploadFile).toHaveBeenCalledTimes(1)
        expect(md.value.$img2Url).toHaveBeenCalledWith(2, 'https://assets.example.com/file/test.jpg')
    })
})
