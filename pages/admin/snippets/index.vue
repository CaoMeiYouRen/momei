<template>
    <div class="admin-snippets-page">
        <AdminPageHeader :title="$t('pages.admin.snippets.title')">
            <template #actions>
                <div class="header-actions">
                    <transition name="fade">
                        <span v-if="selectedSnippetIds.length" class="selected-count">
                            {{ $t('pages.admin.snippets.selected_count', {count: selectedSnippetIds.length}) }}
                        </span>
                    </transition>
                    <Button
                        v-tooltip.bottom="$t('pages.admin.snippets.aggregate_hint')"
                        :label="$t('pages.admin.snippets.aggregate')"
                        icon="pi pi-sparkles"
                        severity="help"
                        :disabled="!selectedSnippetIds.length"
                        @click="showAggregateDialog = true"
                    />
                </div>
            </template>
        </AdminPageHeader>

        <div class="quick-capture-wrapper">
            <Card class="quick-capture-card">
                <template #content>
                    <div class="quick-capture-content">
                        <div class="quick-capture-header">
                            <i class="pi pi-pencil text-primary" />
                            <span class="quick-capture-title">{{ $t('pages.admin.snippets.quick_capture_title') }}</span>
                        </div>
                        <Textarea
                            v-model="newSnippet"
                            rows="2"
                            :placeholder="$t('pages.admin.snippets.quick_capture_placeholder')"
                            class="quick-capture-input"
                            auto-resize
                            @keydown.ctrl.enter="saveSnippet"
                        />
                        <Divider class="quick-capture-divider" />
                        <div class="quick-capture-footer">
                            <div class="footer-left">
                                <Button
                                    v-tooltip.bottom="$t('pages.admin.snippets.upload_image')"
                                    icon="pi pi-image"
                                    text
                                    rounded
                                    severity="secondary"
                                    @click="toast.add({severity: 'info', summary: 'Info', detail: '图片上传功能集成中', life: 2000})"
                                />
                                <Button
                                    v-tooltip.bottom="$t('pages.admin.snippets.attach_file')"
                                    icon="pi pi-paperclip"
                                    text
                                    rounded
                                    severity="secondary"
                                />
                            </div>
                            <div class="footer-right">
                                <span class="shortcut-tip">Ctrl + Enter</span>
                                <Button
                                    :label="$t('common.save')"
                                    icon="pi pi-send"
                                    class="save-btn"
                                    :loading="saving"
                                    :disabled="!newSnippet.trim()"
                                    @click="saveSnippet"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div class="snippets-container">
            <div v-if="loading && !items.length" class="loading-state">
                <i class="pi pi-spin pi-spinner" />
                <p class="loading-text">
                    {{ $t('common.loading') }}
                </p>
            </div>

            <div v-else-if="!items.length" class="empty-state">
                <i class="empty-icon pi pi-inbox" />
                <p class="empty-main-text">
                    {{ $t('pages.admin.snippets.empty') }}
                </p>
                <p class="empty-sub-text">
                    {{ $t('pages.admin.snippets.empty_hint') }}
                </p>
            </div>

            <template v-else>
                <transition-group
                    name="snippet-list"
                    tag="div"
                    class="snippets-grid"
                >
                    <div
                        v-for="item in items"
                        :key="item.id"
                        class="snippet-item-wrapper"
                    >
                        <div class="checkbox-wrapper">
                            <Checkbox
                                v-model="selectedSnippetIds"
                                :value="item.id"
                            />
                        </div>
                        <SnippetCard
                            :snippet="item"
                            class="snippet-card-item"
                            @edit="editSnippet"
                            @delete="confirmDelete"
                            @convert="convertSnippet"
                        />
                    </div>
                </transition-group>

                <div class="pagination-wrapper">
                    <Paginator
                        v-model:first="paginatorFirst"
                        :rows="pagination.limit"
                        :total-records="pagination.total"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                        class="paginator-custom"
                        @page="onPageChange"
                    />
                </div>
            </template>
        </div>

        <!-- Aggregate Dialog -->
        <Dialog
            v-model:visible="showAggregateDialog"
            :header="$t('pages.admin.snippets.aggregate')"
            modal
            class="aggregate-dialog"
            dismissable-mask
        >
            <div v-if="aggregating" class="aggregating-state">
                <ProgressSpinner stroke-width="3" class="spinner" />
                <p class="aggregating-text">
                    AI {{ $t('pages.admin.snippets.ai_thinking') }}
                </p>
            </div>
            <div v-else-if="scaffold" class="scaffold-preview-container">
                <div class="scaffold-header">
                    <h3 class="scaffold-title">
                        <i class="pi pi-sparkles" />
                        {{ $t('pages.admin.snippets.ai_scaffold') }}
                    </h3>
                    <Button
                        icon="pi pi-copy"
                        text
                        size="small"
                        :label="$t('common.copy')"
                        @click="copyScaffold"
                    />
                </div>
                <div class="dark:prose-invert prose scaffold-content-box">
                    <!-- eslint-disable vue/no-v-html -->
                    <div v-html="renderMarkdown(scaffold)" />
                </div>
                <div class="dialog-actions-footer">
                    <Button
                        :label="$t('common.close')"
                        text
                        severity="secondary"
                        @click="showAggregateDialog = false"
                    />
                    <Button
                        :label="$t('pages.admin.snippets.convert_to_post')"
                        icon="pi pi-file-export"
                        severity="primary"
                        @click="convertToPostFromScaffold"
                    />
                </div>
            </div>
            <div v-else class="aggregate-confirm">
                <div class="info-alert">
                    <i class="pi pi-info-circle" />
                    <div class="alert-content">
                        <p class="alert-title">
                            {{ $t('pages.admin.snippets.aggregate_confirm_title') }}
                        </p>
                        <p class="alert-desc">
                            {{ $t('pages.admin.snippets.aggregate_hint_detailed', {count: selectedSnippetIds.length}) }}
                        </p>
                    </div>
                </div>
                <div class="dialog-actions">
                    <Button
                        :label="$t('common.cancel')"
                        text
                        severity="secondary"
                        @click="showAggregateDialog = false"
                    />
                    <Button
                        :label="$t('common.confirm')"
                        icon="pi pi-check"
                        severity="primary"
                        @click="performAggregate"
                    />
                </div>
            </div>
        </Dialog>

        <ConfirmDeleteDialog
            v-model:visible="deleteDialogVisible"
            :title="$t('pages.admin.snippets.confirm_delete')"
            @confirm="deleteSnippet"
        />
    </div>
