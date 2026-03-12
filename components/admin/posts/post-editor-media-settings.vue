<template>
    <div class="post-editor-media-settings">
        <Divider />

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
                :post-id="post.id"
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
                    :src="post.coverImage ?? undefined"
                    alt="Cover Preview"
                    preview
                    class="h-auto max-w-full rounded shadow-sm"
                />
            </div>
        </div>

        <AdminPostsAiImageGenerator
            v-model:visible="aiImageVisible"
            :article-title="post.title"
            :article-content="post.content"
            :post-id="post.id"
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
                    v-tooltip="$t('pages.admin.posts.tts.generate_title')"
                    icon="pi pi-sparkles"
                    size="small"
                    text
                    rounded
                    @click="ttsVisible = true"
                />
            </div>
            <AppUploader
                id="audioUrl"
                v-model="audioUrlModel"
                :type="UploadType.AUDIO"
                :post-id="post.id"
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
                    :src="audioUrlValue ?? undefined"
                    controls
                    class="w-full"
                />
            </div>
        </div>

        <div v-if="audioUrlValue" class="audio-metadata-group">
            <div class="audio-metadata-row">
                <div class="form-group">
                    <label for="audioDuration" class="form-label">{{ $t('pages.admin.posts.podcast.duration') }}</label>
                    <InputText
                        id="audioDuration"
                        v-model="displayDuration"
                        placeholder="00:00:00"
                        fluid
                    />
                    <small class="form-hint">秒数: {{ audioDurationModel || 0 }}s</small>
                </div>
                <div class="form-group">
                    <label for="audioSize" class="form-label">{{ $t('pages.admin.posts.podcast.size') }}</label>
                    <InputNumber
                        id="audioSize"
                        v-model="audioSizeModel"
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
                    v-model="audioMimeTypeModel"
                    placeholder="audio/mpeg"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { format as bytes } from 'better-bytes'
import { secondsToDuration, durationToSeconds } from '@/utils/shared/date'
import { isValidCustomUrl } from '@/utils/shared/validate'
import { UploadType } from '@/composables/use-upload'
import type { PostEditorData } from '@/types/post-editor'

const post = defineModel<PostEditorData>('post', { required: true })

const aiImageVisible = ref(false)
const ttsVisible = ref(false)
const probing = ref(false)
const showImagePreview = ref(false)
const showAudioPlayer = ref(false)

const { showErrorToast, showSuccessToast } = useRequestFeedback()

const isValidImageUrl = computed(() => {
    return typeof post.value.coverImage === 'string' && isValidCustomUrl(post.value.coverImage)
})

const ensureMetadata = () => {
    if (!post.value.metadata || typeof post.value.metadata !== 'object') {
        post.value.metadata = {}
    }

    if (!post.value.metadata.audio || typeof post.value.metadata.audio !== 'object') {
        post.value.metadata.audio = {}
    }

    return post.value.metadata
}

const audioUrlValue = computed<string | null>(() => post.value.metadata?.audio?.url ?? post.value.audioUrl ?? null)

const isValidAudioUrl = computed(() => {
    return typeof audioUrlValue.value === 'string' && isValidCustomUrl(audioUrlValue.value)
})

const audioUrlModel = computed<string | null>({
    get: () => audioUrlValue.value,
    set: (value: string | null | undefined) => {
        const metadata = ensureMetadata()
        metadata.audio = {
            ...metadata.audio,
            url: value || null,
        }
        post.value.audioUrl = value || null
    },
})

const audioDurationModel = computed<number | null>({
    get: () => post.value.metadata?.audio?.duration ?? post.value.audioDuration ?? null,
    set: (value: number | null | undefined) => {
        const metadata = ensureMetadata()
        metadata.audio = {
            ...metadata.audio,
            duration: value ?? null,
        }
        post.value.audioDuration = value ?? null
    },
})

const audioSizeModel = computed<number | null>({
    get: () => post.value.metadata?.audio?.size ?? post.value.audioSize ?? null,
    set: (value: number | null | undefined) => {
        const metadata = ensureMetadata()
        metadata.audio = {
            ...metadata.audio,
            size: value ?? null,
        }
        post.value.audioSize = value ?? null
    },
})

const audioMimeTypeModel = computed<string | null>({
    get: () => post.value.metadata?.audio?.mimeType ?? post.value.audioMimeType ?? null,
    set: (value: string | null | undefined) => {
        const metadata = ensureMetadata()
        metadata.audio = {
            ...metadata.audio,
            mimeType: value || null,
        }
        post.value.audioMimeType = value || null
    },
})

const handleTTSCompleted = (url: string) => {
    if (url) {
        audioUrlModel.value = url
        void probeAudio()
    }

    showSuccessToast('pages.admin.posts.tts.attach_success')
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

watch(audioUrlValue, () => {
    showAudioPlayer.value = false
})

const readableSize = computed(() => {
    if (!audioSizeModel.value) return '0 B'
    return bytes(audioSizeModel.value)
})

const displayDuration = computed({
    get: () => secondsToDuration(audioDurationModel.value),
    set: (value: string) => {
        audioDurationModel.value = durationToSeconds(value)
    },
})

const probeAudio = async () => {
    if (!audioUrlValue.value) return

    probing.value = true
    try {
        const res = await $fetch<any>('/api/admin/audio/probe', {
            query: { url: audioUrlValue.value },
        })

        if (res.code === 200 && res.data) {
            if (res.data.size) audioSizeModel.value = res.data.size
            if (res.data.mimeType) audioMimeTypeModel.value = res.data.mimeType
            if (res.data.duration) audioDurationModel.value = res.data.duration
            showSuccessToast('pages.admin.posts.podcast.probe_metadata_success')
        }
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.posts.podcast.probe_metadata_failed' })
    } finally {
        probing.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/admin-form" as *;

.form-group {
    @include admin-form-stack(0.375rem);
}

.audio-metadata-group {
    @include admin-detail-stack;
}

.audio-metadata-row {
    @include admin-detail-grid;
}

.form-label {
    @include admin-form-label($weight: 500, $size: null, $margin-bottom: 0);
}

.form-hint {
    @include admin-form-hint($color: var(--p-surface-500));
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
