<template>
    <div class="container user-management">
        <AdminPageHeader :title="$t('pages.admin.users.title')">
            <template #actions>
                <CaomeiButton
                    variant="secondary"
                    @click="fetchUsers"
                >
                    <template #icon>
                        <RefreshCw :size="16" />
                    </template>
                    {{ $t('common.refresh') }}
                </CaomeiButton>
            </template>
        </AdminPageHeader>

        <div class="user-management__card">
            <AdminUsersUserFilters
                v-model:filters="filters"
                @change="onFilterChange"
            />

            <!-- 懒加载服务端分页 + **服务端排序**（迁移前 PrimeVue 为 `lazy` + `@sort` 接线）：
                 ① `page` / `@page` 为 1 基受控值（由共享 composable 的 `pageIndexBase: 1` 归一）；
                 ② 排序**不绑定受控 prop**——迁移前同样未绑定 `:sort-field` / `:sort-order`
                 （`initialSort` 只作用于请求参数，表格初始不显示排序指示），故此处保持同一形态：
                 指示器由 caomei 内部排序态驱动，`@sort` 只负责触发服务端重排，指示器初始态与迁移前一致；
                 ③ 两套库的 `@sort` 载荷差异已在共享 composable 内归一（PrimeVue 数值 `1|-1|0` /
                 caomei 字符串 `'asc'|'desc'|''`）。 -->
            <CaomeiDataTable
                :data="users"
                :columns="columns"
                :loading="loading"
                lazy
                paginator
                row-key="id"
                :rows="pagination.limit"
                :total-records="pagination.total"
                :page="pagination.page"
                class="user-management__table"
                @page="onPage"
                @sort="onSort"
            >
                <template #cell-name="{row}">
                    <div class="user-info">
                        <AppAvatarV2
                            :image="row.image"
                            :name="row.name"
                            :email="row.email"
                            shape="circle"
                            size="normal"
                        />
                        <div class="user-info__details">
                            <span class="user-info__name">{{ row.name }}</span>
                            <span class="user-info__email">{{ row.email }}</span>
                        </div>
                    </div>
                </template>

                <template #cell-role="{row}">
                    <CaomeiBadge :value="$t(`pages.admin.users.roles.${row.role}`)" :tone="getRoleTone(row.role)" />
                </template>

                <template #cell-banned="{row}">
                    <CaomeiBadge
                        :value="row.banned ? $t('pages.admin.users.banned') : $t('pages.admin.users.active')"
                        :tone="row.banned ? 'danger' : 'success'"
                    />
                </template>

                <template #cell-createdAt="{row}">
                    <div class="user-created-at" data-visual-mask>
                        <span class="user-created-at__date">{{ d(row.createdAt) }}</span>
                        <small class="user-created-at__relative">{{ relativeTime(row.createdAt) }}</small>
                    </div>
                </template>

                <template #cell-actions="{row}">
                    <div class="user-management__actions">
                        <CaomeiButton
                            v-tooltip.top="$t('pages.admin.users.edit_role')"
                            icon-only
                            variant="ghost"
                            rounded
                            tone="primary"
                            :label="$t('pages.admin.users.edit_role')"
                            @click="openRoleDialog(row)"
                        >
                            <template #icon>
                                <UserCog :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-tooltip.top="row.banned ? $t('pages.admin.users.unban_user') : $t('pages.admin.users.ban_user')"
                            icon-only
                            variant="ghost"
                            rounded
                            :tone="row.banned ? 'success' : 'warning'"
                            :label="row.banned ? $t('pages.admin.users.unban_user') : $t('pages.admin.users.ban_user')"
                            @click="row.banned ? unbanUser(row) : openBanDialog(row)"
                        >
                            <template #icon>
                                <component :is="row.banned ? Unlock : Lock" :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-tooltip.top="$t('pages.admin.users.view_sessions')"
                            icon-only
                            variant="ghost"
                            rounded
                            tone="neutral"
                            :label="$t('pages.admin.users.view_sessions')"
                            @click="openSessionsDrawer(row)"
                        >
                            <template #icon>
                                <Monitor :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-tooltip.top="$t('pages.admin.users.impersonate')"
                            icon-only
                            variant="ghost"
                            rounded
                            tone="primary"
                            :label="$t('pages.admin.users.impersonate')"
                            @click="impersonateUser(row)"
                        >
                            <template #icon>
                                <UserRound :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-tooltip.top="$t('pages.admin.users.delete_user')"
                            icon-only
                            variant="ghost"
                            rounded
                            tone="danger"
                            :label="$t('pages.admin.users.delete_user')"
                            @click="openUserDeleteDialog(row)"
                        >
                            <template #icon>
                                <Trash2 :size="16" />
                            </template>
                        </CaomeiButton>
                    </div>
                </template>
            </CaomeiDataTable>
        </div>

        <AdminUsersUserRoleDialog
            v-model:visible="dialogs.role.visible"
            :user="dialogs.role.user"
            @success="fetchUsers"
        />

        <AdminUsersUserBanDialog
            v-model:visible="dialogs.ban.visible"
            :user="dialogs.ban.user"
            @success="fetchUsers"
        />

        <AdminUsersUserSessionsDrawer
            v-model:visible="drawers.sessions.visible"
            :user="drawers.sessions.user"
        />

        <!-- 浮层显式豁免（迁移方案 §5.5）：`ConfirmDeleteDialog` 与 `useConfirm` 维持 PrimeVue 至第六十九阶段。 -->
        <ConfirmDeleteDialog
            v-model:visible="deleteDialog.visible"
            :title="$t('pages.admin.users.delete_user')"
            :message="deleteDialog.message"
            @confirm="deleteUser"
        />
    </div>
