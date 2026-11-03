<template>
    <CaomeiCard class="setup-follow-up-card">
        <div class="setup-follow-up-card__content">
            <div class="setup-follow-up-card__copy">
                <span class="setup-follow-up-card__eyebrow">
                    {{ $t('pages.admin.settings.system.setup_follow_up.eyebrow') }}
                </span>
                <h2 class="setup-follow-up-card__title">
                    {{ $t('pages.admin.settings.system.setup_follow_up.title') }}
                </h2>
                <p class="setup-follow-up-card__description">
                    {{ $t('pages.admin.settings.system.setup_follow_up.description') }}
                </p>
            </div>

            <div class="setup-follow-up-card__chips">
                <button
                    v-for="item in suggestedTabs"
                    :key="item.tab"
                    type="button"
                    class="setup-follow-up-card__chip"
                    @click="emit('open-tab', item.tab)"
                >
                    <component
                        :is="item.icon"
                        :size="18"
                        aria-hidden="true"
                    />
                    <span>
                        <strong>{{ $t(item.titleKey) }}</strong>
                        <small>{{ $t(item.descriptionKey) }}</small>
                    </span>
                </button>
            </div>

            <div class="setup-follow-up-card__actions">
                <CaomeiButton
                    :label="$t('pages.admin.settings.system.setup_follow_up.continue_editor')"
                    @click="emit('continue-editor')"
                >
                    <template #icon>
                        <ArrowRight :size="16" />
                    </template>
                    {{ $t('pages.admin.settings.system.setup_follow_up.continue_editor') }}
                </CaomeiButton>
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    :label="$t('common.skip')"
                    @click="emit('dismiss')"
                >
                    {{ $t('common.skip') }}
                </CaomeiButton>
            </div>
        </div>
    </CaomeiCard>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowRight, Bell, CloudUpload, Shield, Sparkles } from '@lucide/vue'
import type { AdminSettingsTab } from '@/utils/shared/admin-settings-tabs'

const emit = defineEmits<{
    (e: 'open-tab', tab: AdminSettingsTab): void
    (e: 'continue-editor'): void
    (e: 'dismiss'): void
}>()

const suggestedTabs: Array<{
    tab: AdminSettingsTab
    icon: Component
    titleKey: string
    descriptionKey: string
}> = [
    {
        tab: 'auth',
        icon: Shield,
        titleKey: 'pages.admin.settings.system.setup_follow_up.sections.auth.title',
        descriptionKey: 'pages.admin.settings.system.setup_follow_up.sections.auth.description',
    },
    {
        tab: 'notifications',
        icon: Bell,
        titleKey: 'pages.admin.settings.system.setup_follow_up.sections.notifications.title',
        descriptionKey: 'pages.admin.settings.system.setup_follow_up.sections.notifications.description',
    },
    {
        tab: 'ai',
        icon: Sparkles,
        titleKey: 'pages.admin.settings.system.setup_follow_up.sections.ai.title',
        descriptionKey: 'pages.admin.settings.system.setup_follow_up.sections.ai.description',
    },
    {
        tab: 'storage',
        icon: CloudUpload,
        titleKey: 'pages.admin.settings.system.setup_follow_up.sections.storage.title',
        descriptionKey: 'pages.admin.settings.system.setup_follow_up.sections.storage.description',
    },
]
</script>

<style scoped lang="scss">
.setup-follow-up-card {
    margin-bottom: 1rem;

    &__content {
        display: grid;
        gap: 1rem;
    }

    &__copy {
        display: grid;
        gap: 0.35rem;
    }

    &__eyebrow {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--p-primary-color);
    }

    &__title {
        margin: 0;
        font-size: 1.125rem;
    }

    &__description {
        margin: 0;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__chips {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    &__chip {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.75rem;
        align-items: start;
        padding: 0.9rem 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 0.9rem;
        background: color-mix(in srgb, var(--p-primary-50) 30%, var(--p-surface-0) 70%);
        text-align: left;
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease;

        i {
            margin-top: 0.15rem;
            color: var(--p-primary-color);
        }

        span {
            display: grid;
            gap: 0.2rem;
        }

        strong {
            font-size: 0.95rem;
            color: var(--p-text-color);
        }

        small {
            color: var(--p-text-muted-color);
            line-height: 1.45;
        }

        &:hover {
            border-color: var(--p-primary-color);
            transform: translateY(-1px);
        }
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
}

@media (width <= 768px) {
    .setup-follow-up-card {
        &__chips {
            grid-template-columns: 1fr;
        }

        &__actions {
            justify-content: stretch;
            flex-direction: column;
        }
    }
}
</style>
