<template>
    <div :class="containerClass">
        <AdminPageHeader :title="title" :show-language-switcher="showLanguageSwitcher">
            <template v-if="$slots.actions" #actions>
                <slot name="actions" />
            </template>
        </AdminPageHeader>

        <div :class="['admin-list-shell__card', cardClass]">
            <div v-if="$slots.filters" class="admin-list-shell__filters">
                <slot name="filters" />
            </div>

            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title: string
    containerClass?: string
    cardClass?: string
    showLanguageSwitcher?: boolean
}

withDefaults(defineProps<Props>(), {
    containerClass: 'admin-page-container',
    cardClass: '',
    showLanguageSwitcher: false,
})
</script>

<style lang="scss" scoped>
.admin-list-shell {
    &__card {
        background: var(--surface-card);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgb(0 0 0 / 0.05);
    }

    &__filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
}
</style>
