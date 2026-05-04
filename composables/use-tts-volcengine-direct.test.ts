import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockToastAdd = vi.fn()
const mockUploadFile = vi.fn()
const mockFetch = vi.fn()
const mockBrowserFetch = vi.fn()

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
        }),
    }
})

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({
            add: mockToastAdd,
        }),
    }
})

vi.mock('./use-upload', () => ({
    UploadType: {
        AUDIO: 'audio',
    },
    useUpload: () => ({
        uploadFile: mockUploadFile,
    }),
}))

vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('fetch', mockBrowserFetch)
vi.stubGlobal('crypto', {
    randomUUID: () => 'uuid-1',
})

import { useTTSVolcengineDirect } from './use-tts-volcengine-direct'

function createReadableResponse(bytes: Uint8Array) {
    let done = false
    return {
        ok: true,
        status: 200,
        body: {
            getReader: () => ({
                read: vi.fn(async () => {
                    if (done) {
                        return { done: true, value: undefined }
                    }

                    done = true
                    return { done: false, value: bytes }
                }),
            }),
        },
    }
}

describe('useTTSVolcengineDirect', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses nested statusMessage when credential fetching fails', async () => {
        mockFetch.mockRejectedValueOnce({
            data: {
                statusMessage: 'credential_failed',
            },
        })

        const direct = useTTSVolcengineDirect()

        await expect(direct.generateAndUpload({
            mode: 'speech',
            text: 'hello world',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
        })).rejects.toEqual(expect.objectContaining({
            data: {
                statusMessage: 'credential_failed',
            },
        }))

        expect(direct.error.value).toBe('credential_failed')
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'credential_failed',
        }))
    })

    it('returns success even when metadata write-back fails', async () => {
        mockFetch
            .mockResolvedValueOnce({
                data: {
                    provider: 'volcengine',
                    mode: 'speech',
                    authType: 'query',
                    issuedAt: 0,
                    expiresInMs: 60000,
                    expiresAt: Date.now() + 60000,
                    endpoint: 'https://tts.example.com',
                    connectId: 'connect-1',
                    appId: 'app-1',
                    jwtToken: 'jwt',
                    authQuery: { api_access_key: 'Jwt; jwt' },
                    resourceId: 'resource-1',
                    temporaryUserId: 'temp-user',
                },
            })
            .mockRejectedValueOnce(new Error('metadata failed'))

        mockBrowserFetch.mockResolvedValueOnce(createReadableResponse(new Uint8Array([1, 2, 3, 4])))
        mockUploadFile.mockResolvedValueOnce('https://cdn.example.com/audio.mp3')

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const direct = useTTSVolcengineDirect()

        const result = await direct.generateAndUpload({
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
            postId: 'post-1',
        })

        expect(result.audioUrl).toBe('https://cdn.example.com/audio.mp3')
        expect(warnSpy).toHaveBeenCalledWith(
            '[useTTSVolcengineDirect] Metadata write-back failed (non-blocking):',
            expect.any(Error),
        )
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.tts.completed',
        }))
    })
})
