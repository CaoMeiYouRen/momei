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
                        <div class="history-item__meta">
                            <span class="history-item__sequence">#{{ version.sequence }}</span>
                            <span class="history-item__time">{{ formatDateTime(version.createdAt) }}</span>
                        </div>
                        <Tag
                            :value="getSourceLabel(version.source)"
                            :severity="getSourceSeverity(version.source)"
                            size="small"
                        />
                    </div>
                    <div class="history-item__summary">
                        {{ getSummaryLabel(version) }}
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
            </div>
        </div>

        <template #footer>
            <div v-if="selectedVersion" class="history-panel__footer">
                <div class="history-panel__selected-info">
                    <div class="history-panel__compare-header">
                        <h4 class="history-panel__selected-title">
                            {{ selectedVersion.snapshot.title }}
                        </h4>
                        <div class="history-panel__compare-controls">
                            <span class="history-panel__compare-label">{{ $t('pages.admin.posts.version_compare') }}</span>
                            <Select
                                v-model="compareTarget"
                                :options="compareOptions"
                                option-label="label"
                                option-value="value"
                                class="history-panel__compare-select"
                            />
                        </div>
                    </div>

                    <div v-if="diffLoading" class="history-panel__loading">
                        <ProgressSpinner />
                    </div>
                    <div v-else-if="!changedDiffItems.length" class="history-panel__empty-diff">
                        {{ $t('pages.admin.posts.version_diff_empty') }}
                    </div>
                    <div v-else class="history-panel__diff-container">
                        <div
                            v-for="item in changedDiffItems"
                            :key="item.field"
                            class="history-panel__diff-group"
                        >
                            <div class="history-panel__diff-label">
                                {{ getFieldLabel(item.field) }}
                            </div>
                            <div
                                v-for="(part, index) in item.parts"
                                :key="`${item.field}-${index}`"
                                class="history-panel__diff-part"
                                :class="{
                                    'history-panel__diff-part--added': part.added,
                                    'history-panel__diff-part--removed': part.removed
                                }"
                            >
                                {{ part.value }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="history-panel__footer-actions">
                    <Button
                        :label="$t('pages.admin.posts.restore_version')"
                        icon="pi pi-replay"
                        class="history-panel__btn-restore"
                        :loading="restoring"
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
import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'
import type { ApiResponse } from '@/types/api'
import {
    PostVersionDiffField,
    PostVersionSource,
    type PostVersionDetail,
    type PostVersionDiffItem,
    type PostVersionDiffPayload,
    type PostVersionListItem,
    type PostVersionRestoreResult,
} from '@/types/post-version'

const props = defineProps<{
    postId: string | null | undefined
}>()

const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits(['restore'])

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const { formatDateTime } = useI18nDate()

const versions = ref<PostVersionListItem[]>([])
const loading = ref(false)
const diffLoading = ref(false)
const restoring = ref(false)
const selectedVersion = ref<PostVersionDetail | null>(null)
const diffPayload = ref<PostVersionDiffPayload | null>(null)
const compareTarget = ref<string>('parent')

const changedDiffItems = computed<PostVersionDiffItem[]>(() => {
    return (diffPayload.value?.items || []).filter((item) => item.changed)
})

const compareOptions = computed(() => {
    const selectedId = selectedVersion.value?.id

    return [
        {
            label: t('pages.admin.posts.version_compare_previous'),
            value: 'parent',
        },
        {
            label: t('pages.admin.posts.version_compare_current'),
            value: 'current',
        },
        ...versions.value
            .filter((version) => version.id !== selectedId)
            .map((version) => ({
                label: `#${version.sequence} ${getSummaryLabel(version)}`,
                value: version.id,
            })),
    ]
})

const fetchVersions = async () => {
    if (!props.postId) return

    loading.value = true
    try {
        const response = await $fetch<ApiResponse<PostVersionListItem[]>>(`/api/admin/posts/${props.postId}/versions`)
        versions.value = response.data || []
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

const fetchDiff = async () => {
    if (!props.postId || !selectedVersion.value) return

    diffLoading.value = true
    try {
        const query = compareTarget.value === 'current'
            ? { compareToCurrent: 'true' }
            : compareTarget.value === 'parent'
                ? undefined
                : { compareToVersionId: compareTarget.value }

        const response = await $fetch<ApiResponse<PostVersionDiffPayload>>(`/api/admin/posts/${props.postId}/versions/${selectedVersion.value.id}/diff`, {
            query,
        })
        diffPayload.value = response.data || null
    } catch (error) {
        console.error('Failed to fetch version diff', error)
        diffPayload.value = null
    } finally {
        diffLoading.value = false
    }
}

const selectVersion = async (version: PostVersionListItem) => {
    if (!props.postId) return

    try {
        const response = await $fetch<ApiResponse<PostVersionDetail>>(`/api/admin/posts/${props.postId}/versions/${version.id}`)
        selectedVersion.value = response.data || null
        compareTarget.value = version.parentVersionId ? 'parent' : 'current'
        await fetchDiff()
    } catch (error) {
        console.error('Failed to fetch version detail', error)
    }
}

const restoreConfirm = () => {
    confirm.require({
        message: t('pages.admin.posts.version_rollback_confirm'),
        header: t('common.confirmation'),
        icon: 'pi pi-replay',
        accept: () => restoreVersion(),
    })
}

const restoreVersion = async () => {
    if (!props.postId || !selectedVersion.value) return

    restoring.value = true
    try {
        const response = await $fetch<ApiResponse<PostVersionRestoreResult>>(`/api/admin/posts/${props.postId}/versions/${selectedVersion.value.id}/restore`, {
            method: 'POST',
        })

        if (response.data) {
            emit('restore', response.data.post)
            await fetchVersions()
            visible.value = false
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: response.data.restored
                    ? t('pages.admin.posts.version_restore_success')
                    : t('pages.admin.posts.version_restore_noop'),
                life: 3000,
            })
        }
    } catch (error) {
        console.error('Failed to restore version', error)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.admin.posts.version_restore_failed'),
            life: 3000,
        })
    } finally {
        restoring.value = false
    }
}

