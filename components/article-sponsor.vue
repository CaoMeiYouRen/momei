<template>
    <div v-if="hasContent" class="article-sponsor">
        <div class="article-sponsor__header" @click="isCollapsed = !isCollapsed">
            <div class="article-sponsor__title">
                <Heart class="article-sponsor__icon" :size="16" />
                {{ $t('components.post.sponsor.title') }}
            </div>
            <component
                :is="isCollapsed ? ChevronDown : ChevronUp"
                class="article-sponsor__toggle"
                :size="13"
            />
        </div>

        <div v-show="!isCollapsed" class="article-sponsor__body">
            <!-- Social Links -->
            <div v-if="displaySocialLinks.length > 0" class="article-sponsor__social">
                <div class="article-sponsor__section-title">
                    {{ $t('components.post.sponsor.social_title') }}
                </div>
                <div class="article-sponsor__social-list">
                    <template v-for="link in displaySocialLinks" :key="link.platform + (link.url || '') + (link.image || '')">
                        <a
                            v-if="link.url"
                            :href="link.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="article-sponsor__btn"
                        >
                            <component
                                :is="getPlatformIcon(link.platform, 'social')"
                                class="article-sponsor__btn-icon"
                                :size="16"
                                :style="{color: getPlatformColor(link.platform, 'social')}"
                            />
                            {{ link.label || getPlatformName(link.platform, 'social') }}
                        </a>

                        <CaomeiButton
                            v-if="link.image"
                            variant="secondary"
                            class="article-sponsor__btn"
                            @click="showQR(link, 'social')"
                        >
                            <template #icon>
                                <component
                                    :is="getQrTriggerIcon(link.platform, 'social')"
                                    class="article-sponsor__btn-icon"
                                    :size="16"
                                    :style="{color: getPlatformColor(link.platform, 'social')}"
                                />
                            </template>
                            {{ link.label || getPlatformName(link.platform, 'social') }}
                        </CaomeiButton>
                    </template>
                </div>
            </div>

            <!-- Donation Links -->
            <div v-if="displayDonationLinks.length > 0" class="article-sponsor__donation">
                <div class="article-sponsor__section-title">
                    {{ $t('components.post.sponsor.donation_title') }}
                </div>
                <div class="article-sponsor__donation-list">
                    <template v-for="link in displayDonationLinks" :key="link.platform + (link.url || '') + (link.image || '')">
                        <a
                            v-if="link.url && (getPlatformType(link.platform) === 'url' || getPlatformType(link.platform) === 'both')"
                            :href="link.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="article-sponsor__btn"
                        >
                            <component
                                :is="getPlatformIcon(link.platform, 'donation')"
                                class="article-sponsor__btn-icon"
                                :size="16"
                                :style="{color: getPlatformColor(link.platform, 'donation')}"
                            />
                            {{ link.label || getPlatformName(link.platform, 'donation') }}
                        </a>

                        <CaomeiButton
                            v-if="link.image && (getPlatformType(link.platform) === 'image' || getPlatformType(link.platform) === 'both')"
                            variant="secondary"
                            class="article-sponsor__btn"
                            @click="showQR(link, 'donation')"
                        >
                            <template #icon>
                                <component
                                    :is="getQrTriggerIcon(link.platform, 'donation')"
                                    class="article-sponsor__btn-icon"
                                    :size="16"
                                    :style="{color: getPlatformColor(link.platform, 'donation')}"
                                />
                            </template>
                            {{ link.label || getPlatformName(link.platform, 'donation') }}
                        </CaomeiButton>
                    </template>
                </div>
            </div>
        </div>

        <!-- QR Modal -->
        <CaomeiDialog
            :close-on-overlay="false"
            :open="qrVisible"
            modal
            :title="qrHeader"
            :style="{width: '300px'}"
            @update:open="qrVisible = $event"
        >
            <div class="article-sponsor__qr-modal-content">
                <img
                    :src="qrImage"
                    class="article-sponsor__qr-image"
                    alt="QR Code"
                >
                <p v-if="qrLabel" class="article-sponsor__qr-label">
                    {{ qrLabel }}
                </p>
            </div>
        </CaomeiDialog>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronDown, ChevronUp, Heart, QrCode } from '@lucide/vue'
import { rawIcon } from '@/utils/shared/brand-icons'
import type { ApiResponse } from '@/types/api'
import {
    filterCommercialLinksByLocale,
    getCommercialPlatformColor,
    getCommercialPlatformIcon,
    getDonationPlatformType,
    getSocialPlatformType,
    type SocialLink,
    type DonationLink,
    type CommercialConfig,
} from '@/utils/shared/commercial'

const props = defineProps<{
    socialLinks?: SocialLink[]
    donationLinks?: DonationLink[]
}>()

const { t, locale } = useI18n()
const isCollapsed = ref(false)
const qrVisible = ref(false)
const qrImage = ref('')
const qrHeader = ref('')
const qrLabel = ref('')

// Global settings
const { data: globalData } = await useAppFetch<ApiResponse<CommercialConfig>>('/api/settings/commercial')
const globalSocialLinks = computed<SocialLink[]>(() => globalData.value?.data?.socialLinks || [])
const globalDonationLinks = computed<DonationLink[]>(() => globalData.value?.data?.donationLinks || [])
const globalEnabled = computed(() => globalData.value?.data?.enabled !== false)

