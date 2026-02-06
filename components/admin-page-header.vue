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
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  gap: $spacing-md;
  flex-wrap: wrap;

  &__main {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }
}

@include respond-to("sm") {
}

@media (width <= 640px) {
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
