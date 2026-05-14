<template>
    <div class="admin-table-empty-state">
        {{ label }}
    </div>
</template>

<script setup lang="ts">
defineProps<{
    label: string
}>()
</script>

<style lang="scss" scoped>
.admin-table-empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
}
</style>
