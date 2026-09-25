<template>
    <div class="admin-header">
        <div class="admin-header__main">
            <h1 class="admin-header__title">
                {{ title }}
            </h1>
            <component :is="languageSwitcherComponent" v-if="showLanguageSwitcher" />
        </div>
        <div class="admin-header__actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { resolveUiLibraryForRoutePath } from '@/lib/ui-library'
import AdminContentLanguageSwitcher from './admin/content-language-switcher.vue'
import AdminContentLanguageSwitcherV2 from './admin/content-language-switcher-v2.vue'

withDefaults(defineProps<{
    title: string
    showLanguageSwitcher?: boolean
}>(), {
    showLanguageSwitcher: false,
})

// 头部是跨路由共享壳：按路由 → 组件来源单一事实源（`lib/ui-library.ts`）选择切换器实现，
// 使已迁移路由使用 caomei-ui 版、未迁移路由继续使用 PrimeVue 版，避免共享壳造成路由内混用。
const route = useRoute()
const languageSwitcherComponent = computed(() => (
    resolveUiLibraryForRoutePath(route.path) === 'caomei-ui'
        ? AdminContentLanguageSwitcherV2
        : AdminContentLanguageSwitcher
))
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
