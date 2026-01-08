<template>
    <div class="container user-management">
        <h1 class="user-management__title">
            {{ $t('pages.admin.users.title') }}
        </h1>

        <div class="user-management__card">
            <Toolbar class="user-management__toolbar">
                <template #start>
                    <div class="user-management__filters">
                        <IconField icon-position="left">
                            <InputIcon class="pi pi-search" />
                            <InputText
                                v-model="filters.searchValue"
                                :placeholder="$t('pages.admin.users.searchPlaceholder')"
                                class="user-management__search"
                                @input="onFilterChange"
                            />
                        </IconField>
                        <Select
                            v-model="filters.role"
                            :options="roleOptions"
                            option-label="label"
                            option-value="value"
                            :placeholder="$t('pages.admin.users.filterRole')"
                            class="user-management__filter-dropdown"
                            @change="onFilterChange"
                        />
                        <Select
                            v-model="filters.status"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            :placeholder="$t('pages.admin.users.filterStatus')"
                            class="user-management__filter-dropdown"
                            @change="onFilterChange"
                        />
                    </div>
                </template>
                <template #end>
                    <Button
                        :label="$t('pages.admin.users.refresh')"
                        icon="pi pi-refresh"
                        severity="secondary"
                        @click="fetchUsers"
                    />
                </template>
            </Toolbar>

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
                        <Badge :value="data.role" :severity="getRoleSeverity(data.role)" />
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
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>

                <Column
                    :header="$t('pages.admin.users.actions')"
                    align-header="right"
                    class="text-right"
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

        <!-- Role Change Dialog -->
        <Dialog
            v-model:visible="dialogs.role.visible"
            :header="$t('pages.admin.users.editRole')"
            modal
            class="user-management__dialog"
        >
            <div class="user-management__dialog-content">
                <label class="user-management__dialog-label">{{ $t('pages.admin.users.selectRole') }}</label>
                <Select
                    v-model="dialogs.role.selectedRole"
                    :options="roleValues"
                    class="w-full"
                />
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    text
                    @click="dialogs.role.visible = false"
                />
                <Button :label="$t('common.save')" @click="updateRole" />
            </template>
        </Dialog>

        <!-- Ban Dialog -->
        <Dialog
            v-model:visible="dialogs.ban.visible"
            :header="$t('pages.admin.users.banUser')"
            modal
            class="user-management__dialog"
        >
            <div class="user-management__dialog-content user-management__dialog-content--gap">
                <div>
                    <label class="user-management__dialog-label">{{ $t('pages.admin.users.banReason') }}</label>
                    <InputText
                        v-model="dialogs.ban.reason"
                        class="w-full"
                        :placeholder="$t('pages.admin.users.banReasonPlaceholder')"
                    />
                </div>
                <div>
                    <label class="user-management__dialog-label">{{ $t('pages.admin.users.banExpiry') }} ({{ $t('common.optional') }})</label>
                    <Select
                        v-model="dialogs.ban.expiry"
                        :options="expiryOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    severity="secondary"
                    text
                    @click="dialogs.ban.visible = false"
                />
                <Button
                    :label="$t('pages.admin.users.ban')"
                    severity="danger"
                    @click="banUser"
                />
            </template>
        </Dialog>

        <!-- Sessions Drawer -->
        <Drawer
            v-model:visible="drawers.sessions.visible"
            position="right"
            class="user-management__sessions-drawer"
        >
            <template #header>
                <div class="sessions-header">
                    <span class="sessions-header__title">{{ $t('pages.admin.users.sessions') }}</span>
                    <Badge
                        v-if="drawers.sessions.user"
                        :value="drawers.sessions.user.name"
                        severity="info"
                    />
                </div>
            </template>
            <div v-if="drawers.sessions.loading" class="sessions-loading">
                <ProgressSpinner />
            </div>
            <div v-else class="sessions-list">
                <div
                    v-for="session in drawers.sessions.items"
                    :key="session.token"
                    class="session-card"
                >
                    <div class="session-card__header">
                        <div class="session-card__info">
                            <span class="session-card__device">
                                <i :class="getDeviceIcon(session.userAgent)" />
                                {{ parseUserAgent(session.userAgent) }}
                            </span>
                            <span class="session-card__meta">{{ session.ipAddress }}</span>
                        </div>
                        <Button
                            icon="pi pi-sign-out"
                            severity="danger"
                            size="small"
                            rounded
                            text
                            @click="revokeSession(session.token)"
                        />
                    </div>
                    <div class="session-card__footer">
                        <span>{{ $t('pages.admin.users.lastActive') }}: {{ formatDate(session.updatedAt) }}</span>
                        <span>{{ $t('pages.admin.users.expiresAt') }}: {{ formatDate(session.expiresAt) }}</span>
                    </div>
                </div>
                <div v-if="drawers.sessions.items.length === 0" class="sessions-empty">
                    {{ $t('pages.admin.users.noActiveSessions') }}
                </div>
                <Button
                    v-if="drawers.sessions.items.length > 0"
                    :label="$t('pages.admin.users.revokeAll')"
                    severity="danger"
                    icon="pi pi-power-off"
                    class="sessions-revoke-all"
                    @click="revokeAllUserSessions"
                />
            </div>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { authClient } from '@/lib/auth-client'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()

