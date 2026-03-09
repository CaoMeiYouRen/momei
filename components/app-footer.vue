<template>
    <footer class="footer">
        <div class="footer__container">
            <AppLogo :size="24" class="footer__logo-centered" />
            <nav class="footer__nav">
                <NuxtLink :to="localePath('/about')" class="footer__link">
                    {{ $t('common.about') }}
                </NuxtLink>
                <NuxtLink :to="localePath('friend-links')" class="footer__link">
                    {{ $t('common.friend_links') }}
                </NuxtLink>
                <NuxtLink
                    to="https://github.com/CaoMeiYouRen/momei"
                    target="_blank"
                    class="footer__link"
                >
                    GitHub
                </NuxtLink>
                <NuxtLink
                    to="https://docs.momei.app/"
                    target="_blank"
                    class="footer__link"
                >
                    {{ $t('components.footer.docs') }}
                </NuxtLink>
                <NuxtLink
                    to="/feed.xml"
                    target="_blank"
                    class="footer__link"
                >
                    {{ $t('common.rss') }}
                </NuxtLink>
                <NuxtLink
                    to="/feed/podcast.xml"
                    target="_blank"
                    class="footer__link"
                >
                    {{ $t('common.podcast_rss') }}
                </NuxtLink>
                <NuxtLink
                    to="/sitemap.xml"
                    target="_blank"
                    class="footer__link"
                >
                    {{ $t('common.sitemap') }}
                </NuxtLink>
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
                    <NuxtLink :to="localePath('friend-links')" class="footer__friend-links-more">
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
                {{ $t('components.footer.copyright') }}
            </p>
            <!-- 备案信息组件 -->
            <ComplianceInfo />
        </div>
    </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

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

  &__copyright {
    font-size: 0.875rem;
    color: var(--p-text-muted-color);
    margin-bottom: $spacing-sm;
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
