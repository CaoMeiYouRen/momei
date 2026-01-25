<template>
    <div v-if="config.public.demoMode" class="demo-banner">
        <div class="demo-banner__content">
            <i class="demo-banner__icon pi pi-info-circle" />
            <span class="demo-banner__text">
                {{ $t('demo.banner_text') }}
            </span>
            <div class="demo-banner__actions">
                <Button
                    :label="$t('demo.start_tour')"
                    size="small"
                    severity="primary"
                    outlined
                    class="demo-banner__btn"
                    @click="startTour"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const { t } = useI18n()

const startTour = () => {
    // 触发引导逻辑
    const event = new CustomEvent('momei:start-tour')
    window.dispatchEvent(event)
}
</script>

<style lang="scss">
.demo-banner {
    background-color: $demo-banner-bg;
    border-bottom: 1px solid $demo-banner-border;
    padding: 0.5rem 1rem;
    z-index: 1000;
    transition: background-color 0.3s, border-color 0.3s;

    &__content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    &__icon {
        color: $demo-banner-icon;
        font-size: 1.1rem;
    }

    &__text {
        font-size: 0.875rem;
        color: $demo-banner-text;
        flex: 1;
    }

    &__actions {
        display: flex;
        gap: 0.5rem;
    }

    &__btn {
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        color: $demo-banner-btn;
        border-color: $demo-banner-btn;
    }

    // 适配深色模式
    .dark & {
        background-color: $demo-banner-bg-dark;
        border-bottom-color: $demo-banner-border-dark;

        .demo-banner__text {
            color: $demo-banner-text-dark;
        }

        .demo-banner__icon {
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
