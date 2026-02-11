<template>
    <Drawer
        v-model:visible="visible"
        :header="$t('pages.admin.posts.history_versions')"
        position="right"
        class="history-drawer"
        :style="{width: '600px'}"
    >
        <div v-if="loading" class="history-panel__loading">
            <ProgressSpinner />
        </div>
        <div v-else-if="versions.length === 0" class="history-panel__empty">
            <i class="history-panel__empty-icon pi pi-history" />
            <p class="history-panel__empty-text">
                {{ $t('common.no_data') }}
            </p>
        </div>
        <div v-else class="history-list">
            <div
                v-for="version in versions"
                :key="version.id"
                class="history-item"
                :class="{'history-item--selected': selectedVersion?.id === version.id}"
            >
                <div class="history-item__main" @click="selectVersion(version)">
                    <div class="history-item__header">
                        <span class="history-item__time">{{ formatDateTime(version.createdAt) }}</span>
                        <Tag
                            v-if="version.reason"
                            :value="version.reason"
                            severity="info"
                            size="small"
                        />
                    </div>
                    <div class="history-item__footer">
                        <div class="history-item__author">
                            <Avatar
                                :image="version.author?.image"
                                :label="version.author?.name?.charAt(0)"
                                size="small"
                                shape="circle"
                            />
                            <span class="author-name">{{ version.author?.name }}</span>
                        </div>
                    </div>
                </div>
                <div class="history-item__actions">
                    <Button
                        v-tooltip="$t('common.delete')"
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        @click="confirmDelete(version)"
                    />
                </div>
            </div>
        </div>

        <template #footer>
            <div v-if="selectedVersion" class="history-panel__footer">
                <div class="history-panel__selected-info">
                    <div class="history-panel__compare-header">
                        <h4 class="history-panel__selected-title">
                            {{ selectedVersion.title }}
                        </h4>
                        <div class="history-panel__compare-controls">
                            <span class="history-panel__compare-label">{{ $t('pages.admin.posts.version_compare') }}</span>
                            <ToggleSwitch v-model="showDiff" class="history-panel__switch" />
                        </div>
                    </div>

                    <div v-if="showDiff" class="history-panel__diff-container">
                        <div
                            v-for="(part, index) in diffs"
                            :key="index"
                            class="history-panel__diff-part"
                            :class="{
                                'history-panel__diff-part--added': part.added,
                                'history-panel__diff-part--removed': part.removed
                            }"
                        >
                            {{ part.value }}
                        </div>
                    </div>
                    <template v-else>
                        <div class="history-panel__preview-label">
                            {{ $t('pages.admin.posts.content_preview') }}
                        </div>
                        <div class="history-panel__preview-box">
                            {{ selectedVersion.content.substring(0, 500) }}...
                        </div>
                    </template>
                </div>
                <div class="history-panel__footer-actions">
                    <Button
                        :label="$t('pages.admin.posts.restore_version')"
                        icon="pi pi-replay"
                        class="history-panel__btn-restore"
                        @click="restoreConfirm"
                    />
                    <Button
                        :label="$t('common.close')"
                        severity="secondary"
                        outlined
                        class="history-panel__btn-close"
                        @click="selectedVersion = null"
                    />
                </div>
            </div>
        </template>
    </Drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'
import { diffLines } from 'diff'

const props = defineProps<{
    postId: string | null | undefined
    currentContent: string | null | undefined
}>()

const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits(['restore'])

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const { formatDateTime } = useI18nDate()

const versions = ref<any[]>([])
const loading = ref(false)
const selectedVersion = ref<any>(null)
const showDiff = ref(true)

const diffs = computed(() => {
    if (!selectedVersion.value || props.currentContent === undefined) return []
    // 注意：diffLines 比较的是 历史版本内容(old) vs 当前编辑器内容(new)
    // 红色(removed) 表示历史版本独有，绿色(added) 表示当前版本独有
    return diffLines(selectedVersion.value.content || '', props.currentContent || '')
})

const fetchVersions = async () => {
    if (!props.postId) return
    loading.value = true
    try {
        const { data } = await $fetch<any>(`/api/admin/posts/${props.postId}/versions`)
        versions.value = data
    } catch (error) {
        console.error('Failed to fetch versions', error)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.error_loading'),
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

const selectVersion = async (version: any) => {
    try {
        const { data } = await $fetch<any>(`/api/admin/posts/${props.postId}/versions/${version.id}`)
        selectedVersion.value = data
    } catch (error) {
        console.error('Failed to fetch version detail', error)
    }
}

const confirmDelete = (version: any) => {
    confirm.require({
        message: t('pages.admin.posts.version_delete_confirm'),
        header: t('common.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        acceptProps: {
            label: t('common.delete'),
            severity: 'danger',
        },
        accept: async () => {
            try {
                await $fetch(`/api/admin/posts/${props.postId}/versions/${version.id}`, {
                    method: 'DELETE',
                })
                versions.value = versions.value.filter((v) => v.id !== version.id)
                if (selectedVersion.value?.id === version.id) {
                    selectedVersion.value = null
                }
                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('common.save_success'),
                    life: 3000,
                })
            } catch (error) {
                console.error('Failed to delete version', error)
            }
        },
    })
}

