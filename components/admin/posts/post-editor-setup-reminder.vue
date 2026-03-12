<template>
    <div class="post-editor-setup-reminder">
        <div class="post-editor-setup-reminder__copy">
            <strong>{{ $t('pages.admin.posts.setup_reminder.title') }}</strong>
            <p>{{ $t('pages.admin.posts.setup_reminder.description') }}</p>
        </div>

        <div class="post-editor-setup-reminder__actions">
            <Button
                :label="$t('pages.admin.posts.setup_reminder.open_settings')"
                icon="pi pi-sliders-h"
                size="small"
                severity="secondary"
                outlined
                @click="emit('open-settings')"
            />
            <Button
                :label="$t('pages.admin.posts.setup_reminder.open_system_settings')"
                icon="pi pi-cog"
                size="small"
                @click="emit('open-system-settings')"
            />
            <Button
                :label="$t('common.skip')"
                text
                size="small"
                severity="secondary"
                @click="emit('dismiss')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
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
    border-bottom: 1px solid var(--p-content-border-color);
    background: color-mix(in srgb, var(--p-primary-50) 28%, var(--p-surface-0) 72%);

    &__copy {
        display: grid;
        gap: 0.2rem;

        strong {
            font-size: 0.95rem;
        }

        p {
            margin: 0;
            color: var(--p-text-muted-color);
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
