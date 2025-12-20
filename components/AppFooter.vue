<template>
    <footer class="footer">
        <div class="container">
            <div class="footer__logo">
                <div class="footer__logo-icon">
                    <span class="footer__logo-text">梅</span>
                </div>
                <span class="footer__title">墨梅</span>
            </div>
            <p class="footer__copyright">
                &copy; 2025 墨梅博客 - 轻量创作，自在表达
            </p>
        </div>
    </footer>
</template>

<style lang="scss" scoped>
$color-ink: #2D3748;
$color-white: #fff;
$font-serif: '"Noto Serif SC"', 'serif';

.footer {
  padding: 2rem 1rem;
  background-color: $color-ink;
  color: $color-white;
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
    background-color: $color-white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__logo-text {
    color: $color-ink;
    font-family: $font-serif;
    font-size: 0.875rem;
  }

  &__title {
    font-family: $font-serif;
  }

  &__copyright {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
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
