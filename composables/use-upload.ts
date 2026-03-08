import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

export enum UploadType {
    IMAGE = 'image',
    AUDIO = 'audio',
    FILE = 'file',
}

export interface UseUploadOptions {
    type?: UploadType
    prefix?: string
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

export function useUpload(options: UseUploadOptions = {}) {
    const { t } = useI18n()
    const toast = useToast()
    const uploading = ref(false)

    const resolveUploadPrefix = (type: UploadType) => {
        return options.prefix || (type === UploadType.AUDIO ? 'audios/' : 'file/')
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
        } catch (error: any) {
            console.error('Upload failed', error)
            const detail = error.data?.statusMessage || error.message || t('common.upload_failed')
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail,
                life: 3000,
            })
            throw error
        } finally {
            uploading.value = false
        }
    }

    return {
        uploading,
        uploadFile,
    }
}
