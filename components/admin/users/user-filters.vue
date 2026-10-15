<template>
    <!-- `Toolbar` 不在 B2 在册族（迁移方案 §5.5）：浮层 / 表单类组件留待第六十九阶段，此处保持 PrimeVue。 -->
    <Toolbar class="user-filters-toolbar">
        <template #start>
            <div class="user-filters">
                <CaomeiInput
                    v-model="internalFilters.searchValue"
                    class="user-filters__search"
                    :placeholder="$t('pages.admin.users.search_placeholder')"
                >
                    <template #prefix>
                        <Search :size="16" />
                    </template>
                </CaomeiInput>
                <!-- caomei `Select` 的 `class` 经 `$attrs` 落在**触发器**，而宽度 / `max-width` 钩子在
                     **字段外层**（`.caomei-select__field`，默认 `--caomei-select-max-width: 20rem` 且为块级），
                     且自定义属性不向上继承——故必须用包装元素约束宽度并放开上限（上游反馈 §1.1）。
                     直接写在 `<CaomeiSelect>` 上会静默无效，两个选择器将竖向堆叠并撑高工具条。 -->
                <div class="user-filters__dropdown">
                    <CaomeiSelect
                        v-model="roleModelValue"
                        :options="roleOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.users.filter_role')"
                    />
                </div>
                <div class="user-filters__dropdown">
                    <CaomeiSelect
                        v-model="statusModelValue"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.users.filter_status')"
                    />
                </div>
            </div>
        </template>
    </Toolbar>
</template>

<script setup lang="ts">
import { Search } from '@lucide/vue'

const props = defineProps<{
    filters: {
        searchValue: string
        role: string | null
        status: string | null
    }
}>()

const emit = defineEmits(['update:filters', 'change'])
const { t } = useI18n()

// 「全部角色 / 全部状态」在 caomei `Select` 中不能以 `null` 作为选项值
// （`optionValue` 解析结果非 string / number 的选项不渲染，上游反馈 §1.2 判定为设计如此），
// 故以哨兵值承载，并与筛选模型（`null` = 全部）在边界互相转换——对父组件与 API 的契约不变。
const ALL_SENTINEL = '__all__'

// Use a proxy object for internal state to avoid mutating props
const internalFilters = ref({
    searchValue: props.filters.searchValue,
    role: props.filters.role,
    status: props.filters.status,
})

const roleModelValue = computed({
    get: () => internalFilters.value.role ?? ALL_SENTINEL,
    set: (value: string) => {
        internalFilters.value.role = value === ALL_SENTINEL ? null : value
    },
})

const statusModelValue = computed({
    get: () => internalFilters.value.status ?? ALL_SENTINEL,
    set: (value: string) => {
        internalFilters.value.status = value === ALL_SENTINEL ? null : value
    },
})

// Sync props to internal state
watch(() => props.filters, (newFilters) => {
    internalFilters.value.searchValue = newFilters.searchValue
    internalFilters.value.role = newFilters.role
    internalFilters.value.status = newFilters.status
}, { deep: true })

// Sync internal state to parent and trigger change
watch(internalFilters, (newVal) => {
    emit('update:filters', { ...newVal })
    emit('change') // In a real scenario, you might want to debounce this
}, { deep: true })

const roleOptions = computed(() => [
    { label: t('pages.admin.users.roles.all'), value: ALL_SENTINEL },
    { label: t('pages.admin.users.roles.admin'), value: 'admin' },
    { label: t('pages.admin.users.roles.author'), value: 'author' },
    { label: t('pages.admin.users.roles.user'), value: 'user' },
])

const statusOptions = computed(() => [
    { label: t('pages.admin.users.status_options.all'), value: ALL_SENTINEL },
    { label: t('pages.admin.users.status_options.active'), value: 'active' },
    { label: t('pages.admin.users.status_options.banned'), value: 'banned' },
])
</script>

<style lang="scss" scoped>
.user-filters-toolbar {
    &.p-toolbar {
        background-color: transparent;
        border: none;
        padding: 0;
        margin-bottom: 1rem;
    }
}

.user-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;

    // 宽度按迁移前 PrimeVue 的固有约束保留（caomei 字段默认 `width: 100%`，选择器家族另有
    // `20rem` 上限 token；10rem / 16rem 均在其内，无需额外覆盖）。
    &__search {
        width: 100%;

        @media (width >= 768px) {
            width: 16rem;
        }
    }

    &__dropdown {
        // 包装元素承载宽度与上限：caomei `Select` 的 `class` 只落触发器，宽度钩子在字段外层，
        // 且字段外层默认带 `--caomei-select-max-width: 20rem`（= 320px）且为块级（上游反馈 §1.1）。
        --caomei-select-max-width: 100%;

        width: 100%;

        @media (width >= 768px) {
            width: 10rem;
        }
    }
}
</style>
