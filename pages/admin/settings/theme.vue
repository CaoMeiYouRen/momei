<template>
    <div v-if="settings" class="admin-theme-settings">
        <AdminPageHeader :title="$t('pages.admin.settings.theme.title')" />

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

        <AdminFloatingActions
            :primary-label="$t('common.save')"
            primary-icon="pi pi-check"
            :primary-loading="loading"
            :primary-disabled="loading || !isDirty"
            :secondary-label="shouldShowFeedbackEntry ? $t('common.feedback') : ''"
            secondary-icon="pi pi-question-circle"
            :status-label="themeActionStatusLabel"
            :status-tone="themeActionStatusTone"
            @primary-click="saveTheme"
            @secondary-click="openFeedbackEntry"
        >
            <template #before-actions>
                <Button
                    v-tooltip.bottom="$t('pages.admin.settings.theme.gallery_title')"
                    icon="pi pi-images"
                    severity="secondary"
                    outlined
                    rounded
                    @click="showGallery = true"
                />
                <Button
                    :label="$t('pages.admin.settings.theme.save_as_new')"
                    icon="pi pi-plus"
                    severity="secondary"
                    outlined
                    rounded
                    @click="showSaveDialog = true"
                />
            </template>
        </AdminFloatingActions>
    </div>
</template>

<script setup lang="ts">
import AdminFloatingActions from '@/components/admin/admin-floating-actions.vue'
import { useTheme } from '@/composables/use-theme'
import { useFeedbackEntry } from '@/composables/use-feedback-entry'
import { useUnsavedChangesGuard } from '@/composables/use-unsaved-changes-guard'
import AdminPageHeader from '@/components/admin-page-header.vue'
import ThemeGalleryDialog from '@/components/admin/settings/theme-gallery-dialog.vue'
import ThemeSaveDialog from '@/components/admin/settings/theme-save-dialog.vue'
import ThemePreviewSection from '@/components/admin/settings/theme-preview-section.vue'
import ThemeConfigSection from '@/components/admin/settings/theme-config-section.vue'
import { stableSerialize } from '@/utils/shared/stable-serialize'

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const { t } = useI18n()
const toast = useToast()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const { settings, previewSettings, applyTheme, fetchTheme } = useTheme()
const { openFeedbackEntry, shouldShowFeedbackEntry } = useFeedbackEntry({ includeAdmin: true })
const loading = ref(false)
const initialThemeSnapshot = ref('null')

const previewSection = ref<InstanceType<typeof ThemePreviewSection> | null>(null)

// 弹窗控制
const showGallery = ref(false)
const showSaveDialog = ref(false)

const syncInitialThemeSnapshot = () => {
    initialThemeSnapshot.value = stableSerialize(settings.value)
}

const isDirty = computed(() => stableSerialize(settings.value) !== initialThemeSnapshot.value)
const themeActionStatusLabel = computed(() => isDirty.value
    ? t('pages.admin.settings.system.floating_actions.unsaved')
    : t('pages.admin.settings.system.floating_actions.saved'))
const themeActionStatusTone = computed<'warn' | 'success'>(() => isDirty.value ? 'warn' : 'success')

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
    if (!settings.value || !isDirty.value) {
        return
    }
    loading.value = true
    try {
        await $fetch('/api/admin/settings/theme', {
            method: 'PUT',
            body: settings.value,
        })
        syncInitialThemeSnapshot()
        showSuccessToast('pages.admin.settings.theme.save_success')
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.error_saving' })
    } finally {
        loading.value = false
    }
}

useUnsavedChangesGuard({
    isDirty,
    message: computed(() => t('pages.admin.settings.system.floating_actions.leave_confirm')),
})

onMounted(async () => {
    try {
        await fetchTheme()
        syncInitialThemeSnapshot()
        applyTheme()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.error_loading' })
    }
})
</script>

<style lang="scss" scoped>
.admin-theme-settings {
    padding-bottom: 7rem;
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
