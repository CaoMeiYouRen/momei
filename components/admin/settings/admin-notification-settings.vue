<template>
    <div class="admin-notifications">
        <Message
            v-if="demoPreview"
            severity="info"
            :closable="false"
            class="mb-4"
        >
            {{ $t('pages.admin.settings.system.demo_preview.description') }}
        </Message>

        <div class="admin-notifications__web-push">
            <div class="admin-notifications__section-header">
                <h4 class="admin-notifications__section-title">
                    {{ $t('pages.admin.settings.system.notifications.web_push.title') }}
                </h4>
                <Tag :severity="webPush.isConfigured ? 'success' : 'warn'">
                    {{ webPush.isConfigured
                        ? $t('pages.admin.settings.system.notifications.web_push.status_ready')
                        : $t('pages.admin.settings.system.notifications.web_push.status_incomplete') }}
                </Tag>
            </div>

            <p class="admin-notifications__description">
                {{ $t('pages.admin.settings.system.notifications.web_push.description') }}
            </p>

            <Message
                :severity="webPush.isConfigured ? 'success' : 'warn'"
                :closable="false"
                class="admin-notifications__status-message"
            >
                <div class="admin-notifications__status-copy">
                    <span>{{ $t('pages.admin.settings.system.notifications.web_push.private_key_status') }}</span>
                    <strong>
                        {{ webPush.privateKeyConfigured
                            ? $t('pages.admin.settings.system.notifications.web_push.private_key_ready')
                            : $t('pages.admin.settings.system.notifications.web_push.private_key_missing') }}
                    </strong>
                </div>
            </Message>

            <div class="admin-notifications__field-grid">
                <div class="admin-notifications__field">
                    <label class="admin-notifications__field-label" for="web-push-subject">
                        {{ $t('pages.admin.settings.system.keys.web_push_vapid_subject') }}
                    </label>
                    <InputText
                        id="web-push-subject"
                        v-model="webPush.subject.value"
                        :disabled="webPush.subject.isLocked"
                        class="w-full"
                    />
                    <small class="admin-notifications__field-hint">
                        {{ webPush.subject.isLocked
                            ? `${$t('pages.admin.settings.system.hints.env_locked')} (${webPush.subject.envKey})`
                            : $t('pages.admin.settings.system.notifications.web_push.subject_hint') }}
                    </small>
                </div>

                <div class="admin-notifications__field">
                    <label class="admin-notifications__field-label" for="web-push-public-key">
                        {{ $t('pages.admin.settings.system.keys.web_push_vapid_public_key') }}
                    </label>
                    <Textarea
                        id="web-push-public-key"
                        v-model="webPush.publicKey.value"
                        :disabled="webPush.publicKey.isLocked"
                        rows="4"
                        class="w-full"
                    />
                    <small class="admin-notifications__field-hint">
                        {{ webPush.publicKey.isLocked
                            ? `${$t('pages.admin.settings.system.hints.env_locked')} (${webPush.publicKey.envKey})`
                            : $t('pages.admin.settings.system.notifications.web_push.public_key_hint') }}
                    </small>
                </div>
            </div>

            <small class="admin-notifications__field-hint">
                {{ $t('pages.admin.settings.system.notifications.web_push.private_key_hint') }}
            </small>
        </div>

        <div class="mb-4">
            <h3 class="font-bold mb-2 text-xl">
                {{ $t('pages.admin.settings.system.notifications.title') }}
            </h3>
            <p class="text-muted-color">
                {{ $t('pages.admin.settings.system.notifications.description') }}
            </p>
        </div>

        <DataTable :value="settings" class="mt-4">
            <Column
                field="event"
                :header="$t('pages.admin.settings.system.notifications.event')"
            >
                <template #body="{data}">
                    <span class="font-medium">{{ $t(`pages.admin.settings.system.notifications.events.${data.event}`) }}</span>
                </template>
            </Column>
            <Column
                field="isEmailEnabled"
                :header="$t('pages.admin.settings.system.notifications.email')"
                class="text-center"
            >
                <template #body="{data}">
                    <ToggleSwitch v-model="data.isEmailEnabled" />
                </template>
            </Column>
            <Column
                field="isBrowserEnabled"
                :header="$t('pages.admin.settings.system.notifications.browser')"
                class="text-center"
            >
                <template #body="{data}">
                    <ToggleSwitch v-model="data.isBrowserEnabled" />
                </template>
            </Column>
        </DataTable>

        <div class="flex justify-content-end mt-4">
            <Button
                :label="$t('common.save')"
                icon="pi pi-check"
                :loading="saving"
                @click="save"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import type { SettingLockReason, SettingSource } from '@/types/setting'

interface AdminNotificationSettingItem {
    event: string
    isEmailEnabled: boolean
    isBrowserEnabled: boolean
}

interface AdminNotificationWebPushField {
    value: string
    source: SettingSource
    isLocked: boolean
    envKey: string | null
    defaultUsed: boolean
    lockReason: SettingLockReason | null
    requiresRestart: boolean
}

interface AdminNotificationResponse {
    data: {
        items: AdminNotificationSettingItem[]
        demoPreview?: boolean
        webPush?: {
            subject: AdminNotificationWebPushField
            publicKey: AdminNotificationWebPushField
            privateKeyConfigured: boolean
            isConfigured: boolean
        }
    }
}

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()

const settings = ref<AdminNotificationSettingItem[]>([])
const loading = ref(false)
const saving = ref(false)
const demoPreview = ref(false)
const webPush = ref<AdminNotificationResponse['data']['webPush']>({
    subject: {
        value: '',
        source: 'default',
        isLocked: false,
        envKey: null,
        defaultUsed: true,
        lockReason: null,
        requiresRestart: false,
    },
    publicKey: {
        value: '',
        source: 'default',
        isLocked: false,
        envKey: null,
        defaultUsed: true,
        lockReason: null,
        requiresRestart: false,
    },
    privateKeyConfigured: false,
    isConfigured: false,
})

function getErrorDetail(error: unknown, fallback: string) {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}

const load = async () => {
    loading.value = true
    try {
        const response = await $appFetch<AdminNotificationResponse>('/api/admin/settings/notifications/admin')
        settings.value = response.data.items || []
        demoPreview.value = Boolean(response.data.demoPreview)
        webPush.value = response.data.webPush || webPush.value
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.error_loading')),
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}

const save = async () => {
    saving.value = true
    try {
        await $appFetch('/api/admin/settings/notifications/admin', {
            method: 'PUT',
            body: {
                items: settings.value,
                webPush: {
                    subject: webPush.value.subject.value,
                    publicKey: webPush.value.publicKey.value,
                },
            },
        })
        await load()
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('common.save_success'),
            life: 3000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.save_failed')),
            life: 5000,
        })
    } finally {
        saving.value = false
    }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.admin-notifications {
    &__web-push {
        margin-bottom: 1.5rem;
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 0.75rem;
        background: var(--p-content-background);
    }

    &__section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.75rem;
    }

    &__section-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    &__description {
        margin: 0 0 1rem;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__status-message {
        margin-bottom: 1rem;
    }

    &__status-copy {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    &__field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin-bottom: 0.75rem;

        @media (width <= 768px) {
            grid-template-columns: 1fr;
        }
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__field-label {
        font-weight: 600;
    }

    &__field-hint {
        color: var(--p-text-muted-color);
        line-height: 1.5;
    }
}
</style>
