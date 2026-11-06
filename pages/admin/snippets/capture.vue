<template>
    <div class="minimal-capture-page">
        <div class="capture-container">
            <header class="capture-header">
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    :label="t('common.back')"
                    @click="goBack"
                >
                    <template #icon>
                        <ArrowLeft :size="18" />
                    </template>
                </CaomeiButton>
                <h1 class="font-bold text-xl">
                    {{ t('pages.admin.snippets.capture_title') }}
                </h1>
                <div class="flex-grow" />
                <CaomeiButton
                    v-if="!isSaving && (content.trim() || pendingMedia.length)"
                    rounded
                    @click="saveSnippet"
                >
                    <template #icon>
                        <Check :size="16" />
                    </template>
                    {{ t('common.save') }}
                </CaomeiButton>
                <CaomeiProgressSpinner v-if="isSaving" class="capture-spinner" />
            </header>

            <main class="capture-main">
                <CaomeiTextarea
                    ref="textareaRef"
                    v-model="content"
                    auto-resize
                    class="capture-textarea"
                    :placeholder="placeholder"
                />

                <div v-if="pendingMedia.length" class="media-preview">
                    <div
                        v-for="(url, index) in pendingMedia"
                        :key="index"
                        class="media-item"
                    >
                        <img :src="url">
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
            </main>

            <footer class="capture-footer">
                <AppVoiceInputTrigger
                    v-model="content"
                    :target-ref="textareaRef"
                    insert-strategy="cursor"
                    :show-refine-action="true"
                    button-rounded
                    button-class="capture-voice-trigger"
                />
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    :loading="isUploading"
                    :label="t('pages.admin.snippets.upload_image')"
                    @click="triggerUpload"
                >
                    <template #icon>
                        <ImageIcon :size="18" />
                    </template>
                </CaomeiButton>
                <input
                    ref="fileInput"
                    type="file"
                    style="display: none"
                    accept="image/*"
                    multiple
                    @change="onFileChange"
                >

                <div v-if="source" class="source-info">
                    <CaomeiTag tone="neutral" rounded>
                        {{ t(`pages.admin.snippets.source_types.${source}`) }}
                    </CaomeiTag>
                </div>
            </footer>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Check, Image as ImageIcon, X } from '@lucide/vue'

const { t } = useI18n()
const route = useRoute()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const content = ref('')
const pendingMedia = ref<string[]>([])
const isSaving = ref(false)
const isUploading = ref(false)
const textareaRef = ref<{ $el?: HTMLElement } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const source = ref((route.query.source as string) || 'web')
const sourceUrl = ref((route.query.url as string) || '')
const sourceTitle = ref((route.query.title as string) || '')

const placeholder = computed(() => {
    if (sourceTitle.value) {
        return t('pages.admin.snippets.capture_placeholder_with_info', { info: sourceTitle.value })
    }
    return t('pages.admin.snippets.quick_capture_placeholder')
})

onMounted(() => {
    if (route.query.content) {
        content.value = route.query.content as string
        if (sourceUrl.value) {
            content.value += `\n\n> ${t('pages.admin.snippets.source')}: [${sourceTitle.value || sourceUrl.value}](${sourceUrl.value})`
        }
    }

    // Autofocus on mount
    setTimeout(() => {
        const root = textareaRef.value?.$el
        const textarea = root instanceof HTMLTextAreaElement ? root : root?.querySelector('textarea')
        textarea?.focus()
    }, 100)
})

const goBack = () => {
    navigateTo('/admin/snippets')
}

const triggerUpload = () => {
    fileInput.value?.click()
}

const onFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    isUploading.value = true
    try {
        const files = Array.from(input.files)
        for (const file of files) {
            const formData = new FormData()
            formData.append('file', file)
            const res: any = await $fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            })
            pendingMedia.value.push(res.data.url)
        }
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.unexpected_error' })
    } finally {
        isUploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

const removeMedia = (index: number) => {
    pendingMedia.value.splice(index, 1)
}

const saveSnippet = async () => {
    if (!content.value.trim() && !pendingMedia.value.length) return

    isSaving.value = true
    try {
        await $fetch('/api/snippets', {
            method: 'POST',
            body: {
                content: content.value,
                source: source.value,
                media: pendingMedia.value,
                metadata: {
                    url: sourceUrl.value,
                    title: sourceTitle.value,
                },
            },
        } as any)

        showSuccessToast('common.save_success', { life: 2000 })

        // Handle closure for bookmarklet window or redirection for PWA
        setTimeout(() => {
            if (window.opener || window.history.length === 1) {
                window.close()
            } else {
                navigateTo('/admin/snippets')
            }
        }, 1200)
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.save_failed' })
    } finally {
        isSaving.value = false
    }
}

definePageMeta({
    middleware: 'author',
    layout: false,
})
</script>

<style lang="scss" scoped>
.minimal-capture-page {
    height: 100vh;
    height: 100dvh;
    background-color: var(--surface-0);
    display: flex;
    flex-direction: column;
    color: var(--text-color);

    .capture-container {
        max-width: 600px;
        margin: 0 auto;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 1rem;
    }

    .capture-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--surface-200);

        .capture-spinner {
            width: 2rem;
            height: 2rem;
        }
    }

    .capture-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem 0;
        overflow-y: auto;
    }

    .capture-textarea {
        flex: 1;
        width: 100%;
        display: flex;

        :deep(.caomei-textarea__control) {
            flex: 1;
            width: 100%;
            height: 100%;
            border: none;
            resize: none !important;
            font-size: 1.25rem;
            line-height: 1.6;
            padding: 0;
            background: transparent;
            color: var(--text-color);

            &:focus {
                box-shadow: none;
                outline: none;
            }
        }
    }

    .media-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 1rem 0;

        .media-item {
            position: relative;
            width: 100px;
            height: 100px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
            }

            .remove-btn {
                position: absolute;
                top: -8px;
                right: -8px;
                background: var(--surface-0) !important;
                box-shadow: 0 2px 4px rgb(0 0 0 / 0.2);
            }
        }
    }

    .capture-footer {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-top: 0.5rem;
        padding-bottom: env(safe-area-inset-bottom, 0.5rem);
        border-top: 1px solid var(--surface-200);

        .capture-voice-trigger {
            flex-shrink: 0;
        }
    }

    .source-info {
        margin-left: auto;
    }
}

:global(.dark) .minimal-capture-page {
    .capture-header, .capture-footer {
        border-color: var(--surface-100);
    }
}
</style>
