<template>
    <footer class="footer">
        <div class="container">
            <div class="footer__logo">
                <div class="footer__logo-icon">
                    <span class="footer__logo-text">梅</span>
                </div>
                <span class="footer__title">墨梅</span>
            </div>
            <nav class="footer__nav">
                <NuxtLink :to="localePath('/about')" class="footer__link">
                    {{ $t('common.about') }}
                </NuxtLink>
            </nav>
            <p class="footer__copyright">
                &copy; 2025 墨梅博客 - 轻量创作，自在表达
            </p>
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
  }

  &__logo-icon {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 9999px;
    background-color: var(--p-primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__logo-text {
    color: var(--p-primary-contrast-color);
    font-family: $font-serif;
    font-size: 0.875rem;
  }

  &__title {
    font-family: $font-serif;
    font-weight: 600;
  }

  &__nav {
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

.container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: 1rem;
  padding-left: 1rem;
  max-width: 1200px;
}
</style>
