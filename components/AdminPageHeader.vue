<template>
    <div class="admin-header">
        <h1 class="admin-header__title">
            {{ title }}
        </h1>
        <div class="admin-header__actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string
}>()
</script>

<style lang="scss" scoped>
// Styles are already in _layout.scss, but we can add scoped ones if needed
</style>
