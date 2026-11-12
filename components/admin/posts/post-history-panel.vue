<template>
    <CaomeiDrawer
        :open="visible"
        :title="$t('pages.admin.posts.history_versions')"
        position="right"
        class="history-drawer"
        :style="{width: '600px'}"
        @update:open="visible = $event"
    >
        <div v-if="loading" class="history-panel__loading">
            <CaomeiProgressSpinner />
        </div>
        <div v-else-if="versions.length === 0" class="history-panel__empty">
            <History :size="40" class="history-panel__empty-icon" />
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
                        <CaomeiTag
                            :tone="getSourceTone(version.source)"
                            size="sm"
                        >
                            {{ getSourceLabel(version.source) }}
                        </CaomeiTag>
                    </div>
                    <div class="history-item__summary">
                        {{ getSummaryLabel(version) }}
                    </div>
                    <div class="history-item__footer">
                        <div class="history-item__author">
                            <CaomeiAvatar
                                :src="version.author?.image || undefined"
                                :fallback="version.author?.name?.charAt(0)"
                                size="sm"
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
                            <CaomeiSelect
                                :model-value="compareTarget"
                                :options="compareOptions"
                                option-label="label"
                                option-value="value"
                                class="history-panel__compare-select"
                                @update:model-value="onCompareTargetChange"
                            />
                        </div>
                    </div>

                    <div v-if="diffLoading" class="history-panel__loading">
                        <CaomeiProgressSpinner />
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
                    <CaomeiButton
                        class="history-panel__btn-restore"
                        :loading="restoring"
                        @click="restoreConfirm"
                    >
                        <template #icon>
                            <RotateCcw :size="16" />
                        </template>
                        {{ $t('pages.admin.posts.restore_version') }}
                    </CaomeiButton>
                    <CaomeiButton
                        variant="secondary"
                        tone="neutral"
                        class="history-panel__btn-close"
                        @click="selectedVersion = null"
                    >
                        {{ $t('common.close') }}
                    </CaomeiButton>
                </div>
            </div>
        </template>
    </CaomeiDrawer>
</template>

<script setup lang="ts">
import { History, RotateCcw } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { useConfirm } from 'caomei-ui'
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

const onCompareTargetChange = (value: string | number | null | undefined) => {
    if (typeof value === 'string') {
        compareTarget.value = value
    }
}

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
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: t('common.error_loading'),
            duration: 3000,
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
    void confirm.confirm({
        title: t('common.confirmation'),
        description: t('pages.admin.posts.version_rollback_confirm'),
        confirmLabel: t('common.confirm'),
        cancelLabel: t('common.cancel'),
        tone: 'neutral',
    }).then((confirmed) => {
        if (confirmed) {
            void restoreVersion()
        }
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
            toast.show({
                tone: 'success',
                title: t('common.success'),
                description: response.data.restored
                    ? t('pages.admin.posts.version_restore_success')
                    : t('pages.admin.posts.version_restore_noop'),
                duration: 3000,
            })
        }
    } catch (error) {
        console.error('Failed to restore version', error)
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: t('pages.admin.posts.version_restore_failed'),
            duration: 3000,
        })
    } finally {
        restoring.value = false
    }
}

const VERSION_SOURCE_KEYS: Partial<Record<PostVersionSource, string>> = {
    [PostVersionSource.CREATE]: 'common.create',
    [PostVersionSource.EDIT]: 'common.edit',
}

const getSourceLabel = (source: PostVersionSource) =>
    t(VERSION_SOURCE_KEYS[source] ?? `pages.admin.posts.version_sources.${source}`)

const getSourceTone = (source: PostVersionSource) => {
    const severityMap: Record<PostVersionSource, 'success' | 'primary' | 'warning' | 'neutral'> = {
        [PostVersionSource.CREATE]: 'success',
        [PostVersionSource.EDIT]: 'primary',
        [PostVersionSource.RESTORE]: 'warning',
        [PostVersionSource.ROLLBACK_RECOVERY]: 'neutral',
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
        background-color: var(--m-surface-0);
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
    }

    &__compare-select {
        min-width: 12rem;
    }

    &__diff-container {
        margin-top: 0.5rem;
        background-color: var(--m-surface-ground);
        padding: 1rem;
        border-radius: $border-radius-md;
        font-family: var(--m-font-mono);
        max-height: 40vh;
        overflow-y: auto;
        border: 1px solid var(--m-surface-200);
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-all;
    }

    &__diff-group + &__diff-group {
        margin-top: 1.25rem;
        padding-top: 1.25rem;
        border-top: 1px dashed var(--m-surface-300);
    }

    &__diff-label {
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--caomei-color-text);
    }

    &__diff-part {
        &--added {
            color: var(--m-emerald-700);

            &::before {
                content: '+';
                margin-right: 4px;
                font-weight: bold;
            }
        }

        &--removed {
            color: var(--m-red-700);
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

        :deep(.caomei-button__icon) {
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
            background-color: var(--m-surface-100);
            border-color: var(--m-surface-300);
            color: var(--m-surface-700);
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
    border-radius: var(--caomei-radius-md);
    overflow: hidden;
    transition: all 0.2s ease;
    margin-right: 0.75rem;

    &:hover {
        border-color: var(--caomei-color-primary);
        box-shadow: 0 2px 8px rgb(0 0 0 / 0.05);
    }

    &--selected {
        border-color: var(--caomei-color-primary);
        background-color: var(--m-primary-50);
        box-shadow: inset 2px 0 0 var(--caomei-color-primary);
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
        color: var(--caomei-color-primary);
    }

    &__time {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--caomei-color-text);
    }

    &__summary {
        margin-bottom: 0.65rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--caomei-color-text);
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
    }
}

.author-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
