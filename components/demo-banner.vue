<template>
    <div v-if="config.public.demoMode" class="demo-banner">
        <div class="demo-banner__content">
            <div class="demo-banner__intro">
                <div class="demo-banner__eyebrow">
                    <span class="demo-banner__badge">{{ $t('demo.journey_badge') }}</span>
                    <span class="demo-banner__stage">{{ $t('demo.current_stage', {stage: $t(`demo.stages.${currentStage}`)}) }}</span>
                </div>
                <div class="demo-banner__headline">
                    <i class="demo-banner__icon pi pi-info-circle" />
                    <span class="demo-banner__title">{{ $t('demo.journey_title') }}</span>
                </div>
                <p class="demo-banner__text">
                    {{ $t('demo.banner_text') }}
                </p>
            </div>

            <div class="demo-banner__paths">
                <button
                    v-for="entry in demoEntries"
                    :key="entry.key"
                    type="button"
                    class="demo-banner__path"
                    @click="openDemoPath(entry.to, entry.stage)"
                >
                    <span class="demo-banner__path-icon" :class="entry.icon" />
                    <span class="demo-banner__path-body">
                        <span class="demo-banner__path-title">{{ entry.title }}</span>
                        <span class="demo-banner__path-description">{{ entry.description }}</span>
                    </span>
                    <span class="demo-banner__path-action">{{ entry.action }}</span>
                </button>
            </div>

            <div class="demo-banner__actions">
                <button
                    type="button"
                    class="demo-banner__btn"
                    @click="startTour"
                >
                    {{ $t('demo.start_tour') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { DEMO_TOUR_QUEUE_KEY } from '@/composables/use-onboarding'

const config = useRuntimeConfig()
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()

type DemoTourStage = 'public' | 'login' | 'editor'

const currentStage = computed<DemoTourStage>(() => {
    if (route.path.includes('/admin/posts/')) {
        return 'editor'
    }

    if (route.path.includes('/login')) {
        return 'login'
    }

    return 'public'
})

const demoEntries = computed(() => [
    {
        key: 'read_article',
        icon: 'pi pi-book',
        title: t('demo.paths.read_article.label'),
        description: t('demo.paths.read_article.description'),
        action: t('demo.paths.read_article.action'),
        to: localePath('/posts/welcome-to-momei-demo'),
        stage: 'public' as DemoTourStage,
    },
    {
        key: 'browse_content',
        icon: 'pi pi-compass',
        title: t('demo.paths.browse_content.label'),
        description: t('demo.paths.browse_content.description'),
        action: t('demo.paths.browse_content.action'),
        to: localePath('/posts'),
        stage: 'public' as DemoTourStage,
    },
    {
        key: 'creator_mode',
        icon: 'pi pi-sparkles',
        title: t('demo.paths.creator_mode.label'),
        description: t('demo.paths.creator_mode.description'),
        action: t('demo.paths.creator_mode.action'),
        to: localePath('/login'),
        stage: 'login' as DemoTourStage,
    },
])

const startTour = () => {
    const event = new CustomEvent('momei:start-tour')
    window.dispatchEvent(event)
}

const openDemoPath = (path: string, stage: DemoTourStage) => {
    if (import.meta.client) {
        localStorage.setItem(DEMO_TOUR_QUEUE_KEY, stage)
    }

    navigateTo(path)
}
</script>

<style lang="scss">
.demo-banner {
    background-color: $demo-banner-bg;
    border-bottom: 1px solid $demo-banner-border;
    padding: 0.75rem 1rem;
    z-index: 1000;
    transition: background-color 0.3s, border-color 0.3s;

    &__content {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        gap: 0.75rem;
    }

    &__intro {
        display: grid;
        gap: 0.35rem;
    }

    &__eyebrow {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__badge,
    &__stage {
        display: inline-flex;
        align-items: center;
        min-height: 1.5rem;
        padding: 0 0.625rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    &__badge {
        background: color-mix(in srgb, $demo-banner-icon 16%, white 84%);
        color: $demo-banner-icon;
    }

    &__stage {
        background: color-mix(in srgb, $demo-banner-border 70%, white 30%);
        color: $demo-banner-text;
    }

    &__headline {
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }

    &__icon {
        color: $demo-banner-icon;
        font-size: 1.1rem;
    }

    &__title {
        font-size: 1rem;
        font-weight: 700;
        color: $demo-banner-text;
    }

    &__text {
        margin: 0;
        font-size: 0.875rem;
        color: $demo-banner-text;
        line-height: 1.5;
    }

    &__paths {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
    }

    &__path {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1px solid color-mix(in srgb, $demo-banner-border 80%, white 20%);
        border-radius: 0.875rem;
        background: color-mix(in srgb, white 80%, $demo-banner-bg 20%);
        text-align: left;
        transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
        cursor: pointer;

        &:hover {
            transform: translateY(-1px);
            border-color: $demo-banner-icon;
            background: color-mix(in srgb, white 72%, $demo-banner-bg 28%);
        }
    }

    &__path-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, $demo-banner-icon 12%, white 88%);
        color: $demo-banner-icon;
        font-size: 1rem;
    }

    &__path-body {
        display: grid;
        gap: 0.2rem;
        min-width: 0;
    }

    &__path-title {
        font-size: 0.875rem;
        font-weight: 700;
        color: $demo-banner-text;
    }

    &__path-description {
        font-size: 0.75rem;
        color: color-mix(in srgb, $demo-banner-text 80%, transparent);
        line-height: 1.4;
    }

    &__path-action {
        font-size: 0.75rem;
        font-weight: 700;
        color: $demo-banner-icon;
    }

    &__actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.25rem;
        padding: 0.5rem 0.9rem;
        border: 1px solid $demo-banner-btn;
        border-radius: 999px;
        background: transparent;
        font-size: 0.75rem;
        font-weight: 700;
        color: $demo-banner-btn;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease;

        &:hover {
            background-color: color-mix(in srgb, $demo-banner-btn 8%, transparent);
        }
    }

    @media (width <= 959px) {
        &__paths {
            grid-template-columns: 1fr;
        }
    }

    @media (width <= 640px) {
        &__path {
            grid-template-columns: auto 1fr;
        }

        &__path-action {
            grid-column: 2;
        }
    }

    .dark & {
        background-color: $demo-banner-bg-dark;
        border-bottom-color: $demo-banner-border-dark;

        .demo-banner__badge {
            background: color-mix(in srgb, $demo-banner-icon-dark 14%, #0f172a 86%);
            color: $demo-banner-icon-dark;
        }

        .demo-banner__stage,
        .demo-banner__text,
        .demo-banner__title,
        .demo-banner__path-title {
            color: $demo-banner-text-dark;
        }

        .demo-banner__icon {
            color: $demo-banner-icon-dark;
        }

        .demo-banner__path {
            background: color-mix(in srgb, #0f172a 70%, $demo-banner-bg-dark 30%);
            border-color: color-mix(in srgb, $demo-banner-border-dark 72%, #0f172a 28%);

            &:hover {
                border-color: $demo-banner-icon-dark;
                background: color-mix(in srgb, #0f172a 62%, $demo-banner-bg-dark 38%);
            }
        }

        .demo-banner__path-icon {
            background: color-mix(in srgb, $demo-banner-icon-dark 14%, #0f172a 86%);
            color: $demo-banner-icon-dark;
        }

        .demo-banner__path-description,
        .demo-banner__stage {
            color: rgba($demo-banner-text-dark, 0.82);
        }

        .demo-banner__path-action {
            color: $demo-banner-icon-dark;
        }

        .demo-banner__btn {
            color: $demo-banner-btn-dark;
            border-color: $demo-banner-btn-dark;

            &:hover {
                background-color: rgba($demo-banner-btn-dark, 0.1);
            }
        }
    }
}
</style>
