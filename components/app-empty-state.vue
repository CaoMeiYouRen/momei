<template>
    <div class="app-empty-state">
        <div class="app-empty-state__icon" aria-hidden="true">
            <slot name="icon">
                <Inbox :size="40" />
            </slot>
        </div>
        <p v-if="title" class="app-empty-state__title">
            {{ title }}
        </p>
        <p v-if="description" class="app-empty-state__description">
            {{ description }}
        </p>
        <div v-if="$slots.action" class="app-empty-state__action">
            <slot name="action" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Inbox } from '@lucide/vue'

/**
 * 共享空态（[界面自检清单 U1](../docs/design/ui-review-checklist.md)）：图标 + 说明 + 主操作。
 *
 * - `title` 描述当前对象（各页面传入自己的 i18n key，禁止复用其他模块文案）；
 * - `description` 给出下一步可执行的提示；
 * - `action` 插槽承载主操作；确实无需操作时省略插槽，并在调用处注释理由。
 */
defineProps<{
    title?: string
    description?: string
}>()
</script>

<style lang="scss" scoped>
@use "~/styles/variables" as *;

.app-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xl $spacing-md;
    text-align: center;

    &__icon {
        display: flex;
        color: var(--caomei-color-text-muted);
    }

    &__title {
        margin: 0;
        font-size: $font-size-base;
        font-weight: 600;
        color: var(--caomei-color-text);
    }

    &__description {
        margin: 0;
        max-width: 32rem;
        font-size: $font-size-sm;
        color: var(--caomei-color-text-muted);
    }

    &__action {
        margin-top: $spacing-xs;
    }
}
</style>