// State
const users = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({
    total: 0,
    limit: 20,
    offset: 0,
})

const filters = reactive({
    searchValue: '',
    role: null,
    status: null,
})

const sort = reactive({
    field: 'createdAt',
    order: 'desc',
})

const dialogs = reactive({
    role: {
        visible: false,
        user: null as any,
        selectedRole: '',
    },
    ban: {
        visible: false,
        user: null as any,
        reason: '',
        expiry: null as number | null,
    },
})

const drawers = reactive({
    sessions: {
        visible: false,
        user: null as any,
        loading: false,
        items: [] as any[],
    },
})

// Options
const roleOptions = [
    { label: t('pages.admin.users.roles.all'), value: null },
    { label: 'Admin', value: 'admin' },
    { label: 'Author', value: 'author' },
    { label: 'User', value: 'user' },
]

const roleValues = ['admin', 'author', 'user']

const statusOptions = [
    { label: t('pages.admin.users.statusOptions.all'), value: null },
    { label: t('pages.admin.users.statusOptions.active'), value: 'active' },
    { label: t('pages.admin.users.statusOptions.banned'), value: 'banned' },
]

const expiryOptions = [
    { label: t('pages.admin.users.expiry.never'), value: null },
    { label: t('pages.admin.users.expiry.oneDay'), value: 60 * 60 * 24 },
    { label: t('pages.admin.users.expiry.oneWeek'), value: 60 * 60 * 24 * 7 },
    { label: t('pages.admin.users.expiry.oneMonth'), value: 60 * 60 * 24 * 30 },
]

// Methods
const fetchUsers = async () => {
    loading.value = true
    try {
        const { data, error } = await authClient.admin.listUsers({
            query: {
                limit: pagination.limit,
                offset: pagination.offset,
                searchValue: filters.searchValue || undefined,
                searchField: 'name', // or 'email'? better-auth usually supports searchField
                filterField: filters.role ? 'role' : (filters.status ? 'banned' : undefined),
                filterValue: filters.role || (filters.status === 'banned' ? true : (filters.status === 'active' ? false : undefined)),
                sortBy: sort.field,
                sortDirection: sort.order as any,
            },
        })

        if (error) throw error

        if (data) {
            users.value = data.users
            pagination.total = data.total
        }
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to fetch users' })
    } finally {
        loading.value = false
    }
}

const onFilterChange = () => {
    pagination.offset = 0
    fetchUsers()
}

const onPage = (event: any) => {
    pagination.offset = event.first
    pagination.limit = event.rows
    fetchUsers()
}

const onSort = (event: any) => {
    sort.field = event.sortField
    sort.order = event.sortOrder === 1 ? 'asc' : 'desc'
    fetchUsers()
}

// Actions
const openRoleDialog = (user: any) => {
    dialogs.role.user = user
    dialogs.role.selectedRole = user.role
    dialogs.role.visible = true
}

const updateRole = async () => {
    if (!dialogs.role.user) return
    try {
        const { error } = await authClient.admin.setRole({
            userId: dialogs.role.user.id,
            role: dialogs.role.selectedRole as any,
        })
        if (error) throw error
        toast.add({ severity: 'success', summary: 'Success', detail: 'Role updated successfully', life: 3000 })
        dialogs.role.visible = false
        fetchUsers()
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Update failed' })
    }
}

const openBanDialog = (user: any) => {
    dialogs.ban.user = user
    dialogs.ban.reason = ''
    dialogs.ban.expiry = null
    dialogs.ban.visible = true
}

const banUser = async () => {
    if (!dialogs.ban.user) return
    try {
        const { error } = await authClient.admin.banUser({
            userId: dialogs.ban.user.id,
            banReason: dialogs.ban.reason,
            banExpiresIn: dialogs.ban.expiry || undefined,
        })
        if (error) throw error
        toast.add({ severity: 'warn', summary: 'Success', detail: 'User banned', life: 3000 })
        dialogs.ban.visible = false
        fetchUsers()
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Ban failed' })
    }
}

const unbanUser = async (user: any) => {
    try {
        const { error } = await authClient.admin.unbanUser({
            userId: user.id,
        })
        if (error) throw error
        toast.add({ severity: 'success', summary: 'Success', detail: 'User unbanned', life: 3000 })
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
                // Redirect to home or refresh
                window.location.href = '/'
            } catch (err: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Impersonation failed' })
            }
        },
    })
}

