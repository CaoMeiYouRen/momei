<template>
    <div class="home-page">
        <!-- 英雄区 -->
        <section class="hero">
            <div class="container hero__container">
                <div class="hero__logo">
                    <img
                        src="/logo.png"
                        alt="Momei Logo"
                        class="hero__logo-img"
                        width="128"
                        height="128"
                    >
                </div>

                <h1 class="hero__title">
                    {{ $t('pages.about.hero.title') }}
                </h1>
                <p class="hero__subtitle">
                    {{ $t('pages.about.hero.subtitle') }}
                </p>
                <a href="#about" class="hero__btn">
                    {{ $t('pages.about.hero.cta') }}
                </a>
            </div>
        </section>

        <!-- 关于/名称寓意部分 -->
        <section id="about" class="section section--white">
            <div class="container">
                <h2 class="section__title">
                    {{ $t('pages.about.meaning.title') }}
                </h2>

                <div class="about-content">
                    <div class="about-content__left">
                        <p class="about-content__text about-content__text--mb">
                            {{ $t('pages.about.meaning.text_1') }}
                        </p>
                        <blockquote class="blockquote">
                            {{ $t('pages.about.meaning.poem') }}
                        </blockquote>
                        <p class="about-content__text">
                            {{ $t('pages.about.meaning.text_2') }}
                        </p>
                    </div>

                    <div class="about-content__right">
                        <p class="about-content__text about-content__text--mb">
                            {{ $t('pages.about.meaning.intro') }}
                        </p>
                        <ul class="feature-list">
                            <li
                                v-for="(feature, index) in meaningFeatures"
                                :key="index"
                                class="feature-list__item"
                            >
                                <i class="feature-list__icon pi pi-check" />
                                <span>{{ rt(feature) }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- 核心功能部分 -->
        <section id="features" class="section section--paper">
            <div class="container">
                <h2 class="section__title">
                    {{ $t('pages.about.features.title') }}
                </h2>

                <div class="features-grid">
                    <div
                        v-for="(item, index) in featureItems"
                        :key="index"
                        class="feature-card"
                    >
                        <div class="feature-card__icon-wrapper">
                            <i class="feature-card__icon" :class="getFeatureIcon(index)" />
                        </div>
                        <h3 class="feature-card__title">
                            {{ rt(item.title) }}
                        </h3>
                        <p class="feature-card__desc">
                            {{ rt(item.desc) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 联系方式部分 -->
        <section id="contact" class="section section--white">
            <div class="container section__container--center">
                <h2 class="section__title">
                    {{ $t('pages.about.contact.title') }}
                </h2>

                <div class="contact-links">
                    <a href="mailto:contact@momei.app" class="contact-link">
                        <i class="contact-link__icon pi pi-envelope" />
                        <span>{{ $t('pages.about.contact.email') }}</span>
                    </a>

                    <a
                        href="https://github.com/CaoMeiYouRen/momei"
                        target="_blank"
                        class="contact-link"
                    >
                        <i class="contact-link__icon pi pi-github" />
                        <span>GitHub</span>
                    </a>

                    <a
                        href="https://momei.app/"
                        target="_blank"
                        class="contact-link"
                    >
                        <i class="contact-link__icon pi pi-book" />
                        <span>{{ $t('pages.about.contact.blog') }}</span>
                    </a>
                </div>

                <div class="contact-message">
                    <p class="contact-message__text">
                        {{ $t('pages.about.contact.message') }}
                    </p>
                    <p class="contact-message__subtitle">
                        {{ $t('pages.about.contact.subtitle') }}
                    </p>
                </div>
            </div>
        </section>

        <!-- 页脚 -->
    </div>
</template>

<script setup lang="ts">
const { t, tm, rt } = useI18n()

const meaningFeatures = computed(() => tm('pages.about.meaning.features') as any[])
const featureItems = computed(() => tm('pages.about.features.items') as any[])

useHead({
    title: t('pages.about.meta.title'),
    meta: [
        {
            name: 'description',
            content: t('pages.about.meta.description'),
        },
    ],
})

const getFeatureIcon = (index: number) => {
    const icons = ['pi-pencil', 'pi-link', 'pi-globe']
    return icons[index] || 'pi-check'
}

// 平滑滚动逻辑
onMounted(() => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault()
            const targetAnchor = e.currentTarget as HTMLAnchorElement
            const href = targetAnchor.getAttribute('href')
            if (href) {
                const target = document.querySelector(href)
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                    })
                }
            }
        })
    })
})
</script>

<style lang="scss" scoped>
// 变量定义
$color-ink: var(--p-text-color);
$color-plum: var(--p-primary-color);
$color-paper: var(--p-surface-ground);
$color-accent: var(--p-text-muted-color);
$color-white: var(--p-surface-card);
$font-sans: 'Inter', 'system-ui', 'sans-serif';
$font-serif: '"Noto Serif SC"', 'serif';

