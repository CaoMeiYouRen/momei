<template>
    <div v-if="settings" class="admin-theme-settings">
        <AdminPageHeader :title="$t('pages.admin.settings.theme.title')">
            <template #actions>
                <Button
                    v-tooltip.bottom="$t('pages.admin.settings.theme.gallery_title')"
                    icon="pi pi-images"
                    text
                    @click="showGallery = true"
                />
                <Button
                    :label="$t('pages.admin.settings.theme.save_as_new')"
                    icon="pi pi-plus"
                    severity="secondary"
                    variant="outlined"
                    class="ml-2"
                    @click="showSaveDialog = true"
                />
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    :loading="loading"
                    class="ml-2"
                    @click="saveTheme"
                />
            </template>
        </AdminPageHeader>

        <!-- 预览状态提示 -->
        <Message
            v-if="previewSettings"
            severity="info"
            class="mb-4"
            :closable="false"
        >
            <div class="align-items-center flex justify-content-between">
                <span>{{ $t('pages.admin.settings.theme.previewing_hint') }}</span>
                <Button
                    :label="$t('pages.admin.settings.theme.cancel_preview')"
                    class="p-button-sm p-button-text"
                    @click="cancelPreview"
                />
            </div>
        </Message>

        <div class="theme-grid">
            <!-- 左侧：实时预览 -->
            <ThemePreviewSection ref="previewSection" />

            <!-- 右侧：设置面板 -->
            <ThemeConfigSection />
        </div>

        <!-- 主题画廊弹窗 -->
        <ThemeGalleryDialog
            v-model="showGallery"
            @preview="previewThemeConfig"
        />

        <!-- 保存为新方案弹窗 -->
        <ThemeSaveDialog
            v-model="showSaveDialog"
            :settings="settings"
            :preview-inner="previewSection?.previewInner"
        />
    </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/use-theme'
import AdminPageHeader from '@/components/admin-page-header.vue'
import ThemeGalleryDialog from '@/components/admin/settings/theme-gallery-dialog.vue'
import ThemeSaveDialog from '@/components/admin/settings/theme-save-dialog.vue'
import ThemePreviewSection from '@/components/admin/settings/theme-preview-section.vue'
import ThemeConfigSection from '@/components/admin/settings/theme-config-section.vue'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const toast = useToast()
const { settings, previewSettings, applyTheme } = useTheme()
const loading = ref(false)

const previewSection = ref<InstanceType<typeof ThemePreviewSection> | null>(null)

// 弹窗控制
const showGallery = ref(false)
const showSaveDialog = ref(false)

// 监听设置变化以进行实时预览
watch(settings, () => {
    applyTheme()
}, { deep: true })

const previewThemeConfig = (config: any) => {
    try {
        const configData = typeof config.configData === 'string'
            ? JSON.parse(config.configData)
            : config.configData
        previewSettings.value = configData
        applyTheme()
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.admin.settings.theme.parse_error'),
        })
    }
}

const cancelPreview = () => {
    previewSettings.value = null
    applyTheme()
}

const saveTheme = async () => {
    if (!settings.value) {
        return
    }
    loading.value = true
    try {
        await $fetch('/api/admin/settings/theme', {
            method: 'PUT',
            body: settings.value,
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.theme.save_success'),
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('common.error'),
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
.admin-theme-settings {
    padding-bottom: 3rem;
}

.theme-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;
    margin-top: 1.5rem;
    align-items: start;

    @media (width <= 1400px) {
        grid-template-columns: 1fr 340px;
    }

    @media (width <= 1200px) {
        grid-template-columns: 1fr;
    }
}
</style>
