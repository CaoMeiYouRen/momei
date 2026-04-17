<template>
    <div
        class="editor-layout"
        :class="{'drag-over': isDragging}"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <PostEditorHeader
            ref="headerRef"
            v-model:post="post"
            :errors="errors"
            :locales="locales"
            :has-translation="hasTranslation"
            :get-status-label="getStatusLabel"
            :get-status-severity="getStatusSeverity"
            :saving="saving"
            :is-new="isNew"
            :ai-loading="aiLoading"
            :title-suggestions="titleSuggestions"
            @suggest-titles="suggestTitles"
            @select-title="selectTitle"
            @handle-translation="(lang) => handleTranslationClick(lang)"
            @translate-content="(lang) => openTranslationWorkflow(lang)"
            @preview="handlePreview"
            @save="savePost"
            @open-settings="settingsVisible = true"
            @open-history="historyVisible = true"
        />

        <PostEditorSetupReminder
            v-if="showSetupReminder"
            @open-settings="handleOpenSettingsReminder"
            @open-system-settings="handleOpenSystemSettings"
            @dismiss="dismissSetupReminder"
        />

        <!-- Editor Area -->
        <div
            class="editor-area"
            :class="{
                'editor-area--invalid': errors.content,
                'editor-area--shifted': settingsVisible && !settingsCompact,
                'editor-area--compact': settingsVisible && settingsCompact
            }"
        >
            <ClientOnly>
                <AdminMavonEditorClient
                    ref="md"
                    v-model="post.content"
                    class="mavon-editor"
                    :placeholder="$t('pages.admin.posts.content_placeholder')"
                    @img-add="imgAdd"
                />
            </ClientOnly>
            <div v-if="errors.content" class="editor-error-message">
                <small class="p-error">{{ errors.content }}</small>
            </div>
        </div>

        <PostEditorSettings
            v-model:visible="settingsVisible"
            v-model:compact="settingsCompact"
            v-model:post="post"
            :errors="errors"
            :categories="categories"
            :filtered-tags="filteredTags"
            :ai-loading="aiLoading"
            :posts-for-translation="postsForTranslation"
            :language-options="languageOptions"
            :license-options="licenseOptions"
            :visibility-options="visibilityOptions"
            :default-license-label="defaultLicenseLabel"
            @search-posts="searchPosts"
            @suggest-slug="suggestSlug"
            @recommend-tags="recommendTags"
            @search-tags="searchTags"
            @suggest-summary="suggestSummary"
        />

        <PostTranslationWorkflowDialog
            v-model:visible="translationDialogVisible"
            :locales="locales"
            :source-options="translationSourceOptions"
            :target-statuses="translationTargetStatuses"
            :default-source-post-id="translationWorkflowDefaults.sourcePostId"
            :default-target-language="translationWorkflowDefaults.targetLanguage"
            :default-scopes="translationWorkflowDefaults.scopes"
            :progress="translationProgress.progress"
            :translation-status="translationProgress.status"
            :active-field="translationProgress.activeField"
            :error-text="translationProgress.error"
            :field-progress-map="translationProgress.fields"
            @start="handleStartTranslationWorkflow"
            @cancel-field="cancelFieldTranslation"
            @retry-field="retryFieldTranslation"
        />

        <PublishPushDialog
            ref="publishPushDialog"
            :loading="saving"
            @confirm="handlePublishConfirm"
        />

        <PostHistoryPanel
            v-model:visible="historyVisible"
            :post-id="post.id"
            @restore="handleRestore"
        />

        <!-- Drag Mask -->
        <PostEditorDragMask v-if="isDragging" />
    </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import PostEditorHeader from '@/components/admin/posts/post-editor-header.vue'
