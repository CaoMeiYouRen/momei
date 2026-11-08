<template>
    <section class="article-share" :aria-labelledby="headingId">
        <div class="article-share__header">
            <div class="article-share__content">
                <p class="article-share__eyebrow">
                    {{ $t('components.post.share.eyebrow') }}
                </p>
                <h2 :id="headingId" class="article-share__title">
                    {{ $t('components.post.share.title') }}
                </h2>
            </div>

            <div class="article-share__actions">
                <CaomeiButton
                    class="article-share__action-btn"
                    data-testid="article-share-primary"
                    @click="handlePrimaryShare"
                >
                    <template #icon>
                        <Share2 class="article-share__action-icon" :size="16" />
                    </template>
                    {{ primaryActionLabel }}
                </CaomeiButton>

                <CaomeiButton
                    variant="secondary"
                    class="article-share__action-btn article-share__secondary-btn"
                    data-testid="article-share-copy-link"
                    @click="copyShareContent('link')"
                >
                    <template #icon>
                        <Link2 class="article-share__action-icon" :size="16" />
                    </template>
                    {{ $t('components.post.share.copy_link') }}
                </CaomeiButton>
            </div>
        </div>

        <CaomeiDialog
            :close-on-overlay="false"
            :open="dialogVisible"
            modal
            :title="$t('components.post.share.dialog_title')"
            class="article-share__dialog"
            @update:open="dialogVisible = $event"
        >
            <div class="article-share__dialog-body">
                <section class="article-share__section">
                    <div class="article-share__section-header">
                        <h3 class="article-share__section-title">
                            {{ $t('components.post.share.direct_title') }}
                        </h3>
                        <p class="article-share__section-desc">
                            {{ $t('components.post.share.direct_description') }}
                        </p>
                    </div>

                    <div class="article-share__platform-grid">
                        <CaomeiButton
                            v-for="platform in directPlatforms"
                            :key="platform.key"
                            variant="secondary"
                            class="article-share__platform-btn"
                            :data-platform="platform.key"
                            :style="{'--article-share-platform-color': platform.color}"
                            @click="openDirectShare(platform.key)"
                        >
                            <template #icon>
                                <component
                                    :is="platform.icon"
                                    class="article-share__platform-icon"
                                    :size="16"
                                />
                            </template>
                            {{ getPlatformLabel(platform.key) }}
                        </CaomeiButton>
                    </div>
                </section>

                <section class="article-share__section">
                    <div class="article-share__section-header">
                        <h3 class="article-share__section-title">
                            {{ $t('components.post.share.copy_title') }}
                        </h3>
                        <p class="article-share__section-desc">
                            {{ $t('components.post.share.copy_description') }}
                        </p>
                    </div>

                    <div class="article-share__copy-actions">
                        <CaomeiButton
                            variant="secondary"
                            class="article-share__platform-btn article-share__secondary-btn"
                            data-testid="article-share-copy-rich"
                            @click="copyShareContent('rich')"
                        >
                            <template #icon>
                                <FileText class="article-share__platform-icon" :size="16" />
                            </template>
                            {{ $t('components.post.share.copy_rich_text') }}
                        </CaomeiButton>
                    </div>

                    <div class="article-share__platform-grid">
                        <CaomeiButton
                            v-for="platform in copyPlatforms"
                            :key="platform.key"
                            variant="secondary"
                            class="article-share__platform-btn"
                            :data-platform="platform.key"
                            :style="{'--article-share-platform-color': platform.color}"
                            @click="copyPlatformShare(platform.key)"
                        >
                            <template #icon>
                                <component
                                    :is="platform.icon"
                                    class="article-share__platform-icon"
                                    :size="16"
                                />
                            </template>
                            {{ getPlatformLabel(platform.key) }}
                        </CaomeiButton>
                    </div>
                </section>
            </div>
        </CaomeiDialog>
    </section>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { FileText, Link2, Share2 } from '@lucide/vue'
import {
    buildDirectShareUrl,
    buildShareCopyText,
    COPY_SHARE_PLATFORMS,
    DIRECT_SHARE_PLATFORMS,
    type ShareCopyMode,
    type SharePayload,
    type SharePlatformKey,
} from '@/utils/shared/share'

const props = defineProps<{
    title: string
    text?: string | null
    url: string
    image?: string | null
}>()

const { t, locale } = useI18n()
const toast = useToast()
const dialogVisible = ref(false)
const canUseNativeShare = ref(false)
const headingId = useId()

const sharePayload = computed<SharePayload>(() => ({
    pageKind: 'post',
    title: props.title.trim(),
    text: (props.text || '').trim(),
    url: props.url,
    image: props.image || null,
    locale: locale.value,
}))

