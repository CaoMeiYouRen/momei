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

export function useUpload(options: UseUploadOptions = {}) {
    const { t } = useI18n()
    const toast = useToast()
    const uploading = ref(false)

    const uploadFile = async (file: File) => {
        uploading.value = true
        try {
            const formData = new FormData()
            formData.append('file', file)

            const type = options.type || UploadType.IMAGE
            const prefix = options.prefix || (type === UploadType.AUDIO ? 'audios/' : 'file/')

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