import PostEditorSettings from '@/components/admin/posts/post-editor-settings.vue'
import PostEditorSetupReminder from '@/components/admin/posts/post-editor-setup-reminder.vue'
import PostTranslationWorkflowDialog from '@/components/admin/posts/post-translation-workflow-dialog.vue'
import PublishPushDialog from '@/components/admin/posts/publish-push-dialog.vue'
import PostHistoryPanel from '@/components/admin/posts/post-history-panel.vue'
import PostEditorDragMask from '@/components/admin/posts/post-editor-drag-mask.vue'
import { usePostEditorPage } from '@/composables/use-post-editor-page'
import { clearQueuedSetupJourneyStage, getQueuedSetupJourneyStage } from '@/utils/web/setup-journey'

definePageMeta({
    middleware: 'author',
    layout: false,
})

const localePath = useLocalePath()
const route = useRoute()
const showSetupReminder = ref(false)
const lastAutoOpenedDistributionPostId = ref<string | null>(null)
const autoOpeningDistributionPostId = ref<string | null>(null)

const {
    md,
    headerRef,
    locales,
    languageOptions,
    licenseOptions,
    visibilityOptions,
    defaultLicenseLabel,
    post,
    translationDialogVisible,
    translationWorkflowDefaults,
    filteredTags,
    isNew,
    settingsVisible,
    settingsCompact,
    historyVisible,
    publishPushDialog,
    aiLoading,
    titleSuggestions,
    suggestTitles,
    selectTitle,
    suggestSlug,
    suggestSummary,
    recommendTags,
    cancelFieldTranslation,
    retryFieldTranslation,
    translationProgress,
    categories,
    errors,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    imgAdd,
    saving,
    postsForTranslation,
    translationSourceOptions,
    translationTargetStatuses,
    hasTranslation,
    handleTranslationClick,
    searchPosts,
    openTranslationWorkflow,
    handleStartTranslationWorkflow,
    handlePreview,
    handleRestore,
    searchTags,
    handlePublishConfirm,
    savePost,
    getStatusLabel,
    getStatusSeverity,
} = usePostEditorPage()

const dismissSetupReminder = () => {
    clearQueuedSetupJourneyStage()
    showSetupReminder.value = false
}

const handleOpenSettingsReminder = () => {
    settingsVisible.value = true
    dismissSetupReminder()
}

const handleOpenSystemSettings = async () => {
    dismissSetupReminder()
    await navigateTo(localePath({
        path: '/admin/settings',
        query: { tab: 'ai' },
    }))
}

watch(
    () => ({
        openDistribution: route.query.openDistribution,
        postId: post.value.id || null,
    }),
    ({ openDistribution, postId }) => {
        if (
            openDistribution !== 'true'
            || !postId
            || lastAutoOpenedDistributionPostId.value === postId
            || autoOpeningDistributionPostId.value === postId
        ) {
            return
        }

        autoOpeningDistributionPostId.value = postId
        nextTick(async () => {
            try {
                const currentRoutePostId = typeof route.params.id === 'string' ? route.params.id : null
                if (route.query.openDistribution !== 'true' || currentRoutePostId !== postId || post.value.id !== postId) {
                    return
                }

                await headerRef.value?.openDistribution?.()
                lastAutoOpenedDistributionPostId.value = postId

                if (route.query.openDistribution !== 'true') {
                    return
                }

                const { openDistribution: _openDistribution, ...restQuery } = route.query
                await navigateTo({
                    path: route.path,
                    query: restQuery,
                }, { replace: true })
            } catch (error) {
                console.error('Failed to auto open distribution dialog', error)
            } finally {
                if (autoOpeningDistributionPostId.value === postId) {
                    autoOpeningDistributionPostId.value = null
                }
            }
        })
    },
    { immediate: true },
)

onMounted(() => {
    if (getQueuedSetupJourneyStage() === 'editor') {
        showSetupReminder.value = true
    }
})
</script>

<style lang="scss" scoped>
.editor-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--p-surface-ground);
    position: relative;
}

.editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    transition: margin-right 0.3s ease;

    .mavon-editor {
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    &--invalid {
        border: 1px solid var(--p-error-color);
    }

    &--shifted {
        margin-right: 20rem;
    }

    &--compact {
        margin-right: 14rem;
    }
}

.editor-error-message {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    z-index: 10;
    background-color: var(--p-surface-card);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}
</style>