// 通用样式
.home-page {
  font-family: $font-sans;
  color: $color-ink;
  background-color: $color-paper;
}

.container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: 1rem;
  padding-left: 1rem;

  @media (width >= 640px) { max-width: 640px; }

  @media (width >= 768px) { max-width: 768px; }

  @media (width >= 1024px) { max-width: 1024px; }

  @media (width >= 1280px) { max-width: 1280px; }
}

// Header
.header {
  position: fixed;
  width: 100%;
  background-color: var(--p-surface-card);
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  z-index: 50;
  top: 0;
  opacity: 0.9;

  &__container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;

  &__icon {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    background-color: $color-ink;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__text {
    color: var(--p-surface-0);
    font-family: $font-serif;
    font-size: 1.125rem;

    :global(.dark) & {
        color: var(--p-surface-900);
    }
  }

  &__title {
    font-size: 1.25rem;
    font-family: $font-serif;
    font-weight: 700;
  }
}

.nav {
  display: none;
  gap: 2rem;

  @media (width >= 768px) {
    display: flex;
  }

  &__link {
    color: $color-ink;
    text-decoration: none;
    transition: all 0.3s ease-in-out;

    &:hover {
      color: $color-plum;
    }
  }
}

.mobile-menu-btn {
  display: block;
  color: $color-ink;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;

  @media (width >= 768px) {
    display: none;
  }
}

// Hero Section
.hero {
  padding: 8rem 1rem 5rem;
  background: linear-gradient(to bottom, $color-white, $color-paper);

  @media (width >= 768px) {
    padding-top: 10rem;
    padding-bottom: 8rem;
  }

  &__container {
    max-width: 56rem; // max-w-4xl
    text-align: center;
  }

  &__logo {
    width: 6rem;
    height: 6rem;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (width >= 768px) {
      width: 8rem;
      height: 8rem;
    }
  }

  &__logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__title {
    font-size: 2.25rem;
    font-family: $font-serif;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: $color-ink;

    @media (width >= 768px) {
      font-size: 3.75rem;
    }
  }

  &__subtitle {
    font-size: 1.25rem;
    color: $color-accent;
    margin-bottom: 2.5rem;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;

    @media (width >= 768px) {
      font-size: 1.5rem;
    }
  }

  &__btn {
    display: inline-block;
    background-color: $color-ink;
    color: var(--p-surface-0);
    padding: 0.75rem 2rem;
    border-radius: 0.375rem;
    text-decoration: none;
    transition: all 0.3s ease-in-out;

    &:hover {
      opacity: 0.9;
    }

    :global(.dark) & {
        color: var(--p-surface-900);
    }
  }
}

// Sections
.section {
  padding: 5rem 1rem;

  &--white {
    background-color: $color-white;
  }

  &--paper {
    background-color: $color-paper;
  }

  &__title {
    font-size: 1.875rem;
    font-family: $font-serif;
    font-weight: 700;
    margin-bottom: 3rem;
    text-align: center;
  }

  &__container--center {
    text-align: center;
  }
}

// About Content
.about-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  align-items: center;
  max-width: 56rem; // max-w-4xl
  margin: 0 auto;

  @media (width >= 768px) {
    flex-direction: row;
  }

  &__left, &__right {
    @media (width >= 768px) {
      width: 50%;
    }
  }

  &__text {
    font-size: 1.125rem;
    line-height: 1.75rem;

    &--mb {
      margin-bottom: 1rem;
    }
  }
}

.blockquote {
  font-style: italic;
  border-left: 4px solid $color-plum;
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  color: $color-accent;
  white-space: pre-line;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__item {
    display: flex;
    align-items: flex-start;
  }

  &__icon {
    color: $color-plum;
    margin-top: 0.25rem;
    margin-right: 0.5rem;
  }
}

// Features Grid
.features-grid {
  display: grid;
  gap: 2rem;
  max-width: 56rem;
  margin: 0 auto;

  @media (width >= 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.feature-card {
  background-color: $color-white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: all 0.3s ease-in-out;

  &:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
  }

  &__icon-wrapper {
    width: 3rem;
    height: 3rem;
    background-color: var(--p-surface-200);
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  &__icon {
    color: $color-ink;
    font-size: 1.25rem;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }

  &__desc {
    color: $color-accent;
  }
}

// Contact
.contact-links {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;

  @media (width >= 768px) {
    flex-direction: row;
    gap: 4rem;
  }
}

.contact-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: $color-ink;
  text-decoration: none;
  transition: all 0.3s ease-in-out;

  &:hover {
    color: $color-plum;
  }

  &__icon {
    font-size: 1.25rem;
  }
}

.contact-message {
  margin-top: 3rem;
  padding: 1.5rem;
  background-color: $color-paper;
  border-radius: 0.5rem;
  display: inline-block;

  &__text {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  &__subtitle {
    margin-top: 0.5rem;
  }
}
</style>
