<template>
    <div class="benefits-page">
        <!-- Hero -->
        <section class="hero">
            <div class="container hero__container">
                <div class="hero__icon-wrapper">
                    <i class="hero__icon pi pi-box" />
                </div>

                <h1 class="hero__title">
                    {{ $t('pages.enhanced_pack.hero.title') }}
                </h1>
                <p class="hero__subtitle">
                    {{ $t('pages.enhanced_pack.hero.subtitle') }}
                </p>
                <a href="#cta-form" class="hero__btn">
                    {{ $t('pages.enhanced_pack.hero.cta') }} &darr;
                </a>
            </div>
        </section>

        <!-- Free Core -->
        <section class="section section--paper">
            <div class="container">
                <h2 class="section__heading">
                    {{ $t('pages.enhanced_pack.free_core.heading') }}
                </h2>

                <div class="capability-grid">
                    <div
                        v-for="(item, index) in freeCoreItems"
                        :key="index"
                        class="capability-card"
                    >
                        <i class="capability-card__check pi pi-check" />
                        <div class="capability-card__body">
                            <h3 class="capability-card__title">
                                {{ rt(item.title) }}
                            </h3>
                            <p class="capability-card__desc">
                                {{ rt(item.desc) }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Premium / Enhanced Pack -->
        <section class="section section--white">
            <div class="container">
                <h2 class="section__heading">
                    {{ $t('pages.enhanced_pack.premium.heading') }}
                </h2>
                <p class="section__subtitle">
                    {{ $t('pages.enhanced_pack.premium.description') }}
                </p>

                <div class="premium-grid">
                    <div
                        v-for="(item, index) in premiumItems"
                        :key="index"
                        class="premium-card"
                    >
                        <div class="premium-card__icon-wrapper">
                            <i class="pi premium-card__icon" :class="rt(item.icon)" />
                        </div>
                        <h3 class="premium-card__title">
                            {{ rt(item.title) }}
                        </h3>
                        <p class="premium-card__desc">
                            {{ rt(item.desc) }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Comparison Table -->
        <section class="section section--paper">
            <div class="container">
                <h2 class="section__heading">
                    {{ $t('pages.enhanced_pack.comparison.heading') }}
                </h2>

                <div class="comparison-table">
                    <div class="comparison-table__header">
                        <div class="comparison-table__cell comparison-table__cell--feature" />
                        <div class="comparison-table__cell comparison-table__cell--label">
                            {{ $t('pages.enhanced_pack.comparison.free_label') }}
                        </div>
                        <div class="comparison-table__cell comparison-table__cell--highlight comparison-table__cell--label">
                            {{ $t('pages.enhanced_pack.comparison.premium_label') }}
                        </div>
                    </div>
                    <div
                        v-for="(row, index) in comparisonRows"
                        :key="index"
                        class="comparison-table__row"
                    >
                        <div class="comparison-table__cell comparison-table__cell--feature">
                            {{ row.feature }}
                        </div>
                        <div class="comparison-table__cell">
                            <i
                                class="comparison-table__icon"
                                :class="row.free ? 'comparison-table__icon--check pi pi-check' : 'comparison-table__icon--dash pi pi-minus'"
                            />
                        </div>
                        <div class="comparison-table__cell comparison-table__cell--highlight">
                            <i class="comparison-table__icon comparison-table__icon--check pi pi-check" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ -->
        <section class="section section--white">
            <div class="container container--narrow">
                <h2 class="section__heading">
                    {{ $t('pages.enhanced_pack.faq.heading') }}
                </h2>

                <div class="faq-list">
                    <details
                        v-for="(item, index) in faqItems"
                        :key="index"
                        class="faq-item"
                    >
                        <summary class="faq-item__question">
                            {{ rt(item.q) }}
                        </summary>
                        <p class="faq-item__answer">
                            {{ rt(item.a) }}
                        </p>
                    </details>
                </div>
            </div>
        </section>

        <!-- CTA Form -->
        <section id="cta-form" class="section section--paper">
            <div class="container container--narrow">
                <h2 class="section__heading">
                    {{ $t('pages.enhanced_pack.cta_form.heading') }}
                </h2>
                <p class="section__subtitle">
                    {{ $t('pages.enhanced_pack.cta_form.description') }}
                </p>

                <ClientOnly>
                    <form class="cta-form" @submit.prevent="handleSubmit">
                        <div class="cta-form__field">
                            <label class="cta-form__label" for="benefits-name">
                                {{ $t('pages.enhanced_pack.cta_form.name_label') }}
                            </label>
                            <input
                                id="benefits-name"
                                v-model="form.name"
                                type="text"
                                class="cta-form__input"
                                :placeholder="$t('pages.enhanced_pack.cta_form.name_placeholder')"
                                required
                                :disabled="isSubmitting"
                            >
                        </div>

                        <div class="cta-form__field">
                            <label class="cta-form__label" for="benefits-email">
                                {{ $t('pages.enhanced_pack.cta_form.email_label') }}
                            </label>
                            <input
                                id="benefits-email"
                                v-model="form.email"
                                type="email"
                                class="cta-form__input"
                                :placeholder="$t('pages.enhanced_pack.cta_form.email_placeholder')"
                                required
                                :disabled="isSubmitting"
                            >
                        </div>

                        <p
                            v-if="submitError"
                            class="cta-form__message cta-form__message--error"
                        >
                            {{ submitError }}
                        </p>

                        <p
                            v-if="submitSuccess"
                            class="cta-form__message cta-form__message--success"
                        >
                            {{ $t('pages.enhanced_pack.cta_form.success') }}
                        </p>

                        <button
                            v-if="!submitSuccess"
                            type="submit"
                            class="cta-form__btn"
                            :disabled="isSubmitting"
                        >
                            {{ isSubmitting
                                ? $t('pages.enhanced_pack.cta_form.submitting')
                                : $t('pages.enhanced_pack.cta_form.submit')
                            }}
                        </button>

                        <p class="cta-form__privacy">
                            {{ $t('pages.enhanced_pack.cta_form.privacy_note') }}
                        </p>
                    </form>
                </ClientOnly>
            </div>
        </section>

        <!-- Back to Home -->
        <section class="section section--center section--white">
            <NuxtLink :to="localePath('/')" class="back-link">
                &larr; {{ $t('common.home') }}
            </NuxtLink>
        </section>
    </div>
</template>

<script setup lang="ts">
const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()

const freeCoreItems = computed(() => tm('pages.enhanced_pack.free_core.items') as any[])
const premiumItems = computed(() => tm('pages.enhanced_pack.premium.items') as any[])

interface ComparisonRow {
    feature: string
    free: boolean
}

const comparisonRows = computed<ComparisonRow[]>(() => [
    { feature: t('pages.enhanced_pack.comparison.row_1'), free: true },
    { feature: t('pages.enhanced_pack.comparison.row_2'), free: true },
    { feature: t('pages.enhanced_pack.comparison.row_3'), free: true },
    { feature: t('pages.enhanced_pack.comparison.row_4'), free: true },
    { feature: t('pages.enhanced_pack.comparison.row_5'), free: true },
    { feature: t('pages.enhanced_pack.comparison.row_6'), free: false },
    { feature: t('pages.enhanced_pack.comparison.row_7'), free: false },
    { feature: t('pages.enhanced_pack.comparison.row_8'), free: false },
])

const faqItems = computed(() => tm('pages.enhanced_pack.faq.items') as any[])

usePageSeo({
    type: 'website',
    title: () => t('pages.enhanced_pack.meta.title'),
    description: () => t('pages.enhanced_pack.meta.description'),
    image: '/logo.png',
})

const form = reactive({
    name: '',
    email: '',
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)

async function handleSubmit() {
    if (isSubmitting.value) {
        return
    }

    submitError.value = null
    submitSuccess.value = false
    isSubmitting.value = true

    try {
        const response = await $fetch('/api/benefits/waitlist', {
            method: 'POST',
            body: {
                name: form.name,
                email: form.email,
                locale: locale.value || null,
            },
        })

        if (response.code === 200) {
            submitSuccess.value = true
            form.name = ''
            form.email = ''
        } else {
            submitError.value = t('pages.enhanced_pack.cta_form.error')
        }
    } catch (err) {
        console.error('[benefits] waitlist submission failed:', err)
        submitError.value = t('pages.enhanced_pack.cta_form.error')
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

$color-ink: var(--p-text-color);
$color-plum: var(--p-primary-color);
$color-paper: var(--p-surface-ground);
$color-accent: var(--p-text-muted-color);
$color-white: var(--p-surface-card);

.benefits-page {
    font-family: $font-sans;
    color: $color-ink;
    background-color: $color-paper;
}

// Hero
.hero {
    padding: $spacing-xl * 4 1rem $spacing-xl * 2.5;
    background: linear-gradient(to bottom, $color-white, $color-paper);

    @include respond-to("md") {
        padding-top: $spacing-xl * 5;
        padding-bottom: $spacing-xl * 4;
    }

    &__container {
        max-width: 42rem;
        text-align: center;
        margin: 0 auto;
    }

    &__icon-wrapper {
        width: 4rem;
        height: 4rem;
        margin: 0 auto $spacing-xl;
        border-radius: 1rem;
        background: color-mix(in srgb, $color-plum 12%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__icon {
        font-size: 2rem;
        color: $color-plum;
    }

    &__title {
        font-size: $font-size-4xl;
        font-family: $font-serif;
        font-weight: 700;
        margin-bottom: $spacing-lg;
        color: $color-ink;
        line-height: 1.2;

        @include respond-to("md") {
            font-size: 3rem;
        }
    }

    &__subtitle {
        font-size: $font-size-lg;
        color: $color-accent;
        margin-bottom: $spacing-xl * 1.25;
        line-height: 1.75;
    }

    &__btn {
        display: inline-block;
        background-color: $color-plum;
        color: #fff;
        padding: $spacing-sm * 1.5 $spacing-xl;
        border-radius: $border-radius-sm;
        text-decoration: none;
        font-weight: 600;
        transition: $transition-base;

        &:hover {
            opacity: 0.9;
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

    &--center {
        text-align: center;
    }

    &__heading {
        font-size: $font-size-3xl;
        font-family: $font-serif;
        font-weight: 700;
        margin-bottom: $spacing-lg;
        text-align: center;
    }

    &__subtitle {
        font-size: $font-size-lg;
        color: $color-accent;
        text-align: center;
        max-width: 36rem;
        margin: 0 auto $spacing-xl * 1.5;
        line-height: 1.7;
    }
}

.container--narrow {
    max-width: 42rem;
    margin: 0 auto;
}

// Capability Grid (Free Core)
.capability-grid {
    display: grid;
    gap: $spacing-lg;
    max-width: 48rem;
    margin: 0 auto;

    @include respond-to("md") {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.capability-card {
    display: flex;
    gap: $spacing-md;
    padding: $spacing-lg;
    background-color: $color-white;
    border-radius: $border-radius-md;
    border: 1px solid $color-surface-border;

    &__check {
        flex-shrink: 0;
        color: $color-plum;
        margin-top: $spacing-xs;
    }

    &__body {
        min-width: 0;
    }

    &__title {
        font-size: $font-size-base;
        font-weight: 700;
        margin-bottom: $spacing-xs;
    }

    &__desc {
        font-size: $font-size-sm;
        color: $color-accent;
        line-height: 1.6;
    }
}

// Premium Grid
.premium-grid {
    display: grid;
    gap: $spacing-xl;
    max-width: 56rem;
    margin: 0 auto;

    @include respond-to("md") {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

.premium-card {
    text-align: center;
    padding: $spacing-xl $spacing-lg;
    background: $color-white;
    border-radius: $border-radius-lg;
    border: 1px solid color-mix(in srgb, $color-plum 30%, transparent);
    box-shadow: $shadow-md;
    transition: $transition-base;

    &:hover {
        box-shadow: $shadow-lg;
        transform: translateY(-2px);
    }

    &__icon-wrapper {
        width: 3.5rem;
        height: 3.5rem;
        margin: 0 auto $spacing-lg;
        border-radius: 1rem;
        background: color-mix(in srgb, $color-plum 12%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__icon {
        font-size: 1.5rem;
        color: $color-plum;
    }

    &__title {
        font-size: $font-size-xl;
        font-weight: 700;
        margin-bottom: $spacing-md;
        color: $color-ink;
    }

    &__desc {
        font-size: $font-size-sm;
        color: $color-accent;
        line-height: 1.6;
    }
}

// Comparison Table
.comparison-table {
    max-width: 48rem;
    margin: 0 auto;
    border: 1px solid $color-surface-border;
    border-radius: $border-radius-md;
    overflow: hidden;
    background-color: $color-white;

    &__header {
        display: grid;
        grid-template-columns: 1fr 120px 120px;
        background-color: $color-paper;
        border-bottom: 2px solid $color-surface-border;
    }

    &__row {
        display: grid;
        grid-template-columns: 1fr 120px 120px;
        border-bottom: 1px solid $color-surface-border;

        &:last-child {
            border-bottom: 0;
        }
    }

    &__cell {
        padding: $spacing-md;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: $font-size-sm;

        &--feature {
            justify-content: flex-start;
            text-align: left;
            font-weight: 500;
        }

        &--label {
            font-weight: 700;
            font-size: $font-size-sm;
        }

        &--highlight {
            color: $color-plum;
        }
    }

    &__icon {
        font-size: $font-size-lg;

        &--check {
            color: $color-plum;
        }

        &--dash {
            color: $color-accent;
        }
    }
}

// FAQ
.faq-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
}

.faq-item {
    border: 1px solid $color-surface-border;
    border-radius: $border-radius-md;
    background-color: $color-white;

    &__question {
        padding: $spacing-lg;
        cursor: pointer;
        font-weight: 600;
        list-style: none;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &::after {
            content: '+';
            font-size: $font-size-xl;
            font-weight: 300;
            color: $color-accent;
            transition: transform 0.2s ease;
        }

        [open] &::after {
            content: '-';
        }
    }

    &__answer {
        padding: 0 $spacing-lg $spacing-lg;
        margin: 0;
        color: $color-accent;
        font-size: $font-size-sm;
        line-height: 1.7;
    }
}

// CTA Form
.cta-form {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    max-width: 28rem;
    margin: 0 auto;

    &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__label {
        font-size: $font-size-sm;
        font-weight: 600;
        color: $color-ink;
    }

    &__input {
        padding: $spacing-sm * 1.5 $spacing-md;
        border: 1px solid $color-surface-border;
        border-radius: $border-radius-sm;
        font-size: $font-size-base;
        background-color: $color-white;
        color: $color-ink;
        transition: $transition-fast;

        &:focus {
            outline: none;
            border-color: $color-plum;
            box-shadow: 0 0 0 2px color-mix(in srgb, $color-plum 25%, transparent);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    &__message {
        padding: $spacing-md;
        border-radius: $border-radius-sm;
        font-size: $font-size-sm;
        text-align: center;

        &--success {
            background-color: color-mix(in srgb, $color-success 10%, transparent);
            color: var(--p-success-700);
            border: 1px solid color-mix(in srgb, $color-success 25%, transparent);
        }

        &--error {
            background-color: color-mix(in srgb, $color-danger 10%, transparent);
            color: var(--p-error-700);
            border: 1px solid color-mix(in srgb, $color-danger 25%, transparent);
        }
    }

    &__btn {
        padding: $spacing-sm * 1.5 $spacing-xl;
        background-color: $color-plum;
        color: #fff;
        border: 0;
        border-radius: $border-radius-sm;
        font-size: $font-size-base;
        font-weight: 600;
        cursor: pointer;
        transition: $transition-base;

        &:hover {
            opacity: 0.9;
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    &__privacy {
        font-size: $font-size-xs;
        color: $color-accent;
        text-align: center;
    }
}

// Back link
.back-link {
    color: $color-accent;
    text-decoration: none;
    font-size: $font-size-sm;
    transition: $transition-base;

    &:hover {
        color: $color-plum;
    }
}

// Responsive: comparison table on mobile
@include respond-below("md") {
    .comparison-table {
        &__header,
        &__row {
            grid-template-columns: 1fr 80px 80px;
        }

        &__cell {
            padding: $spacing-sm * 1.5;
            font-size: $font-size-xs;
        }
    }
}
</style>
