<template>
    <div class="admin-snippets-page">
        <AdminPageHeader :title="t('pages.admin.snippets.title')">
            <template #actions>
                <div class="header-actions">
                    <transition name="fade">
                        <span v-if="selectedSnippetIds.length" class="selected-count">
                            {{ t('pages.admin.snippets.selected_count', {count: selectedSnippetIds.length}) }}
                        </span>
                    </transition>
                    <AppTooltip :content="t('pages.admin.snippets.aggregate_hint')" side="bottom">
                        <CaomeiButton
                            variant="secondary"
                            tone="neutral"
                            :disabled="!selectedSnippetIds.length"
                            @click="showAggregateDialog = true"
                        >
                            <template #icon>
                                <Sparkles :size="16" />
                            </template>
                            {{ t('pages.admin.snippets.aggregate') }}
                        </CaomeiButton>
                    </AppTooltip>
                </div>
            </template>
        </AdminPageHeader>

        <!-- Quick Capture -->
        <SnippetQuickCapture @success="refresh" />

        <!-- Bookmarklet -->
        <SnippetBookmarklet />

        <div class="snippets-container">
            <div v-if="loading && !items.length" class="loading-state">
                <LoaderCircle :size="48" class="loading-spinner" />
                <p class="loading-text">
                    {{ t('common.loading') }}
                </p>
            </div>

            <div v-else-if="!items.length" class="empty-state">
                <Inbox :size="72" class="empty-icon" />
                <p class="empty-main-text">
                    {{ t('pages.admin.snippets.empty') }}
                </p>
                <p class="empty-sub-text">
                    {{ t('pages.admin.snippets.empty_hint') }}
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
                            <CaomeiCheckbox
                                v-model="selectedSnippetIds"
                                :value="item.id"
                            />
                        </div>
                        <SnippetCard
                            :snippet="item"
                            class="snippet-card-item"
                            @edit="editSnippet"
                            @delete="openDeleteDialog"
                            @convert="convertSnippet"
                        />
                    </div>
                </transition-group>

                <div class="pagination-wrapper">
                    <CaomeiPaginator
                        v-model:page="currentPage"
                        :items-per-page="pagination.limit"
                        :total="pagination.total"
                        show-edges
                        class="paginator-custom"
                        @update:page="onPageChange"
                    />
                    <span class="pagination-report">{{ currentPage }} / {{ totalPages }}</span>
                </div>
            </template>
        </div>

        <!-- Aggregate Dialog -->
        <SnippetAggregateDialog
            v-model:visible="showAggregateDialog"
            :selected-snippet-ids="selectedSnippetIds"
        />

        <!-- Edit Dialog -->
        <SnippetEditDialog
            v-model:visible="editDialogVisible"
            :snippet="editingSnippet"
            @success="refresh"
        />

        <ConfirmDeleteDialog
            v-model:visible="deleteDialogVisible"
            :title="t('pages.admin.snippets.confirm_delete')"
            @confirm="deleteSnippet"
        />
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { Inbox, LoaderCircle, Sparkles } from '@lucide/vue'
import { useAdminList } from '@/composables/use-admin-list'
import SnippetCard from '@/components/admin/snippets/snippet-card.vue'
import SnippetQuickCapture from '@/components/admin/snippets/snippet-quick-capture.vue'
import SnippetBookmarklet from '@/components/admin/snippets/snippet-bookmarklet.vue'
import SnippetAggregateDialog from '@/components/admin/snippets/snippet-aggregate-dialog.vue'
import SnippetEditDialog from '@/components/admin/snippets/snippet-edit-dialog.vue'
import type { Snippet } from '@/types/snippet'

const { t } = useI18n()
const toast = useToast()
const {
    visible: deleteDialogVisible,
    item: snippetToDelete,
    openDeleteDialog,
    resetDeleteDialog,
} = useDeleteDialogState<Snippet>()

const { items, pagination, loading, refresh, onPage } = useAdminList<Snippet>({
    url: '/api/admin/snippets',
    initialLimit: 12,
    pageIndexBase: 1,
})

const selectedSnippetIds = ref<string[]>([])
const showAggregateDialog = ref(false)

const editDialogVisible = ref(false)
const editingSnippet = ref<Snippet | null>(null)

const editSnippet = (snippet: Snippet) => {
    editingSnippet.value = snippet
    editDialogVisible.value = true
}

const convertSnippet = async (snippet: Snippet) => {
    try {
        const res: any = await $fetch(`/api/admin/snippets/${snippet.id}/convert`, { method: 'POST' } as any)
        toast.show({ tone: 'success', title: t('common.success'), description: t('pages.admin.snippets.convert_success'), duration: 3000 })
        navigateTo(`/admin/posts/${res.data.post.id}`)
    } catch (e) {
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.unexpected_error'), duration: 3000 })
    }
}

const deleteSnippet = async () => {
    if (!snippetToDelete.value) return
    try {
        await $fetch(`/api/admin/snippets/${snippetToDelete.value.id}`, { method: 'DELETE' } as any)
        toast.show({ tone: 'success', title: t('common.success'), description: t('pages.admin.snippets.delete_success'), duration: 3000 })
        refresh()
        resetDeleteDialog()
    } catch (e) {
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.unexpected_error'), duration: 3000 })
    }
}

const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil((pagination.value.total || 0) / (pagination.value.limit || 1))))
const onPageChange = (nextPage: number) => {
    onPage({ page: nextPage, rows: pagination.value.limit })
}

definePageMeta({
    middleware: 'author',
    layout: 'default',
})
</script>

<style lang="scss" scoped>
.admin-snippets-page {
    max-width: 1400px;
    margin: 0 auto;
    padding-bottom: 4rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;

    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .selected-count {
            font-size: var(--m-font-size-sm);
            color: var(--caomei-color-text-muted);
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

            .loading-spinner {
                animation: snippet-spin 1s linear infinite;
                color: var(--caomei-color-primary);
            }

            .loading-text {
                color: var(--caomei-color-text-muted);
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            @media (prefers-reduced-motion: reduce) {
                .loading-spinner {
                    animation: none;
                }
            }
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 0;
            text-align: center;
            background: var(--m-surface-hover);
            border-radius: 0.75rem;
            border: 2px dashed var(--caomei-color-border);
            color: var(--caomei-color-text-muted);

            .empty-icon {
                margin-bottom: 1rem;
                opacity: 0.2;
            }

            .empty-main-text {
                font-size: var(--m-font-size-xl);
                font-weight: 500;
            }

            .empty-sub-text {
                font-size: var(--m-font-size-sm);
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
            align-items: center;
            gap: 1rem;
            margin-top: 3rem;
            background: var(--m-surface-0);
            padding: 1rem 1.5rem;
            border-radius: 9999px;
            box-shadow: var(--m-shadow-modal);
            border: 1px solid var(--caomei-color-border);
            position: sticky;
            bottom: 1rem;
            z-index: 10;
            max-width: max-content;
            margin-left: auto;
            margin-right: auto;

            .pagination-report {
                font-size: var(--m-font-size-sm);
                color: var(--caomei-color-text-muted);
                white-space: nowrap;
            }

            .paginator-custom {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
            }
        }
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

@keyframes snippet-spin {
    to { transform: rotate(360deg); }
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