const restoreConfirm = () => {
    confirm.require({
        message: t('pages.admin.posts.version_rollback_confirm'),
        header: t('common.confirmation'),
        icon: 'pi pi-replay',
        accept: () => {
            restoreVersion()
        },
    })
}

const restoreVersion = () => {
    if (!selectedVersion.value) return
    emit('restore', {
        title: selectedVersion.value.title,
        content: selectedVersion.value.content,
        summary: selectedVersion.value.summary,
    })
    visible.value = false
    toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('pages.admin.posts.version_rollback_success'),
        life: 3000,
    })
}

watch(visible, (newVal) => {
    if (newVal) {
        fetchVersions()
        selectedVersion.value = null
    }
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.history-panel {
    &__loading {
        display: flex;
        justify-content: center;
        padding: 1rem;
    }

    &__empty {
        padding: 2rem;
        text-align: center;
        color: var(--p-text-color-secondary);
    }

    &__empty-icon {
        display: block;
        margin-bottom: 1rem;
        font-size: 2.25rem;
    }

    &__empty-text {
        margin: 0;
    }

    &__footer {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1.25rem;
        background-color: var(--p-surface-0);
        border-top: 1px solid var(--p-surface-border);
    }

    &__selected-info {
        display: flex;
        flex-direction: column;
    }

    &__compare-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px dashed var(--p-surface-border);
    }

    &__selected-title {
        font-weight: 700;
        margin: 0;
        font-size: 1.125rem;

        @include text-ellipsis;

        max-width: 300px;
    }

    &__compare-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    &__compare-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
    }

    &__switch {
        transform: scale(0.9);
    }

    &__diff-container {
        margin-top: 0.5rem;
        background-color: var(--p-surface-ground);
        padding: 1rem;
        border-radius: $border-radius-md;
        font-family: var(--p-font-family-monospace);
        max-height: 40vh; /* 限制对比区域高度，超过则内部滚动 */
        overflow-y: auto;
        border: 1px solid var(--p-surface-200);
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-all;
    }

    &__diff-part {
        &--added {
            background-color: rgb(var(--p-emerald-500-rgb), 0.1);
            color: var(--p-emerald-700);

            &::before {
                content: '+';
                margin-right: 4px;
                font-weight: bold;
            }
        }

        &--removed {
            background-color: rgb(var(--p-red-500-rgb), 0.1);
            color: var(--p-red-700);
            text-decoration: line-through;

            &::before {
                content: '-';
                margin-right: 4px;
                font-weight: bold;
            }
        }
    }

    &__preview-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
        margin-bottom: 0.75rem;
    }

    &__preview-box {
        background-color: var(--p-surface-ground);
        padding: 1rem;
        border-radius: $border-radius-md;
        font-family: var(--p-font-family-monospace);
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 250px;
        overflow-y: auto;
        color: var(--p-text-color-secondary);
        border: 1px solid var(--p-surface-border);
    }

    &__footer-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    &__btn-restore {
        flex: 1;
        background: linear-gradient(135deg, $color-primary 0%, #3b82f6 100%);
        border: 1px solid transparent;
        color: white;
        font-weight: 600;
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: $transition-base;
        box-shadow: 0 4px 12px rgba($color-primary, 0.2);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba($color-primary, 0.3);
            background: linear-gradient(135deg, $color-primary-hover 0%, #2563eb 100%);
        }

        &:active {
            transform: translateY(0);
        }

        :deep(.p-button-icon) {
            color: white;
            margin-right: 0.5rem;
        }
    }

    &__btn-close {
        transition: $transition-base;
        font-weight: 500;
        height: 42px;
        padding-left: 1.5rem;
        padding-right: 1.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background-color: var(--p-surface-100);
            border-color: var(--p-surface-300);
            color: var(--p-surface-700);
        }
    }
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    /* 大幅增加底部内边距，确保底部项目不会被展开的对比面板遮挡 */
    padding-bottom: 350px;
    transition: padding-bottom 0.3s ease;
}

.history-item {
    display: flex;
    align-items: center;
    border: 1px solid var(--p-surface-border);
    border-radius: var(--p-content-border-radius);
    overflow: hidden;
    transition: all 0.2s ease;

    /* 增加右侧间距，避免在大滚动条环境下删除按钮太靠边 */
    margin-right: 0.75rem;

    &:hover {
        background-color: var(--p-surface-hover);
        border-color: var(--p-primary-color);
        box-shadow: 0 2px 8px rgb(0 0 0 / 0.05);
    }

    &--selected {
        border-color: var(--p-primary-color);
        background-color: var(--p-primary-50);
        box-shadow: inset 2px 0 0 var(--p-primary-color);
    }

    &__main {
        flex: 1;
        padding: 0.85rem 1.25rem;
        cursor: pointer;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.65rem;
    }

    &__time {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--p-text-color);
    }

    &__footer {
        display: flex;
        align-items: center;
    }

    &__author {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.825rem;
        color: var(--p-text-color-secondary);
    }

    &__actions {
        padding: 0.5rem;
        padding-right: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

.author-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
