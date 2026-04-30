<template>
    <footer class="footer">
        <div class="footer__container">
            <AppLogo :size="24" class="footer__logo-centered" />
            <nav class="footer__nav">
                <NuxtLink :to="localePath('/')" class="footer__link">
                    {{ $t('common.home') }}
                </NuxtLink>
                <NuxtLink :to="localePath('/about')" class="footer__link">
                    {{ $t('common.about') }}
                </NuxtLink>
                <NuxtLink :to="localePath('/benefits')" class="footer__link">
                    {{ $t('common.enhanced_pack') }}
                </NuxtLink>
                <NuxtLink :to="localePath('/feedback')" class="footer__link">
                    {{ $t('common.feedback') }}
                </NuxtLink>
                <NuxtLink :to="localePath('/friend-links')" class="footer__link">
                    {{ $t('common.friend_links') }}
                </NuxtLink>
                <TravellingsLink placement="footer" class="footer__link footer__link--external" />
                <a
                    href="https://github.com/CaoMeiYouRen/momei"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__link footer__link--external"
                >
                    <span>GitHub</span>
                    <i class="footer__link-icon pi pi-external-link" aria-hidden="true" />
                </a>
                <a
                    href="https://docs.momei.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__link footer__link--external"
                >
                    <span>{{ $t('components.footer.docs') }}</span>
                    <i class="footer__link-icon pi pi-external-link" aria-hidden="true" />
                </a>
                <a
                    href="/feed.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__link footer__link--external"
                >
                    <span>{{ $t('common.rss') }}</span>
                    <i class="footer__link-icon pi pi-external-link" aria-hidden="true" />
                </a>
                <a
                    href="/feed/podcast.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__link footer__link--external"
                >
                    <span>{{ $t('common.podcast_rss') }}</span>
                    <i class="footer__link-icon pi pi-external-link" aria-hidden="true" />
                </a>
                <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__link footer__link--external"
                >
                    <span>{{ $t('common.sitemap') }}</span>
                    <i class="footer__link-icon pi pi-external-link" aria-hidden="true" />
                </a>
                <NuxtLink :to="localePath('/user-agreement')" class="footer__link">
                    {{ $t('legal.user_agreement') }}
                </NuxtLink>
                <NuxtLink :to="localePath('/privacy-policy')" class="footer__link">
                    {{ $t('legal.privacy_policy') }}
                </NuxtLink>
            </nav>
            <div v-if="footerFriendLinks.length > 0" class="footer__friend-links">
                <div class="footer__friend-links-header">
                    <h3 class="footer__friend-links-title">
                        {{ $t('common.featured_friend_links') }}
                    </h3>
                    <NuxtLink :to="localePath('/friend-links')" class="footer__friend-links-more">
                        {{ $t('common.view_all') }}
                    </NuxtLink>
                </div>
                <div class="footer__friend-links-list">
                    <a
                        v-for="item in footerFriendLinks"
                        :key="item.id"
                        :href="item.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="footer__friend-link"
                    >
                        <img
                            v-if="item.logo"
                            :src="item.logo"
                            :alt="item.name"
                            class="footer__friend-link-logo"
                        >
                        <span>{{ item.name }}</span>
                    </a>
                </div>
            </div>
            <p class="footer__copyright">
                <span>{{ footerCopyrightText }}</span>
                <span class="footer__copyright-separator"> · </span>

                <a
                    href="https://momei.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__link footer__link--external"
                >
                    <span>{{ footerPoweredByText }}</span>
                    <i class="footer__link-icon pi pi-external-link" aria-hidden="true" />
                </a>
            </p>
            <!-- 备案信息组件 -->
            <ComplianceInfo />
        </div>
    </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
const { currentTitle, siteConfig } = useMomeiConfig()

const { data: footerFriendLinkData } = await useAsyncData('footer-friend-links', async () => {
    try {
        const response = await $fetch<any>('/api/friend-links', {
            query: {
                featured: true,
            },
        })
        return response.data
    } catch {
        return { items: [] }
    }
})

const footerFriendLinks = computed(() => footerFriendLinkData.value?.items || [])

const footerCopyrightOwner = computed(() => {
    return siteConfig.value.siteCopyrightOwner?.trim()
        || siteConfig.value.siteOperator?.trim()
        || currentTitle.value
})

const footerCopyrightYears = computed(() => {
    const currentYear = new Date().getFullYear()
    const rawStartYear = siteConfig.value.siteCopyrightStartYear?.trim()

    if (!rawStartYear) {
        return String(currentYear)
    }

    const parsedStartYear = Number.parseInt(rawStartYear, 10)
    if (!Number.isInteger(parsedStartYear) || parsedStartYear < 1000 || parsedStartYear > currentYear) {
        return String(currentYear)
    }

    return parsedStartYear === currentYear
        ? String(currentYear)
        : `${parsedStartYear}-${currentYear}`
})

const footerCopyrightText = computed(() => `© ${footerCopyrightYears.value} ${footerCopyrightOwner.value}`)
const footerPoweredByText = computed(() => t('components.footer.powered_by', { name: t('app.name') }))
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.footer {
  padding: $spacing-xl 0;
  background-color: var(--p-surface-card);
  border-top: 1px solid var(--p-surface-border);
  color: var(--p-text-color);
  text-align: center;
  margin-top: auto;

  &__container {
    @include page-container(1440px);

    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__logo-centered {
    margin-bottom: $spacing-md;

    // Override AppLogo title font for footer
    :deep(.app-logo__title) {
      font-family: $font-serif;
    }
  }

  &__nav {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: $spacing-md $spacing-lg;
    margin-bottom: $spacing-md;
  }

  &__link {
    color: var(--p-text-muted-color);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color $transition-fast;

    &:hover {
      color: var(--p-primary-color);
      text-decoration: underline;
    }
  }

    &__link--external {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__link-icon {
        font-size: 0.7rem;
        opacity: 0.8;
    }

  &__copyright {
    font-size: 0.875rem;
    color: var(--p-text-muted-color);
    margin-bottom: $spacing-sm;
  }

    &__copyright-separator {
        opacity: 0.7;
    }

    &__friend-links {
        width: 100%;
        max-width: 900px;
        margin-bottom: $spacing-lg;
        padding: $spacing-md $spacing-lg;
        border: 1px solid var(--p-surface-border);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-surface-card) 92%, var(--p-primary-color) 8%);
    }

    &__friend-links-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: $spacing-md;
        margin-bottom: $spacing-md;

        @media (width <= 640px) {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    &__friend-links-title {
        margin: 0;
        font-size: 1rem;
        color: var(--p-text-color);
    }

    &__friend-links-more {
        color: var(--p-primary-color);
        text-decoration: none;
        font-size: 0.875rem;
    }

    &__friend-links-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: $spacing-sm;
    }

    &__friend-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.875rem;
        border-radius: 999px;
        border: 1px solid var(--p-surface-border);
        color: var(--p-text-color);
        text-decoration: none;
        background: rgb(255 255 255 / 0.7);
    }

    &__friend-link-logo {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        object-fit: cover;
    }
}
</style>
