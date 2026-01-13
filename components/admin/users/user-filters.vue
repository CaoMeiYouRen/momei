<template>
    <Toolbar class="user-filters-toolbar">
        <template #start>
            <div class="user-filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="internalFilters.searchValue"
                        :placeholder="$t('pages.admin.users.searchPlaceholder')"
                        class="user-filters__search"
                    />
                </IconField>
                <Select
                    v-model="internalFilters.role"
                    :options="roleOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.users.filterRole')"
                    class="user-filters__dropdown"
                />
                <Select
                    v-model="internalFilters.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="$t('pages.admin.users.filterStatus')"
                    class="user-filters__dropdown"
                />
            </div>
        </template>
    </Toolbar>
</template>

<script setup lang="ts">
const props = defineProps<{
    filters: {
        searchValue: string
        role: string | null
        status: string | null
    }
}>()

const emit = defineEmits(['update:filters', 'change'])
const { t } = useI18n()

// Use a proxy object for internal state to avoid mutating props
const internalFilters = reactive({
    searchValue: props.filters.searchValue,
    role: props.filters.role,
    status: props.filters.status,
})

// Sync props to internal state
watch(() => props.filters, (newFilters) => {
    internalFilters.searchValue = newFilters.searchValue
    internalFilters.role = newFilters.role
    internalFilters.status = newFilters.status
}, { deep: true })

// Sync internal state to parent and trigger change
watch(internalFilters, (newVal) => {
    emit('update:filters', { ...newVal })
    emit('change') // In a real scenario, you might want to debounce this
}, { deep: true })

const roleOptions = computed(() => [
    { label: t('pages.admin.users.roles.all'), value: null },
    { label: t('pages.admin.users.roles.admin'), value: 'admin' },
    { label: t('pages.admin.users.roles.author'), value: 'author' },
    { label: t('pages.admin.users.roles.user'), value: 'user' },
])

const statusOptions = computed(() => [
    { label: t('pages.admin.users.statusOptions.all'), value: null },
    { label: t('pages.admin.users.statusOptions.active'), value: 'active' },
    { label: t('pages.admin.users.statusOptions.banned'), value: 'banned' },
])
</script>

<style lang="scss" scoped>
.user-filters-toolbar {
    background-color: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin-bottom: 1rem;
}

.user-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;

    &__search {
        width: 100%;

        @media (width >= 768px) {
            width: 16rem;
        }
    }

    &__dropdown {
        width: 100%;

        @media (width >= 768px) {
            width: 10rem;
        }
    }
}
</style>
