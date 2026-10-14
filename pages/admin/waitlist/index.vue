<template>
    <div>
        <AdminListShell
            container-class="admin-waitlist page-container"
            :title="$t('pages.admin.waitlist.title')"
            show-language-switcher
        >
            <template #actions>
                <CaomeiButton
                    variant="secondary"
                    @click="exportWaitlist"
                >
                    <template #icon>
                        <Download :size="16" />
                    </template>
                    {{ $t('pages.admin.waitlist.export') }}
                </CaomeiButton>
            </template>

            <template #filters>
                <CaomeiInput
                    v-model="filters.search"
                    class="admin-waitlist__search-input"
                    :placeholder="$t('pages.admin.waitlist.search_placeholder')"
                    @update:model-value="onFilterChange"
                >
                    <template #prefix>
                        <Search :size="16" />
                    </template>
                </CaomeiInput>

                <CaomeiInput
                    v-model="filters.purpose"
                    class="admin-waitlist__purpose-input"
                    :placeholder="$t('pages.admin.waitlist.purpose_filter')"
                    @update:model-value="onFilterChange"
                >
                    <template #prefix>
                        <Tag :size="16" />
                    </template>
                </CaomeiInput>
            </template>

            <!-- 懒加载服务端分页：`page` 为 1 基受控值，`@page` 载荷亦为 1 基（由共享
                 composable 的 `pageIndexBase: 1` 归一），与迁移前 PrimeVue 0 基行为对等。 -->
            <CaomeiDataTable
                :data="items"
                :columns="columns"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                :page="pagination.page"
                paginator
                class="admin-waitlist__table"
                @page="onPage"
            >
                <template #cell-purpose="{row}">
                    <CaomeiTag tone="primary">
                        {{ row.purpose || 'benefit' }}
                    </CaomeiTag>
                </template>

                <template #cell-locale="{row}">
                    <CaomeiTag v-if="row.locale" tone="neutral">
                        {{ row.locale }}
                    </CaomeiTag>
                    <span v-else>—</span>
                </template>

                <template #cell-createdAt="{row}">
                    {{ formatDate(row.createdAt) }}
                </template>

                <template #cell-actions="{row}">
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="danger"
                        :label="$t('common.delete')"
                        @click="openDeleteDialog(row)"
                    >
                        <template #icon>
                            <Trash :size="16" />
                        </template>
                    </CaomeiButton>
                </template>

                <template #empty>
                    <AdminTableEmptyState :label="$t('pages.posts.empty')" />
                </template>
            </CaomeiDataTable>
        </AdminListShell>

        <!-- 浮层显式豁免（迁移方案 §5.5）：ConfirmDeleteDialog 属延后批次的浮层，维持 PrimeVue 至第六十九阶段。 -->
        <ConfirmDeleteDialog
            v-model:visible="deleteVisible"
            :message="$t('pages.admin.waitlist.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { Download, Search, Tag, Trash } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import type { AdminListFilterValue } from '@/composables/use-admin-list'

interface WaitlistEntry {
    id: number
    name: string
    email: string
    purpose: string | null
    locale: string | null
    createdAt: string
}

interface WaitlistFilters {
    search: string
    purpose: string
    [key: string]: AdminListFilterValue
}

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const { t } = useI18n()
const { formatDate } = useI18nDate()
const {
    visible: deleteVisible,
    item: itemToDelete,
    openDeleteDialog,
    resetDeleteDialog,
} = useDeleteDialogState<WaitlistEntry>()

const filters = ref<WaitlistFilters>({
    search: '',
    purpose: '',
})

// 列定义与迁移前 PrimeVue 列组件一一对应：姓名 / 邮箱 / 目的 / 语言 / 加入时间 / 动作。
const columns = computed<DataTableColumn<WaitlistEntry>[]>(() => [
    { key: 'name', header: t('pages.admin.waitlist.columns.name') },
    { key: 'email', header: t('pages.admin.waitlist.columns.email') },
    { key: 'purpose', header: t('pages.admin.waitlist.columns.purpose') },
    { key: 'locale', header: t('pages.admin.waitlist.columns.locale') },
    { key: 'createdAt', header: t('pages.admin.waitlist.columns.createdAt') },
    // 迁移前动作列以 `class="text-right"` 右对齐，迁移后用列级 `align` 等价还原（不改几何）。
    { key: 'actions', header: t('common.actions'), align: 'right' },
])

const {
    items,
    loading,
    pagination,
    onPage,
    onFilterChange: applyFilters,
    refresh,
} = useAdminList<WaitlistEntry, WaitlistFilters>({
    initialFilters: filters.value,
    initialLimit: 20,
    // caomei `DataTable` 的 `page` / `@page` 为 1 基（PrimeVue 为 0 基），显式声明页码基准。
    pageIndexBase: 1,
    fetchFn: async ({ page, limit, search, purpose }) => {
        const response = await $fetch<{
            code: number
            data: {
                items: WaitlistEntry[]
                total: number
            }
        }>('/api/admin/waitlist', {
            query: {
                page,
                pageSize: limit,
                search,
                purpose,
            },
        })

        return {
            data: response.code === 200 ? response.data.items : [],
            total: response.code === 200 ? response.data.total : 0,
        }
    },
})

const onFilterChange = useDebounceFn(() => {
    applyFilters()
}, 500)

const exportWaitlist = () => {
    const params = new URLSearchParams()
    if (filters.value.purpose) {
        params.set('purpose', filters.value.purpose)
    }
    const url = `/api/admin/waitlist/export${params.toString() ? `?${params.toString()}` : ''}`
    window.open(url, '_blank')
}

const doDelete = async () => {
    if (!itemToDelete.value) return
    try {
        await $fetch(`/api/admin/waitlist/${itemToDelete.value.id}`, {
            method: 'DELETE',
        })
        await refresh()
        resetDeleteDialog()
    } catch (error) {
        console.error('Failed to delete waitlist entry:', error)
    }
}
</script>

<style lang="scss" scoped>
.admin-waitlist {
    // 宽度与迁移前 PrimeVue `InputText` 在 `IconField` 内的固有宽度（实测 260px）保持一致，
    // 避免迁移顺带改变筛选行几何（caomei 字段默认 `width: 100%`，须显式约束）。
    // 迁移前 `&__purpose-input { min-width: 160px }` 对 260px 固有宽度为恒真值，属等价还原。
    &__search-input,
    &__purpose-input {
        width: 260px;
        max-width: 100%;
    }

    // caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中）；用 0.4.0 起提供的
    // `--caomei-data-table-pagination-justify` token 保持迁移前布局（迁移不改几何）。
    &__table {
        --caomei-data-table-pagination-justify: center;
    }
}
</style>
