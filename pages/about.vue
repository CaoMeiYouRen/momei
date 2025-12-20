<template>
    <div class="home-page">
        <!-- 导航栏 -->
        <header class="header">
            <div class="container header__container">
                <a href="#" class="logo">
                    <div class="logo__icon">
                        <span class="logo__text">梅</span>
                    </div>
                    <span class="logo__title">墨梅</span>
                </a>

                <nav class="nav">
                    <a href="#about" class="nav__link">关于</a>
                    <a href="#features" class="nav__link">功能</a>
                    <a href="#contact" class="nav__link">联系我们</a>
                </nav>

                <button class="mobile-menu-btn">
                    <i class="fa fa-bars" />
                </button>
            </div>
        </header>

        <!-- 英雄区 -->
        <section class="hero">
            <div class="container hero__container">
                <div class="hero__logo">
                    <span class="hero__logo-text">梅</span>
                </div>

                <h1 class="hero__title">
                    墨梅
                </h1>
                <p class="hero__subtitle">
                    轻量、高效的跨语言博客创作与管理平台
                </p>
                <a href="#about" class="hero__btn">
                    了解更多
                </a>
            </div>
        </section>

        <!-- 关于/名称寓意部分 -->
        <section id="about" class="section section--white">
            <div class="container">
                <h2 class="section__title">
                    名称由来与寓意
                </h2>

                <div class="about-content">
                    <div class="about-content__left">
                        <p class="mb-4 text-lg">
                            "墨梅"之名，灵感源自元代王冕《墨梅》诗句：
                        </p>
                        <blockquote class="blockquote">
                            "吾家洗砚池头树，朵朵花开淡墨痕。<br>
                            不要人夸好颜色，只留清气满乾坤。"
                        </blockquote>
                        <p class="text-lg">
                            取"墨"字，象征文字创作、笔墨耕耘，呼应博客的内容本质；
                            取"梅"字，寓意坚韧不拔的创作精神与独特的个人风格。
                        </p>
                    </div>

                    <div class="about-content__right">
                        <p class="mb-4 text-lg">
                            墨梅平台致力于为创作者提供：
                        </p>
                        <ul class="feature-list">
                            <li class="feature-list__item">
                                <i class="fa fa-check feature-list__icon" />
                                <span>简单高效的内容创作体验</span>
                            </li>
                            <li class="feature-list__item">
                                <i class="fa fa-check feature-list__icon" />
                                <span>无缝的跨语言内容管理与分发</span>
                            </li>
                            <li class="feature-list__item">
                                <i class="fa fa-check feature-list__icon" />
                                <span>便捷的博客迁移工具与路径管理</span>
                            </li>
                            <li class="feature-list__item">
                                <i class="fa fa-check feature-list__icon" />
                                <span>专注内容本身，摒弃冗余干扰</span>
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
                    核心功能
                </h2>

                <div class="features-grid">
                    <!-- 功能卡片1 -->
                    <div class="feature-card">
                        <div class="feature-card__icon-wrapper">
                            <i class="fa fa-pencil feature-card__icon" />
                        </div>
                        <h3 class="feature-card__title">
                            简洁创作
                        </h3>
                        <p class="feature-card__desc">
                            轻量级Markdown编辑器，专注写作体验，支持代码高亮与图片上传。
                        </p>
                    </div>

                    <!-- 功能卡片2 -->
                    <div class="feature-card">
                        <div class="feature-card__icon-wrapper">
                            <i class="fa fa-link feature-card__icon" />
                        </div>
                        <h3 class="feature-card__title">
                            路径管理
                        </h3>
                        <p class="feature-card__desc">
                            自定义URL路径别名，轻松迁移旧博客，保持链接有效性与SEO权重。
                        </p>
                    </div>

                    <!-- 功能卡片3 -->
                    <div class="feature-card">
                        <div class="feature-card__icon-wrapper">
                            <i class="fa fa-globe feature-card__icon" />
                        </div>
                        <h3 class="feature-card__title">
                            多语言支持
                        </h3>
                        <p class="feature-card__desc">
                            内置语言切换，支持内容国际化，助力创作者触达全球受众。
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 联系方式部分 -->
        <section id="contact" class="section section--white">
            <div class="container text-center">
                <h2 class="section__title">
                    联系我们
                </h2>

                <div class="contact-links">
                    <a href="mailto:contact@momei.app" class="contact-link">
                        <i class="contact-link__icon fa fa-envelope" />
                        <span>邮箱</span>
                    </a>

                    <a
                        href="https://github.com/CaoMeiYouRen"
                        target="_blank"
                        class="contact-link"
                    >
                        <i class="contact-link__icon fa fa-github" />
                        <span>GitHub</span>
                    </a>

                    <a
                        href="https://blog.cmyr.ltd/"
                        target="_blank"
                        class="contact-link"
                    >
                        <i class="contact-link__icon fa fa-rss" />
                        <span>博客</span>
                    </a>
                </div>

                <div class="contact-message">
                    <p class="text-lg">
                        对墨梅平台有任何疑问或建议？
                    </p>
                    <p class="mt-2">
                        我们期待听到您的声音
                    </p>
                </div>
            </div>
        </section>

        <!-- 页脚 -->
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
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

useHead({
    title: '墨梅 - 跨语言博客创作平台',
    link: [
        {
            rel: 'stylesheet',
            href: 'https://cdn.bootcdn.net/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
        },
    ],
})

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
$color-ink: #2D3748;
$color-plum: #E53E3E;
$color-paper: #F7FAFC;
$color-accent: #4A5568;
$color-white: #fff;
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

.text-center {
  text-align: center;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

// Header
.header {
  position: fixed;
  width: 100%;
  background-color: rgb(255 255 255 / 0.9);
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  z-index: 50;
  top: 0;

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
    color: $color-white;
    font-family: $font-serif;
    font-size: 1.125rem;
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
    border-radius: 9999px;
    background-color: $color-ink;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);

    @media (width >= 768px) {
      width: 8rem;
      height: 8rem;
    }
  }

  &__logo-text {
    color: $color-white;
    font-family: $font-serif;
    font-size: 2.25rem;

    @media (width >= 768px) {
      font-size: 3rem;
    }
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
    color: $color-white;
    padding: 0.75rem 2rem;
    border-radius: 0.375rem;
    text-decoration: none;
    transition: all 0.3s ease-in-out;

    &:hover {
      opacity: 0.9;
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
}

.blockquote {
  font-style: italic;
  border-left: 4px solid $color-plum;
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  color: $color-accent;
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
    background-color: rgba($color-ink, 0.1);
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
}

// Footer
.footer {
  padding: 2rem 1rem;
  background-color: $color-ink;
  color: $color-white;
  text-align: center;

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
    color: rgb(255 255 255 / 0.7);
  }
}
</style>
