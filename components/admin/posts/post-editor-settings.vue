<template>
    <div
        class="settings-sidebar"
        :class="{
            'settings-sidebar--visible': visible,
            'settings-sidebar--compact': isCompact
        }"
    >
        <div class="settings-sidebar__header">
            <h3 class="settings-sidebar__title">
                {{ $t('pages.admin.posts.settings_title') }}
            </h3>
            <div class="settings-sidebar__actions">
                <Button
                    v-tooltip="isCompact ? $t('common.expand') : $t('common.collapse')"
                    :icon="isCompact ? 'pi pi-chevron-left' : 'pi pi-chevron-right'"
                    text
                    rounded
                    severity="secondary"
                    @click="isCompact = !isCompact"
                />
                <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="secondary"
                    @click="visible = false"
                />
            </div>
        </div>
        <div class="settings-form">
            <div class="form-group">
                <label for="language" class="form-label">{{ $t('pages.admin.posts.language') }}</label>
                <Select
                    id="language"
                    v-model="post.language"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                />
            </div>

            <div class="form-group">
                <label for="translationId" class="form-label">
                    {{ $t('pages.admin.posts.translation_group') }}
                    <small class="text-secondary">({{ $t('common.optional') }})</small>
                </label>
                <InputGroup>
                    <AutoComplete
                        id="translationId"
                        v-model="post.translationId"
                        :suggestions="postsForTranslation"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.posts.translation_group_hint')"
                        dropdown
                        fluid
                        @complete="emit('search-posts', $event)"
                    />
                </InputGroup>
            </div>

            <div class="form-group">
                <label for="slug" class="form-label">{{ $t('pages.admin.posts.slug') }}</label>
                <InputGroup>
                    <InputText
                        id="slug"
                        v-model="post.slug"
                        :class="{'p-invalid': errors.slug}"
                    />
                    <Button
                        id="ai-slug-btn"
                        v-tooltip="$t('pages.admin.posts.ai.generate_slug')"
                        icon="pi pi-sparkles"
                        severity="secondary"
                        text
                        :loading="aiLoading.slug"
                        @click="emit('suggest-slug')"
                    />
                </InputGroup>
                <small v-if="errors.slug" class="p-error">{{ errors.slug }}</small>
                <small v-else class="form-hint">{{ $t('pages.admin.posts.slug_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="category" class="form-label">{{ $t('common.category') }}</label>
                <Select
                    v-model="post.categoryId"
                    :options="categories"
                    option-label="name"
                    option-value="id"
                    :placeholder="$t('pages.admin.posts.category_placeholder')"
                    show-clear
                />
            </div>

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="tags" class="form-label mb-0">{{ $t('common.tags') }}</label>
                    <Button
                        id="ai-tags-btn"
                        v-tooltip="$t('pages.admin.posts.ai.recommend_tags')"
                        icon="pi pi-sparkles"
                        size="small"
                        text
                        rounded
                        :loading="aiLoading.tags"
                        @click="emit('recommend-tags')"
                    />
                </div>
                <AutoComplete
                    v-model="post.tags"
                    multiple
                    :suggestions="filteredTags"
                    :placeholder="$t('pages.admin.posts.tags_placeholder')"
                    @complete="emit('search-tags', $event)"
                />
                <small class="form-hint">{{ $t('pages.admin.posts.tags_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="copyright" class="form-label">{{ $t('pages.admin.posts.copyright') }}</label>
                <Select
                    id="copyright"
                    v-model="post.copyright"
                    :options="licenseOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="defaultLicenseLabel"
                    show-clear
                />
                <small class="form-hint">{{ $t('pages.admin.posts.copyright_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="visibility" class="form-label">{{ $t('pages.admin.posts.visibility') }}</label>
                <Select
                    id="visibility"
                    v-model="post.visibility"
                    :options="visibilityOptions"
                    option-label="label"
                    option-value="value"
                />
                <small class="form-hint">{{ $t('pages.admin.posts.visibility_hint') }}</small>
            </div>

            <div v-if="post.visibility === 'password'" class="form-group">
                <label for="password" class="form-label">{{ $t('pages.admin.posts.password') }}</label>
                <InputText
                    id="password"
                    v-model="post.password"
                    :placeholder="$t('pages.admin.posts.password_placeholder')"
                />
            </div>

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="summary" class="form-label mb-0">{{ $t('common.summary') }}</label>
                    <Button
                        id="ai-summary-btn"
                        v-tooltip="$t('pages.admin.posts.ai.generate_summary')"
                        icon="pi pi-sparkles"
                        size="small"
                        text
                        rounded
                        :loading="aiLoading.summary"
                        @click="emit('suggest-summary')"
                    />
                </div>
                <Textarea
                    id="summary"
                    v-model="post.summary"
                    rows="4"
                    :placeholder="$t('pages.admin.posts.summary_placeholder')"
                    class="resize-none"
                    :class="{'p-invalid': errors.summary}"
                />
                <small v-if="errors.summary" class="p-error">{{ errors.summary }}</small>
            </div>

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="cover" class="form-label mb-0">{{ $t('pages.admin.posts.cover_image') }}</label>
                    <Button
                        id="ai-cover-btn"
                        v-tooltip="$t('pages.admin.posts.ai.generate_cover')"
                        icon="pi pi-sparkles"
                        size="small"
                        text
                        rounded
                        @click="aiImageVisible = true"
                    />
                </div>
                <AppUploader
                    id="cover"
                    v-model="post.coverImage"
                    :type="UploadType.IMAGE"
                    accept="image/*"
                    placeholder="https://..."
                >
                    <template #extra>
                        <Button
                            v-if="isValidImageUrl"
                            v-tooltip="$t('common.preview')"
                            icon="pi pi-image"
                            severity="secondary"
                            text
                            @click="toggleImagePreview"
                        />
                    </template>
                </AppUploader>
                <div v-if="showImagePreview && isValidImageUrl" class="mt-2 preview-container">
                    <Image
                        :src="post.coverImage"
                        alt="Cover Preview"
                        preview
                        class="h-auto max-w-full rounded shadow-sm"
                    />
                </div>
            </div>

            <Divider />

            <AdminPostsAiImageGenerator
                v-model:visible="aiImageVisible"
                :article-title="post.title"
                :article-content="post.content"
                @generated="(url) => post.coverImage = url"
            />

            <AdminPostsPostTtsDialog
                v-model:visible="ttsVisible"
                :post-id="post.id"
                :content="post.content"
                @completed="handleTTSCompleted"
            />

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="audioUrl" class="form-label mb-0">{{ $t('pages.admin.posts.audio_url') }}</label>
                    <Button
                        id="ai-tts-btn"
                        v-tooltip="$t('admin.posts.tts.generate_title')"
                        icon="pi pi-sparkles"
                        size="small"
                        text
                        rounded
                        @click="ttsVisible = true"
                    />
                </div>
                <AppUploader
                    id="audioUrl"
                    v-model="post.audioUrl"
                    :type="UploadType.AUDIO"
                    accept="audio/*"
                    placeholder="https://... (mp3, m4a)"
                >
                    <template #extra>
                        <Button
                            v-if="isValidAudioUrl"
                            v-tooltip="showAudioPlayer ? $t('common.close') : $t('common.preview')"
                            :icon="showAudioPlayer ? 'pi pi-times' : 'pi pi-play'"
                            severity="secondary"
                            text
                            @click="toggleAudio"
                        />
                        <Button
                            v-tooltip="$t('pages.admin.posts.podcast.probe_metadata')"
                            icon="pi pi-bolt"
                            severity="secondary"
                            text
                            :loading="probing"
                            @click="probeAudio"
                        />
                    </template>
                </AppUploader>
                <div v-if="showAudioPlayer && isValidAudioUrl" class="mt-2 preview-container">
                    <audio
                        :src="post.audioUrl"
                        controls
                        class="w-full"
                    />
                </div>
            </div>

            <div v-if="post.audioUrl" class="audio-metadata-group">
                <div class="audio-metadata-row">
                    <div class="form-group">
                        <label for="audioDuration" class="form-label">{{ $t('pages.admin.posts.podcast.duration') }}</label>
                        <InputText
                            id="audioDuration"
                            v-model="displayDuration"
                            placeholder="00:00:00"
                            fluid
                        />
                        <small class="form-hint">秒数: {{ post.audioDuration || 0 }}s</small>
                    </div>
                    <div class="form-group">
                        <label for="audioSize" class="form-label">{{ $t('pages.admin.posts.podcast.size') }}</label>
                        <InputNumber
                            id="audioSize"
                            v-model="post.audioSize"
                            :min="0"
                            fluid
                        />
                        <small class="form-hint">{{ readableSize }}</small>
                    </div>
                </div>
                <div class="form-group">
                    <label for="audioMimeType" class="form-label">{{ $t('pages.admin.posts.podcast.mime_type') }}</label>
                    <InputText
                        id="audioMimeType"
                        v-model="post.audioMimeType"
                        placeholder="audio/mpeg"
                    />
                </div>
            </div>

            <Divider />

            <div class="form-group">
                <Button
                    :label="$t('pages.admin.posts.export_as_markdown')"
                    icon="pi pi-download"
                    severity="secondary"
                    outlined
                    fluid
                    :loading="exporting"
                    :disabled="!post.id"
                    @click="exportPost(post.id, post.slug)"
                />
            </div>
        </div>
        <div class="drawer-footer">
            <Button
                :label="$t('common.close')"
                text
                severity="secondary"
                @click="visible = false"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { format as bytes } from 'better-bytes'
import { secondsToDuration, durationToSeconds } from '@/utils/shared/date'
import { isValidCustomUrl } from '@/utils/shared/validate'
import { UploadType } from '@/composables/use-upload'
import { usePostExport } from '@/composables/use-post-export'

const post = defineModel<any>('post', { required: true })

const props = defineProps<{
    errors: Record<string, string>
    categories: any[]
    filteredTags: string[]
    aiLoading: any
    postsForTranslation: any[]
    languageOptions: any[]
    licenseOptions: any[]
    visibilityOptions: any[]
    defaultLicenseLabel: string
}>()

const emit = defineEmits(['search-posts', 'suggest-slug', 'recommend-tags', 'search-tags', 'suggest-summary'])

const visible = defineModel<boolean>('visible', { default: false })
const isCompact = defineModel<boolean>('compact', { default: false })

const aiImageVisible = ref(false)
const ttsVisible = ref(false)
const probing = ref(false)
const showImagePreview = ref(false)
const showAudioPlayer = ref(false)
const toast = useToast()
const { exporting, exportPost } = usePostExport()

const isValidImageUrl = computed(() => {
    return post.value.coverImage && isValidCustomUrl(post.value.coverImage)
})

const isValidAudioUrl = computed(() => {
    return post.value.audioUrl && isValidCustomUrl(post.value.audioUrl)
})

const handleTTSCompleted = () => {
    // 刷新文章数据以获取最新的音频 URL
    // 实际上我们在 processor 中已经更新了数据库，但前台的 post 对象还没变
    // 这里简单弹个窗提示，用户如果刷新页面或保存文章就能看到
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Audio generation task submitted/completed. Please save or refresh to see changes.',
        life: 5000,
    })
}

const toggleImagePreview = () => {
    showImagePreview.value = !showImagePreview.value
}

const toggleAudio = () => {
    showAudioPlayer.value = !showAudioPlayer.value
}

watch(() => post.value.coverImage, () => {
    showImagePreview.value = false
})

watch(() => post.value.audioUrl, () => {
    showAudioPlayer.value = false
})

// 人类可读的文件大小
const readableSize = computed(() => {
    if (!post.value.audioSize) return '0 B'
    return bytes(post.value.audioSize)
})

// 音频时长展示逻辑 (HH:mm:ss <-> seconds)
const displayDuration = computed({
    get: () => secondsToDuration(post.value.audioDuration),
    set: (val: string) => {
        post.value.audioDuration = durationToSeconds(val)
    },
})

const probeAudio = async () => {
    if (!post.value.audioUrl) return

    probing.value = true
    try {
        const res = await $fetch<any>('/api/admin/audio/probe', {
            query: { url: post.value.audioUrl },
        })

        if (res.code === 200 && res.data) {
            if (res.data.size) post.value.audioSize = res.data.size
            if (res.data.mimeType) post.value.audioMimeType = res.data.mimeType
            if (res.data.duration) post.value.audioDuration = res.data.duration
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Audio metadata updated',
                life: 3000,
            })
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.data?.statusMessage || 'Failed to probe audio',
            life: 3000,
        })
    } finally {
        probing.value = false
    }
}
</script>

<style lang="scss" scoped>
.settings-sidebar {
    position: fixed;
    top: 4rem; // Below header
    right: -24rem; // Hidden initially
    width: 20rem;
    height: calc(100vh - 4rem);
    background-color: var(--p-surface-card);
    border-left: 1px solid var(--p-surface-border);
    display: flex;
    flex-direction: column;
    z-index: 100;
    transition: all 0.3s ease;
    box-shadow: -2px 0 8px rgb(0 0 0 / 0.05);

    &--visible {
        right: 0;
    }

    &--compact {
        width: 14rem;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--p-surface-border);
    }

    &__actions {
        display: flex;
        gap: 0.25rem;
    }

    &__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

.settings-form {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;

    .settings-sidebar--compact & {
        padding: 1rem 0.75rem;
        gap: 1rem;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.audio-metadata-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.audio-metadata-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.form-label {
    font-weight: 500;
}

.form-hint {
    color: var(--p-surface-500);
}

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.resize-none {
    resize: none;
}

.preview-container {
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: var(--p-surface-50);
    border: 1px solid var(--p-surface-200);

    :deep(img) {
        border-radius: 0.25rem;
        display: block;
        max-height: 15rem;
        width: 100%;
        object-fit: contain;
        background-color: var(--p-surface-100);
    }

    audio {
        max-width: 100%;
        display: block;
    }
}
</style>
