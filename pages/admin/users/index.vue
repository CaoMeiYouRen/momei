<template>
    <div class="container user-management">
        <AdminPageHeader :title="$t('pages.admin.users.title')">
            <template #actions>
                <Button
                    :label="$t('pages.admin.users.refresh')"
                    icon="pi pi-refresh"
                    severity="secondary"
                    @click="fetchUsers"
                />
            </template>
        </AdminPageHeader>

        <div class="user-management__card">
            <UserFilters
                v-model:filters="filters"
                @change="onFilterChange"
            />

            <DataTable
                :value="users"
                :lazy="true"
                :paginator="true"
                :rows="pagination.limit"
                :total-records="pagination.total"
                :loading="loading"
                data-key="id"
                removable-sort
                class="p-datatable-sm user-management__table"
                @page="onPage"
                @sort="onSort"
            >
                <Column
                    field="name"
                    :header="$t('pages.admin.users.user')"
                    sortable
                >
                    <template #body="{data}">
                        <div class="user-info">
                            <Avatar
                                :image="data.image"
                                :label="!data.image ? data.name?.charAt(0) : undefined"
                                shape="circle"
                                size="normal"
                            />
                            <div class="user-info__details">
                                <span class="user-info__name">{{ data.name }}</span>
                                <span class="user-info__email">{{ data.email }}</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column
                    field="role"
                    :header="$t('pages.admin.users.role')"
                    sortable
                >
                    <template #body="{data}">
                        <Badge :value="$t(`pages.admin.users.roles.${data.role}`)" :severity="getRoleSeverity(data.role)" />
                    </template>
                </Column>

                <Column field="banned" :header="$t('pages.admin.users.status')">
                    <template #body="{data}">
                        <Badge
                            :value="data.banned ? $t('pages.admin.users.banned') : $t('pages.admin.users.active')"
                            :severity="data.banned ? 'danger' : 'success'"
                        />
                    </template>
                </Column>

                <Column
                    field="createdAt"
                    :header="$t('pages.admin.users.createdAt')"
                    sortable
                >
                    <template #body="{data}">
                        <div class="user-created-at">
                            <span class="user-created-at__date">{{ d(data.createdAt) }}</span>
                            <small class="user-created-at__relative">{{ relativeTime(data.createdAt) }}</small>
                        </div>
                    </template>
                </Column>

                <Column
                    :header="$t('pages.admin.users.actions')"
                    class="text-left"
                >
                    <template #body="{data}">
                        <div class="user-management__actions">
                            <Button
                                v-tooltip.top="$t('pages.admin.users.editRole')"
                                icon="pi pi-user-edit"
                                severity="info"
                                text
                                rounded
                                @click="openRoleDialog(data)"
                            />
                            <Button
                                v-tooltip.top="data.banned ? $t('pages.admin.users.unbanUser') : $t('pages.admin.users.banUser')"
                                :icon="data.banned ? 'pi pi-unlock' : 'pi pi-lock'"
                                :severity="data.banned ? 'success' : 'warning'"
                                text
                                rounded
                                @click="data.banned ? unbanUser(data) : openBanDialog(data)"
                            />
                            <Button
                                v-tooltip.top="$t('pages.admin.users.viewSessions')"
                                icon="pi pi-desktop"
                                severity="secondary"
                                text
                                rounded
                                @click="openSessionsDrawer(data)"
                            />
                            <Button
                                v-tooltip.top="$t('pages.admin.users.impersonate')"
                                icon="pi pi-user"
                                severity="help"
                                text
                                rounded
                                @click="impersonateUser(data)"
                            />
                            <Button
                                v-tooltip.top="$t('pages.admin.users.deleteUser')"
                                icon="pi pi-trash"
                                severity="danger"
                                text
                                rounded
                                @click="confirmDelete(data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <UserRoleDialog
            v-model:visible="dialogs.role.visible"
            :user="dialogs.role.user"
            @success="fetchUsers"
        />

        <UserBanDialog
            v-model:visible="dialogs.ban.visible"
            :user="dialogs.ban.user"
            @success="fetchUsers"
        />

        <UserSessionsDrawer
            v-model:visible="drawers.sessions.visible"
            :user="drawers.sessions.user"
        />

        <ConfirmDeleteDialog
            v-model:visible="deleteDialog.visible"
            :title="$t('pages.admin.users.deleteUser')"
            :message="deleteDialog.message"
            @confirm="deleteUser"
        />
    </div>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const { d, relativeTime } = useI18nDate()
const toast = useToast()
const confirm = useConfirm()

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
})

const dialogs = reactive({
    role: {
        visible: false,
        user: null as any,
    },
    ban: {
        visible: false,
        user: null as any,
    },
})

const drawers = reactive({
    sessions: {
        visible: false,
        user: null as any,
    },
})

const deleteDialog = reactive({
    visible: false,
    user: null as any,
    message: '',
})

// Actions
const openRoleDialog = (user: any) => {
    dialogs.role.user = user
    dialogs.role.visible = true
}

const openBanDialog = (user: any) => {
    dialogs.ban.user = user
    dialogs.ban.visible = true
}

const unbanUser = async (user: any) => {
    try {
        const { error } = await authClient.admin.unbanUser({
            userId: user.id,
        })
        if (error) throw error
        toast.add({ severity: 'success', summary: t('common.success'), detail: 'User unbanned', life: 3000 })
        fetchUsers()
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Unban failed' })
    }
}

const impersonateUser = async (user: any) => {
    confirm.require({
        message: t('pages.admin.users.confirmImpersonate', { name: user.name }),
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
            } catch (err: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Impersonation failed' })
            }
        },
    })
}

const openSessionsDrawer = (user: any) => {
    drawers.sessions.user = user
    drawers.sessions.visible = true
}

const confirmDelete = (user: any) => {
    deleteDialog.user = user
    deleteDialog.message = t('pages.admin.users.confirmDelete', { name: user.name })
    deleteDialog.visible = true
}

const deleteUser = async () => {
    if (!deleteDialog.user) return
    try {
        const { error } = await authClient.admin.removeUser({
            userId: deleteDialog.user.id,
        })
        if (error) throw error
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'User removed', life: 3000 })
        fetchUsers()
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Delete failed' })
    }
}

// Helpers
const getRoleSeverity = (role: string) => {
    switch (role) {
        case 'admin': return 'danger'
        case 'author': return 'info'
        case 'user': return 'secondary'
        default: return 'contrast'
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

    &__table {
        :deep(.p-datatable-header) {
            background: transparent;
            border: none;
            padding: 0;
        }
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