</template>

<script setup lang="ts">
import { Lock, Monitor, RefreshCw, Trash2, Unlock, UserCog, UserRound } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { useConfirm } from 'primevue/useconfirm'

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const { t } = useI18n()
const { d, relativeTime } = useI18nDate()
const confirm = useConfirm()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

// 列定义与迁移前 PrimeVue 列组件一一对应：用户 / 角色 / 状态 / 创建时间 / 动作。
// 迁移前 `field` 列（name / role / banned / createdAt）沿用字段名作 key；动作列无 `field`，
// 按插槽语义命名 `actions`。迁移前动作列的 `class="text-left"` 是 PrimeVue 默认对齐，无需显式声明。
const columns = computed<DataTableColumn<any>[]>(() => [
    { key: 'name', header: t('pages.admin.users.user'), sortable: true },
    { key: 'role', header: t('pages.admin.users.role'), sortable: true },
    { key: 'banned', header: t('pages.admin.users.status') },
    { key: 'createdAt', header: t('pages.admin.users.created_at'), sortable: true },
    { key: 'actions', header: t('common.actions') },
])

// Admin List Management
const {
    items: users,
    loading,
    pagination,
    filters,
    onPage,
    onSort,
    onFilterChange,
    refresh: fetchUsers,
} = useAdminList<any, { searchValue: string, role: string | null, status: 'active' | 'banned' | null }>({
    fetchFn: async (params) => {
        const { data, error } = await authClient.admin.listUsers({
            query: {
                limit: params.limit,
                offset: params.offset,
                searchValue: params.searchValue || undefined,
                searchField: 'name',
                filterField: params.role ? 'role' : (params.status ? 'banned' : undefined),
                filterValue: params.role || (params.status === 'banned' ? true : (params.status === 'active' ? false : undefined)),
                sortBy: params.sortBy,
                sortDirection: params.sortDirection as any,
            },
        })
        if (error) throw error
        return {
            data: data?.users || [],
            total: data?.total || 0,
        }
    },
    initialFilters: {
        searchValue: '',
        role: null,
        status: null,
    },
    initialSort: {
        field: 'createdAt',
        order: 'desc',
    },
    // caomei `DataTable` 的 `page` / `@page` 为 1 基（PrimeVue 为 0 基），显式声明页码基准。
    pageIndexBase: 1,
})