</template>

<script setup lang="ts">
import { useAdminList } from '@/composables/use-admin-list'
import SnippetCard from '@/components/admin/snippets/snippet-card.vue'
import type { Snippet } from '@/types/snippet'
import markdownit from 'markdown-it'

const { t } = useI18n()
const toast = useToast()
const md = markdownit()

const { items, pagination, loading, refresh, onPage } = useAdminList<Snippet>({
    url: '/api/admin/snippets',
    initialLimit: 12,
})

const newSnippet = ref('')
const saving = ref(false)

const saveSnippet = async () => {
    if (!newSnippet.value.trim()) return
    saving.value = true
    try {
        await $fetch('/api/snippets', {
            method: 'POST',
            body: { content: newSnippet.value, source: 'web' },
        } as any)
        newSnippet.value = ''
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })
        refresh()
    } catch (e: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: e.data?.message || t('common.save_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}

const selectedSnippetIds = ref<string[]>([])

const showAggregateDialog = ref(false)
const aggregating = ref(false)
const scaffold = ref('')

const performAggregate = async () => {
    if (selectedSnippetIds.value.length < 2) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.snippets.aggregate_hint'), life: 3000 })
        return
    }
    aggregating.value = true
    try {
        const res: any = await $fetch('/api/admin/snippets/aggregate', {
            method: 'POST',
            body: { ids: selectedSnippetIds.value },
        } as any)
        scaffold.value = res.data.scaffold
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    } finally {
        aggregating.value = false
    }
}

const convertSnippet = async (snippet: Snippet) => {
    try {
        const res: any = await $fetch(`/api/admin/snippets/${snippet.id}/convert`, { method: 'POST' } as any)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.snippets.convert_success'), life: 3000 })
        navigateTo(`/admin/posts/${res.data.post.id}`)
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    }
}

const convertToPostFromScaffold = () => {
    // TODO: Add actual conversion to post
    toast.add({ severity: 'info', summary: 'Tip', detail: '请手动复制大纲到编辑器开始创作。', life: 3000 })
}

const copyScaffold = async () => {
    if (!scaffold.value) return
    try {
        await navigator.clipboard.writeText(scaffold.value)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.copy_success'), life: 2000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.copy_failed'), life: 2000 })
    }
}

const deleteDialogVisible = ref(false)
const snippetToDelete = ref<Snippet | null>(null)

const confirmDelete = (snippet: Snippet) => {
    snippetToDelete.value = snippet
    deleteDialogVisible.value = true
}

const deleteSnippet = async () => {
    if (!snippetToDelete.value) return
    try {
        await $fetch(`/api/admin/snippets/${snippetToDelete.value.id}`, { method: 'DELETE' } as any)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.snippets.delete_success'), life: 3000 })
        refresh()
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    }
}

const editSnippet = (snippet: Snippet) => {
    toast.add({ severity: 'info', summary: 'Info', detail: '编辑功能开发中', life: 2000 })
}

const paginatorFirst = ref(0)
const onPageChange = (event: any) => {
    onPage(event)
    paginatorFirst.value = event.first
}

