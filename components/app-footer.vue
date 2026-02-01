<template>
    <footer class="footer">
        <div class="footer__container">
            <AppLogo :size="24" class="footer__logo-centered" />
            <nav class="footer__nav">
                <NuxtLink :to="localePath('/about')" class="footer__link">
                    {{ $t('common.about') }}
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
const { siteLogo, currentTitle } = useMomeiConfig()
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.footer {
  padding: $spacing-xl $spacing-md;
  background-color: var(--p-surface-card);
  border-top: 1px solid var(--p-surface-border);
  color: var(--p-text-color);
  text-align: center;
  margin-top: auto;

  &__container {
    @include page-container;

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
}
</style>
