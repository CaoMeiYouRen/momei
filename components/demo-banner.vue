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
    background-color: var(--p-primary-50);
    border-bottom: 1px solid var(--p-primary-100);
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
        color: var(--p-primary-500);
        font-size: 1.1rem;
    }

    &__text {
        font-size: 0.875rem;
        color: var(--p-text-color);
        flex: 1;
    }

    &__actions {
        display: flex;
        gap: 0.5rem;
    }

    &__btn {
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
    }

    // 适配深色模式
    .dark & {
        background-color: #1e293b;
        border-bottom-color: #334155;

        .demo-banner__text {
            color: #f1f5f9;
        }

        .demo-banner__icon {
            color: #7dd3fc;
        }

        .demo-banner__btn {
            color: #7dd3fc;
            border-color: #7dd3fc;

            &:hover {
                background-color: rgb(125 211 252 / 0.1);
            }
        }
    }
}
</style>
