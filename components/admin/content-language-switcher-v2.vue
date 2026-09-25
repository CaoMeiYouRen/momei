<template>
    <div class="content-language-switcher">
        <CaomeiSelect
            v-model="model"
            :options="options"
            option-label="label"
            option-value="value"
            class="language-select"
            size="sm"
        />
    </div>
</template>

<script setup lang="ts">
import { useAdminI18n } from '@/composables/use-admin-i18n'

/**
 * 过渡用「内容语言切换器（caomei-ui 版）」。
 *
 * 背景：`AdminContentLanguageSwitcher` 是跨路由共享组件，其消费者包括尚未迁移的 admin 页；
 * 若直接改写它，会让未迁移路由出现「页内 PrimeVue + 头部 caomei」混用。故并存期新增本过渡组件，
 * 由 `AdminPageHeader` 依据 `lib/ui-library.ts` 的路由 → 组件来源单一事实源选择；待全站迁完后再统一回收。
 *
 * 与 PrimeVue 版的差异（均为有意，见迁移方案 §6.2）：
 * - caomei `Select` 不提供触发器 `#value` 插槽，故不再渲染语言旗帜（该 `flag-*` 类在本仓库无样式定义，
 *   迁移前即为不可见空元素，视觉无差异）；
 * - `optionValue` 解析结果必须为 `string` / `number`，而「全部语言」选项值为 `null`，故映射为哨兵字符串，
 *   并在与共享状态 `contentLanguage` 同步时还原为 `null`（保持既有 `null = 全部语言` 的语义不变）。
 */
const ALL_LANGUAGES_SENTINEL = '__all__'

const { contentLanguage, availableLocales } = useAdminI18n()

const model = computed({
    get: () => contentLanguage.value ?? ALL_LANGUAGES_SENTINEL,
    set: (value: string) => {
        contentLanguage.value = value === ALL_LANGUAGES_SENTINEL ? null : value
    },
})

const options = computed(() => availableLocales.value.map((option) => ({
    ...option,
    value: option.value ?? ALL_LANGUAGES_SENTINEL,
})))
</script>

<style lang="scss" scoped>
.content-language-switcher {
    display: inline-block;
    min-width: 150px;
}

// `class` 透传到 caomei Select 的触发器（`.caomei-select`），宽度需落在字段外层 `.caomei-select__field`
// （见 caomei-ui 主题与样式设计 §4.1），故以 `:deep()` 命中字段容器。
:deep(.caomei-select__field) {
    width: 100%;
}
</style>
