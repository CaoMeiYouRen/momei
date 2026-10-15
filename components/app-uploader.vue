<template>
    <div
        class="app-uploader"
        :class="{'app-uploader--dragging': isDragging}"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <InputGroup>
            <InputText
                v-model="modelValue"
                :placeholder="placeholder"
                :disabled="uploading || disabled"
                :readonly="readonly"
            />
            <Button
                v-tooltip="$t('common.upload')"
                type="button"
                icon="pi pi-upload"
                severity="secondary"
                text
                :loading="uploading"
                :disabled="disabled"
                @click="triggerFileSelect"
            />
            <slot name="extra" />
        </InputGroup>
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
import { UploadType } from '@/composables/use-upload'
import { useAppUploaderField } from '@/composables/use-app-uploader-field'

const props = defineProps<{
    placeholder?: string
    accept?: string
    type?: UploadType
    postId?: string | null
    disabled?: boolean
    readonly?: boolean
}>()

const modelValue = defineModel<string | null>()

// 字段行为与 `AppUploaderV2`（caomei-ui 过渡版）共用，两版仅模板不同。
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
