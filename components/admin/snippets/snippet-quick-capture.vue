<template>
    <div class="quick-capture-wrapper">
        <CaomeiCard class="quick-capture-card">
            <div class="quick-capture-content">
                <div class="quick-capture-header">
                    <Pencil :size="16" class="text-primary" />
                    <span class="quick-capture-title">{{ t('pages.admin.snippets.quick_capture_title') }}</span>
                </div>
                <CaomeiTextarea
                    ref="contentInputRef"
                    v-model="newSnippet"
                    :rows="2"
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
                        <CaomeiImage
                            :src="url"
                            preview
                            alt=""
                        />
                        <CaomeiButton
                            icon-only
                            variant="ghost"
                            tone="danger"
                            rounded
                            size="sm"
                            class="remove-btn"
                            :label="t('common.delete')"
                            @click="removeMedia(index)"
                        >
                            <template #icon>
                                <X :size="14" />
                            </template>
                        </CaomeiButton>
                    </div>
                </div>

                <CaomeiDivider class="quick-capture-divider" />
                <div class="quick-capture-footer">
                    <div class="footer-left">
                        <AppVoiceInputTrigger
                            v-model="newSnippet"
                            :target-ref="contentInputRef"
                            insert-strategy="cursor"
                            :show-refine-action="true"
                            button-rounded
                            button-class="quick-capture-voice-btn"
                        />
                        <AppTooltip :content="t('pages.admin.snippets.upload_image')" side="bottom">
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="neutral"
                                rounded
                                :loading="imageUploading"
                                :label="t('pages.admin.snippets.upload_image')"
                                @click="triggerUpload"
                            >
                                <template #icon>
                                    <ImageIcon :size="16" />
                                </template>
                            </CaomeiButton>
                        </AppTooltip>
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
                        <CaomeiButton
                            class="save-btn"
                            :loading="saving"
                            :disabled="!newSnippet.trim() && !pendingMedia.length"
                            @click="saveSnippet"
                        >
                            <template #icon>
                                <Send :size="16" />
                            </template>
                            {{ t('common.save') }}
                        </CaomeiButton>
                    </div>
                </div>
            </div>
        </CaomeiCard>
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { Image as ImageIcon, Pencil, Send, X } from '@lucide/vue'
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
const contentInputRef = ref<{ $el?: HTMLElement } | null>(null)

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
        toast.show({ tone: 'success', title: t('common.success'), description: t('common.save_success'), duration: 3000 })
        emit('success')
    } catch (e: any) {
        toast.show({ tone: 'danger', title: t('common.error'), description: e.data?.message || t('common.save_failed'), duration: 3000 })
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
        border: 1px solid var(--caomei-color-border);
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:focus-within {
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -6px rgb(0 0 0 / 0.04);
            transform: translateY(-2px);
            border-color: var(--m-primary-300);
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
                    font-size: var(--m-font-size-sm);
                }
            }

            .quick-capture-input {
                width: 100%;

                :deep(.caomei-textarea__control) {
                    border: none;
                    background: transparent;
                    padding: 0.5rem 0;
                    font-size: var(--m-font-size-lg);
                    box-shadow: none;

                    &:focus {
                        outline: none;
                    }
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
                    border: 1px solid var(--caomei-color-border);

                    :deep(.caomei-image) {
                        width: 100%;
                        height: 100%;
                        display: block;
                    }

                    :deep(img) {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .remove-btn {
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 1.5rem;
                        height: 1.5rem;
                        padding: 0;
                        z-index: 10;
                        color: white !important;

                        &:hover {
                            background: var(--m-red-500);
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
                        font-size: var(--m-font-size-xs);
                        color: var(--caomei-color-text-muted);
                    }
                }
            }
        }
    }
}
</style>