const getSourceLabel = (source: PostVersionSource) => t(`pages.admin.posts.version_sources.${source}`)

const getSourceSeverity = (source: PostVersionSource) => {
    const severityMap: Record<PostVersionSource, 'success' | 'info' | 'warn' | 'secondary'> = {
        [PostVersionSource.CREATE]: 'success',
        [PostVersionSource.EDIT]: 'info',
        [PostVersionSource.RESTORE]: 'warn',
        [PostVersionSource.ROLLBACK_RECOVERY]: 'secondary',
    }

    return severityMap[source]
}

const getFieldLabel = (field: PostVersionDiffField) => t(`pages.admin.posts.version_fields.${field}`)

const getSummaryLabel = (version: PostVersionListItem | PostVersionDetail) => {
    if (!version.changedFields?.length) {
        return t(`pages.admin.posts.version_summaries.${version.source}`)
    }

    const fields = version.changedFields.map((field) => getFieldLabel(field)).join(' / ')
    return t(`pages.admin.posts.version_summaries.${version.source}_with_fields`, { fields })
}

watch(visible, (newValue) => {
    if (newValue) {
        void fetchVersions()
        selectedVersion.value = null
        diffPayload.value = null
    }
})

watch(compareTarget, () => {
    if (selectedVersion.value) {
        void fetchDiff()
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
        max-width: 300px;
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;

        @include text-ellipsis;
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

    &__compare-select {
        min-width: 12rem;
    }

    &__diff-container {
        margin-top: 0.5rem;
        background-color: var(--p-surface-ground);
        padding: 1rem;
        border-radius: $border-radius-md;
        font-family: var(--p-font-family-monospace);
        max-height: 40vh;
        overflow-y: auto;
        border: 1px solid var(--p-surface-200);
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-all;
    }

    &__diff-group + &__diff-group {
        margin-top: 1.25rem;
        padding-top: 1.25rem;
        border-top: 1px dashed var(--p-surface-300);
    }

    &__diff-label {
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--p-text-color);
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

    &__empty-diff {
        padding: 1rem;
        color: var(--p-text-color-secondary);
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
    padding-bottom: 350px;
}

.history-item {
    display: flex;
    align-items: center;
    border: 1px solid var(--p-surface-border);
    border-radius: var(--p-content-border-radius);
    overflow: hidden;
    transition: all 0.2s ease;
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
        gap: 0.75rem;
        margin-bottom: 0.65rem;
    }

    &__meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__sequence {
        font-weight: 700;
        color: var(--p-primary-color);
    }

    &__time {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--p-text-color);
    }

    &__summary {
        margin-bottom: 0.65rem;
        font-size: 0.875rem;
        line-height: 1.5;
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
}

.author-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
