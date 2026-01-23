<template>
    <footer class="footer">
        <div class="container">
            <NuxtLink :to="localePath('/')" class="footer__logo">
                <img
                    src="/logo.png"
                    alt="Momei Logo"
                    class="footer__logo-img"
                >
                <span class="footer__title">{{ $t('components.footer.title') }}</span>
            </NuxtLink>
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
</script>

<style lang="scss" scoped>
$font-serif: '"Noto Serif SC"', 'serif';

.footer {
  padding: 2rem 1rem;
  background-color: var(--p-surface-card);
  border-top: 1px solid var(--p-surface-border);
  color: var(--p-text-color);
  text-align: center;
  margin-top: auto;

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    text-decoration: none;
    color: inherit;
  }

  &__logo-img {
    width: 1.5rem;
    height: 1.5rem;
  }

  &__title {
    font-family: $font-serif;
    font-weight: 600;
  }

  &__nav {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  &__link {
    color: var(--p-text-muted-color);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;

    &:hover {
      color: var(--p-primary-color);
      text-decoration: underline;
    }
  }

  &__copyright {
    font-size: 0.875rem;
    color: var(--p-text-muted-color);
  }
}
</style>
