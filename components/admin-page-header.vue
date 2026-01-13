<template>
    <div class="admin-header">
        <div class="admin-header__main">
            <h1 class="admin-header__title">
                {{ title }}
            </h1>
            <AdminContentLanguageSwitcher v-if="showLanguageSwitcher" />
        </div>
        <div class="admin-header__actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
import AdminContentLanguageSwitcher from './admin/content-language-switcher.vue'

withDefaults(defineProps<{
    title: string
    showLanguageSwitcher?: boolean
}>(), {
    showLanguageSwitcher: false,
})
</script>

<style lang="scss" scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;

  &__main {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
  }
}

// Mobile responsive
@media (max-width: 640px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;

    &__main {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>
