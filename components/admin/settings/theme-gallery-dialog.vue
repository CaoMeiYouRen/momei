<template>
    <CaomeiDialog
        :open="modelValue"
        :title="$t('pages.admin.settings.theme.gallery_title')"
        modal
        class="theme-gallery-dialog"
        :style="{width: '80vw', maxWidth: '1000px', padding: 0}"
        @update:open="$emit('update:modelValue', $event)"
    >
        <CaomeiDataView
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
                        <CaomeiCard class="theme-config-card">
                            <template #header>
                                <div
                                    class="theme-config-card__preview"
                                    :style="{backgroundImage: item.previewImage ? `url(${item.previewImage})` : 'none'}"
                                    @click="openImagePreview(item.previewImage)"
                                >
                                    <div v-if="item.previewImage" class="theme-config-card__overlay">
                                        <ZoomIn :size="18" aria-hidden="true" />
                                    </div>
                                    <div v-else class="theme-config-card__placeholder">
                                        <ImageIcon :size="48" aria-hidden="true" />
                                    </div>
                                </div>
                            </template>
                            <div class="theme-config-card__title-row">
                                <span class="theme-config-card__name">{{ item.name }}</span>
                                <div class="theme-config-card__tags">
                                    <CaomeiTag v-if="item.isActive" tone="success">
                                        {{ $t('common.current') }}
                                    </CaomeiTag>
                                    <CaomeiTag v-if="item.isSystem" tone="primary">
                                        {{ $t('common.system') }}
                                    </CaomeiTag>
                                </div>
                            </div>
                            <div
                                class="theme-config-card__description"
                                :title="item.description || ''"
                            >
                                {{ item.description || $t('common.no_description') }}
                            </div>
                            <template #footer>
                                <div class="theme-config-card__actions">
                                    <AppTooltip :content="$t('common.preview')">
                                        <CaomeiButton
                                            icon-only
                                            variant="secondary"
                                            :label="$t('common.preview')"
                                            @click="$emit('preview', item)"
                                        >
                                            <template #icon>
                                                <Eye :size="16" />
                                            </template>
                                        </CaomeiButton>
                                    </AppTooltip>
                                    <CaomeiButton
                                        size="sm"
                                        :label="item.isActive ? $t('common.current') : $t('common.apply')"
                                        :disabled="item.isActive"
                                        @click="applyConfig(item)"
                                    >
                                        <template #icon>
                                            <Check :size="16" />
                                        </template>
                                        {{ item.isActive ? $t('common.current') : $t('common.apply') }}
                                    </CaomeiButton>
                                    <CaomeiButton
                                        v-if="!item.isSystem"
                                        icon-only
                                        variant="ghost"
                                        tone="danger"
                                        :label="$t('common.delete')"
                                        @click="deleteConfig(item)"
                                    >
                                        <template #icon>
                                            <Trash2 :size="16" />
                                        </template>
                                    </CaomeiButton>
                                </div>
                            </template>
                        </CaomeiCard>
                    </div>
                </div>
            </template>
            <template #empty>
                <div class="theme-gallery-empty">
                    <PackageOpen :size="64" aria-hidden="true" />
                    <p>{{ $t('pages.admin.settings.theme.gallery_empty') }}</p>
                </div>
            </template>
        </CaomeiDataView>

        <!-- 图片大图预览 -->
        <CaomeiDialog
            :open="showImagePreview"
            modal
            :title="$t('common.preview')"
            class="image-preview-dialog"
            :style="{width: '90vw', maxWidth: '800px'}"
            @update:open="showImagePreview = $event"
        >
            <div class="flex justify-content-center">
                <img :src="previewImageUrl" style="max-width: 100%; height: auto; border-radius: 8px;">
            </div>
        </CaomeiDialog>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { Check, Eye, Image as ImageIcon, PackageOpen, Trash2, ZoomIn } from '@lucide/vue'
import { useToast } from 'caomei-ui'
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
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: t('pages.admin.settings.theme.gallery_fetch_error'),
        })
    } finally {
        loading.value = false
    }
}

const applyConfig = async (config: any) => {
    try {
        await $fetch(`/api/admin/theme-configs/${config.id}/apply`, { method: 'POST' })
        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: t('pages.admin.settings.theme.apply_success'),
            duration: 3000,
        })
        // 重新加载页面以应用所有设置
        window.location.reload()
    } catch (error: any) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.data?.message || error.message,
            duration: 5000,
        })
    }
}

const deleteConfig = async (config: any) => {
    try {
        await $fetch(`/api/admin/theme-configs/${config.id}`, { method: 'DELETE' })
        await fetchGallery()
        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: t('pages.admin.settings.theme.delete_success'),
            duration: 3000,
        })
    } catch (error: any) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.data?.message || error.message,
            duration: 5000,
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

/* 双类选择器提高特异性：库内 `.caomei-card` 的同名规则后加载，
 * 单类选择器会被其 `display: block` 覆盖，导致页脚 `margin-top: auto` 失效。 */
.theme-config-card.theme-config-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--caomei-color-border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease-in-out;
    background-color: var(--m-surface-0);
}

/* 子元素与内部结构样式必须留在**单类**块内：
 * 若挂在双类块下，`&__preview` 会编译成 `.theme-config-card.theme-config-card__preview`（要求同一元素有两个类），
 * 全部子元素样式静默失效。 */
.theme-config-card {
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        border-color: var(--caomei-color-primary);
    }

    :deep(.caomei-card__header) {
        padding: 0;
        border-bottom: 1px solid var(--caomei-color-border);
    }

    :deep(.caomei-card__body) {
        flex: 1;
        padding: 1.25rem;
    }

    :deep(.caomei-card__title) {
        margin-bottom: 0.5rem;
    }

    :deep(.caomei-card__footer) {
        padding: 0 1.25rem 1.25rem;
        margin-top: auto;
    }

    &__preview {
        height: 160px;
        background-size: cover;
        background-position: center;
        background-color: var(--m-surface-100);
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
    }

    &__placeholder {
        opacity: 0.3;
        color: var(--caomei-color-text-muted);
    }

    &__title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    &__tags {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    &__name {
        font-weight: 700;
        font-size: 1.125rem;
        color: var(--caomei-color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__description {
        font-size: 0.875rem;
        color: var(--caomei-color-text-muted);
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
    color: var(--caomei-color-text-muted);

    :deep(svg) {
        margin-bottom: 1rem;
        opacity: 0.2;
    }

    p {
        font-size: 1.125rem;
    }
}
</style>
