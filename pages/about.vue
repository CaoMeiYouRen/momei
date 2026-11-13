<template>
    <div class="about-page">
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
                                <Check class="feature-list__icon" :size="16" />
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
                            <component
                                :is="getFeatureIcon(index)"
                                class="feature-card__icon"
                                :size="20"
                            />
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
                        <Mail class="contact-link__icon" :size="20" />
                        <span>{{ $t('pages.about.contact.email') }}</span>
                    </a>

                    <a
                        href="https://github.com/CaoMeiYouRen/momei"
                        target="_blank"
                        class="contact-link"
                    >
                        <i class="contact-link__icon mdi mdi-github" />
                        <span>GitHub</span>
                    </a>

                    <a
                        href="https://momei.app/"
                        target="_blank"
                        class="contact-link"
                    >
                        <BookOpen class="contact-link__icon" :size="20" />
                        <span>{{ $t('pages.about.contact.blog') }}</span>
                    </a>

                    <NuxtLink :to="localePath('/benefits')" class="contact-link">
                        <Box class="contact-link__icon" :size="20" />
                        <span>{{ $t('pages.enhanced_pack.hero.cta') }}</span>
                    </NuxtLink>
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
import { BookOpen, Box, Check, Globe, Link as LinkIcon, Mail, Pencil } from '@lucide/vue'
import { rawIcon } from '@/utils/shared/brand-icons'

const { t, tm, rt } = useI18n()
const localePath = useLocalePath()

const meaningFeatures = computed(() => tm('pages.about.meaning.features') as any[])
const featureItems = computed(() => tm('pages.about.features.items') as any[])

usePageSeo({
    type: 'website',
    title: () => t('common.about'),
    description: () => t('pages.about.meta.description'),
    image: '/logo.png',
})

const FEATURE_ICONS = [rawIcon(Pencil), rawIcon(LinkIcon), rawIcon(Globe)]

const getFeatureIcon = (index: number) => FEATURE_ICONS[index] || rawIcon(Check)

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
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

$color-ink: var(--caomei-color-text);
$color-plum: var(--caomei-color-primary);
$color-paper: var(--m-surface-ground);
$color-accent: var(--caomei-color-text-muted);
$color-white: var(--caomei-color-bg);

.home-page {
  font-family: $font-sans;
  color: $color-ink;
  background-color: $color-paper;
}

// Hero Section
.hero {
  padding: $spacing-xl * 4 1rem $spacing-xl * 2.5;
  background: linear-gradient(to bottom, $color-white, $color-paper);

  @include respond-to("md") {
    padding-top: $spacing-xl * 5;
    padding-bottom: $spacing-xl * 4;
  }

  &__container {
    max-width: 56rem; // max-w-4xl
    text-align: center;
    margin: 0 auto;
  }

  &__logo {
    width: 6rem;
    height: 6rem;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: $spacing-xl;
    display: flex;
    align-items: center;
    justify-content: center;

    @include respond-to("md") {
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
    font-size: var(--m-font-size-4xl);
    font-family: $font-serif;
    font-weight: 700;
    margin-bottom: $spacing-lg;
    color: $color-ink;

    @include respond-to("md") {
      font-size: 3.75rem;
    }
  }

  &__subtitle {
    font-size: var(--m-font-size-xl);
    color: $color-accent;
    margin-bottom: $spacing-xl * 1.25;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;

    @include respond-to("md") {
      font-size: var(--m-font-size-2xl);
    }
  }

  &__btn {
    display: inline-block;
    background-color: $color-ink;
    color: var(--m-surface-0);
    padding: $spacing-sm * 1.5 $spacing-xl;
    border-radius: $border-radius-sm;
    text-decoration: none;
    transition: $transition-base;

    &:hover {
      opacity: 0.9;
    }

    :global(.dark) & {
        color: var(--m-surface-900);
    }
  }
}

// Sections
.section {
  padding: $spacing-xl * 2.5 1rem;

  &--white {
    background-color: $color-white;
  }

  &--paper {
    background-color: $color-paper;
  }

  &__title {
    font-size: var(--m-font-size-3xl);
    font-family: $font-serif;
    font-weight: 700;
    margin-bottom: $spacing-xl * 1.5;
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
  gap: $spacing-xl * 1.25;
  align-items: center;
  max-width: 56rem; // max-w-4xl
  margin: 0 auto;

  @include respond-to("md") {
    flex-direction: row;
  }

  &__left, &__right {
    @include respond-to("md") {
      width: 50%;
    }
  }

  &__text {
    font-size: var(--m-font-size-lg);
    line-height: 1.75rem;

    &--mb {
      margin-bottom: $spacing-md;
    }
  }
}

.blockquote {
  font-style: italic;
  border-left: 4px solid $color-plum;
  padding-left: $spacing-md;
  padding-top: $spacing-sm;
  padding-bottom: $spacing-sm;
  margin-bottom: $spacing-lg;
  color: $color-accent;
  white-space: pre-line;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &__item {
    display: flex;
    align-items: flex-start;
  }

  &__icon {
    color: $color-plum;
    margin-top: $spacing-xs;
    margin-right: $spacing-sm;
  }
}

// Features Grid
.features-grid {
  display: grid;
  gap: $spacing-xl;
  max-width: 56rem;
  margin: 0 auto;

  @include respond-to("md") {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.feature-card {
  background-color: $color-white;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $shadow-sm;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-md;
  }

  &__icon-wrapper {
    width: 3rem;
    height: 3rem;
    background-color: var(--m-surface-200);
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-md;
  }

  &__icon {
    color: $color-ink;
    font-size: var(--m-font-size-xl);
  }

  &__title {
    font-size: var(--m-font-size-xl);
    font-weight: 700;
    margin-bottom: $spacing-sm * 1.5;
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
  gap: $spacing-xl;
  margin-bottom: $spacing-xl * 1.5;

  @include respond-to("md") {
    flex-direction: row;
    gap: $spacing-xl * 2;
  }
}

.contact-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  color: $color-ink;
  text-decoration: none;
  transition: $transition-base;

  &:hover {
    color: $color-plum;
  }

  &__icon {
    font-size: var(--m-font-size-xl);
  }
}

.contact-message {
  margin-top: $spacing-xl * 1.5;
  padding: $spacing-lg;
  background-color: $color-paper;
  border-radius: $border-radius-md;
  display: inline-block;

  &__text {
    font-size: var(--m-font-size-lg);
    line-height: 1.75rem;
  }

  &__subtitle {
    margin-top: $spacing-sm;
  }
}
</style>