const renderMarkdown = (content: string) => md.render(content)

definePageMeta({
    layout: 'default',
})
</script>

<style lang="scss" scoped>
.admin-snippets-page {
    max-width: 1400px;
    margin: 0 auto;
    padding-bottom: 4rem;

    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .selected-count {
            font-size: 0.875rem;
            color: var(--p-text-muted-color);
        }
    }

    .quick-capture-wrapper {
        margin-bottom: 2rem;
        max-width: 48rem;
        margin-left: auto;
        margin-right: auto;

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

                            @media (width <= 640px) {
                                display: none;
                            }
                        }

                        .save-btn {
                            padding-left: 1.5rem;
                            padding-right: 1.5rem;
                        }
                    }
                }
            }
        }
    }

    .snippets-container {
        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 0;
            gap: 1rem;

            .pi-spinner {
                font-size: 3rem;
                color: var(--p-primary-color);
            }

            .loading-text {
                color: var(--p-text-muted-color);
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 0;
            text-align: center;
            background: var(--p-content-hover-background);
            border-radius: 0.75rem;
            border: 2px dashed var(--p-content-border-color);
            color: var(--p-text-muted-color);

            .empty-icon {
                font-size: 4.5rem;
                margin-bottom: 1rem;
                opacity: 0.2;
            }

            .empty-main-text {
                font-size: 1.25rem;
                font-weight: 500;
            }

            .empty-sub-text {
                font-size: 0.875rem;
                margin-top: 0.5rem;
            }
        }

        .snippets-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;

            @media (width >= 768px) {
                grid-template-columns: repeat(2, 1fr);
            }

            @media (width >= 1280px) {
                grid-template-columns: repeat(3, 1fr);
            }

            .snippet-item-wrapper {
                display: flex;
                gap: 1rem;
                align-items: flex-start;

                .checkbox-wrapper {
                    padding-top: 1rem;
                }

                .snippet-card-item {
                    flex: 1;
                    transition: transform 0.2s ease;

                    &:hover {
                        transform: translateY(-0.25rem);
                    }
                }
            }
        }

        .pagination-wrapper {
            display: flex;
            justify-content: center;
            margin-top: 3rem;
            background: var(--p-content-background);
            padding: 1rem 1.5rem;
            border-radius: 9999px;
            box-shadow: var(--p-overlay-modal-shadow);
            border: 1px solid var(--p-content-border-color);
            position: sticky;
            bottom: 1rem;
            z-index: 10;
            max-width: max-content;
            margin-left: auto;
            margin-right: auto;

            .paginator-custom {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
            }
        }
    }
}

.aggregate-dialog {
    max-width: 48rem;
    width: 100%;

    .aggregating-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 0;
        gap: 1rem;

        .spinner {
            width: 4rem;
            height: 4rem;
        }

        .aggregating-text {
            font-size: 1.125rem;
            font-weight: 500;
            color: var(--p-primary-color);
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
    }

    .scaffold-preview-container {
        .scaffold-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;

            .scaffold-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.125rem;
                font-weight: 700;

                .pi-sparkles {
                    color: #eab308;
                }
            }
        }

        .scaffold-content-box {
            margin-bottom: 1.5rem;
            padding: 1.5rem;
            background: var(--p-surface-50);
            border: 1px solid var(--p-content-border-color);
            border-radius: 0.75rem;
            overflow-y: auto;
            max-height: 60vh;

            :deep(h1), :deep(h2), :deep(h3) {
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                color: var(--p-primary-600);
            }

            :deep(ul), :deep(ol) {
                padding-left: 1.5rem;
                margin-bottom: 1rem;
            }

            :deep(li) {
                margin-bottom: 0.25rem;
            }
        }

        .dialog-actions-footer {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding-top: 1rem;
            border-top: 1px solid var(--p-content-border-color);
        }
    }

    .aggregate-confirm {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem;

        .info-alert {
            display: flex;
            gap: 1rem;
            padding: 1.25rem;
            background: #eff6ff;
            color: #2563eb;
            border-radius: 0.75rem;
            border: 1px solid #dbeafe;

            .pi-info-circle {
                font-size: 1.5rem;
            }

            .alert-content {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                .alert-title {
                    font-weight: 700;
                }

                .alert-desc {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }
            }
        }

        :global(.dark) .info-alert {
            background: rgb(30 58 138 / 0.2);
            color: #60a5fa;
            border-color: rgb(30 58 138 / 0.3);
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
        }
    }
}

// Transitions
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

.snippet-list-move,
.snippet-list-enter-active,
.snippet-list-leave-active {
    transition: all 0.5s ease;
}

.snippet-list-enter-from,
.snippet-list-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(30px);
}

.snippet-list-leave-active {
    position: absolute;
}
</style>
