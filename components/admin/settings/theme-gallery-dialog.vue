<template>
    <Dialog
        :visible="modelValue"
        :header="$t('pages.admin.settings.theme.gallery_title')"
        modal
        class="theme-gallery-dialog"
        :style="{width: '80vw', maxWidth: '1000px'}"
        @update:visible="$emit('update:modelValue', $event)"
    >
        <DataView
            :value="themeConfigs"
            layout="grid"
            :loading="loading"
        >
            <template #grid="slotProps">
                <div class="theme-gallery-grid">
                    <div
                        v-for="(item, index) in slotProps.items"
                        :key="index"
                        class="theme-gallery-item"
                    >
                        <Card class="theme-config-card">
                            <template #header>
                                <div
                                    class="theme-config-card__preview"
                                    :style="{backgroundImage: item.previewImage ? `url(${item.previewImage})` : 'none'}"
                                    @click="openImagePreview(item.previewImage)"
                                >
                                    <div v-if="item.previewImage" class="theme-config-card__overlay">
                                        <i class="pi pi-search-plus" />
                                    </div>
                                    <div v-else class="theme-config-card__placeholder">
                                        <i class="pi pi-image" />
                                    </div>
                                </div>
                            </template>
                            <template #title>
                                <div class="theme-config-card__title-row">
                                    <span class="theme-config-card__name">{{ item.name }}</span>
                                    <Tag
                                        v-if="item.isSystem"
                                        severity="info"
                                        :value="$t('common.system')"
                                    />
                                </div>
                            </template>
                            <template #subtitle>
                                <div
                                    class="theme-config-card__description"
                                    :title="item.description || ''"
                                >
                                    {{ item.description || $t('common.no_description') }}
                                </div>
                            </template>
                            <template #footer>
                                <div class="theme-config-card__actions">
                                    <Button
                                        v-tooltip.top="$t('common.preview')"
                                        icon="pi pi-eye"
                                        outlined
                                        severity="secondary"
                                        @click="$emit('preview', item)"
                                    />
                                    <Button
                                        icon="pi pi-check"
                                        :label="$t('common.apply')"
                                        size="small"
                                        @click="applyConfig(item)"
                                    />
                                    <Button
                                        v-if="!item.isSystem"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        text
                                        @click="deleteConfig(item)"
                                    />
                                </div>
                            </template>
                        </Card>
                    </div>
                </div>
            </template>
            <template #empty>
                <div class="theme-gallery-empty">
                    <i class="pi pi-box" />
                    <p>{{ $t('pages.admin.settings.theme.gallery_empty') }}</p>
                </div>
            </template>
        </DataView>

        <!-- 图片大图预览 -->
        <Dialog
            v-model:visible="showImagePreview"
            modal
            :header="$t('common.preview')"
            class="image-preview-dialog"
            :style="{width: '90vw', maxWidth: '800px'}"
            dismissable-mask
            append-to="body"
        >
            <div class="flex justify-content-center">
                <img :src="previewImageUrl" style="max-width: 100%; height: auto; border-radius: 8px;">
            </div>
        </Dialog>
    </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'preview', config: any): void
    (e: 'apply', config: any): void
}>()

const { t } = useI18n()
const toast = useToast()

const loading = ref(false)
const themeConfigs = ref<any[]>([])
const showImagePreview = ref(false)
const previewImageUrl = ref('')

const openImagePreview = (url: string) => {
    if (!url) {
        return
    }
    previewImageUrl.value = url
    showImagePreview.value = true
}

const fetchGallery = async () => {
    loading.value = true
    try {
        const res = await $fetch<any>('/api/admin/theme-configs')
        themeConfigs.value = res?.data || []
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.admin.settings.theme.gallery_fetch_error'),
        })
    } finally {
        loading.value = false
    }
}

const applyConfig = async (config: any) => {
    try {
        await $fetch(`/api/admin/theme-configs/${config.id}/apply`, { method: 'POST' })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.theme.apply_success'),
            life: 3000,
        })
        // 重新加载页面以应用所有设置
        window.location.reload()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.data?.message || error.message,
            life: 5000,
        })
    }
}

const deleteConfig = async (config: any) => {
    try {
        await $fetch(`/api/admin/theme-configs/${config.id}`, { method: 'DELETE' })
        await fetchGallery()
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.theme.delete_success'),
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.data?.message || error.message,
            life: 5000,
        })
    }
}

watch(() => props.modelValue, (val) => {
    if (val) {
        fetchGallery()
    }
})
</script>

<style lang="scss" scoped>
.theme-gallery-dialog {
    :deep(.p-dialog-content) {
        padding: 0;
    }
}

.theme-gallery-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
    padding: 1rem;

    @media (width >= 640px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (width >= 960px) {
        grid-template-columns: repeat(3, 1fr);
    }
}

.theme-gallery-item {
    display: flex;
}

.theme-config-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--p-content-border-color);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease-in-out;
    background-color: var(--p-content-background);

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        border-color: var(--p-primary-color);
    }

    :deep(.p-card-header) {
        border-bottom: 1px solid var(--p-content-border-color);
    }

    :deep(.p-card-body) {
        flex: 1;
        padding: 1.25rem;
    }

    :deep(.p-card-title) {
        margin-bottom: 0.5rem;
    }

    :deep(.p-card-subtitle) {
        margin: 0;
    }

    :deep(.p-card-footer) {
        padding: 0 1.25rem 1.25rem;
        margin-top: auto;
    }

    &__preview {
        height: 160px;
        background-size: cover;
        background-position: center;
        background-color: var(--p-surface-100);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;

        &:hover {
            .theme-config-card__overlay {
                opacity: 1;
            }
        }
    }

    &__overlay {
        position: absolute;
        inset: 0;
        background: rgb(0 0 0 / 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        color: white;
        font-size: 1.5rem;

        i {
            font-size: inherit;
        }
    }

    &__placeholder {
        opacity: 0.3;
        font-size: 3rem;
        color: var(--p-text-muted-color);

        i {
            font-size: inherit;
        }
    }

    &__title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    &__name {
        font-weight: 700;
        font-size: 1.125rem;
        color: var(--p-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__description {
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.5;
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.75rem;
    }
}

.theme-gallery-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--p-text-muted-color);

    i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.2;
    }

    p {
        font-size: 1.125rem;
    }
}
</style>
