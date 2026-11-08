<template>
    <div class="post-editor-setup-reminder">
        <div class="post-editor-setup-reminder__copy">
            <strong>{{ $t('pages.admin.posts.setup_reminder.title') }}</strong>
            <p>{{ $t('pages.admin.posts.setup_reminder.description') }}</p>
        </div>

        <div class="post-editor-setup-reminder__actions">
            <CaomeiButton
                variant="secondary"
                tone="neutral"
                size="sm"
                @click="emit('open-settings')"
            >
                <template #icon>
                    <SlidersHorizontal :size="16" />
                </template>
                {{ $t('pages.admin.posts.setup_reminder.open_settings') }}
            </CaomeiButton>
            <CaomeiButton
                size="sm"
                @click="emit('open-system-settings')"
            >
                <template #icon>
                    <Settings :size="16" />
                </template>
                {{ $t('pages.admin.posts.setup_reminder.open_system_settings') }}
            </CaomeiButton>
            <CaomeiButton
                variant="ghost"
                tone="neutral"
                size="sm"
                @click="emit('dismiss')"
            >
                {{ $t('common.skip') }}
            </CaomeiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Settings, SlidersHorizontal } from '@lucide/vue'

const emit = defineEmits<{
    (e: 'open-settings'): void
    (e: 'open-system-settings'): void
    (e: 'dismiss'): void
}>()
</script>

<style scoped lang="scss">
.post-editor-setup-reminder {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--caomei-color-border);
    background: color-mix(in srgb, var(--m-primary-50) 28%, var(--m-surface-0) 72%);

    &__copy {
        display: grid;
        gap: 0.2rem;

        strong {
            font-size: 0.95rem;
        }

        p {
            margin: 0;
            color: var(--caomei-color-text-muted);
            line-height: 1.5;
        }
    }

    &__actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: flex-end;
    }
}

@media (width <= 960px) {
    .post-editor-setup-reminder {
        flex-direction: column;
        align-items: flex-start;

        &__actions {
            justify-content: flex-start;
        }
    }
}
</style>
