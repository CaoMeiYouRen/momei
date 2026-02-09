import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
        'common.error': 'Error',
        'common.upload_failed': 'Upload failed',
    }
    return translations[key] || key
})

const mockToastAdd = vi.fn()

// Mock useI18n
vi.mock('vue-i18n', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useI18n: () => ({
        t: mockT,
    }),
}))

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', async (importOriginal) => ({
    ...await importOriginal<any>(),
    useToast: () => ({
        add: mockToastAdd,
    }),
}))

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

import { useUpload, UploadType } from './use-upload'

describe('useUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with uploading false', () => {
        const { uploading } = useUpload()

        expect(uploading.value).toBe(false)
    })

    it('should upload file successfully', async () => {
        const mockUrl = 'https://example.com/uploaded-file.jpg'
        mockFetch.mockResolvedValueOnce({
            data: [{ url: mockUrl }],
        })

        const { uploadFile, uploading } = useUpload()
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

        const resultPromise = uploadFile(file)
        expect(uploading.value).toBe(true)

        const result = await resultPromise

        expect(result).toBe(mockUrl)
        expect(uploading.value).toBe(false)
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/upload',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData),
                query: {
                    type: UploadType.IMAGE,
                    prefix: 'file/',
                },
            }),
        )
    })

    it('should use custom type and prefix', async () => {
        const mockUrl = 'https://example.com/audio.mp3'
        mockFetch.mockResolvedValueOnce({
            data: [{ url: mockUrl }],
        })

        const { uploadFile } = useUpload({
            type: UploadType.AUDIO,
            prefix: 'custom-prefix/',
        })
        const file = new File(['content'], 'audio.mp3', { type: 'audio/mpeg' })

        await uploadFile(file)

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/upload',
            expect.objectContaining({
                query: {
                    type: UploadType.AUDIO,
                    prefix: 'custom-prefix/',
                },
            }),
        )
    })

    it('should use default audio prefix for audio type', async () => {
        const mockUrl = 'https://example.com/audio.mp3'
        mockFetch.mockResolvedValueOnce({
            data: [{ url: mockUrl }],
        })

        const { uploadFile } = useUpload({
            type: UploadType.AUDIO,
        })
        const file = new File(['content'], 'audio.mp3', { type: 'audio/mpeg' })

        await uploadFile(file)

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/upload',
            expect.objectContaining({
                query: {
                    type: UploadType.AUDIO,
                    prefix: 'audios/',
                },
            }),
        )
    })

    it('should handle upload error with error message', async () => {
        const errorMessage = 'File too large'
        mockFetch.mockRejectedValueOnce({
            data: { statusMessage: errorMessage },
        })

        const { uploadFile, uploading } = useUpload()
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

        await expect(uploadFile(file)).rejects.toThrow()

        expect(uploading.value).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000,
        })
    })

    it('should handle upload error with fallback message', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const { uploadFile } = useUpload()
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

        await expect(uploadFile(file)).rejects.toThrow()

        expect(mockToastAdd).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Network error',
            life: 3000,
        })
    })

    it('should handle upload error with i18n fallback', async () => {
        mockFetch.mockRejectedValueOnce({})

        const { uploadFile } = useUpload()
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

        await expect(uploadFile(file)).rejects.toThrow()

        expect(mockToastAdd).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Upload failed',
            life: 3000,
        })
    })

    it('should throw error when no URL returned', async () => {
        mockFetch.mockResolvedValueOnce({
            data: [],
        })

        const { uploadFile } = useUpload()
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

        await expect(uploadFile(file)).rejects.toThrow('Upload failed: No URL returned')
    })

    it('should log error to console', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Mute console error in tests
        })
        mockFetch.mockRejectedValueOnce(new Error('Upload error'))

        const { uploadFile } = useUpload()
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

        await expect(uploadFile(file)).rejects.toThrow()

        expect(consoleErrorSpy).toHaveBeenCalledWith('Upload failed', expect.any(Error))

        consoleErrorSpy.mockRestore()
    })
})

