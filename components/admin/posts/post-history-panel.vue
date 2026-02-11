<template>
    <Drawer
        v-model:visible="visible"
        :header="$t('pages.admin.posts.history_versions')"
        position="right"
        class="history-drawer"
        :style="{width: '450px'}"
    >
        <div v-if="loading" class="flex justify-center p-4">
            <ProgressSpinner />
        </div>
        <div v-else-if="versions.length === 0" class="p-8 text-center text-secondary">
            <i class="block mb-4 pi pi-history text-4xl" />
            <p>{{ $t('common.no_data') }}</p>
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
            <div v-if="selectedVersion" class="border-t flex flex-col gap-4 p-4 surface-border">
                <div class="selected-version-info">
                    <h4 class="font-bold m-0 mb-2 text-lg">
                        {{ selectedVersion.title }}
                    </h4>
                    <div class="mb-2 text-secondary text-sm">
                        {{ $t('pages.admin.posts.content_preview') }}
                    </div>
                    <div class="preview-box">
                        {{ selectedVersion.content.substring(0, 300) }}...
                    </div>
                </div>
                <div class="flex gap-2">
                    <Button
                        :label="$t('pages.admin.posts.restore_version')"
                        icon="pi pi-replay"
                        class="flex-1"
                        @click="restoreConfirm"
                    />
                    <Button
                        :label="$t('common.close')"
                        severity="secondary"
                        outlined
                        @click="selectedVersion = null"
                    />
                </div>
            </div>
        </template>
    </Drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    postId: string | null | undefined
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
.history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.history-item {
    display: flex;
    align-items: center;
    border: 1px solid var(--p-surface-border);
    border-radius: var(--p-content-border-radius);
    overflow: hidden;
    transition: all 0.2s ease;

    &:hover {
        background-color: var(--p-surface-hover);
        border-color: var(--p-primary-color);
    }

    &--selected {
        border-color: var(--p-primary-color);
        background-color: var(--p-primary-50);
    }

    &__main {
        flex: 1;
        padding: 0.75rem 1rem;
        cursor: pointer;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    &__time {
        font-weight: 500;
        font-size: 0.9rem;
    }

    &__footer {
        display: flex;
        align-items: center;
    }

    &__author {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: var(--p-text-color-secondary);
    }

    &__actions {
        padding: 0.25rem;
    }
}

.preview-box {
    background-color: var(--p-surface-ground);
    padding: 0.75rem;
    border-radius: var(--p-content-border-radius);
    font-family: var(--p-font-family-monospace);
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
    color: var(--p-text-color-secondary);
}

.author-name {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