const displaySocialLinks = computed(() => {
    // 1. Author links matching current locale
    const authorLinks = props.socialLinks || []
    const filteredAuthor = filterCommercialLinksByLocale(authorLinks, locale.value)
    if (filteredAuthor.length > 0) return filteredAuthor

    // 2. Global links matching current locale (if enabled)
    if (!globalEnabled.value) return []
    return filterCommercialLinksByLocale(globalSocialLinks.value, locale.value)
})

const displayDonationLinks = computed(() => {
    // 1. Author links matching current locale
    const donationLinks = props.donationLinks || []
    const filteredAuthor = filterCommercialLinksByLocale(donationLinks, locale.value)
    if (filteredAuthor.length > 0) return filteredAuthor

    // 2. Global links matching current locale (if enabled)
    if (!globalEnabled.value) return []
    return filterCommercialLinksByLocale(globalDonationLinks.value, locale.value)
})

const hasContent = computed(() => displaySocialLinks.value.length > 0 || displayDonationLinks.value.length > 0)

const getPlatformIcon = (key: string, type: 'social' | 'donation') => getCommercialPlatformIcon(key, type)

const QR_CODE_ICON = rawIcon(QrCode)

const getPlatformColor = (key: string, type: 'social' | 'donation') => getCommercialPlatformColor(key, type)

const getPlatformName = (key: string, type: 'social' | 'donation') => {
    if (key === 'custom') return ''
    if (type === 'social') {
        return t(`common.platforms.${key}`)
    }

    return t(`components.post.sponsor.platforms.${key}`)
}

const getPlatformType = (key: string) => {
    return getDonationPlatformType(key)
}

const getQrTriggerIcon = (key: string, type: 'social' | 'donation'): Component => {
    if (key === 'custom') {
        return QR_CODE_ICON
    }

    if (type === 'social') {
        return getSocialPlatformType(key) === 'url' ? QR_CODE_ICON : getPlatformIcon(key, type)
    }

    return getDonationPlatformType(key) === 'url' ? QR_CODE_ICON : getPlatformIcon(key, type)
}

const showQR = (link: DonationLink | SocialLink, type: 'social' | 'donation') => {
    qrImage.value = link.image || ''
    qrHeader.value = link.label || getPlatformName(link.platform, type)
    qrLabel.value = type === 'social' ? t('components.post.sponsor.qr_scan_follow_tip') : t('components.post.sponsor.qr_scan_pay_tip')
    qrVisible.value = true
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.article-sponsor {
  margin: $spacing-lg 0;
  border: 1px solid var(--m-surface-200);
  border-radius: $border-radius-md;
  overflow: hidden;
  background-color: var(--m-surface-0);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--caomei-color-primary);
  }

  &__header {
    padding: $spacing-md $spacing-lg;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    background-color: var(--m-surface-50);

    &:hover {
      background-color: var(--m-surface-100);
    }
  }

  &__title {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: var(--m-surface-700);
    font-size: 1rem;
  }

  &__icon {
    color: #e91e63;
  }

  &__toggle {
    font-size: 0.8rem;
    color: var(--m-surface-400);
  }

  &__body {
    padding: $spacing-lg;
  }

  &__section-title {
    font-size: 0.8rem;
    color: var(--m-surface-500);
    margin-bottom: $spacing-md;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__social {
    margin-bottom: $spacing-lg;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__social-list, &__donation-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
  }

  &__btn {
    --caomei-button-border: var(--caomei-color-border);
    --caomei-button-text: var(--caomei-color-text);

    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
    height: var(--caomei-control-height-md);
    padding: 0 $spacing-md;
    border: 1px solid var(--caomei-button-border);
    border-radius: var(--caomei-radius-md);
    background-color: var(--caomei-color-bg);
    color: var(--caomei-button-text);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
    backface-visibility: hidden;
    will-change: transform;
    transform: translateZ(0);

    :deep(.caomei-button__content) {
      font-weight: 500;
    }

    &:hover {
      transform: translateY(-2px) translateZ(0);
      border-color: color-mix(in srgb, var(--caomei-button-border) 80%, var(--caomei-button-text));
      background-color: color-mix(in srgb, var(--caomei-button-text) 8%, var(--caomei-color-bg));
    }
  }

  &__btn-icon {
    flex-shrink: 0;
    font-size: 1rem;
  }

  &__qr-modal-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__qr-image {
    max-width: 100%;
    height: auto;
    border-radius: $border-radius-sm;
    border: 1px solid var(--m-surface-200);
  }

  &__qr-label {
    margin: $spacing-md 0 0;
    text-align: center;
    font-size: 0.875rem;
    color: var(--m-surface-700);
    line-height: 1.5;
  }
}

:global(.dark) .article-sponsor {
  background-color: var(--m-surface-900);
  border-color: var(--m-surface-700);

  &__header {
    background-color: var(--m-surface-800);

    &:hover {
       background-color: var(--m-surface-700);
    }
  }

  &__title {
    color: var(--m-surface-100);
  }

  &__qr-label,
  &__section-title {
    color: var(--m-surface-300);
  }
}
</style>
