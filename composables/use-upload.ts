import { computed, ref, unref, type MaybeRefOrGetter } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

export enum UploadType {
    IMAGE = 'image',
    AUDIO = 'audio',
    FILE = 'file',
}

export interface UseUploadOptions {
    type?: UploadType
    prefix?: MaybeRefOrGetter<string | null | undefined>
    postId?: MaybeRefOrGetter<string | null | undefined>
    showErrorToast?: boolean
}

interface DirectUploadProxyStrategy {
    strategy: 'proxy'
}

interface DirectUploadPresignStrategy {
    strategy: 'put-presign'
    method: 'PUT'
    url: string
    headers: Record<string, string>
    publicUrl: string
}

type DirectUploadStrategy = DirectUploadProxyStrategy | DirectUploadPresignStrategy

function resolveUploadErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) {
        return error.message
    }

    if (typeof error === 'object' && error !== null) {
        const uploadError = error as {
            data?: {
                statusMessage?: unknown
            }
            message?: unknown
        }

        if (typeof uploadError.data?.statusMessage === 'string' && uploadError.data.statusMessage) {
            return uploadError.data.statusMessage
        }

        if (typeof uploadError.message === 'string' && uploadError.message) {
            return uploadError.message
        }
    }

    return fallback
}

export function useUpload(options: UseUploadOptions = {}) {
    const { t } = useI18n()
    const toast = useToast()
    const uploading = ref(false)
    const typeSegments: Record<UploadType, string> = {
        [UploadType.IMAGE]: 'image',
        [UploadType.AUDIO]: 'audio',
        [UploadType.FILE]: 'file',
    }

    const resolvedPostId = computed(() => {
        const postId = options.postId ? unref(options.postId) : null
        return typeof postId === 'string' && postId.trim() ? postId.trim() : null
    })

    const resolvedPrefix = computed(() => {
        const prefix = options.prefix ? unref(options.prefix) : null
        return typeof prefix === 'string' && prefix.trim() ? prefix.trim() : null
    })

    const resolveUploadPrefix = (type: UploadType) => {
        if (resolvedPrefix.value) {
            return resolvedPrefix.value
        }

        const typeSegment = typeSegments[type] || typeSegments[UploadType.FILE]
        return resolvedPostId.value ? `posts/${resolvedPostId.value}/${typeSegment}/` : `${typeSegment}/`
    }

    const requestDirectUpload = async (file: File, type: UploadType, prefix: string) => {
        const { data } = await $fetch<{
            code: number
            data: DirectUploadStrategy
        }>('/api/upload/direct-auth', {
            method: 'POST',
            body: {
                filename: file.name,
                contentType: file.type || 'application/octet-stream',
                size: file.size,
                type,
                prefix,
            },
        })

        return data
    }

    const uploadThroughProxy = async (file: File, type: UploadType, prefix: string) => {
        const formData = new FormData()
        formData.append('file', file)

        const { data } = await $fetch<{
            code: number
            data: { url: string }[]
        }>('/api/upload', {
            method: 'POST',
            body: formData,
            query: {
                type,
                prefix,
            },
        })

        if (data?.[0]?.url) {
            return data[0].url
        }

        throw new Error('Upload failed: No URL returned')
    }

    const uploadFile = async (file: File) => {
        uploading.value = true
        try {
            const type = options.type || UploadType.IMAGE
            const prefix = resolveUploadPrefix(type)
            const directUpload = await requestDirectUpload(file, type, prefix)

            if (directUpload?.strategy === 'put-presign') {
                const response = await fetch(directUpload.url, {
                    method: directUpload.method,
                    headers: directUpload.headers,
                    body: file,
                })

                if (!response.ok) {
                    throw new Error(`Upload failed with status ${response.status}`)
                }

                return directUpload.publicUrl
            }

            return await uploadThroughProxy(file, type, prefix)
        } catch (caughtError: unknown) {
            console.error('Upload failed', caughtError)
            if (options.showErrorToast !== false) {
                const detail = resolveUploadErrorMessage(caughtError, t('common.upload_failed'))
                toast.add({
                    severity: 'error',
                    summary: t('common.error'),
                    detail,
                    life: 3000,
                })
            }
            throw caughtError
        } finally {
            uploading.value = false
        }
    }

    return {
        uploading,
        uploadFile,
    }
}
