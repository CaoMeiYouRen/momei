<template>
    <div>
        <AdminListShell
            container-class="admin-subscribers page-container"
            :title="$t('pages.admin.subscribers.title')"
            show-language-switcher
        >
            <template #actions>
                <CaomeiButton
                    variant="secondary"
                    @click="exportSubscribers"
                >
                    <template #icon>
                        <Download :size="16" />
                    </template>
                    {{ $t('pages.admin.subscribers.export') }}
                </CaomeiButton>
            </template>

            <template #filters>
                <CaomeiInput
                    v-model="filters.email"
                    class="admin-subscribers__search-input"
                    :placeholder="$t('pages.admin.subscribers.search_placeholder')"
                    @update:model-value="onFilterChange"
                >
                    <template #prefix>
                        <Search :size="16" />
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
                class="admin-subscribers__table"
                @page="onPage"
            >
                <template #cell-language="{row}">
                    <CaomeiTag tone="neutral">
                        {{ $t(`common.languages.${row.language}`) }}
                    </CaomeiTag>
                </template>

                <template #cell-isActive="{row}">
                    <CaomeiTag
                        :tone="row.isActive ? 'success' : 'neutral'"
                        class="admin-subscribers__status-tag"
                        @click="toggleStatus(row)"
                    >
                        {{ row.isActive ? $t('pages.admin.subscribers.active') : $t('pages.admin.subscribers.inactive') }}
                    </CaomeiTag>
                </template>

                <template #cell-user="{row}">
                    <template v-if="row.user">
                        <div class="flex gap-2 items-center">
                            <!-- 迁移前为 `size="small"`：PrimeVue `Avatar` **无** `small` 档位（有效档位仅
                                 normal / large / xlarge），该值被忽略并回落默认 2rem = 32px。迁移后改用有效档位
                                 `normal`（V2 映射为 caomei `md` = 32px），渲染尺寸与迁移前完全一致。 -->
                            <AppAvatarV2
                                :image="row.user.image"
                                :email="row.user.email"
                                :name="row.user.name"
                                shape="circle"
                                size="normal"
                            />
                            <span>{{ row.user.name || row.user.email }}</span>
                        </div>
                    </template>
                    <CaomeiTag
                        v-else
                        tone="warning"
                    >
                        {{ $t('pages.admin.subscribers.not_associated') }}
                    </CaomeiTag>
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
            :message="$t('pages.admin.subscribers.delete_confirm')"
            @confirm="doDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { Download, Search, Trash } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import type { Subscriber } from '@/types/subscriber'

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
} = useDeleteDialogState<Subscriber>()

const filters = ref({
    email: '',
})

// 列定义与迁移前 PrimeVue 列组件一一对应：邮箱 / 语言 / 状态 / 关联用户 / 加入时间 / 动作。
// `email` 列保留 `sortable`（与既有 3 条已迁移路由口径一致）；迁移前该列在 `lazy` 表上**未接**
// `@sort` 实现（服务端排序未接线），迁移后 caomei 会按当前页做客户端排序——该行为差异沿用既有
// 迁移口径，已在回归记录中登记为跨批观察项。
const columns = computed<DataTableColumn<Subscriber>[]>(() => [
    { key: 'email', header: t('common.email'), sortable: true },
    { key: 'language', header: t('common.language') },
    { key: 'isActive', header: t('pages.admin.subscribers.active_status') },
    { key: 'user', header: t('pages.admin.subscribers.user_associated') },
    { key: 'createdAt', header: t('pages.admin.subscribers.join_date') },
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
} = useAdminList<Subscriber, { email: string }>({
    initialFilters: filters.value,
    initialLimit: 20,
    // caomei `DataTable` 的 `page` / `@page` 为 1 基（PrimeVue 为 0 基），显式声明页码基准。
    pageIndexBase: 1,
    fetchFn: async ({ page, limit, email }) => {
        const response = await $fetch<{
            code: number
            data: {
                items: Subscriber[]
                total: number
            }
        }>('/api/subscribers', {
            query: {
                page,
                pageSize: limit,
                email,
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

const exportSubscribers = () => {
    window.open('/api/subscribers/export', '_blank')
}

const toggleStatus = async (item: Subscriber) => {
    try {
        await $fetch(`/api/subscribers/${item.id}`, {
            method: 'PUT',
            body: { isActive: !item.isActive },
        })
        item.isActive = !item.isActive
    } catch (error) {
        console.error('Failed to toggle status:', error)
    }
}

const doDelete = async () => {
    if (!itemToDelete.value) return
    try {
        await $fetch(`/api/subscribers/${itemToDelete.value.id}`, {
            method: 'DELETE',
        })
        await refresh()
        resetDeleteDialog()
    } catch (error) {
        console.error('Failed to delete subscriber:', error)
    }
}
</script>

<style lang="scss" scoped>
.admin-subscribers {
    // 宽度与迁移前 PrimeVue `InputText` 在 `IconField` 内的固有宽度保持一致
    // （参考态实测边框盒 261×37，此处取 260px，1px 为取整容差），避免迁移顺带改变筛选行几何
    // （caomei 字段默认 `width: 100%`，须显式约束）。
    &__search-input {
        width: 260px;
        max-width: 100%;
    }

    // 迁移前状态 Tag 用内联 `style="cursor: pointer"` 表达可点击，改为 scoped 类。
    &__status-tag {
        cursor: pointer;
    }

    // caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中）；用 0.4.0 起提供的
    // `--caomei-data-table-pagination-justify` token 保持迁移前布局（迁移不改几何）。
    &__table {
        --caomei-data-table-pagination-justify: center;
    }
}
</style>
