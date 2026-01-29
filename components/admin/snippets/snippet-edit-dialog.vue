<template>
    <Dialog
        v-model:visible="visible"
        :header="t('pages.admin.snippets.edit')"
        modal
        class="edit-dialog"
        dismissable-mask
        :style="{width: '80rem', maxWidth: '95vw'}"
        :breakpoints="{'1199px': '85vw', '575px': '95vw'}"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="edit-form">
            <div class="edit-field">
                <label for="content" class="field-label">{{ t('pages.admin.snippets.content') }}</label>
                <Textarea
                    id="content"
                    v-model="form.content"
                    rows="12"
                    auto-resize
                    class="edit-textarea field-input"
                />
            </div>

            <div class="edit-field">
                <label class="field-label">{{ t('pages.admin.snippets.attachments') }}</label>
                <p class="field-desc">
                    {{ t('pages.admin.snippets.attachments_desc') }}
                </p>
                <div class="edit-media-manager">
                    <div v-if="form.media && form.media.length > 0" class="media-grid">
                        <div
                            v-for="(url, index) in form.media"
                            :key="index"
                            class="media-item"
                        >
                            <Image
                                :src="url"
                                alt="Attachment"
                                preview
                                class="media-preview"
                                image-class="media-img"
                            />
                            <Button
                                icon="pi pi-times"
                                severity="danger"
                                rounded
                                class="remove-btn"
                                @click="removeEditMedia(index)"
                            />
                        </div>
                    </div>
                    <div class="media-actions">
                        <input
                            ref="editFileInput"
                            type="file"
                            accept="image/*"
                            style="display: none"
                            multiple
                            @change="onEditFileChange"
                        >
                        <Button
                            icon="pi pi-image"
                            :label="t('pages.admin.snippets.upload_image')"
                            severity="secondary"
                            text
                            :loading="imageUploading"
                            @click="triggerEditUpload"
                        />
                    </div>
                </div>
            </div>

            <div class="edit-field">
                <label for="status" class="field-label">{{ t('pages.admin.snippets.status') }}</label>
                <Dropdown
                    id="status"
                    v-model="form.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    class="field-input"
                />
            </div>
        </div>
        <template #footer>
            <div class="edit-dialog-footer">
                <Button
                    :label="t('common.cancel')"
                    text
                    severity="secondary"
                    @click="visible = false"
                />
                <Button
                    :label="t('common.save')"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="updateSnippet"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import type { Snippet } from '@/types/snippet'
import { useUpload, UploadType } from '@/composables/use-upload'

const props = defineProps<{
    visible: boolean
    snippet: Snippet | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
}>()

const { t } = useI18n()
const toast = useToast()
const { uploadFile, uploading: imageUploading } = useUpload({ type: UploadType.IMAGE })

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const form = ref({
    content: '',
    status: '',
    media: [] as string[],
})

const saving = ref(false)
const editFileInput = ref<HTMLInputElement | null>(null)

watch(() => props.snippet, (newVal) => {
    if (newVal) {
        form.value = {
            content: newVal.content || '',
            status: newVal.status || 'inbox',
            media: newVal.media ? [...newVal.media] : [],
        }
    }
}, { immediate: true })

const statusOptions = computed(() => [
    { label: t('pages.admin.snippets.inbox'), value: 'inbox' },
    { label: t('pages.admin.snippets.converted'), value: 'converted' },
    { label: t('pages.admin.snippets.archived'), value: 'archived' },
])

const triggerEditUpload = () => {
    editFileInput.value?.click()
}

const onEditFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files?.length) return

    for (const file of Array.from(files)) {
        try {
            const url = await uploadFile(file)
            if (url) {
                form.value.media.push(url)
            }
        } catch (e) {
            // Error handled in composable
        }
    }
    target.value = ''
}

const removeEditMedia = (index: number) => {
    form.value.media.splice(index, 1)
}

const updateSnippet = async () => {
    if (!props.snippet) return
    saving.value = true
    try {
        await $fetch(`/api/admin/snippets/${props.snippet.id}`, {
            method: 'PUT',
            body: form.value,
        } as any)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })
        visible.value = false
        emit('success')
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.edit-dialog {
    .edit-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 0.5rem;

        .field-label {
            display: block;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--p-text-color);
        }

        .field-desc {
            font-size: 0.875rem;
            color: var(--p-text-muted-color);
            margin-top: -0.25rem;
            margin-bottom: 1rem;
        }

        .field-input {
            width: 100%;
        }

        .edit-textarea {
            font-family: inherit;
            line-height: 1.6;
            font-size: 1rem;
        }

        .edit-media-manager {
            .media-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 1rem;
                margin-bottom: 1rem;

                .media-item {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    border: 1px solid var(--p-content-border-color);

                    .media-preview {
                        width: 100%;
                        height: 100%;

                        :deep(.media-img) {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                    }

                    .remove-btn {
                        position: absolute;
                        top: 0.25rem;
                        right: 0.25rem;
                        width: 2rem;
                        height: 2rem;
                        z-index: 10;
                    }
                }
            }
        }
    }

    .edit-dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
}
</style>
