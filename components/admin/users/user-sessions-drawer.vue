<template>
    <Drawer
        :visible="visible"
        position="right"
        class="user-management__sessions-drawer"
        @update:visible="$emit('update:visible', $event)"
    >
        <template #header>
            <div class="sessions-header">
                <span class="sessions-header__title">{{ $t('pages.admin.users.sessions') }}</span>
                <Badge
                    v-if="user"
                    :value="user.name"
                    severity="info"
                />
            </div>
        </template>

        <div v-if="loading" class="sessions-loading">
            <ProgressSpinner />
        </div>

        <div v-else class="sessions-list">
            <div
                v-for="session in sessions"
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
                    <span>{{ $t('pages.admin.users.lastActive') }}: {{ d(session.updatedAt) }}</span>
                    <span>{{ $t('pages.admin.users.expiresAt') }}: {{ d(session.expiresAt) }}</span>
                </div>
            </div>

            <div v-if="sessions.length === 0" class="sessions-empty">
                {{ $t('pages.admin.users.noActiveSessions') }}
            </div>

            <Button
                v-if="sessions.length > 0"
                :label="$t('pages.admin.users.revokeAll')"
                severity="danger"
                icon="pi pi-power-off"
                class="sessions-revoke-all"
                :loading="revokingAll"
                @click="revokeAllUserSessions"
            />
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps<{
    visible: boolean
    user: any
}>()

const emit = defineEmits(['update:visible'])

const { t } = useI18n()
const { d } = useI18nDate()
const toast = useToast()
const confirm = useConfirm()

const sessions = ref<any[]>([])
const loading = ref(false)
const revokingAll = ref(false)

const fetchSessions = async () => {
    if (!props.user) return
    loading.value = true
    try {
        const { data, error } = await authClient.admin.listUserSessions({
            userId: props.user.id,
        })
        if (error) throw error
        sessions.value = data?.sessions || []
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to list sessions' })
    } finally {
        loading.value = false
    }
}

watch(() => props.visible, (val) => {
    if (val) fetchSessions()
})

const revokeSession = async (token: string) => {
    try {
        const { error } = await authClient.admin.revokeUserSession({
            sessionToken: token,
        })
        if (error) throw error
        toast.add({ severity: 'info', summary: 'Success', detail: 'Session revoked', life: 3000 })
        await fetchSessions()
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Revocation failed' })
    }
}

const revokeAllUserSessions = async () => {
    if (!props.user) return
    confirm.require({
        message: t('pages.admin.users.confirmRevokeAll'),
        header: t('common.danger'),
        icon: 'pi pi-exclamation-circle',
        acceptLabel: t('common.confirm'),
        rejectLabel: t('common.cancel'),
        accept: async () => {
            revokingAll.value = true
            try {
                const { error } = await authClient.admin.revokeUserSessions({
                    userId: props.user.id,
                })
                if (error) throw error
                toast.add({ severity: 'success', summary: 'Success', detail: 'All sessions revoked', life: 3000 })
                sessions.value = []
                emit('update:visible', false)
            } catch (err: any) {
                toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Revocation failed' })
            } finally {
                revokingAll.value = false
            }
        },
    })
}

const parseUserAgent = (ua: string) => {
    if (!ua) return 'Unknown'
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
</script>

<style lang="scss" scoped>
.user-management__sessions-drawer {
    width: 100%;

    @media (width >= 768px) {
        width: 400px;
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