const dialogs = ref({
    role: {
        visible: false,
        user: null as any,
    },
    ban: {
        visible: false,
        user: null as any,
    },
})

const drawers = ref({
    sessions: {
        visible: false,
        user: null as any,
    },
})

const deleteDialog = ref({
    visible: false,
    user: null as any,
    message: '',
})

// Actions
const openRoleDialog = (user: any) => {
    dialogs.value.role.user = user
    dialogs.value.role.visible = true
}

const openBanDialog = (user: any) => {
    dialogs.value.ban.user = user
    dialogs.value.ban.visible = true
}

const unbanUser = async (user: any) => {
    try {
        const { error } = await authClient.admin.unbanUser({
            userId: user.id,
        })
        if (error) throw error
        showSuccessToast('pages.admin.users.feedback.unban_user_success')
        fetchUsers()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.users.feedback.unban_user_failed' })
    }
}

const impersonateUser = async (user: any) => {
    confirm.require({
        message: t('pages.admin.users.confirm_impersonate', { name: user.name }),
        header: t('common.confirmation'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t('common.confirm'),
        rejectLabel: t('common.cancel'),
        accept: async () => {
            try {
                const { error } = await authClient.admin.impersonateUser({
                    userId: user.id,
                })
                if (error) throw error
                window.location.href = '/'
            } catch (error) {
                showErrorToast(error, { fallbackKey: 'pages.admin.users.feedback.impersonate_user_failed' })
            }
        },
    })
}

const openSessionsDrawer = (user: any) => {
    drawers.value.sessions.user = user
    drawers.value.sessions.visible = true
}

const openUserDeleteDialog = (user: any) => {
    deleteDialog.value.user = user
    deleteDialog.value.message = t('pages.admin.users.confirm_delete', { name: user.name })
    deleteDialog.value.visible = true
}

const deleteUser = async () => {
    if (!deleteDialog.value.user) return
    try {
        const { error } = await authClient.admin.removeUser({
            userId: deleteDialog.value.user.id,
        })
        if (error) throw error
        showSuccessToast('pages.admin.users.feedback.delete_user_success')
        fetchUsers()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.users.feedback.delete_user_failed' })
    }
}

// Helpers
// 迁移前 `getRoleSeverity` 的 `severity` → caomei `tone`（迁移方案 §6.2）：
// `danger→danger`、`info→primary`、`secondary→neutral`、`contrast→neutral`（后两者为有损近似）。
// 动作列的 `help`（模拟登录，PrimeVue 专有档位，§6.2 未列）同按 `info` 口径落到 `primary`——
// 与「修改角色」按钮同色调，二者以图标 + 可访问名区分（迁移前后一致）。
const getRoleTone = (role: string) => {
    switch (role) {
        case 'admin': return 'danger'
        case 'author': return 'primary'
        case 'user': return 'neutral'
        default: return 'neutral'
    }
}

onMounted(() => {
    fetchUsers()
})
</script>

<style lang="scss" scoped>
.user-management {
    padding-top: 1rem;
    padding-bottom: 1rem;

    &__card {
        background-color: var(--p-surface-card);
        border: 1px solid var(--p-surface-border);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    &__actions {
        display: flex;
        gap: 0.25rem;
        justify-content: flex-start;
    }
}

.user-info {
    display: flex;
    gap: 0.75rem;
    align-items: center;

    &__details {
        display: flex;
        flex-direction: column;
    }

    &__name {
        font-weight: 500;
        color: var(--p-text-color);
    }

    &__email {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
    }
}

.user-created-at {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__relative {
        color: var(--p-text-muted-color);
        font-size: 0.75rem;
    }
}
</style>
