import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useUpload, type UploadType } from '@/composables/use-upload'

export interface UseAppUploaderFieldOptions {
    /** 上传类型（决定后端存储策略与目录分段）。 */
    type?: UploadType
    /** 关联文章 ID（可选，用于内容级上传目录）。 */
    postId?: MaybeRefOrGetter<string | null | undefined>
    /** 是否禁用；与上传中状态一并阻断拖放交互。 */
    disabled?: MaybeRefOrGetter<boolean | undefined>
    /** 上传成功后的回写回调（写入 `modelValue`）。 */
    onUploaded: (url: string) => void
}

/**
 * `AppUploader`（PrimeVue 版）与 `AppUploaderV2`（caomei-ui 过渡版）共用的字段行为。
 *
 * 两版**仅模板不同**（组件来源按路由择库），文件选择 / 拖放 / 上传回写的行为完全一致；
 * 行为集中在本 composable，避免两版各自实现后漂移（例如只修好一版的「上传中阻断拖放」）。
 *
 * 职责边界：只负责字段交互与上传调用，不负责渲染；错误提示由 `useUpload` 内部统一处理。
 */
export function useAppUploaderField(options: UseAppUploaderFieldOptions) {
    const fileInput = ref<HTMLInputElement | null>(null)
    const isDragging = ref(false)

    const { uploading, uploadFile } = useUpload({
        type: options.type,
        postId: computed(() => toValue(options.postId) || null),
    })

    /** 上传中或显式禁用时，拖放交互整体阻断。 */
    const isInteractionBlocked = () => Boolean(toValue(options.disabled)) || uploading.value

    async function handleFile(file: File) {
        try {
            const url = await uploadFile(file)
            if (url) {
                options.onUploaded(url)
            }
        } catch {
            // 错误提示由 useUpload 内部统一处理
        }
    }

    function triggerFileSelect() {
        fileInput.value?.click()
    }

    function onFileChange(event: Event) {
        const files = (event.target as HTMLInputElement).files
        if (files?.[0]) {
            void handleFile(files[0])
        }

        // 重置 input，使同一文件可再次选择
        if (fileInput.value) {
            fileInput.value.value = ''
        }
    }

    function onDragOver(event: DragEvent) {
        if (isInteractionBlocked()) {
            return
        }

        if (event.dataTransfer?.types?.includes('Files')) {
            isDragging.value = true
        }
    }

    function onDragLeave() {
        isDragging.value = false
    }

    function onDrop(event: DragEvent) {
        if (isInteractionBlocked()) {
            return
        }

        isDragging.value = false
        const files = event.dataTransfer?.files
        if (files?.[0]) {
            void handleFile(files[0])
        }
    }

    return {
        fileInput,
        isDragging,
        uploading,
        triggerFileSelect,
        onFileChange,
        onDragOver,
        onDragLeave,
        onDrop,
    }
}
