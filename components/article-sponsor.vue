<template>
    <div v-if="hasContent" class="article-sponsor">
        <div class="article-sponsor__header" @click="isCollapsed = !isCollapsed">
            <div class="article-sponsor__title">
                <i class="article-sponsor__icon pi pi-heart-fill" />
                {{ $t('components.post.sponsor.title') }}
            </div>
            <i :class="['pi', isCollapsed ? 'pi-chevron-down' : 'pi-chevron-up', 'article-sponsor__toggle']" />
        </div>

        <div v-show="!isCollapsed" class="article-sponsor__body">
            <!-- Social Links -->
            <div v-if="displaySocialLinks.length > 0" class="article-sponsor__social">
                <div class="article-sponsor__section-title">
                    {{ $t('components.post.sponsor.social_title') }}
                </div>
                <div class="article-sponsor__social-list">
                    <template v-for="link in displaySocialLinks" :key="link.platform + (link.url || link.image)">
                        <!-- URL Link -->
                        <Button
                            v-if="!link.image"
                            as="a"
                            :href="link.url"
                            target="_blank"
                            severity="secondary"
                            outlined
                            class="article-sponsor__btn"
                        >
                            <i :class="[getPlatformIcon(link.platform, 'social'), 'mr-2']" :style="{color: getPlatformColor(link.platform, 'social')}" />
                            {{ link.label || getPlatformName(link.platform, 'social') }}
                        </Button>

                        <!-- Image/QR Code -->
                        <Button
                            v-else
                            severity="secondary"
                            outlined
                            class="article-sponsor__btn"
                            @click="showQR(link, 'social')"
                        >
                            <i :class="[getPlatformIcon(link.platform, 'social'), 'mr-2']" :style="{color: getPlatformColor(link.platform, 'social')}" />
                            {{ link.label || getPlatformName(link.platform, 'social') }}
                        </Button>
                    </template>
                </div>
            </div>

            <!-- Donation Links -->
            <div v-if="displayDonationLinks.length > 0" class="article-sponsor__donation">
                <div class="article-sponsor__section-title">
                    {{ $t('components.post.sponsor.donation_title') }}
                </div>
                <div class="article-sponsor__donation-list">
                    <template v-for="link in displayDonationLinks" :key="link.platform + (link.url || link.image)">
                        <!-- URL Type -->
                        <Button
                            v-if="getPlatformType(link.platform) === 'url' || (getPlatformType(link.platform) === 'both' && link.url)"
                            as="a"
                            :href="link.url"
                            target="_blank"
                            severity="secondary"
                            outlined
                            class="article-sponsor__btn"
                        >
                            <i :class="[getPlatformIcon(link.platform, 'donation'), 'mr-2']" :style="{color: getPlatformColor(link.platform, 'donation')}" />
                            {{ link.label || getPlatformName(link.platform, 'donation') }}
                        </Button>

                        <!-- Image Type (or QR button) -->
                        <template v-else-if="link.image">
                            <Button
                                severity="secondary"
                                outlined
                                class="article-sponsor__btn"
                                @click="showQR(link, 'donation')"
                            >
                                <i :class="[getPlatformIcon(link.platform, 'donation'), 'mr-2']" :style="{color: getPlatformColor(link.platform, 'donation')}" />
                                {{ link.label || getPlatformName(link.platform, 'donation') }}
                            </Button>
                        </template>
                    </template>
                </div>
            </div>
        </div>

        <!-- QR Modal -->
        <Dialog
            v-model:visible="qrVisible"
            modal
            :header="qrHeader"
            :style="{width: '300px'}"
        >
            <div class="article-sponsor__qr-modal-content">
                <img
                    :src="qrImage"
                    class="article-sponsor__qr-image"
                    alt="QR Code"
                >
                <p v-if="qrLabel" class="mt-4 text-center text-sm text-surface-500">
                    {{ qrLabel }}
                </p>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { SOCIAL_PLATFORMS, DONATION_PLATFORMS, type SocialLink, type DonationLink } from '@/utils/shared/commercial'

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
const { data: globalData } = await useAppFetch<any>('/api/settings/commercial')
const globalSocialLinks = computed<SocialLink[]>(() => globalData.value?.data?.socialLinks || [])
const globalDonationLinks = computed<DonationLink[]>(() => globalData.value?.data?.donationLinks || [])
const globalEnabled = computed(() => globalData.value?.data?.enabled !== false)

const filterByLocale = (links: any[]) => {
    if (!Array.isArray(links)) return []
    return links.filter((link) => !link.locales || link.locales.length === 0 || link.locales.includes(locale.value))
}

const displaySocialLinks = computed(() => {
    // 1. Author links matching current locale
    const authorLinks = props.socialLinks || []
    const filteredAuthor = filterByLocale(authorLinks)
    if (filteredAuthor.length > 0) return filteredAuthor

    // 2. Global links matching current locale (if enabled)
    if (!globalEnabled.value) return []
    return filterByLocale(globalSocialLinks.value)
})

const displayDonationLinks = computed(() => {
    // 1. Author links matching current locale
    const donationLinks = props.donationLinks || []
    const filteredAuthor = filterByLocale(donationLinks)
    if (filteredAuthor.length > 0) return filteredAuthor

    // 2. Global links matching current locale (if enabled)
    if (!globalEnabled.value) return []
    return filterByLocale(globalDonationLinks.value)
})

const hasContent = computed(() => displaySocialLinks.value.length > 0 || displayDonationLinks.value.length > 0)

const getPlatformIcon = (key: string, type: 'social' | 'donation') => {
    const list = type === 'social' ? SOCIAL_PLATFORMS : DONATION_PLATFORMS
    const platform = list.find((p) => p.key === key)
    return platform?.icon || 'pi pi-link'
}

const getPlatformColor = (key: string, type: 'social' | 'donation') => {
    const list = type === 'social' ? SOCIAL_PLATFORMS : DONATION_PLATFORMS
    const platform = list.find((p) => p.key === key)
    return platform?.color || 'inherit'
}

const getPlatformName = (key: string, type: 'social' | 'donation') => {
    if (key === 'custom') return ''
    return t(`components.post.sponsor.platforms.${key}`)
}

const getPlatformType = (key: string) => {
    return DONATION_PLATFORMS.find((p) => p.key === key)?.type || 'url'
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
  border: 1px solid var(--p-surface-200);
  border-radius: $border-radius-md;
  overflow: hidden;
  background-color: var(--p-surface-0);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--p-primary-color);
  }

  &__header {
    padding: $spacing-md $spacing-lg;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    background-color: var(--p-surface-50);

    &:hover {
      background-color: var(--p-surface-100);
    }
  }

  &__title {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: var(--p-surface-700);
    font-size: 1rem;
  }

  &__icon {
    color: #e91e63;
  }

  &__toggle {
    font-size: 0.8rem;
    color: var(--p-surface-400);
  }

  &__body {
    padding: $spacing-lg;
  }

  &__section-title {
    font-size: 0.8rem;
    color: var(--p-surface-500);
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
    font-size: 0.9rem;
    transition: transform 0.2s ease;
    backface-visibility: hidden;
    will-change: transform;
    transform: translateZ(0);

    &:hover {
      transform: translateY(-2px) translateZ(0);
    }
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
    border: 1px solid var(--p-surface-200);
  }
}

:global(.dark) .article-sponsor {
  background-color: var(--p-surface-900);
  border-color: var(--p-surface-700);

  &__header {
    background-color: var(--p-surface-800);

    &:hover {
       background-color: var(--p-surface-700);
    }
  }

  &__title {
    color: var(--p-surface-100);
  }
}
</style>
