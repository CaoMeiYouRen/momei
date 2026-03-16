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
            :article-summary="post.summary ?? ''"
            :article-content="post.content"
            :language="post.language"
            :post-id="post.id"
            :translation-id="post.translationId"
            @generated="handleCoverGenerated"
        />

        <AdminPostsPostTtsDialog
            v-model:visible="ttsVisible"
            :post-id="post.id"
            :content="post.content"
            :language="post.language"
            :translation-id="post.translationId"
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

const clearCoverAsset = () => {
    if (!post.value.metadata || typeof post.value.metadata !== 'object') {
        return
    }

    delete post.value.metadata.cover
}

const syncCoverMetadata = (url: string | null | undefined, options: {
    source: 'ai' | 'manual'
    prompt?: string | null
    generatedAt?: Date | null
} = { source: 'manual' }) => {
    if (!url) {
        clearCoverAsset()
        return
    }

    const metadata = ensureMetadata()
    const existingCover = metadata.cover

    metadata.cover = {
        url,
        source: options.source,
        prompt: options.source === 'ai' ? (options.prompt ?? existingCover?.prompt ?? null) : null,
        language: post.value.language,
        translationId: post.value.translationId ?? null,
        postId: post.value.id ?? null,
        generatedAt: options.source === 'ai' ? (options.generatedAt ?? new Date()) : null,
    }
}

const clearAudioAsset = () => {
    if (post.value.metadata && typeof post.value.metadata === 'object') {
        delete post.value.metadata.audio
        delete post.value.metadata.tts
    }

    post.value.audioUrl = null
    post.value.audioDuration = null
    post.value.audioSize = null
    post.value.audioMimeType = null
}

const syncAudioAsset = (url: string | null | undefined, options: {
    clearTtsBinding?: boolean
    mode?: 'speech' | 'podcast' | null
    provider?: string | null
    voice?: string | null
    generatedAt?: Date | null
} = {}) => {
    if (!url) {
        clearAudioAsset()
        return
    }

    const previousUrl = audioUrlValue.value
    const isSameUrl = previousUrl === url
    const metadata = ensureMetadata()
    const nextMode = options.mode === undefined
        ? metadata.audio?.mode ?? null
        : options.mode

    metadata.audio = {
        ...metadata.audio,
        url,
        duration: isSameUrl ? (metadata.audio?.duration ?? post.value.audioDuration ?? null) : null,
        size: isSameUrl ? (metadata.audio?.size ?? post.value.audioSize ?? null) : null,
        mimeType: isSameUrl ? (metadata.audio?.mimeType ?? post.value.audioMimeType ?? null) : null,
        language: post.value.language,
        translationId: post.value.translationId ?? null,
        postId: post.value.id ?? null,
        mode: nextMode,
    }

    if (options.clearTtsBinding) {
        delete metadata.tts
    } else if (options.provider || options.voice || nextMode || metadata.tts) {
        metadata.tts = {
            ...metadata.tts,
            provider: options.provider ?? metadata.tts?.provider ?? null,
            voice: options.voice ?? metadata.tts?.voice ?? null,
            generatedAt: options.generatedAt ?? metadata.tts?.generatedAt ?? new Date(),
            language: post.value.language,
            translationId: post.value.translationId ?? null,
            postId: post.value.id ?? null,
            mode: nextMode,
        }
    }

    post.value.audioUrl = url
    post.value.audioDuration = metadata.audio.duration ?? null
    post.value.audioSize = metadata.audio.size ?? null
    post.value.audioMimeType = metadata.audio.mimeType ?? null
}

const audioUrlValue = computed<string | null>(() => post.value.metadata?.audio?.url ?? post.value.audioUrl ?? null)

const isValidAudioUrl = computed(() => {
    return typeof audioUrlValue.value === 'string' && isValidCustomUrl(audioUrlValue.value)
})

const audioUrlModel = computed<string | null>({
    get: () => audioUrlValue.value,
    set: (value: string | null | undefined) => {
        syncAudioAsset(value, {
            clearTtsBinding: value ? value !== audioUrlValue.value : true,
            mode: value && value === audioUrlValue.value
                ? (post.value.metadata?.audio?.mode ?? null)
                : null,
        })
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

const handleCoverGenerated = (url: string) => {
    if (!url) {
        return
    }

    post.value.coverImage = url
    syncCoverMetadata(url, { source: 'ai', generatedAt: new Date() })
}

const handleTTSCompleted = (payload: {
    audioUrl: string
    provider: string
    voice: string
    mode: 'speech' | 'podcast'
}) => {
    if (payload.audioUrl) {
        syncAudioAsset(payload.audioUrl, {
            mode: payload.mode,
            provider: payload.provider,
            voice: payload.voice,
            generatedAt: new Date(),
        })
        void probeAudio(payload.audioUrl)
    }

    showSuccessToast('pages.admin.posts.tts.attach_success')
}

const toggleImagePreview = () => {
    showImagePreview.value = !showImagePreview.value
}

const toggleAudio = () => {
    showAudioPlayer.value = !showAudioPlayer.value
}

watch(() => post.value.coverImage, (nextValue, previousValue) => {
    showImagePreview.value = false

    if (nextValue === previousValue) {
        return
    }

    if (!nextValue) {
        clearCoverAsset()
        return
    }

    if (post.value.metadata?.cover?.url === nextValue) {
        return
    }

    syncCoverMetadata(nextValue, { source: 'manual' })
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

const probeAudio = async (input?: string | Event | null) => {
    const targetUrl = typeof input === 'string' ? input : audioUrlValue.value

    if (!targetUrl) return

    probing.value = true
    try {
        const res = await $fetch<any>('/api/admin/audio/probe', {
            query: { url: targetUrl },
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