const openSessionsDrawer = async (user: any) => {
    drawers.sessions.user = user
    drawers.sessions.visible = true
    drawers.sessions.loading = true
    try {
        const { data, error } = await authClient.admin.listUserSessions({
            userId: user.id,
        })
        if (error) throw error
        drawers.sessions.items = data?.sessions || []
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to list sessions' })
    } finally {
        drawers.sessions.loading = false
    }
}

const revokeSession = async (token: string) => {
    try {
        const { error } = await authClient.admin.revokeUserSession({
            sessionToken: token,
        })
        if (error) throw error
        toast.add({ severity: 'info', summary: 'Success', detail: 'Session revoked', life: 3000 })
        if (drawers.sessions.user) {
            openSessionsDrawer(drawers.sessions.user) // Refresh
        }
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Revocation failed' })
    }
}

const revokeAllUserSessions = async () => {
    if (!drawers.sessions.user) return
    confirm.require({
        message: t('pages.admin.users.confirmRevokeAll'),
        header: t('common.danger'),
        icon: 'pi pi-exclamation-circle',
        acceptLabel: t('common.confirm'),
        rejectLabel: t('common.cancel'),
        accept: async () => {
            try {
                const { error } = await authClient.admin.revokeUserSessions({
                    userId: drawers.sessions.user.id,
                })
                if (error) throw error
                toast.add({ severity: 'success', summary: 'Success', detail: 'All sessions revoked', life: 3000 })
                drawers.sessions.items = []
                drawers.sessions.visible = false
            } catch (err: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Revocation failed' })
            }
        },
    })
}

const confirmDelete = (user: any) => {
    confirm.require({
        message: t('pages.admin.users.confirmDelete', { name: user.name }),
        header: t('common.danger'),
        icon: 'pi pi-info-circle',
        acceptClass: 'p-button-danger',
        acceptLabel: t('common.delete'),
        rejectLabel: t('common.cancel'),
        accept: async () => {
            try {
                const { error } = await authClient.admin.removeUser({
                    userId: user.id,
                })
                if (error) throw error
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'User removed', life: 3000 })
                fetchUsers()
            } catch (err: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Delete failed' })
            }
        },
    })
}

// Helpers
const formatDate = (date: any) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
}

const getRoleSeverity = (role: string) => {
    switch (role) {
        case 'admin': return 'danger'
        case 'author': return 'info'
        case 'user': return 'secondary'
        default: return 'contrast'
    }
}

const parseUserAgent = (ua: string) => {
    if (!ua) return 'Unknown'
    // Simple UA parsing logic or use a library
    if (ua.includes('iPhone')) return 'iPhone'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('Macintosh')) return 'Mac'
    if (ua.includes('Windows')) return 'Windows'
    return ua.split(' ')[0] || 'Browser'
}

const getDeviceIcon = (ua: string) => {
    if (ua?.includes('iPhone') || ua?.includes('Android')) return 'pi pi-mobile'
    return 'pi pi-desktop'
}

onMounted(() => {
    fetchUsers()
})
</script>

<style lang="scss" scoped>
.user-management {
    padding-top: 1rem;
    padding-bottom: 1rem;

    &__title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: var(--p-text-color);
    }

    &__card {
        background-color: var(--p-surface-card);
        border: 1px solid var(--p-surface-border);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    &__toolbar {
        background-color: transparent !important;
        border: none !important;
        padding: 0 !important;
        margin-bottom: 1rem;
    }

    &__filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
    }

    &__search {
        width: 100%;

        @media (width >= 768px) {
            width: 16rem;
        }
    }

    &__filter-dropdown {
        width: 100%;

        @media (width >= 768px) {
            width: 10rem;
        }
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
        justify-content: flex-end;
    }

    &__dialog {
        width: 100%;
        max-width: 24rem;
    }

    &__dialog-content {
        padding-top: 1rem;
        padding-bottom: 1rem;

        &--gap {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
    }

    &__dialog-label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }

    &__sessions-drawer {
        width: 100%;

        @media (width >= 768px) {
            width: 400px;
        }
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

.sessions-header {
    display: flex;
    gap: 0.5rem;
    align-items: center;

    &__title {
        font-weight: 700;
        font-size: 1.25rem;
    }
}

.sessions-loading {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
}

.sessions-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
}

.sessions-empty {
    padding: 2rem 0;
    text-align: center;
    color: var(--p-text-muted-color);
}

.sessions-revoke-all {
    margin-top: 1rem;
    width: 100%;
}

.session-card {
    background-color: var(--p-surface-50);
    border: 1px solid var(--p-surface-border);
    padding: 1rem;
    border-radius: 0.5rem;

    :global(.dark) & {
        background-color: var(--p-surface-900);
    }

    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    &__info {
        display: flex;
        flex-direction: column;
    }

    &__device {
        display: flex;
        font-weight: 500;
        gap: 0.5rem;
        align-items: center;
    }

    &__meta {
        color: var(--p-text-muted-color);
        font-size: 0.75rem;
    }

    &__footer {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.75rem;
    }
}
</style>
