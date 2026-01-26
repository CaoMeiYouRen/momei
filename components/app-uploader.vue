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
            />
            <Button
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
import { ref } from 'vue'
import { UploadType, useUpload } from '@/composables/use-upload'

const props = defineProps<{
    placeholder?: string
    accept?: string
    type?: UploadType
    disabled?: boolean
}>()

const modelValue = defineModel<string | null>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const { uploading, uploadFile } = useUpload({
    type: props.type,
})

const triggerFileSelect = () => {
    fileInput.value?.click()
}

const handleFile = async (file: File) => {
    try {
        const url = await uploadFile(file)
        if (url) {
            modelValue.value = url
        }
    } catch (error) {
        // Error handled in useUpload
    }
}

const onFileChange = (e: Event) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files[0]) {
        handleFile(files[0])
    }
    // Reset input
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const onDragOver = (e: DragEvent) => {
    if (props.disabled || uploading.value) return
    if (e.dataTransfer?.types?.includes('Files')) {
        isDragging.value = true
    }
}

const onDragLeave = () => {
    isDragging.value = false
}

const onDrop = (e: DragEvent) => {
    if (props.disabled || uploading.value) return
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files && files[0]) {
        handleFile(files[0])
    }
}
</script>

<style lang="scss" scoped>
.app-uploader {
    transition: all 0.2s;
    border-radius: var(--p-border-radius-md);

    &--dragging {
        outline: 2px dashed var(--p-primary-500);
        outline-offset: 2px;
        background-color: var(--p-primary-50);
    }

    .hidden {
        display: none;
    }
}

:global(.dark) .app-uploader--dragging {
    background-color: var(--p-primary-900);
}
</style>
