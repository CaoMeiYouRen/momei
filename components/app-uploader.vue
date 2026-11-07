<template>
    <div
        class="app-uploader"
        :class="{'app-uploader--dragging': isDragging}"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <CaomeiInputGroup>
            <CaomeiInput
                v-model="caomeiModel"
                :placeholder="placeholder"
                :disabled="uploading || disabled"
                :readonly="readonly"
            />
            <AppTooltip :content="$t('common.upload')">
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    :label="$t('common.upload')"
                    :loading="uploading"
                    :disabled="disabled"
                    @click="triggerFileSelect"
                >
                    <template #icon>
                        <Upload :size="16" />
                    </template>
                </CaomeiButton>
            </AppTooltip>
            <slot name="extra" />
        </CaomeiInputGroup>
        <input
            ref="fileInput"
            type="file"
            class="hidden"
            :accept="accept"
            @change="onFileChange"
        >
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Upload } from '@lucide/vue'
import { useAppUploaderField } from '@/composables/use-app-uploader-field'
import type { UploadType } from '@/composables/use-upload'

/**
 * 上传字段（caomei-ui）。迁移期曾以 `AppUploaderV2` + 路由择库形式并存；B4-B 收口后 V1 消费者清零，
 * 收敛为单一实现（原 `-v2` 后缀已去除）。
 *
 * 行为（文件选择 / 拖放 / 上传回写）由 `useAppUploaderField` 提供，外壳样式见 `./app-uploader.scss`。
 * 与已删除的 V1（PrimeVue）相比：`InputGroup` / `InputText` / `Button` 换成 caomei 组件，
 * 上传按钮为 `variant="ghost"` + lucide `Upload`，并补 `:label` 可访问名。
 */
const props = defineProps<{
    placeholder?: string
    accept?: string
    type?: UploadType
    postId?: string | null
    disabled?: boolean
    readonly?: boolean
}>()

const modelValue = defineModel<string | null>()

/**
 * caomei `Input` 的 `modelValue` 类型为 `string`（缺省 `''`），而本组件的 model 允许 `null`
 * （与 V1 的 PrimeVue `InputText` 一致）。此处做一次读写归一：读取时 `null` → `''`，
 * 写回时按输入框实际值（字符串）写回——与 V1 下 PrimeVue 的清空行为等价（同样写回 `''`）。
 */
const caomeiModel = computed({
    get: () => modelValue.value ?? '',
    set: (value: string) => {
        modelValue.value = value
    },
})

const {
    fileInput,
    isDragging,
    uploading,
    triggerFileSelect,
    onFileChange,
    onDragOver,
    onDragLeave,
    onDrop,
} = useAppUploaderField({
    type: props.type,
    postId: computed(() => props.postId || null),
    disabled: computed(() => Boolean(props.disabled)),
    onUploaded: (url) => {
        modelValue.value = url
    },
})
</script>

<style lang="scss" scoped src="./app-uploader.scss"></style>
