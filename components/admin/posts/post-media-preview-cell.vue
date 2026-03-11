<template>
    <div class="post-media-cell" :class="`post-media-cell--${mode}`">
        <template v-if="mode === 'cover'">
            <div v-if="coverPreview" class="post-media-cell__cover">
                <Image
                    :src="coverPreview.coverImage || undefined"
                    :alt="t('pages.admin.posts.cover_column')"
                    preview
                    class="post-media-cell__cover-image"
                />
                <small class="post-media-cell__meta">{{ mediaLanguageLabel }}</small>
            </div>
            <div v-else class="post-media-cell__empty">
                <i class="pi pi-image" />
                <span class="post-media-cell__status">{{ t('pages.admin.posts.media.cover_missing') }}</span>
            </div>
        </template>

        <template v-else>
            <div v-if="audioPreview" class="post-media-cell__audio">
                <Button
                    :icon="isAudioOpen ? 'pi pi-times' : 'pi pi-play'"
                    text
                    rounded
                    severity="secondary"
                    :aria-label="isAudioOpen ? t('common.close') : t('common.preview')"
                    @click="toggleAudioPreview"
                />
                <small class="post-media-cell__meta">{{ audioMetaText }}</small>
                <audio
                    v-if="isAudioOpen"
                    :src="audioPreview.audioUrl || undefined"
                    controls
                    preload="none"
                    class="post-media-cell__player"
                />
            </div>
            <div v-else class="post-media-cell__empty">
                <i class="pi pi-headphones" />
                <span class="post-media-cell__status">{{ t('pages.admin.posts.media.audio_missing') }}</span>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { format as formatBytes } from 'better-bytes'
import { computed, ref, watch } from 'vue'
import { getLocaleRegistryItem } from '@/i18n/config/locale-registry'
import type { Post } from '@/types/post'
import { secondsToDuration } from '@/utils/shared/date'
import { isValidCustomUrl } from '@/utils/shared/validate'

interface ResolvedCoverPreview {
    coverImage: string
    sourceLanguage: string
}

interface ResolvedAudioPreview {
    audioUrl: string
    audioDuration: number | null
    audioSize: number | null
    sourceLanguage: string
}

const props = defineProps<{
    post: Post
    mode: 'cover' | 'audio'
    preferredLocale?: string | null
}>()

const { t } = useI18n()

const isAudioOpen = ref(false)

const preferredLocale = computed(() => props.preferredLocale || 'zh-CN')

const translationCandidates = computed(() => {
    const candidates = [props.post, ...(props.post.translations || [])]
    const seenIds = new Set<string>()

    return candidates.filter((candidate): candidate is Post => {
        if (!candidate?.id || seenIds.has(candidate.id)) {
            return false
        }

        seenIds.add(candidate.id)
        return true
    })
})

function resolveMediaCandidate(predicate: (candidate: Post) => boolean) {
    const candidates = translationCandidates.value
    const fallbackChain = getLocaleRegistryItem(preferredLocale.value).fallbackChain

    for (const localeCode of fallbackChain) {
        const match = candidates.find((candidate) => candidate.language === localeCode && predicate(candidate))
        if (match) {
            return match
        }
    }

    return candidates.find((candidate) => predicate(candidate)) || null
}

function resolveAudioUrl(post: Post) {
    return post.metadata?.audio?.url ?? post.audioUrl ?? null
}

function resolveAudioDuration(post: Post) {
    return post.metadata?.audio?.duration ?? post.audioDuration ?? null
}

function resolveAudioSize(post: Post) {
    return post.metadata?.audio?.size ?? post.audioSize ?? null
}

const coverPreview = computed<ResolvedCoverPreview | null>(() => {
    const candidate = resolveMediaCandidate((item) => Boolean(item.coverImage) && isValidCustomUrl(item.coverImage))
    if (!candidate?.coverImage) {
        return null
    }

    return {
        coverImage: candidate.coverImage,
        sourceLanguage: candidate.language,
    }
})

const audioPreview = computed<ResolvedAudioPreview | null>(() => {
    const candidate = resolveMediaCandidate((item) => Boolean(resolveAudioUrl(item)) && isValidCustomUrl(resolveAudioUrl(item)))
    const audioUrl = candidate ? resolveAudioUrl(candidate) : null
    if (!candidate || !audioUrl) {
        return null
    }

    return {
        audioUrl,
        audioDuration: resolveAudioDuration(candidate),
        audioSize: resolveAudioSize(candidate),
        sourceLanguage: candidate.language,
    }
})

const mediaLanguageLabel = computed(() => {
    const sourceLanguage = props.mode === 'cover'
        ? coverPreview.value?.sourceLanguage
        : audioPreview.value?.sourceLanguage

    if (!sourceLanguage) {
        return ''
    }

    return t(`common.languages.${sourceLanguage}`)
})

const audioMetaText = computed(() => {
    if (!audioPreview.value) {
        return ''
    }

    const detailParts = [mediaLanguageLabel.value]

    if (audioPreview.value.audioDuration) {
        detailParts.push(secondsToDuration(audioPreview.value.audioDuration))
    }

    if (audioPreview.value.audioSize) {
        detailParts.push(formatBytes(audioPreview.value.audioSize))
    }

    return detailParts.join(' / ')
})

const toggleAudioPreview = () => {
    if (!audioPreview.value) {
        return
    }

    isAudioOpen.value = !isAudioOpen.value
}

watch(() => props.post.id, () => {
    isAudioOpen.value = false
})

watch(audioPreview, () => {
    isAudioOpen.value = false
})
</script>

<style scoped lang="scss">
.post-media-cell {
    display: flex;
    justify-content: center;

    &__cover,
    &__audio,
    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
    }

    &__cover-image {
        :deep(img) {
            width: 4.5rem;
            height: 2.75rem;
            object-fit: cover;
            border-radius: 0.5rem;
            border: 1px solid var(--p-content-border-color);
        }
    }

    &__status {
        font-size: 0.75rem;
        color: var(--p-text-color);
        line-height: 1.2;
    }

    &__meta {
        max-width: 10rem;
        font-size: 0.7rem;
        color: var(--p-text-muted-color);
        line-height: 1.3;
        text-align: center;
    }

    &__empty {
        color: var(--p-text-muted-color);
    }

    &__player {
        width: 12rem;
        max-width: 100%;
    }
}
</style>
