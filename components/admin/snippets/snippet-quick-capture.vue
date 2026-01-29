<template>
    <div class="quick-capture-wrapper">
        <Card class="quick-capture-card">
            <template #content>
                <div class="quick-capture-content">
                    <div class="quick-capture-header">
                        <i class="pi pi-pencil text-primary" />
                        <span class="quick-capture-title">{{ t('pages.admin.snippets.quick_capture_title') }}</span>
                    </div>
                    <Textarea
                        v-model="newSnippet"
                        rows="2"
                        :placeholder="t('pages.admin.snippets.quick_capture_placeholder')"
                        class="quick-capture-input"
                        auto-resize
                        @keydown.ctrl.enter="saveSnippet"
                    />

                    <div v-if="pendingMedia.length" class="pending-media">
                        <div
                            v-for="(url, index) in pendingMedia"
                            :key="index"
                            class="media-item"
                        >
                            <Image
                                :src="url"
                                width="64"
                                preview
                            />
                            <Button
                                icon="pi pi-times"
                                severity="danger"
                                rounded
                                text
                                size="small"
                                class="remove-btn"
                                @click="removeMedia(index)"
                            />
                        </div>
                    </div>

                    <Divider class="quick-capture-divider" />
                    <div class="quick-capture-footer">
                        <div class="footer-left">
                            <Button
                                v-tooltip.bottom="t('pages.admin.snippets.upload_image')"
                                :loading="imageUploading"
                                icon="pi pi-image"
                                text
                                rounded
                                severity="secondary"
                                @click="triggerUpload"
                            />
                            <input
                                ref="fileInput"
                                type="file"
                                style="display: none"
                                accept="image/*"
                                multiple
                                @change="onFileChange"
                            >
                        </div>
                        <div class="footer-right">
                            <span class="shortcut-tip">Ctrl + Enter</span>
                            <Button
                                :label="t('common.save')"
                                icon="pi pi-send"
                                class="save-btn"
                                :loading="saving"
                                :disabled="!newSnippet.trim() && !pendingMedia.length"
                                @click="saveSnippet"
                            />
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { useUpload, UploadType } from '@/composables/use-upload'

const emit = defineEmits<{
    (e: 'success'): void
}>()

const { t } = useI18n()
const toast = useToast()
const { uploadFile, uploading: imageUploading } = useUpload({ type: UploadType.IMAGE })

const newSnippet = ref('')
const pendingMedia = ref<string[]>([])
const saving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const triggerUpload = () => {
    fileInput.value?.click()
}

const onFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files?.length) return

    for (const file of Array.from(files)) {
        try {
            const url = await uploadFile(file)
            if (url) {
                pendingMedia.value.push(url)
            }
        } catch (e) {
            // Error handled in composable
        }
    }
    target.value = ''
}

const removeMedia = (index: number) => {
    pendingMedia.value.splice(index, 1)
}

const saveSnippet = async () => {
    if (!newSnippet.value.trim() && !pendingMedia.value.length) return
    saving.value = true
    try {
        await $fetch('/api/snippets', {
            method: 'POST',
            body: {
                content: newSnippet.value,
                source: 'web',
                media: pendingMedia.value,
            },
        } as any)
        newSnippet.value = ''
        pendingMedia.value = []
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })
        emit('success')
    } catch (e: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: e.data?.message || t('common.save_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
// 定义统一样式的居中窄容器，确保展开折叠时宽度绝对稳定
%stable-centered-column {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;

    @media (width > 1280px) {
        width: 72rem;
    }

    @media (width <= 1280px) and (width > 1024px) {
        width: 64rem;
    }

    @media (width <= 1024px) and (width > 768px) {
        width: 48rem;
    }
}

.quick-capture-wrapper {
    @extend %stable-centered-column;

    margin-bottom: 2rem;

    .quick-capture-card {
        border-radius: 1.25rem;
        box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05);
        border: 1px solid var(--p-content-border-color);
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:focus-within {
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -6px rgb(0 0 0 / 0.04);
            transform: translateY(-2px);
            border-color: var(--p-primary-300);
        }

        .quick-capture-content {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;

            .quick-capture-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
                padding: 0 0.25rem;

                .quick-capture-title {
                    font-weight: 700;
                    font-size: 0.875rem;
                }
            }

            .quick-capture-input {
                width: 100%;
                border: none;
                background: transparent;
                padding: 0.5rem 0;
                font-size: 1.125rem;
                box-shadow: none;

                &:focus {
                    outline: none;
                }
            }

            .pending-media {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                margin: 0.5rem 0;

                .media-item {
                    position: relative;
                    width: 64px;
                    height: 64px;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    border: 1px solid var(--p-content-border-color);

                    :deep(.p-image) {
                        width: 100%;
                        height: 100%;

                        img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                    }

                    .remove-btn {
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 1.5rem;
                        height: 1.5rem;
                        padding: 0;
                        z-index: 10;
                        background: rgb(var(--p-surface-900-rgb), 0.5);
                        color: white !important;

                        &:hover {
                            background: var(--p-red-500);
                        }
                    }
                }
            }

            .quick-capture-divider {
                margin: 0.25rem 0;
            }

            .quick-capture-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;

                .footer-left {
                    display: flex;
                    gap: 0.25rem;
                }

                .footer-right {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;

                    .shortcut-tip {
                        font-size: 0.75rem;
                        color: var(--p-text-muted-color);
                    }
                }
            }
        }
    }
}
</style>