const directPlatforms = DIRECT_SHARE_PLATFORMS
const copyPlatforms = COPY_SHARE_PLATFORMS

const primaryActionLabel = computed(() => canUseNativeShare.value
    ? t('components.post.share.native_share')
    : t('components.post.share.open_panel'))

const shareScopedPlatformKeys = new Set<SharePlatformKey>(['wechat_mp'])

function refreshNativeShareCapability() {
    if (!import.meta.client) {
        canUseNativeShare.value = false
        return
    }

    canUseNativeShare.value = typeof navigator.share === 'function'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 768px)').matches
}

function showSuccess(detail: string) {
    toast.show({ tone: 'success', title: t('common.success'), description: detail, duration: 2000 })
}

function showError(detail: string) {
    toast.show({ tone: 'danger', title: t('common.error'), description: detail, duration: 2500 })
}

function getPlatformLabel(platform: SharePlatformKey) {
    return shareScopedPlatformKeys.has(platform)
        ? t(`components.post.share.platforms.${platform}`)
        : t(`common.platforms.${platform}`)
}

async function copyText(content: string, successDetail: string) {
    try {
        await navigator.clipboard.writeText(content)
        showSuccess(successDetail)
    } catch {
        showError(t('common.copy_failed'))
    }
}

async function copyShareContent(mode: ShareCopyMode) {
    await copyText(
        buildShareCopyText(sharePayload.value, mode),
        mode === 'link' ? t('common.copy_success') : t('components.post.share.copy_text_success'),
    )
}

async function copyPlatformShare(platform: SharePlatformKey) {
    const item = copyPlatforms.find((entry) => entry.key === platform)

    await copyText(
        buildShareCopyText(sharePayload.value, item?.copyMode || 'link'),
        t('components.post.share.copy_platform_success', { platform: getPlatformLabel(platform) }),
    )
}

function openDirectShare(platform: SharePlatformKey) {
    window.open(buildDirectShareUrl(platform, sharePayload.value), '_blank', 'noopener,noreferrer')
}

async function handlePrimaryShare() {
    if (canUseNativeShare.value) {
        try {
            await navigator.share({
                title: sharePayload.value.title,
                text: sharePayload.value.text,
                url: sharePayload.value.url,
            })
            return
        } catch {
            // 用户取消原生分享时回退到站内面板。
        }
    }

    dialogVisible.value = true
}

onMounted(() => {
    refreshNativeShareCapability()
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.article-share {
    margin: $spacing-xl 0;
    padding: $spacing-lg;
    border: 1px solid var(--m-surface-200);
    border-radius: $border-radius-lg;
    background:
        radial-gradient(circle at top right, rgb(100 116 139 / 0.08), transparent 32%),
        linear-gradient(180deg, var(--m-surface-50) 0%, var(--m-surface-0) 100%);

    &__header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: $spacing-lg;
    }

    &__content {
        flex: 1 1 20rem;
    }

    &__eyebrow {
        margin: 0 0 $spacing-xs;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--caomei-color-primary);
    }

    &__title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--caomei-color-text);
    }

    &__actions {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;
        align-items: flex-start;
    }

    &__action-btn,
    &__platform-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: $spacing-sm;
    }

    &__action-btn {
        :deep(.caomei-button__content) {
            font-weight: 600;
        }
    }

    &__platform-btn {
        --article-share-platform-color: var(--caomei-color-primary);
        --caomei-button-border: var(--caomei-color-border);
        --caomei-button-text: var(--caomei-color-text);

        :deep(.caomei-button__content) {
            font-weight: 500;
        }
    }

    &__secondary-btn {
        --caomei-button-border: var(--caomei-color-border);
        --caomei-button-text: var(--caomei-color-text);
    }

    &__action-icon,
    &__platform-icon {
        font-size: 1rem;
    }

    &__platform-icon {
        color: var(--article-share-platform-color);
    }

    &__dialog-body {
        display: flex;
        flex-direction: column;
        gap: $spacing-lg;
    }

    &__section {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
    }

    &__section-header {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__section-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--caomei-color-text);
    }

    &__section-desc {
        margin: 0;
        font-size: 0.875rem;
        color: var(--m-surface-700);
        line-height: 1.6;
    }

    &__copy-actions,
    &__platform-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: $spacing-sm;

        @media (width >= 768px) {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    :global(.dark) & {
        border-color: var(--m-surface-700);
        background:
            radial-gradient(circle at top right, rgb(148 163 184 / 0.12), transparent 34%),
            linear-gradient(180deg, var(--m-surface-800) 0%, var(--m-surface-900) 100%);

        .article-share__section-desc {
            color: var(--m-surface-300);
        }

    }
}
</style>
